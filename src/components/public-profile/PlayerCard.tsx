import { Check, Link2 } from "lucide-react";
import { gameOptions, type GameFilter } from "./publicProfileModel";

export function PlayerCard({
  username,
  game,
  copied,
  onShare,
}: {
  username: string;
  game: GameFilter;
  copied: boolean;
  onShare: () => void;
}) {
  return (
    <section
      className="public-player-card"
      aria-label={`Картка ${username}: ${gameOptions.find((o) => o.value === game)?.cardLabel}`}
    >
      <div className="public-cover-stack" aria-hidden="true">
        {gameOptions.map((item) => (
          <img
            key={item.value}
            src={`/assets/app/card-${item.value}.webp`}
            alt=""
            width="896"
            height="1200"
            className={`public-cover${game === item.value ? " is-active" : ""}`}
            decoding="async"
            fetchPriority={game === item.value ? "high" : "low"}
          />
        ))}
      </div>
      <div className="public-player-top">
        <span className="public-logo">
          Match<span>IQ</span>
        </span>
        <span className="public-card-game">
          {gameOptions.find((o) => o.value === game)?.cardLabel}
        </span>
      </div>
      <div className="public-player-bottom">
        <h2>@{username}</h2>
        <p>Публічний журнал ставок</p>
        <button
          type="button"
          className="public-primary public-share"
          onClick={onShare}
          aria-label={copied ? "Скопійовано" : "Поділитися"}
          data-copied={copied}
        >
          <span className="public-share-content" aria-hidden="true">
            <span className="public-share-state public-share-idle">
              Поділитися
            </span>
            <span className="public-share-state public-share-success">
              Скопійовано
            </span>
          </span>
          <span className="public-pill-arrow" aria-hidden="true">
            {copied ? <Check size={16} /> : <Link2 size={16} />}
          </span>
        </button>
      </div>
    </section>
  );
}
