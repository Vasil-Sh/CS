import { useRef, useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, Check, Copy } from "lucide-react";
import BetShareCard from "./BetShareCard";
import type { Bet } from "@/types/betting";

interface BetShareModalProps {
  bet: Bet;
  open: boolean;
  onClose: () => void;
}

export default function BetShareModal({
  bet,
  open,
  onClose,
}: BetShareModalProps) {
  const [minW, setMinW] = useState(460);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const dragging = useRef(false);
  const start = useRef({ x: 0, w: 460 });

  const onDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    start.current = { x: e.clientX, w: minW };
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragging.current) return;
      setMinW(Math.max(460, start.current.w + e.clientX - start.current.x));
    };
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setMinW(460);
      setSaved(false);
      setCopied(false);
    }
  }, [open]);

  // Export the share card as a high-resolution canvas (via html2canvas).
  // mask-image isn't supported by html2canvas, so we strip the mask on the
  // clone and punch the ticket notches into the final canvas with the 2D API
  // (deterministic — avoids html2canvas's DOM stacking / mask artifacts).
  const captureCanvas =
    useCallback(async (): Promise<HTMLCanvasElement | null> => {
      const container = document.getElementById("bet-share-card");
      if (!container) return null;

      const card = document.getElementById("bet-share-card-inner");
      const line = container.querySelector<HTMLElement>("[data-notch-line]");
      let notchY = 0;
      let cardLeft = 0;
      let cardTop = 0;
      let cardWidth = 0;
      if (card) {
        const containerRect = container.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        cardLeft = cardRect.left - containerRect.left;
        cardTop = cardRect.top - containerRect.top;
        cardWidth = cardRect.width;
        if (line) {
          const lineRect = line.getBoundingClientRect();
          notchY = lineRect.top - cardRect.top + lineRect.height / 2;
        }
      }
      const notchR = 12;
      const scale = 3;

      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(container, {
        scale,
        backgroundColor: "#aaabac",
        useCORS: true,
        logging: false,
        onclone: (doc) => {
          const clonedCard = doc.getElementById("bet-share-card-inner");
          if (clonedCard) {
            // html2canvas can't render mask-image — remove it (we redraw notches).
            clonedCard.style.maskImage = "none";
            clonedCard.style.webkitMaskImage = "none";
            clonedCard.style.maskComposite = "";
            clonedCard.style.webkitMaskComposite = "";
            // Drop the drop-shadow filter (renders as artifact rectangle).
            const wrapper = clonedCard.parentElement;
            if (wrapper) wrapper.style.filter = "none";
            // Remove box-shadow from the status badge — html2canvas renders it as
            // an offset artifact that shifts the badge text downward.
            const badge = clonedCard.querySelector("[data-share-status]");
            if (badge) (badge as HTMLElement).style.boxShadow = "none";
          }
        },
      });

      // Punch the ticket notches into the final canvas (full gray circles centered
      // on the card's left/right edges at the dashed line's height). The half of
      // each circle outside the card blends into the gray background, the half
      // inside covers the card's 1px border → a clean semicircular cutout.
      if (notchY > 0) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#aaabac";
          for (const x of [cardLeft, cardLeft + cardWidth]) {
            ctx.beginPath();
            ctx.arc(
              x * scale,
              (cardTop + notchY) * scale,
              notchR * scale,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }
        }
      }

      return canvas;
    }, []);

  const handleDownload = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = `matchiq-bet-${Date.now()}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("[BetShareModal] export failed:", err);
    } finally {
      setSaving(false);
    }
  };

  // Copy the share card as an image to the clipboard.
  const handleCopyImage = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("toBlob"))),
          "image/png",
        );
      });
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("[BetShareModal] copy image failed:", err);
    } finally {
      setSaving(false);
    }
  };

  // Right-click on the card preview copies it as an image.
  const onCardContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    void handleCopyImage();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="p-0 gap-0 bg-white border border-gray-200 rounded-3xl overflow-visible"
        style={{
          width: minW,
          minWidth: minW,
          maxWidth: "90vw",
          height: "fit-content",
          maxHeight: "92vh",
          boxShadow:
            "0 12px 48px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)",
          userSelect: dragging.current ? "none" : undefined,
        }}
      >
        {/* Header */}
        <div
          className="relative flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50 rounded-t-3xl"
          style={{ minWidth: minW }}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
              Поділитися
            </h2>
            <button
              onClick={handleDownload}
              disabled={saving}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-50"
              title="Зберегти як зображення"
            >
              {saved ? (
                <Check className="h-4 w-4 text-green-600" strokeWidth={2} />
              ) : (
                <Download className="h-4 w-4" strokeWidth={2} />
              )}
            </button>
            <button
              onClick={() => void handleCopyImage()}
              disabled={saving}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-50"
              title="Копіювати як зображення (або правий клік на картці)"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" strokeWidth={2} />
              ) : (
                <Copy className="h-4 w-4" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* Card preview */}
        <div
          className="p-4 bg-[#aaabac]"
          id="bet-share-card"
          style={{ minWidth: minW }}
          onContextMenu={onCardContextMenu}
          title="Правий клік — копіювати як зображення"
        >
          <BetShareCard bet={bet} compact />
        </div>

        {/* Corner resize handle */}
        <div
          onMouseDown={onDown}
          className="absolute -bottom-2 -right-2 w-6 h-6 cursor-ew-resize z-10 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors select-none"
          title="Тягніть щоб змінити ширину"
        >
          <svg width="14" height="6" viewBox="0 0 14 6">
            <path
              d="M3 1v4M7 1v4M11 1v4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      </DialogContent>
    </Dialog>
  );
}
