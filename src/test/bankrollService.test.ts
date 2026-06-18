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

import { describe, it, expect } from 'vitest';
import { BankrollService } from '@/lib/bankrollService';
import type { Bet } from '@/types/betting';

// ═══════════════════════════════════════════════════════════════════
// calculateTotalProfit
// ═══════════════════════════════════════════════════════════════════
describe('BankrollService.calculateTotalProfit', () => {
  it('[1] порожній масив → 0', () => {
    expect(BankrollService.calculateTotalProfit([])).toBe(0);
  });

  it('[2] одна Win-ставка з profit=500 → 500', () => {
    const bets: Bet[] = [
      { match: 'A vs B', betType: 'П1', odds: 2, amount: 500, date: '2026-06-18', result: 'Win', profit: 500 },
    ];
    expect(BankrollService.calculateTotalProfit(bets)).toBe(500);
  });

  it('[3] одна Loss-ставка з profit=-200 → -200', () => {
    const bets: Bet[] = [
      { match: 'A vs B', betType: 'П2', odds: 1.5, amount: 200, date: '2026-06-18', result: 'Loss', profit: -200 },
    ];
    expect(BankrollService.calculateTotalProfit(bets)).toBe(-200);
  });

  it('[4] Win +500, Loss -200 → total 300', () => {
    const bets: Bet[] = [
      { match: 'A vs B', betType: 'П1', odds: 2, amount: 500, date: '2026-06-18', result: 'Win', profit: 500 },
      { match: 'C vs D', betType: 'П2', odds: 1.5, amount: 200, date: '2026-06-18', result: 'Loss', profit: -200 },
    ];
    expect(BankrollService.calculateTotalProfit(bets)).toBe(300);
  });

  it('[5] Pending ставка ігнорується (profit не додається)', () => {
    const bets: Bet[] = [
      { match: 'A vs B', betType: 'П1', odds: 2, amount: 100, date: '2026-06-18', result: 'Win', profit: 200 },
      { match: 'X vs Y', betType: 'П2', odds: 1.8, amount: 50, date: '2026-06-18', result: 'Pending' },
    ];
    expect(BankrollService.calculateTotalProfit(bets)).toBe(200);
  });

  it('[6] тільки Pending ставки → 0', () => {
    const bets: Bet[] = [
      { match: 'A vs B', betType: 'П1', odds: 2, amount: 100, date: '2026-06-18', result: 'Pending' },
      { match: 'C vs D', betType: 'П2', odds: 3, amount: 50, date: '2026-06-18', result: 'Pending' },
    ];
    expect(BankrollService.calculateTotalProfit(bets)).toBe(0);
  });

  it('[7] ставка без поля profit → 0 для цієї ставки', () => {
    const bets: Bet[] = [
      { match: 'A vs B', betType: 'П1', odds: 2, amount: 100, date: '2026-06-18', result: 'Win' },
      { match: 'C vs D', betType: 'П2', odds: 1.5, amount: 200, date: '2026-06-18', result: 'Loss', profit: -200 },
    ];
    // Перша ставка без profit → 0, друга -200 → total -200
    expect(BankrollService.calculateTotalProfit(bets)).toBe(-200);
  });

  it('[8] змішаний профіт в USD/UAH → сума коректна', () => {
    const bets: Bet[] = [
      { match: 'A vs B', betType: 'П1', odds: 2.5, amount: 100, date: '2026-06-18', result: 'Win', profit: 150, currency: 'USD' },
      { match: 'C vs D', betType: 'П1', odds: 1.8, amount: 500, date: '2026-06-18', result: 'Win', profit: 400, currency: 'UAH' },
    ];
    expect(BankrollService.calculateTotalProfit(bets)).toBe(550);
  });
});
