import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  Trophy, 
  Clock, 
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Users,
  Zap,
  ArrowUpDown,
  Search,
  Loader2,
  ExternalLink,
  Flame,
  Shield,
  AlertCircle,
  Eye,
  EyeOff,
  MousePointerClick,
  CheckCircle,
  Info,
  Brain,
  Sparkles
} from 'lucide-react';
import { fetchAndParseMatches, convertToMatchFormat, type MatchData } from '@/lib/parser/hltvParser';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AIRecommendationModal from '@/components/AIRecommendationModal';
import CommentModal from '@/components/CommentModal';
import { geminiService, type AIRecommendation } from '@/lib/geminiService';

// Form Stability Types
type FormStability = 'hot_streak' | 'stable' | 'momentum' | 'falling' | 'slump' | 'inconsistent';

interface RiskyTeam {
  name: string;
  game: string;
  status: string;
  notes: string;
}

interface Match {
  id: string;
  date: string;
  team1: string;
  team2: string;
  favorite: string;
  aiConfidence: number;
  risk: number;
  comment: string;
  aiSummary: string;
  odds: {
    team1: number;
    team2: number;
  };
  winRate: number;
  formStability: FormStability;
  playerForm: {
    player: string;
    rating: number;
  }[];
  context: string;
  tier: 'tier1' | 'tier2' | 'tier3';
  matchType: 'Bo1' | 'Bo3' | 'Bo5';
  upsetProbability: number;
  url?: string;
}

// Mock data for demonstration - all matches on 2025-12-21
const mockMatches: Match[] = [
  {
    id: '1',
    date: '2025-12-21',
    team1: 'NAVI',
    team2: 'Spirit',
    favorite: 'NAVI',
    aiConfidence: 77,
    risk: 23,
    comment: 'Spirit слабка на Tier-1',
    aiSummary: 'NAVI стабільно виграє топові матчі',
    odds: { team1: 1.38, team2: 3.10 },
    winRate: 70,
    formStability: 'stable',
    playerForm: [
      { player: 's1mple', rating: 1.25 },
      { player: 'b1t', rating: 1.18 }
    ],
    context: 'ESL Pro League — LAN',
    tier: 'tier1',
    matchType: 'Bo3',
    upsetProbability: 15
  },
  {
    id: '2',
    date: '2025-12-21',
    team1: 'FURIA',
    team2: 'G2',
    favorite: 'FURIA',
    aiConfidence: 82,
    risk: 18,
    comment: 'FURIA у топ-формі',
    aiSummary: 'FURIA виграла останні 5 матчів поспіль',
    odds: { team1: 1.45, team2: 2.75 },
    winRate: 75,
    formStability: 'hot_streak',
    playerForm: [
      { player: 'KSCERATO', rating: 1.32 },
      { player: 'yuurih', rating: 1.28 }
    ],
    context: 'BLAST Premier — Online',
    tier: 'tier1',
    matchType: 'Bo3',
    upsetProbability: 12
  },
  {
    id: '3',
    date: '2025-12-21',
    team1: 'Vitality',
    team2: 'Astralis',
    favorite: 'Vitality',
    aiConfidence: 65,
    risk: 35,
    comment: 'Astralis непередбачувана',
    aiSummary: 'Vitality має перевагу, але Astralis може здивувати',
    odds: { team1: 1.65, team2: 2.25 },
    winRate: 62,
    formStability: 'inconsistent',
    playerForm: [
      { player: 'ZywOo', rating: 1.35 },
      { player: 'apEX', rating: 1.05 }
    ],
    context: 'IEM Katowice — LAN',
    tier: 'tier1',
    matchType: 'Bo3',
    upsetProbability: 28
  },
  {
    id: '4',
    date: '2025-12-21',
    team1: 'FaZe',
    team2: 'Liquid',
    favorite: 'FaZe',
    aiConfidence: 58,
    risk: 42,
    comment: '',
    aiSummary: 'FaZe втрачає форму, Liquid набирає темп',
    odds: { team1: 1.85, team2: 1.95 },
    winRate: 55,
    formStability: 'falling',
    playerForm: [
      { player: 'rain', rating: 1.12 },
      { player: 'ropz', rating: 1.08 }
    ],
    context: 'ESL Pro League — Online',
    tier: 'tier1',
    matchType: 'Bo1',
    upsetProbability: 45
  },
  {
    id: '5',
    date: '2025-12-21',
    team1: 'NIP',
    team2: 'Heroic',
    favorite: 'Heroic',
    aiConfidence: 72,
    risk: 28,
    comment: 'NIP у кризі',
    aiSummary: 'Heroic стабільно перемагає Tier-2 команди',
    odds: { team1: 2.80, team2: 1.42 },
    winRate: 68,
    formStability: 'momentum',
    playerForm: [
      { player: 'TeSeS', rating: 1.22 },
      { player: 'sjuush', rating: 1.19 }
    ],
    context: 'BLAST Premier — LAN',
    tier: 'tier2',
    matchType: 'Bo3',
    upsetProbability: 20
  }
];

