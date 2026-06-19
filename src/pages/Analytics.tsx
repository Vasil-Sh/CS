import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BalanceChart from '@/components/BalanceChart';
import MiniDonut from '@/components/MiniDonut';
import MonthlyProfitChartCard from '@/components/analytics/MonthlyProfitChartCard';
import OddsVsProfitScatterCard from '@/components/analytics/OddsVsProfitScatterCard';
import OddsWinRateChartCard from '@/components/analytics/OddsWinRateChartCard';
import OddsCategoryCards from '@/components/analytics/OddsCategoryCards';
import BalanceTracker from '@/components/analytics/BalanceTracker';
import RiskManagement from '@/components/RiskManagement';
import PeriodComparison from '@/components/PeriodComparison';
import GoalsManager from '@/components/GoalsManager';
import InitialBankModal from '@/components/InitialBankModal';
import { UserDataService } from '@/lib/userDataService';
import { BankrollService } from '@/lib/bankrollService';
import { realGoogleSheetsService } from '@/lib/realGoogleSheets';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/stores/appStore';
import { CARD_BASE_STYLE, CARD_HOVER_STYLE, CHART_CARD_SHADOW, applyCardHover, resetCardHover } from '@/lib/cardStyles';
import { logRender } from '@/lib/devLogger';
import { 
  Target, 
  DollarSign,
  Filter,
  RefreshCw,
  Trash2,
  AlertTriangle,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Flag,
  Wallet,
  Edit,
  ChevronDown,
  ChevronUp,
  User,
  Sun,
  Moon,
  MoreHorizontal,
  Pencil
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, ReferenceLine } from 'recharts';
import type { Bet, BettingStats, OddsRange, BalanceData, ScatterData } from '@/types/betting';

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
  logRender('Analytics');
  const { user } = useAuth();
  const currentUser = user?.username || '';
  const isAdmin = user?.role === 'admin';
  
  const [stats, setStats] = useState<BettingStats>({
    totalBets: 0,
    winRate: 0,
    totalProfit: 0,
    averageROI: 0,
    profitByMonth: [],
    profitByStrategy: []
  });
  
  const [bets, setBets] = useState<Bet[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [connectionStatus] = useState({ connected: false, environment: 'Browser' });
  const bumpBankroll = useAppStore((s) => s.bumpBankroll);
  const bankrollVersion = useAppStore((s) => s.bankrollVersion);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankrollStats, setBankrollStats] = useState({
    initialBank: 0,
    currentBank: 0,
    totalProfit: 0,
    roi: 0
  });
  const [activeTab, setActiveTab] = useState('profit');
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [gameFilter, setGameFilter] = useState<'all' | 'CS2' | 'Dota2'>('CS2');

  useEffect(() => {
    loadAnalyticsData();
    updateBankrollStats();
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes('bankroll_') && e.key.includes(currentUser)) {
        updateBankrollStats();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser]);

  // React to bankroll bumps from other components
  useEffect(() => {
    updateBankrollStats();
  }, [bankrollVersion]);

  useEffect(() => {
    const handleClickOutside = () => setShowActionsMenu(false);
    if (showActionsMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActionsMenu]);

  const updateBankrollStats = useCallback(() => {
    const allBets = realGoogleSheetsService.getAllRecords();
    const bankStats = BankrollService.getBankrollStats(currentUser, allBets);
    setBankrollStats(bankStats);
  }, [currentUser]);

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      
      const myBetsData = UserDataService.getUserData(currentUser, 'mybets_data', []);
      const myBetsStats = UserDataService.getUserData(currentUser, 'mybets_stats', null);
      
      setBets(myBetsData);
      
      if (myBetsData.length > 0) {
        const completedBets = myBetsData.filter((bet: Bet) => bet.result !== 'Pending');
        const winningBets = completedBets.filter((bet: Bet) => bet.result === 'Win');
        
        const totalBets = completedBets.length;
        const winRate = totalBets > 0 ? Math.round((winningBets.length / totalBets) * 100) : 0;
        const totalProfit = completedBets.reduce((sum: number, bet: Bet) => sum + (bet.profit || 0), 0);
        const averageROI = totalBets > 0 ? Math.round((totalProfit / completedBets.reduce((sum: number, bet: Bet) => sum + bet.amount, 0)) * 100) : 0;
        
        setStats({
          totalBets,
          winRate,
          totalProfit,
          averageROI,
          profitByMonth: myBetsStats?.profitByMonth || [],
          profitByStrategy: myBetsStats?.profitByStrategy || []
        });
      } else {
        setStats({
          totalBets: 0,
          winRate: 0,
          totalProfit: 0,
          averageROI: 0,
          profitByMonth: [],
          profitByStrategy: []
        });
      }
      
    } catch (error) {
      console.error('❌ Error loading analytics:', error);
      setBets([]);
      setStats({
        totalBets: 0,
        winRate: 0,
        totalProfit: 0,
        averageROI: 0,
        profitByMonth: [],
        profitByStrategy: []
      });
    } finally {
      setLoading(false);
      updateBankrollStats();
    }
  }, [currentUser, updateBankrollStats]);

  const clearAllData = useCallback(() => {
    if (window.confirm('Ви впевнені, що хочете очистити всі дані аналітики? Ця дія незворотна.')) {
      UserDataService.clearUserData(currentUser, 'mybets_data');
      UserDataService.clearUserData(currentUser, 'mybets_stats');
      UserDataService.clearUserData(currentUser, 'analytics_bets');
      UserDataService.clearUserData(currentUser, 'analytics_stats');
      
      setBets([]);
      setStats({
        totalBets: 0,
        winRate: 0,
        totalProfit: 0,
        averageROI: 0,
        profitByMonth: [],
        profitByStrategy: []
      });
      
      BankrollService.setInitialBank(currentUser, 0);
      setBankrollStats({
        initialBank: 0,
        currentBank: 0,
        totalProfit: 0,
        roi: 0
      });
    }
  }, [currentUser, updateBankrollStats]);

  const handleBankCardClick = useCallback(() => {
    setBankModalOpen(true);
  }, []);

  const handleBankModalClose = useCallback((success: boolean) => {
    setBankModalOpen(false);
    if (success) {
      updateBankrollStats();
      bumpBankroll();
    }
  }, [updateBankrollStats, bumpBankroll]);

  const toggleTheme = useCallback(() => {
    setIsDarkTheme(prev => !prev);
  }, []);

  // Filter bets by game
  const gameFilteredBets = useMemo(() => {
    if (gameFilter === 'all') return bets;
    return bets.filter((bet: Bet) => {
      const g = bet.game || '';
      return g === gameFilter || (gameFilter === 'CS2' && g === 'CS') || (gameFilter === 'Dota2' && g === 'Dota');
    });
  }, [bets, gameFilter]);

  // Derive memoized metrics
  const { completedBets, winningBets, losingBets } = useMemo(() => {
    const completed = gameFilteredBets.filter((bet: Bet) => bet.result !== 'Pending');
    return {
      completedBets: completed,
      winningBets: completed.filter((bet: Bet) => bet.result === 'Win'),
      losingBets: completed.filter((bet: Bet) => bet.result === 'Loss'),
    };
  }, [gameFilteredBets]);

  // Game-filtered stats for quick stat cards
  const filteredStats = useMemo(() => {
    const totalBets = completedBets.length;
    const winRate = totalBets > 0 ? Math.round((winningBets.length / totalBets) * 100) : 0;
    const totalProfit = completedBets.reduce((sum: number, bet: Bet) => sum + (bet.profit || 0), 0);
    return { totalBets, winRate, totalProfit };
  }, [completedBets, winningBets]);

  const streaks = useMemo(() => {
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;

    const sortedBets = [...completedBets].sort((a: Bet, b: Bet) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const bet of sortedBets) {
      if (bet.result === 'Win') {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    }

    return { maxWinStreak, maxLossStreak, currentWinStreak, currentLossStreak };
  }, [completedBets]);

  const oddsAnalysis = useMemo((): OddsRange[] => {
    const lowOdds = completedBets.filter((bet: Bet) => bet.odds < 2.0);
    const midOdds = completedBets.filter((bet: Bet) => bet.odds >= 2.0 && bet.odds < 3.0);
    const highOdds = completedBets.filter((bet: Bet) => bet.odds >= 3.0);
    
    return [
      {
        range: 'Низькі (< 2.0)',
        count: lowOdds.length,
        winRate: lowOdds.length ? (lowOdds.filter((b: Bet) => b.result === 'Win').length / lowOdds.length * 100).toFixed(1) : '0',
        profit: lowOdds.reduce((sum: number, bet: Bet) => sum + (bet.profit || 0), 0)
      },
      {
        range: 'Середні (2.0-3.0)',
        count: midOdds.length,
        winRate: midOdds.length ? (midOdds.filter((b: Bet) => b.result === 'Win').length / midOdds.length * 100).toFixed(1) : '0',
        profit: midOdds.reduce((sum: number, bet: Bet) => sum + (bet.profit || 0), 0)
      },
      {
        range: 'Високі (> 3.0)',
        count: highOdds.length,
        winRate: highOdds.length ? (highOdds.filter((b: Bet) => b.result === 'Win').length / highOdds.length * 100).toFixed(1) : '0',
        profit: highOdds.reduce((sum: number, bet: Bet) => sum + (bet.profit || 0), 0)
      }
    ];
  }, [completedBets]);

  const shortenBetTypeName = (betType: string): string => {
    if (betType.includes('Експрес') || betType.includes('|')) {
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
    const distribution: { [key: string]: { count: number; profit: number; wins: number; originalName: string } } = {};
    gameFilteredBets.forEach((bet: Bet) => {
      const originalType = bet.betType || 'Winner';
      const shortType = shortenBetTypeName(originalType);
      
      if (!distribution[shortType]) {
        distribution[shortType] = { count: 0, profit: 0, wins: 0, originalName: originalType };
      }
      distribution[shortType].count += 1;
      distribution[shortType].profit += bet.profit || 0;
      if (bet.result === 'Win') {
        distribution[shortType].wins += 1;
      }
    });
    
    const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];
    return Object.entries(distribution).map(([type, data], index) => ({
      name: type,
      originalName: data.originalName,
      value: data.count,
      profit: Math.round(data.profit * 100) / 100,
      winRate: data.count > 0 ? Math.round((data.wins / data.count) * 100) : 0,
      color: colors[index % colors.length]
    }));
  }, [bets]);

  const monthlyProfitData = useMemo((): MonthlyData[] => {
    const monthlyData: { [key: string]: { profit: number; wins: number; losses: number } } = {};
    
    completedBets.forEach((bet: Bet) => {
      const date = new Date(bet.date);
      const monthName = date.toLocaleDateString('uk-UA', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthName]) {
        monthlyData[monthName] = { profit: 0, wins: 0, losses: 0 };
      }
      monthlyData[monthName].profit += bet.profit || 0;
      if (bet.result === 'Win') {
        monthlyData[monthName].wins += 1;
      } else {
        monthlyData[monthName].losses += 1;
      }
    });
    
    let cumulative = 0;
    return Object.entries(monthlyData)
      .sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateA.getTime() - dateB.getTime();
      })
      .map(([month, data]) => {
        cumulative += data.profit;
        return {
          month,
          profit: Math.round(data.profit * 100) / 100,
          cumulative: Math.round(cumulative * 100) / 100,
          wins: data.wins,
          losses: data.losses,
          totalBets: data.wins + data.losses,
          winRate: data.wins + data.losses > 0 ? Math.round((data.wins / (data.wins + data.losses)) * 100) : 0
        };
      });
  }, [completedBets]);

  const balanceOverTime = useMemo((): BalanceData[] => {
    let runningBalance = 0;

    const sortedBets = [...completedBets].sort((a: Bet, b: Bet) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const balanceData: BalanceData[] = [{
      date: sortedBets[0]?.date || new Date().toISOString().split('T')[0],
      balance: 0,
      profit: 0
    }];

    sortedBets.forEach((bet: Bet) => {
      runningBalance += bet.profit || 0;
      balanceData.push({
        date: bet.date,
        balance: runningBalance,
        profit: bet.profit || 0,
        betName: bet.match || bet.betType || 'Ставка',
        odds: bet.odds
      });
    });

    return balanceData;
  }, [completedBets]);

  const scatterData = useMemo((): ScatterData[] => {
    return completedBets.map((bet: Bet) => ({
      odds: Math.round(Number(bet.odds) * 100) / 100,
      profit: Math.round(Number(bet.profit) * 100) / 100,
      result: bet.result,
      betType: bet.betType || 'Winner',
      match: bet.match || '',
      fill: bet.result === 'Win' ? '#10b981' : '#ef4444'
    }));
  }, [completedBets]);

  const oddsData = oddsAnalysis;    // now a memoized value, not a function call
  const betTypes = betTypeDistribution;
  const monthlyProfit = monthlyProfitData;
  const balanceData = balanceOverTime;

  const oddsChartData = oddsData.map(range => ({
    range: range.range.replace(/\s*\(.*?\)\s*/g, ''),
    winRate: parseFloat(range.winRate),
    roi: range.count > 0 ? Math.round((range.profit / (range.count * 100)) * 100) : 0,
    bets: range.count
  }));

  const tabs = [
    { id: 'profit', label: 'Прибуток', icon: Wallet },
    { id: 'odds', label: 'Коефіцієнти', icon: BarChart3 },
    { id: 'comparison', label: 'Періоди', icon: Calendar },
  ];

  const activeFiltersCount = timeFilter !== 'all' ? 1 : 0;

  // Shared card style for hover shadow effect (matches StatCard)
  const cardBaseStyle = CARD_BASE_STYLE;
  const cardHoverStyle = CARD_HOVER_STYLE;

  // Enhanced card shadow for chart cards — subtle depth like header
  const chartCardShadow = CHART_CARD_SHADOW;

  // Odds category labels
  const oddsCategoryLabels = [
    { label: 'Низькі', sublabel: '< 2.0' },
    { label: 'Середні', sublabel: '2.0 – 3.0' },
    { label: 'Високі', sublabel: '> 3.0' }
  ];

  // Game-specific stats for BalanceTracker
  const cs2Stats = useMemo(() => {
    const cs2 = bets.filter((bet: Bet) => (bet.game || '') === 'CS2' || (bet.game || '') === 'CS');
    const completedCS2 = cs2.filter((b: Bet) => b.result !== 'Pending');
    return {
      bets: completedCS2.length,
      profit: completedCS2.reduce((sum: number, b: Bet) => sum + (b.profit || 0), 0),
    };
  }, [bets]);

  const dota2Stats = useMemo(() => {
    const dota = bets.filter((bet: Bet) => (bet.game || '') === 'Dota2' || (bet.game || '') === 'Dota');
    const completedDota = dota.filter((b: Bet) => b.result !== 'Pending');
    return {
      bets: completedDota.length,
      profit: completedDota.reduce((sum: number, b: Bet) => sum + (b.profit || 0), 0),
    };
  }, [bets]);

  // All-time high/low for balance tracker — based on actual bet history, not current bank
  const allTimeHigh = useMemo(() => {
    if (completedBets.length === 0) return 0; // no history yet
    // Include initial bank as potential peak (before any bet was placed)
    const initialPeak = bankrollStats.initialBank || bankrollStats.currentBank;
    return Math.max(initialPeak, ...balanceData.map(d => d.balance), bankrollStats.currentBank);
  }, [balanceData, bankrollStats, completedBets.length]);

  const allTimeLow = useMemo(() => {
    if (completedBets.length === 0) return 0;
    return Math.min(...balanceData.map(d => d.balance), bankrollStats.currentBank);
  }, [balanceData, bankrollStats.currentBank, completedBets.length]);

  return (
    <div className="min-h-screen bg-[#f3f3f3] relative">
      <InitialBankModal 
        open={bankModalOpen} 
        onClose={handleBankModalClose}
        mode={BankrollService.isInitialized(currentUser) ? 'edit' : 'setup'}
      />

      {/* ===== HEADER ===== */}
      <div className="px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-[48px] font-semibold text-[#111827] leading-tight tracking-tight">
            Аналітика
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
                      loadAnalyticsData();
                      setShowActionsMenu(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                  >
                    <RefreshCw className="h-4 w-4 text-[#9CA3AF]" strokeWidth={1.5} />
                    Оновити дані
                  </button>
                  <button
                    onClick={() => {
                      clearAllData();
                      setShowActionsMenu(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    Очистити дані
                  </button>
                </div>
              )}
            </div>

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

            <div className="w-px h-8 bg-[#D1D5DB]" />

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111827]">
                <User className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[#111827] leading-tight">
                  {currentUser || 'User'}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded px-1.5 py-0.5 leading-tight mt-0.5">
                  Активний
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 space-y-8 px-6 lg:px-8 pb-8 pt-4">

        {gameFilteredBets.length === 0 && (
          <Alert className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-5">
            <AlertTriangle className="h-5 w-5 text-[#3B82F6]" strokeWidth={1.5} />
            <AlertDescription className="text-sm text-[#1E40AF] ml-2">
              <strong className="font-medium">Немає даних для аналізу.</strong> Додайте данні на сторінці "Додати запис" для перегляду аналітики.
            </AlertDescription>
          </Alert>
        )}

        {/* ===== QUICK STATS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* 1. Поточний банк */}
          <div 
            className="stat-card bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 cursor-pointer group relative overflow-hidden hover:border-[#D1D5DB]"
            onClick={handleBankCardClick}
            style={cardBaseStyle}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, cardHoverStyle);
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, cardBaseStyle);
            }}
          >
            <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 bg-[#F3F4F6] group-hover:bg-[#111827] px-3 py-1.5 rounded-full transition-all duration-300">
              <Pencil className="h-3.5 w-3.5 text-[#6B7280] group-hover:text-white transition-colors duration-300" strokeWidth={2} />
              <span className="text-xs font-medium text-[#6B7280] group-hover:text-white transition-colors duration-300">Редагувати</span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Wallet className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-[#111827]">Поточний банк</span>
            </div>
            <div className="text-4xl font-bold text-[#111827] tracking-tight mb-2">
              {bankrollStats.currentBank.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴
            </div>
            <div className="flex items-center gap-2">
              {filteredStats.totalProfit >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-[#EF4444]" strokeWidth={2.5} />
              )}
              <span className={`text-base font-normal ${filteredStats.totalProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {filteredStats.totalProfit >= 0 ? '+' : ''}{filteredStats.totalProfit.toFixed(2)} ₴
              </span>
              <span className="text-sm text-[#9CA3AF]">за весь час</span>
            </div>
          </div>

          {/* 2. Загальний профіт */}
          <div 
            className="stat-card bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, cardHoverStyle);
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, cardBaseStyle);
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-[#111827]">Загальний профіт</span>
            </div>
            <div className="text-4xl font-bold text-[#111827] tracking-tight mb-2">
              {(filteredStats.totalProfit || 0) >= 0 ? '+' : ''}{(filteredStats.totalProfit || 0).toFixed(2)} ₴
            </div>
            <div className="flex items-center gap-2">
              {(filteredStats.totalProfit || 0) >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-[#EF4444]" strokeWidth={2.5} />
              )}
              <span className={`text-base font-normal ${(filteredStats.totalProfit || 0) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {(filteredStats.totalProfit || 0) >= 0 ? 'Позитивна динаміка' : 'Негативна динаміка'}
              </span>
              <span className="text-sm text-[#9CA3AF]">за весь час</span>
            </div>
          </div>

          {/* 3. Всього ставок — GREEN donut */}
          <div 
            className="stat-card bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, cardHoverStyle);
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, cardBaseStyle);
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-[#111827]">Всього записів</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col justify-center">
                <div className="text-4xl font-bold text-[#111827] tracking-tight mb-2">
                  {filteredStats.totalBets || 0}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
                    <span className="text-base font-semibold text-[#111827]">{winningBets.length}</span>
                    <span className="text-sm text-[#9CA3AF]">виграшів</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#FCA5A5' }} />
                    <span className="text-base font-semibold text-[#111827]">{losingBets.length}</span>
                    <span className="text-sm text-[#9CA3AF]">програшів</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center flex-shrink-0">
                <MiniDonut 
                  value={winningBets.length} 
                  total={filteredStats.totalBets || 1} 
                  colors={{ main: '#10B981', sub1: '#6EE7B7', sub2: '#FCA5A5' }}
                  size={140}
                />
              </div>
            </div>
          </div>

          {/* 4. Win Rate — GREEN donut */}
          <div 
            className="stat-card bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, cardHoverStyle);
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, cardBaseStyle);
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-[#111827]">Вінрейт</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col justify-center">
                <div className="text-4xl font-bold text-[#111827] tracking-tight mb-2">
                  {filteredStats.winRate || 0}%
                </div>
                <div className="flex items-center gap-2">
                  {(filteredStats.winRate || 0) >= 50 ? (
                    <ArrowUpRight className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-[#EF4444]" strokeWidth={2.5} />
                  )}
                  <span className={`text-sm font-semibold ${(filteredStats.winRate || 0) >= 50 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {(filteredStats.winRate || 0) >= 50 ? 'Вище середнього' : 'Нижче середнього'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center flex-shrink-0">
                <MiniDonut 
                  value={filteredStats.winRate || 0} 
                  total={100} 
                  colors={{ main: '#10B981', sub1: '#6EE7B7', sub2: '#ECFDF5' }}
                  size={140}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Custom Tabs Navigation */}
        <div className="space-y-6">
          <BalanceTracker
            currentBank={bankrollStats.currentBank}
            allTimeHigh={allTimeHigh}
            allTimeLow={allTimeLow}
            gameFilter={gameFilter}
            onGameFilterChange={setGameFilter}
            cs2Bets={cs2Stats.bets}
            dota2Bets={dota2Stats.bets}
            cs2Profit={cs2Stats.profit}
            dota2Profit={dota2Stats.profit}
          />

          <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-3 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
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
                      {Icon && <Icon className="h-4 w-4" strokeWidth={1.5} />}
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'profit' && (
              <div className="grid grid-cols-1 gap-6">
                {gameFilteredBets.length > 0 ? (
                  <>
                    <BalanceChart data={balanceData} />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <MonthlyProfitChartCard data={monthlyProfit} chartCardShadow={chartCardShadow} />
                      <OddsVsProfitScatterCard data={scatterData} winCount={winningBets.length} lossCount={losingBets.length} chartCardShadow={chartCardShadow} />
                    </div>
                  </>
                ) : (
                  <Card 
                    className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden"
                    style={{ boxShadow: chartCardShadow }}
                  >
                    <CardContent className="py-16 text-center">
                      <div className="p-8 bg-[#F3F4F6] rounded-2xl inline-block mb-6">
                        <DollarSign className="h-16 w-16 text-[#9CA3AF]" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl font-semibold text-[#111827] mb-2">
                        Немає даних про прибуток
                      </h3>
                      <p className="text-[#6B7280] text-sm">
                        Додайте ставки для перегляду аналізу прибутку
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'goals' && <GoalsManager />}

            {/* ===== КОЕФІЦІЄНТИ TAB — GREEN CHARTS ===== */}
            {activeTab === 'odds' && (
              <div className="space-y-6">
                {gameFilteredBets.length > 0 ? (
                  <>
                    <OddsWinRateChartCard data={oddsChartData} chartCardShadow={chartCardShadow} />
                    <OddsCategoryCards data={oddsData} labels={oddsCategoryLabels} />
                  </>
                ) : (
                  <Card 
                    className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden"
                    style={{ boxShadow: chartCardShadow }}
                  >
                    <CardContent className="py-16 text-center">
                      <div className="p-8 bg-[#F3F4F6] rounded-2xl inline-block mb-6">
                        <Target className="h-16 w-16 text-[#9CA3AF]" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl font-semibold text-[#111827] mb-2">
                        Немає даних для аналізу коефіцієнтів
                      </h3>
                      <p className="text-[#6B7280] text-sm">
                        Додайте ставки для перегляду аналізу по категоріях коефіцієнтів
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'comparison' && <PeriodComparison bets={bets} />}
            {activeTab === 'risks' && <RiskManagement bets={bets} />}
          </div>
        </div>
      </div>
    </div>
  );
}