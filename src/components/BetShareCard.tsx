import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { getBetTypeLabel } from "@/lib/displayHelpers";

interface BetShareCardProps {
  bet: {
    match?: string;
    team1?: string;
    team2?: string;
    date: string;
    betType: string;
    format?: string;
    currency?: string;
    amount: number;
    originalAmount?: number;
    odds: number;
    result: string;
    profit?: number;
    originalProfit?: number;
    exchangeRate?: number | null;
    logoTeam1?: string | null;
    logoTeam2?: string | null;
    expressLogos?: { logoTeam1?: string | null; logoTeam2?: string | null }[];
    game?: string;
    tournament?: string | null;
  };
  compact?: boolean;
}

function translateBetType(betType: string): string {
  // First, handle "Карта N: " prefix explicitly
  const mapPrefix = betType.match(/^Карта (\d+):\s*(.+)/);
  if (mapPrefix) {
    return `Карта ${mapPrefix[1]}: ${translateBetType(mapPrefix[2])}`;
  }
  const translations: Record<string, string> = {
    "Match Winner": "Переможець матчу",
    MatchWinner: "Переможець матчу",
    "Map Winner": "Переможець карти",
    MapWinner: "Переможець карти",
    Handicap: "Фора",
    "Map Handicap": "Фора на карту",
    "Round Handicap": "Фора раундів",
    Total: "Тотал",
    "Total Maps": "Тотал карт",
    "Total Rounds": "Тотал раундів",
    Over: "Більше",
    Under: "Менше",
    Winner: "Переможець",
    "First Map Winner": "Переможець 1-ї карти",
    "Second Map Winner": "Переможець 2-ї карти",
    "Third Map Winner": "Переможець 3-ї карти",
    "First Map": "1-а карта",
    "Second Map": "2-а карта",
    "Third Map": "3-я карта",
    "Correct Score": "Точний рахунок",
    "Map 1": "Карта 1",
    "Map 2": "Карта 2",
    "Map 3": "Карта 3",
    "Kill Handicap": "Фора по кілам",
    "Kill Total": "Тотал кілів",
    Moneyline: "Переможець",
    Spread: "Фора",
    Draw: "Нічія",
    Yes: "Так",
    No: "Ні",
  };

  let result = betType;
  const sortedKeys = Object.keys(translations).sort(
    (a, b) => b.length - a.length,
  );

  for (const key of sortedKeys) {
    const regex = new RegExp(key, "gi");
    result = result.replace(regex, translations[key]);
  }

  return result;
}

function BlurReveal({
  children,
  isPending,
}: {
  children: React.ReactNode;
  isPending: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  if (!isPending) {
    return <>{children}</>;
  }

  return (
    <span
      onClick={() => setRevealed(!revealed)}
      className={`cursor-pointer select-none transition-all duration-300 inline-block ${
        revealed ? "" : "blur-md hover:blur-sm"
      }`}
      title={revealed ? "Натисніть щоб приховати" : "Натисніть щоб показати"}
    >
      {children}
    </span>
  );
}

// Color themes per status
const themes = {
  Win: {
    accent: "#059669",
    accentLight: "#D1FAE5",
    accentMid: "#A7F3D0",
    accentBg: "#F0FDF4",
    gradient: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
  },
  Loss: {
    accent: "#DC2626",
    accentLight: "#FEE2E2",
    accentMid: "#FECACA",
    accentBg: "#FEF2F2",
    gradient: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
  },
  Pending: {
    accent: "#2563EB",
    accentLight: "#DBEAFE",
    accentMid: "#BFDBFE",
    accentBg: "#EFF6FF",
    gradient: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
  },
};

/** Single team icon (logo or CS2/Dota placeholder fallback) */
function TeamIcon({
  logo,
  name,
  size,
  game,
}: {
  logo?: string | null;
  name?: string;
  size: number;
  game?: string;
}) {
  if (!name) return null;

  const isDota = game?.toLowerCase() === "dota2";
  const placeholderSrc = isDota
    ? "/assets/team-placeholder-dota.svg"
    : "/assets/team-placeholder-cs2.svg";

  const sharedClass =
    "flex items-center justify-center flex-shrink-0 rounded-xl bg-slate-50";
  const sharedStyle = { width: size, height: size };

  if (logo) {
    return (
      <div className={`${sharedClass} overflow-hidden`} style={sharedStyle}>
        <img
          src={logo}
          alt={name}
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            el.style.display = "none";
            const parent = el.parentElement!;
            parent.innerHTML = "";
            const img = document.createElement("img");
            img.src = placeholderSrc;
            img.alt = name;
            img.className = "w-full h-full object-contain p-1 opacity-70";
            parent.appendChild(img);
          }}
        />
      </div>
    );
  }

  return (
    <div className={sharedClass} style={sharedStyle}>
      <img
        src={placeholderSrc}
        alt={name}
        className="w-full h-full object-contain p-1 opacity-70"
      />
    </div>
  );
}

