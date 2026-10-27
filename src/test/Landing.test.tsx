import {
  cleanup,
  fireEvent,
  render,
  screen,
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
  it("includes reference rows, product numbers and a unified footer CTA", () => {
    const { container } = setup();
    expect(container.querySelectorAll(".mq-capability-row")).toHaveLength(4);
    expect(
      container.querySelectorAll(".mq-product-overview article"),
    ).toHaveLength(4);
    const footer = screen.getByRole("contentinfo");
    expect(
      within(footer)
        .getByRole("link", { name: "Увійти в демо" })
        .getAttribute("href"),
    ).toBe("/login-digesto-demo");
    expect(footer.querySelectorAll("nav")).toHaveLength(2);
    expect(container.querySelector(".mq-closing")).toBeNull();
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
    expect(index("#possibilities")).toBeLessThan(index(".mq-capabilities"));
    expect(index("#tools")).toBeLessThan(index(".mq-capabilities"));
    expect(index(".mq-numbers")).toBeLessThan(index("#faq"));
    expect(screen.queryByText(/Ми не підказуємо, на кого ставити/)).toBeNull();
  });
  it("uses a standalone design and preserves product explanations", () => {
    const { container } = setup();
    expect(container.querySelector(".mq-site")).not.toBeNull();
    expect(
      container.querySelector('.mq-hero img[src*="profile-player-hero"]'),
    ).toBeNull();
    expect(
      container.querySelector(".mq-hairline-query, .mq-numbers .mq-hairline"),
    ).toBeNull();
    expect(
      container.querySelector("#how-it-works .mq-hairline-steps svg"),
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
      container.querySelector(".mq-faq-intro .mq-hairline-loupe svg"),
    ).not.toBeNull();
    expect(screen.queryByText("Спробуй перед входом.")).toBeNull();
    expect(container.querySelector(".matchiq-landing")).toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: "Увійти в демо" }).getAttribute("href"),
    ).toBe("/login-digesto-demo");
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
  it("closes mobile navigation on Escape and toggles motion", () => {
    const { container } = setup();
    // JSDOM has no mobile layout; target the labelled control directly.
    fireEvent.click(screen.getByLabelText("Відкрити меню"));
    expect(container.querySelector("#mq-mobile-menu")).not.toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(container.querySelector("#mq-mobile-menu")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Зупинити анімації" }));
    expect(container.querySelector(".mq-reduced")).not.toBeNull();
  });
});
