import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";
import Profile from "@/pages/Profile";
import ProfileShell from "@/components/profile/ProfileShell";
import { getLang, setLang } from "@/lib/i18n";
import { profileDate, recordSummary } from "@/components/profile/profileModel";
import type { Bet } from "@/types/betting";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { username: "locale-test", role: "user" } }),
}));
vi.mock("@/contexts/DataContext", () => ({
  useData: () => ({ bets: [], isLoading: false }),
}));
vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({ preference: "light", setTheme: vi.fn() }),
}));
vi.mock("@/lib/userDataService", () => ({
  UserDataService: {
    getUserData: vi.fn((_u, _k, fallback) => fallback),
    setUserDataSync: vi.fn(),
    fetchUserPrefs: vi.fn().mockResolvedValue({ preferences: {} }),
    saveUserPrefs: vi.fn().mockResolvedValue({ preferences: {} }),
  },
}));
vi.mock("@/lib/apiClient", () => ({ api: { post: vi.fn() } }));
beforeEach(() => {
  localStorage.clear();
  setLang("uk");
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  setLang("uk");
});
const show = () =>
  render(
    <MemoryRouter>
      <ProfileShell username="locale-test" onLogout={() => {}}>
        <Profile />
      </ProfileShell>
    </MemoryRouter>,
  );

it("switches the complete profile and navigation in place, including an existing validation error", async () => {
  show();
  const rate = screen.getByLabelText("Курс USD → UAH");
  fireEvent.change(rate, { target: { value: "0" } });
  fireEvent.blur(rate);
  fireEvent.change(screen.getByRole("combobox", { name: "Мова" }), {
    target: { value: "en" },
  });
  expect(
    screen.getByRole("heading", { name: "Your profile", level: 1 }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("navigation", { name: "Main navigation" }),
  ).toHaveTextContent("Discipline");
  expect(
    screen.getByRole("heading", { name: "Recent activity" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Enter an exchange rate greater than zero.",
  );
  expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
  expect(localStorage.getItem("matchiq_lang")).toBe("en");
  fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
  expect(toast.success).toHaveBeenCalledWith("Dark theme enabled");
  fireEvent.change(screen.getByRole("combobox", { name: "Language" }), {
    target: { value: "uk" },
  });
  expect(
    screen.getByRole("heading", { name: "Ваш профіль", level: 1 }),
  ).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Введіть курс, більший за нуль.",
  );
});

it("localizes backup errors and confirmation dialogs without executing destructive actions", () => {
  setLang("en");
  show();
  fireEvent.click(screen.getByRole("button", { name: "Data & backup" }));
  expect(
    screen.getByRole("region", { name: "Local data overview" }),
  ).toHaveTextContent("KB");
  const input = screen.getByLabelText("JSON backup file");
  fireEvent.change(input, {
    target: { files: [new File(["bad"], "bad.txt")] },
  });
  expect(toast.error).toHaveBeenCalledWith("Choose a JSON backup file");
  fireEvent.change(input, {
    target: {
      files: [new File(["{}"], "my-backup.json", { type: "application/json" })],
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "Restore data" }));
  expect(screen.getByRole("dialog")).toHaveTextContent(
    "The file “my-backup.json”",
  );
  expect(screen.getByRole("dialog")).toHaveTextContent(
    "Server data will not be restored",
  );
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  fireEvent.click(screen.getByRole("button", { name: "Clear all data" }));
  expect(screen.getByRole("dialog")).toHaveTextContent(
    "A local JSON backup cannot restore server data",
  );
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("formats dates for the active locale while preserving user-entered match names", () => {
  const date = new Date("2026-10-24T12:00:00Z");
  const bet = {
    match: "Моя команда vs Falcons",
    team1: "Моя команда",
    team2: "Falcons",
    game: "CS2",
    betType: "Перемога - Falcons",
    odds: 1.75,
  } as Bet;
  setLang("en");
  expect(profileDate(date)).toContain("Oct");
  expect(recordSummary(bet).title).toBe(bet.match);
  expect(recordSummary(bet).description).toMatch(/^Single/);
  act(() => setLang("uk"));
  expect(profileDate(date)).toContain("жовт");
  expect(recordSummary(bet).description).toMatch(/^Одинар/);
  expect(getLang()).toBe("uk");
});
