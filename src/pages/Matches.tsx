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
  ExternalLink
} from 'lucide-react';
import { fetchAndParseMatches, convertToMatchFormat, type MatchData } from '@/lib/parser/hltvParser';
import { useToast } from '@/hooks/use-toast';

// Form Stability Types
type FormStability = 'hot_streak' | 'stable' | 'momentum' | 'falling' | 'slump' | 'inconsistent';

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
    date: '2025-12-22',
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
    date: '2025-12-22',
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
        icon: '🔥',
        label: 'Hot Streak',
        description: '5W–0L — команда на піку форми',
        color: 'bg-red-100 text-red-800 border-red-200'
      };
    case 'stable':
      return {
        icon: '✅',
        label: 'Stable',
        description: '3W–2L — стабільно тримає рівень',
        color: 'bg-green-100 text-green-800 border-green-200'
      };
    case 'momentum':
      return {
        icon: '⚡',
        label: 'Momentum',
        description: '4W–1L — набирає темп',
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    case 'falling':
      return {
        icon: '⚠️',
        label: 'Falling',
        description: '1W–4L — втрачає форму',
        color: 'bg-orange-100 text-orange-800 border-orange-200'
      };
    case 'slump':
      return {
        icon: '📉',
        label: 'Slump',
        description: '0W–5L — глибокий спад',
        color: 'bg-red-100 text-red-800 border-red-200'
      };
    case 'inconsistent':
      return {
        icon: '🔄',
        label: 'Inconsistent',
        description: '2W–3L — нестабільна',
        color: 'bg-gray-100 text-gray-800 border-gray-200'
      };
  }
};

const getRiskColor = (risk: number) => {
  if (risk <= 30) return 'text-green-600';
  if (risk <= 50) return 'text-yellow-600';
  return 'text-red-600';
};

