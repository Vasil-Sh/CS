import { describe, it, expect, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import BetShareCard, {
  shareMoney,
  shareResult,
  shareDate,
} from "@/components/BetShareCard";
import type { Bet } from "@/types/betting";

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    disconnect() {}
  },
);
afterEach(cleanup);
const bet: Bet = {
  match: "ex-Eternal Fire Academy vs OldMix",
  betType: "Match Winner - ex-Eternal Fire Academy",
  odds: 2,
  amount: 200,
  date: "2026-10-02",
  result: "Loss",
  profit: -200,
  tournament: "UNITED21 SEASON 56 — GROUP C",
};
describe("Share card", () => {
  it("renders actual tournament, selection and loss", () => {
    render(<BetShareCard bet={bet} />);
    expect(screen.getByText("UNITED21 SEASON 56")).toBeTruthy();
    expect(screen.getByText("GROUP C")).toBeTruthy();
    expect(screen.getByText("−200 ₴")).toBeTruthy();
    expect(screen.getByText("Програш")).toBeTruthy();
    expect(screen.getAllByText("ex-Eternal Fire Academy")).toHaveLength(2);
  });
  it("does not invent a time for date-only records", () => {
    expect(shareDate("2026-10-02")).toEqual({ date: "02.10.2026", time: "" });
  });
  it("shows a real supplied time", () =>
    expect(shareDate("2026-10-02T13:30:00").time).toBe("13:30"));
  it("does not treat pending as settled", () =>
    expect(shareResult({ ...bet, result: "Pending" })).toBeNull());
  it("preserves original zero values", () =>
    expect(shareResult({ ...bet, originalProfit: 0 })).toBe(0));
  it("converts USD profit only with an exchange rate", () => {
    expect(
      shareResult({ ...bet, currency: "USD", profit: 400, exchangeRate: 40 }),
    ).toBe(10);
    expect(shareResult({ ...bet, currency: "USD", profit: 400 })).toBeNull();
  });
  it("formats winnings and losses in original currency", () => {
    expect(shareMoney(33, "USD", true)).toBe("+33 $");
    expect(shareMoney(-200)).toBe("−200 ₴");
  });
  it("includes all express events in exported content", () => {
    render(
      <BetShareCard
        bet={{
          ...bet,
          format: "2x",
          betType:
            "Експрес | 1. A vs B | Winner: A @1.2 • 2. C vs D | Winner: D @1.5",
        }}
      />,
    );
    expect(screen.getByText(/A vs B/)).toBeTruthy();
    expect(screen.getByText(/C vs D/)).toBeTruthy();
  });
});
