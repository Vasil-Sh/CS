import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════
// GoalsManager — ladder calculation + amount goal progress
// ═══════════════════════════════════════════

const MAX_LADDER_STEPS = 500;

// ── calculateRemainingSteps ──

function calculateRemainingSteps(
  currentBank: number,
  targetAmount: number,
  minOdds: number,
): number {
  if (!minOdds || minOdds <= 1 || !isFinite(minOdds) || !currentBank || currentBank <= 0 || !targetAmount || targetAmount <= 0)
    return 0;
  let steps = 0, amount = currentBank;
  while (amount < targetAmount && steps < MAX_LADDER_STEPS) {
    amount *= minOdds;
    steps++;
  }
  return steps;
}

describe("calculateRemainingSteps (ladder)", () => {
  it("returns 0 for invalid minOdds (<=1)", () => {
    expect(calculateRemainingSteps(100, 1000, 0.5)).toBe(0);
  });

  it("returns 0 for minOdds=1", () => {
    expect(calculateRemainingSteps(100, 1000, 1)).toBe(0);
  });

  it("returns 0 for zero currentBank", () => {
    expect(calculateRemainingSteps(0, 1000, 2)).toBe(0);
  });

  it("returns 0 for negative target", () => {
    expect(calculateRemainingSteps(100, -100, 2)).toBe(0);
  });

  it("returns 0 for NaN minOdds", () => {
    expect(calculateRemainingSteps(100, 1000, NaN)).toBe(0);
  });

  it("returns 0 for Infinity minOdds", () => {
    expect(calculateRemainingSteps(100, 1000, Infinity)).toBe(0);
  });

  it("100 → 1000 @2.0: 4 steps (100→200→400→800→1600)", () => {
    expect(calculateRemainingSteps(100, 1000, 2)).toBe(4);
  });

  it("100 → 1000 @1.5: 6 steps (100→150→225→337.5→506.25→759.38→1139.07)", () => {
    expect(calculateRemainingSteps(100, 1000, 1.5)).toBe(6);
  });

  it("500 → 1000 @3.0: 1 step (500→1500)", () => {
    expect(calculateRemainingSteps(500, 1000, 3)).toBe(1);
  });

  it("already above target → 0 steps", () => {
    expect(calculateRemainingSteps(2000, 1000, 2)).toBe(0);
  });

  it("caps at MAX_LADDER_STEPS (500)", () => {
    // 1 → 1e100 with odds 1.001 → infinite loop without cap
    const steps = calculateRemainingSteps(1, 1e100, 1.001);
    expect(steps).toBeLessThanOrEqual(MAX_LADDER_STEPS);
    expect(steps).toBeGreaterThan(0);
  });

  it("typical ladder scenario: 1000 → 100000 @1.3", () => {
    // 1000 → 1300 → 1690 → 2197 → 2856 → 3713 → 4827 → 6275 → 8157 → 10604 → ...
    const steps = calculateRemainingSteps(1000, 100000, 1.3);
    expect(steps).toBeGreaterThan(10);
    let amount = 1000;
    for (let i = 0; i < steps; i++) amount *= 1.3;
    expect(amount).toBeGreaterThanOrEqual(100000);
  });
});

// ── amount goal progress ──

interface GoalBet {
  goalId?: string;
  result: "Win" | "Loss" | "Pending";
  profit: number;
  amount: number;
  odds: number;
  date: string;
}

function computeAmountGoalProgress(
  goalId: string,
  targetAmount: number,
  bets: GoalBet[],
): { currentAmount: number; isCompleted: boolean } {
  const goalBets = bets.filter((b) => b.goalId === goalId);
  const totalProfit = goalBets.reduce((sum, b) => {
    if (b.result === "Win") return sum + (b.profit || (b.odds - 1) * (b.amount || 100));
    if (b.result === "Loss") return sum - (b.amount || 100);
    return sum;
  }, 0);
  return {
    currentAmount: totalProfit,
    isCompleted: totalProfit >= targetAmount,
  };
}

