/* Scrollable step table region must be keyboard focusable. */
/* eslint jsx-a11y/no-noninteractive-tabindex: ["error", { "roles": ["region"] }] */
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { calculateOddsScenarios, getGoalProgress, type Goal } from "@/hooks/useGoals";
import "./LadderDetailsDialog.css";

const number = (value?: number) => value == null || !Number.isFinite(value) ? "—" : new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 }).format(value);
const money = (value?: number) => value == null ? "—" : `${number(value)} ₴`;
export default function LadderDetailsDialog({ goal, open, onOpenChange }: {
  goal: Goal | null; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="ladder-dialog">
      {goal && <LadderContent key={`${goal.id}-${open}`} goal={goal} onClose={() => onOpenChange(false)} />}
    </DialogContent>
  </Dialog>;
}
function LadderContent({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const currentRow = useRef<HTMLTableRowElement>(null);
  const steps = goal.steps ?? [];
  const currentIndex = steps.findIndex(step => step.status === "current");
  const first = Math.max(0, Math.min(currentIndex < 0 ? 0 : currentIndex, steps.length - 6));
  const visible = expanded ? steps : steps.slice(first, first + 6);
  const completed = steps.filter(step => step.status === "completed").length;
  const progress = Math.min(100, Math.max(0, getGoalProgress(goal) || 0));
  const date = new Date(goal.createdAt);
  const scenarios = calculateOddsScenarios(goal.startAmount ?? 0, goal.targetLadderAmount ?? 0, goal.minOdds ?? 0, goal.maxOdds ?? 0);
  function goToCurrent() {
    currentRow.current?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }
  return <>
    <DialogHeader className="ladder-dialog-header">
      <DialogTitle>{String(goal.name)}</DialogTitle>
      <div className="ladder-header-meta"><DialogDescription>Детальна інформація про прогрес</DialogDescription>
        <span>Лесенка · Створено {Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("uk-UA")}</span></div>
    </DialogHeader>
    <div className="ladder-dialog-body">
      <dl className="ladder-totals"><div><dt>Поточний банк</dt><dd>{money(goal.currentBank ?? goal.startAmount)}</dd></div><div><dt>Ціль</dt><dd>{money(goal.targetLadderAmount)}</dd></div></dl>
      <div className="ladder-progress"><progress value={progress} max={100} aria-label="Прогрес лесенки" /><span>{number(progress)}%</span></div>
      <p className="ladder-caption">Виконано {completed} із {steps.length} кроків</p>
      <dl className="ladder-parameters"><div><dt>Початкова сума</dt><dd>{money(goal.startAmount)}</dd></div><div><dt>Коефіцієнти</dt><dd>{goal.minOdds ?? "—"}–{goal.maxOdds ?? "—"}</dd></div></dl>
      <details className="ladder-scenarios"><summary><strong>Сценарії кроків</strong><span>Розрахунок за різних коефіцієнтів</span><ChevronDown size={18} /></summary>
        <div className="ladder-scenario-list">{scenarios.length ? scenarios.map((scenario, index) => <div key={index}><span>Коефіцієнт <strong>{scenario.odds}</strong></span><span>{scenario.steps} кроків</span></div>) : <p>Недостатньо параметрів для розрахунку.</p>}</div>
      </details>
      <div className="ladder-section-title"><h3>Кроки прогресії</h3>{currentIndex >= 0 && <button type="button" onClick={goToCurrent}>До поточного кроку <ChevronDown size={16} /></button>}</div>
      <p className="ladder-muted">Планові значення, не фактичний результат.</p>
      {steps.length ? <>
        <div className="ladder-table-scroll" tabIndex={0} role="region" aria-label="Таблиця кроків">
          <table><thead><tr><th scope="col">Крок</th><th scope="col">Сума ставки</th><th scope="col">Сума після виграшу</th><th scope="col">Статус</th></tr></thead>
            <tbody>{visible.map(step => <tr key={step.step} data-status={step.status} ref={step.status === "current" ? currentRow : undefined}>
              <th scope="row">{String(step.step).padStart(2, "0")}</th><td>{money(step.startAmount)}</td>
              <td>{step.minPlannedAmount == null || step.maxPlannedAmount == null ? "—" : `${number(step.minPlannedAmount)}–${number(step.maxPlannedAmount)} ₴`}
                {(step.actualAmount != null || step.actualOdds != null || step.completedAt || step.deviation != null) && <details className="ladder-actual"><summary>Фактичний результат</summary>
                  <p>Сума: {money(step.actualAmount)}</p><p>Коефіцієнт: {step.actualOdds ?? "—"}</p>
                  {step.deviation != null && <p>Відхилення: {money(step.deviation)}</p>}
                  {step.completedAt && <p>Завершено: {new Date(step.completedAt).toLocaleDateString("uk-UA")}</p>}
                </details>}
              </td><td className="ladder-step-status">{step.status === "completed" ? "Виконано" : step.status === "current" ? "Поточний" : "Очікує"}</td>
            </tr>)}</tbody>
          </table>
        </div>
        {steps.length > 6 && <button type="button" className="ladder-expand" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Згорнути список" : `Показати всі ${steps.length} кроків`}<ChevronDown size={16} /></button>}
      </> : <p className="ladder-no-steps">Кроки прогресії поки відсутні.</p>}
      <p className="ladder-disclaimer">Розрахунок за коефіцієнтами {goal.minOdds ?? "—"}–{goal.maxOdds ?? "—"}. Виграш не гарантований.</p>
    </div>
    <footer className="ladder-dialog-footer"><p>Прогрес оновлюється за пов’язаними ставками.</p><button type="button" onClick={onClose}>Закрити</button></footer>
  </>;
}
