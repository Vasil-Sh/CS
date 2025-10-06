import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, TrendingUp, TrendingDown, Filter, RefreshCw, Search, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { realGoogleSheetsService } from '@/lib/realGoogleSheets';
import { toast } from 'sonner';

interface BettingHistoryProps {
  refreshTrigger?: number;
}

export default function BettingHistory({ refreshTrigger }: BettingHistoryProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  
  // Фільтри
  const [filters, setFilters] = useState({
    search: '',
    result: 'all',
    dateFrom: '',
    dateTo: '',
    betType: 'all'
  });

  useEffect(() => {
    loadRecords();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [records, filters]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await realGoogleSheetsService.fetchUSDTData();
      setRecords(data.reverse()); // Показуємо найновіші спочатку
    } catch (error) {
      console.error('Error loading records:', error);
      toast.error('Помилка при завантаженні історії ставок');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...records];

    // Пошук по назві матчу
    if (filters.search) {
      filtered = filtered.filter(record => 
        record.match?.toLowerCase().includes(filters.search.toLowerCase()) ||
        record.team1?.toLowerCase().includes(filters.search.toLowerCase()) ||
        record.team2?.toLowerCase().includes(filters.search.toLowerCase()) ||
        record.tournament?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Фільтр по результату
    if (filters.result !== 'all') {
      filtered = filtered.filter(record => {
        if (filters.result === 'pending') return record.result === 'Pending';
        if (filters.result === 'win') return record.result === 'Win';
        if (filters.result === 'loss') return record.result === 'Loss';
        return true;
      });
    }

    // Фільтр по типу ставки
    if (filters.betType !== 'all') {
      filtered = filtered.filter(record => 
        record.betType?.toLowerCase().includes(filters.betType.toLowerCase())
      );
    }

    // Фільтр по датах
    if (filters.dateFrom) {
      filtered = filtered.filter(record => 
        new Date(record.date) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(record => 
        new Date(record.date) <= new Date(filters.dateTo)
      );
    }

    setFilteredRecords(filtered);
  };

  const updateBetResult = async (betIndex: number, result: 'Win' | 'Loss') => {
    try {
      const bet = records[betIndex];
      const profit = result === 'Win' ? (bet.odds - 1) * bet.amount : -bet.amount;
      const roi = (profit / bet.amount) * 100;

      await realGoogleSheetsService.updateBetResult(bet, result, profit, roi);
      
      toast.success(`Ставка позначена як ${result === 'Win' ? 'виграшна' : 'програшна'}`);
      
      // Перезавантажуємо дані
      loadRecords();
    } catch (error) {
      toast.error('Помилка при оновленні результату ставки');
      console.error(error);
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'Win': return 'bg-green-100 text-green-800';
      case 'Loss': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultText = (result: string) => {
    switch (result) {
      case 'Win': return 'Виграш';
      case 'Loss': return 'Програш';
      case 'Pending': return 'Очікується';
      default: return result;
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      result: 'all',
      dateFrom: '',
      dateTo: '',
      betType: 'all'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Завантаження історії ставок...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Історія ставок
            </span>
            <Button onClick={loadRecords} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Оновити
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Фільтри */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Фільтри</span>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Очистити
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Пошук по матчу..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="pl-10"
                />
              </div>
              
              <Select value={filters.result} onValueChange={(value) => setFilters({...filters, result: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Результат" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі результати</SelectItem>
                  <SelectItem value="pending">Очікується</SelectItem>
                  <SelectItem value="win">Виграш</SelectItem>
                  <SelectItem value="loss">Програш</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.betType} onValueChange={(value) => setFilters({...filters, betType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Тип ставки" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі типи</SelectItem>
                  <SelectItem value="match winner">Переможець матчу</SelectItem>
                  <SelectItem value="map winner">Переможець карти</SelectItem>
                  <SelectItem value="total">Тотал</SelectItem>
                  <SelectItem value="handicap">Фора</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                type="date"
                placeholder="Від дати"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              />
              
              <Input
                type="date"
                placeholder="До дати"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              />
            </div>
            
            <div className="text-sm text-gray-600">
              Показано {filteredRecords.length} з {records.length} ставок
            </div>
          </div>

          {/* Таблиця */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Матч</TableHead>
                  <TableHead>Турнір</TableHead>
                  <TableHead>Тип ставки</TableHead>
                  <TableHead>Коеф.</TableHead>
                  <TableHead>Сума</TableHead>
                  <TableHead>Результат</TableHead>
                  <TableHead>Профіт</TableHead>
                  <TableHead>ROI</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell>{record.date}</TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div>{record.match || `${record.team1} vs ${record.team2}`}</div>
                        {record.format && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {record.format}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {record.tournament}
                    </TableCell>
                    <TableCell>{record.betType}</TableCell>
                    <TableCell>{record.odds}</TableCell>
                    <TableCell>{record.amount} ₴</TableCell>
                    <TableCell>
                      <Badge className={getResultColor(record.result)} variant="secondary">
                        {getResultText(record.result)}
                      </Badge>
                    </TableCell>
                    <TableCell className={record.profit > 0 ? 'text-green-600' : record.profit < 0 ? 'text-red-600' : ''}>
                      {record.profit !== undefined && record.profit !== 0 ? (
                        <span>{record.profit > 0 ? '+' : ''}{record.profit} ₴</span>
                      ) : (
                        record.result === 'Pending' ? '-' : '0 ₴'
                      )}
                    </TableCell>
                    <TableCell className={record.roi > 0 ? 'text-green-600' : record.roi < 0 ? 'text-red-600' : ''}>
                      {record.roi !== undefined && record.roi !== 0 ? (
                        <span>{record.roi > 0 ? '+' : ''}{record.roi.toFixed(1)}%</span>
                      ) : (
                        record.result === 'Pending' ? '-' : '0%'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {record.result === 'Pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBetResult(index, 'Win')}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBetResult(index, 'Loss')}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {record.matchUrl && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={record.matchUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {records.length === 0 ? (
                <>
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Поки що немає записів про ставки</p>
                  <p className="text-sm">Додайте свою першу ставку, щоб побачити історію</p>
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Немає ставок, що відповідають фільтрам</p>
                  <p className="text-sm">Спробуйте змінити критерії пошуку</p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}