import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import BalanceChart from "@/components/BalanceChart";
import MonthlyProfitChartCard from "@/components/analytics/MonthlyProfitChartCard";
import OddsVsProfitScatterCard from "@/components/analytics/OddsVsProfitScatterCard";
import OddsWinRateChartCard from "@/components/analytics/OddsWinRateChartCard";
import OddsCategoryCards from "@/components/analytics/OddsCategoryCards";
import RiskManagement from "@/components/RiskManagement";
import PeriodComparison from "@/components/PeriodComparison";
import { PageHeader } from "@/components/PageHeader";
import GoalsManager from "@/components/GoalsManager";
import { UserDataService } from "@/lib/userDataService";
import { api } from "@/lib/apiClient";
import { BankrollService, type DualBankrollStats } from "@/lib/bankrollService";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/stores/appStore";
import { useTheme } from "@/hooks/useTheme";
import {
  CARD_BASE_STYLE,
  CARD_HOVER_STYLE,
  CHART_CARD_SHADOW,
  applyCardHover,
  resetCardHover,
} from "@/lib/cardStyles";
import { logRender } from "@/lib/devLogger";
import { AnalyticsSkeleton } from "@/components/PageSkeleton";
import { useRiskMetrics } from "@/hooks/useRiskMetrics";
import { NumberTicker } from "@/components/ui/number-ticker";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import {
  DollarSign,
  Filter,
  RefreshCw,
  AlertTriangle,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
  Percent,
  Info,
  Clock,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ReferenceLine,
} from "recharts";
import type {
  Bet,
  BettingStats,
  OddsRange,
  BalanceData,
  ScatterData,
} from "@/types/betting";

interface MonthlyData {
  month: string;
  profit: number;
  cumulative: number;
  wins: number;
  losses: number;
  totalBets: number;
  winRate: number;
}

