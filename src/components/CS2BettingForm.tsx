import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  ChevronDown,
  Target,
  ArrowUpRight,
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
import BetTypePicker from "./betting-form/BetTypePicker";
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

  const match = (mode: "match" | "prediction" | "all") => (
    <BettingFormMatchSection
      mode={mode}
      hideOdds={mode === "prediction"}
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
        logoTeam1: h.prefillLogosRef.current.logoTeam1,
        logoTeam2: h.prefillLogosRef.current.logoTeam2,
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
  return (
    <div className="record-entry entry-single">
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
          <section
            className="single-card single-match"
            aria-labelledby="single-match-title"
          >
            <header className="single-heading">
              <h2 id="single-match-title">Матч</h2>
              <button
                type="button"
                className="entry-clear"
                onClick={() => {
                  h.clearForm();
                  setError("");
                }}
              >
                <Trash2 size={15} /> Очистити
              </button>
            </header>
            {settings("match")}
            {isExpress ? (
              <p className="entry-muted single-express-hint">
                Додайте матчі та прогнози нижче. Сума буде спільною для всього
                експресу.
              </p>
            ) : (
              <>
                <div className="single-fields single-teams">
                  {[1, 2].map((number) => {
                    const field = number === 1 ? "team1" : "team2";
                    const logo =
                      number === 1
                        ? h.prefillLogosRef.current.logoTeam1
                        : h.prefillLogosRef.current.logoTeam2;
                    return (
                      <label key={field}>
                        Команда {number}
                        <div className="single-team-input">
                          <img
                            src={
                              logo ||
                              `/assets/team-placeholder-${d.game === "Dota2" ? "dota" : "cs2"}.svg`
                            }
                            alt=""
                            onError={(e) => {
                              e.currentTarget.style.visibility = "hidden";
                            }}
                          />
                          <input
                            id={field}
                            value={d[field]}
                            placeholder={
                              number === 1 ? "Команда 1" : "Команда 2"
                            }
                            onChange={(e) =>
                              h.setFormData((prev) => ({
                                ...prev,
                                [field]: e.target.value,
                                selection: "",
                              }))
                            }
                          />
                        </div>
                      </label>
                    );
                  })}
                </div>
                <div className="single-import">
                  <label htmlFor="matchUrl">Посилання на матч</label>
                  <div>
                    <input
                      id="matchUrl"
                      value={d.matchUrl}
                      onChange={(e) => h.handleUrlChange(e.target.value)}
                      placeholder="https://…"
                    />
                    <button
                      type="button"
                      onClick={() => h.parseMatchFromUrl(d.matchUrl)}
                      disabled={h.isParsingMatch || !d.matchUrl}
                    >
                      {h.isParsingMatch ? "Оновлення…" : "Заповнити"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
          <aside className="single-risks" aria-labelledby="single-risk-title">
            <header className="single-heading">
              <h2 id="single-risk-title">Ризиковані команди</h2>
              <a href="/app/risky-teams">
                Довідник команд <ArrowUpRight size={13} />
              </a>
            </header>
            <p className="single-risk-subtitle">
              Примітки до {isExpress ? "матчів експресу" : "цього матчу"}
            </p>
            {!teams.length && (
              <p className="single-risk-empty">
                Оберіть команди — тут з’являться їхні статуси та збережені
                примітки.
              </p>
            )}
            {teams.map((team) => {
              const note = findRiskyTeams(
                team.name,
                "",
                getGameFilterValue(team.game),
                d.riskyTeams,
              )[0];
              const risk = note && /бан|ризик|нестаб/i.test(note.status);
              const selected = candidates.some(
                (item) =>
                  item.name === team.name &&
                  item.game === team.game &&
                  item.selected,
              );
              return (
                <article
                  className={`single-team-card ${risk ? "is-risk" : ""} ${note && /бан/i.test(note.status) ? "is-ban" : ""}`}
                  key={team.game + team.name}
                >
                  <div className="single-team-heading">
                    <img
                      src={
                        team.logo ||
                        note?.logo ||
                        `/assets/team-placeholder-${team.game === "Dota2" ? "dota" : "cs2"}.svg`
                      }
                      alt=""
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />
                    <div>
                      <h3>{team.name}</h3>
                      {selected && <small>Ваш вибір</small>}
                    </div>
                    {note?.status && (
                      <span className="single-status">{note.status}</span>
                    )}
                  </div>
                  <span className="single-note-label">
                    Примітка
                    {isExpress
                      ? ` · ${team.game === "Dota2" ? "Dota 2" : "CS2"}`
                      : ""}
                  </span>
                  <p>
                    {note
                      ? note.notes || "Додаткового коментаря немає."
                      : "Немає збережених приміток"}
                  </p>
                </article>
              );
            })}
          </aside>
          <section
            className="single-card single-prediction"
            aria-labelledby="single-prediction-title"
          >
            <header className="single-heading">
              <h2 id="single-prediction-title">Прогноз</h2>
              <div className="entry-category" aria-label="Категорія запису">
                {["Ординар", "Експрес"].map((value) => (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={d.betCategory === value}
                    onClick={() => changeCategory(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </header>
            {isExpress ? (
              <div className="single-express">
                {!(h.isExpressFromMatches && h.expressEvents.length > 0) &&
                  match("all")}
                {events}
              </div>
            ) : (
              <div className="single-fields">
                <label>
                  Вибір команди
                  <select
                    id="entry-selection"
                    value={d.selection}
                    disabled={!d.team1 || !d.team2}
                    onChange={(e) =>
                      h.setFormData((prev) => ({
                        ...prev,
                        selection: e.target.value,
                      }))
                    }
                  >
                    <option value="">Оберіть команду</option>
                    {[...new Set([d.team1, d.team2])]
                      .filter(Boolean)
                      .map((team) => (
                        <option key={team}>{team}</option>
                      ))}
                  </select>
                </label>
                <label>
                  Тип прогнозу
                  <BetTypePicker
                    value={d.betType}
                    format={d.format}
                    onChange={(value) =>
                      h.setFormData((prev) => ({
                        ...prev,
                        betType: value,
                      }))
                    }
                  />
                </label>
              </div>
            )}
            <div className="single-fields single-money">
              <label>
                {isExpress ? "Загальний коефіцієнт" : "Коефіцієнт"}
                <input
                  id="entry-odds"
                  type="number"
                  min="1.01"
                  step="0.01"
                  value={isExpress ? (odds > 1 ? odds.toFixed(2) : "") : d.odds}
                  readOnly={isExpress}
                  placeholder="1.65"
                  onChange={(e) =>
                    h.setFormData((prev) => ({ ...prev, odds: e.target.value }))
                  }
                />
              </label>
              <div>
                <label htmlFor="entry-stake">Сума ставки</label>
                <div className="single-stake">
                  <input
                    id="entry-stake"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={d.stake}
                    placeholder="0"
                    onChange={(e) =>
                      h.setFormData((prev) => ({
                        ...prev,
                        stake: e.target.value,
                      }))
                    }
                  />
                  <div className="single-currency" aria-label="Валюта запису">
                    {["UAH", "USD"].map((currency) => (
                      <button
                        type="button"
                        key={currency}
                        aria-label={currency}
                        aria-pressed={d.currency === currency}
                        onClick={() =>
                          h.setFormData((prev) => ({ ...prev, currency }))
                        }
                      >
                        {currency === "UAH" ? "₴" : "$"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <section className="single-returns" aria-label="У разі виграшу">
              <span>У разі виграшу</span>
              <div>
                <p>
                  <strong>{validAmounts ? money(stake * odds) : "—"}</strong>{" "}
                  виплата
                </p>
                <p>
                  <strong>
                    {validAmounts ? "+" + money(stake * (odds - 1)) : "—"}
                  </strong>{" "}
                  прибуток
                </p>
              </div>
            </section>
            <details className="single-options">
              <summary>
                <Target size={16} /> Ціль і стратегія{" "}
                <span>
                  {h.activeGoals.find((goal) => goal.id === d.goalId)?.name ||
                    "Без цілі"}{" "}
                  · {h.primaryStrategy?.name || "Без стратегії"}
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
                {h.isSubmitting ? "Збереження…" : "Зберегти запис"}
              </Button>
              <p>Буде збережено лише запис у журналі</p>
            </footer>
          </section>
        </fieldset>
      </form>
    </div>
  );
}
