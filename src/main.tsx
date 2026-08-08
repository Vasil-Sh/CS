import { createRoot } from "react-dom/client";

// ═══════════════════════════════════════════════════════════════════
// PANIC CLEANUP: Nuke all known localStorage/sessionStorage caches
// BEFORE any module imports. Corrupt data from previous app versions
// causes "Cannot convert object to primitive value" during React.lazy().
// ═══════════════════════════════════════════════════════════════════
(function nukeCorruptCaches() {
  const sessionKeys = [
    "matchiq_matches_cache",
    "matchiq_matches_cache_v2",
    "matchiq_matches_cache_v3",
    "matchiq_matches_cache_ts",
    "matchiq_matches_cache_ts_v2",
    "matchiq_matches_cache_ts_v3",
  ];
  const localKeys = ["cs2_matches_cache_v11", "dota2_matches_cache_v18"];
  for (const k of sessionKeys) {
    try {
      sessionStorage.removeItem(k);
    } catch {
      /* swipe */
    }
  }
  for (const k of localKeys) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* swipe */
    }
  }
})();

// ── Bootstrap with error isolation ──
// Module-level import errors (corrupt cache, bad parse, etc.) during
// React.lazy() evaluation crash the entire app. Use dynamic imports to
// catch and display the exact failing module.
async function bootstrap() {
  const rootEl = document.getElementById("root");
  if (!rootEl) return;

  try {
    const [AppMod, AuthCtx, DataCtx] = await Promise.all([
      import("./App.tsx"),
      import("./contexts/AuthContext"),
      import("./contexts/DataContext"),
    ]);
    const App = AppMod.default;
    const { AuthProvider } = AuthCtx;
    const { DataProvider } = DataCtx;

    // Side-effect imports (no exports needed)
    await Promise.all([
      import("./lib/userDataService"),
      import("./lib/envValidation"),
      import("./lib/errorMonitor"),
      import("./index.css"),
    ]);

    const { validateEnv, getMissingEnvVars } =
      await import("./lib/envValidation");
    const { initErrorMonitoring } = await import("./lib/errorMonitor");

    // Validate environment variables
    const env = validateEnv();
    if (import.meta.env.DEV) {
      const missing = getMissingEnvVars(env);
      if (missing.length > 0)
        console.warn("[Env] Missing optional vars:", missing);
    }

    initErrorMonitoring();

    const root = createRoot(rootEl);
    root.render(
      <AuthProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </AuthProvider>,
    );
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error("[boot] Fatal import error:", e);
    rootEl.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;background:#f3f3f3">
        <div style="text-align:center;max-width:600px;padding:2rem">
          <h2 style="color:#dc2626;font-size:1.5rem;margin-bottom:1rem">Помилка завантаження модуля</h2>
          <p style="color:#6b7280;margin-bottom:1rem">${e.message}</p>
          <details style="text-align:left;margin-bottom:1rem">
            <summary style="cursor:pointer;color:#9ca3af;font-size:0.8rem">Stack trace</summary>
            <pre style="font-size:0.65rem;color:#9ca3af;overflow:auto;max-height:300px;background:#f9fafb;padding:0.5rem;border-radius:8px">${e.stack || "—"}</pre>
          </details>
          <button onclick="location.reload()" style="padding:0.6rem 1.5rem;background:#2563eb;color:white;border:none;border-radius:12px;font-size:1rem;cursor:pointer">Оновити</button>
        </div>
      </div>`;
  }
}

bootstrap();
