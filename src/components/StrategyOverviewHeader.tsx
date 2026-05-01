import { useMemo } from 'react';
import { Target, Flag, TrendingUp, ShieldAlert, Star, Activity, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserDataService } from '@/lib/userDataService';
import type { Bet } from '@/types/betting';

/**
 * StrategyOverviewHeader
 *
 * Summary block displayed above the Strategy tabs. Style mirrors Analytics KPI
 * cards: black monochrome icons on light-gray rounded squares, centered labels,
 * and a scale/shadow hover effect.
 */

interface StrategyOverviewHeaderProps {
  bets: Bet[];
  onNavigateTab: (tab: 'strategies' | 'goals' | 'risks') => void;
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

interface StoredGoal {
  id: string;
  name: string;
  type: 'amount' | 'ladder' | 'roi' | 'winrate';
  status: 'active' | 'completed' | 'failed';
  targetAmount?: number;
  currentAmount?: number;
  targetROI?: number;
  currentROI?: number;
  targetWinRate?: number;
  currentWinRate?: number;
  currentStep?: number;
  totalSteps?: number;
}

// Shared card style — identical to Analytics cards (scale + shadow on hover)
const cardBaseStyle: React.CSSProperties = {
  transform: 'scale(1)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
};
const cardHoverStyle: React.CSSProperties = {
  transform: 'scale(1.03)',
  boxShadow: '0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)',
};

const applyHover = (el: HTMLElement) => Object.assign(el.style, cardHoverStyle);
const resetHover = (el: HTMLElement) => Object.assign(el.style, cardBaseStyle);

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
  const priority: Record<StoredGoal['type'], number> = { amount: 0, ladder: 1, roi: 2, winrate: 3 };
  return [...active].sort((a, b) => priority[a.type] - priority[b.type])[0];
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

const buildInsight = (args: {
  activeStrategy: StoredStrategy | null;
  strategyRoi: number | null;
  todayRisk: 'Low' | 'Medium' | 'High' | null;
  winRate30d: number | null;
  primaryGoal: StoredGoal | null;
}): string => {
  const { activeStrategy, strategyRoi, todayRisk, winRate30d, primaryGoal } = args;

  if (!activeStrategy) {
    return 'Оберіть основну стратегію, щоб бачити персональні інсайти та відстежувати її ефективність.';
  }
  if (todayRisk === 'High') {
    return 'За останній тиждень вінрейт нижчий за 35%. Зменшіть розмір ставки та перегляньте критерії стратегії.';
  }
  if (strategyRoi !== null && strategyRoi < -5) {
    return `Поточна стратегія показує ROI ${strategyRoi.toFixed(1)}%. Розгляньте перехід на консервативніший підхід.`;
  }
  if (strategyRoi !== null && strategyRoi > 10) {
    return `Стратегія "${activeStrategy.name}" показує відмінний ROI +${strategyRoi.toFixed(1)}%. Продовжуйте її використовувати!`;
  }
  if (winRate30d !== null && winRate30d >= 55) {
    return `Вінрейт за 30 днів ${winRate30d.toFixed(0)}% — ви на правильному шляху. Фокусуйтесь на дисципліні.`;
  }
  if (primaryGoal) {
    return `Ви прямуєте до цілі "${primaryGoal.name}". Кожна зважена ставка наближає вас до результату.`;
  }
  return 'Додайте ціль і встановіть основну стратегію — це допоможе системі формувати персональні поради.';
};

export default function StrategyOverviewHeader({ bets, onNavigateTab }: StrategyOverviewHeaderProps) {
  const currentUser = localStorage.getItem('username') || 'default';

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
  }, [bets, currentUser]);

  const insight = buildInsight({
    activeStrategy,
    strategyRoi: strategyRoi.roi,
    todayRisk: todayRisk.level,
    winRate30d: winRate30d.winRate,
    primaryGoal,
  });

  const goalInfo = primaryGoal ? goalProgress(primaryGoal) : null;

  return (
    <div className="space-y-4">
      {/* KPI cards — matches Analytics card style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active strategy */}
        <button
          type="button"
          onClick={() => onNavigateTab('strategies')}
          className="text-left bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 cursor-pointer"
          style={cardBaseStyle}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => resetHover(e.currentTarget)}
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#F3F4F6] mb-3">
              <Target className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">
              Активна стратегія
            </span>
            {activeStrategy ? (
              <>
                <div className="flex items-center justify-center gap-1.5 mb-2 w-full">
                  <Star className="h-3.5 w-3.5 fill-[#111827] text-[#111827] flex-shrink-0" strokeWidth={1.5} />
                  <p className="text-base font-semibold text-[#111827] truncate" title={activeStrategy.name}>
                    {activeStrategy.name}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <Badge className={`${riskBadgeClass(activeStrategy.riskLevel)} text-xs font-medium px-2 py-0.5 border-0 rounded-full hover:opacity-100`}>
                    {riskLabel(activeStrategy.riskLevel)}
                  </Badge>
                  {strategyRoi.roi !== null ? (
                    <span className={`text-sm font-semibold ${strategyRoi.roi >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                      ROI {strategyRoi.roi >= 0 ? '+' : ''}{strategyRoi.roi.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-sm text-[#9CA3AF]">Немає ставок</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-[#111827] mb-1">Не обрано</p>
                <p className="text-xs text-[#6B7280]">Оберіть стратегію</p>
              </>
            )}
          </div>
        </button>

        {/* Primary goal progress */}
        <button
          type="button"
          onClick={() => onNavigateTab('goals')}
          className="text-left bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 cursor-pointer"
          style={cardBaseStyle}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => resetHover(e.currentTarget)}
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#F3F4F6] mb-3">
              <Flag className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">
              Головна ціль
            </span>
            {primaryGoal && goalInfo ? (
              <>
                <p className="text-base font-semibold text-[#111827] truncate w-full mb-1" title={primaryGoal.name}>
                  {primaryGoal.name}
                </p>
                <p className="text-xs text-[#6B7280] mb-2">{goalInfo.label}</p>
                <div className="w-full">
                  <Progress value={goalInfo.percent} className="h-2" />
                  <p className="text-xs text-[#9CA3AF] font-medium mt-1.5">{goalInfo.percent.toFixed(0)}% виконано</p>
                </div>
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-[#111827] mb-1">Немає активних цілей</p>
                <p className="text-xs text-[#6B7280]">Додайте ціль</p>
              </>
            )}
          </div>
        </button>

        {/* Today's risk */}
        <button
          type="button"
          onClick={() => onNavigateTab('risks')}
          className="text-left bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 cursor-pointer"
          style={cardBaseStyle}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => resetHover(e.currentTarget)}
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#F3F4F6] mb-3">
              <ShieldAlert className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">
              Рівень ризику
            </span>
            {todayRisk.level ? (
              <>
                <p className={`text-xl font-semibold mb-1 ${
                  todayRisk.level === 'High' ? 'text-[#DC2626]' :
                  todayRisk.level === 'Medium' ? 'text-[#D97706]' :
                  'text-[#16A34A]'
                }`}>
                  {riskLabel(todayRisk.level)}
                </p>
                <p className="text-xs text-[#6B7280]">
                  Вінрейт 7 днів: {todayRisk.winRate?.toFixed(0)}%
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-[#111827] mb-1">Немає даних</p>
                <p className="text-xs text-[#6B7280]">Мін. 3 ставки за тиждень</p>
              </>
            )}
          </div>
        </button>

        {/* 30-day win rate */}
        <div
          className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5"
          style={cardBaseStyle}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => resetHover(e.currentTarget)}
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#F3F4F6] mb-3">
              <TrendingUp className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">
              Вінрейт 30 днів
            </span>
            {winRate30d.winRate !== null ? (
              <>
                <p className={`text-2xl font-semibold mb-1 ${winRate30d.winRate >= 50 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {winRate30d.winRate.toFixed(1)}%
                </p>
                <p className="text-xs text-[#6B7280]">
                  На основі {winRate30d.totalBets} {winRate30d.totalBets === 1 ? 'ставки' : winRate30d.totalBets < 5 ? 'ставок' : 'ставок'}
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-semibold text-[#111827] mb-1">—</p>
                <p className="text-xs text-[#6B7280]">Немає завершених ставок</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Current strategy + insight row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current strategy details card */}
        <div
          className="lg:col-span-2 bg-white border border-[#F3F4F6] rounded-3xl p-6"
          style={cardBaseStyle}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => resetHover(e.currentTarget)}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#F3F4F6]">
                <Activity className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#111827]">Поточна стратегія</h3>
                <p className="text-xs text-[#6B7280]">Правила, яких ви дотримуєтесь</p>
              </div>
            </div>
            {activeStrategy && (
              <Badge className={`${riskBadgeClass(activeStrategy.riskLevel)} text-xs font-medium px-2.5 py-0.5 border-0 rounded-full hover:opacity-100`}>
                {riskLabel(activeStrategy.riskLevel)} ризик
              </Badge>
            )}
          </div>

          {activeStrategy ? (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-semibold text-[#111827]">{activeStrategy.name}</p>
                {activeStrategy.description && (
                  <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">{activeStrategy.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-[#F9FAFB] rounded-2xl text-center">
                  <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wider">Мін. коеф.</p>
                  <p className="text-base font-semibold text-[#111827] mt-1">
                    {activeStrategy.minOdds ?? '—'}
                  </p>
                </div>
                <div className="p-3 bg-[#F9FAFB] rounded-2xl text-center">
                  <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wider">Макс. коеф.</p>
                  <p className="text-base font-semibold text-[#111827] mt-1">
                    {activeStrategy.maxOdds ?? '—'}
                  </p>
                </div>
                <div className="p-3 bg-[#F9FAFB] rounded-2xl text-center">
                  <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wider">Формати</p>
                  <p className="text-base font-semibold text-[#111827] mt-1 truncate">
                    {activeStrategy.allowedFormats?.join(', ') || 'Усі'}
                  </p>
                </div>
                <div className="p-3 bg-[#F9FAFB] rounded-2xl text-center">
                  <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wider">Типи ставок</p>
                  <p className="text-base font-semibold text-[#111827] mt-1 truncate">
                    {activeStrategy.allowedBetTypes?.join(', ') || 'Усі'}
                  </p>
                </div>
              </div>

              {activeStrategy.criteria && activeStrategy.criteria.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">Ключові критерії</p>
                  <ul className="space-y-1.5">
                    {activeStrategy.criteria.slice(0, 3).map((c, idx) => (
                      <li key={idx} className="text-sm text-[#374151] flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-[#111827] rounded-full mt-2 flex-shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                    {activeStrategy.criteria.length > 3 && (
                      <li className="text-xs text-[#9CA3AF]">+ ще {activeStrategy.criteria.length - 3} критеріїв</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-[#6B7280] mb-3">
                Ви ще не обрали основну стратегію. Оберіть її у вкладці &quot;Стратегії&quot;, щоб відстежувати результати.
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab('strategies')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white text-sm font-medium transition-colors"
              >
                <Target className="h-4 w-4" strokeWidth={1.5} />
                Обрати стратегію
              </button>
            </div>
          )}
        </div>

        {/* Insight card */}
        <div
          className="bg-white border border-[#F3F4F6] rounded-3xl p-6"
          style={cardBaseStyle}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => resetHover(e.currentTarget)}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#F3F4F6]">
              <Sparkles className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111827]">Персональна порада</h3>
              <p className="text-xs text-[#6B7280]">На основі вашої статистики</p>
            </div>
          </div>
          <p className="text-sm text-[#374151] leading-relaxed">{insight}</p>
        </div>
      </div>
    </div>
  );
}