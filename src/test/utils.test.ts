/**
 * Unit tests: утиліти `normalizeDateStr`, `buildPrompt`,
 * `parseAIResponse`, `getMockRecommendation`
 * ========================================================
 *
 * Тестовані файли:
 *   • `src/components/BetTable.tsx`        — normalizeDateStr (inline)
 *   • `src/lib/ai/shared.ts`              — buildPrompt, parseAIResponse,
 *                                            getMockRecommendation
 *
 * ═══════════════════════════════════════════════════════════════
 *  1. normalizeDateStr
 * ═══════════════════════════════════════════════════════════════
 * ПРИЗНАЧЕННЯ:
 *   Нормалізує рядок дати ставки до формату YYYY-MM-DD.
 *   Підтримує три вхідні формати:
 *     • DD.MM.YYYY  (український)
 *     • DD/MM/YYYY  (альтернативний)
 *     • YYYY-MM-DD  (вже нормалізований — pass-through)
 *
 * ДЕ ВИКОРИСТОВУЄТЬСЯ:
 *   BetTable.tsx — фільтр «Сьогодні» та періодні фільтри
 *   (week/month/quarter) порівнюють дати через цю функцію.
 *
 * ТЕСТИ:
 * ┌───┬──────────────────────────────────┬──────────────────────────┐
 * │ # │ Кейс                             │ Очікуваний результат     │
 * ├───┼──────────────────────────────────┼──────────────────────────┤
 * │ 1 │ "18.06.2026"                     │ "2026-06-18"             │
 * │ 2 │ "1.5.2026" (одноцифрові)        │ "2026-05-01"             │
 * │ 3 │ "2026-06-18" (вже норм.)        │ "2026-06-18" (pass-thru) │
 * │ 4 │ "18/06/2026" (slash)            │ "2026-06-18"             │
 * │ 5 │ "" (порожній рядок)             │ ""                       │
 * └───┴──────────────────────────────────┴──────────────────────────┘
 *
 * ⚠️  ІСТОРИЧНА ДОВІДКА:
 *   Саме ці тести знайшли баг v1: normalizeDateStr переставляв
 *   день і місяць місцями (DD.MM → MM.DD). Виправлено в тому ж
 *   коміті після першого ж прогону тестів.
 *
 * ═══════════════════════════════════════════════════════════════
 *  2. buildPrompt
 * ═══════════════════════════════════════════════════════════════
 * ПРИЗНАЧЕННЯ:
 *   Будує текстовий промпт для AI-моделі (Gemini / OpenRouter)
 *   з інформацією про матч: команди, формат, рівень, коефіцієнти.
 *   Використовується ОДНАКОВО обома AI-сервісами.
 *
 * ТЕСТИ:
 * ┌───┬──────────────────────────────────┬──────────────────────────┐
 * │ # │ Кейс                             │ Очікуваний результат     │
 * ├───┼──────────────────────────────────┼──────────────────────────┤
 * │ 1 │ Команди + формат                 │ Містить NaVi, FaZe, BO3  │
 * │ 2 │ З коефіцієнтами                  │ Містить 1.8, 2           │
 * └───┴──────────────────────────────────┴──────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════
 *  3. parseAIResponse
 * ═══════════════════════════════════════════════════════════════
 * ПРИЗНАЧЕННЯ:
 *   Парсить текстовий response від AI у структурований об'єкт
 *   AIRecommendation. Очікує формат:
 *     PREDICTION: ...
 *     CONFIDENCE: ...
 *     REASONING: ...
 *     SUGGESTED_BET: ...
 *     RISK_LEVEL: ...
 *
 * ТЕСТИ:
 * ┌───┬──────────────────────────────────┬──────────────────────────┐
 * │ # │ Кейс                             │ Очікуваний результат     │
 * ├───┼──────────────────────────────────┼──────────────────────────┤
 * │ 1 │ Коректний response               │ prediction = "NaVi"      │
 * │ 2 │ Confidence як число              │ confidence = 75 (number) │
 * │ 3 │ Порожній response → fallback     │ "Немає прогнозу", 50,    │
 * │   │                                  │ riskLevel = "medium"     │
 * └───┴──────────────────────────────────┴──────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════
 *  4. getMockRecommendation
 * ═══════════════════════════════════════════════════════════════
 * ПРИЗНАЧЕННЯ:
 *   Повертає заглушку-рекомендацію, коли AI API недоступне.
 *   Використовується обома AI-сервісами як fallback.
 *
 * ТЕСТИ:
 * ┌───┬──────────────────────────────────┬──────────────────────────┐
 * │ # │ Кейс                             │ Очікуваний результат     │
 * ├───┼──────────────────────────────────┼──────────────────────────┤
 * │ 1 │ Базовий виклик                   │ team1, confidence=65,    │
 * │   │                                  │ riskLevel = "medium"     │
 * └───┴──────────────────────────────────┴──────────────────────────┘
 */

