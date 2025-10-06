import { Team } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, Target } from 'lucide-react';

interface TeamStatsProps {
  team: Team;
}

export default function TeamStats({ team }: TeamStatsProps) {
  const getFormColor = (result: 'W' | 'L') => {
    return result === 'W' ? 'bg-green-500' : 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span className="text-3xl">{team.logo}</span>
          <div>
            <h3 className="text-xl font-bold">{team.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Target className="h-4 w-4" />
              Рейтинг: {team.rating}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Team Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{team.winRate}%</div>
            <div className="text-sm text-gray-600">Відсоток перемог</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{team.avgRounds}</div>
            <div className="text-sm text-gray-600">Середні раунди</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{team.rating}</div>
            <div className="text-sm text-gray-600">Рейтинг команди</div>
          </div>
        </div>

        {/* Recent Form */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Недавня форма
          </h4>
          <div className="flex gap-1">
            {team.recentForm.map((result, index) => (
              <div
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${getFormColor(result)}`}
              >
                {result}
              </div>
            ))}
          </div>
        </div>

        {/* Win Rate Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Відсоток перемог</span>
            <span>{team.winRate}%</span>
          </div>
          <Progress value={team.winRate} className="h-2" />
        </div>

        {/* Top Players */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Топ гравці
          </h4>
          <div className="space-y-2">
            {team.players.slice(0, 3).map((player) => (
              <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{player.name}</div>
                  <div className="text-sm text-gray-500">
                    K/D: {player.kd} | ADR: {player.adr}
                  </div>
                </div>
                <Badge variant="secondary">
                  {player.rating}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}