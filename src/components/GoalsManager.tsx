import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { UserDataService } from '@/lib/userDataService';
import { 
  Target, 
  TrendingUp, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Trophy,
  DollarSign,
  Percent,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertCircle,
  RefreshCw,
  Calculator,
  TrendingDown
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
  
  // ROI goal
  targetROI?: number;
  currentROI?: number;
  
  // Win Rate goal
  targetWinRate?: number;
  currentWinRate?: number;
}

interface LadderStep {
  step: number;
  startAmount: number;
  plannedAmount: number;
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
    
    // Міграція старих цілей: додаємо avgOdds якщо його немає
    return loadedGoals.map((goal: Goal) => {
      if (goal.type === 'ladder' && !goal.avgOdds && goal.minOdds && goal.maxOdds) {
        return {
          ...goal,
          avgOdds: (goal.minOdds + goal.maxOdds) / 2
        };
      }
      return goal;
    });
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [expandedCalculators, setExpandedCalculators] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);

  const [newGoal, setNewGoal] = useState({
    name: '',
    type: 'amount' as GoalType,
    targetAmount: 100000,
    startAmount: 100,
    targetLadderAmount: 100000,
    minOdds: 1.3,
    maxOdds: 1.5,
    ladderMode: 'soft' as LadderMode,
    targetROI: 50,
    targetWinRate: 65
  });

  useEffect(() => {
    if (currentUser) {
      UserDataService.setUserData(currentUser, 'goals', goals);
    }
  }, [goals, currentUser]);

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
            bet.odds <= (goal.maxOdds || 1.5) && 
            bet.result === 'Win'
          );

          let currentStepIndex = goal.currentStep || 0;
          const steps = [...(goal.steps || [])];
          const avgOdds = goal.avgOdds || ((goal.minOdds || 1.3) + (goal.maxOdds || 1.5)) / 2;

          const sortedBets = goalBets.sort((a: Bet, b: Bet) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          sortedBets.forEach((bet: Bet) => {
            if (currentStepIndex >= steps.length) return;
            
            const currentStep = steps[currentStepIndex];
            if (currentStep.status !== 'current') return;

            const expectedBetAmount = currentStep.startAmount;
            const betAmount = bet.amount || 0;
            
            const expectedWinAmount = currentStep.plannedAmount;
            const actualWinAmount = betAmount * bet.odds;
            
            const tolerance = 0.10;
            const betAmountMatches = Math.abs(betAmount - expectedBetAmount) / expectedBetAmount <= tolerance;
            const winAmountMatches = Math.abs(actualWinAmount - expectedWinAmount) / expectedWinAmount <= tolerance;

            if (betAmountMatches && winAmountMatches) {
              steps[currentStepIndex].status = 'completed';
              steps[currentStepIndex].completedAt = bet.date;
              steps[currentStepIndex].actualAmount = actualWinAmount;
              steps[currentStepIndex].actualOdds = bet.odds;
              steps[currentStepIndex].deviation = actualWinAmount - expectedWinAmount;
              
              currentStepIndex++;
              
              if (currentStepIndex < steps.length) {
                steps[currentStepIndex].startAmount = actualWinAmount;
                steps[currentStepIndex].plannedAmount = actualWinAmount * avgOdds;
                steps[currentStepIndex].status = 'current';
              }
            }
          });

          const isCompleted = currentStepIndex >= steps.length;

          return {
            ...goal,
            avgOdds,
            currentStep: currentStepIndex,
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

  const calculateLadderSteps = (start: number, target: number, avgOdds: number): LadderStep[] => {
    const steps: LadderStep[] = [];
    let currentAmount = start;
    let stepNumber = 1;

    while (currentAmount < target) {
      const nextAmount = currentAmount * avgOdds;
      steps.push({
        step: stepNumber,
        startAmount: currentAmount,
        plannedAmount: nextAmount,
        status: stepNumber === 1 ? 'current' : 'locked'
      });
      currentAmount = nextAmount;
      stepNumber++;
    }

    return steps;
  };

  const calculateOddsScenarios = (start: number, target: number, minOdds: number, maxOdds: number): OddsScenario[] => {
    const scenarios: OddsScenario[] = [];
    const oddsRange = [minOdds, minOdds + 0.05, (minOdds + maxOdds) / 2, maxOdds - 0.05, maxOdds];
    
    oddsRange.forEach(odds => {
      const steps = calculateLadderSteps(start, target, odds);
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

  const createGoal = () => {
    if (!newGoal.name) {
      toast.error('Введіть назву цілі');
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
      createdAt: new Date().toISOString()
    };

    switch (newGoal.type) {
      case 'amount': {
        goal.targetAmount = newGoal.targetAmount;
        goal.currentAmount = 0;
        break;
      }

      case 'ladder': {
        const avgOdds = (newGoal.minOdds + newGoal.maxOdds) / 2;
        const steps = calculateLadderSteps(
          newGoal.startAmount,
          newGoal.targetLadderAmount,
          avgOdds
        );
        goal.startAmount = newGoal.startAmount;
        goal.targetLadderAmount = newGoal.targetLadderAmount;
        goal.minOdds = newGoal.minOdds;
        goal.maxOdds = newGoal.maxOdds;
        goal.avgOdds = avgOdds;
        goal.currentStep = 0;
        goal.totalSteps = steps.length;
        goal.ladderMode = newGoal.ladderMode;
        goal.steps = steps;
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

    setGoals([...goals, goal]);
    setShowCreateDialog(false);
    setNewGoal({
      name: '',
      type: 'amount',
      targetAmount: 100000,
      startAmount: 100,
      targetLadderAmount: 100000,
      minOdds: 1.3,
      maxOdds: 1.5,
      ladderMode: 'soft',
      targetROI: 50,
      targetWinRate: 65
    });

    toast.success('Ціль успішно створена!');
  };

  const confirmDeleteGoal = (goalId: string) => {
    setGoalToDelete(goalId);
    setShowDeleteDialog(true);
  };

  const deleteGoal = () => {
    if (!goalToDelete) return;

    setGoals(goals.filter(g => g.id !== goalToDelete));
    setShowDeleteDialog(false);
    setGoalToDelete(null);
    toast.success('Ціль видалена');
  };

  const toggleExpanded = (goalId: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  const toggleCalculator = (goalId: string) => {
    const newExpanded = new Set(expandedCalculators);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedCalculators(newExpanded);
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
      case 'amount': return <DollarSign className="h-5 w-5" />;
      case 'ladder': return <TrendingUp className="h-5 w-5" />;
      case 'roi': return <Percent className="h-5 w-5" />;
      case 'winrate': return <Target className="h-5 w-5" />;
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

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Мої цілі
          </h2>
          <p className="text-gray-500 font-medium mt-1">Відстежуйте прогрес досягнення ваших цілей</p>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleManualUpdate}
            disabled={isUpdating}
            variant="outline"
            className="rounded-2xl font-medium"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
            Оновити прогрес
          </Button>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            disabled={activeGoals.length >= 3}
            className="rounded-2xl bg-blue-600 hover:bg-blue-700 font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Створити ціль
          </Button>
        </div>
      </div>

      {activeGoals.length >= 3 && (
        <Card className="border-2 border-orange-200 shadow-lg rounded-3xl bg-orange-50 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-900">Досягнуто ліміт активних цілей</p>
                <p className="text-xs text-orange-700 mt-1">
                  Ви можете мати максимум 3 активні цілі одночасно. Видаліть або завершіть існуючу ціль, щоб створити нову.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-gray-100">
          <TabsTrigger value="active" className="rounded-xl">
            Активні цілі ({activeGoals.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-xl">
            Завершені ({completedGoals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {activeGoals.length === 0 ? (
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-12 text-center">
                <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Немає активних цілей</h3>
                <p className="text-gray-600 mb-4">Створіть свою першу ціль для відстеження прогресу</p>
                <Button 
                  onClick={() => setShowCreateDialog(true)} 
                  className="rounded-xl bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Створити ціль
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {activeGoals.map(goal => {
                const progress = getGoalProgress(goal);
                const isExpanded = expandedGoals.has(goal.id);
                const isCalculatorExpanded = expandedCalculators.has(goal.id);
                const goalAvgOdds = goal.avgOdds || ((goal.minOdds || 1.3) + (goal.maxOdds || 1.5)) / 2;
                const goalMinOdds = goal.minOdds || 1.3;
                const goalMaxOdds = goal.maxOdds || 1.5;

                return (
                  <Card key={goal.id} className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-900">
                        <span className="flex items-center gap-2">
                          <div className="p-2 bg-blue-50 rounded-xl">
                            {getGoalIcon(goal.type)}
                          </div>
                          {goal.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-700 border-0 rounded-full">
                            {getGoalTypeLabel(goal.type)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDeleteGoal(goal.id)}
                            className="text-red-600 hover:text-red-700 h-8 w-8 p-0 rounded-xl"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {goal.type === 'amount' && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-medium">Прогрес:</span>
                            <span className="text-2xl font-bold text-gray-900">
                              {(goal.currentAmount || 0).toFixed(0)} / {(goal.targetAmount || 0).toFixed(0)} грн
                            </span>
                          </div>
                          <Progress value={Math.min(progress, 100)} className="h-4" />
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Залишилось:</span>
                            <span className="text-sm font-medium text-blue-600">
                              {((goal.targetAmount || 0) - (goal.currentAmount || 0)).toFixed(0)} грн
                            </span>
                          </div>
                        </>
                      )}

                      {goal.type === 'ladder' && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-medium">Прогрес:</span>
                            <span className="text-2xl font-bold text-gray-900">
                              {goal.currentStep} / {goal.totalSteps} кроків
                            </span>
                          </div>
                          <Progress value={Math.min(progress, 100)} className="h-4" />
                          
                          <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
                            <div className="text-center">
                              <p className="text-xs text-gray-600 mb-1 font-medium">Початок</p>
                              <p className="text-base font-bold text-gray-900">{goal.startAmount} грн</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-600 mb-1 font-medium">Коефіцієнти</p>
                              <p className="text-base font-bold text-blue-600">{goalMinOdds} - {goalMaxOdds}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-600 mb-1 font-medium">Ціль</p>
                              <p className="text-base font-bold text-green-600">{goal.targetLadderAmount?.toFixed(0)} грн</p>
                            </div>
                          </div>

                          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-xs text-blue-800">
                              💡 За середнім коефіцієнтом <strong>{goalAvgOdds.toFixed(2)}</strong> до цілі ~{goal.totalSteps} кроків. 
                              Фактично: <strong>{goal.currentStep}/{goal.totalSteps}</strong> виконано.
                            </p>
                          </div>

                          {goal.startAmount && goal.targetLadderAmount && goalMinOdds && goalMaxOdds && (
                            <Collapsible open={isCalculatorExpanded} onOpenChange={() => toggleCalculator(goal.id)}>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full rounded-xl justify-between"
                                >
                                  <span className="flex items-center gap-2">
                                    <Calculator className="h-4 w-4" />
                                    Калькулятор швидкості
                                  </span>
                                  {isCalculatorExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-3">
                                <Card className="border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl overflow-hidden">
                                  <CardContent className="p-4 space-y-3">
                                    <p className="text-xs text-purple-700">
                                      Оберіть коефіцієнти в діапазоні {goalMinOdds} - {goalMaxOdds} для оптимального балансу між швидкістю та ризиком
                                    </p>
                                    
                                    {calculateOddsScenarios(
                                      goal.startAmount,
                                      goal.targetLadderAmount,
                                      goalMinOdds,
                                      goalMaxOdds
                                    ).map((scenario, index) => {
                                      const avgOdds = (goalMinOdds + goalMaxOdds) / 2;
                                      const isRecommended = Math.abs(scenario.odds - avgOdds) < 0.01;
                                      
                                      return (
                                        <div
                                          key={index}
                                          className={`p-2.5 rounded-xl border transition-all ${
                                            isRecommended
                                              ? 'bg-blue-100 border-blue-300 shadow-sm'
                                              : 'bg-white border-gray-200'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xl">{scenario.emoji}</span>
                                              <div>
                                                <div className="flex items-center gap-1.5">
                                                  <p className="text-sm font-semibold text-gray-900">
                                                    Коеф. {scenario.odds}
                                                  </p>
                                                  {isRecommended && (
                                                    <Badge className="bg-blue-600 text-white text-xs px-1.5 py-0 rounded-full border-0">
                                                      ⭐
                                                    </Badge>
                                                  )}
                                                </div>
                                                <p className="text-xs text-gray-600">{scenario.description}</p>
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-base font-bold text-gray-900">{scenario.steps}</p>
                                              <p className="text-xs text-gray-500">кроків</p>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    
                                    <div className="p-2 bg-blue-50 rounded-xl">
                                      <p className="text-xs text-blue-800">
                                        💡 <strong>Порада:</strong> Використовуйте середні коефіцієнти (1.35-1.45) для оптимального балансу.
                                      </p>
                                    </div>
                                  </CardContent>
                                </Card>
                              </CollapsibleContent>
                            </Collapsible>
                          )}

                          <Button
                            variant="outline"
                            onClick={() => toggleExpanded(goal.id)}
                            className="w-full rounded-xl"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-2" />
                                Приховати кроки
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-2" />
                                Показати всі кроки
                              </>
                            )}
                          </Button>

                          {isExpanded && goal.steps && (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {goal.steps.map((step, index) => (
                                <div
                                  key={index}
                                  className={`p-4 rounded-xl border ${
                                    step.status === 'completed'
                                      ? 'bg-green-50 border-green-200'
                                      : step.status === 'current'
                                      ? 'bg-orange-50 border-orange-200'
                                      : 'bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                      <Badge
                                        className={`rounded-full border-0 ${
                                          step.status === 'completed'
                                            ? 'bg-green-600 text-white'
                                            : step.status === 'current'
                                            ? 'bg-orange-600 text-white'
                                            : 'bg-gray-400 text-white'
                                        }`}
                                      >
                                        {step.status === 'completed' ? '✓' : step.step}
                                      </Badge>
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-900 mb-1">
                                          Крок {step.step}
                                        </p>
                                        
                                        {step.status === 'completed' && step.actualAmount ? (
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-gray-600">План:</span>
                                              <span className="text-sm text-gray-700">
                                                {step.startAmount.toFixed(2)} → {step.plannedAmount.toFixed(2)} грн
                                              </span>
                                              <span className="text-xs text-gray-500">
                                                (коеф. {goalAvgOdds.toFixed(2)})
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-gray-600">Факт:</span>
                                              <span className="text-sm font-medium text-green-700">
                                                {step.startAmount.toFixed(2)} → {step.actualAmount.toFixed(2)} грн
                                              </span>
                                              <span className="text-xs text-green-600">
                                                (коеф. {(step.actualOdds || 0).toFixed(2)})
                                              </span>
                                            </div>
                                            {step.deviation !== undefined && (
                                              <div className="flex items-center gap-2">
                                                {step.deviation >= 0 ? (
                                                  <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full border-0">
                                                    <TrendingUp className="h-3 w-3 mr-1" />
                                                    +{((step.deviation / step.plannedAmount) * 100).toFixed(1)}%
                                                  </Badge>
                                                ) : (
                                                  <Badge className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full border-0">
                                                    <TrendingDown className="h-3 w-3 mr-1" />
                                                    {((step.deviation / step.plannedAmount) * 100).toFixed(1)}%
                                                  </Badge>
                                                )}
                                              </div>
                                            )}
                                            {step.completedAt && (
                                              <p className="text-xs text-gray-500 mt-1">
                                                Завершено: {new Date(step.completedAt).toLocaleDateString('uk-UA')}
                                              </p>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-gray-600">Старт:</span>
                                              <span className="text-sm text-gray-700">
                                                {step.startAmount.toFixed(2)} грн
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-gray-600">План:</span>
                                              <span className="text-sm text-gray-700">
                                                {step.plannedAmount.toFixed(2)} грн
                                              </span>
                                              <span className="text-xs text-gray-500">
                                                (коеф. {goalAvgOdds.toFixed(2)})
                                              </span>
                                            </div>
                                            {step.status === 'current' && (
                                              <p className="text-xs text-orange-600 mt-1">
                                                Очікується ставка...
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {step.status === 'completed' && (
                                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                                    )}
                                    {step.status === 'current' && (
                                      <Zap className="h-5 w-5 text-orange-600 flex-shrink-0" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {goal.type === 'roi' && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-medium">Прогрес:</span>
                            <span className="text-2xl font-bold text-gray-900">
                              {(goal.currentROI || 0).toFixed(1)}% / {(goal.targetROI || 0).toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={Math.min(progress, 100)} className="h-4" />
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Залишилось:</span>
                            <span className="text-sm font-medium text-blue-600">
                              {((goal.targetROI || 0) - (goal.currentROI || 0)).toFixed(1)}%
                            </span>
                          </div>
                        </>
                      )}

                      {goal.type === 'winrate' && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-medium">Прогрес:</span>
                            <span className="text-2xl font-bold text-gray-900">
                              {(goal.currentWinRate || 0).toFixed(1)}% / {(goal.targetWinRate || 0).toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={Math.min(progress, 100)} className="h-4" />
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Залишилось:</span>
                            <span className="text-sm font-medium text-blue-600">
                              {((goal.targetWinRate || 0) - (goal.currentWinRate || 0)).toFixed(1)}%
                            </span>
                          </div>
                        </>
                      )}

                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Створено: {new Date(goal.createdAt).toLocaleDateString('uk-UA')}</span>
                          <span className="font-medium text-blue-600">{progress.toFixed(1)}% виконано</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          {completedGoals.length === 0 ? (
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-12 text-center">
                <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Немає завершених цілей</h3>
                <p className="text-gray-600">Завершені цілі з'являться тут</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {completedGoals.map(goal => (
                <Card key={goal.id} className="border-0 shadow-lg rounded-3xl bg-gradient-to-r from-green-50 to-emerald-50 overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-900">
                      <span className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 rounded-xl">
                          <Trophy className="h-5 w-5 text-green-600" />
                        </div>
                        {goal.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-600 text-white border-0 rounded-full">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Завершено
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDeleteGoal(goal.id)}
                          className="text-red-600 hover:text-red-700 h-8 w-8 p-0 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Тип цілі:</span>
                      <Badge className="bg-blue-100 text-blue-700 border-0 rounded-full">
                        {getGoalTypeLabel(goal.type)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Завершено:</span>
                      <span className="font-medium text-green-600">
                        {goal.completedAt && new Date(goal.completedAt).toLocaleDateString('uk-UA')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="rounded-3xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Plus className="h-5 w-5" />
              Створити нову ціль
            </DialogTitle>
            <DialogDescription>
              Оберіть тип цілі та встановіть параметри
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="goalName">Назва цілі *</Label>
              <Input
                id="goalName"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                placeholder="Наприклад: Досягти 100,000 грн"
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="goalType">Тип цілі *</Label>
              <Select value={newGoal.type} onValueChange={(value: GoalType) => setNewGoal({ ...newGoal, type: value })}>
                <SelectTrigger className="rounded-xl">
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
                <Label htmlFor="targetAmount">Цільова сума (грн) *</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  min="1"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: parseFloat(e.target.value) || 0 })}
                  className="rounded-xl"
                />
              </div>
            )}

            {newGoal.type === 'ladder' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startAmount">Початкова сума (грн) *</Label>
                    <Input
                      id="startAmount"
                      type="number"
                      min="1"
                      value={newGoal.startAmount}
                      onChange={(e) => setNewGoal({ ...newGoal, startAmount: parseFloat(e.target.value) || 0 })}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetLadderAmount">Цільова сума (грн) *</Label>
                    <Input
                      id="targetLadderAmount"
                      type="number"
                      min="1"
                      value={newGoal.targetLadderAmount}
                      onChange={(e) => setNewGoal({ ...newGoal, targetLadderAmount: parseFloat(e.target.value) || 0 })}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minOdds">Мінімальний коефіцієнт *</Label>
                    <Input
                      id="minOdds"
                      type="number"
                      min="1.01"
                      step="0.01"
                      value={newGoal.minOdds}
                      onChange={(e) => setNewGoal({ ...newGoal, minOdds: parseFloat(e.target.value) || 1.3 })}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxOdds">Максимальний коефіцієнт *</Label>
                    <Input
                      id="maxOdds"
                      type="number"
                      min="1.01"
                      step="0.01"
                      value={newGoal.maxOdds}
                      onChange={(e) => setNewGoal({ ...newGoal, maxOdds: parseFloat(e.target.value) || 1.5 })}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="ladderMode">Режим при програші *</Label>
                  <Select value={newGoal.ladderMode} onValueChange={(value: LadderMode) => setNewGoal({ ...newGoal, ladderMode: value })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soft">М'який - продовжити з поточної суми</SelectItem>
                      <SelectItem value="strict">Жорсткий - почати заново</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newGoal.startAmount && newGoal.targetLadderAmount && newGoal.minOdds && newGoal.maxOdds && (
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <p className="text-sm font-medium text-blue-900 mb-1">📊 Розрахунок:</p>
                    <p className="text-sm text-blue-700">
                      Кількість кроків: {calculateLadderSteps(newGoal.startAmount, newGoal.targetLadderAmount, (newGoal.minOdds + newGoal.maxOdds) / 2).length}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Середній коефіцієнт: {((newGoal.minOdds + newGoal.maxOdds) / 2).toFixed(2)} (діапазон {newGoal.minOdds} - {newGoal.maxOdds})
                    </p>
                  </div>
                )}
              </>
            )}

            {newGoal.type === 'roi' && (
              <div>
                <Label htmlFor="targetROI">Цільовий ROI (%) *</Label>
                <Input
                  id="targetROI"
                  type="number"
                  min="0"
                  max="1000"
                  value={newGoal.targetROI}
                  onChange={(e) => setNewGoal({ ...newGoal, targetROI: parseFloat(e.target.value) || 0 })}
                  className="rounded-xl"
                />
              </div>
            )}

            {newGoal.type === 'winrate' && (
              <div>
                <Label htmlFor="targetWinRate">Цільовий Win Rate (%) *</Label>
                <Input
                  id="targetWinRate"
                  type="number"
                  min="0"
                  max="100"
                  value={newGoal.targetWinRate}
                  onChange={(e) => setNewGoal({ ...newGoal, targetWinRate: parseFloat(e.target.value) || 0 })}
                  className="rounded-xl"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="rounded-xl">
              Скасувати
            </Button>
            <Button onClick={createGoal} className="rounded-xl bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Створити ціль
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Видалити ціль?
            </DialogTitle>
            <DialogDescription>
              Ця дія незворотна. Всі дані про прогрес цілі будуть втрачені.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="rounded-xl">
              Скасувати
            </Button>
            <Button onClick={deleteGoal} className="rounded-xl bg-red-600 hover:bg-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}