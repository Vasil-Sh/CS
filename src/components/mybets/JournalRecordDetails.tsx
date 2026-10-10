import type { ReactNode } from "react";
import { ArrowUpRight, CheckCircle, X, XCircle } from "lucide-react";
import type { Bet } from "@/types/betting";
import { parseExpressEvents } from "@/lib/parser/expressParser";
import { getBetTypeLabel } from "@/lib/utils/betTypeOptions";
import { journalExpress } from "./journalModel";

type Props = {
  bet: Bet;
  id: string;
  onClose: () => void;
  onExpressDetails: () => void;
  onUpdateResult: (result: "Win" | "Loss") => void;
  hiddenGoal?: ReactNode;
};

function matchLink(value?: string) {
  try {
    const url = new URL(value || "");
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** Supplemental information only; financial values stay in the parent row. */
export default function JournalRecordDetails({
  bet,
  id,
  onClose,
  onExpressDetails,
  onUpdateResult,
  hiddenGoal,
}: Props) {
  const express = journalExpress(bet);
  const events = express
    ? parseExpressEvents(bet.betType).filter((event) => event.match.trim())
    : [];
  const url = matchLink(bet.matchUrl);
  const hasMetadata =
    bet.strategy || bet.tournament || bet.notes || url || hiddenGoal;

  return (
    <section
      id={id}
      className="journal-inline-details"
      aria-labelledby={`${id}-title`}
    >
      <header className="journal-inline-header">
        <h3 id={`${id}-title`}>
          {express ? "Події експресу" : "Деталі запису"}
        </h3>
        {express && (
          <button
            type="button"
            className="journal-detail-link"
            onClick={onExpressDetails}
          >
            Повні деталі <ArrowUpRight size={16} />
          </button>
        )}
        <button
          type="button"
          className="journal-icon"
          aria-label="Закрити деталі"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </header>

      {express &&
        (events.length ? (
          <table className="journal-event-table">
            <caption className="sr-only">Події вибраного експресу</caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Матч</th>
                <th scope="col">Ринок і вибір</th>
                <th scope="col">Коеф.</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr key={`${index}-${event.match}`}>
                  <td className="journal-event-number">
                    {String(index + 1).padStart(2, "0")}
                  </td>
                  <td className="journal-event-match">
                    <strong>{event.match.replace(/\s+vs\s+/i, " — ")}</strong>
                  </td>
                  <td className="journal-event-pick">
                    {event.betType
                      ? getBetTypeLabel(event.betType)
                      : "Ринок не вказано"}
                    {event.selection && (
                      <>
                        {" "}
                        · <span>{event.selection}</span>
                      </>
                    )}
                  </td>
                  <td className="journal-event-odds" data-label="Коеф.">
                    {event.odds && Number.isFinite(Number(event.odds))
                      ? Number(event.odds).toFixed(2)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="journal-detail-empty">
            Події цього експресу не збережені у структурованому вигляді.
            Перегляньте повні деталі.
          </p>
        ))}

      {hasMetadata && (
        <div className="journal-record-context">
          <dl>
            {bet.strategy && (
              <div>
                <dt>Стратегія</dt>
                <dd>{bet.strategy}</dd>
              </div>
            )}
            {bet.tournament && (
              <div>
                <dt>Турнір</dt>
                <dd>{bet.tournament}</dd>
              </div>
            )}
            {hiddenGoal && (
              <div>
                <dt>Ціль</dt>
                <dd>{hiddenGoal}</dd>
              </div>
            )}
            {url && (
              <div>
                <dt>Посилання</dt>
                <dd>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    Відкрити матч <ArrowUpRight size={14} />
                  </a>
                </dd>
              </div>
            )}
          </dl>
          {bet.notes && (
            <div className="journal-record-note">
              <h4>Нотатки</h4>
              <p>{bet.notes}</p>
            </div>
          )}
        </div>
      )}
      {!express && !hasMetadata && (
        <p className="journal-detail-empty">
          До цього запису немає додаткових даних.
        </p>
      )}

      {bet.result === "Pending" && (
        <div className="journal-resolve">
          <span>Запис очікує результату</span>
          <div className="journal-resolve-actions">
            <button
              type="button"
              className="journal-resolve-win"
              onClick={() => onUpdateResult("Win")}
            >
              <CheckCircle size={16} /> Позначити виграш
            </button>
            <button
              type="button"
              className="journal-resolve-loss"
              onClick={() => onUpdateResult("Loss")}
            >
              <XCircle size={16} /> Позначити програш
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
