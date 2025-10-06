import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { realGoogleSheetsService, CS2Strategy } from '@/lib/realGoogleSheets';
import { Target, TrendingUp, AlertTriangle, Plus, BarChart3, Users, Trophy, Brain, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

export default function StrategyOverview() {
  const [strategies, setStrategies] = useState<CS2Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [bettingData, setBettingData] = useState<any[]>([]);
  const [strategyStats, setStrategyStats] = useState<any>({});

  // Форма нової стратегії
  const [newStrategy, setNewStrategy] = useState({
    name: '',
    description: '',
    criteria: [''],
    riskLevel: 'Medium' as 'Low' | 'Medium' | 'High',
    expectedROI: 10
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [strategiesData, betsData] = await Promise.all([
        realGoogleSheetsService.fetchStrategyData(),
        realGoogleSheetsService.fetchUSDTData()
      ]);
      
      setStrategies(strategiesData);
      setBettingData(betsData);
      calculateStrategyStats(betsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStrategyStats = (bets: any[]) => {
    const stats: any = {};
    
    // Групуємо ставки по стратегіях
    bets.forEach(bet => {
      const strategy = bet.strategy || 'Без стратегії';
      if (!stats[strategy]) {
        stats[strategy] = {
          totalBets: 0,
          wins: 0,
          losses: 0,
          pending: 0,
          totalProfit: 0,
          totalStake: 0
        };
      }
      
      stats[strategy].totalBets++;
      stats[strategy].totalStake += bet.amount || 0;
      
      if (bet.result === 'Win') {
        stats[strategy].wins++;
        stats[strategy].totalProfit += bet.profit || 0;
      } else if (bet.result === 'Loss') {
        stats[strategy].losses++;
        stats[strategy].totalProfit += bet.profit || 0;
      } else {
        stats[strategy].pending++;
      }
    });
    
    // Розраховуємо відсотки та ROI
    Object.keys(stats).forEach(strategy => {
      const completedBets = stats[strategy].wins + stats[strategy].losses;
      stats[strategy].winRate = completedBets > 0 ? (stats[strategy].wins / completedBets) * 100 : 0;
      stats[strategy].roi = stats[strategy].totalStake > 0 ? (stats[strategy].totalProfit / stats[strategy].totalStake) * 100 : 0;
    });
    
    setStrategyStats(stats);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'Low': return <Target className="h-4 w-4" />;
      case 'Medium': return <TrendingUp className="h-4 w-4" />;
      case 'High': return <AlertTriangle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const addCriterion = () => {
    setNewStrategy(prev => ({
      ...prev,
      criteria: [...prev.criteria, '']
    }));
  };

  const updateCriterion = (index: number, value: string) => {
    setNewStrategy(prev => ({
      ...prev,
      criteria: prev.criteria.map((c, i) => i === index ? value : c)
    }));
  };

  const removeCriterion = (index: number) => {
    setNewStrategy(prev => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index)
    }));
  };

  const saveStrategy = () => {
    if (!newStrategy.name || !newStrategy.description) {
      toast.error('Заповніть назву та опис стратегії');
      return;
    }

    const validCriteria = newStrategy.criteria.filter(c => c.trim() !== '');
    if (validCriteria.length === 0) {
      toast.error('Додайте хоча б один критерій');
      return;
    }

    const strategy: CS2Strategy = {
      ...newStrategy,
      criteria: validCriteria
    };

    setStrategies(prev => [...prev, strategy]);
    
    // Скидаємо форму
    setNewStrategy({
      name: '',
      description: '',
      criteria: [''],
      riskLevel: 'Medium',
      expectedROI: 10
    });

    toast.success('Стратегія успішно додана!');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Завантаження стратегій...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Brain className="h-6 w-6" />
          Мої стратегії
        </h2>
        <p className="text-gray-600">Управління та аналіз ваших стратегій ставок на CS2</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Огляд стратегій</TabsTrigger>
          <TabsTrigger value="performance">Ефективність</TabsTrigger>
          <TabsTrigger value="create">Створити нову</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {strategies.map((strategy, index) => {
              const stats = strategyStats[strategy.name] || {};
              
              return (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {getRiskIcon(strategy.riskLevel)}
                        {strategy.name}
                      </span>
                      <Badge className={getRiskColor(strategy.riskLevel)} variant="secondary">
                        {strategy.riskLevel} Risk
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-gray-600">{strategy.description}</p>
                    
                    {/* Статистика стратегії */}
                    {stats.totalBets > 0 && (
                      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-lg font-semibold">{stats.totalBets}</div>
                          <div className="text-xs text-gray-600">Всього ставок</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-semibold ${stats.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.winRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-600">Win Rate</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-semibold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(0)} ₴
                          </div>
                          <div className="text-xs text-gray-600">Прибуток</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-semibold ${stats.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-600">ROI</div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Очікуваний ROI</span>
                        <span className="text-sm text-green-600">+{strategy.expectedROI}%</span>
                      </div>
                      <Progress value={Math.min(strategy.expectedROI, 100)} className="h-2" />
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Критерії стратегії:
                      </h4>
                      <ul className="space-y-1">
                        {strategy.criteria.map((criterion, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            {criterion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Загальна статистика */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Загальна статистика
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Всього стратегій:</span>
                    <span className="font-medium">{strategies.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Всього ставок:</span>
                    <span className="font-medium">{bettingData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Найкраща стратегія:</span>
                    <span className="font-medium text-green-600">
                      {Object.keys(strategyStats).reduce((best, current) => 
                        (strategyStats[current]?.roi || 0) > (strategyStats[best]?.roi || 0) ? current : best, 
                        Object.keys(strategyStats)[0] || 'Немає'
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Топ стратегії по ROI */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Топ по ROI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(strategyStats)
                    .sort(([,a], [,b]) => (b as any).roi - (a as any).roi)
                    .slice(0, 5)
                    .map(([name, stats]: [string, any], index) => (
                      <div key={name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                          <span className="text-sm truncate">{name}</span>
                        </div>
                        <span className={`text-sm font-medium ${stats.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Рекомендації */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Рекомендації
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-800">💡 Порада</div>
                    <div className="text-blue-700">Використовуйте стратегії з ROI більше 5% для стабільного зростання</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="font-medium text-yellow-800">⚠️ Увага</div>
                    <div className="text-yellow-700">Уникайте ризикованих команд при використанні консервативних стратегій</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-800">✅ Успіх</div>
                    <div className="text-green-700">Ведіть детальну статистику для покращення стратегій</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Створити нову стратегію
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="strategyName">Назва стратегії</Label>
                  <Input
                    id="strategyName"
                    value={newStrategy.name}
                    onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})}
                    placeholder="Наприклад: Стратегія фаворитів"
                  />
                </div>
                
                <div>
                  <Label htmlFor="riskLevel">Рівень ризику</Label>
                  <Select value={newStrategy.riskLevel} onValueChange={(value: any) => setNewStrategy({...newStrategy, riskLevel: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Низький</SelectItem>
                      <SelectItem value="Medium">Середній</SelectItem>
                      <SelectItem value="High">Високий</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Опис стратегії</Label>
                <Textarea
                  id="description"
                  value={newStrategy.description}
                  onChange={(e) => setNewStrategy({...newStrategy, description: e.target.value})}
                  placeholder="Детальний опис стратегії, коли її використовувати..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="expectedROI">Очікуваний ROI (%)</Label>
                <Input
                  id="expectedROI"
                  type="number"
                  min="0"
                  max="100"
                  value={newStrategy.expectedROI}
                  onChange={(e) => setNewStrategy({...newStrategy, expectedROI: parseInt(e.target.value) || 0})}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Критерії стратегії</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCriterion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Додати критерій
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {newStrategy.criteria.map((criterion, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={criterion}
                        onChange={(e) => updateCriterion(index, e.target.value)}
                        placeholder={`Критерій ${index + 1}`}
                      />
                      {newStrategy.criteria.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCriterion(index)}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={saveStrategy} className="w-full">
                Зберегти стратегію
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}