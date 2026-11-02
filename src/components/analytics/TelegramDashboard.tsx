import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  Search,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
  BarChart3,
  Lock,
} from "lucide-react";
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
import "./TelegramDashboard.css";
import "@/components/SwapPill.css";

export interface TelegramChannel {
  id: string;
  name: string;
  link: string;
  comment: string;
  hasChannel: boolean;
  createdAt: string;
  _backendId?: string;
  game?: string;
}

export interface TelegramPick {
  groupId: string;
  date: string;
  result: string;
  profit: number;
  amount: number;
  game?: string;
}

export interface TelegramStats {
  groupId: string;
  totalBets: number;
  wins: number;
  losses: number;
  pending: number;
  winRate: number;
  totalProfit: number;
}

type Game = "all" | "cs2" | "dota2";
type GameId = Exclude<Game, "all">;

const number = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 });
export const money = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${number.format(Math.abs(value))} ₴`;
const tone = (value: number) =>
  value > 0 ? "is-up" : value < 0 ? "is-down" : "";
const settled = (bet: TelegramPick) =>
  bet.result === "Win" || bet.result === "Loss";
const totalProfit = (bets: TelegramPick[]) =>
  bets.filter(settled).reduce((sum, b) => sum + (Number(b.profit) || 0), 0);

export const GAME_LABEL: Record<GameId, string> = {
  cs2: "CS2",
  dota2: "Dota 2",
};

export function channelGames(
  group: TelegramChannel,
  bets: TelegramPick[],
): GameId[] {
  const games = new Set<GameId>();
  const add = (value: string) => {
    const g = value.toLowerCase();
    if (/(cs\s?2|counter[- ]?strike)/.test(g)) games.add("cs2");
    if (/dota\s?2/.test(g)) games.add("dota2");
  };
  // Explicit game field (comma-separated when a group covers both games).
  (group.game || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach(add);
  // Fallback: infer from name/comment/bets when no explicit game is set.
  if (games.size === 0) {
    add(`${group.name} ${group.comment}`);
    for (const b of bets.filter((b) => b.groupId === group.id)) {
      add(b.game || "");
    }
  }
  return [...games];
}

/** "@handle" from a t.me link, or "" when there is none. */
export function tgHandle(link: string): string {
  const match = (link || "").match(/t\.me\/(?:s\/)?([^/\s?#]+)/);
  return match ? "@" + match[1] : "";
}

const AVATAR_TONES = [
  ["#ff693b", "#111213"],
  ["#171819", "#ffffff"],
  ["#e6e3da", "#171819"],
  ["#f1d6c9", "#8a2e10"],
  ["#2a2c2e", "#ffffff"],
] as const;

function initialsOf(name: string) {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] || "?").slice(0, 2);
  return letters.toUpperCase();
}

function toneOf(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

/** Channel photo from Telegram with an initials fallback. */
export function ChannelAvatar({
  group,
  size = "md",
}: {
  group: Pick<TelegramChannel, "name" | "link">;
  size?: "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const username = group.link.match(
    /(?:https?:\/\/)?t\.me\/(?:s\/)?([a-zA-Z][\w]{3,})\/?(?:[?#].*)?$/,
  )?.[1];
  const [bg, fg] = toneOf(group.name);
  return (
    <span
      className={`mqt-avatar is-${size}`}
      style={{ background: bg, color: fg }}
      aria-hidden="true"
    >
      {initialsOf(group.name)}
      {username && !failed && (
        <img
          src={`https://t.me/i/userpic/320/${username}.jpg`}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth <= 1) setFailed(true);
          }}
        />
      )}
    </span>
  );
}

export function GameChip({
  game,
  dark = false,
}: {
  game: GameId;
  dark?: boolean;
}) {
  return (
    <span className={`mqt-chip${dark ? " is-dark" : ""}`}>
      <i className={`is-${game}`} aria-hidden="true" />
      {GAME_LABEL[game]}
    </span>
  );
}

function Activity({ bets }: { bets: TelegramPick[] }) {
  const now = new Date();
  const bins = Array.from({ length: 12 }, (_, index) => {
    const day = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 11 + index,
    );
    const end = new Date(day);
    end.setDate(end.getDate() + 1);
    return bets.filter((b) => new Date(b.date) >= day && new Date(b.date) < end)
      .length;
  });
  const max = Math.max(...bins, 1);
  const total = bins.reduce((a, b) => a + b, 0);
  return (
    <span
      className="mqt-bars"
      role="img"
      aria-label={`${total} записів за останні 12 днів`}
    >
      {bins.map((count, i) => (
        <span
          key={i}
          style={{
            height: `${count ? 30 + (count / max) * 70 : 10}%`,
            opacity: count ? 0.55 + i / 26 : 0.18,
          }}
        />
      ))}
    </span>
  );
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Counts up from the previous value (0 on mount) to `value`, like the profile
 * metrics. Screen readers and tests read the final formatted value only.
 */
