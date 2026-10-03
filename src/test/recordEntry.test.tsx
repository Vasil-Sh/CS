import { describe, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { recordHeaderStats } from "@/components/mybets/RecordPageHeader";
import RecordTeamNotes from "@/components/betting-form/RecordTeamNotes";
import type { Bet } from "@/types/betting";

afterEach(cleanup);
const bet = (fields: Partial<Bet>): Bet => ({
  match: "A vs B",
  betType: "Winner",
  odds: 2,
  amount: 100,
  date: "2026-10-03",
  result: "Pending",
  ...fields,
});

describe("Record header statistics", () => {
  it("separates pending stakes from settled net profit", () => {
    const stats = recordHeaderStats(
      [
        bet({}),
        bet({ result: "Win", profit: 50 }),
        bet({ result: "Loss", profit: -20 }),
        bet({ currency: "USD", originalAmount: 10 }),
      ],
      "UAH",
    );
    expect(stats).toEqual({
      activeAmount: 100,
      activeCount: 1,
      profit: 30,
      missingRates: false,
    });
  });
  it("uses original USD amounts and stored exchange rates, never adds UAH as USD", () => {
    const stats = recordHeaderStats(
      [
        bet({ currency: "USD", amount: 450, originalAmount: 10 }),
        bet({ currency: "USD", amount: 900, exchangeRate: 45 }),
        bet({ currency: "USD", result: "Win", profit: 225, exchangeRate: 45 }),
        bet({
          currency: "USD",
          result: "Loss",
          profit: -450,
          originalProfit: -10,
        }),
        bet({ result: "Win", profit: 999 }),
      ],
      "USD",
    );
    expect(stats).toEqual({
      activeAmount: 30,
      activeCount: 2,
      profit: -5,
      missingRates: false,
    });
  });
  it("flags legacy USD records without usable conversion metadata", () => {
    const stats = recordHeaderStats([bet({ currency: "USD" })], "USD");
    expect(stats.activeAmount).toBe(0);
    expect(stats.missingRates).toBe(true);
  });
  it("handles an empty journal", () => {
    expect(recordHeaderStats([], "UAH")).toEqual({
      activeAmount: 0,
      activeCount: 0,
      profit: 0,
      missingRates: false,
    });
  });
});
describe("Team notes", () => {
  it("shows both teams and their full real comments without collapsing them", () => {
    render(
      <RecordTeamNotes
        selection="G2 Esports"
        teams={[
          {
            name: "G2 Esports",
            game: "CS",
            status: "Стабільні",
            notes: "Не ставити на загальну перемогу.",
          },
          {
            name: "Natus Vincere",
            game: "CS",
            status: "БАН",
            notes: "Перевірити склад перед матчем.",
          },
        ]}
      />,
    );
    expect(screen.getByText("Не ставити на загальну перемогу.")).toBeVisible();
    expect(screen.getByText("Перевірити склад перед матчем.")).toBeVisible();
    expect(screen.getByText("Ваш вибір")).toBeVisible();
    expect(screen.getByText("БАН")).toBeVisible();
  });
  it("never calls unmatched teams safe", () => {
    render(<RecordTeamNotes selection="" teams={[]} />);
    expect(
      screen.getByText(/Відсутність приміток не означає відсутність ризику/),
    ).toBeVisible();
    expect(screen.queryByText("Усі команди безпечні")).not.toBeInTheDocument();
  });
});
