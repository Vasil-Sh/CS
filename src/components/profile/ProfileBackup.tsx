import { useRef, useState, type ReactNode } from "react";
import {
  Download,
  Upload,
  AlertTriangle,
  Trash2,
  X,
  Loader2,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import "./ProfileBackup.css";
import "./ProfileRedesign.css";
import "./ProfileSections.css";

interface Props {
  header?: ReactNode;
  storageSize: string;
  lastBackupDate: Date | null;
  isExporting: boolean;
  isImporting: boolean;
  isClearing: boolean;
  onExport: () => void;
  onImport: (file: File) => void;
  onClear: () => void;
}

export default function ProfileBackup({
  header,
  storageSize,
  lastBackupDate,
  isExporting,
  isImporting,
  isClearing,
  onExport,
  onImport,
  onClear,
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const busy = isExporting || isImporting || isClearing;
  const lastExport =
    lastBackupDate && !Number.isNaN(lastBackupDate.getTime())
      ? lastBackupDate.toLocaleString("uk-UA", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;
  const localizedSize = Number.isFinite(Number(storageSize))
    ? Number(storageSize).toLocaleString("uk-UA", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
    : storageSize;

  const selectFile = (candidate?: File) => {
    if (!candidate || busy) return;
    if (!candidate.name.toLowerCase().endsWith(".json")) {
      toast.error("Оберіть файл бекапу у форматі JSON");
      return;
    }
    if (!candidate.size) {
      toast.error("Файл порожній. Оберіть збережений бекап MatchIQ");
      return;
    }
    setFile(candidate);
  };

  return (
    <>
      <section className="mqp-hero is-compact is-photo is-backup" aria-label="Дані та бекап">
        {header}
      </section>
      <div className="mqp-backup" aria-busy={busy}>
        <section className="mqp-card" aria-label="Огляд локальних даних">
          <dl className="mqp-stats">
            <div>
              <dt>Локальні дані</dt>
              <dd>{localizedSize} КБ</dd>
            </div>
            <div>
              <dt>Останній експорт</dt>
              <dd>
                {lastExport ? (
                  <time dateTime={lastBackupDate!.toISOString()}>
                    {lastExport}
                  </time>
                ) : (
                  "Ще не було"
                )}
              </dd>
            </div>
            <div>
              <dt>Формат копії</dt>
              <dd>JSON</dd>
            </div>
          </dl>
        </section>
        <p className="mqp-scope">
          Експортуються дані цього браузера. Це не копія серверної бази.
        </p>

        <div className="mqp-row">
          <section className="mqp-card" aria-labelledby="backup-export-title">
            <div className="mqp-card-head">
              <h2 id="backup-export-title">Завантажити бекап</h2>
            </div>
            <p className="mqp-text">
              Усі локальні дані в одному JSON-файлі. Збережіть копію перед
              змінами або перенесенням на інший пристрій.
            </p>
            <button
              type="button"
              className="mqp-pill"
              onClick={onExport}
              disabled={busy}
            >
              {isExporting ? "Створення копії…" : "Завантажити повний бекап"}
              <span className="mqp-pill-arrow" aria-hidden="true">
                {isExporting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
              </span>
            </button>
          </section>
          <section className="mqp-card" aria-labelledby="backup-contents-title">
            <div className="mqp-card-head">
              <h2 id="backup-contents-title">Що входить у копію</h2>
            </div>
            <ul className="mqp-checklist">
              {[
                "Ставки",
                "Цілі",
                "Ризикові команди",
                "Telegram-групи",
                "Стратегії",
                "Налаштування",
              ].map((item) => (
                <li key={item}>
                  <span aria-hidden="true">
                    <Check size={13} strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mqp-note">Лише дані, доступні в цьому браузері.</p>
          </section>
        </div>

        <section className="mqp-card" aria-labelledby="backup-restore-title">
          <div className="mqp-card-head">
            <h2 id="backup-restore-title">Відновити з бекапу</h2>
          </div>
          <p className="mqp-text">Оберіть раніше збережений JSON-файл MatchIQ.</p>
          <div className="mqp-warning">
            <AlertTriangle size={18} aria-hidden="true" />
            <span>
              Відновлення замінить відповідні локальні дані. Спочатку збережіть
              поточну копію.
            </span>
          </div>
          <div
            role="group"
            aria-label="Вибір файлу для відновлення"
            aria-describedby="backup-restore-hint"
            className={`mqp-dropzone${dragging ? " is-dragging" : ""}${file ? " has-file" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              if (!busy) {
                dragDepth.current++;
                setDragging(true);
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = busy ? "none" : "copy";
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              dragDepth.current = Math.max(0, dragDepth.current - 1);
              if (!dragDepth.current) setDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              dragDepth.current = 0;
              setDragging(false);
              selectFile(event.dataTransfer.files[0]);
            }}
          >
            <span className="mqp-icon is-white">
              <Upload size={19} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div className="mqp-dropzone-copy" aria-live="polite">
              <strong>{file ? file.name : "Перетягніть JSON-файл сюди"}</strong>
              <span>
                {file
                  ? `${(file.size / 1024).toLocaleString("uk-UA", { maximumFractionDigits: 1 })} КБ · Файл обрано`
                  : "або оберіть його на пристрої"}
              </span>
            </div>
            <div className="mqp-dropzone-actions">
              {file && (
                <button
                  type="button"
                  className="mqp-round"
                  aria-label="Прибрати обраний файл"
                  disabled={busy}
                  onClick={() => setFile(null)}
                >
                  <X size={17} aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                className="mqp-btn-outline"
                disabled={busy}
                onClick={() => input.current?.click()}
              >
                {file ? "Змінити файл" : "Обрати файл"}
              </button>
            </div>
            <input
              ref={input}
              type="file"
              accept=".json,application/json"
              aria-label="Файл бекапу JSON"
              hidden
              disabled={busy}
              onChange={(event) => {
                selectFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>
          <p className="mqp-note" id="backup-restore-hint">
            Дані зміняться лише після перевірки файлу та вашого підтвердження.
          </p>
          {file && (
            <div>
              <button
                type="button"
                className="mqp-pill"
                disabled={busy}
                onClick={() => setConfirmOpen(true)}
              >
                {isImporting ? "Відновлення…" : "Відновити дані"}
                <span className="mqp-pill-arrow" aria-hidden="true">
                  {isImporting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                </span>
              </button>
            </div>
          )}
        </section>

        <section
          className="mqp-card mqp-danger"
          aria-labelledby="backup-clear-title"
        >
          <div>
            <h2 id="backup-clear-title">Очистити дані</h2>
            <p className="mqp-text">
              Буде видалено ставки, команди, стратегії, цілі та Telegram-групи.
              Обліковий запис, тема й мова залишаться. Дію неможливо скасувати.
            </p>
          </div>
          <div className="mqp-danger-actions">
            <button
              type="button"
              className="mqp-btn-danger"
              disabled={busy}
              onClick={onClear}
            >
              {isClearing ? (
                <Loader2 size={17} className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 size={17} aria-hidden="true" />
              )}
              {isClearing ? "Очищення…" : "Очистити всі дані"}
            </button>
            <span>Потрібне підтвердження</span>
          </div>
        </section>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="profile-studio-dialog backup-confirm-dialog">
          <DialogHeader>
            <DialogTitle>Відновити локальні дані?</DialogTitle>
            <DialogDescription>
              Файл «{file?.name}» перезапише відповідні записи цього браузера.
              Серверні дані не відновлюються. Рекомендуємо спочатку завантажити
              поточний бекап.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              className="profile-button"
              onClick={() => setConfirmOpen(false)}
            >
              Скасувати
            </button>
            <button
              type="button"
              className="profile-button profile-primary"
              disabled={busy || !file}
              onClick={() => {
                setConfirmOpen(false);
                if (file) onImport(file);
              }}
            >
              Підтвердити відновлення
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
