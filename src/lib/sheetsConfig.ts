/**
 * Shared Google Sheets configuration.
 * All spreadsheet IDs are centralized here to avoid hardcoded values
 * scattered across the codebase.
 */

/** Доступи (адмін-юзери) */
export const SPREADSHEET_ID_AUTH = '1IhAUYQKcPjXetOGxCu-_YXxrj_kXt0QxKJCcGqPzZdo';

/** CS2 беттінг-дані */
export const SPREADSHEET_ID_DATA = '1WPchid4Di6XjUehfX1gnBinknUBiqiirSs16Vbn7rvw';

/** GID аркуша з ризикованими командами в SPREADSHEET_ID_DATA */
export const SHEET_GID_RISKY_TEAMS = '1620358902';

/** Повний Google Sheets URL для перегляду */
export const SHEETS_VIEW_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID_DATA}/edit`;
