import { parseExpressEvents } from "@/lib/parser/expressParser";
import { getBetTypeLabel } from "@/lib/utils/betTypeOptions";
import { posterLines } from "./PosterShareArtwork";
import { posterFontCss } from "./posterAssets";

interface Props {
  events: string[];
  format?: string;
  game: string;
  date: string;
  odds: number;
  amount: string;
  result: string;
  status: string;
  state: string;
}

export function expressEventCount(count: number) {
  const last = count % 10,
    lastTwo = count % 100;
  return `${count} ${last === 1 && lastTwo !== 11 ? "подія" : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? "події" : "подій"}`;
}

export function expressShareRows(events: string[], format?: string) {
  return events
    .filter((event) => event.trim())
    .map((raw) => {
      const parsed = parseExpressEvents(`Експрес | ${raw}`)[0];
      const match = (parsed?.match || raw)
        .replace(/^\d+\.\s*/, "")
        .replace(/\s+vs\.?\s+/gi, " — ");
      const number = Number(parsed?.odds?.replace(",", "."));
      const odds =
        parsed?.odds && Number.isFinite(number) && number > 0
          ? number.toFixed(2)
          : "—";
      const market = getBetTypeLabel(parsed?.betType || "", format)
        .replace(/Match Winner|MatchWinner/g, "Переможець матчу")
        .replace(/Map Winner|MapWinner/g, "Переможець карти");
      const selection = parsed?.selection || "";
      // A legacy/unrecognized leg must remain visible, never silently discarded.
      const detail =
        market || selection
          ? `${market}${market && selection ? " · " : ""}${selection}`
          : raw.split("|").slice(1).join(" · ").trim();
      return { match, market, selection, detail, odds };
    });
}

const ink = "#080a09",
  paper = "#faf5e6",
  orange = "#ff690b";
const sans = "'MI Poster Sans', sans-serif",
  condensed = "'MI Poster Condensed', sans-serif";

