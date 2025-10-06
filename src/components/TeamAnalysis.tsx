import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TeamTierSystem from '@/components/TeamTierSystem';
import { 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Target, 
  Users, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Search,
  RefreshCw,
  Star,
  Trophy,
  Activity,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface TeamStats {
  name: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
  recentForm: string[];
  stabilityIndex: number;
  lastUpdated: string;
  mapStats: { [key: string]: { wins: number; losses: number; winRate: number } };
  recentMatches: Array<{
    date: string;
    opponent: string;
    result: 'W' | 'L';
    score: string;
    map: string;
  }>;
  headToHead: { [key: string]: { wins: number; losses: number; winRate: number } };
  tier?: 'tier1' | 'tier2' | 'tier3';
  rank?: number;
}

interface MatchDetails {
  opponent: string;
  mapStats: { [key: string]: { wins: number; losses: number; winRate: number } };
  headToHead: { wins: number; losses: number; winRate: number };
}

export default function TeamAnalysis() {
  const [teams, setTeams] = useState<{ [key: string]: TeamStats }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedMatch, setSelectedMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(false);

  // Симуляція даних (в реальності буде парсинг HLTV)
  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    setLoading(true);
    
    // Симуляція завантаження даних з HLTV
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockTeams: { [key: string]: TeamStats } = {
      'Spirit': {
        name: 'Spirit',
        matches: 28,
        wins: 22,
        losses: 6,
        winRate: 79,
        recentForm: ['W', 'W', 'W', 'W', 'L', 'W', 'W', 'L', 'W', 'W'],
        stabilityIndex: 94,
        lastUpdated: new Date().toISOString(),
        tier: 'tier1',
        rank: 1,
        mapStats: {
          'Mirage': { wins: 9, losses: 1, winRate: 90 },
          'Inferno': { wins: 7, losses: 2, winRate: 78 },
          'Dust2': { wins: 6, losses: 1, winRate: 86 },
          'Cache': { wins: 4, losses: 1, winRate: 80 },
          'Overpass': { wins: 3, losses: 2, winRate: 60 }
        },
        recentMatches: [
          { date: '2025-01-15', opponent: 'FURIA', result: 'W', score: '16-11', map: 'Mirage' },
          { date: '2025-01-14', opponent: 'NAVI', result: 'W', score: '16-13', map: 'Inferno' },
          { date: '2025-01-12', opponent: 'G2', result: 'L', score: '14-16', map: 'Dust2' },
          { date: '2025-01-10', opponent: 'Vitality', result: 'W', score: '16-9', map: 'Cache' },
          { date: '2025-01-08', opponent: 'FaZe', result: 'W', score: '16-12', map: 'Mirage' }
        ],
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
        lastUpdated: new Date().toISOString(),
        tier: 'tier1',
        rank: 2,
        mapStats: {
          'Mirage': { wins: 7, losses: 2, winRate: 78 },
          'Inferno': { wins: 6, losses: 2, winRate: 75 },
          'Dust2': { wins: 5, losses: 2, winRate: 71 },
          'Cache': { wins: 4, losses: 1, winRate: 80 },
          'Overpass': { wins: 2, losses: 2, winRate: 50 }
        },
        recentMatches: [
          { date: '2025-01-15', opponent: 'Spirit', result: 'L', score: '11-16', map: 'Mirage' },
          { date: '2025-01-13', opponent: 'NAVI', result: 'W', score: '16-14', map: 'Inferno' },
          { date: '2025-01-11', opponent: 'G2', result: 'W', score: '16-10', map: 'Cache' },
          { date: '2025-01-09', opponent: 'Vitality', result: 'L', score: '13-16', map: 'Dust2' },
          { date: '2025-01-07', opponent: 'FaZe', result: 'W', score: '16-12', map: 'Mirage' }
        ],
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
        lastUpdated: new Date().toISOString(),
        tier: 'tier1',
        rank: 3,
        mapStats: {
          'Mirage': { wins: 8, losses: 2, winRate: 80 },
          'Inferno': { wins: 6, losses: 3, winRate: 67 },
          'Dust2': { wins: 4, losses: 2, winRate: 67 },
          'Cache': { wins: 3, losses: 1, winRate: 75 },
          'Overpass': { wins: 2, losses: 3, winRate: 40 }
        },
        recentMatches: [
          { date: '2025-01-14', opponent: 'Spirit', result: 'L', score: '13-16', map: 'Inferno' },
          { date: '2025-01-13', opponent: 'FURIA', result: 'L', score: '14-16', map: 'Inferno' },
          { date: '2025-01-11', opponent: 'G2', result: 'W', score: '16-12', map: 'Mirage' },
          { date: '2025-01-09', opponent: 'Vitality', result: 'W', score: '16-11', map: 'Cache' },
          { date: '2025-01-07', opponent: 'FaZe', result: 'W', score: '16-9', map: 'Mirage' }
        ],
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
        lastUpdated: new Date().toISOString(),
        tier: 'tier1',
        rank: 4,
        mapStats: {
          'Mirage': { wins: 5, losses: 3, winRate: 63 },
          'Inferno': { wins: 4, losses: 2, winRate: 67 },
          'Dust2': { wins: 3, losses: 3, winRate: 50 },
          'Cache': { wins: 2, losses: 1, winRate: 67 },
          'Overpass': { wins: 1, losses: 2, winRate: 33 }
        },
        recentMatches: [
          { date: '2025-01-12', opponent: 'Spirit', result: 'W', score: '16-14', map: 'Dust2' },
          { date: '2025-01-11', opponent: 'NAVI', result: 'L', score: '12-16', map: 'Mirage' },
          { date: '2025-01-11', opponent: 'FURIA', result: 'L', score: '10-16', map: 'Cache' },
          { date: '2025-01-09', opponent: 'Vitality', result: 'W', score: '16-14', map: 'Inferno' },
          { date: '2025-01-07', opponent: 'FaZe', result: 'W', score: '16-12', map: 'Mirage' }
        ],
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
        lastUpdated: new Date().toISOString(),
        tier: 'tier1',
        rank: 5,
        mapStats: {
          'Mirage': { wins: 7, losses: 1, winRate: 88 },
          'Inferno': { wins: 5, losses: 1, winRate: 83 },
          'Dust2': { wins: 4, losses: 1, winRate: 80 },
          'Cache': { wins: 3, losses: 0, winRate: 100 },
          'Overpass': { wins: 2, losses: 1, winRate: 67 }
        },
        recentMatches: [
          { date: '2025-01-10', opponent: 'Spirit', result: 'L', score: '9-16', map: 'Cache' },
          { date: '2025-01-09', opponent: 'FURIA', result: 'W', score: '16-13', map: 'Dust2' },
          { date: '2025-01-09', opponent: 'G2', result: 'L', score: '14-16', map: 'Inferno' },
          { date: '2025-01-09', opponent: 'NAVI', result: 'L', score: '11-16', map: 'Cache' },
          { date: '2025-01-07', opponent: 'FaZe', result: 'W', score: '16-5', map: 'Dust2' }
        ],
        headToHead: {
          'Spirit': { wins: 1, losses: 3, winRate: 25 },
          'FURIA': { wins: 3, losses: 2, winRate: 60 },
          'G2': { wins: 2, losses: 3, winRate: 40 }
        }
      }
    };
    
    setTeams(mockTeams);
    setSelectedTeam('Spirit'); // Встановлюємо Spirit як дефолтну команду
    setLoading(false);
  };

  const handleMatchClick = (opponent: string) => {
    if (!selectedTeam || !teams[selectedTeam]) return;
    
    const team = teams[selectedTeam];
    const opponentTeam = teams[opponent];
    
    if (!opponentTeam) return;
    
    setSelectedMatch({
      opponent,
      mapStats: opponentTeam.mapStats,
      headToHead: team.headToHead[opponent] || { wins: 0, losses: 0, winRate: 0 }
    });
  };

  const calculateStabilityIndex = (team: TeamStats): number => {
    const recentFormScore = team.recentForm.slice(-5).filter(r => r === 'W').length * 20;
    const winRateScore = team.winRate * 0.6;
    const consistencyScore = calculateConsistency(team.recentForm) * 20;
    
    return Math.min(100, Math.round(recentFormScore + winRateScore + consistencyScore));
  };

  const calculateConsistency = (form: string[]): number => {
    let streaks = 0;
    let currentStreak = 1;
    
    for (let i = 1; i < form.length; i++) {
      if (form[i] === form[i-1]) {
        currentStreak++;
      } else {
        streaks += currentStreak > 2 ? 1 : 0;
        currentStreak = 1;
      }
    }
    
    return Math.max(0, 1 - (streaks / form.length));
  };

  const getTierBadge = (tier?: string, rank?: number) => {
    if (!tier) return null;
    
    const tierColors = {
      tier1: 'bg-yellow-100 text-yellow-800',
      tier2: 'bg-blue-100 text-blue-800', 
      tier3: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={tierColors[tier]}>
        {tier.toUpperCase()} {rank && `#${rank}`}
      </Badge>
    );
  };

  const filteredTeams = Object.values(teams).filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTeamData = selectedTeam ? teams[selectedTeam] : null;

  // Дані для радар чарту
  const getRadarData = (team: TeamStats) => [
    { subject: 'Win Rate', A: team.winRate, fullMark: 100 },
    { subject: 'Стабільність', A: team.stabilityIndex, fullMark: 100 },
    { subject: 'Recent Form', A: team.recentForm.slice(-5).filter(r => r === 'W').length * 20, fullMark: 100 },
    { subject: 'Mirage', A: team.mapStats.Mirage?.winRate || 0, fullMark: 100 },
    { subject: 'Inferno', A: team.mapStats.Inferno?.winRate || 0, fullMark: 100 },
    { subject: 'Dust2', A: team.mapStats.Dust2?.winRate || 0, fullMark: 100 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Аналіз команд CS2
          </h2>
          <p className="text-gray-600">Детальна статистика команд з HLTV</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTeamData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Оновити дані
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tier-system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tier-system">Система тірів</TabsTrigger>
          <TabsTrigger value="overview">Огляд команд</TabsTrigger>
          <TabsTrigger value="detailed">Детальний аналіз</TabsTrigger>
        </TabsList>

        <TabsContent value="tier-system">
          <TeamTierSystem />
        </TabsContent>

        <TabsContent value="overview">
          {/* Пошук команд */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Пошук команд
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Введіть назву команди..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => (
              <Card key={team.name} className="cursor-pointer hover:shadow-lg transition-shadow" 
                    onClick={() => setSelectedTeam(team.name)}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {team.rank && team.rank <= 3 && <Trophy className="h-4 w-4 text-yellow-500" />}
                      {team.name}
                    </CardTitle>
                    <div className="flex flex-col gap-1">
                      {getTierBadge(team.tier, team.rank)}
                      <Badge variant={team.stabilityIndex > 80 ? 'default' : team.stabilityIndex > 60 ? 'secondary' : 'destructive'}>
                        {team.stabilityIndex}/100
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Win Rate:</span>
                      <span className="font-medium">{team.winRate}%</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Матчі:</span>
                      <span className="font-medium">{team.wins}-{team.losses}</span>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Recent Form:</span>
                      </div>
                      <div className="flex gap-1">
                        {team.recentForm.slice(-10).map((result, index) => (
                          <div key={index} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                            result === 'W' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                          }`}>
                            {result}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-gray-600">Стабільність:</span>
                      <Progress value={team.stabilityIndex} className="mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="detailed">
          {/* Селектор команди */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Оберіть команду для аналізу
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select 
                className="w-full p-3 border rounded-md"
                value={selectedTeam}
                onChange={(e) => {
                  setSelectedTeam(e.target.value);
                  setSelectedMatch(null); // Скидаємо вибраний матч
                }}
              >
                <option value="">Оберіть команду</option>
                {Object.keys(teams).map(team => (
                  <option key={team} value={team}>
                    #{teams[team].rank} {team} ({teams[team].tier?.toUpperCase()}) - {teams[team].winRate}% WR
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {selectedTeamData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Статистика {selectedTeamData.name}
                    {getTierBadge(selectedTeamData.tier, selectedTeamData.rank)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={getRadarData(selectedTeamData)}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name={selectedTeamData.name} dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Останні матчі (клікніть для деталей)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedTeamData.recentMatches.map((match, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleMatchClick(match.opponent)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            match.result === 'W' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                          }`}>
                            {match.result}
                          </div>
                          <div>
                            <p className="font-medium">vs {match.opponent}</p>
                            <p className="text-sm text-gray-600">{match.date} • {match.map}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{match.score}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Статистика по картах
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(selectedTeamData.mapStats).map(([map, stats]) => (
                      <div key={map} className="flex items-center justify-between">
                        <span className="font-medium">{map}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">{stats.wins}-{stats.losses}</span>
                          <Badge variant={stats.winRate > 70 ? 'default' : stats.winRate > 50 ? 'secondary' : 'destructive'}>
                            {stats.winRate}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Head-to-Head
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(selectedTeamData.headToHead).map(([opponent, stats]) => (
                      <div key={opponent} className="flex items-center justify-between">
                        <span className="font-medium">vs {opponent}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">{stats.wins}-{stats.losses}</span>
                          <Badge variant={stats.winRate > 60 ? 'default' : stats.winRate > 40 ? 'secondary' : 'destructive'}>
                            {stats.winRate}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Деталі вибраного матчу */}
              {selectedMatch && (
                <>
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        Деталі матчу: {selectedTeamData.name} vs {selectedMatch.opponent}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">Статистика по картах {selectedMatch.opponent}</h4>
                          <div className="space-y-2">
                            {Object.entries(selectedMatch.mapStats).map(([map, stats]) => (
                              <div key={map} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="font-medium">{map}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">{stats.wins}-{stats.losses}</span>
                                  <Badge variant={stats.winRate > 70 ? 'default' : stats.winRate > 50 ? 'secondary' : 'destructive'}>
                                    {stats.winRate}%
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-3">Head-to-Head статистика</h4>
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600">
                                {selectedMatch.headToHead.wins}-{selectedMatch.headToHead.losses}
                              </p>
                              <p className="text-sm text-gray-600 mb-2">
                                {selectedTeamData.name} vs {selectedMatch.opponent}
                              </p>
                              <Badge variant={selectedMatch.headToHead.winRate > 60 ? 'default' : selectedMatch.headToHead.winRate > 40 ? 'secondary' : 'destructive'}>
                                {selectedMatch.headToHead.winRate}% Win Rate
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Оберіть команду для детального аналізу
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}