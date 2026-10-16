import { describe, it, expect, vi, afterEach } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
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
        logo?: string;
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
    setFormData: vi.fn(),
    clearForm: vi.fn(),
    handleUrlChange: vi.fn(),
    parseMatchFromUrl: vi.fn(),
    clearExpressEvents: vi.fn(),
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
  default: ({
    extraPredictionSlot,
  }: {
    extraPredictionSlot?: React.ReactNode;
  }) => <div>{extraPredictionSlot}</div>,
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
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    Link: ({
      to,
      children,
      ...rest
    }: {
      to: string;
      children: React.ReactNode;
      [key: string]: unknown;
    }) => (
      <a href={String(to)} {...rest}>
        {children}
      </a>
    ),
  };
});
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
  state.setFormData.mockClear();
  state.clearForm.mockClear();
  state.formData.matchUrl = "";
  state.totalExpressOdds = 1;
});
const save = () =>
  fireEvent.click(screen.getByRole("button", { name: "Зберегти запис" }));
describe("Single-page record entry", () => {
  it("shows match, prediction and save together without wizard navigation", () => {
    render(<CS2BettingForm />);
    expect(
      screen.getByRole("region", { name: "Матч і прогноз" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Підсумок запису" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Матч і прогноз" }),
    ).toBeVisible();
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
  });
  it("does not match notes from another game", () => {
    state.formData.riskyTeams = [
      { name: "NAVI", game: "Дота", status: "БАН", notes: "Dota only" },
    ];
    render(<CS2BettingForm />);
    expect(screen.queryByText("Dota only")).not.toBeInTheDocument();
  });
});

describe("Redesigned forecast flow", () => {
  it("keeps URL, teams and market in the forecast, separate from settings", () => {
    render(<CS2BettingForm />);
    expect(
      screen.getByRole("region", { name: "Матч і прогноз" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("region", { name: "Налаштування матчу" }),
    ).toBeNull();
  });
  it("updates the read-only summary from current form values", () => {
    const { rerender } = render(<CS2BettingForm />);
    state.formData.selection = "G2";
    state.formData.odds = "3";
    rerender(<CS2BettingForm />);
    const summary = screen.getByRole("complementary", {
      name: "Підсумок запису",
    });
    expect(within(summary).getByText(/G2 —/)).toBeVisible();
    expect(within(summary).getByText("+1 000 ₴")).toBeVisible();
  });
  it("saves complete express and shows its combined odds", () => {
    state.formData.betCategory = "Експрес";
    state.expressEvents = [{ match: "NAVI vs G2", selection: "NAVI", odds: 2 }];
    state.allExpressEventsComplete = true;
    state.totalExpressOdds = 2;
    render(<CS2BettingForm />);
    expect(screen.getByText("Експрес · 1 подій")).toBeVisible();
    save();
    expect(state.handleSubmit).toHaveBeenCalledOnce();
  });
  it("uses existing clear action", () => {
    render(<CS2BettingForm />);
    fireEvent.click(screen.getByRole("button", { name: "Очистити" }));
    expect(state.clearForm).toHaveBeenCalledOnce();
  });
});
describe("Reference layout refinements", () => {
  it("keeps the currency dropdown connected to the form", () => {
    render(<CS2BettingForm />);
    fireEvent.change(screen.getByRole("combobox", { name: "Валюта запису" }), {
      target: { value: "USD" },
    });
    const update = state.setFormData.mock.calls[0][0];
    expect(update(state.formData).currency).toBe("USD");
  });
  it("reuses stored logos in the summary", () => {
    state.formData.riskyTeams = [
      {
        name: "NAVI",
        game: "CS",
        status: "БАН",
        notes: "",
        logo: "/api/v1/cs2-matches/logo/local/navi.png",
      },
    ];
    const { container } = render(<CS2BettingForm />);
    expect(
      container.querySelector(".record-summary-teams img"),
    ).toHaveAttribute("src", "/api/v1/cs2-matches/logo/local/navi.png");
  });
  it("preserves the logo when reading the saved registry", async () => {
    const actual = await vi.importActual<
      typeof import("@/hooks/useBettingForm")
    >("@/hooks/useBettingForm");
    const previous = localStorage.getItem("admin_risky_teams");
    try {
      localStorage.setItem(
        "admin_risky_teams",
        JSON.stringify([
          {
            name: "MIBR",
            game: "CS",
            logo: "/api/v1/cs2-matches/logo/local/mibr.png",
          },
        ]),
      );
      expect(actual.loadRiskyTeamsFromStorage()[0].logo).toBe(
        "/api/v1/cs2-matches/logo/local/mibr.png",
      );
    } finally {
      if (previous === null) localStorage.removeItem("admin_risky_teams");
      else localStorage.setItem("admin_risky_teams", previous);
    }
  });
});
