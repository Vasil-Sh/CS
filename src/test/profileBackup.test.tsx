import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { toast } from "sonner";
import ProfileBackup from "@/components/profile/ProfileBackup";
import Profile from "@/pages/Profile";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { username: "backup-test", role: "user" } }),
}));
vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({ preference: "light", setTheme: vi.fn() }),
}));
vi.mock("@/components/profile/ProfileOverview", () => ({
  default: ({ header }: { header: React.ReactNode }) => <>{header}</>,
}));
vi.mock("@/lib/userDataService", () => ({
  UserDataService: { getUserData: vi.fn((_user, _key, fallback) => fallback) },
}));
vi.mock("@/lib/apiClient", () => ({ api: { post: vi.fn() } }));

function props() {
  return {
    storageSize: "55.8",
    lastBackupDate: new Date("2026-10-02T11:57:00Z") as Date | null,
    isExporting: false,
    isImporting: false,
    isClearing: false,
    onExport: vi.fn(),
    onImport: vi.fn(),
    onClear: vi.fn(),
  };
}
function show(overrides: Partial<ReturnType<typeof props>> = {}) {
  const p = { ...props(), ...overrides };
  return { p, ...render(<ProfileBackup {...p} />) };
}
const backup = () =>
  new File(
    ['{"_meta":{"format":"matchiq-full-backup"}}'],
    "matchiq-backup.json",
    { type: "application/json" },
  );
function choose(file: File) {
  fireEvent.change(screen.getByLabelText("Файл бекапу JSON"), {
    target: { files: [file] },
  });
}
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("backup screen", () => {
  it("renders the reference hierarchy with real, localized metadata", () => {
    show();
    expect(
      screen.getByRole("heading", { name: "Бекап даних" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Огляд локальних даних" }),
    ).toHaveTextContent("55,8 КБ");
    expect(
      screen.getByText(/Експортуються дані localStorage/),
    ).toHaveTextContent("не копія серверної бази");
    expect(
      within(
        screen.getByRole("region", { name: "Що входить у копію" }),
      ).getAllByRole("listitem"),
    ).toHaveLength(6);
  });
  it.each([null, new Date("invalid")])(
    "handles a missing or invalid export date",
    (date) => {
      show({ lastBackupDate: date });
      expect(screen.getByText("Ще не створювали")).toBeInTheDocument();
    },
  );
  it("delegates export and the clear-confirmation request once", () => {
    const { p } = show();
    fireEvent.click(
      screen.getByRole("button", { name: "Завантажити повний бекап" }),
    );
    expect(p.onExport).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Очистити всі дані" }));
    expect(p.onClear).toHaveBeenCalledOnce();
    expect(p.onImport).not.toHaveBeenCalled();
  });
  it("never imports when selecting or cancelling; requires explicit confirmation", () => {
    const { p } = show();
    const file = backup();
    choose(file);
    expect(p.onImport).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Відновити дані" }));
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Серверні дані не відновлюються",
    );
    fireEvent.click(screen.getByRole("button", { name: "Скасувати" }));
    expect(p.onImport).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Відновити дані" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Підтвердити відновлення" }),
    );
    expect(p.onImport).toHaveBeenCalledOnce();
    expect(p.onImport).toHaveBeenCalledWith(file);
  });
  it("rejects a wrong extension and an empty JSON file", () => {
    show();
    choose(new File(["text"], "notes.txt"));
    expect(toast.error).toHaveBeenCalledWith(
      "Оберіть файл бекапу у форматі JSON",
    );
    choose(new File([], "empty.json"));
    expect(toast.error).toHaveBeenCalledWith(
      "Файл порожній. Оберіть збережений бекап MatchIQ",
    );
    expect(
      screen.queryByRole("button", { name: "Відновити дані" }),
    ).not.toBeInTheDocument();
  });
  it("supports dropping and removing a file without changing data", () => {
    const { p } = show();
    const drop = screen.getByRole("group", {
      name: "Вибір файлу для відновлення",
    });
    fireEvent.dragEnter(drop);
    expect(drop).toHaveClass("is-dragging");
    fireEvent.drop(drop, { dataTransfer: { files: [backup()] } });
    expect(drop).not.toHaveClass("is-dragging");
    expect(screen.getByText("matchiq-backup.json")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Прибрати обраний файл" }),
    );
    expect(
      screen.queryByRole("button", { name: "Відновити дані" }),
    ).not.toBeInTheDocument();
    expect(p.onImport).not.toHaveBeenCalled();
  });
  it.each(["isExporting", "isImporting", "isClearing"] as const)(
    "blocks conflicting actions during %s",
    (key) => {
      const { p } = show({ [key]: true });
      screen
        .getAllByRole("button")
        .forEach((button) => expect(button).toBeDisabled());
      fireEvent.drop(
        screen.getByRole("group", { name: "Вибір файлу для відновлення" }),
        { dataTransfer: { files: [backup()] } },
      );
      expect(p.onImport).not.toHaveBeenCalled();
      expect(screen.queryByText("matchiq-backup.json")).not.toBeInTheDocument();
    },
  );
});

describe("profile backup integration", () => {
  it("keeps a single navigation and opens a cancelable, explicit clear warning", () => {
    render(<Profile />);
    fireEvent.click(screen.getByRole("button", { name: "Бекап" }));
    expect(
      screen.getAllByRole("navigation", { name: "Розділи профілю" }),
    ).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Бекап" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    fireEvent.click(screen.getByRole("button", { name: "Очистити всі дані" }));
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Локальний JSON-бекап не відновлює серверні дані",
    );
    fireEvent.click(screen.getByRole("button", { name: "Скасувати" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("updates last-export metadata immediately, without a page reload", () => {
    const NativeURL = URL;
    vi.stubGlobal(
      "URL",
      class extends NativeURL {
        static createObjectURL = vi.fn(() => "blob:backup-test");
        static revokeObjectURL = vi.fn();
      },
    );
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<Profile />);
    fireEvent.click(screen.getByRole("button", { name: "Бекап" }));
    expect(screen.getByText("Ще не створювали")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Завантажити повний бекап" }),
    );
    expect(screen.queryByText("Ще не створювали")).not.toBeInTheDocument();
    expect(
      screen
        .getByRole("region", { name: "Огляд локальних даних" })
        .querySelector("time"),
    ).toHaveAttribute(
      "datetime",
      localStorage.getItem("matchiq_last_backup_date"),
    );
  });
});
