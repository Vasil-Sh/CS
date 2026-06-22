/**
 * Unit tests: Express-парсинг
 * ============================
 * Копія логіки з `MyBets.tsx` → `parseExpressEvents()`
 *
 * ПРИЗНАЧЕННЯ:
 *   Розбирає рядок betType формату:
 *     "Експрес 4x | 1. NaVi vs FaZe | П1: NaVi @1.80 • 2. G2 vs Vitality | П2: Vitality @2.10 • ..."
 *   на масив подій { number, match, betType, selection, odds }.
 *
 * ЩО ТЕСТУЄМО:
 * ┌────┬────────────────────────────────┬──────────────────────────┐
 * │  # │ Тест                           │ Очікуваний результат     │
 * ├────┼────────────────────────────────┼──────────────────────────┤
 * │  1 │ Звичайна ставка (без |)        │ [] (не експрес)          │
 * │  2 │ Експрес 2x: 2 події           │ 2 елементи               │
 * │  3 │ Експрес 4x: 4 події           │ 4 елементи, коректні поля│
 * │  4 │ Подія без odds                 │ odds = ""                │
 * │  5 │ Порожній рядок                 │ []                       │
 * └────┴────────────────────────────────┴──────────────────────────┘
 */

import { describe, it, expect } from 'vitest';
import { parseExpressEvents } from '@/lib/parser/expressParser';
import type { ParsedEvent } from '@/lib/parser/expressParser';

describe('parseExpressEvents (Express-парсинг)', () => {
  it('[1] звичайна ставка "П1" (без |) → порожній масив', () => {
    expect(parseExpressEvents('П1')).toEqual([]);
  });

  it('[2] Експрес 2x — дві події з коректними полями', () => {
    const input = 'Експрес 2x | 1. NaVi vs FaZe | П1: NaVi @1.80 • 2. G2 vs Vitality | П2: Vitality @2.10';

    const result = parseExpressEvents(input);
    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      number: '1',
      match: 'NaVi vs FaZe',
      betType: 'П1',
      selection: 'NaVi',
      odds: '1.80',
    });

    expect(result[1]).toEqual({
      number: '2',
      match: 'G2 vs Vitality',
      betType: 'П2',
      selection: 'Vitality',
      odds: '2.10',
    });
  });

  it('[3] Експрес 3x — три події', () => {
    const input = 'Експрес 3x | 1. MOUZ vs Spirit | П1: MOUZ @2.50 • 2. Astralis vs Heroic | П2: Heroic @1.90 • 3. ENCE vs BIG | П1: ENCE @2.30';

    const result = parseExpressEvents(input);
    expect(result).toHaveLength(3);
    expect(result[0].number).toBe('1');
    expect(result[1].number).toBe('2');
    expect(result[2].number).toBe('3');
    expect(result[0].odds).toBe('2.50');
  });

  it('[4] подія без коефіцієнта (немає @) → odds = ""', () => {
    const input = 'Експрес 2x | 1. TeamA vs TeamB | П1: TeamA • 2. TeamC vs TeamD | П2: TeamD @1.50';

    const result = parseExpressEvents(input);
    expect(result).toHaveLength(2);
    expect(result[0].odds).toBe('');
    expect(result[1].odds).toBe('1.50');
  });

  it('[5] подія без номера → number = ""', () => {
    const input = 'Експрес 1x | TeamA vs TeamB | П1: TeamA @1.80';

    const result = parseExpressEvents(input);
    expect(result).toHaveLength(1);
    expect(result[0].number).toBe('');
    expect(result[0].match).toBe('TeamA vs TeamB');
  });

  it('[6] порожній рядок → []', () => {
    expect(parseExpressEvents('')).toEqual([]);
  });

  it('[7] Експрес з FORA (складний betType: "Фора(-1.5): NaVi @2.20")', () => {
    const input = 'Експрес 2x | 1. NaVi vs FaZe | Фора(-1.5): NaVi @2.20 • 2. G2 vs Vitality | Тотал більше 2.5: Так @1.90';

    const result = parseExpressEvents(input);
    expect(result).toHaveLength(2);
    expect(result[0].betType).toBe('Фора(-1.5)');
    expect(result[0].selection).toBe('NaVi');
    expect(result[1].betType).toBe('Тотал більше 2.5');
    expect(result[1].selection).toBe('Так');
  });
});