/** Format a match date into ticket date/time parts. */
function formatTicketDate(dateStr: string): { date: string; time: string } {
  if (!dateStr) return { date: "", time: "" };
  // Only show time when the string actually carries a time component
  // (e.g. "2026-09-01T08:25:00"). Date-only strings like "2026-09-01" must
  // NOT be parsed as UTC midnight — that shifts the hour by the local offset.
  const hasTime = /T\d{2}:\d{2}/.test(dateStr);
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { date: dateStr, time: "" };
  const date = d.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
  });
  if (!hasTime) return { date, time: "" };
  const time = d.toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time };
}

export default function BetShareCard({
  bet,
  compact = false,
}: BetShareCardProps) {
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [notchY, setNotchY] = useState(0);

  // Measure the dashed line's vertical center so the mask cutouts land on it.
  // Uses offsetTop (layout-based) instead of getBoundingClientRect, because the
  // dialog's open animation applies a scale transform which would skew rects.
  useEffect(() => {
    const measure = () => {
      const card = cardRef.current;
      const line = lineRef.current;
      if (!card || !line) return;
      // Walk offsetTop relative to the card (line's offsetParent is the card).
      let y = 0;
      let el: HTMLElement | null = line;
      while (el && el !== card) {
        y += el.offsetTop;
        el = el.offsetParent as HTMLElement | null;
      }
      setNotchY(Math.round(y + line.offsetHeight / 2));
    };
    measure();
    const card = cardRef.current;
    let ro: ResizeObserver | null = null;
    if (card && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(card);
    }
    window.addEventListener("resize", measure);
    // Re-measure after the dialog open animation finishes (transform settles).
    const t = window.setTimeout(measure, 350);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
      window.clearTimeout(t);
    };
  }, [isEventsOpen]);

  const isWin = bet.result === "Win";
  const isLoss = bet.result === "Loss";
  const isPending = bet.result === "Pending";

  const currency = bet.currency || "UAH";
  const currencySymbol = currency === "USD" ? "$" : "₴";
  const displayAmount = bet.originalAmount || bet.amount;
  let displayProfit: number | undefined = bet.originalProfit;
  if (
    displayProfit === undefined &&
    bet.profit !== undefined &&
    bet.profit !== null
  ) {
    if (currency === "USD" && bet.exchangeRate) {
      displayProfit = bet.profit / bet.exchangeRate;
    } else {
      displayProfit = bet.profit;
    }
  }

  const isExpress =
    bet.betType.includes("Експрес") || (bet.format ?? "").includes("x");

  const logoSize = compact ? 80 : 88;
  const game = bet.game || "CS2";

  interface ParsedEvent {
    number: string;
    match: string;
    betType: string;
    selection: string;
    odds: string;
  }

  let parsedEvents: ParsedEvent[] = [];

  if (isExpress && bet.betType.includes("|")) {
    const fullString = bet.betType.split("|").slice(1).join("|").trim();
    const eventStrings = fullString.split("•").map((e) => e.trim());

    parsedEvents = eventStrings.map((eventStr) => {
      const parts = eventStr.split("|").map((p) => p.trim());

      if (parts.length >= 2) {
        const matchPart = parts[0];
        const betPart = parts[1];

        const numberMatch = matchPart.match(/^(\d+)\.\s*(.+)$/);
        const number = numberMatch ? numberMatch[1] : "";
        const match = numberMatch ? numberMatch[2] : matchPart;

        const betMatch = betPart.match(/^(.+?):\s*(.+?)\s*@([\d.]+)$/);
        const betType = betMatch ? translateBetType(betMatch[1]) : "";
        const selection = betMatch ? betMatch[2] : "";
        const odds = betMatch ? betMatch[3] : "";

        return { number, match, betType, selection, odds };
      }

      return {
        number: "",
        match: eventStr,
        betType: "",
        selection: "",
        odds: "",
      };
    });
  }

  const betTypeParts = bet.betType.split(" - ");
  const selection = betTypeParts[1] || "";
  const betCategoryRaw =
    getBetTypeLabel(betTypeParts[0] || bet.betType, bet.format) ||
    translateBetType(betTypeParts[0]) ||
    translateBetType(bet.betType);
  const betCategory = betCategoryRaw
    .replace(/\bMapWinner\b/g, "Переможець карти")
    .replace(/\bMatchWinner\b/g, "Переможець матчу");

  const totalAmount = isPending
    ? displayAmount * bet.odds
    : isWin
      ? displayAmount + (displayProfit || 0)
      : 0;

  const matchName = bet.match || `${bet.team1} vs ${bet.team2}`;
  const team1 = bet.team1 || matchName.split(" vs ")[0]?.trim();
  const team2 = bet.team2 || matchName.split(" vs ")[1]?.trim();
  const statusText = isWin ? "Виграш" : isLoss ? "Програш" : "Очікується";

  const theme = isWin ? themes.Win : isLoss ? themes.Loss : themes.Pending;

  const { date: dateLabel, time: timeLabel } = formatTicketDate(bet.date);

  // Payout badge value
  const payoutLabel = isLoss ? "0" : totalAmount.toFixed(2);

  // True transparent ticket notches: punch two semicircular holes at the
  // dashed line's height so the modal background shows through.
  const notchR = 12;
  const maskStyle: React.CSSProperties | undefined =
    notchY > 0
      ? {
          WebkitMaskImage: `radial-gradient(circle ${notchR}px at 0px ${notchY}px, transparent calc(${notchR}px - 0.5px), #000 ${notchR}px), radial-gradient(circle ${notchR}px at 100% ${notchY}px, transparent calc(${notchR}px - 0.5px), #000 ${notchR}px)`,
          maskImage: `radial-gradient(circle ${notchR}px at 0px ${notchY}px, transparent calc(${notchR}px - 0.5px), #000 ${notchR}px), radial-gradient(circle ${notchR}px at 100% ${notchY}px, transparent calc(${notchR}px - 0.5px), #000 ${notchR}px)`,
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
        }
      : undefined;

  return (
    <div
      className="relative w-full"
      style={{
        filter:
          "drop-shadow(0 8px 40px rgba(0,0,0,0.12)) drop-shadow(0 2px 8px rgba(0,0,0,0.06))",
      }}
    >
      <div
        ref={cardRef}
        className="relative w-full bg-white overflow-hidden"
        style={{
          borderRadius: "13px 13px 26px 26px",
          border: "1px solid #E5E7EB",
          ...maskStyle,
        }}
      >
        {/* Header — tournament name */}
        <div
          className="flex items-center justify-center px-6 py-4 text-white"
          style={{ background: theme.gradient }}
        >
          <div className="w-full text-lg font-light tracking-wider uppercase leading-snug text-center break-words line-clamp-2">
            {bet.tournament || matchName}
          </div>
        </div>

        {/* Express events */}
        {isExpress && parsedEvents.length > 0 ? (
          <div className="px-5 mt-3">
            <button
              onClick={() => setIsEventsOpen(!isEventsOpen)}
              className="w-full flex items-center justify-center gap-2 py-1.5 text-sm font-semibold text-slate-700 hover:opacity-75 transition-opacity"
            >
              {isWin && (
                <CheckCircle2
                  className="h-4 w-4"
                  style={{ color: theme.accent }}
                  strokeWidth={1.5}
                />
              )}
              <span>
                {parsedEvents.length}{" "}
                {parsedEvents.length === 1
                  ? "подія"
                  : parsedEvents.length < 5
                    ? "події"
                    : "подій"}
              </span>
              {isEventsOpen ? (
                <ChevronUp
                  className="h-4 w-4 text-slate-400"
                  strokeWidth={1.5}
                />
              ) : (
                <ChevronDown
                  className="h-4 w-4 text-slate-400"
                  strokeWidth={1.5}
                />
              )}
            </button>

            {isEventsOpen && (
              <div className="space-y-3 pt-1">
                {parsedEvents.map((event, index) => (
                  <div
                    key={index}
                    className="rounded-2xl px-4 py-3"
                    style={{
                      backgroundColor: theme.accentBg,
                      border: `1px solid ${theme.accentLight}`,
                    }}
                  >
                    {/* Match row */}
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex items-center justify-center min-w-[26px] h-[26px] rounded-full text-sm font-bold text-white shrink-0"
                        style={{ backgroundColor: theme.accent }}
                      >
                        {event.number}
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <img
                          src={
                            bet.expressLogos?.[index]?.logoTeam1 ||
                            (game === "Dota2"
                              ? "/assets/team-placeholder-dota.svg"
                              : "/assets/team-placeholder-cs2.svg")
                          }
                          alt=""
                          className="h-7 w-7 rounded-full object-contain bg-white shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                        <p className="text-base font-semibold text-gray-900 leading-tight break-words min-w-0">
                          {event.match}
                        </p>
                        <img
                          src={
                            bet.expressLogos?.[index]?.logoTeam2 ||
                            (game === "Dota2"
                              ? "/assets/team-placeholder-dota.svg"
                              : "/assets/team-placeholder-cs2.svg")
                          }
                          alt=""
                          className="h-7 w-7 rounded-full object-contain bg-white shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                      <span className="text-base font-black text-slate-900 shrink-0">
                        {event.odds}
                      </span>
                    </div>

                    {/* Market + selection */}
                    <div className="mt-2 flex items-center pl-[36px]">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="text-slate-400">
                          {getBetTypeLabel(event.betType, bet.format)
                            .replace(/\bMapWinner\b/g, "Переможець карти")
                            .replace(/\bMatchWinner\b/g, "Переможець матчу")}
                          :
                        </span>
                        <span
                          className="text-base font-bold leading-tight"
                          style={{ color: theme.accent }}
                        >
                          <BlurReveal isPending={isPending}>
                            {event.selection}
                          </BlurReveal>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Single match teams + date/time */
          <div className="flex items-start justify-between px-6 pt-5">
            {/* Team 1 */}
            <div className="flex flex-1 flex-col items-center text-center min-w-0">
              <TeamIcon
                logo={bet.logoTeam1}
                name={team1}
                size={logoSize}
                game={game}
              />
              <span className="mt-2 text-base font-bold text-slate-800 leading-snug break-words line-clamp-2">
                {team1}
              </span>
            </div>

            {/* Date / time */}
            <div
              className="flex flex-col items-center px-3 shrink-0 justify-center"
              style={{ minHeight: logoSize }}
            >
              <span className="text-sm font-medium text-slate-400">
                {dateLabel}
              </span>
              {timeLabel && (
                <span className="text-2xl font-extrabold text-slate-800 leading-tight mt-0.5">
                  {timeLabel}
                </span>
              )}
              {bet.format && (
                <span className="mt-1.5 rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                  {bet.format}
                </span>
              )}
            </div>

            {/* Team 2 */}
            <div className="flex flex-1 flex-col items-center text-center min-w-0">
              <TeamIcon
                logo={bet.logoTeam2}
                name={team2}
                size={logoSize}
                game={game}
              />
              <span className="mt-2 text-base font-bold text-slate-800 leading-snug break-words line-clamp-2">
                {team2}
              </span>
            </div>
          </div>
        )}

        {/* Ticket perforation (semicircular notches + dashed separator) */}
        <div ref={lineRef} className="relative my-4 py-2 flex items-center">
          <svg
            className="w-full"
            height="2"
            viewBox="0 0 100 2"
            preserveAspectRatio="none"
          >
            <line
              x1="0"
              y1="1"
              x2="100"
              y2="1"
              stroke="#E5E7EB"
              strokeWidth="2"
              strokeDasharray="3.33 3.33"
              strokeOpacity="0.7"
            />
          </svg>
        </div>

        {/* Market, pick + odds */}
        <div className="pb-2">
          <div className="flex items-center justify-between text-base px-6">
            {isExpress ? (
              <>
                <span className="text-slate-400">Загальний коефіцієнт</span>
                <span className="text-lg font-black text-slate-800 ml-2 shrink-0">
                  {Number(bet.odds).toFixed(2)}
                </span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="text-slate-400">{betCategory}:</span>
                  {selection && (
                    <span
                      className="flex items-center gap-1 font-bold"
                      style={{ color: theme.accent }}
                    >
                      <BlurReveal isPending={isPending}>{selection}</BlurReveal>
                    </span>
                  )}
                </div>
                <span className="text-lg font-black text-slate-800 ml-2 shrink-0">
                  {Number(bet.odds).toFixed(2)}
                </span>
              </>
            )}
          </div>
          <div className="mt-6 h-px w-full bg-slate-200" />
        </div>

        {/* Amount → payout */}
        <div className="mt-1 flex items-center justify-between px-6 pb-5">
          <div className="flex items-center gap-2 text-lg font-bold">
            <span className="text-slate-700">
              {displayAmount} {currencySymbol}
            </span>
            {!isLoss && (
              <>
                <span className="text-slate-300 font-normal">→</span>
                <span
                  className={
                    isPending
                      ? "text-slate-900 font-extrabold"
                      : "text-emerald-600 font-extrabold"
                  }
                >
                  <BlurReveal isPending={isPending}>
                    {payoutLabel} {currencySymbol}
                  </BlurReveal>
                </span>
              </>
            )}
          </div>

          <div
            className="rounded-xl px-4 py-2 text-lg font-extrabold text-white"
            style={{
              background: theme.gradient,
              boxShadow: `0 4px 12px ${theme.accentMid}`,
            }}
          >
            {statusText}
          </div>
        </div>
      </div>
    </div>
  );
}
