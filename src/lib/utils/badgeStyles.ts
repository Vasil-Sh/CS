/**
 * Status badge style helpers.
 * Extracted from displayHelpers.ts
 */

/** Returns Tailwind CSS classes for risky team status badge. */
export function getStatusBadge(status: string): string {
  switch (status) {
    case 'БАН':
      return 'bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FEE2E2] border border-[#FECACA] rounded-full font-medium text-sm px-3 py-1';
    case 'Нестабільні':
      return 'bg-[#FEF3C7] text-[#D97706] hover:bg-[#FEF3C7] border border-[#FDE68A] rounded-full font-medium text-sm px-3 py-1';
    case 'Обережно':
      return 'bg-[#FFFBEB] text-[#D97706] hover:bg-[#FFFBEB] border border-[#FDE68A] rounded-full font-medium text-sm px-3 py-1';
    case 'Рідко':
      return 'bg-[#EFF6FF] text-[#2563EB] hover:bg-[#EFF6FF] border border-[#BFDBFE] rounded-full font-medium text-sm px-3 py-1';
    case 'Надійна':
      return 'bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] border border-[#BBF7D0] rounded-full font-medium text-sm px-3 py-1';
    case 'Неоцінена':
      return 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-full font-medium text-sm px-3 py-1';
    default:
      return 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-full font-medium text-sm px-3 py-1';
  }
}
