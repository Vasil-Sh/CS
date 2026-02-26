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
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Pencil,
  Check,
  X
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
  
  // Edit state: stores the global index of the team being edited, and temp values
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    localStorage.setItem('admin_risky_teams', JSON.stringify(riskyTeams));
  }, [riskyTeams]);

  // Normalize team name for comparison
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

      // Merge logic: Add only NEW teams from Google Sheets
      const existingTeams = riskyTeams;
      const newTeamsToAdd: RiskyTeam[] = [];
      
      teamsFromSheet.forEach(sheetTeam => {
        const normalizedSheetTeam = normalizeTeamName(sheetTeam.name);
        
        // Check if this team already exists (by normalized name and game)
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

      // Merge: existing teams + new teams from Google Sheets
      const mergedTeams = [...existingTeams, ...newTeamsToAdd];
      setRiskyTeams(mergedTeams);
      
      // Also update the service's storage
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
    // If we're editing this team, cancel edit first
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
        return 'bg-[#FFE8E8] text-[#D32F2F] hover:bg-[#FFE8E8] border-2 border-[#FFCDD2] rounded-[20px] font-normal';
      case 'Нестабільні':
        return 'bg-[#FFF4E6] text-[#F57C00] hover:bg-[#FFF4E6] border-2 border-[#FFE0B2] rounded-[20px] font-normal';
      case 'Обережно':
        return 'bg-[#FFFDE7] text-[#F9A825] hover:bg-[#FFFDE7] border-2 border-[#FFF9C4] rounded-[20px] font-normal';
      case 'Рідко':
        return 'bg-[#E3F2FD] text-[#1976D2] hover:bg-[#E3F2FD] border-2 border-[#BBDEFB] rounded-[20px] font-normal';
      default:
        return 'bg-[#F5F5F3] text-[#6B6B6B] hover:bg-[#F5F5F3] border-2 border-[#E8E6DC] rounded-[20px] font-normal';
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
      return { level: 'high', color: 'text-[#D32F2F]', bgColor: 'bg-[#FFE8E8]' };
    } else if (maxDrawdown > 10 || volatility > 20 || riskOfRuin > 5) {
      return { level: 'medium', color: 'text-[#F57C00]', bgColor: 'bg-[#FFF4E6]' };
    } else {
      return { level: 'low', color: 'text-[#4CAF50]', bgColor: 'bg-[#E8F5E9]' };
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

  // Helper to render a team card (used for both CS and Dota sections)
  const renderTeamCard = (team: RiskyTeam, globalIndex: number) => {
    const isEditing = editingIndex === globalIndex;

    if (isEditing) {
      return (
        <div key={globalIndex} className="p-4 border-2 border-[#F4E157] rounded-[24px] bg-[#FFFDE7] transition-all">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs font-normal text-[#6B6B6B] mb-1 block">Назва команди</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-[16px] border-2 border-[#E8E6DC] hover:border-[#D4D2C8] focus:border-[#F4E157] transition-colors font-light"
                  placeholder="Назва команди"
                />
              </div>
              <div className="w-40">
                <label className="text-xs font-normal text-[#6B6B6B] mb-1 block">Статус</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full p-2 border-2 border-[#E8E6DC] hover:border-[#D4D2C8] focus:border-[#F4E157] transition-colors rounded-[16px] font-light text-sm"
                >
                  <option value="БАН">БАН</option>
                  <option value="Нестабільні">Нестабільні</option>
                  <option value="Обережно">Обережно</option>
                  <option value="Рідко">Рідко</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-normal text-[#6B6B6B] mb-1 block">Коментар</label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="rounded-[16px] border-2 border-[#E8E6DC] hover:border-[#D4D2C8] focus:border-[#F4E157] transition-colors font-light"
                placeholder="Додайте коментар..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEditing}
                className="text-[#6B6B6B] hover:text-black hover:bg-[#F5F5F3] rounded-[16px]"
              >
                <X className="h-4 w-4 mr-1" strokeWidth={1.5} />
                Скасувати
              </Button>
              <Button
                size="sm"
                onClick={saveEditing}
                disabled={!editName.trim()}
                className="bg-[#4CAF50] hover:bg-[#45A049] text-white rounded-[16px] font-normal shadow-[0_2px_8px_rgba(76,175,80,0.3)]"
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
      <div key={globalIndex} className="p-4 border-2 border-[#E8E6DC] rounded-[24px] hover:bg-[#FAFAF8] hover:border-[#D4D2C8] transition-all">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-normal text-lg text-black">
                {getGameEmoji(team.game)} {team.name}
              </h3>
              <Badge className={getStatusBadge(team.status)}>
                {team.status}
              </Badge>
            </div>
            {team.notes && (
              <p className="text-sm text-[#6B6B6B] font-light">{team.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startEditing(globalIndex, team)}
              className="text-[#1976D2] hover:text-[#1565C0] hover:bg-[#E3F2FD] rounded-[16px]"
            >
              <Pencil className="h-4 w-4" strokeWidth={1.5} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteRiskyTeam(globalIndex)}
              className="text-[#D32F2F] hover:text-[#B71C1C] hover:bg-[#FFE8E8] rounded-[16px]"
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
        {/* Header Card */}
        <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
          <CardHeader className="bg-white border-b-2 border-[#E8E6DC] p-8">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-3xl font-light text-black">
                <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_8px_20px_rgba(244,225,87,0.4)]">
                  <Shield className="h-6 w-6 text-black" strokeWidth={1.5} />
                </div>
                Управління ризиками
                <button
                  className="p-2.5 bg-[#F4E157] rounded-[16px] shadow-[0_4px_12px_rgba(244,225,87,0.4)] hover:shadow-[0_6px_16px_rgba(244,225,87,0.6)] transition-all ml-2"
                  title="Аналіз ризиків та контроль банкролу"
                >
                  <HelpCircle className="h-5 w-5 text-black" strokeWidth={2} />
                </button>
              </CardTitle>
              
              {/* Admin: Update from Google Sheets Button */}
              <Button
                onClick={updateFromGoogleSheets}
                disabled={isUpdating}
                className="rounded-[20px] bg-[#4CAF50] hover:bg-[#45A049] font-normal shadow-[0_4px_12px_rgba(76,175,80,0.3)] hover:shadow-[0_6px_16px_rgba(76,175,80,0.4)] transition-all px-6 py-2.5"
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
          </CardHeader>
        </Card>

        {/* Legal Disclaimer - PROMINENT VERSION */}
        <Card className="border-3 border-[#FF9800] shadow-[0_8px_32px_rgba(255,152,0,0.25)] rounded-[32px] bg-gradient-to-r from-[#FFF3E0] via-[#FFF8E1] to-[#FFF3E0] overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-stretch">
              {/* Left accent bar */}
              <div className="w-2 bg-gradient-to-b from-[#FF9800] to-[#F57C00] flex-shrink-0 rounded-l-[32px]" />
              
              <div className="flex items-center gap-5 p-7 flex-1">
                {/* Icon container */}
                <div className="p-4 bg-[#FF9800] rounded-[24px] shadow-[0_6px_20px_rgba(255,152,0,0.4)] flex-shrink-0">
                  <AlertTriangle className="h-7 w-7 text-white" strokeWidth={2} />
                </div>
                
                {/* Text content */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#E65100] mb-1.5 tracking-tight">
                    ⚠️ Важливо
                  </h3>
                  <p className="text-base font-normal text-[#BF360C] leading-relaxed">
                    Аналітика носить <strong className="font-bold text-[#D84315]">рекомендаційний характер</strong> і не є фінансовою порадою. 
                    Всі рішення щодо ставок приймаються користувачем <strong className="font-bold text-[#D84315]">самостійно на власний ризик</strong>.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[#C4C2B8] transition-all duration-300">
            <CardHeader className="pb-4 pt-7 px-7">
              <CardTitle className="text-sm font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#F4E157]" strokeWidth={1.5} />
                Рівень ризику
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <div className={`text-2xl font-light tracking-tight ${riskLevel.color}`}>
                {riskLevel.level === 'high' ? 'Високий' : riskLevel.level === 'medium' ? 'Середній' : 'Низький'}
              </div>
              <div className={`text-xs px-3 py-1.5 rounded-[16px] mt-2 inline-block ${riskLevel.bgColor} ${riskLevel.color} font-normal border-2 ${riskLevel.level === 'high' ? 'border-[#FFCDD2]' : riskLevel.level === 'medium' ? 'border-[#FFE0B2]' : 'border-[#C8E6C9]'}`}>
                Поточна оцінка
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[#C4C2B8] transition-all duration-300">
            <CardHeader className="pb-4 pt-7 px-7">
              <CardTitle className="text-sm font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-[#D32F2F]" strokeWidth={1.5} />
                Макс. просадка
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <div className="text-2xl font-light text-[#D32F2F] tracking-tight">
                {riskMetrics.maxDrawdown}%
              </div>
              <p className="text-xs text-[#6B6B6B] mt-1 font-light">
                Максимальне падіння від піку
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[#C4C2B8] transition-all duration-300">
            <CardHeader className="pb-4 pt-7 px-7">
              <CardTitle className="text-sm font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#1976D2]" strokeWidth={1.5} />
                Коефіцієнт Шарпа
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <div className="text-2xl font-light text-black tracking-tight">{riskMetrics.sharpeRatio}</div>
              <p className="text-xs text-[#6B6B6B] mt-1 font-light">
                {riskMetrics.sharpeRatio > 1 ? 'Відмінно' : 
                 riskMetrics.sharpeRatio > 0.5 ? 'Добре' : 
                 riskMetrics.sharpeRatio > 0 ? 'Задовільно' : 'Погано'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[#C4C2B8] transition-all duration-300">
            <CardHeader className="pb-4 pt-7 px-7">
              <CardTitle className="text-sm font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#F57C00]" strokeWidth={1.5} />
                Волатильність
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <div className="text-2xl font-light text-black tracking-tight">{riskMetrics.volatility}%</div>
              <Badge className={`mt-2 rounded-[16px] font-normal px-4 py-2 border-2 ${volatilityLevel === 'low' ? 'bg-[#E8F5E9] text-[#4CAF50] hover:bg-[#E8F5E9] border-[#C8E6C9]' : volatilityLevel === 'medium' ? 'bg-[#FFF4E6] text-[#F57C00] hover:bg-[#FFF4E6] border-[#FFE0B2]' : 'bg-[#FFE8E8] text-[#D32F2F] hover:bg-[#FFE8E8] border-[#FFCDD2]'}`}>
                {volatilityLevel === 'low' ? 'Стабільно' : 
                 volatilityLevel === 'medium' ? 'Помірно' : 'Нестабільно'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards for Teams */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="pb-4 pt-7 px-7">
              <CardTitle className="text-sm font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#F4E157]" strokeWidth={1.5} />
                Всього команд
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <div className="text-3xl font-light text-black tracking-tight">{riskyTeams.length}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#FFCDD2] shadow-[0_8px_24px_rgba(211,47,47,0.15)] rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="pb-4 pt-7 px-7">
              <CardTitle className="text-sm font-normal text-[#D32F2F] uppercase tracking-wider">
                БАН
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <div className="text-3xl font-light text-[#D32F2F] tracking-tight">{teamsByStatus.БАН.length}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#FFE0B2] shadow-[0_8px_24px_rgba(245,124,0,0.15)] rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="pb-4 pt-7 px-7">
              <CardTitle className="text-sm font-normal text-[#F57C00] uppercase tracking-wider">
                Нестабільні
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <div className="text-3xl font-light text-[#F57C00] tracking-tight">{teamsByStatus.Нестабільні.length}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#FFF9C4] shadow-[0_8px_24px_rgba(249,168,37,0.15)] rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="pb-4 pt-7 px-7">
              <CardTitle className="text-sm font-normal text-[#F9A825] uppercase tracking-wider">
                Обережно
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <div className="text-3xl font-light text-[#F9A825] tracking-tight">{teamsByStatus.Обережно.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Team - Dropdown */}
        <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
          <CardHeader 
            className="bg-white border-b-2 border-[#E8E6DC] p-8 cursor-pointer hover:bg-[#FAFAF8] transition-colors"
            onClick={() => setIsAddTeamOpen(!isAddTeamOpen)}
          >
            <CardTitle className="flex items-center justify-between text-3xl font-light text-black">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_2px_8px_rgba(244,225,87,0.3)]">
                  <Plus className="h-6 w-6 text-black" strokeWidth={1.5} />
                </div>
                Додати нову команду
              </div>
              {isAddTeamOpen ? (
                <ChevronUp className="h-6 w-6 text-[#6B6B6B]" strokeWidth={1.5} />
              ) : (
                <ChevronDown className="h-6 w-6 text-[#6B6B6B]" strokeWidth={1.5} />
              )}
            </CardTitle>
          </CardHeader>
          {isAddTeamOpen && (
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-normal text-[#6B6B6B]">Назва команди</label>
                  <Input
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="Введіть назву команди"
                    className="mt-1 rounded-[20px] border-2 border-[#E8E6DC] hover:border-[#D4D2C8] focus:border-[#F4E157] transition-colors font-light"
                  />
                </div>
                <div>
                  <label className="text-sm font-normal text-[#6B6B6B]">Гра</label>
                  <select
                    value={newTeam.game}
                    onChange={(e) => setNewTeam({ ...newTeam, game: e.target.value })}
                    className="w-full p-2 border-2 border-[#E8E6DC] hover:border-[#D4D2C8] focus:border-[#F4E157] transition-colors rounded-[20px] mt-1 font-light"
                  >
                    <option value="CS">CS</option>
                    <option value="Дота">Дота</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-normal text-[#6B6B6B]">Статус</label>
                  <select
                    value={newTeam.status}
                    onChange={(e) => setNewTeam({ ...newTeam, status: e.target.value })}
                    className="w-full p-2 border-2 border-[#E8E6DC] hover:border-[#D4D2C8] focus:border-[#F4E157] transition-colors rounded-[20px] mt-1 font-light"
                  >
                    <option value="БАН">БАН</option>
                    <option value="Нестабільні">Нестабільні</option>
                    <option value="Обережно">Обережно</option>
                    <option value="Рідко">Рідко</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-normal text-[#6B6B6B]">Примітки</label>
                  <Textarea
                    value={newTeam.notes}
                    onChange={(e) => setNewTeam({ ...newTeam, notes: e.target.value })}
                    placeholder="Додайте примітки про команду"
                    className="mt-1 rounded-[20px] border-2 border-[#E8E6DC] hover:border-[#D4D2C8] focus:border-[#F4E157] transition-colors font-light"
                    rows={3}
                  />
                </div>
              </div>
              <Button
                onClick={addRiskyTeam}
                className="mt-4 bg-[#F4E157] hover:bg-[#F0DD4D] text-black rounded-[20px] font-normal shadow-[0_4px_12px_rgba(244,225,87,0.3)] hover:shadow-[0_6px_16px_rgba(244,225,87,0.4)] transition-all px-6 py-2.5"
                disabled={!newTeam.name.trim()}
              >
                <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Додати команду
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Search - Dropdown */}
        <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
          <CardHeader 
            className="bg-white border-b-2 border-[#E8E6DC] p-8 cursor-pointer hover:bg-[#FAFAF8] transition-colors"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <CardTitle className="flex items-center justify-between text-3xl font-light text-black">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_2px_8px_rgba(244,225,87,0.3)]">
                  <Search className="h-6 w-6 text-black" strokeWidth={1.5} />
                </div>
                Пошук команд
              </div>
              {isSearchOpen ? (
                <ChevronUp className="h-6 w-6 text-[#6B6B6B]" strokeWidth={1.5} />
              ) : (
                <ChevronDown className="h-6 w-6 text-[#6B6B6B]" strokeWidth={1.5} />
              )}
            </CardTitle>
          </CardHeader>
          {isSearchOpen && (
            <CardContent className="p-8">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук за назвою, грою, статусом або примітками..."
                className="w-full rounded-[20px] border-2 border-[#E8E6DC] hover:border-[#D4D2C8] focus:border-[#F4E157] transition-colors font-light"
              />
            </CardContent>
          )}
        </Card>

        {/* Teams by Game */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CS Teams */}
          <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="bg-white border-b-2 border-[#E8E6DC] p-8">
              <CardTitle className="flex items-center justify-between text-3xl font-light text-black">
                <span className="flex items-center gap-3"><div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_2px_8px_rgba(244,225,87,0.3)]"><Target className="h-6 w-6 text-black" strokeWidth={1.5} /></div>CS команди</span>
                <Badge className="rounded-[20px] bg-[#E3F2FD] text-[#1976D2] hover:bg-[#E3F2FD] border-2 border-[#BBDEFB] font-normal px-4 py-2">{teamsByGame.CS.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {teamsByGame.CS.length === 0 ? (
                  <p className="text-center text-[#6B6B6B] py-8 font-light">Немає команд CS</p>
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
          <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="bg-white border-b-2 border-[#E8E6DC] p-8">
              <CardTitle className="flex items-center justify-between text-3xl font-light text-black">
                <span className="flex items-center gap-3"><div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_2px_8px_rgba(244,225,87,0.3)]"><Shield className="h-6 w-6 text-black" strokeWidth={1.5} /></div>Dota 2 команди</span>
                <Badge className="rounded-[20px] bg-[#E3F2FD] text-[#1976D2] hover:bg-[#E3F2FD] border-2 border-[#BBDEFB] font-normal px-4 py-2">{teamsByGame.Дота.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {teamsByGame.Дота.length === 0 ? (
                  <p className="text-center text-[#6B6B6B] py-8 font-light">Немає команд Dota 2</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="bg-white border-b-2 border-[#E8E6DC] p-8">
              <CardTitle className="flex items-center gap-3 text-3xl font-light text-black"><div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_2px_8px_rgba(244,225,87,0.3)]"><BarChart3 className="h-6 w-6 text-black" strokeWidth={1.5} /></div>Детальні ризик-метрики</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-8">
              <div className="flex justify-between items-center">
                <span className="text-sm font-normal text-[#6B6B6B]">Поточна просадка:</span>
                <span className="font-normal text-black">{riskMetrics.currentDrawdown}%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-normal text-[#6B6B6B]">Послідовні програші:</span>
                <span className="font-normal text-black">{riskMetrics.consecutiveLosses}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-normal text-[#6B6B6B]">Середня ставка:</span>
                <span className="font-normal text-black">{riskMetrics.averageStake} ₴</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-normal text-[#6B6B6B]">Найбільший програш:</span>
                <span className="font-normal text-[#D32F2F]">{riskMetrics.largestLoss} ₴</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-normal text-[#6B6B6B]">Келлі %:</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="inline-flex items-center">
                        <Info className="h-4 w-4 text-[#1976D2] cursor-help" strokeWidth={1.5} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-white border-2 border-[#FFF9C4] rounded-[20px] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                      <p className="text-sm font-normal text-black mb-2">Kelly Criterion — агресивна стратегія</p>
                      <p className="text-xs text-[#6B6B6B] font-light mb-2">
                        Розраховано на основі win rate та середніх коефіцієнтів.
                      </p>
                      <div className="flex items-start gap-2 p-2 bg-[#FFFDE7] rounded-[16px] border-2 border-[#FFF9C4]">
                        <AlertTriangle className="h-4 w-4 text-[#F9A825] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                        <p className="text-xs text-[#F9A825] font-normal">
                          Рекомендовано використовувати 25–50% від Kelly для зниження ризику
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-normal ${riskMetrics.kellyPercentage > 0 ? 'text-[#4CAF50]' : 'text-[#D32F2F]'}`}>
                    {riskMetrics.kellyPercentage}%
                  </span>
                  {riskMetrics.kellyPercentage > 5 && (
                    <Badge className="rounded-[16px] bg-[#FFF4E6] text-[#F57C00] hover:bg-[#FFF4E6] border-2 border-[#FFE0B2] font-normal text-xs px-3 py-1">
                      Aggressive
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-normal text-[#6B6B6B]">Risk of Ruin:</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="inline-flex items-center">
                        <Info className="h-4 w-4 text-[#1976D2] cursor-help" strokeWidth={1.5} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-white border-2 border-[#BBDEFB] rounded-[20px] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                      <p className="text-sm font-normal text-black mb-2">Як розраховується:</p>
                      <p className="text-xs text-[#6B6B6B] font-light">
                        Ймовірність втрати всього банкролу. Розраховано на основі win rate, середнього коефіцієнта та розміру ставок відносно банкролу.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className={`font-normal ${riskMetrics.riskOfRuin > 10 ? 'text-[#D32F2F]' : riskMetrics.riskOfRuin > 5 ? 'text-[#F57C00]' : 'text-[#4CAF50]'}`}>
                  {riskMetrics.riskOfRuin}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-normal text-[#6B6B6B]">Ризик виграшних серій:</span>
                <span className="font-normal text-black">{riskMetrics.winStreakRisk}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="bg-white border-b-2 border-[#E8E6DC] p-8">
              <CardTitle className="flex items-center gap-3 text-3xl font-light text-black">
                <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_2px_8px_rgba(244,225,87,0.3)]">
                  <Calendar className="h-6 w-6 text-black" strokeWidth={1.5} />
                </div>
                Періоди просадок
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {drawdownPeriods.length > 0 ? (
                <div className="space-y-3">
                  {drawdownPeriods.map((period, index) => (
                    <div key={index} className="p-3 border-2 border-[#E8E6DC] rounded-[24px] hover:border-[#D4D2C8] transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-normal text-black">
                          {new Date(period.start).toLocaleDateString('uk-UA')} - {new Date(period.end).toLocaleDateString('uk-UA')}
                        </span>
                        <Badge className={`rounded-[16px] border-2 font-normal ${period.recovery ? 'bg-[#E8F5E9] text-[#4CAF50] hover:bg-[#E8F5E9] border-[#C8E6C9]' : 'bg-[#FFE8E8] text-[#D32F2F] hover:bg-[#FFE8E8] border-[#FFCDD2]'}`}>
                          {period.recovery ? 'Відновлено' : 'Поточна'}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6B6B6B] font-light">Тривалість: {period.duration} днів</span>
                        <span className="font-normal text-[#D32F2F]">-{period.maxDrawdown.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#6B6B6B] text-center py-4 font-light">Немає значних періодів просадок</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Risk Recommendations */}
        <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
          <CardHeader className="bg-white border-b-2 border-[#E8E6DC] p-8">
            <CardTitle className="flex items-center gap-3 text-3xl font-light text-black">
              <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_2px_8px_rgba(244,225,87,0.3)]">
                <Target className="h-6 w-6 text-black" strokeWidth={1.5} />
              </div>
              Рекомендації з управління ризиками
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-normal mb-3 text-[#4CAF50]">Позитивні аспекти</h4>
                <div className="space-y-2">
                  {riskMetrics.maxDrawdown < 15 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#4CAF50] text-xs mt-1">✓</span>
                      <span className="text-sm text-[#6B6B6B] font-light">Низька максимальна просадка ({riskMetrics.maxDrawdown}%)</span>
                    </div>
                  )}
                  {riskMetrics.sharpeRatio > 0.5 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#4CAF50] text-xs mt-1">✓</span>
                      <span className="text-sm text-[#6B6B6B] font-light">Хороший коефіцієнт Шарпа ({riskMetrics.sharpeRatio})</span>
                    </div>
                  )}
                  {riskMetrics.riskOfRuin < 10 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#4CAF50] text-xs mt-1">✓</span>
                      <span className="text-sm text-[#6B6B6B] font-light">Низький ризик краху ({riskMetrics.riskOfRuin}%)</span>
                    </div>
                  )}
                  {riskMetrics.consecutiveLosses < 5 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#4CAF50] text-xs mt-1">✓</span>
                      <span className="text-sm text-[#6B6B6B] font-light">Контрольовані послідовні програші</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-normal mb-3 text-[#D32F2F]">Області для покращення</h4>
                <div className="space-y-2">
                  {riskMetrics.maxDrawdown > 25 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#D32F2F] text-xs mt-1">⚠</span>
                      <span className="text-sm text-[#6B6B6B] font-light">Висока максимальна просадка - зменшіть розміри ставок</span>
                    </div>
                  )}
                  {riskMetrics.volatility > 30 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#D32F2F] text-xs mt-1">⚠</span>
                      <span className="text-sm text-[#6B6B6B] font-light">Висока волатильність - диверсифікуйте стратегії</span>
                    </div>
                  )}
                  {riskMetrics.riskOfRuin > 15 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#D32F2F] text-xs mt-1">⚠</span>
                      <span className="text-sm text-[#6B6B6B] font-light">Високий ризик краху - перегляньте управління капіталом</span>
                    </div>
                  )}
                  {riskMetrics.consecutiveLosses > 7 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#D32F2F] text-xs mt-1">⚠</span>
                      <span className="text-sm text-[#6B6B6B] font-light">Довгі серії програшів - встановіть стоп-лосси</span>
                    </div>
                  )}
                  {riskMetrics.kellyPercentage < 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#D32F2F] text-xs mt-1">⚠</span>
                      <span className="text-sm text-[#6B6B6B] font-light">Негативний Келлі % - перегляньте стратегію</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Alerts */}
        {(riskMetrics.currentDrawdown > 15 || riskMetrics.consecutiveLosses > 5) && (
          <Alert className="rounded-[28px] border-2 border-[#FFCDD2] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-6">
            <AlertTriangle className="h-5 w-5 text-[#D32F2F]" strokeWidth={1.5} />
            <AlertDescription className="text-[#D32F2F] font-light ml-2">
              <strong className="font-normal">Попередження про ризик:</strong>
              {riskMetrics.currentDrawdown > 15 && ` Поточна просадка ${riskMetrics.currentDrawdown}% перевищує рекомендований поріг.`}
              {riskMetrics.consecutiveLosses > 5 && ` ${riskMetrics.consecutiveLosses} послідовних програшів вказують на необхідність перегляду стратегії.`}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </TooltipProvider>
  );
}