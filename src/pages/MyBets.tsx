import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CS2BettingForm from '@/components/CS2BettingForm';
import BettingHistory from '@/components/BettingHistory';
import GoogleSheetsConfig from '@/components/GoogleSheetsConfig';
import StrategyOverview from '@/components/StrategyOverview';
import BetShareModal from '@/components/BetShareModal';
import { realGoogleSheetsService } from '@/lib/realGoogleSheets';
import { UserDataService } from '@/lib/userDataService';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, RefreshCw, Calendar, Trophy, AlertTriangle, CheckCircle, XCircle, Clock, Trash2, Share2 } from 'lucide-react';
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

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);

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
      console.log('🎯 updateBetResult called:', { bet, result });
      
      // ВИПРАВЛЕНО: Використовуємо правильну суму для розрахунку
      const betAmount = bet.originalAmount || bet.amount;
      
      // Розраховуємо прибуток в оригінальній валюті (USD або UAH)
      const originalProfit = result === 'Win' 
        ? (bet.odds - 1) * betAmount  // Виграш: (коеф - 1) × сума
        : -betAmount;                  // Програш: -сума
      
      console.log('💵 Original profit calculation:', {
        betAmount,
        odds: bet.odds,
        result,
        originalProfit,
        currency: bet.currency
      });
      
      // Конвертуємо прибуток в UAH для аналітики (тільки якщо це USD)
      let profitInUAH = originalProfit;
      if (bet.currency === 'USD' && bet.exchangeRate) {
        profitInUAH = originalProfit * bet.exchangeRate;
        console.log('💱 Converting USD to UAH:', {
          originalProfit,
          exchangeRate: bet.exchangeRate,
          profitInUAH
        });
      }
      
      const roi = (profitInUAH / bet.amount) * 100;

      // Update in Google Sheets (if connected)
      await realGoogleSheetsService.updateBetResult(bet, result, profitInUAH, roi);
      
      // Update in user-specific localStorage
      const updatedBets = recentBets.map((b: any) => {
        if (b.date === bet.date && b.match === bet.match && b.amount === bet.amount && b.odds === bet.odds) {
          const updatedBet = { 
            ...b, 
            result, 
            profit: profitInUAH,        // Прибуток в UAH для аналітики
            originalProfit: originalProfit, // Прибуток в оригінальній валюті (USD або UAH)
            roi 
          };
          
          console.log('✅ Updated bet:', updatedBet);
          return updatedBet;
        }
        return b;
      });
      
      setRecentBets(updatedBets);
      UserDataService.setUserData(currentUser, 'mybets_data', updatedBets);
      
      console.log('💾 Saved to localStorage:', {
        totalBets: updatedBets.length,
        updatedBet: updatedBets.find((b: any) => 
          b.date === bet.date && b.match === bet.match && b.amount === bet.amount && b.odds === bet.odds
        )
      });
      
      toast.success(`Ставка позначена як ${result === 'Win' ? 'виграшна' : 'програшна'}`);
      
      loadStats();
      loadRecentBets();
    } catch (error) {
      toast.error('Помилка при оновленні результату ставки');
      console.error('❌ Error in updateBetResult:', error);
    }
  };

  const handleShareBet = (bet: any) => {
    setSelectedBet(bet);
    setShareModalOpen(true);
  };

  const sortedBets = [...recentBets].sort((a: any, b: any) => {
    if (a.result === 'Pending' && b.result !== 'Pending') return -1;
    if (a.result !== 'Pending' && b.result === 'Pending') return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const activeBets = recentBets.filter((bet: any) => bet.result === 'Pending');
  const winningBets = recentBets.filter((bet: any) => bet.result === 'Win');
  const losingBets = recentBets.filter((bet: any) => bet.result === 'Loss');

  // Функція для отримання символу валюти
  const getCurrencySymbol = (currency?: string) => {
    if (currency === 'USD') return '$';
    return '₴';
  };

  return (
    <div className="space-y-8 p-6 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Header - iOS style */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Мої ставки</h1>
          <p className="text-gray-500 mt-1 font-medium">Управління ставками та аналіз результатів</p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={refreshData} 
            variant="outline" 
            className="rounded-2xl border-gray-200 hover:bg-gray-50 font-medium"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Оновити
          </Button>
          <Button 
            onClick={clearRecentBets} 
            variant="outline"
            className="rounded-2xl border-red-200 text-red-600 hover:bg-red-50 font-medium"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Очистити
          </Button>
        </div>
      </div>

      {/* Quick Stats - iOS cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Всього ставок</p>
                <p className="text-3xl font-semibold text-gray-900 tracking-tight">{stats.totalBets}</p>
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
                <p className="text-3xl font-semibold text-green-600 tracking-tight">{stats.winRate}%</p>
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
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Профіт (UAH)</p>
                <p className={`text-3xl font-semibold tracking-tight ${stats.totalProfit >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                  {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit} ₴
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
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Середній ROI</p>
                <p className={`text-3xl font-semibold tracking-tight ${stats.averageROI >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                  {stats.averageROI >= 0 ? '+' : ''}{stats.averageROI}%
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-2xl">
                <TrendingUp className="h-7 w-7 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bets Table - iOS style */}
      <Card className="border-0 shadow-2xl rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-white/80 backdrop-blur-xl">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-2xl">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xl font-semibold text-gray-900 tracking-tight">Останні ставки</span>
            </div>
            {activeBets.length > 0 && (
              <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 text-sm font-semibold rounded-full border-0">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                {activeBets.length} активних
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sortedBets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Матч</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Дата</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Тип</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Валюта</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Сума</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Коеф.</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Статус</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Профіт</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBets.map((bet: any, index) => {
                    const isPending = bet.result === 'Pending';
                    const isWin = bet.result === 'Win';
                    const isLoss = bet.result === 'Loss';
                    const currency = bet.currency || 'UAH';
                    const currencySymbol = getCurrencySymbol(currency);
                    const displayAmount = bet.originalAmount || bet.amount;
                    const displayProfit = bet.originalProfit !== undefined ? bet.originalProfit : bet.profit;
                    
                    return (
                      <tr 
                        key={`${bet.date}-${bet.match || bet.team1}-${index}`}
                        className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${
                              isWin ? 'bg-green-50' : isLoss ? 'bg-red-50' : 'bg-blue-50'
                            }`}>
                              {isWin ? (
                                <Trophy className="h-4 w-4 text-green-600" />
                              ) : isLoss ? (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              ) : (
                                <Clock className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                            <span className="font-semibold text-gray-900 text-sm">
                              {bet.match || `${bet.team1} vs ${bet.team2}`}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-sm text-gray-600 font-medium">{bet.date}</span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Badge variant="secondary" className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border-0">
                              {bet.betType}
                            </Badge>
                            <Badge variant="secondary" className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border-0">
                              {bet.format}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border-0">
                            {currency}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-semibold text-gray-900">{currencySymbol}{displayAmount}</span>
                          {currency === 'USD' && bet.exchangeRate && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              ≈ ₴{(displayAmount * bet.exchangeRate).toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <Badge className="bg-gray-100 text-gray-900 font-semibold px-3 py-1 rounded-full border-0">
                            {bet.odds}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <Badge 
                            className={`font-semibold px-3 py-1.5 rounded-full border-0 ${
                              isWin ? 'bg-green-100 text-green-700' :
                              isLoss ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {isWin ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Виграш
                              </>
                            ) : isLoss ? (
                              <>
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Програш
                              </>
                            ) : (
                              <>
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                Очікується
                              </>
                            )}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          {displayProfit !== undefined && displayProfit !== null ? (
                            <div>
                              <span className={`font-semibold ${displayProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {displayProfit > 0 ? '+' : ''}{displayProfit.toFixed(2)} {currencySymbol}
                              </span>
                              {currency === 'USD' && bet.exchangeRate && bet.profit !== undefined && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  ≈ {bet.profit > 0 ? '+' : ''}{bet.profit.toFixed(2)} ₴
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex gap-2 justify-center">
                            {isPending && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateBetResult(bet, 'Win')}
                                  className="h-9 w-9 p-0 rounded-full border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateBetResult(bet, 'Loss')}
                                  className="h-9 w-9 p-0 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShareBet(bet)}
                              className="h-9 w-9 p-0 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                              title="Поділитися"
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="p-4 bg-gray-50 rounded-3xl w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-900 font-semibold text-lg">Поки що немає ставок</p>
              <p className="text-sm text-gray-500 mt-2">Додайте свою першу ставку, щоб почати відстеження</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions - iOS cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Активні</p>
                <p className="text-3xl font-semibold text-blue-600 tracking-tight">{activeBets.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl">
                <Clock className="h-7 w-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Виграші</p>
                <p className="text-3xl font-semibold text-green-600 tracking-tight">{winningBets.length}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-2xl">
                <Trophy className="h-7 w-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Програші</p>
                <p className="text-3xl font-semibold text-red-600 tracking-tight">{losingBets.length}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-2xl">
                <AlertTriangle className="h-7 w-7 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs - iOS style */}
      <Tabs defaultValue="add" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-2xl border-0">
          <TabsTrigger value="add" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Додати ставку
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Історія
          </TabsTrigger>
          <TabsTrigger value="strategies" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Стратегії
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Налаштування
          </TabsTrigger>
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

      {/* Share Modal */}
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
    </div>
  );
}