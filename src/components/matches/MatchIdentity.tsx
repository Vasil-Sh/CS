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
              <span className="match-identity__logo">
                {team.logo ? (
                  <img src={team.logo} alt="" decoding="async" />
                ) : (
                  <span aria-hidden="true">{team.name.slice(0, 1)}</span>
                )}
              </span>

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
