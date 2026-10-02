import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import BankrollChart from "@/components/BankrollChart";
import MonthlyProfitChartCard from "@/components/analytics/MonthlyProfitChartCard";
import OddsVsProfitScatterCard from "@/components/analytics/OddsVsProfitScatterCard";
import OddsOverview from "@/components/analytics/OddsOverview";
import RiskManagement from "@/components/RiskManagement";
import PeriodComparison from "@/components/PeriodComparison";
import GoalsManager from "@/components/GoalsManager";
import { UserDataService } from "@/lib/userDataService";
import { BankrollService, type DualBankrollStats } from "@/lib/bankrollService";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/stores/appStore";

import { logRender } from "@/lib/devLogger";
import { AnalyticsSkeleton } from "@/components/PageSkeleton";
import { BarChart3, Calendar, Wallet } from "lucide-react";
import type { Bet, BalanceData, ScatterData } from "@/types/betting";
import "./Analytics.css";

interface MonthlyData {
  month: string;
  monthKey: string;
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

  const [bets, setBets] = useState<Bet[]>([]);

  const [loading, setLoading] = useState(true);
  const bankrollVersion = useAppStore((s) => s.bankrollVersion);
  const [dualBank, setDualBank] = useState<DualBankrollStats>({
    uah: { initialBank: 0, currentBank: 0, totalProfit: 0, roi: 0 },
    usd: { initialBank: 0, currentBank: 0, totalProfit: 0, roi: 0 },
  });
  const [currencyMode, setCurrencyMode] = useState<"UAH" | "USD">("UAH");

  const [activeTab, setActiveTab] = useState("profit");

  // Filter bets by their REAL currency (no cross-currency conversion).
  // UAH mode shows UAH bets; USD mode shows USD bets.
  // Profit is always stored in UAH, so USD bets divide by their exchange rate.
  const displayBets = useMemo(() => {
    if (currencyMode === "UAH") {
      return bets.filter(
        (bet: Bet) => (bet.currency || "UAH") === "UAH",
      );
    }
    const globalRate = Number(
      localStorage.getItem("matchiq_exchange_rate") || 41.5,
    );
    return bets
      .filter((bet: Bet) => bet.currency === "USD")
      .map((bet: Bet) => {
        const profit = bet.profit || 0;
        const rate =
          bet.exchangeRate && Number(bet.exchangeRate) > 0
            ? Number(bet.exchangeRate)
            : globalRate;
        const displayProfit = rate > 0 ? profit / rate : profit;
        return { ...bet, profit: displayProfit };
      });
  }, [bets, currencyMode]);

