import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublicProfile from "@/pages/PublicProfile";
import {
  displayValue,
  readProfileFilters,
  type PublicProfileData,
} from "@/components/public-profile/publicProfileModel";

const fixture: PublicProfileData = {
  schemaVersion: 2,
  username: "admin",
  filters: { game: "all", period: "all" },
  exchangeRate: 45.13,
  exchangeRateSource: "profile",
  stats: {
    totalBets: 3,
    completedBets: 3,
    pendingBets: 0,
    wins: 3,
    losses: 0,
    refunds: 0,
    winRate: 100,
    roi: 38,
    avgOdds: 1.68,
    displayProfit: 1867.94,
    profitUAH: 378.65,
    profitUSD: 33,
    conversionComplete: true,
  },
  monthlyProfit: [
    { month: "2026-08", profit: 178.65, count: 1 },
    { month: "2026-10", profit: 1689.29, count: 2 },
  ],
  recentBets: [
    {
      match: "Falcons vs TYLOO",
      team1: "Falcons",
      team2: "TYLOO",
      game: "CS2",
      currency: "UAH",
      date: "2026-10-03",
      profit: 200,
      odds: 2,
      result: "Win",
    },
  ],
};
const mount = (url = "/user/admin") =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/user/:username" element={<PublicProfile />} />
      </Routes>
    </MemoryRouter>,
  );
const mockApi = () =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const query = new URL(url, "http://localhost").searchParams;
      const filters = readProfileFilters(query);
      const empty = filters.game === "dota2";
      return {
        ok: true,
        json: async () => ({
          ...fixture,
          filters,
          ...(empty
            ? {
                stats: {
                  ...fixture.stats,
                  totalBets: 0,
                  completedBets: 0,
                  wins: 0,
                  displayProfit: 0,
                  winRate: null,
                  roi: null,
                  avgOdds: null,
                  profitUAH: 0,
                  profitUSD: 0,
                },
                recentBets: [],
                monthlyProfit: [],
              }
            : {}),
        }),
      };
    }),
  );
beforeEach(mockApi);
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
describe("Public profile screen", () => {
  it("renders real stats, all-game identity and readable match records", async () => {
    mount();
    expect(await screen.findByText("100%")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Картка admin: Усі ігри" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Falcons")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Статистика профілю @admin" }),
    ).toBeInTheDocument();
  });
  it("uses a single global filter and fetches aggregates, not just recent-row filtering", async () => {
    mount();
    await screen.findByText("100%");
    fireEvent.click(
      within(
        screen.getByRole("group", { name: "Гра для всієї статистики" }),
      ).getByRole("button", { name: "Dota 2" }),
    );
    expect(
      await screen.findByText("За цими фільтрами ставок немає"),
    ).toBeInTheDocument();
    expect(screen.queryByText("100%")).not.toBeInTheDocument();
    expect(screen.queryByText("Falcons")).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Картка admin: Dota 2" }),
    ).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.at(-1)?.[0]).toContain("game=dota2");
  });
  it("restores game and period from a shared URL and updates the cover", async () => {
    mount("/user/admin?game=cs2&period=90d");
    await screen.findByText("100%");
    expect(screen.getByRole("button", { name: "CS2" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("Період статистики")).toHaveValue("90d");
    expect(
      screen.getByRole("region", { name: "Картка admin: CS2" }),
    ).toBeInTheDocument();
  });
  it("changes currency for summaries and graph but keeps original journal currency", async () => {
    mount();
    await screen.findByText("100%");
    fireEvent.click(screen.getByRole("button", { name: "USD" }));
    expect(screen.getByRole("button", { name: "USD" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("+200 ₴")).toBeInTheDocument();
    expect(
      document.querySelector(".public-main-profit strong")?.textContent,
    ).toContain("$");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("requests a scoped period and resets filters from the empty state", async () => {
    mount("/user/admin?game=dota2");
    await screen.findByText("За цими фільтрами ставок немає");
    fireEvent.change(screen.getByLabelText("Період статистики"), {
      target: { value: "30d" },
    });
    await waitFor(() =>
      expect(vi.mocked(fetch).mock.calls.at(-1)?.[0]).toContain("period=30d"),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Показати всі ставки" }),
    );
    expect(await screen.findByText("100%")).toBeInTheDocument();
  });
  it("handles missing profiles and retries failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValue({ ok: true, json: async () => fixture }),
    );
    mount();
    expect(await screen.findByText("Профіль не знайдено")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Спробувати ще раз" }));
    expect(await screen.findByText("100%")).toBeInTheDocument();
  });
  it("does not silently use unfiltered responses from an old backend", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...fixture, schemaVersion: undefined }),
      }),
    );
    mount("/user/admin?game=dota2");
    expect(
      await screen.findByText(/перезапустити сервер API/),
    ).toBeInTheDocument();
    expect(screen.queryByText("100%")).not.toBeInTheDocument();
  });
  it("copies the share link and provides explicit success feedback", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    mount();
    await screen.findByText("100%");
    fireEvent.click(screen.getByRole("button", { name: "Поділитися" }));
    expect(
      await screen.findByRole("button", { name: "Скопійовано" }),
    ).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(window.location.href);
  });
  it("offers a manual copy fallback if clipboard access is denied", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
      configurable: true,
    });
    mount();
    await screen.findByText("100%");
    fireEvent.click(screen.getByRole("button", { name: "Поділитися" }));
    expect(await screen.findByLabelText("Посилання на профіль")).toHaveValue(
      window.location.href,
    );
  });
  it("handles negative chart values and large totals without hiding the sign", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...fixture,
          stats: { ...fixture.stats, displayProfit: -500 },
          monthlyProfit: [{ month: "2026-10", profit: -500, count: 1 }],
        }),
      }),
    );
    mount();
    await screen.findByText("100%");
    expect(document.querySelector(".public-main-profit strong")).toHaveClass(
      "public-negative",
    );
    expect(document.querySelector(".public-chart-bar")).toHaveClass(
      "is-negative",
    );
  });
});
describe("Public formatting", () => {
  it("normalizes untrusted URL filters without accepting arbitrary values", () => {
    expect(
      readProfileFilters(
        new URLSearchParams("game=bad&period=bad&currency=bad"),
      ),
    ).toEqual({ game: "all", period: "all", currency: "UAH" });
  });
  it("does not invent a missing currency rate", () => {
    expect(displayValue(100, "USD", null)).toBeNull();
    expect(displayValue(100, "UAH", null)).toBe(100);
  });
});
