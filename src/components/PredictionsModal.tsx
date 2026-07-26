import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  Dice5,
  Trophy,
  Swords,
  BarChart3,
  Shuffle,
  Target,
  CheckCircle2,
  Info,
  Zap,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import type { Match } from "@/hooks/useMatches";

// ── Types ──

interface PredictionResult {
  team1Win: number;
  team2Win: number;
  confidence: number;
  weight: number;
  label: string;
  note?: string;
}

interface SimulationResult {
  team1Wins: number;
  team2Wins: number;
  scores: Record<string, number>;
  totalSims: number;
  analytic: boolean;
}

interface WeightedConsensusResult {
  team1Win: number;
  team2Win: number;
  methods: Array<{
    label: string;
    team1Win: number;
    team2Win: number;
    weight: number;
  }>;
  disagreementIndex: number;
  evTeam1: number | null;
  evTeam2: number | null;
  edge: "value" | "aligned" | "volatile" | "unknown";
}

// ═══════════════════════════════════════════
// 1. BOOKMAKER — Power method + EV
// ═══════════════════════════════════════════

/**
 * Power (multiplicative) margin removal via binary search.
 * Distributes margin proportionally — more realistic than additive.
 */
function fairProbability(
  coeff1: number,
  coeff2: number,
): { prob1: number; prob2: number; margin: number } | null {
  if (coeff1 <= 1 || coeff2 <= 1) return null;

  const imp1 = 1 / coeff1;
  const imp2 = 1 / coeff2;
  const margin = Math.round((imp1 + imp2 - 1) * 100 * 10) / 10;

  // Binary search k ∈ [0.2, 2.0] such that imp1^(1/k) + imp2^(1/k) = 1
  // Tighter bounds prevent overflow for extreme coefficients
  let lo = 0.2;
  let hi = 2.0;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (Math.pow(imp1, 1 / mid) + Math.pow(imp2, 1 / mid) > 1) lo = mid;
    else hi = mid;
  }
  const k = hi;

  // Safety: clamp to avoid NaN from extreme k values
  const safeK = isFinite(k) ? Math.max(0.2, Math.min(2.0, k)) : 1;

  return {
    prob1: Math.round(Math.pow(imp1, 1 / safeK) * 100),
    prob2: Math.round(Math.pow(imp2, 1 / safeK) * 100),
    margin,
  };
}

/** EV = (fairProb × coeff) − 1, as percentage */
function expectedValue(
  fairProb: number,
  coeff: number | null | undefined,
): number | null {
  if (!coeff || coeff <= 1) return null;
  return ((fairProb / 100) * coeff - 1) * 100;
}

// ═══════════════════════════════════════════
// 2. RATING — Logarithmic Elo
// ═══════════════════════════════════════════

/**
 * ΔR = 400 × (ln(pos2) − ln(pos1))
 * Accounts for non-linear ranking: #1 vs #10 ≠ #101 vs #110
 *
 * Edge case: if a team has no rank or rank=0 (new mix),
 * we assign a default position of #150 (average unknown).
 */
function ratingProbability(
  pos1: number | null | undefined,
  pos2: number | null | undefined,
): PredictionResult | null {
  // Both positions unknown → can't compute, exclude from consensus
  if (pos1 == null && pos2 == null) return null;

  const DEFAULT_RANK = 150;
  const safe1 = pos1 != null && pos1 > 0 ? pos1 : DEFAULT_RANK;
  const safe2 = pos2 != null && pos2 > 0 ? pos2 : DEFAULT_RANK;

  const deltaR = 400 * (Math.log(safe2) - Math.log(safe1));
  const probBetter = Math.round(100 / (1 + Math.pow(10, -deltaR / 400)));
  const isTeam1Better = safe1 < safe2;
  const absLogDiff = Math.abs(Math.log(safe2) - Math.log(safe1));

  // Reduce confidence if one team's rank is unknown (flat #150)
  const hasBothRanks = pos1 != null && pos1 > 0 && pos2 != null && pos2 > 0;
  const confidencePenalty = hasBothRanks ? 1 : 0.7;

  return {
    team1Win: isTeam1Better ? probBetter : 100 - probBetter,
    team2Win: isTeam1Better ? 100 - probBetter : probBetter,
    confidence: Math.min(
      90,
      Math.round((35 + Math.round(absLogDiff * 10)) * confidencePenalty),
    ),
    weight: Math.min(
      80,
      Math.round((30 + Math.round(absLogDiff * 8)) * confidencePenalty),
    ),
    label: `Δ ln = ${absLogDiff.toFixed(2)}`,
    note: hasBothRanks
      ? `#${pos1} vs #${pos2}`
      : `#${pos1 ?? "?"} vs #${pos2 ?? "?"} (одна команда без рейтингу)`,
  };
}

// ═══════════════════════════════════════════
// 3. FORMAT — Exact binomial formulas
// ═══════════════════════════════════════════

function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n / 2) k = n - k;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - i + 1)) / i;
  return r;
}

/** Exact probability of winning a Best-of-N series with per-map win prob p */
function seriesWinProbability(mapWinProb: number, winsNeeded: number): number {
  const p = mapWinProb / 100;
  if (winsNeeded === 1) return p * 100;

  let prob = 0;
  const maxMaps = 2 * winsNeeded - 1;
  for (let k = winsNeeded; k <= maxMaps; k++) {
    prob +=
      binomial(k - 1, winsNeeded - 1) *
      Math.pow(p, winsNeeded) *
      Math.pow(1 - p, k - winsNeeded);
  }
  return prob * 100;
}

/**
 * Exact score distribution — pre-computed O(1) formulas.
 *
 * Bo3 (winsNeeded=2):  2:0 = p²,  2:1 = 2p²q,  1:2 = 2q²p,  0:2 = q²   (always sums to 100%)
 * Bo5 (winsNeeded=3):  3:0 = p³,  3:1 = 3p³q,  3:2 = 6p³q²,
 *                      2:3 = 6q³p²,  1:3 = 3q³p,  0:3 = q³
 */
