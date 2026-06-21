import { useMemo } from 'react';
import {
  Target,
  Flag,
  TrendingUp,
  ShieldAlert,
  Star,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserDataService } from '@/lib/userDataService';
import type { Bet } from '@/types/betting';
import { CARD_BASE_STYLE, CARD_HOVER_STYLE, applyCardHover, resetCardHover } from '@/lib/cardStyles';
import { useAuth } from '@/contexts/AuthContext';

/**
 * StrategyOverviewHeader
 *
 * Summary block displayed above the Strategy tabs. Style now mirrors the
 * Analytics KPI cards 1-to-1 (Поточний банк / Загальний профіт / Всього ставок /
 * Вінрейт): left-aligned icon + title row, large 4xl bold value, and a bottom
 * row with directional arrow + semantic color + muted caption.
 */

interface StrategyOverviewHeaderProps {
  bets: Bet[];
  onNavigateTab: (tab: 'strategies' | 'goals' | 'risks') => void;
  refreshKey?: number;
}

interface StoredStrategy {
  id?: string;
  name: string;
  description?: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  expectedROI?: number;
  criteria?: string[];
  minOdds?: number;
  maxOdds?: number;
  allowedFormats?: string[];
  allowedBetTypes?: string[];
}

type GoalType = 'amount' | 'ladder' | 'roi' | 'winrate';

interface StoredGoal {
  id: string;
  name: string;
  type: GoalType;
  status: 'active' | 'completed' | 'failed';
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
  betsPerDay?: number;
  isPrimary?: boolean;
  createdAt?: string;
}

// Shared card style — identical to Analytics KPI cards
const cardBaseStyle = CARD_BASE_STYLE;
const cardHoverStyle = CARD_HOVER_STYLE;

const applyHover = applyCardHover;
const resetHover = resetCardHover;

const loadStrategies = (): StoredStrategy[] => {
  try {
    const raw = localStorage.getItem('customStrategies');
    return raw ? (JSON.parse(raw) as StoredStrategy[]) : [];
  } catch {
    return [];
  }
};

const riskBadgeClass = (risk: string) => {
  switch (risk) {
    case 'Low':
      return 'bg-[#DCFCE7] text-[#16A34A]';
    case 'Medium':
      return 'bg-[#FEF3C7] text-[#D97706]';
    case 'High':
      return 'bg-[#FEE2E2] text-[#DC2626]';
    default:
      return 'bg-[#F3F4F6] text-[#6B7280]';
  }
};

const riskLabel = (risk: string) => {
  switch (risk) {
    case 'Low':
      return 'Низький';
    case 'Medium':
      return 'Середній';
    case 'High':
      return 'Високий';
    default:
      return risk;
  }
};

const goalTypeLabel = (type: GoalType): string => {
  switch (type) {
    case 'amount':
      return 'Сума';
    case 'ladder':
      return 'Лесенка';
    case 'roi':
      return 'ROI';
    case 'winrate':
      return 'Win Rate';
    default:
      return '—';
  }
};

const goalTypeBadgeClass = (type: GoalType): string => {
  switch (type) {
    case 'amount':
      return 'bg-[#DBEAFE] text-[#1E40AF]';
    case 'ladder':
      return 'bg-[#EDE9FE] text-[#6D28D9]';
    case 'roi':
      return 'bg-[#D1FAE5] text-[#047857]';
    case 'winrate':
      return 'bg-[#FEF3C7] text-[#B45309]';
    default:
      return 'bg-[#F3F4F6] text-[#374151]';
  }
};

const computeTodayRisk = (bets: Bet[]): { level: 'Low' | 'Medium' | 'High' | null; winRate: number | null } => {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const recent = bets.filter((b) => {
    const t = b.date ? new Date(b.date).getTime() : NaN;
    return !Number.isNaN(t) && t >= weekAgo && (b.result === 'Win' || b.result === 'Loss');
  });

  if (recent.length < 3) return { level: null, winRate: null };

  const wins = recent.filter((b) => b.result === 'Win').length;
  const winRate = (wins / recent.length) * 100;

  let level: 'Low' | 'Medium' | 'High' = 'Low';
  if (winRate < 35) level = 'High';
  else if (winRate < 55) level = 'Medium';
  else level = 'Low';

  return { level, winRate };
};

