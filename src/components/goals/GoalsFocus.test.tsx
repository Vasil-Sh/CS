import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GoalsFocus from "./GoalsFocus";
import type { Goal, useGoals } from "@/hooks/useGoals";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, writeFileSync } from "node:fs";

afterEach(cleanup);
const goals: Goal[] = [
  { id: "a", name: "Накопичити 10 000 ₴", type: "amount", status: "active", isPrimary: true, currentAmount: 6400, targetAmount: 10000, createdAt: "2026-09-01" },
  { id: "b", name: "Стабільний ROI", type: "roi", status: "active", currentROI: 8, targetROI: 12, createdAt: "2026-09-01" },
  { id: "c", name: "Якість рішень", type: "winrate", status: "active", currentWinRate: 56, targetWinRate: 60, createdAt: "2026-09-01" },
];
function controller(data = goals) {
  return { goals: data, activeGoals: data.filter(g => g.status === "active"), completedGoals: data.filter(g => g.status === "completed"), activeTab: "active", setShowCreateDialog: vi.fn(), setActiveTab: vi.fn(), setPrimaryGoal: vi.fn(), confirmDeleteGoal: vi.fn(), getDisciplineStatus: () => ({ label: "Дотримані" }), isUpdating: false } as unknown as ReturnType<typeof useGoals>;
}
describe("GoalsFocus", () => {
  it("exports an isolated populated visual fixture when requested", () => {
    if (!process.env.GOALS_VISUAL_OUTPUT) return;
    const data: Goal[] = [...goals, ...["d", "e"].map(id => ({ id, name: "Виконана ціль", type: "amount" as const, status: "completed" as const, createdAt: "2026-09-01" }))];
    const html = renderToStaticMarkup(<GoalsFocus h={controller(data)}/>);
    const css = readFileSync("src/components/goals/GoalsFocus.css", "utf8");
    writeFileSync(process.env.GOALS_VISUAL_OUTPUT, `<!doctype html><html lang="uk"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Goals — isolated visual test</title><style>@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap');*{box-sizing:border-box}body{margin:0;font-family:Manrope,sans-serif}h1,h2,h3,p,dl,dd{margin:0}button{font:inherit;border:0;background:none;cursor:pointer}svg{vertical-align:middle}${css}</style>${html}</html>`);
    expect(html).toContain("Накопичити 10 000");
  });
  it("renders the approved populated layout without duplicating the primary goal", () => {
    render(<GoalsFocus h={controller()}/>);
    expect(screen.getAllByText("Накопичити 10 000 ₴")).toHaveLength(1);
    expect(screen.getByText("Інші цілі")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByRole("progressbar", { name: "Прогрес: Накопичити 10 000 ₴" })).toHaveAttribute("value", "64");
    expect(screen.getByRole("button", { name: "Активні · 2" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Створити ціль" })).toHaveLength(1);
  });
  it("opens inline details and selects a primary goal using existing handlers", () => {
    const h = controller(); render(<GoalsFocus h={h}/>);
    fireEvent.click(screen.getAllByRole("button", { name: "Деталі" })[0]);
    expect(screen.getByText(/Створено:/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Зробити основною: Стабільний ROI" }));
    expect(h.setPrimaryGoal).toHaveBeenCalledWith("b");
  });
  it("keeps an honest empty state and a single creation entry", () => {
    const h = controller([]); render(<GoalsFocus h={h}/>);
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    expect(screen.getByText("Немає активних цілей")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Оновити прогрес" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Створити ціль" }));
    expect(h.setShowCreateDialog).toHaveBeenCalledWith(true);
  });
});
