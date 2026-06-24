/**
 * Startup migration: clear admin_risky_teams so RiskManagement starts fresh.
 * New RiskManagement no longer loads INITIAL_RISKY_TEAMS as default.
 */
export function clearStaleRiskyTeams(): void {
  try {
    const old = localStorage.getItem('admin_risky_teams');
    if (old) {
      const parsed = JSON.parse(old);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Check for old-format data (has game field in wrong format or specific known patterns)
        const hasGameField = parsed.some((t: any) => typeof t.game === 'string');
        if (hasGameField) {
          localStorage.removeItem('admin_risky_teams');
          console.warn('[v1.15.1] Removed ' + parsed.length + ' stale risky teams');
          return;
        }
      }
    }
  } catch { /* ignore */ }
}
