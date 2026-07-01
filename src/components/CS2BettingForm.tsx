import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  DollarSign,
  Link,
  AlertTriangle,
  X,
  Shield,
  Users,
  Info,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import { UserDataService } from "@/lib/userDataService";
import { BankrollService } from "@/lib/bankrollService";
import type { CS2Strategy } from "@/types/strategy";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getBetTypeOptions } from "@/lib/displayHelpers";
import {
  parseDota2MatchFromUrl,
  parseCS2MatchFromUrl,
} from "@/lib/matchUrlParser";
import StrategyViolationDialog from "./StrategyViolationDialog";
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
import { logRender } from "@/lib/devLogger";
import { BettingSidebar } from "./BettingSidebar";
import { ExpressEventBuilder } from "./ExpressEventBuilder";
import BettingFormAlerts from "./betting-form/BettingFormAlerts";
import BettingFormSettings from "./betting-form/BettingFormSettings";
import BettingFormMatchSection from "./betting-form/BettingFormMatchSection";
import BettingFormFinances from "./betting-form/BettingFormFinances";

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
}

interface CS2BettingFormProps {
  onRecordAdded?: () => void;
  prefillData?: MatchPrefillData | null;
  onPrefillConsumed?: () => void;
  expressMatchesData?: MatchPrefillData[] | null;
  onExpressMatchesConsumed?: () => void;
}

interface RiskyTeam {
  name: string;
  game: string;
  status: string;
  notes: string;
}

interface ExpressEvent {
  match: string;
  betType: string;
  selection: string;
  odds: string;
  logoTeam1?: string | null;
  logoTeam2?: string | null;
}

interface BetRecord {
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

interface StrategyViolation {
  type: "odds" | "format" | "betType";
  message: string;
  severity: "acceptable" | "serious";
  explanation: string;
}

interface Goal {
  id: string;
  name: string;
  type: "amount" | "ladder" | "roi" | "winrate";
  status: "active" | "completed" | "failed";
  currentStep?: number;
  startAmount?: number;
  targetLadderAmount?: number;
  steps?: { step: number; startAmount: number; status: string }[];
}

const MAX_CONFIDENCE = 95;
const DEFAULT_MAX_STAKE_PERCENT = 7;

const getDefaultFormData = (strategyName?: string, betCategory?: string) => ({
  date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
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
    return r || "44.60";
  })(),
  confidence: "",
  strategy: strategyName || "",
  reasoning: "",
  keyFactors: "",
  riskLevel: "",
  notes: "",
  goalId: "",
});

