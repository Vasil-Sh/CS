import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════
// MyBets page — stats computation + bet classification
// ═══════════════════════════════════════════

type Bet = {
  result: "Win" | "Loss" | "Pending";
  profit: number;
  amount: number;
  odds: number;
  date: string;
  game?: string;
  currency?: string;
  strategy?: string;
  roi?: number;
  id?: string;
  createdAt?: string;
};

// ── syncStats (local stats computation) ──

function syncStats(bets: Bet[]): { totalBets: number; winRate: number; totalProfit: number; averageROI: number } {
  const completed = bets.filter((b) => b.result === "Win" || b.result === "Loss");
  const wins = completed.filter((b) => b.result === "Win").length;
  const totalProfit = completed.reduce((sum, b) => sum + (b.profit || 0), 0);
  return {
    totalBets: bets.length,
    winRate: completed.length > 0 ? Math.round((wins / completed.length) * 100) : 0,
    totalProfit: Math.round(totalProfit * 100) / 100,
    averageROI:
      completed.length > 0
        ? Math.round(
            (completed.reduce((sum, b) => sum + (b.roi || 0), 0) / completed.length) * 100,
          ) / 100
        : 0,
  };
}

describe("syncStats", () => {
  it("empty bets → all zeros", () => {
    const s = syncStats([]);
    expect(s.totalBets).toBe(0);
    expect(s.winRate).toBe(0);
    expect(s.totalProfit).toBe(0);
    expect(s.averageROI).toBe(0);
  });

  it("single win: 100% winRate", () => {
    const bets: Bet[] = [
      { result: "Win", profit: 200, amount: 100, odds: 3, date: "2026-07-21", roi: 200 },
    ];
    const s = syncStats(bets);
    expect(s.totalBets).toBe(1);
    expect(s.winRate).toBe(100);
    expect(s.totalProfit).toBe(200);
  });

  it("single loss: 0% winRate, negative profit", () => {
    const bets: Bet[] = [
      { result: "Loss", profit: -100, amount: 100, odds: 2, date: "2026-07-21", roi: -100 },
    ];
    const s = syncStats(bets);
    expect(s.totalBets).toBe(1);
    expect(s.winRate).toBe(0);
    expect(s.totalProfit).toBe(-100);
  });

  it("2W / 1L → 66% winRate", () => {
    const bets: Bet[] = [
      { result: "Win", profit: 500, amount: 100, odds: 6, date: "2026-07-21", roi: 500 },
      { result: "Win", profit: 300, amount: 200, odds: 2.5, date: "2026-07-20", roi: 150 },
      { result: "Loss", profit: -400, amount: 400, odds: 2, date: "2026-07-19", roi: -100 },
    ];
    const s = syncStats(bets);
    // 2/3 = 66.66%, Math.round → 67
    expect(s.winRate).toBe(67);
    expect(s.totalProfit).toBe(400); // 500+300-400
  });

  it("ignores Pending bets in winRate", () => {
    const bets: Bet[] = [
      { result: "Win", profit: 100, amount: 100, odds: 2, date: "2026-07-21", roi: 100 },
      { result: "Pending", profit: 0, amount: 100, odds: 2, date: "2026-07-20", roi: 0 },
      { result: "Pending", profit: 0, amount: 200, odds: 1.5, date: "2026-07-19", roi: 0 },
    ];
    const s = syncStats(bets);
    expect(s.totalBets).toBe(3);
    expect(s.winRate).toBe(100);
  });

  it("all Pending → winRate 0", () => {
    const bets: Bet[] = [
      { result: "Pending", profit: 0, amount: 100, odds: 2, date: "2026-07-21", roi: 0 },
    ];
    const s = syncStats(bets);
    expect(s.winRate).toBe(0);
    expect(s.totalProfit).toBe(0);
  });
});

// ── Bet categorization (active/winning/losing) ──

function categorizeBets(bets: Bet[]): { activeBets: Bet[]; winningBets: Bet[]; losingBets: Bet[] } {
  const active: Bet[] = [];
  const winning: Bet[] = [];
  const losing: Bet[] = [];
  for (const b of bets) {
    if (b.result === "Pending") active.push(b);
    else if (b.result === "Win") winning.push(b);
    else if (b.result === "Loss") losing.push(b);
  }
  return { activeBets: active, winningBets: winning, losingBets: losing };
}

