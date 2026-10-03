import { logRender } from "@/lib/devLogger";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import StrategyViolationDialog from "./StrategyViolationDialog";
import SidebarCalculations from "./betting-form/SidebarCalculations";
import RecordTeamNotes from "./betting-form/RecordTeamNotes";
import { getBetTypeLabel } from "@/lib/displayHelpers";
import { ExpressEventBuilder } from "./ExpressEventBuilder";
import BettingFormAlerts from "./betting-form/BettingFormAlerts";
import BettingFormSettings from "./betting-form/BettingFormSettings";
import BettingFormMatchSection from "./betting-form/BettingFormMatchSection";
import BettingFormFinances from "./betting-form/BettingFormFinances";
import { useBettingForm } from "@/hooks/useBettingForm";
import type { MatchPrefillData } from "@/hooks/useBettingForm";
import { toast } from "sonner";

export type { MatchPrefillData } from "@/hooks/useBettingForm";

interface Props {
  onRecordAdded?: () => void;
  prefillData?: MatchPrefillData | null;
  onPrefillConsumed?: () => void;
  expressMatchesData?: MatchPrefillData[] | null;
  onExpressMatchesConsumed?: () => void;
}

export default function CS2BettingForm(props: Props) {
  logRender("CS2BettingForm");
  const h = useBettingForm(props);

  const isExpress = h.formData.betCategory === "Експрес";
  const odds = isExpress ? h.totalExpressOdds : Number(h.formData.odds);
  const stake = Number(h.formData.stake);
  const validAmounts =
    Number.isFinite(odds) &&
    odds > 1 &&
    Number.isFinite(stake) &&
    stake > 0 &&
    (!isExpress || h.allExpressEventsComplete);
  const money = (amount: number) =>
    new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 2 }).format(
      amount,
    ) + (h.formData.currency === "USD" ? " $" : " ₴");
  const teamNotes = (
    <RecordTeamNotes
      teams={h.formData.riskyTeams}
      selection={h.formData.selection}
    />
  );
  // ── CSS classes ──
  const css = {
    input:
      "rounded-md border-gray-200 bg-white h-11 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-0 transition-colors",
    select:
      "rounded-2xl border-gray-200 bg-white h-11 text-gray-900 focus:border-gray-900 focus:ring-0 transition-colors",
    label: "text-sm font-medium text-gray-700",
    section: "entry-section-title",
  };

  return (
    <div className="record-entry space-y-6">
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

      <div className="entry-layout">
        <div
          className={`entry-form-column space-y-6 ${h.tiltBlock.blocked ? "opacity-50 pointer-events-none select-none" : ""}`}
        >
          <form
            id="record-entry-form"
            onSubmit={h.handleSubmit}
            noValidate
            className="space-y-6"
          >
            <div
              className="entry-form-panel"
              style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
            >
              <BettingFormSettings
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
                onFieldChange={(field, value) =>
                  h.setFormData((prev) => ({ ...prev, [field]: value }))
                }
                onCategoryChange={(value) => {
                  h.setFormData((prev) => ({ ...prev, betCategory: value }));
                  if (value === "Ординар") {
                    h.clearExpressEvents();
                  }
                }}
                onGoalSelect={(goalId) => {
                  const selectedGoalId = goalId === "all" ? "" : goalId;
                  if (selectedGoalId) {
                    const lastStake = h.getLastStakeForGoal(selectedGoalId);
                    if (lastStake) {
                      h.setFormData((prev) => ({
                        ...prev,
                        goalId: selectedGoalId,
                        stake: lastStake,
                      }));
                      toast.info(
                        "Суму заповнено з останнього прогнозу цілі: " +
                          lastStake +
                          " ₴",
                      );
                      return;
                    }
                  }
                  h.setFormData((prev) => ({
                    ...prev,
                    goalId: selectedGoalId,
                  }));
                }}
              />

              {!(h.isExpressFromMatches && h.expressEvents.length > 0) && (
                <>
                  <div className="border-t border-gray-100" />
                  <div className="px-6 pb-6">
                    <BettingFormMatchSection
                      teamNotes={teamNotes}
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
                        h.setFormData((prev) => ({ ...prev, [field]: value }))
                      }
                      onParseUrl={() =>
                        h.parseMatchFromUrl(h.formData.matchUrl)
                      }
                      onUrlChange={(url) => h.handleUrlChange(url)}
                      onAddToExpress={h.addExpressEvent}
                      submitErrors={h.submitErrors}
                    />
                  </div>
                </>
              )}

              {h.isExpressFromMatches && h.expressEvents.length > 0 && (
                <div className="px-6 pb-6">{teamNotes}</div>
              )}
              {h.primaryStrategy && (
                <div className="entry-strategy-context">
                  <span>Основна стратегія</span>
                  <strong>{h.primaryStrategy.name}</strong>
                  <small>Правила перевіряються під час збереження.</small>
                </div>
              )}

              {(h.formData.betCategory === "Ординар" ||
                (h.formData.betCategory === "Експрес" &&
                  h.expressEvents.length > 0)) && (
                <div className="px-6 pb-6">
                  <BettingFormFinances
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
                    data={{
                      stake: h.formData.stake,
                      currency: h.formData.currency,
                      confidence: h.formData.confidence,
                    }}
                    isSubmitting={h.isSubmitting}
                    isBlocked={h.tiltBlock.blocked}
                    isHighConfidence={h.isHighConfidence}
                    showSection={true}
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
                  />
                </div>
              )}
            </div>

            {h.formData.betCategory === "Експрес" &&
              h.expressEvents.length > 0 && (
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
              )}
          </form>
        </div>

        <aside className="entry-summary">
          <div className="entry-summary-heading">
            <h2>Підсумок запису</h2>
            <span>{isExpress ? "Експрес" : "Ординар"}</span>
          </div>
          <p className="entry-summary-match">
            {isExpress
              ? `Подій в експресі: ${h.expressEvents.length}`
              : h.formData.team1 && h.formData.team2
                ? `${h.formData.team1} — ${h.formData.team2}`
                : "Оберіть команди матчу"}
          </p>
          <p className="entry-muted">
            {h.formData.game === "Dota2" ? "Dota 2" : "CS2"} ·{" "}
            {h.formData.format} · {h.formData.date}
          </p>
          <dl className="entry-summary-details">
            {!isExpress && (
              <>
                <dt>Ваш вибір</dt>
                <dd>{h.formData.selection || "—"}</dd>
                <dt>Тип прогнозу</dt>
                <dd>
                  {h.formData.betType
                    ? getBetTypeLabel(h.formData.betType)
                    : "—"}
                </dd>
              </>
            )}
            <dt>Коефіцієнт</dt>
            <dd>{odds > 1 && Number.isFinite(odds) ? odds.toFixed(2) : "—"}</dd>
            <dt>Сума запису</dt>
            <dd>{stake > 0 ? money(stake) : "—"}</dd>
            <dt>Ціль</dt>
            <dd>
              {h.activeGoals.find((goal) => goal.id === h.formData.goalId)
                ?.name || "Без цілі"}
            </dd>
          </dl>
          <div className="entry-payout">
            <span>У разі виграшу</span>
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
          {h.formData.riskyTeams.length > 0 && (
            <a className="entry-notes-reminder" href="#record-team-notes">
              Перевірте примітки до команд · {h.formData.riskyTeams.length} →
            </a>
          )}
          <Button
            type="submit"
            form="record-entry-form"
            id="submit-btn"
            disabled={
              h.isSubmitting ||
              h.tiltBlock.blocked ||
              (isExpress &&
                (!h.allExpressEventsComplete || h.expressEvents.length === 0))
            }
            className="entry-save"
          >
            <Plus size={18} />
            {h.isSubmitting ? "Збереження…" : "Зберегти запис"}
          </Button>
          <p className="entry-summary-footnote">
            Запис збережеться в журналі зі статусом «Очікує результату». Це не
            розміщення ставки.
          </p>
        </aside>
      </div>
    </div>
  );
}
