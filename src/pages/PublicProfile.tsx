/* Scrollable chart/table regions must be keyboard focusable. */
/* eslint jsx-a11y/no-noninteractive-tabindex: ["error", { "roles": ["region"] }] */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowUpRight, Check, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import "./PublicProfile.css";

interface PublicStats {
  username: string;
  stats: {
    totalBets: number;
    wins: number;
    losses: number;
    winRate: number;
    totalProfit: number;
    totalStaked: number;
    roi: number;
    avgOdds: number;
    currentBank: number;
    activeGoals: number;
  };
  recentBets: {
    match: string;
    result: string;
    profit: number;
    odds: number;
    date: string;
    game: string;
  }[];
  monthlyProfit: { month: string; profit: number }[];
}
const number = (value: number, decimals = 0) =>
  Number(value || 0).toLocaleString("uk-UA", {
    maximumFractionDigits: decimals,
  });
const signed = (value: number) => `${value > 0 ? "+" : ""}${number(value, 2)}`;
const months = [
  "Січ",
  "Лют",
  "Бер",
  "Кві",
  "Тра",
  "Чер",
  "Лип",
  "Сер",
  "Вер",
  "Жов",
  "Лис",
  "Гру",
];
const monthLabel = (value: string) => {
  const [year, month] = value.split("-");
  return `${months[Number(month) - 1] || month} ’${year.slice(-2)}`;
};
const gameLabel = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");
const resultLabel = (result: string) =>
  ({
    Win: "Виграш",
    Loss: "Програш",
    Pending: "Очікується",
    Refund: "Повернення",
    Void: "Скасовано",
    Push: "Повернення",
  })[result] ||
  result ||
  "Очікується";