const getRiskLabel = (risk: number) => {
  if (risk <= 30) return 'Безпечний';
  if (risk <= 50) return 'Помірний';
  return 'Високий';
};

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>(mockMatches);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'risk' | 'upset'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterTier, setFilterTier] = useState<'all' | 'tier1' | 'tier2' | 'tier3'>('all');
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [filterRisk, setFilterRisk] = useState<'all' | 'safe' | 'moderate' | 'high'>('all');
  const [filterMatchType, setFilterMatchType] = useState<'all' | 'Bo1' | 'Bo3' | 'Bo5'>('all');
  const [showHotMatches, setShowHotMatches] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Apply filters
  const filteredMatches = matches.filter(match => {
    // Tier filter
    if (filterTier !== 'all' && match.tier !== filterTier) return false;
    
    // Confidence filter
    if (filterConfidence === 'high' && match.aiConfidence <= 80) return false;
    if (filterConfidence === 'medium' && (match.aiConfidence <= 60 || match.aiConfidence > 80)) return false;
    if (filterConfidence === 'low' && match.aiConfidence > 60) return false;
    
    // Risk filter
    if (filterRisk === 'safe' && match.risk > 30) return false;
    if (filterRisk === 'moderate' && (match.risk <= 30 || match.risk > 50)) return false;
    if (filterRisk === 'high' && match.risk <= 50) return false;
    
    // Match type filter
    if (filterMatchType !== 'all' && match.matchType !== filterMatchType) return false;
    
    // Hot matches filter
    if (showHotMatches && (match.aiConfidence <= 70 || match.upsetProbability >= 20)) return false;
    
    // Search filter
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

  const toggleSort = (column: 'date' | 'confidence' | 'risk' | 'upset') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const refreshMatches = async () => {
    setIsLoading(true);
    
    try {
      toast({
        title: '🔄 Завантаження матчів з HLTV...',
        description: 'Це може зайняти кілька секунд',
      });

      // Use CORS proxy for testing
      const corsProxy = 'https://corsproxy.io/';
      const hltvMatches = await fetchAndParseMatches(corsProxy);
      
      console.log('HLTV Matches fetched:', hltvMatches);
      
      if (hltvMatches && hltvMatches.length > 0) {
        // Convert HLTV matches to our format
        const formattedMatches = hltvMatches.map(match => {
          const converted = convertToMatchFormat(match);
          
          console.log('Converted match:', converted);
          
          // Add mock AI data (in production, this would come from your AI analysis)
          return {
            ...converted,
            aiConfidence: Math.floor(Math.random() * 30) + 60, // 60-90%
            risk: Math.floor(Math.random() * 50) + 10, // 10-60%
            odds: {
              team1: match.odds1 || 1.5,
              team2: match.odds2 || 2.5
            },
            playerForm: [],
            tier: 'tier1' as const,
            matchType: (match.type?.toUpperCase() || 'Bo3') as 'Bo1' | 'Bo3' | 'Bo5',
            upsetProbability: Math.floor(Math.random() * 30) + 10, // 10-40%
            formStability: 'stable' as FormStability
          };
        });

        console.log('Formatted matches:', formattedMatches);
        setMatches(formattedMatches);
        
        toast({
          title: '✅ Матчі оновлено!',
          description: `Завантажено ${formattedMatches.length} матчів з HLTV`,
        });
      } else {
        console.warn('No matches found from HLTV');
        toast({
          title: '⚠️ Матчі не знайдено',
          description: 'Використовуються демо-дані',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to fetch HLTV matches:', error);
      
      toast({
        title: '❌ Помилка завантаження',
        description: 'Не вдалося завантажити матчі з HLTV. Використовуються демо-дані.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Матчі</h1>
          <p className="text-gray-600">Аналітична система з AI прогнозами та Form Stability</p>
        </div>
        
        <Button 
          onClick={refreshMatches} 
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Завантаження...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Оновити з HLTV
            </>
          )}
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">🚀 Реальні дані з HLTV</h3>
              <p className="text-sm text-blue-800">
                Натисніть "Оновити з HLTV" щоб завантажити актуальні матчі з HLTV.org. 
                Парсер автоматично отримає список матчів, коефіцієнти та інформацію про команди.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всього матчів</p>
                <p className="text-2xl font-bold">{sortedMatches.length}</p>
              </div>
              <Trophy className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Безпечні матчі</p>
                <p className="text-2xl font-bold text-green-600">
                  {sortedMatches.filter(m => m.risk <= 30).length}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hot Matches ⚡</p>
                <p className="text-2xl font-bold text-orange-600">
                  {matches.filter(m => m.aiConfidence > 70 && m.upsetProbability < 20).length}
                </p>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Середній AI %</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(matches.reduce((sum, m) => sum + m.aiConfidence, 0) / matches.length)}%
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фільтри та сортування
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium">Tier:</label>
              <Select value={filterTier} onValueChange={(value: 'all' | 'tier1' | 'tier2' | 'tier3') => setFilterTier(value)}>
                <SelectTrigger className="mt-1">
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
              <label className="text-sm font-medium">AI Confidence:</label>
              <Select value={filterConfidence} onValueChange={(value: 'all' | 'high' | 'medium' | 'low') => setFilterConfidence(value)}>
                <SelectTrigger className="mt-1">
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
              <label className="text-sm font-medium">Ризик:</label>
              <Select value={filterRisk} onValueChange={(value: 'all' | 'safe' | 'moderate' | 'high') => setFilterRisk(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі</SelectItem>
                  <SelectItem value="safe">0-30% (Безпечні)</SelectItem>
                  <SelectItem value="moderate">30-50% (Помірні)</SelectItem>
                  <SelectItem value="high">50-100% (Високі)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Тип матчу:</label>
              <Select value={filterMatchType} onValueChange={(value: 'all' | 'Bo1' | 'Bo3' | 'Bo5') => setFilterMatchType(value)}>
                <SelectTrigger className="mt-1">
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
              <label className="text-sm font-medium">Пошук:</label>
              <div className="relative mt-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Команда..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Hot Match ⚡:</label>
              <Button
                variant={showHotMatches ? 'default' : 'outline'}
                className="w-full mt-1"
                onClick={() => setShowHotMatches(!showHotMatches)}
              >
                {showHotMatches ? 'Увімкнено' : 'Вимкнено'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Матчі ({sortedMatches.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 cursor-pointer hover:bg-gray-50" onClick={() => toggleSort('date')}>
                    <div className="flex items-center gap-1">
                      📅 Дата
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="text-left p-3">🎮 Матч</th>
                  <th className="text-left p-3 cursor-pointer hover:bg-gray-50" onClick={() => toggleSort('confidence')}>
                    <div className="flex items-center gap-1">
                      ⭐ Фаворит
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="text-left p-3 cursor-pointer hover:bg-gray-50" onClick={() => toggleSort('risk')}>
                    <div className="flex items-center gap-1">
                      ⚖️ Ризик
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="text-left p-3">💬 Коментар</th>
                  <th className="text-left p-3">💵 Коефіцієнт</th>
                  <th className="text-left p-3">🏆 Win Rate</th>
                  <th className="text-left p-3">🧩 Form Stability</th>
                  <th className="text-left p-3">🕹️ Context</th>
                </tr>
              </thead>
              <tbody>
                {sortedMatches.map((match) => {
                  const formInfo = getFormStabilityInfo(match.formStability);
                  const isHotMatch = match.aiConfidence > 70 && match.upsetProbability < 20;
                  
                  return (
                    <tr key={match.id} className={`border-b hover:bg-gray-50 ${isHotMatch ? 'bg-orange-50' : ''}`}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{match.date}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{match.team1} vs {match.team2}</div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {match.matchType}
                            </Badge>
                          </div>
                          {match.url && (
                            <a 
                              href={match.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-blue-600">{match.favorite}</div>
                        <div className="text-sm text-gray-600">AI {match.aiConfidence}%</div>
                      </td>
                      <td className="p-3">
                        <div className={`font-medium ${getRiskColor(match.risk)}`}>
                          {match.risk}%
                        </div>
                        <div className="text-xs text-gray-600">{getRiskLabel(match.risk)}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{match.comment}</div>
                        <div className="text-xs text-gray-500 mt-1">{match.aiSummary}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {match.team1}: {match.odds.team1}
                        </div>
                        <div className="text-sm">
                          {match.team2}: {match.odds.team2}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {match.winRate >= 70 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium">{match.winRate}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={formInfo.color}>
                          <span className="mr-1">{formInfo.icon}</span>
                          {formInfo.label}
                        </Badge>
                        <div className="text-xs text-gray-600 mt-1">{formInfo.description}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{match.context}</div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {match.tier.toUpperCase()}
                        </Badge>
                        {isHotMatch && (
                          <Badge className="text-xs mt-1 ml-1 bg-orange-600">
                            <Zap className="h-3 w-3 mr-1" />
                            Hot
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {sortedMatches.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Немає матчів за обраними фільтрами</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}