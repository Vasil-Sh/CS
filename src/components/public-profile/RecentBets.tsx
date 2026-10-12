import { useState } from "react";
import { Layers } from "lucide-react";
import { proxyLogoUrl } from "@/lib/logoProxy";
import {
  betDate,
  formatNumber,
  resultLabel,
  signedNumber,
  type PublicBet,
} from "./publicProfileModel";

function TeamLogo({
  url,
  team,
  game,
}: {
  url?: string | null;
  team: string;
  game: string;
}) {
  const [failed, setFailed] = useState(false);
  const source = url?.startsWith("/assets/")
    ? url
    : proxyLogoUrl(url, /dota|дота/i.test(game) ? "dota2" : "cs2");
  return source && !failed ? (
    <img
      src={source}
      alt=""
      width="36"
      height="36"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="public-team-fallback" aria-hidden="true">
      {team.slice(0, 2).toUpperCase()}
    </span>
  );
}
function BetTeams({ bet }: { bet: PublicBet }) {
  const express = /експрес|express|parlay/i.test(`${bet.betType} ${bet.match}`);
  const eventCount = express ? bet.match.match(/(\d+)\s*[xх×]/i)?.[1] : null;
  const split = bet.match.split(/\s+(?:vs\.?|v\.?|проти)\s+/i);
  const team1 = bet.team1 || split[0],
    team2 = bet.team2 || split[1];
  if (express || !team2)
    return (
      <span className="public-express">
        <Layers size={34} aria-hidden="true" />
        <span>
          {bet.match.split("|")[0]}
          <small>
            {express
              ? eventCount
                ? `${eventCount} подій`
                : "Експрес"
              : bet.game}
          </small>
        </span>
      </span>
    );
  return (
    <span className="public-match-teams">
      <span className="public-match-team">
        <TeamLogo
          key={`${team1}-${bet.logoTeam1}`}
          url={bet.logoTeam1}
          team={team1}
          game={bet.game}
        />
        <span>{team1}</span>
      </span>
      <span className="public-match-vs">vs</span>
      <span className="public-match-team">
        <TeamLogo
          key={`${team2}-${bet.logoTeam2}`}
          url={bet.logoTeam2}
          team={team2}
          game={bet.game}
        />
        <span>{team2}</span>
      </span>
    </span>
  );
}
export function RecentBets({
  bets,
  total,
  onReset,
  filtered,
}: {
  bets: PublicBet[];
  total: number;
  onReset: () => void;
  filtered: boolean;
}) {
  return (
    <section
      className="public-panel public-recent"
      aria-labelledby="public-recent-title"
    >
      <div className="public-section-heading">
        <h2 id="public-recent-title">Останні ставки</h2>
        <span>
          {bets.length} із {total}
        </span>
      </div>
      {bets.length ? (
        <>
          <div
            className="public-table-scroll"
            role="region"
            aria-label="Журнал ставок; на вузькому екрані можна прокручувати горизонтально"
          >
            <table>
              <caption className="public-sr-only">
                Останні доступні записи за вибраною грою та періодом
              </caption>
              <thead>
                <tr>
                  <th scope="col">Дата</th>
                  <th scope="col">Матч</th>
                  <th scope="col">Коеф.</th>
                  <th scope="col">Результат</th>
                  <th scope="col">Прибуток</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet, index) => (
                  <tr key={`${bet.date}-${bet.match}-${index}`}>
                    <td className="public-date">{betDate(bet.date)}</td>
                    <td>
                      <BetTeams bet={bet} />
                    </td>
                    <td>{formatNumber(bet.odds, 2)}</td>
                    <td>
                      <span
                        className={`public-result public-result--${bet.result.toLowerCase()}`}
                      >
                        <i aria-hidden="true" />
                        {resultLabel(bet.result)}
                      </span>
                    </td>
                    <td
                      className={
                        bet.profit && bet.profit > 0
                          ? "public-positive"
                          : bet.profit && bet.profit < 0
                            ? "public-negative"
                            : ""
                      }
                    >
                      {bet.profit === null ||
                      !["Win", "Loss", "Refund", "Void", "Push"].includes(
                        bet.result,
                      )
                        ? "—"
                        : `${signedNumber(bet.profit)} ${bet.currency === "USD" ? "$" : "₴"}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="public-table-note">
            Останні {bets.length} із {total} записів. Прибуток у рядках — в
            оригінальній валюті ставки.
          </p>
        </>
      ) : (
        <div className="public-empty">
          <strong>За цими фільтрами ставок немає</strong>
          <p>Коли в журналі з’являться записи, ви побачите їх тут.</p>
          {filtered && (
            <button type="button" className="public-button" onClick={onReset}>
              Показати всі ставки
            </button>
          )}
        </div>
      )}
    </section>
  );
}
