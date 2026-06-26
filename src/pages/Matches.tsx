import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Trophy,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpDown,
  Search,
  Loader2,
  Flame,
  Shield,
  AlertCircle,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Radio,
  ArrowUp,
  ArrowDown,
  PlusCircle,
  Layers,
  X,
  ChevronDown
} from 'lucide-react';
import { CARD_BASE_STYLE, CARD_HOVER_STYLE, CHART_CARD_SHADOW } from '@/lib/cardStyles';
import { logRender } from '@/lib/devLogger';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from '@/components/PageHeader';
import AIRecommendationModal from '@/components/AIRecommendationModal';
import CommentModal from '@/components/CommentModal';
import { MatchesLoadingState, MatchesEmptyState } from '@/components/matches/MatchStates';
import MatchRow from '@/components/matches/MatchRow';
import { deepSeekService, type AIRecommendation } from '@/lib/deepSeekService';
import {
  fetchTodaysAndUpcomingMatches,
  parseMatchType,
  parseMatchContext,
  determineTier,
  determineFavorite,
  getMatchStatus,
  buildHltvUrl,
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
  stars?: number;
}

type MatchRating = 'like' | 'dislike' | null;

/** Load match ratings from localStorage */
const loadMatchRatings = (): Record<string, MatchRating> => {
  try {
    const saved = localStorage.getItem('match_ratings');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading match ratings:', e);
  }
  return {};
};

/** Save match ratings to localStorage */
const saveMatchRatings = (ratings: Record<string, MatchRating>) => {
  try {
    localStorage.setItem('match_ratings', JSON.stringify(ratings));
  } catch (e) {
    console.error('Error saving match ratings:', e);
  }
};

function apiMatchToMatch(apiMatch: ApiMatch): Match {
  const matchType = parseMatchType(apiMatch.type);
  const context = parseMatchContext(apiMatch.type, apiMatch.link);
  const tier = determineTier(apiMatch.positionTeam1, apiMatch.positionTeam2);
  const favorite = determineFavorite(
    apiMatch.nameTeam1, apiMatch.nameTeam2,
    apiMatch.positionTeam1, apiMatch.positionTeam2
  );
  const status = getMatchStatus(apiMatch);

  const pos1 = apiMatch.positionTeam1 ?? 150;
  const pos2 = apiMatch.positionTeam2 ?? 150;
  const posDiff = Math.abs(pos1 - pos2);

  const pred1 = apiMatch.predictionPercentTeam1;
  const pred2 = apiMatch.predictionPercentTeam2;
  const hasPrediction = pred1 != null && pred2 != null && (pred1 > 0 || pred2 > 0);
  const baseConfidence = hasPrediction
    ? Math.round(Math.max(pred1 ?? 0, pred2 ?? 0))
    : Math.min(85, 55 + Math.floor(posDiff * 0.3));
  
  const risk = Math.max(10, 100 - baseConfidence - Math.floor(Math.random() * 10));

  const winRate = hasPrediction
    ? Math.round(Math.max(pred1 ?? 0, pred2 ?? 0))
    : Math.min(80, Math.max(50, 50 + Math.floor(posDiff * 0.25)));

  const coeff1 = apiMatch.bettingCoefficientTeam1;
  const coeff2 = apiMatch.bettingCoefficientTeam2;
  const hasCoeffs = coeff1 != null && coeff2 != null && (coeff1 > 0 || coeff2 > 0);

  let formStability: FormStability = 'stable';
  const now = new Date();
  const team1Change = apiMatch.lastChangeDateTeam1 ? new Date(apiMatch.lastChangeDateTeam1) : null;
  const team2Change = apiMatch.lastChangeDateTeam2 ? new Date(apiMatch.lastChangeDateTeam2) : null;
  
  const favChange = favorite === apiMatch.nameTeam1 ? team1Change : team2Change;
  if (favChange) {
    const daysSinceChange = Math.floor((now.getTime() - favChange.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceChange <= 14) formStability = 'inconsistent';
    else if (daysSinceChange <= 30) formStability = 'momentum';
  }

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
    url: buildHltvUrl(apiMatch.link),
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
    stars: apiMatch.stars,
  };
}

