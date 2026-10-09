import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import MatchSchedule, {
  type MatchScheduleProps,
} from "@/components/matches/MatchSchedule";
import {
  coefficient,
  filterSchedule,
  groupSchedule,
  matchSource,
  matchState,
  nextScheduleDate,
  scheduleDate,
  scheduleTime,
  sourceForecast,
  sectionSchedule,
  type ScheduleFilters,
} from "@/components/matches/matchScheduleModel";
import type { Match } from "@/hooks/useMatches";

const now = new Date("2026-10-05T10:00:00Z");
const makeMatch = (patch: Partial<Match> = {}): Match => ({
  id: "m1",
  date: "2026-10-05T16:00:00Z",
  team1: "MASONIC",
  team2: "Linx Legacy Esport",
  game: "CS2",
  matchType: "Bo1",
  context: "Dust2.dk Ligaen S33",
  matchStatus: "upcoming",
  positionTeam1: 106,
  positionTeam2: 11,
  formStabilityTeam1: "stable",
  formStabilityTeam2: "",
  favorite: "MASONIC",
  aiConfidence: 0,
  risk: 0,
  comment: "",
  aiSummary: "",
  odds: { team1: 0, team2: 0 },
  winRate: 0,
  formStability: "stable",
  formWins1: 0,
  formWins2: 0,
  formLosses1: 0,
  formLosses2: 0,
  formStreak1: 0,
  formStreak2: 0,
  formLast1: "",
  formLast2: "",
  playerForm: [],
  tier: null,
  upsetProbability: 0,
  ...patch,
});
const filters: ScheduleFilters = {
  date: "2026-10-05",
  game: "all",
  query: "",
  status: "all",
  format: "all",
  tournament: "all",
  personal: "all",
  sort: "time",
};
const props = (
  matches = [
    makeMatch(),
    makeMatch({
      id: "m2",
      team1: "STATE",
      team2: "ECSTATIC",
      date: "2026-10-05T17:00:00Z",
    }),
  ],
): MatchScheduleProps => ({
  now,
  model: {
    matches,
    matchRatings: {},
    initialLoading: false,
    isLoading: false,
    apiError: null,
    getTeamRiskInfo: vi.fn((team, game) =>
      team === "MASONIC" && game === "CS2"
        ? { status: "БАН", notes: "Краще ставити проти них", game: "CS2" }
        : null,
    ),
    handleRateMatch: vi.fn(),
    handleAddToBets: vi.fn(),
    selectedMatchIds: new Set(),
    toggleMatchSelection: vi.fn(),
    clearSelectedMatches: vi.fn(),
    handleCreateExpress: vi.fn(),
    refreshMatches: vi.fn().mockResolvedValue(undefined),
  },
  onEditNote: vi.fn(),
  onResults: vi.fn(),
});
afterEach(cleanup);

