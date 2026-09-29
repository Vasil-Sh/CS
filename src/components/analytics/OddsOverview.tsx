import { useMemo } from "react";
import { Info } from "lucide-react";
import type { Bet } from "@/types/betting";
import "./OddsOverview.css";

const categories = [
  { name: "Низькі", label: "< 2.0", min: 1, max: 2 },
  { name: "Середні", label: "2.0 – < 3.0", min: 2, max: 3 },
  { name: "Високі", label: "≥ 3.0", min: 3, max: Infinity },
];
const intervals = [
  { label: "< 1.5", min: 1, max: 1.5 },
  { label: "1.5 – < 2.0", min: 1.5, max: 2 },
  { label: "2.0 – < 2.5", min: 2, max: 2.5 },
  { label: "2.5 – < 3.5", min: 2.5, max: 3.5 },
  { label: "≥ 3.5", min: 3.5, max: Infinity },
];

export function summarizeOdds(bets: Bet[]) {
  const settled = bets.filter(b => (b.result === "Win" || b.result === "Loss") && Number.isFinite(b.odds) && b.odds >= 1);
  return {
    count: settled.length,
    categories: categories.map(category => {
      const records = settled.filter(b => b.odds >= category.min && b.odds < category.max);
      const wins = records.filter(b => b.result === "Win").length;
      return { ...category, count: records.length, wins, losses: records.length - wins,
        winRate: records.length ? Math.round(wins / records.length * 100) : null,
        profit: records.reduce((sum, b) => sum + (Number.isFinite(b.profit) ? b.profit! : 0), 0) };
    }),
    distribution: intervals.map(interval => ({ ...interval, count: settled.filter(b => b.odds >= interval.min && b.odds < interval.max).length })),
  };
}

export default function OddsOverview({ bets, currency }: { bets: Bet[]; currency: "UAH" | "USD" }) {
  const data = useMemo(() => summarizeOdds(bets), [bets]);
  const maxCount = Math.max(0, ...data.distribution.map(item => item.count));
  const betCount = (count: number) => `${count} ${count % 100 >= 11 && count % 100 <= 14 ? "ставок" : count % 10 === 1 ? "ставка" : count % 10 >= 2 && count % 10 <= 4 ? "ставки" : "ставок"}`;
  const money = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toLocaleString("uk-UA", { maximumFractionDigits: 2 })} ${currency === "USD" ? "$" : "₴"}`;
  return <div className="odds-overview">
    <section className="odds-panel odds-rates" aria-labelledby="odds-rates-title">
      <h2 id="odds-rates-title">Вінрейт за коефіцієнтами</h2>
      <p className="odds-subtitle">Розраховані записи за діапазонами.</p>
      {data.categories.map(item => <div className="odds-rate-row" key={item.name}>
        <div className="odds-range"><h3>{item.label}</h3><span>{betCount(item.count)}</span></div>
        <progress className="odds-progress" max={100} value={item.winRate ?? 0} aria-label={`Вінрейт ${item.name.toLowerCase()}: ${item.winRate === null ? "немає даних" : `${item.winRate}%`}`} />
        <strong className="odds-rate-value">{item.winRate === null ? "—" : `${item.winRate}%`}</strong>
        <div className="odds-outcomes" aria-label={`${item.wins} перемог, ${item.losses} поразок`}><span className="odds-positive">{item.wins}W</span><span> / </span><span className="odds-negative">{item.losses}L</span></div>
      </div>)}
    </section>
    <section aria-labelledby="odds-categories-title">
      <h2 className="odds-section-title" id="odds-categories-title">Категорії коефіцієнтів</h2>
      <div className="odds-category-grid">{data.categories.map(item => <article className="odds-panel odds-category" key={item.name}>
        <h3>{item.name}</h3><p className="odds-category-range">{item.label}</p>
        <dl>
          <div><dt>Кількість ставок</dt><dd>{item.count}{item.count > 0 && item.count < 10 && <span className="odds-sample" title="Менше 10 розрахованих ставок — замало для надійного висновку">Мало даних</span>}</dd></div>
          <div><dt>Вінрейт</dt><dd>{item.winRate === null ? "—" : `${item.winRate}%`}</dd></div>
          <div><dt>Прибуток</dt><dd className={item.profit > 0 ? "odds-positive" : item.profit < 0 ? "odds-negative" : ""}>{item.count ? money(item.profit) : "—"}</dd></div>
        </dl>
      </article>)}</div>
    </section>
    <section className="odds-panel odds-distribution" aria-labelledby="odds-distribution-title">
      <h2 id="odds-distribution-title">Розподіл записів</h2>
      <p className="odds-subtitle">Кількість розрахованих записів за діапазонами коефіцієнтів.</p>
      <ul className="odds-histogram">{data.distribution.map(item => <li key={item.label}>
        <div className="odds-histogram-column"><strong>{item.count}</strong><span className={maxCount > 0 && item.count === maxCount ? "odds-histogram-bar is-largest" : "odds-histogram-bar"} style={{ height: `${maxCount ? item.count / maxCount * 26 : 0}px` }} /></div>
        <span className="odds-bin-label">{item.label}</span>
      </li>)}</ul>
    </section>
    <p className="odds-note"><Info size={15} aria-hidden="true" /><span>{data.count ? "Враховано лише розраховані ставки. Помаранчевим виділено найчисленніший діапазон. Вінрейт сам по собі не визначає прибутковість." : "Ще немає розрахованих ставок для цього фільтра. Показники з’являться після розрахунку записів."}</span></p>
  </div>;
}
