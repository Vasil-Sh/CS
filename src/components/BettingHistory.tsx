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
  
  // Filters
  const [resultFilter, setResultFilter] = useState<'all' | 'Win' | 'Loss' | 'Pending'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'week' | 'month' | 'quarter'>('all');
  const [betTypeFilter, setBetTypeFilter] = useState<'all' | string>('all');
  
  // Sorting
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

  // Get unique bet types
  const betTypes = Array.from(new Set(bets.map(bet => bet.betType)));

  // Apply filters
  const filteredBets = bets.filter(bet => {
    // Result filter
    if (resultFilter !== 'all' && bet.result !== resultFilter) return false;
    
    // Period filter
    if (periodFilter !== 'all') {
      const betDate = new Date(bet.date);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - betDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (periodFilter === 'week' && diffDays > 7) return false;
      if (periodFilter === 'month' && diffDays > 30) return false;
      if (periodFilter === 'quarter' && diffDays > 90) return false;
    }
    
    // Bet type filter
    if (betTypeFilter !== 'all' && bet.betType !== betTypeFilter) return false;
    
    return true;
  });

  // Apply sorting
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

  // Calculate stats for filtered bets
  const completedBets = filteredBets.filter(bet => bet.result !== 'Pending');
  const totalProfit = completedBets.reduce((sum, bet) => sum + (bet.profit || 0), 0);
  const winRate = completedBets.length > 0 
    ? (completedBets.filter(bet => bet.result === 'Win').length / completedBets.length * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фільтри та сортування
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Результат:</label>
              <Select value={resultFilter} onValueChange={(value: 'all' | 'Win' | 'Loss' | 'Pending') => setResultFilter(value)}>
                <SelectTrigger className="mt-1">
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
              <label className="text-sm font-medium">Період:</label>
              <Select value={periodFilter} onValueChange={(value: 'all' | 'week' | 'month' | 'quarter') => setPeriodFilter(value)}>
                <SelectTrigger className="mt-1">
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
              <label className="text-sm font-medium">Тип ставки:</label>
              <Select value={betTypeFilter} onValueChange={setBetTypeFilter}>
                <SelectTrigger className="mt-1">
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
              <label className="text-sm font-medium">Сортування:</label>
              <Select value={sortBy} onValueChange={(value: 'date' | 'profit' | 'odds') => setSortBy(value)}>
                <SelectTrigger className="mt-1">
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

      {/* Filtered Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Відфільтровано ставок</p>
                <p className="text-2xl font-bold">{filteredBets.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold text-green-600">{winRate}%</p>
              </div>
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Профіт</p>
                <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} ₴
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Історія ставок</span>
            <Badge variant="secondary">{sortedBets.length} записів</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Завантаження...</p>
            </div>
          ) : sortedBets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 cursor-pointer hover:bg-gray-50" onClick={() => toggleSort('date')}>
                      <div className="flex items-center gap-1">
                        Дата
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="text-left p-3">Матч</th>
                    <th className="text-left p-3">Тип</th>
                    <th className="text-left p-3">Сума</th>
                    <th className="text-left p-3 cursor-pointer hover:bg-gray-50" onClick={() => toggleSort('odds')}>
                      <div className="flex items-center gap-1">
                        Коефіцієнт
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="text-left p-3">Результат</th>
                    <th className="text-left p-3 cursor-pointer hover:bg-gray-50" onClick={() => toggleSort('profit')}>
                      <div className="flex items-center gap-1">
                        Профіт
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBets.map((bet, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-sm">{bet.date}</td>
                      <td className="p-3">
                        <div className="font-medium">{bet.match || `${bet.team1} vs ${bet.team2}`}</div>
                        <Badge variant="outline" className="text-xs mt-1">{bet.format}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary">{bet.betType}</Badge>
                      </td>
                      <td className="p-3 font-medium">₴{bet.amount}</td>
                      <td className="p-3 font-medium">{bet.odds}</td>
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
                            variant={bet.result === 'Win' ? 'default' : bet.result === 'Loss' ? 'destructive' : 'secondary'}
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
                  ))}
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