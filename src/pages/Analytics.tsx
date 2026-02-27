import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import csharpDataService from '@/services/csharp-data-service';
import BalanceChart from '@/components/BalanceChart';
import RiskManagement from '@/components/RiskManagement';
import PeriodComparison from '@/components/PeriodComparison';
import PredictiveAnalytics from '@/components/PredictiveAnalytics';
import GoalsManager from '@/components/GoalsManager';
import InitialBankModal from '@/components/InitialBankModal';
import { UserDataService } from '@/lib/userDataService';
import { BankrollService } from '@/lib/bankrollService';
import { realGoogleSheetsService } from '@/lib/realGoogleSheets';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign,
  Filter,
  RefreshCw,
  Trash2,
  CheckCircle,
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
  MoreHorizontal
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, Legend, ReferenceLine } from 'recharts';
import type { Bet, BettingStats, OddsRange, BalanceData, ScatterData } from '@/types/betting';

interface TooltipPayload {
  payload: ScatterData;
}

interface ScatterTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

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
  const currentUser = localStorage.getItem('username') || '';
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';
  
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
  const [connectionStatus, setConnectionStatus] = useState({ connected: false, environment: 'Browser' });
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

  useEffect(() => {
    loadAnalyticsData();
    updateConnectionStatus();
    updateBankrollStats();
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes('bankroll_') && e.key.includes(currentUser)) {
        updateBankrollStats();
      }
    };

    const handleBankrollUpdate = () => {
      updateBankrollStats();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bankrollUpdated', handleBankrollUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bankrollUpdated', handleBankrollUpdate);
    };
  }, [currentUser]);

  // Close actions menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setShowActionsMenu(false);
    if (showActionsMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActionsMenu]);

  const updateBankrollStats = () => {
    const allBets = realGoogleSheetsService.getAllRecords();
    const bankStats = BankrollService.getBankrollStats(currentUser, allBets);
    setBankrollStats(bankStats);
  };

  const updateConnectionStatus = () => {
    const status = csharpDataService.getConnectionStatus();
    setConnectionStatus(status);
  };

  const loadAnalyticsData = async () => {
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
      updateConnectionStatus();
      updateBankrollStats();
    }
  };

  const clearAllData = () => {
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
  };

  const handleBankCardClick = () => {
    setBankModalOpen(true);
  };

  const handleBankModalClose = (success: boolean) => {
    setBankModalOpen(false);
    if (success) {
      updateBankrollStats();
      window.dispatchEvent(new Event('bankrollUpdated'));
    }
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  // Calculate metrics
  const completedBets = bets.filter((bet: Bet) => bet.result !== 'Pending');
  const winningBets = completedBets.filter((bet: Bet) => bet.result === 'Win');
  const losingBets = completedBets.filter((bet: Bet) => bet.result === 'Loss');
  
  // Streak analysis
  const calculateStreaks = () => {
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
  };

  const streaks = calculateStreaks();

  // Odds analysis
  const oddsAnalysis = (): OddsRange[] => {
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
  };

  // Helper function to shorten express bet names
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

  // Bet type distribution with profit data
  const betTypeDistribution = () => {
    const distribution: { [key: string]: { count: number; profit: number; wins: number; originalName: string } } = {};
    bets.forEach((bet: Bet) => {
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
  };

  // Monthly profit data with cumulative
  const monthlyProfitData = (): MonthlyData[] => {
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
  };

  // Balance over time with enhanced data - STARTS FROM 0
  const balanceOverTime = (): BalanceData[] => {
    const initialBalance = 0;
    let runningBalance = initialBalance;
    
    const sortedBets = [...completedBets].sort((a: Bet, b: Bet) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const balanceData: BalanceData[] = [{ 
      date: sortedBets[0]?.date || new Date().toISOString().split('T')[0], 
      balance: initialBalance, 
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
  };

  // Enhanced odds vs profit with color coding
  const oddsVsProfitData = (): ScatterData[] => {
    return completedBets.map((bet: Bet) => ({
      odds: Math.round(Number(bet.odds) * 100) / 100,
      profit: Math.round(Number(bet.profit) * 100) / 100,
      result: bet.result,
      betType: bet.betType || 'Winner',
      match: bet.match || '',
      fill: bet.result === 'Win' ? '#10b981' : '#ef4444'
    }));
  };

  const oddsData = oddsAnalysis();
  const betTypes = betTypeDistribution();
  const monthlyProfit = monthlyProfitData();
  const balanceData = balanceOverTime();
  const scatterData = oddsVsProfitData();

  // Enhanced odds data for combined chart
  const oddsChartData = oddsData.map(range => ({
    range: range.range.replace(/\s*\(.*?\)\s*/g, ''),
    winRate: parseFloat(range.winRate),
    roi: range.count > 0 ? Math.round((range.profit / (range.count * 100)) * 100) : 0,
    bets: range.count
  }));

  // Custom tooltip for scatter chart
  const ScatterTooltip = ({ active, payload }: ScatterTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200">
          <p className="text-sm font-bold text-gray-900 mb-2">Коеф.: {Number(data.odds).toFixed(2)}</p>
          {data.match && (
            <p className="text-sm text-gray-700 mb-1">Ставка: {data.match}</p>
          )}
          <p className={`text-sm font-bold mb-1 ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Профіт: {data.profit >= 0 ? '+' : ''}{Number(data.profit).toFixed(2)} ₴
          </p>
          {data.betType && (
            <p className="text-sm text-gray-600">Тип: {data.betType}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const tabs = [
    { id: 'profit', label: 'Прибуток', icon: null },
    { id: 'goals', label: 'Цілі', icon: Flag },
    { id: 'odds', label: 'Коефіцієнти', icon: null },
    { id: 'comparison', label: 'Періоди', icon: null },
    { id: 'prediction', label: 'Прогнози', icon: null },
    { id: 'risks', label: 'Ризики', icon: null },
  ];

  // Count active filters
  const activeFiltersCount = timeFilter !== 'all' ? 1 : 0;

  return (
    <div className="min-h-screen bg-[#f3f3f3] relative">
      <InitialBankModal 
        open={bankModalOpen} 
        onClose={handleBankModalClose}
        mode={BankrollService.isInitialized(currentUser) ? 'edit' : 'setup'}
      />

      {/* ===== HEADER: Transparent, no bg, no shadow ===== */}
      <div className="px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-center justify-between">
          {/* Left: Title in Ukrainian, larger */}
          <h1 className="text-[48px] font-semibold text-[#111827] leading-tight tracking-tight">
            Аналітика
          </h1>

          {/* Right: Actions + Theme + User */}
          <div className="flex items-center gap-3">
            {/* Actions Menu (Refresh + Clear) */}
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

            {/* User Info — black icon bg, no crown */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111827]">
                <User className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[#111827] leading-tight">
                  {currentUser || 'User'}
                </p>
                <p className="text-xs text-[#6B7280] leading-tight">
                  {isAdmin ? 'Адміністратор' : 'Користувач'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 space-y-8 px-6 lg:px-8 pb-8 pt-4">

        {/* No Data Warning */}
        {bets.length === 0 && (
          <Alert className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-5">
            <AlertTriangle className="h-5 w-5 text-[#3B82F6]" strokeWidth={1.5} />
            <AlertDescription className="text-sm text-[#1E40AF] ml-2">
              <strong className="font-medium">Немає даних для аналізу.</strong> Додайте ставки на сторінці "Мої ставки" для перегляду аналітики.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* 1. Поточний банк */}
          <Card 
            className="border border-[#F4E157]/40 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 group relative"
            onClick={handleBankCardClick}
            style={{
              background: 'linear-gradient(135deg, #FFF9E6 0%, #FFFBF0 100%)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(244,225,87,0.15)'
            }}
          >
            <CardHeader className="pb-3 pt-5 px-6 relative z-10">
              <CardTitle className="text-xs font-medium text-[#6B7280] uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#F4E157] rounded-xl">
                    <Wallet className="h-4 w-4 text-[#111827]" strokeWidth={2} />
                  </div>
                  Поточний банк
                </div>
                <div className="p-1.5 bg-[#F4E157]/60 rounded-lg group-hover:bg-[#F4E157] group-hover:scale-110 transition-all">
                  <Edit className="h-3.5 w-3.5 text-[#111827]" strokeWidth={2.5} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5 relative z-10">
              <div className="space-y-2">
                <div className="text-3xl font-semibold text-[#111827] tracking-tight">
                  {bankrollStats.currentBank.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴
                </div>
                <div className="flex items-center gap-1.5">
                  {stats.totalProfit >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-[#16A34A]" strokeWidth={2.5} />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-[#DC2626]" strokeWidth={2.5} />
                  )}
                  <span className={`text-sm font-medium ${stats.totalProfit >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                    {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(2)} ₴
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Всього ставок */}
          <Card 
            className="border border-[#93C5FD]/40 rounded-2xl overflow-hidden transition-all duration-300 relative"
            style={{
              background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFF 100%)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(59,130,246,0.1)'
            }}
          >
            <CardHeader className="pb-3 pt-5 px-6 relative z-10">
              <CardTitle className="text-xs font-medium text-[#6B7280] uppercase tracking-wider flex items-center gap-2">
                <div className="p-2 bg-[#3B82F6] rounded-xl">
                  <BarChart3 className="h-4 w-4 text-white" strokeWidth={2} />
                </div>
                Всього ставок
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5 relative z-10">
              <div className="space-y-2">
                <div className="text-3xl font-semibold text-[#111827] tracking-tight">{stats.totalBets || 0}</div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-[#16A34A]" strokeWidth={2} />
                    <span className="text-[#6B7280]">{winningBets.length} виграшів</span>
                  </div>
                  <span className="text-[#D1D5DB]">•</span>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#DC2626]" strokeWidth={2} />
                    <span className="text-[#6B7280]">{losingBets.length} програшів</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 3. Профіт */}
          <Card 
            className="border border-[#86EFAC]/40 rounded-2xl overflow-hidden transition-all duration-300 relative"
            style={{
              background: (stats.totalProfit || 0) >= 0 
                ? 'linear-gradient(135deg, #F0FDF4 0%, #F8FFF8 100%)'
                : 'linear-gradient(135deg, #FEF2F2 0%, #FFF5F5 100%)',
              boxShadow: (stats.totalProfit || 0) >= 0
                ? '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(22,163,74,0.1)'
                : '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(220,38,38,0.1)'
            }}
          >
            <CardHeader className="pb-3 pt-5 px-6 relative z-10">
              <CardTitle className="text-xs font-medium text-[#6B7280] uppercase tracking-wider flex items-center gap-2">
                <div className={`p-2 rounded-xl ${(stats.totalProfit || 0) >= 0 ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`}>
                  <DollarSign className="h-4 w-4 text-white" strokeWidth={2} />
                </div>
                Загальний профіт
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5 relative z-10">
              <div className="space-y-2">
                <div className={`text-3xl font-semibold tracking-tight ${(stats.totalProfit || 0) >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                  {(stats.totalProfit || 0) >= 0 ? '+' : ''}{(stats.totalProfit || 0).toFixed(2)} ₴
                </div>
                <div className="flex items-center gap-1.5">
                  {(stats.totalProfit || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-[#16A34A]" strokeWidth={2.5} />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-[#DC2626]" strokeWidth={2.5} />
                  )}
                  <span className="text-xs text-[#6B7280]">
                    {(stats.totalProfit || 0) >= 0 ? 'Позитивна динаміка' : 'Негативна динаміка'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Win Rate */}
          <Card 
            className="border border-[#FDBA74]/40 rounded-2xl overflow-hidden transition-all duration-300 relative"
            style={{
              background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFBF5 100%)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(249,115,22,0.1)'
            }}
          >
            <CardHeader className="pb-3 pt-5 px-6 relative z-10">
              <CardTitle className="text-xs font-medium text-[#6B7280] uppercase tracking-wider flex items-center gap-2">
                <div className="p-2 bg-[#F97316] rounded-xl">
                  <Target className="h-4 w-4 text-white" strokeWidth={2} />
                </div>
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5 relative z-10">
              <div className="space-y-2">
                <div className="text-3xl font-semibold text-[#F97316] tracking-tight">{stats.winRate || 0}%</div>
                <div className="space-y-1.5">
                  <Progress 
                    value={stats.winRate || 0} 
                    className="h-2 bg-[#FED7AA]"
                    style={{
                      ['--progress-background' as string]: '#F97316'
                    }}
                  />
                  <div className="flex items-center justify-between text-[10px] text-[#9CA3AF]">
                    <span>0%</span>
                    <span className="font-medium text-[#111827]">{stats.winRate || 0}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Custom Tabs Navigation */}
        <div className="space-y-6">
          <div 
            className="bg-white rounded-2xl p-1.5 border border-[#E5E7EB]"
            style={{
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
          >
            <div className="grid grid-cols-6 gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative rounded-xl px-4 py-3 text-sm font-medium
                      transition-all duration-200 ease-in-out
                      ${activeTab === tab.id 
                        ? 'bg-[#111827] text-white shadow-sm' 
                        : 'bg-transparent text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#374151]'
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
                {bets.length > 0 ? (
                  <>
                    <BalanceChart data={balanceData} />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Monthly Profit Chart */}
                      <Card 
                        className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden"
                        style={{
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)'
                        }}
                      >
                        <CardHeader className="bg-[#F9FAFB] border-b border-[#E5E7EB] p-6">
                          <CardTitle className="flex items-center justify-between text-lg font-semibold text-[#111827]">
                            <span className="flex items-center gap-3">
                              <div className="p-2.5 bg-[#F4E157] rounded-xl">
                                <Calendar className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                              </div>
                              Прибуток по місяцях
                            </span>
                            <Badge className="bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] px-3 py-1.5 rounded-lg border border-[#BBF7D0] font-medium text-xs">
                              Кумулятивний
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyProfit}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                              <XAxis 
                                dataKey="month" 
                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                stroke="#E5E7EB"
                              />
                              <YAxis 
                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                stroke="#E5E7EB"
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                                  border: '1px solid #E5E7EB', 
                                  borderRadius: '12px',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                                }}
                                formatter={(value: number | string, name: string) => {
                                  if (name === 'profit') return [`${value} ₴`, 'Прибуток за місяць'];
                                  if (name === 'cumulative') return [`${value} ₴`, 'Загальний прибуток'];
                                  if (name === 'winRate') return [`${value}%`, 'Win Rate'];
                                  return [value, name];
                                }}
                                labelFormatter={(label: string) => {
                                  const monthData = monthlyProfit.find(m => m.month === label);
                                  if (monthData) {
                                    return `${label} (${monthData.totalBets} ставок)`;
                                  }
                                  return label;
                                }}
                              />
                              <Legend 
                                wrapperStyle={{ paddingTop: '20px' }}
                                formatter={(value) => {
                                  if (value === 'profit') return <span style={{ color: '#374151', fontSize: '13px' }}>Прибуток за місяць</span>;
                                  if (value === 'cumulative') return <span style={{ color: '#374151', fontSize: '13px' }}>Загальний прибуток</span>;
                                  return value;
                                }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="profit" 
                                stroke="#F59E0B" 
                                strokeWidth={2.5}
                                name="profit"
                                dot={{ fill: '#F59E0B', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="cumulative" 
                                stroke="#111827" 
                                strokeWidth={2.5}
                                name="cumulative"
                                dot={{ fill: '#111827', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                          
                          {/* Monthly Stats Summary */}
                          <div className="mt-5 flex items-center justify-between gap-4 px-2">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-[#16A34A]" strokeWidth={1.5} />
                              <span className="text-sm text-[#9CA3AF]">Макс:</span>
                              <span className="text-sm font-semibold text-[#111827]">
                                +{Math.max(...monthlyProfit.map(m => m.profit)).toFixed(0)} ₴
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-[#DC2626]" strokeWidth={1.5} />
                              <span className="text-sm text-[#9CA3AF]">Мін:</span>
                              <span className="text-sm font-semibold text-[#111827]">
                                {Math.min(...monthlyProfit.map(m => m.profit)).toFixed(0)} ₴
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-[#6B7280]" strokeWidth={1.5} />
                              <span className="text-sm text-[#9CA3AF]">Сер:</span>
                              <span className="text-sm font-semibold text-[#111827]">
                                {(monthlyProfit.reduce((sum, m) => sum + m.profit, 0) / monthlyProfit.length).toFixed(0)} ₴
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Scatter Chart */}
                      <Card 
                        className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden"
                        style={{
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)'
                        }}
                      >
                        <CardHeader className="bg-[#F9FAFB] border-b border-[#E5E7EB] p-6">
                          <CardTitle className="flex items-center justify-between text-lg font-semibold text-[#111827]">
                            <span className="flex items-center gap-3">
                              <div className="p-2.5 bg-[#F4E157] rounded-xl">
                                <Target className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                              </div>
                              Коефіцієнти vs Прибуток
                            </span>
                            <div className="flex gap-2">
                              <Badge className="bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] px-3 py-1.5 rounded-lg border border-[#BBF7D0] font-medium text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" strokeWidth={1.5} />
                                Виграш
                              </Badge>
                              <Badge className="bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEF2F2] px-3 py-1.5 rounded-lg border border-[#FECACA] font-medium text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" strokeWidth={1.5} />
                                Програш
                              </Badge>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <ResponsiveContainer width="100%" height={300}>
                            <ScatterChart>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                              
                              <ReferenceLine 
                                y={0} 
                                stroke="#9CA3AF" 
                                strokeWidth={1.5}
                                strokeDasharray="5 5"
                                label={{ 
                                  value: 'Нульова лінія', 
                                  position: 'insideTopRight',
                                  style: { fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }
                                }}
                              />
                              
                              <XAxis 
                                dataKey="odds" 
                                name="Коефіцієнт"
                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                stroke="#E5E7EB"
                                label={{ value: 'Коефіцієнт', position: 'insideBottom', offset: -5, style: { fontSize: 12, fill: '#6B7280' } }}
                                tickFormatter={(value) => Number(value).toFixed(2)}
                              />
                              <YAxis 
                                dataKey="profit" 
                                name="Прибуток"
                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                stroke="#E5E7EB"
                                label={{ value: 'Прибуток (₴)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
                              />
                              <Tooltip content={<ScatterTooltip />} />
                              <Scatter 
                                data={scatterData} 
                                fill="#8b5cf6"
                                shape={(props: { cx?: number; cy?: number; fill?: string }) => {
                                  const { cx, cy, fill } = props;
                                  return (
                                    <circle 
                                      cx={cx} 
                                      cy={cy} 
                                      r={5} 
                                      fill={fill}
                                      opacity={0.8}
                                    />
                                  );
                                }}
                              />
                            </ScatterChart>
                          </ResponsiveContainer>
                          
                          {/* Scatter Stats */}
                          <div className="mt-5 flex items-center justify-center gap-8 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-[#16A34A]"></div>
                              <span className="text-sm text-[#9CA3AF]">Виграш:</span>
                              <span className="text-sm font-semibold text-[#111827]">{winningBets.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-[#DC2626]"></div>
                              <span className="text-sm text-[#9CA3AF]">Програш:</span>
                              <span className="text-sm font-semibold text-[#111827]">{losingBets.length}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <Card 
                    className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden"
                    style={{
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)'
                    }}
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

            {activeTab === 'odds' && (
              <div className="grid grid-cols-1 gap-6">
                <Card 
                  className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden"
                  style={{
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)'
                  }}
                >
                  <CardHeader className="bg-[#F9FAFB] border-b border-[#E5E7EB] p-6">
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold text-[#111827]">
                      <div className="p-2.5 bg-[#F4E157] rounded-xl">
                        <BarChart3 className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                      </div>
                      Win Rate & ROI по категоріях коефіцієнтів
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {bets.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={350}>
                          <BarChart data={oddsChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis 
                              dataKey="range" 
                              tick={{ fontSize: 13, fontWeight: 500, fill: '#374151' }}
                              stroke="#E5E7EB"
                            />
                            <YAxis 
                              yAxisId="left"
                              tick={{ fontSize: 12, fill: '#6B7280' }}
                              stroke="#E5E7EB"
                              label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
                            />
                            <YAxis 
                              yAxisId="right"
                              orientation="right"
                              tick={{ fontSize: 12, fill: '#6B7280' }}
                              stroke="#E5E7EB"
                              label={{ value: 'ROI (%)', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#6B7280' } }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                                border: '1px solid #E5E7EB', 
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                padding: '12px'
                              }}
                              formatter={(value: number | string, name: string) => {
                                if (name === 'winRate') return [`${value}%`, 'Win Rate'];
                                if (name === 'roi') return [`${value}%`, 'ROI'];
                                if (name === 'bets') return [value, 'Кількість ставок'];
                                return [value, name];
                              }}
                            />
                            <Legend 
                              wrapperStyle={{ paddingTop: '20px' }}
                              formatter={(value) => {
                                if (value === 'winRate') return <span style={{ color: '#374151', fontSize: '13px' }}>Win Rate (%)</span>;
                                if (value === 'roi') return <span style={{ color: '#374151', fontSize: '13px' }}>ROI (%)</span>;
                                return value;
                              }}
                            />
                            <Bar 
                              yAxisId="left"
                              dataKey="winRate" 
                              fill="#F59E0B" 
                              name="winRate"
                              radius={[6, 6, 0, 0]}
                              maxBarSize={80}
                            />
                            <Bar 
                              yAxisId="right"
                              dataKey="roi" 
                              fill="#111827" 
                              name="roi"
                              radius={[6, 6, 0, 0]}
                              maxBarSize={80}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                        
                        <div className="mt-8 grid grid-cols-3 gap-5">
                          {oddsData.map((range, index) => {
                            const hasZeroData = range.count === 0;
                            return (
                              <div 
                                key={index} 
                                className={`p-5 rounded-xl border ${hasZeroData ? 'bg-[#F3F4F6] border-[#E5E7EB]' : 'bg-[#F9FAFB] border-[#E5E7EB]'}`}
                              >
                                <h4 className="font-semibold text-[#111827] mb-4 text-center text-base">{range.range}</h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-[#6B7280]">Ставок:</span>
                                    <Badge className={`${hasZeroData ? 'bg-[#E5E7EB] text-[#6B7280]' : 'bg-[#F3F4F6] text-[#111827]'} hover:bg-[#E5E7EB] px-3 py-1.5 rounded-lg border border-[#E5E7EB] font-medium`}>
                                      {range.count}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-[#6B7280]">Win Rate:</span>
                                    <Badge className={`${hasZeroData ? 'bg-[#E5E7EB] text-[#6B7280]' : 'bg-[#F9FAFB] text-[#111827]'} hover:bg-[#F3F4F6] px-3 py-1.5 rounded-lg border border-[#E5E7EB] font-medium`}>
                                      {range.winRate}%
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-[#6B7280]">Прибуток:</span>
                                    <Badge className={`border font-medium px-3 py-1.5 rounded-lg ${
                                      hasZeroData 
                                        ? 'bg-[#E5E7EB] text-[#6B7280] border-[#D1D5DB]'
                                        : range.profit >= 0 
                                          ? 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]' 
                                          : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                                    }`}>
                                      {range.profit >= 0 ? '+' : ''}{Math.round(range.profit)} ₴
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-16">
                        <div className="p-8 bg-[#F3F4F6] rounded-2xl inline-block mb-6">
                          <Target className="h-16 w-16 text-[#9CA3AF]" strokeWidth={1.5} />
                        </div>
                        <p className="text-[#6B7280] text-sm">Немає даних для аналізу коефіцієнтів</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'comparison' && <PeriodComparison bets={bets} />}
            {activeTab === 'prediction' && <PredictiveAnalytics bets={bets} />}
            {activeTab === 'risks' && <RiskManagement bets={bets} />}
          </div>
        </div>
      </div>
    </div>
  );
}