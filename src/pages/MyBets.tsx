import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CS2BettingForm from '@/components/CS2BettingForm';
import BettingHistory from '@/components/BettingHistory';
import StrategyOverview from '@/components/StrategyOverview';
import BetShareModal from '@/components/BetShareModal';
import ExpressDetailsModal from '@/components/ExpressDetailsModal';
import BetDetailsModal from '@/components/BetDetailsModal';
import InitialBankModal from '@/components/InitialBankModal';
import { realGoogleSheetsService } from '@/lib/realGoogleSheets';
import { UserDataService } from '@/lib/userDataService';
import { BankrollService } from '@/lib/bankrollService';
import { 
  TrendingUp, DollarSign, Target, BarChart3, Calendar, Trophy, 
  AlertTriangle, CheckCircle, XCircle, Clock, Trash2, Share2, 
  Flag, Wallet, Edit, Zap, LucideIcon, Eye, ChevronDown, ChevronUp,
  Plus, History, LineChart
} from 'lucide-react';
import { toast } from 'sonner';
import type { Bet } from '@/types/betting';

interface Goal {
  id: string;
  name: string;
  type: 'amount' | 'ladder' | 'roi' | 'winrate';
  status: 'active' | 'completed' | 'failed';
}

interface User {
  telegram: string;
  username: string;
  isAdmin?: boolean;
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
  <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[#C4C2B8] transition-all duration-300">
    <CardHeader className="pb-4 pt-7 px-7">
      <CardTitle className="text-sm font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2">
        <Icon className="h-5 w-5" strokeWidth={1.5} />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="px-7 pb-7">
      <div className={`text-6xl font-light tracking-tight ${colorClass}`}>{value}</div>
    </CardContent>
  </Card>
);

export default function MyBets() {
  const currentUser = localStorage.getItem('username') || '';
  
  const [stats, setStats] = useState<BetStats>(() => 
    UserDataService.getUserData(currentUser, 'mybets_stats', DEFAULT_STATS)
  );
  const [recentBets, setRecentBets] = useState<Bet[]>(() => 
    UserDataService.getUserData(currentUser, 'mybets_data', [])
  );
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [expressModalOpen, setExpressModalOpen] = useState(false);
  const [betDetailsModalOpen, setBetDetailsModalOpen] = useState(false);
  const [selectedExpressBet, setSelectedExpressBet] = useState<Bet | null>(null);
  const [selectedExpressEvents, setSelectedExpressEvents] = useState<ParsedEvent[]>([]);
  const [selectedDetailsBet, setSelectedDetailsBet] = useState<Bet | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);
  const [isTableExpanded, setIsTableExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('add');

  const bankrollStats = useMemo(() => 
    BankrollService.getBankrollStats(currentUser, recentBets),
    [currentUser, recentBets]
  );
  
  const isBankrollInitialized = useMemo(() => 
    BankrollService.isInitialized(currentUser),
    [currentUser]
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0 && currentUser) {
      checkAdminStatus();
    }
  }, [users, currentUser]);

  const fetchUsers = async () => {
    try {
      const SHEET_ID = '1IhAUYQKcPjXetOGxCu-_YXxrj_kXt0QxKJCcGqPzZdo';
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
      
      const response = await fetch(url);
      const text = await response.text();
      
      const rows = text.split('\n').slice(1);
      const parsedUsers: User[] = rows
        .filter(row => row.trim())
        .map(row => {
          const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (!matches || matches.length < 7) return null;
          
          const telegram = matches[0].replace(/"/g, '').trim();
          const username = matches[1].replace(/"/g, '').trim();
          const isAdminStr = matches[6]?.replace(/"/g, '').trim().toLowerCase();
          
          return {
            telegram,
            username,
            isAdmin: isAdminStr === 'true' || isAdminStr === '1' || isAdminStr === 'yes' || isAdminStr === 'так'
          };
        })
        .filter((user): user is User => user !== null);
      
      console.log('Fetched users:', parsedUsers);
      setUsers(parsedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const checkAdminStatus = () => {
    console.log('Checking admin status for:', currentUser);
    console.log('Available users:', users);
    
    const user = users.find(u => u.username.toLowerCase() === currentUser.toLowerCase());
    console.log('Found user:', user);
    console.log('Is admin:', user?.isAdmin);
    
    setIsAdmin(user?.isAdmin || false);
  };

  useEffect(() => {
    if (currentUser) {
      UserDataService.checkAndResetDailyBets(currentUser);
    }
  }, [currentUser]);

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
    if (window.confirm('Ви впевнені, що хочете очистити всі дані? Це видалить всі записи, статистику та історію. Ця дія незворотна.')) {
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
      toast.success(`Запис позначено як ${result === 'Win' ? 'виграшний' : 'програшний'}`);
      
      loadStats();
      loadRecentBets();
    } catch (error) {
      toast.error('Помилка при оновленні результату запису');
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

  const handleExpressDetailsClick = useCallback((bet: Bet) => {
    const parsedEvents = parseExpressEvents(bet.betType);
    setSelectedExpressBet(bet);
    setSelectedExpressEvents(parsedEvents);
    setExpressModalOpen(true);
  }, [parseExpressEvents]);

  const handleBetDetailsClick = useCallback((bet: Bet) => {
    setSelectedDetailsBet(bet);
    setBetDetailsModalOpen(true);
  }, []);

  const tabs = [
    { id: 'add', label: 'Додати запис', icon: Plus },
    { id: 'history', label: 'Історія', icon: History },
    { id: 'strategies', label: 'Стратегії', icon: LineChart },
  ];

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
        {/* Enhanced Header with background */}
        <div className="bg-white/60 backdrop-blur-sm rounded-[40px] p-8 border-2 border-[#E8E6DC] shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-6xl font-light text-black tracking-tight flex items-center gap-5">
                <div className="p-4 bg-[#F4E157] rounded-[36px] shadow-[0_12px_32px_rgba(244,225,87,0.4)]">
                  <Zap className="h-10 w-10 text-black" strokeWidth={1.5} />
                </div>
                Журнал прогнозів
              </h1>
              <p className="text-[#6B6B6B] mt-4 text-xl font-light ml-[88px]">
                Управління записами та аналіз результатів
              </p>
            </div>
            
            <Button 
              onClick={clearRecentBets} 
              variant="outline"
              className="rounded-[24px] border-2 border-[#FFCDD2] hover:bg-[#FFE8E8] hover:border-[#FFAB91] bg-white font-normal h-16 px-7 text-[#D32F2F] transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-base"
            >
              <Trash2 className="mr-2.5 h-5 w-5" strokeWidth={1.5} />
              Очистити всі дані
            </Button>
          </div>
        </div>

        {/* Quick Stats - Поточний банк ПЕРШИЙ */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 1. Поточний банк - ПЕРША КАРТКА з ЖОВТОЮ іконкою Edit */}
          <Card 
            className="border-2 border-[#F4E157] shadow-[0_8px_24px_rgba(244,225,87,0.2)] rounded-[32px] bg-white overflow-hidden cursor-pointer hover:shadow-[0_12px_32px_rgba(244,225,87,0.3)] hover:border-[#E8D54A] transition-all duration-300 group"
            onClick={handleBankCardClick}
          >
            <CardHeader className="pb-4 pt-7 px-7">
              <CardTitle className="text-sm font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" strokeWidth={1.5} />
                  Бюджет аналізу
                </div>
                <div className="p-2 bg-[#F4E157] rounded-[16px] shadow-[0_2px_8px_rgba(244,225,87,0.3)] group-hover:shadow-[0_4px_12px_rgba(244,225,87,0.5)] transition-all">
                  <Edit className="h-5 w-5 text-black" strokeWidth={2} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              {isBankrollInitialized ? (
                <div className="text-6xl font-light text-black tracking-tight">
                  {bankrollStats.currentBank.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴
                </div>
              ) : (
                <div className="text-2xl font-light text-[#8B8B8B]">Не встановлено</div>
              )}
            </CardContent>
          </Card>

          <StatCard title="Всього записів" value={stats.totalBets} icon={BarChart3} colorClass="text-black" bgClass="bg-blue-50" />
          <StatCard 
            title="Профіт" 
            value={`${stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(2)} ₴`} 
            icon={DollarSign} 
            colorClass={stats.totalProfit >= 0 ? 'text-[#4CAF50]' : 'text-[#D32F2F]'} 
            bgClass="bg-green-50" 
          />
          <StatCard title="Win Rate" value={`${stats.winRate}%`} icon={Target} colorClass="text-[#4CAF50]" bgClass="bg-purple-50" />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <StatCard title="Активні" value={activeBets.length} icon={Clock} colorClass="text-[#2196F3]" bgClass="bg-blue-50" />
          <StatCard title="Виграші" value={winningBets.length} icon={Trophy} colorClass="text-[#4CAF50]" bgClass="bg-green-50" />
          <StatCard title="Програші" value={losingBets.length} icon={AlertTriangle} colorClass="text-[#D32F2F]" bgClass="bg-red-50" />
          <StatCard 
            title="Середній ROI" 
            value={`${stats.averageROI >= 0 ? '+' : ''}${stats.averageROI}%`} 
            icon={TrendingUp} 
            colorClass={stats.averageROI >= 0 ? 'text-[#FF9800]' : 'text-[#D32F2F]'} 
            bgClass="bg-orange-50" 
          />
        </div>

        {/* Recent Bets Table - Collapsible */}
        <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
          <CardHeader 
            className="bg-[#F5F5F3] border-b-2 border-[#E8E6DC] p-8 cursor-pointer hover:bg-[#FAFAF8] transition-colors"
            onClick={() => setIsTableExpanded(!isTableExpanded)}
          >
            <CardTitle className="flex items-center justify-between text-3xl font-light text-black">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_2px_8px_rgba(244,225,87,0.3)]">
                  <Calendar className="h-6 w-6 text-black" strokeWidth={1.5} />
                </div>
                <span>Останні записи</span>
              </div>
              <div className="flex items-center gap-3">
                {activeBets.length > 0 && (
                  <Badge className="rounded-[20px] bg-[#FFF9C4] text-[#F57F17] border-2 border-[#FFF59D] text-base px-5 py-2 font-normal">
                    <Clock className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
                    {activeBets.length} активних
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-[16px] hover:bg-[#F5F5F3] text-black"
                >
                  {isTableExpanded ? (
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
            </CardTitle>
          </CardHeader>
          
          {isTableExpanded && (
            <CardContent className="p-8">
              {sortedBets.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-[#E8E6DC]">
                          <th className="text-left p-4 w-28 border-r border-[#E8E6DC]">
                            <div className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider">Дата</div>
                          </th>
                          <th className="text-left p-4 min-w-[200px] border-r border-[#E8E6DC]">
                            <div className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider">Матч</div>
                          </th>
                          <th className="text-center p-4 w-40 border-r border-[#E8E6DC]">
                            <div className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider">Тип</div>
                          </th>
                          <th className="text-center p-4 w-24 border-r border-[#E8E6DC]">
                            <div className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider">Валюта</div>
                          </th>
                          <th className="text-center p-4 w-28 border-r border-[#E8E6DC]">
                            <div className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider">Сума</div>
                          </th>
                          <th className="text-center p-4 w-24 border-r border-[#E8E6DC]">
                            <div className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider">Коеф.</div>
                          </th>
                          <th className="text-center p-4 w-32 border-r border-[#E8E6DC]">
                            <div className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider">Профіт</div>
                          </th>
                          <th className="text-center p-4 w-32 border-r border-[#E8E6DC]">
                            <div className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider">Ціль</div>
                          </th>
                          <th className="text-center p-4 w-32 border-r border-[#E8E6DC]">
                            <div className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider">Статус</div>
                          </th>
                          <th className="text-center p-4 w-32">
                            <div className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider">Керування</div>
                          </th>
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
                          
                          return (
                            <tr 
                              key={betKey}
                              className="bg-white border-b border-[#E8E6DC] hover:bg-[#FAFAF8] transition-all duration-200"
                            >
                              <td className="p-4 border-r border-[#E8E6DC]">
                                <span className="text-sm font-normal text-black">{bet.date}</span>
                              </td>
                              <td className="p-4 border-r border-[#E8E6DC]">
                                <div className="min-w-0">
                                  <div className="font-normal text-base truncate text-black" title={bet.match || `${bet.team1} vs ${bet.team2}`}>
                                    {bet.match || `${bet.team1} vs ${bet.team2}`}
                                  </div>
                                  {!isExpress && (
                                    <div className="text-xs mt-1 truncate text-[#6B6B6B] font-light" title={bet.betType}>{bet.betType}</div>
                                  )}
                                  <Badge className="text-xs rounded-[12px] bg-[#E1BEE7] text-[#7B1FA2] border-0 font-normal mt-1">
                                    {bet.format}
                                  </Badge>
                                </div>
                              </td>
                              <td className="p-4 border-r border-[#E8E6DC]">
                                {isExpress ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <Badge className="rounded-[16px] bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 font-normal text-sm px-3 py-1 whitespace-nowrap">
                                      Express {expressEventCount}×
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleExpressDetailsClick(bet)}
                                      className="rounded-[16px] border-2 border-[#D4D2C8] hover:bg-[#F5F5F3] hover:border-[#C4C2B8] font-normal text-black text-xs px-2.5 py-1 h-7"
                                    >
                                      Показати
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex justify-center">
                                    <Badge className="rounded-[12px] bg-[#BBDEFB] text-[#1976D2] border-0 font-normal text-xs px-2.5 py-1 max-w-[140px] truncate" title={bet.betType.split(' - ')[1] || bet.betType.split(' - ')[0]}>
                                      {bet.betType.split(' - ')[1] || bet.betType.split(' - ')[0]}
                                    </Badge>
                                  </div>
                                )}
                              </td>
                              <td className="p-4 text-center border-r border-[#E8E6DC]">
                                <Badge className="rounded-[12px] bg-[#B2EBF2] text-[#00838F] border-0 font-normal text-sm px-3 py-1">
                                  {currency}
                                </Badge>
                              </td>
                              <td className="p-4 text-center border-r border-[#E8E6DC]">
                                <span className="font-normal text-base text-black">{currencySymbol}{displayAmount}</span>
                                {currency === 'USD' && bet.exchangeRate && (
                                  <div className="text-xs text-[#6B6B6B] font-light mt-1">
                                    ≈ ₴{(displayAmount * bet.exchangeRate).toFixed(2)}
                                  </div>
                                )}
                              </td>
                              <td className="p-4 text-center border-r border-[#E8E6DC]">
                                <Badge className="rounded-[12px] bg-[#FFE0B2] text-[#E65100] border-0 font-normal text-base px-3 py-1">
                                  {bet.odds.toFixed(2)}
                                </Badge>
                              </td>
                              <td className="p-4 text-center border-r border-[#E8E6DC]">
                                {displayProfit !== undefined && displayProfit !== null ? (
                                  <div>
                                    <span className={`font-normal text-base ${displayProfit >= 0 ? 'text-[#4CAF50]' : 'text-[#D32F2F]'}`}>
                                      {displayProfit >= 0 ? '+' : ''}{displayProfit.toFixed(2)} {currencySymbol}
                                    </span>
                                    {currency === 'USD' && bet.exchangeRate && bet.profit !== undefined && (
                                      <div className="text-xs text-[#6B6B6B] font-light mt-1">
                                        ≈ {bet.profit >= 0 ? '+' : ''}{bet.profit.toFixed(2)} ₴
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[#8B8B8B]">—</span>
                                )}
                              </td>
                              <td className="p-4 text-center border-r border-[#E8E6DC]">
                                {goalName ? (
                                  <Badge className="font-normal px-3 py-1 rounded-[12px] bg-[#BBDEFB] text-[#1976D2] border-0 text-xs max-w-[120px] truncate" title={goalName}>
                                    <Flag className="h-3 w-3 mr-1 flex-shrink-0" strokeWidth={1.5} />
                                    <span className="truncate">{goalName}</span>
                                  </Badge>
                                ) : (
                                  <span className="text-[#8B8B8B] text-xs">—</span>
                                )}
                              </td>
                              <td className="p-4 text-center border-r border-[#E8E6DC]">
                                <Badge 
                                  className={`rounded-[12px] border-0 font-normal text-sm px-3 py-1 ${
                                    isWin ? 'bg-[#C8E6C9] text-[#2E7D32]' :
                                    isLoss ? 'bg-[#FFCDD2] text-[#C62828]' :
                                    'bg-[#FFF9C4] text-[#F57F17]'
                                  }`}
                                >
                                  {isWin ? 'Виграш' : isLoss ? 'Програш' : 'Очікується'}
                                </Badge>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex gap-2 justify-center">
                                  {isPending && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateBetResult(bet, 'Win')}
                                        className="h-10 w-10 p-0 rounded-[16px] border-2 border-[#A5D6A7] text-[#4CAF50] hover:bg-[#E8F5E9] hover:text-[#2E7D32]"
                                        title="Виграш"
                                      >
                                        <CheckCircle className="h-5 w-5" strokeWidth={1.5} />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateBetResult(bet, 'Loss')}
                                        className="h-10 w-10 p-0 rounded-[16px] border-2 border-[#FFCDD2] text-[#D32F2F] hover:bg-[#FFE8E8] hover:text-[#C62828]"
                                        title="Програш"
                                      >
                                        <XCircle className="h-5 w-5" strokeWidth={1.5} />
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleShareBet(bet)}
                                    className="h-10 w-10 p-0 rounded-[16px] border-2 border-[#90CAF9] text-[#1976D2] hover:bg-[#E3F2FD] hover:text-[#0D47A1]"
                                    title="Поділитися"
                                  >
                                    <Share2 className="h-5 w-5" strokeWidth={1.5} />
                                  </Button>
                                  {isAdmin && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleBetDetailsClick(bet)}
                                      className="h-10 w-10 p-0 rounded-[16px] border-2 border-[#B39DDB] text-[#5E35B1] hover:bg-[#EDE7F6] hover:text-[#4527A0]"
                                      title="Деталі для Telegram (тільки для адмінів)"
                                    >
                                      <Eye className="h-5 w-5" strokeWidth={1.5} />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="p-8 bg-[#F5F5F3] rounded-[32px] inline-block mb-6">
                    <Calendar className="h-16 w-16 text-[#8B8B8B]" strokeWidth={1.5} />
                  </div>
                  <p className="text-black font-normal text-lg">Поки що немає записів</p>
                  <p className="text-sm text-[#6B6B6B] font-light mt-2">Додайте свій перший запис, щоб почати відстеження</p>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Custom Tabs Navigation - Same style as Analytics */}
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
                        ? 'bg-[#F4E157] text-black font-normal shadow-[0_4px_16px_rgba(244,225,87,0.4)]' 
                        : 'bg-transparent text-[#6B6B6B] hover:bg-[#F5F5F3]'
                      }
                    `}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'add' && <CS2BettingForm onRecordAdded={handleRecordAdded} />}
            {activeTab === 'history' && <BettingHistory />}
            {activeTab === 'strategies' && <StrategyOverview />}
          </div>
        </div>

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

        {selectedExpressBet && (
          <ExpressDetailsModal
            bet={selectedExpressBet}
            open={expressModalOpen}
            onClose={() => {
              setExpressModalOpen(false);
              setSelectedExpressBet(null);
              setSelectedExpressEvents([]);
            }}
            parsedEvents={selectedExpressEvents}
          />
        )}

        {selectedDetailsBet && (
          <BetDetailsModal
            bet={selectedDetailsBet}
            open={betDetailsModalOpen}
            onClose={() => {
              setBetDetailsModalOpen(false);
              setSelectedDetailsBet(null);
            }}
          />
        )}
      </div>
    </div>
  );
}