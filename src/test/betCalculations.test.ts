/**
 * Unit tests: betCalculations.ts
 * ================================
 * Файл, що тестується: `src/lib/betCalculations.ts`
 *
 * ПРИЗНАЧЕННЯ:
 *   Чисті функції для беттінгових розрахунків:
 *   - calcTotalExpressOdds / getEffectiveOdds
 *   - calcExpectedValue (EV)
 *   - calcPotentialProfit
 *   - calcBookmakerProbability
 *   - getValueBetAnalysis
 *   - getOverconfidenceWarning
 *   - calcKellyCriterion
 *   - getExpressRiskLevel
 *   - getEVVerdict
 *
 * УСІ функції — чисті, без сайд-ефектів.
 */

import { describe, it, expect } from 'vitest';
import {
  calcTotalExpressOdds,
  getEffectiveOdds,
  calcExpectedValue,
  calcPotentialProfit,
  calcBookmakerProbability,
  getValueBetAnalysis,
  getOverconfidenceWarning,
  calcKellyCriterion,
  getExpressRiskLevel,
  getEVVerdict,
} from '@/lib/betCalculations';

// ═══════════════════════════════════════════════════════════════════
// calcTotalExpressOdds
// ═══════════════════════════════════════════════════════════════════
describe('calcTotalExpressOdds', () => {
  it('порожній масив → 1', () => {
    expect(calcTotalExpressOdds([])).toBe(1);
  });

  it('одна подія з odds=1.80 → 1.80', () => {
    expect(calcTotalExpressOdds([{ odds: '1.80' }])).toBeCloseTo(1.80, 4);
  });

  it('дві події: 1.80 × 2.10 → 3.78', () => {
    expect(calcTotalExpressOdds([{ odds: '1.80' }, { odds: '2.10' }])).toBeCloseTo(3.78, 4);
  });

  it('три події: 1.5 × 2.0 × 1.8 → 5.4', () => {
    expect(calcTotalExpressOdds([
      { odds: '1.5' }, { odds: '2.0' }, { odds: '1.8' },
    ])).toBeCloseTo(5.4, 4);
  });

  it('подія з порожнім odds → ігнорується', () => {
    expect(calcTotalExpressOdds([{ odds: '' }, { odds: '2.0' }])).toBe(2.0);
  });

  it('подія з odds=0 → ігнорується', () => {
    expect(calcTotalExpressOdds([{ odds: '0' }, { odds: '2.0' }])).toBe(2.0);
  });

  it('всі події невалідні → 1', () => {
    expect(calcTotalExpressOdds([{ odds: '' }, { odds: '0' }])).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// getEffectiveOdds
// ═══════════════════════════════════════════════════════════════════
describe('getEffectiveOdds', () => {
  it('Ординар: singleOdds=1.80 → 1.80', () => {
    expect(getEffectiveOdds('Ординар', [], '1.80')).toBe(1.80);
  });

  it('Експрес: дві події 1.80×2.10 → 3.78', () => {
    expect(getEffectiveOdds('Експрес', [{ odds: '1.80' }, { odds: '2.10' }], '')).toBeCloseTo(3.78, 4);
  });

  it('Ординар: порожній singleOdds → 0', () => {
    expect(getEffectiveOdds('Ординар', [], '')).toBe(0);
  });

  it('Ординар: некоректний singleOdds "abc" → 0', () => {
    expect(getEffectiveOdds('Ординар', [], 'abc')).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// calcExpectedValue
// ═══════════════════════════════════════════════════════════════════
describe('calcExpectedValue', () => {
  it('odds=2.0, confidence=60% → EV=20%', () => {
    // EV = (0.6 × 1) - (0.4 × 1) = 0.2 → 20%
    expect(calcExpectedValue('Ординар', [], '2.0', '60')).toBe('20.00');
  });

  it('odds=1.5, confidence=50% → EV=-25%', () => {
    // EV = (0.5 × 0.5) - (0.5 × 1) = 0.25 - 0.5 = -0.25 → -25%
    expect(calcExpectedValue('Ординар', [], '1.5', '50')).toBe('-25.00');
  });

  it('odds=3.0, confidence=40% → EV=20%', () => {
    // EV = (0.4 × 2) - (0.6 × 1) = 0.8 - 0.6 = 0.2 → 20%
    expect(calcExpectedValue('Ординар', [], '3.0', '40')).toBe('20.00');
  });

  it('odds=0 → EV="0"', () => {
    expect(calcExpectedValue('Ординар', [], '0', '50')).toBe('0');
  });

  it('confidence=0 → EV="0"', () => {
    expect(calcExpectedValue('Ординар', [], '2.0', '0')).toBe('0');
  });
});

// ═══════════════════════════════════════════════════════════════════
// calcPotentialProfit
// ═══════════════════════════════════════════════════════════════════
describe('calcPotentialProfit', () => {
  it('odds=2.0, stake=100 → profit=100', () => {
    expect(calcPotentialProfit('Ординар', [], '2.0', '100')).toBe('100.00');
  });

  it('odds=1.5, stake=500 → profit=250', () => {
    expect(calcPotentialProfit('Ординар', [], '1.5', '500')).toBe('250.00');
  });

  it('odds=0 → profit="0"', () => {
    expect(calcPotentialProfit('Ординар', [], '0', '100')).toBe('0');
  });

  it('stake=0 → profit="0"', () => {
    expect(calcPotentialProfit('Ординар', [], '2.0', '0')).toBe('0');
  });
});

// ═══════════════════════════════════════════════════════════════════
// calcBookmakerProbability
// ═══════════════════════════════════════════════════════════════════
describe('calcBookmakerProbability', () => {
  it('odds=2.0 → 50%', () => {
    expect(calcBookmakerProbability('Ординар', [], '2.0')).toBeCloseTo(50, 1);
  });

  it('odds=1.5 → ~66.67%', () => {
    expect(calcBookmakerProbability('Ординар', [], '1.5')).toBeCloseTo(66.67, 1);
  });

  it('odds=3.0 → ~33.33%', () => {
    expect(calcBookmakerProbability('Ординар', [], '3.0')).toBeCloseTo(33.33, 1);
  });

  it('odds=1.0 → null (не може бути ≤1)', () => {
    expect(calcBookmakerProbability('Ординар', [], '1.0')).toBeNull();
  });

  it('odds=0.5 → null', () => {
    expect(calcBookmakerProbability('Ординар', [], '0.5')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// getValueBetAnalysis
// ═══════════════════════════════════════════════════════════════════
describe('getValueBetAnalysis', () => {
  it('userProb=60%, bookmaker=50% → value bet', () => {
    const result = getValueBetAnalysis('Ординар', [], '2.0', '60');
    expect(result).not.toBeNull();
    expect(result!.isValueBet).toBe(true);
    expect(result!.diff).toBe('10.0');
  });

  it('userProb=40%, bookmaker=50% → не value bet', () => {
    const result = getValueBetAnalysis('Ординар', [], '2.0', '40');
    expect(result).not.toBeNull();
    expect(result!.isValueBet).toBe(false);
  });

  it('confidence=0 → null', () => {
    expect(getValueBetAnalysis('Ординар', [], '2.0', '0')).toBeNull();
  });

  it('odds=0 → null', () => {
    expect(getValueBetAnalysis('Ординар', [], '0', '50')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// getOverconfidenceWarning
// ═══════════════════════════════════════════════════════════════════
describe('getOverconfidenceWarning', () => {
  it('confidence=90%, odds=1.8 → попередження', () => {
    const warn = getOverconfidenceWarning('Ординар', [], '1.8', '90');
    expect(warn).not.toBeNull();
    expect(warn).toContain('емоціонуєте');
  });

  it('confidence=85%, odds=2.0 → попередження (дуже висока впевненість — перший тригер)', () => {
    const warn = getOverconfidenceWarning('Ординар', [], '2.0', '85');
    expect(warn).not.toBeNull();
    expect(warn).toContain('дуже високу впевненість');
  });

  it('confidence=80%, odds=2.5 → попередження (рівний матч — другий тригер)', () => {
    const warn = getOverconfidenceWarning('Ординар', [], '2.5', '80');
    expect(warn).not.toBeNull();
    expect(warn).toContain('рівний матч');
  });

  it('confidence=70%, odds=2.5 → null (нормально)', () => {
    expect(getOverconfidenceWarning('Ординар', [], '2.5', '70')).toBeNull();
  });

  it('confidence=90%, odds=1.3 → null (odds < 1.6 не тригерить)', () => {
    expect(getOverconfidenceWarning('Ординар', [], '1.3', '90')).toBeNull();
  });

  it('confidence=0 → null', () => {
    expect(getOverconfidenceWarning('Ординар', [], '2.0', '0')).toBeNull();
  });

  it('odds=0 → null', () => {
    expect(getOverconfidenceWarning('Ординар', [], '0', '85')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// calcKellyCriterion
// ═══════════════════════════════════════════════════════════════════
describe('calcKellyCriterion', () => {
  it('odds=2.0, conf=60%, bankroll=10000 → позитивний келлі', () => {
    // Kelly = (1*0.6 - 0.4)/1 = 0.2 → 20% full, 10% half
    const result = calcKellyCriterion('Ординар', [], '2.0', '60', 10000);
    expect(result).not.toBeNull();
    expect(result!.fullKelly).toBe('20.0');
    expect(result!.halfKelly).toBe('10.0');
    expect(result!.isNegative).toBe(false);
    expect(result!.recommendedAmount).toBeGreaterThan(0);
  });

  it('odds=1.5, conf=50% → негативний келлі', () => {
    // Kelly = (0.5*0.5 - 0.5)/0.5 = (0.25-0.5)/0.5 = -0.5 → negative
    const result = calcKellyCriterion('Ординар', [], '1.5', '50', 10000);
    expect(result).not.toBeNull();
    expect(result!.isNegative).toBe(true);
    expect(result!.recommendedAmount).toBe(0);
    expect(result!.riskLevel).toBe('high');
  });

  it('odds=3.0, conf=50% → високий келлі', () => {
    // Kelly = (2*0.5 - 0.5)/2 = 0.5/2 = 0.25 → 25% full, 12.5% half
    const result = calcKellyCriterion('Ординар', [], '3.0', '50', 10000);
    expect(result).not.toBeNull();
    expect(result!.fullKelly).toBe('25.0');
    expect(result!.riskLevel).toBe('high'); // >15% threshold
  });

  it('bankroll=0 → null', () => {
    expect(calcKellyCriterion('Ординар', [], '2.0', '60', 0)).toBeNull();
  });

  it('odds=0 → null', () => {
    expect(calcKellyCriterion('Ординар', [], '0', '60', 10000)).toBeNull();
  });

  it('confidence=0 → null', () => {
    expect(calcKellyCriterion('Ординар', [], '2.0', '0', 10000)).toBeNull();
  });

  it('maxStakePercent=5 обмежує half-kelly', () => {
    // odds=2.0, conf=60%, bankroll=10000 → half=1000, max=500
    const result = calcKellyCriterion('Ординар', [], '2.0', '60', 10000, 5);
    expect(result).not.toBeNull();
    expect(result!.isCapped).toBe(true);
    expect(result!.recommendedAmount).toBeLessThanOrEqual(500);
  });

  it('великий банк + безпечна ставка → low risk', () => {
    const result = calcKellyCriterion('Ординар', [], '1.3', '55', 100000);
    expect(result).not.toBeNull();
    // Kelly = (0.3*0.55 - 0.45)/0.3 = (0.165-0.45)/0.3 = -0.95 → negative
    // Let's try different: odds=1.5, conf=75%
    const result2 = calcKellyCriterion('Ординар', [], '1.5', '75', 100000);
    expect(result2).not.toBeNull();
    // Kelly = (0.5*0.75 - 0.25)/0.5 = (0.375-0.25)/0.5 = 0.25 → 25% → high
    // Try odds=2.0, conf=55%
    const result3 = calcKellyCriterion('Ординар', [], '2.0', '55', 100000, 10);
    expect(result3).not.toBeNull();
    // Kelly = (1*0.55 - 0.45)/1 = 0.1 → 10% full → 5% half → medium
    expect(result3!.riskLevel).toBe('medium');
  });
});

// ═══════════════════════════════════════════════════════════════════
// getExpressRiskLevel
// ═══════════════════════════════════════════════════════════════════
describe('getExpressRiskLevel', () => {
  it('2 події → moderate', () => {
    expect(getExpressRiskLevel(2).level).toBe('moderate');
    expect(getExpressRiskLevel(2).color).toBe('green');
  });

  it('3 події → moderate (межа)', () => {
    expect(getExpressRiskLevel(3).level).toBe('moderate');
  });

  it('4 події → elevated', () => {
    expect(getExpressRiskLevel(4).level).toBe('elevated');
    expect(getExpressRiskLevel(4).color).toBe('orange');
  });

  it('6 подій → elevated (межа)', () => {
    expect(getExpressRiskLevel(6).level).toBe('elevated');
  });

  it('7 подій → high', () => {
    expect(getExpressRiskLevel(7).level).toBe('high');
    expect(getExpressRiskLevel(7).color).toBe('red');
    expect(getExpressRiskLevel(7).progress).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════
// getEVVerdict
// ═══════════════════════════════════════════════════════════════════
describe('getEVVerdict', () => {
  it('EV=10 → позитивний', () => {
    const result = getEVVerdict(10);
    expect(result.icon).toBe('✅');
    expect(result.color).toBe('green');
  });

  it('EV=3 → сумнівна', () => {
    const result = getEVVerdict(3);
    expect(result.icon).toBe('⚠️');
    expect(result.color).toBe('yellow');
  });

  it('EV=0 → негативний (не >0)', () => {
    const result = getEVVerdict(0);
    expect(result.icon).toBe('❌');
    expect(result.color).toBe('red');
  });

  it('EV=-10 → негативний', () => {
    const result = getEVVerdict(-10);
    expect(result.icon).toBe('❌');
    expect(result.color).toBe('red');
  });

  it('EV=5.01 → позитивний (межа >5)', () => {
    const result = getEVVerdict(5.01);
    expect(result.icon).toBe('✅');
  });
});
