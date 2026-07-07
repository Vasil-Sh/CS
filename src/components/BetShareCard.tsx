import { useState } from "react";
import {
  Trophy,
  TrendingDown,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getBetTypeLabel } from "@/lib/displayHelpers";

interface BetShareCardProps {
  bet: {
    match?: string;
    team1?: string;
    team2?: string;
    date: string;
    betType: string;
    format: string;
    currency?: string;
    amount: number;
    originalAmount?: number;
    odds: number;
    result: string;
    profit?: number;
    originalProfit?: number;
    exchangeRate?: number;
    logoTeam1?: string | null;
    logoTeam2?: string | null;
    expressLogos?: { logoTeam1?: string | null; logoTeam2?: string | null }[];
    game?: string;
  };
  compact?: boolean;
}

function translateBetType(betType: string): string {
  const translations: Record<string, string> = {
    "Match Winner": "Переможець матчу",
    "Map Winner": "Переможець карти",
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
    : "/assets/team-placeholder.svg";

  const sharedClass =
    "flex items-center justify-center flex-shrink-0 rounded-full bg-white";
  const sharedStyle = { width: size, height: size };

  if (logo) {
    return (
      <div className={`${sharedClass} overflow-hidden`} style={sharedStyle}>
        <img
          src={logo}
          alt={name}
          className="w-3/5 h-3/5 object-contain"
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            el.style.display = "none";
            const parent = el.parentElement!;
            parent.innerHTML = "";
            const img = document.createElement("img");
            img.src = placeholderSrc;
            img.alt = name;
            img.className = "w-3/5 h-3/5 object-contain opacity-70";
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
        className="w-3/5 h-3/5 object-contain opacity-70"
      />
    </div>
  );
}

export default function BetShareCard({
  bet,
  compact = false,
}: BetShareCardProps) {
  const [isEventsOpen, setIsEventsOpen] = useState(false);

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

  const isExpress = bet.betType.includes("Експрес") || bet.format.includes("x");

  const logoSettings = {
    win: { border: "#059669", fallback: "#059669" },
    loss: { border: "#DC2626", fallback: "#DC2626" },
    pending: { border: "#3B82F6", fallback: "#3B82F6" },
  };
  const logoStyle = isWin
    ? logoSettings.win
    : isLoss
      ? logoSettings.loss
      : logoSettings.pending;
  const logoSize = compact ? 75 : 94;
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
  const betCategory =
    getBetTypeLabel(betTypeParts[0] || bet.betType, bet.format) ||
    translateBetType(betTypeParts[0]) ||
    translateBetType(bet.betType);

  const totalAmount = isPending
    ? displayAmount * bet.odds
    : isWin
      ? displayAmount + (displayProfit || 0)
      : 0;

  const matchName = bet.match || `${bet.team1} vs ${bet.team2}`;
  const matchTitle = (() => {
    const parts = matchName.split(" vs ");
    if (parts.length === 2) {
      return (
        <>
          {parts[0]}{" "}
          <span className={isPending ? "text-[#3B82F6]" : ""}>vs</span>{" "}
          {parts[1]}
        </>
      );
    }
    return matchName;
  })();
  const statusText = isWin ? "Виграш" : isLoss ? "Програш" : "Очікується";

  const expressLabel = isExpress ? `Експрес ${bet.format}` : "";

  const theme = isWin ? themes.Win : isLoss ? themes.Loss : themes.Pending;

  // Sizing: compact (used in modal) vs full
  const bannerPx = compact ? "px-5" : "px-6";
  const bannerPy = compact ? "py-3.5" : "py-5";
  const bodyPadding = compact ? "p-4" : "p-6";
  const bodyGap = compact ? "space-y-3" : "space-y-4";
  const iconSize = compact ? "w-12 h-12" : "w-14 h-14";
  const iconRound = compact ? "rounded-xl" : "rounded-2xl";
  const statusFont = compact ? "text-xl" : "text-2xl";
  const matchFont = compact ? "text-xl" : "text-2xl";
  const expressHeaderFont = compact ? "text-xl" : "text-2xl";
  const selectionFont = compact ? "text-2xl" : "text-3xl";
  const cellPadding = compact ? "p-4" : "p-5";
  const cellRadius = compact ? "16px" : "20px";
  const cellValueFont = compact ? "text-xl" : "text-2xl";
  const profitPadding = compact ? "p-5" : "p-6";
  const profitValueFont = compact ? "text-2xl" : "text-4xl";
  const badgePx = compact ? "px-4 py-2" : "px-4 py-2.5";
  const badgeFont = compact ? "text-sm" : "text-base";
  const cardRadius = compact ? "26px" : "32px";
  const eventPadding = compact ? "p-3" : "p-3.5";
  const eventRadius = compact ? "16px" : "20px";

  return (
    <div
      className="w-full overflow-hidden bg-white"
      style={{
        borderRadius: cardRadius,
        border: "1px solid #E5E7EB",
        boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Status Banner */}
      <div
        className={`flex items-center justify-between ${bannerPx} ${bannerPy} text-white`}
        style={{ background: theme.gradient }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`flex items-center justify-center ${iconSize} ${iconRound} bg-white/20 backdrop-blur-sm`}
          >
            {isWin ? (
              <Trophy className="h-8 w-8 text-white" strokeWidth={1.5} />
            ) : isLoss ? (
              <TrendingDown className="h-8 w-8 text-white" strokeWidth={1.5} />
            ) : (
              <Clock className="h-8 w-8 text-white" strokeWidth={1.5} />
            )}
          </div>
          <div>
            <p className={`font-bold ${statusFont} leading-tight`}>
              {statusText}
            </p>
            <p className="text-sm text-white/70 font-medium">{bet.date}</p>
          </div>
        </div>
        <div
          className={`flex items-center gap-1.5 ${badgeFont} font-medium text-white/80 bg-white/15 ${badgePx} rounded-2xl backdrop-blur-sm`}
        >
          <Calendar className="h-5 w-5" strokeWidth={1.5} />
          <span>{isExpress ? expressLabel : bet.format}</span>
        </div>
      </div>

      {/* Card body */}
      <div className={`${bodyPadding} ${bodyGap} bg-white`}>
        {/* Match Name — only for non-express */}
        {!isExpress && (
          <>
            <div className="flex items-center justify-center py-1 gap-2.5 flex-nowrap">
              {/* Team 1 icon */}
              <TeamIcon
                logo={bet.logoTeam1}
                name={bet.team1}
                style={logoStyle}
                size={logoSize}
                game={game}
              />
              <h3
                className={`${matchFont} font-bold text-[#111827] tracking-tight truncate min-w-0`}
              >
                {matchTitle}
              </h3>
              {/* Team 2 icon */}
              <TeamIcon
                logo={bet.logoTeam2}
                name={bet.team2}
                style={logoStyle}
                size={logoSize}
                game={game}
              />
            </div>
            <div className="border-t border-[#F3F4F6] -mx-6" />
          </>
        )}

        {/* Express Events or Regular Selection */}
        {isExpress && parsedEvents.length > 0 ? (
          <div>
            <button
              onClick={() => setIsEventsOpen(!isEventsOpen)}
              className="w-full relative flex items-center justify-center py-1.5 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {isWin && (
                  <CheckCircle2
                    className="h-4 w-4"
                    style={{ color: theme.accent }}
                    strokeWidth={1.5}
                  />
                )}
                <p
                  className={`${expressHeaderFont} font-bold text-[#111827] tracking-tight`}
                >
                  {parsedEvents.length}{" "}
                  {parsedEvents.length === 1
                    ? "подія"
                    : parsedEvents.length < 5
                      ? "події"
                      : "подій"}
                </p>
              </div>
              <span className="absolute right-0 top-1/2 -translate-y-1/2">
                {isEventsOpen ? (
                  <ChevronUp
                    className="h-4 w-4 text-gray-400"
                    strokeWidth={1.5}
                  />
                ) : (
                  <ChevronDown
                    className="h-4 w-4 text-gray-400"
                    strokeWidth={1.5}
                  />
                )}
              </span>
            </button>

            {isEventsOpen && (
              <div className="space-y-3 pt-2">
                {parsedEvents.map((event, index) => (
                  <div
                    key={index}
                    className={eventPadding}
                    style={{
                      borderRadius: eventRadius,
                      backgroundColor: theme.accentBg,
                      border: `1px solid ${theme.accentLight}`,
                      boxShadow:
                        "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div className="flex items-start gap-2 mb-1.5">
                      <span
                        className="flex items-center justify-center min-w-[28px] h-[28px] rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: theme.accent }}
                      >
                        {event.number}
                      </span>
                      <div className="flex items-center gap-1 min-w-0 flex-1 flex-wrap">
                        <img
                          src={
                            bet.expressLogos?.[index]?.logoTeam1 ||
                            (game === "Dota2"
                              ? "/assets/team-placeholder-dota.svg"
                              : "/assets/team-placeholder.svg")
                          }
                          alt=""
                          className="h-8 w-8 rounded-full object-contain bg-white flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                        <p className="text-lg font-semibold text-gray-900 leading-tight break-words">
                          {event.match}
                        </p>
                        <img
                          src={
                            bet.expressLogos?.[index]?.logoTeam2 ||
                            (game === "Dota2"
                              ? "/assets/team-placeholder-dota.svg"
                              : "/assets/team-placeholder.svg")
                          }
                          alt=""
                          className="h-8 w-8 rounded-full object-contain bg-white flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-0.5 ml-9">
                      <p className="text-sm text-gray-400 font-medium uppercase tracking-wide">
                        {getBetTypeLabel(event.betType, bet.format)}
                      </p>
                      <div className="flex items-center justify-between">
                        <p
                          className="text-base font-bold"
                          style={{ color: theme.accent }}
                        >
                          <BlurReveal isPending={isPending}>
                            {event.selection}
                          </BlurReveal>
                        </p>
                        <span
                          className="text-sm font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: theme.accentLight,
                            color: theme.accent,
                          }}
                        >
                          {event.odds}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-[#F3F4F6] mt-3 -mx-6" />
          </div>
        ) : isExpress && parsedEvents.length === 0 ? (
          <>
            <div className="text-center py-1.5">
              <div className="flex items-center justify-center gap-2">
                {isWin && (
                  <CheckCircle2
                    className="h-4 w-4"
                    style={{ color: theme.accent }}
                    strokeWidth={1.5}
                  />
                )}
                <h3
                  className={`${matchFont} font-bold text-[#111827] tracking-tight truncate min-w-0`}
                >
                  {matchTitle}
                </h3>
              </div>
            </div>
            <div className="border-t border-[#F3F4F6] -mx-6" />
          </>
        ) : selection ? (
          <>
            <div className="text-center py-1">
              <div className="flex items-center justify-center gap-2 mb-0.5">
                {isWin && (
                  <CheckCircle2
                    className="h-3.5 w-3.5"
                    style={{ color: theme.accent }}
                    strokeWidth={1.5}
                  />
                )}
                {isLoss && (
                  <XCircle
                    className="h-3.5 w-3.5"
                    style={{ color: theme.accent }}
                    strokeWidth={1.5}
                  />
                )}
                {isPending && (
                  <Clock
                    className="h-3.5 w-3.5"
                    style={{ color: theme.accent }}
                    strokeWidth={1.5}
                  />
                )}
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  {betCategory}
                </p>
              </div>
              <p
                className={`${selectionFont} font-bold tracking-tight`}
                style={{ color: theme.accent }}
              >
                <BlurReveal isPending={isPending}>{selection}</BlurReveal>
              </p>
            </div>
            <div className="border-t border-gray-100 -mx-6" />
          </>
        ) : (
          <div className="border-t border-gray-100 -mx-6" />
        )}

        {/* Amount & Odds */}
        <div className="grid grid-cols-2 gap-2.5">
          <div
            className={`text-center ${cellPadding}`}
            style={{
              borderRadius: cellRadius,
              backgroundColor: "rgba(255,255,255,0.5)",
              boxShadow:
                "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-0.5">
              Сума
            </p>
            <p className={`${cellValueFont} font-bold text-gray-900`}>
              {currencySymbol}
              {displayAmount}
            </p>
          </div>
          <div
            className={`text-center ${cellPadding}`}
            style={{
              borderRadius: cellRadius,
              backgroundColor: "rgba(255,255,255,0.5)",
              boxShadow:
                "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-0.5">
              Коефіцієнт
            </p>
            <p className={`${cellValueFont} font-bold text-gray-900`}>
              {Number(bet.odds).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Profit */}
        {!isPending &&
          displayProfit !== undefined &&
          displayProfit !== null && (
            <div
              className={`${profitPadding} text-center`}
              style={{
                borderRadius: cellRadius,
                backgroundColor: theme.accentBg,
                border: `1.5px solid ${theme.accentMid}`,
                boxShadow:
                  "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <p
                className="text-sm font-semibold mb-0.5 uppercase tracking-wider"
                style={{ color: theme.accent }}
              >
                Профіт
              </p>
              <p
                className={`${profitValueFont} font-bold tracking-tight`}
                style={{ color: theme.accent }}
              >
                {displayProfit > 0 ? "+" : ""}
                {displayProfit.toFixed(2)} {currencySymbol}
              </p>
            </div>
          )}

        {/* Pending — possible win */}
        {isPending && (
          <div
            className={`${profitPadding} text-center`}
            style={{
              borderRadius: cellRadius,
              backgroundColor: theme.accentBg,
              border: `1.5px solid ${theme.accentMid}`,
              boxShadow:
                "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <p
              className="text-sm font-semibold mb-0.5 uppercase tracking-wider"
              style={{ color: theme.accent }}
            >
              Можливий виграш
            </p>
            <p
              className={`${profitValueFont} font-bold tracking-tight`}
              style={{ color: theme.accent }}
            >
              <BlurReveal isPending={isPending}>
                +{((bet.odds - 1) * displayAmount).toFixed(2)} {currencySymbol}
              </BlurReveal>
            </p>
          </div>
        )}

        {/* Total Amount */}
        {!isLoss && (
          <div
            className={`${profitPadding} text-center`}
            style={{
              borderRadius: cellRadius,
              backgroundColor: "rgba(255,255,255,0.5)",
              boxShadow:
                "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <p className="text-sm font-semibold mb-0.5 uppercase tracking-wider text-gray-400">
              Загальна сума
            </p>
            <p
              className={`${profitValueFont} font-bold text-gray-900 tracking-tight`}
            >
              {isPending ? (
                <BlurReveal isPending={isPending}>
                  {totalAmount.toFixed(2)} {currencySymbol}
                </BlurReveal>
              ) : (
                <>
                  {totalAmount.toFixed(2)} {currencySymbol}
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
