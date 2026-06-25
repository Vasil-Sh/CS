import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Calculator, DollarSign, Link, AlertTriangle, Calendar, Trophy, X, Trash2, Shield, Flag, Users, ChevronDown, ChevronUp, Info, RotateCcw, TrendingUp } from 'lucide-react';
import { realGoogleSheetsService, CS2Strategy } from '@/lib/realGoogleSheets';
import { UserDataService } from '@/lib/userDataService';
import { BankrollService } from '@/lib/bankrollService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getStatusBadge, getGameEmoji, getBetTypeOptions } from '@/lib/displayHelpers';
import { parseDota2MatchFromUrl, parseCS2MatchFromUrl, type ParsedMatchResult } from '@/lib/matchUrlParser';
import StrategyViolationDialog from './StrategyViolationDialog';
import { calcTotalExpressOdds, calcExpectedValue, calcPotentialProfit, getValueBetAnalysis, getOverconfidenceWarning, calcKellyCriterion, getExpressRiskLevel, getEVVerdict } from '@/lib/betCalculations';
import { logRender } from '@/lib/devLogger';
import { BettingSidebar } from './BettingSidebar';
import { ExpressEventBuilder } from './ExpressEventBuilder';

export interface MatchPrefillData {
  team1: string;
  team2: string;
  tournament: string;
  format: string;
  date: string;
  matchUrl?: string;
  odds?: string;
  logoTeam1?: string | null;
  logoTeam2?: string | null;
}

interface CS2BettingFormProps {
  onRecordAdded?: () => void;
  prefillData?: MatchPrefillData | null;
  onPrefillConsumed?: () => void;
  expressMatchesData?: MatchPrefillData[] | null;
  onExpressMatchesConsumed?: () => void;
}

interface RiskyTeam {
  name: string;
  game: string;
  status: string;
  notes: string;
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
  game: string;
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
  winProbability?: number;
  logoTeam1?: string | null;
  logoTeam2?: string | null;
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
  currentStep?: number;
  startAmount?: number;
  targetLadderAmount?: number;
  steps?: { step: number; startAmount: number; status: string }[];
}

const MAX_CONFIDENCE = 95;
const DEFAULT_MAX_STAKE_PERCENT = 7;

const getDefaultFormData = (strategyName?: string, betCategory?: string) => ({
  date: new Date().toISOString().split('T')[0],
  game: 'CS2' as 'CS2' | 'Dota2',
  matchUrl: '',
  tournament: '',
  team1: '',
  team2: '',
  format: 'BO3',
  riskyTeams: [] as RiskyTeam[],
  betType: '',
  betCategory: betCategory || 'Ординар',
  selection: '',
  odds: '',
  stake: '',
  currency: 'UAH',
  exchangeRate: (() => { const r = localStorage.getItem('matchiq_exchange_rate'); return r || '44.60'; })(),
  confidence: '',
  strategy: strategyName || '',
  reasoning: '',
  keyFactors: '',
  riskLevel: '',
  notes: '',
  goalId: ''
});

