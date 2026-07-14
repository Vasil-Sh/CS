import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserDataService } from '@/lib/userDataService';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/stores/appStore';
import CompletedGoalResultModal from '@/components/CompletedGoalResultModal';
import { CARD_BASE_STYLE, CARD_HOVER_STYLE } from '@/lib/cardStyles';
import { logRender } from '@/lib/devLogger';
import GoalsToolbar from './betting-form/GoalsToolbar';
import GoalsEmptyState from '@/components/goals/GoalsEmptyState';
import DeleteGoalDialog from '@/components/goals/DeleteGoalDialog';
import { 
  Target, 
  TrendingUp, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Trophy,
  DollarSign,
  Percent,
  RefreshCw,
  Info,
  Eye,
  Star,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  BarChart3,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

type GoalType = 'amount' | 'ladder' | 'roi' | 'winrate';
type GoalStatus = 'active' | 'completed' | 'failed';
type LadderMode = 'strict' | 'soft';

interface Bet {
  result: string;
  odds: number;
  date: string;
  goalId?: string;
  profit?: number;
  amount?: number;
}

interface Goal {
  id: string;
  name: string;
  type: GoalType;
  status: GoalStatus;
  createdAt: string;
  completedAt?: string;
  isPrimary?: boolean;
  targetAmount?: number;
  currentAmount?: number;
  startAmount?: number;
  targetLadderAmount?: number;
  minOdds?: number;
  maxOdds?: number;
  currentStep?: number;
  totalSteps?: number;
  ladderMode?: LadderMode;
  steps?: LadderStep[];
  avgOdds?: number;
  currentBank?: number;
  targetROI?: number;
  currentROI?: number;
  targetWinRate?: number;
  currentWinRate?: number;
  betsPerDay?: number;
}

interface LadderStep {
  step: number;
  startAmount: number;
  minPlannedAmount?: number;
  maxPlannedAmount?: number;
  plannedAmount?: number;
  actualAmount?: number;
  actualOdds?: number;
  deviation?: number;
  status: 'completed' | 'current' | 'locked';
  completedAt?: string;
}

interface OddsScenario {
  odds: number;
  steps: number;
  speed: string;
  emoji: string;
  description: string;
}

// Maximum steps limit to prevent browser crashes
const MAX_LADDER_STEPS = 500;

// Card hover styles matching Analytics page
const cardBaseStyle = CARD_BASE_STYLE;

const cardHoverStyle = CARD_HOVER_STYLE;

export default function GoalsManager() {
  logRender('GoalsManager');
  const { user } = useAuth();
  const currentUser = user?.username || '';
  const bumpStrategy = useAppStore((s) => s.bumpStrategy);
  const [goals, setGoals] = useState<Goal[]>(() => {
    const loadedGoals = UserDataService.getUserData(currentUser, 'goals', []);
    return loadedGoals.map((goal: Goal) => {
      if (goal.type === 'ladder') {
        if (goal.steps && goal.minOdds && goal.maxOdds) {
          const migratedSteps = goal.steps.map(step => {
            if (!step.minPlannedAmount || !step.maxPlannedAmount) {
              return { ...step, minPlannedAmount: Math.round(step.startAmount * (goal.minOdds || 1.3) * 100) / 100, maxPlannedAmount: Math.round(step.startAmount * (goal.maxOdds || 5) * 100) / 100 };
            }
            return step;
          });
          return { ...goal, steps: migratedSteps, avgOdds: goal.avgOdds || goal.minOdds };
        }
        if (!goal.avgOdds && goal.minOdds && goal.maxOdds) return { ...goal, avgOdds: goal.minOdds };
      }
      return goal;
    });
  });

  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCompletedResultModal, setShowCompletedResultModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isStepsCalculationExpanded, setIsStepsCalculationExpanded] = useState(false);
  const [isLadderOverviewExpanded, setIsLadderOverviewExpanded] = useState(true);
  const [isStepsProgressionExpanded, setIsStepsProgressionExpanded] = useState(true);
  const [isRulesExpanded, setIsRulesExpanded] = useState<Record<string, boolean>>({});

  // Use string values for numeric inputs to avoid intermediate parse issues
  const [newGoal, setNewGoal] = useState({
    name: '', type: 'amount' as GoalType, targetAmount: 100000, startAmount: 100,
    targetLadderAmount: 100000, minOdds: 1.3, maxOdds: 5, ladderMode: 'soft' as LadderMode,
    targetROI: 50, targetWinRate: 65, betsPerDay: 5
  });

  // String state for coefficient inputs to handle typing gracefully
  const [minOddsStr, setMinOddsStr] = useState('1.3');
  const [maxOddsStr, setMaxOddsStr] = useState('5');
  const [startAmountStr, setStartAmountStr] = useState('100');
  const [targetLadderAmountStr, setTargetLadderAmountStr] = useState('100000');
  const [targetAmountStr, setTargetAmountStr] = useState('100000');
  const [targetROIStr, setTargetROIStr] = useState('50');
  const [targetWinRateStr, setTargetWinRateStr] = useState('65');
  const [betsPerDayStr, setBetsPerDayStr] = useState('5');

  useEffect(() => { if (currentUser) { UserDataService.setUserData(currentUser, 'goals', goals); } }, [goals, currentUser]);

  // Load goals from API on mount — merge with localStorage to preserve progress
  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const apiGoals = await UserDataService.fetchGoals() as (Record<string, unknown> & { id: string; type: string; name: string; target?: unknown; current?: unknown; isCompleted?: boolean; config?: Record<string, unknown> })[];
        if (apiGoals && apiGoals.length > 0) {
          // Read current localStorage goals to preserve progress values
          const localGoals = UserDataService.getUserData<Goal[]>(currentUser, 'goals', []);
          const localMap = new Map(localGoals.map(g => [g.id, g]));

          const mapped = apiGoals.map(g => {
            const local = localMap.get(g.id);
            const backendConfig = g.config || {};
            const base = {
              id: g.id,
              type: g.type as GoalType,
              name: g.name,
              targetAmount: g.type === 'amount' ? Number(g.target) : undefined,
              targetLadderAmount: g.type === 'ladder' ? Number(g.target) : undefined,
              targetROI: g.type === 'roi' ? Number(g.target) : undefined,
              targetWinRate: g.type === 'winrate' ? Number(g.target) : undefined,
              // Preserve local progress — API always stores 0
              currentAmount: local?.currentAmount ?? (g.type === 'amount' ? Number(g.current) : undefined),
              currentStep: local?.currentStep ?? (g.type === 'ladder' ? Number(g.current) : undefined),
              currentROI: local?.currentROI ?? (g.type === 'roi' ? Number(g.current) : undefined),
              currentWinRate: local?.currentWinRate ?? (g.type === 'winrate' ? Number(g.current) : undefined),
              status: local?.status ?? (g.isCompleted ? 'completed' : 'active'),
              ...backendConfig,
              ...(local ? { steps: local.steps, currentBank: local.currentBank } : {}),
              _backendId: g.id,
            };
            return base;
          }) as Goal[];
          setGoals(mapped);
          UserDataService.setUserDataSync(currentUser, 'goals', mapped);
        }
      } catch { /* use localStorage data */ }
    })();
  }, [currentUser]);

  // Sync goal progress + status to API when it changes
  const prevGoalSnapshotRef = useRef('');
  useEffect(() => {
    const snapshot = goals.map(g => `${g.id}:${g.currentAmount ?? g.currentROI ?? g.currentWinRate ?? g.currentStep ?? 0}:${g.status}`).join(',');
    if (prevGoalSnapshotRef.current && prevGoalSnapshotRef.current !== snapshot) {
      goals.forEach(g => {
        const backendId = (g as { _backendId?: string })._backendId || g.id;
        const currentVal = g.type === 'amount' ? g.currentAmount : g.type === 'roi' ? g.currentROI : g.type === 'winrate' ? g.currentWinRate : g.currentStep;
        const payload: Record<string, unknown> = {
          config: g,
          current: Number(currentVal ?? 0),
        };
        if (g.status === 'completed') payload.isCompleted = true;
        if (Object.keys(payload).length > 0) {
          UserDataService.updateGoal(backendId, payload).catch((err: unknown) => { if (import.meta.env.DEV) console.warn("[API sync] failed:", String(err)) });
        }
      });
    }
    prevGoalSnapshotRef.current = snapshot;
  }, [goals]);

  const calculateRemainingSteps = (currentBank: number, targetAmount: number, minOdds: number): number => {
    if (!minOdds || minOdds <= 1 || !isFinite(minOdds) || !currentBank || currentBank <= 0 || !targetAmount || targetAmount <= 0) return 0;
    let steps = 0, amount = currentBank;
    while (amount < targetAmount && steps < MAX_LADDER_STEPS) { amount *= minOdds; steps++; }
    return steps;
  };

  const updateGoalsProgress = async () => {
    let betsData: Bet[] = [];
    try {
      betsData = (await UserDataService.fetchBets()) as Bet[];
    } catch {
      betsData = UserDataService.getUserData(currentUser, 'mybets_data', []);
    }
    // Always update — even with 0 bets (must reset progress to zero)
    const updatedGoals = goals.map(goal => {
      if (goal.status !== 'active') return goal;
      switch (goal.type) {
        case 'amount': {
          const goalBets = betsData.filter((bet: Bet) => bet.goalId === goal.id);
          const totalProfit = goalBets.reduce((sum: number, bet: Bet) => {
            if (bet.result === 'Win') return sum + (bet.profit || ((bet.odds - 1) * (bet.amount || 100)));
            if (bet.result === 'Loss') return sum - (bet.amount || 100);
            return sum;
          }, 0);
          const isCompleted = totalProfit >= (goal.targetAmount || 0);
          return { ...goal, currentAmount: totalProfit, status: isCompleted ? 'completed' as GoalStatus : 'active' as GoalStatus, completedAt: isCompleted ? new Date().toISOString() : undefined };
        }
        case 'ladder': {
          const goalBets = betsData.filter((bet: Bet) => bet.goalId === goal.id && bet.result === 'Win');
          // Also check by goal name (some bets store goalId as the goal's name, not UUID)
          const goalByName = betsData.filter((bet: Bet) => !bet.goalId && bet.result === 'Win');
          // Also include bets matching the odds range without explicit goalId
          const oddsMatchedBets = betsData.filter((bet: Bet) =>
            !bet.goalId && bet.result === 'Win' &&
            bet.odds >= (goal.minOdds || 1.3) && bet.odds <= (goal.maxOdds || 5)
          );
          // Combine: goalId-matched first, then odds-matched
          const allMatchingBets = [...goalBets, ...oddsMatchedBets].filter(
            (bet, idx, arr) => arr.findIndex(b => b === bet) === idx // dedupe
          );
          if (import.meta.env.DEV) {
            console.log(`[Goals] Ladder "${goal.name}": goalId matches=${goalBets.length}, odds matches=${oddsMatchedBets.length}, total=${allMatchingBets.length}`);
          }
          const minOdds = goal.minOdds || 1.3, maxOdds = goal.maxOdds || 5;
          // Always start from scratch: reset all steps, replay bets from step 0
          let currentStepIndex = 0;
          const steps = (goal.steps || []).map((s, i) => ({
            ...s,
            status: i === 0 ? 'current' as const : 'locked' as const,
            actualAmount: undefined,
            actualOdds: undefined,
            deviation: undefined,
            completedAt: undefined,
          }));
          const sortedBets = allMatchingBets.sort((a: Bet, b: Bet) => new Date(a.date).getTime() - new Date(b.date).getTime());
          if (import.meta.env.DEV) {
            console.log(`[Goals] Ladder "${goal.name}": steps=${steps.length}, step0.startAmount=${steps[0]?.startAmount}, bets:`, sortedBets.map(b => ({ amount: b.amount, odds: b.odds, goalId: b.goalId, result: b.result, date: b.date })));
          }
          // Step-driven: for each ladder step, find the BEST unused bet (by diffPct) that matches.
          // Picking the closest amount match prevents regressions (e.g. step 2=650 gets 1118 bet,
          // then step 3=1700 gets 650 bet → progression goes backwards).
          const usedBetIndices = new Set<number>();
          for (let stepIdx = 0; stepIdx < steps.length; stepIdx++) {
            const cs = steps[stepIdx];
            let bestBet: Bet | null = null;
            let bestIdx = -1;
            let bestDiffPct = Infinity;
            for (let bi = 0; bi < sortedBets.length; bi++) {
              if (usedBetIndices.has(bi)) continue;
              const bet = sortedBets[bi];
              const betAmount = bet.amount || 0;
              const isExplicitlyLinked = !!bet.goalId;
              const tol = isExplicitlyLinked ? 0.80 : 0.50;
              const diff = Math.abs(betAmount - cs.startAmount);
              const diffPct = cs.startAmount ? diff / cs.startAmount : 999;
              const betAmountMatches = diffPct <= tol;
              const oddsMatch = isExplicitlyLinked || (bet.odds >= minOdds && bet.odds <= maxOdds);
              if (import.meta.env.DEV) {
                console.log(`[Goals]   step=${cs.step} betAmount=${betAmount} stepStart=${cs.startAmount} diffPct=${diffPct.toFixed(2)} tol=${tol} amountMatch=${betAmountMatches} oddsMatch=${oddsMatch} linked=${isExplicitlyLinked}`);
              }
              if (betAmountMatches && oddsMatch && diffPct < bestDiffPct) {
                bestBet = bet;
                bestIdx = bi;
                bestDiffPct = diffPct;
              }
            }
            if (!bestBet) break;
            usedBetIndices.add(bestIdx);
            const bet = bestBet;
            const actualWinAmount = Math.round((bet.amount || 0) * bet.odds * 100) / 100;
            const minPlanned = cs.minPlannedAmount || Math.round(cs.startAmount * minOdds * 100) / 100;
            steps[stepIdx] = { ...cs, status: 'completed', completedAt: bet.date, actualAmount: actualWinAmount, actualOdds: bet.odds, deviation: actualWinAmount - minPlanned };
            currentStepIndex = stepIdx + 1;
            if (stepIdx + 1 < steps.length) {
              steps[stepIdx + 1] = { ...steps[stepIdx + 1], startAmount: actualWinAmount, minPlannedAmount: Math.round(actualWinAmount * minOdds * 100) / 100, maxPlannedAmount: Math.round(actualWinAmount * maxOdds * 100) / 100, status: 'current' };
            }
          }
          const prevActual = currentStepIndex > 0 ? steps[currentStepIndex - 1]?.actualAmount : undefined;
          const currentBank = prevActual != null ? prevActual : (goal.startAmount || 0);
          const remainingSteps = calculateRemainingSteps(currentBank, goal.targetLadderAmount || 100000, minOdds);
          const isCompleted = currentBank >= (goal.targetLadderAmount || 100000);
          return { ...goal, avgOdds: minOdds, currentStep: currentStepIndex, totalSteps: currentStepIndex + remainingSteps, currentBank, steps, status: isCompleted ? 'completed' as GoalStatus : 'active' as GoalStatus, completedAt: isCompleted ? new Date().toISOString() : undefined };
        }
        case 'roi': {
          const goalBets = betsData.filter((bet: Bet) => bet.goalId === goal.id && bet.result !== 'Pending');
          // Reset to 0 when no bets found
          if (!goalBets.length) return { ...goal, currentROI: 0 };
          const totalStake = goalBets.reduce((s: number, b: Bet) => s + (b.amount || 100), 0);
          const totalProfit = goalBets.reduce((s: number, b: Bet) => { if (b.result === 'Win') return s + (b.profit || ((b.odds - 1) * (b.amount || 100))); if (b.result === 'Loss') return s - (b.amount || 100); return s; }, 0);
          const currentROI = (totalProfit / totalStake) * 100;
          const isCompleted = currentROI >= (goal.targetROI || 0);
          return { ...goal, currentROI, status: isCompleted ? 'completed' as GoalStatus : 'active' as GoalStatus, completedAt: isCompleted ? new Date().toISOString() : undefined };
        }
        case 'winrate': {
          const goalBets = betsData.filter((bet: Bet) => bet.goalId === goal.id && bet.result !== 'Pending');
          // Reset to 0 when no bets found
          if (!goalBets.length) return { ...goal, currentWinRate: 0 };
          const wins = goalBets.filter((b: Bet) => b.result === 'Win').length;
          const currentWinRate = (wins / goalBets.length) * 100;
          const isCompleted = currentWinRate >= (goal.targetWinRate || 0);
          return { ...goal, currentWinRate, status: isCompleted ? 'completed' as GoalStatus : 'active' as GoalStatus, completedAt: isCompleted ? new Date().toISOString() : undefined };
        }
        default: return goal;
      }
    });
    setGoals(updatedGoals);
    // Write to localStorage synchronously so StrategyOverviewHeader sees fresh data immediately
    UserDataService.setUserDataSync(currentUser, 'goals', updatedGoals);
  };

  const handleManualUpdate = () => { setIsUpdating(true); updateGoalsProgress().then(() => { bumpStrategy(); toast.success('Прогрес цілей оновлено!'); setIsUpdating(false); }); };

  const calculateLadderSteps = (start: number, target: number, minOdds: number, maxOdds: number): LadderStep[] => {
    // Guard against invalid values that would cause infinite loops
    if (!start || start <= 0 || !target || target <= 0 || !minOdds || minOdds <= 1 || !maxOdds || maxOdds <= 1 || !isFinite(minOdds) || !isFinite(maxOdds) || start >= target) {
      return [];
    }
    const steps: LadderStep[] = [];
    let cur = start, n = 1;
    while (cur < target && n <= MAX_LADDER_STEPS) {
      steps.push({ step: n, startAmount: cur, minPlannedAmount: cur * minOdds, maxPlannedAmount: cur * maxOdds, status: n === 1 ? 'current' : 'locked' });
      cur *= minOdds;
      n++;
    }
    return steps;
  };

  const calculateOddsScenarios = (start: number, target: number, minOdds: number, maxOdds: number): OddsScenario[] => {
    // Guard against invalid values
    if (!start || start <= 0 || !target || target <= 0 || !minOdds || minOdds <= 1 || !maxOdds || maxOdds <= 1 || !isFinite(minOdds) || !isFinite(maxOdds) || start >= target) {
      return [];
    }
    const scenarios: OddsScenario[] = [];
    [minOdds, (minOdds + maxOdds) / 2, maxOdds].forEach(odds => {
      if (odds <= 1 || !isFinite(odds)) return;
      const steps = calculateLadderSteps(start, target, odds, odds);
      let speed = '', emoji = '', description = '';
      if (odds === minOdds) { speed = 'Повільно'; emoji = '🐢'; description = 'Найбезпечніше'; }
      else if (odds === maxOdds) { speed = 'Швидко'; emoji = '🚀'; description = 'Ризиковано'; }
      else { speed = 'Оптимально'; emoji = '⚡'; description = 'Баланс'; }
      scenarios.push({ odds: parseFloat(odds.toFixed(2)), steps: steps.length, speed, emoji, description });
    });
    return scenarios;
  };

  // Safe parse helpers
  const safeParseFloat = (val: string): number => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const safeParseInt = (val: string): number => {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Check if ladder preview values are valid for computation
  const isLadderPreviewValid = (): boolean => {
    const start = safeParseFloat(startAmountStr);
    const target = safeParseFloat(targetLadderAmountStr);
    const min = safeParseFloat(minOddsStr);
    const max = safeParseFloat(maxOddsStr);
    return start > 0 && target > 0 && min > 1 && max > 1 && start < target && isFinite(min) && isFinite(max);
  };

  const validateGoalFields = (): boolean => {
    if (!newGoal.name.trim()) { toast.error('Введіть назву цілі'); return false; }
    switch (newGoal.type) {
      case 'amount': if (!newGoal.targetAmount || newGoal.targetAmount <= 0) { toast.error('Цільова сума > 0'); return false; } break;
      case 'ladder':
        if (!newGoal.startAmount || newGoal.startAmount <= 0) { toast.error('Початкова сума > 0'); return false; }
        if (!newGoal.targetLadderAmount || newGoal.targetLadderAmount <= 0) { toast.error('Цільова сума > 0'); return false; }
        if (newGoal.startAmount >= newGoal.targetLadderAmount) { toast.error('Ціль > початкової суми'); return false; }
        if (!newGoal.minOdds || newGoal.minOdds < 1.01) { toast.error('Мін. коеф. ≥ 1.01'); return false; }
        if (!newGoal.maxOdds || newGoal.maxOdds < 1.01) { toast.error('Макс. коеф. ≥ 1.01'); return false; }
        if (newGoal.minOdds >= newGoal.maxOdds) { toast.error('Макс > Мін'); return false; }
        break;
      case 'roi': if (!newGoal.targetROI || newGoal.targetROI <= 0) { toast.error('ROI > 0'); return false; } break;
      case 'winrate': if (!newGoal.targetWinRate || newGoal.targetWinRate <= 0 || newGoal.targetWinRate > 100) { toast.error('Win Rate 1–100'); return false; } break;
    }
    return true;
  };

  const syncNewGoalFromStrings = () => {
    return {
      ...newGoal,
      startAmount: safeParseFloat(startAmountStr),
      targetLadderAmount: safeParseFloat(targetLadderAmountStr),
      minOdds: safeParseFloat(minOddsStr),
      maxOdds: safeParseFloat(maxOddsStr),
      targetAmount: safeParseFloat(targetAmountStr),
      targetROI: safeParseFloat(targetROIStr),
      targetWinRate: safeParseFloat(targetWinRateStr),
      betsPerDay: safeParseInt(betsPerDayStr),
    };
  };

  const createGoal = async () => {
    const synced = syncNewGoalFromStrings();
    const goalData = { ...synced };

    if (!goalData.name.trim()) { toast.error('Введіть назву цілі'); return; }

    switch (goalData.type) {
      case 'amount':
        if (!goalData.targetAmount || goalData.targetAmount <= 0) { toast.error('Цільова сума > 0'); return; }
        break;
      case 'ladder':
        if (!goalData.startAmount || goalData.startAmount <= 0) { toast.error('Початкова сума > 0'); return; }
        if (!goalData.targetLadderAmount || goalData.targetLadderAmount <= 0) { toast.error('Цільова сума > 0'); return; }
        if (goalData.startAmount >= goalData.targetLadderAmount) { toast.error('Ціль > початкової суми'); return; }
        if (!goalData.minOdds || goalData.minOdds < 1.01) { toast.error('Мін. коеф. ≥ 1.01'); return; }
        if (!goalData.maxOdds || goalData.maxOdds < 1.01) { toast.error('Макс. коеф. ≥ 1.01'); return; }
        if (goalData.minOdds >= goalData.maxOdds) { toast.error('Макс > Мін'); return; }
        break;
      case 'roi':
        if (!goalData.targetROI || goalData.targetROI <= 0) { toast.error('ROI > 0'); return; }
        break;
      case 'winrate':
        if (!goalData.targetWinRate || goalData.targetWinRate <= 0 || goalData.targetWinRate > 100) { toast.error('Win Rate 1–100'); return; }
        break;
    }

    const active = goals.filter(g => g.status === 'active');
    if (active.length >= 25) { toast.error('Максимум 25 активних цілей'); return; }
    const goal: Goal = { id: Date.now().toString(), name: goalData.name, type: goalData.type, status: 'active', createdAt: new Date().toISOString(), isPrimary: active.length === 0, betsPerDay: goalData.betsPerDay };
    switch (goalData.type) {
      case 'amount': goal.targetAmount = goalData.targetAmount; goal.currentAmount = 0; break;
      case 'ladder': {
        const steps = calculateLadderSteps(goalData.startAmount, goalData.targetLadderAmount, goalData.minOdds, goalData.maxOdds);
        Object.assign(goal, { startAmount: goalData.startAmount, targetLadderAmount: goalData.targetLadderAmount, minOdds: goalData.minOdds, maxOdds: goalData.maxOdds, avgOdds: goalData.minOdds, currentStep: 0, totalSteps: steps.length, ladderMode: goalData.ladderMode, steps, currentBank: goalData.startAmount });
        break;
      }
      case 'roi': goal.targetROI = goalData.targetROI; goal.currentROI = 0; break;
      case 'winrate': goal.targetWinRate = goalData.targetWinRate; goal.currentWinRate = 0; break;
    }
    const updated = [...goals, goal];
    setGoals(updated);
    UserDataService.setUserDataSync(currentUser, 'goals', updated);
    // Sync to backend API (proper payload) and save backend UUID
    UserDataService.createGoal({
      type: goal.type,
      name: goal.name,
      target: goal.targetAmount ?? goal.targetLadderAmount ?? goal.targetROI ?? goal.targetWinRate ?? 0,
      current: 0,
      deadline: goal.deadline,
      isCompleted: false,
      config: goal,
    }).then((backendGoal: { id?: string }) => {
      if (backendGoal?.id) {
        setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, _backendId: backendGoal.id } : g));
      }
    }).catch((err: unknown) => { if (import.meta.env.DEV) console.warn("[API sync] failed:", String(err)) });
    bumpStrategy();
    setShowCreateDialog(false);
    resetNewGoalForm();
    toast.success('Ціль створена!', { description: '💡 Прив\'яжіть ставки до цієї цілі' });
  };

  const resetNewGoalForm = () => {
    setNewGoal({ name: '', type: 'amount', targetAmount: 100000, startAmount: 100, targetLadderAmount: 100000, minOdds: 1.3, maxOdds: 5, ladderMode: 'soft', targetROI: 50, targetWinRate: 65, betsPerDay: 5 });
    setMinOddsStr('1.3');
    setMaxOddsStr('5');
    setStartAmountStr('100');
    setTargetLadderAmountStr('100000');
    setTargetAmountStr('100000');
    setTargetROIStr('50');
    setTargetWinRateStr('65');
    setBetsPerDayStr('5');
  };

  const confirmDeleteGoal = (goalId: string) => { setGoalToDelete(goalId); setShowDeleteDialog(true); };
  const deleteGoal = () => { if (!goalToDelete) return; const goal = goals.find(g => g.id === goalToDelete); const u = goals.filter(g => g.id !== goalToDelete); setGoals(u); UserDataService.setUserDataSync(currentUser, 'goals', u); bumpStrategy(); setShowDeleteDialog(false); setGoalToDelete(null); toast.success('Ціль видалена'); const backendId = (goal as { _backendId?: string })?._backendId || goalToDelete; UserDataService.deleteGoal(backendId).catch((err: unknown) => { if (import.meta.env.DEV) console.warn("[API sync] failed:", String(err)) }); };
  const setPrimaryGoal = (goalId: string) => {
    let updated: Goal[];
    if (goals.find(g => g.id === goalId)?.isPrimary) {
      // Знімаємо основну — просто прибираємо позначку
      updated = goals.map(g => {
        if (g.id === goalId) return { ...g, isPrimary: false };
        return g;
      });
      toast.success('Головну ціль скасовано');
    } else {
      updated = goals.map(g => ({ ...g, isPrimary: g.id === goalId }));
      toast.success('Головна ціль змінена');
    }
    setGoals(updated);
    UserDataService.setUserDataSync(currentUser, 'goals', updated);
    bumpStrategy();
  };
  const openDetailsDialog = (goal: Goal) => { setSelectedGoal(goal); setShowDetailsDialog(true); setIsStepsCalculationExpanded(false); setIsLadderOverviewExpanded(true); setIsStepsProgressionExpanded(true); };
  const openCompletedGoalResult = (goal: Goal) => { setSelectedGoal(goal); setShowCompletedResultModal(true); };

  const getGoalProgress = (goal: Goal): number => {
    switch (goal.type) {
      case 'amount': return ((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100;
      case 'ladder': return ((goal.currentStep || 0) / (goal.totalSteps || 1)) * 100;
      case 'roi': return ((goal.currentROI || 0) / (goal.targetROI || 1)) * 100;
      case 'winrate': return ((goal.currentWinRate || 0) / (goal.targetWinRate || 1)) * 100;
      default: return 0;
    }
  };

  const getGoalIcon = (type: GoalType) => {
    switch (type) {
      case 'amount': return <DollarSign className="h-5 w-5" strokeWidth={1.5} />;
      case 'ladder': return <TrendingUp className="h-5 w-5" strokeWidth={1.5} />;
      case 'roi': return <Percent className="h-5 w-5" strokeWidth={1.5} />;
      case 'winrate': return <Target className="h-5 w-5" strokeWidth={1.5} />;
    }
  };

  const getGoalTypeLabel = (type: GoalType): string => {
    switch (type) { case 'amount': return 'Сума'; case 'ladder': return 'Лесенка'; case 'roi': return 'ROI'; case 'winrate': return 'Win Rate'; }
  };

  const getKeyMetric = (goal: Goal): { label: string; value: string; color: string } => {
    switch (goal.type) {
      case 'amount': return { label: 'Залишилось', value: `${((goal.targetAmount || 0) - (goal.currentAmount || 0)).toFixed(0)} грн прибутку`, color: 'text-blue-500' };
      case 'ladder': return { label: 'Поточний крок', value: `${goal.currentStep} / ${goal.totalSteps}`, color: 'text-[#8B5CF6]' };
      case 'roi': return { label: 'ROI', value: `${(goal.currentROI || 0).toFixed(1)}%`, color: 'text-green-500' };
      case 'winrate': return { label: 'Win Rate', value: `${(goal.currentWinRate || 0).toFixed(1)}%`, color: 'text-amber-500' };
    }
  };

  const getNextBetHint = (goal: Goal): string | null => {
    if (goal.type === 'ladder' && goal.steps) {
      const cs = goal.steps.find(s => s.status === 'current');
      if (cs) return `Ставка: ${cs.startAmount.toFixed(0)} ₴ (${goal.minOdds}–${goal.maxOdds})`;
    }
    if (goal.type === 'amount') { const r = (goal.targetAmount || 0) - (goal.currentAmount || 0); if (r > 0) return `До цілі: ${r.toFixed(0)} ₴`; }
    return null;
  };

  const getDisciplineStatus = (goal: Goal): { status: 'good' | 'warning'; label: string; icon: JSX.Element } => {
    const betsData = UserDataService.getUserData(currentUser, 'mybets_data', []);
    const goalBets = betsData.filter((bet: Bet) => bet.goalId === goal.id);
    if (!goalBets.length) return { status: 'good', label: 'Дотримані', icon: <CheckCircle className="h-4 w-4" strokeWidth={1.5} /> };
    const hasV = goalBets.some((bet: Bet) => { if (goal.type === 'ladder') return bet.odds < (goal.minOdds || 0) || bet.odds > (goal.maxOdds || 999); return false; });
    if (hasV) return { status: 'warning', label: 'Відхилення', icon: <AlertTriangle className="h-4 w-4" strokeWidth={1.5} /> };
    return { status: 'good', label: 'Дотримані', icon: <CheckCircle className="h-4 w-4" strokeWidth={1.5} /> };
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  const tabs = [
    { id: 'active', label: 'Активні цілі', icon: Target },
    { id: 'completed', label: 'Завершені', icon: Trophy },
  ];

  return (
    <div className="space-y-6">
      <GoalsToolbar
        activeTab={activeTab}
        isUpdating={isUpdating}
        activeGoalsCount={activeGoals.length}
        maxGoals={25}
        tabs={tabs}
        onTabChange={(id) => setActiveTab(id as 'active' | 'completed')}
        onUpdate={handleManualUpdate}
        onCreateGoal={() => setShowCreateDialog(true)}
      />

        {/* Active Tab */}
        {activeTab === 'active' && (
          <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            {activeGoals.length === 0 ? (
              <GoalsEmptyState type="active" onCreateGoal={() => setShowCreateDialog(true)} />
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {activeGoals.map(goal => {
                  const progress = getGoalProgress(goal);
                  const keyMetric = getKeyMetric(goal);
                  const discipline = getDisciplineStatus(goal);
                  const hint = getNextBetHint(goal);
                  const isPrimary = goal.isPrimary;

                  return (
                    <Card key={goal.id}
                      className={`rounded-3xl bg-slate-50 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-all ${isPrimary ? 'border-2 border-blue-500' : 'border border-slate-200'}`}
                      style={cardBaseStyle}
                      onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
                      onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
                    >
                      <CardContent className="p-5 flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className={`p-2 rounded-2xl flex-shrink-0 ${
                              goal.type === 'ladder' ? 'bg-violet-100' :
                              goal.type === 'amount' ? 'bg-blue-100' :
                              goal.type === 'roi' ? 'bg-[#D1FAE5]' : 'bg-yellow-100'
                            }`}>
                              {getGoalIcon(goal.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 text-base leading-tight">{goal.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge className="bg-gray-100 text-gray-700 border-0 rounded-xl text-xs px-2 py-0 font-medium">
                                  {getGoalTypeLabel(goal.type)}
                                </Badge>
                                {isPrimary && (
                                  <Badge className="bg-blue-50 text-blue-500 border-0 rounded-xl text-xs px-1.5 py-0 font-medium">
                                    <Star className="h-3 w-3 fill-blue-500" strokeWidth={1.5} />
                                    <span className="ml-0.5">Основна</span>
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Key metric */}
                        <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200 mb-3">
                          <p className="text-sm text-gray-500 leading-tight">{keyMetric.label}</p>
                          <p className={`text-2xl font-bold tracking-tight leading-tight ${keyMetric.color}`}>
                            {keyMetric.value}
                          </p>
                        </div>

                        {/* Hint */}
                        {hint && (
                          <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-2xl mb-3">
                            <Zap className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" strokeWidth={1.5} />
                            <p className="text-sm text-amber-800 font-medium">{hint}</p>
                          </div>
                        )}

                        {/* Progress */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm text-gray-500">Прогрес</span>
                            <span className="text-sm font-semibold text-gray-900">{progress.toFixed(1)}%</span>
                          </div>
                          <Progress value={Math.min(progress, 100)} className="h-2 rounded-xl" />
                        </div>

                        {/* Discipline */}
                        <Collapsible open={isRulesExpanded[goal.id] || false} onOpenChange={(open) => setIsRulesExpanded({...isRulesExpanded, [goal.id]: open})}>
                          <CollapsibleTrigger className="w-full">
                            <div className={`px-3 py-2 rounded-2xl border transition-all ${
                              discipline.status === 'good' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium text-gray-900">Правила</span>
                                  <div className={discipline.status === 'good' ? 'text-green-500' : 'text-red-500'}>{discipline.icon}</div>
                                  <span className={`text-xs font-medium ${discipline.status === 'good' ? 'text-green-600' : 'text-red-600'}`}>{discipline.label}</span>
                                </div>
                                {isRulesExpanded[goal.id] ? <ChevronUp className="h-3.5 w-3.5 text-gray-500" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-500" />}
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className={`mt-1.5 px-3 py-2 rounded-2xl border text-sm ${
                              discipline.status === 'good' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                            }`}>
                              {goal.type === 'ladder' && (
                                <div className="space-y-1">
                                  <div><span className="text-gray-500">Коеф.: </span><span className="font-medium text-gray-900">{goal.minOdds} – {goal.maxOdds}</span></div>
                                  <div><span className="text-gray-500">Банк: </span><span className="font-medium text-gray-900">{(goal.currentBank || 0).toFixed(0)} грн</span></div>
                                </div>
                              )}
                              <div><span className="text-gray-500">Ставок/день: </span><span className="font-medium text-gray-900">{goal.betsPerDay || 'Без обмежень'}</span></div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-3 group/actions">
                          {goal.type === 'ladder' && (
                            <Button onClick={() => openDetailsDialog(goal)}
                              className="flex-1 rounded-xl bg-primary hover:bg-blue-700 text-white font-semibold h-10">
                              <Eye className="h-4 w-4 mr-1" strokeWidth={1.5} />
                              Деталі
                            </Button>
                          )}
                          <Button
                            onClick={() => setPrimaryGoal(goal.id)}
                            variant="outline"
                            className={`flex-1 rounded-xl font-medium h-10 transition-all ${isPrimary ? 'border-amber-500 text-amber-500 bg-amber-50 hover:bg-amber-500 hover:text-white' : 'border-gray-200 text-gray-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50'}`}
                            title="Зробити основною"
                          >
                            <Star className={`h-4 w-4 ${isPrimary ? 'fill-amber-500' : ''}`} strokeWidth={1.5} />
                          </Button>
                          <Button
                            onClick={() => confirmDeleteGoal(goal.id)}
                            variant="outline"
                            className="flex-1 rounded-xl border-gray-200 text-gray-400 hover:border-red-500 hover:text-red-500 hover:bg-red-50 font-medium h-10 transition-all"
                            title="Видалити"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Completed Tab */}
        {activeTab === 'completed' && (
          <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            {completedGoals.length === 0 ? (
              <GoalsEmptyState type="completed" onCreateGoal={() => setShowCreateDialog(true)} />
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {completedGoals.map(goal => {
                  // Derive a headline result value per goal type
                  let resultLabel = 'Результат';
                  let resultValue = '';
                  switch (goal.type) {
                    case 'amount':
                      resultLabel = 'Досягнуто';
                      resultValue = `${(goal.currentAmount ?? goal.targetAmount ?? 0).toFixed(0)} грн`;
                      break;
                    case 'ladder':
                      resultLabel = 'Фінальний банк';
                      resultValue = `${(goal.currentBank ?? goal.targetLadderAmount ?? 0).toFixed(0)} грн`;
                      break;
                    case 'roi':
                      resultLabel = 'ROI';
                      resultValue = `${(goal.currentROI ?? goal.targetROI ?? 0).toFixed(1)}%`;
                      break;
                    case 'winrate':
                      resultLabel = 'Win Rate';
                      resultValue = `${(goal.currentWinRate ?? goal.targetWinRate ?? 0).toFixed(1)}%`;
                      break;
                  }

                  // Duration in days between creation and completion
                  const createdMs = new Date(goal.createdAt).getTime();
                  const completedMs = goal.completedAt ? new Date(goal.completedAt).getTime() : createdMs;
                  const durationDays = Math.max(1, Math.round((completedMs - createdMs) / (1000 * 60 * 60 * 24)));

                  // Ladder extra info
                  const ladderStepsDone = goal.type === 'ladder' ? (goal.currentStep ?? goal.steps?.filter(s => s.status === 'completed').length ?? 0) : 0;

                  return (
                    <Card key={goal.id}
                      className="border border-green-200 rounded-3xl bg-slate-50 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-all"
                      style={cardBaseStyle}
                      onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
                      onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
                    >
                      <CardContent className="p-5 flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="p-2 bg-green-50 rounded-2xl flex-shrink-0">
                              <Trophy className="h-5 w-5 text-green-500" strokeWidth={1.5} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 text-base leading-tight truncate" title={goal.name}>{goal.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge className="bg-gray-100 text-gray-700 border-0 rounded-xl text-xs px-2 py-0 font-medium">
                                  {getGoalTypeLabel(goal.type)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-green-500 text-white border-0 rounded-xl text-xs px-2.5 py-0.5 font-medium flex-shrink-0">
                            <CheckCircle className="h-3 w-3 mr-1" strokeWidth={1.5} />
                            Завершено
                          </Badge>
                        </div>

                        {/* Key result */}
                        <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200 mb-3">
                          <p className="text-sm text-gray-500 leading-tight">{resultLabel}</p>
                          <p className="text-2xl font-bold tracking-tight leading-tight text-green-500">
                            {resultValue}
                          </p>
                        </div>

                        {/* Secondary stats — fills the middle space */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-white rounded-2xl px-3 py-2 border border-gray-200">
                            <p className="text-xs text-gray-500 leading-tight">Завершено</p>
                            <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">
                              {goal.completedAt ? new Date(goal.completedAt).toLocaleDateString('uk-UA') : '—'}
                            </p>
                          </div>
                          <div className="bg-white rounded-2xl px-3 py-2 border border-gray-200">
                            <p className="text-xs text-gray-500 leading-tight">Тривалість</p>
                            <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">
                              {durationDays} {durationDays === 1 ? 'день' : durationDays < 5 ? 'дні' : 'днів'}
                            </p>
                          </div>
                          {goal.type === 'ladder' && (
                            <>
                              <div className="bg-white rounded-2xl px-3 py-2 border border-gray-200">
                                <p className="text-xs text-gray-500 leading-tight">Кроків пройдено</p>
                                <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">
                                  {ladderStepsDone}
                                </p>
                              </div>
                              <div className="bg-white rounded-2xl px-3 py-2 border border-gray-200">
                                <p className="text-xs text-gray-500 leading-tight">Старт</p>
                                <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">
                                  {(goal.startAmount ?? 0).toFixed(0)} грн
                                </p>
                              </div>
                            </>
                          )}
                          {goal.type === 'amount' && (
                            <div className="bg-white rounded-2xl px-3 py-2 border border-gray-200 col-span-2">
                              <p className="text-xs text-gray-500 leading-tight">Ціль</p>
                              <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">
                                {(goal.targetAmount ?? 0).toFixed(0)} грн
                              </p>
                            </div>
                          )}
                          {goal.type === 'roi' && (
                            <div className="bg-white rounded-2xl px-3 py-2 border border-gray-200 col-span-2">
                              <p className="text-xs text-gray-500 leading-tight">Цільовий ROI</p>
                              <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">
                                {(goal.targetROI ?? 0).toFixed(1)}%
                              </p>
                            </div>
                          )}
                          {goal.type === 'winrate' && (
                            <div className="bg-white rounded-2xl px-3 py-2 border border-gray-200 col-span-2">
                              <p className="text-xs text-gray-500 leading-tight">Цільовий Win Rate</p>
                              <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">
                                {(goal.targetWinRate ?? 0).toFixed(1)}%
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-auto">
                          <Button
                            onClick={() => openCompletedGoalResult(goal)}
                            className="flex-1 rounded-xl bg-primary hover:bg-blue-700 text-white font-semibold h-10"
                          >
                            <Eye className="h-4 w-4 mr-1" strokeWidth={1.5} />
                            Деталі
                          </Button>
                          <Button
                            onClick={() => confirmDeleteGoal(goal.id)}
                            variant="outline"
                            className="flex-1 rounded-xl border-gray-200 text-gray-400 hover:border-red-500 hover:text-red-500 hover:bg-red-50 font-medium h-10 transition-all"
                            title="Видалити"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

      {/* Create Goal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) resetNewGoalForm();
      }}>
        <DialogContent className="rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 p-0 gap-0">
          <DialogHeader className="pt-4 pb-3 px-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-2xl">
                <Plus className="h-5 w-5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">Створити нову ціль</DialogTitle>
                <DialogDescription className="text-base text-gray-500 mt-0.5">Оберіть тип цілі та встановіть параметри</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="border-t border-gray-200" />

          <div className="space-y-4 pt-4 pb-4 px-6 bg-gray-100">
            <div>
              <Label htmlFor="goalName" className="text-base font-medium text-gray-900">Назва цілі <span className="text-red-500">*</span></Label>
              <Input id="goalName" value={newGoal.name} onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })} placeholder="Наприклад: Досягти 100,000 грн" className="rounded-2xl border border-gray-200 focus:border-primary mt-1.5 h-11 text-base" />
            </div>
            <div>
              <Label htmlFor="goalType" className="text-base font-medium text-gray-900">Тип цілі <span className="text-red-500">*</span></Label>
              <Select value={newGoal.type} onValueChange={(v: GoalType) => setNewGoal({ ...newGoal, type: v })}>
                <SelectTrigger className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">💰 Досягти суми</SelectItem>
                  <SelectItem value="ladder">📈 Лесенка (прогресія)</SelectItem>
                  <SelectItem value="roi">📊 Досягти ROI</SelectItem>
                  <SelectItem value="winrate">🎯 Досягти Win Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newGoal.type === 'amount' && (
              <div>
                <Label htmlFor="targetAmount" className="text-base font-medium text-gray-900">Цільова сума (грн) <span className="text-red-500">*</span></Label>
                <Input id="targetAmount" type="number" min="1" value={targetAmountStr} onChange={(e) => {
                  setTargetAmountStr(e.target.value);
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) setNewGoal({ ...newGoal, targetAmount: val });
                }} className="rounded-2xl border border-gray-200 focus:border-primary mt-1.5 h-11 text-base" />
              </div>
            )}

            {newGoal.type === 'ladder' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-base font-medium text-gray-900">Початкова сума <span className="text-red-500">*</span></Label>
                    <Input type="number" min="1" value={startAmountStr} onChange={(e) => {
                      setStartAmountStr(e.target.value);
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) setNewGoal({ ...newGoal, startAmount: val });
                    }} className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base" />
                  </div>
                  <div>
                    <Label className="text-base font-medium text-gray-900">Цільова сума <span className="text-red-500">*</span></Label>
                    <Input type="number" min="1" value={targetLadderAmountStr} onChange={(e) => {
                      setTargetLadderAmountStr(e.target.value);
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) setNewGoal({ ...newGoal, targetLadderAmount: val });
                    }} className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-base font-medium text-gray-900">Мін. коефіцієнт <span className="text-red-500">*</span></Label>
                    <Input type="number" min="1.01" step="0.01" value={minOddsStr} onChange={(e) => {
                      setMinOddsStr(e.target.value);
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) setNewGoal({ ...newGoal, minOdds: val });
                    }} className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base" />
                  </div>
                  <div>
                    <Label className="text-base font-medium text-gray-900">Макс. коефіцієнт <span className="text-red-500">*</span></Label>
                    <Input type="number" min="1.01" step="0.01" value={maxOddsStr} onChange={(e) => {
                      setMaxOddsStr(e.target.value);
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) setNewGoal({ ...newGoal, maxOdds: val });
                    }} className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base" />
                  </div>
                </div>
                <div>
                  <Label className="text-base font-medium text-gray-900">Режим при програші <span className="text-red-500">*</span></Label>
                  <Select value={newGoal.ladderMode} onValueChange={(v: LadderMode) => setNewGoal({ ...newGoal, ladderMode: v })}>
                    <SelectTrigger className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soft">М'який — продовжити з поточної</SelectItem>
                      <SelectItem value="strict">Жорсткий — почати заново</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isLadderPreviewValid() && (
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                    <p className="text-base font-medium text-gray-900">Кроків: {calculateLadderSteps(safeParseFloat(startAmountStr), safeParseFloat(targetLadderAmountStr), safeParseFloat(minOddsStr), safeParseFloat(maxOddsStr)).length}</p>
                    <p className="text-sm text-gray-400 mt-0.5">💡 Коефіцієнт {minOddsStr} – {maxOddsStr}</p>
                  </div>
                )}
              </>
            )}

            {newGoal.type === 'roi' && (
              <div>
                <Label className="text-base font-medium text-gray-900">Цільовий ROI (%) <span className="text-red-500">*</span></Label>
                <Input type="number" min="0" max="1000" value={targetROIStr} onChange={(e) => {
                  setTargetROIStr(e.target.value);
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) setNewGoal({ ...newGoal, targetROI: val });
                }} className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base" />
              </div>
            )}

            {newGoal.type === 'winrate' && (
              <div>
                <Label className="text-base font-medium text-gray-900">Цільовий Win Rate (%) <span className="text-red-500">*</span></Label>
                <Input type="number" min="0" max="100" value={targetWinRateStr} onChange={(e) => {
                  setTargetWinRateStr(e.target.value);
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) setNewGoal({ ...newGoal, targetWinRate: val });
                }} className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base" />
              </div>
            )}

            <div className="pt-3 border-t border-gray-200">
              <h4 className="text-base font-medium text-gray-900 mb-2">Правила цілі</h4>
              <div>
                <Label className="text-base font-medium text-gray-900">Ставок на день (0 = без обмежень)</Label>
                <Input type="number" min="0" value={betsPerDayStr} onChange={(e) => {
                  setBetsPerDayStr(e.target.value);
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) setNewGoal({ ...newGoal, betsPerDay: val });
                }} className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200" />

          <DialogFooter className="gap-2 pt-3 pb-4 px-6">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="rounded-3xl border border-gray-200 hover:bg-gray-50 font-medium h-11 px-5 text-base">Скасувати</Button>
            <Button onClick={createGoal} className="rounded-3xl bg-primary hover:bg-blue-400 text-white font-medium h-11 px-5 text-base shadow-[0_4px_16px_rgba(68,122,252,0.3)]">
              <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Створити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteGoalDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        goalName={goals.find(g => g.id === goalToDelete)?.name || ''}
        onDelete={deleteGoal}
      />

      {/* Details Dialog — ladder */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="rounded-3xl max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 p-0 gap-0"
          style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.15), 0 12px 24px rgba(0,0,0,0.1)' }}>
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-2xl flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedGoal?.name}</h1>
                <p className="text-base text-gray-500">Детальна інформація про прогрес</p>
              </div>
            </div>
          </div>

          {selectedGoal && (
            <div className="space-y-5 px-6 pb-6 pt-5 bg-gray-100">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-6">
                <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200"
                  style={cardBaseStyle}
                  onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
                  onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
                >
                  <p className="text-sm text-gray-500 uppercase tracking-wider mb-1.5">Тип</p>
                  <Badge className="bg-gray-100 text-gray-700 border-0 rounded-xl px-3 py-1 font-semibold text-lg">{getGoalTypeLabel(selectedGoal.type)}</Badge>
                </div>
                <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200"
                  style={cardBaseStyle}
                  onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
                  onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
                >
                  <p className="text-sm text-gray-500 uppercase tracking-wider mb-1.5">Створено</p>
                  <p className="text-lg font-semibold text-gray-900">{new Date(selectedGoal.createdAt).toLocaleDateString('uk-UA')}</p>
                </div>
                <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200"
                  style={cardBaseStyle}
                  onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
                  onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
                >
                  <p className="text-sm text-gray-500 uppercase tracking-wider mb-1.5">Прогрес</p>
                  <p className="text-lg font-semibold text-gray-900">{getGoalProgress(selectedGoal).toFixed(1)}%</p>
                </div>
              </div>

              {selectedGoal.type === 'ladder' && selectedGoal.steps && selectedGoal.steps.length > 0 && (
                <div className="space-y-4">
                  {/* Ladder Overview */}
                  <Collapsible open={isLadderOverviewExpanded} onOpenChange={setIsLadderOverviewExpanded}>
                    <Card className="border border-gray-200 rounded-3xl bg-white"
                      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                      <CollapsibleTrigger className="w-full">
                        <div className="px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-xl"><TrendingUp className="h-5 w-5 text-primary" strokeWidth={1.5} /></div>
                            <h3 className="text-lg font-semibold text-gray-900">Огляд лесенки</h3>
                          </div>
                          {isLadderOverviewExpanded ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-6 pb-5 grid grid-cols-2 gap-4">
                          <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200">
                            <p className="text-sm text-gray-500 mb-1">Початкова сума</p>
                            <p className="text-2xl font-bold text-gray-900">{selectedGoal.startAmount?.toFixed(0)} грн</p>
                          </div>
                          <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200">
                            <p className="text-sm text-gray-500 mb-1">Цільова сума</p>
                            <p className="text-2xl font-bold text-gray-900">{selectedGoal.targetLadderAmount?.toFixed(0)} грн</p>
                          </div>
                          <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200">
                            <p className="text-sm text-gray-500 mb-1">Коефіцієнти</p>
                            <p className="text-xl font-bold text-gray-900">{selectedGoal.minOdds} – {selectedGoal.maxOdds}</p>
                          </div>
                          <div className="p-5 bg-green-50 rounded-3xl border border-green-200">
                            <p className="text-sm text-gray-500 mb-1">Поточний банк</p>
                            <p className="text-2xl font-bold text-green-500">{selectedGoal.currentBank?.toFixed(0)} грн</p>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  {/* Scenarios */}
                  <Collapsible open={isStepsCalculationExpanded} onOpenChange={setIsStepsCalculationExpanded}>
                    <Card className="border border-gray-200 rounded-3xl bg-white"
                      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                      <CollapsibleTrigger className="w-full">
                        <div className="px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-xl"><Info className="h-5 w-5 text-primary" strokeWidth={1.5} /></div>
                            <div className="text-left">
                              <p className="text-lg font-semibold text-gray-900">Сценарії кроків</p>
                              <p className="text-sm text-gray-500">При різних коефіцієнтах</p>
                            </div>
                          </div>
                          {isStepsCalculationExpanded ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-6 pb-5 space-y-3">
                          {calculateOddsScenarios(selectedGoal.startAmount || 100, selectedGoal.targetLadderAmount || 100000, selectedGoal.minOdds || 1.3, selectedGoal.maxOdds || 5).map((sc, i) => (
                            <div key={i} className="p-4 bg-gray-50 rounded-3xl border border-gray-200">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{sc.emoji}</span>
                                  <div>
                                    <p className="text-base font-semibold text-gray-900">{sc.speed}</p>
                                    <p className="text-sm text-gray-500">{sc.description}</p>
                                  </div>
                                </div>
                                <Badge className="bg-gray-100 text-gray-900 border-0 rounded-xl px-3 py-1 font-semibold text-lg">{sc.steps} кроків</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-base text-gray-500 mt-1">
                                <span>Коефіцієнт:</span>
                                <span className="font-semibold text-gray-900">{sc.odds}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  {/* Steps */}
                  <Collapsible open={isStepsProgressionExpanded} onOpenChange={setIsStepsProgressionExpanded}>
                    <Card className="border border-gray-200 rounded-3xl bg-white"
                      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                      <CollapsibleTrigger className="w-full">
                        <div className="px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-xl"><BarChart3 className="h-5 w-5 text-primary" strokeWidth={1.5} /></div>
                            <h3 className="text-lg font-semibold text-gray-900">Кроки прогресії</h3>
                          </div>
                          {isStepsProgressionExpanded ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-6 pb-5">
                          <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
                            {selectedGoal.steps.map((step, index) => (
                              <div key={index}
                                className={`relative p-5 rounded-3xl border transition-all ${
                                  step.status === 'completed' ? 'bg-green-50 border-green-200' :
                                  step.status === 'current' ? 'bg-amber-50 border-amber-200 shadow-sm' :
                                  'bg-gray-50 border-gray-200'
                                }`}>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base ${
                                      step.status === 'completed' ? 'bg-green-500 text-white' :
                                      step.status === 'current' ? 'bg-amber-500 text-white' :
                                      'bg-gray-200 text-gray-500'
                                    }`}>{step.step}</div>
                                    <div>
                                      <p className="font-semibold text-gray-900 text-lg">Крок {step.step}</p>
                                      <p className="text-sm text-gray-500">{step.status === 'completed' ? 'Завершено' : step.status === 'current' ? 'Поточний' : 'Заблоковано'}</p>
                                    </div>
                                  </div>
                                  <Badge className={`${
                                    step.status === 'completed' ? 'bg-green-50 text-green-600 border border-green-200' :
                                    step.status === 'current' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                    'bg-gray-100 text-gray-500 border border-gray-200'
                                  } rounded-xl px-3 py-1 font-medium text-sm`}>
                                    {step.status === 'completed' ? '✓ Виконано' : step.status === 'current' ? '→ Активний' : '🔒 Очікує'}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-3 bg-white rounded-2xl border border-gray-200">
                                    <p className="text-sm text-gray-500">Ставка</p>
                                    <p className="text-lg font-bold text-gray-900">{step.startAmount.toFixed(0)} грн</p>
                                  </div>
                                  <div className="p-3 bg-white rounded-2xl border border-gray-200">
                                    <p className="text-sm text-gray-500">Діапазон</p>
                                    <p className="text-base font-semibold text-gray-900">{step.minPlannedAmount?.toFixed(0)} – {step.maxPlannedAmount?.toFixed(0)} грн</p>
                                  </div>
                                  {step.actualAmount && (
                                    <>
                                      <div className="p-3 bg-green-50 rounded-2xl border border-green-200">
                                        <p className="text-sm text-gray-500">Факт</p>
                                        <p className="text-lg font-bold text-green-500">{step.actualAmount.toFixed(0)} грн</p>
                                      </div>
                                      <div className="p-3 bg-green-50 rounded-2xl border border-green-200">
                                        <p className="text-sm text-gray-500">Коеф.</p>
                                        <p className="text-lg font-bold text-green-500">{step.actualOdds?.toFixed(2)}</p>
                                      </div>
                                    </>
                                  )}
                                </div>
                                {step.deviation !== undefined && step.deviation > 0 && (
                                  <div className="mt-3 p-2.5 bg-green-50 rounded-2xl border border-green-200 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-green-500" strokeWidth={1.5} />
                                    <p className="text-sm font-medium text-green-600">+{step.deviation.toFixed(0)} грн більше мінімуму</p>
                                  </div>
                                )}
                                {step.completedAt && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-sm text-gray-500">Завершено: {new Date(step.completedAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                  </div>
                                )}
                                {step.status === 'completed' && index < selectedGoal.steps.length - 1 && (
                                  <div className="absolute -bottom-3.5 left-1/2 transform -translate-x-1/2 z-10">
                                    <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                                      <ArrowRight className="h-3.5 w-3.5 text-white rotate-90" strokeWidth={2} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-4 px-6 pb-6 border-t border-gray-200">
            <Button onClick={() => setShowDetailsDialog(false)} className="rounded-3xl bg-primary hover:bg-blue-400 text-white font-medium h-11 px-6 text-base shadow-[0_4px_16px_rgba(68,122,252,0.3)]">Закрити</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completed Goal Result Modal */}
      <CompletedGoalResultModal
        goal={selectedGoal}
        isOpen={showCompletedResultModal}
        onClose={() => { setShowCompletedResultModal(false); setSelectedGoal(null); }}
      />
    </div>
  );
}