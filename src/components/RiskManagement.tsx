import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  DollarSign,
  Percent,
  Target,
  BarChart3,
  Calculator,
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { Bet } from '@/types/betting';

interface RiskManagementProps {
  bets: Bet[];
}

interface RiskyTeam {
  id: string;
  name: string;
  comment: string;
  riskLevel: 'high' | 'medium' | 'low';
  dateAdded: string;
}

interface RiskMetrics {
  maxDrawdown: number;
  currentDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  valueAtRisk: number;
  kellyPercentage: number;
  riskOfRuin: number;
  consecutiveLosses: number;
  averageStake: number;
  maxStake: number;
  bankrollGrowth: number;
  largestLoss: number;
  winStreakRisk: number;
}

interface DrawdownPeriod {
  start: string;
  end: string;
  duration: number;
  maxDrawdown: number;
  recovery: boolean;
}

// Список ризикованих команд з коментарями (ваші команди)
const DEFAULT_RISKY_TEAMS: RiskyTeam[] = [
  {
    id: 'fish123',
    name: 'Fish123',
    comment: '(Раки - Не на загальну перемогу, тільки на вибіркові карти)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'tyloo',
    name: 'Tyloo',
    comment: '(Рідко коли вистрілює як команда - хіба проти слабких опонентів)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'mouzdota2',
    name: 'MouzDota2',
    comment: '(Раки - краще не варто взагалі на цю команду дивтись)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'b8',
    name: 'B8',
    comment: '(Проти сильніших команд - краще не варто ставити - але на 1 карту з форою можна взяти )',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'furia',
    name: 'Furia',
    comment: '(Не на загальну перемогу, тільки на вибіркові карти - коли фурія програє 0-1 тоді можна на неї поставити)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'virtuspro',
    name: 'Virtuspro',
    comment: '(Раки - дуже рідко на них варто щось ставити хіба якийст вийняток)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'liquid',
    name: 'Liquid',
    comment: '(Поки не дуже стабільна, але можна ставити проти слабших команд)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'monte',
    name: 'Monte',
    comment: '(Раки - дуже рідко на них варто щось ставити хіба якийсь вийняток - також варто пропускати матчі коли вони грають з рівними командами то супер рандом)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'astralis',
    name: 'Astralis',
    comment: '(Максимально нестабільні - Не на загальну перемогу, тільки на вибіркові карти - і то проти слабших команд, проти рівних вони ледь виивозять. Не виправданий ризик)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'falcons',
    name: 'Falcons',
    comment: '(Хіба проти слабших команд, на 3 карту не варто ставити на них - хіба якщо програють 0-1 тоді можна одну карту від них)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'bestia',
    name: 'Bestia',
    comment: '(Раки - краще не варто взагалі на цю команду дивтись - не стабільна команда)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'g2areas',
    name: 'G2Areas',
    comment: '(Хіба проти слабких команд і то якщо програють одну карту ставити на них з форою)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'mongolz',
    name: 'The Mongolz',
    comment: '(Не на плей ін серію, вони там без шансів відлітають, тільки на стадії відборів)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'navi',
    name: 'Natus Vincere',
    comment: '(Хіба проти слабких команд і то якщо програють одну карту ставити на них з форою)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'vitality',
    name: 'Vitality',
    comment: '( Вони не стабільні! Не ставити коли вони грають в плей ін (пів фінали - фінали)) Не ставити проти - Маузів, Монголів )',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'eternal',
    name: 'Eternal',
    comment: '(Раки - краще не варто взагалі на цю команду дивтись - нестабільна команда)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'passion',
    name: 'Passion Ua',
    comment: '(Раки - Хіба проти слабших команд - не варто ставити на них, хіба якщо програють 0-1 тоді можна одну карту від них і то якщо їх пік)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'nexus',
    name: 'Nexus',
    comment: '(Раки - хіба проти слабких команд і то якщо програють одну карту ставити на них з форою)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'oddik',
    name: 'Oddik',
    comment: '(Раки - Не на загальну перемогу, тільки на вибіркові карти, але краще проти них ставити)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: '9z',
    name: '9Z',
    comment: '(Не на загальну перемогу, тільки на вибіркові карти - у фіналі або пів фіналах виглядають - нестабільні)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'mibr',
    name: 'Mibr',
    comment: '(Раки - На тір 1 взагалі нічого не можуть - можна взяти коли грають локальні бразільські матчі а так то не варто на них дивитись)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'parivision',
    name: 'Parivision',
    comment: '(Не на загальну перемогу, тільки на вибіркові карту Даст - поки не дуже стабільні)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'tnl',
    name: 'Tnl',
    comment: '(Раки - грають дуже агресивно і проти трішки кращих команд то ніколи не працює - хіба проти слабких команд)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'betclic',
    name: 'Betclic',
    comment: '(Раки - Дуже не стабільна команда)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'sangal',
    name: 'Sangal',
    comment: '(Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'ence',
    name: 'Ence',
    comment: '(Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'spirit_academy',
    name: 'Spirit Academy',
    comment: '(Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору +4.5)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'nemiga',
    name: 'Nemiga',
    comment: '(Раки - краще не варто взагалі на цю команду дивтись - нестабільна команда)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'fut',
    name: 'Fut',
    comment: '(Хіба проти ноунейм команд і то якщо програють одну карту ставити на них з форою)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'fluxo',
    name: 'Fluxo',
    comment: '(Хіба проти ноунейм команд - краще на загальну перемогу брати)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'dota2_spirit',
    name: 'Дота2(Спіріт)',
    comment: '( Не ставити коли вони грають в плей ін (фінал) Не ставити, коли грають проти - Фальконів)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'zeroten',
    name: 'ZeroTen',
    comment: '(Раки - краще не варто взагалі на цю команду дивтись - нестабільна команда)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'eclot',
    name: 'Eclot',
    comment: '(Раки - краще не варто взагалі на цю команду дивтись - нестабільна команда)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'fnatic',
    name: 'Fnatic',
    comment: '(Хіба проти слабких команд і то якщо програють одну карту ставити на них з форою)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'mouz',
    name: 'Mouz',
    comment: '(Хіба проти слабких команд і то якщо програють одну карту ставити на них з форою)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'cph_wolves',
    name: 'Cph Wolves',
    comment: '(Хіба проти слабких команд і то якщо програють одну карту ставити на них з форою)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'amkal',
    name: 'Amkal',
    comment: '(Раки - краще не варто взагалі на цю команду дивтись - нестабільна команда)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'wopa',
    name: 'Wopa',
    comment: '(Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'big',
    name: 'Big',
    comment: '(Хіба проти слабких команд і то краще з форою)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'm80',
    name: 'M80',
    comment: '(Раки - краще не варто взагалі на цю команду дивтись - нестабільна команда, але все ж якщо то ставити на них тільки з форою +3.5 і більше)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'nip',
    name: 'Ninjas In Pyjamas',
    comment: '(Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'g2',
    name: 'G2',
    comment: '(Не стабільні, краще брати проти них, коли грають проти сильніших команд)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: '3dmax',
    name: '3Dmax',
    comment: '(Раки - краще не варто взагалі на цю команду дивтись - нестабільна команда, але все ж якщо то ставити на них тільки з форою +3.5 і більше)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'aurora',
    name: 'Aurora',
    comment: '(Не стабільні!Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'nrg',
    name: 'Nrg',
    comment: '(Не стабільні! Не на загальну перемогу, тільки на мейн карту і то тільки на фору)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'inner_circle',
    name: 'Inner Circle',
    comment: '(Не на загальну перемогу, тільки на мейн карту і то тільки на фору) Агресивно грають і переважно це не працює - а далі в них ідеї нема якщо агресія валиться',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'gamerlegion',
    name: 'Gamerlegion',
    comment: '(Не на загальну перемогу, якщо виграють першу карту то варто 2 від них скіпнути)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'legacy',
    name: 'Legacy',
    comment: '(Не дуже стабільні - можуть взяти в хороший день проти топ1, але більшість ігор програють і не варто на них ставити)',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'galorys',
    name: 'Galorys',
    comment: '(Команда рандом - краще уникати її)',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'johnny_speeds',
    name: 'Johnny Speeds',
    comment: 'На загальну перемогу не варто, а от одну карту від них можна',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'gun5',
    name: 'Gun5',
    comment: 'На загальну перемогу не варто, а от одну карту від них можна',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'zero_tenacity',
    name: 'Zero Tenacity',
    comment: '(Команда рандом - краще уникати її - хіба проти них якщо грають проти рівних собі команд )',
    riskLevel: 'high',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'sinners',
    name: 'Sinners',
    comment: 'На загальну перемогу не варто, а от одну карту від них можна',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'cybershoke',
    name: 'Cybershoke',
    comment: 'Не дуже стабільна команда якщо грають проти рівної команди можна взяти онду карту',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'favbet_team',
    name: 'Favbet',
    comment: 'Не дуже стабільна команда якщо грають проти рівної команди можна взяти онду карту',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'faze',
    name: 'Faze',
    comment: 'Команда рандом я б сказав - краще не ставити на них коли вони грають проти рівних команд',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: '9ine',
    name: '9Ine',
    comment: 'Не на загальну від них - тільки на мейн карту і то якщо брати тільки з форою',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  },
  {
    id: 'ecstatic',
    name: 'Ecstatic',
    comment: 'Не на загальну від них - тільки на мейн карту і то якщо брати тільки з форою',
    riskLevel: 'medium',
    dateAdded: new Date().toISOString()
  }
];

