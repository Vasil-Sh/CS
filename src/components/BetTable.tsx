import { useMemo, useState, memo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/apiClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Share2,
  Eye,
  Flag,
  FileText,
  Search,
  X,
  Trash2,
  Columns,
  Copy,
  ListChecks,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Bet } from "@/types/betting";
import { normalizeDateStr } from "@/lib/utils";
import { getBetTypeLabel } from "@/lib/displayHelpers";

interface Goal {
  id: string;
  name: string;
  type: "amount" | "ladder" | "roi" | "winrate";
  status: "active" | "completed" | "failed";
}

type TableFilterMode = "today" | "all";
type ResultFilter = "all" | "Win" | "Loss" | "Pending";
type PeriodFilter = "all" | "week" | "month" | "quarter";
type SortBy = "date" | "profit" | "odds";

const ITEMS_PER_PAGE = 10;

/** All bet table columns — id, label, default visibility */
const COLUMN_DEFS = [
  { id: "date", label: "Дата", defaultVisible: true },
  { id: "match", label: "Матч", defaultVisible: true },
  { id: "type", label: "Тип", defaultVisible: true },
  { id: "amount", label: "Сума", defaultVisible: true },
  { id: "odds", label: "Коеф.", defaultVisible: true },
  { id: "profit", label: "Профіт", defaultVisible: true },
  { id: "goal", label: "Ціль", defaultVisible: false },
  { id: "status", label: "Статус", defaultVisible: true },
  { id: "notes", label: "Нотатки", defaultVisible: false },
  { id: "actions", label: "Дії", defaultVisible: true },
] as const;

const COLUMNS_STORAGE_KEY = "matchiq_mybets_columns";

function loadVisibleColumns(): Set<string> {
  try {
    const saved = localStorage.getItem(COLUMNS_STORAGE_KEY);
    if (saved) {
      const arr = JSON.parse(saved) as string[];
      if (Array.isArray(arr) && arr.length > 0) return new Set(arr);
    }
  } catch {
    /* ignore */
  }
  return new Set(COLUMN_DEFS.filter((c) => c.defaultVisible).map((c) => c.id));
}

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

interface BetTableProps {
  bets: Bet[];
  activeBets: Bet[];
  currentUser: string;
  isAdmin: boolean;
  tableFilter: TableFilterMode;
  onTableFilterChange: (v: TableFilterMode) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  resultFilter: ResultFilter;
  onResultFilterChange: (v: ResultFilter) => void;
  periodFilter: PeriodFilter;
  onPeriodFilterChange: (v: PeriodFilter) => void;
  sortBy: SortBy;
  onSortByChange: (v: SortBy) => void;
  sortOrder: "asc" | "desc";
  currentPage: number;
  onPageChange: (p: number) => void;
  searchText: string;
  onSearchTextChange: (v: string) => void;
  onShareBet: (bet: Bet) => void;
  onBetDetails: (bet: Bet) => void;
  onExpressDetails: (bet: Bet) => void;
  onUpdateResult: (bet: Bet, result: "Win" | "Loss") => void;
  onDeleteBet: (bet: Bet) => void;
  /** Navigate to the "add" tab (parent-level tab switch) */
  onNavigateToAdd?: () => void;
}

