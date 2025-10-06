import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import csharpDataService from '@/services/csharp-data-service';
import CalendarHeatmap from '@/components/CalendarHeatmap';
import BalanceChart from '@/components/BalanceChart';
import KellyCalculator from '@/components/KellyCalculator';
import RiskManagement from '@/components/RiskManagement';
import PeriodComparison from '@/components/PeriodComparison';
import PredictiveAnalytics from '@/components/PredictiveAnalytics';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  BarChart3, 
  Calendar,
  Trophy,
  DollarSign,
  Percent,
  Users,
  Filter,
  RefreshCw,
  Calculator,
  Shield,
  Download,
  Brain,
  GitCompare,
  Zap,
  CheckCircle,
  AlertTriangle,
  Star,
  MapPin,
  Clock,
  TrendingUp as TrendUp,
  TrendingDown as TrendDown,
  Wifi,
  WifiOff,
  Database,
  Crown,
  Map,
  Trash2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts';
import type { Bet, BettingStats, TeamStats, OddsRange, CalendarData, BalanceData, ScatterData } from '@/types/betting';

interface TeamRecommendation {
  team: string;
  opponent: string;
  recommendation: 'strong_bet' | 'moderate_bet' | 'avoid' | 'risky';
  confidence: number;
  reasons: string[];
  stabilityScore: number;
  detailedAnalysis: {
    tierComparison: string;
    rankComparison: string;
    winRateAnalysis: string;
    recentFormAnalysis: string;
    headToHeadAnalysis: string;
    mapAnalysis: string[];
    stabilityAnalysis: string;
    riskFactors: string[];
    strengths: string[];
    recommendation: string;
  };
}

interface DatabaseTeam {
  id: number;
  name: string;
  position: number;
  points: number;
  hltvId: number;
}

// Top 3 teams from HLTV ranking
const topTeams = [
  {
    name: 'Spirit',
    rank: 1,
    points: 1000,
    country: 'Росія',
    logo: '🔥',
    recentForm: ['W', 'W', 'W', 'L', 'W'],
    winRate: 79,
    mapWins: 145,
    mapLosses: 38
  },
  {
    name: 'FURIA',
    rank: 2,
    points: 950,
    country: 'Бразилія',
    logo: '⚡',
    recentForm: ['W', 'L', 'W', 'W', 'W'],
    winRate: 73,
    mapWins: 132,
    mapLosses: 49
  },
  {
    name: 'NAVI',
    rank: 3,
    points: 900,
    country: 'Україна',
    logo: '🇺🇦',
    recentForm: ['W', 'W', 'L', 'W', 'W'],
    winRate: 72,
    mapWins: 128,
    mapLosses: 50
  }
];

// Popular CS2 maps
const popularMaps = [
  {
    name: 'Mirage',
    image: '🏜️',
    playRate: '23.4%',
    description: 'Найпопулярніша карта в CS2',
    avgRounds: 28.5,
    tSideWinRate: 47.2
  },
  {
    name: 'Inferno',
    image: '🔥',
    playRate: '19.8%',
    description: 'Класична карта з вузькими проходами',
    avgRounds: 29.1,
    tSideWinRate: 45.8
  },
  {
    name: 'Dust2',
    image: '🏺',
    playRate: '18.6%',
    description: 'Легендарна карта Counter-Strike',
    avgRounds: 27.9,
    tSideWinRate: 48.1
  }
];