export default function RiskManagement({ bets }: RiskManagementProps) {
  const [bankroll, setBankroll] = useState(10000);
  const [riskTolerance, setRiskTolerance] = useState(2);
  const [maxStakePercent, setMaxStakePercent] = useState(5);
  
  // Ризиковані команди
  const [riskyTeams, setRiskyTeams] = useState<RiskyTeam[]>([]);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [newTeam, setNewTeam] = useState({ name: '', comment: '', riskLevel: 'medium' as const });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadRiskyTeams();
  }, []);

  const loadRiskyTeams = () => {
    try {
      const saved = localStorage.getItem('riskyTeams');
      if (saved) {
        const savedTeams = JSON.parse(saved);
        // Якщо збережених команд немає або їх менше 10, завантажуємо дефолтні
        if (savedTeams.length < 10) {
          setRiskyTeams(DEFAULT_RISKY_TEAMS);
          localStorage.setItem('riskyTeams', JSON.stringify(DEFAULT_RISKY_TEAMS));
        } else {
          setRiskyTeams(savedTeams);
        }
      } else {
        // Завантажуємо всі ваші команди як дефолтні
        setRiskyTeams(DEFAULT_RISKY_TEAMS);
        localStorage.setItem('riskyTeams', JSON.stringify(DEFAULT_RISKY_TEAMS));
      }
    } catch (error) {
      console.error('Error loading risky teams:', error);
      // Fallback до дефолтних команд
      setRiskyTeams(DEFAULT_RISKY_TEAMS);
      localStorage.setItem('riskyTeams', JSON.stringify(DEFAULT_RISKY_TEAMS));
    }
  };

  const saveRiskyTeams = (teams: RiskyTeam[]) => {
    try {
      localStorage.setItem('riskyTeams', JSON.stringify(teams));
      setRiskyTeams(teams);
    } catch (error) {
      console.error('Error saving risky teams:', error);
    }
  };

  const addRiskyTeam = () => {
    if (!newTeam.name.trim()) return;
    
    const team: RiskyTeam = {
      id: Date.now().toString(),
      name: newTeam.name.trim(),
      comment: newTeam.comment.trim(),
      riskLevel: newTeam.riskLevel,
      dateAdded: new Date().toISOString()
    };
    
    const updatedTeams = [...riskyTeams, team];
    saveRiskyTeams(updatedTeams);
    setNewTeam({ name: '', comment: '', riskLevel: 'medium' });
    setShowAddForm(false);
  };

  const updateRiskyTeam = (id: string, updates: Partial<RiskyTeam>) => {
    const updatedTeams = riskyTeams.map(team => 
      team.id === id ? { ...team, ...updates } : team
    );
    saveRiskyTeams(updatedTeams);
    setEditingTeam(null);
  };

  const deleteRiskyTeam = (id: string) => {
    const updatedTeams = riskyTeams.filter(team => team.id !== id);
    saveRiskyTeams(updatedTeams);
  };

  // Filter completed bets
  const completedBets = useMemo(() => 
    bets.filter(bet => bet.result && bet.result !== 'Pending'), 
    [bets]
  );

  // Calculate risk metrics
  const riskMetrics = useMemo((): RiskMetrics => {
    if (completedBets.length === 0) {
      return {
        maxDrawdown: 0,
        currentDrawdown: 0,
        sharpeRatio: 0,
        volatility: 0,
        valueAtRisk: 0,
        kellyPercentage: 0,
        riskOfRuin: 0,
        consecutiveLosses: 0,
        averageStake: 0,
        maxStake: 0,
        bankrollGrowth: 0,
        largestLoss: 0,
        winStreakRisk: 0
      };
    }

    // Calculate running balance and drawdowns
    let runningBalance = bankroll;
    let peak = bankroll;
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    let consecutiveLosses = 0;
    let maxConsecutiveLosses = 0;
    let currentLossStreak = 0;

    const balanceHistory: number[] = [bankroll];
    const returns: number[] = [];
    const stakes: number[] = [];

    completedBets.forEach(bet => {
      const profit = bet.profit || 0;
      const stake = bet.stake || 0;
      
      runningBalance += profit;
      balanceHistory.push(runningBalance);
      
      if (stake > 0) {
        returns.push(profit / stake);
        stakes.push(stake);
      }

      // Track peak and drawdown
      if (runningBalance > peak) {
        peak = runningBalance;
      }
      
      const currentDD = (peak - runningBalance) / peak * 100;
      if (currentDD > maxDrawdown) {
        maxDrawdown = currentDD;
      }

      // Track consecutive losses
      if (bet.result === 'Loss') {
        currentLossStreak++;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLossStreak);
      } else {
        currentLossStreak = 0;
      }
    });

    // Current drawdown
    currentDrawdown = (peak - runningBalance) / peak * 100;

    // Calculate volatility (standard deviation of returns)
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const variance = returns.length > 0 ? 
      returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length : 0;
    const volatility = Math.sqrt(variance) * 100;

    // Calculate Sharpe ratio (assuming risk-free rate of 2%)
    const riskFreeRate = 0.02;
    const sharpeRatio = volatility > 0 ? (avgReturn - riskFreeRate) / (volatility / 100) : 0;

    // Calculate Value at Risk (95% confidence)
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const varIndex = Math.floor(sortedReturns.length * 0.05);
    const valueAtRisk = sortedReturns.length > 0 ? Math.abs(sortedReturns[varIndex] || 0) * 100 : 0;

    // Simple Kelly Criterion calculation
    const winRate = completedBets.filter(bet => bet.result === 'Win').length / completedBets.length;
    const avgWinReturn = returns.filter(r => r > 0).reduce((a, b) => a + b, 0) / returns.filter(r => r > 0).length || 0;
    const avgLossReturn = Math.abs(returns.filter(r => r < 0).reduce((a, b) => a + b, 0) / returns.filter(r => r < 0).length || 0);
    
    const kellyPercentage = avgLossReturn > 0 ? 
      Math.max(0, (winRate * avgWinReturn - (1 - winRate) * avgLossReturn) / avgWinReturn * 100) : 0;

    // Risk of Ruin calculation (simplified)
    const riskOfRuin = winRate < 0.5 ? 
      Math.min(100, Math.pow((1 - winRate) / winRate, bankroll / (stakes.reduce((a, b) => a + b, 0) / stakes.length || 1)) * 100) : 0;

    // Largest loss
    const largestLoss = Math.abs(Math.min(...returns.map(r => r * (stakes.reduce((a, b) => a + b, 0) / stakes.length || 0))));

    // Win streak risk (probability of overconfidence)
    const winStreaks = [];
    let currentWinStreak = 0;
    completedBets.forEach(bet => {
      if (bet.result === 'Win') {
        currentWinStreak++;
      } else {
        if (currentWinStreak > 0) {
          winStreaks.push(currentWinStreak);
          currentWinStreak = 0;
        }
      }
    });
    const avgWinStreak = winStreaks.length > 0 ? winStreaks.reduce((a, b) => a + b, 0) / winStreaks.length : 0;
    const winStreakRisk = avgWinStreak > 5 ? Math.min(100, avgWinStreak * 10) : 0;

    return {
      maxDrawdown: isFinite(maxDrawdown) ? Number(maxDrawdown.toFixed(2)) : 0,
      currentDrawdown: isFinite(currentDrawdown) ? Number(Math.max(0, currentDrawdown).toFixed(2)) : 0,
      sharpeRatio: isFinite(sharpeRatio) ? Number(sharpeRatio.toFixed(2)) : 0,
      volatility: isFinite(volatility) ? Number(volatility.toFixed(2)) : 0,
      valueAtRisk: isFinite(valueAtRisk) ? Number(valueAtRisk.toFixed(2)) : 0,
      kellyPercentage: isFinite(kellyPercentage) ? Number(kellyPercentage.toFixed(2)) : 0,
      riskOfRuin: isFinite(riskOfRuin) ? Number(riskOfRuin.toFixed(2)) : 0,
      consecutiveLosses: maxConsecutiveLosses,
      averageStake: stakes.length > 0 ? Number((stakes.reduce((a, b) => a + b, 0) / stakes.length).toFixed(2)) : 0,
      maxStake: stakes.length > 0 ? Math.max(...stakes) : 0,
      bankrollGrowth: isFinite((runningBalance - bankroll) / bankroll * 100) ? Number(((runningBalance - bankroll) / bankroll * 100).toFixed(2)) : 0,
      largestLoss: isFinite(largestLoss) ? Number(largestLoss.toFixed(2)) : 0,
      winStreakRisk: isFinite(winStreakRisk) ? Number(winStreakRisk.toFixed(2)) : 0
    };
  }, [completedBets, bankroll]);

  // Calculate drawdown periods
  const drawdownPeriods = useMemo((): DrawdownPeriod[] => {
    if (completedBets.length === 0) return [];

    let runningBalance = bankroll;
    let peak = bankroll;
    let drawdownStart: string | null = null;
    let maxDrawdownInPeriod = 0;
    const periods: DrawdownPeriod[] = [];

    completedBets.forEach((bet, index) => {
      const profit = bet.profit || 0;
      runningBalance += profit;

      if (runningBalance > peak) {
        // End of drawdown period
        if (drawdownStart) {
          periods.push({
            start: drawdownStart,
            end: bet.date,
            duration: index - completedBets.findIndex(b => b.date === drawdownStart),
            maxDrawdown: maxDrawdownInPeriod,
            recovery: true
          });
          drawdownStart = null;
          maxDrawdownInPeriod = 0;
        }
        peak = runningBalance;
      } else if (runningBalance < peak) {
        // In drawdown
        if (!drawdownStart) {
          drawdownStart = bet.date;
        }
        const currentDrawdown = (peak - runningBalance) / peak * 100;
        maxDrawdownInPeriod = Math.max(maxDrawdownInPeriod, currentDrawdown);
      }
    });

    // Handle ongoing drawdown
    if (drawdownStart) {
      periods.push({
        start: drawdownStart,
        end: completedBets[completedBets.length - 1]?.date || '',
        duration: completedBets.length - completedBets.findIndex(b => b.date === drawdownStart),
        maxDrawdown: maxDrawdownInPeriod,
        recovery: false
      });
    }

    return periods.sort((a, b) => b.maxDrawdown - a.maxDrawdown).slice(0, 5);
  }, [completedBets, bankroll]);

  // Risk level assessment
  const getRiskLevel = () => {
    const { maxDrawdown, volatility, riskOfRuin } = riskMetrics;
    
    if (maxDrawdown > 20 || volatility > 30 || riskOfRuin > 10) {
      return { level: 'high', color: 'text-red-600', bgColor: 'bg-red-50' };
    } else if (maxDrawdown > 10 || volatility > 20 || riskOfRuin > 5) {
      return { level: 'medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    } else {
      return { level: 'low', color: 'text-green-600', bgColor: 'bg-green-50' };
    }
  };

  const riskLevel = getRiskLevel();

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high': return { variant: 'destructive' as const, text: 'Високий ризик' };
      case 'medium': return { variant: 'secondary' as const, text: 'Помірний ризик' };
      default: return { variant: 'default' as const, text: 'Низький ризик' };
    }
  };

  const getTeamRiskBadge = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return { variant: 'destructive' as const, text: 'Високий' };
      case 'medium': return { variant: 'secondary' as const, text: 'Середній' };
      default: return { variant: 'default' as const, text: 'Низький' };
    }
  };

  const volatilityLevel = riskMetrics.volatility > 30 ? 'high' : riskMetrics.volatility > 20 ? 'medium' : 'low';
  const riskOfRuinLevel = riskMetrics.riskOfRuin > 15 ? 'high' : riskMetrics.riskOfRuin > 5 ? 'medium' : 'low';

  return (
    <div className="space-y-6">
      {/* Risk Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Рівень ризику</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${riskLevel.color}`}>
              {riskLevel.level === 'high' ? 'Високий' : riskLevel.level === 'medium' ? 'Середній' : 'Низький'}
            </div>
            <div className={`text-xs px-2 py-1 rounded-full mt-2 ${riskLevel.bgColor} ${riskLevel.color}`}>
              Поточна оцінка
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Макс. просадка</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {riskMetrics.maxDrawdown}%
            </div>
            <p className="text-xs text-muted-foreground">
              Максимальне падіння від піку
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Коефіцієнт Шарпа</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riskMetrics.sharpeRatio}</div>
            <p className="text-xs text-muted-foreground">
              {riskMetrics.sharpeRatio > 1 ? 'Відмінно' : 
               riskMetrics.sharpeRatio > 0.5 ? 'Добре' : 
               riskMetrics.sharpeRatio > 0 ? 'Задовільно' : 'Погано'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Волатильність</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riskMetrics.volatility}%</div>
            <Badge className={`mt-2 ${getRiskColor(volatilityLevel)}`}>
              {volatilityLevel === 'low' ? 'Стабільно' : 
               volatilityLevel === 'medium' ? 'Помірно' : 'Нестабільно'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Risk Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Налаштування ризик-менеджменту
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="bankroll">Поточний банкрол (₴)</Label>
              <Input
                id="bankroll"
                type="number"
                value={bankroll}
                onChange={(e) => setBankroll(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="risk">Толерантність до ризику (%)</Label>
              <Input
                id="risk"
                type="number"
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(Number(e.target.value))}
                min="0.5"
                max="10"
                step="0.5"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="maxStake">Макс. ставка від банкролу (%)</Label>
              <Input
                id="maxStake"
                type="number"
                value={maxStakePercent}
                onChange={(e) => setMaxStakePercent(Number(e.target.value))}
                min="1"
                max="20"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ризиковані команди */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Ризиковані команди ({riskyTeams.length})
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Додати команду
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Форма додавання нової команди */}
            {showAddForm && (
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold mb-3">Додати ризиковану команду</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Назва команди:</label>
                    <Input
                      value={newTeam.name}
                      onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                      placeholder="Введіть назву команди..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Коментар:</label>
                    <Textarea
                      value={newTeam.comment}
                      onChange={(e) => setNewTeam({ ...newTeam, comment: e.target.value })}
                      placeholder="Чому ця команда ризикована..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Рівень ризику:</label>
                    <select
                      value={newTeam.riskLevel}
                      onChange={(e) => setNewTeam({ ...newTeam, riskLevel: e.target.value as 'high' | 'medium' | 'low' })}
                      className="w-full p-2 border rounded-md mt-1"
                    >
                      <option value="low">Низький</option>
                      <option value="medium">Середній</option>
                      <option value="high">Високий</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addRiskyTeam}>
                      <Save className="h-4 w-4 mr-2" />
                      Зберегти
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setShowAddForm(false);
                        setNewTeam({ name: '', comment: '', riskLevel: 'medium' });
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Скасувати
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Список ризикованих команд */}
            <div className="max-h-96 overflow-y-auto space-y-3">
              {riskyTeams.map((team) => (
                <div key={team.id} className="p-4 border rounded-lg">
                  {editingTeam === team.id ? (
                    <EditTeamForm 
                      team={team}
                      onSave={(updates) => updateRiskyTeam(team.id, updates)}
                      onCancel={() => setEditingTeam(null)}
                    />
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{team.name}</h4>
                          <Badge variant={getTeamRiskBadge(team.riskLevel).variant}>
                            {getTeamRiskBadge(team.riskLevel).text}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{team.comment}</p>
                        <p className="text-xs text-gray-400">
                          Додано: {new Date(team.dateAdded).toLocaleDateString('uk-UA')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTeam(team.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteRiskyTeam(team.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {riskyTeams.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Немає ризикованих команд</p>
                <p className="text-sm">Додайте команди, на які варто звернути увагу</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Risk Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Детальні ризик-метрики</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Поточна просадка:</span>
              <span className="font-bold">{riskMetrics.currentDrawdown}%</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Послідовні програші:</span>
              <span className="font-bold">{riskMetrics.consecutiveLosses}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Середня ставка:</span>
              <span className="font-bold">{riskMetrics.averageStake} ₴</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Найбільший програш:</span>
              <span className="font-bold text-red-600">{riskMetrics.largestLoss} ₴</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Келлі %:</span>
              <span className={`font-bold ${riskMetrics.kellyPercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {riskMetrics.kellyPercentage}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Ризик виграшних серій:</span>
              <span className="font-bold">{riskMetrics.winStreakRisk}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Періоди просадок</CardTitle>
          </CardHeader>
          <CardContent>
            {drawdownPeriods.length > 0 ? (
              <div className="space-y-3">
                {drawdownPeriods.map((period, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">
                        {new Date(period.start).toLocaleDateString('uk-UA')} - {new Date(period.end).toLocaleDateString('uk-UA')}
                      </span>
                      <Badge variant={period.recovery ? 'default' : 'destructive'}>
                        {period.recovery ? 'Відновлено' : 'Поточна'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Тривалість: {period.duration} днів</span>
                      <span className="font-medium text-red-600">-{period.maxDrawdown.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">Немає значних періодів просадок</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Risk Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Рекомендації з управління ризиками
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 text-green-700">Позитивні аспекти</h4>
              <div className="space-y-2">
                {riskMetrics.maxDrawdown < 15 && (
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 text-xs mt-1">✓</span>
                    <span className="text-sm">Низька максимальна просадка ({riskMetrics.maxDrawdown}%)</span>
                  </div>
                )}
                {riskMetrics.sharpeRatio > 0.5 && (
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 text-xs mt-1">✓</span>
                    <span className="text-sm">Хороший коефіцієнт Шарпа ({riskMetrics.sharpeRatio})</span>
                  </div>
                )}
                {riskMetrics.riskOfRuin < 10 && (
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 text-xs mt-1">✓</span>
                    <span className="text-sm">Низький ризик краху ({riskMetrics.riskOfRuin}%)</span>
                  </div>
                )}
                {riskMetrics.consecutiveLosses < 5 && (
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 text-xs mt-1">✓</span>
                    <span className="text-sm">Контрольовані послідовні програші</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3 text-red-700">Області для покращення</h4>
              <div className="space-y-2">
                {riskMetrics.maxDrawdown > 25 && (
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 text-xs mt-1">⚠</span>
                    <span className="text-sm">Висока максимальна просадка - зменшіть розміри ставок</span>
                  </div>
                )}
                {riskMetrics.volatility > 30 && (
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 text-xs mt-1">⚠</span>
                    <span className="text-sm">Висока волатільність - диверсифікуйте стратегії</span>
                  </div>
                )}
                {riskMetrics.riskOfRuin > 15 && (
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 text-xs mt-1">⚠</span>
                    <span className="text-sm">Високий ризик краху - перегляньте управління капіталом</span>
                  </div>
                )}
                {riskMetrics.consecutiveLosses > 7 && (
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 text-xs mt-1">⚠</span>
                    <span className="text-sm">Довгі серії програшів - встановіть стоп-лосси</span>
                  </div>
                )}
                {riskMetrics.kellyPercentage < 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 text-xs mt-1">⚠</span>
                    <span className="text-sm">Негативний Келлі % - перегляньте стратегію</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Alerts */}
      {(riskMetrics.currentDrawdown > 15 || riskMetrics.consecutiveLosses > 5) && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Попередження про ризик:</strong>
            {riskMetrics.currentDrawdown > 15 && ` Поточна просадка ${riskMetrics.currentDrawdown}% перевищує рекомендований поріг.`}
            {riskMetrics.consecutiveLosses > 5 && ` ${riskMetrics.consecutiveLosses} послідовних програшів вказують на необхідність перегляду стратегії.`}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Компонент для редагування команди
function EditTeamForm({ 
  team, 
  onSave, 
  onCancel 
}: { 
  team: RiskyTeam; 
  onSave: (updates: Partial<RiskyTeam>) => void; 
  onCancel: () => void; 
}) {
  const [editData, setEditData] = useState({
    name: team.name,
    comment: team.comment,
    riskLevel: team.riskLevel
  });

  const handleSave = () => {
    onSave(editData);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Назва команди:</label>
        <Input
          value={editData.name}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Коментар:</label>
        <Textarea
          value={editData.comment}
          onChange={(e) => setEditData({ ...editData, comment: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Рівень ризику:</label>
        <select
          value={editData.riskLevel}
          onChange={(e) => setEditData({ ...editData, riskLevel: e.target.value as 'high' | 'medium' | 'low' })}
          className="w-full p-2 border rounded-md mt-1"
        >
          <option value="low">Низький</option>
          <option value="medium">Середній</option>
          <option value="high">Високий</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Зберегти
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Скасувати
        </Button>
      </div>
    </div>
  );
}