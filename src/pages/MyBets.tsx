import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import CS2BettingForm from '@/components/CS2BettingForm';
import type { MatchPrefillData } from '@/components/CS2BettingForm';
import StrategyOverview from '@/components/StrategyOverview';
import BetShareModal from '@/components/BetShareModal';
import ExpressDetailsModal from '@/components/ExpressDetailsModal';
import BetDetailsModal from '@/components/BetDetailsModal';
import InitialBankModal from '@/components/InitialBankModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { realGoogleSheetsService } from '@/lib/realGoogleSheets';
import { UserDataService } from '@/lib/userDataService';
import { BankrollService } from '@/lib/bankrollService';
import { 
  TrendingUp, DollarSign, Target, BarChart3, Calendar, Trophy, 
  AlertTriangle, CheckCircle, XCircle, Clock, Trash2, Share2, 
  Flag, Wallet, Eye, ChevronDown, ChevronUp,
  Plus, LineChart, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, Filter,
  Sun, Moon, User,
  ChevronLeft, ChevronRight, ClipboardList, ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import type { Bet } from '@/types/betting';

interface Goal {
  id: string;
  name: string;
  type: 'amount' | 'ladder' | 'roi' | 'winrate';
  status: 'active' | 'completed' | 'failed';
}

interface UserRecord {
  telegram: string;
  username: string;
  isAdmin?: boolean;
}

interface ParsedEvent {
  number: string;
  match: string;
  betType: string;
  selection: string;
  odds: string;
}

interface BetStats {
  totalBets: number;
  winRate: number;
  totalProfit: number;
  averageROI: number;
  profitByMonth: { month: string; profit: number }[];
  profitByStrategy: { strategy: string; profit: number }[];
}

const DEFAULT_STATS: BetStats = {
  totalBets: 0,
  winRate: 0,
  totalProfit: 0,
  averageROI: 0,
  profitByMonth: [],
  profitByStrategy: []
};

const cardBaseStyle: React.CSSProperties = {
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  transform: 'translateY(0)',
};

const cardHoverStyle: React.CSSProperties = {
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  transform: 'translateY(-2px)',
};

/** Normalize a bet.date string (DD.MM.YYYY or YYYY-MM-DD) → YYYY-MM-DD */
function normalizeDateStr(dateStr: string): string {
  if (!dateStr) return '';
  const dotMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) {
    const dd = dotMatch[1].padStart(2, '0');
    const mm = dotMatch[2].padStart(2, '0');
    return `${dotMatch[3]}-${mm}-${dd}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const dd = slashMatch[1].padStart(2, '0');
    const mm = slashMatch[2].padStart(2, '0');
    return `${slashMatch[3]}-${mm}-${dd}`;
  }
  return dateStr;
}

function getTodayStr(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

type TableFilterMode = 'today' | 'all';

const ITEMS_PER_PAGE = 10;

export default function MyBets() {
  const currentUser = localStorage.getItem('username') || '';
  const userRole = localStorage.getItem('userRole');
  const isAdminRole = userRole === 'admin';
  const location = useLocation();
  
  const [stats, setStats] = useState<BetStats>(() => 
    UserDataService.getUserData(currentUser, 'mybets_stats', DEFAULT_STATS)
  );
  const [recentBets, setRecentBets] = useState<Bet[]>(() => {
    const bets = UserDataService.getUserData(currentUser, 'mybets_data', []);
    return bets;
  });
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [expressModalOpen, setExpressModalOpen] = useState(false);
  const [betDetailsModalOpen, setBetDetailsModalOpen] = useState(false);
  const [selectedExpressBet, setSelectedExpressBet] = useState<Bet | null>(null);
  const [selectedExpressEvents, setSelectedExpressEvents] = useState<ParsedEvent[]>([]);
  const [selectedDetailsBet, setSelectedDetailsBet] = useState<Bet | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [activeTab, setActiveTab] = useState('records');
  const [bankrollRefreshKey, setBankrollRefreshKey] = useState(0);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Prefill data from Matches page navigation
  const [prefillData, setPrefillData] = useState<MatchPrefillData | null>(null);


  // Express matches data from Matches page navigation (multi-select)
  const [expressMatchesData, setExpressMatchesData] = useState<MatchPrefillData[] | null>(null);
  // Filter state for the table — 'today' or 'all'
  const [tableFilter, setTableFilter] = useState<TableFilterMode>('all');

  // Advanced filters
  const [resultFilter, setResultFilter] = useState<'all' | 'Win' | 'Loss' | 'Pending'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'week' | 'month' | 'quarter'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'profit' | 'odds'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const [bankrollStats, setBankrollStats] = useState(() => {
    return BankrollService.getBankrollStats(currentUser, recentBets);
  });
  
  const isBankrollInitialized = useMemo(() => {
    return BankrollService.isInitialized(currentUser);
  }, [currentUser, bankrollRefreshKey]);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  // Handle prefill data from Matches page (via react-router navigation state)
  useEffect(() => {
    const state = location.state as { prefillMatch?: MatchPrefillData; expressMatches?: MatchPrefillData[] } | null;
    if (state?.expressMatches && state.expressMatches.length >= 2) {
      setExpressMatchesData(state.expressMatches);
      setActiveTab('add');
      window.history.replaceState({}, document.title);
    } else if (state?.prefillMatch) {
      setPrefillData(state.prefillMatch);
      setActiveTab('add');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const newStats = BankrollService.getBankrollStats(currentUser, recentBets);
    setBankrollStats(newStats);
  }, [currentUser, recentBets, bankrollRefreshKey]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes('bankroll_') && e.key.includes(currentUser)) {
        setBankrollRefreshKey(prev => prev + 1);
      }
    };

    const handleBankrollUpdate = () => {
      setBankrollRefreshKey(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bankrollUpdated', handleBankrollUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bankrollUpdated', handleBankrollUpdate);
    };
  }, [currentUser]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0 && currentUser) {
      checkAdminStatus();
    }
  }, [users, currentUser]);

  const fetchUsers = async () => {
    try {
      const SHEET_ID = '1IhAUYQKcPjXetOGxCu-_YXxrj_kXt0QxKJCcGqPzZdo';
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
      
      const response = await fetch(url);
      const text = await response.text();
      
      const rows = text.split('\n').slice(1);
      const parsedUsers: UserRecord[] = rows
        .filter(row => row.trim())
        .map(row => {
          const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (!matches || matches.length < 7) return null;
          
          const telegram = matches[0].replace(/"/g, '').trim();
          const username = matches[1].replace(/"/g, '').trim();
          const isAdminStr = matches[6]?.replace(/"/g, '').trim().toLowerCase();
          
          return {
            telegram,
            username,
            isAdmin: isAdminStr === 'true' || isAdminStr === '1' || isAdminStr === 'yes' || isAdminStr === 'так'
          };
        })
        .filter((user): user is UserRecord => user !== null);
      
      setUsers(parsedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const checkAdminStatus = () => {
    const user = users.find(u => u.username.toLowerCase() === currentUser.toLowerCase());
    setIsAdmin(user?.isAdmin || false);
  };

  useEffect(() => {
    if (currentUser) {
      UserDataService.checkAndResetDailyBets(currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    loadStats();
    loadRecentBets();
  }, []);

  useEffect(() => {
    if (currentUser) {
      UserDataService.setUserData(currentUser, 'mybets_stats', stats);
      UserDataService.setUserData(currentUser, 'mybets_data', recentBets);
    }
  }, [stats, recentBets, currentUser]);

  const loadStats = useCallback(async () => {
    try {
      const data = await realGoogleSheetsService.getBettingStatistics();
      if (data.totalBets > 0) {
        setStats(data);
      } else {
        setStats(UserDataService.getUserData(currentUser, 'mybets_stats', DEFAULT_STATS));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(UserDataService.getUserData(currentUser, 'mybets_stats', DEFAULT_STATS));
    }
  }, [currentUser]);

  const loadRecentBets = useCallback(async () => {
    try {
      const data = await realGoogleSheetsService.fetchUSDTData();
      setRecentBets(data.length > 0 ? data.slice(-20) : UserDataService.getUserData(currentUser, 'mybets_data', []));
    } catch (error) {
      console.error('Error loading recent bets:', error);
      setRecentBets(UserDataService.getUserData(currentUser, 'mybets_data', []));
    }
  }, [currentUser]);

  const handleRecordAdded = useCallback(() => {
    loadStats();
    loadRecentBets();
  }, [loadStats, loadRecentBets]);

  const clearRecentBets = useCallback(async () => {
    if (window.confirm('Ви впевнені, що хочете очистити всі дані? Це видалить всі записи, статистику та історію. Ця дія незворотна.')) {
      try {
        await realGoogleSheetsService.clearAllData();
        
        UserDataService.clearUserData(currentUser, 'mybets_data');
        UserDataService.clearUserData(currentUser, 'mybets_stats');
        UserDataService.clearUserData(currentUser, 'analytics_bets');
        UserDataService.clearUserData(currentUser, 'analytics_stats');
        
        BankrollService.setInitialBank(currentUser, 0);
        
        setRecentBets([]);
        setStats(DEFAULT_STATS);
        setBankrollRefreshKey(prev => prev + 1);
        
        toast.success('Всі дані очищено');
        
        setTimeout(() => {
          loadStats();
          loadRecentBets();
        }, 100);
      } catch (error) {
        toast.error('Помилка при очищенні даних');
        console.error(error);
      }
    }
  }, [currentUser, loadStats, loadRecentBets]);

  const updateBetResult = useCallback(async (bet: Bet, result: 'Win' | 'Loss') => {
    try {
      const betAmount = bet.originalAmount || bet.amount;
      const originalProfit = result === 'Win' ? (bet.odds - 1) * betAmount : -betAmount;
      
      let profitInUAH = originalProfit;
      if (bet.currency === 'USD' && bet.exchangeRate) {
        profitInUAH = originalProfit * bet.exchangeRate;
      }
      
      const roi = (profitInUAH / bet.amount) * 100;
      await realGoogleSheetsService.updateBetResult(bet, result, profitInUAH, roi);
      
      const updatedBets = recentBets.map((b: Bet) => 
        (b.date === bet.date && b.match === bet.match && b.amount === bet.amount && b.odds === bet.odds)
          ? { ...b, result, profit: profitInUAH, originalProfit, roi, goalId: b.goalId }
          : b
      );
      
      setRecentBets(updatedBets);
      UserDataService.setUserData(currentUser, 'mybets_data', updatedBets);
      toast.success(`Запис позначено як ${result === 'Win' ? 'виграшний' : 'програшний'}`);
      
      loadStats();
      loadRecentBets();
    } catch (error) {
      toast.error('Помилка при оновленні результату запису');
      console.error('Error in updateBetResult:', error);
    }
  }, [recentBets, currentUser, loadStats, loadRecentBets]);

  const handleShareBet = useCallback((bet: Bet) => {
    setSelectedBet(bet);
    setShareModalOpen(true);
  }, []);

  const handleBankModalClose = useCallback((success: boolean) => {
    setBankModalOpen(false);
    if (success) {
      setBankrollRefreshKey(prev => prev + 1);
      window.dispatchEvent(new Event('bankrollUpdated'));
    }
  }, []);

  const sortedAndFilteredBets = useMemo(() => {
    // Step 1: Sort by pending first, then by date
    let result = [...recentBets].sort((a: Bet, b: Bet) => {
      if (a.result === 'Pending' && b.result !== 'Pending') return -1;
      if (a.result !== 'Pending' && b.result === 'Pending') return 1;
      const aTime = a.createdAt || new Date(a.date).getTime();
      const bTime = b.createdAt || new Date(b.date).getTime();
      return bTime - aTime;
    });

    // Step 2: Apply "today" filter
    if (tableFilter === 'today') {
      const targetDate = getTodayStr();
      result = result.filter((bet: Bet) => normalizeDateStr(bet.date) === targetDate);
    }

    // Step 3: Apply result filter
    if (resultFilter !== 'all') {
      result = result.filter((bet: Bet) => bet.result === resultFilter);
    }

    // Step 4: Apply period filter
    if (periodFilter !== 'all') {
      const now = new Date();
      result = result.filter((bet: Bet) => {
        const betDate = new Date(normalizeDateStr(bet.date));
        const diffDays = Math.floor((now.getTime() - betDate.getTime()) / (1000 * 60 * 60 * 24));
        if (periodFilter === 'week') return diffDays <= 7;
        if (periodFilter === 'month') return diffDays <= 30;
        if (periodFilter === 'quarter') return diffDays <= 90;
        return true;
      });
    }

    // Step 5: Apply custom sort
    if (sortBy !== 'date') {
      result = [...result].sort((a: Bet, b: Bet) => {
        let comparison = 0;
        if (sortBy === 'profit') {
          comparison = (a.profit || 0) - (b.profit || 0);
        } else if (sortBy === 'odds') {
          comparison = a.odds - b.odds;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    } else if (sortOrder === 'asc') {
      result = result.reverse();
    }

    return result;
  }, [recentBets, tableFilter, resultFilter, periodFilter, sortBy, sortOrder]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(sortedAndFilteredBets.length / ITEMS_PER_PAGE));

  // Reset page to 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tableFilter, resultFilter, periodFilter, sortBy, sortOrder]);

  const paginatedBets = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredBets.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [sortedAndFilteredBets, currentPage]);

  const { activeBets, winningBets, losingBets } = useMemo(() => ({
    activeBets: recentBets.filter((bet: Bet) => bet.result === 'Pending'),
    winningBets: recentBets.filter((bet: Bet) => bet.result === 'Win'),
    losingBets: recentBets.filter((bet: Bet) => bet.result === 'Loss')
  }), [recentBets]);

  const getCurrencySymbol = useCallback((currency?: string) => 
    currency === 'USD' ? '$' : '₴',
    []
  );

  const getGoalName = useCallback((goalId?: string) => {
    if (!goalId) return null;
    const goals = UserDataService.getUserData(currentUser, 'goals', []);
    const goal = goals.find((g: Goal) => g.id === goalId);
    return goal?.name || 'Видалена ціль';
  }, [currentUser]);

  const parseExpressEvents = useCallback((betType: string): ParsedEvent[] => {
    if (!betType.includes('|')) return [];
    
    const fullString = betType.split('|').slice(1).join('|').trim();
    const eventStrings = fullString.split('•').map(e => e.trim());
    
    return eventStrings.map(eventStr => {
      const parts = eventStr.split('|').map(p => p.trim());
      
      if (parts.length >= 2) {
        const matchPart = parts[0];
        const betPart = parts[1];
        
        const numberMatch = matchPart.match(/^(\d+)\.\s*(.+)$/);
        const number = numberMatch ? numberMatch[1] : '';
        const match = numberMatch ? numberMatch[2] : matchPart;
        
        const betMatch = betPart.match(/^(.+?):\s*(.+?)\s*@([\d.]+)$/);
        const betType = betMatch ? betMatch[1] : '';
        const selection = betMatch ? betMatch[2] : '';
        const odds = betMatch ? betMatch[3] : '';
        
        return { number, match, betType, selection, odds };
      }
      
      return { number: '', match: eventStr, betType: '', selection: '', odds: '' };
    });
  }, []);

  const isExpressBet = useCallback((bet: Bet) => 
    bet.betType.includes('Експрес') || bet.format.includes('x'),
    []
  );

  const getExpressEventCount = useCallback((bet: Bet) => {
    const match = bet.format.match(/(\d+)x/);
    return match ? parseInt(match[1]) : 0;
  }, []);

  const handleExpressDetailsClick = useCallback((bet: Bet) => {
    const parsedEvents = parseExpressEvents(bet.betType);
    setSelectedExpressBet(bet);
    setSelectedExpressEvents(parsedEvents);
    setExpressModalOpen(true);
  }, [parseExpressEvents]);

  const handleBetDetailsClick = useCallback((bet: Bet) => {
    setSelectedDetailsBet(bet);
    setBetDetailsModalOpen(true);
  }, []);

  // Close actions menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setShowActionsMenu(false);
    if (showActionsMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActionsMenu]);

  // Generate page numbers for pagination
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | '...')[] = [];

    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }

    return pages;
  };

  const toggleSort = (column: 'date' | 'profit' | 'odds') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Check if any advanced filter is active
  const hasActiveAdvancedFilters = resultFilter !== 'all' || periodFilter !== 'all' || sortBy !== 'date';

  const resetAdvancedFilters = () => {
    setResultFilter('all');
    setPeriodFilter('all');
    setSortBy('date');
    setSortOrder('desc');
  };

  // Clear prefill data after it's been consumed by the form
  const handlePrefillConsumed = useCallback(() => {
    setPrefillData(null);
  }, []);

  // Clear express matches data after it's been consumed by the form
  const handleExpressMatchesConsumed = useCallback(() => {
    setExpressMatchesData(null);
  }, []);

  const tabs = [
    { id: 'records', label: 'Останні записи', icon: ClipboardList },
    { id: 'add', label: 'Додати запис', icon: Plus },
  ];

  /** Render the "Останні записи" table content */
  const renderRecordsTable = () => (
    <div className="bg-white border border-[#F3F4F6] rounded-3xl overflow-hidden"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
    >
      {/* Table Header — no collapse toggle */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#F3F4F6]">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
          <span className="text-lg font-semibold text-[#111827]">Останні записи</span>
          {activeBets.length > 0 && (
            <Badge className="rounded-full bg-[#FEF3C7] text-[#D97706] border-0 text-sm font-medium px-3 py-0.5 hover:bg-[#FEF3C7]">
              {activeBets.length} активних
            </Badge>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="border-b border-[#F3F4F6] bg-[#FAFAFA]">
        {/* Basic filter row */}
        <div className="flex items-center gap-3 px-6 py-3.5">
          <Filter className="h-4 w-4 text-[#9CA3AF]" strokeWidth={1.5} />
          <span className="text-sm text-[#6B7280] font-medium mr-1">Фільтр:</span>
          
          {/* Today button */}
          <button
            onClick={() => setTableFilter('today')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              tableFilter === 'today'
                ? 'bg-[#111827] text-white shadow-sm'
                : 'bg-white text-[#374151] border border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB]'
            }`}
          >
            Сьогодні
          </button>

          {/* All bets button */}
          <button
            onClick={() => setTableFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              tableFilter === 'all'
                ? 'bg-[#111827] text-white shadow-sm'
                : 'bg-white text-[#374151] border border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB]'
            }`}
          >
            Всі матчі
          </button>

          {/* Advanced filters toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`ml-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
              showAdvancedFilters || hasActiveAdvancedFilters
                ? 'bg-[#EFF6FF] text-[#3B82F6] border border-[#BFDBFE]'
                : 'bg-white text-[#374151] border border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB]'
            }`}
          >
            {showAdvancedFilters ? (
              <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.5} />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
            Розширені
            {hasActiveAdvancedFilters && !showAdvancedFilters && (
              <span className="flex items-center justify-center w-2 h-2 rounded-full bg-[#3B82F6]" />
            )}
          </button>

          {/* Reset advanced filters */}
          {hasActiveAdvancedFilters && (
            <button
              onClick={resetAdvancedFilters}
              className="px-3 py-2 rounded-xl text-sm font-medium text-[#EF4444] bg-[#FEF2F2] border border-[#FECACA] hover:bg-[#FEE2E2] transition-all duration-200"
            >
              Скинути
            </button>
          )}

          {/* Count indicator */}
          <div className="ml-auto">
            <span className="text-sm text-[#9CA3AF]">
              {sortedAndFilteredBets.length} {sortedAndFilteredBets.length === 1 ? 'запис' : sortedAndFilteredBets.length >= 2 && sortedAndFilteredBets.length <= 4 ? 'записи' : 'записів'}
              {(tableFilter !== 'all' || hasActiveAdvancedFilters) && ` з ${recentBets.length}`}
            </span>
          </div>
        </div>

        {/* Advanced filters row */}
        {showAdvancedFilters && (
          <div className="px-6 py-4 border-t border-[#F3F4F6] bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-[#374151] mb-2 block">Результат:</label>
                <Select value={resultFilter} onValueChange={(value: 'all' | 'Win' | 'Loss' | 'Pending') => setResultFilter(value)}>
                  <SelectTrigger className="rounded-xl border-[#E5E7EB] bg-white h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі</SelectItem>
                    <SelectItem value="Win">Виграш</SelectItem>
                    <SelectItem value="Loss">Програш</SelectItem>
                    <SelectItem value="Pending">Очікується</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-[#374151] mb-2 block">Період:</label>
                <Select value={periodFilter} onValueChange={(value: 'all' | 'week' | 'month' | 'quarter') => setPeriodFilter(value)}>
                  <SelectTrigger className="rounded-xl border-[#E5E7EB] bg-white h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Весь час</SelectItem>
                    <SelectItem value="week">Останній тиждень</SelectItem>
                    <SelectItem value="month">Останній місяць</SelectItem>
                    <SelectItem value="quarter">Останній квартал</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-[#374151] mb-2 block">Сортування:</label>
                <Select value={sortBy} onValueChange={(value: 'date' | 'profit' | 'odds') => setSortBy(value)}>
                  <SelectTrigger className="rounded-xl border-[#E5E7EB] bg-white h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">За датою</SelectItem>
                    <SelectItem value="profit">За прибутком</SelectItem>
                    <SelectItem value="odds">За коефіцієнтом</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Table Content — always visible */}
      <div className="px-0 pb-6">
        {sortedAndFilteredBets.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    <th 
                      className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider cursor-pointer hover:bg-[#F3F4F6] transition-colors"
                      onClick={() => toggleSort('date')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Дата
                        <ArrowUpDown className="h-3 w-3" strokeWidth={1.5} />
                      </div>
                    </th>
                    <th className="text-left px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider min-w-[220px] border-l border-[#E5E7EB]">Матч</th>
                    <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider border-l border-[#E5E7EB]">Тип</th>
                    <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider border-l border-[#E5E7EB]">Валюта</th>
                    <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider border-l border-[#E5E7EB]">Сума</th>
                    <th 
                      className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider cursor-pointer hover:bg-[#F3F4F6] transition-colors border-l border-[#E5E7EB]"
                      onClick={() => toggleSort('odds')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Коеф.
                        <ArrowUpDown className="h-3 w-3" strokeWidth={1.5} />
                      </div>
                    </th>
                    <th 
                      className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider cursor-pointer hover:bg-[#F3F4F6] transition-colors border-l border-[#E5E7EB]"
                      onClick={() => toggleSort('profit')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Профіт
                        <ArrowUpDown className="h-3 w-3" strokeWidth={1.5} />
                      </div>
                    </th>
                    <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider border-l border-[#E5E7EB]">Ціль</th>
                    <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider border-l border-[#E5E7EB]">Статус</th>
                    <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider border-l border-[#E5E7EB]">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBets.map((bet: Bet) => {
                    const isPending = bet.result === 'Pending';
                    const isWin = bet.result === 'Win';
                    const isLoss = bet.result === 'Loss';
                    const currency = bet.currency || 'UAH';
                    const currencySymbol = getCurrencySymbol(currency);
                    const displayAmount = bet.originalAmount || bet.amount;
                    let displayProfit: number | undefined = bet.originalProfit;
                    if (displayProfit === undefined && bet.profit !== undefined && bet.profit !== null) {
                      if (bet.currency === 'USD' && bet.exchangeRate) {
                        displayProfit = bet.profit / bet.exchangeRate;
                      } else {
                        displayProfit = bet.profit;
                      }
                    }
                    const goalName = getGoalName(bet.goalId);
                    
                    const isExpress = isExpressBet(bet);
                    const expressEventCount = isExpress ? getExpressEventCount(bet) : 0;
                    const betKey = `${bet.date}-${bet.match || bet.team1}-${bet.amount}-${bet.odds}`;
                    
                    return (
                      <tr 
                        key={betKey}
                        className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors duration-150"
                      >
                        <td className="px-4 py-4 text-center">
                          <span className="text-base text-[#374151] font-medium">{bet.date}</span>
                        </td>
                        <td className="px-4 py-4 border-l border-[#F3F4F6]">
                          <div className="min-w-0">
                            <div className="font-semibold text-base text-[#111827] truncate" title={bet.match || `${bet.team1} vs ${bet.team2}`}>
                              {bet.match || `${bet.team1} vs ${bet.team2}`}
                            </div>
                            {!isExpress && (
                              <div className="text-sm text-[#9CA3AF] truncate mt-0.5" title={bet.betType}>{bet.betType}</div>
                            )}
                            <Badge className="text-xs rounded-md bg-[#F3F4F6] text-[#6B7280] border-0 font-medium mt-1.5 hover:bg-[#F3F4F6]">
                              {bet.format}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                          {isExpress ? (
                            <div className="flex flex-col items-center gap-1.5">
                              <Badge className="rounded-md bg-[#FEF3C7] text-[#D97706] border-0 font-semibold text-sm px-2.5 py-1 hover:bg-[#FEF3C7]">
                                Express {expressEventCount}×
                              </Badge>
                              <button
                                onClick={() => handleExpressDetailsClick(bet)}
                                className="text-sm text-[#3B82F6] hover:text-[#2563EB] font-medium bg-[#EFF6FF] hover:bg-[#DBEAFE] px-3 py-1 rounded-md transition-colors duration-200"
                              >
                                Деталі
                              </button>
                            </div>
                          ) : (
                            <Badge className="rounded-md bg-[#EFF6FF] text-[#3B82F6] border-0 font-medium text-sm px-2.5 py-1 max-w-[160px] truncate hover:bg-[#EFF6FF]" title={bet.betType.split(' - ')[1] || bet.betType.split(' - ')[0]}>
                              {bet.betType.split(' - ')[1] || bet.betType.split(' - ')[0]}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                          <span className={`text-base font-semibold ${currency === 'USD' ? 'text-[#22C55E]' : 'text-[#3B82F6]'}`}>
                            {currency}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                          <span className="text-base font-semibold text-[#111827]">{currencySymbol}{displayAmount}</span>
                        </td>
                        <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                          <span className="text-base font-bold text-[#111827]">{bet.odds.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                          {displayProfit !== undefined && displayProfit !== null ? (
                            <span className={`text-base font-bold ${displayProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                              {displayProfit >= 0 ? '+' : ''}{displayProfit.toFixed(2)} {currencySymbol}
                            </span>
                          ) : (
                            <span className="text-[#D1D5DB] text-base">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                          {goalName ? (
                            <Badge className="font-medium px-2.5 py-1 rounded-md bg-[#EFF6FF] text-[#3B82F6] border-0 text-sm max-w-[130px] truncate hover:bg-[#EFF6FF]" title={goalName}>
                              <Flag className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" strokeWidth={1.5} />
                              <span className="truncate">{goalName}</span>
                            </Badge>
                          ) : (
                            <span className="text-[#D1D5DB] text-sm">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                          <Badge 
                            className={`rounded-full border-0 font-semibold text-sm px-3.5 py-1.5 ${
                              isWin ? 'bg-[#DCFCE7] text-[#16A34A] hover:bg-[#DCFCE7]' :
                              isLoss ? 'bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FEE2E2]' :
                              'bg-[#FEF3C7] text-[#D97706] hover:bg-[#FEF3C7]'
                            }`}
                          >
                            {isWin ? 'Виграш' : isLoss ? 'Програш' : 'Очікується'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                          <div className="flex gap-2 justify-center">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => updateBetResult(bet, 'Win')}
                                  className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#E5E7EB] hover:bg-[#DCFCE7] hover:border-[#86EFAC] text-[#16A34A] transition-all duration-200"
                                  title="Виграш"
                                >
                                  <CheckCircle className="h-4 w-4" strokeWidth={2} />
                                </button>
                                <button
                                  onClick={() => updateBetResult(bet, 'Loss')}
                                  className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#E5E7EB] hover:bg-[#FEE2E2] hover:border-[#FCA5A5] text-[#DC2626] transition-all duration-200"
                                  title="Програш"
                                >
                                  <XCircle className="h-4 w-4" strokeWidth={2} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleShareBet(bet)}
                              className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#E5E7EB] hover:bg-[#EFF6FF] hover:border-[#93C5FD] text-[#3B82F6] transition-all duration-200"
                              title="Поділитися"
                            >
                              <Share2 className="h-4 w-4" strokeWidth={2} />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleBetDetailsClick(bet)}
                                className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#E5E7EB] hover:bg-[#F3E8FF] hover:border-[#C4B5FD] text-[#7C3AED] transition-all duration-200"
                                title="Деталі"
                              >
                                <Eye className="h-4 w-4" strokeWidth={2} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-6 px-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${
                    currentPage === 1
                      ? 'text-[#D1D5DB] cursor-not-allowed'
                      : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]'
                  }`}
                  title="Попередня"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                </button>

                {getPageNumbers().map((page, idx) => (
                  page === '...' ? (
                    <span key={`dots-${idx}`} className="flex items-center justify-center w-9 h-9 text-sm text-[#9CA3AF]">
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`flex items-center justify-center min-w-[36px] h-9 rounded-xl text-sm font-medium transition-all duration-200 px-2 ${
                        currentPage === page
                          ? 'bg-[#111827] text-white shadow-sm'
                          : 'text-[#374151] hover:bg-[#F3F4F6] hover:text-[#111827]'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${
                    currentPage === totalPages
                      ? 'text-[#D1D5DB] cursor-not-allowed'
                      : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]'
                  }`}
                  title="Наступна"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F3F4F6] mx-auto mb-4">
              <Calendar className="h-8 w-8 text-[#9CA3AF]" strokeWidth={1.5} />
            </div>
            {tableFilter === 'today' ? (
              <>
                <p className="text-[#111827] font-semibold text-lg">Немає записів за сьогодні</p>
                <p className="text-base text-[#9CA3AF] mt-1">Додайте новий запис або перегляньте всі матчі</p>
                <button
                  onClick={() => setTableFilter('all')}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-[#111827] text-white text-sm font-medium hover:bg-[#1F2937] transition-colors"
                >
                  Показати всі матчі
                </button>
              </>
            ) : hasActiveAdvancedFilters ? (
              <>
                <p className="text-[#111827] font-semibold text-lg">Немає записів за обраними фільтрами</p>
                <p className="text-base text-[#9CA3AF] mt-1">Спробуйте змінити параметри фільтрації</p>
                <button
                  onClick={resetAdvancedFilters}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-[#111827] text-white text-sm font-medium hover:bg-[#1F2937] transition-colors"
                >
                  Скинути фільтри
                </button>
              </>
            ) : (
              <>
                <p className="text-[#111827] font-semibold text-lg">Поки що немає записів</p>
                <p className="text-base text-[#9CA3AF] mt-1">Додайте свій перший запис, щоб почати відстеження</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f3f3] relative">
      {/* ===== HEADER ===== */}
      <div className="px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-[48px] font-semibold text-[#111827] leading-tight tracking-tight">
            Додати запис
          </h1>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActionsMenu(!showActionsMenu);
                }}
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-black/5 transition-colors duration-200"
                title="Дії"
              >
                <MoreHorizontal className="h-5 w-5 text-[#6B7280]" strokeWidth={1.5} />
              </button>
              
              {showActionsMenu && (
                <div 
                  className="absolute right-0 top-11 bg-white rounded-xl border border-[#E5E7EB] py-1 min-w-[180px] z-50"
                  style={{
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  <button
                    onClick={() => {
                      clearRecentBets();
                      setShowActionsMenu(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    Очистити всі дані
                  </button>
                </div>
              )}
            </div>

            {/* Theme Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-full bg-black/5">
              <button
                onClick={() => { if (isDarkTheme) toggleTheme(); }}
                className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                  !isDarkTheme ? 'bg-white shadow-sm' : 'hover:bg-black/5'
                }`}
                title="Світла тема"
              >
                <Sun className={`h-4 w-4 ${!isDarkTheme ? 'text-[#2563EB]' : 'text-[#9CA3AF]'}`} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => { if (!isDarkTheme) toggleTheme(); }}
                className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                  isDarkTheme ? 'bg-white shadow-sm' : 'hover:bg-black/5'
                }`}
                title="Темна тема"
              >
                <Moon className={`h-4 w-4 ${isDarkTheme ? 'text-[#2563EB]' : 'text-[#9CA3AF]'}`} strokeWidth={1.5} />
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-[#D1D5DB]" />

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111827]">
                <User className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[#111827] leading-tight">
                  {currentUser || 'User'}
                </p>
                <p className="text-xs text-[#6B7280] leading-tight">
                  {isAdminRole ? 'Адміністратор' : 'Користувач'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 space-y-8 px-6 lg:px-8 pb-8 pt-4">

        {/* ===== QUICK STATS - Row 1 ===== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* 1. Поточний банк */}
          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group relative overflow-hidden"
            style={cardBaseStyle}
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-[#111827]">Поточний банк</span>
            </div>
            <div className="text-4xl font-bold text-[#111827] tracking-tight mb-2">
              {bankrollStats.currentBank.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴
            </div>
            <div className="flex items-center gap-2">
              {stats.totalProfit >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-[#EF4444]" strokeWidth={2.5} />
              )}
              <span className={`text-base font-normal ${stats.totalProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(2)} ₴
              </span>
              <span className="text-sm text-[#9CA3AF]">за весь час</span>
            </div>
          </div>

          {/* 2. Профіт */}
          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
          >
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-[#111827]">Профіт</span>
            </div>
            <div className={`text-4xl font-bold tracking-tight mb-2 ${(stats.totalProfit || 0) >= 0 ? 'text-[#111827]' : 'text-[#EF4444]'}`}>
              {(stats.totalProfit || 0) >= 0 ? '+' : ''}{(stats.totalProfit || 0).toFixed(2)} ₴
            </div>
            <div className="flex items-center gap-2">
              {(stats.totalProfit || 0) >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-[#EF4444]" strokeWidth={2.5} />
              )}
              <span className={`text-base font-normal ${(stats.totalProfit || 0) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {(stats.totalProfit || 0) >= 0 ? 'Позитивна динаміка' : 'Негативна динаміка'}
              </span>
            </div>
          </div>

          {/* 3. Всього записів */}
          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
          >
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-[#111827]">Всього записів</span>
            </div>
            <div className="text-4xl font-bold text-[#111827] tracking-tight mb-2">
              {stats.totalBets}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#9CA3AF]">
                {activeBets.length > 0 ? `${activeBets.length} активних` : 'Немає активних'}
              </span>
            </div>
          </div>

          {/* 4. Win Rate */}
          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-[#111827]">Вінрейт</span>
            </div>
            <div className="text-4xl font-bold text-[#111827] tracking-tight mb-2">
              {stats.winRate}%
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#9CA3AF]">
                {winningBets.length}W / {losingBets.length}L
              </span>
            </div>
          </div>
        </div>

        {/* ===== QUICK STATS - Row 2 ===== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* 5. Активні */}
          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-[#111827]">Активні</span>
            </div>
            <div className="text-4xl font-bold text-[#3B82F6] tracking-tight mb-2">
              {activeBets.length}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#9CA3AF]">Очікують результату</span>
            </div>
          </div>

          {/* 6. Виграші */}
          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-[#111827]">Виграші</span>
            </div>
            <div className="text-4xl font-bold text-[#22C55E] tracking-tight mb-2">
              {winningBets.length}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#9CA3AF]">Успішних записів</span>
            </div>
          </div>

          {/* 7. Програші */}
          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-[#111827]">Програші</span>
            </div>
            <div className="text-4xl font-bold text-[#EF4444] tracking-tight mb-2">
              {losingBets.length}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#9CA3AF]">Невдалих записів</span>
            </div>
          </div>

          {/* 8. Середній ROI */}
          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-[#111827]">Середній ROI</span>
            </div>
            <div className={`text-4xl font-bold tracking-tight mb-2 ${stats.averageROI >= 0 ? 'text-[#111827]' : 'text-[#EF4444]'}`}>
              {stats.averageROI >= 0 ? '+' : ''}{stats.averageROI}%
            </div>
            <div className="flex items-center gap-2">
              {stats.averageROI >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-[#EF4444]" strokeWidth={2.5} />
              )}
              <span className={`text-sm ${stats.averageROI >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {stats.averageROI >= 0 ? 'Позитивний' : 'Негативний'}
              </span>
            </div>
          </div>
        </div>

        {/* ===== TABS NAVIGATION ===== */}
        <div className="space-y-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-3 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <div className={`grid gap-3 grid-cols-${tabs.length}`} style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative rounded-[24px] px-6 py-4 font-light text-base
                      transition-all duration-300 ease-in-out
                      ${activeTab === tab.id 
                        ? 'bg-white text-[#111827] font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)]' 
                        : 'bg-transparent text-[#9CA3AF] hover:bg-[#F5F5F3] hover:text-[#6B7280]'
                      }
                    `}
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

          {/* Tab Content */}
          <div>
            {activeTab === 'records' && renderRecordsTable()}
            {activeTab === 'add' && (
              <CS2BettingForm 
                onRecordAdded={handleRecordAdded} 
                prefillData={prefillData}
                onPrefillConsumed={handlePrefillConsumed}
                expressMatchesData={expressMatchesData}
                onExpressMatchesConsumed={handleExpressMatchesConsumed}
              />
            )}
            {activeTab === 'strategies' && <StrategyOverview />}
          </div>
        </div>

        <InitialBankModal
          open={bankModalOpen}
          onClose={handleBankModalClose}
          mode={isBankrollInitialized ? 'edit' : 'setup'}
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
      </div>
    </div>
  );
}