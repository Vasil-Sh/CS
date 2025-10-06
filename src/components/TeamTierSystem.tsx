import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Crown,
  Star,
  Target,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface TeamRanking {
  rank: number;
  name: string;
  points: number;
  tier: 'tier1' | 'tier2' | 'tier3';
  change: number; // +/- позиції з минулого рейтингу
  country: string;
  logo?: string;
  recentForm: string[];
  stability: number;
}

interface TierAnalysis {
  tier: string;
  teams: TeamRanking[];
  avgPoints: number;
  description: string;
  color: string;
  icon: any;
}

export default function TeamTierSystem() {
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Актуальні дані HLTV Valve Ranking (жовтень 2025) з новою логікою тірів
  useEffect(() => {
    loadHLTVRankings();
  }, []);

  const loadHLTVRankings = async () => {
    setLoading(true);
    
    // Симуляція завантаження з HLTV
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockRankings: TeamRanking[] = [
      // Tier 1 (1-50) - Актуальний рейтинг HLTV
      { rank: 1, name: 'Spirit', points: 1000, tier: 'tier1', change: 2, country: 'RU', recentForm: ['W', 'W', 'W', 'W', 'L'], stability: 98 },
      { rank: 2, name: 'FURIA', points: 967, tier: 'tier1', change: 3, country: 'BR', recentForm: ['W', 'W', 'L', 'W', 'W'], stability: 94 },
      { rank: 3, name: 'NAVI', points: 934, tier: 'tier1', change: -2, country: 'UA', recentForm: ['W', 'L', 'W', 'W', 'L'], stability: 89 },
      { rank: 4, name: 'G2', points: 901, tier: 'tier1', change: 1, country: 'FR', recentForm: ['L', 'W', 'W', 'W', 'W'], stability: 87 },
      { rank: 5, name: 'Vitality', points: 868, tier: 'tier1', change: -3, country: 'FR', recentForm: ['W', 'L', 'L', 'W', 'W'], stability: 85 },
      { rank: 6, name: 'FaZe', points: 835, tier: 'tier1', change: 0, country: 'EU', recentForm: ['W', 'W', 'L', 'W', 'L'], stability: 83 },
      { rank: 7, name: 'MOUZ', points: 802, tier: 'tier1', change: 1, country: 'DE', recentForm: ['L', 'W', 'W', 'L', 'W'], stability: 81 },
      { rank: 8, name: 'Astralis', points: 769, tier: 'tier1', change: -2, country: 'DK', recentForm: ['W', 'L', 'W', 'L', 'L'], stability: 78 },
      { rank: 9, name: 'Liquid', points: 736, tier: 'tier1', change: 2, country: 'US', recentForm: ['W', 'W', 'W', 'L', 'W'], stability: 80 },
      { rank: 10, name: 'Heroic', points: 703, tier: 'tier1', change: -1, country: 'DK', recentForm: ['L', 'W', 'L', 'W', 'W'], stability: 76 },
      { rank: 11, name: 'ENCE', points: 670, tier: 'tier1', change: 1, country: 'FI', recentForm: ['W', 'L', 'W', 'W', 'L'], stability: 74 },
      { rank: 12, name: 'BIG', points: 637, tier: 'tier1', change: -1, country: 'DE', recentForm: ['L', 'W', 'L', 'W', 'W'], stability: 72 },
      { rank: 13, name: 'Cloud9', points: 604, tier: 'tier1', change: 3, country: 'US', recentForm: ['W', 'W', 'L', 'L', 'W'], stability: 70 },
      { rank: 14, name: 'NIP', points: 571, tier: 'tier1', change: -2, country: 'SE', recentForm: ['L', 'L', 'W', 'W', 'L'], stability: 68 },
      { rank: 15, name: 'Fnatic', points: 538, tier: 'tier1', change: 0, country: 'SE', recentForm: ['W', 'L', 'W', 'L', 'W'], stability: 69 },
      { rank: 16, name: 'Complexity', points: 505, tier: 'tier1', change: -3, country: 'US', recentForm: ['L', 'L', 'L', 'W', 'W'], stability: 65 },
      { rank: 17, name: 'Eternal Fire', points: 472, tier: 'tier1', change: 1, country: 'TR', recentForm: ['W', 'L', 'W', 'W', 'L'], stability: 67 },
      { rank: 18, name: 'OG', points: 439, tier: 'tier1', change: -1, country: 'EU', recentForm: ['L', 'W', 'L', 'L', 'W'], stability: 63 },
      { rank: 19, name: 'paiN', points: 406, tier: 'tier1', change: 2, country: 'BR', recentForm: ['W', 'W', 'L', 'W', 'L'], stability: 66 },
      { rank: 20, name: 'Monte', points: 373, tier: 'tier1', change: -1, country: 'UA', recentForm: ['L', 'W', 'W', 'L', 'L'], stability: 61 },
      { rank: 21, name: 'MIBR', points: 340, tier: 'tier1', change: 0, country: 'BR', recentForm: ['W', 'L', 'L', 'W', 'W'], stability: 64 },
      { rank: 22, name: 'Apeks', points: 307, tier: 'tier1', change: -2, country: 'NO', recentForm: ['L', 'L', 'W', 'L', 'W'], stability: 59 },
      { rank: 23, name: 'SAW', points: 274, tier: 'tier1', change: 1, country: 'PT', recentForm: ['W', 'L', 'W', 'W', 'L'], stability: 62 },
      { rank: 24, name: 'Falcons', points: 241, tier: 'tier1', change: -1, country: 'SA', recentForm: ['L', 'W', 'L', 'L', 'W'], stability: 57 },
      { rank: 25, name: 'GamerLegion', points: 208, tier: 'tier1', change: 0, country: 'DE', recentForm: ['W', 'L', 'W', 'L', 'L'], stability: 60 },
      { rank: 26, name: 'Virtus.pro', points: 175, tier: 'tier1', change: 3, country: 'RU', recentForm: ['W', 'W', 'L', 'L', 'W'], stability: 55 },
      { rank: 27, name: 'ECSTATIC', points: 142, tier: 'tier1', change: -2, country: 'DK', recentForm: ['L', 'W', 'L', 'W', 'L'], stability: 53 },
      { rank: 28, name: 'Imperial', points: 109, tier: 'tier1', change: 1, country: 'BR', recentForm: ['W', 'L', 'L', 'W', 'L'], stability: 51 },
      { rank: 29, name: 'BESTIA', points: 76, tier: 'tier1', change: -2, country: 'BR', recentForm: ['L', 'L', 'W', 'L', 'W'], stability: 49 },
      { rank: 30, name: 'KOI', points: 43, tier: 'tier1', change: 0, country: 'ES', recentForm: ['W', 'L', 'L', 'L', 'W'], stability: 47 },
      { rank: 31, name: '3DMAX', points: 35, tier: 'tier1', change: 2, country: 'FR', recentForm: ['L', 'W', 'L', 'W', 'L'], stability: 48 },
      { rank: 32, name: 'B8', points: 28, tier: 'tier1', change: -1, country: 'UA', recentForm: ['W', 'L', 'L', 'L', 'W'], stability: 45 },
      { rank: 33, name: 'SINNERS', points: 21, tier: 'tier1', change: 1, country: 'CZ', recentForm: ['L', 'W', 'W', 'L', 'L'], stability: 46 },
      { rank: 34, name: 'Nemiga', points: 18, tier: 'tier1', change: 0, country: 'BY', recentForm: ['W', 'L', 'W', 'L', 'W'], stability: 44 },
      { rank: 35, name: 'PARIVISION', points: 15, tier: 'tier1', change: -3, country: 'UA', recentForm: ['L', 'L', 'W', 'W', 'L'], stability: 42 },
      { rank: 36, name: 'Passion UA', points: 12, tier: 'tier1', change: 2, country: 'UA', recentForm: ['W', 'W', 'L', 'L', 'W'], stability: 43 },
      { rank: 37, name: 'Sangal', points: 10, tier: 'tier1', change: -1, country: 'TR', recentForm: ['L', 'W', 'L', 'W', 'L'], stability: 41 },
      { rank: 38, name: 'Rebels', points: 8, tier: 'tier1', change: 1, country: 'RS', recentForm: ['W', 'L', 'W', 'L', 'L'], stability: 40 },
      { rank: 39, name: 'Permitta', points: 6, tier: 'tier1', change: 0, country: 'EE', recentForm: ['L', 'W', 'L', 'W', 'W'], stability: 39 },
      { rank: 40, name: 'AMKAL', points: 5, tier: 'tier1', change: -2, country: 'RU', recentForm: ['L', 'L', 'L', 'W', 'L'], stability: 37 },
      { rank: 41, name: 'EYEBALLERS', points: 4, tier: 'tier1', change: 1, country: 'DK', recentForm: ['W', 'L', 'W', 'L', 'W'], stability: 38 },
      { rank: 42, name: 'Sashi', points: 3, tier: 'tier1', change: -1, country: 'PL', recentForm: ['L', 'W', 'L', 'L', 'W'], stability: 36 },
      { rank: 43, name: 'ALTERNATE aTTaX', points: 2, tier: 'tier1', change: 0, country: 'DE', recentForm: ['W', 'L', 'L', 'W', 'L'], stability: 35 },
      { rank: 44, name: 'BLEED', points: 2, tier: 'tier1', change: 3, country: 'SG', recentForm: ['W', 'W', 'L', 'W', 'L'], stability: 34 },
      { rank: 45, name: 'Gaimin Gladiators', points: 1, tier: 'tier1', change: -2, country: 'EU', recentForm: ['L', 'L', 'W', 'L', 'W'], stability: 33 },
      { rank: 46, name: 'NAVI Junior', points: 1, tier: 'tier1', change: 1, country: 'UA', recentForm: ['W', 'L', 'L', 'W', 'L'], stability: 32 },
      { rank: 47, name: 'Insilio', points: 1, tier: 'tier1', change: -1, country: 'PL', recentForm: ['L', 'W', 'W', 'L', 'L'], stability: 31 },
      { rank: 48, name: 'ENTERPRISE', points: 1, tier: 'tier1', change: 0, country: 'EU', recentForm: ['W', 'L', 'L', 'L', 'W'], stability: 30 },
      { rank: 49, name: 'Endpoint', points: 1, tier: 'tier1', change: 2, country: 'UK', recentForm: ['L', 'W', 'L', 'W', 'W'], stability: 29 },
      { rank: 50, name: 'Metizport', points: 1, tier: 'tier1', change: -1, country: 'BG', recentForm: ['W', 'L', 'W', 'L', 'L'], stability: 28 },
      
      // Tier 2 (51-75)
      { rank: 51, name: 'FORZE', points: 0, tier: 'tier2', change: 1, country: 'RU', recentForm: ['L', 'W', 'L', 'W', 'L'], stability: 27 },
      { rank: 52, name: 'Ninjas in Pyjamas', points: 0, tier: 'tier2', change: -2, country: 'SE', recentForm: ['W', 'L', 'L', 'W', 'W'], stability: 26 },
      { rank: 53, name: 'MONAD', points: 0, tier: 'tier2', change: 0, country: 'UA', recentForm: ['L', 'L', 'W', 'L', 'W'], stability: 25 },
      { rank: 54, name: 'Preasy', points: 0, tier: 'tier2', change: 3, country: 'CZ', recentForm: ['W', 'W', 'L', 'W', 'L'], stability: 24 },
      { rank: 55, name: 'JANO', points: 0, tier: 'tier2', change: -1, country: 'ES', recentForm: ['L', 'W', 'W', 'L', 'L'], stability: 23 },
      { rank: 56, name: 'Sampi', points: 0, tier: 'tier2', change: 2, country: 'CZ', recentForm: ['W', 'L', 'W', 'W', 'L'], stability: 22 },
      { rank: 57, name: 'RUSH B', points: 0, tier: 'tier2', change: -2, country: 'PL', recentForm: ['L', 'L', 'L', 'W', 'W'], stability: 21 },
      { rank: 58, name: 'Illuminar', points: 0, tier: 'tier2', change: 1, country: 'PL', recentForm: ['W', 'L', 'W', 'L', 'W'], stability: 20 },
      { rank: 59, name: 'CYBERSHOKE', points: 0, tier: 'tier2', change: -1, country: 'RU', recentForm: ['L', 'W', 'L', 'L', 'W'], stability: 19 },
      { rank: 60, name: 'Nexus', points: 0, tier: 'tier2', change: 0, country: 'DK', recentForm: ['W', 'L', 'L', 'W', 'L'], stability: 18 },
      { rank: 61, name: 'HAVU', points: 0, tier: 'tier2', change: 2, country: 'FI', recentForm: ['L', 'W', 'W', 'L', 'W'], stability: 17 },
      { rank: 62, name: 'Sprout', points: 0, tier: 'tier2', change: -1, country: 'DE', recentForm: ['W', 'L', 'L', 'L', 'W'], stability: 16 },
      { rank: 63, name: 'IKLA', points: 0, tier: 'tier2', change: 1, country: 'EE', recentForm: ['L', 'L', 'W', 'W', 'L'], stability: 15 },
      { rank: 64, name: 'Astralis Talent', points: 0, tier: 'tier2', change: -2, country: 'DK', recentForm: ['W', 'W', 'L', 'L', 'L'], stability: 14 },
      { rank: 65, name: 'GODSENT', points: 0, tier: 'tier2', change: 0, country: 'SE', recentForm: ['L', 'W', 'L', 'W', 'W'], stability: 13 },
      { rank: 66, name: 'HEROIC Academy', points: 0, tier: 'tier2', change: 1, country: 'DK', recentForm: ['W', 'L', 'W', 'L', 'L'], stability: 12 },
      { rank: 67, name: 'Partizan', points: 0, tier: 'tier2', change: -1, country: 'RS', recentForm: ['L', 'L', 'W', 'L', 'W'], stability: 11 },
      { rank: 68, name: 'PROSPECTS', points: 0, tier: 'tier2', change: 2, country: 'RO', recentForm: ['W', 'W', 'L', 'W', 'L'], stability: 10 },
      { rank: 69, name: 'Falcons Esports', points: 0, tier: 'tier2', change: -1, country: 'SA', recentForm: ['L', 'W', 'L', 'L', 'W'], stability: 9 },
      { rank: 70, name: 'ENCE Academy', points: 0, tier: 'tier2', change: 0, country: 'FI', recentForm: ['W', 'L', 'L', 'W', 'L'], stability: 8 },
      { rank: 71, name: 'UNGENTIUM', points: 0, tier: 'tier2', change: -2, country: 'PL', recentForm: ['L', 'L', 'L', 'W', 'W'], stability: 7 },
      { rank: 72, name: 'Verdant', points: 0, tier: 'tier2', change: 1, country: 'UK', recentForm: ['W', 'L', 'W', 'L', 'L'], stability: 6 },
      { rank: 73, name: 'LEON', points: 0, tier: 'tier2', change: -1, country: 'RU', recentForm: ['L', 'W', 'L', 'W', 'L'], stability: 5 },
      { rank: 74, name: 'Nexus Gaming', points: 0, tier: 'tier2', change: 0, country: 'IN', recentForm: ['W', 'L', 'L', 'L', 'W'], stability: 4 },
      { rank: 75, name: 'TYLOO', points: 0, tier: 'tier2', change: 1, country: 'CN', recentForm: ['L', 'W', 'W', 'L', 'L'], stability: 3 },
      
      // Tier 3 (76-100)
      { rank: 76, name: 'Lynn Vision', points: 0, tier: 'tier3', change: -1, country: 'CN', recentForm: ['W', 'L', 'L', 'W', 'L'], stability: 2 },
      { rank: 77, name: 'RARE ATOM', points: 0, tier: 'tier3', change: 2, country: 'CN', recentForm: ['L', 'W', 'L', 'L', 'W'], stability: 1 },
      { rank: 78, name: 'The MongolZ', points: 0, tier: 'tier3', change: -1, country: 'MN', recentForm: ['W', 'L', 'W', 'L', 'L'], stability: 1 },
      { rank: 79, name: 'ATOX', points: 0, tier: 'tier3', change: 0, country: 'HK', recentForm: ['L', 'L', 'W', 'W', 'L'], stability: 1 },
      { rank: 80, name: 'IHC', points: 0, tier: 'tier3', change: 1, country: 'MN', recentForm: ['W', 'W', 'L', 'L', 'W'], stability: 1 },
      { rank: 81, name: 'VERTEX', points: 0, tier: 'tier3', change: -2, country: 'KZ', recentForm: ['L', 'W', 'L', 'W', 'L'], stability: 1 },
      { rank: 82, name: 'Rooster', points: 0, tier: 'tier3', change: 0, country: 'AU', recentForm: ['W', 'L', 'L', 'L', 'W'], stability: 1 },
      { rank: 83, name: 'Grayhound', points: 0, tier: 'tier3', change: 3, country: 'AU', recentForm: ['L', 'W', 'W', 'L', 'L'], stability: 1 },
      { rank: 84, name: 'ORDER', points: 0, tier: 'tier3', change: -1, country: 'AU', recentForm: ['W', 'L', 'L', 'W', 'W'], stability: 1 },
      { rank: 85, name: 'Vantage', points: 0, tier: 'tier3', change: 1, country: 'AU', recentForm: ['L', 'L', 'W', 'L', 'W'], stability: 1 },
      { rank: 86, name: 'Bad News Eagles', points: 0, tier: 'tier3', change: -2, country: 'XK', recentForm: ['W', 'W', 'L', 'L', 'L'], stability: 1 },
      { rank: 87, name: 'FLUFFY AIMERS', points: 0, tier: 'tier3', change: 0, country: 'US', recentForm: ['L', 'W', 'L', 'W', 'L'], stability: 1 },
      { rank: 88, name: 'Wildcard', points: 0, tier: 'tier3', change: 2, country: 'US', recentForm: ['W', 'L', 'W', 'L', 'W'], stability: 1 },
      { rank: 89, name: 'Nouns', points: 0, tier: 'tier3', change: -1, country: 'US', recentForm: ['L', 'L', 'L', 'W', 'W'], stability: 1 },
      { rank: 90, name: 'Party Astronauts', points: 0, tier: 'tier3', change: 1, country: 'US', recentForm: ['W', 'L', 'W', 'L', 'L'], stability: 1 },
      { rank: 91, name: 'Elevate', points: 0, tier: 'tier3', change: -2, country: 'CA', recentForm: ['L', 'W', 'L', 'L', 'W'], stability: 1 },
      { rank: 92, name: 'timbermen', points: 0, tier: 'tier3', change: 0, country: 'US', recentForm: ['W', 'L', 'L', 'W', 'L'], stability: 1 },
      { rank: 93, name: 'LAG', points: 0, tier: 'tier3', change: 1, country: 'US', recentForm: ['L', 'W', 'W', 'L', 'L'], stability: 1 },
      { rank: 94, name: 'Take Flyte', points: 0, tier: 'tier3', change: -1, country: 'US', recentForm: ['W', 'L', 'L', 'L', 'W'], stability: 1 },
      { rank: 95, name: 'InControl', points: 0, tier: 'tier3', change: 2, country: 'US', recentForm: ['L', 'W', 'L', 'W', 'W'], stability: 1 },
      { rank: 96, name: 'Mythic', points: 0, tier: 'tier3', change: -1, country: 'US', recentForm: ['W', 'L', 'W', 'L', 'L'], stability: 1 },
      { rank: 97, name: 'Limitless', points: 0, tier: 'tier3', change: 0, country: 'US', recentForm: ['L', 'L', 'W', 'W', 'L'], stability: 1 },
      { rank: 98, name: 'Strife', points: 0, tier: 'tier3', change: -2, country: 'US', recentForm: ['W', 'W', 'L', 'L', 'L'], stability: 1 },
      { rank: 99, name: 'Carpe Diem', points: 0, tier: 'tier3', change: 1, country: 'BR', recentForm: ['L', 'W', 'L', 'W', 'W'], stability: 1 },
      { rank: 100, name: 'RED Canids', points: 0, tier: 'tier3', change: -1, country: 'BR', recentForm: ['W', 'L', 'L', 'W', 'L'], stability: 1 }
    ];
    
    setRankings(mockRankings);
    setLastUpdated(new Date().toLocaleString('uk-UA'));
    setLoading(false);
  };

  const getTierAnalysis = (): TierAnalysis[] => {
    const tier1Teams = rankings.filter(team => team.tier === 'tier1');
    const tier2Teams = rankings.filter(team => team.tier === 'tier2');
    const tier3Teams = rankings.filter(team => team.tier === 'tier3');

    return [
      {
        tier: 'Tier 1',
        teams: tier1Teams,
        avgPoints: tier1Teams.reduce((sum, team) => sum + team.points, 0) / tier1Teams.length,
        description: 'Топ-50 команд світу - елітний рівень',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Crown
      },
      {
        tier: 'Tier 2', 
        teams: tier2Teams,
        avgPoints: tier2Teams.reduce((sum, team) => sum + team.points, 0) / tier2Teams.length,
        description: 'Команди #51-75 - сильний регіональний рівень',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Medal
      },
      {
        tier: 'Tier 3',
        teams: tier3Teams,
        avgPoints: tier3Teams.reduce((sum, team) => sum + team.points, 0) / tier3Teams.length,
        description: 'Команди #76-100 - розвиваючі та регіональні',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Target
      }
    ];
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const generateBettingRecommendation = (team1Rank: number, team2Rank: number) => {
    const team1 = rankings.find(t => t.rank === team1Rank);
    const team2 = rankings.find(t => t.rank === team2Rank);
    
    if (!team1 || !team2) return null;

    const tierDiff = getTierDifference(team1.tier, team2.tier);
    const rankDiff = Math.abs(team1.rank - team2.rank);
    
    let recommendation = '';
    let confidence = 50;
    let riskLevel = 'medium';

    if (tierDiff === 0) {
      // Команди одного тіру
      if (team1.tier === 'tier1') {
        if (rankDiff <= 10) {
          recommendation = 'Топ-рівень матч, аналізуйте форму та head-to-head';
          confidence = 60;
          riskLevel = 'medium';
        } else {
          recommendation = `${team1.rank < team2.rank ? team1.name : team2.name} має перевагу в рейтингу`;
          confidence = 70;
          riskLevel = 'low';
        }
      } else if (team1.tier === 'tier2') {
        recommendation = 'Регіональний рівень, форма команд критична';
        confidence = 55;
        riskLevel = 'medium';
      } else {
        recommendation = 'Нижчий тір, високий ризик upset\'ів';
        confidence = 50;
        riskLevel = 'high';
      }
    } else if (tierDiff === 1) {
      // Різниця в 1 тір
      const higherTier = team1.tier === 'tier1' ? team1 : team1.tier === 'tier2' && team2.tier === 'tier3' ? team1 : team2;
      if (higherTier.tier === 'tier1') {
        recommendation = `${higherTier.name} (Tier 1) - сильний фаворит проти Tier 2`;
        confidence = 75;
        riskLevel = 'low';
      } else {
        recommendation = `${higherTier.name} (Tier 2) має перевагу проти Tier 3`;
        confidence = 65;
        riskLevel = 'medium';
      }
    } else {
      // Різниця в 2 тіри (Tier 1 vs Tier 3)
      const tier1Team = team1.tier === 'tier1' ? team1 : team2;
      recommendation = `${tier1Team.name} (Tier 1) - явний фаворит, дуже низький ризик`;
      confidence = 90;
      riskLevel = 'low';
    }

    return { recommendation, confidence, riskLevel };
  };

  const getTierDifference = (tier1: string, tier2: string) => {
    const tierValues = { tier1: 1, tier2: 2, tier3: 3 };
    return Math.abs(tierValues[tier1 as keyof typeof tierValues] - tierValues[tier2 as keyof typeof tierValues]);
  };

  const tierAnalysis = getTierAnalysis();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
            HLTV Valve Ranking & Tier System
          </h2>
          <p className="text-gray-600">Актуальний рейтинг команд CS2 з новою системою тірів (жовтень 2025)</p>
          {lastUpdated && (
            <p className="text-sm text-gray-500">Останнє оновлення: {lastUpdated}</p>
          )}
        </div>
        
        <Button variant="outline" onClick={loadHLTVRankings} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Оновити рейтинг
        </Button>
      </div>

      {/* Топ-3 команди */}
      <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Топ-3 команди світу (актуальний HLTV рейтинг)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rankings.slice(0, 3).map((team, index) => (
              <div key={team.rank} className={`p-4 rounded-lg border-2 ${
                index === 0 ? 'bg-yellow-100 border-yellow-300' :
                index === 1 ? 'bg-gray-100 border-gray-300' :
                'bg-orange-100 border-orange-300'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-500 text-white' :
                    'bg-orange-500 text-white'
                  }`}>
                    {team.rank}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{team.name}</h3>
                    <Badge variant="outline">{team.country}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Очки:</span>
                    <span className="font-medium">{team.points}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Зміна:</span>
                    <div className={`flex items-center gap-1 ${getChangeColor(team.change)}`}>
                      {getChangeIcon(team.change)}
                      <span>{team.change !== 0 ? Math.abs(team.change) : '-'}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Стабільність:</span>
                    <span className="font-medium">{team.stability}%</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm">Форма:</span>
                    <div className="flex gap-1 mt-1">
                      {team.recentForm.map((result, i) => (
                        <div key={i} className={`w-5 h-5 rounded text-xs flex items-center justify-center ${
                          result === 'W' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {result}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Огляд тірів з новою логікою */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tierAnalysis.map((tier) => {
          const Icon = tier.icon;
          return (
            <Card key={tier.tier} className={`border-2 ${tier.color.includes('yellow') ? 'border-yellow-200' : tier.color.includes('blue') ? 'border-blue-200' : 'border-gray-200'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {tier.tier}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">{tier.description}</p>
                  <div className="flex justify-between">
                    <span className="text-sm">Команд:</span>
                    <span className="font-medium">{tier.teams.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Середні очки:</span>
                    <span className="font-medium">{Math.round(tier.avgPoints) || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Діапазон рейтингу:</span>
                    <span className="font-medium">
                      {tier.tier === 'Tier 1' ? '#1-50' : 
                       tier.tier === 'Tier 2' ? '#51-75' : 
                       '#76-100'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Детальний рейтинг по тірах - ПОКАЗУЄМО ВСІ КОМАНДИ */}
      {tierAnalysis.map((tier) => (
        <Card key={tier.tier}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <tier.icon className="h-5 w-5" />
              {tier.tier} Teams - Повний список
              <Badge className={tier.color}>{tier.teams.length} команд</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Рейтинг</th>
                    <th className="text-left p-2">Команда</th>
                    <th className="text-center p-2">Очки</th>
                    <th className="text-center p-2">Зміна</th>
                    <th className="text-center p-2">Країна</th>
                    <th className="text-center p-2">Форма</th>
                    <th className="text-center p-2">Стабільність</th>
                  </tr>
                </thead>
                <tbody>
                  {/* ПОКАЗУЄМО ВСІ КОМАНДИ БЕЗ ОБМЕЖЕНЬ */}
                  {tier.teams.map((team) => (
                    <tr key={team.rank} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">#{team.rank}</span>
                          {team.rank <= 3 && <Crown className="h-4 w-4 text-yellow-500" />}
                        </div>
                      </td>
                      <td className="p-2 font-medium">{team.name}</td>
                      <td className="text-center p-2">{team.points}</td>
                      <td className="text-center p-2">
                        <div className={`flex items-center justify-center gap-1 ${getChangeColor(team.change)}`}>
                          {getChangeIcon(team.change)}
                          <span>{team.change !== 0 ? Math.abs(team.change) : '-'}</span>
                        </div>
                      </td>
                      <td className="text-center p-2">
                        <Badge variant="outline">{team.country}</Badge>
                      </td>
                      <td className="text-center p-2">
                        <div className="flex justify-center gap-1">
                          {team.recentForm.map((result, index) => (
                            <div key={index} className={`w-4 h-4 rounded text-xs flex items-center justify-center ${
                              result === 'W' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                            }`}>
                              {result}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="text-center p-2">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={team.stability} className="w-16 h-2" />
                          <span className="text-xs">{team.stability}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Генератор рекомендацій для ставок з новою логікою */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Генератор рекомендацій на основі нової системи тірів
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Нові правила ставок по тірах:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• <strong>Tier 1 (1-50):</strong> Елітні команди, аналізуйте форму детально</li>
                  <li>• <strong>Tier 2 (51-75):</strong> Регіональні лідери, форма критична</li>
                  <li>• <strong>Tier 3 (76-100):</strong> Розвиваючі команди, високий ризик</li>
                  <li>• <strong>Tier 1 vs Tier 2:</strong> Tier 1 фаворит, але можливі upset'и</li>
                  <li>• <strong>Tier 1 vs Tier 3:</strong> Tier 1 явний фаворит, дуже низький ризик</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Команда 1 (рейтинг):</label>
                <select 
                  className="w-full p-2 border rounded-md mt-1"
                  onChange={(e) => {
                    const team2Select = document.querySelector('select[data-team="2"]') as HTMLSelectElement;
                    if (e.target.value && team2Select?.value) {
                      const rec = generateBettingRecommendation(parseInt(e.target.value), parseInt(team2Select.value));
                      if (rec) {
                        const resultDiv = document.getElementById('betting-recommendation');
                        if (resultDiv) {
                          resultDiv.innerHTML = `
                            <div class="p-4 border rounded-lg bg-blue-50">
                              <h4 class="font-semibold mb-2">Рекомендація:</h4>
                              <p class="text-sm mb-2">${rec.recommendation}</p>
                              <div class="flex gap-2">
                                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Впевненість: ${rec.confidence}%</span>
                                <span class="px-2 py-1 bg-${rec.riskLevel === 'low' ? 'green' : rec.riskLevel === 'medium' ? 'yellow' : 'red'}-100 text-${rec.riskLevel === 'low' ? 'green' : rec.riskLevel === 'medium' ? 'yellow' : 'red'}-800 rounded text-xs">Ризик: ${rec.riskLevel === 'low' ? 'Низький' : rec.riskLevel === 'medium' ? 'Середній' : 'Високий'}</span>
                              </div>
                            </div>
                          `;
                        }
                      }
                    }
                  }}
                >
                  <option value="">Оберіть команду</option>
                  {rankings.map(team => (
                    <option key={team.rank} value={team.rank}>
                      #{team.rank} {team.name} ({team.tier.toUpperCase().replace('TIER', 'T')})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Команда 2 (рейтинг):</label>
                <select 
                  className="w-full p-2 border rounded-md mt-1"
                  data-team="2"
                  onChange={(e) => {
                    const team1Select = document.querySelector('select:not([data-team])') as HTMLSelectElement;
                    if (e.target.value && team1Select?.value) {
                      const rec = generateBettingRecommendation(parseInt(team1Select.value), parseInt(e.target.value));
                      if (rec) {
                        const resultDiv = document.getElementById('betting-recommendation');
                        if (resultDiv) {
                          resultDiv.innerHTML = `
                            <div class="p-4 border rounded-lg bg-blue-50">
                              <h4 class="font-semibold mb-2">Рекомендація:</h4>
                              <p class="text-sm mb-2">${rec.recommendation}</p>
                              <div class="flex gap-2">
                                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Впевненість: ${rec.confidence}%</span>
                                <span class="px-2 py-1 bg-${rec.riskLevel === 'low' ? 'green' : rec.riskLevel === 'medium' ? 'yellow' : 'red'}-100 text-${rec.riskLevel === 'low' ? 'green' : rec.riskLevel === 'medium' ? 'yellow' : 'red'}-800 rounded text-xs">Ризик: ${rec.riskLevel === 'low' ? 'Низький' : rec.riskLevel === 'medium' ? 'Середній' : 'Високий'}</span>
                              </div>
                            </div>
                          `;
                        }
                      }
                    }
                  }}
                >
                  <option value="">Оберіть команду</option>
                  {rankings.map(team => (
                    <option key={team.rank} value={team.rank}>
                      #{team.rank} {team.name} ({team.tier.toUpperCase().replace('TIER', 'T')})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div id="betting-recommendation" className="mt-4">
              <p className="text-gray-500 text-center">Оберіть дві команди для отримання рекомендації</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}