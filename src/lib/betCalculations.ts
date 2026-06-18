/**
 * Betting calculation utilities shared by CS2BettingForm.
 * All functions are pure — they don't depend on React state or DOM.
 */

/** Calculate total express odds from individual events */
export function calcTotalExpressOdds(expressEvents: Array<{ odds: string }>): number {
  if (expressEvents.length === 0) return 1;
  const validEvents = expressEvents.filter(e => e.odds && parseFloat(e.odds) > 0);
  if (validEvents.length === 0) return 1;
  return validEvents.reduce((total, event) => total * parseFloat(event.odds), 1);
}

/** Get effective odds — express total or single bet */
export function getEffectiveOdds(
  betCategory: string,
  expressEvents: Array<{ odds: string }>,
  singleOdds: string,
): number {
  if (betCategory === 'Експрес') {
    return calcTotalExpressOdds(expressEvents);
  }
  return parseFloat(singleOdds) || 0;
}

/** Calculate Expected Value: EV = (p × (odds-1)) − ((1-p) × 1), returns % */
export function calcExpectedValue(
  betCategory: string,
  expressEvents: Array<{ odds: string }>,
  singleOdds: string,
  confidence: string,
): string {
  const odds = getEffectiveOdds(betCategory, expressEvents, singleOdds);
  const p = parseFloat(confidence);
  if (odds > 0 && p > 0) {
    const ev = ((p / 100) * (odds - 1)) - ((1 - p / 100) * 1);
    return (ev * 100).toFixed(2);
  }
  return '0';
}

/** Calculate potential profit: (odds - 1) × stake */
export function calcPotentialProfit(
  betCategory: string,
  expressEvents: Array<{ odds: string }>,
  singleOdds: string,
  stake: string,
): string {
  const odds = getEffectiveOdds(betCategory, expressEvents, singleOdds);
  const s = parseFloat(stake);
  if (odds > 0 && s > 0) {
    return ((odds - 1) * s).toFixed(2);
  }
  return '0';
}

/** Bookmaker implied probability */
export function calcBookmakerProbability(
  betCategory: string,
  expressEvents: Array<{ odds: string }>,
  singleOdds: string,
): number | null {
  const odds = getEffectiveOdds(betCategory, expressEvents, singleOdds);
  if (!odds || odds <= 1) return null;
  return (1 / odds) * 100;
}

export interface ValueBetAnalysis {
  bookmakerProb: string;
  userProb: string;
  diff: string;
  isValueBet: boolean;
  message: string;
}

/** Compare user confidence vs bookmaker implied probability */
export function getValueBetAnalysis(
  betCategory: string,
  expressEvents: Array<{ odds: string }>,
  singleOdds: string,
  confidence: string,
): ValueBetAnalysis | null {
  const c = parseFloat(confidence);
  const bookmakerProb = calcBookmakerProbability(betCategory, expressEvents, singleOdds);
  if (!c || !bookmakerProb) return null;

  const diff = c - bookmakerProb;
  const isValueBet = diff > 0;
  const edgePercent = Math.abs(diff);

  return {
    bookmakerProb: bookmakerProb.toFixed(1),
    userProb: c.toFixed(1),
    diff: edgePercent.toFixed(1),
    isValueBet,
    message: isValueBet
      ? `Ви оцінюєте подію на ${edgePercent.toFixed(1)}% вище за букмекера (Value Bet)`
      : `Букмекер оцінює подію на ${edgePercent.toFixed(1)}% вище за вас`,
  };
}

/** Overconfidence warning for high confidence + low odds */
export function getOverconfidenceWarning(
  betCategory: string,
  expressEvents: Array<{ odds: string }>,
  singleOdds: string,
  confidence: string,
): string | null {
  const c = parseFloat(confidence);
  if (!c) return null;

  const currentOdds = getEffectiveOdds(betCategory, expressEvents, singleOdds);
  if (!currentOdds || currentOdds <= 1) return null;

  if (c >= 85 && currentOdds >= 1.6) {
    return `Ви вказали дуже високу впевненість (${c}%) при коефіцієнті ${currentOdds.toFixed(2)}. Букмекер оцінює ймовірність ~${(100 / currentOdds).toFixed(0)}%. Ви впевнені, що не емоціонуєте?`;
  }
  if (c >= 80 && currentOdds >= 2.0) {
    return `Коефіцієнт ${currentOdds.toFixed(2)} вказує на рівний матч, але ваша впевненість ${c}%. Перевірте, чи не завищуєте оцінку.`;
  }

  return null;
}

export interface KellyResult {
  fullKelly: string;
  halfKelly: string;
  fullKellyAmount: number;
  halfKellyAmount: number;
  uncappedHalfKellyAmount: number;
  currentBankroll: number;
  maxAllowedAmount: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
  recommendedAmount: number;
  isNegative: boolean;
  isCapped: boolean;
  recommendedBankrollPercent: string;
}

