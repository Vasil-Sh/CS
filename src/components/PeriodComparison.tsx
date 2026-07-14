import { memo } from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, ReferenceLine, Area } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { NumberTicker } from '@/components/ui/number-ticker';
import type { Bet } from '@/types/betting';

interface PeriodComparisonProps {
  bets: Bet[];
}

interface PeriodStats {
  period: string;
  totalBets: number;
  winRate: number;
  totalProfit: number;
  averageROI: number;
  averageBetSize: number;
  bestStreak: number;
  worstStreak: number;
}

interface TrendDataPoint {
  period: string;
  profit: number;
  winRate: number;
  bets: number;
  roi: number;
}

const PeriodComparisonMemo = memo(function PeriodComparison({ bets }: PeriodComparisonProps) {
  const [comparisonType, setComparisonType] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [selectedPeriods, setSelectedPeriods] = useState<PeriodStats[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);

  useEffect(() => {
    calculatePeriodComparisons();
  }, [bets, comparisonType]);

  const calculatePeriodComparisons = () => {
    const completedBets = bets.filter(bet => bet.result !== 'Pending');
    const periodStats: { [key: string]: PeriodStats } = {};

    completedBets.forEach(bet => {
      const date = new Date(bet.date);
      let periodKey = '';

      switch (comparisonType) {
        case 'monthly': {
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        }
        case 'quarterly': {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          periodKey = `${date.getFullYear()}-Q${quarter}`;
          break;
        }
        case 'yearly': {
          periodKey = `${date.getFullYear()}`;
          break;
        }
      }

      if (!periodStats[periodKey]) {
        periodStats[periodKey] = {
          period: periodKey,
          totalBets: 0,
          winRate: 0,
          totalProfit: 0,
          averageROI: 0,
          averageBetSize: 0,
          bestStreak: 0,
          worstStreak: 0
        };
      }

      const stats = periodStats[periodKey];
      stats.totalBets++;
      stats.totalProfit += bet.profit || 0;
      stats.averageBetSize += bet.amount || 0;
    });

    Object.values(periodStats).forEach(stats => {
      const periodBets = completedBets.filter(bet => {
        const date = new Date(bet.date);
        let periodKey = '';
        
        switch (comparisonType) {
          case 'monthly': {
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          }
          case 'quarterly': {
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            periodKey = `${date.getFullYear()}-Q${quarter}`;
            break;
          }
          case 'yearly': {
            periodKey = `${date.getFullYear()}`;
            break;
          }
        }
        
        return periodKey === stats.period;
      });

      const wins = periodBets.filter(bet => bet.result === 'Win').length;
      stats.winRate = stats.totalBets > 0 ? (wins / stats.totalBets * 100) : 0;
      stats.averageROI = stats.totalBets > 0 ? (stats.totalProfit / (stats.averageBetSize) * 100) : 0;
      stats.averageBetSize = stats.totalBets > 0 ? (stats.averageBetSize / stats.totalBets) : 0;

      let currentStreak = 0;
      let bestStreak = 0;
      let worstStreak = 0;
      
      periodBets.forEach(bet => {
        if (bet.result === 'Win') {
          currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
          bestStreak = Math.max(bestStreak, currentStreak);
        } else {
          currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
          worstStreak = Math.min(worstStreak, currentStreak);
        }
      });

      stats.bestStreak = bestStreak;
      stats.worstStreak = Math.abs(worstStreak);
    });

    const sortedPeriods = Object.values(periodStats)
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-6);

    setSelectedPeriods(sortedPeriods);

    const newTrendData: TrendDataPoint[] = sortedPeriods.map(period => ({
      period: formatPeriodName(period.period),
      profit: Math.round(period.totalProfit * 100) / 100,
      winRate: Math.round(period.winRate * 10) / 10,
      bets: period.totalBets,
      roi: Math.round(period.averageROI * 10) / 10
    }));

    setTrendData(newTrendData);
  };

  const formatPeriodName = (period: string) => {
    if (comparisonType === 'monthly') {
      const [year, month] = period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('uk-UA', { month: 'short', year: 'numeric' });
    }
    return period;
  };

  const chartCardShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)';

  const completedBetsCount = bets.filter(bet => bet.result !== 'Pending').length;

  const maxProfit = Math.max(...selectedPeriods.map(p => p.totalProfit), 0);
  const minProfit = Math.min(...selectedPeriods.map(p => p.totalProfit), 0);
  const maxROI = Math.max(...selectedPeriods.map(p => p.averageROI), 0);

  return (
    <>
      {completedBetsCount === 0 ? (
        <div className="flex-1 flex items-center justify-center py-16 text-center">
          <div>
            <div className="p-8 bg-gray-100 rounded-2xl inline-block mb-6">
              <Calendar className="h-16 w-16 text-gray-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Немає даних для порівняння</h3>
            <p className="text-gray-500 text-sm">Додайте завершені ставки для перегляду статистики по періодах</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-end">
            <Select value={comparisonType} onValueChange={(v: 'monthly' | 'quarterly' | 'yearly') => setComparisonType(v)}>
              <SelectTrigger className="w-48 rounded-[24px] border border-gray-200 hover:border-gray-300 transition-colors h-10 text-sm font-medium text-gray-700 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="monthly">По місяцях</SelectItem>
                <SelectItem value="quarterly">По кварталах</SelectItem>
                <SelectItem value="yearly">По роках</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profit + Bets */}
            <Card className="border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] rounded-[32px] bg-white overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-100 px-6 py-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                    <div className="p-2.5 bg-blue-50 rounded-2xl"><TrendingUp className="h-5 w-5 text-primary" strokeWidth={1.5} /></div>
                    Прибуток та активність
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-3 h-0.5 rounded-full bg-emerald-500" /> Прибуток
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-3 h-0.5 rounded-full bg-blue-500" /> Ставки
                    </div>
                    <div className="w-px h-6 bg-gray-200" />
                    <Badge className="bg-white border border-emerald-200 text-emerald-600 text-[10px] font-semibold px-2 py-0.5 rounded-lg">▲ <NumberTicker value={Math.round(maxProfit)} /></Badge>
                    <Badge className="bg-white border border-red-200 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-lg">▼ <NumberTicker value={Math.round(minProfit)} /></Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 sm:p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="periodProfitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#447afc" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#447afc" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }} tickLine={false} dy={8} />
                    <YAxis yAxisId="profit" orientation="left" tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }} tickLine={false} width={50} />
                    <YAxis yAxisId="bets" orientation="right" tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }} tickLine={false} width={40} />
                    <RechartsTooltip
                      cursor={{ stroke: '#D1D5DB', strokeWidth: 1, strokeDasharray: '4 4' }}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '12px', padding: '8px 12px' }}
                      formatter={(value: number | string, name: string) => { if (name === 'profit') return [`${value} ₴`, 'Прибуток']; if (name === 'bets') return [value, 'Ставок']; return [value, name]; }}
                    />
                    <ReferenceLine yAxisId="profit" y={0} stroke="#E5E7EB" strokeWidth={1} />
                    <Bar yAxisId="bets" dataKey="bets" fill="#447afc" name="bets" radius={[4, 4, 0, 0]} maxBarSize={40} opacity={0.35} />
                    <Area yAxisId="profit" type="monotone" dataKey="profit" fill="url(#periodProfitGrad)" stroke="none" />
                    <Line yAxisId="profit" type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2.5} name="profit" dot={{ fill: '#10B981', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Win Rate + ROI */}
            <Card className="border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] rounded-[32px] bg-white overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-100 px-6 py-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                    <div className="p-2.5 bg-blue-50 rounded-2xl"><Calendar className="h-5 w-5 text-primary" strokeWidth={1.5} /></div>
                    Win Rate та ROI тренди
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-3 h-0.5 rounded-full bg-emerald-500" /> Win Rate
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-3 h-0.5 rounded-full bg-blue-500" /> ROI
                    </div>
                    <Badge className="bg-white border border-emerald-200 text-emerald-600 text-[10px] font-semibold px-2 py-0.5 rounded-lg">WR <NumberTicker value={Math.round(Math.max(...selectedPeriods.map(p => p.winRate)))} />%</Badge>
                    <Badge className="bg-white border border-blue-200 text-blue-500 text-[10px] font-semibold px-2 py-0.5 rounded-lg">ROI <NumberTicker value={Math.round(maxROI)} />%</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 sm:p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }} tickLine={false} dy={8} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }} tickLine={false} tickFormatter={(v) => `${v}%`} width={45} />
                    <RechartsTooltip
                      cursor={{ stroke: '#D1D5DB', strokeWidth: 1, strokeDasharray: '4 4' }}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '12px', padding: '8px 12px' }}
                      formatter={(value: number | string, name: string) => { if (name === 'winRate') return [`${value}%`, 'Win Rate']; if (name === 'roi') return [`${value}%`, 'ROI']; return [value, name]; }}
                    />
                    <ReferenceLine y={0} stroke="#E5E7EB" strokeWidth={1} />
                    <Line type="monotone" dataKey="winRate" stroke="#10B981" strokeWidth={2.5} name="winRate" dot={{ fill: '#10B981', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="roi" stroke="#447afc" strokeWidth={2.5} name="roi" dot={{ fill: '#447afc', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card className="border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 px-6 py-5">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                <div className="p-2.5 bg-blue-50 rounded-2xl"><Calendar className="h-5 w-5 text-primary" strokeWidth={1.5} /></div>
                Детальна статистика по періодах
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Період</th>
                      <th className="text-center py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ставок</th>
                      <th className="text-center py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Win Rate</th>
                      <th className="text-center py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Прибуток</th>
                      <th className="text-center py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">ROI</th>
                      <th className="text-center py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Серія ↑</th>
                      <th className="text-center py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Серія ↓</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPeriods.map((period, index) => (
                      <tr key={period.period} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${index === selectedPeriods.length - 1 ? 'bg-blue-50/30' : ''}`}>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{formatPeriodName(period.period)}</span>
                            {index === selectedPeriods.length - 1 && <Badge className="rounded-lg bg-gray-900 text-white text-[10px] border-0 px-2 py-0.5">Поточний</Badge>}
                          </div>
                        </td>
                        <td className="text-center py-3 px-6 text-sm font-semibold text-gray-900"><NumberTicker value={period.totalBets} /></td>
                        <td className="text-center py-3 px-6 text-sm font-semibold text-gray-900">{period.winRate.toFixed(0)}%</td>
                        <td className="text-center py-3 px-6 text-sm font-semibold"><span className={period.totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}>{period.totalProfit >= 0 ? '+' : ''}<NumberTicker value={Math.round(period.totalProfit)} /> ₴</span></td>
                        <td className="text-center py-3 px-6 text-sm font-semibold"><span className={period.averageROI >= 0 ? 'text-emerald-500' : 'text-red-500'}>{period.averageROI >= 0 ? '+' : ''}{period.averageROI.toFixed(0)}%</span></td>
                        <td className="text-center py-3 px-6 text-sm font-semibold text-emerald-500">+{period.bestStreak}</td>
                        <td className="text-center py-3 px-6 text-sm font-semibold text-red-500">-{period.worstStreak}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
});

export default PeriodComparisonMemo;