describe("status sections and advertising placement", () => {
  const mixed = () => [
    makeMatch({ id: "next", team1: "NEXT" }),
    makeMatch({ id: "done", team1: "DONE", matchStatus: "finished" }),
    makeMatch({ id: "live", team1: "LIVE TEAM", matchStatus: "live" }),
  ];

  it("partitions each status exactly once while retaining order within sections", () => {
    const matches = [
      ...mixed(),
      makeMatch({ id: "later", team1: "LATER" }),
      makeMatch({ id: "postponed", matchStatus: "postponed" }),
      makeMatch({ id: "cancelled", matchStatus: "cancelled" }),
      makeMatch({ id: "unknown", matchStatus: undefined }),
    ];
    const sections = sectionSchedule(matches, "2026-10-05");
    expect(sections.map((s) => s.key)).toEqual([
      "live",
      "upcoming",
      "finished",
      "postponed",
      "cancelled",
      "unconfirmed",
    ]);
    expect(sections[1].matches.map((m) => m.id)).toEqual(["next", "later"]);
    expect(sections.flatMap((s) => s.matches)).toHaveLength(matches.length);
    expect(matches[0].id).toBe("next");
    expect(sectionSchedule([], "2026-10-05")).toEqual([]);
  });

  it("does not describe yesterday's stale live or upcoming entries as playing now", () => {
    const sections = sectionSchedule(
      [
        makeMatch({ matchStatus: "live", date: "2026-10-04T10:00:00Z" }),
        makeMatch({ id: "old", date: "2026-10-04T12:00:00Z" }),
        makeMatch({
          id: "done",
          matchStatus: "finished",
          date: "2026-10-04T12:00:00Z",
        }),
      ],
      "2026-10-05",
    );
    expect(sections.map((s) => s.key)).toEqual(["finished", "unconfirmed"]);
    expect(sections[1].matches).toHaveLength(2);
  });

  it("renders live, ad, upcoming and finished in that order with shared headers", () => {
    const { container } = render(
      <MatchSchedule {...props(mixed())} advertising={{ preview: true }} />,
    );
    const live = screen.getByRole("region", { name: "Зараз грають" });
    const upcoming = screen.getByRole("region", { name: "Найближчі матчі" });
    const finished = screen.getByRole("region", { name: "Завершені матчі" });
    const ad = screen.getByRole("complementary", { name: "Реклама" });
    expect(within(live).getByText("LIVE TEAM")).toBeVisible();
    expect(within(upcoming).getByText("NEXT")).toBeVisible();
    expect(within(finished).getByText("DONE")).toBeVisible();
    expect(live.nextElementSibling).toBe(ad);
    expect(ad.nextElementSibling).toBe(upcoming);
    expect(screen.getAllByTestId("schedule-row")).toHaveLength(3);
    const headers = Array.from(container.querySelectorAll(".ms-columns"));
    expect(headers).toHaveLength(3);
    expect(new Set(headers.map((h) => h.textContent)).size).toBe(1);
    expect(ad.querySelector(".ms-row")).toBeNull();
  });

  it("renders no empty ad slot without an active campaign", () => {
    const { container } = render(<MatchSchedule {...props(mixed())} />);
    expect(screen.queryByRole("complementary", { name: "Реклама" })).toBeNull();
    expect(
      container.querySelector(".ms-status-section--live")?.nextElementSibling,
    ).toHaveClass("ms-status-section--upcoming");
  });

  it("removes empty sections and the ad when filtering to one group or no results", () => {
    render(
      <MatchSchedule {...props(mixed())} advertising={{ preview: true }} />,
    );
    const search = screen.getByRole("searchbox", {
      name: "Пошук команди або турніру",
    });
    fireEvent.change(search, { target: { value: "NEXT" } });
    expect(screen.queryByRole("region", { name: "Зараз грають" })).toBeNull();
    expect(screen.queryByRole("complementary", { name: "Реклама" })).toBeNull();
    expect(screen.getAllByTestId("schedule-row")).toHaveLength(1);
    fireEvent.change(search, { target: { value: "unmatched query" } });
    expect(screen.queryAllByTestId("schedule-row")).toHaveLength(0);
    expect(screen.queryByRole("complementary", { name: "Реклама" })).toBeNull();
    fireEvent.change(search, { target: { value: "" } });
    expect(screen.getAllByTestId("schedule-row")).toHaveLength(3);
    expect(
      screen.getAllByRole("complementary", { name: "Реклама" }),
    ).toHaveLength(1);
  });

  it("keeps tournament collapse state independent across statuses and preserves actions", () => {
    const p = props(mixed());
    render(<MatchSchedule {...p} advertising={{ preview: true }} />);
    fireEvent.click(screen.getByRole("button", { name: "За турніром" }));
    const live = screen.getByRole("region", { name: "Зараз грають" });
    const upcoming = screen.getByRole("region", { name: "Найближчі матчі" });
    fireEvent.click(
      within(live).getByRole("button", { name: /Dust2.dk Ligaen/ }),
    );
    expect(within(live).queryAllByTestId("schedule-row")).toHaveLength(0);
    expect(within(upcoming).getAllByTestId("schedule-row")).toHaveLength(1);
    expect(
      screen.getAllByRole("complementary", { name: "Реклама" }),
    ).toHaveLength(1);
    fireEvent.click(
      within(upcoming).getByRole("button", {
        name: "Створити запис: NEXT — Linx Legacy Esport",
      }),
    );
    expect(p.model.handleAddToBets).toHaveBeenCalledWith(p.model.matches[0]);
    fireEvent.click(screen.getByRole("button", { name: "За часом" }));
    expect(screen.getAllByTestId("schedule-row")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Фільтри" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Статус" }), {
      target: { value: "finished" },
    });
    expect(screen.getAllByTestId("schedule-row")).toHaveLength(1);
    expect(screen.queryByRole("complementary", { name: "Реклама" })).toBeNull();
  });

  it("does not show a demo ad on empty/loading days or between historical-only groups", () => {
    const p = props([]);
    const view = render(
      <MatchSchedule {...p} advertising={{ preview: true }} />,
    );
    expect(screen.queryByRole("complementary", { name: "Реклама" })).toBeNull();
    view.rerender(
      <MatchSchedule
        {...p}
        model={{ ...p.model, initialLoading: true }}
        advertising={{ preview: true }}
      />,
    );
    expect(screen.queryByRole("complementary", { name: "Реклама" })).toBeNull();
    view.rerender(
      <MatchSchedule
        {...props([
          makeMatch({ id: "done", matchStatus: "finished" }),
          makeMatch({ id: "cancelled", matchStatus: "cancelled" }),
        ])}
        advertising={{ preview: true }}
      />,
    );
    expect(screen.queryByRole("complementary", { name: "Реклама" })).toBeNull();
  });
});

