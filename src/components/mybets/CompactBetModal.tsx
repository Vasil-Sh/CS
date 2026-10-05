import { useRef, useState } from "react";
import { Check, CheckCircle2, Copy, Info, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import "./CompactResultsModal.css";

export type ResultsPeriod = "all" | "day" | "week" | "month";

export interface ResultItem {
  id: string;
  selection: string;
  market: string;
  logoUrl?: string | null;
  odds: number;
  result: "Win" | "Loss";
  /** Чистий результат у валюті цього запису. */
  profit: number;
  currency: "UAH" | "USD";
}

interface CompactBetModalProps {
  open: boolean;
  onClose: () => void;

  period: ResultsPeriod;
  onPeriodChange: (period: ResultsPeriod) => void;

  /** Підтримка вибору конкретного місяця (коли period === "month"). */
  month: string;
  onMonthChange: (month: string) => void;
  monthOptions: { value: string; label: string }[];

  /** Уже відфільтровані за періодом розраховані записи. */
  records: ResultItem[];
}

const periods: { value: ResultsPeriod; label: string }[] = [
  { value: "all", label: "Усі" },
  { value: "day", label: "День" },
  { value: "week", label: "Тиждень" },
  { value: "month", label: "Місяць" },
];

function recordCount(count: number) {
  const last = count % 10;
  const lastTwo = count % 100;

  if (lastTwo >= 11 && lastTwo <= 14) return `${count} записів`;
  if (last === 1) return `${count} запис`;
  if (last >= 2 && last <= 4) return `${count} записи`;

  return `${count} записів`;
}

function money(value: number, currency: ResultItem["currency"]) {
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  const sign = rounded === 0 ? "" : value > 0 ? "+" : "−";

  const formatted = new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 2,
  }).format(rounded);

  return `${sign}${formatted} ${currency === "USD" ? "$" : "₴"}`;
}

function profitClass(value: number) {
  return value > 0 ? "cr-positive" : value < 0 ? "cr-negative" : "";
}

