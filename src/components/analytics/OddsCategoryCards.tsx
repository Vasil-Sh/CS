import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { CARD_BASE_STYLE, CARD_HOVER_STYLE } from '@/lib/cardStyles';

interface OddsRange {
  range: string;
  count: number;
  winRate: string;
  profit: number;
}

interface CategoryLabel {
  label: string;
  sublabel: string;
}

interface Props {
  data: OddsRange[];
  labels: CategoryLabel[];
}

/** 3 stat cards showing winrate, ROI, and profit by odds category (low/medium/high) */
export default function OddsCategoryCards({ data, labels }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {data.map((range, index) => {
        const catLabel = labels[index];
        const hasData = range.count > 0;
        const winRateNum = parseFloat(range.winRate);
        const roi = range.count > 0 ? Math.round((range.profit / (range.count * 100)) * 100) : 0;

        return (
          <div
            key={index}
            className="bg-white border border-gray-100 hover:border-gray-300 rounded-3xl px-6 py-5 group"
            style={CARD_BASE_STYLE}
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, CARD_HOVER_STYLE); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, CARD_BASE_STYLE); }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{catLabel.label}</h4>
                <span className="text-sm text-gray-400">Коеф. {catLabel.sublabel}</span>
              </div>
              <Badge className="bg-gray-100 text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 font-semibold text-sm">
                {range.count}
              </Badge>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Вінрейт</span>
                <span className={`text-base font-bold ${hasData ? 'text-gray-900' : 'text-gray-400'}`}>
                  {range.winRate}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{
                  width: `${Math.min(winRateNum, 100)}%`,
                  backgroundColor: hasData ? '#10B981' : '#D1D5DB'
                }} />
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">ROI</span>
              <span className={`text-base font-bold ${!hasData ? 'text-gray-400' : roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {roi >= 0 ? '+' : ''}{roi}%
              </span>
            </div>

            <div className="border-t border-gray-100 mb-4" />

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Прибуток</span>
              <div className="flex items-center gap-2">
                {hasData && (range.profit >= 0
                  ? <ArrowUpRight className="h-4 w-4 text-green-500" strokeWidth={2.5} />
                  : <ArrowDownRight className="h-4 w-4 text-red-500" strokeWidth={2.5} />
                )}
                <span className={`text-xl font-bold ${!hasData ? 'text-gray-400' : range.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {range.profit >= 0 ? '+' : ''}{Math.round(range.profit).toLocaleString('uk-UA')} ₴
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
