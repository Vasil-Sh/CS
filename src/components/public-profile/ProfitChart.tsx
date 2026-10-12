import type { CSSProperties } from "react";
import {
  displayValue,
  formatNumber,
  monthLabel,
  signedNumber,
  type DisplayCurrency,
  type PublicProfileData,
} from "./publicProfileModel";

export function ProfitChart({
  data,
  currency,
  rate,
}: {
  data: PublicProfileData["monthlyProfit"];
  currency: DisplayCurrency;
  rate: number | null;
}) {
  const rows = [...data]
    .sort((a, b) => b.month.localeCompare(a.month))
    .map((row) => ({
      ...row,
      value: displayValue(row.profit, currency, rate),
    }));
  if (!rows.length)
    return (
      <div className="public-empty public-chart-empty">
        <strong>Графік ще попереду</strong>
        <p>Тут з’явиться прибуток після завершених ставок.</p>
      </div>
    );
  if (rows.some((row) => row.value === null))
    return (
      <div className="public-empty public-chart-empty">
        <strong>Бракує курсу для конвертації</strong>
        <p>Прибуток в оригінальній валюті доступний у журналі нижче.</p>
      </div>
    );
  const values = rows.map((row) => row.value!);
  const min = Math.min(0, ...values),
    max = Math.max(0, ...values);
  const extent = max - min || 1;
  const zero = (-min / extent) * 100;
  const unit = currency === "USD" ? "$" : "₴";
  return (
    <div
      className="public-chart-scroll"
      role="region"
      aria-label="Прибуток за місяцями"
    >
      <div
        className="public-horizontal-chart"
        style={{ "--zero": `${zero}%` } as CSSProperties}
      >
        {rows.map((row, index) => {
          const value = row.value!;
          const end = ((value - min) / extent) * 100;
          return (
            <div className="public-chart-row" key={row.month}>
              <span className="public-chart-month">
                {monthLabel(row.month)}
              </span>
              <div className="public-chart-track" aria-hidden="true">
                <span
                  className={`public-chart-bar${value < 0 ? " is-negative" : ""}`}
                  style={
                    {
                      left: `${Math.min(zero, end)}%`,
                      width: `${Math.abs(end - zero)}%`,
                      "--bar-delay": `${Math.min(index, 8) * 35}ms`,
                    } as CSSProperties
                  }
                />
              </div>
              <span
                className={
                  value > 0
                    ? "public-positive"
                    : value < 0
                      ? "public-negative"
                      : ""
                }
              >
                {signedNumber(value)} {unit}
              </span>
            </div>
          );
        })}
        <div className="public-chart-axis" aria-hidden="true">
          <span>{formatNumber(min)}</span>
          <span>{formatNumber(min + extent / 2)}</span>
          <span>
            {formatNumber(max || 1)} {unit}
          </span>
        </div>
      </div>
    </div>
  );
}
