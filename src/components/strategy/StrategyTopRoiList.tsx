import { Trophy, Star } from 'lucide-react';

interface StrategyStats { roi: number; totalBets: number; winRate: number; }

interface Props {
  stats: Record<string, StrategyStats>;
  primaryStrategyName: string | null;
}

export default function StrategyTopRoiList({ stats, primaryStrategyName }: Props) {
  const entries = Object.entries(stats).sort(([, a], [, b]) => b.roi - a.roi).slice(0, 5);

  return (
    <div className="bg-white border border-[#F3F4F6] rounded-3xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div className="px-6 py-5 border-b border-[#F3F4F6]">
        <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-[#111827]" strokeWidth={1.5} /><span className="text-lg font-semibold text-[#111827]">Топ по ROI</span></div>
      </div>
      <div className="p-6">
        <div className="space-y-3">
          {entries.length > 0 ? (
            entries.map(([name, s], i) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-semibold text-[#9CA3AF] flex-shrink-0">#{i + 1}</span>
                  <span className="text-sm truncate text-[#111827] flex items-center gap-1 font-medium" title={name}>
                    <span className="truncate">{name}</span>
                    {primaryStrategyName === name && <Star className="h-3 w-3 fill-[#3B82F6] text-[#3B82F6] flex-shrink-0" strokeWidth={1.5} />}
                  </span>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ml-2 ${s.roi >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{s.roi >= 0 ? '+' : ''}{s.roi.toFixed(1)}%</span>
              </div>
            ))
          ) : <p className="text-sm text-[#9CA3AF] text-center py-4">Немає даних для відображення</p>}
        </div>
      </div>
    </div>
  );
}