import { describe, it, expect } from 'vitest';
import { normalizeDateStr } from '@/lib/utils';

describe('normalizeDateStr', () => {
  it('[1] "18.06.2026" (DD.MM.YYYY) → "2026-06-18"', () => {
    expect(normalizeDateStr('18.06.2026')).toBe('2026-06-18');
  });

  it('[2] "1.5.2026" (одноцифрові день/місяць) → "2026-05-01"', () => {
    expect(normalizeDateStr('1.5.2026')).toBe('2026-05-01');
  });

  it('[3] "2026-06-18" (вже YYYY-MM-DD) → pass-through без змін', () => {
    expect(normalizeDateStr('2026-06-18')).toBe('2026-06-18');
  });

  it('[4] "18/06/2026" (DD/MM/YYYY, slash) → "2026-06-18"', () => {
    expect(normalizeDateStr('18/06/2026')).toBe('2026-06-18');
  });

  it('[5] "" (порожній рядок) → "" (без помилок)', () => {
    expect(normalizeDateStr('')).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════
// Тести AI-утиліт з src/lib/ai/shared.ts
// ═══════════════════════════════════════════════════════════════════

import { buildPrompt, parseAIResponse, getMockRecommendation } from '@/lib/ai/shared';

describe('buildPrompt (src/lib/ai/shared.ts)', () => {
  it('[1] містить назви команд та формат', () => {
    const prompt = buildPrompt({
      team1: 'NaVi', team2: 'FaZe', format: 'BO3', tier: 'tier1',
    });
    expect(prompt).toContain('NaVi');
    expect(prompt).toContain('FaZe');
    expect(prompt).toContain('BO3');
  });

  it('[2] містить коефіцієнти, коли передані', () => {
    const prompt = buildPrompt({
      team1: 'A', team2: 'B', format: 'BO1', tier: 'tier2',
      odds: { team1: 1.8, team2: 2.0 },
    });
    expect(prompt).toContain('1.8');
    expect(prompt).toContain('2');  // 2.0 → "2" у шаблонному рядку
  });
});

describe('parseAIResponse (src/lib/ai/shared.ts)', () => {
  const sampleResponse = `PREDICTION: NaVi
CONFIDENCE: 75
REASONING: NaVi has better recent form
SUGGESTED_BET: П1
RISK_LEVEL: low`;

  it('[1] коректно парсить prediction', () => {
    const result = parseAIResponse(sampleResponse);
    expect(result.prediction).toBe('NaVi');
  });

  it('[2] парсить confidence як число (не рядок)', () => {
    const result = parseAIResponse(sampleResponse);
    expect(result.confidence).toBe(75);
    expect(typeof result.confidence).toBe('number');
  });

  it('[3] порожній response → fallback-значення за замовчуванням', () => {
    const result = parseAIResponse('');
    expect(result.prediction).toBe('Немає прогнозу');
    expect(result.confidence).toBe(50);
    expect(result.riskLevel).toBe('medium');
  });
});

describe('getMockRecommendation (src/lib/ai/shared.ts)', () => {
  it('[1] повертає team1 як prediction, confidence 55-78, risk варіюється', () => {
    const result = getMockRecommendation(
      { team1: 'G2', team2: 'Vitality', format: 'BO3', tier: 'tier1' },
      'TestProvider',
    );
    expect(result.prediction).toBe('G2');
    expect(result.confidence).toBeGreaterThanOrEqual(55);
    expect(result.confidence).toBeLessThanOrEqual(78);
    expect(['low', 'medium', 'high']).toContain(result.riskLevel);
    expect(result.reasoning).toContain('TestProvider');
    expect(result.suggestedBet).toBeTruthy();
  });

  it('[2] повертає різні confidence для різних матчів', () => {
    const r1 = getMockRecommendation(
      { team1: 'NaVi', team2: 'FaZe', format: 'BO3', tier: 'tier1' },
      'TestProvider',
    );
    const r2 = getMockRecommendation(
      { team1: 'G2', team2: 'Heroic', format: 'BO1', tier: 'tier2' },
      'TestProvider',
    );
    // At least one should differ due to different hash
    const differs = r1.confidence !== r2.confidence || r1.suggestedBet !== r2.suggestedBet || r1.riskLevel !== r2.riskLevel;
    expect(differs).toBe(true);
  });
});
