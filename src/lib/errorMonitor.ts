/**
 * Lightweight client-side error monitoring.
 * Logs errors to console in dev, batches and sends to endpoint in production.
 */

interface ErrorReport {
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
}

const MAX_BATCH = 10;
const FLUSH_INTERVAL = 30_000; // 30s

let queue: ErrorReport[] = [];
let timer: ReturnType<typeof setInterval> | null = null;

function createReport(error: Error): ErrorReport {
  return {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };
}

function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, MAX_BATCH);
  // Send to monitoring endpoint if configured
  const endpoint = import.meta.env.VITE_ERROR_REPORT_URL;
  if (endpoint) {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
      keepalive: true,
    }).catch(() => {
      // Silently fail — don't create error loops
    });
  }
  if (import.meta.env.DEV && batch.length > 0) {
    console.warn('[ErrorMonitor]', batch.length, 'errors flushed');
  }
}

/** Initialize global error monitoring */
export function initErrorMonitoring() {
  if (timer) return;

  window.addEventListener('error', (event) => {
    if (event.error) {
      queue.push(createReport(event.error));
      if (queue.length >= MAX_BATCH) flush();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    queue.push(createReport(error));
    if (queue.length >= MAX_BATCH) flush();
  });

  timer = setInterval(flush, FLUSH_INTERVAL);

  if (import.meta.env.DEV) {
    console.log('[ErrorMonitor] Initialized');
  }
}

/** Get current pending error count (for debugging) */
export function getPendingErrors(): number {
  return queue.length;
}

/** Manually report an error */
export function reportError(error: Error) {
  queue.push(createReport(error));
}
