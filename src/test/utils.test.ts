import { describe, it, expect } from 'vitest';

/** Normalize bet date string (DD.MM.YYYY or YYYY-MM-DD) → YYYY-MM-DD */
function normalizeDateStr(dateStr: string): string {
  if (!dateStr) return '';
  const dotMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) return `${dotMatch[3]}-${dotMatch[2].padStart(2, '0')}-${dotMatch[1].padStart(2, '0')}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) return `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`;
  return dateStr;
}

describe('normalizeDateStr', () => {
  it('converts DD.MM.YYYY to YYYY-MM-DD', () => {
    expect(normalizeDateStr('18.06.2026')).toBe('2026-06-18');
  });

  it('converts single-digit day/month', () => {
    expect(normalizeDateStr('1.5.2026')).toBe('2026-05-01');
  });

  it('passes through YYYY-MM-DD unchanged', () => {
    expect(normalizeDateStr('2026-06-18')).toBe('2026-06-18');
  });

  it('converts DD/MM/YYYY to YYYY-MM-DD', () => {
    expect(normalizeDateStr('18/06/2026')).toBe('2026-06-18');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeDateStr('')).toBe('');
  });
});

import { buildPrompt, parseAIResponse, getMockRecommendation } from '@/lib/ai/shared';

describe('buildPrompt', () => {
  it('includes team names and format', () => {
    const prompt = buildPrompt({
      team1: 'NaVi', team2: 'FaZe', format: 'BO3', tier: 'tier1',
    });
    expect(prompt).toContain('NaVi');
    expect(prompt).toContain('FaZe');
    expect(prompt).toContain('BO3');
  });

  it('includes odds when provided', () => {
    const prompt = buildPrompt({
      team1: 'A', team2: 'B', format: 'BO1', tier: 'tier2',
      odds: { team1: 1.8, team2: 2.0 },
    });
    expect(prompt).toContain('1.8');
    expect(prompt).toContain('2');  // 2.0 renders as "2" in template literal
  });
});

describe('parseAIResponse', () => {
  const sampleResponse = `PREDICTION: NaVi
CONFIDENCE: 75
REASONING: NaVi has better recent form
SUGGESTED_BET: П1
RISK_LEVEL: low`;

  it('parses prediction correctly', () => {
    const result = parseAIResponse(sampleResponse);
    expect(result.prediction).toBe('NaVi');
  });

  it('parses confidence as number', () => {
    const result = parseAIResponse(sampleResponse);
    expect(result.confidence).toBe(75);
  });

  it('falls back to defaults on empty input', () => {
    const result = parseAIResponse('');
    expect(result.prediction).toBe('Немає прогнозу');
    expect(result.confidence).toBe(50);
    expect(result.riskLevel).toBe('medium');
  });
});

describe('getMockRecommendation', () => {
  it('returns team1 as prediction', () => {
    const result = getMockRecommendation(
      { team1: 'G2', team2: 'Vitality', format: 'BO3', tier: 'tier1' },
      'TestProvider',
    );
    expect(result.prediction).toBe('G2');
    expect(result.confidence).toBe(65);
    expect(result.riskLevel).toBe('medium');
  });
});
