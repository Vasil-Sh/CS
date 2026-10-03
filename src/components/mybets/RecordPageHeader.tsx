import { Pencil } from "lucide-react";
import type { Bet } from "@/types/betting";

export function recordHeaderStats(bets: Bet[], currency: "UAH" | "USD") {
  const matching = bets.filter((b) => (b.currency || "UAH") === currency);
  const pending = matching.filter((b) => b.result === "Pending");
  const amount = (b: Bet) =>
    currency === "UAH"
      ? Number(b.amount) || 0
      : b.originalAmount != null
        ? Number(b.originalAmount) || 0
        : Number(b.exchangeRate) > 0
          ? Number(b.amount) / Number(b.exchangeRate)
          : 0;
  const settled = matching.filter(
    (b) => b.result === "Win" || b.result === "Loss",
  );
  const wins = settled.filter((b) => b.result === "Win").length;
  const losses = settled.filter((b) => b.result === "Loss").length;
  const profit = settled.reduce(
    (sum, b) =>
      sum +
      (currency === "UAH"
        ? Number(b.profit) || 0
        : b.originalProfit != null
          ? Number(b.originalProfit) || 0
          : Number(b.exchangeRate) > 0
            ? (Number(b.profit) || 0) / Number(b.exchangeRate)
            : 0),
    0,
  );
  const missingRates =
    currency === "USD" &&
    matching.some((b) =>
      b.result === "Pending"
        ? b.originalAmount == null && !(Number(b.exchangeRate) > 0)
        : b.originalProfit == null && !(Number(b.exchangeRate) > 0),
    );
  return {
    activeAmount: pending.reduce((sum, b) => sum + amount(b), 0),
    activeCount: pending.length,
    profit,
    total: matching.length,
    wins,
    losses,
    missingRates,
  };
}

interface Props {
  bets: Bet[];
  bank: number;
  currency: "UAH" | "USD";
  onCurrencyChange: (currency: "UAH" | "USD") => void;
  onEditBank: () => void;
}
export default function RecordPageHeader({
  bets,
  bank,
  currency,
  onCurrencyChange,
  onEditBank,
}: Props) {
  const stats = recordHeaderStats(bets, currency);
  const money = (value: number) =>
    new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 2 }).format(value) +
    (currency === "USD" ? " $" : " ₴");
  return (
    <header className="record-header">
      <div className="record-header-top">
        <div>
          <h1>ДОДАТИ ЗАПИС</h1>
          <p>Зафіксуйте рішення. Перевірте ризики. Відстежуйте результат.</p>
        </div>
        <div className="record-currency" aria-label="Валюта статистики">
          {(["UAH", "USD"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={currency === value}
              onClick={() => onCurrencyChange(value)}
            >
              {value === "UAH" ? "₴ UAH" : "$ USD"}
            </button>
          ))}
        </div>
      </div>
      <div className="record-header-stats">
        <div>
          <span>
            Поточний банк{" "}
            <button
              type="button"
              onClick={onEditBank}
              aria-label="Редагувати банк"
            >
              <Pencil size={14} />
            </button>
          </span>
          <strong className="entry-bank">{money(bank)}</strong>
          <small>Баланс у вибраній валюті</small>
        </div>
        <div>
          <span>Чистий результат</span>
          <strong
            className={
              stats.profit > 0
                ? "entry-positive"
                : stats.profit < 0
                  ? "entry-negative"
                  : ""
            }
          >
            {stats.profit > 0 ? "+" : ""}
            {money(stats.profit)}
          </strong>
          <small>Розраховані записи · за весь час</small>
        </div>
      </div>
      <div className="record-header-stats record-header-stats-minor">
        <div>
          <span>Всього записів</span>
          <strong className="entry-total">{stats.total}</strong>
          <small>Немає активних</small>
        </div>
        <div>
          <span>Виграші</span>
          <strong className="entry-positive">{stats.wins}</strong>
          <small>Успішних записів</small>
        </div>
        <div>
          <span>Програші</span>
          <strong className="entry-negative">{stats.losses}</strong>
          <small>Невдалих записів</small>
        </div>
        <div>
          <span>В активних записах</span>
          <strong className="entry-pending">{money(stats.activeAmount)}</strong>
          <small>Сума ставок · очікують: {stats.activeCount}</small>
        </div>
      </div>
      {stats.missingRates && (
        <p className="record-header-warning">
          Частину USD-записів не враховано в сумах: немає збереженого курсу або
          суми в доларах.
        </p>
      )}
    </header>
  );
}
