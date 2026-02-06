import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

  // Calculate statistics
  const totalBets = goalBets.length;
  const winBets = goalBets.filter((bet: Bet) => bet.result === 'Win').length;
  const lossBets = goalBets.filter((bet: Bet) => bet.result === 'Loss').length;
  const winRate = totalBets > 0 ? (winBets / totalBets) * 100 : 0;

  const totalStaked = goalBets.reduce((sum: number, bet: Bet) => sum + (bet.amount || 100), 0);
  const totalProfit = goalBets.reduce((sum: number, bet: Bet) => {
    if (bet.result === 'Win') {
      return sum + (bet.profit || ((bet.odds - 1) * (bet.amount || 100)));
    } else if (bet.result === 'Loss') {
      return sum - (bet.amount || 100);
    }
    return sum;
  }, 0);

  const avgOdds = winBets > 0 
    ? goalBets.filter((bet: Bet) => bet.result === 'Win').reduce((sum: number, bet: Bet) => sum + bet.odds, 0) / winBets 
    : 0;

  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;

  // Calculate duration
  const startDate = new Date(goal.createdAt);
  const endDate = goal.completedAt ? new Date(goal.completedAt) : new Date();
  const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const getGoalTypeLabel = (type: string): string => {
    switch (type) {
      case 'amount': return 'Сума';
      case 'ladder': return 'Лесенка';
      case 'roi': return 'ROI';
      case 'winrate': return 'Win Rate';
      default: return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-[32px] max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-[#E8E6DC] p-0">
        {/* Header matching Analytics page style with proper padding */}
        <div className="bg-white/60 backdrop-blur-sm rounded-t-[32px] p-6 m-6 mb-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_4px_12px_rgba(244,225,87,0.4)] flex-shrink-0">
              <Trophy className="h-6 w-6 text-black" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-4xl font-light text-black tracking-tight">
                Ціль досягнута!
              </h1>
              <p className="text-[#6B6B6B] mt-2 text-base font-light">
                {goal.name}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 pb-6">
          {/* Summary Card - matching goal details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-[#F5F5F3] to-white rounded-[20px] border-2 border-[#E8E6DC]">
              <p className="text-xs text-[#6B6B6B] font-light uppercase tracking-wider mb-1">Тип цілі</p>
              <Badge className="bg-[#E8E6DC] text-[#3D3D3D] border-0 rounded-[12px] px-3 py-1 font-normal">
                {getGoalTypeLabel(goal.type)}
              </Badge>
            </div>
            <div className="p-4 bg-gradient-to-br from-[#F5F5F3] to-white rounded-[20px] border-2 border-[#E8E6DC]">
              <p className="text-xs text-[#6B6B6B] font-light uppercase tracking-wider mb-1">Створено</p>
              <p className="text-base font-normal text-black">
                {new Date(goal.createdAt).toLocaleDateString('uk-UA')}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-[#F5F5F3] to-white rounded-[20px] border-2 border-[#E8E6DC]">
              <p className="text-xs text-[#6B6B6B] font-light uppercase tracking-wider mb-1">Статус</p>
              <Badge className="bg-[#4CAF50] text-white border-0 rounded-[12px] px-3 py-1 font-normal">
                <CheckCircle className="h-3 w-3 mr-1" strokeWidth={1.5} />
                Завершено
              </Badge>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-[#F5F5F3] to-white rounded-[20px] border-2 border-[#E8E6DC] text-center">
              <div className="p-2 bg-[#BBDEFB] rounded-[16px] w-fit mx-auto mb-2">
                <Target className="h-5 w-5 text-[#2196F3]" strokeWidth={1.5} />
              </div>
              <p className="text-xl font-normal text-black">{totalBets}</p>
              <p className="text-xs text-[#6B6B6B] mt-1 font-light">Всього ставок</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-[#F5F5F3] to-white rounded-[20px] border-2 border-[#E8E6DC] text-center">
              <div className="p-2 bg-[#C8E6C9] rounded-[16px] w-fit mx-auto mb-2">
                <CheckCircle className="h-5 w-5 text-[#4CAF50]" strokeWidth={1.5} />
              </div>
              <p className="text-xl font-normal text-[#4CAF50]">{winRate.toFixed(1)}%</p>
              <p className="text-xs text-[#6B6B6B] mt-1 font-light">Win Rate</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-[#F5F5F3] to-white rounded-[20px] border-2 border-[#E8E6DC] text-center">
              <div className="p-2 bg-[#E1BEE7] rounded-[16px] w-fit mx-auto mb-2">
                <Zap className="h-5 w-5 text-[#9C27B0]" strokeWidth={1.5} />
              </div>
              <p className="text-xl font-normal text-[#9C27B0]">{avgOdds.toFixed(2)}</p>
              <p className="text-xs text-[#6B6B6B] mt-1 font-light">Серед. коеф.</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-[#F5F5F3] to-white rounded-[20px] border-2 border-[#E8E6DC] text-center">
              <div className="p-2 bg-[#FFCC80] rounded-[16px] w-fit mx-auto mb-2">
                <Clock className="h-5 w-5 text-[#FF9800]" strokeWidth={1.5} />
              </div>
              <p className="text-xl font-normal text-[#FF9800]">{durationDays}</p>
              <p className="text-xs text-[#6B6B6B] mt-1 font-light">Днів</p>
            </div>
          </div>

          {/* Goal-Specific Results */}
          {goal.type === 'amount' && (
            <div className="p-5 bg-gradient-to-br from-[#F5F5F3] to-white rounded-[24px] border-2 border-[#E8E6DC]">
              <h3 className="text-lg font-normal text-black mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-black" strokeWidth={1.5} />
                Результат за сумою
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-[16px] border border-[#E8E6DC]">
                  <p className="text-xs text-[#6B6B6B] font-light mb-1">Заробили</p>
                  <p className="text-2xl font-normal text-[#4CAF50]">+{(goal.currentAmount || 0).toFixed(0)} грн</p>
                </div>
                <div className="p-3 bg-white rounded-[16px] border border-[#E8E6DC]">
                  <p className="text-xs text-[#6B6B6B] font-light mb-1">Ціль була</p>
                  <p className="text-2xl font-normal text-black">{(goal.targetAmount || 0).toFixed(0)} грн</p>
                </div>
              </div>
            </div>
          )}

          {goal.type === 'ladder' && (
            <div className="p-5 bg-gradient-to-br from-[#F5F5F3] to-white rounded-[24px] border-2 border-[#E8E6DC]">
              <h3 className="text-lg font-normal text-black mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-black" strokeWidth={1.5} />
                Результат лесенки
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-white rounded-[16px] border border-[#E8E6DC] text-center">
                  <p className="text-xs text-[#6B6B6B] font-light mb-1">Початок</p>
                  <p className="text-xl font-normal text-black">{goal.startAmount} грн</p>
                </div>
                <div className="p-3 bg-white rounded-[16px] border border-[#E8E6DC] text-center">
                  <p className="text-xs text-[#6B6B6B] font-light mb-1">Результат</p>
                  <p className="text-xl font-normal text-[#9C27B0]">{(goal.currentBank || 0).toFixed(0)} грн</p>
                </div>
                <div className="p-3 bg-white rounded-[16px] border border-[#E8E6DC] text-center">
                  <p className="text-xs text-[#6B6B6B] font-light mb-1">Множник</p>
                  <p className="text-xl font-normal text-[#4CAF50]">×{((goal.currentBank || 0) / (goal.startAmount || 1)).toFixed(1)}</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white rounded-[16px] border border-[#E8E6DC]">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#6B6B6B] font-light">Діапазон коефіцієнтів:</span>
                  <span className="text-base font-normal text-black">{goal.minOdds} - {goal.maxOdds}</span>
                </div>
              </div>
            </div>
          )}

          {goal.type === 'roi' && (
            <div className="p-5 bg-gradient-to-br from-[#F5F5F3] to-white rounded-[24px] border-2 border-[#E8E6DC]">
              <h3 className="text-lg font-normal text-black mb-4 flex items-center gap-2">
                <Percent className="h-5 w-5 text-black" strokeWidth={1.5} />
                Результат ROI
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-[16px] border border-[#E8E6DC]">
                  <p className="text-xs text-[#6B6B6B] font-light mb-1">Досягнутий ROI</p>
                  <p className="text-2xl font-normal text-[#4CAF50]">{(goal.currentROI || 0).toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-white rounded-[16px] border border-[#E8E6DC]">
                  <p className="text-xs text-[#6B6B6B] font-light mb-1">Цільовий ROI</p>
                  <p className="text-2xl font-normal text-black">{(goal.targetROI || 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}

          {goal.type === 'winrate' && (
            <div className="p-5 bg-gradient-to-br from-[#F5F5F3] to-white rounded-[24px] border-2 border-[#E8E6DC]">
              <h3 className="text-lg font-normal text-black mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-black" strokeWidth={1.5} />
                Результат Win Rate
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-[16px] border border-[#E8E6DC]">
                  <p className="text-xs text-[#6B6B6B] font-light mb-1">Досягнутий Win Rate</p>
                  <p className="text-2xl font-normal text-[#FF9800]">{(goal.currentWinRate || 0).toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-white rounded-[16px] border border-[#E8E6DC]">
                  <p className="text-xs text-[#6B6B6B] font-light mb-1">Цільовий Win Rate</p>
                  <p className="text-2xl font-normal text-black">{(goal.targetWinRate || 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div className="p-5 bg-gradient-to-br from-[#F5F5F3] to-white rounded-[24px] border-2 border-[#E8E6DC]">
            <h3 className="text-lg font-normal text-black mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-black" strokeWidth={1.5} />
              Фінансовий підсумок
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-[16px] border border-[#E8E6DC]">
                <p className="text-xs text-[#6B6B6B] font-light mb-1">Загальний прибуток</p>
                <p className={`text-xl font-normal ${totalProfit >= 0 ? 'text-[#4CAF50]' : 'text-[#D32F2F]'}`}>
                  {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(0)} грн
                </p>
              </div>
              <div className="p-3 bg-white rounded-[16px] border border-[#E8E6DC]">
                <p className="text-xs text-[#6B6B6B] font-light mb-1">ROI</p>
                <p className={`text-xl font-normal ${roi >= 0 ? 'text-[#4CAF50]' : 'text-[#D32F2F]'}`}>
                  {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-white rounded-[16px] border border-[#E8E6DC]">
                <p className="text-xs text-[#6B6B6B] font-light mb-1">Виграшів</p>
                <p className="text-xl font-normal text-[#4CAF50]">{winBets}</p>
              </div>
              <div className="p-3 bg-white rounded-[16px] border border-[#E8E6DC]">
                <p className="text-xs text-[#6B6B6B] font-light mb-1">Програшів</p>
                <p className="text-xl font-normal text-[#D32F2F]">{lossBets}</p>
              </div>
            </div>
          </div>

          {/* Timeline - Collapsible */}
          <Collapsible open={isTimelineExpanded} onOpenChange={setIsTimelineExpanded}>
            <Card className="border-2 border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-[24px] bg-white overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-black" strokeWidth={1.5} />
                      <h3 className="text-base font-normal text-black">Часова лінія</h3>
                    </div>
                    {isTimelineExpanded ? (
                      <ChevronUp className="h-5 w-5 text-black" strokeWidth={1.5} />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-black" strokeWidth={1.5} />
                    )}
                  </div>
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-5 pb-5 pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-[#F5F5F3] rounded-[16px]">
                      <span className="text-sm text-[#6B6B6B] font-light">Початок цілі</span>
                      <Badge className="bg-[#BBDEFB] text-[#2196F3] border-0 rounded-[12px] px-3 py-1 font-normal">
                        {new Date(goal.createdAt).toLocaleDateString('uk-UA')}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#F5F5F3] rounded-[16px]">
                      <span className="text-sm text-[#6B6B6B] font-light">Завершення</span>
                      <Badge className="bg-[#C8E6C9] text-[#4CAF50] border-0 rounded-[12px] px-3 py-1 font-normal">
                        {goal.completedAt && new Date(goal.completedAt).toLocaleDateString('uk-UA')}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#F5F5F3] rounded-[16px]">
                      <span className="text-sm text-[#6B6B6B] font-light">Тривалість</span>
                      <Badge className="bg-[#E1BEE7] text-[#9C27B0] border-0 rounded-[12px] px-3 py-1 font-normal">
                        {durationDays} {durationDays === 1 ? 'день' : durationDays < 5 ? 'дні' : 'днів'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Close Button */}
          <div className="pt-4 border-t-2 border-[#E8E6DC]">
            <Button 
              onClick={onClose} 
              className="w-full rounded-[20px] bg-[#F4E157] hover:bg-[#E8D54A] text-black font-normal h-12 px-6 shadow-[0_4px_16px_rgba(244,225,87,0.3)] hover:shadow-[0_6px_20px_rgba(244,225,87,0.4)]"
            >
              Закрити
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}