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
    handleAiRecommend: vi.fn(),
    selectedMatchIds: new Set(),
    toggleMatchSelection: vi.fn(),
    clearSelectedMatches: vi.fn(),
    handleCreateExpress: vi.fn(),
    refreshMatches: vi.fn().mockResolvedValue(undefined),
  },
  onAnalysis: vi.fn(),
  onEditNote: vi.fn(),
  onResults: vi.fn(),
});
afterEach(cleanup);

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
  it("opens one inline detail region and preserves risk next to the correct team", () => {
    render(<MatchSchedule {...props()} />);
    expect(screen.getAllByRole("region", { name: /Деталі:/ })).toHaveLength(1);
    const first = screen.getAllByTestId("schedule-row")[0];
    expect(within(first).getByText("БАН")).toBeVisible();
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
    fireEvent.click(screen.getByRole("button", { name: "Детальний аналіз" }));
    expect(p.onAnalysis).toHaveBeenCalledWith(p.model.matches[0]);
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
      screen.queryByRole("button", { name: "Створити запис", exact: true }),
    ).not.toBeInTheDocument();
  });
  it("collapses groups, shows the remaining rows and switches grouping", () => {
    const matches = Array.from({ length: 6 }, (_, index) =>
      makeMatch({ id: String(index), team1: `Team ${index}` }),
    );
    render(<MatchSchedule {...props(matches)} />);
    expect(screen.getAllByTestId("schedule-row")).toHaveLength(4);
    fireEvent.click(
      screen.getByRole("button", { name: "Ще 2 матчів турніру" }),
    );
    expect(screen.getAllByTestId("schedule-row")).toHaveLength(6);
    fireEvent.click(
      screen.getByRole("button", {
        name: /Dust2.dk Ligaen S33 CS2 · 6 матчів/,
      }),
    );
    expect(screen.queryAllByTestId("schedule-row")).toHaveLength(0);
    fireEvent.click(
      screen.getByRole("button", { name: "За часом", exact: true }),
    );
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
  it("keeps liked, skipped and note filters distinct", () => {
    const p = props();
    p.model.matchRatings = { m2: "like" };
    render(<MatchSchedule {...p} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Мої цікаві", exact: true }),
    );
    expect(screen.getAllByTestId("schedule-row")).toHaveLength(1);
    expect(
      screen.queryByRole("button", {
        name: "Деталі: MASONIC — Linx Legacy Esport",
      }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "З нотатками", exact: true }),
    );
    expect(
      screen.getByRole("button", {
        name: "Деталі: MASONIC — Linx Legacy Esport",
      }),
    ).toBeVisible();
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
      screen.getByRole("button", { name: "Вибрати для експресу", exact: true }),
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
    fireEvent.click(
      screen.getByRole("button", { name: "Завтра", exact: true }),
    );
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
