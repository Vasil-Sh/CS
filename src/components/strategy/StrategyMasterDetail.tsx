import { useState } from "react";
import { Star, Search, ChevronRight, Info, MoreVertical, Trash2, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getRiskLabel, parseCriteriaForValidation } from "@/lib/strategyHelpers";
import type { CS2Strategy } from "@/types/strategy";
import "./StrategyMasterDetail.css";
type Stats = { totalBets:number; wins:number; losses:number; roi:number; winRate:number };
type Props = { strategies:CS2Strategy[]; stats:Record<string,Stats>; query:string; onSearch:(q:string)=>void; isPrimary:(s:CS2Strategy)=>boolean; onPrimary:(s:CS2Strategy)=>void; onDelete:(id:string)=>void; onEdit:(s:CS2Strategy)=>void; onDetails:(s:CS2Strategy)=>void; onCreate:()=>void; total:number };
export default function StrategyMasterDetail(p:Props) {
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const selected=p.strategies.find(s=>(s.id||s.name)===selectedId) ?? p.strategies.find(p.isPrimary) ?? p.strategies[0];
 const stats=selected?p.stats[selected.name]:undefined;
 const settled=!!stats && stats.wins+stats.losses>0;
 const parsed=selected?parseCriteriaForValidation(selected.criteria??[]):{};
 const odds=selected?.oddsControl;
 const min=odds?odds.enabled?odds.minOdds:undefined:selected?.minOdds??parsed.minOdds;
 const max=odds?odds.enabled?odds.maxOdds:undefined:selected?.maxOdds??parsed.maxOdds;
 const formats=selected?.matchFormatRules ? selected.matchFormatRules.enabled?selected.matchFormatRules.allowedFormats:[] : selected?.allowedFormats??parsed.allowedFormats;
 const types=selected?.betTypeRules ? selected.betTypeRules.enabled?selected.betTypeRules.allowedTypes:[] : selected?.allowedBetTypes??parsed.allowedBetTypes;
 const percent=(value:number)=>`${new Intl.NumberFormat("uk-UA",{maximumFractionDigits:1}).format(value)}%`;
 return <div className="smd-grid"><div className="smd-left">
  <section className="smd-list" aria-label="Мої стратегії">
   <header><h2>Мої стратегії</h2><label className="smd-search"><Search size={16}/><input aria-label="Пошук стратегії" placeholder="Пошук стратегії" value={p.query} onChange={e=>p.onSearch(e.target.value)}/></label></header>
   <div className="smd-rows">{p.strategies.map(s=><button className="smd-row" key={s.id||s.name} aria-pressed={selected===s} aria-controls="strategy-details" onClick={()=>setSelectedId(s.id||s.name)}>
    <Star size={20} className={p.isPrimary(s)?"smd-star":""} fill={p.isPrimary(s)?"currentColor":"none"}/><span><strong>{s.name} {p.isPrimary(s)&&<small className="smd-badge">Основна</small>}</strong><span className="smd-subline">{getRiskLabel(s.riskLevel)} ризик · {p.stats[s.name]?.totalBets??0} ставок</span></span><ChevronRight size={18}/>
   </button>)}</div>
   {!p.strategies.length&&<div className="smd-empty"><h3>{p.total?"Нічого не знайдено":"Ще немає стратегій"}</h3><p>{p.total?"Змініть пошук або фільтри.":"Збережіть правила для відстеження результатів."}</p>{!p.total&&<button onClick={p.onCreate}>Створити стратегію</button>}</div>}
   <p className="smd-hint"><Info size={16}/>Оберіть стратегію, щоб переглянути правила.</p>
  </section>
 </div><section id="strategy-details" className="smd-detail" aria-label="Деталі стратегії">
 {selected?<><div className="smd-detail-top"><span>Деталі стратегії</span><DropdownMenu><DropdownMenuTrigger asChild><button aria-label="Дії стратегії"><MoreVertical size={20}/></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={()=>p.onPrimary(selected)}><Star size={16}/>{p.isPrimary(selected)?"Зняти позначку основної":"Зробити основною"}</DropdownMenuItem><DropdownMenuItem className="text-red-600" onSelect={()=>p.onDelete(selected.id||selected.name)}><Trash2 size={16}/>Видалити стратегію</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
 <h2>{selected.name} {p.isPrimary(selected)&&<small className="smd-badge">Основна</small>}</h2><p className="smd-muted">{getRiskLabel(selected.riskLevel)} ризик</p>
 <dl className="smd-metrics"><div><dt>ROI</dt><dd>{settled?percent(stats!.roi):"—"}</dd></div><div><dt>Вінрейт</dt><dd>{settled?percent(stats!.winRate):"—"}</dd></div><div><dt>Ставок</dt><dd>{stats?.totalBets??0}</dd></div></dl>
 {!settled&&<p className="smd-muted">Статистика з’явиться після розрахунку пов’язаних ставок.</p>}
 <section className="smd-section"><h3>Правила</h3><dl className="smd-rules"><div><dt>Коефіцієнти</dt><dd>{min==null&&max==null?"Не задано":`${min??"—"}–${max??"—"}`}</dd></div><div><dt>Формати</dt><dd>{formats?.join(", ")||"Не задано"}</dd></div><div><dt>Типи ставок</dt><dd>{types?.join(", ")||"Не задано"}</dd></div></dl>
 {!!selected.criteria?.length&&<details className="smd-extra"><summary>Усі критерії · {selected.criteria.length}</summary><ul>{selected.criteria.map((c,i)=><li key={i}>{c}</li>)}</ul></details>}
 </section>
 <div className="smd-actions">
  <button className="smd-action" onClick={()=>p.onDetails(selected)}><Eye size={16}/>Деталі</button>
 </div>
 </>:<div className="smd-empty"><h2>Деталі стратегії</h2><p>Оберіть стратегію зі списку.</p></div>}
 </section></div>;
}