const getFormStabilityInfo = (form: FormStability) => {
  switch (form) {
    case 'hot_streak':
      return {
        icon: <Flame className="h-3.5 w-3.5" strokeWidth={1.5} />,
        label: 'Серія перемог',
        color: 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-0',
        tooltip: '🔥 Команда у топ-формі з серією перемог. Висока ймовірність продовження успішної гри.'
      };
    case 'stable':
      return {
        icon: <Shield className="h-3.5 w-3.5" strokeWidth={1.5} />,
        label: 'Стабільна',
        color: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0',
        tooltip: '🛡️ Стабільна форма з передбачуваними результатами. Надійний вибір для ставок.'
      };
    case 'momentum':
      return {
        icon: <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} />,
        label: 'На підйомі',
        color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0',
        tooltip: '📈 Команда набирає темп і покращує результати. Позитивна динаміка.'
      };
    case 'falling':
      return {
        icon: <TrendingDown className="h-3.5 w-3.5" strokeWidth={1.5} />,
        label: 'Спад',
        color: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white border-0',
        tooltip: '📉 Команда втрачає форму з погіршенням результатів. Обережно зі ставками.'
      };
    case 'slump':
      return {
        icon: <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.5} />,
        label: 'Криза',
        color: 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0',
        tooltip: '⚠️ Команда у кризі з серією поразок. Високий ризик для ставок.'
      };
    case 'inconsistent':
      return {
        icon: <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.5} />,
        label: 'Нестабільна',
        color: 'bg-gradient-to-r from-gray-400 to-gray-600 text-white border-0',
        tooltip: '⚡ Непередбачувана форма зі змінними результатами. Складно прогнозувати.'
      };
  }
};

const getStatusBadge = (status?: 'upcoming' | 'live' | 'finished') => {
  switch (status) {
    case 'live':
      return (
        <Badge className="bg-red-500/10 text-red-600 border-red-200 rounded-lg px-2.5 py-1 text-sm font-medium inline-flex items-center gap-1.5 animate-pulse">
          <Radio className="h-3.5 w-3.5" strokeWidth={2} />
          LIVE
        </Badge>
      );
    case 'finished':
      return (
        <Badge className="bg-gray-100 text-gray-600 border-gray-200 rounded-lg px-2.5 py-1 text-sm font-medium inline-flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
          Завершено
        </Badge>
      );
    case 'upcoming':
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200 rounded-lg px-2.5 py-1 text-sm font-medium inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" strokeWidth={2} />
          Очікується
        </Badge>
      );
    default:
      return null;
  }
};

const getStatusPriority = (status?: 'upcoming' | 'live' | 'finished'): number => {
  switch (status) {
    case 'live': return 0;
    case 'upcoming': return 1;
    case 'finished': return 2;
    default: return 3;
  }
};

/** Team logo component */
const TeamLogo = ({ src, teamName, size = 26 }: { src?: string | null; teamName: string; size?: number }) => {
  if (!src) {
    return (
      <div 
        className="flex items-center justify-center rounded-md bg-[#F3F4F6] text-[#374151] font-bold text-xs flex-shrink-0"
        style={{ width: size, height: size, minWidth: size }}
      >
        {teamName.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, minWidth: size }}
    >
      <img
        src={src}
        alt={teamName}
        className="w-full h-full object-contain"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.className = 'flex items-center justify-center w-full h-full rounded-md bg-[#F3F4F6] text-[#374151] font-bold text-xs';
          fallback.textContent = teamName.charAt(0).toUpperCase();
          target.parentNode?.appendChild(fallback);
        }}
      />
    </div>
  );
};

