import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Trophy,
  DollarSign,
  Percent,
  Filter,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Database,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Flag,
  Wallet,
  Edit,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter, Area, AreaChart, Legend, ReferenceLine, ReferenceArea } from 'recharts';
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
  const currentUser = localStorage.getItem('currentUser') || '';
  
  const [stats, setStats] = useState<BettingStats>(() => 
    UserDataService.getUserData(currentUser, 'analytics_stats', {
      totalBets: 0,
      winRate: 0,
      totalProfit: 0,
      averageROI: 0,
      profitByMonth: [],
      profitByStrategy: []
    })
  );
  
  const [bets, setBets] = useState<Bet[]>(() => 
    UserDataService.getUserData(currentUser, 'analytics_bets', [])
  );
  
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

  useEffect(() => {
    loadAnalyticsData();
    updateConnectionStatus();
    updateBankrollStats();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (currentUser) {
      UserDataService.setUserData(currentUser, 'analytics_stats', stats);
      UserDataService.setUserData(currentUser, 'analytics_bets', bets);
    }
  }, [stats, bets, currentUser]);

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
      
      // Try to load from MyBets user-specific data first
      const myBetsData = UserDataService.getUserData(currentUser, 'mybets_data', []);
      const myBetsStats = UserDataService.getUserData(currentUser, 'mybets_stats', null);
      
      if (myBetsData.length > 0 || myBetsStats) {
        // Use MyBets data if available
        setBets(myBetsData);
        
        if (myBetsStats) {
          setStats({
            totalBets: myBetsStats.totalBets || 0,
            winRate: myBetsStats.winRate || 0,
            totalProfit: myBetsStats.totalProfit || 0,
            averageROI: myBetsStats.averageROI || 0,
            profitByMonth: myBetsStats.profitByMonth || [],
            profitByStrategy: myBetsStats.profitByStrategy || []
          });
        }
        
        console.log('✅ Data loaded from MyBets user-specific storage:', { 
          bets: myBetsData.length, 
          totalProfit: myBetsStats?.totalProfit || 0
        });
      } else {
        // Try C# backend as fallback
        try {
          const [betsData, analyticsData] = await Promise.all([
            csharpDataService.getBettingData(),
            csharpDataService.getAnalyticsData()
          ]);
          
          if (betsData.length > 0) {
            setBets(betsData as Bet[]);
            setStats({
              totalBets: analyticsData.totalBets,
              winRate: analyticsData.winRate,
              totalProfit: analyticsData.totalProfit,
              averageROI: analyticsData.roi,
              profitByMonth: [],
              profitByStrategy: []
            });
            
            console.log('✅ Data loaded from C# backend:', { 
              bets: betsData.length, 
              totalProfit: analyticsData.totalProfit 
            });
          } else {
            // Use analytics-specific localStorage as last resort
            const savedBets = UserDataService.getUserData(currentUser, 'analytics_bets', []);
            const savedStats = UserDataService.getUserData(currentUser, 'analytics_stats', {
              totalBets: 0,
              winRate: 0,
              totalProfit: 0,
              averageROI: 0,
              profitByMonth: [],
              profitByStrategy: []
            });
            
            setBets(savedBets);
            setStats(savedStats);
          }
        } catch (error) {
          console.error('❌ Error loading from C# backend:', error);
          
          // Use analytics-specific localStorage
          const savedBets = UserDataService.getUserData(currentUser, 'analytics_bets', []);
          const savedStats = UserDataService.getUserData(currentUser, 'analytics_stats', {
            totalBets: 0,
            winRate: 0,
            totalProfit: 0,
            averageROI: 0,
            profitByMonth: [],
            profitByStrategy: []
          });
          
          setBets(savedBets);
          setStats(savedStats);
        }
      }
      
    } catch (error) {
      console.error('❌ Error loading analytics:', error);
      
      // Load from user-specific localStorage
      const savedBets = UserDataService.getUserData(currentUser, 'analytics_bets', []);
      const savedStats = UserDataService.getUserData(currentUser, 'analytics_stats', {
        totalBets: 0,
        winRate: 0,
        totalProfit: 0,
        averageROI: 0,
        profitByMonth: [],
        profitByStrategy: []
      });
      
      setBets(savedBets);
      setStats(savedStats);
    } finally {
      setLoading(false);
      updateConnectionStatus();
      updateBankrollStats();
    }
  };

  const clearAllData = () => {
    if (window.confirm('Ви впевнені, що хочете очистити всі дані аналітики? Ця дія незворотна.')) {
      setBets([]);
      setStats({
        totalBets: 0,
        winRate: 0,
        totalProfit: 0,
        averageROI: 0,
        profitByMonth: [],
        profitByStrategy: []
      });
      
      // Clear user-specific data
      UserDataService.clearUserData(currentUser, 'analytics_bets');
      UserDataService.clearUserData(currentUser, 'analytics_stats');
      
      console.log('🗑️ All analytics data cleared for user:', currentUser);
    }
  };

  const handleBankModalClose = (success: boolean) => {
    setBankModalOpen(false);
    if (success) {
      updateBankrollStats();
    }
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
    // Check if it's an express bet
    if (betType.includes('Експрес') || betType.includes('|')) {
      // Extract the express format (e.g., "10x")
      const formatMatch = betType.match(/(\d+)x/);
      if (formatMatch) {
        return `Експрес ${formatMatch[1]}x`;
      }
      // If no format found but contains "|", count the events
      const eventCount = (betType.match(/•/g) || []).length + 1;
      if (eventCount > 1) {
        return `Експрес ${eventCount}x`;
      }
    }
    
    // For non-express bets, return the original name
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

  // Balance over time with enhanced data
  const balanceOverTime = (): BalanceData[] => {
    const initialBalance = bankrollStats.initialBank || 1000;
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

  // Enhanced odds vs profit with color coding and strategy - ROUNDED TO 2 DECIMALS
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
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border-2 border-gray-200">
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
    <div className="min-h-screen bg-[#FAFAF8] relative overflow-hidden">
      {/* Decorative elements with hatching pattern - RonDesignLab style */}
      <div className="absolute top-16 right-16 w-40 h-40 rounded-[40px] bg-[#E8E6DC] opacity-20" 
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)`
        }} 
      />
      <div className="absolute bottom-24 left-16 w-32 h-32 rounded-[36px] bg-[#D4D2C8] opacity-15"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)`
        }}
      />
      
      {/* Subtle grid pattern overlay */}
      <svg className="absolute top-0 left-0 w-full h-full opacity-[0.015] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" patternUnits="userSpaceOnUse" width="40" height="40">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#000000" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="relative z-10 space-y-10 p-8">
        <InitialBankModal 
          open={bankModalOpen} 
          onClose={handleBankModalClose}
          mode={BankrollService.isInitialized(currentUser) ? 'edit' : 'setup'}
        />

        {/* Enhanced Header with background */}
        <div className="bg-white/60 backdrop-blur-sm rounded-[40px] p-8 border-2 border-[#E8E6DC] shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-6xl font-light text-black tracking-tight flex items-center gap-5">
                <div className="p-4 bg-[#F4E157] rounded-[36px] shadow-[0_12px_32px_rgba(244,225,87,0.4)]">
                  <BarChart3 className="h-10 w-10 text-black" strokeWidth={1.5} />
                </div>
                Аналітика
              </h1>
              <p className="text-[#6B6B6B] mt-4 text-xl font-light ml-[88px]">
                Детальний аналіз вашої беттінг активності
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={loadAnalyticsData}
                variant="outline"
                className="rounded-[24px] border-2 border-[#D4D2C8] hover:bg-[#FAFAF8] hover:border-[#C4C2B8] bg-white font-normal h-16 px-7 text-black transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-base"
              >
                <RefreshCw className="mr-2.5 h-5 w-5" strokeWidth={1.5} />
                Оновити
              </Button>
              <Button
                onClick={clearAllData}
                variant="outline"
                className="rounded-[24px] border-2 border-[#FFCDD2] hover:bg-[#FFE8E8] hover:border-[#FFAB91] bg-white font-normal h-16 px-7 text-[#D32F2F] transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-base"
              >
                <Trash2 className="mr-2.5 h-5 w-5" strokeWidth={1.5} />
                Очистити
              </Button>
            </div>
          </div>
        </div>

        {/* Backend Connection Status */}
        <Alert className={`rounded-[28px] border-2 ${connectionStatus.connected ? 'border-[#C8E6C9] bg-white' : 'border-[#FFCC80] bg-white'} shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-6`}>
          <div className="flex items-center gap-2">
            {connectionStatus.connected ? <Wifi className="h-5 w-5 text-[#4CAF50]" strokeWidth={1.5} /> : <WifiOff className="h-5 w-5 text-[#FF9800]" strokeWidth={1.5} />}
            <Database className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <AlertDescription className="font-light text-black ml-2">
            <strong className="font-normal">Backend Status:</strong> {connectionStatus.environment} 
            {connectionStatus.connected ? 
              ' - З\'єднано з C# SQLite базою даних' : 
              ' - Використовується user-specific localStorage'
            }
          </AlertDescription>
        </Alert>

        {/* No Data Warning */}
        {bets.length === 0 && (
          <Alert className="rounded-[28px] border-2 border-[#BBDEFB] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-6">
            <AlertTriangle className="h-5 w-5 text-[#2196F3]" strokeWidth={1.5} />
            <AlertDescription className="font-light text-black ml-2">
              <strong className="font-normal">Немає даних для аналізу.</strong> Додайте ставки на сторінці "Мої ставки" для перегляду аналітики.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats - ПОКРАЩЕНІ КАРТКИ */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 1. Поточний банк - GRADIENT YELLOW */}
          <Card 
            className="border-2 border-[#F4E157] shadow-[0_12px_32px_rgba(244,225,87,0.3)] rounded-[32px] overflow-hidden cursor-pointer hover:shadow-[0_16px_40px_rgba(244,225,87,0.4)] hover:border-[#E8D54A] transition-all duration-300 group relative"
            onClick={() => setBankModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #FFF9E6 0%, #FFFBF0 100%)'
            }}
          >
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-5" 
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(244,225,87,0.3) 8px, rgba(244,225,87,0.3) 10px)`
              }}
            />
            
            <CardHeader className="pb-4 pt-7 px-7 relative z-10">
              <CardTitle className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-[#F4E157] rounded-[20px] shadow-[0_4px_12px_rgba(244,225,87,0.4)]">
                    <Wallet className="h-6 w-6 text-black" strokeWidth={2} />
                  </div>
                  Поточний банк
                </div>
                <div className="p-2.5 bg-[#F4E157] rounded-[18px] shadow-[0_3px_10px_rgba(244,225,87,0.4)] group-hover:shadow-[0_5px_15px_rgba(244,225,87,0.6)] group-hover:scale-110 transition-all">
                  <Edit className="h-5 w-5 text-black" strokeWidth={2.5} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pb-7 relative z-10">
              {BankrollService.isInitialized(currentUser) ? (
                <div className="space-y-3">
                  <div className="text-6xl font-light text-black tracking-tight">
                    {bankrollStats.currentBank.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴
                  </div>
                  {/* Trend indicator */}
                  <div className="flex items-center gap-2">
                    {bankrollStats.totalProfit >= 0 ? (
                      <ArrowUpRight className="h-5 w-5 text-[#4CAF50]" strokeWidth={2.5} />
                    ) : (
                      <ArrowDownRight className="h-5 w-5 text-[#D32F2F]" strokeWidth={2.5} />
                    )}
                    <span className={`text-base font-normal ${bankrollStats.totalProfit >= 0 ? 'text-[#4CAF50]' : 'text-[#D32F2F]'}`}>
                      {bankrollStats.totalProfit >= 0 ? '+' : ''}{bankrollStats.totalProfit.toFixed(2)} ₴
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-2xl font-light text-[#8B8B8B]">Не встановлено</div>
              )}
            </CardContent>
          </Card>

          {/* 2. Всього ставок - GRADIENT BLUE */}
          <Card 
            className="border-2 border-[#90CAF9] shadow-[0_12px_32px_rgba(33,150,243,0.2)] rounded-[32px] overflow-hidden hover:shadow-[0_16px_40px_rgba(33,150,243,0.3)] hover:border-[#64B5F6] transition-all duration-300 relative"
            style={{
              background: 'linear-gradient(135deg, #E3F2FD 0%, #F0F8FF 100%)'
            }}
          >
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-5" 
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(33,150,243,0.3) 8px, rgba(33,150,243,0.3) 10px)`
              }}
            />
            
            <CardHeader className="pb-4 pt-7 px-7 relative z-10">
              <CardTitle className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2.5">
                <div className="p-2.5 bg-[#2196F3] rounded-[20px] shadow-[0_4px_12px_rgba(33,150,243,0.4)]">
                  <BarChart3 className="h-6 w-6 text-white" strokeWidth={2} />
                </div>
                Всього ставок
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pb-7 relative z-10">
              <div className="space-y-3">
                <div className="text-6xl font-light text-black tracking-tight">{stats.totalBets || 0}</div>
                {/* Additional info */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-[#4CAF50]" strokeWidth={2} />
                    <span className="text-sm text-[#6B6B6B] font-light">{winningBets.length} виграшів</span>
                  </div>
                  <span className="text-[#D4D2C8]">•</span>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-[#D32F2F]" strokeWidth={2} />
                    <span className="text-sm text-[#6B6B6B] font-light">{losingBets.length} програшів</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 3. Профіт - GRADIENT GREEN */}
          <Card 
            className="border-2 border-[#A5D6A7] shadow-[0_12px_32px_rgba(76,175,80,0.25)] rounded-[32px] overflow-hidden hover:shadow-[0_16px_40px_rgba(76,175,80,0.35)] hover:border-[#81C784] transition-all duration-300 relative"
            style={{
              background: (stats.totalProfit || 0) >= 0 
                ? 'linear-gradient(135deg, #E8F5E9 0%, #F1F8F4 100%)'
                : 'linear-gradient(135deg, #FFEBEE 0%, #FFF5F5 100%)'
            }}
          >
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-5" 
              style={{
                backgroundImage: (stats.totalProfit || 0) >= 0
                  ? `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(76,175,80,0.3) 8px, rgba(76,175,80,0.3) 10px)`
                  : `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(211,47,47,0.3) 8px, rgba(211,47,47,0.3) 10px)`
              }}
            />
            
            <CardHeader className="pb-4 pt-7 px-7 relative z-10">
              <CardTitle className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2.5">
                <div className={`p-2.5 rounded-[20px] shadow-[0_4px_12px_rgba(76,175,80,0.4)] ${(stats.totalProfit || 0) >= 0 ? 'bg-[#4CAF50]' : 'bg-[#D32F2F]'}`}>
                  <DollarSign className="h-6 w-6 text-white" strokeWidth={2} />
                </div>
                Загальний профіт
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pb-7 relative z-10">
              <div className="space-y-3">
                <div className={`text-6xl font-light tracking-tight ${(stats.totalProfit || 0) >= 0 ? 'text-[#4CAF50]' : 'text-[#D32F2F]'}`}>
                  {(stats.totalProfit || 0) >= 0 ? '+' : ''}{(stats.totalProfit || 0).toFixed(2)} ₴
                </div>
                {/* Trend indicator with arrow */}
                <div className="flex items-center gap-2">
                  {(stats.totalProfit || 0) >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-[#4CAF50]" strokeWidth={2.5} />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-[#D32F2F]" strokeWidth={2.5} />
                  )}
                  <span className="text-sm text-[#6B6B6B] font-light">
                    {(stats.totalProfit || 0) >= 0 ? 'Позитивна динаміка' : 'Негативна динаміка'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Win Rate - GRADIENT ORANGE */}
          <Card 
            className="border-2 border-[#FFCC80] shadow-[0_12px_32px_rgba(255,152,0,0.2)] rounded-[32px] overflow-hidden hover:shadow-[0_16px_40px_rgba(255,152,0,0.3)] hover:border-[#FFB74D] transition-all duration-300 relative"
            style={{
              background: 'linear-gradient(135deg, #FFF3E0 0%, #FFF9F0 100%)'
            }}
          >
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-5" 
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,152,0,0.3) 8px, rgba(255,152,0,0.3) 10px)`
              }}
            />
            
            <CardHeader className="pb-4 pt-7 px-7 relative z-10">
              <CardTitle className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2.5">
                <div className="p-2.5 bg-[#FF9800] rounded-[20px] shadow-[0_4px_12px_rgba(255,152,0,0.4)]">
                  <Target className="h-6 w-6 text-white" strokeWidth={2} />
                </div>
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pb-7 relative z-10">
              <div className="space-y-3">
                <div className="text-6xl font-light text-[#FF9800] tracking-tight">{stats.winRate || 0}%</div>
                {/* Progress bar */}
                <div className="space-y-2">
                  <Progress 
                    value={stats.winRate || 0} 
                    className="h-3 bg-[#FFE0B2]"
                    style={{
                      ['--progress-background' as string]: '#FF9800'
                    }}
                  />
                  <div className="flex items-center justify-between text-xs text-[#6B6B6B] font-light">
                    <span>0%</span>
                    <span className="font-normal text-black">{stats.winRate || 0}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Custom Tabs Navigation */}
        <div className="space-y-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-3 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <div className="grid grid-cols-6 gap-3">
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
                        ? 'bg-[#F4E157] text-black font-normal shadow-[0_4px_16px_rgba(244,225,87,0.4)]' 
                        : 'bg-transparent text-[#6B6B6B] hover:bg-[#F5F5F3]'
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
                    {/* Collapsible Date Filter */}
                    <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
                      <CardHeader 
                        className="border-b-2 border-[#E8E6DC] p-6 cursor-pointer hover:bg-[#FAFAF8] transition-colors"
                        onClick={() => setFiltersExpanded(!filtersExpanded)}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-2xl font-light text-black tracking-tight flex items-center gap-3">
                            <div className="p-2.5 bg-[#F4E157] rounded-[20px] shadow-[0_6px_16px_rgba(244,225,87,0.3)]">
                              <Filter className="h-6 w-6 text-black" strokeWidth={1.5} />
                            </div>
                            Фільтри
                            {activeFiltersCount > 0 && (
                              <Badge className="ml-2 bg-[#F4E157] text-black border-0 rounded-[12px] px-3 py-1 font-normal">
                                {activeFiltersCount} активних
                              </Badge>
                            )}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-[16px] hover:bg-[#F5F5F3] text-black"
                          >
                            {filtersExpanded ? (
                              <>
                                <ChevronUp className="h-5 w-5 mr-2" strokeWidth={1.5} />
                                Згорнути
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-5 w-5 mr-2" strokeWidth={1.5} />
                                Розгорнути
                              </>
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      
                      {filtersExpanded && (
                        <CardContent className="p-6">
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <label className="text-sm font-normal text-[#6B6B6B] mb-2 block uppercase tracking-wider">Період:</label>
                              <Select value={timeFilter} onValueChange={setTimeFilter}>
                                <SelectTrigger className="rounded-[20px] border-2 border-[#D4D2C8] hover:border-[#C4C2B8] transition-colors h-12 font-light">
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
                          </div>
                        </CardContent>
                      )}
                    </Card>

                    <BalanceChart data={balanceData} />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Monthly Profit Chart - ЗМІНЕНО НА ЛІНІЙНИЙ ГРАФІК З ТОЧКАМИ */}
                      <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
                        <CardHeader className="bg-[#F5F5F3] border-b-2 border-[#E8E6DC] p-8">
                          <CardTitle className="flex items-center justify-between text-3xl font-light text-black">
                            <span className="flex items-center gap-3">
                              <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_2px_8px_rgba(244,225,87,0.3)]">
                                <Calendar className="h-6 w-6 text-black" strokeWidth={1.5} />
                              </div>
                              Прибуток по місяцях
                            </span>
                            <Badge className="bg-[#E8F5E9] text-[#4CAF50] hover:bg-[#E8F5E9] px-5 py-2 rounded-[20px] border-2 border-[#C8E6C9] font-normal text-sm">
                              Кумулятивний
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyProfit}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis 
                                dataKey="month" 
                                tick={{ fontSize: 12, fill: '#1a1a1a' }}
                                stroke="#1a1a1a"
                              />
                              <YAxis 
                                tick={{ fontSize: 12, fill: '#1a1a1a' }}
                                stroke="#1a1a1a"
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                  border: 'none', 
                                  borderRadius: '12px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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
                                contentStyle={{ color: '#1a1a1a' }}
                                formatter={(value) => {
                                  if (value === 'profit') return <span style={{ color: '#1a1a1a' }}>Прибуток за місяць</span>;
                                  if (value === 'cumulative') return <span style={{ color: '#1a1a1a' }}>Загальний прибуток</span>;
                                  return value;
                                }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="profit" 
                                stroke="#C4A57B" 
                                strokeWidth={3}
                                name="profit"
                                dot={{ fill: '#C4A57B', r: 5, strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 7 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="cumulative" 
                                stroke="#8B6F47" 
                                strokeWidth={3}
                                name="cumulative"
                                dot={{ fill: '#8B6F47', r: 5, strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 7 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                          
                          {/* Monthly Stats Summary */}
                          <div className="mt-6 flex items-center justify-between gap-4 px-2">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-[#4CAF50]" strokeWidth={1.5} />
                              <span className="text-sm text-[#6B6B6B] font-light">Макс:</span>
                              <span className="text-lg font-normal text-black">
                                +{Math.max(...monthlyProfit.map(m => m.profit)).toFixed(0)} ₴
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-[#D32F2F]" strokeWidth={1.5} />
                              <span className="text-sm text-[#6B6B6B] font-light">Мін:</span>
                              <span className="text-lg font-normal text-black">
                                {Math.min(...monthlyProfit.map(m => m.profit)).toFixed(0)} ₴
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-[#8B6F47]" strokeWidth={1.5} />
                              <span className="text-sm text-[#6B6B6B] font-light">Сер:</span>
                              <span className="text-lg font-normal text-black">
                                {(monthlyProfit.reduce((sum, m) => sum + m.profit, 0) / monthlyProfit.length).toFixed(0)} ₴
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Scatter Chart - ЗМІНЕНО НА ПРОСТІ ТОЧКИ БЕЗ ЗОН */}
                      <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
                        <CardHeader className="bg-[#F5F5F3] border-b-2 border-[#E8E6DC] p-8">
                          <CardTitle className="flex items-center justify-between text-3xl font-light text-black">
                            <span className="flex items-center gap-3">
                              <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_2px_8px_rgba(244,225,87,0.3)]">
                                <Target className="h-6 w-6 text-black" strokeWidth={1.5} />
                              </div>
                              Коефіцієнти vs Прибуток
                            </span>
                            <div className="flex gap-2">
                              <Badge className="bg-[#E8F5E9] text-[#4CAF50] hover:bg-[#E8F5E9] px-4 py-2 rounded-[16px] border-2 border-[#C8E6C9] font-normal text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" strokeWidth={1.5} />
                                Виграш
                              </Badge>
                              <Badge className="bg-[#FFE8E8] text-[#D32F2F] hover:bg-[#FFE8E8] px-4 py-2 rounded-[16px] border-2 border-[#FFCDD2] font-normal text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" strokeWidth={1.5} />
                                Програш
                              </Badge>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                          <ResponsiveContainer width="100%" height={300}>
                            <ScatterChart>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              
                              {/* Zero profit line */}
                              <ReferenceLine 
                                y={0} 
                                stroke="#9ca3af" 
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                label={{ 
                                  value: 'Нульова лінія', 
                                  position: 'insideTopRight',
                                  style: { fontSize: 11, fill: '#6b7280', fontWeight: 500 }
                                }}
                              />
                              
                              <XAxis 
                                dataKey="odds" 
                                name="Коефіцієнт"
                                tick={{ fontSize: 12, fill: '#1a1a1a' }}
                                stroke="#1a1a1a"
                                label={{ value: 'Коефіцієнт', position: 'insideBottom', offset: -5, style: { fontSize: 12, fill: '#1a1a1a' } }}
                                tickFormatter={(value) => Number(value).toFixed(2)}
                              />
                              <YAxis 
                                dataKey="profit" 
                                name="Прибуток"
                                tick={{ fontSize: 12, fill: '#1a1a1a' }}
                                stroke="#1a1a1a"
                                label={{ value: 'Прибуток (₴)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#1a1a1a' } }}
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
                          <div className="mt-6 flex items-center justify-center gap-8 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-[#4CAF50]"></div>
                              <span className="text-sm text-[#6B6B6B] font-light">Виграш:</span>
                              <span className="text-lg font-normal text-black">{winningBets.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-[#D32F2F]"></div>
                              <span className="text-sm text-[#6B6B6B] font-light">Програш:</span>
                              <span className="text-lg font-normal text-black">{losingBets.length}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
                    <CardContent className="py-16 text-center">
                      <div className="p-8 bg-[#F5F5F3] rounded-[32px] inline-block mb-6">
                        <DollarSign className="h-16 w-16 text-[#8B8B8B]" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-2xl font-light text-black mb-3">
                        Немає даних про прибуток
                      </h3>
                      <p className="text-[#6B6B6B] font-light text-base">
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
                {/* Odds analysis - ЖОВТІ ІКОНКИ */}
                <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
                  <CardHeader className="bg-[#F5F5F3] border-b-2 border-[#E8E6DC] p-8">
                    <CardTitle className="flex items-center gap-3 text-3xl font-light text-black">
                      <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_2px_8px_rgba(244,225,87,0.3)]">
                        <BarChart3 className="h-6 w-6 text-black" strokeWidth={1.5} />
                      </div>
                      Win Rate & ROI по категоріях коефіцієнтів
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    {bets.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={350}>
                          <BarChart data={oddsChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="range" 
                              tick={{ fontSize: 13, fontWeight: 500, fill: '#1a1a1a' }}
                              stroke="#1a1a1a"
                            />
                            <YAxis 
                              yAxisId="left"
                              tick={{ fontSize: 12, fill: '#1a1a1a' }}
                              stroke="#1a1a1a"
                              label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#1a1a1a' } }}
                            />
                            <YAxis 
                              yAxisId="right"
                              orientation="right"
                              tick={{ fontSize: 12, fill: '#1a1a1a' }}
                              stroke="#1a1a1a"
                              label={{ value: 'ROI (%)', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#1a1a1a' } }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                border: 'none', 
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
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
                              contentStyle={{ color: '#1a1a1a' }}
                              formatter={(value) => {
                                if (value === 'winRate') return <span style={{ color: '#1a1a1a' }}>Win Rate (%)</span>;
                                if (value === 'roi') return <span style={{ color: '#1a1a1a' }}>ROI (%)</span>;
                                return value;
                              }}
                            />
                            <Bar 
                              yAxisId="left"
                              dataKey="winRate" 
                              fill="#C4A57B" 
                              name="winRate"
                              radius={[8, 8, 0, 0]}
                              maxBarSize={80}
                            />
                            <Bar 
                              yAxisId="right"
                              dataKey="roi" 
                              fill="#D4B896" 
                              name="roi"
                              radius={[8, 8, 0, 0]}
                              maxBarSize={80}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                        
                        {/* Summary cards - ЧОРНИЙ ТЕКСТ У BADGE */}
                        <div className="mt-8 grid grid-cols-3 gap-6">
                          {oddsData.map((range, index) => {
                            const hasZeroData = range.count === 0;
                            return (
                              <div 
                                key={index} 
                                className={`p-6 rounded-[24px] border-2 ${hasZeroData ? 'bg-[#E8DCC8] border-[#D4C9B3]' : 'bg-[#F5EFE6] border-[#E8DCC8]'}`}
                                style={{
                                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(196,165,123,0.08) 4px, rgba(196,165,123,0.08) 5px)`
                                }}
                              >
                                <h4 className="font-normal text-black mb-4 text-center text-lg">{range.range}</h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-[#6B6B6B] font-light">Ставок:</span>
                                    <Badge className={`${hasZeroData ? 'bg-[#D4C9B3] text-[#1a1a1a]' : 'bg-[#E8DCC8] text-[#1a1a1a]'} hover:bg-[#E8DCC8] px-4 py-2 rounded-[16px] border-2 border-[#D4C9B3] font-normal`}>
                                      {range.count}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-[#6B6B6B] font-light">Win Rate:</span>
                                    <Badge className={`${hasZeroData ? 'bg-[#D4C9B3] text-[#1a1a1a]' : 'bg-[#F5EFE6] text-[#1a1a1a]'} hover:bg-[#F5EFE6] px-4 py-2 rounded-[16px] border-2 border-[#E8DCC8] font-normal`}>
                                      {range.winRate}%
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-[#6B6B6B] font-light">Прибуток:</span>
                                    <Badge className={`border-2 font-normal px-4 py-2 rounded-[16px] ${
                                      hasZeroData 
                                        ? 'bg-[#D4C9B3] text-[#1a1a1a] border-[#C4B9A3]'
                                        : range.profit >= 0 
                                          ? 'bg-[#F5EFE6] text-[#1a1a1a] border-[#E8DCC8]' 
                                          : 'bg-[#FFE8E8] text-[#D32F2F] border-[#FFCDD2]'
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
                        <div className="p-8 bg-[#F5F5F3] rounded-[32px] inline-block mb-6">
                          <Target className="h-16 w-16 text-[#8B8B8B]" strokeWidth={1.5} />
                        </div>
                        <p className="text-[#6B6B6B] font-light text-base">Немає даних для аналізу коефіцієнтів</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Bet Type Distribution Card - ПРИБРАНО (закоментовано) */}
                {/* <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
                  ... блок "Розподіл типів ставок" ...
                </Card> */}
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