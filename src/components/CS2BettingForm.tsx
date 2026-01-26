import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Plus, Calculator, DollarSign, Link, AlertTriangle, Calendar, Trophy, Target, TrendingUp, X, Trash2, Shield, Flag, Users, MapPin, Gamepad2, Zap, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { realGoogleSheetsService, CS2Strategy } from '@/lib/realGoogleSheets';
import { UserDataService } from '@/lib/userDataService';
import { BankrollService } from '@/lib/bankrollService';
import { toast } from 'sonner';
import StrategyViolationDialog from './StrategyViolationDialog';

interface CS2BettingFormProps {
  onRecordAdded?: () => void;
}

interface RiskyTeam {
  name: string;
  comment: string;
}

interface ExpressEvent {
  match: string;
  betType: string;
  selection: string;
  odds: string;
}

interface BetRecord {
  date: string;
  match: string;
  team1: string;
  team2: string;
  tournament: string;
  format: string;
  matchUrl: string;
  betType: string;
  odds: number;
  amount: number;
  originalAmount: number;
  currency: string;
  exchangeRate: number | null;
  result: 'Pending';
  profit: number;
  roi: number;
  strategy: string;
  riskyTeams: RiskyTeam[];
  notes: string;
  goalId?: string;
}

interface StrategyViolation {
  type: 'odds' | 'format' | 'betType';
  message: string;
  severity: 'acceptable' | 'serious';
  explanation: string;
}

interface Goal {
  id: string;
  name: string;
  type: 'amount' | 'ladder' | 'roi' | 'winrate';
  status: 'active' | 'completed' | 'failed';
}

