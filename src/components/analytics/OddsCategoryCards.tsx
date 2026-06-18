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
            className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5 group"
            style={CARD_BASE_STYLE}
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, CARD_HOVER_STYLE); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, CARD_BASE_STYLE); }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h4 className="text-lg font-semibold text-[#111827]">{catLabel.label}</h4>
                <span className="text-sm text-[#9CA3AF]">Коеф. {catLabel.sublabel}</span>
              </div>
              <Badge className="bg-[#F3F4F6] text-[#111827] hover:bg-[#F3F4F6] px-3 py-1.5 rounded-lg border border-[#E5E7EB] font-semibold text-sm">
                {range.count}
              </Badge>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#6B7280]">Вінрейт</span>
                <span className={`text-base font-bold ${hasData ? 'text-[#111827]' : 'text-[#9CA3AF]'}`}>
                  {range.winRate}%
                </span>
              </div>
              <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{
                  width: `${Math.min(winRateNum, 100)}%`,
                  backgroundColor: hasData ? '#10B981' : '#D1D5DB'
                }} />
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#6B7280]">ROI</span>
              <span className={`text-base font-bold ${!hasData ? 'text-[#9CA3AF]' : roi >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {roi >= 0 ? '+' : ''}{roi}%
              </span>
            </div>

            <div className="border-t border-[#F3F4F6] mb-4" />

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6B7280]">Прибуток</span>
              <div className="flex items-center gap-2">
                {hasData && (range.profit >= 0
                  ? <ArrowUpRight className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} />
                  : <ArrowDownRight className="h-4 w-4 text-[#EF4444]" strokeWidth={2.5} />
                )}
                <span className={`text-xl font-bold ${!hasData ? 'text-[#9CA3AF]' : range.profit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
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
