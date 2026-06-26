import { BarChart3, Star } from 'lucide-react';

interface Props {
  strategiesCount: number;
  betsCount: number;
  bestStrategy: string;
  primaryStrategyName: string | null;
}

export default function StrategyOverallStats({ strategiesCount, betsCount, bestStrategy, primaryStrategyName }: Props) {
  return (
    <div className="bg-white border border-[#F3F4F6] rounded-3xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div className="px-6 py-5 border-b border-[#F3F4F6]">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
          <span className="text-lg font-semibold text-[#111827]">Загальна статистика</span>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between"><span className="text-sm text-[#6B7280]">Всього стратегій:</span><span className="font-semibold text-[#111827]">{strategiesCount}</span></div>
          <div className="flex justify-between"><span className="text-sm text-[#6B7280]">Всього ставок:</span><span className="font-semibold text-[#111827]">{betsCount}</span></div>
          {bestStrategy !== 'Немає' && (
            <div className="flex justify-between"><span className="text-sm text-[#6B7280]">Найкраща стратегія:</span><span className="font-semibold text-[#22C55E] truncate max-w-[150px]" title={bestStrategy}>{bestStrategy}</span></div>
          )}
          {primaryStrategyName && (
            <div className="flex justify-between"><span className="text-sm text-[#6B7280]">Основна стратегія:</span><span className="font-semibold text-[#111827] flex items-center gap-1 truncate max-w-[150px]" title={primaryStrategyName}><Star className="h-3 w-3 fill-[#3B82F6] text-[#3B82F6] flex-shrink-0" strokeWidth={1.5} /><span className="truncate">{primaryStrategyName}</span></span></div>
          )}
        </div>
      </div>
    </div>
  );
}
