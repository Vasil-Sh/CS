/**
 * Status badge style helpers.
 * Extracted from displayHelpers.ts
 */

/** Returns Tailwind CSS classes for risky team status badge. */
export function getStatusBadge(status: string): string {
  switch (status) {
    case 'БАН':
      return 'bg-[#FEE2E2] text-red-600 hover:bg-[#FEE2E2] border border-red-200 rounded-full font-medium text-sm px-3 py-1';
    case 'Нестабільні':
      return 'bg-yellow-100 text-amber-600 hover:bg-yellow-100 border border-amber-200 rounded-full font-medium text-sm px-3 py-1';
    case 'Обережно':
      return 'bg-amber-50 text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-full font-medium text-sm px-3 py-1';
    case 'Рідко':
      return 'bg-blue-50 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-full font-medium text-sm px-3 py-1';
    case 'Надійна':
      return 'bg-green-50 text-green-600 hover:bg-green-50 border border-green-200 rounded-full font-medium text-sm px-3 py-1';
    case 'Неоцінена':
      return 'bg-gray-100 text-gray-500 hover:bg-gray-100 border border-gray-200 rounded-full font-medium text-sm px-3 py-1';
    default:
      return 'bg-gray-100 text-gray-500 hover:bg-gray-100 border border-gray-200 rounded-full font-medium text-sm px-3 py-1';
  }
}
