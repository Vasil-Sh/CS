import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { realGoogleSheetsService, CS2Strategy } from '@/lib/realGoogleSheets';
import { Target, TrendingUp, AlertTriangle, Plus, BarChart3, Trophy, Brain, Lightbulb, Trash2, Star, X, Info, Search, ArrowUpDown, Filter, Eye, Zap, TrendingDown, Percent, CheckCircle2, Sparkles, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [newlyCreatedStrategy, setNewlyCreatedStrategy] = useState<CS2Strategy | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

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

  const getRoiChartData = () => {
    return Object.entries(strategyStats)
      .map(([name, stats]) => {
        const strategy = strategies.find(s => s.name === name);
        return {
          name: name.length > 15 ? name.substring(0, 15) + '...' : name,
          fullName: name,
          value: parseFloat(stats.roi.toFixed(1)),
          totalBets: stats.totalBets,
          riskLevel: strategy?.riskLevel || 'Medium'
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const getWinRateChartData = () => {
    return Object.entries(strategyStats)
      .map(([name, stats]) => {
        const strategy = strategies.find(s => s.name === name);
        return {
          name: name.length > 15 ? name.substring(0, 15) + '...' : name,
          fullName: name,
          value: parseFloat(stats.winRate.toFixed(1)),
          totalBets: stats.totalBets,
          riskLevel: strategy?.riskLevel || 'Medium'
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const getProfitChartData = () => {
    return Object.entries(strategyStats)
      .map(([name, stats]) => {
        const strategy = strategies.find(s => s.name === name);
        return {
          name: name.length > 15 ? name.substring(0, 15) + '...' : name,
          fullName: name,
          value: parseFloat(stats.totalProfit.toFixed(0)),
          totalBets: stats.totalBets,
          riskLevel: strategy?.riskLevel || 'Medium'
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-[#DCFCE7] text-[#16A34A] border-0 rounded-full';
      case 'Medium': return 'bg-[#FEF3C7] text-[#D97706] border-0 rounded-full';
      case 'High': return 'bg-[#FEE2E2] text-[#DC2626] border-0 rounded-full';
      default: return 'bg-[#F3F4F6] text-[#6B7280] border-0 rounded-full';
    }
  };

  const getRiskBarColor = (risk: string) => {
    switch (risk) {
      case 'Low': return '#22C55E';
      case 'Medium': return '#F59E0B';
      case 'High': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'Low': return <Target className="h-4 w-4" strokeWidth={1.5} />;
      case 'Medium': return <TrendingUp className="h-4 w-4" strokeWidth={1.5} />;
      case 'High': return <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />;
      default: return <Target className="h-4 w-4" strokeWidth={1.5} />;
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
    setNewlyCreatedStrategy(strategy);
    
    setNewStrategy({
      name: '',
      description: '',
      criteria: [''],
      riskLevel: 'Medium',
      expectedROI: 10
    });

    setSuccessDialogOpen(true);
    setActiveTab('overview');
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
      return <div className="h-8 flex items-center justify-center text-xs text-[#9CA3AF]">Немає даних</div>;
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
            stroke={trend === 'up' ? '#22C55E' : trend === 'down' ? '#EF4444' : '#6B7280'}
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
      <div className={`flex items-center gap-1 text-xs font-medium ${change > 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
        {change > 0 ? <TrendingUp className="h-3 w-3" strokeWidth={1.5} /> : <TrendingDown className="h-3 w-3" strokeWidth={1.5} />}
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
      <div
        className="bg-white border border-[#F3F4F6] rounded-3xl overflow-hidden"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
      >
        <div className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#111827] mx-auto mb-4"></div>
            <p className="text-[#6B7280] font-medium">Завантаження стратегій...</p>
          </div>
        </div>
      </div>
    );
  }

  const roiChartData = getRoiChartData();
  const winRateChartData = getWinRateChartData();
  const profitChartData = getProfitChartData();

  const tabs = [
    { id: 'overview', label: 'Огляд стратегій' },
    { id: 'performance', label: 'Ефективність' },
    { id: 'create', label: 'Створити нову' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-[#111827] tracking-tight flex items-center gap-3">
          <Brain className="h-6 w-6 text-[#111827]" strokeWidth={1.5} />
          Мої стратегії
        </h2>
        <p className="text-[#6B7280] font-normal mt-1">Управління та аналіз ваших стратегій ставок на CS2</p>
      </div>

      <div className="space-y-6">
        {/* Tabs Navigation */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-3 border border-[#E5E7EB]" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div className="grid grid-cols-3 gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative rounded-2xl px-6 py-4 text-base
                  transition-all duration-300 ease-in-out
                  ${activeTab === tab.id 
                    ? 'bg-white text-[#111827] font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)]' 
                    : 'bg-transparent text-[#9CA3AF] hover:bg-[#F9FAFB] hover:text-[#6B7280] font-normal'
                  }
                `}
              >
                <span className="flex items-center justify-center gap-2">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {strategies.length === 0 ? (
                <div
                  className="bg-white border border-[#F3F4F6] rounded-3xl overflow-hidden"
                  style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                >
                  <div className="p-12 text-center">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F3F4F6] mx-auto mb-4">
                      <Brain className="h-8 w-8 text-[#9CA3AF]" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold text-[#111827] mb-2">Немає стратегій</h3>
                    <p className="text-[#6B7280] mb-4">Створіть свою першу стратегію для ставок на CS2</p>
                    <Button 
                      onClick={() => setActiveTab('create')} 
                      className="rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white font-medium"
                    >
                      <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
                      Створити стратегію
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Filters and Search */}
                  <div
                    className="bg-white border border-[#F3F4F6] rounded-3xl overflow-hidden"
                    style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                  >
                    <div className="p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" strokeWidth={1.5} />
                          <Input
                            placeholder="Пошук стратегій..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 rounded-xl border-[#E5E7EB]"
                          />
                        </div>
                        
                        <Select value={riskFilter} onValueChange={setRiskFilter}>
                          <SelectTrigger className="w-full md:w-48 rounded-xl border-[#E5E7EB]">
                            <Filter className="h-4 w-4 mr-2" strokeWidth={1.5} />
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
                          <SelectTrigger className="w-full md:w-48 rounded-xl border-[#E5E7EB]">
                            <ArrowUpDown className="h-4 w-4 mr-2" strokeWidth={1.5} />
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
                          className="rounded-xl border-[#E5E7EB]"
                        >
                          {sortOrder === 'desc' ? '↓' : '↑'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Strategy Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredAndSortedStrategies.map((strategy, index) => {
                      const stats = strategyStats[strategy.name] || {} as StrategyStats;
                      const isPrimary = primaryStrategy === strategy.name;
                      
                      return (
                        <div
                          key={index}
                          className={`bg-white border rounded-3xl overflow-hidden hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all ${isPrimary ? 'border-[#3B82F6]' : 'border-[#F3F4F6]'}`}
                          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                        >
                          <div className="p-5">
                            {/* Card Header */}
                            <div className="flex items-center justify-between mb-4">
                              <span className="flex items-center gap-2">
                                {getRiskIcon(strategy.riskLevel)}
                                <span className="font-semibold text-[#111827] truncate max-w-[150px]" title={strategy.name}>{strategy.name}</span>
                                {isPrimary && (
                                  <Badge className="bg-[#EFF6FF] text-[#3B82F6] border-0 rounded-full text-xs px-2 py-0.5 font-medium hover:bg-[#EFF6FF]">
                                    <Star className="h-2.5 w-2.5 mr-0.5 fill-[#3B82F6]" strokeWidth={1.5} />
                                    Основна
                                  </Badge>
                                )}
                              </span>
                              <Badge className={getRiskColor(strategy.riskLevel) + ' text-xs px-2.5 py-0.5 font-medium hover:opacity-100'}>
                                {strategy.riskLevel}
                              </Badge>
                            </div>
                            
                            {/* Main Stats */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="text-center p-3 bg-[#F9FAFB] rounded-2xl">
                                <div className={`text-2xl font-bold ${(stats.roi || 0) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                                  {(stats.roi || 0) >= 0 ? '+' : ''}{stats.roi?.toFixed(1) || 0}%
                                </div>
                                <div className="text-xs text-[#6B7280] font-medium mt-1">ROI</div>
                                {getTrendIndicator(stats)}
                              </div>
                              <div className="text-center p-3 bg-[#F9FAFB] rounded-2xl">
                                <div className={`text-2xl font-bold ${(stats.winRate || 0) >= 50 ? 'text-[#3B82F6]' : 'text-[#6B7280]'}`}>
                                  {stats.winRate?.toFixed(0) || 0}%
                                </div>
                                <div className="text-xs text-[#6B7280] font-medium mt-1">Win Rate</div>
                                <div className="text-xs text-[#9CA3AF] mt-1">{stats.totalBets || 0} ставок</div>
                              </div>
                            </div>

                            {/* Sparkline */}
                            {(stats.totalBets || 0) > 0 && (
                              <div className="p-3 bg-[#F9FAFB] rounded-2xl mb-4">
                                <div className="text-xs text-[#6B7280] font-medium mb-2">Тренд прибутку</div>
                                {renderSparkline(stats.profitHistory)}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Button
                                onClick={() => openDetailsDialog(strategy)}
                                variant="outline"
                                size="sm"
                                className="flex-1 rounded-xl border-[#E5E7EB] hover:bg-[#F9FAFB] font-medium text-[#374151]"
                              >
                                <Eye className="h-4 w-4 mr-1" strokeWidth={1.5} />
                                Деталі
                              </Button>
                              <Button
                                onClick={() => togglePrimaryStrategy(strategy.name)}
                                variant="outline"
                                size="sm"
                                className={`rounded-xl font-medium ${isPrimary ? 'border-[#3B82F6] text-[#3B82F6] bg-[#EFF6FF] hover:bg-[#DBEAFE]' : 'border-[#E5E7EB] hover:bg-[#F9FAFB]'}`}
                              >
                                <Star className={`h-4 w-4 ${isPrimary ? 'fill-[#3B82F6]' : ''}`} strokeWidth={1.5} />
                              </Button>
                              <Button
                                onClick={() => confirmDeleteStrategy(strategy.name)}
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-[#FEE2E2] text-[#EF4444] hover:bg-[#FEF2F2] font-medium"
                              >
                                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Top Row - 3 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  className="bg-white border border-[#F3F4F6] rounded-3xl overflow-hidden"
                  style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                >
                  <div className="px-6 py-5 border-b border-[#F3F4F6]">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                      <span className="text-lg font-semibold text-[#111827]">Загальна статистика</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-[#6B7280]">Всього стратегій:</span>
                        <span className="font-semibold text-[#111827]">{strategies.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-[#6B7280]">Всього ставок:</span>
                        <span className="font-semibold text-[#111827]">{bettingData.length}</span>
                      </div>
                      {Object.keys(strategyStats).length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-[#6B7280]">Найкраща стратегія:</span>
                          <span className="font-semibold text-[#22C55E] truncate max-w-[150px]" title={Object.keys(strategyStats).reduce((best, current) => 
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
                          <span className="text-sm text-[#6B7280]">Основна стратегія:</span>
                          <span className="font-semibold text-[#111827] flex items-center gap-1 truncate max-w-[150px]" title={primaryStrategy}>
                            <Star className="h-3 w-3 fill-[#3B82F6] text-[#3B82F6] flex-shrink-0" strokeWidth={1.5} />
                            <span className="truncate">{primaryStrategy}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="bg-white border border-[#F3F4F6] rounded-3xl overflow-hidden"
                  style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                >
                  <div className="px-6 py-5 border-b border-[#F3F4F6]">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                      <span className="text-lg font-semibold text-[#111827]">Топ по ROI</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {Object.entries(strategyStats).length > 0 ? (
                        Object.entries(strategyStats)
                          .sort(([,a], [,b]) => (b as StrategyStats).roi - (a as StrategyStats).roi)
                          .slice(0, 5)
                          .map(([name, stats]: [string, StrategyStats], index) => (
                            <div key={name} className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-sm font-semibold text-[#9CA3AF] flex-shrink-0">#{index + 1}</span>
                                <span className="text-sm truncate text-[#111827] flex items-center gap-1 font-medium" title={name}>
                                  <span className="truncate">{name}</span>
                                  {primaryStrategy === name && <Star className="h-3 w-3 fill-[#3B82F6] text-[#3B82F6] flex-shrink-0" strokeWidth={1.5} />}
                                </span>
                              </div>
                              <span className={`text-sm font-bold flex-shrink-0 ml-2 ${stats.roi >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                                {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
                              </span>
                            </div>
                          ))
                      ) : (
                        <p className="text-sm text-[#9CA3AF] text-center py-4">Немає даних для відображення</p>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="bg-white border border-[#F3F4F6] rounded-3xl overflow-hidden"
                  style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                >
                  <div className="px-6 py-5 border-b border-[#F3F4F6]">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                      <span className="text-lg font-semibold text-[#111827]">Рекомендації</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3 text-sm">
                      {generateDynamicRecommendations().map((rec, index) => (
                        <div key={index} className={`p-3 rounded-2xl ${
                          rec.type === 'info' ? 'bg-[#EFF6FF]' :
                          rec.type === 'warning' ? 'bg-[#FEF3C7]' :
                          'bg-[#DCFCE7]'
                        }`}>
                          <div className={`font-semibold text-xs mb-1 ${
                            rec.type === 'info' ? 'text-[#3B82F6]' :
                            rec.type === 'warning' ? 'text-[#D97706]' :
                            'text-[#16A34A]'
                          }`}>
                            {rec.type === 'info' ? '💡 Порада' :
                             rec.type === 'warning' ? '⚠️ Увага' :
                             '✅ Успіх'}
                          </div>
                          <div className={`text-sm ${
                            rec.type === 'info' ? 'text-[#3B82F6]' :
                            rec.type === 'warning' ? 'text-[#D97706]' :
                            'text-[#16A34A]'
                          }`}>
                            {rec.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Three Separate Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ROI Chart */}
                {roiChartData.length > 0 && (
                  <div
                    className="bg-white border border-[#F3F4F6] rounded-3xl overflow-hidden"
                    style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                  >
                    <div className="px-6 py-5 border-b border-[#F3F4F6]">
                      <div className="flex items-center gap-2">
                        <Percent className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                        <span className="text-base font-semibold text-[#111827]">ROI стратегій</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={roiChartData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80}
                            tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }}
                          />
                          <YAxis 
                            tick={{ fontSize: 10, fill: '#6B7280' }}
                            label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#6B7280' } }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                              border: '1px solid #E5E7EB',
                              borderRadius: '12px',
                              padding: '8px 12px',
                              fontSize: '12px'
                            }}
                            formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(1)}%`, 'ROI']}
                            labelFormatter={(label, payload) => {
                              if (payload && payload[0]) {
                                const data = payload[0].payload;
                                return `${data.fullName} (${data.totalBets} ставок)`;
                              }
                              return label;
                            }}
                          />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={30}>
                            {roiChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getRiskBarColor(entry.riskLevel)} opacity={0.9} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Win Rate Chart */}
                {winRateChartData.length > 0 && (
                  <div
                    className="bg-white border border-[#F3F4F6] rounded-3xl overflow-hidden"
                    style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                  >
                    <div className="px-6 py-5 border-b border-[#F3F4F6]">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                        <span className="text-base font-semibold text-[#111827]">Win Rate стратегій</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={winRateChartData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80}
                            tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }}
                          />
                          <YAxis 
                            tick={{ fontSize: 10, fill: '#6B7280' }}
                            label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#6B7280' } }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                              border: '1px solid #E5E7EB',
                              borderRadius: '12px',
                              padding: '8px 12px',
                              fontSize: '12px'
                            }}
                            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                            labelFormatter={(label, payload) => {
                              if (payload && payload[0]) {
                                const data = payload[0].payload;
                                return `${data.fullName} (${data.totalBets} ставок)`;
                              }
                              return label;
                            }}
                          />
                          <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} barSize={30} opacity={0.9} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Profit Chart */}
                {profitChartData.length > 0 && (
                  <div
                    className="bg-white border border-[#F3F4F6] rounded-3xl overflow-hidden"
                    style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                  >
                    <div className="px-6 py-5 border-b border-[#F3F4F6]">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                        <span className="text-base font-semibold text-[#111827]">Прибуток стратегій</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={profitChartData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80}
                            tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }}
                          />
                          <YAxis 
                            tick={{ fontSize: 10, fill: '#6B7280' }}
                            label={{ value: 'Прибуток (₴)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#6B7280' } }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                              border: '1px solid #E5E7EB',
                              borderRadius: '12px',
                              padding: '8px 12px',
                              fontSize: '12px'
                            }}
                            formatter={(value: number) => [`${value > 0 ? '+' : ''}${value}₴`, 'Прибуток']}
                            labelFormatter={(label, payload) => {
                              if (payload && payload[0]) {
                                const data = payload[0].payload;
                                return `${data.fullName} (${data.totalBets} ставок)`;
                              }
                              return label;
                            }}
                          />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={30}>
                            {profitChartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.value >= 0 ? '#22C55E' : '#EF4444'} 
                                opacity={0.9} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div
              className="bg-white border border-[#F3F4F6] rounded-3xl overflow-hidden"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#F3F4F6]">
                <div className="flex items-center gap-3">
                  <Plus className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                  <span className="text-lg font-semibold text-[#111827]">Створити нову стратегію</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTemplateDialogOpen(true)}
                  className="rounded-xl border-[#E5E7EB] font-medium text-[#374151]"
                >
                  <Zap className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Використати шаблон
                </Button>
              </div>
              <div className="p-6 space-y-6">
                <div className="p-4 bg-[#EFF6FF] rounded-2xl border border-[#DBEAFE]">
                  <h4 className="font-semibold text-[#3B82F6] mb-2 flex items-center gap-2 text-sm">
                    <Lightbulb className="h-4 w-4" strokeWidth={1.5} />
                    Як додати обмеження до стратегії:
                  </h4>
                  <div className="space-y-2 text-sm text-[#3B82F6]">
                    <p>• <strong className="font-semibold">Для обмеження коефіцієнтів:</strong> напишіть "Мінімальний коефіцієнт 1.5" або "Максимальний коефіцієнт 2.5"</p>
                    <p>• <strong className="font-semibold">Для обмеження форматів:</strong> напишіть "Формат тільки BO3" або "Формат BO1 та BO3"</p>
                    <p>• <strong className="font-semibold">Для обмеження типів ставок:</strong> напишіть "Тільки експреси", "Тільки ординари" або "Експреси та системи"</p>
                    <p className="pt-2 text-xs text-[#3B82F6]/70">Приклади критеріїв:</p>
                    <ul className="list-disc list-inside text-xs text-[#3B82F6]/70 space-y-1 ml-2">
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
                    <Label htmlFor="strategyName" className="text-[#111827] font-medium">Назва стратегії *</Label>
                    <Input
                      id="strategyName"
                      value={newStrategy.name}
                      onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})}
                      placeholder="Наприклад: Консервативна стратегія"
                      className="rounded-xl border-[#E5E7EB] mt-1.5"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="riskLevel" className="text-[#111827] font-medium">Рівень ризику *</Label>
                    <Select value={newStrategy.riskLevel} onValueChange={(value: 'Low' | 'Medium' | 'High') => setNewStrategy({...newStrategy, riskLevel: value})}>
                      <SelectTrigger className="rounded-xl border-[#E5E7EB] mt-1.5">
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
                  <Label htmlFor="description" className="text-[#111827] font-medium">Опис стратегії *</Label>
                  <Textarea
                    id="description"
                    value={newStrategy.description}
                    onChange={(e) => setNewStrategy({...newStrategy, description: e.target.value})}
                    placeholder="Детальний опис стратегії, коли її використовувати..."
                    rows={3}
                    className="rounded-xl border-[#E5E7EB] mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="expectedROI" className="text-[#111827] font-medium">Очікуваний ROI (%) *</Label>
                  <Input
                    id="expectedROI"
                    type="number"
                    min="0"
                    max="100"
                    value={newStrategy.expectedROI}
                    onChange={(e) => setNewStrategy({...newStrategy, expectedROI: parseInt(e.target.value) || 0})}
                    className="rounded-xl border-[#E5E7EB] mt-1.5"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-[#111827] font-medium">Критерії стратегії *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addCriterion} className="rounded-xl border-[#E5E7EB] font-medium text-[#374151]">
                      <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
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
                          className="rounded-xl border-[#E5E7EB]"
                        />
                        {newStrategy.criteria.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCriterion(index)}
                            className="rounded-xl border-[#E5E7EB]"
                          >
                            <X className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={saveStrategy} className="w-full rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white font-medium h-11">
                  <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Зберегти стратегію
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="rounded-3xl max-w-2xl border border-[#E5E7EB]">
          <DialogHeader>
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="relative">
                <div className="absolute inset-0 bg-[#22C55E] rounded-full blur-xl opacity-30 animate-pulse"></div>
                <div className="relative p-4 bg-[#DCFCE7] rounded-full">
                  <CheckCircle2 className="h-12 w-12 text-[#16A34A]" strokeWidth={2} />
                </div>
              </div>
              <DialogTitle className="text-2xl font-semibold text-[#111827] flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-[#F59E0B]" strokeWidth={1.5} />
                Вітаємо! Стратегію успішно створено!
                <Sparkles className="h-6 w-6 text-[#F59E0B]" strokeWidth={1.5} />
              </DialogTitle>
              <DialogDescription className="text-[#6B7280] text-base">
                Ваша нова стратегія готова до використання
              </DialogDescription>
            </div>
          </DialogHeader>
          
          {newlyCreatedStrategy && (
            <div className="space-y-4 py-4">
              {/* Strategy Header */}
              <div className="p-6 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm">
                      {getRiskIcon(newlyCreatedStrategy.riskLevel)}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[#111827]">{newlyCreatedStrategy.name}</h3>
                      <p className="text-sm text-[#6B7280] mt-0.5">{newlyCreatedStrategy.description}</p>
                    </div>
                  </div>
                  <Badge className={getRiskColor(newlyCreatedStrategy.riskLevel) + ' text-sm px-3 py-1 font-medium hover:opacity-100'}>
                    {newlyCreatedStrategy.riskLevel} Risk
                  </Badge>
                </div>
              </div>

              {/* Strategy Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#DCFCE7] rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="h-4 w-4 text-[#16A34A]" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-[#16A34A]">Очікуваний ROI</span>
                  </div>
                  <div className="text-2xl font-bold text-[#16A34A]">+{newlyCreatedStrategy.expectedROI}%</div>
                </div>

                <div className="p-4 bg-[#EFF6FF] rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-[#3B82F6]" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-[#3B82F6]">Критеріїв</span>
                  </div>
                  <div className="text-2xl font-bold text-[#3B82F6]">{newlyCreatedStrategy.criteria.length}</div>
                </div>
              </div>

              {/* Criteria List */}
              <div className="p-4 bg-white rounded-2xl border border-[#E5E7EB]">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-[#111827]">
                  <Lightbulb className="h-4 w-4 text-[#F59E0B]" strokeWidth={1.5} />
                  Критерії стратегії:
                </h4>
                <ul className="space-y-2">
                  {newlyCreatedStrategy.criteria.map((criterion, idx) => (
                    <li key={idx} className="text-sm text-[#6B7280] flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Steps */}
              <div className="p-4 bg-[#EFF6FF] rounded-2xl border border-[#DBEAFE]">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-[#3B82F6] text-sm">
                  <Info className="h-4 w-4" strokeWidth={1.5} />
                  Наступні кроки:
                </h4>
                <ul className="space-y-1 text-sm text-[#3B82F6]">
                  <li>• Встановіть цю стратегію як основну, натиснувши на зірочку</li>
                  <li>• Почніть використовувати її при створенні нових ставок</li>
                  <li>• Відстежуйте результати на вкладці "Ефективність"</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              onClick={() => {
                setSuccessDialogOpen(false);
                setNewlyCreatedStrategy(null);
              }}
              className="flex-1 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white font-medium"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Чудово, зрозуміло!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="rounded-3xl max-w-2xl max-h-[80vh] overflow-y-auto border border-[#E5E7EB]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-[#111827]">
              <Info className="h-5 w-5 text-[#3B82F6]" strokeWidth={1.5} />
              Деталі стратегії
            </DialogTitle>
          </DialogHeader>
          {selectedStrategy && (
            <div className="space-y-4">
              {/* Strategy Header */}
              <div>
                <h3 className="font-semibold text-[#111827] mb-2 flex items-center gap-2">
                  {getRiskIcon(selectedStrategy.riskLevel)}
                  {selectedStrategy.name}
                  <Badge className={getRiskColor(selectedStrategy.riskLevel) + ' font-medium hover:opacity-100'}>
                    {selectedStrategy.riskLevel} Risk
                  </Badge>
                </h3>
                <p className="text-[#6B7280]">{selectedStrategy.description}</p>
              </div>

              {/* Constraints Section */}
              {(selectedStrategy.maxOdds || selectedStrategy.minOdds || selectedStrategy.allowedFormats || selectedStrategy.allowedBetTypes) && (
                <div className="p-4 bg-[#EFF6FF] rounded-2xl space-y-2">
                  <p className="text-sm font-semibold text-[#3B82F6] uppercase tracking-wider">Обмеження стратегії:</p>
                  {selectedStrategy.minOdds && (
                    <div className="text-sm text-[#3B82F6]">
                      • Мінімальний коефіцієнт: <span className="font-semibold">{selectedStrategy.minOdds}</span>
                    </div>
                  )}
                  {selectedStrategy.maxOdds && (
                    <div className="text-sm text-[#3B82F6]">
                      • Максимальний коефіцієнт: <span className="font-semibold">{selectedStrategy.maxOdds}</span>
                    </div>
                  )}
                  {selectedStrategy.allowedFormats && selectedStrategy.allowedFormats.length > 0 && (
                    <div className="text-sm text-[#3B82F6]">
                      • Дозволені формати: <span className="font-semibold">{selectedStrategy.allowedFormats.join(', ')}</span>
                    </div>
                  )}
                  {selectedStrategy.allowedBetTypes && selectedStrategy.allowedBetTypes.length > 0 && (
                    <div className="text-sm text-[#3B82F6]">
                      • Дозволені типи ставок: <span className="font-semibold">{selectedStrategy.allowedBetTypes.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Statistics Grid */}
              {strategyStats[selectedStrategy.name] && strategyStats[selectedStrategy.name].totalBets > 0 && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-[#F9FAFB] rounded-2xl">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#111827]">{strategyStats[selectedStrategy.name].totalBets}</div>
                    <div className="text-xs text-[#6B7280] font-medium">Всього ставок</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${strategyStats[selectedStrategy.name].winRate >= 50 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                      {strategyStats[selectedStrategy.name].winRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-[#6B7280] font-medium">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${strategyStats[selectedStrategy.name].totalProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                      {strategyStats[selectedStrategy.name].totalProfit >= 0 ? '+' : ''}{strategyStats[selectedStrategy.name].totalProfit.toFixed(0)} ₴
                    </div>
                    <div className="text-xs text-[#6B7280] font-medium">Прибуток</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${strategyStats[selectedStrategy.name].roi >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                      {strategyStats[selectedStrategy.name].roi >= 0 ? '+' : ''}{strategyStats[selectedStrategy.name].roi.toFixed(1)}%
                    </div>
                    <div className="text-xs text-[#6B7280] font-medium">ROI</div>
                  </div>
                </div>
              )}

              {/* Criteria List */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-[#111827]">
                  <Lightbulb className="h-4 w-4" strokeWidth={1.5} />
                  Критерії стратегії:
                </h4>
                <ul className="space-y-2">
                  {selectedStrategy.criteria.map((criterion, idx) => (
                    <li key={idx} className="text-sm text-[#6B7280] flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)} className="rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white font-medium">
              Закрити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="rounded-3xl max-w-4xl max-h-[80vh] overflow-y-auto border border-[#E5E7EB]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-[#111827]">
              <Zap className="h-5 w-5 text-[#F59E0B]" strokeWidth={1.5} />
              Шаблони стратегій
            </DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              Виберіть готовий шаблон для швидкого створення стратегії
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STRATEGY_TEMPLATES.map((template, index) => (
              <div
                key={index}
                className="bg-white border border-[#E5E7EB] hover:border-[#3B82F6] transition-all cursor-pointer rounded-2xl p-5"
                onClick={() => applyTemplate(template)}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-2 font-semibold text-[#111827]">
                    {getRiskIcon(template.riskLevel)}
                    <span className="text-sm">{template.name}</span>
                  </span>
                  <Badge className={getRiskColor(template.riskLevel) + ' text-xs font-medium hover:opacity-100'}>
                    {template.riskLevel}
                  </Badge>
                </div>
                <p className="text-sm text-[#6B7280] mb-3">{template.description}</p>
                <div className="p-2 bg-[#DCFCE7] rounded-xl text-center mb-3">
                  <div className="text-lg font-bold text-[#16A34A]">+{template.expectedROI}%</div>
                  <div className="text-xs text-[#6B7280]">Очікуваний ROI</div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#6B7280] mb-1">Критерії:</p>
                  <ul className="space-y-1">
                    {template.criteria.slice(0, 3).map((criterion, idx) => (
                      <li key={idx} className="text-xs text-[#6B7280] flex items-center gap-1">
                        <div className="w-1 h-1 bg-[#3B82F6] rounded-full"></div>
                        {criterion}
                      </li>
                    ))}
                    {template.criteria.length > 3 && (
                      <li className="text-xs text-[#9CA3AF]">+ ще {template.criteria.length - 3}</li>
                    )}
                  </ul>
                </div>
                <Button className="w-full rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white font-medium mt-3" size="sm">
                  Використати шаблон
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-3xl border border-[#E5E7EB]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#EF4444]">
              <AlertTriangle className="h-5 w-5" strokeWidth={1.5} />
              Видалити стратегію?
            </DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              Ви впевнені, що хочете видалити стратегію <span className="font-semibold text-[#111827]">"{strategyToDelete}"</span>?
              <br />
              <br />
              Ця дія незворотна. Статистика ставок, пов'язаних з цією стратегією, залишиться незмінною.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-xl border-[#E5E7EB] font-medium"
            >
              Скасувати
            </Button>
            <Button
              variant="destructive"
              onClick={deleteStrategy}
              className="rounded-xl bg-[#EF4444] hover:bg-[#DC2626] font-medium"
            >
              <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}