import { useState, useEffect, useMemo } from "react";
import { Target, Flag, Activity, DollarSign, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import StrategyOverview from "@/components/StrategyOverview";
import GoalsManager from "@/components/GoalsManager";
import { UserDataService } from "@/lib/userDataService";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/stores/appStore";
import { logRender } from "@/lib/devLogger";
import { PageHeader } from "@/components/PageHeader";
import type { Bet } from "@/types/betting";

interface StoredStrategy {
  id?: string;
  name: string;
  description?: string;
  riskLevel: "Low" | "Medium" | "High";
  expectedROI?: number;
  criteria?: string[];
  minOdds?: number;
  maxOdds?: number;
  allowedFormats?: string[];
  allowedBetTypes?: string[];
}
type GoalType = "amount" | "ladder" | "roi" | "winrate";
interface StoredGoal {
  id: string;
  name: string;
  type: GoalType;
  status: "active" | "completed" | "failed";
  targetAmount?: number;
  currentAmount?: number;
  startAmount?: number;
  targetLadderAmount?: number;
  minOdds?: number;
  maxOdds?: number;
  currentStep?: number;
  totalSteps?: number;
  targetROI?: number;
  currentROI?: number;
  targetWinRate?: number;
  currentWinRate?: number;
  betsPerDay?: number;
  isPrimary?: boolean;
}

const computeTodayPnL = (bets: Bet[]) => {
  const today = new Date().toISOString().split("T")[0];
  const todayBets = bets.filter((b) => {
    try {
      return new Date(b.date).toISOString().split("T")[0] === today;
    } catch {
      return false;
    }
  });
  const profit = todayBets.reduce(
    (sum, b) => sum + Number(b.profit || 0) + Number(b.originalProfit || 0),
    0,
  );
  const pending = todayBets.filter((b) => b.result === "Pending").length;
  return { profit, count: todayBets.length, pending };
};
const compute7DayProfit = (bets: Bet[]): number[] => {
  const days: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const dayBets = bets.filter((b) => {
      try {
        return new Date(b.date).toISOString().split("T")[0] === key;
      } catch {
        return false;
      }
    });
    days.push(
      dayBets.reduce(
        (sum, b) => sum + Number(b.profit || 0) + Number(b.originalProfit || 0),
        0,
      ),
    );
  }
  return days;
};
const computeBestStrategy = (bets: Bet[]) => {
  const byStrat: Record<
    string,
    { profit: number; stake: number; count: number }
  > = {};
  bets.forEach((b) => {
    const name = b.strategy || "";
    if (!name) return;
    if (!byStrat[name]) byStrat[name] = { profit: 0, stake: 0, count: 0 };
    byStrat[name].profit += (b.profit || 0) + (b.originalProfit || 0);
    byStrat[name].stake += b.originalAmount || b.amount || 0;
    byStrat[name].count++;
  });
  let best: {
    name: string;
    roi: number;
    count: number;
    avgRoi: number;
  } | null = null;
  let totalRoi = 0;
  let stratCount = 0;
  Object.entries(byStrat).forEach(([name, s]) => {
    const roi = s.stake > 0 ? (s.profit / s.stake) * 100 : 0;
    if (s.count >= 3) {
      totalRoi += roi;
      stratCount++;
    }
    if (!best || roi > best.roi)
      best = { name, roi, count: s.count, avgRoi: 0 };
  });
  if (best)
    best.avgRoi = stratCount > 1 ? (totalRoi - best.roi) / (stratCount - 1) : 0;
  return best;
};
const pickPrimaryGoal = (goals: StoredGoal[]): StoredGoal | null => {
  const active = goals.filter((g) => g.status === "active");
  return active.find((g) => g.isPrimary) || null;
};
const goalProgress = (goal: StoredGoal): { percent: number; label: string } => {
  switch (goal.type) {
    case "amount": {
      const c = goal.currentAmount ?? 0,
        t = goal.targetAmount ?? 0;
      return {
        percent: t > 0 ? Math.min(100, Math.max(0, (c / t) * 100)) : 0,
        label: `${c.toFixed(0)} / ${t.toFixed(0)} ₴`,
      };
    }
    case "ladder": {
      const s = goal.currentStep ?? 0,
        t = goal.totalSteps ?? 0;
      return { percent: t > 0 ? (s / t) * 100 : 0, label: `Крок ${s}/${t}` };
    }
    case "roi": {
      const c = goal.currentROI ?? 0,
        t = goal.targetROI ?? 0;
      return {
        percent: t > 0 ? Math.min(100, Math.max(0, (c / t) * 100)) : 0,
        label: `${c.toFixed(1)}%/${t.toFixed(1)}%`,
      };
    }
    case "winrate": {
      const c = goal.currentWinRate ?? 0,
        t = goal.targetWinRate ?? 0;
      return {
        percent: t > 0 ? Math.min(100, Math.max(0, (c / t) * 100)) : 0,
        label: `${c.toFixed(1)}%/${t.toFixed(1)}%`,
      };
    }
    default:
      return { percent: 0, label: "—" };
  }
};

