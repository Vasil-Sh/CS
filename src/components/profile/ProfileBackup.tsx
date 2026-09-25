import { useRef, useState } from "react";
import {
  Database,
  Download,
  Upload,
  ShieldCheck,
  Clock3,
  FileJson,
  AlertTriangle,
  Trash2,
  X,
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

interface Props {
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
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const busy = isExporting || isImporting || isClearing;

  const selectFile = (candidate?: File) => {
    if (!candidate || busy) return;
    if (!candidate.name.toLowerCase().endsWith(".json")) {
      toast.error("Оберіть файл бекапу у форматі JSON");
      return;
    }
    setFile(candidate);
  };

  return (
    <div className="backup-page">
      <div className="backup-notice">
        <ShieldCheck size={19} />
        <p>
          <strong>Резервна копія — під вашим контролем</strong>
          <span>
            Збережіть локальні дані перед змінами або перенесенням на інший
            пристрій.
          </span>
        </p>
      </div>
      <div className="backup-overview">
        <section
          className="profile-panel backup-summary"
          aria-labelledby="backup-overview-title"
        >
          <h2 id="backup-overview-title">Огляд даних</h2>
          <div className="backup-size">
            <Database size={20} />
            <strong>
              {storageSize}
              <small>KB</small>
            </strong>
            <span>Розмір локальної копії</span>
          </div>
          <dl>
            <div>
              <dt>
                <Clock3 size={15} />
                Останній експорт
              </dt>
              <dd>
                {lastBackupDate && !Number.isNaN(lastBackupDate.getTime())
                  ? lastBackupDate.toLocaleString("uk-UA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Ще не створювали"}
              </dd>
            </div>
            <div>
              <dt>
                <FileJson size={15} />
                Формат файлу
              </dt>
              <dd>JSON</dd>
            </div>
          </dl>
        </section>
        <section
          className="profile-panel backup-contents"
          aria-labelledby="backup-contents-title"
        >
          <h2 id="backup-contents-title">Що входить у копію</h2>
          <ul>
            <li>Ставки та ризиковані команди</li>
            <li>Стратегії та цілі</li>
            <li>Telegram-групи й налаштування</li>
          </ul>
          <p>
            Експортуються записи, доступні в localStorage цього браузера. Це не
            резервна копія серверної бази.
          </p>
        </section>
      </div>
      <section
        className="profile-panel backup-action"
        aria-labelledby="backup-export-title"
      >
        <div>
          <h2 id="backup-export-title">Завантажити бекап</h2>
          <p>
            Усі доступні локальні дані — в одному JSON-файлі.
            <br />
            Рекомендуємо зберігати копію щонайменше раз на тиждень.
          </p>
        </div>
        <button
          type="button"
          className="profile-button profile-primary"
          onClick={onExport}
          disabled={busy}
        >
          <Download size={17} />
          {isExporting ? "Створення…" : "Завантажити повний бекап"}
        </button>
      </section>
      <section
        className="profile-panel backup-restore"
        aria-labelledby="backup-restore-title"
      >
        <h2 id="backup-restore-title">Відновити з бекапу</h2>
        <p>
          Оберіть раніше збережений файл MatchIQ для відновлення локальних
          записів.
        </p>
        <div className="backup-warning">
          <AlertTriangle size={17} />
          <span>
            Записи з файлу перезапишуть відповідні локальні дані. Спочатку
            збережіть поточну копію.
          </span>
        </div>
        <div
          role="group"
          aria-label="Вибір файлу для відновлення"
          className={`backup-dropzone${dragging ? " is-dragging" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            if (!busy) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            selectFile(event.dataTransfer.files[0]);
          }}
        >
          <Upload size={23} />
          <div className="backup-file-copy" aria-live="polite">
            <strong>{file ? file.name : "Перетягніть JSON-файл сюди"}</strong>
            <span>
              {file
                ? `${(file.size / 1024).toFixed(1)} KB · Готовий до відновлення`
                : "або оберіть його на пристрої"}
            </span>
          </div>
          {file && (
            <button
              type="button"
              className="profile-button"
              aria-label="Прибрати обраний файл"
              disabled={busy}
              onClick={() => setFile(null)}
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            className="profile-button"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            {file ? "Змінити файл" : "Обрати файл бекапу"}
          </button>
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
        {file && (
          <div className="backup-restore-footer">
            <button
              type="button"
              className="profile-button profile-primary"
              disabled={busy}
              onClick={() => setConfirmOpen(true)}
            >
              {isImporting ? "Відновлення…" : "Відновити дані"}
            </button>
          </div>
        )}
      </section>
      <section
        className="profile-panel backup-danger backup-action"
        aria-labelledby="backup-clear-title"
      >
        <div>
          <h2 id="backup-clear-title">Очистити всі дані</h2>
          <p>
            Видалити ваші ставки, команди, стратегії, цілі та Telegram-групи.
            <br />
            Обліковий запис залишиться. Цю дію неможливо скасувати.
          </p>
          <span className="backup-danger-note">
            Перед очищенням переконайтеся, що потрібні дані збережені.
          </span>
        </div>
        <button
          type="button"
          className="profile-button backup-danger-button"
          disabled={busy}
          onClick={onClear}
        >
          <Trash2 size={17} />
          {isClearing ? "Очищення…" : "Очистити всі дані"}
        </button>
      </section>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
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
    </div>
  );
}
