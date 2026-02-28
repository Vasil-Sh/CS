import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  Trophy, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  ArrowUpDown,
  Search,
  Loader2,
  Flame,
  Shield,
  AlertCircle,
  Eye,
  Lightbulb,
  Brain,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Sun,
  Moon,
  User
} from 'lucide-react';
import { fetchAndParseMatches, convertToMatchFormat } from '@/lib/parser/hltvParser';
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

// Mock data for demonstration
const mockMatches: Match[] = [
  {
    id: '1',
    date: '2026-02-27',
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
    date: '2026-02-27',
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
    date: '2026-02-27',
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
    date: '2026-02-27',
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
    date: '2026-02-27',
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

const getRiskColor = (risk: number): string => {
  if (risk <= 30) return 'bg-[#F0FDF4] text-[#16A34A]';
  if (risk <= 50) return 'bg-[#FFFBEB] text-[#D97706]';
  return 'bg-[#FEF2F2] text-[#DC2626]';
};

const cardBaseStyle = {
  transform: 'scale(1)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
};

const cardHoverStyle = {
  transform: 'scale(1.03)',
  boxShadow: '0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)',
};

const chartCardShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)';

export default function Matches() {
  const currentUser = localStorage.getItem('username') || '';
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';

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
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedCommentMatch, setSelectedCommentMatch] = useState<Match | null>(null);
  
  const [riskyTeams, setRiskyTeams] = useState<RiskyTeam[]>([]);
  
  const { toast } = useToast();

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

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
    if (team) return { notes: team.notes, status: team.status };
    return null;
  };

  const getMatchRiskComments = (team1: string, team2: string): string => {
    const team1Risk = getTeamRiskInfo(team1);
    const team2Risk = getTeamRiskInfo(team2);
    const comments: string[] = [];
    if (team1Risk) {
      const icon = team1Risk.status === 'БАН' ? '🔴' : team1Risk.status === 'Нестабільні' ? '🟠' : team1Risk.status === 'Обережно' ? '🟡' : '🔵';
      comments.push(`${icon} ${team1}: ${team1Risk.notes || team1Risk.status}`);
    }
    if (team2Risk) {
      const icon = team2Risk.status === 'БАН' ? '🔴' : team2Risk.status === 'Нестабільні' ? '🟠' : team2Risk.status === 'Обережно' ? '🟡' : '🔵';
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
      toast({ title: '❌ Помилка', description: 'Не вдалося отримати AI рекомендацію', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleShowComment = (match: Match) => {
    setSelectedCommentMatch(match);
    setCommentModalOpen(true);
  };

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

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'date': comparison = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
      case 'confidence': comparison = b.aiConfidence - a.aiConfidence; break;
      case 'risk': comparison = a.risk - b.risk; break;
      case 'upset': comparison = b.upsetProbability - a.upsetProbability; break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const currentDate = sortedMatches.length > 0 ? sortedMatches[0].date : new Date().toISOString().split('T')[0];

  const safePicksCount = sortedMatches.filter(m => 
    m.aiConfidence >= 80 && m.risk <= 30 && m.upsetProbability <= 15 &&
    m.formStability !== 'falling' && m.formStability !== 'slump' && m.formStability !== 'inconsistent'
  ).length;

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
      toast({ title: '🔄 Завантаження матчів з HLTV...', description: 'Використовується Supabase Edge Function' });
      const hltvMatches = await fetchAndParseMatches(true);
      if (hltvMatches && hltvMatches.length > 0) {
        const formattedMatches = hltvMatches.map(match => {
          const converted = convertToMatchFormat(match);
          return {
            ...converted,
            aiConfidence: Math.floor(Math.random() * 30) + 60,
            risk: Math.floor(Math.random() * 50) + 10,
            odds: { team1: match.odds1 || 1.5, team2: match.odds2 || 2.5 },
            playerForm: [],
            tier: 'tier1' as const,
            matchType: (match.type?.toUpperCase() || 'Bo3') as 'Bo1' | 'Bo3' | 'Bo5',
            upsetProbability: Math.floor(Math.random() * 30) + 10,
            formStability: 'stable' as FormStability
          };
        });
        setMatches(formattedMatches);
        toast({ title: '✅ Матчі оновлено!', description: `Завантажено ${formattedMatches.length} матчів з HLTV` });
      } else {
        toast({ title: '⚠️ Матчі не знайдено', description: 'Використовуються демо-дані', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '❌ Помилка завантаження', description: `${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const avgConfidence = sortedMatches.length > 0 
    ? Math.round(sortedMatches.reduce((sum, m) => sum + m.aiConfidence, 0) / sortedMatches.length)
    : 0;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#f3f3f3] relative">
        {/* ===== HEADER ===== */}
        <div className="px-6 lg:px-8 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <h1 className="text-[48px] font-semibold text-[#111827] leading-tight tracking-tight">
              Матчі
            </h1>

            <div className="flex items-center gap-3">
              {/* Theme Switcher */}
              <div className="flex items-center gap-1 p-1 rounded-full bg-black/5">
                <button
                  onClick={() => { if (isDarkTheme) toggleTheme(); }}
                  className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                    !isDarkTheme ? 'bg-white shadow-sm' : 'hover:bg-black/5'
                  }`}
                  title="Світла тема"
                >
                  <Sun className={`h-4 w-4 ${!isDarkTheme ? 'text-[#2563EB]' : 'text-[#9CA3AF]'}`} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => { if (!isDarkTheme) toggleTheme(); }}
                  className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                    isDarkTheme ? 'bg-white shadow-sm' : 'hover:bg-black/5'
                  }`}
                  title="Темна тема"
                >
                  <Moon className={`h-4 w-4 ${isDarkTheme ? 'text-[#2563EB]' : 'text-[#9CA3AF]'}`} strokeWidth={1.5} />
                </button>
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-[#D1D5DB]" />

              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111827]">
                  <User className="h-4 w-4 text-white" strokeWidth={2} />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-[#111827] leading-tight">
                    {currentUser || 'User'}
                  </p>
                  <p className="text-xs text-[#6B7280] leading-tight">
                    {isAdmin ? 'Адміністратор' : 'Користувач'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8 px-6 lg:px-8 pb-8 pt-4">

          {/* ===== QUICK STATS ===== */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div 
              className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
              style={cardBaseStyle}
              onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
              onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                <span className="text-lg font-semibold text-[#111827]">Всього матчів</span>
              </div>
              <div className="text-4xl font-bold text-[#111827] tracking-tight mb-2">{sortedMatches.length}</div>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} />
                <span className="text-sm text-[#9CA3AF]">на сьогодні</span>
              </div>
            </div>

            <div 
              className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
              style={cardBaseStyle}
              onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
              onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                <span className="text-lg font-semibold text-[#111827]">Безпечні матчі</span>
              </div>
              <div className="text-4xl font-bold text-[#22C55E] tracking-tight mb-2">{sortedMatches.filter(m => m.risk <= 30).length}</div>
              <div className="flex items-center gap-2">
                {sortedMatches.filter(m => m.risk <= 30).length > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-[#EF4444]" strokeWidth={2.5} />
                )}
                <span className="text-sm text-[#9CA3AF]">ризик ≤30%</span>
              </div>
            </div>

            <div 
              className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
              style={cardBaseStyle}
              onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
              onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                <span className="text-lg font-semibold text-[#111827]">Hot Matches</span>
              </div>
              <div className="text-4xl font-bold text-[#F97316] tracking-tight mb-2">{sortedMatches.filter(m => m.aiConfidence >= 70 && m.upsetProbability < 20).length}</div>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-[#F97316]" strokeWidth={2.5} />
                <span className="text-sm text-[#9CA3AF]">впевненість ≥70%</span>
              </div>
            </div>

            <div 
              className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
              style={cardBaseStyle}
              onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
              onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                <span className="text-lg font-semibold text-[#111827]">Safe Picks</span>
              </div>
              <div className="text-4xl font-bold text-[#0EA5E9] tracking-tight mb-2">{safePicksCount}</div>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-[#9CA3AF]" strokeWidth={1.5} />
                <span className="text-sm text-[#9CA3AF]">найнадійніші</span>
              </div>
            </div>

            <div 
              className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
              style={cardBaseStyle}
              onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
              onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                <span className="text-lg font-semibold text-[#111827]">Середній Прогноз</span>
              </div>
              <div className="text-4xl font-bold text-[#8B5CF6] tracking-tight mb-2">{avgConfidence}%</div>
              <div className="flex items-center gap-2">
                {avgConfidence >= 65 ? (
                  <ArrowUpRight className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-[#EF4444]" strokeWidth={2.5} />
                )}
                <span className={`text-sm font-semibold ${avgConfidence >= 65 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {avgConfidence >= 65 ? 'Хороший рівень' : 'Низький рівень'}
                </span>
              </div>
            </div>
          </div>

          {/* ===== MATCHES TABLE with INLINE FILTERS ===== */}
          <Card 
            className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden"
            style={{ boxShadow: chartCardShadow }}
          >
            <CardHeader className="bg-white border-b border-[#E5E7EB] px-6 py-5">
              {/* Row 1: Date + Refresh */}
              <div className="flex items-center justify-between mb-5">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-[#111827]">
                  <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
                    <Calendar className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                  </div>
                  {currentDate}
                </CardTitle>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={refreshMatches}
                      disabled={isLoading}
                      size="sm"
                      className="rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white font-medium h-10 px-5 transition-all duration-200 text-sm"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                      ) : (
                        <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
                      )}
                      <span className="ml-2">Оновити</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#111827] text-white p-2 rounded-lg">
                    <p className="text-sm">Оновити матчі з HLTV</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Row 2: Inline compact filters — text-sm size */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="relative flex-shrink-0">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" strokeWidth={1.5} />
                  <Input
                    placeholder="Пошук..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-3 rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#111827] transition-colors h-10 w-[160px] text-sm"
                  />
                </div>

                {/* Tier */}
                <Select value={filterTier} onValueChange={(value: 'all' | 'tier1' | 'tier2' | 'tier3') => setFilterTier(value)}>
                  <SelectTrigger className="rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] transition-colors h-10 w-[120px] text-sm">
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі Tier</SelectItem>
                    <SelectItem value="tier1">Tier 1</SelectItem>
                    <SelectItem value="tier2">Tier 2</SelectItem>
                    <SelectItem value="tier3">Tier 3</SelectItem>
                  </SelectContent>
                </Select>

                {/* Confidence */}
                <Select value={filterConfidence} onValueChange={(value: 'all' | 'high' | 'medium' | 'low') => setFilterConfidence(value)}>
                  <SelectTrigger className="rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] transition-colors h-10 w-[150px] text-sm">
                    <SelectValue placeholder="Впевненість" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Впевненість</SelectItem>
                    <SelectItem value="high">Висока (&gt;80%)</SelectItem>
                    <SelectItem value="medium">Середня (60-80%)</SelectItem>
                    <SelectItem value="low">Низька (&lt;60%)</SelectItem>
                  </SelectContent>
                </Select>

                {/* Risk */}
                <Select value={filterRisk} onValueChange={(value: 'all' | 'safe' | 'moderate' | 'high') => setFilterRisk(value)}>
                  <SelectTrigger className="rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] transition-colors h-10 w-[130px] text-sm">
                    <SelectValue placeholder="Ризик" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Ризик</SelectItem>
                    <SelectItem value="safe">Низький</SelectItem>
                    <SelectItem value="moderate">Помірний</SelectItem>
                    <SelectItem value="high">Високий</SelectItem>
                  </SelectContent>
                </Select>

                {/* Match Type */}
                <Select value={filterMatchType} onValueChange={(value: 'all' | 'Bo1' | 'Bo3' | 'Bo5') => setFilterMatchType(value)}>
                  <SelectTrigger className="rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] transition-colors h-10 w-[110px] text-sm">
                    <SelectValue placeholder="Формат" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Формат</SelectItem>
                    <SelectItem value="Bo1">Bo1</SelectItem>
                    <SelectItem value="Bo3">Bo3</SelectItem>
                    <SelectItem value="Bo5">Bo5</SelectItem>
                  </SelectContent>
                </Select>

                {/* Hot Matches Toggle */}
                <Button
                  variant={showHotMatches ? "default" : "outline"}
                  onClick={() => setShowHotMatches(!showHotMatches)}
                  className={`rounded-xl font-medium h-10 px-4 transition-all duration-200 text-sm ${
                    showHotMatches 
                      ? 'bg-[#111827] hover:bg-[#1F2937] text-white border-0' 
                      : 'border border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151]'
                  }`}
                >
                  <Flame className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Hot
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <th className="text-left py-4 px-5 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Матч</th>
                      <th className="text-center py-4 px-5 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Фаворит</th>
                      <th className="text-center py-4 px-5 text-sm font-medium text-[#6B7280] uppercase tracking-wider cursor-pointer hover:bg-[#F3F4F6] transition-colors rounded-lg" onClick={() => toggleSort('confidence')}>
                        <div className="flex items-center justify-center gap-1.5">
                          Прогноз
                          <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </div>
                      </th>
                      <th className="text-center py-4 px-5 text-sm font-medium text-[#6B7280] uppercase tracking-wider cursor-pointer hover:bg-[#F3F4F6] transition-colors rounded-lg" onClick={() => toggleSort('risk')}>
                        <div className="flex items-center justify-center gap-1.5">
                          Ризик
                          <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </div>
                      </th>
                      <th className="text-left py-4 px-5 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Коефіцієнти</th>
                      <th className="text-center py-4 px-5 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Win Rate</th>
                      <th className="text-left py-4 px-5 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Турнір</th>
                      <th className="text-center py-4 px-4 text-sm font-medium text-[#6B7280] uppercase tracking-wider">AI</th>
                      <th className="text-center py-4 px-4 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Нотатки</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMatches.map((match) => {
                      const formInfo = getFormStabilityInfo(match.formStability);
                      const riskComments = getMatchRiskComments(match.team1, match.team2);
                      const riskColorClass = getRiskColor(match.risk);
                      const isFavTeam1 = match.favorite === match.team1;

                      return (
                        <tr key={match.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors">
                          {/* Match */}
                          <td className="py-4 px-5">
                            <div className="space-y-1.5">
                              <div className="font-medium text-[#111827] text-sm">
                                {match.team1} vs {match.team2}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Badge className="bg-[#F3F4F6] text-[#374151] border-0 rounded-lg px-2 py-0.5 text-xs font-medium">
                                  {match.matchType}
                                </Badge>
                                <Badge className="bg-[#111827] text-white border-0 rounded-lg px-2 py-0.5 text-xs font-medium uppercase">
                                  {match.tier}
                                </Badge>
                              </div>
                            </div>
                          </td>

                          {/* Favorite */}
                          <td className="py-4 px-5 text-center">
                            <span className="font-medium text-[#111827] text-sm">{match.favorite}</span>
                          </td>

                          {/* Confidence */}
                          <td className="py-4 px-5 text-center">
                            <span className="text-base font-bold text-[#3B82F6]">{match.aiConfidence}%</span>
                          </td>

                          {/* Risk */}
                          <td className="py-4 px-5 text-center">
                            <span className={`inline-block text-base font-bold px-3 py-1 rounded-lg ${riskColorClass}`}>
                              {match.risk}%
                            </span>
                          </td>

                          {/* Odds — highlight favorite */}
                          <td className="py-4 px-5">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-[#6B7280] min-w-[60px]">{match.team1}:</span>
                                <span className={`text-sm ${isFavTeam1 ? 'font-bold text-[#111827] bg-[#F0FDF4] px-2 py-0.5 rounded-md' : 'text-[#6B7280]'}`}>
                                  {match.odds.team1}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-[#6B7280] min-w-[60px]">{match.team2}:</span>
                                <span className={`text-sm ${!isFavTeam1 ? 'font-bold text-[#111827] bg-[#F0FDF4] px-2 py-0.5 rounded-md' : 'text-[#6B7280]'}`}>
                                  {match.odds.team2}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Win Rate */}
                          <td className="py-4 px-5 text-center">
                            <div className="text-base font-bold text-[#111827]">{match.winRate}%</div>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge className={`${formInfo.color} mt-1.5 px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1`}>
                                  {formInfo.icon}
                                  {formInfo.label}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs bg-[#111827] text-white p-3 rounded-xl">
                                <p className="text-sm">{formInfo.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </td>

                          {/* Tournament */}
                          <td className="py-4 px-5">
                            <span className="text-sm text-[#6B7280]">{match.context}</span>
                          </td>

                          {/* AI Recommendation — icon */}
                          <td className="py-4 px-4 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleGetAIRecommendation(match)}
                                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#F5F3FF] hover:bg-[#EDE9FE] border border-[#DDD6FE] transition-all duration-200"
                                >
                                  <Lightbulb className="h-4.5 w-4.5 text-[#7C3AED]" strokeWidth={1.5} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#111827] text-white p-2 rounded-lg">
                                <p className="text-sm">Показати AI рекомендацію</p>
                              </TooltipContent>
                            </Tooltip>
                          </td>

                          {/* Comment — blue icon */}
                          <td className="py-4 px-4 text-center">
                            {riskComments ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleShowComment(match)}
                                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] transition-all duration-200"
                                  >
                                    <Eye className="h-4.5 w-4.5 text-[#2563EB]" strokeWidth={1.5} />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-[#111827] text-white p-2 rounded-lg">
                                  <p className="text-sm">Переглянути коментар</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-[#D1D5DB] text-sm">—</span>
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