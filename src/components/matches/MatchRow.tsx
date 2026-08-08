import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Eye,
  PlusCircle,
  Brain,
  Flame,
  Shield,
  Layers,
  CircleCheck,
  Info,
  Trophy,
  X,
  BarChart3,
  ExternalLink,
} from "lucide-react";

import type { Match, FormStability, MatchRating } from "@/hooks/useMatches";

interface AIRecommendation {
  prediction?: string;
  confidence?: number;
}

interface Props {
  match: Match;
  aiPredictions: Record<string, AIRecommendation>;
  isSelected: boolean;
  currentRating: MatchRating;
  colDivider: string;
  team1Risky: boolean;
  team2Risky: boolean;
  visibleColumns: Set<string>;
  onRate: (id: string, rating: MatchRating) => void;
  onAIRecommend: (match: Match) => void;
  onPredictions: (match: Match) => void;
  onShowComment: (match: Match) => void;
  onAddToBets: (match: Match) => void;
  onToggleSelect: (id: string) => void;
  onAddToRisky: (match: Match) => void;
}

/** Rewrite logo URLs — backend already proxies all external CDNs.
 *  Backend returns /api/v1/{game}-matches/logo/external/{b64}.
 *  Just pass through; if somehow raw URL, encode as base64url. */
const proxyLogo = (url: string | null, game?: string): string | null => {
  if (!url) return null;
  if (url.startsWith("/api/")) return url;
  // Legacy: raw CDN URL not proxied by backend — encode ourselves
  const prefix = game === "Dota2" ? "dota2" : "cs2";
  const encoded = btoa(url)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `/api/v1/${prefix}-matches/logo/external/${encoded}`;
};

const TeamLogo = ({
  src,
  teamName,
  size = 26,
  game,
}: {
  src?: string | null;
  teamName: string;
  size?: number;
  game?: string;
}) => {
  const [imgError, setImgError] = useState(false);
  const placeholderSvg =
    game === "CS2"
      ? "/assets/team-placeholder-cs2.svg"
      : "/assets/team-placeholder-dota.svg";

  const proxiedSrc = proxyLogo(src ?? null, game);

  if (!proxiedSrc || imgError) {
    return (
      <div
        className="flex items-center justify-center rounded-md bg-gray-200 flex-shrink-0"
        style={{ width: size, height: size, minWidth: size }}
      >
        <img
          src={placeholderSvg}
          alt={teamName}
          className="object-contain"
          style={{ width: size - 2, height: size - 2 }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-md flex-shrink-0"
      style={{ width: size, height: size, minWidth: size }}
    >
      <img
        src={proxiedSrc}
        alt={teamName}
        className="object-contain"
        style={{ width: size - 2, height: size - 2 }}
        onError={() => setImgError(true)}
      />
    </div>
  );
};

/** Small binomial coefficient for live score adaptation (n ≤ 10, k ≤ n) */
function binomialSmall(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n / 2) k = n - k;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - i + 1)) / i;
  return r;
}

