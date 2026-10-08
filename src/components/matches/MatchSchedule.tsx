import { Fragment, useId, useMemo, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  Check,
  ChevronDown,
  CirclePlus,
  ExternalLink,
  Eye,
  Info,
  Layers,
  Lightbulb,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  X,
} from "lucide-react";
import type { Match, useMatches } from "@/hooks/useMatches";
import { proxyLogoUrl } from "@/lib/logoProxy";
import {
  coefficient,
  dateLabel,
  matchCount,
  filterSchedule,
  formLabel,
  groupSchedule,
  matchSource,
  nextScheduleDate,
  riskTone,
  scheduleDate,
  scheduleTime,
  sourceForecast,
  type ScheduleFilters,
} from "./matchScheduleModel";
import "./MatchSchedule.css";
import "./MatchScheduleDense.css";

type Controller = ReturnType<typeof useMatches>;
export interface MatchScheduleProps {
  model: Pick<
    Controller,
    | "matches"
    | "matchRatings"
    | "initialLoading"
    | "isLoading"
    | "apiError"
    | "getTeamRiskInfo"
    | "handleRateMatch"
    | "handleAddToBets"
    | "handleAiRecommend"
    | "selectedMatchIds"
    | "toggleMatchSelection"
    | "clearSelectedMatches"
    | "handleCreateExpress"
    | "refreshMatches"
  >;
  onAnalysis: (match: Match) => void;
  onEditNote: (match: Match, team: string) => void;
  onResults: () => void;
  now?: Date;
}

