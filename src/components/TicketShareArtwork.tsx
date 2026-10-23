import { useId, useState } from "react";
import { posterFontCss } from "./posterAssets";
import { posterLines } from "./PosterShareArtwork";
import { expressShareRows, expressEventCount } from "./ExpressShareArtwork";

interface Props {
  compact?: boolean;
  layout: "horizontal" | "square";
  showAmounts: boolean;
  team1: string;
  team2: string;
  logo1?: string | null;
  logo2?: string | null;
  tournamentLogo?: string | null;
  tournament: string;
  game: string;
  format?: string;
  date: { date: string; time: string };
  market: string;
  selection: string;
  odds: number;
  amount: string;
  result: string;
  status: string;
  state: string;
  express: boolean;
  events: string[];
}

function TeamMark({
  name,
  url,
  x,
  y,
}: {
  name: string;
  url?: string | null;
  x: number;
  y: number;
}) {
  const [failed, setFailed] = useState<string>();
  const [loaded, setLoaded] = useState<string>();
  const initials = name
    .replace(/^ex[- ]/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      <g
        data-logo-fallback=""
        visibility={
          url && loaded === url && failed !== url ? "hidden" : "visible"
        }
      >
        <path d="M36 0 70 12V38Q70 63 36 78Q2 63 2 38V12Z" fill="#202523" />
        <text
          x="36"
          y="49"
          textAnchor="middle"
          fontSize="26"
          fontWeight="800"
          fill="#fff"
        >
          {initials}
        </text>
      </g>
      {url && failed !== url && (
        <image
          data-embed-image=""
          data-optional-logo=""
          href={url}
          width="72"
          height="78"
          preserveAspectRatio="xMidYMid meet"
          onLoad={() => setLoaded(url)}
          onError={() => setFailed(url)}
        />
      )}
    </g>
  );
}

function TournamentMark({
  logo,
  x,
  y,
  size = 44,
}: {
  logo?: string | null;
  x: number;
  y: number;
  size?: number;
}) {
  const [failed, setFailed] = useState<string>();
  const [loaded, setLoaded] = useState<string>();
  const showLogo = !!logo && failed !== logo;
  return (
    <g
      data-ticket-tournament-icon=""
      transform={`translate(${x} ${y})`}
      aria-hidden="true"
    >
      <g
        data-logo-fallback=""
        visibility={showLogo && loaded === logo ? "hidden" : "visible"}
      >
        <svg
          x="11"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#737b87"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 3h10v5a5 5 0 0 1-10 0V3ZM7 5H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4M12 13v5m-4 3h8m-7 0v-3h6v3" />
        </svg>
      </g>
      {showLogo && (
        <image
          data-embed-image=""
          data-optional-logo=""
          href={logo}
          width={size + 22}
          height={size}
          preserveAspectRatio="xMidYMid meet"
          onLoad={() => setLoaded(logo)}
          onError={() => setFailed(logo)}
        />
      )}
    </g>
  );
}

/** Cut through the whole artwork, not just its background, for PNG alpha. */
function TicketPerforation({
  seam,
  length,
  horizontal = false,
}: {
  seam: number;
  length: number;
  horizontal?: boolean;
}) {
  return (
    <g data-ticket-perforation="">
      <circle
        cx={horizontal ? 0 : seam}
        cy={horizontal ? seam : 0}
        r="20"
        fill="black"
      />
      <circle
        cx={horizontal ? length : seam}
        cy={horizontal ? seam : length}
        r="20"
        fill="black"
      />
      <path
        d={
          horizontal
            ? `M24 ${seam}H${length - 24}`
            : `M${seam} 24V${length - 24}`
        }
        fill="none"
        stroke="black"
        strokeWidth="4"
        strokeDasharray="10 10"
      />
    </g>
  );
}

