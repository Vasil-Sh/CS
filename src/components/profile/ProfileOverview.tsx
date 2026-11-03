import { pt, profileLocale } from "@/lib/profileTranslations";
import { t } from "@/lib/i18n";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  ShieldAlert,
  Target,
  Flag,
  Send,
  Copy,
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  Check,
  RefreshCw,
  Layers,
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { proxyLogoUrl } from "@/lib/logoProxy";
import { journalKey } from "@/components/mybets/journalModel";
import type { ThemePreference } from "@/hooks/useTheme";
import type { Lang } from "@/lib/i18n";
import "./ProfileRedesign.css";
import "./ProfileSections.css";
import CountUp from "./CountUp";
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
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [rate, setRate] = useState(String(p.exchangeRate));
  const [rateError, setRateError] = useState("");

  useEffect(() => {
    setRate(String(p.exchangeRate));
  }, [p.exchangeRate]);
  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timeout);
  }, [copied]);

  const publicUrl = `${window.location.origin}/user/${encodeURIComponent(p.username)}`;
  const recent = recentRecords(bets);
  const total = isLoading ? p.stats.bets : bets.length;
  const metrics = [
    {
      label: t("profile.ui.yourBets"),
      value: total,
      Icon: FileText,
      href: "/app/my-bets",
      cta: t("profile.ui.add"),
    },
    {
      label: t("profile.ui.riskyTeams"),
      value: p.stats.riskyTeams,
      Icon: ShieldAlert,
      href: "/app/risky-teams",
      cta: t("profile.ui.add"),
    },
    {
      label: t("profile.ui.strategies"),
      value: p.stats.strategies,
      Icon: Target,
      href: "/app/strategy",
      cta: t("profile.ui.create"),
    },
    {
      label: t("profile.ui.goals"),
      value: p.stats.goals,
      Icon: Flag,
      href: "/app/goals",
      cta: t("profile.ui.setGoal"),
    },
    {
      label: t("profile.ui.telegramGroups"),
      value: p.stats.tgGroups,
      Icon: Send,
      href: "/app/telegram",
      cta: t("profile.ui.connect"),
    },
  ];

  function commitRate() {
    const value = Number(rate.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setRateError(t("profile.ui.invalidRate"));
      return;
    }
    setRateError("");
    if (value !== p.exchangeRate) p.onExchangeRateChange(value);
  }

  return (
    <>
      <section
        className="mqp-hero is-photo is-compact"
        aria-label={t("profile.ui.yourProfile")}
      >
        {p.header}
      </section>

      <nav
        className="mqp-metrics is-strip"
        aria-label={t("profile.ui.overview")}
      >
        {metrics.map(({ label, value, href, cta }) => (
          <Link
            className={`mqp-metric${value ? "" : " is-empty"}`}
            to={href}
            key={href}
          >
            <span className="mqp-metric-label">{label}</span>
            <strong className="mqp-count">
              <CountUp value={value} locale={profileLocale()} />
            </strong>
            {value ? (
              <span className="mqp-metric-note">
                {" "}
                {t("profile.ui.open")}{" "}
                <ArrowUpRight
                  className="mqp-metric-arrow"
                  size={14}
                  aria-hidden="true"
                />
              </span>
            ) : (
              <span className="mqp-metric-cta">
                {cta}
                <i aria-hidden="true">+</i>
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="mqp-grid">
        <div className="mqp-col">
          <div className="mqp-sheet">
            <section
              className="mqp-sheet-section"
              aria-labelledby="profile-activity-title"
            >
              <div className="mqp-sec-head">
                <div>
                  <p className="mqp-kicker">
                    <i>01</i> {t("profile.ui.journal")}{" "}
                  </p>
                  <h2 id="profile-activity-title">
                    {t("profile.ui.activity")}
                  </h2>
                </div>
                <Link
                  to="/app/my-bets?tab=records"
                  className="mqp-btn-outline is-sm"
                >
                  {" "}
                  {t("profile.ui.allRecords")}{" "}
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
              {isLoading ? (
                <div
                  className="mqp-loading"
                  role="status"
                  aria-label={t("profile.ui.loadingRecords")}
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
                          aria-label={pt("recordDetails", {
                            title: summary.title,
                          })}
                        >
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
                            <small>
                              {summary.game} · {summary.description}
                            </small>
                          </span>
                          <time dateTime={date}>
                            {date
                              ? profileDate(new Date(date))
                              : t("profile.ui.noDate")}
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
                  <strong>{t("profile.ui.emptyTitle")}</strong>
                  <p>{t("profile.ui.emptyDescription")}</p>
                  <Link
                    className="mqp-btn-outline is-sm"
                    to="/app/my-bets?tab=records"
                  >
                    {" "}
                    {t("profile.ui.openJournal")}{" "}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              )}
            </section>

            <section
              className="mqp-sheet-section"
              aria-labelledby="profile-settings-title"
            >
              <div className="mqp-sec-head">
                <div>
                  <p className="mqp-kicker">
                    <i>02</i> {t("profile.ui.settings")}{" "}
                  </p>
                  <h2 id="profile-settings-title">
                    {t("profile.ui.preferences")}
                  </h2>
                </div>
              </div>
              <div className="mqp-setrows">
                <div
                  className="mqp-setrow"
                  role="radiogroup"
                  aria-labelledby="profile-theme-label"
                >
                  <span className="mqp-setrow-label" id="profile-theme-label">
                    {" "}
                    {t("profile.ui.theme")}{" "}
                  </span>
                  <div className="mqp-setrow-control">
                    <div className="mqp-theme-options">
                      {(
                        [
                          ["light", t("profile.ui.light")],
                          ["dark", t("profile.ui.dark")],
                          ["system", t("profile.ui.system")],
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
                  </div>
                </div>
                <div className="mqp-setrow mqp-setrow--pair">
                  <div className="mqp-setrow-field">
                    <label htmlFor="profile-language">
                      {t("profile.ui.language")}
                    </label>
                    <select
                      id="profile-language"
                      className="mqp-input"
                      value={p.language}
                      onChange={(e) =>
                        p.onLanguageChange(e.target.value as Lang)
                      }
                    >
                      <option value="uk">{t("profile.ui.ukrainian")}</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="mqp-setrow-field">
                    <label htmlFor="profile-rate">{t("profile.ui.rate")}</label>
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
                        aria-label={t("profile.ui.refreshRate")}
                        onClick={p.onFetchRate}
                      >
                        <RefreshCw
                          size={17}
                          className={p.isFetchingRate ? "animate-spin" : ""}
                        />
                      </button>
                    </div>
                    {rateError && (
                      <small
                        className="mqp-error"
                        id="profile-rate-error"
                        role="alert"
                      >
                        {t("profile.ui.invalidRate")}
                      </small>
                    )}
                    <small id="profile-rate-help">
                      {t("profile.ui.rateHelp")}
                    </small>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <aside className="mqp-col mqp-rail">
          <section className="mqp-card" aria-labelledby="profile-public-title">
            <div className="mqp-sec-head">
              <div>
                <p className="mqp-kicker">
                  <i>03</i> {t("profile.ui.profile")}{" "}
                </p>
                <h2 id="profile-public-title">
                  {t("profile.ui.publicProfile")}
                </h2>
              </div>
            </div>
            <div className="mqp-player is-photo">
              <div className="mqp-player-top">
                <span className="mqp-player-brand">
                  Match<span>IQ</span>
                </span>
                <span className="mqp-chip-glass">
                  <i aria-hidden="true" /> {t("profile.ui.online")}{" "}
                </span>
              </div>
              <div className="mqp-player-bottom">
                <strong>@{p.username}</strong>
                <span>
                  {total.toLocaleString(profileLocale())}{" "}
                  {t("profile.ui.recordSuffix")}{" "}
                </span>
              </div>
              <div className="mqp-player-actions">
                <a
                  className="mqp-pill"
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {" "}
                  {t("profile.ui.view")}{" "}
                  <span className="mqp-pill-arrow" aria-hidden="true">
                    <ArrowUpRight size={16} />
                  </span>
                  <span className="sr-only"> {t("profile.ui.newTab")}</span>
                </a>
                <button
                  className="mqp-btn-glass is-square"
                  type="button"
                  title={copied ? t("profile.ui.copied") : t("profile.ui.copy")}
                  aria-label={
                    copied ? t("profile.ui.copied") : t("profile.ui.copy")
                  }
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(publicUrl);
                      setCopied(true);
                      setCopyFailed(false);
                      toast.success(t("profile.ui.copied"));
                    } catch {
                      setCopyFailed(true);
                      toast.error(t("profile.ui.copyFailed"));
                    }
                  }}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
                <span className="sr-only" role="status">
                  {copied ? t("profile.ui.copied") : ""}
                </span>
              </div>
            </div>
            {copyFailed && (
              <label className="mqp-field">
                {" "}
                {t("profile.ui.profileLink")}{" "}
                <input
                  className="mqp-input"
                  readOnly
                  value={publicUrl}
                  onFocus={(e) => e.currentTarget.select()}
                />
              </label>
            )}
          </section>

          <section
            className="mqp-card mqp-backup-card"
            aria-labelledby="profile-backup-title"
          >
            <p className="mqp-kicker">
              <i>04</i> {t("profile.ui.backupCopy")}{" "}
            </p>
            <h2 id="profile-backup-title">{t("profile.ui.saveJournal")}</h2>
            <p className="mqp-text">
              {p.lastBackupDate
                ? pt("lastBackup", { date: profileDate(p.lastBackupDate) })
                : t("profile.ui.noBackup")}{" "}
              {t("profile.ui.backupDescription")}{" "}
            </p>
            {p.needsBackupReminder && p.lastBackupDate && (
              <small className="mqp-note">
                {" "}
                {t("profile.ui.backupReminder")}{" "}
              </small>
            )}
            <button className="mqp-pill" type="button" onClick={p.onOpenBackup}>
              {" "}
              {t("profile.ui.openBackup")}{" "}
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
