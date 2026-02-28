import { useState, useEffect } from 'react';
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
        {/* Filters */}
        <div
          className="bg-white border border-[#F3F4F6] rounded-3xl overflow-hidden"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#F3F4F6]">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-[#111827]">Фільтри</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] text-sm font-medium text-[#374151] h-9 px-4"
            >
              {showAdvancedFilters ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Приховати
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Розширені
                </>
              )}
            </Button>
          </div>
          <div className="p-6 space-y-5">
            {/* Basic Filters */}
            <div>
              <p className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#9CA3AF]" strokeWidth={1.5} />
                Основні фільтри
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#374151] mb-2 block">Результат:</label>
                  <Select value={resultFilter} onValueChange={(value: 'all' | 'Win' | 'Loss' | 'Pending') => setResultFilter(value)}>
                    <SelectTrigger className="rounded-xl border-[#E5E7EB] bg-white h-10">
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
                  <label className="text-sm font-medium text-[#374151] mb-2 block">Період:</label>
                  <Select value={periodFilter} onValueChange={(value: 'all' | 'week' | 'month' | 'quarter') => setPeriodFilter(value)}>
                    <SelectTrigger className="rounded-xl border-[#E5E7EB] bg-white h-10">
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
              <div className="pt-5 border-t border-[#F3F4F6]">
                <p className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#9CA3AF]" strokeWidth={1.5} />
                  Розширені фільтри
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#374151] mb-2 block">Тип прогнозу:</label>
                    <Select value={betTypeFilter} onValueChange={setBetTypeFilter}>
                      <SelectTrigger className="rounded-xl border-[#E5E7EB] bg-white h-10">
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
                    <label className="text-sm font-medium text-[#374151] mb-2 block">Сортування:</label>
                    <Select value={sortBy} onValueChange={(value: 'date' | 'profit' | 'odds') => setSortBy(value)}>
                      <SelectTrigger className="rounded-xl border-[#E5E7EB] bg-white h-10">
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
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                  <span className="text-lg font-semibold text-[#111827]">Записів</span>
                </div>
                <p className="text-4xl font-bold text-[#111827] tracking-tight">{filteredBets.length}</p>
              </div>
            </div>
          </div>
          
          <div
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                  <span className="text-lg font-semibold text-[#111827]">Win Rate</span>
                </div>
                <p className="text-4xl font-bold text-[#22C55E] tracking-tight">{winRate}%</p>
              </div>
            </div>
          </div>
          
          <div
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {totalProfit >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                  )}
                  <span className="text-lg font-semibold text-[#111827]">Профіт</span>
                </div>
                <p className={`text-4xl font-bold tracking-tight ${totalProfit >= 0 ? 'text-[#111827]' : 'text-[#EF4444]'}`}>
                  {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} ₴
                </p>
              </div>
              <div className="flex items-center gap-1">
                {totalProfit >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-[#22C55E]" strokeWidth={2} />
                ) : (
                  <TrendingDown className="h-5 w-5 text-[#EF4444]" strokeWidth={2} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Betting History Table */}
        <div
          className="bg-white border border-[#F3F4F6] rounded-3xl overflow-hidden"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#F3F4F6]">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-[#111827]">Історія записів</span>
            </div>
            <Badge className="rounded-full bg-[#F3F4F6] text-[#6B7280] border-0 text-sm font-medium px-3 py-0.5 hover:bg-[#F3F4F6]">
              {sortedBets.length} записів
            </Badge>
          </div>
          <div className="px-0 pb-6">
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#111827] mx-auto mb-4"></div>
                <p className="text-[#6B7280] font-medium">Завантаження...</p>
              </div>
            ) : sortedBets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider cursor-pointer hover:bg-[#F3F4F6] transition-colors" onClick={() => toggleSort('date')}>
                        <div className="flex items-center justify-center gap-2">
                          Дата
                          <ArrowUpDown className="h-3 w-3" strokeWidth={1.5} />
                        </div>
                      </th>
                      <th className="text-left px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider min-w-[200px] border-l border-[#E5E7EB]">
                        Матч
                      </th>
                      <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider border-l border-[#E5E7EB]">Тип</th>
                      <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider border-l border-[#E5E7EB]">Валюта</th>
                      <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider border-l border-[#E5E7EB]">Сума</th>
                      <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider cursor-pointer hover:bg-[#F3F4F6] transition-colors border-l border-[#E5E7EB]" onClick={() => toggleSort('odds')}>
                        <div className="flex items-center justify-center gap-2">
                          Коеф.
                          <ArrowUpDown className="h-3 w-3" strokeWidth={1.5} />
                        </div>
                      </th>
                      <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider border-l border-[#E5E7EB]">Ціль</th>
                      <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider border-l border-[#E5E7EB]">Статус</th>
                      <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider cursor-pointer hover:bg-[#F3F4F6] transition-colors border-l border-[#E5E7EB]" onClick={() => toggleSort('profit')}>
                        <div className="flex items-center justify-center gap-2">
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
                      const isWin = bet.result === 'Win';
                      const isLoss = bet.result === 'Loss';
                      
                      return (
                        <tr 
                          key={index} 
                          className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors duration-150"
                        >
                          <td className="px-4 py-4 text-center">
                            <span className="text-base text-[#374151] font-medium">{bet.date}</span>
                          </td>
                          <td className="px-4 py-4 border-l border-[#F3F4F6]">
                            <div className="min-w-0">
                              <div className="font-semibold text-base text-[#111827] truncate" title={displayMatch}>{displayMatch}</div>
                              {!isExpress && (
                                <div className="text-sm text-[#9CA3AF] truncate mt-0.5" title={bet.betType.split(' - ')[0]}>{bet.betType.split(' - ')[0]}</div>
                              )}
                              <Badge className="text-xs rounded-md bg-[#F3F4F6] text-[#6B7280] border-0 font-medium mt-1.5 hover:bg-[#F3F4F6]">
                                {bet.format}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                            {isExpress ? (
                              <div className="flex flex-col items-center gap-1.5">
                                <Badge className="rounded-md bg-[#FEF3C7] text-[#D97706] border-0 font-semibold text-sm px-2.5 py-1 hover:bg-[#FEF3C7]">
                                  Express {bet.format}
                                </Badge>
                                <button
                                  onClick={() => handleExpressDetailsClick(bet)}
                                  className="text-sm text-[#3B82F6] hover:text-[#2563EB] font-medium bg-[#EFF6FF] hover:bg-[#DBEAFE] px-3 py-1 rounded-md transition-colors duration-200"
                                >
                                  <Eye className="h-3 w-3 mr-1 inline" strokeWidth={1.5} />
                                  Деталі
                                </button>
                              </div>
                            ) : (
                              <Badge className="rounded-md bg-[#EFF6FF] text-[#3B82F6] border-0 font-medium text-sm px-2.5 py-1 max-w-[160px] truncate hover:bg-[#EFF6FF]" title={bet.betType.split(' - ')[1] || bet.betType.split(' - ')[0]}>
                                {bet.betType.split(' - ')[1] || bet.betType.split(' - ')[0]}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                            <span className="text-base text-[#6B7280] font-medium">{bet.currency || 'UAH'}</span>
                          </td>
                          <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                            <span className="text-base font-semibold text-[#111827]">₴{bet.amount}</span>
                          </td>
                          <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                            <span className="text-base font-bold text-[#111827]">{bet.odds.toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                            <span className="text-sm text-[#9CA3AF] truncate max-w-[120px] block mx-auto" title={bet.goalId || '—'}>{bet.goalId || '—'}</span>
                          </td>
                          <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                            <Badge 
                              className={`rounded-full border-0 font-semibold text-sm px-3.5 py-1.5 ${
                                isWin 
                                  ? 'bg-[#DCFCE7] text-[#16A34A] hover:bg-[#DCFCE7]' 
                                  : isLoss 
                                  ? 'bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FEE2E2]' 
                                  : 'bg-[#FEF3C7] text-[#D97706] hover:bg-[#FEF3C7]'
                              }`}
                            >
                              {isWin ? 'Виграш' : isLoss ? 'Програш' : 'Очікується'}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                            {bet.profit !== undefined && (
                              <span className={`text-base font-bold ${bet.profit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
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
              <div className="text-center py-16">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F3F4F6] mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-[#9CA3AF]" strokeWidth={1.5} />
                </div>
                <p className="text-[#111827] font-semibold text-lg">Немає записів за обраними фільтрами</p>
                <p className="text-base text-[#9CA3AF] mt-1">Спробуйте змінити параметри фільтрації</p>
              </div>
            )}
          </div>
        </div>

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