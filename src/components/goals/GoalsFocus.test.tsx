import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import GoalsFocus from "./GoalsFocus";
import type { Goal, useGoals } from "@/hooks/useGoals";
afterEach(cleanup);
const goals: Goal[] = [
  {
    id: "a",
    name: "Накопичити",
    type: "amount",
    status: "active",
    isPrimary: true,
    currentAmount: 6400,
    targetAmount: 10000,
    createdAt: "2026-09-01",
  },
  {
    id: "b",
    name: "Стабільний ROI",
    type: "roi",
    status: "active",
    currentROI: 8,
    targetROI: 12,
    createdAt: "2026-09-01",
  },
];
function controller(data = goals) {
  return {
    goals: data,
    activeGoals: data,
    completedGoals: [],
    activeTab: "active",
    setShowCreateDialog: vi.fn(),
    setActiveTab: vi.fn(),
    handleManualUpdate: vi.fn(),
    isUpdating: false,
  } as unknown as ReturnType<typeof useGoals>;
}
describe("Goals master detail", () => {
  it("shows a circular active-card progress and remaining amount", () => {
    render(<GoalsFocus h={controller()} />);
    const card = screen.getByRole("button", { name: /Накопичити/ });
    expect(card).toHaveClass("goals-active-card");
    expect(within(card).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "64",
    );
    expect(within(card).getByText(/Залишилось/)).toHaveTextContent(
      "Залишилось 3 600 ₴",
    );
  });
  it("keeps ladder progress based on steps while displaying the bank balance", () => {
    render(
      <GoalsFocus
        h={controller([
          {
            ...goals[0],
            type: "ladder",
            currentBank: 100,
            targetLadderAmount: 100000,
            currentStep: 0,
            totalSteps: 27,
          },
        ])}
      />,
    );
    const card = screen.getByRole("button", { name: /Накопичити/ });
    expect(within(card).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    expect(within(card).getByText(/Залишилось/)).toHaveTextContent(
      "Залишилось 99 900 ₴",
    );
  });
  it("caps the ring at 100 and never shows a negative remainder", () => {
    render(
      <GoalsFocus h={controller([{ ...goals[0], currentAmount: 12000 }])} />,
    );
    const card = screen.getByRole("button", { name: /Накопичити/ });
    expect(within(card).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    expect(within(card).getByText(/Залишилось/)).toHaveTextContent(
      "Залишилось 0 ₴",
    );
  });
  it("leaves the completed-goal rows in their existing layout", () => {
    const h = controller([{ ...goals[0], status: "completed" }]);
    h.activeTab = "completed";
    render(<GoalsFocus h={h} />);
    expect(screen.getByRole("button", { name: /Накопичити/ })).not.toHaveClass(
      "goals-active-card",
    );
  });
  it("searches legacy numeric names without crashing", () => {
    render(
      <GoalsFocus
        h={controller([{ ...goals[0], name: 123 as unknown as string }])}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Пошук цілі" }), {
      target: { value: "123" },
    });
    expect(screen.getByRole("button", { name: /123/ })).toBeInTheDocument();
  });
  it("shows progress source in details and switches on selection", () => {
    render(<GoalsFocus h={controller()} />);
    const panel = screen.getByRole("region", { name: "Деталі цілі" });
    expect(
      within(panel).getByRole("heading", { name: "Джерело прогресу" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Стабільний ROI/ }));
    expect(
      within(panel).getByRole("heading", { name: "Стабільний ROI" }),
    ).toBeInTheDocument();
  });
  it("selects the primary goal and switches details by selecting a row", () => {
    render(<GoalsFocus h={controller()} />);
    const panel = screen.getByRole("region", { name: "Деталі цілі" });
    expect(
      within(panel).getByRole("heading", { name: /Накопичити/ }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Стабільний ROI/ }));
    expect(
      within(panel).getByRole("heading", { name: "Стабільний ROI" }),
    ).toBeInTheDocument();
    expect(within(panel).queryByRole("progressbar")).not.toBeInTheDocument();
  });
  it("searches and clears stale details for no matches", () => {
    render(<GoalsFocus h={controller()} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Пошук цілі" }), {
      target: { value: "немає" },
    });
    expect(screen.getByText("Нічого не знайдено")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Дії вибраної цілі" }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Пошук цілі" }), {
      target: { value: "ROI" },
    });
    expect(
      screen.getByRole("button", { name: /Стабільний ROI/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });
  it("renders a full-width empty state and retains creation", () => {
    const h = controller([]);
    render(<GoalsFocus h={h} />);
    expect(
      screen.getByText("Наступна ціль починається тут"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Деталі цілі" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole("region", { name: "Мої цілі" })).getByRole(
        "button",
        { name: "Створити ціль" },
      ),
    );
    expect(h.setShowCreateDialog).toHaveBeenCalledWith(true);
  });
  it("uses the existing progress handler", () => {
    const h = controller();
    render(<GoalsFocus h={h} />);
    fireEvent.click(screen.getByRole("button", { name: "Оновити прогрес" }));
    expect(h.handleManualUpdate).toHaveBeenCalledOnce();
  });
});
