import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  AlertTriangle,
  BarChart3,
  Target,
  Copy,
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  Check,
  RefreshCw,
  FolderOpen,
  MessageCircle,
  Pencil,
  Layers,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserDataService } from "@/lib/userDataService";
import { useData } from "@/contexts/DataContext";
import { proxyLogoUrl } from "@/lib/logoProxy";
import {
  journalKey,
  journalMoney,
  journalAmount,
  journalStatus,
} from "@/components/mybets/journalModel";
import type { ThemePreference } from "@/hooks/useTheme";
import type { Bet } from "@/types/betting";
import type { Lang } from "@/lib/i18n";
import { toast } from "sonner";
import {
  profileDate,
  recentRecords,
  recordDate,
  recordSummary,
} from "./profileModel";

interface Props {
  username: string;
  telegram?: string;
  stats: {
    bets: number;
    riskyTeams: number;
    strategies: number;
    goals: number;
    tgGroups: number;
  };
  theme: ThemePreference;
  language: Lang;
  exchangeRate: number;
  isFetchingRate: boolean;
  onThemeChange: (theme: ThemePreference) => void;
  onLanguageChange: (lang: Lang) => void;
  onExchangeRateChange: (value: number) => void;
  onFetchRate: () => void;
  lastBackupDate: Date | null;
  needsBackupReminder: boolean;
  onOpenBackup: () => void;
}

type Identity = { displayName: string; bio: string };
const emptyIdentity: Identity = { displayName: "", bio: "" };
function readIdentity(value: unknown): Identity {
  const item =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  return {
    displayName:
      typeof item.displayName === "string" ? item.displayName.slice(0, 40) : "",
    bio: typeof item.bio === "string" ? item.bio.slice(0, 140) : "",
  };
}

