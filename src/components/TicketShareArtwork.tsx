import { useId, useState } from "react";
import { posterFontCss } from "./posterAssets";
import { posterLines } from "./PosterShareArtwork";
import { expressShareRows, expressEventCount } from "./ExpressShareArtwork";

interface Props {
  layout: "horizontal" | "square";
  showAmounts: boolean;
  team1: string;
  team2: string;
  logo1?: string | null;
  logo2?: string | null;
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

/** Explicit SVG layout is shared by the preview and export, with no HTML capture. */
export default function TicketShareArtwork(p: Props) {
  const id = useId().replace(/:/g, "");
  const square = p.layout === "square";
  const width = square ? 900 : 1200;
  const stub = square ? 180 : 218;
  const left = stub + 46;
  const right = width - 44;
  const area = right - left;
  const teamSize = square ? 29 : 38;
  const first = posterLines(p.team1, square ? 15 : 17);
  const second = posterLines(p.team2, square ? 15 : 17);
  const teamLines = Math.max(first.length, second.length);
  const nameY = square ? 166 : 102;
  const tournament = posterLines(p.tournament, square ? 40 : 62);
  const tournamentY = nameY + teamLines * (teamSize + 6) + 7;
  const headerEnd = p.express ? 145 : tournamentY + tournament.length * 27 + 22;
  const market = posterLines(p.market.toUpperCase(), square ? 30 : 40);
  const selection = posterLines(p.selection, square ? 20 : 27);
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
      (square ? 150 : 0);
  const oddsTop = square ? predictionEnd - 145 : headerEnd;
  const footerY = Math.max(square ? 580 : 320, predictionEnd);
  const naturalHeight = footerY + (square ? 230 : 136);
  const height = square ? Math.max(width, naturalHeight) : naturalHeight;
  // Square remains genuinely square even when an express has many events.
  const canvasWidth = square ? height : width;
  const offset = (canvasWidth - width) / 2;
  const color =
    p.state === "Win" ? "#009c68" : p.state === "Loss" ? "#df263b" : "#b97708";
  const odds = Number.isFinite(p.odds) && p.odds > 0 ? p.odds.toFixed(2) : "—";
  const amountSize = Math.min(
    39,
    335 / Math.max(p.amount.length, p.result.length),
  );
  const title = p.express
    ? `Експрес. ${count ? expressEventCount(count) : "Кількість подій не вказано"}`
    : `${p.team1} — ${p.team2}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      data-share-artwork="ticket"
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
        <mask id={`${id}-cut`}>
          <rect width={canvasWidth} height={height} rx="22" fill="white" />
          <circle cx={offset + stub} cy="0" r="20" fill="black" />
          <circle cx={offset + stub} cy={height} r="20" fill="black" />
        </mask>
      </defs>
      <g
        mask={`url(#${id}-cut)`}
        fontFamily="'MI Poster Sans', sans-serif"
        fill="#0d1116"
      >
        <rect width={canvasWidth} height={height} fill="#faf9f5" />
        <rect width={offset + stub} height={height} fill="#202422" />
        <rect width={canvasWidth} height={height} fill={`url(#${id}-paper)`} />
        <g transform={`translate(${offset} 0)`}>
          <path
            d={`M${stub} 27V${height - 27}`}
            stroke="#eeede9"
            strokeWidth="3"
            strokeDasharray="9 8"
          />
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
              d={`M32 136H${stub - 32}M32 264H${stub - 32}`}
              stroke="#626663"
            />
            <text x="32" y="190" fontSize="30" fontWeight="800">
              {p.game}
            </text>
            <text x="32" y="225" fontSize="23" fill="#b7bcb8">
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
              <TeamMark
                name={p.team1}
                url={p.logo1}
                x={left}
                y={square ? 47 : 54}
              />
              <TeamMark
                name={p.team2}
                url={p.logo2}
                x={right - 72}
                y={square ? 47 : 54}
              />
              {first.map((line, i) => (
                <text
                  key={i}
                  x={square ? left : left + 92}
                  y={nameY + i * (teamSize + 6)}
                  fontSize={teamSize}
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
                fontSize="32"
                fill="#838782"
              >
                —
              </text>
              {second.map((line, i) => (
                <text
                  key={i}
                  x={square ? right : right - 92}
                  textAnchor="end"
                  y={nameY + i * (teamSize + 6)}
                  fontSize={teamSize}
                  fontWeight="850"
                  letterSpacing="-1.2"
                >
                  {line}
                </text>
              ))}
              {tournament.map((line, i) => (
                <text
                  key={i}
                  x={left}
                  y={tournamentY + i * 27}
                  fontSize="20"
                  fill="#626873"
                >
                  {line}
                </text>
              ))}
            </>
          )}
          <path
            d={`M${left} ${headerEnd}H${right}`}
            stroke="#b9bcb6"
            strokeWidth="1.5"
          />
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
                  fontSize="17"
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
                  fontSize="36"
                  fontWeight="800"
                >
                  {line}
                </text>
              ))}
              {!square && (
                <path
                  d={`M${right - 205} ${headerEnd + 34}v80`}
                  stroke="#b9bcb6"
                />
              )}
              <text
                x={square ? left : right - 166}
                y={oddsTop + 49}
                fontSize="18"
                fill="#565d66"
              >
                Коефіцієнт
              </text>
              <text
                x={square ? left : right - 166}
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
                d={`M${left + (square ? 228 : 245)} ${footerY + 26}v66`}
                stroke="#b9bcb6"
              />
              <text
                x={left + (square ? 255 : 280)}
                y={footerY + 39}
                fontSize="18"
                fill="#565d66"
              >
                Чистий результат
              </text>
              <text
                x={left + (square ? 255 : 280)}
                y={footerY + 87}
                fontSize={amountSize}
                fontWeight="850"
                fill={p.result === "—" ? "#626873" : color}
              >
                {p.result}
              </text>
            </g>
          ) : (
            <text x={left} y={footerY + 65} fontSize="21" fill="#626873">
              Суми приховано
            </text>
          )}
          <g
            data-poster-status=""
            transform={`translate(${right - 193} ${footerY + (square ? 137 : 34)}) rotate(-5 96 30)`}
          >
            <rect
              width="193"
              height="60"
              rx="7"
              stroke={color}
              strokeWidth="2"
              fill={color}
              fillOpacity=".04"
            />
            <text
              x="96.5"
              y="40"
              textAnchor="middle"
              fill={color}
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
