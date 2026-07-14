import { Trophy, Star } from 'lucide-react';

interface StrategyStats { roi: number; totalBets: number; winRate: number; }

interface Props {
  stats: Record<string, StrategyStats>;
  primaryStrategyName: string | null;
}

export default function StrategyTopRoiList({ stats, primaryStrategyName }: Props) {
  const entries = Object.entries(stats).sort(([, a], [, b]) => b.roi - a.roi).slice(0, 5);

  return (
    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-gray-900" strokeWidth={1.5} /><span className="text-lg font-semibold text-gray-900">Топ по ROI</span></div>
      </div>
      <div className="p-6">
        <div className="space-y-3">
          {entries.length > 0 ? (
            entries.map(([name, s], i) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-400 flex-shrink-0">#{i + 1}</span>
                  <span className="text-sm truncate text-gray-900 flex items-center gap-1 font-medium" title={name}>
                    <span className="truncate">{name}</span>
                    {primaryStrategyName === name && <Star className="h-3 w-3 fill-blue-500 text-blue-500 flex-shrink-0" strokeWidth={1.5} />}
                  </span>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ml-2 ${s.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>{s.roi >= 0 ? '+' : ''}{s.roi.toFixed(1)}%</span>
              </div>
            ))
          ) : <p className="text-sm text-gray-400 text-center py-4">Немає даних для відображення</p>}
        </div>
      </div>
    </div>
  );
}
