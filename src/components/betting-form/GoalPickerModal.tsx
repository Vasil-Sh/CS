import { useEffect, useState } from "react";
import {
  Search,
  X,
  Check,
  Ban,
  Banknote,
  TrendingUp,
  Percent,
  Layers,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Goal } from "./types";
import "./GoalPickerModal.css";

interface GoalPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goals: Goal[];
  selectedGoalId: string;
  onSelect: (goalId: string) => void;
}
const icons = {
  amount: Banknote,
  roi: TrendingUp,
  winrate: Percent,
  ladder: Layers,
};
const labels = {
  amount: "Фінансова ціль",
  roi: "Рентабельність · ROI",
  winrate: "Відсоток перемог",
  ladder: "Драбина",
};
const number = (value: number) =>
  new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 2 }).format(value);
const finite = (value: number | undefined) =>
  value != null && Number.isFinite(value) ? value : null;

export function goalPickerProgress(goal: Goal) {
  const current =
    finite(
      goal.type === "amount"
        ? goal.currentAmount
        : goal.type === "ladder"
          ? goal.currentStep
          : goal.type === "roi"
            ? goal.currentROI
            : goal.currentWinRate,
    ) ?? 0;
  const target = finite(
    goal.type === "amount"
      ? goal.targetAmount
      : goal.type === "ladder"
        ? goal.totalSteps
        : goal.type === "roi"
          ? goal.targetROI
          : goal.targetWinRate,
  );
  const percent =
    target != null && target > 0
      ? Math.min(100, Math.max(0, (current / target) * 100))
      : null;
  const unit =
    goal.type === "amount" ? " ₴" : goal.type === "ladder" ? "" : "%";
  const text =
    target != null && target > 0
      ? `${number(current)}${unit} із ${number(target)}${unit}`
      : "Цільове значення не задано";
  return { percent, text, current, target };
}
function goalCount(count: number) {
  const mod = count % 100;
  return `${count} ${mod >= 11 && mod <= 14 ? "активних цілей" : count % 10 === 1 ? "активна ціль" : count % 10 >= 2 && count % 10 <= 4 ? "активні цілі" : "активних цілей"}`;
}

export default function GoalPickerModal({
  open,
  onOpenChange,
  goals,
  selectedGoalId,
  onSelect,
}: GoalPickerModalProps) {
  const [search, setSearch] = useState("");
  const [draftId, setDraftId] = useState(selectedGoalId || "all");
  useEffect(() => {
    if (open) {
      setDraftId(selectedGoalId || "all");
      setSearch("");
    }
  }, [open, selectedGoalId]);

  const activeGoals = goals.filter((goal) => goal.status === "active");
  const query = search.trim().toLocaleLowerCase("uk-UA");
  const filteredGoals = activeGoals
    .filter((goal) => goal.name.toLocaleLowerCase("uk-UA").includes(query))
    .sort((a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary));
  const selectedGoal = activeGoals.find((goal) => goal.id === draftId);
  const noneSelected = draftId === "all";
  const canConfirm = noneSelected || !!selectedGoal;
  const indicator = (selected: boolean) => (
    <span className="gpm-indicator" aria-hidden="true">
      {selected && <Check size={16} />}
    </span>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gpm-dialog" hideCloseButton>
        <DialogHeader className="gpm-header">
          <span className="gpm-eyebrow">
            <i aria-hidden="true" />
            GOALS
          </span>
          <DialogTitle>Оберіть ціль</DialogTitle>
          <DialogDescription>{goalCount(activeGoals.length)}</DialogDescription>
          <DialogClose className="gpm-close" aria-label="Закрити вибір цілі">
            <X size={23} />
          </DialogClose>
        </DialogHeader>
        <div className="gpm-body">
          <div className="gpm-search">
            <Search size={19} aria-hidden="true" />
            <input
              aria-label="Пошук цілі за назвою"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Пошук за назвою…"
              autoFocus
            />
            {search && (
              <button
                type="button"
                className="gpm-search-clear"
                aria-label="Очистити пошук"
                onClick={() => setSearch("")}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="gpm-list" role="group" aria-label="Доступні цілі">
            <button
              type="button"
              className="gpm-item gpm-none"
              aria-pressed={noneSelected}
              onClick={() => setDraftId("all")}
            >
              <span className="gpm-item-icon">
                <Ban size={24} aria-hidden="true" />
              </span>
              <span className="gpm-item-copy">
                <span className="gpm-item-name">Без цілі</span>
                <span className="gpm-item-meta">
                  Не прив’язувати запис до цілі
                </span>
              </span>
              {indicator(noneSelected)}
            </button>
            {filteredGoals.map((goal) => {
              const Icon = icons[goal.type] ?? Layers;
              const progress = goalPickerProgress(goal);
              return (
                <button
                  type="button"
                  key={goal.id}
                  className="gpm-item"
                  aria-pressed={goal.id === draftId}
                  onClick={() => setDraftId(goal.id)}
                >
                  <span className="gpm-item-icon">
                    <Icon size={25} aria-hidden="true" />
                  </span>
                  <span className="gpm-item-copy">
                    <span className="gpm-item-heading">
                      <span className="gpm-item-name">{goal.name}</span>
                      {goal.isPrimary && (
                        <span className="gpm-badge">Основна</span>
                      )}
                    </span>
                    <span className="gpm-item-meta">
                      {labels[goal.type]}
                      {goal.type === "ladder" &&
                      progress.target != null &&
                      progress.target > 0
                        ? ` · крок ${progress.current} із ${progress.target}`
                        : ""}
                    </span>
                    <span className="gpm-progress" aria-hidden="true">
                      <span style={{ width: `${progress.percent ?? 0}%` }} />
                    </span>
                    <span className="gpm-progress-caption">
                      <span>{progress.text}</span>
                      <span>
                        {progress.percent == null
                          ? "—"
                          : `${Math.round(progress.percent)}%`}
                      </span>
                    </span>
                  </span>
                  {indicator(goal.id === draftId)}
                </button>
              );
            })}
            {!filteredGoals.length && (
              <p className="gpm-empty" role="status">
                {query
                  ? "Нічого не знайдено. Спробуйте іншу назву."
                  : "Поки немає активних цілей. Можна зберегти запис без прив’язки."}
              </p>
            )}
          </div>
        </div>
        <footer className="gpm-footer">
          <span className="gpm-selected" aria-live="polite">
            <span>Обрано</span>
            <strong title={selectedGoal?.name}>
              {noneSelected
                ? "Без цілі"
                : selectedGoal?.name || "Ціль недоступна"}
            </strong>
          </span>
          <div className="gpm-footer-actions">
            <DialogClose className="gpm-cancel">Скасувати</DialogClose>
            <button
              type="button"
              className="gpm-confirm"
              disabled={!canConfirm}
              onClick={() => {
                if (canConfirm) {
                  onSelect(draftId);
                  onOpenChange(false);
                }
              }}
            >
              Обрати ціль
            </button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
