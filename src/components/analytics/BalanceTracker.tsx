import { TrendingUp, Shield } from 'lucide-react';

interface BalanceTrackerProps {
  currentBank: number;
  allTimeHigh: number;
  allTimeLow: number;
}

/**
 * Візуальний індикатор балансу відносно історичного піку.
 * Використовує синьо-фіолетову гаму в стилі загального дизайну додатку.
 */
export default function BalanceTracker({ currentBank, allTimeHigh, allTimeLow }: BalanceTrackerProps) {
  if (allTimeHigh <= 0) return null;

  const percentOfPeak = (currentBank / allTimeHigh) * 100;
  const isAtPeak = percentOfPeak >= 98;
  const isGood = percentOfPeak >= 85;
  const isWarning = percentOfPeak >= 70 && percentOfPeak < 85;
  const isCritical = percentOfPeak < 70;

  const barColor = isGood ? '#447afc' : isWarning ? '#6366F1' : '#8B5CF6';
  const bgClass = 'bg-[#EFF6FF] border border-[#BFDBFE]';
  const iconBgClass = 'bg-[#DBEAFE]';

  const zoneText = isAtPeak
    ? 'Банк на історичному максимумі 🔥'
    : isGood
    ? `Банк на ${percentOfPeak.toFixed(0)}% від піку — стабільно`
    : isWarning
    ? `Просадка ${(100 - percentOfPeak).toFixed(0)}% від піку — обережно`
    : `Просадка ${(100 - percentOfPeak).toFixed(0)}% від піку — зменшіть ставки`;

  const recommendation = isAtPeak
    ? 'Можна продовжувати поточну стратегію'
    : isGood
    ? 'Продовжуйте дотримуватись стратегії'
    : isWarning
    ? 'Розгляньте зменшення розміру ставок на 25%'
    : 'Зменшіть ставки вдвічі. Зробіть паузу на день-два.';

  return (
    <div className={`rounded-3xl p-5 ${bgClass}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${iconBgClass}`}>
            <Shield className="h-4 w-4 text-[#447afc]" strokeWidth={1.5} />
          </div>
          <div>
            <span className="text-sm font-semibold text-[#111827]">Баланс-трекер</span>
            <span className="text-xs text-[#6B7280] ml-2">{zoneText}</span>
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
          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#447afc] to-[#8B5CF6] transition-all duration-700 ease-out"
          style={{ width: `${Math.min(percentOfPeak, 100)}%` }}
        />
        <div className="absolute top-0 h-full w-0.5 bg-[#111827]" style={{ left: '50%' }} />
      </div>

      <div className="flex justify-between text-[10px] text-[#9CA3AF] px-1">
        <span>70% ▼</span>
        <span>85%</span>
        <span>100% ▲</span>
      </div>

      <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
        💡 {recommendation}
      </p>
    </div>
  );
}
