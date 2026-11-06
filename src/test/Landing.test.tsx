import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Landing from "@/pages/Landing";

vi.mock("@/components/SEO", () => ({ SEO: () => null }));
vi.mock("@/components/StructuredData", () => ({
  FAQStructuredData: () => null,
  OrganizationStructuredData: () => null,
  WebAppStructuredData: () => null,
}));
// Verify real component state and semantics without depending on a layout engine.
vi.mock("framer-motion", async () => {
  const React = await import("react");
  const Div = ({ children, className, ...props }: Record<string, unknown>) =>
    React.createElement(
      "div",
      { className, "aria-live": props["aria-live"] },
      children as React.ReactNode,
    );
  const Path = ({ d, stroke, fill }: Record<string, unknown>) =>
    React.createElement("path", { d, stroke, fill });
  return {
    motion: { div: Div, path: Path },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    MotionConfig: ({ children }: { children: React.ReactNode }) => children,
    useReducedMotion: () => false,
  };
});
// JSDOM lacks viewport observation; keep the real Hairline SVG renderer mounted.
beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function setup() {
  return render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );
}
describe("Lumora landing", () => {
  it("mounts Hairline illustrations and restores them after pausing", () => {
    const { container } = setup();
    expect(container.querySelectorAll(".mq-hairline svg")).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", { name: "Зупинити анімації" }));
    expect(
      container.querySelectorAll('.mq-hairline[data-paused="true"]'),
    ).toHaveLength(5);
    expect(container.querySelectorAll(".mq-hairline svg")).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", { name: "Увімкнути анімації" }));
    expect(
      container.querySelectorAll('.mq-hairline[data-paused="false"]'),
    ).toHaveLength(5);
  });
  it("compares a spreadsheet with MatchIQ point by point", () => {
    const { container } = setup();
    const sheet = screen.getByRole("article", { name: "Google-таблиця" });
    const app = screen.getByRole("article", { name: "MatchIQ" });
    expect(sheet.querySelectorAll(".mq-vs-item")).toHaveLength(6);
    expect(app.querySelectorAll(".mq-vs-item")).toHaveLength(6);
    // Same row order in both cards, so every point lines up.
    const rows = (card: HTMLElement) =>
      Array.from(card.querySelectorAll(".mq-vs-item b")).map(
        (b) => b.textContent,
      );
    expect(rows(sheet)).toEqual(rows(app));
    expect(container.querySelector("#compare .mq-vs-badge")).not.toBeNull();
    expect(
      within(app)
        .getByRole("link", { name: /Подивитися на прикладі/ })
        .getAttribute("href"),
    ).toBe("#possibilities");
  });
  it("has a unified footer CTA, 18+ notice and legal links", () => {
    const { container } = setup();
    const footer = screen.getByRole("contentinfo");
    expect(
      within(footer)
        .getByRole("link", { name: "Спробувати на прикладі" })
        .getAttribute("href"),
    ).toBe("#possibilities");
    expect(footer.querySelectorAll("nav")).toHaveLength(3);
    expect(within(footer).getByText("18+")).toBeDefined();
    expect(
      within(footer).getByRole("link", { name: "Конфіденційність" }).getAttribute("href"),
    ).toBe("/privacy");
    expect(
      within(footer).getByRole("link", { name: "Умови" }).getAttribute("href"),
    ).toBe("/terms");
    expect(container.querySelector(".mq-closing")).toBeNull();
  });
  it("shows both plans, the yearly discount and how to start", () => {
    const { container } = setup();
    const pricing = container.querySelector<HTMLElement>("#pricing")!;
    expect(within(pricing).getByText("500 ₴")).toBeDefined();
    expect(within(pricing).getByText("5 500 ₴")).toBeDefined();
    expect(within(pricing).getByText("12 місяців за ціною 11")).toBeDefined();
    const links = within(pricing).getAllByRole("link", {
      name: /Оформити підписку/,
    });
    expect(links).toHaveLength(2);
    expect(decodeURIComponent(links[0].getAttribute("href")!)).toContain(
      "місячну підписку",
    );
    expect(decodeURIComponent(links[1].getAttribute("href")!)).toContain(
      "річну підписку",
    );
    expect(pricing.querySelectorAll(".mq-start-steps li")).toHaveLength(3);
  });
  it("reports CTA clicks through the matchiq:track event", () => {
    setup();
    const events: unknown[] = [];
    const listener = (e: Event) => events.push((e as CustomEvent).detail);
    window.addEventListener("matchiq:track", listener);
    const link = screen.getByRole("link", {
      name: "Оформити підписку «Річна» через Telegram",
    });
    link.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(link);
    window.removeEventListener("matchiq:track", listener);
    expect(events).toContainEqual({ event: "plan_select", place: "yearly" });
  });
  it("keeps one primary hero CTA, a risk line and the tagline reveal", () => {
    const { container } = setup();
    const hero = container.querySelector<HTMLElement>(".mq-hero")!;
    expect(hero.querySelectorAll(".mq-hero-actions .mqt-pill")).toHaveLength(1);
    expect(
      within(hero).getByRole("link", { name: /Спробувати на прикладі/ }).className,
    ).toContain("mq-text-link");
    expect(within(hero).getByText("Без автосписань")).toBeDefined();
    const tagline = container.querySelector<HTMLElement>(".mq-tagline")!;
    expect(tagline.getAttribute("aria-label")).toContain(
      "Кожна ставка залишає слід.",
    );
    expect(tagline.querySelectorAll("[data-word]").length).toBeGreaterThan(8);
  });
  it("switches screens in the hero app preview", () => {
    const { container } = setup();
    const preview = screen.getByRole("region", {
      name: /Інтерактивний приклад інтерфейсу MatchIQ/,
    });
    const title = () =>
      container.querySelector(".mq-preview-top span")?.textContent;
    expect(title()).toBe("Огляд");
    for (const name of ["Матчі", "Журнал", "Банкрол", "Стратегії", "Ризикові команди"]) {
      const button = within(preview).getByRole("button", { name });
      fireEvent.click(button);
      expect(button.getAttribute("aria-pressed")).toBe("true");
      expect(title()).toBe(name);
    }
    expect(within(preview).getByText("Попередження у формі запису")).toBeDefined();
  });
  it("shows the sticky bar only when scrolling up past the hero", () => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    const { container } = setup();
    const bar = container.querySelector<HTMLElement>(".mq-sticky")!;
    const scrollTo = (y: number) =>
      act(() => {
        Object.defineProperty(window, "scrollY", {
          value: y,
          configurable: true,
        });
        fireEvent.scroll(window);
      });
    expect(bar.getAttribute("aria-hidden")).toBe("true");
    scrollTo(1500);
    expect(bar.classList.contains("is-visible")).toBe(false);
    scrollTo(1400);
    expect(bar.classList.contains("is-visible")).toBe(true);
    expect(bar.getAttribute("aria-hidden")).toBe("false");
    scrollTo(1600);
    expect(bar.classList.contains("is-visible")).toBe(false);
    scrollTo(300);
    expect(bar.classList.contains("is-visible")).toBe(false);
  });
  it("shows Settle and explains the product before capability summaries", () => {
    const { container } = setup();
    expect(
      container.querySelector("#about .mq-hairline-settle svg"),
    ).not.toBeNull();
    expect(container.querySelector("#about .mq-hairline-terrain")).toBeNull();
    const sections = Array.from(container.querySelectorAll("main > section"));
    const index = (selector: string) =>
      sections.indexOf(container.querySelector(selector)!);
    expect(index("#possibilities")).toBeLessThan(index("#how-it-works"));
    expect(index("#how-it-works")).toBeLessThan(index("#compare"));
    expect(index("#compare")).toBeLessThan(index("#tools"));
    expect(index("#tools")).toBeLessThan(index("#pricing"));
    expect(index("#pricing")).toBeLessThan(index("#faq"));
    // The old repeated summary blocks stay removed.
    expect(container.querySelector(".mq-capabilities")).toBeNull();
    expect(container.querySelector(".mq-numbers")).toBeNull();
    expect(index("#about")).toBeLessThan(index(".mq-journal-story"));
    expect(index(".mq-journal-story")).toBeLessThan(index("#possibilities"));
    expect(screen.queryByText(/Ми не підказуємо, на кого ставити/)).toBeNull();
  });
  it("uses a standalone design and preserves product explanations", () => {
    const { container } = setup();
    expect(container.querySelector(".mq-site")).not.toBeNull();
    expect(
      container.querySelector('.mq-hero img[src*="profile-player-hero"]'),
    ).toBeNull();
    expect(
      container.querySelector("#how-it-works .mq-hairline-exploded svg"),
    ).not.toBeNull();
    for (const selector of ["#tools .mq-hairline-hub"])
      expect(container.querySelector(`${selector} svg`)).not.toBeNull();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "Трекер ставок",
    );
    expect(
      container.querySelector(".mq-header .mq-brand img")?.getAttribute("src"),
    ).toBe("/favicon.svg");
    expect(
      container.querySelector(".mq-journal-story .mq-hairline-riffle svg"),
    ).not.toBeNull();
    expect(
      container.querySelector(".mq-faq-intro .mq-hairline-query svg"),
    ).not.toBeNull();
    expect(screen.queryByText("Спробуй перед входом.")).toBeNull();
    expect(container.querySelector(".matchiq-landing")).toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      within(screen.getByRole("contentinfo"))
        .getByRole("link", { name: "Спробувати на прикладі" })
        .getAttribute("href"),
    ).toBe("#possibilities");
    for (const link of container.querySelectorAll<HTMLAnchorElement>(
      'a[href^="#"]',
    ))
      expect(
        container.querySelector(link.getAttribute("href")!),
      ).not.toBeNull();
  });
  it("removes the hero spotlight while keeping the analytics section", () => {
    const { container } = setup();
    expect(container.querySelector(".mq-spotlight")).toBeNull();
    expect(screen.queryByText("Побач більше за рахунок.")).toBeNull();
    expect(container.querySelector("#analytics")).not.toBeNull();
  });
  it("switches matches and journal types independently", () => {
    setup();
    fireEvent.click(
      within(
        screen.getByRole("group", { name: "Гра в прикладі матчів" }),
      ).getByRole("button", { name: "Dota 2" }),
    );
    expect(screen.getByText("Team Liquid")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Експрес" }));
    expect(screen.getByText("2.70")).toBeDefined();
    expect(screen.getByText("+ Vitality — G2")).toBeDefined();
  });
  it("calculates EV and checks strategy boundaries", () => {
    setup();
    fireEvent.change(
      screen.getByRole("slider", { name: /Твоя оцінка ймовірності/ }),
      { target: { value: "60" } },
    );
    expect(screen.getByText("+8.0%")).toBeDefined();
    const odds = screen.getByRole("slider", { name: /Перевір коефіцієнт/ });
    fireEvent.change(odds, { target: { value: "1.4" } });
    expect(screen.getByText("У межах твоїх правил.")).toBeDefined();
    fireEvent.change(odds, { target: { value: "1.7" } });
    expect(screen.getByText("У межах твоїх правил.")).toBeDefined();
    fireEvent.change(odds, { target: { value: "1.8" } });
    expect(screen.getByText("Є привід зупинитись.")).toBeDefined();
  });
  it("updates the journey and accessible FAQ state", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /Зафіксуй результат/ }));
    expect(screen.getByText("Програш — теж дані")).toBeDefined();
    const q = screen.getByRole("button", {
      name: "Чи можна тут зробити ставку?",
    });
    fireEvent.click(q);
    expect(q.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(q);
    expect(q.getAttribute("aria-expanded")).toBe("false");
  });
  it("closes mobile navigation on Escape and toggles motion", async () => {
    const { container } = setup();
    // JSDOM has no mobile layout; target the labelled control directly.
    fireEvent.click(screen.getByLabelText("Відкрити меню"));
    expect(container.querySelector("#mq-mobile-menu")).not.toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    // The menu animates out along its entry path before it unmounts.
    expect(
      container.querySelector("#mq-mobile-menu")?.classList.contains("is-closing"),
    ).toBe(true);
    await waitFor(() =>
      expect(container.querySelector("#mq-mobile-menu")).toBeNull(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Зупинити анімації" }));
    expect(container.querySelector(".mq-reduced")).not.toBeNull();
  });
});
