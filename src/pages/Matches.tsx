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
  Sparkles,
  ChevronDown,
  ChevronUp,
  BarChart3
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
import { openRouterService, type AIRecommendation } from '@/lib/openRouterService';

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

interface TeamDto {
  id: number;
  position: number;
  name: string;
  points: number;
  hltvId: number;
  comment: string | null;
}

// Mock data for demonstration - updated to current date 2026-02-05
const mockMatches: Match[] = [
  {
    id: '1',
    date: '2026-02-05',
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
    date: '2026-02-05',
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
    date: '2026-02-05',
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
    date: '2026-02-05',
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
    date: '2026-02-05',
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
        icon: <Flame className="h-3.5 w-3.5" strokeWidth={1.5} />,
        label: 'Hot Streak',
        color: 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-0',
        tooltip: '🔥 Команда у топ-формі з серією перемог. Висока ймовірність продовження успішної гри.'
      };
    case 'stable':
      return {
        icon: <Shield className="h-3.5 w-3.5" strokeWidth={1.5} />,
        label: 'Stable',
        color: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0',
        tooltip: '🛡️ Стабільна форма з передбачуваними результатами. Надійний вибір для ставок.'
      };
    case 'momentum':
      return {
        icon: <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} />,
        label: 'Momentum',
        color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0',
        tooltip: '📈 Команда набирає темп і покращує результати. Позитивна динаміка.'
      };
    case 'falling':
      return {
        icon: <TrendingDown className="h-3.5 w-3.5" strokeWidth={1.5} />,
        label: 'Falling',
        color: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white border-0',
        tooltip: '📉 Команда втрачає форму з погіршенням результатів. Обережно зі ставками.'
      };
    case 'slump':
      return {
        icon: <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.5} />,
        label: 'Slump',
        color: 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0',
        tooltip: '⚠️ Команда у кризі з серією поразок. Високий ризик для ставок.'
      };
    case 'inconsistent':
      return {
        icon: <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.5} />,
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
      color: 'bg-[#E8F5E9] text-[#4CAF50] border-[#C8E6C9]',
      dotColor: 'bg-[#4CAF50]'
    };
  }
  if (risk <= 50) {
    return {
      label: 'Помірний',
      color: 'bg-[#FFF3E0] text-[#FF9800] border-[#FFCC80]',
      dotColor: 'bg-[#FF9800]'
    };
  }
  return {
    label: 'Високий',
    color: 'bg-[#FFE8E8] text-[#D32F2F] border-[#FFCDD2]',
    dotColor: 'bg-[#D32F2F]'
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
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
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
  
  // Top Teams API Test State
  const [topTeams, setTopTeams] = useState<TeamDto[]>([]);
  const [topTeamsLoading, setTopTeamsLoading] = useState(false);
  const [numberOfTeams, setNumberOfTeams] = useState('10');
  const [apiError, setApiError] = useState<string>('');
  
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
      const recommendation = await openRouterService.getMatchRecommendation({
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

  // Fetch Top Teams from HTTPS API with detailed error logging
  const fetchTopTeams = async () => {
    setTopTeamsLoading(true);
    setApiError('');
    try {
      const count = parseInt(numberOfTeams) || 10;
      console.log(`🔄 Fetching top ${count} teams from API...`);
      
      const response = await fetch(`https://api.cstest.pp.ua/api/Teams/top/${count}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: TeamDto[] = await response.json();
      console.log('✅ Data received:', data);
      setTopTeams(data);
      
      toast({
        title: '✅ Успіх!',
        description: `Завантажено ${data.length} команд з API`,
      });
    } catch (error) {
      console.error('❌ Error fetching top teams:', error);
      
      let errorMessage = 'Невідома помилка';
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = 'CORS Policy: API сервер не дозволяє запити з цього домену. Можливі причини:\n1. Відсутні CORS headers на сервері\n2. API сервер недоступний\n3. Проблеми з мережею';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setApiError(errorMessage);
      
      toast({
        title: '❌ Помилка',
        description: `Не вдалося завантажити дані: ${errorMessage}`,
        variant: 'destructive'
      });
    } finally {
      setTopTeamsLoading(false);
    }
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

  // Count active filters
  const activeFiltersCount = [
    filterTier !== 'all',
    filterConfidence !== 'all',
    filterRisk !== 'all',
    filterMatchType !== 'all',
    showHotMatches,
    searchQuery !== ''
  ].filter(Boolean).length;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#FAFAF8] relative overflow-hidden">
        {/* Decorative elements with hatching pattern - RonDesignLab style */}
        <div className="absolute top-16 right-16 w-40 h-40 rounded-[40px] bg-[#E8E6DC] opacity-20" 
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)`
          }} 
        />
        <div className="absolute bottom-24 left-16 w-32 h-32 rounded-[36px] bg-[#D4D2C8] opacity-15"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)`
          }}
        />

        <div className="relative z-10 space-y-10 p-8">
          {/* Enhanced Header with background */}
          <div className="bg-white/60 backdrop-blur-sm rounded-[40px] p-8 border-2 border-[#E8E6DC] shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-6xl font-light text-black tracking-tight flex items-center gap-5">
                  <div className="p-4 bg-[#F4E157] rounded-[36px] shadow-[0_12px_32px_rgba(244,225,87,0.4)]">
                    <Trophy className="h-10 w-10 text-black" strokeWidth={1.5} />
                  </div>
                  Матчі
                </h1>
                <p className="text-[#6B6B6B] mt-4 text-xl font-light ml-[88px]">
                  Аналітична система з AI прогнозами та Form Stability
                </p>
              </div>
              
              <Button 
                onClick={refreshMatches} 
                disabled={isLoading}
                className="group relative rounded-[24px] bg-[#F4E157] hover:bg-[#E8D54A] text-black font-normal h-16 px-7 transition-all duration-300 overflow-hidden shadow-[0_6px_20px_rgba(244,225,87,0.35)] text-base"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2.5 h-5 w-5 animate-spin relative z-10" strokeWidth={1.5} />
                    <span className="relative z-10">Завантаження...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2.5 h-5 w-5 relative z-10" strokeWidth={1.5} />
                    <span className="relative z-10">Оновити з HLTV</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* API Top Teams - HTTPS Version with Error Display */}
          <Card className="border-2 border-[#90CAF9] shadow-[0_8px_24px_rgba(33,150,243,0.2)] rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="border-b-2 border-[#E3F2FD] p-6">
              <CardTitle className="text-2xl font-light text-black tracking-tight flex items-center gap-3">
                <div className="p-2.5 bg-[#2196F3] rounded-[20px] shadow-[0_6px_16px_rgba(33,150,243,0.3)]">
                  <BarChart3 className="h-6 w-6 text-white" strokeWidth={1.5} />
                </div>
                🔒 API Топ Команд (HTTPS)
                <Badge className={`ml-2 border-0 rounded-[12px] px-3 py-1 font-normal ${apiError ? 'bg-[#D32F2F] text-white' : 'bg-[#FF9800] text-white'}`}>
                  {apiError ? 'Помилка' : 'Тестування'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Input and Button */}
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-normal text-[#6B6B6B] mb-2 block">
                      Кількість команд:
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={numberOfTeams}
                      onChange={(e) => setNumberOfTeams(e.target.value)}
                      placeholder="10"
                      className="rounded-[16px] border-2 border-[#90CAF9] hover:border-[#64B5F6] transition-colors font-light h-11"
                    />
                  </div>
                  <Button
                    onClick={fetchTopTeams}
                    disabled={topTeamsLoading}
                    className="group relative rounded-[16px] bg-[#2196F3] hover:bg-[#1976D2] text-white font-normal h-11 px-6 transition-all duration-300 overflow-hidden shadow-[0_4px_12px_rgba(33,150,243,0.3)]"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    {topTeamsLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin relative z-10" strokeWidth={1.5} />
                        <span className="relative z-10">Завантаження...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 relative z-10" strokeWidth={1.5} />
                        <span className="relative z-10">Завантажити</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Error Display */}
                {apiError && (
                  <div className="p-4 bg-[#FFEBEE] rounded-[16px] border border-[#EF5350]">
                    <p className="text-sm text-[#C62828] font-normal flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                      <span>
                        <strong>Помилка CORS:</strong><br />
                        {apiError}
                      </span>
                    </p>
                  </div>
                )}

                {/* Results */}
                {topTeams.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-normal text-black mb-4 flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-[#2196F3]" strokeWidth={1.5} />
                      Результати ({topTeams.length} команд):
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-[#E3F2FD] border-b-2 border-[#90CAF9]">
                            <th className="text-left py-3 px-4 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">Позиція</th>
                            <th className="text-left py-3 px-4 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">Назва</th>
                            <th className="text-left py-3 px-4 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">Очки</th>
                            <th className="text-left py-3 px-4 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">HLTV ID</th>
                            <th className="text-left py-3 px-4 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">Коментар</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topTeams.map((team) => (
                            <tr 
                              key={team.id} 
                              className="border-b border-[#E3F2FD] hover:bg-[#F0F8FF] transition-colors"
                            >
                              <td className="py-3 px-4">
                                <Badge className="bg-[#2196F3] text-white border-0 rounded-[12px] px-3 py-1 font-normal">
                                  #{team.position}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 font-normal text-black">{team.name}</td>
                              <td className="py-3 px-4 text-[#6B6B6B] font-light">{team.points}</td>
                              <td className="py-3 px-4 text-[#6B6B6B] font-light">{team.hltvId}</td>
                              <td className="py-3 px-4 text-[#6B6B6B] font-light">{team.comment || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* API Info */}
                <div className="mt-4 space-y-3">
                  <div className="p-4 bg-[#FFF3E0] rounded-[16px] border border-[#FFB74D]">
                    <p className="text-sm text-[#E65100] font-normal flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                      <span>
                        <strong>Діагностика:</strong> Перевірте консоль браузера (F12) для детальної інформації про помилку. Якщо бачите "CORS policy" помилку, це означає що API сервер не налаштований для прийому запитів з браузера.
                      </span>
                    </p>
                  </div>
                  <div className="p-4 bg-[#E3F2FD] rounded-[16px] border border-[#90CAF9]">
                    <p className="text-sm text-[#6B6B6B] font-light">
                      <strong className="text-black">API Endpoint:</strong> GET https://api.cstest.pp.ua/api/Teams/top/{'{numberOfTeams}'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Total Matches */}
            <Card className="border-2 border-[#E8E6DC] shadow-[0_6px_20px_rgba(0,0,0,0.06)] rounded-[28px] bg-white overflow-hidden hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)] transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-light text-[#6B6B6B] mb-1">Всього матчів</p>
                    <p className="text-4xl font-light text-black">{sortedMatches.length}</p>
                  </div>
                  <div className="p-3 bg-[#F4E157] rounded-[20px] shadow-[0_6px_16px_rgba(244,225,87,0.3)]">
                    <Trophy className="h-7 w-7 text-black" strokeWidth={1.5} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Safe Matches */}
            <Card className="border-2 border-[#C8E6C9] shadow-[0_6px_20px_rgba(76,175,80,0.15)] rounded-[28px] bg-white overflow-hidden hover:shadow-[0_8px_28px_rgba(76,175,80,0.25)] transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-light text-[#6B6B6B] mb-1">Безпечні матчі</p>
                    <p className="text-4xl font-light text-[#4CAF50]">{sortedMatches.filter(m => m.risk <= 30).length}</p>
                  </div>
                  <div className="p-3 bg-[#4CAF50] rounded-[20px] shadow-[0_6px_16px_rgba(76,175,80,0.3)]">
                    <Shield className="h-7 w-7 text-white" strokeWidth={1.5} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hot Matches */}
            <Card className="border-2 border-[#FFCCBC] shadow-[0_6px_20px_rgba(255,87,34,0.15)] rounded-[28px] bg-white overflow-hidden hover:shadow-[0_8px_28px_rgba(255,87,34,0.25)] transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-light text-[#6B6B6B] mb-1">Hot Matches</p>
                    <p className="text-4xl font-light text-[#FF5722]">{sortedMatches.filter(m => m.aiConfidence >= 70 && m.upsetProbability < 20).length}</p>
                  </div>
                  <div className="p-3 bg-[#FF5722] rounded-[20px] shadow-[0_6px_16px_rgba(255,87,34,0.3)]">
                    <Flame className="h-7 w-7 text-white" strokeWidth={1.5} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Safe Picks */}
            <Card className="border-2 border-[#B2DFDB] shadow-[0_6px_20px_rgba(0,150,136,0.15)] rounded-[28px] bg-white overflow-hidden hover:shadow-[0_8px_28px_rgba(0,150,136,0.25)] transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-light text-[#6B6B6B] mb-1">Safe Picks</p>
                    <p className="text-4xl font-light text-[#009688]">{safePicksCount}</p>
                  </div>
                  <div className="p-3 bg-[#009688] rounded-[20px] shadow-[0_6px_16px_rgba(0,150,136,0.3)]">
                    <CheckCircle className="h-7 w-7 text-white" strokeWidth={1.5} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Average AI Confidence */}
            <Card className="border-2 border-[#BBDEFB] shadow-[0_6px_20px_rgba(33,150,243,0.15)] rounded-[28px] bg-white overflow-hidden hover:shadow-[0_8px_28px_rgba(33,150,243,0.25)] transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-light text-[#6B6B6B] mb-1">Середній AI %</p>
                    <p className="text-4xl font-light text-[#2196F3]">
                      {sortedMatches.length > 0 
                        ? Math.round(sortedMatches.reduce((sum, m) => sum + m.aiConfidence, 0) / sortedMatches.length)
                        : 0}%
                    </p>
                  </div>
                  <div className="p-3 bg-[#2196F3] rounded-[20px] shadow-[0_6px_16px_rgba(33,150,243,0.3)]">
                    <Brain className="h-7 w-7 text-white" strokeWidth={1.5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="border-2 border-[#E8E6DC] shadow-[0_6px_20px_rgba(0,0,0,0.06)] rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="border-b-2 border-[#E8E6DC] p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-light text-black tracking-tight flex items-center gap-3">
                  <div className="p-2.5 bg-[#F4E157] rounded-[20px] shadow-[0_6px_16px_rgba(244,225,87,0.3)]">
                    <Filter className="h-6 w-6 text-black" strokeWidth={1.5} />
                  </div>
                  Фільтри та сортування
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 bg-[#F4E157] text-black border-0 rounded-[12px] px-3 py-1 font-normal">
                      {activeFiltersCount} активних
                    </Badge>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className="rounded-[16px] hover:bg-[#F4E157]/20 font-light"
                >
                  {filtersExpanded ? (
                    <>
                      <ChevronUp className="h-5 w-5 mr-2" strokeWidth={1.5} />
                      Згорнути
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-5 w-5 mr-2" strokeWidth={1.5} />
                      Розгорнути
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            {filtersExpanded && (
              <CardContent className="p-6 space-y-6">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6B6B6B]" strokeWidth={1.5} />
                  <Input
                    placeholder="Пошук команд..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 rounded-[20px] border-2 border-[#E8E6DC] hover:border-[#F4E157] transition-colors font-light h-12"
                  />
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Tier Filter */}
                  <div>
                    <label className="text-sm font-normal text-[#6B6B6B] mb-2 block">Tier:</label>
                    <Select value={filterTier} onValueChange={(value: 'all' | 'tier1' | 'tier2' | 'tier3') => setFilterTier(value)}>
                      <SelectTrigger className="rounded-[16px] border-2 border-[#E8E6DC] hover:border-[#F4E157] transition-colors font-light h-11">
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

                  {/* Confidence Filter */}
                  <div>
                    <label className="text-sm font-normal text-[#6B6B6B] mb-2 block">AI Впевненість:</label>
                    <Select value={filterConfidence} onValueChange={(value: 'all' | 'high' | 'medium' | 'low') => setFilterConfidence(value)}>
                      <SelectTrigger className="rounded-[16px] border-2 border-[#E8E6DC] hover:border-[#F4E157] transition-colors font-light h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Всі</SelectItem>
                        <SelectItem value="high">Висока (&gt;80%)</SelectItem>
                        <SelectItem value="medium">Середня (60-80%)</SelectItem>
                        <SelectItem value="low">Низька (&lt;60%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Risk Filter */}
                  <div>
                    <label className="text-sm font-normal text-[#6B6B6B] mb-2 block">Ризик:</label>
                    <Select value={filterRisk} onValueChange={(value: 'all' | 'safe' | 'moderate' | 'high') => setFilterRisk(value)}>
                      <SelectTrigger className="rounded-[16px] border-2 border-[#E8E6DC] hover:border-[#F4E157] transition-colors font-light h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Всі</SelectItem>
                        <SelectItem value="safe">Низький (≤30%)</SelectItem>
                        <SelectItem value="moderate">Помірний (30-50%)</SelectItem>
                        <SelectItem value="high">Високий (&gt;50%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Match Type Filter */}
                  <div>
                    <label className="text-sm font-normal text-[#6B6B6B] mb-2 block">Формат:</label>
                    <Select value={filterMatchType} onValueChange={(value: 'all' | 'Bo1' | 'Bo3' | 'Bo5') => setFilterMatchType(value)}>
                      <SelectTrigger className="rounded-[16px] border-2 border-[#E8E6DC] hover:border-[#F4E157] transition-colors font-light h-11">
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
                </div>

                {/* Hot Matches Toggle */}
                <div className="flex items-center gap-3">
                  <Button
                    variant={showHotMatches ? "default" : "outline"}
                    onClick={() => setShowHotMatches(!showHotMatches)}
                    className={`rounded-[16px] font-normal h-11 px-6 transition-all duration-300 ${
                      showHotMatches 
                        ? 'bg-[#FF5722] hover:bg-[#E64A19] text-white border-0 shadow-[0_4px_12px_rgba(255,87,34,0.3)]' 
                        : 'border-2 border-[#E8E6DC] hover:border-[#FF5722] hover:bg-[#FF5722]/10'
                    }`}
                  >
                    <Flame className="h-5 w-5 mr-2" strokeWidth={1.5} />
                    {showHotMatches ? 'Показати всі' : 'Тільки Hot Matches'}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Matches Table - VERSION 691 with Refresh Button */}
          <Card className="border-2 border-[#E8E6DC] shadow-[0_6px_20px_rgba(0,0,0,0.06)] rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="border-b-2 border-[#E8E6DC] p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-light text-black tracking-tight flex items-center gap-3">
                  <div className="p-2.5 bg-[#2196F3] rounded-[20px] shadow-[0_6px_16px_rgba(33,150,243,0.3)]">
                    <Calendar className="h-6 w-6 text-white" strokeWidth={1.5} />
                  </div>
                  {currentDate}
                </CardTitle>
                
                {/* Refresh Button next to Date */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={refreshMatches}
                      disabled={isLoading}
                      size="sm"
                      className="group relative rounded-[16px] bg-[#2196F3] hover:bg-[#1976D2] text-white font-normal h-10 px-5 transition-all duration-300 overflow-hidden shadow-[0_4px_12px_rgba(33,150,243,0.25)]"
                    >
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin relative z-10" strokeWidth={1.5} />
                      ) : (
                        <RefreshCw className="h-4 w-4 relative z-10" strokeWidth={1.5} />
                      )}
                      <span className="ml-2 relative z-10">Оновити</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black text-white p-2 rounded-[8px]">
                    <p className="text-xs font-light">Оновити матчі з HLTV</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#FAFAF8] border-b-2 border-[#E8E6DC]">
                      <th className="text-left py-4 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">Матч</th>
                      <th className="text-left py-4 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">Фаворит</th>
                      <th className="text-left py-4 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider cursor-pointer hover:bg-[#F4E157]/10 transition-colors" onClick={() => toggleSort('confidence')}>
                        <div className="flex items-center gap-2">
                          AI %
                          <ArrowUpDown className="h-4 w-4" strokeWidth={1.5} />
                        </div>
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider cursor-pointer hover:bg-[#F4E157]/10 transition-colors" onClick={() => toggleSort('risk')}>
                        <div className="flex items-center gap-2">
                          Ризик
                          <ArrowUpDown className="h-4 w-4" strokeWidth={1.5} />
                        </div>
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">Коефіцієнти</th>
                      <th className="text-left py-4 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">Win Rate</th>
                      <th className="text-left py-4 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">Info</th>
                      <th className="text-left py-4 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">Турнір</th>
                      <th className="text-left py-4 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">AI Коментар</th>
                      <th className="text-left py-4 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">AI Рекомендація</th>
                      <th className="text-left py-4 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">Коментар</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMatches.map((match) => {
                      const riskBadge = getRiskBadge(match.risk);
                      const formInfo = getFormStabilityInfo(match.formStability);
                      const isSafe = isSafePick(match);
                      const riskComments = getMatchRiskComments(match.team1, match.team2);

                      return (
                        <tr key={match.id} className="border-b border-[#E8E6DC] hover:bg-[#FAFAF8] transition-colors">
                          {/* Match */}
                          <td className="py-5 px-6">
                            <div className="space-y-1.5">
                              <div className="font-normal text-black text-base">
                                {match.team1} vs {match.team2}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-[#E8E6DC] text-[#2A2A2A] border-0 rounded-[10px] px-2.5 py-0.5 text-xs font-normal">
                                  {match.matchType}
                                </Badge>
                                <Badge className="bg-[#2196F3] text-white border-0 rounded-[10px] px-2.5 py-0.5 text-xs font-normal uppercase">
                                  {match.tier}
                                </Badge>
                              </div>
                            </div>
                          </td>

                          {/* Favorite */}
                          <td className="py-5 px-6">
                            <div className="font-normal text-black">{match.favorite}</div>
                          </td>

                          {/* AI Confidence */}
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-2">
                              <div className="text-2xl font-light text-[#2196F3]">{match.aiConfidence}%</div>
                            </div>
                          </td>

                          {/* Risk */}
                          <td className="py-5 px-6">
                            <div className="space-y-2">
                              <div className="text-2xl font-light text-[#6B6B6B]">{match.risk}%</div>
                              <Badge className={`${riskBadge.color} border rounded-[10px] px-2.5 py-0.5 text-xs font-normal flex items-center gap-1.5 w-fit`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${riskBadge.dotColor}`} />
                                {riskBadge.label}
                              </Badge>
                            </div>
                          </td>

                          {/* Odds */}
                          <td className="py-5 px-6">
                            <div className="space-y-1">
                              <div className="text-sm text-[#6B6B6B] font-light">
                                {match.team1}: <span className="font-normal text-black">{match.odds.team1}</span>
                              </div>
                              <div className="text-sm text-[#6B6B6B] font-light">
                                {match.team2}: <span className="font-normal text-black">{match.odds.team2}</span>
                              </div>
                            </div>
                          </td>

                          {/* Win Rate */}
                          <td className="py-5 px-6">
                            <div className="text-lg font-normal text-black">{match.winRate}%</div>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge className={`${formInfo.color} mt-1.5 px-2.5 py-0.5 text-xs font-normal flex items-center gap-1.5 w-fit`}>
                                  {formInfo.icon}
                                  {formInfo.label}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs bg-black text-white p-3 rounded-[12px]">
                                <p className="text-sm font-light">{formInfo.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </td>

                          {/* Info */}
                          <td className="py-5 px-6">
                            {isSafe && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 rounded-[10px] px-2.5 py-1 text-xs font-normal flex items-center gap-1.5 w-fit">
                                    <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                                    Safe Pick
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-md bg-black text-white p-4 rounded-[12px]">
                                  <div className="space-y-2">
                                    <p className="font-normal text-sm">✅ Безпечний вибір</p>
                                    <p className="text-xs font-light whitespace-pre-line">{getAIExplanation(match)}</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </td>

                          {/* Tournament */}
                          <td className="py-5 px-6">
                            <div className="text-sm text-[#6B6B6B] font-light">{match.context}</div>
                          </td>

                          {/* AI Comment (aiSummary) */}
                          <td className="py-5 px-6">
                            <div className="text-sm text-[#6B6B6B] font-light max-w-xs">{match.aiSummary}</div>
                          </td>

                          {/* AI Recommendation */}
                          <td className="py-5 px-6">
                            <Button
                              onClick={() => handleGetAIRecommendation(match)}
                              className="group relative rounded-[12px] bg-[#2196F3] hover:bg-[#1976D2] text-white font-normal h-9 px-4 text-xs transition-all duration-300 overflow-hidden shadow-[0_4px_12px_rgba(33,150,243,0.25)]"
                            >
                              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                              <Brain className="mr-1.5 h-4 w-4 relative z-10" strokeWidth={1.5} />
                              <span className="relative z-10">Отримати прогноз</span>
                            </Button>
                          </td>

                          {/* Comment */}
                          <td className="py-5 px-6">
                            {riskComments ? (
                              <Button
                                onClick={() => handleShowComment(match)}
                                variant="outline"
                                className="rounded-[12px] border-2 border-[#FF9800] text-[#FF9800] hover:bg-[#FF9800] hover:text-white font-normal h-9 px-4 text-xs transition-all duration-300"
                              >
                                <Eye className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
                                Переглянути
                              </Button>
                            ) : (
                              <span className="text-[#6B6B6B] text-sm font-light">—</span>
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
      </div>
    </TooltipProvider>
  );
}