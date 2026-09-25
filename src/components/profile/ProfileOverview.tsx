import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Pencil,
  FileText,
  AlertTriangle,
  BarChart3,
  Target,
  Sun,
  Globe,
  DollarSign,
  Database,
  Copy,
  ExternalLink,
  Clock,
  Check,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UserDataService } from "@/lib/userDataService";
import { useData } from "@/contexts/DataContext";
import type { Lang } from "@/lib/i18n";
import { toast } from "sonner";

interface Props {
  username: string;
  stats: {
    bets: number;
    riskyTeams: number;
    strategies: number;
    goals: number;
    tgGroups: number;
  };
  theme: "light" | "dark";
  language: Lang;
  exchangeRate: number;
  isFetchingRate: boolean;
  onThemeChange: (theme: "light" | "dark") => void;
  onLanguageChange: (lang: Lang) => void;
  onExchangeRateChange: (value: number) => void;
  onFetchRate: () => void;
  lastBackupDate: Date | null;
  needsBackupReminder: boolean;
  onOpenBackup: () => void;
}
type Identity = { displayName: string; bio: string };
const dateText = (date: Date) =>
  date.toLocaleString("uk-UA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ProfileOverview(p: Props) {
  const { bets, isLoading } = useData();
  const [identity, setIdentity] = useState<Identity>(() =>
    UserDataService.getUserData(p.username, "profile_identity", {
      displayName: "",
      bio: "",
    }),
  );
  const [draft, setDraft] = useState(identity);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rate, setRate] = useState(String(p.exchangeRate));
  const [rateError, setRateError] = useState("");
  useEffect(() => {
    setRate(String(p.exchangeRate));
  }, [p.exchangeRate]);
  useEffect(() => {
    let cancelled = false;
    UserDataService.fetchUserPrefs()
      .then((data) => {
        const value = (data.preferences as Record<string, unknown>)
          .profileIdentity;
        if (!cancelled && value && typeof value === "object") {
          const item = value as Record<string, unknown>;
          const next = {
            displayName:
              typeof item.displayName === "string" ? item.displayName : "",
            bio: typeof item.bio === "string" ? item.bio : "",
          };
          setIdentity(next);
          UserDataService.setUserDataSync(p.username, "profile_identity", next);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [p.username]);
  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timeout);
  }, [copied]);
  const saveIdentity = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const next = {
      displayName: draft.displayName.trim(),
      bio: draft.bio.trim(),
    };
    try {
      await UserDataService.saveUserPrefs({
        preferences: { profileIdentity: next },
      });
      UserDataService.setUserDataSync(p.username, "profile_identity", next);
      setIdentity(next);
      setEditing(false);
      toast.success("Профіль збережено");
    } catch {
      toast.error("Не вдалося зберегти профіль. Спробуйте ще раз.");
    } finally {
      setSaving(false);
    }
  };
  const publicUrl = `${window.location.origin}/user/${encodeURIComponent(p.username)}`;
  const recent = bets
    .filter((b) => b.createdAt && Number.isFinite(Date.parse(b.createdAt)))
    .sort((a, b) => Date.parse(b.createdAt!) - Date.parse(a.createdAt!))
    .slice(0, 3);
  const total = isLoading ? p.stats.bets : bets.length;
  const metrics = [
    {
      label: "Ваші ставки",
      value: total,
      Icon: FileText,
      href: "/app/my-bets",
    },
    {
      label: "Ризикові команди",
      value: p.stats.riskyTeams,
      Icon: AlertTriangle,
      href: "/app/risky-teams",
    },
    {
      label: "Стратегії",
      value: p.stats.strategies,
      Icon: BarChart3,
      href: "/app/strategy",
    },
    {
      label: "Цілі",
      value: p.stats.goals,
      Icon: Target,
      href: "/app/strategy",
    },
  ];
  return (
    <>
      <section
        className="profile-panel profile-identity"
        aria-label="Ваш профіль"
      >
        <div className="profile-avatar">
          <User size={36} strokeWidth={1.5} />
          <i />
        </div>
        <div className="profile-identity-copy">
          <h2>{identity.displayName || `@${p.username}`}</h2>
          <span className="profile-online">
            Активний{identity.displayName ? ` · @${p.username}` : ""}
          </span>
          <p>{identity.bio || `Записів у вашому журналі: ${total}`}</p>
        </div>
        <button
          className="profile-button"
          onClick={() => {
            setDraft(identity);
            setEditing(true);
          }}
        >
          <Pencil size={17} />
          Редагувати профіль
        </button>
      </section>
      <section className="profile-panel profile-overview">
        <div className="profile-section-title">
          <h2>Огляд</h2>
          <span>За весь час</span>
        </div>
        <div className="profile-metrics">
          {metrics.map(({ label, value, Icon, href }) => (
            <Link to={href} className="profile-metric" key={label}>
              <Icon size={27} strokeWidth={1.5} />
              <span>
                <strong>{value}</strong>
                <small>{label}</small>
              </span>
            </Link>
          ))}
        </div>
      </section>
      <div className="profile-grid">
        <section className="profile-panel profile-settings">
          <h2>Налаштування</h2>
          <h3>Інтерфейс</h3>
          <div className="profile-setting">
            <label htmlFor="profile-theme">
              <Sun size={21} />
              Тема
            </label>
            <select
              id="profile-theme"
              value={p.theme}
              onChange={(e) =>
                p.onThemeChange(e.target.value as "light" | "dark")
              }
            >
              <option value="light">Світла</option>
              <option value="dark">Темна</option>
            </select>
          </div>
          <div className="profile-setting">
            <label htmlFor="profile-language">
              <Globe size={21} />
              Мова
            </label>
            <select
              id="profile-language"
              value={p.language}
              onChange={(e) => p.onLanguageChange(e.target.value as Lang)}
            >
              <option value="uk">Українська</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="profile-setting profile-rate">
            <label htmlFor="profile-rate">
              <DollarSign size={21} />
              <span>
                Курс USD → UAH<small>Для конвертації сум</small>
              </span>
            </label>
            <div>
              <div className="profile-rate-controls">
                <input
                  id="profile-rate"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={rate}
                  aria-invalid={!!rateError}
                  aria-describedby={
                    rateError ? "profile-rate-error" : undefined
                  }
                  onChange={(e) => {
                    setRate(e.target.value);
                    setRateError("");
                  }}
                  onBlur={() => {
                    const value = Number(rate);
                    if (!Number.isFinite(value) || value <= 0) {
                      setRateError("Вкажіть курс більше нуля");
                      return;
                    }
                    if (value !== p.exchangeRate) p.onExchangeRateChange(value);
                  }}
                />
                <button
                  className="profile-icon-button"
                  onClick={p.onFetchRate}
                  disabled={p.isFetchingRate}
                  aria-label="Оновити курс валют"
                  title="Оновити курс"
                >
                  <RefreshCw
                    size={17}
                    className={p.isFetchingRate ? "animate-spin" : ""}
                  />
                </button>
              </div>
              {rateError && (
                <small id="profile-rate-error" className="profile-error">
                  {rateError}
                </small>
              )}
            </div>
          </div>
          <h3 className="profile-data-heading">Дані</h3>
          <div className="profile-backup-row">
            <Database size={25} strokeWidth={1.5} />
            <div>
              <strong>Резервна копія даних</strong>
              <p>
                {p.lastBackupDate
                  ? `Остання копія: ${dateText(p.lastBackupDate)}`
                  : "Резервну копію ще не створено"}
              </p>
              <small
                className={
                  p.needsBackupReminder
                    ? "profile-backup-needed"
                    : "profile-online"
                }
              >
                {p.needsBackupReminder
                  ? "Рекомендуємо створити копію"
                  : "Копію завантажено"}
              </small>
            </div>
            <button className="profile-button" onClick={p.onOpenBackup}>
              <FolderOpen size={17} />
              Відкрити бекап
            </button>
          </div>
        </section>
        <aside className="profile-rail">
          <section className="profile-panel">
            <h2>Публічний профіль</h2>
            <p className="profile-description">
              Поділіться посиланням на вашу статистику.
            </p>
            <div className="profile-share">
              <input
                aria-label="Посилання на публічний профіль"
                value={publicUrl}
                readOnly
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                className="profile-icon-button"
                aria-label={
                  copied ? "Посилання скопійовано" : "Копіювати посилання"
                }
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(publicUrl);
                    setCopied(true);
                    toast.success("Посилання скопійовано");
                  } catch {
                    toast.error(
                      "Не вдалося скопіювати. Виділіть посилання вручну.",
                    );
                  }
                }}
              >
                {copied ? <Check size={19} /> : <Copy size={19} />}
              </button>
            </div>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-text-link"
            >
              <ExternalLink size={17} />
              Переглянути<span className="sr-only"> в новій вкладці</span>
            </a>
          </section>
          <section className="profile-panel">
            <div className="profile-section-title">
              <h2>Остання активність</h2>
              <Clock size={17} />
            </div>
            <div className="profile-activity">
              {isLoading ? (
                <p className="profile-empty" role="status">
                  Завантаження записів…
                </p>
              ) : recent.length ? (
                recent.map((bet, index) => (
                  <Link
                    to="/app/my-bets"
                    className="profile-event"
                    key={bet.id || index}
                  >
                    <FileText size={20} />
                    <span>
                      <strong>Створено запис</strong>
                      <small>{bet.match}</small>
                    </span>
                    <time dateTime={bet.createdAt}>
                      {dateText(new Date(bet.createdAt!))}
                    </time>
                  </Link>
                ))
              ) : (
                <p className="profile-empty">
                  Тут з’являться нові записи вашого журналу.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
      <Dialog
        open={editing}
        onOpenChange={(value) => {
          if (!saving) setEditing(value);
        }}
      >
        <DialogContent className="profile-edit-dialog">
          <DialogHeader>
            <DialogTitle>Редагувати профіль</DialogTitle>
            <DialogDescription>
              Налаштуйте ім’я та опис у вашому робочому просторі. Логін
              залишається @{p.username}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveIdentity}>
            <label htmlFor="profile-display-name">Відображуване ім’я</label>
            <input
              id="profile-display-name"
              maxLength={60}
              value={draft.displayName}
              onChange={(e) =>
                setDraft({ ...draft, displayName: e.target.value })
              }
              placeholder={p.username}
            />
            <label htmlFor="profile-bio">Про себе</label>
            <textarea
              id="profile-bio"
              maxLength={160}
              rows={3}
              value={draft.bio}
              onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
            />
            <small>{draft.bio.length}/160</small>
            <footer>
              <button
                type="button"
                className="profile-button"
                disabled={saving}
                onClick={() => setEditing(false)}
              >
                Скасувати
              </button>
              <button
                type="submit"
                className="profile-button profile-primary"
                disabled={saving}
              >
                {saving ? "Збереження…" : "Зберегти"}
              </button>
            </footer>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