function SelectionLogo({ src, name }: { src?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className="compact-results__logo-fallback" aria-hidden="true">
        {name.trim().slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className="compact-results__logo"
      onError={() => setFailed(true)}
    />
  );
}

export default function CompactBetModal({
  open,
  onClose,
  period,
  onPeriodChange,
  month,
  onMonthChange,
  monthOptions,
  records,
}: CompactBetModalProps) {
  const [copying, setCopying] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [failedText, setFailedText] = useState<string | null>(null);
  const [currency, setCurrency] = useState<"all" | "UAH" | "USD">("all");
  const busyRef = useRef(false);

  // Відфільтровані за валютою записи.
  const visible =
    currency === "all"
      ? records
      : records.filter((item) => item.currency === currency);

  const wins = visible.filter((item) => item.result === "Win").length;
  const losses = visible.filter((item) => item.result === "Loss").length;

  const winRate = visible.length
    ? Math.round((wins / visible.length) * 100)
    : null;

  // Суми різних валют не змішуємо.
  // Агрегуємо у копійках/центах, щоб уникнути похибки float.
  const totals = new Map<ResultItem["currency"], number>();

  for (const item of visible) {
    totals.set(
      item.currency,
      (totals.get(item.currency) ?? 0) + Math.round(item.profit * 100),
    );
  }

  const summary = [...totals.entries()].map(([curr, minorUnits]) => ({
    currency: curr,
    profit: minorUnits / 100,
  }));

  const periodLabel =
    periods.find((item) => item.value === period)?.label ?? "Усі";

  const copyText = [
    "MatchIQ · Результати",
    `Період: ${periodLabel} · ${recordCount(visible.length)}`,
    "",
    ...visible.map(
      (item) =>
        `${item.result === "Win" ? "✓ Виграш" : "✕ Програш"} · ` +
        `${item.selection} · ${item.market} · ` +
        `Коеф. ${item.odds.toFixed(2)} · ` +
        money(item.profit, item.currency),
    ),
    "",
    `Чистий результат: ${
      summary.map((item) => money(item.profit, item.currency)).join(" / ") ||
      "—"
    }`,
    `Виграші / програші: ${wins} / ${losses}`,
    `Вінрейт: ${winRate === null ? "—" : `${winRate}%`}`,
  ].join("\n");

  const copied = copiedText === copyText;

  async function copyList() {
    if (!visible.length || busyRef.current) return;

    busyRef.current = true;
    setCopying(true);
    setCopiedText(null);
    setFailedText(null);

    const snapshot = copyText;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }

      await navigator.clipboard.writeText(snapshot);
      setCopiedText(snapshot);
    } catch {
      setFailedText(snapshot);
    } finally {
      busyRef.current = false;
      setCopying(false);
    }
  }

  function resetFeedback() {
    setCopiedText(null);
    setFailedText(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        resetFeedback();
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="compact-results">
        <header className="compact-results__header">
          <DialogTitle className="compact-results__title">
            Стислий список результатів
          </DialogTitle>

          <DialogDescription className="compact-results__subtitle">
            Підсумок записів для швидкого перегляду й копіювання.
          </DialogDescription>
        </header>

        <div className="compact-results__scroll">
          <div className="compact-results__filters">
            <span className="compact-results__period-label">Період:</span>

            <div
              className="compact-results__periods"
              role="group"
              aria-label="Період результатів"
            >
              {periods.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={period === item.value}
                  onClick={() => {
                    resetFeedback();
                    onPeriodChange(item.value);
                    if (item.value !== "month") onMonthChange("");
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {period === "month" && monthOptions.length > 0 && (
              <select
                className="compact-results__month"
                value={month}
                onChange={(e) => {
                  resetFeedback();
                  onMonthChange(e.target.value);
                }}
                aria-label="Оберіть місяць"
              >
                {monthOptions.map((mo) => (
                  <option key={mo.value} value={mo.value}>
                    {mo.label}
                  </option>
                ))}
              </select>
            )}

            <div
              className="compact-results__currencies"
              role="group"
              aria-label="Валюта результатів"
            >
              {(
                [
                  ["all", "Усі"],
                  ["UAH", "₴"],
                  ["USD", "$"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={currency === value}
                  onClick={() => {
                    resetFeedback();
                    setCurrency(value);
                  }}
                  title={
                    value === "UAH"
                      ? "Гривня"
                      : value === "USD"
                        ? "Долар"
                        : "Усі валюти"
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            <span className="compact-results__count">
              {recordCount(visible.length)}
            </span>
          </div>

          <dl className="compact-results__summary">
            <div>
              <dt>Чистий результат</dt>
              <dd>
                {summary.length
                  ? summary.map((item) => (
                      <span
                        key={item.currency}
                        className={profitClass(item.profit)}
                      >
                        {money(item.profit, item.currency)}
                      </span>
                    ))
                  : "—"}
              </dd>
            </div>

            <div>
              <dt>Виграші / програші</dt>
              <dd>
                {wins} / {losses}
              </dd>
            </div>

            <div>
              <dt>Вінрейт</dt>
              <dd>{winRate === null ? "—" : `${winRate}%`}</dd>
            </div>
          </dl>

          {visible.length ? (
            <div className="compact-results__table-wrap">
              <table className="compact-results__table">
                <caption className="sr-only">
                  Результати записів за вибраний період
                </caption>

                <thead>
                  <tr>
                    <th scope="col">Результат</th>
                    <th scope="col">Вибір і ринок</th>
                    <th scope="col">Коеф.</th>
                    <th scope="col">Прибуток</th>
                  </tr>
                </thead>

                <tbody>
                  {visible.map((item) => {
                    const isWin = item.result === "Win";
                    const StatusIcon = isWin ? CheckCircle2 : XCircle;

                    return (
                      <tr key={item.id}>
                        <td>
                          <span
                            className={`compact-results__status ${
                              isWin ? "cr-positive" : "cr-negative"
                            }`}
                          >
                            <StatusIcon size={28} aria-hidden="true" />
                            <span>{isWin ? "Виграш" : "Програш"}</span>
                          </span>
                        </td>

                        <td>
                          <div className="compact-results__selection">
                            <SelectionLogo
                              key={`${item.id}:${item.logoUrl ?? ""}`}
                              src={item.logoUrl}
                              name={item.selection}
                            />

                            <div>
                              <strong>{item.selection}</strong>
                              <span>{item.market}</span>
                            </div>
                          </div>
                        </td>

                        <td className="compact-results__number">
                          {item.odds.toFixed(2)}
                        </td>

                        <td
                          className={`compact-results__number ${profitClass(
                            item.profit,
                          )}`}
                        >
                          {money(item.profit, item.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="compact-results__empty">
              <h3>За цей період немає результатів</h3>
              <p>Виберіть інший період або дочекайтеся розрахунку записів.</p>
            </div>
          )}

          <div className="compact-results__notice">
            <Info size={20} aria-hidden="true" />
            <p>
              У підсумку — лише розраховані записи за вибраний період. Різні
              валюти підсумовуються окремо.
            </p>
          </div>

          {failedText !== null && (
            <div className="compact-results__fallback">
              <p role="alert">
                Не вдалося скопіювати автоматично. Натисніть на текст нижче та
                скопіюйте вручну.
              </p>

              <textarea
                aria-label="Список для ручного копіювання"
                value={failedText}
                readOnly
                onFocus={(event) => event.currentTarget.select()}
              />
            </div>
          )}
        </div>

        <footer className="compact-results__footer">
          <button
            type="button"
            className="compact-results__button"
            onClick={onClose}
          >
            Закрити
          </button>

          <div className="compact-results__copy-group">
            <button
              type="button"
              className="
                compact-results__button
                compact-results__button--primary
              "
              disabled={!visible.length || copying}
              onClick={copyList}
              aria-busy={copying}
            >
              {copied ? (
                <Check size={20} aria-hidden="true" />
              ) : (
                <Copy size={20} aria-hidden="true" />
              )}

              {copying
                ? "Копіювання…"
                : copied
                  ? "Скопійовано"
                  : "Копіювати список"}
            </button>

            <span>{recordCount(visible.length)} · текст для повідомлення</span>
          </div>

          <span className="sr-only" role="status">
            {copied ? "Список скопійовано." : ""}
          </span>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
