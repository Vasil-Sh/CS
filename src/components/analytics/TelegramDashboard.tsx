import { Fragment, useMemo, useState, type ReactNode } from "react";
import {
  Users,
  File,
  Target,
  Database,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import "./TelegramDashboard.css";

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
const number = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 });
const money = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${number.format(Math.abs(value))} ₴`;
const settled = (bet: TelegramPick) =>
  bet.result === "Win" || bet.result === "Loss";
const totalProfit = (bets: TelegramPick[]) =>
  bets.filter(settled).reduce((sum, b) => sum + (Number(b.profit) || 0), 0);

export function channelGames(
  group: TelegramChannel,
  bets: TelegramPick[],
): Exclude<Game, "all">[] {
  const games = new Set<Exclude<Game, "all">>();
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
function GameBadge({ game }: { game: Exclude<Game, "all"> }) {
  return (
    <span className={`tg2-game tg2-game--${game}`}>
      <span aria-hidden="true" className="tg2-game-mark" />
      {game === "cs2" ? "CS2" : "Dota 2"}
    </span>
  );
}
function CommentButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="tg2-comment-toggle"
      aria-expanded={open}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      Коментар
    </button>
  );
}
function ChannelAvatar({ group }: { group: TelegramChannel }) {
  const [failed, setFailed] = useState(false);
  const username = group.link.match(
    /(?:https?:\/\/)?t\.me\/(?:s\/)?([a-zA-Z][\w]{3,})\/?(?:[?#].*)?$/,
  )?.[1];
  return (
    <span className="tg2-avatar">
      {username && !failed ? (
        <img
          src={`https://t.me/i/userpic/320/${username}.jpg`}
          alt=""
          onError={() => setFailed(true)}
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth <= 1) setFailed(true);
          }}
        />
      ) : (
        <Users size={23} />
      )}
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
  return (
    <div
      className="tg2-activity"
      aria-label={`${bins.reduce((a, b) => a + b, 0)} записів за останні 12 днів`}
    >
      {bins.some(Boolean) ? (
        bins.map((count, i) => (
          <span
            key={i}
            title={`${count} записів`}
            style={{
              height: `${count ? 15 + (count / max) * 85 : 4}%`,
              opacity: count ? 0.45 + i / 24 : 0.2,
            }}
          />
        ))
      ) : (
        <small>Ще немає</small>
      )}
    </div>
  );
}

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
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(
    null,
  );
  const visible = useMemo(
    () =>
      groups
        .filter((group) => {
          const text =
            `${group.name} ${group.link} ${group.comment}`.toLowerCase();
          return (
            text.includes(search.trim().toLowerCase().replace(/^@/, "")) &&
            (game === "all" || channelGames(group, bets).includes(game))
          );
        })
        .sort((a, b) => {
          const sa = stats.find((s) => s.groupId === a.id),
            sb = stats.find((s) => s.groupId === b.id);
          return sort === "profit"
            ? (sb?.totalProfit || 0) - (sa?.totalProfit || 0)
            : sort === "win"
              ? (sb?.winRate || 0) - (sa?.winRate || 0)
              : 0;
        }),
    [groups, bets, stats, search, game, sort],
  );
  const completed = bets.filter(settled),
    wins = completed.filter((b) => b.result === "Win").length;
  const now = Date.now(),
    week = 7 * 86400000;
  const recent = bets.filter(
    (b) => +new Date(b.date) >= now - week && +new Date(b.date) <= now,
  );
  const newGroups = groups.filter(
    (g) =>
      +new Date(g.createdAt) >= now - week && +new Date(g.createdAt) <= now,
  ).length;
  const profit = totalProfit(bets);
  const metrics = [
    {
      label: "Групи",
      value: number.format(groups.length),
      icon: Users,
      notePrefix: `+${newGroups}`,
      noteText: "за останні 7 днів",
    },
    {
      label: "Прогнози",
      value: number.format(bets.length),
      icon: File,
      notePrefix: `+${recent.length}`,
      noteText: "за останні 7 днів",
    },
    {
      label: "Відсоток перемог",
      value: completed.length
        ? `${Math.round((wins / completed.length) * 100)}%`
        : "—",
      icon: Target,
      notePrefix: completed.length ? `${wins} із ${completed.length}` : "",
      noteText: completed.length ? "завершених" : "Ще немає завершених ставок",
    },
    {
      label: "Прибуток",
      value: money(profit),
      icon: Database,
      notePrefix: money(totalProfit(recent)),
      noteText: "за останні 7 днів",
      tone: profit > 0 ? "positive" : profit < 0 ? "negative" : "",
      noteTone:
        totalProfit(recent) > 0
          ? "positive"
          : totalProfit(recent) < 0
            ? "negative"
            : "",
    },
  ];
  return (
    <div className="tg2-screen">
      <header className="tg2-hero">
        <div className="tg2-hero-copy">
          <p className="tg2-eyebrow">Telegram groups</p>
          <h1>
            Всі ваші джерела
            <br />в одному місці
          </h1>
          <p className="tg2-subtitle">
            Додавайте Telegram-групи та аналізуйте
            <br className="tg2-wide-break" /> результати прогнозів в одному
            місці.
          </p>
        </div>
      </header>
      <div className="tg2-content">
        <section
          className="tg2-metrics"
          aria-label="Загальна статистика Telegram-груп"
        >
          {metrics.map(
            ({
              label,
              value,
              icon: Icon,
              notePrefix,
              noteText,
              tone,
              noteTone,
            }) => (
              <article className="tg2-metric" key={label}>
                <Icon size={30} strokeWidth={1.8} aria-hidden="true" />
                <div>
                  <p>{label}</p>
                  <strong className={tone}>{loaded ? value : "…"}</strong>
                  <small>
                    {notePrefix && (
                      <span
                        className={
                          noteTone === "positive"
                            ? "tg2-note-positive"
                            : noteTone === "negative"
                              ? "tg2-note-negative"
                              : "tg2-note-positive"
                        }
                      >
                        {notePrefix}
                      </span>
                    )}
                    {noteText && ` ${noteText}`}
                  </small>
                </div>
              </article>
            ),
          )}
        </section>
        <div className="tg2-grid">
          <div className="tg2-main">
            <section className="tg2-ledger" aria-label="Telegram групи">
              <div className="tg2-toolbar">
                <h2>Telegram групи</h2>
                <label className="tg2-search">
                  <Search size={19} />
                  <input
                    aria-label="Пошук групи"
                    placeholder="Пошук по назві або @нікнейму…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <select
                  aria-label="Гра"
                  value={game}
                  onChange={(e) => setGame(e.target.value as Game)}
                >
                  <option value="all">Всі ігри</option>
                  <option value="cs2">CS2</option>
                  <option value="dota2">Dota 2</option>
                </select>
              </div>
              <div className="tg2-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Канал</th>
                      <th>Гра</th>
                      <th>Активність</th>
                      <th>
                        <button
                          onClick={() =>
                            setSort(sort === "win" ? "default" : "win")
                          }
                        >
                          Відсоток перемог{sort === "win" ? " ↓" : ""}
                        </button>
                      </th>
                      <th>
                        <button
                          onClick={() =>
                            setSort(sort === "profit" ? "default" : "profit")
                          }
                        >
                          Прибуток{sort === "profit" ? " ↓" : ""}
                        </button>
                      </th>
                      <th>Статус</th>
                      <th>
                        <span className="sr-only">Дії</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((group) => {
                      const s = stats.find((item) => item.groupId === group.id);
                      const picks = bets.filter((b) => b.groupId === group.id),
                        games = channelGames(group, bets);
                      const completedCount = (s?.wins || 0) + (s?.losses || 0);
                      const handle = group.link.match(
                        /t\.me\/(?:s\/)?([^/?#]+)/,
                      )?.[1];
                      const last = picks
                        .map((b) => +new Date(b.date))
                        .filter(Number.isFinite)
                        .sort((a, b) => b - a)[0];
                      const commentOpen = expandedCommentId === group.id;
                      return (
                        <Fragment key={group.id}>
                          <tr onClick={() => onDetails(group.id)}>
                            <td>
                              <div className="tg2-channel">
                                <ChannelAvatar group={group} />
                                <div>
                                  <div className="tg2-channel-name-row">
                                    <button
                                      className="tg2-channel-name"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDetails(group.id);
                                      }}
                                    >
                                      {group.name}
                                    </button>
                                    {group.hasChannel && (
                                      <TooltipProvider delayDuration={200}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span
                                              className="tg2-channel-lock"
                                              aria-label="Має приватний канал"
                                            >
                                              <Lock
                                                size={14}
                                                strokeWidth={2}
                                                aria-hidden="true"
                                              />
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent className="tg2-lock-tooltip">
                                            <span className="tg2-lock-tooltip-title">
                                              Приватний канал
                                            </span>
                                            Крім відкритої групи є платний
                                            закритий канал.
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                  <small>
                                    {handle ? `@${handle}` : "Без посилання"}
                                  </small>
                                  {group.comment && (
                                    <CommentButton
                                      open={commentOpen}
                                      onClick={() =>
                                        setExpandedCommentId(
                                          commentOpen ? null : group.id,
                                        )
                                      }
                                    />
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="tg2-game-list">
                                {games.length ? (
                                  games.map((g) => (
                                    <GameBadge key={g} game={g} />
                                  ))
                                ) : (
                                  <span title="Гру ще не вказано">—</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <Activity bets={picks} />
                            </td>
                            <td>
                              <strong>
                                {completedCount
                                  ? `${Math.round(((s?.wins || 0) / completedCount) * 100)}%`
                                  : "—"}
                              </strong>
                              <small>
                                {completedCount
                                  ? `${s?.wins || 0} із ${completedCount}`
                                  : "—"}
                              </small>
                            </td>
                            <td>
                              <strong
                                className={
                                  (s?.totalProfit || 0) > 0
                                    ? "positive"
                                    : (s?.totalProfit || 0) < 0
                                      ? "negative"
                                      : ""
                                }
                              >
                                {money(s?.totalProfit || 0)}
                              </strong>
                            </td>
                            <td>
                              <span className="tg2-status">
                                <i />
                                Додано
                              </span>
                              <small>
                                {last
                                  ? `Запис ${new Date(last).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}`
                                  : "Ще немає записів"}
                              </small>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="tg2-menu-trigger"
                                    aria-label={`Дії групи ${group.name}`}
                                  >
                                    <MoreVertical size={21} />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="tg2-menu-content"
                                >
                                  <DropdownMenuItem
                                    onSelect={() => onDetails(group.id)}
                                  >
                                    <BarChart3 size={16} /> Статистика групи
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => onEdit(group)}
                                  >
                                    <Pencil size={16} /> Редагувати групу
                                  </DropdownMenuItem>
                                  {/^https:\/\/t\.me\//i.test(group.link) && (
                                    <DropdownMenuItem asChild>
                                      <a
                                        href={group.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <ExternalLink size={16} /> Відкрити
                                        Telegram
                                      </a>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onSelect={() => onDelete(group.id)}
                                  >
                                    <Trash2 size={16} /> Видалити групу
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                          {commentOpen && group.comment && (
                            <tr className="tg2-comment-row">
                              <td colSpan={7}>
                                <div className="tg2-comment-note">
                                  <strong className="tg2-comment-note-title">
                                    Примітка до {group.name}
                                  </strong>
                                  <p>{group.comment}</p>
                                  {group.hasChannel && (
                                    <span className="tg2-comment-note-channel">
                                      Має також приватний канал · доступ за
                                      запрошенням
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!visible.length && (
                <div className="tg2-empty">
                  <strong>
                    {!loaded
                      ? "Завантажуємо групи…"
                      : groups.length
                        ? "Груп не знайдено"
                        : "Додайте вашу першу групу"}
                  </strong>
                  <p>
                    {groups.length
                      ? "Спробуйте інший запит або оберіть усі ігри."
                      : "Зберіть джерела прогнозів в одному місці."}
                  </p>
                  {loaded && (
                    <button
                      className="tg2-primary"
                      onClick={
                        groups.length
                          ? () => {
                              setSearch("");
                              setGame("all");
                            }
                          : onAdd
                      }
                    >
                      {groups.length ? "Скинути фільтри" : "Додати групу"}
                    </button>
                  )}
                </div>
              )}
            </section>
            {children}
          </div>
          <aside className="tg2-guide">
            <h2>Як це працює?</h2>
            <ol>
              {[
                [
                  "Додайте Telegram групу",
                  "Вкажіть назву та посилання на канал або групу з прогнозами.",
                ],
                [
                  "Збирайте прогнози",
                  "Записи, пов’язані з групою, формують її статистику.",
                ],
                [
                  "Отримуйте аналітику",
                  "Бачте відсоток перемог, прибуток і детальну статистику кожної групи.",
                ],
              ].map(([title, text], i) => (
                <li key={title}>
                  <span>{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <button className="tg2-primary" onClick={onAdd}>
              <Plus size={20} />
              {groups.length ? "Додати групу" : "Додати першу групу"}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
