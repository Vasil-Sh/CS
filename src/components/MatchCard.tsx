import { Match } from '@/data/mockData';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Trophy, TrendingUp } from 'lucide-react';
import { getRecommendationColor, getRecommendationText } from '@/lib/analytics';

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-500 text-white';
      case 'upcoming': return 'bg-blue-500 text-white';
      case 'finished': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'Наживо';
      case 'upcoming': return 'Очікується';
      case 'finished': return 'Завершено';
      default: return status;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{match.tournament}</span>
          </div>
          <Badge className={getStatusColor(match.status)}>
            {getStatusText(match.status)}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          {formatDate(match.date)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Teams */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{match.team1.logo}</span>
            <div>
              <div className="font-semibold">{match.team1.name}</div>
              <div className="text-sm text-gray-500">Рейтинг: {match.team1.rating}</div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-500">VS</div>
            {match.score && (
              <div className="font-bold text-lg">
                {match.score.team1} : {match.score.team2}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-semibold">{match.team2.name}</div>
              <div className="text-sm text-gray-500">Рейтинг: {match.team2.rating}</div>
            </div>
            <span className="text-2xl">{match.team2.logo}</span>
          </div>
        </div>

        {/* Odds */}
        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-gray-600">Коефіцієнт</div>
            <div className="font-bold text-lg">{match.odds.team1}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Коефіцієнт</div>
            <div className="font-bold text-lg">{match.odds.team2}</div>
          </div>
        </div>

        {/* Prediction */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Прогноз:</span>
            <span className="font-semibold">{match.prediction.winner}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Впевненість:</span>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="font-semibold">{match.prediction.confidence}%</span>
            </div>
          </div>
          
          <Badge className={getRecommendationColor(match.prediction.recommendation)}>
            {getRecommendationText(match.prediction.recommendation)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}