/** Prediction bar component — HLTV prediction + optional AI prediction */
const PredictionBar = ({ percent1, percent2, team1, team2, aiPrediction }: {
  percent1: number; percent2: number; team1: string; team2: string;
  aiPrediction?: AIRecommendation | null;
}) => {
  const total = percent1 + percent2;
  const w1 = total > 0 ? Math.round((percent1 / total) * 100) : 50;
  const w2 = total > 0 ? (100 - w1) : 50;
  const isTeam1Favored = percent1 >= percent2;
  const hasHltv = total > 0;

  // AI gives: predicted team + confidence%. The opponent gets 100 - confidence.
  const aiPredictedTeam1 = aiPrediction?.prediction === team1;
  const aiPredictedTeam2 = aiPrediction?.prediction === team2;
  const aiConf = aiPrediction?.confidence ?? 0;
  const aiTeam1Conf = aiPredictedTeam1 ? aiConf : aiPredictedTeam2 ? 100 - aiConf : 0;
  const aiTeam2Conf = aiPredictedTeam2 ? aiConf : aiPredictedTeam1 ? 100 - aiConf : 0;
  const hasAi = aiPrediction && (aiPredictedTeam1 || aiPredictedTeam2);

  return (
    <div className="space-y-1.5 min-w-[150px]">
      {/* HLTV prediction row */}
      {hasHltv && (
        <>
          <div className="flex items-center justify-between text-xs">
            <span className={isTeam1Favored ? 'font-bold text-[#111827]' : 'text-[#4B5563]'}>{percent1}%</span>
            <span className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
              <TrendingUp className="h-3 w-3" strokeWidth={1.5} />
              HLTV
            </span>
            <span className={!isTeam1Favored ? 'font-bold text-[#111827]' : 'text-[#4B5563]'}>{percent2}%</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-[#E5E7EB]">
            <div 
              className={`transition-all duration-300 ${isTeam1Favored ? 'bg-[#22C55E]' : 'bg-[#3B82F6]'}`}
              style={{ width: `${w1}%` }}
            />
            <div 
              className={`transition-all duration-300 ${!isTeam1Favored ? 'bg-[#22C55E]' : 'bg-[#3B82F6]'}`}
              style={{ width: `${w2}%` }}
            />
          </div>
        </>
      )}
      {/* AI prediction row — shown only when AI data available */}
      {hasAi && (
        <>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className={aiTeam1Conf > aiTeam2Conf ? 'font-bold text-[#7C3AED]' : 'text-[#4B5563]'}>
              {aiTeam1Conf}%
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
              <Brain className="h-3 w-3 text-[#9CA3AF]" strokeWidth={1.5} />
              AI
            </span>
            <span className={aiTeam2Conf > aiTeam1Conf ? 'font-bold text-[#7C3AED]' : 'text-[#4B5563]'}>
              {aiTeam2Conf}%
            </span>
          </div>
          <div className="flex h-1.5 rounded-full overflow-hidden bg-[#F3F4F6]">
            <div className="bg-[#A78BFA] transition-all duration-300" style={{ width: `${aiTeam1Conf}%` }} />
            <div className="bg-[#C4B5FD] transition-all duration-300" style={{ width: `${aiTeam2Conf}%` }} />
          </div>
        </>
      )}
    </div>
  );
};

const cardBaseStyle = CARD_BASE_STYLE;

const cardHoverStyle = CARD_HOVER_STYLE;

/** Column divider style — right border */
const colDivider = 'border-r border-[#E5E7EB]';

/** Get Ukrainian day of week short name */
const getDayOfWeek = (date: Date): string => {
  const days = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return days[date.getDay()];
};

/** Format date key for grouping: "YYYY-MM-DD" */
const getDateKey = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
};

/** Format full date title: "Counter-Strike matches (Четвер, 18.06.2026)" */
const formatFullDateTitle = (dateKey: string): string => {
  const d = new Date(dateKey + 'T12:00:00');
  const dayNames = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];
  const dayFull = dayNames[d.getDay()];
  const formatted = d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `Counter-Strike matches (${dayFull}, ${formatted})`;
};

