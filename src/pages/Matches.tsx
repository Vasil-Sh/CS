import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserDataService } from "@/lib/userDataService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BorderBeam } from "@/components/ui/border-beam";
import { BlurFade } from "@/components/ui/blur-fade";
import {
  Calendar,
  Trophy,
  RefreshCw,
  ArrowUpDown,
  Search,
  Loader2,
  Shield,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Radio,
  ArrowUp,
  ArrowDown,
  PlusCircle,
  Layers,
  Columns,
  X,
  ChevronDown,
} from "lucide-react";
import { CARD_BASE_STYLE, CARD_HOVER_STYLE } from "@/lib/cardStyles";
import { logRender } from "@/lib/devLogger";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/PageHeader";
import AIRecommendationModal from "@/components/AIRecommendationModal";
import CommentModal from "@/components/CommentModal";
import AddToRiskyTeamsModal from "@/components/matches/AddToRiskyTeamsModal";
import {
  MatchesLoadingState,
  MatchesEmptyState,
} from "@/components/matches/MatchStates";
import MatchRow from "@/components/matches/MatchRow";
import { deepSeekService, type AIRecommendation } from "@/lib/deepSeekService";
import {
  fetchTodaysAndUpcomingMatches,
  parseMatchType,
  parseMatchContext,
  determineTier,
  determineFavorite,
  getMatchStatus,
  buildHltvUrl,
  type ApiMatch,
} from "@/lib/csApi";
import {
  fetchDota2Matches,
  parseDota2MatchType,
  parseDota2MatchContext,
  buildTipsGgUrl,
  clearDota2Cache,
  getDota2MatchStatus,
  type Dota2ApiMatch,
} from "@/lib/dota2Api";

// Form Stability Types
type FormStability =
  | "hot_streak"
  | "stable"
  | "momentum"
  | "falling"
  | "slump"
  | "inconsistent";

interface RiskyTeam {
  name: string;
  game: string;
  status: string;
  notes: string;
}

interface Match {
  id: string;
  date: string;
  team1: string;
  team2: string;
  favorite: string;
  aiConfidence: number;
  risk: number;
  comment: string;
  aiSummary: string;
  odds: {
    team1: number;
    team2: number;
  };
  winRate: number;
  formStability: FormStability;
  playerForm: {
    player: string;
    rating: number;
  }[];
  context: string;
  tier: "tier1" | "tier2" | "tier3" | null;
  matchType: "Bo1" | "Bo2" | "Bo3" | "Bo5";
  game: "CS2" | "Dota2";
  upsetProbability: number;
  url?: string;
  score1?: number;
  score2?: number;
  matchStatus?: "upcoming" | "live" | "finished";
  positionTeam1?: number | null;
  positionTeam2?: number | null;
  logoTeam1?: string | null;
  logoTeam2?: string | null;
  predictionPercentTeam1?: number | null;
  predictionPercentTeam2?: number | null;
  bettingCoefficientTeam1?: number | null;
  bettingCoefficientTeam2?: number | null;
  stars?: number;
  /** Raw slug from tips.gg URL — used for live-score ID matching */
  dota2Slug?: string;
  /** Raw slug for CS2 live-score matching */
  cs2Slug?: string;
}

type MatchRating = "like" | "dislike" | null;

/** Load match ratings from localStorage */
const loadMatchRatings = (): Record<string, MatchRating> => {
  try {
    const saved = localStorage.getItem("match_ratings");
    if (saved) return JSON.parse(saved);
  } catch (e) {
    if (import.meta.env.DEV)
      console.warn("[Matches] Error loading ratings:", e);
  }
  return {};
};

/** Save match ratings to localStorage AND sync to API */
const saveMatchRatings = (ratings: Record<string, MatchRating>) => {
  try {
    localStorage.setItem("match_ratings", JSON.stringify(ratings));
  } catch (e) {
    if (import.meta.env.DEV) console.warn("[Matches] Error saving ratings:", e);
  }
};

