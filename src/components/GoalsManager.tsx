import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import CompletedGoalResultModal from "@/components/CompletedGoalResultModal";
import { CARD_BASE_STYLE, CARD_HOVER_STYLE } from "@/lib/cardStyles";
import { logRender } from "@/lib/devLogger";
import GoalsToolbar from "./betting-form/GoalsToolbar";
import GoalsFocus from "@/components/goals/GoalsFocus";
import GoalTypeSelector from "@/components/goals/GoalTypeSelector";
import LadderDetailsDialog from "@/components/goals/LadderDetailsDialog";
import GoalsEmptyState from "@/components/goals/GoalsEmptyState";
import DeleteGoalDialog from "@/components/goals/DeleteGoalDialog";
import {
  Target,
  TrendingUp,
  Trash2,
  CheckCircle,
  Trophy,
  DollarSign,
  Percent,
  Info,
  Eye,
  Star,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import {
  useGoals,
  getGoalProgress,
  getGoalTypeLabel,
  getKeyMetric,
  getNextBetHint,
  calculateLadderSteps,
  type LadderMode,
} from "@/hooks/useGoals";

const cardBaseStyle = CARD_BASE_STYLE;
const cardHoverStyle = CARD_HOVER_STYLE;

interface GoalsManagerProps {
  focusLayout?: boolean;
  topTabs?: {
    id: string;
    label: string;
    icon: import("lucide-react").LucideIcon;
  }[];
  topActiveTab?: string;
  onTopTabChange?: (id: string) => void;
}

export default function GoalsManager({
  focusLayout = false,
  topTabs,
  topActiveTab,
  onTopTabChange,
}: GoalsManagerProps) {
  logRender("GoalsManager");
  const h = useGoals();

  const tabs = [
    { id: "active", label: "Активні цілі", icon: Target },
    { id: "completed", label: "Завершені", icon: Trophy },
  ];

  return (
    <div className="space-y-6">
      {focusLayout ? <GoalsFocus h={h} /> : <GoalsToolbar
        activeTab={h.activeTab}
        isUpdating={h.isUpdating}
        activeGoalsCount={h.activeGoals.length}
        maxGoals={25}
        tabs={tabs}
        onTabChange={(id) => h.setActiveTab(id as "active" | "completed")}
        onUpdate={h.handleManualUpdate}
        onCreateGoal={() => h.setShowCreateDialog(true)}
        topTabs={topTabs}
        topActiveTab={topActiveTab}
        onTopTabChange={onTopTabChange}
      />}

      {/* Active Tab */}
      {!focusLayout && h.activeTab === "active" && (
        <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          {h.activeGoals.length === 0 ? (
            <GoalsEmptyState
              type="active"
              onCreateGoal={() => h.setShowCreateDialog(true)}
            />
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {h.activeGoals.map((goal) => {
                const progress = getGoalProgress(goal);
                const keyMetric = getKeyMetric(goal);
                const discipline = h.getDisciplineStatus(goal);
                const hint = getNextBetHint(goal);
                const isPrimary = goal.isPrimary;

                return (
                  <Card
                    key={goal.id}
                    className={`rounded-3xl bg-slate-50 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-all ${isPrimary ? "border-2 border-blue-500" : "border border-slate-200"}`}
                    style={cardBaseStyle}
                    onMouseEnter={(e) =>
                      Object.assign(e.currentTarget.style, cardHoverStyle)
                    }
                    onMouseLeave={(e) =>
                      Object.assign(e.currentTarget.style, cardBaseStyle)
                    }
                  >
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={`p-2 rounded-2xl flex-shrink-0 ${goal.type === "ladder" ? "bg-violet-100" : goal.type === "amount" ? "bg-blue-100" : goal.type === "roi" ? "bg-[#D1FAE5]" : "bg-yellow-100"}`}
                          >
                            {goal.type === "amount" ? (
                              <DollarSign
                                className="h-5 w-5"
                                strokeWidth={1.5}
                              />
                            ) : goal.type === "ladder" ? (
                              <TrendingUp
                                className="h-5 w-5"
                                strokeWidth={1.5}
                              />
                            ) : goal.type === "roi" ? (
                              <Percent className="h-5 w-5" strokeWidth={1.5} />
                            ) : (
                              <Target className="h-5 w-5" strokeWidth={1.5} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 text-base leading-tight">
                              {goal.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge className="bg-gray-100 text-gray-700 border-0 rounded-xl text-xs px-2 py-0 font-medium">
                                {getGoalTypeLabel(goal.type)}
                              </Badge>
                              {isPrimary && (
                                <Badge className="bg-blue-50 text-blue-500 border-0 rounded-xl text-xs px-1.5 py-0 font-medium">
                                  <Star
                                    className="h-3 w-3 fill-blue-500"
                                    strokeWidth={1.5}
                                  />
                                  <span className="ml-0.5">Основна</span>
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200 mb-3">
                        <p className="text-sm text-gray-500 leading-tight">
                          {keyMetric.label}
                        </p>
                        <p
                          className={`text-2xl font-bold tracking-tight leading-tight ${keyMetric.color}`}
                        >
                          {keyMetric.value}
                        </p>
                      </div>

                      {hint && (
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-2xl mb-3">
                          <Zap
                            className="h-3.5 w-3.5 text-amber-500 flex-shrink-0"
                            strokeWidth={1.5}
                          />
                          <p className="text-sm text-amber-800 font-medium">
                            {hint}
                          </p>
                        </div>
                      )}

                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm text-gray-500">Прогрес</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min(progress, 100)}
                          className="h-2 rounded-xl"
                        />
                      </div>

                      <Collapsible
                        open={
                          h.containerStates.isRulesExpanded[goal.id] || false
                        }
                        onOpenChange={(open) =>
                          h.containerStates.setIsRulesExpanded({
                            ...h.containerStates.isRulesExpanded,
                            [goal.id]: open,
                          })
                        }
                      >
                        <CollapsibleTrigger className="w-full">
                          <div
                            className={`px-3 py-2 rounded-2xl border transition-all ${discipline.status === "good" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-gray-900">
                                  Правила
                                </span>
                                <div
                                  className={
                                    discipline.status === "good"
                                      ? "text-green-500"
                                      : "text-red-500"
                                  }
                                >
                                  {discipline.status === "good" ? (
                                    <CheckCircle
                                      className="h-4 w-4"
                                      strokeWidth={1.5}
                                    />
                                  ) : (
                                    <AlertTriangle
                                      className="h-4 w-4"
                                      strokeWidth={1.5}
                                    />
                                  )}
                                </div>
                                <span
                                  className={`text-xs font-medium ${discipline.status === "good" ? "text-green-600" : "text-red-600"}`}
                                >
                                  {discipline.label}
                                </span>
                              </div>
                              {h.containerStates.isRulesExpanded[goal.id] ? (
                                <ChevronUp className="h-3.5 w-3.5 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div
                            className={`mt-1.5 px-3 py-2 rounded-2xl border text-sm ${discipline.status === "good" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                          >
                            {goal.type === "ladder" && (
                              <div className="space-y-1">
                                <div>
                                  <span className="text-gray-500">Коеф.: </span>
                                  <span className="font-medium text-gray-900">
                                    {goal.minOdds} – {goal.maxOdds}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Банк: </span>
                                  <span className="font-medium text-gray-900">
                                    {(goal.currentBank || 0).toFixed(0)} грн
                                  </span>
                                </div>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-500">
                                Ставок/день:{" "}
                              </span>
                              <span className="font-medium text-gray-900">
                                {goal.betsPerDay || "Без обмежень"}
                              </span>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <div className="flex items-center gap-2 mt-3">
                        {goal.type === "ladder" && (
                          <Button
                            onClick={() => h.openDetailsDialog(goal)}
                            className="flex-1 rounded-xl bg-primary hover:bg-blue-700 text-white font-semibold h-10"
                          >
                            <Eye className="h-4 w-4 mr-1" strokeWidth={1.5} />{" "}
                            Деталі
                          </Button>
                        )}
                        <Button
                          onClick={() => h.setPrimaryGoal(goal.id)}
                          variant="outline"
                          className={`flex-1 rounded-xl font-medium h-10 transition-all ${isPrimary ? "border-amber-500 text-amber-500 bg-amber-50 hover:bg-amber-500 hover:text-white" : "border-gray-200 text-gray-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50"}`}
                        >
                          <Star
                            className={`h-4 w-4 ${isPrimary ? "fill-amber-500" : ""}`}
                            strokeWidth={1.5}
                          />
                        </Button>
                        <Button
                          onClick={() => h.confirmDeleteGoal(goal.id)}
                          variant="outline"
                          className="flex-1 rounded-xl border-gray-200 text-gray-400 hover:border-red-500 hover:text-red-500 hover:bg-red-50 font-medium h-10 transition-all"
                        >
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
      {!focusLayout && h.activeTab === "completed" && (
        <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          {h.completedGoals.length === 0 ? (
            <GoalsEmptyState
              type="completed"
              onCreateGoal={() => h.setShowCreateDialog(true)}
            />
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {h.completedGoals.map((goal) => {
                let resultLabel = "Результат",
                  resultValue = "";
                switch (goal.type) {
                  case "amount":
                    resultLabel = "Досягнуто";
                    resultValue = `${(goal.currentAmount ?? goal.targetAmount ?? 0).toFixed(0)} грн`;
                    break;
                  case "ladder":
                    resultLabel = "Фінальний банк";
                    resultValue = `${(goal.currentBank ?? goal.targetLadderAmount ?? 0).toFixed(0)} грн`;
                    break;
                  case "roi":
                    resultLabel = "ROI";
                    resultValue = `${(goal.currentROI ?? goal.targetROI ?? 0).toFixed(1)}%`;
                    break;
                  case "winrate":
                    resultLabel = "Win Rate";
                    resultValue = `${(goal.currentWinRate ?? goal.targetWinRate ?? 0).toFixed(1)}%`;
                    break;
                }
                const createdMs = new Date(goal.createdAt).getTime();
                const completedMs = goal.completedAt
                  ? new Date(goal.completedAt).getTime()
                  : createdMs;
                const durationDays = Math.max(
                  1,
                  Math.round((completedMs - createdMs) / (1000 * 60 * 60 * 24)),
                );
                const ladderStepsDone =
                  goal.type === "ladder"
                    ? (goal.currentStep ??
                      goal.steps?.filter((s) => s.status === "completed")
                        .length ??
                      0)
                    : 0;

                return (
                  <Card
                    key={goal.id}
                    className="border border-green-200 rounded-3xl bg-slate-50 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-all"
                    style={cardBaseStyle}
                    onMouseEnter={(e) =>
                      Object.assign(e.currentTarget.style, cardHoverStyle)
                    }
                    onMouseLeave={(e) =>
                      Object.assign(e.currentTarget.style, cardBaseStyle)
                    }
                  >
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="p-2 bg-green-50 rounded-2xl flex-shrink-0">
                            <Trophy
                              className="h-5 w-5 text-green-500"
                              strokeWidth={1.5}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="font-semibold text-gray-900 text-base leading-tight truncate"
                              title={goal.name}
                            >
                              {goal.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge className="bg-gray-100 text-gray-700 border-0 rounded-xl text-xs px-2 py-0 font-medium">
                                {getGoalTypeLabel(goal.type)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-500 text-white border-0 rounded-xl text-xs px-2.5 py-0.5 font-medium flex-shrink-0">
                          <CheckCircle
                            className="h-3 w-3 mr-1"
                            strokeWidth={1.5}
                          />
                          Завершено
                        </Badge>
                      </div>

                      <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200 mb-3">
                        <p className="text-sm text-gray-500 leading-tight">
                          {resultLabel}
                        </p>
                        <p className="text-2xl font-bold tracking-tight leading-tight text-green-500">
                          {resultValue}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-white rounded-2xl px-3 py-2 border border-gray-200">
                          <p className="text-xs text-gray-500 leading-tight">
                            Завершено
                          </p>
                          <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">
                            {goal.completedAt
                              ? new Date(goal.completedAt).toLocaleDateString(
                                  "uk-UA",
                                )
                              : "—"}
                          </p>
                        </div>
                        <div className="bg-white rounded-2xl px-3 py-2 border border-gray-200">
                          <p className="text-xs text-gray-500 leading-tight">
                            Тривалість
                          </p>
                          <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">
                            {durationDays}{" "}
                            {durationDays === 1
                              ? "день"
                              : durationDays < 5
                                ? "дні"
                                : "днів"}
                          </p>
                        </div>
                        {goal.type === "ladder" && (
                          <>
                            <div className="bg-white rounded-2xl px-3 py-2 border border-gray-200">
                              <p className="text-xs text-gray-500 leading-tight">
                                Кроків пройдено
                              </p>
                              <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">
                                {ladderStepsDone}
                              </p>
                            </div>
                            <div className="bg-white rounded-2xl px-3 py-2 border border-gray-200">
                              <p className="text-xs text-gray-500 leading-tight">
                                Старт
                              </p>
                              <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">
                                {(goal.startAmount ?? 0).toFixed(0)} грн
                              </p>
                            </div>
                          </>
                        )}
                        {goal.type === "amount" && (
                          <div className="bg-white rounded-2xl px-3 py-2 border border-gray-200 col-span-2">
                            <p className="text-xs text-gray-500 leading-tight">
                              Ціль
                            </p>
                            <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">
                              {(goal.targetAmount ?? 0).toFixed(0)} грн
                            </p>
                          </div>
                        )}
                        {goal.type === "roi" && (
                          <div className="bg-white rounded-2xl px-3 py-2 border border-gray-200 col-span-2">
                            <p className="text-xs text-gray-500 leading-tight">
                              Цільовий ROI
                            </p>
                            <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">
                              {(goal.targetROI ?? 0).toFixed(1)}%
                            </p>
                          </div>
                        )}
                        {goal.type === "winrate" && (
                          <div className="bg-white rounded-2xl px-3 py-2 border border-gray-200 col-span-2">
                            <p className="text-xs text-gray-500 leading-tight">
                              Цільовий Win Rate
                            </p>
                            <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5">
                              {(goal.targetWinRate ?? 0).toFixed(1)}%
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-auto">
                        <Button
                          onClick={() => h.openCompletedGoalResult(goal)}
                          className="flex-1 rounded-xl bg-primary hover:bg-blue-700 text-white font-semibold h-10"
                        >
                          <Eye className="h-4 w-4 mr-1" strokeWidth={1.5} />{" "}
                          Деталі
                        </Button>
                        <Button
                          onClick={() => h.confirmDeleteGoal(goal.id)}
                          variant="outline"
                          className="flex-1 rounded-xl border-gray-200 text-gray-400 hover:border-red-500 hover:text-red-500 hover:bg-red-50 font-medium h-10 transition-all"
                        >
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

      {/* Create Goal Dialog */}
      <Dialog
        open={h.showCreateDialog}
        onOpenChange={(open) => {
          h.setShowCreateDialog(open);
          if (!open) {
            h.setNewGoal({
              name: "",
              type: "amount",
              targetAmount: 100000,
              startAmount: 100,
              targetLadderAmount: 100000,
              minOdds: 1.3,
              maxOdds: 5,
              ladderMode: "soft",
              targetROI: 50,
              targetWinRate: 65,
              betsPerDay: 5,
            });
            h.setMinOddsStr("1.3");
            h.setMaxOddsStr("5");
            h.setStartAmountStr("100");
            h.setTargetLadderAmountStr("100000");
            h.setTargetAmountStr("100000");
            h.setTargetROIStr("50");
            h.setTargetWinRateStr("65");
            h.setBetsPerDayStr("5");
          }
        }}
      >
        <DialogContent className="goal-create-dialog">
          <DialogHeader className="goal-create-header">
            <DialogTitle>Створити ціль</DialogTitle>
            <DialogDescription>Оберіть показник, який хочете відстежувати.</DialogDescription>
          </DialogHeader>
          <div className="goal-create-body">
            <GoalTypeSelector value={h.newGoal.type} onChange={(type) => h.setNewGoal({ ...h.newGoal, type })} />
            <div>
              <Label
                htmlFor="goalName"
                className="text-base font-medium text-gray-900"
              >
                Назва цілі <span className="text-red-500">*</span>
              </Label>
              <Input
                id="goalName"
                value={h.newGoal.name}
                onChange={(e) =>
                  h.setNewGoal({ ...h.newGoal, name: e.target.value })
                }
                placeholder="Наприклад: Досягти 100,000 грн"
                className="rounded-2xl border border-gray-200 focus:border-primary mt-1.5 h-11 text-base"
              />
            </div>

            {h.newGoal.type === "amount" && (
              <div>
                <Label
                  htmlFor="targetAmount"
                  className="text-base font-medium text-gray-900"
                >
                  Цільова сума <span className="text-red-500">*</span>
                </Label>
                <div className="goal-create-amount">
                <Input
                  id="targetAmount"
                  type="number"
                  min="1"
                  value={h.targetAmountStr}
                  onChange={(e) => {
                    h.setTargetAmountStr(e.target.value);
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v))
                      h.setNewGoal({ ...h.newGoal, targetAmount: v });
                  }}
                  className="rounded-2xl border border-gray-200 focus:border-primary mt-1.5 h-11 text-base"
                />
                <span aria-hidden="true">₴</span>
                </div>
                <p className="goal-create-help">Прогрес рахується за ставками, прив’язаними до цілі.</p>
              </div>
            )}

            {h.newGoal.type === "ladder" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-base font-medium text-gray-900">
                      Початкова сума <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={h.startAmountStr}
                      onChange={(e) => {
                        h.setStartAmountStr(e.target.value);
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v))
                          h.setNewGoal({ ...h.newGoal, startAmount: v });
                      }}
                      className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base"
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium text-gray-900">
                      Цільова сума <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={h.targetLadderAmountStr}
                      onChange={(e) => {
                        h.setTargetLadderAmountStr(e.target.value);
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v))
                          h.setNewGoal({ ...h.newGoal, targetLadderAmount: v });
                      }}
                      className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-base font-medium text-gray-900">
                      Мін. коефіцієнт <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="1.01"
                      step="0.01"
                      value={h.minOddsStr}
                      onChange={(e) => {
                        h.setMinOddsStr(e.target.value);
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v))
                          h.setNewGoal({ ...h.newGoal, minOdds: v });
                      }}
                      className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base"
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium text-gray-900">
                      Макс. коефіцієнт <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="1.01"
                      step="0.01"
                      value={h.maxOddsStr}
                      onChange={(e) => {
                        h.setMaxOddsStr(e.target.value);
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v))
                          h.setNewGoal({ ...h.newGoal, maxOdds: v });
                      }}
                      className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-base font-medium text-gray-900">
                    Режим при програші <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={h.newGoal.ladderMode}
                    onValueChange={(v: LadderMode) =>
                      h.setNewGoal({ ...h.newGoal, ladderMode: v })
                    }
                  >
                    <SelectTrigger className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soft">
                        М'який — продовжити з поточної
                      </SelectItem>
                      <SelectItem value="strict">
                        Жорсткий — почати заново
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {h.newGoal.type === "roi" && (
              <div>
                <Label className="text-base font-medium text-gray-900">
                  Цільовий ROI (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="1000"
                  value={h.targetROIStr}
                  onChange={(e) => {
                    h.setTargetROIStr(e.target.value);
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) h.setNewGoal({ ...h.newGoal, targetROI: v });
                  }}
                  className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base"
                />
              </div>
            )}
            {h.newGoal.type === "winrate" && (
              <div>
                <Label className="text-base font-medium text-gray-900">
                  Цільовий Win Rate (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={h.targetWinRateStr}
                  onChange={(e) => {
                    h.setTargetWinRateStr(e.target.value);
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v))
                      h.setNewGoal({ ...h.newGoal, targetWinRate: v });
                  }}
                  className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base"
                />
              </div>
            )}

            <details className="goal-create-rules" open>
              <summary><ChevronDown size={16} />Додаткові правила<span>Необов’язково</span></summary>
              <div>
                <Label htmlFor="goalBetsPerDay" className="text-base font-medium text-gray-900">
                  Ліміт ставок на день
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={h.betsPerDayStr}
                  id="goalBetsPerDay"
                  onChange={(e) => {
                    h.setBetsPerDayStr(e.target.value);
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v))
                      h.setNewGoal({ ...h.newGoal, betsPerDay: v });
                  }}
                  className="rounded-2xl border border-gray-200 mt-1.5 h-11 text-base"
                />
                <p>0 — без обмежень</p>
              </div>
            </details>
          </div>
          <div className="goal-create-note"><Info size={18} />Створення цілі не додає ставок у журнал.</div>
          <DialogFooter className="goal-create-footer">
            <Button
              variant="outline"
              onClick={() => h.setShowCreateDialog(false)}
              className="rounded-3xl border border-gray-200 hover:bg-gray-50 font-medium h-11 px-5 text-base"
            >
              Скасувати
            </Button>
            <Button
              onClick={h.createGoal}
              className="goal-create-submit"
            >
              Створити ціль
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteGoalDialog
        open={h.showDeleteDialog}
        onOpenChange={h.setShowDeleteDialog}
        goalName={h.goals.find((g) => g.id === h.goalToDelete)?.name || ""}
        onDelete={h.deleteGoal}
      />

      <LadderDetailsDialog goal={h.selectedGoal} open={h.showDetailsDialog} onOpenChange={h.setShowDetailsDialog} />

      {/* Completed Goal Result Modal */}
      <CompletedGoalResultModal
        goal={h.selectedGoal}
        isOpen={h.showCompletedResultModal}
        onClose={() => {
          h.setShowCompletedResultModal(false);
          h.setSelectedGoal(null);
        }}
      />
    </div>
  );
}