function AnimatedNumber({
  value,
  format,
  duration = 900,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
}) {
  const [shown, setShown] = useState(() =>
    prefersReducedMotion() ? value : 0,
  );
  const from = useRef(shown);

  useEffect(() => {
    if (prefersReducedMotion() || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const startValue = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(startValue + (value - startValue) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      from.current = value;
    };
  }, [value, duration]);

  return (
    <>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}

/** Orange landing pill: the arrow slides out, a twin slides in on hover. */
function SwapPill({
  label,
  onClick,
  className = "",
  type = "button",
  form,
  disabled = false,
  icon = <ArrowUpRight size={16} strokeWidth={2.2} />,
}: {
  label: string;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  form?: string;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      type={type}
      form={form}
      disabled={disabled}
      className={`mqt-pill ${className}`.trim()}
      onClick={onClick}
    >
      <span className="mqt-pill-in" aria-hidden="true">
        {icon}
      </span>
      <span className="mqt-pill-label">{label}</span>
      <span className="mqt-pill-out" aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}
export { SwapPill, AnimatedNumber };

const GUIDE_KEY = "matchiq_tg_guide_collapsed";
const readGuideCollapsed = () => {
  try {
    return window.localStorage.getItem(GUIDE_KEY) === "1";
  } catch {
    return false;
  }
};

const STEPS = [
  ["Додайте групу", "Назва, посилання на канал, гра та примітка для себе."],
  [
    "Збирайте прогнози",
    "Записи, прив'язані до групи, формують її статистику. Поки що додаються вручну.",
  ],
  [
    "Порівнюйте джерела",
    "Натисніть на групу — відкриється її статистика: перемоги, ROI, стабільність, прибуток по місяцях.",
  ],
];

const GAME_TABS: [Game, string][] = [
  ["all", "Усі ігри"],
  ["cs2", "CS2"],
  ["dota2", "Dota 2"],
];

export default function TelegramDashboard({
  groups,
  bets,
  stats,
  loaded,
  onAdd,
  onEdit,
  onDelete,
  onDetails,
  children,
}: {
  groups: TelegramChannel[];
  bets: TelegramPick[];
  stats: TelegramStats[];
  loaded: boolean;
  onAdd: () => void;
  onEdit: (group: TelegramChannel) => void;
  onDelete: (id: string) => void;
  onDetails: (id: string) => void;
  children?: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [game, setGame] = useState<Game>("all");
  const [sort, setSort] = useState<"default" | "win" | "profit">("default");
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

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/^@/, "");
    const rate = (id: string) => {
      const s = stats.find((x) => x.groupId === id);
      const done = (s?.wins || 0) + (s?.losses || 0);
      return done ? (s?.wins || 0) / done : 0;
    };
    const profit = (id: string) =>
      stats.find((x) => x.groupId === id)?.totalProfit || 0;
    return groups
      .filter((group) => {
        const text =
          `${group.name} ${group.link} ${group.comment}`.toLowerCase();
        return (
          text.includes(q) &&
          (game === "all" || channelGames(group, bets).includes(game))
        );
      })
      .sort((a, b) =>
        sort === "profit"
          ? profit(b.id) - profit(a.id)
          : sort === "win"
            ? rate(b.id) - rate(a.id)
            : 0,
      );
  }, [groups, bets, stats, search, game, sort]);

  const completed = bets.filter(settled);
  const wins = completed.filter((b) => b.result === "Win").length;
  const now = Date.now();
  const week = 7 * 86400000;
  const inWeek = (date: string) =>
    +new Date(date) >= now - week && +new Date(date) <= now;
  const recent = bets.filter((b) => inWeek(b.date));
  const newGroups = groups.filter((g) => inWeek(g.createdAt)).length;
  const profit = totalProfit(bets);
  const recentProfit = totalProfit(recent);

  const pct = completed.length ? Math.round((wins / completed.length) * 100) : 0;
  const metrics = [
    {
      label: "Групи",
      value: groups.length,
      format: (n: number) => number.format(n),
      empty: groups.length === 0,
      note: groups.length ? `+${newGroups}` : "",
      noteText: groups.length ? "за 7 днів" : "ще не додано",
      noteTone: newGroups ? "is-up" : "",
    },
    {
      label: "Прогнози",
      value: bets.length,
      format: (n: number) => number.format(n),
      empty: bets.length === 0,
      note: bets.length ? `+${recent.length}` : "",
      noteText: bets.length ? "за 7 днів" : "ще немає записів",
      noteTone: recent.length ? "is-up" : "",
    },
    {
      label: "Відсоток перемог",
      value: completed.length ? pct : null,
      format: (n: number) => `${n}%`,
      empty: completed.length === 0,
      note: completed.length ? `${wins} із ${completed.length}` : "",
      noteText: completed.length ? "завершених" : "немає завершених ставок",
      noteTone: "",
    },
    {
      label: "Прибуток",
      value: profit,
      format: money,
      empty: bets.length === 0,
      tone: tone(profit),
      note: bets.length ? money(recentProfit) : "",
      noteText: bets.length ? "за 7 днів" : "за весь час",
      noteTone: tone(recentProfit),
    },
  ];

  return (
    <div className="mqt-screen">
      <section
        className="mqp-hero is-photo is-compact mqt-hero"
        aria-label="Telegram-групи"
      >
        <header className="mqp-heading">
          <div>
            <p className="mqp-eyebrow">
              <i aria-hidden="true" />
              Інтеграції
            </p>
            <h1>Telegram-групи</h1>
          </div>
        </header>
        <p className="mqt-hero-copy">
          Джерела ваших прогнозів в одному місці: відсоток перемог, прибуток і
          стабільність кожної групи за вашими записами.
        </p>
        <SwapPill
          className="mqt-hero-pill"
          label="Додати групу"
          onClick={onAdd}
          icon={<Plus size={16} strokeWidth={2.2} />}
        />
      </section>

      <section
        className="mqt-metrics"
        aria-label="Загальна статистика Telegram-груп"
      >
        {metrics.map((m) => (
          <article className="mqt-metric" key={m.label}>
            <span className="mqt-metric-label">{m.label}</span>
            <strong
              className={`mqt-metric-num ${m.empty ? "is-empty" : (m.tone ?? "")}`}
            >
              {!loaded ? (
                "…"
              ) : m.value === null ? (
                "—"
              ) : (
                <AnimatedNumber value={m.value} format={m.format} />
              )}
            </strong>
            <span className="mqt-metric-note">
              {m.note && <b className={m.noteTone}>{m.note}</b>} {m.noteText}
            </span>
          </article>
        ))}
      </section>

      <div className="mqt-grid">
        <section className="mqp-sheet mqt-ledger" aria-labelledby="mqt-groups-title">
          <div className="mqp-sec-head">
            <div>
              <p className="mqp-kicker">
                <i>01</i> Джерела
              </p>
              <h2 id="mqt-groups-title">Ваші групи</h2>
            </div>
            <div className="mqt-seg" role="group" aria-label="Гра">
              {GAME_TABS.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={game === id}
                  onClick={() => setGame(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mqt-toolbar">
            <label className="mqt-search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                aria-label="Пошук групи"
                placeholder="Пошук за назвою або @нікнеймом"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="mqt-sort">
              <span id="mqt-sort-label">Сортувати</span>
              <Select
                value={sort}
                onValueChange={(v) => setSort(v as typeof sort)}
              >
                <SelectTrigger
                  className="mqt-select"
                  aria-labelledby="mqt-sort-label"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={6}
                  className="mqt-select-menu"
                >
                  <SelectItem value="default">Як додано</SelectItem>
                  <SelectItem value="win">Відсоток перемог</SelectItem>
                  <SelectItem value="profit">Прибуток</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {visible.length > 0 ? (
            <div className="mqt-list">
              <div className="mqt-row is-head" aria-hidden="true">
                <span>Група</span>
                <span className="mqt-col-games">Гра</span>
                <span className="mqt-col-act">12 днів</span>
                <span className="mqt-col-win">Перемоги</span>
                <span className="mqt-col-profit">Прибуток</span>
                <span />
              </div>
              <ul>
                {visible.map((group) => {
                  const s = stats.find((item) => item.groupId === group.id);
                  const picks = bets.filter((b) => b.groupId === group.id);
                  const games = channelGames(group, bets);
                  const done = (s?.wins || 0) + (s?.losses || 0);
                  const handle = tgHandle(group.link);
                  const last = picks
                    .map((b) => +new Date(b.date))
                    .filter(Number.isFinite)
                    .sort((a, b) => b - a)[0];
                  const groupProfit = s?.totalProfit || 0;
                  return (
                    <li
                      key={group.id}
                      className="mqt-row"
                      onClick={() => onDetails(group.id)}
                    >
                      <span className="mqt-group">
                        <ChannelAvatar group={group} />
                        <span className="mqt-group-copy">
                          <span className="mqt-group-line">
                            <button
                              type="button"
                              className="mqt-name"
                              aria-haspopup="dialog"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDetails(group.id);
                              }}
                            >
                              {group.name}
                            </button>
                            {group.hasChannel && (
                              <span
                                className="mqt-lock"
                                title="Є приватний платний канал"
                              >
                                <Lock size={13} strokeWidth={2} aria-hidden="true" />
                                <span className="sr-only">Є приватний канал</span>
                              </span>
                            )}
                          </span>
                          <small>
                            {handle || "Без посилання"} ·{" "}
                            {last
                              ? `запис ${new Date(last).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}`
                              : "ще немає записів"}
                          </small>
                        </span>
                      </span>
                      <span className="mqt-col-games mqt-games">
                        {games.length ? (
                          games.map((g) => <GameChip key={g} game={g} />)
                        ) : (
                          <span className="mqt-muted" title="Гру ще не вказано">
                            —
                          </span>
                        )}
                      </span>
                      <span className="mqt-col-act">
                        <Activity bets={picks} />
                      </span>
                      <span className="mqt-col-win mqt-win">
                        <strong>
                          {done ? `${Math.round(((s?.wins || 0) / done) * 100)}%` : "—"}
                        </strong>
                        <small>{done ? `${s?.wins || 0} із ${done}` : "немає"}</small>
                      </span>
                      <strong className={`mqt-col-profit mqt-profit ${tone(groupProfit)}`}>
                        {money(groupProfit)}
                      </strong>
                      <span
                        className="mqt-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="mqt-icon-btn"
                              aria-label={`Дії групи ${group.name}`}
                            >
                              <MoreVertical size={20} aria-hidden="true" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="mqt-menu">
                            <DropdownMenuItem onSelect={() => onDetails(group.id)}>
                              <BarChart3 size={16} aria-hidden="true" /> Статистика групи
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onEdit(group)}>
                              <Pencil size={16} aria-hidden="true" /> Редагувати групу
                            </DropdownMenuItem>
                            {/^https:\/\/t\.me\//i.test(group.link) && (
                              <DropdownMenuItem asChild>
                                <a
                                  href={group.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink size={16} aria-hidden="true" /> Відкрити в
                                  Telegram
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="is-danger"
                              onSelect={() => onDelete(group.id)}
                            >
                              <Trash2 size={16} aria-hidden="true" /> Видалити групу
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
                {!loaded
                  ? "Завантажуємо групи…"
                  : groups.length
                    ? "Груп не знайдено"
                    : "Додайте першу групу"}
              </strong>
              <p>
                {groups.length
                  ? "Спробуйте інший запит або оберіть усі ігри."
                  : "Зберіть джерела прогнозів в одному місці й порівнюйте їх за реальними результатами."}
              </p>
              {loaded &&
                (groups.length ? (
                  <button
                    type="button"
                    className="mqp-btn-outline is-sm"
                    onClick={() => {
                      setSearch("");
                      setGame("all");
                    }}
                  >
                    Скинути фільтри
                  </button>
                ) : null)}
            </div>
          )}
          {children}
        </section>

        <aside
          className={`mqt-guide${guideCollapsed ? " is-collapsed" : ""}`}
          aria-labelledby="mqt-how-title"
        >
          <div className="mqt-guide-head">
            <div className="mqt-guide-titles">
              <p className="mqp-kicker">
                <i>02</i> Як це працює
              </p>
              <h2 id="mqt-how-title">Три кроки до чесної статистики</h2>
            </div>
            <button
              type="button"
              className="mqt-guide-toggle"
              aria-expanded={!guideCollapsed}
              aria-controls="mqt-guide-body"
              aria-label={guideCollapsed ? "Розгорнути підказку" : "Згорнути підказку"}
              title={guideCollapsed ? "Розгорнути" : "Згорнути"}
              onClick={toggleGuide}
            >
              <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
          <div className="mqt-guide-reveal" id="mqt-guide-body" aria-hidden={guideCollapsed} inert={guideCollapsed}>
          <div className="mqt-guide-body">
            <ol>
              {STEPS.map(([title, text], i) => (
                <li key={title}>
                  <b className={i === 0 ? "is-accent" : ""}>{i + 1}</b>
                  <span>
                    <strong>{title}</strong>
                    <small>{text}</small>
                  </span>
                </li>
              ))}
            </ol>
            <SwapPill
              className="is-on-dark"
              label={groups.length ? "Додати групу" : "Додати першу групу"}
              onClick={onAdd}
              icon={<Plus size={16} strokeWidth={2.2} />}
            />
          </div>
          </div>
        </aside>
      </div>

      <p className="mqt-footnote">
        Статистика рахується з ваших записів і не гарантує майбутніх
        результатів. MatchIQ не приймає ставки. 18+.
      </p>
    </div>
  );
}
