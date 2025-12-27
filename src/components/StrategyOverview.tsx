import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { realGoogleSheetsService, CS2Strategy } from '@/lib/realGoogleSheets';
import { Target, TrendingUp, AlertTriangle, Plus, BarChart3, Trophy, Brain, Lightbulb, Trash2, Star, X, Info, Search, ArrowUpDown, Filter, ChevronDown, Eye, Zap, TrendingDown, PieChart } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, Line, ComposedChart } from 'recharts';

interface BetData {
  strategy?: string;
  amount?: number;
  result?: string;
  profit?: number;
  date?: string;
  betType?: string;
  format?: string;
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
  profitHistory?: number[];
}

interface StrategyTemplate {
  name: string;
  description: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  expectedROI: number;
  criteria: string[];
}

interface BetTypeStats {
  type: string;
  count: number;
  winRate: number;
  roi: number;
  profit: number;
}

const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    name: 'Консервативна стратегія',
    description: 'Безпечний підхід з низьким ризиком. Підходить для стабільного зростання банку.',
    riskLevel: 'Low',
    expectedROI: 8,
    criteria: [
      'Мінімальний коефіцієнт 1.3',
      'Максимальний коефіцієнт 1.8',
      'Формат тільки BO3',
      'Тільки ординари',
      'Аналіз останніх 10 матчів команд'
    ]
  },
  {
    name: 'Збалансована стратегія',
    description: 'Оптимальне співвідношення ризику та прибутку. Універсальний підхід.',
    riskLevel: 'Medium',
    expectedROI: 15,
    criteria: [
      'Мінімальний коефіцієнт 1.5',
      'Максимальний коефіцієнт 2.5',
      'Формат BO1 та BO3',
      'Експреси та ординари',
      'Розмір ставки 2-3% від банку'
    ]
  },
  {
    name: 'Агресивна стратегія',
    description: 'Високий ризик, високий прибуток. Для досвідчених гравців.',
    riskLevel: 'High',
    expectedROI: 25,
    criteria: [
      'Мінімальний коефіцієнт 2.0',
      'Тільки експреси',
      'Формат BO1 та BO3',
      'Розмір ставки 5% від банку',
      'Фокус на андердогах'
    ]
  }
];

