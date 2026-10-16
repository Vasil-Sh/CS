import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  ChevronDown,
  Target,
  ArrowUpRight,
  BookOpen,
  Circle,
  CircleCheck,
  Plus,
} from "lucide-react";
import StrategyViolationDialog from "./StrategyViolationDialog";
import SidebarCalculations from "./betting-form/SidebarCalculations";
import {
  findRiskyTeams,
  getGameFilterValue,
  normalizeTeamName,
} from "@/lib/riskyTeamsMatcher";
import { ExpressEventBuilder } from "./ExpressEventBuilder";
import BettingFormAlerts from "./betting-form/BettingFormAlerts";
import BettingFormSettings from "./betting-form/BettingFormSettings";
import BettingFormMatchSection from "./betting-form/BettingFormMatchSection";
import BettingFormFinances from "./betting-form/BettingFormFinances";
import { getBetTypeLabel } from "@/lib/displayHelpers";
import { proxyLogoUrl } from "@/lib/logoProxy";
import "./mybets/RecordCompactForm.css";

const statusTone = (value: string) => {
  switch (value) {
    case "БАН":
      return "ban";
    case "Ризиковані":
      return "warning";
    case "Нестабільні":
      return "unstable";
    case "Обережно":
      return "caution";
    case "Під питанням":
      return "question";
    case "Неоцінена":
      return "neutral";
    case "Стабільні":
      return "safe";
    case "Надійна":
      return "reliable";
    default:
      return "neutral";
  }
};