/** Calculate Kelly Criterion with half-Kelly recommendation */
export function calcKellyCriterion(
  betCategory: string,
  expressEvents: Array<{ odds: string }>,
  singleOdds: string,
  confidence: string,
  currentBankroll: number,
  maxStakePercent: number = 7,
): KellyResult | null {
  const odds = getEffectiveOdds(betCategory, expressEvents, singleOdds);
  const c = parseFloat(confidence);

  if (!odds || odds <= 1 || !c) return null;

  const p = c / 100;
  const q = 1 - p;
  const b = odds - 1;
  const kellyFraction = (b * p - q) / b;

  if (currentBankroll <= 0) return null;

  const maxStakeFraction = maxStakePercent / 100;
  const fullKelly = Math.max(0, kellyFraction);
  const fullKellyAmount = fullKelly * currentBankroll;
  const halfKelly = fullKelly / 2;
  const halfKellyAmount = halfKelly * currentBankroll;
  const maxAllowedAmount = currentBankroll * maxStakeFraction;
  const cappedHalfKellyAmount = Math.min(halfKellyAmount, maxAllowedAmount);
  const cappedFullKellyAmount = Math.min(fullKellyAmount, maxAllowedAmount);
  const isCapped = halfKellyAmount > maxAllowedAmount;

  const recommendedBankrollPercent = currentBankroll > 0
    ? ((cappedHalfKellyAmount / currentBankroll) * 100).toFixed(1)
    : '0';

  let riskLevel: 'low' | 'medium' | 'high';
  let recommendation: string;
  let recommendedAmount: number;

  if (kellyFraction <= 0) {
    riskLevel = 'high';
    recommendation = 'Критерій Келлі не рекомендує цю ставку. Математично невигідно.';
    recommendedAmount = 0;
  } else if (isCapped) {
    riskLevel = 'high';
    recommendation = `Келлі рекомендує ${Math.round(halfKellyAmount)} ₴ (${(halfKelly * 100).toFixed(1)}% банку), але ліміт ${maxStakePercent}% обмежує до ${Math.round(maxAllowedAmount)} ₴`;
    recommendedAmount = Math.round(maxAllowedAmount);
  } else if (fullKelly <= 0.05) {
    riskLevel = 'low';
    recommendation = `Помірна впевненість → ${Math.round(cappedHalfKellyAmount)} ₴ (${recommendedBankrollPercent}% банку)`;
    recommendedAmount = Math.round(cappedHalfKellyAmount);
  } else if (fullKelly <= 0.15) {
    riskLevel = 'medium';
    recommendation = `Висока впевненість → ${Math.round(cappedHalfKellyAmount)} ₴ (${recommendedBankrollPercent}% банку)`;
    recommendedAmount = Math.round(cappedHalfKellyAmount);
  } else {
    riskLevel = 'high';
    recommendation = `Ризик великий → рекомендовано ${Math.round(cappedHalfKellyAmount)} ₴ (${recommendedBankrollPercent}% банку) замість ${Math.round(cappedFullKellyAmount)} ₴`;
    recommendedAmount = Math.round(cappedHalfKellyAmount);
  }

  return {
    fullKelly: (fullKelly * 100).toFixed(1),
    halfKelly: (halfKelly * 100).toFixed(1),
    fullKellyAmount: Math.round(cappedFullKellyAmount),
    halfKellyAmount: Math.round(cappedHalfKellyAmount),
    uncappedHalfKellyAmount: Math.round(halfKellyAmount),
    currentBankroll: Math.round(currentBankroll),
    maxAllowedAmount: Math.round(maxAllowedAmount),
    riskLevel,
    recommendation,
    recommendedAmount: Math.round(recommendedAmount),
    isNegative: kellyFraction <= 0,
    isCapped,
    recommendedBankrollPercent,
  };
}

/** Express risk level based on event count */
export function getExpressRiskLevel(expressEventCount: number) {
  if (expressEventCount <= 3) return { level: 'moderate' as const, color: 'green', text: 'Помірний ризик', progress: 33 };
  if (expressEventCount <= 6) return { level: 'elevated' as const, color: 'orange', text: 'Підвищений ризик', progress: 66 };
  return { level: 'high' as const, color: 'red', text: 'Високий ризик', progress: 100 };
}

/** EV verdict emoji/text */
export function getEVVerdict(ev: number) {
  if (ev > 5) return { icon: '✅', text: 'Позитивний прогноз', color: 'green', description: 'Математично вигідний прогноз з хорошим потенціалом' };
  if (ev > 0) return { icon: '⚠️', text: 'Сумнівна ставка', color: 'yellow', description: 'Невелика позитивна вартість, потрібна висока впевненість' };
  return { icon: '❌', text: 'Негативний прогноз', color: 'red', description: 'Математично невигідний прогноз, високий ризик втрат' };
}