function exactScoreDistribution(
  mapWinProb: number,
  winsNeeded: number,
): Record<string, number> {
  const p = mapWinProb / 100;
  const q = 1 - p;

  // Pre-computed O(1) for Bo3 & Bo5 — faster and more readable
  if (winsNeeded === 2) {
    return {
      "2:0": Math.round(p * p * 1000) / 10,
      "2:1": Math.round(2 * p * p * q * 1000) / 10,
      "1:2": Math.round(2 * q * q * p * 1000) / 10,
      "0:2": Math.round(q * q * 1000) / 10,
    };
  }

  if (winsNeeded === 3) {
    return {
      "3:0": Math.round(p * p * p * 1000) / 10,
      "3:1": Math.round(3 * p * p * p * q * 1000) / 10,
      "3:2": Math.round(6 * p * p * p * q * q * 1000) / 10,
      "2:3": Math.round(6 * q * q * q * p * p * 1000) / 10,
      "1:3": Math.round(3 * q * q * q * p * 1000) / 10,
      "0:3": Math.round(q * q * q * 1000) / 10,
    };
  }

  // Bo1 or other — simple
  return {
    "1:0": Math.round(p * 1000) / 10,
    "0:1": Math.round(q * 1000) / 10,
  };
}

function formatUpsetDescription(matchType: string): {
  label: string;
  note: string;
} {
  switch (matchType) {
    case "Bo1":
      return {
        label: "Bo1 — найвищий шанс апсету",
        note: "Одна карта вирішує все. Апсети найчастіші.",
      };
    case "Bo3":
      return {
        label: "Bo3 — середній ризик",
        note: "Потрібно 2 перемоги. Фаворит має більше шансів виправитись.",
      };
    case "Bo5":
      return {
        label: "Bo5 — найнижчий шанс апсету",
        note: "Потрібно 3 перемоги. Випадковість мінімальна.",
      };
    default:
      return { label: "Формат не впливає", note: "" };
  }
}

// ═══════════════════════════════════════════
// 4. SIMULATION — Monte Carlo + Analytic O(1)
// ═══════════════════════════════════════════

const SIM_COUNT = 10_000;

/**
 * Simulate remaining maps from a given score state.
 * @param startW1 current wins for team1
 * @param startW2 current wins for team2
 * Returns final MATCH score (accumulated from startW1/startW2)
 */
function simulateFromState(
  winProb: number,
  winsNeeded: number,
  startW1: number,
  startW2: number,
): { winner: 1 | 2; score: [number, number] } {
  let w1 = startW1;
  let w2 = startW2;
  while (w1 < winsNeeded && w2 < winsNeeded) {
    if (Math.random() < winProb / 100) w1++;
    else w2++;
  }
  return {
    winner: w1 >= winsNeeded ? 1 : 2,
    score: [w1, w2] as [number, number],
  };
}

function runMonteCarlo(
  winProb: number,
  winsNeeded: number,
  startW1 = 0,
  startW2 = 0,
): SimulationResult {
  const scores: Record<string, number> = {};
  let team1Wins = 0;
  let team2Wins = 0;

  for (let i = 0; i < SIM_COUNT; i++) {
    const { winner, score } = simulateFromState(
      winProb,
      winsNeeded,
      startW1,
      startW2,
    );
    const key = `${score[0]}:${score[1]}`;
    scores[key] = (scores[key] || 0) + 1;
    if (winner === 1) team1Wins++;
    else team2Wins++;
  }
  return {
    team1Wins,
    team2Wins,
    scores,
    totalSims: SIM_COUNT,
    analytic: false,
  };
}

/**
 * Probability that team1 wins from a given state (startW1, startW2) with winsNeeded to win.
 * Uses the negative binomial distribution: team1 needs remW1 wins, team2 needs remW2.
 * P(team1 wins) = Σ_{k=0}^{remW2-1} C(remW1+k-1, remW1-1) · p^remW1 · (1-p)^k
 */
function seriesWinFromState(
  mapWinProb: number,
  winsNeeded: number,
  startW1: number,
  startW2: number,
): number {
  const remW1 = Math.max(0, winsNeeded - startW1);
  const remW2 = Math.max(0, winsNeeded - startW2);
  if (remW1 <= 0) return 100;
  if (remW2 <= 0) return 0;

  const p = mapWinProb / 100;
  const q = 1 - p;
  let prob = 0;
  for (let k = 0; k < remW2; k++) {
    prob +=
      binomial(remW1 + k - 1, remW1 - 1) * Math.pow(p, remW1) * Math.pow(q, k);
  }
  return Math.round(prob * 10000) / 100;
}

/**
 * Exact score distributions from a given state.
 */
function scoreDistFromState(
  mapWinProb: number,
  winsNeeded: number,
  startW1: number,
  startW2: number,
): Record<string, number> {
  const remW1 = Math.max(0, winsNeeded - startW1);
  const remW2 = Math.max(0, winsNeeded - startW2);
  const p = mapWinProb / 100;
  const q = 1 - p;
  const scores: Record<string, number> = {};

  // Already decided?
  if (remW1 <= 0) {
    scores[`${startW1}:${startW2}`] = 100;
    return scores;
  }
  if (remW2 <= 0) {
    scores[`${startW1}:${startW2}`] = 100;
    return scores;
  }

  // Team1 wins: scores (startW1+remW1 : startW2+k) for k=0..remW2-1
  for (let k = 0; k < remW2; k++) {
    const ways = binomial(remW1 + k - 1, remW1 - 1);
    const prob = ways * Math.pow(p, remW1) * Math.pow(q, k);
    scores[`${startW1 + remW1}:${startW2 + k}`] = Math.round(prob * 1000) / 10;
  }
  // Team2 wins: scores (startW1+k : startW2+remW2) for k=0..remW1-1
  for (let k = 0; k < remW1; k++) {
    const ways = binomial(remW2 + k - 1, remW2 - 1);
    const prob = ways * Math.pow(q, remW2) * Math.pow(p, k);
    scores[`${startW1 + k}:${startW2 + remW2}`] = Math.round(prob * 1000) / 10;
  }

  return scores;
}

