/**
 * Status badge style helpers.
 * Extracted from displayHelpers.ts
 */

/** Returns Tailwind CSS classes for risky team status badge. */
export function getStatusBadge(status: string): string {
  const base = 'whitespace-nowrap rounded-full font-medium text-sm px-3 py-1';
  const s = status.toLowerCase();
  if (s === 'бан') {
    return `bg-[#FEE2E2] text-red-600 hover:bg-[#FEE2E2] border border-red-200 ${base}`;
  }
  if (s === 'ризиковані' || s === 'нестабільні') {
    return `bg-orange-100 text-orange-600 hover:bg-orange-100 border border-orange-200 ${base}`;
  }
  if (s === 'під питанням' || s === 'обережно') {
    return `bg-amber-100 text-amber-600 hover:bg-amber-100 border border-amber-200 ${base}`;
  }
  if (s === 'стабільні') {
    return `bg-blue-50 text-blue-600 hover:bg-blue-50 border border-blue-200 ${base}`;
  }
  if (s === 'надійна') {
    return `bg-green-50 text-green-600 hover:bg-green-50 border border-green-200 ${base}`;
  }
  if (s === 'неоцінена') {
    return `bg-gray-100 text-gray-500 hover:bg-gray-100 border border-gray-200 ${base}`;
  }
  return `bg-gray-100 text-gray-500 hover:bg-gray-100 border border-gray-200 ${base}`;
}
