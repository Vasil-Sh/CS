import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
  waitFor,
  act,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import JournalTable from "@/components/mybets/JournalTable";
import {
  journalProfit,
  journalAmount,
  csvCell,
} from "@/components/mybets/journalModel";
import type { Bet } from "@/types/betting";

vi.mock("@/lib/apiClient", () => ({
  api: { get: vi.fn().mockResolvedValue([{ id: "goal", name: "Моя ціль" }]) },
}));
vi.mock("@/lib/userDataService", () => ({
  UserDataService: { getUserData: () => [] },
}));
vi.mock("@/components/mybets/CompactBetModal", () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">Стислий список результатів</div> : null,
}));

const bet: Bet = {
  id: "1",
  match: "Falcons vs TYLOO",
  team1: "Falcons",
  team2: "TYLOO",
  betType: "Match Winner",
  selection: "Falcons",
  date: "2026-10-03",
  amount: 200,
  odds: 2,
  result: "Win",
  profit: 200,
  goalId: "goal",
  game: "CS2",
  format: "BO3",
};
const legs = [
  ["GamerLegion vs MOUZ", "GamerLegion", "1.14"],
  ["Falcons Esports vs The MongolZ", "Falcons Esports", "1.13"],
  ["FaZe Clan vs Vitality", "Vitality", "1.10"],
  ["B8 vs Team Spirit", "Team Spirit", "1.10"],
  ["TEAM VISION vs BoomBoys", "TEAM VISION", "1.10"],
];
const express: Bet = {
  ...bet,
  id: "express",
  match: "Експрес 5x",
  team1: undefined,
  team2: undefined,
  format: "5x",
  amount: 250,
  odds: 1.72,
  profit: 178.65,
  selection: undefined,
  betType:
    "Експрес 5x | " +
    legs
      .map(
        ([match, pick, odds], i) =>
          `${i + 1}. ${match} | Handicap +1.5: ${pick} @${odds}`,
      )
      .join(" • "),
};
const props = () => ({
  bets: [bet],
  activeBets: [],
  currentUser: "test",
  isAdmin: false,
  tableFilter: "all" as const,
  onTableFilterChange: vi.fn(),
  showAdvancedFilters: false,
  onToggleAdvancedFilters: vi.fn(),
  resultFilter: "all" as const,
  onResultFilterChange: vi.fn(),
  periodFilter: "all" as const,
  onPeriodFilterChange: vi.fn(),
  sortBy: "date" as const,
  onSortByChange: vi.fn(),
  sortOrder: "desc" as const,
  currentPage: 1,
  onPageChange: vi.fn(),
  searchText: "",
  onSearchTextChange: vi.fn(),
  onShareBet: vi.fn(),
  onBetDetails: vi.fn(),
  onExpressDetails: vi.fn(),
  onUpdateResult: vi.fn(),
  onDeleteBet: vi.fn(),
  onNavigateToAdd: vi.fn(),
});
function mount(p = props()) {
  return render(
    <MemoryRouter>
      <JournalTable {...p} />
    </MemoryRouter>,
  );
}
function openDetails(match: string) {
  fireEvent.click(screen.getByRole("button", { name: `Деталі: ${match}` }));
}
async function openMenu(name: string) {
  fireEvent.keyDown(screen.getByRole("button", { name }), { key: "ArrowDown" });
  return screen.findByRole("menu");
}
afterEach(async () => {
  await act(async () => {});
  cleanup();
  vi.clearAllMocks();
});

describe("journal money and export", () => {
  it("converts stored UAH profit to original USD once", () =>
    expect(
      journalProfit({
        ...bet,
        currency: "USD",
        profit: 1320,
        exchangeRate: 40,
        originalProfit: 33,
      }),
    ).toBe(33));
  it("uses original profit without exchange rate", () =>
    expect(
      journalProfit({
        ...bet,
        currency: "USD",
        profit: 1320,
        originalProfit: 33,
      }),
    ).toBe(33));
  it("does not label UAH as dollars when data is missing", () =>
    expect(journalProfit({ ...bet, currency: "USD" })).toBeNull());
  it("converts USD stake from base amount", () =>
    expect(
      journalAmount({
        ...bet,
        currency: "USD",
        amount: 4000,
        exchangeRate: 40,
      }),
    ).toBe(100));
  it("preserves zero original amount", () =>
    expect(journalAmount({ ...bet, originalAmount: 0 })).toBe(0));
  it("never shows realized profit for pending records", () =>
    expect(journalProfit({ ...bet, result: "Pending" })).toBeNull());
  it("escapes formulas and quotes in CSV", () => {
    expect(csvCell("=CMD()")).toBe('"\'=CMD()"');
    expect(csvCell('a"b')).toBe('"a""b"');
  });
});