function runAnalyticSimulation(
  winProb: number,
  winsNeeded: number,
  startW1 = 0,
  startW2 = 0,
): SimulationResult {
  const seriesProb = seriesWinFromState(winProb, winsNeeded, startW1, startW2);
  const team1Wins = Math.round((seriesProb / 100) * SIM_COUNT);
  const rawScores = scoreDistFromState(winProb, winsNeeded, startW1, startW2);
  const scores: Record<string, number> = {};
  for (const [key, pct] of Object.entries(rawScores)) {
    scores[key] = Math.round((pct / 100) * SIM_COUNT);
  }
  return {
    team1Wins,
    team2Wins: SIM_COUNT - team1Wins,
    scores,
    totalSims: SIM_COUNT,
    analytic: true,
  };
}

// ═══════════════════════════════════════════
// 5. WEIGHTED CONSENSUS — Dynamic tier weights + disagreement + EV
// ═══════════════════════════════════════════

function tierMultiplier(tier: string | null | undefined): {
  bookmaker: number;
  rating: number;
  community: number;
} {
  switch (tier) {
    case "tier1":
      return { bookmaker: 1.5, rating: 1.0, community: 0.8 };
    case "tier2":
      return { bookmaker: 1.0, rating: 1.1, community: 1.0 };
    default:
      return { bookmaker: 0.6, rating: 1.3, community: 1.2 };
  }
}

function computeWeightedConsensus(
  consensus: PredictionResult | null,
  bookmaker: PredictionResult | null,
  rating: PredictionResult | null,
  formatPred: PredictionResult | null,
  tier: string | null | undefined,
  coeff1?: number | null,
  coeff2?: number | null,
): WeightedConsensusResult | null {
  const tm = tierMultiplier(tier);

  const entries: Array<{
    label: string;
    team1Win: number;
    team2Win: number;
    baseWeight: number;
  }> = [];

  if (consensus)
    entries.push({
      label: "Спільнота",
      team1Win: consensus.team1Win,
      team2Win: consensus.team2Win,
      baseWeight: consensus.weight * tm.community,
    });
  if (bookmaker)
    entries.push({
      label: "Букмекери",
      team1Win: bookmaker.team1Win,
      team2Win: bookmaker.team2Win,
      baseWeight: bookmaker.weight * tm.bookmaker,
    });
  if (rating)
    entries.push({
      label: "Рейтинг",
      team1Win: rating.team1Win,
      team2Win: rating.team2Win,
      baseWeight: rating.weight * tm.rating,
    });
  if (formatPred)
    entries.push({
      label: "Формат",
      team1Win: formatPred.team1Win,
      team2Win: formatPred.team2Win,
      baseWeight: formatPred.weight,
    });

  if (entries.length === 0) return null;

  const totalW = entries.reduce((s, m) => s + m.baseWeight, 0);
  const weighted1 =
    entries.reduce((s, m) => s + m.team1Win * m.baseWeight, 0) / totalW;

  // Weighted standard deviation → disagreement index
  const variance =
    entries.reduce(
      (s, m) => s + m.baseWeight * Math.pow(m.team1Win - weighted1, 2),
      0,
    ) / totalW;
  const disagreementIndex = Math.min(
    100,
    Math.round(Math.sqrt(variance) * 2.5),
  );

  // EV
  const evTeam1 =
    coeff1 && coeff1 > 1
      ? Math.round(((weighted1 / 100) * coeff1 - 1) * 100)
      : null;
  const evTeam2 =
    coeff2 && coeff2 > 1
      ? Math.round((((100 - weighted1) / 100) * coeff2 - 1) * 100)
      : null;

  // Edge
  let edge: WeightedConsensusResult["edge"] = "unknown";
  if (evTeam1 !== null && evTeam2 !== null) {
    if (evTeam1 > 5 || evTeam2 > 5) edge = "value";
    else if (disagreementIndex > 20) edge = "volatile";
    else edge = "aligned";
  } else if (disagreementIndex > 20) {
    edge = "volatile";
  } else if (disagreementIndex < 10 && entries.length >= 2) {
    edge = "aligned";
  }

  return {
    team1Win: Math.round(weighted1),
    team2Win: Math.round(100 - weighted1),
    methods: entries.map((m) => ({
      label: m.label,
      team1Win: m.team1Win,
      team2Win: m.team2Win,
      weight: Math.round(m.baseWeight),
    })),
    disagreementIndex,
    evTeam1,
    evTeam2,
    edge,
  };
}

// ═══════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════

interface PredictionsModalProps {
  open: boolean;
  onClose: () => void;
  match: Match | null;
}

