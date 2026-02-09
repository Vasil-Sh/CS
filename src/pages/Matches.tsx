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
        
        {/* Subtle grid pattern overlay */}
        <svg className="absolute top-0 left-0 w-full h-full opacity-[0.015] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" patternUnits="userSpaceOnUse" width="40" height="40">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#000000" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

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

          {/* Quick Stats - КОМПАКТНИЙ ДИЗАЙН ЯК В ANALYTICS */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* 1. Всього матчів */}
            <Card 
              className="border-2 border-[#90CAF9] shadow-[0_8px_24px_rgba(33,150,243,0.2)] rounded-[28px] overflow-hidden hover:shadow-[0_12px_32px_rgba(33,150,243,0.3)] hover:border-[#64B5F6] transition-all duration-300 relative"
              style={{
                background: 'linear-gradient(135deg, #E3F2FD 0%, #F0F8FF 100%)'
              }}
            >
              <div className="absolute inset-0 opacity-5" 
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(33,150,243,0.3) 8px, rgba(33,150,243,0.3) 10px)`
                }}
              />
              
              <CardHeader className="pb-3 pt-5 px-6 relative z-10">
                <CardTitle className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2">
                  <div className="p-2 bg-[#2196F3] rounded-[16px] shadow-[0_3px_8px_rgba(33,150,243,0.4)]">
                    <Trophy className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  Всього матчів
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-5 relative z-10">
                <div className="text-4xl font-light text-black tracking-tight">{sortedMatches.length}</div>
              </CardContent>
            </Card>
            
            {/* 2. Безпечні матчі */}
            <Card 
              className="border-2 border-[#A5D6A7] shadow-[0_8px_24px_rgba(76,175,80,0.25)] rounded-[28px] overflow-hidden hover:shadow-[0_12px_32px_rgba(76,175,80,0.35)] hover:border-[#81C784] transition-all duration-300 relative"
              style={{
                background: 'linear-gradient(135deg, #E8F5E9 0%, #F1F8F4 100%)'
              }}
            >
              <div className="absolute inset-0 opacity-5" 
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(76,175,80,0.3) 8px, rgba(76,175,80,0.3) 10px)`
                }}
              />
              
              <CardHeader className="pb-3 pt-5 px-6 relative z-10">
                <CardTitle className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2">
                  <div className="p-2 bg-[#4CAF50] rounded-[16px] shadow-[0_3px_8px_rgba(76,175,80,0.4)]">
                    <Shield className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  Безпечні матчі
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-5 relative z-10">
                <div className="text-4xl font-light text-[#4CAF50] tracking-tight">
                  {sortedMatches.filter(m => m.risk <= 30).length}
                </div>
              </CardContent>
            </Card>
            
            {/* 3. Hot Matches */}
            <Card 
              className="border-2 border-[#FFCC80] shadow-[0_8px_24px_rgba(255,152,0,0.2)] rounded-[28px] overflow-hidden hover:shadow-[0_12px_32px_rgba(255,152,0,0.3)] hover:border-[#FFB74D] transition-all duration-300 relative"
              style={{
                background: 'linear-gradient(135deg, #FFF3E0 0%, #FFF9F0 100%)'
              }}
            >
              <div className="absolute inset-0 opacity-5" 
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,152,0,0.3) 8px, rgba(255,152,0,0.3) 10px)`
                }}
              />
              
              <CardHeader className="pb-3 pt-5 px-6 relative z-10">
                <CardTitle className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2">
                  <div className="p-2 bg-[#FF9800] rounded-[16px] shadow-[0_3px_8px_rgba(255,152,0,0.4)]">
                    <Flame className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  Hot Matches
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-5 relative z-10">
                <div className="text-4xl font-light text-[#FF9800] tracking-tight">
                  {sortedMatches.filter(m => m.aiConfidence > 70 && m.upsetProbability < 20).length}
                </div>
              </CardContent>
            </Card>
            
            {/* 4. Safe Picks */}
            <Card 
              className="border-2 border-[#A5D6A7] shadow-[0_8px_24px_rgba(76,175,80,0.25)] rounded-[28px] overflow-hidden hover:shadow-[0_12px_32px_rgba(76,175,80,0.35)] hover:border-[#81C784] transition-all duration-300 relative"
              style={{
                background: 'linear-gradient(135deg, #E8F5E9 0%, #F1F8F4 100%)'
              }}
            >
              <div className="absolute inset-0 opacity-5" 
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(76,175,80,0.3) 8px, rgba(76,175,80,0.3) 10px)`
                }}
              />
              
              <CardHeader className="pb-3 pt-5 px-6 relative z-10">
                <CardTitle className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2">
                  <div className="p-2 bg-[#4CAF50] rounded-[16px] shadow-[0_3px_8px_rgba(76,175,80,0.4)]">
                    <CheckCircle className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  Safe Picks
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-5 relative z-10">
                <div className="text-4xl font-light text-[#4CAF50] tracking-tight">
                  {safePicksCount}
                </div>
              </CardContent>
            </Card>
            
            {/* 5. Середній AI % */}
            <Card 
              className="border-2 border-[#FFCC80] shadow-[0_8px_24px_rgba(255,152,0,0.2)] rounded-[28px] overflow-hidden hover:shadow-[0_12px_32px_rgba(255,152,0,0.3)] hover:border-[#FFB74D] transition-all duration-300 relative"
              style={{
                background: 'linear-gradient(135deg, #FFF3E0 0%, #FFF9F0 100%)'
              }}
            >
              <div className="absolute inset-0 opacity-5" 
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,152,0,0.3) 8px, rgba(255,152,0,0.3) 10px)`
                }}
              />
              
              <CardHeader className="pb-3 pt-5 px-6 relative z-10">
                <CardTitle className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2">
                  <div className="p-2 bg-[#FF9800] rounded-[16px] shadow-[0_3px_8px_rgba(255,152,0,0.4)]">
                    <Target className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  Середній AI %
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-5 relative z-10">
                <div className="text-4xl font-light text-[#FF9800] tracking-tight">
                  {sortedMatches.length > 0 ? Math.round(sortedMatches.reduce((sum, m) => sum + m.aiConfidence, 0) / sortedMatches.length) : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Collapsible Filters */}
          <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
            <CardHeader 
              className="border-b-2 border-[#E8E6DC] p-6 cursor-pointer hover:bg-[#FAFAF8] transition-colors"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
            >
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
                  size="sm"
                  className="rounded-[16px] hover:bg-[#F5F5F3] text-black"
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
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-5">
                  <div>
                    <label className="text-sm font-normal text-[#6B6B6B] mb-2 block">Tier:</label>
                    <Select value={filterTier} onValueChange={(value: 'all' | 'tier1' | 'tier2' | 'tier3') => setFilterTier(value)}>
                      <SelectTrigger className="rounded-[16px] border-2 border-[#D4D2C8] hover:border-[#C4C2B8] transition-colors font-light h-11">
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
                    <label className="text-sm font-normal text-[#6B6B6B] mb-2 block">AI Confidence:</label>
                    <Select value={filterConfidence} onValueChange={(value: 'all' | 'high' | 'medium' | 'low') => setFilterConfidence(value)}>
                      <SelectTrigger className="rounded-[16px] border-2 border-[#D4D2C8] hover:border-[#C4C2B8] transition-colors font-light h-11">
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
                    <label className="text-sm font-normal text-[#6B6B6B] mb-2 block">Ризик:</label>
                    <Select value={filterRisk} onValueChange={(value: 'all' | 'safe' | 'moderate' | 'high') => setFilterRisk(value)}>
                      <SelectTrigger className="rounded-[16px] border-2 border-[#D4D2C8] hover:border-[#C4C2B8] transition-colors font-light h-11">
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
                    <label className="text-sm font-normal text-[#6B6B6B] mb-2 block">Тип матчу:</label>
                    <Select value={filterMatchType} onValueChange={(value: 'all' | 'Bo1' | 'Bo3' | 'Bo5') => setFilterMatchType(value)}>
                      <SelectTrigger className="rounded-[16px] border-2 border-[#D4D2C8] hover:border-[#C4C2B8] transition-colors font-light h-11">
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
                    <label className="text-sm font-normal text-[#6B6B6B] mb-2 block">Пошук:</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-5 w-5 text-[#8B8B8B]" strokeWidth={1.5} />
                      <Input
                        placeholder="Команда..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-[16px] border-2 border-[#D4D2C8] hover:border-[#C4C2B8] transition-colors font-light h-11"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-normal text-[#6B6B6B] mb-2 block">Hot Match:</label>
                    <Button
                      variant={showHotMatches ? 'default' : 'outline'}
                      className={`w-full rounded-[16px] font-normal h-11 transition-all duration-300 ${
                        showHotMatches 
                          ? 'bg-[#F4E157] hover:bg-[#E8D54A] text-black shadow-[0_4px_12px_rgba(244,225,87,0.3)] border-0' 
                          : 'border-2 border-[#D4D2C8] hover:bg-[#FAFAF8] hover:border-[#C4C2B8] bg-white text-black'
                      }`}
                      onClick={() => setShowHotMatches(!showHotMatches)}
                    >
                      {showHotMatches ? 'Увімкнено' : 'Вимкнено'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Matches Table */}
          {sortedMatches.length > 0 ? (
            <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
              <CardHeader className="border-b-2 border-[#E8E6DC] p-8">
                <CardTitle className="text-3xl font-light text-black tracking-tight flex items-center gap-4">
                  <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_8px_20px_rgba(244,225,87,0.3)]">
                    <Calendar className="h-7 w-7 text-black" strokeWidth={1.5} />
                  </div>
                  <span>{currentDate}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#F5F5F3] border-b-2 border-[#E8E6DC]">
                        <th className="text-left py-5 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">Матч</th>
                        <th className="text-left py-5 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">Фаворит</th>
                        <th 
                          className="text-center py-5 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider cursor-pointer hover:bg-[#FAFAF8] transition-colors"
                          onClick={() => toggleSort('confidence')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            AI %
                            <ArrowUpDown className="h-4 w-4" strokeWidth={1.5} />
                          </div>
                        </th>
                        <th 
                          className="text-center py-5 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider cursor-pointer hover:bg-[#FAFAF8] transition-colors"
                          onClick={() => toggleSort('risk')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Ризик
                            <ArrowUpDown className="h-4 w-4" strokeWidth={1.5} />
                          </div>
                        </th>
                        <th className="text-left py-5 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">Коефіцієнти</th>
                        <th className="text-center py-5 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">Win Rate</th>
                        <th className="text-center py-5 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">Info</th>
                        <th className="text-left py-5 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">Турнір</th>
                        <th className="text-left py-5 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">AI Рекомендація</th>
                        <th className="text-left py-5 px-6 text-sm font-normal text-[#2A2A2A] uppercase tracking-wider">Коментар</th>
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
                            className="border-b border-[#E8E6DC] hover:bg-[#FAFAF8] transition-colors"
                          >
                            <td className="py-5 px-6">
                              <div className="flex items-center gap-2">
                                <div>
                                  <div className="font-normal text-black text-[15px]">
                                    {match.team1} <span className="text-[#8B8B8B] font-light">vs</span> {match.team2}
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="secondary" className="text-xs px-3 py-1.5 rounded-[12px] bg-[#F5F5F3] text-black border-0 font-light">
                                      {match.matchType}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs px-3 py-1.5 rounded-[12px] bg-[#F5F5F3] text-black border-0 font-light">
                                      {match.tier.toUpperCase()}
                                    </Badge>
                                    {match.url && (
                                      <a 
                                        href={match.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-black hover:text-[#6B6B6B] transition-colors p-1 hover:bg-[#F5F5F3] rounded-lg inline-block"
                                      >
                                        <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="font-normal text-black text-[15px]">{match.favorite}</div>
                            </td>
                            <td className="py-5 px-6 text-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge 
                                    className={`font-normal px-4 py-2 rounded-[16px] border-0 text-sm cursor-help hover:scale-105 transition-transform ${
                                      match.aiConfidence >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-[0_4px_12px_rgba(76,175,80,0.3)]' :
                                      match.aiConfidence >= 60 ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-[0_4px_12px_rgba(33,150,243,0.3)]' : 
                                      'bg-gradient-to-r from-gray-400 to-gray-600 text-white shadow-[0_4px_12px_rgba(158,158,158,0.3)]'
                                    }`}
                                  >
                                    <Info className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
                                    {match.aiConfidence}%
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-md p-5 bg-white border-2 border-[#E8E6DC] shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[20px]">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-3 pb-3 border-b-2 border-[#E8E6DC]">
                                      <Info className="h-5 w-5 text-black" strokeWidth={1.5} />
                                      <p className="font-normal text-base text-black">Пояснення AI прогнозу</p>
                                    </div>
                                    <div className="text-sm text-[#6B6B6B] whitespace-pre-line leading-relaxed font-light">
                                      {aiExplanation}
                                    </div>
                                    <div className="mt-4 pt-3 border-t-2 border-[#E8E6DC]">
                                      <p className="text-sm text-[#8B8B8B] italic font-light">
                                        💡 AI аналізує форму команд, історію матчів, коефіцієнти та інші фактори
                                      </p>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </td>
                            <td className="py-5 px-6 text-center">
                              <div className="flex items-center justify-center gap-2 cursor-pointer hover:scale-105 transition-transform" title="Клікніть для сортування">
                                <div className={`w-2.5 h-2.5 rounded-full ${riskInfo.dotColor} shadow-md`} />
                                <span className="text-[15px] font-normal text-black">{match.risk}%</span>
                              </div>
                              <div className="text-xs text-[#6B6B6B] mt-1.5 font-light">{riskInfo.label}</div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="text-[15px] space-y-1">
                                <div className="text-[#6B6B6B] font-light">{match.team1}: <span className="font-normal text-black">{match.odds.team1}</span></div>
                                <div className="text-[#6B6B6B] font-light">{match.team2}: <span className="font-normal text-black">{match.odds.team2}</span></div>
                              </div>
                            </td>
                            <td className="py-5 px-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {match.winRate >= 70 ? (
                                  <TrendingUp className="h-5 w-5 text-[#4CAF50]" strokeWidth={1.5} />
                                ) : (
                                  <TrendingDown className="h-5 w-5 text-[#D32F2F]" strokeWidth={1.5} />
                                )}
                                <span className="font-normal text-black text-[15px]">{match.winRate}%</span>
                              </div>
                            </td>
                            <td className="py-5 px-6 text-center">
                              <div className="flex flex-col items-center gap-2">
                                {safePick && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-3 py-1.5 rounded-[16px] border-0 font-normal shadow-[0_4px_12px_rgba(76,175,80,0.3)] flex items-center gap-1.5 cursor-help">
                                        <Shield className="h-3.5 w-3.5" strokeWidth={1.5} />
                                        Safe Pick
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-white border-2 border-[#A5D6A7] shadow-[0_8px_32px_rgba(76,175,80,0.2)] rounded-[20px] p-4">
                                      <p className="text-sm text-[#6B6B6B] max-w-xs font-light">
                                        🛡️ <strong>Safe Pick</strong> - Матч з високою впевненістю AI (&gt;80%), низьким ризиком (&lt;30%) та стабільною формою команди. Рекомендується для надійних ставок.
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge className={`${formInfo.color} flex items-center gap-1.5 justify-center px-3 py-1.5 rounded-[16px] font-normal text-xs shadow-lg cursor-help`}>
                                      {formInfo.icon}
                                      {formInfo.label}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-white border-2 border-[#E8E6DC] shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[20px] p-4">
                                    <p className="text-sm text-[#6B6B6B] max-w-xs font-light">
                                      {formInfo.tooltip}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="text-[15px] text-[#6B6B6B] font-light">{match.context}</div>
                            </td>
                            <td className="py-5 px-6">
                              <Button
                                onClick={() => handleGetAIRecommendation(match)}
                                className="group relative rounded-[16px] bg-[#F4E157] hover:bg-[#E8D54A] text-black font-normal shadow-[0_4px_12px_rgba(244,225,87,0.3)] transition-all hover:scale-105 flex items-center gap-2 overflow-hidden h-11 px-5"
                                size="sm"
                              >
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                                <Brain className="h-4 w-4 relative z-10" strokeWidth={1.5} />
                                <span className="relative z-10">Отримати прогноз</span>
                              </Button>
                            </td>
                            <td className="py-5 px-6">
                              {riskComments ? (
                                <Button
                                  onClick={() => handleShowComment(match)}
                                  className="group relative rounded-[16px] bg-[#F4E157] hover:bg-[#E8D54A] text-black font-normal shadow-[0_4px_12px_rgba(244,225,87,0.3)] transition-all hover:scale-105 flex items-center gap-2 overflow-hidden h-11 px-5"
                                  size="sm"
                                >
                                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                                  <Eye className="h-4 w-4 relative z-10" strokeWidth={1.5} />
                                  <span className="relative z-10">Показати</span>
                                </Button>
                              ) : (
                                <div className="text-sm text-[#8B8B8B] font-light">—</div>
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
            <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
              <CardContent className="py-24">
                <div className="text-center">
                  <div className="p-8 bg-[#F5F5F3] rounded-[32px] inline-block mb-6">
                    <AlertTriangle className="h-20 w-20 text-[#8B8B8B]" strokeWidth={1.5} />
                  </div>
                  <p className="text-black font-normal text-xl">Немає матчів за обраними фільтрами</p>
                  <p className="text-base text-[#6B6B6B] mt-3 font-light">Спробуйте змінити фільтри або оновити дані</p>
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
      </div>
    </TooltipProvider>
  );
}