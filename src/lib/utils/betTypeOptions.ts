/**
 * Bet type options — grouped by game & format.
 * Extracted from displayHelpers.ts
 */

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

const BASIC_BET_TYPES: BetTypeGroup[] = [
  {
    category: 'Переможець',
    options: [{ value: 'Match Winner', label: 'Переможець матчу' }],
  },
  {
    category: 'Тотал карт',
    options: [
      { value: 'Total Maps Over 2.5', label: 'Більше 2.5' },
      { value: 'Total Maps Under 2.5', label: 'Менше 2.5' },
    ],
  },
  {
    category: 'Фора',
    options: [
      { value: 'Handicap +1.5', label: '+1.5' },
      { value: 'Handicap -1.5', label: '-1.5' },
    ],
  },
];

const MAP_BET_TYPES: BetTypeGroup[] = [
  {
    category: 'Переможець',
    options: [
      { value: 'MapWinner', label: 'Переможець карти' },
      { value: 'MapW_NoOT', label: 'Переможець (без ОТ)' },
    ],
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
];

/** Sectioned bet types: Основне + Карта 1/2/3 */
export function getGroupedBetTypeOptions(format?: string): SectionedBetTypes {
  const maxMaps = format === 'BO5' ? 5 : format === 'BO3' ? 3 : format === 'BO1' ? 1 : 3;
  const maps: MapBetTypeGroup[] = [];
  for (let m = 1; m <= maxMaps; m++) {
    maps.push({
      mapNumber: m,
      groups: MAP_BET_TYPES.map(g => ({
        category: `Карта ${m}: ${g.category}`,
        options: g.options.map(o => ({ value: `Map${m}_${o.value}`, label: o.label })),
      })),
    });
  }
  return { main: BASIC_BET_TYPES, maps };
}

/** Reverse-lookup: find the display label for a saved betType value */
export function getBetTypeLabel(betType: string, format?: string): string {
  if (!betType) return '';
  // Check flat options first
  const opts = getBetTypeOptions('CS2', format);
  const found = opts.find(o => o.value === betType);
  if (found) return found.label;
  // Check grouped options (main + maps)
  const grouped = getGroupedBetTypeOptions(format);
  // Search main groups
  for (const g of grouped.main) {
    const f = g.options.find(o => o.value === betType);
    if (f) return f.label;
  }
  // Search map groups
  for (const mg of grouped.maps) {
    for (const g of mg.groups) {
      const f = g.options.find(o => o.value === betType);
      if (f) {
        return `Карта ${mg.mapNumber}: ${f.label}`;
      }
    }
  }
  return betType;
}
