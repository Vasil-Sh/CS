/**
 * Shared card hover styles — used across all pages for consistency.
 * Matches the StatCard component hover behavior:
 * - border changes from #F3F4F6 to #D1D5DB
 * - card lifts 3px with a subtle shadow
 */

/** Base card style: flat, subtle shadow */
export const CARD_BASE_STYLE: React.CSSProperties = {
  transform: 'translateY(0)',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
};

/** Hover card style: lifts up with a deeper shadow */
export const CARD_HOVER_STYLE: React.CSSProperties = {
  transform: 'translateY(-3px)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
};

/** The border color a card gets on hover */
export const CARD_HOVER_BORDER = 'hover:border-[#D1D5DB]';

/** The default border for white stat cards */
export const CARD_DEFAULT_BORDER = 'border border-[#F3F4F6] rounded-3xl';

/** Convenience: apply hover style to a DOM element */
export const applyCardHover = (el: HTMLElement) => Object.assign(el.style, CARD_HOVER_STYLE);

/** Convenience: reset to base style on a DOM element */
export const resetCardHover = (el: HTMLElement) => Object.assign(el.style, CARD_BASE_STYLE);

/** Chart card shadow — slightly deeper than stat cards */
export const CHART_CARD_SHADOW = '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)';
