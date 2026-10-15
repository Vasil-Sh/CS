import { type ReactNode } from "react";
import {
  Pencil,
  Wallet,
  BarChart3,
  FileText,
  Trophy,
  ThumbsDown,
  Clock,
} from "lucide-react";
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
  title?: string;
  subtitle?: string;
  extraAction?: ReactNode;
  hideCurrency?: boolean;
  hideEditBank?: boolean;
  variant?: "entry" | "default";
}
export default function RecordPageHeader({
  bets,
  bank,
  currency,
  onCurrencyChange,
  onEditBank,
  title = "ДОДАТИ ЗАПИС",
  subtitle = "Зафіксуйте рішення. Перевірте ризики. Відстежуйте результат.",
  extraAction,
  hideCurrency = false,
  hideEditBank = false,
  variant = "default",
}: Props) {
  const stats = recordHeaderStats(bets, currency);
  const money = (value: number) =>
    new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 2 }).format(value) +
    (currency === "USD" ? " $" : " ₴");
  if (variant === "entry") {
    const metrics = [
      {
        label: "Поточний банк",
        value: money(bank),
        hint: "Баланс у вибраній валюті",
        Icon: Wallet,
        color: "bank",
      },
      {
        label: "Чистий результат",
        value: (stats.profit > 0 ? "+" : "") + money(stats.profit),
        hint: "За весь час",
        Icon: BarChart3,
        color:
          stats.profit < 0 ? "negative" : stats.profit > 0 ? "positive" : "",
      },
      {
        label: "Всього записів",
        value: stats.total,
        hint: stats.activeCount
          ? `Активних: ${stats.activeCount}`
          : "Немає активних",
        Icon: FileText,
        color: "total",
      },
      {
        label: "Виграші",
        value: stats.wins,
        hint: "Успішні записи",
        Icon: Trophy,
        color: "positive",
      },
      {
        label: "Програші",
        value: stats.losses,
        hint: "Невдалі записи",
        Icon: ThumbsDown,
        color: "negative",
      },
      {
        label: "В активних записах",
        value: money(stats.activeAmount),
        hint: `Очікують: ${stats.activeCount}`,
        Icon: Clock,
        color: "pending",
      },
    ];
    return (
      <header className="record-entry-header">
        <div className="record-entry-hero">
          <div className="record-entry-intro">
            <span className="record-entry-eyebrow">
              RECORD ENTRY <i />
            </span>
            <h1>Додати запис</h1>
            <p>Збережіть матч, прогноз і власні аргументи.</p>
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
        <div className="record-entry-stats">
          {metrics.map(({ label, value, hint, Icon, color }, index) => (
            <div className="record-metric" key={label}>
              <Icon size={24} aria-hidden="true" />
              <div>
                <span>{label}</span>
                <strong className={color ? `entry-${color}` : ""}>
                  {value}
                </strong>
                <small>{hint}</small>
              </div>
              {index === 0 && !hideEditBank && (
                <button
                  className="record-bank-edit"
                  type="button"
                  onClick={onEditBank}
                  aria-label="Редагувати банк"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        {stats.missingRates && (
          <p className="record-header-warning">
            Частину USD-записів не враховано в сумах: немає збереженого курсу
            або суми в доларах.
          </p>
        )}
      </header>
    );
  }
  return (
    <header className="record-header">
      <div className="record-header-top">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="record-header-actions">
          {extraAction}
          {!hideCurrency && (
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
          )}
        </div>
      </div>
      <div className="record-header-stats">
        <div>
          <span>
            Поточний банк{" "}
            {!hideEditBank && (
              <button
                type="button"
                onClick={onEditBank}
                aria-label="Редагувати банк"
              >
                <Pencil size={14} />
              </button>
            )}
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
