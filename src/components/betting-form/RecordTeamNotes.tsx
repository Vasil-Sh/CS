import { ShieldAlert, ArrowUpRight } from "lucide-react";
import type { RiskyTeam } from "./sidebar-types";

export default function RecordTeamNotes({
  teams,
  selection,
}: {
  teams: RiskyTeam[];
  selection: string;
}) {
  return (
    <section
      id="record-team-notes"
      className="entry-team-notes"
      tabIndex={-1}
      aria-label="Примітки до команд"
    >
      <div className="entry-notes-heading">
        <h4>
          <ShieldAlert size={17} /> Примітки до команд
        </h4>
        <a href="/app/risky-teams" target="_blank" rel="noreferrer">
          Усі команди <ArrowUpRight size={14} />
        </a>
      </div>
      {teams.length ? (
        <div className="entry-notes-grid">
          {teams.map((team, index) => (
            <article key={team.game + team.name + index}>
              <div className="entry-team-title">
                {team.logo && <img src={team.logo} alt="" />}
                <strong>{team.name}</strong>
                {selection.toLowerCase() === team.name.toLowerCase() && (
                  <small>Ваш вибір</small>
                )}
              </div>
              <div className="entry-team-tags">
                <span>{team.game}</span>
                <span
                  className={
                    /бан|ризик|нестаб/i.test(team.status)
                      ? "entry-risk-tag"
                      : ""
                  }
                >
                  {team.status}
                </span>
              </div>
              <p>{team.notes || "Коментар до цієї команди ще не додано."}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="entry-muted">
          Після введення команд тут з’являться ваші збережені статуси й
          коментарі. Відсутність приміток не означає відсутність ризику.
        </p>
      )}
    </section>
  );
}