export default function CS2BettingForm({
  onRecordAdded,
  prefillData,
  onPrefillConsumed,
  expressMatchesData,
  onExpressMatchesConsumed,
}: CS2BettingFormProps) {
  logRender("CS2BettingForm");
  const { user } = useAuth();
  const currentUser = user?.username || "";
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

  const [formData, setFormData] = useState(() => {
    const initialCategory =
      expressMatchesData && expressMatchesData.length >= 2
        ? "Експрес"
        : "Ординар";
    return getDefaultFormData(undefined, initialCategory);
  });

  const [expressEvents, setExpressEvents] = useState<ExpressEvent[]>(() => {
    if (expressMatchesData && expressMatchesData.length >= 2) {
      return expressMatchesData.map((m) => ({
        match: `${m.team1} vs ${m.team2}`,
        betType: "Match Winner",
        selection: m.team1,
        odds: "",
        logoTeam1: m.logoTeam1,
        logoTeam2: m.logoTeam2,
      }));
    }
    return [];
  });

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

  // Load strategies from localStorage on mount
  useEffect(() => {
    const stored = UserDataService.getUserData<CS2Strategy[]>(currentUser, 'strategies', []);
    strategiesRef.current = stored;
  }, [currentUser]);

  useEffect(() => {
    UserDataService.setUserData(
      currentUser,
      "max_stake_percent",
      maxStakePercent,
    );
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

    const savedPrimaryStrategy =
      UserDataService.getUserData<string>(
        currentUser,
        "primary_strategy",
        "",
      ) ||
      localStorage.getItem("primaryStrategy") ||
      "";
    if (savedPrimaryStrategy) {
      const strategy = strategiesRef.current?.find(
        (s: CS2Strategy) => s.name === savedPrimaryStrategy || s.id === savedPrimaryStrategy
      );
      if (strategy) {
        setPrimaryStrategy(strategy);
        setFormData((prev) => ({ ...prev, strategy: strategy.name }));
      }
    }

    loadActiveGoals();
  }, []); // run once on mount only

  useEffect(() => {
    if (prefillData && !prefillConsumedRef.current) {
      prefillConsumedRef.current = true;
      prefillLogosRef.current = {
        logoTeam1: prefillData.logoTeam1,
        logoTeam2: prefillData.logoTeam2,
      };

      const formatMap: Record<string, string> = {
        Bo1: "BO1",
        Bo3: "BO3",
        Bo5: "BO5",
      };
      const mappedFormat =
        formatMap[prefillData.format] || prefillData.format || "BO3";

      setFormData((prev) => ({
        ...prev,
        team1: prefillData.team1 || "",
        team2: prefillData.team2 || "",
        tournament: prefillData.tournament || "",
        format: mappedFormat,
        date: prefillData.date ? prefillData.date.split("T")[0] : prev.date,
        matchUrl: prefillData.matchUrl || "",
        odds: prefillData.odds || "",
      }));
      setTimeout(() => {
        onPrefillConsumed?.();
      }, 0);
      toast.success("Дані матчу підставлено у форму");
    }

    if (!prefillData) {
      prefillConsumedRef.current = false;
    }
  }, [prefillData, onPrefillConsumed]);

  useEffect(() => {
    if (
      expressMatchesData &&
      expressMatchesData.length >= 2 &&
      !expressConsumedRef.current
    ) {
      expressConsumedRef.current = true;

      const prefilledEvents: ExpressEvent[] = expressMatchesData.map((m) => ({
        match: `${m.team1} vs ${m.team2}`,
        betType: "Match Winner",
        selection: m.team1,
        odds: "",
        logoTeam1: m.logoTeam1,
        logoTeam2: m.logoTeam2,
      }));

      setFormData((prev) => ({
        ...prev,
        betCategory: "Експрес",
      }));
      setExpressEvents(prefilledEvents);
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

    if (!expressMatchesData) {
      expressConsumedRef.current = false;
    }
  }, [expressMatchesData, onExpressMatchesConsumed]);

  const clearForm = () => {
    setFormData(getDefaultFormData(primaryStrategy?.name));
    setExpressEvents([]);
    setStrategyViolations([]);
    setIsPrefilled(false);
    setIsExpressFromMatches(false);
    toast.success("Форму очищено");
  };

  const loadActiveGoals = () => {
    const goals = UserDataService.getUserData(currentUser, "goals", []);
    const active = goals.filter((g: Goal) => g.status === "active");
    setActiveGoals(active);
    if (import.meta.env.DEV)
      console.log("Loaded active goals:", active.length, active);
  };

  const getLastStakeForGoal = (goalId: string): string => {
    try {
      // Read directly from localStorage to get full goal data (including steps)
      const allGoals = UserDataService.getUserData(currentUser, "goals", []);
      const goal = allGoals.find((g: Goal) => g.id === goalId);
      if (!goal) return "";

      // For ladder goals — calculate amount from current step
      if (goal.type === "ladder") {
        const steps = goal.steps;
        if (steps && steps.length > 0) {
          // currentStep is a 0-based array index into steps[]
          const idx = goal.currentStep ?? 0;
          if (idx < steps.length && steps[idx].startAmount > 0) {
            return String(Math.round(steps[idx].startAmount * 100) / 100);
          }
        }
        if (goal.startAmount && goal.startAmount > 0)
          return String(Math.round(goal.startAmount * 100) / 100);
        return "";
      }

      // For non-ladder goals — pull last bet amount from localStorage (not stale Google Sheets)
      const allRecords = UserDataService.getUserData<BetRecord[]>(currentUser, 'mybets_data', []);
      const goalRecords = allRecords
        .filter((r) => r.goalId === goalId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (goalRecords.length > 0) {
        const lastAmount =
          goalRecords[0].originalAmount ?? goalRecords[0].amount;
        if (lastAmount && lastAmount > 0)
          return String(Math.round(lastAmount * 100) / 100);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error getting last stake for goal:", error);
    }
    return "";
  };

  const validateAgainstStrategy = useCallback(() => {
    if (!primaryStrategy) {
      setStrategyViolations([]);
      return;
    }

    const violations: StrategyViolation[] = [];
    const currentOdds = parseFloat(formData.odds);

    if (formData.betCategory !== "Ординар") {
      setStrategyViolations([]);
      return;
    }

    if (
      currentOdds &&
      primaryStrategy.minOdds &&
      currentOdds < primaryStrategy.minOdds
    ) {
      const difference = primaryStrategy.minOdds - currentOdds;
      const severity = difference > 0.3 ? "serious" : "acceptable";
      violations.push({
        type: "odds",
        message: `Коефіцієнт ${currentOdds} нижче рекомендованого ${primaryStrategy.minOdds}`,
        severity,
        explanation:
          severity === "serious"
            ? "Низькі коефіцієнти зменшують потенційний прибуток та можуть не виправдати ризик."
            : "Незначне відхилення від стратегії. Переконайтесь у впевненості в прогнозі.",
      });
    }

    if (
      currentOdds &&
      primaryStrategy.maxOdds &&
      currentOdds > primaryStrategy.maxOdds
    ) {
      const difference = currentOdds - primaryStrategy.maxOdds;
      const severity = difference > 0.5 ? "serious" : "acceptable";
      violations.push({
        type: "odds",
        message: `Коефіцієнт ${currentOdds} вище рекомендованого ${primaryStrategy.maxOdds}`,
        severity,
        explanation:
          severity === "serious"
            ? "Високі коефіцієнти часто означають низьку ймовірність виграшу. Перевірте аналіз."
            : "Відхилення в межах допустимого. Переконайтесь у обґрунтованості вибору.",
      });
    }

    if (
      primaryStrategy.allowedFormats &&
      primaryStrategy.allowedFormats.length > 0
    ) {
      if (!primaryStrategy.allowedFormats.includes(formData.format)) {
        violations.push({
          type: "format",
          message: `Формат ${formData.format} не рекомендований. Рекомендовані: ${primaryStrategy.allowedFormats.join(", ")}`,
          severity: "acceptable",
          explanation:
            "Ваша стратегія оптимізована для інших форматів. Це може вплинути на результативність.",
        });
      }
    }

    if (
      primaryStrategy.allowedBetTypes &&
      primaryStrategy.allowedBetTypes.length > 0
    ) {
      if (!primaryStrategy.allowedBetTypes.includes(formData.betCategory)) {
        violations.push({
          type: "betType",
          message: `Тип прогнозу "${formData.betCategory}" не рекомендований. Рекомендовані: ${primaryStrategy.allowedBetTypes.join(", ")}`,
          severity: "serious",
          explanation:
            "Ваша стратегія розроблена для інших типів ставок. Це може значно знизити ефективність.",
        });
      }
    }

    setStrategyViolations(violations);
  }, [formData.odds, formData.format, formData.betCategory, primaryStrategy]);

  useEffect(() => {
    validateAgainstStrategy();
  }, [validateAgainstStrategy]);

  useEffect(() => {
    if (formData.team1 || formData.team2) {
      checkRiskyTeams(formData.team1, formData.team2, formData.game);
    }
  }, [formData.team1, formData.team2, formData.game]);

  useEffect(() => {
    if (expressEvents.length === 0) return;
    if (formData.team1 || formData.team2) return;

    const savedRiskyTeams = loadRiskyTeamsFromStorage();
    if (savedRiskyTeams.length === 0) return;

    const gameFilter = getGameFilterValue(formData.game);
    const riskyTeamsFound: RiskyTeam[] = [];
    const addedNames = new Set<string>();

    expressEvents.forEach((event) => {
      const teams = event.match.split(" vs ");
      const team1 = teams[0] || "";
      const team2 = teams[1] || "";
      const normalizedTeam1 = normalizeTeamName(team1);
      const normalizedTeam2 = normalizeTeamName(team2);

      savedRiskyTeams.forEach((riskyTeam: RiskyTeam) => {
        if (riskyTeam.game !== gameFilter) return;
        if (addedNames.has(riskyTeam.name)) return;

        const normalizedRiskyTeam = normalizeTeamName(riskyTeam.name);

        if (
          normalizedTeam1 === normalizedRiskyTeam ||
          normalizedTeam2 === normalizedRiskyTeam ||
          normalizedTeam1.includes(normalizedRiskyTeam) ||
          normalizedTeam2.includes(normalizedRiskyTeam)
        ) {
          riskyTeamsFound.push({
            name: riskyTeam.name,
            game: riskyTeam.game,
            status: riskyTeam.status,
            notes: riskyTeam.notes,
          });
          addedNames.add(riskyTeam.name);
        }
      });
    });

    if (riskyTeamsFound.length > 0) {
      setFormData((prev) => ({ ...prev, riskyTeams: riskyTeamsFound }));
    }
  }, [expressEvents, formData.game]);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedPrimaryStrategy = UserDataService.getUserData<string>(
        currentUser,
        "primary_strategy",
        "",
      );
      if (savedPrimaryStrategy) {
        const strategy = strategiesRef.current?.find(
      (s: CS2Strategy) => s.name === savedPrimaryStrategy || s.id === savedPrimaryStrategy
    );
        if (strategy) {
          setPrimaryStrategy(strategy);
          setFormData((prev) => ({ ...prev, strategy: strategy.name }));
        } else {
          setPrimaryStrategy(null);
          setFormData((prev) => ({ ...prev, strategy: "" }));
        }
      } else {
        setPrimaryStrategy(null);
        setFormData((prev) => ({ ...prev, strategy: "" }));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ── Pure utility functions (outside component, stable references) ──

  function loadRiskyTeamsFromStorage(): RiskyTeam[] {
    try {
      const saved = localStorage.getItem("admin_risky_teams");
      if (saved) {
        const savedTeams = JSON.parse(saved) as RiskyTeam[];
        return savedTeams.map((team: RiskyTeam) => ({
          name: team.name,
          game: team.game || "CS",
          status: team.status || "Обережно",
          notes: team.notes || "",
        }));
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error loading risky teams from storage:", error);
    }
    return [];
  }

  function normalizeTeamName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  function getGameFilterValue(formGame: "CS2" | "Dota2"): string {
    return formGame === "CS2" ? "CS" : "Dota";
  }

  const checkRiskyTeams = (
    team1: string,
    team2: string,
    currentGame: "CS2" | "Dota2",
  ) => {
    if (!team1 && !team2) {
      setFormData((prev) => ({ ...prev, riskyTeams: [] }));
      return;
    }

    const savedRiskyTeams = loadRiskyTeamsFromStorage();
    const riskyTeamsFound: RiskyTeam[] = [];

    const normalizedTeam1 = normalizeTeamName(team1);
    const normalizedTeam2 = normalizeTeamName(team2);
    const gameFilter = getGameFilterValue(currentGame);

    savedRiskyTeams.forEach((riskyTeam: RiskyTeam) => {
      if (riskyTeam.game !== gameFilter) return;

      const normalizedRiskyTeam = normalizeTeamName(riskyTeam.name);

      if (
        normalizedTeam1 === normalizedRiskyTeam ||
        normalizedTeam2 === normalizedRiskyTeam ||
        normalizedTeam1.includes(normalizedRiskyTeam) ||
        normalizedTeam2.includes(normalizedRiskyTeam)
      ) {
        riskyTeamsFound.push({
          name: riskyTeam.name,
          game: riskyTeam.game,
          status: riskyTeam.status,
          notes: riskyTeam.notes,
        });
      }
    });

    setFormData((prev) => ({
      ...prev,
      riskyTeams: riskyTeamsFound,
    }));
  };

  // parseDota2MatchFromUrl, parseCS2MatchFromUrl — imported from @/lib/matchUrlParser

  const parseMatchFromUrl = async (url: string) => {
    setIsParsingMatch(true);
    try {
      let result = null;

      if (url.includes("dota2")) {
        result = parseDota2MatchFromUrl(url);
        if (result) {
          const savedRiskyTeams = loadRiskyTeamsFromStorage();
          const riskyTeamsFound: RiskyTeam[] = [];

          const normalizedTeam1 = normalizeTeamName(result.team1);
          const normalizedTeam2 = normalizeTeamName(result.team2);
          const gameFilter = "Dota";

          savedRiskyTeams.forEach((riskyTeam: RiskyTeam) => {
            if (riskyTeam.game !== gameFilter) return;
            const normalizedRiskyTeam = normalizeTeamName(riskyTeam.name);
            if (
              normalizedTeam1 === normalizedRiskyTeam ||
              normalizedTeam2 === normalizedRiskyTeam ||
              normalizedTeam1.includes(normalizedRiskyTeam) ||
              normalizedTeam2.includes(normalizedRiskyTeam)
            ) {
              riskyTeamsFound.push({
                name: riskyTeam.name,
                game: riskyTeam.game,
                status: riskyTeam.status,
                notes: riskyTeam.notes,
              });
            }
          });

          setFormData((prev) => ({
            ...prev,
            game: "Dota2",
            team1: result.team1,
            team2: result.team2,
            tournament: result.tournament,
            riskyTeams: riskyTeamsFound,
          }));

          toast.success("Інформацію про Dota 2 матч успішно отримано!");
        } else {
          toast.error("Не вдалося розпарсити Dota 2 URL");
        }
      } else if (url.includes("hltv.org/matches/")) {
        result = parseCS2MatchFromUrl(url);
        if (result) {
          const savedRiskyTeams = loadRiskyTeamsFromStorage();
          const riskyTeamsFound: RiskyTeam[] = [];

          const normalizedTeam1 = normalizeTeamName(result.team1);
          const normalizedTeam2 = normalizeTeamName(result.team2);
          const gameFilter = "CS";

          savedRiskyTeams.forEach((riskyTeam: RiskyTeam) => {
            if (riskyTeam.game !== gameFilter) return;
            const normalizedRiskyTeam = normalizeTeamName(riskyTeam.name);
            if (
              normalizedTeam1 === normalizedRiskyTeam ||
              normalizedTeam2 === normalizedRiskyTeam ||
              normalizedTeam1.includes(normalizedRiskyTeam) ||
              normalizedTeam2.includes(normalizedRiskyTeam)
            ) {
              riskyTeamsFound.push({
                name: riskyTeam.name,
                game: riskyTeam.game,
                status: riskyTeam.status,
                notes: riskyTeam.notes,
              });
            }
          });

          setFormData((prev) => ({
            ...prev,
            game: "CS2",
            team1: result.team1,
            team2: result.team2,
            tournament: result.tournament,
            riskyTeams: riskyTeamsFound,
          }));

          toast.success("Інформацію про CS2 матч успішно отримано!");
        } else {
          toast.error('Не вдалося знайти "vs" у посиланні');
        }
      } else {
        toast.error("Невідомий формат URL. Підтримуються HLTV (CS2) та Dota 2");
      }
    } catch (error) {
      toast.error("Помилка при парсингу URL матчу");
      if (import.meta.env.DEV) console.error(error);
    } finally {
      setIsParsingMatch(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setFormData((prev) => ({ ...prev, matchUrl: url }));

    if (url.includes("hltv.org/matches/") || url.includes("dota2")) {
      parseMatchFromUrl(url);
    }
  };

  const removeRiskyTeam = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      riskyTeams: prev.riskyTeams.filter((_, i) => i !== index),
    }));
  };

  // getStatusBadge, getGameEmoji — imported from @/lib/displayHelpers

  const addExpressEvent = () => {
    if (expressEvents.length >= 10) {
      toast.error("Максимум 10 подій в експресі");
      return;
    }

    const missingFields = [];
    if (!formData.team1) missingFields.push("Команда 1");
    if (!formData.team2) missingFields.push("Команда 2");
    if (!formData.betType) missingFields.push("Тип прогнозу");
    if (!formData.selection) missingFields.push("Вибір");
    if (!formData.odds) missingFields.push("Коефіцієнт");

    if (missingFields.length > 0) {
      toast.error(`Заповніть наступні поля: ${missingFields.join(", ")}`);
      return;
    }

    const newEvent: ExpressEvent = {
      match: `${formData.team1} vs ${formData.team2}`,
      betType: formData.betType,
      selection: formData.selection,
      odds: formData.odds,
    };

    setExpressEvents([...expressEvents, newEvent]);

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

  const totalExpressOdds = calcTotalExpressOdds(expressEvents);
  const expressRisk = getExpressRiskLevel(expressEvents.length);

  const convertToUAH = (amount: number, currency: string, rate: number) => {
    if (currency === "USD") {
      return amount * rate;
    }
    return amount;
  };

  const updateExpressEvent = (
    index: number,
    field: keyof ExpressEvent,
    value: string,
  ) => {
    setExpressEvents((prev) =>
      prev.map((ev, i) => (i === index ? { ...ev, [field]: value } : ev)),
    );
  };

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
        const totalOdds = calcTotalExpressOdds(expressEvents);
        finalOdds = totalOdds;

        const eventsString = expressEvents
          .map(
            (event, index) =>
              `${index + 1}. ${event.match} | ${event.betType}: ${event.selection} @${event.odds}`,
          )
          .join(" • ");

        betTypeWithCategory = `Експрес ${expressEvents.length}x | ${eventsString}`;
        matchName = `Експрес ${expressEvents.length}x`;
      } else {
        betTypeWithCategory = `${formData.betType} - ${formData.selection}`;
        finalOdds = parseFloat(formData.odds);
        matchName = `${formData.team1} vs ${formData.team2}`;
      }

      let finalGoalId: string | undefined = undefined;
      if (
        formData.goalId &&
        formData.goalId !== "" &&
        formData.goalId !== "all"
      ) {
        finalGoalId = formData.goalId;
      }

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
        game: formData.game === "CS2" ? "CS2" : "Dota2",
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

      // 1. Save to API (primary store)
      try {
        await UserDataService.createBet({
          match: record.match,
          team1: record.team1,
          team2: record.team2,
          betType: record.betType,
          odds: record.odds,
          amount: record.amount,
          stake: parseFloat(formData.stake),
          date: record.date,
          result: record.result,
          profit: record.profit,
          strategy: record.strategy,
          format: record.format,
          game: record.game,
          currency: record.currency,
          originalAmount: record.originalAmount,
          exchangeRate: record.exchangeRate,
          roi: record.roi,
          goalId: record.goalId,
          matchUrl: record.matchUrl,
          winProbability: record.winProbability,
          notes: record.notes,
          riskyTeams: record.riskyTeams,
          tournament: record.tournament,
          logoTeam1: record.logoTeam1,
          logoTeam2: record.logoTeam2,
          expressLogos: record.expressLogos,
        } as Parameters<typeof UserDataService.createBet>[0]);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[API] Bet save failed, caching to localStorage:', err);
        const existingBets = UserDataService.getUserData<BetRecord[]>(currentUser, 'mybets_data', []);
        UserDataService.setUserData(currentUser, 'mybets_data', [record as BetRecord, ...existingBets]);
      }

      if (finalGoalId) {
        const goalName = activeGoals.find((g) => g.id === finalGoalId)?.name;
        toast.success(
          `✅ Запис створено та прив'язано до цілі "${goalName}". Переглянути можна на екрані "Останні записи".`,
        );
      } else {
        toast.success(
          'Ваш запис успішно створено! Переглянути його можна на екрані "Останні записи".',
        );
      }

      setFormData(getDefaultFormData(primaryStrategy?.name));

      setExpressEvents([]);
      setStrategyViolations([]);
      setIsPrefilled(false);
      setIsExpressFromMatches(false);

      onRecordAdded?.();
    } catch (error) {
      toast.error("Помилка при додаванні запису");
      if (import.meta.env.DEV) console.error(error);
    } finally {
      setIsSubmitting(false);
      setPendingSubmit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formValid) {
      toast.error("Заповніть усі обов'язкові поля (позначені *)");
      return;
    }

    if (!BankrollService.isInitialized(currentUser)) {
      toast.warning(
        '⚠️ Початковий банк не встановлено. Натисніть на картку "Поточний банк" щоб встановити.',
      );
    }

    if (formData.betCategory === "Експрес" && expressEvents.length === 0) {
      toast.error("Додайте хоча б одну подію до експресу");
      return;
    }

    if (formData.betCategory === "Експрес") {
      const missingOdds = expressEvents.filter(
        (e) => !e.odds || parseFloat(e.odds) <= 0,
      );
      if (missingOdds.length > 0) {
        toast.error(
          `Заповніть коефіцієнти для всіх подій експресу (${missingOdds.length} без коефіцієнта)`,
        );
        return;
      }
    }

    const bets = UserDataService.getUserData<BetRecord[]>(currentUser, 'mybets_data', []);
    const validation = BankrollService.validateBetAmount(
      currentUser,
      bets as unknown as Bet[],
      parseFloat(formData.stake),
    );

    if (validation.warning) {
      toast.warning(validation.warning);
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

  const handleConfidenceChange = (value: string) => {
    const numValue = parseFloat(value);
    if (value === "" || isNaN(numValue)) {
      setFormData((prev) => ({ ...prev, confidence: value }));
      return;
    }
    if (numValue > MAX_CONFIDENCE) {
      setFormData((prev) => ({ ...prev, confidence: String(MAX_CONFIDENCE) }));
      toast.warning(
        `⚠️ Максимальна впевненість обмежена до ${MAX_CONFIDENCE}%. У спорті 100% впевненість нереалістична.`,
      );
      return;
    }
    if (numValue < 1) {
      setFormData((prev) => ({ ...prev, confidence: "1" }));
      return;
    }
    setFormData((prev) => ({ ...prev, confidence: value }));
  };

  const applyKellyAmount = (amount: number) => {
    if (amount > 0) {
      setFormData((prev) => ({ ...prev, stake: String(amount) }));
      toast.success(`Суму змінено на ${amount} ₴ (рекомендація Келлі)`);
    }
  };

  const hasConfidence =
    formData.confidence !== "" && !isNaN(parseFloat(formData.confidence));

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
      const betsStore = UserDataService.getUserData<BetRecord[]>(currentUser, 'mybets_data', []);
      const bankrollStats = BankrollService.getBankrollStats(
        currentUser,
        betsStore as unknown as Bet[],
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
    if (hasConfidence) {
      warning = getOverconfidenceWarning(
        formData.betCategory,
        expressEvents,
        formData.odds,
        formData.confidence,
      );
    }

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
  const confidenceValue = parseFloat(formData.confidence);
  const isHighConfidence = hasConfidence && confidenceValue > 90;
  const potentialProfitInCurrency = potentialProfit;
  const stakeInCurrency = formData.stake;

  const getCurrencySymbol = () => {
    return "₴";
  };

  // getBetTypeOptions — imported from @/lib/displayHelpers (accepts game param)

  const inputClass =
    "rounded-2xl border-[#E5E7EB] bg-white h-11 text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#111827] focus:ring-0 transition-colors";
  const selectTriggerClass =
    "rounded-2xl border-[#E5E7EB] bg-white h-11 text-[#111827] focus:border-[#111827] focus:ring-0 transition-colors";
  const labelClass = "text-sm font-medium text-[#374151]";
  const sectionTitleClass =
    "text-base font-semibold text-[#111827] flex items-center gap-2.5 bg-[#F3F4F6] px-4 py-2.5 -mx-6";

  void potentialProfit;
  void stakeInCurrency;
  void pendingSubmit;

  // ── Tilt protection: block after N consecutive losses ──
  const tiltBlock = useMemo(() => {
    const blockKey = `tilt_block_${currentUser}`;
    const stored = localStorage.getItem(blockKey);
    if (stored) {
      try {
        const block = JSON.parse(stored) as { until: number; reason: string; strategyName?: string };
        if (Date.now() < block.until) {
          // Clear block if primary strategy was removed, disabled, or changed
          if (!primaryStrategy || !primaryStrategy.activityLimits?.enabled || (block.strategyName && block.strategyName !== primaryStrategy.name)) {
            localStorage.removeItem(blockKey);
          } else {
            return {
              blocked: true,
              reason: block.reason,
              minutesLeft: Math.ceil((block.until - Date.now()) / 60000),
            };
          }
        } else {
          // Block expired — remove
          localStorage.removeItem(blockKey);
        }
      } catch {
        localStorage.removeItem(blockKey);
      }
    }

    const blockAfter = primaryStrategy?.activityLimits?.enabled
      ? (primaryStrategy.activityLimits.blockAfterLosses ?? 3)
      : null;

    if (!blockAfter || blockAfter < 1)
      return { blocked: false, reason: "", minutesLeft: 0 };

    const allBets = UserDataService.getUserData<BetRecord[]>(currentUser, 'mybets_data', []);
    // Sort by date descending, count consecutive losses
    const sorted = [...allBets]
      .filter((b: BetRecord) => b.result === "Win" || b.result === "Loss")
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return (b.createdAt || dateB) - (a.createdAt || dateA);
      });

    let consecutiveLosses = 0;
    for (const bet of sorted) {
      if (bet.result === "Loss") consecutiveLosses++;
      else break;
    }

    if (consecutiveLosses >= blockAfter) {
      const blockMinutes =
        primaryStrategy?.activityLimits?.blockDurationMinutes ?? 60;
      const until = Date.now() + blockMinutes * 60000;
      const reason = `Ти програв ${consecutiveLosses} раз${consecutiveLosses === 1 ? "" : consecutiveLosses < 5 ? "и" : "ів"} поспіль. Зроби паузу на ${blockMinutes} хв — це допоможе уникнути тілт-ставок.`;
      localStorage.setItem(
        blockKey,
        JSON.stringify({ until, reason, strategyName: primaryStrategy?.name }),
      );
      return { blocked: true, reason, minutesLeft: blockMinutes };
    }

    return { blocked: false, reason: "", minutesLeft: 0 };
  }, [currentUser, primaryStrategy]);

  const allExpressEventsComplete =
    expressEvents.length > 0 &&
    expressEvents.every(
      (e) => e.odds && parseFloat(e.odds) > 0 && e.selection && e.betType,
    );

  const formValid =
    formData.betCategory === "Експрес"
      ? formData.stake && parseFloat(formData.stake) > 0 && allExpressEventsComplete
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

  return (
    <div className="space-y-6">
      <StrategyViolationDialog
        open={showViolationDialog}
        onOpenChange={setShowViolationDialog}
        strategyName={primaryStrategy?.name || ""}
        violations={strategyViolations}
        onConfirm={handleViolationConfirm}
        onCancel={handleViolationCancel}
      />

      <BettingFormAlerts
        tiltBlock={tiltBlock}
        primaryStrategy={primaryStrategy}
        strategyViolations={strategyViolations}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div
          className={`lg:col-span-2 space-y-6 ${tiltBlock.blocked ? "opacity-50 pointer-events-none select-none" : ""}`}
        >
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Main Form */}
            <div
              className="bg-white border border-gray-300 rounded-3xl overflow-hidden"
              style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
            >
              <BettingFormSettings
                data={{
                  date: formData.date,
                  game: formData.game,
                  betCategory: formData.betCategory,
                  format: formData.format,
                  goalId: formData.goalId,
                }}
                isPrefilled={isPrefilled}
                isExpressFromMatches={isExpressFromMatches}
                activeGoals={activeGoals}
                classes={{
                  input: inputClass,
                  selectTrigger: selectTriggerClass,
                  label: labelClass,
                  sectionTitle: sectionTitleClass,
                }}
                onClearForm={clearForm}
                onFieldChange={(field, value) =>
                  setFormData((prev) => ({ ...prev, [field]: value }))
                }
                onCategoryChange={(value) => {
                  setFormData((prev) => ({ ...prev, betCategory: value }));
                  if (value === "Ординар") {
                    setExpressEvents([]);
                    setIsExpressFromMatches(false);
                  }
                }}
                onGoalSelect={(goalId) => {
                  const selectedGoalId = goalId === "all" ? "" : goalId;
                  if (selectedGoalId) {
                    const lastStake = getLastStakeForGoal(selectedGoalId);
                    if (lastStake) {
                      setFormData((prev) => ({
                        ...prev,
                        goalId: selectedGoalId,
                        stake: lastStake,
                      }));
                      toast.info(
                        "Суму автоматично заповнено з останнього прогнозу цілі: " +
                          lastStake +
                          " ₴",
                      );
                      return;
                    }
                  }
                  setFormData((prev) => ({ ...prev, goalId: selectedGoalId }));
                }}
              />

              {!(isExpressFromMatches && expressEvents.length > 0) && (
                <>
                  <div className="border-t border-gray-100" />
                  <div className="px-6 pb-6">
                    <BettingFormMatchSection
                      data={{
                        game: formData.game,
                        format: formData.format,
                        betCategory: formData.betCategory,
                        matchUrl: formData.matchUrl,
                        team1: formData.team1,
                        team2: formData.team2,
                        betType: formData.betType,
                        selection: formData.selection,
                        odds: formData.odds,
                        logoTeam1: prefillLogosRef.current.logoTeam1,
                        logoTeam2: prefillLogosRef.current.logoTeam2,
                      }}
                      isParsing={isParsingMatch}
                      isExpressFromMatches={isExpressFromMatches}
                      expressEventsCount={expressEvents.length}
                      classes={{
                        input: inputClass,
                        selectTrigger: selectTriggerClass,
                        label: labelClass,
                        sectionTitle: sectionTitleClass,
                      }}
                      onFieldChange={(field, value) =>
                        setFormData((prev) => ({ ...prev, [field]: value }))
                      }
                      onParseUrl={() => parseMatchFromUrl(formData.matchUrl)}
                      onUrlChange={(url) => handleUrlChange(url)}
                      onAddToExpress={addExpressEvent}
                    />
                  </div>
                </>
              )}

              {(formData.betCategory === "Ординар" ||
                (formData.betCategory === "Експрес" &&
                  expressEvents.length > 0)) && (
                <div className="px-6 pb-6">
                  <BettingFormFinances
                    data={{
                      stake: formData.stake,
                      currency: formData.currency,
                      confidence: formData.confidence,
                    }}
                    isSubmitting={isSubmitting}
                    isBlocked={tiltBlock.blocked}
                    isHighConfidence={isHighConfidence}
                    showSection={true}
                    format={formData.format}
                    classes={{
                      input: inputClass,
                      label: labelClass,
                      sectionTitle: sectionTitleClass,
                    }}
                    onFieldChange={(field, value) =>
                      setFormData((prev) => ({ ...prev, [field]: value }))
                    }
                    onConfidenceChange={handleConfidenceChange}
                  />
                </div>
              )}
            </div>

            {/* Express Events Display */}
            {formData.betCategory === "Експрес" && expressEvents.length > 0 && (
              <ExpressEventBuilder
                expressEvents={expressEvents}
                totalExpressOdds={totalExpressOdds}
                expressRisk={expressRisk}
                allExpressEventsComplete={allExpressEventsComplete}
                game={formData.game}
                format={formData.format}
                onUpdateEvent={updateExpressEvent}
                onRemoveEvent={removeExpressEvent}
                onClearAll={clearExpressEvents}
              />
            )}

            {/* Submit Button */}
            {(formData.betCategory === "Ординар" ||
              (formData.betCategory === "Експрес" &&
                expressEvents.length > 0)) && (
              <Button
                type="submit" id="submit-btn"
                disabled={
                  isSubmitting ||
                  tiltBlock.blocked ||
                  (formData.betCategory === "Експрес" &&
                    !allExpressEventsComplete) ||
                  !formValid
                }
                className="w-full bg-[#111827] hover:bg-[#1F2937] text-white rounded-2xl font-medium py-7 text-base transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Додавання...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" strokeWidth={1.5} />
                    Додати запис
                  </>
                )}
              </Button>
            )}
          </form>
        </div>

        {/* Right Sidebar */}
        <BettingSidebar
          stake={formData.stake}
          odds={formData.odds}
          confidence={formData.confidence}
          betCategory={formData.betCategory}
          currency={formData.currency}
          totalExpressOdds={totalExpressOdds}
          expressEventsCount={expressEvents.length}
          potentialProfit={potentialProfit}
          potentialProfitInCurrency={potentialProfitInCurrency}
          expectedValue={expectedValue}
          evVerdict={evVerdict}
          isValuePositive={isValuePositive}
          valueBetAnalysis={valueBetAnalysis}
          kellyData={kellyData}
          overconfidenceWarning={overconfidenceWarning}
          hasConfidence={hasConfidence}
          isHighConfidence={isHighConfidence}
          riskyTeams={formData.riskyTeams}
          maxStakePercent={maxStakePercent}
          onMaxStakePercentChange={setMaxStakePercent}
          onApplyKellyAmount={applyKellyAmount}
          onRemoveRiskyTeam={removeRiskyTeam}
        />
      </div>
    </div>
  );
}