function TeamLogo({
  name,
  src,
  game,
}: {
  name: string;
  src?: string | null;
  game: Match["game"];
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = proxyLogoUrl(src ?? null, game);
  const placeholder =
    game === "Dota2"
      ? "/assets/team-placeholder-dota.svg"
      : "/assets/team-placeholder-cs2.svg";
  return url && url !== failedUrl ? (
    <img
      className="ms-logo"
      src={url}
      alt=""
      loading="lazy"
      onError={() => setFailedUrl(url)}
    />
  ) : (
    <img className="ms-logo" src={placeholder} alt="" aria-hidden="true" />
  );
}

function RiskBadge({ status }: { status: string }) {
  return (
    <span className={`ms-risk ms-risk--${riskTone(status)}`}>
      {status || "Неоцінена"}
    </span>
  );
}

function CompactOdds({ match }: { match: Match }) {
  const teams = [
    {
      name: match.team1,
      logo: match.logoTeam1,
      value: coefficient(match.bettingCoefficientTeam1),
    },
    {
      name: match.team2,
      logo: match.logoTeam2,
      value: coefficient(match.bettingCoefficientTeam2),
    },
  ];

  const bothAvailable = teams.every((team) => team.value !== "—");
  const lowest = bothAvailable
    ? Math.min(...teams.map((team) => Number(team.value)))
    : null;

  // Однакові показані значення не виділяємо.
  const canHighlight = bothAvailable && teams[0].value !== teams[1].value;

  if (teams.every((team) => team.value === "—")) {
    return (
      <div
        className="ms-odds ms-odds--compact ms-odds--empty"
        role="group"
        aria-label="Коефіцієнти недоступні"
        title="Джерело ще не надало коефіцієнти"
      >
        <Info size={15} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      className="ms-odds ms-odds--compact"
      role="group"
      aria-label="Коефіцієнти"
    >
      {teams.map((team, index) => {
        const isLower = canHighlight && Number(team.value) === lowest;

        const description = `${team.name}: ${
          team.value === "—" ? "немає даних" : team.value
        }${isLower ? " · менший коефіцієнт у парі" : ""}`;

        return (
          <span key={index} className="ms-odd-line" title={description}>
            <TeamLogo name={team.name} src={team.logo} game={match.game} />

            <span className="ms-odds-sr">{description}</span>

            <strong
              aria-hidden="true"
              className={[
                "ms-odd-value",
                isLower ? "ms-odd-value--lower" : "",
                team.value === "—" ? "ms-odd-value--missing" : "",
              ].join(" ")}
            >
              {team.value}
            </strong>
          </span>
        );
      })}
    </div>
  );
}

const percentLabel = (value: number) =>
  `${new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(value)}%`;

function SourceForecast({ match }: { match: Match }) {
  const forecast = sourceForecast(match);
  return (
    <div
      className="ms-forecast"
      role="group"
      aria-label={`Прогноз джерела: ${match.team1} — ${match.team2}`}
    >
      <span className="ms-cell-caption" aria-hidden="true">
        Прогноз джерела
      </span>
      {forecast ? (
        <>
          <span className="ms-odds-sr">
            {match.team1}: {percentLabel(forecast.first)}; {match.team2}:{" "}
            {percentLabel(forecast.second)}.
          </span>
          <div className="ms-forecast-values" aria-hidden="true">
            <span
              className={forecast.first > forecast.second ? "is-higher" : ""}
            >
              {percentLabel(forecast.first)}
            </span>
            <span
              className={forecast.second > forecast.first ? "is-higher" : ""}
            >
              {percentLabel(forecast.second)}
            </span>
          </div>
          <div className="ms-forecast-track" aria-hidden="true">
            <span style={{ width: `${forecast.firstWidth}%` }} />
          </div>
        </>
      ) : (
        <span className="ms-forecast-empty">Немає даних</span>
      )}
    </div>
  );
}

export default function MatchSchedule({
  model: m,
  onAnalysis,
  onEditNote,
  onResults,
  now = new Date(),
}: MatchScheduleProps) {
  const today = scheduleDate(now);
  const tomorrow = nextScheduleDate(today);
  const initialFilters = (): ScheduleFilters => ({
    date: today,
    game: "all",
    query: "",
    status: "all",
    format: "all",
    tournament: "all",
    personal: "all",
    sort: "time",
  });
  const [filters, setFilters] = useState<ScheduleFilters>(initialFilters);
  const [mode, setMode] = useState<"time" | "tournament">("time");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [expressMode, setExpressMode] = useState(false);
  const regionId = useId();

  const { matches, getTeamRiskInfo } = m;
  const risks = useMemo(
    () =>
      new Map(
        matches.map((match) => [
          match.id,
          [
            getTeamRiskInfo(match.team1, match.game),
            getTeamRiskInfo(match.team2, match.game),
          ] as const,
        ]),
      ),
    [matches, getTeamRiskInfo],
  );
  const hasNotes = (match: Match) => !!risks.get(match.id)?.some(Boolean);
  const visible = filterSchedule(m.matches, filters, m.matchRatings, hasNotes);
  const sortedVisible = [...visible].sort((a, b) => {
    const rank = (match: Match) => {
      const rating = m.matchRatings[match.id];
      if (rating === "like") return 0;
      if (match.matchStatus === "finished") return 3;
      if (rating === "dislike") return 2;
      return 1;
    };
    return rank(a) - rank(b);
  });
  const groups = groupSchedule(sortedVisible, mode);
  const activeId = expandedId;
  const dayMatches = m.matches.filter(
    (match) =>
      scheduleDate(match.date) === filters.date &&
      (filters.game === "all" || match.game === filters.game),
  );
  const dateMatches = m.matches.filter(
    (match) => scheduleDate(match.date) === filters.date,
  );
  const tournaments = [
    ...new Set(dayMatches.map((match) => match.context).filter(Boolean)),
  ].sort();
  const extraCount = [
    filters.status !== "all",
    filters.format !== "all",
    filters.tournament !== "all",
    filters.personal === "skipped",
    filters.sort !== "time",
  ].filter(Boolean).length;
  const filtered =
    !!filters.query.trim() || extraCount > 0 || filters.personal !== "all";
  const selected = m.matches.filter((match) =>
    m.selectedMatchIds.has(match.id),
  );

  function changeFilters(patch: Partial<ScheduleFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setExpandedId(null);
    setCollapsed(new Set());
  }
  function resetFilters() {
    changeFilters({
      query: "",
      status: "all",
      format: "all",
      tournament: "all",
      personal: "all",
      sort: "time",
    });
  }
  function toggleGroup(key: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  function toggleDetails(id: string) {
    setExpandedId(activeId === id ? null : id);
  }

  function renderDetails(match: Match) {
    const teamRisks = risks.get(match.id);
    const teams = [
      {
        name: match.team1,
        logo: match.logoTeam1,
        risk: teamRisks?.[0],
        rank: match.positionTeam1,
        form: match.formStabilityTeam1,
        wins: match.formWins1,
        losses: match.formLosses1,
        last: match.formLast1,
        streak: match.formStreak1,
      },
      {
        name: match.team2,
        logo: match.logoTeam2,
        risk: teamRisks?.[1],
        rank: match.positionTeam2,
        form: match.formStabilityTeam2,
        wins: match.formWins2,
        losses: match.formLosses2,
        last: match.formLast2,
        streak: match.formStreak2,
      },
    ];
    return (
      <div
        className="ms-details"
        id={`${regionId}-detail-${match.id}`}
        role="region"
        aria-label={`Деталі: ${match.team1} — ${match.team2}`}
      >
        <section className="ms-notes">
          <h3>Ваші примітки</h3>
          {teams.map((team) => (
            <div className="ms-note" key={team.name}>
              <TeamLogo name={team.name} src={team.logo} game={match.game} />
              <div>
                <div className="ms-note-title">
                  <strong>{team.name}</strong>
                  {team.risk && <RiskBadge status={team.risk.status} />}
                </div>
                <p className={team.risk?.notes ? "ms-note-text" : "ms-muted"}>
                  {team.risk
                    ? team.risk.notes || "Примітка не додана"
                    : "Немає нотаток"}
                </p>
                <button
                  type="button"
                  className="ms-text-action"
                  onClick={() => onEditNote(match, team.name)}
                  aria-label={`${team.risk ? "Редагувати" : "Додати"} нотатку: ${team.name}`}
                >
                  {team.risk ? <Pencil size={15} /> : <Plus size={17} />}
                  {team.risk ? "Редагувати" : "Додати"}
                </button>
              </div>
            </div>
          ))}
        </section>
        <section className="ms-form">
          <h3>Форма та рейтинг</h3>
          <div className="ms-form-table">
            <div className="ms-form-head">
              <span>Команда</span>
              <span>Рейтинг</span>
            </div>
            {teams.map((team) => (
              <div className="ms-form-row" key={team.name}>
                <div>
                  <TeamLogo
                    name={team.name}
                    src={team.logo}
                    game={match.game}
                  />
                  <span>
                    <strong>{team.name}</strong>
                    <small>{formLabel(team.form)}</small>
                  </span>
                </div>
                <strong>
                  {team.rank != null && team.rank > 0 ? `#${team.rank}` : "—"}
                </strong>
              </div>
            ))}
          </div>
          <details className="ms-form-more">
            <summary>
              Останні результати
              {match.interestStars
                ? ` · Інтерес за рейтингом: ${match.interestStars}/5`
                : ""}
            </summary>
            {teams.map((team) => (
              <p key={team.name}>
                <strong>{team.name}:</strong>{" "}
                {team.wins || team.losses || team.last
                  ? `${team.wins || 0}W / ${team.losses || 0}L${team.streak ? ` · Серія ${team.streak > 0 ? "W" : "L"}${Math.abs(team.streak)}` : ""}${team.last ? ` · ${team.last}` : ""}`
                  : "Немає даних"}
              </p>
            ))}
          </details>
          <div className="ms-analysis-link">
            <small className="ms-muted">
              {[
                match.bettingCoefficientTeam1,
                match.bettingCoefficientTeam2,
              ].every((value) => coefficient(value) === "—")
                ? "Коефіцієнти ще недоступні."
                : "Дані джерела матчу."}
            </small>
            <button
              type="button"
              className="ms-text-action"
              onClick={() => onAnalysis(match)}
            >
              Детальний аналіз <ArrowRight size={16} />
            </button>
          </div>
        </section>
        <section className="ms-detail-actions">
          <h3>Дії з матчем</h3>
          <button
            type="button"
            className="ms-button"
            aria-pressed={m.selectedMatchIds.has(match.id)}
            onClick={() => m.toggleMatchSelection(match.id)}
          >
            {m.selectedMatchIds.has(match.id) ? (
              <Check size={17} />
            ) : (
              <Layers size={17} />
            )}
            {m.selectedMatchIds.has(match.id)
              ? "Прибрати з експресу"
              : "До експресу"}
          </button>
          <a
            className="ms-source"
            href={matchSource(match)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Джерело матчу <ExternalLink size={15} />
          </a>
          <p className="ms-muted">Дані можуть оновлюватися із затримкою.</p>
          <div className="ms-secondary-actions">
            <button type="button" onClick={() => m.handleAiRecommend(match)}>
              <Lightbulb size={16} /> AI-аналіз
            </button>
            <button
              type="button"
              aria-pressed={m.matchRatings[match.id] === "like"}
              onClick={() =>
                m.handleRateMatch(
                  match.id,
                  m.matchRatings[match.id] === "like" ? null : "like",
                )
              }
            >
              <Bookmark
                size={15}
                fill={
                  m.matchRatings[match.id] === "like" ? "currentColor" : "none"
                }
              />
              {m.matchRatings[match.id] === "like"
                ? "Прибрати з цікавих"
                : "Позначити цікавим"}
            </button>
            <button
              type="button"
              aria-pressed={m.matchRatings[match.id] === "dislike"}
              onClick={() =>
                m.handleRateMatch(
                  match.id,
                  m.matchRatings[match.id] === "dislike" ? null : "dislike",
                )
              }
            >
              <ThumbsDown size={15} />
              {m.matchRatings[match.id] === "dislike"
                ? "Повернути матч"
                : "Не цікавить"}
            </button>
          </div>
        </section>
      </div>
    );
  }

  function renderMatch(match: Match) {
    const teamRisks = risks.get(match.id);
    const rowRisks = [
      teamRisks?.[0] && { name: match.team1, ...teamRisks[0] },
      teamRisks?.[1] && { name: match.team2, ...teamRisks[1] },
    ].filter(Boolean) as { name: string; notes: string; status: string }[];
    const open = activeId === match.id;
    const selectedForExpress = m.selectedMatchIds.has(match.id);
    const liked = m.matchRatings[match.id] === "like";
    const disliked = m.matchRatings[match.id] === "dislike";
    const showSourceScore =
      (match.matchStatus === "finished" || match.matchStatus === "live") &&
      typeof match.score1 === "number" &&
      Number.isFinite(match.score1) &&
      match.score1 >= 0 &&
      typeof match.score2 === "number" &&
      Number.isFinite(match.score2) &&
      match.score2 >= 0;
    const s1 = match.score1 ?? 0;
    const s2 = match.score2 ?? 0;
    return (
      <Fragment key={match.id}>
        <div
          className={`ms-row ${open ? "is-open" : ""} ${selectedForExpress ? "is-selected" : ""} ${liked ? "is-liked" : ""} ${disliked ? "is-disliked" : ""}`}
          data-testid="schedule-row"
        >
          <div className="ms-interest">
            {expressMode && (
              <input
                type="checkbox"
                aria-label={`Обрати для експресу: ${match.team1} — ${match.team2}`}
                checked={selectedForExpress}
                onChange={() => m.toggleMatchSelection(match.id)}
              />
            )}
            <button
              type="button"
              className={`ms-rate ${liked ? "is-active" : ""}`}
              aria-label={`${liked ? "Прибрати з цікавих" : "Позначити цікавим"}: ${match.team1} — ${match.team2}`}
              aria-pressed={liked}
              title={liked ? "Прибрати з цікавих" : "Позначити цікавим"}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => m.handleRateMatch(match.id, liked ? null : "like")}
            >
              <ThumbsUp size={14} fill={liked ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              className={`ms-rate ${disliked ? "is-active is-disliked" : ""}`}
              aria-label={`${disliked ? "Повернути матч" : "Не цікавить"}: ${match.team1} — ${match.team2}`}
              aria-pressed={disliked}
              title={disliked ? "Повернути матч" : "Не цікавить"}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() =>
                m.handleRateMatch(match.id, disliked ? null : "dislike")
              }
            >
              <ThumbsDown size={14} fill={disliked ? "currentColor" : "none"} />
            </button>
          </div>
          <button
            type="button"
            className="ms-match"
            onClick={() => toggleDetails(match.id)}
            aria-expanded={open}
            aria-controls={`${regionId}-detail-${match.id}`}
            aria-label={`Деталі: ${match.team1} — ${match.team2}`}
          >
            <span className="ms-match-context">
              <span
                className="ms-tournament"
                title={match.context || "Турнір не вказаний"}
              >
                <span className="ms-tournament-name">
                  {match.context || "Турнір не вказаний"}
                </span>
              </span>
              {match.matchStatus === "finished" && (
                <span className="ms-match-status ms-match-status--finished">
                  Завершено
                </span>
              )}
            </span>
            <div className="ms-match-main">
              <div className="ms-time-col">
                <time dateTime={match.date} className="ms-time-inline">
                  {scheduleTime(match.date)}
                </time>
                {match.matchStatus === "live" && (
                  <span className="ms-match-status ms-match-status--live">
                    <span className="ms-live-dot" aria-hidden="true" />
                    Лайв
                  </span>
                )}
              </div>
              <span className="ms-teams">
                <span className="ms-team">
                  <TeamLogo
                    name={match.team1}
                    src={match.logoTeam1}
                    game={match.game}
                  />
                  <span>
                    <strong>{match.team1 || "Команда ще невідома"}</strong>
                  </span>
                </span>
                <span className="ms-versus">vs</span>
                <span className="ms-team">
                  <TeamLogo
                    name={match.team2}
                    src={match.logoTeam2}
                    game={match.game}
                  />
                  <span>
                    <strong>{match.team2 || "Команда ще невідома"}</strong>
                  </span>
                </span>
              </span>
              <span className="ms-match-meta">
                <span className={`ms-game-chip ms-game-chip--${match.game}`}>
                  {match.game === "Dota2" ? "Dota 2" : "CS2"}
                </span>
                <span className="ms-format-chip">
                  {match.matchType.toUpperCase()}
                </span>
                {rowRisks.map((risk, index) => (
                  <span
                    key={index}
                    className={`ms-team-risk ms-team-risk--${riskTone(risk.status)}`}
                    title={risk.notes || "Примітка не додана"}
                  >
                    {["stable", "reliable"].includes(riskTone(risk.status)) ? (
                      <ShieldCheck size={12} aria-hidden="true" />
                    ) : (
                      <ShieldAlert size={12} aria-hidden="true" />
                    )}
                    {risk.name} ·{" "}
                    {risk.status === "Стабільні"
                      ? "Стабільна"
                      : risk.status || "Неоцінена"}
                  </span>
                ))}
              </span>
            </div>
          </button>
          <div className="ms-source-cell">
            {showSourceScore ? (
              <span
                className="ms-source-score"
                aria-label={`Рахунок матчу: ${match.score1}:${match.score2}`}
              >
                <span
                  className={
                    s1 === s2 ? "" : s1 > s2 ? "ms-score-win" : "ms-score-loss"
                  }
                >
                  {s1}
                </span>
                <span className="ms-score-sep">:</span>
                <span
                  className={
                    s1 === s2 ? "" : s2 > s1 ? "ms-score-win" : "ms-score-loss"
                  }
                >
                  {s2}
                </span>
              </span>
            ) : (
              <a
                className="ms-cell-icon"
                href={matchSource(match)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Гра: ${match.team1} — ${match.team2}`}
                title="Відкрити джерело матчу"
              >
                <ExternalLink size={15} />
              </a>
            )}
          </div>
          <SourceForecast match={match} />
          <CompactOdds match={match} />
          <div className="ms-notes-cell">
            <button
              type="button"
              className={`ms-note-button ${rowRisks.length ? "" : "ms-note-button--add"}`}
              onClick={() => {
                if (rowRisks.length) toggleDetails(match.id);
                else onEditNote(match, match.team1);
              }}
              aria-label={`${rowRisks.length ? "Переглянути примітки" : "Додати примітку"}: ${match.team1} — ${match.team2}`}
              aria-expanded={rowRisks.length ? open : undefined}
              aria-controls={
                rowRisks.length ? `${regionId}-detail-${match.id}` : undefined
              }
              title={
                rowRisks.map((r) => `${r.name}: ${r.status}`).join("; ") ||
                "Немає нотаток"
              }
            >
              {rowRisks.length ? (
                <>
                  <Eye size={15} />
                  <span>Переглянути · {rowRisks.length}</span>
                </>
              ) : (
                <>
                  <CirclePlus size={15} />
                  <span>Додати нотатку</span>
                </>
              )}
            </button>
          </div>
          <div className="ms-record">
            <button
              type="button"
              className="ms-button ms-record-button"
              onClick={() => m.handleAddToBets(match)}
              aria-label={`Створити запис: ${match.team1} — ${match.team2}`}
              title="Створити запис"
            >
              <CirclePlus size={16} />
            </button>
            <button
              type="button"
              className="ms-cell-icon ms-express-toggle"
              aria-pressed={selectedForExpress}
              aria-label={`${selectedForExpress ? "Прибрати матч з експресу" : "Додати матч до експресу"}: ${match.team1} — ${match.team2}`}
              title={
                selectedForExpress
                  ? "Прибрати з експресу"
                  : "Додати до експресу"
              }
              onClick={() => m.toggleMatchSelection(match.id)}
            >
              {selectedForExpress ? <Check size={15} /> : <Layers size={15} />}
            </button>
            <button
              type="button"
              className="ms-icon ms-disclosure"
              onClick={() => toggleDetails(match.id)}
              aria-label={`${open ? "Згорнути" : "Розгорнути"} матч: ${match.team1} — ${match.team2}`}
              aria-expanded={open}
              aria-controls={`${regionId}-detail-${match.id}`}
            >
              <ChevronDown size={16} className={open ? "ms-rotate" : ""} />
            </button>
          </div>
        </div>
        {open && renderDetails(match)}
      </Fragment>
    );
  }

  return (
    <div className="ms-page">
      <header className="ms-hero">
        <div className="ms-hero-top">
          <div>
            <h1>МАТЧІ</h1>
            <p>Розклад, ваші позначки та аналіз.</p>
          </div>
          <div className="ms-hero-actions">
            <button
              type="button"
              className="ms-hero-results"
              onClick={onResults}
            >
              Результати <ExternalLink size={16} />
            </button>
            <button
              type="button"
              className="ms-hero-refresh"
              disabled={m.isLoading}
              onClick={() => void m.refreshMatches()}
            >
              <RefreshCw
                size={17}
                className={m.isLoading ? "ms-spinning" : ""}
              />
              {m.isLoading ? "Оновлення…" : "Оновити"}
            </button>
          </div>
        </div>
        <dl className="ms-hero-stats">
          <div>
            <dd className="ms-hero-matches">{dayMatches.length}</dd>
            <dt>Матчів на дату</dt>
          </div>
          <div>
            <dd className="ms-hero-tournaments">{tournaments.length}</dd>
            <dt>Турніри</dt>
          </div>
          <div>
            <dd className="ms-hero-live">
              {
                dayMatches.filter(
                  (match) =>
                    match.matchStatus === "live" &&
                    scheduleDate(match.date) >= today,
                ).length
              }
            </dd>
            <dt>Зараз грають</dt>
          </div>
        </dl>
      </header>
      <div className="ms-body ms-body--dense">
        <div className="ms-dense-heading">
          <h2>Розклад матчів</h2>
          <div className="ms-segment ms-grouping" aria-label="Групування">
            <button
              type="button"
              aria-pressed={mode === "time"}
              onClick={() => setMode("time")}
            >
              За часом
            </button>
            <button
              type="button"
              aria-pressed={mode === "tournament"}
              onClick={() => setMode("tournament")}
            >
              За турніром
            </button>
          </div>
        </div>
        <div className="ms-dense-tools">
          <div className="ms-date-tools">
            <div className="ms-segment" aria-label="Швидкий вибір дати">
              <button
                type="button"
                aria-pressed={filters.date === today}
                onClick={() =>
                  changeFilters({ date: today, tournament: "all" })
                }
              >
                Сьогодні
              </button>
              <button
                type="button"
                aria-pressed={filters.date === tomorrow}
                onClick={() =>
                  changeFilters({ date: tomorrow, tournament: "all" })
                }
              >
                Завтра
              </button>
            </div>
            <label className="ms-date-input">
              <CalendarDays size={18} />
              <span>{dateLabel(filters.date)}</span>
              <input
                type="date"
                aria-label="Дата матчів"
                value={filters.date}
                onChange={(event) => {
                  if (event.target.value)
                    changeFilters({
                      date: event.target.value,
                      tournament: "all",
                    });
                }}
              />
            </label>
            <div className="ms-segment ms-game-filter" aria-label="Гра">
              {(["all", "CS2", "Dota2"] as const).map((game) => {
                const count =
                  game === "all"
                    ? dateMatches.length
                    : dateMatches.filter((match) => match.game === game).length;
                const label =
                  game === "all"
                    ? "Усі ігри"
                    : game === "Dota2"
                      ? "Dota 2"
                      : game;
                return (
                  <button
                    type="button"
                    key={game}
                    className={`ms-game-option ms-game-option--${game}`}
                    aria-pressed={filters.game === game}
                    onClick={() => changeFilters({ game, tournament: "all" })}
                  >
                    {label} <span className="ms-game-count">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="ms-search-tools">
            <label className="ms-search">
              <Search size={19} />
              <input
                type="search"
                aria-label="Пошук команди або турніру"
                placeholder="Команда або турнір"
                value={filters.query}
                onChange={(event) =>
                  changeFilters({ query: event.target.value })
                }
              />
            </label>
            <button
              type="button"
              className={`ms-button ms-filter-toggle ${filtersOpen ? "is-active" : ""}`}
              aria-expanded={filtersOpen}
              aria-controls={`${regionId}-filters`}
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal size={18} /> Фільтри{" "}
              {extraCount > 0 && <span className="ms-count">{extraCount}</span>}
            </button>
          </div>
        </div>
        {filtersOpen && (
          <div className="ms-filter-panel" id={`${regionId}-filters`}>
            <label>
              Статус
              <select
                value={filters.status}
                onChange={(event) =>
                  changeFilters({ status: event.target.value })
                }
              >
                {[
                  ["all", "Усі статуси"],
                  ["upcoming", "Очікуються"],
                  ["live", "Зараз грають"],
                  ["finished", "Завершені"],
                  ["postponed", "Перенесені"],
                  ["cancelled", "Скасовані"],
                ].map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Формат
              <select
                value={filters.format}
                onChange={(event) =>
                  changeFilters({ format: event.target.value })
                }
              >
                <option value="all">Усі формати</option>
                {["Bo1", "Bo2", "Bo3", "Bo5"].map((format) => (
                  <option key={format} value={format}>
                    {format.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Турнір
              <select
                value={filters.tournament}
                onChange={(event) =>
                  changeFilters({ tournament: event.target.value })
                }
              >
                <option value="all">Усі турніри</option>
                {tournaments.map((tournament) => (
                  <option key={tournament} value={tournament}>
                    {tournament}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Сортування
              <select
                value={filters.sort}
                onChange={(event) =>
                  changeFilters({
                    sort: event.target.value as ScheduleFilters["sort"],
                  })
                }
              >
                <option value="time">Час: раніше → пізніше</option>
                <option value="time-desc">Час: пізніше → раніше</option>
                <option value="odds">Коефіцієнт: за зростанням</option>
                <option value="odds-desc">Коефіцієнт: за спаданням</option>
              </select>
            </label>
            <button
              type="button"
              className="ms-button ms-primary"
              onClick={resetFilters}
            >
              Скинути фільтри
            </button>
          </div>
        )}
        {filtered && (
          <div className="ms-filter-summary" role="status">
            Знайдено: {visible.length}
            {filters.query.trim() && <span> · «{filters.query.trim()}»</span>}
            <button type="button" onClick={resetFilters}>
              Скинути фільтри <X size={14} />
            </button>
          </div>
        )}
        {m.apiError && (
          <div className="ms-error" role="alert">
            <ShieldAlert size={18} />
            <span>
              Не вдалося повністю оновити розклад. Показано останні доступні
              дані.
            </span>
            <button type="button" onClick={() => void m.refreshMatches()}>
              Повторити
            </button>
          </div>
        )}
        {m.initialLoading && m.matches.length === 0 ? (
          <div className="ms-empty" role="status">
            <RefreshCw className="ms-spinning" />
            <h3>Завантажуємо матчі…</h3>
          </div>
        ) : visible.length === 0 ? (
          <div className="ms-empty">
            <CalendarDays size={30} />
            <h3>
              {filtered
                ? "Матчів за цими фільтрами немає"
                : "На цю дату немає матчів"}
            </h3>
            <p>
              {dateLabel(filters.date)}
              {filters.game !== "all"
                ? ` · ${filters.game === "Dota2" ? "Dota 2" : filters.game}`
                : ""}
              .{" "}
              {filtered
                ? "Спробуйте іншу команду або змініть умови пошуку."
                : "Оберіть іншу дату або гру. Минулі матчі доступні в результатах."}
            </p>
            <div>
              {filtered ? (
                <button
                  type="button"
                  className="ms-button"
                  onClick={resetFilters}
                >
                  Скинути фільтри
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="ms-button"
                    onClick={() =>
                      changeFilters({
                        date: tomorrow,
                        game: "all",
                        tournament: "all",
                      })
                    }
                  >
                    Переглянути завтра
                  </button>
                  <button
                    type="button"
                    className="ms-button"
                    onClick={onResults}
                  >
                    Результати матчів
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {groups.map((group, index) => {
              const isCollapsed = collapsed.has(group.key);
              const shown = group.matches;
              return (
                <section
                  className={`ms-group ${mode === "time" ? "ms-group--time" : ""}`}
                  key={group.key}
                  aria-label={mode === "time" ? "Матчі за часом" : undefined}
                  aria-labelledby={
                    mode === "tournament"
                      ? `${regionId}-group-${index}`
                      : undefined
                  }
                >
                  {mode === "tournament" && (
                    <h3 id={`${regionId}-group-${index}`}>
                      <button
                        type="button"
                        className="ms-group-title"
                        onClick={() => toggleGroup(group.key)}
                        aria-expanded={!isCollapsed}
                        aria-controls={`${regionId}-group-body-${index}`}
                      >
                        <Trophy size={22} />
                        <strong>{group.title}</strong>{" "}
                        <span className="ms-group-count">
                          {group.game && `${group.game} · `}
                          {matchCount(group.matches.length)}
                        </span>
                        <ChevronDown
                          size={20}
                          className={!isCollapsed ? "ms-rotate" : ""}
                        />
                      </button>
                    </h3>
                  )}
                  {(!isCollapsed || mode === "time") && (
                    <div id={`${regionId}-group-body-${index}`}>
                      <div className="ms-columns">
                        <span
                          className="ms-interest-heading"
                          aria-label="Інтерес"
                        >
                          <span className="ms-interest-heading-text">
                            Інтерес
                          </span>
                        </span>
                        <span>Матч і турнір</span>
                        <span className="ms-source-heading">Гра</span>
                        <span className="ms-forecast-heading">
                          Прогноз джерела
                          <details className="ms-forecast-help">
                            <summary aria-label="Про прогноз джерела">
                              <Info size={14} />
                            </summary>
                            <span role="note">
                              Відсотки від джерела матчу, не розрахунок із
                              коефіцієнтів. Синій — перша команда, зелений —
                              друга. Це не гарантія результату. Якщо повної пари
                              даних немає, прогноз не показується.
                            </span>
                          </details>
                        </span>
                        <span>Коефіцієнти</span>
                        <span>Примітки</span>
                        <span>Додати запис</span>
                      </div>
                      {shown.map(renderMatch)}
                    </div>
                  )}
                </section>
              );
            })}
          </>
        )}
        <footer className="ms-footer">
          <span>
            {dateLabel(filters.date)} · {matchCount(visible.length)}
          </span>
          <span>Синій — команда 1 · Зелений — команда 2</span>
          <span>Час за Києвом</span>
          <button
            type="button"
            className="ms-bulk-express"
            aria-pressed={expressMode}
            onClick={() => setExpressMode(!expressMode)}
          >
            <Layers size={15} />
            {expressMode ? "Завершити вибір" : "Вибрати для експресу"}
          </button>
        </footer>
        {m.selectedMatchIds.size > 0 && (
          <aside className="ms-express" aria-label="Вибрані матчі для експресу">
            <div className="ms-express-top">
              <strong>
                <Layers size={18} /> Експрес · {m.selectedMatchIds.size} / 10
              </strong>
              <span>Оберіть від 2 до 10 матчів</span>
              <button
                type="button"
                className="ms-button ms-primary"
                disabled={selected.length < 2}
                onClick={m.handleCreateExpress}
              >
                Створити експрес <ArrowRight size={17} />
              </button>
              <button
                type="button"
                className="ms-icon"
                aria-label="Очистити вибір експресу"
                onClick={m.clearSelectedMatches}
              >
                <X size={20} />
              </button>
            </div>
            <div className="ms-express-matches">
              {selected.map((match) => (
                <button
                  type="button"
                  key={match.id}
                  onClick={() => m.toggleMatchSelection(match.id)}
                  aria-label={`Прибрати з експресу: ${match.team1} — ${match.team2}`}
                >
                  {match.team1} — {match.team2}
                  <X size={13} />
                </button>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
