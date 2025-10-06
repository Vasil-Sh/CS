import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MatchCard from '@/components/MatchCard';
import StatsChart from '@/components/StatsChart';
import { mockMatches, mockTeams } from '@/data/mockData';
import { Trophy, TrendingUp, Users, Target } from 'lucide-react';

export default function Dashboard() {
  const upcomingMatches = mockMatches.filter(match => match.status === 'upcoming');
  const safeRecommendations = mockMatches.filter(match => match.prediction.recommendation === 'safe').length;
  
  const teamPerformanceData = mockTeams.map(team => ({
    name: team.name,
    winRate: team.winRate,
    rating: team.rating * 100
  }));

  const recentMatchesData = [
    { date: '01.10', matches: 12, predictions: 9 },
    { date: '02.10', matches: 8, predictions: 6 },
    { date: '03.10', matches: 15, predictions: 11 },
    { date: '04.10', matches: 10, predictions: 8 },
    { date: '05.10', matches: 14, predictions: 10 },
    { date: '06.10', matches: 9, predictions: 7 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Панель управління</h1>
        <p className="text-gray-600">Огляд аналітики CS2 матчів та рекомендацій</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Сьогоднішні матчі</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingMatches.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 порівняно з вчора
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Безпечні ставки</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeRecommendations}</div>
            <p className="text-xs text-muted-foreground">
              Високий рівень впевненості
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Відстежувані команди</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockTeams.length}</div>
            <p className="text-xs text-muted-foreground">
              Топ команди світу
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Точність прогнозів</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              За останній місяць
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatsChart
          title="Продуктивність команд"
          data={teamPerformanceData}
          dataKey="winRate"
          xAxisKey="name"
          color="#10b981"
        />
        
        <StatsChart
          title="Активність прогнозування"
          data={recentMatchesData}
          type="line"
          dataKey="predictions"
          xAxisKey="date"
          color="#3b82f6"
        />
      </div>

      {/* Upcoming Matches */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Найближчі матчі</h2>
          <Badge variant="secondary">{upcomingMatches.length} матчів</Badge>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {upcomingMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </div>
    </div>
  );
}