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
  MoreHorizontal,
  Pencil
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, Legend, ReferenceLine, PieChart, Pie, Cell } from 'recharts';
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

// Mini Donut Chart component — centered, with white gap between segments
function MiniDonut({ 
  value, 
  total, 
  colors, 
  size = 140 
}: { 
  value: number; 
  total: number; 
  colors: { main: string; sub1: string; sub2: string }; 
  size?: number;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const remaining = 100 - percentage;
  
  const data = [
    { name: 'value', val: percentage || 0.01 },
    { name: 'remaining', val: remaining || 0.01 },
  ];

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.30}
            outerRadius={size * 0.46}
            startAngle={90}
            endAngle={-270}
            dataKey="val"
            stroke="#ffffff"
            strokeWidth={4}
          >
            <Cell fill={colors.main} />
            <Cell fill={colors.sub2} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
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

  const oddsChartData = oddsData.map(range => ({
    range: range.range.replace(/\s*\(.*?\)\s*/g, ''),
    winRate: parseFloat(range.winRate),
    roi: range.count > 0 ? Math.round((range.profit / (range.count * 100)) * 100) : 0,
    bets: range.count
  }));

  const ScatterTooltip = ({ active, payload }: ScatterTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200">
          <p className="text-sm font-bold text-gray-900 mb-2">Коеф.: {Number(data.odds).toFixed(2)}</p>
          {data.match && (
            <p className="text-sm text-gray-700 mb-1">Ставка: {data.match}</p>
          )}
          <p className={`text-sm font-bold mb-1 ${data.profit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
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

  // Custom bar shape for monthly profit — green for positive, coral for negative
  interface MonthlyBarProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    payload?: MonthlyData;
  }

  const MonthlyProfitBar = (props: MonthlyBarProps) => {
    const { x = 0, y = 0, width = 0, height = 0, payload } = props;
    const isPositive = (payload?.profit || 0) >= 0;
    const fillColor = isPositive ? '#10B981' : '#F87171';
    const fillOpacity = isPositive ? 0.85 : 0.75;
    
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fillColor}
        opacity={fillOpacity}
        rx={4}
        ry={4}
      />
    );
  };

  const tabs = [
    { id: 'profit', label: 'Прибуток', icon: Wallet },
    { id: 'odds', label: 'Коефіцієнти', icon: BarChart3 },
    { id: 'comparison', label: 'Періоди', icon: Calendar },
  ];

  const activeFiltersCount = timeFilter !== 'all' ? 1 : 0;

  // Shared card style for hover shadow effect
  const cardBaseStyle = {
    transform: 'scale(1)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  };

  const cardHoverStyle = {
    transform: 'scale(1.03)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)',
  };

  // Enhanced card shadow for chart cards — subtle depth like header
  const chartCardShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)';

  // Odds category labels
  const oddsCategoryLabels = [
    { label: 'Низькі', sublabel: '< 2.0' },
    { label: 'Середні', sublabel: '2.0 – 3.0' },
    { label: 'Високі', sublabel: '> 3.0' }
  ];

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

        {bets.length === 0 && (
          <Alert className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-5">
            <AlertTriangle className="h-5 w-5 text-[#3B82F6]" strokeWidth={1.5} />
            <AlertDescription className="text-sm text-[#1E40AF] ml-2">
              <strong className="font-medium">Немає даних для аналізу.</strong> Додайте ставки на сторінці "Мої ставки" для перегляду аналітики.
            </AlertDescription>
          </Alert>
        )}

        {/* ===== QUICK STATS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* 1. Поточний банк */}
          <div 
            className="stat-card bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 cursor-pointer group relative overflow-hidden"
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

          {/* 2. Загальний профіт */}
          <div 
            className="stat-card bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
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
              <span className="text-sm text-[#9CA3AF]">за весь час</span>
            </div>
          </div>

          {/* 3. Всього ставок — GREEN donut */}
          <div 
            className="stat-card bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
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
                  {stats.totalBets || 0}
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
                  total={stats.totalBets || 1} 
                  colors={{ main: '#10B981', sub1: '#6EE7B7', sub2: '#FCA5A5' }}
                  size={140}
                />
              </div>
            </div>
          </div>

          {/* 4. Win Rate — GREEN donut */}
          <div 
            className="stat-card bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
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
                  {stats.winRate || 0}%
                </div>
                <div className="flex items-center gap-2">
                  {(stats.winRate || 0) >= 50 ? (
                    <ArrowUpRight className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-[#EF4444]" strokeWidth={2.5} />
                  )}
                  <span className={`text-sm font-semibold ${(stats.winRate || 0) >= 50 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {(stats.winRate || 0) >= 50 ? 'Вище середнього' : 'Нижче середнього'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center flex-shrink-0">
                <MiniDonut 
                  value={stats.winRate || 0} 
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
          <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-3 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <div className="grid grid-cols-3 gap-3">
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
                {bets.length > 0 ? (
                  <>
                    <BalanceChart data={balanceData} />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* ===== MONTHLY PROFIT — BAR CHART ===== */}
                      <Card 
                        className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden"
                        style={{ boxShadow: chartCardShadow }}
                      >
                        <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
                          <CardTitle className="flex items-center justify-between text-lg font-semibold text-[#111827]">
                            <span className="flex items-center gap-3">
                              <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
                                <Calendar className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                              </div>
                              Прибуток по місяцях
                            </span>
                            <div className="flex gap-2">
                              <Badge className="bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] px-3 py-1.5 rounded-lg border border-[#BBF7D0] font-medium text-xs">
                                Прибуток
                              </Badge>
                              <Badge className="bg-[#F9FAFB] text-[#374151] hover:bg-[#F9FAFB] px-3 py-1.5 rounded-lg border border-[#E5E7EB] font-medium text-xs">
                                Кумулятивний
                              </Badge>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyProfit} barCategoryGap="20%">
                              <defs>
                                <linearGradient id="cumulativeLineGrad" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#111827" stopOpacity={0.5} />
                                  <stop offset="50%" stopColor="#111827" stopOpacity={1} />
                                  <stop offset="100%" stopColor="#111827" stopOpacity={0.7} />
                                </linearGradient>
                              </defs>
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
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ 
                                  backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                                  border: '1px solid #E5E7EB', 
                                  borderRadius: '12px',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                                }}
                                formatter={(value: number | string, name: string) => {
                                  if (name === 'profit') return [`${value} ₴`, 'Прибуток за місяць'];
                                  if (name === 'cumulative') return [`${value} ₴`, 'Загальний прибуток'];
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
                              <ReferenceLine y={0} stroke="#D1D5DB" strokeWidth={1} />
                              <Bar 
                                dataKey="profit" 
                                name="profit"
                                maxBarSize={48}
                                shape={<MonthlyProfitBar />}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="cumulative" 
                                stroke="url(#cumulativeLineGrad)" 
                                strokeWidth={2.5}
                                name="cumulative"
                                dot={{ fill: '#111827', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6 }}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                          
                          <div className="mt-5 flex items-center justify-between gap-4 px-2">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-[#10B981]" strokeWidth={1.5} />
                              <span className="text-sm text-[#9CA3AF]">Макс:</span>
                              <span className="text-sm font-semibold text-[#111827]">
                                +{Math.max(...monthlyProfit.map(m => m.profit)).toFixed(0)} ₴
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-[#EF4444]" strokeWidth={1.5} />
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

                      {/* ===== SCATTER CHART — ODDS vs PROFIT ===== */}
                      <Card 
                        className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden"
                        style={{ boxShadow: chartCardShadow }}
                      >
                        <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
                          <CardTitle className="flex items-center justify-between text-lg font-semibold text-[#111827]">
                            <span className="flex items-center gap-3">
                              <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
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
                                stroke="#6B7280" 
                                strokeWidth={2}
                                strokeDasharray="8 4"
                                label={{ 
                                  value: 'Нульова лінія', 
                                  position: 'insideTopRight',
                                  style: { fontSize: 11, fill: '#6B7280', fontWeight: 600 }
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
                                      r={6} 
                                      fill={fill}
                                      opacity={0.7}
                                      stroke={fill}
                                      strokeWidth={1}
                                      strokeOpacity={0.3}
                                    />
                                  );
                                }}
                              />
                            </ScatterChart>
                          </ResponsiveContainer>
                          
                          <div className="mt-5 flex items-center justify-center gap-8 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                              <span className="text-sm text-[#9CA3AF]">Виграш:</span>
                              <span className="text-sm font-semibold text-[#111827]">{winningBets.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-[#EF4444]"></div>
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
                {bets.length > 0 ? (
                  <>
                    {/* ===== CHART — green color scheme matching Прибуток по місяцях ===== */}
                    <Card 
                      className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden"
                      style={{ boxShadow: chartCardShadow }}
                    >
                      <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
                        <CardTitle className="flex items-center justify-between text-lg font-semibold text-[#111827]">
                          <span className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
                              <BarChart3 className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                            </div>
                            Вінрейт & ROI по категоріях коефіцієнтів
                          </span>
                          <div className="flex gap-2">
                            <Badge className="bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] px-3 py-1.5 rounded-lg border border-[#BBF7D0] font-medium text-xs">
                              <div className="w-2.5 h-2.5 rounded-sm bg-[#10B981] mr-1.5" />
                              Вінрейт
                            </Badge>
                            <Badge className="bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] px-3 py-1.5 rounded-lg border border-[#BBF7D0] font-medium text-xs">
                              <div className="w-2.5 h-2.5 rounded-sm bg-[#6EE7B7] mr-1.5" />
                              ROI
                            </Badge>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={oddsChartData} barCategoryGap="25%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis 
                              dataKey="range" 
                              tick={{ fontSize: 13, fontWeight: 500, fill: '#374151' }}
                              stroke="#E5E7EB"
                            />
                            <YAxis 
                              tick={{ fontSize: 12, fill: '#6B7280' }}
                              stroke="#E5E7EB"
                              label={{ value: '%', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
                            />
                            <Tooltip 
                              cursor={{ fill: 'transparent' }}
                              contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                                border: '1px solid #E5E7EB', 
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                padding: '12px'
                              }}
                              formatter={(value: number | string, name: string) => {
                                if (name === 'winRate') return [`${value}%`, 'Вінрейт'];
                                if (name === 'roi') return [`${value}%`, 'ROI'];
                                return [value, name];
                              }}
                            />
                            <Legend 
                              wrapperStyle={{ paddingTop: '20px' }}
                              formatter={(value) => {
                                if (value === 'winRate') return <span style={{ color: '#374151', fontSize: '13px' }}>Вінрейт (%)</span>;
                                if (value === 'roi') return <span style={{ color: '#374151', fontSize: '13px' }}>ROI (%)</span>;
                                return value;
                              }}
                            />
                            <ReferenceLine y={0} stroke="#D1D5DB" strokeWidth={1} />
                            <Bar 
                              dataKey="winRate" 
                              fill="#10B981" 
                              name="winRate"
                              radius={[6, 6, 0, 0]}
                              maxBarSize={80}
                              opacity={0.85}
                            />
                            <Bar 
                              dataKey="roi" 
                              fill="#6EE7B7" 
                              name="roi"
                              radius={[6, 6, 0, 0]}
                              maxBarSize={80}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* ===== CATEGORY CARDS — clean white design ===== */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {oddsData.map((range, index) => {
                        const catLabel = oddsCategoryLabels[index];
                        const hasData = range.count > 0;
                        const winRateNum = parseFloat(range.winRate);
                        const roi = range.count > 0 ? Math.round((range.profit / (range.count * 100)) * 100) : 0;

                        return (
                          <div 
                            key={index}
                            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
                            style={cardBaseStyle}
                            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
                            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
                          >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-5">
                              <div>
                                <h4 className="text-lg font-semibold text-[#111827]">{catLabel.label}</h4>
                                <span className="text-sm text-[#9CA3AF]">Коеф. {catLabel.sublabel}</span>
                              </div>
                              <Badge className="bg-[#F3F4F6] text-[#111827] hover:bg-[#F3F4F6] px-3 py-1.5 rounded-lg border border-[#E5E7EB] font-semibold text-sm">
                                {range.count}
                              </Badge>
                            </div>

                            {/* Win Rate with progress bar */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-[#6B7280]">Вінрейт</span>
                                <span className={`text-base font-bold ${hasData ? 'text-[#111827]' : 'text-[#9CA3AF]'}`}>
                                  {range.winRate}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ 
                                    width: `${Math.min(winRateNum, 100)}%`,
                                    backgroundColor: hasData ? '#10B981' : '#D1D5DB'
                                  }}
                                />
                              </div>
                            </div>

                            {/* ROI */}
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm text-[#6B7280]">ROI</span>
                              <span className={`text-base font-bold ${
                                !hasData ? 'text-[#9CA3AF]' : roi >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                              }`}>
                                {roi >= 0 ? '+' : ''}{roi}%
                              </span>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-[#F3F4F6] mb-4" />

                            {/* Profit */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-[#6B7280]">Прибуток</span>
                              <div className="flex items-center gap-2">
                                {hasData && (
                                  range.profit >= 0 ? (
                                    <ArrowUpRight className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} />
                                  ) : (
                                    <ArrowDownRight className="h-4 w-4 text-[#EF4444]" strokeWidth={2.5} />
                                  )
                                )}
                                <span className={`text-xl font-bold ${
                                  !hasData 
                                    ? 'text-[#9CA3AF]'
                                    : range.profit >= 0 
                                      ? 'text-[#22C55E]' 
                                      : 'text-[#EF4444]'
                                }`}>
                                  {range.profit >= 0 ? '+' : ''}{Math.round(range.profit).toLocaleString('uk-UA')} ₴
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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