export default function CS2BettingForm({ onRecordAdded }: CS2BettingFormProps) {
  const currentUser = localStorage.getItem('currentUser') || '';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsingMatch, setIsParsingMatch] = useState(false);
  const [expressEvents, setExpressEvents] = useState<ExpressEvent[]>([]);
  const [primaryStrategy, setPrimaryStrategy] = useState<CS2Strategy | null>(null);
  const [strategyViolations, setStrategyViolations] = useState<StrategyViolation[]>([]);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [showViolationDialog, setShowViolationDialog] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  
  const [formMode, setFormMode] = useState<'quick' | 'advanced'>('quick');
  const [showEVDetails, setShowEVDetails] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    game: 'CS2' as 'CS2' | 'Dota2',
    matchUrl: '',
    tournament: '',
    team1: '',
    team2: '',
    format: 'BO3',
    riskyTeams: [] as RiskyTeam[],
    betType: '',
    betCategory: 'Ординар',
    selection: '',
    odds: '',
    stake: '',
    currency: 'UAH',
    exchangeRate: '41',
    confidence: '',
    strategy: '',
    reasoning: '',
    keyFactors: '',
    riskLevel: '',
    notes: '',
    goalId: ''
  });

  useEffect(() => {
    const primaryStrategyName = localStorage.getItem('primaryStrategy');
    if (primaryStrategyName) {
      const strategy = realGoogleSheetsService.getStrategyByName(primaryStrategyName);
      if (strategy) {
        setPrimaryStrategy(strategy);
        setFormData(prev => ({ ...prev, strategy: primaryStrategyName }));
      }
    }

    loadActiveGoals();
  }, []);

  const loadActiveGoals = () => {
    const goals = UserDataService.getUserData(currentUser, 'goals', []);
    const active = goals.filter((g: Goal) => g.status === 'active');
    setActiveGoals(active);
  };

  useEffect(() => {
    if (primaryStrategy && formMode === 'advanced') {
      validateAgainstStrategy();
    } else {
      setStrategyViolations([]);
    }
  }, [formData.odds, formData.format, formData.betCategory, primaryStrategy, formMode]);

  useEffect(() => {
    if (formMode === 'advanced' && (formData.team1 || formData.team2)) {
      checkRiskyTeams(formData.team1, formData.team2);
    }
  }, [formData.team1, formData.team2, formMode]);

  const validateAgainstStrategy = () => {
    if (!primaryStrategy) {
      setStrategyViolations([]);
      return;
    }

    const violations: StrategyViolation[] = [];
    const currentOdds = parseFloat(formData.odds);

    if (formData.betCategory !== 'Ординар') {
      setStrategyViolations([]);
      return;
    }

    if (currentOdds && primaryStrategy.minOdds && currentOdds < primaryStrategy.minOdds) {
      const difference = primaryStrategy.minOdds - currentOdds;
      const severity = difference > 0.3 ? 'serious' : 'acceptable';
      violations.push({
        type: 'odds',
        message: `Коефіцієнт ${currentOdds} нижче рекомендованого ${primaryStrategy.minOdds}`,
        severity,
        explanation: severity === 'serious' 
          ? 'Низькі коефіцієнти зменшують потенційний прибуток та можуть не виправдати ризик.'
          : 'Незначне відхилення від стратегії. Переконайтесь у впевненості в прогнозі.'
      });
    }

    if (currentOdds && primaryStrategy.maxOdds && currentOdds > primaryStrategy.maxOdds) {
      const difference = currentOdds - primaryStrategy.maxOdds;
      const severity = difference > 0.5 ? 'serious' : 'acceptable';
      violations.push({
        type: 'odds',
        message: `Коефіцієнт ${currentOdds} вище рекомендованого ${primaryStrategy.maxOdds}`,
        severity,
        explanation: severity === 'serious'
          ? 'Високі коефіцієнти часто означають низьку ймовірність виграшу. Перевірте аналіз.'
          : 'Відхилення в межах допустимого. Переконайтесь у обґрунтованості вибору.'
      });
    }

    if (primaryStrategy.allowedFormats && primaryStrategy.allowedFormats.length > 0) {
      if (!primaryStrategy.allowedFormats.includes(formData.format)) {
        violations.push({
          type: 'format',
          message: `Формат ${formData.format} не рекомендований. Рекомендовані: ${primaryStrategy.allowedFormats.join(', ')}`,
          severity: 'acceptable',
          explanation: 'Ваша стратегія оптимізована для інших форматів. Це може вплинути на результативність.'
        });
      }
    }

    if (primaryStrategy.allowedBetTypes && primaryStrategy.allowedBetTypes.length > 0) {
      if (!primaryStrategy.allowedBetTypes.includes(formData.betCategory)) {
        violations.push({
          type: 'betType',
          message: `Тип прогнозу "${formData.betCategory}" не рекомендований. Рекомендовані: ${primaryStrategy.allowedBetTypes.join(', ')}`,
          severity: 'serious',
          explanation: 'Ваша стратегія розроблена для інших типів ставок. Це може значно знизити ефективність.'
        });
      }
    }

    setStrategyViolations(violations);
  };

  const loadRiskyTeamsFromStorage = (): RiskyTeam[] => {
    try {
      const saved = localStorage.getItem('riskyTeams');
      if (saved) {
        const savedTeams = JSON.parse(saved) as RiskyTeam[];
        return savedTeams.map((team: RiskyTeam) => ({
          name: team.name,
          comment: team.comment
        }));
      }
    } catch (error) {
      console.error('Error loading risky teams from storage:', error);
    }
    return [];
  };

  const checkRiskyTeams = (team1: string, team2: string) => {
    if (!team1 && !team2) {
      setFormData(prev => ({ ...prev, riskyTeams: [] }));
      return;
    }

    const savedRiskyTeams = loadRiskyTeamsFromStorage();
    const riskyTeamsFound: RiskyTeam[] = [];
    
    savedRiskyTeams.forEach((riskyTeam: RiskyTeam) => {
      const teamName = riskyTeam.name.toLowerCase();
      const team1Lower = team1.toLowerCase();
      const team2Lower = team2.toLowerCase();
      
      if (team1Lower.includes(teamName) || teamName.includes(team1Lower) ||
          team2Lower.includes(teamName) || teamName.includes(team2Lower)) {
        riskyTeamsFound.push({
          name: riskyTeam.name,
          comment: riskyTeam.comment
        });
      }
    });
    
    setFormData(prev => ({
      ...prev,
      riskyTeams: riskyTeamsFound
    }));
  };

  const parseDota2MatchFromUrl = (url: string): { team1: string; team2: string; tournament: string } | null => {
    try {
      const regex = /dota2\/[^/]+\/([a-z0-9\-_]+-vs-[a-z0-9\-_]+)\//i;
      const match = url.match(regex);
      
      if (match && match[1]) {
        const matchInfo = match[1];
        const parts = matchInfo.split('-');
        const vsIndex = parts.findIndex(part => part === 'vs');
        
        if (vsIndex > 0 && vsIndex < parts.length - 1) {
          const team1Parts = parts.slice(0, vsIndex);
          const team1 = team1Parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
          
          const team2Parts = parts.slice(vsIndex + 1);
          const team2 = team2Parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
          
          return {
            team1,
            team2,
            tournament: 'Dota 2 Tournament'
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error parsing Dota 2 URL:', error);
      return null;
    }
  };

  const parseCS2MatchFromUrl = (url: string): { team1: string; team2: string; tournament: string } | null => {
    try {
      const urlParts = url.split('/');
      const matchInfo = urlParts[urlParts.length - 1];
      
      if (matchInfo) {
        const parts = matchInfo.split('-');
        const vsIndex = parts.findIndex(part => part === 'vs');
        
        if (vsIndex > 0 && vsIndex < parts.length - 1) {
          const team1Parts = parts.slice(0, vsIndex);
          const team1 = team1Parts.join(' ').toUpperCase();
          const afterVs = parts.slice(vsIndex + 1);
          
          const tournamentKeywords = [
            'esl', 'pro', 'league', 'season',
            'blast', 'premier', 'spring', 'fall', 'groups', 'finals',
            'iem', 'katowice', 'cologne', 'sydney', 'beijing',
            'major', 'championship', 'pgl', 'antwerp', 'stockholm',
            'faceit', 'london', 'eleague', 'dreamhack', 'masters',
            'nodwin', 'clutch', 'series'
          ];
          
          let tournamentStartIndex = -1;
          for (let i = 0; i < afterVs.length; i++) {
            if (tournamentKeywords.some(keyword => 
              afterVs[i].toLowerCase().includes(keyword.toLowerCase())
            )) {
              tournamentStartIndex = i;
              break;
            }
          }
          
          let team2, tournament;
          
          if (tournamentStartIndex > 0) {
            const team2Parts = afterVs.slice(0, tournamentStartIndex);
            team2 = team2Parts.join(' ').toUpperCase();
            const tournamentParts = afterVs.slice(tournamentStartIndex);
            tournament = tournamentParts.join(' ').replace(/-/g, ' ').toUpperCase();
          } else if (tournamentStartIndex === 0) {
            team2 = afterVs.slice(0, 2).join(' ').toUpperCase();
            tournament = afterVs.slice(2).join(' ').replace(/-/g, ' ').toUpperCase();
          } else {
            const midPoint = Math.ceil(afterVs.length / 2);
            team2 = afterVs.slice(0, midPoint).join(' ').toUpperCase();
            tournament = afterVs.slice(midPoint).join(' ').replace(/-/g, ' ').toUpperCase();
          }
          
          team2 = team2.replace(/\s+/g, ' ').trim();
          tournament = tournament.replace(/\s+/g, ' ').trim();
          
          tournament = tournament
            .replace(/ESL PRO LEAGUE/g, 'ESL Pro League')
            .replace(/BLAST PREMIER/g, 'BLAST Premier')
            .replace(/IEM /g, 'IEM ')
            .replace(/SEASON (\d+)/g, 'Season $1')
            .replace(/NODWIN CLUTCH SERIES/g, 'NODWIN Clutch Series');
          
          return {
            team1,
            team2,
            tournament: tournament || 'Unknown Tournament'
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error parsing CS2 URL:', error);
      return null;
    }
  };

  const parseMatchFromUrl = async (url: string) => {
    setIsParsingMatch(true);
    try {
      let result = null;
      
      if (url.includes('dota2')) {
        result = parseDota2MatchFromUrl(url);
        if (result) {
          setFormData(prev => ({
            ...prev,
            game: 'Dota2',
            team1: result.team1,
            team2: result.team2,
            tournament: result.tournament
          }));
          toast.success('Інформацію про Dota 2 матч успішно отримано!');
        } else {
          toast.error('Не вдалося розпарсити Dota 2 URL');
        }
      } else if (url.includes('hltv.org/matches/')) {
        result = parseCS2MatchFromUrl(url);
        if (result) {
          setFormData(prev => ({
            ...prev,
            game: 'CS2',
            team1: result.team1,
            team2: result.team2,
            tournament: result.tournament
          }));
          toast.success('Інформацію про CS2 матч успішно отримано!');
        } else {
          toast.error('Не вдалося знайти "vs" у посиланні');
        }
      } else {
        toast.error('Невідомий формат URL. Підтримуються HLTV (CS2) та Dota 2');
      }
    } catch (error) {
      toast.error('Помилка при парсингу URL матчу');
      console.error(error);
    } finally {
      setIsParsingMatch(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, matchUrl: url }));
    
    if (url.includes('hltv.org/matches/') || url.includes('dota2')) {
      parseMatchFromUrl(url);
    }
  };

  const removeRiskyTeam = (index: number) => {
    setFormData(prev => ({
      ...prev,
      riskyTeams: prev.riskyTeams.filter((_, i) => i !== index)
    }));
  };

  const addExpressEvent = () => {
    if (expressEvents.length >= 10) {
      toast.error('Максимум 10 подій в експресі');
      return;
    }

    const missingFields = [];
    if (!formData.team1) missingFields.push('Команда 1');
    if (!formData.team2) missingFields.push('Команда 2');
    if (!formData.betType) missingFields.push('Тип прогнозу');
    if (!formData.selection) missingFields.push('Вибір');
    if (!formData.odds) missingFields.push('Коефіцієнт');

    if (missingFields.length > 0) {
      toast.error(`Заповніть наступні поля: ${missingFields.join(', ')}`);
      return;
    }

    const newEvent: ExpressEvent = {
      match: `${formData.team1} vs ${formData.team2}`,
      betType: formData.betType,
      selection: formData.selection,
      odds: formData.odds
    };

    setExpressEvents([...expressEvents, newEvent]);
    
    setFormData(prev => ({
      ...prev,
      matchUrl: '',
      team1: '',
      team2: '',
      tournament: '',
      betType: '',
      selection: '',
      odds: '',
      riskyTeams: []
    }));

    toast.success(`Подія ${expressEvents.length + 1} додана до експресу`);
  };

  const removeExpressEvent = (index: number) => {
    setExpressEvents(expressEvents.filter((_, i) => i !== index));
    toast.success('Подію видалено з експресу');
  };

  const clearExpressEvents = () => {
    setExpressEvents([]);
    toast.success('Всі події експресу очищено');
  };

  const calculateTotalExpressOdds = () => {
    if (expressEvents.length === 0) return 1;
    return expressEvents.reduce((total, event) => total * parseFloat(event.odds), 1);
  };

  const calculateExpectedValue = () => {
    const odds = formData.betCategory === 'Експрес' 
      ? calculateTotalExpressOdds() 
      : parseFloat(formData.odds);
    const confidence = parseFloat(formData.confidence);
    
    if (odds && confidence) {
      const impliedProbability = (1 / odds) * 100;
      const expectedValue = ((confidence / 100) * (odds - 1)) - ((1 - confidence / 100) * 1);
      return (expectedValue * 100).toFixed(2);
    }
    return '0';
  };

  const calculatePotentialProfit = () => {
    const odds = formData.betCategory === 'Експрес' 
      ? calculateTotalExpressOdds() 
      : parseFloat(formData.odds);
    const stake = parseFloat(formData.stake);
    
    if (odds && stake) {
      return ((odds - 1) * stake).toFixed(2);
    }
    return '0';
  };

  const convertToUAH = (amount: number, currency: string, rate: number) => {
    if (currency === 'USD') {
      return amount * rate;
    }
    return amount;
  };

  const getExpressRiskLevel = () => {
    const count = expressEvents.length;
    if (count <= 3) return { level: 'moderate', color: 'green', text: 'Помірний ризик', progress: 33 };
    if (count <= 6) return { level: 'elevated', color: 'orange', text: 'Підвищений ризик', progress: 66 };
    return { level: 'high', color: 'red', text: 'Високий ризик', progress: 100 };
  };

  const getEVVerdict = () => {
    const ev = parseFloat(calculateExpectedValue());
    if (ev > 5) return { icon: '✅', text: 'Позитивний прогноз', color: 'green', description: 'Математично вигідний прогноз з хорошим потенціалом' };
    if (ev > 0) return { icon: '⚠️', text: 'Сумнівна ставка', color: 'yellow', description: 'Невелика позитивна вартість, потрібна висока впевненість' };
    return { icon: '❌', text: 'Негативний прогноз', color: 'red', description: 'Математично невигідний прогноз, високий ризик втрат' };
  };

  const processBetSubmission = async () => {
    setIsSubmitting(true);

    try {
      const stakeAmount = parseFloat(formData.stake);
      const exchangeRate = parseFloat(formData.exchangeRate);
      
      const stakeInUAH = convertToUAH(stakeAmount, formData.currency, exchangeRate);
      
      let betTypeWithCategory: string;
      let finalOdds: number;
      let matchName: string;

      if (formData.betCategory === 'Експрес') {
        const totalOdds = calculateTotalExpressOdds();
        finalOdds = totalOdds;
        
        const eventsString = expressEvents.map((event, index) => 
          `${index + 1}. ${event.match} | ${event.betType}: ${event.selection} @${event.odds}`
        ).join(' • ');
        
        betTypeWithCategory = `Експрес ${expressEvents.length}x | ${eventsString}`;
        matchName = `Експрес ${expressEvents.length}x`;
      } else {
        betTypeWithCategory = `${formData.betType} - ${formData.selection}`;
        finalOdds = parseFloat(formData.odds);
        matchName = `${formData.team1} vs ${formData.team2}`;
      }
      
      let finalGoalId: string | undefined = undefined;
      if (formData.goalId && formData.goalId !== '' && formData.goalId !== 'all') {
        finalGoalId = formData.goalId;
      }
      
      const record: BetRecord = {
        date: formData.date,
        match: matchName,
        team1: formData.betCategory === 'Експрес' ? 'Експрес' : formData.team1,
        team2: formData.betCategory === 'Експрес' ? `${expressEvents.length}x` : formData.team2,
        tournament: formData.betCategory === 'Експрес' ? 'Експрес' : formData.tournament,
        format: formData.betCategory === 'Експрес' ? `${expressEvents.length}x` : formData.format,
        matchUrl: formData.matchUrl || '',
        betType: betTypeWithCategory,
        odds: finalOdds,
        amount: stakeInUAH,
        originalAmount: stakeAmount,
        currency: formData.currency,
        exchangeRate: formData.currency === 'USD' ? exchangeRate : null,
        result: 'Pending' as const,
        profit: 0,
        roi: 0,
        strategy: formData.strategy,
        riskyTeams: formData.riskyTeams,
        notes: `${formData.reasoning}\n\nKey Factors: ${formData.keyFactors}\n\nNotes: ${formData.notes}`,
        goalId: finalGoalId
      };

      await realGoogleSheetsService.addRecord(record);
      
      if (finalGoalId) {
        const goalName = activeGoals.find(g => g.id === finalGoalId)?.name;
        toast.success(`Запис додано і прив'язана до цілі: ${goalName}`);
      } else {
        toast.success('Запис додано!');
      }
      
      setFormData({
        date: new Date().toISOString().split('T')[0],
        game: 'CS2',
        matchUrl: '',
        tournament: '',
        team1: '',
        team2: '',
        format: 'BO3',
        riskyTeams: [],
        betType: '',
        betCategory: 'Ординар',
        selection: '',
        odds: '',
        stake: '',
        currency: 'UAH',
        exchangeRate: '41',
        confidence: '',
        strategy: primaryStrategy?.name || '',
        reasoning: '',
        keyFactors: '',
        riskLevel: '',
        notes: '',
        goalId: ''
      });
      
      setExpressEvents([]);
      setStrategyViolations([]);

      onRecordAdded?.();
    } catch (error) {
      toast.error('Помилка при додаванні запису');
      console.error(error);
    } finally {
      setIsSubmitting(false);
      setPendingSubmit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!BankrollService.isInitialized(currentUser)) {
      toast.warning('⚠️ Початковий банк не встановлено. Натисніть на картку "Поточний банк" щоб встановити.');
    }

    if (formData.betCategory === 'Експрес' && expressEvents.length === 0) {
      toast.error('Додайте хоча б одну подію до експресу');
      return;
    }

    const bets = realGoogleSheetsService.getAllRecords();
    const validation = BankrollService.validateBetAmount(
      currentUser, 
      bets, 
      parseFloat(formData.stake)
    );

    if (validation.warning) {
      toast.warning(validation.warning);
    }

    if (strategyViolations.length > 0 && formMode === 'advanced') {
      setShowViolationDialog(true);
      setPendingSubmit(true);
      return;
    }

    await processBetSubmission();
  };

  const handleViolationConfirm = async () => {
    setShowViolationDialog(false);
    await processBetSubmission();
  };

  const handleViolationCancel = () => {
    setShowViolationDialog(false);
    setPendingSubmit(false);
  };

  const expectedValue = calculateExpectedValue();
  const potentialProfit = calculatePotentialProfit();
  const isValuePositive = parseFloat(expectedValue) > 0;

  const getCurrencySymbol = () => {
    return '₴';
  };

  const potentialProfitInCurrency = calculatePotentialProfit();
  const stakeInCurrency = formData.stake;
  const totalExpressOdds = calculateTotalExpressOdds();
  const expressRisk = getExpressRiskLevel();
  const evVerdict = getEVVerdict();

  const getBetTypeOptions = () => {
    if (formData.game === 'Dota2') {
      return [
        { value: 'Match Winner', label: 'Переможець матчу' },
        { value: 'Map Winner', label: 'Переможець карти' },
        { value: 'Total Maps', label: 'Тотал карт' },
        { value: 'Handicap', label: 'Фора' },
        { value: 'First Blood', label: 'Перша кров' },
        { value: 'Total Kills', label: 'Тотал вбивств' },
        { value: 'Roshan', label: 'Рошан' }
      ];
    } else {
      return [
        { value: 'Match Winner', label: 'Переможець матчу' },
        { value: 'Map Winner', label: 'Переможець карти' },
        { value: 'Total Maps', label: 'Тотал карт' },
        { value: 'Handicap', label: 'Фора' },
        { value: 'First Map', label: 'Перша карта' },
        { value: 'Pistol Round', label: 'Пістолетний раунд' },
        { value: 'Total Rounds', label: 'Тотал раундів' }
      ];
    }
  };

  return (
    <div className="space-y-6">
      <StrategyViolationDialog
        open={showViolationDialog}
        onOpenChange={setShowViolationDialog}
        strategyName={primaryStrategy?.name || ''}
        violations={strategyViolations}
        onConfirm={handleViolationConfirm}
        onCancel={handleViolationCancel}
      />

      {/* Form Mode Switcher */}
      <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-r from-gray-50 to-gray-100 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-700 rounded-xl">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Режим форми</p>
                <p className="text-xs text-gray-600">
                  {formMode === 'quick' ? 'Швидке додавання запису' : 'Розширений режим з аналітикою'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formMode === 'quick' ? 'default' : 'outline'}
                onClick={() => setFormMode('quick')}
                className="rounded-xl"
              >
                ⚡ Швидкий
              </Button>
              <Button
                type="button"
                variant={formMode === 'advanced' ? 'default' : 'outline'}
                onClick={() => setFormMode('advanced')}
                className="rounded-xl"
              >
                🎯 Розширений
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Card - Only in Advanced Mode */}
      {formMode === 'advanced' && primaryStrategy && (
        <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-r from-gray-50 to-gray-100 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Активна стратегія: {primaryStrategy.name}</p>
                <p className="text-xs text-gray-600">{primaryStrategy.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategy Deviations - Only in Advanced Mode */}
      {formMode === 'advanced' && strategyViolations.length > 0 && (
        <Card className={`border-2 shadow-lg rounded-3xl overflow-hidden ${
          strategyViolations.some(v => v.severity === 'serious') 
            ? 'border-red-200 bg-red-50' 
            : 'border-yellow-200 bg-yellow-50'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                strategyViolations.some(v => v.severity === 'serious') ? 'text-red-600' : 'text-yellow-600'
              }`} />
              <div className="flex-1">
                <p className={`text-sm font-semibold mb-2 ${
                  strategyViolations.some(v => v.severity === 'serious') ? 'text-red-900' : 'text-yellow-900'
                }`}>
                  {strategyViolations.some(v => v.severity === 'serious') ? '🔴' : '🟡'} Відхилення від стратегії "{primaryStrategy?.name}"
                </p>
                <div className="space-y-2">
                  {strategyViolations.map((violation, index) => (
                    <div key={index} className={`p-2 rounded-xl ${
                      violation.severity === 'serious' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      <p className={`text-xs font-medium ${
                        violation.severity === 'serious' ? 'text-red-800' : 'text-yellow-800'
                      }`}>
                        • {violation.message}
                      </p>
                      <p className={`text-xs mt-1 ${
                        violation.severity === 'serious' ? 'text-red-700' : 'text-yellow-700'
                      }`}>
                        <Info className="h-3 w-3 inline mr-1" />
                        {violation.explanation}
                      </p>
                    </div>
                  ))}
                </div>
                <p className={`text-xs mt-2 font-medium ${
                  strategyViolations.some(v => v.severity === 'serious') ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {strategyViolations.some(v => v.severity === 'serious') 
                    ? '⚠️ Рекомендуємо переглянути ваш запис перед підтвердженням.'
                    : '💡 Ви можете продовжити, але врахуйте рекомендації стратегії.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Main Form Card */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                  <div className="p-2 bg-gray-200 rounded-xl">
                    <Plus className="h-6 w-6 text-gray-700" />
                  </div>
                  {formMode === 'quick' ? '⚡ Швидкий прогноз' : '🎯 Розширений прогноз'}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Basic Settings Section */}
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-200">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
                      <Calendar className="h-5 w-5 text-gray-600" />
                      Основні налаштування
                    </h3>
                  
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="date" className="text-gray-700 font-medium">Дата матчу</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                          required
                          className="rounded-xl mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="game" className="text-gray-700 font-medium">Гра</Label>
                        <Select value={formData.game} onValueChange={(value: 'CS2' | 'Dota2') => setFormData({...formData, game: value})}>
                          <SelectTrigger className="rounded-xl mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CS2">🎯 CS2</SelectItem>
                            <SelectItem value="Dota2">🛡️ Dota 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="betCategory" className="text-gray-700 font-medium">Категорія прогнозу</Label>
                        <Select value={formData.betCategory} onValueChange={(value) => {
                          setFormData({...formData, betCategory: value});
                          if (value === 'Ординар') {
                            setExpressEvents([]);
                          }
                        }}>
                          <SelectTrigger className="rounded-xl mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ординар">Ординар</SelectItem>
                            <SelectItem value="Експрес">Експрес (до 10 подій)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {formData.betCategory === 'Ординар' && (
                      <div className="mt-4">
                        <Label htmlFor="format" className="text-gray-700 font-medium">Формат</Label>
                        <Select value={formData.format} onValueChange={(value) => setFormData({...formData, format: value})}>
                          <SelectTrigger className="rounded-xl mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BO1">BO1</SelectItem>
                            <SelectItem value="BO3">BO3</SelectItem>
                            <SelectItem value="BO5">BO5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Goals - Only in Advanced Mode */}
                    {formMode === 'advanced' && activeGoals.length > 0 && (
                      <div className="mt-4">
                        <Label htmlFor="goalId" className="text-gray-700 font-medium flex items-center gap-2">
                          <Flag className="h-4 w-4 text-gray-600" />
                          Прив'язати до цілі (необов'язково)
                        </Label>
                        <Select 
                          value={formData.goalId || 'all'} 
                          onValueChange={(value) => {
                            setFormData({...formData, goalId: value === 'all' ? '' : value});
                          }}
                        >
                          <SelectTrigger className="rounded-xl mt-1">
                            <SelectValue placeholder="Оберіть ціль або залиште порожнім" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Без цілі</SelectItem>
                            {activeGoals.map((goal) => (
                              <SelectItem key={goal.id} value={goal.id}>
                                {goal.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          Ця ставка буде враховуватись у прогресі обраної цілі
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Match Information & Bet Details Combined Section */}
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-200">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
                      <Users className="h-5 w-5 text-gray-600" />
                      Інформація про матч і деталі прогнозу
                    </h3>
                  
                    {/* Match URL - Only in Advanced Mode */}
                    {formMode === 'advanced' && (
                      <div className="mb-4">
                        <Label htmlFor="matchUrl" className="text-gray-700 font-medium flex items-center gap-2">
                          <Link className="h-4 w-4 text-gray-600" />
                          {formData.game === 'CS2' ? 'HLTV URL матчу' : 'Dota 2 URL матчу'} (необов'язково)
                        </Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="matchUrl"
                            value={formData.matchUrl}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            placeholder={formData.game === 'CS2' ? 'https://www.hltv.org/matches/...' : 'https://...dota2/.../team1-vs-team2/...'}
                            className="flex-1 rounded-xl"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => parseMatchFromUrl(formData.matchUrl)}
                            disabled={isParsingMatch || !formData.matchUrl}
                            className="rounded-xl px-4"
                          >
                            {isParsingMatch ? 'Парсинг...' : 'Парсити'}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.game === 'CS2' ? 'Вставте посилання з HLTV для автозаповнення' : 'Вставте посилання на Dota 2 матч для автозаповнення'}
                        </p>
                      </div>
                    )}

                    {(formData.team1 || formData.team2 || formData.tournament) && (
                      <div className="p-4 bg-white rounded-2xl border-2 border-gray-300 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-gray-600 text-xs font-medium">Команда 1</Label>
                            <div className="font-bold text-gray-800 text-lg">{formData.team1}</div>
                          </div>
                          <div>
                            <Label className="text-gray-600 text-xs font-medium">Команда 2</Label>
                            <div className="font-bold text-gray-800 text-lg">{formData.team2}</div>
                          </div>
                          <div>
                            <Label className="text-gray-600 text-xs font-medium">Турнір</Label>
                            <div className="font-bold text-gray-800 text-sm">{formData.tournament}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor="team1" className="text-gray-700 font-medium">
                          Команда 1 {formData.betCategory === 'Експрес' && expressEvents.length === 0 && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          id="team1"
                          value={formData.team1}
                          onChange={(e) => setFormData({...formData, team1: e.target.value})}
                          placeholder={formData.game === 'CS2' ? 'NAVI' : 'Team Spirit'}
                          required={formData.betCategory === 'Ординар' || (formData.betCategory === 'Експрес' && expressEvents.length === 0)}
                          className="rounded-xl mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="team2" className="text-gray-700 font-medium">
                          Команда 2 {formData.betCategory === 'Експрес' && expressEvents.length === 0 && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          id="team2"
                          value={formData.team2}
                          onChange={(e) => setFormData({...formData, team2: e.target.value})}
                          placeholder={formData.game === 'CS2' ? 'G2' : 'OG'}
                          required={formData.betCategory === 'Ординар' || (formData.betCategory === 'Експрес' && expressEvents.length === 0)}
                          className="rounded-xl mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="betType" className="text-gray-700 font-medium">
                          Тип прогнозу {formData.betCategory === 'Експрес' && expressEvents.length === 0 && <span className="text-red-500">*</span>}
                        </Label>
                        <Select 
                          value={formData.betType} 
                          onValueChange={(value) => setFormData({...formData, betType: value})} 
                          required={formData.betCategory === 'Ординар' || (formData.betCategory === 'Експрес' && expressEvents.length === 0)}
                        >
                          <SelectTrigger className="rounded-xl mt-1">
                            <SelectValue placeholder="Оберіть тип прогнозу" />
                          </SelectTrigger>
                          <SelectContent>
                            {getBetTypeOptions().map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="selection" className="text-gray-700 font-medium">
                          Вибір {formData.betCategory === 'Експрес' && expressEvents.length === 0 && <span className="text-red-500">*</span>}
                        </Label>
                        <Select 
                          value={formData.selection} 
                          onValueChange={(value) => setFormData({...formData, selection: value})}
                          disabled={!formData.team1 || !formData.team2}
                        >
                          <SelectTrigger className="rounded-xl mt-1">
                            <SelectValue placeholder={formData.team1 && formData.team2 ? "Оберіть команду" : "Спочатку введіть команди"} />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.team1 && <SelectItem value={formData.team1}>{formData.team1}</SelectItem>}
                            {formData.team2 && <SelectItem value={formData.team2}>{formData.team2}</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="odds" className="text-gray-700 font-medium">
                          Коефіцієнт {formData.betCategory === 'Експрес' && expressEvents.length === 0 && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          id="odds"
                          type="number"
                          step="0.01"
                          min="1.01"
                          value={formData.odds}
                          onChange={(e) => setFormData({...formData, odds: e.target.value})}
                          placeholder="1.65"
                          required={formData.betCategory === 'Ординар' || (formData.betCategory === 'Експрес' && expressEvents.length === 0)}
                          className="rounded-xl mt-1"
                        />
                      </div>
                    </div>

                    {formData.betCategory === 'Експрес' && (
                      <Button
                        type="button"
                        onClick={addExpressEvent}
                        disabled={expressEvents.length >= 10}
                        className="w-full mt-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-2xl font-semibold py-6 text-base shadow-lg"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Додати подію до експресу ({expressEvents.length}/10)
                      </Button>
                    )}
                  </div>
                </div>

                {/* Financial Details Section */}
                {(formData.betCategory === 'Ординар' || (formData.betCategory === 'Експрес' && expressEvents.length > 0)) && (
                  <>
                    <Separator />
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-200">
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
                          <DollarSign className="h-5 w-5 text-gray-600" />
                          Фінансові деталі
                        </h3>
                      
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="stake" className="text-gray-700 font-medium">Сума прогнозу (₴) <span className="text-red-500">*</span></Label>
                            <Input
                              id="stake"
                              type="number"
                              min="1"
                              step="0.01"
                              value={formData.stake}
                              onChange={(e) => setFormData({...formData, stake: e.target.value})}
                              placeholder="100"
                              required
                              className="rounded-xl mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="confidence" className="text-gray-700 font-medium">Впевненість (%) <span className="text-red-500">*</span></Label>
                            <Input
                              id="confidence"
                              type="number"
                              min="1"
                              max="100"
                              value={formData.confidence}
                              onChange={(e) => setFormData({...formData, confidence: e.target.value})}
                              placeholder="70"
                              required
                              className="rounded-xl mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Express Events Display */}
            {formData.betCategory === 'Експрес' && expressEvents.length > 0 && (
              <Card className="border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Події експресу ({expressEvents.length}/10)
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-700 text-white border-0 rounded-full text-sm px-3 py-1">
                        Коеф: {totalExpressOdds.toFixed(2)}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearExpressEvents}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 rounded-xl"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Express Risk Indicator */}
                  <div className={`p-3 rounded-2xl border-2 ${
                    expressRisk.color === 'green' ? 'bg-green-50 border-green-200' :
                    expressRisk.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-semibold ${
                        expressRisk.color === 'green' ? 'text-green-800' :
                        expressRisk.color === 'orange' ? 'text-orange-800' :
                        'text-red-800'
                      }`}>
                        {expressRisk.color === 'green' ? '🟢' : expressRisk.color === 'orange' ? '🟠' : '🔴'} {expressRisk.text}
                      </span>
                      <span className={`text-xs font-medium ${
                        expressRisk.color === 'green' ? 'text-green-700' :
                        expressRisk.color === 'orange' ? 'text-orange-700' :
                        'text-red-700'
                      }`}>
                        {expressEvents.length} {expressEvents.length === 1 ? 'подія' : expressEvents.length < 5 ? 'події' : 'подій'}
                      </span>
                    </div>
                    <Progress 
                      value={expressRisk.progress} 
                      className={`h-2 ${
                        expressRisk.color === 'green' ? '[&>div]:bg-green-600' :
                        expressRisk.color === 'orange' ? '[&>div]:bg-orange-600' :
                        '[&>div]:bg-red-600'
                      }`}
                    />
                    <p className={`text-xs mt-2 ${
                      expressRisk.color === 'green' ? 'text-green-700' :
                      expressRisk.color === 'orange' ? 'text-orange-700' :
                      'text-red-700'
                    }`}>
                      {expressRisk.color === 'green' && 'Оптимальна кількість подій для контролю ризику'}
                      {expressRisk.color === 'orange' && 'Збільшений ризик через кількість подій. Рекомендуємо обережність.'}
                      {expressRisk.color === 'red' && 'Дуже високий ризик! Кожна додаткова подія знижує ймовірність виграшу.'}
                    </p>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {expressEvents.map((event, index) => (
                      <div key={index} className="p-3 bg-white rounded-xl border-2 border-gray-300 flex items-start justify-between gap-3 hover:border-gray-400 transition-colors">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-gray-200 text-gray-800 border-0 rounded-full text-xs font-bold">
                              #{index + 1}
                            </Badge>
                            <span className="font-semibold text-gray-900 text-sm">{event.match}</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {event.betType}: <span className="font-medium text-gray-800">{event.selection}</span>
                          </div>
                          <Badge className="bg-green-100 text-green-700 border-0 rounded-full text-xs">
                            Коеф {event.odds}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExpressEvent(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0 rounded-xl flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            {(formData.betCategory === 'Ординар' || (formData.betCategory === 'Експрес' && expressEvents.length > 0)) && (
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white rounded-3xl font-bold py-8 text-lg shadow-2xl transform hover:scale-[1.02] transition-all"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Додавання...
                  </>
                ) : (
                  <>
                    <Plus className="h-6 w-6 mr-2" />
                    Додати запис
                  </>
                )}
              </Button>
            )}
          </form>
        </div>

        {/* Right Sidebar - Calculations & Warnings */}
        <div className="space-y-6">
          {formData.stake && formData.confidence && (formData.odds || (formData.betCategory === 'Експрес' && expressEvents.length > 0)) && (
            <Card className="border-0 shadow-xl rounded-3xl bg-gradient-to-br from-white to-gray-50 overflow-hidden sticky top-6">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <div className="p-2 bg-gray-200 rounded-xl">
                    <Calculator className="h-5 w-5 text-gray-700" />
                  </div>
                  Розрахунки
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {formData.betCategory === 'Експрес' && expressEvents.length > 0 && (
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 font-semibold">Загальний коефіцієнт:</span>
                      <Badge className="bg-gray-700 text-white border-0 rounded-full text-lg px-4 py-1">
                        {totalExpressOdds.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                )}
                
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 font-semibold">Потенційний прибуток:</span>
                    <span className="font-bold text-green-600 text-xl">+{potentialProfitInCurrency} {getCurrencySymbol()}</span>
                  </div>
                </div>
                
                {/* Simplified EV Display */}
                <div className={`p-4 rounded-2xl border-2 ${
                  evVerdict.color === 'green' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
                  evVerdict.color === 'yellow' ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' :
                  'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
                }`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${
                        evVerdict.color === 'green' ? 'text-green-800' :
                        evVerdict.color === 'yellow' ? 'text-yellow-800' :
                        'text-red-800'
                      }`}>
                        {evVerdict.icon} {evVerdict.text}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEVDetails(!showEVDetails)}
                        className="h-6 px-2 text-xs"
                      >
                        {showEVDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </Button>
                    </div>
                    <p className={`text-xs ${
                      evVerdict.color === 'green' ? 'text-green-700' :
                      evVerdict.color === 'yellow' ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      {evVerdict.description}
                    </p>
                    
                    {/* EV Details - Collapsible */}
                    {showEVDetails && (
                      <div className={`mt-3 pt-3 border-t ${
                        evVerdict.color === 'green' ? 'border-green-200' :
                        evVerdict.color === 'yellow' ? 'border-yellow-200' :
                        'border-red-200'
                      }`}>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Expected Value:</span>
                            <Badge className={`rounded-full border-0 text-xs px-2 py-0.5 ${
                              isValuePositive ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                              {isValuePositive ? '+' : ''}{expectedValue}%
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">
                            EV показує математичну вигідність прогнозу з урахуванням вашої впевненості та коефіцієнта.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border-2 border-red-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 font-semibold">Макс. програш:</span>
                    <span className="font-bold text-red-600 text-xl">-{stakeInCurrency} {getCurrencySymbol()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risky Teams - Only in Advanced Mode */}
          {formMode === 'advanced' && formData.riskyTeams.length > 0 && (
            <Card className="border-2 border-red-300 shadow-xl rounded-3xl bg-gradient-to-br from-red-50 to-orange-50 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <AlertTriangle className="h-5 w-5" />
                  Ризиковані команди
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {formData.riskyTeams.map((riskyTeam, index) => (
                    <div key={index} className="p-3 border-2 border-red-200 rounded-2xl bg-white space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                          <span className="font-bold text-red-800">{riskyTeam.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRiskyTeam(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-100 h-7 w-7 p-0 rounded-xl"
                        >
                          ✕
                        </Button>
                      </div>
                      <p className="text-xs text-red-700 font-medium">{riskyTeam.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}