import { useState, useEffect, useRef } from "react";
import { UserDataService } from "@/lib/userDataService";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/stores/appStore";
import { toast } from "sonner";

// ── Types ──
export type GoalType = "amount" | "ladder" | "roi" | "winrate";
export type GoalStatus = "active" | "completed" | "failed";
export type LadderMode = "strict" | "soft";

export interface Bet {
  result: string;
  odds: number;
  date: string;
  goalId?: string;
  profit?: number;
  amount?: number;
}

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  status: GoalStatus;
  createdAt: string;
  completedAt?: string;
  isPrimary?: boolean;
  targetAmount?: number;
  currentAmount?: number;
  startAmount?: number;
  targetLadderAmount?: number;
  minOdds?: number;
  maxOdds?: number;
  currentStep?: number;
  totalSteps?: number;
  ladderMode?: LadderMode;
  steps?: LadderStep[];
  avgOdds?: number;
  currentBank?: number;
  targetROI?: number;
  currentROI?: number;
  targetWinRate?: number;
  currentWinRate?: number;
  betsPerDay?: number;
  _backendId?: string;
  deadline?: string;
  config?: Record<string, unknown>;
  target?: unknown;
  current?: unknown;
  isCompleted?: boolean;
}

export interface LadderStep {
  step: number;
  startAmount: number;
  minPlannedAmount?: number;
  maxPlannedAmount?: number;
  plannedAmount?: number;
  actualAmount?: number;
  actualOdds?: number;
  deviation?: number;
  status: "completed" | "current" | "locked";
  completedAt?: string;
}

export interface OddsScenario {
  odds: number;
  steps: number;
  speed: string;
  emoji: string;
  description: string;
}

interface NewGoalForm {
  name: string;
  type: GoalType;
  targetAmount: number;
  startAmount: number;
  targetLadderAmount: number;
  minOdds: number;
  maxOdds: number;
  ladderMode: LadderMode;
  targetROI: number;
  targetWinRate: number;
  betsPerDay: number;
}

// ── Constants ──
export const MAX_LADDER_STEPS = 500;

// ── Pure utility functions ──
export function calculateRemainingSteps(
  currentBank: number,
  targetAmount: number,
  minOdds: number,
): number {
  if (!minOdds || minOdds <= 1 || !isFinite(minOdds) || !currentBank || currentBank <= 0 || !targetAmount || targetAmount <= 0) return 0;
  let steps = 0, amount = currentBank;
  while (amount < targetAmount && steps < MAX_LADDER_STEPS) { amount *= minOdds; steps++; }
  return steps;
}

export function calculateLadderSteps(start: number, target: number, minOdds: number, maxOdds: number): LadderStep[] {
  if (!start || start <= 0 || !target || target <= 0 || !minOdds || minOdds <= 1 || !maxOdds || maxOdds <= 1 || !isFinite(minOdds) || !isFinite(maxOdds) || start >= target) return [];
  const steps: LadderStep[] = [];
  let cur = start, n = 1;
  while (cur < target && n <= MAX_LADDER_STEPS) {
    steps.push({ step: n, startAmount: cur, minPlannedAmount: cur * minOdds, maxPlannedAmount: cur * maxOdds, status: n === 1 ? "current" : "locked" });
    cur *= minOdds;
    n++;
  }
  return steps;
}

export function calculateOddsScenarios(start: number, target: number, minOdds: number, maxOdds: number): OddsScenario[] {
  if (!start || start <= 0 || !target || target <= 0 || !minOdds || minOdds <= 1 || !maxOdds || maxOdds <= 1 || !isFinite(minOdds) || !isFinite(maxOdds) || start >= target) return [];
  const scenarios: OddsScenario[] = [];
  [minOdds, (minOdds + maxOdds) / 2, maxOdds].forEach((odds) => {
    if (odds <= 1 || !isFinite(odds)) return;
    const steps = calculateLadderSteps(start, target, odds, odds);
    const speed = odds === minOdds ? "Повільно" : odds === maxOdds ? "Швидко" : "Оптимально";
    const emoji = odds === minOdds ? "🐢" : odds === maxOdds ? "🚀" : "⚡";
    const desc = odds === minOdds ? "Найбезпечніше" : odds === maxOdds ? "Ризиковано" : "Баланс";
    scenarios.push({ odds: parseFloat(odds.toFixed(2)), steps: steps.length, speed, emoji, description: desc });
  });
  return scenarios;
}

