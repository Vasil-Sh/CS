import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════
// DataContext pure logic — fingerprint + dedup + backfill
// ═══════════════════════════════════════════

/** Builds the same fingerprint as DataContext's backfill dedup */
function buildFingerprint(bet: { match?: string; amount?: number | string; profit?: number | string; date?: string }) {
  return `${String(bet.match || "").trim()}|${parseFloat(String(bet.amount || 0)).toFixed(2)}|${parseFloat(String(bet.profit || 0)).toFixed(2)}|${String(bet.date || "").substring(0, 10)}`;
}

/** Extract pure dedup logic: filter local-only bets, dedupe by ID or fingerprint */
function dedupeLocalBets(
  localBets: Array<{ id?: string; match?: string; amount?: number; profit?: number; date?: string }>,
  serverBets: Array<{ id: number | string; match?: string; amount?: number; profit?: number; date?: string }>,
): { cleanedBets: typeof localBets; toBackfill: typeof localBets } {
  const serverIds = new Set(serverBets.map((b) => String(b.id)));
  const serverFingerprints = new Set(serverBets.map(buildFingerprint));

  const cleanedBets: typeof localBets = [];
  const toBackfill: typeof localBets = [];

  for (const lb of localBets) {
    const betId = String(lb.id || "");
    if (!betId.startsWith("local_")) {
      cleanedBets.push(lb);
      continue;
    }
    if (serverIds.has(betId)) continue; // already on server — remove
    const fp = buildFingerprint(lb);
    if (serverFingerprints.has(fp)) continue; // already on server — remove
    toBackfill.push(lb);
    cleanedBets.push(lb);
  }

  return { cleanedBets, toBackfill };
}

// ── Fingerprint ──

describe("buildFingerprint (DataContext dedup)", () => {
  it("generates same fingerprint for identical bets", () => {
    const fp1 = buildFingerprint({ match: "NaVi vs FaZe", amount: 100, profit: 50, date: "2026-07-21" });
    const fp2 = buildFingerprint({ match: "NaVi vs FaZe", amount: 100, profit: 50, date: "2026-07-21" });
    expect(fp1).toBe(fp2);
  });

  it("generates different fingerprint for different amounts", () => {
    const fp1 = buildFingerprint({ match: "A vs B", amount: 100, profit: 0, date: "2026-07-21" });
    const fp2 = buildFingerprint({ match: "A vs B", amount: 200, profit: 0, date: "2026-07-21" });
    expect(fp1).not.toBe(fp2);
  });

  it("generates different fingerprint for different profit", () => {
    const fp1 = buildFingerprint({ match: "A vs B", amount: 100, profit: 50, date: "2026-07-21" });
    const fp2 = buildFingerprint({ match: "A vs B", amount: 100, profit: -50, date: "2026-07-21" });
    expect(fp1).not.toBe(fp2);
  });

  it("generates different fingerprint for different date substring", () => {
    const fp1 = buildFingerprint({ match: "A vs B", amount: 100, profit: 0, date: "2026-07-21T10:00:00" });
    const fp2 = buildFingerprint({ match: "A vs B", amount: 100, profit: 0, date: "2026-07-22T10:00:00" });
    expect(fp1).not.toBe(fp2);
  });

  it("handles missing fields", () => {
    const fp = buildFingerprint({});
    expect(fp).toBe("|0.00|0.00|");
  });

  it("amount formatted to 2 decimal places", () => {
    const fp = buildFingerprint({ amount: 100.5 });
    expect(fp).toContain("100.50");
  });

  it("trim whitespace in match name", () => {
    const fp1 = buildFingerprint({ match: " A vs B " });
    const fp2 = buildFingerprint({ match: "A vs B" });
    expect(fp1).toBe(fp2);
  });
});

// ── Deduplication ──

