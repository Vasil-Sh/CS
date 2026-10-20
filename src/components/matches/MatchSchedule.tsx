import { Fragment, useId, useMemo, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  FileText,
  Star,
  CalendarDays,
  Check,
  ChevronDown,
  CirclePlus,
  Clock3,
  ExternalLink,
  Info,
  Layers,
  Settings2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Trophy,
  X,
} from "lucide-react";
import type { Match, useMatches } from "@/hooks/useMatches";
import { proxyLogoUrl } from "@/lib/logoProxy";
import type { Bet } from "@/types/betting";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { hasJournalRecord } from "./scheduleJournal";
import {
  ScheduleAdvertisement,
  type ScheduleAdvertisementProps,
} from "./ScheduleAdvertisement";
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
  sectionSchedule,
  sourceForecast,
  type ScheduleFilters,
} from "./matchScheduleModel";
import "./MatchSchedule.css";
import "./MatchScheduleDense.css";
import "./MatchDetails.css";
import "./MatchScheduleSections.css";
import "./MatchScheduleCompact.css";
import "./MatchScheduleToolbar.css";
import "./MatchScheduleHero.css";
import "./MatchScheduleComparison.css";

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
    | "selectedMatchIds"
    | "toggleMatchSelection"
    | "clearSelectedMatches"
    | "handleCreateExpress"
    | "refreshMatches"
  >;
  onEditNote: (match: Match, team: string) => void;
  onResults: () => void;
  now?: Date;
  advertising?: ScheduleAdvertisementProps;
  journalBets?: Bet[];
  onOpenJournal?: (match: Match) => void;
}

