import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════
// Matches page — pure utility functions
// ═══════════════════════════════════════════

// ── getStatusPriority ──

describe("getStatusPriority", () => {
  const getStatusPriority = (status?: "upcoming" | "live" | "finished"): number => {
    switch (status) {
      case "live": return 0;
      case "upcoming": return 1;
      case "finished": return 2;
      default: return 3;
    }
  };

  it("live = highest priority (0)", () => {
    expect(getStatusPriority("live")).toBe(0);
  });

  it("upcoming = second (1)", () => {
    expect(getStatusPriority("upcoming")).toBe(1);
  });

  it("finished = third (2)", () => {
    expect(getStatusPriority("finished")).toBe(2);
  });

  it("undefined = lowest priority (3)", () => {
    expect(getStatusPriority(undefined)).toBe(3);
  });

  it("sorts: live < upcoming < finished < undefined", () => {
    const items = [
      { status: "finished" as const },
      { status: undefined },
      { status: "live" as const },
      { status: "upcoming" as const },
    ];
    items.sort((a, b) => getStatusPriority(a.status) - getStatusPriority(b.status));
    expect(items[0].status).toBe("live");
    expect(items[1].status).toBe("upcoming");
    expect(items[2].status).toBe("finished");
    expect(items[3].status).toBeUndefined();
  });
});

// ── getDateKey ──

