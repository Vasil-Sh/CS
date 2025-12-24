import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Brain, Target, AlertCircle, Lightbulb, Star } from 'lucide-react';
import type { Bet } from '@/types/betting';

interface PredictiveAnalyticsProps {
  bets: Bet[];
}

interface Prediction {
  metric: string;
  current: number;
  predicted: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

interface StrategyRecommendation {
  strategy: string;
  reason: string;
  impact: 'high' | 'medium' | 'low';
  implementation: string;
}

interface ForecastDataPoint {
  week: string;
  historical: number | null;
  predicted: number | null;
  confidence: number | null;
  bets: number | null;
}

export default function PredictiveAnalytics({ bets }: PredictiveAnalyticsProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [recommendations, setRecommendations] = useState<StrategyRecommendation[]>([]);
  const [forecastData, setForecastData] = useState<ForecastDataPoint[]>([]);
  const [confidenceScore, setConfidenceScore] = useState(0);

  useEffect(() => {
    generatePredictions();
    generateRecommendations();
    generateForecastData();
  }, [bets]);

  const generatePredictions = () => {
    const completedBets = bets.filter(bet => bet.result !== 'Pending');
    if (completedBets.length < 10) {
      setConfidenceScore(0);
      return;
    }

    const recentBets = completedBets.slice(-20);
    const olderBets = completedBets.slice(-40, -20);

    const calculateMetrics = (betGroup: Bet[]) => {
      const wins = betGroup.filter(bet => bet.result === 'Win').length;
      const totalProfit = betGroup.reduce((sum, bet) => sum + (bet.profit || 0), 0);
      const totalAmount = betGroup.reduce((sum, bet) => sum + (bet.amount || 0), 0);
      
      return {
        winRate: betGroup.length > 0 ? (wins / betGroup.length) * 100 : 0,
        roi: totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0,
        avgBetSize: betGroup.length > 0 ? totalAmount / betGroup.length : 0,
        profitPerBet: betGroup.length > 0 ? totalProfit / betGroup.length : 0
      };
    };

    const recentMetrics = calculateMetrics(recentBets);
    const olderMetrics = calculateMetrics(olderBets);

    const predictMetric = (current: number, previous: number) => {
      const trend = current - previous;
      return current + (trend * 0.5);
    };

    const getTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
      const diff = current - previous;
      if (Math.abs(diff) < 1) return 'stable';
      return diff > 0 ? 'up' : 'down';
    };

    const newPredictions: Prediction[] = [
      {
        metric: 'Win Rate',
        current: recentMetrics.winRate,
        predicted: predictMetric(recentMetrics.winRate, olderMetrics.winRate),
        confidence: Math.min(95, completedBets.length * 2),
        trend: getTrend(recentMetrics.winRate, olderMetrics.winRate)
      },
      {
        metric: 'ROI',
        current: recentMetrics.roi,
        predicted: predictMetric(recentMetrics.roi, olderMetrics.roi),
        confidence: Math.min(90, completedBets.length * 1.8),
        trend: getTrend(recentMetrics.roi, olderMetrics.roi)
      },
      {
        metric: 'Прибуток на ставку',
        current: recentMetrics.profitPerBet,
        predicted: predictMetric(recentMetrics.profitPerBet, olderMetrics.profitPerBet),
        confidence: Math.min(85, completedBets.length * 1.5),
        trend: getTrend(recentMetrics.profitPerBet, olderMetrics.profitPerBet)
      }
    ];

    setPredictions(newPredictions);
    setConfidenceScore(Math.min(90, completedBets.length * 2));
  };

  const generateRecommendations = () => {
    const completedBets = bets.filter(bet => bet.result !== 'Pending');
    const recommendations: StrategyRecommendation[] = [];

    if (completedBets.length < 5) {
      recommendations.push({
        strategy: 'Збір даних',
        reason: 'Недостатньо історичних даних для аналізу',
        impact: 'high',
        implementation: 'Зробіть ще 10-15 ставок для отримання статистично значущих рекомендацій'
      });
    } else {
      const winRate = (completedBets.filter(bet => bet.result === 'Win').length / completedBets.length) * 100;
      
      if (winRate < 45) {
        recommendations.push({
          strategy: 'Покращення селекції',
          reason: `Win rate ${winRate.toFixed(1)}% нижче оптимального`,
          impact: 'high',
          implementation: 'Зменшіть кількість ставок, фокусуйтесь на найбільш впевнених прогнозах'
        });
      }

      const avgOdds = completedBets.reduce((sum, bet) => sum + (bet.odds || 0), 0) / completedBets.length;
      const highOddsBets = completedBets.filter(bet => bet.odds > 3.0);
      const highOddsWinRate = highOddsBets.length > 0 ? 
        (highOddsBets.filter(bet => bet.result === 'Win').length / highOddsBets.length) * 100 : 0;

      if (highOddsBets.length > completedBets.length * 0.3 && highOddsWinRate < 25) {
        recommendations.push({
          strategy: 'Зменшення ризику',
          reason: `Низький успіх на високих коефіцієнтах (${highOddsWinRate.toFixed(1)}%)`,
          impact: 'medium',
          implementation: 'Фокусуйтесь на коефіцієнтах 1.5-2.5 для стабільнішого зростання'
        });
      }

      const amounts = completedBets.map(bet => bet.amount || 0);
      const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      const maxAmount = Math.max(...amounts);
      
      if (maxAmount > avgAmount * 3) {
        recommendations.push({
          strategy: 'Банкрол-менеджмент',
          reason: 'Виявлено непостійність у розмірах ставок',
          impact: 'high',
          implementation: 'Використовуйте фіксований відсоток від банкролу (2-3%) для кожної ставки'
        });
      }

      let maxLossStreak = 0;
      let tempLossStreak = 0;

      completedBets.forEach(bet => {
        if (bet.result === 'Loss') {
          tempLossStreak++;
          maxLossStreak = Math.max(maxLossStreak, tempLossStreak);
        } else {
          tempLossStreak = 0;
        }
      });

      if (maxLossStreak > 5) {
        recommendations.push({
          strategy: 'Психологічна стійкість',
          reason: `Максимальна серія програшів: ${maxLossStreak}`,
          impact: 'medium',
          implementation: 'Встановіть правило: після 3 програшів поспіль - пауза на 24 години'
        });
      }

      const totalProfit = completedBets.reduce((sum, bet) => sum + (bet.profit || 0), 0);
      if (totalProfit > 0 && winRate > 55) {
        recommendations.push({
          strategy: 'Масштабування',
          reason: `Стабільна прибутковість: +${totalProfit.toFixed(2)} ₴, WR: ${winRate.toFixed(1)}%`,
          impact: 'low',
          implementation: 'Розгляньте поступове збільшення розміру ставок на 10-20%'
        });
      }
    }

    setRecommendations(recommendations);
  };

