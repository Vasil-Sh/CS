/**
 * Vitest Setup File
 * ───────────────────────────────────────────
 * Завантажується перед кожним тестовим файлом.
 *
 * Підключає:
 * - @testing-library/jest-dom — розширені матчери (toBeInTheDocument,
 *   toHaveClass, toHaveStyle, toBeDisabled тощо) для тестування
 *   DOM-компонентів у jsdom-оточенні.
 */
import '@testing-library/jest-dom/vitest';
