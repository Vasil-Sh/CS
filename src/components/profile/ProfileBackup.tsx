import { pt, profileLocale } from "@/lib/profileTranslations";
import { t } from "@/lib/i18n";
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
      ? lastBackupDate.toLocaleString(profileLocale(), {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;
  const localizedSize = Number.isFinite(Number(storageSize))
    ? Number(storageSize).toLocaleString(profileLocale(), {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
    : storageSize;

  const selectFile = (candidate?: File) => {
    if (!candidate || busy) return;
    if (!candidate.name.toLowerCase().endsWith(".json")) {
      toast.error(t("profile.ui.chooseJson"));
      return;
    }
    if (!candidate.size) {
      toast.error(t("profile.ui.emptyFile"));
      return;
    }
    setFile(candidate);
  };

  return (
    <>
      <section
        className="mqp-hero is-compact is-photo is-backup"
        aria-label={t("profile.ui.dataBackup")}
      >
        {header}
      </section>
      <div className="mqp-backup" aria-busy={busy}>
        <section
          className="mqp-card"
          aria-label={t("profile.ui.localOverview")}
        >
          <dl className="mqp-stats">
            <div>
              <dt>{t("profile.ui.localData")}</dt>
              <dd>
                {localizedSize} {t("profile.ui.kb")}
              </dd>
            </div>
            <div>
              <dt>{t("profile.ui.lastExport")}</dt>
              <dd>
                {lastExport ? (
                  <time dateTime={lastBackupDate!.toISOString()}>
                    {lastExport}
                  </time>
                ) : (
                  t("profile.ui.never")
                )}
              </dd>
            </div>
            <div>
              <dt>{t("profile.ui.format")}</dt>
              <dd>JSON</dd>
            </div>
          </dl>
        </section>
        <p className="mqp-scope"> {t("profile.ui.localScope")} </p>

        <div className="mqp-row">
          <section className="mqp-card" aria-labelledby="backup-export-title">
            <div className="mqp-card-head">
              <h2 id="backup-export-title">{t("profile.ui.downloadBackup")}</h2>
            </div>
            <p className="mqp-text"> {t("profile.ui.exportDescription")} </p>
            <button
              type="button"
              className="mqp-pill"
              onClick={onExport}
              disabled={busy}
            >
              {isExporting
                ? t("profile.ui.exporting")
                : t("profile.ui.downloadFull")}
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
              <h2 id="backup-contents-title">{t("profile.ui.contents")}</h2>
            </div>
            <ul className="mqp-checklist">
              {[
                t("profile.ui.bets"),
                t("profile.ui.goals"),
                t("profile.ui.riskyTeams"),
                t("profile.ui.telegramGroups"),
                t("profile.ui.strategies"),
                t("profile.ui.settings"),
              ].map((item) => (
                <li key={item}>
                  <span aria-hidden="true">
                    <Check size={13} strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mqp-note">{t("profile.ui.availableLocal")}</p>
          </section>
        </div>

        <section className="mqp-card" aria-labelledby="backup-restore-title">
          <div className="mqp-card-head">
            <h2 id="backup-restore-title">{t("profile.ui.restoreBackup")}</h2>
          </div>
          <p className="mqp-text">{t("profile.ui.chooseSaved")}</p>
          <div className="mqp-warning">
            <AlertTriangle size={18} aria-hidden="true" />
            <span> {t("profile.ui.restoreWarning")} </span>
          </div>
          <div
            role="group"
            aria-label={t("profile.ui.chooseRestore")}
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
              <strong>{file ? file.name : t("profile.ui.dropJson")}</strong>
              <span>
                {file
                  ? pt("selectedFile", {
                      size: (file.size / 1024).toLocaleString(profileLocale(), {
                        maximumFractionDigits: 1,
                      }),
                    })
                  : t("profile.ui.chooseDevice")}
              </span>
            </div>
            <div className="mqp-dropzone-actions">
              {file && (
                <button
                  type="button"
                  className="mqp-round"
                  aria-label={t("profile.ui.removeFile")}
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
                {file ? t("profile.ui.changeFile") : t("profile.ui.chooseFile")}
              </button>
            </div>
            <input
              ref={input}
              type="file"
              accept=".json,application/json"
              aria-label={t("profile.ui.jsonFile")}
              hidden
              disabled={busy}
              onChange={(event) => {
                selectFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>
          <p className="mqp-note" id="backup-restore-hint">
            {" "}
            {t("profile.ui.restoreHint")}{" "}
          </p>
          {file && (
            <div>
              <button
                type="button"
                className="mqp-pill"
                disabled={busy}
                onClick={() => setConfirmOpen(true)}
              >
                {isImporting
                  ? t("profile.ui.restoring")
                  : t("profile.ui.restoreData")}
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
            <h2 id="backup-clear-title">{t("profile.ui.clearData")}</h2>
            <p className="mqp-text"> {t("profile.ui.clearDescription")} </p>
          </div>
          <div className="mqp-danger-actions">
            <button
              type="button"
              className="mqp-btn-danger"
              disabled={busy}
              onClick={onClear}
            >
              {isClearing ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Trash2 size={17} aria-hidden="true" />
              )}
              {isClearing ? t("profile.ui.clearing") : t("profile.ui.clearAll")}
            </button>
            <span>{t("profile.ui.confirmationRequired")}</span>
          </div>
        </section>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="profile-studio-dialog backup-confirm-dialog">
          <DialogHeader>
            <DialogTitle>{t("profile.ui.restoreTitle")}</DialogTitle>
            <DialogDescription>
              {pt("restoreFileDescription", { name: file?.name || "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              className="profile-button"
              onClick={() => setConfirmOpen(false)}
            >
              {" "}
              {t("profile.ui.cancel")}{" "}
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
              {" "}
              {t("profile.ui.confirmRestore")}{" "}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
