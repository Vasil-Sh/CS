import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Download,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  FileSpreadsheet,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatedNumber, SwapPill } from "@/components/analytics/TelegramDashboard";
import { ALL_STATUSES, useRiskyTeams, type RiskyTeam } from "@/hooks/useRiskyTeams";
import { proxyLogoUrl } from "@/lib/logoProxy";
import "@/components/analytics/TelegramDashboard.css";
import "@/components/SwapPill.css";
import "./RiskyTeamsScreen.css";

type Game = "all" | "CS" | "Дота";

const GUIDE_KEY = "matchiq_risk_guide_collapsed";
const readGuideCollapsed = () => {
  try {
    return window.localStorage.getItem(GUIDE_KEY) === "1";
  } catch {
    return false;
  }
};
type Sort = "risk" | "name" | "name-desc" | "game" | "game-dota";

/** Status scale, most dangerous first. `key` drives the colour classes. */
const STATUS = [
  { id: "БАН", key: "ban", short: "БАН", text: "Не розглядати для ставки взагалі." },
  { id: "Ризиковані", key: "risky", short: "Ризиковані", text: "Високий ризик — ставити дуже обережно." },
  { id: "Нестабільні", key: "unstable", short: "Нестабільні", text: "Лише за конкретним сценарієм." },
  { id: "Обережно", key: "caution", short: "Обережно", text: "Зверніть увагу на поточну форму." },
  { id: "Під питанням", key: "question", short: "Під питанням", text: "Перевірте свіжі результати перед ставкою." },
  { id: "Неоцінена", key: "unrated", short: "Неоцінені", text: "Поки недостатньо даних для оцінки." },
  { id: "Стабільні", key: "stable", short: "Стабільні", text: "Передбачуваний результат." },
  { id: "Надійна", key: "reliable", short: "Надійні", text: "Доведена позитивна динаміка." },
] as const;
type StatusMeta = (typeof STATUS)[number];
const STATUS_BY_ID = new Map<string, StatusMeta>(STATUS.map((s) => [s.id, s]));
const RANK = new Map<string, number>(STATUS.map((s, i) => [s.id, i]));

const statusOf = (team: RiskyTeam) => team.status || "Неоцінена";
const metaOf = (status: string) => STATUS_BY_ID.get(status) ?? STATUS_BY_ID.get("Неоцінена")!;
const gameLabel = (game: string) => (game === "Дота" ? "Dota 2" : "CS2");
const isSheetUrl = (url: string) => url.includes("spreadsheets/d/");
const countFmt = (n: number) => String(n);

function plural(n: number, one: string, few: string, many: string) {
  const a = n % 10;
  const b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
}

function initialsOf(name: string) {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const letters =
    words.length > 1 ? words[0][0] + words[1][0] : (words[0] || "?").slice(0, 2);
  return letters.toUpperCase();
}

function TeamAvatar({ team }: { team: RiskyTeam }) {
  const [state, setState] = useState<"loading" | "ok" | "failed">("loading");
  const src = team.logo ? proxyLogoUrl(team.logo, team.game) : null;
  const showLogo = !!src && state !== "failed";
  return (
    <span
      className={`mqt-avatar is-md mqr-avatar${showLogo && state === "ok" ? " has-logo" : ""}`}
      aria-hidden="true"
    >
      {/* Initials only while there is no logo: transparent logos must not show them through */}
      {!(showLogo && state === "ok") && initialsOf(team.name)}
      {showLogo && (
        <img
          src={src}
          alt=""
          loading="lazy"
          onLoad={(e) => setState(e.currentTarget.naturalWidth > 1 ? "ok" : "failed")}
          onError={() => setState("failed")}
          style={state === "ok" ? undefined : { opacity: 0 }}
        />
      )}
    </span>
  );
}

