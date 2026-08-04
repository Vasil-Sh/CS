import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useLayoutEffect,
} from "react";
import { UserDataService } from "@/lib/userDataService";
import { BankrollService } from "@/lib/bankrollService";
import type { CS2Strategy } from "@/types/strategy";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  parseDota2MatchFromUrl,
  parseCS2MatchFromUrl,
} from "@/lib/matchUrlParser";
import {
  calcTotalExpressOdds,
  calcExpectedValue,
  calcPotentialProfit,
  getValueBetAnalysis,
  getOverconfidenceWarning,
  calcKellyCriterion,
  getExpressRiskLevel,
  getEVVerdict,
} from "@/lib/betCalculations";
import { findRiskyTeams } from "@/lib/riskyTeamsMatcher";
import { useTiltBlock } from "@/hooks/useTiltBlock";
import type { Bet } from "@/types/betting";

// ── Re‑exported types (used by the component) ──
export interface MatchPrefillData {
  team1: string;
  team2: string;
  tournament: string;
  format: string;
  date: string;
  matchUrl?: string;
  odds?: string;
  logoTeam1?: string | null;
  logoTeam2?: string | null;
  game?: "CS2" | "Dota2";
}

export interface CS2BettingFormProps {
  onRecordAdded?: () => void;
  prefillData?: MatchPrefillData | null;
  onPrefillConsumed?: () => void;
  expressMatchesData?: MatchPrefillData[] | null;
  onExpressMatchesConsumed?: () => void;
}

export interface RiskyTeam {
  name: string;
  game: string;
  status: string;
  notes: string;
  logo?: string | null;
}

export interface ExpressEvent {
  match: string;
  betType: string;
  selection: string;
  odds: string;
  game?: string;
  logoTeam1?: string | null;
  logoTeam2?: string | null;
}

export interface BetRecord {
  date: string;
  match: string;
  team1: string;
  team2: string;
  tournament: string;
  format: string;
  game: string;
  matchUrl: string;
  betType: string;
  odds: number;
  amount: number;
  originalAmount: number;
  currency: string;
  exchangeRate: number | null;
  result: "Pending";
  profit: number;
  roi: number;
  strategy: string;
  riskyTeams: RiskyTeam[];
  notes: string;
  goalId?: string;
  winProbability?: number;
  logoTeam1?: string | null;
  logoTeam2?: string | null;
  expressLogos?: { logoTeam1?: string | null; logoTeam2?: string | null }[];
}

export interface StrategyViolation {
  type: "odds" | "format" | "betType";
  message: string;
  severity: "acceptable" | "serious";
  explanation: string;
}

export interface Goal {
  id: string;
  name: string;
  type: "amount" | "ladder" | "roi" | "winrate";
  status: "active" | "completed" | "failed";
  currentStep?: number;
  startAmount?: number;
  targetLadderAmount?: number;
  steps?: { step: number; startAmount: number; status: string }[];
}

// ── Constants ──
export const MAX_CONFIDENCE = 95;
const DEFAULT_MAX_STAKE_PERCENT = 7;

