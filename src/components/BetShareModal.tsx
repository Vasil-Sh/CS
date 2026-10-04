import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Download, Check, Copy } from "lucide-react";
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

  const exportImage = async (action: "download" | "copy") => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    setDone(null);
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
        if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined")
          throw new Error("Clipboard unavailable");
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `matchiq-${bet.result.toLowerCase()}-${Date.now()}.png`;
        link.href = url;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
      setDone(action);
    } catch (err) {
      console.error("[BetShareModal] export failed", err);
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
      <DialogContent className="mi-share-dialog">
        <div className="mi-share-toolbar">
          <DialogTitle>Поділитися записом</DialogTitle>
          <button
            type="button"
            title="Завантажити PNG"
            aria-label="Завантажити PNG"
            disabled={saving}
            onClick={() => void exportImage("download")}
          >
            {done === "download" ? <Check size={18} /> : <Download size={18} />}
          </button>
          <button
            type="button"
            title="Копіювати зображення"
            aria-label="Копіювати зображення"
            disabled={saving}
            onClick={() => void exportImage("copy")}
          >
            {done === "copy" ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
        <DialogDescription className="sr-only">
          Прев’ю картки. Завантажте PNG або скопіюйте зображення.
        </DialogDescription>
        {error && (
          <p className="mi-share-error" role="alert">
            {error}
          </p>
        )}
        <div
          className="mi-share-preview"
          ref={preview}
          onContextMenu={(e) => {
            e.preventDefault();
            void exportImage("copy");
          }}
        >
          <BetShareCard bet={bet} />
        </div>
        <span className="sr-only" role="status">
          {saving ? "Готуємо зображення" : done ? "Зображення готове" : ""}
        </span>
      </DialogContent>
    </Dialog>
  );
}
