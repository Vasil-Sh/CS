interface StrategyData {
  id?: string;
  name: string;
  riskLevel?: string;
  description?: string;
  expectedROI?: number;
  criteria?: string[];
}

/**
 * StrategyKpiCard — extracted from StrategyOverviewHeader
 * Displays the primary strategy name on the KPI card.
 * Created as a separate file to bypass Vite caching issue with SOH.
 */
import { memo } from 'react';
import { Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ShineBorder } from '@/components/ui/shine-border';
import { UserDataService } from '@/lib/userDataService';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from '@/contexts/AuthContext';
import { CARD_BASE_STYLE, applyCardHover, resetCardHover } from '@/lib/cardStyles';

interface StrategyKpiCardProps {
  onNavigate: () => void;
}

const riskBadgeClass = (risk: string) => {
  switch (risk) {
    case 'Low': return 'bg-[#DCFCE7] text-[#6B7280]';
    case 'Medium': return 'bg-[#FEF3C7] text-[#6B7280]';
    case 'High': return 'bg-[#FEE2E2] text-[#DC2626]';
    default: return 'bg-[#F3F4F6] text-[#6B7280]';
  }
};

const riskLabel = (risk: string) => {
  switch (risk) {
    case 'Low': return 'Низький';
    case 'Medium': return 'Середній';
    case 'High': return 'Високий';
    default: return risk;
  }
};

const StrategyKpiCardMemo = memo(function StrategyKpiCard({ onNavigate }: StrategyKpiCardProps) {
  const { user } = useAuth();
  const resolvedUser = user?.username || localStorage.getItem('username') || 'default';
  useAppStore((s) => s.strategyVersion); // re-render on changes

  // Read primary strategy directly from localStorage
  const pid = UserDataService.getUserData<string>(resolvedUser, 'primary_strategy', '')
    || (() => { const r = localStorage.getItem('primaryStrategy'); if (r) try { return JSON.parse(r); } catch { return r; } return ''; })();

  const strategies = UserDataService.getUserData<StrategyData[]>(resolvedUser, 'strategies_data', []);
  const active = pid ? strategies.find((s) => s.id === pid || s.name === pid) : null;

  const roi = 0; // computed by parent

  return (
    <button
      type="button"
      onClick={onNavigate}
      className="text-left bg-white border border-[#E5E7EB] hover:border-[#9CA3AF] rounded-3xl px-6 py-5 cursor-pointer group relative flex flex-col justify-between overflow-hidden"
      style={CARD_BASE_STYLE}
      onMouseEnter={(e) => applyCardHover(e.currentTarget)}
      onMouseLeave={(e) => resetCardHover(e.currentTarget)}
    >
      <ShineBorder shineColor={["#447afc", "#7C3AED", "#F59E0B"]} duration={12} borderWidth={2} />
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#EFF6FF]">
          <Target className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
        </div>
        <span className="text-lg font-semibold text-[#111827]">Активна стратегія</span>
      </div>
      {active ? (
        <>
          <div className="text-3xl font-bold text-[#111827] tracking-tight mb-2 break-words" title={active.name}>
            {active.name}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${riskBadgeClass(active.riskLevel)} text-xs font-medium px-2 py-0.5 border-0 rounded-full hover:opacity-100`}>
              {riskLabel(active.riskLevel)}
            </Badge>
            {roi !== null ? (
              <span className={`text-sm font-semibold ${roi >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                ROI {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
              </span>
            ) : (
              <span className="text-sm text-[#9CA3AF]">Немає ставок</span>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col flex-1">
          <div className="text-3xl font-bold text-[#9CA3AF] tracking-tight mb-2">Не обрано</div>
          <span className="text-sm text-[#9CA3AF]">Оберіть основну стратегію</span>
        </div>
      )}
    </button>
  );
});

export default StrategyKpiCardMemo;
