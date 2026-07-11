import React from "react";
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
  Clock,
  CheckCircle2,
  Radio,
  Brain,
  Flame,
  Shield,
  Layers,
  CircleCheck,
  Info,
  Star,
  Trophy,
} from "lucide-react";
import { RippleButton } from "@/components/ui/ripple-button";

type FormStability =
  | "hot_streak"
  | "stable"
  | "momentum"
  | "falling"
  | "slump"
  | "inconsistent";
type MatchRating = "like" | "dislike" | null;

interface Match {
  id: string;
  date: string;
  team1: string;
  team2: string;
  favorite: string;
  aiConfidence: number;
  risk: number;
  matchType: "Bo1" | "Bo2" | "Bo3" | "Bo5";
  game?: "CS2" | "Dota2";
  tier: "tier1" | "tier2" | "tier3";
  formStability: FormStability;
  context?: string;
  matchStatus?: "upcoming" | "live" | "finished";
  score1?: number;
  score2?: number;
  predictionPercentTeam1?: number | null;
  predictionPercentTeam2?: number | null;
  bettingCoefficientTeam1?: number | null;
  bettingCoefficientTeam2?: number | null;
  logoTeam1?: string | null;
  logoTeam2?: string | null;
  stars?: number;
}

interface AIRecommendation {
  prediction?: string;
  confidence?: number;
}

interface Props {
  match: Match;
  matchRatings: Record<string, MatchRating>;
  aiPredictions: Record<string, AIRecommendation>;
  isSelected: boolean;
  currentRating: MatchRating;
  colDivider: string;
  hasRiskyTeam: boolean;
  visibleColumns: Set<string>;
  onRate: (id: string, rating: MatchRating) => void;
  onAIRecommend: (match: Match) => void;
  onShowComment: (match: Match) => void;
  onAddToBets: (match: Match) => void;
  onToggleSelect: (id: string) => void;
  onAddToRisky: (match: Match) => void;
}

const TeamLogo = ({
  src,
  teamName,
  size = 26,
}: {
  src?: string | null;
  teamName: string;
  size?: number;
}) => {
  if (!src)
    return (
      <div
        className="flex items-center justify-center rounded-md bg-[#F3F4F6] text-[#374151] font-bold text-xs flex-shrink-0"
        style={{ width: size, height: size, minWidth: size }}
      >
        {teamName.charAt(0).toUpperCase()}
      </div>
    );
  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, minWidth: size }}
    >
      <img
        src={src}
        alt={teamName}
        className="w-full h-full object-contain"
        onError={(e) => {
          const t = e.target as HTMLImageElement;
          t.style.display = "none";
          const d = document.createElement("div");
          d.className =
            "flex items-center justify-center w-full h-full rounded-md bg-[#F3F4F6] text-[#374151] font-bold text-xs";
          d.textContent = teamName.charAt(0).toUpperCase();
          t.parentNode?.appendChild(d);
        }}
      />
    </div>
  );
};

const PredictionBar = ({
  percent1,
  percent2,
  team1,
  team2,
  aiPrediction,
}: {
  percent1: number;
  percent2: number;
  team1: string;
  team2: string;
  aiPrediction?: AIRecommendation | null;
}) => {
  const total = percent1 + percent2;
  const w1 = total > 0 ? Math.round((percent1 / total) * 100) : 50;
  const w2 = total > 0 ? 100 - w1 : 50;
  const isFav = percent1 >= percent2;
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
              className={isFav ? "font-bold text-[#111827]" : "text-[#4B5563]"}
            >
              {percent1}%
            </span>
            <span
              className={!isFav ? "font-bold text-[#111827]" : "text-[#4B5563]"}
            >
              {percent2}%
            </span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-[#E5E7EB]">
            <div
              className={`transition-all duration-300 ${isFav ? "bg-[#22C55E]" : "bg-[#3B82F6]"}`}
              style={{ width: `${w1}%` }}
            />
            <div
              className={`transition-all duration-300 ${!isFav ? "bg-[#22C55E]" : "bg-[#3B82F6]"}`}
              style={{ width: `${w2}%` }}
            />
          </div>
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
            <span className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
              <Brain className="h-3 w-3 text-[#9CA3AF]" strokeWidth={1.5} />
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
          <div className="flex h-1.5 rounded-full overflow-hidden bg-[#F3F4F6]">
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
function getMatchStatusBadgeCompact(status?: "upcoming" | "live" | "finished") {
  switch (status) {
    case "live":
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-white leading-none bg-red-500 rounded px-1.5 py-0.5 cursor-default">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
          </TooltipTrigger>
          <TooltipContent className="bg-[#111827] text-white p-2 rounded-lg">
            <p className="text-xs">Зараз грають</p>
          </TooltipContent>
        </Tooltip>
      );
    case "finished":
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#6B7280] leading-none bg-[#F3F4F6] rounded px-1.5 py-0.5 cursor-default">
              <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
              ЗАВЕР
            </span>
          </TooltipTrigger>
          <TooltipContent className="bg-[#111827] text-white p-2 rounded-lg">
            <p className="text-xs">Завершено</p>
          </TooltipContent>
        </Tooltip>
      );
    case "upcoming":
    default:
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#2563EB] leading-none bg-[#EFF6FF] rounded px-1.5 py-0.5 cursor-default">
              <Clock className="h-3 w-3" strokeWidth={2} />
              ОЧІКУ
            </span>
          </TooltipTrigger>
          <TooltipContent className="bg-[#111827] text-white p-2 rounded-lg">
            <p className="text-xs">Очікується</p>
          </TooltipContent>
        </Tooltip>
      );
  }
}

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

