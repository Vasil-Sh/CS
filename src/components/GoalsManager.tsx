import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { UserDataService } from '@/lib/userDataService';
import CompletedGoalResultModal from '@/components/CompletedGoalResultModal';
import { 
  Target, 
  TrendingUp, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Trophy,
  DollarSign,
  Percent,
  AlertCircle,
  RefreshCw,
  Info,
  Eye,
  Star,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Flag
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
  
  // Amount goal
  targetAmount?: number;
  currentAmount?: number;
  
  // Ladder goal
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
  
  // ROI goal
  targetROI?: number;
  currentROI?: number;
  
  // Win Rate goal
  targetWinRate?: number;
  currentWinRate?: number;
  
  // Goal rules
  betsPerDay?: number;
  allowLive?: boolean;
  allowCashout?: boolean;
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

export default function GoalsManager() {
  const currentUser = localStorage.getItem('currentUser') || '';
  const [goals, setGoals] = useState<Goal[]>(() => {
    const loadedGoals = UserDataService.getUserData(currentUser, 'goals', []);
    
    return loadedGoals.map((goal: Goal) => {
      if (goal.type === 'ladder') {
        if (goal.steps && goal.minOdds && goal.maxOdds) {
          const migratedSteps = goal.steps.map(step => {
            if (!step.minPlannedAmount || !step.maxPlannedAmount) {
              return {
                ...step,
                minPlannedAmount: step.startAmount * (goal.minOdds || 1.3),
                maxPlannedAmount: step.startAmount * (goal.maxOdds || 5)
              };
            }
            return step;
          });
          
          return {
            ...goal,
            steps: migratedSteps,
            avgOdds: goal.avgOdds || goal.minOdds
          };
        }
        
        if (!goal.avgOdds && goal.minOdds && goal.maxOdds) {
          return {
            ...goal,
            avgOdds: goal.minOdds
          };
        }
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
  const [isHowToExpanded, setIsHowToExpanded] = useState(false);

  const [newGoal, setNewGoal] = useState({
    name: '',
    type: 'amount' as GoalType,
    targetAmount: 100000,
    startAmount: 100,
    targetLadderAmount: 100000,
    minOdds: 1.3,
    maxOdds: 5,
    ladderMode: 'soft' as LadderMode,
    targetROI: 50,
    targetWinRate: 65,
    betsPerDay: 5,
    allowLive: true,
    allowCashout: false
  });

  useEffect(() => {
    if (currentUser) {
      UserDataService.setUserData(currentUser, 'goals', goals);
      console.log('✅ Goals saved to localStorage:', goals.length, 'goals');
    }
  }, [goals, currentUser]);

  const calculateRemainingSteps = (currentBank: number, targetAmount: number, minOdds: number): number => {
    let steps = 0;
    let amount = currentBank;
    
    while (amount < targetAmount && steps < 100) {
      amount = amount * minOdds;
      steps++;
    }
    
    return steps;
  };

  const updateGoalsProgress = () => {
    const betsData = UserDataService.getUserData(currentUser, 'mybets_data', []);
    
    if (!betsData.length) return;

    const updatedGoals = goals.map(goal => {
      if (goal.status !== 'active') return goal;

      switch (goal.type) {
        case 'amount': {
          const goalBets = betsData.filter((bet: Bet) => bet.goalId === goal.id);
          
          const totalProfit = goalBets.reduce((sum: number, bet: Bet) => {
            if (bet.result === 'Win') {
              const profit = bet.profit || ((bet.odds - 1) * (bet.amount || 100));
              return sum + profit;
            } else if (bet.result === 'Loss') {
              const loss = bet.amount || 100;
              return sum - loss;
            }
            return sum;
          }, 0);
          
          const isCompleted = totalProfit >= (goal.targetAmount || 0);
          
          return {
            ...goal,
            currentAmount: totalProfit,
            status: isCompleted ? 'completed' as GoalStatus : 'active' as GoalStatus,
            completedAt: isCompleted ? new Date().toISOString() : undefined
          };
        }

        case 'ladder': {
          const goalBets = betsData.filter((bet: Bet) => 
            bet.goalId === goal.id &&
            bet.odds >= (goal.minOdds || 1.3) && 
            bet.odds <= (goal.maxOdds || 5) && 
            bet.result === 'Win'
          );

          let currentStepIndex = goal.currentStep || 0;
          const steps = [...(goal.steps || [])];
          const minOdds = goal.minOdds || 1.3;
          const maxOdds = goal.maxOdds || 5;

          const sortedBets = goalBets.sort((a: Bet, b: Bet) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          sortedBets.forEach((bet: Bet) => {
            if (currentStepIndex >= steps.length) return;
            
            const currentStep = steps[currentStepIndex];
            if (currentStep.status !== 'current') return;

            const betAmount = bet.amount || 0;
            const actualWinAmount = betAmount * bet.odds;
            
            const tolerance = 0.20;
            const expectedBetAmount = currentStep.startAmount;
            const betAmountMatches = Math.abs(betAmount - expectedBetAmount) / expectedBetAmount <= tolerance;
            
            if (betAmountMatches && bet.odds >= minOdds && bet.odds <= maxOdds) {
              const minPlanned = currentStep.minPlannedAmount || currentStep.startAmount * minOdds;
              
              steps[currentStepIndex].status = 'completed';
              steps[currentStepIndex].completedAt = bet.date;
              steps[currentStepIndex].actualAmount = actualWinAmount;
              steps[currentStepIndex].actualOdds = bet.odds;
              steps[currentStepIndex].deviation = actualWinAmount - minPlanned;
              
              currentStepIndex++;
              
              if (currentStepIndex < steps.length) {
                steps[currentStepIndex].startAmount = actualWinAmount;
                steps[currentStepIndex].minPlannedAmount = actualWinAmount * minOdds;
                steps[currentStepIndex].maxPlannedAmount = actualWinAmount * maxOdds;
                steps[currentStepIndex].status = 'current';
              }
            }
          });

          const currentBank = currentStepIndex > 0 && steps[currentStepIndex - 1]?.actualAmount 
            ? steps[currentStepIndex - 1].actualAmount 
            : goal.startAmount || 0;

          const remainingSteps = calculateRemainingSteps(
            currentBank,
            goal.targetLadderAmount || 100000,
            minOdds
          );
          const dynamicTotalSteps = currentStepIndex + remainingSteps;

          const isCompleted = currentBank >= (goal.targetLadderAmount || 100000);

          return {
            ...goal,
            avgOdds: minOdds,
            currentStep: currentStepIndex,
            totalSteps: dynamicTotalSteps,
            currentBank,
            steps,
            status: isCompleted ? 'completed' as GoalStatus : 'active' as GoalStatus,
            completedAt: isCompleted ? new Date().toISOString() : undefined
          };
        }

        case 'roi': {
          const goalBets = betsData.filter((bet: Bet) => bet.goalId === goal.id && bet.result !== 'Pending');
          
          if (goalBets.length === 0) return goal;
          
          const totalStake = goalBets.reduce((sum: number, bet: Bet) => sum + (bet.amount || 100), 0);
          const totalProfit = goalBets.reduce((sum: number, bet: Bet) => {
            if (bet.result === 'Win') {
              return sum + (bet.profit || ((bet.odds - 1) * (bet.amount || 100)));
            } else if (bet.result === 'Loss') {
              return sum - (bet.amount || 100);
            }
            return sum;
          }, 0);
          
          const currentROI = (totalProfit / totalStake) * 100;
          
          const isCompleted = currentROI >= (goal.targetROI || 0);
          
          return {
            ...goal,
            currentROI,
            status: isCompleted ? 'completed' as GoalStatus : 'active' as GoalStatus,
            completedAt: isCompleted ? new Date().toISOString() : undefined
          };
        }

        case 'winrate': {
          const goalBets = betsData.filter((bet: Bet) => bet.goalId === goal.id && bet.result !== 'Pending');
          
          if (goalBets.length === 0) return goal;
          
          const wins = goalBets.filter((bet: Bet) => bet.result === 'Win').length;
          const currentWinRate = (wins / goalBets.length) * 100;
          
          const isCompleted = currentWinRate >= (goal.targetWinRate || 0);
          
          return {
            ...goal,
            currentWinRate,
            status: isCompleted ? 'completed' as GoalStatus : 'active' as GoalStatus,
            completedAt: isCompleted ? new Date().toISOString() : undefined
          };
        }

        default:
          return goal;
      }
    });

    setGoals(updatedGoals);
  };

  const handleManualUpdate = () => {
    setIsUpdating(true);
    updateGoalsProgress();
    toast.success('Прогрес цілей оновлено!');
    setTimeout(() => setIsUpdating(false), 500);
  };

  const calculateLadderSteps = (start: number, target: number, minOdds: number, maxOdds: number): LadderStep[] => {
    const steps: LadderStep[] = [];
    let currentAmount = start;
    let stepNumber = 1;

    while (currentAmount < target) {
      const minNextAmount = currentAmount * minOdds;
      const maxNextAmount = currentAmount * maxOdds;
      
      steps.push({
        step: stepNumber,
        startAmount: currentAmount,
        minPlannedAmount: minNextAmount,
        maxPlannedAmount: maxNextAmount,
        status: stepNumber === 1 ? 'current' : 'locked'
      });
      
      currentAmount = minNextAmount;
      stepNumber++;
    }

    return steps;
  };

  const calculateOddsScenarios = (start: number, target: number, minOdds: number, maxOdds: number): OddsScenario[] => {
    const scenarios: OddsScenario[] = [];
    const oddsRange = [minOdds, minOdds + 0.05, (minOdds + maxOdds) / 2, maxOdds - 0.05, maxOdds];
    
    oddsRange.forEach(odds => {
      const steps = calculateLadderSteps(start, target, odds, odds);
      let speed = '';
      let emoji = '';
      let description = '';
      
      if (odds === minOdds) {
        speed = 'Повільно';
        emoji = '🐢';
        description = 'Найбільше кроків, найбезпечніше';
      } else if (odds === maxOdds) {
        speed = 'Швидко';
        emoji = '🚀';
        description = 'Найменше кроків, ризиковано';
      } else if (Math.abs(odds - (minOdds + maxOdds) / 2) < 0.01) {
        speed = 'Оптимально';
        emoji = '⚡';
        description = 'Рекомендований баланс';
      } else if (odds < (minOdds + maxOdds) / 2) {
        speed = 'Помірно';
        emoji = '🐇';
        description = 'Збалансований підхід';
      } else {
        speed = 'Швидше';
        emoji = '🏃';
        description = 'Менше кроків, вищий ризик';
      }
      
      scenarios.push({
        odds: parseFloat(odds.toFixed(2)),
        steps: steps.length,
        speed,
        emoji,
        description
      });
    });
    
    return scenarios;
  };

  const validateGoalFields = (): boolean => {
    if (!newGoal.name.trim()) {
      toast.error('Будь ласка, введіть назву цілі');
      return false;
    }

    switch (newGoal.type) {
      case 'amount':
        if (!newGoal.targetAmount || newGoal.targetAmount <= 0) {
          toast.error('Будь ласка, введіть цільову суму більше 0');
          return false;
        }
        break;

      case 'ladder':
        if (!newGoal.startAmount || newGoal.startAmount <= 0) {
          toast.error('Будь ласка, введіть початкову суму більше 0');
          return false;
        }
        if (!newGoal.targetLadderAmount || newGoal.targetLadderAmount <= 0) {
          toast.error('Будь ласка, введіть цільову суму більше 0');
          return false;
        }
        if (newGoal.startAmount >= newGoal.targetLadderAmount) {
          toast.error('Цільова сума повинна бути більше початкової');
          return false;
        }
        if (!newGoal.minOdds || newGoal.minOdds < 1.01) {
          toast.error('Будь ласка, введіть мінімальний коефіцієнт (мін. 1.01)');
          return false;
        }
        if (!newGoal.maxOdds || newGoal.maxOdds < 1.01) {
          toast.error('Будь ласка, введіть максимальний коефіцієнт (мін. 1.01)');
          return false;
        }
        if (newGoal.minOdds >= newGoal.maxOdds) {
          toast.error('Максимальний коефіцієнт повинен бути більше мінімального');
          return false;
        }
        break;

      case 'roi':
        if (!newGoal.targetROI || newGoal.targetROI <= 0) {
          toast.error('Будь ласка, введіть цільовий ROI більше 0');
          return false;
        }
        break;

      case 'winrate':
        if (!newGoal.targetWinRate || newGoal.targetWinRate <= 0 || newGoal.targetWinRate > 100) {
          toast.error('Будь ласка, введіть цільовий Win Rate від 1 до 100');
          return false;
        }
        break;
    }

    return true;
  };

  const createGoal = () => {
    if (!validateGoalFields()) {
      return;
    }

    const activeGoals = goals.filter(g => g.status === 'active');
    if (activeGoals.length >= 3) {
      toast.error('Максимум 3 активні цілі одночасно');
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      name: newGoal.name,
      type: newGoal.type,
      status: 'active',
      createdAt: new Date().toISOString(),
      isPrimary: activeGoals.length === 0,
      betsPerDay: newGoal.betsPerDay,
      allowLive: newGoal.allowLive,
      allowCashout: newGoal.allowCashout
    };

    switch (newGoal.type) {
      case 'amount': {
        goal.targetAmount = newGoal.targetAmount;
        goal.currentAmount = 0;
        break;
      }

      case 'ladder': {
        const steps = calculateLadderSteps(
          newGoal.startAmount,
          newGoal.targetLadderAmount,
          newGoal.minOdds,
          newGoal.maxOdds
        );
        goal.startAmount = newGoal.startAmount;
        goal.targetLadderAmount = newGoal.targetLadderAmount;
        goal.minOdds = newGoal.minOdds;
        goal.maxOdds = newGoal.maxOdds;
        goal.avgOdds = newGoal.minOdds;
        goal.currentStep = 0;
        goal.totalSteps = steps.length;
        goal.ladderMode = newGoal.ladderMode;
        goal.steps = steps;
        goal.currentBank = newGoal.startAmount;
        break;
      }

      case 'roi': {
        goal.targetROI = newGoal.targetROI;
        goal.currentROI = 0;
        break;
      }

      case 'winrate': {
        goal.targetWinRate = newGoal.targetWinRate;
        goal.currentWinRate = 0;
        break;
      }
    }

    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);
    
    UserDataService.setUserData(currentUser, 'goals', updatedGoals);
    console.log('✅ Goal created and saved:', goal.name, 'Total goals:', updatedGoals.length);
    
    setShowCreateDialog(false);
    setNewGoal({
      name: '',
      type: 'amount',
      targetAmount: 100000,
      startAmount: 100,
      targetLadderAmount: 100000,
      minOdds: 1.3,
      maxOdds: 5,
      ladderMode: 'soft',
      targetROI: 50,
      targetWinRate: 65,
      betsPerDay: 5,
      allowLive: true,
      allowCashout: false
    });

    toast.success('Ціль успішно створена!', {
      description: '💡 Не забудьте прив\'язати ставки до цієї цілі!'
    });
  };

  const confirmDeleteGoal = (goalId: string) => {
    setGoalToDelete(goalId);
    setShowDeleteDialog(true);
  };

  const deleteGoal = () => {
    if (!goalToDelete) return;

    const updatedGoals = goals.filter(g => g.id !== goalToDelete);
    setGoals(updatedGoals);
    
    UserDataService.setUserData(currentUser, 'goals', updatedGoals);
    console.log('✅ Goal deleted, remaining:', updatedGoals.length);
    
    setShowDeleteDialog(false);
    setGoalToDelete(null);
    toast.success('Ціль видалена');
  };

  const setPrimaryGoal = (goalId: string) => {
    setGoals(goals.map(g => ({
      ...g,
      isPrimary: g.id === goalId
    })));
    toast.success('Головна ціль змінена');
  };

  const openDetailsDialog = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowDetailsDialog(true);
  };

  const openCompletedGoalResult = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowCompletedResultModal(true);
  };

  const getGoalProgress = (goal: Goal): number => {
    switch (goal.type) {
      case 'amount':
        return ((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100;
      case 'ladder':
        return ((goal.currentStep || 0) / (goal.totalSteps || 1)) * 100;
      case 'roi':
        return ((goal.currentROI || 0) / (goal.targetROI || 1)) * 100;
      case 'winrate':
        return ((goal.currentWinRate || 0) / (goal.targetWinRate || 1)) * 100;
      default:
        return 0;
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
    switch (type) {
      case 'amount': return 'Сума';
      case 'ladder': return 'Лесенка';
      case 'roi': return 'ROI';
      case 'winrate': return 'Win Rate';
    }
  };

  const getKeyMetric = (goal: Goal): { label: string; value: string; color: string } => {
    switch (goal.type) {
      case 'amount':
        return {
          label: 'Залишилось заробити',
          value: `${((goal.targetAmount || 0) - (goal.currentAmount || 0)).toFixed(0)} грн`,
          color: 'text-[#2196F3]'
        };
      case 'ladder':
        return {
          label: 'Поточний крок',
          value: `${goal.currentStep} / ${goal.totalSteps}`,
          color: 'text-[#8b5cf6]'
        };
      case 'roi':
        return {
          label: 'Поточний ROI',
          value: `${(goal.currentROI || 0).toFixed(1)}%`,
          color: 'text-[#4CAF50]'
        };
      case 'winrate':
        return {
          label: 'Поточний Win Rate',
          value: `${(goal.currentWinRate || 0).toFixed(1)}%`,
          color: 'text-[#FF9800]'
        };
    }
  };

  const getDisciplineStatus = (goal: Goal): { status: 'good' | 'warning'; label: string; icon: JSX.Element } => {
    const betsData = UserDataService.getUserData(currentUser, 'mybets_data', []);
    const goalBets = betsData.filter((bet: Bet) => bet.goalId === goal.id);
    
    if (goalBets.length === 0) {
      return {
        status: 'good',
        label: 'Правила дотримані',
        icon: <CheckCircle className="h-4 w-4" strokeWidth={1.5} />
      };
    }

    const hasViolations = goalBets.some((bet: Bet) => {
      if (goal.type === 'ladder') {
        return bet.odds < (goal.minOdds || 0) || bet.odds > (goal.maxOdds || 999);
      }
      return false;
    });

    if (hasViolations) {
      return {
        status: 'warning',
        label: 'Є відхилення',
        icon: <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />
      };
    }

    return {
      status: 'good',
      label: 'Правила дотримані',
      icon: <CheckCircle className="h-4 w-4" strokeWidth={1.5} />
    };
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const primaryGoal = activeGoals.find(g => g.isPrimary) || activeGoals[0];
  const secondaryGoals = activeGoals.filter(g => !g.isPrimary);

  const tabs = [
    { id: 'active', label: 'Активні цілі', icon: Target },
    { id: 'completed', label: 'Завершені', icon: Trophy },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)] rounded-[32px] bg-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_2px_8px_rgba(244,225,87,0.3)] flex-shrink-0">
                <Flag className="h-6 w-6 text-black" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-3xl font-light text-black tracking-tight">Мої цілі</h2>
                <p className="text-[#6B6B6B] mt-1 text-base font-light">Фокус на дисципліні та прогресі</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleManualUpdate}
                disabled={isUpdating}
                variant="outline"
                className="rounded-[24px] border-2 border-[#D4D2C8] hover:bg-[#FAFAF8] hover:border-[#C4C2B8] bg-white font-normal h-14 px-6 text-black transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${isUpdating ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                Оновити прогрес
              </Button>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                disabled={activeGoals.length >= 3}
                className="rounded-[24px] bg-[#F4E157] hover:bg-[#E8D54A] text-black font-normal h-14 px-6 transition-all duration-300 shadow-[0_4px_16px_rgba(244,225,87,0.3)] hover:shadow-[0_6px_20px_rgba(244,225,87,0.4)]"
              >
                <Plus className="h-5 w-5 mr-2" strokeWidth={1.5} />
                Створити ціль
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Work with Goals - Collapsible */}
      {activeGoals.length > 0 && (
        <Collapsible open={isHowToExpanded} onOpenChange={setIsHowToExpanded}>
          <Card className="border-2 border-[#BBDEFB] shadow-[0_4px_16px_rgba(33,150,243,0.15)] rounded-[28px] bg-white overflow-hidden">
            <CollapsibleTrigger className="w-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-[#2196F3] flex-shrink-0" strokeWidth={1.5} />
                    <p className="text-base font-normal text-black">💡 Як працювати з цілями</p>
                  </div>
                  {isHowToExpanded ? (
                    <ChevronUp className="h-5 w-5 text-[#2196F3]" strokeWidth={1.5} />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[#2196F3]" strokeWidth={1.5} />
                  )}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-6 pb-6 pt-0">
                <div className="pl-8 space-y-3">
                  <p className="text-sm text-[#6B6B6B] font-light leading-relaxed">
                    1. При додаванні запису оберіть ціль в полі "Прив'язати до цілі"
                  </p>
                  <p className="text-sm text-[#6B6B6B] font-light leading-relaxed">
                    2. Після того, як ставка буде розрахована (Win/Loss), поверніться сюди
                  </p>
                  <p className="text-sm text-[#6B6B6B] font-light leading-relaxed">
                    3. Натисніть "Оновити прогрес" - прогрес цілі автоматично оновиться
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {activeGoals.length >= 3 && (
        <Card className="border-2 border-[#FFCC80] shadow-[0_4px_16px_rgba(255,152,0,0.15)] rounded-[28px] bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#FF9800] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-normal text-black">Досягнуто ліміт активних цілей</p>
                <p className="text-xs text-[#6B6B6B] mt-1 font-light">
                  Ви можете мати максимум 3 активні цілі одночасно. Видаліть або завершіть існуючу ціль, щоб створити нову.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Tabs Navigation - matching Analytics page style */}
      <div className="space-y-6">
        <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-3 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-2 gap-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'active' | 'completed')}
                  className={`
                    relative rounded-[24px] px-6 py-4 font-light text-base
                    transition-all duration-300 ease-in-out
                    ${activeTab === tab.id 
                      ? 'bg-[#F4E157] text-black font-normal shadow-[0_4px_16px_rgba(244,225,87,0.4)]' 
                      : 'bg-transparent text-[#6B6B6B] hover:bg-[#F5F5F3]'
                    }
                  `}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'active' && (
            <div className="space-y-6">
              {activeGoals.length === 0 ? (
                <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
                  <CardContent className="py-16 text-center">
                    <div className="p-8 bg-[#F5F5F3] rounded-[32px] inline-block mb-6">
                      <Target className="h-16 w-16 text-[#8B8B8B]" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-light text-black mb-3">
                      Немає активних цілей
                    </h3>
                    <p className="text-[#6B6B6B] font-light mb-6">Створіть свою першу ціль для відстеження прогресу</p>
                    <Button 
                      onClick={() => setShowCreateDialog(true)} 
                      className="rounded-[24px] bg-[#F4E157] hover:bg-[#E8D54A] text-black font-normal h-12 px-6 shadow-[0_4px_16px_rgba(244,225,87,0.3)]"
                    >
                      <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
                      Створити ціль
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {primaryGoal && (
                    <Card className="border-2 border-[#F4E157] shadow-[0_12px_32px_rgba(244,225,87,0.25)] rounded-[32px] bg-gradient-to-br from-[#FFFEF5] via-white to-[#FFF9E6] overflow-hidden">
                      <CardHeader className="pb-4 pt-7 px-7">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_4px_12px_rgba(244,225,87,0.4)]">
                              {getGoalIcon(primaryGoal.type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-2xl font-light text-black">
                                  {primaryGoal.name}
                                </CardTitle>
                                <Badge className="bg-[#F4E157] text-black border-0 rounded-[16px] px-3 py-1 font-normal shadow-[0_2px_8px_rgba(244,225,87,0.3)]">
                                  <Star className="h-3 w-3 mr-1" strokeWidth={1.5} />
                                  Головна
                                </Badge>
                              </div>
                              <Badge className="bg-[#E8E6DC] text-[#3D3D3D] border-0 rounded-[16px] mt-2 px-3 py-1 font-light">
                                {getGoalTypeLabel(primaryGoal.type)}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDeleteGoal(primaryGoal.id)}
                            className="text-[#D32F2F] hover:text-[#B71C1C] hover:bg-[#FFE8E8] h-10 w-10 p-0 rounded-[20px] transition-all"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-5 px-7 pb-7">
                        <div className="p-5 bg-white rounded-[24px] border-2 border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                          <p className="text-sm text-[#6B6B6B] mb-2 font-light uppercase tracking-wider">{getKeyMetric(primaryGoal).label}</p>
                          <p className={`text-4xl font-light ${getKeyMetric(primaryGoal).color} tracking-tight`}>
                            {getKeyMetric(primaryGoal).value}
                          </p>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm text-[#6B6B6B] font-light">Прогрес</span>
                            <span className="text-sm font-normal text-black">
                              {getGoalProgress(primaryGoal).toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={Math.min(getGoalProgress(primaryGoal), 100)} className="h-3 rounded-[12px]" />
                        </div>

                        <div className="p-5 bg-[#F5F5F3] rounded-[24px] border-2 border-[#E8E6DC]">
                          <p className="text-sm font-normal text-black mb-3">📋 Правила цілі</p>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            {primaryGoal.type === 'ladder' && (
                              <>
                                <div>
                                  <span className="text-[#6B6B6B] font-light">Коефіцієнти:</span>
                                  <span className="ml-1 font-normal text-black">
                                    {primaryGoal.minOdds} - {primaryGoal.maxOdds}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[#6B6B6B] font-light">Поточний банк:</span>
                                  <span className="ml-1 font-normal text-black">
                                    {(primaryGoal.currentBank || 0).toFixed(0)} грн
                                  </span>
                                </div>
                              </>
                            )}
                            <div>
                              <span className="text-[#6B6B6B] font-light">Ставок/день:</span>
                              <span className="ml-1 font-normal text-black">{primaryGoal.betsPerDay || 'Не обмежено'}</span>
                            </div>
                            <div>
                              <span className="text-[#6B6B6B] font-light">Live:</span>
                              <span className="ml-1 font-normal text-black">{primaryGoal.allowLive ? 'Дозволено' : 'Заборонено'}</span>
                            </div>
                          </div>
                        </div>

                        <div className={`p-4 rounded-[24px] border-2 ${
                          getDisciplineStatus(primaryGoal).status === 'good' 
                            ? 'bg-[#E8F5E9] border-[#C8E6C9]' 
                            : 'bg-[#FFE8E8] border-[#FFCDD2]'
                        }`}>
                          <div className="flex items-center gap-2">
                            <div className={
                              getDisciplineStatus(primaryGoal).status === 'good' 
                                ? 'text-[#4CAF50]' 
                                : 'text-[#D32F2F]'
                            }>
                              {getDisciplineStatus(primaryGoal).icon}
                            </div>
                            <span className={`text-sm font-normal ${
                              getDisciplineStatus(primaryGoal).status === 'good' 
                                ? 'text-[#2E7D32]' 
                                : 'text-[#B71C1C]'
                            }`}>
                              {getDisciplineStatus(primaryGoal).label}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => openDetailsDialog(primaryGoal)}
                            className="flex-1 rounded-[20px] border-2 border-[#D4D2C8] hover:bg-[#FAFAF8] hover:border-[#C4C2B8] font-light h-12"
                          >
                            <Eye className="h-4 w-4 mr-2" strokeWidth={1.5} />
                            Деталі цілі
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {secondaryGoals.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-normal text-[#6B6B6B] px-1 uppercase tracking-wider">Інші активні цілі</h3>
                      {secondaryGoals.map(goal => {
                        const progress = getGoalProgress(goal);
                        const keyMetric = getKeyMetric(goal);
                        const discipline = getDisciplineStatus(goal);

                        return (
                          <Card key={goal.id} className="border-2 border-[#D4D2C8] shadow-[0_4px_16px_rgba(0,0,0,0.06)] rounded-[28px] bg-white overflow-hidden hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300">
                            <CardContent className="p-5">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="p-2.5 bg-[#F5F5F3] rounded-[20px]">
                                    {getGoalIcon(goal.type)}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-normal text-black text-base">{goal.name}</p>
                                    <Badge className="bg-[#E8E6DC] text-[#3D3D3D] border-0 rounded-[12px] text-xs mt-1 px-2.5 py-0.5 font-light">
                                      {getGoalTypeLabel(goal.type)}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPrimaryGoal(goal.id)}
                                    className="h-9 w-9 p-0 rounded-[16px] hover:bg-[#F5F5F3]"
                                    title="Зробити головною"
                                  >
                                    <Star className="h-4 w-4 text-[#8B8B8B]" strokeWidth={1.5} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => confirmDeleteGoal(goal.id)}
                                    className="text-[#D32F2F] hover:text-[#B71C1C] hover:bg-[#FFE8E8] h-9 w-9 p-0 rounded-[16px]"
                                  >
                                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-[#6B6B6B] font-light">{keyMetric.label}</span>
                                  <span className={`text-sm font-normal ${keyMetric.color}`}>{keyMetric.value}</span>
                                </div>
                                
                                <Progress value={Math.min(progress, 100)} className="h-2 rounded-[8px]" />
                                
                                <div className="flex items-center justify-between">
                                  <div className={`flex items-center gap-1 text-xs ${
                                    discipline.status === 'good' ? 'text-[#4CAF50]' : 'text-[#FF9800]'
                                  }`}>
                                    {discipline.icon}
                                    <span className="font-light">{discipline.label}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDetailsDialog(goal)}
                                    className="h-8 text-xs rounded-[12px] hover:bg-[#F5F5F3] font-light"
                                  >
                                    <Eye className="h-3 w-3 mr-1" strokeWidth={1.5} />
                                    Деталі
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="space-y-6">
              {completedGoals.length === 0 ? (
                <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
                  <CardContent className="py-16 text-center">
                    <div className="p-8 bg-[#F5F5F3] rounded-[32px] inline-block mb-6">
                      <Trophy className="h-16 w-16 text-[#8B8B8B]" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-light text-black mb-3">Немає завершених цілей</h3>
                    <p className="text-[#6B6B6B] font-light">Завершені цілі з'являться тут</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {completedGoals.map(goal => (
                    <Card 
                      key={goal.id} 
                      className="border-2 border-[#C8E6C9] shadow-[0_8px_24px_rgba(76,175,80,0.15)] rounded-[28px] bg-gradient-to-br from-[#E8F5E9] to-white overflow-hidden cursor-pointer hover:shadow-[0_12px_32px_rgba(76,175,80,0.25)] transition-all duration-300"
                      onClick={() => openCompletedGoalResult(goal)}
                    >
                      <CardHeader className="pb-3 pt-6 px-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 bg-[#C8E6C9] rounded-[20px]">
                            <Trophy className="h-5 w-5 text-[#4CAF50]" strokeWidth={1.5} />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteGoal(goal.id);
                            }}
                            className="text-[#D32F2F] hover:text-[#B71C1C] hover:bg-[#FFE8E8] h-8 w-8 p-0 rounded-[16px]"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </Button>
                        </div>
                        <CardTitle className="text-lg font-normal text-black line-clamp-2">
                          {goal.name}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-0 px-6 pb-6">
                        <Badge className="bg-[#4CAF50] text-white border-0 rounded-[16px] text-xs px-3 py-1 font-normal shadow-[0_2px_8px_rgba(76,175,80,0.3)]">
                          <CheckCircle className="h-3 w-3 mr-1" strokeWidth={1.5} />
                          Завершено
                        </Badge>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#6B6B6B] font-light">Тип цілі:</span>
                          <Badge className="bg-[#E8E6DC] text-[#3D3D3D] border-0 rounded-[12px] text-xs px-2.5 py-0.5 font-light">
                            {getGoalTypeLabel(goal.type)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#6B6B6B] font-light">Завершено:</span>
                          <span className="font-normal text-[#4CAF50]">
                            {goal.completedAt && new Date(goal.completedAt).toLocaleDateString('uk-UA')}
                          </span>
                        </div>
                        
                        <div className="mt-3 p-3 bg-[#C8E6C9] rounded-[20px] text-center">
                          <p className="text-xs text-[#2E7D32] font-normal">👆 Клікніть, щоб переглянути детальний результат</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Goal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="rounded-[32px] max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-[#E8E6DC]">
          <DialogHeader className="pb-4 border-b-2 border-[#E8E6DC]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#F4E157] rounded-[20px] shadow-[0_2px_8px_rgba(244,225,87,0.3)]">
                <Plus className="h-5 w-5 text-black" strokeWidth={1.5} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-light text-black">
                  Створити нову ціль
                </DialogTitle>
                <DialogDescription className="text-[#6B6B6B] font-light mt-1">
                  Оберіть тип цілі та встановіть параметри
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="goalName" className="text-sm font-normal text-black">Назва цілі *</Label>
              <Input
                id="goalName"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                placeholder="Наприклад: Досягти 100,000 грн"
                className="rounded-[20px] border-2 border-[#D4D2C8] focus:border-[#F4E157] mt-2 h-12 font-light"
              />
            </div>

            <div>
              <Label htmlFor="goalType" className="text-sm font-normal text-black">Тип цілі *</Label>
              <Select value={newGoal.type} onValueChange={(value: GoalType) => setNewGoal({ ...newGoal, type: value })}>
                <SelectTrigger className="rounded-[20px] border-2 border-[#D4D2C8] mt-2 h-12 font-light">
                  <SelectValue />
                </SelectTrigger>
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
                <Label htmlFor="targetAmount" className="text-sm font-normal text-black">Цільова сума (грн) *</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  min="1"
                  value={newGoal.targetAmount === 0 ? '' : newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  className="rounded-[20px] border-2 border-[#D4D2C8] focus:border-[#F4E157] mt-2 h-12 font-light"
                />
              </div>
            )}

            {newGoal.type === 'ladder' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startAmount" className="text-sm font-normal text-black">Початкова сума (грн) *</Label>
                    <Input
                      id="startAmount"
                      type="number"
                      min="1"
                      value={newGoal.startAmount === 0 ? '' : newGoal.startAmount}
                      onChange={(e) => setNewGoal({ ...newGoal, startAmount: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                      className="rounded-[20px] border-2 border-[#D4D2C8] focus:border-[#F4E157] mt-2 h-12 font-light"
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetLadderAmount" className="text-sm font-normal text-black">Цільова сума (грн) *</Label>
                    <Input
                      id="targetLadderAmount"
                      type="number"
                      min="1"
                      value={newGoal.targetLadderAmount === 0 ? '' : newGoal.targetLadderAmount}
                      onChange={(e) => setNewGoal({ ...newGoal, targetLadderAmount: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                      className="rounded-[20px] border-2 border-[#D4D2C8] focus:border-[#F4E157] mt-2 h-12 font-light"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minOdds" className="text-sm font-normal text-black">Мінімальний коефіцієнт *</Label>
                    <Input
                      id="minOdds"
                      type="number"
                      min="1.01"
                      step="0.01"
                      value={newGoal.minOdds === 0 ? '' : newGoal.minOdds}
                      onChange={(e) => setNewGoal({ ...newGoal, minOdds: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                      className="rounded-[20px] border-2 border-[#D4D2C8] focus:border-[#F4E157] mt-2 h-12 font-light"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxOdds" className="text-sm font-normal text-black">Максимальний коефіцієнт *</Label>
                    <Input
                      id="maxOdds"
                      type="number"
                      min="1.01"
                      step="0.01"
                      value={newGoal.maxOdds === 0 ? '' : newGoal.maxOdds}
                      onChange={(e) => setNewGoal({ ...newGoal, maxOdds: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                      className="rounded-[20px] border-2 border-[#D4D2C8] focus:border-[#F4E157] mt-2 h-12 font-light"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="ladderMode" className="text-sm font-normal text-black">Режим при програші *</Label>
                  <Select value={newGoal.ladderMode} onValueChange={(value: LadderMode) => setNewGoal({ ...newGoal, ladderMode: value })}>
                    <SelectTrigger className="rounded-[20px] border-2 border-[#D4D2C8] mt-2 h-12 font-light">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soft">М'який - продовжити з поточної суми</SelectItem>
                      <SelectItem value="strict">Жорсткий - почати заново</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newGoal.startAmount > 0 && newGoal.targetLadderAmount > 0 && newGoal.minOdds > 0 && newGoal.maxOdds > 0 && (
                  <div className="p-4 bg-[#E3F2FD] rounded-[20px] border-2 border-[#BBDEFB]">
                    <p className="text-sm font-normal text-black mb-1">📊 Розрахунок кроків:</p>
                    <p className="text-sm text-[#6B6B6B] font-light">
                      Кількість кроків: {calculateLadderSteps(newGoal.startAmount, newGoal.targetLadderAmount, newGoal.minOdds, newGoal.maxOdds).length}
                    </p>
                    <p className="text-xs text-[#6B6B6B] mt-1 font-light">
                      💡 Система прийматиме будь-який коефіцієнт в діапазоні {newGoal.minOdds} - {newGoal.maxOdds}
                    </p>
                  </div>
                )}
              </>
            )}

            {newGoal.type === 'roi' && (
              <div>
                <Label htmlFor="targetROI" className="text-sm font-normal text-black">Цільовий ROI (%) *</Label>
                <Input
                  id="targetROI"
                  type="number"
                  min="0"
                  max="1000"
                  value={newGoal.targetROI === 0 ? '' : newGoal.targetROI}
                  onChange={(e) => setNewGoal({ ...newGoal, targetROI: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  className="rounded-[20px] border-2 border-[#D4D2C8] focus:border-[#F4E157] mt-2 h-12 font-light"
                />
              </div>
            )}

            {newGoal.type === 'winrate' && (
              <div>
                <Label htmlFor="targetWinRate" className="text-sm font-normal text-black">Цільовий Win Rate (%) *</Label>
                <Input
                  id="targetWinRate"
                  type="number"
                  min="0"
                  max="100"
                  value={newGoal.targetWinRate === 0 ? '' : newGoal.targetWinRate}
                  onChange={(e) => setNewGoal({ ...newGoal, targetWinRate: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  className="rounded-[20px] border-2 border-[#D4D2C8] focus:border-[#F4E157] mt-2 h-12 font-light"
                />
              </div>
            )}

            {newGoal.type !== 'ladder' && (
              <div className="pt-4 border-t-2 border-[#E8E6DC]">
                <h4 className="text-sm font-normal text-black mb-3">📋 Правила цілі</h4>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="betsPerDay" className="text-sm font-normal text-black">Ставок на день (0 = без обмежень)</Label>
                    <Input
                      id="betsPerDay"
                      type="number"
                      min="0"
                      value={newGoal.betsPerDay === 0 ? '' : newGoal.betsPerDay}
                      onChange={(e) => setNewGoal({ ...newGoal, betsPerDay: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                      className="rounded-[20px] border-2 border-[#D4D2C8] focus:border-[#F4E157] mt-2 h-12 font-light"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#F5F5F3] rounded-[20px] border-2 border-[#E8E6DC]">
                    <Label htmlFor="allowLive" className="cursor-pointer text-sm font-normal text-black">Дозволити live-прогнози</Label>
                    <input
                      id="allowLive"
                      type="checkbox"
                      checked={newGoal.allowLive}
                      onChange={(e) => setNewGoal({ ...newGoal, allowLive: e.target.checked })}
                      className="h-5 w-5 rounded-[8px] border-2 border-[#D4D2C8] text-[#F4E157] focus:ring-[#F4E157]"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#F5F5F3] rounded-[20px] border-2 border-[#E8E6DC]">
                    <Label htmlFor="allowCashout" className="cursor-pointer text-sm font-normal text-black">Дозволити cashout</Label>
                    <input
                      id="allowCashout"
                      type="checkbox"
                      checked={newGoal.allowCashout}
                      onChange={(e) => setNewGoal({ ...newGoal, allowCashout: e.target.checked })}
                      className="h-5 w-5 rounded-[8px] border-2 border-[#D4D2C8] text-[#F4E157] focus:ring-[#F4E157]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-3 pt-4 border-t-2 border-[#E8E6DC]">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)} 
              className="rounded-[20px] border-2 border-[#D4D2C8] hover:bg-[#FAFAF8] font-light h-12 px-6"
            >
              Скасувати
            </Button>
            <Button 
              onClick={createGoal} 
              className="rounded-[20px] bg-[#F4E157] hover:bg-[#E8D54A] text-black font-normal h-12 px-6 shadow-[0_4px_16px_rgba(244,225,87,0.3)]"
            >
              <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Створити ціль
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Goal Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-[32px] border-2 border-[#E8E6DC]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-normal text-[#D32F2F]">
              <AlertCircle className="h-5 w-5" strokeWidth={1.5} />
              Видалити ціль?
            </DialogTitle>
            <DialogDescription className="text-[#6B6B6B] font-light">
              Ця дія незворотна. Всі дані про прогрес цілі будуть втрачені.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)} 
              className="rounded-[20px] border-2 border-[#D4D2C8] hover:bg-[#FAFAF8] font-light h-12 px-6"
            >
              Скасувати
            </Button>
            <Button 
              onClick={deleteGoal} 
              className="rounded-[20px] bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-normal h-12 px-6 shadow-[0_4px_16px_rgba(211,47,47,0.3)]"
            >
              <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goal Details Dialog - Enhanced with ladder steps */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="rounded-[32px] max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-[#E8E6DC]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-light text-black">
              <Eye className="h-5 w-5" strokeWidth={1.5} />
              Деталі цілі: {selectedGoal?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedGoal && (
            <div className="space-y-4">
              <div className="p-5 bg-[#F5F5F3] rounded-[24px] border-2 border-[#E8E6DC] space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[#6B6B6B] font-light">Тип цілі:</span>
                  <Badge className="bg-[#E8E6DC] text-[#3D3D3D] border-0 rounded-[16px] px-3 py-1 font-light">
                    {getGoalTypeLabel(selectedGoal.type)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#6B6B6B] font-light">Створено:</span>
                  <span className="text-sm font-normal text-black">
                    {new Date(selectedGoal.createdAt).toLocaleDateString('uk-UA')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#6B6B6B] font-light">Прогрес:</span>
                  <span className="text-sm font-normal text-black">
                    {getGoalProgress(selectedGoal).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Ladder Steps Details */}
              {selectedGoal.type === 'ladder' && selectedGoal.steps && selectedGoal.steps.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-normal text-black">📊 Кроки лесенки</h3>
                  <div className="p-4 bg-[#E3F2FD] rounded-[20px] border-2 border-[#BBDEFB] space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-[#6B6B6B] font-light">Початкова сума:</span>
                        <span className="ml-2 font-normal text-black">{selectedGoal.startAmount?.toFixed(0)} грн</span>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B] font-light">Цільова сума:</span>
                        <span className="ml-2 font-normal text-black">{selectedGoal.targetLadderAmount?.toFixed(0)} грн</span>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B] font-light">Діапазон коефіцієнтів:</span>
                        <span className="ml-2 font-normal text-black">{selectedGoal.minOdds} - {selectedGoal.maxOdds}</span>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B] font-light">Поточний банк:</span>
                        <span className="ml-2 font-normal text-black">{selectedGoal.currentBank?.toFixed(0)} грн</span>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {selectedGoal.steps.map((step, index) => (
                      <div 
                        key={index}
                        className={`p-4 rounded-[20px] border-2 ${
                          step.status === 'completed' 
                            ? 'bg-[#E8F5E9] border-[#C8E6C9]' 
                            : step.status === 'current'
                            ? 'bg-[#FFF9E6] border-[#F4E157]'
                            : 'bg-[#F5F5F3] border-[#E8E6DC]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-normal text-black">Крок {step.step}</span>
                          <Badge className={`${
                            step.status === 'completed'
                              ? 'bg-[#4CAF50] text-white'
                              : step.status === 'current'
                              ? 'bg-[#F4E157] text-black'
                              : 'bg-[#E8E6DC] text-[#6B6B6B]'
                          } border-0 rounded-[12px] text-xs px-2.5 py-0.5 font-light`}>
                            {step.status === 'completed' ? '✓ Завершено' : step.status === 'current' ? '→ Поточний' : '🔒 Заблоковано'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[#6B6B6B] font-light">Початкова сума:</span>
                            <span className="ml-1 font-normal text-black">{step.startAmount.toFixed(0)} грн</span>
                          </div>
                          <div>
                            <span className="text-[#6B6B6B] font-light">Мін. планова:</span>
                            <span className="ml-1 font-normal text-black">{step.minPlannedAmount?.toFixed(0)} грн</span>
                          </div>
                          {step.actualAmount && (
                            <>
                              <div>
                                <span className="text-[#6B6B6B] font-light">Фактична сума:</span>
                                <span className="ml-1 font-normal text-[#4CAF50]">{step.actualAmount.toFixed(0)} грн</span>
                              </div>
                              <div>
                                <span className="text-[#6B6B6B] font-light">Коефіцієнт:</span>
                                <span className="ml-1 font-normal text-black">{step.actualOdds?.toFixed(2)}</span>
                              </div>
                            </>
                          )}
                          {step.completedAt && (
                            <div className="col-span-2">
                              <span className="text-[#6B6B6B] font-light">Завершено:</span>
                              <span className="ml-1 font-normal text-black">
                                {new Date(step.completedAt).toLocaleDateString('uk-UA')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              onClick={() => setShowDetailsDialog(false)} 
              className="rounded-[20px] bg-[#F4E157] hover:bg-[#E8D54A] text-black font-normal h-12 px-6"
            >
              Закрити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completed Goal Result Modal */}
      <CompletedGoalResultModal
        goal={selectedGoal}
        isOpen={showCompletedResultModal}
        onClose={() => {
          setShowCompletedResultModal(false);
          setSelectedGoal(null);
        }}
      />
    </div>
  );
}