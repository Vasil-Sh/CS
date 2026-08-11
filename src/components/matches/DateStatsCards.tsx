import {
  Trophy,
  TrendingUp,
  Globe,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface StatCardsProps {
  displayCount: number;
  cs2DisplayedCount: number;
  dota2DisplayedCount: number;
  avgCoefficient: number;
  tournamentCount: number;
  avgConfidence: number;
}

const cardBaseStyle: React.CSSProperties = {
  boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
  transition: "all 0.2s ease",
};
const cardHoverStyle: React.CSSProperties = {
  boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
  transform: "translateY(-1px)",
};

export default function DateStatsCards({
  displayCount,
  cs2DisplayedCount,
  dota2DisplayedCount,
  avgCoefficient,
  tournamentCount,
  avgConfidence,
}: StatCardsProps) {
  const cards = [
    {
      icon: <Trophy className="h-5 w-5 text-primary" strokeWidth={1.5} />,
      label: "Всього матчів",
      value: displayCount,
      color: "text-gray-900",
      sub: (
        <>
          <span className="text-sm font-semibold text-amber-600">
            CS2 {cs2DisplayedCount}
          </span>
          <span className="text-sm text-gray-400">—</span>
          <span className="text-sm font-semibold text-[#7C3AED]">
            Dota {dota2DisplayedCount}
          </span>
          <span className="text-sm text-[#4B5563]">матчів</span>
        </>
      ),
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-primary" strokeWidth={1.5} />,
      label: "Середній коефіцієнт",
      value: avgCoefficient > 0 ? `x${avgCoefficient.toFixed(2)}` : "—",
      color: "text-emerald-600",
      sub: <span className="text-sm text-[#4B5563]">середня виплата</span>,
    },
    {
      icon: <Globe className="h-5 w-5 text-primary" strokeWidth={1.5} />,
      label: "Турнірів",
      value: tournamentCount,
      color: "text-sky-600",
      sub: <span className="text-sm text-[#4B5563]">сьогодні</span>,
    },
    {
      icon: <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />,
      label: "Середній Прогноз",
      value: `${avgConfidence}%`,
      color: "text-[#8B5CF6]",
      sub: (
        <>
          {avgConfidence >= 65 ? (
            <ArrowUpRight
              className="h-4 w-4 text-green-500"
              strokeWidth={2.5}
            />
          ) : (
            <ArrowDownRight
              className="h-4 w-4 text-red-500"
              strokeWidth={2.5}
            />
          )}
          <span
            className={`text-sm font-semibold ${avgConfidence >= 65 ? "text-green-500" : "text-red-500"}`}
          >
            {avgConfidence >= 65 ? "Хороший рівень" : "Низький рівень"}
          </span>
        </>
      ),
    },
  ];

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white border border-gray-100 hover:border-gray-300 rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) =>
              Object.assign(e.currentTarget.style, cardHoverStyle)
            }
            onMouseLeave={(e) =>
              Object.assign(e.currentTarget.style, cardBaseStyle)
            }
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50">
                {c.icon}
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {c.label}
              </span>
            </div>
            <div
              className={`text-4xl font-bold tracking-tight mb-2 ${c.color}`}
            >
              {c.value}
            </div>
            <div className="flex items-center gap-2">{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
