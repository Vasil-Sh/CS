import {
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  act,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProfileOverview from "@/components/profile/ProfileOverview";
import {
  recentRecords,
  recordSummary,
} from "@/components/profile/profileModel";
import { useTheme } from "@/hooks/useTheme";
import { UserDataService } from "@/lib/userDataService";
import type { Bet } from "@/types/betting";

const data = vi.hoisted(() => ({ bets: [] as Bet[], isLoading: false }));
vi.mock("@/contexts/DataContext", () => ({ useData: () => data }));
vi.mock("@/lib/userDataService", () => ({
  UserDataService: {
    getUserData: vi.fn((_user, _key, fallback) => fallback),
    setUserDataSync: vi.fn(),
    fetchUserPrefs: vi.fn().mockResolvedValue({ preferences: {} }),
    saveUserPrefs: vi.fn().mockResolvedValue({ preferences: {} }),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const makeBet = (overrides: Partial<Bet> = {}): Bet => ({
  id: "first",
  match: "Falcons vs TYLOO",
  team1: "Falcons",
  team2: "TYLOO",
  game: "CS2",
  betType: "Перемога - Falcons",
  odds: 2,
  amount: 200,
  date: "2026-10-02",
  createdAt: "2026-10-02T15:24:00Z",
  result: "Win",
  ...overrides,
});
const props = () => ({
  username: "admin",
  stats: { bets: 3, riskyTeams: 90, strategies: 0, goals: 2, tgGroups: 3 },
  theme: "light" as const,
  language: "uk" as const,
  exchangeRate: 45.13,
  isFetchingRate: false,
  onThemeChange: vi.fn(),
  onLanguageChange: vi.fn(),
  onExchangeRateChange: vi.fn(),
  onFetchRate: vi.fn(),
  lastBackupDate: null,
  needsBackupReminder: true,
  onOpenBackup: vi.fn(),
});
function show(p = props()) {
  return {
    ...render(
      <MemoryRouter>
        <ProfileOverview {...p} />
      </MemoryRouter>,
    ),
    p,
  };
}

beforeEach(() => {
  data.bets = [makeBet()];
  data.isLoading = false;
  localStorage.clear();
  vi.clearAllMocks();
  vi.mocked(UserDataService.saveUserPrefs).mockResolvedValue({
    maxStakePercent: 7,
    preferences: {},
  });
});
afterEach(() => {
  cleanup();
  document.documentElement.classList.remove("dark");
  vi.unstubAllGlobals();
});

describe("profile overview", () => {
  it("uses live counts and correct goal route without decorative settings icons", () => {
    show();
    expect(screen.getByRole("link", { name: "1 Ваші ставки" })).toHaveAttribute(
      "href",
      "/app/my-bets",
    );
    expect(screen.getByRole("link", { name: "2 Цілі" })).toHaveAttribute(
      "href",
      "/app/goals",
    );
    expect(screen.getByRole("link", { name: "0 Стратегії" })).toHaveAttribute(
      "href",
      "/app/strategy",
    );
    expect(
      screen.getByRole("heading", { name: "Публічний профіль" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Тема інтерфейсу").querySelector("svg")).toBeNull();
  });
  it("supports the three theme choices and backup navigation", () => {
    const { p } = show();
    expect(screen.getByRole("radio", { name: "Світла" })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "Системна" }));
    expect(p.onThemeChange).toHaveBeenCalledWith("system");
    fireEvent.click(screen.getByRole("button", { name: "Відкрити бекап" }));
    expect(p.onOpenBackup).toHaveBeenCalledOnce();
  });
  it("validates a rate and accepts decimal commas, without saving unchanged values", () => {
    const { p } = show();
    const input = screen.getByLabelText("Курс USD → UAH");
    fireEvent.blur(input);
    expect(p.onExchangeRateChange).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "0" } });
    fireEvent.blur(input);
    expect(screen.getByRole("alert")).toHaveTextContent("більший за нуль");
    expect(p.onExchangeRateChange).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "45,25" } });
    fireEvent.blur(input);
    expect(p.onExchangeRateChange).toHaveBeenCalledWith(45.25);
  });
  it("shows a useful empty state without fabricated activity", () => {
    data.bets = [];
    show();
    expect(screen.getByText("Ваш журнал починається тут")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Деталі:/ }),
    ).not.toBeInTheDocument();
  });
  it("links each activity record to the journal", () => {
    show();
    expect(
      screen.getByRole("link", { name: "Деталі: Falcons vs TYLOO" }),
    ).toHaveAttribute("href", "/app/my-bets");
  });
  it("offers a selectable link if clipboard permission is denied", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    show();
    fireEvent.click(
      screen.getByRole("button", { name: "Копіювати посилання" }),
    );
    expect(await screen.findByLabelText("Посилання на профіль")).toHaveValue(
      `${window.location.origin}/user/admin`,
    );
  });
  it("has a loading state", () => {
    data.isLoading = true;
    show();
    expect(
      screen.getByRole("status", { name: "Завантажуємо записи" }),
    ).toBeInTheDocument();
  });
});

describe("profile data presentation", () => {
  it("keeps undated records last and does not mutate the source", () => {
    const list = [
      makeBet({ id: "old", createdAt: undefined, date: "2020-01-01" }),
      makeBet({ id: "undated", createdAt: "bad", date: "bad" }),
      makeBet({ id: "new" }),
    ];
    expect(recentRecords(list).map((b) => b.id)).toEqual([
      "new",
      "old",
      "undated",
    ]);
    expect(list[0].id).toBe("old");
  });
  it("uses real team names with safe fallbacks and identifies express bets", () => {
    expect(
      recordSummary(makeBet({ team1: undefined, team2: undefined })),
    ).toMatchObject({ team1: "Falcons", team2: "TYLOO", game: "CS2" });
    expect(
      recordSummary(
        makeBet({
          game: "Dota2",
          betType: "Експрес 5x",
          match: "Експрес 5x | details",
        }),
      ),
    ).toMatchObject({ express: true, title: "Експрес 5x", game: "Dota 2" });
  });
});

describe("theme preference", () => {
  it("synchronizes hook consumers and follows system changes", () => {
    let dark = false;
    const listeners = new Set<() => void>();
    vi.stubGlobal("matchMedia", () => ({
      get matches() {
        return dark;
      },
      addEventListener: (_: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    }));
    const first = renderHook(() => useTheme());
    const second = renderHook(() => useTheme());
    act(() => first.result.current.setTheme("system"));
    expect(second.result.current.preference).toBe("system");
    act(() => {
      dark = true;
      listeners.forEach((fn) => fn());
    });
    expect(first.result.current.theme).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
    act(() => second.result.current.toggleTheme());
    expect(first.result.current.preference).toBe("light");
    expect(localStorage.getItem("matchiq_theme")).toBe("light");
  });
});
