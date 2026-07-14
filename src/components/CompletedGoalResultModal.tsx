import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Trophy, 
  TrendingUp, 
  Calendar, 
  Target,
  DollarSign,
  Percent,
  CheckCircle,
  Award,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { UserDataService } from '@/lib/userDataService';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

interface Bet {
  result: string;
  odds: number;
  date: string;
  goalId?: string;
  profit?: number;
  amount?: number;
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

interface Goal {
  id: string;
  name: string;
  type: 'amount' | 'ladder' | 'roi' | 'winrate';
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  targetAmount?: number;
  currentAmount?: number;
  startAmount?: number;
  targetLadderAmount?: number;
  minOdds?: number;
  maxOdds?: number;
  currentStep?: number;
  totalSteps?: number;
  currentBank?: number;
  steps?: LadderStep[];
  targetROI?: number;
  currentROI?: number;
  targetWinRate?: number;
  currentWinRate?: number;
}

interface CompletedGoalResultModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CompletedGoalResultModal({ goal, isOpen, onClose }: CompletedGoalResultModalProps) {
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const { user } = useAuth();
  const currentUser = user?.username || '';

  if (!goal) return null;

  const betsData = UserDataService.getUserData(currentUser, 'mybets_data', []);
  const goalBets = betsData.filter((bet: Bet) => bet.goalId === goal.id);

  // Primary stats from tagged bets
  let totalBets = goalBets.length;
  let winBets = goalBets.filter((bet: Bet) => bet.result === 'Win').length;
  let lossBets = goalBets.filter((bet: Bet) => bet.result === 'Loss').length;

  let totalStaked = goalBets.reduce((sum: number, bet: Bet) => sum + (bet.amount || 100), 0);
  let totalProfit = goalBets.reduce((sum: number, bet: Bet) => {
    if (bet.result === 'Win') return sum + (bet.profit || ((bet.odds - 1) * (bet.amount || 100)));
    if (bet.result === 'Loss') return sum - (bet.amount || 100);
    return sum;
  }, 0);

  let avgOdds = winBets > 0
    ? goalBets.filter((bet: Bet) => bet.result === 'Win').reduce((sum: number, bet: Bet) => sum + bet.odds, 0) / winBets
    : 0;

  // Fallback for ladder goals: derive stats from completed steps when no tagged bets exist
  if (goal.type === 'ladder' && totalBets === 0 && goal.steps && goal.steps.length > 0) {
    const completedSteps = goal.steps.filter(s => s.status === 'completed');
    if (completedSteps.length > 0) {
      winBets = completedSteps.length;
      totalBets = completedSteps.length;
      lossBets = 0;
      totalStaked = completedSteps.reduce((sum, s) => sum + (s.startAmount || 0), 0);
      totalProfit = completedSteps.reduce((sum, s) => {
        const stake = s.startAmount || 0;
        const win = s.actualAmount ?? (stake * (s.actualOdds || 0));
        return sum + (win - stake);
      }, 0);
      const oddsSum = completedSteps.reduce((sum, s) => sum + (s.actualOdds || 0), 0);
      avgOdds = oddsSum / completedSteps.length;
    }
  }

  // Fallback for amount goals: use goal.currentAmount as the achieved profit if no bets
  if (goal.type === 'amount' && totalBets === 0 && (goal.currentAmount || 0) > 0) {
    totalProfit = goal.currentAmount || 0;
  }

  const winRate = totalBets > 0 ? (winBets / totalBets) * 100 : 0;
  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;

  const startDate = new Date(goal.createdAt);
  const endDate = goal.completedAt ? new Date(goal.completedAt) : new Date();
  const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const getGoalTypeLabel = (type: string): string => {
    switch (type) { case 'amount': return 'Сума'; case 'ladder': return 'Лесенка'; case 'roi': return 'ROI'; case 'winrate': return 'Win Rate'; default: return type; }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 p-0">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-2xl border border-green-200 flex-shrink-0">
              <Trophy className="h-7 w-7 text-green-500" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🎉 Ціль досягнута!</h1>
              <p className="text-base text-gray-500 mt-0.5">{goal.name}</p>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 pb-6 pt-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200">
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-1.5">Тип цілі</p>
              <Badge className="bg-gray-100 text-gray-700 border-0 rounded-xl px-3 py-1 font-semibold text-lg">
                {getGoalTypeLabel(goal.type)}
              </Badge>
            </div>
            <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200">
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-1.5">Створено</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(goal.createdAt).toLocaleDateString('uk-UA')}
              </p>
            </div>
            <div className="p-5 bg-green-50 rounded-3xl border border-green-200">
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-1.5">Статус</p>
              <Badge className="bg-green-500 text-white border-0 rounded-xl px-3 py-1 font-semibold text-base">
                <CheckCircle className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
                Завершено
              </Badge>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200 text-center">
              <div className="p-2.5 bg-blue-100 rounded-2xl w-fit mx-auto mb-2">
                <Target className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalBets}</p>
              <p className="text-sm text-gray-500 mt-1">Всього ставок</p>
            </div>

