import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import BalanceChart from '@/components/BalanceChart';
import MiniDonut from '@/components/MiniDonut';
import MonthlyProfitChartCard from '@/components/analytics/MonthlyProfitChartCard';
import OddsVsProfitScatterCard from '@/components/analytics/OddsVsProfitScatterCard';
import OddsWinRateChartCard from '@/components/analytics/OddsWinRateChartCard';
import OddsCategoryCards from '@/components/analytics/OddsCategoryCards';
import RiskManagement from '@/components/RiskManagement';
import PeriodComparison from '@/components/PeriodComparison';
import { PageHeader } from '@/components/PageHeader';
import GoalsManager from '@/components/GoalsManager';
import InitialBankModal from '@/components/InitialBankModal';
import { UserDataService } from '@/lib/userDataService';
import { BankrollService } from '@/lib/bankrollService';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/hooks/useTheme';
import { CARD_BASE_STYLE, CARD_HOVER_STYLE, CHART_CARD_SHADOW, applyCardHover, resetCardHover } from '@/lib/cardStyles';
import { logRender } from '@/lib/devLogger';
import { AnalyticsSkeleton } from '@/components/PageSkeleton';
import { useRiskMetrics } from '@/hooks/useRiskMetrics';
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
  Pencil,
  TrendingDown,
  TrendingUp,
  Info,
  Clock,
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend, ReferenceLine } from 'recharts';
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
  const { theme, toggleTheme } = useTheme();
  const isDarkTheme = theme === 'dark';
  const [gameFilter, setGameFilter] = useState<'all' | 'CS2' | 'Dota2'>('CS2');

  const { completedBets: completedBetsForMetrics, riskMetrics, drawdownPeriods } = useRiskMetrics(bets);

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


  const updateBankrollStats = useCallback(async () => {
    try {
      const apiStats = await BankrollService.fetchBankroll();
      if (apiStats.initialBank > 0) {
        setBankrollStats(apiStats);
        return;
      }
    } catch { /* noop */ }
    // Fallback to localStorage
    const allBets = UserDataService.getUserData(currentUser, 'mybets_data', [] as Bet[]);
    const bankStats = BankrollService.getBankrollStats(currentUser, allBets);
    setBankrollStats(bankStats);
  }, [currentUser]);

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      
      let myBetsData: Bet[] = [];
      let myBetsStats = null;

      // 1. Try API first (fast, ~50ms)
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${API_BASE}/bets?page=1&limit=200`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (res.ok) {
          const json = await res.json();
          const bets = json.data || json;
          if (bets.length > 0) {
            myBetsData = bets;
          }
        }
      } catch { /* fallback */ }

      // 2. Fallback: localStorage (only if API failed or returned empty)
      if (myBetsData.length === 0) {
        myBetsData = UserDataService.getUserData<Bet[]>(currentUser, 'mybets_data', []);
        myBetsStats = UserDataService.getUserData(currentUser, 'mybets_stats', null);
      }
      
      setBets(myBetsData);
      
      if (myBetsData.length > 0) {
        const completedBets = myBetsData.filter((bet: Bet) => bet.result !== 'Pending');
        const winningBets = completedBets.filter((bet: Bet) => bet.result === 'Win');
        
        const totalBets = completedBets.length;
        const winRate = totalBets > 0 ? Math.round((winningBets.length / totalBets) * 100) : 0;
        const totalProfit = completedBets.reduce((sum: number, bet: Bet) => sum + (bet.profit || 0), 0);
        const averageROI = totalBets > 0 ? Math.round((totalProfit / completedBets.reduce((sum: number, bet: Bet) => sum + bet.amount, 0)) * 100) : 0;
        
        // Try API stats, fallback to localStorage
        let profitByMonth: { month: string; profit: number }[] = [];
        let profitByStrategy: { strategy: string; profit: number }[] = [];
        try {
          const apiStats = await UserDataService.fetchBetStats();
          profitByMonth = apiStats.profitByMonth || [];
          profitByStrategy = apiStats.profitByStrategy || [];
        } catch {
          profitByMonth = myBetsStats?.profitByMonth || [];
          profitByStrategy = myBetsStats?.profitByStrategy || [];
        }
        
        setStats({
          totalBets,
          winRate,
          totalProfit,
          averageROI,
          profitByMonth,
          profitByStrategy
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

  // Refresh bankroll when user switches back to this tab
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const apiStats = await BankrollService.fetchBankroll();
          if (apiStats.initialBank > 0) { setBankrollStats(apiStats); return; }
        } catch {}
        // Fallback to localStorage
        const allBets = UserDataService.getUserData<Bet[]>(currentUser, 'mybets_data', []);
        const bankStats = BankrollService.getBankrollStats(currentUser, allBets);
        setBankrollStats(bankStats);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [currentUser]);

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
    const monthlyData: { [key: string]: { profit: number; wins: number; losses: number; sortKey: string } } = {};
    
    completedBets.forEach((bet: Bet) => {
      const date = new Date(bet.date);
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('uk-UA', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthName]) {
        monthlyData[monthName] = { profit: 0, wins: 0, losses: 0, sortKey };
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

  return (
    <div className="min-h-screen bg-[#f3f3f3] relative flex flex-col">
      {loading ? <AnalyticsSkeleton /> : (<>
      <InitialBankModal 
        open={bankModalOpen} 
        onClose={handleBankModalClose}
        mode={BankrollService.isInitialized(currentUser) ? 'edit' : 'setup'}
      />

      {/* ===== HEADER ===== */}
      <PageHeader
        title="Аналітика"
        currentUser={currentUser || 'User'}
        isDarkTheme={isDarkTheme}
        onToggleTheme={toggleTheme}
        showThemeToggle={false}
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
                <AlertTriangle className="h-6 w-6 text-red-500" strokeWidth={1.5} />
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* 1. Поточний банк */}
          <div 
            className="stat-card bg-white border border-gray-200 rounded-3xl px-6 py-5 cursor-pointer group relative overflow-hidden hover:border-gray-400"
            onClick={handleBankCardClick}
            style={cardBaseStyle}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, cardHoverStyle);
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, cardBaseStyle);
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50">
                <Wallet className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
              </div>
              <span className="text-lg font-semibold text-gray-900">Поточний банк</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleBankCardClick(); }}
                className="ml-auto flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white shadow-[0_2px_8px_rgba(68,122,252,0.3)] transition-all duration-200"
                title="Редагувати банк"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
            <div className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
              {bankrollStats.currentBank.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴
            </div>
            <div className="flex items-center gap-2">
              {filteredStats.totalProfit >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" strokeWidth={2.5} />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" strokeWidth={2.5} />
              )}
              <span className={`text-base font-normal ${Number(filteredStats.totalProfit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Number(filteredStats.totalProfit) >= 0 ? '+' : ''}{Number(filteredStats.totalProfit).toFixed(2)} ₴
              </span>
              <span className="text-sm text-gray-400">за весь час</span>
            </div>
          </div>

          {/* 2. Загальний профіт */}
          <div 
            className="stat-card bg-white border border-gray-200 hover:border-gray-400 rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, cardHoverStyle);
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, cardBaseStyle);
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50">
                <DollarSign className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
              </div>
              <span className="text-lg font-semibold text-gray-900">Загальний профіт</span>
            </div>
            <div className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
              {Number(filteredStats.totalProfit || 0) >= 0 ? '+' : ''}{Number(filteredStats.totalProfit || 0).toFixed(2)} ₴
            </div>
            <div className="flex items-center gap-2">
              {(filteredStats.totalProfit || 0) >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" strokeWidth={2.5} />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" strokeWidth={2.5} />
              )}
              <span className={`text-base font-normal ${(filteredStats.totalProfit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {(filteredStats.totalProfit || 0) >= 0 ? 'Позитивна динаміка' : 'Негативна динаміка'}
              </span>
              <span className="text-sm text-gray-400">за весь час</span>
            </div>
          </div>

          {/* 3. Всього ставок — GREEN donut */}
          <div 
            className="stat-card bg-white border border-gray-200 hover:border-gray-400 rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, cardHoverStyle);
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, cardBaseStyle);
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50">
                <BarChart3 className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
              </div>
              <span className="text-lg font-semibold text-gray-900">Всього записів</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col justify-center">
                <div className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
                  {filteredStats.totalBets || 0}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
                    <span className="text-base font-semibold text-gray-900">{winningBets.length}</span>
                    <span className="text-sm text-gray-400">виграшів</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#FCA5A5' }} />
                    <span className="text-base font-semibold text-gray-900">{losingBets.length}</span>
                    <span className="text-sm text-gray-400">програшів</span>
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
            className="stat-card bg-white border border-gray-200 hover:border-gray-400 rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, cardHoverStyle);
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, cardBaseStyle);
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50">
                <Target className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
              </div>
              <span className="text-lg font-semibold text-gray-900">Вінрейт</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col justify-center">
                <div className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
                  {filteredStats.winRate || 0}%
                </div>
                <div className="flex items-center gap-2">
                  {(filteredStats.winRate || 0) >= 50 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" strokeWidth={2.5} />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" strokeWidth={2.5} />
                  )}
                  <span className={`text-sm font-semibold ${(filteredStats.winRate || 0) >= 50 ? 'text-green-500' : 'text-red-500'}`}>
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
        </div>

        {/* Custom Tabs Navigation */}
        <div className="flex flex-col flex-1 min-h-0 space-y-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-3 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
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
                        ? 'bg-blue-500 text-white font-medium shadow-[0_4px_16px_rgba(68,122,252,0.3)] border border-transparent' 
                        : 'bg-transparent text-gray-400 hover:bg-[#F5F5F3] hover:text-gray-500 border border-transparent'
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
          <div className="flex flex-col flex-1 min-h-0">
            {activeTab === 'profit' && (
              <div className="flex flex-col flex-1">
                {gameFilteredBets.length > 0 ? (
                  <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                    <div className="mb-6">
                      <BalanceChart data={balanceData} />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <MonthlyProfitChartCard data={monthlyProfit} chartCardShadow={chartCardShadow} />
                      <OddsVsProfitScatterCard data={scatterData} winCount={winningBets.length} lossCount={losingBets.length} chartCardShadow={chartCardShadow} />
                    </div>
                  </div>
                ) : (
                  <Card 
                    className="rounded-2xl bg-white overflow-hidden flex-1 flex items-center justify-center"
                    style={{ boxShadow: chartCardShadow }}
                  >
                    <CardContent className="py-16 text-center">
                      <div className="p-8 bg-gray-100 rounded-2xl inline-block mb-6">
                        <Wallet className="h-16 w-16 text-gray-400" strokeWidth={1.5} />
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

            {activeTab === 'goals' && <GoalsManager />}

            {/* ===== КОЕФІЦІЄНТИ TAB ===== */}
            {activeTab === 'odds' && (
              <div className="flex flex-col flex-1">
                {gameFilteredBets.length > 0 ? (
                  <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-6">
                    <OddsWinRateChartCard data={oddsChartData} chartCardShadow={chartCardShadow} />
                    <OddsCategoryCards data={oddsData} labels={oddsCategoryLabels} />
                  </div>
                ) : (
                  <Card 
                    className="rounded-2xl bg-white overflow-hidden flex-1 flex items-center justify-center"
                    style={{ boxShadow: chartCardShadow }}
                  >
                    <CardContent className="py-16 text-center">
                      <div className="p-8 bg-gray-100 rounded-2xl inline-block mb-6">
                        <BarChart3 className="h-16 w-16 text-gray-400" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Немає даних для аналізу коефіцієнтів
                      </h3>
                      <p className="text-gray-500 text-sm">
                        Додайте ставки для перегляду аналізу по категоріях коефіцієнтів
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'comparison' && (
              <TooltipProvider>
                <div className="flex flex-col flex-1">
                <div className="bg-white rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex-1 flex flex-col">
                <PeriodComparison bets={bets} />
                
                {/* Risk Metrics + Drawdown Periods — only show when there's data */}
                {completedBetsForMetrics.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
                  <Card 
                    className="border border-gray-300 rounded-2xl bg-white overflow-hidden"
                    style={{ boxShadow: chartCardShadow }}
                  >
                    <CardHeader className="bg-white border-b border-gray-200 p-6">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                        <div className="p-2.5 bg-blue-50 rounded-xl">
                          <BarChart3 className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
                        </div>
                        Детальні ризик-метрики
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {completedBetsForMetrics.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="p-8 bg-gray-100 rounded-2xl inline-block mb-6">
                            <BarChart3 className="h-16 w-16 text-gray-400" strokeWidth={1.5} />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Немає даних для метрик</h3>
                          <p className="text-gray-500 text-sm">Додайте завершені ставки для розрахунку ризик-метрик</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingDown className="h-4 w-4 text-red-500" strokeWidth={1.5} />
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Поточна просадка</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">{riskMetrics.currentDrawdown}%</span>
                            <Progress value={Math.min(riskMetrics.currentDrawdown, 100)} className="h-1.5 mt-2 bg-gray-200 [&>div]:bg-red-500" />
                          </div>
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingDown className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Послідовні програші</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">{riskMetrics.consecutiveLosses}</span>
                            <div className="h-1.5 mt-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${Math.min(riskMetrics.consecutiveLosses * 20, 100)}%` }} />
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="h-4 w-4 text-blue-500" strokeWidth={1.5} />
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Середня ставка</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">{riskMetrics.averageStake} ₴</span>
                            <div className="h-1.5 mt-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((riskMetrics.averageStake / (riskMetrics.maxStake || 1)) * 100, 100)}%` }} />
                            </div>
                          </div>
                          <div className="p-4 bg-red-50 rounded-2xl border border-red-200">
                            <div className="flex items-center gap-2 mb-2">
                              <ArrowDownRight className="h-4 w-4 text-red-500" strokeWidth={1.5} />
                              <span className="text-xs font-medium text-red-800 uppercase tracking-wider">Найбільший програш</span>
                            </div>
                            <span className="text-xl font-bold text-red-600">{riskMetrics.largestLoss} ₴</span>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 col-span-2">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-green-500" strokeWidth={1.5} />
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Kelly %</span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button className="inline-flex items-center">
                                      <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" strokeWidth={1.5} />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs bg-white border border-gray-200 rounded-xl p-4 shadow-lg">
                                    <p className="text-sm font-medium text-gray-900 mb-2">Kelly Criterion — агресивна стратегія</p>
                                    <p className="text-xs text-gray-500 mb-2">Розраховано на основі win rate та середніх коефіцієнтів.</p>
                                    <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                      <p className="text-xs text-amber-800">Рекомендовано використовувати 25–50% від Kelly для зниження ризику</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-lg font-bold ${riskMetrics.kellyPercentage > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {riskMetrics.kellyPercentage}%
                                </span>
                                {riskMetrics.kellyPercentage > 5 && (
                                  <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50 border border-amber-200 font-medium text-xs px-2 py-0.5 rounded-lg">Aggressive</Badge>
                                )}
                              </div>
                            </div>
                            <Progress value={Math.min(Math.abs(riskMetrics.kellyPercentage) * 4, 100)} className="h-2 bg-gray-200 [&>div]:bg-green-500" />
                          </div>
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Risk of Ruin</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="inline-flex items-center">
                                    <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" strokeWidth={1.5} />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs bg-white border border-gray-200 rounded-xl p-4 shadow-lg">
                                  <p className="text-sm font-medium text-gray-900 mb-2">Як розраховується:</p>
                                  <p className="text-xs text-gray-500">Ймовірність втрати всього банкролу. Розраховано на основі win rate, середнього коефіцієнта та розміру ставок відносно банкролу.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <span className={`text-xl font-bold ${riskMetrics.riskOfRuin > 10 ? 'text-red-500' : riskMetrics.riskOfRuin > 5 ? 'text-amber-500' : 'text-green-500'}`}>
                              {riskMetrics.riskOfRuin}%
                            </span>
                            <Progress value={Math.min(riskMetrics.riskOfRuin * 5, 100)} className={`h-1.5 mt-2 bg-gray-200 ${riskMetrics.riskOfRuin > 10 ? '[&>div]:bg-red-500' : riskMetrics.riskOfRuin > 5 ? '[&>div]:bg-amber-500' : '[&>div]:bg-green-500'}`} />
                          </div>
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="h-4 w-4 text-blue-500" strokeWidth={1.5} />
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ризик вигр. серій</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">{riskMetrics.winStreakRisk}%</span>
                            <Progress value={Math.min(riskMetrics.winStreakRisk * 5, 100)} className="h-1.5 mt-2 bg-gray-200 [&>div]:bg-blue-500" />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card 
                    className="border border-gray-300 rounded-2xl bg-white overflow-hidden"
                    style={{ boxShadow: chartCardShadow }}
                  >
                    <CardHeader className="bg-white border-b border-gray-200 p-6">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                        <div className="p-2.5 bg-blue-50 rounded-xl">
                          <Calendar className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
                        </div>
                        Періоди просадок
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {completedBetsForMetrics.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="p-8 bg-gray-100 rounded-2xl inline-block mb-6">
                            <Calendar className="h-16 w-16 text-gray-400" strokeWidth={1.5} />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Немає даних про просадки</h3>
                          <p className="text-gray-500 text-sm">Додайте завершені ставки для відстеження періодів просадок</p>
                        </div>
                      ) : drawdownPeriods.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                          {drawdownPeriods.map((period, index) => (
                            <div key={index} className={`p-4 rounded-2xl border transition-all ${period.recovery ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-lg ${period.recovery ? 'bg-green-100' : 'bg-red-100'}`}>
                                    {period.recovery ? (
                                      <TrendingUp className="h-4 w-4 text-green-500" strokeWidth={1.5} />
                                    ) : (
                                      <TrendingDown className="h-4 w-4 text-red-500" strokeWidth={1.5} />
                                    )}
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">
                                    {new Date(period.start).toLocaleDateString('uk-UA')} — {new Date(period.end).toLocaleDateString('uk-UA')}
                                  </span>
                                </div>
                                <Badge className={`rounded-lg font-medium text-xs border ${period.recovery ? 'bg-green-50 text-green-500 hover:bg-green-50 border-green-200' : 'bg-red-50 text-red-500 hover:bg-red-50 border-red-200'}`}>
                                  {period.recovery ? 'Відновлено' : 'Поточна'}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-white/60 rounded-xl">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <Clock className="h-3.5 w-3.5 text-gray-500" strokeWidth={1.5} />
                                    <span className="text-xs text-gray-500">Тривалість</span>
                                  </div>
                                  <span className="text-lg font-bold text-gray-900">{period.duration} дн.</span>
                                </div>
                                <div className="p-3 bg-white/60 rounded-xl">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <ArrowDownRight className="h-3.5 w-3.5 text-red-500" strokeWidth={1.5} />
                                    <span className="text-xs text-gray-500">Макс. просадка</span>
                                  </div>
                                  <span className="text-lg font-bold text-red-500">-{Number(period.maxDrawdown).toFixed(1)}%</span>
                                </div>
                              </div>
                              <Progress value={Math.min(period.maxDrawdown * 4, 100)} className={`h-1.5 mt-3 bg-white/80 ${period.recovery ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'}`} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="p-8 bg-gray-100 rounded-2xl inline-block mb-6">
                            <Calendar className="h-16 w-16 text-gray-400" strokeWidth={1.5} />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Немає значних просадок</h3>
                          <p className="text-gray-500 text-sm">
                            {completedBetsForMetrics.length === 1
                              ? 'Додайте більше завершених ставок для виявлення періодів просадок'
                              : 'За поточний період не виявлено значних просадок банку'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                )}
              </div>
              </div>
              </TooltipProvider>
            )}
            {activeTab === 'risks' && <RiskManagement bets={bets} />}
          </div>
        </div>
      </div>
    </>
      )}
    </div>
  );
}
