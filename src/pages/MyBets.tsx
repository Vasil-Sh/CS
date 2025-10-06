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
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, RefreshCw, Calendar, Trophy, AlertTriangle, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MyBets() {
  const [stats, setStats] = useState({
    totalBets: 0,
    winRate: 0,
    totalProfit: 0,
    averageROI: 0,
    profitByMonth: [] as { month: string; profit: number }[],
    profitByStrategy: [] as { strategy: string; profit: number }[]
  });
  const [loading, setLoading] = useState(true);
  const [recentBets, setRecentBets] = useState([]);

  useEffect(() => {
    loadStats();
    loadRecentBets();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await realGoogleSheetsService.getBettingStatistics();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentBets = async () => {
    try {
      const data = await realGoogleSheetsService.fetchUSDTData();
      setRecentBets(data.slice(-20)); // Останні 20 ставок для скролу
    } catch (error) {
      console.error('Error loading recent bets:', error);
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
        // Очищуємо всі дані з localStorage
        await realGoogleSheetsService.clearAllData();
        
        // Оновлюємо локальний стан
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
        
        // Перезавантажуємо дані для синхронізації
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

  // Функція для оновлення результату ставки
  const updateBetResult = async (bet: any, result: 'Win' | 'Loss') => {
    try {
      const profit = result === 'Win' ? (bet.odds - 1) * bet.amount : -bet.amount;
      const roi = (profit / bet.amount) * 100;

      // Оновлюємо ставку в Google Sheets
      await realGoogleSheetsService.updateBetResult(bet, result, profit, roi);
      
      toast.success(`Ставка позначена як ${result === 'Win' ? 'виграшна' : 'програшна'}`);
      
      // Перезавантажуємо дані
      loadStats();
      loadRecentBets();
    } catch (error) {
      toast.error('Помилка при оновленні результату ставки');
      console.error(error);
    }
  };

  // Фільтруємо та сортуємо ставки: спочатку Pending, потім інші по даті
  const sortedBets = [...recentBets].sort((a: any, b: any) => {
    // Спочатку всі Pending ставки
    if (a.result === 'Pending' && b.result !== 'Pending') return -1;
    if (a.result !== 'Pending' && b.result === 'Pending') return 1;
    
    // Якщо обидві Pending або обидві не Pending, сортуємо по даті (новіші спочатку)
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

      {/* Основна статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всього ставок</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBets}</div>
            <p className="text-xs text-muted-foreground">
              Активних та завершених
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Відсоток перемог</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate}%</div>
            <p className="text-xs text-muted-foreground">
              З завершених ставок
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Загальний профіт</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-1 ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.totalProfit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit} ₴
            </div>
            <p className="text-xs text-muted-foreground">
              За весь період
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Середній ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.averageROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.averageROI >= 0 ? '+' : ''}{stats.averageROI}%
            </div>
            <p className="text-xs text-muted-foreground">
              На одну ставку
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Останні ставки з виділенням активних */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Останні ставки
            </div>
            <div className="flex items-center gap-2">
              {activeBets.length > 0 && (
                <Badge variant="default" className="bg-blue-600 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {activeBets.length} активних
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {recentBets.length} записів
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedBets.length > 0 ? (
            <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
              {sortedBets.map((bet: any, index) => {
                const isPending = bet.result === 'Pending';
                return (
                  <div 
                    key={`${bet.date}-${bet.match || bet.team1}-${index}`}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                      isPending 
                        ? 'bg-blue-50 border-blue-200 border-2 shadow-sm hover:bg-blue-100 hover:border-blue-300' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {bet.result === 'Win' ? (
                          <Trophy className="h-4 w-4 text-green-600" />
                        ) : bet.result === 'Loss' ? (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
                        )}
                        <span className={`font-medium ${isPending ? 'text-blue-900' : ''}`}>
                          {bet.match || `${bet.team1} vs ${bet.team2}`}
                        </span>
                      </div>
                      <Badge variant={isPending ? "default" : "outline"} className={isPending ? "bg-blue-600" : ""}>
                        {bet.betType}
                      </Badge>
                      <Badge variant="secondary">{bet.format}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">{bet.date}</span>
                        <span className={`font-medium ${isPending ? 'text-blue-900' : ''}`}>₴{bet.amount}</span>
                        <span className="text-gray-600">@{bet.odds}</span>
                        <Badge 
                          variant={bet.result === 'Win' ? 'default' : bet.result === 'Loss' ? 'destructive' : 'secondary'}
                          className={isPending ? 'bg-blue-600 text-white' : ''}
                        >
                          {bet.result === 'Win' ? 'Виграш' : bet.result === 'Loss' ? 'Програш' : 'Очікується'}
                        </Badge>
                        {bet.profit && (
                          <span className={bet.profit > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {bet.profit > 0 ? '+' : ''}{bet.profit} ₴
                          </span>
                        )}
                      </div>
                      
                      {/* Кнопки для оновлення результату (тільки для Pending ставок) */}
                      {bet.result === 'Pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateBetResult(bet, 'Win')}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Виграш
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateBetResult(bet, 'Loss')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            <XCircle className="h-4 w-4" />
                            Програш
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Поки що немає ставок</p>
              <p className="text-sm">Додайте свою першу ставку, щоб почати відстеження</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Швидкі дії з оновленими даними - тільки числа */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Активні ставки
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {activeBets.length}
            </div>
            <p className="text-sm text-gray-600">Очікують результату</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-green-600" />
              Виграшні ставки
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {winningBets.length}
            </div>
            <p className="text-sm text-gray-600">З останніх {recentBets.length}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Програшні ставки
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {losingBets.length}
            </div>
            <p className="text-sm text-gray-600">З останніх {recentBets.length}</p>
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