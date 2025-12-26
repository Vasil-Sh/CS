import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CS2BettingForm from '@/components/CS2BettingForm';
import BettingHistory from '@/components/BettingHistory';
import StrategyOverview from '@/components/StrategyOverview';
import BetShareModal from '@/components/BetShareModal';
import InitialBankModal from '@/components/InitialBankModal';
import { realGoogleSheetsService } from '@/lib/realGoogleSheets';
import { UserDataService } from '@/lib/userDataService';
import { BankrollService } from '@/lib/bankrollService';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Calendar, Trophy, AlertTriangle, CheckCircle, XCircle, Clock, Trash2, Share2, Flag, Wallet, Edit, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { Bet } from '@/types/betting';

interface Goal {
  id: string;
  name: string;
  type: 'amount' | 'ladder' | 'roi' | 'winrate';
  status: 'active' | 'completed' | 'failed';
}

interface ParsedEvent {
  number: string;
  match: string;
  betType: string;
  selection: string;
  odds: string;
}

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
  
  const [recentBets, setRecentBets] = useState<Bet[]>(() => 
    UserDataService.getUserData(currentUser, 'mybets_data', [])
  );

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  
  const [expandedExpressBets, setExpandedExpressBets] = useState<Set<string>>(new Set());

  const [bankrollStats, setBankrollStats] = useState(() => 
    BankrollService.getBankrollStats(currentUser, recentBets)
  );
  const [isBankrollInitialized, setIsBankrollInitialized] = useState(() => 
    BankrollService.isInitialized(currentUser)
  );

  useEffect(() => {
    loadStats();
    loadRecentBets();
  }, []);

  useEffect(() => {
    if (currentUser) {
      UserDataService.setUserData(currentUser, 'mybets_stats', stats);
      UserDataService.setUserData(currentUser, 'mybets_data', recentBets);
    }
  }, [stats, recentBets, currentUser]);

  useEffect(() => {
    setBankrollStats(BankrollService.getBankrollStats(currentUser, recentBets));
    setIsBankrollInitialized(BankrollService.isInitialized(currentUser));
  }, [recentBets, currentUser]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const data = await realGoogleSheetsService.getBettingStatistics();
      
      if (data.totalBets > 0) {
        setStats(data);
      } else {
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
      const data = await realGoogleSheetsService.fetchUSDTData();
      
      if (data.length > 0) {
        setRecentBets(data.slice(-20));
      } else {
        const savedBets = UserDataService.getUserData(currentUser, 'mybets_data', []);
        setRecentBets(savedBets);
      }
    } catch (error) {
      console.error('Error loading recent bets:', error);
      
      const savedBets = UserDataService.getUserData(currentUser, 'mybets_data', []);
      setRecentBets(savedBets);
    }
  };

  const handleRecordAdded = () => {
    loadStats();
    loadRecentBets();
  };

  const clearRecentBets = async () => {
    if (window.confirm('Ви впевнені, що хочете очистити всі дані? Це видалить всі ставки, статистику та історію. Ця дія незворотна.')) {
      try {
        await realGoogleSheetsService.clearAllData();
        
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

  const updateBetResult = async (bet: Bet, result: 'Win' | 'Loss') => {
    try {
      console.log('🎯 updateBetResult called:', { bet, result });
      
      const betAmount = bet.originalAmount || bet.amount;
      
      const originalProfit = result === 'Win' 
        ? (bet.odds - 1) * betAmount
        : -betAmount;
      
      console.log('💵 Original profit calculation:', {
        betAmount,
        odds: bet.odds,
        result,
        originalProfit,
        currency: bet.currency
      });
      
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

      await realGoogleSheetsService.updateBetResult(bet, result, profitInUAH, roi);
      
      const updatedBets = recentBets.map((b: Bet) => {
        if (b.date === bet.date && b.match === bet.match && b.amount === bet.amount && b.odds === bet.odds) {
          const updatedBet = { 
            ...b, 
            result, 
            profit: profitInUAH,
            originalProfit: originalProfit,
            roi,
            goalId: b.goalId
          };
          
          console.log('✅ Updated bet with goalId:', updatedBet);
          return updatedBet;
        }
        return b;
      });
      
      setRecentBets(updatedBets);
      UserDataService.setUserData(currentUser, 'mybets_data', updatedBets);
      
      console.log('💾 Saved to localStorage:', {
        totalBets: updatedBets.length,
        updatedBet: updatedBets.find((b: Bet) => 
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

  const handleShareBet = (bet: Bet) => {
    setSelectedBet(bet);
    setShareModalOpen(true);
  };

  const handleBankCardClick = () => {
    setBankModalOpen(true);
  };

  const handleBankModalClose = (success: boolean) => {
    setBankModalOpen(false);
    if (success) {
      setBankrollStats(BankrollService.getBankrollStats(currentUser, recentBets));
      setIsBankrollInitialized(BankrollService.isInitialized(currentUser));
    }
  };

  const sortedBets = [...recentBets].sort((a: Bet, b: Bet) => {
    if (a.result === 'Pending' && b.result !== 'Pending') return -1;
    if (a.result !== 'Pending' && b.result === 'Pending') return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const activeBets = recentBets.filter((bet: Bet) => bet.result === 'Pending');
  const winningBets = recentBets.filter((bet: Bet) => bet.result === 'Win');
  const losingBets = recentBets.filter((bet: Bet) => bet.result === 'Loss');

  const getCurrencySymbol = (currency?: string) => {
    if (currency === 'USD') return '$';
    return '₴';
  };

  const getGoalName = (goalId?: string) => {
    if (!goalId) return null;
    const goals = UserDataService.getUserData(currentUser, 'goals', []);
    const goal = goals.find((g: Goal) => g.id === goalId);
    return goal?.name || 'Видалена ціль';
  };

  const parseExpressEvents = (betType: string): ParsedEvent[] => {
    if (!betType.includes('|')) return [];
    
    const fullString = betType.split('|').slice(1).join('|').trim();
    const eventStrings = fullString.split('•').map(e => e.trim());
    
    return eventStrings.map(eventStr => {
      const parts = eventStr.split('|').map(p => p.trim());
      
      if (parts.length >= 2) {
        const matchPart = parts[0];
        const betPart = parts[1];
        
        const numberMatch = matchPart.match(/^(\d+)\.\s*(.+)$/);
        const number = numberMatch ? numberMatch[1] : '';
        const match = numberMatch ? numberMatch[2] : matchPart;
        
        const betMatch = betPart.match(/^(.+?):\s*(.+?)\s*@([\d.]+)$/);
        const betType = betMatch ? betMatch[1] : '';
        const selection = betMatch ? betMatch[2] : '';
        const odds = betMatch ? betMatch[3] : '';
        
        return { number, match, betType, selection, odds };
      }
      
      return { number: '', match: eventStr, betType: '', selection: '', odds: '' };
    });
  };

  const isExpressBet = (bet: Bet) => {
    return bet.betType.includes('Експрес') || bet.format.includes('x');
  };

  const getExpressEventCount = (bet: Bet) => {
    const match = bet.format.match(/(\d+)x/);
    return match ? parseInt(match[1]) : 0;
  };

  const toggleExpressBet = (betKey: string) => {
    setExpandedExpressBets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(betKey)) {
        newSet.delete(betKey);
      } else {
        newSet.add(betKey);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-8 p-6 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Мої ставки</h1>
          <p className="text-gray-500 mt-1 font-medium">Управління ставками та аналіз результатів</p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={clearRecentBets} 
            variant="outline"
            className="rounded-2xl border-red-200 text-red-600 hover:bg-red-50 font-medium"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Очистити всі дані
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Профіт</p>
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

        <Card 
          className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
          onClick={handleBankCardClick}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Поточний банк</p>
                {isBankrollInitialized ? (
                  <>
                    <p className={`text-3xl font-semibold tracking-tight ${bankrollStats.currentBank >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {bankrollStats.currentBank.toFixed(0)} ₴
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Старт: {bankrollStats.initialBank.toFixed(0)} ₴
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500 mt-1">Не встановлено</p>
                    <Edit className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                <Wallet className="h-7 w-7 text-white" />
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

      {/* Recent Bets Table - UPDATED WITH ACCENT COLORS */}
      <Card className="border-0 shadow-xl rounded-3xl bg-gradient-to-br from-white to-gray-50 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardTitle className="flex items-center justify-between text-xl font-bold">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6" />
              <span>Останні ставки</span>
            </div>
            {activeBets.length > 0 && (
              <Badge className="rounded-full bg-white/20 text-white border-0 text-base px-4 py-1 font-bold">
                <Clock className="h-4 w-4 mr-1.5" />
                {activeBets.length} активних
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {sortedBets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-4">
                      <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-wider">
                        <Calendar className="h-4 w-4" />
                        Дата
                      </div>
                    </th>
                    <th className="text-left p-4">
                      <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-wider">
                        <Target className="h-4 w-4" />
                        Матч
                      </div>
                    </th>
                    <th className="text-center p-4 text-xs font-black text-gray-700 uppercase tracking-wider">Тип</th>
                    <th className="text-center p-4 text-xs font-black text-gray-700 uppercase tracking-wider">Валюта</th>
                    <th className="text-center p-4 text-xs font-black text-gray-700 uppercase tracking-wider">Сума</th>
                    <th className="text-center p-4 text-xs font-black text-gray-700 uppercase tracking-wider">Коеф.</th>
                    <th className="text-center p-4 text-xs font-black text-gray-700 uppercase tracking-wider">Ціль</th>
                    <th className="text-center p-4 text-xs font-black text-gray-700 uppercase tracking-wider">Статус</th>
                    <th className="text-center p-4 text-xs font-black text-gray-700 uppercase tracking-wider">Профіт</th>
                    <th className="text-center p-4 text-xs font-black text-gray-700 uppercase tracking-wider">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBets.map((bet: Bet, index) => {
                    const isPending = bet.result === 'Pending';
                    const isWin = bet.result === 'Win';
                    const isLoss = bet.result === 'Loss';
                    const currency = bet.currency || 'UAH';
                    const currencySymbol = getCurrencySymbol(currency);
                    const displayAmount = bet.originalAmount || bet.amount;
                    const displayProfit = bet.originalProfit !== undefined ? bet.originalProfit : bet.profit;
                    const goalName = getGoalName(bet.goalId);
                    
                    const isExpress = isExpressBet(bet);
                    const expressEventCount = isExpress ? getExpressEventCount(bet) : 0;
                    const betKey = `${bet.date}-${bet.match || bet.team1}-${index}`;
                    const isExpanded = expandedExpressBets.has(betKey);
                    const parsedEvents = isExpress ? parseExpressEvents(bet.betType) : [];
                    
                    return (
                      <tr 
                        key={betKey}
                        className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">{bet.date}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${
                              isWin ? 'bg-green-100' : isLoss ? 'bg-red-100' : 'bg-blue-100'
                            }`}>
                              {isWin ? (
                                <Trophy className="h-5 w-5 text-green-600" />
                              ) : isLoss ? (
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                              ) : (
                                <Clock className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-base">
                                {bet.match || `${bet.team1} vs ${bet.team2}`}
                              </div>
                              {!isExpress && (
                                <div className="text-xs text-gray-600 mt-1">{bet.betType}</div>
                              )}
                              <Badge className="text-xs rounded-full bg-purple-100 text-purple-700 border-0 font-bold mt-1">
                                {bet.format}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {isExpress ? (
                            <div className="flex flex-col items-center gap-2">
                              <Badge className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 font-bold text-sm px-3 py-1">
                                Express {expressEventCount}×
                              </Badge>
                              {parsedEvents.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleExpressBet(betKey)}
                                  className="rounded-xl border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 font-bold text-purple-700"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-4 w-4 mr-1" />
                                      Сховати
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-4 w-4 mr-1" />
                                      Деталі
                                    </>
                                  )}
                                </Button>
                              )}
                              {isExpanded && parsedEvents.length > 0 && (
                                <div className="mt-2 space-y-2 w-full max-w-md">
                                  {parsedEvents.map((event, idx) => (
                                    <div key={idx} className="p-3 bg-white rounded-xl border-2 border-purple-200 shadow-sm">
                                      <div className="flex items-start gap-2 mb-2">
                                        <Badge className="rounded-full bg-purple-600 text-white border-0 text-xs px-2 py-1 font-bold">
                                          #{event.number}
                                        </Badge>
                                        <span className="font-bold text-gray-900 text-sm flex-1">
                                          {event.match}
                                        </span>
                                      </div>
                                      <div className="ml-8 space-y-1">
                                        <p className="text-gray-500 uppercase tracking-wide font-bold text-[10px]">
                                          {event.betType}
                                        </p>
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-purple-700 text-sm">
                                            {event.selection}
                                          </span>
                                          <Badge className="text-xs bg-green-100 text-green-700 border-0 rounded-full px-2 py-1 font-bold">
                                            @{parseFloat(event.odds).toFixed(2)}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge className="rounded-full bg-blue-100 text-blue-700 border-0 font-bold">
                              {bet.betType.split(' - ')[1] || bet.betType.split(' - ')[0]}
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <Badge className="rounded-full bg-cyan-100 text-cyan-700 border-0 font-bold text-sm px-3 py-1">
                            {currency}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-bold text-gray-900 text-base">{currencySymbol}{displayAmount}</span>
                          </div>
                          {currency === 'USD' && bet.exchangeRate && (
                            <div className="text-xs text-gray-500 mt-1">
                              ≈ ₴{(displayAmount * bet.exchangeRate).toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <Badge className="rounded-full bg-orange-100 text-orange-700 border-0 font-bold text-base px-3 py-1">
                            {bet.odds.toFixed(2)}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          {goalName ? (
                            <Badge className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full border-0 text-xs">
                              <Flag className="h-3 w-3 mr-1" />
                              {goalName}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {isWin ? (
                              <div className="p-2 bg-green-100 rounded-lg">
                                <Trophy className="h-5 w-5 text-green-600" />
                              </div>
                            ) : isLoss ? (
                              <div className="p-2 bg-red-100 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                              </div>
                            ) : (
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Clock className="h-5 w-5 text-blue-600" />
                              </div>
                            )}
                            <Badge 
                              className={`rounded-full border-0 font-bold text-sm px-3 py-1 ${
                                isWin ? 'bg-green-100 text-green-700' :
                                isLoss ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {isWin ? 'Виграш' : isLoss ? 'Програш' : 'Очікується'}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {displayProfit !== undefined && displayProfit !== null ? (
                            <div className="flex items-center justify-center gap-2">
                              {displayProfit >= 0 ? (
                                <div className="p-2 bg-green-100 rounded-lg">
                                  <TrendingUp className="h-5 w-5 text-green-600" />
                                </div>
                              ) : (
                                <div className="p-2 bg-red-100 rounded-lg">
                                  <TrendingDown className="h-5 w-5 text-red-600" />
                                </div>
                              )}
                              <div>
                                <span className={`font-black text-base ${displayProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {displayProfit >= 0 ? '+' : ''}{displayProfit.toFixed(2)} {currencySymbol}
                                </span>
                                {currency === 'USD' && bet.exchangeRate && bet.profit !== undefined && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    ≈ {bet.profit >= 0 ? '+' : ''}{bet.profit.toFixed(2)} ₴
                                  </div>
                                )}
                              </div>
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
                                  className="h-10 w-10 p-0 rounded-full border-2 border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700"
                                >
                                  <CheckCircle className="h-5 w-5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateBetResult(bet, 'Loss')}
                                  className="h-10 w-10 p-0 rounded-full border-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  <XCircle className="h-5 w-5" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShareBet(bet)}
                              className="h-10 w-10 p-0 rounded-full border-2 border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                              title="Поділитися"
                            >
                              <Share2 className="h-5 w-5" />
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
            <div className="text-center py-12">
              <div className="p-6 bg-gray-100 rounded-3xl inline-block mb-4">
                <Calendar className="h-16 w-16 text-gray-400" />
              </div>
              <p className="text-gray-900 font-bold text-lg">Поки що немає ставок</p>
              <p className="text-sm text-gray-500 mt-2">Додайте свою першу ставку, щоб почати відстеження</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
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

      {/* Tabs */}
      <Tabs defaultValue="add" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-2xl border-0">
          <TabsTrigger value="add" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Додати ставку
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Історія
          </TabsTrigger>
          <TabsTrigger value="strategies" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Стратегії
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
      </Tabs>

      <InitialBankModal
        open={bankModalOpen}
        onClose={handleBankModalClose}
        mode={isBankrollInitialized ? 'edit' : 'setup'}
      />

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