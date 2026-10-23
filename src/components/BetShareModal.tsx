import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Download, Check, Copy, X, Loader2 } from "lucide-react";
import BetShareCard from "./BetShareCard";
import type { Bet } from "@/types/betting";
import { renderShareCard } from "./renderShareCard";

export default function BetShareModal({
  bet,
  open,
  onClose,
}: {
  bet: Bet;
  open: boolean;
  onClose: () => void;
}) {
  const preview = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<"download" | "copy" | null>(null);
  const [error, setError] = useState("");
  const [format, setFormat] = useState<"horizontal" | "square">("horizontal");
  const [showAmounts, setShowAmounts] = useState(true);
  const [ticketWidth, setTicketWidth] = useState(560);
  const [measuredWidth, setMeasuredWidth] = useState(560);
  const [frameNode, setFrameNode] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    const frame = frameNode;
    if (!open || !frame || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0)
        setMeasuredWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [open, frameNode]);
  const changeWidth = (value: number) => {
    setTicketWidth(value);
    setMeasuredWidth(
      frameNode
        ? Math.min(value, frameNode.parentElement?.clientWidth || value)
        : value,
    );
    if (frameNode) frameNode.style.width = `${value}px`;
  };
  const generation = useRef(0);
  useEffect(() => {
    generation.current += 1;
    setDone(null);
    setError("");
  }, [bet, open, format, showAmounts, measuredWidth]);

  const exportImage = async (action: "download" | "copy") => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    setDone(null);
    const currentGeneration = generation.current;
    try {
      const card = preview.current?.querySelector<HTMLElement>(".mi-share");
      if (!card) throw new Error("Missing preview");
      const canvas = await renderShareCard(card);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value ? resolve(value) : reject(new Error("Image encoding failed")),
          "image/png",
        ),
      );
      if (action === "copy") {
        if (currentGeneration !== generation.current) return;
        if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined")
          throw new Error("Clipboard unavailable");
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
      } else {
        if (currentGeneration !== generation.current) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `matchiq-${format}-${bet.result.toLowerCase()}-${Date.now()}.png`;
        link.href = url;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
      if (currentGeneration === generation.current) setDone(action);
    } catch (err) {
      console.error("[BetShareModal] export failed", err);
      if (currentGeneration === generation.current)
        setError(
          action === "copy"
            ? "Не вдалося скопіювати. Спробуйте завантажити PNG."
            : "Не вдалося зберегти зображення. Спробуйте ще раз.",
        );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
        setDone(null);
        setError("");
      }}
    >
      <DialogContent className="mi-share-dialog" hideCloseButton>
        <div className="mi-share-toolbar">
          <DialogTitle>Поділитися записом</DialogTitle>
          <DialogDescription>Коротко про матч і ваше рішення</DialogDescription>
          <DialogClose className="mi-share-close" aria-label="Закрити">
            <X size={24} />
          </DialogClose>
        </div>
        {error && (
          <p className="mi-share-error" role="alert">
            {error}
          </p>
        )}
        <div
          className="mi-share-preview"
          data-format={format}
          ref={preview}
          onContextMenu={(e) => {
            e.preventDefault();
            void exportImage("copy");
          }}
        >
          <div
            className="mi-ticket-resize"
            ref={setFrameNode}
            style={{ width: ticketWidth }}
            data-saving={saving}
          >
            <BetShareCard
              bet={bet}
              format={format}
              showAmounts={showAmounts}
              compact={measuredWidth < 420}
            />
          </div>
        </div>
        <div className="mi-ticket-size-controls">
          <label htmlFor="mi-ticket-width">Розмір квитка</label>
          <input
            id="mi-ticket-width"
            type="range"
            min="280"
            max="1120"
            step="10"
            value={Math.min(1120, Math.max(280, measuredWidth))}
            disabled={saving}
            onChange={(e) => changeWidth(Number(e.target.value))}
          />
          <output htmlFor="mi-ticket-width">{measuredWidth} px</output>
          <button
            type="button"
            disabled={saving}
            onClick={() => changeWidth(format === "square" ? 420 : 560)}
          >
            Скинути
          </button>
          <span>
            Потягніть нижній правий кут квитка · вузький екран перебудовує блоки
          </span>
        </div>
        <div className="mi-share-controls">
          <fieldset className="mi-share-format" disabled={saving}>
            <legend className="sr-only">Формат зображення</legend>
            <span aria-hidden="true">Формат</span>
            <div className="mi-share-segments">
              {(["horizontal", "square"] as const).map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="share-format"
                    value={value}
                    checked={format === value}
                    onChange={() => {
                      setFormat(value);
                      changeWidth(value === "square" ? 420 : 560);
                    }}
                  />
                  <span>
                    {value === "horizontal" ? "Горизонтальний" : "Квадрат"}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="mi-share-privacy">
            <span>Показувати суми</span>
            <input
              type="checkbox"
              role="switch"
              checked={showAmounts}
              disabled={saving}
              onChange={(e) => setShowAmounts(e.target.checked)}
            />
            <span className="mi-share-switch" aria-hidden="true" />
          </label>
          <div className="mi-share-actions">
            <button
              type="button"
              disabled={saving}
              onClick={() => void exportImage("copy")}
            >
              {done === "copy" ? <Check size={20} /> : <Copy size={20} />}
              {done === "copy" ? "Скопійовано" : "Копіювати зображення"}
            </button>
            <button
              type="button"
              className="mi-share-download"
              disabled={saving}
              onClick={() => void exportImage("download")}
            >
              {saving ? (
                <Loader2 size={20} className="animate-spin" />
              ) : done === "download" ? (
                <Check size={20} />
              ) : (
                <Download size={20} />
              )}
              {saving
                ? "Готуємо PNG…"
                : done === "download"
                  ? "Завантажено"
                  : "Завантажити PNG"}
            </button>
          </div>
        </div>
        <span className="sr-only" role="status">
          {saving ? "Готуємо зображення" : done ? "Зображення готове" : ""}
        </span>
      </DialogContent>
    </Dialog>
  );
}