const compute30dWinRate = (bets: Bet[]): { winRate: number | null; totalBets: number } => {
  const now = Date.now();
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const recent = bets.filter((b) => {
    const t = b.date ? new Date(b.date).getTime() : NaN;
    return !Number.isNaN(t) && t >= monthAgo && (b.result === 'Win' || b.result === 'Loss');
  });

  if (recent.length === 0) return { winRate: null, totalBets: 0 };

  const wins = recent.filter((b) => b.result === 'Win').length;
  return { winRate: (wins / recent.length) * 100, totalBets: recent.length };
};

const pickPrimaryGoal = (goals: StoredGoal[]): StoredGoal | null => {
  const active = goals.filter((g) => g.status === 'active');
  if (active.length === 0) return null;
  // Only return a goal that is explicitly marked as primary
  const explicit = active.find((g) => g.isPrimary);
  return explicit || null;
};

const goalProgress = (goal: StoredGoal): { percent: number; label: string } => {
  switch (goal.type) {
    case 'amount': {
      const current = goal.currentAmount ?? 0;
      const target = goal.targetAmount ?? 0;
      const percent = target > 0 ? Math.max(0, Math.min(100, (current / target) * 100)) : 0;
      return { percent, label: `${current.toFixed(0)} / ${target.toFixed(0)} ₴` };
    }
    case 'ladder': {
      const step = goal.currentStep ?? 0;
      const total = goal.totalSteps ?? 0;
      const percent = total > 0 ? (step / total) * 100 : 0;
      return { percent, label: `Крок ${step} / ${total}` };
    }
    case 'roi': {
      const current = goal.currentROI ?? 0;
      const target = goal.targetROI ?? 0;
      const percent = target > 0 ? Math.max(0, Math.min(100, (current / target) * 100)) : 0;
      return { percent, label: `${current.toFixed(1)}% / ${target.toFixed(1)}%` };
    }
    case 'winrate': {
      const current = goal.currentWinRate ?? 0;
      const target = goal.targetWinRate ?? 0;
      const percent = target > 0 ? Math.max(0, Math.min(100, (current / target) * 100)) : 0;
      return { percent, label: `${current.toFixed(1)}% / ${target.toFixed(1)}%` };
    }
    default:
      return { percent: 0, label: '—' };
  }
};

const computeStrategyRoi = (bets: Bet[], strategyName: string): { roi: number | null; bets: number } => {
  const related = bets.filter(
    (b) => (b.strategy || 'Без стратегії') === strategyName && (b.result === 'Win' || b.result === 'Loss'),
  );
  if (related.length === 0) return { roi: null, bets: 0 };

  const totalStake = related.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalProfit = related.reduce((sum, b) => sum + (b.profit || 0), 0);
  const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
  return { roi, bets: related.length };
};