function ProfitChart({ data }: { data: PublicStats["monthlyProfit"] }) {
  if (!data.length)
    return (
      <div className="public-empty">
        <strong>Ще немає результатів</strong>
        <p>Графік з’явиться після розрахованих ставок.</p>
      </div>
    );
  const sorted = [...data].sort((a, b) => a.month.localeCompare(b.month));
  const high = Math.max(0, ...sorted.map((item) => item.profit));
  const low = Math.min(0, ...sorted.map((item) => item.profit));
  const span = high - low || 1;
  const y = (value: number) => 36 + ((high - value) / span) * 180;
  const zero = y(0);
  const width = Math.max(620, sorted.length * 96 + 80);
  const slot = (width - 88) / sorted.length;
  return (
    <div
      className="public-chart-scroll"
      tabIndex={0}
      role="region"
      aria-label="Графік прибутку за місяцями, можна прокручувати"
    >
      <svg
        className="public-chart"
        viewBox={`0 0 ${width} 270`}
        style={{ minWidth: width }}
        role="img"
        aria-labelledby="public-chart-title public-chart-description"
      >
        <title id="public-chart-title">Прибуток за місяцями, гривні</title>
        <desc id="public-chart-description">
          {sorted
            .map(
              (item) =>
                `${monthLabel(item.month)}: ${signed(item.profit)} гривень`,
            )
            .join("; ")}
        </desc>
        {[high, ...(high > 0 && low < 0 ? [0] : []), low]
          .filter((value, index, list) => list.indexOf(value) === index)
          .map((tick) => (
            <g key={tick}>
              <line
                x1="72"
                x2={width - 12}
                y1={y(tick)}
                y2={y(tick)}
                className={tick === 0 ? "public-baseline" : "public-gridline"}
              />
              <text
                x="60"
                y={y(tick) + 4}
                textAnchor="end"
                className="public-axis"
              >
                {number(tick)}
              </text>
            </g>
          ))}
        {sorted.map((item, index) => {
          const center = 80 + slot * (index + 0.5);
          const top = Math.min(y(item.profit), zero);
          return (
            <g key={item.month}>
              <rect
                x={center - Math.min(slot * 0.3, 35)}
                y={top}
                width={Math.min(slot * 0.6, 70)}
                height={Math.max(Math.abs(y(item.profit) - zero), 1)}
                className={`public-bar${item.profit < 0 ? " is-negative" : index === sorted.length - 1 ? " is-latest" : ""}`}
              >
                <title>
                  {monthLabel(item.month)}: {signed(item.profit)} ₴
                </title>
              </rect>
              <text
                x={center}
                y={item.profit >= 0 ? top - 10 : y(item.profit) + 17}
                textAnchor="middle"
                className="public-bar-value"
              >
                {signed(item.profit)}
              </text>
              <text
                x={center}
                y="258"
                textAnchor="middle"
                className="public-axis"
              >
                {monthLabel(item.month)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [copied, setCopied] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    setFilter("all");
    const base = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
    fetch(
      `${base.replace(/\/$/, "")}/public-profile/${encodeURIComponent(username || "")}`,
      { signal: controller.signal },
    )
      .then((res) => {
        if (!res.ok)
          throw new Error(
            res.status === 404
              ? "Користувача не знайдено"
              : "Не вдалося завантажити статистику",
          );
        return res.json();
      })
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((err) => {
        if (!controller.signal.aborted)
          setError(err instanceof Error ? err.message : "Помилка завантаження");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [username, retry]);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Посилання скопійовано");
    } catch {
      toast.error(
        "Не вдалося скопіювати. Скопіюйте посилання з адресного рядка.",
      );
    }
  };
  const bets =
    data?.recentBets.filter(
      (bet) => filter === "all" || gameLabel(bet.game) === filter,
    ) || [];
  return (
    <div className="public-profile">
      <a className="public-skip" href="#public-main">
        Перейти до статистики
      </a>
      <header className="public-header">
        <nav className="public-wrap public-nav" aria-label="Публічна навігація">
          <Link
            to="/"
            className="public-logo"
            aria-label="MatchIQ — на головну"
          >
            Match<span>IQ</span>
          </Link>
          <span className="public-nav-label">Публічний профіль</span>
          <Link to="/login" className="public-login">
            Увійти <ArrowUpRight size={17} />
          </Link>
        </nav>
      </header>
      <main id="public-main">
        {loading ? (
          <div className="public-state" role="status">
            <Loader2 className="public-spinner" size={28} />
            <h1>Завантажуємо профіль</h1>
            <p>Отримуємо актуальну статистику…</p>
          </div>
        ) : error || !data ? (
          <div className="public-state" role="alert">
            <span className="public-eyebrow">MatchIQ</span>
            <h1>
              {error === "Користувача не знайдено"
                ? "Профіль не знайдено"
                : "Статистика недоступна"}
            </h1>
            <p>{error || "Не вдалося отримати дані профілю"}</p>
            <div className="public-state-actions">
              <button
                className="public-button"
                onClick={() => setRetry((value) => value + 1)}
              >
                Спробувати ще раз
              </button>
              <Link to="/">На головну ↗</Link>
            </div>
          </div>
        ) : (
          <>
            <section className="public-hero" aria-labelledby="public-name">
              <div className="public-wrap public-identity">
                <div className="public-avatar" aria-hidden="true">
                  {data.username.slice(0, 1).toUpperCase()}
                </div>
                <div className="public-identity-copy">
                  <p className="public-eyebrow">Статистика гравця</p>
                  <h1 id="public-name">@{data.username}</h1>
                  <p className="public-subtitle">Публічний журнал ставок</p>
                </div>
                <button
                  type="button"
                  className="public-button public-share"
                  onClick={share}
                >
                  {copied ? <Check size={18} /> : <Share2 size={18} />}
                  <span aria-live="polite">
                    {copied ? "Скопійовано" : "Поділитися"}
                  </span>
                </button>
              </div>
              <div className="public-kpi-border">
                <dl className="public-wrap public-kpis">
                  <div>
                    <dt>Ставок</dt>
                    <dd>{number(data.stats.totalBets)}</dd>
                  </div>
                  <div>
                    <dt>Вінрейт</dt>
                    <dd>
                      {number(data.stats.winRate, 1)}
                      <small>%</small>
                    </dd>
                  </div>
                  <div className="public-roi">
                    <dt>ROI</dt>
                    <dd>
                      {signed(data.stats.roi)}
                      <small>%</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Прибуток</dt>
                    <dd>
                      {signed(data.stats.totalProfit)} <small>₴</small>
                    </dd>
                  </div>
                </dl>
              </div>
            </section>
            <div className="public-wrap public-body">
              <section
                aria-labelledby="public-results-title"
                className="public-results"
              >
                <div className="public-section-heading">
                  <h2 id="public-results-title">Результати за місяцями</h2>
                  <span>
                    {data.monthlyProfit.length
                      ? `${monthLabel([...data.monthlyProfit].sort((a, b) => a.month.localeCompare(b.month))[0].month)} — ${monthLabel([...data.monthlyProfit].sort((a, b) => a.month.localeCompare(b.month)).at(-1)!.month)}`
                      : "Поки немає даних"}
                  </span>
                </div>
                <div className="public-results-grid">
                  <ProfitChart data={data.monthlyProfit} />
                  <aside className="public-numbers">
                    <h3>
                      У цифрах <span>За весь час</span>
                    </h3>
                    <dl>
                      <div>
                        <dt>Виграші</dt>
                        <dd>{number(data.stats.wins)}</dd>
                      </div>
                      <div>
                        <dt>Програші</dt>
                        <dd>{number(data.stats.losses)}</dd>
                      </div>
                      <div>
                        <dt>Середній коефіцієнт</dt>
                        <dd>{number(data.stats.avgOdds, 2)}</dd>
                      </div>
                    </dl>
                  </aside>
                </div>
              </section>
              <section
                className="public-recent"
                aria-labelledby="public-recent-title"
              >
                <div className="public-section-heading public-table-heading">
                  <h2 id="public-recent-title">Останні ставки</h2>
                  <div
                    className="public-filters"
                    role="group"
                    aria-label="Фільтр останніх ставок за грою"
                  >
                    {[
                      { value: "all", label: "Усі" },
                      { value: "cs2", label: "CS2" },
                      { value: "dota2", label: "Dota 2" },
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.value}
                        aria-pressed={filter === item.value}
                        onClick={() => setFilter(item.value)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <span className="public-count" aria-live="polite">
                    {bets.length} з {data.recentBets.length}
                  </span>
                </div>
                {bets.length ? (
                  <div
                    className="public-table-scroll"
                    tabIndex={0}
                    role="region"
                    aria-label="Останні ставки, таблицю можна прокручувати"
                  >
                    <table>
                      <caption className="public-sr-only">
                        Останні доступні ставки користувача {data.username}
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Дата</th>
                          <th scope="col">Матч</th>
                          <th scope="col">Коеф.</th>
                          <th scope="col">Результат</th>
                          <th scope="col">Прибуток</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bets.map((bet, index) => (
                          <tr key={`${bet.date}-${bet.match}-${index}`}>
                            <td className="public-date">{bet.date || "—"}</td>
                            <td className="public-match">
                              {bet.match}
                              <small>{bet.game}</small>
                            </td>
                            <td>{number(bet.odds, 2)}</td>
                            <td>
                              <span
                                className={`public-result ${bet.result === "Win" ? "is-win" : bet.result === "Loss" ? "is-loss" : "is-pending"}`}
                              >
                                <i />
                                {resultLabel(bet.result)}
                              </span>
                            </td>
                            <td>
                              {[
                                "Win",
                                "Loss",
                                "Refund",
                                "Void",
                                "Push",
                              ].includes(bet.result)
                                ? `${signed(bet.profit)} ₴`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="public-empty">
                    <strong>
                      {filter === "all"
                        ? "Ставок ще немає"
                        : "У цьому списку немає ставок з цієї гри"}
                    </strong>
                    <p>
                      {filter === "all"
                        ? "Тут з’являться останні записи публічного журналу."
                        : "Оберіть іншу гру або поверніться до всіх ставок."}
                    </p>
                    {filter !== "all" && (
                      <button
                        className="public-button"
                        onClick={() => setFilter("all")}
                      >
                        Показати всі
                      </button>
                    )}
                  </div>
                )}
                <p className="public-table-note">
                  Показано останні доступні записи, а не всю історію ставок.
                </p>
              </section>
            </div>
          </>
        )}
      </main>
      <footer className="public-footer">
        <div className="public-wrap">
          <Link to="/" className="public-logo">
            Match<span>IQ</span>
          </Link>
          <p>Статистика журналу · Не гарантує майбутніх результатів</p>
          <span>Ваші дані. Зрозумілі рішення.</span>
        </div>
      </footer>
    </div>
  );
}
