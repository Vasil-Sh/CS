/**
 * Game icon / emoji helpers.
 * Extracted from displayHelpers.ts
 */

/** Returns emoji prefix for a game. */
export function getGameEmoji(game: string): string {
  return game === 'CS' ? '🎯 CS:' : '🛡️ Дота:';
}
