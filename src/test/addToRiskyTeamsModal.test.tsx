import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import AddToRiskyTeamsModal from "@/components/matches/AddToRiskyTeamsModal";

const { post, put, success, error } = vi.hoisted(() => ({
  post: vi.fn(),
  put: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock("@/lib/apiClient", () => ({ api: { post, put } }));
vi.mock("sonner", () => ({ toast: { success, error } }));

const props = () => ({
  open: true,
  onClose: vi.fn(),
  onSaved: vi.fn(),
  team1: { name: "Lynn Vision", logo: "https://example.com/lynn.png" },
  team2: { name: "Chinggis Warriors", logo: null },
  game: "CS2",
  team1Risky: false,
  team2Risky: false,
  team1Existing: null,
  team2Existing: null,
});

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  post.mockResolvedValue({});
  put.mockResolvedValue({});
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

describe("team note dialog", () => {
  it("shows the preview layout with labelled fields and default selections", () => {
    render(<AddToRiskyTeamsModal {...props()} />);
    expect(
      screen.getByRole("dialog", { name: "Примітка до команди" }),
    ).toHaveAccessibleDescription(
      "Статус і нотатка з’являться біля матчів команди.",
    );
    expect(screen.getByRole("radio", { name: "Lynn Vision" })).toBeChecked();
    expect(screen.getByRole("combobox", { name: "Статус" })).toHaveTextContent(
      "Під питанням",
    );
    expect(screen.getByRole("combobox", { name: "Гра" })).toHaveTextContent(
      "CS2",
    );
    expect(screen.getByRole("textbox", { name: "Нотатка" }).tagName).toBe(
      "TEXTAREA",
    );
    expect(screen.getByText("Збережеться лише для Lynn Vision.")).toBeVisible();
  });

  it("keeps independent unsaved notes for both teams", () => {
    render(<AddToRiskyTeamsModal {...props()} />);
    const notes = screen.getByRole("textbox", { name: "Нотатка" });
    fireEvent.change(notes, {
      target: { value: "Перевірити склад\nПеред матчем" },
    });
    fireEvent.click(screen.getByRole("radio", { name: "Chinggis Warriors" }));
    expect(notes).toHaveValue("");
    expect(
      screen.getByText("Збережеться лише для Chinggis Warriors."),
    ).toBeVisible();
    fireEvent.change(notes, { target: { value: "Інша команда" } });
    fireEvent.click(screen.getByRole("radio", { name: "Lynn Vision" }));
    expect(notes).toHaveValue("Перевірити склад\nПеред матчем");
    fireEvent.click(screen.getByRole("radio", { name: "Chinggis Warriors" }));
    expect(notes).toHaveValue("Інша команда");
  });

  it("honors initialTeam and existing values without leaking them into the opponent", () => {
    render(
      <AddToRiskyTeamsModal
        {...props()}
        initialTeam="Lynn Vision"
        team1Risky
        team1Existing={{ status: "БАН", notes: "Існуюча нотатка", game: "CS" }}
      />,
    );
    expect(screen.getByRole("combobox", { name: "Статус" })).toHaveTextContent(
      "БАН",
    );
    expect(screen.getByRole("textbox", { name: "Нотатка" })).toHaveValue(
      "Існуюча нотатка",
    );
    expect(
      screen.getByRole("button", { name: "Оновити примітку" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("radio", { name: "Chinggis Warriors" }));
    expect(screen.getByRole("combobox", { name: "Статус" })).toHaveTextContent(
      "Під питанням",
    );
    expect(screen.getByRole("textbox", { name: "Нотатка" })).toHaveValue("");
  });

  it("selects the team without a note by default, preserving the existing behavior", () => {
    render(
      <AddToRiskyTeamsModal
        {...props()}
        team1Risky
        team1Existing={{ status: "Стабільні", notes: "Текст" }}
      />,
    );
    expect(
      screen.getByRole("radio", { name: "Chinggis Warriors" }),
    ).toBeChecked();
    expect(screen.getByRole("textbox", { name: "Нотатка" })).toHaveValue("");
  });

  it("offers all eight statuses and updates the helper for the selected one", () => {
    render(<AddToRiskyTeamsModal {...props()} />);
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Статус" }), {
      key: "ArrowDown",
    });
    expect(screen.getAllByRole("option")).toHaveLength(8);
    fireEvent.click(screen.getByRole("option", { name: "Стабільні" }));
    expect(screen.getByRole("combobox", { name: "Статус" })).toHaveTextContent(
      "Стабільні",
    );
    expect(
      screen.getByText(
        "Позначка за спостереженнями, а не гарантія результату.",
      ),
    ).toBeVisible();
  });

  it("allows changing the game and preserves its storage key", async () => {
    render(<AddToRiskyTeamsModal {...props()} />);
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Гра" }), {
      key: "ArrowDown",
    });
    fireEvent.click(screen.getByRole("option", { name: "Dota 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Зберегти примітку" }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        "/risky-teams",
        expect.objectContaining({ game: "Дота" }),
      ),
    );
  });

  it("prefills Dota 2 for a Dota match", () => {
    render(<AddToRiskyTeamsModal {...props()} game="Dota2" />);
    expect(screen.getByRole("combobox", { name: "Гра" })).toHaveTextContent(
      "Dota 2",
    );
  });

  it("saves only the selected team, trimming edges but preserving line breaks", async () => {
    const callbacks = props();
    render(<AddToRiskyTeamsModal {...callbacks} />);
    fireEvent.click(screen.getByRole("radio", { name: "Chinggis Warriors" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Нотатка" }), {
      target: { value: "  Склад\nДруга примітка  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Зберегти примітку" }));
    const entry = {
      name: "Chinggis Warriors",
      status: "Під питанням",
      game: "CS",
      notes: "Склад\nДруга примітка",
    };
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/risky-teams", entry),
    );
    expect(JSON.parse(localStorage.getItem("admin_risky_teams")!)).toEqual([
      entry,
    ]);
    expect(callbacks.onSaved).toHaveBeenCalledOnce();
    expect(callbacks.onClose).toHaveBeenCalledOnce();
  });

  it("updates an existing entry without duplicating it or overwriting other fields", async () => {
    const existing = {
      name: "Lynn Vision",
      game: "CS",
      status: "Стабільні",
      notes: "Стара",
      customField: true,
    };
    const opponent = {
      name: "Chinggis Warriors",
      game: "CS",
      status: "Обережно",
      notes: "Не змінювати",
    };
    localStorage.setItem(
      "admin_risky_teams",
      JSON.stringify([existing, opponent]),
    );
    render(
      <AddToRiskyTeamsModal
        {...props()}
        initialTeam="Lynn Vision"
        team1Risky
        team2Risky
        team1Existing={existing}
        team2Existing={opponent}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Нотатка" }), {
      target: { value: "Нова" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Оновити примітку" }));
    await waitFor(() =>
      expect(put).toHaveBeenCalledWith(
        "/risky-teams/Lynn%20Vision",
        expect.objectContaining({ notes: "Нова" }),
      ),
    );
    expect(JSON.parse(localStorage.getItem("admin_risky_teams")!)).toEqual([
      { ...existing, notes: "Нова" },
      opponent,
    ]);
    expect(post).not.toHaveBeenCalled();
  });

  it("does not save when cancelled and starts a fresh draft on reopening", () => {
    const callbacks = props();
    const { rerender } = render(<AddToRiskyTeamsModal {...callbacks} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Нотатка" }), {
      target: { value: "Чернетка" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Скасувати" }));
    expect(callbacks.onClose).toHaveBeenCalledOnce();
    expect(localStorage.getItem("admin_risky_teams")).toBeNull();
    expect(post).not.toHaveBeenCalled();
    rerender(<AddToRiskyTeamsModal {...callbacks} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    rerender(<AddToRiskyTeamsModal {...callbacks} />);
    expect(screen.getByRole("textbox", { name: "Нотатка" })).toHaveValue("");
  });

  it("supports Escape to dismiss without saving", () => {
    const callbacks = props();
    render(<AddToRiskyTeamsModal {...callbacks} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(callbacks.onClose).toHaveBeenCalledOnce();
    expect(post).not.toHaveBeenCalled();
  });

  it("disables editing and prevents duplicate requests while saving", async () => {
    let finish!: () => void;
    post.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const callbacks = props();
    render(<AddToRiskyTeamsModal {...callbacks} />);
    fireEvent.click(screen.getByRole("button", { name: "Зберегти примітку" }));
    await waitFor(() => expect(post).toHaveBeenCalledOnce());
    expect(screen.getByRole("textbox", { name: "Нотатка" })).toBeDisabled();
    expect(
      screen.getByRole("radio", { name: "Chinggis Warriors" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Збереження…" })).toBeDisabled();
    fireEvent.submit(
      screen.getByRole("button", { name: "Збереження…" }).closest("form")!,
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(callbacks.onClose).not.toHaveBeenCalled();
    expect(post).toHaveBeenCalledOnce();
    finish();
    await waitFor(() => expect(callbacks.onSaved).toHaveBeenCalledOnce());
  });

  it("retains local data when backend synchronization is unavailable", async () => {
    post.mockRejectedValue(new Error("Offline"));
    const callbacks = props();
    render(<AddToRiskyTeamsModal {...callbacks} />);
    fireEvent.click(screen.getByRole("button", { name: "Зберегти примітку" }));
    await waitFor(() => expect(callbacks.onSaved).toHaveBeenCalledOnce());
    expect(JSON.parse(localStorage.getItem("admin_risky_teams")!)).toHaveLength(
      1,
    );
    expect(error).not.toHaveBeenCalled();
  });

  it("does not overwrite a malformed stored list", async () => {
    localStorage.setItem("admin_risky_teams", "{broken");
    render(<AddToRiskyTeamsModal {...props()} />);
    fireEvent.click(screen.getByRole("button", { name: "Зберегти примітку" }));
    await waitFor(() => expect(error).toHaveBeenCalledOnce());
    expect(localStorage.getItem("admin_risky_teams")).toBe("{broken");
    expect(post).not.toHaveBeenCalled();
  });
});
