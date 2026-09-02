import { memo } from "react";

interface CurrencySwitchProps {
  currency: "UAH" | "USD";
  onChange: (c: "UAH" | "USD") => void;
  hasUsdBets?: boolean;
  /** Pulsing highlight on the USD button when true (new USD bets discovered) */
  highlightUsd?: boolean;
}

const CurrencySwitchMemo = memo(function CurrencySwitch({
  currency,
  onChange,
  hasUsdBets,
  highlightUsd,
}: CurrencySwitchProps) {
  return (
    <div className="flex bg-gray-100 rounded-xl p-0.5">
      <button
        type="button"
        onClick={() => onChange("UAH")}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
          currency === "UAH"
            ? "bg-primary text-white shadow-sm"
            : "text-gray-400 hover:text-gray-500"
        }`}
      >
        ₴ UAH
      </button>
      <button
        type="button"
        onClick={() => onChange("USD")}
        className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
          currency === "USD"
            ? "bg-primary text-white shadow-sm"
            : highlightUsd
              ? "text-gray-700 bg-amber-50 ring-1 ring-amber-400"
              : "text-gray-400 hover:text-gray-500"
        } ${!hasUsdBets ? "opacity-40 cursor-not-allowed" : ""}`}
        disabled={!hasUsdBets}
        title={
          !hasUsdBets ? "Немає ставок у доларах" : "Показати доларовий баланс"
        }
      >
        {highlightUsd && hasUsdBets && (
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
        )}
        $ USDT
      </button>
    </div>
  );
});

export default CurrencySwitchMemo;