describe("computeAmountGoalProgress", () => {
  it("empty bets → 0 progress", () => {
    const { currentAmount, isCompleted } = computeAmountGoalProgress("g1", 1000, []);
    expect(currentAmount).toBe(0);
    expect(isCompleted).toBe(false);
  });

  it("Win: profit = bet profit", () => {
    const bets: GoalBet[] = [
      { goalId: "g1", result: "Win", profit: 500, amount: 100, odds: 6, date: "2026-07-21" },
    ];
    const { currentAmount } = computeAmountGoalProgress("g1", 1000, bets);
    expect(currentAmount).toBe(500);
  });

  it("Loss: profit = -stake", () => {
    const bets: GoalBet[] = [
      { goalId: "g1", result: "Loss", profit: -200, amount: 200, odds: 2, date: "2026-07-21" },
    ];
    const { currentAmount } = computeAmountGoalProgress("g1", 1000, bets);
    expect(currentAmount).toBe(-200);
  });

  it("completed when currentAmount >= target", () => {
    const bets: GoalBet[] = [
      { goalId: "g1", result: "Win", profit: 600, amount: 200, odds: 4, date: "2026-07-21" },
      { goalId: "g1", result: "Win", profit: 500, amount: 100, odds: 6, date: "2026-07-20" },
    ];
    const { currentAmount, isCompleted } = computeAmountGoalProgress("g1", 1000, bets);
    expect(currentAmount).toBe(1100);
    expect(isCompleted).toBe(true);
  });

  it("not completed when below target", () => {
    const bets: GoalBet[] = [
      { goalId: "g1", result: "Win", profit: 300, amount: 100, odds: 4, date: "2026-07-21" },
      { goalId: "g1", result: "Loss", profit: -100, amount: 100, odds: 2, date: "2026-07-20" },
    ];
    const { currentAmount, isCompleted } = computeAmountGoalProgress("g1", 1000, bets);
    expect(currentAmount).toBe(200);
    expect(isCompleted).toBe(false);
  });

  it("only matches bets for the specific goal ID", () => {
    const bets: GoalBet[] = [
      { goalId: "g1", result: "Win", profit: 500, amount: 100, odds: 6, date: "2026-07-21" },
      { goalId: "g2", result: "Win", profit: 9999, amount: 100, odds: 100, date: "2026-07-20" },
    ];
    const { currentAmount } = computeAmountGoalProgress("g1", 1000, bets);
    expect(currentAmount).toBe(500);
  });

  it("Pending bets do not affect progress", () => {
    const bets: GoalBet[] = [
      { goalId: "g1", result: "Win", profit: 200, amount: 100, odds: 3, date: "2026-07-21" },
      { goalId: "g1", result: "Pending", profit: 0, amount: 500, odds: 2, date: "2026-07-20" },
    ];
    const { currentAmount } = computeAmountGoalProgress("g1", 1000, bets);
    expect(currentAmount).toBe(200);
  });

  it("exactly at target → completed", () => {
    const bets: GoalBet[] = [
      { goalId: "g1", result: "Win", profit: 1000, amount: 100, odds: 11, date: "2026-07-21" },
    ];
    const { isCompleted } = computeAmountGoalProgress("g1", 1000, bets);
    expect(isCompleted).toBe(true);
  });

  it("zero target → always completed", () => {
    const { isCompleted } = computeAmountGoalProgress("g1", 0, []);
    expect(isCompleted).toBe(true);
  });

  it("negative target → always completed if at 0", () => {
    const { isCompleted } = computeAmountGoalProgress("g1", -100, []);
    expect(isCompleted).toBe(true);
  });
});

// ── Ladder geometric projection ──

function computeLadderSteps(
  startAmount: number,
  minOdds: number,
  targetAmount: number,
  maxSteps: number = 50,
): Array<{ index: number; startAmount: number; targetAmount: number }> {
  const steps: Array<{ index: number; startAmount: number; targetAmount: number }> = [];
  let current = startAmount;
  let idx = 0;
  const remaining = calculateRemainingSteps(startAmount, targetAmount, minOdds);
  const total = Math.min(remaining, maxSteps);

  for (let i = 0; i < total; i++) {
    steps.push({
      index: idx++,
      startAmount: current,
      targetAmount: Math.round(current * minOdds * 100) / 100,
    });
    current = steps[steps.length - 1].targetAmount;
  }

  return steps;
}

describe("computeLadderSteps (geometric projection)", () => {
  it("generates correct geometric sequence", () => {
    const steps = computeLadderSteps(100, 2, 1000);
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps[0].startAmount).toBe(100);
    expect(steps[0].targetAmount).toBe(200);
    expect(steps[1].startAmount).toBe(200);
    expect(steps[1].targetAmount).toBe(400);
    expect(steps[2].startAmount).toBe(400);
    expect(steps[2].targetAmount).toBe(800);
  });

  it("caps at maxSteps", () => {
    const steps = computeLadderSteps(100, 1.1, 100000, 10);
    expect(steps.length).toBeLessThanOrEqual(10);
  });

  it("stops when target reached", () => {
    const steps = computeLadderSteps(100, 2, 1000);
    const lastTarget = steps[steps.length - 1].targetAmount;
    expect(lastTarget).toBeGreaterThanOrEqual(1000);
  });

  it("empty steps when already at target", () => {
    const steps = computeLadderSteps(2000, 2, 1000);
    expect(steps).toHaveLength(0);
  });

  it("each step's startAmount = previous step's targetAmount", () => {
    const steps = computeLadderSteps(100, 1.5, 10000);
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].startAmount).toBe(steps[i - 1].targetAmount);
    }
  });
});

// ── ROI goal progress ──

