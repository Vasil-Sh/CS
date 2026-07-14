import { memo } from "react";

interface CurrencySwitchProps {
  currency: "UAH" | "USD";
  onChange: (c: "UAH" | "USD") => void;
  hasUsdBets?: boolean;
}

const CurrencySwitchMemo = memo(function CurrencySwitch({
  currency,
  onChange,
  hasUsdBets,
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
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
          currency === "USD"
            ? "bg-primary text-white shadow-sm"
            : "text-gray-400 hover:text-gray-500"
        } ${!hasUsdBets ? "opacity-40 cursor-not-allowed" : ""}`}
        disabled={!hasUsdBets}
        title={
          !hasUsdBets ? "Немає ставок у доларах" : "Показати доларовий баланс"
        }
      >
        $ USDT
      </button>
    </div>
  );
});

export default CurrencySwitchMemo;