const BetTableMemo = memo(function BetTable({
  bets,
  activeBets,
  currentUser,
  isAdmin: _isAdmin,
  tableFilter,
  onTableFilterChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  resultFilter,
  onResultFilterChange,
  periodFilter,
  onPeriodFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  currentPage,
  onPageChange,
  searchText,
  onSearchTextChange,
  onShareBet,
  onBetDetails,
  onExpressDetails,
  onUpdateResult,
  onDeleteBet,
  onNavigateToAdd,
}: BetTableProps) {
  const [notesDialogBet, setNotesDialogBet] = useState<string>("");
  const [showCompactResults, setShowCompactResults] = useState(false);
  const hasActiveAdvancedFilters =
    resultFilter !== "all" || periodFilter !== "all" || sortBy !== "date";

  const resetAdvancedFilters = () => {
    onResultFilterChange("all");
    onPeriodFilterChange("all");
    onSortByChange("date");
  };

  const [visibleColumns, setVisibleColumns] =
    useState<Set<string>>(loadVisibleColumns);

  const toggleColumn = (colId: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const toggleSort = (column: SortBy) => {
    if (sortBy === column) {
      // This is a controlled prop; parent handles desc/asc via separate props.
      // Simplified: parent should track sortOrder.
    }
    onSortByChange(column);
  };

  const sortedAndFilteredBets = useMemo(() => {
    let result = [...bets].sort((a, b) => {
      if (a.result === "Pending" && b.result !== "Pending") return -1;
      if (a.result !== "Pending" && b.result === "Pending") return 1;
      const aTime = a.createdAt
        ? new Date(a.createdAt).getTime()
        : new Date(a.date).getTime();
      const bTime = b.createdAt
        ? new Date(b.createdAt).getTime()
        : new Date(b.date).getTime();
      return bTime - aTime;
    });

    if (tableFilter === "today") {
      const targetDate = getTodayStr();
      result = result.filter(
        (bet) => normalizeDateStr(bet.date) === targetDate,
      );
    }
    if (resultFilter !== "all") {
      result = result.filter((bet) => bet.result === resultFilter);
    }
    if (periodFilter !== "all") {
      const now = new Date();
      result = result.filter((bet) => {
        const betDate = new Date(normalizeDateStr(bet.date));
        const diffDays = Math.floor(
          (now.getTime() - betDate.getTime()) / 86400000,
        );
        if (periodFilter === "week") return diffDays <= 7;
        if (periodFilter === "month") return diffDays <= 30;
        if (periodFilter === "quarter") return diffDays <= 90;
        return true;
      });
    }

    if (searchText.trim()) {
      const query = searchText.trim().toLowerCase();
      result = result.filter((bet) => {
        return (
          bet.match?.toLowerCase().includes(query) ||
          false ||
          bet.team1?.toLowerCase().includes(query) ||
          false ||
          bet.team2?.toLowerCase().includes(query) ||
          false ||
          bet.game?.toLowerCase().includes(query) ||
          false ||
          bet.tournament?.toLowerCase().includes(query) ||
          false ||
          bet.betType?.toLowerCase().includes(query) ||
          false ||
          bet.strategy?.toLowerCase().includes(query) ||
          false
        );
      });
    }

    if (sortBy !== "date") {
      result = [...result].sort((a, b) => {
        const comparison =
          sortBy === "profit"
            ? (a.profit || 0) - (b.profit || 0)
            : a.odds - b.odds;
        return sortOrder === "asc" ? comparison : -comparison;
      });
    } else if (sortOrder === "asc") {
      result = result.reverse();
    }
    return result;
  }, [
    bets,
    tableFilter,
    resultFilter,
    periodFilter,
    sortBy,
    sortOrder,
    searchText,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedAndFilteredBets.length / ITEMS_PER_PAGE),
  );
  const paginatedBets = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredBets.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedAndFilteredBets, currentPage]);

  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, "...", totalPages];
    if (currentPage >= totalPages - 2)
      return [
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const getCurrencySymbol = (currency?: string) =>
    currency === "USD" ? "$" : "₴";
  const [cachedGoals, setCachedGoals] = useState<Goal[]>([]);
  useEffect(() => {
    let cancelled = false;
    api
      .get<Goal[]>("/goals")
      .then((goals) => {
        if (!cancelled) setCachedGoals(goals);
      })
      .catch((err) => {
        if (import.meta.env.DEV)
          console.warn("[BetTable] Goals fetch failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser]);
  const getGoalName = (goalId?: string) => {
    if (!goalId) return null;
    return cachedGoals.find((g) => g.id === goalId)?.name || "Видалена ціль";
  };
  const isExpressBet = (bet: Bet) =>
    bet.betType.includes("Експрес") || (bet.format ?? "").includes("x");
  const getExpressEventCount = (bet: Bet) => {
    const match = (bet.format ?? "").match(/(\d+)x/);
    return match ? parseInt(match[1], 10) : 0;
  };

  /** Translate internal bet type codes to human-readable Ukrainian */
  function humanizeBetType(raw: string): string {
    // Already Ukrainian — return as-is (after basic cleanup)
    if (raw.match(/[а-яіїєґ]/i)) return raw;

    // Strip "MapW_HC_" prefix patterns
    const desc = raw
      // Map2_HC_T2+3.5 → Карта 2: Фора +3.5
      .replace(/^Map(\d+)_HC_T(\d+)\+?([\d.]+)/, "Карта $1: Фора +$3 ($2 матч)")
      // Map1_HC_<rest> → Карта 1: <rest>
      .replace(/^Map(\d+)_HC_(.+)/, "Карта $1: $2")
      // Map1_tb → Карта 1 (тотал більше)
      .replace(/^Map(\d+)_tb\b/, "Карта $1 (тотал більше)")
      // Map1_tm → Карта 1 (тотал менше)
      .replace(/^Map(\d+)_tm\b/, "Карта $1 (тотал менше)")
      // Map1 → Карта 1
      .replace(/^Map(\d+)_?(.+)?/, (_, n: string, rest?: string) => {
        if (!rest) return `Карта ${n}`;
        const humanRest = rest
          .replace(/_/g, " ")
          .replace(/\btb\b/g, "тотал більше")
          .replace(/\btm\b/g, "тотал менше")
          .replace(/\bHC\b/g, "Фора");
        return `Карта ${n}: ${humanRest}`;
      })
      // Match Winner → Победа матч
      .replace(/^Match\s*Winner$/i, "Победа матч")
      // Over → Тотал більше
      .replace(/^Over\s*([\d.]+)/, "Тотал більше $1")
      // Under → Тотал менше
      .replace(/^Under\s*([\d.]+)/, "Тотал менше $1")
      // Generic: replace underscores with spaces
      .replace(/_/g, " ");

    return desc || raw;
  }

  // Build compact results list for quick sharing
  const compactResultsText = useMemo(() => {
    const completed = sortedAndFilteredBets
      .filter((b) => b.result === "Win" || b.result === "Loss")
      .slice(0, 100);
    return completed
      .map((b) => {
        const icon = b.result === "Win" ? "✅" : "✖️";
        const odds = Number(b.odds).toFixed(2);
        const isCS = (b.game || "").toLowerCase().startsWith("cs");
        const gameEmoji = isCS ? " 🎯" : " 🛡️";
        // Selected team: use selection field, or extract from betType (last part after dash)
        const selectedTeam =
          b.selection || b.betType.match(/[-–—]\s*(.+)$/)?.[1] || b.team1 || "";
        // Bet description: strip selected team from end, then humanize
        const rawDesc = b.betType.replace(/\s*[-–—]\s*[^\-–—]+$/, "").trim();
        // Humanize internal codes to readable Ukrainian
        const betDesc = humanizeBetType(rawDesc);
        return `${icon}~${odds}. ${selectedTeam}${gameEmoji}, ${betDesc}`;
      })
      .join("\n");
  }, [sortedAndFilteredBets]);

  const handleCopyCompact = () => {
    navigator.clipboard.writeText(compactResultsText).then(() => {
      // toast handled by parent or just silent
    });
  };

  return (
    <div
      className="bg-white border border-gray-300 rounded-3xl overflow-hidden"
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-gray-900" strokeWidth={1.5} />
          <span className="text-lg font-semibold text-gray-900">
            Останні записи
          </span>
          {activeBets.length > 0 && (
            <Badge className="rounded-full bg-amber-100 text-amber-600 border-0 text-sm font-medium px-3 py-0.5 hover:bg-amber-100">
              {activeBets.length} активних
            </Badge>
          )}
        </div>
        <button
          onClick={() => setShowCompactResults(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
          title="Стислий список результатів"
        >
          <ListChecks className="h-4 w-4" strokeWidth={1.5} />
          Результати
        </button>
      </div>

      {/* Filter Bar */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3 px-6 py-3.5">
          <Filter className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
          <span className="text-sm text-gray-500 font-medium mr-1">
            Фільтр:
          </span>
          <button
            onClick={() => onTableFilterChange("today")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${tableFilter === "today" ? "bg-gray-900 text-white shadow-sm" : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
          >
            Сьогодні
          </button>
          <button
            onClick={() => onTableFilterChange("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${tableFilter === "all" ? "bg-gray-900 text-white shadow-sm" : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
          >
            Всі матчі
          </button>
          <button
            onClick={onToggleAdvancedFilters}
            className={`ml-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${showAdvancedFilters || hasActiveAdvancedFilters ? "bg-blue-50 text-blue-500 border border-blue-200" : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
          >
            {showAdvancedFilters ? (
              <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.5} />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
            Розширені
            {hasActiveAdvancedFilters && !showAdvancedFilters && (
              <span className="flex items-center justify-center w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
          {hasActiveAdvancedFilters && (
            <button
              onClick={resetAdvancedFilters}
              className="px-3 py-2 rounded-xl text-sm font-medium text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-all duration-200"
            >
              Скинути
            </button>
          )}
          {/* Columns toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-2 px-4 py-2 rounded-xl text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 flex items-center gap-1.5">
                <Columns className="h-3.5 w-3.5" strokeWidth={1.5} />
                Колонки
                <ChevronDown className="h-3 w-3 opacity-60" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-xl p-1 min-w-[200px]"
            >
              {COLUMN_DEFS.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={visibleColumns.has(col.id)}
                  onCheckedChange={() => toggleColumn(col.id)}
                  className="rounded-lg text-sm"
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search */}
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"
                strokeWidth={1.5}
              />
              <input
                type="text"
                value={searchText}
                onChange={(e) => onSearchTextChange(e.target.value)}
                placeholder="Пошук за матчем, командою, грою…"
                className="pl-9 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 w-56 focus:outline-none focus:border-gray-900 transition-colors"
              />
              {searchText && (
                <button
                  onClick={() => onSearchTextChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              )}
            </div>
            <span className="text-sm text-gray-400 whitespace-nowrap">
              {sortedAndFilteredBets.length}{" "}
              {sortedAndFilteredBets.length === 1
                ? "запис"
                : sortedAndFilteredBets.length >= 2 &&
                    sortedAndFilteredBets.length <= 4
                  ? "записи"
                  : "записів"}
              {(tableFilter !== "all" ||
                hasActiveAdvancedFilters ||
                !!searchText) &&
                ` з ${bets.length}`}
            </span>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="px-6 py-4 border-t border-gray-100 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="result-filter"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Результат:
                </label>
                <Select
                  value={resultFilter}
                  onValueChange={(v) => onResultFilterChange(v as ResultFilter)}
                >
                  <SelectTrigger className="rounded-xl border-gray-200 bg-white h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі</SelectItem>
                    <SelectItem value="Win">Виграш</SelectItem>
                    <SelectItem value="Loss">Програш</SelectItem>
                    <SelectItem value="Pending">Очікується</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label
                  htmlFor="period-filter"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Період:
                </label>
                <Select
                  value={periodFilter}
                  onValueChange={(v) => onPeriodFilterChange(v as PeriodFilter)}
                >
                  <SelectTrigger className="rounded-xl border-gray-200 bg-white h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Весь час</SelectItem>
                    <SelectItem value="week">Останній тиждень</SelectItem>
                    <SelectItem value="month">Останній місяць</SelectItem>
                    <SelectItem value="quarter">Останній квартал</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label
                  htmlFor="sort-filter"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Сортування:
                </label>
                <Select
                  value={sortBy}
                  onValueChange={(v) => onSortByChange(v as SortBy)}
                >
                  <SelectTrigger className="rounded-xl border-gray-200 bg-white h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">За датою</SelectItem>
                    <SelectItem value="profit">За прибутком</SelectItem>
                    <SelectItem value="odds">За коефіцієнтом</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="px-0 pb-6">
        {sortedAndFilteredBets.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {visibleColumns.has("date") && (
                      <th
                        className="text-center px-4 py-3.5 text-sm font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleSort("date")}
                      >
                        <div className="flex items-center justify-center gap-2">
                          Дата
                          <ArrowUpDown className="h-3 w-3" strokeWidth={1.5} />
                        </div>
                      </th>
                    )}
                    {visibleColumns.has("match") && (
                      <th className="text-left px-4 py-3.5 text-sm font-semibold text-gray-500 uppercase tracking-wider min-w-[220px] border-l border-gray-200">
                        Матч
                      </th>
                    )}
                    {visibleColumns.has("type") && (
                      <th className="text-center px-4 py-3.5 text-sm font-semibold text-gray-500 uppercase tracking-wider border-l border-gray-200">
                        Тип
                      </th>
                    )}
                    {visibleColumns.has("amount") && (
                      <th className="text-center px-4 py-3.5 text-sm font-semibold text-gray-500 uppercase tracking-wider border-l border-gray-200">
                        Сума
                      </th>
                    )}
                    {visibleColumns.has("odds") && (
                      <th
                        className="text-center px-4 py-3.5 text-sm font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors border-l border-gray-200"
                        onClick={() => toggleSort("odds")}
                      >
                        <div className="flex items-center justify-center gap-2">
                          Коеф.
                          <ArrowUpDown className="h-3 w-3" strokeWidth={1.5} />
                        </div>
                      </th>
                    )}
                    {visibleColumns.has("profit") && (
                      <th
                        className="text-center px-4 py-3.5 text-sm font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors border-l border-gray-200"
                        onClick={() => toggleSort("profit")}
                      >
                        <div className="flex items-center justify-center gap-2">
                          Профіт
                          <ArrowUpDown className="h-3 w-3" strokeWidth={1.5} />
                        </div>
                      </th>
                    )}
                    {visibleColumns.has("goal") && (
                      <th className="text-center px-4 py-3.5 text-sm font-semibold text-gray-500 uppercase tracking-wider border-l border-gray-200">
                        Ціль
                      </th>
                    )}
                    {visibleColumns.has("status") && (
                      <th className="text-center px-4 py-3.5 text-sm font-semibold text-gray-500 uppercase tracking-wider border-l border-gray-200">
                        Статус
                      </th>
                    )}
                    {visibleColumns.has("notes") && (
                      <th className="text-center px-3 py-3.5 text-sm font-semibold text-gray-500 uppercase tracking-wider border-l border-gray-200">
                        Нотатки
                      </th>
                    )}
                    {visibleColumns.has("actions") && (
                      <th className="text-center px-4 py-3.5 text-sm font-semibold text-gray-500 uppercase tracking-wider border-l border-gray-200">
                        Дії
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedBets.map((bet) => {
                    const isPending = bet.result === "Pending";
                    const isWin = bet.result === "Win";
                    const isLoss = bet.result === "Loss";
                    const currency = bet.currency || "UAH";
                    const currencySymbol = getCurrencySymbol(currency);
                    const displayAmount = bet.originalAmount || bet.amount;
                    // Use bet.profit (computed on result change, always in UAH), fallback to originalProfit
                    const rawProfit = Number(bet.profit);
                    let displayProfit: number | undefined = isNaN(rawProfit)
                      ? undefined
                      : rawProfit;
                    // Convert UAH profit back to original currency for USD bets
                    if (
                      displayProfit !== undefined &&
                      bet.currency === "USD" &&
                      bet.exchangeRate
                    ) {
                      const rate = Number(bet.exchangeRate);
                      if (rate > 0) displayProfit = displayProfit / rate;
                    }
                    if (displayProfit === undefined) {
                      const op = Number(bet.originalProfit);
                      if (!isNaN(op)) {
                        displayProfit =
                          bet.currency === "USD" && bet.exchangeRate
                            ? op / Number(bet.exchangeRate)
                            : op;
                      }
                    }
                    const goalName = getGoalName(bet.goalId);
                    const isExpress = isExpressBet(bet);
                    const expressEventCount = isExpress
                      ? getExpressEventCount(bet)
                      : 0;
                    const betKey =
                      bet.id ||
                      bet.createdAt?.toString() ||
                      `${bet.date}-${bet.match || bet.team1}-${bet.amount}-${bet.odds}-${Math.random()}`;

                    return (
                      <tr
                        key={betKey}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                      >
                        {visibleColumns.has("date") && (
                          <td className="px-4 py-4 text-center">
                            <span className="text-base text-gray-700 font-medium">
                              {bet.date}
                            </span>
                          </td>
                        )}
                        {visibleColumns.has("match") && (
                          <td className="px-4 py-4 border-l border-gray-100">
                            <div className="min-w-0">
                              <div
                                className="font-semibold text-base text-gray-900 truncate"
                                title={
                                  bet.match || `${bet.team1} vs ${bet.team2}`
                                }
                              >
                                {bet.match || `${bet.team1} vs ${bet.team2}`}
                              </div>
                              {!isExpress && (
                                <div
                                  className="text-sm text-gray-400 truncate mt-0.5"
                                  title={getBetTypeLabel(
                                    bet.betType.split(" - ")[0],
                                    bet.format,
                                  )}
                                >
                                  {getBetTypeLabel(
                                    bet.betType.split(" - ")[0],
                                    bet.format,
                                  )}{" "}
                                  {bet.betType.includes(" - ")
                                    ? `- ${bet.betType.split(" - ").slice(1).join(" - ")}`
                                    : ""}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 font-medium mt-1.5 flex items-center gap-1">
                                {bet.game && (
                                  <img
                                    src={
                                      bet.game.toLowerCase() === "dota2"
                                        ? "/assets/team-placeholder-dota.svg"
                                        : "/assets/team-placeholder.svg"
                                    }
                                    alt={bet.game}
                                    className="h-3.5 w-3.5 object-contain opacity-80 flex-shrink-0"
                                  />
                                )}
                                {bet.game
                                  ? `${bet.game} • ${bet.format ?? ""}`
                                  : (bet.format ?? "")}
                              </div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.has("type") && (
                          <td className="px-4 py-4 text-center border-l border-gray-100">
                            {isExpress ? (
                              <div className="flex flex-col items-center gap-1.5">
                                <Badge className="rounded-md bg-amber-100 text-amber-600 border-0 font-semibold text-sm px-2.5 py-1 hover:bg-amber-100">
                                  Express {expressEventCount}×
                                </Badge>
                                <button
                                  onClick={() => onExpressDetails(bet)}
                                  className="text-sm text-purple-600 hover:text-purple-700 font-medium bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-md transition-colors duration-200"
                                >
                                  Деталі
                                </button>
                              </div>
                            ) : (
                              <Badge
                                className="rounded-md bg-blue-50 text-blue-500 border-0 font-medium text-sm px-2.5 py-1 max-w-[160px] truncate hover:bg-blue-50"
                                title={
                                  bet.betType.split(" - ")[1] ||
                                  getBetTypeLabel(
                                    bet.betType.split(" - ")[0],
                                    bet.format,
                                  )
                                }
                              >
                                {bet.betType.split(" - ")[1] ||
                                  getBetTypeLabel(
                                    bet.betType.split(" - ")[0],
                                    bet.format,
                                  )}
                              </Badge>
                            )}
                          </td>
                        )}
                        {visibleColumns.has("amount") && (
                          <td className="px-4 py-4 text-center border-l border-gray-100">
                            <span className="text-base font-semibold text-gray-900">
                              {currencySymbol}
                              {displayAmount}
                            </span>
                          </td>
                        )}
                        {visibleColumns.has("odds") && (
                          <td className="px-4 py-4 text-center border-l border-gray-100">
                            <span className="text-base font-bold text-gray-900">
                              {Number(bet.odds).toFixed(2)}
                            </span>
                          </td>
                        )}
                        {visibleColumns.has("profit") && (
                          <td className="px-4 py-4 text-center border-l border-gray-100">
                            {displayProfit !== undefined &&
                            displayProfit !== null ? (
                              <span
                                className={`text-base font-bold ${displayProfit >= 0 ? "text-green-500" : "text-red-500"}`}
                              >
                                {displayProfit >= 0 ? "+" : ""}
                                {displayProfit.toFixed(2)} {currencySymbol}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-base">—</span>
                            )}
                          </td>
                        )}
                        {visibleColumns.has("goal") && (
                          <td className="px-4 py-4 text-center border-l border-gray-100">
                            {goalName ? (
                              <Badge
                                className="font-medium px-2.5 py-1 rounded-md bg-blue-50 text-blue-500 border-0 text-sm max-w-[130px] truncate hover:bg-blue-50"
                                title={goalName}
                              >
                                <Flag
                                  className="h-3.5 w-3.5 mr-1.5 flex-shrink-0"
                                  strokeWidth={1.5}
                                />
                                <span className="truncate">{goalName}</span>
                              </Badge>
                            ) : (
                              <span className="text-gray-300 text-sm">—</span>
                            )}
                          </td>
                        )}
                        {visibleColumns.has("status") && (
                          <td className="px-4 py-4 text-center border-l border-gray-100">
                            <Badge
                              className={`rounded-full border-0 font-semibold text-sm px-3.5 py-1.5 ${isWin ? "bg-green-100 text-green-600 hover:bg-green-100" : isLoss ? "bg-red-100 text-red-600 hover:bg-red-100" : "bg-amber-100 text-amber-600 hover:bg-amber-100"}`}
                            >
                              {isWin
                                ? "Виграш"
                                : isLoss
                                  ? "Програш"
                                  : "Очікується"}
                            </Badge>
                          </td>
                        )}
                        {visibleColumns.has("notes") && (
                          <td className="px-3 py-4 text-center border-l border-gray-100">
                            {bet.notes ? (
                              <div className="relative group inline-block">
                                <button
                                  onClick={() =>
                                    setNotesDialogBet(bet.notes || "")
                                  }
                                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-blue-500 transition-all duration-200"
                                  title="Переглянути нотатки"
                                >
                                  <FileText
                                    className="h-4 w-4"
                                    strokeWidth={1.5}
                                  />
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-300 text-sm">—</span>
                            )}
                          </td>
                        )}
                        {visibleColumns.has("actions") && (
                          <td className="px-4 py-4 text-center border-l border-gray-100">
                            <div className="flex gap-2 justify-center">
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => onUpdateResult(bet, "Win")}
                                    className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 hover:bg-green-100 hover:border-green-300 text-green-600 transition-all duration-200"
                                    title="Виграш"
                                  >
                                    <CheckCircle
                                      className="h-4 w-4"
                                      strokeWidth={2}
                                    />
                                  </button>
                                  <button
                                    onClick={() => onUpdateResult(bet, "Loss")}
                                    className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 hover:bg-red-100 hover:border-red-300 text-red-600 transition-all duration-200"
                                    title="Програш"
                                  >
                                    <XCircle
                                      className="h-4 w-4"
                                      strokeWidth={2}
                                    />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => onShareBet(bet)}
                                className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-blue-500 transition-all duration-200"
                                title="Поділитися"
                              >
                                <Share2 className="h-4 w-4" strokeWidth={2} />
                              </button>
                              {!isPending && (
                                <button
                                  onClick={() => onDeleteBet(bet)}
                                  className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 hover:bg-red-100 hover:border-red-300 text-red-600 transition-all duration-200"
                                  title="Видалити"
                                >
                                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                                </button>
                              )}
                              <button
                                onClick={() => onBetDetails(bet)}
                                className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 hover:bg-purple-50 hover:border-purple-300 text-purple-600 transition-all duration-200"
                                title="Деталі"
                              >
                                <Eye className="h-4 w-4" strokeWidth={2} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-6 px-6">
                <button
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}`}
                  title="Попередня"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                </button>
                {getPageNumbers().map((page, idx) =>
                  page === "..." ? (
                    <span
                      key={`dots-${idx}`}
                      className="flex items-center justify-center w-9 h-9 text-sm text-gray-400"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`flex items-center justify-center min-w-[36px] h-9 rounded-xl text-sm font-medium transition-all duration-200 px-2 ${currentPage === page ? "bg-gray-900 text-white shadow-sm" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  onClick={() =>
                    onPageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}`}
                  title="Наступна"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center py-16 text-center">
            <div>
              <div className="p-8 bg-gray-100 rounded-2xl inline-block mb-6">
                <Calendar
                  className="h-16 w-16 text-gray-400"
                  strokeWidth={1.5}
                />
              </div>
              {tableFilter === "today" ? (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Немає записів за сьогодні
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Додайте новий запис або перегляньте всі матчі
                  </p>
                  <Button
                    onClick={() => onTableFilterChange("all")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-base font-semibold transition-colors"
                  >
                    Показати всі матчі
                  </Button>
                </>
              ) : hasActiveAdvancedFilters ? (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Немає записів за обраними фільтрами
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Спробуйте змінити параметри фільтрації
                  </p>
                  <Button
                    onClick={resetAdvancedFilters}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-base font-semibold transition-colors"
                  >
                    Скинути фільтри
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Поки що немає записів
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Додайте свій перший запис, щоб почати відстеження
                  </p>
                  <Button
                    onClick={() => onNavigateToAdd?.()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-base font-semibold transition-colors"
                  >
                    <Flag className="h-4 w-4" strokeWidth={2} />
                    Додати запис
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notes Dialog */}
      <Dialog
        open={!!notesDialogBet}
        onOpenChange={(open) => {
          if (!open) setNotesDialogBet("");
        }}
      >
        <DialogContent
          className="max-w-xl max-h-[80vh] overflow-y-auto border border-[#E5E7EB] rounded-3xl bg-white p-0 gap-0"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}
        >
          <DialogHeader className="px-6 pt-5 pb-4">
            <DialogTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 flex-shrink-0">
                  <FileText
                    className="h-5 w-5 text-[#447afc]"
                    strokeWidth={1.5}
                  />
                </div>
                <h2 className="text-lg font-semibold text-[#111827] tracking-tight">
                  Нотатки до запису
                </h2>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="border-t border-[#E5E7EB]" />

          <div className="px-6 py-5 space-y-4 bg-[#F3F4F6]">
            <div className="space-y-3">
              {notesDialogBet
                .split("\n")
                .filter(Boolean)
                .map((line, i) => {
                  const isResult = line.startsWith("Результат:");
                  const isComment = line.startsWith("Коментар:");
                  if (isResult) {
                    const val = line.replace("Результат:", "").trim();
                    const isWin = val === "Виграш";
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm"
                      >
                        <span className="text-sm text-gray-400">
                          Результат:
                        </span>
                        <span
                          className={`text-sm font-semibold ${isWin ? "text-green-600" : "text-red-600"}`}
                        >
                          {val}
                        </span>
                      </div>
                    );
                  }
                  if (isComment) {
                    return (
                      <div
                        key={i}
                        className="rounded-2xl bg-white border border-[#E5E7EB] shadow-sm p-4"
                      >
                        <span className="text-xs text-gray-400 block mb-1">
                          Коментар:
                        </span>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {line.replace("Коментар:", "").trim()}
                        </p>
                      </div>
                    );
                  }
                  if (
                    line.startsWith("Key Factors:") ||
                    line.startsWith("Notes:")
                  )
                    return null;
                  return (
                    <div
                      key={i}
                      className="rounded-2xl bg-white border border-[#E5E7EB] shadow-sm p-3"
                    >
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {line}
                      </p>
                    </div>
                  );
                })}
            </div>
            <Button
              onClick={() => setNotesDialogBet("")}
              className="rounded-xl bg-[#447afc] hover:bg-[#3568d4] text-white w-full"
            >
              Закрити
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compact Results Modal */}
      <Dialog open={showCompactResults} onOpenChange={setShowCompactResults}>
        <DialogContent className="max-w-lg border border-[#E5E7EB] rounded-3xl bg-white p-0 gap-0">
          <DialogHeader className="px-6 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 flex-shrink-0">
                    <ListChecks
                      className="h-5 w-5 text-[#447afc]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h2 className="text-lg font-semibold text-[#111827] tracking-tight">
                    Результати
                  </h2>
                </div>
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="border-t border-[#E5E7EB]" />
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto bg-[#F9FAFB]">
            {compactResultsText ? (
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed bg-white p-4 rounded-2xl border border-gray-200">
                {compactResultsText}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-6 bg-gray-100 rounded-2xl inline-block mb-4">
                  <ListChecks
                    className="h-10 w-10 text-gray-400"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-gray-500 text-sm">
                  Немає завершених ставок для відображення
                </p>
              </div>
            )}
          </div>
          <div className="border-t border-[#E5E7EB] px-6 py-4 bg-white flex gap-3">
            <Button
              onClick={handleCopyCompact}
              disabled={!compactResultsText}
              className="flex-1 rounded-xl bg-[#447afc] hover:bg-[#3568d4] text-white flex items-center gap-2"
            >
              <Copy className="h-4 w-4" strokeWidth={1.5} />
              Копіювати
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCompactResults(false)}
              className="flex-1 rounded-xl"
            >
              Закрити
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default BetTableMemo;
