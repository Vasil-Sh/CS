import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import RecordPageHeader from "@/components/mybets/RecordPageHeader";
import type { Bet } from "@/types/betting";

afterEach(cleanup);
const bets: Bet[] = [
  {
    id: "1",
    match: "A vs B",
    betType: "Winner",
    date: "2026-10-03",
    odds: 2,
    amount: 200,
    currency: "UAH",
    result: "Win",
    profit: 200,
  },
  {
    id: "2",
    match: "C vs D",
    betType: "Winner",
    date: "2026-10-03",
    odds: 1.33,
    amount: 4000,
    currency: "USD",
    originalAmount: 100,
    originalProfit: 33,
    exchangeRate: 40,
    result: "Win",
    profit: 1320,
  },
  {
    id: "3",
    match: "E vs F",
    betType: "Winner",
    date: "2026-10-03",
    odds: 2,
    amount: 100,
    currency: "UAH",
    result: "Pending",
  },
];
function mount(currency: "UAH" | "USD" = "UAH") {
  const onCurrencyChange = vi.fn();
  const result = render(
    <RecordPageHeader
      variant="journal"
      title="Журнал"
      subtitle="Ваші рішення, результати та висновки."
      bets={bets}
      bank={378.65}
      currency={currency}
      onCurrencyChange={onCurrencyChange}
      onEditBank={vi.fn()}
      hideEditBank
    />,
  );
  return { ...result, onCurrencyChange };
}
function metric(label: string) {
  return screen.getByText(label).closest(".record-metric")!;
}
describe("journal header design", () => {
  it("renders six cards, journal heading and currency switch", () => {
    const h = mount();
    expect(screen.getByRole("heading", { name: "Журнал" })).toBeVisible();
    expect(screen.getByText("RECORD JOURNAL")).toBeVisible();
    expect(h.container.querySelectorAll(".record-metric")).toHaveLength(6);
    expect(
      screen.queryByRole("button", { name: "Редагувати банк" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Додати запис" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "$ USD" }));
    expect(h.onCurrencyChange).toHaveBeenCalledWith("USD");
  });
  it("counts all currencies but never adds dollars to hryvnia totals", () => {
    mount();
    expect(metric("Всього записів").querySelector("strong")).toHaveTextContent(
      "3",
    );
    expect(metric("Виграші").querySelector("strong")).toHaveTextContent("2");
    expect(
      metric("Чистий результат").querySelector("strong"),
    ).toHaveTextContent("+200 ₴");
    expect(
      metric("В активних записах").querySelector("strong"),
    ).toHaveTextContent("100 ₴");
  });
  it("uses original dollar profit while retaining overall record counts", () => {
    mount("USD");
    expect(
      metric("Чистий результат").querySelector("strong"),
    ).toHaveTextContent("+33 $");
    expect(metric("Всього записів").querySelector("strong")).toHaveTextContent(
      "3",
    );
    expect(
      metric("В активних записах").querySelector("strong"),
    ).toHaveTextContent("0 $");
  });
});
