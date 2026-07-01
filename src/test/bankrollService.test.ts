/**
 * Unit tests: BankrollService
 * ============================
 * Файл, що тестується: `src/lib/bankrollService.ts`
 *
 * ПРИЗНАЧЕННЯ:
 *   Розрахунок банкрол-статистики: загальний профіт, поточний
 *   банк, ROI на основі початкового банку та списку ставок.
 *
 * ЩО ТЕСТУЄМО:
 * ┌────┬────────────────────────────────┬──────────────────────────┐
 * │  # │ Тест                           │ Очікуваний результат     │
 * ├────┼────────────────────────────────┼──────────────────────────┤
 * │  1 │ Пустий список ставок           │ profit = 0               │
 * │  2 │ Тільки Win ставки              │ Сума profit              │
 * │  3 │ Мікс Win + Loss               │ Коректна сума            │
 * │  4 │ Pending ігноруються            │ Не враховані в total     │
 * │  5 │ Ставка без profit поля         │ 0 для цієї ставки        │
 * │  6 │ Негативний profit (Loss)       │ Коректно віднімається    │
 * └────┴────────────────────────────────┴──────────────────────────┘
 */

import { describe, it, expect, beforeEach } from "vitest";
import { BankrollService } from "@/lib/bankrollService";
import { UserDataService } from "@/lib/userDataService";
import type { Bet } from "@/types/betting";

// ═══════════════════════════════════════════════════════════════════
// calculateTotalProfit
// ═══════════════════════════════════════════════════════════════════
describe("BankrollService.calculateTotalProfit", () => {
  it("[1] порожній масив → 0", () => {
    expect(BankrollService.calculateTotalProfit([])).toBe(0);
  });

  it("[2] одна Win-ставка з profit=500 → 500", () => {
    const bets: Bet[] = [
      {
        match: "A vs B",
        betType: "П1",
        odds: 2,
        amount: 500,
        date: "2026-06-18",
        result: "Win",
        profit: 500,
      },
    ];
    expect(BankrollService.calculateTotalProfit(bets)).toBe(500);
  });

  it("[3] одна Loss-ставка з profit=-200 → -200", () => {
    const bets: Bet[] = [
      {
        match: "A vs B",
        betType: "П2",
        odds: 1.5,
        amount: 200,
        date: "2026-06-18",
        result: "Loss",
        profit: -200,
      },
    ];
    expect(BankrollService.calculateTotalProfit(bets)).toBe(-200);
  });

  it("[4] Win +500, Loss -200 → total 300", () => {
    const bets: Bet[] = [
      {
        match: "A vs B",
        betType: "П1",
        odds: 2,
        amount: 500,
        date: "2026-06-18",
        result: "Win",
        profit: 500,
      },
      {
        match: "C vs D",
        betType: "П2",
        odds: 1.5,
        amount: 200,
        date: "2026-06-18",
        result: "Loss",
        profit: -200,
      },
    ];
    expect(BankrollService.calculateTotalProfit(bets)).toBe(300);
  });

  it("[5] Pending ставка ігнорується (profit не додається)", () => {
    const bets: Bet[] = [
      {
        match: "A vs B",
        betType: "П1",
        odds: 2,
        amount: 100,
        date: "2026-06-18",
        result: "Win",
        profit: 200,
      },
      {
        match: "X vs Y",
        betType: "П2",
        odds: 1.8,
        amount: 50,
        date: "2026-06-18",
        result: "Pending",
      },
    ];
    expect(BankrollService.calculateTotalProfit(bets)).toBe(200);
  });

  it("[6] тільки Pending ставки → 0", () => {
    const bets: Bet[] = [
      {
        match: "A vs B",
        betType: "П1",
        odds: 2,
        amount: 100,
        date: "2026-06-18",
        result: "Pending",
      },
      {
        match: "C vs D",
        betType: "П2",
        odds: 3,
        amount: 50,
        date: "2026-06-18",
        result: "Pending",
      },
    ];
    expect(BankrollService.calculateTotalProfit(bets)).toBe(0);
  });

  it("[7] ставка без поля profit → 0 для цієї ставки", () => {
    const bets: Bet[] = [
      {
        match: "A vs B",
        betType: "П1",
        odds: 2,
        amount: 100,
        date: "2026-06-18",
        result: "Win",
      },
      {
        match: "C vs D",
        betType: "П2",
        odds: 1.5,
        amount: 200,
        date: "2026-06-18",
        result: "Loss",
        profit: -200,
      },
    ];
    // Перша ставка без profit → 0, друга -200 → total -200
    expect(BankrollService.calculateTotalProfit(bets)).toBe(-200);
  });

  it("[8] змішаний профіт в USD/UAH → сума коректна", () => {
    const bets: Bet[] = [
      {
        match: "A vs B",
        betType: "П1",
        odds: 2.5,
        amount: 100,
        date: "2026-06-18",
        result: "Win",
        profit: 150,
        currency: "USD",
      },
      {
        match: "C vs D",
        betType: "П1",
        odds: 1.8,
        amount: 500,
        date: "2026-06-18",
        result: "Win",
        profit: 400,
        currency: "UAH",
      },
    ];
    expect(BankrollService.calculateTotalProfit(bets)).toBe(550);
  });
});