const PredictionBar = ({
  percent1,
  percent2,
  team1,
  team2,
  aiPrediction,
  matchStatus,
  score1,
  score2,
  matchType,
}: {
  percent1: number;
  percent2: number;
  team1: string;
  team2: string;
  aiPrediction?: AIRecommendation | null;
  matchStatus?: string;
  score1?: number | null;
  score2?: number | null;
  matchType?: string;
}) => {
  const isLive = matchStatus === "live";
  const hasScore =
    isLive &&
    score1 != null &&
    score2 != null &&
    ((score1 ?? 0) > 0 || (score2 ?? 0) > 0);

  // For live matches with a score, adjust per-map probability to series win prob from current state
  const winsNeeded = matchType === "Bo5" ? 3 : matchType === "Bo3" ? 2 : 1;
  const rawP1 = percent1;
  const rawP2 = percent2;
  let displayP1 = rawP1;
  let displayP2 = rawP2;
  let scoreAdjusted = false;

  if (hasScore && rawP1 > 0 && rawP2 > 0) {
    const p = rawP1 / (rawP1 + rawP2); // normalize to 0–1
    const remW1 = Math.max(0, winsNeeded - (score1 ?? 0));
    const remW2 = Math.max(0, winsNeeded - (score2 ?? 0));
    if (remW1 > 0 && remW2 > 0) {
      // P(team1 wins series) = Σ_{k=0}^{remW2-1} C(remW1+k-1, k) · p^remW1 · (1-p)^k
      let prob = 0;
      const q = 1 - p;
      for (let k = 0; k < remW2; k++) {
        prob +=
          binomialSmall(remW1 + k - 1, k) * Math.pow(p, remW1) * Math.pow(q, k);
      }
      displayP1 = Math.round(prob * 100);
      displayP2 = 100 - displayP1;
      scoreAdjusted = true;
    } else if (remW1 <= 0) {
      displayP1 = 100;
      displayP2 = 0;
      scoreAdjusted = true;
    } else {
      displayP1 = 0;
      displayP2 = 100;
      scoreAdjusted = true;
    }
  }

  const total = displayP1 + displayP2;
  const w1 = total > 0 ? displayP1 : 50;
  const w2 = total > 0 ? displayP2 : 50;
  const isFav = w1 >= w2;
  const hasPrediction = total > 0;
  const aiTeam1 = aiPrediction?.prediction === team1;
  const aiTeam2 = aiPrediction?.prediction === team2;
  const aiConf = aiPrediction?.confidence ?? 0;
  const aiTC1 = aiTeam1 ? aiConf : aiTeam2 ? 100 - aiConf : 0;
  const aiTC2 = aiTeam2 ? aiConf : aiTeam1 ? 100 - aiConf : 0;
  const hasAi = aiPrediction && (aiTeam1 || aiTeam2);
  return (
    <div className="space-y-1.5 min-w-[150px]">
      {hasPrediction && (
        <>
          <div className="flex items-center justify-between text-xs">
            <span
              className={isFav ? "font-bold text-gray-900" : "text-[#4B5563]"}
            >
              {percent1}%
            </span>

            <span
              className={!isFav ? "font-bold text-gray-900" : "text-[#4B5563]"}
            >
              {percent2}%
            </span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
            <div
              className={`transition-all duration-300 ${isFav ? "bg-green-500" : "bg-blue-500"}`}
              style={{ width: `${w1}%` }}
            />
            <div
              className={`transition-all duration-300 ${!isFav ? "bg-green-500" : "bg-blue-500"}`}
              style={{ width: `${w2}%` }}
            />
          </div>
          {scoreAdjusted && (
            <div className="text-[10px] text-amber-600 font-medium text-center">
              Адаптовано
            </div>
          )}
        </>
      )}
      {hasAi && (
        <>
          <div className="flex items-center justify-between text-xs mt-1">
            <span
              className={
                aiTC1 > aiTC2 ? "font-bold text-[#7C3AED]" : "text-[#4B5563]"
              }
            >
              {aiTC1}%
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <Brain className="h-3 w-3 text-gray-400" strokeWidth={1.5} />
              AI
            </span>
            <span
              className={
                aiTC2 > aiTC1 ? "font-bold text-[#7C3AED]" : "text-[#4B5563]"
              }
            >
              {aiTC2}%
            </span>
          </div>
          <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100">
            <div
              className="bg-[#A78BFA] transition-all duration-300"
              style={{ width: `${aiTC1}%` }}
            />
            <div
              className="bg-[#C4B5FD] transition-all duration-300"
              style={{ width: `${aiTC2}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
};

/** Compact status badge for inside the match column (left sidebar) */
const getFormInfo = (form: FormStability) => {
  const map: Record<
    FormStability,
    { icon: React.ReactNode; label: string; color: string; tooltip: string }
  > = {
    hot_streak: {
      icon: <Flame className="h-3.5 w-3.5" strokeWidth={1.5} />,
      label: "Серія перемог",
      color: "bg-gradient-to-r from-orange-500 to-red-500 text-white border-0",
      tooltip: "🔥 Команда у топ-формі",
    },
    stable: {
      icon: <Shield className="h-3.5 w-3.5" strokeWidth={1.5} />,
      label: "Стабільна",
      color:
        "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
      tooltip: "🛡️ Стабільна форма",
    },
    momentum: {
      icon: <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} />,
      label: "На підйомі",
      color: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0",
      tooltip: "📈 Набирає темп",
    },
    falling: {
      icon: <TrendingDown className="h-3.5 w-3.5" strokeWidth={1.5} />,
      label: "Спад",
      color:
        "bg-gradient-to-r from-orange-400 to-orange-600 text-white border-0",
      tooltip: "📉 Втрачає форму",
    },
    slump: {
      icon: <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.5} />,
      label: "Криза",
      color: "bg-gradient-to-r from-red-500 to-pink-500 text-white border-0",
      tooltip: "⚠️ Криза",
    },
    inconsistent: {
      icon: <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.5} />,
      label: "Нестабільна",
      color: "bg-gradient-to-r from-gray-400 to-gray-600 text-white border-0",
      tooltip: "⚡ Непередбачувана",
    },
  };
  return map[form];
};

function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--:--";
  }
}
function formatCoeff(c?: number | null) {
  if (c == null || c === 0) return "—";
  return c.toFixed(2);
}

export default function MatchRow({
  match,
  aiPredictions,
  isSelected,
  currentRating,
  colDivider,
  team1Risky,
  team2Risky,
  visibleColumns,
  onRate,
  onAIRecommend,
  onPredictions,
  onShowComment,
  onAddToBets,
  onToggleSelect,
  onAddToRisky,
}: Props) {
  const formInfo = getFormInfo(match.formStability);
  const isFinished = match.matchStatus === "finished";
  const isLive = match.matchStatus === "live";
  const hasPrediction =
    match.predictionPercentTeam1 != null &&
    match.predictionPercentTeam2 != null &&
    ((match.predictionPercentTeam1 ?? 0) > 0 ||
      (match.predictionPercentTeam2 ?? 0) > 0);
  const hasAiPrediction = aiPredictions[match.id] != null;
  const showPrediction = hasPrediction || hasAiPrediction;
  const hasCoeffs =
    match.bettingCoefficientTeam1 != null &&
    match.bettingCoefficientTeam2 != null &&
    ((match.bettingCoefficientTeam1 ?? 0) > 0 ||
      (match.bettingCoefficientTeam2 ?? 0) > 0);
  const formLabelWithTeam = `${match.favorite}: ${formInfo.label}`;

  return (
    <tr
      className={`border-b border-gray-100 hover:bg-gray-50 transition-all duration-200 ${isFinished ? "opacity-60" : ""} ${isSelected ? "bg-blue-50/60 !border-l-blue-500" : ""}`}
    >
      {visibleColumns.has("rating") && (
        <td className={`py-4 px-3 ${colDivider}`}>
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => onRate(match.id, "like")}
              className={`flex items-center justify-center w-9 h-9 rounded-md transition-all active:scale-[0.96] ${currentRating === "like" ? "bg-green-500 text-white shadow-sm" : "text-gray-500 hover:bg-green-50 hover:text-green-500 border border-transparent hover:border-green-200"}`}
              aria-label="Цікавий матч"
              title="Цікавий"
            >
              <ThumbsUp
                className="h-4 w-4"
                strokeWidth={currentRating === "like" ? 2 : 1.5}
              />
            </button>
            <button
              onClick={() => onRate(match.id, "dislike")}
              className={`flex items-center justify-center w-9 h-9 rounded-md transition-all active:scale-[0.96] ${currentRating === "dislike" ? "bg-red-500 text-white shadow-sm" : "text-gray-500 hover:bg-red-50 hover:text-red-500 border border-transparent hover:border-red-200"}`}
              aria-label="Нецікавий матч"
              title="Не цікавий"
            >
              <ThumbsDown
                className="h-4 w-4"
                strokeWidth={currentRating === "dislike" ? 2 : 1.5}
              />
            </button>
          </div>
        </td>
      )}
      {visibleColumns.has("match") && (
        <td className={`py-3 px-4 ${colDivider}`}>
          {/* Tournament text — full width, no divider interference */}
          {typeof match.context === "string" && match.context && (
            <div
              className="text-[11px] text-gray-700 font-medium truncate flex items-center gap-1 mb-1"
              title={match.context}
            >
              <Trophy
                className="h-3 w-3 text-amber-500 flex-shrink-0"
                strokeWidth={1.5}
              />
              {match.context}
            </div>
          )}
          {/* Main row: time/status sidebar + teams/badges */}
          <div className="flex items-stretch gap-3">
            {/* Left sidebar: time (aligned with teams) + status (aligned with badges) */}
            <div className="flex flex-col items-center min-w-[48px] pr-3 border-r border-gray-200 space-y-1">
              <div className="flex items-center" style={{ minHeight: 28 }}>
                <span className="text-sm font-semibold text-gray-900 leading-tight">
                  {formatTime(match.date)}
                </span>
              </div>
              <div className="flex items-center" style={{ minHeight: 22 }}>
                <span className="text-[10px] font-bold text-gray-900 bg-gray-100 rounded px-1.5 py-0.5">
                  {match.matchType}
                </span>
              </div>
            </div>
            {/* Right: teams + badges */}
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <TeamLogo
                    src={match.logoTeam1}
                    teamName={match.team1}
                    game={match.game}
                    size={28}
                  />
                  <span className="font-semibold text-gray-900 text-base">
                    {match.team1}
                  </span>
                </div>
                <span className="text-gray-400 text-xs font-medium">vs</span>
                <div className="flex items-center gap-1.5">
                  <TeamLogo
                    src={match.logoTeam2}
                    teamName={match.team2}
                    game={match.game}
                    size={28}
                  />
                  <span className="font-semibold text-gray-900 text-base">
                    {match.team2}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {match.game && (
                  <Badge
                    className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                      match.game === "CS2"
                        ? "bg-yellow-100 text-amber-800"
                        : "bg-violet-100 text-[#5B21B6]"
                    }`}
                  >
                    {match.game}
                  </Badge>
                )}
                <Tooltip>
                  <TooltipTrigger>
                    <Badge
                      className={`${formInfo.color} rounded-md px-1.5 py-0.5 text-xs font-semibold inline-flex items-center gap-0.5`}
                    >
                      {formInfo.icon}
                      <span className="truncate">{formLabelWithTeam}</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-gray-900 text-white p-3 rounded-xl">
                    <p className="text-sm font-semibold mb-1">
                      {match.favorite}
                    </p>
                    <p className="text-sm">{formInfo.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </td>
      )}
      {visibleColumns.has("time") && <td className="hidden"></td>}
      {visibleColumns.has("score") && (
        <td className={`py-3 px-2 text-center ${colDivider}`}>
          {isFinished &&
          typeof match.score1 === "number" &&
          typeof match.score2 === "number" ? (
            <div className="flex items-center justify-center gap-0.5">
              <span
                className={`text-base font-bold ${
                  match.score1 > match.score2
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {match.score1}
              </span>
              <span className="text-base font-medium text-gray-400">:</span>
              <span
                className={`text-base font-bold ${
                  match.score2 > match.score1
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {match.score2}
              </span>
            </div>
          ) : typeof match.url === "string" ? (
            <a
              href={match.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all text-gray-500"
              title="Відкрити матч"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <span className="text-gray-400 text-sm">—</span>
          )}
        </td>
      )}
      {visibleColumns.has("status") && <td className="hidden"></td>}
      {visibleColumns.has("ai") && (
        <td className={`py-3 px-2 text-center ${colDivider}`}>
          <div className="flex items-center justify-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onPredictions(match)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all active:scale-[0.96]"
                  aria-label="Аналіз прогнозів"
                >
                  <BarChart3
                    className="h-4 w-4 text-blue-600"
                    strokeWidth={1.5}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white p-2 rounded-lg">
                <p className="text-sm">Аналіз прогнозів</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onAIRecommend(match)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#F5F3FF] hover:bg-violet-100 border border-[#DDD6FE] transition-all active:scale-[0.96]"
                  aria-label="AI рекомендація"
                >
                  <Lightbulb
                    className="h-4 w-4 text-[#7C3AED]"
                    strokeWidth={1.5}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white p-2 rounded-lg">
                <p className="text-sm">AI рекомендація</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </td>
      )}
      {visibleColumns.has("prediction") && (
        <td className={`py-3 px-2 text-center ${colDivider}`}>
          {showPrediction ? (
            <PredictionBar
              percent1={match.predictionPercentTeam1 ?? 0}
              percent2={match.predictionPercentTeam2 ?? 0}
              team1={match.team1}
              team2={match.team2}
              aiPrediction={aiPredictions[match.id]}
              matchStatus={match.matchStatus}
              score1={match.score1}
              score2={match.score2}
              matchType={match.matchType}
            />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center justify-center cursor-help">
                  <Info
                    className="h-3.5 w-3.5 text-gray-400 hover:text-gray-500 transition-colors"
                    strokeWidth={1.5}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] bg-gray-900 text-white p-3 rounded-xl">
                <p className="text-sm">Прогноз ще недоступний</p>
              </TooltipContent>
            </Tooltip>
          )}
        </td>
      )}
      {visibleColumns.has("odds") && (
        <td className={`py-3 px-2 text-center ${colDivider}`}>
          {hasCoeffs ? (
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs">
                <TeamLogo
                  src={match.logoTeam1}
                  teamName={match.team1}
                  game={match.game}
                  size={16}
                />
                <span
                  className={`font-bold ${(match.bettingCoefficientTeam1 ?? 0) < (match.bettingCoefficientTeam2 ?? 0) ? "text-green-500" : "text-gray-900"}`}
                >
                  {formatCoeff(match.bettingCoefficientTeam1)}
                </span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs">
                <TeamLogo
                  src={match.logoTeam2}
                  teamName={match.team2}
                  game={match.game}
                  size={16}
                />
                <span
                  className={`font-bold ${(match.bettingCoefficientTeam2 ?? 0) < (match.bettingCoefficientTeam1 ?? 0) ? "text-green-500" : "text-gray-900"}`}
                >
                  {formatCoeff(match.bettingCoefficientTeam2)}
                </span>
              </div>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center justify-center cursor-help">
                  <Info
                    className="h-3.5 w-3.5 text-gray-400 hover:text-gray-500 transition-colors"
                    strokeWidth={1.5}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] bg-gray-900 text-white p-3 rounded-xl">
                <p className="text-sm">Коефіцієнти ще не виставлені</p>
              </TooltipContent>
            </Tooltip>
          )}
        </td>
      )}
      {visibleColumns.has("notes") && (
        <td
          className={`py-3 px-2 text-center ${colDivider}`}
          style={{ minWidth: 170 }}
        >
          <div className="flex flex-col items-center gap-2">
            {/* Always show "Додати нотатку" unless BOTH teams are already risky */}
            {(!team1Risky || !team2Risky) && (
              <button
                onClick={() => onAddToRisky(match)}
                className="!inline-flex !flex-row !flex-nowrap items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-[#3568e0] text-white text-xs font-medium shadow-sm whitespace-nowrap"
              >
                <PlusCircle
                  className="h-3.5 w-3.5 shrink-0"
                  strokeWidth={1.5}
                />
                <span>Додати нотатку</span>
              </button>
            )}

            {/* Risky team comment — when at least one team is risky */}
            {(team1Risky || team2Risky) && (
              <button
                onClick={() => onShowComment(match)}
                className="!inline-flex !flex-row !flex-nowrap items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 hover:text-blue-700 text-xs font-medium shadow-sm whitespace-nowrap transition-all"
              >
                <Eye className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                <span>Переглянути нотатку</span>
              </button>
            )}
          </div>
        </td>
      )}
      {visibleColumns.has("actions") && (
        <td className="py-4 px-3 text-center min-w-[110px]">
          <div className="flex items-center justify-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onAddToBets(match)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-green-50 hover:bg-[#DCFCE7] border border-green-200 hover:border-[#86EFAC] text-green-600 hover:text-[#15803D] transition-all active:scale-[0.96]"
                  aria-label="Додати до записів"
                >
                  <PlusCircle className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white p-2 rounded-lg">
                <p className="text-sm">Додати до Записів</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onToggleSelect(match.id)}
                  className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all active:scale-[0.96] ${isSelected ? "bg-blue-500 text-white shadow-sm border border-blue-500" : "text-gray-400 hover:bg-blue-50 hover:text-blue-500 border border-gray-200 hover:border-[#93C5FD]"}`}
                  aria-label={
                    isSelected ? "Прибрати з експресу" : "Додати до експресу"
                  }
                >
                  {isSelected ? (
                    <CircleCheck className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    <Layers className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white p-2 rounded-lg">
                <p className="text-sm">
                  {isSelected ? "Прибрати з експресу" : "Додати до експресу"}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </td>
      )}
    </tr>
  );
}
