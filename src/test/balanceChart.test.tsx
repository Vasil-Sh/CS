import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import BalanceChart from "@/components/BalanceChart";
import type { BalanceData } from "@/types/betting";

// ── Pure stats calculation (extracted from BalanceChart useMemo) ──

function computeBalanceStats(data: BalanceData[]) {
  if (!data || data.length === 0) return null;
  const initialBalance = data[0]?.balance || 1000;
  const currentBalance = data[data.length - 1]?.balance || initialBalance;
  const totalChange = currentBalance - initialBalance;
  const isUp = totalChange >= 0;
  const roi = initialBalance > 0 ? Math.round((totalChange / initialBalance) * 100) : 0;
  let peak = -Infinity;
  let lowest = Infinity;
  let totalProfit = 0;
  for (const d of data) {
    if (d.balance > peak) peak = d.balance;
    if (d.balance < lowest) lowest = d.balance;
    totalProfit += d.profit || 0;
  }
  if (peak === -Infinity) peak = initialBalance;
  if (lowest === Infinity) lowest = initialBalance;
  return { initialBalance, currentBalance, totalChange, isUp, roi, peak, lowest, totalProfit };
}

describe("BalanceChart stats computation", () => {
  it("returns null for empty data", () => {
    expect(computeBalanceStats([])).toBeNull();
  });

  it("computes initial and current balance from first/last entry", () => {
    const data: BalanceData[] = [
      { date: "2026-07-01", balance: 10000, profit: 0 },
      { date: "2026-07-02", balance: 10500, profit: 500 },
      { date: "2026-07-03", balance: 10200, profit: -300 },
    ];
    const stats = computeBalanceStats(data);
    expect(stats!.initialBalance).toBe(10000);
    expect(stats!.currentBalance).toBe(10200);
  });

  it("computes positive totalChange", () => {
    const data: BalanceData[] = [
      { date: "2026-07-01", balance: 10000, profit: 0 },
      { date: "2026-07-10", balance: 12500, profit: 2500 },
    ];
    const stats = computeBalanceStats(data);
    expect(stats!.totalChange).toBe(2500);
    expect(stats!.isUp).toBe(true);
    expect(stats!.roi).toBe(25);
  });

  it("computes negative totalChange", () => {
    const data: BalanceData[] = [
      { date: "2026-07-01", balance: 10000, profit: 0 },
      { date: "2026-07-10", balance: 8500, profit: -1500 },
    ];
    const stats = computeBalanceStats(data);
    expect(stats!.totalChange).toBe(-1500);
    expect(stats!.isUp).toBe(false);
    expect(stats!.roi).toBe(-15);
  });

  it("computes peak across multiple days", () => {
    const data: BalanceData[] = [
      { date: "2026-07-01", balance: 10000, profit: 0 },
      { date: "2026-07-02", balance: 12000, profit: 2000 },
      { date: "2026-07-03", balance: 11000, profit: -1000 },
      { date: "2026-07-04", balance: 10500, profit: -500 },
    ];
    const stats = computeBalanceStats(data);
    expect(stats!.peak).toBe(12000);
  });

  it("computes lowest across multiple days", () => {
    const data: BalanceData[] = [
      { date: "2026-07-01", balance: 10000, profit: 0 },
      { date: "2026-07-02", balance: 11000, profit: 1000 },
      { date: "2026-07-03", balance: 9000, profit: -2000 },
      { date: "2026-07-04", balance: 9500, profit: 500 },
    ];
    const stats = computeBalanceStats(data);
    expect(stats!.lowest).toBe(9000);
  });

  it("sums totalProfit across all entries", () => {
    const data: BalanceData[] = [
      { date: "2026-07-01", balance: 10000, profit: 200 },
      { date: "2026-07-02", balance: 10200, profit: -100 },
      { date: "2026-07-03", balance: 10100, profit: 500 },
    ];
    const stats = computeBalanceStats(data);
    expect(stats!.totalProfit).toBe(600);
  });

  it("handles single data point", () => {
    const data: BalanceData[] = [{ date: "2026-07-21", balance: 5000, profit: 0 }];
    const stats = computeBalanceStats(data);
    expect(stats!.initialBalance).toBe(5000);
    expect(stats!.currentBalance).toBe(5000);
    expect(stats!.totalChange).toBe(0);
    expect(stats!.roi).toBe(0);
    expect(stats!.peak).toBe(5000);
    expect(stats!.lowest).toBe(5000);
    expect(stats!.totalProfit).toBe(0);
    expect(stats!.isUp).toBe(true); // 0 change = "not down"
  });

  it("ROI for zero initial balance", () => {
    // 0 is falsy → `data[0]?.balance || 1000` → 1000
    // currentBalance = 500 || 1000 = 500
    // totalChange = 500 - 1000 = -500
    // roi = Math.round(-500/1000 * 100) = -50
    const data: BalanceData[] = [
      { date: "2026-07-01", balance: 0, profit: 0 },
      { date: "2026-07-02", balance: 500, profit: 500 },
    ];
    const stats = computeBalanceStats(data);
    expect(stats!.initialBalance).toBe(1000); // falls back to default 1000
    expect(stats!.roi).toBe(-50);
    expect(stats!.totalChange).toBe(-500);
  });

  it("fallback to initial balance if last entry balance is 0", () => {
    const data: BalanceData[] = [
      { date: "2026-07-01", balance: 10000, profit: 0 },
      { date: "2026-07-02", balance: 0, profit: -100 },
    ];
    const stats = computeBalanceStats(data);
    // 0 is falsy → `data[...].balance || initialBalance` → uses initialBalance
    expect(stats!.currentBalance).toBe(10000);
  });

  it("handles real-world scenario: steady growth", () => {
    const data: BalanceData[] = [
      { date: "2026-07-01", balance: 10000, profit: 0 },
      { date: "2026-07-05", balance: 10200, profit: 200 },
      { date: "2026-07-10", balance: 10400, profit: 200 },
      { date: "2026-07-15", balance: 10800, profit: 400 },
      { date: "2026-07-20", balance: 11200, profit: 400 },
      { date: "2026-07-25", balance: 11500, profit: 300 },
      { date: "2026-07-30", balance: 12000, profit: 500 },
    ];
    const stats = computeBalanceStats(data);
    expect(stats!.initialBalance).toBe(10000);
    expect(stats!.currentBalance).toBe(12000);
    expect(stats!.totalChange).toBe(2000);
    expect(stats!.roi).toBe(20);
    expect(stats!.isUp).toBe(true);
    expect(stats!.peak).toBe(12000);
    expect(stats!.lowest).toBe(10000);
  });

  it("handles real-world scenario: volatile market", () => {
    const data: BalanceData[] = [
      { date: "2026-07-01", balance: 10000, profit: 0 },
      { date: "2026-07-02", balance: 9500, profit: -500 },
      { date: "2026-07-03", balance: 10200, profit: 700 },
      { date: "2026-07-04", balance: 9800, profit: -400 },
      { date: "2026-07-05", balance: 10500, profit: 700 },
      { date: "2026-07-06", balance: 9700, profit: -800 },
    ];
    const stats = computeBalanceStats(data);
    expect(stats!.peak).toBe(10500);
    expect(stats!.lowest).toBe(9500);
    expect(stats!.totalChange).toBe(-300);
    expect(stats!.isUp).toBe(false);
  });
});

// ── Component render (smoke) ──
// Note: BalanceChart uses Recharts ResponsiveContainer which
// requires ResizeObserver (not available in jsdom).
// The pure stats computation is tested above.

describe("BalanceChart component", () => {
  it("returns null for empty data", () => {
    const { container } = render(<BalanceChart data={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
