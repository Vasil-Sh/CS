import {
  useEffect,
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
  X,
  Flag,
  Pencil,
  Share2,
  Download,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  FileText,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type BetTable from "@/components/BetTable";
import type { Bet } from "@/types/betting";
import { api } from "@/lib/apiClient";
import { UserDataService } from "@/lib/userDataService";
import { parseExpressEvents } from "@/lib/parser/expressParser";
import CompactBetModal from "./CompactBetModal";
import { toast } from "sonner";
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

type Props = ComponentProps<typeof BetTable> & {
  onNotesSaved: (bet: Bet, notes: string) => void;
};
const columns = [
  ["date", "Дата"],
  ["match", "Матч"],
  ["selection", "Ваш вибір"],
  ["amount", "Сума"],
  ["odds", "Коеф."],
  ["profit", "Профіт"],
  ["goal", "Ціль"],
  ["status", "Статус"],
  ["notes", "Нотатки"],
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
  const [dense, setDense] = useState(false);
  const [game, setGame] = useState("all");
  const [currency, setCurrency] = useState("all");
  const [category, setCategory] = useState("all");
  const [size, setSize] = useState(20);
  const [ascending, setAscending] = useState(false);
  const [visible, setVisible] = useState<Set<Column>>(
    () => new Set(columns.map(([id]) => id)),
  );
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoaded, setGoalsLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [savedNotes, setSavedNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [compact, setCompact] = useState(false);
  const [compactPeriod, setCompactPeriod] = useState("all");
  const [compactMonth, setCompactMonth] = useState("");
  const detailRef = useRef<HTMLHeadingElement>(null);
  const selected = p.bets.find((bet) => journalKey(bet) === selectedKey);
  const effectiveNote = (bet: Bet) =>
    savedNotes[journalKey(bet)] ?? bet.notes ?? "";
  const dirty = !!selected && draft !== effectiveNote(selected);
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
  useEffect(() => {
    if (selectedKey && !selected) {
      setSelectedKey(null);
      setDraft("");
    }
  }, [selectedKey, selected]);
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const choose = (bet: Bet | null) => {
    if (
      saving ||
      (dirty && !window.confirm("Відкинути незбережені зміни нотатки?"))
    )
      return;
    setSelectedKey(bet ? journalKey(bet) : null);
    setDraft(bet ? effectiveNote(bet) : "");
    setNoteError("");
    if (bet)
      requestAnimationFrame(() =>
        detailRef.current?.focus({ preventScroll: true }),
      );
  };
  const saveNote = async () => {
    if (!selected?.id || saving || !dirty) return;
    const target = selected;
    const note = draft;
    setSaving(true);
    setNoteError("");
    try {
      await api.patch(`/bets/${encodeURIComponent(target.id!)}`, {
        notes: note,
      });
      setSavedNotes((prev) => ({ ...prev, [journalKey(target)]: note }));
      p.onNotesSaved(target, note);
      toast.success("Нотатку збережено");
    } catch {
      setNoteError(
        "Не вдалося зберегти. Текст залишився у полі — спробуйте ще раз.",
      );
    } finally {
      setSaving(false);
    }
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
          bet.notes,
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
  const page = Math.min(p.currentPage, pages);
  const rows = filtered.slice((page - 1) * size, page * size);
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
        "Нотатки",
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
        effectiveNote(b),
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
        <DropdownMenuItem onSelect={() => choose(bet)}>
          Деталі запису
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => p.onShareBet(bet)}>
          Поділитися
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => p.onBetDetails(bet)}>
          Текст для Telegram
        </DropdownMenuItem>
        {journalExpress(bet) && (
          <DropdownMenuItem onSelect={() => p.onExpressDetails(bet)}>
            Події експресу
          </DropdownMenuItem>
        )}
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
  const badge = (bet: Bet) => (
    <span className={`journal-badge status-${bet.result}`}>
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
      case "match":
        return (
          <button
            className="journal-match-button"
            onClick={() => choose(bet)}
            aria-label={`Деталі: ${bet.match}`}
            aria-expanded={selectedKey === journalKey(bet)}
          >
            <span className="journal-match-title">
              {journalExpress(bet) ? (
                <ListChecks size={24} />
              ) : (
                <TeamLogo src={bet.logoTeam1} name={bet.team1 || bet.match} />
              )}
              <strong>
                {journalExpress(bet)
                  ? `Експрес · ${parseExpressEvents(bet.betType).length || bet.format?.replace("x", "") || "—"} подій`
                  : bet.match.replace(/\s+vs\s+/i, " — ")}
              </strong>
              {!journalExpress(bet) && bet.logoTeam2 && (
                <TeamLogo src={bet.logoTeam2} name={bet.team2 || ""} />
              )}
            </span>
            <small>
              {journalExpress(bet) ? "Переглянути події →" : journalMarket(bet)}{" "}
              · {bet.game || "CS2"} · {bet.format || "—"}
            </small>
          </button>
        );
      case "selection":
        return journalExpress(bet) ? "Експрес" : journalSelection(bet);
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
      case "notes":
        return (
          <button
            className="journal-note-link"
            onClick={() => choose(bet)}
            title={effectiveNote(bet) || "Додати нотатку"}
          >
            <Pencil size={13} />
            <span>{effectiveNote(bet) || "Додати"}</span>
          </button>
        );
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
  const compactText = compactBets
    .map(
      (b) =>
        `${b.match} · ${journalSelection(b)} · ${Number(b.odds).toFixed(2)} · ${journalMoney(journalProfit(b), b.currency, true)} · ${journalStatus(b)}`,
    )
    .join("\n");
  return (
    <section
      className={`journal-workspace ${dense ? "is-dense" : ""}`}
      aria-label="Журнал записів"
    >
      <div className="journal-tools">
        <label className="journal-search">
          <Search size={17} />
          <input
            aria-label="Пошук записів"
            placeholder="Пошук матчу, команди або нотатки"
            value={p.searchText}
            onChange={(e) => p.onSearchTextChange(e.target.value)}
          />
        </label>
        <select
          aria-label="Період журналу"
          value={p.tableFilter === "today" ? "today" : p.periodFilter}
          onChange={(e) => {
            p.onTableFilterChange(e.target.value === "today" ? "today" : "all");
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
        <select
          aria-label="Гра журналу"
          value={game}
          onChange={(e) => setGame(e.target.value)}
        >
          <option value="all">Усі ігри</option>
          <option value="CS2">CS2</option>
          <option value="Dota2">Dota 2</option>
        </select>
        <button
          className="journal-outline"
          aria-expanded={p.showAdvancedFilters}
          onClick={p.onToggleAdvancedFilters}
        >
          <SlidersHorizontal size={15} />
          Фільтри{currency !== "all" || category !== "all" ? " •" : ""}
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
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          className="journal-icon"
          aria-label="Експорт відфільтрованих записів CSV"
          onClick={exportCSV}
          disabled={!filtered.length}
        >
          <Download size={18} />
        </button>
        <div className="journal-density">
          <button aria-pressed={!dense} onClick={() => setDense(false)}>
            Комфортний
          </button>
          <button aria-pressed={dense} onClick={() => setDense(true)}>
            Стислий
          </button>
        </div>
      </div>
      {p.showAdvancedFilters && (
        <div className="journal-extra">
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
          <button onClick={reset}>Скинути фільтри</button>
          <button onClick={() => setCompact(true)}>
            <FileText size={15} />
            Список для копіювання
          </button>
        </div>
      )}
      <div className={`journal-layout ${selected ? "has-detail" : ""}`}>
        <div className="journal-list">
          <nav className="journal-statuses" aria-label="Статус записів">
            {statuses.map(([value, label]) => (
              <button
                key={value}
                aria-pressed={p.resultFilter === value}
                onClick={() => p.onResultFilterChange(value)}
              >
                {label} ·{" "}
                {value === "all"
                  ? scope.length
                  : scope.filter((b) => b.result === value).length}
              </button>
            ))}
          </nav>
          <div className="journal-table-wrap">
            <table>
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
                            title={
                              id === "profit"
                                ? "Сортування за профітом у базовій валюті UAH"
                                : undefined
                            }
                          >
                            {label}{" "}
                            {p.sortBy === id ? (ascending ? "↑" : "↓") : "↕"}
                          </button>
                        ) : (
                          label
                        )}
                      </th>
                    ))}
                  <th>
                    <span className="sr-only">Дії</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((bet) => (
                  <tr
                    key={journalKey(bet)}
                    className={
                      selectedKey === journalKey(bet) ? "is-selected" : ""
                    }
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
                    <td className="col-actions">{menu(bet)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <div className="journal-empty">
                <ListChecks size={32} />
                <h3>
                  {p.bets.length
                    ? "Нічого не знайдено"
                    : "Журнал поки порожній"}
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
            Суми у валюті запису. Валюти не підсумовуються. Сортування профіту —
            за UAH.
          </p>
        </div>
        {selected && (
          <aside
            className="journal-detail"
            aria-labelledby="journal-detail-title"
          >
            <header>
              <h2 id="journal-detail-title" ref={detailRef} tabIndex={-1}>
                Деталі запису
              </h2>
              <button
                className="journal-icon"
                aria-label="Закрити деталі"
                onClick={() => choose(null)}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </header>
            <div className="journal-detail-body">
              <div className="journal-detail-match">
                {badge(selected)}
                <div className="journal-versus">
                  <TeamLogo
                    src={selected.logoTeam1}
                    name={selected.team1 || selected.match}
                  />
                  <strong>{selected.match.replace(/\s+vs\s+/i, " — ")}</strong>
                  {!journalExpress(selected) && (
                    <TeamLogo
                      src={selected.logoTeam2}
                      name={selected.team2 || "?"}
                    />
                  )}
                </div>
                <p>
                  {journalDate(selected.date).day}{" "}
                  {journalDate(selected.date).time} · {selected.game || "CS2"} ·{" "}
                  {selected.format || "—"}
                </p>
              </div>
              <div className="journal-detail-grid">
                <div>
                  <span>Ринок</span>
                  <strong>
                    {journalExpress(selected)
                      ? "Експрес"
                      : journalMarket(selected)}
                  </strong>
                </div>
                <div>
                  <span>Ваш вибір</span>
                  <strong>
                    {journalExpress(selected)
                      ? "Кілька подій"
                      : journalSelection(selected)}
                  </strong>
                </div>
              </div>
              <div className="journal-detail-money">
                <div>
                  <span>Сума</span>
                  <strong>
                    {journalMoney(journalAmount(selected), selected.currency)}
                  </strong>
                </div>
                <div>
                  <span>Коеф.</span>
                  <strong>{Number(selected.odds).toFixed(2)}</strong>
                </div>
                <div>
                  <span>Чистий результат</span>
                  {profit(selected)}
                </div>
              </div>
              {selected.result === "Pending" && (
                <div className="journal-resolve">
                  <p>Запис очікує результату</p>
                  <button onClick={() => p.onUpdateResult(selected, "Win")}>
                    Позначити виграш
                  </button>
                  <button onClick={() => p.onUpdateResult(selected, "Loss")}>
                    Позначити програш
                  </button>
                </div>
              )}
              {journalExpress(selected) && (
                <div className="journal-express-events">
                  <h3>Події експресу</h3>
                  {parseExpressEvents(selected.betType).map((event, index) => (
                    <div key={index}>
                      <strong>
                        {index + 1}. {event.match}
                      </strong>
                      <small>
                        {event.selection} · {event.odds}
                      </small>
                    </div>
                  ))}
                  <button onClick={() => p.onExpressDetails(selected)}>
                    Повні деталі експресу →
                  </button>
                </div>
              )}
              <div className="journal-detail-goal">
                <span>Ціль</span>
                {goal(selected)}
              </div>
              {selected.strategy && (
                <div className="journal-detail-goal">
                  <span>Стратегія</span>
                  <strong>{selected.strategy}</strong>
                </div>
              )}
              <label className="journal-note-editor">
                <span>
                  <Pencil size={15} />
                  Нотатки
                </span>
                <textarea
                  value={draft}
                  disabled={saving}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Що варто врахувати наступного разу?"
                />
              </label>
              {!selected.id && (
                <p className="journal-muted">
                  Збереження нотатки доступне після синхронізації запису.
                </p>
              )}
              {noteError && (
                <p className="journal-error" role="alert">
                  {noteError}
                </p>
              )}
              <div className="journal-note-save">
                <button
                  className="journal-outline"
                  disabled={!dirty || saving || !selected.id}
                  onClick={saveNote}
                >
                  {saving ? "Збереження…" : "Зберегти нотатку"}
                </button>
              </div>
              <footer>
                <button
                  className="journal-outline"
                  onClick={() => p.onShareBet(selected)}
                >
                  <Share2 size={16} />
                  Поділитися
                </button>
                {menu(selected)}
              </footer>
            </div>
          </aside>
        )}
      </div>
      <CompactBetModal
        open={compact}
        onClose={() => setCompact(false)}
        periodFilter={compactPeriod}
        onPeriodChange={setCompactPeriod}
        month={compactMonth}
        onMonthChange={setCompactMonth}
        monthOptions={[...new Set(p.bets.map((b) => b.date.slice(0, 7)))]
          .sort()
          .reverse()
          .map((value) => ({ value, label: value }))}
        betsCount={compactBets.length}
        rows={compactBets.map((b) => (
          <div key={journalKey(b)} className="flex justify-between gap-4 py-2">
            <span>{b.match}</span>
            {profit(b)}
          </div>
        ))}
        copyText={compactText}
        onCopy={() => {
          navigator.clipboard
            .writeText(compactText)
            .then(() => toast.success("Скопійовано"))
            .catch(() => toast.error("Не вдалося скопіювати"));
        }}
      />
    </section>
  );
}
