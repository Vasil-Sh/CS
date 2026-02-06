import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Brain, Target, AlertCircle, Lightbulb, Star, HelpCircle } from 'lucide-react';
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
        metric: 'Прибуток на прогноз',
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
          implementation: 'Використовуйте фіксований відсоток від банкролу (2-3%) для кожного прогнозу'
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
      case 'high': return 'bg-[#FFE8E8] text-[#D32F2F] hover:bg-[#FFE8E8] border-2 border-[#FFCDD2]';
      case 'medium': return 'bg-[#FFF4E6] text-[#F57C00] hover:bg-[#FFF4E6] border-2 border-[#FFE0B2]';
      default: return 'bg-[#E3F2FD] text-[#1976D2] hover:bg-[#E3F2FD] border-2 border-[#BBDEFB]';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-[#4CAF50]" strokeWidth={1.5} />;
      case 'down': return <TrendingUp className="h-4 w-4 text-[#D32F2F] rotate-180" strokeWidth={1.5} />;
      default: return <div className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card - Білий фон замість сірого */}
      <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
        <CardHeader className="bg-white border-b-2 border-[#E8E6DC] p-8">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-3xl font-light text-black">
              <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_8px_20px_rgba(244,225,87,0.4)]">
                <Brain className="h-6 w-6 text-black" strokeWidth={1.5} />
              </div>
              Предиктивна аналітика
              <button
                className="p-2.5 bg-[#F4E157] rounded-[16px] shadow-[0_4px_12px_rgba(244,225,87,0.4)] hover:shadow-[0_6px_16px_rgba(244,225,87,0.6)] transition-all ml-2"
                title="AI-прогнози базуються на історичних даних та трендах ваших ставок"
              >
                <HelpCircle className="h-5 w-5 text-black" strokeWidth={2} />
              </button>
            </CardTitle>
            <Badge className="bg-[#E8F5E9] text-[#4CAF50] hover:bg-[#E8F5E9] px-5 py-2 rounded-[20px] border-2 border-[#C8E6C9] font-normal text-base">
              Впевненість: {confidenceScore}%
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {confidenceScore < 50 && (
        <Alert className="rounded-[28px] border-2 border-[#FFE0B2] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-6">
          <AlertCircle className="h-5 w-5 text-[#F57C00]" strokeWidth={1.5} />
          <AlertDescription className="font-light text-black ml-2">
            <strong className="font-normal">Недостатньо даних для точних прогнозів.</strong> Рекомендується мінімум 20 завершених ставок.
          </AlertDescription>
        </Alert>
      )}

      {/* Prediction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {predictions.map((prediction) => (
          <Card key={prediction.metric} className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[#C4C2B8] transition-all duration-300">
            <CardHeader className="pb-4 pt-7 px-7">
              <CardTitle className="text-sm font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2">
                {getTrendIcon(prediction.trend)}
                {prediction.metric}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6B6B6B] font-light">Поточне:</span>
                  <span className="text-2xl font-light text-black">
                    {prediction.metric === 'Прибуток на прогноз' 
                      ? `${prediction.current.toFixed(2)} ₴`
                      : `${prediction.current.toFixed(1)}%`
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6B6B6B] font-light">Прогноз:</span>
                  <span className={`text-2xl font-normal ${prediction.predicted > prediction.current ? 'text-[#4CAF50]' : 'text-[#D32F2F]'}`}>
                    {prediction.metric === 'Прибуток на прогноз' 
                      ? `${prediction.predicted.toFixed(2)} ₴`
                      : `${prediction.predicted.toFixed(1)}%`
                    }
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#6B6B6B] font-light">Впевненість</span>
                    <span className="text-black font-normal">{prediction.confidence.toFixed(0)}%</span>
                  </div>
                  <Progress value={prediction.confidence} className="h-2 bg-[#E8E6DC]" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Forecast Chart */}
      {forecastData.length > 0 && (
        <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
          <CardHeader className="bg-white border-b-2 border-[#E8E6DC] p-8">
            <CardTitle className="flex items-center gap-3 text-3xl font-light text-black">
              <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_2px_8px_rgba(244,225,87,0.3)]">
                <Target className="h-6 w-6 text-black" strokeWidth={1.5} />
              </div>
              Прогноз тижневого прибутку
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C4A57B" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#C4A57B" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4B896" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#D4B896" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 12, fill: '#000' }}
                  stroke="#000"
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#000' }}
                  stroke="#000"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number | string, name: string) => [
                    `${value} ₴`,
                    name === 'historical' ? 'Історичний' : 'Прогноз'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="historical" 
                  stroke="#C4A57B" 
                  strokeWidth={2}
                  fill="url(#colorHistorical)" 
                  fillOpacity={1}
                  name="historical"
                />
                <Area 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#D4B896" 
                  strokeWidth={2}
                  fill="url(#colorPredicted)" 
                  fillOpacity={1}
                  strokeDasharray="5 5"
                  name="predicted"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
        <CardHeader className="bg-white border-b-2 border-[#E8E6DC] p-8">
          <CardTitle className="flex items-center gap-3 text-3xl font-light text-black">
            <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_2px_8px_rgba(244,225,87,0.3)]">
              <Lightbulb className="h-6 w-6 text-black" strokeWidth={1.5} />
            </div>
            Рекомендації стратегій
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div 
                key={index} 
                className="p-6 border-2 border-[#E8E6DC] rounded-[24px] hover:bg-[#FAFAF8] hover:border-[#D4D2C8] transition-all duration-300"
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(196,165,123,0.03) 4px, rgba(196,165,123,0.03) 5px)`
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-normal text-black text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-[#F4E157]" strokeWidth={1.5} fill="#F4E157" />
                    {rec.strategy}
                  </h4>
                  <Badge className={`${getImpactColor(rec.impact)} rounded-[16px] font-normal px-4 py-2`}>
                    {rec.impact === 'high' ? 'Високий' : rec.impact === 'medium' ? 'Середній' : 'Низький'} вплив
                  </Badge>
                </div>
                <p className="text-sm text-[#6B6B6B] font-light mb-3">{rec.reason}</p>
                <p className="text-sm font-normal text-black bg-[#F5F5F3] p-4 rounded-[16px] border-2 border-[#E8E6DC]">
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