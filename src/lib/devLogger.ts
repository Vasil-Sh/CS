/**
 * Dev-time logger utilities for detecting common React performance issues:
 * - Infinite re-render loops (component renders > N times in short period)
 * - Excessive service calls (API/GoogleSheets called too frequently)
 */

type LogEntry = { count: number; firstRender: number; lastRender: number };

const componentRenders = new Map<string, LogEntry>();

/** Max renders within WINDOW_MS before flagging as suspicious */
const MAX_RENDERS = 30;
const WINDOW_MS = 2000;

/** Log a component render. Warns if rendering too frequently. */
export function logRender(componentName: string): void {
  if (import.meta.env.PROD) return;
  const now = Date.now();
  const entry = componentRenders.get(componentName);

  if (!entry || now - entry.firstRender > WINDOW_MS) {
    // Reset window
    componentRenders.set(componentName, { count: 1, firstRender: now, lastRender: now });
    return;
  }

  entry.count++;
  entry.lastRender = now;

  if (entry.count === MAX_RENDERS) {
    console.error(
      `🔄 [DEV] ${componentName} перерендерилась ${entry.count} разів за ${WINDOW_MS}мс! Можливий безкінечний цикл.`,
      '\n   Перевір useState/useEffect без залежностей або зміну залежностей на кожному рендері.',
    );
  }
}