export default function Analytics() {
  logRender("Analytics");
  const { user } = useAuth();
  const currentUser = user?.username || "";
  const isAdmin = user?.role === "admin";

  const [stats, setStats] = useState<BettingStats>({
    totalBets: 0,
    winRate: 0,
    totalProfit: 0,
    averageROI: 0,
    profitByMonth: [],
    profitByStrategy: [],
  });

  const [bets, setBets] = useState<Bet[]>([]);

  // ── Currency breakdown ──
  const profitByCurrency = useMemo(() => {
    const completed = bets.filter(
      (b) => b.result === "Win" || b.result === "Loss",
    );
    let profitUAH = 0;
    let profitUSD = 0;
    for (const b of completed) {
      const profit = b.profit || 0;
      if (b.currency === "USD" && b.exchangeRate) {
        profitUSD += profit / Number(b.exchangeRate);
      } else {
        profitUAH += profit;
      }
    }
    return { profitUAH, profitUSD };
  }, [bets]);

  // exchangeRate moved after currencyMode

  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const bumpBankroll = useAppStore((s) => s.bumpBankroll);
  const bankrollVersion = useAppStore((s) => s.bankrollVersion);
  const [dualBank, setDualBank] = useState<DualBankrollStats>({
    uah: { initialBank: 0, currentBank: 0, totalProfit: 0, roi: 0 },
    usd: { initialBank: 0, currentBank: 0, totalProfit: 0, roi: 0 },
  });
  const [currencyMode, setCurrencyMode] = useState<"UAH" | "USD">("UAH");

  const hasUsdBets = useMemo(
    () =>
      bets.some((b) => b.currency === "USD") || dualBank.usd.initialBank > 0,
    [bets, dualBank.usd.initialBank],
  );
  const [activeTab, setActiveTab] = useState("profit");

  const exchangeRate = useMemo(() => {
    const usdBets = bets.filter((b) => b.currency === "USD" && b.exchangeRate);
    if (usdBets.length === 0) return 0;
    return Number(usdBets[0].exchangeRate) || 0;
  }, [bets]);

  // Convert all bets to display currency — used by ALL charts
  const displayBets = useMemo(() => {
    if (currencyMode === "UAH") return bets;
    return bets.map((bet: Bet) => {
      const profit = bet.profit || 0;
      let displayProfit = 0;
      if (bet.currency === "USD" && bet.exchangeRate) {
        const rate = Number(bet.exchangeRate);
        displayProfit = rate > 0 ? profit / rate : profit;
      }
      // UAH bets show 0 profit in USD mode (they belong to UAH portfolio)
      return { ...bet, profit: displayProfit };
    });
  }, [bets, currencyMode]);

  const { theme, toggleTheme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [gameFilter, setGameFilter] = useState<"all" | "CS2" | "Dota2">("CS2");

  const {
    completedBets: completedBetsForMetrics,
    riskMetrics,
    drawdownPeriods,
  } = useRiskMetrics(bets);

  useEffect(() => {
    loadAnalyticsData();
    // Bankroll is computed by useEffect([bets, currentUser]) below — don't race here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes("bankroll_") && e.key.includes(currentUser)) {
        updateBankrollStats();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [currentUser]);

  // React to bankroll bumps from other components
  useEffect(() => {
    updateBankrollStats();
  }, [bankrollVersion]);

  // Refs to avoid stale closure in visibility handler
  const betsRef = useRef(bets);
  betsRef.current = bets;
  const userRef = useRef(currentUser);
  userRef.current = currentUser;

  // Recompute bankroll when bets data changes
  useEffect(() => {
    // Use bets from state, fallback to localStorage if API hasn't loaded yet
    const betsForBankroll =
      bets.length > 0
        ? bets
        : UserDataService.getUserData<Bet[]>(currentUser, "mybets_data", []);
    setDualBank(
      BankrollService.getBankrollStatsDual(currentUser, betsForBankroll),
    );
  }, [bets, currentUser]);

  const updateBankrollStats = useCallback(async () => {
    try {
      const apiStats = await BankrollService.fetchBankroll();
      if (apiStats.initialBank > 0) {
        BankrollService.syncFromAPI(currentUser, apiStats);
      }
    } catch (err) {
      if (import.meta.env.DEV)
        console.warn("[Analytics] Bankroll update failed:", err);
    }
    // Use refs + localStorage fallback to always have bets available
    const betsForBankroll =
      betsRef.current.length > 0
        ? betsRef.current
        : UserDataService.getUserData<Bet[]>(
            userRef.current,
            "mybets_data",
            [],
          );
    setDualBank(
      BankrollService.getBankrollStatsDual(userRef.current, betsForBankroll),
    );
  }, [currentUser]);

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);

      // API-first: fetch bets from backend
      let myBetsData: Bet[] = [];
      try {
        myBetsData = (await UserDataService.fetchBets()) as Bet[];
      } catch (err) {
        if (import.meta.env.DEV)
          console.warn("[Analytics] Bets fetch failed:", err);
      }

      setBets(myBetsData);

      if (myBetsData.length > 0) {
        const completedBets = myBetsData.filter(
          (bet: Bet) => bet.result !== "Pending",
        );
        const winningBets = completedBets.filter(
          (bet: Bet) => bet.result === "Win",
        );

        const totalBets = completedBets.length;
        const winRate =
          totalBets > 0
            ? Math.round((winningBets.length / totalBets) * 100)
            : 0;
        const totalProfit = completedBets.reduce(
          (sum: number, bet: Bet) => sum + (bet.profit || 0),
          0,
        );
        const averageROI =
          totalBets > 0
            ? Math.round(
                (totalProfit /
                  completedBets.reduce(
                    (sum: number, bet: Bet) => sum + bet.amount,
                    0,
                  )) *
                  100,
              )
            : 0;

        let profitByMonth: { month: string; profit: number }[] = [];
        let profitByStrategy: { strategy: string; profit: number }[] = [];
        try {
          const apiStats = await UserDataService.fetchBetStats();
          profitByMonth = apiStats.profitByMonth || [];
          profitByStrategy = apiStats.profitByStrategy || [];
        } catch (err) {
          if (import.meta.env.DEV)
            console.warn("[Analytics] Stats fetch failed:", err);
        }

        setStats({
          totalBets,
          winRate,
          totalProfit,
          averageROI,
          profitByMonth,
          profitByStrategy,
        });
      } else {
        setStats({
          totalBets: 0,
          winRate: 0,
          totalProfit: 0,
          averageROI: 0,
          profitByMonth: [],
          profitByStrategy: [],
        });
      }
    } catch (error) {
      if (import.meta.env.DEV)
        console.warn("[Analytics] Error loading:", error);
      setBets([]);
      setStats({
        totalBets: 0,
        winRate: 0,
        totalProfit: 0,
        averageROI: 0,
        profitByMonth: [],
        profitByStrategy: [],
      });
    } finally {
      setLoading(false);
      // Bankroll is computed by useEffect([bets, currentUser]) — don't race here
    }
  }, [currentUser]);

  // Refresh bankroll when user switches back to this tab (single listener, uses refs)
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === "visible") {
        try {
          const apiStats = await BankrollService.fetchBankroll();
          if (apiStats.initialBank > 0) {
            BankrollService.syncFromAPI(userRef.current, apiStats);
          }
        } catch (err) {
          if (import.meta.env.DEV)
            console.warn(
              "[Analytics] Visibility bankroll refresh failed:",
              err,
            );
        }
        const betsForBankroll =
          betsRef.current.length > 0
            ? betsRef.current
            : UserDataService.getUserData<Bet[]>(
                userRef.current,
                "mybets_data",
                [],
              );
        setDualBank(
          BankrollService.getBankrollStatsDual(
            userRef.current,
            betsForBankroll,
          ),
        );
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []); // refs keep it fresh — no deps needed

  const clearAllData = useCallback(async () => {
    if (
      window.confirm(
        "Ви впевнені, що хочете очистити всі дані аналітики? Ця дія незворотна.",
      )
    ) {
      try {
        await api.post("/admin/reset", {}); // API handles all cleanup
      } catch {
        /* noop */
      }

      setBets([]);
      setStats({
        totalBets: 0,
        winRate: 0,
        totalProfit: 0,
        averageROI: 0,
        profitByMonth: [],
        profitByStrategy: [],
      });
      setDualBank({
        uah: { initialBank: 0, currentBank: 0, totalProfit: 0, roi: 0 },
        usd: { initialBank: 0, currentBank: 0, totalProfit: 0, roi: 0 },
      });
    }
  }, []);

  // Filter bets by game
  const gameFilteredBets = useMemo(() => {
    if (gameFilter === "all") return displayBets;
    return displayBets.filter((bet: Bet) => {
      const g = bet.game || "";
      return (
        g === gameFilter ||
        (gameFilter === "CS2" && g === "CS") ||
        (gameFilter === "Dota2" && g === "Dota")
      );
    });
  }, [bets, gameFilter]);

  // Derive memoized metrics
  const { completedBets, winningBets, losingBets } = useMemo(() => {
    const completed = gameFilteredBets.filter(
      (bet: Bet) => bet.result !== "Pending",
    );
    return {
      completedBets: completed,
      winningBets: completed.filter((bet: Bet) => bet.result === "Win"),
      losingBets: completed.filter((bet: Bet) => bet.result === "Loss"),
    };
  }, [gameFilteredBets]);

  // Game-filtered stats for quick stat cards
  const filteredStats = useMemo(() => {
    const totalBets = completedBets.length;
    const winRate =
      totalBets > 0 ? Math.round((winningBets.length / totalBets) * 100) : 0;
    const totalProfit = completedBets.reduce(
      (sum: number, bet: Bet) => sum + (bet.profit || 0),
      0,
    );
    return { totalBets, winRate, totalProfit };
  }, [completedBets, winningBets]);

  // ── Analytics-specific computed values ──
  const totalStaked = useMemo(
    () => completedBets.reduce((s: number, b: Bet) => s + b.amount, 0),
    [completedBets],
  );
  const roi = useMemo(() => {
    return totalStaked > 0
      ? Math.round((filteredStats.totalProfit / totalStaked) * 100)
      : 0;
  }, [completedBets, filteredStats.totalProfit, totalStaked]);

  const avgOdds = useMemo(() => {
    if (completedBets.length === 0) return 0;
    const sum = completedBets.reduce((s: number, b: Bet) => s + b.odds, 0);
    return Math.round((sum / completedBets.length) * 100) / 100;
  }, [completedBets]);

  const bestMonth = useMemo(() => {
    if (!stats.profitByMonth || stats.profitByMonth.length === 0) return null;
    return [...stats.profitByMonth].sort((a, b) => b.profit - a.profit)[0];
  }, [stats.profitByMonth]);

  const worstMonth = useMemo(() => {
    if (!stats.profitByMonth || stats.profitByMonth.length === 0) return null;
    return [...stats.profitByMonth].sort((a, b) => a.profit - b.profit)[0];
  }, [stats.profitByMonth]);

  const avgMonthlyProfit = useMemo(() => {
    if (!stats.profitByMonth || stats.profitByMonth.length === 0) return 0;
    const total = stats.profitByMonth.reduce((s, m) => s + m.profit, 0);
    return Math.round(total / stats.profitByMonth.length);
  }, [stats.profitByMonth]);

  const totalMonthsTracked = useMemo(() => {
    return stats.profitByMonth?.length || 0;
  }, [stats.profitByMonth]);

  const betsThisMonth = useMemo(() => {
    const now = new Date();
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return completedBets.filter((b: Bet) => {
      const d = b.date || "";
      return d.startsWith(start);
    }).length;
  }, [completedBets]);

  const oddsAnalysis = useMemo((): OddsRange[] => {
    const lowOdds = completedBets.filter((bet: Bet) => bet.odds < 2.0);
    const midOdds = completedBets.filter(
      (bet: Bet) => bet.odds >= 2.0 && bet.odds < 3.0,
    );
    const highOdds = completedBets.filter((bet: Bet) => bet.odds >= 3.0);

    return [
      {
        range: "Низькі (< 2.0)",
        count: lowOdds.length,
        winRate: lowOdds.length
          ? (
              (lowOdds.filter((b: Bet) => b.result === "Win").length /
                lowOdds.length) *
              100
            ).toFixed(1)
          : "0",
        profit: lowOdds.reduce(
          (sum: number, bet: Bet) => sum + (bet.profit || 0),
          0,
        ),
      },
      {
        range: "Середні (2.0-3.0)",
        count: midOdds.length,
        winRate: midOdds.length
          ? (
              (midOdds.filter((b: Bet) => b.result === "Win").length /
                midOdds.length) *
              100
            ).toFixed(1)
          : "0",
        profit: midOdds.reduce(
          (sum: number, bet: Bet) => sum + (bet.profit || 0),
          0,
        ),
      },
      {
        range: "Високі (> 3.0)",
        count: highOdds.length,
        winRate: highOdds.length
          ? (
              (highOdds.filter((b: Bet) => b.result === "Win").length /
                highOdds.length) *
              100
            ).toFixed(1)
          : "0",
        profit: highOdds.reduce(
          (sum: number, bet: Bet) => sum + (bet.profit || 0),
          0,
        ),
      },
    ];
  }, [completedBets]);

  const shortenBetTypeName = (betType: string): string => {
    if (betType.includes("Експрес") || betType.includes("|")) {
      const formatMatch = betType.match(/(\d+)x/);
      if (formatMatch) {
        return `Експрес ${formatMatch[1]}x`;
      }
      const eventCount = (betType.match(/•/g) || []).length + 1;
      if (eventCount > 1) {
        return `Експрес ${eventCount}x`;
      }
    }
    return betType;
  };

  const betTypeDistribution = useMemo(() => {
    const distribution: {
      [key: string]: {
        count: number;
        profit: number;
        wins: number;
        originalName: string;
      };
    } = {};
    gameFilteredBets.forEach((bet: Bet) => {
      const originalType = bet.betType || "Winner";
      const shortType = shortenBetTypeName(originalType);

      if (!distribution[shortType]) {
        distribution[shortType] = {
          count: 0,
          profit: 0,
          wins: 0,
          originalName: originalType,
        };
      }
      distribution[shortType].count += 1;
      distribution[shortType].profit += bet.profit || 0;
      if (bet.result === "Win") {
        distribution[shortType].wins += 1;
      }
    });

    const colors = [
      "#8b5cf6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#3b82f6",
      "#ec4899",
    ];
    return Object.entries(distribution).map(([type, data], index) => ({
      name: type,
      originalName: data.originalName,
      value: data.count,
      profit: Math.round(data.profit * 100) / 100,
      winRate: data.count > 0 ? Math.round((data.wins / data.count) * 100) : 0,
      color: colors[index % colors.length],
    }));
  }, [gameFilteredBets]);

  const monthlyProfitData = useMemo((): MonthlyData[] => {
    const monthlyData: {
      [key: string]: {
        profit: number;
        wins: number;
        losses: number;
        sortKey: string;
      };
    } = {};

    completedBets.forEach((bet: Bet) => {
      const date = new Date(bet.date);
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthName = date.toLocaleDateString("uk-UA", {
        month: "short",
        year: "numeric",
      });

      if (!monthlyData[monthName]) {
        monthlyData[monthName] = { profit: 0, wins: 0, losses: 0, sortKey };
      }
      monthlyData[monthName].profit += bet.profit || 0;
      if (bet.result === "Win") {
        monthlyData[monthName].wins += 1;
      } else {
        monthlyData[monthName].losses += 1;
      }
    });

    let cumulative = 0;
    return Object.entries(monthlyData)
      .sort((a, b) => a[1].sortKey.localeCompare(b[1].sortKey))
      .map(([month, data]) => {
        cumulative += data.profit;
        return {
          month,
          profit: Math.round(data.profit * 100) / 100,
          cumulative: Math.round(cumulative * 100) / 100,
          wins: data.wins,
          losses: data.losses,
          totalBets: data.wins + data.losses,
          winRate:
            data.wins + data.losses > 0
              ? Math.round((data.wins / (data.wins + data.losses)) * 100)
              : 0,
        };
      });
  }, [completedBets]);

  const balanceOverTime = useMemo((): BalanceData[] => {
    // Use initial bank as starting balance so chart shows actual bankroll, not just cumulative profit
    const initialBank = dualBank.uah.initialBank || 0;

    const sortedBets = [...completedBets].sort(
      (a: Bet, b: Bet) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    if (sortedBets.length === 0) {
      // No bets yet — show just the starting point
      return [
        {
          date: new Date().toISOString().split("T")[0],
          balance: initialBank,
          profit: 0,
        },
      ];
    }

    // Start chart from the day before the first bet, at initial bank
    const firstDate = new Date(sortedBets[0].date);
    firstDate.setDate(firstDate.getDate() - 1);
    const startDate = firstDate.toISOString().split("T")[0];

    const balanceData: BalanceData[] = [
      {
        date: startDate,
        balance: initialBank,
        profit: 0,
      },
    ];

    let runningBalance = initialBank;
    sortedBets.forEach((bet: Bet) => {
      runningBalance += bet.profit || 0;
      balanceData.push({
        date: bet.date,
        balance: runningBalance,
        profit: bet.profit || 0,
        betName: bet.match || bet.betType || "Ставка",
        odds: bet.odds,
      });
    });

    // Always add today's final balance if the last bet wasn't today
    const today = new Date().toISOString().split("T")[0];
    const lastPoint = balanceData[balanceData.length - 1];
    if (lastPoint.date !== today) {
      balanceData.push({
        date: today,
        balance: runningBalance,
        profit: 0,
      });
    }

    return balanceData;
  }, [completedBets, dualBank.uah.initialBank]);

  const scatterData = useMemo((): ScatterData[] => {
    return completedBets.map((bet: Bet) => ({
      odds: Math.round(Number(bet.odds) * 100) / 100,
      profit: Math.round(Number(bet.profit) * 100) / 100,
      result: bet.result,
      betType: bet.betType || "Winner",
      match: bet.match || "",
      fill: bet.result === "Win" ? "#10b981" : "#ef4444",
    }));
  }, [completedBets]);

  const oddsData = oddsAnalysis; // now a memoized value, not a function call
  const betTypes = betTypeDistribution;
  const monthlyProfit = monthlyProfitData;
  const balanceData = balanceOverTime;

  const oddsChartData = oddsData.map((range) => ({
    range: range.range.replace(/\s*\(.*?\)\s*/g, ""),
    winRate: parseFloat(range.winRate),
    roi:
      range.count > 0
        ? Math.round((range.profit / (range.count * 100)) * 100)
        : 0,
    bets: range.count,
  }));

  const tabs = [
    { id: "profit", label: "Прибуток", icon: Wallet },
    { id: "odds", label: "Коефіцієнти", icon: BarChart3 },
    { id: "comparison", label: "Періоди", icon: Calendar },
  ];

  const activeFiltersCount = timeFilter !== "all" ? 1 : 0;

  // Shared card style for hover shadow effect (matches StatCard)
  const cardBaseStyle = CARD_BASE_STYLE;
  const cardHoverStyle = CARD_HOVER_STYLE;

  // Enhanced card shadow for chart cards — subtle depth like header
  const chartCardShadow = CHART_CARD_SHADOW;

  // Odds category labels
  const oddsCategoryLabels = [
    { label: "Низькі", sublabel: "< 2.0" },
    { label: "Середні", sublabel: "2.0 – 3.0" },
    { label: "Високі", sublabel: "> 3.0" },
  ];

  return (
    <div className="min-h-screen bg-[#f3f3f3] relative flex flex-col">
      {loading ? (
        <AnalyticsSkeleton />
      ) : (
        <>
          {/* ===== HEADER ===== */}
          <PageHeader
            title="Аналітика"
            currentUser={currentUser || "User"}
            isDarkTheme={isDarkTheme}
            onToggleTheme={toggleTheme}
            showThemeToggle={false}
            showCurrencySwitch={true}
            currencyMode={currencyMode}
            onCurrencyChange={setCurrencyMode}
            hasUsdBets={hasUsdBets}
          />

          {/* Main Content */}
          <div className="relative z-10 space-y-8 px-6 lg:px-8 pb-8 pt-4 flex flex-col flex-1 min-h-0">
            {gameFilteredBets.length === 0 && (
              <Card
                className="rounded-2xl bg-white overflow-hidden"
                style={{ boxShadow: chartCardShadow }}
              >
                <CardContent className="py-5 px-6 flex items-center gap-4">
                  <div className="p-3 bg-red-50 rounded-xl flex-shrink-0">
                    <AlertTriangle
                      className="h-6 w-6 text-red-500"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      Немає даних для аналізу
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Додайте записи на сторінці «Додати запис»
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ===== QUICK STATS ===== */}
            <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {/* 1. ROI */}
                <div
                  className="stat-card bg-white border border-gray-200 rounded-3xl px-6 py-5 group relative overflow-hidden flex flex-col items-center justify-between h-full"
                  style={cardBaseStyle}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardBaseStyle)}
                >
                  <div className="flex items-center gap-2 mb-3 self-start">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50">
                      <Percent className="h-5 w-5 text-emerald-500" strokeWidth={1.5} />
                    </div>
                    <span className="text-lg font-semibold text-gray-900">ROI</span>
                  </div>
                  <AnimatedCircularProgressBar
                    max={100}
                    min={0}
                    value={Math.abs(roi) > 100 ? 100 : Math.abs(roi)}
                    gaugePrimaryColor={roi >= 0 ? "#10B981" : "#EF4444"}
                    gaugeSecondaryColor="#E5E7EB"
                    className="!w-32 !h-32"
                  />
                  <span className={`text-xs mt-2 ${roi >= 0 ? "text-emerald-500" : "text-red-500"}`}>{roi >= 0 ? "+" : ""}{roi}% ROI</span>
                  <div className="grid grid-cols-2 gap-2 mt-2 w-full">
                    <div className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-center shadow-sm">
                      <div className="text-[10px] text-gray-500 font-medium">Вкладено</div>
                      <div className="text-sm font-bold text-gray-900"><NumberTicker value={Math.round(totalStaked)} /> ₴</div>
                    </div>
                    <div className={`bg-white border rounded-lg px-2 py-1.5 text-center shadow-sm ${filteredStats.totalProfit >= 0 ? "border-emerald-200" : "border-red-200"}`}>
                      <div className={`text-[10px] font-medium ${filteredStats.totalProfit >= 0 ? "text-emerald-500" : "text-red-400"}`}>Прибуток</div>
                      <div className={`text-sm font-bold ${filteredStats.totalProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>{filteredStats.totalProfit >= 0 ? "+" : ""}<NumberTicker value={Math.round(filteredStats.totalProfit)} /> ₴</div>
                    </div>
                  </div>
                </div>

                {/* 2. По місяцях */}
                <div
                  className="stat-card bg-white border border-gray-200 rounded-3xl px-6 py-5 group relative overflow-hidden flex flex-col items-center justify-between h-full"
                  style={cardBaseStyle}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardBaseStyle)}
                >
                  <div className="flex items-center gap-2 mb-3 self-start">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-50">
                      <Trophy className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
                    </div>
                    <span className="text-lg font-semibold text-gray-900">По місяцях</span>
                  </div>
                  {/* Month profit donut */}
                  <AnimatedCircularProgressBar
                    max={100}
                    min={0}
                    value={bestMonth && totalMonthsTracked > 0 ? Math.min(100, Math.round((bestMonth.profit / (Math.abs(bestMonth.profit) + Math.abs(worstMonth?.profit || 0) + 1)) * 100)) : 50}
                    gaugePrimaryColor="#F59E0B"
                    gaugeSecondaryColor="#E5E7EB"
                    className="!w-28 !h-28"
                  />
                  <span className="text-xs text-amber-500 mt-2 font-medium">
                    {bestMonth ? `${bestMonth.profit >= 0 ? "+" : ""}${Math.round(bestMonth.profit).toLocaleString("uk-UA")} ₴` : "—"}
                  </span>
                  <div className="flex items-end gap-3 mt-2 w-full">
                    <div className="flex-1 bg-white border border-emerald-200 rounded-xl px-3 py-2 shadow-sm">
                      <div className="text-[10px] text-emerald-500 font-medium mb-0.5">▲ Найкращий</div>
                      <div className="text-sm font-bold text-emerald-700">{bestMonth ? <><NumberTicker value={Math.round(bestMonth.profit)} /> ₴</> : "—"}</div>
                      {bestMonth && <div className="text-[10px] text-emerald-500 mt-0.5">{bestMonth.month}</div>}
                    </div>
                    <div className="flex-1 bg-white border border-red-200 rounded-xl px-3 py-2 shadow-sm">
                      <div className="text-[10px] text-red-400 font-medium mb-0.5">▼ Найгірший</div>
                      <div className="text-sm font-bold text-red-500">{worstMonth ? <><NumberTicker value={Math.round(worstMonth.profit)} /> ₴</> : "—"}</div>
                      {worstMonth && <div className="text-[10px] text-red-400 mt-0.5">{worstMonth.month}</div>}
                    </div>
                  </div>
                </div>

                {/* 3. Коефіцієнти */}
                <div
                  className="stat-card bg-white border border-gray-200 rounded-3xl px-6 py-5 group relative overflow-hidden flex flex-col items-center justify-between h-full"
                  style={cardBaseStyle}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardBaseStyle)}
                >
                  <div className="flex items-center gap-2 mb-3 self-start">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sky-50">
                      <Zap className="h-5 w-5 text-sky-500" strokeWidth={1.5} />
                    </div>
                    <span className="text-lg font-semibold text-gray-900">Коефіцієнти</span>
                  </div>
                  <AnimatedCircularProgressBar
                    max={100}
                    min={0}
                    value={filteredStats.winRate}
                    gaugePrimaryColor="#3B82F6"
                    gaugeSecondaryColor="#E5E7EB"
                    className="!w-28 !h-28"
                  />
                  <span className="text-xs text-sky-500 mt-2 font-medium">середній {avgOdds > 0 ? avgOdds.toFixed(2) : "—"}</span>
                  <div className="grid grid-cols-3 gap-2 mt-2 w-full mb-2">
                    <div className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-center shadow-sm">
                      <div className="text-[10px] text-gray-500 font-medium">Ставок</div>
                      <div className="text-sm font-bold text-gray-900"><NumberTicker value={completedBets.length} /></div>
                    </div>
                    <div className="bg-white border border-emerald-200 rounded-lg px-2 py-1.5 text-center shadow-sm">
                      <div className="text-[10px] text-emerald-500 font-medium">Виграші</div>
                      <div className="text-sm font-bold text-emerald-600"><NumberTicker value={winningBets.length} /></div>
                    </div>
                    <div className="bg-white border border-red-200 rounded-lg px-2 py-1.5 text-center shadow-sm">
                      <div className="text-[10px] text-red-400 font-medium">Програші</div>
                      <div className="text-sm font-bold text-red-500"><NumberTicker value={losingBets.length} /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Tabs Navigation */}
            <div className="flex flex-col flex-1 min-h-0 space-y-6">
              <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-3 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                <div
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
                  }}
                >
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                      relative rounded-[24px] px-6 py-4 font-light text-base
                      transition-all duration-300 ease-in-out
                      ${
                        activeTab === tab.id
                          ? "bg-blue-500 text-white font-medium shadow-[0_4px_16px_rgba(68,122,252,0.3)] border border-transparent"
                          : "bg-transparent text-gray-400 hover:bg-[#F5F5F3] hover:text-gray-500 border border-transparent"
                      }
                    `}
                      >
                        <span className="flex items-center justify-center gap-2">
                          {Icon && (
                            <Icon className="h-4 w-4" strokeWidth={1.5} />
                          )}
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex flex-col flex-1 min-h-0">
                {activeTab === "profit" && (
                  <div className="flex flex-col flex-1">
                    {gameFilteredBets.length > 0 ? (
                      <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                        <div className="mb-6">
                          <BalanceChart data={balanceData} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <MonthlyProfitChartCard
                            data={monthlyProfit}
                            chartCardShadow={chartCardShadow}
                          />
                          <OddsVsProfitScatterCard
                            data={scatterData}
                            winCount={winningBets.length}
                            lossCount={losingBets.length}
                            chartCardShadow={chartCardShadow}
                          />
                        </div>
                      </div>
                    ) : (
                      <Card
                        className="rounded-2xl bg-white overflow-hidden flex-1 flex items-center justify-center"
                        style={{ boxShadow: chartCardShadow }}
                      >
                        <CardContent className="py-16 text-center">
                          <div className="p-8 bg-gray-100 rounded-2xl inline-block mb-6">
                            <Wallet
                              className="h-16 w-16 text-gray-400"
                              strokeWidth={1.5}
                            />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Немає даних про прибуток
                          </h3>
                          <p className="text-gray-500 text-sm">
                            Додайте ставки для перегляду аналізу прибутку
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {activeTab === "goals" && <GoalsManager />}

                {/* ===== КОЕФІЦІЄНТИ TAB ===== */}
                {activeTab === "odds" && (
                  <div className="flex flex-col flex-1">
                    {gameFilteredBets.length > 0 ? (
                      <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-6">
                        <OddsWinRateChartCard
                          data={oddsChartData}
                          chartCardShadow={chartCardShadow}
                        />
                        <OddsCategoryCards
                          data={oddsData}
                          labels={oddsCategoryLabels}
                        />
                      </div>
                    ) : (
                      <Card
                        className="rounded-2xl bg-white overflow-hidden flex-1 flex items-center justify-center"
                        style={{ boxShadow: chartCardShadow }}
                      >
                        <CardContent className="py-16 text-center">
                          <div className="p-8 bg-gray-100 rounded-2xl inline-block mb-6">
                            <BarChart3
                              className="h-16 w-16 text-gray-400"
                              strokeWidth={1.5}
                            />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Немає даних для аналізу коефіцієнтів
                          </h3>
                          <p className="text-gray-500 text-sm">
                            Додайте ставки для перегляду аналізу по категоріях
                            коефіцієнтів
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {activeTab === "comparison" && (
                  <TooltipProvider>
                    <div className="flex flex-col flex-1">
                      <div className="bg-white rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex-1 flex flex-col">
                        <PeriodComparison bets={bets} />
                      </div>
                    </div>
                  </TooltipProvider>
                )}
                {activeTab === "risks" && <RiskManagement bets={bets} />}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