/** Get today's date key in YYYY-MM-DD format */
const getTodayDateKey = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function Matches() {
  logRender('Matches');
  const { user } = useAuth();
  const currentUser = user?.username || '';
  const navigate = useNavigate();

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
  const { theme, toggleTheme } = useTheme();
  const isDarkTheme = theme === 'dark';
  
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  // Store AI predictions per match ID so they persist in the table
  const [aiPredictions, setAiPredictions] = useState<Record<string, AIRecommendation>>({});
  
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedCommentMatch, setSelectedCommentMatch] = useState<Match | null>(null);
  
  const [riskyTeams, setRiskyTeams] = useState<RiskyTeam[]>([]);

  // Match ratings state
  const [matchRatings, setMatchRatings] = useState<Record<string, MatchRating>>(loadMatchRatings);

  // Multi-select for Express
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set());

  // Reset all filters
  const resetAllFilters = () => {
    setFilterStatus('all');
    setFilterTier('all');
    setFilterMatchType('all');
    setFilterConfidence('all');
    setFilterRisk('all');
    setShowHotMatches(false);
    setSearchQuery('');
  };

  // Check if any filter is active
  const hasActiveFilters = filterStatus !== 'all' || filterTier !== 'all' || filterMatchType !== 'all' || filterConfidence !== 'all' || filterRisk !== 'all' || showHotMatches || searchQuery !== '';

  useEffect(() => {
    loadMatchesFromApi();
    loadRiskyTeams();
  }, []);

  const handleRateMatch = (matchId: string, rating: MatchRating) => {
    setMatchRatings(prev => {
      const current = prev[matchId];
      const newRating = current === rating ? null : rating;
      const updated = { ...prev, [matchId]: newRating };
      saveMatchRatings(updated);
      return updated;
    });
  };

  const handleAddToBets = (match: Match) => {
    navigate('/app/my-bets', {
      state: {
        prefillMatch: {
          team1: match.team1,
          team2: match.team2,
          tournament: match.context,
          format: match.matchType,
          date: match.date,
          matchUrl: match.url || '',
          logoTeam1: match.logoTeam1,
          logoTeam2: match.logoTeam2,
        }
      }
    });
  };

  // Toggle match selection for Express
  const toggleMatchSelection = (matchId: string) => {
    setSelectedMatchIds(prev => {
      const next = new Set(prev);
      if (next.has(matchId)) {
        next.delete(matchId);
      } else {
        if (next.size >= 10) {
          toast.error('⚠️ Максимум 10 матчів', {
            description: 'В експресі може бути не більше 10 подій'
          });
          return prev;
        }
        next.add(matchId);
      }
      return next;
    });
  };

  // Clear all selected matches
  const clearSelectedMatches = () => {
    setSelectedMatchIds(new Set());
  };

  // Navigate to MyBets with selected matches for Express
  const handleCreateExpress = () => {
    const selectedMatches = matches.filter(m => selectedMatchIds.has(m.id));
    if (selectedMatches.length < 2) {
      toast.error('⚠️ Мінімум 2 матчі', {
        description: 'Для створення експресу потрібно обрати щонайменше 2 матчі'
      });
      return;
    }

    const expressMatches = selectedMatches.map(m => ({
      team1: m.team1,
      team2: m.team2,
      tournament: m.context,
      format: m.matchType,
      date: m.date,
      matchUrl: m.url || '',
      logoTeam1: m.logoTeam1,
      logoTeam2: m.logoTeam2,
    }));

    navigate('/app/my-bets', {
      state: {
        expressMatches
      }
    });
  };

  const loadMatchesFromApi = async () => {
    try {
      const apiMatches = await fetchTodaysAndUpcomingMatches();
      if (apiMatches && apiMatches.length > 0) {
        const converted = apiMatches.map(apiMatchToMatch);
        setMatches(converted);
      }
    } catch (error) {
      console.error('Error loading matches from API:', error);
      toast.error('⚠️ Помилка завантаження', {
        description: 'Не вдалося завантажити матчі з API'
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

    // Check cache first
    const cached = aiPredictions[match.id];
    if (cached) {
      setAiRecommendation(cached);
      setAiModalOpen(true);
      return;
    }

    setAiModalOpen(true);
    setAiLoading(true);
    setAiRecommendation(null);
    try {
      const recommendation = await deepSeekService.getMatchRecommendation({
        team1: match.team1,
        team2: match.team2,
        format: match.matchType,
        tier: match.tier.toUpperCase(),
        odds: match.odds
      });
      setAiRecommendation(recommendation);
      // Cache for table display
      setAiPredictions(prev => ({ ...prev, [match.id]: recommendation }));
    } catch (error) {
      console.error('Error getting AI recommendation:', error);
      toast.error('❌ Помилка', { description: 'Не вдалося отримати AI рекомендацію' });
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
    if (filterStatus !== 'all' && match.matchStatus !== filterStatus) return false;
    if (showHotMatches && (match.aiConfidence <= 70 || match.upsetProbability >= 20)) return false;
    if (searchQuery && !match.team1.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !match.team2.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Sort matches
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'date': comparison = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
      case 'confidence': comparison = b.aiConfidence - a.aiConfidence; break;
      case 'risk': comparison = a.risk - b.risk; break;
      case 'upset': comparison = b.upsetProbability - a.upsetProbability; break;
      case 'status': {
        const statusDiff = getStatusPriority(a.matchStatus) - getStatusPriority(b.matchStatus);
        if (statusDiff !== 0) {
          comparison = statusDiff;
        } else {
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        break;
      }
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Group matches by date. Show today + future by default, but if ALL matches are in the past, still show them.
  const todayKey = getTodayDateKey();
  const groupedByDate: Record<string, Match[]> = {};
  sortedMatches.forEach(match => {
    const key = getDateKey(match.date);
    if (!groupedByDate[key]) groupedByDate[key] = [];
    groupedByDate[key].push(match);
  });
  // Only filter out past days if there are today/future matches to show
  const futureDateKeys = Object.keys(groupedByDate).filter(k => k >= todayKey).sort();
  const sortedDateKeys = futureDateKeys.length > 0 ? futureDateKeys : Object.keys(groupedByDate).sort();

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    if (hours === 0 && minutes === 0) return 'TBD';
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  };

  // Displayed matches — only those actually shown on screen (today+future, or all if only past)
  const displayedMatches = sortedDateKeys.flatMap(k => groupedByDate[k] || []);
  const displayCount = displayedMatches.length;
  const liveCount = displayedMatches.filter(m => m.matchStatus === 'live').length;
  const upcomingCount = displayedMatches.filter(m => m.matchStatus === 'upcoming').length;
  const finishedCount = displayedMatches.filter(m => m.matchStatus === 'finished').length;

  const toggleSort = (column: 'date' | 'confidence' | 'risk' | 'upset' | 'status') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
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
      toast('🔄 Завантаження матчів...', { description: 'Оновлення з API' });
      const apiMatches = await fetchTodaysAndUpcomingMatches();
      if (apiMatches && apiMatches.length > 0) {
        const converted = apiMatches.map(apiMatchToMatch);
        setMatches(converted);
        toast.success('✅ Матчі оновлено!', { description: `Завантажено ${converted.length} матчів` });
      } else {
        toast.warning('⚠️ Матчі не знайдено', { description: 'API повернув порожній результат' });
      }
    } catch (error) {
      toast.error('❌ Помилка завантаження', { description: `${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsLoading(false);
    }
  };

  const avgConfidence = displayCount > 0 
    ? Math.round(displayedMatches.reduce((sum, m) => sum + m.aiConfidence, 0) / displayCount)
    : 0;

  const renderSortIndicator = (column: 'date' | 'confidence' | 'risk' | 'upset' | 'status') => {
    if (sortBy === column) {
      return sortOrder === 'asc' 
        ? <ArrowUp className="h-3.5 w-3.5 text-[#2563EB]" strokeWidth={2} />
        : <ArrowDown className="h-3.5 w-3.5 text-[#2563EB]" strokeWidth={2} />;
    }
    return <ArrowUpDown className="h-3.5 w-3.5 text-[#9CA3AF]" strokeWidth={1.5} />;
  };

  const formatCoeff = (coeff: number | null | undefined): string => {
    if (coeff == null || coeff === 0) return '—';
    return coeff.toFixed(2);
  };

  /** Get the visual style for the match row based on rating */
  const getRowRatingStyle = (matchId: string): string => {
    const rating = matchRatings[matchId];
    if (rating === 'like') return 'bg-[#F0FDF4]/60 border-l-4 border-l-[#22C55E]';
    if (rating === 'dislike') return 'bg-[#FEF2F2]/60 border-l-4 border-l-[#EF4444]';
    return 'border-l-4 border-l-transparent';
  };

  /** Render a single match row */
  const renderMatchRow = (match: Match) => (
    <MatchRow
      key={match.id}
      match={match}
      matchRatings={matchRatings}
      aiPredictions={aiPredictions}
      isSelected={selectedMatchIds.has(match.id)}
      currentRating={matchRatings[match.id] || null}
      colDivider={colDivider}
      onRate={handleRateMatch}
      onAIRecommend={handleGetAIRecommendation}
      onShowComment={handleShowComment}
      onAddToBets={handleAddToBets}
      onToggleSelect={toggleMatchSelection}
      hasRiskyTeam={!!getMatchRiskComments(match.team1, match.team2)}
    />
  );

  /** Render the table header row */
  const renderTableHeader = () => (
    <thead>
      <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
        <th className={`text-center py-4 px-3 text-sm font-semibold text-[#374151] uppercase tracking-wider whitespace-nowrap ${colDivider}`}>
          Інтерес до Матчу
        </th>
        <th className={`text-left py-4 px-4 text-sm font-semibold text-[#374151] uppercase tracking-wider ${colDivider}`}>Матч</th>
        <th 
          className={`text-center py-4 px-3 text-sm font-semibold text-[#374151] uppercase tracking-wider cursor-pointer hover:bg-[#F3F4F6] transition-colors select-none whitespace-nowrap ${colDivider}`}
          onClick={() => toggleSort('date')}
        >
          <div className="flex items-center justify-center gap-0.5">
            Час
            {renderSortIndicator('date')}
          </div>
        </th>
        <th className={`text-center py-4 px-3 text-sm font-semibold text-[#374151] uppercase tracking-wider ${colDivider}`}>Рахунок</th>
        <th 
          className={`text-center py-4 px-3 text-sm font-semibold text-[#374151] uppercase tracking-wider cursor-pointer hover:bg-[#F3F4F6] transition-colors select-none whitespace-nowrap ${colDivider}`}
          onClick={() => toggleSort('status')}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center gap-0.5">
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
                  : 'Сортування за статусом'}
              </p>
            </TooltipContent>
          </Tooltip>
        </th>
        <th className={`text-center py-4 px-3 text-sm font-semibold text-[#374151] uppercase tracking-wider ${colDivider}`}>AI</th>
        <th className={`text-center py-4 px-3 text-sm font-semibold text-[#374151] uppercase tracking-wider ${colDivider}`}>Прогноз</th>
        <th className={`text-center py-4 px-3 text-sm font-semibold text-[#374151] uppercase tracking-wider ${colDivider}`}>Коеф.</th>
        <th className={`text-center py-4 px-3 text-sm font-semibold text-[#374151] uppercase tracking-wider whitespace-nowrap ${colDivider}`}>Нотатки</th>
        <th className="text-center py-4 px-3 text-sm font-semibold text-[#374151] uppercase tracking-wider whitespace-nowrap">
          Додати до Записів
        </th>
      </tr>
    </thead>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#f3f3f3] relative flex flex-col">
        {/* ===== HEADER ===== */}
        <PageHeader
          title="Матчі"
          currentUser={currentUser || 'User'}
          isDarkTheme={isDarkTheme}
          onToggleTheme={toggleTheme}
          showThemeToggle={false}
        />
        <div className="relative z-10 space-y-6 px-6 lg:px-8 pb-8 pt-4 flex flex-col flex-1 min-h-0">

          {/* ===== QUICK STATS ===== */}
          <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div 
              className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5 group"
              style={cardBaseStyle}
              onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
              onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF]">
                  <Trophy className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
                </div>
                <span className="text-lg font-semibold text-[#111827]">Всього матчів</span>
              </div>
              <div className="text-4xl font-bold text-[#111827] tracking-tight mb-2">{displayCount}</div>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} />
                <span className="text-sm text-[#4B5563]">на сьогодні</span>
              </div>
            </div>

            <div 
              className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5 group"
              style={cardBaseStyle}
              onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
              onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF]">
                  <Radio className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
                </div>
                <span className="text-lg font-semibold text-[#111827]">LIVE</span>
              </div>
              <div className="text-4xl font-bold text-[#EF4444] tracking-tight mb-2">{liveCount}</div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#4B5563]">зараз грають</span>
              </div>
            </div>

            <div 
              className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5 group"
              style={cardBaseStyle}
              onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
              onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF]">
                  <Clock className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
                </div>
                <span className="text-lg font-semibold text-[#111827]">Очікуються</span>
              </div>
              <div className="text-4xl font-bold text-[#2563EB] tracking-tight mb-2">{upcomingCount}</div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#4B5563]">ще не почались</span>
              </div>
            </div>

            <div 
              className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5 group"
              style={cardBaseStyle}
              onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
              onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF]">
                  <CheckCircle2 className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
                </div>
                <span className="text-lg font-semibold text-[#111827]">Завершені</span>
              </div>
              <div className="text-4xl font-bold text-[#22C55E] tracking-tight mb-2">{finishedCount}</div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#4B5563]">зіграні матчі</span>
              </div>
            </div>

            <div 
              className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5 group"
              style={cardBaseStyle}
              onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
              onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF]">
                  <Brain className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
                </div>
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
          </div>

          {/* ===== PILL FILTER BAR — Analytics-style ===== */}
          <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-4 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2.5 flex-wrap justify-between">
              {/* Refresh button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={refreshMatches}
                    disabled={isLoading}
                    className="rounded-[24px] bg-[#111827] hover:bg-[#1F2937] text-white font-medium h-11 px-5 transition-all duration-300 text-sm inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                    ) : (
                      <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
                    )}
                    Оновити
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-[#111827] text-white p-2 rounded-lg">
                  <p className="text-sm">Оновити матчі з API</p>
                </TooltipContent>
              </Tooltip>

              {/* Search */}
              <div className="relative flex-1 min-w-[140px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" strokeWidth={1.5} />
                <Input
                  placeholder="Пошук..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-3 rounded-[24px] border border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#111827] transition-colors h-11 w-full text-sm bg-white/80"
                />
              </div>


              {/* Status filter — pill dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`rounded-[24px] px-5 h-11 font-medium text-sm transition-all duration-300 ease-in-out inline-flex items-center gap-2 ${
                    filterStatus !== 'all'
                      ? 'bg-white text-[#111827] font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-[#111827]'
                      : 'bg-white text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB] hover:border-[#D1D5DB] shadow-sm'
                  }`}>
                    <Radio className="h-4 w-4" strokeWidth={1.5} />
                    {filterStatus === 'all' ? 'Статус' : filterStatus === 'live' ? '🔴 LIVE' : filterStatus === 'upcoming' ? 'Очікуються' : 'Завершені'}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" strokeWidth={2} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl p-1">
                  <DropdownMenuItem onClick={() => setFilterStatus('all')} className="rounded-lg">Всі статуси</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('live')} className="rounded-lg">🔴 LIVE</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('upcoming')} className="rounded-lg">🕐 Очікуються</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('finished')} className="rounded-lg">✅ Завершені</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Tier filter — pill dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`rounded-[24px] px-5 h-11 font-medium text-sm transition-all duration-300 ease-in-out inline-flex items-center gap-2 ${
                    filterTier !== 'all'
                      ? 'bg-white text-[#111827] font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-[#111827]'
                      : 'bg-white text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB] hover:border-[#D1D5DB] shadow-sm'
                  }`}>
                    <Trophy className="h-4 w-4" strokeWidth={1.5} />
                    {filterTier === 'all' ? 'Tier' : filterTier === 'tier1' ? 'Tier 1' : filterTier === 'tier2' ? 'Tier 2' : 'Tier 3'}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" strokeWidth={2} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl p-1">
                  <DropdownMenuItem onClick={() => setFilterTier('all')} className="rounded-lg">Всі Tier</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterTier('tier1')} className="rounded-lg">Tier 1</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterTier('tier2')} className="rounded-lg">Tier 2</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterTier('tier3')} className="rounded-lg">Tier 3</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Format filter — pill dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`rounded-[24px] px-5 h-11 font-medium text-sm transition-all duration-300 ease-in-out inline-flex items-center gap-2 ${
                    filterMatchType !== 'all'
                      ? 'bg-white text-[#111827] font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-[#111827]'
                      : 'bg-white text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB] hover:border-[#D1D5DB] shadow-sm'
                  }`}>
                    <Layers className="h-4 w-4" strokeWidth={1.5} />
                    {filterMatchType === 'all' ? 'Формат' : filterMatchType}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" strokeWidth={2} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl p-1">
                  <DropdownMenuItem onClick={() => setFilterMatchType('all')} className="rounded-lg">Всі формати</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterMatchType('Bo1')} className="rounded-lg">Bo1</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterMatchType('Bo3')} className="rounded-lg">Bo3</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterMatchType('Bo5')} className="rounded-lg">Bo5</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Confidence filter — pill dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`rounded-[24px] px-5 h-11 font-medium text-sm transition-all duration-300 ease-in-out inline-flex items-center gap-2 ${
                    filterConfidence !== 'all'
                      ? 'bg-white text-[#111827] font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-[#111827]'
                      : 'bg-white text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB] hover:border-[#D1D5DB] shadow-sm'
                  }`}>
                    <Brain className="h-4 w-4" strokeWidth={1.5} />
                    {filterConfidence === 'all' ? 'Впевненість' : filterConfidence === 'high' ? 'Висока' : filterConfidence === 'medium' ? 'Середня' : 'Низька'}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" strokeWidth={2} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl p-1">
                  <DropdownMenuItem onClick={() => setFilterConfidence('all')} className="rounded-lg">Всі рівні</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterConfidence('high')} className="rounded-lg">Висока (&gt;80%)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterConfidence('medium')} className="rounded-lg">Середня (60-80%)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterConfidence('low')} className="rounded-lg">Низька (&lt;60%)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Risk filter — pill dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`rounded-[24px] px-5 h-11 font-medium text-sm transition-all duration-300 ease-in-out inline-flex items-center gap-2 ${
                    filterRisk !== 'all'
                      ? 'bg-white text-[#111827] font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-[#111827]'
                      : 'bg-white text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB] hover:border-[#D1D5DB] shadow-sm'
                  }`}>
                    <Shield className="h-4 w-4" strokeWidth={1.5} />
                    {filterRisk === 'all' ? 'Ризик' : filterRisk === 'safe' ? 'Низький' : filterRisk === 'moderate' ? 'Помірний' : 'Високий'}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" strokeWidth={2} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl p-1">
                  <DropdownMenuItem onClick={() => setFilterRisk('all')} className="rounded-lg">Всі рівні</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterRisk('safe')} className="rounded-lg">Низький</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterRisk('moderate')} className="rounded-lg">Помірний</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterRisk('high')} className="rounded-lg">Високий</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Hot matches toggle — pill button */}
              <button
                onClick={() => setShowHotMatches(!showHotMatches)}
                className={`
                  rounded-[24px] px-5 h-11 font-medium text-sm
                  transition-all duration-300 ease-in-out
                  inline-flex items-center gap-2
                  ${showHotMatches
                    ? 'bg-white text-[#111827] font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-[#111827]'
                    : 'bg-white text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB] hover:border-[#D1D5DB] shadow-sm'
                  }
                `}
              >
                <Flame className="h-4 w-4" strokeWidth={1.5} />
                Гарячі
              </button>

              {/* Reset filters */}
              {hasActiveFilters && (
                <>
                  <div className="w-px h-8 bg-[#D1D5DB]/60" />
                  <button
                    onClick={resetAllFilters}
                    className="rounded-[24px] px-4 h-11 font-medium text-sm text-[#6B7280] hover:text-[#111827] bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#D1D5DB] shadow-sm transition-all duration-300 inline-flex items-center gap-2"
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                    Скинути
                  </button>
                </>
              )}
            </div>
          </div>

                    {/* ===== LOADING STATE ===== */}
          {initialLoading && (
            <Card className="border-2 border-[#E8E6DC] rounded-[32px] bg-white/60 backdrop-blur-sm overflow-hidden flex-1 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <CardContent className="py-16 text-center">
                <MatchesLoadingState />
              </CardContent>
            </Card>
          )}

          {!initialLoading && sortedMatches.length === 0 && (
            <Card className="border-2 border-[#E8E6DC] rounded-[32px] bg-white/60 backdrop-blur-sm overflow-hidden flex-1 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <CardContent className="py-16 text-center">
                <MatchesEmptyState error={apiError || undefined} />
                <Button
                  onClick={refreshMatches}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#447afc] hover:bg-[#3568d4] text-white text-base font-semibold transition-colors mt-4"
                >
                  <RefreshCw className="h-4 w-4" strokeWidth={2} />
                  Спробувати знову
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ===== DATE GROUP CARDS — today and future dates ===== */}
          {!initialLoading && sortedDateKeys.map((dateKey) => {
            const dateMatches = groupedByDate[dateKey];
            return (
              <div 
                key={dateKey}
                className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden"
              >
                <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.10)]">
                <CardHeader className="bg-white rounded-t-[24px] border-b border-[#E5E7EB] px-6 py-5">
                  <CardTitle>
                    <div className="flex items-center gap-4">
                      <Calendar className="h-8 w-8 text-[#9CA3AF]" strokeWidth={1.5} />
                      <span className="text-2xl font-bold text-[#111827] tracking-tight">
                        {formatFullDateTitle(dateKey)}
                      </span>
                      <Badge className="bg-[#F3F4F6] text-[#6B7280] border-0 rounded-full px-4 py-1 text-base font-bold">
                        {dateMatches.length}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 rounded-b-[24px] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      {renderTableHeader()}
                      <tbody>
                        {dateMatches.map(renderMatchRow)}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                </div>
              </div>
            );
          })}

          <AIRecommendationModal
            open={aiModalOpen}
            onClose={() => setAiModalOpen(false)}
            matchInfo={selectedMatch ? `${selectedMatch.team1} vs ${selectedMatch.team2} (${selectedMatch.matchType}, ${selectedMatch.tier.toUpperCase()})` : ''}
            recommendation={aiRecommendation}
            isLoading={aiLoading}
          />

          <CommentModal
            open={commentModalOpen}
            onClose={() => setCommentModalOpen(false)}
            matchInfo={selectedCommentMatch ? `${selectedCommentMatch.team1} vs ${selectedCommentMatch.team2} (${selectedCommentMatch.matchType}, ${selectedCommentMatch.tier.toUpperCase()})` : ''}
            comment={selectedCommentMatch ? getMatchRiskComments(selectedCommentMatch.team1, selectedCommentMatch.team2) : ''}
          />
        </div>

        {/* ===== FLOATING EXPRESS BAR ===== */}
        {selectedMatchIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div 
              className="flex items-center gap-4 px-6 py-4 bg-[#111827] text-white rounded-2xl border border-[#374151]"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.15)' }}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="h-5 w-5 text-[#60A5FA]" strokeWidth={1.5} />
                <span className="text-base font-semibold">
                  Експрес: {selectedMatchIds.size} {selectedMatchIds.size === 1 ? 'матч' : selectedMatchIds.size >= 2 && selectedMatchIds.size <= 4 ? 'матчі' : 'матчів'}
                </span>
              </div>

              <div className="w-px h-8 bg-[#374151]" />

              <Button
                onClick={handleCreateExpress}
                disabled={selectedMatchIds.size < 2}
                className={`rounded-xl font-medium text-sm px-5 py-2.5 transition-all duration-200 ${
                  selectedMatchIds.size >= 2
                    ? 'bg-[#3B82F6] hover:bg-[#2563EB] text-white'
                    : 'bg-[#374151] text-[#6B7280] cursor-not-allowed'
                }`}
              >
                <PlusCircle className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Створити Експрес
              </Button>

              <button
                onClick={clearSelectedMatches}
                className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-[#374151] text-[#9CA3AF] hover:text-white transition-colors"
                title="Очистити вибір"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}