export default function CS2BettingForm({ onRecordAdded, prefillData, onPrefillConsumed, expressMatchesData, onExpressMatchesConsumed }: CS2BettingFormProps) {
  logRender('CS2BettingForm');
  const { user } = useAuth();
  const currentUser = user?.username || '';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsingMatch, setIsParsingMatch] = useState(false);
  const [primaryStrategy, setPrimaryStrategy] = useState<CS2Strategy | null>(null);
  const [strategyViolations, setStrategyViolations] = useState<StrategyViolation[]>([]);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [showViolationDialog, setShowViolationDialog] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [isPrefilled, setIsPrefilled] = useState(false);
  const [isExpressFromMatches, setIsExpressFromMatches] = useState(false);
  const [maxStakePercent, setMaxStakePercent] = useState<number>(() => {
    const saved = UserDataService.getUserData<number>(currentUser, 'max_stake_percent', 0);
    return saved || DEFAULT_MAX_STAKE_PERCENT;
  });

  const [formData, setFormData] = useState(() => {
    const initialCategory = (expressMatchesData && expressMatchesData.length >= 2) ? 'Експрес' : 'Ординар';
    return getDefaultFormData(undefined, initialCategory);
  });

  const [expressEvents, setExpressEvents] = useState<ExpressEvent[]>(() => {
    if (expressMatchesData && expressMatchesData.length >= 2) {
      return expressMatchesData.map(m => ({
        match: `${m.team1} vs ${m.team2}`,
        betType: 'Match Winner',
        selection: m.team1,
        odds: '',
      }));
    }
    return [];
  });

  const expressConsumedRef = useRef(
    !!(expressMatchesData && expressMatchesData.length >= 2)
  );
  const prefillConsumedRef = useRef(false);
  const prefillLogosRef = useRef<{ logoTeam1?: string | null; logoTeam2?: string | null }>({});
  const strategyLoadedRef = useRef(false);

  useEffect(() => {
    UserDataService.setUserData(currentUser, 'max_stake_percent', maxStakePercent);
  }, [maxStakePercent, currentUser]);

  useEffect(() => {
    if (expressMatchesData && expressMatchesData.length >= 2 && expressConsumedRef.current) {
      setIsPrefilled(true);
      setIsExpressFromMatches(true);
      const matchCount = expressMatchesData.length;
      setTimeout(() => {
        onExpressMatchesConsumed?.();
        toast.success(`${matchCount} матчів додано до експресу. Заповніть коефіцієнти та вибір для кожної події.`);
      }, 0);
    }

    if (strategyLoadedRef.current) return;
    strategyLoadedRef.current = true;

    const savedPrimaryStrategy = UserDataService.getUserData<string>(currentUser, 'primary_strategy', '')
      || localStorage.getItem('primaryStrategy') || '';
    if (savedPrimaryStrategy) {
      const strategy = realGoogleSheetsService.getStrategyByName(savedPrimaryStrategy);
      if (strategy) {
        setPrimaryStrategy(strategy);
        setFormData(prev => ({ ...prev, strategy: strategy.name }));
      }
    }

    loadActiveGoals();
  }, []); // run once on mount only

  useEffect(() => {
    if (prefillData && !prefillConsumedRef.current) {
      prefillConsumedRef.current = true;
      prefillLogosRef.current = {
        logoTeam1: prefillData.logoTeam1,
        logoTeam2: prefillData.logoTeam2,
      };

      const formatMap: Record<string, string> = {
        'Bo1': 'BO1',
        'Bo3': 'BO3',
        'Bo5': 'BO5',
      };
      const mappedFormat = formatMap[prefillData.format] || prefillData.format || 'BO3';
      
      setFormData(prev => ({
        ...prev,
        team1: prefillData.team1 || '',
        team2: prefillData.team2 || '',
        tournament: prefillData.tournament || '',
        format: mappedFormat,
        date: prefillData.date ? prefillData.date.split('T')[0] : prev.date,
        matchUrl: prefillData.matchUrl || '',
        odds: prefillData.odds || '',
      }));
      setTimeout(() => {
        onPrefillConsumed?.();
      }, 0);
      toast.success('Дані матчу підставлено у форму');
    }

    if (!prefillData) {
      prefillConsumedRef.current = false;
    }
  }, [prefillData, onPrefillConsumed]);

  useEffect(() => {
    if (expressMatchesData && expressMatchesData.length >= 2 && !expressConsumedRef.current) {
      expressConsumedRef.current = true;

      const prefilledEvents: ExpressEvent[] = expressMatchesData.map(m => ({
        match: `${m.team1} vs ${m.team2}`,
        betType: 'Match Winner',
        selection: m.team1,
        odds: '',
      }));

      setFormData(prev => ({
        ...prev,
        betCategory: 'Експрес',
      }));
      setExpressEvents(prefilledEvents);
      setIsPrefilled(true);
      setIsExpressFromMatches(true);

      const matchCount = expressMatchesData.length;
      setTimeout(() => {
        onExpressMatchesConsumed?.();
        toast.success(`${matchCount} матчів додано до експресу. Заповніть коефіцієнти та вибір для кожної події.`);
      }, 0);
    }

    if (!expressMatchesData) {
      expressConsumedRef.current = false;
    }
  }, [expressMatchesData, onExpressMatchesConsumed]);

  const clearForm = () => {
    setFormData(getDefaultFormData(primaryStrategy?.name));
    setExpressEvents([]);
    setStrategyViolations([]);
    setIsPrefilled(false);
    setIsExpressFromMatches(false);
    toast.success('Форму очищено');
  };

  const loadActiveGoals = () => {
    const goals = UserDataService.getUserData(currentUser, 'goals', []);
    const active = goals.filter((g: Goal) => g.status === 'active');
    setActiveGoals(active);
    console.log('📋 Loaded active goals:', active.length, active);
  };

  const getLastStakeForGoal = (goalId: string): string => {
    try {
      // Read directly from localStorage to get full goal data (including steps)
      const allGoals = UserDataService.getUserData(currentUser, 'goals', []);
      const goal = allGoals.find((g: Goal) => g.id === goalId);
      if (!goal) return '';

      // For ladder goals — calculate amount from current step
      if (goal.type === 'ladder') {
        const steps = goal.steps;
        if (steps && steps.length > 0) {
          // currentStep is a 0-based array index into steps[]
          const idx = goal.currentStep ?? 0;
          if (idx < steps.length && steps[idx].startAmount > 0) {
            return String(Math.round(steps[idx].startAmount * 100) / 100);
          }
        }
        if (goal.startAmount && goal.startAmount > 0) return String(Math.round(goal.startAmount * 100) / 100);
        return '';
      }

      // For non-ladder goals — pull last bet amount
      const allRecords = realGoogleSheetsService.getAllRecords();
      const goalRecords = allRecords
        .filter((r) => r.goalId === goalId)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      
      if (goalRecords.length > 0) {
        const lastAmount = goalRecords[0].originalAmount ?? goalRecords[0].amount;
        if (lastAmount && lastAmount > 0) return String(Math.round(lastAmount * 100) / 100);
      }
    } catch (error) {
      console.error('Error getting last stake for goal:', error);
    }
    return '';
  };

  const validateAgainstStrategy = useCallback(() => {
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
  }, [formData.odds, formData.format, formData.betCategory, primaryStrategy]);

  useEffect(() => {
    validateAgainstStrategy();
  }, [validateAgainstStrategy]);

  useEffect(() => {
    if (formData.team1 || formData.team2) {
      checkRiskyTeams(formData.team1, formData.team2, formData.game);
    }
  }, [formData.team1, formData.team2, formData.game]);

  useEffect(() => {
    if (expressEvents.length === 0) return;
    if (formData.team1 || formData.team2) return;

    const savedRiskyTeams = loadRiskyTeamsFromStorage();
    if (savedRiskyTeams.length === 0) return;

    const gameFilter = getGameFilterValue(formData.game);
    const riskyTeamsFound: RiskyTeam[] = [];
    const addedNames = new Set<string>();

    expressEvents.forEach(event => {
      const teams = event.match.split(' vs ');
      const team1 = teams[0] || '';
      const team2 = teams[1] || '';
      const normalizedTeam1 = normalizeTeamName(team1);
      const normalizedTeam2 = normalizeTeamName(team2);

      savedRiskyTeams.forEach((riskyTeam: RiskyTeam) => {
        if (riskyTeam.game !== gameFilter) return;
        if (addedNames.has(riskyTeam.name)) return;

        const normalizedRiskyTeam = normalizeTeamName(riskyTeam.name);

        if (normalizedTeam1 === normalizedRiskyTeam || normalizedTeam2 === normalizedRiskyTeam ||
            normalizedTeam1.includes(normalizedRiskyTeam) || normalizedTeam2.includes(normalizedRiskyTeam)) {
          riskyTeamsFound.push({
            name: riskyTeam.name,
            game: riskyTeam.game,
            status: riskyTeam.status,
            notes: riskyTeam.notes
          });
          addedNames.add(riskyTeam.name);
        }
      });
    });

    if (riskyTeamsFound.length > 0) {
      setFormData(prev => ({ ...prev, riskyTeams: riskyTeamsFound }));
    }
  }, [expressEvents, formData.game]);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedPrimaryStrategy = UserDataService.getUserData<string>(currentUser, 'primary_strategy', '');
      if (savedPrimaryStrategy) {
        const strategy = realGoogleSheetsService.getStrategyByName(savedPrimaryStrategy);
        if (strategy) {
          setPrimaryStrategy(strategy);
          setFormData(prev => ({ ...prev, strategy: strategy.name }));
        } else {
          setPrimaryStrategy(null);
          setFormData(prev => ({ ...prev, strategy: '' }));
        }
      } else {
        setPrimaryStrategy(null);
        setFormData(prev => ({ ...prev, strategy: '' }));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

// ── Pure utility functions (outside component, stable references) ──

function loadRiskyTeamsFromStorage(): RiskyTeam[] {
    try {
      const saved = localStorage.getItem('admin_risky_teams');
      if (saved) {
        const savedTeams = JSON.parse(saved) as RiskyTeam[];
        return savedTeams.map((team: RiskyTeam) => ({
          name: team.name,
          game: team.game || 'CS',
          status: team.status || 'Обережно',
          notes: team.notes || ''
        }));
      }
    } catch (error) {
      console.error('Error loading risky teams from storage:', error);
    }
    return [];
  };

function normalizeTeamName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

function getGameFilterValue(formGame: 'CS2' | 'Dota2'): string {
    return formGame === 'CS2' ? 'CS' : 'Dota';
  };

  const checkRiskyTeams = (team1: string, team2: string, currentGame: 'CS2' | 'Dota2') => {
    if (!team1 && !team2) {
      setFormData(prev => ({ ...prev, riskyTeams: [] }));
      return;
    }

    const savedRiskyTeams = loadRiskyTeamsFromStorage();
    const riskyTeamsFound: RiskyTeam[] = [];
    
    const normalizedTeam1 = normalizeTeamName(team1);
    const normalizedTeam2 = normalizeTeamName(team2);
    const gameFilter = getGameFilterValue(currentGame);
    
    savedRiskyTeams.forEach((riskyTeam: RiskyTeam) => {
      if (riskyTeam.game !== gameFilter) return;

      const normalizedRiskyTeam = normalizeTeamName(riskyTeam.name);
      
      if (normalizedTeam1 === normalizedRiskyTeam || normalizedTeam2 === normalizedRiskyTeam ||
          normalizedTeam1.includes(normalizedRiskyTeam) || normalizedTeam2.includes(normalizedRiskyTeam)) {
        riskyTeamsFound.push({
          name: riskyTeam.name,
          game: riskyTeam.game,
          status: riskyTeam.status,
          notes: riskyTeam.notes
        });
      }
    });
    
    setFormData(prev => ({
      ...prev,
      riskyTeams: riskyTeamsFound
    }));
  };

  // parseDota2MatchFromUrl, parseCS2MatchFromUrl — imported from @/lib/matchUrlParser

  const parseMatchFromUrl = async (url: string) => {
    setIsParsingMatch(true);
    try {
      let result = null;
      
      if (url.includes('dota2')) {
        result = parseDota2MatchFromUrl(url);
        if (result) {
          const savedRiskyTeams = loadRiskyTeamsFromStorage();
          const riskyTeamsFound: RiskyTeam[] = [];
          
          const normalizedTeam1 = normalizeTeamName(result.team1);
          const normalizedTeam2 = normalizeTeamName(result.team2);
          const gameFilter = 'Dota';
          
          savedRiskyTeams.forEach((riskyTeam: RiskyTeam) => {
            if (riskyTeam.game !== gameFilter) return;
            const normalizedRiskyTeam = normalizeTeamName(riskyTeam.name);
            if (normalizedTeam1 === normalizedRiskyTeam || normalizedTeam2 === normalizedRiskyTeam ||
                normalizedTeam1.includes(normalizedRiskyTeam) || normalizedTeam2.includes(normalizedRiskyTeam)) {
              riskyTeamsFound.push({ name: riskyTeam.name, game: riskyTeam.game, status: riskyTeam.status, notes: riskyTeam.notes });
            }
          });
          
          setFormData(prev => ({
            ...prev,
            game: 'Dota2',
            team1: result.team1,
            team2: result.team2,
            tournament: result.tournament,
            riskyTeams: riskyTeamsFound
          }));
          
          toast.success('Інформацію про Dota 2 матч успішно отримано!');
        } else {
          toast.error('Не вдалося розпарсити Dota 2 URL');
        }
      } else if (url.includes('hltv.org/matches/')) {
        result = parseCS2MatchFromUrl(url);
        if (result) {
          const savedRiskyTeams = loadRiskyTeamsFromStorage();
          const riskyTeamsFound: RiskyTeam[] = [];
          
          const normalizedTeam1 = normalizeTeamName(result.team1);
          const normalizedTeam2 = normalizeTeamName(result.team2);
          const gameFilter = 'CS';
          
          savedRiskyTeams.forEach((riskyTeam: RiskyTeam) => {
            if (riskyTeam.game !== gameFilter) return;
            const normalizedRiskyTeam = normalizeTeamName(riskyTeam.name);
            if (normalizedTeam1 === normalizedRiskyTeam || normalizedTeam2 === normalizedRiskyTeam ||
                normalizedTeam1.includes(normalizedRiskyTeam) || normalizedTeam2.includes(normalizedRiskyTeam)) {
              riskyTeamsFound.push({ name: riskyTeam.name, game: riskyTeam.game, status: riskyTeam.status, notes: riskyTeam.notes });
            }
          });
          
          setFormData(prev => ({
            ...prev,
            game: 'CS2',
            team1: result.team1,
            team2: result.team2,
            tournament: result.tournament,
            riskyTeams: riskyTeamsFound
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

  // getStatusBadge, getGameEmoji — imported from @/lib/displayHelpers

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
    setIsExpressFromMatches(false);
    toast.success('Всі події експресу очищено');
  };

  const totalExpressOdds = calcTotalExpressOdds(expressEvents);
  const expressRisk = getExpressRiskLevel(expressEvents.length);

  const convertToUAH = (amount: number, currency: string, rate: number) => {
    if (currency === 'USD') {
      return amount * rate;
    }
    return amount;
  };

  const updateExpressEvent = (index: number, field: keyof ExpressEvent, value: string) => {
    setExpressEvents(prev => prev.map((ev, i) => i === index ? { ...ev, [field]: value } : ev));
  };

  const processBetSubmission = async () => {
    setIsSubmitting(true);

    try {
      const stakeAmount = parseFloat(formData.stake);
      const exchangeRate = parseFloat(formData.exchangeRate);
      const winProbability = parseFloat(formData.confidence);
      
      const stakeInUAH = convertToUAH(stakeAmount, formData.currency, exchangeRate);
      
      let betTypeWithCategory: string;
      let finalOdds: number;
      let matchName: string;

      if (formData.betCategory === 'Експрес') {
        const totalOdds = calcTotalExpressOdds(expressEvents);
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
        game: formData.game === 'CS2' ? 'CS2' : 'Dota2',
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
        notes: [formData.reasoning, formData.keyFactors ? `Key Factors: ${formData.keyFactors}` : '', formData.notes ? `Notes: ${formData.notes}` : ''].filter(Boolean).join('\n\n') || '',
        goalId: finalGoalId,
        winProbability: isNaN(winProbability) ? undefined : winProbability,
        logoTeam1: formData.betCategory === 'Експрес' ? undefined : prefillLogosRef.current.logoTeam1,
        logoTeam2: formData.betCategory === 'Експрес' ? undefined : prefillLogosRef.current.logoTeam2,
      };

      await realGoogleSheetsService.addRecord(record);
      
      if (finalGoalId) {
        const goalName = activeGoals.find(g => g.id === finalGoalId)?.name;
        toast.success(`✅ Запис створено та прив'язано до цілі "${goalName}". Переглянути можна на екрані "Останні записи".`);
      } else {
        toast.success('Ваш запис успішно створено! Переглянути його можна на екрані "Останні записи".');
      }
      
      setFormData(getDefaultFormData(primaryStrategy?.name));
      
      setExpressEvents([]);
      setStrategyViolations([]);
      setIsPrefilled(false);
      setIsExpressFromMatches(false);

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

    if (formData.betCategory === 'Експрес') {
      const missingOdds = expressEvents.filter(e => !e.odds || parseFloat(e.odds) <= 0);
      if (missingOdds.length > 0) {
        toast.error(`Заповніть коефіцієнти для всіх подій експресу (${missingOdds.length} без коефіцієнта)`);
        return;
      }
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

    if (strategyViolations.length > 0) {
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

  const handleConfidenceChange = (value: string) => {
    const numValue = parseFloat(value);
    if (value === '' || isNaN(numValue)) {
      setFormData(prev => ({ ...prev, confidence: value }));
      return;
    }
    if (numValue > MAX_CONFIDENCE) {
      setFormData(prev => ({ ...prev, confidence: String(MAX_CONFIDENCE) }));
      toast.warning(`⚠️ Максимальна впевненість обмежена до ${MAX_CONFIDENCE}%. У спорті 100% впевненість нереалістична.`);
      return;
    }
    if (numValue < 1) {
      setFormData(prev => ({ ...prev, confidence: '1' }));
      return;
    }
    setFormData(prev => ({ ...prev, confidence: value }));
  };

  const applyKellyAmount = (amount: number) => {
    if (amount > 0) {
      setFormData(prev => ({ ...prev, stake: String(amount) }));
      toast.success(`Суму змінено на ${amount} ₴ (рекомендація Келлі)`);
    }
  };

  const hasConfidence = formData.confidence !== '' && !isNaN(parseFloat(formData.confidence));

  const { expectedValue, potentialProfit, evVerdict, valueBetAnalysis, kellyData, overconfidenceWarning } = useMemo(() => {
    const ev = calcExpectedValue(formData.betCategory, expressEvents, formData.odds, formData.confidence);
    const profit = calcPotentialProfit(formData.betCategory, expressEvents, formData.odds, formData.stake);
    const verdict = getEVVerdict(parseFloat(ev));
    const value = getValueBetAnalysis(formData.betCategory, expressEvents, formData.odds, formData.confidence);

    let kelly = null;
    if (hasConfidence) {
      const betsStore = realGoogleSheetsService.getAllRecords();
      const bankrollStats = BankrollService.getBankrollStats(currentUser, betsStore);
      kelly = calcKellyCriterion(formData.betCategory, expressEvents, formData.odds, formData.confidence, bankrollStats.currentBank, maxStakePercent);
    }

    let warning = null;
    if (hasConfidence) {
      warning = getOverconfidenceWarning(formData.betCategory, expressEvents, formData.odds, formData.confidence);
    }

    return { expectedValue: ev, potentialProfit: profit, evVerdict: verdict, valueBetAnalysis: value, kellyData: kelly, overconfidenceWarning: warning };
  }, [formData.betCategory, formData.odds, formData.stake, formData.confidence, expressEvents, currentUser, maxStakePercent, hasConfidence]);

  const isValuePositive = parseFloat(expectedValue) > 0;
  const confidenceValue = parseFloat(formData.confidence);
  const isHighConfidence = hasConfidence && confidenceValue > 90;
  const potentialProfitInCurrency = potentialProfit;
  const stakeInCurrency = formData.stake;

  const getCurrencySymbol = () => {
    return '₴';
  };

  // getBetTypeOptions — imported from @/lib/displayHelpers (accepts game param)

  const inputClass = "rounded-2xl border-[#E5E7EB] bg-white h-11 text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#111827] focus:ring-0 transition-colors";
  const selectTriggerClass = "rounded-2xl border-[#E5E7EB] bg-white h-11 text-[#111827] focus:border-[#111827] focus:ring-0 transition-colors";
  const labelClass = "text-sm font-medium text-[#374151]";
  const sectionTitleClass = "text-base font-semibold text-[#111827] flex items-center gap-2.5 bg-[#F3F4F6] px-4 py-2.5 rounded-2xl -mx-0";

  void potentialProfit;
  void stakeInCurrency;
  void pendingSubmit;

  // ── Tilt protection: block after N consecutive losses ──
  const tiltBlock = useMemo(() => {
    const blockKey = `tilt_block_${currentUser}`;
    const stored = localStorage.getItem(blockKey);
    if (stored) {
      const block = JSON.parse(stored) as { until: number; reason: string };
      if (Date.now() < block.until) {
        return { blocked: true, reason: block.reason, minutesLeft: Math.ceil((block.until - Date.now()) / 60000) };
      }
      // Block expired — remove
      localStorage.removeItem(blockKey);
    }

    const blockAfter = primaryStrategy?.activityLimits?.enabled
      ? (primaryStrategy.activityLimits.blockAfterLosses ?? 3)
      : null;

    if (!blockAfter || blockAfter < 1) return { blocked: false, reason: '', minutesLeft: 0 };

    const allBets = realGoogleSheetsService.getAllRecords();
    // Sort by date descending, count consecutive losses
    const sorted = [...allBets]
      .filter(b => b.result === 'Win' || b.result === 'Loss')
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return (b.createdAt || dateB) - (a.createdAt || dateA);
      });

    let consecutiveLosses = 0;
    for (const bet of sorted) {
      if (bet.result === 'Loss') consecutiveLosses++;
      else break;
    }

    if (consecutiveLosses >= blockAfter) {
      const blockMinutes = primaryStrategy?.activityLimits?.blockDurationMinutes ?? 60;
      const until = Date.now() + blockMinutes * 60000;
      const reason = `Ти програв ${consecutiveLosses} раз${consecutiveLosses === 1 ? '' : consecutiveLosses < 5 ? 'и' : 'ів'} поспіль. Зроби паузу на ${blockMinutes} хв — це допоможе уникнути тілт-ставок.`;
      localStorage.setItem(blockKey, JSON.stringify({ until, reason }));
      return { blocked: true, reason, minutesLeft: blockMinutes };
    }

    return { blocked: false, reason: '', minutesLeft: 0 };
  }, [currentUser, primaryStrategy]);

  const allExpressEventsComplete = expressEvents.length > 0 && expressEvents.every(e => e.odds && parseFloat(e.odds) > 0 && e.selection && e.betType);

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

      {/* Tilt Protection Block */}
      {tiltBlock.blocked && (
        <div className="rounded-3xl overflow-hidden border-2 border-[#FCA5A5]" style={{ boxShadow: '0 4px 24px rgba(239,68,68,0.15)' }}>
          <div className="flex items-start gap-4 px-6 py-5" style={{ background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' }}>
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FEE2E2] flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-[#DC2626]" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-[#991B1B] mb-1">🔒 Тілт-захист активовано</p>
              <p className="text-sm text-[#B91C1C] leading-relaxed">{tiltBlock.reason}</p>
              <p className="text-xs text-[#DC2626] mt-2 font-medium">
                Залишилось: {tiltBlock.minutesLeft} хв. Форма ставки заблокована до завершення паузи.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Banner */}
      {primaryStrategy && (
        <div className="rounded-3xl overflow-hidden border border-[#BFDBFE]"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
        >
          <div 
            className="flex items-center gap-4 px-6 py-5"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)' }}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Shield className="h-5 w-5 text-white" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80">
                Активна стратегія: <span className="font-semibold text-white">{primaryStrategy.name}</span>
              </p>
              <p className="text-sm text-white/60 mt-0.5 truncate">{primaryStrategy.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Violations */}
      {strategyViolations.length > 0 && (
        <div className={`rounded-3xl px-6 py-5 border ${
          strategyViolations.some(v => v.severity === 'serious') 
            ? 'border-[#FCA5A5] bg-[#FEF2F2]' 
            : 'border-[#FDE68A] bg-[#FFFBEB]'
        }`} style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
              strategyViolations.some(v => v.severity === 'serious') ? 'text-[#EF4444]' : 'text-[#F59E0B]'
            }`} strokeWidth={1.5} />
            <div className="flex-1">
              <p className={`text-sm font-semibold mb-2 ${
                strategyViolations.some(v => v.severity === 'serious') ? 'text-[#991B1B]' : 'text-[#92400E]'
              }`}>
                Відхилення від стратегії &ldquo;{primaryStrategy?.name}&rdquo;
              </p>
              <div className="space-y-2">
                {strategyViolations.map((violation, index) => (
                  <div key={index} className={`p-3 rounded-2xl ${
                    violation.severity === 'serious' ? 'bg-[#FEE2E2]' : 'bg-[#FEF3C7]'
                  }`}>
                    <p className={`text-sm ${
                      violation.severity === 'serious' ? 'text-[#991B1B]' : 'text-[#92400E]'
                    }`}>
                      • {violation.message}
                    </p>
                    <p className={`text-xs mt-1 flex items-center gap-1 ${
                      violation.severity === 'serious' ? 'text-[#B91C1C]' : 'text-[#B45309]'
                    }`}>
                      <Info className="h-3 w-3 flex-shrink-0" strokeWidth={1.5} />
                      {violation.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div className={`lg:col-span-2 space-y-6 ${tiltBlock.blocked ? 'opacity-50 pointer-events-none select-none' : ''}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Main Form */}
            <div className="bg-white border border-[#D1D5DB] rounded-3xl overflow-hidden"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
            >
              {/* Form Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#F3F4F6]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#EFF6FF] flex-shrink-0">
                    <Plus className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
                  </div>
                  <span className="text-lg font-semibold text-[#111827]">Новий запис</span>
                  {isPrefilled && isExpressFromMatches && (
                    <Badge className="bg-[#DBEAFE] text-[#2563EB] border-0 rounded-full text-xs font-medium px-2.5 py-0.5 hover:bg-[#DBEAFE]">
                      Експрес з матчів
                    </Badge>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearForm}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] border border-[#E5E7EB] hover:border-[#D1D5DB] transition-all duration-200"
                >
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
                  Очистити
                </button>
              </div>
              
              <div className="p-6 space-y-8">
                {/* === Section: Basic Settings === */}
                <div className="space-y-4">
                  <h3 className={sectionTitleClass}>
                    <Calendar className="h-4.5 w-4.5 text-[#6B7280]" strokeWidth={1.5} />
                    Основні налаштування
                  </h3>
                
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="date" className={labelClass}>Дата матчу</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        required
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="game" className={labelClass}>Гра</Label>
                      <Select value={formData.game} onValueChange={(value: 'CS2' | 'Dota2') => setFormData({...formData, game: value})}>
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CS2">🎯 CS2</SelectItem>
                          <SelectItem value="Dota2">🛡️ Dota 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="betCategory" className={labelClass}>Категорія</Label>
                      <Select 
                        key={formData.betCategory}
                        value={formData.betCategory} 
                        onValueChange={(value) => {
                          setFormData({...formData, betCategory: value});
                          if (value === 'Ординар') {
                            setExpressEvents([]);
                            setIsExpressFromMatches(false);
                          }
                        }}
                      >
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ординар">Ординар</SelectItem>
                          <SelectItem value="Експрес">Експрес (до 10 подій)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.betCategory === 'Ординар' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="format" className={labelClass}>Формат</Label>
                        <Select value={formData.format} onValueChange={(value) => setFormData({...formData, format: value})}>
                          <SelectTrigger className={selectTriggerClass}>
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

                    {activeGoals.length > 0 && (
                      <div className="space-y-1.5">
                        <Label htmlFor="goalId" className={`${labelClass} flex items-center gap-1.5`}>
                          <Flag className="h-3.5 w-3.5 text-[#6B7280]" strokeWidth={1.5} />
                          Ціль
                        </Label>
                        <Select 
                          value={formData.goalId || 'all'} 
                          onValueChange={(value) => {
                            const selectedGoalId = value === 'all' ? '' : value;
                            if (selectedGoalId) {
                              const lastStake = getLastStakeForGoal(selectedGoalId);
                              if (lastStake) {
                                setFormData(prev => ({ ...prev, goalId: selectedGoalId, stake: lastStake }));
                                toast.info(`Суму автоматично заповнено з останнього прогнозу цілі: ${lastStake} ₴`);
                                return;
                              }
                            }
                            setFormData(prev => ({ ...prev, goalId: selectedGoalId }));
                          }}
                        >
                          <SelectTrigger className={selectTriggerClass}>
                            <SelectValue placeholder="Без цілі" />
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
                      </div>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[#F3F4F6]" />

                {/* === Section: Match Info & Bet Details === */}
                {!(isExpressFromMatches && expressEvents.length > 0) && (
                  <div className="space-y-4">
                    <h3 className={sectionTitleClass}>
                      <Users className="h-4.5 w-4.5 text-[#6B7280]" strokeWidth={1.5} />
                      Інформація про матч і деталі запису
                    </h3>
                  
                    {/* Match URL */}
                    <div className="space-y-1.5">
                      <Label htmlFor="matchUrl" className={`${labelClass} flex items-center gap-2`}>
                        <Link className="h-4 w-4 text-[#6B7280]" strokeWidth={1.5} />
                        {formData.game === 'CS2' ? 'HLTV URL матчу' : 'Dota 2 URL матчу'} (необов&apos;язково)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="matchUrl"
                          value={formData.matchUrl}
                          onChange={(e) => handleUrlChange(e.target.value)}
                          placeholder={formData.game === 'CS2' ? 'https://www.hltv.org/matches/...' : 'https://...dota2/.../team1-vs-team2/...'}
                          className={`flex-1 ${inputClass}`}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => parseMatchFromUrl(formData.matchUrl)}
                          disabled={isParsingMatch || !formData.matchUrl}
                          className="rounded-2xl px-5 border-[#E5E7EB] hover:bg-[#F3F4F6] hover:border-[#D1D5DB] h-11 text-sm font-medium"
                        >
                          {isParsingMatch ? 'Оновлення...' : 'Оновити'}
                        </Button>
                      </div>
                      <p className="text-xs text-[#9CA3AF]">
                        {formData.game === 'CS2' ? 'Вставте посилання з HLTV для автозаповнення' : 'Вставте посилання на Dota 2 матч для автозаповнення'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="team1" className={labelClass}>
                          Команда 1 {formData.betCategory === 'Експрес' && expressEvents.length === 0 && <span className="text-[#EF4444]">*</span>}
                        </Label>
                        <Input
                          id="team1"
                          value={formData.team1}
                          onChange={(e) => setFormData({...formData, team1: e.target.value})}
                          placeholder={formData.game === 'CS2' ? 'NAVI' : 'Team Spirit'}
                          required={formData.betCategory === 'Ординар' || (formData.betCategory === 'Експрес' && expressEvents.length === 0)}
                          className={inputClass}
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label htmlFor="team2" className={labelClass}>
                          Команда 2 {formData.betCategory === 'Експрес' && expressEvents.length === 0 && <span className="text-[#EF4444]">*</span>}
                        </Label>
                        <Input
                          id="team2"
                          value={formData.team2}
                          onChange={(e) => setFormData({...formData, team2: e.target.value})}
                          placeholder={formData.game === 'CS2' ? 'G2' : 'OG'}
                          required={formData.betCategory === 'Ординар' || (formData.betCategory === 'Експрес' && expressEvents.length === 0)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="betType" className={labelClass}>
                          Тип прогнозу {formData.betCategory === 'Експрес' && expressEvents.length === 0 && <span className="text-[#EF4444]">*</span>}
                        </Label>
                        <Select 
                          value={formData.betType} 
                          onValueChange={(value) => setFormData({...formData, betType: value})} 
                          required={formData.betCategory === 'Ординар' || (formData.betCategory === 'Експрес' && expressEvents.length === 0)}
                        >
                          <SelectTrigger className={selectTriggerClass}>
                            <SelectValue placeholder="Оберіть тип прогнозу" />
                          </SelectTrigger>
                          <SelectContent>
                            {getBetTypeOptions(formData.game).map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label htmlFor="selection" className={labelClass}>
                          Вибір {formData.betCategory === 'Експрес' && expressEvents.length === 0 && <span className="text-[#EF4444]">*</span>}
                        </Label>
                        <Select 
                          value={formData.selection} 
                          onValueChange={(value) => setFormData({...formData, selection: value})}
                          disabled={!formData.team1 || !formData.team2}
                        >
                          <SelectTrigger className={selectTriggerClass}>
                            <SelectValue placeholder={formData.team1 && formData.team2 ? "Оберіть команду" : "Спочатку введіть команди"} />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.team1 && <SelectItem value={formData.team1}>{formData.team1}</SelectItem>}
                            {formData.team2 && <SelectItem value={formData.team2}>{formData.team2}</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="odds" className={labelClass}>
                          Коефіцієнт {formData.betCategory === 'Експрес' && expressEvents.length === 0 && <span className="text-[#EF4444]">*</span>}
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
                          className={inputClass}
                        />
                      </div>
                    </div>

                    {/* Show "Add event to express" button ONLY when NOT pre-filled from matches */}
                    {formData.betCategory === 'Експрес' && !isExpressFromMatches && (
                      <Button
                        type="button"
                        onClick={addExpressEvent}
                        disabled={expressEvents.length >= 10}
                        className="w-full bg-[#111827] hover:bg-[#1F2937] text-white rounded-2xl font-medium py-6 text-base transition-all"
                      >
                        <Plus className="h-5 w-5 mr-2" strokeWidth={1.5} />
                        Додати подію до експресу ({expressEvents.length}/10)
                      </Button>
                    )}
                  </div>
                )}

                {/* Financial Details */}
                {(formData.betCategory === 'Ординар' || (formData.betCategory === 'Експрес' && expressEvents.length > 0)) && (
                  <>
                    <div className="border-t border-[#F3F4F6]" />
                    
                    <div className="space-y-4">
                      <h3 className={sectionTitleClass}>
                        <DollarSign className="h-4.5 w-4.5 text-[#6B7280]" strokeWidth={1.5} />
                        Фінансові деталі
                      </h3>
                    
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="stake" className={labelClass}>
                            Сума прогнозу ({formData.currency === 'USD' ? '$' : '₴'}) <span className="text-[#EF4444]">*</span>
                          </Label>
                          <div className="flex gap-2">
                            <div className="inline-flex items-center rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-1 h-11 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => setFormData({...formData, currency: 'UAH'})}
                                className={`flex items-center justify-center w-9 h-full rounded-xl text-sm font-semibold transition-all ${
                                  formData.currency === 'UAH'
                                    ? 'bg-white text-[#111827] shadow-sm'
                                    : 'text-[#9CA3AF] hover:text-[#6B7280]'
                                }`}
                                aria-label="Гривня"
                                title="Гривня (UAH)"
                              >
                                ₴
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormData({...formData, currency: 'USD'})}
                                className={`flex items-center justify-center w-9 h-full rounded-xl text-sm font-semibold transition-all ${
                                  formData.currency === 'USD'
                                    ? 'bg-white text-[#111827] shadow-sm'
                                    : 'text-[#9CA3AF] hover:text-[#6B7280]'
                                }`}
                                aria-label="Долар"
                                title="Долар США (USD)"
                              >
                                $
                              </button>
                            </div>
                            <Input
                              id="stake"
                              type="number"
                              min="1"
                              step="0.01"
                              value={formData.stake}
                              onChange={(e) => setFormData({...formData, stake: e.target.value})}
                              placeholder="100"
                              required
                              className={`flex-1 ${inputClass}`}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label htmlFor="confidence" className={`${labelClass} flex items-center gap-1.5`}>
                            Впевненість (%, макс. {MAX_CONFIDENCE})
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#E5E7EB] cursor-help">
                                    <Info className="h-3 w-3 text-[#6B7280]" strokeWidth={2} />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[280px] text-sm">
                                  <p className="font-medium mb-1">Ваша оцінка ймовірності виграшу</p>
                                  <p className="text-xs text-muted-foreground">
                                    Вкажіть від 1 до {MAX_CONFIDENCE}%. У спорті 100% впевненість нереалістична через непередбачувані фактори 
                                    (травми, помилки суддів, форс-мажори). Максимум обмежено до {MAX_CONFIDENCE}% для реалістичних розрахунків.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Label>
                          <Input
                            id="confidence"
                            type="number"
                            min="1"
                            max={MAX_CONFIDENCE}
                            value={formData.confidence}
                            onChange={(e) => handleConfidenceChange(e.target.value)}
                            placeholder="70"
                            className={`${inputClass} ${isHighConfidence ? 'border-[#F59E0B] focus:border-[#F59E0B]' : ''}`}
                          />
                          {isHighConfidence && (
                            <p className="text-xs text-[#D97706] flex items-center gap-1.5 mt-1">
                              <AlertTriangle className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
                              Впевненість &gt;90% — будьте обережні. У спорті завжди є непередбачувані фактори.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Express Events Display */}
            {formData.betCategory === 'Експрес' && expressEvents.length > 0 && (
              <ExpressEventBuilder
                expressEvents={expressEvents}
                totalExpressOdds={totalExpressOdds}
                expressRisk={expressRisk}
                allExpressEventsComplete={allExpressEventsComplete}
                game={formData.game}
                onUpdateEvent={updateExpressEvent}
                onRemoveEvent={removeExpressEvent}
                onClearAll={clearExpressEvents}
              />
            )}

{/* Submit Button */}
            {(formData.betCategory === 'Ординар' || (formData.betCategory === 'Експрес' && expressEvents.length > 0)) && (
              <Button 
                type="submit" 
                disabled={isSubmitting || tiltBlock.blocked || (formData.betCategory === 'Експрес' && !allExpressEventsComplete)} 
                className="w-full bg-[#111827] hover:bg-[#1F2937] text-white rounded-2xl font-medium py-7 text-base transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Додавання...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" strokeWidth={1.5} />
                    Додати запис
                  </>
                )}
              </Button>
            )}
          </form>
        </div>


        {/* Right Sidebar */}
        <BettingSidebar
          stake={formData.stake}
          odds={formData.odds}
          confidence={formData.confidence}
          betCategory={formData.betCategory}
          currency={formData.currency}
          totalExpressOdds={totalExpressOdds}
          expressEventsCount={expressEvents.length}
          potentialProfit={potentialProfit}
          potentialProfitInCurrency={potentialProfitInCurrency}
          expectedValue={expectedValue}
          evVerdict={evVerdict}
          isValuePositive={isValuePositive}
          valueBetAnalysis={valueBetAnalysis}
          kellyData={kellyData}
          overconfidenceWarning={overconfidenceWarning}
          hasConfidence={hasConfidence}
          isHighConfidence={isHighConfidence}
          riskyTeams={formData.riskyTeams}
          maxStakePercent={maxStakePercent}
          onMaxStakePercentChange={setMaxStakePercent}
          onApplyKellyAmount={applyKellyAmount}
          onRemoveRiskyTeam={removeRiskyTeam}
        />
      </div>
    </div>
  );
}
