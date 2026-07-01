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
    <div className="flex bg-[#F3F4F6] rounded-xl p-0.5">
      <button
        type="button"
        onClick={() => onChange("UAH")}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
          currency === "UAH"
            ? "bg-white text-[#111827] shadow-sm"
            : "text-[#9CA3AF] hover:text-[#6B7280]"
        }`}
      >
        ₴ UAH
      </button>
      <button
        type="button"
        onClick={() => onChange("USD")}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
          currency === "USD"
            ? "bg-[#FEF3C7] text-[#D97706] shadow-sm"
            : "text-[#9CA3AF] hover:text-[#6B7280]"
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