export default function PredictionsModal({
  open,
  onClose,
  match,
}: PredictionsModalProps) {
  const [activeTab, setActiveTab] = useState("simulation");
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simRunning, setSimRunning] = useState(false);
  const [simAnalytic, setSimAnalytic] = useState(true);
  const [copied, setCopied] = useState(false);

  const winsNeeded =
    match?.matchType === "Bo5" ? 3 : match?.matchType === "Bo3" ? 2 : 1;

  // ── Single useMemo: all prediction calculations ──
  const analytics = useMemo(() => {
    if (!match) return null;
    const pos1 = match.positionTeam1;
    const pos2 = match.positionTeam2;
    const pred1 = match.predictionPercentTeam1;
    const pred2 = match.predictionPercentTeam2;
    const coeff1 = match.bettingCoefficientTeam1;
    const coeff2 = match.bettingCoefficientTeam2;

    // ── Consensus ──
    const hasPrediction =
      pred1 != null && pred2 != null && (pred1 > 0 || pred2 > 0);
    const consensus: PredictionResult | null = hasPrediction
      ? (() => {
          const stars = match.stars ?? 0;
          return {
            team1Win: pred1!,
            team2Win: pred2!,
            confidence: Math.min(90, 40 + Math.min(stars * 2, 40)),
            weight: Math.min(80, 25 + Math.min(stars * 3, 55)),
            label: `${stars} прогнозів`,
            note:
              stars > 20
                ? "Висока кількість голосів — надійний прогноз"
                : stars > 5
                  ? "Середня кількість голосів"
                  : "Мало голосів — низька надійність",
          };
        })()
      : null;

    // ── Bookmaker (power method + EV) ──
    const hasCoeffs =
      coeff1 != null && coeff2 != null && coeff1 > 0 && coeff2 > 0;
    const bookmaker: PredictionResult | null = hasCoeffs
      ? (() => {
          const fair = fairProbability(coeff1!, coeff2!);
          if (!fair) return null;
          const ev1 = expectedValue(fair.prob1, coeff1!);
          const ev2 = expectedValue(fair.prob2, coeff2!);
          let valueNote = "";
          let evLabel = "";
          if (ev1 !== null && ev1 > 0) {
            valueNote = `+EV на ${match.team1}: +${ev1.toFixed(1)}%`;
            evLabel = `+${ev1.toFixed(1)}% EV`;
          } else if (ev2 !== null && ev2 > 0) {
            valueNote = `+EV на ${match.team2}: +${ev2.toFixed(1)}%`;
            evLabel = `+${ev2.toFixed(1)}% EV`;
          } else {
            valueNote = "Немає цінних ставок (+EV)";
            evLabel = "ринок ефективний";
          }
          return {
            team1Win: fair.prob1,
            team2Win: fair.prob2,
            confidence: Math.min(85, Math.max(35, 80 - fair.margin)),
            weight: Math.min(85, Math.max(30, 75 - fair.margin * 1.2)),
            label: `Маржа: ${fair.margin}% · ${evLabel}`,
            note: valueNote,
          };
        })()
      : null;

    // ── Rating (log) ──
    const rating = ratingProbability(pos1, pos2);

    // ── Format (binomial) ──
    const baseP1 = pred1 ?? rating?.team1Win ?? 50;
    const format = formatUpsetDescription(match.matchType);
    const seriesP1 = seriesWinProbability(baseP1, winsNeeded);
    const baseConf = winsNeeded === 3 ? 75 : winsNeeded === 2 ? 60 : 45;
    const formatPred: PredictionResult | null = {
      team1Win: Math.round(seriesP1),
      team2Win: Math.round(100 - seriesP1),
      confidence: Math.min(
        85,
        Math.round(baseConf + Math.abs(baseP1 - 50) * 0.3),
      ),
      weight: Math.min(70, Math.round(baseConf * 0.85)),
      label: format.label,
      note: format.note,
    };

    // ── Live score adjustment: re-compute all methods from current match state ──
    const isLive = match.matchStatus === "live";
    const liveScore1 = match.score1 ?? 0;
    const liveScore2 = match.score2 ?? 0;
    const hasLiveScore = isLive && (liveScore1 > 0 || liveScore2 > 0);

    // Helper: adjust a per-map prediction through seriesWinFromState to reflect live score
    const adjustForLive = (
      pred: PredictionResult | null,
      perMapP1: number,
    ): PredictionResult | null => {
      if (!pred || !hasLiveScore) return pred;
      const newP1 = seriesWinFromState(
        perMapP1,
        winsNeeded,
        liveScore1,
        liveScore2,
      );
      const newP2 = 100 - newP1;
      const isFlipped = pred.team1Win > 50 !== newP1 > 50; // Favorite changed
      return {
        ...pred,
        team1Win: Math.round(newP1),
        team2Win: Math.round(newP2),
        confidence: Math.max(20, pred.confidence - (isFlipped ? 15 : 0)),
        weight: isFlipped ? Math.round(pred.weight * 0.7) : pred.weight,
        note:
          (pred.note ?? "") +
          (hasLiveScore ? ` (від рахунку ${liveScore1}:${liveScore2})` : ""),
      };
    };

    const consensusAdjusted = adjustForLive(consensus, pred1 ?? 50);
    const bookmakerAdjusted = adjustForLive(
      bookmaker,
      bookmaker?.team1Win ?? 50,
    );
    const ratingAdjusted = adjustForLive(rating, rating?.team1Win ?? 50);
    const formatAdjusted = adjustForLive(formatPred, baseP1);

    // ── Weighted Consensus ──
    const weightedConsensus = computeWeightedConsensus(
      consensusAdjusted,
      bookmakerAdjusted,
      ratingAdjusted,
      formatAdjusted,
      match.tier,
      coeff1,
      coeff2,
    );

    const hasPredictionOut = hasPrediction;
    const hasCoeffsOut = hasCoeffs;
    const hasRatingOut = pos1 != null && pos2 != null;

    return {
      consensus: consensusAdjusted,
      bookmaker: bookmakerAdjusted,
      rating: ratingAdjusted,
      formatPred: formatAdjusted,
      weightedConsensus,
      hasPrediction: hasPredictionOut,
      hasCoeffs: hasCoeffsOut,
      hasRating: hasRatingOut,
      pos1,
      pos2,
      pred1,
      coeff1,
      coeff2,
      isLive,
      liveScore1,
      liveScore2,
      hasLiveScore,
    };
  }, [match, winsNeeded]);

  // ── Simulation ──
  const handleRunSimulation = useCallback(() => {
    if (!analytics?.weightedConsensus) return;
    const startW1 = analytics.hasLiveScore ? analytics.liveScore1 : 0;
    const startW2 = analytics.hasLiveScore ? analytics.liveScore2 : 0;
    setSimRunning(true);
    setTimeout(
      () => {
        const prob = analytics!.weightedConsensus!.team1Win;
        setSimResult(
          simAnalytic
            ? runAnalyticSimulation(prob, winsNeeded, startW1, startW2)
            : runMonteCarlo(prob, winsNeeded, startW1, startW2),
        );
        setSimRunning(false);
      },
      simAnalytic ? 10 : 50,
    );
  }, [
    analytics?.weightedConsensus,
    analytics?.hasLiveScore,
    analytics?.liveScore1,
    analytics?.liveScore2,
    winsNeeded,
    simAnalytic,
  ]);

  useEffect(() => {
    if (open && analytics?.weightedConsensus) {
      setActiveTab("simulation");
      setSimResult(null);
      // Auto-run simulation on open
      const startW1 = analytics.hasLiveScore ? analytics.liveScore1 : 0;
      const startW2 = analytics.hasLiveScore ? analytics.liveScore2 : 0;
      setSimRunning(true);
      const timer = setTimeout(
        () => {
          const prob = analytics.weightedConsensus!.team1Win;
          setSimResult(
            simAnalytic
              ? runAnalyticSimulation(prob, winsNeeded, startW1, startW2)
              : runMonteCarlo(prob, winsNeeded, startW1, startW2),
          );
          setSimRunning(false);
        },
        simAnalytic ? 10 : 50,
      );
      return () => clearTimeout(timer);
    }
  }, [
    open,
    analytics?.weightedConsensus,
    analytics?.hasLiveScore,
    analytics?.liveScore1,
    analytics?.liveScore2,
    winsNeeded,
    simAnalytic,
  ]);

  // ═══════════════════════════════════════════
  // RENDER HELPERS (must be before any early return)
  // ═══════════════════════════════════════════

  const renderDualBar = useCallback(
    (
      t1: number,
      t2: number,
      l1?: string,
      l2?: string,
      logo1?: string | null,
      logo2?: string | null,
    ) => (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-900 flex items-center gap-1.5">
            {logo1 ? (
              <img
                src={logo1}
                alt=""
                className="w-5 h-5 rounded object-contain bg-gray-200 flex-shrink-0"
              />
            ) : (
              <img
                src={
                  match?.game === "Dota2"
                    ? "/assets/team-placeholder-dota.svg"
                    : "/assets/team-placeholder.svg"
                }
                alt=""
                className="w-5 h-5 rounded object-contain bg-gray-200 flex-shrink-0"
              />
            )}
            {l1 ?? match?.team1 ?? ""}
            <span className="ml-1.5 text-base font-bold text-green-600">
              {t1}%
            </span>
          </span>
          <span className="font-semibold text-gray-900 flex items-center gap-1.5">
            {logo2 ? (
              <img
                src={logo2}
                alt=""
                className="w-5 h-5 rounded object-contain bg-gray-200 flex-shrink-0"
              />
            ) : (
              <img
                src={
                  match?.game === "Dota2"
                    ? "/assets/team-placeholder-dota.svg"
                    : "/assets/team-placeholder.svg"
                }
                alt=""
                className="w-5 h-5 rounded object-contain bg-gray-200 flex-shrink-0"
              />
            )}
            {l2 ?? match?.team2 ?? ""}
            <span className="ml-1.5 text-base font-bold text-blue-600">
              {t2}%
            </span>
          </span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-gray-200">
          <div
            className="bg-green-500 transition-all duration-500"
            style={{ width: `${t1}%` }}
          />
          <div
            className="bg-blue-500 transition-all duration-500"
            style={{ width: `${t2}%` }}
          />
        </div>
      </div>
    ),
    [match?.team1, match?.team2],
  );

  const renderPredictionCard = useCallback(
    (
      title: string,
      icon: React.ReactNode,
      result: PredictionResult | null,
      extra?: React.ReactNode,
    ) => (
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            {icon}
          </div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
        </div>
        {result ? (
          <div className="space-y-3">
            {renderDualBar(
              result.team1Win,
              result.team2Win,
              match?.team1,
              match?.team2,
              match?.logoTeam1,
              match?.logoTeam2,
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help border-b border-dotted border-gray-300">
                      Надійність: {result.confidence}%
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[260px] bg-gray-900 text-white p-3 rounded-xl">
                    <p className="text-sm">
                      Оцінка точності методу. Враховує кількість даних, маржу
                      букмекера, розрив у рейтингу.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              {result.label && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>{result.label}</span>
                </>
              )}
            </div>
            {result.note && (
              <p className="text-xs text-gray-400 italic">{result.note}</p>
            )}
            {extra}
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-gray-400">
            <Info className="h-5 w-5 mx-auto mb-2 text-gray-300" />
            Недостатньо даних
          </div>
        )}
      </div>
    ),
    [renderDualBar],
  );

  // Destructure early — needed by edgeConfig useMemo below
  const {
    consensus,
    bookmaker,
    rating,
    formatPred,
    weightedConsensus,
    hasPrediction,
    hasCoeffs,
    hasRating,
    pos1,
    pos2,
    pred1,
    coeff1,
    coeff2,
    isLive,
    liveScore1,
    liveScore2,
    hasLiveScore,
  } = analytics ?? ({} as typeof analytics);

  const edgeConfig = useMemo(() => {
    if (!weightedConsensus) return null;
    switch (weightedConsensus.edge) {
      case "value":
        return {
          icon: <Zap className="h-4 w-4" />,
          label: "+EV Value",
          color: "bg-green-100 text-green-700 border-green-300",
          tooltip:
            "Зважений консенсус дає ймовірність вищу за букмекерську — математично вигідна ставка.",
        };
      case "aligned":
        return {
          icon: <Sparkles className="h-4 w-4" />,
          label: "Market Aligned",
          color: "bg-blue-100 text-blue-700 border-blue-300",
          tooltip: "Усі методи прогнозування сходяться — висока впевненість.",
        };
      case "volatile":
        return {
          icon: <ArrowUpRight className="h-4 w-4" />,
          label: "High Volatility",
          color: "bg-amber-100 text-amber-700 border-amber-300",
          tooltip:
            "Методи суттєво розходяться — високий ризик, непередбачуваний результат.",
        };
      default:
        return {
          icon: <Info className="h-4 w-4" />,
          label: "Недостатньо даних",
          color: "bg-gray-100 text-gray-500 border-gray-300",
          tooltip: "Замало даних для повноцінного аналізу.",
        };
    }
  }, [weightedConsensus]);

  // Copy handler
  const handleCopy = useCallback(() => {
    if (!match || !weightedConsensus) return;
    const text = [
      `📊 ${match.team1} vs ${match.team2} (${match.matchType})`,
      `🎯 Зважений консенсус: ${weightedConsensus.team1Win}% / ${weightedConsensus.team2Win}%`,
      weightedConsensus.evTeam1 !== null
        ? `  EV ${match.team1}: ${weightedConsensus.evTeam1 > 0 ? "+" : ""}${weightedConsensus.evTeam1}%`
        : "",
      weightedConsensus.evTeam2 !== null
        ? `  EV ${match.team2}: ${weightedConsensus.evTeam2 > 0 ? "+" : ""}${weightedConsensus.evTeam2}%`
        : "",
      `⚡ Розбіжність: ${weightedConsensus.disagreementIndex}% | Edge: ${weightedConsensus.edge}`,
      "",
      weightedConsensus.methods
        .map((m) => `  · ${m.label}: ${m.team1Win}%/${m.team2Win}%`)
        .join("\n"),
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [match, weightedConsensus]);

  // Guard after ALL hooks
  if (!match || !analytics) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl p-0 rounded-2xl bg-white [&>button]:top-3 [&>button]:right-3">
        <div className="max-h-[92vh] overflow-y-auto rounded-2xl">
          <div className="px-6 pt-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <BarChart3 className="h-5 w-5 text-primary" strokeWidth={2} />
                Аналіз прогнозів
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleCopy}
                      className="ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs text-gray-500 font-medium transition-colors"
                    >
                      {copied ? (
                        <Check
                          className="h-3.5 w-3.5 text-green-500"
                          strokeWidth={2}
                        />
                      ) : (
                        <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                      )}
                      {copied ? "Скопійовано" : "Копіювати"}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-white p-2 rounded-lg">
                    <p className="text-xs">Скопіювати результати аналізу</p>
                  </TooltipContent>
                </Tooltip>
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                {match.team1} vs {match.team2} ({match.matchType}
                {match.tier ? `, ${match.tier.toUpperCase()}` : ""})
                {isLive && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    LIVE
                  </span>
                )}
                {hasLiveScore && (
                  <span className="text-xs font-bold text-red-700">
                    {liveScore1}:{liveScore2}
                  </span>
                )}
              </p>
            </DialogHeader>

            <div className="h-6"></div>

            {/* ── Pill nav (matching StrategyTabNav style) ── */}
            <div className="flex justify-center mb-5">
              <div className="inline-flex items-center gap-1 bg-gray-100 p-1.5 rounded-[28px]">
                {(
                  [
                    { id: "simulation", label: "Симуляція", Icon: Shuffle },
                    { id: "consensus", label: "Спільнота", Icon: Users },
                    { id: "bookmaker", label: "Букмекери", Icon: Dice5 },
                    { id: "rating", label: "Рейтинг", Icon: Trophy },
                    { id: "format", label: "Формат", Icon: Swords },
                  ] as const
                ).map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.Icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative rounded-[24px] px-5 py-2.5 text-sm transition-all duration-300 ease-in-out flex items-center gap-2 ${
                        isActive
                          ? "bg-primary text-white font-medium shadow-[0_2px_8px_rgba(68,122,252,0.3)] border border-transparent"
                          : "bg-transparent text-gray-500 hover:text-gray-700 font-light border border-transparent"
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-200 -mx-6 mb-0" />

            <div className="-mx-6 px-6 pt-6 pb-6 bg-[#f3f3f3]">
              {/* ── Tab content ── */}
              {activeTab === "consensus" && (
                <>
                  {renderPredictionCard(
                    "Консенсус спільноти",
                    <Users
                      className="h-4 w-4 text-primary"
                      strokeWidth={1.5}
                    />,
                    consensus,
                  )}
                  {!hasPrediction && (
                    <p className="text-xs text-gray-400 mt-3 text-center">
                      Прогнози спільноти ще не зібрані для цього матчу
                    </p>
                  )}
                </>
              )}

              {activeTab === "bookmaker" && (
                <>
                  {renderPredictionCard(
                    "Букмекерська ймовірність",
                    <Dice5
                      className="h-4 w-4 text-primary"
                      strokeWidth={1.5}
                    />,
                    bookmaker,
                  )}
                  {bookmaker && (
                    <div className="mt-3 space-y-2 text-xs text-gray-500">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          {match.team1}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[260px] bg-gray-900 text-white p-3 rounded-xl">
                              <p className="text-sm">
                                <strong>Очищена ймовірність</strong> — справжня
                                оцінка ринку після видалення маржі букмекера
                                через пропорційний метод (power method).
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </span>
                        <span className="font-mono font-semibold">
                          {coeff1?.toFixed(2) ?? "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{match.team2}</span>
                        <span className="font-mono font-semibold">
                          {coeff2?.toFixed(2) ?? "—"}
                        </span>
                      </div>
                    </div>
                  )}
                  {!hasCoeffs && (
                    <p className="text-xs text-gray-400 mt-3 text-center">
                      Коефіцієнти для цього матчу ще не виставлені
                    </p>
                  )}
                </>
              )}

              {activeTab === "rating" && (
                <>
                  {renderPredictionCard(
                    "Рейтинговий аналіз",
                    <Trophy
                      className="h-4 w-4 text-primary"
                      strokeWidth={1.5}
                    />,
                    rating,
                  )}
                  {hasRating && (
                    <div className="mt-3 space-y-1 text-xs text-gray-500">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          {match.team1}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[260px] bg-gray-900 text-white p-3 rounded-xl">
                              <p className="text-sm">
                                <strong>Логарифмічна різниця:</strong> враховує,
                                що розрив між #1 та #10 значно більший, ніж між
                                #101 та #110. Використовується Elo з ln(pos).
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </span>
                        <span className="font-mono font-semibold">#{pos1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{match.team2}</span>
                        <span className="font-mono font-semibold">#{pos2}</span>
                      </div>
                    </div>
                  )}
                  {!hasRating && (
                    <p className="text-xs text-gray-400 mt-3 text-center">
                      Рейтингові позиції команд невідомі
                    </p>
                  )}
                </>
              )}

              {activeTab === "format" && (
                <>
                  {renderPredictionCard(
                    "Вплив формату матчу",
                    <Swords
                      className="h-4 w-4 text-primary"
                      strokeWidth={1.5}
                    />,
                    formatPred,
                  )}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(["Bo1", "Bo3", "Bo5"] as const).map((fmt) => {
                      const fWins = fmt === "Bo5" ? 3 : fmt === "Bo3" ? 2 : 1;
                      const desc = formatUpsetDescription(fmt);
                      const isActive = match.matchType === fmt;
                      const baseP = pred1 ?? rating?.team1Win ?? 50;
                      const sP = Math.round(seriesWinProbability(baseP, fWins));
                      return (
                        <div
                          key={fmt}
                          className={`rounded-xl border p-3 text-center ${
                            isActive
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="text-sm font-bold text-gray-900">
                            {fmt}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {desc.label.split(" — ")[0]}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {sP}% / {100 - sP}%
                          </div>
                          {isActive && (
                            <span className="inline-block mt-1 text-[10px] font-semibold bg-primary text-white rounded-full px-2 py-0.5">
                              Поточний
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {activeTab === "simulation" && (
                <>
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <Shuffle
                          className="h-4 w-4 text-primary"
                          strokeWidth={1.5}
                        />
                      </div>
                      <h4 className="font-semibold text-gray-900">
                        Симуляція матчів
                      </h4>
                      {isLive && (
                        <span className="inline-flex items-center gap-1 ml-auto px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          LIVE
                        </span>
                      )}
                    </div>

                    {hasLiveScore && (
                      <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
                        <p className="text-xs text-red-700 font-medium">
                          Поточний рахунок:{" "}
                          <span className="font-bold">
                            {match.team1} {liveScore1}:{liveScore2}{" "}
                            {match.team2}
                          </span>{" "}
                          ({match.matchType}, до {winsNeeded} перемог)
                        </p>
                        <p className="text-[10px] text-red-500 mt-0.5">
                          Симуляція враховує поточний рахунок — команди
                          продовжують з цього стану
                        </p>
                      </div>
                    )}

                    {simResult ? (
                      <div className="space-y-4">
                        {renderDualBar(
                          Math.round(
                            (simResult.team1Wins / simResult.totalSims) * 100,
                          ),
                          Math.round(
                            (simResult.team2Wins / simResult.totalSims) * 100,
                          ),
                          `${match.team1} (${simResult.team1Wins})`,
                          `${match.team2} (${simResult.team2Wins})`,
                          match.logoTeam1,
                          match.logoTeam2,
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>
                            {simResult.totalSims.toLocaleString()} симуляцій ·{" "}
                            {match.matchType} — до {winsNeeded} перемог
                            {hasLiveScore &&
                              ` (від рахунку ${liveScore1}:${liveScore2})`}
                          </span>
                          {simResult.analytic && (
                            <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-semibold">
                              Аналітичний O(1)
                            </span>
                          )}
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-semibold text-gray-700">
                              Розподіл рахунків
                            </h5>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[260px] bg-gray-900 text-white p-3 rounded-xl">
                                <p className="text-sm">
                                  {simResult.analytic
                                    ? "Розраховано аналітично через біноміальний розподіл — миттєво, без похибки."
                                    : "10 000 симуляцій повних матчів — метод Монте-Карло."}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="space-y-1.5">
                            {Object.entries(simResult.scores)
                              .sort(([, a], [, b]) => b - a)
                              .map(([score, count]) => {
                                const pct = Math.round(
                                  (count / simResult.totalSims) * 100,
                                );
                                const [s1, s2] = score.split(":").map(Number);
                                const isTeam1Win = s1 > s2;
                                return (
                                  <div
                                    key={score}
                                    className="flex items-center gap-2"
                                  >
                                    <span
                                      className={`text-xs font-mono w-10 text-right font-semibold ${
                                        isTeam1Win
                                          ? "text-green-600"
                                          : "text-blue-600"
                                      }`}
                                    >
                                      {score}
                                    </span>
                                    <div className="flex-1 h-5 rounded-full bg-gray-100 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${isTeam1Win ? "bg-green-400" : "bg-blue-400"}`}
                                        style={{
                                          width: `${Math.max(pct, 2)}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs text-gray-500 w-16 text-left">
                                      {pct}% ({count.toLocaleString()})
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSimAnalytic((v) => !v);
                              setSimResult(null);
                            }}
                            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                              simAnalytic
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {simAnalytic ? "✓ Аналітичний" : "Аналітичний O(1)"}
                          </button>
                          <button
                            onClick={handleRunSimulation}
                            className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 font-medium transition-colors"
                          >
                            <Shuffle className="h-3.5 w-3.5 inline mr-1.5" />
                            Перезапустити
                          </button>
                        </div>
                      </div>
                    ) : simRunning ? (
                      <div className="py-10 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 animate-pulse mb-3">
                          <Shuffle className="h-6 w-6 text-primary animate-spin" />
                        </div>
                        <p className="text-sm text-gray-500">
                          {simAnalytic
                            ? "Рахуємо аналітично..."
                            : `Симулюємо ${SIM_COUNT.toLocaleString()} матчів...`}
                        </p>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <div className="p-4 bg-gray-100 rounded-2xl inline-block mb-4">
                          <Shuffle
                            className="h-8 w-8 text-gray-400"
                            strokeWidth={1.5}
                          />
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                          {hasLiveScore
                            ? `Від рахунку ${liveScore1}:${liveScore2} — `
                            : ""}
                          {simAnalytic
                            ? "Аналітичний розрахунок через біноміальний розподіл (миттєво, O(1))"
                            : `${SIM_COUNT.toLocaleString()} симуляцій формату ${match.matchType}`}
                        </p>
                        <div className="flex gap-2 justify-center mb-4">
                          <button
                            onClick={() => setSimAnalytic(true)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              simAnalytic
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-gray-100 text-gray-600 border border-gray-200"
                            }`}
                          >
                            Аналітичний O(1)
                          </button>
                          <button
                            onClick={() => setSimAnalytic(false)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              !simAnalytic
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-gray-100 text-gray-600 border border-gray-200"
                            }`}
                          >
                            Монте-Карло
                          </button>
                        </div>
                        <button
                          onClick={handleRunSimulation}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors"
                        >
                          <Shuffle className="h-4 w-4" />
                          Запустити симуляцію
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Weighted Summary ── */}
              {weightedConsensus && (
                <div className="mt-6 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5 text-primary" strokeWidth={2} />
                    <h3 className="font-bold text-gray-900">
                      Зважений консенсус
                    </h3>
                    {edgeConfig && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={`inline-flex items-center gap-1 ml-auto px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${edgeConfig.color}`}
                          >
                            {edgeConfig.icon}
                            {edgeConfig.label}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[280px] bg-gray-900 text-white p-3 rounded-xl">
                          <p className="text-sm">{edgeConfig.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {renderDualBar(
                    weightedConsensus.team1Win,
                    weightedConsensus.team2Win,
                    match.team1,
                    match.team2,
                    match.logoTeam1,
                    match.logoTeam2,
                  )}

                  {/* EV display */}
                  {(weightedConsensus.evTeam1 !== null ||
                    weightedConsensus.evTeam2 !== null) && (
                    <div className="flex items-center gap-3 mt-3 text-xs">
                      {weightedConsensus.evTeam1 !== null && (
                        <span
                          className={`flex items-center gap-1 font-mono font-semibold ${
                            weightedConsensus.evTeam1 > 0
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          {weightedConsensus.evTeam1 > 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {match.team1}:{" "}
                          {weightedConsensus.evTeam1 > 0 ? "+" : ""}
                          {weightedConsensus.evTeam1}% EV
                        </span>
                      )}
                      {weightedConsensus.evTeam2 !== null && (
                        <span
                          className={`flex items-center gap-1 font-mono font-semibold ${
                            weightedConsensus.evTeam2 > 0
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          {weightedConsensus.evTeam2 > 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {match.team2}:{" "}
                          {weightedConsensus.evTeam2 > 0 ? "+" : ""}
                          {weightedConsensus.evTeam2}% EV
                        </span>
                      )}
                    </div>
                  )}

                  {/* Disagreement index */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          weightedConsensus.disagreementIndex < 10
                            ? "bg-green-500"
                            : weightedConsensus.disagreementIndex < 20
                              ? "bg-amber-400"
                              : "bg-red-500"
                        }`}
                        style={{
                          width: `${weightedConsensus.disagreementIndex}%`,
                        }}
                      />
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-gray-500 cursor-help border-b border-dotted border-gray-300 whitespace-nowrap">
                          Розбіжність: {weightedConsensus.disagreementIndex}%
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[260px] bg-gray-900 text-white p-3 rounded-xl">
                        <p className="text-sm">
                          <strong>Індекс незгоди</strong> — вимірює, наскільки
                          різні методи розходяться. Низьке → методи сходяться,
                          висока впевненість. Високе → суперечливі сигнали,
                          підвищений ризик.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    На основі {weightedConsensus.methods.length} методів. Ваги
                    адаптовано до рівня турніру ({match.tier ?? "невідомо"}).
                  </p>

                  <div className="mt-3 space-y-2">
                    {weightedConsensus.methods.map((m) => {
                      const pct = m.team1Win;
                      const flip = pct < 50;
                      const barPct = flip ? 100 - pct : pct;
                      return (
                        <Tooltip key={m.label}>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 cursor-help text-xs">
                              <span className="w-16 text-right text-gray-500 font-medium">
                                {m.label}
                              </span>
                              <div className="flex-1 h-5 rounded-full bg-white border border-gray-200 overflow-hidden flex items-center relative">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1.5 ${
                                    flip ? "bg-blue-100" : "bg-green-100"
                                  }`}
                                  style={{
                                    width: `${barPct}%`,
                                    minWidth: barPct > 0 ? "20px" : "0",
                                  }}
                                >
                                  <span
                                    className={`text-[10px] font-bold ${flip ? "text-blue-700" : "text-green-700"}`}
                                  >
                                    {m.team1Win}%
                                  </span>
                                </div>
                                <span
                                  className={`absolute right-2 text-[10px] font-bold ${!flip ? "text-blue-700" : "text-green-700"}`}
                                  style={{
                                    left: `${barPct + 4}%`,
                                  }}
                                >
                                  {m.team2Win}%
                                </span>
                              </div>
                              <span className="w-8 text-left text-[10px] text-gray-400">
                                ×{m.weight}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-900 text-white p-2 rounded-lg">
                            <p className="text-xs">
                              Вага: {m.weight} — враховує надійність методу та
                              рівень турніру
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
