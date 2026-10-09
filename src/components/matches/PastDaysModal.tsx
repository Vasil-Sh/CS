import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, Loader2, Search, Clock } from "lucide-react";
import { proxyLogoUrl } from "@/lib/logoProxy";
import "./PastDaysModal.css";

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

const LOGO_SIZE = 24;

/** Team logo with error fallback to placeholder SVG */
function TeamLogo({
  src,
  alt,
  game,
  size = LOGO_SIZE,
}: {
  src: string | null;
  alt: string;
  game: string;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const fallback =
    game === "cs2"
      ? "/assets/team-placeholder-cs2.svg"
      : "/assets/team-placeholder-dota.svg";

  if (!src || imgError) {
    return (
      <img
        src={fallback}
        alt={alt}
        className="past-results__team-logo"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={proxyLogoUrl(src, game) ?? undefined}
      alt={alt}
      className="past-results__team-logo"
      style={{ width: size, height: size }}
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

/** Get hours since match completion */
const hoursAgo = (dateStr: string): number => {
  return (Date.now() - new Date(dateStr).getTime()) / 3600000;
};

const AGE_OPTIONS = [
  { value: "all", label: "Весь час" },
  { value: "3", label: "3 год" },
  { value: "6", label: "6 год" },
  { value: "12", label: "12 год" },
  { value: "24", label: "24 год" },
] as const;

export default function PastDaysModal({ open, onClose }: PastDaysModalProps) {
  const [matches, setMatches] = useState<HistoryMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameFilter, setGameFilter] = useState<"all" | "cs2" | "dota2">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [daysBack, setDaysBack] = useState(7);
  const [ageFilter, setAgeFilter] = useState<string>("all");

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
  }, [open, daysBack]);

  const filteredMatches = useMemo(() => {
    const ageHours = ageFilter === "all" ? Infinity : Number(ageFilter);
    return matches.filter((m) => {
      if (gameFilter === "cs2" && m.game !== "cs2") return false;
      if (gameFilter === "dota2" && m.game !== "dota2") return false;
      if (ageFilter !== "all" && hoursAgo(m.date) > ageHours) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const t1 = String(m.team1 ?? "").toLowerCase();
        const t2 = String(m.team2 ?? "").toLowerCase();
        const tn = String(m.tournament ?? "").toLowerCase();
        if (!t1.includes(q) && !t2.includes(q) && !tn.includes(q)) return false;
      }
      return true;
    });
  }, [matches, gameFilter, searchQuery, ageFilter]);

  // Group by date (YYYY-MM-DD only, ignoring time)
  const grouped: Record<string, HistoryMatch[]> = {};
  filteredMatches.forEach((m) => {
    const key = m.date.slice(0, 10); // YYYY-MM-DD
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  });

  const dateKeys = Object.keys(grouped).sort().reverse();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="past-results">
        <header className="past-results__header">
          <DialogTitle className="past-results__title">Результати</DialogTitle>
          <p className="past-results__subtitle">
            {filteredMatches.length} матчів за {dateKeys.length} днів
          </p>

          {!loading && matches.length > 0 && (
            <div className="past-results__filters">
              <div className="past-results__seg">
                {[3, 7, 14, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDaysBack(d)}
                    aria-pressed={daysBack === d}
                  >
                    {d}д
                  </button>
                ))}
              </div>

              <div className="past-results__seg">
                {(["all", "cs2", "dota2"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGameFilter(g)}
                    aria-pressed={gameFilter === g}
                  >
                    {g === "all" ? "Всі" : g === "cs2" ? "CS2" : "Dota 2"}
                  </button>
                ))}
              </div>

              <div className="past-results__seg">
                {AGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAgeFilter(opt.value)}
                    aria-pressed={ageFilter === opt.value}
                  >
                    <Clock
                      className="inline-block mr-1 -mt-0.5"
                      size={12}
                      strokeWidth={1.5}
                    />
                    {opt.label}
                  </button>
                ))}
              </div>

              <label className="past-results__search">
                <Search size={14} strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Пошук команди або турніру"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </label>
            </div>
          )}
        </header>

        <div className="past-results__scroll">
          <div className="past-results__body">
            {loading ? (
              <div className="past-results__empty">
                <Loader2 className="animate-spin" size={40} strokeWidth={1} />
                <p>Завантаження…</p>
              </div>
            ) : error ? (
              <div className="past-results__empty">
                <p style={{ color: "#c0392b" }}>{error}</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="past-results__empty">
                <CalendarDays size={56} strokeWidth={1} />
                <p>Немає завершених матчів</p>
              </div>
            ) : (
              dateKeys.map((dateKey) => {
                const dayMatches = grouped[dateKey].sort((a, b) => {
                  const at = String(a.tournament ?? "");
                  const bt = String(b.tournament ?? "");
                  const tn = at.localeCompare(bt);
                  if (tn !== 0) return tn;
                  const a1 = String(a.team1 ?? "");
                  const b1 = String(b.team1 ?? "");
                  const t1 = a1.localeCompare(b1);
                  if (t1 !== 0) return t1;
                  return String(a.team2 ?? "").localeCompare(
                    String(b.team2 ?? ""),
                  );
                });
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
    <div className="past-results__group">
      <div className="past-results__day">
        <div className="past-results__day-line" />
        <span className="past-results__day-label">{formatDate(dateKey)}</span>
        <div className="past-results__day-line" />
      </div>

      <div className="past-results__card">
        {matches.map((match) => {
          const team1Won = (match.score1 ?? 0) > (match.score2 ?? 0);
          const team2Won = (match.score2 ?? 0) > (match.score1 ?? 0);

          return (
            <div key={match.id} className="past-results__row">
              <div className="past-results__team past-results__team--left">
                <span
                  className={`past-results__team-name ${team1Won ? "" : "is-loser"}`}
                >
                  {match.team1}
                </span>
                <TeamLogo
                  src={match.logoTeam1}
                  alt={match.team1}
                  game={match.game}
                />
              </div>

              <div className="past-results__score">
                <span
                  className={`past-results__score-num ${team1Won ? "is-win" : ""}`}
                >
                  {match.score1 ?? "-"}
                </span>
                <span className="past-results__score-sep">:</span>
                <span
                  className={`past-results__score-num ${team2Won ? "is-win" : ""}`}
                >
                  {match.score2 ?? "-"}
                </span>
              </div>

              <div className="past-results__team-right">
                <TeamLogo
                  src={match.logoTeam2}
                  alt={match.team2}
                  game={match.game}
                />
                <span
                  className={`past-results__team-name ${team2Won ? "" : "is-loser"}`}
                >
                  {match.team2}
                </span>
                <span
                  className={`past-results__game-badge ${
                    match.game === "cs2"
                      ? "past-results__game-badge--cs2"
                      : "past-results__game-badge--dota2"
                  }`}
                >
                  {match.game === "cs2" ? "CS2" : "Dota2"}
                </span>
                <span className="past-results__tournament">
                  {typeof match.tournament === "string"
                    ? match.tournament
                    : String(match.tournament ?? "")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
