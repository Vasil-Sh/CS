import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import type { Bet } from "@/types/betting";

// Extract the pure calculation logic from useRiskMetrics for direct testing.
// The hook itself is React-based; we test it via renderHook.
import { useRiskMetrics, type RiskMetrics, type DrawdownPeriod } from "@/hooks/useRiskMetrics";

/** Build a minimal Bet record for testing */
const mkBet = (overrides: Partial<Bet> = {}): Bet =>
  ({
    result: "Pending",
    profit: 0,
    stake: 100,
    date: "2026-07-21",
    odds: 2,
    amount: 100,
    ...overrides,
  } as unknown as Bet);

describe("useRiskMetrics", () => {
  // ── Empty bets ──

  it("returns all zeros for empty bet list", () => {
    const { result } = renderHook(() => useRiskMetrics([]));
    const m = result.current.riskMetrics;
    expect(m.maxDrawdown).toBe(0);
    expect(m.consecutiveLosses).toBe(0);
    expect(m.sharpeRatio).toBe(0);
    expect(m.riskOfRuin).toBe(0);
    expect(m.averageStake).toBe(0);
  });

  it("returns empty drawdownPeriods for empty bet list", () => {
    const { result } = renderHook(() => useRiskMetrics([]));
    expect(result.current.drawdownPeriods).toEqual([]);
  });

  // ── Filters Pending ──

  it("filters out Pending bets", () => {
    const bets = [mkBet({ result: "Pending" }), mkBet({ result: "Pending" })];
    const { result } = renderHook(() => useRiskMetrics(bets));
    expect(result.current.completedBets).toHaveLength(0);
  });

  // ── Consecutive losses ──

  it("counts consecutive losses (simple)", () => {
    const bets = [
      mkBet({ result: "Loss", profit: -100, stake: 100, date: "2026-07-21", createdAt: 4000 }),
      mkBet({ result: "Loss", profit: -200, stake: 200, date: "2026-07-20", createdAt: 3000 }),
      mkBet({ result: "Win", profit: 300, stake: 150, date: "2026-07-19", createdAt: 2000 }),
      mkBet({ result: "Loss", profit: -50, stake: 100, date: "2026-07-18", createdAt: 1000 }),
    ];
    const { result } = renderHook(() => useRiskMetrics(bets));
    // Max consecutive losses in history: 2 (first two losses at start)
    expect(result.current.riskMetrics.consecutiveLosses).toBe(2);
  });

  it("counts 5 consecutive losses", () => {
    const bets = Array.from({ length: 5 }, () =>
      mkBet({ result: "Loss", profit: -100, stake: 100 }),
    );
    const { result } = renderHook(() => useRiskMetrics(bets));
    expect(result.current.riskMetrics.consecutiveLosses).toBe(5);
  });

  // ── Drawdown ──

  it("maxDrawdown > 0 with consistent losses", () => {
    const bets = Array.from({ length: 10 }, () =>
      mkBet({ result: "Loss", profit: -500, stake: 1000 }),
    );
    const { result } = renderHook(() => useRiskMetrics(bets));
    expect(result.current.riskMetrics.maxDrawdown).toBeGreaterThan(0);
    expect(result.current.riskMetrics.maxDrawdown).toBeLessThanOrEqual(100);
  });

  it("maxDrawdown = 0 with all wins", () => {
    const bets = Array.from({ length: 5 }, () =>
      mkBet({ result: "Win", profit: 200, stake: 100 }),
    );
    const { result } = renderHook(() => useRiskMetrics(bets));
    expect(result.current.riskMetrics.maxDrawdown).toBe(0);
  });

  // ── WinRate ──

  it("100% winRate", () => {
    const bets = [mkBet({ result: "Win", profit: 100, stake: 100 }), mkBet({ result: "Win", profit: 200, stake: 100 })];
    const { result } = renderHook(() => useRiskMetrics(bets));
    // 100% win rate: riskOfRuin = 0; Kelly = 0 (cannot compute without any loss)
    expect(result.current.riskMetrics.riskOfRuin).toBe(0);
    expect(result.current.riskMetrics.bankrollGrowth).toBeGreaterThan(0);
  });

  it("0% winRate (all losses)", () => {
    const bets = [mkBet({ result: "Loss", profit: -100, stake: 100 }), mkBet({ result: "Loss", profit: -200, stake: 100 })];
    const { result } = renderHook(() => useRiskMetrics(bets));
    expect(result.current.riskMetrics.riskOfRuin).toBeGreaterThan(0);
  });

  // ── Sharpe + Volatility ──

  it("computes positive sharpe ratio for profitable strategy", () => {
    const bets = [
      mkBet({ result: "Win", profit: 200, stake: 100 }),
      mkBet({ result: "Win", profit: 150, stake: 100 }),
      mkBet({ result: "Loss", profit: -80, stake: 100 }),
    ];
    const { result } = renderHook(() => useRiskMetrics(bets));
    expect(result.current.riskMetrics.sharpeRatio).toBeGreaterThan(0);
  });

  it("volatility > 0 for mixed results", () => {
    const bets = [
      mkBet({ result: "Win", profit: 500, stake: 100 }),
      mkBet({ result: "Loss", profit: -400, stake: 100 }),
    ];
    const { result } = renderHook(() => useRiskMetrics(bets));
    expect(result.current.riskMetrics.volatility).toBeGreaterThan(0);
  });

  // ── Bankroll growth ──

  it("bankrollGrowth negative after losses", () => {
    const bets = [mkBet({ result: "Loss", profit: -1000, stake: 1000 })];
    const { result } = renderHook(() => useRiskMetrics(bets));
    expect(result.current.riskMetrics.bankrollGrowth).toBe(-10);
  });

  it("bankrollGrowth positive after wins", () => {
    const bets = [mkBet({ result: "Win", profit: 1000, stake: 1000 })];
    const { result } = renderHook(() => useRiskMetrics(bets));
    expect(result.current.riskMetrics.bankrollGrowth).toBe(10);
  });

  // ── Stakes ──

  it("maxStake = max among bets with stake > 0", () => {
    const bets = [
      mkBet({ result: "Win", stake: 100 }),
      mkBet({ result: "Loss", stake: 500 }),
      mkBet({ result: "Win", stake: 200 }),
    ];
    const { result } = renderHook(() => useRiskMetrics(bets));
    expect(result.current.riskMetrics.maxStake).toBe(500);
  });

  it("averageStake with mixed stakes", () => {
    const bets = [
      mkBet({ result: "Win", stake: 100 }),
      mkBet({ result: "Win", stake: 300 }),
    ];
    const { result } = renderHook(() => useRiskMetrics(bets));
    expect(result.current.riskMetrics.averageStake).toBe(200);
  });

  // ── VaR ──

  it("valueAtRisk with enough samples", () => {
    const bets = Array.from({ length: 30 }, (_, i) =>
      mkBet({
        result: i % 3 === 0 ? "Loss" : "Win",
        profit: i % 3 === 0 ? -100 : 50,
        stake: 100,
      }),
    );
    const { result } = renderHook(() => useRiskMetrics(bets));
    expect(result.current.riskMetrics.valueAtRisk).toBeGreaterThan(0);
  });

  // ── Drawdown periods ──

  it("produces at least one drawdown period after losses then recovery", () => {
    const bets = [
      mkBet({ result: "Win", profit: 1000, stake: 1000, date: "2026-07-01" }),
      mkBet({ result: "Loss", profit: -500, stake: 1000, date: "2026-07-02" }),
      mkBet({ result: "Loss", profit: -300, stake: 1000, date: "2026-07-03" }),
      mkBet({ result: "Win", profit: 1200, stake: 1000, date: "2026-07-04" }), // recovery above peak
    ];
    const { result } = renderHook(() => useRiskMetrics(bets));
    expect(result.current.drawdownPeriods.length).toBeGreaterThan(0);
    const recovered = result.current.drawdownPeriods.find((p) => p.recovery);
    expect(recovered).toBeDefined();
    if (recovered) expect(recovered.maxDrawdown).toBeGreaterThan(0);
  });

  // ── largestLoss ──

  it("largestLoss reflects the worst single bet", () => {
    const bets = [
      mkBet({ result: "Loss", profit: -10, stake: 100 }),
      mkBet({ result: "Loss", profit: -500, stake: 100 }),
    ];
    const { result } = renderHook(() => useRiskMetrics(bets));
    expect(result.current.riskMetrics.largestLoss).toBe(500);
  });
});