describe("redesigned expanded match panel", () => {
  const openDetails = () => {
    fireEvent.click(
      screen.getByRole("button", {
        name: "Деталі: MASONIC — Linx Legacy Esport",
      }),
    );
    return screen.getByRole("region", {
      name: "Деталі: MASONIC — Linx Legacy Esport",
    });
  };

  it("renders two distinct note cards, the note count and the empty-state action", () => {
    render(<MatchSchedule {...props()} />);
    const panel = openDetails();
    expect(within(panel).getAllByRole("article")).toHaveLength(2);
    expect(
      within(panel).getByLabelText("Команд із примітками: 1"),
    ).toHaveTextContent("1");
    const note = within(panel).getByRole("article", {
      name: "Примітка: MASONIC",
    });
    expect(note).toHaveTextContent("БАН");
    expect(note).toHaveClass("ms-detail-card--ban");
    expect(note).toHaveTextContent("Краще ставити проти них");
    const empty = within(panel).getByRole("article", {
      name: "Примітка: Linx Legacy Esport",
    });
    expect(empty).toHaveTextContent("Ще немає примітки");
    expect(empty).not.toHaveTextContent("Стабільні");
    expect(
      within(empty).getByRole("button", {
        name: "Додати нотатку: Linx Legacy Esport",
      }),
    ).toHaveTextContent("Додати примітку");
    expect(within(panel).queryByText("Дії з матчем")).not.toBeInTheDocument();
  });

  it("preserves multiline notes and does not call a stable team risky", () => {
    const p = props();
    p.model.getTeamRiskInfo = vi.fn((name) => ({
      name,
      game: "CS",
      status: "Стабільні",
      notes: "Перший рядок\nДругий рядок",
    }));
    render(<MatchSchedule {...p} />);
    const panel = openDetails();
    expect(
      within(panel).getByLabelText("Команд із примітками: 2"),
    ).toHaveTextContent("2");
    const note = within(panel).getByRole("article", {
      name: "Примітка: MASONIC",
    });
    expect(note).toHaveClass("ms-detail-card--stable");
    expect(note.querySelector(".ms-detail-note-text")?.textContent).toBe(
      "Перший рядок\nДругий рядок",
    );
    expect(within(note).queryByText("Ризиковані")).not.toBeInTheDocument();
  });

  it("allows editing a status-only entry without inventing note text", () => {
    const p = props();
    p.model.getTeamRiskInfo = vi.fn(() => ({
      status: "Під питанням",
      notes: "   ",
      game: "CS",
    }));
    render(<MatchSchedule {...p} />);
    const panel = openDetails();
    const note = within(panel).getByRole("article", {
      name: "Примітка: MASONIC",
    });
    expect(note).toHaveTextContent("Текст примітки ще не додано");
    fireEvent.click(
      within(note).getByRole("button", { name: "Редагувати нотатку: MASONIC" }),
    );
    expect(p.onEditNote).toHaveBeenCalledWith(p.model.matches[0], "MASONIC");
  });

  it("shows a single form-empty message and never manufactures a missing rank", () => {
    render(
      <MatchSchedule
        {...props([
          makeMatch({
            formStabilityTeam1: "",
            formStabilityTeam2: "",
            positionTeam1: null,
            positionTeam2: NaN,
          }),
        ])}
      />,
    );
    const panel = openDetails();
    expect(
      within(panel).getAllByText("Даних про форму поки немає"),
    ).toHaveLength(1);
    const table = within(panel).getByRole("table", { name: "Рейтинг команд" });
    expect(within(table).getAllByLabelText("Рейтинг відсутній")).toHaveLength(
      2,
    );
    expect(table).not.toHaveTextContent("#0");
    expect(table).not.toHaveTextContent("Немає даних");
  });

  it("retains actual form and rank data in the compact ranking table", () => {
    render(<MatchSchedule {...props()} />);
    const panel = openDetails();
    const table = within(panel).getByRole("table", { name: "Рейтинг команд" });
    expect(table).toHaveTextContent("#106");
    expect(table).toHaveTextContent("#11");
    expect(table).toHaveTextContent("Стабільна");
    expect(table).toHaveTextContent("Форма не надана");
    expect(
      within(panel).queryByText("Даних про форму поки немає"),
    ).not.toBeInTheDocument();
  });

  it("keeps recent results collapsed until requested", () => {
    render(
      <MatchSchedule
        {...props([
          makeMatch({
            formWins1: 4,
            formLosses1: 1,
            formStreak1: 2,
            formLast1: "WWLWW",
            interestStars: 3,
          }),
        ])}
      />,
    );
    const panel = openDetails();
    const summary = within(panel).getByText("Останні результати");
    const disclosure = summary.closest("details")!;
    expect(disclosure.open).toBe(false);
    fireEvent.click(summary);
    expect(disclosure.open).toBe(true);
    expect(disclosure).toHaveTextContent("4W / 1L · Серія W2 · WWLWW");
    expect(disclosure).toHaveTextContent("Інтерес за рейтингом: 3/5");
  });
});

