import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, Minus, Info, AlertCircle } from 'lucide-react';
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

  const getComparisonIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (current < previous) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getComparisonColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const hasSmallSample = (bets: number) => bets < 10;

  const currentPeriod = selectedPeriods[selectedPeriods.length - 1];
  const previousPeriod = selectedPeriods[selectedPeriods.length - 2];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Порівняння періодів</h2>
            <p className="text-gray-500 font-medium">Аналіз динаміки показників у часі</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-50">
                  <Info className="h-5 w-5 text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-white/95 backdrop-blur-sm border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Як працює порівняння:</p>
                <p className="text-xs text-gray-700">
                  Порівнюється поточний період з попереднім аналогічним. Наприклад, грудень 2024 з листопадом 2024, або Q4 2024 з Q3 2024.
                </p>
              </TooltipContent>
            </Tooltip>

            <Select value={comparisonType} onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => setComparisonType(value)}>
              <SelectTrigger className="w-48 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors">
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

        {currentPeriod && previousPeriod && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Total Profit */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Загальний прибуток</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-semibold text-gray-900 tracking-tight">
                      {currentPeriod.totalProfit >= 0 ? '+' : ''}{currentPeriod.totalProfit.toFixed(2)} ₴
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Попередній: {previousPeriod.totalProfit >= 0 ? '+' : ''}{previousPeriod.totalProfit.toFixed(2)} ₴
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getComparisonIcon(currentPeriod.totalProfit, previousPeriod.totalProfit)}
                    <span className={`text-sm font-medium ${getComparisonColor(currentPeriod.totalProfit, previousPeriod.totalProfit)}`}>
                      {Math.abs(calculateChange(currentPeriod.totalProfit, previousPeriod.totalProfit)).toFixed(1)}%
                    </span>
                  </div>
                </div>
                {hasSmallSample(currentPeriod.totalBets) && (
                  <div className="mt-3 flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    <span className="text-xs text-yellow-700 font-medium">Мала вибірка ({currentPeriod.totalBets} ставок)</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 2: Win Rate */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-semibold text-gray-900 tracking-tight">{currentPeriod.winRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Попередній: {previousPeriod.winRate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getComparisonIcon(currentPeriod.winRate, previousPeriod.winRate)}
                    <span className={`text-sm font-medium ${getComparisonColor(currentPeriod.winRate, previousPeriod.winRate)}`}>
                      {Math.abs(calculateChange(currentPeriod.winRate, previousPeriod.winRate)).toFixed(1)}%
                    </span>
                  </div>
                </div>
                {hasSmallSample(currentPeriod.totalBets) && (
                  <div className="mt-3 flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    <span className="text-xs text-yellow-700 font-medium">Мала вибірка ({currentPeriod.totalBets} ставок)</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 3: Total Bets */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Кількість ставок</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-semibold text-gray-900 tracking-tight">{currentPeriod.totalBets}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Попередній: {previousPeriod.totalBets}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getComparisonIcon(currentPeriod.totalBets, previousPeriod.totalBets)}
                    <span className={`text-sm font-medium ${getComparisonColor(currentPeriod.totalBets, previousPeriod.totalBets)}`}>
                      {Math.abs(calculateChange(currentPeriod.totalBets, previousPeriod.totalBets)).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Average ROI */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Середній ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-semibold text-gray-900 tracking-tight">
                      {currentPeriod.averageROI >= 0 ? '+' : ''}{currentPeriod.averageROI.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Попередній: {previousPeriod.averageROI >= 0 ? '+' : ''}{previousPeriod.averageROI.toFixed(1)}%
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getComparisonIcon(currentPeriod.averageROI, previousPeriod.averageROI)}
                    <span className={`text-sm font-medium ${getComparisonColor(currentPeriod.averageROI, previousPeriod.averageROI)}`}>
                      {Math.abs(calculateChange(currentPeriod.averageROI, previousPeriod.averageROI)).toFixed(1)}%
                    </span>
                  </div>
                </div>
                {hasSmallSample(currentPeriod.totalBets) && (
                  <div className="mt-3 flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    <span className="text-xs text-yellow-700 font-medium">Мала вибірка ({currentPeriod.totalBets} ставок)</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Profit + Bets */}
          <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                Прибуток та активність
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    yAxisId="profit" 
                    orientation="left"
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    label={{ value: 'Прибуток (₴)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
                  />
                  <YAxis 
                    yAxisId="bets" 
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    label={{ value: 'Кількість ставок', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#6b7280' } }}
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
                    formatter={(value) => {
                      if (value === 'profit') return 'Прибуток (₴)';
                      if (value === 'bets') return 'Кількість ставок';
                      return value;
                    }}
                  />
                  <Bar 
                    yAxisId="bets" 
                    dataKey="bets" 
                    fill="#93c5fd" 
                    name="bets"
                    radius={[8, 8, 0, 0]}
                  />
                  <Line 
                    yAxisId="profit" 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    name="profit"
                    dot={{ fill: '#10b981', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 2: Win Rate + ROI */}
          <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                Win Rate та ROI тренди
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="period"
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    label={{ value: 'Відсоток (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
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
                    formatter={(value) => {
                      if (value === 'winRate') return 'Win Rate (%)';
                      if (value === 'roi') return 'ROI (%)';
                      return value;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="winRate" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    name="winRate"
                    dot={{ fill: '#3b82f6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="roi" 
                    stroke="#8b5cf6" 
                    strokeWidth={2} 
                    name="roi"
                    dot={{ fill: '#8b5cf6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900">Детальна статистика по періодах</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="text-left p-3 text-xs font-black text-gray-700 uppercase tracking-wider">Період</th>
                    <th className="text-right p-3 text-xs font-black text-gray-700 uppercase tracking-wider">Ставок</th>
                    <th className="text-right p-3 text-xs font-black text-gray-700 uppercase tracking-wider">Win Rate</th>
                    <th className="text-right p-3 text-xs font-black text-gray-700 uppercase tracking-wider">Прибуток</th>
                    <th className="text-right p-3 text-xs font-black text-gray-700 uppercase tracking-wider">ROI</th>
                    <th className="text-right p-3 text-xs font-black text-gray-700 uppercase tracking-wider">Серія ↑</th>
                    <th className="text-right p-3 text-xs font-black text-gray-700 uppercase tracking-wider">Серія ↓</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPeriods.map((period, index) => (
                    <tr key={period.period} className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all ${index === selectedPeriods.length - 1 ? 'bg-blue-50/50' : ''}`}>
                      <td className="p-3 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {formatPeriodName(period.period)}
                          {index === selectedPeriods.length - 1 && (
                            <Badge className="rounded-full bg-blue-100 text-blue-700 border-0 font-bold">Поточний</Badge>
                          )}
                          {hasSmallSample(period.totalBets) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="inline-flex items-center">
                                  <AlertCircle className="h-4 w-4 text-yellow-600 cursor-help" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                                <p className="text-xs text-yellow-700 font-medium">
                                  Мала вибірка ({period.totalBets} ставок). Дані можуть бути нестабільні.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                      <td className="text-right p-3 text-gray-900 font-medium">{period.totalBets}</td>
                      <td className="text-right p-3 text-gray-900 font-medium">{period.winRate.toFixed(1)}%</td>
                      <td className={`text-right p-3 font-bold ${period.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {period.totalProfit >= 0 ? '+' : ''}{period.totalProfit.toFixed(2)} ₴
                      </td>
                      <td className={`text-right p-3 font-bold ${period.averageROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {period.averageROI >= 0 ? '+' : ''}{period.averageROI.toFixed(1)}%
                      </td>
                      <td className="text-right p-3 text-green-600 font-bold">+{period.bestStreak}</td>
                      <td className="text-right p-3 text-red-600 font-bold">-{period.worstStreak}</td>
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