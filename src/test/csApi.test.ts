/**
 * Unit tests: утиліти csApi
 * ============================
 * Файл, що тестується: `src/lib/csApi.ts`
 *
 * ПРИЗНАЧЕННЯ:
 *   Набір чистих функцій для трансформації даних з API cstest.pp.ua
 *   у формат, зрозумілий UI. Жодна з цих функцій не має сайд-ефектів,
 *   що робить їх ідеальними для unit-тестування.
 *
 * ТЕСТОВАНІ ФУНКЦІЇ:
 * ┌─────────────────────────────┬──────────────────────────────────┐
 * │ Функція                     │ Призначення                      │
 * ├─────────────────────────────┼──────────────────────────────────┤
 * │ parseMatchType(type)        │ Bo3/Bo1/Bo5 з рядка API         │
 * │ determineTier(pos1, pos2)   │ tier1/2/3 за позиціями команд   │
 * │ determineFavorite(...)      │ фаворит за меншою позицією      │
 * │ isMatchFinished(match)      │ чи завершено матч за рахунком   │
 * │ getMatchStatus(match)       │ upcoming/live/finished          │
 * │ getTotalMapsNeeded(type)    │ к-ть карт для перемоги          │
 * │ buildHltvUrl(link)          │ побудова HLTV URL з лінку API   │
 * └─────────────────────────────┴──────────────────────────────────┘
 *
 * ЩО ТЕСТУЄМО:
 * ┌────┬────────────────────────────────┬──────────────────────────┐
 * │  # │ Тест                           │ Очікуваний результат     │
 * ├────┼────────────────────────────────┼──────────────────────────┤
 * │  1 │ parseMatchType("bo3")          │ "Bo3"                    │
 * │  2 │ parseMatchType("bo1")          │ "Bo1"                    │
 * │  3 │ parseMatchType("bo5")          │ "Bo5"                    │
 * │  4 │ parseMatchType("def")          │ "Bo1" (default maps)     │
 * │  5 │ parseMatchType("unknown")      │ "Bo3" (fallback)         │
 * │  6 │ determineTier(pos ≤20)         │ "tier1"                  │
 * │  7 │ determineTier(21-50)           │ "tier2"                  │
 * │  8 │ determineTier(>50)             │ "tier3"                  │
 * │  9 │ determineTier(null, null)      │ "tier3" (999 sentinel)   │
 * │ 10 │ determineFavorite(...)         │ менша позиція → фаворит  │
 * │ 11 │ determineFavorite(null, null)  │ team1 (рівні sentinel)   │
 * │ 12 │ isMatchFinished(won)           │ true коли є переможець   │
 * │ 13 │ isMatchFinished(0-0)           │ false                    │
 * │ 14 │ getMatchStatus(finished)       │ "finished"               │
 * │ 15 │ getMatchStatus(upcoming)       │ "upcoming"               │
 * │ 16 │ buildHltvUrl(/matches/...)     │ https://www.hltv.org/... │
 * │ 17 │ buildHltvUrl(full http)        │ pass-through             │
 * │ 18 │ buildHltvUrl("")               │ ""                       │
 * └────┴────────────────────────────────┴──────────────────────────┘
 */

import { describe, it, expect } from 'vitest';
import {
  parseMatchType,
  determineTier,
  determineFavorite,
  isMatchFinished,
  getMatchStatus,
} from '@/lib/csApi';

// ═══════════════════════════════════════════════════════════════════
// parseMatchType
// ═══════════════════════════════════════════════════════════════════
describe('parseMatchType', () => {
  it('[1] "bo3" → "Bo3"', () => {
    expect(parseMatchType('bo3')).toBe('Bo3');
  });

  it('[2] "bo3 (Online)" (з додатковим контекстом) → "Bo3"', () => {
    expect(parseMatchType('bo3 (Online)')).toBe('Bo3');
  });

  it('[3] "bo1" → "Bo1"', () => {
    expect(parseMatchType('bo1')).toBe('Bo1');
  });

  it('[4] "bo5 (LAN)" → "Bo5"', () => {
    expect(parseMatchType('bo5 (LAN)')).toBe('Bo5');
  });

  it('[5] "def" (default) → "Bo1"', () => {
    expect(parseMatchType('def')).toBe('Bo1');
  });

  it('[6] невідомий рядок → "Bo3" (fallback)', () => {
    expect(parseMatchType('unknown_format')).toBe('Bo3');
  });

  it('[7] порожній рядок → "Bo3" (fallback)', () => {
    expect(parseMatchType('')).toBe('Bo3');
  });
});

// ═══════════════════════════════════════════════════════════════════
// determineTier
// ═══════════════════════════════════════════════════════════════════
describe('determineTier', () => {
  it('[8] обидві команди в топ-20 → "tier1"', () => {
    expect(determineTier(5, 15)).toBe('tier1');
  });

  it('[9] одна в топ-20, інша поза → "tier1" (краща визначає)', () => {
    expect(determineTier(18, 80)).toBe('tier1');
  });

  it('[10] позиції 21-50 → "tier2"', () => {
    expect(determineTier(25, 45)).toBe('tier2');
  });

  it('[11] позиція 51+ → "tier3"', () => {
    expect(determineTier(60, 120)).toBe('tier3');
  });

  it('[12] обидві null (невідомі позиції) → "tier3"', () => {
    expect(determineTier(null, null)).toBe('tier3');
  });

  it('[13] одна null, інша в топ-20 → "tier1"', () => {
    expect(determineTier(null, 10)).toBe('tier1');
  });
});

