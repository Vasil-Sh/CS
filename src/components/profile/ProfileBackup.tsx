import { useRef, useState, type ReactNode } from "react";
import {
  Download,
  Upload,
  AlertTriangle,
  Trash2,
  X,
  Loader2,
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
      <div className="profile-masthead backup-masthead">
        {header}
        <section className="backup-hero" aria-labelledby="backup-page-title">
          <h2 id="backup-page-title">Бекап даних</h2>
          <p>Збережіть копію або перенесіть дані на інший пристрій.</p>
        </section>
      </div>
      <div className="backup-page backup-studio" aria-busy={busy}>
        <section
          className="backup-data-overview"
          aria-label="Огляд локальних даних"
        >
          <dl className="backup-data-summary">
            <div>
              <dt>Локальні дані</dt>
              <dd>
                {localizedSize} <span>КБ</span>
              </dd>
            </div>
            <div>
              <dt>Останній експорт</dt>
              <dd className={!lastExport ? "backup-no-export" : undefined}>
                {lastExport ? (
                  <time dateTime={lastBackupDate!.toISOString()}>
                    {lastExport}
                  </time>
                ) : (
                  "Ще не створювали"
                )}
              </dd>
            </div>
            <div>
              <dt>Формат копії</dt>
              <dd>JSON</dd>
            </div>
          </dl>
          <p className="backup-scope-note">
            Експортуються дані localStorage цього браузера. Це не копія
            серверної бази.
          </p>
        </section>

        <div className="backup-top-grid">
          <section
            className="profile-panel backup-export"
            aria-labelledby="backup-export-title"
          >
            <h2 id="backup-export-title">Завантажити бекап</h2>
            <p>
              Усі локальні дані — в одному JSON-файлі.
              <br />
              Збережіть копію перед змінами або перенесенням.
            </p>
            <button
              type="button"
              className="profile-button profile-primary backup-download"
              onClick={onExport}
              disabled={busy}
            >
              {isExporting ? (
                <Loader2
                  size={24}
                  className="backup-spinner"
                  aria-hidden="true"
                />
              ) : (
                <Download size={24} aria-hidden="true" />
              )}
              {isExporting ? "Створення копії…" : "Завантажити повний бекап"}
            </button>
            <p className="backup-helper">
              Файл буде збережено на вашому пристрої.
            </p>
          </section>
          <section
            className="profile-panel backup-contents"
            aria-labelledby="backup-contents-title"
          >
            <h2 id="backup-contents-title">Що входить у копію</h2>
            <ul>
              <li>Ставки</li>
              <li>Ризикові команди</li>
              <li>Стратегії</li>
              <li>Цілі</li>
              <li>Telegram-групи</li>
              <li>Налаштування</li>
            </ul>
            <p className="backup-helper">
              Лише дані, доступні в цьому браузері.
            </p>
          </section>
        </div>

        <section
          className="profile-panel backup-restore"
          aria-labelledby="backup-restore-title"
        >
          <h2 id="backup-restore-title">Відновити з бекапу</h2>
          <p>Оберіть раніше збережений JSON-файл MatchIQ.</p>
          <div className="backup-warning">
            <AlertTriangle size={21} aria-hidden="true" />
            <span>
              Відновлення замінить відповідні локальні дані. Спочатку збережіть
              поточну копію.
            </span>
          </div>
          <div
            role="group"
            aria-label="Вибір файлу для відновлення"
            aria-describedby="backup-restore-hint"
            className={`backup-dropzone${dragging ? " is-dragging" : ""}${file ? " has-file" : ""}`}
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
            <Upload size={30} aria-hidden="true" />
            <div className="backup-file-copy" aria-live="polite">
              <strong>{file ? file.name : "Перетягніть JSON-файл сюди"}</strong>
              <span>
                {file
                  ? `${(file.size / 1024).toLocaleString("uk-UA", { maximumFractionDigits: 1 })} КБ · Файл обрано`
                  : "або оберіть його на пристрої"}
              </span>
            </div>
            <div className="backup-file-actions">
              {file && (
                <button
                  type="button"
                  className="profile-button backup-remove-file"
                  aria-label="Прибрати обраний файл"
                  disabled={busy}
                  onClick={() => setFile(null)}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                className="profile-button"
                disabled={busy}
                onClick={() => input.current?.click()}
              >
                <Upload size={20} aria-hidden="true" />
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
          <p className="backup-helper" id="backup-restore-hint">
            Дані зміняться лише після перевірки файлу та вашого підтвердження.
          </p>
          {file && (
            <div className="backup-restore-footer">
              <button
                type="button"
                className="profile-button profile-primary"
                disabled={busy}
                onClick={() => setConfirmOpen(true)}
              >
                {isImporting && (
                  <Loader2
                    size={18}
                    className="backup-spinner"
                    aria-hidden="true"
                  />
                )}
                {isImporting ? "Відновлення…" : "Відновити дані"}
              </button>
            </div>
          )}
        </section>

        <section
          className="profile-panel backup-danger"
          aria-labelledby="backup-clear-title"
        >
          <div>
            <h2 id="backup-clear-title">Очистити дані</h2>
            <p>
              Буде видалено ставки, команди, стратегії, цілі та Telegram-групи.
              <br />
              Обліковий запис, тема та мова залишаться. Дію неможливо скасувати.
            </p>
          </div>
          <div className="backup-danger-actions">
            <button
              type="button"
              className="profile-button backup-danger-button"
              disabled={busy}
              onClick={onClear}
            >
              {isClearing ? (
                <Loader2
                  size={20}
                  className="backup-spinner"
                  aria-hidden="true"
                />
              ) : (
                <Trash2 size={20} aria-hidden="true" />
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
