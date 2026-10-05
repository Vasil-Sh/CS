import { useId, useRef, useState } from "react";
import { Check, Copy, Info, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getBetTypeLabel } from "@/lib/displayHelpers";
import type { Bet } from "@/types/betting";
import { parseExpressEvents } from "@/lib/parser/expressParser";
import "./TelegramTextModal.css";

interface BetDetailsModalProps {
  bet: Bet | null;
  open: boolean;
  onClose: () => void;
}

/** Build the Telegram message text for a single bet (regular or express). */
function generateTelegramText(bet: Bet): string {
  const currencySymbol = bet.currency === "USD" ? "$" : "₴";
  const displayAmount = bet.originalAmount || bet.amount;
  const isExpressBet =
    bet.betType.includes("Експрес") || (bet.format ?? "").includes("x");
  const translate = (label: string) =>
    label
      .replace(/\bMapWinner\b/g, "Переможець карти")
      .replace(/\bMatchWinner\b/g, "Переможець матчу");

  if (isExpressBet) {
    const parsedEvents = parseExpressEvents(bet.betType);
    const eventCount = parsedEvents.length;

    let text = `🚨 Експрес-прогноз (${eventCount} події)\n\n`;

    parsedEvents.forEach((event, index) => {
      text += `📌 Подія ${index + 1}:\n`;
      text += `⚽ Матч: ${event.match}\n`;
      text += `📊 Тип: ${translate(getBetTypeLabel(event.betType, bet.format))}\n`;
      text += `🎯 Вибір: ${event.selection}\n`;
      text += `💰 Коефіцієнт: ${event.odds}\n\n`;
    });

    text += `💵 Загальний коефіцієнт: ${Number(bet.odds).toFixed(2)}\n`;
    text += `💵 Сума: ${displayAmount}${currencySymbol}\n`;

    const potentialWin = displayAmount * bet.odds;
    text += `💎 Можливий виграш: ${potentialWin.toFixed(2)}${currencySymbol}\n\n`;

    text += `🔔 Підписуйся на перевірену аналітику - @cs2beet`;

    return text;
  }

  const matchName = bet.match || `${bet.team1} vs ${bet.team2}`;
  const winProbability =
    bet.winProbability != null && !isNaN(bet.winProbability)
      ? bet.winProbability
      : null;

  let text = `🚨 Прогноз на матч: ${matchName}\n\n`;
  text += `📊 Тип прогнозу: ${translate(getBetTypeLabel(bet.betType.split(" - ")[0], bet.format))}\n`;

  if (bet.selection) {
    text += `🎯 Вибір: ${bet.selection}\n`;
  }

  text += `💰 Коефіцієнт: ${Number(bet.odds).toFixed(2)}\n`;
  text += `💵 Сума: ${displayAmount}${currencySymbol}\n`;

  if (winProbability !== null) {
    text += `📊 Імовірність виграшу: ${winProbability}%\n\n`;
  } else {
    text += `\n`;
  }

  const matchUrl = bet.matchUrl || "";
  if (matchUrl) {
    text += `🎯 Посилання на гру: ${matchUrl}\n\n`;
  } else {
    text += `🎯 Посилання на гру: [Вставте посилання на HLTV]\n\n`;
  }

  text += `🔔 Підписуйся на перевірену аналітику - @cs2beet`;

  return text;
}

interface EditorProps {
  matchName: string;
  game?: string;
  format?: string;
  initialText: string;
  onClose: () => void;
}

