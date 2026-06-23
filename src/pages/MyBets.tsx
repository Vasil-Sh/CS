import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import CS2BettingForm from '@/components/CS2BettingForm';
import type { MatchPrefillData } from '@/components/CS2BettingForm';
import StrategyOverview from '@/components/StrategyOverview';
import BetShareModal from '@/components/BetShareModal';
import ExpressDetailsModal from '@/components/ExpressDetailsModal';
import BetDetailsModal from '@/components/BetDetailsModal';import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';import InitialBankModal from '@/components/InitialBankModal';
import StatCard from '@/components/StatCard';
import BetTable from '@/components/BetTable';
import { realGoogleSheetsService } from '@/lib/realGoogleSheets';
import { UserDataService } from '@/lib/userDataService';
import { BankrollService } from '@/lib/bankrollService';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/stores/appStore';
import { authService } from '@/lib/authService';
import { parseExpressEvents, type ParsedEvent } from '@/lib/parser/expressParser';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { logRender } from '@/lib/devLogger';
import { PageHeader } from '@/components/PageHeader';
import {
  TrendingUp, DollarSign, Target, BarChart3, Trophy,
  AlertTriangle, Clock, Plus, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, Sun, Moon, User, Trash2, Wallet, ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Bet } from '@/types/betting';

// ── Types ──
interface UserRecord { telegram: string; username: string; isAdmin?: boolean; }
interface BetStats { totalBets: number; winRate: number; totalProfit: number; averageROI: number; profitByMonth: { month: string; profit: number }[]; profitByStrategy: { strategy: string; profit: number }[]; }
type TableFilterMode = 'today' | 'all';
type ResultFilter = 'all' | 'Win' | 'Loss' | 'Pending';
type PeriodFilter = 'all' | 'week' | 'month' | 'quarter';
type SortBy = 'date' | 'profit' | 'odds';

const DEFAULT_STATS: BetStats = { totalBets: 0, winRate: 0, totalProfit: 0, averageROI: 0, profitByMonth: [], profitByStrategy: [] };