const safeParseFloat = (val: string): number => { const p = parseFloat(val); return isNaN(p) ? 0 : p; };
const safeParseInt = (val: string): number => { const p = parseInt(val, 10); return isNaN(p) ? 0 : p; };

// ── UI helpers (pure, no state) ──
export function getGoalProgress(goal: Goal): number {
  switch (goal.type) {
    case "amount": return ((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100;
    case "ladder": return ((goal.currentStep || 0) / (goal.totalSteps || 1)) * 100;
    case "roi": return ((goal.currentROI || 0) / (goal.targetROI || 1)) * 100;
    case "winrate": return ((goal.currentWinRate || 0) / (goal.targetWinRate || 1)) * 100;
    default: return 0;
  }
}

export function getGoalTypeLabel(type: GoalType): string {
  switch (type) {
    case "amount": return "Сума";
    case "ladder": return "Лесенка";
    case "roi": return "ROI";
    case "winrate": return "Win Rate";
  }
}

export function getKeyMetric(goal: Goal): { label: string; value: string; color: string } {
  switch (goal.type) {
    case "amount": return { label: "Залишилось", value: `${((goal.targetAmount || 0) - (goal.currentAmount || 0)).toFixed(0)} грн`, color: "text-blue-500" };
    case "ladder": return { label: "Поточний крок", value: `${goal.currentStep} / ${goal.totalSteps}`, color: "text-[#8B5CF6]" };
    case "roi": return { label: "ROI", value: `${(goal.currentROI || 0).toFixed(1)}%`, color: "text-green-500" };
    case "winrate": return { label: "Win Rate", value: `${(goal.currentWinRate || 0).toFixed(1)}%`, color: "text-amber-500" };
  }
}

export function getNextBetHint(goal: Goal): string | null {
  if (goal.type === "ladder" && goal.steps) {
    const cs = goal.steps.find((s) => s.status === "current");
    if (cs) return `Ставка: ${cs.startAmount.toFixed(0)} ₴ (${goal.minOdds}–${goal.maxOdds})`;
  }
  if (goal.type === "amount") {
    const r = (goal.targetAmount || 0) - (goal.currentAmount || 0);
    if (r > 0) return `До цілі: ${r.toFixed(0)} ₴`;
  }
  return null;
}

// ── Hook ──
export function useGoals() {
  const { user } = useAuth();
  const currentUser = user?.username || "";
  const bumpStrategy = useAppStore((s) => s.bumpStrategy);

  // ── State ──
  const [goals, setGoals] = useState<Goal[]>(() => {
    const loaded = UserDataService.getUserData(currentUser, "goals", []);
    return loaded.map((goal: Goal) => migrateLadderGoal(goal));
  });

  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCompletedResultModal, setShowCompletedResultModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isStepsCalculationExpanded, setIsStepsCalculationExpanded] = useState(false);
  const [isLadderOverviewExpanded, setIsLadderOverviewExpanded] = useState(true);
  const [isStepsProgressionExpanded, setIsStepsProgressionExpanded] = useState(true);
  const [isRulesExpanded, setIsRulesExpanded] = useState<Record<string, boolean>>({});

  const [newGoal, setNewGoal] = useState<NewGoalForm>(defaultNewGoalForm());
  const [minOddsStr, setMinOddsStr] = useState("1.3");
  const [maxOddsStr, setMaxOddsStr] = useState("5");
  const [startAmountStr, setStartAmountStr] = useState("100");
  const [targetLadderAmountStr, setTargetLadderAmountStr] = useState("100000");
  const [targetAmountStr, setTargetAmountStr] = useState("100000");
  const [targetROIStr, setTargetROIStr] = useState("50");
  const [targetWinRateStr, setTargetWinRateStr] = useState("65");
  const [betsPerDayStr, setBetsPerDayStr] = useState("5");

  const initialRecalcDone = useRef(false);
  const prevGoalSnapshotRef = useRef("");

  // ── Effects ──
  useEffect(() => {
    if (currentUser) UserDataService.setUserData(currentUser, "goals", goals);
  }, [goals, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const apiGoals = (await UserDataService.fetchGoals()) as (Record<string, unknown> & { id: string; type: string; name: string; target?: unknown; current?: unknown; isCompleted?: boolean; config?: Record<string, unknown>; })[]; if (apiGoals && apiGoals.length > 0) {
          const localGoals = UserDataService.getUserData<Goal[]>(currentUser, "goals", []);
          const localMap = new Map(localGoals.map((g) => [g.id, g]));
          const mapped = apiGoals.map((g) => {
            const local = localMap.get(g.id);
            const bc = g.config || {};
            const base: Goal = {
              id: g.id, type: g.type as GoalType, name: g.name,
              targetAmount: g.type === "amount" ? Number(g.target) : undefined,
              targetLadderAmount: g.type === "ladder" ? Number(g.target) : undefined,
              targetROI: g.type === "roi" ? Number(g.target) : undefined,
              targetWinRate: g.type === "winrate" ? Number(g.target) : undefined,
              currentAmount: local?.currentAmount ?? (g.type === "amount" ? Number(g.current) : undefined),
              currentStep: local?.currentStep ?? (g.type === "ladder" ? Number(g.current) : undefined),
              currentROI: local?.currentROI ?? (g.type === "roi" ? Number(g.current) : undefined),
              currentWinRate: local?.currentWinRate ?? (g.type === "winrate" ? Number(g.current) : undefined),
              status: (local?.status ?? (g.isCompleted ? "completed" : "active")) as GoalStatus,
              createdAt: "",
              ...bc as Record<string, unknown>,
              ...(local ? { steps: local.steps, currentBank: local.currentBank } : {}),
              _backendId: g.id,
            };
            return base;
          });
          setGoals(mapped as Goal[]);
          UserDataService.setUserDataSync(currentUser, "goals", mapped);
        }
      } catch { /* localStorage fallback */ }
    })();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || goals.length === 0 || initialRecalcDone.current) return;
    const t = setTimeout(() => { initialRecalcDone.current = true; updateGoalsProgress(); }, 800);
    return () => clearTimeout(t);
  }, [goals, currentUser]);

  useEffect(() => {
    const snapshot = goals.map((g) => `${g.id}:${g.currentAmount ?? g.currentROI ?? g.currentWinRate ?? g.currentStep ?? 0}:${g.status}`).join(",");
    if (prevGoalSnapshotRef.current && prevGoalSnapshotRef.current !== snapshot) {
      const pending = goals.map((g) => {
        const backendId = (g as { _backendId?: string })._backendId || g.id;
        const currentVal = g.type === "amount" ? g.currentAmount : g.type === "roi" ? g.currentROI : g.type === "winrate" ? g.currentWinRate : g.currentStep;
        const payload: Record<string, unknown> = { config: g, current: Number(currentVal ?? 0) };
        if (g.status === "completed") payload.isCompleted = true;
        return { backendId, payload };
      });
      const CONCURRENCY = 3;
      const chunkSize = Math.ceil(pending.length / CONCURRENCY);
      for (let w = 0; w < CONCURRENCY; w++) {
        const start = w * chunkSize;
        const chunk = pending.slice(start, start + chunkSize);
        if (chunk.length === 0) break;
        (async () => {
          for (const { backendId, payload } of chunk)
            await UserDataService.updateGoal(backendId, payload).catch(() => {});
        })();
      }
    }
    prevGoalSnapshotRef.current = snapshot;
  }, [goals]);

  // ── Business logic ──
  const updateGoalsProgress = async () => {
    let betsData: Bet[] = [];
    try { betsData = (await UserDataService.fetchBets()) as Bet[]; }
    catch { betsData = UserDataService.getUserData(currentUser, "mybets_data", []); }
    const updated = goals.map((goal) => computeGoalProgress(goal, betsData));
    setGoals(updated);
    UserDataService.setUserDataSync(currentUser, "goals", updated);
  };

  const handleManualUpdate = () => {
    setIsUpdating(true);
    updateGoalsProgress().then(() => { bumpStrategy(); toast.success("Прогрес цілей оновлено!"); setIsUpdating(false); });
  };

  const createGoal = async () => {
    const synced = syncNewGoalFromStrings();
    if (!synced.name.trim()) { toast.error("Введіть назву цілі"); return; }
    if (!validateGoalNumeric(synced)) return;
    const active = goals.filter((g) => g.status === "active");
    if (active.length >= 25) { toast.error("Максимум 25 активних цілей"); return; }

    const goal: Goal = { id: Date.now().toString(), name: synced.name, type: synced.type, status: "active", createdAt: new Date().toISOString(), isPrimary: active.length === 0, betsPerDay: synced.betsPerDay };
    if (synced.type === "amount") { goal.targetAmount = synced.targetAmount; goal.currentAmount = 0; }
    else if (synced.type === "ladder") { const steps = calculateLadderSteps(synced.startAmount, synced.targetLadderAmount, synced.minOdds, synced.maxOdds); Object.assign(goal, { startAmount: synced.startAmount, targetLadderAmount: synced.targetLadderAmount, minOdds: synced.minOdds, maxOdds: synced.maxOdds, avgOdds: synced.minOdds, currentStep: 0, totalSteps: steps.length, ladderMode: synced.ladderMode, steps, currentBank: synced.startAmount }); }
    else if (synced.type === "roi") { goal.targetROI = synced.targetROI; goal.currentROI = 0; }
    else if (synced.type === "winrate") { goal.targetWinRate = synced.targetWinRate; goal.currentWinRate = 0; }

    const updated = [...goals, goal];
    setGoals(updated);
    UserDataService.setUserDataSync(currentUser, "goals", updated);
    UserDataService.createGoal({ type: goal.type, name: goal.name, target: goal.targetAmount ?? goal.targetLadderAmount ?? goal.targetROI ?? goal.targetWinRate ?? 0, current: 0, isCompleted: false, config: goal as unknown as Record<string, unknown> }).then((backendGoal: { id?: string }) => { if (backendGoal?.id) setGoals((prev) => prev.map((g) => g.id === goal.id ? { ...g, _backendId: backendGoal.id } : g)); }).catch(() => {});
    bumpStrategy();
    setShowCreateDialog(false);
    resetNewGoalForm();
    toast.success("Ціль створена!", { description: "💡 Прив'яжіть ставки до цієї цілі" });
  };

  const deleteGoal = () => {
    if (!goalToDelete) return;
    const goal = goals.find((g) => g.id === goalToDelete);
    const u = goals.filter((g) => g.id !== goalToDelete);
    setGoals(u);
    UserDataService.setUserDataSync(currentUser, "goals", u);
    bumpStrategy();
    setShowDeleteDialog(false);
    setGoalToDelete(null);
    toast.success("Ціль видалена");
    const backendId = (goal as { _backendId?: string })?._backendId || goalToDelete;
    UserDataService.deleteGoal(backendId).catch(() => {});
  };

  const setPrimaryGoal = (goalId: string) => {
    const isPrimary = goals.find((g) => g.id === goalId)?.isPrimary;
    const updated = isPrimary
      ? goals.map((g) => g.id === goalId ? { ...g, isPrimary: false } : g)
      : goals.map((g) => ({ ...g, isPrimary: g.id === goalId }));
    setGoals(updated);
    UserDataService.setUserDataSync(currentUser, "goals", updated);
    bumpStrategy();
    toast.success(isPrimary ? "Головну ціль скасовано" : "Головна ціль змінена");
  };

  const openDetailsDialog = (goal: Goal) => { setSelectedGoal(goal); setShowDetailsDialog(true); setIsStepsCalculationExpanded(false); setIsLadderOverviewExpanded(true); setIsStepsProgressionExpanded(true); };
  const openCompletedGoalResult = (goal: Goal) => { setSelectedGoal(goal); setShowCompletedResultModal(true); };
  const confirmDeleteGoal = (goalId: string) => { setGoalToDelete(goalId); setShowDeleteDialog(true); };

  // ── Helpers ──
  const isLadderPreviewValid = (): boolean => {
    const start = safeParseFloat(startAmountStr), target = safeParseFloat(targetLadderAmountStr), min = safeParseFloat(minOddsStr), max = safeParseFloat(maxOddsStr);
    return start > 0 && target > 0 && min > 1 && max > 1 && start < target && isFinite(min) && isFinite(max);
  };

  const syncNewGoalFromStrings = () => ({
    ...newGoal,
    startAmount: safeParseFloat(startAmountStr), targetLadderAmount: safeParseFloat(targetLadderAmountStr),
    minOdds: safeParseFloat(minOddsStr), maxOdds: safeParseFloat(maxOddsStr),
    targetAmount: safeParseFloat(targetAmountStr), targetROI: safeParseFloat(targetROIStr),
    targetWinRate: safeParseFloat(targetWinRateStr), betsPerDay: safeParseInt(betsPerDayStr),
  });

  const validateGoalNumeric = (data: ReturnType<typeof syncNewGoalFromStrings>): boolean => {
    if (data.type === "amount" && (!data.targetAmount || data.targetAmount <= 0)) { toast.error("Цільова сума > 0"); return false; }
    if (data.type === "ladder") {
      if (!data.startAmount || data.startAmount <= 0) { toast.error("Початкова сума > 0"); return false; }
      if (!data.targetLadderAmount || data.targetLadderAmount <= 0) { toast.error("Цільова сума > 0"); return false; }
      if (data.startAmount >= data.targetLadderAmount) { toast.error("Ціль > початкової суми"); return false; }
      if (!data.minOdds || data.minOdds < 1.01) { toast.error("Мін. коеф. ≥ 1.01"); return false; }
      if (!data.maxOdds || data.maxOdds < 1.01) { toast.error("Макс. коеф. ≥ 1.01"); return false; }
      if (data.minOdds >= data.maxOdds) { toast.error("Макс > Мін"); return false; }
    }
    if (data.type === "roi" && (!data.targetROI || data.targetROI <= 0)) { toast.error("ROI > 0"); return false; }
    if (data.type === "winrate" && (!data.targetWinRate || data.targetWinRate <= 0 || data.targetWinRate > 100)) { toast.error("Win Rate 1–100"); return false; }
    return true;
  };

  const resetNewGoalForm = () => { setNewGoal(defaultNewGoalForm()); setMinOddsStr("1.3"); setMaxOddsStr("5"); setStartAmountStr("100"); setTargetLadderAmountStr("100000"); setTargetAmountStr("100000"); setTargetROIStr("50"); setTargetWinRateStr("65"); setBetsPerDayStr("5"); };
  const containerStates = { isStepsCalculationExpanded, setIsStepsCalculationExpanded, isLadderOverviewExpanded, setIsLadderOverviewExpanded, isStepsProgressionExpanded, setIsStepsProgressionExpanded, isRulesExpanded, setIsRulesExpanded };

  return {
    goals, activeTab, setActiveTab, showCreateDialog, setShowCreateDialog, showDeleteDialog, setShowDeleteDialog,
    showDetailsDialog, setShowDetailsDialog, showCompletedResultModal, setShowCompletedResultModal,
    selectedGoal, setSelectedGoal, goalToDelete, isUpdating, newGoal, setNewGoal,
    minOddsStr, setMinOddsStr, maxOddsStr, setMaxOddsStr, startAmountStr, setStartAmountStr,
    targetLadderAmountStr, setTargetLadderAmountStr, targetAmountStr, setTargetAmountStr,
    targetROIStr, setTargetROIStr, targetWinRateStr, setTargetWinRateStr, betsPerDayStr, setBetsPerDayStr,
    activeGoals: goals.filter((g) => g.status === "active"),
    completedGoals: goals.filter((g) => g.status === "completed"),
    handleManualUpdate, createGoal, deleteGoal, setPrimaryGoal, confirmDeleteGoal,
    openDetailsDialog, openCompletedGoalResult,
    isLadderPreviewValid, containerStates,
  };
}

