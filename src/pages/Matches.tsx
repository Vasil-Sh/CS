import { useState } from 'react';
import MatchCard from '@/components/MatchCard';
import BettingRecommendation from '@/components/BettingRecommendation';
import { mockMatches } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy, Clock } from 'lucide-react';

export default function Matches() {
  const [activeTab, setActiveTab] = useState('upcoming');

  const upcomingMatches = mockMatches.filter(match => match.status === 'upcoming');
  const liveMatches = mockMatches.filter(match => match.status === 'live');
  const finishedMatches = mockMatches.filter(match => match.status === 'finished');

  const safeRecommendations = upcomingMatches.filter(match => 
    match.prediction.recommendation === 'safe'
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Матчі</h1>
        <p className="text-gray-600">Аналіз матчів та рекомендації для ставок</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Clock className="h-5 w-5" />
            <span className="font-medium">Очікується</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">{upcomingMatches.length}</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <Trophy className="h-5 w-5" />
            <span className="font-medium">Безпечні ставки</span>
          </div>
          <div className="text-2xl font-bold text-green-700">{safeRecommendations}</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Calendar className="h-5 w-5" />
            <span className="font-medium">Завершено</span>
          </div>
          <div className="text-2xl font-bold text-purple-700">{finishedMatches.length}</div>
        </div>
      </div>

      {/* Betting Recommendations Summary */}
      {upcomingMatches.length > 0 && (
        <BettingRecommendation
          recommendation="safe"
          confidence={75}
          expectedValue={0.12}
          reasoning={[
            `${safeRecommendations} матчів з безпечними рекомендаціями`,
            'Високий рівень впевненості в прогнозах',
            'Сприятливі коефіцієнти для топ команд'
          ]}
        />
      )}

      {/* Matches Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Очікується
            <Badge variant="secondary">{upcomingMatches.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center gap-2">
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
            Наживо
            <Badge variant="secondary">{liveMatches.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="finished" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Завершено
            <Badge variant="secondary">{finishedMatches.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {upcomingMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="live" className="space-y-6">
          {liveMatches.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Наразі немає матчів наживо</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {liveMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="finished" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {finishedMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}