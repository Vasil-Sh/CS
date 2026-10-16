import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import GoalPickerModal, {
  goalPickerProgress,
} from "@/components/betting-form/GoalPickerModal";
import type { Goal } from "@/components/betting-form/types";

afterEach(cleanup);
const goals: Goal[] = [
  {
    id: "ladder",
    name: "Драбина до цілі",
    type: "ladder",
    status: "active",
    currentStep: 3,
    totalSteps: 27,
  },
  {
    id: "bank",
    name: "Банк на турнір",
    type: "amount",
    status: "active",
    isPrimary: true,
    currentAmount: 25000,
    targetAmount: 100000,
  },
];
function setup(selectedGoalId = "", items = goals) {
  const props = {
    open: true,
    goals: items,
    selectedGoalId,
    onSelect: vi.fn(),
    onOpenChange: vi.fn(),
  };
  return { ...render(<GoalPickerModal {...props} />), props };
}
const pick = (name: string) =>
  screen.getByRole("button", { name: new RegExp(name) });
describe("goal picker redesign", () => {
  it("shows the header, separate goal metadata, real progress and primary badge", () => {
    setup();
    expect(screen.getByRole("dialog", { name: "Оберіть ціль" })).toBeVisible();
    expect(screen.getByText("2 активні цілі")).toBeVisible();
    expect(
      within(pick("Банк на турнір")).getByText("Фінансова ціль"),
    ).toBeVisible();
    expect(within(pick("Банк на турнір")).getByText("Основна")).toBeVisible();
    expect(within(pick("Банк на турнір")).getByText("25%")).toBeVisible();
    expect(
      within(pick("Драбина до цілі")).getByText("Драбина · крок 3 із 27"),
    ).toBeVisible();
  });
  it("keeps a selection provisional until confirmation", () => {
    const { props } = setup();
    fireEvent.click(pick("Банк на турнір"));
    expect(props.onSelect).not.toHaveBeenCalled();
    expect(props.onOpenChange).not.toHaveBeenCalled();
    expect(pick("Банк на турнір")).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector(".gpm-selected")).toHaveTextContent(
      "Банк на турнір",
    );
    fireEvent.click(pick("^Обрати ціль$"));
    expect(props.onSelect).toHaveBeenCalledTimes(1);
    expect(props.onSelect).toHaveBeenCalledWith("bank");
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });
  it("cancels without saving and resets draft/search on reopening", () => {
    const { props, rerender } = setup("bank");
    fireEvent.click(pick("Драбина до цілі"));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "драбина" },
    });
    fireEvent.click(pick("Скасувати"));
    expect(props.onSelect).not.toHaveBeenCalled();
    rerender(<GoalPickerModal {...props} open={false} />);
    rerender(<GoalPickerModal {...props} open />);
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(pick("Банк на турнір")).toHaveAttribute("aria-pressed", "true");
  });
  it.each(["Закрити вибір цілі", "Escape"])(
    "dismisses with %s without applying changes",
    (action) => {
      const { props } = setup("bank");
      fireEvent.click(pick("Драбина до цілі"));
      if (action === "Escape")
        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
      else fireEvent.click(pick(action));
      expect(props.onSelect).not.toHaveBeenCalled();
      expect(props.onOpenChange).toHaveBeenCalledWith(false);
    },
  );
  it("confirms removal of the goal using the existing all sentinel", () => {
    const { props } = setup("bank");
    fireEvent.click(pick("Без цілі"));
    expect(props.onSelect).not.toHaveBeenCalled();
    fireEvent.click(pick("^Обрати ціль$"));
    expect(props.onSelect).toHaveBeenCalledWith("all");
  });
  it("searches case-insensitively, trims spaces and keeps the draft when filtered out", () => {
    setup("ladder");
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "  БАНК  " },
    });
    expect(pick("Банк на турнір")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /Драбина до цілі/ }),
    ).not.toBeInTheDocument();
    expect(document.querySelector(".gpm-selected")).toHaveTextContent(
      "Драбина до цілі",
    );
    fireEvent.click(pick("Очистити пошук"));
    expect(pick("Драбина до цілі")).toHaveAttribute("aria-pressed", "true");
  });
  it("sorts the primary first without mutating incoming goals and excludes completed goals", () => {
    const frozen = Object.freeze([
      ...goals,
      {
        ...goals[0],
        id: "done",
        name: "Завершена",
        status: "completed" as const,
      },
    ]);
    setup("", frozen as unknown as Goal[]);
    const options = within(
      screen.getByRole("group", { name: "Доступні цілі" }),
    ).getAllByRole("button");
    expect(options[1]).toHaveTextContent("Банк на турнір");
    expect(frozen[0].id).toBe("ladder");
    expect(screen.queryByText("Завершена")).not.toBeInTheDocument();
  });
  it("handles empty goals and no search results", () => {
    const h = setup("", []);
    expect(screen.getByText("0 активних цілей")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Поки немає активних цілей",
    );
    h.rerender(<GoalPickerModal {...h.props} goals={goals} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "неіснуюча" },
    });
    expect(screen.getByRole("status")).toHaveTextContent("Нічого не знайдено");
  });
  it("does not save a goal that was removed while the picker is open", () => {
    const h = setup("bank");
    h.rerender(<GoalPickerModal {...h.props} goals={[]} />);
    expect(pick("^Обрати ціль$")).toBeDisabled();
    fireEvent.click(pick("Без цілі"));
    expect(pick("^Обрати ціль$")).toBeEnabled();
  });
});
describe("goal progress", () => {
  it("supports all goal types with bounded progress", () => {
    expect(goalPickerProgress(goals[1]).percent).toBe(25);
    expect(goalPickerProgress({ ...goals[0], currentStep: 30 }).percent).toBe(
      100,
    );
    expect(
      goalPickerProgress({ ...goals[1], currentAmount: -10 }).percent,
    ).toBe(0);
    expect(
      goalPickerProgress({
        ...goals[1],
        type: "roi",
        currentROI: 5,
        targetROI: 10,
      }).percent,
    ).toBe(50);
    expect(
      goalPickerProgress({
        ...goals[1],
        type: "winrate",
        currentWinRate: 60,
        targetWinRate: 80,
      }).percent,
    ).toBe(75);
  });
  it("does not invent percentages for invalid/missing targets", () => {
    for (const targetAmount of [0, undefined, NaN, Infinity]) {
      expect(
        goalPickerProgress({ ...goals[1], targetAmount }).percent,
      ).toBeNull();
    }
  });
});
