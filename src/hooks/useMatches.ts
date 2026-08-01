import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserDataService } from "@/lib/userDataService";
import { toast } from "sonner";
import {
  fetchTodaysAndUpcomingMatches,
  parseMatchType,
  parseMatchContext,
  determineTier,
  determineFavorite,
  getMatchStatus,
  buildHltvUrl,
  type ApiMatch,
  type ApiMatch as ApiMatchType,
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
import { deepSeekService, type AIRecommendation } from "@/lib/deepSeekService";

// ── Types ──
export type FormStability =
  "hot_streak" | "stable" | "momentum" | "falling" | "slump" | "inconsistent";

export interface RiskyTeam {
  name: string;
  game: string;
  status: string;
  notes: string;
}

export interface Match {
  id: string;
  date: string;
  team1: string;
  team2: string;
  favorite: string;
  aiConfidence: number;
  risk: number;
  comment: string;
  aiSummary: string;
  odds: { team1: number; team2: number };
  winRate: number;
  formStability: FormStability;
  playerForm: { player: string; rating: number }[];
  context: string;
  tier: "tier1" | "tier2" | "tier3" | null;
  matchType: "Bo1" | "Bo2" | "Bo3" | "Bo5";
  game: "CS2" | "Dota2";
  upsetProbability: number;
  url?: string;
  score1?: number;
  score2?: number;
  matchStatus?: "upcoming" | "live" | "finished" | "postponed" | "cancelled";
  positionTeam1?: number | null;
  positionTeam2?: number | null;
  logoTeam1?: string | null;
  logoTeam2?: string | null;
  predictionPercentTeam1?: number | null;
  predictionPercentTeam2?: number | null;
  bettingCoefficientTeam1?: number | null;
  bettingCoefficientTeam2?: number | null;
  stars?: number;
  dota2Slug?: string;
  cs2Slug?: string;
}

export type MatchRating = "like" | "dislike" | null;

export type SortBy =
  "date" | "confidence" | "risk" | "upset" | "status" | "odds";
export type FilterDay =
  "all" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type FilterRisk = "all" | "safe" | "moderate" | "high";
export type FilterMatchType = "all" | "Bo1" | "Bo2" | "Bo3" | "Bo5";
export type FilterGame = "all" | "CS2" | "Dota2";
export type FilterStatus =
  "all" | "upcoming" | "live" | "finished" | "postponed" | "cancelled";

// ── Helpers ──
const getDateKey = (dateStr: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const m = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  return new Date(dateStr).toISOString().split("T")[0];
};

const getTodayDateKey = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

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

const loadMatchRatings = (): Record<string, MatchRating> => {
  try {
    const saved = localStorage.getItem("match_ratings");
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  return {};
};

// ── COLUMN_DEFS ──
export const COLUMN_DEFS = [
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

// ── Converter: API match → unified Match ──
function apiMatchToMatch(
  apiMatch: ApiMatchType,
  game: "CS2" | "Dota2" = "CS2",
): Match {
  const matchType = parseMatchType(apiMatch.type);
  const context =
    game === "CS2"
      ? apiMatch.tournament && apiMatch.stage
        ? `${apiMatch.tournament} — ${apiMatch.stage}`
        : apiMatch.tournament || parseMatchContext(apiMatch.type, apiMatch.link)
      : parseDota2MatchContext(apiMatch as unknown as Dota2ApiMatch);
  const tier = determineTier(
    apiMatch.positionTeam1,
    apiMatch.positionTeam2,
    apiMatch.tournament as string | undefined,
  );
  const favorite = determineFavorite(
    apiMatch.nameTeam1,
    apiMatch.nameTeam2,
    apiMatch.positionTeam1,
    apiMatch.positionTeam2,
  );
  const status = getMatchStatus(apiMatch);
  const pos1 = apiMatch.positionTeam1,
    pos2 = apiMatch.positionTeam2;
  const posDiff = pos1 != null && pos2 != null ? Math.abs(pos1 - pos2) : 0;
  const pred1 = apiMatch.predictionPercentTeam1,
    pred2 = apiMatch.predictionPercentTeam2;
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
  const coeff1 = apiMatch.bettingCoefficientTeam1,
    coeff2 = apiMatch.bettingCoefficientTeam2;
  const hasCoeffs =
    coeff1 != null && coeff2 != null && (coeff1 > 0 || coeff2 > 0);

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
    formStability: "stable",
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

function dota2ApiMatchToMatch(m: Dota2ApiMatch): Match {
  const pred1 = m.predictionPercentTeam1,
    pred2 = m.predictionPercentTeam2;
  const hasPrediction =
    pred1 != null && pred2 != null && (pred1 > 0 || pred2 > 0);
  const confidence = hasPrediction ? Math.max(pred1 ?? 50, pred2 ?? 50) : 50;
  const fav = hasPrediction
    ? (pred1 ?? 50) >= (pred2 ?? 50)
      ? m.nameTeam1
      : m.nameTeam2
    : m.nameTeam1;
  const slugParts = m.link.replace(/\/$/, "").split("/");
  const dota2Slug = slugParts[slugParts.length - 2] || "";

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
    formStability: "stable",
    playerForm: [],
    context: m.tournament
      ? `${m.tournament}${m.stage ? " — " + m.stage : ""}`
      : parseDota2MatchContext(m),
    tier: determineDota2Tier(m.positionTeam1, m.positionTeam2, m.tournament),
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

// ── Dota 2 tier helper ──
const DOTA_T1 = [
  /the\sinternational/i,
  /major/i,
  /esl\sone/i,
  /dreamleague/i,
  /betboom\sdacha/i,
  /fissure\splayground/i,
  /pgl\swallachia/i,
  /blast\sslam/i,
];
const DOTA_T2 = [
  /elite\sleague/i,
  /cct\s/i,
  /european\spro\sleague/i,
  /res\sregional/i,
  /pinnacle/i,
  /paragon/i,
  /1win\sseries/i,
];

function determineDota2Tier(
  pos1?: number | null,
  pos2?: number | null,
  tournament?: string | null,
): "tier1" | "tier2" | "tier3" | null {
  if (pos1 == null || pos2 == null) {
    if (!tournament) return null;
    if (DOTA_T1.some((r) => r.test(tournament))) return "tier1";
    if (DOTA_T2.some((r) => r.test(tournament))) return "tier2";
    return "tier3";
  }
  const minPos = Math.min(pos1, pos2);
  if (minPos <= 20) return "tier1";
  if (minPos <= 50) return "tier2";
  if (!tournament) return "tier3";
  if (DOTA_T1.some((r) => r.test(tournament))) return "tier1";
  return "tier3";
}

// ── Main Hook ──
export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("status");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterDayOfWeek, setFilterDayOfWeek] = useState<FilterDay>("all");
  const [filterRisk, setFilterRisk] = useState<FilterRisk>("all");
  const [filterTournament, setFilterTournament] = useState("all");
  const [filterMatchType, setFilterMatchType] =
    useState<FilterMatchType>("all");
  const [filterGame, setFilterGame] = useState<FilterGame>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [pastDaysModalOpen, setPastDaysModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] =
    useState<Set<string>>(loadVisibleColumns);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [predictionsModalOpen, setPredictionsModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [aiRecommendation, setAiRecommendation] =
    useState<AIRecommendation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPredictions, setAiPredictions] = useState<
    Record<string, AIRecommendation>
  >({});
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedCommentMatch, setSelectedCommentMatch] =
    useState<Match | null>(null);
  const [riskyModalOpen, setRiskyModalOpen] = useState(false);
  const [selectedRiskyMatch, setSelectedRiskyMatch] = useState<Match | null>(
    null,
  );
  const [riskyTeams, setRiskyTeams] = useState<RiskyTeam[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [matchRatings, setMatchRatings] =
    useState<Record<string, MatchRating>>(loadMatchRatings);
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(
    new Set(),
  );
  const fetchGenRef = useRef(0);
  const pollBackoffRef = useRef<
    Record<
      string,
      { failCount: number; maxDelay: number; lastAttempt?: number }
    >
  >({});

  const toggleColumn = (colId: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const resetAllFilters = () => {
    setFilterGame("all");
    setFilterStatus("all");
    setFilterMatchType("all");
    setFilterDayOfWeek("all");
    setFilterRisk("all");
    setFilterTournament("all");
    setPastDaysModalOpen(false);
    setSearchQuery("");
    const defaults = new Set(
      COLUMN_DEFS.filter((c) => c.defaultVisible).map((c) => c.id),
    );
    setVisibleColumns(defaults);
    localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify([...defaults]));
  };

  const hasActiveFilters =
    filterGame !== "all" ||
    filterStatus !== "all" ||
    filterMatchType !== "all" ||
    filterDayOfWeek !== "all" ||
    filterRisk !== "all" ||
    filterTournament !== "all" ||
    searchQuery !== "";

  // ── Load matches from API ──
  const loadMatchesFromApi = useCallback(async () => {
    const gen = ++fetchGenRef.current;
    setInitialLoading(true);
    setApiError(null);
    try {
      // Track whether SWR callback already delivered fresh CS2 data.
      // If yes, skip the stale cache returned by Promise.allSettled.
      let freshCs2Arrived = false;

      const onCs2Update = (fresh: ApiMatch[]) => {
        if (gen !== fetchGenRef.current) return;
        freshCs2Arrived = true;
        setMatches((prev) => {
          const dota = prev.filter((m) => m.game === "Dota2");
          const cs2 = fresh.map((m) => apiMatchToMatch(m, "CS2"));
          return [...cs2, ...dota];
        });
      };

      // CS2 loads fast (cstest API, 1-2s). Dota2 is slow (Puppeteer, 30-80s).
      // Load CS2 first, let Dota2 arrive whenever it finishes.
      const cs2Data = await Promise.allSettled([
        fetchTodaysAndUpcomingMatches(false, onCs2Update),
      ]).then(([r]) => r);

      // Fire Dota2 in background — don't block initial render
      fetchDota2Matches()
        .then((dota) => {
          if (gen === fetchGenRef.current && dota.length > 0) {
            setMatches((prev) => {
              const cs2 = prev.filter((m) => m.game === "CS2");
              return [...cs2, ...dota.map((m) => dota2ApiMatchToMatch(m))];
            });
          }
        })
        .catch(() => {});

      if (gen !== fetchGenRef.current) return;

      // Apply CS2 matches now
      if (!freshCs2Arrived) {
        const cs2Matches: Match[] =
          cs2Data.status === "fulfilled" && cs2Data.value
            ? cs2Data.value.map((m: ApiMatch) => apiMatchToMatch(m, "CS2"))
            : [];

        setMatches((prev) => {
          // Keep any Dota2 matches that might have already arrived via SWR
          const dota = prev.filter((m) => m.game === "Dota2");
          return [...cs2Matches, ...dota];
        });
      }

      if (cs2Data.status === "rejected") {
        setApiError("Не вдалося завантажити CS2 матчі");
        toast.error("CS2 матчі тимчасово недоступні");
      }
    } catch (err) {
      console.error("[Matches] Load failed:", err);
      setApiError("Помилка завантаження матчів");
    } finally {
      if (gen === fetchGenRef.current) setInitialLoading(false);
    }
  }, []);

  // ── Auto-load matches on mount ──
  useEffect(() => {
    loadMatchesFromApi();
  }, [loadMatchesFromApi]);

  const refreshMatches = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.allSettled([clearDota2Cache()]);
      await loadMatchesFromApi();
    } finally {
      setIsLoading(false);
    }
  }, [loadMatchesFromApi]);

  // ── Poll live scores ──
  const pollLiveScores = useCallback(
    async (
      game: "Dota2" | "CS2",
      slugField: "dota2Slug" | "cs2Slug",
      endpoint: string,
    ) => {
      try {
        const bo = pollBackoffRef.current[game];
        if (bo && bo.failCount >= 3) {
          const delay = Math.min(bo.maxDelay, Math.pow(2, bo.failCount) * 1000);
          if (bo.lastAttempt && Date.now() - bo.lastAttempt < delay) return;
        }
        const resp = await fetch(endpoint);
        if (!resp.ok) {
          if (resp.status === 429 || resp.status >= 500) {
            const b = pollBackoffRef.current[game] || {
              failCount: 0,
              maxDelay: 120_000,
            };
            b.failCount++;
            b.lastAttempt = Date.now();
            pollBackoffRef.current[game] = b;
          }
          return;
        }
        delete pollBackoffRef.current[game];
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
            const newScore1 = update.score1 ?? m.score1;
            const newScore2 = update.score2 ?? m.score2;
            const s1 = newScore1 ?? 0,
              s2 = newScore2 ?? 0;
            const hasScores =
              (newScore1 != null || newScore2 != null) && s1 + s2 > 0;
            const maxScore = Math.max(s1, s2);
            const winsNeeded =
              m.matchType === "Bo5"
                ? 3
                : m.matchType === "Bo3"
                  ? 2
                  : m.matchType === "Bo1"
                    ? 1
                    : 2;
            const isScoreDecided =
              hasScores &&
              maxScore >= winsNeeded &&
              Math.abs(s1 - s2) >= (m.matchType === "Bo1" ? 0 : 1);

            const newStatus: "upcoming" | "live" | "finished" = isScoreDecided
              ? "finished"
              : m.matchStatus === "live" && update.status === "finished"
                ? "live"
                : update.status === "finished"
                  ? "finished"
                  : update.status === "live"
                    ? "live"
                    : (() => {
                        if (hasScores) return m.matchStatus;
                        const matchDate = new Date(m.date);
                        if (matchDate <= new Date()) {
                          const ageMs = Date.now() - matchDate.getTime();
                          if (ageMs < 4 * 60 * 60 * 1000) return "live";
                        }
                        return m.matchStatus;
                      })();

            return {
              ...m,
              score1: newScore1,
              score2: newScore2,
              matchStatus: newStatus,
            };
          }),
        );
      } catch {
        /* backoff handled above */
      }
    },
    [],
  );

  const hasDota2Matches = matches.some(
    (m) => m.game === "Dota2" && m.matchStatus !== "finished",
  );
  const hasCs2Matches = matches.some(
    (m) => m.game === "CS2" && m.matchStatus !== "finished",
  );

  // ── Poll live scores: immediate + every 7s + on window focus ──
  const [liveScoreAge, setLiveScoreAge] = useState(0);
  const liveIntervalRef = useRef(7_000); // start at 7s, adapt (matches backend)

  useEffect(() => {
    const dota2Endpoint = `${import.meta.env.VITE_API_URL || "/api"}/v1/dota2-matches/live-scores`;
    const cs2Endpoint = `${import.meta.env.VITE_API_URL || "/api"}/v1/cs2-matches/live-scores`;

    const poll = () => {
      if (hasDota2Matches) {
        pollLiveScores("Dota2", "dota2Slug", dota2Endpoint);
        setLiveScoreAge(0);
      }
      if (hasCs2Matches) {
        pollLiveScores("CS2", "cs2Slug", cs2Endpoint);
        setLiveScoreAge(0);
      }
    };

    // Immediate poll
    poll();

    const timer = setInterval(() => {
      poll();
      setLiveScoreAge((prev) => prev + liveIntervalRef.current);
    }, liveIntervalRef.current);

    // Poll on tab focus
    const onFocus = () => {
      if (document.visibilityState === "visible") {
        poll();
        setLiveScoreAge(0);
      }
    };
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [hasDota2Matches, hasCs2Matches, pollLiveScores]);

  // ── Filtering & sorting (memoized) ──
  const {
    filteredMatches,
    sortedDateKeys,
    groupedByDate,
    displayedMatches,
    liveCount,
    upcomingCount,
    finishedCount,
    cs2DisplayedCount,
    dota2DisplayedCount,
    avgConfidence,
    tournamentOptions,
  } = useMemo(() => {
    const todayKey = getTodayDateKey();
    const filtered = matches.filter((match) => {
      const matchDateKey = getDateKey(match.date);
      // Exclude matches from past days
      if (matchDateKey < todayKey) return false;
      // Auto-hide finished matches from today that ended >6h ago
      if (match.matchStatus === "finished" && matchDateKey === todayKey) {
        const hoursSinceStart =
          (Date.now() - new Date(match.date).getTime()) / 3600000;
        if (hoursSinceStart > 6) return false;
      }
      if (filterGame === "CS2" && match.game !== "CS2") return false;
      if (filterGame === "Dota2" && match.game !== "Dota2") return false;
      if (filterDayOfWeek !== "all") {
        const dayMap: Record<string, number> = {
          sun: 0,
          mon: 1,
          tue: 2,
          wed: 3,
          thu: 4,
          fri: 5,
          sat: 6,
        };
        if (
          dayMap[filterDayOfWeek] !==
          new Date(matchDateKey + "T12:00:00").getDay()
        )
          return false;
      }
      if (filterRisk === "safe" && match.risk > 30) return false;
      if (filterRisk === "moderate" && (match.risk <= 30 || match.risk > 50))
        return false;
      if (filterRisk === "high" && match.risk <= 50) return false;
      if (filterMatchType !== "all" && match.matchType !== filterMatchType)
        return false;
      if (
        filterTournament !== "all" &&
        !match.context.includes(filterTournament)
      )
        return false;
      if (filterStatus !== "all" && match.matchStatus !== filterStatus)
        return false;
      if (
        searchQuery &&
        !match.team1
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase()) &&
        !match.team2.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
        return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "date":
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "confidence":
          cmp = b.aiConfidence - a.aiConfidence;
          break;
        case "risk":
          cmp = a.risk - b.risk;
          break;
        case "upset":
          cmp = b.upsetProbability - a.upsetProbability;
          break;
        case "odds":
          cmp =
            Math.max(a.odds.team1 || 0, a.odds.team2 || 0) -
            Math.max(b.odds.team1 || 0, b.odds.team2 || 0);
          break;
        case "status": {
          const d =
            getStatusPriority(a.matchStatus) - getStatusPriority(b.matchStatus);
          cmp =
            d !== 0
              ? d
              : new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        }
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    const grouped: Record<string, Match[]> = {};
    sorted.forEach((m) => {
      const k = getDateKey(m.date);
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(m);
    });

    const allKeys = Object.keys(grouped);
    const futureKeys = allKeys.filter((k) => k > todayKey).sort();
    const dateKeys = [todayKey, ...futureKeys];
    const displayed = dateKeys.flatMap((k) => grouped[k] || []);
    const confs = displayed
      .filter((m) => m.aiConfidence > 0)
      .map((m) => m.aiConfidence);
    const avg =
      confs.length > 0
        ? Math.round(confs.reduce((s, c) => s + c, 0) / confs.length)
        : 0;

    return {
      filteredMatches: filtered,
      sortedDateKeys: dateKeys,
      groupedByDate: grouped,
      displayedMatches: displayed,
      liveCount: displayed.filter((m) => m.matchStatus === "live").length,
      upcomingCount: displayed.filter((m) => m.matchStatus === "upcoming")
        .length,
      finishedCount: displayed.filter((m) => m.matchStatus === "finished")
        .length,
      cs2DisplayedCount: displayed.filter((m) => m.game === "CS2").length,
      dota2DisplayedCount: displayed.filter((m) => m.game === "Dota2").length,
      avgConfidence: avg,
      tournamentOptions: [
        ...new Set(displayed.map((m) => m.context).filter(Boolean)),
      ].sort(),
    };
  }, [
    matches,
    filterGame,
    filterDayOfWeek,
    filterRisk,
    filterTournament,
    filterMatchType,
    filterStatus,
    debouncedSearchQuery,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // ── AI handlers ──
  const handleAiRecommend = useCallback(async (match: Match) => {
    setSelectedMatch(match);
    setAiModalOpen(true);
    setAiLoading(true);
    setAiRecommendation(null);
    try {
      const rec = await deepSeekService.recommendMatch({
        team1: match.team1,
        team2: match.team2,
        odds: [match.odds.team1, match.odds.team2],
        matchType: match.matchType,
        tier: match.tier || undefined,
      });
      setAiRecommendation(rec);
      setAiPredictions((prev) => ({ ...prev, [match.id]: rec }));
    } catch {
      toast.error("AI тимчасово недоступний");
    } finally {
      setAiLoading(false);
    }
  }, []);

  const handleShowComment = useCallback((match: Match) => {
    setSelectedCommentMatch(match);
    setCommentModalOpen(true);
  }, []);

  const handleAddToRisky = useCallback((match: Match) => {
    setSelectedRiskyMatch(match);
    setRiskyModalOpen(true);
  }, []);

  // ── Rate match ──
  const saveMatchRatings = (ratings: Record<string, MatchRating>) => {
    try {
      localStorage.setItem("match_ratings", JSON.stringify(ratings));
    } catch {
      /* ignore */
    }
  };

  const handleRateMatch = useCallback(
    (matchId: string, rating: MatchRating) => {
      setMatchRatings((prev) => {
        const current = prev[matchId];
        const newRating = current === rating ? null : rating;
        const updated = { ...prev, [matchId]: newRating };
        saveMatchRatings(updated);
        return updated;
      });
      if (rating) {
        UserDataService.upsertMatchRating(matchId, rating).catch(() => {});
      } else {
        UserDataService.deleteMatchRating(matchId).catch(() => {});
      }
    },
    [],
  );

  // ── Navigate to bets ──
  const navigate = useNavigate();
  const handleAddToBets = useCallback(
    (match: Match) => {
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
    },
    [navigate],
  );

  // ── Multi-select ──
  const toggleMatchSelection = useCallback((matchId: string) => {
    setSelectedMatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(matchId)) {
        next.delete(matchId);
      } else {
        if (next.size >= 10) {
          toast.error("⚠️ Максимум 10 матчів");
          return prev;
        }
        next.add(matchId);
      }
      return next;
    });
  }, []);

  const clearSelectedMatches = useCallback(
    () => setSelectedMatchIds(new Set()),
    [],
  );

  const handleCreateExpress = useCallback(() => {
    const selected = matches.filter((m) => selectedMatchIds.has(m.id));
    if (selected.length < 2) {
      toast.error("⚠️ Мінімум 2 матчі");
      return;
    }
    navigate("/app/my-bets", {
      state: {
        expressMatches: selected.map((m) => ({
          team1: m.team1,
          team2: m.team2,
          tournament: m.context,
          format: m.matchType,
          date: m.date,
          matchUrl: m.url || "",
          logoTeam1: m.logoTeam1,
          logoTeam2: m.logoTeam2,
        })),
      },
    });
  }, [matches, selectedMatchIds, navigate]);

  // ── Risky teams ──
  const loadRiskyTeams = useCallback(async () => {
    try {
      const resp = await fetch("/api/v1/risky-teams");
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          setRiskyTeams(data);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    // Fallback to localStorage (primary source used by RiskyTeams page)
    try {
      const saved = localStorage.getItem("admin_risky_teams");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRiskyTeams(parsed);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // ── Init risky teams on mount ──
  useEffect(() => {
    loadRiskyTeams();
  }, [loadRiskyTeams]);

  const getTeamRiskInfo = useCallback(
    (teamName: string): { notes: string; status: string } | null => {
      const team = riskyTeams.find(
        (t) =>
          t.name.toLowerCase() === teamName.toLowerCase() ||
          teamName.toLowerCase().includes(t.name.toLowerCase()) ||
          t.name.toLowerCase().includes(teamName.toLowerCase()),
      );
      return team ? { notes: team.notes, status: team.status } : null;
    },
    [riskyTeams],
  );

  const getMatchRiskComments = useCallback(
    (team1: string, team2: string): string => {
      const r1 = getTeamRiskInfo(team1),
        r2 = getTeamRiskInfo(team2);
      const cmts: string[] = [];
      for (const [r, name] of [
        [r1, team1],
        [r2, team2],
      ] as const) {
        if (!r) continue;
        const icon =
          r.status === "БАН"
            ? "🔴"
            : r.status === "Нестабільні"
              ? "🟠"
              : r.status === "Обережно"
                ? "🟡"
                : "🔵";
        cmts.push(`${icon} ${name}: ${r.notes || r.status}`);
      }
      return cmts.join("\n\n");
    },
    [getTeamRiskInfo],
  );

  const handleRiskySaved = useCallback(() => {
    loadRiskyTeams();
  }, [loadRiskyTeams]);

  // ── Sort ──
  const toggleSort = useCallback(
    (column: SortBy) => {
      if (sortBy === column) {
        setSortOrder((so) => (so === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(column);
        setSortOrder(
          column === "confidence" || column === "upset" ? "desc" : "asc",
        );
      }
    },
    [sortBy],
  );

  const getSortIcon = useCallback(
    (column: SortBy): "asc" | "desc" | "none" => {
      return sortBy === column ? sortOrder : "none";
    },
    [sortBy, sortOrder],
  );

  return {
    // Data
    matches,
    sortedDateKeys,
    groupedByDate,
    displayedMatches,
    matchRatings,
    setMatchRatings,
    aiPredictions,
    riskyTeams,
    // Loading
    isLoading,
    initialLoading,
    apiError,
    // Stats
    displayCount: displayedMatches.length,
    liveCount,
    upcomingCount,
    finishedCount,
    cs2DisplayedCount,
    dota2DisplayedCount,
    avgConfidence,
    // Filters
    filterGame,
    setFilterGame,
    filterStatus,
    setFilterStatus,
    filterMatchType,
    setFilterMatchType,
    filterDayOfWeek,
    setFilterDayOfWeek,
    filterRisk,
    setFilterRisk,
    filterTournament,
    setFilterTournament,
    searchQuery,
    setSearchQuery,
    hasActiveFilters,
    resetAllFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    tournamentOptions,
    // Columns
    visibleColumns,
    toggleColumn,
    // Modals
    pastDaysModalOpen,
    setPastDaysModalOpen,
    aiModalOpen,
    setAiModalOpen,
    predictionsModalOpen,
    setPredictionsModalOpen,
    selectedMatch,
    setSelectedMatch,
    aiRecommendation,
    aiLoading,
    handleAiRecommend,
    commentModalOpen,
    setCommentModalOpen,
    selectedCommentMatch,
    handleShowComment,
    riskyModalOpen,
    setRiskyModalOpen,
    selectedRiskyMatch,
    handleAddToRisky,
    // Actions
    refreshMatches,
    loadMatchesFromApi,
    loadRiskyTeams,
    // Poll
    pollLiveScores,
    hasDota2Matches,
    hasCs2Matches,
    liveScoreAge,
    // Multi-select
    selectedMatchIds,
    setSelectedMatchIds,
    toggleMatchSelection,
    clearSelectedMatches,
    handleCreateExpress,
    // Bets nav
    handleAddToBets,
    // Rate
    handleRateMatch,
    // Risk comments
    getMatchRiskComments,
    getTeamRiskInfo,
    handleRiskySaved,
    // Sort
    toggleSort,
    getSortIcon,
  };
}
