import { useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  FilePlus2,
  Layers,
  Link2,
  Pencil,
  Plus,
} from "lucide-react";
import "./TeamComparison.css";

export type Team = {
  id: string;
  name: string;
  logo?: string | null;
  placeholder?: string | null;
  rank?: number | null;
  form?: string | null;
  status?: {
    label: string;
    tone: "warning" | "danger" | "success" | "neutral";
  } | null;
  note?: string | null;
};

type Props = {
  teams: readonly [Team, Team];
  sourceUrl?: string;
  onEditNote: (team: Team) => void;
  onAddToExpress: () => void;
  onAddRecord: () => void;
};

function TeamLogo({ team }: { team: Team }) {
  const [failed, setFailed] = useState(false);
  const src = team.logo && !failed ? team.logo : team.placeholder;
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      width={36}
      height={36}
      onError={() => setFailed(true)}
    />
  );
}

export function TeamComparison({
  teams,
  sourceUrl,
  onEditNote,
  onAddToExpress,
  onAddRecord,
}: Props) {
  // Не допускаємо javascript: та інші небезпечні URL.
  const safeSourceUrl = (() => {
    try {
      const url = new URL(sourceUrl ?? "");
      return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
    } catch {
      return undefined;
    }
  })();

  return (
    <section className="team-comparison" aria-label="Порівняння команд">
      <h3 className="team-comparison__title">Порівняння команд</h3>

      <div
        className="team-comparison__scroll"
        role="region"
        aria-label="Таблиця порівняння команд"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        <table className="team-comparison__table">
          <caption className="team-comparison__sr-only">
            Рейтинг, форма, статус і нотатки команд
          </caption>

          <colgroup>
            <col className="team-comparison__label-column" />
            <col />
            <col />
          </colgroup>

          <thead>
            <tr>
              <th scope="col">
                <span className="team-comparison__sr-only">Показник</span>
              </th>

              {teams.map((team) => (
                <th scope="col" key={team.id}>
                  <div className="team-comparison__team">
                    <TeamLogo team={team} />
                    <span>{team.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr>
              <th scope="row">Рейтинг</th>
              {teams.map((team) => (
                <td key={team.id}>
                  {team.rank != null && team.rank > 0 ? `#${team.rank}` : "—"}
                </td>
              ))}
            </tr>

            <tr>
              <th scope="row">Форма</th>
              {teams.map((team) => (
                <td key={team.id}>
                  {team.form || (
                    <span className="team-comparison__muted">
                      Форма не надана
                    </span>
                  )}
                </td>
              ))}
            </tr>

            <tr>
              <th scope="row">Статус</th>
              {teams.map((team) => (
                <td key={team.id}>
                  <span
                    className={`team-comparison__badge ${`team-comparison__badge--${team.status?.tone ?? "neutral"}`}`}
                  >
                    {(team.status?.tone === "warning" ||
                      team.status?.tone === "danger") && (
                      <AlertCircle size={16} aria-hidden="true" />
                    )}
                    {team.status?.label ?? "Не позначено"}
                  </span>
                </td>
              ))}
            </tr>

            <tr>
              <th scope="row">Нотатка</th>
              {teams.map((team) => (
                <td key={team.id}>
                  {team.note?.trim() ? (
                    <div className="team-comparison__note">
                      <p>{team.note}</p>

                      <button
                        type="button"
                        className="team-comparison__edit"
                        onClick={() => onEditNote(team)}
                        aria-label={`Редагувати нотатку: ${team.name}`}
                        title="Редагувати нотатку"
                      >
                        <Pencil size={18} aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="team-comparison__add-note"
                      onClick={() => onEditNote(team)}
                    >
                      <Plus size={18} aria-hidden="true" />
                      Додати нотатку
                    </button>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <footer className="team-comparison__footer">
        <div className="team-comparison__action-slot">
          {safeSourceUrl ? (
            <a
              className="team-comparison__action"
              href={safeSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Link2 size={20} aria-hidden="true" />
              Джерело матчу
              <ExternalLink size={15} aria-hidden="true" />
            </a>
          ) : (
            <span className="team-comparison__muted">Джерело не вказане</span>
          )}
        </div>

        <div className="team-comparison__action-slot">
          <button
            type="button"
            className="team-comparison__action"
            onClick={onAddToExpress}
          >
            <Layers size={20} aria-hidden="true" />
            До експресу
          </button>
        </div>

        <div className="team-comparison__action-slot">
          <button
            type="button"
            className="team-comparison__primary"
            onClick={onAddRecord}
          >
            <FilePlus2 size={20} aria-hidden="true" />
            Додати запис
          </button>
        </div>
      </footer>
    </section>
  );
}
