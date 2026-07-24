import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, Trophy, X, Loader2, Search, Filter } from "lucide-react";

interface PastDaysModalProps {
  open: boolean;
  onClose: () => void;
}

/** Minimal match shape from /api/v1/matches-history */
interface HistoryMatch {
  id: string;
  game: string;
  team1: string;
  team2: string;
  date: string;
  score1: number;
  score2: number;
  status: string;
  tournament: string;
  matchType: string;
  logoTeam1: string | null;
  logoTeam2: string | null;
}

/** Convert CDN URL to backend proxy URL */
const proxyLogo = (url: string | null, game: string): string | null => {
  if (!url) return null;
  // Already proxied
  if (url.startsWith("/api/")) return url;
  // Extract filename from CDN URL
  const parts = url.split("/");
  const filename = parts[parts.length - 1];
  const prefix = game === "cs2" ? "cs2-matches" : "dota2-matches";
  return `/api/v1/${prefix}/logo/${filename}`;
};

/** Team logo with error fallback to placeholder SVG */
function TeamLogo({
  src,
  alt,
  game,
  size = 20,
}: {
  src: string | null;
  alt: string;
  game: string;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const fallback =
    game === "cs2"
      ? "/assets/team-placeholder.svg"
      : "/assets/team-placeholder-dota.svg";

  if (!src || imgError) {
    return (
      <img
        src={fallback}
        alt={alt}
        className="object-contain flex-shrink-0"
        style={{ width: size, height: size, minWidth: size }}
      />
    );
  }

  return (
    <img
      src={proxyLogo(src, game)}
      alt={alt}
      className="rounded object-contain flex-shrink-0"
      style={{ width: size, height: size, minWidth: size }}
      onError={() => setImgError(true)}
    />
  );
}

/** Format date to readable Ukrainian: "23 липня 2026" */
const formatDate = (dateStr: string): string => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const months = [
    "січня",
    "лютого",
    "березня",
    "квітня",
    "травня",
    "червня",
    "липня",
    "серпня",
    "вересня",
    "жовтня",
    "листопада",
    "грудня",
  ];
  return `${d} ${months[m - 1]} ${y}`;
};

export default function PastDaysModal({ open, onClose }: PastDaysModalProps) {
  const [matches, setMatches] = useState<HistoryMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameFilter, setGameFilter] = useState<"all" | "cs2" | "dota2">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [daysBack, setDaysBack] = useState(7);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch(`/api/v1/matches-history?days=${daysBack}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: HistoryMatch[]) => {
        setMatches(data);
      })
      .catch((e) => {
        console.error("[PastDaysModal] Fetch failed:", e);
        setError("Не вдалося завантажити історію матчів");
      })
      .finally(() => setLoading(false));
  }, [open]);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (gameFilter === "cs2" && m.game !== "cs2") return false;
      if (gameFilter === "dota2" && m.game !== "dota2") return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !m.team1.toLowerCase().includes(q) &&
          !m.team2.toLowerCase().includes(q) &&
          !m.tournament.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [matches, gameFilter, searchQuery]);

  // Group by date
  const grouped: Record<string, HistoryMatch[]> = {};
  filteredMatches.forEach((m) => {
    const key = m.date;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  });

  const dateKeys = Object.keys(grouped).sort().reverse();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] rounded-3xl border border-gray-100 bg-white p-0 gap-0 [&>button]:hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 flex-shrink-0">
              <CalendarDays
                className="h-5 w-5 text-blue-500"
                strokeWidth={1.5}
              />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-bold text-gray-900">
                Результати
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-0.5 font-normal">
                {filteredMatches.length} матчів за {dateKeys.length} днів
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
            </button>
          </div>

          {/* Filters bar */}
          {!loading && matches.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                {[3, 7, 14, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDaysBack(d)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      daysBack === d
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {d}д
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                {(["all", "cs2", "dota2"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGameFilter(g)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      gameFilter === g
                        ? g === "cs2"
                          ? "bg-amber-600 text-white shadow-sm"
                          : g === "dota2"
                            ? "bg-purple-600 text-white shadow-sm"
                            : "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {g === "all" ? "Всі" : g === "cs2" ? "CS2" : "Dota 2"}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 min-w-[140px]">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"
                  strokeWidth={1.5}
                />
                <input
                  type="text"
                  placeholder="Пошук..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-100 rounded-lg border-0 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 pb-6 pt-4 bg-gray-100 max-h-[calc(85vh-140px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="size-10 mb-3 animate-spin" strokeWidth={1} />
              <p className="text-sm text-gray-900">Завантаження...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="flex items-center justify-center size-24 rounded-2xl bg-white mb-3">
                <CalendarDays className="size-[72px]" strokeWidth={1} />
              </div>
              <p className="text-sm text-gray-900">Немає завершених матчів</p>
            </div>
          ) : (
            dateKeys.map((dateKey) => {
              const dayMatches = grouped[dateKey].sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime(),
              );
              return (
                <PastDayGroup
                  key={dateKey}
                  dateKey={dateKey}
                  matches={dayMatches}
                />
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Single date group with match rows */
function PastDayGroup({
  dateKey,
  matches,
}: {
  dateKey: string;
  matches: HistoryMatch[];
}) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-xs font-medium text-gray-900 uppercase tracking-wider whitespace-nowrap">
          {formatDate(dateKey)}
        </span>
        <div className="h-px flex-1 bg-gray-100" />
      </div>

      <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
        {matches.map((match, idx) => {
          const team1Won = (match.score1 ?? 0) > (match.score2 ?? 0);
          const team2Won = (match.score2 ?? 0) > (match.score1 ?? 0);

          return (
            <div
              key={match.id}
              className={`flex items-center gap-4 px-4 py-3 ${
                idx < matches.length - 1 ? "border-b border-gray-200" : ""
              } hover:bg-gray-50 transition-colors`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-[2] justify-end">
                <span
                  className={`text-sm font-medium truncate ${team1Won ? "text-gray-900" : "text-gray-500"}`}
                >
                  {match.team1}
                </span>
                <TeamLogo
                  src={match.logoTeam1}
                  alt={match.team1}
                  game={match.game}
                />
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span
                  className={`text-sm font-bold tabular-nums ${team1Won ? "text-green-600" : "text-gray-400"}`}
                >
                  {match.score1 ?? "-"}
                </span>
                <span className="text-xs text-gray-300">:</span>
                <span
                  className={`text-sm font-bold tabular-nums ${team2Won ? "text-green-600" : "text-gray-400"}`}
                >
                  {match.score2 ?? "-"}
                </span>
              </div>

              <div className="flex items-center gap-2 min-w-0 flex-[2]">
                <TeamLogo
                  src={match.logoTeam2}
                  alt={match.team2}
                  game={match.game}
                />
                <span
                  className={`text-sm font-medium truncate ${team2Won ? "text-gray-900" : "text-gray-500"}`}
                >
                  {match.team2}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0 text-xs text-gray-400 min-w-[200px] justify-end">
                <Trophy className="h-3 w-3 flex-shrink-0" strokeWidth={1.5} />
                <span className="truncate max-w-[160px]">
                  {match.tournament}
                </span>
                {match.matchType && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="font-medium text-gray-500">
                      {match.matchType}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
