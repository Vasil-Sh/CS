import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { realGoogleSheetsService } from '@/lib/realGoogleSheets';
import { 
  Trophy, 
  AlertTriangle, 
  Clock, 
  Filter,
  ArrowUpDown,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Target,
  Zap
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
}

export default function BettingHistory() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [resultFilter, setResultFilter] = useState<'all' | 'Win' | 'Loss' | 'Pending'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'week' | 'month' | 'quarter'>('all');
  const [betTypeFilter, setBetTypeFilter] = useState<'all' | string>('all');
  
  const [sortBy, setSortBy] = useState<'date' | 'profit' | 'odds'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [expandedExpressBets, setExpandedExpressBets] = useState<Set<number>>(new Set());

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

  interface ParsedEvent {
    number: string;
    match: string;
    betType: string;
    selection: string;
    odds: string;
  }

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

  const toggleExpressBet = (index: number) => {
    setExpandedExpressBets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <Card className="border-0 shadow-xl rounded-3xl bg-gradient-to-br from-white to-gray-50 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Filter className="h-6 w-6" />
            Фільтри та сортування
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Результат:</label>
              <Select value={resultFilter} onValueChange={(value: 'all' | 'Win' | 'Loss' | 'Pending') => setResultFilter(value)}>
                <SelectTrigger className="rounded-xl border-2 border-gray-200 hover:border-indigo-300 transition-colors">
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
              <label className="text-sm font-bold text-gray-700 mb-2 block">Період:</label>
              <Select value={periodFilter} onValueChange={(value: 'all' | 'week' | 'month' | 'quarter') => setPeriodFilter(value)}>
                <SelectTrigger className="rounded-xl border-2 border-gray-200 hover:border-indigo-300 transition-colors">
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
            
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Тип ставки:</label>
              <Select value={betTypeFilter} onValueChange={setBetTypeFilter}>
                <SelectTrigger className="rounded-xl border-2 border-gray-200 hover:border-indigo-300 transition-colors">
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
              <label className="text-sm font-bold text-gray-700 mb-2 block">Сортування:</label>
              <Select value={sortBy} onValueChange={(value: 'date' | 'profit' | 'odds') => setSortBy(value)}>
                <SelectTrigger className="rounded-xl border-2 border-gray-200 hover:border-indigo-300 transition-colors">
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
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-xl rounded-3xl bg-gradient-to-br from-blue-50 to-cyan-50 overflow-hidden transform hover:scale-105 transition-transform">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Відфільтровано ставок</p>
                <p className="text-4xl font-black text-blue-900">{filteredBets.length}</p>
              </div>
              <div className="p-4 bg-blue-500 rounded-2xl shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-xl rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden transform hover:scale-105 transition-transform">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Win Rate</p>
                <p className="text-4xl font-black text-green-900">{winRate}%</p>
              </div>
              <div className="p-4 bg-green-500 rounded-2xl shadow-lg">
                <Trophy className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`border-0 shadow-xl rounded-3xl overflow-hidden transform hover:scale-105 transition-transform ${totalProfit >= 0 ? 'bg-gradient-to-br from-green-50 to-emerald-50' : 'bg-gradient-to-br from-red-50 to-orange-50'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>Профіт</p>
                <p className={`text-4xl font-black ${totalProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                  {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} ₴
                </p>
              </div>
              <div className={`p-4 rounded-2xl shadow-lg ${totalProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                {totalProfit >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-white" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-white" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Betting History Table */}
      <Card className="border-0 shadow-xl rounded-3xl bg-gradient-to-br from-white to-gray-50 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardTitle className="flex items-center justify-between text-xl font-bold">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6" />
              <span>Останні ставки</span>
            </div>
            <Badge className="rounded-full bg-white/20 text-white border-0 text-base px-4 py-1 font-bold">
              {sortedBets.length} активних
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Завантаження...</p>
            </div>
          ) : sortedBets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-4 cursor-pointer hover:bg-gray-100 transition-colors rounded-tl-xl" onClick={() => toggleSort('date')}>
                      <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-wider">
                        <Calendar className="h-4 w-4" />
                        Дата
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="text-left p-4">
                      <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-wider">
                        <Target className="h-4 w-4" />
                        Матч
                      </div>
                    </th>
                    <th className="text-left p-4 text-xs font-black text-gray-700 uppercase tracking-wider">Тип</th>
                    <th className="text-left p-4 text-xs font-black text-gray-700 uppercase tracking-wider">Валюта</th>
                    <th className="text-left p-4 text-xs font-black text-gray-700 uppercase tracking-wider">Сума</th>
                    <th className="text-left p-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('odds')}>
                      <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-wider">
                        Коеф.
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="text-left p-4 text-xs font-black text-gray-700 uppercase tracking-wider">Ціль</th>
                    <th className="text-left p-4 text-xs font-black text-gray-700 uppercase tracking-wider">Статус</th>
                    <th className="text-left p-4 cursor-pointer hover:bg-gray-100 transition-colors rounded-tr-xl" onClick={() => toggleSort('profit')}>
                      <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-wider">
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
                    const parsedEvents = isExpress ? parseExpressEvents(bet.betType) : [];
                    const isExpanded = expandedExpressBets.has(index);
                    const showExpandButton = isExpress && parsedEvents.length > 3;
                    const visibleEvents = isExpanded ? parsedEvents : parsedEvents.slice(0, 3);
                    
                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">{bet.date}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-2">
                            <div className="font-bold text-gray-900 text-base">{displayMatch}</div>
                            {!isExpress && (
                              <div className="text-xs text-gray-600">{bet.betType.split(' - ')[0]}</div>
                            )}
                            <Badge className="text-xs rounded-full bg-purple-100 text-purple-700 border-0 font-bold">
                              {bet.format}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-4">
                          {isExpress && parsedEvents.length > 0 ? (
                            <div className="space-y-2 max-w-md">
                              <Badge className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 font-bold mb-2 text-sm px-3 py-1">
                                Express {bet.format}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleExpressBet(index)}
                                className="w-full rounded-xl border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 font-bold text-purple-700"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-4 w-4 mr-1" />
                                    Сховати деталі
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-4 w-4 mr-1" />
                                    Деталі
                                  </>
                                )}
                              </Button>
                              {isExpanded && (
                                <div className="space-y-2 mt-2">
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
                        <td className="p-4">
                          <Badge className="rounded-full bg-cyan-100 text-cyan-700 border-0 font-bold text-sm px-3 py-1">
                            {bet.currency || 'UAH'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-bold text-gray-900 text-base">₴{bet.amount}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className="rounded-full bg-orange-100 text-orange-700 border-0 font-bold text-base px-3 py-1">
                            {bet.odds.toFixed(2)}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-gray-600 font-medium">{bet.goalId || '—'}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {bet.result === 'Win' ? (
                              <div className="p-2 bg-green-100 rounded-lg">
                                <Trophy className="h-5 w-5 text-green-600" />
                              </div>
                            ) : bet.result === 'Loss' ? (
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
                                bet.result === 'Win' 
                                  ? 'bg-green-100 text-green-700' 
                                  : bet.result === 'Loss' 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {bet.result === 'Win' ? 'Виграш' : bet.result === 'Loss' ? 'Програш' : 'Очікується'}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-4">
                          {bet.profit !== undefined && (
                            <div className="flex items-center gap-2">
                              {bet.profit >= 0 ? (
                                <div className="p-2 bg-green-100 rounded-lg">
                                  <TrendingUp className="h-5 w-5 text-green-600" />
                                </div>
                              ) : (
                                <div className="p-2 bg-red-100 rounded-lg">
                                  <TrendingDown className="h-5 w-5 text-red-600" />
                                </div>
                              )}
                              <span className={`font-black text-base ${bet.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {bet.profit >= 0 ? '+' : ''}{bet.profit.toFixed(2)} ₴
                              </span>
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
              <div className="p-6 bg-gray-100 rounded-3xl inline-block mb-4">
                <Calendar className="h-16 w-16 text-gray-400" />
              </div>
              <p className="text-gray-600 font-bold text-lg">Немає ставок за обраними фільтрами</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}