function TelegramTextEditor({
  matchName,
  game,
  format,
  initialText,
  onClose,
}: EditorProps) {
  // Початковий шаблон фіксується на час відкриття.
  // Оновлення батьківського компонента не стирають правки.
  const [template] = useState(initialText);
  const [text, setText] = useState(initialText);
  const [copying, setCopying] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [error, setError] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const busyRef = useRef(false);
  const fieldId = useId();
  const hintId = useId();
  const errorId = useId();

  const copied = copiedText === text;
  const changed = text !== template;
  const metadata = [game, format].filter(Boolean).join(" · ");

  function restoreTemplate() {
    if (!changed || copying) return;

    const confirmed = window.confirm(
      "Відновити початковий шаблон? Ваші зміни тексту буде втрачено.",
    );

    if (!confirmed) return;

    setText(template);
    setCopiedText(null);
    setError("");
    textareaRef.current?.focus();
  }

  async function copyText() {
    if (busyRef.current || !text.trim()) return;

    busyRef.current = true;
    setCopying(true);
    setCopiedText(null);
    setError("");

    // Копіюємо саме текст, який користувач бачить у полі.
    const snapshot = text;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }

      await navigator.clipboard.writeText(snapshot);
      setCopiedText(snapshot);
    } catch {
      setError(
        "Не вдалося скопіювати автоматично. Текст виділено — скопіюйте його вручну.",
      );

      textareaRef.current?.focus();
      textareaRef.current?.select();
    } finally {
      busyRef.current = false;
      setCopying(false);
    }
  }

  return (
    <>
      <header className="telegram-text__header">
        <DialogTitle className="telegram-text__title">
          Текст для Telegram
        </DialogTitle>

        <DialogDescription className="telegram-text__subtitle">
          Відредагуйте повідомлення перед копіюванням.
        </DialogDescription>
      </header>

      <div className="telegram-text__body">
        <div className="telegram-text__context">
          <h3>{matchName}</h3>
          {metadata && <span>{metadata}</span>}
        </div>

        <div className="telegram-text__label-row">
          <label htmlFor={fieldId}>Повідомлення</label>

          <button
            type="button"
            className="telegram-text__restore"
            onClick={restoreTemplate}
            disabled={!changed || copying}
          >
            <RotateCcw size={17} aria-hidden="true" />
            Відновити шаблон
          </button>
        </div>

        <textarea
          ref={textareaRef}
          id={fieldId}
          className="telegram-text__editor"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setCopiedText(null);
            setError("");
          }}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          spellCheck={false}
          wrap="soft"
        />

        <div className="telegram-text__notice" id={hintId}>
          <Info size={20} aria-hidden="true" />
          <p>Редагування змінює лише текст повідомлення, не запис у журналі.</p>
        </div>

        {error && (
          <p className="telegram-text__error" id={errorId} role="alert">
            {error}
          </p>
        )}
      </div>

      <footer className="telegram-text__footer">
        <button
          type="button"
          className="telegram-text__button"
          onClick={onClose}
        >
          Закрити
        </button>

        <div className="telegram-text__copy-group">
          <button
            type="button"
            className="
              telegram-text__button
              telegram-text__button--primary
            "
            onClick={copyText}
            disabled={copying || !text.trim()}
            aria-busy={copying}
          >
            {copied ? (
              <Check size={20} aria-hidden="true" />
            ) : (
              <Copy size={20} aria-hidden="true" />
            )}

            {copying
              ? "Копіювання…"
              : copied
                ? "Скопійовано"
                : "Копіювати текст"}
          </button>

          <p>Після копіювання вставте повідомлення в Telegram.</p>
        </div>

        <span className="sr-only" role="status">
          {copied ? "Текст скопійовано в буфер обміну." : ""}
        </span>
      </footer>
    </>
  );
}

export default function BetDetailsModal({
  bet,
  open,
  onClose,
}: BetDetailsModalProps) {
  if (!bet) return null;

  const matchName =
    bet.match ||
    `${bet.team1 || ""}${bet.team2 ? ` vs ${bet.team2}` : ""}`.trim();
  const recordId = String(bet.id ?? `${bet.date}-${bet.match}-${bet.amount}`);
  const initialText = generateTelegramText(bet);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="telegram-text">
        {open && (
          <TelegramTextEditor
            key={recordId}
            matchName={matchName}
            game={bet.game}
            format={bet.format}
            initialText={initialText}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
