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
}

export default function BettingHistory() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [resultFilter, setResultFilter] = useState<'all' | 'Win' | 'Loss' | 'Pending'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'week' | 'month' | 'quarter'>('all');
  const [betTypeFilter, setBetTypeFilter] = useState<'all' | string>('all');
  
  const [sortBy, setSortBy] = useState<'date' | 'profit' | 'odds'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  // Функція для парсингу експрес-подій
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

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Filter className="h-5 w-5" />
            Фільтри та сортування
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Результат:</label>
              <Select value={resultFilter} onValueChange={(value: 'all' | 'Win' | 'Loss' | 'Pending') => setResultFilter(value)}>
                <SelectTrigger className="mt-1 rounded-xl">
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
              <label className="text-sm font-medium text-gray-700">Період:</label>
              <Select value={periodFilter} onValueChange={(value: 'all' | 'week' | 'month' | 'quarter') => setPeriodFilter(value)}>
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
            
            <div>
              <label className="text-sm font-medium text-gray-700">Тип ставки:</label>
              <Select value={betTypeFilter} onValueChange={setBetTypeFilter}>
                <SelectTrigger className="mt-1 rounded-xl">
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
              <label className="text-sm font-medium text-gray-700">Сортування:</label>
              <Select value={sortBy} onValueChange={(value: 'date' | 'profit' | 'odds') => setSortBy(value)}>
                <SelectTrigger className="mt-1 rounded-xl">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Відфільтровано ставок</p>
                <p className="text-2xl font-semibold text-gray-900 tracking-tight">{filteredBets.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Win Rate</p>
                <p className="text-2xl font-semibold text-green-600 tracking-tight">{winRate}%</p>
              </div>
              <div className="p-3 bg-green-50 rounded-2xl">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Профіт</p>
                <p className={`text-2xl font-semibold tracking-tight ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} ₴
                </p>
              </div>
              <div className={`p-3 rounded-2xl ${totalProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <DollarSign className={`h-6 w-6 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-900">
            <span>Історія ставок</span>
            <Badge className="rounded-full bg-blue-100 text-blue-700 border-0">{sortedBets.length} записів</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Завантаження...</p>
            </div>
          ) : sortedBets.length > 0 ? (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50/80 backdrop-blur-sm z-10">
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 cursor-pointer hover:bg-gray-50/50 transition-colors rounded-xl" onClick={() => toggleSort('date')}>
                      <div className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Дата
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Матч</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Тип</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Сума</th>
                    <th className="text-left p-3 cursor-pointer hover:bg-gray-50/50 transition-colors rounded-xl" onClick={() => toggleSort('odds')}>
                      <div className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Коефіцієнт
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Результат</th>
                    <th className="text-left p-3 cursor-pointer hover:bg-gray-50/50 transition-colors rounded-xl" onClick={() => toggleSort('profit')}>
                      <div className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider">
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
                    
                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="p-3 text-sm text-gray-900">{bet.date}</td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{displayMatch}</div>
                          <Badge className="text-xs mt-1 rounded-full bg-gray-100 text-gray-700 border-0">
                            {bet.format}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {isExpress && parsedEvents.length > 0 ? (
                            <div className="space-y-2 max-w-md">
                              <Badge className="rounded-full bg-purple-100 text-purple-700 border-0 mb-2">
                                Експрес {bet.format}
                              </Badge>
                              {parsedEvents.map((event, idx) => (
                                <div key={idx} className="p-2 bg-white rounded-lg border border-gray-200 text-xs">
                                  <div className="flex items-start gap-2 mb-1">
                                    <Badge className="rounded-full bg-purple-600 text-white border-0 text-xs">
                                      #{event.number}
                                    </Badge>
                                    <span className="font-semibold text-gray-900 leading-tight flex-1">
                                      {event.match}
                                    </span>
                                  </div>
                                  <div className="ml-7 space-y-0.5">
                                    <p className="text-gray-500 uppercase tracking-wide font-medium">
                                      {event.betType}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-purple-700">
                                        {event.selection}
                                      </span>
                                      <Badge className="text-xs bg-purple-100 text-purple-700 border-0 rounded-full">
                                        Коеф {event.odds}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <Badge className="rounded-full bg-blue-100 text-blue-700 border-0">
                              {bet.betType.split(' - ')[0]}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 font-medium text-gray-900">₴{bet.amount}</td>
                        <td className="p-3 font-medium text-gray-900">{bet.odds.toFixed(2)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {bet.result === 'Win' ? (
                              <Trophy className="h-4 w-4 text-green-600" />
                            ) : bet.result === 'Loss' ? (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-blue-600" />
                            )}
                            <Badge 
                              className={`rounded-full border-0 ${
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
                        <td className="p-3">
                          {bet.profit !== undefined && (
                            <div className="flex items-center gap-1">
                              {bet.profit >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                              <span className={`font-medium ${bet.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Немає ставок за обраними фільтрами</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}