describe("match schedule data", () => {
  it("uses the same Kyiv date and clock across the UTC midnight boundary", () => {
    expect(scheduleDate("2026-10-04T22:30:00Z")).toBe("2026-10-05");
    expect(scheduleTime("2026-10-04T22:30:00Z")).toBe("01:30");
    expect(scheduleTime("2026-12-04T22:30:00Z")).toBe("00:30");
  });
  it("preserves legacy wall-clock dates and handles absent times", () => {
    expect(scheduleDate("2026-10-05T19:00:00")).toBe("2026-10-05");
    expect(scheduleTime("2026-10-05T19:00:00")).toBe("19:00");
    expect(scheduleTime("2026-10-05")).toBe("—");
    expect(scheduleDate("invalid")).toBe("");
    expect(nextScheduleDate("2026-12-31")).toBe("2027-01-01");
  });
  it("finds tournaments as well as team names without changing the source array", () => {
    const matches = [makeMatch()];
    expect(
      filterSchedule(
        matches,
        { ...filters, query: "  DUST2 " },
        {},
        () => false,
      ),
    ).toHaveLength(1);
    expect(
      filterSchedule(matches, { ...filters, query: "linx" }, {}, () => false),
    ).toHaveLength(1);
    expect(matches[0].id).toBe("m1");
  });
  it("filters exact date, game, format, status and personal marks", () => {
    const matches = [
      makeMatch(),
      makeMatch({ id: "dota", game: "Dota2" }),
      makeMatch({ id: "tomorrow", date: "2026-10-06T16:00:00Z" }),
    ];
    expect(
      filterSchedule(
        matches,
        { ...filters, game: "CS2", personal: "liked" },
        { m1: "like" },
        () => false,
      ).map((m) => m.id),
    ).toEqual(["m1"]);
    expect(
      filterSchedule(
        matches,
        { ...filters, personal: "notes" },
        {},
        (match) => match.id === "dota",
      ).map((m) => m.id),
    ).toEqual(["dota"]);
    expect(
      filterSchedule(matches, { ...filters, format: "Bo3" }, {}, () => true),
    ).toEqual([]);
  });
  it("keeps chronological order independent of personal likes", () => {
    const matches = [
      makeMatch(),
      makeMatch({ id: "earlier", date: "2026-10-05T12:00:00Z" }),
    ];
    expect(
      filterSchedule(matches, filters, { m1: "like" }, () => false).map(
        (m) => m.id,
      ),
    ).toEqual(["earlier", "m1"]);
  });
  it("keeps missing odds last and never turns them into zero", () => {
    expect(coefficient(null)).toBe("—");
    expect(coefficient(0)).toBe("—");
    expect(coefficient(NaN)).toBe("—");
    expect(coefficient(2)).toBe("2.00");
    const matches = [
      makeMatch(),
      makeMatch({ id: "known", bettingCoefficientTeam1: 2.1 }),
    ];
    for (const sort of ["odds", "odds-desc"] as const)
      expect(
        filterSchedule(matches, { ...filters, sort }, {}, () => false)[0].id,
      ).toBe("known");
  });
  it("does not merge tournaments from different games", () => {
    expect(
      groupSchedule(
        [makeMatch(), makeMatch({ id: "dota", game: "Dota2" })],
        "tournament",
      ),
    ).toHaveLength(2);
    expect(
      groupSchedule([makeMatch(), makeMatch({ id: "other" })], "time"),
    ).toHaveLength(1);
  });
  it("labels stale pending data without inventing a result or live score", () => {
    expect(
      matchState(makeMatch({ date: "2026-09-29T12:00:00Z" }), filters.date)
        .tone,
    ).toBe("stale");
    expect(
      matchState(
        makeMatch({ matchStatus: "finished", score1: 2, score2: 1 }),
        filters.date,
      ).text,
    ).toBe("Завершено · 2:1");
    expect(matchSource(makeMatch({ url: "javascript:alert(1)" }))).toBe(
      "https://tips.gg/csgo/matches/",
    );
  });
});

