import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Clock
} from 'lucide-react';
import { UserDataService } from '@/lib/userDataService';

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
  if (!goal) return null;

  const currentUser = localStorage.getItem('currentUser') || '';
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
      <DialogContent className="rounded-3xl max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <span>Ціль досягнута!</span>
              <p className="text-sm font-normal text-gray-600 mt-1">{goal.name}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg rounded-2xl bg-gray-50 overflow-hidden">
              <CardContent className="p-4 text-center">
                <div className="p-3 bg-blue-100 rounded-xl w-fit mx-auto mb-2">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{totalBets}</p>
                <p className="text-xs text-gray-600 mt-1">Всього ставок</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-2xl bg-gray-50 overflow-hidden">
              <CardContent className="p-4 text-center">
                <div className="p-3 bg-green-100 rounded-xl w-fit mx-auto mb-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">{winRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-600 mt-1">Win Rate</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-2xl bg-gray-50 overflow-hidden">
              <CardContent className="p-4 text-center">
                <div className="p-3 bg-purple-100 rounded-xl w-fit mx-auto mb-2">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-600">{avgOdds.toFixed(2)}</p>
                <p className="text-xs text-gray-600 mt-1">Серед. коеф.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-2xl bg-gray-50 overflow-hidden">
              <CardContent className="p-4 text-center">
                <div className="p-3 bg-orange-100 rounded-xl w-fit mx-auto mb-2">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-orange-600">{durationDays}</p>
                <p className="text-xs text-gray-600 mt-1">Днів</p>
              </CardContent>
            </Card>
          </div>

          {/* Goal-Specific Results */}
          {goal.type === 'amount' && (
            <Card className="border-0 shadow-xl rounded-3xl bg-gray-50 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-600 rounded-xl">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Результат за сумою</h3>
                    <p className="text-sm text-gray-600">Ціль досягнута</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-2xl">
                    <p className="text-sm text-gray-600 mb-1">Заробили</p>
                    <p className="text-3xl font-bold text-green-600">+{(goal.currentAmount || 0).toFixed(0)} грн</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl">
                    <p className="text-sm text-gray-600 mb-1">Ціль була</p>
                    <p className="text-3xl font-bold text-gray-900">{(goal.targetAmount || 0).toFixed(0)} грн</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {goal.type === 'ladder' && (
            <Card className="border-0 shadow-xl rounded-3xl bg-gray-50 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-600 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Результат лесенки</h3>
                    <p className="text-sm text-gray-600">Ціль досягнута за {goal.currentStep} кроків</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-2xl text-center">
                    <p className="text-sm text-gray-600 mb-1">Початок</p>
                    <p className="text-2xl font-bold text-gray-900">{goal.startAmount} грн</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl text-center">
                    <p className="text-sm text-gray-600 mb-1">Результат</p>
                    <p className="text-2xl font-bold text-purple-600">{(goal.currentBank || 0).toFixed(0)} грн</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl text-center">
                    <p className="text-sm text-gray-600 mb-1">Множник</p>
                    <p className="text-2xl font-bold text-green-600">×{((goal.currentBank || 0) / (goal.startAmount || 1)).toFixed(1)}</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-white rounded-2xl">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Діапазон коефіцієнтів:</span>
                    <span className="font-bold text-gray-900">{goal.minOdds} - {goal.maxOdds}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {goal.type === 'roi' && (
            <Card className="border-0 shadow-xl rounded-3xl bg-gray-50 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-600 rounded-xl">
                    <Percent className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Результат ROI</h3>
                    <p className="text-sm text-gray-600">Ціль досягнута</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-2xl">
                    <p className="text-sm text-gray-600 mb-1">Досягнутий ROI</p>
                    <p className="text-3xl font-bold text-green-600">{(goal.currentROI || 0).toFixed(1)}%</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl">
                    <p className="text-sm text-gray-600 mb-1">Цільовий ROI</p>
                    <p className="text-3xl font-bold text-gray-900">{(goal.targetROI || 0).toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {goal.type === 'winrate' && (
            <Card className="border-0 shadow-xl rounded-3xl bg-gray-50 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-orange-600 rounded-xl">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Результат Win Rate</h3>
                    <p className="text-sm text-gray-600">Ціль досягнута</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-2xl">
                    <p className="text-sm text-gray-600 mb-1">Досягнутий Win Rate</p>
                    <p className="text-3xl font-bold text-orange-600">{(goal.currentWinRate || 0).toFixed(1)}%</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl">
                    <p className="text-sm text-gray-600 mb-1">Цільовий Win Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{(goal.targetWinRate || 0).toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial Summary */}
          <Card className="border-0 shadow-xl rounded-3xl bg-gray-50 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gray-700 rounded-xl">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Фінансовий підсумок</h3>
                  <p className="text-sm text-gray-600">Загальна статистика</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-2xl">
                  <p className="text-sm text-gray-600 mb-1">Загальний прибуток</p>
                  <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(0)} грн
                  </p>
                </div>
                <div className="p-4 bg-white rounded-2xl">
                  <p className="text-sm text-gray-600 mb-1">ROI</p>
                  <p className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 bg-white rounded-2xl">
                  <p className="text-sm text-gray-600 mb-1">Виграшів</p>
                  <p className="text-2xl font-bold text-green-600">{winBets}</p>
                </div>
                <div className="p-4 bg-white rounded-2xl">
                  <p className="text-sm text-gray-600 mb-1">Програшів</p>
                  <p className="text-2xl font-bold text-red-600">{lossBets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border-0 shadow-lg rounded-3xl bg-gray-50 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="h-5 w-5 text-gray-600" />
                <h3 className="text-base font-bold text-gray-900">Часова лінія</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                  <span className="text-sm text-gray-600">Початок цілі</span>
                  <Badge className="bg-blue-100 text-blue-700 border-0 rounded-full">
                    {new Date(goal.createdAt).toLocaleDateString('uk-UA')}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                  <span className="text-sm text-gray-600">Завершення</span>
                  <Badge className="bg-green-100 text-green-700 border-0 rounded-full">
                    {goal.completedAt && new Date(goal.completedAt).toLocaleDateString('uk-UA')}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                  <span className="text-sm text-gray-600">Тривалість</span>
                  <Badge className="bg-purple-100 text-purple-700 border-0 rounded-full">
                    {durationDays} {durationDays === 1 ? 'день' : durationDays < 5 ? 'дні' : 'днів'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Close Button */}
          <Button 
            onClick={onClose} 
            className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6"
          >
            Закрити
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}