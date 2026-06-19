import { TrendingUp, TrendingDown, AlertTriangle, Shield } from 'lucide-react';

interface BalanceTrackerProps {
  currentBank: number;
  allTimeHigh: number;
  allTimeLow: number;
}

/**
 * Візуальний індикатор балансу з зонами ризику:
 * - 🟢 Зелена: банк ≥ 90% від історичного максимуму — можна діяти
 * - 🟡 Жовта: банк 70-90% від максимуму — обережно
 * - 🔴 Червона: банк < 70% від максимуму — зменшити ставки
 */
export default function BalanceTracker({ currentBank, allTimeHigh, allTimeLow }: BalanceTrackerProps) {
  if (allTimeHigh <= 0) return null;

  const percentOfPeak = (currentBank / allTimeHigh) * 100;
  const isAtPeak = percentOfPeak >= 98;
  const isGreen = percentOfPeak >= 90;
  const isYellow = percentOfPeak >= 70 && percentOfPeak < 90;
  const isRed = percentOfPeak < 70;

  const zoneColor = isGreen ? '#10B981' : isYellow ? '#F59E0B' : '#EF4444';
  const zoneBg = isGreen ? 'bg-[#F0FDF4] border-[#BBF7D0]' : isYellow ? 'bg-[#FFFBEB] border-[#FDE68A]' : 'bg-[#FEF2F2] border-[#FECACA]';
  const zoneIcon = isGreen ? Shield : isYellow ? AlertTriangle : TrendingDown;
  const zoneText = isAtPeak
    ? 'Банк на історичному максимумі 🔥'
    : isGreen
    ? `Банк на ${percentOfPeak.toFixed(0)}% від піку — стабільно`
    : isYellow
    ? `Просадка ${(100 - percentOfPeak).toFixed(0)}% від піку — обережно`
    : `Просадка ${(100 - percentOfPeak).toFixed(0)}% від піку — зменшіть ставки`;

  const recommendation = isAtPeak
    ? 'Можна продовжувати поточну стратегію'
    : isGreen
    ? 'Продовжуйте дотримуватись стратегії'
    : isYellow
    ? 'Розгляньте зменшення розміру ставок на 25%'
    : 'Зменшіть ставки вдвічі. Зробіть паузу на день-два.';

  return (
    <div className={`rounded-3xl p-5 border ${zoneBg}`}>
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${isGreen ? 'bg-[#DCFCE7]' : isYellow ? 'bg-[#FEF3C7]' : 'bg-[#FEE2E2]'}`}>
            <zoneIcon className="h-4 w-4" style={{ color: zoneColor }} strokeWidth={1.5} />
          </div>
          <div>
            <span className="text-sm font-semibold text-[#111827]">Баланс-трекер</span>
            <span className="text-xs text-[#9CA3AF] ml-2">{zoneText}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#6B7280]">
          <span>Пік: <span className="font-semibold text-[#111827]">{allTimeHigh.toLocaleString('uk-UA')} ₴</span></span>
          {allTimeLow > 0 && <span>Мін: <span className="font-semibold text-[#111827]">{allTimeLow.toLocaleString('uk-UA')} ₴</span></span>}
        </div>
      </div>

      {/* Gradient bar */}
      <div className="relative w-full h-3 bg-[#E5E7EB] rounded-full overflow-hidden mb-2">
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.min(percentOfPeak, 100)}%`,
            backgroundColor: zoneColor,
          }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-[#111827]"
          style={{ left: '50%' }}
        />
      </div>

      {/* Zone labels */}
      <div className="flex justify-between text-[10px] text-[#9CA3AF] px-1">
        <span>70% ▼ Зменшити</span>
        <span>85% Обережно</span>
        <span>100% ▲ Пік</span>
      </div>

      {/* Recommendation */}
      <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
        💡 {recommendation}
      </p>
    </div>
  );
}
