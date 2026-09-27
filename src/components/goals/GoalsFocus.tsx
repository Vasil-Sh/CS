import { useState, type ReactNode } from "react";
import { Star, RefreshCw, ArrowRight, Target, Trash2, MoreVertical, Search, ChevronRight, Trophy, Info } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import PlanningHeader from "@/components/planning/PlanningHeader";
import { getGoalProgress, getGoalTypeLabel, type Goal, type useGoals } from "@/hooks/useGoals";
import "./GoalsMasterDetail.css";
type Controller = ReturnType<typeof useGoals>;
const fmt=(n:number)=>new Intl.NumberFormat("uk-UA",{maximumFractionDigits:1}).format(n);
function metric(g:Goal) {
  switch(g.type) {
    case "amount": return {current:g.currentAmount??0,target:g.targetAmount??0,unit:" ₴",label:"Поточна сума"};
    case "ladder": return {current:g.currentBank??g.startAmount??0,target:g.targetLadderAmount??0,unit:" ₴",label:"Поточний банк"};
    case "roi": return {current:g.currentROI??0,target:g.targetROI??0,unit:"%",label:"Поточний ROI"};
    case "winrate": return {current:g.currentWinRate??0,target:g.targetWinRate??0,unit:"%",label:"Win Rate"};
  }
}
function GoalProgress({goal}:{goal:Goal}) {
  const raw=getGoalProgress(goal); const value=Number.isFinite(raw)?Math.min(100,Math.max(0,raw)):0;
  return <div className="gmd-progress"><progress max={100} value={value} aria-label={`Прогрес: ${goal.name}`}/><span>{fmt(value)}%</span></div>;
}
export default function GoalsFocus({h,overview}:{h:Controller;overview?:ReactNode}) {
  const [query,setQuery]=useState(""); const [selectedId,setSelectedId]=useState<string|null>(null);
  const active=h.activeTab==="active";
  const history=h.goals.filter(g=>g.status!=="active");
  const visible=(active?h.activeGoals:history).filter(g=>g.name.toLocaleLowerCase("uk").includes(query.trim().toLocaleLowerCase("uk")));
  const selected=visible.find(g=>g.id===selectedId) ?? visible.find(g=>g.isPrimary) ?? visible[0];
  const values=selected?metric(selected):null;
  return <div className="gmd-page">
    <PlanningHeader title="Цілі" description="Керуйте цілями та відстежуйте результат." action="Створити ціль" onCreate={()=>h.setShowCreateDialog(true)} disabled={h.activeGoals.length>=25} metrics={[]} />
    <div className="gmd-content">
      <p className="gmd-summary">{h.activeGoals.length} активні · {h.completedGoals.length} виконані · {h.goals.length} всього</p>
      <div className="gmd-layout"><div className="gmd-left">
        <section className="gmd-list" aria-label="Мої цілі"><div className="gmd-list-head"><h2>Мої цілі</h2><label className="gmd-search"><Search size={16}/><input aria-label="Пошук цілі" placeholder="Пошук цілі" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
          <div className="gmd-tabs" role="group" aria-label="Стани цілей"><button aria-pressed={active} onClick={()=>{setSelectedId(null);h.setActiveTab("active");}}>Активні · {h.activeGoals.length}</button><button aria-pressed={!active} onClick={()=>{setSelectedId(null);h.setActiveTab("completed");}}>Завершені · {history.length}</button></div>
          <div className="gmd-rows">{visible.map(goal=>{const m=metric(goal);return <button key={goal.id} className="gmd-row" aria-pressed={selected?.id===goal.id} aria-controls="goal-detail-panel" onClick={()=>setSelectedId(goal.id)}>
            {goal.isPrimary?<Star className="gmd-star" size={20} fill="currentColor"/>:<Target size={20}/>}
            <span className="gmd-row-copy"><span className="gmd-row-title">{goal.name}{goal.isPrimary&&<span className="gmd-badge">Основна</span>}</span><span className="gmd-row-metric">{m.unit==="%"?`${m.label} ${fmt(m.current)}% · Ціль ${fmt(m.target)}%`:`${fmt(m.current)}${m.unit} із ${fmt(m.target)}${m.unit}`}</span>{m.unit!=="%"&&<GoalProgress goal={goal}/>}</span><ChevronRight size={18}/>
          </button>;})}{!visible.length&&<div className="gmd-empty"><Target size={28}/><h3>{query?"Нічого не знайдено":active?"Немає активних цілей":"Немає завершених цілей"}</h3><p>{query?"Спробуйте іншу назву або очистіть пошук.":active?"Створіть першу ціль кнопкою вгорі.":"Тут з’являться завершені цілі та їх результати."}</p></div>}</div>
          <p className="gmd-list-hint"><Info size={16}/>Оберіть ціль, щоб переглянути деталі.</p>
        </section>
        <div className="gmd-achievements"><Trophy size={22}/><strong>Досягнення</strong><span>Виконано {h.completedGoals.length} з {h.goals.length}</span><a href="/app/strategy">Огляд стратегій <ArrowRight size={15}/></a></div>
        {overview&&<details className="gmd-overview"><summary>Переглянути огляд стратегій</summary>{overview}</details>}
      </div>
      <section id="goal-detail-panel" className="gmd-detail" aria-label="Деталі цілі">{selected&&values?<>
        <div className="gmd-detail-top"><span>Деталі цілі</span><DropdownMenu><DropdownMenuTrigger asChild><button aria-label="Дії вибраної цілі"><MoreVertical size={20}/></button></DropdownMenuTrigger><DropdownMenuContent align="end">{selected.status==="active"&&<DropdownMenuItem onSelect={()=>h.setPrimaryGoal(selected.id)}><Star size={16}/>{selected.isPrimary?"Зняти позначку основної":"Зробити основною"}</DropdownMenuItem>}<DropdownMenuItem className="text-red-600" onSelect={()=>h.confirmDeleteGoal(selected.id)}><Trash2 size={16}/>Видалити ціль</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
        <h2>{selected.name} {selected.isPrimary&&<span className="gmd-badge">Основна</span>}</h2>
        <dl className="gmd-values"><div><dt>{values.label}</dt><dd>{fmt(values.current)}{values.unit}</dd></div><div><dt>Ціль</dt><dd>{fmt(values.target)}{values.unit}</dd></div></dl>
        {values.unit!=="%"&&<><GoalProgress goal={selected}/>{selected.type==="ladder"&&<p className="gmd-muted">Прогрес за кроками: {selected.currentStep??0} / {selected.totalSteps??0}</p>}</>}
        <dl className="gmd-facts"><div><dt>Залишилось</dt><dd>{fmt(Math.max(0,values.target-values.current))}{values.unit==="%"?" в.п.":values.unit}</dd></div><div><dt>Тип цілі</dt><dd>{getGoalTypeLabel(selected.type)}</dd></div></dl>
        <div className="gmd-detail-section"><h3>Правила</h3><p>Ставок на день</p><strong>{selected.betsPerDay||"Без обмежень"}</strong>{selected.type==="ladder"&&<p>Коефіцієнти: {selected.minOdds??"—"} – {selected.maxOdds??"—"}</p>}</div>
        <div className="gmd-detail-section"><h3>Джерело прогресу</h3><p>Ставки, прив’язані до цієї цілі.</p>{selected.status!=="active"&&<p>Статус: {selected.status==="completed"?"Виконано":"Не виконано"}</p>}</div>
        <div className="gmd-detail-actions"><button className="gmd-update" disabled={h.isUpdating||selected.status!=="active"} onClick={h.handleManualUpdate}><RefreshCw size={16} className={h.isUpdating?"animate-spin":""}/>{h.isUpdating?"Оновлення…":"Оновити прогрес"}</button>{selected.type==="ladder"&&<button onClick={()=>h.openDetailsDialog(selected)}>Кроки цілі <ArrowRight size={16}/></button>}{selected.status==="completed"&&<button onClick={()=>h.openCompletedGoalResult(selected)}>Результат <ArrowRight size={16}/></button>}</div>
      </>:<div className="gmd-empty"><Target size={32}/><h2>Деталі цілі</h2><p>{query?"Змініть пошук, щоб обрати ціль.":"Оберіть ціль зі списку або створіть нову."}</p></div>}</section>
      </div>
    </div>
  </div>;
}
