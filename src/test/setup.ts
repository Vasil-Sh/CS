/**
 * Vitest Setup File
 * ───────────────────────────────────────────
 * Завантажується перед кожним тестовим файлом.
 *
 * Підключає:
 * - @testing-library/jest-dom — розширені матчери (toBeInTheDocument,
 *   toHaveClass, toHaveStyle, toBeDisabled тощо) для тестування
 *   DOM-компонентів у jsdom-оточенні.
 * - MSW (Mock Service Worker) — перехоплює мережеві запити й повертає
 *   моковані відповіді для ізоляції тестів від реального API.
 */
import "@testing-library/jest-dom/vitest";
import { server } from "./mocks/server";

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

// Reset handlers after each test to avoid cross-test contamination
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());

// jsdom has no IntersectionObserver / ResizeObserver / matchMedia: components that watch scroll or size
// (landing sticky bar, lazy sections) crashed the whole test file without them.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
  root = null;
  rootMargin = "";
  thresholds = [];
}
// plain assignment (not defineProperty): tests that stub these themselves must still be able to
const g = globalThis as unknown as Record<string, unknown>;
if (!g.IntersectionObserver) g.IntersectionObserver = NoopObserver;
if (!g.ResizeObserver) g.ResizeObserver = NoopObserver;
if (typeof window !== "undefined" && !window.matchMedia)
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;

// Radix Select/Popover call these on open; jsdom lacks them
if (typeof Element !== "undefined") {
  const proto = Element.prototype as unknown as Record<string, unknown>;
  proto.hasPointerCapture ||= () => false;
  proto.releasePointerCapture ||= () => {};
  proto.scrollIntoView ||= () => {};
}
