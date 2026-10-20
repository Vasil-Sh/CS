import { Flag, Unlink } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import "./JournalGoal.css";

type GoalState =
  | { kind: "none" }
  | { kind: "deleted" }
  | { kind: "linked"; id: string; name: string };

type JournalGoalProps = {
  goal: GoalState;
  onOpen: (id: string) => void;
};

export function JournalGoal({ goal, onOpen }: JournalGoalProps) {
  if (goal.kind === "none") {
    return (
      <span className="journal-goal-empty" aria-label="Без цілі">
        —
      </span>
    );
  }

  if (goal.kind === "deleted") {
    return (
      <span className="journal-goal-deleted">
        <Unlink size={16} aria-hidden="true" />
        <span>Видалена ціль</span>
      </span>
    );
  }

  return (
    <Tooltip.Provider delayDuration={250}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className="journal-goal-chip"
            aria-label={`Відкрити ціль: ${goal.name}`}
            onClick={() => onOpen(goal.id)}
          >
            <Flag size={16} strokeWidth={1.8} aria-hidden="true" />
            <span className="journal-goal-chip__name">{goal.name}</span>
          </button>
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content
            className="journal-goal-tooltip"
            side="top"
            sideOffset={8}
            collisionPadding={12}
          >
            {goal.name}
            <Tooltip.Arrow className="journal-goal-tooltip__arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
