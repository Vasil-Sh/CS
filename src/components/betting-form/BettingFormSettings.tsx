import { RotateCcw, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GoalPickerModal from "./GoalPickerModal";
import type { Goal } from "./types";

interface FormSettingsData {
  date: string;
  game: "CS2" | "Dota2";
  betCategory: string;
  format: string;
  goalId: string;
}

interface BettingFormSettingsProps {
  /** Form data slice */
  data: FormSettingsData;
  mode?: "all" | "match" | "goal";
  isPrefilled: boolean;
  isExpressFromMatches: boolean;
  activeGoals: Goal[];
  /** Style classes from parent */
  classes: {
    input: string;
    selectTrigger: string;
    label: string;
    sectionTitle: string;
  };
  /** Callbacks */
  onClearForm: () => void;
  onFieldChange: <K extends keyof FormSettingsData>(
    field: K,
    value: FormSettingsData[K],
  ) => void;
  onCategoryChange: (value: string) => void;
  onGoalSelect: (goalId: string) => void;
}

export default function BettingFormSettings({
  data,
  mode = "all",
  isPrefilled,
  isExpressFromMatches,
  activeGoals,
  classes,
  onClearForm,
  onFieldChange,
  onCategoryChange,
  onGoalSelect,
}: BettingFormSettingsProps) {
  const [goalPickerOpen, setGoalPickerOpen] = useState(false);
  const selectedGoal = activeGoals.find((g) => g.id === data.goalId);

  const handleGoalSelect = (goalId: string) => {
    if (goalId === "all") {
      onGoalSelect("all");
    } else {
      onGoalSelect(goalId);
    }
    setGoalPickerOpen(false);
  };
  return (
    <>
      {mode === "all" && (
        <div className="entry-form-toolbar">
          <div className="entry-category" aria-label="Категорія запису">
            {["Ординар", "Експрес"].map((category) => (
              <button
                type="button"
                key={category}
                aria-pressed={data.betCategory === category}
                onClick={() => onCategoryChange(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <button type="button" className="entry-clear" onClick={onClearForm}>
            <RotateCcw size={15} /> Очистити
          </button>
        </div>
      )}
      {mode !== "goal" && isPrefilled && (
        <p className="entry-prefill">
          {isExpressFromMatches
            ? "Експрес із вибраних матчів"
            : "Дані матчу заповнено"}{" "}
          · перевірте перед збереженням
        </p>
      )}
      <div className="entry-settings">
        {mode !== "goal" && (
          <>
            <h3 className={classes.sectionTitle}>Основні налаштування</h3>
            <div className="entry-settings-grid">
              <div>
                <Label htmlFor="date" className={classes.label}>
                  Дата матчу
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={data.date}
                  required
                  onChange={(e) => onFieldChange("date", e.target.value)}
                  className={classes.input}
                />
              </div>
              <div>
                <Label htmlFor="game" className={classes.label}>
                  Гра
                </Label>
                <select
                  id="game"
                  value={data.game}
                  onChange={(e) =>
                    onFieldChange("game", e.target.value as "CS2" | "Dota2")
                  }
                  className="entry-native-select"
                >
                  <option value="CS2">CS2</option>
                  <option value="Dota2">Dota 2</option>
                </select>
              </div>
              <div>
                <Label htmlFor="format" className={classes.label}>
                  Формат матчу
                </Label>
                <select
                  id="format"
                  value={data.format}
                  onChange={(e) => onFieldChange("format", e.target.value)}
                  className="entry-native-select"
                >
                  {["BO1", "BO2", "BO3", "BO5"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}
        {mode !== "match" && (
          <div className="entry-goal-row">
            <Label htmlFor="goalId" className={classes.label}>
              Прив’язати до цілі <small>необов’язково</small>
            </Label>
            <button
              id="goalId"
              type="button"
              className="entry-goal-button"
              onClick={() => setGoalPickerOpen(true)}
            >
              {selectedGoal?.name || "Без цілі"}
              <ChevronDown size={15} />
            </button>
          </div>
        )}
      </div>
      <GoalPickerModal
        open={goalPickerOpen}
        onOpenChange={setGoalPickerOpen}
        goals={activeGoals}
        selectedGoalId={data.goalId}
        onSelect={handleGoalSelect}
      />
    </>
  );
}
