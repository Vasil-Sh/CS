import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
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

export default function PeriodComparison({ bets }: PeriodComparisonProps) {
  const [comparisonType, setComparisonType] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [selectedPeriods, setSelectedPeriods] = useState<PeriodStats[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

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
        case 'monthly':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarterly':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          periodKey = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'yearly':
          periodKey = `${date.getFullYear()}`;
          break;
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
          case 'monthly':
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'quarterly':
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            periodKey = `${date.getFullYear()}-Q${quarter}`;
            break;
          case 'yearly':
            periodKey = `${date.getFullYear()}`;
            break;
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

    const trendData = sortedPeriods.map(period => ({
      period: formatPeriodName(period.period),
      profit: Math.round(period.totalProfit * 100) / 100,
      winRate: Math.round(period.winRate * 10) / 10,
      bets: period.totalBets,
      roi: Math.round(period.averageROI * 10) / 10
    }));

    setTrendData(trendData);
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

  const currentPeriod = selectedPeriods[selectedPeriods.length - 1];
  const previousPeriod = selectedPeriods[selectedPeriods.length - 2];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Порівняння періодів</h2>
          <p className="text-gray-500 font-medium">Аналіз динаміки показників у часі</p>
        </div>
        
        <Select value={comparisonType} onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => setComparisonType(value)}>
          <SelectTrigger className="w-48 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">По місяцях</SelectItem>
            <SelectItem value="quarterly">По кварталах</SelectItem>
            <SelectItem value="yearly">По роках</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {currentPeriod && previousPeriod && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            </CardContent>
          </Card>

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
            </CardContent>
          </Card>

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
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Динаміка прибутку</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis yAxisId="profit" orientation="left" />
                <YAxis yAxisId="bets" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'profit' ? `${value} ₴` : value,
                    name === 'profit' ? 'Прибуток' : 'Кількість ставок'
                  ]}
                />
                <Bar yAxisId="bets" dataKey="bets" fill="#e5e7eb" name="bets" />
                <Line yAxisId="profit" type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} name="profit" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Win Rate та ROI тренди</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value}%`,
                    name === 'winRate' ? 'Win Rate' : 'ROI'
                  ]}
                />
                <Line type="monotone" dataKey="winRate" stroke="#3b82f6" strokeWidth={2} name="winRate" />
                <Line type="monotone" dataKey="roi" stroke="#8b5cf6" strokeWidth={2} name="roi" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Детальна статистика по періодах</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Період</th>
                  <th className="text-right p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Ставок</th>
                  <th className="text-right p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Win Rate</th>
                  <th className="text-right p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Прибуток</th>
                  <th className="text-right p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">ROI</th>
                  <th className="text-right p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Серія ↑</th>
                  <th className="text-right p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Серія ↓</th>
                </tr>
              </thead>
              <tbody>
                {selectedPeriods.map((period, index) => (
                  <tr key={period.period} className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${index === selectedPeriods.length - 1 ? 'bg-blue-50/50' : ''}`}>
                    <td className="p-3 font-medium text-gray-900">
                      {formatPeriodName(period.period)}
                      {index === selectedPeriods.length - 1 && (
                        <Badge className="ml-2 rounded-full bg-blue-100 text-blue-700 border-0">Поточний</Badge>
                      )}
                    </td>
                    <td className="text-right p-3 text-gray-900">{period.totalBets}</td>
                    <td className="text-right p-3 text-gray-900">{period.winRate.toFixed(1)}%</td>
                    <td className={`text-right p-3 font-medium ${period.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {period.totalProfit >= 0 ? '+' : ''}{period.totalProfit.toFixed(2)} ₴
                    </td>
                    <td className={`text-right p-3 ${period.averageROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {period.averageROI >= 0 ? '+' : ''}{period.averageROI.toFixed(1)}%
                    </td>
                    <td className="text-right p-3 text-green-600">+{period.bestStreak}</td>
                    <td className="text-right p-3 text-red-600">-{period.worstStreak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}