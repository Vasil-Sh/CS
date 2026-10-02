import { useMemo, useState } from "react";
import { Calendar, ChevronDown, ArrowRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Bet } from "@/types/betting";
import { initialPeriods, isValidRange, periodRecords, periodStats, periodTrend, rangeDays, gameName, type DateRange } from "./analytics/periodMetrics";
import "./PeriodComparison.css";

const number = (value: number, decimals = 1) => value.toLocaleString("uk-UA", { maximumFractionDigits: decimals });
const signed = (value: number, decimals = 1) => `${value > 0 ? "+" : ""}${number(value, decimals)}`;
const tone = (value: number | null) => value === null || Math.abs(value) < 0.00001 ? "" : value > 0 ? "period-positive" : "period-negative";
const rangeLabel = (range: DateRange, year = true) => {
  const format = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("uk-UA", { day: "2-digit", month: "short", ...(year ? { year: "numeric" as const } : {}) }).replace(" р.", "");
  if (range.start.slice(0, 7) === range.end.slice(0, 7)) return `${range.start.slice(8)}–${format(range.end)}`;
  return `${format(range.start)} – ${format(range.end)}`;
};

export default function PeriodComparison({ bets, currency = "UAH" }: { bets: Bet[]; currency?: "UAH" | "USD" }) {
  const [ranges, setRanges] = useState<[DateRange, DateRange]>(() => initialPeriods());
  const [draft, setDraft] = useState<[DateRange, DateRange]>(ranges);
  const [editing, setEditing] = useState(false);
  const [recordsGame, setRecordsGame] = useState<string | null>(null);
  const symbol = currency === "USD" ? "$" : "₴";
  const money = (value: number) => `${signed(value, 2)} ${symbol}`;
  const records = useMemo(() => ranges.map(range => periodRecords(bets, range)), [bets, ranges]);
  const stats = useMemo(() => records.map(periodStats), [records]);
  const trend = useMemo(() => periodTrend(bets, ranges), [bets, ranges]);
  const labels = ranges.map(range => rangeLabel(range));
  const shortLabels = ranges.map(range => rangeLabel(range, ranges[0].start.slice(0, 4) !== ranges[1].start.slice(0, 4)));
  const monthLabels = ranges.map((range, index) => {
    if (range.start.slice(0, 7) !== range.end.slice(0, 7) || ranges[0].start.slice(0, 7) === ranges[1].start.slice(0, 7)) return shortLabels[index];
    const name = new Date(`${range.start}T12:00:00`).toLocaleDateString("uk-UA", { month: "long", ...(ranges[0].start.slice(0, 4) !== ranges[1].start.slice(0, 4) ? { year: "numeric" as const } : {}) });
    return name.charAt(0).toUpperCase() + name.slice(1);
  });
  const chartDate = (day: number) => {
    const date = new Date(`${ranges[0].start}T12:00:00`);
    date.setDate(date.getDate() + day - 1);
    return date.toLocaleDateString("uk-UA", { day: "2-digit", month: "short" });
  };
  const outcomeCount = (count: number, word: "виграш" | "програш") => `${count} ${word}${count % 100 >= 11 && count % 100 <= 14 ? "ів" : count % 10 === 1 ? "" : count % 10 >= 2 && count % 10 <= 4 ? "і" : "ів"}`;
  const games = [...new Set(records.flat().map(b => gameName(b.game)))];
  const allGames = [...new Set(["CS2", "Dota 2", ...games])];
  const openEditor = () => { setDraft(ranges.map(range => ({ ...range })) as [DateRange, DateRange]); setEditing(true); };
  const valid = draft.every(isValidRange);
  const rows = [
    { label: "Розраховано", a: stats[0].count, b: stats[1].count, format: (v: number) => number(v, 0), delta: (v: number) => signed(v, 0), colored: false },
    { label: "Чистий результат", a: stats[0].profit, b: stats[1].profit, format: money, delta: money, colored: true },
    { label: "ROI", a: stats[0].roi, b: stats[1].roi, format: (v: number) => `${signed(v)}%`, delta: (v: number) => `${signed(v)} в.п.`, colored: true },
    { label: "Вінрейт", a: stats[0].winRate, b: stats[1].winRate, format: (v: number) => `${number(v)}%`, delta: (v: number) => `${signed(v)} в.п.`, colored: true },
    { label: "Середній коеф.", a: stats[0].avgOdds, b: stats[1].avgOdds, format: (v: number) => number(v, 2), delta: (v: number) => signed(v, 2), colored: false },
  ];
  return <div className="period-comparison">
    <section className="period-controls" aria-labelledby="period-title">
      <h2 id="period-title">Порівняння періодів</h2>
      <div className="period-selector-row">
        <button className="period-date-button" onClick={openEditor} aria-label={`Перший період: ${labels[0]}`}><Calendar size={16} />{labels[0]}<ChevronDown size={15} /></button>
        <span>порівняти з</span>
        <button className="period-date-button" onClick={openEditor} aria-label={`Другий період: ${labels[1]}`}><Calendar size={16} />{labels[1]}<ChevronDown size={15} /></button>
        <button className="period-outline" onClick={openEditor}>Змінити періоди</button>
      </div>
      {rangeDays(ranges[0]) !== rangeDays(ranges[1]) && <p className="period-note">Періоди мають різну тривалість: {rangeDays(ranges[0])} та {rangeDays(ranges[1])} днів. Графік вирівняно за днями від початку.</p>}
    </section>
    <section className="period-panel"><h3 className="period-game-heading">Показники двох періодів</h3><div className="period-table-scroll"><table className="period-table period-metrics"><caption className="sr-only">Показники двох періодів; зміна — перший мінус другий</caption><thead><tr><th scope="col">Показник</th><th scope="col">{shortLabels[0]}</th><th scope="col">{shortLabels[1]}</th><th scope="col">Зміна</th></tr></thead><tbody>
      {rows.map(row => { const delta = row.a === null || row.b === null ? null : row.a - row.b; return <tr key={row.label}><th scope="row">{row.label}</th><td>{row.a === null ? "—" : row.format(row.a)}</td><td>{row.b === null ? "—" : row.format(row.b)}</td><td className={row.colored ? tone(delta) : ""}>{delta === null ? "—" : row.delta(delta)}</td></tr>; })}
    </tbody></table></div></section>
    <div className="period-charts">
      <section className="period-panel period-trend"><div className="period-chart-heading"><h3>Динаміка прибутку</h3><div className="period-legend"><span><i />{monthLabels[0]}</span><span><i />{monthLabels[1]}</span></div></div>
        {stats.some(s => s.count > 0) ? <ResponsiveContainer width="100%" height={184}><LineChart data={trend} margin={{ top: 12, right: 14, left: 4, bottom: 4 }}>
          <CartesianGrid stroke="#e5e6e2" /><XAxis dataKey="day" type="number" domain={[1, Math.max(2, trend.length)]} tickCount={5} allowDecimals={false} tickLine={false} axisLine={{ stroke: "#dadcd6" }} tickFormatter={chartDate} />
          <YAxis width={65} tickLine={false} axisLine={false} tickFormatter={v => `${number(v, 0)} ${symbol}`} />
          <ReferenceLine y={0} stroke="#c9cdc6" />
          <Tooltip labelFormatter={day => `День ${day} від початку`} formatter={(value: number, name: string) => [money(value), name === "first" ? labels[0] : labels[1]]} contentStyle={{ fontSize: 12, borderRadius: 4, borderColor: "#d9dcd4" }} />
          <Line type="linear" dataKey="first" stroke="#ff693b" strokeWidth={2.2} dot={trend.length === 1} isAnimationActive={false} connectNulls={false} />
          <Line type="linear" dataKey="second" stroke="#4278f5" strokeWidth={2.2} dot={trend.length === 1} isAnimationActive={false} connectNulls={false} />
        </LineChart></ResponsiveContainer> : <div className="period-empty">Немає розрахованих записів за вибрані дати.</div>}
      </section>
      <section className="period-panel period-results"><h3>Розподіл результатів</h3>{stats.map((stat, index) => <div className="period-result" key={index}>
        <div className="period-result-label"><strong>{monthLabels[index]}</strong><span>{outcomeCount(stat.wins, "виграш")} / {outcomeCount(stat.losses, "програш")}</span></div>
        <div className="period-result-bar" aria-label={`${labels[index]}: ${stat.wins} виграшів, ${stat.losses} програшів`}>
          {stat.count ? <><span style={{ width: `${stat.wins / stat.count * 100}%` }}>{stat.wins > 0 && stat.wins}</span><span style={{ width: `${stat.losses / stat.count * 100}%` }}>{stat.losses > 0 && stat.losses}</span></> : <small>Немає записів</small>}
        </div>
      </div>)}<p className="period-note">Порівнюються лише розраховані записи.</p></section>
    </div>
    <section className="period-panel"><h3 className="period-game-heading">Порівняння за грою</h3><div className="period-table-scroll"><table className="period-table period-games"><thead><tr><th scope="col">Гра</th><th scope="col">{shortLabels[0]}</th><th scope="col">{shortLabels[1]}</th><th scope="col">Зміна</th><th scope="col">Записи</th></tr></thead><tbody>
      {allGames.map(game => { const a = periodStats(records[0].filter(b => gameName(b.game) === game)); const b = periodStats(records[1].filter(b => gameName(b.game) === game)); return <tr key={game}><th scope="row"><span className="period-game-name">{(game === "CS2" || game === "Dota 2") && <img src={game === "CS2" ? "/assets/game-cs2.svg" : "/assets/game-dota2.svg"} alt="" width={23} height={23} />}{game}</span></th><td className={tone(a.profit)}>{money(a.profit)}</td><td className={tone(b.profit)}>{money(b.profit)}</td><td className={tone(a.profit - b.profit)}>{money(a.profit - b.profit)}</td><td><button className="period-link" disabled={!a.count && !b.count} onClick={() => setRecordsGame(game)}>Відкрити записи <ArrowRight size={14} /></button></td></tr>; })}
    </tbody></table></div></section>
    <p className="period-note">Зміна = період 1 − період 2. ROI = чистий результат / сума ставок. Зміна ROI та вінрейту — у відсоткових пунктах.</p>
    <Dialog open={editing} onOpenChange={setEditing}><DialogContent className="period-dialog"><DialogHeader className="period-dialog-header"><DialogTitle>Змінити періоди</DialogTitle><DialogDescription>Виберіть два проміжки до 366 днів кожен. Початкова й кінцева дати включені.</DialogDescription></DialogHeader><form onSubmit={event => { event.preventDefault(); if (valid) { setRanges(draft); setEditing(false); } }}>
      {draft.map((range, index) => <fieldset key={index}><legend>Період {index + 1}</legend><div className="period-date-fields">{(["start", "end"] as const).map(key => <label key={key}>{key === "start" ? "Початок" : "Кінець"}<input type="date" required value={range[key]} onChange={event => setDraft(current => current.map((r, i) => i === index ? { ...r, [key]: event.target.value } : r) as [DateRange, DateRange])} /></label>)}</div></fieldset>)}
      {!valid && <p role="alert" className="period-negative">Перевірте дати: кінець не може бути раніше початку, максимум — 366 днів.</p>}
      <div className="period-dialog-actions"><button type="button" className="period-outline" onClick={() => setEditing(false)}>Скасувати</button><button className="period-apply" disabled={!valid}>Застосувати</button></div>
    </form></DialogContent></Dialog>
    <Dialog open={recordsGame !== null} onOpenChange={open => { if (!open) setRecordsGame(null); }}><DialogContent className="period-dialog period-records-dialog"><DialogHeader className="period-dialog-header"><DialogTitle>{recordsGame}: розраховані записи</DialogTitle><DialogDescription>Ставки за вибрані періоди. Запис у перетині дат відображається в обох періодах.</DialogDescription></DialogHeader><div className="period-records-list">{records.map((items, index) => <section key={index}><h3>Період {index + 1} · {labels[index]}</h3>{items.filter(b => gameName(b.game) === recordsGame).length ? items.filter(b => gameName(b.game) === recordsGame).map((b, i) => <div className="period-record" key={b.id ?? i}><span><strong>{b.match}</strong><small>{b.date.slice(0, 10)} · {b.result === "Win" ? "Виграш" : "Програш"} · коеф. {b.odds}</small></span><strong className={tone(b.profit ?? 0)}>{money(b.profit ?? 0)}</strong></div>) : <p className="period-note">Немає записів.</p>}</section>)}</div></DialogContent></Dialog>
  </div>;
}