describe("match schedule interactions", () => {
  it("starts compact, names the risky team, and opens one detail region on demand", () => {
    render(<MatchSchedule {...props()} />);
    expect(screen.queryAllByRole("region", { name: /Деталі:/ })).toHaveLength(
      0,
    );
    const first = screen.getAllByTestId("schedule-row")[0];
    expect(within(first).getByText("Показати запис")).toBeVisible();
    expect(within(first).queryByText("MASONIC · БАН")).not.toBeInTheDocument();
    fireEvent.click(
      within(first).getByRole("button", {
        name: "Показати запис: MASONIC — Linx Legacy Esport",
      }),
    );
    expect(screen.getAllByRole("region", { name: /Деталі:/ })).toHaveLength(1);
    expect(screen.getByText("Краще ставити проти них")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Деталі: STATE — ECSTATIC" }),
    );
    expect(screen.getAllByRole("region", { name: /Деталі:/ })).toHaveLength(1);
    expect(
      screen.queryByText("Краще ставити проти них"),
    ).not.toBeInTheDocument();
  });
  it("routes the chosen team to the note editor and retains detailed analysis", () => {
    const p = props();
    render(<MatchSchedule {...p} />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Деталі: MASONIC — Linx Legacy Esport",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Редагувати нотатку: MASONIC" }),
    );
    expect(p.onEditNote).toHaveBeenCalledWith(p.model.matches[0], "MASONIC");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Додати нотатку: Linx Legacy Esport",
      }),
    );
    expect(p.onEditNote).toHaveBeenLastCalledWith(
      p.model.matches[0],
      "Linx Legacy Esport",
    );
  });
  it("opens the record form from its single row action", () => {
    const p = props();
    render(<MatchSchedule {...p} />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Створити запис: MASONIC — Linx Legacy Esport",
      }),
    );
    expect(p.model.handleAddToBets).toHaveBeenCalledWith(p.model.matches[0]);
    expect(
      screen.queryByRole("button", { name: "Створити запис" }),
    ).not.toBeInTheDocument();
  });
  it("shows all matches at once and switches grouping", () => {
    const matches = Array.from({ length: 6 }, (_, index) =>
      makeMatch({ id: String(index), team1: `Team ${index}` }),
    );
    render(<MatchSchedule {...props(matches)} />);
    expect(screen.getByRole("button", { name: "За часом" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "За турніром" }));
    expect(screen.getAllByTestId("schedule-row")).toHaveLength(6);
    fireEvent.click(
      screen.getByRole("button", {
        name: /Dust2.dk Ligaen S33 CS2 · 6 матчів/,
      }),
    );
    expect(screen.queryAllByTestId("schedule-row")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "За часом" }));
    expect(screen.getAllByTestId("schedule-row")).toHaveLength(6);
  });
  it("filters by tournament search and recovers from an empty search", () => {
    render(<MatchSchedule {...props()} />);
    const search = screen.getByRole("searchbox", {
      name: "Пошук команди або турніру",
    });
    fireEvent.change(search, { target: { value: "Dust2" } });
    expect(screen.getAllByTestId("schedule-row")).toHaveLength(2);
    fireEvent.change(search, { target: { value: "Unknown" } });
    expect(screen.getByText("Матчів за цими фільтрами немає")).toBeVisible();
    fireEvent.change(search, { target: { value: "" } });
    expect(screen.getAllByTestId("schedule-row")).toHaveLength(2);
  });
  it("offers reset filters without a skipped toggle", () => {
    const p = props();
    render(<MatchSchedule {...p} />);
    fireEvent.click(screen.getByRole("button", { name: "Фільтри" }));
    expect(
      screen.queryByRole("button", { name: "Нецікаві матчі" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Скинути фільтри" }));
    expect(screen.getAllByTestId("schedule-row")).toHaveLength(2);
  });
  it("clears a bookmark with a null rating, not a second like", () => {
    const p = props();
    p.model.matchRatings = { m1: "like" };
    render(<MatchSchedule {...p} />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Прибрати з цікавих: MASONIC — Linx Legacy Esport",
      }),
    );
    expect(p.model.handleRateMatch).toHaveBeenCalledWith("m1", null);
  });
  it("supports explicit express selection without creating records", () => {
    const p = props();
    p.model.selectedMatchIds = new Set(["m1"]);
    render(<MatchSchedule {...p} />);
    expect(
      screen.getByRole("button", { name: "Створити експрес" }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Вибрати для експресу" }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Обрати для експресу: STATE — ECSTATIC",
      }),
    );
    expect(p.model.toggleMatchSelection).toHaveBeenCalledWith("m2");
    expect(p.model.handleAddToBets).not.toHaveBeenCalled();
  });
  it("retains express selections while the date filter hides those matches", () => {
    const p = props();
    p.model.selectedMatchIds = new Set(["m1", "m2"]);
    render(<MatchSchedule {...p} />);
    fireEvent.click(screen.getByRole("button", { name: "Завтра" }));
    expect(screen.getByText("На цю дату немає матчів")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Створити експрес" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", {
        name: "Прибрати з експресу: MASONIC — Linx Legacy Esport",
      }),
    ).toBeVisible();
  });
  it("shows loading and fetch errors without fictional data", () => {
    const p = props([]);
    p.model.initialLoading = true;
    const view = render(<MatchSchedule {...p} />);
    expect(screen.getByText("Завантажуємо матчі…")).toBeVisible();
    view.rerender(
      <MatchSchedule
        {...p}
        model={{ ...p.model, initialLoading: false, apiError: "offline" }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Не вдалося повністю оновити розклад",
    );
  });
});

