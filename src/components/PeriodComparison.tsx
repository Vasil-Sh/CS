import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, Minus, Info, AlertCircle, Table, Flag } from 'lucide-react';
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

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header Card - matching GoalsManager style */}
        <Card className="border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)] rounded-[32px] bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_2px_8px_rgba(244,225,87,0.3)] flex-shrink-0">
                  <Flag className="h-6 w-6 text-black" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-3xl font-light text-black tracking-tight">Порівняння періодів</h2>
                  <p className="text-[#6B6B6B] mt-1 text-base font-light">Аналіз динаміки показників у часі</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-[20px] hover:bg-[#FFF9E6] bg-[#FFF9E6] border-2 border-[#F4E157] h-12 w-12 shadow-[0_2px_8px_rgba(244,225,87,0.2)]"
                    >
                      <Info className="h-6 w-6 text-[#8B6F47]" strokeWidth={2} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-white border-2 border-[#E8E6DC] rounded-[20px] p-4 shadow-lg">
                    <p className="text-base font-medium text-black mb-2">Як працює порівняння:</p>
                    <p className="text-sm text-[#6B6B6B] font-light leading-relaxed">
                      Порівнюється поточний період з попереднім аналогічним. Наприклад, грудень 2024 з листопадом 2024, або Q4 2024 з Q3 2024.
                    </p>
                  </TooltipContent>
                </Tooltip>

                <Select value={comparisonType} onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => setComparisonType(value)}>
                  <SelectTrigger className="w-48 rounded-[20px] border-2 border-[#D4D2C8] hover:border-[#C4C2B8] transition-colors h-12 font-light">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">По місяцях</SelectItem>
                    <SelectItem value="quarterly">По кварталах</SelectItem>
                    <SelectItem value="yearly">По роках</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Profit + Bets */}
          <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="bg-[#F5F5F3] border-b-2 border-[#E8E6DC] p-8">
              <CardTitle className="flex items-center gap-3 text-3xl font-light text-black">
                <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_2px_8px_rgba(244,225,87,0.3)]">
                  <TrendingUp className="h-6 w-6 text-black" strokeWidth={1.5} />
                </div>
                Прибуток та активність
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 12, fill: '#1a1a1a' }}
                    stroke="#1a1a1a"
                  />
                  <YAxis 
                    yAxisId="profit" 
                    orientation="left"
                    tick={{ fontSize: 12, fill: '#1a1a1a' }}
                    stroke="#1a1a1a"
                    label={{ value: 'Прибуток (₴)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#1a1a1a' } }}
                  />
                  <YAxis 
                    yAxisId="bets" 
                    orientation="right"
                    tick={{ fontSize: 12, fill: '#1a1a1a' }}
                    stroke="#1a1a1a"
                    label={{ value: 'Кількість ставок', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#1a1a1a' } }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: 'none', 
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number | string, name: string) => {
                      if (name === 'profit') return [`${value} ₴`, 'Прибуток'];
                      if (name === 'bets') return [value, 'Кількість ставок'];
                      return [value, name];
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    contentStyle={{ color: '#1a1a1a' }}
                    formatter={(value) => {
                      if (value === 'profit') return <span style={{ color: '#1a1a1a' }}>Прибуток (₴)</span>;
                      if (value === 'bets') return <span style={{ color: '#1a1a1a' }}>Кількість ставок</span>;
                      return value;
                    }}
                  />
                  <Bar 
                    yAxisId="bets" 
                    dataKey="bets" 
                    fill="#E8DCC8" 
                    name="bets"
                    radius={[8, 8, 0, 0]}
                  />
                  <Line 
                    yAxisId="profit" 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#8B6F47" 
                    strokeWidth={3} 
                    name="profit"
                    dot={{ fill: '#8B6F47', r: 6, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 2: Win Rate + ROI */}
          <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="bg-[#F5F5F3] border-b-2 border-[#E8E6DC] p-8">
              <CardTitle className="flex items-center gap-3 text-3xl font-light text-black">
                <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_2px_8px_rgba(244,225,87,0.3)]">
                  <Calendar className="h-6 w-6 text-black" strokeWidth={1.5} />
                </div>
                Win Rate та ROI тренди
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="period"
                    tick={{ fontSize: 12, fill: '#1a1a1a' }}
                    stroke="#1a1a1a"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#1a1a1a' }}
                    stroke="#1a1a1a"
                    label={{ value: 'Відсоток (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#1a1a1a' } }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: 'none', 
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number | string, name: string) => {
                      if (name === 'winRate') return [`${value}%`, 'Win Rate'];
                      if (name === 'roi') return [`${value}%`, 'ROI'];
                      return [value, name];
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    contentStyle={{ color: '#1a1a1a' }}
                    formatter={(value) => {
                      if (value === 'winRate') return <span style={{ color: '#1a1a1a' }}>Win Rate (%)</span>;
                      if (value === 'roi') return <span style={{ color: '#1a1a1a' }}>ROI (%)</span>;
                      return value;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="winRate" 
                    stroke="#8B6F47" 
                    strokeWidth={3} 
                    name="winRate"
                    dot={{ fill: '#8B6F47', r: 6, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="roi" 
                    stroke="#A0826D" 
                    strokeWidth={3} 
                    name="roi"
                    dot={{ fill: '#A0826D', r: 6, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
          <CardHeader className="bg-[#F5F5F3] border-b-2 border-[#E8E6DC] p-8">
            <CardTitle className="flex items-center gap-3 text-3xl font-light text-black">
              <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_2px_8px_rgba(244,225,87,0.3)]">
                <Table className="h-6 w-6 text-black" strokeWidth={1.5} />
              </div>
              Детальна статистика по періодах
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[#E8E6DC]">
                    <th className="text-left py-6 px-8 text-lg font-medium text-black">Період</th>
                    <th className="text-center py-6 px-8 text-lg font-medium text-black">Ставок</th>
                    <th className="text-center py-6 px-8 text-lg font-medium text-black">Win Rate</th>
                    <th className="text-center py-6 px-8 text-lg font-medium text-black">Прибуток</th>
                    <th className="text-center py-6 px-8 text-lg font-medium text-black">ROI</th>
                    <th className="text-center py-6 px-8 text-lg font-medium text-black">Серія ↑</th>
                    <th className="text-center py-6 px-8 text-lg font-medium text-black">Серія ↓</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPeriods.map((period, index) => (
                    <tr 
                      key={period.period} 
                      className={`border-b border-[#E8E6DC] hover:bg-[#FAFAF8] transition-all ${index === selectedPeriods.length - 1 ? 'bg-[#FFF9E6]' : ''}`}
                    >
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-medium text-black">{formatPeriodName(period.period)}</span>
                          {index === selectedPeriods.length - 1 && (
                            <Badge className="rounded-[12px] bg-[#F4E157] text-black border-0 font-medium px-3 py-1 text-sm">Поточний</Badge>
                          )}
                        </div>
                      </td>
                      <td className="text-center py-6 px-8 text-lg font-medium text-black">{period.totalBets}</td>
                      <td className="text-center py-6 px-8 text-lg font-medium text-black">{period.winRate.toFixed(1)}%</td>
                      <td className={`text-center py-6 px-8 text-lg font-semibold ${period.totalProfit >= 0 ? 'text-[#8B6F47]' : 'text-[#A0826D]'}`}>
                        {period.totalProfit >= 0 ? '+' : ''}{period.totalProfit.toFixed(2)} ₴
                      </td>
                      <td className={`text-center py-6 px-8 text-lg font-semibold ${period.averageROI >= 0 ? 'text-[#8B6F47]' : 'text-[#A0826D]'}`}>
                        {period.averageROI >= 0 ? '+' : ''}{period.averageROI.toFixed(1)}%
                      </td>
                      <td className="text-center py-6 px-8 text-lg font-semibold text-[#8B6F47]">+{period.bestStreak}</td>
                      <td className="text-center py-6 px-8 text-lg font-semibold text-[#A0826D]">-{period.worstStreak}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}