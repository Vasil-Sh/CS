import { useId } from "react";
import { posterFontCss } from "./posterAssets";

interface Props {
  team1: string;
  team2: string;
  tournament: string[];
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

/** Word wrapping is explicit so the standalone SVG and its PNG share a layout. */
export function posterLines(value: string, limit: number): string[] {
  const words = value
    .trim()
    .split(/\s+/)
    .flatMap((word) =>
      word.length > limit
        ? word.match(new RegExp(`.{1,${limit}}`, "g")) || []
        : [word],
    );
  const lines: string[] = [];
  for (const word of words) {
    const last = lines.length - 1;
    if (last >= 0 && lines[last].length + word.length + 1 <= limit)
      lines[last] += ` ${word}`;
    else lines.push(word);
  }
  return lines.length ? lines : ["—"];
}

const ink = "#080a09",
  paper = "#faf5e6",
  orange = "#ff690b";
const heavy = "'MI Poster Sans', sans-serif";
const condensed = "'MI Poster Condensed', sans-serif";
// Cut-corner display numerals, independent of installed/exported fonts.
const digits: Record<string, string> = {
  "0": "M60 0H240L300 60V440L240 500H60L0 440V60ZM100 100V400H200V100Z",
  "1": "M70 0H220V400H290V500H20V400H120V100H70Z",
  "2": "M60 0H240L300 60V210L100 380V400H300V500H0V340L200 170V100H100V160H0V60Z",
  "3": "M0 0H240L300 60V205L255 250L300 295V440L240 500H0V400H200V300H80V200H200V100H0Z",
  "4": "M0 0H100V200H200V0H300V500H200V300H0Z",
  "5": "M0 0H300V100H100V200H240L300 260V440L240 500H0V400H200V300H0Z",
  "6": "M60 0H300V100H100V200H240L300 260V440L240 500H60L0 440V60ZM100 300V400H200V300Z",
  "7": "M0 0H300V100L145 500H35L195 100H0Z",
  "8": "M60 0H240L300 60V205L255 250L300 295V440L240 500H60L0 440V295L45 250L0 205V60ZM100 100V200H200V100ZM100 300V400H200V300Z",
  "9": "M60 0H240L300 60V440L240 500H0V400H200V300H60L0 240V60ZM100 100V200H200V100Z",
};

function monogram(name: string) {
  return name
    .replace(/^ex[- ]/i, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/\s+/)
    .filter((word) => !/^(academy|gaming|esports)$/i.test(word))
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
export default function PosterShareArtwork(p: Props) {
  const id = useId().replace(/:/g, "");
  const first = posterLines(p.team1, 19),
    second = posterLines(p.team2, 19);
  const eventLines = p.events.flatMap((event, i) =>
    posterLines(
      `${i + 1}. ${event.replace(/^\d+\.\s*/, "").replace(/\|/g, " · ")}`,
      43,
    ),
  );
  // The three editorial zones stay fixed for normal names. Extra-long data grows
  // the canvas rather than colliding with the odds or clipping the receipt.
  const extraTop =
    Math.max(0, first.length - 2) * 86 +
    Math.max(0, second.length - 1) * 90 +
    (p.express ? Math.max(0, eventLines.length - 4) * 45 : 0);
  const selection = posterLines(p.selection, 33);
  const market = posterLines(p.market.toUpperCase(), 43);
  const extraSlip =
    Math.max(0, selection.length - 1) * 62 +
    Math.max(0, market.length - 1) * 38;
  const height = 1400 + extraTop + extraSlip;
  const statusColor =
    p.state === "Win" ? "#138347" : p.state === "Loss" ? "#ce1511" : "#bd6918";
  const oddsText = p.odds.toFixed(2);
  const glyphWidth =
    [...oddsText].reduce(
      (width, char) => width + (char === "." ? 96 : 314),
      0,
    ) - 14;
  let glyphX = 0;
  const tournament = p.tournament.flatMap((part) =>
    posterLines(part.toUpperCase(), 12),
  );
  const metaSize = tournament.length > 5 ? 18 : 21;
  const firstSize = first.length === 1 ? 118 : 98;
  const secondY = 394 + Math.max(0, first.length - 2) * 86;
  const firstBaseline =
    (first.length === 1 ? 163 : 145) + (first.length - 1) * 80;
  // Center the badge in the actual inter-team gap, including wrapped names.
  const vsCenterY = (firstBaseline + 20 + secondY - 80) / 2;
  const metaGameY = Math.max(392, 256 + tournament.length * 24);
  const metaDateY = Math.max(508, metaGameY + 104);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      data-share-artwork="poster"
      viewBox={`0 0 1120 ${height}`}
      role="img"
      aria-label={`${p.team1} — ${p.team2}. ${p.status}. Коефіцієнт ${oddsText}`}
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <defs>
        <style data-poster-fonts="">{posterFontCss}</style>
        <filter id={`${id}-brush`} x="-3%" y="-10%" width="106%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.075"
            numOctaves="3"
            seed="12"
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" />
        </filter>
      </defs>
      <rect width="1120" height={height} fill={ink} />
      <image
        href="/assets/share-poster/poster-paper.webp"
        width="1120"
        height={height}
        preserveAspectRatio="none"
        data-embed-image=""
      />
      <g fill={ink} fontFamily={condensed} fontWeight="400">
        <path d="M41 36V562" stroke={ink} strokeWidth="1.5" />
        <text
          transform="translate(68 46) rotate(90)"
          fontFamily={heavy}
          fontSize="29"
          fontWeight="900"
          letterSpacing="-1.5"
        >
          MatchIQ
        </text>
        {tournament.map((line, i) => (
          <text key={i} x="65" y={251 + i * 24} fontSize={metaSize}>
            {line}
          </text>
        ))}
        <text x="65" y={metaGameY} fontSize="23" fontWeight="600">
          {p.game}
        </text>
        <text x="65" y={metaGameY + 25} fontSize="21">
          {p.format}
        </text>
        <text x="65" y={metaDateY} fontSize="21">
          {p.date.date}
        </text>
        <text x="65" y={metaDateY + 27} fontSize="23">
          {p.date.time}
        </text>
      </g>
      <g fill={paper} fontFamily={heavy} fontWeight="900" letterSpacing="-4.8">
        {p.express ? (
          <>
            <text x="234" y="147" fontSize="96">
              ЕКСПРЕС
            </text>
            {eventLines.map((line, i) => (
              <text
                key={i}
                x="234"
                y={220 + i * 45}
                fontFamily={condensed}
                fontWeight="500"
                fontSize="31"
                letterSpacing="0"
              >
                {line}
              </text>
            ))}
          </>
        ) : (
          <>
            {first.map((line, i) => (
              <text
                key={i}
                x="234"
                y={(first.length === 1 ? 163 : 145) + i * 80}
                fontSize={firstSize}
                textLength={line.length > 17 ? 840 : undefined}
                lengthAdjust="spacingAndGlyphs"
              >
                {line}
                {i === first.length - 1 && line.length < 15 && (
                  <tspan
                    aria-hidden="true"
                    dx="30"
                    dy="-10"
                    fontSize="54"
                    fontStyle="italic"
                    letterSpacing="-5"
                    fill="#adadab"
                  >
                    {monogram(p.team1)}
                  </tspan>
                )}
              </text>
            ))}
            <g
              data-poster-vs=""
              transform={`translate(234 ${vsCenterY - 27}) rotate(-8 48 27)`}
            >
              <rect width="96" height="54" fill={orange} />
              <text
                x="48"
                y="28"
                textAnchor="middle"
                dominantBaseline="central"
                fill={ink}
                fontSize="40"
                letterSpacing="-1"
              >
                VS
              </text>
            </g>
            {second.map((line, i) => (
              <text
                key={i}
                x="234"
                y={secondY + i * 90}
                fontSize={second.length === 1 && p.team2.length < 13 ? 105 : 96}
                textLength={line.length > 17 ? 840 : undefined}
                lengthAdjust="spacingAndGlyphs"
              >
                {line}
                {i === second.length - 1 && line.length < 15 && (
                  <tspan
                    aria-hidden="true"
                    dx="30"
                    dy="-10"
                    fontSize="54"
                    fontStyle="italic"
                    letterSpacing="-5"
                    fill="#adadab"
                  >
                    {monogram(p.team2)}
                  </tspan>
                )}
              </text>
            ))}
          </>
        )}
      </g>
      <g transform={`translate(747 ${449 + extraTop}) rotate(-10)`}>
        <text
          fill={paper}
          fontFamily={condensed}
          fontWeight="700"
          fontSize="39"
        >
          КОЕФІЦІЄНТ
        </text>
        <path
          d="M0 22L284 14M32 34L260 22"
          stroke={orange}
          strokeWidth="8"
          strokeLinecap="round"
          filter={`url(#${id}-brush)`}
        />
      </g>
      <g
        data-poster-odds=""
        fill={paper}
        aria-label={oddsText}
        transform={`translate(67 ${574 + extraTop}) rotate(-6) scale(${1010 / glyphWidth} 0.91)`}
      >
        {[...oddsText].map((char, i) => {
          const x = glyphX;
          glyphX += char === "." ? 96 : 314;
          return char === "." ? (
            <circle key={i} cx={x + 41} cy="459" r="43" />
          ) : (
            <path
              key={i}
              transform={`translate(${x} 0)`}
              d={digits[char]}
              fillRule="evenodd"
            />
          );
        })}
      </g>
      <g transform={`translate(22 ${1048 + extraTop}) rotate(-5.5)`}>
        <g fill={ink}>
          {market.map((line, i) => (
            <text
              key={i}
              x="70"
              y={59 + i * 38}
              fontFamily={condensed}
              fontWeight="700"
              fontSize="38"
            >
              {line}
            </text>
          ))}
          <text
            x="70"
            y={106 + (market.length - 1) * 38}
            fontFamily={condensed}
            fontWeight="400"
            fontSize="31"
          >
            Вибір:
          </text>
          {selection.map((line, i) => (
            <text
              key={i}
              x="70"
              y={164 + i * 62 + (market.length - 1) * 38}
              fontFamily={heavy}
              fontWeight="900"
              fontSize="64"
              letterSpacing="-2.6"
              textLength={line.length > 28 ? 940 : undefined}
              lengthAdjust="spacingAndGlyphs"
            >
              {line}
            </text>
          ))}
          <path
            d={`M70 ${193 + extraSlip} H1030`}
            stroke={ink}
            strokeWidth="1.6"
          />
          <path
            d={`M300 ${224 + extraSlip} V${308 + extraSlip} M640 ${224 + extraSlip} V${308 + extraSlip}`}
            stroke={ink}
            strokeWidth="1.6"
          />
          <text
            x="70"
            y={239 + extraSlip}
            fontFamily={condensed}
            fontWeight="400"
            fontSize="30"
          >
            Сума
          </text>
          <text
            x="70"
            y={308 + extraSlip}
            fontFamily={heavy}
            fontWeight="900"
            fontSize="66"
            letterSpacing="-3"
            textLength={p.amount.length > 7 ? 220 : undefined}
            lengthAdjust="spacingAndGlyphs"
          >
            {p.amount}
          </text>
          <text
            x="343"
            y={239 + extraSlip}
            fontFamily={condensed}
            fontWeight="400"
            fontSize="30"
          >
            Чистий результат
          </text>
          <text
            x="343"
            y={308 + extraSlip}
            fontFamily={heavy}
            fontWeight="900"
            fontSize="66"
            letterSpacing="-3"
            textLength={p.result.length > 8 ? 278 : undefined}
            lengthAdjust="spacingAndGlyphs"
          >
            {p.result}
          </text>
          <g data-poster-status="">
            <rect
              x="681"
              y={220 + extraSlip}
              width="354"
              height="111"
              fill={statusColor}
            />
            <text
              x="858"
              y={307 + extraSlip}
              textAnchor="middle"
              fill={paper}
              fontFamily={condensed}
              fontWeight="700"
              fontSize={p.state === "Pending" ? 53 : 72}
            >
              {p.status.toUpperCase()}
            </text>
          </g>
        </g>
      </g>
    </svg>
  );
}
