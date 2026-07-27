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
