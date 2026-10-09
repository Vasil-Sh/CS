import { useState } from "react";
import "./MatchIdentity.css";

type Team = {
  name: string;
  logo?: string;
};

type MatchIdentityProps = {
  tournament: string;
  stage?: string;
  game: string;
  format: string;
  time: string;
  isLive?: boolean;
  team1: Team;
  team2: Team;
};

function TeamLogo({ team, game }: { team: Team; game: string }) {
  const [failed, setFailed] = useState(false);
  const placeholder =
    game === "Dota 2"
      ? "/assets/team-placeholder-dota.svg"
      : "/assets/team-placeholder-cs2.svg";

  if (!team.logo || failed) {
    return (
      <span className="match-identity__logo">
        <img src={placeholder} alt="" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className="match-identity__logo">
      <img
        src={team.logo}
        alt=""
        decoding="async"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export function MatchIdentity({
  tournament,
  stage,
  game,
  format,
  time,
  isLive = false,
  team1,
  team2,
}: MatchIdentityProps) {
  const eventLabel = [tournament, stage].filter(Boolean).join(" · ");

  return (
    <div className="match-identity">
      <div className="match-identity__header">
        <span className="match-identity__tournament" title={eventLabel}>
          {eventLabel}
        </span>

        <span
          className={`match-identity__game match-identity__game--${game === "Dota 2" ? "Dota2" : "CS2"}`}
        >
          {game}
        </span>

        <span className="match-identity__format">{format}</span>
      </div>

      <div className="match-identity__body">
        <div className="match-identity__meta">
          <time className="match-identity__time" dateTime={time}>
            {time}
          </time>

          {isLive && (
            <span className="match-identity__live">
              <span aria-hidden="true" />
              LIVE
            </span>
          )}
        </div>

        <div className="match-identity__teams">
          {[team1, team2].map((team, index) => (
            <div className="match-identity__team" key={index}>
              <TeamLogo team={team} game={game} />
              <span className="match-identity__name" title={team.name}>
                {team.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