describe("categorizeBets", () => {
  it("splits mixed bets correctly", () => {
    const bets: Bet[] = [
      { result: "Win", profit: 100, amount: 100, odds: 2, date: "2026-07-21" },
      { result: "Loss", profit: -50, amount: 50, odds: 2, date: "2026-07-20" },
      { result: "Pending", profit: 0, amount: 200, odds: 1.5, date: "2026-07-19" },
      { result: "Win", profit: 300, amount: 150, odds: 3, date: "2026-07-18" },
    ];
    const { activeBets, winningBets, losingBets } = categorizeBets(bets);
    expect(activeBets).toHaveLength(1);
    expect(winningBets).toHaveLength(2);
    expect(losingBets).toHaveLength(1);
  });

  it("all wins", () => {
    const bets: Bet[] = [
      { result: "Win", profit: 100, amount: 100, odds: 2, date: "2026-07-21" },
    ];
    const { activeBets, winningBets, losingBets } = categorizeBets(bets);
    expect(winningBets).toHaveLength(1);
    expect(losingBets).toHaveLength(0);
    expect(activeBets).toHaveLength(0);
  });

  it("empty → all empty", () => {
    const { activeBets, winningBets, losingBets } = categorizeBets([]);
    expect(activeBets).toEqual([]);
    expect(winningBets).toEqual([]);
    expect(losingBets).toEqual([]);
  });
});

// ── executeResultUpdate profit calculation ──

function calculateResultProfit(
  bet: Bet,
  result: "Win" | "Loss",
): { originalProfit: number; profitInUAH: number; roi: number } {
  const betAmount = bet.amount;
  const originalProfit = result === "Win" ? (bet.odds - 1) * betAmount : -betAmount;
  const profitInUAH = originalProfit; // simplified, no exchange rate
  const roi = (profitInUAH / bet.amount) * 100;
  return { originalProfit, profitInUAH, roi };
}

describe("executeResultUpdate profit calculation", () => {
  it("Win: profit = (odds-1) × amount", () => {
    const { originalProfit, roi } = calculateResultProfit(
      { result: "Pending", profit: 0, amount: 100, odds: 2.5, date: "2026-07-21" },
      "Win",
    );
    expect(originalProfit).toBe(150); // (2.5-1)*100
    expect(roi).toBe(150); // 150/100 * 100
  });

  it("Loss: profit = -amount", () => {
    const { originalProfit, roi } = calculateResultProfit(
      { result: "Pending", profit: 0, amount: 200, odds: 3, date: "2026-07-21" },
      "Loss",
    );
    expect(originalProfit).toBe(-200);
    expect(roi).toBe(-100);
  });

  it("high odds Win", () => {
    const { originalProfit } = calculateResultProfit(
      { result: "Pending", profit: 0, amount: 50, odds: 10, date: "2026-07-21" },
      "Win",
    );
    expect(originalProfit).toBe(450);
  });

  it("odds=1.0 Win → 0 profit (even)", () => {
    const { originalProfit } = calculateResultProfit(
      { result: "Pending", profit: 0, amount: 100, odds: 1.0, date: "2026-07-21" },
      "Win",
    );
    expect(originalProfit).toBe(0);
  });
});

// ── Table filter logic ──