/** Note clamped to two lines; a click (or Enter) opens the full text when it is cut. */
function NoteCell({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [cut, setCut] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const measure = () => setCut(el.scrollHeight > el.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, open]);

  if (!text) {
    return <span className="mqr-col-note mqr-note is-empty">Нотатку ще не додано</span>;
  }
  const clickable = cut || open;
  return (
    <span className="mqr-col-note">
      <span
        ref={ref}
        className={`mqr-note${open ? " is-open" : ""}${clickable ? " is-clickable" : ""}`}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-expanded={clickable ? open : undefined}
        title={clickable ? (open ? "Згорнути" : "Показати повністю") : undefined}
        onClick={() => clickable && setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (clickable && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
      >
        {text}
      </span>
    </span>
  );
}

function StatusBadge({ status, small = false }: { status: string; small?: boolean }) {
  const meta = metaOf(status);
  return (
    <span className={`mqr-status is-${meta.key}${small ? " is-sm" : ""}`}>
      <i aria-hidden="true" />
      {status}
    </span>
  );
}

function GameBadge({ game }: { game: string }) {
  return (
    <span className="mqt-chip">
      <i className={`mqr-game-mark ${game === "Дота" ? "is-dota2" : "is-cs2"}`} aria-hidden="true" />
      {gameLabel(game)}
    </span>
  );
}

/** Game toggle used inside the add/edit form. */
function GamePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="mqt-seg mqr-game-pick" role="group" aria-label="Гра">
      {(
        [
          ["CS", "CS2"],
          ["Дота", "Dota 2"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={(value || "CS") === id}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Eight status tiles backed by real radio inputs. */
function StatusPicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const current = value || "Неоцінена";
  return (
    <>
      <div className="mqr-options" role="radiogroup" aria-label="Статус">
        {ALL_STATUSES.map((id) => {
          const meta = metaOf(id);
          return (
            <label key={id} className={`mqr-option is-${meta.key}${current === id ? " is-on" : ""}`}>
              <input
                type="radio"
                name={name}
                value={id}
                checked={current === id}
                onChange={() => onChange(id)}
              />
              <i aria-hidden="true" />
              {id}
            </label>
          );
        })}
      </div>
      <p className={`mqr-option-hint is-${metaOf(current).key}`}>
        <i aria-hidden="true" />
        <span>
          <b>{current}</b> — {metaOf(current).text.charAt(0).toLowerCase() + metaOf(current).text.slice(1)}
        </span>
      </p>
    </>
  );
}

export default function RiskRegistry() {
  const h = useRiskyTeams();
  const [game, setGame] = useState<Game>("all");
  const [status, setStatus] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("risk");
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideCollapsed, setGuideCollapsed] = useState(readGuideCollapsed);
  const toggleGuide = () =>
    setGuideCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(GUIDE_KEY, next ? "1" : "0");
      } catch {
        /* storage unavailable — keep it in memory only */
      }
      return next;
    });
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const all = h.riskyTeams;
  const scoped = useMemo(
    () => (game === "all" ? all : all.filter((t) => t.game === game)),
    [all, game],
  );
  const counts = useMemo(() => {
    const out = new Map<string, number>();
    for (const t of scoped) {
      const s = metaOf(statusOf(t)).id;
      out.set(s, (out.get(s) || 0) + 1);
    }
    return out;
  }, [scoped]);
  const count = (id: string) => counts.get(id) || 0;

  const rows = useMemo(() => {
    const q = h.searchQuery.toLowerCase().trim();
    const byName = (a: RiskyTeam, b: RiskyTeam) => a.name.localeCompare(b.name, "uk");
    const first = (g: string) => (t: RiskyTeam) => (t.game === g ? 0 : 1);
    return scoped
      .filter(
        (t) =>
          (status === "all" || metaOf(statusOf(t)).id === status) &&
          (!q ||
            [t.name, t.game, t.status, t.notes].some((v) =>
              (v || "").toLowerCase().includes(q),
            )),
      )
      .sort((a, b) => {
        switch (sort) {
          case "name":
            return byName(a, b);
          case "name-desc":
            return byName(b, a);
          case "game":
            return first("CS")(a) - first("CS")(b) || byName(a, b);
          case "game-dota":
            return first("Дота")(a) - first("Дота")(b) || byName(a, b);
          default:
            return (
              (RANK.get(metaOf(statusOf(a)).id) ?? 99) -
                (RANK.get(metaOf(statusOf(b)).id) ?? 99) || byName(a, b)
            );
        }
      });
  }, [scoped, status, sort, h.searchQuery]);

  const ban = count("БАН");
  const careful = count("Ризиковані") + count("Нестабільні") + count("Обережно");
  const safe = count("Стабільні") + count("Надійна");
  const loading = h.isLoadingTeams;
  const filtered = all.length > 0 && rows.length === 0;

  const resetFilters = () => {
    h.setSearchQuery("");
    setGame("all");
    setStatus("all");
  };

  const deleteTeam = deleteTarget !== null ? all[deleteTarget] : null;
  const sheetUrl = h.customSheetUrl.trim();

  const closeButton = (light = false) => (
    <DialogClose className={`mqt-dialog-close${light ? " is-light" : ""}`} aria-label="Закрити">
      <X size={18} strokeWidth={1.8} aria-hidden="true" />
    </DialogClose>
  );

  return (
    <div className="mqt-screen mqr-screen">
      {/* ===== Hero ===== */}
      <section className="mqp-hero is-photo is-compact mqr-hero" aria-label="Ризиковані команди">
        <header className="mqp-heading">
          <div>
            <p className="mqp-eyebrow">
              <i aria-hidden="true" />
              Дисципліна
            </p>
            <h1>Ризиковані команди</h1>
          </div>
        </header>
        <p className="mqt-hero-copy">
          Ваші правила щодо команд: на кого не ставити, з ким обережно, кому
          можна довіряти. Перевіряйте перед кожною ставкою.
        </p>
        <div className="mqr-hero-actions">
          <SwapPill
            label="Додати команду"
            onClick={() => h.setIsAddTeamOpen(true)}
            icon={<Plus size={16} strokeWidth={2.2} />}
          />
          <button
            type="button"
            className="mqp-btn-outline is-sm mqr-glass"
            onClick={() => h.setIsSheetsGuideOpen(true)}
          >
            <FileSpreadsheet size={17} strokeWidth={1.8} aria-hidden="true" />
            Імпорт із Google Sheets
          </button>
        </div>
      </section>

      {/* ===== Overview: spectrum + status filter ===== */}
      <section className="mqp-sheet mqr-overview" aria-labelledby="mqr-overview-title">
        <div className="mqr-overview-head">
          <div>
            <p className="mqp-kicker">
              <i>01</i> Огляд реєстру
            </p>
            <h2 id="mqr-overview-title" className="mqr-total">
              <strong>{loading ? "…" : <AnimatedNumber value={scoped.length} format={countFmt} />}</strong>
              <span>{plural(scoped.length, "команда", "команди", "команд")}</span>
            </h2>
          </div>
          <p className="mqr-summary">
            {all.length === 0
              ? "Реєстр порожній. Додайте команди вручну або імпортуйте свій список із Google Sheets."
              : `${ban} у бані, ${careful} ${plural(careful, "потребує", "потребують", "потребують")} обережності, ${safe} — стабільні або надійні. Натисніть на статус, щоб відфільтрувати список.`}
          </p>
        </div>

        {scoped.length > 0 && (
          <div
            className="mqr-spectrum"
            role="img"
            aria-label={`Розподіл за статусами: ${STATUS.map((s) => `${s.short} ${count(s.id)}`).join(", ")}`}
          >
            {STATUS.filter((s) => count(s.id) > 0).map((s) => (
              <span key={s.id} className={`is-${s.key}`} style={{ flexGrow: count(s.id) } as CSSProperties} />
            ))}
          </div>
        )}

        <div className="mqr-legend" role="group" aria-label="Фільтр за статусом">
          {[{ id: "all", key: "all", short: "Усі" } as const, ...STATUS].map((s) => {
            const n = s.id === "all" ? scoped.length : count(s.id);
            const on = status === s.id;
            return (
              <button
                key={s.id}
                type="button"
                className={`mqr-legend-btn is-${s.key}${on ? " is-on" : ""}${n === 0 && !on ? " is-zero" : ""}`}
                aria-pressed={on}
                onClick={() => setStatus(on && s.id !== "all" ? "all" : s.id)}
              >
                <i aria-hidden="true" />
                {s.short}
                <b>{loading ? "…" : <AnimatedNumber value={n} format={countFmt} />}</b>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mqt-grid">
        {/* ===== Registry ===== */}
        <section className="mqp-sheet mqt-ledger" aria-labelledby="mqr-list-title">
          <div className="mqp-sec-head">
            <div>
              <p className="mqp-kicker">
                <i>02</i> Реєстр
              </p>
              <h2 id="mqr-list-title">Команди</h2>
              <p className="mqr-shown">
                {rows.length} з {all.length} {plural(all.length, "запису", "записів", "записів")}
              </p>
            </div>
            <div className="mqt-seg mqr-games" role="group" aria-label="Гра">
              {(
                [
                  ["all", "Усі", all.length],
                  ["CS", "CS2", h.teamStats.csCount],
                  ["Дота", "Dota 2", h.teamStats.dotaCount],
                ] as const
              ).map(([id, label, n]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={game === id}
                  onClick={() => setGame(id)}
                >
                  {label}
                  <small>{n}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="mqt-toolbar">
            <label className="mqt-search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                aria-label="Знайти команду або нотатку"
                placeholder="Знайти команду або нотатку"
                value={h.searchQuery}
                onChange={(e) => h.setSearchQuery(e.target.value)}
              />
            </label>
            <div className="mqt-sort">
              <span id="mqr-sort-label">Сортувати</span>
              <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                <SelectTrigger className="mqt-select" aria-labelledby="mqr-sort-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={6} className="mqt-select-menu">
                  <SelectItem value="risk">Найвищий ризик</SelectItem>
                  <SelectItem value="name">За назвою (А–Я)</SelectItem>
                  <SelectItem value="name-desc">За назвою (Я–А)</SelectItem>
                  <SelectItem value="game">CS2 спочатку</SelectItem>
                  <SelectItem value="game-dota">Dota 2 спочатку</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!loading && rows.length > 0 ? (
            <div className="mqt-list">
              <div className="mqr-row is-head" aria-hidden="true">
                <span>Команда</span>
                <span className="mqr-col-game">Гра</span>
                <span className="mqr-col-status">Статус</span>
                <span className="mqr-col-note">Ваша нотатка</span>
                <span />
              </div>
              <ul>
                {rows.map((team) => {
                  const index = all.indexOf(team);
                  const st = statusOf(team);
                  return (
                    <li
                      key={`${team.name}-${index}`}
                      className={`mqr-row${metaOf(st).key === "ban" ? " is-ban" : ""}`}
                    >
                      <span className="mqt-group">
                        <TeamAvatar team={team} />
                        <span className="mqt-group-copy">
                          <button
                            type="button"
                            className="mqt-name"
                            aria-haspopup="dialog"
                            onClick={() => h.startEditing(index, team)}
                          >
                            {team.name}
                          </button>
                          <span className="mqr-sub">
                            <small>{gameLabel(team.game)}</small>
                            <StatusBadge status={st} small />
                          </span>
                        </span>
                      </span>
                      <span className="mqr-col-game">
                        <GameBadge game={team.game} />
                      </span>
                      <span className="mqr-col-status">
                        <StatusBadge status={st} />
                      </span>
                      <NoteCell text={team.notes} />
                      <span className="mqt-actions">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="mqt-icon-btn"
                              aria-label={`Дії команди ${team.name}`}
                            >
                              <MoreVertical size={20} aria-hidden="true" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="mqt-menu">
                            <DropdownMenuItem onSelect={() => h.startEditing(index, team)}>
                              <Pencil size={16} aria-hidden="true" /> Редагувати
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="is-danger"
                              onSelect={() => setDeleteTarget(index)}
                            >
                              <Trash2 size={16} aria-hidden="true" /> Видалити
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="mqt-empty">
              <strong>
                {loading
                  ? "Завантажуємо реєстр…"
                  : filtered
                    ? "Нічого не знайдено"
                    : "Реєстр поки порожній"}
              </strong>
              {!loading && (
                <p>
                  {filtered
                    ? "Змініть статус, гру або пошуковий запит."
                    : "Позначте команди, на які не варто ставити або з якими треба бути обережним, — MatchIQ нагадає про них перед ставкою."}
                </p>
              )}
              {!loading &&
                (filtered ? (
                  <button type="button" className="mqp-btn-outline is-sm" onClick={resetFilters}>
                    Скинути фільтри
                  </button>
                ) : (
                  <div className="mqr-empty-actions">
                    <SwapPill
                      label="Додати першу команду"
                      onClick={() => h.setIsAddTeamOpen(true)}
                      icon={<Plus size={16} strokeWidth={2.2} />}
                    />
                    <button
                      type="button"
                      className="mqp-btn-outline is-sm"
                      onClick={() => h.setIsSheetsGuideOpen(true)}
                    >
                      Імпортувати з Google Sheets
                    </button>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* ===== Status guide (collapses into a rail, like Telegram) ===== */}
        <aside
          className={`mqt-guide mqr-guide${guideCollapsed ? " is-collapsed" : ""}`}
          aria-labelledby="mqr-guide-title"
        >
          <div className="mqt-guide-head">
            <div className="mqt-guide-titles">
              <p className="mqp-kicker">
                <i>03</i> Шкала статусів
              </p>
              <h2 id="mqr-guide-title">Як читати статус</h2>
            </div>
            <button
              type="button"
              className="mqt-guide-toggle"
              aria-expanded={!guideCollapsed}
              aria-controls="mqr-guide-body"
              aria-label={guideCollapsed ? "Розгорнути шкалу статусів" : "Згорнути шкалу статусів"}
              title={guideCollapsed ? "Розгорнути" : "Згорнути"}
              onClick={toggleGuide}
            >
              <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
          <div
            className="mqt-guide-reveal"
            id="mqr-guide-body"
            aria-hidden={guideCollapsed}
            inert={guideCollapsed}
          >
            <div className="mqt-guide-body">
              <ol id="mqr-guide-list">
                {(guideOpen ? STATUS : STATUS.slice(0, 3)).map((s) => (
                  <li key={s.id} className={`is-${s.key}`}>
                    <i aria-hidden="true" />
                    <span>
                      <strong>{s.id}</strong>
                      <small>{s.text}</small>
                    </span>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                className="mqr-guide-toggle"
                aria-expanded={guideOpen}
                aria-controls="mqr-guide-list"
                onClick={() => setGuideOpen((v) => !v)}
              >
                {guideOpen ? "Показати лише 3" : `Показати всі ${STATUS.length} статусів`}
              </button>
              <div className="mqr-guide-note">
                <span className="mqr-guide-icon">
                  <ShieldCheck size={17} strokeWidth={2} aria-hidden="true" />
                </span>
                <span>
                  <strong>Працює перед ставкою</strong>
                  <small>
                    Команди з реєстру позначаються в Матчах і у формі запису разом
                    із вашою нотаткою.
                  </small>
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <p className="mqt-footnote">
        Статуси — ваші особисті оцінки й не гарантують результату. MatchIQ не
        приймає ставки. 18+.
      </p>

      {/* ===== Add team ===== */}
      <Dialog open={h.isAddTeamOpen} onOpenChange={h.setIsAddTeamOpen}>
        <DialogContent hideCloseButton className="mqt-dialog">
          <div className="mqt-dialog-head">
            <div className="mqt-dialog-titles">
              <p className="mqt-dialog-kicker">Реєстр команд</p>
              <DialogTitle>Додати команду</DialogTitle>
              <DialogDescription>
                Команда з’явиться в реєстрі й позначатиметься в Матчах перед ставкою.
              </DialogDescription>
            </div>
            {closeButton()}
          </div>
          <form
            id="mqr-add-form"
            className="mqt-dialog-body"
            onSubmit={(e) => {
              e.preventDefault();
              if (!h.newTeam.name.trim()) return;
              h.addRiskyTeam();
              h.setIsAddTeamOpen(false);
            }}
          >
            <div className="mqr-field-row">
              <div className="mqt-field">
                <label htmlFor="mqr-new-name">Назва команди *</label>
                <input
                  id="mqr-new-name"
                  required
                  autoComplete="off"
                  placeholder="Наприклад, Team Spirit"
                  value={h.newTeam.name}
                  onChange={(e) => h.setNewTeam({ ...h.newTeam, name: e.target.value })}
                />
              </div>
              <fieldset className="mqt-field">
                <legend>Гра *</legend>
                <GamePicker
                  value={h.newTeam.game}
                  onChange={(v) => h.setNewTeam({ ...h.newTeam, game: v })}
                />
              </fieldset>
            </div>
            <fieldset className="mqt-field">
              <legend>Статус *</legend>
              <StatusPicker
                name="mqr-new-status"
                value={h.newTeam.status}
                onChange={(v) => h.setNewTeam({ ...h.newTeam, status: v })}
              />
            </fieldset>
            <div className="mqt-field">
              <label htmlFor="mqr-new-notes">
                Нотатка <span className="mqr-optional">необов’язково</span>
              </label>
              <textarea
                id="mqr-new-notes"
                rows={3}
                placeholder="Наприклад: тільки на +1.5, у фіналах часто вимикаються"
                value={h.newTeam.notes}
                onChange={(e) => h.setNewTeam({ ...h.newTeam, notes: e.target.value })}
              />
            </div>
          </form>
          <div className="mqt-dialog-foot">
            {!h.newTeam.name.trim() && (
              <span className="mqr-foot-hint">Кнопка стане активною після назви</span>
            )}
            <button
              type="button"
              className="mqt-btn-outline"
              onClick={() => h.setIsAddTeamOpen(false)}
            >
              Скасувати
            </button>
            <SwapPill
              type="submit"
              form="mqr-add-form"
              disabled={!h.newTeam.name.trim()}
              label="Додати команду"
              icon={<Plus size={16} strokeWidth={2.2} />}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Edit team ===== */}
      <Dialog open={h.editingIndex !== null} onOpenChange={(open) => !open && h.cancelEditing()}>
        <DialogContent hideCloseButton className="mqt-dialog">
          <div className="mqt-dialog-head">
            <div className="mqt-dialog-titles">
              <p className="mqt-dialog-kicker">Реєстр команд</p>
              <DialogTitle>Редагувати команду</DialogTitle>
              <DialogDescription>
                Оновіть статус або нотатку — зміни одразу з’являться в Матчах.
              </DialogDescription>
            </div>
            {closeButton()}
          </div>
          <form
            id="mqr-edit-form"
            className="mqt-dialog-body"
            onSubmit={(e) => {
              e.preventDefault();
              if (h.editName.trim()) h.saveEditing();
            }}
          >
            <div className="mqr-field-row">
              <div className="mqt-field">
                <label htmlFor="mqr-edit-name">Назва команди *</label>
                <input
                  id="mqr-edit-name"
                  required
                  autoComplete="off"
                  placeholder="Наприклад, Team Spirit"
                  value={h.editName}
                  onChange={(e) => h.setEditName(e.target.value)}
                />
              </div>
              <fieldset className="mqt-field">
                <legend>Гра *</legend>
                <GamePicker value={h.editGame} onChange={h.setEditGame} />
              </fieldset>
            </div>
            <fieldset className="mqt-field">
              <legend>Статус *</legend>
              <StatusPicker name="mqr-edit-status" value={h.editStatus} onChange={h.setEditStatus} />
            </fieldset>
            <div className="mqt-field">
              <label htmlFor="mqr-edit-notes">
                Нотатка <span className="mqr-optional">необов’язково</span>
              </label>
              <textarea
                id="mqr-edit-notes"
                rows={3}
                placeholder="Наприклад: тільки на +1.5, у фіналах часто вимикаються"
                value={h.editNotes}
                onChange={(e) => h.setEditNotes(e.target.value)}
              />
            </div>
          </form>
          <div className="mqt-dialog-foot">
            <button type="button" className="mqt-btn-outline" onClick={h.cancelEditing}>
              Скасувати
            </button>
            <SwapPill
              type="submit"
              form="mqr-edit-form"
              disabled={!h.editName.trim()}
              label="Зберегти зміни"
              icon={<Check size={16} strokeWidth={2.2} />}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Delete team ===== */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent hideCloseButton role="alertdialog" className="mqt-dialog is-narrow">
          <div className="mqt-dialog-body is-delete">
            <div className="mqt-delete-top">
              <span className="mqt-delete-icon">
                <Trash2 size={22} strokeWidth={1.8} aria-hidden="true" />
              </span>
              {closeButton(true)}
            </div>
            <div>
              <p className="mqt-dialog-kicker is-danger">Видалення</p>
              <DialogTitle>Видалити команду?</DialogTitle>
            </div>
            {deleteTeam && (
              <div className="mqt-delete-card">
                <TeamAvatar team={deleteTeam} />
                <span>
                  <strong>{deleteTeam.name}</strong>
                  <span className="mqr-sub is-always">
                    <small>{gameLabel(deleteTeam.game)}</small>
                    <StatusBadge status={statusOf(deleteTeam)} small />
                  </span>
                </span>
              </div>
            )}
            <DialogDescription className="mqt-danger-text">
              Команду й вашу нотатку буде видалено з реєстру. Дію неможливо скасувати.
            </DialogDescription>
          </div>
          <div className="mqt-dialog-foot">
            <button type="button" className="mqt-btn-outline" onClick={() => setDeleteTarget(null)}>
              Скасувати
            </button>
            <button
              type="button"
              className="mqt-btn-danger"
              onClick={() => {
                if (deleteTarget !== null) h.deleteRiskyTeam(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
              Видалити команду
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Import from Google Sheets ===== */}
      <Dialog open={h.isSheetsGuideOpen} onOpenChange={h.setIsSheetsGuideOpen}>
        <DialogContent hideCloseButton className="mqt-dialog mqr-import">
          <div className="mqt-dialog-head">
            <div className="mqt-dialog-titles">
              <p className="mqt-dialog-kicker">Реєстр команд</p>
              <DialogTitle>Імпорт із Google Sheets</DialogTitle>
              <DialogDescription>
                Підтягніть свій список команд із таблиці за чотири кроки.
              </DialogDescription>
            </div>
            {closeButton()}
          </div>
          <div className="mqt-dialog-body mqr-import-body">
            <ol className="mqr-steps">
              <li>
                <b>1</b>
                <span>
                  <strong>Створіть таблицю</strong>
                  <small>Новий документ у Google Sheets з будь-якою назвою.</small>
                </span>
              </li>
              <li>
                <b>2</b>
                <span>
                  <strong>Заповніть дві колонки</strong>
                  <span className="mqr-sheet" role="table" aria-label="Приклад таблиці">
                    <span className="mqr-sheet-row is-head" role="row">
                      <span role="columnheader">A · Команда</span>
                      <span role="columnheader">B · Статус, гра, нотатка</span>
                    </span>
                    {[
                      ["Vitality", "🟩", "CS: У фіналах часто вимикаються"],
                      ["Team Spirit", "🟨", "Dota2: Тільки на +1.5"],
                      ["Virtus Pro", "🟥", "CS: Рідко на них ставити"],
                    ].map(([team, mark, text]) => (
                      <span className="mqr-sheet-row" role="row" key={team}>
                        <span role="cell">{team}</span>
                        <span role="cell">
                          <span className="mqr-emoji">{mark}</span> {text}
                        </span>
                      </span>
                    ))}
                  </span>
                  <small>
                    Колонка B починається з кольорового квадрата — він задає статус.
                    Далі гра (<code>CS:</code> або <code>Dota2:</code>) і ваша нотатка.
                  </small>
                  <span className="mqr-keys" aria-label="Відповідність квадратів статусам">
                    {[
                      ["🟥", "БАН"],
                      ["🟧", "Ризиковані"],
                      ["🟨", "Під питанням"],
                      ["🟦", "Стабільні"],
                      ["🟩", "Надійна"],
                      ["⬜", "Неоцінена"],
                    ].map(([mark, label]) => (
                      <span key={label}>
                        <span className="mqr-emoji">{mark}</span>
                        {label}
                      </span>
                    ))}
                  </span>
                  <small>
                    Замість квадрата можна написати статус словом на початку
                    клітинки. Перший рядок може бути заголовком — його пропустимо.
                  </small>
                </span>
              </li>
              <li>
                <b>3</b>
                <span>
                  <strong>Відкрийте доступ</strong>
                  <small>«Поділитися» → «Усі, хто має посилання» → «Читач».</small>
                </span>
              </li>
              <li>
                <b className="is-accent">4</b>
                <span className="mqt-field">
                  <label htmlFor="mqr-sheet-url">Вставте посилання на таблицю</label>
                  <input
                    id="mqr-sheet-url"
                    inputMode="url"
                    autoComplete="off"
                    className={sheetUrl ? (isSheetUrl(sheetUrl) ? "is-ok" : "is-bad") : ""}
                    placeholder="https://docs.google.com/spreadsheets/d/…/edit"
                    value={h.customSheetUrl}
                    onChange={(e) => h.setCustomSheetUrl(e.target.value)}
                    aria-describedby="mqr-sheet-url-state"
                  />
                  <span id="mqr-sheet-url-state" aria-live="polite">
                    {sheetUrl &&
                      (isSheetUrl(sheetUrl) ? (
                        <span className="mqr-url-ok">
                          <Check size={16} strokeWidth={2} aria-hidden="true" />
                          Посилання правильне — завантажимо команди з цієї таблиці.
                        </span>
                      ) : (
                        <span className="mqr-url-bad">
                          Це не схоже на посилання Google Sheets. Скопіюйте повну
                          адресу з рядка браузера.
                        </span>
                      ))}
                  </span>
                </span>
              </li>
            </ol>
            <p className="mqr-warning">
              <AlertTriangle size={18} strokeWidth={1.8} aria-hidden="true" />
              <span>
                <b>Важливо:</b> імпорт замінить увесь поточний список даними з
                таблиці. Зміни, зроблені тут, буде перезаписано.
              </span>
            </p>
          </div>
          <div className="mqt-dialog-foot">
            <button
              type="button"
              className="mqt-btn-outline"
              onClick={() => h.setIsSheetsGuideOpen(false)}
            >
              Скасувати
            </button>
            <SwapPill
              disabled={h.isUpdating || (!!sheetUrl && !isSheetUrl(sheetUrl))}
              label={h.isUpdating ? "Завантаження…" : "Імпортувати список"}
              icon={
                h.isUpdating ? (
                  <RefreshCw size={16} strokeWidth={2.2} className="animate-spin" />
                ) : (
                  <Download size={16} strokeWidth={2.2} />
                )
              }
              onClick={() => {
                if (h.isUpdating || (sheetUrl && !isSheetUrl(sheetUrl))) return;
                h.updateFromGoogleSheets();
                h.setIsSheetsGuideOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
