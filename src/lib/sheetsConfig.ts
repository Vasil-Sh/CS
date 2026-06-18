/**
 * Shared Google Sheets configuration.
 * All spreadsheet IDs are centralized here to avoid hardcoded values
 * scattered across the codebase.
 */

/** Доступи (адмін-юзери) */
export const SPREADSHEET_ID_AUTH = '1IhAUYQKcPjXetOGxCu-_YXxrj_kXt0QxKJCcGqPzZdo';

/** CS2 беттінг-дані */
export const SPREADSHEET_ID_DATA = '1WPchid4Di6XjUehfX1gnBinknUBiqiirSs16Vbn7rvw';

/** Повний Google Sheets URL для перегляду */
export const SHEETS_VIEW_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID_DATA}/edit`;
