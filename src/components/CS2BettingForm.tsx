import { useEffect, useRef, useState, type FormEvent } from "react";
import { logRender } from "@/lib/devLogger";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import StrategyViolationDialog from "./StrategyViolationDialog";
import SidebarCalculations from "./betting-form/SidebarCalculations";
import { getBetTypeLabel } from "@/lib/displayHelpers";
import { ExpressEventBuilder } from "./ExpressEventBuilder";
import BettingFormAlerts from "./betting-form/BettingFormAlerts";
import BettingFormSettings from "./betting-form/BettingFormSettings";
import BettingFormMatchSection from "./betting-form/BettingFormMatchSection";
import BettingFormFinances from "./betting-form/BettingFormFinances";
import { useBettingForm } from "@/hooks/useBettingForm";
import type { MatchPrefillData } from "@/hooks/useBettingForm";

export type { MatchPrefillData } from "@/hooks/useBettingForm";
interface Props {
  onRecordAdded?: () => void;
  prefillData?: MatchPrefillData | null;
  onPrefillConsumed?: () => void;
  expressMatchesData?: MatchPrefillData[] | null;
  onExpressMatchesConsumed?: () => void;
}
type Step = 1 | 2 | 3;

export default function CS2BettingForm(props: Props) {
  logRender("CS2BettingForm");
  const [step, setStep] = useState<Step>(
    props.prefillData || props.expressMatchesData?.length ? 2 : 1,
  );
  const [error, setError] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const h = useBettingForm({
    ...props,
    onRecordAdded: () => {
      setStep(1);
      setError("");
      props.onRecordAdded?.();
    },
  });
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, [step]);

  const isExpress = h.formData.betCategory === "Експрес";
  const odds = isExpress ? h.totalExpressOdds : Number(h.formData.odds);
  const stake = Number(h.formData.stake);
  const validAmounts =
    Number.isFinite(odds) &&
    odds > 1 &&
    Number.isFinite(stake) &&
    stake > 0 &&
    (!isExpress || h.allExpressEventsComplete);
  const selectedTeamValid =
    [h.formData.team1, h.formData.team2].includes(h.formData.selection) &&
    !!h.formData.selection;
  const matchValid =
    !!h.formData.date &&
    (isExpress
      ? h.expressEvents.length > 0
      : !!h.formData.team1.trim() &&
        !!h.formData.team2.trim() &&
        h.formData.team1.trim().toLowerCase() !==
          h.formData.team2.trim().toLowerCase());
  const predictionValid =
    matchValid &&
    validAmounts &&
    (isExpress
      ? h.allExpressEventsComplete
      : selectedTeamValid && !!h.formData.betType);
  const money = (amount: number) =>
    new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 2 }).format(
      amount,
    ) + (h.formData.currency === "USD" ? " $" : " ₴");
  const dateLabel = h.formData.date.split("-").reverse().join(".");
  const matchLabel = isExpress
    ? `Експрес · ${h.expressEvents.length} подій`
    : `${h.formData.team1} — ${h.formData.team2}`;
  const go = (next: Step) => {
    if (h.isSubmitting) return;
    if (next > 1 && !matchValid) {
      setError(
        isExpress
          ? "Додайте хоча б одну подію до експресу."
          : "Вкажіть дату й дві різні команди матчу.",
      );
      return;
    }
    if (next === 3 && !predictionValid) {
      setError(
        "Оберіть прогноз, введіть коефіцієнт більший за 1 та суму більшу за 0. Для експресу заповніть усі події.",
      );
      return;
    }
    setError("");
    setStep(next);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (h.tiltBlock.blocked || h.isSubmitting) return;
    if (step < 3) {
      go((step + 1) as Step);
      return;
    }
    if (!predictionValid) {
      setStep(2);
      setError("Перевірте прогноз і суму перед збереженням.");
      return;
    }
    void h.handleSubmit(event);
  };
  const changeCategory = (category: string) => {
    if (category === h.formData.betCategory) return;
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
    setStep(1);
  };
  const css = {
    input:
      "rounded-md border-gray-200 bg-white h-11 text-gray-900 placeholder:text-gray-400",
    select: "rounded-md border-gray-200 bg-white h-11 text-gray-900",
    label: "text-sm font-medium text-gray-700",
    section: "entry-section-title",
  };
  const category = (
    <div className="entry-category" aria-label="Категорія запису">
      {["Ординар", "Експрес"].map((value) => (
        <button
          type="button"
          key={value}
          aria-pressed={h.formData.betCategory === value}
          onClick={() => changeCategory(value)}
        >
          {value}
        </button>
      ))}
    </div>
  );
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
  const returns = (
    <section className="wizard-returns" aria-label="У разі виграшу">
      <h3>У разі виграшу</h3>
      <div>
        <div>
          <span>Виплата зі ставкою</span>
          <strong>{validAmounts ? money(stake * odds) : "—"}</strong>
        </div>
        <div>
          <span>Чистий прибуток</span>
          <strong>
            {validAmounts ? "+" + money(stake * (odds - 1)) : "—"}
          </strong>
        </div>
      </div>
    </section>
  );
  const notes = h.formData.riskyTeams.length > 0 && (
    <section className="wizard-risks" aria-label="Примітки до команд">
      {h.formData.riskyTeams.map((team, index) => (
        <div
          className={
            /бан|ризик|нестаб/i.test(team.status)
              ? "wizard-risk"
              : "wizard-note"
          }
          key={team.name + team.game + index}
        >
          <AlertTriangle size={20} />
          <div>
            <strong>
              {team.name} · {team.status}
            </strong>
            <p>{team.notes || "Додаткового коментаря немає."}</p>
          </div>
        </div>
      ))}
    </section>
  );

  return (
    <div className="record-entry record-wizard">
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
      <nav className="wizard-steps" aria-label="Кроки створення запису">
        {(["Матч", "Прогноз", "Перевірка"] as const).map((label, index) => (
          <button
            type="button"
            key={label}
            className={
              step === index + 1
                ? "is-current"
                : step > index + 1
                  ? "is-done"
                  : ""
            }
            aria-current={step === index + 1 ? "step" : undefined}
            disabled={index + 1 > step || h.isSubmitting}
            onClick={() => go((index + 1) as Step)}
          >
            <span>{step > index + 1 ? <Check size={15} /> : index + 1}</span>
            {label}
          </button>
        ))}
      </nav>
      {step > 1 && (
        <div className="wizard-context">
          <div>
            <strong>{matchLabel}</strong>
            <span>
              {!isExpress &&
                ` · ${h.formData.game === "Dota2" ? "Dota 2" : "CS2"} · ${h.formData.format}`}{" "}
              · {dateLabel}
            </span>
          </div>
          <button type="button" onClick={() => go(1)} disabled={h.isSubmitting}>
            <Pencil size={14} /> Змінити матч
          </button>
        </div>
      )}
      {step > 1 && notes}
      <form id="record-entry-form" onSubmit={submit} noValidate>
        <fieldset
          disabled={h.tiltBlock.blocked || h.isSubmitting}
          className="wizard-panel"
        >
          <div className="wizard-panel-heading">
            <h2 tabIndex={-1} ref={titleRef}>
              {step === 1
                ? "ОБЕРІТЬ МАТЧ"
                : step === 2
                  ? "ЩО ФІКСУЄМО?"
                  : "ПЕРЕВІРТЕ ЗАПИС"}
            </h2>
            {step < 3 && category}
          </div>
          {step === 1 && (
            <div className="wizard-match-stage">
              {settings("match")}
              {!(h.isExpressFromMatches && h.expressEvents.length > 0) &&
                match(isExpress ? "all" : "match")}
              {notes}
              {isExpress && h.expressEvents.length > 0 && events}
              <button
                type="button"
                className="entry-clear"
                onClick={() => {
                  h.clearForm();
                  setError("");
                }}
              >
                Очистити форму
              </button>
            </div>
          )}
          {step === 2 && (
            <>
              {isExpress ? events : match("prediction")}
              <div className="wizard-money-fields">
                <label>
                  Коефіцієнт
                  <input
                    id="wizard-odds"
                    type="number"
                    min="1.01"
                    step="0.01"
                    value={
                      isExpress
                        ? odds > 1
                          ? odds.toFixed(2)
                          : ""
                        : h.formData.odds
                    }
                    readOnly={isExpress}
                    onChange={(e) =>
                      h.setFormData((prev) => ({
                        ...prev,
                        odds: e.target.value,
                      }))
                    }
                    placeholder="1.65"
                  />
                </label>
                <label>
                  Сума ставки
                  <div className="wizard-stake-input">
                    <input
                      id="wizard-stake"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={h.formData.stake}
                      onChange={(e) =>
                        h.setFormData((prev) => ({
                          ...prev,
                          stake: e.target.value,
                        }))
                      }
                      placeholder="0"
                    />
                    <select
                      aria-label="Валюта запису"
                      value={h.formData.currency}
                      onChange={(e) =>
                        h.setFormData((prev) => ({
                          ...prev,
                          currency: e.target.value,
                        }))
                      }
                    >
                      <option value="UAH">₴</option>
                      <option value="USD">$</option>
                    </select>
                  </div>
                </label>
              </div>
              {returns}
              <details className="wizard-options">
                <summary>
                  Ціль і стратегія
                  <span>
                    {h.formData.goalId ? "Ціль обрано" : "Необов’язково"}
                  </span>
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
            </>
          )}
          {step === 3 && (
            <div className="wizard-review">
              <p className="entry-muted">
                Перевірте дані. Запис ще не збережено.
              </p>
              {isExpress && (
                <ul className="wizard-review-events">
                  {h.expressEvents.map((event, index) => (
                    <li key={index}>
                      <strong>{event.match}</strong>
                      <span>
                        {getBetTypeLabel(event.betType)} · {event.selection} ·{" "}
                        {event.odds}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <dl>
                <dt>Категорія</dt>
                <dd>{h.formData.betCategory}</dd>
                {!isExpress && (
                  <>
                    <dt>Ваш вибір</dt>
                    <dd>{h.formData.selection}</dd>
                    <dt>Прогноз</dt>
                    <dd>
                      {getBetTypeLabel(h.formData.betType, h.formData.format)}
                    </dd>
                  </>
                )}
                <dt>Коефіцієнт</dt>
                <dd>{odds.toFixed(2)}</dd>
                <dt>Сума ставки</dt>
                <dd>{money(stake)}</dd>
                <dt>Ціль</dt>
                <dd>
                  {h.activeGoals.find((goal) => goal.id === h.formData.goalId)
                    ?.name || "Без цілі"}
                </dd>
                <dt>Стратегія</dt>
                <dd>{h.primaryStrategy?.name || "Без стратегії"}</dd>
              </dl>
              {returns}
              <p className="entry-muted">
                Буде збережено лише запис у журналі зі статусом «Очікує
                результату». Ставка не розміщується.
              </p>
            </div>
          )}
          {error && (
            <p className="wizard-error" role="alert">
              {error}
            </p>
          )}
          <footer className="wizard-actions">
            {step > 1 ? (
              <button
                type="button"
                className="wizard-back"
                onClick={() => go((step - 1) as Step)}
              >
                <ArrowLeft size={16} />
                Назад
              </button>
            ) : (
              <span className="entry-muted">Крок 1 із 3</span>
            )}
            <Button
              type="submit"
              className="wizard-next"
              id={step === 3 ? "submit-btn" : undefined}
            >
              {h.isSubmitting
                ? "Збереження…"
                : step === 1
                  ? "До прогнозу"
                  : step === 2
                    ? "Перевірити запис"
                    : "Зберегти запис"}
              <ArrowRight size={16} />
            </Button>
          </footer>
        </fieldset>
      </form>
      <p className="wizard-footnote">
        {step === 1
          ? "Спочатку матч, потім прогноз і перевірка."
          : step === 2
            ? "На наступному кроці — перевірка та збереження."
            : "Збереження не розміщує ставку в букмекерській системі."}
      </p>
    </div>
  );
}
