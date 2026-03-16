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
  User,
  Clock,
  CheckCircle2,
  Radio,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
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
import {
  fetchTodaysAndUpcomingMatches,
  parseMatchType,
  parseMatchContext,
  determineTier,
  determineFavorite,
  getMatchStatus,
  type ApiMatch
} from '@/lib/csApi';

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
  // Fields from API
  score1?: number;
  score2?: number;
  matchStatus?: 'upcoming' | 'live' | 'finished';
  positionTeam1?: number | null;
  positionTeam2?: number | null;
  logoTeam1?: string | null;
  logoTeam2?: string | null;
  predictionPercentTeam1?: number | null;
  predictionPercentTeam2?: number | null;
  bettingCoefficientTeam1?: number | null;
  bettingCoefficientTeam2?: number | null;
}

/**
 * Convert API match to internal Match format
 */
function apiMatchToMatch(apiMatch: ApiMatch): Match {
  const matchType = parseMatchType(apiMatch.type);
  const context = parseMatchContext(apiMatch.type, apiMatch.link);
  const tier = determineTier(apiMatch.positionTeam1, apiMatch.positionTeam2);
  const favorite = determineFavorite(
    apiMatch.nameTeam1, apiMatch.nameTeam2,
    apiMatch.positionTeam1, apiMatch.positionTeam2
  );
  const status = getMatchStatus(apiMatch);

  // Calculate a rough confidence based on position difference
  const pos1 = apiMatch.positionTeam1 ?? 150;
  const pos2 = apiMatch.positionTeam2 ?? 150;
  const posDiff = Math.abs(pos1 - pos2);

  // Use API prediction percentage if available, otherwise fallback to position-based calculation
  const pred1 = apiMatch.predictionPercentTeam1;
  const pred2 = apiMatch.predictionPercentTeam2;
  const hasPrediction = pred1 != null && pred2 != null && (pred1 > 0 || pred2 > 0);
  const baseConfidence = hasPrediction
    ? Math.round(Math.max(pred1 ?? 0, pred2 ?? 0))
    : Math.min(85, 55 + Math.floor(posDiff * 0.3));
  
  // Risk is inversely related to confidence
  const risk = Math.max(10, 100 - baseConfidence - Math.floor(Math.random() * 10));

  // Win rate based on positions
  const winRate = hasPrediction
    ? Math.round(Math.max(pred1 ?? 0, pred2 ?? 0))
    : Math.min(80, Math.max(50, 50 + Math.floor(posDiff * 0.25)));

  // Use betting coefficients for odds if available
  const coeff1 = apiMatch.bettingCoefficientTeam1;
  const coeff2 = apiMatch.bettingCoefficientTeam2;
  const hasCoeffs = coeff1 != null && coeff2 != null && (coeff1 > 0 || coeff2 > 0);

  // Determine form stability based on lastChangeDate
  let formStability: FormStability = 'stable';
  const now = new Date();
  const team1Change = apiMatch.lastChangeDateTeam1 ? new Date(apiMatch.lastChangeDateTeam1) : null;
  const team2Change = apiMatch.lastChangeDateTeam2 ? new Date(apiMatch.lastChangeDateTeam2) : null;
  
  // If favorite team had recent roster change, mark as inconsistent
  const favChange = favorite === apiMatch.nameTeam1 ? team1Change : team2Change;
  if (favChange) {
    const daysSinceChange = Math.floor((now.getTime() - favChange.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceChange <= 14) formStability = 'inconsistent';
    else if (daysSinceChange <= 30) formStability = 'momentum';
  }

  // If both teams are very close in ranking, it's riskier
  if (posDiff <= 10) {
    formStability = 'inconsistent';
  }

  return {
    id: String(apiMatch.id),
    date: apiMatch.date,
    team1: apiMatch.nameTeam1,
    team2: apiMatch.nameTeam2,
    favorite,
    aiConfidence: baseConfidence,
    risk,
    comment: '',
    aiSummary: '',
    odds: {
      team1: hasCoeffs ? (coeff1 ?? 0) : 0,
      team2: hasCoeffs ? (coeff2 ?? 0) : 0,
    },
    winRate,
    formStability,
    playerForm: [],
    context,
    tier,
    matchType,
    upsetProbability: Math.max(5, Math.min(45, 50 - Math.floor(posDiff * 0.3))),
    url: apiMatch.link,
    score1: apiMatch.score1,
    score2: apiMatch.score2,
    matchStatus: status,
    positionTeam1: apiMatch.positionTeam1,
    positionTeam2: apiMatch.positionTeam2,
    logoTeam1: apiMatch.logoTeam1,
    logoTeam2: apiMatch.logoTeam2,
    predictionPercentTeam1: apiMatch.predictionPercentTeam1,
    predictionPercentTeam2: apiMatch.predictionPercentTeam2,
    bettingCoefficientTeam1: apiMatch.bettingCoefficientTeam1,
    bettingCoefficientTeam2: apiMatch.bettingCoefficientTeam2,
  };
}

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

const getStatusBadge = (status?: 'upcoming' | 'live' | 'finished') => {
  switch (status) {
    case 'live':
      return (
        <Badge className="bg-red-500/10 text-red-600 border-red-200 rounded-lg px-2 py-0.5 text-xs font-medium inline-flex items-center gap-1 animate-pulse">
          <Radio className="h-3 w-3" strokeWidth={2} />
          LIVE
        </Badge>
      );
    case 'finished':
      return (
        <Badge className="bg-gray-100 text-gray-500 border-gray-200 rounded-lg px-2 py-0.5 text-xs font-medium inline-flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
          Завершено
        </Badge>
      );
    case 'upcoming':
      return (
        <Badge className="bg-blue-50 text-blue-600 border-blue-200 rounded-lg px-2 py-0.5 text-xs font-medium inline-flex items-center gap-1">
          <Clock className="h-3 w-3" strokeWidth={2} />
          Очікується
        </Badge>
      );
    default:
      return null;
  }
};

/**
 * Get numeric priority for match status (lower = higher priority / shown first)
 * live = 0 (top), upcoming = 1, finished = 2 (bottom)
 */
const getStatusPriority = (status?: 'upcoming' | 'live' | 'finished'): number => {
  switch (status) {
    case 'live': return 0;
    case 'upcoming': return 1;
    case 'finished': return 2;
    default: return 3;
  }
};

/** Team logo component with fallback */
const TeamLogo = ({ src, teamName, size = 20 }: { src?: string | null; teamName: string; size?: number }) => {
  if (!src) {
    return (
      <div 
        className="flex items-center justify-center rounded-full bg-[#F3F4F6] text-[#6B7280] font-semibold text-[10px] flex-shrink-0"
        style={{ width: size, height: size }}
      >
        {teamName.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={teamName}
      className="rounded-full object-cover flex-shrink-0 bg-[#F3F4F6]"
      style={{ width: size, height: size }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.className = 'flex items-center justify-center rounded-full bg-[#F3F4F6] text-[#6B7280] font-semibold text-[10px] flex-shrink-0';
        fallback.style.width = `${size}px`;
        fallback.style.height = `${size}px`;
        fallback.textContent = teamName.charAt(0).toUpperCase();
        target.parentNode?.insertBefore(fallback, target);
      }}
    />
  );
};

/** Prediction bar component */
const PredictionBar = ({ percent1, percent2, team1, team2 }: { percent1: number; percent2: number; team1: string; team2: string }) => {
  const total = percent1 + percent2;
  if (total === 0) return <span className="text-[#D1D5DB] text-sm">—</span>;
  
  const w1 = Math.round((percent1 / total) * 100);
  const w2 = 100 - w1;
  const isTeam1Favored = percent1 >= percent2;

  return (
    <div className="space-y-1 min-w-[120px]">
      <div className="flex items-center justify-between text-[10px] text-[#6B7280]">
        <span className={isTeam1Favored ? 'font-bold text-[#111827]' : ''}>{percent1}%</span>
        <span className={!isTeam1Favored ? 'font-bold text-[#111827]' : ''}>{percent2}%</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-[#F3F4F6]">
        <div 
          className={`transition-all duration-300 ${isTeam1Favored ? 'bg-[#22C55E]' : 'bg-[#3B82F6]'}`}
          style={{ width: `${w1}%` }}
        />
        <div 
          className={`transition-all duration-300 ${!isTeam1Favored ? 'bg-[#22C55E]' : 'bg-[#3B82F6]'}`}
          style={{ width: `${w2}%` }}
        />
      </div>
    </div>
  );
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

  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'risk' | 'upset' | 'status'>('status');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterTier, setFilterTier] = useState<'all' | 'tier1' | 'tier2' | 'tier3'>('all');
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [filterRisk, setFilterRisk] = useState<'all' | 'safe' | 'moderate' | 'high'>('all');
  const [filterMatchType, setFilterMatchType] = useState<'all' | 'Bo1' | 'Bo3' | 'Bo5'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'live' | 'finished'>('all');
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

  // Load matches from API on mount
  useEffect(() => {
    loadMatchesFromApi();
    loadRiskyTeams();
  }, []);

  const loadMatchesFromApi = async () => {
    try {
      const apiMatches = await fetchTodaysAndUpcomingMatches();
      if (apiMatches && apiMatches.length > 0) {
        const converted = apiMatches.map(apiMatchToMatch);
        setMatches(converted);
      }
    } catch (error) {
      console.error('Error loading matches from API:', error);
      toast({
        title: '⚠️ Помилка завантаження',
        description: 'Не вдалося завантажити матчі з API',
        variant: 'destructive'
      });
    } finally {
      setInitialLoading(false);
    }
  };

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
    if (filterStatus !== 'all' && match.matchStatus !== filterStatus) return false;
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
      case 'status': {
        // Primary sort: by status priority (live first, then upcoming, then finished)
        const statusDiff = getStatusPriority(a.matchStatus) - getStatusPriority(b.matchStatus);
        if (statusDiff !== 0) {
          comparison = statusDiff;
        } else {
          // Secondary sort: by time within the same status group
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        break;
      }
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    if (hours === 0 && minutes === 0) return 'TBD';
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  };

  const todayStr = new Date().toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const safePicksCount = sortedMatches.filter(m => 
    m.aiConfidence >= 80 && m.risk <= 30 && m.upsetProbability <= 15 &&
    m.formStability !== 'falling' && m.formStability !== 'slump' && m.formStability !== 'inconsistent'
  ).length;

  const liveCount = sortedMatches.filter(m => m.matchStatus === 'live').length;
  const upcomingCount = sortedMatches.filter(m => m.matchStatus === 'upcoming').length;
  const finishedCount = sortedMatches.filter(m => m.matchStatus === 'finished').length;

  const toggleSort = (column: 'date' | 'confidence' | 'risk' | 'upset' | 'status') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      // Default sort orders: status asc = live first, date asc = earliest first, confidence desc = highest first
      if (column === 'confidence' || column === 'upset') {
        setSortOrder('desc');
      } else {
        setSortOrder('asc');
      }
    }
  };

  const refreshMatches = async () => {
    setIsLoading(true);
    try {
      toast({ title: '🔄 Завантаження матчів...', description: 'Оновлення з API' });
      const apiMatches = await fetchTodaysAndUpcomingMatches();
      if (apiMatches && apiMatches.length > 0) {
        const converted = apiMatches.map(apiMatchToMatch);
        setMatches(converted);
        toast({ title: '✅ Матчі оновлено!', description: `Завантажено ${converted.length} матчів` });
      } else {
        toast({ title: '⚠️ Матчі не знайдено', description: 'API повернув порожній результат', variant: 'destructive' });
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

  /** Render sort indicator arrow for a column */
  const renderSortIndicator = (column: 'date' | 'confidence' | 'risk' | 'upset' | 'status') => {
    if (sortBy === column) {
      return sortOrder === 'asc' 
        ? <ArrowUp className="h-3.5 w-3.5 text-[#2563EB]" strokeWidth={2} />
        : <ArrowDown className="h-3.5 w-3.5 text-[#2563EB]" strokeWidth={2} />;
    }
    return <ArrowUpDown className="h-3.5 w-3.5 text-[#9CA3AF]" strokeWidth={1.5} />;
  };

  /** Format coefficient for display */
  const formatCoeff = (coeff: number | null | undefined): string => {
    if (coeff == null || coeff === 0) return '—';
    return coeff.toFixed(2);
  };

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
                <Radio className="h-5 w-5 text-[#EF4444]" strokeWidth={1.5} />
                <span className="text-lg font-semibold text-[#111827]">LIVE</span>
              </div>
              <div className="text-4xl font-bold text-[#EF4444] tracking-tight mb-2">{liveCount}</div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#9CA3AF]">зараз грають</span>
              </div>
            </div>

            <div 
              className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
              style={cardBaseStyle}
              onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
              onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-[#2563EB]" strokeWidth={1.5} />
                <span className="text-lg font-semibold text-[#111827]">Очікуються</span>
              </div>
              <div className="text-4xl font-bold text-[#2563EB] tracking-tight mb-2">{upcomingCount}</div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#9CA3AF]">ще не почались</span>
              </div>
            </div>

            <div 
              className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
              style={cardBaseStyle}
              onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
              onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-[#22C55E]" strokeWidth={1.5} />
                <span className="text-lg font-semibold text-[#111827]">Завершені</span>
              </div>
              <div className="text-4xl font-bold text-[#22C55E] tracking-tight mb-2">{finishedCount}</div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#9CA3AF]">зіграні матчі</span>
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
                  {todayStr}
                  <span className="text-sm font-normal text-[#9CA3AF] ml-2">
                    ({sortedMatches.length} матчів)
                  </span>
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
                    <p className="text-sm">Оновити матчі з API</p>
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

                {/* Status */}
                <Select value={filterStatus} onValueChange={(value: 'all' | 'upcoming' | 'live' | 'finished') => setFilterStatus(value)}>
                  <SelectTrigger className="rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] transition-colors h-10 w-[130px] text-sm">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі статуси</SelectItem>
                    <SelectItem value="live">🔴 LIVE</SelectItem>
                    <SelectItem value="upcoming">🕐 Очікуються</SelectItem>
                    <SelectItem value="finished">✅ Завершені</SelectItem>
                  </SelectContent>
                </Select>

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
                  Гарячі
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {initialLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-[#2563EB] mx-auto" />
                    <p className="text-[#6B7280] text-sm">Завантаження матчів...</p>
                  </div>
                </div>
              ) : sortedMatches.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center space-y-4">
                    <Trophy className="h-10 w-10 text-[#D1D5DB] mx-auto" />
                    <p className="text-[#6B7280] text-sm">Матчів не знайдено</p>
                    <Button onClick={refreshMatches} variant="outline" size="sm" className="rounded-xl">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Спробувати знову
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                        <th className="text-left py-4 px-5 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Матч</th>
                        <th 
                          className="text-center py-4 px-5 text-sm font-medium text-[#6B7280] uppercase tracking-wider cursor-pointer hover:bg-[#F3F4F6] transition-colors rounded-lg select-none" 
                          onClick={() => toggleSort('date')}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            Час
                            {renderSortIndicator('date')}
                          </div>
                        </th>
                        <th className="text-center py-4 px-5 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Рахунок</th>
                        <th 
                          className="text-center py-4 px-5 text-sm font-medium text-[#6B7280] uppercase tracking-wider cursor-pointer hover:bg-[#F3F4F6] transition-colors rounded-lg select-none"
                          onClick={() => toggleSort('status')}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center gap-1.5">
                                Статус
                                {renderSortIndicator('status')}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#111827] text-white p-2 rounded-lg">
                              <p className="text-sm">
                                {sortBy === 'status' && sortOrder === 'asc' 
                                  ? '↑ LIVE → Очікуються → Завершені' 
                                  : sortBy === 'status' && sortOrder === 'desc'
                                  ? '↓ Завершені → Очікуються → LIVE'
                                  : 'Натисніть для сортування за статусом'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-center py-4 px-4 text-sm font-medium text-[#6B7280] uppercase tracking-wider">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">Прогноз</span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#111827] text-white p-2 rounded-lg">
                              <p className="text-sm">Відсоток прогнозу перемоги кожної команди</p>
                            </TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-center py-4 px-4 text-sm font-medium text-[#6B7280] uppercase tracking-wider">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">Коеф.</span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#111827] text-white p-2 rounded-lg">
                              <p className="text-sm">Букмекерські коефіцієнти на перемогу</p>
                            </TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-center py-4 px-5 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Позиції</th>
                        <th className="text-left py-4 px-5 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Турнір</th>
                        <th className="text-center py-4 px-4 text-sm font-medium text-[#6B7280] uppercase tracking-wider">AI</th>
                        <th className="text-center py-4 px-4 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Нотатки</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedMatches.map((match) => {
                        const formInfo = getFormStabilityInfo(match.formStability);
                        const riskComments = getMatchRiskComments(match.team1, match.team2);
                        const isFinished = match.matchStatus === 'finished';
                        const isLive = match.matchStatus === 'live';

                        const hasPrediction = (match.predictionPercentTeam1 != null && match.predictionPercentTeam2 != null) &&
                          ((match.predictionPercentTeam1 ?? 0) > 0 || (match.predictionPercentTeam2 ?? 0) > 0);
                        const hasCoeffs = (match.bettingCoefficientTeam1 != null && match.bettingCoefficientTeam2 != null) &&
                          ((match.bettingCoefficientTeam1 ?? 0) > 0 || (match.bettingCoefficientTeam2 ?? 0) > 0);

                        return (
                          <tr 
                            key={match.id} 
                            className={`border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors ${
                              isFinished ? 'opacity-60' : ''
                            } ${isLive ? 'bg-red-50/30' : ''}`}
                          >
                            {/* Match with logos */}
                            <td className="py-4 px-5">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <TeamLogo src={match.logoTeam1} teamName={match.team1} size={20} />
                                    <span className="font-medium text-[#111827] text-sm">{match.team1}</span>
                                  </div>
                                  <span className="text-[#9CA3AF] text-xs">vs</span>
                                  <div className="flex items-center gap-1.5">
                                    <TeamLogo src={match.logoTeam2} teamName={match.team2} size={20} />
                                    <span className="font-medium text-[#111827] text-sm">{match.team2}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Badge className="bg-[#F3F4F6] text-[#374151] border-0 rounded-lg px-2 py-0.5 text-xs font-medium">
                                    {match.matchType}
                                  </Badge>
                                  <Badge className="bg-[#111827] text-white border-0 rounded-lg px-2 py-0.5 text-xs font-medium uppercase">
                                    {match.tier}
                                  </Badge>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge className={`${formInfo.color} px-2 py-0.5 text-xs font-medium inline-flex items-center gap-1`}>
                                        {formInfo.icon}
                                        {formInfo.label}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs bg-[#111827] text-white p-3 rounded-xl">
                                      <p className="text-sm">{formInfo.tooltip}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </td>

                            {/* Time */}
                            <td className="py-4 px-5 text-center">
                              <div className="text-sm font-medium text-[#111827]">{formatTime(match.date)}</div>
                              <div className="text-xs text-[#9CA3AF]">{formatDate(match.date)}</div>
                            </td>

                            {/* Score */}
                            <td className="py-4 px-5 text-center">
                              {(match.score1 !== undefined && match.score2 !== undefined && (match.score1 > 0 || match.score2 > 0 || isLive || isFinished)) ? (
                                <div className="flex items-center justify-center gap-1">
                                  <span className={`text-lg font-bold ${
                                    isFinished && match.score1 > match.score2 ? 'text-[#22C55E]' : 
                                    isFinished && match.score1 < match.score2 ? 'text-[#EF4444]' : 
                                    'text-[#111827]'
                                  }`}>
                                    {match.score1}
                                  </span>
                                  <span className="text-[#9CA3AF] text-sm mx-1">:</span>
                                  <span className={`text-lg font-bold ${
                                    isFinished && match.score2 > match.score1 ? 'text-[#22C55E]' : 
                                    isFinished && match.score2 < match.score1 ? 'text-[#EF4444]' : 
                                    'text-[#111827]'
                                  }`}>
                                    {match.score2}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[#D1D5DB] text-sm">—</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-4 px-5 text-center">
                              {getStatusBadge(match.matchStatus)}
                            </td>

                            {/* Prediction % */}
                            <td className="py-4 px-4 text-center">
                              {hasPrediction ? (
                                <PredictionBar
                                  percent1={match.predictionPercentTeam1 ?? 0}
                                  percent2={match.predictionPercentTeam2 ?? 0}
                                  team1={match.team1}
                                  team2={match.team2}
                                />
                              ) : (
                                <span className="text-[#D1D5DB] text-sm">—</span>
                              )}
                            </td>

                            {/* Betting Coefficients */}
                            <td className="py-4 px-4 text-center">
                              {hasCoeffs ? (
                                <div className="space-y-0.5">
                                  <div className="flex items-center justify-center gap-1.5 text-xs">
                                    <TeamLogo src={match.logoTeam1} teamName={match.team1} size={14} />
                                    <span className={`font-bold ${
                                      (match.bettingCoefficientTeam1 ?? 0) < (match.bettingCoefficientTeam2 ?? 0)
                                        ? 'text-[#22C55E]' : 'text-[#111827]'
                                    }`}>
                                      {formatCoeff(match.bettingCoefficientTeam1)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-center gap-1.5 text-xs">
                                    <TeamLogo src={match.logoTeam2} teamName={match.team2} size={14} />
                                    <span className={`font-bold ${
                                      (match.bettingCoefficientTeam2 ?? 0) < (match.bettingCoefficientTeam1 ?? 0)
                                        ? 'text-[#22C55E]' : 'text-[#111827]'
                                    }`}>
                                      {formatCoeff(match.bettingCoefficientTeam2)}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[#D1D5DB] text-sm">—</span>
                              )}
                            </td>

                            {/* Positions */}
                            <td className="py-4 px-5 text-center">
                              <div className="space-y-1">
                                <div className="text-xs text-[#6B7280]">
                                  {match.team1}: <span className="font-semibold text-[#111827]">#{match.positionTeam1 ?? '—'}</span>
                                </div>
                                <div className="text-xs text-[#6B7280]">
                                  {match.team2}: <span className="font-semibold text-[#111827]">#{match.positionTeam2 ?? '—'}</span>
                                </div>
                              </div>
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
              )}
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