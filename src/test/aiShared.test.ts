/**
 * Unit tests: parseAIResponse — edge cases
 * ==========================================
 * Файл, що тестується: `src/lib/ai/shared.ts` → parseAIResponse()
 *
 * ПРИЗНАЧЕННЯ:
 *   Парсить текстовий response від AI (Gemini / OpenRouter) у
 *   структурований об'єкт AIRecommendation. Підтримує:
 *     • Багаторядковий reasoning
 *     • Відсутні поля → fallback-значення
 *     • Неправильний risk_level → "medium"
 *     • Неповний confidence (з текстом) → витягує число
 *
 * НОВІ ТЕСТИ (доповнюють utils.test.ts):
 * ┌────┬────────────────────────────────┬──────────────────────────┐
 * │  # │ Тест                           │ Очікуваний результат     │
 * ├────┼────────────────────────────────┼──────────────────────────┤
 * │  1 │ Багаторядковий reasoning       │ Повний текст між          │
 * │    │                                │ REASONING: та SUGGESTED  │
 * │  2 │ RISK_LEVEL: "HIGH"             │ riskLevel = "high"       │
 * │  3 │ RISK_LEVEL: "unknown"          │ fallback → "medium"      │
 * │  4 │ CONFIDENCE: "75%"              │ confidence = 75          │
 * │  5 │ Відсутній SUGGESTED_BET        │ "Немає рекомендації"     │
 * │  6 │ Порожні поля після двокрапки   │ fallback для кожного     │
 * │  7 │ Всі поля в одному рядку        │ Коректний парсинг        │
 * │  8 │ Unicode/кірилиця в prediction  │ "Рівні шанси"            │
 * └────┴────────────────────────────────┴──────────────────────────┘
 */

import { describe, it, expect } from 'vitest';
import { parseAIResponse } from '@/lib/ai/shared';

describe('parseAIResponse — edge cases', () => {
  it('[1] багаторядковий reasoning (текст між REASONING та SUGGESTED_BET)', () => {
    const response = `PREDICTION: FaZe
CONFIDENCE: 82
REASONING: FaZe має сильнішу форму останнім часом.
Вони виграли 4 з 5 останніх матчів проти топ-команд.
Карта Mirage — одна з найкращих для них.
SUGGESTED_BET: П2
RISK_LEVEL: low`;

    const result = parseAIResponse(response);
    expect(result.prediction).toBe('FaZe');
    expect(result.confidence).toBe(82);
    expect(result.reasoning).toContain('Mirage');
    expect(result.reasoning).toContain('4 з 5');
    expect(result.suggestedBet).toBe('П2');
    expect(result.riskLevel).toBe('low');
  });

  it('[2] RISK_LEVEL: "HIGH" (верхній регістр) → "high"', () => {
    const response = `PREDICTION: Vitality
CONFIDENCE: 60
REASONING: Важкий матч.
SUGGESTED_BET: П1
RISK_LEVEL: HIGH`;

    const result = parseAIResponse(response);
    expect(result.riskLevel).toBe('high');
  });

  it('[3] RISK_LEVEL: "unknown_value" → fallback "medium"', () => {
    const response = `PREDICTION: NaVi
CONFIDENCE: 70
REASONING: Normal.
SUGGESTED_BET: П1
RISK_LEVEL: whatever`;

    const result = parseAIResponse(response);
    expect(result.riskLevel).toBe('medium');
  });

  it('[4] CONFIDENCE: "75%" (з відсотком) → 75 (число)', () => {
    const response = `PREDICTION: G2
CONFIDENCE: 75%
REASONING: Test.
SUGGESTED_BET: П1
RISK_LEVEL: low`;

    const result = parseAIResponse(response);
    expect(result.confidence).toBe(75);
  });

  it('[5] відсутній SUGGESTED_BET → fallback', () => {
    const response = `PREDICTION: Astralis
CONFIDENCE: 55
REASONING: Good.
RISK_LEVEL: low`;

    const result = parseAIResponse(response);
    expect(result.prediction).toBe('Astralis');
    expect(result.suggestedBet).toBe('Немає рекомендації');
  });

  it('[6] порожні значення після двокрапки → fallback', () => {
    const response = `PREDICTION:
CONFIDENCE:
REASONING:
SUGGESTED_BET:
RISK_LEVEL:`;

    const result = parseAIResponse(response);
    expect(result.prediction).toBe('Немає прогнозу');
    expect(result.confidence).toBe(50);
    expect(result.reasoning).toBe('Аналіз недоступний');
    expect(result.suggestedBet).toBe('Немає рекомендації');
    expect(result.riskLevel).toBe('medium');
  });

  it('[7] всі поля в одному рядку (через пробіл) — парсить що може', () => {
    const response = 'PREDICTION: NaVi CONFIDENCE: 80 SUGGESTED_BET: П1 RISK_LEVEL: low';
    const result = parseAIResponse(response);
    // Має знайти хоча б prediction
    expect(result.prediction).toContain('NaVi');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('[8] prediction кирилицею "Рівні шанси" — зберігається', () => {
    const response = `PREDICTION: Рівні шанси
CONFIDENCE: 50
REASONING: Складно визначити фаворита.
SUGGESTED_BET: Тотал більше 2.5
RISK_LEVEL: medium`;

    const result = parseAIResponse(response);
    expect(result.prediction).toBe('Рівні шанси');
    expect(result.suggestedBet).toBe('Тотал більше 2.5');
  });

  it('[9] reasoning зі спецсимволами (дужки, тире, коми)', () => {
    const response = `PREDICTION: MOUZ
CONFIDENCE: 68
REASONING: MOUZ (ex-ENCE) має кращу статистику на Ancient (75% win-rate).
SUGGESTED_BET: П1
RISK_LEVEL: low`;

    const result = parseAIResponse(response);
    expect(result.reasoning).toContain('ex-ENCE');
    expect(result.reasoning).toContain('75%');
  });
});
