import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { CS2Strategy } from "@/types/strategy";
import { api } from "@/lib/apiClient";
import {
  Target,
  TrendingUp,
  AlertTriangle,
  Plus,
  BarChart3,
  Trophy,
  Brain,
  Lightbulb,
  Trash2,
  Star,
  X,
  Zap,
  Percent,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Shield,
  ListChecks,
  Activity,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/appStore";
import { useAuth } from "@/contexts/AuthContext";
import { UserDataService } from "@/lib/userDataService";
import { logRender } from "@/lib/devLogger";
// Extracted sub-components
import StrategyTabNav from "@/components/strategy/StrategyTabNav";
import StrategyEmptyState from "@/components/strategy/StrategyEmptyState";
import StrategyLoadingSkeleton from "@/components/strategy/StrategyLoadingSkeleton";
import StrategyFilters from "@/components/strategy/StrategyFilters";
import StrategyCard from "@/components/strategy/StrategyCard";
import StrategyOverallStats from "@/components/strategy/StrategyOverallStats";
import StrategyTopRoiList from "@/components/strategy/StrategyTopRoiList";
import StrategyRecommendations from "@/components/strategy/StrategyRecommendations";
import StrategyPerformanceCharts from "@/components/strategy/StrategyPerformanceCharts";

interface BetData {
  strategy?: string;
  amount?: number;
  result?: string;
  profit?: number;
  date?: string;
  betType?: string;
  format?: string;
}

interface StrategyStats {
  totalBets: number;
  wins: number;
  losses: number;
  pending: number;
  totalProfit: number;
  totalStake: number;
  winRate: number;
  roi: number;
  profitHistory?: number[];
}

interface StrategyTemplate {
  name: string;
  description: string;
  riskLevel: "Low" | "Medium" | "High";
  expectedROI: number;
  criteria: string[];
}

const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    name: "Консервативна стратегія",
    description:
      "Безпечний підхід з низьким ризиком. Підходить для стабільного зростання банку.",
    riskLevel: "Low",
    expectedROI: 8,
    criteria: [
      "Мінімальний коефіцієнт 1.3",
      "Максимальний коефіцієнт 1.8",
      "Формат тільки BO3",
      "Тільки ординари",
      "Аналіз останніх 10 матчів команд",
    ],
  },
  {
    name: "Збалансована стратегія",
    description:
      "Оптимальне співвідношення ризику та прибутку. Універсальний підхід.",
    riskLevel: "Medium",
    expectedROI: 15,
    criteria: [
      "Мінімальний коефіцієнт 1.5",
      "Максимальний коефіцієнт 2.5",
      "Формат BO1 та BO3",
      "Експреси та ординари",
      "Розмір ставки 2-3% від банку",
    ],
  },
  {
    name: "Агресивна стратегія",
    description: "Високий ризик, високий прибуток. Для досвідчених гравців.",
    riskLevel: "High",
    expectedROI: 25,
    criteria: [
      "Мінімальний коефіцієнт 2.0",
      "Тільки експреси",
      "Формат BO1 та BO3",
      "Розмір ставки 5% від банку",
      "Фокус на андердогах",
    ],
  },
];

