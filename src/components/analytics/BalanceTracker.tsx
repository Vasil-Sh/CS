import { Shield } from 'lucide-react';

interface BalanceTrackerProps {
  currentBank: number;
  allTimeHigh: number;
  allTimeLow: number;
  gameFilter: 'all' | 'CS2' | 'Dota2';
  onGameFilterChange: (f: 'all' | 'CS2' | 'Dota2') => void;
}

/**
 * Баланс-трекер у стилі StatCard — білий фон, сіра обводка, тінь при hover.
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

  const statusDot = !hasHistory || isAtPeak || isClose
    ? 'bg-[#10B981]'
    : isWarning
    ? 'bg-[#F59E0B]'
    : 'bg-[#EF4444]';

  return (
    <div
      className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5 group transition-all duration-300 ease-out overflow-hidden"
      style={{
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        transform: 'translateY(0)',
      }}
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, {
          transform: 'translateY(-3px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        });
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, {
          transform: 'translateY(0)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        });
      }}
    >
      {/* Header row — bank + status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#F3F4F6]">
            <Shield className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-lg font-semibold text-[#111827]">
              {currentBank.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-sm text-[#6B7280]">
                <span className={`inline-block w-2 h-2 rounded-full ${statusDot}`} />
                {statusLabel}
              </span>
              {hasHistory && (
                <span className="text-sm text-[#9CA3AF]">
                  · Пік: {allTimeHigh.toLocaleString('uk-UA')} ₴
                </span>
              )}
            </div>
          </div>
        </div>
        {hasHistory && (
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold text-[#111827] tracking-tight">
              {percentOfPeak.toFixed(0)}%
            </div>
            <div className="text-sm text-[#9CA3AF]">від піку</div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        {hasHistory ? (
          <>
            <div className="relative w-full h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-[#111827] transition-all duration-700 ease-out"
                style={{ width: `${Math.min(percentOfPeak, 100)}%` }}
              />
              <div className="absolute top-0 h-full w-0.5 bg-white" style={{ left: '50%' }} />
              {isDrop && (
                <div className="absolute top-0 h-full w-0.5 bg-[#EF4444]/60" style={{ left: `${percentOfPeak}%` }} />
              )}
            </div>
            <div className="flex justify-between text-[10px] text-[#9CA3AF] px-0.5 mt-0.5">
              <span>{isDrop ? `⬇ ${percentOfPeak.toFixed(0)}%` : ''}</span>
              <span className={percentOfPeak < 50 ? 'text-[#EF4444]' : ''}>50%</span>
              <span>100%</span>
            </div>
          </>
        ) : (
          <>
            <div className="relative w-full h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden opacity-30" />
            <p className="text-xs text-[#9CA3AF] mt-0.5 text-center">
              Додайте записи — трекер покаже динаміку
            </p>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[#F3F4F6] pt-4 flex items-center gap-4">
        <div className="flex items-center gap-1.5 flex-1">
          <span className="text-sm text-[#9CA3AF]">Гра:</span>
          {(['all', 'CS2', 'Dota2'] as const).map((g) => (
            <button
              key={g}
              onClick={() => onGameFilterChange(g)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                gameFilter === g
                  ? 'bg-[#111827] text-white shadow-sm'
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


