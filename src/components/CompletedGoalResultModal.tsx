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
import { useState } from 'react';

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

  if (!goal) return null;

  const currentUser = localStorage.getItem('username') || '';
  const betsData = UserDataService.getUserData(currentUser, 'mybets_data', []);
  const goalBets = betsData.filter((bet: Bet) => bet.goalId === goal.id);

  const totalBets = goalBets.length;
  const winBets = goalBets.filter((bet: Bet) => bet.result === 'Win').length;
  const lossBets = goalBets.filter((bet: Bet) => bet.result === 'Loss').length;
  const winRate = totalBets > 0 ? (winBets / totalBets) * 100 : 0;

  const totalStaked = goalBets.reduce((sum: number, bet: Bet) => sum + (bet.amount || 100), 0);
  const totalProfit = goalBets.reduce((sum: number, bet: Bet) => {
    if (bet.result === 'Win') return sum + (bet.profit || ((bet.odds - 1) * (bet.amount || 100)));
    if (bet.result === 'Loss') return sum - (bet.amount || 100);
    return sum;
  }, 0);

  const avgOdds = winBets > 0 
    ? goalBets.filter((bet: Bet) => bet.result === 'Win').reduce((sum: number, bet: Bet) => sum + bet.odds, 0) / winBets 
    : 0;

  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;

  const startDate = new Date(goal.createdAt);
  const endDate = goal.completedAt ? new Date(goal.completedAt) : new Date();
  const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const getGoalTypeLabel = (type: string): string => {
    switch (type) { case 'amount': return 'Сума'; case 'ladder': return 'Лесенка'; case 'roi': return 'ROI'; case 'winrate': return 'Win Rate'; default: return type; }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl max-w-4xl max-h-[90vh] overflow-y-auto border border-[#E5E7EB] p-0">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#F0FDF4] rounded-2xl border border-[#BBF7D0] flex-shrink-0">
              <Trophy className="h-7 w-7 text-[#22C55E]" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#111827]">🎉 Ціль досягнута!</h1>
              <p className="text-base text-[#6B7280] mt-0.5">{goal.name}</p>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 pb-6 pt-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-5 bg-[#F9FAFB] rounded-3xl border border-[#E5E7EB]">
              <p className="text-sm text-[#6B7280] uppercase tracking-wider mb-1.5">Тип цілі</p>
              <Badge className="bg-[#F3F4F6] text-[#374151] border-0 rounded-xl px-3 py-1 font-semibold text-lg">
                {getGoalTypeLabel(goal.type)}
              </Badge>
            </div>
            <div className="p-5 bg-[#F9FAFB] rounded-3xl border border-[#E5E7EB]">
              <p className="text-sm text-[#6B7280] uppercase tracking-wider mb-1.5">Створено</p>
              <p className="text-lg font-semibold text-[#111827]">
                {new Date(goal.createdAt).toLocaleDateString('uk-UA')}
              </p>
            </div>
            <div className="p-5 bg-[#F0FDF4] rounded-3xl border border-[#BBF7D0]">
              <p className="text-sm text-[#6B7280] uppercase tracking-wider mb-1.5">Статус</p>
              <Badge className="bg-[#22C55E] text-white border-0 rounded-xl px-3 py-1 font-semibold text-base">
                <CheckCircle className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
                Завершено
              </Badge>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-[#F9FAFB] rounded-3xl border border-[#E5E7EB] text-center">
              <div className="p-2.5 bg-[#DBEAFE] rounded-2xl w-fit mx-auto mb-2">
                <Target className="h-5 w-5 text-[#3B82F6]" strokeWidth={1.5} />
              </div>
              <p className="text-2xl font-bold text-[#111827]">{totalBets}</p>
              <p className="text-sm text-[#6B7280] mt-1">Всього ставок</p>
            </div>

            <div className="p-5 bg-[#F9FAFB] rounded-3xl border border-[#E5E7EB] text-center">
              <div className="p-2.5 bg-[#D1FAE5] rounded-2xl w-fit mx-auto mb-2">
                <CheckCircle className="h-5 w-5 text-[#22C55E]" strokeWidth={1.5} />
              </div>
              <p className="text-2xl font-bold text-[#22C55E]">{winRate.toFixed(1)}%</p>
              <p className="text-sm text-[#6B7280] mt-1">Win Rate</p>
            </div>

            <div className="p-5 bg-[#F9FAFB] rounded-3xl border border-[#E5E7EB] text-center">
              <div className="p-2.5 bg-[#EDE9FE] rounded-2xl w-fit mx-auto mb-2">
                <Zap className="h-5 w-5 text-[#8B5CF6]" strokeWidth={1.5} />
              </div>
              <p className="text-2xl font-bold text-[#8B5CF6]">{avgOdds.toFixed(2)}</p>
              <p className="text-sm text-[#6B7280] mt-1">Серед. коеф.</p>
            </div>

            <div className="p-5 bg-[#F9FAFB] rounded-3xl border border-[#E5E7EB] text-center">
              <div className="p-2.5 bg-[#FEF3C7] rounded-2xl w-fit mx-auto mb-2">
                <Clock className="h-5 w-5 text-[#F59E0B]" strokeWidth={1.5} />
              </div>
              <p className="text-2xl font-bold text-[#F59E0B]">{durationDays}</p>
              <p className="text-sm text-[#6B7280] mt-1">Днів</p>
            </div>
          </div>

          {/* Goal-Specific Results */}
          {goal.type === 'amount' && (
            <Card className="border border-[#E5E7EB] rounded-3xl bg-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-4 flex items-center gap-3">
                  <div className="p-2 bg-[#DBEAFE] rounded-2xl">
                    <DollarSign className="h-5 w-5 text-[#3B82F6]" strokeWidth={1.5} />
                  </div>
                  Результат за сумою
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-[#F0FDF4] rounded-3xl border border-[#BBF7D0]">
                    <p className="text-sm text-[#6B7280] mb-1">Заробили</p>
                    <p className="text-2xl font-bold text-[#22C55E]">+{(goal.currentAmount || 0).toFixed(0)} грн</p>
                  </div>
                  <div className="p-5 bg-[#F9FAFB] rounded-3xl border border-[#E5E7EB]">
                    <p className="text-sm text-[#6B7280] mb-1">Ціль була</p>
                    <p className="text-2xl font-bold text-[#111827]">{(goal.targetAmount || 0).toFixed(0)} грн</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {goal.type === 'ladder' && (
            <Card className="border border-[#E5E7EB] rounded-3xl bg-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-4 flex items-center gap-3">
                  <div className="p-2 bg-[#EDE9FE] rounded-2xl">
                    <TrendingUp className="h-5 w-5 text-[#8B5CF6]" strokeWidth={1.5} />
                  </div>
                  Результат лесенки
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-5 bg-[#F9FAFB] rounded-3xl border border-[#E5E7EB] text-center">
                    <p className="text-sm text-[#6B7280] mb-1">Початок</p>
                    <p className="text-xl font-bold text-[#111827]">{goal.startAmount} грн</p>
                  </div>
                  <div className="p-5 bg-[#F0FDF4] rounded-3xl border border-[#BBF7D0] text-center">
                    <p className="text-sm text-[#6B7280] mb-1">Результат</p>
                    <p className="text-xl font-bold text-[#22C55E]">{(goal.currentBank || 0).toFixed(0)} грн</p>
                  </div>
                  <div className="p-5 bg-[#EDE9FE] rounded-3xl border border-[#C4B5FD] text-center">
                    <p className="text-sm text-[#6B7280] mb-1">Множник</p>
                    <p className="text-xl font-bold text-[#8B5CF6]">×{((goal.currentBank || 0) / (goal.startAmount || 1)).toFixed(1)}</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#6B7280]">Діапазон коефіцієнтів:</span>
                    <span className="text-base font-semibold text-[#111827]">{goal.minOdds} – {goal.maxOdds}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {goal.type === 'roi' && (
            <Card className="border border-[#E5E7EB] rounded-3xl bg-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-4 flex items-center gap-3">
                  <div className="p-2 bg-[#D1FAE5] rounded-2xl">
                    <Percent className="h-5 w-5 text-[#22C55E]" strokeWidth={1.5} />
                  </div>
                  Результат ROI
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-[#F0FDF4] rounded-3xl border border-[#BBF7D0]">
                    <p className="text-sm text-[#6B7280] mb-1">Досягнутий ROI</p>
                    <p className="text-2xl font-bold text-[#22C55E]">{(goal.currentROI || 0).toFixed(1)}%</p>
                  </div>
                  <div className="p-5 bg-[#F9FAFB] rounded-3xl border border-[#E5E7EB]">
                    <p className="text-sm text-[#6B7280] mb-1">Цільовий ROI</p>
                    <p className="text-2xl font-bold text-[#111827]">{(goal.targetROI || 0).toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {goal.type === 'winrate' && (
            <Card className="border border-[#E5E7EB] rounded-3xl bg-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-4 flex items-center gap-3">
                  <div className="p-2 bg-[#FEF3C7] rounded-2xl">
                    <Target className="h-5 w-5 text-[#F59E0B]" strokeWidth={1.5} />
                  </div>
                  Результат Win Rate
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-[#FFFBEB] rounded-3xl border border-[#FDE68A]">
                    <p className="text-sm text-[#6B7280] mb-1">Досягнутий Win Rate</p>
                    <p className="text-2xl font-bold text-[#F59E0B]">{(goal.currentWinRate || 0).toFixed(1)}%</p>
                  </div>
                  <div className="p-5 bg-[#F9FAFB] rounded-3xl border border-[#E5E7EB]">
                    <p className="text-sm text-[#6B7280] mb-1">Цільовий Win Rate</p>
                    <p className="text-2xl font-bold text-[#111827]">{(goal.targetWinRate || 0).toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial Summary */}
          <Card className="border border-[#E5E7EB] rounded-3xl bg-white shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-[#111827] mb-4 flex items-center gap-3">
                <div className="p-2 bg-[#FEF3C7] rounded-2xl">
                  <Award className="h-5 w-5 text-[#F59E0B]" strokeWidth={1.5} />
                </div>
                Фінансовий підсумок
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-[#F9FAFB] rounded-3xl border border-[#E5E7EB]">
                  <p className="text-sm text-[#6B7280] mb-1">Загальний прибуток</p>
                  <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(0)} грн
                  </p>
                </div>
                <div className="p-5 bg-[#F9FAFB] rounded-3xl border border-[#E5E7EB]">
                  <p className="text-sm text-[#6B7280] mb-1">ROI</p>
                  <p className={`text-2xl font-bold ${roi >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                  </p>
                </div>
                <div className="p-5 bg-[#F0FDF4] rounded-3xl border border-[#BBF7D0]">
                  <p className="text-sm text-[#6B7280] mb-1">Виграшів</p>
                  <p className="text-2xl font-bold text-[#22C55E]">{winBets}</p>
                </div>
                <div className="p-5 bg-[#FEF2F2] rounded-3xl border border-[#FECACA]">
                  <p className="text-sm text-[#6B7280] mb-1">Програшів</p>
                  <p className="text-2xl font-bold text-[#EF4444]">{lossBets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Collapsible open={isTimelineExpanded} onOpenChange={setIsTimelineExpanded}>
            <Card className="border border-[#E5E7EB] rounded-3xl bg-white shadow-sm overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#DBEAFE] rounded-2xl">
                        <Calendar className="h-5 w-5 text-[#3B82F6]" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-lg font-semibold text-[#111827]">Часова лінія</h3>
                    </div>
                    {isTimelineExpanded ? <ChevronUp className="h-5 w-5 text-[#6B7280]" /> : <ChevronDown className="h-5 w-5 text-[#6B7280]" />}
                  </div>
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-5 pb-5 pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                      <span className="text-base text-[#6B7280]">Початок цілі</span>
                      <Badge className="bg-[#DBEAFE] text-[#3B82F6] border-0 rounded-xl px-3 py-1 font-semibold text-base">
                        {new Date(goal.createdAt).toLocaleDateString('uk-UA')}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                      <span className="text-base text-[#6B7280]">Завершення</span>
                      <Badge className="bg-[#D1FAE5] text-[#22C55E] border-0 rounded-xl px-3 py-1 font-semibold text-base">
                        {goal.completedAt && new Date(goal.completedAt).toLocaleDateString('uk-UA')}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                      <span className="text-base text-[#6B7280]">Тривалість</span>
                      <Badge className="bg-[#EDE9FE] text-[#8B5CF6] border-0 rounded-xl px-3 py-1 font-semibold text-base">
                        {durationDays} {durationDays === 1 ? 'день' : durationDays < 5 ? 'дні' : 'днів'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Close Button */}
          <div className="pt-4 border-t border-[#E5E7EB]">
            <Button onClick={onClose} className="w-full rounded-3xl bg-[#111827] hover:bg-[#1F2937] text-white font-medium h-12 px-6 text-base">
              Закрити
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}