/**
 * Performance profiler — wraps React.Profiler for onRender logging.
 *
 * Usage in dev:
 *   import { Profiler } from '@/lib/perfMonitor';
 *   <Profiler id="MyComponent"><MyComponent /></Profiler>
 *
 * For component-level tracking via hook:
 *   import { useRenderCount } from '@/lib/perfMonitor';
 *   const MyComponent = () => { useRenderCount('MyComponent'); return ...; }
 */

import {
  Profiler as ReactProfiler,
  type ProfilerOnRenderCallback,
} from "react";
import type { ReactNode } from "react";
import { logRender } from "./devLogger";

const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
) => {
  if (actualDuration > 16) {
    // Warn about >60fps threshold
    console.debug(
      `[Perf] ${id} ${phase}: ${actualDuration.toFixed(1)}ms (base: ${baseDuration.toFixed(1)}ms)`,
    );
  }
};

/** React.Profiler wrapper with dev-only logging */
export function Profiler({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  if (!import.meta.env.DEV) return <>{children}</>;
  return (
    <ReactProfiler id={id} onRender={onRenderCallback}>
      {children}
    </ReactProfiler>
  );
}

/**
 * Log component render count. Uses the existing devLogger infrastructure.
 * Call at the top of your component body (before any early returns).
 */
export function useRenderCount(name: string) {
  if (import.meta.env.DEV) {
    logRender(name);
  }
}
