import { useState, useEffect } from 'react';
import {
  Flag,
  TrendingUp,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { UserDataService } from '@/lib/userDataService';
import type { Bet } from '@/types/betting';
import { CARD_BASE_STYLE, applyCardHover, resetCardHover } from '@/lib/cardStyles';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/stores/appStore';
import { logRender } from '@/lib/devLogger';
import StrategyKpiCard from '@/components/StrategyKpiCard';

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
  currentUser?: string;
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

const applyHover = applyCardHover;
const resetHover = resetCardHover;

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

export default function StrategyOverviewHeader({ bets, onNavigateTab, refreshKey, currentUser: propUser }: StrategyOverviewHeaderProps) {
  logRender('StrategyOverviewHeader');
  const { user } = useAuth();
  const resolvedUser = propUser || user?.username || localStorage.getItem('username') || 'default';
  // Force re-render when strategies change
  useAppStore((s) => s.strategyVersion);

  // Read active strategy for insight section (card uses StrategyKpiCard instead)
  const activeStrategy = (() => {
    const pid = UserDataService.getUserData<string>(resolvedUser, 'primary_strategy', '')
      || (() => { const r = localStorage.getItem('primaryStrategy'); if (r) try { return JSON.parse(r); } catch { return r; } return ''; })();
    if (!pid) return null;
    const strats = UserDataService.getUserData<StoredStrategy[]>(resolvedUser, 'strategies_data', []);
    return strats.find((s) => s.id === pid || s.name === pid) || null;
  })();

  const [primaryGoal, setPrimaryGoal] = useState<StoredGoal | null>(null);
  const [todayRisk, setTodayRisk] = useState<{ level: 'Low' | 'Medium' | 'High' | null; winRate: number | null }>({ level: null, winRate: null });
  const [winRate30d, setWinRate30d] = useState<{ winRate: number | null; totalBets: number }>({ winRate: null, totalBets: 0 });

  useEffect(() => {
    const goals = UserDataService.getUserData<StoredGoal[]>(resolvedUser, 'goals', []) || [];
    setPrimaryGoal(pickPrimaryGoal(goals));

    setTodayRisk(computeTodayRisk(bets));
    setWinRate30d(compute30dWinRate(bets));
  }, [bets, resolvedUser, refreshKey]);

  const goalInfo = primaryGoal ? goalProgress(primaryGoal) : null;

  return (
    <div className="space-y-6">
      {/* ===== KPI CARDS — wrapped in Analytics-style container ===== */}
      <div className="bg-white rounded-[32px] p-5 border border-[#E5E7EB] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Активна стратегія */}
        <StrategyKpiCard onNavigate={() => onNavigateTab('strategies')} />

        {/* 2. Головна ціль */}
        <button
          type="button"
          onClick={() => onNavigateTab('goals')}
          className="text-left bg-white border border-[#E5E7EB] hover:border-[#9CA3AF] rounded-3xl px-6 py-5 cursor-pointer group relative flex flex-col justify-between"
          style={cardBaseStyle}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => resetHover(e.currentTarget)}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#EFF6FF]">
              <Flag className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
            </div>
            <span className="text-lg font-semibold text-[#111827]">Головна ціль</span>
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
            <div className="flex flex-col flex-1">
              <div className="text-3xl font-bold text-[#9CA3AF] tracking-tight mb-2">Не обрано</div>
              <span className="text-sm text-[#9CA3AF]">Оберіть головну ціль</span>
            </div>
          )}
        </button>

        {/* 3. Рівень ризику */}
        <button
          type="button"
          onClick={() => onNavigateTab('risks')}
          className="text-left bg-white border border-[#E5E7EB] hover:border-[#9CA3AF] rounded-3xl px-6 py-5 cursor-pointer group relative flex flex-col justify-between"
          style={cardBaseStyle}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => resetHover(e.currentTarget)}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#EFF6FF]">
              <ShieldAlert className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
            </div>
            <span className="text-lg font-semibold text-[#111827]">Рівень ризику</span>
          </div>
          {todayRisk.level ? (
            <>
              <div className={`text-3xl font-bold tracking-tight mb-2 ${todayRisk.level === 'High' ? 'text-[#DC2626]' : todayRisk.level === 'Medium' ? 'text-[#6B7280]' : 'text-[#6B7280]'}`}>
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
            <div className="flex flex-col flex-1">
              <span className="text-sm text-[#9CA3AF]">Мін. 3 ставки за тиждень</span>
              <div className="flex items-center gap-1 mt-2 opacity-30">
                <div className="flex-1 h-2 rounded-full bg-[#DCFCE7]" />
                <div className="flex-1 h-2 rounded-full bg-[#FEF3C7]" />
                <div className="flex-1 h-2 rounded-full bg-[#FEE2E2]" />
              </div>
            </div>
          )}
        </button>

        {/* 4. Вінрейт 30 днів */}
        <div
          className="bg-white border border-[#E5E7EB] hover:border-[#9CA3AF] rounded-3xl px-6 py-5 group relative flex flex-col justify-between"
          style={cardBaseStyle}
          onMouseEnter={(e) => applyHover(e.currentTarget)}
          onMouseLeave={(e) => resetHover(e.currentTarget)}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#EFF6FF]">
              <TrendingUp className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
            </div>
            <span className="text-lg font-semibold text-[#111827]">Вінрейт 30 днів</span>
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
            <div className="flex flex-col flex-1">
              <span className="text-sm text-[#9CA3AF]">Немає завершених ставок</span>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* ===== CURRENT STRATEGY + CURRENT GOAL ROW — equal size, Telegram card style ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Current strategy details card */}
        <div
          className="bg-white rounded-[32px] border border-[#E5E7EB] shadow-[0_4px_16px_rgba(0,0,0,0.06)] h-full flex flex-col overflow-hidden"
        >
          {/* Header: icon + name */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#EFF6FF] flex-shrink-0">
                <Activity className="h-5 w-5 text-[#447afc]" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-[#374151] tracking-tight">Поточна стратегія</h3>
                <p className="text-sm text-[#6B7280] mt-0.5">Правила, яких ви дотримуєтесь</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-[#F3F4F6]" />

          {activeStrategy ? (
            <div className="space-y-5 flex-1 px-7 pb-7 pt-6">
              {/* Strategy name */}
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold text-[#374151] tracking-tight">
                  {activeStrategy.name}
                </p>
              </div>
              {activeStrategy.description && (
                <p className="text-base text-[#4B5563] mt-2 leading-relaxed">
                  {activeStrategy.description}
                </p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-[10%]">
                <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                  <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                    Мін. коеф.
                  </p>
                  <p className="text-2xl font-bold text-[#111827] mt-1.5">
                    {activeStrategy.minOdds ?? '—'}
                  </p>
                </div>
                <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                  <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                    Макс. коеф.
                  </p>
                  <p className="text-2xl font-bold text-[#111827] mt-1.5">
                    {activeStrategy.maxOdds ?? '—'}
                  </p>
                </div>
                <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center min-w-0 flex flex-col items-center justify-center min-h-[80px]">
                  <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                    Формати
                  </p>
                  <p className="text-2xl font-bold text-[#111827] mt-1.5">
                    {activeStrategy.allowedFormats?.join(', ') || 'Усі'}
                  </p>
                </div>
                <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center min-w-0 flex flex-col items-center justify-center min-h-[80px]">
                  <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                    Типи ставок
                  </p>
                  <p className="text-2xl font-bold text-[#111827] mt-1.5">
                    {activeStrategy.allowedBetTypes?.join(', ') || 'Усі'}
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center px-7 py-12 text-center">
              <div className="flex items-center justify-center w-28 h-28 rounded-2xl bg-[#F3F4F6] mb-4">
                <Activity className="h-14 w-14 text-[#9CA3AF]" strokeWidth={1.5} />
              </div>
              <p className="text-base font-semibold text-[#374151] mb-2">
                Ви ще не обрали основну стратегію
              </p>
              <p className="text-sm text-[#6B7280] max-w-sm leading-relaxed">
                Перейдіть у вкладку «Стратегії» та натисніть ☆, щоб встановити стратегію як основну
              </p>
            </div>
          )}
        </div>

        {/* Current goal details card — mirrors strategy card structure */}
        <div
          className="bg-white rounded-[32px] border border-[#E5E7EB] shadow-[0_4px_16px_rgba(0,0,0,0.06)] h-full flex flex-col overflow-hidden"
        >
          {/* Header: icon + title */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#EFF6FF] flex-shrink-0">
                <Flag className="h-5 w-5 text-[#447afc]" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-[#374151] tracking-tight">Поточна ціль</h3>
                <p className="text-sm text-[#6B7280] mt-0.5">Ціль, над якою ви працюєте</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-[#F3F4F6]" />

          {primaryGoal && goalInfo ? (
            <div className="flex flex-col flex-1 px-7 pb-7 pt-6">
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-auto">
                {primaryGoal.type === 'amount' && (
                  <>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                      <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Ціль</p>
                      <p className="text-2xl font-bold text-[#111827] mt-1.5">
                        {(primaryGoal.targetAmount ?? 0).toFixed(0)}
                      </p>
                    </div>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                      <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Накопичено</p>
                      <p className="text-2xl font-bold text-[#111827] mt-1.5">
                        {(primaryGoal.currentAmount ?? 0).toFixed(0)}
                      </p>
                    </div>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                      <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Залишилось</p>
                      <p className="text-2xl font-bold text-[#111827] mt-1.5">
                        {Math.max(0, (primaryGoal.targetAmount ?? 0) - (primaryGoal.currentAmount ?? 0)).toFixed(0)}
                      </p>
                    </div>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                      <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Ставок/день</p>
                      <p className="text-2xl font-bold text-[#111827] mt-1.5">
                        {primaryGoal.betsPerDay || 'Усі'}
                      </p>
                    </div>
                  </>
                )}

                {primaryGoal.type === 'ladder' && (
                  <>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                      <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Старт</p>
                      <p className="text-2xl font-bold text-[#111827] mt-1.5">
                        {(primaryGoal.startAmount ?? 0).toFixed(0)}
                      </p>
                    </div>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                      <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Ціль</p>
                      <p className="text-2xl font-bold text-[#111827] mt-1.5">
                        {(primaryGoal.targetLadderAmount ?? 0).toFixed(0)}
                      </p>
                    </div>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                      <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Коеф.</p>
                      <p className="text-2xl font-bold text-[#111827] mt-1.5 whitespace-nowrap">
                        {primaryGoal.minOdds ?? '—'} – {primaryGoal.maxOdds ?? '—'}
                      </p>
                    </div>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                      <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Крок</p>
                      <p className="text-2xl font-bold text-[#111827] mt-1.5 whitespace-nowrap">
                        {primaryGoal.currentStep ?? 0} / {primaryGoal.totalSteps ?? 0}
                      </p>
                    </div>
                  </>
                )}

                {primaryGoal.type === 'roi' && (
                  <>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                      <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Ціль ROI</p>
                      <p className="text-2xl font-bold text-[#111827] mt-1.5">
                        {(primaryGoal.targetROI ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                      <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Поточн.</p>
                      <p className="text-2xl font-bold text-[#111827] mt-1.5">
                        {(primaryGoal.currentROI ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                      <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Різниця</p>
                      <p className="text-2xl font-bold text-[#111827] mt-1.5">
                        {((primaryGoal.currentROI ?? 0) - (primaryGoal.targetROI ?? 0)).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                      <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Ставок/день</p>
                      <p className="text-2xl font-bold text-[#111827] mt-1.5">
                        {primaryGoal.betsPerDay || 'Усі'}
                      </p>
                    </div>
                  </>
                )}

                {primaryGoal.type === 'winrate' && (
                  <>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                      <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Ціль WR</p>
                      <p className="text-2xl font-bold text-[#111827] mt-1.5">
                        {(primaryGoal.targetWinRate ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                      <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Поточн.</p>
                      <p className="text-2xl font-bold text-[#111827] mt-1.5">
                        {(primaryGoal.currentWinRate ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                      <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Різниця</p>
                      <p className="text-2xl font-bold text-[#111827] mt-1.5">
                        {((primaryGoal.currentWinRate ?? 0) - (primaryGoal.targetWinRate ?? 0)).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                      <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Ставок/день</p>
                      <p className="text-2xl font-bold text-[#111827] mt-1.5">
                        {primaryGoal.betsPerDay || 'Усі'}
                      </p>
                    </div>
                  </>
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center px-7 py-12 text-center">
              <div className="flex items-center justify-center w-28 h-28 rounded-2xl bg-[#F3F4F6] mb-4">
                <Flag className="h-14 w-14 text-[#9CA3AF]" strokeWidth={1.5} />
              </div>
              <p className="text-base font-semibold text-[#374151] mb-2">
                У вас ще немає активної цілі
              </p>
              <p className="text-sm text-[#6B7280] max-w-sm leading-relaxed">
                Перейдіть у вкладку «Цілі» та створіть нову ціль для відстеження прогресу
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