// ── Internal helpers ──
function defaultNewGoalForm(): NewGoalForm {
  return { name: "", type: "amount", targetAmount: 100000, startAmount: 100, targetLadderAmount: 100000, minOdds: 1.3, maxOdds: 5, ladderMode: "soft", targetROI: 50, targetWinRate: 65, betsPerDay: 5 };
}

function migrateLadderGoal(goal: Goal): Goal {
  if (goal.type === "ladder" && goal.steps && goal.minOdds && goal.maxOdds) {
    return { ...goal, steps: goal.steps.map((s) => !s.minPlannedAmount || !s.maxPlannedAmount ? { ...s, minPlannedAmount: Math.round(s.startAmount * (goal.minOdds || 1.3) * 100) / 100, maxPlannedAmount: Math.round(s.startAmount * (goal.maxOdds || 5) * 100) / 100 } : s), avgOdds: goal.avgOdds || goal.minOdds };
  }
  if (goal.type === "ladder" && !goal.avgOdds && goal.minOdds && goal.maxOdds) return { ...goal, avgOdds: goal.minOdds };
  return goal;
}

function computeGoalProgress(goal: Goal, betsData: Bet[]): Goal {
  if (goal.status !== "active") return goal;
  switch (goal.type) {
    case "amount": {
      const goalBets = betsData.filter((b) => b.goalId === goal.id);
      const totalProfit = goalBets.reduce((s, b) => {
        if (b.result === "Win") return s + (b.profit || (b.odds - 1) * (b.amount || 100));
        if (b.result === "Loss") return s - (b.amount || 100);
        return s;
      }, 0);
      const done = totalProfit >= (goal.targetAmount || 0);
      return { ...goal, currentAmount: totalProfit, status: done ? "completed" : "active", completedAt: done ? new Date().toISOString() : undefined };
    }
    case "ladder":
      return computeLadderProgress(goal, betsData);
    case "roi": {
      const gb = betsData.filter((b) => b.goalId === goal.id && b.result !== "Pending");
      if (!gb.length) return { ...goal, currentROI: 0 };
      const stake = gb.reduce((s, b) => s + (b.amount || 100), 0);
      const profit = gb.reduce((s, b) => {
        if (b.result === "Win") return s + (b.profit || (b.odds - 1) * (b.amount || 100));
        if (b.result === "Loss") return s - (b.amount || 100);
        return s;
      }, 0);
      const roi = (profit / stake) * 100;
      const done = roi >= (goal.targetROI || 0);
      return { ...goal, currentROI: roi, status: done ? "completed" : "active", completedAt: done ? new Date().toISOString() : undefined };
    }
    case "winrate": {
      const gb = betsData.filter((b) => b.goalId === goal.id && b.result !== "Pending");
      if (!gb.length) return { ...goal, currentWinRate: 0 };
      const wins = gb.filter((b) => b.result === "Win").length;
      const wr = (wins / gb.length) * 100;
      const done = wr >= (goal.targetWinRate || 0);
      return { ...goal, currentWinRate: wr, status: done ? "completed" : "active", completedAt: done ? new Date().toISOString() : undefined };
    }
    default: return goal;
  }
}

