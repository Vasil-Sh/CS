import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, Trophy, X } from "lucide-react";
import type { Match } from "@/pages/Matches";

interface PastDaysModalProps {
  open: boolean;
  onClose: () => void;
  matches: Match[];
}

/** Format date key for grouping: "YYYY-MM-DD" */
const getDateKey = (dateStr: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const m = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(dateStr);
  return d.toISOString().split("T")[0];
};

/** Get today's date key */
const getTodayDateKey = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/** Format date to readable Ukrainian format: "23 липня 2026" */
const formatDate = (dateKey: string): string => {
  const [y, m, d] = dateKey.split("-").map(Number);
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

export default function PastDaysModal({
  open,
  onClose,
  matches,
}: PastDaysModalProps) {
  const todayKey = getTodayDateKey();

  // Filter: only past dates, only finished matches
  const pastMatches = matches.filter((m) => {
    const key = getDateKey(m.date);
    return key < todayKey && m.matchStatus === "finished";
  });

  // Group by date
  const grouped: Record<string, Match[]> = {};
  pastMatches.forEach((m) => {
    const key = getDateKey(m.date);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  });

  // Sort date keys descending (newest first)
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
                Минулі матчі
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-0.5 font-normal">
                {pastMatches.length} матчів за {dateKeys.length} днів
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
            </button>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 pb-6 pt-4 bg-gray-50">
          {pastMatches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="flex items-center justify-center size-24 rounded-2xl bg-white mb-3">
                <CalendarDays className="size-[72px]" strokeWidth={1} />
              </div>
              <p className="text-sm text-gray-900">
                Немає завершених матчів за минулі дні
              </p>
            </div>
          )}
          {dateKeys.map((dateKey) => {
            const dayMatches = grouped[dateKey].sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            );
            return (
              <PastDayGroup
                key={dateKey}
                dateKey={dateKey}
                matches={dayMatches}
              />
            );
          })}
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
  matches: Match[];
}) {
  return (
    <div className="mb-6 last:mb-0">
      {/* Date header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
          {formatDate(dateKey)}
        </span>
        <div className="h-px flex-1 bg-gray-100" />
      </div>

      {/* Match rows */}
      <div className="rounded-2xl border border-gray-100 overflow-hidden">
        {matches.map((match, idx) => {
          const team1Won = (match.score1 ?? 0) > (match.score2 ?? 0);
          const team2Won = (match.score2 ?? 0) > (match.score1 ?? 0);

          return (
            <div
              key={match.id}
              className={`flex items-center gap-4 px-4 py-3 ${
                idx < matches.length - 1 ? "border-b border-gray-50" : ""
              } hover:bg-gray-50/50 transition-colors`}
            >
              {/* Team 1 */}
              <div className="flex items-center gap-2 min-w-0 flex-[2] justify-end">
                <span
                  className={`text-sm font-medium truncate ${
                    team1Won ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {match.team1}
                </span>
                {match.logoTeam1 && (
                  <img
                    src={match.logoTeam1}
                    alt={match.team1}
                    className="w-5 h-5 rounded object-contain flex-shrink-0"
                  />
                )}
              </div>

              {/* Score */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span
                  className={`text-sm font-bold tabular-nums ${
                    team1Won ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {match.score1 ?? "-"}
                </span>
                <span className="text-xs text-gray-300">:</span>
                <span
                  className={`text-sm font-bold tabular-nums ${
                    team2Won ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {match.score2 ?? "-"}
                </span>
              </div>

              {/* Team 2 */}
              <div className="flex items-center gap-2 min-w-0 flex-[2]">
                {match.logoTeam2 && (
                  <img
                    src={match.logoTeam2}
                    alt={match.team2}
                    className="w-5 h-5 rounded object-contain flex-shrink-0"
                  />
                )}
                <span
                  className={`text-sm font-medium truncate ${
                    team2Won ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {match.team2}
                </span>
              </div>

              {/* Tournament + Match type */}
              <div className="flex items-center gap-1.5 flex-shrink-0 text-xs text-gray-400 min-w-[120px] justify-end">
                <Trophy className="h-3 w-3" strokeWidth={1.5} />
                <span className="truncate max-w-[80px]">{match.context}</span>
                <span className="text-gray-300">·</span>
                <span className="font-medium text-gray-500">
                  {match.matchType}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
