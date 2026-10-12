import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Check, ChevronDown, Info, Loader2 } from "lucide-react";
import { PlayerCard } from "@/components/public-profile/PlayerCard";
import { GameMark } from "@/components/public-profile/GameMark";
import { ProfitChart } from "@/components/public-profile/ProfitChart";
import { RecentBets } from "@/components/public-profile/RecentBets";
import {
  displayValue,
  formatNumber,
  gameOptions,
  periodOptions,
  readProfileFilters,
  signedNumber,
  type PublicProfileData,
} from "@/components/public-profile/publicProfileModel";
import "./PublicProfile.css";

export default function PublicProfile() {
  const { username = "" } = useParams<{ username: string }>();
  const [params, setParams] = useSearchParams();
  const filterParams = useRef(params);
  filterParams.current = params;
  const { game, period, currency } = readProfileFilters(params);
  const [response, setResponse] = useState<{
    key: string;
    data: PublicProfileData;
  } | null>(null);
  const [error, setError] = useState<{
    key: string;
    message: string;
    missing?: boolean;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(false);
  const requestKey = `${username}:${game}:${period}:${retry}`;
  const data = response?.key === requestKey ? response.data : null;
  const currentError = error?.key === requestKey ? error : null;
  const loading = !data && !currentError;

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(filterParams.current);
    if (value === "all" || (key === "currency" && value === "UAH"))
      next.delete(key);
    else next.set(key, value);
    filterParams.current = next;
    setParams(next, { replace: true });
    setCopied(false);
  }
  function resetFilters() {
    const next = new URLSearchParams(filterParams.current);
    next.delete("game");
    next.delete("period");
    filterParams.current = next;
    setParams(next, { replace: true });
  }
  useEffect(() => {
    const controller = new AbortController();
    const base = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
    fetch(
      `${base}/public-profile/${encodeURIComponent(username)}?game=${game}&period=${period}`,
      { signal: controller.signal },
    )
      .then(async (res) => {
        if (!res.ok)
          throw new Error(
            res.status === 404
              ? "not-found"
              : "Не вдалося завантажити статистику. Спробуйте ще раз.",
          );
        const result: PublicProfileData = await res.json();
        if (
          result.schemaVersion !== 2 ||
          result.filters?.game !== game ||
          result.filters?.period !== period
        ) {
          throw new Error(
            "Для нового екрана потрібно перезапустити сервер API з оновленим кодом.",
          );
        }
        if (!controller.signal.aborted)
          setResponse({ key: requestKey, data: result });
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          reason instanceof Error
            ? reason.message
            : "Не вдалося завантажити статистику.";
        setError({
          key: requestKey,
          message,
          missing: message === "not-found",
        });
      });
    return () => controller.abort();
  }, [username, game, period, requestKey]);
  useEffect(() => {
    const previous = document.title;
    document.title = `@${username} — публічна статистика | MatchIQ`;
    return () => {
      document.title = previous;
    };
  }, [username]);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);
  async function share() {
    setShareError(false);
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setShareError(true);
    }
  }

  const unit = currency === "USD" ? "$" : "₴";
  const profit = data
    ? displayValue(data.stats.displayProfit, currency, data.exchangeRate)
    : null;
  const activeGame = gameOptions.find((item) => item.value === game)!;
  const activePeriod = periodOptions.find((item) => item.value === period)!;
  const name = data?.username || username;
  return (
    <div className="public-profile">
      <a className="public-skip" href="#public-statistics">
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
      <main className="public-wrap public-layout">
        <aside className="public-identity-column">
          <PlayerCard
            username={name}
            game={game}
            copied={copied}
            onShare={share}
          />
          <div className="public-disclosure">
            <Info size={19} aria-hidden="true" />
            <p>
              Дані з журналу користувача.
              {data &&
              data.stats.completedBets > 0 &&
              data.stats.completedBets < 30 ? (
                <span>
                  Завершених ставок: {data.stats.completedBets}. Мала вибірка —
                  недостатня для надійних висновків.
                </span>
              ) : (
                <span>
                  Результати не є незалежно підтвердженою статистикою.
                </span>
              )}
            </p>
          </div>
          <div className="public-sr-only" role="status">
            {copied ? "Посилання на профіль скопійовано" : ""}
          </div>
          {shareError && (
            <div className="public-share-fallback" role="alert">
              <p>Скопіюйте посилання вручну:</p>
              <input
                aria-label="Посилання на профіль"
                readOnly
                value={window.location.href}
                onFocus={(event) => event.currentTarget.select()}
              />
            </div>
          )}
        </aside>
        <div className="public-content" id="public-statistics">
          <div className="public-title-row">
            <div>
              <p className="public-eyebrow">Публічний журнал</p>
              <h1>
                Статистика профілю <span>@{name}</span>
              </h1>
            </div>
          </div>
          <div className="public-toolbar">
            <div
              className="public-game-filter"
              role="group"
              aria-label="Гра для всієї статистики"
            >
              {gameOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={game === item.value}
                  onClick={() => updateFilter("game", item.value)}
                >
                  <GameMark game={item.value} />
                  {item.label}
                  <span className="public-filter-check">
                    {game === item.value && <Check size={12} />}
                  </span>
                </button>
              ))}
            </div>
            <div className="public-toolbar-options">
              <label className="public-period">
                <span className="public-sr-only">Період статистики</span>
                <select
                  value={period}
                  onChange={(event) =>
                    updateFilter("period", event.target.value)
                  }
                >
                  {periodOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </label>
              <div
                className="public-currency"
                role="group"
                aria-label="Валюта статистики"
              >
                {(["UAH", "USD"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={currency === value}
                    onClick={() => updateFilter("currency", value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="public-data-region" aria-busy={loading}>
            {loading ? (
              <div className="public-loading" role="status">
                <Loader2 className="public-spinner" size={25} />
                <span>Завантажуємо статистику…</span>
                <div className="public-skeleton" />
                <div className="public-skeleton" />
              </div>
            ) : currentError ? (
              <section className="public-panel public-state" role="alert">
                <h2>
                  {currentError.missing
                    ? "Профіль не знайдено"
                    : "Статистика недоступна"}
                </h2>
                <p>
                  {currentError.missing
                    ? "Перевірте ім’я користувача в посиланні."
                    : currentError.message}
                </p>
                <button
                  type="button"
                  className="public-button"
                  onClick={() => setRetry((value) => value + 1)}
                >
                  Спробувати ще раз
                </button>
              </section>
            ) : (
              data && (
                <div key={`${game}-${period}`} className="public-data-enter">
                  <section
                    className="public-panel public-kpis"
                    aria-label="Ключові показники"
                  >
                    <div className="public-main-profit">
                      <span>Загальний прибуток</span>
                      <strong
                        className={
                          profit !== null && profit > 0
                            ? "public-positive"
                            : profit !== null && profit < 0
                              ? "public-negative"
                              : ""
                        }
                      >
                        {signedNumber(profit)}
                        {profit !== null && <small> {unit}</small>}
                      </strong>
                      <p>
                        {signedNumber(data.stats.profitUAH)} ₴ <span> / </span>{" "}
                        {signedNumber(data.stats.profitUSD)} $
                      </p>
                    </div>
                    <dl>
                      <div>
                        <dt>ROI</dt>
                        <dd
                          title={
                            data.stats.roi === null
                              ? undefined
                              : `${signedNumber(data.stats.roi)}%`
                          }
                        >
                          {signedNumber(
                            data.stats.roi === null
                              ? null
                              : Math.round(data.stats.roi),
                          )}
                          {data.stats.roi !== null && "%"}
                        </dd>
                        <span>Прибуток / сума ставок</span>
                      </div>
                      <div>
                        <dt>Виграшів</dt>
                        <dd>
                          {formatNumber(data.stats.winRate, 0)}
                          {data.stats.winRate !== null && "%"}
                        </dd>
                        <span>
                          {data.stats.wins} із{" "}
                          {data.stats.wins + data.stats.losses}
                        </span>
                      </div>
                      <div>
                        <dt>Завершені ставки</dt>
                        <dd>{formatNumber(data.stats.completedBets)}</dd>
                        <span>
                          {data.stats.pendingBets
                            ? `${data.stats.pendingBets} очікують результату`
                            : activePeriod.label}
                        </span>
                      </div>
                    </dl>
                  </section>
                  <div className="public-scope-note">
                    <span>
                      {activeGame.cardLabel} · {activePeriod.label}
                    </span>
                    <span>
                      {data.exchangeRate
                        ? `Курс ${formatNumber(data.exchangeRate, 2)} ₴/$ · ${data.exchangeRateSource === "profile" ? "із налаштувань профілю" : "з останньої ставки"}`
                        : "Курс для конвертації не задано"}
                    </span>
                  </div>
                  {(!data.stats.conversionComplete ||
                    (currency === "USD" && !data.exchangeRate)) && (
                    <p className="public-conversion-warning" role="status">
                      Загальний прибуток не показано: бракує даних для
                      конвертації. Суми в рядках журналу залишаються в
                      оригінальних валютах.
                    </p>
                  )}
                  <div className="public-results-grid">
                    <section
                      className="public-panel public-chart-panel"
                      aria-labelledby="public-chart-title"
                    >
                      <div className="public-section-heading">
                        <h2 id="public-chart-title">Результати за місяцями</h2>
                        <span>{unit}</span>
                      </div>
                      <ProfitChart
                        data={data.monthlyProfit}
                        currency={currency}
                        rate={data.exchangeRate}
                      />
                    </section>
                    <section
                      className="public-panel public-summary"
                      aria-labelledby="public-summary-title"
                    >
                      <div className="public-section-heading">
                        <h2 id="public-summary-title">Підсумки</h2>
                      </div>
                      <dl>
                        <div>
                          <dt>Виграші</dt>
                          <dd>{data.stats.wins}</dd>
                        </div>
                        <div>
                          <dt>Програші</dt>
                          <dd>{data.stats.losses}</dd>
                        </div>
                        <div>
                          <dt>Середній коефіцієнт</dt>
                          <dd>{formatNumber(data.stats.avgOdds, 2)}</dd>
                        </div>
                        {data.stats.refunds > 0 && (
                          <div>
                            <dt>Повернення / скасування</dt>
                            <dd>{data.stats.refunds}</dd>
                          </div>
                        )}
                      </dl>
                      <p>Відсоток виграшів — без повернень.</p>
                    </section>
                  </div>
                  <RecentBets
                    bets={data.recentBets}
                    total={data.stats.totalBets}
                    filtered={game !== "all" || period !== "all"}
                    onReset={resetFilters}
                  />
                </div>
              )
            )}
          </div>
        </div>
      </main>
      <footer className="public-wrap public-footer">
        <Link to="/" className="public-logo">
          Match<span>IQ</span>
        </Link>
        <p>
          Дані з журналу користувача. Минулі результати не гарантують майбутніх.
        </p>
        <span>Публічний журнал</span>
      </footer>
    </div>
  );
}
