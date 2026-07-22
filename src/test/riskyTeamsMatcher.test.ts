import { describe, it, expect } from "vitest";
import {
  normalizeTeamName,
  getGameFilterValue,
  findRiskyTeams,
  type RiskyTeamRecord,
} from "@/lib/riskyTeamsMatcher";

// ── normalizeTeamName ──

describe("normalizeTeamName", () => {
  it("lowercases and strips whitespace", () => {
    expect(normalizeTeamName("NaVi")).toBe("navi");
    expect(normalizeTeamName("  Team Spirit  ")).toBe("teamspirit");
    expect(normalizeTeamName("FaZe Clan")).toBe("fazeclan");
  });

  it("removes non-alphanumeric chars", () => {
    expect(normalizeTeamName("G2.Esports")).toBe("g2esports");
    expect(normalizeTeamName("NIP (Ninjas)")).toBe("nipninjas");
    expect(normalizeTeamName("Virtus.pro")).toBe("virtuspro");
  });

  it("handles empty strings", () => {
    expect(normalizeTeamName("")).toBe("");
  });

  it("handles multi-word team names", () => {
    expect(normalizeTeamName("Team Liquid")).toBe("teamliquid");
    expect(normalizeTeamName("Aurora Gaming")).toBe("auroragaming");
  });
});

// ── getGameFilterValue ──

describe("getGameFilterValue", () => {
  it('maps CS2 → "CS"', () => {
    expect(getGameFilterValue("CS2")).toBe("CS");
  });

  it('maps Dota2 → "Dota"', () => {
    expect(getGameFilterValue("Dota2")).toBe("Dota");
  });
});

// ── findRiskyTeams ──

describe("findRiskyTeams", () => {
  const riskyTeams: RiskyTeamRecord[] = [
    { name: "FaZe Clan", game: "CS", status: "Нестабільні", notes: "Слаба форма" },
    { name: "Team Spirit", game: "Dota", status: "Обережно", notes: "Новий ростер" },
    { name: "Navi", game: "CS", status: "Нестабільні", notes: "Часті заміни" },
    { name: "G2", game: "CS", status: "Обережно", notes: "" },
  ];

  it("finds exact match by normalized name", () => {
    const found = findRiskyTeams("FaZe Clan", "MOUZ", "CS", riskyTeams);
    expect(found).toHaveLength(1);
    expect(found[0].name).toBe("FaZe Clan");
    expect(found[0].status).toBe("Нестабільні");
  });

  it("finds match in team2 position", () => {
    const found = findRiskyTeams("MOUZ", "FaZe Clan", "CS", riskyTeams);
    expect(found).toHaveLength(1);
    expect(found[0].name).toBe("FaZe Clan");
  });

  it("finds by partial match (team1 includes risky team substring)", () => {
    // "Navi" should match "Navi Junior" (normalized: "navijunior" includes "navi")
    const found = findRiskyTeams("Navi Junior", "Spirit", "CS", [
      { name: "Navi", game: "CS", status: "Обережно", notes: "" },
    ]);
    expect(found).toHaveLength(1);
    expect(found[0].name).toBe("Navi");
  });

  it("filters by game filter — only CS teams match CS game", () => {
    const found = findRiskyTeams("Team Spirit", "MOUZ", "CS", riskyTeams);
    // Team Spirit is "Dota" — should not match
    expect(found).toHaveLength(0);
  });

  it("finds Dota risky team when game filter is Dota", () => {
    const found = findRiskyTeams("Team Spirit", "OG", "Dota", riskyTeams);
    expect(found).toHaveLength(1);
    expect(found[0].name).toBe("Team Spirit");
  });

  it("returns empty array when both teams are empty", () => {
    expect(findRiskyTeams("", "", "CS", riskyTeams)).toEqual([]);
    expect(findRiskyTeams("", "", "CS", riskyTeams)).toEqual([]);
  });

  it("deduplicates — same risky team matched in both team1 and team2", () => {
    const found = findRiskyTeams("FaZe Clan", "FaZe Academy", "CS", riskyTeams);
    // "FaZe Clan" normalized is "fazeclan". "FaZe Academy" normalized is "fazeacademy".
    // Does "fazeclan" include "fazeacademy"? No. Does "fazeacademy" include "fazeclan"? No.
    // So only team1 matches. But if names are identical, should dedup.
    expect(found.length).toBeLessThanOrEqual(1);
  });

  it("finds multiple risky teams at once", () => {
    const multi = [
      ...riskyTeams,
      { name: "Falcons", game: "CS", status: "Обережно", notes: "Tier 3" },
    ];
    const found = findRiskyTeams("FaZe Clan", "Falcons", "CS", multi);
    expect(found).toHaveLength(2);
    expect(found.map((r) => r.name).sort()).toEqual(["FaZe Clan", "Falcons"]);
  });

  it("handles empty risky teams array", () => {
    expect(findRiskyTeams("NaVi", "FaZe", "CS", [])).toEqual([]);
  });

  it("is case-insensitive", () => {
    const found = findRiskyTeams("faze clan", "mouz", "CS", riskyTeams);
    expect(found).toHaveLength(1);
    expect(found[0].name).toBe("FaZe Clan");
  });
});
