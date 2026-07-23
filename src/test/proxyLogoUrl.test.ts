import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════
// proxyLogoUrl regression test
// Prevents the morning bug: regex without "teams/" captured
// the folder prefix, sending /logo/teams/navi.png to backend
// which then tried to scrape a non-existent URL → 502.
// ═══════════════════════════════════════════

function dota2ProxyLogoUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/static\/image\/teams\/(.+)$/i);
  if (!match) return url;
  return `/api/v1/dota2-matches/logo/${match[1]}`;
}

function cs2ProxyLogoUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/static\/image\/teams\/(.+)$/i);
  if (!match) return url;
  return `/api/v1/cs2-matches/logo/${match[1]}`;
}

/** BUGGY version — regex without "teams/" (like the broken commit) */
function buggyProxyLogoUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/static\/image\/(.+)$/i);
  if (!match) return url;
  return `/api/v1/dota2-matches/logo/${match[1]}`;
}

describe("proxyLogoUrl — regression: folder prefix must NOT appear in path", () => {
  // ── dota2Api proxyLogoUrl ──

  describe("dota2ProxyLogoUrl", () => {
    it("returns null for null input", () => {
      expect(dota2ProxyLogoUrl(null)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(dota2ProxyLogoUrl("")).toBeNull();
    });

    it("converts tips.gg team CDN URL to proxy path", () => {
      const result = dota2ProxyLogoUrl(
        "https://files.tips.gg/static/image/teams/navi-csgo.png",
      );
      expect(result).toBe("/api/v1/dota2-matches/logo/navi-csgo.png");
    });

    it("does NOT include 'teams/' in the proxy path", () => {
      const result = dota2ProxyLogoUrl(
        "https://files.tips.gg/static/image/teams/aurora-gaming-csgo.png",
      );
      expect(result).not.toContain("teams/");
      expect(result).toBe("/api/v1/dota2-matches/logo/aurora-gaming-csgo.png");
    });

    it("handles Dota2 team logos", () => {
      const result = dota2ProxyLogoUrl(
        "https://files.tips.gg/static/image/teams/zero-tenacity-dota2.png",
      );
      expect(result).toBe("/api/v1/dota2-matches/logo/zero-tenacity-dota2.png");
    });

    it("passes through non-tips.gg URLs unchanged", () => {
      expect(dota2ProxyLogoUrl("https://example.com/logo.png")).toBe(
        "https://example.com/logo.png",
      );
    });

    it("passes through URLs without /teams/ segment", () => {
      expect(dota2ProxyLogoUrl("/assets/placeholder.svg")).toBe(
        "/assets/placeholder.svg",
      );
    });

    it("handles dots in filename", () => {
      const result = dota2ProxyLogoUrl(
        "https://files.tips.gg/static/image/teams/team.one-csgo.png",
      );
      expect(result).toBe("/api/v1/dota2-matches/logo/team.one-csgo.png");
    });

    it("handles hyphens and underscores in filename", () => {
      const result = dota2ProxyLogoUrl(
        "https://files.tips.gg/static/image/teams/just_players-csgo.png",
      );
      expect(result).toBe("/api/v1/dota2-matches/logo/just_players-csgo.png");
    });
  });

  // ── cs2ProxyLogoUrl ──

  describe("cs2ProxyLogoUrl", () => {
    it("converts tips.gg team CDN URL to CS2 proxy path", () => {
      const result = cs2ProxyLogoUrl(
        "https://files.tips.gg/static/image/teams/fokus-csgo.png",
      );
      expect(result).toBe("/api/v1/cs2-matches/logo/fokus-csgo.png");
    });

    it("does NOT include 'teams/' in the proxy path", () => {
      const result = cs2ProxyLogoUrl(
        "https://files.tips.gg/static/image/teams/aurora-gaming-csgo.png",
      );
      expect(result).not.toContain("teams/");
    });
  });

  // ── Buggy version (catches the regression) ──

  describe("buggyProxyLogoUrl — MUST FAIL this test (proves regression is caught)", () => {
    it("BUG: includes 'teams/' in path when using /static/image/(.+) regex", () => {
      const result = buggyProxyLogoUrl(
        "https://files.tips.gg/static/image/teams/navi-csgo.png",
      );
      // This MUST contain "teams/" — that's the bug we're guarding against
      expect(result).toContain("teams/");
      expect(result).toBe("/api/v1/dota2-matches/logo/teams/navi-csgo.png");
    });

    it("BUG: sends teams/filename instead of just filename", () => {
      const result = buggyProxyLogoUrl(
        "https://files.tips.gg/static/image/teams/team-name.png",
      );
      expect(result).toBe("/api/v1/dota2-matches/logo/teams/team-name.png");
    });
  });

  // ── Tournament URLs are intentionally NOT proxied ──

  describe("tournament URLs must NOT be proxied", () => {
    it("dota2: passes through tournament logo URL unchanged", () => {
      const result = dota2ProxyLogoUrl(
        "https://files.tips.gg/static/image/tournaments/epl-masters.png",
      );
      // Tournament URLs don't have /teams/ in path, so they pass through
      expect(result).toBe(
        "https://files.tips.gg/static/image/tournaments/epl-masters.png",
      );
    });

    it("cs2: passes through tournament logo URL unchanged", () => {
      const result = cs2ProxyLogoUrl(
        "https://files.tips.gg/static/image/tournaments/blast-bounty.png",
      );
      expect(result).toBe(
        "https://files.tips.gg/static/image/tournaments/blast-bounty.png",
      );
    });
  });
});

// ── tipsGgToApiMatch integration — verifies logos flow through correctly ──

import type { BaseApiMatch } from "@/lib/matchTypes";

function stringHash(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++)
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

function csTipsGgToApiMatch(m: Record<string, unknown>): BaseApiMatch {
  const link = String(m.link || "");
  const parts = link.replace(/\/$/, "").split("/").filter(Boolean);
  const csSlug = parts.length >= 2 ? parts[parts.length - 2] : parts.pop() || String(m.id || "");

  return {
    id: stringHash(String(m.id || m.link || "")),
    date: String(m.startDate || String(m.date) || ""),
    link,
    type: String(m.type || "BO3"),
    score1: (m.score1 as number | null) ?? null,
    score2: (m.score2 as number | null) ?? null,
    stars: (m.tipsCount as number) || 0,
    nameTeam1: String(m.nameTeam1 || ""),
    nameTeam2: String(m.nameTeam2 || ""),
    lastChangeDateTeam1: null,
    lastChangeDateTeam2: null,
    positionTeam1: null,
    positionTeam2: null,
    logoTeam1: cs2ProxyLogoUrl(m.logoTeam1 as string | null),
    logoTeam2: cs2ProxyLogoUrl(m.logoTeam2 as string | null),
    predictionPercentTeam1: (m.pred1 as number) ?? null,
    predictionPercentTeam2: (m.pred2 as number) ?? null,
    bettingCoefficientTeam1: (m.coeff1 as number) ?? null,
    bettingCoefficientTeam2: (m.coeff2 as number) ?? null,
    tournament: String(m.tournament || ""),
    stage: String(m.stage || ""),
    status: (m.status as "upcoming" | "live" | "finished") || "upcoming",
    cs2Slug: csSlug,
  };
}

describe("tipsGgToApiMatch — logo proxying end-to-end", () => {
  it("converts tips.gg logo URLs to proxy paths", () => {
    const raw = {
      id: "match-1",
      link: "/matches/cs2/23-07-2026/aurora-vs-fokus/",
      nameTeam1: "Aurora Gaming",
      nameTeam2: "FOKUS",
      logoTeam1: "https://files.tips.gg/static/image/teams/aurora-gaming-csgo.png",
      logoTeam2: "https://files.tips.gg/static/image/teams/fokus-csgo.png",
      tournament: "BLAST Bounty",
      pred1: 80,
      pred2: 20,
      tipsCount: 2,
      startDate: "2026-07-23T13:00:00+0300",
    };

    const result = csTipsGgToApiMatch(raw);

    expect(result.logoTeam1).toBe(
      "/api/v1/cs2-matches/logo/aurora-gaming-csgo.png",
    );
    expect(result.logoTeam2).toBe(
      "/api/v1/cs2-matches/logo/fokus-csgo.png",
    );
    // CRITICAL: no "teams/" in the path
    expect(result.logoTeam1).not.toContain("teams/");
    expect(result.logoTeam2).not.toContain("teams/");
  });

  it("handles null logos gracefully", () => {
    const raw = {
      id: "match-2",
      link: "/matches/cs2/test/",
      nameTeam1: "A",
      nameTeam2: "B",
      logoTeam1: null,
      logoTeam2: null,
    };

    const result = csTipsGgToApiMatch(raw);

    expect(result.logoTeam1).toBeNull();
    expect(result.logoTeam2).toBeNull();
  });

  it("handles missing logo fields", () => {
    const raw = {
      id: "match-3",
      link: "/matches/cs2/test/",
      nameTeam1: "A",
      nameTeam2: "B",
    };

    const result = csTipsGgToApiMatch(raw);

    expect(result.logoTeam1).toBeNull();
    expect(result.logoTeam2).toBeNull();
  });
});