/** The approved compact ticket: one neutral surface and a local status badge. */
function SingleTicketArtwork(p: Props) {
  const id = useId().replace(/:/g, "");
  const square = p.layout === "square";
  const stacked = square || !!p.compact;
  const width = stacked ? 800 : 1120;
  const stub = 210;
  const left = stacked ? 48 : stub + 36;
  const right = width - (stacked ? 48 : 36);
  const area = right - left;
  const first = posterLines(p.team1, stacked ? 15 : 14);
  const second = posterLines(p.team2, stacked ? 15 : 14);
  const tournament = posterLines(p.tournament, stacked ? 46 : 58);
  const tournamentY = stacked ? 178 : 52;
  const tournamentWidth = Math.min(
    area - 70,
    Math.max(...tournament.map((line) => line.length), 1) * 11.5,
  );
  const teamY = tournamentY + (tournament.length - 1) * 28 + 42;
  const nameY = teamY + (stacked ? 124 : 52);
  const teamFont = 46;
  const teamTextWidth = stacked ? area / 2 - 30 : area / 2 - 122;
  const fitTeam = (lines: string[]) =>
    Math.min(
      teamFont,
      teamTextWidth / (Math.max(...lines.map((line) => line.length), 1) * 0.6),
    );
  const teamBottom = Math.max(
    teamY + 78,
    nameY + (Math.max(first.length, second.length) - 1) * 54 + 12,
  );
  const predictionY = teamBottom + 36;
  const predictionWidth = stacked ? area : area - (p.showAmounts ? 330 : 170);
  const market = posterLines(p.market.toUpperCase(), stacked ? 46 : 28);
  const selection = posterLines(p.selection, stacked ? 30 : 24);
  const selectionSize = Math.min(
    48,
    predictionWidth /
      (Math.max(...selection.map((line) => line.length), 1) * 0.6),
  );
  const choiceY = predictionY + market.length * 26 + 36;
  const detailBottom = choiceY + (selection.length - 1) * 54 + 12;
  const metricY = stacked ? detailBottom + 36 : predictionY;
  const oddsX = stacked ? left : right - (p.showAmounts ? 300 : 146);
  const amountX = stacked ? left + area / 2 : right - 146;
  const footerY = Math.max(
    (stacked ? metricY + 68 : detailBottom) + 30,
    square ? 660 : 0,
  );
  const height = square ? Math.max(width, footerY + 124) : footerY + 124;
  const canvasWidth = square ? height : width;
  const offset = (canvasWidth - width) / 2;
  const odds = Number.isFinite(p.odds) && p.odds > 0 ? p.odds.toFixed(2) : "—";
  const color =
    p.state === "Win" ? "#009c68" : p.state === "Loss" ? "#df263b" : "#b97708";
  const moneySize = (value: string, available: number) =>
    Math.min(52, available / (Math.max(value.length, 1) * 0.62));
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      data-share-artwork="ticket"
      data-arrangement={stacked ? "stacked" : "wide"}
      viewBox={`0 0 ${canvasWidth} ${height}`}
      role="img"
      aria-label={`${p.team1} — ${p.team2}. ${p.status}. Коефіцієнт ${odds}`}
    >
      <defs>
        <style data-poster-fonts="">{posterFontCss}</style>
        <mask
          id={`${id}-cut`}
          data-ticket-cut-mask=""
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={canvasWidth}
          height={height}
          style={{ maskType: "luminance" }}
        >
          <rect width={canvasWidth} height={height} rx="32" fill="white" />
          <TicketPerforation
            seam={stacked ? 128 : offset + stub}
            length={stacked ? canvasWidth : height}
            horizontal={stacked}
          />
        </mask>
      </defs>
      <g
        mask={`url(#${id}-cut)`}
        fontFamily="'MI Poster Sans', sans-serif"
        fill="#0d1116"
      >
        <rect width={canvasWidth} height={height} fill="#ffffff" />
        <rect
          data-ticket-stub=""
          width={stacked ? canvasWidth : offset + stub}
          height={stacked ? 128 : height}
          fill="#202422"
        />
        <g transform={`translate(${offset} 0)`}>
          {stacked ? (
            <g fill="#fff" data-ticket-square-header="">
              <text
                x={left}
                y="76"
                fontSize="38"
                fontWeight="800"
                letterSpacing="-1.5"
              >
                Match<tspan fill="#ff541f">IQ</tspan>
              </text>
              <text
                x="400"
                y="59"
                textAnchor="middle"
                fontSize="30"
                fontWeight="800"
              >
                {p.game}
              </text>
              <text
                x="400"
                y="91"
                textAnchor="middle"
                fontSize="22"
                fill="#b7bcb8"
              >
                {p.format || "—"}
              </text>
              <text x={right} y="59" textAnchor="end" fontSize="22">
                {p.date.date}
              </text>
              <text
                x={right}
                y="91"
                textAnchor="end"
                fontSize="22"
                fill="#b7bcb8"
              >
                {p.date.time}
              </text>
            </g>
          ) : (
            <g fill="#fff">
              <text
                x="30"
                y="78"
                fontSize="38"
                fontWeight="800"
                letterSpacing="-1.5"
              >
                Match<tspan fill="#ff541f">IQ</tspan>
              </text>
              <text x="30" y={height / 2 - 25} fontSize="46" fontWeight="800">
                {p.game}
              </text>
              <text x="30" y={height / 2 + 12} fontSize="24" fill="#b7bcb8">
                {p.format || "—"}
              </text>
              <rect
                x="30"
                y={height - 142}
                width="18"
                height="18"
                rx="4"
                fill="#ff541f"
              />
              <text x="30" y={height - 88} fontSize="22">
                {p.date.date}
              </text>
              <text x="30" y={height - 56} fontSize="22" fill="#b7bcb8">
                {p.date.time}
              </text>
            </g>
          )}
          {tournament.map((line, index) => (
            <text
              key={index}
              data-ticket-tournament=""
              x={left + area / 2 + 26}
              y={tournamentY + index * 28}
              textAnchor="middle"
              fontSize="22"
              fill="#707a84"
              textLength={Math.min(tournamentWidth, line.length * 11.5)}
              lengthAdjust="spacingAndGlyphs"
            >
              {line}
            </text>
          ))}
          <TournamentMark
            logo={p.tournamentLogo}
            x={left + area / 2 + 26 - tournamentWidth / 2 - 60}
            y={tournamentY - 30}
            size={36}
          />
          <TeamMark
            name={p.team1}
            url={p.logo1}
            x={stacked ? left + area / 4 - 36 : left}
            y={teamY}
          />
          <TeamMark
            name={p.team2}
            url={p.logo2}
            x={stacked ? right - area / 4 - 36 : right - 72}
            y={teamY}
          />
          {first.map((line, index) => (
            <text
              key={index}
              data-ticket-team=""
              x={stacked ? left + area / 4 : left + 88}
              y={nameY + index * 54}
              textAnchor={stacked ? "middle" : "start"}
              fontSize={fitTeam(first)}
              fontWeight="800"
              letterSpacing="-1.2"
            >
              {line}
            </text>
          ))}
          <text
            x={left + area / 2}
            y={nameY}
            textAnchor="middle"
            fontSize="22"
            fill="#838c94"
          >
            VS
          </text>
          {second.map((line, index) => (
            <text
              key={index}
              data-ticket-team=""
              x={stacked ? right - area / 4 : right - 88}
              y={nameY + index * 54}
              textAnchor={stacked ? "middle" : "end"}
              fontSize={fitTeam(second)}
              fontWeight="800"
              letterSpacing="-1.2"
            >
              {line}
            </text>
          ))}
          {market.map((line, index) => (
            <text
              key={index}
              x={left}
              y={predictionY + index * 26}
              fontSize={Math.min(22, predictionWidth / (line.length * 0.62))}
              fill="#5d6872"
              fontWeight="700"
            >
              {line}
            </text>
          ))}
          {selection.map((line, index) => (
            <text
              key={index}
              x={left}
              y={choiceY + index * 54}
              fontSize={selectionSize}
              fontWeight="800"
            >
              {line}
            </text>
          ))}
          <text x={oddsX} y={metricY} fontSize="22" fill="#707a84">
            Коефіцієнт
          </text>
          <text
            x={oddsX}
            y={metricY + 62}
            fontSize={moneySize(odds, 146)}
            fontWeight="800"
            data-poster-odds=""
          >
            {odds}
          </text>
          {p.showAmounts && (
            <g data-ticket-stake="">
              <text x={amountX} y={metricY} fontSize="22" fill="#707a84">
                Сума ставки
              </text>
              <text
                x={amountX}
                y={metricY + 62}
                fontSize={moneySize(p.amount, stacked ? area / 2 : 146)}
                fontWeight="800"
              >
                {p.amount}
              </text>
            </g>
          )}
          {p.showAmounts ? (
            <g data-ticket-amounts="">
              <text x={left} y={footerY + 28} fontSize="22" fill="#707a84">
                Чистий результат
              </text>
              <text
                x={left}
                y={footerY + 86}
                fontSize={moneySize(p.result, area - 240)}
                fontWeight="800"
              >
                {p.result}
              </text>
            </g>
          ) : (
            <text x={left} y={footerY + 62} fontSize="22" fill="#707a84">
              Суми приховано
            </text>
          )}
          <g
            data-poster-status=""
            transform={`translate(${right - 210} ${footerY + 12})`}
          >
            <rect width="210" height="88" rx="12" fill={color} />
            <text
              x="105"
              y="55"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="26"
              fontWeight="800"
            >
              {p.status.toUpperCase()}
            </text>
          </g>
        </g>
      </g>
    </svg>
  );
}

