import { describe, expect, it } from "vitest";
import { summarizeOdds } from "./OddsOverview";
import type { Bet } from "@/types/betting";

const bet = (odds: number, result: Bet["result"] = "Win", profit = 10): Bet => ({ match: "Test", betType: "Winner", amount: 100, date: "2026-09-29", odds, result, profit });

describe("Odds overview aggregation", () => {
  it("assigns boundaries once and excludes pending / invalid odds", () => {
    const summary = summarizeOdds([bet(1.2), bet(1.5), bet(2), bet(2.5), bet(3), bet(3.5), bet(2, "Pending"), bet(NaN), bet(0)]);
    expect(summary.count).toBe(6);
    expect(summary.categories.map(c => c.count)).toEqual([2, 2, 2]);
    expect(summary.distribution.map(c => c.count)).toEqual([1, 1, 1, 2, 1]);
  });
  it("calculates actual wins, losses and profit; no data is not a zero win rate", () => {
    const summary = summarizeOdds([bet(1.8, "Win", 80), bet(1.8, "Loss", -100)]);
    expect(summary.categories[0]).toMatchObject({ wins: 1, losses: 1, winRate: 50, profit: -20 });
    expect(summary.categories[1]).toMatchObject({ count: 0, winRate: null, profit: 0 });
    expect(summarizeOdds([]).distribution.every(c => c.count === 0)).toBe(true);
  });
});