export default function ExpressShareArtwork(p: Props) {
  const rows = expressShareRows(p.events, p.format);
  const storedCount = Number(p.format?.match(/(\d+)\s*[xх×]/i)?.[1] || 0);
  const count = rows.length || storedCount;
  const countLabel = count
    ? expressEventCount(count)
    : "Кількість подій не вказано";
  let cursor = 306;
  const layout = rows.map((row) => {
    const matchLines = posterLines(row.match, 37);
    const detailLines = posterLines(row.detail, 41);
    const height =
      136 + (matchLines.length - 1) * 47 + (detailLines.length - 1) * 40;
    const top = cursor;
    cursor += height;
    return { ...row, matchLines, detailLines, top, height };
  });
  // Expand, don't shrink, for more legs or longer names. The footer retains its
  // size and the background's paper boundary follows it, including in PNG.
  const footerTop = (rows.length ? cursor : 500) + 99;
  const height = footerTop + 400;
  const statusColor =
    p.state === "Win" ? "#138347" : p.state === "Loss" ? "#ce1511" : "#bd6918";
  const backdrop = "/assets/share-poster/express-paper.webp";
  const odds = Number.isFinite(p.odds) && p.odds > 0 ? p.odds.toFixed(2) : "—";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      data-share-artwork="express"
      viewBox={`0 0 1080 ${height}`}
      role="img"
      aria-label={`Експрес. ${countLabel}. ${p.status}. Загальний коефіцієнт ${odds}`}
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <defs>
        <style data-poster-fonts="">{posterFontCss}</style>
      </defs>
      <rect width="1080" height={height} fill={ink} />
      <svg
        width="1080"
        height={footerTop}
        viewBox="0 0 1080 1080"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <image
          data-embed-image=""
          href={backdrop}
          width="1080"
          height="1480"
          preserveAspectRatio="none"
        />
      </svg>
      <svg
        y={footerTop - 1}
        width="1080"
        height="401"
        viewBox="0 1079 1080 401"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <image
          data-embed-image=""
          href={backdrop}
          width="1080"
          height="1480"
          preserveAspectRatio="none"
        />
      </svg>
      <g fontFamily={sans} fontWeight="900" fill={paper}>
        <text x="60" y="92" fontSize="55" letterSpacing="-2.5">
          Match<tspan fill={orange}>IQ</tspan>
        </text>
        <text x="57" y="214" fontSize="133" letterSpacing="-6">
          ЕКСПРЕС
        </text>
      </g>
      <g fontFamily={condensed} fontWeight="600">
        <rect
          x="831"
          y="141"
          width="190"
          height="73"
          rx="10"
          fill={ink}
          stroke={orange}
          strokeWidth="3"
        />
        <text x="926" y="191" fill={orange} textAnchor="middle" fontSize="36">
          {count ? countLabel.toUpperCase() : "ЕКСПРЕС"}
        </text>
        <text x="61" y="268" fontSize={count ? 37 : 26} fill="#b9bbb5">
          {countLabel} · {p.game}
          <tspan dx="25">│</tspan>
          <tspan dx="25">{p.date}</tspan>
        </text>
      </g>
      <g fontFamily={condensed}>
        {layout.map((row, index) => (
          <g
            key={index}
            data-express-row=""
            transform={`translate(0 ${row.top})`}
          >
            <path d="M61 0H1021" stroke="#787b74" strokeWidth="1.5" />
            <path
              d={`M166 28V${row.height - 24}`}
              stroke="#787b74"
              strokeWidth="1.5"
            />
            <text x="61" y="96" fill={orange} fontSize="69" fontWeight="700">
              {String(index + 1).padStart(2, "0")}
            </text>
            {row.matchLines.map((line, i) => (
              <text
                key={i}
                x="205"
                y={58 + i * 47}
                fill={paper}
                fontSize="43"
                fontWeight="700"
                textLength={line.length > 31 ? 635 : undefined}
                lengthAdjust="spacingAndGlyphs"
              >
                {line}
              </text>
            ))}
            {row.detailLines.length === 1 && row.market && row.selection ? (
              <text
                x="205"
                y={103 + (row.matchLines.length - 1) * 47}
                fill="#b9bbb5"
                fontSize="36"
                fontWeight="500"
                textLength={row.detail.length > 35 ? 635 : undefined}
                lengthAdjust="spacingAndGlyphs"
              >
                {row.market} ·{" "}
                <tspan fill={paper} fontWeight="600">
                  {row.selection}
                </tspan>
              </text>
            ) : (
              row.detailLines.map((line, i) => (
                <text
                  key={i}
                  x="205"
                  y={103 + (row.matchLines.length - 1) * 47 + i * 40}
                  fill="#b9bbb5"
                  fontSize="35"
                  fontWeight="500"
                  textLength={line.length > 35 ? 635 : undefined}
                  lengthAdjust="spacingAndGlyphs"
                >
                  {line}
                </text>
              ))
            )}
            <text
              x="1021"
              y="96"
              data-express-leg-odds=""
              textAnchor="end"
              fill={paper}
              fontSize="70"
              fontWeight="700"
              textLength={row.odds.length > 5 ? 145 : undefined}
              lengthAdjust="spacingAndGlyphs"
            >
              {row.odds}
            </text>
          </g>
        ))}
        {!rows.length && (
          <text x="61" y="395" fontSize="36" fill={paper}>
            Деталі подій не збережені
          </text>
        )}
      </g>
      <g transform={`translate(19 ${footerTop}) rotate(-4.5)`} fill={ink}>
        <text
          x="61"
          y="65"
          fontFamily={condensed}
          fontWeight="700"
          fontSize="33"
        >
          ЗАГАЛЬНИЙ КОЕФІЦІЄНТ
        </text>
        <text
          x="54"
          y="188"
          data-poster-odds=""
          fontFamily={sans}
          fontWeight="900"
          fontSize="146"
          letterSpacing="-4"
          textLength={odds.length > 5 ? 420 : undefined}
          lengthAdjust="spacingAndGlyphs"
        >
          {odds}
        </text>
        <path
          d="M61 218H1012 M293 248V352 M656 248V352"
          stroke={ink}
          strokeWidth="1.6"
        />
        <g fontFamily={condensed} fontWeight="700" fontSize="31">
          <text x="61" y="266">
            СУМА
          </text>
          <text x="330" y="266">
            ЧИСТИЙ РЕЗУЛЬТАТ
          </text>
        </g>
        <g fontFamily={sans} fontWeight="900" fontSize="70" letterSpacing="-3">
          <text
            x="58"
            y="346"
            textLength={p.amount.length > 7 ? 220 : undefined}
            lengthAdjust="spacingAndGlyphs"
          >
            {p.amount}
          </text>
          <text
            x="327"
            y="346"
            textLength={p.result.length > 7 ? 310 : undefined}
            lengthAdjust="spacingAndGlyphs"
          >
            {p.result}
          </text>
        </g>
        <g data-poster-status="">
          <rect x="687" y="243" width="328" height="116" fill={statusColor} />
          <text
            x="851"
            y="329"
            textAnchor="middle"
            fill={paper}
            fontFamily={condensed}
            fontWeight="700"
            fontSize={p.state === "Pending" ? 50 : 76}
          >
            {p.status.toUpperCase()}
          </text>
        </g>
      </g>
    </svg>
  );
}
