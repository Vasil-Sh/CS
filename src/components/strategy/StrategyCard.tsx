import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Eye, Trash2 } from "lucide-react";
import type { CS2Strategy } from "@/types/strategy";
import StrategySparkline from "./StrategySparkline";
import TrendIndicator from "./TrendIndicator";

interface StrategyStats {
  totalBets: number;
  wins: number;
  losses: number;
  pending: number;
  totalProfit: number;
  totalStake: number;
  winRate: number;
  roi: number;
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
  strategy,
  stats,
  isPrimary,
  getRiskIcon,
  getRiskColor,
  onDetails,
  onTogglePrimary,
  onDelete,
}: Props) {
  return (
    <div
      className={`bg-slate-50 border rounded-3xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-all flex flex-col ${isPrimary ? "border-2 border-blue-500" : "border border-slate-200"}`}
    >
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          <span className="flex items-center gap-2">
            {getRiskIcon(strategy.riskLevel)}
            <span
              className="font-semibold text-gray-900 break-words"
              title={strategy.name}
            >
              {strategy.name}
            </span>
            {isPrimary && (
              <Badge className="bg-blue-50 text-blue-500 border-0 rounded-full text-xs px-2 py-0.5 font-medium hover:bg-blue-50">
                <Star
                  className="h-2.5 w-2.5 mr-0.5 fill-blue-500"
                  strokeWidth={1.5}
                />
                Основна
              </Badge>
            )}
          </span>
          <Badge
            className={
              getRiskColor(strategy.riskLevel) +
              " text-xs px-2.5 py-0.5 font-medium hover:opacity-100"
            }
          >
            {strategy.riskLevel}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-2xl">
            <div
              className={`text-2xl font-bold ${(stats.roi || 0) >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {(stats.roi || 0) >= 0 ? "+" : ""}
              {stats.roi?.toFixed(1) || 0}%
            </div>
            <div className="text-xs text-gray-500 font-medium mt-1">ROI</div>
            <TrendIndicator stats={stats} />
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-2xl">
            <div
              className={`text-2xl font-bold ${(stats.winRate || 0) >= 50 ? "text-blue-500" : "text-gray-500"}`}
            >
              {stats.winRate?.toFixed(0) || 0}%
            </div>
            <div className="text-xs text-gray-500 font-medium mt-1">
              Вінрейт
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {stats.totalBets || 0} ставок
            </div>
          </div>
        </div>

        <div className="p-3 bg-white border border-gray-200 rounded-2xl mb-4">
          <div className="text-xs text-gray-500 font-medium mb-2">
            Тренд прибутку
          </div>
          {(stats.totalBets || 0) > 0 ? (
            <StrategySparkline profitHistory={stats.profitHistory} />
          ) : (
            <div className="h-10 flex items-center justify-center text-xs text-gray-400">
              Немає ставок для цієї стратегії
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-auto">
          <Button
            onClick={() => onDetails(strategy)}
            className="flex-1 rounded-xl bg-primary hover:bg-blue-700 text-white font-semibold"
          >
            <Eye className="h-4 w-4 mr-1" strokeWidth={1.5} />
            Деталі
          </Button>
          <Button
            onClick={() => onTogglePrimary(strategy)}
            variant="outline"
            size="sm"
            className={`rounded-xl font-medium ${isPrimary ? "border-blue-500 text-blue-500 bg-blue-50 hover:bg-blue-100" : "border-gray-200 hover:bg-gray-50"}`}
          >
            <Star
              className={`h-4 w-4 ${isPrimary ? "fill-blue-500" : ""}`}
              strokeWidth={1.5}
            />
          </Button>
          <Button
            onClick={() => onDelete(strategy.id || strategy.name)}
            variant="outline"
            size="sm"
            className="rounded-xl border-[#FEE2E2] text-red-500 hover:bg-red-50 font-medium"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}
