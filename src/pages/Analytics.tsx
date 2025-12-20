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
import { UserDataService } from '@/lib/userDataService';
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
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts';
import type { Bet, BettingStats, OddsRange, BalanceData, ScatterData } from '@/types/betting';

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

  useEffect(() => {
    loadAnalyticsData();
    updateConnectionStatus();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (currentUser) {
      UserDataService.setUserData(currentUser, 'analytics_stats', stats);
      UserDataService.setUserData(currentUser, 'analytics_bets', bets);
    }
  }, [stats, bets, currentUser]);

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

  // Bet type distribution
  const betTypeDistribution = () => {
    const distribution: { [key: string]: number } = {};
    bets.forEach((bet: Bet) => {
      const type = bet.betType || 'Winner';
      distribution[type] = (distribution[type] || 0) + 1;
    });
    
    const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];
    return Object.entries(distribution).map(([type, count], index) => ({
      name: type,
      value: count,
      color: colors[index % colors.length]
    }));
  };

  // Monthly profit data
  const monthlyProfitData = () => {
    const monthlyData: { [key: string]: number } = {};
    
    completedBets.forEach((bet: Bet) => {
      const date = new Date(bet.date);
      const monthName = date.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
      
      if (!monthlyData[monthName]) {
        monthlyData[monthName] = 0;
      }
      monthlyData[monthName] += bet.profit || 0;
    });
    
    return Object.entries(monthlyData).map(([month, profit]) => ({
      month,
      profit: Math.round(profit * 100) / 100
    }));
  };

  // Balance over time
  const balanceOverTime = (): BalanceData[] => {
    const initialBalance = 1000;
    let runningBalance = initialBalance;
    
    const sortedBets = [...completedBets].sort((a: Bet, b: Bet) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const balanceData: BalanceData[] = [{ date: sortedBets[0]?.date || new Date().toISOString().split('T')[0], balance: initialBalance, profit: 0 }];
    
    sortedBets.forEach((bet: any) => {
      runningBalance += bet.profit || 0;
      balanceData.push({
        date: bet.date,
        balance: runningBalance,
        profit: bet.profit || 0
      });
    });
    
    return balanceData;
  };

  // Scatter plot: Odds vs Profit
  const oddsVsProfitData = (): ScatterData[] => {
    return completedBets.map((bet: Bet) => ({
      odds: bet.odds || 0,
      profit: bet.profit || 0,
      result: bet.result
    }));
  };

  const oddsData = oddsAnalysis();
  const betTypes = betTypeDistribution();
  const monthlyProfit = monthlyProfitData();
  const balanceData = balanceOverTime();
  const scatterData = oddsVsProfitData();

  return (
    <div className="space-y-8 p-6 bg-gradient-to-b from-gray-50 to-white min-h-screen">
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
          <Button variant="outline" onClick={loadAnalyticsData} className="rounded-2xl border-gray-200 hover:bg-gray-50 font-medium">
            <RefreshCw className="h-4 w-4 mr-2" />
            Оновити
          </Button>
          <Button variant="outline" onClick={clearAllData} className="rounded-2xl border-red-200 text-red-600 hover:bg-red-50 font-medium">
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        
        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Середній ROI</p>
                <p className={`text-3xl font-semibold tracking-tight ${(stats.averageROI || 0) >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                  {(stats.averageROI || 0) >= 0 ? '+' : ''}{stats.averageROI || 0}%
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-2xl">
                <Percent className="h-7 w-7 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-2xl border-0">
          <TabsTrigger value="profit" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Прибуток</TabsTrigger>
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
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                        <Filter className="h-5 w-5" />
                        Фільтри
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700">Період:</label>
                        <Select value={timeFilter} onValueChange={setTimeFilter}>
                          <SelectTrigger className="mt-1 rounded-xl">
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
                  <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900">Прибуток по місяцях</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyProfit}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value} ₴`, 'Прибуток']} />
                          <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900">Коефіцієнти vs Прибуток</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart data={scatterData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="odds" name="Коефіцієнт" />
                          <YAxis dataKey="profit" name="Прибуток" />
                          <Tooltip formatter={(value, name) => [
                            name === 'odds' ? value : `${value} ₴`,
                            name === 'odds' ? 'Коефіцієнт' : 'Прибуток'
                          ]} />
                          <Scatter dataKey="profit" fill="#8b5cf6" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
                <CardContent className="py-12 text-center">
                  <div className="p-4 bg-gray-50 rounded-3xl w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <DollarSign className="h-10 w-10 text-gray-400" />
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

        <TabsContent value="odds">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">ROI & Win Rate по категоріях</CardTitle>
              </CardHeader>
              <CardContent>
                {bets.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={oddsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="winRate" fill="#10b981" name="Win Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8">
                    <div className="p-4 bg-gray-50 rounded-3xl w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Target className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-gray-600">Немає даних для аналізу коефіцієнтів</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Розподіл типів ставок</CardTitle>
              </CardHeader>
              <CardContent>
                {betTypes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={betTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {betTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-50 rounded-3xl w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <BarChart3 className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-gray-600">Немає даних про типи ставок</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed odds analysis */}
            <Card className="lg:col-span-2 border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Детальний аналіз по коефіцієнтах</CardTitle>
              </CardHeader>
              <CardContent>
                {bets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {oddsData.map((range) => (
                      <div key={range.range} className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                        <h3 className="font-semibold mb-2 text-gray-900">{range.range}</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Ставок:</span>
                            <span className="font-medium text-gray-900">{range.count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Win Rate:</span>
                            <span className="font-medium text-gray-900">{range.winRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Прибуток:</span>
                            <span className={`font-medium ${range.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {range.profit >= 0 ? '+' : ''}{Math.round(range.profit * 100) / 100} ₴
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="p-4 bg-gray-50 rounded-3xl w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Target className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-gray-600">Немає даних для аналізу коефіцієнтів</p>
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