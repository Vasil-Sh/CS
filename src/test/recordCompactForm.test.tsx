import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import BettingFormMatchSection from "@/components/betting-form/BettingFormMatchSection";

afterEach(cleanup);
const data = {
  game: "CS2" as const,
  format: "BO3",
  betCategory: "Ординар",
  matchUrl: "https://www.hltv.org/matches/123",
  team1: "NAVI",
  team2: "G2",
  betType: "",
  selection: "NAVI",
  odds: "1.65",
  logoTeam1: "/navi.svg",
  logoTeam2: "/g2.svg",
};
function setup(overrides: Partial<typeof data> = {}) {
  const onFieldChange = vi.fn();
  const onUrlChange = vi.fn();
  const onParseUrl = vi.fn();
  const onAddToExpress = vi.fn();
  const view = render(
    <BettingFormMatchSection
      data={{ ...data, ...overrides }}
      hideHeading
      teamOptions={["NAVI", "G2", "NAVI"]}
      isParsing={false}
      isExpressFromMatches={false}
      expressEventsCount={0}
      classes={{
        input: "entry-native-select",
        selectTrigger: "entry-native-select",
        label: "",
        sectionTitle: "",
      }}
      onFieldChange={onFieldChange}
      onUrlChange={onUrlChange}
      onParseUrl={onParseUrl}
      onAddToExpress={onAddToExpress}
      extraPredictionSlot={
        <label>
          Сума ставки
          <input aria-label="Сума ставки" defaultValue="200" />
        </label>
      }
    />,
  );
  return { ...view, onFieldChange, onUrlChange, onParseUrl, onAddToExpress };
}
describe("compact match and prediction card", () => {
  it("keeps team, market, odds and stake together in the prediction row", () => {
    const { container } = setup();
    const row = container.querySelector(".entry-prediction-row")!;
    expect(row.children).toHaveLength(4);
    expect(row).toContainElement(screen.getByLabelText(/Вибір команди/));
    expect(row).toContainElement(screen.getByLabelText(/Тип прогнозу/));
    expect(row).toContainElement(screen.getByLabelText(/Коефіцієнт/));
    expect(row).toContainElement(screen.getByLabelText("Сума ставки"));
    expect(
      screen.getByLabelText(/Вибір команди/).querySelector("img"),
    ).toHaveAttribute("src", "/navi.svg");
  });
  it("preserves URL updates, parsing, team and odds editing", () => {
    const h = setup();
    fireEvent.change(screen.getByLabelText(/Посилання на матч/), {
      target: { value: "https://example.com/match" },
    });
    expect(h.onUrlChange).toHaveBeenCalledWith("https://example.com/match");
    fireEvent.click(screen.getByRole("button", { name: "Оновити" }));
    expect(h.onParseUrl).toHaveBeenCalledOnce();
    fireEvent.change(screen.getByLabelText(/Команда 1/), {
      target: { value: "Spirit" },
    });
    expect(h.onFieldChange).toHaveBeenCalledWith("team1", "Spirit");
    fireEvent.change(screen.getByLabelText(/Коефіцієнт/), {
      target: { value: "2.1" },
    });
    expect(h.onFieldChange).toHaveBeenCalledWith("odds", "2.1");
    expect(h.container.querySelectorAll("datalist option")).toHaveLength(2);
  });
  it("keeps dependent controls disabled until teams and selection exist", () => {
    setup({ team1: "", team2: "", selection: "", matchUrl: "" });
    expect(screen.getByLabelText(/Вибір команди/)).toBeDisabled();
    expect(screen.getByLabelText(/Тип прогнозу/)).toBeDisabled();
    expect(screen.getByRole("button", { name: "Оновити" })).toBeDisabled();
    expect(screen.getByLabelText(/Тип прогнозу/)).toHaveTextContent(
      "Оберіть прогноз",
    );
  });
  it("opens the existing market picker", () => {
    setup();
    fireEvent.click(screen.getByLabelText(/Тип прогнозу/));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Зберегти" })).toBeDisabled();
  });
  it("preserves adding an express event", () => {
    const h = setup({ betCategory: "Експрес" });
    fireEvent.click(
      screen.getByRole("button", { name: /Додати подію до експресу/ }),
    );
    expect(h.onAddToExpress).toHaveBeenCalledOnce();
  });
});