  const generateForecastData = () => {
    const completedBets = bets.filter(bet => bet.result !== 'Pending');
    if (completedBets.length < 5) return;

    const weeklyData: { [key: string]: { profit: number; bets: number } } = {};
    
    completedBets.forEach(bet => {
      const date = new Date(bet.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { profit: 0, bets: 0 };
      }
      
      weeklyData[weekKey].profit += bet.profit || 0;
      weeklyData[weekKey].bets++;
    });

    const historicalWeeks = Object.entries(weeklyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data], index) => ({
        week: `Тиждень ${index + 1}`,
        historical: Math.round(data.profit * 100) / 100,
        predicted: null,
        confidence: null,
        bets: data.bets
      }));

    const avgWeeklyProfit = historicalWeeks.reduce((sum, week) => sum + (week.historical || 0), 0) / historicalWeeks.length;
    const trend = historicalWeeks.length > 1 ? 
      ((historicalWeeks[historicalWeeks.length - 1].historical || 0) - (historicalWeeks[0].historical || 0)) / historicalWeeks.length : 0;

    const forecastWeeks: ForecastDataPoint[] = [];
    for (let i = 1; i <= 4; i++) {
      const predictedProfit = avgWeeklyProfit + (trend * i);
      forecastWeeks.push({
        week: `Прогноз ${i}`,
        historical: null,
        predicted: Math.round(predictedProfit * 100) / 100,
        confidence: Math.max(30, 90 - (i * 15)),
        bets: null
      });
    }

    const combinedData: ForecastDataPoint[] = [
      ...historicalWeeks,
      ...forecastWeeks
    ];

    setForecastData(combinedData);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-700 border-0';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-0';
      default: return 'bg-blue-100 text-blue-700 border-0';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="p-2.5 bg-purple-50 rounded-2xl">
          <Brain className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Предиктивна аналітика</h2>
          <p className="text-gray-500 font-medium">AI-прогнози та рекомендації стратегій</p>
        </div>
        <Badge className="ml-auto rounded-full bg-purple-100 text-purple-700 border-0">
          Впевненість: {confidenceScore}%
        </Badge>
      </div>

      {confidenceScore < 50 && (
        <Alert className="rounded-2xl border-0 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700 font-medium">
            Недостатньо даних для точних прогнозів. Рекомендується мінімум 20 завершених ставок.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {predictions.map((prediction) => (
          <Card key={prediction.metric} className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-900">
                {getTrendIcon(prediction.trend)}
                {prediction.metric}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Поточне:</span>
                  <span className="font-medium text-gray-900">
                    {prediction.metric === 'Прибуток на ставку' 
                      ? `${prediction.current.toFixed(2)} ₴`
                      : `${prediction.current.toFixed(1)}%`
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Прогноз:</span>
                  <span className={`font-semibold ${prediction.predicted > prediction.current ? 'text-green-600' : 'text-red-600'}`}>
                    {prediction.metric === 'Прибуток на ставку' 
                      ? `${prediction.predicted.toFixed(2)} ₴`
                      : `${prediction.predicted.toFixed(1)}%`
                    }
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Впевненість</span>
                    <span className="text-gray-900 font-medium">{prediction.confidence.toFixed(0)}%</span>
                  </div>
                  <Progress value={prediction.confidence} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {forecastData.length > 0 && (
        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Прогноз тижневого прибутку</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number | string, name: string) => [
                    `${value} ₴`,
                    name === 'historical' ? 'Історичний' : 'Прогноз'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="historical" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                  name="historical"
                />
                <Area 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.3}
                  strokeDasharray="5 5"
                  name="predicted"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Рекомендації стратегій
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold flex items-center gap-2 text-gray-900">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {rec.strategy}
                  </h4>
                  <Badge className={`${getImpactColor(rec.impact)} rounded-full`}>
                    {rec.impact === 'high' ? 'Високий' : rec.impact === 'medium' ? 'Середній' : 'Низький'} вплив
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                <p className="text-sm font-medium text-blue-700">
                  💡 {rec.implementation}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}