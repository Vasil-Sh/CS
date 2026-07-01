/**
 * Lib barrel exports — organized by domain.
 * Import from '@lib/api', '@lib/ai', '@lib/services', etc.
 */

// API layer
export { api, setTokens, setToken, clearToken } from "./apiClient";
export { authService } from "./authService";
export { csApi } from "./csApi";
export { googleSheetsRiskyTeamsService } from "./googleSheetsRiskyTeams";

// Services
export { BankrollService } from "./bankrollService";
export { UserDataService } from "./userDataService";

// AI
export { deepSeekService } from "./deepSeekService";
export * from "./ai/shared";

// Analytics / Math
export { calculateMatchProbability } from "./analytics";
export {
  calculateExpressTotalOdds,
  calculatePotentialPayout,
} from "./betCalculations";

// Parsing
export { parseMatchUrl } from "./matchUrlParser";
export { parseExpressText } from "./parser/expressParser";

// Utils
export { cn, normalizeDate } from "./utils";
export { getStatusBadge, getGameEmoji } from "./displayHelpers";
export { cardBase, cardHover, cardBorder } from "./cardStyles";
export { t, setLang, getLang } from "./i18n";
export type { Lang } from "./i18n";

// Monitoring
export { logRender } from "./devLogger";
export { reportError } from "./errorMonitor";
export { validateEnv } from "./envValidation";
