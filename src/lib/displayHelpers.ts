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

export interface BetTypeGroup {
  category: string;
  options: { value: string; label: string }[];
}

export interface MapBetTypeGroup {
  mapNumber: number;
  groups: BetTypeGroup[];
}

/** Grouped bet type options by map + category — for button-based selection UI */
export function getGroupedBetTypeOptions(format?: string): MapBetTypeGroup[] {
  const maxMaps = format === 'BO5' ? 5 : format === 'BO3' ? 3 : format === 'BO1' ? 1 : 5;
  const maps: MapBetTypeGroup[] = [];
  for (let m = 1; m <= maxMaps; m++) {
    maps.push({
      mapNumber: m,
      groups: [
        {
          category: 'Переможець',
          options: [{ value: `Map ${m} Winner`, label: 'Переможець' }],
        },
        {
          category: 'Подвійний результат',
          options: [
            { value: `Map ${m} Double Chance 1X`, label: '1 Або Нічия' },
            { value: `Map ${m} Double Chance 12`, label: '1 Або 2' },
            { value: `Map ${m} Double Chance X2`, label: '2 Або Нічия' },
          ],
        },
        {
          category: 'Фора',
          options: [
            { value: `Map ${m} Handicap T1 -2.5`, label: (m === 1 ? '1' : '2') + ' -2.5' },
            { value: `Map ${m} Handicap T2 +2.5`, label: (m === 1 ? '2' : '1') + ' +2.5' },
            { value: `Map ${m} Handicap T1 +2.5`, label: (m === 1 ? '1' : '2') + ' +2.5' },
            { value: `Map ${m} Handicap T2 -2.5`, label: (m === 1 ? '2' : '1') + ' -2.5' },
            { value: `Map ${m} Handicap T1 -3.5`, label: (m === 1 ? '1' : '2') + ' -3.5' },
            { value: `Map ${m} Handicap T2 +3.5`, label: (m === 1 ? '2' : '1') + ' +3.5' },
            { value: `Map ${m} Handicap T1 +3.5`, label: (m === 1 ? '1' : '2') + ' +3.5' },
            { value: `Map ${m} Handicap T2 -3.5`, label: (m === 1 ? '2' : '1') + ' -3.5' },
            { value: `Map ${m} Handicap T1 -4.5`, label: (m === 1 ? '1' : '2') + ' -4.5' },
            { value: `Map ${m} Handicap T2 +4.5`, label: (m === 1 ? '2' : '1') + ' +4.5' },
            { value: `Map ${m} Handicap T1 +4.5`, label: (m === 1 ? '1' : '2') + ' +4.5' },
            { value: `Map ${m} Handicap T2 -4.5`, label: (m === 1 ? '2' : '1') + ' -4.5' },
            { value: `Map ${m} Handicap T1 -5.5`, label: (m === 1 ? '1' : '2') + ' -5.5' },
            { value: `Map ${m} Handicap T2 +5.5`, label: (m === 1 ? '2' : '1') + ' +5.5' },
            { value: `Map ${m} Handicap T1 +5.5`, label: (m === 1 ? '1' : '2') + ' +5.5' },
            { value: `Map ${m} Handicap T2 -5.5`, label: (m === 1 ? '2' : '1') + ' -5.5' },
          ],
        },
        {
          category: 'Тотал',
          options: [
            { value: `Map ${m} Total Under 19.5`, label: 'Менше 19.5' },
            { value: `Map ${m} Total Over 19.5`, label: 'Більше 19.5' },
            { value: `Map ${m} Total Under 20.5`, label: 'Менше 20.5' },
            { value: `Map ${m} Total Over 20.5`, label: 'Більше 20.5' },
            { value: `Map ${m} Total Under 21.5`, label: 'Менше 21.5' },
            { value: `Map ${m} Total Over 21.5`, label: 'Більше 21.5' },
            { value: `Map ${m} Total Under 22.5`, label: 'Менше 22.5' },
            { value: `Map ${m} Total Over 22.5`, label: 'Більше 22.5' },
            { value: `Map ${m} Total Under 23.5`, label: 'Менше 23.5' },
            { value: `Map ${m} Total Over 23.5`, label: 'Більше 23.5' },
          ],
        },
        {
          category: 'Переможець (без ОТ)',
          options: [{ value: `Map ${m} Winner No OT`, label: 'Переможець (без ОТ)' }],
        },
      ],
    });
  }
  return maps;
}
