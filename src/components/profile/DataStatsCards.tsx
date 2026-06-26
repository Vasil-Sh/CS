interface Stats {
  bets: number;
  riskyTeams: number;
  strategies: number;
  goals: number;
  tgGroups: number;
}

interface Props {
  stats: Stats;
  cardBaseStyle: Record<string, string>;
  cardHoverStyle: Record<string, string>;
}

export default function DataStatsCards({ stats, cardBaseStyle, cardHoverStyle }: Props) {
  const labels: Array<{ key: keyof Stats; label: string }> = [
    { key: 'bets', label: 'Ваші ставки' },
    { key: 'riskyTeams', label: 'Ризикові команди' },
    { key: 'strategies', label: 'Стратегії' },
    { key: 'goals', label: 'Цілі' },
    { key: 'tgGroups', label: 'Telegram Групи' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
      {labels.map(({ key, label }) => (
        <div
          key={key}
          className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5"
          style={cardBaseStyle}
          onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
          onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
        >
          <p className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-[#111827] tracking-tight">{stats[key]}</p>
        </div>
      ))}
    </div>
  );
}