// ═══════════════════════════════════════════════════════════════════
// determineFavorite
// ═══════════════════════════════════════════════════════════════════
describe('determineFavorite', () => {
  it('[14] NaVi #5 vs FaZe #10 → NaVi фаворит', () => {
    expect(determineFavorite('NaVi', 'FaZe', 5, 10)).toBe('NaVi');
  });

  it('[15] G2 #20 vs Vitality #3 → Vitality фаворит', () => {
    expect(determineFavorite('G2', 'Vitality', 20, 3)).toBe('Vitality');
  });

  it('[16] однакові позиції → team1 (перша за алфавітом)', () => {
    expect(determineFavorite('A', 'B', 10, 10)).toBe('A');
  });

  it('[17] обидві null → team1', () => {
    expect(determineFavorite('TeamA', 'TeamB', null, null)).toBe('TeamA');
  });

  it('[18] одна null → відома позиція виграє', () => {
    expect(determineFavorite('Underdog', 'Fav', null, 5)).toBe('Fav');
  });
});

// ═══════════════════════════════════════════════════════════════════
// isMatchFinished
// ═══════════════════════════════════════════════════════════════════
describe('isMatchFinished', () => {
  const mkMatch = (type: string, score1: number, score2: number) => ({
    id: 1, date: '2026-06-18T10:00:00', link: '/match', type,
    score1, score2, stars: 0,
    nameTeam1: 'A', nameTeam2: 'B',
    lastChangeDateTeam1: null, lastChangeDateTeam2: null,
    positionTeam1: null, positionTeam2: null,
    logoTeam1: null, logoTeam2: null,
    predictionPercentTeam1: null, predictionPercentTeam2: null,
    bettingCoefficientTeam1: null, bettingCoefficientTeam2: null,
  });

  it('[19] BO3: 2-0 → finished (команда виграла 2 карти)', () => {
    expect(isMatchFinished(mkMatch('bo3', 2, 0))).toBe(true);
  });

  it('[20] BO3: 2-1 → finished', () => {
    expect(isMatchFinished(mkMatch('bo3', 2, 1))).toBe(true);
  });

  it('[21] BO3: 1-1 → НЕ finished (гра триває)', () => {
    expect(isMatchFinished(mkMatch('bo3', 1, 1))).toBe(false);
  });

  it('[22] BO3: 0-0 → НЕ finished', () => {
    expect(isMatchFinished(mkMatch('bo3', 0, 0))).toBe(false);
  });

  it('[23] BO1: 1-0 → finished', () => {
    expect(isMatchFinished(mkMatch('bo1', 1, 0))).toBe(true);
  });

  it('[24] BO1: 0-0 → НЕ finished', () => {
    expect(isMatchFinished(mkMatch('bo1', 0, 0))).toBe(false);
  });

  it('[25] BO5: 3-1 → finished', () => {
    expect(isMatchFinished(mkMatch('bo5', 3, 1))).toBe(true);
  });

  it('[26] BO5: 2-2 → НЕ finished', () => {
    expect(isMatchFinished(mkMatch('bo5', 2, 2))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// getMatchStatus
// ═══════════════════════════════════════════════════════════════════
describe('getMatchStatus', () => {
  it('[27] завершений матч → "finished" (BO3 2-0)', () => {
    const match = {
      id: 1, date: '2026-06-18T10:00:00', link: '/m', type: 'bo3',
      score1: 2, score2: 0, stars: 0,
      nameTeam1: 'A', nameTeam2: 'B',
      lastChangeDateTeam1: null, lastChangeDateTeam2: null,
      positionTeam1: null, positionTeam2: null,
      logoTeam1: null, logoTeam2: null,
      predictionPercentTeam1: null, predictionPercentTeam2: null,
      bettingCoefficientTeam1: null, bettingCoefficientTeam2: null,
    };
    expect(getMatchStatus(match)).toBe('finished');
  });

  it('[28] майбутній матч → "upcoming"', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const match = {
      id: 1, date: futureDate.toISOString(), link: '/m', type: 'bo3',
      score1: 0, score2: 0, stars: 0,
      nameTeam1: 'A', nameTeam2: 'B',
      lastChangeDateTeam1: null, lastChangeDateTeam2: null,
      positionTeam1: null, positionTeam2: null,
      logoTeam1: null, logoTeam2: null,
      predictionPercentTeam1: null, predictionPercentTeam2: null,
      bettingCoefficientTeam1: null, bettingCoefficientTeam2: null,
    };
    expect(getMatchStatus(match)).toBe('upcoming');
  });
});

// ═══════════════════════════════════════════════════════════════════
// buildHltvUrl (inline-копія з Matches.tsx)
// ═══════════════════════════════════════════════════════════════════
function buildHltvUrl(link: string): string {
  if (!link) return '';
  if (link.startsWith('http://') || link.startsWith('https://')) return link;
  return `https://www.hltv.org${link.startsWith('/') ? '' : '/'}${link}`;
}

describe('buildHltvUrl (з Matches.tsx)', () => {
  it('[29] відносний шлях "/matches/123/team1-vs-team2" → повний HLTV URL', () => {
    expect(buildHltvUrl('/matches/123/team1-vs-team2')).toBe(
      'https://www.hltv.org/matches/123/team1-vs-team2'
    );
  });

  it('[30] відносний без слеша "matches/456" → додає /', () => {
    expect(buildHltvUrl('matches/456')).toBe('https://www.hltv.org/matches/456');
  });

  it('[31] вже повний https URL → pass-through', () => {
    expect(buildHltvUrl('https://example.com/match')).toBe('https://example.com/match');
  });

  it('[32] вже повний http URL → pass-through', () => {
    expect(buildHltvUrl('http://example.com/match')).toBe('http://example.com/match');
  });

  it('[33] порожній рядок → ""', () => {
    expect(buildHltvUrl('')).toBe('');
  });
});