export default function Strategy() {
  logRender("Strategy");
  const [activeTab, setActiveTab] = useState<"strategies" | "goals">(
    "strategies",
  );
  const [bets, setBets] = useState<Bet[]>([]);

  const { user } = useAuth();
  const currentUser = user?.username || "default";
  const strategyVersion = useAppStore((s) => s.strategyVersion);

  useEffect(() => {
    (async () => {
      try {
        const fetched = await UserDataService.fetchBets();
        setBets((fetched as Bet[]) || []);
      } catch {
        // fallback to localStorage cache
        const local = UserDataService.getUserData<Bet[]>(
          currentUser,
          "mybets_data",
          [],
        );
        setBets(local || []);
      }
    })();
  }, [currentUser, strategyVersion]);

  // --- Dynamic data for KPI + detail cards ---
  const resolvedUser = currentUser || "default";
  const primaryStrategyId = useAppStore((s) => s.primaryStrategyId);
  const activeStrategy = useMemo(() => {
    const pid =
      primaryStrategyId ||
      UserDataService.getUserData<string>(resolvedUser, "primary_strategy", "");
    if (!pid) return null;
    const strats = UserDataService.getUserData<StoredStrategy[]>(
      resolvedUser,
      "strategies_data",
      [],
    );
    return (
      strats.find((s: StoredStrategy) => s.id === pid || s.name === pid) || null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedUser, primaryStrategyId, strategyVersion]);

  const [primaryGoal, setPrimaryGoal] = useState<StoredGoal | null>(null);
  const todayPnL = useMemo(() => computeTodayPnL(bets), [bets]);
  const sevenDayProfit = useMemo(() => compute7DayProfit(bets), [bets]);
  const bestStrategy = useMemo(() => computeBestStrategy(bets), [bets]);
  const stratsAndGoals = useMemo(() => {
    const strats =
      UserDataService.getUserData<StoredStrategy[]>(
        resolvedUser,
        "strategies_data",
        [],
      ) || [];
    const goals =
      UserDataService.getUserData<StoredGoal[]>(resolvedUser, "goals", []) ||
      [];
    return { strategies: strats.length, goals: goals.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedUser, strategyVersion]);

  useEffect(() => {
    const goals =
      UserDataService.getUserData<StoredGoal[]>(resolvedUser, "goals", []) ||
      [];
    setPrimaryGoal(pickPrimaryGoal(goals));
  }, [resolvedUser, strategyVersion]);

  const goalInfo = primaryGoal ? goalProgress(primaryGoal) : null;

  const tabs = [
    { id: "strategies" as const, label: "Стратегії", icon: Target },
    { id: "goals" as const, label: "Цілі", icon: Flag },
  ];

  return (
    <div className="min-h-screen bg-[#f3f3f3] relative">
      {/* ===== HEADER ===== */}
      <PageHeader
        title="Стратегії та Цілі"
        currentUser={currentUser || "User"}
        isDarkTheme={false}
        onToggleTheme={() => {}}
        showThemeToggle={false}
      />

      {/* ===== CONTENT ===== */}
      <div className="relative z-10 space-y-8 px-6 lg:px-8 pb-8 pt-4">
        {/* ===== KPI CARDS ===== */}
        <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Сьогоднішній P&L */}
            <div className="bg-white rounded-3xl px-6 py-3 border border-[#F3F4F6] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                  <DollarSign
                    className="h-5 w-5 text-[#447afc]"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-xl font-semibold text-[#111827]">
                  Прибуток сьогодні
                </span>
              </div>
              {todayPnL.count > 0 ? (
                <>
                  <div
                    className={`text-3xl font-bold mb-1 ${todayPnL.profit > 0 ? "text-[#22C55E]" : todayPnL.profit < 0 ? "text-[#EF4444]" : "text-[#111827]"}`}
                  >
                    {todayPnL.profit > 0 ? "+" : ""}
                    {todayPnL.profit.toFixed(0)} ₴
                  </div>
                  <span className="text-sm text-[#6B7280]">
                    {todayPnL.count} став
                    {todayPnL.count === 1
                      ? "ка"
                      : todayPnL.count < 5
                        ? "ки"
                        : "ок"}
                    {todayPnL.pending > 0 ? `, ${todayPnL.pending} очікує` : ""}
                  </span>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-[#9CA3AF] mb-1">
                    —
                  </div>
                  <span className="text-sm text-[#9CA3AF]">
                    Сьогодні ставок немає
                  </span>
                </>
              )}
              <div className="mt-2" style={{ height: 28 }}>
                <svg
                  width="100%"
                  height="28"
                  viewBox="0 0 100 28"
                  preserveAspectRatio="none"
                >
                  {(() => {
                    const arr = sevenDayProfit;
                    const max = Math.max(...arr.map(Math.abs));
                    const rng = max || 1;
                    const ys = arr.map((v) => 14 - (v / rng) * 12);
                    const d = ys
                      .map(
                        (y, i) =>
                          `${i === 0 ? "M" : "L"} ${(i / 6) * 100} ${y}`,
                      )
                      .join(" ");
                    const area = d + ` L 100 28 L 0 28 Z`;
                    const lastUp = todayPnL.profit >= 0;
                    return (
                      <>
                        <path
                          d={area}
                          fill={
                            lastUp
                              ? "rgba(34,197,94,0.08)"
                              : "rgba(239,68,68,0.08)"
                          }
                        />
                        <path
                          d={d}
                          fill="none"
                          stroke={lastUp ? "#22C55E" : "#EF4444"}
                          strokeWidth="2"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
            {/* Найкраща стратегія */}
            <button
              onClick={() => setActiveTab("strategies")}
              className="text-left bg-white rounded-3xl px-6 py-3 border border-[#F3F4F6] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB]"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                  <Trophy
                    className="h-5 w-5 text-[#447afc]"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-xl font-semibold text-[#111827]">
                  Найкраща стратегія
                </span>
              </div>
              {bestStrategy ? (
                <>
                  <div
                    className="text-3xl font-bold text-[#111827] mb-1 break-words"
                    title={bestStrategy.name}
                  >
                    {bestStrategy.name}
                  </div>
                  <span
                    className={`text-sm font-semibold ${bestStrategy.roi >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}
                  >
                    ROI {bestStrategy.roi >= 0 ? "+" : ""}
                    {bestStrategy.roi.toFixed(1)}%
                  </span>
                  <span className="text-sm text-[#9CA3AF] ml-1">
                    ({bestStrategy.count} ставок)
                  </span>
                  {bestStrategy.avgRoi !== 0 && (
                    <div className="mt-2" style={{ height: 22 }}>
                      <svg
                        width="100%"
                        height="22"
                        viewBox="0 0 100 22"
                        preserveAspectRatio="none"
                      >
                        <rect
                          x="0"
                          y="4"
                          width={Math.min(
                            100,
                            Math.abs(bestStrategy.roi) * 2.5,
                          )}
                          height="14"
                          rx="3"
                          fill={bestStrategy.roi >= 0 ? "#22C55E" : "#EF4444"}
                          opacity="0.85"
                        />
                        <rect
                          x="0"
                          y="4"
                          width={Math.min(
                            100,
                            Math.abs(bestStrategy.avgRoi) * 2.5,
                          )}
                          height="14"
                          rx="3"
                          fill="#D1D5DB"
                          opacity="0.6"
                        />
                        <text
                          x="5"
                          y="15"
                          fontSize="8"
                          fill="#fff"
                          fontWeight="bold"
                        >
                          {bestStrategy.roi >= 0 ? "+" : ""}
                          {bestStrategy.roi.toFixed(0)}%
                        </text>
                      </svg>
                      <div className="flex items-center justify-between text-[10px] text-[#9CA3AF] mt-0.5">
                        <span>Найкраща</span>
                        <span>Середня</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-[#9CA3AF] mb-1">
                    —
                  </div>
                  <span className="text-sm text-[#9CA3AF]">
                    Потрібно мін. 3 ставки
                  </span>
                </>
              )}
            </button>
            {/* Стратегій / Цілей */}
            <div className="bg-white rounded-3xl px-6 py-3 border border-[#F3F4F6] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                  <Target
                    className="h-5 w-5 text-[#447afc]"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-xl font-semibold text-[#111827]">
                  Стратегій / Цілей
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B7280]">
                    Створено стратегій
                  </span>
                  <span className="text-2xl font-bold text-[#447afc]">
                    {stratsAndGoals.strategies}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B7280]">Створено цілей</span>
                  <span className="text-2xl font-bold text-[#22C55E]">
                    {stratsAndGoals.goals}
                  </span>
                </div>
                {stratsAndGoals.strategies + stratsAndGoals.goals > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-1.5 rounded-full bg-[#DBEAFE]" />
                    <div className="flex-1 h-1.5 rounded-full bg-[#DCFCE7]" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== CURRENT STRATEGY + CURRENT GOAL ===== */}
        <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Поточна стратегія */}
            <div className="bg-white rounded-[32px] border border-[#F3F4F6] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] h-full flex flex-col overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB]">
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                    <Activity
                      className="h-5 w-5 text-[#447afc]"
                      strokeWidth={2}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-[#374151] tracking-tight">
                      Поточна стратегія
                    </h3>
                    <p className="text-sm text-[#6B7280] mt-0.5">
                      Правила, яких ви дотримуєтесь
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-px w-full bg-[#F3F4F6]" />
              {activeStrategy ? (
                <div className="space-y-5 flex-1 px-7 pb-7 pt-6">
                  <p className="text-2xl font-bold text-[#374151]">
                    {activeStrategy.name}
                  </p>
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
                        {activeStrategy.minOdds ?? "—"}
                      </p>
                    </div>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                      <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                        Макс. коеф.
                      </p>
                      <p className="text-2xl font-bold text-[#111827] mt-1.5">
                        {activeStrategy.maxOdds ?? "—"}
                      </p>
                    </div>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center min-w-0 flex flex-col items-center justify-center min-h-[80px]">
                      <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                        Формати
                      </p>
                      <p className="text-2xl font-bold text-[#111827] mt-1.5">
                        {activeStrategy.allowedFormats?.join(", ") || "Усі"}
                      </p>
                    </div>
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center min-w-0 flex flex-col items-center justify-center min-h-[80px]">
                      <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                        Типи ставок
                      </p>
                      <p className="text-2xl font-bold text-[#111827] mt-1.5">
                        {activeStrategy.allowedBetTypes?.join(", ") || "Усі"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center px-7 py-12 text-center">
                  <div className="p-6 bg-[#F3F4F6] rounded-3xl inline-block mb-4">
                    <Activity
                      className="h-12 w-12 text-[#9CA3AF]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-[#111827] mb-2">
                    Ви ще не обрали основну стратегію
                  </h3>
                  <p className="text-sm text-[#6B7280] max-w-sm leading-relaxed">
                    Перейдіть у вкладку «Стратегії» та натисніть ☆, щоб
                    встановити стратегію як основну
                  </p>
                </div>
              )}
            </div>
            {/* Поточна ціль */}
            <div className="bg-white rounded-[32px] border border-[#F3F4F6] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] h-full flex flex-col overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB]">
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                    <Flag className="h-5 w-5 text-[#447afc]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-[#374151] tracking-tight">
                      Поточна ціль
                    </h3>
                    <p className="text-sm text-[#6B7280] mt-0.5">
                      Ціль, над якою ви працюєте
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-px w-full bg-[#F3F4F6]" />
              {primaryGoal && goalInfo ? (
                <div className="flex flex-col flex-1 px-7 pb-7 pt-6">
                  <div>
                    <p className="text-2xl font-bold text-[#374151]">
                      {primaryGoal.name}
                    </p>
                    <div className="mt-3">
                      <Progress
                        value={Math.max(Math.min(goalInfo.percent, 100), 2)}
                        className="h-2"
                      />
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-sm text-[#6B7280]">
                          {goalInfo.label}
                        </span>
                        <span className="text-sm font-semibold text-[#374151]">
                          {goalInfo.percent.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-auto">
                    {primaryGoal.type === "amount" && (
                      <>
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                            Ціль
                          </p>
                          <p className="text-2xl font-bold text-[#111827] mt-1.5">
                            {(primaryGoal.targetAmount ?? 0).toFixed(0)}
                          </p>
                        </div>
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                            Накопичено
                          </p>
                          <p className="text-2xl font-bold text-[#111827] mt-1.5">
                            {(primaryGoal.currentAmount ?? 0).toFixed(0)}
                          </p>
                        </div>
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                            Залишилось
                          </p>
                          <p className="text-2xl font-bold text-[#111827] mt-1.5">
                            {Math.max(
                              0,
                              (primaryGoal.targetAmount ?? 0) -
                                (primaryGoal.currentAmount ?? 0),
                            ).toFixed(0)}
                          </p>
                        </div>
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                            Ставок/день
                          </p>
                          <p className="text-2xl font-bold text-[#111827] mt-1.5">
                            {primaryGoal.betsPerDay || "Усі"}
                          </p>
                        </div>
                      </>
                    )}
                    {primaryGoal.type === "ladder" && (
                      <>
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                            Старт
                          </p>
                          <p className="text-2xl font-bold text-[#111827] mt-1.5">
                            {(primaryGoal.startAmount ?? 0).toFixed(0)}
                          </p>
                        </div>
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                            Ціль
                          </p>
                          <p className="text-2xl font-bold text-[#111827] mt-1.5">
                            {(primaryGoal.targetLadderAmount ?? 0).toFixed(0)}
                          </p>
                        </div>
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                            Коеф.
                          </p>
                          <p className="text-2xl font-bold text-[#111827] mt-1.5 whitespace-nowrap">
                            {primaryGoal.minOdds ?? "—"}-
                            {primaryGoal.maxOdds ?? "—"}
                          </p>
                        </div>
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                            Крок
                          </p>
                          <p className="text-2xl font-bold text-[#111827] mt-1.5 whitespace-nowrap">
                            {primaryGoal.currentStep ?? 0}/
                            {primaryGoal.totalSteps ?? 0}
                          </p>
                        </div>
                      </>
                    )}
                    {primaryGoal.type === "roi" && (
                      <>
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                            Ціль ROI
                          </p>
                          <p className="text-2xl font-bold text-[#111827] mt-1.5">
                            {(primaryGoal.targetROI ?? 0).toFixed(1)}%
                          </p>
                        </div>
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                            Поточн.
                          </p>
                          <p className="text-2xl font-bold text-[#111827] mt-1.5">
                            {(primaryGoal.currentROI ?? 0).toFixed(1)}%
                          </p>
                        </div>
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                            Різниця
                          </p>
                          <p className="text-2xl font-bold text-[#111827] mt-1.5">
                            {(
                              (primaryGoal.currentROI ?? 0) -
                              (primaryGoal.targetROI ?? 0)
                            ).toFixed(1)}
                            %
                          </p>
                        </div>
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                            Ставок/день
                          </p>
                          <p className="text-2xl font-bold text-[#111827] mt-1.5">
                            {primaryGoal.betsPerDay || "Усі"}
                          </p>
                        </div>
                      </>
                    )}
                    {primaryGoal.type === "winrate" && (
                      <>
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                            Ціль WR
                          </p>
                          <p className="text-2xl font-bold text-[#111827] mt-1.5">
                            {(primaryGoal.targetWinRate ?? 0).toFixed(1)}%
                          </p>
                        </div>
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                            Поточн.
                          </p>
                          <p className="text-2xl font-bold text-[#111827] mt-1.5">
                            {(primaryGoal.currentWinRate ?? 0).toFixed(1)}%
                          </p>
                        </div>
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                            Різниця
                          </p>
                          <p className="text-2xl font-bold text-[#111827] mt-1.5">
                            {(
                              (primaryGoal.currentWinRate ?? 0) -
                              (primaryGoal.targetWinRate ?? 0)
                            ).toFixed(1)}
                            %
                          </p>
                        </div>
                        <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center min-h-[80px]">
                          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                            Ставок/день
                          </p>
                          <p className="text-2xl font-bold text-[#111827] mt-1.5">
                            {primaryGoal.betsPerDay || "Усі"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center px-7 py-12 text-center">
                  <div className="p-6 bg-[#F3F4F6] rounded-3xl inline-block mb-4">
                    <Flag
                      className="h-12 w-12 text-[#9CA3AF]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-[#111827] mb-2">
                    У вас ще немає активної цілі
                  </h3>
                  <p className="text-sm text-[#6B7280] max-w-sm leading-relaxed">
                    Перейдіть у вкладку «Цілі» та створіть нову ціль для
                    відстеження прогресу
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs bar */}
        <div className="space-y-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-3 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)]">
            <div className="grid grid-cols-2 gap-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative rounded-[24px] px-6 py-4 font-light text-base
                      transition-all duration-300 ease-in-out
                      ${
                        isActive
                          ? "bg-[#447afc] text-white font-medium shadow-[0_4px_16px_rgba(68,122,252,0.3)] border border-transparent"
                          : "bg-transparent text-[#9CA3AF] hover:bg-[#F5F5F3] hover:text-[#6B7280] border border-transparent"
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

          {/* Tab content */}
          <div>
            <div className={activeTab === "strategies" ? "" : "hidden"}>
              <StrategyOverview />
            </div>
            <div className={activeTab === "goals" ? "" : "hidden"}>
              <GoalsManager />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
