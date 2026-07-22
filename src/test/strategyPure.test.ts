import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════
// StrategyOverview — calculateStrategyStats + recommendations
// ═══════════════════════════════════════════

interface BetData {
  strategy?: string;
  result: "Win" | "Loss" | "Pending";
  profit: number;
  amount: number;
  date: string;
}

interface StrategyStats {
  totalBets: number;
  wins: number;
  losses: number;
  pending: number;
  totalProfit: number;
  totalStake: number;
  winRate: number;
  roi: number;
}

function calculateStrategyStats(bets: BetData[]): Record<string, StrategyStats> {
  const stats: Record<string, StrategyStats> = {};

  bets.forEach((bet) => {
    const strategy = bet.strategy || "Без стратегії";
    if (!stats[strategy]) {
      stats[strategy] = {
        totalBets: 0,
        wins: 0,
        losses: 0,
        pending: 0,
        totalProfit: 0,
        totalStake: 0,
        winRate: 0,
        roi: 0,
      };
    }

    stats[strategy].totalBets++;
    stats[strategy].totalStake += bet.amount || 0;

    if (bet.result === "Win") {
      stats[strategy].wins++;
      stats[strategy].totalProfit += bet.profit || 0;
    } else if (bet.result === "Loss") {
      stats[strategy].losses++;
      stats[strategy].totalProfit += bet.profit || 0;
    } else {
      stats[strategy].pending++;
    }
  });

  Object.keys(stats).forEach((strategy) => {
    const completedBets = stats[strategy].wins + stats[strategy].losses;
    stats[strategy].winRate =
      completedBets > 0 ? (stats[strategy].wins / completedBets) * 100 : 0;
    stats[strategy].roi =
      stats[strategy].totalStake > 0
        ? (stats[strategy].totalProfit / stats[strategy].totalStake) * 100
        : 0;
  });

  return stats;
}

describe("calculateStrategyStats", () => {
  it("empty bets → empty stats", () => {
    expect(calculateStrategyStats([])).toEqual({});
  });

  it("single strategy with wins", () => {
    const bets: BetData[] = [
      { strategy: "Safe", result: "Win", profit: 100, amount: 100, date: "2026-07-21" },
      { strategy: "Safe", result: "Win", profit: 200, amount: 100, date: "2026-07-20" },
      { strategy: "Safe", result: "Loss", profit: -50, amount: 100, date: "2026-07-19" },
    ];
    const stats = calculateStrategyStats(bets);
    expect(stats["Safe"].totalBets).toBe(3);
    expect(stats["Safe"].wins).toBe(2);
    expect(stats["Safe"].losses).toBe(1);
    expect(stats["Safe"].pending).toBe(0);
    expect(stats["Safe"].totalProfit).toBe(250);
    expect(stats["Safe"].totalStake).toBe(300);
    expect(stats["Safe"].winRate).toBeCloseTo(66.67, 1);
    expect(stats["Safe"].roi).toBeCloseTo(83.33, 1);
  });

  it("multiple strategies", () => {
    const bets: BetData[] = [
      { strategy: "Safe", result: "Win", profit: 100, amount: 100, date: "2026-07-21" },
      { strategy: "Risky", result: "Loss", profit: -200, amount: 200, date: "2026-07-20" },
      { strategy: "Risky", result: "Win", profit: 500, amount: 200, date: "2026-07-19" },
    ];
    const stats = calculateStrategyStats(bets);
    expect(Object.keys(stats)).toHaveLength(2);
    expect(stats["Safe"].totalBets).toBe(1);
    expect(stats["Risky"].totalBets).toBe(2);
    expect(stats["Risky"].totalProfit).toBe(300);
  });

  it("empty strategy name → 'Без стратегії'", () => {
    const bets: BetData[] = [
      { result: "Win", profit: 50, amount: 100, date: "2026-07-21" },
    ];
    const stats = calculateStrategyStats(bets);
    expect(stats["Без стратегії"]).toBeDefined();
    expect(stats["Без стратегії"].totalBets).toBe(1);
  });

  it("0% winRate for all losses", () => {
    const bets: BetData[] = [
      { strategy: "Safe", result: "Loss", profit: -100, amount: 100, date: "2026-07-21" },
    ];
    expect(calculateStrategyStats(bets)["Safe"].winRate).toBe(0);
  });

  it("100% winRate for all wins", () => {
    const bets: BetData[] = [
      { strategy: "Safe", result: "Win", profit: 100, amount: 100, date: "2026-07-21" },
    ];
    expect(calculateStrategyStats(bets)["Safe"].winRate).toBe(100);
  });

  it("Pending does not affect winRate", () => {
    const bets: BetData[] = [
      { strategy: "Safe", result: "Win", profit: 100, amount: 100, date: "2026-07-21" },
      { strategy: "Safe", result: "Pending", profit: 0, amount: 100, date: "2026-07-20" },
    ];
    const stats = calculateStrategyStats(bets);
    expect(stats["Safe"].winRate).toBe(100);
    expect(stats["Safe"].totalBets).toBe(2);
    expect(stats["Safe"].pending).toBe(1);
  });

  it("negative ROI for losing strategy", () => {
    const bets: BetData[] = [
      { strategy: "Bad", result: "Loss", profit: -100, amount: 100, date: "2026-07-21" },
      { strategy: "Bad", result: "Loss", profit: -100, amount: 100, date: "2026-07-20" },
    ];
    expect(calculateStrategyStats(bets)["Bad"].roi).toBe(-100);
  });

  it("zero stake handles them", () => {
    const bets: BetData[] = [
      { strategy: "Zero", result: "Win", profit: 0, amount: 0, date: "2026-07-21" },
    ];
    expect(calculateStrategyStats(bets)["Zero"].roi).toBe(0);
  });
});

