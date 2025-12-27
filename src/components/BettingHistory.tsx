import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import ExpressDetailsModal from '@/components/ExpressDetailsModal';
import { realGoogleSheetsService } from '@/lib/realGoogleSheets';
import { 
  Trophy, 
  AlertTriangle, 
  Clock, 
  Filter,
  ArrowUpDown,
  Calendar,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  BarChart3,
  Eye,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface Bet {
  date: string;
  match?: string;
  team1?: string;
  team2?: string;
  betType: string;
  format: string;
  amount: number;
  odds: number;
  result: 'Win' | 'Loss' | 'Pending';
  profit?: number;
  roi?: number;
  currency?: string;
  goalId?: string;
  originalAmount?: number;
  originalProfit?: number;
  exchangeRate?: number;
}

interface ParsedEvent {
  number: string;
  match: string;
  betType: string;
  selection: string;
  odds: string;
}

export default function BettingHistory() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [resultFilter, setResultFilter] = useState<'all' | 'Win' | 'Loss' | 'Pending'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'week' | 'month' | 'quarter'>('all');
  const [betTypeFilter, setBetTypeFilter] = useState<'all' | string>('all');
  
  const [sortBy, setSortBy] = useState<'date' | 'profit' | 'odds'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expressModalOpen, setExpressModalOpen] = useState(false);
  const [selectedExpressBet, setSelectedExpressBet] = useState<Bet | null>(null);
  const [selectedExpressEvents, setSelectedExpressEvents] = useState<ParsedEvent[]>([]);

  useEffect(() => {
    loadBets();
  }, []);

  const loadBets = async () => {
    try {
      setLoading(true);
      const data = await realGoogleSheetsService.fetchUSDTData();
      setBets(data);
    } catch (error) {
      console.error('Error loading bets:', error);
    } finally {
      setLoading(false);
    }
  };

  const betTypes = Array.from(new Set(bets.map(bet => bet.betType)));

  const filteredBets = bets.filter(bet => {
    if (resultFilter !== 'all' && bet.result !== resultFilter) return false;
    
    if (periodFilter !== 'all') {
      const betDate = new Date(bet.date);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - betDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (periodFilter === 'week' && diffDays > 7) return false;
      if (periodFilter === 'month' && diffDays > 30) return false;
      if (periodFilter === 'quarter' && diffDays > 90) return false;
    }
    
    if (betTypeFilter !== 'all' && bet.betType !== betTypeFilter) return false;
    
    return true;
  });

  const sortedBets = [...filteredBets].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'profit':
        comparison = (a.profit || 0) - (b.profit || 0);
        break;
      case 'odds':
        comparison = a.odds - b.odds;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleSort = (column: 'date' | 'profit' | 'odds') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const completedBets = filteredBets.filter(bet => bet.result !== 'Pending');
  const totalProfit = completedBets.reduce((sum, bet) => sum + (bet.profit || 0), 0);
  const winRate = completedBets.length > 0 
    ? (completedBets.filter(bet => bet.result === 'Win').length / completedBets.length * 100).toFixed(1)
    : '0';

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

  const handleExpressDetailsClick = (bet: Bet) => {
    const parsedEvents = parseExpressEvents(bet.betType);
    setSelectedExpressBet(bet);
    setSelectedExpressEvents(parsedEvents);
    setExpressModalOpen(true);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Filters Card with Basic/Advanced Split */}
        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Filter className="h-6 w-6 text-blue-600" />
                </div>
                Фільтри
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="rounded-xl"
              >
                {showAdvancedFilters ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Приховати розширені
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Розширені фільтри
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Basic Filters - Always Visible */}
            <div>
              <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                Основні фільтри
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Результат:</label>
                  <Select value={resultFilter} onValueChange={(value: 'all' | 'Win' | 'Loss' | 'Pending') => setResultFilter(value)}>
                    <SelectTrigger className="rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Всі</SelectItem>
                      <SelectItem value="Win">Виграш</SelectItem>
                      <SelectItem value="Loss">Програш</SelectItem>
                      <SelectItem value="Pending">Очікується</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Період:</label>
                  <Select value={periodFilter} onValueChange={(value: 'all' | 'week' | 'month' | 'quarter') => setPeriodFilter(value)}>
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
            </div>

            {/* Advanced Filters - Collapsible */}
            {showAdvancedFilters && (
              <div className="pt-4 border-t-2 border-gray-200">
                <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  Розширені фільтри
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Тип ставки:</label>
                    <Select value={betTypeFilter} onValueChange={setBetTypeFilter}>
                      <SelectTrigger className="rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Всі типи</SelectItem>
                        {betTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Сортування:</label>
                    <Select value={sortBy} onValueChange={(value: 'date' | 'profit' | 'odds') => setSortBy(value)}>
                      <SelectTrigger className="rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">За датою</SelectItem>
                        <SelectItem value="profit">За прибутком</SelectItem>
                        <SelectItem value="odds">За коефіцієнтом</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Відфільтровано ставок</p>
                  <p className="text-3xl font-semibold text-gray-900 tracking-tight">{filteredBets.length}</p>
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
                  <p className="text-3xl font-semibold text-green-600 tracking-tight">{winRate}%</p>
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
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Профіт</p>
                  <p className={`text-3xl font-semibold tracking-tight ${totalProfit >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                    {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} ₴
                  </p>
                </div>
                <div className={`p-3 rounded-2xl ${totalProfit >= 0 ? 'bg-orange-50' : 'bg-red-50'}`}>
                  {totalProfit >= 0 ? (
                    <TrendingUp className={`h-7 w-7 ${totalProfit >= 0 ? 'text-orange-600' : 'text-red-600'}`} />
                  ) : (
                    <TrendingDown className="h-7 w-7 text-red-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Betting History Table - Bordered Style with White Rows */}
        <Card className="border-0 shadow-xl rounded-3xl bg-gradient-to-br from-white to-gray-50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <CardTitle className="flex items-center justify-between text-xl font-bold text-gray-900">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <span>Історія ставок</span>
              </div>
              <Badge className="rounded-full bg-blue-100 text-blue-700 border-0 text-base px-4 py-1 font-bold">
                {sortedBets.length} записів
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Завантаження...</p>
              </div>
            ) : sortedBets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left p-4 w-32 cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-200" onClick={() => toggleSort('date')}>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Дата
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="text-left p-4 min-w-[200px] border-r border-gray-200">
                        <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Матч
                        </div>
                      </th>
                      <th className="text-left p-4 w-48 text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Тип</th>
                      <th className="text-left p-4 w-24 text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Валюта</th>
                      <th className="text-left p-4 w-28 text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Сума</th>
                      <th className="text-left p-4 w-24 cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-200" onClick={() => toggleSort('odds')}>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Коеф.
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="text-left p-4 w-32 text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Ціль</th>
                      <th className="text-left p-4 w-32 text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Статус</th>
                      <th className="text-left p-4 w-32 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('profit')}>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Профіт
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBets.map((bet, index) => {
                      const isExpress = bet.betType.includes('Експрес') || bet.format.includes('x');
                      const displayMatch = bet.match || `${bet.team1} vs ${bet.team2}`;
                      
                      return (
                        <tr 
                          key={index} 
                          className="bg-white border-b border-gray-200 shadow-sm hover:shadow-md transition-all hover:bg-gray-50"
                        >
                          <td className="p-4 border-r border-gray-200">
                            <span className="text-sm font-bold text-gray-900">{bet.date}</span>
                          </td>
                          <td className="p-4 border-r border-gray-200">
                            <div className="space-y-2">
                              <div className="font-bold text-base truncate text-gray-900" title={displayMatch}>{displayMatch}</div>
                              {!isExpress && (
                                <div className="text-xs truncate text-gray-600" title={bet.betType.split(' - ')[0]}>{bet.betType.split(' - ')[0]}</div>
                              )}
                              <Badge className="text-xs rounded-full bg-purple-100 text-purple-700 border-0 font-bold">
                                {bet.format}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4 border-r border-gray-200">
                            {isExpress ? (
                              <div className="flex items-center gap-2">
                                <Badge className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 font-bold text-sm px-3 py-1 whitespace-nowrap">
                                  Express {bet.format}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleExpressDetailsClick(bet)}
                                  className="rounded-xl border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 font-bold text-purple-700 text-xs px-2 py-1 h-7 whitespace-nowrap"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Показати
                                </Button>
                              </div>
                            ) : (
                              <Badge className="rounded-full bg-blue-100 text-blue-700 border-0 font-bold text-xs px-2 py-1 max-w-[180px] truncate" title={bet.betType.split(' - ')[1] || bet.betType.split(' - ')[0]}>
                                {bet.betType.split(' - ')[1] || bet.betType.split(' - ')[0]}
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 border-r border-gray-200">
                            <Badge className="rounded-full bg-cyan-100 text-cyan-700 border-0 font-bold text-sm px-3 py-1">
                              {bet.currency || 'UAH'}
                            </Badge>
                          </td>
                          <td className="p-4 border-r border-gray-200">
                            <span className="font-bold text-base text-gray-900">₴{bet.amount}</span>
                          </td>
                          <td className="p-4 border-r border-gray-200">
                            <Badge className="rounded-full bg-orange-100 text-orange-700 border-0 font-bold text-base px-3 py-1">
                              {bet.odds.toFixed(2)}
                            </Badge>
                          </td>
                          <td className="p-4 border-r border-gray-200">
                            <span className="font-medium text-xs text-gray-600 truncate max-w-[120px] block" title={bet.goalId || '—'}>{bet.goalId || '—'}</span>
                          </td>
                          <td className="p-4 border-r border-gray-200">
                            <Badge 
                              className={`rounded-full border-0 font-bold text-sm px-3 py-1 ${
                                bet.result === 'Win' 
                                  ? 'bg-green-100 text-green-700' 
                                  : bet.result === 'Loss' 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-amber-200 text-amber-800'
                              }`}
                            >
                              {bet.result === 'Win' ? 'Виграш' : bet.result === 'Loss' ? 'Програш' : 'Очікується'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {bet.profit !== undefined && (
                              <span className={`font-black text-base ${bet.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {bet.profit >= 0 ? '+' : ''}{bet.profit.toFixed(2)} ₴
                              </span>
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
                <div className="p-6 bg-gray-100 rounded-3xl inline-block mb-4">
                  <Calendar className="h-16 w-16 text-gray-400" />
                </div>
                <p className="text-gray-600 font-bold text-lg">Немає ставок за обраними фільтрами</p>
              </div>
            )}
          </CardContent>
        </Card>

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
      </div>
    </TooltipProvider>
  );
}