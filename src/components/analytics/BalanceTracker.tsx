import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface BalanceTrackerProps {
  currentBank: number;
  allTimeHigh: number;
  allTimeLow: number;
  gameFilter: 'all' | 'CS2' | 'Dota2';
  onGameFilterChange: (f: 'all' | 'CS2' | 'Dota2') => void;
  /** Total completed bets for each game (used in game-specific stats) */
  cs2Bets: number;
  dota2Bets: number;
  cs2Profit: number;
  dota2Profit: number;
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
  cs2Bets,
  dota2Bets,
  cs2Profit,
  dota2Profit,
}: BalanceTrackerProps) {
  const hasHistory = allTimeHigh > 0;
  const percentOfPeak = hasHistory ? (currentBank / allTimeHigh) * 100 : 100;

  // Game-specific data check
  const gameHasData =
    gameFilter === 'all'
      ? cs2Bets + dota2Bets > 0
      : gameFilter === 'CS2'
      ? cs2Bets > 0
      : dota2Bets > 0;

  const gameProfit =
    gameFilter === 'all'
      ? cs2Profit + dota2Profit
      : gameFilter === 'CS2'
      ? cs2Profit
      : dota2Profit;

  const gameBets =
    gameFilter === 'all'
      ? cs2Bets + dota2Bets
      : gameFilter === 'CS2'
      ? cs2Bets
      : dota2Bets;

  const isAtPeak = percentOfPeak >= 98;
  const isClose = percentOfPeak >= 85;
  const isWarning = hasHistory && percentOfPeak >= 50 && percentOfPeak < 85;
  const isDrop = hasHistory && percentOfPeak < 50;

  const statusLabel = !hasHistory
    ? 'Немає даних'
    : isAtPeak
    ? 'На піку 🔥'
    : isClose
    ? 'Близько до піку'
    : isWarning
    ? `Просадка ${(100 - percentOfPeak).toFixed(0)}%`
    : `Просадка ${(100 - percentOfPeak).toFixed(0)}%`;

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
      {/* Row 1: label + amount + percent */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827] transition-colors flex-shrink-0">
                  <Info className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="max-w-xs bg-white border border-[#E5E7EB] rounded-2xl px-4 py-3 shadow-lg">
                <p className="text-sm font-semibold text-[#111827] mb-1">Баланс-трекер</p>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Поточний банк відносно історичного максимуму.
                  Зелена крапка — близько до піку, жовта — просадка, червона — значна просадка.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-[#9CA3AF]">Баланс-трекер</span>
              <span className="text-lg font-semibold text-[#111827]">
                {currentBank.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-xs text-[#6B7280]">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot}`} />
                {statusLabel}
              </span>
              {hasHistory && (
                <span className="text-xs text-[#9CA3AF]">
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
            <div className="text-xs text-[#9CA3AF]">від піку</div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        {hasHistory ? (
          <>
            <div className="relative w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#10B981] to-[#34D399] transition-all duration-700 ease-out"
                style={{ width: `${Math.min(percentOfPeak, 100)}%` }}
              />
              <div className="absolute top-0 h-full w-0.5 bg-white" style={{ left: '50%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-[#9CA3AF] px-0.5 mt-0.5">
              <span>{isDrop ? `⬇ ${percentOfPeak.toFixed(0)}%` : ''}</span>
              <span className={percentOfPeak < 50 ? 'text-[#EF4444]' : ''}>50%</span>
              <span>100%</span>
            </div>
          </>
        ) : (
          <>
            <div className="relative w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden opacity-20" />
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Додайте записи — трекер покаже динаміку
            </p>
          </>
        )}
      </div>

      {/* Game stats row */}
      <div className="flex items-center gap-4 text-xs text-[#6B7280] mb-3">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#447afc]" />
          CS2: {cs2Bets > 0 ? `${cs2Bets} ставок · ${cs2Profit >= 0 ? '+' : ''}${cs2Profit.toFixed(0)} ₴` : 'немає даних'}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
          Dota 2: {dota2Bets > 0 ? `${dota2Bets} ставок · ${dota2Profit >= 0 ? '+' : ''}${dota2Profit.toFixed(0)} ₴` : 'немає даних'}
        </span>
      </div>

      {/* Divider + game filter */}
      <div className="border-t border-[#F3F4F6] pt-3 flex items-center gap-3">
        <span className="text-xs text-[#9CA3AF]">Гра:</span>
        <div className="flex items-center gap-1.5">
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
              {g === 'all' ? 'Всі' : g === 'CS2' ? 'CS2' : 'Dota 2'}
            </button>
          ))}
        </div>
        {gameFilter !== 'all' && !gameHasData && (
          <span className="text-xs text-[#EF4444] ml-2">Немає даних для {gameFilter === 'CS2' ? 'CS2' : 'Dota 2'}</span>
        )}
        {gameFilter !== 'all' && gameHasData && (
          <span className="text-xs text-[#9CA3AF] ml-2">
            {gameBets} ставок · {gameProfit >= 0 ? '+' : ''}{gameProfit.toFixed(0)} ₴
          </span>
        )}
      </div>
    </div>
  );
}