// ═══════════════════════════════════════════════════════════════════
// getBankrollStats
// ═══════════════════════════════════════════════════════════════════
describe("BankrollService.getBankrollStats", () => {
  const TEST_USER = "test-user";

  beforeEach(async () => {
    localStorage.clear();
    // Seed data directly via localStorage (bypass async setInitialBank API call)
    UserDataService.setUserDataSync(TEST_USER, "bankroll_data", {
      initialBank: 10000,
      manualAdjustments: 0,
      lastUpdated: new Date().toISOString(),
    });
  });

  it("[9] невстановлений банк → всі нулі", () => {
    localStorage.clear();
    const stats = BankrollService.getBankrollStats(TEST_USER, []);
    expect(stats).toEqual({
      initialBank: 0,
      currentBank: 0,
      totalProfit: 0,
      roi: 0,
    });
  });

  it("[10] банк 10000 + виграш 500 → currentBank = 10500, roi = 5%", () => {
    const bets = [
      {
        match: "A vs B",
        betType: "П1",
        odds: 2,
        amount: 500,
        date: "2026-06-18",
        result: "Win" as const,
        profit: 500,
      },
    ];
    const stats = BankrollService.getBankrollStats(TEST_USER, bets);
    expect(stats.initialBank).toBe(10000);
    expect(stats.totalProfit).toBe(500);
    expect(stats.currentBank).toBe(10500);
    expect(stats.roi).toBe(5);
  });

  it("[11] банк 5000 + програш -1000 → currentBank = 4000, roi = -20%", () => {
    UserDataService.setUserDataSync(TEST_USER, "bankroll_data", {
      initialBank: 5000,
      manualAdjustments: 0,
      lastUpdated: new Date().toISOString(),
    });
    const bets = [
      {
        match: "A vs B",
        betType: "П1",
        odds: 1.5,
        amount: 1000,
        date: "2026-06-18",
        result: "Loss" as const,
        profit: -1000,
      },
    ];
    const stats = BankrollService.getBankrollStats(TEST_USER, bets);
    expect(stats.currentBank).toBe(4000);
    expect(stats.roi).toBe(-20);
  });

  it("[12] Pending не впливає на currentBank", () => {
    const bets = [
      {
        match: "A vs B",
        betType: "П1",
        odds: 2,
        amount: 500,
        date: "2026-06-18",
        result: "Win" as const,
        profit: 300,
      },
      {
        match: "X vs Y",
        betType: "П2",
        odds: 1.8,
        amount: 500,
        date: "2026-06-18",
        result: "Pending" as const,
      },
    ];
    const stats = BankrollService.getBankrollStats(TEST_USER, bets);
    expect(stats.totalProfit).toBe(300);
    expect(stats.currentBank).toBe(10300);
  });
});

// ═══════════════════════════════════════════════════════════════════
// validateBetAmount
// ═══════════════════════════════════════════════════════════════════
describe("BankrollService.validateBetAmount", () => {
  const TEST_USER = "test-user";

  beforeEach(() => {
    localStorage.clear();
  });

  it("[13] банк не встановлено → завжди valid", () => {
    const r = BankrollService.validateBetAmount(TEST_USER, [], 5000);
    expect(r.isValid).toBe(true);
  });

  it("[14] ставка ≤ поточний банк → valid", () => {
    UserDataService.setUserDataSync(TEST_USER, "bankroll_data", {
      initialBank: 10000,
      manualAdjustments: 0,
      lastUpdated: new Date().toISOString(),
    });
    const r = BankrollService.validateBetAmount(TEST_USER, [], 5000);
    expect(r.isValid).toBe(true);
  });

  it("[15] ставка > поточний банк → invalid з warning", () => {
    UserDataService.setUserDataSync(TEST_USER, "bankroll_data", {
      initialBank: 1000,
      manualAdjustments: 0,
      lastUpdated: new Date().toISOString(),
    });
    const r = BankrollService.validateBetAmount(TEST_USER, [], 2000);
    expect(r.isValid).toBe(false);
    expect(r.warning).toContain("перевищує");
  });
});