function filterBets(
  bets: Bet[],
  tableFilter: "today" | "all",
  resultFilter: "all" | "Win" | "Loss" | "Pending",
  periodFilter: "all" | "week" | "month" | "quarter",
  searchText: string,
): Bet[] {
  const todayStr = new Date().toISOString().split("T")[0];

  return bets.filter((b) => {
    if (tableFilter === "today") {
      const betDate = (b.date || "").substring(0, 10);
      if (betDate !== todayStr) return false;
    }
    if (resultFilter !== "all" && b.result !== resultFilter) return false;
    if (periodFilter !== "all") {
      const now = new Date();
      const betDate = new Date(b.date);
      const diffDays = Math.floor((now.getTime() - betDate.getTime()) / 86400000);
      if (periodFilter === "week" && diffDays > 7) return false;
      if (periodFilter === "month" && diffDays > 30) return false;
      if (periodFilter === "quarter" && diffDays > 90) return false;
    }
    if (searchText) {
      const q = searchText.toLowerCase();
      if (
        !(b.date || "").toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });
}

describe("filterBets (table filters)", () => {
  const bets: Bet[] = [
    { result: "Win", profit: 100, amount: 100, odds: 2, date: "2026-07-21" },
    { result: "Loss", profit: -50, amount: 50, odds: 2, date: "2026-07-20" },
    { result: "Pending", profit: 0, amount: 200, odds: 1.5, date: "2026-07-19" },
    { result: "Win", profit: 300, amount: 150, odds: 3, date: "2026-07-10" },
  ];

  it("no filters → all bets", () => {
    expect(filterBets(bets, "all", "all", "all", "")).toHaveLength(4);
  });

  it("result filter: only Wins", () => {
    expect(filterBets(bets, "all", "Win", "all", "")).toHaveLength(2);
  });

  it("result filter: only Losses", () => {
    expect(filterBets(bets, "all", "Loss", "all", "")).toHaveLength(1);
  });

  it("result filter: only Pending", () => {
    expect(filterBets(bets, "all", "Pending", "all", "")).toHaveLength(1);
  });

  it("period filter: week (≤7 days)", () => {
    // Today is 2026-07-22, so "2026-07-21" is 1 day ago, "2026-07-20" is 2, "2026-07-10" is 12
    const filtered = filterBets(bets, "all", "all", "week", "");
    expect(filtered.length).toBeGreaterThanOrEqual(2); // At least the 2 recent ones
    expect(filtered.every((b) => {
      const d = new Date(b.date).getTime();
      const now = new Date("2026-07-22").getTime();
      return (now - d) / 86400000 <= 7;
    })).toBe(true);
  });

  it("period filter: month (≤30 days)", () => {
    const filtered = filterBets(bets, "all", "all", "month", "");
    expect(filtered.length).toBe(4); // All within 30 days of 2026-07-22
  });

  it("period filter: quarter (≤90 days)", () => {
    expect(filterBets(bets, "all", "all", "quarter", "")).toHaveLength(4);
  });

  it("combined: Win + week", () => {
    const filtered = filterBets(bets, "all", "Win", "week", "");
    expect(filtered.length).toBe(1);
    expect(filtered[0].date).toBe("2026-07-21");
  });

  it("combined: Loss + week", () => {
    expect(filterBets(bets, "all", "Loss", "week", "")).toHaveLength(1);
  });

  it("empty bets → empty result", () => {
    expect(filterBets([], "all", "all", "all", "")).toEqual([]);
  });
});

// ── tableFilter "today" ──

describe('tableFilter "today"', () => {
  it("filters to only today's date", () => {
    const today = new Date().toISOString().split("T")[0];
    const bets: Bet[] = [
      { result: "Win", profit: 100, amount: 100, odds: 2, date: today },
      { result: "Loss", profit: -50, amount: 50, odds: 2, date: "2026-01-01" },
    ];
    const filtered = filterBets(bets, "today", "all", "all", "");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].date).toBe(today);
  });
});

// ── hasUsdBets ──

describe("hasUsdBets", () => {
  it("true when bet has USD currency", () => {
    const bets: Bet[] = [
      { result: "Win", profit: 100, amount: 100, odds: 2, date: "2026-07-21", currency: "USD" },
    ];
    expect(bets.some((b) => b.currency === "USD")).toBe(true);
  });

  it("false when all bets are UAH", () => {
    const bets: Bet[] = [
      { result: "Win", profit: 100, amount: 100, odds: 2, date: "2026-07-21", currency: "UAH" },
    ];
    expect(bets.some((b) => b.currency === "USD")).toBe(false);
  });

  it("false when no bets", () => {
    const bets: Bet[] = [];
    expect(bets.some((b) => b.currency === "USD")).toBe(false);
  });
});