export default function StrategyOverview() {
  logRender("StrategyOverview");
  const { user } = useAuth();
  const currentUser =
    user?.username || localStorage.getItem("username") || "default";
  const [strategies, setStrategies] = useState<CS2Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [bettingData, setBettingData] = useState<BetData[]>([]);
  const [strategyStats, setStrategyStats] = useState<
    Record<string, StrategyStats>
  >({});
  const [primaryStrategy, setPrimaryStrategy] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [strategyToDelete, setStrategyToDelete] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<CS2Strategy | null>(
    null,
  );
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const bumpStrategy = useAppStore((s) => s.bumpStrategy);
  const [newlyCreatedStrategy, setNewlyCreatedStrategy] =
    useState<CS2Strategy | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isCriteriaOpen, setIsCriteriaOpen] = useState(true);
  const [isConstraintsOpen, setIsConstraintsOpen] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"roi" | "profit" | "name">("roi");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Helper to get primary strategy name from id (works with both UUIDs and legacy names)
  const getPrimaryStrategyName = (): string | null => {
    if (!primaryStrategy) return null;
    const found = strategies.find(
      (s) => s.id === primaryStrategy || s.name === primaryStrategy,
    );
    return found ? found.name : primaryStrategy;
  };

  // Helper to check if a template name already exists in strategies
  const isTemplateAlreadyCreated = (templateName: string): boolean => {
    return strategies.some(
      (s) => s.name.toLowerCase() === templateName.toLowerCase(),
    );
  };

  const [newStrategy, setNewStrategy] = useState({
    name: "",
    description: "",
    criteria: [""],
    riskLevel: "Medium" as "Low" | "Medium" | "High",
    expectedROI: 10,
    blockAfterLosses: 3,
    blockDurationMinutes: 60,
  });

  useEffect(() => {
    if (currentUser) loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Try API first (fast)
      let betsData: unknown[] = [];
      try {
        const json = await api.get<{ data?: unknown[] } | unknown[]>('/bets?page=1&limit=200');
        betsData = Array.isArray(json) ? json : (json as { data?: unknown[] }).data || [];
      } catch { /* fallback */ }

      // 2. Fallback to localStorage
      if (betsData.length === 0) {
        betsData = UserDataService.getUserData<Record<string, unknown>[]>(currentUser, 'mybets_data', []) as unknown[];
      }

      // 1. Load strategies — API first
      let customStrategies = loadCustomStrategiesFromStorage();
      try {
        const apiStrats = await UserDataService.fetchStrategies() as (Record<string, unknown> & { id?: string; config?: Record<string, unknown> })[];
        if (apiStrats && apiStrats.length > 0) {
          customStrategies = apiStrats.map(s => ({ id: s.id, ...(s.config || {}), _backendId: s.id })) as CS2Strategy[];
        }
      } catch { /* fallback to localStorage */ }
      setStrategies(customStrategies);
      setBettingData(betsData);
      calculateStrategyStats(betsData);

      const saved =
        UserDataService.getUserData<string>(currentUser, "primary_strategy", "") ||
        localStorage.getItem("primaryStrategy") || "";
      if (saved) {
        setPrimaryStrategy(saved);
        useAppStore.getState().setPrimaryStrategyId(saved);
      }
      useAppStore.getState().bumpStrategy();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomStrategiesFromStorage = (): CS2Strategy[] => {
    try {
      // Try user-scoped first
      const strategies = UserDataService.getUserData<CS2Strategy[]>(
        currentUser,
        "strategies_data",
        [],
      );
      if (strategies.length > 0) {
        let needsSave = false;
        const migrated = strategies.map((s: CS2Strategy) => {
          if (!s.id) {
            needsSave = true;
            return { ...s, id: crypto.randomUUID() };
          }
          return s;
        });
        if (needsSave) {
          UserDataService.setUserDataSync(
            currentUser,
            "strategies_data",
            migrated,
          );
          // Also migrate primary_strategy from name to UUID if needed
          const savedPrimary =
            UserDataService.getUserData<string>(
              currentUser,
              "primary_strategy",
              "",
            ) ||
            localStorage.getItem("primaryStrategy") ||
            "";
          if (savedPrimary) {
            const matched = migrated.find(
              (s: CS2Strategy) => s.name === savedPrimary,
            );
            if (matched && matched.id && matched.id !== savedPrimary) {
              UserDataService.setUserDataSync(
                currentUser,
                "primary_strategy",
                matched.id,
              );
              localStorage.setItem("primaryStrategy", matched.id);
            }
          }
        }
        return migrated;
      }
      // Fallback: old shared key (before v1.14.6)
      const saved = localStorage.getItem("customStrategies");
      if (saved) {
        const parsed = JSON.parse(saved);
        let needsSave = false;
        const migrated = parsed.map((s: CS2Strategy) => {
          if (!s.id) {
            needsSave = true;
            return { ...s, id: crypto.randomUUID() };
          }
          return s;
        });
        // Auto-migrate to user-scoped key (only if currentUser is set)
        if (currentUser) {
          UserDataService.setUserDataSync(
            currentUser,
            "strategies_data",
            migrated,
          );
          // Also migrate primary_strategy from name to UUID if needed
          if (needsSave) {
            const savedPrimary =
              UserDataService.getUserData<string>(
                currentUser,
                "primary_strategy",
                "",
              ) ||
              localStorage.getItem("primaryStrategy") ||
              "";
            if (savedPrimary) {
              const matched = migrated.find(
                (s: CS2Strategy) => s.name === savedPrimary,
              );
              if (matched && matched.id && matched.id !== savedPrimary) {
                UserDataService.setUserDataSync(
                  currentUser,
                  "primary_strategy",
                  matched.id,
                );
                localStorage.setItem("primaryStrategy", matched.id);
              }
            }
          }
        }
        return migrated;
      }
    } catch (error) {
      console.error("Error loading custom strategies:", error);
    }
    return [];
  };

  const saveCustomStrategiesToStorage = (strategies: CS2Strategy[]) => {
    try {
      if (currentUser) {
        UserDataService.setUserDataSync(currentUser, "strategies_data", strategies);
      }
      bumpStrategy();
    } catch (error) {
      console.error("Error saving custom strategies:", error);
    }
  };

  const calculateStrategyStats = (bets: BetData[]) => {
    const stats: Record<string, StrategyStats> = {};

    bets.forEach((bet) => {
      const strategy = bet.strategy || "Без стратегії";
      if (!stats[strategy]) {
        stats[strategy] = {
          totalBets: 0,
          wins: 0,
          losses: 0,
          pending: 0,
          totalProfit: 0,
          totalStake: 0,
          winRate: 0,
          roi: 0,
          profitHistory: [],
        };
      }

      stats[strategy].totalBets++;
      stats[strategy].totalStake += bet.amount || 0;

      if (bet.result === "Win") {
        stats[strategy].wins++;
        stats[strategy].totalProfit += bet.profit || 0;
      } else if (bet.result === "Loss") {
        stats[strategy].losses++;
        stats[strategy].totalProfit += bet.profit || 0;
      } else {
        stats[strategy].pending++;
      }

      stats[strategy].profitHistory?.push(stats[strategy].totalProfit);
    });

    Object.keys(stats).forEach((strategy) => {
      const completedBets = stats[strategy].wins + stats[strategy].losses;
      stats[strategy].winRate =
        completedBets > 0 ? (stats[strategy].wins / completedBets) * 100 : 0;
      stats[strategy].roi =
        stats[strategy].totalStake > 0
          ? (stats[strategy].totalProfit / stats[strategy].totalStake) * 100
          : 0;
    });

    setStrategyStats(stats);
  };

  const getRoiChartData = () => {
    return Object.entries(strategyStats)
      .map(([name, stats]) => {
        const strategy = strategies.find((s) => s.name === name);
        return {
          name: name.length > 15 ? name.substring(0, 15) + "..." : name,
          fullName: name,
          value: parseFloat(stats.roi.toFixed(1)),
          totalBets: stats.totalBets,
          riskLevel: strategy?.riskLevel || "Medium",
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const getWinRateChartData = () => {
    return Object.entries(strategyStats)
      .map(([name, stats]) => {
        const strategy = strategies.find((s) => s.name === name);
        return {
          name: name.length > 15 ? name.substring(0, 15) + "..." : name,
          fullName: name,
          value: parseFloat(stats.winRate.toFixed(1)),
          totalBets: stats.totalBets,
          riskLevel: strategy?.riskLevel || "Medium",
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const getProfitChartData = () => {
    return Object.entries(strategyStats)
      .map(([name, stats]) => {
        const strategy = strategies.find((s) => s.name === name);
        return {
          name: name.length > 15 ? name.substring(0, 15) + "..." : name,
          fullName: name,
          value: parseFloat(String(stats.totalProfit)).toFixed(0),
          totalBets: stats.totalBets,
          riskLevel: strategy?.riskLevel || "Medium",
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "bg-[#DCFCE7] text-[#16A34A] border-0 rounded-full";
      case "Medium":
        return "bg-[#FEF3C7] text-[#D97706] border-0 rounded-full";
      case "High":
        return "bg-[#FEE2E2] text-[#DC2626] border-0 rounded-full";
      default:
        return "bg-[#F3F4F6] text-[#6B7280] border-0 rounded-full";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "Low":
        return <Target className="h-4 w-4" strokeWidth={1.5} />;
      case "Medium":
        return <TrendingUp className="h-4 w-4" strokeWidth={1.5} />;
      case "High":
        return <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />;
      default:
        return <Target className="h-4 w-4" strokeWidth={1.5} />;
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case "Low":
        return "Низький";
      case "Medium":
        return "Середній";
      case "High":
        return "Високий";
      default:
        return risk;
    }
  };

  const addCriterion = () => {
    setNewStrategy((prev) => ({
      ...prev,
      criteria: [...prev.criteria, ""],
    }));
  };

  const updateCriterion = (index: number, value: string) => {
    setNewStrategy((prev) => ({
      ...prev,
      criteria: prev.criteria.map((c, i) => (i === index ? value : c)),
    }));
  };

  const removeCriterion = (index: number) => {
    setNewStrategy((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index),
    }));
  };

  const parseCriteriaForValidation = (
    criteria: string[],
  ): {
    minOdds?: number;
    maxOdds?: number;
    allowedFormats?: string[];
    allowedBetTypes?: string[];
  } => {
    const result: {
      minOdds?: number;
      maxOdds?: number;
      allowedFormats?: string[];
      allowedBetTypes?: string[];
    } = {};

    criteria.forEach((criterion) => {
      const lowerCriterion = criterion.toLowerCase();

      const minOddsMatch = lowerCriterion.match(
        /(?:мін|мінімальний|minimum|min).*?коеф.*?(\d+\.?\d*)/i,
      );
      if (minOddsMatch) {
        result.minOdds = parseFloat(minOddsMatch[1]);
      }

      const maxOddsMatch = lowerCriterion.match(
        /(?:макс|максимальний|maximum|max).*?коеф.*?(\d+\.?\d*)/i,
      );
      if (maxOddsMatch) {
        result.maxOdds = parseFloat(maxOddsMatch[1]);
      }

      const formatMatch = lowerCriterion.match(
        /формат.*?(bo[135](?:,?\s*(?:та|і|and|,)\s*bo[135])*)/i,
      );
      if (formatMatch) {
        const formats = formatMatch[1].toUpperCase().match(/BO[135]/g);
        if (formats) {
          result.allowedFormats = formats;
        }
      }

      if (
        lowerCriterion.includes("тільки експрес") ||
        lowerCriterion.includes("только экспресс")
      ) {
        result.allowedBetTypes = ["Експрес"];
      } else if (
        lowerCriterion.includes("тільки ординар") ||
        lowerCriterion.includes("только ординар")
      ) {
        result.allowedBetTypes = ["Ординар"];
      } else if (
        lowerCriterion.includes("тільки система") ||
        lowerCriterion.includes("только система")
      ) {
        result.allowedBetTypes = ["Система"];
      } else if (
        lowerCriterion.match(/експрес.*(?:та|і|and).*(?:система|ординар)/i) ||
        lowerCriterion.match(/(?:система|ординар).*(?:та|і|and).*експрес/i)
      ) {
        const betTypes: string[] = [];
        if (
          lowerCriterion.includes("експрес") ||
          lowerCriterion.includes("экспресс")
        )
          betTypes.push("Експрес");
        if (lowerCriterion.includes("ординар")) betTypes.push("Ординар");
        if (lowerCriterion.includes("система")) betTypes.push("Система");
        if (betTypes.length > 0) result.allowedBetTypes = betTypes;
      }
    });

    return result;
  };

  const saveStrategy = () => {
    if (!newStrategy.name || !newStrategy.description) {
      toast.error("Заповніть назву та опис стратегії");
      return;
    }

    const validCriteria = newStrategy.criteria.filter((c) => c.trim() !== "");
    if (validCriteria.length === 0) {
      toast.error("Додайте хоча б один критерій");
      return;
    }

    // Prevent duplicate strategy names
    const existingNames = strategies.map((s) => s.name.toLowerCase());
    if (existingNames.includes(newStrategy.name.toLowerCase().trim())) {
      toast.error("Стратегія з такою назвою вже існує. Оберіть іншу назву.");
      return;
    }

    const validationRules = parseCriteriaForValidation(validCriteria);

    const strategy: CS2Strategy = {
      id: crypto.randomUUID(),
      name: newStrategy.name,
      description: newStrategy.description,
      criteria: validCriteria,
      riskLevel: newStrategy.riskLevel,
      expectedROI: newStrategy.expectedROI,
      activityLimits: {
        enabled: true,
        blockAfterLosses: newStrategy.blockAfterLosses,
        blockDurationMinutes: newStrategy.blockDurationMinutes,
        actionMode: "block",
      },
      ...validationRules,
    };

    const customStrategies = loadCustomStrategiesFromStorage();
    if (customStrategies.length >= 25) {
      toast.error("Досягнуто ліміту стратегій", {
        description:
          "Максимум 25 стратегій. Видаліть непотрібні перед створенням нової.",
      });
      return;
    }
    customStrategies.push(strategy);
    saveCustomStrategiesToStorage(customStrategies);
    setStrategies((prev) => [...prev, strategy]);
    setNewlyCreatedStrategy(strategy);

    // Sync to backend API (async, don't block UI)
    UserDataService.createStrategy({
      name: strategy.name,
      isPrimary: false,
      config: strategy,
    }).then((backendStrategy: { id?: string }) => {
      if (backendStrategy?.id) {
        const all = loadCustomStrategiesFromStorage();
        const idx = all.findIndex(
          (s: CS2Strategy) => (s.id || s.name) === (strategy.id || strategy.name),
        );
        if (idx >= 0) {
          all[idx] = { ...all[idx], _backendId: backendStrategy.id };
          saveCustomStrategiesToStorage(all);
        }
      }
    }).catch((err: unknown) => {
      console.error('[API] Strategy save failed:', err);
      toast.error('Не вдалося зберегти стратегію на сервері. Дані збережено локально.');
    });

    setNewStrategy({
      name: "",
      description: "",
      criteria: [""],
      riskLevel: "Medium",
      expectedROI: 10,
      blockAfterLosses: 3,
      blockDurationMinutes: 60,
    });

    setSuccessDialogOpen(true);
    setActiveTab("overview");
  };

  const applyTemplate = (template: StrategyTemplate) => {
    // Don't apply if already created
    if (isTemplateAlreadyCreated(template.name)) return;

    setNewStrategy({
      name: template.name,
      description: template.description,
      criteria: [...template.criteria],
      riskLevel: template.riskLevel,
      expectedROI: template.expectedROI,
      blockAfterLosses: 3,
      blockDurationMinutes: 60,
    });
    setTemplateDialogOpen(false);
    toast.success(`Шаблон "${template.name}" застосовано!`);
  };

  const confirmDeleteStrategy = (strategyId: string) => {
    setStrategyToDelete(strategyId);
    setDeleteDialogOpen(true);
  };

  const deleteStrategy = () => {
    if (!strategyToDelete) return;

    const customStrategies = loadCustomStrategiesFromStorage();
    const strategyToRemove = customStrategies.find(s => (s.id || s.name) === strategyToDelete);
    const updatedStrategies = customStrategies.filter(
      (s) => (s.id || s.name) !== strategyToDelete,
    );
    saveCustomStrategiesToStorage(updatedStrategies);

    setStrategies(updatedStrategies);

    if (primaryStrategy === strategyToDelete) {
      setPrimaryStrategy(null);
      UserDataService.setUserDataSync(currentUser, "primary_strategy", "");
      localStorage.setItem("primaryStrategy", "");
    }

    toast.success("Стратегія успішно видалена!");
    setDeleteDialogOpen(false);
    setStrategyToDelete(null);
    // Sync to backend API (pass name as fallback for UUID mismatch)
    const backendId = strategyToRemove?._backendId || strategyToDelete;
    const strategyName = strategyToRemove?.name;
    UserDataService.deleteStrategy(backendId, strategyName).catch((err: unknown) => {
      console.warn('[API] Strategy delete failed:', err);
    });
  };

  const togglePrimaryStrategy = (strategy: CS2Strategy) => {
    const strategyId = strategy.id || strategy.name;
    const store = useAppStore.getState();
    if (primaryStrategy === strategyId) {
      setPrimaryStrategy(null);
      UserDataService.setUserDataSync(currentUser, "primary_strategy", "");
      localStorage.setItem("primaryStrategy", "");
      store.setPrimaryStrategyId("");
      toast.success("Основну стратегію скасовано");
    } else {
      setPrimaryStrategy(strategyId);
      UserDataService.setUserDataSync(
        currentUser,
        "primary_strategy",
        strategyId,
      );
      localStorage.setItem("primaryStrategy", strategyId);
      store.setPrimaryStrategyId(strategyId);
      toast.success(`"${strategy.name}" встановлено як основну стратегію!`);
    }
    bumpStrategy();
  };

  const openDetailsDialog = (strategy: CS2Strategy) => {
    setSelectedStrategy(strategy);
    setIsCriteriaOpen(true);
    setIsConstraintsOpen(true);
    setDetailsDialogOpen(true);
  };

  const generateDynamicRecommendations = () => {
    const recommendations: {
      type: "info" | "warning" | "success";
      message: string;
    }[] = [];

    Object.entries(strategyStats).forEach(([name, stats]) => {
      if (stats.roi < -5 && stats.totalBets > 5) {
        recommendations.push({
          type: "warning",
          message: `Стратегія "${name}" має ROI ${Number(stats.roi).toFixed(1)}%. Розгляньте можливість перегляду критеріїв.`,
        });
      }

      if (stats.roi > 10 && stats.totalBets > 10) {
        recommendations.push({
          type: "success",
          message: `Стратегія "${name}" показує відмінні результати (ROI ${Number(stats.roi).toFixed(1)}%). Продовжуйте використовувати!`,
        });
      }

      if (stats.winRate < 40 && stats.totalBets > 5) {
        recommendations.push({
          type: "warning",
          message: `Вінрейт стратегії "${name}" становить ${Number(stats.winRate).toFixed(1)}%. Можливо, варто знизити ризик.`,
        });
      }
    });

    if (primaryStrategy) {
      const primaryName = getPrimaryStrategyName();
      const primaryStats = primaryName ? strategyStats[primaryName] : undefined;
      if (primaryStats && primaryStats.totalBets === 0) {
        recommendations.push({
          type: "info",
          message: `Ви встановили "${getPrimaryStrategyName()}" як основну, але ще не використовували її. Спробуйте зробити першу ставку!`,
        });
      }
    }

    if (recommendations.length === 0) {
      recommendations.push(
        {
          type: "info",
          message:
            "Використовуйте стратегії з ROI більше 5% для стабільного зростання",
        },
        {
          type: "warning",
          message:
            "Уникайте ризикованих команд при використанні консервативних стратегій",
        },
        {
          type: "success",
          message: "Ведіть детальну статистику для покращення стратегій",
        },
      );
    }

    return recommendations.slice(0, 3);
  };

  const filteredAndSortedStrategies = strategies
    .filter((strategy) => {
      const matchesSearch = strategy.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesRisk =
        riskFilter === "all" || strategy.riskLevel === riskFilter;
      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => {
      const statsA = strategyStats[a.name];
      const statsB = strategyStats[b.name];

      let comparison = 0;
      if (sortBy === "roi") {
        comparison = (statsA?.roi || 0) - (statsB?.roi || 0);
      } else if (sortBy === "profit") {
        comparison = (statsA?.totalProfit || 0) - (statsB?.totalProfit || 0);
      } else {
        comparison = a.name.localeCompare(b.name);
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

  if (loading) {
    return <StrategyLoadingSkeleton />;
  }

  const roiChartData = getRoiChartData();
  const winRateChartData = getWinRateChartData();
  const profitChartData = getProfitChartData();

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Sub-tabs Navigation */}
        <StrategyTabNav
          activeTab={activeTab}
          showFilters={showFilters}
          onTabChange={setActiveTab}
          onFilterToggle={() => setShowFilters(!showFilters)}
          onCreateClick={() => setActiveTab("create")}
        />

        {/* Tab Content */}
        <div>
          {activeTab === "overview" && (
            <div className="space-y-6">
              {strategies.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                  <StrategyEmptyState
                    onCreateStrategy={() => setActiveTab("create")}
                  />
                </div>
              ) : (
                <>
                  {/* Filters and Search */}
                  {showFilters && (
                    <StrategyFilters
                      searchQuery={searchQuery}
                      riskFilter={riskFilter}
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSearchChange={setSearchQuery}
                      onRiskFilterChange={setRiskFilter}
                      onSortByChange={setSortBy}
                      onSortOrderToggle={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                    />
                  )}

                  {/* Strategy Cards — wrapped in a white container like GoalsManager */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredAndSortedStrategies.map((strategy, index) => {
                        const stats =
                          strategyStats[strategy.name] || ({} as StrategyStats);
                        const isPrimary =
                          primaryStrategy === (strategy.id || strategy.name);
                        return (
                          <StrategyCard
                            key={strategy.id || strategy.name || index}
                            strategy={strategy}
                            stats={stats}
                            isPrimary={isPrimary}
                            getRiskIcon={getRiskIcon}
                            getRiskColor={getRiskColor}
                            onDetails={openDetailsDialog}
                            onTogglePrimary={togglePrimaryStrategy}
                            onDelete={confirmDeleteStrategy}
                          />
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "performance" && (
            <div className="space-y-6">
              {/* Top Row - 3 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StrategyOverallStats
                  strategiesCount={strategies.length}
                  betsCount={bettingData.length}
                  bestStrategy={
                    Object.keys(strategyStats).length > 0
                      ? Object.keys(strategyStats).reduce(
                          (best, current) =>
                            (strategyStats[current]?.roi || 0) >
                            (strategyStats[best]?.roi || 0)
                              ? current
                              : best,
                          Object.keys(strategyStats)[0] || "Немає",
                        )
                      : "Немає"
                  }
                  primaryStrategyName={getPrimaryStrategyName()}
                />
                <StrategyTopRoiList
                  stats={strategyStats}
                  primaryStrategyName={getPrimaryStrategyName()}
                />
                <StrategyRecommendations
                  recommendations={generateDynamicRecommendations()}
                />
              </div>

              {/* Charts */}
              <StrategyPerformanceCharts
                roiData={roiChartData}
                winRateData={winRateChartData}
                profitData={profitChartData}
              />
            </div>
          )}

          {activeTab === "create" && (
            <div
              className="bg-white border border-[#F3F4F6] rounded-3xl overflow-hidden"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#F3F4F6]">
                <div className="flex items-center gap-3">
                  <Plus className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                  <span className="text-lg font-semibold text-[#111827]">
                    Створити нову стратегію
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => setTemplateDialogOpen(true)}
                  className="rounded-xl bg-[#447afc] hover:bg-[#3b6de0] text-white font-medium border-0"
                >
                  <Zap className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Використати шаблон
                </Button>
              </div>
              <div className="p-6 space-y-6">
                <div className="p-4 bg-[#EFF6FF] rounded-2xl border border-[#DBEAFE]">
                  <h4 className="font-semibold text-[#3B82F6] mb-2 flex items-center gap-2 text-sm">
                    <Lightbulb className="h-4 w-4" strokeWidth={1.5} />
                    Як додати обмеження до стратегії:
                  </h4>
                  <div className="space-y-2 text-sm text-[#3B82F6]">
                    <p>
                      •{" "}
                      <strong className="font-semibold">
                        Для обмеження коефіцієнтів:
                      </strong>{" "}
                      напишіть &quot;Мінімальний коефіцієнт 1.5&quot; або
                      &quot;Максимальний коефіцієнт 2.5&quot;
                    </p>
                    <p>
                      •{" "}
                      <strong className="font-semibold">
                        Для обмеження форматів:
                      </strong>{" "}
                      напишіть &quot;Формат тільки BO3&quot; або &quot;Формат
                      BO1 та BO3&quot;
                    </p>
                    <p>
                      •{" "}
                      <strong className="font-semibold">
                        Для обмеження типів ставок:
                      </strong>{" "}
                      напишіть &quot;Тільки експреси&quot;, &quot;Тільки
                      ординари&quot; або &quot;Експреси та системи&quot;
                    </p>
                    <p className="pt-2 text-xs text-[#3B82F6]/70">
                      Приклади критеріїв:
                    </p>
                    <ul className="list-disc list-inside text-xs text-[#3B82F6]/70 space-y-1 ml-2">
                      <li>&quot;Мінімальний коефіцієнт 1.3&quot;</li>
                      <li>&quot;Максимальний коефіцієнт 2.0&quot;</li>
                      <li>&quot;Формат тільки BO3&quot;</li>
                      <li>&quot;Тільки експреси&quot;</li>
                      <li>&quot;Аналіз останніх 10 матчів команд&quot;</li>
                    </ul>
                  </div>
                </div>

                {/* ── Tilt Protection Settings ── */}
                <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#E5E7EB]">
                      <Shield
                        className="h-4 w-4 text-[#6B7280]"
                        strokeWidth={2}
                      />
                    </div>
                    <h4 className="font-semibold text-[#6B7280] text-sm">
                      🔒 Тілт-захист (anti-tilt)
                    </h4>
                  </div>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">
                    Автоматично блокує форму ставки після N програшів поспіль,
                    щоб уникнути емоційних ставок.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="blockAfterLosses"
                        className="text-[#6B7280] font-medium text-sm"
                      >
                        Блокувати після програшів
                      </Label>
                      <Input
                        id="blockAfterLosses"
                        type="number"
                        min={1}
                        max={10}
                        value={newStrategy.blockAfterLosses}
                        onChange={(e) =>
                          setNewStrategy({
                            ...newStrategy,
                            blockAfterLosses: parseInt(e.target.value) || 3,
                          })
                        }
                        className="rounded-xl border-[#E5E7EB] bg-white mt-1.5"
                      />
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        К-сть програшів поспіль
                      </p>
                    </div>
                    <div>
                      <Label
                        htmlFor="blockDurationMinutes"
                        className="text-[#6B7280] font-medium text-sm"
                      >
                        Тривалість блокування
                      </Label>
                      <div className="relative mt-1.5">
                        <Input
                          id="blockDurationMinutes"
                          type="number"
                          min={15}
                          max={480}
                          step={15}
                          value={newStrategy.blockDurationMinutes}
                          onChange={(e) =>
                            setNewStrategy({
                              ...newStrategy,
                              blockDurationMinutes:
                                parseInt(e.target.value) || 60,
                            })
                          }
                          className="rounded-xl border-[#E5E7EB] bg-white pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9CA3AF]">
                          хв
                        </span>
                      </div>
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        Від 15 до 480 хв
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label
                      htmlFor="strategyName"
                      className="text-[#111827] font-medium"
                    >
                      Назва стратегії *
                    </Label>
                    <Input
                      id="strategyName"
                      value={newStrategy.name}
                      onChange={(e) =>
                        setNewStrategy({ ...newStrategy, name: e.target.value })
                      }
                      placeholder="Наприклад: Консервативна стратегія"
                      className="rounded-xl border-[#E5E7EB] mt-1.5"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="riskLevel"
                      className="text-[#111827] font-medium"
                    >
                      Рівень ризику *
                    </Label>
                    <Select
                      value={newStrategy.riskLevel}
                      onValueChange={(value: "Low" | "Medium" | "High") =>
                        setNewStrategy({ ...newStrategy, riskLevel: value })
                      }
                    >
                      <SelectTrigger className="rounded-xl border-[#E5E7EB] mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Низький</SelectItem>
                        <SelectItem value="Medium">Середній</SelectItem>
                        <SelectItem value="High">Високий</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label
                      htmlFor="expectedROI"
                      className="text-[#111827] font-medium"
                    >
                      Очікуваний ROI (%) *
                    </Label>
                    <Input
                      id="expectedROI"
                      type="number"
                      min="0"
                      max="100"
                      value={newStrategy.expectedROI}
                      onChange={(e) =>
                        setNewStrategy({
                          ...newStrategy,
                          expectedROI: parseInt(e.target.value) || 0,
                        })
                      }
                      className="rounded-xl border-[#E5E7EB] mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="description"
                    className="text-[#111827] font-medium"
                  >
                    Опис стратегії *
                  </Label>
                  <Textarea
                    id="description"
                    value={newStrategy.description}
                    onChange={(e) =>
                      setNewStrategy({
                        ...newStrategy,
                        description: e.target.value,
                      })
                    }
                    placeholder="Детальний опис стратегії, коли її використовувати..."
                    rows={3}
                    className="rounded-xl border-[#E5E7EB] mt-1.5"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-[#111827] font-medium">
                      Критерії стратегії *
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCriterion}
                      className="rounded-xl bg-[#EFF6FF] border-[#DBEAFE] font-medium text-[#3B82F6] hover:bg-[#DBEAFE]"
                    >
                      <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
                      Додати критерій
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {newStrategy.criteria.map((criterion, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={criterion}
                          onChange={(e) =>
                            updateCriterion(index, e.target.value)
                          }
                          placeholder={
                            index === 0
                              ? "Наприклад: Мінімальний коефіцієнт 1.5"
                              : `Критерій ${index + 1}`
                          }
                          className="rounded-xl border-[#E5E7EB]"
                        />
                        {newStrategy.criteria.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCriterion(index)}
                            className="rounded-xl border-[#E5E7EB]"
                          >
                            <X className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={saveStrategy}
                  className="w-full rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white font-medium h-11"
                >
                  <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Зберегти стратегію
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="rounded-3xl max-w-2xl border border-[#E5E7EB] gap-0">
          <DialogHeader>
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="relative">
                <div className="absolute inset-0 bg-[#22C55E] rounded-full blur-xl opacity-30 animate-pulse"></div>
                <div className="relative p-4 bg-[#DCFCE7] rounded-full">
                  <CheckCircle2
                    className="h-12 w-12 text-[#16A34A]"
                    strokeWidth={2}
                  />
                </div>
              </div>
              <DialogTitle className="text-2xl font-semibold text-[#111827] flex items-center gap-2">
                <Sparkles
                  className="h-6 w-6 text-[#F59E0B]"
                  strokeWidth={1.5}
                />
                Вітаємо! Стратегію успішно створено!
                <Sparkles
                  className="h-6 w-6 text-[#F59E0B]"
                  strokeWidth={1.5}
                />
              </DialogTitle>
              <DialogDescription className="text-[#6B7280] text-base">
                Ваша нова стратегія готова до використання
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="border-t border-gray-100 -mx-6" />

          {newlyCreatedStrategy && (
            <div className="space-y-4 py-4 bg-[#F3F4F6] -mx-6 px-6">
              <div className="p-6 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#EFF6FF] rounded-xl">
                    {getRiskIcon(newlyCreatedStrategy.riskLevel)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#111827]">
                      {newlyCreatedStrategy.name}
                    </h3>
                    <p className="text-sm text-[#6B7280] mt-0.5">
                      {newlyCreatedStrategy.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#DCFCE7] rounded-2xl border border-[#BBF7D0] shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent
                      className="h-4 w-4 text-[#16A34A]"
                      strokeWidth={1.5}
                    />
                    <span className="text-sm font-medium text-[#16A34A]">
                      Очікуваний ROI
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[#16A34A]">
                    +{newlyCreatedStrategy.expectedROI}%
                  </div>
                </div>
                <div className="p-4 bg-[#EFF6FF] rounded-2xl border border-[#BFDBFE] shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Target
                      className="h-4 w-4 text-[#3B82F6]"
                      strokeWidth={1.5}
                    />
                    <span className="text-sm font-medium text-[#3B82F6]">
                      Критеріїв
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[#3B82F6]">
                    {newlyCreatedStrategy.criteria.length}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-[#111827]">
                  <Lightbulb
                    className="h-4 w-4 text-[#F59E0B]"
                    strokeWidth={1.5}
                  />
                  Критерії стратегії:
                </h4>
                <ul className="space-y-2">
                  {newlyCreatedStrategy.criteria.map((criterion, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-[#6B7280] flex items-start gap-2"
                    >
                      <div className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tilt Protection — shown if strategy has activityLimits */}
              {newlyCreatedStrategy.activityLimits?.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#FEF2F2] rounded-2xl border border-[#FECACA] shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield
                        className="h-4 w-4 text-[#DC2626]"
                        strokeWidth={1.5}
                      />
                      <span className="text-sm font-medium text-[#DC2626]">
                        🔒 Блокування після
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-[#DC2626]">
                      {newlyCreatedStrategy.activityLimits.blockAfterLosses}{" "}
                      програшів
                    </div>
                    <p className="text-xs text-[#B91C1C] mt-1">поспіль</p>
                  </div>
                  <div className="p-4 bg-[#FEF2F2] rounded-2xl border border-[#FECACA] shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield
                        className="h-4 w-4 text-[#DC2626]"
                        strokeWidth={1.5}
                      />
                      <span className="text-sm font-medium text-[#DC2626]">
                        Пауза
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-[#DC2626]">
                      {newlyCreatedStrategy.activityLimits
                        .blockDurationMinutes ?? 60}{" "}
                      хв
                    </div>
                    <p className="text-xs text-[#B91C1C] mt-1">
                      без можливості додавати ставки
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4 bg-[#EFF6FF] rounded-2xl border border-[#BFDBFE] shadow-sm">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-[#3B82F6] text-sm">
                  <Info className="h-4 w-4" strokeWidth={1.5} />
                  Наступні кроки:
                </h4>
                <ul className="space-y-1 text-sm text-[#3B82F6]">
                  <li>
                    • Встановіть цю стратегію як основну, натиснувши на зірочку
                  </li>
                  <li>
                    • Почніть використовувати її при створенні нових ставок
                  </li>
                  <li>
                    • Відстежуйте результати на вкладці &quot;Ефективність&quot;
                  </li>
                </ul>
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 -mx-6 mb-4" />

          <DialogFooter className="gap-2">
            <Button
              onClick={() => {
                setSuccessDialogOpen(false);
                setNewlyCreatedStrategy(null);
              }}
              className="flex-1 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white font-medium"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Чудово, зрозуміло!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== ENHANCED Details Dialog ===== */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto border border-[#E5E7EB] rounded-3xl bg-white p-0 gap-0"
          style={{
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 border-2 border-[#3B82F6] bg-[#EFF6FF] rounded-2xl flex-shrink-0">
                <Brain className="h-6 w-6 text-[#3B82F6]" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#111827] tracking-tight">
                  Деталі стратегії
                </h2>
                {selectedStrategy && (
                  <p className="text-sm text-[#6B7280] mt-0.5">
                    {selectedStrategy.criteria.length}{" "}
                    {selectedStrategy.criteria.length === 1
                      ? "критерій"
                      : selectedStrategy.criteria.length < 5
                        ? "критерії"
                        : "критеріїв"}{" "}
                    • Ризик: {getRiskLabel(selectedStrategy.riskLevel)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="border-b border-[#E5E7EB]" />

          {selectedStrategy && (
            <div className="space-y-6 px-6 py-6 bg-[#F3F4F6]">
              {/* Strategy Name & Description Card */}
              <div
                className="p-5 bg-white rounded-3xl border border-[#F3F4F6] hover:border-[#D1D5DB] transition-colors duration-300"
                style={{
                  boxShadow:
                    "0 4px 24px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF] border-2 border-[#3B82F6] text-[#3B82F6] flex-shrink-0">
                        {getRiskIcon(selectedStrategy.riskLevel)}
                      </div>
                      <h3 className="text-xl font-semibold text-[#111827]">
                        {selectedStrategy.name}
                      </h3>
                      {primaryStrategy ===
                        (selectedStrategy.id || selectedStrategy.name) && (
                        <Badge className="bg-[#EFF6FF] text-[#3B82F6] border-0 rounded-full text-xs px-2.5 py-0.5 font-medium hover:bg-[#EFF6FF]">
                          <Star
                            className="h-3 w-3 mr-1 fill-[#3B82F6]"
                            strokeWidth={1.5}
                          />
                          Основна
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#6B7280] leading-relaxed">
                      {selectedStrategy.description}
                    </p>
                  </div>
                  <Badge
                    className={
                      getRiskColor(selectedStrategy.riskLevel) +
                      " text-sm px-3 py-1 font-medium hover:opacity-100 flex-shrink-0"
                    }
                  >
                    {selectedStrategy.riskLevel}
                  </Badge>
                </div>
              </div>

              {/* Summary Stats Cards */}
              {(() => {
                const stats = strategyStats[selectedStrategy.name];
                const hasStats = stats && stats.totalBets > 0;
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-5 bg-white rounded-2xl border border-[#F3F4F6] hover:border-[#D1D5DB] transition-colors duration-300 text-center shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
                      <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">
                        Всього ставок
                      </p>
                      <p className="text-3xl font-semibold text-[#111827]">
                        {hasStats ? stats.totalBets : 0}
                      </p>
                    </div>
                    <div className="p-5 bg-white rounded-2xl border border-[#F3F4F6] hover:border-[#D1D5DB] transition-colors duration-300 text-center shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
                      <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">
                        Вінрейт
                      </p>
                      <p
                        className={`text-3xl font-semibold ${hasStats && stats.winRate >= 50 ? "text-[#22C55E]" : hasStats ? "text-[#EF4444]" : "text-[#111827]"}`}
                      >
                        {hasStats ? Number(stats.winRate).toFixed(1) : 0}%
                      </p>
                    </div>
                    <div className="p-5 bg-white rounded-2xl border border-[#F3F4F6] hover:border-[#D1D5DB] transition-colors duration-300 text-center shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
                      <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">
                        ROI
                      </p>
                      <p
                        className={`text-3xl font-semibold ${hasStats && stats.roi >= 0 ? "text-[#22C55E]" : hasStats ? "text-[#EF4444]" : "text-[#111827]"}`}
                      >
                        {hasStats
                          ? `${Number(stats.roi) >= 0 ? "+" : ""}${Number(stats.roi).toFixed(1)}`
                          : "0"}
                        %
                      </p>
                    </div>
                    <div className="p-5 bg-white rounded-2xl border border-[#F3F4F6] hover:border-[#D1D5DB] transition-colors duration-300 text-center shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
                      <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">
                        Прибуток
                      </p>
                      <p
                        className={`text-3xl font-semibold ${hasStats && Number(stats.totalProfit) >= 0 ? "text-[#16A34A]" : hasStats ? "text-[#EF4444]" : "text-[#111827]"}`}
                      >
                        {hasStats
                          ? `${Number(stats.totalProfit) >= 0 ? "+" : ""}${Number(stats.totalProfit).toFixed(0)}`
                          : "0"}
                        ₴
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Win/Loss/Pending Breakdown */}
              {(() => {
                const stats = strategyStats[selectedStrategy.name];
                if (!stats || stats.totalBets === 0) return null;
                return (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-3xl border border-[#F3F4F6] hover:border-[#D1D5DB] transition-colors duration-300 text-center shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#DCFCE7] mx-auto mb-2">
                        <CheckCircle2
                          className="h-5 w-5 text-[#16A34A]"
                          strokeWidth={1.5}
                        />
                      </div>
                      <p className="text-2xl font-semibold text-[#16A34A]">
                        {stats.wins}
                      </p>
                      <p className="text-xs text-[#6B7280] font-medium mt-1">
                        Перемог
                      </p>
                    </div>
                    <div className="p-4 bg-white rounded-3xl border border-[#F3F4F6] hover:border-[#D1D5DB] transition-colors duration-300 text-center shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#FEE2E2] mx-auto mb-2">
                        <X
                          className="h-5 w-5 text-[#EF4444]"
                          strokeWidth={1.5}
                        />
                      </div>
                      <p className="text-2xl font-semibold text-[#EF4444]">
                        {stats.losses}
                      </p>
                      <p className="text-xs text-[#6B7280] font-medium mt-1">
                        Поразок
                      </p>
                    </div>
                    <div className="p-4 bg-white rounded-3xl border border-[#F3F4F6] hover:border-[#D1D5DB] transition-colors duration-300 text-center shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#FEF3C7] mx-auto mb-2">
                        <Activity
                          className="h-5 w-5 text-[#D97706]"
                          strokeWidth={1.5}
                        />
                      </div>
                      <p className="text-2xl font-semibold text-[#D97706]">
                        {stats.pending}
                      </p>
                      <p className="text-xs text-[#6B7280] font-medium mt-1">
                        Очікується
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Constraints Section - Collapsible */}
              {(selectedStrategy.maxOdds ||
                selectedStrategy.minOdds ||
                selectedStrategy.allowedFormats ||
                selectedStrategy.allowedBetTypes) && (
                <Collapsible
                  open={isConstraintsOpen}
                  onOpenChange={setIsConstraintsOpen}
                  className="bg-white rounded-3xl border border-[#F3F4F6] hover:border-[#D1D5DB] transition-colors duration-300 overflow-hidden"
                  style={{
                    boxShadow:
                      "0 4px 24px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between px-6 py-4 hover:bg-[#F3F4F6] transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF] border-2 border-[#3B82F6]">
                          <Shield
                            className="h-4 w-4 text-[#3B82F6]"
                            strokeWidth={1.5}
                          />
                        </div>
                        <h3 className="text-base font-semibold text-[#111827]">
                          Обмеження стратегії
                        </h3>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-[#6B7280] transition-transform duration-200 ${isConstraintsOpen ? "rotate-180" : ""}`}
                        strokeWidth={1.5}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 pt-2">
                      {selectedStrategy.minOdds && (
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                          <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wider mb-1">
                            Мінімальний коефіцієнт
                          </p>
                          <p className="text-xl font-semibold text-[#111827]">
                            {selectedStrategy.minOdds}
                          </p>
                        </div>
                      )}
                      {selectedStrategy.maxOdds && (
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                          <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wider mb-1">
                            Максимальний коефіцієнт
                          </p>
                          <p className="text-xl font-semibold text-[#111827]">
                            {selectedStrategy.maxOdds}
                          </p>
                        </div>
                      )}
                      {selectedStrategy.allowedFormats &&
                        selectedStrategy.allowedFormats.length > 0 && (
                          <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                            <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wider mb-2">
                              Дозволені формати
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedStrategy.allowedFormats.map(
                                (format, idx) => (
                                  <Badge
                                    key={idx}
                                    className="rounded-xl bg-[#111827] text-white border-0 font-medium text-sm px-3 py-1 hover:bg-[#111827]"
                                  >
                                    {format}
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      {selectedStrategy.allowedBetTypes &&
                        selectedStrategy.allowedBetTypes.length > 0 && (
                          <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                            <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wider mb-2">
                              Дозволені типи ставок
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedStrategy.allowedBetTypes.map(
                                (betType, idx) => (
                                  <Badge
                                    key={idx}
                                    className="rounded-xl bg-[#F9FAFB] text-[#111827] border border-[#E5E7EB] font-medium text-sm px-3 py-1 hover:bg-[#F9FAFB]"
                                  >
                                    {betType}
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Tilt Protection — shown if strategy has activityLimits */}
              {selectedStrategy.activityLimits?.enabled &&
                (selectedStrategy.activityLimits.blockAfterLosses ||
                  selectedStrategy.activityLimits.blockDurationMinutes) && (
                  <Collapsible
                    open={true}
                    className="bg-white rounded-3xl border border-[#F3F4F6] hover:border-[#D1D5DB] transition-colors duration-300 overflow-hidden"
                    style={{
                      boxShadow:
                        "0 4px 24px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#FEF2F2] border-2 border-[#EF4444]">
                          <Shield
                            className="h-4 w-4 text-[#EF4444]"
                            strokeWidth={1.5}
                          />
                        </div>
                        <h3 className="text-base font-semibold text-[#111827]">
                          🔒 Тілт-захист
                        </h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 px-6 pb-6">
                      {selectedStrategy.activityLimits.blockAfterLosses && (
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                          <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wider mb-1">
                            Блокування після
                          </p>
                          <p className="text-xl font-semibold text-[#111827]">
                            {selectedStrategy.activityLimits.blockAfterLosses}{" "}
                            програшів
                          </p>
                          <p className="text-xs text-[#9CA3AF] mt-1">поспіль</p>
                        </div>
                      )}
                      {(selectedStrategy.activityLimits.blockDurationMinutes ??
                        60) > 0 && (
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                          <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wider mb-1">
                            Тривалість паузи
                          </p>
                          <p className="text-xl font-semibold text-[#111827]">
                            {selectedStrategy.activityLimits
                              .blockDurationMinutes ?? 60}{" "}
                            хв
                          </p>
                          <p className="text-xs text-[#9CA3AF] mt-1">
                            без можливості додавати ставки
                          </p>
                        </div>
                      )}
                    </div>
                  </Collapsible>
                )}

              {/* Criteria Section - Collapsible */}
              <Collapsible
                open={isCriteriaOpen}
                onOpenChange={setIsCriteriaOpen}
                className="bg-white rounded-3xl border border-[#F3F4F6] hover:border-[#D1D5DB] transition-colors duration-300 overflow-hidden"
                style={{
                  boxShadow:
                    "0 4px 24px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-6 py-4 hover:bg-[#F3F4F6] transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF] border-2 border-[#3B82F6]">
                        <ListChecks
                          className="h-4 w-4 text-[#3B82F6]"
                          strokeWidth={1.5}
                        />
                      </div>
                      <h3 className="text-base font-semibold text-[#111827]">
                        Критерії стратегії
                      </h3>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-[#6B7280] transition-transform duration-200 ${isCriteriaOpen ? "rotate-180" : ""}`}
                      strokeWidth={1.5}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 pt-2">
                    {selectedStrategy.criteria.map((criterion, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] hover:border-[#D1D5DB] transition-all"
                        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                      >
                        <div className="flex items-start gap-3">
                          <Badge className="rounded-xl bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB] font-medium text-sm px-3 py-1 hover:bg-[#F3F4F6] flex-shrink-0">
                            #{idx + 1}
                          </Badge>
                          <p className="text-sm text-[#6B7280] font-medium leading-relaxed">
                            {criterion}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Expected ROI */}
              <div
                className="p-5 bg-white rounded-3xl border border-[#F3F4F6] hover:border-[#D1D5DB] transition-colors duration-300"
                style={{
                  boxShadow:
                    "0 4px 24px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#F0FDF4] border-2 border-[#22C55E]">
                      <Percent
                        className="h-5 w-5 text-[#16A34A]"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                        Очікуваний ROI
                      </p>
                      <p className="text-2xl font-semibold text-[#16A34A]">
                        +{selectedStrategy.expectedROI}%
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={
                      getRiskColor(selectedStrategy.riskLevel) +
                      " text-sm px-3 py-1 font-medium hover:opacity-100"
                    }
                  >
                    Ризик: {getRiskLabel(selectedStrategy.riskLevel)}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="rounded-3xl max-w-4xl max-h-[80vh] overflow-y-auto border border-[#E5E7EB]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-[#111827]">
              <Zap className="h-5 w-5 text-[#F59E0B]" strokeWidth={1.5} />
              Шаблони стратегій
            </DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              Виберіть готовий шаблон для швидкого створення стратегії
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STRATEGY_TEMPLATES.map((template, index) => {
              const alreadyExists = isTemplateAlreadyCreated(template.name);
              return (
                <div
                  key={index}
                  className={`border transition-all rounded-2xl p-5 ${
                    alreadyExists
                      ? "bg-[#F9FAFB] border-[#E5E7EB] opacity-60 cursor-not-allowed"
                      : "bg-white border-[#E5E7EB] hover:border-[#D1D5DB] cursor-pointer"
                  }`}
                  onClick={() => !alreadyExists && applyTemplate(template)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-2 font-semibold text-[#111827]">
                      {getRiskIcon(template.riskLevel)}
                      <span className="text-sm">{template.name}</span>
                    </span>
                    <Badge
                      className={
                        getRiskColor(template.riskLevel) +
                        " text-xs font-medium hover:opacity-100"
                      }
                    >
                      {template.riskLevel}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#6B7280] mb-3">
                    {template.description}
                  </p>
                  <div className="p-2 bg-[#DCFCE7] rounded-xl text-center mb-3">
                    <div className="text-lg font-bold text-[#16A34A]">
                      +{template.expectedROI}%
                    </div>
                    <div className="text-xs text-[#6B7280]">Очікуваний ROI</div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#6B7280] mb-1">
                      Критерії:
                    </p>
                    <ul className="space-y-1">
                      {template.criteria.slice(0, 3).map((criterion, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-[#6B7280] flex items-center gap-1"
                        >
                          <div className="w-1 h-1 bg-[#3B82F6] rounded-full"></div>
                          {criterion}
                        </li>
                      ))}
                      {template.criteria.length > 3 && (
                        <li className="text-xs text-[#9CA3AF]">
                          + ще {template.criteria.length - 3}
                        </li>
                      )}
                    </ul>
                  </div>
                  <Button
                    className={`w-full rounded-xl font-medium mt-3 ${
                      alreadyExists
                        ? "bg-[#D1D5DB] text-[#9CA3AF] cursor-not-allowed hover:bg-[#D1D5DB]"
                        : "bg-[#111827] hover:bg-[#1F2937] text-white"
                    }`}
                    size="sm"
                    disabled={alreadyExists}
                  >
                    {alreadyExists ? "Вже створено" : "Використати шаблон"}
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-3xl max-w-md border border-[#E5E7EB] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-red-100 flex-shrink-0">
                <Trash2 className="h-5 w-5 text-[#DC2626]" strokeWidth={1.5} />
              </div>
              <DialogTitle className="text-xl font-semibold text-[#111827]">
                Видалити стратегію?
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="border-t border-[#E5E7EB]" />

          <div className="px-6 pb-6 pt-4 space-y-3 bg-[#F3F4F6]">
            <div className="text-center">
              <div className="flex flex-col items-center px-5 py-5 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
                <DialogDescription className="text-lg font-bold text-[#111827] text-center">
                  {(strategyToDelete &&
                    (() => {
                      const s = strategies.find(
                        (st) => (st.id || st.name) === strategyToDelete,
                      );
                      return s?.name || strategyToDelete;
                    })()) ||
                    strategyToDelete}
                </DialogDescription>
                {strategyToDelete &&
                  (() => {
                    const s = strategies.find(
                      (st) => (st.id || st.name) === strategyToDelete,
                    );
                    if (!s) return null;
                    const riskLabels: Record<string, string> = {
                      Low: "Низький ризик",
                      Medium: "Середній ризик",
                      High: "Високий ризик",
                    };
                    return (
                      <span className="text-xs text-[#6B7280] mt-0.5">
                        {riskLabels[s.riskLevel] || s.riskLevel}
                      </span>
                    );
                  })()}
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-[#FECACA]">
              <AlertTriangle
                className="h-5 w-5 text-[#DC2626] flex-shrink-0 mt-0.5"
                strokeWidth={1.5}
              />
              <p className="text-sm text-[#991B1B]">
                Ця дія незворотна. Статистика ставок, пов&apos;язаних з цією
                стратегією, залишиться незмінною.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="rounded-xl border-[#E5E7EB] font-medium"
              >
                Скасувати
              </Button>
              <Button
                onClick={deleteStrategy}
                className="rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Видалити
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
