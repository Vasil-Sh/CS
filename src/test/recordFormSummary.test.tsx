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
      riskyTeams: [],
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
  state.expressEvents = [];
  state.allExpressEventsComplete = false;
  state.tiltBlock.blocked = false;
  state.handleSubmit.mockClear();
});
const click = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name, exact: true }));
const predict = () => click("До прогнозу");
describe("Record wizard", () => {
  it("starts at match and never saves while advancing", () => {
    render(<CS2BettingForm />);
    expect(screen.getByRole("heading", { name: "ОБЕРІТЬ МАТЧ" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Зберегти запис" }),
    ).not.toBeInTheDocument();
    predict();
    expect(screen.getByRole("heading", { name: "ЩО ФІКСУЄМО?" })).toBeVisible();
    click("Перевірити запис");
    expect(
      screen.getByRole("heading", { name: "ПЕРЕВІРТЕ ЗАПИС" }),
    ).toBeVisible();
    expect(state.handleSubmit).not.toHaveBeenCalled();
    click("Зберегти запис");
    expect(state.handleSubmit).toHaveBeenCalledOnce();
  });
  it("blocks incomplete match", () => {
    state.formData.team1 = "";
    render(<CS2BettingForm />);
    predict();
    expect(screen.getByRole("alert")).toHaveTextContent("дві різні команди");
    expect(state.handleSubmit).not.toHaveBeenCalled();
  });
  it("blocks invalid odds from review", () => {
    state.formData.odds = "1";
    render(<CS2BettingForm />);
    predict();
    click("Перевірити запис");
    expect(screen.getByRole("alert")).toHaveTextContent("коефіцієнт");
    expect(
      screen.queryByRole("button", { name: "Зберегти запис" }),
    ).not.toBeInTheDocument();
  });
  it("blocks stale selection after a team change", () => {
    state.formData.selection = "OTHER";
    render(<CS2BettingForm />);
    predict();
    click("Перевірити запис");
    expect(screen.getByRole("alert")).toBeVisible();
  });
  it("allows back navigation without calling submit", () => {
    render(<CS2BettingForm />);
    predict();
    click("Перевірити запис");
    click("Назад");
    expect(screen.getByRole("heading", { name: "ЩО ФІКСУЄМО?" })).toBeVisible();
    expect(screen.getByDisplayValue("500")).toBeVisible();
    expect(state.handleSubmit).not.toHaveBeenCalled();
  });
  it("shows separate payout and profit", () => {
    render(<CS2BettingForm />);
    predict();
    expect(screen.getByText("1 000 ₴", { exact: false })).toBeVisible();
    expect(screen.getByText("+500 ₴")).toBeVisible();
  });
  it("uses form currency for hypothetical returns", () => {
    state.formData.currency = "USD";
    render(<CS2BettingForm />);
    predict();
    expect(screen.getByText("+500 $")).toBeVisible();
  });
  it("disables progression during tilt protection", () => {
    state.tiltBlock.blocked = true;
    render(<CS2BettingForm />);
    expect(screen.getByRole("button", { name: "До прогнозу" })).toBeDisabled();
  });
  it("blocks empty express", () => {
    state.formData.betCategory = "Експрес";
    render(<CS2BettingForm />);
    predict();
    expect(screen.getByRole("alert")).toHaveTextContent("хоча б одну");
  });
  it("blocks incomplete express at prediction", () => {
    state.formData.betCategory = "Експрес";
    state.expressEvents = [{ match: "A vs B" }];
    render(<CS2BettingForm />);
    predict();
    click("Перевірити запис");
    expect(screen.getByRole("alert")).toBeVisible();
    expect(state.handleSubmit).not.toHaveBeenCalled();
  });
  it("does not skip directly from match to review", () => {
    render(<CS2BettingForm />);
    expect(
      screen.getByRole("button", { name: /3\s*Перевірка/ }),
    ).toBeDisabled();
  });
});