describe("dense schedule", () => {
  it("accepts source percentage pairs, including 0/100, but never manufactures missing predictions", () => {
    expect(
      sourceForecast(
        makeMatch({ predictionPercentTeam1: 45, predictionPercentTeam2: 55 }),
      ),
    ).toEqual({ first: 45, second: 55, firstWidth: 45 });
    expect(
      sourceForecast(
        makeMatch({ predictionPercentTeam1: 0, predictionPercentTeam2: 100 }),
      ),
    ).toEqual({ first: 0, second: 100, firstWidth: 0 });
    for (const pair of [
      [undefined, 55],
      [45, null],
      [NaN, 50],
      [Infinity, 50],
      [-1, 101],
      [0, 0],
      [30, 30],
      [140, 60],
    ]) {
      expect(
        sourceForecast(
          makeMatch({
            predictionPercentTeam1: pair[0],
            predictionPercentTeam2: pair[1],
            aiConfidence: 80,
            odds: { team1: 1.1, team2: 5 },
          }),
        ),
      ).toBeNull();
    }
  });
  it("keeps forecast position stable, with the correct team names and an honest empty state", () => {
    render(
      <MatchSchedule
        {...props([
          makeMatch({ predictionPercentTeam1: 28, predictionPercentTeam2: 72 }),
          makeMatch({ id: "m2", team1: "STATE", team2: "ECSTATIC" }),
        ])}
      />,
    );
    const forecast = screen.getByRole("group", {
      name: "Прогноз джерела: MASONIC — Linx Legacy Esport",
    });
    expect(within(forecast).getByText("28%")).toBeVisible();
    expect(within(forecast).getByText("72%")).toBeVisible();
    expect(forecast).toHaveTextContent(
      "MASONIC: 28%; Linx Legacy Esport: 72%.",
    );
    expect(forecast.querySelector(".ms-forecast-track > span")).toHaveStyle({
      width: "28%",
    });
    expect(
      screen.getByRole("group", { name: "Прогноз джерела: STATE — ECSTATIC" }),
    ).toHaveTextContent("Немає даних");
  });
  it("does not label an unmarked team as safe, and Add opens the existing note editor", () => {
    const p = props();
    render(<MatchSchedule {...p} />);
    const row = screen.getAllByTestId("schedule-row")[1];
    expect(row.querySelectorAll(".ms-team-risk")).toHaveLength(0);
    fireEvent.click(
      within(row).getByRole("button", {
        name: "Додати примітку: STATE — ECSTATIC",
      }),
    );
    expect(p.onEditNote).toHaveBeenCalledWith(p.model.matches[1], "STATE");
  });
  it("shows scores in the Гра block and a Гра link otherwise", () => {
    const { container } = render(
      <MatchSchedule
        {...props([
          makeMatch({ matchStatus: "live", score1: 1, score2: 0 }),
          makeMatch({
            id: "m2",
            matchStatus: "finished",
            score1: 2,
            score2: 1,
          }),
        ])}
      />,
    );
    const scores = Array.from(
      container.querySelectorAll(".ms-source-cell .ms-source-score"),
    ).map((el) => el.getAttribute("aria-label"));
    expect(scores).toContain("Рахунок матчу: 1:0");
    expect(scores).toContain("Рахунок матчу: 2:1");
    expect(
      container.querySelectorAll(".ms-source-cell .ms-source-score"),
    ).toHaveLength(2);
    expect(container.querySelector(".match-identity__live")).toHaveTextContent(
      "LIVE",
    );
    expect(screen.queryByText("Зараз грають · 1:0")).not.toBeInTheDocument();
    expect(screen.queryByText("Завершено · 2:1")).not.toBeInTheDocument();
  });
  it("pins liked matches to the top and pushes disliked above finished", () => {
    const p = props([
      makeMatch({
        id: "finished",
        team1: "FINISHED",
        matchStatus: "finished",
        score1: 2,
        score2: 1,
      }),
      makeMatch({ id: "disliked", team1: "DISLIKED" }),
      makeMatch({ id: "neutral", team1: "NEUTRAL" }),
      makeMatch({ id: "liked", team1: "LIKED" }),
    ]);
    p.model.matchRatings = { disliked: "dislike", liked: "like" };
    render(<MatchSchedule {...p} />);
    const order = screen
      .getAllByTestId("schedule-row")
      .map((row) => row.querySelector(".match-identity__name")?.textContent);
    expect(order).toEqual(["LIKED", "NEUTRAL", "DISLIKED", "FINISHED"]);
  });
  it("shows time, game and format together in the identity block", () => {
    render(<MatchSchedule {...props([makeMatch()])} />);
    const row = screen.getByTestId("schedule-row");
    expect(row.querySelector(".match-identity__time")).toHaveTextContent(
      "19:00",
    );
    expect(row.querySelector(".match-identity__format")).toHaveTextContent(
      "BO1",
    );
    expect(row.querySelector(".match-identity__game")).toHaveTextContent("CS2");
    const record = within(row).getByRole("button", {
      name: "Створити запис: MASONIC — Linx Legacy Esport",
    });
    expect(record).toHaveAttribute("title", "Створити запис");
    expect(record.textContent).toBe("");
  });
  it("does not turn a missing score into a fictional 0:0", () => {
    const view = render(
      <MatchSchedule {...props([makeMatch({ matchStatus: "live" })])} />,
    );
    expect(view.container.querySelector(".ms-source-score")).toBeNull();
    view.rerender(
      <MatchSchedule
        {...props([makeMatch({ matchStatus: "live", score1: 0, score2: 0 })])}
      />,
    );
    expect(screen.getByLabelText("Рахунок матчу: 0:0")).toBeInTheDocument();
  });
  it("opens and closes notes from the compact view action without saving", () => {
    const p = props([makeMatch()]);
    render(<MatchSchedule {...p} />);
    const notes = screen.getByRole("button", {
      name: "Показати запис: MASONIC — Linx Legacy Esport",
    });
    expect(notes).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(notes);
    expect(notes).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Краще ставити проти них")).toBeVisible();
    fireEvent.click(notes);
    expect(notes).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText("Краще ставити проти них"),
    ).not.toBeInTheDocument();
    expect(p.model.handleAddToBets).not.toHaveBeenCalled();
  });
  it("preserves source, express, results and refresh actions without saving a record", () => {
    const p = props([makeMatch({ url: "https://tips.gg/match/example/" })]);
    render(<MatchSchedule {...p} />);
    const source = screen.getByRole("link", {
      name: "Гра: MASONIC — Linx Legacy Esport",
    });
    expect(source).toHaveAttribute("href", "https://tips.gg/match/example/");
    expect(source).toHaveAttribute("rel", "noopener noreferrer");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Додати матч до експресу: MASONIC — Linx Legacy Esport",
      }),
    );
    expect(p.model.toggleMatchSelection).toHaveBeenCalledWith("m1");
    fireEvent.click(screen.getByRole("button", { name: "Результати" }));
    expect(p.onResults).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Оновити" }));
    expect(p.model.refreshMatches).toHaveBeenCalledOnce();
    expect(p.model.handleAddToBets).not.toHaveBeenCalled();
  });
  it("renders odds in team order and only highlights a genuinely lower available value", () => {
    const p = props([
      makeMatch({
        bettingCoefficientTeam1: 3.01,
        bettingCoefficientTeam2: 1.35,
      }),
    ]);
    const view = render(<MatchSchedule {...p} />);
    let odds = screen.getByRole("group", { name: "Коефіцієнти" });
    expect(odds.querySelectorAll(".ms-odd-line")[0]).toHaveTextContent(
      "MASONIC: 3.01",
    );
    expect(odds.querySelector(".ms-odd-value--lower")).toHaveTextContent(
      "1.35",
    );
    for (const values of [
      [1.5, 1.5],
      [1.5, null],
      [1.501, 1.502],
    ]) {
      view.rerender(
        <MatchSchedule
          {...props([
            makeMatch({
              bettingCoefficientTeam1: values[0],
              bettingCoefficientTeam2: values[1],
            }),
          ])}
        />,
      );
      odds = screen.getByRole("group", { name: "Коефіцієнти" });
      expect(odds.querySelector(".ms-odd-value--lower")).toBeNull();
    }
  });
});