/** Build the 4 key criteria lines for the current active goal, mirroring strategy "Ключові критерії". */
const buildGoalCriteria = (goal: StoredGoal): string[] => {
  switch (goal.type) {
    case 'amount':
      return [
        `Цільова сума ${(goal.targetAmount ?? 0).toFixed(0)} ₴`,
        `Накопичено ${(goal.currentAmount ?? 0).toFixed(0)} ₴`,
        `Залишилось ${Math.max(0, (goal.targetAmount ?? 0) - (goal.currentAmount ?? 0)).toFixed(0)} ₴`,
        goal.betsPerDay ? `До ${goal.betsPerDay} ставок на день` : 'Без обмежень по ставках',
      ];
    case 'ladder':
      return [
        `Початкова сума ${(goal.startAmount ?? 0).toFixed(0)} ₴`,
        `Цільова сума ${(goal.targetLadderAmount ?? 0).toFixed(0)} ₴`,
        `Коефіцієнт ${goal.minOdds ?? '—'} – ${goal.maxOdds ?? '—'}`,
        `Крок ${goal.currentStep ?? 0} / ${goal.totalSteps ?? 0}`,
      ];
    case 'roi':
      return [
        `Цільовий ROI ${(goal.targetROI ?? 0).toFixed(1)}%`,
        `Поточний ROI ${(goal.currentROI ?? 0).toFixed(1)}%`,
        `Різниця ${((goal.currentROI ?? 0) - (goal.targetROI ?? 0)).toFixed(1)}%`,
        goal.betsPerDay ? `До ${goal.betsPerDay} ставок на день` : 'Без обмежень по ставках',
      ];
    case 'winrate':
      return [
        `Цільовий Win Rate ${(goal.targetWinRate ?? 0).toFixed(1)}%`,
        `Поточний Win Rate ${(goal.currentWinRate ?? 0).toFixed(1)}%`,
        `Різниця ${((goal.currentWinRate ?? 0) - (goal.targetWinRate ?? 0)).toFixed(1)}%`,
        goal.betsPerDay ? `До ${goal.betsPerDay} ставок на день` : 'Без обмежень по ставках',
      ];
    default:
      return [];
  }
};