describe("dedupeLocalBets (backfill dedup)", () => {
  it("passes through non-local bets unchanged", () => {
    const local = [
      { id: "abc-123", match: "A vs B", amount: 100, profit: 50, date: "2026-07-21" },
      { id: "def-456", match: "C vs D", amount: 200, profit: -30, date: "2026-07-20" },
    ];
    const server: Array<{ id: number; match: string; amount: number; profit: number; date: string }> = [];
    const { cleanedBets, toBackfill } = dedupeLocalBets(local, server);
    expect(cleanedBets).toEqual(local);
    expect(toBackfill).toHaveLength(0); // non-local, no backfill
  });

  it("removes local_xxx bets already on server by ID", () => {
    const local = [
      { id: "local_001", match: "A vs B", amount: 100, profit: 50, date: "2026-07-21" },
      { id: "local_002", match: "C vs D", amount: 200, profit: -30, date: "2026-07-20" },
    ];
    const server = [{ id: "local_001", match: "A vs B", amount: 100, profit: 50, date: "2026-07-21" }];
    const { cleanedBets, toBackfill } = dedupeLocalBets(local, server);
    expect(cleanedBets).toHaveLength(1);
    expect(cleanedBets[0].id).toBe("local_002");
    expect(toBackfill).toHaveLength(1);
  });

  it("removes local bets already on server by fingerprint", () => {
    const local = [
      { id: "local_003", match: "A vs B", amount: 100, profit: 50, date: "2026-07-21" },
    ];
    const server = [{ id: 999, match: "A vs B", amount: 100, profit: 50, date: "2026-07-21" }];
    const { cleanedBets, toBackfill } = dedupeLocalBets(local, server);
    expect(cleanedBets).toHaveLength(0);
    expect(toBackfill).toHaveLength(0);
  });

  it("keeps unique local bets for backfill", () => {
    const local = [
      { id: "local_004", match: "Unique Match", amount: 500, profit: 200, date: "2026-07-21" },
    ];
    const server: Array<{ id: number }> = [];
    const { cleanedBets, toBackfill } = dedupeLocalBets(local, server);
    expect(cleanedBets).toHaveLength(1);
    expect(toBackfill).toHaveLength(1);
    expect(toBackfill[0].id).toBe("local_004");
  });

  it("mixed: removes duplicates, keeps unique", () => {
    const local = [
      { id: "local_dup_id", match: "Match 1", amount: 100, profit: 0, date: "2026-07-21" },
      { id: "local_dup_fp", match: "Match 2", amount: 200, profit: 0, date: "2026-07-20" },
      { id: "local_unique", match: "Match 3", amount: 300, profit: 50, date: "2026-07-19" },
      { id: "normal-id", match: "Match 4", amount: 400, profit: -10, date: "2026-07-18" },
    ];
    const server = [
      { id: "local_dup_id" },
      { id: 123, match: "Match 2", amount: 200, profit: 0, date: "2026-07-20" },
    ];
    const { cleanedBets, toBackfill } = dedupeLocalBets(local, server);
    // local_dup_id removed (by ID), local_dup_fp removed (by fingerprint),
    // local_unique kept, normal-id kept
    expect(cleanedBets).toHaveLength(2);
    expect(cleanedBets.map((b) => b.id)).toEqual(["local_unique", "normal-id"]);
    expect(toBackfill).toHaveLength(1);
    expect(toBackfill[0].id).toBe("local_unique");
  });

  it("empty local bets → empty result", () => {
    const { cleanedBets, toBackfill } = dedupeLocalBets([], []);
    expect(cleanedBets).toEqual([]);
    expect(toBackfill).toEqual([]);
  });

  it("all local bets already on server → all removed", () => {
    const local = [
      { id: "local_a", match: "A vs B", amount: 100, profit: 0, date: "2026-07-21" },
      { id: "local_b", match: "C vs D", amount: 200, profit: 0, date: "2026-07-20" },
    ];
    const server = [
      { id: "local_a" },
      { id: "local_b" },
    ];
    const { cleanedBets, toBackfill } = dedupeLocalBets(local, server);
    expect(cleanedBets).toHaveLength(0);
    expect(toBackfill).toHaveLength(0);
  });
});

// ── Concurrency worker pattern ──

describe("backfill worker pattern (concurrency)", () => {
  it("processes all items with concurrency limit", async () => {
    const items = Array.from({ length: 10 }, (_, i) => i);
    const processed: number[] = [];

    const worker = async () => {
      while (items.length > 0) {
        const item = items.shift()!;
        processed.push(item);
        await Promise.resolve(); // yield
      }
    };

    await Promise.all([worker(), worker(), worker()]);
    expect(processed).toHaveLength(10);
    // All items processed exactly once
    expect(new Set(processed).size).toBe(10);
  });

  it("handles empty queue", async () => {
    const processed: number[] = [];
    const worker = async () => {
      while (processed.length > 0) {
        processed.pop();
      }
    };
    await Promise.all([worker(), worker()]);
    expect(processed).toHaveLength(0);
  });
});
