import { BarChart3, Star } from 'lucide-react';

interface Props {
  strategiesCount: number;
  betsCount: number;
  bestStrategy: string;
  primaryStrategyName: string | null;
}

export default function StrategyOverallStats({ strategiesCount, betsCount, bestStrategy, primaryStrategyName }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-gray-900" strokeWidth={1.5} />
          <span className="text-lg font-semibold text-gray-900">Загальна статистика</span>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between"><span className="text-sm text-gray-500">Всього стратегій:</span><span className="font-semibold text-gray-900">{strategiesCount}</span></div>
          <div className="flex justify-between"><span className="text-sm text-gray-500">Всього ставок:</span><span className="font-semibold text-gray-900">{betsCount}</span></div>
          {bestStrategy !== 'Немає' && (
            <div className="flex justify-between"><span className="text-sm text-gray-500">Найкраща стратегія:</span><span className="font-semibold text-green-500 truncate max-w-[150px]" title={bestStrategy}>{bestStrategy}</span></div>
          )}
          {primaryStrategyName && (
            <div className="flex justify-between"><span className="text-sm text-gray-500">Основна стратегія:</span><span className="font-semibold text-gray-900 flex items-center gap-1 truncate max-w-[150px]" title={primaryStrategyName}><Star className="h-3 w-3 fill-blue-500 text-blue-500 flex-shrink-0" strokeWidth={1.5} /><span className="truncate">{primaryStrategyName}</span></span></div>
          )}
        </div>
      </div>
    </div>
  );
}
