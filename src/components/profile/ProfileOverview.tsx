import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  ShieldAlert,
  Target,
  Flag,
  Send,
  Download,
  Copy,
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  Check,
  RefreshCw,
  Layers,
} from "lucide-react";
import { UserDataService } from "@/lib/userDataService";
import { useData } from "@/contexts/DataContext";
import { proxyLogoUrl } from "@/lib/logoProxy";
import { journalKey } from "@/components/mybets/journalModel";
import type { ThemePreference } from "@/hooks/useTheme";
import type { Lang } from "@/lib/i18n";
import "./ProfileRedesign.css";
import { toast } from "sonner";
import {
  profileDate,
  recentRecords,
  recordDate,
  recordSummary,
} from "./profileModel";

interface Props {
  header?: ReactNode;
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
      className="mqp-team-logo"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="mqp-team" aria-hidden="true">
      {name.slice(0, 2).toUpperCase() || "?"}
    </span>
  );
}

function ThemeCanvas({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`preview-canvas${dark ? " preview-dark" : ""}`}>
      <span className="preview-side">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="preview-workspace">
        <span className="preview-hero">
          <i />
          <span>
            <b />
            <b />
          </span>
        </span>
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

function ThemePreview({ mode }: { mode: ThemePreference }) {
  return (
    <span
      className={`profile-theme-preview preview-${mode}`}
      aria-hidden="true"
    >
      <ThemeCanvas dark={mode === "dark"} />
      {mode === "system" && (
        <span className="preview-system-dark">
          <ThemeCanvas dark />
        </span>
      )}
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
  const identityRevision = useRef(0);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [rate, setRate] = useState(String(p.exchangeRate));
  const [rateError, setRateError] = useState("");

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

  const tgAvatarName = (() => {
    const raw = (p.telegram || "").trim();
    if (/^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\//i.test(raw)) {
      try {
        const url = new URL(/^https?:/i.test(raw) ? raw : `https://${raw}`);
        return url.pathname.replace(/^\//, "").replace(/\/$/, "");
      } catch {
        return "";
      }
    }
    return raw.replace(/^@/, "");
  })();
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
      cta: "Додати",
    },
    {
      label: "Ризикові команди",
      value: p.stats.riskyTeams,
      Icon: ShieldAlert,
      href: "/app/risky-teams",
      cta: "Додати",
    },
    {
      label: "Стратегії",
      value: p.stats.strategies,
      Icon: Target,
      href: "/app/strategy",
      cta: "Створити",
    },
    {
      label: "Цілі",
      value: p.stats.goals,
      Icon: Flag,
      href: "/app/goals",
      cta: "Поставити",
    },
    {
      label: "Telegram-групи",
      value: p.stats.tgGroups,
      Icon: Send,
      href: "/app/telegram",
      cta: "Підключити",
    },
  ];

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
      <section className="mqp-hero is-photo" aria-label="Ваш профіль">
        {p.header}
        <div className="mqp-identity">
          <div className="mqp-avatar">
            <span aria-hidden="true">{initial}</span>
            {tgValid && (
              <img
                key={tgAvatarName}
                src={`https://t.me/i/userpic/320/${tgAvatarName}.jpg`}
                alt=""
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
          <div className="mqp-identity-copy">
            <h2>{identity.displayName || `@${p.username}`}</h2>
            <span className="mqp-online">
              <i aria-hidden="true" />
              Активний{identity.displayName && <span> · @{p.username}</span>}
            </span>
            {identity.bio && <p>{identity.bio}</p>}
          </div>
        </div>
      </section>

      <nav className="mqp-metrics" aria-label="Огляд вашого журналу">
        {metrics.map(({ label, value, Icon, href, cta }) => (
          <Link
            className={`mqp-metric${value ? "" : " is-empty"}`}
            to={href}
            key={href}
          >
            <span className="mqp-metric-top">
              <span className="mqp-icon">
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              </span>
              {value ? (
                <ArrowUpRight
                  className="mqp-metric-arrow"
                  size={16}
                  aria-hidden="true"
                />
              ) : (
                <span className="mqp-metric-cta">{cta} +</span>
              )}
            </span>
            <span className="mqp-metric-copy">
              <strong>{value.toLocaleString("uk-UA")}</strong>
              <small>{label}</small>
            </span>
          </Link>
        ))}
      </nav>

      <div className="mqp-grid">
        <div className="mqp-col">
          <section className="mqp-card" aria-labelledby="profile-activity-title">
            <div className="mqp-card-head">
              <h2 id="profile-activity-title">Остання активність</h2>
              <Link to="/app/my-bets?tab=records" className="mqp-link">
                Усі записи <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            {isLoading ? (
              <div
                className="mqp-loading"
                role="status"
                aria-label="Завантажуємо записи"
              >
                <span />
                <span />
                <span />
              </div>
            ) : recent.length ? (
              <ul className="mqp-records">
                {recent.map((bet) => {
                  const summary = recordSummary(bet);
                  const date = recordDate(bet);
                  return (
                    <li key={journalKey(bet)}>
                      <Link
                        className="mqp-record"
                        to="/app/my-bets?tab=records"
                        aria-label={`Деталі: ${summary.title}`}
                      >
                        <span className="mqp-badge">{summary.game}</span>
                        <span className="mqp-pair" aria-hidden="true">
                          {summary.express ? (
                            <span className="mqp-team">
                              <Layers size={16} />
                            </span>
                          ) : (
                            <>
                              <TeamMark
                                url={bet.logoTeam1}
                                name={summary.team1}
                                game={bet.game}
                              />
                              {summary.team2 && (
                                <>
                                  <span className="mqp-vs">vs</span>
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
                        <span className="mqp-record-copy">
                          <strong>{summary.title}</strong>
                          <small>{summary.description}</small>
                        </span>
                        <time dateTime={date}>
                          {date ? profileDate(new Date(date)) : "Без дати"}
                        </time>
                        <ChevronRight
                          size={16}
                          className="mqp-record-arrow"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mqp-empty">
                <strong>Ваш журнал починається тут</strong>
                <p>Нові записи з’являться в цьому блоці.</p>
                <Link className="mqp-link" to="/app/my-bets?tab=records">
                  Перейти до журналу <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            )}
          </section>

          <section className="mqp-card" aria-labelledby="profile-settings-title">
            <div className="mqp-card-head">
              <h2 id="profile-settings-title">Налаштування</h2>
            </div>
            <fieldset className="mqp-themes">
              <legend>Тема інтерфейсу</legend>
              <div className="mqp-theme-options">
                {(
                  [
                    ["light", "Світла"],
                    ["dark", "Темна"],
                    ["system", "Системна"],
                  ] as const
                ).map(([mode, label]) => (
                  <label className="mqp-theme" key={mode}>
                    <input
                      type="radio"
                      name="profile-theme"
                      value={mode}
                      checked={p.theme === mode}
                      onChange={() => p.onThemeChange(mode)}
                    />
                    <span className="mqp-theme-frame">
                      <ThemePreview mode={mode} />
                      <span className="mqp-theme-check">
                        <Check size={13} strokeWidth={3} />
                      </span>
                    </span>
                    <span className="mqp-theme-label">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mqp-fields">
              <div className="mqp-field">
                <label htmlFor="profile-language">Мова</label>
                <select
                  id="profile-language"
                  className="mqp-input"
                  value={p.language}
                  onChange={(e) => p.onLanguageChange(e.target.value as Lang)}
                >
                  <option value="uk">Українська</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="mqp-field">
                <label htmlFor="profile-rate">Курс USD → UAH</label>
                <div className="mqp-rate">
                  <input
                    id="profile-rate"
                    className="mqp-input"
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
                    className="mqp-round"
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
                <small id="profile-rate-help">
                  Для конвертації сум у журналі та аналітиці
                </small>
                {rateError && (
                  <small
                    className="mqp-error"
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

        <aside className="mqp-col mqp-rail">
          <section className="mqp-card" aria-labelledby="profile-public-title">
            <div className="mqp-card-head">
              <h2 id="profile-public-title">Публічний профіль</h2>
            </div>
            <div className="mqp-player is-photo">
              <div className="mqp-player-top">
                <span className="mqp-player-brand">
                  Match<span>IQ</span>
                </span>
                <span className="mqp-chip-glass">
                  <i aria-hidden="true" />
                  Онлайн
                </span>
              </div>
              <div className="mqp-player-bottom">
                <strong>@{p.username}</strong>
                <span>
                  {total.toLocaleString("uk-UA")} записів · CS2 та Dota 2
                </span>
              </div>
              <div className="mqp-player-actions">
                <a
                  className="mqp-pill"
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Переглянути
                  <span className="mqp-pill-arrow" aria-hidden="true">
                    <ArrowUpRight size={16} />
                  </span>
                  <span className="sr-only"> (нова вкладка)</span>
                </a>
                <button
                  className="mqp-btn-glass is-square"
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
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
                <span className="sr-only" role="status">
                  {copied ? "Посилання скопійовано" : ""}
                </span>
              </div>
            </div>
            {copyFailed && (
              <label className="mqp-field">
                Посилання на профіль
                <input
                  className="mqp-input"
                  readOnly
                  value={publicUrl}
                  onFocus={(e) => e.currentTarget.select()}
                />
              </label>
            )}
          </section>

          <section className="mqp-card" aria-labelledby="profile-backup-title">
            <div className="mqp-card-head is-start">
              <span className="mqp-icon is-accent">
                <Download size={19} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h2 id="profile-backup-title">Резервна копія</h2>
            </div>
            <p className="mqp-text">
              {p.lastBackupDate
                ? `Остання копія: ${profileDate(p.lastBackupDate)}.`
                : "Ви ще не створювали резервну копію."}{" "}
              Збережіть журнал і налаштування, перш ніж щось змінювати.
            </p>
            {p.needsBackupReminder && p.lastBackupDate && (
              <small className="mqp-note">
                Рекомендуємо створити актуальну копію.
              </small>
            )}
            <button className="mqp-pill" type="button" onClick={p.onOpenBackup}>
              Відкрити бекап
              <span className="mqp-pill-arrow" aria-hidden="true">
                <ArrowRight size={16} />
              </span>
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}
