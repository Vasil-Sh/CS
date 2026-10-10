import {
  Fragment,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { Link } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  Columns3,
  MoreHorizontal,
  Flag,
  Share2,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  FileText,
  Trash2,
  CheckCircle,
  XCircle,
  Clock3,
  ChevronDown,
  Download,
  Info,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type BetTable from "@/components/BetTable";
import type { Bet } from "@/types/betting";
import { api } from "@/lib/apiClient";
import { UserDataService } from "@/lib/userDataService";
import { parseExpressEvents } from "@/lib/parser/expressParser";
import CompactBetModal from "./CompactBetModal";
import JournalRecordDetails from "./JournalRecordDetails";
import {
  journalKey,
  journalExpress,
  journalSelection,
  journalMarket,
  journalStatus,
  journalAmount,
  journalProfit,
  journalMoney,
  journalDate,
  csvCell,
} from "./journalModel";
import "./Journal.css";

type Props = ComponentProps<typeof BetTable>;
const columns = [
  ["date", "Дата"],
  ["match", "Матч і вибір"],
  ["amount", "Сума"],
  ["odds", "Коеф."],
  ["profit", "Профіт"],
  ["goal", "Ціль"],
  ["status", "Статус"],
] as const;
type Column = (typeof columns)[number][0];
const statuses = [
  ["all", "Усі"],
  ["Pending", "Очікують"],
  ["Win", "Виграші"],
  ["Loss", "Програші"],
] as const;
type Goal = { id: string; name: string };
function TeamLogo({ src, name }: { src?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return src && !failed ? (
    <img
      className="journal-logo"
      src={src}
      alt=""
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="journal-logo journal-initial" aria-hidden="true">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
export default function JournalTable(p: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [game, setGame] = useState("all");
  const [currency, setCurrency] = useState("all");
  const [category, setCategory] = useState("all");
  const [size, setSize] = useState(20);
  const [ascending, setAscending] = useState(p.sortOrder === "asc");
  const [visible, setVisible] = useState<Set<Column>>(
    () => new Set(columns.map(([id]) => id)),
  );
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoaded, setGoalsLoaded] = useState(false);
  const [compact, setCompact] = useState(false);
  const [compactPeriod, setCompactPeriod] = useState("all");
  const [compactMonth, setCompactMonth] = useState("");
  const disclosureRefs = useRef(new Map<string, HTMLButtonElement>());
  const detailId = useId();
  const panelId = (bet: Bet) =>
    `${detailId}-${encodeURIComponent(journalKey(bet))}`;
  useEffect(() => {
    let cancelled = false;
    setGoalsLoaded(false);
    api
      .get<Goal[]>("/goals")
      .then((data) => {
        if (!cancelled) {
          setGoals(data);
          setGoalsLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled)
          setGoals(
            UserDataService.getUserData<Goal[]>(p.currentUser, "goals", []),
          );
      });
    return () => {
      cancelled = true;
    };
  }, [p.currentUser]);
  useEffect(() => {
    p.onPageChange(1);
  }, [game, currency, category, size]);
  const choose = (bet: Bet) => {
    const key = journalKey(bet);
    setSelectedKey((current) => (current === key ? null : key));
  };
  const closeDetails = (bet: Bet) => {
    setSelectedKey(null);
    disclosureRefs.current.get(journalKey(bet))?.focus({ preventScroll: true });
  };
  const goalName = (bet: Bet) =>
    goals.find((goal) => String(goal.id) === String(bet.goalId))?.name ||
    (goalsLoaded ? "Видалена ціль" : "Ціль недоступна");
  const scope = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days =
      p.periodFilter === "week" ? 7 : p.periodFilter === "month" ? 30 : 90;
    const start = new Date(today);
    start.setDate(start.getDate() - days + 1);
    const end = new Date(today);
    end.setDate(end.getDate() + 1);
    return p.bets.filter((bet) => {
      const date = new Date(bet.date);
      if (p.tableFilter === "today" && !(date >= today && date < end))
        return false;
      if (p.periodFilter !== "all" && !(date >= start && date < end))
        return false;
      if (
        game !== "all" &&
        (game === "Dota2"
          ? !/dota|дота/i.test(bet.game || "")
          : !/cs/i.test(bet.game || "CS2"))
      )
        return false;
      if (currency !== "all" && (bet.currency || "UAH") !== currency)
        return false;
      if (
        category !== "all" &&
        journalExpress(bet) !== (category === "express")
      )
        return false;
      const q = p.searchText.trim().toLocaleLowerCase();
      return (
        !q ||
        [
          bet.match,
          bet.selection,
          bet.team1,
          bet.team2,
          bet.strategy,
          journalMarket(bet),
        ]
          .join(" ")
          .toLocaleLowerCase()
          .includes(q)
      );
    });
  }, [
    p.bets,
    p.searchText,
    p.tableFilter,
    p.periodFilter,
    game,
    currency,
    category,
  ]);
  const filtered = useMemo(
    () =>
      scope
        .filter(
          (bet) => p.resultFilter === "all" || bet.result === p.resultFilter,
        )
        .sort((a, b) => {
          const av =
            p.sortBy === "date"
              ? new Date(a.date).getTime()
              : p.sortBy === "odds"
                ? a.odds
                : Number(a.profit || 0);
          const bv =
            p.sortBy === "date"
              ? new Date(b.date).getTime()
              : p.sortBy === "odds"
                ? b.odds
                : Number(b.profit || 0);
          return (av - bv) * (ascending ? 1 : -1);
        }),
    [scope, p.resultFilter, p.sortBy, ascending],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const page = Math.max(1, Math.min(p.currentPage, pages));
  const rows = filtered.slice((page - 1) * size, page * size);
  useEffect(() => {
    if (selectedKey && !rows.some((bet) => journalKey(bet) === selectedKey)) {
      setSelectedKey(null);
    }
  }, [selectedKey, rows]);
  const reset = () => {
    p.onSearchTextChange("");
    p.onTableFilterChange("all");
    p.onPeriodFilterChange("all");
    p.onResultFilterChange("all");
    setGame("all");
    setCurrency("all");
    setCategory("all");
    p.onPageChange(1);
  };
  const sort = (column: "date" | "profit" | "odds") => {
    setAscending(p.sortBy === column ? !ascending : false);
    p.onSortByChange(column);
  };
  const exportCSV = () => {
    const data = [
      [
        "Дата",
        "Матч",
        "Ринок",
        "Вибір",
        "Сума",
        "Валюта",
        "Коефіцієнт",
        "Профіт",
        "Ціль",
        "Статус",
      ],
      ...filtered.map((b) => [
        b.date,
        b.match,
        journalExpress(b) ? "Експрес" : journalMarket(b),
        journalSelection(b),
        journalAmount(b),
        b.currency || "UAH",
        b.odds,
        journalProfit(b),
        b.goalId ? goalName(b) : "",
        journalStatus(b),
      ]),
    ];
    const blob = new Blob(
      ["\uFEFF" + data.map((row) => row.map(csvCell).join(";")).join("\r\n")],
      { type: "text/csv;charset=utf-8;" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "matchiq-journal.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const menu = (bet: Bet) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="journal-icon"
          aria-label={`Дії: ${bet.match}`}
        >
          <MoreHorizontal size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => p.onBetDetails(bet)}>
          <FileText size={16} />
          Текст для Telegram
        </DropdownMenuItem>
        {journalExpress(bet) && (
          <DropdownMenuItem onSelect={() => p.onExpressDetails(bet)}>
            Повні деталі експресу
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {bet.result === "Pending" && (
          <>
            <DropdownMenuItem onSelect={() => p.onUpdateResult(bet, "Win")}>
              Позначити виграш
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => p.onUpdateResult(bet, "Loss")}>
              Позначити програш
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem
          className="text-red-600"
          onSelect={() => p.onDeleteBet(bet)}
        >
          <Trash2 size={14} /> Видалити
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  const actions = (bet: Bet) => (
    <div
      className="journal-actions"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="journal-row-share"
        onClick={() => p.onShareBet(bet)}
        aria-label={`Поділитися: ${bet.match}`}
        title="Поділитися записом"
      >
        <Share2 size={16} />
        <span>Поділитися</span>
      </button>
      {menu(bet)}
    </div>
  );
  const badge = (bet: Bet) => (
    <span className={`journal-badge status-${bet.result}`}>
      {bet.result === "Win" ? (
        <CheckCircle size={15} />
      ) : bet.result === "Loss" ? (
        <XCircle size={15} />
      ) : (
        <Clock3 size={15} />
      )}
      {journalStatus(bet)}
    </span>
  );
  const profit = (bet: Bet) => (
    <strong
      className={`journal-profit ${bet.result === "Win" ? "positive" : bet.result === "Loss" ? "negative" : ""}`}
    >
      {journalMoney(journalProfit(bet), bet.currency, true)}
    </strong>
  );
  const goal = (bet: Bet) =>
    !bet.goalId ? (
      <span className="journal-muted">—</span>
    ) : goals.some((g) => String(g.id) === String(bet.goalId)) ? (
      <Link className="journal-goal" to={`/app/goals`} title={goalName(bet)}>
        <Flag size={13} />
        {goalName(bet)}
      </Link>
    ) : (
      <span className="journal-muted">{goalName(bet)}</span>
    );
  const cell = (id: Column, bet: Bet) => {
    const date = journalDate(bet.date);
    switch (id) {
      case "date":
        return (
          <>
            <span>{date.day}</span>
            <small>{date.time}</small>
          </>
        );
      case "match": {
        const parts = (bet.match || "").split(/\s+vs\s+/i);
        const t1 = bet.team1 || parts[0] || "";
        const t2 = bet.team2 || parts[1] || "";
        const matchName = bet.match.replace(/\s+vs\s+/i, " — ");
        return (
          <button
            type="button"
            className="journal-match-button"
            ref={(node) => {
              if (node) disclosureRefs.current.set(journalKey(bet), node);
              else disclosureRefs.current.delete(journalKey(bet));
            }}
            onClick={() => choose(bet)}
            aria-label={`Деталі: ${bet.match}`}
            aria-expanded={selectedKey === journalKey(bet)}
            aria-controls={panelId(bet)}
          >
            {journalExpress(bet) ? (
              <span className="journal-match-title journal-match-inline">
                <ListChecks size={24} />
                <strong>
                  Експрес ·{" "}
                  {parseExpressEvents(bet.betType).length ||
                    bet.format?.replace("x", "") ||
                    "—"}{" "}
                  подій
                </strong>
                <ChevronDown size={15} className="journal-disclosure-icon" />
              </span>
            ) : (
              <span className="journal-match-title">
                <span className="journal-match-inline">
                  <TeamLogo src={bet.logoTeam1} name={t1} />
                  <strong>{matchName}</strong>
                  {t2 && <TeamLogo src={bet.logoTeam2} name={t2} />}
                  <ChevronDown size={15} className="journal-disclosure-icon" />
                </span>
              </span>
            )}
            {!journalExpress(bet) && (
              <span className="journal-selection">
                Вибір: <span>{journalSelection(bet)}</span>
              </span>
            )}
            <small>
              {!journalExpress(bet) && <>{journalMarket(bet)} · </>}
              {bet.game || "CS2"} · {bet.format || "—"}
            </small>
            {journalExpress(bet) && (
              <span className="journal-expand-label">
                {selectedKey === journalKey(bet)
                  ? "Згорнути події"
                  : "Показати події"}
              </span>
            )}
          </button>
        );
      }
      case "amount":
        return journalMoney(journalAmount(bet), bet.currency);
      case "odds":
        return Number(bet.odds).toFixed(2);
      case "profit":
        return profit(bet);
      case "goal":
        return goal(bet);
      case "status":
        return badge(bet);
    }
  };
  const compactBets = filtered.filter((b) => {
    if (b.result === "Pending") return false;
    const date = new Date(b.date),
      now = new Date();
    if (compactMonth && b.date.slice(0, 7) !== compactMonth) return false;
    if (compactPeriod === "all") return true;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(
      start.getDate() -
        (compactPeriod === "week" ? 6 : compactPeriod === "month" ? 29 : 0),
    );
    return date >= start && date <= now;
  });
  const compactRecords = compactBets.map((b) => ({
    id: journalKey(b),
    selection: journalExpress(b)
      ? `Експрес · ${parseExpressEvents(b.betType).length || b.format?.replace("x", "") || "—"} подій`
      : journalSelection(b),
    market: journalExpress(b) ? "Кілька подій" : journalMarket(b),
    logoUrl: journalExpress(b) ? null : b.logoTeam1,
    odds: Number(b.odds),
    result: (b.result === "Win" ? "Win" : "Loss") as "Win" | "Loss",
    profit: journalProfit(b) ?? 0,
    currency: (b.currency === "USD" ? "USD" : "UAH") as "UAH" | "USD",
  }));
  return (
    <section className="journal-workspace" aria-label="Журнал записів">
      <div className="journal-tools">
        <label className="journal-search">
          <Search size={17} />
          <input
            aria-label="Пошук записів"
            placeholder="Пошук матчу або команди"
            value={p.searchText}
            onChange={(e) => p.onSearchTextChange(e.target.value)}
          />
        </label>
        <button
          className="journal-outline"
          aria-expanded={p.showAdvancedFilters}
          onClick={p.onToggleAdvancedFilters}
        >
          <SlidersHorizontal size={15} />
          Фільтри
          {currency !== "all" ||
          category !== "all" ||
          game !== "all" ||
          (p.tableFilter !== "today" && p.periodFilter !== "all")
            ? " •"
            : ""}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="journal-outline">
              <Columns3 size={15} />
              Колонки
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {columns.map(([id, label]) => (
              <DropdownMenuCheckboxItem
                key={id}
                checked={visible.has(id)}
                disabled={id === "match"}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() =>
                  setVisible((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  })
                }
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={exportCSV}>
              <Download size={16} /> Експорт CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button className="journal-compact" onClick={() => setCompact(true)}>
          <FileText size={15} />
          Стислий список
        </button>
      </div>
      {p.showAdvancedFilters && (
        <div className="journal-extra">
          <label>
            Період
            <select
              value={p.tableFilter === "today" ? "today" : p.periodFilter}
              onChange={(e) => {
                p.onTableFilterChange(
                  e.target.value === "today" ? "today" : "all",
                );
                p.onPeriodFilterChange(
                  e.target.value === "today"
                    ? "all"
                    : (e.target.value as Props["periodFilter"]),
                );
              }}
            >
              <option value="all">Увесь період</option>
              <option value="today">Сьогодні</option>
              <option value="week">Останні 7 днів</option>
              <option value="month">Останні 30 днів</option>
              <option value="quarter">Останні 90 днів</option>
            </select>
          </label>
          <label>
            Гра
            <select value={game} onChange={(e) => setGame(e.target.value)}>
              <option value="all">Усі ігри</option>
              <option value="CS2">CS2</option>
              <option value="Dota2">Dota 2</option>
            </select>
          </label>
          <label>
            Валюта
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="all">Усі валюти</option>
              <option value="UAH">₴ UAH</option>
              <option value="USD">$ USD</option>
            </select>
          </label>
          <label>
            Категорія
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">Усі записи</option>
              <option value="single">Ординар</option>
              <option value="express">Експрес</option>
            </select>
          </label>
          <button className="journal-reset" onClick={reset}>
            Скинути фільтри
          </button>
        </div>
      )}
      <div className="journal-list">
        <div className="journal-status-bar">
          <nav className="journal-statuses" aria-label="Статус записів">
            {statuses.map(([value, label]) => (
              <button
                key={value}
                aria-pressed={p.resultFilter === value}
                onClick={() => {
                  p.onResultFilterChange(value);
                  p.onPageChange(1);
                }}
              >
                {label}{" "}
                <span>
                  {value === "all"
                    ? scope.length
                    : scope.filter((b) => b.result === value).length}
                </span>
              </button>
            ))}
          </nav>
          <span className="journal-record-count">
            Записів: {filtered.length}
          </span>
        </div>
        <div className="journal-table-wrap">
          <table className="journal-records-table">
            <caption className="sr-only">
              Записи журналу. Натисніть назву матчу, щоб відкрити деталі.
            </caption>
            <thead>
              <tr>
                {columns
                  .filter(([id]) => visible.has(id))
                  .map(([id, label]) => (
                    <th
                      key={id}
                      className={`col-${id}`}
                      aria-sort={
                        p.sortBy === id
                          ? ascending
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                    >
                      {id === "date" || id === "odds" || id === "profit" ? (
                        <button
                          onClick={() => sort(id)}
                          className="journal-sort"
                          title={
                            id === "profit"
                              ? "Сортування за профітом у базовій валюті UAH"
                              : undefined
                          }
                        >
                          <span>{label}</span>
                          <span className="journal-sort-arrow">
                            {p.sortBy === id ? (ascending ? "↑" : "↓") : "↕"}
                          </span>
                        </button>
                      ) : (
                        label
                      )}
                    </th>
                  ))}
                <th className="col-actions-head">Дії</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((bet) => (
                <Fragment key={journalKey(bet)}>
                  <tr
                    className={`journal-record-row ${selectedKey === journalKey(bet) ? "is-selected" : ""}`}
                    onClick={(e) => {
                      if (!(e.target as HTMLElement).closest("button,a,input"))
                        choose(bet);
                    }}
                  >
                    {columns
                      .filter(([id]) => visible.has(id))
                      .map(([id, label]) => (
                        <td className={`col-${id}`} data-label={label} key={id}>
                          {cell(id, bet)}
                        </td>
                      ))}
                    <td className="col-actions">{actions(bet)}</td>
                  </tr>
                  {selectedKey === journalKey(bet) && (
                    <tr className="journal-expanded-row">
                      <td colSpan={visible.size + 1}>
                        <JournalRecordDetails
                          bet={bet}
                          id={panelId(bet)}
                          onClose={() => closeDetails(bet)}
                          onExpressDetails={() => p.onExpressDetails(bet)}
                          onUpdateResult={(result) =>
                            p.onUpdateResult(bet, result)
                          }
                          hiddenGoal={
                            !visible.has("goal") ? goal(bet) : undefined
                          }
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <div className="journal-empty">
              <h3>
                {p.bets.length ? "Нічого не знайдено" : "Журнал поки порожній"}
              </h3>
              <p>
                {p.bets.length
                  ? "Спробуйте інший пошук або змініть фільтри."
                  : "Додайте перший запис, щоб відстежувати свої рішення."}
              </p>
              <button onClick={p.bets.length ? reset : p.onNavigateToAdd}>
                {p.bets.length ? "Скинути фільтри" : "Додати запис"}
              </button>
            </div>
          )}
          <footer className="journal-pagination">
            <span>
              {filtered.length
                ? `${(page - 1) * size + 1}–${Math.min(page * size, filtered.length)} із ${filtered.length} записів`
                : "0 записів"}
            </span>
            <label>
              На сторінці
              <select
                aria-label="Записів на сторінці"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              >
                {[10, 20, 50].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <button
              aria-label="Попередня сторінка"
              disabled={page <= 1}
              onClick={() => p.onPageChange(page - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <span>
              {page} / {pages}
            </span>
            <button
              aria-label="Наступна сторінка"
              disabled={page >= pages}
              onClick={() => p.onPageChange(page + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </footer>
        </div>
        <p className="journal-footnote">
          <Info size={15} />{" "}
          <span>
            Суми показано у валюті запису — ₴ і $ не підсумовуються. Сортування
            профіту — за UAH.
          </span>
        </p>
      </div>
      <CompactBetModal
        open={compact}
        onClose={() => setCompact(false)}
        period={compactPeriod as "all" | "day" | "week" | "month"}
        onPeriodChange={(val) => setCompactPeriod(val)}
        month={compactMonth}
        onMonthChange={setCompactMonth}
        monthOptions={[...new Set(p.bets.map((b) => b.date.slice(0, 7)))]
          .sort()
          .reverse()
          .map((value) => ({ value, label: value }))}
        records={compactRecords}
      />
    </section>
  );
}
