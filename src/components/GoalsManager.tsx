import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import CompletedGoalResultModal from "@/components/CompletedGoalResultModal";
import { CARD_BASE_STYLE, CARD_HOVER_STYLE } from "@/lib/cardStyles";
import { logRender } from "@/lib/devLogger";
import GoalsToolbar from "./betting-form/GoalsToolbar";
import GoalsEmptyState from "@/components/goals/GoalsEmptyState";
import DeleteGoalDialog from "@/components/goals/DeleteGoalDialog";
import {
  Target, TrendingUp, Plus, Trash2, CheckCircle, Trophy, DollarSign, Percent,
  Info, Eye, Star, ChevronDown, ChevronUp, ArrowRight, BarChart3, Zap,
} from "lucide-react";
import {
  useGoals, getGoalProgress, getGoalTypeLabel, getKeyMetric, getNextBetHint,
  calculateLadderSteps, calculateOddsScenarios, MAX_LADDER_STEPS,
  type Goal, type GoalType, type LadderMode,
} from "@/hooks/useGoals";

const cardBaseStyle = CARD_BASE_STYLE;
const cardHoverStyle = CARD_HOVER_STYLE;

export default function GoalsManager() {
  logRender("GoalsManager");
  const h = useGoals();

  const tabs = [
    { id: "active", label: "Активні цілі", icon: Target },
    { id: "completed", label: "Завершені", icon: Trophy },
  ];

  const getDisciplineStatus = (_goal: Goal) => {
    return { status: "good" as const, label: "Дотримані", icon: <CheckCircle className="h-4 w-4" strokeWidth={1.5} /> };
  };

  return (
    <div className="space-y-6">
      <GoalsToolbar
        activeTab={h.activeTab}
        isUpdating={h.isUpdating}
        activeGoalsCount={h.activeGoals.length}
        maxGoals={25}
        tabs={tabs as any}
        onTabChange={(id) => h.setActiveTab(id as "active" | "completed")}
        onUpdate={h.handleManualUpdate}
        onCreateGoal={() => h.setShowCreateDialog(true)}
      />

      {/* Active Tab */}
      {h.activeTab === "active" && (
        <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          {h.activeGoals.length === 0 ? (
            <GoalsEmptyState type="active" onCreateGoal={() => h.setShowCreateDialog(true)} />
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {h.activeGoals.map((goal) => {
                const progress = getGoalProgress(goal);
                const keyMetric = getKeyMetric(goal);
                const discipline = getDisciplineStatus(goal);
                const hint = getNextBetHint(goal);
                const isPrimary = goal.isPrimary;

                return (
                  <Card key={goal.id} className={`rounded-3xl bg-slate-50 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-all ${isPrimary ? "border-2 border-blue-500" : "border border-slate-200"}`}
                    style={cardBaseStyle}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardBaseStyle)}
                  >
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={`p-2 rounded-2xl flex-shrink-0 ${goal.type === "ladder" ? "bg-violet-100" : goal.type === "amount" ? "bg-blue-100" : goal.type === "roi" ? "bg-[#D1FAE5]" : "bg-yellow-100"}`}>
                            {goal.type === "amount" ? <DollarSign className="h-5 w-5" strokeWidth={1.5} /> : goal.type === "ladder" ? <TrendingUp className="h-5 w-5" strokeWidth={1.5} /> : goal.type === "roi" ? <Percent className="h-5 w-5" strokeWidth={1.5} /> : <Target className="h-5 w-5" strokeWidth={1.5} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 text-base leading-tight">{goal.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge className="bg-gray-100 text-gray-700 border-0 rounded-xl text-xs px-2 py-0 font-medium">{getGoalTypeLabel(goal.type)}</Badge>
                              {isPrimary && <Badge className="bg-blue-50 text-blue-500 border-0 rounded-xl text-xs px-1.5 py-0 font-medium"><Star className="h-3 w-3 fill-blue-500" strokeWidth={1.5} /><span className="ml-0.5">Основна</span></Badge>}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200 mb-3">
                        <p className="text-sm text-gray-500 leading-tight">{keyMetric.label}</p>
                        <p className={`text-2xl font-bold tracking-tight leading-tight ${keyMetric.color}`}>{keyMetric.value}</p>
                      </div>

                      {hint && (
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-2xl mb-3">
                          <Zap className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" strokeWidth={1.5} />
                          <p className="text-sm text-amber-800 font-medium">{hint}</p>
                        </div>
                      )}

                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm text-gray-500">Прогрес</span>
                          <span className="text-sm font-semibold text-gray-900">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.min(progress, 100)} className="h-2 rounded-xl" />
                      </div>

                      <Collapsible open={h.containerStates.isRulesExpanded[goal.id] || false} onOpenChange={(open) => h.containerStates.setIsRulesExpanded({ ...h.containerStates.isRulesExpanded, [goal.id]: open })}>
                        <CollapsibleTrigger className="w-full">
                          <div className={`px-3 py-2 rounded-2xl border transition-all ${discipline.status === "good" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-gray-900">Правила</span>
                                <div className={discipline.status === "good" ? "text-green-500" : "text-red-500"}>{discipline.icon}</div>
                                <span className={`text-xs font-medium ${discipline.status === "good" ? "text-green-600" : "text-red-600"}`}>{discipline.label}</span>
                              </div>
                              {h.containerStates.isRulesExpanded[goal.id] ? <ChevronUp className="h-3.5 w-3.5 text-gray-500" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-500" />}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className={`mt-1.5 px-3 py-2 rounded-2xl border text-sm ${discipline.status === "good" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                            {goal.type === "ladder" && (
                              <div className="space-y-1">
                                <div><span className="text-gray-500">Коеф.: </span><span className="font-medium text-gray-900">{goal.minOdds} – {goal.maxOdds}</span></div>
                                <div><span className="text-gray-500">Банк: </span><span className="font-medium text-gray-900">{(goal.currentBank || 0).toFixed(0)} грн</span></div>
                              </div>
                            )}
                            <div><span className="text-gray-500">Ставок/день: </span><span className="font-medium text-gray-900">{goal.betsPerDay || "Без обмежень"}</span></div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <div className="flex items-center gap-2 mt-3">
                        {goal.type === "ladder" && (
                          <Button onClick={() => h.openDetailsDialog(goal)} className="flex-1 rounded-xl bg-primary hover:bg-blue-700 text-white font-semibold h-10">
                            <Eye className="h-4 w-4 mr-1" strokeWidth={1.5} /> Деталі
                          </Button>
                        )}
                        <Button onClick={() => h.setPrimaryGoal(goal.id)} variant="outline" className={`flex-1 rounded-xl font-medium h-10 transition-all ${isPrimary ? "border-amber-500 text-amber-500 bg-amber-50 hover:bg-amber-500 hover:text-white" : "border-gray-200 text-gray-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50"}`}>
                          <Star className={`h-4 w-4 ${isPrimary ? "fill-amber-500" : ""}`} strokeWidth={1.5} />
                        </Button>
                        <Button onClick={() => h.confirmDeleteGoal(goal.id)} variant="outline" className="flex-1 rounded-xl border-gray-200 text-gray-400 hover:border-red-500 hover:text-red-500 hover:bg-red-50 font-medium h-10 transition-all">
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Completed Tab */}
      {h.activeTab === "completed" && (
        <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          {h.completedGoals.length === 0 ? (
            <GoalsEmptyState type="completed" onCreateGoal={() => h.setShowCreateDialog(true)} />
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {h.completedGoals.map((goal) => {
                let resultLabel = "Результат", resultValue = "";
                switch (goal.type) {
                  case "amount": resultLabel = "Досягнуто"; resultValue = `${(goal.currentAmount ?? goal.targetAmount ?? 0).toFixed(0)} грн`; break;
                  case "ladder": resultLabel = "Фінальний банк"; resultValue = `${(goal.currentBank ?? goal.targetLadderAmount ?? 0).toFixed(0)} грн`; break;
                  case "roi": resultLabel = "ROI"; resultValue = `${(goal.currentROI ?? goal.targetROI ?? 0).toFixed(1)}%`; break;
                  case "winrate": resultLabel = "Win Rate"; resultValue = `${(goal.currentWinRate ?? goal.targetWinRate ?? 0).toFixed(1)}%`; break;
                }
                const createdMs = new Date(goal.createdAt).getTime();
                const completedMs = goal.completedAt ? new Date(goal.completedAt).getTime() : createdMs;
                const durationDays = Math.max(1, Math.round((completedMs - createdMs) / (1000 * 60 * 60 * 24)));
                const ladderStepsDone = goal.type === "ladder" ? (goal.currentStep ?? goal.steps?.filter((s) => s.status === "completed").length ?? 0) : 0;

                return (
                  <Card key={goal.id} className="border border-green-200 rounded-3xl bg-slate-50 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-all"
                    style={cardBaseStyle} onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)} onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardBaseStyle)}>
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="p-2 bg-green-50 rounded-2xl flex-shrink-0"><Trophy className="h-5 w-5 text-green-500" strokeWidth={1.5} /></div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 text-base leading-tight truncate" title={goal.name}>{goal.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5"><Badge className="bg-gray-100 text-gray-700 border-0 rounded-xl text-xs px-2 py-0 font-medium">{getGoalTypeLabel(goal.type)}</Badge></div>
                          </div>
                        </div>
                        <Badge className="bg-green-500 text-white border-0 rounded-xl text-xs px-2.5 py-0.5 font-medium flex-shrink-0"><CheckCircle className="h-3 w-3 mr-1" strokeWidth={1.5} />Завершено</Badge>
                      </div>

                      <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200 mb-3">
                        <p className="text-sm text-gray-500 leading-tight">{resultLabel}</p>
                        <p className="text-2xl font-bold tracking-tight leading-tight text-green-500">{resultValue}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-white rounded-2xl px-3 py-2 border border-gray-200"><p className="text-xs text-gray-500 leading-tight">Завершено</p><p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">{goal.completedAt ? new Date(goal.completedAt).toLocaleDateString("uk-UA") : "—"}</p></div>
                        <div className="bg-white rounded-2xl px-3 py-2 border border-gray-200"><p className="text-xs text-gray-500 leading-tight">Тривалість</p><p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">{durationDays} {durationDays === 1 ? "день" : durationDays < 5 ? "дні" : "днів"}</p></div>
                        {goal.type === "ladder" && (<><div className="bg-white rounded-2xl px-3 py-2 border border-gray-200"><p className="text-xs text-gray-500 leading-tight">Кроків пройдено</p><p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">{ladderStepsDone}</p></div><div className="bg-white rounded-2xl px-3 py-2 border border-gray-200"><p className="text-xs text-gray-500 leading-tight">Старт</p><p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">{(goal.startAmount ?? 0).toFixed(0)} грн</p></div></>)}
                        {goal.type === "amount" && <div className="bg-white rounded-2xl px-3 py-2 border border-gray-200 col-span-2"><p className="text-xs text-gray-500 leading-tight">Ціль</p><p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">{(goal.targetAmount ?? 0).toFixed(0)} грн</p></div>}
                        {goal.type === "roi" && <div className="bg-white rounded-2xl px-3 py-2 border border-gray-200 col-span-2"><p className="text-xs text-gray-500 leading-tight">Цільовий ROI</p><p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">{(goal.targetROI ?? 0).toFixed(1)}%</p></div>}
                        {goal.type === "winrate" && <div className="bg-white rounded-2xl px-3 py-2 border border-gray-200 col-span-2"><p className="text-xs text-gray-500 leading-tight">Цільовий Win Rate</p><p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">{(goal.targetWinRate ?? 0).toFixed(1)}%</p></div>}
                      </div>

                      <div className="flex items-center gap-2 mt-auto">
                        <Button onClick={() => h.openCompletedGoalResult(goal)} className="flex-1 rounded-xl bg-primary hover:bg-blue-700 text-white font-semibold h-10"><Eye className="h-4 w-4 mr-1" strokeWidth={1.5} /> Деталі</Button>
                        <Button onClick={() => h.confirmDeleteGoal(goal.id)} variant="outline" className="flex-1 rounded-xl border-gray-200 text-gray-400 hover:border-red-500 hover:text-red-500 hover:bg-red-50 font-medium h-10 transition-all"><Trash2 className="h-4 w-4" strokeWidth={1.5} /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Goal Dialog */}
      <Dialog open={h.showCreateDialog} onOpenChange={(open) => { h.setShowCreateDialog(open); if (!open) { h.setNewGoal({ name: "", type: "amount", targetAmount: 100000, startAmount: 100, targetLadderAmount: 100000, minOdds: 1.3, maxOdds: 5, ladderMode: "soft", targetROI: 50, targetWinRate: 65, betsPerDay: 5 }); h.setMinOddsStr("1.3"); h.setMaxOddsStr("5"); h.setStartAmountStr("100"); h.setTargetLadderAmountStr("100000"); h.setTargetAmountStr("100000"); h.setTargetROIStr("50"); h.setTargetWinRateStr("65"); h.setBetsPerDayStr("5"); } }}>
        <DialogContent className="rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 p-0 gap-0">
          <DialogHeader className="pt-4 pb-3 px-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-2xl"><Plus className="h-5 w-5 text-primary" strokeWidth={1.5} /></div>
              <div><DialogTitle className="text-xl font-semibold text-gray-900">Створити нову ціль</DialogTitle><DialogDescription className="text-base text-gray-500 mt-0.5">Оберіть тип цілі та встановіть параметри</DialogDescription></div>
            </div>
          </DialogHeader>
          <div className="border-t border-gray-200" />
          <div className="space-y-4 pt-4 pb-4 px-6 bg-gray-100">
            <div><Label htmlFor="goalName" className="text-base font-medium text-gray-900">Назва цілі <span className="text-red-500">*</span></Label><Input id="goalName" value={h.newGoal.name} onChange={(e) => h.setNewGoal({ ...h.newGoal, name: e.target.value })} placeholder="Наприклад: Досягти 100,000 грн" className="rounded-2xl border border-gray-200 focus:border-primary mt-1.5 h-11 text-base" /></div>
            <div><Label htmlFor="goalType" className="text-base font-medium text-gray-900">Тип цілі <span className="text-red-500">*</span></Label><Select value={h.newGoal.type} onValueChange={(v: GoalType) => h.setNewGoal({ ...h.newGoal, type: v })}><SelectTrigger className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="amount">💰 Досягти суми</SelectItem><SelectItem value="ladder">📈 Лесенка (прогресія)</SelectItem><SelectItem value="roi">📊 Досягти ROI</SelectItem><SelectItem value="winrate">🎯 Досягти Win Rate</SelectItem></SelectContent></Select></div>

            {h.newGoal.type === "amount" && <div><Label htmlFor="targetAmount" className="text-base font-medium text-gray-900">Цільова сума (грн) <span className="text-red-500">*</span></Label><Input id="targetAmount" type="number" min="1" value={h.targetAmountStr} onChange={(e) => { h.setTargetAmountStr(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v)) h.setNewGoal({ ...h.newGoal, targetAmount: v }); }} className="rounded-2xl border border-gray-200 focus:border-primary mt-1.5 h-11 text-base" /></div>}

            {h.newGoal.type === "ladder" && (<>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-base font-medium text-gray-900">Початкова сума <span className="text-red-500">*</span></Label><Input type="number" min="1" value={h.startAmountStr} onChange={(e) => { h.setStartAmountStr(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v)) h.setNewGoal({ ...h.newGoal, startAmount: v }); }} className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base" /></div>
                <div><Label className="text-base font-medium text-gray-900">Цільова сума <span className="text-red-500">*</span></Label><Input type="number" min="1" value={h.targetLadderAmountStr} onChange={(e) => { h.setTargetLadderAmountStr(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v)) h.setNewGoal({ ...h.newGoal, targetLadderAmount: v }); }} className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-base font-medium text-gray-900">Мін. коефіцієнт <span className="text-red-500">*</span></Label><Input type="number" min="1.01" step="0.01" value={h.minOddsStr} onChange={(e) => { h.setMinOddsStr(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v)) h.setNewGoal({ ...h.newGoal, minOdds: v }); }} className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base" /></div>
                <div><Label className="text-base font-medium text-gray-900">Макс. коефіцієнт <span className="text-red-500">*</span></Label><Input type="number" min="1.01" step="0.01" value={h.maxOddsStr} onChange={(e) => { h.setMaxOddsStr(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v)) h.setNewGoal({ ...h.newGoal, maxOdds: v }); }} className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base" /></div>
              </div>
              <div><Label className="text-base font-medium text-gray-900">Режим при програші <span className="text-red-500">*</span></Label><Select value={h.newGoal.ladderMode} onValueChange={(v: LadderMode) => h.setNewGoal({ ...h.newGoal, ladderMode: v })}><SelectTrigger className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="soft">М'який — продовжити з поточної</SelectItem><SelectItem value="strict">Жорсткий — почати заново</SelectItem></SelectContent></Select></div>
              {h.isLadderPreviewValid() && <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200"><p className="text-base font-medium text-gray-900">Кроків: {calculateLadderSteps(parseFloat(h.startAmountStr) || 0, parseFloat(h.targetLadderAmountStr) || 0, parseFloat(h.minOddsStr) || 0, parseFloat(h.maxOddsStr) || 0).length}</p><p className="text-sm text-gray-400 mt-0.5">💡 Коефіцієнт {h.minOddsStr} – {h.maxOddsStr}</p></div>}
            </>)}

            {h.newGoal.type === "roi" && <div><Label className="text-base font-medium text-gray-900">Цільовий ROI (%) <span className="text-red-500">*</span></Label><Input type="number" min="0" max="1000" value={h.targetROIStr} onChange={(e) => { h.setTargetROIStr(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v)) h.setNewGoal({ ...h.newGoal, targetROI: v }); }} className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base" /></div>}
            {h.newGoal.type === "winrate" && <div><Label className="text-base font-medium text-gray-900">Цільовий Win Rate (%) <span className="text-red-500">*</span></Label><Input type="number" min="0" max="100" value={h.targetWinRateStr} onChange={(e) => { h.setTargetWinRateStr(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v)) h.setNewGoal({ ...h.newGoal, targetWinRate: v }); }} className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base" /></div>}

            <div className="pt-3 border-t border-gray-200"><h4 className="text-base font-medium text-gray-900 mb-2">Правила цілі</h4><div><Label className="text-base font-medium text-gray-900">Ставок на день (0 = без обмежень)</Label><Input type="number" min="0" value={h.betsPerDayStr} onChange={(e) => { h.setBetsPerDayStr(e.target.value); const v = parseInt(e.target.value, 10); if (!isNaN(v)) h.setNewGoal({ ...h.newGoal, betsPerDay: v }); }} className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base" /></div></div>
          </div>
          <div className="border-t border-gray-200" />
          <DialogFooter className="gap-2 pt-3 pb-4 px-6">
            <Button variant="outline" onClick={() => h.setShowCreateDialog(false)} className="rounded-3xl border border-gray-200 hover:bg-gray-50 font-medium h-11 px-5 text-base">Скасувати</Button>
            <Button onClick={h.createGoal} className="rounded-3xl bg-primary hover:bg-blue-400 text-white font-medium h-11 px-5 text-base shadow-[0_4px_16px_rgba(68,122,252,0.3)]"><Plus className="h-4 w-4 mr-2" strokeWidth={1.5} /> Створити</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteGoalDialog open={h.showDeleteDialog} onOpenChange={h.setShowDeleteDialog} goalName={h.goals.find((g) => g.id === h.goalToDelete)?.name || ""} onDelete={h.deleteGoal} />

      {/* Details Dialog — ladder */}
      <Dialog open={h.showDetailsDialog} onOpenChange={h.setShowDetailsDialog}>
        <DialogContent className="rounded-3xl max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 p-0 gap-0" style={{ boxShadow: "0 25px 50px rgba(0,0,0,0.15), 0 12px 24px rgba(0,0,0,0.1)" }}>
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-2xl flex-shrink-0"><TrendingUp className="h-6 w-6 text-primary" strokeWidth={1.5} /></div>
              <div><h1 className="text-2xl font-bold text-gray-900">{h.selectedGoal?.name}</h1><p className="text-base text-gray-500">Детальна інформація про прогрес</p></div>
            </div>
          </div>

          {h.selectedGoal && (
            <div className="space-y-5 px-6 pb-6 pt-5 bg-gray-100">
              <div className="grid grid-cols-3 gap-6">
                <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200" style={cardBaseStyle} onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)} onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardBaseStyle)}><p className="text-sm text-gray-500 uppercase tracking-wider mb-1.5">Тип</p><Badge className="bg-gray-100 text-gray-700 border-0 rounded-xl px-3 py-1 font-semibold text-lg">{getGoalTypeLabel(h.selectedGoal.type)}</Badge></div>
                <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200" style={cardBaseStyle} onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)} onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardBaseStyle)}><p className="text-sm text-gray-500 uppercase tracking-wider mb-1.5">Створено</p><p className="text-lg font-semibold text-gray-900">{new Date(h.selectedGoal.createdAt).toLocaleDateString("uk-UA")}</p></div>
                <div className="p-5 bg-gray-50 rounded-3xl border border-gray-200" style={cardBaseStyle} onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)} onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardBaseStyle)}><p className="text-sm text-gray-500 uppercase tracking-wider mb-1.5">Прогрес</p><p className="text-lg font-semibold text-gray-900">{getGoalProgress(h.selectedGoal).toFixed(1)}%</p></div>
              </div>

              {h.selectedGoal.type === "ladder" && h.selectedGoal.steps && h.selectedGoal.steps.length > 0 && (
                <div className="space-y-4">
                  <Collapsible open={h.containerStates.isLadderOverviewExpanded} onOpenChange={h.containerStates.setIsLadderOverviewExpanded}>
                    <Card className="border border-gray-200 rounded-3xl bg-white" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                      <CollapsibleTrigger className="w-full"><div className="px-6 py-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-blue-50 rounded-xl"><TrendingUp className="h-5 w-5 text-primary" strokeWidth={1.5} /></div><h3 className="text-lg font-semibold text-gray-900">Огляд лесенки</h3></div>{h.containerStates.isLadderOverviewExpanded ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}</div></CollapsibleTrigger>
                      <CollapsibleContent><div className="px-6 pb-5 grid grid-cols-2 gap-4"><div className="p-5 bg-gray-50 rounded-3xl border border-gray-200"><p className="text-sm text-gray-500 mb-1">Початкова сума</p><p className="text-2xl font-bold text-gray-900">{h.selectedGoal.startAmount?.toFixed(0)} грн</p></div><div className="p-5 bg-gray-50 rounded-3xl border border-gray-200"><p className="text-sm text-gray-500 mb-1">Цільова сума</p><p className="text-2xl font-bold text-gray-900">{h.selectedGoal.targetLadderAmount?.toFixed(0)} грн</p></div><div className="p-5 bg-gray-50 rounded-3xl border border-gray-200"><p className="text-sm text-gray-500 mb-1">Коефіцієнти</p><p className="text-xl font-bold text-gray-900">{h.selectedGoal.minOdds} – {h.selectedGoal.maxOdds}</p></div><div className="p-5 bg-green-50 rounded-3xl border border-green-200"><p className="text-sm text-gray-500 mb-1">Поточний банк</p><p className="text-2xl font-bold text-green-500">{h.selectedGoal.currentBank?.toFixed(0)} грн</p></div></div></CollapsibleContent>
                    </Card>
                  </Collapsible>

                  <Collapsible open={h.containerStates.isStepsCalculationExpanded} onOpenChange={h.containerStates.setIsStepsCalculationExpanded}>
                    <Card className="border border-gray-200 rounded-3xl bg-white" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                      <CollapsibleTrigger className="w-full"><div className="px-6 py-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-blue-50 rounded-xl"><Info className="h-5 w-5 text-primary" strokeWidth={1.5} /></div><div className="text-left"><p className="text-lg font-semibold text-gray-900">Сценарії кроків</p><p className="text-sm text-gray-500">При різних коефіцієнтах</p></div></div>{h.containerStates.isStepsCalculationExpanded ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}</div></CollapsibleTrigger>
                      <CollapsibleContent><div className="px-6 pb-5 space-y-3">{calculateOddsScenarios(h.selectedGoal.startAmount || 100, h.selectedGoal.targetLadderAmount || 100000, h.selectedGoal.minOdds || 1.3, h.selectedGoal.maxOdds || 5).map((sc, i) => (<div key={i} className="p-4 bg-gray-50 rounded-3xl border border-gray-200"><div className="flex items-center justify-between mb-1"><div className="flex items-center gap-3"><span className="text-2xl">{sc.emoji}</span><div><p className="text-base font-semibold text-gray-900">{sc.speed}</p><p className="text-sm text-gray-500">{sc.description}</p></div></div><Badge className="bg-gray-100 text-gray-900 border-0 rounded-xl px-3 py-1 font-semibold text-lg">{sc.steps} кроків</Badge></div><div className="flex items-center gap-2 text-base text-gray-500 mt-1"><span>Коефіцієнт:</span><span className="font-semibold text-gray-900">{sc.odds}</span></div></div>))}</div></CollapsibleContent>
                    </Card>
                  </Collapsible>

                  <Collapsible open={h.containerStates.isStepsProgressionExpanded} onOpenChange={h.containerStates.setIsStepsProgressionExpanded}>
                    <Card className="border border-gray-200 rounded-3xl bg-white" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                      <CollapsibleTrigger className="w-full"><div className="px-6 py-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-blue-50 rounded-xl"><BarChart3 className="h-5 w-5 text-primary" strokeWidth={1.5} /></div><h3 className="text-lg font-semibold text-gray-900">Кроки прогресії</h3></div>{h.containerStates.isStepsProgressionExpanded ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}</div></CollapsibleTrigger>
                      <CollapsibleContent><div className="px-6 pb-5"><div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">{h.selectedGoal.steps.map((step, index) => (<div key={index} className={`relative p-5 rounded-3xl border transition-all ${step.status === "completed" ? "bg-green-50 border-green-200" : step.status === "current" ? "bg-amber-50 border-amber-200 shadow-sm" : "bg-gray-50 border-gray-200"}`}><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base ${step.status === "completed" ? "bg-green-500 text-white" : step.status === "current" ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-500"}`}>{step.step}</div><div><p className="font-semibold text-gray-900 text-lg">Крок {step.step}</p><p className="text-sm text-gray-500">{step.status === "completed" ? "Завершено" : step.status === "current" ? "Поточний" : "Заблоковано"}</p></div></div><Badge className={`${step.status === "completed" ? "bg-green-50 text-green-600 border border-green-200" : step.status === "current" ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-gray-100 text-gray-500 border border-gray-200"} rounded-xl px-3 py-1 font-medium text-sm`}>{step.status === "completed" ? "✓ Виконано" : step.status === "current" ? "→ Активний" : "🔒 Очікує"}</Badge></div><div className="grid grid-cols-2 gap-3"><div className="p-3 bg-white rounded-2xl border border-gray-200"><p className="text-sm text-gray-500">Ставка</p><p className="text-lg font-bold text-gray-900">{step.startAmount.toFixed(0)} грн</p></div><div className="p-3 bg-white rounded-2xl border border-gray-200"><p className="text-sm text-gray-500">Діапазон</p><p className="text-base font-semibold text-gray-900">{step.minPlannedAmount?.toFixed(0)} – {step.maxPlannedAmount?.toFixed(0)} грн</p></div>{step.actualAmount && (<><div className="p-3 bg-green-50 rounded-2xl border border-green-200"><p className="text-sm text-gray-500">Факт</p><p className="text-lg font-bold text-green-500">{step.actualAmount.toFixed(0)} грн</p></div><div className="p-3 bg-green-50 rounded-2xl border border-green-200"><p className="text-sm text-gray-500">Коеф.</p><p className="text-lg font-bold text-green-500">{step.actualOdds?.toFixed(2)}</p></div></>)}</div>{step.deviation !== undefined && step.deviation > 0 && <div className="mt-3 p-2.5 bg-green-50 rounded-2xl border border-green-200 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500" strokeWidth={1.5} /><p className="text-sm font-medium text-green-600">+{step.deviation.toFixed(0)} грн більше мінімуму</p></div>}{step.completedAt && <div className="mt-3 pt-3 border-t border-gray-200"><p className="text-sm text-gray-500">Завершено: {new Date(step.completedAt).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}</p></div>}{step.status === "completed" && index < h.selectedGoal.steps.length - 1 && <div className="absolute -bottom-3.5 left-1/2 transform -translate-x-1/2 z-10"><div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-md"><ArrowRight className="h-3.5 w-3.5 text-white rotate-90" strokeWidth={2} /></div></div>}</div>))}</div></div></CollapsibleContent>
                    </Card>
                  </Collapsible>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-4 px-6 pb-6 border-t border-gray-200"><Button onClick={() => h.setShowDetailsDialog(false)} className="rounded-3xl bg-primary hover:bg-blue-400 text-white font-medium h-11 px-6 text-base shadow-[0_4px_16px_rgba(68,122,252,0.3)]">Закрити</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completed Goal Result Modal */}
      <CompletedGoalResultModal goal={h.selectedGoal} isOpen={h.showCompletedResultModal} onClose={() => { h.setShowCompletedResultModal(false); h.setSelectedGoal(null); }} />
    </div>
  );
}
