import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { act } from "@testing-library/react";

// We test the pure calculation logic by importing the internal algorithm
// Since useTiltBlock is a React hook that depends on localStorage,
// we extract the core logic into describable pure test cases.

import { useTiltBlock } from "@/hooks/useTiltBlock";
import type { BetRecord } from "@/types/betting";
import type { CS2Strategy } from "@/types/strategy";

// Helper: build strategy with activityLimits
const mkStrategy = (blockAfterLosses?: number, blockDurationMinutes?: number): CS2Strategy =>
  ({
    id: "s1",
    name: "Test Strategy",
    riskLevel: "Medium",
    activityLimits: {
      enabled: true,
      blockAfterLosses,
      blockDurationMinutes,
    },
    criteria: [],
  } as unknown as CS2Strategy);

// Helper: build a bet record
const bet = (result: "Win" | "Loss" | "Pending", date: string, createdAt?: number): BetRecord =>
  ({
    result,
    date,
    createdAt,
    profit: result === "Win" ? 500 : -500,
    amount: 1000,
    odds: 2,
  } as BetRecord);

describe("useTiltBlock", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns not blocked when no strategy", () => {
    const { result } = renderHook(() => useTiltBlock("test_user", null, []));
    expect(result.current.blocked).toBe(false);
    expect(result.current.reason).toBe("");
    expect(result.current.minutesLeft).toBe(0);
  });

  it("returns not blocked when strategy has no activityLimits", () => {
    const noLimits: CS2Strategy = {
      id: "s2",
      name: "No Limits",
      riskLevel: "Low",
      criteria: [],
    } as unknown as CS2Strategy;
    const { result } = renderHook(() => useTiltBlock("user", noLimits, []));
    expect(result.current.blocked).toBe(false);
  });

  it("returns not blocked when activityLimits is disabled", () => {
    const disabled: CS2Strategy = {
      ...mkStrategy(3, 60),
      activityLimits: { enabled: false, blockAfterLosses: 3 },
    } as unknown as CS2Strategy;
    const { result } = renderHook(() => useTiltBlock("user", disabled, []));
    expect(result.current.blocked).toBe(false);
  });

  it("returns not blocked when not enough consecutive losses", () => {
    const bets = [
      bet("Loss", "2026-07-21", 1000),
      bet("Win", "2026-07-20", 900),
      bet("Loss", "2026-07-19", 800),
    ];
    const { result } = renderHook(() => useTiltBlock("user", mkStrategy(3, 60), bets));
    expect(result.current.blocked).toBe(false);
  });

  it("blocks when consecutive losses >= blockAfterLosses", () => {
    const bets = [
      bet("Loss", "2026-07-21", 1000),
      bet("Loss", "2026-07-20", 900),
      bet("Loss", "2026-07-19", 800),
      bet("Win", "2026-07-18", 700),
    ];
    const { result } = renderHook(() => useTiltBlock("user", mkStrategy(3, 60), bets));
    expect(result.current.blocked).toBe(true);
    expect(result.current.reason).toContain("3 поспіль програшів");
    expect(result.current.minutesLeft).toBeGreaterThan(0);
    expect(result.current.minutesLeft).toBeLessThanOrEqual(60);
  });

  it("blocks with custom blockAfterLosses=5", () => {
    const bets = [
      bet("Loss", "2026-07-21"),
      bet("Loss", "2026-07-20"),
      bet("Loss", "2026-07-19"),
      bet("Loss", "2026-07-18"),
      bet("Loss", "2026-07-17"),
    ];
    const { result } = renderHook(() => useTiltBlock("user", mkStrategy(5, 30), bets));
    expect(result.current.blocked).toBe(true);
    expect(result.current.minutesLeft).toBeLessThanOrEqual(30);
  });

  it("does not block at exactly N-1 consecutive losses", () => {
    const bets = [
      bet("Loss", "2026-07-21", 3000),
      bet("Loss", "2026-07-20", 2000),
      bet("Win", "2026-07-19", 1000),
    ];
    const { result } = renderHook(() => useTiltBlock("user", mkStrategy(3, 60), bets));
    // Only 2 consecutive losses — should not block at threshold of 3
    expect(result.current.blocked).toBe(false);
  });

  it("respects custom blockDurationMinutes", () => {
    const bets = [
      bet("Loss", "2026-07-21"),
      bet("Loss", "2026-07-20"),
      bet("Loss", "2026-07-19"),
    ];
    const { result } = renderHook(() => useTiltBlock("user", mkStrategy(3, 15), bets));
    expect(result.current.blocked).toBe(true);
    expect(result.current.minutesLeft).toBeLessThanOrEqual(15);
  });

  it("sorts bets by createdAt descending, not date", () => {
    // Older date wins → should NOT block (only 2 consecutive losses by date)
    const bets = [
      bet("Loss", "2026-07-19", 1000), // most recent by createdAt
      bet("Loss", "2026-07-18", 900),
      bet("Win", "2026-07-21", 500),  // Win breaks streak
      bet("Loss", "2026-07-20", 400),
    ];
    const { result } = renderHook(() => useTiltBlock("user", mkStrategy(3, 60), bets));
    // Sorted by createdAt descending: Loss(1000), Loss(900), Win(500), Loss(400)
    // → 2 consecutive losses, not blocked
    expect(result.current.blocked).toBe(false);
  });

  it("ignores Pending bets in streak count", () => {
    const bets = [
      bet("Loss", "2026-07-21"),
      bet("Pending", "2026-07-20"),
      bet("Loss", "2026-07-19"),
      bet("Loss", "2026-07-18"),
    ];
    const { result } = renderHook(() => useTiltBlock("user", mkStrategy(3, 60), bets));
    // Pending skips, so: Loss(07-21), Loss(07-19), Loss(07-18) = 3 consecutive
    expect(result.current.blocked).toBe(true);
  });

  it("rollback: expired block → not blocked", () => {
    localStorage.setItem(
      "tilt_block_user_exp",
      JSON.stringify({ until: Date.now() - 1000, reason: "expired", strategyName: "Test" }),
    );
    const { result } = renderHook(() => useTiltBlock("user_exp", mkStrategy(3, 60), []));
    expect(result.current.blocked).toBe(false);
    // localStorage should be cleaned
    expect(localStorage.getItem("tilt_block_user_exp")).toBeNull();
    localStorage.removeItem("tilt_block_user_exp");
  });
});
