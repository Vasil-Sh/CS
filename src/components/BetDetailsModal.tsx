import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, FileText } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { getBetTypeLabel } from '@/lib/displayHelpers';
import type { Bet } from "@/types/betting";
import {
  parseExpressEvents,
  type ParsedEvent,
} from "@/lib/parser/expressParser";

interface BetDetailsModalProps {
  bet: Bet | null;
  open: boolean;
  onClose: () => void;
}

export default function BetDetailsModal({
  bet,
  open,
  onClose,
}: BetDetailsModalProps) {
  const [copied, setCopied] = useState(false);
  const [editableText, setEditableText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (bet && open) {
      setEditableText(generateTelegramText());
    }
  }, [bet, open]);

  if (!bet) return null;

  const currencySymbol = bet.currency === "USD" ? "$" : "₴";
  const displayAmount = bet.originalAmount || bet.amount;

  const isExpressBet =
    bet.betType.includes("Експрес") || bet.format.includes("x");

  const generateTelegramText = () => {
    if (isExpressBet) {
      const parsedEvents = parseExpressEvents(bet.betType);
      const eventCount = parsedEvents.length;

      let text = `🚨 Експрес-прогноз (${eventCount} події)\n\n`;

      parsedEvents.forEach((event, index) => {
        text += `📌 Подія ${index + 1}:\n`;
        text += `⚽ Матч: ${event.match}\n`;
        text += `📊 Тип: ${getBetTypeLabel(event.betType, bet.format).replace(/\bMapWinner\b/g, 'Переможець карти').replace(/\bMatchWinner\b/g, 'Переможець матчу')}\n`;
        text += `🎯 Вибір: ${event.selection}\n`;
        text += `💰 Коефіцієнт: ${event.odds}\n\n`;
      });

      text += `💵 Загальний коефіцієнт: ${Number(bet.odds).toFixed(2)}\n`;
      text += `💵 Сума: ${displayAmount}${currencySymbol}\n`;

      const potentialWin = displayAmount * bet.odds;
      text += `💎 Можливий виграш: ${potentialWin.toFixed(2)}${currencySymbol}\n\n`;

      text += `🔔 Підписуйся на перевірену аналітику - @cs2beet`;

      return text;
    } else {
      const matchName = bet.match || `${bet.team1} vs ${bet.team2}`;
      const winProbability =
        bet.winProbability != null && !isNaN(bet.winProbability)
          ? bet.winProbability
          : null;

      let text = `🚨 Прогноз на матч: ${matchName}\n\n`;
      text += `📊 Тип прогнозу: ${getBetTypeLabel(bet.betType.split(" - ")[0], bet.format).replace(/\bMapWinner\b/g, 'Переможець карти').replace(/\bMatchWinner\b/g, 'Переможець матчу')}\n`;

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
  };

  const handleCopyToClipboard = () => {
    if (textareaRef.current) {
      textareaRef.current.select();
      textareaRef.current.setSelectionRange(0, 99999);

      try {
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard
            .writeText(editableText)
            .then(() => {
              setCopied(true);
              toast.success("Текст скопійовано в буфер обміну!");
              copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => {
              fallbackCopy();
            });
        } else {
          fallbackCopy();
        }
      } catch (error) {
        fallbackCopy();
      }
    }
  };

  const fallbackCopy = () => {
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        setCopied(true);
        toast.success("Текст скопійовано в буфер обміну!");
        copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
      } else {
        toast.error("Помилка при копіюванні");
      }
    } catch (error) {
      toast.error("Помилка при копіюванні");
      if (import.meta.env.DEV) console.error("Copy error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 rounded-3xl p-0 gap-0"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}
      >
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-100 flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Текст для Telegram
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="border-t border-gray-200" />

        <div className="px-6 pb-6 pt-4 space-y-3 bg-gray-100">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-medium text-gray-900 uppercase tracking-wide">
              Формат тексту
            </span>
            <Button
              onClick={handleCopyToClipboard}
              size="sm"
              className={`rounded-xl text-sm font-medium h-9 px-4 transition-all duration-200 ${
                copied
                  ? "bg-[#DCFCE7] hover:bg-[#DCFCE7] text-green-600 border border-[#86EFAC]"
                  : "bg-primary hover:bg-blue-700 text-white"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" strokeWidth={2} />
                  Скопійовано
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Копіювати
                </>
              )}
            </Button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <Textarea
              ref={textareaRef}
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              className="min-h-[320px] font-mono text-sm bg-white border-0 rounded-2xl p-4 resize-none focus:ring-0 focus:outline-none text-gray-700 w-full"
            />
          </div>
          <p className="text-xs text-gray-400 font-normal">
            💡 Ви можете відредагувати текст перед копіюванням.{" "}
            {!isExpressBet &&
              !bet.matchUrl &&
              'Не забудьте замінити "[Вставте посилання на HLTV]" на реальне посилання на матч'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
