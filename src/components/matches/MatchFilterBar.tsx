import {
  CalendarDays,
  RefreshCw,
  Search,
  Loader2,
  X,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  COLUMN_DEFS,
  type FilterStatus,
  type FilterMatchType,
  type FilterDay,
} from "@/hooks/useMatches";

interface MatchFilterBarProps {
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  filterStatus: FilterStatus;
  onStatusChange: (v: FilterStatus) => void;
  filterMatchType: FilterMatchType;
  onMatchTypeChange: (v: FilterMatchType) => void;
  filterTournament: string;
  tournamentOptions: string[];
  onTournamentChange: (v: string) => void;
  filterDayOfWeek: FilterDay;
  onDayChange: (v: FilterDay) => void;
  visibleColumns: Set<string>;
  onToggleColumn: (id: string) => void;
  hasActiveFilters: boolean;
  onReset: () => void;
  onRefresh: () => void;
  onPastDaysOpen: () => void;
}

const DAY_LABELS: Record<string, string> = {
  all: "Всі дні",
  mon: "Понеділок",
  tue: "Вівторок",
  wed: "Середа",
  thu: "Четвер",
  fri: "П'ятниця",
  sat: "Субота",
  sun: "Неділя",
};

export default function MatchFilterBar({
  isLoading,
  searchQuery,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterMatchType,
  onMatchTypeChange,
  filterTournament,
  tournamentOptions,
  onTournamentChange,
  filterDayOfWeek,
  onDayChange,
  visibleColumns,
  onToggleColumn,
  hasActiveFilters,
  onReset,
  onRefresh,
  onPastDaysOpen,
}: MatchFilterBarProps) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm border-2 border-stone-200 p-3 rounded-[32px] flex-wrap justify-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-4 text-base rounded-[24px] font-semibold bg-primary text-white hover:bg-blue-400 shadow-[0_2px_8px_rgba(68,122,252,0.3)] transition-all duration-300 ease-in-out disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <RefreshCw className="h-4 w-4" strokeWidth={2} />
          )}
          Оновити
        </button>

        {/* Результати */}
        <button
          onClick={onPastDaysOpen}
          className="flex items-center gap-2 px-5 py-4 text-base rounded-[24px] transition-all duration-300 ease-in-out bg-transparent text-gray-900 font-light border border-stone-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
        >
          <CalendarDays className="h-4 w-4" strokeWidth={1.5} />
          <span>Результати</span>
        </button>

        {/* Search */}
        <div className="relative min-w-[140px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            strokeWidth={1.5}
          />
          <Input
            placeholder="Пошук..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 rounded-[24px] border border-stone-200 bg-transparent text-base text-gray-900 placeholder:text-gray-500 focus:bg-white focus:shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:border-gray-300 transition-all duration-300 h-full py-4 min-h-[56px]"
          />
        </div>

        {/* Status */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`relative px-5 py-4 text-base rounded-[24px] transition-all duration-300 ease-in-out flex items-center gap-2 ${filterStatus !== "all" ? "bg-white text-gray-900 font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)] border-transparent" : "bg-transparent text-gray-900 font-light border border-stone-200"}`}
            >
              {filterStatus === "all"
                ? "Статус"
                : filterStatus === "live"
                  ? "🔴 LIVE"
                  : filterStatus === "upcoming"
                    ? "Очікуються"
                    : filterStatus === "finished"
                      ? "Завершені"
                      : filterStatus === "postponed"
                        ? "⏸️ Перенесені"
                        : "❌ Скасовані"}
              <ChevronDown className="h-4 w-4 opacity-50" strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="rounded-xl p-1">
            {(
              [
                ["all", "Всі статуси"],
                ["live", "🔴 LIVE"],
                ["upcoming", "🕐 Очікуються"],
                ["finished", "✅ Завершені"],
                ["postponed", "⏸️ Перенесені"],
                ["cancelled", "❌ Скасовані"],
              ] as const
            ).map(([k, v]) => (
              <DropdownMenuItem
                key={k}
                onClick={() => onStatusChange(k as FilterStatus)}
                className="rounded-lg"
              >
                {v}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Format */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`relative px-5 py-4 text-base rounded-[24px] transition-all duration-300 ease-in-out flex items-center gap-2 ${filterMatchType !== "all" ? "bg-white text-gray-900 font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)] border-transparent" : "bg-transparent text-gray-900 font-light border border-stone-200"}`}
            >
              {filterMatchType === "all" ? "Формат" : filterMatchType}
              <ChevronDown className="h-4 w-4 opacity-50" strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="rounded-xl p-1">
            {(["all", "Bo1", "Bo2", "Bo3", "Bo5"] as const).map((f) => (
              <DropdownMenuItem
                key={f}
                onClick={() => onMatchTypeChange(f)}
                className="rounded-lg"
              >
                {f === "all" ? "Всі формати" : f}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tournament */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`relative px-5 py-4 text-base rounded-[24px] transition-all duration-300 ease-in-out flex items-center gap-2 ${filterTournament !== "all" ? "bg-white text-gray-900 font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)] border-transparent" : "bg-transparent text-gray-900 font-light border border-stone-200"}`}
            >
              {filterTournament === "all"
                ? "Турнір"
                : filterTournament.length > 15
                  ? filterTournament.slice(0, 15) + "…"
                  : filterTournament}
              <ChevronDown className="h-4 w-4 opacity-50" strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="rounded-xl p-1 max-h-64 overflow-y-auto"
          >
            <DropdownMenuItem
              onClick={() => onTournamentChange("all")}
              className="rounded-lg"
            >
              Всі турніри
            </DropdownMenuItem>
            {tournamentOptions.map((t) => (
              <DropdownMenuItem
                key={t}
                onClick={() => onTournamentChange(t)}
                className="rounded-lg text-sm"
              >
                {t}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Day */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`relative px-5 py-4 text-base rounded-[24px] transition-all duration-300 ease-in-out flex items-center gap-2 ${filterDayOfWeek !== "all" ? "bg-white text-gray-900 font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)] border-transparent" : "bg-transparent text-gray-900 font-light border border-stone-200"}`}
            >
              {DAY_LABELS[filterDayOfWeek]}
              <ChevronDown className="h-4 w-4 opacity-50" strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="rounded-xl p-1">
            {Object.entries(DAY_LABELS).map(([k, v]) => (
              <DropdownMenuItem
                key={k}
                onClick={() => onDayChange(k as FilterDay)}
                className="rounded-lg"
              >
                {v}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Columns */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative px-5 py-4 text-base rounded-[24px] border border-stone-200 transition-all duration-300 ease-in-out flex items-center gap-2 bg-transparent text-gray-900 font-light">
              Колонки
              <ChevronDown className="h-4 w-4 opacity-50" strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="rounded-xl p-1 min-w-[200px]"
          >
            {COLUMN_DEFS.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={visibleColumns.has(col.id)}
                onCheckedChange={() => onToggleColumn(col.id)}
                className="rounded-lg text-sm"
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Reset */}
        {hasActiveFilters && (
          <>
            <div className="w-px h-7 bg-stone-200 mx-0.5" />
            <button
              onClick={onReset}
              className="relative px-6 py-4 text-base rounded-[24px] transition-all duration-300 ease-in-out flex items-center gap-2 bg-red-500 text-white hover:bg-red-600 font-semibold shadow-[0_2px_8px_rgba(239,68,68,0.3)]"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
              Скинути
            </button>
          </>
        )}
      </div>
    </div>
  );
}