function computeLadderProgress(goal: Goal, betsData: Bet[]): Goal {
  const minOdds = goal.minOdds || 1.3, maxOdds = goal.maxOdds || 5;
  const goalBets = betsData.filter((b) => b.goalId === goal.id && b.result === "Win");
  const oddsBets = betsData.filter((b) => !b.goalId && b.result === "Win" && b.odds >= minOdds && b.odds <= maxOdds);
  const allBets = [...goalBets, ...oddsBets].filter((b, i, a) => a.findIndex((x) => x === b) === i);
  const sorted = allBets.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let stepIdx = 0;
  const steps = (goal.steps || []).map((s, i) => ({ ...s, status: i === 0 ? "current" as const : "locked" as const, actualAmount: undefined, actualOdds: undefined, deviation: undefined, completedAt: undefined }));
  const used = new Set<number>();

  for (let si = 0; si < steps.length; si++) {
    const cs = steps[si];
    let bestBet: Bet | null = null, bestIdx = -1, bestDiff = Infinity;
    for (let bi = 0; bi < sorted.length; bi++) {
      if (used.has(bi)) continue;
      const bet = sorted[bi];
      const diff = Math.abs((bet.amount || 0) - cs.startAmount);
      const diffPct = cs.startAmount ? diff / cs.startAmount : 999;
      const tol = !!bet.goalId ? 0.8 : 0.5;
      if (diffPct <= tol && bet.odds >= minOdds && bet.odds <= maxOdds && diffPct < bestDiff) { bestBet = bet; bestIdx = bi; bestDiff = diffPct; }
    }
    if (!bestBet) break;
    used.add(bestIdx);
    const actual = Math.round((bestBet.amount || 0) * bestBet.odds * 100) / 100;
    const minPlanned = cs.minPlannedAmount || Math.round(cs.startAmount * minOdds * 100) / 100;
    steps[si] = { ...cs, status: "completed", completedAt: bestBet.date, actualAmount: actual, actualOdds: bestBet.odds, deviation: actual - minPlanned };
    stepIdx = si + 1;
    if (si + 1 < steps.length) steps[si + 1] = { ...steps[si + 1], startAmount: actual, minPlannedAmount: Math.round(actual * minOdds * 100) / 100, maxPlannedAmount: Math.round(actual * maxOdds * 100) / 100, status: "current" };
  }

  const prevActual = stepIdx > 0 ? steps[stepIdx - 1]?.actualAmount : undefined;
  const currentBank = prevActual != null ? prevActual : goal.startAmount || 0;
  const remaining = calculateRemainingSteps(currentBank, goal.targetLadderAmount || 100000, minOdds);
  const done = currentBank >= (goal.targetLadderAmount || 100000);

  if (stepIdx > 0 && stepIdx < steps.length && remaining > 0) {
    let running = currentBank;
    const totalNew = stepIdx + remaining;
    steps.splice(stepIdx);
    for (let i = stepIdx; i < totalNew; i++) {
      const minP = Math.round(running * minOdds * 100) / 100, maxP = Math.round(running * maxOdds * 100) / 100;
      steps.push({ step: i + 1, startAmount: running, minPlannedAmount: minP, maxPlannedAmount: maxP, status: i === stepIdx ? "current" : "locked" });
      running = Math.round(running * minOdds * 100) / 100;
    }
  }

  return { ...goal, avgOdds: minOdds, currentStep: stepIdx, totalSteps: stepIdx + remaining, currentBank, steps, status: done ? "completed" : "active", completedAt: done ? new Date().toISOString() : undefined };
}
