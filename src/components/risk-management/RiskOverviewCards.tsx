import { Shield, AlertTriangle, Target } from 'lucide-react';
import type { RiskyTeam } from '@/data/riskyTeams';

interface RiskOverviewCardsProps {
  riskyTeams: RiskyTeam[];
}

export default function RiskOverviewCards({ riskyTeams }: RiskOverviewCardsProps) {
  const total = riskyTeams.length;
  const banTeams = riskyTeams.filter(t => t.status === 'БАН').length;
  const needsAttention = riskyTeams.filter(t => t.status === 'БАН' || t.status === 'Нестабільні').length;
  const csCount = riskyTeams.filter(t => t.game === 'CS').length;
  const dotaCount = riskyTeams.filter(t => t.game === 'Дота').length;

  const iconBg = 'bg-blue-50';
  const iconText = 'text-blue-500';
  const cardBase = 'bg-white border border-gray-200 rounded-2xl p-5';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total risky teams */}
      <div className={cardBase}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${iconBg}`}>
            <Shield className={`h-4 w-4 ${iconText}`} strokeWidth={1.5} />
          </div>
          <span className="text-sm text-gray-500 font-medium">Всього команд</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{total}</p>
        <p className="text-xs text-gray-400 mt-1">
          CS: {csCount} · Дота: {dotaCount}
        </p>
      </div>

      {/* BAN teams */}
      <div className={cardBase}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${iconBg}`}>
            <AlertTriangle className={`h-4 w-4 ${iconText}`} strokeWidth={1.5} />
          </div>
          <span className="text-sm text-gray-500 font-medium">БАН</span>
        </div>
        <p className="text-2xl font-bold text-red-600">{banTeams}</p>
        <p className="text-xs text-gray-400 mt-1">Заборонені команди</p>
      </div>

      {/* Needs attention */}
      <div className={cardBase}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${iconBg}`}>
            <Target className={`h-4 w-4 ${iconText}`} strokeWidth={1.5} />
          </div>
          <span className="text-sm text-gray-500 font-medium">Потребують уваги</span>
        </div>
        <p className="text-2xl font-bold text-amber-600">{needsAttention}</p>
        <p className="text-xs text-gray-400 mt-1">БАН + Нестабільні</p>
      </div>

      {/* Game dominance */}
      <div className={cardBase}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${iconBg}`}>
            <Shield className={`h-4 w-4 ${iconText}`} strokeWidth={1.5} />
          </div>
          <span className="text-sm text-gray-500 font-medium">Домінує гра</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {csCount > dotaCount ? 'CS' : dotaCount > csCount ? 'Дота' : '50/50'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {csCount > dotaCount ? `${csCount} CS / ${dotaCount} Дота` : `${dotaCount} Дота / ${csCount} CS`}
        </p>
      </div>
    </div>
  );
}
