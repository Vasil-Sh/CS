import { describe, it, expect, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach } from "vitest";
import BetShareCard, {
  shareMoney,
  shareResult,
  shareDate,
} from "@/components/BetShareCard";
import type { Bet } from "@/types/betting";
import { posterLines } from "@/components/PosterShareArtwork";
import {
  expressShareRows,
  expressEventCount,
} from "@/components/ExpressShareArtwork";

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    disconnect() {}
  },
);
afterEach(cleanup);
const bet: Bet = {
  match: "ex-Eternal Fire Academy vs OldMix",
  betType: "Match Winner - ex-Eternal Fire Academy",
  odds: 2,
  amount: 200,
  date: "2026-10-02",
  result: "Loss",
  profit: -200,
  tournament: "UNITED21 SEASON 56 — GROUP C",
};
describe("Share card", () => {
  it("parses and translates real express legs without recomputing totals", () => {
    const rows = expressShareRows(
      [
        "1. GamerLegion vs MOUZ | Handicap +1.5: GamerLegion @1.14",
        "2. B8 vs Team Spirit | Map2_MapWinner: Team Spirit @1.1",
      ],
      "BO3",
    );
    expect(rows[0]).toMatchObject({
      match: "GamerLegion — MOUZ",
      market: "Фора +1.5",
      selection: "GamerLegion",
      odds: "1.14",
    });
    expect(rows[1].market).toBe("Карта 2: Переможець карти");
    expect(rows[1].odds).toBe("1.10");
  });
  it("keeps malformed events and does not invent missing odds", () => {
    const rows = expressShareRows([
      "1. A vs B | unknown legacy prediction",
      "unstructured legacy event",
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].detail).toBe("unknown legacy prediction");
    expect(rows[0].odds).toBe("—");
    expect(rows[1].match).toBe("unstructured legacy event");
  });
  it.each([
    [1, "1 подія"],
    [2, "2 події"],
    [5, "5 подій"],
    [11, "11 подій"],
    [21, "21 подія"],
  ])("localizes %s events", (count, label) => {
    expect(expressEventCount(Number(count))).toBe(label);
  });
  it("uses the ticket artwork and preserves stored express summary values", () => {
    const { container } = render(
      <BetShareCard
        bet={{
          ...bet,
          match: "Експрес 2x",
          format: "2x",
          odds: 1.72,
          originalAmount: 250,
          originalProfit: 178.65,
          result: "Win",
          betType:
            "Експрес 2x | 1. A vs B | Handicap +1.5: A @1.14 • 2. C vs D | Handicap +1.5: D @1.13",
        }}
      />,
    );
    expect(
      container.querySelector('svg[data-share-artwork="ticket"]'),
    ).toBeTruthy();
    expect(container.querySelectorAll("[data-express-row]")).toHaveLength(2);
    expect(screen.getByText("1.72")).toBeTruthy();
    expect(screen.getByText("+178,65 ₴")).toBeTruthy();
    expect(screen.getByText("250 ₴")).toBeTruthy();
    expect(
      container.querySelector("[data-poster-odds]")?.closest("[filter]"),
    ).toBeNull();
    expect(
      container.querySelector("[data-poster-status]")?.closest("[filter]"),
    ).toBeNull();
  });
  it("shows an honest empty state for legacy express records", () => {
    render(
      <BetShareCard
        bet={{ ...bet, format: "5x", betType: "Експрес 5x", result: "Pending" }}
      />,
    );
    expect(screen.getByText("Деталі подій не збережені")).toBeTruthy();
    expect(screen.getByRole("img", { name: /5 подій/ })).toBeTruthy();
    expect(screen.getByText("ОЧІКУЄТЬСЯ")).toBeTruthy();
  });
  it.each(["Win", "Loss", "Pending"] as const)(
    "keeps odds and %s status free of grain filters",
    (result) => {
      const { container } = render(<BetShareCard bet={{ ...bet, result }} />);
      for (const selector of ["[data-poster-odds]", "[data-poster-status]"]) {
        const group = container.querySelector(selector)!;
        expect(group).toBeTruthy();
        expect(group.closest("[filter]")).toBeNull();
        expect(group.querySelector("[filter]")).toBeNull();
      }
    },
  );
  it.each(["horizontal", "square"] as const)(
    "centers the tournament above teams in %s",
    (format) => {
      const { container } = render(<BetShareCard bet={bet} format={format} />);
      const tournament = container.querySelector("[data-ticket-tournament]")!;
      const teams = container.querySelectorAll("[data-ticket-team]");
      expect(tournament.getAttribute("text-anchor")).toBe("middle");
      for (const team of teams) {
        expect(Number(tournament.getAttribute("y"))).toBeLessThan(
          Number(team.getAttribute("y")),
        );
      }
      expect(screen.getByText("VS")).toBeTruthy();
    },
  );
  it("uses a level solid red loss badge with white text", () => {
    const { container } = render(
      <BetShareCard bet={{ ...bet, result: "Loss" }} />,
    );
    const status = container.querySelector("[data-poster-status]")!;
    expect(status.getAttribute("transform")).not.toContain("rotate");
    expect(status.querySelector("rect")?.getAttribute("fill")).toBe("#df263b");
    expect(status.querySelector("rect")?.hasAttribute("fill-opacity")).toBe(
      false,
    );
    expect(status.querySelector("text")?.getAttribute("fill")).toBe("#ffffff");
  });
  it("gives square singles a top stub and inline odds", () => {
    const { container } = render(<BetShareCard bet={bet} format="square" />);
    expect(container.querySelector("[data-ticket-square-header]")).toBeTruthy();
    expect(
      container.querySelector("[data-ticket-stub]")?.getAttribute("height"),
    ).toBe("128");
    expect(
      Number(container.querySelector("[data-poster-odds]")?.getAttribute("x")),
    ).toBeGreaterThan(500);
    const view = container
      .querySelector("svg[data-share-artwork]")!
      .getAttribute("viewBox")!
      .split(" ");
    expect(view[2]).toBe(view[3]);
  });
  it("uses a compact horizontal canvas", () => {
    const { container } = render(<BetShareCard bet={bet} />);
    expect(
      container
        .querySelector("svg[data-share-artwork]")
        ?.getAttribute("viewBox")
        ?.split(" ")[2],
    ).toBe("1060");
  });
  it("shows the tournament logo and restores a trophy when it fails", () => {
    const { container } = render(
      <BetShareCard bet={{ ...bet, tournamentLogo: "/tournament.png" }} />,
    );
    const mark = container.querySelector("[data-ticket-tournament-icon]")!;
    const logo = mark.querySelector("image")!;
    expect(logo.getAttribute("href")).toBe("/tournament.png");
    fireEvent.load(logo);
    expect(
      mark.querySelector("[data-logo-fallback]")?.getAttribute("visibility"),
    ).toBe("hidden");
    fireEvent.error(logo);
    expect(mark.querySelector("image")).toBeNull();
    expect(
      mark.querySelector("[data-logo-fallback]")?.getAttribute("visibility"),
    ).toBe("visible");
    expect(mark.querySelector("path")).toBeTruthy();
  });
  it("grows the ticket for long names without discarding text", () => {
    const { container, rerender } = render(
      <BetShareCard bet={{ ...bet, match: "Team Spirit vs ShindeN" }} />,
    );
    const shortHeight = Number(
      container
        .querySelector("svg[data-share-artwork]")!
        .getAttribute("viewBox")!
        .split(" ")[3],
    );
    rerender(
      <BetShareCard
        bet={{ ...bet, team1: "Very long team name ".repeat(8) }}
      />,
    );
    const longHeight = Number(
      container
        .querySelector("svg[data-share-artwork]")!
        .getAttribute("viewBox")!
        .split(" ")[3],
    );
    expect(longHeight).toBeGreaterThan(shortHeight);
  });
  it("wraps long names without discarding words", () => {
    expect(posterLines("ex-Eternal Fire Academy", 19).join(" ")).toBe(
      "ex-Eternal Fire Academy",
    );
    expect(
      posterLines("A".repeat(80), 19).every((line) => line.length <= 19),
    ).toBe(true);
  });
  it("renders pending without a fabricated financial result", () => {
    render(<BetShareCard bet={{ ...bet, result: "Pending" }} />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: /Очікується/ })).toBeTruthy();
  });
  it("renders winning values from the record", () => {
    render(
      <BetShareCard bet={{ ...bet, result: "Win", originalProfit: 200 }} />,
    );
    expect(screen.getByText("+200 ₴")).toBeTruthy();
    expect(screen.getByText("ВИГРАШ")).toBeTruthy();
  });
  it("renders actual tournament, selection and loss", () => {
    render(<BetShareCard bet={bet} />);
    expect(screen.getByText("UNITED21 SEASON 56 · GROUP C")).toBeTruthy();
    expect(screen.getByText("−200 ₴")).toBeTruthy();
    expect(screen.getByText("Програш")).toBeTruthy();
    expect(
      screen.getByRole("img", { name: /ex-Eternal Fire Academy — OldMix/ }),
    ).toBeTruthy();
    expect(screen.getByText("ex-Eternal Fire Academy")).toBeTruthy();
  });
  it("does not invent a time for date-only records", () => {
    expect(shareDate("2026-10-02")).toEqual({ date: "02.10.2026", time: "" });
  });
  it("removes monetary values from the exported SVG when hidden", () => {
    const { container } = render(
      <BetShareCard bet={bet} showAmounts={false} />,
    );
    const svg = container.querySelector("svg[data-share-artwork]")!;
    expect(svg.textContent).not.toContain("200 ₴");
    expect(svg.querySelector("[data-ticket-amounts]")).toBeNull();
    expect(screen.getByText("Суми приховано")).toBeTruthy();
    expect(screen.getByText("2.00")).toBeTruthy();
  });
  it("renders a genuinely square export, including long express records", () => {
    const { container } = render(
      <BetShareCard
        bet={{
          ...bet,
          format: "20x",
          betType: `Експрес | ${Array.from({ length: 20 }, (_, i) => `${i + 1}. Team A vs Team B | Winner: Team A @1.5`).join(" • ")}`,
        }}
        format="square"
      />,
    );
    const view = container
      .querySelector("svg[data-share-artwork]")!
      .getAttribute("viewBox")!
      .split(" ");
    expect(view[2]).toBe(view[3]);
    expect(container.querySelectorAll("[data-express-row]")).toHaveLength(20);
  });
  it("uses record logos with an initials fallback", () => {
    const { container } = render(
      <BetShareCard bet={{ ...bet, logoTeam1: "/team.png" }} />,
    );
    expect(
      container
        .querySelector("image[data-optional-logo]")
        ?.getAttribute("href"),
    ).toBe("/team.png");
    expect(container.querySelectorAll("[data-logo-fallback]")).toHaveLength(3);
  });
  it("shows a real supplied time", () =>
    expect(shareDate("2026-10-02T13:30:00").time).toBe("13:30"));
  it("does not treat pending as settled", () =>
    expect(shareResult({ ...bet, result: "Pending" })).toBeNull());
  it("preserves original zero values", () =>
    expect(shareResult({ ...bet, originalProfit: 0 })).toBe(0));
  it("converts USD profit only with an exchange rate", () => {
    expect(
      shareResult({ ...bet, currency: "USD", profit: 400, exchangeRate: 40 }),
    ).toBe(10);
    expect(shareResult({ ...bet, currency: "USD", profit: 400 })).toBeNull();
  });
  it("formats winnings and losses in original currency", () => {
    expect(shareMoney(33, "USD", true)).toBe("+33 $");
    expect(shareMoney(-200)).toBe("−200 ₴");
  });
  it("includes all express events in exported content", () => {
    render(
      <BetShareCard
        bet={{
          ...bet,
          format: "2x",
          betType:
            "Експрес | 1. A vs B | Winner: A @1.2 • 2. C vs D | Winner: D @1.5",
        }}
      />,
    );
    expect(screen.getByText(/A — B/)).toBeTruthy();
    expect(screen.getByText(/C — D/)).toBeTruthy();
  });
});