/** Explicit SVG layout is shared by the preview and export, with no HTML capture. */
export default function TicketShareArtwork(p: Props) {
  return p.express ? (
    <ExpressTicketArtwork {...p} />
  ) : (
    <SingleTicketArtwork {...p} />
  );
}

function ExpressTicketArtwork(p: Props) {
  const id = useId().replace(/:/g, "");
  const square = p.layout === "square";
  const squareCard = (square || p.compact) && !p.express;
  const width = squareCard ? 800 : square ? 900 : 1060;
  const stub = square ? 180 : 218;
  const left = squareCard ? 48 : stub + 38;
  const right = width - (squareCard ? 48 : 36);
  const area = right - left;
  const teamSize = squareCard ? 40 : square ? 29 : 34;
  const first = posterLines(p.team1, square ? 15 : 14);
  const second = posterLines(p.team2, square ? 15 : 14);
  const teamLines = Math.max(first.length, second.length);
  const tournament = posterLines(p.tournament, square ? 40 : 64);
  const tournamentY = squareCard ? 178 : 46;
  const tournamentMax = Math.max(...tournament.map((line) => line.length), 1);
  const tournamentTextWidth = Math.min(area - 96, tournamentMax * 9.5);
  const tournamentIconX = left + area / 2 + 38 - tournamentTextWidth / 2 - 80;
  const logoY = tournamentY + tournament.length * 27 + 12;
  const nameY = logoY + (squareCard ? 155 : square ? 117 : 53);
  const teamTextWidth = area / 2 - (square ? 65 : 150);
  const fitTeam = (lines: string[]) =>
    Math.min(
      teamSize,
      teamTextWidth / (Math.max(...lines.map((line) => line.length), 1) * 0.62),
    );
  const headerEnd = p.express
    ? 145
    : Math.max(
        squareCard ? 470 : 0,
        nameY + (teamLines - 1) * (teamSize + 6) + 40,
      );
  const market = posterLines(p.market.toUpperCase(), square ? 30 : 40);
  const selection = posterLines(
    p.selection,
    squareCard ? 22 : square ? 20 : 24,
  );
  const predictionWidth = square && !squareCard ? area : area - 230;
  const selectionSize = Math.min(
    36,
    predictionWidth /
      (Math.max(...selection.map((line) => line.length), 1) * 0.66),
  );
  const rows = expressShareRows(p.events, p.format);
  const count =
    rows.length || Number(p.format?.match(/(\d+)\s*[xх×]/i)?.[1] || 0);
  let cursor = headerEnd + 28;
  const events = rows.map((row) => {
    const lines = posterLines(row.match, square ? 31 : 45);
    const details = posterLines(row.detail, square ? 36 : 55);
    const top = cursor;
    cursor += lines.length * 29 + details.length * 23 + 27;
    return { ...row, lines, details, top };
  });
  const predictionEnd = p.express
    ? Math.max(cursor + 12, headerEnd + 100)
    : headerEnd +
      36 +
      market.length * 24 +
      28 +
      selection.length * 43 +
      24 +
      (square && !squareCard ? 150 : 0);
  const oddsTop = square && !squareCard ? predictionEnd - 145 : headerEnd;
  const footerY = Math.max(
    squareCard ? 650 : square ? 580 : 320,
    predictionEnd,
  );
  const naturalHeight = footerY + (square && !squareCard ? 230 : 136);
  const height = square ? Math.max(width, naturalHeight) : naturalHeight;
  // Vertical center of the sidebar — used to center the game/format block.
  const sideCenter = height / 2;
  // Square remains genuinely square even when an express has many events.
  const canvasWidth = square ? height : width;
  const offset = (canvasWidth - width) / 2;
  const color =
    p.state === "Win" ? "#009c68" : p.state === "Loss" ? "#df263b" : "#b97708";
  const odds = Number.isFinite(p.odds) && p.odds > 0 ? p.odds.toFixed(2) : "—";
  const amountSize = Math.min(
    39,
    275 / Math.max(p.amount.length, p.result.length),
  );
  const title = p.express
    ? `Експрес. ${count ? expressEventCount(count) : "Кількість подій не вказано"}`
    : `${p.team1} — ${p.team2}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      data-share-artwork="ticket"
      data-arrangement={squareCard ? "stacked" : "wide"}
      viewBox={`0 0 ${canvasWidth} ${height}`}
      role="img"
      aria-label={`${title}. ${p.status}. Коефіцієнт ${odds}`}
    >
      <defs>
        <style data-poster-fonts="">{posterFontCss}</style>
        <pattern
          id={`${id}-paper`}
          width="7"
          height="9"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="3" r="0.5" fill="#79756b" opacity=".08" />
        </pattern>
        <mask
          id={`${id}-cut`}
          data-ticket-cut-mask=""
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={canvasWidth}
          height={height}
          style={{ maskType: "luminance" }}
        >
          <rect width={canvasWidth} height={height} rx="22" fill="white" />
          <TicketPerforation
            seam={squareCard ? 128 : offset + stub}
            length={squareCard ? canvasWidth : height}
            horizontal={squareCard}
          />
        </mask>
      </defs>
      <g
        mask={`url(#${id}-cut)`}
        fontFamily="'MI Poster Sans', sans-serif"
        fill="#0d1116"
      >
        <rect width={canvasWidth} height={height} fill="#ffffff" />
        <rect
          data-ticket-stub=""
          width={squareCard ? canvasWidth : offset + stub}
          height={squareCard ? 128 : height}
          fill="#202422"
        />
        <rect width={canvasWidth} height={height} fill={`url(#${id}-paper)`} />
        <g transform={`translate(${offset} 0)`}>
          {squareCard ? (
            <g fill="#fff" data-ticket-square-header="">
              <text
                x={left}
                y="75"
                fontSize="34"
                fontWeight="850"
                letterSpacing="-1.5"
              >
                Match<tspan fill="#ff541f">IQ</tspan>
              </text>
              <path d="M276 38v52M526 38v52" stroke="#626663" />
              <text
                x="400"
                y="61"
                textAnchor="middle"
                fontSize="27"
                fontWeight="800"
              >
                {p.game}
              </text>
              <text
                x="400"
                y="91"
                textAnchor="middle"
                fontSize="20"
                fill="#b7bcb8"
              >
                {p.format || "—"}
              </text>
              <text x={right} y="61" textAnchor="end" fontSize="23">
                {p.date.date}
              </text>
              <text
                x={right}
                y="91"
                textAnchor="end"
                fontSize="20"
                fill="#b7bcb8"
              >
                {p.date.time}
              </text>
            </g>
          ) : (
            <g fill="#fff">
              <text
                x="32"
                y="88"
                fontSize={square ? 25 : 31}
                fontWeight="850"
                letterSpacing="-1.5"
              >
                Match<tspan fill="#ff541f">IQ</tspan>
              </text>
              <path
                d={`M32 ${sideCenter - 66}H${stub - 32}M32 ${sideCenter + 68}H${stub - 32}`}
                stroke="#626663"
              />
              <text x="32" y={sideCenter - 18} fontSize="30" fontWeight="800">
                {p.game}
              </text>
              <text x="32" y={sideCenter + 17} fontSize="23" fill="#b7bcb8">
                {p.express ? "ЕКСПРЕС" : p.format || "—"}
              </text>
              <rect
                x="32"
                y={height - 138}
                width="18"
                height="18"
                rx="4"
                fill="#ff541f"
              />
              <text x="32" y={height - 89} fontSize={square ? 18 : 22}>
                {p.date.date}
              </text>
              <text x="32" y={height - 57} fontSize="22" fill="#b7bcb8">
                {p.date.time}
              </text>
            </g>
          )}
          {p.express ? (
            <>
              <text x={left} y="83" fontSize="42" fontWeight="850">
                Експрес
              </text>
              <text x={left} y="117" fontSize="21" fill="#626873">
                {count
                  ? expressEventCount(count)
                  : "Кількість подій не вказано"}
              </text>
              <text
                x={right}
                y="76"
                textAnchor="end"
                fontSize="17"
                fill="#626873"
              >
                Коефіцієнт
              </text>
              <text
                x={right}
                y="116"
                textAnchor="end"
                fontSize="35"
                fontWeight="800"
                data-poster-odds=""
              >
                {odds}
              </text>
            </>
          ) : (
            <>
              <g
                transform={
                  squareCard
                    ? `translate(${left + area / 4 - 54} ${logoY}) scale(1.5)`
                    : undefined
                }
              >
                <TeamMark
                  name={p.team1}
                  url={p.logo1}
                  x={squareCard ? 0 : left}
                  y={squareCard ? 0 : logoY}
                />
              </g>
              <g
                transform={
                  squareCard
                    ? `translate(${right - area / 4 - 54} ${logoY}) scale(1.5)`
                    : undefined
                }
              >
                <TeamMark
                  name={p.team2}
                  url={p.logo2}
                  x={squareCard ? 0 : right - 72}
                  y={squareCard ? 0 : logoY}
                />
              </g>
              {first.map((line, i) => (
                <text
                  key={i}
                  data-ticket-team=""
                  x={squareCard ? left + area / 4 : square ? left : left + 90}
                  textAnchor={squareCard ? "middle" : "start"}
                  y={nameY + i * (teamSize + 6)}
                  fontSize={fitTeam(first)}
                  fontWeight="850"
                  letterSpacing="-1.2"
                >
                  {line}
                </text>
              ))}
              <text
                x={left + area / 2}
                y={nameY}
                textAnchor="middle"
                fontSize="21"
                fill="#838782"
              >
                VS
              </text>
              <path
                d={`M${left + area / 2 - 65} ${nameY - 7}h32M${left + area / 2 + 33} ${nameY - 7}h32`}
                stroke="#b9bcb6"
              />
              {second.map((line, i) => (
                <text
                  key={i}
                  data-ticket-team=""
                  x={
                    squareCard ? right - area / 4 : square ? right : right - 90
                  }
                  textAnchor={squareCard ? "middle" : "end"}
                  y={nameY + i * (teamSize + 6)}
                  fontSize={fitTeam(second)}
                  fontWeight="850"
                  letterSpacing="-1.2"
                >
                  {line}
                </text>
              ))}
              {tournament.map((line, i) => (
                <text
                  key={i}
                  data-ticket-tournament=""
                  x={left + area / 2 + 38}
                  textAnchor="middle"
                  y={tournamentY + i * 27}
                  fontSize="18"
                  textLength={Math.min(tournamentTextWidth, line.length * 9.5)}
                  lengthAdjust="spacingAndGlyphs"
                  fill="#626873"
                >
                  {line}
                </text>
              ))}
              {tournament.length > 0 && (
                <TournamentMark
                  logo={p.tournamentLogo}
                  x={tournamentIconX}
                  y={tournamentY - 29}
                />
              )}
            </>
          )}
          {p.express && (
            <path
              d={`M${left} ${headerEnd}H${right}`}
              stroke="#b9bcb6"
              strokeWidth="1.5"
            />
          )}
          {p.express ? (
            <>
              {events.length ? (
                events.map((event, i) => (
                  <g key={i} data-express-row="">
                    {event.lines.map((line, j) => (
                      <text
                        key={j}
                        x={left}
                        y={event.top + j * 29}
                        fontSize="22"
                        fontWeight="700"
                      >
                        {line}
                      </text>
                    ))}
                    {event.details.map((line, j) => (
                      <text
                        key={j}
                        x={left}
                        y={event.top + event.lines.length * 29 + j * 23}
                        fontSize="17"
                        fill="#626873"
                      >
                        {line}
                      </text>
                    ))}
                    <text
                      x={right}
                      y={event.top}
                      textAnchor="end"
                      fontSize="20"
                      fontWeight="700"
                    >
                      {event.odds}
                    </text>
                  </g>
                ))
              ) : (
                <text x={left} y={headerEnd + 52} fontSize="22" fill="#626873">
                  Деталі подій не збережені
                </text>
              )}
            </>
          ) : (
            <>
              {market.map((line, i) => (
                <text
                  key={i}
                  x={left}
                  y={headerEnd + 36 + i * 24}
                  fontSize={Math.min(
                    17,
                    predictionWidth / (line.length * 0.65),
                  )}
                  fill="#565d66"
                  fontWeight="650"
                >
                  {line}
                </text>
              ))}
              <text
                x={left}
                y={headerEnd + 36 + market.length * 24}
                fontSize="19"
                fill="#565d66"
              >
                Вибір:
              </text>
              {selection.map((line, i) => (
                <text
                  key={i}
                  x={left}
                  y={headerEnd + 36 + market.length * 24 + 43 + i * 43}
                  fontSize={selectionSize}
                  fontWeight="800"
                >
                  {line}
                </text>
              ))}
              {(!square || squareCard) && (
                <path
                  d={`M${right - 205} ${headerEnd + 34}v80`}
                  stroke="#b9bcb6"
                />
              )}
              <text
                x={square && !squareCard ? left : right - 166}
                y={oddsTop + 49}
                fontSize="18"
                fill="#565d66"
              >
                Коефіцієнт
              </text>
              <text
                x={square && !squareCard ? left : right - 166}
                y={oddsTop + 111}
                fontSize={square ? "58" : "42"}
                fontWeight="850"
                data-poster-odds=""
              >
                {odds}
              </text>
            </>
          )}
          <path
            d={`M${left} ${footerY}H${right}`}
            stroke="#b9bcb6"
            strokeWidth="1.5"
          />
          {p.showAmounts ? (
            <g data-ticket-amounts="">
              <text x={left} y={footerY + 39} fontSize="18" fill="#565d66">
                Сума ставки
              </text>
              <text
                x={left}
                y={footerY + 87}
                fontSize={amountSize}
                fontWeight="850"
              >
                {p.amount}
              </text>
              <path
                d={`M${left + (square && !squareCard ? 228 : 196)} ${footerY + 26}v66`}
                stroke="#b9bcb6"
              />
              <text
                x={left + (square && !squareCard ? 255 : 220)}
                y={footerY + 39}
                fontSize="18"
                fill="#565d66"
              >
                Чистий результат
              </text>
              <text
                x={left + (square && !squareCard ? 255 : 220)}
                y={footerY + 87}
                fontSize={amountSize}
                fontWeight="850"
                fill={p.result === "—" ? "#626873" : color}
              >
                {p.result}
              </text>
              {!square && (
                <path
                  d={`M${right - 210} ${footerY + 26}v66`}
                  stroke="#b9bcb6"
                />
              )}
            </g>
          ) : (
            <text x={left} y={footerY + 65} fontSize="21" fill="#626873">
              Суми приховано
            </text>
          )}
          <g
            data-poster-status=""
            transform={`translate(${right - 193} ${footerY + (square && !squareCard ? 137 : 34)})`}
          >
            <rect
              width="193"
              height="60"
              rx="7"
              stroke={color}
              strokeWidth="2"
              fill={color}
            />
            <text
              x="96.5"
              y="40"
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="'MI Poster Condensed', sans-serif"
              fontWeight="650"
              fontSize="30"
            >
              {p.status.toUpperCase()}
            </text>
          </g>
        </g>
      </g>
    </svg>
  );
}
