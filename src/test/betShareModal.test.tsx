import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import BetShareModal from "@/components/BetShareModal";
import { renderShareCard } from "@/components/renderShareCard";
import type { Bet } from "@/types/betting";

vi.mock("@/components/renderShareCard", () => ({ renderShareCard: vi.fn() }));
const bet: Bet = {
  match: "Lavked vs ex-6666",
  betType: "Match Winner - Lavked",
  odds: 2,
  amount: 222,
  profit: -222,
  result: "Loss",
  date: "2026-10-20T20:00:00",
  game: "cs2",
  format: "BO3",
};
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "clipboard");
});

describe("Ticket share dialog", () => {
  it("resizes the preview and reflows its export source on narrow containers", () => {
    let notify: ResizeObserverCallback = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          notify = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    const { container, unmount } = render(
      <BetShareModal bet={bet} open onClose={() => {}} />,
    );
    const slider = screen.getByRole("slider", { name: "Розмір квитка" });
    fireEvent.change(slider, { target: { value: "500" } });
    expect(
      (
        container.ownerDocument.querySelector(
          ".mi-ticket-resize",
        ) as HTMLElement
      ).style.width,
    ).toBe("500px");
    act(() =>
      notify(
        [{ contentRect: { width: 500 } } as ResizeObserverEntry],
        {} as ResizeObserver,
      ),
    );
    expect(
      document
        .querySelector("svg[data-share-artwork]")
        ?.getAttribute("data-arrangement"),
    ).toBe("stacked");
    act(() =>
      notify(
        [{ contentRect: { width: 900 } } as ResizeObserverEntry],
        {} as ResizeObserver,
      ),
    );
    expect(
      document
        .querySelector("svg[data-share-artwork]")
        ?.getAttribute("data-arrangement"),
    ).toBe("wide");
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
  it("switches formats and hides sums in the actual export source", () => {
    render(<BetShareModal bet={bet} open onClose={() => {}} />);
    expect(
      screen.getByRole("dialog", { name: "Поділитися записом" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "Квадрат" }));
    const svg = document.querySelector("svg[data-share-artwork]")!;
    const view = svg.getAttribute("viewBox")!.split(" ");
    expect(view[2]).toBe(view[3]);
    fireEvent.click(screen.getByRole("switch", { name: "Показувати суми" }));
    expect(svg.textContent).not.toContain("222 ₴");
    expect(svg.textContent).toContain("Суми приховано");
  });
  it("downloads only the ticket with the selected format", async () => {
    vi.mocked(renderShareCard).mockResolvedValue({
      toBlob: (cb: BlobCallback) =>
        cb(new Blob(["png"], { type: "image/png" })),
    } as HTMLCanvasElement);
    let filename = "";
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        filename = this.download;
      });
    const create = vi.fn(() => "blob:ticket");
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL = create;
        static revokeObjectURL = vi.fn();
      },
    );
    render(<BetShareModal bet={bet} open onClose={() => {}} />);
    fireEvent.click(screen.getByRole("radio", { name: "Квадрат" }));
    fireEvent.click(screen.getByRole("button", { name: "Завантажити PNG" }));
    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(
      vi
        .mocked(renderShareCard)
        .mock.calls[0][0].classList.contains("mi-share-ticket"),
    ).toBe(true);
    expect(filename).toMatch(/matchiq-square-loss/);
    expect(screen.getByRole("button", { name: "Завантажено" })).toBeTruthy();
  });
  it("copies a PNG and reports success", async () => {
    vi.mocked(renderShareCard).mockResolvedValue({
      toBlob: (cb: BlobCallback) =>
        cb(new Blob(["png"], { type: "image/png" })),
    } as HTMLCanvasElement);
    const write = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { write },
    });
    vi.stubGlobal(
      "ClipboardItem",
      class {
        constructor(public data: Record<string, Blob>) {}
      },
    );
    render(<BetShareModal bet={bet} open onClose={() => {}} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Копіювати зображення" }),
    );
    await waitFor(() => expect(write).toHaveBeenCalledOnce());
    expect(screen.getByRole("button", { name: "Скопійовано" })).toBeTruthy();
  });
  it("shows a recoverable export error and re-enables controls", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(renderShareCard).mockRejectedValue(new Error("font unavailable"));
    render(<BetShareModal bet={bet} open onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Завантажити PNG" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Не вдалося зберегти",
      ),
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Завантажити PNG",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });
  it("closes through the accessible close button", () => {
    const close = vi.fn();
    render(<BetShareModal bet={bet} open onClose={close} />);
    fireEvent.click(screen.getByRole("button", { name: "Закрити" }));
    expect(close).toHaveBeenCalledOnce();
  });
});
