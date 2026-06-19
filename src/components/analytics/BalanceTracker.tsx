import { Shield } from 'lucide-react';

interface BalanceTrackerProps {
  currentBank: number;
  allTimeHigh: number;
  allTimeLow: number;
  gameFilter: 'all' | 'CS2' | 'Dota2';
  onGameFilterChange: (f: 'all' | 'CS2' | 'Dota2') => void;
}

/**
 * Баланс-трекер у стилі банера активної стратегії (синій градієнт).
 * Показує поточний банк відносно історичного піку + фільтр гри.
 */
export default function BalanceTracker({
  currentBank,
  allTimeHigh,
  allTimeLow,
  gameFilter,
  onGameFilterChange,
}: BalanceTrackerProps) {
  const hasHistory = allTimeHigh > 0;
  const percentOfPeak = hasHistory ? (currentBank / allTimeHigh) * 100 : 100;
  const isAtPeak = percentOfPeak >= 98;
  const isClose = percentOfPeak >= 85;
  const isWarning = hasHistory && percentOfPeak >= 50 && percentOfPeak < 85;
  const isDrop = hasHistory && percentOfPeak < 50;

  const statusLabel = !hasHistory
    ? 'Ще немає даних'
    : isAtPeak
    ? 'На історичному піку 🔥'
    : isClose
    ? 'Близько до піку'
    : isWarning
    ? `Просадка ${(100 - percentOfPeak).toFixed(0)}%`
    : `Значна просадка ${(100 - percentOfPeak).toFixed(0)}%`;

  const badgeBg = !hasHistory || isAtPeak || isClose
    ? 'bg-white/25'
    : isWarning
    ? 'bg-[#FEF3C7]/30'
    : 'bg-[#FEE2E2]/30';
  const badgeText = !hasHistory || isAtPeak || isClose
    ? 'text-white'
    : isWarning
    ? 'text-[#FEF3C7]'
    : 'text-[#FECACA]';

  return (
    <div className="rounded-3xl overflow-hidden border border-[#BFDBFE]" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      {/* Top — gradient banner with bank + status */}
      <div className="flex items-center justify-between px-6 py-5" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm">
            <Shield className="h-5 w-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm text-white/80">
              Баланс-трекер:{' '}
              <span className="font-semibold text-white">
                {currentBank.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴
              </span>
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-2 py-0.5 rounded-full ${badgeBg} ${badgeText}`}>
                {statusLabel}
              </span>
              {hasHistory && (
                <span className="text-xs text-white/60">
                  Пік: {allTimeHigh.toLocaleString('uk-UA')} ₴
                </span>
              )}
            </div>
          </div>
        </div>
        {hasHistory && (
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold text-white">{percentOfPeak.toFixed(0)}%</div>
            <div className="text-xs text-white/60">від піку</div>
          </div>
        )}
      </div>

      {/* Bottom — progress bar + game filter */}
      <div className="bg-white px-6 py-3 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          {hasHistory ? (
            <>
              <div className="relative w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#447afc] to-[#8B5CF6] transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(percentOfPeak, 100)}%` }}
                />
                <div className="absolute top-0 h-full w-0.5 bg-[#111827]/50" style={{ left: '50%' }} />
                {isDrop && (
                  <div className="absolute top-0 h-full w-0.5 bg-[#EF4444]/40" style={{ left: `${percentOfPeak}%` }} />
                )}
              </div>
              <div className="flex justify-between text-[10px] text-[#9CA3AF] px-0.5 mt-0.5">
                <span>{isDrop ? `⬇ ${percentOfPeak.toFixed(0)}%` : ''}</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </>
          ) : (
            <>
              <div className="relative w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden opacity-30">
                <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#447afc] to-[#8B5CF6]" style={{ width: '100%' }} />
              </div>
              <p className="text-[10px] text-[#9CA3AF] mt-0.5 text-center">
                Додайте записи — трекер покаже динаміку
              </p>
            </>
          )}
        </div>

        <div className="w-px h-8 bg-[#E5E7EB] flex-shrink-0" />

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {(['all', 'CS2', 'Dota2'] as const).map((g) => (
            <button
              key={g}
              onClick={() => onGameFilterChange(g)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                gameFilter === g
                  ? 'bg-[#447afc] text-white shadow-[0_1px_4px_rgba(68,122,252,0.3)]'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
              }`}
            >
              {g === 'all' ? 'Всі ігри' : g === 'CS2' ? '🎯 CS2' : '🛡️ Dota 2'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

