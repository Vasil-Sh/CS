import { useState } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, it, expect } from "vitest";
import type { GoalType } from "@/hooks/useGoals";
import GoalTypeSelector from "./GoalTypeSelector";
afterEach(cleanup);
function Form() {
  const [type, setType] = useState<GoalType>("amount");
  return <><GoalTypeSelector value={type} onChange={setType} /><input aria-label="Назва" defaultValue="Моя ціль" /></>;
}
describe("Goal type selector", () => {
  it("shows four accessible choices with amount selected", () => {
    render(<Form />);
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.getByRole("radio", { name: "Сума" })).toBeChecked();
    expect(screen.getByText("Досягти заданої суми.")).toBeInTheDocument();
  });
  it("switches each type and its description without resetting the name", () => {
    render(<Form />);
    for (const [label, description] of [["ROI", "Відстежувати прибутковість ставок."], ["Win Rate", "Відстежувати частку перемог."], ["Лесенка", "Відстежувати кроки та банк."]]) {
      fireEvent.click(screen.getByRole("radio", { name: label }));
      expect(screen.getByRole("radio", { name: label })).toBeChecked();
      expect(screen.getByText(description)).toBeInTheDocument();
      expect(screen.getByLabelText("Назва")).toHaveValue("Моя ціль");
    }
  });
});