export default function MyBets() {
  logRender('MyBets');
  const { user } = useAuth();
  const currentUser = user?.username || '';
  const isAdminRole = user?.role === 'admin';
  const location = useLocation();
  const bumpBankroll = useAppStore((s) => s.bumpBankroll);
  const bumpBets = useAppStore((s) => s.bumpBets);
  const bankrollVersion = useAppStore((s) => s.bankrollVersion);

  // ── State ──
  const [stats, setStats] = useState<BetStats>(() => UserDataService.getUserData(currentUser, 'mybets_stats', DEFAULT_STATS));
  const [recentBets, setRecentBets] = useState<Bet[]>(() => UserDataService.getUserData(currentUser, 'mybets_data', []));
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [expressModalOpen, setExpressModalOpen] = useState(false);
  const [betDetailsModalOpen, setBetDetailsModalOpen] = useState(false);
  const [selectedExpressBet, setSelectedExpressBet] = useState<Bet | null>(null);  const [resultNoteOpen, setResultNoteOpen] = useState(false);
  const [resultNote, setResultNote] = useState('');
  const [pendingResultAction, setPendingResultAction] = useState<{ bet: Bet; result: 'Win' | 'Loss' } | null>(null);  const [selectedExpressEvents, setSelectedExpressEvents] = useState<ParsedEvent[]>([]);
  const [selectedDetailsBet, setSelectedDetailsBet] = useState<Bet | null>(null);
  const [deleteDialogBet, setDeleteDialogBet] = useState<Bet | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [activeTab, setActiveTab] = useState('add');
  const [bankrollRefreshKey, setBankrollRefreshKey] = useState(0);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDarkTheme = theme === 'dark';
  const [prefillData, setPrefillData] = useState<MatchPrefillData | null>(null);
  const [expressMatchesData, setExpressMatchesData] = useState<MatchPrefillData[] | null>(null);
  const [tableFilter, setTableFilter] = useState<TableFilterMode>('all');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [bankrollStats, setBankrollStats] = useState({ initialBank: 0, currentBank: 0, totalProfit: 0, roi: 0 });

  // ── Derived ──
  const { activeBets, winningBets, losingBets } = useMemo(() => ({
    activeBets: recentBets.filter((b: Bet) => b.result === 'Pending'),
    winningBets: recentBets.filter((b: Bet) => b.result === 'Win'),
    losingBets: recentBets.filter((b: Bet) => b.result === 'Loss'),
  }), [recentBets]);

  const isBankrollInitialized = useMemo(() => BankrollService.isInitialized(currentUser), [currentUser, bankrollRefreshKey]);

  // ── Effects ──
  useEffect(() => {
    const handler = (e: StorageEvent) => { if (e.key?.includes('bankroll_') && e.key.includes(currentUser)) setBankrollRefreshKey(p => p + 1); };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [currentUser]);

  useEffect(() => { setBankrollRefreshKey(p => p + 1); }, [bankrollVersion]);

  useEffect(() => {
    const state = location.state as { prefillMatch?: MatchPrefillData; expressMatches?: MatchPrefillData[] } | null;
    if (state?.expressMatches && state.expressMatches.length >= 2) { setExpressMatchesData(state.expressMatches); setActiveTab('add'); window.history.replaceState({}, document.title); }
    else if (state?.prefillMatch) { setPrefillData(state.prefillMatch); setActiveTab('add'); window.history.replaceState({}, document.title); }
  }, [location.state]);

  useEffect(() => { 
    const allBets = UserDataService.getUserData(currentUser, 'mybets_data', []);
    setBankrollStats(BankrollService.getBankrollStats(currentUser, allBets)); 
  }, [currentUser, recentBets, bankrollRefreshKey]);
  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { if (users.length && currentUser) { const u = users.find(x => x.username.toLowerCase() === currentUser.toLowerCase()); setIsAdmin(u?.isAdmin || false); } }, [users, currentUser]);
  useEffect(() => { if (currentUser) UserDataService.checkAndResetDailyBets(currentUser); }, [currentUser]);
  useEffect(() => { loadStats(); loadRecentBets(); }, []);
  useEffect(() => { if (currentUser) { UserDataService.setUserData(currentUser, 'mybets_stats', stats); UserDataService.setUserData(currentUser, 'mybets_data', recentBets); } }, [stats, recentBets, currentUser]);
  useEffect(() => { setCurrentPage(1); }, [tableFilter, resultFilter, periodFilter, sortBy, sortOrder, searchText]);
  useEffect(() => { const h = () => setShowActionsMenu(false); if (showActionsMenu) { document.addEventListener('click', h); return () => document.removeEventListener('click', h); } }, [showActionsMenu]);

  // ── Data fetching ──
  const fetchUsers = async () => {
    try {
      const allUsers = await authService.fetchUsers();
      const parsed: UserRecord[] = allUsers
        .filter(u => u.username)
        .map(u => ({
          telegram: u.telegram,
          username: u.username,
          isAdmin: u.isAdmin === 'так' || u.isAdmin === 'yes' || u.isAdmin === 'true' || u.isAdmin === '1',
        }));
      setUsers(parsed);
    } catch (err) { console.error('Error fetching users:', err); }
  };

  const loadStats = useCallback(async () => {
    try { const data = await realGoogleSheetsService.getBettingStatistics(); setStats(data.totalBets > 0 ? data : UserDataService.getUserData(currentUser, 'mybets_stats', DEFAULT_STATS)); }
    catch { setStats(UserDataService.getUserData(currentUser, 'mybets_stats', DEFAULT_STATS)); }
  }, [currentUser]);

  const syncBankrollStats = useCallback(() => {
    const allBets = UserDataService.getUserData(currentUser, 'mybets_data', []);
    setBankrollStats(BankrollService.getBankrollStats(currentUser, allBets));
  }, [currentUser]);

  const syncStats = useCallback(() => {
    const allBets = UserDataService.getUserData(currentUser, 'mybets_data', []);
    const completed = allBets.filter((b: any) => b.result === 'Win' || b.result === 'Loss');
    const wins = completed.filter((b: any) => b.result === 'Win').length;
    const totalProfit = completed.reduce((sum: number, b: any) => sum + (b.profit || 0), 0);
    setStats({
      totalBets: allBets.length,
      winRate: completed.length > 0 ? Math.round((wins / completed.length) * 100) : 0,
      totalProfit: Math.round(totalProfit * 100) / 100,
      averageROI: completed.length > 0
        ? Math.round((completed.reduce((sum: number, b: any) => sum + (b.roi || 0), 0) / completed.length) * 100) / 100
        : 0,
      profitByMonth: [],
      profitByStrategy: [],
    });
  }, [currentUser]);

  const loadRecentBets = useCallback(async () => {
    try { const data = await realGoogleSheetsService.fetchUSDTData(); setRecentBets(data.length > 0 ? data : UserDataService.getUserData(currentUser, 'mybets_data', [])); }
    catch { setRecentBets(UserDataService.getUserData(currentUser, 'mybets_data', [])); }
  }, [currentUser]);

  // ── Handlers ──
  const handleRecordAdded = useCallback(() => { syncStats(); loadRecentBets(); syncBankrollStats(); bumpBets(); bumpBankroll(); }, [loadRecentBets, bumpBets, bumpBankroll, syncBankrollStats, syncStats]);

  const clearRecentBets = useCallback(async () => {
    if (!window.confirm('Ви впевнені, що хочете очистити всі дані?')) return;
    try {
      await realGoogleSheetsService.clearAllData();
      ['mybets_data','mybets_stats','analytics_bets','analytics_stats'].forEach(k => UserDataService.clearUserData(currentUser, k));
      BankrollService.setInitialBank(currentUser, 0);
      setRecentBets([]); setStats(DEFAULT_STATS); setBankrollRefreshKey(p => p + 1);
      toast.success('Всі дані очищено');
      setTimeout(() => { loadStats(); loadRecentBets(); }, 100);
    } catch { toast.error('Помилка при очищенні даних'); }
  }, [currentUser, loadStats, loadRecentBets]);

  const executeResultUpdate = useCallback(async (bet: Bet, result: 'Win' | 'Loss', note: string = '') => {
    try {
      const betAmount = bet.originalAmount || bet.amount;
      const originalProfit = result === 'Win' ? (bet.odds - 1) * betAmount : -betAmount;
      const profitInUAH = bet.currency === 'USD' && bet.exchangeRate ? originalProfit * bet.exchangeRate : originalProfit;
      const roi = (profitInUAH / bet.amount) * 100;
      // Add notes to the bet before updating (only for losses with notes)
      const resultLabel = result === 'Win' ? 'Виграш' : 'Програш';
      const betWithNotes = note.trim() ? { ...bet, notes: bet.notes ? `${bet.notes}\nРезультат: ${resultLabel}` : `Результат: ${resultLabel}\nКоментар: ${note.trim()}` } : bet;
      await realGoogleSheetsService.updateBetResult(betWithNotes, result, profitInUAH, roi);
      let matched = false;
      setRecentBets(prev => prev.map(b => {
        if (matched) return b;
        if ((bet.id && b.id === bet.id) || (bet.createdAt && b.createdAt === bet.createdAt) ||
            (!bet.id && !bet.createdAt && b.date === bet.date && b.match === bet.match && b.amount === bet.amount && b.odds === bet.odds && b.result === 'Pending')) {
          matched = true;
          return { ...b, result, profit: profitInUAH, originalProfit, roi, goalId: b.goalId, notes: betWithNotes.notes || b.notes };
        }
        return b;
      }));
      toast.success(`Запис позначено як ${result === 'Win' ? 'виграшний' : 'програшний'}`);
      if (note.trim()) toast('Нотатку додано до запису', { description: note.trim() });
      loadStats();
      syncBankrollStats();
      syncStats();
      bumpBankroll();
    } catch { toast.error('Помилка при оновленні результату'); }
  }, [currentUser, bumpBankroll, syncBankrollStats, syncStats]);

  const updateBetResult = useCallback(async (bet: Bet, result: 'Win' | 'Loss') => {
    if (result === 'Loss') {
      setPendingResultAction({ bet, result });
      setResultNote('');
      setResultNoteOpen(true);
      return;
    }
    // Win — mark directly without notes dialog
    await executeResultUpdate(bet, result);
  }, [executeResultUpdate]);

  const skipResultNote = useCallback(async () => {
    if (!pendingResultAction) return;
    const { bet, result } = pendingResultAction;
    await executeResultUpdate(bet, result, '');
    setResultNoteOpen(false);
    setPendingResultAction(null);
    setResultNote('');
  }, [pendingResultAction, executeResultUpdate]);

  const confirmResultUpdate = useCallback(async () => {
    if (!pendingResultAction) return;
    const { bet, result } = pendingResultAction;
    await executeResultUpdate(bet, result, resultNote);
    setResultNoteOpen(false);
    setPendingResultAction(null);
    setResultNote('');
  }, [pendingResultAction, executeResultUpdate, resultNote]);

  const handleShareBet = useCallback((bet: Bet) => { setSelectedBet(bet); setShareModalOpen(true); }, []);
  const handleBankModalClose = useCallback((success: boolean) => { setBankModalOpen(false); if (success) { setBankrollRefreshKey(p => p + 1); bumpBankroll(); } }, [bumpBankroll]);

  const handleExpressDetails = useCallback((bet: Bet) => { setSelectedExpressBet(bet); setSelectedExpressEvents(parseExpressEvents(bet.betType)); setExpressModalOpen(true); }, []);
  const handleBetDetails = useCallback((bet: Bet) => { console.log('handleBetDetails called', bet.team1, bet.team2); setSelectedDetailsBet(bet); setBetDetailsModalOpen(true); }, []);

  const handleDeleteBet = useCallback((bet: Bet) => {
    setDeleteDialogBet(bet);
  }, []);

  const confirmDeleteBet = useCallback(async () => {
    if (!deleteDialogBet) return;
    const bet = deleteDialogBet;
    setDeleteDialogBet(null);
    await realGoogleSheetsService.deleteRecord(bet);
    syncBankrollStats();
    syncStats();
    setRecentBets(prev => prev.filter(b => b.id !== bet.id && !(b.date === bet.date && b.match === bet.match && b.amount === bet.amount)));
    bumpBets();
    bumpBankroll();
    toast.success('Ставку видалено');
  }, [deleteDialogBet, bumpBets, bumpBankroll, syncBankrollStats, syncStats]);

  // ── UI ──
  const tabs = [
    { id: 'add', label: 'Додати запис', icon: Plus },
    { id: 'records', label: 'Останні записи', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-[#f3f3f3] relative">
      <PageHeader
        title="Додати запис"
        currentUser={currentUser || 'User'}
        isDarkTheme={isDarkTheme}
        onToggleTheme={toggleTheme}
        showActionsMenu
        actionsMenuOpen={showActionsMenu}
        onToggleActionsMenu={() => setShowActionsMenu(!showActionsMenu)}
        actionsMenuContent={
          <div className="absolute right-0 top-11 bg-white rounded-xl border border-[#E5E7EB] py-1 min-w-[180px] z-50" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <button onClick={() => { clearRecentBets(); setShowActionsMenu(false); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#FEF2F2]"><Trash2 className="h-4 w-4" strokeWidth={1.5} />Очистити всі дані</button>
          </div>
        }
      />

      <div className="relative z-10 space-y-8 px-6 lg:px-8 pb-8 pt-4">
        {/* Stats Row 1 */}
        <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard icon={<div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF]"><Wallet className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} /></div>} label="Поточний банк" value={`${bankrollStats.currentBank.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴`} subtext={`${stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(2)} ₴ за весь час`} subIcon={stats.totalProfit >= 0 ? <ArrowUpRight className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} /> : <ArrowDownRight className="h-4 w-4 text-[#EF4444]" strokeWidth={2.5} />} trend={stats.totalProfit >= 0 ? 'up' : 'down'} />
          <StatCard icon={<div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF]"><DollarSign className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} /></div>} label="Профіт" value={`${(stats.totalProfit || 0) >= 0 ? '+' : ''}${(stats.totalProfit || 0).toFixed(2)} ₴`} valueColor={(stats.totalProfit || 0) >= 0 ? 'text-[#111827]' : 'text-[#EF4444]'} subtext={(stats.totalProfit || 0) >= 0 ? 'Позитивна динаміка' : 'Негативна динаміка'} subIcon={(stats.totalProfit || 0) >= 0 ? <ArrowUpRight className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} /> : <ArrowDownRight className="h-4 w-4 text-[#EF4444]" strokeWidth={2.5} />} trend={(stats.totalProfit || 0) >= 0 ? 'up' : 'down'} />
          <StatCard icon={<div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF]"><BarChart3 className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} /></div>} label="Всього записів" value={String(stats.totalBets)} subtext={activeBets.length > 0 ? `${activeBets.length} активних` : 'Немає активних'} />
          <StatCard icon={<div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF]"><Target className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} /></div>} label="Вінрейт" value={`${stats.winRate}%`} subtext={`${winningBets.length}W / ${losingBets.length}L`} />
        </div>

        {/* Stats Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <StatCard icon={<div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF]"><Clock className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} /></div>} label="Активні" value={String(activeBets.length)} valueColor="text-[#3B82F6]" subtext="Очікують результату" />
          <StatCard icon={<div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF]"><Trophy className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} /></div>} label="Виграші" value={String(winningBets.length)} valueColor="text-[#22C55E]" subtext="Успішних записів" trend="up" />
          <StatCard icon={<div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF]"><AlertTriangle className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} /></div>} label="Програші" value={String(losingBets.length)} valueColor="text-[#EF4444]" subtext="Невдалих записів" trend="down" />
          <StatCard icon={<div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF]"><TrendingUp className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} /></div>} label="Середній ROI" value={`${stats.averageROI >= 0 ? '+' : ''}${stats.averageROI}%`} valueColor={stats.averageROI >= 0 ? 'text-[#111827]' : 'text-[#EF4444]'} subtext={stats.averageROI >= 0 ? 'Позитивний' : 'Негативний'} subIcon={stats.averageROI >= 0 ? <ArrowUpRight className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} /> : <ArrowDownRight className="h-4 w-4 text-[#EF4444]" strokeWidth={2.5} />} trend={stats.averageROI >= 0 ? 'up' : 'down'} />
        </div>
        </div>

        {/* Tabs */}
        <div className="space-y-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-3 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
              {tabs.map(tab => { const Icon = tab.icon; return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`relative rounded-[24px] px-6 py-4 font-light text-base transition-all duration-300 ${activeTab === tab.id ? 'bg-[#447afc] text-white font-medium shadow-[0_4px_16px_rgba(68,122,252,0.3)] border border-transparent' : 'bg-transparent text-[#9CA3AF] hover:bg-[#F5F5F3] hover:text-[#6B7280] border border-transparent'}`}>
                  <span className="flex items-center justify-center gap-2"><Icon className="h-4 w-4" strokeWidth={1.5} />{tab.label}</span>
                </button>
              );})}
            </div>
          </div>

          {activeTab === 'records' && (
            <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <BetTable bets={recentBets} activeBets={activeBets} currentUser={currentUser} isAdmin={isAdmin}
              onNavigateToAdd={() => setActiveTab('add')}
              tableFilter={tableFilter} onTableFilterChange={setTableFilter}
              showAdvancedFilters={showAdvancedFilters} onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
              resultFilter={resultFilter} onResultFilterChange={setResultFilter}
              periodFilter={periodFilter} onPeriodFilterChange={setPeriodFilter}
              sortBy={sortBy} onSortByChange={setSortBy}
              sortOrder={sortOrder} currentPage={currentPage} onPageChange={setCurrentPage}
              searchText={searchText} onSearchTextChange={setSearchText}
              onShareBet={handleShareBet} onBetDetails={handleBetDetails}
              onExpressDetails={handleExpressDetails} onUpdateResult={updateBetResult} onDeleteBet={handleDeleteBet} />
            </div>
          )}
          {activeTab === 'add' && (
            <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <CS2BettingForm onRecordAdded={handleRecordAdded} prefillData={prefillData}
              onPrefillConsumed={() => setPrefillData(null)}
              expressMatchesData={expressMatchesData}
              onExpressMatchesConsumed={() => setExpressMatchesData(null)} />
            </div>
          )}
          {activeTab === 'strategies' && (
            <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <StrategyOverview />
            </div>
          )}
        </div>

        <InitialBankModal open={bankModalOpen} onClose={handleBankModalClose} mode={isBankrollInitialized ? 'edit' : 'setup'} />

        {selectedBet && <BetShareModal bet={selectedBet} open={shareModalOpen} onClose={() => { setShareModalOpen(false); setSelectedBet(null); }} />}
        {selectedExpressBet && <ExpressDetailsModal bet={selectedExpressBet} open={expressModalOpen} onClose={() => { setExpressModalOpen(false); setSelectedExpressBet(null); setSelectedExpressEvents([]); }} parsedEvents={selectedExpressEvents} />}
        {selectedDetailsBet && <BetDetailsModal bet={selectedDetailsBet} open={betDetailsModalOpen} onClose={() => { setBetDetailsModalOpen(false); setSelectedDetailsBet(null); }} />}

        {/* Result Note Dialog — opens when marking bet result */}
        <Dialog open={resultNoteOpen} onOpenChange={(open) => { if (!open) skipResultNote(); }}>
          <DialogContent className="rounded-3xl max-w-lg border border-[#E5E7EB]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-[#111827]">
                Чому такий результат?
              </DialogTitle>
              <DialogDescription className="text-[#6B7280]">
                {pendingResultAction && (
                  <>
                    <strong>{pendingResultAction.bet.match}</strong> —{' '}
                    <span className={pendingResultAction.result === 'Win' ? 'text-[#22C55E] font-semibold' : 'text-[#EF4444] font-semibold'}>
                      {pendingResultAction.result === 'Win' ? 'Виграш' : 'Програш'}
                    </span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <textarea
                value={resultNote}
                onChange={(e) => setResultNote(e.target.value)}
                placeholder={`Що спрацювало? Що ні? Це аналіз чи емоції?\n\nНаприклад:\n• Переоцінив форму команди\n• Не врахував заміну гравця\n• Емоційна ставка після серії програшів`}
                className="w-full h-44 rounded-2xl border border-[#E5E7EB] p-4 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#111827] focus:ring-0 resize-none"
                autoFocus
              />
              <p className="text-xs text-[#9CA3AF]">
                💡 Нотатка збережеться з записом. Це допоможе аналізувати помилки в майбутньому.
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={skipResultNote} className="rounded-xl">
                Пропустити
              </Button>
              <Button onClick={confirmResultUpdate} className="rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white">
                {pendingResultAction?.result === 'Win' ? '✅ Виграш' : 'Програш'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteDialogBet} onOpenChange={(open) => { if (!open) setDeleteDialogBet(null); }}>
          <DialogContent className="rounded-3xl max-w-md border border-[#E5E7EB]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-[#111827]">
                Видалити ставку?
              </DialogTitle>
              <DialogDescription className="text-[#6B7280]">
                {deleteDialogBet && (
                  <span>{deleteDialogBet.match || deleteDialogBet.betType}</span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <div className="flex items-start gap-3 p-4 bg-[#FEF2F2] rounded-2xl border border-[#FECACA]">
                <AlertTriangle className="h-5 w-5 text-[#DC2626] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <p className="text-sm text-[#991B1B]">
                  Ця дія незворотна. Дані про ставку будуть видалені назавжди.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogBet(null)} className="rounded-xl">
                Скасувати
              </Button>
              <Button onClick={confirmDeleteBet} className="rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white">
                <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Видалити
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
