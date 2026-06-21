import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { getBalanceAdvice } from '@/lib/deepSeekService';
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

  // AI advice state
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  useEffect(() => {
    if (!hasBets) {
      setAiAdvice(null);
      return;
    }
    const state: 'growing' | 'stable' | 'dipping' | 'falling' = isGrowing
      ? 'growing' : isStable ? 'stable' : isDipping ? 'dipping' : 'falling';
    setAiLoading(true);
    let cancelled = false;
    getBalanceAdvice({
      state,
      percentOfPeak,
      currentBank,
      allTimeHigh,
      bets: cs2Bets + dota2Bets,
      profit: cs2Profit + dota2Profit,
    }).then((advice) => {
      if (!cancelled) {
        setAiAdvice(advice);
        setAiLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [currentBank, allTimeHigh, hasBets, isGrowing, isStable, isDipping, percentOfPeak, cs2Bets, dota2Bets, cs2Profit, dota2Profit]);

  const statusText = !hasBets
    ? 'Поки немає завершених ставок'
    : isGrowing
    ? 'Банк на максимумі — це найкращий результат! 🔥'
    : isStable
    ? 'Банк стабільний, близько до найкращого результату'
    : isDipping
    ? `Банк зменшився на ${(100 - percentOfPeak).toFixed(0)}% від найкращого`
    : `Банк значно просів — на ${(100 - percentOfPeak).toFixed(0)}% від максимуму`;

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
      className="bg-white border border-[#D1D5DB] rounded-3xl px-6 py-5 group transition-all duration-300 ease-out overflow-hidden"
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
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#3B82F6] hover:bg-[#DBEAFE] transition-colors flex-shrink-0">
                  <Info className="h-5 w-5" strokeWidth={1.5} />
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
          <span className="text-lg font-semibold text-[#111827]">Трекер балансу</span>
                  </div>
      </div>
      {/* Divider */}
      <div className="border-b border-[#E5E7EB] -mx-6 mb-3"></div>

      {/* Section 1 — Status */}
      <div className="rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] px-4 py-3 mb-3">
        <p className="text-sm text-[#111827] font-medium">{statusText}</p>
      </div>

      {/* Section 2 — Progress bar + amounts */}
      <div className="rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] px-4 py-3 mb-3">
        {/* Amounts row — current bank on left, best result on right */}
        {hasBets && (
          <div className="flex justify-between items-baseline mb-2">
            <div>
              <p className="text-xs text-[#9CA3AF]">Поточний банк</p>
              <p className="text-xl font-semibold text-[#111827]">
                {currentBank.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#9CA3AF]">Найкращий результат</p>
              <p className="text-xl font-semibold text-[#111827]">
                {allTimeHigh.toLocaleString('uk-UA')} ₴
              </p>
            </div>
          </div>
        )}
        {hasBets ? (
          <div className="relative w-full h-3 bg-[#E5E7EB] rounded-full overflow-hidden">
            {/* Filled bar with shimmer */}
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(percentOfPeak, 100)}%`,
                background: isGrowing || isStable
                  ? 'repeating-linear-gradient(90deg, #10B981, #34D399 16%, #6EE7B7 33%, #34D399 50%, #10B981 66%, #34D399 83%, #6EE7B7 100%)'
                  : isDipping
                  ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                  : 'linear-gradient(90deg, #EF4444, #F87171)',
                animation: isGrowing || isStable
                  ? 'waves 3s linear infinite'
                  : 'shimmer 3s ease-in-out infinite',
              }}
            />
          </div>
        ) : (
          <div className="relative w-full h-3 bg-[#E5E7EB] rounded-full overflow-hidden opacity-20" />
        )}
        <div className="flex justify-between text-sm text-[#6B7280] mt-2 font-medium">
          <span>0 ₴</span>
          <span>{hasBets ? `${allTimeHigh.toLocaleString('uk-UA')} ₴` : '—'}</span>
        </div>
      </div>

      {/* Section 3 — Advice */}
      <div className="rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] px-4 py-3 mb-3">
        <p className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider mb-1">Поради до банку</p>
        {aiLoading ? (
          <p className="text-sm text-[#9CA3AF] leading-relaxed animate-pulse">Аналізую стан банку...</p>
        ) : aiAdvice ? (
          <p className="text-sm text-[#111827] leading-relaxed font-medium">{aiAdvice}</p>
        ) : hasBets ? (
          <p className="text-sm text-[#6B7280] leading-relaxed">{advice}</p>
        ) : (
          <p className="text-sm text-[#6B7280] leading-relaxed">{advice}</p>
        )}
      </div>

      {/* Section 4 — Game summary */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-xl px-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB]">
          <p className="text-[11px] text-[#9CA3AF] font-medium uppercase tracking-wide mb-0.5">CS2</p>
          {cs2Bets > 0 ? (
            <p className="text-sm font-semibold text-[#111827]">
              {cs2Bets} ставок · <span className={cs2Profit >= 0 ? 'text-[#16A34A]' : 'text-[#EF4444]'}>{cs2Profit >= 0 ? '+' : ''}{cs2Profit.toFixed(0)} ₴</span>
            </p>
          ) : (
            <p className="text-xs text-[#9CA3AF]">Немає даних</p>
          )}
        </div>
        <div className="rounded-xl px-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB]">
          <p className="text-[11px] text-[#9CA3AF] font-medium uppercase tracking-wide mb-0.5">Dota 2</p>
          {dota2Bets > 0 ? (
            <p className="text-sm font-semibold text-[#111827]">
              {dota2Bets} ставок · <span className={dota2Profit >= 0 ? 'text-[#16A34A]' : 'text-[#EF4444]'}>{dota2Profit >= 0 ? '+' : ''}{dota2Profit.toFixed(0)} ₴</span>
            </p>
          ) : (
            <p className="text-xs text-[#9CA3AF]">Немає даних</p>
          )}
        </div>
      </div>

      {/* Section 5 — Game filter */}
      <div className="border-t border-[#F3F4F6] pt-3 flex items-center gap-2">
        <span className="text-xs text-[#9CA3AF]">Дивитись на сторінці:</span>
        <div className="flex items-center gap-1">
          {(['CS2', 'Dota2'] as const).map((g) => (
            <button
              key={g}
              onClick={() => onGameFilterChange(gameFilter === g ? 'all' : g)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
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



