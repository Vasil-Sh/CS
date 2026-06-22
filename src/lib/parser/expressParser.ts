/**
 * Express bet parser — розбирає рядки експрес-ставок на структуровані події.
 *
 * Формат вхідного рядка:
 *   "Експрес 4x | 1. NaVi vs FaZe | П1: NaVi @1.80 • 2. G2 vs Vitality | П2: Vitality @2.10 • ..."
 *
 * Використовується в: MyBets.tsx, BetDetailsModal.tsx
 */

export interface ParsedEvent {
  number: string;
  match: string;
  betType: string;
  selection: string;
  odds: string;
}

/**
 * Parse an express bet type string into individual events.
 * Returns empty array for non-express bets.
 */
export function parseExpressEvents(betType: string): ParsedEvent[] {
  if (!betType.includes('|')) return [];

  const fullString = betType.split('|').slice(1).join('|').trim();
  const eventStrings = fullString.split('•').map(e => e.trim());

  return eventStrings.map(eventStr => {
    const parts = eventStr.split('|').map(p => p.trim());

    if (parts.length >= 2) {
      const matchPart = parts[0];
      const betPart = parts[1];

      const numberMatch = matchPart.match(/^(\d+)\.\s*(.+)$/);
      const number = numberMatch ? numberMatch[1] : '';
      const match = numberMatch ? numberMatch[2] : matchPart;

      const betMatch = betPart.match(/^(.+?):\s*(.+?)\s*@([\d.]+)$/);
      const parsedBetType = betMatch ? betMatch[1] : '';
      const selection = betMatch ? betMatch[2] : '';
      const odds = betMatch ? betMatch[3] : '';

      return { number, match, betType: parsedBetType, selection, odds };
    }

    return { number: '', match: eventStr, betType: '', selection: '', odds: '' };
  });
}
