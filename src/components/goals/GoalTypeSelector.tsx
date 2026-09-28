import { useId } from "react";
import type { GoalType } from "@/hooks/useGoals";
import "./CreateGoalDialog.css";

const options: { value: GoalType; label: string; description: string }[] = [
  { value: "amount", label: "Сума", description: "Досягти заданої суми." },
  { value: "roi", label: "ROI", description: "Відстежувати прибутковість ставок." },
  { value: "winrate", label: "Win Rate", description: "Відстежувати частку перемог." },
  { value: "ladder", label: "Лесенка", description: "Відстежувати кроки та банк." },
];

export default function GoalTypeSelector({ value, onChange }: {
  value: GoalType;
  onChange: (value: GoalType) => void;
}) {
  const id = useId();
  return (
    <fieldset className="goal-type-selector" aria-describedby={`${id}-hint`}>
      <div className="goal-type-options">
        {options.map((option) => (
          <label key={option.value} className="goal-type-option">
            <input type="radio" name={id} value={option.value}
              checked={value === option.value} onChange={() => onChange(option.value)} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      <p id={`${id}-hint`} className="goal-type-description" aria-live="polite">
        {options.find((option) => option.value === value)?.description}
      </p>
    </fieldset>
  );
}
