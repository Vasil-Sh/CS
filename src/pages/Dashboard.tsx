import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, BarChart3, Target, Flag, DollarSign, Percent,
  Activity, ShieldAlert, Trophy, Plus, ArrowUpRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { UserDataService } from '@/lib/userDataService';
import { useAuth } from '@/contexts/AuthContext';
import { logRender } from '@/lib/devLogger';
import type { Bet } from '@/types/betting';
import { CARD_BASE_STYLE } from '@/lib/cardStyles';

interface StrategySummary {
  name: string;
  riskLevel: string;
  bets: number;
  roi: number;
}

interface GoalSummary {
  name: string;
  type: string;
  progress: number;
  current: number;
  target: number;
}

export default function Dashboard() {
  logRender('Dashboard');
  const { user } = useAuth();
  const currentUser = user?.username || 'default';

  const [bets, setBets] = useState<Bet[]>([]);
  const [activeStrategy, setActiveStrategy] = useState<StrategySummary | null>(null);
  const [activeGoal, setActiveGoal] = useState<GoalSummary | null>(null);
  const [bankInfo, setBankInfo] = useState<{ current: number; initial: number }>({ current: 0, initial: 0 });

  useEffect(() => {
    const myBets = UserDataService.getUserData<Bet[]>(currentUser, 'mybets_data', []) || [];
    setBets(myBets);

    // Bank info
    const initialBank = Number(UserDataService.getUserData<string>(currentUser, 'initialBank', '0')) || 0;
    const currentBank = Number(UserDataService.getUserData<string>(currentUser, 'currentBank', String(initialBank))) || 0;
    setBankInfo({ current: currentBank, initial: initialBank });

    // Active strategy
    const strategies = UserDataService.getUserData<{ name: string; riskLevel: string }[]>(currentUser, 'strategies_data', []) || [];
    const primaryId = UserDataService.getUserData<string>(currentUser, 'primary_strategy', '') || '';
    const active = strategies.find((s: any) => (s.id || s.name) === primaryId);
    if (active) {
      const related = myBets.filter(
        (b: Bet) => (b.strategy || 'Без стратегії') === active.name && (b.result === 'Win' || b.result === 'Loss'),
      );
      const stake = related.reduce((s: number, b: Bet) => s + (b.amount || 0), 0);
      const profit = related.reduce((s: number, b: Bet) => s + (b.profit || 0), 0);
      setActiveStrategy({
        name: active.name,
        riskLevel: active.riskLevel || 'Low',
        bets: related.length,
        roi: stake > 0 ? (profit / stake) * 100 : 0,
      });
    }

    // Active goal
    const goals = UserDataService.getUserData<any[]>('goals', []) || [];
    const goal = goals.find((g: any) => g.status === 'active' && g.isPrimary);
    if (goal) {
      const pct = goal.type === 'amount'
        ? (goal.targetAmount > 0 ? ((goal.currentAmount || 0) / goal.targetAmount) * 100 : 0)
        : 0;
      setActiveGoal({
        name: goal.name,
        type: goal.type === 'amount' ? 'Сума' : goal.type === 'roi' ? 'ROI' : goal.type === 'ladder' ? 'Лесенка' : 'Win Rate',
        progress: pct,
        current: goal.currentAmount || 0,
        target: goal.targetAmount || 0,
      });
    }
  }, [currentUser]);

  // Quick stats
  const completedBets = bets.filter((b) => b.result === 'Win' || b.result === 'Loss');
  const wins = bets.filter((b) => b.result === 'Win').length;
  const winRate = completedBets.length > 0 ? (wins / completedBets.length) * 100 : 0;
  const totalProfit = completedBets.reduce((s, b) => s + (b.profit || 0), 0);
  const totalStake = completedBets.reduce((s, b) => s + (b.amount || 0), 0);
  const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
  const pendingBets = bets.filter((b) => !b.result || b.result === 'Pending').length;

  // Recent bets (last 5)
  const recentBets = [...bets].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  }).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      <div className="px-6 lg:px-8 pt-6 pb-2">
        <h1 className="text-[48px] font-semibold text-[#111827] leading-tight tracking-tight">
          Дашборд
        </h1>
      </div>

      <div className="px-6 lg:px-8 pb-8 pt-4 space-y-8">
        {/* Key metrics row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/app/analytics" className="group">
            <Card className="p-5 bg-white border border-[#F3F4F6] hover:border-[#447afc] rounded-2xl transition-all h-full" style={CARD_BASE_STYLE}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-[#447afc]" />
                </div>
                <span className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Банк</span>
                <ArrowUpRight className="h-3 w-3 text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
              </div>
              <p className="text-2xl font-bold text-[#111827]">{bankInfo.current.toLocaleString()} ₴</p>
              <p className="text-sm text-[#9CA3AF] mt-1">
                {bankInfo.initial > 0 ? `${bankInfo.current >= bankInfo.initial ? '+' : ''}${bankInfo.current - bankInfo.initial} ₴` : '—'}
              </p>
            </Card>
          </Link>

          <Link to="/app/my-bets" className="group">
            <Card className="p-5 bg-white border border-[#F3F4F6] hover:border-[#447afc] rounded-2xl transition-all h-full" style={CARD_BASE_STYLE}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center">
                  <Activity className="h-4 w-4 text-[#16A34A]" />
                </div>
                <span className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Ставок</span>
                <ArrowUpRight className="h-3 w-3 text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
              </div>
              <p className="text-2xl font-bold text-[#111827]">{bets.length}</p>
              <p className="text-sm text-[#9CA3AF] mt-1">{pendingBets} очікують</p>
            </Card>
          </Link>

          <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl h-full" style={CARD_BASE_STYLE}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                <Percent className="h-4 w-4 text-[#D97706]" />
              </div>
              <span className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Вінрейт</span>
            </div>
            <p className={`text-2xl font-bold ${winRate >= 50 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
              {completedBets.length > 0 ? `${winRate.toFixed(1)}%` : '—'}
            </p>
            <p className="text-sm text-[#9CA3AF] mt-1">{wins}W / {completedBets.length - wins}L</p>
          </Card>

          <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl h-full" style={CARD_BASE_STYLE}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-[#16A34A]" />
              </div>
              <span className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">ROI</span>
            </div>
            <p className={`text-2xl font-bold ${roi >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
              {completedBets.length > 0 ? `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%` : '—'}
            </p>
            <p className="text-sm text-[#9CA3AF] mt-1">{totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(0)} ₴</p>
          </Card>
        </div>

        {/* Strategy + Goal row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Strategy */}
          <Link to="/app/strategy">
            <Card className="p-6 bg-white border border-[#F3F4F6] hover:border-[#447afc] rounded-2xl transition-all" style={CARD_BASE_STYLE}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                    <Target className="h-5 w-5 text-[#447afc]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#111827]">Стратегія</p>
                    <p className="text-sm text-[#9CA3AF]">{activeStrategy ? 'Активна' : 'Не обрана'}</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[#9CA3AF]" />
              </div>
              {activeStrategy ? (
                <div className="space-y-3">
                  <p className="text-xl font-bold text-[#374151]">{activeStrategy.name}</p>
                  <div className="flex items-center gap-3">
                    <Badge className={`text-xs px-2 py-0.5 border-0 rounded-full ${activeStrategy.riskLevel === 'Low' ? 'bg-[#DCFCE7] text-[#6B7280]' : activeStrategy.riskLevel === 'Medium' ? 'bg-[#FEF3C7] text-[#6B7280]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}>
                      {activeStrategy.riskLevel === 'Low' ? 'Низький' : activeStrategy.riskLevel === 'Medium' ? 'Середній' : 'Високий'}
                    </Badge>
                    <span className="text-sm text-[#6B7280]">{activeStrategy.bets} ставок</span>
                    {activeStrategy.bets > 0 && (
                      <span className={`text-sm font-semibold ${activeStrategy.roi >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                        ROI {activeStrategy.roi >= 0 ? '+' : ''}{activeStrategy.roi.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[#9CA3AF]">Оберіть стратегію для відстеження</p>
              )}
            </Card>
          </Link>

          {/* Active Goal */}
          <Link to="/app/strategy">
            <Card className="p-6 bg-white border border-[#F3F4F6] hover:border-[#447afc] rounded-2xl transition-all" style={CARD_BASE_STYLE}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center">
                    <Flag className="h-5 w-5 text-[#16A34A]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#111827]">Ціль</p>
                    <p className="text-sm text-[#9CA3AF]">{activeGoal ? 'Активна' : 'Не обрана'}</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[#9CA3AF]" />
              </div>
              {activeGoal ? (
                <div className="space-y-3">
                  <p className="text-xl font-bold text-[#374151]">{activeGoal.name}</p>
                  <Progress value={Math.max(activeGoal.progress, 2)} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B7280]">
                      {activeGoal.current.toLocaleString()} / {activeGoal.target.toLocaleString()} ₴
                    </span>
                    <span className="text-sm font-semibold text-[#111827]">{activeGoal.progress.toFixed(0)}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-[#9CA3AF]">Створіть ціль для мотивації</p>
              )}
            </Card>
          </Link>
        </div>

        {/* Recent Bets */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#111827]">Останні ставки</h3>
            <Link to="/app/my-bets" className="text-sm font-semibold text-[#447afc] hover:underline flex items-center gap-1">
              Всі ставки <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {recentBets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentBets.map((bet, idx) => (
                <Card key={idx} className="p-4 bg-white border border-[#F3F4F6] rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#9CA3AF] font-medium">
                      {bet.date ? new Date(bet.date).toLocaleDateString('uk-UA') : '—'}
                    </span>
                    <Badge
                      className={`text-xs px-2 py-0.5 border-0 rounded-full ${
                        bet.result === 'Win' ? 'bg-[#DCFCE7] text-[#16A34A]'
                        : bet.result === 'Loss' ? 'bg-[#FEE2E2] text-[#DC2626]'
                        : 'bg-[#F3F4F6] text-[#9CA3AF]'
                      }`}
                    >
                      {bet.result === 'Win' ? 'Виграш' : bet.result === 'Loss' ? 'Програш' : 'Очікує'}
                    </Badge>
                  </div>
                  <p className="font-semibold text-[#111827] truncate">{bet.match || bet.team1 || 'Ставка'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-[#111827]">{bet.amount} ₴</span>
                    {bet.profit !== undefined && (
                      <span className={`text-sm font-semibold ${(bet.profit || 0) >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                        {(bet.profit || 0) >= 0 ? '+' : ''}{bet.profit} ₴
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 bg-white border border-[#F3F4F6] rounded-2xl text-center">
              <div className="p-4 bg-[#F3F4F6] rounded-2xl inline-block mb-4">
                <Plus className="h-8 w-8 text-[#9CA3AF]" />
              </div>
              <p className="text-[#6B7280] mb-4">Ще немає ставок. Додайте першу!</p>
              <Link
                to="/app/my-bets"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#447afc] hover:bg-[#3568d4] text-white text-sm font-semibold transition-colors"
              >
                <Plus className="h-4 w-4" /> Додати ставку
              </Link>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xl font-bold text-[#111827] mb-4">Швидкі дії</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              to="/app/my-bets"
              className="flex items-center gap-3 p-4 bg-white border border-[#F3F4F6] hover:border-[#447afc] rounded-2xl transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                <Plus className="h-5 w-5 text-[#447afc]" />
              </div>
              <span className="text-sm font-semibold text-[#111827]">Додати ставку</span>
            </Link>
            <Link
              to="/app/strategy"
              className="flex items-center gap-3 p-4 bg-white border border-[#F3F4F6] hover:border-[#447afc] rounded-2xl transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center">
                <Target className="h-5 w-5 text-[#16A34A]" />
              </div>
              <span className="text-sm font-semibold text-[#111827]">Стратегії</span>
            </Link>
            <Link
              to="/app/matches"
              className="flex items-center gap-3 p-4 bg-white border border-[#F3F4F6] hover:border-[#447afc] rounded-2xl transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] flex items-center justify-center">
                <Trophy className="h-5 w-5 text-[#EA580C]" />
              </div>
              <span className="text-sm font-semibold text-[#111827]">Матчі</span>
            </Link>
            <Link
              to="/app/analytics"
              className="flex items-center gap-3 p-4 bg-white border border-[#F3F4F6] hover:border-[#447afc] rounded-2xl transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-[#6D28D9]" />
              </div>
              <span className="text-sm font-semibold text-[#111827]">Аналітика</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
