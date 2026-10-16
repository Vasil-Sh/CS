import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import BetTypePickerModal from "@/components/betting-form/BetTypePickerModal";

afterEach(cleanup);
function setup(value = "", format = "BO3") {
  const props = { value, format, onSave: vi.fn(), onClose: vi.fn() };
  return { ...render(<BetTypePickerModal {...props} />), props };
}
function click(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}
describe("prediction type picker", () => {
  it("shows the compact layout and requires a choice", () => {
    setup();
    expect(screen.getByRole("dialog", { name: "Тип прогнозу" })).toBeVisible();
    expect(screen.getAllByRole("tab")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Зберегти" })).toBeDisabled();
    expect(
      screen.getByRole("combobox", { name: "Тотал карт: Менше" }),
    ).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Фора: Плюс" })).toBeVisible();
  });
  it("saves only on explicit confirmation", () => {
    const { props } = setup();
    click("Переможець матчу");
    expect(props.onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Переможець матчу");
    click("Зберегти");
    expect(props.onSave).toHaveBeenCalledWith("Match Winner");
    expect(props.onClose).toHaveBeenCalledOnce();
  });
  it.each(["Скасувати", "Закрити вибір прогнозу", "Escape"])(
    "%s preserves the saved market",
    (action) => {
      const { props } = setup("Handicap +1.5");
      click("Переможець матчу");
      if (action === "Escape")
        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
      else click(action);
      expect(props.onSave).not.toHaveBeenCalled();
      expect(props.onClose).toHaveBeenCalledOnce();
    },
  );
  it("clears provisionally and allows confirming removal", () => {
    const { props } = setup("Match Winner");
    click("Очистити");
    expect(props.onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Нічого не обрано");
    click("Зберегти");
    expect(props.onSave).toHaveBeenCalledWith("");
  });
  it.each([
    ["BO1", 2],
    ["BO3", 4],
    ["BO5", 6],
  ])("respects %s map count", (format, count) => {
    setup("", String(format));
    expect(screen.getAllByRole("tab")).toHaveLength(count as number);
  });
  it("opens the saved map and retains its full identifier", () => {
    const { props } = setup("Map2_MapWinner");
    expect(screen.getByRole("tab", { name: "Карта 2" })).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(
      screen.getByRole("button", { name: "Переможець карти" }),
    ).toHaveAttribute("aria-pressed", "true");
    click("Зберегти");
    expect(props.onSave).toHaveBeenCalledWith("Map2_MapWinner");
  });
  it("only displays a saved total in the matching direction", () => {
    setup("Total Maps Over 2.5");
    expect(
      screen.getByRole("combobox", { name: "Тотал карт: Більше" }),
    ).toHaveTextContent("Більше 2.5");
    expect(
      screen.getByRole("combobox", { name: "Тотал карт: Менше" }),
    ).toHaveTextContent("Менше");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Тотал карт: Більше 2.5",
    );
  });
  it("preserves a saved handicap alias rather than dropping its selected state", () => {
    const { props } = setup("Map1_HC_T2-2.5");
    expect(
      screen.getByRole("combobox", { name: "Карта 1: Фора: Мінус" }),
    ).toHaveTextContent("-2.5");
    click("Зберегти");
    expect(props.onSave).toHaveBeenCalledWith("Map1_HC_T2-2.5");
  });
});
