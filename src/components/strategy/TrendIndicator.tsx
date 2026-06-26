import { TrendingUp, TrendingDown } from 'lucide-react';

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

/** Pure component: trend arrow badge for strategy stats */
export default function TrendIndicator({ stats }: { stats: StrategyStats }) {
  if (!stats.profitHistory || stats.profitHistory.length < 2) return null;

  const lastValue = stats.profitHistory[stats.profitHistory.length - 1];
  const prevValue = stats.profitHistory[stats.profitHistory.length - 2];
  const change = ((lastValue - prevValue) / Math.abs(prevValue || 1)) * 100;

  if (Math.abs(change) < 1) return null;

  return (
    <div className={`flex items-center justify-center gap-1 text-xs font-medium ${change > 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
      {change > 0 ? <TrendingUp className="h-3 w-3" strokeWidth={1.5} /> : <TrendingDown className="h-3 w-3" strokeWidth={1.5} />}
      {change > 0 ? '+' : ''}{change.toFixed(1)}%
    </div>
  );
}
