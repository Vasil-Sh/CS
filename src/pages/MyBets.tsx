import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { 
  TrendingUp, DollarSign, Target, BarChart3, Calendar, Trophy, 
  AlertTriangle, CheckCircle, XCircle, Clock, Trash2, Share2, 
  Flag, Wallet, Edit, ChevronDown, ChevronUp, Zap, LucideIcon
} from 'lucide-react';
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

interface BetStats {
  totalBets: number;
  winRate: number;
  totalProfit: number;
  averageROI: number;
  profitByMonth: { month: string; profit: number }[];
  profitByStrategy: { strategy: string; profit: number }[];
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

const DEFAULT_STATS: BetStats = {
  totalBets: 0,
  winRate: 0,
  totalProfit: 0,
  averageROI: 0,
  profitByMonth: [],
  profitByStrategy: []
};

const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }: StatCardProps) => (
  <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{title}</p>
          <p className={`text-3xl font-semibold tracking-tight ${colorClass}`}>{value}</p>
        </div>
        <div className={`p-3 ${bgClass} rounded-2xl`}>
          <Icon className={`h-7 w-7 ${colorClass}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function MyBets() {
  const currentUser = localStorage.getItem('currentUser') || '';
  
  const [stats, setStats] = useState<BetStats>(() => 
    UserDataService.getUserData(currentUser, 'mybets_stats', DEFAULT_STATS)
  );
  const [recentBets, setRecentBets] = useState<Bet[]>(() => 
    UserDataService.getUserData(currentUser, 'mybets_data', [])
  );
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [expandedExpressBets, setExpandedExpressBets] = useState<Set<string>>(new Set());

  const bankrollStats = useMemo(() => 
    BankrollService.getBankrollStats(currentUser, recentBets),
    [currentUser, recentBets]
  );
  
  const isBankrollInitialized = useMemo(() => 
    BankrollService.isInitialized(currentUser),
    [currentUser]
  );

  // Daily reset check
  useEffect(() => {
    if (currentUser) {
      UserDataService.checkAndResetDailyBets(currentUser);
    }
  }, [currentUser]);

  // Initial data load
  useEffect(() => {
    loadStats();
    loadRecentBets();
  }, []);

  // Persist data to localStorage
  useEffect(() => {
    if (currentUser) {
      UserDataService.setUserData(currentUser, 'mybets_stats', stats);
      UserDataService.setUserData(currentUser, 'mybets_data', recentBets);
    }
  }, [stats, recentBets, currentUser]);

  const loadStats = useCallback(async () => {
    try {
      const data = await realGoogleSheetsService.getBettingStatistics();
      if (data.totalBets > 0) {
        setStats(data);
      } else {
        setStats(UserDataService.getUserData(currentUser, 'mybets_stats', DEFAULT_STATS));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(UserDataService.getUserData(currentUser, 'mybets_stats', DEFAULT_STATS));
    }
  }, [currentUser]);

  const loadRecentBets = useCallback(async () => {
    try {
      const data = await realGoogleSheetsService.fetchUSDTData();
      setRecentBets(data.length > 0 ? data.slice(-20) : UserDataService.getUserData(currentUser, 'mybets_data', []));
    } catch (error) {
      console.error('Error loading recent bets:', error);
      setRecentBets(UserDataService.getUserData(currentUser, 'mybets_data', []));
    }
  }, [currentUser]);

  const handleRecordAdded = useCallback(() => {
    loadStats();
    loadRecentBets();
  }, [loadStats, loadRecentBets]);

  const clearRecentBets = useCallback(async () => {
    if (window.confirm('Ви впевнені, що хочете очистити всі дані? Це видалить всі ставки, статистику та історію. Ця дія незворотна.')) {
      try {
        await realGoogleSheetsService.clearAllData();
        UserDataService.clearUserData(currentUser, 'mybets_data');
        UserDataService.clearUserData(currentUser, 'mybets_stats');
        setRecentBets([]);
        setStats(DEFAULT_STATS);
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
  }, [currentUser, loadStats, loadRecentBets]);

  const updateBetResult = useCallback(async (bet: Bet, result: 'Win' | 'Loss') => {
    try {
      const betAmount = bet.originalAmount || bet.amount;
      const originalProfit = result === 'Win' ? (bet.odds - 1) * betAmount : -betAmount;
      
      let profitInUAH = originalProfit;
      if (bet.currency === 'USD' && bet.exchangeRate) {
        profitInUAH = originalProfit * bet.exchangeRate;
      }
      
      const roi = (profitInUAH / bet.amount) * 100;
      await realGoogleSheetsService.updateBetResult(bet, result, profitInUAH, roi);
      
      const updatedBets = recentBets.map((b: Bet) => 
        (b.date === bet.date && b.match === bet.match && b.amount === bet.amount && b.odds === bet.odds)
          ? { ...b, result, profit: profitInUAH, originalProfit, roi, goalId: b.goalId }
          : b
      );
      
      setRecentBets(updatedBets);
      UserDataService.setUserData(currentUser, 'mybets_data', updatedBets);
      toast.success(`Ставка позначена як ${result === 'Win' ? 'виграшна' : 'програшна'}`);
      
      loadStats();
      loadRecentBets();
    } catch (error) {
      toast.error('Помилка при оновленні результату ставки');
      console.error('Error in updateBetResult:', error);
    }
  }, [recentBets, currentUser, loadStats, loadRecentBets]);

  const handleShareBet = useCallback((bet: Bet) => {
    setSelectedBet(bet);
    setShareModalOpen(true);
  }, []);

  const handleBankCardClick = useCallback(() => {
    setBankModalOpen(true);
  }, []);

  const handleBankModalClose = useCallback((success: boolean) => {
    setBankModalOpen(false);
  }, []);

  const sortedBets = useMemo(() => 
    [...recentBets].sort((a: Bet, b: Bet) => {
      if (a.result === 'Pending' && b.result !== 'Pending') return -1;
      if (a.result !== 'Pending' && b.result === 'Pending') return 1;
      const aTime = a.createdAt || new Date(a.date).getTime();
      const bTime = b.createdAt || new Date(b.date).getTime();
      return bTime - aTime;
    }),
    [recentBets]
  );

  const { activeBets, winningBets, losingBets } = useMemo(() => ({
    activeBets: recentBets.filter((bet: Bet) => bet.result === 'Pending'),
    winningBets: recentBets.filter((bet: Bet) => bet.result === 'Win'),
    losingBets: recentBets.filter((bet: Bet) => bet.result === 'Loss')
  }), [recentBets]);

  const getCurrencySymbol = useCallback((currency?: string) => 
    currency === 'USD' ? '$' : '₴',
    []
  );

  const getGoalName = useCallback((goalId?: string) => {
    if (!goalId) return null;
    const goals = UserDataService.getUserData(currentUser, 'goals', []);
    const goal = goals.find((g: Goal) => g.id === goalId);
    return goal?.name || 'Видалена ціль';
  }, [currentUser]);

  const parseExpressEvents = useCallback((betType: string): ParsedEvent[] => {
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
  }, []);

  const isExpressBet = useCallback((bet: Bet) => 
    bet.betType.includes('Експрес') || bet.format.includes('x'),
    []
  );

  const getExpressEventCount = useCallback((bet: Bet) => {
    const match = bet.format.match(/(\d+)x/);
    return match ? parseInt(match[1]) : 0;
  }, []);

  const toggleExpressBet = useCallback((betKey: string) => {
    setExpandedExpressBets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(betKey)) {
        newSet.delete(betKey);
      } else {
        newSet.add(betKey);
      }
      return newSet;
    });
  }, []);

  return (
    <div className="space-y-8 p-6 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Мої ставки</h1>
          <p className="text-gray-500 mt-1 font-medium">Управління ставками та аналіз результатів</p>
        </div>
        
        <Button 
          onClick={clearRecentBets} 
          variant="outline"
          className="rounded-2xl border-red-200 text-red-600 hover:bg-red-50 font-medium"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Очистити всі дані
        </Button>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className="border-0 shadow-xl rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 relative group"
          onClick={handleBankCardClick}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white/90 uppercase tracking-wide mb-2 flex items-center gap-2">
                  Поточний банк
                  <Edit className="h-3 w-3 opacity-70" />
                </p>
                {isBankrollInitialized ? (
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

        <StatCard title="Всього ставок" value={stats.totalBets} icon={BarChart3} colorClass="text-gray-900" bgClass="bg-blue-50" />
        <StatCard 
          title="Профіт" 
          value={`${stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit} ₴`} 
          icon={DollarSign} 
          colorClass={stats.totalProfit >= 0 ? 'text-orange-600' : 'text-red-600'} 
          bgClass="bg-orange-50" 
        />
        <StatCard title="Win Rate" value={`${stats.winRate}%`} icon={Target} colorClass="text-green-600" bgClass="bg-green-50" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Активні" value={activeBets.length} icon={Clock} colorClass="text-blue-600" bgClass="bg-blue-50" />
        <StatCard title="Виграші" value={winningBets.length} icon={Trophy} colorClass="text-green-600" bgClass="bg-green-50" />
        <StatCard title="Програші" value={losingBets.length} icon={AlertTriangle} colorClass="text-red-600" bgClass="bg-red-50" />
        <StatCard 
          title="Середній ROI" 
          value={`${stats.averageROI >= 0 ? '+' : ''}${stats.averageROI}%`} 
          icon={TrendingUp} 
          colorClass={stats.averageROI >= 0 ? 'text-purple-600' : 'text-red-600'} 
          bgClass="bg-purple-50" 
        />
      </div>

      {/* Recent Bets Table */}
      <Card className="border-0 shadow-xl rounded-3xl bg-gradient-to-br from-white to-gray-50 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <CardTitle className="flex items-center justify-between text-xl font-bold text-gray-900">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <span>Останні ставки</span>
            </div>
            {activeBets.length > 0 && (
              <Badge className="rounded-full bg-amber-100 text-amber-700 border-0 text-base px-4 py-1 font-bold animate-pulse">
                <Clock className="h-4 w-4 mr-1.5" />
                {activeBets.length} активних
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {sortedBets.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left p-4 w-32">
                        <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-wider">
                          <Calendar className="h-4 w-4" />
                          Дата
                        </div>
                      </th>
                      <th className="text-left p-4 min-w-[200px]">
                        <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-wider">
                          <Target className="h-4 w-4" />
                          Матч
                        </div>
                      </th>
                      <th className="text-center p-4 w-48 text-xs font-black text-gray-700 uppercase tracking-wider">Тип</th>
                      <th className="text-center p-4 w-24 text-xs font-black text-gray-700 uppercase tracking-wider">Валюта</th>
                      <th className="text-center p-4 w-28 text-xs font-black text-gray-700 uppercase tracking-wider">Сума</th>
                      <th className="text-center p-4 w-24 text-xs font-black text-gray-700 uppercase tracking-wider">Коеф.</th>
                      <th className="text-center p-4 w-32 text-xs font-black text-gray-700 uppercase tracking-wider">Ціль</th>
                      <th className="text-center p-4 w-32 text-xs font-black text-gray-700 uppercase tracking-wider">Статус</th>
                      <th className="text-center p-4 w-32 text-xs font-black text-gray-700 uppercase tracking-wider">Профіт</th>
                      <th className="text-center p-4 w-32 text-xs font-black text-gray-700 uppercase tracking-wider">Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBets.map((bet: Bet) => {
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
                      const betKey = `${bet.date}-${bet.match || bet.team1}-${bet.amount}-${bet.odds}`;
                      const isExpanded = expandedExpressBets.has(betKey);
                      const parsedEvents = isExpress ? parseExpressEvents(bet.betType) : [];
                      
                      return (
                        <>
                          <tr 
                            key={betKey}
                            className={`border-b transition-all ${
                              isPending 
                                ? 'bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border-l-4 border-l-amber-400' 
                                : 'border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50'
                            }`}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${isPending ? 'bg-amber-200' : 'bg-blue-100'}`}>
                                  <Calendar className={`h-4 w-4 ${isPending ? 'text-amber-700' : 'text-blue-600'}`} />
                                </div>
                                <span className={`text-sm font-bold ${isPending ? 'text-amber-900' : 'text-gray-900'}`}>{bet.date}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${
                                  isWin ? 'bg-green-100' : isLoss ? 'bg-red-100' : 'bg-amber-200'
                                }`}>
                                  {isWin ? (
                                    <Trophy className="h-5 w-5 text-green-600" />
                                  ) : isLoss ? (
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                  ) : (
                                    <Clock className="h-5 w-5 text-amber-700" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className={`font-bold text-base truncate ${isPending ? 'text-amber-900' : 'text-gray-900'}`} title={bet.match || `${bet.team1} vs ${bet.team2}`}>
                                    {bet.match || `${bet.team1} vs ${bet.team2}`}
                                  </div>
                                  {!isExpress && (
                                    <div className={`text-xs mt-1 truncate ${isPending ? 'text-amber-700' : 'text-gray-600'}`} title={bet.betType}>{bet.betType}</div>
                                  )}
                                  <Badge className={`text-xs rounded-full border-0 font-bold mt-1 ${
                                    isPending ? 'bg-amber-200 text-amber-800' : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {bet.format}
                                  </Badge>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              {isExpress ? (
                                <div className="flex flex-col items-center gap-2">
                                  <Badge className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 font-bold text-sm px-3 py-1 whitespace-nowrap">
                                    Express {expressEventCount}×
                                  </Badge>
                                  {parsedEvents.length > 0 && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => toggleExpressBet(betKey)}
                                      className="rounded-xl border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 font-bold text-purple-700 text-xs px-2 py-1 h-7"
                                    >
                                      {isExpanded ? (
                                        <>
                                          <ChevronUp className="h-3 w-3 mr-1" />
                                          Сховати
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="h-3 w-3 mr-1" />
                                          Деталі
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <Badge className={`rounded-full border-0 font-bold text-xs px-2 py-1 max-w-[180px] truncate ${
                                    isPending ? 'bg-amber-200 text-amber-800' : 'bg-blue-100 text-blue-700'
                                  }`} title={bet.betType.split(' - ')[1] || bet.betType.split(' - ')[0]}>
                                    {bet.betType.split(' - ')[1] || bet.betType.split(' - ')[0]}
                                  </Badge>
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <Badge className={`rounded-full border-0 font-bold text-sm px-3 py-1 ${
                                isPending ? 'bg-amber-200 text-amber-800' : 'bg-cyan-100 text-cyan-700'
                              }`}>
                                {currency}
                              </Badge>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <DollarSign className={`h-4 w-4 ${isPending ? 'text-amber-600' : 'text-green-600'}`} />
                                <span className={`font-bold text-base ${isPending ? 'text-amber-900' : 'text-gray-900'}`}>{currencySymbol}{displayAmount}</span>
                              </div>
                              {currency === 'USD' && bet.exchangeRate && (
                                <div className="text-xs text-gray-500 mt-1">
                                  ≈ ₴{(displayAmount * bet.exchangeRate).toFixed(2)}
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <Badge className={`rounded-full border-0 font-bold text-base px-3 py-1 ${
                                isPending ? 'bg-amber-200 text-amber-800' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {bet.odds.toFixed(2)}
                              </Badge>
                            </td>
                            <td className="p-4 text-center">
                              {goalName ? (
                                <Badge className={`font-bold px-3 py-1 rounded-full border-0 text-xs max-w-[120px] truncate ${
                                  isPending ? 'bg-amber-200 text-amber-800' : 'bg-blue-100 text-blue-700'
                                }`} title={goalName}>
                                  <Flag className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{goalName}</span>
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-xs">—</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <Badge 
                                className={`rounded-full border-0 font-bold text-sm px-3 py-1 ${
                                  isWin ? 'bg-green-100 text-green-700' :
                                  isLoss ? 'bg-red-100 text-red-700' :
                                  'bg-amber-200 text-amber-800'
                                }`}
                              >
                                {isWin ? 'Виграш' : isLoss ? 'Програш' : 'Очікується'}
                              </Badge>
                            </td>
                            <td className="p-4 text-center">
                              {displayProfit !== undefined && displayProfit !== null ? (
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
                                      title="Виграш"
                                    >
                                      <CheckCircle className="h-5 w-5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateBetResult(bet, 'Loss')}
                                      className="h-10 w-10 p-0 rounded-full border-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                                      title="Програш"
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
                          
                          {isExpanded && parsedEvents.length > 0 && (
                            <tr key={`${betKey}-details`}>
                              <td colSpan={10} className="p-0">
                                <div className="p-4 bg-purple-50 border-l-4 border-l-purple-400">
                                  <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                                    <Zap className="h-5 w-5" />
                                    Деталі експрес-ставки від {bet.date}
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {parsedEvents.map((event, idx) => (
                                      <div key={idx} className="p-3 bg-white rounded-xl border-2 border-purple-200 shadow-sm">
                                        <div className="flex items-start gap-2 mb-2">
                                          <Badge className="rounded-full bg-purple-600 text-white border-0 text-xs px-2 py-1 font-bold flex-shrink-0">
                                            #{event.number}
                                          </Badge>
                                          <span className="font-bold text-gray-900 text-sm flex-1 break-words">
                                            {event.match}
                                          </span>
                                        </div>
                                        <div className="ml-8 space-y-1">
                                          <p className="text-gray-500 uppercase tracking-wide font-bold text-[10px]">
                                            {event.betType}
                                          </p>
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="font-bold text-purple-700 text-sm truncate" title={event.selection}>
                                              {event.selection}
                                            </span>
                                            <Badge className="text-xs bg-green-100 text-green-700 border-0 rounded-full px-2 py-1 font-bold flex-shrink-0">
                                              @{parseFloat(event.odds).toFixed(2)}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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