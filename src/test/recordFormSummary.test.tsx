import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import CS2BettingForm from "@/components/CS2BettingForm";
const { state } = vi.hoisted(() => ({
  state: {
    formData: {
      date: "2026-10-03",
      game: "CS2",
      betCategory: "Ординар",
      format: "BO3",
      goalId: "",
      matchUrl: "",
      team1: "NAVI",
      team2: "G2",
      betType: "MatchWinner",
      selection: "NAVI",
      odds: "2",
      stake: "500",
      currency: "UAH",
      confidence: "",
      riskyTeams: [] as {
        name: string;
        game: string;
        status: string;
        notes: string;
      }[],
    },
    tiltBlock: { blocked: false },
    activeGoals: [],
    primaryStrategy: null,
    strategyViolations: [],
    prefillLogosRef: { current: {} },
    expressEvents: [] as unknown[],
    allExpressEventsComplete: false,
    totalExpressOdds: 1,
    isSubmitting: false,
    isExpressFromMatches: false,
    handleSubmit: vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    ),
  },
}));
vi.mock("@/hooks/useBettingForm", () => ({ useBettingForm: () => state }));
vi.mock("@/components/StrategyViolationDialog", () => ({
  default: () => null,
}));
vi.mock("@/components/betting-form/BettingFormAlerts", () => ({
  default: () => null,
}));
vi.mock("@/components/betting-form/BettingFormSettings", () => ({
  default: () => null,
}));
vi.mock("@/components/betting-form/BettingFormMatchSection", () => ({
  default: () => null,
}));
vi.mock("@/components/betting-form/BettingFormFinances", () => ({
  default: () => null,
}));
vi.mock("@/components/ExpressEventBuilder", () => ({
  ExpressEventBuilder: () => null,
}));
vi.mock("@/components/betting-form/SidebarCalculations", () => ({
  default: () => null,
}));
afterEach(() => {
  cleanup();
  state.formData.betCategory = "Ординар";
  state.formData.currency = "UAH";
  state.formData.odds = "2";
  state.formData.team1 = "NAVI";
  state.formData.selection = "NAVI";
  state.formData.stake = "500";
  state.formData.date = "2026-10-03";
  state.formData.riskyTeams = [];
  state.expressEvents = [];
  state.allExpressEventsComplete = false;
  state.isSubmitting = false;
  state.tiltBlock.blocked = false;
  state.handleSubmit.mockClear();
});
const save = () =>
  fireEvent.click(screen.getByRole("button", { name: "Зберегти запис" }));
describe("Single-page record entry", () => {
  it("shows match, prediction and save together without wizard navigation", () => {
    render(<CS2BettingForm />);
    expect(screen.getByRole("heading", { name: "Матч" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Прогноз" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Перевірити запис" }),
    ).not.toBeInTheDocument();
    save();
    expect(state.handleSubmit).toHaveBeenCalledOnce();
  });
  it("blocks incomplete match", () => {
    state.formData.team1 = "";
    render(<CS2BettingForm />);
    save();
    expect(screen.getByRole("alert")).toHaveTextContent("дві різні команди");
    expect(state.handleSubmit).not.toHaveBeenCalled();
  });
  it("blocks invalid odds", () => {
    state.formData.odds = "1";
    render(<CS2BettingForm />);
    save();
    expect(screen.getByRole("alert")).toHaveTextContent("коефіцієнт");
    expect(state.handleSubmit).not.toHaveBeenCalled();
  });
  it("blocks stale selection", () => {
    state.formData.selection = "OTHER";
    render(<CS2BettingForm />);
    save();
    expect(screen.getByRole("alert")).toHaveTextContent("Оберіть ринок");
  });
  it("shows payout and profit", () => {
    render(<CS2BettingForm />);
    expect(screen.getByText("1 000 ₴", { exact: false })).toBeVisible();
    expect(screen.getByText("+500 ₴")).toBeVisible();
  });
  it("uses USD for returns", () => {
    state.formData.currency = "USD";
    render(<CS2BettingForm />);
    expect(screen.getByText("+500 $")).toBeVisible();
  });
  it("disables save for tilt protection", () => {
    state.tiltBlock.blocked = true;
    render(<CS2BettingForm />);
    expect(
      screen.getByRole("button", { name: "Зберегти запис" }),
    ).toBeDisabled();
  });
  it("disables save while submitting", () => {
    state.isSubmitting = true;
    render(<CS2BettingForm />);
    expect(screen.getByRole("button", { name: "Збереження…" })).toBeDisabled();
  });
  it("blocks empty express", () => {
    state.formData.betCategory = "Експрес";
    render(<CS2BettingForm />);
    save();
    expect(screen.getByRole("alert")).toHaveTextContent("хоча б одну");
  });
  it("blocks incomplete express", () => {
    state.formData.betCategory = "Експрес";
    state.expressEvents = [{ match: "A vs B" }];
    render(<CS2BettingForm />);
    save();
    expect(screen.getByRole("alert")).toBeVisible();
    expect(state.handleSubmit).not.toHaveBeenCalled();
  });
  it("shows both teams with neutral missing notes", () => {
    render(<CS2BettingForm />);
    expect(screen.getAllByText("Немає збережених приміток")).toHaveLength(2);
  });
  it("preserves real risk status and note", () => {
    state.formData.riskyTeams = [
      {
        name: "NAVI",
        game: "CS",
        status: "БАН",
        notes: "Коментар користувача",
      },
    ];
    render(<CS2BettingForm />);
    expect(screen.getByText("БАН")).toBeVisible();
    expect(screen.getByText("Коментар користувача")).toBeVisible();
    expect(screen.getByText("Ваш вибір")).toBeVisible();
  });
  it("does not match notes from another game", () => {
    state.formData.riskyTeams = [
      { name: "NAVI", game: "Дота", status: "БАН", notes: "Dota only" },
    ];
    render(<CS2BettingForm />);
    expect(screen.queryByText("Dota only")).not.toBeInTheDocument();
  });
});