export const getDefaultFormData = (
  strategyName?: string,
  betCategory?: string,
) => ({
  date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`,
  game: "CS2" as "CS2" | "Dota2",
  matchUrl: "",
  tournament: "",
  team1: "",
  team2: "",
  format: "BO3",
  riskyTeams: [] as RiskyTeam[],
  betType: "",
  betCategory: betCategory || "Ординар",
  selection: "",
  odds: "",
  stake: "",
  currency: "UAH",
  exchangeRate: (() => {
    const r = localStorage.getItem("matchiq_exchange_rate");
    return r || "41.50";
  })(),
  confidence: "",
  strategy: strategyName || "",
  reasoning: "",
  keyFactors: "",
  riskLevel: "",
  notes: "",
  goalId: "",
});

// ── Pure utilities (outside hook — stable references) ──
function loadRiskyTeamsFromStorage(): RiskyTeam[] {
  try {
    const saved = localStorage.getItem("admin_risky_teams");
    if (saved) {
      const savedTeams = JSON.parse(saved) as RiskyTeam[];
      return savedTeams.map((team: RiskyTeam) => ({
        name: team.name,
        game: team.game || "CS",
        status: team.status || "Під питанням",
        notes: team.notes || "",
      }));
    }
  } catch (error) {
    if (import.meta.env.DEV)
      console.error("Error loading risky teams from storage:", error);
  }
  return [];
}

function getGameFilterValue(formGame: "CS2" | "Dota2"): string {
  return formGame === "CS2" ? "CS" : "Dota";
}

function convertToUAH(amount: number, currency: string, rate: number) {
  if (currency === "USD") return amount * rate;
  return amount;
}

// ── Hook ──
export function useBettingForm({
  onRecordAdded,
  prefillData,
  onPrefillConsumed,
  expressMatchesData,
  onExpressMatchesConsumed,
}: CS2BettingFormProps) {
  const { user } = useAuth();
  const currentUser = user?.username || "";

  // ── State ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsingMatch, setIsParsingMatch] = useState(false);
  const [primaryStrategy, setPrimaryStrategy] = useState<CS2Strategy | null>(
    null,
  );
  const [strategyViolations, setStrategyViolations] = useState<
    StrategyViolation[]
  >([]);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [showViolationDialog, setShowViolationDialog] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<Record<string, boolean>>({});
  const [isPrefilled, setIsPrefilled] = useState(false);
  const [isExpressFromMatches, setIsExpressFromMatches] = useState(false);
  const [maxStakePercent, setMaxStakePercent] = useState<number>(() => {
    const saved = UserDataService.getUserData<number>(
      currentUser,
      "max_stake_percent",
      0,
    );
    return saved || DEFAULT_MAX_STAKE_PERCENT;
  });

  const apiBetsRef = useRef<BetRecord[]>([]);
  const [apiBets, setApiBets] = useState<BetRecord[]>([]);

  const [formData, setFormData] = useState(() => {
    const initialCategory =
      expressMatchesData && expressMatchesData.length >= 2
        ? "Експрес"
        : "Ординар";
    const defaults = getDefaultFormData(undefined, initialCategory);
    if (prefillData?.game) {
      defaults.game = prefillData.game;
      if (prefillData.format) {
        const fm: Record<string, string> = {
          Bo1: "BO1",
          Bo2: "BO2",
          Bo3: "BO3",
          Bo5: "BO5",
        };
        defaults.format = fm[prefillData.format] || prefillData.format || "BO3";
      }
    }
    return defaults;
  });

  const [expressEvents, setExpressEvents] = useState<ExpressEvent[]>(() => {
    if (expressMatchesData && expressMatchesData.length >= 2) {
      return expressMatchesData.map((m) => ({
        match: `${m.team1} vs ${m.team2}`,
        betType: "Match Winner",
        selection: m.team1,
        odds: "",
        game: m.game || "CS2",
        logoTeam1: m.logoTeam1,
        logoTeam2: m.logoTeam2,
      }));
    }
    return [];
  });

  // ── Refs ──
  const expressConsumedRef = useRef(
    !!(expressMatchesData && expressMatchesData.length >= 2),
  );
  const prefillConsumedRef = useRef(false);
  const prefillLogosRef = useRef<{
    logoTeam1?: string | null;
    logoTeam2?: string | null;
  }>({});
  const strategyLoadedRef = useRef(false);
  const strategiesRef = useRef<CS2Strategy[]>([]);
  const onPrefillConsumedRef = useRef(onPrefillConsumed);
  onPrefillConsumedRef.current = onPrefillConsumed;
  const urlDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Effects ──
  useEffect(() => {
    if (!currentUser) return;
    UserDataService.fetchBets()
      .then((bets) => {
        const cast = bets as unknown as BetRecord[];
        apiBetsRef.current = cast;
        setApiBets(cast);
      })
      .catch(() => {});
  }, [currentUser]);

  // ── Helpers (must be defined before effects that use them) ──
  const loadActiveGoals = useCallback(() => {
    if (!currentUser) return;
    const goals = UserDataService.getUserData<Goal[]>(currentUser, "goals", []);
    setActiveGoals(goals.filter((g) => g.status === "active"));
  }, [currentUser]);

  useLayoutEffect(() => {
    if (prefillData?.game) {
      const fm: Record<string, string> = {
        Bo1: "BO1",
        Bo2: "BO2",
        Bo3: "BO3",
        Bo5: "BO5",
      };
      setFormData((prev) => ({
        ...prev,
        game: prefillData.game!,
        format: prefillData.format
          ? fm[prefillData.format] || prefillData.format
          : prev.format,
      }));
    }
  }, [prefillData]);

  useEffect(() => {
    if (Object.keys(submitErrors).length === 0) return;
    const cleared = { ...submitErrors };
    let changed = false;
    for (const field of Object.keys(cleared)) {
      const val = (formData as Record<string, unknown>)[field];
      if (field === "odds" && val && parseFloat(String(val)) > 1) {
        delete cleared[field];
        changed = true;
      } else if (field === "stake" && val && parseFloat(String(val)) > 0) {
        delete cleared[field];
        changed = true;
      } else if (val && String(val).trim() !== "") {
        delete cleared[field];
        changed = true;
      }
    }
    if (changed) setSubmitErrors(cleared);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.team1,
    formData.team2,
    formData.betType,
    formData.selection,
    formData.odds,
    formData.stake,
  ]);

  useEffect(() => {
    const stored = UserDataService.getUserData<CS2Strategy[]>(
      currentUser,
      "strategies_data",
      [],
    );
    strategiesRef.current = stored;
  }, [currentUser]);

  useEffect(() => {
    UserDataService.setUserData(
      currentUser,
      "max_stake_percent",
      maxStakePercent,
    );
    UserDataService.saveUserPrefs({ maxStakePercent }).catch(() => {});
  }, [maxStakePercent, currentUser]);

  useEffect(() => {
    if (
      expressMatchesData &&
      expressMatchesData.length >= 2 &&
      expressConsumedRef.current
    ) {
      setIsPrefilled(true);
      setIsExpressFromMatches(true);
      const matchCount = expressMatchesData.length;
      setTimeout(() => {
        onExpressMatchesConsumed?.();
        toast.success(
          `${matchCount} матчів додано до експресу. Заповніть коефіцієнти та вибір для кожної події.`,
        );
      }, 0);
    }
    if (strategyLoadedRef.current) return;
    strategyLoadedRef.current = true;
    const savedPrimaryStrategy = UserDataService.getUserData<string>(
      currentUser,
      "primary_strategy",
      "",
    );
    if (savedPrimaryStrategy) {
      const strategy = strategiesRef.current?.find(
        (s: CS2Strategy) =>
          s.name === savedPrimaryStrategy || s.id === savedPrimaryStrategy,
      );
      if (strategy) {
        setPrimaryStrategy(strategy);
        setFormData((prev) => ({ ...prev, strategy: strategy.name }));
      }
    }
    loadActiveGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadActiveGoals();
  }, [currentUser, loadActiveGoals]);

  useEffect(() => {
    if (!prefillData) {
      prefillConsumedRef.current = false;
      return;
    }
    if (prefillConsumedRef.current) return;
    prefillConsumedRef.current = true;
    prefillLogosRef.current = {
      logoTeam1: prefillData.logoTeam1,
      logoTeam2: prefillData.logoTeam2,
    };
    const formatMap: Record<string, string> = {
      Bo1: "BO1",
      Bo2: "BO2",
      Bo3: "BO3",
      Bo5: "BO5",
    };
    setFormData((prev) => ({
      ...prev,
      team1: prefillData.team1 || "",
      team2: prefillData.team2 || "",
      tournament: prefillData.tournament || "",
      format: formatMap[prefillData.format] || prefillData.format || "BO3",
      date: prefillData.date ? prefillData.date.split("T")[0] : prev.date,
      matchUrl: prefillData.matchUrl || "",
      odds: prefillData.odds || "",
      game: prefillData.game || prev.game,
    }));
  }, [prefillData]);

  useEffect(() => {
    if (
      expressMatchesData &&
      expressMatchesData.length >= 2 &&
      !expressConsumedRef.current
    ) {
      expressConsumedRef.current = true;
      setFormData((prev) => ({ ...prev, betCategory: "Експрес" }));
      setExpressEvents(
        expressMatchesData.map((m) => ({
          match: `${m.team1} vs ${m.team2}`,
          betType: "Match Winner",
          selection: m.team1,
          odds: "",
          game: m.game || "CS2",
          logoTeam1: m.logoTeam1,
          logoTeam2: m.logoTeam2,
        })),
      );
      setIsPrefilled(true);
      setIsExpressFromMatches(true);
      setTimeout(() => {
        onExpressMatchesConsumed?.();
        toast.success(
          `${expressMatchesData.length} матчів додано до експресу.`,
        );
      }, 0);
    }
    if (!expressMatchesData) expressConsumedRef.current = false;
  }, [expressMatchesData, onExpressMatchesConsumed]);

  useEffect(() => {
    const handleStorageChange = () => {
      const sp = UserDataService.getUserData<string>(
        currentUser,
        "primary_strategy",
        "",
      );
      if (sp) {
        const s = strategiesRef.current?.find(
          (x: CS2Strategy) => x.name === sp || x.id === sp,
        );
        if (s) {
          setPrimaryStrategy(s);
          setFormData((prev) => ({ ...prev, strategy: s.name }));
        } else {
          setPrimaryStrategy(null);
          setFormData((prev) => ({ ...prev, strategy: "" }));
        }
      } else {
        setPrimaryStrategy(null);
        setFormData((prev) => ({ ...prev, strategy: "" }));
      }
      loadActiveGoals();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ── Helpers ──
  const checkRiskyTeams = (
    team1: string,
    team2: string,
    currentGame: "CS2" | "Dota2",
  ) => {
    if (!team1 && !team2) {
      setFormData((prev) => ({ ...prev, riskyTeams: [] }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      riskyTeams: findRiskyTeams(
        team1,
        team2,
        getGameFilterValue(currentGame),
        loadRiskyTeamsFromStorage(),
        prefillLogosRef.current,
      ),
    }));
  };

  const detectRisky = (
    team1: string,
    team2: string,
    gameFilter: string,
  ): RiskyTeam[] =>
    findRiskyTeams(team1, team2, gameFilter, loadRiskyTeamsFromStorage());

  useEffect(() => {
    if (formData.team1 || formData.team2)
      checkRiskyTeams(formData.team1, formData.team2, formData.game);
  }, [formData.team1, formData.team2, formData.game]);

  useEffect(() => {
    if (expressEvents.length === 0 || formData.team1 || formData.team2) return;
    const saved = loadRiskyTeamsFromStorage();
    if (saved.length === 0) return;
    const found: RiskyTeam[] = [];
    for (const event of expressEvents) {
      const parts = event.match.split(" vs ");
      for (const f of findRiskyTeams(
        parts[0] || "",
        parts[1] || "",
        getGameFilterValue(formData.game),
        saved,
        { logoTeam1: event.logoTeam1, logoTeam2: event.logoTeam2 },
      )) {
        if (!found.some((r) => r.name === f.name)) found.push(f);
      }
    }
    if (found.length > 0)
      setFormData((prev) => ({ ...prev, riskyTeams: found }));
  }, [expressEvents, formData.game]);

  // ── Strategy validation ──
  const validateAgainstStrategy = useCallback(() => {
    if (!primaryStrategy || formData.betCategory !== "Ординар") {
      setStrategyViolations([]);
      return;
    }
    const violations: StrategyViolation[] = [];
    const odds = parseFloat(formData.odds);
    if (odds && primaryStrategy.minOdds && odds < primaryStrategy.minOdds) {
      const d = primaryStrategy.minOdds - odds;
      violations.push({
        type: "odds",
        message: `Коефіцієнт ${odds} нижче рекомендованого ${primaryStrategy.minOdds}`,
        severity: d > 0.3 ? "serious" : "acceptable",
        explanation:
          d > 0.3
            ? "Низькі коефіцієнти зменшують потенційний прибуток."
            : "Незначне відхилення.",
      });
    }
    if (odds && primaryStrategy.maxOdds && odds > primaryStrategy.maxOdds) {
      const d = odds - primaryStrategy.maxOdds;
      violations.push({
        type: "odds",
        message: `Коефіцієнт ${odds} вище рекомендованого ${primaryStrategy.maxOdds}`,
        severity: d > 0.5 ? "serious" : "acceptable",
        explanation:
          d > 0.5
            ? "Високі коефіцієнти = низька ймовірність."
            : "Відхилення в межах.",
      });
    }
    if (
      primaryStrategy.allowedFormats?.length &&
      !primaryStrategy.allowedFormats.includes(formData.format)
    )
      violations.push({
        type: "format",
        message: `Формат ${formData.format} не рекомендований`,
        severity: "acceptable",
        explanation: "Стратегія для інших форматів.",
      });
    if (
      primaryStrategy.allowedBetTypes?.length &&
      !primaryStrategy.allowedBetTypes.includes(formData.betCategory)
    )
      violations.push({
        type: "betType",
        message: `Тип "${formData.betCategory}" не рекомендований`,
        severity: "serious",
        explanation: "Стратегія для інших типів ставок.",
      });
    setStrategyViolations(violations);
  }, [formData.odds, formData.format, formData.betCategory, primaryStrategy]);

  useEffect(() => {
    validateAgainstStrategy();
  }, [validateAgainstStrategy]);

  // ── Handlers ──
  const clearForm = () => {
    setFormData(getDefaultFormData(primaryStrategy?.name));
    setExpressEvents([]);
    setStrategyViolations([]);
    setIsPrefilled(false);
    setIsExpressFromMatches(false);
    onPrefillConsumedRef.current?.();
    toast.success("Форму очищено");
  };

  const getLastStakeForGoal = (goalId: string): string => {
    const allGoals = UserDataService.getUserData(currentUser, "goals", []);
    const goal = allGoals.find((g: Goal) => g.id === goalId);
    if (!goal) return "";
    if (goal.type === "ladder") {
      const steps = goal.steps;
      if (steps?.length) {
        const idx = goal.currentStep ?? 0;
        if (idx < steps.length && steps[idx].startAmount > 0)
          return String(Math.round(steps[idx].startAmount * 100) / 100);
      }
      if (goal.startAmount && goal.startAmount > 0)
        return String(Math.round(goal.startAmount * 100) / 100);
      return "";
    }
    const allRecords = UserDataService.getUserData<BetRecord[]>(
      currentUser,
      "mybets_data",
      [],
    );
    const goalRecords = allRecords
      .filter((r) => r.goalId === goalId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (goalRecords.length > 0) {
      const last = goalRecords[0].originalAmount ?? goalRecords[0].amount;
      if (last && last > 0) return String(Math.round(last * 100) / 100);
    }
    return "";
  };

  const parseMatchFromUrl = async (url: string) => {
    setIsParsingMatch(true);
    try {
      if (url.includes("dota2")) {
        const r = parseDota2MatchFromUrl(url);
        if (r) {
          setFormData((prev) => ({
            ...prev,
            game: "Dota2",
            team1: r.team1,
            team2: r.team2,
            tournament: r.tournament,
            riskyTeams: detectRisky(r.team1, r.team2, "Dota"),
          }));
          toast.success("Інформацію про Dota 2 матч успішно отримано!");
        } else toast.error("Не вдалося розпарсити Dota 2 URL");
      } else if (url.includes("hltv.org/matches/")) {
        const r = parseCS2MatchFromUrl(url);
        if (r) {
          setFormData((prev) => ({
            ...prev,
            game: "CS2",
            team1: r.team1,
            team2: r.team2,
            tournament: r.tournament,
            riskyTeams: detectRisky(r.team1, r.team2, "CS"),
          }));
          toast.success("Інформацію про CS2 матч успішно отримано!");
        } else toast.error('Не вдалося знайти "vs" у посиланні');
      } else toast.error("Невідомий формат URL");
    } catch {
      toast.error("Помилка при парсингу URL");
    } finally {
      setIsParsingMatch(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setFormData((prev) => ({ ...prev, matchUrl: url }));
    if (urlDebounceRef.current) clearTimeout(urlDebounceRef.current);
    urlDebounceRef.current = setTimeout(() => {
      if (url.includes("hltv.org/matches/") || url.includes("dota2"))
        parseMatchFromUrl(url);
    }, 500);
  };

  const removeRiskyTeam = (index: number) =>
    setFormData((prev) => ({
      ...prev,
      riskyTeams: prev.riskyTeams.filter((_, i) => i !== index),
    }));

  const addExpressEvent = () => {
    if (expressEvents.length >= 10) {
      toast.error("Максимум 10 подій в експресі");
      return;
    }
    const missing = [];
    if (!formData.team1) missing.push("Команда 1");
    if (!formData.team2) missing.push("Команда 2");
    if (!formData.betType) missing.push("Тип прогнозу");
    if (!formData.selection) missing.push("Вибір");
    if (!formData.odds) missing.push("Коефіцієнт");
    if (missing.length > 0) {
      toast.error(`Заповніть: ${missing.join(", ")}`);
      return;
    }
    setExpressEvents([
      ...expressEvents,
      {
        match: `${formData.team1} vs ${formData.team2}`,
        betType: formData.betType,
        selection: formData.selection,
        odds: formData.odds,
        game: formData.game,
      },
    ]);
    setFormData((prev) => ({
      ...prev,
      matchUrl: "",
      team1: "",
      team2: "",
      tournament: "",
      betType: "",
      selection: "",
      odds: "",
      riskyTeams: [],
    }));
    toast.success(`Подія ${expressEvents.length + 1} додана до експресу`);
  };

  const removeExpressEvent = (index: number) => {
    setExpressEvents(expressEvents.filter((_, i) => i !== index));
    toast.success("Подію видалено з експресу");
  };
  const clearExpressEvents = () => {
    setExpressEvents([]);
    setIsExpressFromMatches(false);
    toast.success("Всі події експресу очищено");
  };

  const updateExpressEvent = (
    index: number,
    field: keyof ExpressEvent,
    value: string,
  ) =>
    setExpressEvents((prev) =>
      prev.map((ev, i) => (i === index ? { ...ev, [field]: value } : ev)),
    );

  const handleConfidenceChange = (value: string) => {
    const n = parseFloat(value);
    if (value === "" || isNaN(n)) {
      setFormData((prev) => ({ ...prev, confidence: value }));
      return;
    }
    if (n > MAX_CONFIDENCE) {
      setFormData((prev) => ({ ...prev, confidence: String(MAX_CONFIDENCE) }));
      toast.warning(`⚠️ Максимум ${MAX_CONFIDENCE}%`);
      return;
    }
    if (n < 1) {
      setFormData((prev) => ({ ...prev, confidence: "1" }));
      return;
    }
    setFormData((prev) => ({ ...prev, confidence: value }));
  };

  const applyKellyAmount = (amount: number) => {
    if (amount > 0) {
      setFormData((prev) => ({ ...prev, stake: String(amount) }));
      toast.success(`Суму змінено на ${amount} ₴ (Келлі)`);
    }
  };

  // ── Submission ──
  const processBetSubmission = async () => {
    setIsSubmitting(true);
    try {
      const stakeAmount = parseFloat(formData.stake);
      const exchangeRate = parseFloat(formData.exchangeRate);
      const winProbability = parseFloat(formData.confidence);
      const stakeInUAH = convertToUAH(
        stakeAmount,
        formData.currency,
        exchangeRate,
      );
      let betTypeWithCategory: string;
      let finalOdds: number;
      let matchName: string;
      if (formData.betCategory === "Експрес") {
        finalOdds = calcTotalExpressOdds(expressEvents);
        betTypeWithCategory = `Експрес ${expressEvents.length}x | ${expressEvents.map((e, i) => `${i + 1}. ${e.match} | ${e.betType}: ${e.selection} @${e.odds}`).join(" • ")}`;
        matchName = `Експрес ${expressEvents.length}x`;
      } else {
        betTypeWithCategory = `${formData.betType} - ${formData.selection}`;
        finalOdds = parseFloat(formData.odds);
        matchName = `${formData.team1} vs ${formData.team2}`;
      }
      const finalGoalId =
        formData.goalId && formData.goalId !== "" && formData.goalId !== "all"
          ? formData.goalId
          : undefined;
      const record: BetRecord = {
        date: formData.date,
        match: matchName,
        team1: formData.betCategory === "Експрес" ? "Експрес" : formData.team1,
        team2:
          formData.betCategory === "Експрес"
            ? `${expressEvents.length}x`
            : formData.team2,
        tournament:
          formData.betCategory === "Експрес" ? "Експрес" : formData.tournament,
        format:
          formData.betCategory === "Експрес"
            ? `${expressEvents.length}x`
            : formData.format,
        game:
          formData.betCategory === "Експрес"
            ? expressEvents.every((e) => e.game === "Dota2")
              ? "Dota2"
              : expressEvents.every((e) => e.game === "CS2")
                ? "CS2"
                : formData.game === "CS2"
                  ? "CS2"
                  : "Dota2"
            : formData.game === "CS2"
              ? "CS2"
              : "Dota2",
        matchUrl: formData.matchUrl || "",
        betType: betTypeWithCategory,
        odds: finalOdds,
        amount: stakeInUAH,
        originalAmount: stakeAmount,
        currency: formData.currency,
        exchangeRate: formData.currency === "USD" ? exchangeRate : null,
        result: "Pending" as const,
        profit: 0,
        roi: 0,
        strategy: formData.strategy,
        riskyTeams: formData.riskyTeams,
        notes:
          [
            formData.reasoning,
            formData.keyFactors ? `Key Factors: ${formData.keyFactors}` : "",
            formData.notes ? `Notes: ${formData.notes}` : "",
          ]
            .filter(Boolean)
            .join("\n\n") || "",
        goalId: finalGoalId,
        winProbability: isNaN(winProbability) ? undefined : winProbability,
        logoTeam1:
          formData.betCategory === "Експрес"
            ? undefined
            : prefillLogosRef.current.logoTeam1,
        logoTeam2:
          formData.betCategory === "Експрес"
            ? undefined
            : prefillLogosRef.current.logoTeam2,
        expressLogos:
          formData.betCategory === "Експрес"
            ? expressEvents.map((e) => ({
                logoTeam1: e.logoTeam1,
                logoTeam2: e.logoTeam2,
              }))
            : undefined,
      };
      const localFallback = (apiId?: string | number) => {
        const freshBets = UserDataService.getUserData<BetRecord[]>(
          currentUser,
          "mybets_data",
          [],
        );
        UserDataService.setUserDataSync(currentUser, "mybets_data", [
          {
            ...record,
            id: apiId ?? `local_${crypto.randomUUID()}`,
            riskyTeams: record.riskyTeams.map((t) => t.name),
          } as BetRecord,
          ...freshBets,
        ]);
      };
      try {
        const bodyToSend: Record<string, unknown> = {
          match: record.match,
          team1: record.team1,
          team2: record.team2,
          betType: record.betType,
          odds: record.odds,
          amount: record.amount,
          date: record.date,
          result: record.result,
          profit: record.profit || 0,
          strategy: record.strategy || "",
          format: record.format,
          game: record.game,
          currency: record.currency,
          notes: record.notes || "",
          goalId: record.goalId || "",
          matchUrl: record.matchUrl || "",
          tournament: record.tournament || "",
          riskyTeams: record.riskyTeams.map((t) => t.name),
        };
        const sv = parseFloat(formData.stake);
        if (!isNaN(sv) && sv > 0) bodyToSend.stake = sv;
        if (!isNaN(record.originalAmount) && record.originalAmount > 0)
          bodyToSend.originalAmount = record.originalAmount;
        if (record.exchangeRate !== null && record.exchangeRate !== undefined)
          bodyToSend.exchangeRate = record.exchangeRate;
        if (record.winProbability !== undefined)
          bodyToSend.winProbability = record.winProbability;
        if (record.logoTeam1) bodyToSend.logoTeam1 = record.logoTeam1;
        if (record.logoTeam2) bodyToSend.logoTeam2 = record.logoTeam2;
        const created = await UserDataService.createBet(
          bodyToSend as Parameters<typeof UserDataService.createBet>[0],
        );
        localFallback(created.id);
      } catch (err) {
        if (import.meta.env.DEV)
          console.warn("[API] Bet save failed, caching:", err);
        localFallback();
      }
      if (finalGoalId)
        toast.success(
          `✅ Запис прив'язано до цілі "${activeGoals.find((g) => g.id === finalGoalId)?.name}"`,
        );
      else toast.success("Запис успішно створено!");
      setFormData(getDefaultFormData(primaryStrategy?.name));
      setExpressEvents([]);
      setStrategyViolations([]);
      setIsPrefilled(false);
      setIsExpressFromMatches(false);
      onRecordAdded?.();
    } catch {
      toast.error("Помилка при додаванні запису");
    } finally {
      setIsSubmitting(false);
      setPendingSubmit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) {
      const missing: Record<string, boolean> = {};
      if (!formData.team1) missing.team1 = true;
      if (!formData.team2) missing.team2 = true;
      if (!formData.betType) missing.betType = true;
      if (!formData.selection) missing.selection = true;
      if (!formData.odds || parseFloat(formData.odds) <= 1) missing.odds = true;
      if (!formData.stake || parseFloat(formData.stake) <= 0)
        missing.stake = true;
      setSubmitErrors(missing);
      toast.error("Заповніть усі обов'язкові поля");
      return;
    }
    setSubmitErrors({});
    const betCurrency = (formData.currency as "UAH" | "USD") || "UAH";
    const needsInit =
      betCurrency === "UAH"
        ? !BankrollService.isInitialized(currentUser)
        : !BankrollService.isInitializedUSD(currentUser);
    if (needsInit) {
      const existingBets = UserDataService.getUserData<BetRecord[]>(
        currentUser,
        "mybets_data",
        [],
      );
      if (existingBets.length === 0) {
        const s = parseFloat(formData.stake);
        if (s > 0) {
          await BankrollService.setInitialBank(
            currentUser,
            s * 5,
            betCurrency,
            parseFloat(formData.exchangeRate) || 41.5,
          );
          toast.info(`Банк: ${s * 5} ${betCurrency === "USD" ? "$" : "₴"}`);
        }
      }
    }
    const stake = parseFloat(formData.stake);
    const bankData = BankrollService.getBankrollData(currentUser);
    if (stake > 0 && bankData) {
      const currBank =
        formData.currency === "USD"
          ? bankData.initialBankUSD || 0
          : bankData.initialBankUAH || 0;
      if (stake > currBank * 1.5 && currBank > 0)
        toast.warning(
          `Сума (${stake}) > банк (${currBank}) у ${(stake / currBank).toFixed(1)}×`,
        );
    }
    if (formData.betCategory === "Експрес" && expressEvents.length === 0) {
      toast.error("Додайте подію до експресу");
      return;
    }
    if (formData.betCategory === "Експрес") {
      const mo = expressEvents.filter(
        (e) => !e.odds || parseFloat(e.odds) <= 0,
      );
      if (mo.length > 0) {
        toast.error(`Заповніть коефіцієнти (${mo.length} без)`);
        return;
      }
    }
    if (strategyViolations.length > 0) {
      setShowViolationDialog(true);
      setPendingSubmit(true);
      return;
    }
    await processBetSubmission();
  };

  const handleViolationConfirm = async () => {
    setShowViolationDialog(false);
    await processBetSubmission();
  };
  const handleViolationCancel = () => {
    setShowViolationDialog(false);
    setPendingSubmit(false);
  };

  // ── Derived values ──
  const totalExpressOdds = calcTotalExpressOdds(expressEvents);
  const expressRisk = getExpressRiskLevel(expressEvents.length);
  const hasConfidence =
    formData.confidence !== "" && !isNaN(parseFloat(formData.confidence));
  const allExpressEventsComplete =
    expressEvents.length > 0 &&
    expressEvents.every(
      (e) => e.odds && parseFloat(e.odds) > 0 && e.selection && e.betType,
    );
  const formValid =
    formData.betCategory === "Експрес"
      ? !!(
          formData.stake &&
          parseFloat(formData.stake) > 0 &&
          allExpressEventsComplete
        )
      : !!(
          formData.team1 &&
          formData.team2 &&
          formData.betType &&
          formData.selection &&
          formData.odds &&
          parseFloat(formData.odds) > 1 &&
          formData.stake &&
          parseFloat(formData.stake) > 0
        );

  const {
    expectedValue,
    potentialProfit,
    evVerdict,
    valueBetAnalysis,
    kellyData,
    overconfidenceWarning,
  } = useMemo(() => {
    const ev = calcExpectedValue(
      formData.betCategory,
      expressEvents,
      formData.odds,
      formData.confidence,
    );
    const profit = calcPotentialProfit(
      formData.betCategory,
      expressEvents,
      formData.odds,
      formData.stake,
    );
    const verdict = getEVVerdict(parseFloat(ev));
    const value = getValueBetAnalysis(
      formData.betCategory,
      expressEvents,
      formData.odds,
      formData.confidence,
    );
    let kelly = null;
    if (hasConfidence) {
      const betsForKelly =
        apiBets.length > 0
          ? apiBets
          : UserDataService.getUserData<BetRecord[]>(
              currentUser,
              "mybets_data",
              [],
            );
      const bankrollStats = BankrollService.getBankrollStats(
        currentUser,
        apiBets as unknown as Bet[],
      );
      kelly = calcKellyCriterion(
        formData.betCategory,
        expressEvents,
        formData.odds,
        formData.confidence,
        bankrollStats.currentBank,
        maxStakePercent,
      );
    }
    let warning = null;
    if (hasConfidence)
      warning = getOverconfidenceWarning(
        formData.betCategory,
        expressEvents,
        formData.odds,
        formData.confidence,
      );
    return {
      expectedValue: ev,
      potentialProfit: profit,
      evVerdict: verdict,
      valueBetAnalysis: value,
      kellyData: kelly,
      overconfidenceWarning: warning,
    };
  }, [
    formData.betCategory,
    formData.odds,
    formData.stake,
    formData.confidence,
    expressEvents,
    currentUser,
    maxStakePercent,
    hasConfidence,
  ]);

  const isValuePositive = parseFloat(expectedValue) > 0;
  const isHighConfidence =
    hasConfidence && parseFloat(formData.confidence) > 90;

  // ── Tilt block ──
  const tiltBlock = useTiltBlock(currentUser, primaryStrategy, apiBets);

  return {
    // State
    formData,
    setFormData,
    expressEvents,
    isSubmitting,
    isParsingMatch,
    primaryStrategy,
    strategyViolations,
    activeGoals,
    showViolationDialog,
    pendingSubmit,
    submitErrors,
    isPrefilled,
    isExpressFromMatches,
    maxStakePercent,
    setMaxStakePercent,
    apiBets,
    // Refs
    prefillLogosRef,
    // Derived
    totalExpressOdds,
    expressRisk,
    hasConfidence,
    allExpressEventsComplete,
    formValid,
    expectedValue,
    potentialProfit,
    evVerdict,
    valueBetAnalysis,
    kellyData,
    overconfidenceWarning,
    isValuePositive,
    isHighConfidence,
    tiltBlock,
    // Handlers
    clearForm,
    getLastStakeForGoal,
    handleUrlChange,
    removeRiskyTeam,
    addExpressEvent,
    removeExpressEvent,
    clearExpressEvents,
    updateExpressEvent,
    handleConfidenceChange,
    applyKellyAmount,
    handleSubmit,
    handleViolationConfirm,
    handleViolationCancel,
    setShowViolationDialog,
    parseMatchFromUrl,
  };
}
