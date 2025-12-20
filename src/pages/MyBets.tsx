import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CS2BettingForm from '@/components/CS2BettingForm';
import BettingHistory from '@/components/BettingHistory';
import GoogleSheetsConfig from '@/components/GoogleSheetsConfig';
import StrategyOverview from '@/components/StrategyOverview';
import { realGoogleSheetsService } from '@/lib/realGoogleSheets';
import { UserDataService } from '@/lib/userDataService';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, RefreshCw, Calendar, Trophy, AlertTriangle, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MyBets() {
  const currentUser = localStorage.getItem('currentUser') || '';
  
  const [stats, setStats] = useState(() => 
    UserDataService.getUserData(currentUser, 'mybets_stats', {
      totalBets: 0,
      winRate: 0,
      totalProfit: 0,
      averageROI: 0,
      profitByMonth: [] as { month: string; profit: number }[],
      profitByStrategy: [] as { strategy: string; profit: number }[]
    })
  );
  
  const [loading, setLoading] = useState(true);
  
  const [recentBets, setRecentBets] = useState(() => 
    UserDataService.getUserData(currentUser, 'mybets_data', [])
  );

  useEffect(() => {
    loadStats();
    loadRecentBets();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (currentUser) {
      UserDataService.setUserData(currentUser, 'mybets_stats', stats);
      UserDataService.setUserData(currentUser, 'mybets_data', recentBets);
    }
  }, [stats, recentBets, currentUser]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Try to load from Google Sheets first
      const data = await realGoogleSheetsService.getBettingStatistics();
      
      // If Google Sheets returns data, use it
      if (data.totalBets > 0) {
        setStats(data);
      } else {
        // Otherwise, use user-specific localStorage data
        const savedStats = UserDataService.getUserData(currentUser, 'mybets_stats', {
          totalBets: 0,
          winRate: 0,
          totalProfit: 0,
          averageROI: 0,
          profitByMonth: [],
          profitByStrategy: []
        });
        setStats(savedStats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      
      // Load from user-specific localStorage
      const savedStats = UserDataService.getUserData(currentUser, 'mybets_stats', {
        totalBets: 0,
        winRate: 0,
        totalProfit: 0,
        averageROI: 0,
        profitByMonth: [],
        profitByStrategy: []
      });
      setStats(savedStats);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentBets = async () => {
    try {
      // Try to load from Google Sheets first
      const data = await realGoogleSheetsService.fetchUSDTData();
      
      // If Google Sheets returns data, use it
      if (data.length > 0) {
        setRecentBets(data.slice(-20));
      } else {
        // Otherwise, use user-specific localStorage data
        const savedBets = UserDataService.getUserData(currentUser, 'mybets_data', []);
        setRecentBets(savedBets);
      }
    } catch (error) {
      console.error('Error loading recent bets:', error);
      
      // Load from user-specific localStorage
      const savedBets = UserDataService.getUserData(currentUser, 'mybets_data', []);
      setRecentBets(savedBets);
    }
  };

  const handleRecordAdded = () => {
    loadStats();
    loadRecentBets();
  };

  const refreshData = () => {
    loadStats();
    loadRecentBets();
  };

  const clearRecentBets = async () => {
    if (window.confirm('Ви впевнені, що хочете очистити всі дані? Це видалить всі ставки, статистику та історію. Ця дія незворотна.')) {
      try {
        // Clear Google Sheets data (if connected)
        await realGoogleSheetsService.clearAllData();
        
        // Clear user-specific data
        UserDataService.clearUserData(currentUser, 'mybets_data');
        UserDataService.clearUserData(currentUser, 'mybets_stats');
        
        setRecentBets([]);
        setStats({
          totalBets: 0,
          winRate: 0,
          totalProfit: 0,
          averageROI: 0,
          profitByMonth: [],
          profitByStrategy: []
        });
        
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
  };

  const updateBetResult = async (bet: any, result: 'Win' | 'Loss') => {
    try {
      const profit = result === 'Win' ? (bet.odds - 1) * bet.amount : -bet.amount;
      const roi = (profit / bet.amount) * 100;

      // Update in Google Sheets (if connected)
      await realGoogleSheetsService.updateBetResult(bet, result, profit, roi);
      
      // Update in user-specific localStorage
      const updatedBets = recentBets.map((b: any) => {
        if (b.date === bet.date && b.match === bet.match && b.amount === bet.amount && b.odds === bet.odds) {
          return { ...b, result, profit, roi };
        }
        return b;
      });
      
      setRecentBets(updatedBets);
      UserDataService.setUserData(currentUser, 'mybets_data', updatedBets);
      
      toast.success(`Ставка позначена як ${result === 'Win' ? 'виграшна' : 'програшна'}`);
      
      loadStats();
      loadRecentBets();
    } catch (error) {
      toast.error('Помилка при оновленні результату ставки');
      console.error(error);
    }
  };

  const sortedBets = [...recentBets].sort((a: any, b: any) => {
    if (a.result === 'Pending' && b.result !== 'Pending') return -1;
    if (a.result !== 'Pending' && b.result === 'Pending') return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const activeBets = recentBets.filter((bet: any) => bet.result === 'Pending');
  const winningBets = recentBets.filter((bet: any) => bet.result === 'Win');
  const losingBets = recentBets.filter((bet: any) => bet.result === 'Loss');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Мої ставки</h1>
          <p className="text-gray-600">Управління ставками та аналіз результатів</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Оновити дані
          </Button>
          <Button 
            onClick={clearRecentBets} 
            variant="destructive" 
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Очистити дані
          </Button>
        </div>
      </div>

      {/* Quick Stats з градієнтами */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Всього ставок</p>
                <p className="text-3xl font-bold text-blue-900">{stats.totalBets}</p>
              </div>
              <BarChart3 className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Win Rate</p>
                <p className="text-3xl font-bold text-green-900">{stats.winRate}%</p>
              </div>
              <Target className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">Загальний профіт</p>
                <p className={`text-3xl font-bold ${stats.totalProfit >= 0 ? 'text-orange-900' : 'text-red-700'}`}>
                  {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit} ₴
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Середній ROI</p>
                <p className={`text-3xl font-bold ${stats.averageROI >= 0 ? 'text-purple-900' : 'text-red-700'}`}>
                  {stats.averageROI >= 0 ? '+' : ''}{stats.averageROI}%
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Таблиця останніх ставок */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-blue-900">Останні ставки</span>
            </div>
            {activeBets.length > 0 && (
              <Badge className="bg-blue-600 text-white">
                <Clock className="h-3 w-3 mr-1" />
                {activeBets.length} активних
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sortedBets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Матч</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700">Дата</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700">Тип ставки</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700">Сума</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700">Коефіцієнт</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700">Статус</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700">Профіт</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBets.map((bet: any, index) => {
                    const isPending = bet.result === 'Pending';
                    const isWin = bet.result === 'Win';
                    const isLoss = bet.result === 'Loss';
                    
                    return (
                      <tr 
                        key={`${bet.date}-${bet.match || bet.team1}-${index}`}
                        className={`border-b hover:bg-gray-50 transition-colors ${
                          isPending ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {isWin ? (
                              <Trophy className="h-4 w-4 text-green-600" />
                            ) : isLoss ? (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-blue-600" />
                            )}
                            <span className="font-semibold text-gray-900">
                              {bet.match || `${bet.team1} vs ${bet.team2}`}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-sm text-gray-600">{bet.date}</span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {bet.betType}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {bet.format}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-semibold text-gray-900">₴{bet.amount}</span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge className="bg-gray-500 text-white font-bold">
                            {bet.odds}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge 
                            className={`${
                              isWin ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0' :
                              isLoss ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0' :
                              'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0'
                            }`}
                          >
                            {isWin ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Виграш
                              </>
                            ) : isLoss ? (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Програш
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                Очікується
                              </>
                            )}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          {bet.profit !== undefined && bet.profit !== null ? (
                            <span className={`font-bold ${bet.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {bet.profit > 0 ? '+' : ''}{bet.profit} ₴
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {isPending && (
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateBetResult(bet, 'Win')}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateBetResult(bet, 'Loss')}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">Поки що немає ставок</p>
              <p className="text-sm text-gray-500">Додайте свою першу ставку, щоб почати відстеження</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Швидкі дії */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Активні ставки</p>
                <p className="text-3xl font-bold text-blue-900">{activeBets.length}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Виграшні ставки</p>
                <p className="text-3xl font-bold text-green-900">{winningBets.length}</p>
              </div>
              <Trophy className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">Програшні ставки</p>
                <p className="text-3xl font-bold text-red-900">{losingBets.length}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Основні вкладки */}
      <Tabs defaultValue="add" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="add">Додати ставку</TabsTrigger>
          <TabsTrigger value="history">Історія ставок</TabsTrigger>
          <TabsTrigger value="strategies">Стратегії</TabsTrigger>
          <TabsTrigger value="settings">Налаштування</TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <CS2BettingForm onRecordAdded={handleRecordAdded} />
        </TabsContent>

        <TabsContent value="history">
          <BettingHistory />
        </TabsContent>

        <TabsContent value="strategies">
          <StrategyOverview />
        </TabsContent>

        <TabsContent value="settings">
          <GoogleSheetsConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}