function TeamLogo({
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

function TournamentLogo({
  src,
  game,
}: {
  src?: string | null;
  game: Match["game"];
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const placeholder =
    game === "Dota2"
      ? "/assets/team-placeholder-dota.svg"
      : "/assets/team-placeholder-cs2.svg";
  // tournamentLogo is already proxied by the API client (/api/v1/.../logo/external/...)
  return src && src !== failedUrl ? (
    <img src={src} alt="" loading="lazy" onError={() => setFailedUrl(src)} />
  ) : (
    <img src={placeholder} alt="" aria-hidden="true" />
  );
}

function RiskBadge({ status }: { status: string }) {
  return (
    <span className={`ms-risk ms-risk--${riskTone(status)}`}>
      {status || "Неоцінена"}
    </span>
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
      <span className="ms-odds-sr">
        {forecast
          ? `${match.team1}: ${percentLabel(forecast.first)}; ${match.team2}: ${percentLabel(forecast.second)}.`
          : "Немає даних"}
      </span>
      {[match.team1, match.team2].map((team, index) => {
        const value = forecast
          ? index === 0
            ? forecast.first
            : forecast.second
          : null;
        return (
          <div
            className={`msc-probability msc-probability--${index + 1}`}
            key={index}
            aria-label={`${team}: ${value === null ? "немає даних" : percentLabel(value)}`}
            title={`${team}: ${value === null ? "немає даних" : percentLabel(value)}${match.predictionSource === "hltv-votes" ? " — голосування користувачів HLTV, не ймовірність перемоги" : ""}`}
          >
            <span className="msc-probability-team" aria-hidden="true">
              {team}
            </span>
            <span className="msc-probability-value" aria-hidden="true">
              {value === null ? "—" : percentLabel(value)}
            </span>
            <span className="msc-probability-track" aria-hidden="true">
              {value !== null && <span style={{ width: `${value}%` }} />}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function MatchSchedule({
  model: m,
  onEditNote,
  onResults,
  now = new Date(),
  advertising,
  journalBets = [],
  onOpenJournal,
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
  const [density, setDensity] = useState<"compact" | "comfortable">(() => {
    try {
      return localStorage.getItem("matchiq.schedule.density") === "comfortable"
        ? "comfortable"
        : "compact";
    } catch {
      return "compact";
    }
  });
  const [visibleLimit, setVisibleLimit] = useState(20);
  function changeDensity(value: "compact" | "comfortable") {
    setDensity(value);
    try {
      localStorage.setItem("matchiq.schedule.density", value);
    } catch {
      /* Storage may be disabled. */
    }
  }
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
  const recordedIds = useMemo(
    () =>
      new Set(
        matches
          .filter((match) => hasJournalRecord(match, journalBets))
          .map((match) => match.id),
      ),
    [matches, journalBets],
  );
  const visible = filterSchedule(
    m.matches,
    filters,
    m.matchRatings,
    hasNotes,
    (match) => recordedIds.has(match.id),
  );
  const allSections = sectionSchedule(visible, today);
  let remaining = visibleLimit;
  const sections = allSections.flatMap((section) => {
    const entries = section.matches.slice(0, remaining);
    remaining = Math.max(0, remaining - entries.length);
    return entries.length
      ? [{ ...section, matches: entries, total: section.matches.length }]
      : [];
  });
  // One slot at an existing section boundary, never interrupt a match or invent an empty group.
  const adAfterSection =
    sections.length > 1 && ["live", "upcoming"].includes(sections[0].key)
      ? sections[0].key
      : null;
  const activeId = expandedId;
  const dayMatches = m.matches.filter(
    (match) =>
      scheduleDate(match.date) === filters.date &&
      (filters.game === "all" || match.game === filters.game),
  );
  const dateMatches = m.matches.filter(
    (match) => scheduleDate(match.date) === filters.date,
  );
  const gameCounts = useMemo(
    () => ({
      all: dateMatches.length,
      CS2: dateMatches.filter((match) => match.game === "CS2").length,
      Dota2: dateMatches.filter((match) => match.game === "Dota2").length,
    }),
    [dateMatches],
  );
  const personalCounts = useMemo(
    () => ({
      liked: dateMatches.filter((match) => m.matchRatings[match.id] === "like")
        .length,
      notes: dateMatches.filter((match) => hasNotes(match)).length,
    }),
    [dateMatches, m.matchRatings, hasNotes],
  );
  const tournaments = [
    ...new Set(dayMatches.map((match) => match.context).filter(Boolean)),
  ].sort();
  const liveMatches = dayMatches.filter(
    (match) =>
      match.matchStatus === "live" && scheduleDate(match.date) >= today,
  ).length;
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
    setVisibleLimit(20);
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
    const noteCount = teams.filter((team) => team.risk).length;
    const hasForm = teams.some(
      (team) => formLabel(team.form) !== "Немає даних",
    );
    return (
      <div
        className="ms-detail-panel"
        id={`${regionId}-detail-${match.id}`}
        role="region"
        aria-label={`Деталі: ${match.team1} — ${match.team2}`}
      >
        <div className="ms-detail-content">
          <section
            className="ms-detail-notes"
            aria-labelledby={`${regionId}-notes-${match.id}`}
          >
            <h3 id={`${regionId}-notes-${match.id}`}>
              Примітки до команд
              <span
                className="ms-detail-count"
                aria-label={`Команд із примітками: ${noteCount}`}
              >
                {noteCount}
              </span>
            </h3>
            <div className="ms-detail-cards">
              {teams.map((team) => (
                <article
                  className={`ms-detail-card${team.risk ? ` ms-detail-card--${riskTone(team.risk.status)}` : ""}`}
                  key={team.name}
                  aria-label={`Примітка: ${team.name}`}
                >
                  <header className="ms-detail-card-head">
                    <TeamLogo
                      name={team.name}
                      src={team.logo}
                      game={match.game}
                    />
                    <strong>{team.name}</strong>
                    {team.risk && <RiskBadge status={team.risk.status} />}
                  </header>
                  {team.risk?.notes?.trim() ? (
                    <p className="ms-detail-note-text">{team.risk.notes}</p>
                  ) : (
                    <div className="ms-detail-note-empty">
                      <p>
                        {team.risk
                          ? "Текст примітки ще не додано"
                          : "Ще немає примітки"}
                      </p>
                      <span>Додайте важливе про команду.</span>
                    </div>
                  )}
                  <button
                    type="button"
                    className="ms-detail-note-action"
                    onClick={() => onEditNote(match, team.name)}
                    aria-label={`${team.risk ? "Редагувати" : "Додати"} нотатку: ${team.name}`}
                  >
                    {team.risk ? (
                      <Pencil size={16} aria-hidden="true" />
                    ) : (
                      <Plus size={16} aria-hidden="true" />
                    )}
                    {team.risk ? "Редагувати примітку" : "Додати примітку"}
                  </button>
                </article>
              ))}
            </div>
          </section>
          <section
            className="ms-detail-form"
            aria-labelledby={`${regionId}-form-${match.id}`}
          >
            <h3 id={`${regionId}-form-${match.id}`}>Форма та рейтинг</h3>
            <div className="ms-detail-table-wrap">
              <table className="ms-detail-table" aria-label="Рейтинг команд">
                <thead>
                  <tr>
                    <th scope="col">Команда</th>
                    <th scope="col">Рейтинг</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.name}>
                      <th scope="row">
                        <div className="ms-detail-ranked-team">
                          <TeamLogo
                            name={team.name}
                            src={team.logo}
                            game={match.game}
                          />
                          <span>
                            <strong>{team.name}</strong>
                            {hasForm && (
                              <small>
                                {formLabel(team.form) === "Немає даних"
                                  ? "Форма не надана"
                                  : formLabel(team.form)}
                              </small>
                            )}
                          </span>
                        </div>
                      </th>
                      <td>
                        {team.rank != null &&
                        Number.isFinite(team.rank) &&
                        team.rank > 0 ? (
                          <strong>#{team.rank}</strong>
                        ) : (
                          <span aria-label="Рейтинг відсутній">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!hasForm && (
              <p className="ms-detail-form-empty">
                <Info size={19} aria-hidden="true" /> Даних про форму поки немає
              </p>
            )}
          </section>
        </div>
        <div className="msc-detail-tools">
          <div className="msc-detail-forecast">
            <small>Прогноз джерела, не гарантія результату.</small>
          </div>
          <a
            className="ms-button"
            href={matchSource(match)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Гра: ${match.team1} — ${match.team2}`}
          >
            <ExternalLink size={16} /> Джерело матчу
          </a>
          <button
            type="button"
            className="ms-button"
            aria-pressed={m.selectedMatchIds.has(match.id)}
            aria-label={`${m.selectedMatchIds.has(match.id) ? "Прибрати матч з експресу" : "Додати матч до експресу"}: ${match.team1} — ${match.team2}`}
            onClick={() => m.toggleMatchSelection(match.id)}
          >
            <Layers size={16} />{" "}
            {m.selectedMatchIds.has(match.id)
              ? "Прибрати з експресу"
              : "До експресу"}
          </button>
          <button
            type="button"
            className="ms-button ms-primary"
            aria-label={`Створити запис: ${match.team1} — ${match.team2}`}
            onClick={() => m.handleAddToBets(match)}
          >
            <CirclePlus size={16} /> Додати запис
          </button>
        </div>
      </div>
    );
  }

  function renderMatch(match: Match) {
    const rowRisks = risks.get(match.id)?.filter(Boolean) || [];
    const open = activeId === match.id;
    const liked = m.matchRatings[match.id] === "like";
    const selectedForExpress = m.selectedMatchIds.has(match.id);
    const live =
      match.matchStatus === "live" && scheduleDate(match.date) >= today;
    const hasScore =
      (live || match.matchStatus === "finished") &&
      [match.score1, match.score2].every(
        (value) =>
          typeof value === "number" && Number.isFinite(value) && value >= 0,
      );
    const teams = [
      { name: match.team1, logo: match.logoTeam1, score: match.score1 },
      { name: match.team2, logo: match.logoTeam2, score: match.score2 },
    ];
    return (
      <Fragment key={match.id}>
        <div
          className={`ms-row ${open ? "is-open" : ""} ${selectedForExpress ? "is-selected" : ""}`}
          data-testid="schedule-row"
        >
          <div className="msc-time">
            {expressMode && (
              <input
                type="checkbox"
                checked={selectedForExpress}
                aria-label={`Обрати для експресу: ${match.team1} — ${match.team2}`}
                onChange={() => m.toggleMatchSelection(match.id)}
              />
            )}
            <time dateTime={match.date}>{scheduleTime(match.date)}</time>
            {live && <span className="msc-live">● LIVE</span>}
          </div>
          <button
            type="button"
            className="msc-match"
            onClick={() => toggleDetails(match.id)}
            aria-expanded={open}
            aria-controls={`${regionId}-detail-${match.id}`}
            aria-label={`Деталі: ${match.team1} — ${match.team2}`}
          >
            {teams.map((team, index) => {
              const other = teams[index === 0 ? 1 : 0].score;
              const score = team.score;
              const tone =
                hasScore &&
                typeof score === "number" &&
                typeof other === "number"
                  ? score > other
                    ? "is-win"
                    : score < other
                      ? "is-loss"
                      : ""
                  : "";
              return (
                <span className="msc-team" key={index}>
                  <TeamLogo
                    name={team.name}
                    src={team.logo}
                    game={match.game}
                  />
                  <strong title={team.name}>
                    {team.name || "Команда ще невідома"}
                  </strong>
                  <span
                    className={`msc-score ${tone}`}
                    aria-label={`Рахунок ${team.name}: ${hasScore ? team.score : "0"}`}
                  >
                    {hasScore ? team.score : "0"}
                  </span>
                </span>
              );
            })}
          </button>
          <div className="msc-tournament">
            <TournamentLogo src={match.tournamentLogo} game={match.game} />
            <div>
              <strong title={match.context}>
                {match.context || "Турнір не вказаний"}
              </strong>
              <small>
                {match.game === "Dota2" ? "Dota 2" : "CS2"} ·{" "}
                {match.matchType.toUpperCase()}
              </small>
            </div>
          </div>
          <div className="msc-forecast-cell">
            <SourceForecast match={match} />
          </div>
          <div className="msc-odds" role="group" aria-label="Коефіцієнти">
            {[match.bettingCoefficientTeam1, match.bettingCoefficientTeam2].map(
              (value, index) => (
                <span
                  key={index}
                  className={`odds-chip ${value == null || !Number.isFinite(value) || value <= 1 ? "odds-chip--empty" : index === 0 ? "odds-chip--team1" : "odds-chip--team2"}`}
                  aria-label={`${teams[index].name}: ${coefficient(value)}`}
                >
                  {coefficient(value)}
                </span>
              ),
            )}
          </div>
          <div className="msc-marks">
            {rowRisks.length === 0 &&
              !(recordedIds.has(match.id) && onOpenJournal) && (
                <span className="msc-marks-empty" aria-label="Немає записів">
                  Немає записів
                </span>
              )}
            {rowRisks.length > 0 && (
              <button
                type="button"
                className="msc-note"
                aria-label={`Показати нотатки: ${match.team1} — ${match.team2}`}
                aria-expanded={open}
                aria-controls={`${regionId}-detail-${match.id}`}
                onClick={() => toggleDetails(match.id)}
              >
                <span>
                  {rowRisks.length}{" "}
                  {rowRisks.length === 1 ? "нотатка" : "нотатки"}
                </span>
              </button>
            )}
            {recordedIds.has(match.id) && onOpenJournal && (
              <button
                type="button"
                className="msc-journal"
                aria-label={`Відкрити журнал: ${match.team1} — ${match.team2}`}
                onClick={() => onOpenJournal(match)}
              >
                <FileText size={15} />
                <span>Є запис</span>
              </button>
            )}
          </div>
          <div
            className="msc-record-actions record-actions record-actions--stacked"
            role="group"
            aria-label={`Додати запис: ${match.team1} — ${match.team2}`}
          >
            <button
              type="button"
              className="record-action record-action--single"
              aria-label={`Ординар: ${match.team1} — ${match.team2}`}
              title="Відкрити форму ординара"
              onClick={() => m.handleAddToBets(match)}
            >
              Ординар
            </button>
            <button
              type="button"
              className="record-action record-action--express"
              aria-pressed={selectedForExpress}
              aria-label={`${selectedForExpress ? "Прибрати з експресу" : "До експресу"}: ${match.team1} — ${match.team2}`}
              title={
                selectedForExpress
                  ? "Прибрати матч з експресу"
                  : "Обрати матч для експресу"
              }
              onClick={() => m.toggleMatchSelection(match.id)}
            >
              Експрес
            </button>
          </div>
          <div className="msc-row-actions">
            <button
              type="button"
              className={`ms-icon msc-bookmark ${liked ? "is-liked" : ""}`}
              aria-pressed={liked}
              title={liked ? "Відкріпити матч" : "Закріпити матч"}
              aria-label={`${liked ? "Відкріпити" : "Закріпити"} матч: ${match.team1} — ${match.team2}`}
              onClick={() => m.handleRateMatch(match.id, liked ? null : "like")}
            >
              <Bookmark size={19} fill={liked ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              className="ms-icon ms-disclosure"
              onClick={() => toggleDetails(match.id)}
              aria-expanded={open}
              aria-controls={`${regionId}-detail-${match.id}`}
              aria-label={`${open ? "Згорнути" : "Розгорнути"} матч: ${match.team1} — ${match.team2}`}
            >
              <ChevronDown size={17} className={open ? "ms-rotate" : ""} />
            </button>
          </div>
        </div>
        {open && renderDetails(match)}
      </Fragment>
    );
  }

  function renderGroup(
    group: ReturnType<typeof groupSchedule>[number],
    sectionKey: string,
    index: number,
  ) {
    const key = `${sectionKey}:${group.key}`;
    const id = `${regionId}-${sectionKey}-group-${index}`;
    const isCollapsed = collapsed.has(key);
    return (
      <div
        className={`ms-group ${mode === "time" ? "ms-group--time" : ""}`}
        key={key}
      >
        {mode === "tournament" && (
          <h4>
            <button
              type="button"
              className="ms-group-title"
              onClick={() => toggleGroup(key)}
              aria-expanded={!isCollapsed}
              aria-controls={id}
            >
              <Trophy size={20} aria-hidden="true" />
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
          </h4>
        )}
        {(!isCollapsed || mode === "time") && (
          <div id={id}>{group.matches.map(renderMatch)}</div>
        )}
      </div>
    );
  }

  return (
    <div className="ms-page ms-page--compact-schedule">
      <header className="ms-hero msc-arena-hero">
        <div className="ms-hero-top">
          <div className="msc-hero-copy">
            <span className="msc-hero-eyebrow">
              MATCH SCHEDULE <span aria-hidden="true" />
            </span>
            <h1>Матчі</h1>
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
            <dt>
              <CalendarDays size={23} aria-hidden="true" /> Матчів на дату
            </dt>
            <dd className="ms-hero-matches">
              {dayMatches.length}
              <span>{dateLabel(filters.date)}</span>
            </dd>
          </div>
          <div>
            <dt>
              <Trophy size={23} aria-hidden="true" /> Турнірів
            </dt>
            <dd className="ms-hero-tournaments">
              {tournaments.length}
              <span>У розкладі</span>
            </dd>
          </div>
          <div>
            <dt>
              <Clock3 size={23} aria-hidden="true" /> Зараз грають
            </dt>
            <dd
              className={`ms-hero-live ${liveMatches > 0 ? "has-live-matches" : ""}`}
            >
              {liveMatches}
              <span>
                {liveMatches > 0 ? "Матчі наживо" : "Немає live-матчів"}
              </span>
            </dd>
          </div>
        </dl>
      </header>
      <div
        className={`ms-body ms-body--dense ms-body--sectioned msc-schedule msc-schedule--${density}`}
      >
        <div className="ms-dense-tools msc-toolbar">
          <h2 className="ms-dense-title">Розклад матчів</h2>
          <div className="msc-toolbar-view">
            <span className="msc-timezone">
              <Clock3 size={14} /> Час за Києвом
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="ms-button msc-view-trigger">
                  <Settings2 size={18} /> Вигляд <ChevronDown size={14} />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="msc-view-popover"
                align="end"
                aria-label="Вигляд розкладу"
              >
                <h3>Вигляд розкладу</h3>
                <fieldset>
                  <legend>Щільність рядків</legend>
                  <div
                    className="msc-view-options"
                    aria-label="Щільність розкладу"
                  >
                    <button
                      type="button"
                      aria-pressed={density === "comfortable"}
                      onClick={() => changeDensity("comfortable")}
                    >
                      Звичайний
                    </button>
                    <button
                      type="button"
                      aria-pressed={density === "compact"}
                      onClick={() => changeDensity("compact")}
                    >
                      Компактний
                    </button>
                  </div>
                </fieldset>
                <fieldset>
                  <legend>Групування матчів</legend>
                  <div className="msc-view-options" aria-label="Групування">
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
                </fieldset>
              </PopoverContent>
            </Popover>
          </div>
          <div className="ms-segment msc-personal" aria-label="Ваші позначки">
            {(
              [
                ["all", "Усі матчі"],
                ["liked", "Закріплені"],
                ["notes", "З нотатками"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filters.personal === value}
                onClick={() => changeFilters({ personal: value })}
              >
                {value === "liked" ? (
                  <Star size={15} />
                ) : value !== "all" ? (
                  <FileText size={15} />
                ) : null}
                {label}
                {value !== "all" && (
                  <span className="msc-personal-count">
                    {personalCounts[value]}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="ms-date-tools">
            <div
              className="ms-segment msc-date-shortcuts"
              aria-label="Швидкий вибір дати"
            >
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
            <div
              className="ms-segment msc-date-shortcuts msc-game-shortcuts"
              aria-label="Гра"
            >
              {(
                [
                  ["all", "Усі ігри"],
                  ["CS2", "CS2"],
                  ["Dota2", "Dota 2"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filters.game === value}
                  onClick={() =>
                    changeFilters({ game: value, tournament: "all" })
                  }
                >
                  {label}
                  <span className="msc-game-count">{gameCounts[value]}</span>
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
            <div className="ms-columns msc-columns" aria-hidden="true">
              <span>Час</span>
              <span>Матч</span>
              <span>Турнір</span>
              <span title="Прогноз джерела, не гарантія результату">
                Прогноз джерела <Info size={13} aria-hidden="true" />
              </span>
              <span>Коеф.</span>
              <span>Позначки</span>
              <span>Додати запис</span>
              <span />
            </div>
            {sections.map((section) => (
              <Fragment key={section.key}>
                <section
                  className={`ms-status-section ms-status-section--${section.key}`}
                  aria-labelledby={`${regionId}-section-${section.key}`}
                >
                  <h3
                    className="ms-status-title"
                    id={`${regionId}-section-${section.key}`}
                  >
                    {section.key === "live" ? (
                      <span className="ms-status-dot" aria-hidden="true" />
                    ) : section.key === "upcoming" ? (
                      <Clock3 size={17} aria-hidden="true" />
                    ) : section.key === "finished" ? (
                      <Check size={17} aria-hidden="true" />
                    ) : (
                      <Info size={17} aria-hidden="true" />
                    )}
                    {section.title}
                    <span className="ms-status-count" aria-hidden="true">
                      {section.total}
                    </span>
                  </h3>
                  {groupSchedule(section.matches, mode).map((group, index) =>
                    renderGroup(group, section.key, index),
                  )}
                </section>
                {section.key === adAfterSection && (
                  <ScheduleAdvertisement {...advertising} />
                )}
              </Fragment>
            ))}
          </>
        )}
        <p className="msc-comparison-hint">
          <Info size={15} aria-hidden="true" /> Прогноз і коефіцієнт розташовані
          навпроти відповідної команди.
        </p>
        <footer className="ms-footer">
          <span>
            <Info size={15} /> Показано {Math.min(visibleLimit, visible.length)}{" "}
            із {matchCount(visible.length)}
          </span>
          {visible.length > visibleLimit && (
            <button
              type="button"
              className="ms-button msc-more"
              onClick={() => setVisibleLimit((limit) => limit + 20)}
            >
              Показати ще <ChevronDown size={16} />
            </button>
          )}
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
