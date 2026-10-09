import { describe, it, expect, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import BetShareCard, {
  shareMoney,
  shareResult,
  shareDate,
} from "@/components/BetShareCard";
import type { Bet } from "@/types/betting";
import { posterLines } from "@/components/PosterShareArtwork";

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
  it("moves the VS badge with the inter-team gap", () => {
    const { container, rerender } = render(
      <BetShareCard bet={{ ...bet, match: "Team Spirit vs ShindeN" }} />,
    );
    const shortTransform = container
      .querySelector("[data-poster-vs]")!
      .getAttribute("transform");
    rerender(<BetShareCard bet={bet} />);
    const longTransform = container
      .querySelector("[data-poster-vs]")!
      .getAttribute("transform");
    expect(shortTransform).not.toBe(longTransform);
    expect(shortTransform).toContain("rotate(-8 48 27)");
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
    expect(screen.getByText("—")).toBeTruthy();
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
    expect(screen.getByText("UNITED21")).toBeTruthy();
    expect(screen.getByText("SEASON 56")).toBeTruthy();
    expect(screen.getByText("GROUP C")).toBeTruthy();
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
    expect(screen.getByText(/A vs B/)).toBeTruthy();
    expect(screen.getByText(/C vs D/)).toBeTruthy();
  });
});