function TeamMark({
  url,
  name,
  game,
}: {
  url?: string | null;
  name: string;
  game?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return url && !failed ? (
    <img
      src={proxyLogoUrl(url, game) || undefined}
      alt=""
      className="profile-team-logo"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="profile-team-fallback" aria-hidden="true">
      {name.slice(0, 2).toUpperCase() || "?"}
    </span>
  );
}

function ThemePreview({ mode }: { mode: ThemePreference }) {
  return (
    <span
      className={`profile-theme-preview preview-${mode}`}
      aria-hidden="true"
    >
      <span className="preview-side">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="preview-workspace">
        <span className="preview-heading" />
        <span className="preview-hero" />
        <span className="preview-tiles">
          <i />
          <i />
          <i />
        </span>
        <span className="preview-columns">
          <i />
          <i />
        </span>
      </span>
    </span>
  );
}

export default function ProfileOverview(p: Props) {
  const { bets, isLoading } = useData();
  const [identity, setIdentity] = useState<Identity>(() =>
    readIdentity(
      UserDataService.getUserData(
        p.username,
        "profile_identity",
        emptyIdentity,
      ),
    ),
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(identity);
  const [saving, setSaving] = useState(false);
  const identityRevision = useRef(0);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [rate, setRate] = useState(String(p.exchangeRate));
  const [rateError, setRateError] = useState("");
  const [selected, setSelected] = useState<Bet | null>(null);
  const activityTrigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setRate(String(p.exchangeRate));
  }, [p.exchangeRate]);
  useEffect(() => {
    let cancelled = false;
    const revision = identityRevision.current;
    setIdentity(
      readIdentity(
        UserDataService.getUserData(
          p.username,
          "profile_identity",
          emptyIdentity,
        ),
      ),
    );
    UserDataService.fetchUserPrefs()
      .then((data) => {
        const value = (data.preferences as Record<string, unknown>)
          .profileIdentity;
        if (!cancelled && revision === identityRevision.current && value) {
          const next = readIdentity(value);
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

  const tgAvatarName = (p.telegram || "").replace(/^@/, "").trim();
  const tgValid = /^[a-zA-Z0-9_]{5,32}$/.test(tgAvatarName);
  const initial = Array.from(p.username)[0]?.toUpperCase() || "M";
  const publicUrl = `${window.location.origin}/user/${encodeURIComponent(p.username)}`;
  const recent = recentRecords(bets);
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
    { label: "Цілі", value: p.stats.goals, Icon: Target, href: "/app/goals" },
    {
      label: "Telegram-групи",
      value: p.stats.tgGroups,
      Icon: MessageCircle,
      href: "/app/telegram",
    },
  ];

  async function saveIdentity(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    identityRevision.current += 1;
    const next = {
      displayName: draft.displayName.trim(),
      bio: draft.bio.trim(),
    };
    try {
      await UserDataService.saveUserPrefs({
        preferences: { profileIdentity: next },
      });
      setIdentity(next);
      UserDataService.setUserDataSync(p.username, "profile_identity", next);
      setEditing(false);
      toast.success("Профіль збережено");
    } catch {
      toast.error("Не вдалося зберегти профіль. Спробуйте ще раз.");
    } finally {
      setSaving(false);
    }
  }

  function commitRate() {
    const value = Number(rate.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setRateError("Введіть курс, більший за нуль.");
      return;
    }
    setRateError("");
    if (value !== p.exchangeRate) p.onExchangeRateChange(value);
  }

  return (
    <>
      <section className="profile-identity" aria-label="Ваш профіль">
        <div className="profile-avatar">
          <span className="profile-avatar-letter" aria-hidden="true">
            {initial}
          </span>
          {tgValid && (
            <img
              key={tgAvatarName}
              src={`https://t.me/i/userpic/320/${tgAvatarName}.jpg`}
              alt=""
              className="profile-avatar-img"
              onError={(e) => {
                e.currentTarget.hidden = true;
              }}
              onLoad={(e) => {
                if (e.currentTarget.naturalWidth <= 1)
                  e.currentTarget.hidden = true;
              }}
            />
          )}
        </div>
        <div className="profile-identity-copy">
          <h2>{identity.displayName || `@${p.username}`}</h2>
          <span className="profile-online">
            <i aria-hidden="true" />
            Активний{identity.displayName && <span> · @{p.username}</span>}
          </span>
          {identity.bio && <p>{identity.bio}</p>}
        </div>
        <Dialog
          open={editing}
          onOpenChange={(open) => {
            if (saving) return;
            if (open) {
              identityRevision.current += 1;
              setDraft(identity);
            }
            setEditing(open);
          }}
        >
          <DialogTrigger asChild>
            <button
              className="profile-button profile-edit-trigger"
              type="button"
            >
              <Pencil size={16} />
              Редагувати профіль
            </button>
          </DialogTrigger>
          <DialogContent
            className="profile-edit-dialog profile-studio-dialog"
            hideCloseButton
          >
            <DialogTitle>Редагувати профіль</DialogTitle>
            <DialogDescription>
              Ім’я та опис у вашому особистому просторі. Логін і публічне
              посилання не змінюються.
            </DialogDescription>
            <button
              className="profile-dialog-close"
              type="button"
              aria-label="Закрити"
              disabled={saving}
              onClick={() => setEditing(false)}
            >
              <X size={20} />
            </button>
            <form onSubmit={saveIdentity}>
              <label htmlFor="profile-display-name">Ім’я</label>
              <input
                id="profile-display-name"
                value={draft.displayName}
                maxLength={40}
                placeholder={`@${p.username}`}
                disabled={saving}
                onChange={(e) =>
                  setDraft({ ...draft, displayName: e.target.value })
                }
              />
              <label htmlFor="profile-bio">Коротко про себе</label>
              <textarea
                id="profile-bio"
                rows={3}
                value={draft.bio}
                maxLength={140}
                disabled={saving}
                onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
              />
              <small>{draft.bio.length}/140</small>
              <footer>
                <button
                  className="profile-button"
                  type="button"
                  disabled={saving}
                  onClick={() => setEditing(false)}
                >
                  Скасувати
                </button>
                <button
                  className="profile-button profile-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Зберігаємо…" : "Зберегти"}
                </button>
              </footer>
            </form>
          </DialogContent>
        </Dialog>
      </section>

      <nav className="profile-metrics" aria-label="Огляд вашого журналу">
        {metrics.map(({ label, value, Icon, href }) => (
          <Link className="profile-metric" to={href} key={href}>
            <Icon size={25} strokeWidth={1.7} aria-hidden="true" />
            <span className="profile-metric-copy">
              <strong>{value.toLocaleString("uk-UA")}</strong>{" "}
              <small>{label}</small>
              {href === "/app/strategy" && value === 0 && (
                <span className="profile-metric-hint">
                  Створити першу <ArrowUpRight size={13} />
                </span>
              )}
            </span>
            <ChevronRight
              className="profile-metric-arrow"
              size={16}
              aria-hidden="true"
            />
          </Link>
        ))}
      </nav>

      <div className="profile-grid">
        <div className="profile-left">
          <section
            className="profile-panel profile-activity"
            aria-labelledby="profile-activity-title"
          >
            <div className="profile-section-title">
              <h2 id="profile-activity-title">Остання активність</h2>
              <Link to="/app/my-bets" className="profile-text-link">
                Усі записи <ArrowRight size={16} />
              </Link>
            </div>
            {isLoading ? (
              <div
                className="profile-activity-loading"
                role="status"
                aria-label="Завантажуємо записи"
              >
                <span />
                <span />
                <span />
              </div>
            ) : recent.length ? (
              <ul className="profile-records">
                {recent.map((bet) => {
                  const summary = recordSummary(bet);
                  const date = recordDate(bet);
                  return (
                    <li key={journalKey(bet)}>
                      <button
                        className="profile-record"
                        type="button"
                        onClick={(e) => {
                          activityTrigger.current = e.currentTarget;
                          setSelected(bet);
                        }}
                        aria-label={`Деталі: ${summary.title}`}
                      >
                        <span className="profile-game-badge">
                          {summary.game}
                        </span>
                        <span className="profile-team-pair" aria-hidden="true">
                          {summary.express ? (
                            <Layers size={30} />
                          ) : (
                            <>
                              <TeamMark
                                url={bet.logoTeam1}
                                name={summary.team1}
                                game={bet.game}
                              />
                              {summary.team2 && (
                                <>
                                  <span className="profile-versus">vs</span>
                                  <TeamMark
                                    url={bet.logoTeam2}
                                    name={summary.team2}
                                    game={bet.game}
                                  />
                                </>
                              )}
                            </>
                          )}
                        </span>
                        <span className="profile-record-copy">
                          <strong>{summary.title}</strong>
                          <small>{summary.description}</small>
                        </span>
                        <time dateTime={date}>
                          {date ? profileDate(new Date(date)) : "Без дати"}
                        </time>
                        <ChevronRight
                          size={16}
                          className="profile-record-arrow"
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="profile-activity-empty">
                <strong>Ваш журнал починається тут</strong>
                <p>Нові записи з’являться в цьому блоці.</p>
                <Link className="profile-text-link" to="/app/my-bets">
                  Перейти до журналу <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </section>

          <section
            className="profile-panel profile-settings"
            aria-labelledby="profile-settings-title"
          >
            <div className="profile-section-title">
              <h2 id="profile-settings-title">Налаштування</h2>
            </div>
            <fieldset className="profile-theme-picker">
              <legend>Тема інтерфейсу</legend>
              <div className="profile-theme-options">
                {(
                  [
                    ["light", "Світла"],
                    ["dark", "Темна"],
                    ["system", "Системна"],
                  ] as const
                ).map(([mode, label]) => (
                  <label className="profile-theme-option" key={mode}>
                    <input
                      type="radio"
                      name="profile-theme"
                      value={mode}
                      checked={p.theme === mode}
                      onChange={() => p.onThemeChange(mode)}
                    />
                    <span className="profile-theme-frame">
                      <ThemePreview mode={mode} />
                      <span className="profile-theme-check">
                        <Check size={14} />
                      </span>
                    </span>
                    <span className="profile-theme-label">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="profile-settings-fields">
              <div className="profile-setting">
                <label htmlFor="profile-language">Мова</label>
                <select
                  id="profile-language"
                  value={p.language}
                  onChange={(e) => p.onLanguageChange(e.target.value as Lang)}
                >
                  <option value="uk">Українська</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="profile-setting">
                <label htmlFor="profile-rate">Курс USD → UAH</label>
                <div className="profile-rate-controls">
                  <input
                    id="profile-rate"
                    type="text"
                    inputMode="decimal"
                    value={rate}
                    aria-invalid={!!rateError}
                    aria-describedby={
                      rateError ? "profile-rate-error" : "profile-rate-help"
                    }
                    onChange={(e) => {
                      setRate(e.target.value);
                      setRateError("");
                    }}
                    onBlur={commitRate}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                    }}
                  />
                  <button
                    className="profile-icon-button"
                    type="button"
                    disabled={p.isFetchingRate}
                    aria-label="Оновити курс"
                    onClick={p.onFetchRate}
                  >
                    <RefreshCw
                      size={17}
                      className={p.isFetchingRate ? "animate-spin" : ""}
                    />
                  </button>
                </div>
                <small id="profile-rate-help">Для конвертації сум</small>
                {rateError && (
                  <small
                    className="profile-error"
                    id="profile-rate-error"
                    role="alert"
                  >
                    {rateError}
                  </small>
                )}
              </div>
            </div>
          </section>
        </div>
        <aside className="profile-rail">
          <section
            className="profile-panel profile-public"
            aria-labelledby="profile-public-title"
          >
            <div className="profile-section-title">
              <h2 id="profile-public-title">Публічний профіль</h2>
            </div>
            <div className="profile-player-card">
              <div className="profile-player-art" aria-hidden="true" />
              <div className="profile-player-top">
                <span className="profile-player-brand">
                  Match<span>IQ</span>
                </span>
                <span className="profile-player-status">
                  <i />
                  Онлайн
                </span>
              </div>
              <span className="profile-player-initial" aria-hidden="true">
                {initial}
              </span>
              <div className="profile-player-bottom">
                <strong>@{p.username}</strong>
                <p>Публічний профіль</p>
                <div className="profile-player-actions">
                  <a
                    className="profile-button profile-primary"
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Переглянути <ArrowUpRight size={18} />
                    <span className="sr-only"> (нова вкладка)</span>
                  </a>
                  <button
                    className="profile-player-copy"
                    type="button"
                    title={
                      copied ? "Посилання скопійовано" : "Копіювати посилання"
                    }
                    aria-label={
                      copied ? "Посилання скопійовано" : "Копіювати посилання"
                    }
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(publicUrl);
                        setCopied(true);
                        setCopyFailed(false);
                        toast.success("Посилання скопійовано");
                      } catch {
                        setCopyFailed(true);
                        toast.error("Скопіюйте посилання з поля під карткою");
                      }
                    }}
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                  <span className="sr-only" role="status">
                    {copied ? "Посилання скопійовано" : ""}
                  </span>
                </div>
              </div>
            </div>
            {copyFailed && (
              <label className="profile-copy-fallback">
                Посилання на профіль
                <input
                  readOnly
                  value={publicUrl}
                  onFocus={(e) => e.currentTarget.select()}
                />
              </label>
            )}
          </section>
          <section
            className="profile-panel profile-backup-card"
            aria-labelledby="profile-backup-title"
          >
            <h2 id="profile-backup-title">Резервна копія</h2>
            <p>Збережіть копію журналу та налаштувань.</p>
            <p className="profile-backup-date">
              {p.lastBackupDate
                ? `Остання копія: ${profileDate(p.lastBackupDate)}`
                : "Ви ще не створювали резервну копію."}
            </p>
            {p.needsBackupReminder && (
              <small className="profile-backup-reminder">
                Рекомендуємо створити актуальну копію.
              </small>
            )}
            <button
              className="profile-button"
              type="button"
              onClick={p.onOpenBackup}
            >
              <FolderOpen size={18} />
              Відкрити бекап <ArrowRight size={16} />
            </button>
          </section>
        </aside>
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent
          className="profile-studio-dialog profile-record-dialog"
          hideCloseButton
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            activityTrigger.current?.focus();
          }}
        >
          <DialogTitle>
            {selected ? recordSummary(selected).title : "Деталі запису"}
          </DialogTitle>
          <DialogDescription>
            {selected ? recordSummary(selected).description : ""}
          </DialogDescription>
          <button
            className="profile-dialog-close"
            type="button"
            aria-label="Закрити деталі"
            onClick={() => setSelected(null)}
          >
            <X size={20} />
          </button>
          {selected && (
            <>
              <dl className="profile-record-detail-grid">
                <div>
                  <dt>Сума</dt>
                  <dd>
                    {journalMoney(journalAmount(selected), selected.currency)}
                  </dd>
                </div>
                <div>
                  <dt>Коефіцієнт</dt>
                  <dd>{selected.odds.toLocaleString("uk-UA")}</dd>
                </div>
                <div>
                  <dt>Статус</dt>
                  <dd>{journalStatus(selected)}</dd>
                </div>
              </dl>
              {selected.notes && (
                <p className="profile-record-notes">{selected.notes}</p>
              )}
              <Link className="profile-button" to="/app/my-bets">
                Відкрити журнал <ArrowRight size={16} />
              </Link>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
