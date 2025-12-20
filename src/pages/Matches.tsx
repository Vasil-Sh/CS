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
  MousePointerClick
} from 'lucide-react';
import { fetchAndParseMatches, convertToMatchFormat, type MatchData } from '@/lib/parser/hltvParser';
import { useToast } from '@/hooks/use-toast';

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
    comment: 'Обидві команди нестабільні',
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
        label: 'Hot',
        color: 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-0'
      };
    case 'stable':
      return {
        icon: <Shield className="h-3.5 w-3.5" />,
        label: 'Stable',
        color: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0'
      };
    case 'momentum':
      return {
        icon: <TrendingUp className="h-3.5 w-3.5" />,
        label: 'Up',
        color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0'
      };
    case 'falling':
      return {
        icon: <TrendingDown className="h-3.5 w-3.5" />,
        label: 'Down',
        color: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white border-0'
      };
    case 'slump':
      return {
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        label: 'Slump',
        color: 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0'
      };
    case 'inconsistent':
      return {
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
        label: 'Mixed',
        color: 'bg-gradient-to-r from-gray-400 to-gray-600 text-white border-0'
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
  
  // Load risky teams from admin_risky_teams (global storage)
  const [riskyTeams, setRiskyTeams] = useState<RiskyTeam[]>([]);
  
  const [visibleComments, setVisibleComments] = useState<Set<string>>(new Set());
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

  const toggleCommentVisibility = (matchId: string) => {
    setVisibleComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(matchId)) {
        newSet.delete(matchId);
      } else {
        newSet.add(matchId);
      }
      return newSet;
    });
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
    
    return comments.length > 0 ? comments.join('\n') : '';
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
    <div className="space-y-8 p-6 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">Матчі</h1>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Filter className="h-5 w-5" />
            Фільтри та сортування
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Tier:</label>
              <Select value={filterTier} onValueChange={(value: 'all' | 'tier1' | 'tier2' | 'tier3') => setFilterTier(value)}>
                <SelectTrigger className="mt-1 rounded-xl">
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
              <label className="text-sm font-medium text-gray-700">AI Confidence:</label>
              <Select value={filterConfidence} onValueChange={(value: 'all' | 'high' | 'medium' | 'low') => setFilterConfidence(value)}>
                <SelectTrigger className="mt-1 rounded-xl">
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
              <label className="text-sm font-medium text-gray-700">Ризик:</label>
              <Select value={filterRisk} onValueChange={(value: 'all' | 'safe' | 'moderate' | 'high') => setFilterRisk(value)}>
                <SelectTrigger className="mt-1 rounded-xl">
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
              <label className="text-sm font-medium text-gray-700">Тип матчу:</label>
              <Select value={filterMatchType} onValueChange={(value: 'all' | 'Bo1' | 'Bo3' | 'Bo5') => setFilterMatchType(value)}>
                <SelectTrigger className="mt-1 rounded-xl">
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
              <label className="text-sm font-medium text-gray-700">Пошук:</label>
              <div className="relative mt-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Команда..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 rounded-xl"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Hot Match:</label>
              <Button
                variant={showHotMatches ? 'default' : 'outline'}
                className="w-full mt-1 rounded-xl"
                onClick={() => setShowHotMatches(!showHotMatches)}
              >
                {showHotMatches ? 'Увімкнено' : 'Вимкнено'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matches Table */}
      {sortedMatches.length > 0 ? (
        <Card className="border-0 shadow-2xl rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardHeader className="border-b border-gray-100 bg-white/80 backdrop-blur-xl">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2.5 bg-blue-50 rounded-2xl">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xl font-semibold text-gray-900 tracking-tight">{currentDate}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50/30 backdrop-blur-sm border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Матч</th>
                    <th className="text-left p-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Фаворит</th>
                    <th 
                      className="text-center p-4 text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100/50 rounded-xl transition-colors group"
                      onClick={() => toggleSort('confidence')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        AI %
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MousePointerClick className="h-3 w-3 text-blue-600" />
                        </div>
                      </div>
                    </th>
                    <th 
                      className="text-center p-4 text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100/50 rounded-xl transition-colors group"
                      onClick={() => toggleSort('risk')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Ризик
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MousePointerClick className="h-3 w-3 text-blue-600" />
                        </div>
                      </div>
                    </th>
                    <th className="text-left p-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Коефіцієнти</th>
                    <th className="text-center p-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Win Rate</th>
                    <th className="text-center p-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Form</th>
                    <th className="text-left p-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Турнір</th>
                    <th className="text-left p-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Коментар</th>
                    <th className="text-center p-4 text-xs font-bold text-gray-700 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMatches.map((match) => {
                    const formInfo = getFormStabilityInfo(match.formStability);
                    const riskInfo = getRiskBadge(match.risk);
                    const isHotMatch = match.aiConfidence > 70 && match.upsetProbability < 20;
                    const riskComments = getMatchRiskComments(match.team1, match.team2);
                    const isCommentVisible = visibleComments.has(match.id);
                    
                    return (
                      <tr 
                        key={match.id} 
                        className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 transition-all duration-200"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-bold text-gray-900 text-sm">
                                {match.team1} <span className="text-gray-400 font-normal">vs</span> {match.team2}
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Badge variant="secondary" className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border-0 font-semibold">
                                  {match.matchType}
                                </Badge>
                                <Badge variant="secondary" className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border-0 font-semibold">
                                  {match.tier.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-blue-700 text-sm">{match.favorite}</div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge 
                            className={`font-bold px-3.5 py-1.5 rounded-full border-0 text-sm cursor-pointer hover:scale-105 transition-transform ${
                              match.aiConfidence >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                              match.aiConfidence >= 60 ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 
                              'bg-gradient-to-r from-gray-400 to-gray-600 text-white'
                            }`}
                            title="Клікніть для сортування"
                          >
                            {match.aiConfidence}%
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2 cursor-pointer hover:scale-105 transition-transform" title="Клікніть для сортування">
                            <div className={`w-2.5 h-2.5 rounded-full ${riskInfo.dotColor} shadow-sm`} />
                            <span className="text-sm font-bold text-gray-900">{match.risk}%</span>
                          </div>
                          <div className="text-xs text-gray-600 mt-1 font-semibold">{riskInfo.label}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm space-y-1">
                            <div className="text-gray-700">{match.team1}: <span className="font-bold text-gray-900">{match.odds.team1}</span></div>
                            <div className="text-gray-700">{match.team2}: <span className="font-bold text-gray-900">{match.odds.team2}</span></div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {match.winRate >= 70 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <span className="font-bold text-gray-900 text-sm">{match.winRate}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge className={`${formInfo.color} flex items-center gap-1.5 justify-center px-3.5 py-1.5 rounded-full font-semibold text-sm shadow-sm`}>
                            {formInfo.icon}
                            {formInfo.label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-700 font-medium">{match.context}</div>
                          <div className="text-xs text-gray-500 mt-1">{match.comment}</div>
                        </td>
                        <td className="p-4">
                          {riskComments ? (
                            <div className="flex flex-col gap-2">
                              <div 
                                className={`text-xs text-gray-700 whitespace-pre-line max-w-xs transition-all duration-300 ${
                                  isCommentVisible ? '' : 'blur-sm select-none'
                                }`}
                              >
                                {riskComments}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCommentVisibility(match.id)}
                                className="h-7 px-3 text-xs flex items-center gap-1.5 self-start rounded-full font-semibold hover:bg-blue-100 transition-all hover:scale-105"
                              >
                                {isCommentVisible ? (
                                  <>
                                    <EyeOff className="h-3.5 w-3.5" />
                                    Приховати
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3.5 w-3.5" />
                                    Показати
                                  </>
                                )}
                              </Button>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">—</div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            {isHotMatch && (
                              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1.5 rounded-full border-0 font-semibold shadow-sm">
                                <Flame className="h-3.5 w-3.5 mr-1" />
                                Hot
                              </Badge>
                            )}
                            {match.url && (
                              <a 
                                href={match.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 transition-colors p-1.5 hover:bg-blue-50 rounded-lg"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
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
              <div className="p-4 bg-gray-50 rounded-3xl w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">Немає матчів за обраними фільтрами</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}