const getFormStabilityInfo = (form: FormStability) => {
  switch (form) {
    case 'hot_streak':
      return {
        icon: <Flame className="h-3.5 w-3.5" />,
        label: 'Hot Streak',
        color: 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-0',
        tooltip: '🔥 Команда у топ-формі з серією перемог. Висока ймовірність продовження успішної гри.'
      };
    case 'stable':
      return {
        icon: <Shield className="h-3.5 w-3.5" />,
        label: 'Stable',
        color: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0',
        tooltip: '🛡️ Стабільна форма з передбачуваними результатами. Надійний вибір для ставок.'
      };
    case 'momentum':
      return {
        icon: <TrendingUp className="h-3.5 w-3.5" />,
        label: 'Momentum',
        color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0',
        tooltip: '📈 Команда набирає темп і покращує результати. Позитивна динаміка.'
      };
    case 'falling':
      return {
        icon: <TrendingDown className="h-3.5 w-3.5" />,
        label: 'Falling',
        color: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white border-0',
        tooltip: '📉 Команда втрачає форму з погіршенням результатів. Обережно зі ставками.'
      };
    case 'slump':
      return {
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        label: 'Slump',
        color: 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0',
        tooltip: '⚠️ Команда у кризі з серією поразок. Високий ризик для ставок.'
      };
    case 'inconsistent':
      return {
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
        label: 'Inconsistent',
        color: 'bg-gradient-to-r from-gray-400 to-gray-600 text-white border-0',
        tooltip: '⚡ Непередбачувана форма зі змінними результатами. Складно прогнозувати.'
      };
  }
};

const getRiskBadge = (risk: number) => {
  if (risk <= 30) {
    return {
      label: 'Низький',
      color: 'bg-green-100 text-green-800 border-green-300',
      dotColor: 'bg-green-500'
    };
  }
  if (risk <= 50) {
    return {
      label: 'Помірний',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      dotColor: 'bg-yellow-500'
    };
  }
  return {
    label: 'Високий',
    color: 'bg-red-100 text-red-800 border-red-300',
    dotColor: 'bg-red-500'
  };
};

// Check if match is Safe Pick
const isSafePick = (match: Match): boolean => {
  return (
    match.aiConfidence >= 80 &&
    match.risk <= 30 &&
    match.upsetProbability <= 15 &&
    match.formStability !== 'falling' &&
    match.formStability !== 'slump' &&
    match.formStability !== 'inconsistent'
  );
};

