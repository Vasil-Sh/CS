import { logRender } from "@/lib/devLogger";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import StrategyViolationDialog from "./StrategyViolationDialog";
import { BettingSidebar } from "./BettingSidebar";
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

  return (
    <div className="space-y-6">
      <StrategyViolationDialog
        open={h.showViolationDialog}
        onOpenChange={h.setShowViolationDialog}
        strategyName={h.primaryStrategy?.name || ""}
        violations={h.strategyViolations}
        onConfirm={h.handleViolationConfirm}
        onCancel={h.handleViolationCancel}
      />

      <BettingFormAlerts
        tiltBlock={h.tiltBlock}
        primaryStrategy={h.primaryStrategy}
        strategyViolations={h.strategyViolations}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div
          className={`lg:col-span-2 space-y-6 ${h.tiltBlock.blocked ? "opacity-50 pointer-events-none select-none" : ""}`}
        >
          <form onSubmit={h.handleSubmit} noValidate className="space-y-6">
            <div
              className="bg-white border border-gray-300 rounded-3xl overflow-hidden"
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
                  input: h.css.input,
                  selectTrigger: h.css.select,
                  label: h.css.label,
                  sectionTitle: h.css.section,
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
                        input: h.css.input,
                        selectTrigger: h.css.select,
                        label: h.css.label,
                        sectionTitle: h.css.section,
                      }}
                      onFieldChange={(field, value) =>
                        h.setFormData((prev) => ({ ...prev, [field]: value }))
                      }
                      onParseUrl={() => {
                        h.handleUrlChange(h.formData.matchUrl);
                      }}
                      onUrlChange={(url) => h.handleUrlChange(url)}
                      onAddToExpress={h.addExpressEvent}
                      submitErrors={h.submitErrors}
                    />
                  </div>
                </>
              )}

              {(h.formData.betCategory === "Ординар" ||
                (h.formData.betCategory === "Експрес" &&
                  h.expressEvents.length > 0)) && (
                <div className="px-6 pb-6">
                  <BettingFormFinances
                    data={{
                      stake: h.formData.stake,
                      currency: h.formData.currency,
                      confidence: h.formData.confidence,
                    }}
                    isSubmitting={h.isSubmitting}
                    isBlocked={h.tiltBlock.blocked}
                    isHighConfidence={h.isHighConfidence}
                    showSection={true}
                    format={h.formData.format}
                    classes={{
                      input: h.css.input,
                      label: h.css.label,
                      sectionTitle: h.css.section,
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

            {(h.formData.betCategory === "Ординар" ||
              (h.formData.betCategory === "Експрес" &&
                h.expressEvents.length > 0)) && (
              <Button
                type="submit"
                id="submit-btn"
                disabled={
                  h.isSubmitting ||
                  h.tiltBlock.blocked ||
                  (h.formData.betCategory === "Експрес" &&
                    !h.allExpressEventsComplete)
                }
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-medium py-7 text-base transition-all disabled:opacity-50"
              >
                {h.isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Додавання...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" strokeWidth={1.5} />
                    Додати запис
                  </>
                )}
              </Button>
            )}
          </form>
        </div>

        <BettingSidebar
          stake={h.formData.stake}
          odds={h.formData.odds}
          confidence={h.formData.confidence}
          betCategory={h.formData.betCategory}
          currency={h.formData.currency}
          totalExpressOdds={h.totalExpressOdds}
          expressEventsCount={h.expressEvents.length}
          potentialProfit={h.potentialProfit}
          potentialProfitInCurrency={h.potentialProfit}
          expectedValue={h.expectedValue}
          evVerdict={h.evVerdict}
          isValuePositive={h.isValuePositive}
          valueBetAnalysis={h.valueBetAnalysis}
          kellyData={h.kellyData}
          overconfidenceWarning={h.overconfidenceWarning}
          hasConfidence={h.hasConfidence}
          isHighConfidence={h.isHighConfidence}
          riskyTeams={h.formData.riskyTeams}
          maxStakePercent={h.maxStakePercent}
          onMaxStakePercentChange={h.setMaxStakePercent}
          onApplyKellyAmount={h.applyKellyAmount}
          onRemoveRiskyTeam={h.removeRiskyTeam}
        />
      </div>
    </div>
  );
}
