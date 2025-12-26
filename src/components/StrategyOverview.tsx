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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { realGoogleSheetsService, CS2Strategy } from '@/lib/realGoogleSheets';
import { Target, TrendingUp, AlertTriangle, Plus, BarChart3, Trophy, Brain, Lightbulb, Trash2, Star, X } from 'lucide-react';
import { toast } from 'sonner';

interface BetData {
  strategy?: string;
  amount?: number;
  result?: string;
  profit?: number;
}

interface StrategyStats {
  totalBets: number;
  wins: number;
  losses: number;
  pending: number;
  totalProfit: number;
  totalStake: number;
  winRate: number;
  roi: number;
}

export default function StrategyOverview() {
  const [strategies, setStrategies] = useState<CS2Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [bettingData, setBettingData] = useState<BetData[]>([]);
  const [strategyStats, setStrategyStats] = useState<Record<string, StrategyStats>>({});
  const [primaryStrategy, setPrimaryStrategy] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [strategyToDelete, setStrategyToDelete] = useState<string | null>(null);

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
      const betsData = await realGoogleSheetsService.fetchUSDTData();
      
      // Load ONLY custom strategies from localStorage (no mock data)
      const customStrategies = loadCustomStrategiesFromStorage();
      setStrategies(customStrategies);
      setBettingData(betsData);
      calculateStrategyStats(betsData);
      
      // Load primary strategy from localStorage
      const saved = localStorage.getItem('primaryStrategy');
      if (saved) {
        setPrimaryStrategy(saved);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomStrategiesFromStorage = (): CS2Strategy[] => {
    try {
      const saved = localStorage.getItem('customStrategies');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading custom strategies:', error);
    }
    return [];
  };

  const saveCustomStrategiesToStorage = (strategies: CS2Strategy[]) => {
    try {
      localStorage.setItem('customStrategies', JSON.stringify(strategies));
    } catch (error) {
      console.error('Error saving custom strategies:', error);
    }
  };

  const calculateStrategyStats = (bets: BetData[]) => {
    const stats: Record<string, StrategyStats> = {};
    
    bets.forEach(bet => {
      const strategy = bet.strategy || 'Без стратегії';
      if (!stats[strategy]) {
        stats[strategy] = {
          totalBets: 0,
          wins: 0,
          losses: 0,
          pending: 0,
          totalProfit: 0,
          totalStake: 0,
          winRate: 0,
          roi: 0
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
    
    Object.keys(stats).forEach(strategy => {
      const completedBets = stats[strategy].wins + stats[strategy].losses;
      stats[strategy].winRate = completedBets > 0 ? (stats[strategy].wins / completedBets) * 100 : 0;
      stats[strategy].roi = stats[strategy].totalStake > 0 ? (stats[strategy].totalProfit / stats[strategy].totalStake) * 100 : 0;
    });
    
    setStrategyStats(stats);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 border-0 rounded-full';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-0 rounded-full';
      case 'High': return 'bg-red-100 text-red-800 border-0 rounded-full';
      default: return 'bg-gray-100 text-gray-800 border-0 rounded-full';
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

  const parseCriteriaForValidation = (criteria: string[]): { 
    minOdds?: number; 
    maxOdds?: number; 
    allowedFormats?: string[];
    allowedBetTypes?: string[];
  } => {
    const result: { 
      minOdds?: number; 
      maxOdds?: number; 
      allowedFormats?: string[];
      allowedBetTypes?: string[];
    } = {};
    
    criteria.forEach(criterion => {
      const lowerCriterion = criterion.toLowerCase();
      
      // Parse min odds
      const minOddsMatch = lowerCriterion.match(/(?:мін|мінімальний|minimum|min).*?коеф.*?(\d+\.?\d*)/i);
      if (minOddsMatch) {
        result.minOdds = parseFloat(minOddsMatch[1]);
      }
      
      // Parse max odds
      const maxOddsMatch = lowerCriterion.match(/(?:макс|максимальний|maximum|max).*?коеф.*?(\d+\.?\d*)/i);
      if (maxOddsMatch) {
        result.maxOdds = parseFloat(maxOddsMatch[1]);
      }
      
      // Parse allowed formats
      const formatMatch = lowerCriterion.match(/формат.*?(bo[135](?:,?\s*(?:та|і|and|,)\s*bo[135])*)/i);
      if (formatMatch) {
        const formats = formatMatch[1].toUpperCase().match(/BO[135]/g);
        if (formats) {
          result.allowedFormats = formats;
        }
      }
      
      // Parse bet types
      if (lowerCriterion.includes('тільки експрес') || lowerCriterion.includes('только экспресс')) {
        result.allowedBetTypes = ['Експрес'];
      } else if (lowerCriterion.includes('тільки ординар') || lowerCriterion.includes('только ординар')) {
        result.allowedBetTypes = ['Ординар'];
      } else if (lowerCriterion.includes('тільки система') || lowerCriterion.includes('только система')) {
        result.allowedBetTypes = ['Система'];
      } else if (lowerCriterion.match(/експрес.*(?:та|і|and).*(?:система|ординар)/i) || 
                 lowerCriterion.match(/(?:система|ординар).*(?:та|і|and).*експрес/i)) {
        // Parse multiple bet types
        const betTypes: string[] = [];
        if (lowerCriterion.includes('експрес') || lowerCriterion.includes('экспресс')) betTypes.push('Експрес');
        if (lowerCriterion.includes('ординар')) betTypes.push('Ординар');
        if (lowerCriterion.includes('система')) betTypes.push('Система');
        if (betTypes.length > 0) result.allowedBetTypes = betTypes;
      }
    });
    
    return result;
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

    // Parse criteria to extract validation rules
    const validationRules = parseCriteriaForValidation(validCriteria);

    const strategy: CS2Strategy = {
      name: newStrategy.name,
      description: newStrategy.description,
      criteria: validCriteria,
      riskLevel: newStrategy.riskLevel,
      expectedROI: newStrategy.expectedROI,
      ...validationRules
    };

    const customStrategies = loadCustomStrategiesFromStorage();
    customStrategies.push(strategy);
    saveCustomStrategiesToStorage(customStrategies);
    
    setStrategies(prev => [...prev, strategy]);
    
    setNewStrategy({
      name: '',
      description: '',
      criteria: [''],
      riskLevel: 'Medium',
      expectedROI: 10
    });

    toast.success('Стратегія успішно додана!');
  };

  const confirmDeleteStrategy = (strategyName: string) => {
    setStrategyToDelete(strategyName);
    setDeleteDialogOpen(true);
  };

  const deleteStrategy = () => {
    if (!strategyToDelete) return;

    const customStrategies = loadCustomStrategiesFromStorage();
    const updatedStrategies = customStrategies.filter(s => s.name !== strategyToDelete);
    saveCustomStrategiesToStorage(updatedStrategies);

    setStrategies(updatedStrategies);
    
    // If deleted strategy was primary, clear it
    if (primaryStrategy === strategyToDelete) {
      setPrimaryStrategy(null);
      localStorage.removeItem('primaryStrategy');
    }
    
    toast.success('Стратегія успішно видалена!');
    setDeleteDialogOpen(false);
    setStrategyToDelete(null);
  };

  const togglePrimaryStrategy = (strategyName: string) => {
    if (primaryStrategy === strategyName) {
      // Unset as primary
      setPrimaryStrategy(null);
      localStorage.removeItem('primaryStrategy');
      toast.success('Основну стратегію скасовано');
    } else {
      // Set as primary
      setPrimaryStrategy(strategyName);
      localStorage.setItem('primaryStrategy', strategyName);
      toast.success(`"${strategyName}" встановлено як основну стратегію!`);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="text-center text-gray-600">Завантаження стратегій...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
          <div className="p-2 bg-purple-50 rounded-2xl">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          Мої стратегії
        </h2>
        <p className="text-gray-500 font-medium mt-1">Управління та аналіз ваших стратегій ставок на CS2</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-2xl border-0">
          <TabsTrigger value="overview" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Огляд стратегій</TabsTrigger>
          <TabsTrigger value="performance" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Ефективність</TabsTrigger>
          <TabsTrigger value="create" className="rounded-xl font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Створити нову</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {strategies.length === 0 ? (
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-12 text-center">
                <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Немає стратегій</h3>
                <p className="text-gray-600 mb-4">Створіть свою першу стратегію для ставок на CS2</p>
                <Button onClick={() => document.querySelector('[value="create"]')?.dispatchEvent(new Event('click', { bubbles: true }))} className="rounded-xl bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Створити стратегію
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {strategies.map((strategy, index) => {
                const stats = strategyStats[strategy.name] || {};
                const isPrimary = primaryStrategy === strategy.name;
                
                return (
                  <Card key={index} className={`border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden ${isPrimary ? 'ring-2 ring-blue-500' : ''}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-900">
                        <span className="flex items-center gap-2">
                          {getRiskIcon(strategy.riskLevel)}
                          {strategy.name}
                          {isPrimary && (
                            <Badge className="bg-blue-100 text-blue-700 border-0 rounded-full ml-2">
                              <Star className="h-3 w-3 mr-1 fill-blue-700" />
                              Основна
                            </Badge>
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge className={getRiskColor(strategy.riskLevel)}>
                            {strategy.riskLevel} Risk
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-gray-600">{strategy.description}</p>
                      
                      {(strategy.maxOdds || strategy.minOdds || strategy.allowedFormats || strategy.allowedBetTypes) && (
                        <div className="p-3 bg-blue-50 rounded-2xl space-y-2">
                          <p className="text-xs font-semibold text-blue-900 uppercase">Обмеження стратегії:</p>
                          {strategy.minOdds && (
                            <div className="text-xs text-blue-700">
                              • Мінімальний коефіцієнт: <span className="font-bold">{strategy.minOdds}</span>
                            </div>
                          )}
                          {strategy.maxOdds && (
                            <div className="text-xs text-blue-700">
                              • Максимальний коефіцієнт: <span className="font-bold">{strategy.maxOdds}</span>
                            </div>
                          )}
                          {strategy.allowedFormats && strategy.allowedFormats.length > 0 && (
                            <div className="text-xs text-blue-700">
                              • Дозволені формати: <span className="font-bold">{strategy.allowedFormats.join(', ')}</span>
                            </div>
                          )}
                          {strategy.allowedBetTypes && strategy.allowedBetTypes.length > 0 && (
                            <div className="text-xs text-blue-700">
                              • Дозволені типи ставок: <span className="font-bold">{strategy.allowedBetTypes.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {stats.totalBets > 0 && (
                        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-2xl">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-900">{stats.totalBets}</div>
                            <div className="text-xs text-gray-600 font-medium">Всього ставок</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-lg font-semibold ${stats.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                              {stats.winRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-600 font-medium">Win Rate</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-lg font-semibold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(0)} ₴
                            </div>
                            <div className="text-xs text-gray-600 font-medium">Прибуток</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-lg font-semibold ${stats.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-600 font-medium">ROI</div>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Очікуваний ROI</span>
                          <span className="text-sm text-green-600 font-medium">+{strategy.expectedROI}%</span>
                        </div>
                        <Progress value={Math.min(strategy.expectedROI, 100)} className="h-2" />
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2 text-gray-900">
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

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => togglePrimaryStrategy(strategy.name)}
                          variant="outline"
                          className={`flex-1 rounded-xl ${isPrimary ? 'border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                          <Star className={`h-4 w-4 mr-2 ${isPrimary ? 'fill-blue-700' : ''}`} />
                          {isPrimary ? 'Основна' : 'Зробити основною'}
                        </Button>
                        <Button
                          onClick={() => confirmDeleteStrategy(strategy.name)}
                          variant="outline"
                          className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <BarChart3 className="h-4 w-4" />
                  Загальна статистика
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Всього стратегій:</span>
                    <span className="font-medium text-gray-900">{strategies.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Всього ставок:</span>
                    <span className="font-medium text-gray-900">{bettingData.length}</span>
                  </div>
                  {Object.keys(strategyStats).length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Найкраща стратегія:</span>
                      <span className="font-medium text-green-600">
                        {Object.keys(strategyStats).reduce((best, current) => 
                          (strategyStats[current]?.roi || 0) > (strategyStats[best]?.roi || 0) ? current : best, 
                          Object.keys(strategyStats)[0] || 'Немає'
                        )}
                      </span>
                    </div>
                  )}
                  {primaryStrategy && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Основна стратегія:</span>
                      <span className="font-medium text-blue-600 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-blue-600" />
                        {primaryStrategy}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Trophy className="h-4 w-4" />
                  Топ по ROI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(strategyStats).length > 0 ? (
                    Object.entries(strategyStats)
                      .sort(([,a], [,b]) => (b as StrategyStats).roi - (a as StrategyStats).roi)
                      .slice(0, 5)
                      .map(([name, stats]: [string, StrategyStats], index) => (
                        <div key={name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                            <span className="text-sm truncate text-gray-900 flex items-center gap-1">
                              {name}
                              {primaryStrategy === name && <Star className="h-3 w-3 fill-blue-600 text-blue-600" />}
                            </span>
                          </div>
                          <span className={`text-sm font-medium ${stats.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
                          </span>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Немає даних для відображення</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Lightbulb className="h-4 w-4" />
                  Рекомендації
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-blue-50 rounded-2xl">
                    <div className="font-medium text-blue-800">💡 Порада</div>
                    <div className="text-blue-700">Використовуйте стратегії з ROI більше 5% для стабільного зростання</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-2xl">
                    <div className="font-medium text-yellow-800">⚠️ Увага</div>
                    <div className="text-yellow-700">Уникайте ризикованих команд при використанні консервативних стратегій</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-2xl">
                    <div className="font-medium text-green-800">✅ Успіх</div>
                    <div className="text-green-700">Ведіть детальну статистику для покращення стратегій</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Plus className="h-4 w-4" />
                Створити нову стратегію
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Як додати обмеження до стратегії:
                </h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>• <strong>Для обмеження коефіцієнтів:</strong> напишіть "Мінімальний коефіцієнт 1.5" або "Максимальний коефіцієнт 2.5"</p>
                  <p>• <strong>Для обмеження форматів:</strong> напишіть "Формат тільки BO3" або "Формат BO1 та BO3"</p>
                  <p>• <strong>Для обмеження типів ставок:</strong> напишіть "Тільки експреси", "Тільки ординари" або "Експреси та системи"</p>
                  <p className="pt-2 text-xs text-blue-700">Приклади критеріїв:</p>
                  <ul className="list-disc list-inside text-xs text-blue-700 space-y-1 ml-2">
                    <li>"Мінімальний коефіцієнт 1.3"</li>
                    <li>"Максимальний коефіцієнт 2.0"</li>
                    <li>"Формат тільки BO3"</li>
                    <li>"Тільки експреси"</li>
                    <li>"Аналіз останніх 10 матчів команд"</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="strategyName" className="text-gray-700 font-medium">Назва стратегії *</Label>
                  <Input
                    id="strategyName"
                    value={newStrategy.name}
                    onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})}
                    placeholder="Наприклад: Консервативна стратегія"
                    className="rounded-xl"
                  />
                </div>
                
                <div>
                  <Label htmlFor="riskLevel" className="text-gray-700 font-medium">Рівень ризику *</Label>
                  <Select value={newStrategy.riskLevel} onValueChange={(value: 'Low' | 'Medium' | 'High') => setNewStrategy({...newStrategy, riskLevel: value})}>
                    <SelectTrigger className="rounded-xl">
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
                <Label htmlFor="description" className="text-gray-700 font-medium">Опис стратегії *</Label>
                <Textarea
                  id="description"
                  value={newStrategy.description}
                  onChange={(e) => setNewStrategy({...newStrategy, description: e.target.value})}
                  placeholder="Детальний опис стратегії, коли її використовувати..."
                  rows={3}
                  className="rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="expectedROI" className="text-gray-700 font-medium">Очікуваний ROI (%) *</Label>
                <Input
                  id="expectedROI"
                  type="number"
                  min="0"
                  max="100"
                  value={newStrategy.expectedROI}
                  onChange={(e) => setNewStrategy({...newStrategy, expectedROI: parseInt(e.target.value) || 0})}
                  className="rounded-xl"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-gray-700 font-medium">Критерії стратегії *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCriterion} className="rounded-xl">
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
                        placeholder={index === 0 ? "Наприклад: Мінімальний коефіцієнт 1.5" : `Критерій ${index + 1}`}
                        className="rounded-xl"
                      />
                      {newStrategy.criteria.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCriterion(index)}
                          className="rounded-xl"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={saveStrategy} className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 font-medium">
                <Plus className="h-4 w-4 mr-2" />
                Зберегти стратегію
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Видалити стратегію?
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Ви впевнені, що хочете видалити стратегію <span className="font-semibold text-gray-900">"{strategyToDelete}"</span>?
              <br />
              <br />
              Ця дія незворотна. Статистика ставок, пов'язаних з цією стратегією, залишиться незмінною.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-xl"
            >
              Скасувати
            </Button>
            <Button
              variant="destructive"
              onClick={deleteStrategy}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}