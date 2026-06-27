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

export interface SectionedBetTypes {
  main: BetTypeGroup[];
  maps: MapBetTypeGroup[];
}

const BASIC_BET_TYPES: BetTypeGroup[] = [
  {
    category: 'Переможець',
    options: [{ value: 'Match Winner', label: 'Переможець матчу' }],
  },
  {
    category: 'Тотал карт',
    options: [{ value: 'Total Maps', label: 'Тотал карт' }],
  },
  {
    category: 'Фора',
    options: [
      { value: 'Handicap +1.5', label: '+1.5' },
      { value: 'Handicap -1.5', label: '-1.5' },
    ],
  },
  {
    category: 'Раунди',
    options: [
      { value: 'Pistol Round', label: 'Пістолетний раунд' },
      { value: 'Total Rounds', label: 'Тотал раундів' },
    ],
  },
];

const MAP_BET_TYPES: BetTypeGroup[] = [
  {
    category: 'Переможець',
    options: [{ value: 'MapWinner', label: 'Переможець' }],
  },
  {
    category: 'Фора',
    options: [
      { value: 'HC_T1-2.5', label: '-2.5' },
      { value: 'HC_T2+2.5', label: '+2.5' },
      { value: 'HC_T1+2.5', label: '+2.5' },
      { value: 'HC_T2-2.5', label: '-2.5' },
      { value: 'HC_T1-3.5', label: '-3.5' },
      { value: 'HC_T2+3.5', label: '+3.5' },
      { value: 'HC_T1+3.5', label: '+3.5' },
      { value: 'HC_T2-3.5', label: '-3.5' },
      { value: 'HC_T1-4.5', label: '-4.5' },
      { value: 'HC_T2+4.5', label: '+4.5' },
      { value: 'HC_T1+4.5', label: '+4.5' },
      { value: 'HC_T2-4.5', label: '-4.5' },
      { value: 'HC_T1-5.5', label: '-5.5' },
      { value: 'HC_T2+5.5', label: '+5.5' },
      { value: 'HC_T1+5.5', label: '+5.5' },
      { value: 'HC_T2-5.5', label: '-5.5' },
    ],
  },
  {
    category: 'Тотал',
    options: [
      { value: 'TOT_U19.5', label: 'Менше 19.5' },
      { value: 'TOT_O19.5', label: 'Більше 19.5' },
      { value: 'TOT_U20.5', label: 'Менше 20.5' },
      { value: 'TOT_O20.5', label: 'Більше 20.5' },
      { value: 'TOT_U21.5', label: 'Менше 21.5' },
      { value: 'TOT_O21.5', label: 'Більше 21.5' },
      { value: 'TOT_U22.5', label: 'Менше 22.5' },
      { value: 'TOT_O22.5', label: 'Більше 22.5' },
      { value: 'TOT_U23.5', label: 'Менше 23.5' },
      { value: 'TOT_O23.5', label: 'Більше 23.5' },
    ],
  },
  {
    category: 'Переможець (без ОТ)',
    options: [{ value: 'MapW_NoOT', label: 'Переможець (без ОТ)' }],
  },
];

/** Sectioned bet types: Основне + Карта 1/2/3 */
export function getGroupedBetTypeOptions(format?: string): SectionedBetTypes {
  const maxMaps = format === 'BO5' ? 5 : format === 'BO3' ? 3 : format === 'BO1' ? 1 : 3;
  const maps: MapBetTypeGroup[] = [];
  for (let m = 1; m <= maxMaps; m++) {
    maps.push({
      mapNumber: m,
      groups: MAP_BET_TYPES.map(g => ({
        category: g.category,
        options: g.options.map(o => ({ value: `Map${m}_${o.value}`, label: o.label })),
      })),
    });
  }
  return { main: BASIC_BET_TYPES, maps };
}