function computeRoiGoalProgress(
  goalId: string,
  targetRoi: number,
  bets: GoalBet[],
): { currentRoi: number; isCompleted: boolean; totalBets: number } {
  const goalBets = bets.filter((b) => b.goalId === goalId && b.result !== "Pending");
  if (goalBets.length === 0) return { currentRoi: 0, isCompleted: false, totalBets: 0 };

  const totalProfit = goalBets.reduce((sum, b) => sum + (b.profit || 0), 0);
  const totalStake = goalBets.reduce((sum, b) => sum + (b.amount || 0), 0);
  const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;

  return {
    currentRoi: Math.round(roi * 100) / 100,
    isCompleted: roi >= targetRoi,
    totalBets: goalBets.length,
  };
}

describe("computeRoiGoalProgress", () => {
  it("empty bets → 0 ROI", () => {
    const { currentRoi, isCompleted } = computeRoiGoalProgress("g1", 50, []);
    expect(currentRoi).toBe(0);
    expect(isCompleted).toBe(false);
  });

  it("100% ROI: profit=100, stake=100", () => {
    const bets: GoalBet[] = [
      { goalId: "g1", result: "Win", profit: 100, amount: 100, odds: 2, date: "2026-07-21" },
    ];
    expect(computeRoiGoalProgress("g1", 50, bets).isCompleted).toBe(true);
    expect(computeRoiGoalProgress("g1", 50, bets).currentRoi).toBe(100);
  });

  it("25% ROI → not completed at 50% target", () => {
    const bets: GoalBet[] = [
      { goalId: "g1", result: "Win", profit: 50, amount: 200, odds: 1.25, date: "2026-07-21" },
    ];
    expect(computeRoiGoalProgress("g1", 50, bets).isCompleted).toBe(false);
    expect(computeRoiGoalProgress("g1", 50, bets).currentRoi).toBe(25);
  });

  it("ignores Pending", () => {
    const bets: GoalBet[] = [
      { goalId: "g1", result: "Win", profit: 100, amount: 100, odds: 2, date: "2026-07-21" },
      { goalId: "g1", result: "Pending", profit: 0, amount: 500, odds: 2, date: "2026-07-20" },
    ];
    const { currentRoi } = computeRoiGoalProgress("g1", 50, bets);
    expect(currentRoi).toBe(100);
  });
});

// ── WinRate goal progress ──

function computeWinRateGoalProgress(
  goalId: string,
  targetWinRate: number,
  bets: GoalBet[],
): { currentWinRate: number; isCompleted: boolean; totalBets: number } {
  const goalBets = bets.filter((b) => b.goalId === goalId && b.result !== "Pending");
  if (goalBets.length === 0) return { currentWinRate: 0, isCompleted: false, totalBets: 0 };

  const wins = goalBets.filter((b) => b.result === "Win").length;
  const winRate = (wins / goalBets.length) * 100;

  return {
    currentWinRate: Math.round(winRate * 100) / 100,
    isCompleted: winRate >= targetWinRate && goalBets.length >= 10,
    totalBets: goalBets.length,
  };
}

describe("computeWinRateGoalProgress", () => {
  it("empty → 0", () => {
    expect(computeWinRateGoalProgress("g1", 65, []).currentWinRate).toBe(0);
  });

  it("5W/5L = 50% → not completed at 65% target", () => {
    const bets: GoalBet[] = Array.from({ length: 10 }, (_, i) => ({
      goalId: "g1",
      result: i < 5 ? "Win" as const : "Loss" as const,
      profit: i < 5 ? 100 : -100,
      amount: 100,
      odds: 2,
      date: `2026-07-${String(21 - i).padStart(2, "0")}`,
    }));
    const { currentWinRate, isCompleted } = computeWinRateGoalProgress("g1", 65, bets);
    expect(currentWinRate).toBe(50);
    expect(isCompleted).toBe(false);
  });

  it("7W/3L = 70% → completed at 65% target (with ≥10 bets)", () => {
    const bets: GoalBet[] = Array.from({ length: 10 }, (_, i) => ({
      goalId: "g1",
      result: i < 7 ? "Win" as const : "Loss" as const,
      profit: i < 7 ? 100 : -100,
      amount: 100,
      odds: 2,
      date: `2026-07-${String(21 - i).padStart(2, "0")}`,
    }));
    const { currentWinRate, isCompleted } = computeWinRateGoalProgress("g1", 65, bets);
    expect(currentWinRate).toBe(70);
    expect(isCompleted).toBe(true);
  });

  it("70% winRate but <10 bets → NOT completed", () => {
    const bets: GoalBet[] = Array.from({ length: 5 }, (_, i) => ({
      goalId: "g1",
      result: "Win" as const,
      profit: 100,
      amount: 100,
      odds: 2,
      date: `2026-07-${String(21 - i).padStart(2, "0")}`,
    }));
    const { currentWinRate, isCompleted } = computeWinRateGoalProgress("g1", 65, bets);
    expect(currentWinRate).toBe(100);
    expect(isCompleted).toBe(false); // < 10 bets
  });
});
