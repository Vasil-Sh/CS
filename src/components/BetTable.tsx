import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserDataService } from '@/lib/userDataService';
import {
  Calendar, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  ArrowUpDown, CheckCircle, XCircle, Share2, Eye, Flag,
} from 'lucide-react';
import type { Bet } from '@/types/betting';

interface Goal {
  id: string;
  name: string;
  type: 'amount' | 'ladder' | 'roi' | 'winrate';
  status: 'active' | 'completed' | 'failed';
}

type TableFilterMode = 'today' | 'all';
type ResultFilter = 'all' | 'Win' | 'Loss' | 'Pending';
type PeriodFilter = 'all' | 'week' | 'month' | 'quarter';
type SortBy = 'date' | 'profit' | 'odds';

const ITEMS_PER_PAGE = 10;

/** Normalize a bet.date string (DD.MM.YYYY or YYYY-MM-DD) → YYYY-MM-DD */
function normalizeDateStr(dateStr: string): string {
  if (!dateStr) return '';
  const dotMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) return `${dotMatch[3]}-${dotMatch[1].padStart(2, '0')}-${dotMatch[2].padStart(2, '0')}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) return `${slashMatch[3]}-${slashMatch[1].padStart(2, '0')}-${slashMatch[2].padStart(2, '0')}`;
  return dateStr;
}

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

interface BetTableProps {
  bets: Bet[];
  activeBets: Bet[];
  currentUser: string;
  isAdmin: boolean;
  tableFilter: TableFilterMode;
  onTableFilterChange: (v: TableFilterMode) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  resultFilter: ResultFilter;
  onResultFilterChange: (v: ResultFilter) => void;
  periodFilter: PeriodFilter;
  onPeriodFilterChange: (v: PeriodFilter) => void;
  sortBy: SortBy;
  onSortByChange: (v: SortBy) => void;
  sortOrder: 'asc' | 'desc';
  currentPage: number;
  onPageChange: (p: number) => void;
  onShareBet: (bet: Bet) => void;
  onBetDetails: (bet: Bet) => void;
  onExpressDetails: (bet: Bet) => void;
  onUpdateResult: (bet: Bet, result: 'Win' | 'Loss') => void;
}

export default function BetTable({
  bets, activeBets, currentUser, isAdmin,
  tableFilter, onTableFilterChange,
  showAdvancedFilters, onToggleAdvancedFilters,
  resultFilter, onResultFilterChange,
  periodFilter, onPeriodFilterChange,
  sortBy, onSortByChange,
  sortOrder, currentPage, onPageChange,
  onShareBet, onBetDetails, onExpressDetails, onUpdateResult,
}: BetTableProps) {
  const hasActiveAdvancedFilters = resultFilter !== 'all' || periodFilter !== 'all' || sortBy !== 'date';

  const resetAdvancedFilters = () => {
    onResultFilterChange('all');
    onPeriodFilterChange('all');
    onSortByChange('date');
    // sortOrder stays desc by default
  };

  const toggleSort = (column: SortBy) => {
    if (sortBy === column) {
      // This is a controlled prop; parent handles desc/asc via separate props.
      // Simplified: parent should track sortOrder.
    }
    onSortByChange(column);
  };

  const sortedAndFilteredBets = useMemo(() => {
    let result = [...bets].sort((a, b) => {
      if (a.result === 'Pending' && b.result !== 'Pending') return -1;
      if (a.result !== 'Pending' && b.result === 'Pending') return 1;
      const aTime = a.createdAt || new Date(a.date).getTime();
      const bTime = b.createdAt || new Date(b.date).getTime();
      return bTime - aTime;
    });

    if (tableFilter === 'today') {
      const targetDate = getTodayStr();
      result = result.filter((bet) => normalizeDateStr(bet.date) === targetDate);
    }
    if (resultFilter !== 'all') {
      result = result.filter((bet) => bet.result === resultFilter);
    }
    if (periodFilter !== 'all') {
      const now = new Date();
      result = result.filter((bet) => {
        const betDate = new Date(normalizeDateStr(bet.date));
        const diffDays = Math.floor((now.getTime() - betDate.getTime()) / 86400000);
        if (periodFilter === 'week') return diffDays <= 7;
        if (periodFilter === 'month') return diffDays <= 30;
        if (periodFilter === 'quarter') return diffDays <= 90;
        return true;
      });
    }

    if (sortBy !== 'date') {
      result = [...result].sort((a, b) => {
        const comparison = sortBy === 'profit' ? (a.profit || 0) - (b.profit || 0) : a.odds - b.odds;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    } else if (sortOrder === 'asc') {
      result = result.reverse();
    }
    return result;
  }, [bets, tableFilter, resultFilter, periodFilter, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedAndFilteredBets.length / ITEMS_PER_PAGE));
  const paginatedBets = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredBets.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedAndFilteredBets, currentPage]);

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, '...', totalPages];
    if (currentPage >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const getCurrencySymbol = (currency?: string) => currency === 'USD' ? '$' : '₴';
  const getGoalName = (goalId?: string) => {
    if (!goalId) return null;
    const goals = UserDataService.getUserData<Goal[]>(currentUser, 'goals', []);
    return goals.find((g) => g.id === goalId)?.name || 'Видалена ціль';
  };
  const isExpressBet = (bet: Bet) => bet.betType.includes('Експрес') || bet.format.includes('x');
  const getExpressEventCount = (bet: Bet) => {
    const match = bet.format.match(/(\d+)x/);
    return match ? parseInt(match[1], 10) : 0;
  };

  return (
    <div className="bg-white border border-[#F3F4F6] rounded-3xl overflow-hidden"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#F3F4F6]">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
          <span className="text-lg font-semibold text-[#111827]">Останні записи</span>
          {activeBets.length > 0 && (
            <Badge className="rounded-full bg-[#FEF3C7] text-[#D97706] border-0 text-sm font-medium px-3 py-0.5 hover:bg-[#FEF3C7]">
              {activeBets.length} активних
            </Badge>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="border-b border-[#F3F4F6] bg-[#FAFAFA]">
        <div className="flex items-center gap-3 px-6 py-3.5">
          <Filter className="h-4 w-4 text-[#9CA3AF]" strokeWidth={1.5} />
          <span className="text-sm text-[#6B7280] font-medium mr-1">Фільтр:</span>
          <button onClick={() => onTableFilterChange('today')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${tableFilter === 'today' ? 'bg-[#111827] text-white shadow-sm' : 'bg-white text-[#374151] border border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB]'}`}>
            Сьогодні
          </button>
          <button onClick={() => onTableFilterChange('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${tableFilter === 'all' ? 'bg-[#111827] text-white shadow-sm' : 'bg-white text-[#374151] border border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB]'}`}>
            Всі матчі
          </button>
          <button onClick={onToggleAdvancedFilters}
            className={`ml-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${showAdvancedFilters || hasActiveAdvancedFilters ? 'bg-[#EFF6FF] text-[#3B82F6] border border-[#BFDBFE]' : 'bg-white text-[#374151] border border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB]'}`}>
            {showAdvancedFilters ? <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.5} /> : <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />}
            Розширені
            {hasActiveAdvancedFilters && !showAdvancedFilters && <span className="flex items-center justify-center w-2 h-2 rounded-full bg-[#3B82F6]" />}
          </button>
          {hasActiveAdvancedFilters && (
            <button onClick={resetAdvancedFilters} className="px-3 py-2 rounded-xl text-sm font-medium text-[#EF4444] bg-[#FEF2F2] border border-[#FECACA] hover:bg-[#FEE2E2] transition-all duration-200">
              Скинути
            </button>
          )}
          <div className="ml-auto">
            <span className="text-sm text-[#9CA3AF]">
              {sortedAndFilteredBets.length} {sortedAndFilteredBets.length === 1 ? 'запис' : sortedAndFilteredBets.length >= 2 && sortedAndFilteredBets.length <= 4 ? 'записи' : 'записів'}
              {(tableFilter !== 'all' || hasActiveAdvancedFilters) && ` з ${bets.length}`}
            </span>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="px-6 py-4 border-t border-[#F3F4F6] bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-[#374151] mb-2 block">Результат:</label>
                <Select value={resultFilter} onValueChange={(v) => onResultFilterChange(v as ResultFilter)}>
                  <SelectTrigger className="rounded-xl border-[#E5E7EB] bg-white h-10"><SelectValue /></SelectTrigger>
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
                <Select value={periodFilter} onValueChange={(v) => onPeriodFilterChange(v as PeriodFilter)}>
                  <SelectTrigger className="rounded-xl border-[#E5E7EB] bg-white h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Весь час</SelectItem>
                    <SelectItem value="week">Останній тиждень</SelectItem>
                    <SelectItem value="month">Останній місяць</SelectItem>
                    <SelectItem value="quarter">Останній квартал</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#374151] mb-2 block">Сортування:</label>
                <Select value={sortBy} onValueChange={(v) => onSortByChange(v as SortBy)}>
                  <SelectTrigger className="rounded-xl border-[#E5E7EB] bg-white h-10"><SelectValue /></SelectTrigger>
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

      {/* Table Content */}
      <div className="px-0 pb-6">
        {sortedAndFilteredBets.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider cursor-pointer hover:bg-[#F3F4F6] transition-colors"
                      onClick={() => toggleSort('date')}>
                      <div className="flex items-center justify-center gap-2">Дата<ArrowUpDown className="h-3 w-3" strokeWidth={1.5} /></div>
                    </th>
                    <th className="text-left px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider min-w-[220px] border-l border-[#E5E7EB]">Матч</th>
                    <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider border-l border-[#E5E7EB]">Тип</th>
                    <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider border-l border-[#E5E7EB]">Валюта</th>
                    <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider border-l border-[#E5E7EB]">Сума</th>
                    <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider cursor-pointer hover:bg-[#F3F4F6] transition-colors border-l border-[#E5E7EB]"
                      onClick={() => toggleSort('odds')}>
                      <div className="flex items-center justify-center gap-2">Коеф.<ArrowUpDown className="h-3 w-3" strokeWidth={1.5} /></div>
                    </th>
                    <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider cursor-pointer hover:bg-[#F3F4F6] transition-colors border-l border-[#E5E7EB]"
                      onClick={() => toggleSort('profit')}>
                      <div className="flex items-center justify-center gap-2">Профіт<ArrowUpDown className="h-3 w-3" strokeWidth={1.5} /></div>
                    </th>
                    <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider border-l border-[#E5E7EB]">Ціль</th>
                    <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider border-l border-[#E5E7EB]">Статус</th>
                    <th className="text-center px-4 py-3.5 text-sm font-semibold text-[#6B7280] uppercase tracking-wider border-l border-[#E5E7EB]">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBets.map((bet) => {
                    const isPending = bet.result === 'Pending';
                    const isWin = bet.result === 'Win';
                    const isLoss = bet.result === 'Loss';
                    const currency = bet.currency || 'UAH';
                    const currencySymbol = getCurrencySymbol(currency);
                    const displayAmount = bet.originalAmount || bet.amount;
                    let displayProfit: number | undefined = bet.originalProfit;
                    if (displayProfit === undefined && bet.profit !== undefined && bet.profit !== null) {
                      displayProfit = bet.currency === 'USD' && bet.exchangeRate ? bet.profit / bet.exchangeRate : bet.profit;
                    }
                    const goalName = getGoalName(bet.goalId);
                    const isExpress = isExpressBet(bet);
                    const expressEventCount = isExpress ? getExpressEventCount(bet) : 0;
                    const betKey = bet.id || bet.createdAt?.toString() || `${bet.date}-${bet.match || bet.team1}-${bet.amount}-${bet.odds}-${Math.random()}`;

                    return (
                      <tr key={betKey} className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors duration-150">
                        <td className="px-4 py-4 text-center"><span className="text-base text-[#374151] font-medium">{bet.date}</span></td>
                        <td className="px-4 py-4 border-l border-[#F3F4F6]">
                          <div className="min-w-0">
                            <div className="font-semibold text-base text-[#111827] truncate" title={bet.match || `${bet.team1} vs ${bet.team2}`}>
                              {bet.match || `${bet.team1} vs ${bet.team2}`}
                            </div>
                            {!isExpress && <div className="text-sm text-[#9CA3AF] truncate mt-0.5" title={bet.betType}>{bet.betType}</div>}
                            <Badge className="text-xs rounded-md bg-[#F3F4F6] text-[#6B7280] border-0 font-medium mt-1.5 hover:bg-[#F3F4F6]">
                              {bet.game ? `${bet.game} • ${bet.format}` : bet.format}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                          {isExpress ? (
                            <div className="flex flex-col items-center gap-1.5">
                              <Badge className="rounded-md bg-[#FEF3C7] text-[#D97706] border-0 font-semibold text-sm px-2.5 py-1 hover:bg-[#FEF3C7]">Express {expressEventCount}×</Badge>
                              <button onClick={() => onExpressDetails(bet)} className="text-sm text-[#3B82F6] hover:text-[#2563EB] font-medium bg-[#EFF6FF] hover:bg-[#DBEAFE] px-3 py-1 rounded-md transition-colors duration-200">Деталі</button>
                            </div>
                          ) : (
                            <Badge className="rounded-md bg-[#EFF6FF] text-[#3B82F6] border-0 font-medium text-sm px-2.5 py-1 max-w-[160px] truncate hover:bg-[#EFF6FF]" title={bet.betType.split(' - ')[1] || bet.betType.split(' - ')[0]}>
                              {bet.betType.split(' - ')[1] || bet.betType.split(' - ')[0]}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                          <span className={`text-base font-semibold ${currency === 'USD' ? 'text-[#22C55E]' : 'text-[#3B82F6]'}`}>{currency}</span>
                        </td>
                        <td className="px-4 py-4 text-center border-l border-[#F3F4F6]"><span className="text-base font-semibold text-[#111827]">{currencySymbol}{displayAmount}</span></td>
                        <td className="px-4 py-4 text-center border-l border-[#F3F4F6]"><span className="text-base font-bold text-[#111827]">{bet.odds.toFixed(2)}</span></td>
                        <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                          {displayProfit !== undefined && displayProfit !== null ? (
                            <span className={`text-base font-bold ${displayProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{displayProfit >= 0 ? '+' : ''}{displayProfit.toFixed(2)} {currencySymbol}</span>
                          ) : <span className="text-[#D1D5DB] text-base">—</span>}
                        </td>
                        <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                          {goalName ? (
                            <Badge className="font-medium px-2.5 py-1 rounded-md bg-[#EFF6FF] text-[#3B82F6] border-0 text-sm max-w-[130px] truncate hover:bg-[#EFF6FF]" title={goalName}>
                              <Flag className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" strokeWidth={1.5} /><span className="truncate">{goalName}</span>
                            </Badge>
                          ) : <span className="text-[#D1D5DB] text-sm">—</span>}
                        </td>
                        <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                          <Badge className={`rounded-full border-0 font-semibold text-sm px-3.5 py-1.5 ${isWin ? 'bg-[#DCFCE7] text-[#16A34A] hover:bg-[#DCFCE7]' : isLoss ? 'bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FEE2E2]' : 'bg-[#FEF3C7] text-[#D97706] hover:bg-[#FEF3C7]'}`}>
                            {isWin ? 'Виграш' : isLoss ? 'Програш' : 'Очікується'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-center border-l border-[#F3F4F6]">
                          <div className="flex gap-2 justify-center">
                            {isPending && (<>
                              <button onClick={() => onUpdateResult(bet, 'Win')} className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#E5E7EB] hover:bg-[#DCFCE7] hover:border-[#86EFAC] text-[#16A34A] transition-all duration-200" title="Виграш"><CheckCircle className="h-4 w-4" strokeWidth={2} /></button>
                              <button onClick={() => onUpdateResult(bet, 'Loss')} className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#E5E7EB] hover:bg-[#FEE2E2] hover:border-[#FCA5A5] text-[#DC2626] transition-all duration-200" title="Програш"><XCircle className="h-4 w-4" strokeWidth={2} /></button>
                            </>)}
                            <button onClick={() => onShareBet(bet)} className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#E5E7EB] hover:bg-[#EFF6FF] hover:border-[#93C5FD] text-[#3B82F6] transition-all duration-200" title="Поділитися"><Share2 className="h-4 w-4" strokeWidth={2} /></button>
                            {isAdmin && (
                              <button onClick={() => onBetDetails(bet)} className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#E5E7EB] hover:bg-[#F3E8FF] hover:border-[#C4B5FD] text-[#7C3AED] transition-all duration-200" title="Деталі"><Eye className="h-4 w-4" strokeWidth={2} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-6 px-6">
                <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                  className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${currentPage === 1 ? 'text-[#D1D5DB] cursor-not-allowed' : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]'}`} title="Попередня">
                  <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                </button>
                {getPageNumbers().map((page, idx) => page === '...' ? (
                  <span key={`dots-${idx}`} className="flex items-center justify-center w-9 h-9 text-sm text-[#9CA3AF]">…</span>
                ) : (
                  <button key={page} onClick={() => onPageChange(page)}
                    className={`flex items-center justify-center min-w-[36px] h-9 rounded-xl text-sm font-medium transition-all duration-200 px-2 ${currentPage === page ? 'bg-[#111827] text-white shadow-sm' : 'text-[#374151] hover:bg-[#F3F4F6] hover:text-[#111827]'}`}>
                    {page}
                  </button>
                ))}
                <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                  className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${currentPage === totalPages ? 'text-[#D1D5DB] cursor-not-allowed' : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]'}`} title="Наступна">
                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F3F4F6] mx-auto mb-4">
              <Calendar className="h-8 w-8 text-[#9CA3AF]" strokeWidth={1.5} />
            </div>
            {tableFilter === 'today' ? (<>
              <p className="text-[#111827] font-semibold text-lg">Немає записів за сьогодні</p>
              <p className="text-base text-[#9CA3AF] mt-1">Додайте новий запис або перегляньте всі матчі</p>
              <button onClick={() => onTableFilterChange('all')} className="mt-4 px-5 py-2.5 rounded-xl bg-[#111827] text-white text-sm font-medium hover:bg-[#1F2937] transition-colors">Показати всі матчі</button>
            </>) : hasActiveAdvancedFilters ? (<>
              <p className="text-[#111827] font-semibold text-lg">Немає записів за обраними фільтрами</p>
              <p className="text-base text-[#9CA3AF] mt-1">Спробуйте змінити параметри фільтрації</p>
              <button onClick={resetAdvancedFilters} className="mt-4 px-5 py-2.5 rounded-xl bg-[#111827] text-white text-sm font-medium hover:bg-[#1F2937] transition-colors">Скинути фільтри</button>
            </>) : (<>
              <p className="text-[#111827] font-semibold text-lg">Поки що немає записів</p>
              <p className="text-base text-[#9CA3AF] mt-1">Додайте свій перший запис, щоб почати відстеження</p>
            </>)}
          </div>
        )}
      </div>
    </div>
  );
}