export default function StrategyOverview() {
  const [strategies, setStrategies] = useState<CS2Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [bettingData, setBettingData] = useState<BetData[]>([]);
  const [strategyStats, setStrategyStats] = useState<Record<string, StrategyStats>>({});
  const [primaryStrategy, setPrimaryStrategy] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [strategyToDelete, setStrategyToDelete] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<CS2Strategy | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  // Filters and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'roi' | 'profit' | 'name'>('roi');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
      
      const customStrategies = loadCustomStrategiesFromStorage();
      setStrategies(customStrategies);
      setBettingData(betsData);
      calculateStrategyStats(betsData);
      
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
          roi: 0,
          profitHistory: []
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
      
      stats[strategy].profitHistory?.push(stats[strategy].totalProfit);
    });
    
    Object.keys(stats).forEach(strategy => {
      const completedBets = stats[strategy].wins + stats[strategy].losses;
      stats[strategy].winRate = completedBets > 0 ? (stats[strategy].wins / completedBets) * 100 : 0;
      stats[strategy].roi = stats[strategy].totalStake > 0 ? (stats[strategy].totalProfit / stats[strategy].totalStake) * 100 : 0;
    });
    
    setStrategyStats(stats);
  };

  const calculateBetTypeStats = (): BetTypeStats[] => {
    const betTypeMap: Record<string, { count: number; wins: number; totalProfit: number; totalStake: number }> = {};
    
    bettingData.forEach(bet => {
      const type = bet.betType || 'Невідомо';
      if (!betTypeMap[type]) {
        betTypeMap[type] = { count: 0, wins: 0, totalProfit: 0, totalStake: 0 };
      }
      
      betTypeMap[type].count++;
      betTypeMap[type].totalStake += bet.amount || 0;
      
      if (bet.result === 'Win') {
        betTypeMap[type].wins++;
      }
      
      if (bet.result === 'Win' || bet.result === 'Loss') {
        betTypeMap[type].totalProfit += bet.profit || 0;
      }
    });
    
    return Object.entries(betTypeMap).map(([type, data]) => ({
      type,
      count: data.count,
      winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0,
      roi: data.totalStake > 0 ? (data.totalProfit / data.totalStake) * 100 : 0,
      profit: data.totalProfit
    }));
  };

  const getRoiChartData = () => {
    return Object.entries(strategyStats)
      .map(([name, stats]) => {
        const strategy = strategies.find(s => s.name === name);
        return {
          name: name.length > 12 ? name.substring(0, 12) + '...' : name,
          fullName: name,
          roi: parseFloat(stats.roi.toFixed(1)),
          winRate: parseFloat(stats.winRate.toFixed(1)),
          totalBets: stats.totalBets,
          profit: parseFloat(stats.totalProfit.toFixed(0)),
          riskLevel: strategy?.riskLevel || 'Medium'
        };
      })
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 5);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 border-0 rounded-full';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-0 rounded-full';
      case 'High': return 'bg-red-100 text-red-800 border-0 rounded-full';
      default: return 'bg-gray-100 text-gray-800 border-0 rounded-full';
    }
  };

  const getRiskBarColor = (risk: string) => {
    switch (risk) {
      case 'Low': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'High': return '#ef4444';
      default: return '#6b7280';
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
      
      const minOddsMatch = lowerCriterion.match(/(?:мін|мінімальний|minimum|min).*?коеф.*?(\d+\.?\d*)/i);
      if (minOddsMatch) {
        result.minOdds = parseFloat(minOddsMatch[1]);
      }
      
      const maxOddsMatch = lowerCriterion.match(/(?:макс|максимальний|maximum|max).*?коеф.*?(\d+\.?\d*)/i);
      if (maxOddsMatch) {
        result.maxOdds = parseFloat(maxOddsMatch[1]);
      }
      
      const formatMatch = lowerCriterion.match(/формат.*?(bo[135](?:,?\s*(?:та|і|and|,)\s*bo[135])*)/i);
      if (formatMatch) {
        const formats = formatMatch[1].toUpperCase().match(/BO[135]/g);
        if (formats) {
          result.allowedFormats = formats;
        }
      }
      
      if (lowerCriterion.includes('тільки експрес') || lowerCriterion.includes('только экспресс')) {
        result.allowedBetTypes = ['Експрес'];
      } else if (lowerCriterion.includes('тільки ординар') || lowerCriterion.includes('только ординар')) {
        result.allowedBetTypes = ['Ординар'];
      } else if (lowerCriterion.includes('тільки система') || lowerCriterion.includes('только система')) {
        result.allowedBetTypes = ['Система'];
      } else if (lowerCriterion.match(/експрес.*(?:та|і|and).*(?:система|ординар)/i) || 
                 lowerCriterion.match(/(?:система|ординар).*(?:та|і|and).*експрес/i)) {
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

  const applyTemplate = (template: StrategyTemplate) => {
    setNewStrategy({
      name: template.name,
      description: template.description,
      criteria: [...template.criteria],
      riskLevel: template.riskLevel,
      expectedROI: template.expectedROI
    });
    setTemplateDialogOpen(false);
    toast.success(`Шаблон "${template.name}" застосовано!`);
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
      setPrimaryStrategy(null);
      localStorage.removeItem('primaryStrategy');
      toast.success('Основну стратегію скасовано');
    } else {
      setPrimaryStrategy(strategyName);
      localStorage.setItem('primaryStrategy', strategyName);
      toast.success(`"${strategyName}" встановлено як основну стратегію!`);
    }
  };

  const openDetailsDialog = (strategy: CS2Strategy) => {
    setSelectedStrategy(strategy);
    setDetailsDialogOpen(true);
  };

  const renderSparkline = (profitHistory?: number[]) => {
    if (!profitHistory || profitHistory.length < 2) {
      return <div className="h-8 flex items-center justify-center text-xs text-gray-400">Немає даних</div>;
    }

    const max = Math.max(...profitHistory);
    const min = Math.min(...profitHistory);
    const range = max - min || 1;

    const points = profitHistory.map((value, index) => {
      const x = (index / (profitHistory.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    const lastValue = profitHistory[profitHistory.length - 1];
    const prevValue = profitHistory[profitHistory.length - 2];
    const trend = lastValue > prevValue ? 'up' : lastValue < prevValue ? 'down' : 'neutral';

    return (
      <div className="relative h-8">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <polyline
            points={points}
            fill="none"
            stroke={trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280'}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    );
  };

  const getTrendIndicator = (stats: StrategyStats) => {
    if (!stats.profitHistory || stats.profitHistory.length < 2) return null;
    
    const lastValue = stats.profitHistory[stats.profitHistory.length - 1];
    const prevValue = stats.profitHistory[stats.profitHistory.length - 2];
    const change = ((lastValue - prevValue) / Math.abs(prevValue)) * 100;

    if (Math.abs(change) < 1) return null;

    return (
      <div className={`flex items-center gap-1 text-xs font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {change > 0 ? '+' : ''}{change.toFixed(1)}%
      </div>
    );
  };

  const generateDynamicRecommendations = () => {
    const recommendations: { type: 'info' | 'warning' | 'success'; message: string }[] = [];

    Object.entries(strategyStats).forEach(([name, stats]) => {
      if (stats.roi < -5 && stats.totalBets > 5) {
        recommendations.push({
          type: 'warning',
          message: `Стратегія "${name}" має ROI ${stats.roi.toFixed(1)}%. Розгляньте можливість перегляду критеріїв.`
        });
      }

      if (stats.roi > 10 && stats.totalBets > 10) {
        recommendations.push({
          type: 'success',
          message: `Стратегія "${name}" показує відмінні результати (ROI ${stats.roi.toFixed(1)}%). Продовжуйте використовувати!`
        });
      }

      if (stats.winRate < 40 && stats.totalBets > 5) {
        recommendations.push({
          type: 'warning',
          message: `Win Rate стратегії "${name}" становить ${stats.winRate.toFixed(1)}%. Можливо, варто знизити ризик.`
        });
      }
    });

    if (primaryStrategy) {
      const primaryStats = strategyStats[primaryStrategy];
      if (primaryStats && primaryStats.totalBets === 0) {
        recommendations.push({
          type: 'info',
          message: `Ви встановили "${primaryStrategy}" як основну, але ще не використовували її. Спробуйте зробити першу ставку!`
        });
      }
    }

    if (recommendations.length === 0) {
      recommendations.push(
        {
          type: 'info',
          message: 'Використовуйте стратегії з ROI більше 5% для стабільного зростання'
        },
        {
          type: 'warning',
          message: 'Уникайте ризикованих команд при використанні консервативних стратегій'
        },
        {
          type: 'success',
          message: 'Ведіть детальну статистику для покращення стратегій'
        }
      );
    }

    return recommendations.slice(0, 3);
  };

  const filteredAndSortedStrategies = strategies
    .filter(strategy => {
      const matchesSearch = strategy.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRisk = riskFilter === 'all' || strategy.riskLevel === riskFilter;
      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => {
      const statsA = strategyStats[a.name];
      const statsB = strategyStats[b.name];

      let comparison = 0;
      if (sortBy === 'roi') {
        comparison = (statsA?.roi || 0) - (statsB?.roi || 0);
      } else if (sortBy === 'profit') {
        comparison = (statsA?.totalProfit || 0) - (statsB?.totalProfit || 0);
      } else {
        comparison = a.name.localeCompare(b.name);
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

  if (loading) {
    return (
      <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="text-center text-gray-600">Завантаження стратегій...</div>
        </CardContent>
      </Card>
    );
  }

  const roiChartData = getRoiChartData();
  const betTypeStats = calculateBetTypeStats();

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
            <>
              {/* Filters and Search */}
              <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Пошук стратегій..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-xl"
                      />
                    </div>
                    
                    <Select value={riskFilter} onValueChange={setRiskFilter}>
                      <SelectTrigger className="w-full md:w-48 rounded-xl">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Фільтр за ризиком" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Всі рівні ризику</SelectItem>
                        <SelectItem value="Low">Низький ризик</SelectItem>
                        <SelectItem value="Medium">Середній ризик</SelectItem>
                        <SelectItem value="High">Високий ризик</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={(value: 'roi' | 'profit' | 'name') => setSortBy(value)}>
                      <SelectTrigger className="w-full md:w-48 rounded-xl">
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Сортування" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="roi">За ROI</SelectItem>
                        <SelectItem value="profit">За прибутком</SelectItem>
                        <SelectItem value="name">За назвою</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="rounded-xl"
                    >
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Strategy Cards - Simplified */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedStrategies.map((strategy, index) => {
                  const stats = strategyStats[strategy.name] || {};
                  const isPrimary = primaryStrategy === strategy.name;
                  
                  return (
                    <Card key={index} className={`border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden hover:shadow-xl transition-all ${isPrimary ? 'ring-2 ring-blue-500' : ''}`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base font-semibold text-gray-900">
                          <span className="flex items-center gap-2">
                            {getRiskIcon(strategy.riskLevel)}
                            <span className="truncate max-w-[150px]" title={strategy.name}>{strategy.name}</span>
                            {isPrimary && (
                              <Badge className="bg-blue-100 text-blue-700 border-0 rounded-full text-xs px-2 py-0.5">
                                <Star className="h-2.5 w-2.5 mr-0.5 fill-blue-700" />
                                Основна
                              </Badge>
                            )}
                          </span>
                          <Badge className={getRiskColor(strategy.riskLevel) + ' text-xs px-2 py-0.5'}>
                            {strategy.riskLevel}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Main Stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                            <div className={`text-2xl font-bold ${stats.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stats.roi >= 0 ? '+' : ''}{stats.roi?.toFixed(1) || 0}%
                            </div>
                            <div className="text-xs text-gray-600 font-medium mt-1">ROI</div>
                            {getTrendIndicator(stats)}
                          </div>
                          <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
                            <div className={`text-2xl font-bold ${stats.winRate >= 50 ? 'text-blue-600' : 'text-gray-600'}`}>
                              {stats.winRate?.toFixed(0) || 0}%
                            </div>
                            <div className="text-xs text-gray-600 font-medium mt-1">Win Rate</div>
                            <div className="text-xs text-gray-500 mt-1">{stats.totalBets || 0} ставок</div>
                          </div>
                        </div>

                        {/* Sparkline */}
                        {stats.totalBets > 0 && (
                          <div className="p-3 bg-gray-50 rounded-2xl">
                            <div className="text-xs text-gray-600 font-medium mb-2">Тренд прибутку</div>
                            {renderSparkline(stats.profitHistory)}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => openDetailsDialog(strategy)}
                            variant="outline"
                            size="sm"
                            className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Деталі
                          </Button>
                          <Button
                            onClick={() => togglePrimaryStrategy(strategy.name)}
                            variant="outline"
                            size="sm"
                            className={`rounded-xl ${isPrimary ? 'border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100' : 'border-gray-200 hover:bg-gray-50'}`}
                          >
                            <Star className={`h-4 w-4 ${isPrimary ? 'fill-blue-700' : ''}`} />
                          </Button>
                          <Button
                            onClick={() => confirmDeleteStrategy(strategy.name)}
                            variant="outline"
                            size="sm"
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
            </>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Top Row - 3 Cards */}
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
                      <span className="font-medium text-green-600 truncate max-w-[150px]" title={Object.keys(strategyStats).reduce((best, current) => 
                        (strategyStats[current]?.roi || 0) > (strategyStats[best]?.roi || 0) ? current : best, 
                        Object.keys(strategyStats)[0] || 'Немає'
                      )}>
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
                      <span className="font-medium text-blue-600 flex items-center gap-1 truncate max-w-[150px]" title={primaryStrategy}>
                        <Star className="h-3 w-3 fill-blue-600 flex-shrink-0" />
                        <span className="truncate">{primaryStrategy}</span>
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
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-600 flex-shrink-0">#{index + 1}</span>
                            <span className="text-sm truncate text-gray-900 flex items-center gap-1" title={name}>
                              <span className="truncate">{name}</span>
                              {primaryStrategy === name && <Star className="h-3 w-3 fill-blue-600 text-blue-600 flex-shrink-0" />}
                            </span>
                          </div>
                          <span className={`text-sm font-medium flex-shrink-0 ml-2 ${stats.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                  {generateDynamicRecommendations().map((rec, index) => (
                    <div key={index} className={`p-3 rounded-2xl ${
                      rec.type === 'info' ? 'bg-blue-50' :
                      rec.type === 'warning' ? 'bg-yellow-50' :
                      'bg-green-50'
                    }`}>
                      <div className={`font-medium ${
                        rec.type === 'info' ? 'text-blue-800' :
                        rec.type === 'warning' ? 'text-yellow-800' :
                        'text-green-800'
                      }`}>
                        {rec.type === 'info' ? '💡 Порада' :
                         rec.type === 'warning' ? '⚠️ Увага' :
                         '✅ Успіх'}
                      </div>
                      <div className={`${
                        rec.type === 'info' ? 'text-blue-700' :
                        rec.type === 'warning' ? 'text-yellow-700' :
                        'text-green-700'
                      }`}>
                        {rec.message}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* REDESIGNED: Enhanced ROI Comparison Chart */}
          {roiChartData.length > 0 && (
            <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 backdrop-blur-xl overflow-hidden">
              <CardHeader className="border-b border-gray-100 bg-white/60">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  Порівняння ефективності стратегій
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Детальний аналіз ROI, Win Rate та прибутку по кожній стратегії</p>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={roiChartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <defs>
                      <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      tick={{ fontSize: 12, fill: '#4b5563', fontWeight: 600 }}
                    />
                    <YAxis 
                      yAxisId="left"
                      label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontWeight: 600 } }}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      label={{ value: 'Win Rate (%)', angle: 90, position: 'insideRight', style: { fill: '#6b7280', fontWeight: 600 } }}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '16px',
                        padding: '12px 16px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'roi') return [`${value > 0 ? '+' : ''}${value.toFixed(1)}%`, 'ROI'];
                        if (name === 'winRate') return [`${value.toFixed(1)}%`, 'Win Rate'];
                        if (name === 'profit') return [`${value > 0 ? '+' : ''}${value}₴`, 'Прибуток'];
                        return [value, name];
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="font-bold text-gray-900">
                              {data.fullName}
                              <div className="text-xs text-gray-500 font-normal mt-1">
                                {data.totalBets} ставок • Ризик: {data.riskLevel}
                              </div>
                            </div>
                          );
                        }
                        return label;
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                      formatter={(value) => {
                        const labels: Record<string, string> = {
                          roi: 'ROI (%)',
                          winRate: 'Win Rate (%)',
                          profit: 'Прибуток (₴)'
                        };
                        return <span className="text-sm font-medium text-gray-700">{labels[value] || value}</span>;
                      }}
                    />
                    <Bar yAxisId="left" dataKey="roi" fill="url(#colorRoi)" radius={[12, 12, 0, 0]} barSize={60}>
                      {roiChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getRiskBarColor(entry.riskLevel)} opacity={0.9} />
                      ))}
                    </Bar>
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="winRate" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 6, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 8 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                
                {/* Enhanced Legend with Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-center gap-3 p-3 bg-green-50 rounded-2xl border border-green-200">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <div className="text-sm">
                      <div className="font-bold text-green-900">Низький ризик</div>
                      <div className="text-xs text-green-700">Стабільний прибуток</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3 p-3 bg-yellow-50 rounded-2xl border border-yellow-200">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <div className="text-sm">
                      <div className="font-bold text-yellow-900">Середній ризик</div>
                      <div className="text-xs text-yellow-700">Збалансований підхід</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3 p-3 bg-red-50 rounded-2xl border border-red-200">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <div className="text-sm">
                      <div className="font-bold text-red-900">Високий ризик</div>
                      <div className="text-xs text-red-700">Агресивна стратегія</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bottom Row - 2 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bet Types Breakdown */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <PieChart className="h-5 w-5 text-blue-600" />
                  Розбивка по типах ставок
                </CardTitle>
              </CardHeader>
              <CardContent>
                {betTypeStats.length > 0 ? (
                  <div className="space-y-4">
                    {betTypeStats.map((stat, index) => (
                      <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">{stat.type}</span>
                          <Badge className="bg-blue-100 text-blue-700 border-0 rounded-full">
                            {stat.count} ставок
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="text-center">
                            <div className={`font-bold ${stat.winRate >= 50 ? 'text-green-600' : 'text-gray-600'}`}>
                              {stat.winRate.toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-500">Win Rate</div>
                          </div>
                          <div className="text-center">
                            <div className={`font-bold ${stat.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stat.roi >= 0 ? '+' : ''}{stat.roi.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">ROI</div>
                          </div>
                          <div className="text-center">
                            <div className={`font-bold ${stat.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stat.profit >= 0 ? '+' : ''}{stat.profit.toFixed(0)}₴
                            </div>
                            <div className="text-xs text-gray-500">Прибуток</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">Немає даних для відображення</p>
                )}
              </CardContent>
            </Card>

            {/* Expected vs Actual ROI */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Target className="h-5 w-5 text-green-600" />
                  Очікуваний vs Реальний ROI
                </CardTitle>
              </CardHeader>
              <CardContent>
                {strategies.length > 0 ? (
                  <div className="space-y-4">
                    {strategies.slice(0, 5).map((strategy, index) => {
                      const stats = strategyStats[strategy.name];
                      const actualROI = stats?.roi || 0;
                      const expectedROI = strategy.expectedROI || 0;
                      const difference = actualROI - expectedROI;
                      const isPositive = difference >= 0;
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]" title={strategy.name}>
                              {strategy.name}
                            </span>
                            <span className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {isPositive ? '+' : ''}{difference.toFixed(1)}%
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-400 rounded-full transition-all"
                                  style={{ width: `${Math.min((expectedROI / 30) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 w-12 text-right">{expectedROI.toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${actualROI >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(Math.abs(actualROI) / 30 * 100, 100)}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium w-12 text-right ${actualROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {actualROI >= 0 ? '+' : ''}{actualROI.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Очікуваний</span>
                            <span>Реальний</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">Створіть стратегії для аналізу</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-900">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Створити нову стратегію
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTemplateDialogOpen(true)}
                  className="rounded-xl"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Використати шаблон
                </Button>
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

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="rounded-3xl max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
              <Info className="h-5 w-5 text-blue-600" />
              Деталі стратегії
            </DialogTitle>
          </DialogHeader>
          {selectedStrategy && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  {getRiskIcon(selectedStrategy.riskLevel)}
                  {selectedStrategy.name}
                  <Badge className={getRiskColor(selectedStrategy.riskLevel)}>
                    {selectedStrategy.riskLevel} Risk
                  </Badge>
                </h3>
                <p className="text-gray-600">{selectedStrategy.description}</p>
              </div>

              {(selectedStrategy.maxOdds || selectedStrategy.minOdds || selectedStrategy.allowedFormats || selectedStrategy.allowedBetTypes) && (
                <div className="p-4 bg-blue-50 rounded-2xl space-y-2">
                  <p className="text-sm font-semibold text-blue-900 uppercase">Обмеження стратегії:</p>
                  {selectedStrategy.minOdds && (
                    <div className="text-sm text-blue-700">
                      • Мінімальний коефіцієнт: <span className="font-bold">{selectedStrategy.minOdds}</span>
                    </div>
                  )}
                  {selectedStrategy.maxOdds && (
                    <div className="text-sm text-blue-700">
                      • Максимальний коефіцієнт: <span className="font-bold">{selectedStrategy.maxOdds}</span>
                    </div>
                  )}
                  {selectedStrategy.allowedFormats && selectedStrategy.allowedFormats.length > 0 && (
                    <div className="text-sm text-blue-700">
                      • Дозволені формати: <span className="font-bold">{selectedStrategy.allowedFormats.join(', ')}</span>
                    </div>
                  )}
                  {selectedStrategy.allowedBetTypes && selectedStrategy.allowedBetTypes.length > 0 && (
                    <div className="text-sm text-blue-700">
                      • Дозволені типи ставок: <span className="font-bold">{selectedStrategy.allowedBetTypes.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}

              {strategyStats[selectedStrategy.name] && strategyStats[selectedStrategy.name].totalBets > 0 && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-gray-900">{strategyStats[selectedStrategy.name].totalBets}</div>
                    <div className="text-xs text-gray-600 font-medium">Всього ставок</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-semibold ${strategyStats[selectedStrategy.name].winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                      {strategyStats[selectedStrategy.name].winRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 font-medium">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-semibold ${strategyStats[selectedStrategy.name].totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {strategyStats[selectedStrategy.name].totalProfit >= 0 ? '+' : ''}{strategyStats[selectedStrategy.name].totalProfit.toFixed(0)} ₴
                    </div>
                    <div className="text-xs text-gray-600 font-medium">Прибуток</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-semibold ${strategyStats[selectedStrategy.name].roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {strategyStats[selectedStrategy.name].roi >= 0 ? '+' : ''}{strategyStats[selectedStrategy.name].roi.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 font-medium">ROI</div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2 text-gray-900">
                  <Lightbulb className="h-4 w-4" />
                  Критерії стратегії:
                </h4>
                <ul className="space-y-2">
                  {selectedStrategy.criteria.map((criterion, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)} className="rounded-xl">
              Закрити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="rounded-3xl max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
              <Zap className="h-5 w-5 text-purple-600" />
              Шаблони стратегій
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Виберіть готовий шаблон для швидкого створення стратегії
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STRATEGY_TEMPLATES.map((template, index) => (
              <Card key={index} className="border-2 border-gray-200 hover:border-blue-500 transition-all cursor-pointer" onClick={() => applyTemplate(template)}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base font-semibold text-gray-900">
                    <span className="flex items-center gap-2">
                      {getRiskIcon(template.riskLevel)}
                      {template.name}
                    </span>
                    <Badge className={getRiskColor(template.riskLevel) + ' text-xs'}>
                      {template.riskLevel}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">{template.description}</p>
                  <div className="p-2 bg-green-50 rounded-xl text-center">
                    <div className="text-lg font-bold text-green-600">+{template.expectedROI}%</div>
                    <div className="text-xs text-gray-600">Очікуваний ROI</div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Критерії:</p>
                    <ul className="space-y-1">
                      {template.criteria.slice(0, 3).map((criterion, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                          <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                          {criterion}
                        </li>
                      ))}
                      {template.criteria.length > 3 && (
                        <li className="text-xs text-gray-500">+ ще {template.criteria.length - 3}</li>
                      )}
                    </ul>
                  </div>
                  <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-700" size="sm">
                    Використати шаблон
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
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