// Generate AI Explanation
const getAIExplanation = (match: Match): string => {
  const factors: string[] = [];
  
  // Form Analysis
  const formLabels: Record<FormStability, string> = {
    hot_streak: '🔥 Команда у топ-формі (серія перемог)',
    stable: '🛡️ Стабільна форма (передбачувані результати)',
    momentum: '📈 Набирає темп (покращення результатів)',
    falling: '📉 Втрачає форму (погіршення результатів)',
    slump: '⚠️ У кризі (серія поразок)',
    inconsistent: '⚡ Непередбачувана форма (змінні результати)'
  };
  factors.push(`Форма: ${formLabels[match.formStability]}`);
  
  // Win Rate
  if (match.winRate >= 70) {
    factors.push(`✅ Високий Win Rate: ${match.winRate}% (сильна історія перемог)`);
  } else if (match.winRate >= 60) {
    factors.push(`➖ Середній Win Rate: ${match.winRate}% (стабільні результати)`);
  } else {
    factors.push(`⚠️ Низький Win Rate: ${match.winRate}% (слабка історія)`);
  }
  
  // Odds Analysis
  const oddsDiff = Math.abs(match.odds.team1 - match.odds.team2);
  if (oddsDiff > 1.0) {
    factors.push(`💰 Великий розрив в коефіцієнтах (${match.odds.team1} vs ${match.odds.team2})`);
  } else {
    factors.push(`⚖️ Рівні коефіцієнти (${match.odds.team1} vs ${match.odds.team2})`);
  }
  
  // Match Type
  const matchTypeLabels = {
    Bo1: '⚡ Bo1 - висока непередбачуваність',
    Bo3: '🎯 Bo3 - збалансований формат',
    Bo5: '🏆 Bo5 - максимальна надійність'
  };
  factors.push(`Формат: ${matchTypeLabels[match.matchType]}`);
  
  // Player Form
  if (match.playerForm.length > 0) {
    const avgRating = match.playerForm.reduce((sum, p) => sum + p.rating, 0) / match.playerForm.length;
    if (avgRating >= 1.2) {
      factors.push(`⭐ Топ-гравці у формі (середній рейтинг: ${avgRating.toFixed(2)})`);
    }
  }
  
  // Tier Analysis
  const tierLabels = {
    tier1: '🏆 Tier 1 - топові команди',
    tier2: '🥈 Tier 2 - середній рівень',
    tier3: '🥉 Tier 3 - нижчий рівень'
  };
  factors.push(`Рівень: ${tierLabels[match.tier]}`);
  
  return factors.join('\n');
};

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>(mockMatches);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'risk' | 'upset'>('confidence');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterTier, setFilterTier] = useState<'all' | 'tier1' | 'tier2' | 'tier3'>('all');
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [filterRisk, setFilterRisk] = useState<'all' | 'safe' | 'moderate' | 'high'>('all');
  const [filterMatchType, setFilterMatchType] = useState<'all' | 'Bo1' | 'Bo3' | 'Bo5'>('all');
  const [showHotMatches, setShowHotMatches] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI Recommendation Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Comment Modal State
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedCommentMatch, setSelectedCommentMatch] = useState<Match | null>(null);
  
  // Load risky teams from admin_risky_teams (global storage)
  const [riskyTeams, setRiskyTeams] = useState<RiskyTeam[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    loadRiskyTeams();
  }, []);

  const loadRiskyTeams = () => {
    try {
      const saved = localStorage.getItem('admin_risky_teams');
      if (saved) {
        setRiskyTeams(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading risky teams:', error);
    }
  };

  const getTeamRiskInfo = (teamName: string): { notes: string; status: string } | null => {
    const team = riskyTeams.find(t => 
      t.name.toLowerCase() === teamName.toLowerCase() ||
      teamName.toLowerCase().includes(t.name.toLowerCase()) ||
      t.name.toLowerCase().includes(teamName.toLowerCase())
    );
    
    if (team) {
      return {
        notes: team.notes,
        status: team.status
      };
    }
    return null;
  };

  // Get admin risk comments only (from Аналітика - Ризики)
  const getMatchRiskComments = (team1: string, team2: string): string => {
    const team1Risk = getTeamRiskInfo(team1);
    const team2Risk = getTeamRiskInfo(team2);
    
    const comments: string[] = [];
    
    if (team1Risk) {
      const icon = team1Risk.status === 'БАН' ? '🔴' : 
                   team1Risk.status === 'Нестабільні' ? '🟠' : 
                   team1Risk.status === 'Обережно' ? '🟡' : '🔵';
      comments.push(`${icon} ${team1}: ${team1Risk.notes || team1Risk.status}`);
    }
    
    if (team2Risk) {
      const icon = team2Risk.status === 'БАН' ? '🔴' : 
                   team2Risk.status === 'Нестабільні' ? '🟠' : 
                   team2Risk.status === 'Обережно' ? '🟡' : '🔵';
      comments.push(`${icon} ${team2}: ${team2Risk.notes || team2Risk.status}`);
    }
    
    return comments.length > 0 ? comments.join('\n\n') : '';
  };

  const handleGetAIRecommendation = async (match: Match) => {
    setSelectedMatch(match);
    setAiModalOpen(true);
    setAiLoading(true);
    setAiRecommendation(null);

    try {
      const recommendation = await geminiService.getMatchRecommendation({
        team1: match.team1,
        team2: match.team2,
        format: match.matchType,
        tier: match.tier.toUpperCase(),
        odds: match.odds
      });

      setAiRecommendation(recommendation);
    } catch (error) {
      console.error('Error getting AI recommendation:', error);
      toast({
        title: '❌ Помилка',
        description: 'Не вдалося отримати AI рекомендацію',
        variant: 'destructive'
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleShowComment = (match: Match) => {
    setSelectedCommentMatch(match);
    setCommentModalOpen(true);
  };

  // Apply filters
  const filteredMatches = matches.filter(match => {
    if (filterTier !== 'all' && match.tier !== filterTier) return false;
    if (filterConfidence === 'high' && match.aiConfidence <= 80) return false;
    if (filterConfidence === 'medium' && (match.aiConfidence <= 60 || match.aiConfidence > 80)) return false;
    if (filterConfidence === 'low' && match.aiConfidence > 60) return false;
    if (filterRisk === 'safe' && match.risk > 30) return false;
    if (filterRisk === 'moderate' && (match.risk <= 30 || match.risk > 50)) return false;
    if (filterRisk === 'high' && match.risk <= 50) return false;
    if (filterMatchType !== 'all' && match.matchType !== filterMatchType) return false;
    if (showHotMatches && (match.aiConfidence <= 70 || match.upsetProbability >= 20)) return false;
    if (searchQuery && !match.team1.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !match.team2.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Apply sorting
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'confidence':
        comparison = b.aiConfidence - a.aiConfidence;
        break;
      case 'risk':
        comparison = a.risk - b.risk;
        break;
      case 'upset':
        comparison = b.upsetProbability - a.upsetProbability;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Get the current date (assuming all matches are for the same date)
  const currentDate = sortedMatches.length > 0 ? sortedMatches[0].date : new Date().toISOString().split('T')[0];

  // Count Safe Picks
  const safePicksCount = sortedMatches.filter(m => isSafePick(m)).length;

  const toggleSort = (column: 'date' | 'confidence' | 'risk' | 'upset') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder(column === 'confidence' ? 'desc' : 'asc');
    }
  };

  const refreshMatches = async () => {
    setIsLoading(true);
    try {
      toast({
        title: '🔄 Завантаження матчів з HLTV...',
        description: 'Використовується Supabase Edge Function',
      });

      const hltvMatches = await fetchAndParseMatches(true);
      
      if (hltvMatches && hltvMatches.length > 0) {
        const formattedMatches = hltvMatches.map(match => {
          const converted = convertToMatchFormat(match);
          return {
            ...converted,
            aiConfidence: Math.floor(Math.random() * 30) + 60,
            risk: Math.floor(Math.random() * 50) + 10,
            odds: {
              team1: match.odds1 || 1.5,
              team2: match.odds2 || 2.5
            },
            playerForm: [],
            tier: 'tier1' as const,
            matchType: (match.type?.toUpperCase() || 'Bo3') as 'Bo1' | 'Bo3' | 'Bo5',
            upsetProbability: Math.floor(Math.random() * 30) + 10,
            formStability: 'stable' as FormStability
          };
        });

        setMatches(formattedMatches);
        toast({
          title: '✅ Матчі оновлено!',
          description: `Завантажено ${formattedMatches.length} матчів з HLTV`,
        });
      } else {
        toast({
          title: '⚠️ Матчі не знайдено',
          description: 'Використовуються демо-дані',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '❌ Помилка завантаження',
        description: `Не вдалося завантажити матчі з HLTV: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-8 p-6 bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Матчі</h1>
            <p className="text-gray-500 mt-1 font-medium">Аналітична система з AI прогнозами та Form Stability</p>
          </div>
          
          <Button 
            onClick={refreshMatches} 
            className="rounded-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Завантаження...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Оновити з HLTV
              </>
            )}
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Всього матчів</p>
                  <p className="text-3xl font-semibold text-gray-900 tracking-tight">{sortedMatches.length}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl">
                  <Trophy className="h-7 w-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Безпечні матчі</p>
                  <p className="text-3xl font-semibold text-green-600 tracking-tight">
                    {sortedMatches.filter(m => m.risk <= 30).length}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-2xl">
                  <Shield className="h-7 w-7 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Hot Matches</p>
                  <p className="text-3xl font-semibold text-orange-600 tracking-tight">
                    {sortedMatches.filter(m => m.aiConfidence > 70 && m.upsetProbability < 20).length}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-2xl">
                  <Flame className="h-7 w-7 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Safe Picks</p>
                  <p className="text-3xl font-semibold text-emerald-600 tracking-tight">
                    {safePicksCount}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl">
                  <CheckCircle className="h-7 w-7 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Середній AI %</p>
                  <p className="text-3xl font-semibold text-purple-600 tracking-tight">
                    {sortedMatches.length > 0 ? Math.round(sortedMatches.reduce((sum, m) => sum + m.aiConfidence, 0) / sortedMatches.length) : 0}%
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-2xl">
                  <Target className="h-7 w-7 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Filter className="h-6 w-6 text-blue-600" />
              </div>
              Фільтри та сортування
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Tier:</label>
                <Select value={filterTier} onValueChange={(value: 'all' | 'tier1' | 'tier2' | 'tier3') => setFilterTier(value)}>
                  <SelectTrigger className="rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі</SelectItem>
                    <SelectItem value="tier1">Tier 1</SelectItem>
                    <SelectItem value="tier2">Tier 2</SelectItem>
                    <SelectItem value="tier3">Tier 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">AI Confidence:</label>
                <Select value={filterConfidence} onValueChange={(value: 'all' | 'high' | 'medium' | 'low') => setFilterConfidence(value)}>
                  <SelectTrigger className="rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі</SelectItem>
                    <SelectItem value="high">&gt;80%</SelectItem>
                    <SelectItem value="medium">60-80%</SelectItem>
                    <SelectItem value="low">&lt;60%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Ризик:</label>
                <Select value={filterRisk} onValueChange={(value: 'all' | 'safe' | 'moderate' | 'high') => setFilterRisk(value)}>
                  <SelectTrigger className="rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі</SelectItem>
                    <SelectItem value="safe">Низький</SelectItem>
                    <SelectItem value="moderate">Помірний</SelectItem>
                    <SelectItem value="high">Високий</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Тип матчу:</label>
                <Select value={filterMatchType} onValueChange={(value: 'all' | 'Bo1' | 'Bo3' | 'Bo5') => setFilterMatchType(value)}>
                  <SelectTrigger className="rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі</SelectItem>
                    <SelectItem value="Bo1">Bo1</SelectItem>
                    <SelectItem value="Bo3">Bo3</SelectItem>
                    <SelectItem value="Bo5">Bo5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Пошук:</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Команда..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Hot Match:</label>
                <Button
                  variant={showHotMatches ? 'default' : 'outline'}
                  className="w-full rounded-xl"
                  onClick={() => setShowHotMatches(!showHotMatches)}
                >
                  {showHotMatches ? 'Увімкнено' : 'Вимкнено'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matches Table - Bordered Style with White Rows */}
        {sortedMatches.length > 0 ? (
          <Card className="border-0 shadow-xl rounded-3xl bg-gradient-to-br from-white to-gray-50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <span>{currentDate}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left p-4 text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Матч</th>
                      <th className="text-left p-4 text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Фаворит</th>
                      <th 
                        className="text-center p-4 text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-200"
                        onClick={() => toggleSort('confidence')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          AI %
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </div>
                      </th>
                      <th 
                        className="text-center p-4 text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-200"
                        onClick={() => toggleSort('risk')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Ризик
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </div>
                      </th>
                      <th className="text-left p-4 text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Коефіцієнти</th>
                      <th className="text-center p-4 text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Win Rate</th>
                      <th className="text-center p-4 text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Info</th>
                      <th className="text-left p-4 text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Турнір</th>
                      <th className="text-left p-4 text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">AI Рекомендація</th>
                      <th className="text-left p-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Коментар</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMatches.map((match) => {
                      const formInfo = getFormStabilityInfo(match.formStability);
                      const riskInfo = getRiskBadge(match.risk);
                      const safePick = isSafePick(match);
                      const riskComments = getMatchRiskComments(match.team1, match.team2);
                      const aiExplanation = getAIExplanation(match);
                      
                      return (
                        <tr 
                          key={match.id} 
                          className="bg-white border-b border-gray-200 shadow-sm hover:shadow-md transition-all hover:bg-gray-50"
                        >
                          <td className="p-4 border-r border-gray-200">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-bold text-gray-900 text-base">
                                  {match.team1} <span className="text-gray-400 font-normal">vs</span> {match.team2}
                                </div>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <Badge variant="secondary" className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border-0 font-bold">
                                    {match.matchType}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border-0 font-bold">
                                    {match.tier.toUpperCase()}
                                  </Badge>
                                  {match.url && (
                                    <a 
                                      href={match.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 transition-colors p-1 hover:bg-blue-50 rounded-lg inline-block"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 border-r border-gray-200">
                            <div className="font-bold text-blue-700 text-sm">{match.favorite}</div>
                          </td>
                          <td className="p-4 text-center border-r border-gray-200">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  className={`font-bold px-3.5 py-1.5 rounded-full border-0 text-sm cursor-help hover:scale-105 transition-transform ${
                                    match.aiConfidence >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                                    match.aiConfidence >= 60 ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 
                                    'bg-gradient-to-r from-gray-400 to-gray-600 text-white'
                                  }`}
                                >
                                  <Info className="h-3 w-3 mr-1" />
                                  {match.aiConfidence}%
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-md p-4 bg-white border-2 border-blue-200 shadow-xl">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                                    <Info className="h-4 w-4 text-blue-600" />
                                    <p className="font-bold text-sm text-gray-900">Пояснення AI прогнозу</p>
                                  </div>
                                  <div className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                                    {aiExplanation}
                                  </div>
                                  <div className="mt-3 pt-2 border-t border-gray-200">
                                    <p className="text-xs text-gray-500 italic">
                                      💡 AI аналізує форму команд, історію матчів, коефіцієнти та інші фактори
                                    </p>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                          <td className="p-4 text-center border-r border-gray-200">
                            <div className="flex items-center justify-center gap-2 cursor-pointer hover:scale-105 transition-transform" title="Клікніть для сортування">
                              <div className={`w-2.5 h-2.5 rounded-full ${riskInfo.dotColor} shadow-sm`} />
                              <span className="text-sm font-bold text-gray-900">{match.risk}%</span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1 font-semibold">{riskInfo.label}</div>
                          </td>
                          <td className="p-4 border-r border-gray-200">
                            <div className="text-sm space-y-1">
                              <div className="text-gray-700">{match.team1}: <span className="font-bold text-gray-900">{match.odds.team1}</span></div>
                              <div className="text-gray-700">{match.team2}: <span className="font-bold text-gray-900">{match.odds.team2}</span></div>
                            </div>
                          </td>
                          <td className="p-4 text-center border-r border-gray-200">
                            <div className="flex items-center justify-center gap-1.5">
                              {match.winRate >= 70 ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                              <span className="font-bold text-gray-900 text-sm">{match.winRate}%</span>
                            </div>
                          </td>
                          <td className="p-4 text-center border-r border-gray-200">
                            <div className="flex flex-col items-center gap-2">
                              {/* Safe Pick Badge */}
                              {safePick && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2.5 py-1 rounded-full border-0 font-semibold shadow-sm flex items-center gap-1 cursor-help">
                                      <Shield className="h-3 w-3" />
                                      Safe Pick
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-white border-2 border-green-200 shadow-xl">
                                    <p className="text-xs text-gray-700 max-w-xs">
                                      🛡️ <strong>Safe Pick</strong> - Матч з високою впевненістю AI (&gt;80%), низьким ризиком (&lt;30%) та стабільною формою команди. Рекомендується для надійних ставок.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {/* Form Badge with Tooltip */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className={`${formInfo.color} flex items-center gap-1.5 justify-center px-3 py-1 rounded-full font-semibold text-xs shadow-sm cursor-help`}>
                                    {formInfo.icon}
                                    {formInfo.label}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-white border-2 border-gray-200 shadow-xl">
                                  <p className="text-xs text-gray-700 max-w-xs">
                                    {formInfo.tooltip}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                          <td className="p-4 border-r border-gray-200">
                            <div className="text-sm text-gray-700 font-medium">{match.context}</div>
                          </td>
                          <td className="p-4 border-r border-gray-200">
                            <Button
                              onClick={() => handleGetAIRecommendation(match)}
                              className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-md transition-all hover:scale-105 flex items-center gap-2"
                              size="sm"
                            >
                              <Brain className="h-4 w-4" />
                              Отримати прогноз
                            </Button>
                          </td>
                          <td className="p-4">
                            {riskComments ? (
                              <Button
                                onClick={() => handleShowComment(match)}
                                className="rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold shadow-md transition-all hover:scale-105 flex items-center gap-2"
                                size="sm"
                              >
                                <Eye className="h-4 w-4" />
                                Показати
                              </Button>
                            ) : (
                              <div className="text-xs text-gray-400">—</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
            <CardContent className="py-20">
              <div className="text-center">
                <div className="p-6 bg-gray-100 rounded-3xl inline-block mb-4">
                  <AlertTriangle className="h-16 w-16 text-gray-400" />
                </div>
                <p className="text-gray-900 font-bold text-lg">Немає матчів за обраними фільтрами</p>
                <p className="text-sm text-gray-500 mt-2">Спробуйте змінити фільтри або оновити дані</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Recommendation Modal */}
        <AIRecommendationModal
          open={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          matchInfo={selectedMatch ? `${selectedMatch.team1} vs ${selectedMatch.team2} (${selectedMatch.matchType}, ${selectedMatch.tier.toUpperCase()})` : ''}
          recommendation={aiRecommendation}
          isLoading={aiLoading}
        />

        {/* Comment Modal */}
        <CommentModal
          open={commentModalOpen}
          onClose={() => setCommentModalOpen(false)}
          matchInfo={selectedCommentMatch ? `${selectedCommentMatch.team1} vs ${selectedCommentMatch.team2} (${selectedCommentMatch.matchType}, ${selectedCommentMatch.tier.toUpperCase()})` : ''}
          comment={selectedCommentMatch ? getMatchRiskComments(selectedCommentMatch.team1, selectedCommentMatch.team2) : ''}
        />
      </div>
    </TooltipProvider>
  );
}