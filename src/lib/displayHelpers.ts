/**
 * Display helpers — re-exports from domain-specific modules.
 *
 * @deprecated Import from the specific module instead:
 *   - getStatusBadge → @/lib/utils/badgeStyles
 *   - getGameEmoji   → @/lib/utils/gameIcons
 *   - getBetType*    → @/lib/utils/betTypeOptions
 */

export { getStatusBadge } from './utils/badgeStyles';
export { getGameEmoji } from './utils/gameIcons';
export {
  getBetTypeOptions,
  getGroupedBetTypeOptions,
  getBetTypeLabel,
} from './utils/betTypeOptions';
