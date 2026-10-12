import { Copy } from "lucide-react";
import type { GameFilter } from "./publicProfileModel";

/** Reuses the app's game silhouettes; color comes from the surrounding control. */
export function GameMark({
  game,
  paired = false,
}: {
  game: GameFilter;
  paired?: boolean;
}) {
  if (game === "all")
    return paired ? (
      <span className="public-game-pair" aria-hidden="true">
        <GameMark game="cs2" />
        <GameMark game="dota2" />
      </span>
    ) : (
      <Copy className="public-game-mark" aria-hidden="true" strokeWidth={1.8} />
    );
  return (
    <span
      className={`public-game-mark public-game-mark--${game}`}
      aria-hidden="true"
    />
  );
}