function apiMatchToMatch(
  apiMatch: ApiMatch,
  game: "CS2" | "Dota2" = "CS2",
): Match {
  const matchType = parseMatchType(apiMatch.type);
  const context =
    game === "CS2"
      ? apiMatch.tournament && apiMatch.stage
        ? `${apiMatch.tournament} — ${apiMatch.stage}`
        : apiMatch.tournament || parseMatchContext(apiMatch.type, apiMatch.link)
      : parseDota2MatchContext(apiMatch as unknown as Dota2ApiMatch);
  const tier = determineTier(apiMatch.positionTeam1, apiMatch.positionTeam2);
  const favorite = determineFavorite(
    apiMatch.nameTeam1,
    apiMatch.nameTeam2,
    apiMatch.positionTeam1,
    apiMatch.positionTeam2,
  );
  const status = getMatchStatus(apiMatch);

  const pos1 = apiMatch.positionTeam1;
  const pos2 = apiMatch.positionTeam2;
  const hasPositions = pos1 != null && pos2 != null;
  const posDiff = hasPositions ? Math.abs(pos1 - pos2) : 0;

  const pred1 = apiMatch.predictionPercentTeam1;
  const pred2 = apiMatch.predictionPercentTeam2;
  const hasPrediction =
    pred1 != null && pred2 != null && (pred1 > 0 || pred2 > 0);
  const baseConfidence = hasPrediction
    ? Math.round(Math.max(pred1 ?? 0, pred2 ?? 0))
    : Math.min(85, 55 + Math.floor(posDiff * 0.3));

  const risk = Math.max(
    10,
    100 - baseConfidence - Math.floor((posDiff * 7) % 10),
  );

  const winRate = hasPrediction
    ? Math.round(Math.max(pred1 ?? 0, pred2 ?? 0))
    : Math.min(80, Math.max(50, 50 + Math.floor(posDiff * 0.25)));

  const coeff1 = apiMatch.bettingCoefficientTeam1;
  const coeff2 = apiMatch.bettingCoefficientTeam2;
  const hasCoeffs =
    coeff1 != null && coeff2 != null && (coeff1 > 0 || coeff2 > 0);

  let formStability: FormStability = "stable";

  // Derive form stability from prediction data
  if (hasPrediction) {
    const predFav = pred1! >= pred2! ? pred1! : pred2!;
    const isFavTeam1 = pred1! >= pred2!;
    const favPred = predFav;
    const underdogPred = 100 - favPred;

    const isFavMatch =
      favorite === (isFavTeam1 ? apiMatch.nameTeam1 : apiMatch.nameTeam2);

    if (isFavMatch) {
      // Favorite's form
      if (favPred >= 75) formStability = "hot_streak";
      else if (favPred >= 65) formStability = "momentum";
      else if (favPred >= 55) formStability = "stable";
      else formStability = "inconsistent";
    } else {
      // Underdog's form
      if (underdogPred <= 25) formStability = "slump";
      else if (underdogPred <= 35) formStability = "falling";
      else if (underdogPred <= 45) formStability = "inconsistent";
      else formStability = "stable";
    }
  }

  // Score-based override for finished matches
  const s1 = apiMatch.score1 ?? 0;
  const s2 = apiMatch.score2 ?? 0;
  const hasScores = s1 + s2 > 0;
  if (status === "finished" && hasScores) {
    const isFavTeam1 = (pred1 ?? 50) >= (pred2 ?? 50);
    const favWon = isFavTeam1 ? s1 > s2 : s2 > s1;
    const isFavMatch =
      favorite === (isFavTeam1 ? apiMatch.nameTeam1 : apiMatch.nameTeam2);

    if (isFavMatch) {
      formStability = favWon ? "hot_streak" : "slump";
    } else {
      formStability = favWon ? "stable" : "falling";
    }

    // Decisive score = even better form for winner
    if (favWon) {
      const totalMaps = s1 + s2;
      const decWins = Math.abs(s1 - s2);
      if (decWins >= 2 && totalMaps >= 3) formStability = "hot_streak";
      else if (decWins >= 1 && totalMaps >= 2) formStability = "momentum";
    }
  }

  // Old position-based logic (only when real positions available)
  if (hasPositions && posDiff <= 10) {
    formStability = "inconsistent";
  }

  // Old date-change logic (only when data available)
  const now = new Date();
  const team1Change = apiMatch.lastChangeDateTeam1
    ? new Date(apiMatch.lastChangeDateTeam1)
    : null;
  const team2Change = apiMatch.lastChangeDateTeam2
    ? new Date(apiMatch.lastChangeDateTeam2)
    : null;
  const favChange = favorite === apiMatch.nameTeam1 ? team1Change : team2Change;
  if (favChange) {
    const daysSinceChange = Math.floor(
      (now.getTime() - favChange.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceChange <= 14) formStability = "inconsistent";
    else if (daysSinceChange <= 30) formStability = "momentum";
  }

  return {
    id: String(apiMatch.id),
    date: apiMatch.date,
    team1: apiMatch.nameTeam1,
    team2: apiMatch.nameTeam2,
    favorite,
    aiConfidence: baseConfidence,
    risk,
    comment: "",
    aiSummary: "",
    odds: {
      team1: hasCoeffs ? (coeff1 ?? 0) : 0,
      team2: hasCoeffs ? (coeff2 ?? 0) : 0,
    },
    winRate,
    formStability,
    playerForm: [],
    context,
    tier,
    matchType,
    upsetProbability: Math.max(5, Math.min(45, 50 - Math.floor(posDiff * 0.3))),
    url:
      game === "CS2"
        ? buildHltvUrl(apiMatch.link)
        : buildTipsGgUrl(apiMatch.link),
    score1: apiMatch.score1,
    score2: apiMatch.score2,
    matchStatus: status,
    cs2Slug: apiMatch.cs2Slug,
    positionTeam1: apiMatch.positionTeam1,
    positionTeam2: apiMatch.positionTeam2,
    logoTeam1: apiMatch.logoTeam1,
    logoTeam2: apiMatch.logoTeam2,
    predictionPercentTeam1: apiMatch.predictionPercentTeam1,
    predictionPercentTeam2: apiMatch.predictionPercentTeam2,
    bettingCoefficientTeam1: apiMatch.bettingCoefficientTeam1,
    bettingCoefficientTeam2: apiMatch.bettingCoefficientTeam2,
    stars: apiMatch.stars,
    game,
  };
}

/** Convert a Dota2 API match to unified Match format */
function dota2ApiMatchToMatch(m: Dota2ApiMatch): Match {
  // Use backend-supplied prediction % directly (already normalized from bookmaker coefficients)
  const pred1 = m.predictionPercentTeam1;
  const pred2 = m.predictionPercentTeam2;
  const hasPrediction =
    pred1 != null && pred2 != null && (pred1 > 0 || pred2 > 0);

  const confidence = hasPrediction ? Math.max(pred1 ?? 50, pred2 ?? 50) : 50;

  const fav = hasPrediction
    ? (pred1 ?? 50) >= (pred2 ?? 50)
      ? m.nameTeam1
      : m.nameTeam2
    : m.nameTeam1;

  // Extract slug from link for live-score ID matching
  // "/matches/dota2/DD-MM-YYYY/SLUG/HH-MM/" → "SLUG"
  const slugParts = m.link.replace(/\/$/, "").split("/");
  const dota2Slug = slugParts[slugParts.length - 2] || "";

  // --- Form stability from prediction data ---
  let formStability: FormStability = "stable";
  if (hasPrediction) {
    const predFav = Math.max(pred1 ?? 50, pred2 ?? 50);
    const isFavTeam1 = (pred1 ?? 50) >= (pred2 ?? 50);
    const favPred = predFav;
    const underdogPred = 100 - favPred;
    const isFavMatch = fav === (isFavTeam1 ? m.nameTeam1 : m.nameTeam2);

    if (isFavMatch) {
      if (favPred >= 75) formStability = "hot_streak";
      else if (favPred >= 65) formStability = "momentum";
      else if (favPred >= 55) formStability = "stable";
      else formStability = "inconsistent";
    } else {
      if (underdogPred <= 25) formStability = "slump";
      else if (underdogPred <= 35) formStability = "falling";
      else if (underdogPred <= 45) formStability = "inconsistent";
      else formStability = "stable";
    }
  }

  // Score-based override for finished matches
  const s1 = m.score1 ?? 0;
  const s2 = m.score2 ?? 0;
  const hasScores = s1 + s2 > 0;
  const matchStatus = getDota2MatchStatus(m);
  if (matchStatus === "finished" && hasScores) {
    const isFavTeam1 = (pred1 ?? 50) >= (pred2 ?? 50);
    const favWon = isFavTeam1 ? s1 > s2 : s2 > s1;
    const isFavMatch = fav === (isFavTeam1 ? m.nameTeam1 : m.nameTeam2);

    if (isFavMatch) {
      formStability = favWon ? "hot_streak" : "slump";
    } else {
      formStability = favWon ? "stable" : "falling";
    }

    if (favWon) {
      const totalMaps = s1 + s2;
      if (Math.abs(s1 - s2) >= 2 && totalMaps >= 3)
        formStability = "hot_streak";
      else if (Math.abs(s1 - s2) >= 1 && totalMaps >= 2)
        formStability = "momentum";
    }
  }

  return {
    id: `dota-${m.id}`,
    date: m.date,
    team1: m.nameTeam1,
    team2: m.nameTeam2,
    favorite: fav,
    aiConfidence: confidence,
    risk: hasPrediction ? Math.max(5, 100 - confidence - 5) : 30,
    comment: "",
    aiSummary: "",
    odds: {
      team1: m.bettingCoefficientTeam1 ?? 0,
      team2: m.bettingCoefficientTeam2 ?? 0,
    },
    winRate: confidence,
    formStability,
    playerForm: [],
    context: m.tournament
      ? `${m.tournament}${m.stage ? " — " + m.stage : ""}`
      : parseDota2MatchContext(m),
    tier: "tier2",
    matchType: parseDota2MatchType(m.type),
    upsetProbability: hasPrediction
      ? Math.max(
          5,
          Math.min(45, 50 - Math.abs((pred1 ?? 50) - (pred2 ?? 50)) * 0.5),
        )
      : 25,
    url: buildTipsGgUrl(m.link),
    score1: m.score1,
    score2: m.score2,
    matchStatus: getDota2MatchStatus(m),
    positionTeam1: m.positionTeam1,
    positionTeam2: m.positionTeam2,
    logoTeam1: m.logoTeam1,
    logoTeam2: m.logoTeam2,
    predictionPercentTeam1: m.predictionPercentTeam1,
    predictionPercentTeam2: m.predictionPercentTeam2,
    bettingCoefficientTeam1: m.bettingCoefficientTeam1,
    bettingCoefficientTeam2: m.bettingCoefficientTeam2,
    stars: m.stars,
    game: "Dota2",
    dota2Slug,
  };
}

const getStatusPriority = (
  status?: "upcoming" | "live" | "finished",
): number => {
  switch (status) {
    case "live":
      return 0;
    case "upcoming":
      return 1;
    case "finished":
      return 2;
    default:
      return 3;
  }
};

const cardBaseStyle = CARD_BASE_STYLE;

const cardHoverStyle = CARD_HOVER_STYLE;

/** Column divider style — right border */
const colDivider = "border-r border-gray-200";

/** All match table columns — id, label, default visibility */
const COLUMN_DEFS = [
  { id: "rating", label: "Інтерес до Матчу", defaultVisible: true },
  { id: "match", label: "Матч", defaultVisible: true },
  { id: "score", label: "Рахунок", defaultVisible: true },
  { id: "ai", label: "AI", defaultVisible: true },
  { id: "prediction", label: "Прогноз", defaultVisible: false },
  { id: "odds", label: "Коеф.", defaultVisible: false },
  { id: "notes", label: "Нотатки", defaultVisible: true },
  { id: "actions", label: "Додати до Записів", defaultVisible: true },
] as const;

const COLUMNS_STORAGE_KEY = "matchiq_columns_visible";

/** Load saved column visibility from localStorage, fall back to defaults */
const loadVisibleColumns = (): Set<string> => {
  try {
    const saved = localStorage.getItem(COLUMNS_STORAGE_KEY);
    if (saved) {
      const arr = JSON.parse(saved) as string[];
      if (Array.isArray(arr) && arr.length > 0) return new Set(arr);
    }
  } catch {
    /* ignore */
  }
  return new Set(COLUMN_DEFS.filter((c) => c.defaultVisible).map((c) => c.id));
};

/** Format date key for grouping: "YYYY-MM-DD". Safe for timezone-aware strings. */
const getDateKey = (dateStr: string): string => {
  // "2026-07-21" already — use directly (avoids new Date() UTC shift)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // "2026-07-21T01:04:00+0300" — extract date portion directly
  const m = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  // Fallback: parse normally
  const d = new Date(dateStr);
  return d.toISOString().split("T")[0];
};

/** Format full date title: "Матчі (П'ятниця, 10.07.2026)" — game-aware */
const formatFullDateTitle = (
  dateKey: string,
  gameFilter: "all" | "CS2" | "Dota2",
): string => {
  const d = new Date(dateKey + "T12:00:00");
  const dayNames = [
    "Неділя",
    "Понеділок",
    "Вівторок",
    "Середа",
    "Четвер",
    "П'ятниця",
    "Субота",
  ];
  const dayFull = dayNames[d.getDay()];
  const formatted = d.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const prefix =
    gameFilter === "CS2"
      ? "CS2 матчі"
      : gameFilter === "Dota2"
        ? "Dota 2 матчі"
        : "Матчі";
  return `${prefix} (${dayFull}, ${formatted})`;
};

/** Get today's date key in YYYY-MM-DD format */
const getTodayDateKey = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function Matches() {
  logRender("Matches");
  const { user } = useAuth();
  const currentUser = user?.username || "";
  const navigate = useNavigate();

  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sortBy, setSortBy] = useState<
    "date" | "confidence" | "risk" | "upset" | "status" | "odds"
  >("status");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterTier, setFilterTier] = useState<
    "all" | "tier1" | "tier2" | "tier3"
  >("all");
  const [filterDayOfWeek, setFilterDayOfWeek] = useState<
    "all" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
  >("all");
  const [filterRisk, setFilterRisk] = useState<
    "all" | "safe" | "moderate" | "high"
  >("all");
  const [filterTournament, setFilterTournament] = useState("all");
  const [filterMatchType, setFilterMatchType] = useState<
    "all" | "Bo1" | "Bo2" | "Bo3" | "Bo5"
  >("all");
  const [filterGame, setFilterGame] = useState<"all" | "CS2" | "Dota2">("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "upcoming" | "live" | "finished"
  >("all");
  const [visibleColumns, setVisibleColumns] =
    useState<Set<string>>(loadVisibleColumns);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, toggleTheme } = useTheme();
  const isDarkTheme = theme === "dark";

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [aiRecommendation, setAiRecommendation] =
    useState<AIRecommendation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  // Store AI predictions per match ID so they persist in the table
  const [aiPredictions, setAiPredictions] = useState<
    Record<string, AIRecommendation>
  >({});

  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedCommentMatch, setSelectedCommentMatch] =
    useState<Match | null>(null);

  // Add to risky teams modal
  const [riskyModalOpen, setRiskyModalOpen] = useState(false);
  const [selectedRiskyMatch, setSelectedRiskyMatch] = useState<Match | null>(
    null,
  );

  const [riskyTeams, setRiskyTeams] = useState<RiskyTeam[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // Match ratings state
  const [matchRatings, setMatchRatings] =
    useState<Record<string, MatchRating>>(loadMatchRatings);

  // Multi-select for Express
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(
    new Set(),
  );

  // Toggle a single column on/off
  const toggleColumn = (colId: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) {
        next.delete(colId);
      } else {
        next.add(colId);
      }
      localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  // Reset all filters
  const resetAllFilters = () => {
    setFilterGame("all");
    setFilterStatus("all");
    setFilterTier("all");
    setFilterMatchType("all");
    setFilterDayOfWeek("all");
    setFilterRisk("all");
    setFilterTournament("all");
    setSearchQuery("");
    const defaults = new Set(
      COLUMN_DEFS.filter((c) => c.defaultVisible).map((c) => c.id),
    );
    setVisibleColumns(defaults);
    localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify([...defaults]));
  };

  // Check if any filter is active
  const hasActiveFilters =
    filterGame !== "all" ||
    filterStatus !== "all" ||
    filterTier !== "all" ||
    filterMatchType !== "all" ||
    filterDayOfWeek !== "all" ||
    filterRisk !== "all" ||
    filterTournament !== "all" ||
    searchQuery !== "";

  useEffect(() => {
    loadMatchesFromApi();
    loadRiskyTeams();
  }, []);

  // ── Dota2 live-scores polling (30s) ──
  const hasDota2Matches = matches.some(
    (m) => m.game === "Dota2" && m.matchStatus !== "finished",
  );
  const pollLiveScores = useCallback(
    async (
      game: "Dota2" | "CS2",
      slugField: "dota2Slug" | "cs2Slug",
      endpoint: string,
    ) => {
      try {
        const resp = await fetch(endpoint);
        if (!resp.ok) return;
        const updates: Array<{
          id: string;
          score1: number | null;
          score2: number | null;
          status: string;
        }> = await resp.json();
        if (!Array.isArray(updates) || updates.length === 0) return;

        setMatches((prev) =>
          prev.map((m) => {
            if (m.game !== game || !m[slugField]) return m;
            const update = updates.find((u) => u.id === m[slugField]);
            if (!update) return m;
            if (m.matchStatus === "finished") return m;

            const newStatus =
              update.status === "finished"
                ? "finished"
                : update.status === "live"
                  ? "live"
                  : m.matchStatus;

            return {
              ...m,
              score1: update.score1 ?? m.score1,
              score2: update.score2 ?? m.score2,
              matchStatus: newStatus as "upcoming" | "live" | "finished",
            };
          }),
        );
      } catch {
        // Silent fail
      }
    },
    [],
  );

  // Dota2: poll every 30s
  useEffect(() => {
    if (!hasDota2Matches) return;
    const interval = setInterval(
      () =>
        pollLiveScores(
          "Dota2",
          "dota2Slug",
          "/api/v1/dota2-matches/live-scores",
        ),
      30000,
    );
    return () => clearInterval(interval);
  }, [hasDota2Matches, pollLiveScores]);

  // ── CS2 live-scores polling (15s — faster for real-time updates) ──
  const hasCs2Matches = matches.some(
    (m) => m.game === "CS2" && m.matchStatus !== "finished",
  );
  useEffect(() => {
    if (!hasCs2Matches) return;
    const interval = setInterval(
      () => pollLiveScores("CS2", "cs2Slug", "/api/v1/cs2-matches/live-scores"),
      15000,
    );
    return () => clearInterval(interval);
  }, [hasCs2Matches, pollLiveScores]);

  const handleRateMatch = (matchId: string, rating: MatchRating) => {
    setMatchRatings((prev) => {
      const current = prev[matchId];
      const newRating = current === rating ? null : rating;
      const updated = { ...prev, [matchId]: newRating };
      saveMatchRatings(updated);
      return updated;
    });
    // Sync to API in background
    if (rating) {
      UserDataService.upsertMatchRating(matchId, rating).catch(() => {});
    } else {
      UserDataService.deleteMatchRating(matchId).catch(() => {});
    }
  };

  const handleAddToBets = (match: Match) => {
    navigate("/app/my-bets", {
      state: {
        prefillMatch: {
          team1: match.team1,
          team2: match.team2,
          tournament: match.context,
          format: match.matchType,
          date: match.date,
          matchUrl: match.url || "",
          logoTeam1: match.logoTeam1,
          logoTeam2: match.logoTeam2,
          game: match.game,
        },
      },
    });
  };

  // Toggle match selection for Express
  const toggleMatchSelection = (matchId: string) => {
    setSelectedMatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(matchId)) {
        next.delete(matchId);
      } else {
        if (next.size >= 10) {
          toast.error("⚠️ Максимум 10 матчів", {
            description: "В експресі може бути не більше 10 подій",
          });
          return prev;
        }
        next.add(matchId);
      }
      return next;
    });
  };

  // Clear all selected matches
  const clearSelectedMatches = () => {
    setSelectedMatchIds(new Set());
  };

  // Navigate to MyBets with selected matches for Express
  const handleCreateExpress = () => {
    const selectedMatches = matches.filter((m) => selectedMatchIds.has(m.id));
    if (selectedMatches.length < 2) {
      toast.error("⚠️ Мінімум 2 матчі", {
        description:
          "Для створення експресу потрібно обрати щонайменше 2 матчі",
      });
      return;
    }

    const expressMatches = selectedMatches.map((m) => ({
      team1: m.team1,
      team2: m.team2,
      tournament: m.context,
      format: m.matchType,
      date: m.date,
      matchUrl: m.url || "",
      logoTeam1: m.logoTeam1,
      logoTeam2: m.logoTeam2,
    }));

    navigate("/app/my-bets", {
      state: {
        expressMatches,
      },
    });
  };

  const loadMatchesFromApi = async (forceRefresh = false) => {
    try {
      if (forceRefresh) clearDota2Cache();

      // Fetch Dota2 FIRST with stale-while-revalidate: show cache instantly,
      // then update with fresh data from backend when it arrives.
      try {
        const dotaMatches = await fetchDota2Matches(
          forceRefresh,
          // SWR callback: when fresh data arrives from background fetch,
          // merge it with current CS2 matches and update the table.
          (freshDotaMatches) => {
            setMatches((prev) => {
              const cs2 = prev.filter((m) => m.game !== "Dota2");
              return [
                ...freshDotaMatches.map((m) => dota2ApiMatchToMatch(m)),
                ...cs2,
              ];
            });
          },
        );
        if (import.meta.env.DEV)
          console.log(`[Matches] Loaded ${dotaMatches.length} Dota2 matches`);
        if (dotaMatches.length > 0) {
          setMatches((prev) => {
            const cs2 = prev.filter((m) => m.game !== "Dota2");
            return [...dotaMatches.map((m) => dota2ApiMatchToMatch(m)), ...cs2];
          });
        }
        setInitialLoading(false);
      } catch (e) {
        if (import.meta.env.DEV)
          console.warn("[Matches] Dota2 fetch failed:", e);
        setInitialLoading(false);
      }

      // Fetch CS2 separately (slower external API)
      try {
        const csMatches = await fetchTodaysAndUpcomingMatches();
        if (import.meta.env.DEV)
          console.log(`[Matches] Loaded ${csMatches.length} CS2 matches`);
        setMatches((prev) => {
          if (csMatches.length === 0) return prev; // don't overwrite with empty (cold start)
          const dota2 = prev.filter((m) => m.game === "Dota2");
          return [...csMatches.map((m) => apiMatchToMatch(m, "CS2")), ...dota2];
        });
      } catch (e) {
        if (import.meta.env.DEV) console.warn("[Matches] CS2 fetch failed:", e);
      }

      setApiError(null);
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Не вдалося завантажити матчі з API";
      if (import.meta.env.DEV) console.warn("[Matches] API error:", error);
      setApiError(msg);
      toast.error("⚠️ Помилка завантаження", {
        description: "Не вдалося завантажити матчі з API",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const loadRiskyTeams = () => {
    try {
      const saved = localStorage.getItem("admin_risky_teams");
      if (saved) {
        setRiskyTeams(JSON.parse(saved));
      }
    } catch (error) {
      if (import.meta.env.DEV)
        console.warn("[Matches] Error loading risky teams:", error);
    }
  };

  const getTeamRiskInfo = (
    teamName: string,
  ): { notes: string; status: string } | null => {
    const team = riskyTeams.find(
      (t) =>
        t.name.toLowerCase() === teamName.toLowerCase() ||
        teamName.toLowerCase().includes(t.name.toLowerCase()) ||
        t.name.toLowerCase().includes(teamName.toLowerCase()),
    );
    if (team) return { notes: team.notes, status: team.status };
    return null;
  };

  const getMatchRiskComments = (team1: string, team2: string): string => {
    const team1Risk = getTeamRiskInfo(team1);
    const team2Risk = getTeamRiskInfo(team2);
    const comments: string[] = [];
    if (team1Risk) {
      const icon =
        team1Risk.status === "БАН"
          ? "🔴"
          : team1Risk.status === "Нестабільні"
            ? "🟠"
            : team1Risk.status === "Обережно"
              ? "🟡"
              : "🔵";
      comments.push(`${icon} ${team1}: ${team1Risk.notes || team1Risk.status}`);
    }
    if (team2Risk) {
      const icon =
        team2Risk.status === "БАН"
          ? "🔴"
          : team2Risk.status === "Нестабільні"
            ? "🟠"
            : team2Risk.status === "Обережно"
              ? "🟡"
              : "🔵";
      comments.push(`${icon} ${team2}: ${team2Risk.notes || team2Risk.status}`);
    }
    return comments.length > 0 ? comments.join("\n\n") : "";
  };

  const handleGetAIRecommendation = async (match: Match) => {
    setSelectedMatch(match);

    // Check cache first
    const cached = aiPredictions[match.id];
    if (cached) {
      setAiRecommendation(cached);
      setAiModalOpen(true);
      return;
    }

    setAiModalOpen(true);
    setAiLoading(true);
    setAiRecommendation(null);
    try {
      const recommendation = await deepSeekService.getMatchRecommendation({
        team1: match.team1,
        team2: match.team2,
        format: match.matchType,
        tier: match.tier?.toUpperCase() ?? "UNKNOWN",
        odds: match.odds,
      });
      setAiRecommendation(recommendation);
      // Cache for table display
      setAiPredictions((prev) => ({ ...prev, [match.id]: recommendation }));
    } catch (error) {
      if (import.meta.env.DEV)
        console.warn("[Matches] AI recommend error:", error);
      toast.error("❌ Помилка", {
        description: "Не вдалося отримати AI рекомендацію",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleShowComment = (match: Match) => {
    setSelectedCommentMatch(match);
    setCommentModalOpen(true);
  };

  const handleAddToRisky = (match: Match) => {
    setSelectedRiskyMatch(match);
    setRiskyModalOpen(true);
  };

  const handleRiskySaved = () => {
    loadRiskyTeams(); // refresh from localStorage
  };

  // Count per game for stats (use date-displayed matches for consistency)

  // Apply filters
  const todayKey = getTodayDateKey();
  const filteredMatches = matches.filter((match) => {
    // Hide stale "upcoming" matches from past dates — postponed tips.gg data
    // Live and finished matches from past dates are kept (results view).
    const matchDateKey = getDateKey(match.date);
    if (matchDateKey < todayKey && match.matchStatus === "upcoming")
      return false;
    if (filterGame === "CS2" && match.game !== "CS2") return false;
    if (filterGame === "Dota2" && match.game !== "Dota2") return false;
    if (filterTier !== "all" && match.tier !== filterTier) return false; // null tier matches only show when filter=all
    if (filterDayOfWeek !== "all") {
      const dateKey = getDateKey(match.date);
      const matchDate = new Date(dateKey + "T12:00:00");
      const matchDayIdx = matchDate.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
      const dayMap: Record<string, number> = {
        sun: 0,
        mon: 1,
        tue: 2,
        wed: 3,
        thu: 4,
        fri: 5,
        sat: 6,
      };
      if (dayMap[filterDayOfWeek] !== matchDayIdx) return false;
    }
    if (filterRisk === "safe" && match.risk > 30) return false;
    if (filterRisk === "moderate" && (match.risk <= 30 || match.risk > 50))
      return false;
    if (filterRisk === "high" && match.risk <= 50) return false;
    if (filterMatchType !== "all" && match.matchType !== filterMatchType)
      return false;
    if (filterTournament !== "all" && !match.context.includes(filterTournament))
      return false;
    if (filterStatus !== "all" && match.matchStatus !== filterStatus)
      return false;
    if (
      searchQuery &&
      !match.team1.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !match.team2.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  // Sort matches
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "date":
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case "confidence":
        comparison = b.aiConfidence - a.aiConfidence;
        break;
      case "risk":
        comparison = a.risk - b.risk;
        break;
      case "upset":
        comparison = b.upsetProbability - a.upsetProbability;
        break;
      case "odds":
        comparison =
          Math.max(a.odds.team1 || 0, a.odds.team2 || 0) -
          Math.max(b.odds.team1 || 0, b.odds.team2 || 0);
        break;
      case "status": {
        const statusDiff =
          getStatusPriority(a.matchStatus) - getStatusPriority(b.matchStatus);
        if (statusDiff !== 0) {
          comparison = statusDiff;
        } else {
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        break;
      }
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Group matches by date. Show today + future by default.
  // Past days: only show if they contain live or finished matches (useful for results).
  // Past "upcoming" matches are hidden — they're postponed/stale tips.gg data.

  const groupedByDate: Record<string, Match[]> = {};
  // Always ensure today key exists even while loading (so the card is visible with spinner)
  groupedByDate[todayKey] = [];
  sortedMatches.forEach((match) => {
    const key = getDateKey(match.date);
    if (!groupedByDate[key]) groupedByDate[key] = [];
    groupedByDate[key].push(match);
  });

  const allKeys = Object.keys(groupedByDate);
  // Today always first, then future days, then past days with results
  const futureKeys = allKeys.filter((k) => k > todayKey).sort();
  const relevantPastKeys = allKeys
    .filter((k) => k < todayKey)
    .filter((k) =>
      groupedByDate[k].some(
        (m) => m.matchStatus === "live" || m.matchStatus === "finished",
      ),
    )
    .sort();
  const sortedDateKeys = [todayKey, ...futureKeys, ...relevantPastKeys];

  // Displayed matches — only those actually shown on screen (today+future, or all if only past)
  const displayedMatches = sortedDateKeys.flatMap(
    (k) => groupedByDate[k] || [],
  );
  const displayCount = displayedMatches.length;
  const liveCount = displayedMatches.filter(
    (m) => m.matchStatus === "live",
  ).length;
  const upcomingCount = displayedMatches.filter(
    (m) => m.matchStatus === "upcoming",
  ).length;
  const finishedCount = displayedMatches.filter(
    (m) => m.matchStatus === "finished",
  ).length;

  // Per-game displayed counts for stats card
  const cs2DisplayedCount = displayedMatches.filter(
    (m) => m.game === "CS2",
  ).length;
  const dota2DisplayedCount = displayedMatches.filter(
    (m) => m.game === "Dota2",
  ).length;

  // Collect unique tournaments for filter dropdown
  const tournamentOptions = [
    ...new Set(displayedMatches.map((m) => m.context).filter(Boolean)),
  ].sort();

  const toggleSort = (
    column: "date" | "confidence" | "risk" | "upset" | "status" | "odds",
  ) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      if (column === "confidence" || column === "upset") {
        setSortOrder("desc");
      } else {
        setSortOrder("asc");
      }
    }
  };

  const refreshMatches = async () => {
    setIsLoading(true);
    try {
      toast("🔄 Завантаження матчів...", { description: "Оновлення з API" });
      let loadedCount = 0;

      // Fetch Dota2 first (fast), then CS2 — use incremental updates to avoid erasing existing data
      try {
        const dotaMatches = await fetchDota2Matches(true);
        if (dotaMatches.length > 0) {
          setMatches((prev) => {
            const cs2 = prev.filter((m) => m.game !== "Dota2");
            return [...dotaMatches.map(dota2ApiMatchToMatch), ...cs2];
          });
          loadedCount += dotaMatches.length;
        }
      } catch {
        /* ignore — Dota2 failed, keep existing Dota2 matches */
      }

      try {
        const csMatches = await fetchTodaysAndUpcomingMatches();
        if (csMatches.length > 0) {
          setMatches((prev) => {
            const dota2 = prev.filter((m) => m.game === "Dota2");
            return [
              ...csMatches.map((m) => apiMatchToMatch(m, "CS2")),
              ...dota2,
            ];
          });
          loadedCount += csMatches.length;
        }
      } catch {
        /* ignore — CS2 failed, keep existing CS2 matches */
      }

      if (loadedCount > 0) {
        toast.success("✅ Матчі оновлено!", {
          description: `Завантажено ${loadedCount} матчів`,
        });
      } else {
        toast.warning("⚠️ Матчі не знайдено", {
          description: "API повернув порожній результат",
        });
      }
    } catch (error) {
      toast.error("❌ Помилка завантаження", {
        description: `${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const avgConfidence =
    displayCount > 0
      ? Math.round(
          displayedMatches.reduce((sum, m) => sum + m.aiConfidence, 0) /
            displayCount,
        )
      : 0;

  const renderSortIndicator = (
    column: "date" | "confidence" | "risk" | "upset" | "status" | "odds",
  ) => {
    if (sortBy === column) {
      return sortOrder === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5 text-blue-600" strokeWidth={2} />
      ) : (
        <ArrowDown className="h-3.5 w-3.5 text-blue-600" strokeWidth={2} />
      );
    }
    return (
      <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
    );
  };

  /** Render a single match row */
  const renderMatchRow = (match: Match) => (
    <MatchRow
      key={match.id}
      match={match}
      matchRatings={matchRatings}
      aiPredictions={aiPredictions}
      isSelected={selectedMatchIds.has(match.id)}
      currentRating={matchRatings[match.id] || null}
      colDivider={colDivider}
      visibleColumns={visibleColumns}
      onRate={handleRateMatch}
      onAIRecommend={handleGetAIRecommendation}
      onShowComment={handleShowComment}
      onAddToBets={handleAddToBets}
      onToggleSelect={toggleMatchSelection}
      onAddToRisky={handleAddToRisky}
      hasRiskyTeam={!!getMatchRiskComments(match.team1, match.team2)}
    />
  );

  /** Render the table header row */
  const renderTableHeader = () => (
    <thead>
      <tr className="bg-white border-b border-gray-200">
        {visibleColumns.has("rating") && (
          <th
            className={`text-center py-4 px-3 text-sm font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap ${colDivider}`}
          >
            Інтерес до Матчу
          </th>
        )}
        {visibleColumns.has("match") && (
          <th
            className={`text-left py-4 px-4 text-sm font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none ${colDivider}`}
            onClick={() => toggleSort("date")}
          >
            <div className="flex items-center justify-between w-full">
              <span>Матч</span>
              {renderSortIndicator("date")}
            </div>
          </th>
        )}
        {visibleColumns.has("time") && <th className="hidden"></th>}
        {visibleColumns.has("score") && (
          <th
            className={`text-center py-4 px-3 text-sm font-semibold text-gray-700 uppercase tracking-wider ${colDivider}`}
          >
            Рахунок
          </th>
        )}
        {visibleColumns.has("status") && <th className="hidden"></th>}
        {visibleColumns.has("ai") && (
          <th
            className={`text-center py-4 px-3 text-sm font-semibold text-gray-700 uppercase tracking-wider ${colDivider}`}
          >
            AI
          </th>
        )}
        {visibleColumns.has("prediction") && (
          <th
            className={`text-center py-4 px-3 text-sm font-semibold text-gray-700 uppercase tracking-wider ${colDivider}`}
          >
            Прогноз
          </th>
        )}
        {visibleColumns.has("odds") && (
          <th
            className={`text-center py-4 px-3 text-sm font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none ${colDivider}`}
            onClick={() => toggleSort("odds")}
          >
            <div className="flex items-center justify-center gap-1">
              <span>Коеф.</span>
              {renderSortIndicator("odds")}
            </div>
          </th>
        )}
        {visibleColumns.has("notes") && (
          <th
            className={`text-center py-4 px-3 text-sm font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap ${colDivider}`}
          >
            Нотатки
          </th>
        )}
        {visibleColumns.has("actions") && (
          <th className="text-center py-4 px-3 text-sm font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap min-w-[110px]">
            Додати до Записів
          </th>
        )}
      </tr>
    </thead>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#f3f3f3] relative flex flex-col">
        {/* ===== HEADER ===== */}
        <PageHeader
          title="Матчі"
          currentUser={currentUser || "User"}
          isDarkTheme={isDarkTheme}
          onToggleTheme={toggleTheme}
          showThemeToggle={false}
        />
        <div className="relative z-10 space-y-6 px-6 lg:px-8 pb-8 pt-4 flex flex-col flex-1 min-h-0">
          {/* ===== QUICK STATS ===== */}
          <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              <div
                className="bg-white border border-gray-100 hover:border-gray-300 rounded-3xl px-6 py-5 group"
                style={cardBaseStyle}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, cardHoverStyle);
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, cardBaseStyle);
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50">
                    <Trophy
                      className="h-5 w-5 text-primary"
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    Всього матчів
                  </span>
                </div>
                <div className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
                  {displayCount}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-amber-600">
                    CS2 {cs2DisplayedCount}
                  </span>
                  <span className="text-sm text-gray-400">—</span>
                  <span className="text-sm font-semibold text-[#7C3AED]">
                    Dota {dota2DisplayedCount}
                  </span>
                  <span className="text-sm text-[#4B5563]">матчів</span>
                </div>
              </div>

              <div
                className="bg-white border border-gray-100 hover:border-gray-300 rounded-3xl px-6 py-5 group"
                style={cardBaseStyle}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, cardHoverStyle);
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, cardBaseStyle);
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50">
                    <Radio className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    LIVE
                  </span>
                </div>
                <div className="text-4xl font-bold text-red-500 tracking-tight mb-2">
                  {liveCount}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#4B5563]">зараз грають</span>
                </div>
              </div>

              <div
                className="bg-white border border-gray-100 hover:border-gray-300 rounded-3xl px-6 py-5 group"
                style={cardBaseStyle}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, cardHoverStyle);
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, cardBaseStyle);
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50">
                    <Clock className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    Очікуються
                  </span>
                </div>
                <div className="text-4xl font-bold text-blue-600 tracking-tight mb-2">
                  {upcomingCount}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#4B5563]">ще не почались</span>
                </div>
              </div>

              <div
                className="bg-white border border-gray-100 hover:border-gray-300 rounded-3xl px-6 py-5 group"
                style={cardBaseStyle}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, cardHoverStyle);
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, cardBaseStyle);
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50">
                    <CheckCircle2
                      className="h-5 w-5 text-primary"
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    Завершені
                  </span>
                </div>
                <div className="text-4xl font-bold text-green-500 tracking-tight mb-2">
                  {finishedCount}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#4B5563]">зіграні матчі</span>
                </div>
              </div>

              <div
                className="bg-white border border-gray-100 hover:border-gray-300 rounded-3xl px-6 py-5 group"
                style={cardBaseStyle}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, cardHoverStyle);
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, cardBaseStyle);
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50">
                    <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    Середній Прогноз
                  </span>
                </div>
                <div className="text-4xl font-bold text-[#8B5CF6] tracking-tight mb-2">
                  {avgConfidence}%
                </div>
                <div className="flex items-center gap-2">
                  {avgConfidence >= 65 ? (
                    <ArrowUpRight
                      className="h-4 w-4 text-green-500"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <ArrowDownRight
                      className="h-4 w-4 text-red-500"
                      strokeWidth={2.5}
                    />
                  )}
                  <span
                    className={`text-sm font-semibold ${avgConfidence >= 65 ? "text-green-500" : "text-red-500"}`}
                  >
                    {avgConfidence >= 65 ? "Хороший рівень" : "Низький рівень"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== PILL FILTER BAR — styled as StrategyTabNav ===== */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm border-2 border-stone-200 p-3 rounded-[32px] flex-wrap justify-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              {/* Refresh button */}
              <button
                onClick={refreshMatches}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-4 text-base rounded-[24px] font-semibold bg-primary text-white hover:bg-blue-400 shadow-[0_2px_8px_rgba(68,122,252,0.3)] transition-all duration-300 ease-in-out disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                ) : (
                  <RefreshCw className="h-4 w-4" strokeWidth={2} />
                )}
                Оновити
              </button>

              {/* Search */}
              <div className="relative min-w-[140px]">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                  strokeWidth={1.5}
                />
                <Input
                  placeholder="Пошук..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 rounded-[24px] border border-stone-200 bg-transparent text-base text-gray-900 placeholder:text-gray-500 focus:bg-white focus:shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:border-gray-300 transition-all duration-300 h-full py-4 min-h-[56px]"
                />
              </div>

              {/* Status filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`relative px-5 py-4 text-base rounded-[24px] transition-all duration-300 ease-in-out flex items-center gap-2 ${
                      filterStatus !== "all"
                        ? "bg-white text-gray-900 font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)] border-transparent"
                        : "bg-transparent text-gray-900 font-light border border-stone-200"
                    }`}
                  >
                    {filterStatus === "all"
                      ? "Статус"
                      : filterStatus === "live"
                        ? "🔴 LIVE"
                        : filterStatus === "upcoming"
                          ? "Очікуються"
                          : "Завершені"}
                    <ChevronDown
                      className="h-4 w-4 opacity-50"
                      strokeWidth={1.5}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl p-1">
                  <DropdownMenuItem
                    onClick={() => setFilterStatus("all")}
                    className="rounded-lg"
                  >
                    Всі статуси
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterStatus("live")}
                    className="rounded-lg"
                  >
                    🔴 LIVE
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterStatus("upcoming")}
                    className="rounded-lg"
                  >
                    🕐 Очікуються
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterStatus("finished")}
                    className="rounded-lg"
                  >
                    ✅ Завершені
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Tier filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`relative px-5 py-4 text-base rounded-[24px] transition-all duration-300 ease-in-out flex items-center gap-2 ${
                      filterTier !== "all"
                        ? "bg-white text-gray-900 font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)] border-transparent"
                        : "bg-transparent text-gray-900 font-light border border-stone-200"
                    }`}
                  >
                    {filterTier === "all"
                      ? "Tier"
                      : filterTier === "tier1"
                        ? "Tier 1"
                        : filterTier === "tier2"
                          ? "Tier 2"
                          : "Tier 3"}
                    <ChevronDown
                      className="h-4 w-4 opacity-50"
                      strokeWidth={1.5}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl p-1">
                  <DropdownMenuItem
                    onClick={() => setFilterTier("all")}
                    className="rounded-lg"
                  >
                    Всі Tier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterTier("tier1")}
                    className="rounded-lg"
                  >
                    Tier 1
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterTier("tier2")}
                    className="rounded-lg"
                  >
                    Tier 2
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterTier("tier3")}
                    className="rounded-lg"
                  >
                    Tier 3
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Format filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`relative px-5 py-4 text-base rounded-[24px] transition-all duration-300 ease-in-out flex items-center gap-2 ${
                      filterMatchType !== "all"
                        ? "bg-white text-gray-900 font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)] border-transparent"
                        : "bg-transparent text-gray-900 font-light border border-stone-200"
                    }`}
                  >
                    {filterMatchType === "all" ? "Формат" : filterMatchType}
                    <ChevronDown
                      className="h-4 w-4 opacity-50"
                      strokeWidth={1.5}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl p-1">
                  <DropdownMenuItem
                    onClick={() => setFilterMatchType("all")}
                    className="rounded-lg"
                  >
                    Всі формати
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterMatchType("Bo1")}
                    className="rounded-lg"
                  >
                    Bo1
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterMatchType("Bo2")}
                    className="rounded-lg"
                  >
                    Bo2
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterMatchType("Bo3")}
                    className="rounded-lg"
                  >
                    Bo3
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterMatchType("Bo5")}
                    className="rounded-lg"
                  >
                    Bo5
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Tournament filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`relative px-5 py-4 text-base rounded-[24px] transition-all duration-300 ease-in-out flex items-center gap-2 ${
                      filterTournament !== "all"
                        ? "bg-white text-gray-900 font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)] border-transparent"
                        : "bg-transparent text-gray-900 font-light border border-stone-200"
                    }`}
                  >
                    {filterTournament === "all"
                      ? "Турнір"
                      : filterTournament.length > 15
                        ? filterTournament.slice(0, 15) + "…"
                        : filterTournament}
                    <ChevronDown
                      className="h-4 w-4 opacity-50"
                      strokeWidth={1.5}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="rounded-xl p-1 max-h-64 overflow-y-auto"
                >
                  <DropdownMenuItem
                    onClick={() => setFilterTournament("all")}
                    className="rounded-lg"
                  >
                    Всі турніри
                  </DropdownMenuItem>
                  {tournamentOptions.map((t) => (
                    <DropdownMenuItem
                      key={t}
                      onClick={() => setFilterTournament(t)}
                      className="rounded-lg text-sm"
                    >
                      {t}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Day filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`relative px-5 py-4 text-base rounded-[24px] transition-all duration-300 ease-in-out flex items-center gap-2 ${
                      filterDayOfWeek !== "all"
                        ? "bg-white text-gray-900 font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)] border-transparent"
                        : "bg-transparent text-gray-900 font-light border border-stone-200"
                    }`}
                  >
                    {filterDayOfWeek === "all"
                      ? "Всі дні"
                      : filterDayOfWeek === "mon"
                        ? "Понеділок"
                        : filterDayOfWeek === "tue"
                          ? "Вівторок"
                          : filterDayOfWeek === "wed"
                            ? "Середа"
                            : filterDayOfWeek === "thu"
                              ? "Четвер"
                              : filterDayOfWeek === "fri"
                                ? "П'ятниця"
                                : filterDayOfWeek === "sat"
                                  ? "Субота"
                                  : "Неділя"}
                    <ChevronDown
                      className="h-4 w-4 opacity-50"
                      strokeWidth={1.5}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl p-1">
                  <DropdownMenuItem
                    onClick={() => setFilterDayOfWeek("all")}
                    className="rounded-lg"
                  >
                    Всі дні
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterDayOfWeek("mon")}
                    className="rounded-lg"
                  >
                    Понеділок
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterDayOfWeek("tue")}
                    className="rounded-lg"
                  >
                    Вівторок
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterDayOfWeek("wed")}
                    className="rounded-lg"
                  >
                    Середа
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterDayOfWeek("thu")}
                    className="rounded-lg"
                  >
                    Четвер
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterDayOfWeek("fri")}
                    className="rounded-lg"
                  >
                    П'ятниця
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterDayOfWeek("sat")}
                    className="rounded-lg"
                  >
                    Субота
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterDayOfWeek("sun")}
                    className="rounded-lg"
                  >
                    Неділя
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Column visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative px-5 py-4 text-base rounded-[24px] border border-stone-200 transition-all duration-300 ease-in-out flex items-center gap-2 bg-transparent text-gray-900 font-light">
                    Колонки
                    <ChevronDown
                      className="h-4 w-4 opacity-50"
                      strokeWidth={1.5}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="rounded-xl p-1 min-w-[200px]"
                >
                  {COLUMN_DEFS.map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={visibleColumns.has(col.id)}
                      onCheckedChange={() => toggleColumn(col.id)}
                      className="rounded-lg text-sm"
                    >
                      {col.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Reset filters */}
              {hasActiveFilters && (
                <>
                  <div className="w-px h-7 bg-stone-200 mx-0.5" />
                  <button
                    onClick={resetAllFilters}
                    className="relative px-6 py-4 text-base rounded-[24px] transition-all duration-300 ease-in-out flex items-center gap-2 bg-red-500 text-white hover:bg-red-600 font-semibold shadow-[0_2px_8px_rgba(239,68,68,0.3)]"
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                    Скинути
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ===== DATE GROUP CARDS — always visible ===== */}
          {(() => {
            const allDateKeys = Object.keys(groupedByDate)
              .sort()
              .filter((dk) => {
                if (filterDayOfWeek === "all") return true;
                const dayMap: Record<string, number> = {
                  sun: 0,
                  mon: 1,
                  tue: 2,
                  wed: 3,
                  thu: 4,
                  fri: 5,
                  sat: 6,
                };
                return (
                  new Date(dk + "T12:00:00").getDay() ===
                  dayMap[filterDayOfWeek]
                );
              });
            // Only show cards that have matches — but ensure at least one card is visible
            const withMatches = allDateKeys.filter(
              (dk) => (groupedByDate[dk]?.length || 0) > 0,
            );
            const finalKeys =
              withMatches.length > 0 ? withMatches : allDateKeys;
            return finalKeys.map((dateKey, idx) => {
              const dateMatches = groupedByDate[dateKey];
              const hasLive = dateMatches.some((m) => m.matchStatus === "live");
              return (
                <BlurFade key={dateKey} delay={idx * 0.1} inView>
                  <div className="relative bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                    {hasLive && (
                      <BorderBeam
                        size={200}
                        duration={4}
                        colorFrom="#EF4444"
                        colorTo="#F59E0B"
                        borderWidth={2}
                        className="rounded-[32px]"
                      />
                    )}
                    <div className="relative z-10 bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.10)] overflow-x-auto">
                      <CardHeader className="bg-white rounded-t-[24px] border-b border-gray-200 px-6 py-5">
                        <CardTitle>
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                              <Calendar
                                className="h-5 w-5 text-primary"
                                strokeWidth={2}
                              />
                            </div>
                            <span className="text-2xl font-bold text-gray-900 tracking-tight">
                              {formatFullDateTitle(dateKey, filterGame)}
                            </span>
                            <Badge className="bg-gray-100 text-gray-500 border-0 rounded-full px-4 py-1 text-base font-bold">
                              {dateMatches.length}
                            </Badge>
                            {/* Game quick-toggle */}
                            <div className="flex items-center gap-1 ml-auto">
                              <button
                                onClick={() => setFilterGame("all")}
                                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                                  filterGame === "all"
                                    ? "bg-gray-900 text-white shadow-md"
                                    : "bg-white text-gray-500 border border-gray-200 hover:text-gray-900 hover:border-gray-300"
                                }`}
                              >
                                Всі
                              </button>
                              <button
                                onClick={() => setFilterGame("CS2")}
                                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                                  filterGame === "CS2"
                                    ? "bg-amber-600 text-white shadow-md"
                                    : "bg-white text-gray-500 border border-gray-200 hover:text-amber-600 hover:border-[#FCD34D]"
                                }`}
                              >
                                CS2
                              </button>
                              <button
                                onClick={() => setFilterGame("Dota2")}
                                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                                  filterGame === "Dota2"
                                    ? "bg-[#7C3AED] text-white shadow-md"
                                    : "bg-white text-gray-500 border border-gray-200 hover:text-[#7C3AED] hover:border-[#C4B5FD]"
                                }`}
                              >
                                Dota 2
                              </button>
                            </div>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 rounded-b-[24px]">
                        {initialLoading ? (
                          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
                            <Loader2
                              className="h-8 w-8 animate-spin text-primary"
                              strokeWidth={1.5}
                            />
                            <p className="text-sm text-gray-400">
                              Завантаження матчів...
                            </p>
                          </div>
                        ) : dateMatches.length > 0 ? (
                          <div>
                            <table className="w-full border-collapse">
                              {renderTableHeader()}
                              <tbody>{dateMatches.map(renderMatchRow)}</tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-400 gap-3">
                            <div className="p-5 bg-gray-100 rounded-2xl">
                              <Trophy
                                className="h-10 w-10 text-gray-400"
                                strokeWidth={1.5}
                              />
                            </div>
                            <p className="text-lg font-bold text-gray-500">
                              Немає матчів
                            </p>
                            <p className="text-sm">
                              Спробуйте обрати інший фільтр гри або натисніть
                              «Оновити»
                            </p>
                            <button
                              onClick={refreshMatches}
                              disabled={isLoading}
                              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-[24px] bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              <RefreshCw
                                className="h-4 w-4"
                                strokeWidth={1.5}
                              />
                              Оновити
                            </button>
                          </div>
                        )}
                      </CardContent>
                    </div>
                  </div>
                </BlurFade>
              );
            });
          })()}

          <AIRecommendationModal
            open={aiModalOpen}
            onClose={() => setAiModalOpen(false)}
            matchInfo={
              selectedMatch
                ? `${selectedMatch.team1} vs ${selectedMatch.team2} (${selectedMatch.matchType}, ${selectedMatch.tier?.toUpperCase() ?? "-"})`
                : ""
            }
            recommendation={aiRecommendation}
            isLoading={aiLoading}
          />

          <CommentModal
            open={commentModalOpen}
            onClose={() => setCommentModalOpen(false)}
            matchInfo={
              selectedCommentMatch
                ? `${selectedCommentMatch.team1} vs ${selectedCommentMatch.team2} (${selectedCommentMatch.matchType}, ${selectedCommentMatch.tier?.toUpperCase() ?? "-"})`
                : ""
            }
            comment={
              selectedCommentMatch
                ? getMatchRiskComments(
                    selectedCommentMatch.team1,
                    selectedCommentMatch.team2,
                  )
                : ""
            }
          />

          <AddToRiskyTeamsModal
            open={riskyModalOpen}
            onClose={() => setRiskyModalOpen(false)}
            team1={{
              name: selectedRiskyMatch?.team1 || "",
              logo: selectedRiskyMatch?.logoTeam1,
            }}
            team2={{
              name: selectedRiskyMatch?.team2 || "",
              logo: selectedRiskyMatch?.logoTeam2,
            }}
            onSaved={handleRiskySaved}
          />
        </div>

        {/* ===== FLOATING EXPRESS BAR ===== */}
        {selectedMatchIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div
              className="flex items-center gap-4 px-6 py-4 bg-gray-900 text-white rounded-2xl border border-gray-700"
              style={{
                boxShadow:
                  "0 20px 60px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.15)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="h-5 w-5 text-[#60A5FA]" strokeWidth={1.5} />
                <span className="text-base font-semibold">
                  Експрес: {selectedMatchIds.size}{" "}
                  {selectedMatchIds.size === 1
                    ? "матч"
                    : selectedMatchIds.size >= 2 && selectedMatchIds.size <= 4
                      ? "матчі"
                      : "матчів"}
                </span>
              </div>

              <div className="w-px h-8 bg-gray-700" />

              <Button
                onClick={handleCreateExpress}
                disabled={selectedMatchIds.size < 2}
                className={`rounded-xl font-medium text-sm px-5 py-2.5 transition-all duration-200 ${
                  selectedMatchIds.size >= 2
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                <PlusCircle className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Створити Експрес
              </Button>

              <button
                onClick={clearSelectedMatches}
                className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="Очистити вибір"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
