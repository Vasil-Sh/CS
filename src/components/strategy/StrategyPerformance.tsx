import {useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight,Search,BarChart3} from 'lucide-react';
import {ResponsiveContainer,LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,ReferenceLine} from 'recharts';
import type {CS2Strategy} from '@/types/strategy';
import {settledBets,summarize,performanceSeries,type PerformanceBet} from './strategyPerformanceData';
import './StrategyPerformance.css';
const number = (n:number) => n.toLocaleString('uk-UA',{maximumFractionDigits:1});
const percent = (n:number|null) => n === null ? '—' : `${number(n)}%`;
const money = (n:number) => `${n>0?'+':''}${number(n)} ₴`;
const tone = (n:number|null) => n === null || n === 0 ? '' : n>0?'sp-positive':'sp-negative';
export default function StrategyPerformance({strategies,bets,isPrimary}:{strategies:CS2Strategy[];bets:PerformanceBet[];isPrimary:(s:CS2Strategy)=>boolean}) {
 const [days,setDays]=useState(0),[query,setQuery]=useState(''),[selected,setSelected]=useState(''),[metric,setMetric]=useState<'profit'|'roi'>('profit');
 const [sort,setSort]=useState('profit');
 const settled=useMemo(()=>settledBets(bets,days),[bets,days]);
 const total=summarize(settled);
 const rows=useMemo(()=>Array.from(new Set([...strategies.map(s=>s.name),...settled.map(b=>b.strategy!)])).map(name=>({name,primary:strategies.some(s=>s.name===name&&isPrimary(s)),...summarize(settled.filter(b=>b.strategy===name))})).filter(r=>r.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name,'uk'):(sort==='roi'?(b.roi??-Infinity)-(a.roi??-Infinity):sort==='count'?b.count-a.count:b.profit-a.profit)),[strategies,settled,query,sort,isPrimary]);
 const active=rows.find(r=>r.name===selected)||rows.find(r=>r.primary)||rows[0];
 const activeBets=settled.filter(b=>b.strategy===active?.name);
 const series=performanceSeries(activeBets);
 return <section className="sp-screen" aria-label="Ефективність стратегій">
  <div className="sp-period"><label>Період <select value={days} onChange={e=>setDays(Number(e.target.value))}><option value={0}>За весь час</option><option value={30}>Останні 30 днів</option><option value={90}>Останні 90 днів</option></select></label></div>
  <div className="sp-panel sp-summary"><dl>{[['Чистий результат',total.count?money(total.profit):'—',tone(total.profit)],['ROI',percent(total.roi),tone(total.roi)],['Вінрейт',percent(total.winRate),''],['Розраховані ставки',total.count,'']].map(([label,value,color])=><div key={label}><dt>{label}</dt><dd className={String(color)}>{value}</dd></div>)}</dl><p>Лише виграні та програні ставки зі стратегією. Період — за датою запису.</p></div>
  <section className="sp-panel"><header className="sp-table-header"><h2>Порівняння стратегій</h2><div><label className="sp-search"><Search size={16}/><input aria-label="Пошук стратегії" placeholder="Пошук стратегії…" value={query} onChange={e=>setQuery(e.target.value)}/></label><select aria-label="Сортування стратегій" value={sort} onChange={e=>setSort(e.target.value)}><option value="profit">За прибутком</option><option value="roi">За ROI</option><option value="count">За кількістю ставок</option><option value="name">За назвою</option></select></div></header>
  <div className="sp-table-scroll"><table><thead><tr><th>Стратегія</th><th>Розраховано</th><th>Прибуток</th><th>ROI</th><th>Вінрейт</th></tr></thead><tbody>{rows.map(r=><tr key={r.name} className={active?.name===r.name?'sp-selected':''}><td><button aria-pressed={active?.name===r.name} onClick={()=>setSelected(r.name)}>{r.name}<ArrowRight size={14}/></button>{r.primary&&<span className="sp-primary">Основна</span>}{r.count>0&&r.count<20&&<span className="sp-badge" title="Менше 20 розрахованих ставок — мала вибірка, а не оцінка надійності">Мало даних</span>}</td><td>{r.count}</td><td className={tone(r.profit)}>{r.count?money(r.profit):'—'}</td><td className={tone(r.roi)}>{percent(r.roi)}</td><td>{percent(r.winRate)}</td></tr>)}</tbody></table></div>
  {!rows.length&&<div className="sp-empty">{query?'За цим запитом стратегій не знайдено.':'Створіть стратегію та прив’яжіть до неї записи, щоб порівнювати результати.'}</div>}
  <p className="sp-footnote">Порівнюйте результат разом із кількістю ставок. «Мало даних» — менше 20 розрахованих ставок.</p></section>
  {active&&<div className="sp-bottom"><section className="sp-panel sp-chart"><header><div><h2>Динаміка результату</h2><p>{active.name} · накопичений {metric==='profit'?'прибуток':'ROI'}</p></div><div className="sp-toggle">{(['profit','roi'] as const).map(m=><button key={m} aria-pressed={metric===m} onClick={()=>setMetric(m)}>{m==='profit'?'Прибуток':'ROI'}</button>)}</div></header>
  {series.length?<><div className="sp-chart-canvas"><ResponsiveContainer width="100%" height="100%"><LineChart data={series} margin={{top:16,right:20,left:4,bottom:8}}><CartesianGrid stroke="#e8e8e2" vertical={false}/><XAxis dataKey="index" tickFormatter={n=>series[Number(n)-1]?.date.slice(0,5)||''} minTickGap={35}/><YAxis width={65} tickFormatter={n=>`${number(Number(n))}${metric==='roi'?'%':''}`}/><Tooltip labelFormatter={n=>series[Number(n)-1]?.date||''} formatter={(v:number)=>metric==='roi'?percent(v):money(v)}/><ReferenceLine y={0} stroke="#aaa"/><Line name={metric==='profit'?'Прибуток':'ROI'} dataKey={metric} type="linear" stroke="#ff693b" strokeWidth={2} dot={series.length===1} isAnimationActive={false}/></LineChart></ResponsiveContainer></div>{series.length<activeBets.length&&<p>На графіку лише записи з коректною датою.</p>}</>:<div className="sp-chart-empty"><BarChart3 size={30} strokeWidth={1.5}/><p>{active.count?'Для графіка потрібні записи з коректними датами.':'Ще немає розрахованих ставок за вибраний період.'}</p></div>}</section>
  <aside className="sp-panel sp-detail"><div className="sp-detail-title"><h2>{active.name}</h2>{active.primary&&<span className="sp-primary">Основна</span>}</div><h3>Результати</h3><dl><div><dt>Виграші</dt><dd>{active.wins}</dd></div><div><dt>Програші</dt><dd>{active.losses}</dd></div></dl><div className="sp-settled">Розраховано<strong>{active.count} ставок</strong></div><p>Минулі результати не гарантують майбутніх.</p><Link to={`/app/my-bets?strategy=${encodeURIComponent(active.name)}`}>Переглянути записи <ArrowRight size={16}/></Link></aside></div>}
 </section>;
}
