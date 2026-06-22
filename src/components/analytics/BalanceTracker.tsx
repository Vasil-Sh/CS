import { useState, useEffect } from 'react';
import { Info, TrendingUp, TrendingDown, Sparkles, Crosshair, Shield, BarChart3 } from 'lucide-react';
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

  // AI advice
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  useEffect(() => {
    if (!hasBets) { setAiAdvice(null); return; }
    const state: 'growing' | 'stable' | 'dipping' | 'falling' = isGrowing
      ? 'growing' : isStable ? 'stable' : isDipping ? 'dipping' : 'falling';
    setAiLoading(true);
    let cancelled = false;
    getBalanceAdvice({ state, percentOfPeak, currentBank, allTimeHigh, bets: cs2Bets + dota2Bets, profit: cs2Profit + dota2Profit })
      .then((advice) => { if (!cancelled) { setAiAdvice(advice); setAiLoading(false); } });
    return () => { cancelled = true; };
  }, [currentBank, allTimeHigh, hasBets, isGrowing, isStable, isDipping, percentOfPeak, cs2Bets, dota2Bets, cs2Profit, dota2Profit]);

  const statusText = !hasBets ? 'Поки немає завершених ставок'
    : isGrowing ? 'Банк на максимумі — це найкращий результат! 🔥'
    : isStable ? 'Банк стабільний, близько до найкращого результату'
    : isDipping ? `Банк зменшився на ${(100 - percentOfPeak).toFixed(0)}% від найкращого`
    : `Банк значно просів — на ${(100 - percentOfPeak).toFixed(0)}% від максимуму`;

  const advice = !hasBets ? 'Додавай записи про ставки — цей блок покаже твій прогрес'
    : isGrowing ? 'Ти на правильному шляху. Продовжуй!'
    : isStable ? 'Усе добре. Дотримуйся стратегії.'
    : isDipping ? 'Можливо варто зменшити ставки або зробити паузу'
    : 'Радимо зменшити ставки та переглянути стратегію';

  const progressGradient = !hasBets ? 'linear-gradient(90deg, #E5E7EB, #F3F4F6)'
    : isGrowing ? 'linear-gradient(90deg, #10B981, #34D399, #6EE7B7)'
    : isStable ? 'linear-gradient(90deg, #3B82F6, #60A5FA, #93C5FD)'
    : isDipping ? 'linear-gradient(90deg, #F59E0B, #FBBF24, #FDE68A)'
    : 'linear-gradient(90deg, #EF4444, #F87171, #FCA5A5)';

  const progressGlow = !hasBets ? 'rgba(156,163,175,0.1)'
    : isGrowing ? 'rgba(16,185,129,0.2)'
    : isStable ? 'rgba(59,130,246,0.2)'
    : isDipping ? 'rgba(245,158,11,0.2)'
    : 'rgba(239,68,68,0.2)';

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden group transition-all duration-300 ease-out"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transform: 'translateY(0)' }}
      onMouseEnter={(e) => { Object.assign(e.currentTarget.style, { transform: 'translateY(-2px)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }); }}
      onMouseLeave={(e) => { Object.assign(e.currentTarget.style, { transform: 'translateY(0)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }); }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#EFF6FF]">
              <BarChart3 className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
            </div>
            <span className="text-lg font-semibold text-[#111827]">Трекер балансу</span>
          </div>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#3B82F6] hover:bg-[#DBEAFE] hover:text-[#2563EB] transition-colors flex-shrink-0">
                  <Info className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end" className="max-w-xs bg-white border border-[#E5E7EB] rounded-2xl px-4 py-3 shadow-lg">
                <p className="text-sm font-semibold text-[#111827] mb-1">Як читати цей блок</p>
                <p className="text-xs text-[#6B7280] leading-relaxed space-y-1">
                  <span className="block">📈 <strong>Твій банк</strong> — скільки грошей у тебе зараз у банку для ставок.</span>
                  <span className="block">🏆 <strong>Найкращий результат</strong> — найвища сума, яку ти колись мав.</span>
                  <span className="block">📊 <strong>Прогрес-бар</strong> — показує де ти зараз відносно свого максимуму.</span>
                  <span className="block">💡 <strong>Порада</strong> — підказка що робити далі, залежно від твого стану.</span>
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="border-b border-[#E5E7EB] mt-3" />
      </div>

      {/* Status banner */}
      <div className="px-6 mb-4">
        <div className={`rounded-2xl px-4 py-2.5 border ${!hasBets ? 'bg-[#F9FAFB] border-[#E5E7EB]' : isGrowing ? 'bg-[#F0FDF4] border-[#BBF7D0]' : isStable ? 'bg-[#EFF6FF] border-[#BFDBFE]' : isDipping ? 'bg-[#FFFBEB] border-[#FDE68A]' : 'bg-[#FEF2F2] border-[#FECACA]'}`}>
          <p className={`text-sm font-medium ${!hasBets ? 'text-[#6B7280]' : isGrowing ? 'text-[#166534]' : isStable ? 'text-[#1E40AF]' : isDipping ? 'text-[#92400E]' : 'text-[#991B1B]'}`}>{statusText}</p>
        </div>
      </div>

      {/* Bank cards */}
      <div className="grid grid-cols-2 gap-3 px-6 mb-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#F9FAFB] to-[#F3F4F6] border border-[#E5E7EB] px-4 py-3.5">
          <p className="text-[11px] text-[#9CA3AF] font-medium uppercase tracking-wider mb-1">Поточний банк</p>
          <p className="text-2xl font-bold text-[#111827] tracking-tight">
            {hasBets ? currentBank.toLocaleString('uk-UA', { maximumFractionDigits: 0 }) : '0'} ₴
          </p>
          {hasBets && (
            <div className="flex items-center gap-1 mt-1">
              {isGrowing || isStable ? <TrendingUp className="h-3 w-3 text-[#10B981]" strokeWidth={2.5} /> : <TrendingDown className="h-3 w-3 text-[#EF4444]" strokeWidth={2.5} />}
              <span className={`text-xs font-medium ${isGrowing || isStable ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{percentOfPeak.toFixed(1)}% від піку</span>
            </div>
          )}
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7]/50 border border-[#FDE68A] px-4 py-3.5">
          <p className="text-[11px] text-[#92400E]/70 font-medium uppercase tracking-wider mb-1">🏆 Найкращий результат</p>
          <p className="text-2xl font-bold text-[#111827] tracking-tight">
            {hasBets ? allTimeHigh.toLocaleString('uk-UA') : '—'} ₴
          </p>
          <p className="text-xs text-[#92400E]/60 mt-0.5">Твій орієнтир</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-4">
        <div className="relative w-full h-4 bg-[#F3F4F6] rounded-full overflow-hidden" style={{ boxShadow: `0 0 14px ${progressGlow}` }}>
          <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(percentOfPeak, 100)}%`, background: progressGradient }} />
          {hasBets && (
            <div className="absolute top-0 left-0 h-full w-full opacity-30"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', backgroundSize: '200% 100%', animation: 'shimmer 2s ease-in-out infinite' }} />
          )}
        </div>
        <div className="flex justify-between text-[11px] text-[#9CA3AF] mt-1.5 font-medium">
          <span>0 ₴</span>
          <span>{hasBets ? `${allTimeHigh.toLocaleString('uk-UA')} ₴` : '—'}</span>
        </div>
      </div>

      {/* AI Advice */}
      <div className="px-6 mb-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#F3F4F6] to-[#F9FAFB] border border-[#E5E7EB] px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-[#6366F1]" strokeWidth={1.5} />
            <p className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider">AI-порада</p>
          </div>
          {aiLoading ? (
            <div className="space-y-2">
              <div className="h-3 bg-[#E5E7EB] rounded-full w-3/4 animate-pulse" />
              <div className="h-3 bg-[#E5E7EB] rounded-full w-1/2 animate-pulse" />
            </div>
          ) : aiAdvice ? (
            <p className="text-sm text-[#111827] leading-relaxed font-medium">«{aiAdvice}»</p>
          ) : (
            <p className="text-sm text-[#6B7280] leading-relaxed">{advice}</p>
          )}
        </div>
      </div>

      {/* Game cards */}
      <div className="grid grid-cols-2 gap-3 px-6 mb-4">
        {/* CS2 */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className={`h-1 ${cs2Bets > 0 ? 'bg-gradient-to-r from-[#F59E0B] to-[#EF4444]' : 'bg-[#E5E7EB]'}`} />
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#FFF7ED]">
                <Crosshair className="h-3.5 w-3.5 text-[#F97316]" strokeWidth={2} />
              </div>
              <span className="text-xs font-semibold text-[#111827]">CS2</span>
            </div>
            {cs2Bets > 0 ? (
              <>
                <p className="text-lg font-bold text-[#111827]">
                  <span className={cs2Profit >= 0 ? 'text-[#16A34A]' : 'text-[#EF4444]'}>{cs2Profit >= 0 ? '+' : ''}{cs2Profit.toFixed(0)} ₴</span>
                </p>
                <p className="text-[11px] text-[#9CA3AF]">{cs2Bets} ставк{cs2Bets === 1 ? 'а' : cs2Bets < 5 ? 'и' : 'ок'}</p>
              </>
            ) : (
              <>
                <div className="flex items-end gap-1 h-8 mb-0.5">
                  {[30, 50, 25, 60, 35, 45].map((h, i) => (<div key={i} className="flex-1 rounded-sm bg-[#F3F4F6]" style={{ height: `${h}%` }} />))}
                </div>
                <p className="text-[11px] text-[#9CA3AF]">Немає даних</p>
              </>
            )}
          </div>
        </div>

        {/* Dota 2 */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className={`h-1 ${dota2Bets > 0 ? 'bg-gradient-to-r from-[#8B5CF6] to-[#EC4899]' : 'bg-[#E5E7EB]'}`} />
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#F5F3FF]">
                <Shield className="h-3.5 w-3.5 text-[#8B5CF6]" strokeWidth={2} />
              </div>
              <span className="text-xs font-semibold text-[#111827]">Dota 2</span>
            </div>
            {dota2Bets > 0 ? (
              <>
                <p className="text-lg font-bold text-[#111827]">
                  <span className={dota2Profit >= 0 ? 'text-[#16A34A]' : 'text-[#EF4444]'}>{dota2Profit >= 0 ? '+' : ''}{dota2Profit.toFixed(0)} ₴</span>
                </p>
                <p className="text-[11px] text-[#9CA3AF]">{dota2Bets} ставк{dota2Bets === 1 ? 'а' : dota2Bets < 5 ? 'и' : 'ок'}</p>
              </>
            ) : (
              <>
                <div className="flex items-end gap-1 h-8 mb-0.5">
                  {[40, 20, 55, 30, 50, 25].map((h, i) => (<div key={i} className="flex-1 rounded-sm bg-[#F3F4F6]" style={{ height: `${h}%` }} />))}
                </div>
                <p className="text-[11px] text-[#9CA3AF]">Немає даних</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Game filter */}
      <div className="border-t border-[#F3F4F6] px-6 py-3 flex items-center gap-2">
        <span className="text-xs text-[#9CA3AF] font-medium">Фільтр сторінки:</span>
        <div className="flex items-center gap-1 bg-[#F3F4F6] rounded-full p-1">
          {(['CS2', 'Dota2'] as const).map((g) => (
            <button key={g} onClick={() => onGameFilterChange(gameFilter === g ? 'all' : g)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${gameFilter === g ? 'bg-white text-[#111827] shadow-sm' : 'text-[#9CA3AF] hover:text-[#6B7280]'}`}>
              {g === 'CS2' ? '🎯 CS2' : '🛡️ Dota 2'}
            </button>
          ))}
        </div>
        {gameFilter !== 'all' && gameHasData && (
          <span className="text-xs text-[#9CA3AF] ml-auto">{gameBets} ставок · {gameProfit >= 0 ? '+' : ''}{gameProfit.toFixed(0)} ₴</span>
        )}
      </div>
    </div>
  );
}
