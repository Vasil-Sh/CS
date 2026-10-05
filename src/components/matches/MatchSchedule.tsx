import { Fragment, useId, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Bookmark,
  CalendarDays,
  Check,
  ChevronDown,
  ExternalLink,
  Layers,
  Lightbulb,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  ThumbsDown,
  Trophy,
  X,
} from "lucide-react";
import type { Match, useMatches } from "@/hooks/useMatches";
import { proxyLogoUrl } from "@/lib/logoProxy";
import {
  coefficient,
  dateLabel,
  filterSchedule,
  formLabel,
  groupSchedule,
  matchSource,
  matchState,
  nextScheduleDate,
  riskTone,
  scheduleDate,
  scheduleTime,
  type ScheduleFilters,
} from "./matchScheduleModel";
import "./MatchSchedule.css";

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
  return url && url !== failedUrl ? (
    <img
      className="ms-logo"
      src={url}
      alt=""
      loading="lazy"
      onError={() => setFailedUrl(url)}
    />
  ) : (
    <span className="ms-logo ms-monogram" aria-hidden="true">
      {name.slice(0, 2).toUpperCase() || "?"}
    </span>
  );
}

function RiskBadge({ status }: { status: string }) {
  return (
    <span className={`ms-risk ms-risk--${riskTone(status)}`}>
      {status || "Неоцінена"}
    </span>
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
  const [mode, setMode] = useState<"time" | "tournament">("tournament");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null | undefined>();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [fullGroups, setFullGroups] = useState<Set<string>>(new Set());
  const [expressMode, setExpressMode] = useState(false);
  const regionId = useId();

  const risks = useMemo(
    () =>
      new Map(
        m.matches.map((match) => [
          match.id,
          [
            m.getTeamRiskInfo(match.team1, match.game),
            m.getTeamRiskInfo(match.team2, match.game),
          ] as const,
        ]),
      ),
    [m.matches, m.getTeamRiskInfo],
  );
  const hasNotes = (match: Match) => !!risks.get(match.id)?.some(Boolean);
  const baseFilters = { ...filters, personal: "all" as const };
  const baseMatches = filterSchedule(
    m.matches,
    baseFilters,
    m.matchRatings,
    hasNotes,
  );
  const visible = filterSchedule(m.matches, filters, m.matchRatings, hasNotes);
  const groups = groupSchedule(visible, mode);
  const activeId = expandedId === undefined ? visible[0]?.id : expandedId;
  const dayMatches = m.matches.filter(
    (match) =>
      scheduleDate(match.date) === filters.date &&
      (filters.game === "all" || match.game === filters.game),
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
    setExpandedId(undefined);
    setFullGroups(new Set());
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
    const state = matchState(match, today);
    const open = activeId === match.id;
    const selectedForExpress = m.selectedMatchIds.has(match.id);
    const liked = m.matchRatings[match.id] === "like";
    return (
      <Fragment key={match.id}>
        <div
          className={`ms-row ${open ? "is-open" : ""} ${selectedForExpress ? "is-selected" : ""}`}
          data-testid="schedule-row"
        >
          <div className="ms-time">
            {expressMode && (
              <input
                type="checkbox"
                aria-label={`Обрати для експресу: ${match.team1} — ${match.team2}`}
                checked={selectedForExpress}
                onChange={() => m.toggleMatchSelection(match.id)}
              />
            )}
            <time dateTime={match.date}>{scheduleTime(match.date)}</time>
            <small className={`ms-status ms-status--${state.tone}`}>
              {state.text}
            </small>
          </div>
          <button
            type="button"
            className="ms-match"
            onClick={() => toggleDetails(match.id)}
            aria-expanded={open}
            aria-controls={`${regionId}-detail-${match.id}`}
            aria-label={`Деталі: ${match.team1} — ${match.team2}`}
          >
            <span className="ms-teams">
              <span className="ms-team">
                <TeamLogo
                  name={match.team1}
                  src={match.logoTeam1}
                  game={match.game}
                />
                <span>
                  <strong>{match.team1 || "Команда ще невідома"}</strong>
                  {teamRisks?.[0] && <RiskBadge status={teamRisks[0].status} />}
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
                  {teamRisks?.[1] && <RiskBadge status={teamRisks[1].status} />}
                </span>
              </span>
            </span>
            <span className="ms-match-meta">
              {match.game === "Dota2" ? "Dota 2" : "CS2"} ·{" "}
              {match.matchType.toUpperCase()}
              {mode === "time" && match.context ? ` · ${match.context}` : ""}
            </span>
          </button>
          <div className="ms-format">
            <span>{match.matchType.toUpperCase()}</span>
          </div>
          <div className="ms-odds" aria-label="Коефіцієнти">
            {[
              { name: match.team1, value: match.bettingCoefficientTeam1 },
              { name: match.team2, value: match.bettingCoefficientTeam2 },
            ].map((team, index) => (
              <div
                key={index}
                title={`${team.name}: ${coefficient(team.value)}`}
              >
                <small>{team.name}</small>
                <strong>{coefficient(team.value)}</strong>
              </div>
            ))}
          </div>
          <div className="ms-marks">
            <button
              type="button"
              className={`ms-icon ${liked ? "is-liked" : ""}`}
              aria-label={`${liked ? "Прибрати з цікавих" : "Позначити цікавим"}: ${match.team1} — ${match.team2}`}
              aria-pressed={liked}
              onClick={() => m.handleRateMatch(match.id, liked ? null : "like")}
            >
              <Bookmark size={21} fill={liked ? "currentColor" : "none"} />
            </button>
          </div>
          <button
            type="button"
            className="ms-risk-cell"
            onClick={() => {
              setExpandedId(match.id);
            }}
            aria-label={`Примітки: ${match.team1} — ${match.team2}`}
            title={
              rowRisks.map((r) => `${r.name}: ${r.status}`).join("; ") ||
              "Немає нотаток"
            }
          >
            {rowRisks.length ? (
              <>
                <ShieldAlert size={15} />
                <span>
                  {rowRisks.length}{" "}
                  {rowRisks.length === 1 ? "примітка" : "примітки"}
                </span>
              </>
            ) : (
              <span className="ms-muted">—</span>
            )}
          </button>
          <div className="ms-record">
            <button
              type="button"
              className="ms-button ms-record-button"
              onClick={() => m.handleAddToBets(match)}
              aria-label={`Створити запис: ${match.team1} — ${match.team2}`}
            >
              <Plus size={19} /> Запис
            </button>
          </div>
          <button
            type="button"
            className="ms-icon ms-disclosure"
            onClick={() => toggleDetails(match.id)}
            aria-label={`${open ? "Згорнути" : "Розгорнути"} матч: ${match.team1} — ${match.team2}`}
            aria-expanded={open}
            aria-controls={`${regionId}-detail-${match.id}`}
          >
            <ChevronDown size={19} className={open ? "ms-rotate" : ""} />
          </button>
        </div>
        {open && renderDetails(match)}
      </Fragment>
    );
  }

  return (
    <div className="ms-page">
      <header className="ms-hero">
        <div>
          <h1>МАТЧІ</h1>
          <p>Розклад, ваші позначки та аналіз.</p>
        </div>
        <div className="ms-hero-right">
          <dl>
            <div>
              <dd>{dayMatches.length}</dd>
              <dt>Матчів на дату</dt>
            </div>
            <div>
              <dd>{tournaments.length}</dd>
              <dt>Турніри</dt>
            </div>
            <div>
              <dd>
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
          <button
            type="button"
            className="ms-button"
            disabled={m.isLoading}
            onClick={() => void m.refreshMatches()}
          >
            <RefreshCw size={17} className={m.isLoading ? "ms-spinning" : ""} />
            {m.isLoading ? "Оновлення…" : "Оновити"}
          </button>
        </div>
      </header>
      <div className="ms-body">
        <div className="ms-date-tools">
          <div className="ms-segment" aria-label="Швидкий вибір дати">
            <button
              type="button"
              aria-pressed={filters.date === today}
              onClick={() => changeFilters({ date: today, tournament: "all" })}
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
          <div className="ms-segment" aria-label="Гра">
            {(["all", "CS2", "Dota2"] as const).map((game) => (
              <button
                type="button"
                key={game}
                aria-pressed={filters.game === game}
                onClick={() => changeFilters({ game, tournament: "all" })}
              >
                {game === "all" ? "Усі" : game === "Dota2" ? "Dota 2" : game}
              </button>
            ))}
          </div>
        </div>
        <div className="ms-search-tools">
          <label className="ms-search">
            <Search size={19} />
            <input
              type="search"
              aria-label="Пошук команди або турніру"
              placeholder="Пошук команди або турніру"
              value={filters.query}
              onChange={(event) => changeFilters({ query: event.target.value })}
            />
          </label>
          <button
            type="button"
            className="ms-button"
            aria-expanded={filtersOpen}
            aria-controls={`${regionId}-filters`}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal size={18} /> Фільтри{" "}
            {extraCount > 0 && <span className="ms-count">{extraCount}</span>}
          </button>
          <button type="button" className="ms-button" onClick={onResults}>
            Результати <ExternalLink size={16} />
          </button>
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
              className="ms-text-action"
              aria-pressed={filters.personal === "skipped"}
              onClick={() =>
                changeFilters({
                  personal: filters.personal === "skipped" ? "all" : "skipped",
                })
              }
            >
              <ThumbsDown size={15} /> Нецікаві матчі
            </button>
            <button
              type="button"
              className="ms-text-action"
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
        <div className="ms-schedule-toolbar">
          <h2>Розклад</h2>
          <div className="ms-segment ms-personal" aria-label="Мої матчі">
            <button
              type="button"
              aria-pressed={filters.personal === "all"}
              onClick={() => changeFilters({ personal: "all" })}
            >
              Усі · {baseMatches.length}
            </button>
            <button
              type="button"
              aria-pressed={filters.personal === "liked"}
              onClick={() => changeFilters({ personal: "liked" })}
            >
              Мої цікаві
            </button>
            <button
              type="button"
              aria-pressed={filters.personal === "notes"}
              onClick={() => changeFilters({ personal: "notes" })}
            >
              З нотатками
            </button>
          </div>
          <div className="ms-toolbar-end">
            <button
              type="button"
              className="ms-button"
              aria-pressed={expressMode}
              onClick={() => setExpressMode(!expressMode)}
            >
              <Layers size={17} />
              {expressMode ? "Завершити вибір" : "Вибрати для експресу"}
            </button>
            <div className="ms-segment" aria-label="Групування">
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
        </div>
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
            <div className="ms-columns" aria-hidden="true">
              <span>Час за Києвом</span>
              <span>Матч</span>
              <span>Формат</span>
              <span>Коефіцієнти</span>
              <span>Обране</span>
              <span>Примітки</span>
              <span>Запис</span>
              <span />
            </div>
            {groups.map((group, index) => {
              const isCollapsed = collapsed.has(group.key);
              const limit = mode === "time" ? 12 : 4;
              const shown = fullGroups.has(group.key)
                ? group.matches
                : group.matches.slice(0, limit);
              return (
                <section
                  className="ms-group"
                  key={group.key}
                  aria-labelledby={`${regionId}-group-${index}`}
                >
                  <h3 id={`${regionId}-group-${index}`}>
                    <button
                      type="button"
                      className="ms-group-title"
                      onClick={() => toggleGroup(group.key)}
                      aria-expanded={!isCollapsed}
                      aria-controls={`${regionId}-group-body-${index}`}
                    >
                      {mode === "tournament" ? (
                        <Trophy size={22} />
                      ) : (
                        <CalendarDays size={22} />
                      )}
                      <strong>{group.title}</strong>{" "}
                      <span>
                        {group.game && `${group.game} · `}
                        {group.matches.length} матчів
                      </span>
                      <ChevronDown
                        size={20}
                        className={!isCollapsed ? "ms-rotate" : ""}
                      />
                    </button>
                  </h3>
                  {!isCollapsed && (
                    <div id={`${regionId}-group-body-${index}`}>
                      {shown.map(renderMatch)}
                      {group.matches.length > shown.length && (
                        <button
                          type="button"
                          className="ms-more"
                          onClick={() =>
                            setFullGroups((current) =>
                              new Set(current).add(group.key),
                            )
                          }
                        >
                          Ще {group.matches.length - shown.length}{" "}
                          {mode === "tournament" ? "матчів турніру" : "матчів"}{" "}
                          <ArrowDown size={16} />
                        </button>
                      )}
                      {fullGroups.has(group.key) &&
                        group.matches.length > limit && (
                          <button
                            type="button"
                            className="ms-more"
                            onClick={() =>
                              setFullGroups((current) => {
                                const next = new Set(current);
                                next.delete(group.key);
                                return next;
                              })
                            }
                          >
                            Показати менше{" "}
                            <ChevronDown size={16} className="ms-rotate" />
                          </button>
                        )}
                    </div>
                  )}
                </section>
              );
            })}
          </>
        )}
        <footer className="ms-footer">
          <span>
            {dateLabel(filters.date)} · {visible.length} матчів
          </span>
          <span>Створення запису не розміщує ставку.</span>
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
