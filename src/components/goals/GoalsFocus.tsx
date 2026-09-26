import { useState } from "react";
import { Plus, Star, RefreshCw, ArrowRight, Target, Trash2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getGoalProgress, getGoalTypeLabel, type Goal, type useGoals } from "@/hooks/useGoals";
import "./GoalsFocus.css";

type Controller = ReturnType<typeof useGoals>;
const number = (value: number) => new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(value);
function goalNumbers(goal: Goal) {
  switch (goal.type) {
    case "amount": return { current: goal.currentAmount ?? 0, target: goal.targetAmount ?? 0, unit: " ₴", label: "Накопичено" };
    case "ladder": return { current: goal.currentBank ?? goal.startAmount ?? 0, target: goal.targetLadderAmount ?? 0, unit: " ₴", label: "Поточний банк" };
    case "roi": return { current: goal.currentROI ?? 0, target: goal.targetROI ?? 0, unit: "%", label: "Поточний ROI" };
    case "winrate": return { current: goal.currentWinRate ?? 0, target: goal.targetWinRate ?? 0, unit: "%", label: "Поточний Win Rate" };
  }
}

function GoalCard({ goal, h, featured = false }: { goal: Goal; h: Controller; featured?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const metric = goalNumbers(goal);
  const raw = getGoalProgress(goal);
  const progress = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;
  const active = goal.status === "active";
  const detail = () => goal.type === "ladder" ? h.openDetailsDialog(goal) : setExpanded(!expanded);
  return <article className={`gf-card ${featured ? "gf-featured" : ""}`}>
    {featured && <div className="gf-feature-top"><div className="gf-badge"><Star size={20} fill="currentColor" /><span>Основна ціль</span></div><button className="gf-detail-link" onClick={detail} aria-expanded={goal.type !== "ladder" ? expanded : undefined}>{expanded ? "Згорнути" : "Деталі"}<ArrowRight size={16}/></button></div>}
    <div className="gf-card-heading"><h2>{goal.name}</h2><div className="gf-actions">
      {active && !featured && <button aria-label={`Зробити основною: ${goal.name}`} aria-pressed={!!goal.isPrimary} onClick={() => h.setPrimaryGoal(goal.id)}><Star size={19} fill={goal.isPrimary ? "currentColor" : "none"} /></button>}
      <DropdownMenu><DropdownMenuTrigger asChild><button aria-label={`Дії цілі: ${goal.name}`}><MoreVertical size={18}/></button></DropdownMenuTrigger><DropdownMenuContent align="end">{featured && <DropdownMenuItem onSelect={() => h.setPrimaryGoal(goal.id)}><Star size={16} className="mr-2"/>Зняти позначку основної</DropdownMenuItem>}<DropdownMenuItem onSelect={() => h.confirmDeleteGoal(goal.id)} className="text-red-600"><Trash2 size={16} className="mr-2"/>Видалити ціль</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
    </div></div>
    <div className="gf-value">{number(metric.current)}{metric.unit} <span>/ {number(metric.target)}{metric.unit}</span></div>
    {goal.type === "ladder" && <p className="gf-help">Прогрес за кроками: {goal.currentStep ?? 0} / {goal.totalSteps ?? 0}</p>}
    <div className="gf-progress"><progress aria-label={`Прогрес: ${goal.name}`} value={progress} max={100} /><span>{number(progress)}%</span></div>
    {featured && <dl className="gf-metrics"><div><dt>{metric.label}</dt><dd>{number(metric.current)}{metric.unit}</dd></div><div><dt>Залишилось</dt><dd>{number(Math.max(0, metric.target - metric.current))}{metric.unit === "%" ? " в.п." : metric.unit}</dd></div><div><dt>Ціль</dt><dd>{number(metric.target)}{metric.unit}</dd></div></dl>}
    <div className="gf-card-footer"><span>Тип цілі: {getGoalTypeLabel(goal.type)}{goal.status === "failed" ? " · Не виконано" : goal.status === "completed" ? " · Виконано" : ""}</span>{!featured && <button onClick={goal.status === "completed" ? () => h.openCompletedGoalResult(goal) : detail} aria-expanded={goal.type !== "ladder" && goal.status !== "completed" ? expanded : undefined}>{expanded ? "Згорнути" : "Деталі"}<ArrowRight size={16}/></button>}</div>
    {expanded && <div className="gf-details"><p>Створено: {new Date(goal.createdAt).toLocaleDateString("uk-UA")}</p><p>Ставок на день: {goal.betsPerDay || "Без обмежень"}</p><p>Правила: {h.getDisciplineStatus(goal).label}</p>{goal.deadline && <p>Термін: {new Date(goal.deadline).toLocaleDateString("uk-UA")}</p>}</div>}
  </article>;
}

export default function GoalsFocus({ h }: { h: Controller }) {
  const primary = h.activeGoals.find(goal => goal.isPrimary);
  const history = h.goals.filter(goal => goal.status !== "active");
  const active = h.activeTab === "active";
  const displayed = active ? h.activeGoals.filter(goal => goal.id !== primary?.id) : history;
  return <div className="gf-page">
    <header className="gf-header"><div><h1>Цілі</h1><p>Ваш прогрес — в одному місці.</p></div><button className="gf-create" disabled={h.activeGoals.length >= 25} onClick={() => h.setShowCreateDialog(true)}><Plus size={19}/>Створити ціль</button></header>
    <div className="gf-content">
      <dl className="gf-summary"><div><dt>Активні</dt><dd>{h.activeGoals.length}</dd></div><div><dt>Виконані</dt><dd>{h.completedGoals.length}</dd></div><div><dt>Всього</dt><dd>{h.goals.length}</dd></div></dl>
      {active && primary && <GoalCard goal={primary} h={h} featured />}
      {active && !primary && h.activeGoals.length > 0 && <p className="gf-notice"><Star size={17}/>Позначте ціль зіркою, щоб бачити її прогрес окремо зверху.</p>}
      <section aria-label="Список цілей"><h2 className="gf-section-title">{active && primary ? "Інші цілі" : "Ваші цілі"}</h2>
        <div className="gf-toolbar"><div role="group" aria-label="Стани цілей"><button aria-pressed={active} onClick={() => h.setActiveTab("active")}>Активні · {h.activeGoals.length - (primary ? 1 : 0)}</button><button aria-pressed={!active} onClick={() => h.setActiveTab("completed")}>Завершені · {history.length}</button></div><button className="gf-refresh" disabled={h.isUpdating || !h.activeGoals.length} onClick={h.handleManualUpdate}><RefreshCw size={16} className={h.isUpdating ? "animate-spin" : ""}/>{h.isUpdating ? "Оновлення…" : "Оновити прогрес"}</button></div>
        {displayed.length ? <div className="gf-grid">{displayed.map(goal => <GoalCard key={goal.id} goal={goal} h={h}/>)}</div> : <div className="gf-empty"><Target size={34}/><h3>{active ? primary ? "Інших активних цілей немає" : "Немає активних цілей" : "Немає завершених цілей"}</h3><p>{active ? "Створіть нову ціль кнопкою вгорі сторінки." : "Тут з’являться результати завершених цілей."}</p></div>}
        <p className="gf-help">Прив’яжіть ставку до цілі під час додавання запису. Після розрахунку ставки оновіть прогрес. Активних цілей: {h.activeGoals.length} з 25.</p>
      </section>
    </div>
  </div>;
}