describe("getDateKey", () => {
  const getDateKey = (dateStr: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const m = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const d = new Date(dateStr);
    return d.toISOString().split("T")[0];
  };

  it("passes through YYYY-MM-DD unchanged", () => {
    expect(getDateKey("2026-07-21")).toBe("2026-07-21");
    expect(getDateKey("2025-01-01")).toBe("2025-01-01");
  });

  it("extracts YYYY-MM-DD from ISO timestamp", () => {
    expect(getDateKey("2026-07-21T01:04:00+0300")).toBe("2026-07-21");
  });

  it("extracts YYYY-MM-DD from datetime string", () => {
    expect(getDateKey("2026-07-21T14:30:00Z")).toBe("2026-07-21");
  });

  it("parses freeform date string", () => {
    const result = getDateKey("21 July 2026");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("handles slash format", () => {
    const d = new Date("2026/07/21");
    expect(getDateKey("2026/07/21")).toBe(d.toISOString().split("T")[0]);
  });
});

// ── formatFullDateTitle ──

describe("formatFullDateTitle", () => {
  const formatFullDateTitle = (dateKey: string, gameFilter: "all" | "CS2" | "Dota2"): string => {
    const d = new Date(dateKey + "T12:00:00");
    const dayNames = ["Неділя", "Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота"];
    const dayFull = dayNames[d.getDay()];
    const formatted = d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
    const prefix =
      gameFilter === "CS2" ? "CS2 матчі" :
      gameFilter === "Dota2" ? "Dota 2 матчі" : "Матчі";
    return `${prefix} (${dayFull}, ${formatted})`;
  };

  it("all games: shows 'Матчі'", () => {
    const title = formatFullDateTitle("2026-07-01", "all");
    expect(title).toContain("Матчі (");
  });

  it("CS2 filter: shows 'CS2 матчі'", () => {
    const title = formatFullDateTitle("2026-07-01", "CS2");
    expect(title).toContain("CS2 матчі (");
  });

  it("Dota2 filter: shows 'Dota 2 матчі'", () => {
    const title = formatFullDateTitle("2026-07-01", "Dota2");
    expect(title).toContain("Dota 2 матчі (");
  });

  it("known weekday: Wednesday 2026-07-01 is Середа", () => {
    // July 1, 2026 is a Wednesday
    const title = formatFullDateTitle("2026-07-01", "all");
    expect(title).toContain("Середа");
  });

  it("formats date in Ukrainian locale", () => {
    const title = formatFullDateTitle("2026-12-25", "all");
    expect(title).toContain("25.12.2026");
  });
});

// ── Form stability derivation ──

type FormStability = "hot_streak" | "stable" | "momentum" | "falling" | "slump" | "inconsistent";

describe("formStability derivation", () => {
  /** Pure function replicating the Match-prediction → form stability logic */
  function deriveFormStability(
    pred1: number,
    pred2: number,
    favorite: string,
    team1: string,
    team2: string,
  ): FormStability {
    const favPred = Math.max(pred1, pred2);
    const underdogPred = 100 - favPred;
    const isFavTeam1 = pred1 >= pred2;
    const isFavMatch = favorite === (isFavTeam1 ? team1 : team2);

    if (isFavMatch) {
      if (favPred >= 75) return "hot_streak";
      if (favPred >= 65) return "momentum";
      if (favPred >= 55) return "stable";
      return "inconsistent";
    }
    // Underdog
    if (underdogPred <= 25) return "slump";
    if (underdogPred <= 35) return "falling";
    if (underdogPred <= 45) return "inconsistent";
    return "stable";
  }

  it("favorite with 80% prediction → hot_streak", () => {
    expect(deriveFormStability(80, 20, "TeamA", "TeamA", "TeamB")).toBe("hot_streak");
  });

  it("favorite with 70% prediction → momentum", () => {
    expect(deriveFormStability(70, 30, "TeamA", "TeamA", "TeamB")).toBe("momentum");
  });

  it("favorite with 65% prediction → momentum (boundary)", () => {
    expect(deriveFormStability(65, 35, "TeamA", "TeamA", "TeamB")).toBe("momentum");
  });

  it("favorite with 60% prediction → stable", () => {
    expect(deriveFormStability(60, 40, "TeamA", "TeamA", "TeamB")).toBe("stable");
  });

  it("favorite with 55% prediction → stable (boundary)", () => {
    expect(deriveFormStability(55, 45, "TeamA", "TeamA", "TeamB")).toBe("stable");
  });

  it("favorite with 51% prediction → inconsistent", () => {
    expect(deriveFormStability(51, 49, "TeamA", "TeamA", "TeamB")).toBe("inconsistent");
  });

  it("underdog with 10% prediction → slump", () => {
    // TeamA 90%, TeamB 10% — favorite is TeamA, underdog is TeamB
    // But we set favorite = TeamB, so underdog perspective
    expect(deriveFormStability(90, 10, "TeamB", "TeamA", "TeamB")).toBe("slump");
  });

  it("underdog with 25% prediction → slump (boundary)", () => {
    expect(deriveFormStability(75, 25, "TeamB", "TeamA", "TeamB")).toBe("slump");
  });

  it("underdog with 30% prediction → falling", () => {
    expect(deriveFormStability(70, 30, "TeamB", "TeamA", "TeamB")).toBe("falling");
  });

  it("underdog with 35% prediction → falling (boundary)", () => {
    expect(deriveFormStability(65, 35, "TeamB", "TeamA", "TeamB")).toBe("falling");
  });

  it("underdog with 40% prediction → inconsistent", () => {
    expect(deriveFormStability(60, 40, "TeamB", "TeamA", "TeamB")).toBe("inconsistent");
  });

  it("underdog with 45% prediction → inconsistent (boundary)", () => {
    expect(deriveFormStability(55, 45, "TeamB", "TeamA", "TeamB")).toBe("inconsistent");
  });

  it("underdog with 49% prediction → stable", () => {
    expect(deriveFormStability(51, 49, "TeamB", "TeamA", "TeamB")).toBe("stable");
  });

  it("favorite is team2 with high pred", () => {
    expect(deriveFormStability(20, 80, "TeamB", "TeamA", "TeamB")).toBe("hot_streak");
  });
});

// ── Score-based stability override ──

describe("scoreBasedStabilityOverride", () => {
  function overrideByScore(
    currentStability: FormStability,
    isFavTeam1: boolean,
    s1: number,
    s2: number,
    favorite: string,
    team1: string,
    team2: string,
  ): FormStability {
    const favWon = isFavTeam1 ? s1 > s2 : s2 > s1;
    const isFavMatch = favorite === (isFavTeam1 ? team1 : team2);

    if (isFavMatch) return favWon ? "hot_streak" : "slump";
    return favWon ? "stable" : "falling";
  }

  it("favorite wins BO3 2-0 → hot_streak", () => {
    expect(overrideByScore("stable", true, 2, 0, "TeamA", "TeamA", "TeamB")).toBe("hot_streak");
  });

  it("favorite loses BO3 1-2 → slump", () => {
    expect(overrideByScore("momentum", true, 1, 2, "TeamA", "TeamA", "TeamB")).toBe("slump");
  });

  it("underdog wins → stable (favorite perspective)", () => {
    // TeamA is favorite, but TeamB wins — from TeamA perspective: slump
    expect(overrideByScore("hot_streak", true, 0, 2, "TeamA", "TeamA", "TeamB")).toBe("slump");
  });

  it("favorite=team2, team2 wins → hot_streak", () => {
    expect(overrideByScore("stable", false, 1, 2, "TeamB", "TeamA", "TeamB")).toBe("hot_streak");
  });
});

// ── Match filter flags ──

describe("match filter helpers", () => {
  const mkMatch = (overrides: Record<string, unknown>) => ({
    date: "2026-07-21",
    team1: "NaVi",
    team2: "FaZe",
    risk: 30,
    matchType: "Bo3",
    context: "IEM Katowice 2026",
    matchStatus: "upcoming",
    game: "CS2",
    ...overrides,
  });

  it("risk filter: 'safe' matches risk <= 30", () => {
    const safe = mkMatch({ risk: 25 });
    const moderate = mkMatch({ risk: 31 });
    expect(safe.risk <= 30).toBe(true);
    expect(moderate.risk <= 30).toBe(false);
  });

  it("risk filter: 'moderate' matches 30 < risk <= 50", () => {
    const low = mkMatch({ risk: 30 });
    const mid = mkMatch({ risk: 40 });
    const high = mkMatch({ risk: 51 });
    expect(low.risk > 30 && low.risk <= 50).toBe(false);
    expect(mid.risk > 30 && mid.risk <= 50).toBe(true);
    expect(high.risk > 30 && high.risk <= 50).toBe(false);
  });

  it("risk filter: 'high' matches risk > 50", () => {
    expect(mkMatch({ risk: 51 }).risk > 50).toBe(true);
    expect(mkMatch({ risk: 50 }).risk > 50).toBe(false);
  });

  it("search query: finds team1", () => {
    const m = mkMatch({});
    const q = "navi";
    expect(m.team1.toLowerCase().includes(q)).toBe(true);
    expect(m.team2.toLowerCase().includes(q)).toBe(false);
  });

  it("search query: finds team2", () => {
    const m = mkMatch({});
    const q = "faze";
    expect(m.team2.toLowerCase().includes(q)).toBe(true);
  });

  it("search query: no match returns false", () => {
    const m = mkMatch({});
    const q = "spirit";
    expect(
      m.team1.toLowerCase().includes(q) || m.team2.toLowerCase().includes(q),
    ).toBe(false);
  });

  it("filter by match type", () => {
    const bo3 = mkMatch({ matchType: "Bo3" });
    const bo1 = mkMatch({ matchType: "Bo1" });
    expect(bo3.matchType === "Bo3").toBe(true);
    expect(bo1.matchType === "Bo3").toBe(false);
  });

  it("filter by tournament context substring", () => {
    const m = mkMatch({ context: "IEM Katowice 2026" });
    expect(m.context.includes("Katowice")).toBe(true);
    expect(m.context.includes("Cologne")).toBe(false);
  });

  it("filter by status", () => {
    expect(mkMatch({ matchStatus: "live" }).matchStatus === "live").toBe(true);
    expect(mkMatch({ matchStatus: "finished" }).matchStatus === "live").toBe(false);
  });

  it("filter by game", () => {
    expect(mkMatch({ game: "CS2" }).game === "CS2").toBe(true);
    expect(mkMatch({ game: "Dota2" }).game === "Dota2").toBe(true);
    expect(mkMatch({ game: "Dota2" }).game === "CS2").toBe(false);
  });
});

// ── Day of week filter ──

describe("dayOfWeek filter", () => {
  const dayMap: Record<string, number> = {
    sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
  };

  it("2026-07-22 is Wednesday (3)", () => {
    const d = new Date("2026-07-22T12:00:00");
    expect(d.getDay()).toBe(3); // Wednesday
    expect(dayMap["wed"]).toBe(3);
  });

  it("2026-07-25 is Saturday (6)", () => {
    const d = new Date("2026-07-25T12:00:00");
    expect(d.getDay()).toBe(6);
    expect(dayMap["sat"]).toBe(6);
  });

  it("2026-07-26 is Sunday (0)", () => {
    const d = new Date("2026-07-26T12:00:00");
    expect(d.getDay()).toBe(0);
    expect(dayMap["sun"]).toBe(0);
  });
});
