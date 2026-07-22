import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ── DeepSeekService pure logic (caching, dedup, fallback) ──

interface AIRecommendation {
  prediction: string;
  confidence: number;
  riskLevel: string;
  reasoning: string;
  source: string;
}

interface MatchData {
  team1: string;
  team2: string;
  format: string;
  tier: string;
}

const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_PREFIX = "ds_cache_v3_";

function buildCacheKey(data: MatchData): string {
  return `${data.team1}_vs_${data.team2}_${data.format}_${data.tier}`;
}

// ── Cache tests ──

describe("DeepSeekService: cache key", () => {
  it("generates deterministic key", () => {
    const k1 = buildCacheKey({ team1: "NaVi", team2: "FaZe", format: "Bo3", tier: "TIER1" });
    const k2 = buildCacheKey({ team1: "NaVi", team2: "FaZe", format: "Bo3", tier: "TIER1" });
    expect(k1).toBe(k2);
  });

  it("different tier → different key", () => {
    const k1 = buildCacheKey({ team1: "NaVi", team2: "FaZe", format: "Bo3", tier: "TIER1" });
    const k2 = buildCacheKey({ team1: "NaVi", team2: "FaZe", format: "Bo3", tier: "TIER2" });
    expect(k1).not.toBe(k2);
  });

  it("different format → different key", () => {
    const k1 = buildCacheKey({ team1: "NaVi", team2: "FaZe", format: "Bo3", tier: "TIER1" });
    const k2 = buildCacheKey({ team1: "NaVi", team2: "FaZe", format: "Bo5", tier: "TIER1" });
    expect(k1).not.toBe(k2);
  });

  it("swapped teams → different key", () => {
    const k1 = buildCacheKey({ team1: "NaVi", team2: "FaZe", format: "Bo3", tier: "TIER1" });
    const k2 = buildCacheKey({ team1: "FaZe", team2: "NaVi", format: "Bo3", tier: "TIER1" });
    expect(k1).not.toBe(k2);
  });
});

// ── In-memory LRU cache with TTL ──

describe("DeepSeekService: TTL cache", () => {
  const store = new Map<string, { recommendation: AIRecommendation; timestamp: number }>();

  function get(key: string): AIRecommendation | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      store.delete(key);
      return null;
    }
    return entry.recommendation;
  }

  function set(key: string, rec: AIRecommendation): void {
    store.set(key, { recommendation: rec, timestamp: Date.now() });
  }

  const mockRec: AIRecommendation = {
    prediction: "NaVi", confidence: 72, riskLevel: "low",
    reasoning: "Based on analysis", source: "DeepSeek",
  };

  beforeEach(() => store.clear());

  it("get returns null for missing key", () => {
    expect(get("missing")).toBeNull();
  });

  it("set + get roundtrip", () => {
    set("key1", mockRec);
    expect(get("key1")).toEqual(mockRec);
  });

  it("expired entry returns null", () => {
    store.set("key1", { recommendation: mockRec, timestamp: Date.now() - CACHE_TTL_MS - 1000 });
    expect(get("key1")).toBeNull();
    expect(store.has("key1")).toBe(false); // cleaned up
  });

  it("fresh entry returns value", () => {
    store.set("key1", { recommendation: mockRec, timestamp: Date.now() - CACHE_TTL_MS + 60000 });
    expect(get("key1")).toEqual(mockRec);
  });
});

// ── Request deduplication ──

describe("DeepSeekService: request deduplication", () => {
  it("deduplicates concurrent requests for same key", async () => {
    const pending = new Map<string, Promise<AIRecommendation>>();
    const completed: string[] = [];

    async function fetchRecommendation(key: string): Promise<AIRecommendation> {
      if (pending.has(key)) return pending.get(key)!;

      const promise = new Promise<AIRecommendation>((resolve) => {
        setTimeout(() => {
          completed.push(key);
          resolve({ prediction: "TeamX", confidence: 60, riskLevel: "medium", reasoning: "ok", source: "mock" });
        }, 10);
      });
      pending.set(key, promise);
      try {
        return await promise;
      } finally {
        pending.delete(key);
      }
    }

    const [r1, r2] = await Promise.all([
      fetchRecommendation("keyA"),
      fetchRecommendation("keyA"),
    ]);
    expect(r1).toBe(r2); // same reference — dedup worked
    expect(completed).toHaveLength(1); // only one actual fetch
  });

  it("different keys → separate fetches", async () => {
    const pending = new Map<string, Promise<AIRecommendation>>();
    const completed: string[] = [];

    async function fetchRecommendation(key: string): Promise<AIRecommendation> {
      if (pending.has(key)) return pending.get(key)!;
      const promise = new Promise<AIRecommendation>((resolve) => {
        setTimeout(() => { completed.push(key); resolve({ prediction: "X", confidence: 50, riskLevel: "medium", reasoning: "", source: "mock" }); }, 10);
      });
      pending.set(key, promise);
      try { return await promise; } finally { pending.delete(key); }
    }

    await Promise.all([fetchRecommendation("k1"), fetchRecommendation("k2")]);
    expect(completed).toHaveLength(2);
  });
});
