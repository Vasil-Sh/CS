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
import { findRiskyTeams, getGameFilterValue } from "@/lib/riskyTeamsMatcher";

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
  "date" | "confidence" | "risk" | "upset" | "status" | "odds" | "rating";
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
  { id: "score", label: "Гра", defaultVisible: true },
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
  const rawContext =
    game === "CS2"
      ? apiMatch.tournament && apiMatch.stage
        ? `${String(apiMatch.tournament)} — ${String(apiMatch.stage)}`
        : String(apiMatch.tournament || "") ||
          parseMatchContext(apiMatch.type, apiMatch.link)
      : parseDota2MatchContext(apiMatch as unknown as Dota2ApiMatch);
  // Safety: force string to prevent React "Cannot convert object to primitive value"
  const context =
    typeof rawContext === "string" ? rawContext : String(rawContext ?? "");
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
    date: String(apiMatch.date ?? ""),
    team1: String(apiMatch.nameTeam1 ?? ""),
    team2: String(apiMatch.nameTeam2 ?? ""),
    favorite: String(favorite ?? ""),
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
    matchType: String(matchType ?? ""),
    upsetProbability: Math.max(5, Math.min(45, 50 - Math.floor(posDiff * 0.3))),
    url: String(
      (game === "CS2"
        ? buildHltvUrl(String(apiMatch.link ?? ""))
        : buildTipsGgUrl(String(apiMatch.link ?? ""))) || "",
    ),
    score1: typeof apiMatch.score1 === "number" ? apiMatch.score1 : null,
    score2: typeof apiMatch.score2 === "number" ? apiMatch.score2 : null,
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
      ? String(m.nameTeam1 ?? "")
      : String(m.nameTeam2 ?? "")
    : String(m.nameTeam1 ?? "");
  const slugParts = String(m.link ?? "")
    .replace(/\/$/, "")
    .split("/");
  const dota2Slug = slugParts[slugParts.length - 2] || "";

  const rawContext = m.tournament
    ? `${String(m.tournament)}${m.stage ? " — " + String(m.stage) : ""}`
    : parseDota2MatchContext(m);
  const context =
    typeof rawContext === "string" ? rawContext : String(rawContext ?? "");

  return {
    id: `dota-${m.id}`,
    date: String(m.date ?? ""),
    team1: String(m.nameTeam1 ?? ""),
    team2: String(m.nameTeam2 ?? ""),
    favorite: String(fav ?? ""),
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
    context,
    tier: determineDota2Tier(m.positionTeam1, m.positionTeam2, m.tournament),
    matchType: parseDota2MatchType(m.type),
    upsetProbability: hasPrediction
      ? Math.max(
          5,
          Math.min(45, 50 - Math.abs((pred1 ?? 50) - (pred2 ?? 50)) * 0.5),
        )
      : 25,
    url: buildTipsGgUrl(String(m.link ?? "")),
    score1: typeof m.score1 === "number" ? m.score1 : null,
    score2: typeof m.score2 === "number" ? m.score2 : null,
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

// ── SessionStorage cache — prevents loading flash on page revisit ──
// Key versioned to invalidate corrupt data from previous app versions.
const MATCHES_CACHE_KEY = "matchiq_matches_cache_v3";
const MATCHES_CACHE_TS_KEY = "matchiq_matches_cache_ts_v3";

// Nuke old cache keys + localStorage caches on mount to prevent crashes.
function clearAllCaches(): void {
  // SessionStorage
  for (const key of [
    "matchiq_matches_cache",
    "matchiq_matches_cache_v2",
    "matchiq_matches_cache_ts",
    "matchiq_matches_cache_ts_v2",
  ]) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  // LocalStorage — API-level caches from csApi.ts / dota2Api.ts
  for (const key of ["cs2_matches_cache_v11", "dota2_matches_cache_v18"]) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

function loadCachedMatches(): { matches: Match[]; timestamp: number } | null {
  try {
    const raw = sessionStorage.getItem(MATCHES_CACHE_KEY);
    const ts = sessionStorage.getItem(MATCHES_CACHE_TS_KEY);
    if (!raw || !ts) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    // Aggressive sanitization: force EVERY field that JSX renders to be a primitive
    for (const m of parsed) {
      m.id = String(m.id ?? "");
      m.date = String(m.date ?? "");
      m.team1 = String(m.team1 ?? "");
      m.team2 = String(m.team2 ?? "");
      m.favorite = String(m.favorite ?? "");
      m.context = String(m.context ?? "");
      m.matchType = String(m.matchType ?? "");
      m.game = String(m.game ?? "");
      m.url = String(m.url ?? "");
      m.comment = String(m.comment ?? "");
      m.aiSummary = String(m.aiSummary ?? "");
      m.tier = m.tier || null;
      m.matchStatus = m.matchStatus || "upcoming";
      m.formStability = m.formStability || "stable";
      m.dota2Slug = String(m.dota2Slug ?? "");
      m.cs2Slug = String(m.cs2Slug ?? "");
      m.aiConfidence = Number(m.aiConfidence) || 0;
      m.risk = Number(m.risk) || 0;
      m.winRate = Number(m.winRate) || 0;
      m.upsetProbability = Number(m.upsetProbability) || 0;
      m.score1 = typeof m.score1 === "number" ? m.score1 : null;
      m.score2 = typeof m.score2 === "number" ? m.score2 : null;
      m.stars = typeof m.stars === "number" ? m.stars : 0;
      if (!m.odds || typeof m.odds !== "object")
        m.odds = { team1: 0, team2: 0 };
      if (!Array.isArray(m.playerForm)) m.playerForm = [];
    }
    return { matches: parsed as Match[], timestamp: parseInt(ts, 10) };
  } catch {
    return null;
  }
}

function saveCachedMatches(matches: Match[]): void {
  try {
    sessionStorage.setItem(MATCHES_CACHE_KEY, JSON.stringify(matches));
    sessionStorage.setItem(MATCHES_CACHE_TS_KEY, String(Date.now()));
  } catch {
    /* quota exceeded, ignore */
  }
}

// ── Main Hook ──
export function useMatches() {
  // One-time: nuke old corrupt sessionStorage caches
  clearAllCaches();
  const cached = loadCachedMatches();
  const [matches, setMatches] = useState<Match[]>(cached?.matches ?? []);
  const [isLoading, setIsLoading] = useState(false);
  // Skip loader if restored from cache — SWR refreshes silently in background
  const [initialLoading, setInitialLoading] = useState(cached ? false : true);
  const [sortBy, setSortBy] = useState<SortBy>("date");
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

  // ── Keep selectedMatch synced with latest match data (live scores) ──
  useEffect(() => {
    if (!predictionsModalOpen || !selectedMatch) return;
    const latest = matches.find((m) => m.id === selectedMatch.id);
    if (latest) {
      // Only update if scores or status changed — avoids infinite loop
      if (
        latest.score1 !== selectedMatch.score1 ||
        latest.score2 !== selectedMatch.score2 ||
        latest.matchStatus !== selectedMatch.matchStatus ||
        latest.predictionPercentTeam1 !==
          selectedMatch.predictionPercentTeam1 ||
        latest.predictionPercentTeam2 !==
          selectedMatch.predictionPercentTeam2 ||
        latest.bettingCoefficientTeam1 !==
          selectedMatch.bettingCoefficientTeam1 ||
        latest.bettingCoefficientTeam2 !== selectedMatch.bettingCoefficientTeam2
      ) {
        setSelectedMatch(latest);
      }
    }
  }, [matches, predictionsModalOpen, selectedMatch?.id]);

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
    // Only show loader if we have no matches at all (cold start).
    // If matches were restored from sessionStorage, refresh silently.
    setMatches((prev) => {
      if (prev.length === 0) setInitialLoading(true);
      return prev;
    });
    setApiError(null);
    try {
      // Track whether SWR callback already delivered fresh CS2 data.
      // If yes, skip the stale cache returned by Promise.allSettled.
      let freshCs2Arrived = false;

      const onCs2Update = (fresh: ApiMatch[]) => {
        if (gen !== fetchGenRef.current) return;
        freshCs2Arrived = true;
        setInitialLoading(false);
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

      // Fire Dota2 in background with retries — don't block initial render
      let dotaAttempt = 0;
      const maxDotaAttempts = 8; // reduced from 10 — avoid hammering rate-limited backend
      const onDotaUpdate = (fresh: Dota2ApiMatch[]) => {
        if (gen !== fetchGenRef.current) return;
        setInitialLoading(false);
        setMatches((prev) => {
          const cs2 = prev.filter((m) => m.game === "CS2");
          return [...cs2, ...fresh.map((m) => dota2ApiMatchToMatch(m))];
        });
      };
      const pullDota = async () => {
        try {
          const dota = await fetchDota2Matches(dotaAttempt === 0, onDotaUpdate);
          if (gen !== fetchGenRef.current) return;
          if (dota.length > 0) {
            onDotaUpdate(dota);
          } else if (dotaAttempt < maxDotaAttempts) {
            dotaAttempt++;
            setTimeout(pullDota, 12000); // 12s between retries (was 6s)
          }
        } catch {
          if (dotaAttempt < maxDotaAttempts) {
            dotaAttempt++;
            setTimeout(pullDota, 12000); // 12s between retries (was 6s)
          }
        }
      };
      pullDota();

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

        // ── CS2 auto-retry: if initial load returned empty, poll in background ──
        // Backend cold start (Puppeteer 30-80s) may outrun the fetchFreshMatches retry
        // loop. Keep trying until we get matches or the user navigates away.
        if (cs2Matches.length === 0 && cs2Data.status === "fulfilled") {
          let cs2Retry = 0;
          const maxCs2Retries = 8; // reduced from 15 — avoid hammering rate-limited backend
          const pullCs2 = async () => {
            if (gen !== fetchGenRef.current) return;
            try {
              const fresh = await fetchTodaysAndUpcomingMatches(true); // forceRefresh
              if (gen !== fetchGenRef.current) return;
              if (fresh.length > 0) {
                setMatches((prev) => {
                  const dota = prev.filter((m) => m.game === "Dota2");
                  const cs2 = fresh.map((m) => apiMatchToMatch(m, "CS2"));
                  return [...cs2, ...dota];
                });
              } else if (cs2Retry < maxCs2Retries) {
                cs2Retry++;
                setTimeout(pullCs2, 12000); // 12s between retries (was 6s)
              }
            } catch {
              if (cs2Retry < maxCs2Retries) {
                cs2Retry++;
                setTimeout(pullCs2, 12000); // 12s between retries (was 6s)
              }
            }
          };
          pullCs2();
        }
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

  // ── Persist matches to sessionStorage for instant restore on revisit ──
  useEffect(() => {
    if (matches.length > 0) saveCachedMatches(matches);
  }, [matches]);

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
                  : m.matchType === "Bo2"
                    ? 2 // BO2 needs 2 wins to be decided (2-0), a draw (1-1) is possible
                    : m.matchType === "Bo1"
                      ? 1
                      : 2;
            const isScoreDecided =
              hasScores &&
              maxScore >= winsNeeded &&
              Math.abs(s1 - s2) >= (m.matchType === "Bo1" ? 0 : 1);

            const newStatus: "upcoming" | "live" | "finished" | "postponed" =
              (() => {
                if (isScoreDecided) return "finished";

                // Age-based auto-finish for stale live matches
                // If a match has been live for >2h with no scores, it likely completed
                // but the data source never sent final results → finish it.
                if (!hasScores) {
                  const matchDate = new Date(m.date);
                  const ageMs = Date.now() - matchDate.getTime();
                  // >4h of live with no score update → auto-finish
                  if (m.matchStatus === "live" && ageMs > 4 * 60 * 60 * 1000)
                    return "finished";
                  // >30min of live with no score update → postpone
                  if (m.matchStatus === "live" && ageMs > 30 * 60 * 1000)
                    return "postponed";
                }

                // Allow postponed matches to re-activate if live scores arrive
                // (e.g. tips.gg-only matches that were auto-postponed due to
                // missing live store entries — once scores appear, go live/finished).
                if (m.matchStatus === "postponed" && hasScores) {
                  if (isScoreDecided) return "finished";
                  return "live";
                }

                // Already postponed with no scores — keep it
                if (m.matchStatus === "postponed") return "postponed";

                if (m.matchStatus === "live" && update.status === "finished")
                  return "live";
                if (update.status === "finished") return "finished";
                if (update.status === "live") return "live";

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

  // ── Auto-refresh match list every 60s (no live score polling) ──
  const [liveScoreAge, setLiveScoreAge] = useState(0);

  useEffect(() => {
    let isQuietRefreshing = false;
    const quietRefresh = async () => {
      if (isQuietRefreshing) return;
      if (document.visibilityState !== "visible") return;
      isQuietRefreshing = true;
      try {
        await clearDota2Cache();
        await loadMatchesFromApi();
      } catch {
        /* silent */
      } finally {
        isQuietRefreshing = false;
      }
    };

    const refreshTimer = setInterval(quietRefresh, 60_000);

    const onFocus = () => {
      if (document.visibilityState === "visible") quietRefresh();
    };
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      clearInterval(refreshTimer);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [loadMatchesFromApi]);

  // ── Filtering & sorting (memoized) ──
  const {
    filteredMatches,
    sortedDateKeys,
    groupedByDate,
    displayedMatches,
    bo1Count,
    bo3Count,
    bo5Count,
    cs2DisplayedCount,
    dota2DisplayedCount,
    avgConfidence,
    tournamentOptions,
  } = useMemo(() => {
    const todayKey = getTodayDateKey();
    // Yesterday's date key for keeping recently completed matches visible
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yyyy = yesterdayDate.getFullYear();
    const ymm = String(yesterdayDate.getMonth() + 1).padStart(2, "0");
    const ydd = String(yesterdayDate.getDate()).padStart(2, "0");
    const yesterdayKey = `${yyyy}-${ymm}-${ydd}`;

    const filtered = matches.filter((match) => {
      const matchDateKey = getDateKey(match.date);
      // Exclude matches from past days — but keep:
      // - live & upcoming (still playing or about to start)
      // - yesterday's matches (users want to see results)
      if (
        matchDateKey < todayKey &&
        matchDateKey !== yesterdayKey &&
        match.matchStatus !== "live" &&
        match.matchStatus !== "upcoming"
      )
        return false;
      // Auto-hide finished matches that are very old.
      // Today: 8h from start — keeps matches visible all day (BO3 takes 2-3h).
      // Yesterday: 12h from start — covers late-night matches checked in the morning.
      if (match.matchStatus === "finished") {
        const hoursSinceStart =
          (Date.now() - new Date(match.date).getTime()) / 3600000;
        const maxHours = matchDateKey === yesterdayKey ? 12 : 8;
        if (hoursSinceStart > maxHours) return false;
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

    // Rating rank helper: like=0, neutral=1, dislike=2
    const ratingRank = (id: string) => {
      const r = matchRatings[id] || null;
      return r === "like" ? 0 : r === "dislike" ? 2 : 1;
    };

    // Composite sort tier — determines the visible sections:
    // 0 = liked (any status)
    // 1 = neutral upcoming/live
    // 2 = disliked upcoming/live
    // 3 = neutral finished
    // 4 = disliked finished
    const compositeTier = (m: Match) => {
      const r = ratingRank(m.id);
      const isFinished = m.matchStatus === "finished";
      if (r === 0) return 0;
      if (r === 1 && !isFinished) return 1;
      if (r === 2 && !isFinished) return 2;
      if (r === 1 && isFinished) return 3;
      return 4;
    };

    const sorted = [...filtered].sort((a, b) => {
      // Composite tier is always primary — sections in fixed order.
      // When sorting by "rating" column, sortOrder inverts the tier direction.
      let cmp = compositeTier(a) - compositeTier(b);
      if (sortBy === "rating") cmp = sortOrder === "asc" ? cmp : -cmp;
      if (cmp !== 0) return cmp;

      // Within same tier, apply the chosen sort
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
        case "rating":
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
      // Fallback tiebreaker: by date
      if (cmp === 0)
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortOrder === "asc" ? cmp : -cmp;
    });

    const grouped: Record<string, Match[]> = {};
    sorted.forEach((m) => {
      const k = getDateKey(m.date);
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(m);
    });

    const allKeys = Object.keys(grouped);
    const pastLiveKeys = allKeys.filter((k) => k < todayKey).sort();
    const futureKeys = allKeys.filter((k) => k > todayKey).sort();
    const dateKeys = [...pastLiveKeys, todayKey, ...futureKeys];
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
      bo1Count: displayed.filter((m) => m.matchType === "Bo1").length,
      bo3Count: displayed.filter((m) => m.matchType === "Bo3").length,
      bo5Count: displayed.filter((m) => m.matchType === "Bo5").length,
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
    matchRatings,
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
          game: m.game,
        })),
      },
    });
  }, [matches, selectedMatchIds, navigate]);

  // ── Risky teams ──
  const loadRiskyTeams = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const resp = await fetch("/api/v1/risky-teams", { headers });
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
    (
      teamName: string,
      game: "CS2" | "Dota2",
    ): { notes: string; status: string } | null => {
      const results = findRiskyTeams(
        teamName,
        "",
        getGameFilterValue(game),
        riskyTeams,
      );
      if (results.length === 0) return null;
      const gameLabel = results[0].game === "Дота" ? "Dota2" : "CS2";
      return {
        notes: results[0].notes,
        status: results[0].status,
        game: gameLabel,
      };
    },
    [riskyTeams],
  );

  const getMatchRiskComments = useCallback(
    (team1: string, team2: string, game: "CS2" | "Dota2"): string => {
      const r1 = getTeamRiskInfo(team1, game),
        r2 = getTeamRiskInfo(team2, game);
      const cmts: string[] = [];
      for (const [r, name] of [
        [r1, team1],
        [r2, team2],
      ] as const) {
        if (!r) continue;
        // Only show same-game risky teams in the comment modal
        if (r.game && r.game !== game) continue;
        const note = r.notes || r.status;
        cmts.push(`${name}: ${note}|${r.status}|${game}`);
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
    bo1Count,
    bo3Count,
    bo5Count,
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
