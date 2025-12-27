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
  Edit
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
  const [connectionStatus, setConnectionStatus] = useState({ connected: false, environment: 'Browser' });
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankrollStats, setBankrollStats] = useState({
    initialBank: 0,
    currentBank: 0,
    totalProfit: 0,
    roi: 0
  });

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

  // Enhanced odds vs profit with color coding and strategy
  const oddsVsProfitData = (): ScatterData[] => {
    return completedBets.map((bet: Bet) => ({
      odds: bet.odds || 0,
      profit: bet.profit || 0,
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
          <p className="text-sm font-bold text-gray-900 mb-2">Коеф.: {data.odds}</p>
          {data.match && (
            <p className="text-sm text-gray-700 mb-1">Ставка: {data.match}</p>
          )}
          <p className={`text-sm font-bold mb-1 ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Профіт: {data.profit >= 0 ? '+' : ''}{data.profit.toFixed(2)} ₴
          </p>
          {data.betType && (
            <p className="text-sm text-gray-600">Тип: {data.betType}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 p-6 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <InitialBankModal 
        open={bankModalOpen} 
        onClose={handleBankModalClose}
        mode={BankrollService.isInitialized(currentUser) ? 'edit' : 'setup'}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Аналітика
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Детальний аналіз вашої беттінг активності
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadAnalyticsData} className="rounded-2xl border-2 border-gray-200 hover:bg-gray-50 hover:border-blue-300 font-medium transition-colors">
            <RefreshCw className="h-4 w-4 mr-2" />
            Оновити
          </Button>
          <Button variant="outline" onClick={clearAllData} className="rounded-2xl border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium transition-colors">
            <Trash2 className="h-4 w-4 mr-2" />
            Очистити
          </Button>
        </div>
      </div>

      {/* Backend Connection Status */}
      <Alert className={`rounded-2xl border-0 ${connectionStatus.connected ? 'bg-green-50' : 'bg-yellow-50'}`}>
        <div className="flex items-center gap-2">
          {connectionStatus.connected ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-yellow-600" />}
          <Database className="h-4 w-4" />
        </div>
        <AlertDescription className="font-medium">
          <strong>Backend Status:</strong> {connectionStatus.environment} 
          {connectionStatus.connected ? 
            ' - З\'єднано з C# SQLite базою даних' : 
            ' - Використовується user-specific localStorage'
          }
        </AlertDescription>
      </Alert>

      {/* No Data Warning */}
      {bets.length === 0 && (
        <Alert className="rounded-2xl border-0 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="font-medium">
            <strong>Немає даних для аналізу.</strong> Додайте ставки на сторінці "Мої ставки" для перегляду аналітики.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats - Поточний банк ПЕРШИЙ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 1. Поточний банк - ПЕРША КАРТКА */}
        <Card 
          className="border-0 shadow-xl rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 relative group"
          onClick={() => setBankModalOpen(true)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white/90 uppercase tracking-wide mb-2 flex items-center gap-2">
                  Поточний банк
                  <Edit className="h-3 w-3 opacity-70" />
                </p>
                {BankrollService.isInitialized(currentUser) ? (
                  <p className="text-3xl font-bold text-white tracking-tight">
                    {bankrollStats.currentBank.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴
                  </p>
                ) : (
                  <p className="text-lg font-semibold text-white/80">Не встановлено</p>
                )}
              </div>
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Wallet className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Всього ставок */}
        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Всього ставок</p>
                <p className="text-3xl font-semibold text-gray-900 tracking-tight">{stats.totalBets || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl">
                <BarChart3 className="h-7 w-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 3. Профіт */}
        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Загальний профіт</p>
                <p className={`text-3xl font-semibold tracking-tight ${(stats.totalProfit || 0) >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                  {(stats.totalProfit || 0) >= 0 ? '+' : ''}{(stats.totalProfit || 0).toFixed(2)} ₴
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-2xl">
                <DollarSign className="h-7 w-7 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Win Rate */}
        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Win Rate</p>
                <p className="text-3xl font-semibold text-green-600 tracking-tight">{stats.winRate || 0}%</p>
              </div>
              <div className="p-3 bg-green-50 rounded-2xl">
                <Target className="h-7 w-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-2xl border-0">
          <TabsTrigger value="profit" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Прибуток</TabsTrigger>
          <TabsTrigger value="goals" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Flag className="h-4 w-4 mr-1" />
            Цілі
          </TabsTrigger>
          <TabsTrigger value="odds" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Коефіцієнти</TabsTrigger>
          <TabsTrigger value="comparison" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Періоди</TabsTrigger>
          <TabsTrigger value="prediction" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Прогнози</TabsTrigger>
          <TabsTrigger value="risks" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Ризики</TabsTrigger>
        </TabsList>

        <TabsContent value="profit">
          <div className="grid grid-cols-1 gap-6">
            {bets.length > 0 ? (
              <>
                {/* Date Filter */}
                <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xl font-bold text-gray-900">
                        <div className="p-2 bg-blue-100 rounded-xl">
                          <Filter className="h-6 w-6 text-blue-600" />
                        </div>
                        Фільтри
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Період:</label>
                        <Select value={timeFilter} onValueChange={setTimeFilter}>
                          <SelectTrigger className="rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors">
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
                </Card>

                <BalanceChart data={balanceData} />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Enhanced Monthly Profit Chart with Area */}
                  <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                      <CardTitle className="flex items-center justify-between text-xl font-bold text-gray-900">
                        <span className="flex items-center gap-2">
                          <div className="p-2 bg-blue-100 rounded-xl">
                            <Calendar className="h-6 w-6 text-blue-600" />
                          </div>
                          Прибуток по місяцях
                        </span>
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                          Кумулятивний
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={monthlyProfit}>
                          <defs>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
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
                          <Area 
                            type="monotone" 
                            dataKey="profit" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorProfit)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="cumulative" 
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorCumulative)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                      
                      {/* Monthly Stats Summary */}
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-green-50 rounded-xl">
                          <p className="text-xs text-gray-600 mb-1">Кращий місяць</p>
                          <p className="text-lg font-bold text-green-600">
                            +{Math.max(...monthlyProfit.map(m => m.profit)).toFixed(0)} ₴
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {monthlyProfit.find(m => m.profit === Math.max(...monthlyProfit.map(m => m.profit)))?.totalBets || 0} ставок
                          </p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-xl">
                          <p className="text-xs text-gray-600 mb-1">Гірший місяць</p>
                          <p className="text-lg font-bold text-red-600">
                            {Math.min(...monthlyProfit.map(m => m.profit)).toFixed(0)} ₴
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {monthlyProfit.find(m => m.profit === Math.min(...monthlyProfit.map(m => m.profit)))?.totalBets || 0} ставок
                          </p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-xl">
                          <p className="text-xs text-gray-600 mb-1">Середній</p>
                          <p className="text-lg font-bold text-purple-600">
                            {(monthlyProfit.reduce((sum, m) => sum + m.profit, 0) / monthlyProfit.length).toFixed(0)} ₴
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {Math.round(monthlyProfit.reduce((sum, m) => sum + m.totalBets, 0) / monthlyProfit.length)} ставок
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Scatter Chart with Zones */}
                  <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                      <CardTitle className="flex items-center justify-between text-xl font-bold text-gray-900">
                        <span className="flex items-center gap-2">
                          <div className="p-2 bg-blue-100 rounded-xl">
                            <Target className="h-6 w-6 text-blue-600" />
                          </div>
                          Коефіцієнти vs Прибуток
                        </span>
                        <div className="flex gap-2">
                          <Badge className="bg-green-500 text-white border-0 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Виграш
                          </Badge>
                          <Badge className="bg-red-500 text-white border-0 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Програш
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          
                          {/* Vertical zones for odds ranges */}
                          <ReferenceArea x1={0} x2={1.5} fill="#dbeafe" fillOpacity={0.3} />
                          <ReferenceArea x1={1.5} x2={2.0} fill="#bfdbfe" fillOpacity={0.3} />
                          <ReferenceArea x1={2.0} x2={3.0} fill="#93c5fd" fillOpacity={0.3} />
                          <ReferenceArea x1={3.0} x2={10} fill="#60a5fa" fillOpacity={0.3} />
                          
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
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                            label={{ value: 'Коефіцієнт', position: 'insideBottom', offset: -5, style: { fontSize: 12, fill: '#6b7280' } }}
                          />
                          <YAxis 
                            dataKey="profit" 
                            name="Прибуток"
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                            label={{ value: 'Прибуток (₴)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
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
                                  stroke="#fff"
                                  strokeWidth={2}
                                />
                              );
                            }}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                      
                      {/* Scatter Stats */}
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                          <ArrowUpRight className="h-8 w-8 text-green-600" />
                          <div>
                            <p className="text-xs text-gray-600">Виграшних ставок</p>
                            <p className="text-lg font-bold text-green-600">{winningBets.length}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                          <ArrowDownRight className="h-8 w-8 text-red-600" />
                          <div>
                            <p className="text-xs text-gray-600">Програшних ставок</p>
                            <p className="text-lg font-bold text-red-600">{losingBets.length}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
                <CardContent className="py-12 text-center">
                  <div className="p-6 bg-gray-100 rounded-3xl inline-block mb-4">
                    <DollarSign className="h-16 w-16 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Немає даних про прибуток
                  </h3>
                  <p className="text-gray-600">
                    Додайте ставки для перегляду аналізу прибутку
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="goals">
          <GoalsManager />
        </TabsContent>

        <TabsContent value="odds">
          <div className="grid grid-cols-1 gap-6">
            {/* Combined Win Rate & ROI Chart */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  Win Rate & ROI по категоріях коефіцієнтів
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {bets.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={oddsChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="range" 
                          tick={{ fontSize: 13, fontWeight: 500 }}
                          stroke="#6b7280"
                        />
                        <YAxis 
                          yAxisId="left"
                          tick={{ fontSize: 12 }}
                          stroke="#6b7280"
                          label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 12 }}
                          stroke="#6b7280"
                          label={{ value: 'ROI (%)', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#6b7280' } }}
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
                          formatter={(value) => {
                            if (value === 'winRate') return 'Win Rate (%)';
                            if (value === 'roi') return 'ROI (%)';
                            return value;
                          }}
                        />
                        <Bar 
                          yAxisId="left"
                          dataKey="winRate" 
                          fill="#10b981" 
                          name="winRate"
                          radius={[8, 8, 0, 0]}
                          maxBarSize={80}
                        />
                        <Bar 
                          yAxisId="right"
                          dataKey="roi" 
                          fill="#8b5cf6" 
                          name="roi"
                          radius={[8, 8, 0, 0]}
                          maxBarSize={80}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    
                    {/* Summary cards */}
                    <div className="mt-6 grid grid-cols-3 gap-4">
                      {oddsData.map((range, index) => (
                        <div key={index} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200">
                          <h4 className="font-bold text-gray-900 mb-3 text-center">{range.range}</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Ставок:</span>
                              <Badge className="bg-blue-100 text-blue-700 border-0 font-bold">{range.count}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Win Rate:</span>
                              <Badge className="bg-green-100 text-green-700 border-0 font-bold">{range.winRate}%</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Прибуток:</span>
                              <Badge className={`border-0 font-bold ${range.profit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {range.profit >= 0 ? '+' : ''}{Math.round(range.profit)} ₴
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-6 bg-gray-100 rounded-3xl inline-block mb-4">
                      <Target className="h-16 w-16 text-gray-400" />
                    </div>
                    <p className="text-gray-600">Немає даних для аналізу коефіцієнтів</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Simplified Bet Type Distribution */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  Розподіл типів ставок
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {betTypes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bar Chart instead of Pie */}
                    <div>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={betTypes} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6b7280" />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            tick={{ fontSize: 11, fontWeight: 500 }} 
                            stroke="#6b7280"
                            width={120}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                              border: 'none', 
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value: number | string, name: string) => {
                              if (name === 'value') return [value, 'Кількість ставок'];
                              return [value, name];
                            }}
                          />
                          <Bar 
                            dataKey="value" 
                            radius={[0, 8, 8, 0]}
                            maxBarSize={40}
                          >
                            {betTypes.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="space-y-3">
                      {betTypes.map((type, index) => (
                        <div 
                          key={index} 
                          className="p-4 rounded-2xl border-2 transition-all hover:shadow-md"
                          style={{ 
                            borderColor: type.color + '40',
                            backgroundColor: type.color + '10'
                          }}
                          title={type.originalName}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-900 truncate max-w-[200px]" title={type.name}>{type.name}</h4>
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: type.color }}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-gray-600 text-xs">Ставок</p>
                              <p className="font-bold text-gray-900">{type.value}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs">Win Rate</p>
                              <p className="font-bold text-gray-900">{type.winRate}%</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs">Прибуток</p>
                              <p className={`font-bold ${type.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {type.profit >= 0 ? '+' : ''}{type.profit} ₴
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-6 bg-gray-100 rounded-3xl inline-block mb-4">
                      <BarChart3 className="h-16 w-16 text-gray-400" />
                    </div>
                    <p className="text-gray-600">Немає даних про типи ставок</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <PeriodComparison bets={bets} />
        </TabsContent>

        <TabsContent value="prediction">
          <PredictiveAnalytics bets={bets} />
        </TabsContent>

        <TabsContent value="risks">
          <RiskManagement bets={bets} />
        </TabsContent>
      </Tabs>
    </div>
  );
}