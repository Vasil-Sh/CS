import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface BalanceTrackerProps {
  currentBank: number;
  allTimeHigh: number;
  allTimeLow: number;
  gameFilter: 'all' | 'CS2' | 'Dota2';
  onGameFilterChange: (f: 'all' | 'CS2' | 'Dota2') => void;
  cs2Bets: number;
  dota2Bets: number;
  cs2Profit: number;
  dota2Profit: number;
}

/**
 * Стан банку — зрозуміла картка для новачків.
 * Пояснює простими словами: скільки грошей у банку, чи зростає він, чи падає.
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
  const hasBets = allTimeHigh > 0;
  const percentOfPeak = hasBets ? (currentBank / allTimeHigh) * 100 : 100;

  const gameHasData =
    gameFilter === 'all' ? cs2Bets + dota2Bets > 0
    : gameFilter === 'CS2' ? cs2Bets > 0
    : dota2Bets > 0;

  const gameProfit = gameFilter === 'all' ? cs2Profit + dota2Profit
    : gameFilter === 'CS2' ? cs2Profit : dota2Profit;
  const gameBets = gameFilter === 'all' ? cs2Bets + dota2Bets
    : gameFilter === 'CS2' ? cs2Bets : dota2Bets;

  const isGrowing = hasBets && percentOfPeak >= 98;
  const isStable = hasBets && percentOfPeak >= 85 && percentOfPeak < 98;
  const isDipping = hasBets && percentOfPeak >= 50 && percentOfPeak < 85;
  const isFalling = hasBets && percentOfPeak < 50;

  const statusText = !hasBets
    ? 'Поки немає завершених ставок'
    : isGrowing
    ? 'Банк на максимумі — це найкращий результат! 🔥'
    : isStable
    ? 'Банк стабільний, близько до найкращого результату'
    : isDipping
    ? `Банк зменшився на ${(100 - percentOfPeak).toFixed(0)}% від найкращого`
    : `Банк значно просів — на ${(100 - percentOfPeak).toFixed(0)}% від максимуму`;

  const progressColor = !hasBets ? 'from-[#E5E7EB] to-[#D1D5DB]'
    : isGrowing || isStable ? 'from-[#10B981] to-[#34D399]'
    : isDipping ? 'from-[#F59E0B] to-[#FBBF24]'
    : 'from-[#EF4444] to-[#F87171]';

  const advice = !hasBets
    ? 'Додавай записи про ставки — цей блок покаже твій прогрес'
    : isGrowing
    ? 'Ти на правильному шляху. Продовжуй!'
    : isStable
    ? 'Усе добре. Дотримуйся стратегії.'
    : isDipping
    ? 'Можливо варто зменшити ставки або зробити паузу'
    : 'Радимо зменшити ставки та переглянути стратегію';

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
      {/* Title row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#3B82F6] hover:bg-[#DBEAFE] transition-colors flex-shrink-0">
                  <Info className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="max-w-xs bg-white border border-[#E5E7EB] rounded-2xl px-4 py-3 shadow-lg">
                <p className="text-sm font-semibold text-[#111827] mb-1">Як читати цей блок</p>
                <p className="text-xs text-[#6B7280] leading-relaxed space-y-1">
                  <span className="block">📈 <strong>Твій банк</strong> — скільки грошей у тебе зараз у банку для ставок.</span>
                  <span className="block">🏆 <strong>Найкращий результат</strong> — найвища сума, яку ти колись мав. Це твій орієнтир.</span>
                  <span className="block">📊 <strong>Прогрес-бар</strong> — показує де ти зараз відносно свого максимуму. Якщо смужка зелена — ти близько до рекорду. Якщо жовта чи червона — ти просів і варто зменшити ставки.</span>
                  <span className="block">💡 <strong>Порада</strong> — підказка що робити далі, залежно від твого стану.</span>
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div>
            <p className="text-sm text-[#9CA3AF]">Трекер балансу</p>
            <p className="text-2xl font-bold text-[#111827]">
              {currentBank.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴
            </p>
          </div>
        </div>
        {hasBets && (
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-[#9CA3AF]">Найкращий результат</p>
            <p className="text-base font-semibold text-[#111827]">
              {allTimeHigh.toLocaleString('uk-UA')} ₴
            </p>
          </div>
        )}
      </div>

      {/* Status + progress bar */}
      <div className="mb-3">
        <p className="text-sm text-[#6B7280] mb-2">{statusText}</p>
        {hasBets ? (
          <>
            <div className="relative w-full h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-700 ease-out`}
                style={{ width: `${Math.min(percentOfPeak, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-0.5 px-0.5">
              <span>0 ₴</span>
              <span>{allTimeHigh.toLocaleString('uk-UA')} ₴</span>
            </div>
          </>
        ) : (
          <div className="relative w-full h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden opacity-20" />
        )}
      </div>

      {/* Advice */}
      <p className="text-xs text-[#9CA3AF] leading-relaxed mb-3">
        💡 {advice}
      </p>

      {/* Per game summary */}
      <div className="flex items-center gap-4 text-xs text-[#6B7280] mb-3">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#447afc]" />
          CS2: {cs2Bets > 0 ? `${cs2Bets} ставок · ${cs2Profit >= 0 ? '+' : ''}${cs2Profit.toFixed(0)} ₴` : '—'}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
          Dota 2: {dota2Bets > 0 ? `${dota2Bets} ставок · ${dota2Profit >= 0 ? '+' : ''}${dota2Profit.toFixed(0)} ₴` : '—'}
        </span>
      </div>

      {/* Game filter */}
      <div className="border-t border-[#F3F4F6] pt-3 flex items-center gap-2">
        <span className="text-xs text-[#9CA3AF]">Дивитись на сторінці:</span>
        <div className="flex items-center gap-1">
          {(['CS2', 'Dota2'] as const).map((g) => (
            <button
              key={g}
              onClick={() => onGameFilterChange(gameFilter === g ? 'all' : g)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                gameFilter === g
                  ? 'bg-[#447afc] text-white shadow-[0_1px_4px_rgba(68,122,252,0.3)]'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
              }`}
            >
              {g === 'CS2' ? 'CS2' : 'Dota 2'}
            </button>
          ))}
        </div>
        {gameFilter !== 'all' && !gameHasData && (
          <span className="text-xs text-[#EF4444] ml-1">Немає даних</span>
        )}
        {gameFilter !== 'all' && gameHasData && (
          <span className="text-xs text-[#9CA3AF] ml-1">
            {gameBets} ставок · {gameProfit >= 0 ? '+' : ''}{gameProfit.toFixed(0)} ₴
          </span>
        )}
      </div>
    </div>
  );
}