            <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200 text-center">
              <div className="p-2.5 bg-[#D1FAE5] rounded-2xl w-fit mx-auto mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" strokeWidth={1.5} />
              </div>
              <p className="text-2xl font-bold text-green-500">{winRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500 mt-1">Win Rate</p>
            </div>

            <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200 text-center">
              <div className="p-2.5 bg-violet-100 rounded-2xl w-fit mx-auto mb-2">
                <Zap className="h-5 w-5 text-[#8B5CF6]" strokeWidth={1.5} />
              </div>
              <p className="text-2xl font-bold text-[#8B5CF6]">{avgOdds.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">Серед. коеф.</p>
            </div>

            <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200 text-center">
              <div className="p-2.5 bg-yellow-100 rounded-2xl w-fit mx-auto mb-2">
                <Clock className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
              </div>
              <p className="text-2xl font-bold text-amber-500">{durationDays}</p>
              <p className="text-sm text-gray-500 mt-1">Днів</p>
            </div>
          </div>

          {/* Goal-Specific Results */}
          {goal.type === 'amount' && (
            <Card className="border border-gray-200 rounded-3xl bg-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-2xl">
                    <DollarSign className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
                  </div>
                  Результат за сумою
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-green-50 rounded-3xl border border-green-200">
                    <p className="text-sm text-gray-500 mb-1">Заробили</p>
                    <p className="text-2xl font-bold text-green-500">+{(goal.currentAmount || 0).toFixed(0)} грн</p>
                  </div>
                  <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">Ціль була</p>
                    <p className="text-2xl font-bold text-gray-900">{(goal.targetAmount || 0).toFixed(0)} грн</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {goal.type === 'ladder' && (
            <Card className="border border-gray-200 rounded-3xl bg-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                  <div className="p-2 bg-violet-100 rounded-2xl">
                    <TrendingUp className="h-5 w-5 text-[#8B5CF6]" strokeWidth={1.5} />
                  </div>
                  Результат лесенки
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200 text-center">
                    <p className="text-sm text-gray-500 mb-1">Початок</p>
                    <p className="text-xl font-bold text-gray-900">{goal.startAmount} грн</p>
                  </div>
                  <div className="p-5 bg-green-50 rounded-3xl border border-green-200 text-center">
                    <p className="text-sm text-gray-500 mb-1">Результат</p>
                    <p className="text-xl font-bold text-green-500">{(goal.currentBank || 0).toFixed(0)} грн</p>
                  </div>
                  <div className="p-5 bg-violet-100 rounded-3xl border border-[#C4B5FD] text-center">
                    <p className="text-sm text-gray-500 mb-1">Множник</p>
                    <p className="text-xl font-bold text-[#8B5CF6]">×{((goal.currentBank || 0) / (goal.startAmount || 1)).toFixed(1)}</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Діапазон коефіцієнтів:</span>
                    <span className="text-base font-semibold text-gray-900">{goal.minOdds} – {goal.maxOdds}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {goal.type === 'roi' && (
            <Card className="border border-gray-200 rounded-3xl bg-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                  <div className="p-2 bg-[#D1FAE5] rounded-2xl">
                    <Percent className="h-5 w-5 text-green-500" strokeWidth={1.5} />
                  </div>
                  Результат ROI
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-green-50 rounded-3xl border border-green-200">
                    <p className="text-sm text-gray-500 mb-1">Досягнутий ROI</p>
                    <p className="text-2xl font-bold text-green-500">{(goal.currentROI || 0).toFixed(1)}%</p>
                  </div>
                  <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">Цільовий ROI</p>
                    <p className="text-2xl font-bold text-gray-900">{(goal.targetROI || 0).toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {goal.type === 'winrate' && (
            <Card className="border border-gray-200 rounded-3xl bg-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-2xl">
                    <Target className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
                  </div>
                  Результат Win Rate
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-amber-50 rounded-3xl border border-amber-200">
                    <p className="text-sm text-gray-500 mb-1">Досягнутий Win Rate</p>
                    <p className="text-2xl font-bold text-amber-500">{(goal.currentWinRate || 0).toFixed(1)}%</p>
                  </div>
                  <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">Цільовий Win Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{(goal.targetWinRate || 0).toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial Summary */}
          <Card className="border border-gray-200 rounded-3xl bg-white shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-2xl">
                  <Award className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
                </div>
                Фінансовий підсумок
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Загальний прибуток</p>
                  <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(0)} грн
                  </p>
                </div>
                <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">ROI</p>
                  <p className={`text-2xl font-bold ${roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                  </p>
                </div>
                <div className="p-5 bg-green-50 rounded-3xl border border-green-200">
                  <p className="text-sm text-gray-500 mb-1">Виграшів</p>
                  <p className="text-2xl font-bold text-green-500">{winBets}</p>
                </div>
                <div className="p-5 bg-red-50 rounded-3xl border border-red-200">
                  <p className="text-sm text-gray-500 mb-1">Програшів</p>
                  <p className="text-2xl font-bold text-red-500">{lossBets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Collapsible open={isTimelineExpanded} onOpenChange={setIsTimelineExpanded}>
            <Card className="border border-gray-200 rounded-3xl bg-white shadow-sm overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-2xl">
                        <Calendar className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Часова лінія</h3>
                    </div>
                    {isTimelineExpanded ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                  </div>
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-5 pb-5 pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
                      <span className="text-base text-gray-500">Початок цілі</span>
                      <Badge className="bg-blue-100 text-blue-500 border-0 rounded-xl px-3 py-1 font-semibold text-base">
                        {new Date(goal.createdAt).toLocaleDateString('uk-UA')}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
                      <span className="text-base text-gray-500">Завершення</span>
                      <Badge className="bg-[#D1FAE5] text-green-500 border-0 rounded-xl px-3 py-1 font-semibold text-base">
                        {goal.completedAt && new Date(goal.completedAt).toLocaleDateString('uk-UA')}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
                      <span className="text-base text-gray-500">Тривалість</span>
                      <Badge className="bg-violet-100 text-[#8B5CF6] border-0 rounded-xl px-3 py-1 font-semibold text-base">
                        {durationDays} {durationDays === 1 ? 'день' : durationDays < 5 ? 'дні' : 'днів'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Close Button */}
          <div className="pt-4 border-t border-gray-200">
            <Button onClick={onClose} className="w-full rounded-3xl bg-gray-900 hover:bg-gray-800 text-white font-medium h-12 px-6 text-base">
              Закрити
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}