  const [gameFilter, setGameFilter] = useState<"all" | "CS2" | "Dota2">("all");

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
    } catch (error) {
      if (import.meta.env.DEV)
        console.warn("[Analytics] Error loading:", error);
      setBets([]);
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
          monthKey: data.sortKey,
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

  const monthlyChartData = useMemo((): MonthlyData[] => {
    if (monthlyProfitData.length === 0) return [];
    const latest = monthlyProfitData[monthlyProfitData.length - 1];
    const [year, month] = latest.monthKey.split("-").map(Number);
    const lastMonth = new Date(year, month - 1, 1);
    return Array.from({ length: 4 }, (_, offset) => {
      const date = new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 3 + offset, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const source = monthlyProfitData.find((item) => item.monthKey === monthKey);
      const monthName = date.toLocaleDateString("uk-UA", { month: "long" });
      const displayMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      return source ? {
        ...source,
        month: displayMonth,
      } : {
        month: displayMonth,
        monthKey,
        profit: 0,
        cumulative: 0,
        wins: 0,
        losses: 0,
        totalBets: 0,
        winRate: 0,
      };
    });
  }, [monthlyProfitData]);

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


  const tabs = [
    { id: "profit", label: "Прибуток", icon: Wallet },
    { id: "odds", label: "Коефіцієнти", icon: BarChart3 },
    { id: "comparison", label: "Періоди", icon: Calendar },
  ];


  return (
    <div className="analytics-profit min-h-screen relative flex flex-col">
      {loading ? (
        <AnalyticsSkeleton />
      ) : (
        <>
          <header className="analytics-header">
            <div className="analytics-header-top">
              <div>
                <h1>Аналітика</h1>
                <p>Картина ваших рішень — без шуму.</p>
              </div>
              <div className="analytics-header-controls" aria-label="Фільтри аналітики">
                <div className="analytics-segment" role="group" aria-label="Фільтр гри">
                  {(["all", "CS2", "Dota2"] as const).map((game) => (
                    <button key={game} type="button" aria-pressed={gameFilter === game} onClick={() => setGameFilter(game)}>
                      {game === "all" ? "Усі ігри" : game === "Dota2" ? "Dota 2" : "CS2"}
                    </button>
                  ))}
                </div>
                <div className="analytics-segment" role="group" aria-label="Валюта">
                  {(["UAH", "USD"] as const).map((currency) => (
                    <button key={currency} type="button" aria-pressed={currencyMode === currency} onClick={() => setCurrencyMode(currency)}>
                      {currency === "UAH" ? "₴ UAH" : "$ USD"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <dl className="analytics-head-stats">
              <div>
                <dd className={filteredStats.totalProfit >= 0 ? "analytics-positive" : "analytics-negative"}>{filteredStats.totalProfit >= 0 ? "+" : ""}{Math.round(filteredStats.totalProfit).toLocaleString("uk-UA")} {currencyMode === "USD" ? "$" : "₴"}</dd>
                <dt>Прибуток <span>ROI {roi >= 0 ? "+" : ""}{roi}%</span></dt>
              </div>
              <div><dd className="analytics-orange">{completedBets.length}</dd><dt>Розраховано <span>{winningBets.length}W / {losingBets.length}L</span></dt></div>
              <div><dd className="analytics-blue">{avgOdds > 0 ? avgOdds.toFixed(2) : "—"}</dd><dt>Середній коеф. <span>{filteredStats.winRate}% вінрейт</span></dt></div>
            </dl>
          </header>

          <div className="analytics-workspace relative z-10 flex flex-col flex-1 min-h-0">
            {gameFilteredBets.length === 0 && (
              <div className="analytics-empty-state">
                <div className="analytics-empty-icon">
                  <Wallet strokeWidth={1.5} />
                </div>
                <h3>Немає даних для аналізу</h3>
                <p>Додайте записи на сторінці «Додати запис»</p>
              </div>
            )}

            {/* Custom Tabs Navigation */}
            {gameFilteredBets.length > 0 && (
            <div className="analytics-tabs-shell flex flex-col flex-1 min-h-0">
              <div className="analytics-tabs" role="tablist" aria-label="Розділи аналітики">
                  {tabs.map((tab) => {
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="analytics-tab"
                        aria-selected={activeTab === tab.id}
                      >
                        <span className="flex items-center justify-center gap-2">
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
              </div>

              {/* Tab Content */}
              <div className="analytics-tab-content flex flex-col flex-1 min-h-0">
                {activeTab === "profit" && (
                  <div className="flex flex-col flex-1">
                    {gameFilteredBets.length > 0 ? (
                      <div className="analytics-profit-grid">
                        <div className="analytics-bankroll-wrap">
                          <BankrollChart data={balanceOverTime} currency={currencyMode} />
                        </div>
                        <aside className="analytics-period-summary" aria-label="Підсумок періоду">
                          <h2>Підсумок періоду</h2>
                          <dl>
                            <div><dt>Чистий результат</dt><dd className={filteredStats.totalProfit >= 0 ? "analytics-positive" : "analytics-negative"}>{filteredStats.totalProfit >= 0 ? "+" : ""}{Math.round(filteredStats.totalProfit).toLocaleString("uk-UA")} {currencyMode === "USD" ? "$" : "₴"}</dd></div>
                            <div><dt>Розраховано</dt><dd>{completedBets.length}</dd></div>
                            <div><dt>Активні</dt><dd>{gameFilteredBets.filter((bet) => bet.result === "Pending").length}</dd></div>
                          </dl>
                        </aside>
                        <div className="analytics-profit-charts">
                          <MonthlyProfitChartCard data={monthlyChartData} currency={currencyMode} />
                          <OddsVsProfitScatterCard
                            data={scatterData}
                            winCount={winningBets.length}
                            lossCount={losingBets.length}
                            currency={currencyMode}
                          />
                        </div>
                        <p className="analytics-method-note">Усі показники оновлюються після розрахунку запису.</p>
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
                  <OddsOverview bets={gameFilteredBets} currency={currencyMode} />
                )}

                {activeTab === "comparison" && (
                  <PeriodComparison bets={gameFilteredBets} currency={currencyMode} />
                )}
                {activeTab === "risks" && <RiskManagement />}
              </div>
            </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
