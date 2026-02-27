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
        {/* Filters Card - Updated Design */}
        <Card className="border-[1.5px] border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-[32px] bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-[#FAFAF8] border-b border-[#E8E6DC] pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-lg font-normal text-[#2D2D2D]">
                <div className="p-2.5 bg-[#F4E157] rounded-[20px]">
                  <Filter className="h-5 w-5 text-[#2D2D2D]" strokeWidth={1.5} />
                </div>
                Фільтри
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="rounded-[20px] border-[#E8E6DC] hover:bg-[#F5F5F3] font-normal"
              >
                {showAdvancedFilters ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" strokeWidth={1.5} />
                    Приховати розширені
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" strokeWidth={1.5} />
                    Розширені фільтри
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Basic Filters */}
            <div>
              <p className="text-sm font-normal text-[#2D2D2D] mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#6B6B6B]" strokeWidth={1.5} />
                Основні фільтри
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-light text-[#2D2D2D] mb-2 block">Результат:</label>
                  <Select value={resultFilter} onValueChange={(value: 'all' | 'Win' | 'Loss' | 'Pending') => setResultFilter(value)}>
                    <SelectTrigger className="rounded-[24px] border-[#E8E6DC] bg-white">
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
                  <label className="text-sm font-light text-[#2D2D2D] mb-2 block">Період:</label>
                  <Select value={periodFilter} onValueChange={(value: 'all' | 'week' | 'month' | 'quarter') => setPeriodFilter(value)}>
                    <SelectTrigger className="rounded-[24px] border-[#E8E6DC] bg-white">
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

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="pt-4 border-t border-[#E8E6DC]">
                <p className="text-sm font-normal text-[#2D2D2D] mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#6B6B6B]" strokeWidth={1.5} />
                  Розширені фільтри
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-light text-[#2D2D2D] mb-2 block">Тип прогнозу:</label>
                    <Select value={betTypeFilter} onValueChange={setBetTypeFilter}>
                      <SelectTrigger className="rounded-[24px] border-[#E8E6DC] bg-white">
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
                    <label className="text-sm font-light text-[#2D2D2D] mb-2 block">Сортування:</label>
                    <Select value={sortBy} onValueChange={(value: 'date' | 'profit' | 'odds') => setSortBy(value)}>
                      <SelectTrigger className="rounded-[24px] border-[#E8E6DC] bg-white">
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

        {/* Stats Cards - Updated Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-[1.5px] border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-[32px] bg-white overflow-hidden">
            <CardContent className="pt-6 pb-6 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider mb-2">Відфільтровано записів</p>
                  <p className="text-4xl font-light text-[#2D2D2D] tracking-tight">{filteredBets.length}</p>
                </div>
                <div className="p-3 bg-[#BBDEFB]/30 rounded-[20px]">
                  <BarChart3 className="h-7 w-7 text-[#1976D2]" strokeWidth={1.5} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-[1.5px] border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-[32px] bg-white overflow-hidden">
            <CardContent className="pt-6 pb-6 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider mb-2">Win Rate</p>
                  <p className="text-4xl font-light text-[#4CAF50] tracking-tight">{winRate}%</p>
                </div>
                <div className="p-3 bg-[#C8E6C9]/30 rounded-[20px]">
                  <Trophy className="h-7 w-7 text-[#4CAF50]" strokeWidth={1.5} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-[1.5px] border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-[32px] bg-white overflow-hidden">
            <CardContent className="pt-6 pb-6 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider mb-2">Профіт</p>
                  <p className={`text-4xl font-light tracking-tight ${totalProfit >= 0 ? 'text-[#FF9800]' : 'text-[#D32F2F]'}`}>
                    {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} ₴
                  </p>
                </div>
                <div className={`p-3 rounded-[20px] ${totalProfit >= 0 ? 'bg-[#FFE0B2]/30' : 'bg-[#FFCDD2]/30'}`}>
                  {totalProfit >= 0 ? (
                    <TrendingUp className="h-7 w-7 text-[#FF9800]" strokeWidth={1.5} />
                  ) : (
                    <TrendingDown className="h-7 w-7 text-[#D32F2F]" strokeWidth={1.5} />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Betting History Table - Updated Design */}
        <Card className="border-[1.5px] border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-[32px] bg-white overflow-hidden">
          <CardHeader className="bg-[#FAFAF8] border-b border-[#E8E6DC] pb-4">
            <CardTitle className="flex items-center justify-between text-xl font-normal text-[#2D2D2D]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#F4E157] rounded-[20px]">
                  <Zap className="h-5 w-5 text-[#2D2D2D]" strokeWidth={1.5} />
                </div>
                <span>Історія записів</span>
              </div>
              <Badge className="rounded-[20px] bg-[#F4E157] text-[#2D2D2D] border-0 text-base px-4 py-1 font-normal">
                {sortedBets.length} записів
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F4E157] mx-auto mb-4"></div>
                <p className="text-[#6B6B6B] font-normal">Завантаження...</p>
              </div>
            ) : sortedBets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-[#E8E6DC]">
                      <th className="text-center p-4 w-32 cursor-pointer hover:bg-[#FAFAF8] transition-colors border-r border-[#E8E6DC]" onClick={() => toggleSort('date')}>
                        <div className="flex items-center justify-center gap-2 text-xs font-normal text-[#6B6B6B] uppercase tracking-wider">
                          Дата
                          <ArrowUpDown className="h-3 w-3" strokeWidth={1.5} />
                        </div>
                      </th>
                      <th className="text-center p-4 min-w-[200px] border-r border-[#E8E6DC]">
                        <div className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider">
                          Матч
                        </div>
                      </th>
                      <th className="text-center p-4 w-48 text-xs font-normal text-[#6B6B6B] uppercase tracking-wider border-r border-[#E8E6DC]">Тип</th>
                      <th className="text-center p-4 w-24 text-xs font-normal text-[#6B6B6B] uppercase tracking-wider border-r border-[#E8E6DC]">Валюта</th>
                      <th className="text-center p-4 w-28 text-xs font-normal text-[#6B6B6B] uppercase tracking-wider border-r border-[#E8E6DC]">Сума</th>
                      <th className="text-center p-4 w-24 cursor-pointer hover:bg-[#FAFAF8] transition-colors border-r border-[#E8E6DC]" onClick={() => toggleSort('odds')}>
                        <div className="flex items-center justify-center gap-2 text-xs font-normal text-[#6B6B6B] uppercase tracking-wider">
                          Коеф.
                          <ArrowUpDown className="h-3 w-3" strokeWidth={1.5} />
                        </div>
                      </th>
                      <th className="text-center p-4 w-32 text-xs font-normal text-[#6B6B6B] uppercase tracking-wider border-r border-[#E8E6DC]">Ціль</th>
                      <th className="text-center p-4 w-32 text-xs font-normal text-[#6B6B6B] uppercase tracking-wider border-r border-[#E8E6DC]">Статус</th>
                      <th className="text-center p-4 w-32 cursor-pointer hover:bg-[#FAFAF8] transition-colors" onClick={() => toggleSort('profit')}>
                        <div className="flex items-center justify-center gap-2 text-xs font-normal text-[#6B6B6B] uppercase tracking-wider">
                          Профіт
                          <ArrowUpDown className="h-3 w-3" strokeWidth={1.5} />
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
                          className="bg-white border-b border-[#E8E6DC] hover:bg-[#FAFAF8] transition-all"
                        >
                          <td className="p-4 text-center border-r border-[#E8E6DC]">
                            <span className="text-sm font-normal text-[#2D2D2D]">{bet.date}</span>
                          </td>
                          <td className="p-4 text-center border-r border-[#E8E6DC]">
                            <div className="space-y-2">
                              <div className="font-normal text-base truncate text-[#2D2D2D]" title={displayMatch}>{displayMatch}</div>
                              {!isExpress && (
                                <div className="text-xs truncate text-[#6B6B6B] font-light" title={bet.betType.split(' - ')[0]}>{bet.betType.split(' - ')[0]}</div>
                              )}
                              <Badge className="text-xs rounded-[12px] bg-[#E1BEE7] text-[#7B1FA2] border-0 font-normal">
                                {bet.format}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4 text-center border-r border-[#E8E6DC]">
                            {isExpress ? (
                              <div className="flex items-center justify-center gap-2">
                                <Badge className="rounded-[16px] bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 font-normal text-sm px-3 py-1 whitespace-nowrap">
                                  Express {bet.format}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleExpressDetailsClick(bet)}
                                  className="rounded-[16px] border-[#E8E6DC] hover:bg-[#F5F5F3] font-normal text-[#2D2D2D] text-xs px-2 py-1 h-7 whitespace-nowrap"
                                >
                                  <Eye className="h-3 w-3 mr-1" strokeWidth={1.5} />
                                  Показати
                                </Button>
                              </div>
                            ) : (
                              <Badge className="rounded-[12px] bg-[#BBDEFB] text-[#1976D2] border-0 font-normal text-xs px-2 py-1 max-w-[180px] truncate" title={bet.betType.split(' - ')[1] || bet.betType.split(' - ')[0]}>
                                {bet.betType.split(' - ')[1] || bet.betType.split(' - ')[0]}
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 text-center border-r border-[#E8E6DC]">
                            <Badge className="rounded-[12px] bg-[#B2EBF2] text-[#00838F] border-0 font-normal text-sm px-3 py-1">
                              {bet.currency || 'UAH'}
                            </Badge>
                          </td>
                          <td className="p-4 text-center border-r border-[#E8E6DC]">
                            <span className="font-normal text-base text-[#2D2D2D]">₴{bet.amount}</span>
                          </td>
                          <td className="p-4 text-center border-r border-[#E8E6DC]">
                            <Badge className="rounded-[12px] bg-[#FFE0B2] text-[#E65100] border-0 font-normal text-base px-3 py-1">
                              {bet.odds.toFixed(2)}
                            </Badge>
                          </td>
                          <td className="p-4 text-center border-r border-[#E8E6DC]">
                            <span className="font-light text-xs text-[#6B6B6B] truncate max-w-[120px] block mx-auto" title={bet.goalId || '—'}>{bet.goalId || '—'}</span>
                          </td>
                          <td className="p-4 text-center border-r border-[#E8E6DC]">
                            <Badge 
                              className={`rounded-[12px] border-0 font-normal text-sm px-3 py-1 ${
                                bet.result === 'Win' 
                                  ? 'bg-[#C8E6C9] text-[#2E7D32]' 
                                  : bet.result === 'Loss' 
                                  ? 'bg-[#FFCDD2] text-[#C62828]' 
                                  : 'bg-[#FFF9C4] text-[#F57F17]'
                              }`}
                            >
                              {bet.result === 'Win' ? 'Виграш' : bet.result === 'Loss' ? 'Програш' : 'Очікується'}
                            </Badge>
                          </td>
                          <td className="p-4 text-center">
                            {bet.profit !== undefined && (
                              <span className={`font-normal text-base ${bet.profit >= 0 ? 'text-[#4CAF50]' : 'text-[#D32F2F]'}`}>
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
                <div className="p-6 bg-[#F5F5F3] rounded-[32px] inline-block mb-4">
                  <Calendar className="h-16 w-16 text-[#8B8B8B]" strokeWidth={1.5} />
                </div>
                <p className="text-[#2D2D2D] font-normal text-lg">Немає записів за обраними фільтрами</p>
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