import { useBettingForm, type MatchPrefillData } from "@/hooks/useBettingForm";
export type { MatchPrefillData } from "@/hooks/useBettingForm";
interface Props {
  onRecordAdded?: () => void;
  prefillData?: MatchPrefillData | null;
  onPrefillConsumed?: () => void;
  expressMatchesData?: MatchPrefillData[] | null;
  onExpressMatchesConsumed?: () => void;
}
export default function CS2BettingForm(props: Props) {
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);
  const h = useBettingForm({
    ...props,
    onRecordAdded: () => {
      setError("");
      props.onRecordAdded?.();
    },
  });
  const d = h.formData;
  const isExpress = d.betCategory === "Експрес";
  const odds = isExpress ? h.totalExpressOdds : Number(d.odds);
  const stake = Number(d.stake);
  const fieldHasValue = (v: unknown) =>
    typeof v === "string" ? v.trim().length > 0 : v !== "" && v != null;
  const isFormEmpty =
    !fieldHasValue(d.team1) &&
    !fieldHasValue(d.team2) &&
    !fieldHasValue(d.odds) &&
    !fieldHasValue(d.stake) &&
    !fieldHasValue(d.selection) &&
    h.expressEvents.length === 0;
  const validAmounts =
    Number.isFinite(odds) &&
    odds > 1 &&
    Number.isFinite(stake) &&
    stake > 0 &&
    (!isExpress || h.allExpressEventsComplete);
  const money = (amount: number) =>
    new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 2 }).format(
      amount,
    ) + (d.currency === "USD" ? " $" : " ₴");
  const changeCategory = (category: string) => {
    if (category === d.betCategory) return;
    if (
      category === "Ординар" &&
      h.expressEvents.length &&
      !window.confirm(
        "Перейти до ординара? Події поточного експресу буде очищено.",
      )
    )
      return;
    if (category === "Ординар") h.clearExpressEvents();
    h.setFormData((prev) => ({ ...prev, betCategory: category }));
    setError("");
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (h.tiltBlock.blocked || h.isSubmitting) return;
    let message = "";
    if (!d.date) message = "Вкажіть дату матчу.";
    else if (isExpress && !h.expressEvents.length)
      message = "Додайте хоча б одну подію до експресу.";
    else if (
      !isExpress &&
      (!d.team1.trim() ||
        !d.team2.trim() ||
        d.team1.trim().toLowerCase() === d.team2.trim().toLowerCase())
    )
      message = "Вкажіть дві різні команди матчу.";
    else if (!validAmounts)
      message =
        "Введіть коефіцієнт більший за 1 та суму більшу за 0. Для експресу заповніть усі події.";
    else if (
      !isExpress &&
      (!d.betType || !d.selection || ![d.team1, d.team2].includes(d.selection))
    )
      message = "Оберіть ринок і команду для прогнозу.";
    setError(message);
    if (message) {
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    void h.handleSubmit(event);
  };
  const css = {
    input: "entry-native-select",
    select: "entry-native-select",
    label: "entry-field-label",
    section: "entry-section-title",
  };
  const settings = (mode: "match" | "goal") => (
    <BettingFormSettings
      mode={mode}
      data={{
        date: h.formData.date,
        game: h.formData.game,
        betCategory: h.formData.betCategory,
        format: h.formData.format,
        goalId: h.formData.goalId,
      }}
      isPrefilled={h.isPrefilled}
      isExpressFromMatches={h.isExpressFromMatches}
      activeGoals={h.activeGoals}
      classes={{
        input: css.input,
        selectTrigger: css.select,
        label: css.label,
        sectionTitle: css.section,
      }}
      onClearForm={h.clearForm}
      onCategoryChange={changeCategory}
      onFieldChange={(field, value) =>
        h.setFormData((prev) => ({ ...prev, [field]: value }))
      }
      onGoalSelect={(goalId) =>
        h.setFormData((prev) => ({
          ...prev,
          goalId: goalId === "all" ? "" : goalId,
        }))
      }
    />
  );

  const match = (
    mode: "match" | "prediction" | "all",
    extraPredictionSlot?: ReactNode,
  ) => (
    <BettingFormMatchSection
      mode={mode}
      hideOdds={mode === "prediction"}
      hideHeading
      teamOptions={(h.availableTeams || [])
        .filter((team) =>
          d.game === "Dota2"
            ? /dota|дота/i.test(team.game)
            : /cs|кс/i.test(team.game),
        )
        .map((team) => team.name)}
      extraPredictionSlot={extraPredictionSlot}
      data={{
        game: h.formData.game,
        format: h.formData.format,
        betCategory: h.formData.betCategory,
        matchUrl: h.formData.matchUrl,
        team1: h.formData.team1,
        team2: h.formData.team2,
        betType: h.formData.betType,
        selection: h.formData.selection,
        odds: h.formData.odds,
        logoTeam1: teamLogo(d.team1, 0),
        logoTeam2: teamLogo(d.team2, 1),
      }}
      isParsing={h.isParsingMatch}
      isExpressFromMatches={h.isExpressFromMatches}
      expressEventsCount={h.expressEvents.length}
      classes={{
        input: css.input,
        selectTrigger: css.select,
        label: css.label,
        sectionTitle: css.section,
      }}
      onFieldChange={(field, value) =>
        h.setFormData((prev) => ({
          ...prev,
          [field]: value,
          ...(field === "team1" || field === "team2"
            ? { selection: "", betType: "" }
            : {}),
        }))
      }
      onParseUrl={() => h.parseMatchFromUrl(h.formData.matchUrl)}
      onUrlChange={h.handleUrlChange}
      onAddToExpress={h.addExpressEvent}
      submitErrors={h.submitErrors}
    />
  );
  const events = (
    <ExpressEventBuilder
      expressEvents={h.expressEvents}
      totalExpressOdds={h.totalExpressOdds}
      expressRisk={h.expressRisk}
      allExpressEventsComplete={h.allExpressEventsComplete}
      game={h.formData.game}
      format={h.formData.format}
      onUpdateEvent={h.updateExpressEvent}
      onRemoveEvent={h.removeExpressEvent}
      onClearAll={h.clearExpressEvents}
    />
  );

  const candidates = [
    ...[d.team1, d.team2].map((name, index) => ({
      name,
      game: d.game,
      logo:
        index === 0
          ? h.prefillLogosRef.current.logoTeam1
          : h.prefillLogosRef.current.logoTeam2,
      selected: d.selection === name,
    })),
    ...(isExpress
      ? h.expressEvents.flatMap((event) =>
          event.match.split(" vs ").map((name, index) => ({
            name,
            game:
              event.game === "Dota2" ? ("Dota2" as const) : ("CS2" as const),
            logo: index === 0 ? event.logoTeam1 : event.logoTeam2,
            selected: event.selection === name,
          })),
        )
      : []),
  ].filter((team) => team.name.trim());
  const teams = candidates.filter(
    (team, index) =>
      candidates.findIndex(
        (other) =>
          normalizeTeamName(other.name) === normalizeTeamName(team.name) &&
          other.game === team.game,
      ) === index,
  );
  const displayLogo = (logo?: string | null, game: string = d.game) =>
    logo
      ? (logo.startsWith("/") ? logo : proxyLogoUrl(logo, game)) ||
        "/assets/team-placeholder.svg"
      : "/assets/team-placeholder.svg";
  const teamLogo = (name: string, index: number) =>
    displayLogo(
      (index === 0
        ? h.prefillLogosRef.current.logoTeam1
        : h.prefillLogosRef.current.logoTeam2) ||
        findRiskyTeams(name, "", getGameFilterValue(d.game), d.riskyTeams)[0]
          ?.logo ||
        null,
    );
  const stakeField = (
    <div className="record-stake-field">
      <label htmlFor="entry-stake" className="entry-field-label">
        Сума ставки
      </label>
      <div className="single-stake">
        <input
          id="entry-stake"
          type="number"
          min="0.01"
          step="0.01"
          value={d.stake}
          placeholder="0"
          onChange={(e) =>
            h.setFormData((prev) => ({ ...prev, stake: e.target.value }))
          }
        />
        <select
          className="record-stake-currency"
          aria-label="Валюта запису"
          value={d.currency}
          onChange={(event) => {
            const currency = event.target.value;
            h.setFormData((prev) => ({ ...prev, currency }));
          }}
        >
          <option value="UAH">₴</option>
          <option value="USD">$</option>
        </select>
      </div>
    </div>
  );
  return (
    <div className="record-entry entry-single record-compact-layout">
      <StrategyViolationDialog
        open={h.showViolationDialog}
        onOpenChange={h.setShowViolationDialog}
        strategyName={h.primaryStrategy?.name || ""}
        violations={h.strategyViolations}
        onConfirm={h.handleViolationConfirm}
        onCancel={h.handleViolationCancel}
      />
      <BettingFormAlerts
        showStrategyBanner={false}
        tiltBlock={h.tiltBlock}
        primaryStrategy={h.primaryStrategy}
        strategyViolations={h.strategyViolations}
      />
      <form id="record-entry-form" onSubmit={submit} noValidate>
        <fieldset
          className="single-grid"
          disabled={h.tiltBlock.blocked || h.isSubmitting}
        >
          <aside className="single-risks" aria-labelledby="single-risk-title">
            <header className="single-heading">
              <h2 id="single-risk-title">Ризиковані команди</h2>
            </header>
            <div className="single-risk-body">
              {!teams.length ? (
                <p className="single-risk-empty">
                  Оберіть команди — тут з’являться їхні статуси та збережені
                  примітки.
                </p>
              ) : (
                teams.map((team) => {
                  const note = findRiskyTeams(
                    team.name,
                    "",
                    getGameFilterValue(team.game),
                    d.riskyTeams,
                  )[0];
                  const risk = note && /бан|ризик|нестаб/i.test(note.status);
                  return (
                    <article
                      className={`single-team-card ${risk ? "is-risk" : ""} ${note && /бан/i.test(note.status) ? "is-ban" : ""}`}
                      key={team.game + team.name}
                    >
                      <div className="single-team-heading">
                        <img
                          src={displayLogo(team.logo || note?.logo, team.game)}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              "/assets/team-placeholder.svg";
                          }}
                        />
                        <div className="single-team-name">
                          <h3>{team.name}</h3>
                          {note?.status && (
                            <span
                              className={`single-status ${statusTone(note.status)}`}
                            >
                              {note.status}
                            </span>
                          )}
                        </div>
                      </div>
                      <p>
                        {note
                          ? note.notes || "Додаткового коментаря немає."
                          : "Немає збережених приміток"}
                      </p>
                    </article>
                  );
                })
              )}
            </div>
            <Link className="record-risk-link" to="/app/risky-teams">
              <BookOpen size={20} /> Ризиковані команди{" "}
              <ArrowUpRight size={15} />
            </Link>
          </aside>
          <section
            className="single-card single-prediction record-compact-card"
            aria-labelledby="single-prediction-title"
          >
            <header className="single-heading">
              <h2 id="single-prediction-title">Матч і прогноз</h2>
              <div className="entry-category" aria-label="Категорія запису">
                {["Ординар", "Експрес"].map((value) => (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={d.betCategory === value}
                    onClick={() => changeCategory(value)}
                  >
                    {d.betCategory === value ? (
                      <CircleCheck size={19} />
                    ) : (
                      <Circle size={19} />
                    )}
                    {value}
                  </button>
                ))}
              </div>
            </header>
            <div className="record-match-settings record-match-settings-inline">
              <label className="record-game-label">
                Гра
                <select
                  aria-label="Гра"
                  value={d.game}
                  onChange={(e) =>
                    h.setFormData((prev) => ({
                      ...prev,
                      game: e.target.value as "CS2" | "Dota2",
                      selection: "",
                      betType: "",
                    }))
                  }
                >
                  <option value="CS2">CS2</option>
                  <option value="Dota2">Dota 2</option>
                </select>
              </label>
              <label>
                Дата матчу
                <input
                  id="date"
                  type="date"
                  required
                  value={d.date}
                  onChange={(e) =>
                    h.setFormData((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Формат
                <select
                  id="format"
                  value={d.format}
                  onChange={(e) =>
                    h.setFormData((prev) => ({
                      ...prev,
                      format: e.target.value,
                      betType: "",
                    }))
                  }
                >
                  {["BO1", "BO2", "BO3", "BO5"].map((format) => (
                    <option key={format}>{format}</option>
                  ))}
                </select>
              </label>
            </div>
            {isExpress ? (
              <div className="single-express">
                {!(h.isExpressFromMatches && h.expressEvents.length > 0) &&
                  match("all", stakeField)}
                {events}
              </div>
            ) : (
              <div className="record-prediction-fields">
                {match("all", stakeField)}
              </div>
            )}
            {isExpress && (
              <div className="single-fields single-money">
                <label>
                  Загальний коефіцієнт
                  <input
                    id="entry-odds"
                    type="number"
                    min="1.01"
                    step="0.01"
                    value={odds > 1 ? odds.toFixed(2) : ""}
                    readOnly
                    placeholder="1.65"
                  />
                </label>
              </div>
            )}
            <details className="single-options">
              <summary>
                <Target size={16} /> Ціль і стратегія{" "}
                <span>
                  {[
                    h.activeGoals.find((goal) => goal.id === d.goalId)?.name,
                    h.primaryStrategy?.name,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "необов’язково"}
                </span>
                <ChevronDown size={14} />
              </summary>
              {settings("goal")}
              <div className="entry-strategy-context">
                <span>Основна стратегія</span>
                <strong>{h.primaryStrategy?.name || "Не обрана"}</strong>
                <small>
                  Правила перевіряються під час збереження. Ціль не змінює
                  введену суму.
                </small>
              </div>
            </details>
            <BettingFormFinances
              analysisOnly
              data={{
                stake: h.formData.stake,
                currency: h.formData.currency,
                confidence: h.formData.confidence,
              }}
              isSubmitting={h.isSubmitting}
              isBlocked={h.tiltBlock.blocked}
              isHighConfidence={h.isHighConfidence}
              showSection
              classes={{
                input: css.input,
                label: css.label,
                sectionTitle: css.section,
              }}
              onFieldChange={(field, value) =>
                h.setFormData((prev) => ({ ...prev, [field]: value }))
              }
              onConfidenceChange={h.handleConfidenceChange}
              submitErrors={h.submitErrors}
              calculations={
                <SidebarCalculations
                  stake={h.formData.stake}
                  betCategory={h.formData.betCategory}
                  currency={h.formData.currency}
                  totalExpressOdds={h.totalExpressOdds}
                  expressEventsCount={h.expressEvents.length}
                  potentialProfitInCurrency={h.potentialProfit}
                  expectedValue={h.expectedValue}
                  evVerdict={h.evVerdict}
                  isValuePositive={h.isValuePositive}
                  valueBetAnalysis={h.valueBetAnalysis}
                  kellyData={h.kellyData}
                  overconfidenceWarning={h.overconfidenceWarning}
                  hasConfidence={h.hasConfidence}
                  maxStakePercent={h.maxStakePercent}
                  onMaxStakePercentChange={h.setMaxStakePercent}
                  onApplyKellyAmount={h.applyKellyAmount}
                />
              }
            />
          </section>
          <aside
            className="single-card record-summary"
            aria-labelledby="record-summary-title"
          >
            {isFormEmpty ? (
              <>
                <h2 id="record-summary-title">Як це працює?</h2>
                <ol className="record-summary-guide">
                  {[
                    [
                      "Оберіть матч",
                      "Вкажіть команди, дату та формат матчу, на який робите запис.",
                    ],
                    [
                      "Додайте прогноз",
                      "Оберіть ринок, команду та коефіцієнт для ставки.",
                    ],
                    [
                      "Вкажіть суму",
                      "Введіть суму ставки, щоб побачити розрахунки та EV.",
                    ],
                    [
                      "Збережіть запис",
                      "Запис з'явиться у вашому журналі та вплине на аналітику.",
                    ],
                  ].map(([title, text], i) => (
                    <li key={title}>
                      <span>{i + 1}</span>
                      <div>
                        <h3>{title}</h3>
                        <p>{text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <>
                <h2 id="record-summary-title">Підсумок запису</h2>
                <div className="record-summary-body">
                  {isExpress ? (
                    <div className="record-summary-events">
                      <strong>Експрес · {h.expressEvents.length} подій</strong>
                      {h.expressEvents.map((event, index) => (
                        <div key={index}>
                          <strong>{event.match}</strong>
                          <small>
                            {event.selection} · {event.odds || "—"}
                          </small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="record-summary-teams">
                      {[d.team1, d.team2].map((team, index) => (
                        <div key={index}>
                          <img src={teamLogo(team, index)} alt="" />
                          <strong>{team || `Команда ${index + 1}`}</strong>
                          {index === 0 && <span>vs</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="record-summary-meta">
                    {d.game === "Dota2" ? "Dota 2" : "CS2"} ·{" "}
                    {d.date
                      ? d.date.split("-").reverse().join(".")
                      : "Дата не вказана"}{" "}
                    · {d.format}
                  </p>
                  <dl className="record-summary-values">
                    <div>
                      <dt>Прогноз</dt>
                      <dd>
                        {isExpress
                          ? "Експрес"
                          : d.selection && d.betType
                            ? `${d.selection} — ${getBetTypeLabel(d.betType, d.format)}`
                            : "Не обрано"}
                      </dd>
                    </div>
                    <div>
                      <dt>Коефіцієнт</dt>
                      <dd>
                        {Number.isFinite(odds) && odds > 1
                          ? odds.toFixed(2)
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt>Сума ставки</dt>
                      <dd>{stake > 0 ? money(stake) : "—"}</dd>
                    </div>
                  </dl>
                  <section
                    className="single-returns"
                    aria-label="У разі виграшу"
                  >
                    <div>
                      <p>
                        <strong>
                          {validAmounts ? money(stake * odds) : "—"}
                        </strong>{" "}
                        У разі виграшу
                      </p>
                      <p>
                        <strong>
                          {validAmounts ? "+" + money(stake * (odds - 1)) : "—"}
                        </strong>{" "}
                        Чистий прибуток
                      </p>
                    </div>
                  </section>
                </div>
              </>
            )}
            {error && (
              <p
                className="wizard-error"
                role="alert"
                ref={errorRef}
                tabIndex={-1}
              >
                {error}
              </p>
            )}

            <footer className="single-save">
              <Button id="submit-btn" type="submit">
                <Plus size={18} />
                {h.isSubmitting ? "Збереження…" : "Зберегти запис"}
              </Button>
              <button
                type="button"
                className="record-reset"
                onClick={() => {
                  h.clearForm();
                  setError("");
                }}
              >
                <Trash2 size={16} /> Очистити
              </button>
              <p>
                Запис збережеться в журналі та враховуватиметься в аналітиці,
                стратегіях і цілях.
              </p>
            </footer>
          </aside>
        </fieldset>
      </form>
    </div>
  );
}