// ── Dynamic recommendations ──

function generateRecommendations(
  stats: Record<string, StrategyStats>,
): { type: "info" | "warning" | "success"; message: string }[] {
  const recommendations: { type: "info" | "warning" | "success"; message: string }[] = [];

  Object.entries(stats).forEach(([name, s]) => {
    if (s.roi < -5 && s.totalBets > 5) {
      recommendations.push({
        type: "warning",
        message: `Стратегія "${name}" має ROI ${s.roi.toFixed(1)}%`,
      });
    }
    if (s.roi > 10 && s.totalBets > 10) {
      recommendations.push({
        type: "success",
        message: `Стратегія "${name}" показує відмінні результати`,
      });
    }
    if (s.winRate < 40 && s.totalBets > 5) {
      recommendations.push({
        type: "warning",
        message: `Вінрейт стратегії "${name}" становить ${s.winRate.toFixed(1)}%`,
      });
    }
  });

  return recommendations;
}

describe("generateRecommendations", () => {
  it("warning for ROI < -5% with >5 bets", () => {
    const stats: Record<string, StrategyStats> = {
      Bad: { totalBets: 10, wins: 2, losses: 8, pending: 0, totalProfit: -30, totalStake: 500, winRate: 20, roi: -6 },
    };
    const recs = generateRecommendations(stats);
    expect(recs.some((r) => r.type === "warning" && r.message.includes("Bad"))).toBe(true);
  });

  it("no warning for ROI < -5% but few bets", () => {
    const stats: Record<string, StrategyStats> = {
      Small: { totalBets: 3, wins: 0, losses: 3, pending: 0, totalProfit: -30, totalStake: 300, winRate: 0, roi: -10 },
    };
    const recs = generateRecommendations(stats);
    expect(recs.filter((r) => r.type === "warning" && r.message.includes("Small"))).toHaveLength(0);
  });

  it("success for ROI > 10% with >10 bets", () => {
    const stats: Record<string, StrategyStats> = {
      Good: { totalBets: 15, wins: 10, losses: 5, pending: 0, totalProfit: 200, totalStake: 1500, winRate: 66.67, roi: 13.33 },
    };
    const recs = generateRecommendations(stats);
    expect(recs.some((r) => r.type === "success" && r.message.includes("Good"))).toBe(true);
  });

  it("warning for low winRate < 40% with >5 bets", () => {
    const stats: Record<string, StrategyStats> = {
      Unlucky: { totalBets: 10, wins: 3, losses: 7, pending: 0, totalProfit: 0, totalStake: 1000, winRate: 30, roi: 0 },
    };
    const recs = generateRecommendations(stats);
    expect(recs.some((r) => r.type === "warning" && r.message.includes("Unlucky") && r.message.includes("30.0%"))).toBe(true);
  });

  it("no recommendation for healthy strategy", () => {
    const stats: Record<string, StrategyStats> = {
      Healthy: { totalBets: 20, wins: 12, losses: 8, pending: 0, totalProfit: 50, totalStake: 2000, winRate: 60, roi: 2.5 },
    };
    const recs = generateRecommendations(stats);
    expect(recs.filter((r) => r.message.includes("Healthy"))).toHaveLength(0);
  });

  it("multiple recommendations across strategies", () => {
    const stats: Record<string, StrategyStats> = {
      Bad: { totalBets: 10, wins: 3, losses: 7, pending: 0, totalProfit: -50, totalStake: 1000, winRate: 30, roi: -5 },
      Good: { totalBets: 15, wins: 10, losses: 5, pending: 0, totalProfit: 200, totalStake: 1500, winRate: 66.67, roi: 13.33 },
    };
    const recs = generateRecommendations(stats);
    const warnings = recs.filter((r) => r.type === "warning");
    const successes = recs.filter((r) => r.type === "success");
    expect(warnings.length).toBeGreaterThanOrEqual(1);
    expect(successes.length).toBeGreaterThanOrEqual(1);
  });

  it("empty stats → empty recommendations", () => {
    expect(generateRecommendations({})).toEqual([]);
  });
});

// ── Chart data truncation ──

describe("chart name truncation", () => {
  const truncate = (name: string): string =>
    name.length > 15 ? name.substring(0, 15) + "..." : name;

  it('short name stays unchanged', () => {
    expect(truncate("Short")).toBe("Short");
  });

  it('15 chars exactly → no truncation', () => {
    const name = "123456789012345";
    expect(truncate(name)).toBe(name);
  });

  it('16 chars → truncate to 15 + "..."', () => {
    expect(truncate("1234567890123456")).toBe("123456789012345...");
  });

  it('very long name truncated', () => {
    const name = "Very Long Strategy Name That Should Be Truncated";
    expect(truncate(name)).toBe("Very Long Strat...");
  });
});
