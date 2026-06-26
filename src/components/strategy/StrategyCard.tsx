import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Eye, Trash2 } from 'lucide-react';
import type { CS2Strategy } from '@/lib/realGoogleSheets';
import StrategySparkline from './StrategySparkline';
import TrendIndicator from './TrendIndicator';

interface StrategyStats {
  totalBets: number; wins: number; losses: number; pending: number;
  totalProfit: number; totalStake: number; winRate: number; roi: number;
  profitHistory?: number[];
}

interface Props {
  strategy: CS2Strategy;
  stats: StrategyStats;
  isPrimary: boolean;
  getRiskIcon: (risk: string) => JSX.Element;
  getRiskColor: (risk: string) => string;
  onDetails: (s: CS2Strategy) => void;
  onTogglePrimary: (s: CS2Strategy) => void;
  onDelete: (id: string) => void;
}

export default function StrategyCard({
  strategy, stats, isPrimary, getRiskIcon, getRiskColor,
  onDetails, onTogglePrimary, onDelete,
}: Props) {
  return (
    <div className={`bg-[#F8FAFC] border rounded-3xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-all flex flex-col ${isPrimary ? 'border-2 border-[#3B82F6]' : 'border border-[#E2E8F0]'}`}>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          <span className="flex items-center gap-2">
            {getRiskIcon(strategy.riskLevel)}
            <span className="font-semibold text-[#111827] break-words" title={strategy.name}>{strategy.name}</span>
            {isPrimary && (
              <Badge className="bg-[#EFF6FF] text-[#3B82F6] border-0 rounded-full text-xs px-2 py-0.5 font-medium hover:bg-[#EFF6FF]">
                <Star className="h-2.5 w-2.5 mr-0.5 fill-[#3B82F6]" strokeWidth={1.5} />Основна
              </Badge>
            )}
          </span>
          <Badge className={getRiskColor(strategy.riskLevel) + ' text-xs px-2.5 py-0.5 font-medium hover:opacity-100'}>{strategy.riskLevel}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex flex-col items-center justify-center p-3 bg-white border border-[#E5E7EB] rounded-2xl">
            <div className={`text-2xl font-bold ${(stats.roi || 0) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
              {(stats.roi || 0) >= 0 ? '+' : ''}{stats.roi?.toFixed(1) || 0}%
            </div>
            <div className="text-xs text-[#6B7280] font-medium mt-1">ROI</div>
            <TrendIndicator stats={stats} />
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-white border border-[#E5E7EB] rounded-2xl">
            <div className={`text-2xl font-bold ${(stats.winRate || 0) >= 50 ? 'text-[#3B82F6]' : 'text-[#6B7280]'}`}>
              {stats.winRate?.toFixed(0) || 0}%
            </div>
            <div className="text-xs text-[#6B7280] font-medium mt-1">Вінрейт</div>
            <div className="text-xs text-[#9CA3AF] mt-1">{stats.totalBets || 0} ставок</div>
          </div>
        </div>

        <div className="p-3 bg-white border border-[#E5E7EB] rounded-2xl mb-4">
          <div className="text-xs text-[#6B7280] font-medium mb-2">Тренд прибутку</div>
          {(stats.totalBets || 0) > 0 ? (
            <StrategySparkline profitHistory={stats.profitHistory} />
          ) : (
            <div className="h-10 flex items-center justify-center text-xs text-[#9CA3AF]">Немає ставок для цієї стратегії</div>
          )}
        </div>

        <div className="flex gap-2 mt-auto">
          <Button onClick={() => onDetails(strategy)} className="flex-1 rounded-xl bg-[#447afc] hover:bg-[#3568d4] text-white font-semibold">
            <Eye className="h-4 w-4 mr-1" strokeWidth={1.5} />Деталі
          </Button>
          <Button onClick={() => onTogglePrimary(strategy)} variant="outline" size="sm" className={`rounded-xl font-medium ${isPrimary ? 'border-[#3B82F6] text-[#3B82F6] bg-[#EFF6FF] hover:bg-[#DBEAFE]' : 'border-[#E5E7EB] hover:bg-[#F9FAFB]'}`}>
            <Star className={`h-4 w-4 ${isPrimary ? 'fill-[#3B82F6]' : ''}`} strokeWidth={1.5} />
          </Button>
          <Button onClick={() => onDelete(strategy.id || strategy.name)} variant="outline" size="sm" className="rounded-xl border-[#FEE2E2] text-[#EF4444] hover:bg-[#FEF2F2] font-medium">
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}
