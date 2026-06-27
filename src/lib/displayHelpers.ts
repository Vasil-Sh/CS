/**
 * Display helpers — pure mapping functions for UI badges/emoji.
 * Extracted from CS2BettingForm.tsx
 */

/**
 * Returns Tailwind CSS classes for risky team status badge.
 */
export function getStatusBadge(status: string): string {
  switch (status) {
    case 'БАН':
      return 'bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FEE2E2] border-0 rounded-full font-medium text-sm px-3 py-1';
    case 'Нестабільні':
      return 'bg-[#FEF3C7] text-[#D97706] hover:bg-[#FEF3C7] border-0 rounded-full font-medium text-sm px-3 py-1';
    case 'Обережно':
      return 'bg-[#DBEAFE] text-[#2563EB] hover:bg-[#DBEAFE] border-0 rounded-full font-medium text-sm px-3 py-1';
    case 'Рідко':
      return 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6] border-0 rounded-full font-medium text-sm px-3 py-1';
    case 'Надійна':
      return 'bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] border-0 rounded-full font-medium text-sm px-3 py-1';
    case 'Без статусу':
      return 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6] border-0 rounded-full font-medium text-sm px-3 py-1';
    default:
      return 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6] border-0 rounded-full font-medium text-sm px-3 py-1';
  }
}

export function getGameEmoji(game: string): string {
  return game === 'CS' ? '🎯 CS:' : '🛡️ Дота:';
}

/** Bet type options by game. Pure function, no component deps. */
export function getBetTypeOptions(game: string, format?: string): { value: string; label: string }[] {
  if (game === 'Dota2') {
    return [
      { value: 'Match Winner', label: 'Переможець матчу' },
      { value: 'Map Winner', label: 'Переможець карти' },
      { value: 'Total Maps', label: 'Тотал карт' },
      { value: 'Handicap +1.5', label: 'Фора +1.5' },
      { value: 'Handicap -1.5', label: 'Фора -1.5' },
      { value: 'Handicap +2.5', label: 'Фора +2.5' },
      { value: 'Handicap -2.5', label: 'Фора -2.5' },
      { value: 'First Blood', label: 'Перша кров' },
      { value: 'Total Kills', label: 'Тотал вбивств' },
      { value: 'Roshan', label: 'Рошан' },
    ];
  }
  const maxMaps = format === 'BO5' ? 5 : format === 'BO3' ? 3 : format === 'BO1' ? 1 : 5;
  const allOptions: { value: string; label: string; maxMap?: number }[] = [
    { value: 'Match Winner', label: 'Переможець матчу' },
    { value: 'Map Winner', label: 'Переможець карти' },
    { value: 'First Map Winner', label: 'Переможець 1-ї карти', maxMap: 1 },
    { value: 'Second Map Winner', label: 'Переможець 2-ї карти', maxMap: 2 },
    { value: 'Third Map Winner', label: 'Переможець 3-ї карти', maxMap: 3 },
    { value: 'Fourth Map Winner', label: 'Переможець 4-ї карти', maxMap: 4 },
    { value: 'Fifth Map Winner', label: 'Переможець 5-ї карти', maxMap: 5 },
    { value: 'Total Maps', label: 'Тотал карт' },
    { value: 'Handicap +1.5', label: 'Фора +1.5' },
    { value: 'Handicap -1.5', label: 'Фора -1.5' },
    { value: 'Handicap +2.5', label: 'Фора +2.5' },
    { value: 'Handicap -2.5', label: 'Фора -2.5' },
    { value: 'Handicap +3.5', label: 'Фора +3.5' },
    { value: 'Handicap -3.5', label: 'Фора -3.5' },
    { value: 'Handicap +4.5', label: 'Фора +4.5' },
    { value: 'Handicap -4.5', label: 'Фора -4.5' },
    { value: 'Handicap +5.5', label: 'Фора +5.5' },
    { value: 'Handicap -5.5', label: 'Фора -5.5' },
    { value: 'First Map', label: 'Перша карта' },
    { value: 'Pistol Round', label: 'Пістолетний раунд' },
    { value: 'Total Rounds', label: 'Тотал раундів' },
  ];
  return allOptions.filter(o => o.maxMap === undefined || o.maxMap <= maxMaps);
}
