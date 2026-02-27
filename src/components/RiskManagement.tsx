import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Target,
  BarChart3,
  Plus,
  Trash2,
  Search,
  Info,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  Calendar,
  Pencil,
  Check,
  X,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import type { Bet } from '@/types/betting';
import { googleSheetsRiskyTeamsService } from '@/lib/googleSheetsRiskyTeams';
import { toast } from 'sonner';

interface RiskManagementProps {
  bets: Bet[];
}

interface RiskyTeam {
  name: string;
  game: string;
  status: string;
  notes: string;
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

const INITIAL_RISKY_TEAMS: RiskyTeam[] = [
  { name: 'Liquid', game: 'CS', status: 'БАН', notes: '' },
  { name: 'Fish123', game: 'CS', status: 'БАН', notes: '' },
  { name: 'Passion Ua', game: 'CS', status: 'БАН', notes: '' },
  { name: 'Nemiga', game: 'CS', status: 'БАН', notes: '' },
  { name: 'Team Falcons', game: 'Дота', status: 'БАН', notes: 'В якій би не були вони формі, ніколи на них не ставити!!!!' },
  { name: 'Tyloo', game: 'CS', status: 'Рідко', notes: 'Рідко коли вистрілює як команда - хіба проти слабких опонентів' },
  { name: 'Mouz', game: 'Дота', status: 'Обережно', notes: 'Одну карту від них можна брати з форою +1.5. Не можна на них ставити коли грають у плей ін, тільки стадія відбору!' },
  { name: 'Parivision', game: 'Дота', status: 'Обережно', notes: 'Одну карту від них можна брати з форою +1.5, але ризиковано коли грають проти рівних команд. Уникати коли грають проти: 1.BB' },
  { name: 'Tundra', game: 'Дота', status: 'Обережно', notes: 'Одну карту від них можна брати з форою +1.5. Уникати коли грають проти: Xtreme Gaming' },
  { name: 'Aurora', game: 'Дота', status: 'БАН', notes: 'Уникати цю команду' },
  { name: 'Team Spirit', game: 'Дота', status: 'Обережно', notes: 'Не на загальну перемогу, тому тільки на +1.5, це команда клоунів і тому ризик того не вартий. Не ставити коли вони грають проти: Парі - BB - Falcons' },
  { name: 'B8', game: 'CS', status: 'Обережно', notes: 'Проти сильніших команд - краще не варто ставити - але на 1 карту з форою можна взяти' },
  { name: 'Furia', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти' },
  { name: 'Virtuspro', game: 'CS', status: 'БАН', notes: 'Раки - дуже рідко на них варто щось ставити хіба якийсь виняток' },
  { name: 'Monte', game: 'CS', status: 'БАН', notes: 'Раки - дуже рідко на них варто щось ставити хіба якийсь виняток - також варто пропускати матчі коли вони грають з рівними командами' },
  { name: 'Astralis', game: 'CS', status: 'Нестабільні', notes: 'Максимально нестабільні - Не на загальну перемогу, тільки на вибіркові карти - і то проти слабших команд, проти рівних вони ледь вивозять. Не виправданий ризик' },
  { name: 'Falcons', game: 'CS', status: 'Обережно', notes: 'Не ставити на них, коли грають фінал! Не дуже стабільна команда - якщо програють 1 карту то 2 можна взяти від них фору раундів, але краще брати +1.5' },
  { name: 'Bestia', game: 'CS', status: 'БАН', notes: 'Раки - краще не варто взагалі на цю команду дивитись - не стабільна команда' },
  { name: 'G2Areas', game: 'CS', status: 'Обережно', notes: 'Хіба проти слабких команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'The Mongolz', game: 'CS', status: 'Нестабільні', notes: 'Зараз не стабільні - краще ставити проти них, або уникати їх матчі' },
  { name: 'Natus Vincere', game: 'CS', status: 'Обережно', notes: 'Не ставити на них, коли грають проти рівних команд! Хіба проти слабших команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'Vitality', game: 'CS', status: 'Обережно', notes: 'Не ставити коли: 1.Фінали 2. проти - Маузів, Фурії' },
  { name: 'Eternal Fire', game: 'CS', status: 'БАН', notes: 'Команда яка частіше програє, дуже погана гра від них зазвичай, краще проти них з форою на карту +1.5' },
  { name: 'Nexus', game: 'CS', status: 'Обережно', notes: 'Раки - хіба проти слабших команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'Oddik', game: 'CS', status: 'Обережно', notes: 'Раки - Не на загальну перемогу, тільки на вибіркові карти, але краще проти них ставити' },
  { name: '9Z', game: 'CS', status: 'Нестабільні', notes: 'Не на загальну перемогу, тільки на вибіркові карти - у фіналі або пів фіналах виглядають - нестабільні' },
  { name: 'Mibr', game: 'CS', status: 'БАН', notes: 'Раки - На тір 1 взагалі нічого не можуть - можна взяти коли грають локальні бразильські матчі а так то не варто на них дивитись' },
  { name: 'Parivision', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркову карту Даст - поки не дуже стабільні' },
  { name: 'Tnl', game: 'CS', status: 'БАН', notes: 'Раки - грають дуже агресивно і проти трішки кращих команд то ніколи не працює - хіба проти слабших команд' },
  { name: 'Betclic', game: 'CS', status: 'БАН', notes: 'Раки - Дуже не стабільна команда' },
  { name: 'Sangal', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'Ence', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'Spirit Academy', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору +4.5' },
  { name: 'Fut', game: 'CS', status: 'Обережно', notes: 'Хіба проти ноунейм команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'Fluxo', game: 'CS', status: 'Обережно', notes: 'Хіба проти ноунейм команд - краще на загальну перемогу брати' },
  { name: '1Win', game: 'CS', status: 'БАН', notes: 'Не ставити на цю команду, рандом команда - більшість вони програють' },
  { name: 'ZeroTen', game: 'CS', status: 'БАН', notes: 'Краще не варто взагалі на цю команду дивитись - нестабільна команда' },
  { name: 'Eclot', game: 'CS', status: 'БАН', notes: 'Краще не варто взагалі на цю команду дивитись - нестабільна команда' },
  { name: 'Fnatic', game: 'CS', status: 'Обережно', notes: 'Хіба проти слабших команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'Mouz', game: 'CS', status: 'Обережно', notes: 'Хіба проти слабших команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'Cph Wolves', game: 'CS', status: 'Обережно', notes: 'Хіба проти слабших команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'Amkal', game: 'CS', status: 'БАН', notes: 'Краще не варто взагалі на цю команду дивитись - нестабільна команда' },
  { name: 'Wopa', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'BIG', game: 'CS', status: 'БАН', notes: 'Хіба проти слабших команд і то краще з форою' },
  { name: 'M80', game: 'CS', status: 'Нестабільні', notes: 'Краще не варто взагалі на цю команду дивитись - нестабільна команда, але все ж якщо то ставити на них тільки з форою +3.5 і більше' },
  { name: 'Ninjas In Pyjamas', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'G2', game: 'CS', status: 'Нестабільні', notes: 'Не стабільні, краще брати проти них, коли грають проти сильніших команд і рівних' },
  { name: '3Dmax', game: 'CS', status: 'Нестабільні', notes: 'Нестабільна команда, але все ж якщо то ставити на них тільки з форою +3.5 або фора на карту +1.5' },
  { name: 'Aurora', game: 'CS', status: 'Нестабільні', notes: 'Не стабільні! Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'Fnatic', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'Nrg', game: 'CS', status: 'Нестабільні', notes: 'Не стабільні! Не на загальну перемогу, тільки на мейн карту і то тільки на фору' },
  { name: 'Oddik', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на мейн карту і то тільки на фору' },
  { name: 'Inner Circle', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на мейн карту і то тільки на фору. Агресивно грають і переважно це не працює - а далі в них ідеї нема якщо агресія валиться' },
  { name: 'Gamerlegion', game: 'CS', status: 'БАН', notes: 'Рандом команда - Не на загальну перемогу, якщо виграють першу карту то варто 2 від них скіпнути - краще уникати команду' },
  { name: 'Legacy', game: 'CS', status: 'Обережно', notes: 'Краще уникати проти рівних команд - можуть взяти в хороший день проти топ1, але більшість ігор програють і не варто на них ставити' },
  { name: 'Galorys', game: 'CS', status: 'Обережно', notes: 'Команда рандом - тому тільки 1.5 на них - або краще проти них' },
  { name: 'Johnny Speeds', game: 'CS', status: 'Обережно', notes: 'На загальну перемогу не варто, а от одну карту від них можна' },
  { name: 'Gun5', game: 'CS', status: 'Обережно', notes: 'На загальну перемогу не варто, а от одну карту від них можна' },
  { name: 'Zero Tenacity', game: 'CS', status: 'БАН', notes: 'Команда рандом - краще уникати її - хіба проти них якщо грають проти рівних собі команд' },
  { name: 'Sinners', game: 'CS', status: 'Обережно', notes: 'На загальну перемогу не варто, а от одну карту від них можна' },
  { name: 'Cybershoke', game: 'CS', status: 'Нестабільні', notes: 'Не дуже стабільна команда якщо грають проти рівної команди можна взяти одну карту' },
  { name: 'Favbet', game: 'CS', status: 'Нестабільні', notes: 'Не дуже стабільна команда якщо грають проти рівної команди можна взяти одну карту' },
  { name: 'Faze', game: 'CS', status: 'Нестабільні', notes: 'Зараз на спаді - краще не ставити на них коли вони грають проти рівних команд' },
  { name: '9Ine', game: 'CS', status: 'Обережно', notes: 'Не на загальну від них - тільки на мейн карту і то якщо брати тільки з форою' },
  { name: 'Ecstatic', game: 'CS', status: 'Обережно', notes: 'Не на загальну від них - тільки на мейн карту і то якщо брати тільки з форою' },
  { name: 'Betera', game: 'CS', status: 'Нестабільні', notes: 'Не на загальну від них - виглядають нестабільно' },
  { name: 'Spirit', game: 'CS', status: 'Нестабільні', notes: 'Не стабільні поки! Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'GenOne', game: 'CS', status: 'Обережно', notes: 'Команда однієї карти, тому тільки 1.5 на них' },
  { name: 'ARCRED', game: 'CS', status: 'Обережно', notes: 'Команда однієї карти, тому тільки 1.5 на них' },
  { name: 'Venom', game: 'CS', status: 'БАН', notes: 'Не ставити на цю команду, рандом команда' },
  { name: 'Novaq', game: 'CS', status: 'Обережно', notes: 'Команда однієї карти, тому тільки 1.5 на них' },
  { name: 'Bb Team', game: 'Дота', status: 'Обережно', notes: 'Одну карту від них можна брати з форою +1.5, але ризиковано коли грають проти рівних команд тому краще пропускати такі матчі' },
  { name: 'Heroic', game: 'Дота', status: 'Обережно', notes: 'Досить слабка команда, можна брати проти них загальну перемогу, але краще сейв ставка +1.5 з експресом' },
  { name: 'OG', game: 'Дота', status: 'Обережно', notes: '+1.5 проти рівної команди може зайти' }
];

export default function RiskManagement({ bets }: RiskManagementProps) {
  const [riskyTeams, setRiskyTeams] = useState<RiskyTeam[]>(() => {
    const saved = localStorage.getItem('admin_risky_teams');
    return saved ? JSON.parse(saved) : INITIAL_RISKY_TEAMS;
  });
  
  const [newTeam, setNewTeam] = useState<RiskyTeam>({
    name: '',
    game: 'CS',
    status: 'Обережно',
    notes: ''
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    localStorage.setItem('admin_risky_teams', JSON.stringify(riskyTeams));
  }, [riskyTeams]);

  const normalizeTeamName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const updateFromGoogleSheets = async () => {
    setIsUpdating(true);
    try {
      const teamsFromSheet = await googleSheetsRiskyTeamsService.fetchRiskyTeams();
      
      if (teamsFromSheet.length === 0) {
        toast.error('Не знайдено команд у документі');
        return;
      }

      const existingTeams = riskyTeams;
      const newTeamsToAdd: RiskyTeam[] = [];
      
      teamsFromSheet.forEach(sheetTeam => {
        const normalizedSheetTeam = normalizeTeamName(sheetTeam.name);
        
        const exists = existingTeams.some(existingTeam => 
          normalizeTeamName(existingTeam.name) === normalizedSheetTeam && 
          existingTeam.game === sheetTeam.game
        );
        
        if (!exists) {
          newTeamsToAdd.push(sheetTeam);
        }
      });

      if (newTeamsToAdd.length === 0) {
        toast.info('Немає нових команд для додавання', {
          description: 'Всі команди з Google Sheets вже присутні у списку'
        });
        return;
      }

      const mergedTeams = [...existingTeams, ...newTeamsToAdd];
      setRiskyTeams(mergedTeams);
      
      localStorage.setItem('admin_risky_teams', JSON.stringify(mergedTeams));
      
      toast.success(`Успішно додано ${newTeamsToAdd.length} нових команд з Google Sheets!`, {
        description: `Всього команд: ${mergedTeams.length}`
      });
    } catch (error) {
      console.error('Error updating from Google Sheets:', error);
      toast.error('Помилка оновлення', {
        description: error instanceof Error ? error.message : 'Не вдалося завантажити дані з Google Sheets'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const addRiskyTeam = () => {
    if (!newTeam.name.trim()) return;
    
    setRiskyTeams([...riskyTeams, { ...newTeam }]);
    setNewTeam({
      name: '',
      game: 'CS',
      status: 'Обережно',
      notes: ''
    });
  };

  const deleteRiskyTeam = (index: number) => {
    if (editingIndex === index) {
      setEditingIndex(null);
    }
    setRiskyTeams(riskyTeams.filter((_, i) => i !== index));
  };

  const startEditing = (globalIndex: number, team: RiskyTeam) => {
    setEditingIndex(globalIndex);
    setEditName(team.name);
    setEditNotes(team.notes);
    setEditStatus(team.status);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditName('');
    setEditNotes('');
    setEditStatus('');
  };

  const saveEditing = () => {
    if (editingIndex === null || !editName.trim()) return;
    
    const updatedTeams = [...riskyTeams];
    updatedTeams[editingIndex] = {
      ...updatedTeams[editingIndex],
      name: editName.trim(),
      notes: editNotes,
      status: editStatus
    };
    setRiskyTeams(updatedTeams);
    setEditingIndex(null);
    setEditName('');
    setEditNotes('');
    setEditStatus('');
    toast.success('Команду оновлено');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'БАН':
        return 'bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEF2F2] border border-[#FECACA] rounded-lg font-medium text-xs';
      case 'Нестабільні':
        return 'bg-[#FFF7ED] text-[#EA580C] hover:bg-[#FFF7ED] border border-[#FED7AA] rounded-lg font-medium text-xs';
      case 'Обережно':
        return 'bg-[#FFFBEB] text-[#D97706] hover:bg-[#FFFBEB] border border-[#FDE68A] rounded-lg font-medium text-xs';
      case 'Рідко':
        return 'bg-[#EFF6FF] text-[#2563EB] hover:bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg font-medium text-xs';
      default:
        return 'bg-[#F9FAFB] text-[#6B7280] hover:bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg font-medium text-xs';
    }
  };

  const getGameEmoji = (game: string) => {
    return game === 'CS' ? 'CS:' : 'Дота:';
  };

  const filteredTeams = riskyTeams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.game.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedBets = useMemo(() => 
    bets.filter(bet => bet.result && bet.result !== 'Pending'), 
    [bets]
  );

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

    const bankroll = 10000;
    let runningBalance = bankroll;
    let peak = bankroll;
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    let maxConsecutiveLosses = 0;
    let currentLossStreak = 0;

    const returns: number[] = [];
    const stakes: number[] = [];

    completedBets.forEach(bet => {
      const profit = bet.profit || 0;
      const stake = bet.stake || 0;
      
      runningBalance += profit;
      
      if (stake > 0) {
        returns.push(profit / stake);
        stakes.push(stake);
      }

      if (runningBalance > peak) {
        peak = runningBalance;
      }
      
      const currentDD = (peak - runningBalance) / peak * 100;
      if (currentDD > maxDrawdown) {
        maxDrawdown = currentDD;
      }

      if (bet.result === 'Loss') {
        currentLossStreak++;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLossStreak);
      } else {
        currentLossStreak = 0;
      }
    });

    currentDrawdown = (peak - runningBalance) / peak * 100;

    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const variance = returns.length > 0 ? 
      returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length : 0;
    const volatility = Math.sqrt(variance) * 100;

    const riskFreeRate = 0.02;
    const sharpeRatio = volatility > 0 ? (avgReturn - riskFreeRate) / (volatility / 100) : 0;

    const sortedReturns = [...returns].sort((a, b) => a - b);
    const varIndex = Math.floor(sortedReturns.length * 0.05);
    const valueAtRisk = sortedReturns.length > 0 ? Math.abs(sortedReturns[varIndex] || 0) * 100 : 0;

    const winRate = completedBets.filter(bet => bet.result === 'Win').length / completedBets.length;
    const avgWinReturn = returns.filter(r => r > 0).reduce((a, b) => a + b, 0) / returns.filter(r => r > 0).length || 0;
    const avgLossReturn = Math.abs(returns.filter(r => r < 0).reduce((a, b) => a + b, 0) / returns.filter(r => r < 0).length || 0);
    
    const kellyPercentage = avgLossReturn > 0 ? 
      Math.max(0, (winRate * avgWinReturn - (1 - winRate) * avgLossReturn) / avgWinReturn * 100) : 0;

    const riskOfRuin = winRate < 0.5 ? 
      Math.min(100, Math.pow((1 - winRate) / winRate, bankroll / (stakes.reduce((a, b) => a + b, 0) / stakes.length || 1)) * 100) : 0;

    const largestLoss = Math.abs(Math.min(...returns.map(r => r * (stakes.reduce((a, b) => a + b, 0) / stakes.length || 0))));

    const winStreaks: number[] = [];
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
  }, [completedBets]);

  const drawdownPeriods = useMemo((): DrawdownPeriod[] => {
    if (completedBets.length === 0) return [];

    const bankroll = 10000;
    let runningBalance = bankroll;
    let peak = bankroll;
    let drawdownStart: string | null = null;
    let maxDrawdownInPeriod = 0;
    const periods: DrawdownPeriod[] = [];

    completedBets.forEach((bet, index) => {
      const profit = bet.profit || 0;
      runningBalance += profit;

      if (runningBalance > peak) {
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
        if (!drawdownStart) {
          drawdownStart = bet.date;
        }
        const currentDD = (peak - runningBalance) / peak * 100;
        maxDrawdownInPeriod = Math.max(maxDrawdownInPeriod, currentDD);
      }
    });

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
  }, [completedBets]);

  const getRiskLevel = () => {
    const { maxDrawdown, volatility, riskOfRuin } = riskMetrics;
    
    if (maxDrawdown > 20 || volatility > 30 || riskOfRuin > 10) {
      return { level: 'high', color: 'text-[#EF4444]', bgColor: 'bg-[#FEF2F2]' };
    } else if (maxDrawdown > 10 || volatility > 20 || riskOfRuin > 5) {
      return { level: 'medium', color: 'text-[#F59E0B]', bgColor: 'bg-[#FFFBEB]' };
    } else {
      return { level: 'low', color: 'text-[#22C55E]', bgColor: 'bg-[#F0FDF4]' };
    }
  };

  const riskLevel = getRiskLevel();
  const volatilityLevel = riskMetrics.volatility > 30 ? 'high' : riskMetrics.volatility > 20 ? 'medium' : 'low';

  const teamsByGame = {
    CS: filteredTeams.filter(t => t.game === 'CS'),
    Дота: filteredTeams.filter(t => t.game === 'Дота')
  };

  const teamsByStatus = {
    БАН: filteredTeams.filter(t => t.status === 'БАН'),
    Нестабільні: filteredTeams.filter(t => t.status === 'Нестабільні'),
    Обережно: filteredTeams.filter(t => t.status === 'Обережно'),
    Рідко: filteredTeams.filter(t => t.status === 'Рідко')
  };

  const chartCardShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)';

  const cardBaseStyle = {
    transform: 'scale(1)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  };

  const cardHoverStyle = {
    transform: 'scale(1.03)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)',
  };

  const renderTeamCard = (team: RiskyTeam, globalIndex: number) => {
    const isEditing = editingIndex === globalIndex;

    if (isEditing) {
      return (
        <div key={globalIndex} className="p-4 border border-[#BFDBFE] rounded-2xl bg-[#EFF6FF] transition-all">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-[#6B7280] mb-1 block">Назва команди</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#111827] transition-colors text-sm"
                  placeholder="Назва команди"
                />
              </div>
              <div className="w-40">
                <label className="text-xs font-medium text-[#6B7280] mb-1 block">Статус</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full p-2 border border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#111827] transition-colors rounded-xl text-sm"
                >
                  <option value="БАН">БАН</option>
                  <option value="Нестабільні">Нестабільні</option>
                  <option value="Обережно">Обережно</option>
                  <option value="Рідко">Рідко</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B7280] mb-1 block">Коментар</label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#111827] transition-colors text-sm"
                placeholder="Додайте коментар..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEditing}
                className="text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-xl text-sm"
              >
                <X className="h-4 w-4 mr-1" strokeWidth={1.5} />
                Скасувати
              </Button>
              <Button
                size="sm"
                onClick={saveEditing}
                disabled={!editName.trim()}
                className="bg-[#111827] hover:bg-[#1F2937] text-white rounded-xl text-sm"
              >
                <Check className="h-4 w-4 mr-1" strokeWidth={1.5} />
                Зберегти
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={globalIndex} className="p-4 border border-[#F3F4F6] rounded-2xl hover:bg-[#F9FAFB] hover:border-[#E5E7EB] transition-all">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-base text-[#111827]">
                {getGameEmoji(team.game)} {team.name}
              </h3>
              <Badge className={getStatusBadge(team.status)}>
                {team.status}
              </Badge>
            </div>
            {team.notes && (
              <p className="text-sm text-[#6B7280]">{team.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startEditing(globalIndex, team)}
              className="text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-xl"
            >
              <Pencil className="h-4 w-4" strokeWidth={1.5} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteRiskyTeam(globalIndex)}
              className="text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header row: info icon & Google Sheets button (right) */}
        <div className="flex items-center justify-end gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-black/5 transition-colors duration-200">
                  <Info className="h-5 w-5 text-[#9CA3AF]" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-lg">
                <p className="text-sm font-medium text-[#111827] mb-1">Управління ризиками</p>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Аналіз ризиків та контроль банкролу. Список ризикових команд, метрики просадок, волатильності та рекомендації.
                </p>
              </TooltipContent>
            </Tooltip>

            <Button
              onClick={updateFromGoogleSheets}
              disabled={isUpdating}
              variant="outline"
              className="rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] text-sm font-medium text-[#374151] h-10 px-4"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" strokeWidth={1.5} />
                  Оновлення...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Оновити з Google Sheets
                </>
              )}
            </Button>
        </div>

        {/* Risk Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-sm font-medium text-[#6B7280] uppercase tracking-wider">Рівень ризику</span>
            </div>
            <div className="text-2xl font-bold text-[#111827] tracking-tight mb-2">
              {riskLevel.level === 'high' ? 'Високий' : riskLevel.level === 'medium' ? 'Середній' : 'Низький'}
            </div>
            <Badge className={`${riskLevel.bgColor} ${riskLevel.color} hover:${riskLevel.bgColor} px-3 py-1.5 rounded-lg border ${riskLevel.level === 'high' ? 'border-[#FECACA]' : riskLevel.level === 'medium' ? 'border-[#FDE68A]' : 'border-[#BBF7D0]'} font-medium text-xs`}>
              Поточна оцінка
            </Badge>
          </div>

          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-sm font-medium text-[#6B7280] uppercase tracking-wider">Макс. просадка</span>
            </div>
            <div className="text-2xl font-bold text-[#111827] tracking-tight mb-2">
              {riskMetrics.maxDrawdown}%
            </div>
            <span className="text-sm text-[#9CA3AF]">Максимальне падіння від піку</span>
          </div>

          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
          >
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-sm font-medium text-[#6B7280] uppercase tracking-wider">Коефіцієнт Шарпа</span>
            </div>
            <div className="text-2xl font-bold text-[#111827] tracking-tight mb-2">{riskMetrics.sharpeRatio}</div>
            <span className="text-sm text-[#9CA3AF]">
              {riskMetrics.sharpeRatio > 1 ? 'Відмінно' : 
               riskMetrics.sharpeRatio > 0.5 ? 'Добре' : 
               riskMetrics.sharpeRatio > 0 ? 'Задовільно' : 'Погано'}
            </span>
          </div>

          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-sm font-medium text-[#6B7280] uppercase tracking-wider">Волатильність</span>
            </div>
            <div className="text-2xl font-bold text-[#111827] tracking-tight mb-2">{riskMetrics.volatility}%</div>
            <Badge className={`px-3 py-1.5 rounded-lg font-medium text-xs border ${volatilityLevel === 'low' ? 'bg-[#F0FDF4] text-[#22C55E] hover:bg-[#F0FDF4] border-[#BBF7D0]' : volatilityLevel === 'medium' ? 'bg-[#FFFBEB] text-[#D97706] hover:bg-[#FFFBEB] border-[#FDE68A]' : 'bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEF2F2] border-[#FECACA]'}`}>
              {volatilityLevel === 'low' ? 'Стабільно' : 
               volatilityLevel === 'medium' ? 'Помірно' : 'Нестабільно'}
            </Badge>
          </div>
        </div>

        {/* Stats Cards for Teams */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5"
            style={cardBaseStyle}
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-sm font-medium text-[#6B7280]">Всього команд</span>
            </div>
            <div className="text-4xl font-bold text-[#111827] tracking-tight">{riskyTeams.length}</div>
          </div>

          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5"
            style={cardBaseStyle}
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
              <span className="text-sm font-medium text-[#6B7280]">БАН</span>
            </div>
            <div className="text-4xl font-bold text-[#EF4444] tracking-tight">{teamsByStatus.БАН.length}</div>
          </div>

          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5"
            style={cardBaseStyle}
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
              <span className="text-sm font-medium text-[#6B7280]">Нестабільні</span>
            </div>
            <div className="text-4xl font-bold text-[#F59E0B] tracking-tight">{teamsByStatus.Нестабільні.length}</div>
          </div>

          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5"
            style={cardBaseStyle}
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
              <span className="text-sm font-medium text-[#6B7280]">Обережно</span>
            </div>
            <div className="text-4xl font-bold text-[#D97706] tracking-tight">{teamsByStatus.Обережно.length}</div>
          </div>
        </div>

        {/* Add New Team - Collapsible */}
        <Card 
          className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden"
          style={{ boxShadow: chartCardShadow }}
        >
          <CardHeader 
            className="bg-white border-b border-[#E5E7EB] p-6 cursor-pointer hover:bg-[#F9FAFB] transition-colors"
            onClick={() => setIsAddTeamOpen(!isAddTeamOpen)}
          >
            <CardTitle className="flex items-center justify-between text-lg font-semibold text-[#111827]">
              <span className="flex items-center gap-3">
                <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
                  <Plus className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                </div>
                Додати нову команду
              </span>
              {isAddTeamOpen ? (
                <ChevronUp className="h-5 w-5 text-[#9CA3AF]" strokeWidth={1.5} />
              ) : (
                <ChevronDown className="h-5 w-5 text-[#9CA3AF]" strokeWidth={1.5} />
              )}
            </CardTitle>
          </CardHeader>
          {isAddTeamOpen && (
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#6B7280]">Назва команди</label>
                  <Input
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="Введіть назву команди"
                    className="mt-1 rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#111827] transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#6B7280]">Гра</label>
                  <select
                    value={newTeam.game}
                    onChange={(e) => setNewTeam({ ...newTeam, game: e.target.value })}
                    className="w-full p-2 border border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#111827] transition-colors rounded-xl mt-1 text-sm"
                  >
                    <option value="CS">CS</option>
                    <option value="Дота">Дота</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#6B7280]">Статус</label>
                  <select
                    value={newTeam.status}
                    onChange={(e) => setNewTeam({ ...newTeam, status: e.target.value })}
                    className="w-full p-2 border border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#111827] transition-colors rounded-xl mt-1 text-sm"
                  >
                    <option value="БАН">БАН</option>
                    <option value="Нестабільні">Нестабільні</option>
                    <option value="Обережно">Обережно</option>
                    <option value="Рідко">Рідко</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-[#6B7280]">Примітки</label>
                  <Textarea
                    value={newTeam.notes}
                    onChange={(e) => setNewTeam({ ...newTeam, notes: e.target.value })}
                    placeholder="Додайте примітки про команду"
                    className="mt-1 rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#111827] transition-colors text-sm"
                    rows={3}
                  />
                </div>
              </div>
              <Button
                onClick={addRiskyTeam}
                className="mt-4 bg-[#111827] hover:bg-[#1F2937] text-white rounded-xl text-sm px-6"
                disabled={!newTeam.name.trim()}
              >
                <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Додати команду
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Search - Collapsible */}
        <Card 
          className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden"
          style={{ boxShadow: chartCardShadow }}
        >
          <CardHeader 
            className="bg-white border-b border-[#E5E7EB] p-6 cursor-pointer hover:bg-[#F9FAFB] transition-colors"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <CardTitle className="flex items-center justify-between text-lg font-semibold text-[#111827]">
              <span className="flex items-center gap-3">
                <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
                  <Search className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                </div>
                Пошук команд
              </span>
              {isSearchOpen ? (
                <ChevronUp className="h-5 w-5 text-[#9CA3AF]" strokeWidth={1.5} />
              ) : (
                <ChevronDown className="h-5 w-5 text-[#9CA3AF]" strokeWidth={1.5} />
              )}
            </CardTitle>
          </CardHeader>
          {isSearchOpen && (
            <CardContent className="p-6">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук за назвою, грою, статусом або примітками..."
                className="w-full rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#111827] transition-colors text-sm"
              />
            </CardContent>
          )}
        </Card>

        {/* Teams by Game */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CS Teams */}
          <Card 
            className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden"
            style={{ boxShadow: chartCardShadow }}
          >
            <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
              <CardTitle className="flex items-center justify-between text-lg font-semibold text-[#111827]">
                <span className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
                    <Target className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                  </div>
                  CS команди
                </span>
                <Badge className="bg-[#F3F4F6] text-[#374151] hover:bg-[#F3F4F6] px-3 py-1.5 rounded-lg border border-[#E5E7EB] font-semibold text-sm">
                  {teamsByGame.CS.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {teamsByGame.CS.length === 0 ? (
                  <p className="text-center text-[#9CA3AF] py-8 text-sm">Немає команд CS</p>
                ) : (
                  teamsByGame.CS.map((team) => {
                    const globalIndex = riskyTeams.findIndex(t => t === team);
                    return renderTeamCard(team, globalIndex);
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dota Teams */}
          <Card 
            className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden"
            style={{ boxShadow: chartCardShadow }}
          >
            <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
              <CardTitle className="flex items-center justify-between text-lg font-semibold text-[#111827]">
                <span className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
                    <Shield className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                  </div>
                  Dota 2 команди
                </span>
                <Badge className="bg-[#F3F4F6] text-[#374151] hover:bg-[#F3F4F6] px-3 py-1.5 rounded-lg border border-[#E5E7EB] font-semibold text-sm">
                  {teamsByGame.Дота.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {teamsByGame.Дота.length === 0 ? (
                  <p className="text-center text-[#9CA3AF] py-8 text-sm">Немає команд Dota 2</p>
                ) : (
                  teamsByGame.Дота.map((team) => {
                    const globalIndex = riskyTeams.findIndex(t => t === team);
                    return renderTeamCard(team, globalIndex);
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Risk Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card 
            className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden"
            style={{ boxShadow: chartCardShadow }}
          >
            <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-[#111827]">
                <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
                  <BarChart3 className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                </div>
                Детальні ризик-метрики
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#6B7280]">Поточна просадка:</span>
                <span className="text-sm font-semibold text-[#111827]">{riskMetrics.currentDrawdown}%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#6B7280]">Послідовні програші:</span>
                <span className="text-sm font-semibold text-[#111827]">{riskMetrics.consecutiveLosses}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#6B7280]">Середня ставка:</span>
                <span className="text-sm font-semibold text-[#111827]">{riskMetrics.averageStake} ₴</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#6B7280]">Найбільший програш:</span>
                <span className="text-sm font-semibold text-[#EF4444]">{riskMetrics.largestLoss} ₴</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#6B7280]">Келлі %:</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="inline-flex items-center">
                        <Info className="h-4 w-4 text-[#9CA3AF] cursor-help" strokeWidth={1.5} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-lg">
                      <p className="text-sm font-medium text-[#111827] mb-2">Kelly Criterion — агресивна стратегія</p>
                      <p className="text-xs text-[#6B7280] mb-2">
                        Розраховано на основі win rate та середніх коефіцієнтів.
                      </p>
                      <div className="flex items-start gap-2 p-2 bg-[#FFFBEB] rounded-lg border border-[#FDE68A]">
                        <AlertTriangle className="h-4 w-4 text-[#D97706] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                        <p className="text-xs text-[#92400E]">
                          Рекомендовано використовувати 25–50% від Kelly для зниження ризику
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${riskMetrics.kellyPercentage > 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {riskMetrics.kellyPercentage}%
                  </span>
                  {riskMetrics.kellyPercentage > 5 && (
                    <Badge className="bg-[#FFFBEB] text-[#D97706] hover:bg-[#FFFBEB] border border-[#FDE68A] font-medium text-xs px-2 py-0.5 rounded-lg">
                      Aggressive
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#6B7280]">Risk of Ruin:</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="inline-flex items-center">
                        <Info className="h-4 w-4 text-[#9CA3AF] cursor-help" strokeWidth={1.5} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-lg">
                      <p className="text-sm font-medium text-[#111827] mb-2">Як розраховується:</p>
                      <p className="text-xs text-[#6B7280]">
                        Ймовірність втрати всього банкролу. Розраховано на основі win rate, середнього коефіцієнта та розміру ставок відносно банкролу.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className={`text-sm font-semibold ${riskMetrics.riskOfRuin > 10 ? 'text-[#EF4444]' : riskMetrics.riskOfRuin > 5 ? 'text-[#F59E0B]' : 'text-[#22C55E]'}`}>
                  {riskMetrics.riskOfRuin}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#6B7280]">Ризик виграшних серій:</span>
                <span className="text-sm font-semibold text-[#111827]">{riskMetrics.winStreakRisk}%</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden"
            style={{ boxShadow: chartCardShadow }}
          >
            <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-[#111827]">
                <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
                  <Calendar className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                </div>
                Періоди просадок
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {drawdownPeriods.length > 0 ? (
                <div className="space-y-3">
                  {drawdownPeriods.map((period, index) => (
                    <div key={index} className="p-4 border border-[#F3F4F6] rounded-2xl hover:border-[#E5E7EB] transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-[#111827]">
                          {new Date(period.start).toLocaleDateString('uk-UA')} - {new Date(period.end).toLocaleDateString('uk-UA')}
                        </span>
                        <Badge className={`rounded-lg font-medium text-xs border ${period.recovery ? 'bg-[#F0FDF4] text-[#22C55E] hover:bg-[#F0FDF4] border-[#BBF7D0]' : 'bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEF2F2] border-[#FECACA]'}`}>
                          {period.recovery ? 'Відновлено' : 'Поточна'}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#9CA3AF]">Тривалість: {period.duration} днів</span>
                        <span className="font-semibold text-[#EF4444]">-{period.maxDrawdown.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#9CA3AF] text-center py-4 text-sm">Немає значних періодів просадок</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Risk Recommendations */}
        <Card 
          className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden"
          style={{ boxShadow: chartCardShadow }}
        >
          <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-[#111827]">
              <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
                <Target className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              </div>
              Рекомендації з управління ризиками
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-sm mb-3 text-[#22C55E]">Позитивні аспекти</h4>
                <div className="space-y-2">
                  {riskMetrics.maxDrawdown < 15 && (
                    <div className="flex items-start gap-2">
                      <ArrowUpRight className="h-4 w-4 text-[#22C55E] flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="text-sm text-[#6B7280]">Низька максимальна просадка ({riskMetrics.maxDrawdown}%)</span>
                    </div>
                  )}
                  {riskMetrics.sharpeRatio > 0.5 && (
                    <div className="flex items-start gap-2">
                      <ArrowUpRight className="h-4 w-4 text-[#22C55E] flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="text-sm text-[#6B7280]">Хороший коефіцієнт Шарпа ({riskMetrics.sharpeRatio})</span>
                    </div>
                  )}
                  {riskMetrics.riskOfRuin < 10 && (
                    <div className="flex items-start gap-2">
                      <ArrowUpRight className="h-4 w-4 text-[#22C55E] flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="text-sm text-[#6B7280]">Низький ризик краху ({riskMetrics.riskOfRuin}%)</span>
                    </div>
                  )}
                  {riskMetrics.consecutiveLosses < 5 && (
                    <div className="flex items-start gap-2">
                      <ArrowUpRight className="h-4 w-4 text-[#22C55E] flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="text-sm text-[#6B7280]">Контрольовані послідовні програші</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-3 text-[#EF4444]">Області для покращення</h4>
                <div className="space-y-2">
                  {riskMetrics.maxDrawdown > 25 && (
                    <div className="flex items-start gap-2">
                      <ArrowDownRight className="h-4 w-4 text-[#EF4444] flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="text-sm text-[#6B7280]">Висока максимальна просадка - зменшіть розміри ставок</span>
                    </div>
                  )}
                  {riskMetrics.volatility > 30 && (
                    <div className="flex items-start gap-2">
                      <ArrowDownRight className="h-4 w-4 text-[#EF4444] flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="text-sm text-[#6B7280]">Висока волатильність - диверсифікуйте стратегії</span>
                    </div>
                  )}
                  {riskMetrics.riskOfRuin > 15 && (
                    <div className="flex items-start gap-2">
                      <ArrowDownRight className="h-4 w-4 text-[#EF4444] flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="text-sm text-[#6B7280]">Високий ризик краху - перегляньте управління капіталом</span>
                    </div>
                  )}
                  {riskMetrics.consecutiveLosses > 7 && (
                    <div className="flex items-start gap-2">
                      <ArrowDownRight className="h-4 w-4 text-[#EF4444] flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="text-sm text-[#6B7280]">Довгі серії програшів - встановіть стоп-лосси</span>
                    </div>
                  )}
                  {riskMetrics.kellyPercentage < 0 && (
                    <div className="flex items-start gap-2">
                      <ArrowDownRight className="h-4 w-4 text-[#EF4444] flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="text-sm text-[#6B7280]">Негативний Келлі % - перегляньте стратегію</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Alerts */}
        {(riskMetrics.currentDrawdown > 15 || riskMetrics.consecutiveLosses > 5) && (
          <Alert className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4">
            <AlertTriangle className="h-4 w-4 text-[#EF4444]" strokeWidth={1.5} />
            <AlertDescription className="text-sm text-[#991B1B] ml-2">
              <strong className="font-semibold">Попередження про ризик:</strong>
              {riskMetrics.currentDrawdown > 15 && ` Поточна просадка ${riskMetrics.currentDrawdown}% перевищує рекомендований поріг.`}
              {riskMetrics.consecutiveLosses > 5 && ` ${riskMetrics.consecutiveLosses} послідовних програшів вказують на необхідність перегляду стратегії.`}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </TooltipProvider>
  );
}