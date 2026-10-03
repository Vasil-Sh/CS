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
  state.tiltBlock.blocked = false;
  state.handleSubmit.mockClear();
});
describe("Record form summary", () => {
  it("shows hypothetical payout including stake and net profit separately", () => {
    render(<CS2BettingForm />);
    expect(screen.getByText("1 000 ₴", { exact: false })).toBeVisible();
    expect(screen.getByText("+500 ₴")).toBeVisible();
  });
  it("associates the single summary submit button with the actual form", () => {
    render(<CS2BettingForm />);
    const button = screen.getByRole("button", { name: "Зберегти запис" });
    expect(button).toHaveAttribute("form", "record-entry-form");
    fireEvent.click(button);
    expect(state.handleSubmit).toHaveBeenCalledOnce();
  });
  it("prevents saving during a tilt block", () => {
    state.tiltBlock.blocked = true;
    render(<CS2BettingForm />);
    expect(
      screen.getByRole("button", { name: "Зберегти запис" }),
    ).toBeDisabled();
  });
  it("prevents saving an empty express", () => {
    state.formData.betCategory = "Експрес";
    render(<CS2BettingForm />);
    expect(
      screen.getByRole("button", { name: "Зберегти запис" }),
    ).toBeDisabled();
  });
  it("uses the form currency for hypothetical returns", () => {
    state.formData.currency = "USD";
    render(<CS2BettingForm />);
    expect(screen.getByText("+500 $")).toBeVisible();
  });
  it("does not manufacture returns from invalid odds", () => {
    state.formData.odds = "";
    render(<CS2BettingForm />);
    expect(screen.queryByText("+500 ₴")).not.toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });
});
