import {
  calculateRemainingSteps,
  getGoalProgress,
  type Bet,
  type Goal,
  type GoalType,
} from "@/hooks/useGoals";

/* ---------- Formatting ---------- */
const int = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 });
const one = new Intl.NumberFormat("uk-UA", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const two = new Intl.NumberFormat("uk-UA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const uah = (n: number) =>
  `${n < 0 ? "−" : ""}${int.format(Math.abs(Math.round(n)))} ₴`;
export const signedUah = (n: number) =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${int.format(Math.abs(Math.round(n)))} ₴`;
export const pct1 = (n: number) => `${one.format(n)}%`;
export const pp = (n: number) => `${one.format(n)} в.п.`;
export const odds2 = (n: number) => two.format(n);
export const count = (n: number) => int.format(n);

export const shortDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const plural = (n: number, one: string, few: string, many: string) => {
  const a = Math.abs(n) % 10;
  const b = Math.abs(n) % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
};
export const stepsWord = (n: number) => plural(n, "крок", "кроки", "кроків");

/* ---------- Types ---------- */
export const TYPE_META: Record<
  GoalType,
  { label: string; desc: string; long: string; placeholder: string }
> = {
  amount: {
    label: "Сума",
    desc: "Дійти до заданої суми прибутку.",
    long: "Ціль у гривнях. Прогрес — прибуток записів, прив’язаних до цілі.",
    placeholder: "Наприклад, Банк 100 000 ₴",
  },
  roi: {
    label: "ROI",
    desc: "Тримати прибутковість ставок на рівні.",
    long: "Прибуток прив’язаних записів, поділений на суму їхніх ставок.",
    placeholder: "Наприклад, ROI 15% до кінця року",
  },
  winrate: {
    label: "Win Rate",
    desc: "Відстежувати частку перемог.",
    long: "Скільки ставок виграно з усіх розрахованих, прив’язаних до цілі.",
    placeholder: "Наприклад, Вінрейт 60% на CS2",
  },
  ladder: {
    label: "Лесенка",
    desc: "Від стартової суми до цілі — кроками, всім банком кроку.",
    long: "Кожен крок — ставка всім банком кроку в межах ваших коефіцієнтів.",
    placeholder: "Наприклад, 100 → 100 000 ₴",
  },
};
export const TYPE_ORDER: GoalType[] = ["amount", "roi", "winrate", "ladder"];

export const isFinished = (g: Goal) => g.status !== "active";

/* ---------- Linked bets ---------- */
export interface GoalBetStats {
  linked: number;
  settled: number;
  wins: number;
  losses: number;
  staked: number;
  profit: number;
  avgOdds: number;
  outOfRange: number;
}

export function goalBetStats(goal: Goal, bets: Bet[]): GoalBetStats {
  const linked = bets.filter((b) => b.goalId === goal.id);
  const settled = linked.filter((b) => b.result === "Win" || b.result === "Loss");
  const wins = settled.filter((b) => b.result === "Win");
  const staked = settled.reduce((s, b) => s + (b.amount || 100), 0);
  const profit = settled.reduce((s, b) => {
    if (b.result === "Win") return s + (b.profit || (b.odds - 1) * (b.amount || 100));
    return s - (b.amount || 100);
  }, 0);
  const avgOdds = settled.length
    ? settled.reduce((s, b) => s + (b.odds || 0), 0) / settled.length
    : 0;
  const outOfRange =
    goal.type === "ladder"
      ? linked.filter(
          (b) => b.odds < (goal.minOdds || 0) || b.odds > (goal.maxOdds || 999),
        ).length
      : 0;
  return {
    linked: linked.length,
    settled: settled.length,
    wins: wins.length,
    losses: settled.length - wins.length,
    staked,
    profit,
    avgOdds,
    outOfRange,
  };
}

/* ---------- Ladder ---------- */
export function ladderNumbers(goal: Goal) {
  const start = goal.startAmount || 0;
  const target = goal.targetLadderAmount || 0;
  const bank = goal.currentBank ?? start;
  const done = goal.currentStep || 0;
  const total = Math.max(goal.totalSteps || 0, done);
  const min = goal.minOdds || 1.3;
  const max = goal.maxOdds || 2;
  const current = goal.steps?.[done];
  const stake = current?.startAmount ?? bank;
  const afterMin = current?.minPlannedAmount ?? stake * min;
  const afterMax = current?.maxPlannedAmount ?? stake * max;
  return { start, target, bank, done, total, min, max, stake, afterMin, afterMax };
}

export function ladderScenarios(from: number, target: number, min: number, max: number) {
  const mid = (min + max) / 2;
  return (
    [
      [min, "Повільно", "найбезпечніше"],
      [mid, "Баланс", "середній ризик"],
      [max, "Швидко", "ризиковано"],
    ] as const
  ).map(([odds, speed, note], i) => ({
    key: i,
    odds,
    speed,
    note,
    steps: calculateRemainingSteps(from, target, odds),
    mid: i === 1,
  }));
}

/* ---------- View model ---------- */
export interface GoalVm {
  goal: Goal;
  typeLabel: string;
  pct: number;
  cur: string;
  of: string;
  /** Short right-hand label under the card's bar. */
  progressLabel: string;
  stats: { k: string; v: string }[];
  next: { kicker: string; big: string; rows: { k: string; v: string }[]; note: string };
  /** Ladder-only. */
  ladder?: ReturnType<typeof ladderNumbers>;
  linked: number;
}

export function goalVm(goal: Goal, s: GoalBetStats): GoalVm {
  return { ...buildVm(goal, s), linked: s.linked };
}

function buildVm(goal: Goal, s: GoalBetStats): Omit<GoalVm, "linked"> {
  const pct = Math.max(0, Math.min(getGoalProgress(goal), 100));
  const typeLabel = TYPE_META[goal.type].label;
  const perDay = goal.betsPerDay ? `до ${goal.betsPerDay}` : "Без обмежень";

  if (goal.type === "ladder") {
    const l = ladderNumbers(goal);
    const odds = `${odds2(l.min)} – ${odds2(l.max)}`;
    return {
      goal,
      typeLabel,
      pct,
      cur: uah(l.bank),
      of: `із ${uah(l.target)}`,
      progressLabel: l.total ? `Крок ${Math.min(l.done + 1, l.total)} з ${l.total}` : "—",
      ladder: l,
      stats: [
        { k: "Залишилось", v: uah(Math.max(l.target - l.bank, 0)) },
        { k: "Коефіцієнти", v: odds },
        { k: "Режим при програші", v: goal.ladderMode === "strict" ? "Жорсткий" : "М’який" },
        { k: "Ставок на день", v: perDay },
      ],
      next: {
        kicker: `Наступна ставка · крок ${l.done + 1}`,
        big: uah(l.stake),
        rows: [
          { k: "Коефіцієнт", v: odds },
          { k: "Після виграшу", v: `${uah(l.afterMin)} – ${uah(l.afterMax)}` },
        ],
        note: "На кожному кроці ставиться весь банк лесенки. Записи з коефіцієнтом поза діапазоном рахуються як відхилення.",
      },
    };
  }

  if (goal.type === "amount") {
    const cur = goal.currentAmount || 0;
    const target = goal.targetAmount || 0;
    const left = Math.max(target - cur, 0);
    return {
      goal,
      typeLabel,
      pct,
      cur: uah(cur),
      of: `із ${uah(target)}`,
      progressLabel: pct1(pct),
      stats: [
        { k: "Залишилось", v: uah(left) },
        { k: "Ставок на день", v: perDay },
        { k: "Створено", v: shortDate(goal.createdAt) },
      ],
      next: {
        kicker: "До цілі",
        big: uah(left),
        rows: [
          { k: "Виконано", v: pct1(pct) },
          { k: "Прибуток записів", v: signedUah(cur) },
        ],
        note: "Прогрес рахується за записами, прив’язаними до цієї цілі.",
      },
    };
  }

  if (goal.type === "roi") {
    const cur = goal.currentROI || 0;
    const target = goal.targetROI || 0;
    const left = Math.max(target - cur, 0);
    return {
      goal,
      typeLabel,
      pct,
      cur: pct1(cur),
      of: `ціль ${pct1(target)}`,
      progressLabel: pct1(pct),
      stats: [
        { k: "Залишилось", v: `+${pp(left)}` },
        { k: "Дедлайн", v: goal.deadline ? shortDate(goal.deadline) : "Без дедлайну" },
        { k: "Ставок на день", v: perDay },
      ],
      next: {
        kicker: "До цілі",
        big: `+${pp(left)}`,
        rows: [
          { k: "Поточний ROI", v: pct1(cur) },
          { k: "Сума ставок", v: uah(s.staked) },
        ],
        note: "ROI — прибуток прив’язаних записів, поділений на суму їхніх ставок.",
      },
    };
  }

  // winrate
  const cur = goal.currentWinRate || 0;
  const target = goal.targetWinRate || 0;
  const left = Math.max(target - cur, 0);
  let need = 0;
  if (s.settled > 0 && target < 100) {
    while ((s.wins + need) / (s.settled + need) * 100 < target && need < 1000) need++;
  }
  return {
    goal,
    typeLabel,
    pct,
    cur: pct1(cur),
    of: `ціль ${pct1(target)}`,
    progressLabel: pct1(pct),
    stats: [
      { k: "Залишилось", v: `+${pp(left)}` },
      { k: "Перемог", v: `${count(s.wins)} з ${count(s.settled)}` },
      { k: "Ставок на день", v: perDay },
    ],
    next: {
      kicker: "До цілі",
      big: `+${pp(left)}`,
      rows: [
        { k: "Перемог", v: `${count(s.wins)} з ${count(s.settled)}` },
        ...(need > 0
          ? [{ k: "Потрібно поспіль", v: `${need} ${plural(need, "перемога", "перемоги", "перемог")}` }]
          : []),
      ],
      note:
        need > 0
          ? `Ще ${need} ${plural(need, "виграна ставка", "виграні ставки", "виграних ставок")} поспіль — і відсоток перемог дійде до ${pct1(target)}.`
          : "Відсоток рахується лише за розрахованими записами, прив’язаними до цілі.",
    },
  };
}

/** Finished goals swap the "next" card for the outcome. */
export function finishedNext(goal: Goal, vm: GoalVm) {
  const ok = goal.status === "completed";
  return {
    kicker: "Результат",
    big: ok ? "Виконано" : "Не виконано",
    rows: [
      { k: "Завершено", v: shortDate(goal.completedAt) },
      { k: "Підсумок", v: `${vm.cur} ${vm.of}` },
    ],
    note: ok
      ? "Ціль досягнуто. Можна поставити наступну — з урахуванням цього досвіду."
      : "Ціль закрито без досягнення. Записи лишаються в журналі для аналізу.",
  };
}