export default function StrategyOverviewHeader({ bets, onNavigateTab, refreshKey }: StrategyOverviewHeaderProps) {
  const { user } = useAuth();
  const currentUser = user?.username || localStorage.getItem('username') || 'default';

  const { activeStrategy, primaryGoal, todayRisk, winRate30d, strategyRoi } = useMemo(() => {
    const strategies = loadStrategies();
    const primaryId = localStorage.getItem('primaryStrategy');
    const active = strategies.find((s) => (s.id || s.name) === primaryId) || null;

    const goals = UserDataService.getUserData<StoredGoal[]>(currentUser, 'goals', []) || [];
    const goal = pickPrimaryGoal(goals);

    const risk = computeTodayRisk(bets);
    const wr = compute30dWinRate(bets);
    const roi = active ? computeStrategyRoi(bets, active.name) : { roi: null, bets: 0 };

    return {
      activeStrategy: active,
      primaryGoal: goal,
      todayRisk: risk,
      winRate30d: wr,
      strategyRoi: roi,
    };
  }, [bets, currentUser, refreshKey]);

  const goalInfo = primaryGoal ? goalProgress(primaryGoal) : null;
  const goalCriteria = primaryGoal ? buildGoalCriteria(primaryGoal) : [];

  return (
    <div className="space-y-6">
      {/* ===== KPI CARDS — matches Analytics style 1:1 ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* 1. Активна стратегія */}
        <button
          type="button"
          onClick={() => onNavigateTab('strategies')}
          className="text-left bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5 cursor-pointer group relative flex flex-col justify-between"
          style={cardBaseStyle}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => resetHover(e.currentTarget)}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#EFF6FF]">
              <Target className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium text-[#6B7280] uppercase tracking-wider">Активна стратегія</span>
          </div>
          {activeStrategy ? (
            <>
              <div className="text-3xl font-bold text-[#111827] tracking-tight mb-2 truncate" title={activeStrategy.name}>
                {activeStrategy.name}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={`${riskBadgeClass(activeStrategy.riskLevel)} text-xs font-medium px-2 py-0.5 border-0 rounded-full hover:opacity-100`}
                >
                  {riskLabel(activeStrategy.riskLevel)}
                </Badge>
                {strategyRoi.roi !== null ? (
                  <>
                    <span className={`text-sm font-semibold ${strategyRoi.roi >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                      ROI {strategyRoi.roi >= 0 ? '+' : ''}{strategyRoi.roi.toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-[#9CA3AF]">Немає ставок</span>
                )}
              </div>
            </>
          ) : (
            <div className="py-1">
              <div className="text-3xl font-bold text-[#9CA3AF] tracking-tight mb-2">Не обрано</div>
              <span className="text-sm text-[#9CA3AF]">Оберіть основну стратегію</span>
            </div>
          )}
        </button>

        {/* 2. Головна ціль */}
        <button
          type="button"
          onClick={() => onNavigateTab('goals')}
          className="text-left bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5 cursor-pointer group relative flex flex-col justify-between"
          style={cardBaseStyle}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => resetHover(e.currentTarget)}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#F0FDF4]">
              <Flag className="h-5 w-5 text-[#16A34A]" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium text-[#6B7280] uppercase tracking-wider">Головна ціль</span>
          </div>
          {primaryGoal && goalInfo ? (
            <>
              <div className="text-3xl font-bold text-[#111827] tracking-tight mb-2 truncate" title={primaryGoal.name}>
                {primaryGoal.name}
              </div>
              <div className="space-y-1.5">
                <Progress value={Math.max(goalInfo.percent, 2)} className="h-2 shimmer-bar" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B7280]">{goalInfo.label}</span>
                  <span className="text-sm font-semibold text-[#111827]">{goalInfo.percent.toFixed(0)}%</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-1">
              <div className="text-3xl font-bold text-[#9CA3AF] tracking-tight mb-2">Не обрано</div>
              <span className="text-sm text-[#9CA3AF]">Оберіть головну ціль</span>
            </div>
          )}
        </button>

        {/* 3. Рівень ризику */}
        <button
          type="button"
          onClick={() => onNavigateTab('risks')}
          className="text-left bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5 cursor-pointer group relative flex flex-col justify-between"
          style={cardBaseStyle}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => resetHover(e.currentTarget)}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#FFF7ED]">
              <ShieldAlert className="h-5 w-5 text-[#EA580C]" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium text-[#6B7280] uppercase tracking-wider">Рівень ризику</span>
          </div>
          {todayRisk.level ? (
            <>
              <div className={`text-3xl font-bold tracking-tight mb-2 ${todayRisk.level === 'High' ? 'text-[#DC2626]' : todayRisk.level === 'Medium' ? 'text-[#D97706]' : 'text-[#16A34A]'}`}>
                {riskLabel(todayRisk.level)}
              </div>
              <div className="flex items-center gap-1 mb-2">
                <div className="flex-1 h-2 rounded-full bg-[#DCFCE7] relative">
                  {todayRisk.level === 'Low' && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#16A34A] shadow-sm" />}
                </div>
                <div className="flex-1 h-2 rounded-full bg-[#FEF3C7] relative">
                  {todayRisk.level === 'Medium' && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#D97706] shadow-sm" />}
                </div>
                <div className="flex-1 h-2 rounded-full bg-[#FEE2E2] relative">
                  {todayRisk.level === 'High' && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#DC2626] shadow-sm" />}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${(todayRisk.winRate ?? 0) >= 50 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  Вінрейт {todayRisk.winRate?.toFixed(0)}%
                </span>
                <span className="text-sm text-[#9CA3AF]">за 7 днів</span>
              </div>
            </>
          ) : (
            <div className="py-1">
              <div className="text-3xl font-bold text-[#9CA3AF] tracking-tight mb-2">—</div>
              <div className="flex items-center gap-1 mb-2 opacity-30">
                <div className="flex-1 h-2 rounded-full bg-[#DCFCE7]" />
                <div className="flex-1 h-2 rounded-full bg-[#FEF3C7]" />
                <div className="flex-1 h-2 rounded-full bg-[#FEE2E2]" />
              </div>
              <span className="text-sm text-[#9CA3AF]">Мін. 3 ставки за тиждень</span>
            </div>
          )}
        </button>

        {/* 4. Вінрейт 30 днів */}
        <div
          className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5 group relative flex flex-col justify-between"
          style={cardBaseStyle}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => resetHover(e.currentTarget)}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#F0FDF4]">
              <TrendingUp className="h-5 w-5 text-[#16A34A]" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium text-[#6B7280] uppercase tracking-wider">Вінрейт 30 днів</span>
          </div>
          {winRate30d.winRate !== null ? (
            <>
              <div className="text-3xl font-bold text-[#111827] tracking-tight mb-2">{winRate30d.winRate.toFixed(1)}%</div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${winRate30d.winRate >= 50 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {winRate30d.winRate >= 50 ? 'Вище середнього' : 'Нижче середнього'}
                </span>
                <span className="text-sm text-[#9CA3AF]">({winRate30d.totalBets} ставок)</span>
              </div>
            </>
          ) : (
            <div className="py-1">
              <div className="text-3xl font-bold text-[#9CA3AF] tracking-tight mb-2">—</div>
              <span className="text-sm text-[#9CA3AF]">Немає завершених ставок</span>
            </div>
          )}
        </div>
      </div>

      {/* ===== CURRENT STRATEGY + CURRENT GOAL ROW — equal size ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Current strategy details card */}
        <div
          className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl p-7 h-full flex flex-col"
          style={cardBaseStyle}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => resetHover(e.currentTarget)}
        >
          <div className="px-7 pt-7 pb-5">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#EFF6FF] flex-shrink-0 mt-0.5">
                <Activity className="h-5 w-5 text-[#447afc]" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1 min-h-[3.5rem] flex flex-col justify-center">
                <h3 className="text-xl font-bold text-[#374151] tracking-tight">Поточна стратегія</h3>
                <p className="text-sm text-[#6B7280] mt-0.5">Правила, яких ви дотримуєтесь</p>
              </div>
            </div>
          </div>
          <div className="h-px w-full bg-[#F3F4F6]" />

          {activeStrategy ? (
            <div className="space-y-5 flex-1">
              <div>
                <p className="text-2xl font-bold text-[#374151] tracking-tight">
                  {activeStrategy.name}
                </p>
                {activeStrategy.description && (
                  <p className="text-base text-[#4B5563] mt-2 leading-relaxed">
                    {activeStrategy.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] rounded-2xl border border-[#DBEAFE]">
                  <p className="text-xs text-[#3B82F6] font-semibold uppercase tracking-wider">
                    Мін. коеф.
                  </p>
                  <p className="text-2xl font-bold text-[#1E40AF] mt-1.5">
                    {activeStrategy.minOdds ?? '—'}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] rounded-2xl border border-[#DBEAFE]">
                  <p className="text-xs text-[#3B82F6] font-semibold uppercase tracking-wider">
                    Макс. коеф.
                  </p>
                  <p className="text-2xl font-bold text-[#1E40AF] mt-1.5">
                    {activeStrategy.maxOdds ?? '—'}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] rounded-2xl border border-[#BBF7D0]">
                  <p className="text-xs text-[#16A34A] font-semibold uppercase tracking-wider">
                    Формати
                  </p>
                  <p className="text-lg font-bold text-[#15803D] mt-1.5 truncate">
                    {activeStrategy.allowedFormats?.join(', ') || 'Усі'}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] rounded-2xl border border-[#FDE68A]">
                  <p className="text-xs text-[#D97706] font-semibold uppercase tracking-wider">
                    Типи ставок
                  </p>
                  <p className="text-lg font-bold text-[#B45309] mt-1.5 truncate">
                    {activeStrategy.allowedBetTypes?.join(', ') || 'Усі'}
                  </p>
                </div>
              </div>

              {activeStrategy.criteria && activeStrategy.criteria.length > 0 && (
                <div className="pt-2">
                  <p className="text-2xl font-bold text-[#374151] tracking-tight mb-4">
                    Ключові критерії
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeStrategy.criteria.map((c, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] border border-[#E2E8F0] rounded-2xl hover:border-[#D1D5DB] hover:shadow-md transition-all duration-200"
                      >
                        <span className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#6366F1] to-[#4F46E5] text-white text-sm font-bold rounded-xl flex-shrink-0 shadow-sm">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-[#374151] font-semibold leading-snug">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center flex-1 flex flex-col items-center justify-center">
              <p className="text-base text-[#4B5563] mb-4">
                Ви ще не обрали основну стратегію. Оберіть її у вкладці &quot;Стратегії&quot;, щоб
                відстежувати результати.
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab('strategies')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#447afc] hover:bg-[#3568d4] text-white text-base font-semibold transition-colors"
              >
                <Target className="h-4 w-4" strokeWidth={2} />
                Обрати стратегію
              </button>
            </div>
          )}
        </div>

        {/* Current goal details card — mirrors strategy card structure */}
        <div
          className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl p-7 h-full flex flex-col"
          style={cardBaseStyle}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => resetHover(e.currentTarget)}
        >
          <div className="mb-6 pb-5 border-b border-[#F3F4F6]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#F0FDF4]">
                  <Flag className="h-5 w-5 text-[#16A34A]" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#374151] tracking-tight">Поточна ціль</h3>
                  <p className="text-sm text-[#6B7280] mt-0.5">Ціль, над якою ви працюєте</p>
                </div>
              </div>
              {primaryGoal && (
                <Badge
                  className={`${goalTypeBadgeClass(
                    primaryGoal.type,
                  )} text-sm font-semibold px-3 py-1 border-0 rounded-full hover:opacity-100`}
                >
                  {goalTypeLabel(primaryGoal.type)}
                </Badge>
              )}
            </div>
          </div>

          {primaryGoal && goalInfo ? (
            <div className="space-y-5 flex-1">
              <div>
                <p className="text-2xl font-bold text-[#374151] tracking-tight">
                  {primaryGoal.name}
                </p>
                <div className="mt-3">
                  <Progress value={Math.max(Math.min(goalInfo.percent, 100), 2)} className="h-2" />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-sm text-[#6B7280]">{goalInfo.label}</span>
                    <span className="text-sm font-semibold text-[#374151]">{goalInfo.percent.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {primaryGoal.type === 'amount' && (
                  <>
                    <div className="p-4 bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] rounded-2xl border border-[#DBEAFE]">
                      <p className="text-xs text-[#3B82F6] font-semibold uppercase tracking-wider">Ціль</p>
                      <p className="text-2xl font-bold text-[#1E40AF] mt-1.5">
                        {(primaryGoal.targetAmount ?? 0).toFixed(0)}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] rounded-2xl border border-[#BBF7D0]">
                      <p className="text-xs text-[#16A34A] font-semibold uppercase tracking-wider">Накоп.</p>
                      <p className="text-2xl font-bold text-[#15803D] mt-1.5">
                        {(primaryGoal.currentAmount ?? 0).toFixed(0)}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] rounded-2xl border border-[#FDE68A]">
                      <p className="text-xs text-[#D97706] font-semibold uppercase tracking-wider">Залиш.</p>
                      <p className="text-2xl font-bold text-[#B45309] mt-1.5">
                        {Math.max(0, (primaryGoal.targetAmount ?? 0) - (primaryGoal.currentAmount ?? 0)).toFixed(0)}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] rounded-2xl border border-[#DDD6FE]">
                      <p className="text-xs text-[#6D28D9] font-semibold uppercase tracking-wider">Ставок/день</p>
                      <p className="text-lg font-bold text-[#5B21B6] mt-1.5 truncate">
                        {primaryGoal.betsPerDay || 'Усі'}
                      </p>
                    </div>
                  </>
                )}

                {primaryGoal.type === 'ladder' && (
                  <>
                    <div className="p-4 bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] rounded-2xl border border-[#DBEAFE]">
                      <p className="text-xs text-[#3B82F6] font-semibold uppercase tracking-wider">Старт</p>
                      <p className="text-2xl font-bold text-[#1E40AF] mt-1.5">
                        {(primaryGoal.startAmount ?? 0).toFixed(0)}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] rounded-2xl border border-[#DBEAFE]">
                      <p className="text-xs text-[#3B82F6] font-semibold uppercase tracking-wider">Ціль</p>
                      <p className="text-2xl font-bold text-[#1E40AF] mt-1.5">
                        {(primaryGoal.targetLadderAmount ?? 0).toFixed(0)}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] rounded-2xl border border-[#BBF7D0]">
                      <p className="text-xs text-[#16A34A] font-semibold uppercase tracking-wider">Коеф.</p>
                      <p className="text-lg font-bold text-[#15803D] mt-1.5 truncate">
                        {primaryGoal.minOdds ?? '—'} – {primaryGoal.maxOdds ?? '—'}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] rounded-2xl border border-[#FDE68A]">
                      <p className="text-xs text-[#D97706] font-semibold uppercase tracking-wider">Крок</p>
                      <p className="text-lg font-bold text-[#B45309] mt-1.5 truncate">
                        {primaryGoal.currentStep ?? 0} / {primaryGoal.totalSteps ?? 0}
                      </p>
                    </div>
                  </>
                )}

                {primaryGoal.type === 'roi' && (
                  <>
                    <div className="p-4 bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] rounded-2xl border border-[#DBEAFE]">
                      <p className="text-xs text-[#3B82F6] font-semibold uppercase tracking-wider">Ціль ROI</p>
                      <p className="text-2xl font-bold text-[#1E40AF] mt-1.5">
                        {(primaryGoal.targetROI ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] rounded-2xl border border-[#BBF7D0]">
                      <p className="text-xs text-[#16A34A] font-semibold uppercase tracking-wider">Поточн.</p>
                      <p className="text-2xl font-bold text-[#15803D] mt-1.5">
                        {(primaryGoal.currentROI ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] rounded-2xl border border-[#FDE68A]">
                      <p className="text-xs text-[#D97706] font-semibold uppercase tracking-wider">Різниця</p>
                      <p className="text-2xl font-bold text-[#B45309] mt-1.5">
                        {((primaryGoal.currentROI ?? 0) - (primaryGoal.targetROI ?? 0)).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] rounded-2xl border border-[#DDD6FE]">
                      <p className="text-xs text-[#6D28D9] font-semibold uppercase tracking-wider">Ставок/день</p>
                      <p className="text-lg font-bold text-[#5B21B6] mt-1.5 truncate">
                        {primaryGoal.betsPerDay || 'Усі'}
                      </p>
                    </div>
                  </>
                )}

                {primaryGoal.type === 'winrate' && (
                  <>
                    <div className="p-4 bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] rounded-2xl border border-[#DBEAFE]">
                      <p className="text-xs text-[#3B82F6] font-semibold uppercase tracking-wider">Ціль WR</p>
                      <p className="text-2xl font-bold text-[#1E40AF] mt-1.5">
                        {(primaryGoal.targetWinRate ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] rounded-2xl border border-[#BBF7D0]">
                      <p className="text-xs text-[#16A34A] font-semibold uppercase tracking-wider">Поточн.</p>
                      <p className="text-2xl font-bold text-[#15803D] mt-1.5">
                        {(primaryGoal.currentWinRate ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] rounded-2xl border border-[#FDE68A]">
                      <p className="text-xs text-[#D97706] font-semibold uppercase tracking-wider">Різниця</p>
                      <p className="text-2xl font-bold text-[#B45309] mt-1.5">
                        {((primaryGoal.currentWinRate ?? 0) - (primaryGoal.targetWinRate ?? 0)).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] rounded-2xl border border-[#DDD6FE]">
                      <p className="text-xs text-[#6D28D9] font-semibold uppercase tracking-wider">Ставок/день</p>
                      <p className="text-lg font-bold text-[#5B21B6] mt-1.5 truncate">
                        {primaryGoal.betsPerDay || 'Усі'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {goalCriteria.length > 0 && (
                <div className="pt-2">
                  <p className="text-2xl font-bold text-[#374151] tracking-tight mb-4">
                    Ключові критерії
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {goalCriteria.map((c, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] border border-[#E2E8F0] rounded-2xl hover:border-[#D1D5DB] hover:shadow-md transition-all duration-200"
                      >
                        <span className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#6366F1] to-[#4F46E5] text-white text-sm font-bold rounded-xl flex-shrink-0 shadow-sm">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-[#374151] font-semibold leading-snug">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center flex-1 flex flex-col items-center justify-center">
              <p className="text-base text-[#4B5563] mb-4">
                У вас ще немає активної цілі. Створіть її у вкладці &quot;Цілі&quot;, щоб відстежувати прогрес.
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab('goals')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#447afc] hover:bg-[#3568d4] text-white text-base font-semibold transition-colors"
              >
                <Flag className="h-4 w-4" strokeWidth={2} />
                Створити ціль
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}