export default function Analytics() {
  const [stats, setStats] = useState<BettingStats>({
    totalBets: 0,
    winRate: 0,
    totalProfit: 0,
    averageROI: 0,
    profitByMonth: [],
    profitByStrategy: []
  });
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [recommendations, setRecommendations] = useState<TeamRecommendation[]>([]);
  const [connectionStatus, setConnectionStatus] = useState({ connected: false, environment: 'Browser' });
  const [databaseTeams, setDatabaseTeams] = useState<DatabaseTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // Enhanced teams data with C# integration support
  const teams = {
    'Spirit': {
      name: 'Spirit',
      matches: 28,
      wins: 22,
      losses: 6,
      winRate: 79,
      recentForm: ['W', 'W', 'W', 'W', 'L', 'W', 'W', 'L', 'W', 'W'],
      stabilityIndex: 94,
      tier: 'tier1' as const,
      rank: 1,
      mapStats: {
        'Mirage': { wins: 9, losses: 1, winRate: 90 },
        'Inferno': { wins: 7, losses: 2, winRate: 78 },
        'Dust2': { wins: 6, losses: 1, winRate: 86 },
        'Cache': { wins: 4, losses: 1, winRate: 80 },
        'Overpass': { wins: 3, losses: 2, winRate: 60 }
      },
      headToHead: {
        'FURIA': { wins: 4, losses: 1, winRate: 80 },
        'NAVI': { wins: 3, losses: 2, winRate: 60 },
        'G2': { wins: 2, losses: 3, winRate: 40 }
      }
    },
    'FURIA': {
      name: 'FURIA',
      matches: 26,
      wins: 19,
      losses: 7,
      winRate: 73,
      recentForm: ['W', 'W', 'L', 'W', 'W', 'L', 'W', 'L', 'W', 'W'],
      stabilityIndex: 88,
      tier: 'tier1' as const,
      rank: 2,
      mapStats: {
        'Mirage': { wins: 7, losses: 2, winRate: 78 },
        'Inferno': { wins: 6, losses: 2, winRate: 75 },
        'Dust2': { wins: 5, losses: 2, winRate: 71 },
        'Cache': { wins: 4, losses: 1, winRate: 80 },
        'Overpass': { wins: 2, losses: 2, winRate: 50 }
      },
      headToHead: {
        'Spirit': { wins: 1, losses: 4, winRate: 20 },
        'NAVI': { wins: 3, losses: 2, winRate: 60 },
        'G2': { wins: 4, losses: 1, winRate: 80 }
      }
    },
    'NAVI': {
      name: 'NAVI',
      matches: 25,
      wins: 18,
      losses: 7,
      winRate: 72,
      recentForm: ['W', 'W', 'L', 'W', 'W', 'W', 'L', 'W', 'W', 'W'],
      stabilityIndex: 85,
      tier: 'tier1' as const,
      rank: 3,
      headToHead: {
        'Spirit': { wins: 2, losses: 3, winRate: 40 },
        'FURIA': { wins: 2, losses: 3, winRate: 40 },
        'G2': { wins: 3, losses: 2, winRate: 60 }
      }
    },
    'G2': {
      name: 'G2',
      matches: 22,
      wins: 14,
      losses: 8,
      winRate: 64,
      recentForm: ['L', 'W', 'W', 'L', 'W', 'L', 'W', 'W', 'L', 'W'],
      stabilityIndex: 68,
      tier: 'tier1' as const,
      rank: 4,
      headToHead: {
        'Spirit': { wins: 3, losses: 2, winRate: 60 },
        'NAVI': { wins: 2, losses: 3, winRate: 40 },
        'FURIA': { wins: 1, losses: 4, winRate: 20 }
      }
    },
    'Vitality': {
      name: 'Vitality',
      matches: 20,
      wins: 16,
      losses: 4,
      winRate: 80,
      recentForm: ['W', 'L', 'W', 'W', 'W', 'W', 'W', 'L', 'W', 'W'],
      stabilityIndex: 92,
      tier: 'tier1' as const,
      rank: 5,
      headToHead: {
        'Spirit': { wins: 1, losses: 3, winRate: 25 },
        'FURIA': { wins: 3, losses: 2, winRate: 60 },
        'G2': { wins: 2, losses: 3, winRate: 40 }
      }
    }
  };

  useEffect(() => {
    loadAnalyticsData();
    updateConnectionStatus();
  }, []);

  const updateConnectionStatus = () => {
    const status = csharpDataService.getConnectionStatus();
    setConnectionStatus(status);
  };

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Try to load data from C# backend first
      const [betsData, analyticsData] = await Promise.all([
        csharpDataService.getBettingData(),
        csharpDataService.getAnalyticsData()
      ]);
      
      setBets(betsData);
      setStats({
        totalBets: analyticsData.totalBets,
        winRate: analyticsData.winRate,
        totalProfit: analyticsData.totalProfit,
        averageROI: analyticsData.roi,
        profitByMonth: [],
        profitByStrategy: []
      });
      
      console.log('✅ Data loaded from C# backend:', { 
        bets: betsData.length, 
        totalProfit: analyticsData.totalProfit 
      });
      
    } catch (error) {
      console.error('❌ Error loading analytics from C# backend:', error);
      
      // Clear all data instead of showing mock data
      setBets([]);
      setStats({
        totalBets: 0,
        winRate: 0,
        totalProfit: 0,
        averageROI: 0,
        profitByMonth: [],
        profitByStrategy: []
      });
    } finally {
      setLoading(false);
      updateConnectionStatus();
    }
  };

  // Clear all data function
  const clearAllData = () => {
    setBets([]);
    setStats({
      totalBets: 0,
      winRate: 0,
      totalProfit: 0,
      averageROI: 0,
      profitByMonth: [],
      profitByStrategy: []
    });
    setDatabaseTeams([]);
    setRecommendations([]);
    console.log('🗑️ All analytics data cleared');
  };

  // Load teams from database
  const loadTeamsFromDatabase = async () => {
    try {
      setTeamsLoading(true);
      console.log('🔄 Завантаження команд з бази даних...');
      
      const teamsData = await csharpDataService.getTeamsData();
      console.log('✅ Команди завантажено з C# backend:', teamsData);
      
      setDatabaseTeams(teamsData as DatabaseTeam[]);
    } catch (error) {
      console.error('❌ Помилка завантаження команд:', error);
      // Clear teams data on error
      setDatabaseTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  };

  // Generate recommendation with detailed analysis
  const generateRecommendation = (team1: string, team2: string): TeamRecommendation => {
    const t1 = teams[team1 as keyof typeof teams];
    const t2 = teams[team2 as keyof typeof teams];
    
    if (!t1 || !t2) {
      return {
        team: team1,
        opponent: team2,
        recommendation: 'avoid',
        confidence: 0,
        reasons: ['Недостатньо даних'],
        stabilityScore: 0,
        detailedAnalysis: {
          tierComparison: 'Недостатньо даних для порівняння тірів',
          rankComparison: 'Недостатньо даних для порівняння рейтингів',
          winRateAnalysis: 'Недостатньо даних для аналізу win rate',
          recentFormAnalysis: 'Недостатньо даних для аналізу форми',
          headToHeadAnalysis: 'Недостатньо даних для H2H аналізу',
          mapAnalysis: [],
          stabilityAnalysis: 'Недостатньо даних для аналізу стабільності',
          riskFactors: ['Недостатньо статистичних даних'],
          strengths: [],
          recommendation: 'Уникайте ставки через брак даних'
        }
      };
    }

    const reasons: string[] = [];
    let confidence = 50;
    let recommendation: 'strong_bet' | 'moderate_bet' | 'avoid' | 'risky' = 'moderate_bet';

    // Detailed analysis
    const detailedAnalysis = {
      tierComparison: '',
      rankComparison: '',
      winRateAnalysis: '',
      recentFormAnalysis: '',
      headToHeadAnalysis: '',
      mapAnalysis: [] as string[],
      stabilityAnalysis: '',
      riskFactors: [] as string[],
      strengths: [] as string[],
      recommendation: ''
    };

    // Tier analysis
    if (t1.tier && t2.tier) {
      const tierValues = { tier1: 1, tier2: 2, tier3: 3 };
      const tierDiff = tierValues[t1.tier] - tierValues[t2.tier];
      
      if (tierDiff < 0) {
        confidence += 20;
        reasons.push(`${t1.name} в вищому тірі (${t1.tier.toUpperCase()} vs ${t2.tier.toUpperCase()})`);
        detailedAnalysis.tierComparison = `${t1.name} має перевагу в тірі: ${t1.tier.toUpperCase()} проти ${t2.tier.toUpperCase()}. Команди вищого тіру зазвичай мають кращу підготовку та досвід.`;
        detailedAnalysis.strengths.push('Перевага в тірі');
      } else if (tierDiff > 0) {
        confidence -= 15;
        reasons.push(`${t2.name} в вищому тірі (${t2.tier.toUpperCase()} vs ${t1.tier.toUpperCase()})`);
        detailedAnalysis.tierComparison = `${t2.name} має перевагу в тірі: ${t2.tier.toUpperCase()} проти ${t1.tier.toUpperCase()}. Це може створювати додаткові труднощі для ${t1.name}.`;
        detailedAnalysis.riskFactors.push('Нижчий тір');
      } else {
        detailedAnalysis.tierComparison = `Обидві команди в одному тірі (${t1.tier.toUpperCase()}), що робить матч більш непередбачуваним.`;
      }
    }

    // Rank analysis
    if (t1.rank && t2.rank) {
      const rankDiff = t2.rank - t1.rank;
      if (rankDiff > 10) {
        confidence += 15;
        reasons.push(`Значна перевага в рейтингу: #${t1.rank} vs #${t2.rank}`);
        detailedAnalysis.rankComparison = `${t1.name} значно вище в рейтингу (#${t1.rank} проти #${t2.rank}). Різниця в ${rankDiff} позицій вказує на суттєву перевагу в класі гри.`;
        detailedAnalysis.strengths.push('Значна перевага в рейтингу');
      } else if (rankDiff < -10) {
        confidence -= 10;
        reasons.push(`Нижче в рейтингу: #${t1.rank} vs #${t2.rank}`);
        detailedAnalysis.rankComparison = `${t1.name} нижче в рейтингу (#${t1.rank} проти #${t2.rank}). Різниця в ${Math.abs(rankDiff)} позицій може вказувати на слабшу форму.`;
        detailedAnalysis.riskFactors.push('Нижчий рейтинг');
      } else {
        detailedAnalysis.rankComparison = `Команди близькі в рейтингу (#${t1.rank} vs #${t2.rank}), що робить матч конкурентним.`;
      }
    }

    // Win rate analysis
    const winRateDiff = t1.winRate - t2.winRate;
    if (Math.abs(winRateDiff) > 15) {
      confidence += 10;
      const betterTeam = winRateDiff > 0 ? t1.name : t2.name;
      reasons.push(`Різниця у win rate: ${betterTeam} має перевагу ${Math.abs(winRateDiff)}%`);
      detailedAnalysis.winRateAnalysis = `${t1.name} має win rate ${t1.winRate}% проти ${t2.winRate}% у ${t2.name}. Різниця в ${Math.abs(winRateDiff)}% ${winRateDiff > 0 ? 'на користь' : 'не на користь'} ${t1.name}.`;
      if (winRateDiff > 0) {
        detailedAnalysis.strengths.push('Вищий win rate');
      } else {
        detailedAnalysis.riskFactors.push('Нижчий win rate');
      }
    } else {
      detailedAnalysis.winRateAnalysis = `Win rate команд близький: ${t1.name} ${t1.winRate}% vs ${t2.name} ${t2.winRate}%.`;
    }

    // Recent form analysis
    const t1RecentWins = t1.recentForm.slice(-5).filter(r => r === 'W').length;
    const t2RecentWins = t2.recentForm.slice(-5).filter(r => r === 'W').length;
    
    if (t1RecentWins - t2RecentWins >= 2) {
      confidence += 10;
      reasons.push(`${t1.name} в кращій формі: ${t1RecentWins}/5 vs ${t2RecentWins}/5`);
      detailedAnalysis.recentFormAnalysis = `${t1.name} показує кращу форму в останніх 5 матчах: ${t1RecentWins} перемог проти ${t2RecentWins} у ${t2.name}. Це вказує на зростання форми команди.`;
      detailedAnalysis.strengths.push('Краща recent form');
    } else if (t2RecentWins - t1RecentWins >= 2) {
      confidence -= 10;
      reasons.push(`${t2.name} в кращій формі: ${t2RecentWins}/5 vs ${t1RecentWins}/5`);
      detailedAnalysis.recentFormAnalysis = `${t2.name} показує кращу форму в останніх 5 матчах: ${t2RecentWins} перемог проти ${t1RecentWins} у ${t1.name}. Це може бути проблемою для ${t1.name}.`;
      detailedAnalysis.riskFactors.push('Гірша recent form');
    } else {
      detailedAnalysis.recentFormAnalysis = `Форма команд схожа: ${t1.name} ${t1RecentWins}/5 vs ${t2.name} ${t2RecentWins}/5.`;
    }

    // Head-to-head analysis
    if (t1.headToHead[t2.name]) {
      const h2h = t1.headToHead[t2.name];
      if (h2h.winRate > 70) {
        confidence += 15;
        reasons.push(`Історична перевага: ${h2h.wins}-${h2h.losses} (${h2h.winRate}%)`);
        detailedAnalysis.headToHeadAnalysis = `${t1.name} має сильну історичну перевагу над ${t2.name}: ${h2h.wins} перемог проти ${h2h.losses} поразок (${h2h.winRate}% win rate). Це вказує на тактичну перевагу або психологічний фактор.`;
        detailedAnalysis.strengths.push('Сильна історична перевага');
      } else if (h2h.winRate < 30) {
        confidence -= 10;
        reasons.push(`Історично програє: ${h2h.wins}-${h2h.losses} (${h2h.winRate}%)`);
        detailedAnalysis.headToHeadAnalysis = `${t1.name} має слабкі результати проти ${t2.name}: ${h2h.wins} перемог проти ${h2h.losses} поразок (${h2h.winRate}% win rate). Це може вказувати на стилістичні проблеми.`;
        detailedAnalysis.riskFactors.push('Слабка історична статистика');
      } else {
        detailedAnalysis.headToHeadAnalysis = `Історична статистика збалансована: ${h2h.wins}-${h2h.losses} (${h2h.winRate}%).`;
      }
    } else {
      detailedAnalysis.headToHeadAnalysis = 'Недостатньо даних для H2H аналізу.';
    }

    // Map analysis (if data available)
    if (t1.mapStats && t2.mapStats) {
      const commonMaps = Object.keys(t1.mapStats).filter(map => t2.mapStats[map]);
      commonMaps.forEach(map => {
        const t1MapWR = t1.mapStats[map].winRate;
        const t2MapWR = t2.mapStats[map].winRate;
        const diff = t1MapWR - t2MapWR;
        
        if (Math.abs(diff) > 20) {
          const betterTeam = diff > 0 ? t1.name : t2.name;
          detailedAnalysis.mapAnalysis.push(`${map}: ${betterTeam} має перевагу (${t1MapWR}% vs ${t2MapWR}%)`);
          if (diff > 0) {
            detailedAnalysis.strengths.push(`Перевага на ${map}`);
          } else {
            detailedAnalysis.riskFactors.push(`Слабкість на ${map}`);
          }
        }
      });
    }

    // Stability analysis
    const stabilityDiff = t1.stabilityIndex - t2.stabilityIndex;
    if (Math.abs(stabilityDiff) > 15) {
      confidence += 8;
      reasons.push(`Різниця у стабільності: ${Math.abs(stabilityDiff)} балів`);
      if (stabilityDiff > 0) {
        detailedAnalysis.stabilityAnalysis = `${t1.name} має вищий індекс стабільності (${t1.stabilityIndex} vs ${t2.stabilityIndex}). Це означає більш передбачувані результати та менший ризик несподіванок.`;
        detailedAnalysis.strengths.push('Вища стабільність');
      } else {
        detailedAnalysis.stabilityAnalysis = `${t2.name} має вищий індекс стабільності (${t2.stabilityIndex} vs ${t1.stabilityIndex}). Це може створювати додаткові ризики для ставки на ${t1.name}.`;
        detailedAnalysis.riskFactors.push('Нижча стабільність');
      }
    } else {
      detailedAnalysis.stabilityAnalysis = `Стабільність команд схожа: ${t1.stabilityIndex} vs ${t2.stabilityIndex}.`;
    }

    // Determine recommendation
    if (confidence >= 80) {
      recommendation = 'strong_bet';
      detailedAnalysis.recommendation = 'Сильна рекомендація для ставки. Всі ключові фактори вказують на високу ймовірність успіху.';
    } else if (confidence >= 65) {
      recommendation = 'moderate_bet';
      detailedAnalysis.recommendation = 'Помірна рекомендація. Є достатньо позитивних факторів, але потрібна обережність.';
    } else if (confidence < 40) {
      recommendation = 'avoid';
      detailedAnalysis.recommendation = 'Рекомендується уникати ставки через високі ризики та негативні фактори.';
    } else {
      recommendation = 'risky';
      detailedAnalysis.recommendation = 'Ризикована ставка. Можлива як для досвідчених беттерів, але з обмеженою сумою.';
    }

    return {
      team: team1,
      opponent: team2,
      recommendation,
      confidence: Math.min(95, confidence),
      reasons,
      stabilityScore: t1.stabilityIndex,
      detailedAnalysis
    };
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'strong_bet': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate_bet': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'risky': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'avoid': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'strong_bet': return <CheckCircle className="h-4 w-4" />;
      case 'moderate_bet': return <Target className="h-4 w-4" />;
      case 'risky': return <AlertTriangle className="h-4 w-4" />;
      case 'avoid': return <Shield className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case 'strong_bet': return 'Сильна ставка';
      case 'moderate_bet': return 'Помірна ставка';
      case 'risky': return 'Ризикована';
      case 'avoid': return 'Уникати';
      default: return 'Невідомо';
    }
  };

  // Calculate additional metrics
  const completedBets = bets.filter((bet: Bet) => bet.result !== 'Pending');
  const winningBets = completedBets.filter((bet: Bet) => bet.result === 'Win');
  const losingBets = completedBets.filter((bet: Bet) => bet.result === 'Loss');
  
  // Streak analysis
  const calculateStreaks = () => {
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    
    const sortedBets = [...completedBets].sort((a: Bet, b: Bet) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    for (const bet of sortedBets) {
      if (bet.result === 'Win') {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    }
    
    return { maxWinStreak, maxLossStreak, currentWinStreak, currentLossStreak };
  };

  const streaks = calculateStreaks();

  // Odds analysis
  const oddsAnalysis = (): OddsRange[] => {
    const lowOdds = completedBets.filter((bet: Bet) => bet.odds < 2.0);
    const midOdds = completedBets.filter((bet: Bet) => bet.odds >= 2.0 && bet.odds < 3.0);
    const highOdds = completedBets.filter((bet: Bet) => bet.odds >= 3.0);
    
    return [
      {
        range: 'Низькі (< 2.0)',
        count: lowOdds.length,
        winRate: lowOdds.length ? (lowOdds.filter((b: Bet) => b.result === 'Win').length / lowOdds.length * 100).toFixed(1) : '0',
        profit: lowOdds.reduce((sum: number, bet: Bet) => sum + (bet.profit || 0), 0)
      },
      {
        range: 'Середні (2.0-3.0)',
        count: midOdds.length,
        winRate: midOdds.length ? (midOdds.filter((b: Bet) => b.result === 'Win').length / midOdds.length * 100).toFixed(1) : '0',
        profit: midOdds.reduce((sum: number, bet: Bet) => sum + (bet.profit || 0), 0)
      },
      {
        range: 'Високі (> 3.0)',
        count: highOdds.length,
        winRate: highOdds.length ? (highOdds.filter((b: Bet) => b.result === 'Win').length / highOdds.length * 100).toFixed(1) : '0',
        profit: highOdds.reduce((sum: number, bet: Bet) => sum + (bet.profit || 0), 0)
      }
    ];
  };

  // Top teams for analytics tab (betting stats only)
  const teamAnalysis = (): TeamStats[] => {
    const teamStats: { [key: string]: { bets: number; wins: number; profit: number } } = {};
    
    bets.forEach((bet: Bet) => {
      const teams = bet.match ? bet.match.split(' vs ') : [bet.team1, bet.team2];
      teams.forEach((team: string | undefined) => {
        if (team && team.trim()) {
          const teamName = team.trim();
          if (!teamStats[teamName]) {
            teamStats[teamName] = { bets: 0, wins: 0, profit: 0 };
          }
          if (bet.result !== 'Pending') {
            teamStats[teamName].bets++;
            if (bet.result === 'Win') teamStats[teamName].wins++;
            teamStats[teamName].profit += bet.profit || 0;
          }
        }
      });
    });
    
    return Object.entries(teamStats)
      .map(([team, stats]) => ({
        team,
        bets: stats.bets,
        winRate: stats.bets ? (stats.wins / stats.bets * 100).toFixed(1) : '0',
        profit: Math.round(stats.profit * 100) / 100
      }))
      .filter(t => t.bets >= 2)
      .sort((a, b) => b.bets - a.bets)
      .slice(0, 10);
  };

  // Bet type distribution
  const betTypeDistribution = () => {
    const distribution: { [key: string]: number } = {};
    bets.forEach((bet: Bet) => {
      const type = bet.betType || 'Winner';
      distribution[type] = (distribution[type] || 0) + 1;
    });
    
    const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];
    return Object.entries(distribution).map(([type, count], index) => ({
      name: type,
      value: count,
      color: colors[index % colors.length]
    }));
  };

  // Monthly profit data
  const monthlyProfitData = () => {
    const monthlyData: { [key: string]: number } = {};
    
    completedBets.forEach((bet: Bet) => {
      const date = new Date(bet.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
      
      if (!monthlyData[monthName]) {
        monthlyData[monthName] = 0;
      }
      monthlyData[monthName] += bet.profit || 0;
    });
    
    return Object.entries(monthlyData).map(([month, profit]) => ({
      month,
      profit: Math.round(profit * 100) / 100
    }));
  };

  // Calendar activity
  const calendarData = (): CalendarData[] => {
    const dailyData: { [key: string]: { count: number; profit: number } } = {};
    
    bets.forEach((bet: Bet) => {
      const date = new Date(bet.date).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { count: 0, profit: 0 };
      }
      dailyData[date].count++;
      if (bet.result !== 'Pending') {
        dailyData[date].profit += bet.profit || 0;
      }
    });
    
    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      count: data.count,
      profit: Math.round(data.profit * 100) / 100
    }));
  };

  // Balance over time
  const balanceOverTime = (): BalanceData[] => {
    const initialBalance = 1000; // Can be made configurable
    let runningBalance = initialBalance;
    
    const sortedBets = [...completedBets].sort((a: Bet, b: Bet) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const balanceData: BalanceData[] = [{ date: sortedBets[0]?.date || new Date().toISOString().split('T')[0], balance: initialBalance, profit: 0 }];
    
    sortedBets.forEach((bet: Bet) => {
      runningBalance += bet.profit || 0;
      balanceData.push({
        date: bet.date,
        balance: runningBalance,
        profit: bet.profit || 0
      });
    });
    
    return balanceData;
  };

  // Scatter plot: Odds vs Profit
  const oddsVsProfitData = (): ScatterData[] => {
    return completedBets.map((bet: Bet) => ({
      odds: bet.odds || 0,
      profit: bet.profit || 0,
      result: bet.result
    }));
  };

  const exportReport = () => {
    // Simple export to JSON (can be extended to PDF)
    const reportData = {
      summary: stats,
      bets: completedBets,
      analysis: {
        streaks,
        oddsAnalysis: oddsAnalysis(),
        topTeams: teamAnalysis()
      },
      connectionStatus,
      generatedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cs2-betting-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const oddsData = oddsAnalysis();
  const topTeamsData = teamAnalysis();
  const betTypes = betTypeDistribution();
  const monthlyProfit = monthlyProfitData();
  const heatmapData = calendarData();
  const balanceData = balanceOverTime();
  const scatterData = oddsVsProfitData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CS2 Betting Analytics</h1>
          <p className="text-gray-600">Детальний аналіз вашої беттінг активності з інтеграцією C# backend</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportReport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Експорт
          </Button>
          <Button variant="outline" onClick={loadAnalyticsData} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Оновити
          </Button>
          <Button variant="destructive" onClick={clearAllData} className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Очистити дані
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Alert className={connectionStatus.connected ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
        <div className="flex items-center gap-2">
          {connectionStatus.connected ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-yellow-600" />}
          <Database className="h-4 w-4" />
        </div>
        <AlertDescription>
          <strong>Backend Status:</strong> {connectionStatus.environment} 
          {connectionStatus.connected ? 
            ' - З\'єднано з C# SQLite базою даних' : 
            ' - Немає підключення до бази даних'
          }
        </AlertDescription>
      </Alert>

      {/* No Data Warning */}
      {bets.length === 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <strong>Немає даних для аналізу.</strong> Підключіть C# backend або додайте ставки для перегляду аналітики.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Загальний профіт</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-1 ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.totalProfit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit} ₴
            </div>
            <p className="text-xs text-muted-foreground">
              З {completedBets.length} завершених ставок
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Відсоток перемог</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate}%</div>
            <Progress value={stats.winRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Поточна серія</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${streaks.currentWinStreak > 0 ? 'text-green-600' : streaks.currentLossStreak > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {streaks.currentWinStreak > 0 ? `+${streaks.currentWinStreak}` : 
               streaks.currentLossStreak > 0 ? `-${streaks.currentLossStreak}` : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Макс: +{streaks.maxWinStreak} / -{streaks.maxLossStreak}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Середній ROI</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.averageROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.averageROI >= 0 ? '+' : ''}{stats.averageROI}%
            </div>
            <p className="text-xs text-muted-foreground">
              На одну ставку
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="profit">Прибуток</TabsTrigger>
          <TabsTrigger value="odds">Коефіцієнти</TabsTrigger>
          <TabsTrigger value="teams">Команди</TabsTrigger>
          <TabsTrigger value="comparison">Періоди</TabsTrigger>
          <TabsTrigger value="prediction">Прогнози</TabsTrigger>
          <TabsTrigger value="recommendations">Рекомендації</TabsTrigger>
          <TabsTrigger value="risks">Ризики</TabsTrigger>
          <TabsTrigger value="insights">Висновки</TabsTrigger>
        </TabsList>

        <TabsContent value="profit">
          <div className="grid grid-cols-1 gap-6">
            {bets.length > 0 ? (
              <>
                <BalanceChart data={balanceData} />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Прибуток по місяцях</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyProfit}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value} ₴`, 'Прибуток']} />
                          <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Коефіцієнти vs Прибуток</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart data={scatterData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="odds" name="Коефіцієнт" />
                          <YAxis dataKey="profit" name="Прибуток" />
                          <Tooltip formatter={(value, name) => [
                            name === 'odds' ? value : `${value} ₴`,
                            name === 'odds' ? 'Коефіцієнт' : 'Прибуток'
                          ]} />
                          <Scatter dataKey="profit" fill="#8b5cf6" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Top teams by betting stats only */}
                {topTeamsData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Топ-10 команд за кількістю ставок</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {topTeamsData.map((team, index) => (
                          <div key={team.team} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                index < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <h3 className="font-semibold">{team.team}</h3>
                                <p className="text-sm text-gray-600">{team.bets} ставок</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-4">
                                <Badge variant={Number(team.winRate) > 50 ? 'default' : 'secondary'}>
                                  {team.winRate}% WR
                                </Badge>
                                <span className={`font-medium ${team.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {team.profit >= 0 ? '+' : ''}{team.profit} ₴
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Немає даних про прибуток</h3>
                  <p className="text-gray-600">Додайте ставки для перегляду аналізу прибутку</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="odds">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Аналіз по коефіцієнтах</CardTitle>
              </CardHeader>
              <CardContent>
                {bets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {oddsData.map((range) => (
                      <div key={range.range} className="p-4 border rounded-lg">
                        <h3 className="font-semibold mb-2">{range.range}</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Ставок:</span>
                            <span className="font-medium">{range.count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Win Rate:</span>
                            <span className="font-medium">{range.winRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Прибуток:</span>
                            <span className={`font-medium ${range.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {range.profit >= 0 ? '+' : ''}{Math.round(range.profit * 100) / 100} ₴
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Немає даних для аналізу коефіцієнтів</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Розподіл типів ставок</CardTitle>
              </CardHeader>
              <CardContent>
                {betTypes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={betTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {betTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Немає даних про типи ставок</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="teams">
          <div className="space-y-6">
            {/* Top 3 Teams Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Топ-3 команди світу (HLTV рейтинг)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {topTeams.map((team, index) => (
                    <Card key={team.name} className={`relative overflow-hidden ${
                      index === 0 ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100' :
                      index === 1 ? 'border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100' :
                      'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100'
                    }`}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${
                              index === 0 ? 'bg-yellow-200 text-yellow-800' :
                              index === 1 ? 'bg-gray-200 text-gray-800' :
                              'bg-orange-200 text-orange-800'
                            }`}>
                              {team.logo}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{team.name}</h3>
                              <p className="text-sm text-gray-600">{team.country}</p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-500 text-white' :
                            'bg-orange-500 text-white'
                          }`}>
                            #{team.rank}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Очки:</span>
                            <span className="font-semibold">{team.points}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Win Rate:</span>
                            <span className="font-semibold text-green-600">{team.winRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Карти:</span>
                            <span className="font-semibold">{team.mapWins}-{team.mapLosses}</span>
                          </div>
                          
                          <div>
                            <span className="text-sm text-gray-600 block mb-2">Остання форма:</span>
                            <div className="flex gap-1">
                              {team.recentForm.map((result, i) => (
                                <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  result === 'W' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                }`}>
                                  {result}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Database Teams Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Команди з бази даних
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    onClick={loadTeamsFromDatabase} 
                    disabled={teamsLoading}
                    className="flex items-center gap-2"
                  >
                    {teamsLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {teamsLoading ? 'Завантаження...' : 'Завантажити команди'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {databaseTeams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {databaseTeams.map((team) => (
                      <Card key={team.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">{team.name}</h3>
                            <Badge variant="outline">#{team.position}</Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Позиція:</span>
                              <span className="font-medium">{team.position}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Очки:</span>
                              <span className="font-medium">{team.points}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">HLTV ID:</span>
                              <span className="font-medium">{team.hltvId}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Команди не завантажені</p>
                    <Button onClick={loadTeamsFromDatabase} disabled={teamsLoading}>
                      {teamsLoading ? 'Завантаження...' : 'Завантажити команди з бази даних'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Popular Maps Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Популярні карти CS2
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {popularMaps.map((map, index) => (
                    <Card key={map.name} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl">
                            {map.image}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{map.name}</h3>
                            <p className="text-sm text-gray-600">Play Rate: {map.playRate}</p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-4">{map.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Середня кількість раундів:</span>
                            <span className="font-medium">{map.avgRounds}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">T-Side Win Rate:</span>
                            <span className="font-medium">{map.tSideWinRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${map.tSideWinRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <PeriodComparison bets={bets} />
        </TabsContent>

        <TabsContent value="prediction">
          <PredictiveAnalytics bets={bets} />
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Генератор рекомендацій на основі нової системи тірів
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Команда 1:</label>
                    <select 
                      className="w-full p-2 border rounded-md mt-1"
                      onChange={(e) => {
                        const team2 = (document.querySelector('select[data-team="2"]') as HTMLSelectElement)?.value;
                        if (e.target.value && team2 && e.target.value !== team2) {
                          const rec = generateRecommendation(e.target.value, team2);
                          setRecommendations([rec]);
                        }
                      }}
                    >
                      <option value="">Оберіть команду</option>
                      {Object.keys(teams).map(team => (
                        <option key={team} value={team}>
                          {team} {teams[team as keyof typeof teams].tier && `(${teams[team as keyof typeof teams].tier?.toUpperCase()})`} {teams[team as keyof typeof teams].rank && `#${teams[team as keyof typeof teams].rank}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Команда 2:</label>
                    <select 
                      className="w-full p-2 border rounded-md mt-1"
                      data-team="2"
                      onChange={(e) => {
                        const team1 = (document.querySelector('select:not([data-team])') as HTMLSelectElement)?.value;
                        if (e.target.value && team1 && e.target.value !== team1) {
                          const rec = generateRecommendation(team1, e.target.value);
                          setRecommendations([rec]);
                        }
                      }}
                    >
                      <option value="">Оберіть команду</option>
                      {Object.keys(teams).map(team => (
                        <option key={team} value={team}>
                          {team} {teams[team as keyof typeof teams].tier && `(${teams[team as keyof typeof teams].tier?.toUpperCase()})`} {teams[team as keyof typeof teams].rank && `#${teams[team as keyof typeof teams].rank}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {recommendations.map((rec, index) => (
                  <div key={index} className={`p-6 border rounded-lg ${getRecommendationColor(rec.recommendation)}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {getRecommendationIcon(rec.recommendation)}
                        <h3 className="font-semibold text-lg">{rec.team} vs {rec.opponent}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-medium">{getRecommendationText(rec.recommendation)}</Badge>
                        <Badge variant="outline" className="font-medium">{rec.confidence}% впевненості</Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left column - Basic information */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          <span className="text-sm font-medium">Індекс стабільності: {rec.stabilityScore}/100</span>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium mb-2">Короткі причини:</p>
                          <ul className="text-sm space-y-1">
                            {rec.reasons.map((reason, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-xs mt-1">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 bg-white/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4" />
                            <span className="text-sm font-medium">Рекомендація:</span>
                          </div>
                          <p className="text-sm">{rec.detailedAnalysis.recommendation}</p>
                        </div>
                      </div>

                      {/* Right column - Detailed analysis */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Детальний аналіз
                          </h4>
                          
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="font-medium text-blue-600">Тіри:</span>
                              <p className="text-gray-700">{rec.detailedAnalysis.tierComparison}</p>
                            </div>
                            
                            <div>
                              <span className="font-medium text-purple-600">Рейтинг:</span>
                              <p className="text-gray-700">{rec.detailedAnalysis.rankComparison}</p>
                            </div>
                            
                            <div>
                              <span className="font-medium text-green-600">Win Rate:</span>
                              <p className="text-gray-700">{rec.detailedAnalysis.winRateAnalysis}</p>
                            </div>
                            
                            <div>
                              <span className="font-medium text-orange-600">Форма:</span>
                              <p className="text-gray-700">{rec.detailedAnalysis.recentFormAnalysis}</p>
                            </div>
                            
                            <div>
                              <span className="font-medium text-red-600">H2H:</span>
                              <p className="text-gray-700">{rec.detailedAnalysis.headToHeadAnalysis}</p>
                            </div>
                            
                            {rec.detailedAnalysis.mapAnalysis.length > 0 && (
                              <div>
                                <span className="font-medium text-indigo-600 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  Карти:
                                </span>
                                <ul className="text-gray-700 ml-4">
                                  {rec.detailedAnalysis.mapAnalysis.map((analysis, i) => (
                                    <li key={i} className="text-xs">• {analysis}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div>
                              <span className="font-medium text-teal-600">Стабільність:</span>
                              <p className="text-gray-700">{rec.detailedAnalysis.stabilityAnalysis}</p>
                            </div>
                          </div>
                        </div>

                        {/* Strengths and risks */}
                        <div className="grid grid-cols-2 gap-3">
                          {rec.detailedAnalysis.strengths.length > 0 && (
                            <div className="p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendUp className="h-3 w-3 text-green-600" />
                                <span className="text-xs font-medium text-green-800">Сильні сторони</span>
                              </div>
                              <ul className="text-xs text-green-700 space-y-1">
                                {rec.detailedAnalysis.strengths.map((strength, i) => (
                                  <li key={i}>• {strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {rec.detailedAnalysis.riskFactors.length > 0 && (
                            <div className="p-3 bg-red-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendDown className="h-3 w-3 text-red-600" />
                                <span className="text-xs font-medium text-red-800">Ризик-фактори</span>
                              </div>
                              <ul className="text-xs text-red-700 space-y-1">
                                {rec.detailedAnalysis.riskFactors.map((risk, i) => (
                                  <li key={i}>• {risk}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks">
          <RiskManagement bets={bets} />
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Сильні сторони</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.winRate > 50 && (
                    <div className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm">Позитивний win rate ({stats.winRate}%)</span>
                    </div>
                  )}
                  {stats.totalProfit > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm">Прибутковість: +{stats.totalProfit} ₴</span>
                    </div>
                  )}
                  {streaks.maxWinStreak > 3 && (
                    <div className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm">Максимальна серія: {streaks.maxWinStreak} виграшів</span>
                    </div>
                  )}
                  {stats.averageROI > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm">Позитивний ROI: {stats.averageROI}%</span>
                    </div>
                  )}
                  {completedBets.length > 20 && (
                    <div className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm">Достатньо даних для аналізу ({completedBets.length} ставок)</span>
                    </div>
                  )}
                  {connectionStatus.connected && (
                    <div className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm">Підключено до C# SQLite бази даних</span>
                    </div>
                  )}
                  {bets.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Немає даних для аналізу сильних сторін</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-orange-700">Області для покращення</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedBets.length < 10 && completedBets.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-orange-500">!</span>
                      <span className="text-sm">Мало даних для аналізу (менше 10 ставок)</span>
                    </div>
                  )}
                  {stats.winRate < 50 && stats.winRate > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-orange-500">!</span>
                      <span className="text-sm">Win rate нижче 50% ({stats.winRate}%)</span>
                    </div>
                  )}
                  {streaks.maxLossStreak > 5 && (
                    <div className="flex items-start gap-2">
                      <span className="text-orange-500">!</span>
                      <span className="text-sm">Довга серія програшів: {streaks.maxLossStreak}</span>
                    </div>
                  )}
                  {stats.totalProfit < 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-red-500">⚠</span>
                      <span className="text-sm">Загальний збиток: {stats.totalProfit} ₴</span>
                    </div>
                  )}
                  {stats.averageROI < 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-red-500">⚠</span>
                      <span className="text-sm">Негативний ROI: {stats.averageROI}%</span>
                    </div>
                  )}
                  {!connectionStatus.connected && (
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-500">!</span>
                      <span className="text-sm">Немає підключення до C# backend</span>
                    </div>
                  )}
                  {bets.length === 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500">ℹ</span>
                      <span className="text-sm">Додайте ставки для початку аналізу</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}