describe("full-width journal", () => {
  it("combines match and selection without an empty sidebar", async () => {
    const { container } = mount();
    for (const label of [
      "Дата",
      "Матч і вибір",
      "Сума",
      "Коеф.",
      "Профіт",
      "Ціль",
      "Статус",
      "Дії",
    ])
      expect(
        screen.getByRole("columnheader", {
          name: new RegExp(label.replace(".", "\\.")),
        }),
      ).toBeVisible();
    expect(
      screen.queryByRole("columnheader", { name: "Ваш вибір" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Falcons", { selector: ".journal-selection span" }),
    ).toBeVisible();
    expect(container.querySelector("aside")).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Деталі запису" }),
    ).not.toBeInTheDocument();
    await screen.findByText("Моя ціль");
  });
  it("toggles details with the same disclosure and restores focus on close", () => {
    mount();
    const toggle = screen.getByRole("button", { name: `Деталі: ${bet.match}` });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("region", { name: "Деталі запису" }),
    ).toHaveAttribute("id", toggle.getAttribute("aria-controls"));
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("button", { name: "Закрити деталі" }));
    expect(toggle).toHaveFocus();
    expect(
      screen.queryByRole("region", { name: "Деталі запису" }),
    ).not.toBeInTheDocument();
  });
  it("expands five structured legs directly after the parent row, without financial duplicates", () => {
    mount({ ...props(), bets: [express] });
    openDetails(express.match);
    const details = screen.getByRole("region", { name: "Події експресу" });
    expect(within(details).getAllByRole("row")).toHaveLength(6);
    expect(within(details).getByText("GamerLegion — MOUZ")).toBeVisible();
    expect(within(details).getByText("TEAM VISION — BoomBoys")).toBeVisible();
    expect(within(details).getAllByText("1.10")).toHaveLength(3);
    expect(within(details).getAllByText(/Фора \+1.5/)).toHaveLength(5);
    expect(within(details).queryByText(/250/)).not.toBeInTheDocument();
    expect(within(details).queryByText(/178,65/)).not.toBeInTheDocument();
    expect(details.closest("tr")?.previousElementSibling).toHaveClass(
      "journal-record-row",
      "is-selected",
    );
    expect(details.closest("td")).toHaveAttribute("colspan", "8");
  });
  it("keeps sharing and full express details accessible", () => {
    const p = { ...props(), bets: [express] };
    mount(p);
    fireEvent.click(
      screen.getByRole("button", { name: `Поділитися: ${express.match}` }),
    );
    expect(p.onShareBet).toHaveBeenCalledWith(express);
    expect(
      screen.queryByRole("region", { name: "Події експресу" }),
    ).not.toBeInTheDocument();
    openDetails(express.match);
    fireEvent.click(screen.getByRole("button", { name: /Повні деталі/ }));
    expect(p.onExpressDetails).toHaveBeenCalledWith(express);
  });
  it("keeps only one row open and clears details when filtering it out", async () => {
    const p = { ...props(), bets: [bet, express] };
    const result = mount(p);
    openDetails(bet.match);
    openDetails(express.match);
    expect(
      screen.queryByRole("heading", { name: "Деталі запису" }),
    ).not.toBeInTheDocument();
    result.rerender(
      <MemoryRouter>
        <JournalTable {...p} searchText="TYLOO" />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: "Події експресу" }),
      ).not.toBeInTheDocument(),
    );
    result.rerender(
      <MemoryRouter>
        <JournalTable {...p} />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("button", { name: `Деталі: ${express.match}` }),
    ).toHaveAttribute("aria-expanded", "false");
  });
  it("shows strategy and saved notes without rewriting records", () => {
    mount({
      ...props(),
      bets: [
        {
          ...bet,
          strategy: "Обережна стратегія",
          notes: "Перевірити склад\nДруга нотатка",
          matchUrl: "https://example.com/match",
        },
      ],
    });
    openDetails(bet.match);
    const details = screen.getByRole("region", { name: "Деталі запису" });
    expect(within(details).getByText("Обережна стратегія")).toBeVisible();
    expect(within(details).getByText(/Перевірити склад/)).toBeVisible();
    expect(
      within(details).getByRole("link", { name: /Відкрити матч/ }),
    ).toHaveAttribute("rel", "noopener noreferrer");
  });
  it("does not render unsafe match URLs", () => {
    mount({ ...props(), bets: [{ ...bet, matchUrl: "javascript:alert(1)" }] });
    openDetails(bet.match);
    expect(
      screen.queryByRole("link", { name: /Відкрити матч/ }),
    ).not.toBeInTheDocument();
  });
  it("offers inline resolution only for pending records", () => {
    const p = { ...props(), bets: [{ ...bet, result: "Pending" as const }] };
    mount(p);
    openDetails(bet.match);
    fireEvent.click(screen.getByRole("button", { name: "Позначити виграш" }));
    fireEvent.click(screen.getByRole("button", { name: "Позначити програш" }));
    expect(p.onUpdateResult).toHaveBeenCalledWith(p.bets[0], "Win");
    expect(p.onUpdateResult).toHaveBeenCalledWith(p.bets[0], "Loss");
    expect(screen.queryByText("+200 ₴")).not.toBeInTheDocument();
  });
  it("places Telegram and deletion in the row menu", async () => {
    const p = props();
    mount(p);
    let menu = await openMenu(`Дії: ${bet.match}`);
    fireEvent.click(
      within(menu).getByRole("menuitem", { name: "Текст для Telegram" }),
    );
    expect(p.onBetDetails).toHaveBeenCalledWith(bet);
    expect(
      screen.queryByRole("region", { name: "Деталі запису" }),
    ).not.toBeInTheDocument();
    menu = await openMenu(`Дії: ${bet.match}`);
    expect(
      within(menu).queryByText("Позначити виграш"),
    ).not.toBeInTheDocument();
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Видалити" }));
    expect(p.onDeleteBet).toHaveBeenCalledWith(bet);
    expect(
      screen.queryByRole("region", { name: "Деталі запису" }),
    ).not.toBeInTheDocument();
  });
  it("hides columns and adjusts the expanded row span", async () => {
    mount({ ...props(), bets: [express] });
    openDetails(express.match);
    const menu = await openMenu("Колонки");
    fireEvent.click(
      within(menu).getByRole("menuitemcheckbox", { name: "Ціль" }),
    );
    expect(
      within(menu).getByRole("menuitemcheckbox", { name: "Матч і вибір" }),
    ).toHaveAttribute("data-disabled");
    expect(
      within(menu).getByRole("menuitem", { name: "Експорт CSV" }),
    ).toBeVisible();
    fireEvent.keyDown(menu, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("columnheader", { name: "Ціль" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Події експресу" }).closest("td"),
    ).toHaveAttribute("colspan", "7");
  });
  it("handles legacy express data without inventing odds", () => {
    mount({
      ...props(),
      bets: [
        { ...express, betType: "Експрес 5x | Подія без структурованих даних" },
      ],
    });
    openDetails(express.match);
    const details = screen.getByRole("region", { name: "Події експресу" });
    expect(
      within(details).getByText("Подія без структурованих даних"),
    ).toBeVisible();
    expect(within(details).getByText("—")).toBeVisible();
  });
  it("handles missing events with an honest empty message", () => {
    mount({ ...props(), bets: [{ ...express, betType: "Експрес 5x" }] });
    openDetails(express.match);
    expect(screen.getByText(/Події цього експресу не збережені/)).toBeVisible();
    expect(
      screen.queryByRole("table", { name: "Події вибраного експресу" }),
    ).not.toBeInTheDocument();
  });
  it("shows each record's original currency without summing currencies", () => {
    mount({
      ...props(),
      bets: [
        bet,
        {
          ...bet,
          id: "usd",
          match: "Team Spirit vs ShindeN",
          currency: "USD",
          amount: 4000,
          originalAmount: 100,
          exchangeRate: 40,
          profit: 1320,
        },
      ],
    });
    expect(screen.getByText("100 $")).toBeVisible();
    expect(screen.getByText("+33 $")).toBeVisible();
    expect(screen.getByText("+200 ₴")).toBeVisible();
  });
  it("keeps search, sorting, status filters and compact summary controls", () => {
    const p = props();
    mount(p);
    fireEvent.change(screen.getByRole("textbox", { name: "Пошук записів" }), {
      target: { value: "Falcons" },
    });
    expect(p.onSearchTextChange).toHaveBeenCalledWith("Falcons");
    fireEvent.click(screen.getByRole("button", { name: /Коеф\./ }));
    expect(p.onSortByChange).toHaveBeenCalledWith("odds");
    fireEvent.click(screen.getByRole("button", { name: /Очікують/ }));
    expect(p.onResultFilterChange).toHaveBeenCalledWith("Pending");
    fireEvent.click(screen.getByRole("button", { name: "Стислий список" }));
    expect(screen.getByRole("dialog")).toBeVisible();
  });
  it("filters records by currency and category", () => {
    mount({ ...props(), bets: [bet, express], showAdvancedFilters: true });
    fireEvent.change(screen.getByRole("combobox", { name: "Категорія" }), {
      target: { value: "express" },
    });
    expect(
      screen.queryByRole("button", { name: `Деталі: ${bet.match}` }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Валюта" }), {
      target: { value: "USD" },
    });
    expect(screen.getByText("Нічого не знайдено")).toBeVisible();
  });
  it("paginates parent records without counting expanded legs", () => {
    const p = {
      ...props(),
      bets: Array.from({ length: 21 }, (_, i) => ({
        ...express,
        id: String(i),
        match: `Експрес ${i}`,
      })),
    };
    mount(p);
    expect(screen.getAllByRole("button", { name: /^Деталі:/ })).toHaveLength(
      20,
    );
    expect(screen.getByText("1–20 із 21 записів")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Наступна сторінка" }));
    expect(p.onPageChange).toHaveBeenCalledWith(2);
  });
  it("shows useful empty and search states", () => {
    const p = props();
    const result = mount({ ...p, bets: [] });
    fireEvent.click(screen.getByRole("button", { name: "Додати запис" }));
    expect(p.onNavigateToAdd).toHaveBeenCalled();
    result.rerender(
      <MemoryRouter>
        <JournalTable {...p} searchText="not-found" />
      </MemoryRouter>,
    );
    expect(screen.getByText("Нічого не знайдено")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Скинути фільтри" }),
    ).toBeVisible();
  });
});