const getMatchStatusBadge = (status?: "upcoming" | "live" | "finished") => {
  switch (status) {
    case "live":
      return (
        <Badge className="bg-red-500/10 text-red-600 border-red-200 rounded-lg px-2.5 py-1 text-sm font-medium inline-flex items-center gap-1.5 animate-pulse">
          <Radio className="h-3.5 w-3.5" strokeWidth={2} />
          LIVE
        </Badge>
      );
    case "finished":
      return (
        <Badge className="bg-gray-100 text-gray-600 border-gray-200 rounded-lg px-2.5 py-1 text-sm font-medium inline-flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
          Завершено
        </Badge>
      );
    case "upcoming":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200 rounded-lg px-2.5 py-1 text-sm font-medium inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" strokeWidth={2} />
          Очікується
        </Badge>
      );
    default:
      return null;
  }
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
  matchRatings,
  aiPredictions,
  isSelected,
  currentRating,
  colDivider,
  hasRiskyTeam,
  visibleColumns,
  onRate,
  onAIRecommend,
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
      className={`border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition-all duration-200 ${isFinished ? "opacity-60" : ""} ${isLive ? "bg-red-50/30" : ""} ${isSelected ? "bg-[#EFF6FF]/60 !border-l-[#3B82F6]" : ""}`}
    >
      {visibleColumns.has("rating") && (
        <td className={`py-4 px-3 ${colDivider}`}>
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => onRate(match.id, "like")}
              className={`flex items-center justify-center w-9 h-9 rounded-md transition-all ${currentRating === "like" ? "bg-[#22C55E] text-white shadow-sm" : "text-[#6B7280] hover:bg-[#F0FDF4] hover:text-[#22C55E] border border-transparent hover:border-[#BBF7D0]"}`}
              title="Цікавий"
            >
              <ThumbsUp
                className="h-4 w-4"
                strokeWidth={currentRating === "like" ? 2 : 1.5}
              />
            </button>
            <button
              onClick={() => onRate(match.id, "dislike")}
              className={`flex items-center justify-center w-9 h-9 rounded-md transition-all ${currentRating === "dislike" ? "bg-[#EF4444] text-white shadow-sm" : "text-[#6B7280] hover:bg-[#FEF2F2] hover:text-[#EF4444] border border-transparent hover:border-[#FECACA]"}`}
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
          {match.context && (
            <div
              className="text-[11px] text-[#9CA3AF] font-medium truncate flex items-center gap-1 mb-1"
              title={match.context}
            >
              <Trophy
                className="h-3 w-3 text-[#9CA3AF] flex-shrink-0"
                strokeWidth={1.5}
              />
              {match.context}
            </div>
          )}
          {/* Main row: time/status sidebar + teams/badges */}
          <div className="flex items-stretch gap-3">
            {/* Left sidebar: time (aligned with teams) + status (aligned with badges) */}
            <div className="flex flex-col items-center min-w-[48px] pr-3 border-r border-[#E5E7EB] space-y-1">
              <div className="flex items-center" style={{ minHeight: 28 }}>
                <span className="text-sm font-semibold text-[#111827] leading-tight">
                  {formatTime(match.date)}
                </span>
              </div>
              <div className="flex items-center" style={{ minHeight: 22 }}>
                {getMatchStatusBadgeCompact(match.matchStatus)}
              </div>
            </div>
            {/* Right: teams + badges */}
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <TeamLogo
                    src={match.logoTeam1}
                    teamName={match.team1}
                    size={28}
                  />
                  <span className="font-semibold text-[#111827] text-base">
                    {match.team1}
                  </span>
                </div>
                <span className="text-[#9CA3AF] text-xs font-medium">vs</span>
                <div className="flex items-center gap-1.5">
                  <TeamLogo
                    src={match.logoTeam2}
                    teamName={match.team2}
                    size={28}
                  />
                  <span className="font-semibold text-[#111827] text-base">
                    {match.team2}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {match.game && (
                  <Badge
                    className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                      match.game === "CS2"
                        ? "bg-[#FEF3C7] text-[#92400E]"
                        : "bg-[#EDE9FE] text-[#5B21B6]"
                    }`}
                  >
                    {match.game}
                  </Badge>
                )}
                <Badge className="bg-[#F3F4F6] text-[#1F2937] border-0 rounded-md px-1.5 py-0.5 text-xs font-semibold">
                  {match.matchType}
                </Badge>
                <Badge className="bg-[#111827] text-white border-0 rounded-md px-1.5 py-0.5 text-xs font-semibold uppercase">
                  {match.tier}
                </Badge>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge
                      className={`${formInfo.color} rounded-md px-1.5 py-0.5 text-xs font-semibold inline-flex items-center gap-0.5 max-w-[120px]`}
                    >
                      {formInfo.icon}
                      <span className="truncate">{formLabelWithTeam}</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-[#111827] text-white p-3 rounded-xl">
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
          {match.score1 !== undefined && match.score2 !== undefined ? (
            <div className="flex items-center justify-center gap-0.5">
              <span
                className={`text-base font-bold ${isFinished && match.score1! > match.score2! ? "text-[#22C55E]" : isFinished && match.score1! < match.score2! ? "text-[#EF4444]" : "text-[#111827]"}`}
              >
                {match.score1}
              </span>
              <span className="text-[#9CA3AF] text-base font-medium">:</span>
              <span
                className={`text-base font-bold ${isFinished && match.score2! > match.score1! ? "text-[#22C55E]" : isFinished && match.score2! < match.score1! ? "text-[#EF4444]" : "text-[#111827]"}`}
              >
                {match.score2}
              </span>
            </div>
          ) : (
            <span className="text-[#9CA3AF] text-sm">—</span>
          )}
        </td>
      )}
      {visibleColumns.has("status") && <td className="hidden"></td>}
      {visibleColumns.has("ai") && (
        <td className={`py-3 px-2 text-center ${colDivider}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onAIRecommend(match)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#F5F3FF] hover:bg-[#EDE9FE] border border-[#DDD6FE] transition-all"
              >
                <Lightbulb
                  className="h-4 w-4 text-[#7C3AED]"
                  strokeWidth={1.5}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#111827] text-white p-2 rounded-lg">
              <p className="text-sm">AI рекомендація</p>
            </TooltipContent>
          </Tooltip>
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
            />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center justify-center cursor-help">
                  <Info
                    className="h-3.5 w-3.5 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                    strokeWidth={1.5}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] bg-[#111827] text-white p-3 rounded-xl">
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
                  size={16}
                />
                <span
                  className={`font-bold ${(match.bettingCoefficientTeam1 ?? 0) < (match.bettingCoefficientTeam2 ?? 0) ? "text-[#22C55E]" : "text-[#111827]"}`}
                >
                  {formatCoeff(match.bettingCoefficientTeam1)}
                </span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs">
                <TeamLogo
                  src={match.logoTeam2}
                  teamName={match.team2}
                  size={16}
                />
                <span
                  className={`font-bold ${(match.bettingCoefficientTeam2 ?? 0) < (match.bettingCoefficientTeam1 ?? 0) ? "text-[#22C55E]" : "text-[#111827]"}`}
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
                    className="h-3.5 w-3.5 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                    strokeWidth={1.5}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] bg-[#111827] text-white p-3 rounded-xl">
                <p className="text-sm">Коефіцієнти ще не виставлені</p>
              </TooltipContent>
            </Tooltip>
          )}
        </td>
      )}
      {visibleColumns.has("notes") && (
        <td
          className={`py-3 px-2 text-center ${colDivider}`}
          style={{ minWidth: 150 }}
        >
          {/* Add to risky teams — ripple button */}
          {!hasRiskyTeam && (
            <RippleButton
              onClick={() => onAddToRisky(match)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#447afc] hover:bg-[#3568e0] text-white text-xs font-medium shadow-sm whitespace-nowrap"
            >
              <PlusCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
              Додати запис
            </RippleButton>
          )}

          {/* Risky team comment — only when team is already risky */}
          {hasRiskyTeam && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onShowComment(match)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] transition-all"
                >
                  <Eye
                    className="h-3.5 w-3.5 text-[#2563EB]"
                    strokeWidth={1.5}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#111827] text-white p-2 rounded-lg">
                <p className="text-sm">Коментар</p>
              </TooltipContent>
            </Tooltip>
          )}
        </td>
      )}
      {visibleColumns.has("actions") && (
        <td className="py-4 px-3 text-center min-w-[110px]">
          <div className="flex items-center justify-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onAddToBets(match)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#BBF7D0] hover:border-[#86EFAC] text-[#16A34A] hover:text-[#15803D] transition-all"
                >
                  <PlusCircle className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#111827] text-white p-2 rounded-lg">
                <p className="text-sm">Додати до Записів</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onToggleSelect(match.id)}
                  className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${isSelected ? "bg-[#3B82F6] text-white shadow-sm border border-[#3B82F6]" : "text-[#9CA3AF] hover:bg-[#EFF6FF] hover:text-[#3B82F6] border border-[#E5E7EB] hover:border-[#93C5FD]"}`}
                >
                  {isSelected ? (
                    <CircleCheck className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    <Layers className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#111827] text-white p-2 rounded-lg">
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
