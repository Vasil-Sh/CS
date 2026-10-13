import { describe, it, expect, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  within,
  cleanup,
} from "@testing-library/react";
import TelegramDashboard, {
  channelGames,
  type TelegramChannel,
} from "./TelegramDashboard";

const groups: TelegramChannel[] = [
  {
    id: "cs",
    name: "CS2 Journal",
    link: "https://t.me/test_cs",
    comment: "",
    hasChannel: false,
    createdAt: "2026-01-01",
  },
  {
    id: "dota",
    name: "Dota 2 Journal",
    link: "https://t.me/test_dota",
    comment: "",
    hasChannel: true,
    createdAt: "2026-01-01",
  },
  {
    id: "unknown",
    name: "Unknown game",
    link: "",
    comment: "",
    hasChannel: false,
    createdAt: "2026-01-01",
  },
];
const callbacks = () => ({
  onAdd: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onDetails: vi.fn(),
});
describe("Telegram dashboard", () => {
  it("does not invent a game when no evidence exists", () => {
    expect(channelGames(groups[2], [])).toEqual([]);
    expect(channelGames(groups[0], [])).toEqual(["cs2"]);
    expect(
      channelGames(groups[2], [
        {
          groupId: "unknown",
          game: "dota2",
          date: "2026-01-01",
          result: "Win",
          amount: 100,
          profit: 50,
        },
      ]),
    ).toEqual(["dota2"]);
  });
  it("filters by @handle and game, and resets an empty search", () => {
    render(
      <TelegramDashboard
        groups={groups}
        bets={[]}
        stats={[]}
        loaded
        {...callbacks()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Пошук групи"), {
      target: { value: "@test_cs" },
    });
    expect(
      screen.getByRole("button", { name: "CS2 Journal" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Dota 2 Journal" }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Пошук групи"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Гра"), {
      target: { value: "dota2" },
    });
    expect(
      screen.getByRole("button", { name: "Dota 2 Journal" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "CS2 Journal" }),
    ).not.toBeInTheDocument();
    cleanup();
  });
  it("uses settled results only and wires add/detail actions", () => {
    const actions = callbacks();
    const picks = [
      {
        groupId: "cs",
        date: "2026-01-01",
        result: "Win",
        profit: 50,
        amount: 100,
      },
      {
        groupId: "cs",
        date: "2026-01-02",
        result: "Pending",
        profit: 999,
        amount: 100,
      },
    ];
    render(
      <TelegramDashboard
        groups={groups}
        bets={picks}
        stats={[]}
        loaded
        {...actions}
      />,
    );
    const metrics = screen.getByRole("region", {
      name: "Загальна статистика Telegram-груп",
    });
    expect(within(metrics).getByText("100%")).toBeInTheDocument();
    expect(within(metrics).getByText("+50 ₴")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Додати групу" })[0]);
    expect(actions.onAdd).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "CS2 Journal" }));
    expect(actions.onDetails).toHaveBeenCalledWith("cs");
    cleanup();
  });
});
