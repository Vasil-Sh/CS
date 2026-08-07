import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import BankrollChart from "@/components/BankrollChart";
import MonthlyProfitChartCard from "@/components/analytics/MonthlyProfitChartCard";
import OddsVsProfitScatterCard from "@/components/analytics/OddsVsProfitScatterCard";
import OddsWinRateChartCard from "@/components/analytics/OddsWinRateChartCard";
import OddsCategoryCards from "@/components/analytics/OddsCategoryCards";
import MetricCard from "@/components/analytics/MetricCard";
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

import { logRender } from "@/lib/devLogger";
import { AnalyticsSkeleton } from "@/components/PageSkeleton";
import { useRiskMetrics } from "@/hooks/useRiskMetrics";
import { BlurFade } from "@/components/ui/blur-fade";

import { AlertTriangle, BarChart3, Calendar, Wallet, Zap } from "lucide-react";
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

  const [loading, setLoading] = useState(true);
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
  const [gameFilter, setGameFilter] = useState<"all" | "CS2" | "Dota2">("all");

  const {
    completedBets: completedBetsForMetrics,
    riskMetrics,
    drawdownPeriods,
  } = useRiskMetrics(bets);

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
    // Always recalc from localStorage first (fast, no network dependency)
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
    // Fire-and-forget API sync (best-effort, non-blocking)
    BankrollService.fetchBankroll()
      .then((apiStats) => {
        if (apiStats.initialBank > 0)
          BankrollService.syncFromAPI(userRef.current, apiStats);
      })
      .catch(() => {});
  }, []);

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

  // Load analytics data on mount and when currentUser changes
  useEffect(() => {
    loadAnalyticsData();
    // Bankroll is computed by useEffect([bets, currentUser]) below — don't race here
  }, [currentUser, loadAnalyticsData]);

  // Refresh bankroll when user switches back to this tab (debounced, uses refs)
  useEffect(() => {
    let lastRun = 0;
    const handleVisibility = async () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastRun < 3000) return; // debounce 3s
      lastRun = now;
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
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

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
  }, [displayBets, gameFilter]);

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
      // Capitalize first letter: "серп." → "Серп."
      const capitalized =
        monthName.charAt(0).toUpperCase() + monthName.slice(1);

      if (!monthlyData[capitalized]) {
        monthlyData[capitalized] = { profit: 0, wins: 0, losses: 0, sortKey };
      }
      monthlyData[capitalized].profit += bet.profit || 0;
      if (bet.result === "Win") {
        monthlyData[capitalized].wins += 1;
      } else {
        monthlyData[capitalized].losses += 1;
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

  const dateRange = useMemo(() => {
    if (completedBets.length === 0) return "—";
    const dates = completedBets
      .map((b: Bet) => new Date(b.date))
      .sort((a, b) => a.getTime() - b.getTime());
    const first = dates[0];
    const last = dates[dates.length - 1];
    const fmt = (d: Date) =>
      d.toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    return `${fmt(first)} – ${fmt(last)}`;
  }, [completedBets]);

  const balanceOverTime = useMemo((): BalanceData[] => {
    // Support both UAH and USD — pick correct initial bank
    const initialBank =
      currencyMode === "USD"
        ? dualBank.usd.initialBank || 0
        : dualBank.uah.initialBank || 0;

    // Include ALL bets (including Pending) so the chart extends to the last placed bet.
    // Pending bets contribute profit=0 — they mark the bet date without changing balance.
    // Sort by createdAt (when the bet was actually placed) to preserve
    // real chronological order on the balance chart.
    // Date is the match date — two bets can have the same match date but
    // different creation times. Fall back to date if createdAt is missing
    // (old bets from localStorage before createdAt was added).
    const sortedBets = [...displayBets].sort((a: Bet, b: Bet) => {
      const aTs = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTs = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (aTs && bTs) return aTs - bTs;
      if (aTs) return 1;
      if (bTs) return -1;
      // Neither has createdAt — fall back to match date
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

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
      const isPending = bet.result === "Pending";
      // Pending bets don't change the balance — they just mark a point in time
      if (!isPending) {
        runningBalance += bet.profit || 0;
      }
      balanceData.push({
        date: bet.date,
        balance: runningBalance,
        profit: isPending ? 0 : bet.profit || 0,
        betName: bet.match || bet.betType || "Ставка",
        odds: bet.odds,
        isPending,
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
  }, [
    displayBets,
    dualBank.uah.initialBank,
    dualBank.usd.initialBank,
    currencyMode,
  ]);

  const scatterData = useMemo((): ScatterData[] => {
    return gameFilteredBets
      .filter((b: Bet) => b.result !== "Pending")
      .map((bet: Bet) => ({
        odds: Math.round(Number(bet.odds) * 100) / 100,
        profit: Math.round(Number(bet.profit) * 100) / 100,
        result: bet.result,
        betType: bet.betType || "Winner",
        match: bet.match || "",
        fill: bet.result === "Win" ? "#10b981" : "#ef4444",
      }));
  }, [gameFilteredBets]);

  const oddsData = oddsAnalysis;

  const oddsChartData = useMemo(
    () =>
      oddsData.map((range) => ({
        range: range.range.replace(/\s*\(.*?\)\s*/g, ""),
        winRate: parseFloat(range.winRate),
        roi:
          range.count > 0
            ? Math.round((range.profit / (range.count * 100)) * 100)
            : 0,
        bets: range.count,
      })),
    [oddsData],
  );

  const tabs = [
    { id: "profit", label: "Прибуток", icon: Wallet },
    { id: "odds", label: "Коефіцієнти", icon: BarChart3 },
    { id: "comparison", label: "Періоди", icon: Calendar },
  ];

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
            gameFilter={gameFilter}
            onGameFilterChange={setGameFilter}
          />

          <div className="relative z-10 space-y-8 px-6 lg:px-8 pb-8 pt-4 flex flex-col flex-1 min-h-0">
            {gameFilteredBets.length === 0 && (
              <Card className="rounded-2xl bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
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
                {/* 1. Прибуток */}
                <BlurFade delay={0} inView>
                  <MetricCard
                    value={`${filteredStats.totalProfit >= 0 ? "+" : ""}${Math.round(filteredStats.totalProfit).toLocaleString("uk-UA")} ₴`}
                    label="прибуток / вкладено"
                    change={
                      totalStaked > 0
                        ? `${roi >= 0 ? "+" : ""}${roi}%`
                        : undefined
                    }
                    isPositive={filteredStats.totalProfit >= 0}
                    dateRange={dateRange}
                    icon={Wallet}
                    badgeClass={
                      filteredStats.totalProfit >= 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }
                  />
                </BlurFade>

                {/* 2. Ставки */}
                <BlurFade delay={0.1} inView>
                  <MetricCard
                    value={completedBets.length.toString()}
                    label="ставок"
                    change={
                      completedBets.length > 0
                        ? `${winningBets.length}W / ${losingBets.length}L`
                        : undefined
                    }
                    isPositive={winningBets.length >= losingBets.length}
                    dateRange={dateRange}
                    icon={BarChart3}
                    badgeClass={
                      winningBets.length >= losingBets.length
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-orange-100 text-orange-700"
                    }
                  />
                </BlurFade>

                {/* 3. Коефіцієнти */}
                <BlurFade delay={0.2} inView>
                  <MetricCard
                    value={avgOdds > 0 ? avgOdds.toFixed(2) : "—"}
                    label="середній коеф."
                    change={
                      filteredStats.winRate > 0
                        ? `${filteredStats.winRate}% виграшів`
                        : undefined
                    }
                    isPositive={filteredStats.winRate >= 50}
                    dateRange={dateRange}
                    icon={Zap}
                    badgeClass={
                      filteredStats.winRate >= 50
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-orange-100 text-orange-700"
                    }
                  />
                </BlurFade>
              </div>
            </div>

            {/* Custom Tabs Navigation */}
            <div className="flex flex-col flex-1 min-h-0 space-y-6">
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm border-2 border-stone-200 p-3 rounded-[32px] flex-wrap justify-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
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
                          <BankrollChart data={balanceOverTime} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <MonthlyProfitChartCard data={monthlyProfitData} />
                          <OddsVsProfitScatterCard
                            data={scatterData}
                            winCount={winningBets.length}
                            lossCount={losingBets.length}
                          />
                        </div>
                      </div>
                    ) : (
                      <Card className="rounded-2xl bg-white overflow-hidden flex-1 flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
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
                        <OddsWinRateChartCard data={oddsChartData} />
                        <OddsCategoryCards
                          data={oddsData}
                          labels={oddsCategoryLabels}
                        />
                      </div>
                    ) : (
                      <Card className="rounded-2xl bg-white overflow-hidden flex-1 flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
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
