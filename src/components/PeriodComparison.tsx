import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Legend, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, Minus, Info, AlertCircle, Table, BarChart3 } from 'lucide-react';
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

export default function PeriodComparison({ bets }: PeriodComparisonProps) {
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

  // Custom bar shape for profit — green for positive, red for negative
  interface ProfitBarProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    payload?: TrendDataPoint;
  }

  const ProfitBar = (props: ProfitBarProps) => {
    const { x = 0, y = 0, width = 0, height = 0, payload } = props;
    const isPositive = (payload?.profit || 0) >= 0;
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={isPositive ? '#10B981' : '#F87171'}
        opacity={isPositive ? 0.85 : 0.75}
        rx={4}
        ry={4}
      />
    );
  };

  return (
    <>
      {completedBetsCount === 0 ? (
        <Card 
          className="rounded-2xl bg-white overflow-hidden flex-1 flex items-center justify-center"
          style={{ boxShadow: chartCardShadow }}
        >
          <CardContent className="py-16 text-center">
            <div className="p-8 bg-[#F3F4F6] rounded-2xl inline-block mb-6">
              <Calendar className="h-16 w-16 text-[#9CA3AF]" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-semibold text-[#111827] mb-2">
              Немає даних для порівняння
            </h3>
            <p className="text-[#6B7280] text-sm">
              Додайте завершені ставки для перегляду статистики по періодах
            </p>
          </CardContent>
        </Card>
      ) : (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header with filter — info button moved to the right, before the select */}
        <div className="flex items-center justify-end gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-black/5 transition-colors duration-200">
                <Info className="h-5 w-5 text-[#3B82F6]" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-lg">
              <p className="text-sm font-medium text-[#111827] mb-1">Як працює порівняння:</p>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Порівнюється поточний період з попереднім аналогічним. Наприклад, грудень 2024 з листопадом 2024, або Q4 2024 з Q3 2024.
              </p>
            </TooltipContent>
          </Tooltip>

          <Select value={comparisonType} onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => setComparisonType(value)}>
            <SelectTrigger className="w-48 rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] transition-colors h-10 text-sm font-medium text-[#374151]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-[#E5E7EB]">
              <SelectItem value="monthly">По місяцях</SelectItem>
              <SelectItem value="quarterly">По кварталах</SelectItem>
              <SelectItem value="yearly">По роках</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Profit + Bets — GREEN theme */}
          <Card 
            className="border border-[#D1D5DB] rounded-2xl bg-white overflow-hidden"
            style={{ boxShadow: chartCardShadow }}
          >
            <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
              <CardTitle className="flex items-center justify-between text-lg font-semibold text-[#111827]">
                <span className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#EFF6FF] rounded-xl">
                    <TrendingUp className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
                  </div>
                  Прибуток та активність
                </span>
                <div className="flex gap-2">
                  <Badge className="bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] px-3 py-1.5 rounded-lg border border-[#BBF7D0] font-medium text-xs">
                    Прибуток
                  </Badge>
                  <Badge className="bg-[#EFF6FF] text-[#2563EB] hover:bg-[#EFF6FF] px-3 py-1.5 rounded-lg border border-[#BFDBFE] font-medium text-xs">
                    Ставки
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    stroke="#E5E7EB"
                  />
                  <YAxis 
                    yAxisId="profit" 
                    orientation="left"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    stroke="#E5E7EB"
                    label={{ value: 'Прибуток (₴)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
                  />
                  <YAxis 
                    yAxisId="bets" 
                    orientation="right"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    stroke="#E5E7EB"
                    label={{ value: 'Кількість ставок', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#6B7280' } }}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                    }}
                    formatter={(value: number | string, name: string) => {
                      if (name === 'profit') return [`${value} ₴`, 'Прибуток'];
                      if (name === 'bets') return [value, 'Кількість ставок'];
                      return [value, name];
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => {
                      if (value === 'profit') return <span style={{ color: '#374151', fontSize: '13px' }}>Прибуток (₴)</span>;
                      if (value === 'bets') return <span style={{ color: '#374151', fontSize: '13px' }}>Кількість ставок</span>;
                      return value;
                    }}
                  />
                  <ReferenceLine yAxisId="profit" y={0} stroke="#D1D5DB" strokeWidth={1} />
                  <Bar 
                    yAxisId="bets" 
                    dataKey="bets" 
                    fill="#447afc" 
                    name="bets"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                    opacity={0.8}
                  />
                  <Line 
                    yAxisId="profit" 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#16A34A" 
                    strokeWidth={2.5} 
                    name="profit"
                    dot={{ fill: '#16A34A', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 2: Win Rate + ROI — GREEN theme */}
          <Card 
            className="border border-[#D1D5DB] rounded-2xl bg-white overflow-hidden"
            style={{ boxShadow: chartCardShadow }}
          >
            <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
              <CardTitle className="flex items-center justify-between text-lg font-semibold text-[#111827]">
                <span className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#EFF6FF] rounded-xl">
                    <Calendar className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
                  </div>
                  Win Rate та ROI тренди
                </span>
                <div className="flex gap-2">
                  <Badge className="bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] px-3 py-1.5 rounded-lg border border-[#BBF7D0] font-medium text-xs">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#16A34A] mr-1.5" />
                    Win Rate
                  </Badge>
                  <Badge className="bg-[#EFF6FF] text-[#2563EB] hover:bg-[#EFF6FF] px-3 py-1.5 rounded-lg border border-[#BFDBFE] font-medium text-xs">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#447afc] mr-1.5" />
                    ROI
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="period"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    stroke="#E5E7EB"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    stroke="#E5E7EB"
                    label={{ value: '%', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                    }}
                    formatter={(value: number | string, name: string) => {
                      if (name === 'winRate') return [`${value}%`, 'Win Rate'];
                      if (name === 'roi') return [`${value}%`, 'ROI'];
                      return [value, name];
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => {
                      if (value === 'winRate') return <span style={{ color: '#374151', fontSize: '13px' }}>Win Rate (%)</span>;
                      if (value === 'roi') return <span style={{ color: '#374151', fontSize: '13px' }}>ROI (%)</span>;
                      return value;
                    }}
                  />
                  <ReferenceLine y={0} stroke="#D1D5DB" strokeWidth={1} />
                  <Line 
                    type="monotone" 
                    dataKey="winRate" 
                    stroke="#16A34A" 
                    strokeWidth={2.5} 
                    name="winRate"
                    dot={{ fill: '#16A34A', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="roi" 
                    stroke="#447afc" 
                    strokeWidth={2.5} 
                    name="roi"
                    dot={{ fill: '#447afc', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card 
          className="border border-[#D1D5DB] rounded-2xl bg-white overflow-hidden"
          style={{ boxShadow: chartCardShadow }}
        >
          <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-[#111827]">
              <div className="p-2.5 bg-[#EFF6FF] rounded-xl">
                <Table className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
              </div>
              Детальна статистика по періодах
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-[#6B7280] uppercase tracking-wider">Період</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-[#6B7280] uppercase tracking-wider">Ставок</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-[#6B7280] uppercase tracking-wider">Win Rate</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-[#6B7280] uppercase tracking-wider">Прибуток</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-[#6B7280] uppercase tracking-wider">ROI</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-[#6B7280] uppercase tracking-wider">Серія ↑</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-[#6B7280] uppercase tracking-wider">Серія ↓</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPeriods.map((period, index) => (
                    <tr 
                      key={period.period} 
                      className={`border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors ${index === selectedPeriods.length - 1 ? 'bg-[#F9FAFB]' : ''}`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-[#111827]">{formatPeriodName(period.period)}</span>
                          {index === selectedPeriods.length - 1 && (
                            <Badge className="rounded-lg bg-[#111827] text-white border-0 font-medium px-2.5 py-0.5 text-xs">
                              Поточний
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="text-center py-4 px-6 text-sm font-semibold text-[#111827]">{period.totalBets}</td>
                      <td className="text-center py-4 px-6 text-sm font-semibold text-[#111827]">{period.winRate.toFixed(1)}%</td>
                      <td className="text-center py-4 px-6">
                        <span className={`text-sm font-semibold ${period.totalProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                          {period.totalProfit >= 0 ? '+' : ''}{period.totalProfit.toFixed(2)} ₴
                        </span>
                      </td>
                      <td className="text-center py-4 px-6">
                        <span className={`text-sm font-semibold ${period.averageROI >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                          {period.averageROI >= 0 ? '+' : ''}{period.averageROI.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-center py-4 px-6 text-sm font-semibold text-[#22C55E]">+{period.bestStreak}</td>
                      <td className="text-center py-4 px-6 text-sm font-semibold text-[#EF4444]">-{period.worstStreak}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
      )}
    </>
  );
}