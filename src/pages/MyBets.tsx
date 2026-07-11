import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import CS2BettingForm from "@/components/CS2BettingForm";
import type { MatchPrefillData } from "@/components/CS2BettingForm";
import StrategyOverview from "@/components/StrategyOverview";
import BetShareModal from "@/components/BetShareModal";

import ExpressDetailsModal from "@/components/ExpressDetailsModal";
import BetDetailsModal from "@/components/BetDetailsModal";
import InitialBankModal from "@/components/InitialBankModal";
import BetTable from "@/components/BetTable";
import { UserDataService } from "@/lib/userDataService";
import { BankrollService, type DualBankrollStats } from "@/lib/bankrollService";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/stores/appStore";
import { authService } from "@/lib/authService";
import {
  parseExpressEvents,
  type ParsedEvent,
} from "@/lib/parser/expressParser";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { logRender } from "@/lib/devLogger";
import { PageHeader } from "@/components/PageHeader";
import { Plus, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { Confetti } from "@/components/ui/confetti";
import { Marquee } from "@/components/ui/marquee";
import type { Bet } from "@/types/betting";
import MyBetsStatsCards from "@/components/mybets/MyBetsStatsCards";
import ResultNoteDialog from "@/components/mybets/ResultNoteDialog";
import DeleteBetDialog from "@/components/mybets/DeleteBetDialog";

// ── Types ──
interface UserRecord {
  telegram: string;
  username: string;
  isAdmin?: boolean;
}
interface BetStats {
  totalBets: number;
  winRate: number;
  totalProfit: number;
  averageROI: number;
  profitByMonth: { month: string; profit: number }[];
  profitByStrategy: { strategy: string; profit: number }[];
}
type TableFilterMode = "today" | "all";
type ResultFilter = "all" | "Win" | "Loss" | "Pending";
type PeriodFilter = "all" | "week" | "month" | "quarter";
type SortBy = "date" | "profit" | "odds";

const DEFAULT_STATS: BetStats = {
  totalBets: 0,
  winRate: 0,
  totalProfit: 0,
  averageROI: 0,
  profitByMonth: [],
  profitByStrategy: [],
};

export default function MyBets() {
  logRender("MyBets");
  const { user } = useAuth();
  const currentUser = user?.username || "";
  const isAdminRole = user?.role === "admin";
  const location = useLocation();
  const bumpBankroll = useAppStore((s) => s.bumpBankroll);
  const bumpBets = useAppStore((s) => s.bumpBets);
  const bankrollVersion = useAppStore((s) => s.bankrollVersion);

  // ── State ──
  const [stats, setStats] = useState<BetStats>(DEFAULT_STATS);
  const [recentBets, setRecentBets] = useState<Bet[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [expressModalOpen, setExpressModalOpen] = useState(false);
  const [betDetailsModalOpen, setBetDetailsModalOpen] = useState(false);
  const [selectedExpressBet, setSelectedExpressBet] = useState<Bet | null>(
    null,
  );
  const [resultNoteOpen, setResultNoteOpen] = useState(false);
  const [resultNote, setResultNote] = useState("");
  const [pendingResultAction, setPendingResultAction] = useState<{
    bet: Bet;
    result: "Win" | "Loss";
  } | null>(null);
  const [selectedExpressEvents, setSelectedExpressEvents] = useState<
    ParsedEvent[]
  >([]);
  const [confettiKey, setConfettiKey] = useState(0);
  const [selectedDetailsBet, setSelectedDetailsBet] = useState<Bet | null>(
    null,
  );
  const [deleteDialogBet, setDeleteDialogBet] = useState<Bet | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [activeTab, setActiveTab] = useState("add");
  const [bankrollRefreshKey, setBankrollRefreshKey] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [prefillData, setPrefillData] = useState<MatchPrefillData | null>(null);
  const [expressMatchesData, setExpressMatchesData] = useState<
    MatchPrefillData[] | null
  >(null);
  const [tableFilter, setTableFilter] = useState<TableFilterMode>("all");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currencyMode, setCurrencyMode] = useState<"UAH" | "USD">("UAH");
  const [dualBank, setDualBank] = useState<DualBankrollStats>({
    uah: { initialBank: 0, currentBank: 0, totalProfit: 0, roi: 0 },
    usd: { initialBank: 0, currentBank: 0, totalProfit: 0, roi: 0 },
  });

  // Ref to avoid stale closure in result update callbacks
  const recentBetsRef = useRef(recentBets);
  recentBetsRef.current = recentBets;

  // ── Derived ──
  const { activeBets, winningBets, losingBets } = useMemo(() => {
    const active: Bet[] = [];
    const winning: Bet[] = [];
    const losing: Bet[] = [];
    for (const b of recentBets) {
      if (b.result === "Pending") active.push(b);
      else if (b.result === "Win") winning.push(b);
      else if (b.result === "Loss") losing.push(b);
    }
    return { activeBets: active, winningBets: winning, losingBets: losing };
  }, [recentBets]);

  const isBankrollInitialized = useMemo(
    () => BankrollService.isInitialized(currentUser),
    [currentUser, bankrollRefreshKey],
  );

  // ── Currency breakdown ──
  const hasUsdBets = useMemo(
    () =>
      recentBets.some((b) => b.currency === "USD") ||
      dualBank.usd.initialBank > 0,
    [recentBets, dualBank.usd.initialBank],
  );

  // ── Effects ──
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key?.includes("bankroll_") && e.key.includes(currentUser))
        setBankrollRefreshKey((p) => p + 1);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [currentUser]);

  useEffect(() => {
    setBankrollRefreshKey((p) => p + 1);
  }, [bankrollVersion]);

  useEffect(() => {
    const state = location.state as {
      prefillMatch?: MatchPrefillData;
      expressMatches?: MatchPrefillData[];
    } | null;
    if (state?.expressMatches && state.expressMatches.length >= 2) {
      setExpressMatchesData(state.expressMatches);
      setActiveTab("add");
      window.history.replaceState({}, document.title);
    } else if (state?.prefillMatch) {
      setPrefillData(state.prefillMatch);
      setActiveTab("add");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const initBankroll = async () => {
      const allBets = UserDataService.getUserData<Bet[]>(
        currentUser,
        "mybets_data",
        [],
      );
      setDualBank(BankrollService.getBankrollStatsDual(currentUser, allBets));
    };
    initBankroll();
  }, [currentUser]);
  useEffect(() => {
    const refresh = async () => {
      const allBets = UserDataService.getUserData<Bet[]>(
        currentUser,
        "mybets_data",
        [],
      );
      setDualBank(BankrollService.getBankrollStatsDual(currentUser, allBets));
    };
    refresh();
  }, [bankrollRefreshKey, bankrollVersion, currentUser]);
  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchUsers(), loadRecentBets()]);
    };
    init();
  }, []);
  useEffect(() => {
    if (users.length && currentUser) {
      const u = users.find(
        (x) => x.username.toLowerCase() === currentUser.toLowerCase(),
      );
      setIsAdmin(u?.isAdmin || false);
    }
  }, [users, currentUser]);
  useEffect(() => {
    if (currentUser) UserDataService.checkAndResetDailyBets(currentUser);
  }, [currentUser]);
  // Stats & bets are API-first now — no localStorage sync needed.
  useEffect(() => {
    setCurrentPage(1);
  }, [tableFilter, resultFilter, periodFilter, sortBy, sortOrder, searchText]);

  // ── Data fetching ──
  const fetchUsers = async () => {
    try {
      const allUsers = await authService.fetchUsers();
      const parsed: UserRecord[] = allUsers
        .filter((u) => u.username)
        .map((u) => ({
          telegram: u.telegram,
          username: u.username,
          isAdmin:
            (u as { role?: string }).role === "admin" ||
            (u as { isAdmin?: string }).isAdmin === "так",
        }));
      setUsers(parsed);
    } catch (err) {
      if (import.meta.env.DEV) console.error("Error fetching users:", err);
      toast.error("Помилка завантаження списку користувачів");
    }
  };

  const loadStats = useCallback(async () => {
    try {
      const data = await UserDataService.fetchBetStats();
      setStats(data.totalBets > 0 ? data : { ...DEFAULT_STATS, ...data });
    } catch {
      setStats(DEFAULT_STATS);
    }
  }, []);

  const syncStats = useCallback(() => {
    const allBets = recentBetsRef.current;
    const completed = allBets.filter(
      (b) => b.result === "Win" || b.result === "Loss",
    );
    const wins = completed.filter((b) => b.result === "Win").length;
    const totalProfit = completed.reduce((sum, b) => sum + (b.profit || 0), 0);
    setStats({
      totalBets: allBets.length,
      winRate:
        completed.length > 0 ? Math.round((wins / completed.length) * 100) : 0,
      totalProfit: Math.round(totalProfit * 100) / 100,
      averageROI:
        completed.length > 0
          ? Math.round(
              (completed.reduce((sum, b) => sum + (b.roi || 0), 0) /
                completed.length) *
                100,
            ) / 100
          : 0,
      profitByMonth: [],
      profitByStrategy: [],
    });
  }, [recentBets]);

  const loadRecentBets = useCallback(async () => {
    try {
      const bets = await UserDataService.fetchBets();
      setRecentBets(bets as Bet[]);
      return;
    } catch {
      /* noop */
    }
    // Fallback to localStorage when API is unavailable
    const localBets = UserDataService.getUserData(
      currentUser,
      "mybets_data",
      [],
    );
    setRecentBets(localBets as Bet[]);
  }, [currentUser, bankrollVersion]);

  // Recompute stats whenever bets change
  useEffect(() => {
    if (recentBets.length > 0) syncStats();
  }, [recentBets, syncStats]);

  // ── Handlers ──
  const handleRecordAdded = useCallback(() => {
    // Read fresh from localStorage (which CS2BettingForm just updated)
    const localBets = UserDataService.getUserData<Bet[]>(
      currentUser,
      "mybets_data",
      [],
    );
    if (localBets.length > 0) {
      setRecentBets(localBets);
    }
    bumpBets();
    bumpBankroll();
  }, [currentUser, bumpBets, bumpBankroll]);

  const clearRecentBets = useCallback(async () => {
    if (
      !window.confirm(
        "Ви впевнені, що хочете очистити ВСІ дані (ставки, цілі, стратегії, групи, банкрол)?",
      )
    )
      return;

    let apiOk = false;
    try {
      const body = await api.post<{
        success: boolean;
        counts: Record<string, number>;
      }>("/admin/reset", {});
      apiOk = body.success;
      if (import.meta.env.DEV) console.log("[Reset] API OK:", body.counts);
    } catch (err: unknown) {
      if (import.meta.env.DEV)
        console.error(
          "[Reset] Error:",
          err instanceof Error ? err.message : err,
        );
    }

    // Always clear localStorage (regardless of API result)
    [
      "mybets_data",
      "mybets_stats",
      "analytics_bets",
      "analytics_stats",
      "goals",
      "strategies_data",
      "primary_strategy",
      "tg_groups",
      "tg_bets",
      "bankroll_data",
    ].forEach((k) => UserDataService.clearUserData(currentUser, k));

    // Reset state
    BankrollService.setInitialBank(currentUser, 0);
    setRecentBets([]);
    setStats(DEFAULT_STATS);
    setBankrollRefreshKey((p) => p + 1);
    useAppStore.getState().bumpBets();
    useAppStore.getState().bumpStrategy();
    useAppStore.getState().bumpBankroll();

    if (apiOk) {
      toast.success(
        "✅ Всі дані очищено — ставки, цілі, стратегії, групи, банкрол",
      );
    } else {
      toast.error(
        "⚠️ Дані очищено локально, але сервер повернув помилку. Перевір консоль (F12).",
      );
    }
    setTimeout(() => {
      loadStats();
      loadRecentBets();
    }, 200);
  }, [currentUser, loadStats, loadRecentBets]);

  const executeResultUpdate = useCallback(
    async (bet: Bet, result: "Win" | "Loss", note: string = "") => {
      try {
        const betAmount = bet.originalAmount || bet.amount;
        const originalProfit =
          result === "Win" ? (bet.odds - 1) * betAmount : -betAmount;
        const profitInUAH =
          bet.currency === "USD" && bet.exchangeRate
            ? originalProfit * bet.exchangeRate
            : originalProfit;
        const roi = (profitInUAH / bet.amount) * 100;
        // Add notes to the bet before updating (only for losses with notes)
        const resultLabel = result === "Win" ? "Виграш" : "Програш";
        const betWithNotes = note.trim()
          ? {
              ...bet,
              notes: bet.notes
                ? `${bet.notes}\nРезультат: ${resultLabel}`
                : `Результат: ${resultLabel}\nКоментар: ${note.trim()}`,
            }
          : bet;
        // Try API PATCH first
        try {
          await api.patch(`/bets/${bet.id}`, {
            result,
            profit: profitInUAH,
            roi,
            notes: betWithNotes.notes,
          });
        } catch {
          if (import.meta.env.DEV)
            console.warn("[API] PATCH failed, saving locally");
        }
        // Update localStorage cache for offline resilience
        try {
          const localBets = UserDataService.getUserData(
            currentUser,
            "mybets_data",
            [],
          );
          UserDataService.setUserDataSync(
            currentUser,
            "mybets_data",
            localBets.map((b: Bet) => {
              if (
                (bet.id && b.id === bet.id) ||
                (bet.createdAt && b.createdAt === bet.createdAt) ||
                (!bet.id &&
                  !bet.createdAt &&
                  b.date === bet.date &&
                  b.match === bet.match)
              ) {
                return {
                  ...b,
                  result,
                  profit: profitInUAH,
                  roi,
                  notes: betWithNotes.notes || b.notes,
                };
              }
              return b;
            }),
          );
        } catch {
          /* ignore */
        }
        let matched = false;
        setRecentBets((prev) =>
          prev.map((b) => {
            if (matched) return b;
            if (
              (bet.id && b.id === bet.id) ||
              (bet.createdAt && b.createdAt === bet.createdAt) ||
              (!bet.id &&
                !bet.createdAt &&
                b.date === bet.date &&
                b.match === bet.match &&
                b.amount === bet.amount &&
                b.odds === bet.odds &&
                b.result === "Pending")
            ) {
              matched = true;
              return {
                ...b,
                result,
                profit: profitInUAH,
                originalProfit,
                roi,
                goalId: b.goalId,
                notes: betWithNotes.notes || b.notes,
              };
            }
            return b;
          }),
        );
        toast.success(
          `Запис позначено як ${result === "Win" ? "виграшний" : "програшний"}`,
        );
        if (result === "Win") setConfettiKey((k) => k + 1);
        if (note.trim())
          toast("Нотатку додано до запису", { description: note.trim() });
        loadStats();
        syncStats();
        bumpBankroll();
        // Compute bankroll from all bets — don't wait for next render
        const allBets = UserDataService.getUserData<Bet[]>(
          currentUser,
          "mybets_data",
          [],
        );
        setDualBank(BankrollService.getBankrollStatsDual(currentUser, allBets));
      } catch {
        toast.error("Помилка при оновленні результату");
      }
    },
    [currentUser, bumpBankroll, syncStats],
  );

  const updateBetResult = useCallback(
    async (bet: Bet, result: "Win" | "Loss") => {
      if (result === "Loss") {
        setPendingResultAction({ bet, result });
        setResultNote("");
        setResultNoteOpen(true);
        return;
      }
      // Win — mark directly without notes dialog
      await executeResultUpdate(bet, result);
    },
    [executeResultUpdate],
  );

  const skipResultNote = useCallback(async () => {
    if (!pendingResultAction) return;
    const { bet, result } = pendingResultAction;
    await executeResultUpdate(bet, result, "");
    setResultNoteOpen(false);
    setPendingResultAction(null);
    setResultNote("");
  }, [pendingResultAction, executeResultUpdate]);

  const confirmResultUpdate = useCallback(async () => {
    if (!pendingResultAction) return;
    const { bet, result } = pendingResultAction;
    await executeResultUpdate(bet, result, resultNote);
    setResultNoteOpen(false);
    setPendingResultAction(null);
    setResultNote("");
  }, [pendingResultAction, executeResultUpdate, resultNote]);

  const handleShareBet = useCallback((bet: Bet) => {
    setSelectedBet(bet);
    setShareModalOpen(true);
  }, []);
  const handleBankModalClose = useCallback(
    (success: boolean) => {
      setBankModalOpen(false);
      if (success) {
        setBankrollRefreshKey((p) => p + 1);
        bumpBankroll();
      }
    },
    [bumpBankroll],
  );

  const handleExpressDetails = useCallback((bet: Bet) => {
    setSelectedExpressBet(bet);
    setSelectedExpressEvents(parseExpressEvents(bet.betType));
    setExpressModalOpen(true);
  }, []);
  const handleBetDetails = useCallback((bet: Bet) => {
    setSelectedDetailsBet(bet);
    setBetDetailsModalOpen(true);
  }, []);

  const handleDeleteBet = useCallback((bet: Bet) => {
    setDeleteDialogBet(bet);
  }, []);

  const confirmDeleteBet = useCallback(async () => {
    if (!deleteDialogBet) return;
    const bet = deleteDialogBet;
    setDeleteDialogBet(null);
    try {
      await api.delete(`/bets/${bet.id}`);
    } catch {
      if (import.meta.env.DEV)
        console.warn("[API] DELETE failed, removed locally only");
    }

    // Remove from localStorage cache immediately
    try {
      const localBets = UserDataService.getUserData<Bet[]>(
        currentUser,
        "mybets_data",
        [],
      );
      UserDataService.setUserDataSync(
        currentUser,
        "mybets_data",
        localBets.filter(
          (b: Bet) =>
            b.id !== bet.id &&
            !(
              b.date === bet.date &&
              b.match === bet.match &&
              b.amount === bet.amount
            ),
        ),
      );
    } catch {
      /* ignore */
    }

    // Remove from state — match by id OR by date+match+amount (for localStorage bets without id)
    setRecentBets((prev) =>
      prev.filter(
        (b) =>
          !(b.id && bet.id && b.id === bet.id) &&
          !(
            b.date === bet.date &&
            b.match === bet.match &&
            b.amount === bet.amount
          ),
      ),
    );
    bumpBets();
    bumpBankroll();
    syncStats();
    toast.success("Ставку видалено");
  }, [
    deleteDialogBet,
    currentUser,
    bumpBets,
    bumpBankroll,
    syncStats,
    loadRecentBets,
  ]);

  // ── UI ──
  const tabs = [
    { id: "add", label: "Додати запис", icon: Plus },
    { id: "records", label: "Останні записи", icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-[#f3f3f3] relative">
      <Confetti
        key={confettiKey}
        particleCount={80}
        spread={90}
        origin={{ x: 0.5, y: 0.3 }}
        className="pointer-events-none fixed inset-0 z-[9999]"
      />
      <PageHeader
        title="Додати запис"
        currentUser={currentUser || "User"}
        isDarkTheme={isDarkTheme}
        onToggleTheme={toggleTheme}
        showThemeToggle={false}
        showCurrencySwitch={true}
        currencyMode={currencyMode}
        onCurrencyChange={setCurrencyMode}
        hasUsdBets={hasUsdBets}
      />

      <div className="relative z-10 space-y-8 px-6 lg:px-8 pb-8 pt-4">
        <MyBetsStatsCards
          recentBets={recentBets}
          stats={stats}
          dualBank={dualBank}
          currencyMode={currencyMode}
          activeBets={activeBets}
          winningBets={winningBets}
          losingBets={losingBets}
          onEditBank={() => setBankModalOpen(true)}
        />

        {/* Recent results Marquee ticker */}
        {recentBets.filter((b) => b.result !== "Pending").length > 0 && (
          <Marquee pauseOnHover className="[--duration:40s] py-2">
            {recentBets
              .filter((b) => b.result !== "Pending")
              .slice(0, 10)
              .map((bet, i) => (
                <span
                  key={bet.id || i}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                    bet.result === "Win"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {bet.result === "Win" ? "✅" : "✕"}{" "}
                  {bet.match?.substring(0, 30)}
                  {bet.profit != null && (
                    <span className="tabular-nums">
                      {bet.profit >= 0 ? "+" : ""}
                      {bet.profit.toFixed(0)}₴
                    </span>
                  )}
                </span>
              ))}
          </Marquee>
        )}

        {/* Tabs */}
        <div className="space-y-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-3 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
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
                    className={`relative rounded-[24px] px-6 py-4 font-light text-base transition-all duration-300 ${activeTab === tab.id ? "bg-[#447afc] text-white font-medium shadow-[0_4px_16px_rgba(68,122,252,0.3)] border border-transparent" : "bg-transparent text-[#9CA3AF] hover:bg-[#F5F5F3] hover:text-[#6B7280] border border-transparent"}`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === "records" && (
            <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <BetTable
                bets={recentBets}
                activeBets={activeBets}
                currentUser={currentUser}
                isAdmin={isAdmin}
                onNavigateToAdd={() => setActiveTab("add")}
                tableFilter={tableFilter}
                onTableFilterChange={setTableFilter}
                showAdvancedFilters={showAdvancedFilters}
                onToggleAdvancedFilters={() =>
                  setShowAdvancedFilters(!showAdvancedFilters)
                }
                resultFilter={resultFilter}
                onResultFilterChange={setResultFilter}
                periodFilter={periodFilter}
                onPeriodFilterChange={setPeriodFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                searchText={searchText}
                onSearchTextChange={setSearchText}
                onShareBet={handleShareBet}
                onBetDetails={handleBetDetails}
                onExpressDetails={handleExpressDetails}
                onUpdateResult={updateBetResult}
                onDeleteBet={handleDeleteBet}
              />
            </div>
          )}
          {activeTab === "add" && (
            <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <CS2BettingForm
                onRecordAdded={handleRecordAdded}
                prefillData={prefillData}
                onPrefillConsumed={() => setPrefillData(null)}
                expressMatchesData={expressMatchesData}
                onExpressMatchesConsumed={() => setExpressMatchesData(null)}
              />
            </div>
          )}
          {activeTab === "strategies" && (
            <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <StrategyOverview />
            </div>
          )}
        </div>

        <InitialBankModal
          open={bankModalOpen}
          onClose={handleBankModalClose}
          mode={isBankrollInitialized ? "edit" : "setup"}
        />

        {selectedBet && (
          <BetShareModal
            bet={selectedBet}
            open={shareModalOpen}
            onClose={() => {
              setShareModalOpen(false);
              setSelectedBet(null);
            }}
          />
        )}
        {selectedExpressBet && (
          <ExpressDetailsModal
            bet={selectedExpressBet}
            open={expressModalOpen}
            onClose={() => {
              setExpressModalOpen(false);
              setSelectedExpressBet(null);
              setSelectedExpressEvents([]);
            }}
            parsedEvents={selectedExpressEvents}
          />
        )}
        {selectedDetailsBet && (
          <BetDetailsModal
            bet={selectedDetailsBet}
            open={betDetailsModalOpen}
            onClose={() => {
              setBetDetailsModalOpen(false);
              setSelectedDetailsBet(null);
            }}
          />
        )}

        {/* Result Note Dialog — opens when marking bet result */}
        <ResultNoteDialog
          open={resultNoteOpen}
          resultNote={resultNote}
          onResultNoteChange={setResultNote}
          pendingAction={pendingResultAction}
          onConfirm={confirmResultUpdate}
          onSkip={skipResultNote}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteBetDialog
          bet={deleteDialogBet}
          onConfirm={confirmDeleteBet}
          onClose={() => setDeleteDialogBet(null)}
        />
      </div>
    </div>
  );
}
