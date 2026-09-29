import { describe, it, expect } from "vitest";
import { initialPeriods, periodRecords, periodStats, periodTrend, isValidRange } from "./periodMetrics";
import type { Bet } from "@/types/betting";
const bet = (date: string, result: Bet["result"], profit: number, amount = 100): Bet => ({ match: "Test", betType: "Winner", date, result, profit, amount, odds: 2 });
describe("period comparison", () => {
  it("includes both boundaries and excludes pending records", () => {
    const range = { start: "2026-09-01", end: "2026-09-28" };
    expect(periodRecords([bet("2026-09-01", "Win", 100), bet("2026-09-28T23:00:00", "Loss", -100), bet("2026-09-29", "Win", 100), bet("2026-09-02", "Pending", 0)], range)).toHaveLength(2);
  });
  it("uses total stake for ROI and distinguishes missing percentages", () => {
    expect(periodStats([bet("2026-09-01", "Win", 100), bet("2026-09-02", "Loss", -50, 50)])).toMatchObject({ count: 2, wins: 1, losses: 1, profit: 50, winRate: 50 });
    expect(periodStats([bet("2026-09-01", "Win", 100), bet("2026-09-02", "Loss", -50, 50)]).roi).toBeCloseTo(33.333);
    expect(periodStats([]).roi).toBeNull();
  });
  it("carries daily profit forward but does not extend a shorter period", () => {
    const result = periodTrend([bet("2026-09-01", "Win", 100), bet("2026-09-03", "Loss", -50), bet("2026-08-01", "Win", 20)], [{start:"2026-09-01",end:"2026-09-03"},{start:"2026-08-01",end:"2026-08-02"}]);
    expect(result).toEqual([{day:1,first:100,second:20},{day:2,first:100,second:20},{day:3,first:50,second:null}]);
  });
  it("clamps previous month and validates intervals", () => {
    expect(initialPeriods(new Date(2024, 2, 31))[1].end).toBe("2024-02-29");
    expect(isValidRange({start:"2026-09-02",end:"2026-09-01"})).toBe(false);
    expect(isValidRange({start:"",end:""})).toBe(false);
    expect(isValidRange({start:"2024-01-01",end:"2026-01-01"})).toBe(false);
  });
});
