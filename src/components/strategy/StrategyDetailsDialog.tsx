import {useEffect,useState} from 'react';
import {ArrowRight,Shield,X} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogClose} from '@/components/ui/dialog';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {getRiskLabel,parseCriteriaForValidation} from '@/lib/strategyHelpers';
import type {CS2Strategy} from '@/types/strategy';
import {settledBets,summarize,type PerformanceBet} from './strategyPerformanceData';
import './StrategyDetailsDialog.css';
interface Stats {totalBets:number;wins:number;losses:number;pending:number;totalProfit:number;totalStake:number;winRate:number;roi:number}
interface Props {open:boolean;onOpenChange:(open:boolean)=>void;strategy:CS2Strategy|null;stats:Stats|undefined;isPrimary:boolean;bets?:PerformanceBet[];onEdit?:(s:CS2Strategy)=>void}
const fmt=(n:number)=>n.toLocaleString('uk-UA',{maximumFractionDigits:1});
const mode=(s:{enabled:boolean;actionMode:string})=>!s.enabled?'Вимкнено':s.actionMode==='block'?'Блокування':'Попередження';
export default function StrategyDetailsDialog({open,onOpenChange,strategy,stats,isPrimary,bets,onEdit}:Props){
 const [tab,setTab]=useState('overview');
 useEffect(()=>{if(open)setTab('overview');},[open,strategy?.id,strategy?.name]);
 if(!strategy)return null;
 const s=strategy,parsed=parseCriteriaForValidation(s.criteria||[]);
 const min=s.oddsControl?s.oddsControl.enabled?s.oddsControl.minOdds:undefined:s.minOdds??parsed.minOdds;
 const max=s.oddsControl?s.oddsControl.enabled?s.oddsControl.maxOdds:undefined:s.maxOdds??parsed.maxOdds;
 const formats=s.matchFormatRules?s.matchFormatRules.enabled?s.matchFormatRules.allowedFormats:[]:s.allowedFormats??parsed.allowedFormats;
 const types=s.betTypeRules?s.betTypeRules.enabled?s.betTypeRules.allowedTypes:[]:s.allowedBetTypes??parsed.allowedBetTypes;
 const relevant=bets?.filter(b=>b.strategy===s.name);
 const result=relevant?summarize(settledBets(relevant,0)):null;
 const count=relevant?.length??stats?.totalBets??0,settled=result?.count??((stats?.wins??0)+(stats?.losses??0));
 const roi=result?result.roi:stats?.roi,winRate=result?result.winRate:stats?.winRate,profit=result?result.profit:stats?.totalProfit;
 const limits=s.activityLimits;
 const tilt=limits?.enabled&&!!limits.blockAfterLosses;
 const criteria=Array.from(new Set([...(s.criteria||[]),...(s.customRules||[])]));
 const rules: [string,string][]=[];
 const add=(label:string,value:unknown)=>{if(value!==undefined&&value!==null&&value!=='')rules.push([label,Array.isArray(value)?value.join(', ')||'Не задано':String(value)]);};
 add('Коефіцієнти',min!=null||max!=null?`${min??'—'}–${max??'—'}`:'Не задано');add('Формати',formats?.length?formats:'Не задано');add('Тип ставки',types?.length?types:'Не задано');
 const detailed:[string,string][]=[];
 for(const [label,config] of [['Контроль коефіцієнтів',s.oddsControl],['Контроль типів ставок',s.betTypeRules],['Контроль форматів',s.matchFormatRules],['Ліміти активності',s.activityLimits],['Психологічні тригери',s.psychologicalTriggers]] as const){if(config)detailed.push([label,mode(config)]);}
 const extra=(label:string,value:unknown)=>{if(value!==undefined&&value!==null)detailed.push([label,String(value)]);};
 if(s.oddsControl?.enabled&&s.oddsControl.separateForExpress){extra('Експрес: мін. коефіцієнт',s.oddsControl.expressMinOdds);extra('Експрес: макс. коефіцієнт',s.oddsControl.expressMaxOdds);}
 if(s.betTypeRules?.enabled){extra('Максимум подій в експресі',s.betTypeRules.maxEventsInExpress);extra('Мін. коефіцієнт експреса',s.betTypeRules.minTotalExpressOdds);}
 if(limits?.enabled){extra('Ставок на день',limits.maxBetsPerDay);extra('Ставок на матч',limits.maxBetsPerMatch);extra('Пауза між ставками, хв',limits.minPauseBetweenBets);extra('Програшів до паузи',limits.blockAfterLosses);extra('Тривалість паузи, хв',limits.blockDurationMinutes);}
 if(s.psychologicalTriggers?.enabled){extra('Попередження після програшів',s.psychologicalTriggers.warnOnLossStreak);extra('Попередження за коефіцієнта',s.psychologicalTriggers.warnOnHighOdds);extra('Повторна команда',s.psychologicalTriggers.warnOnRepeatTeam?'Попереджати':'Не попереджати');}
 const metrics=<dl className="sd-metrics">{[['Всього ставок',count],['Вінрейт',settled&&winRate!=null?`${fmt(winRate)}%`:'—'],['ROI',settled&&roi!=null?`${fmt(roi)}%`:'—'],['Прибуток',settled&&profit!=null?`${fmt(profit)} ₴`:'—']].map(([label,value])=><div key={label}><dd>{value}</dd><dt>{label}</dt></div>)}</dl>;
 const ruleList=(items:[string,string][]) => <dl className="sd-rules">{items.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
 const protection=tilt?<div className="sd-protection"><Shield size={24}/><div><strong>Тільт-захист: після {limits.blockAfterLosses} програшів поспіль → пауза {limits.blockDurationMinutes??60} хв.</strong><p>{limits.actionMode==='block'?'Під час паузи додавання ставок заблоковане.':'Режим попередження — без блокування додавання ставок.'}</p></div></div>:null;
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sd-dialog" hideCloseButton>
 <header className="sd-header"><span>ОГЛЯД СТРАТЕГІЇ</span><DialogTitle>{s.name}</DialogTitle><DialogDescription>{isPrimary?'Основна · ':''}Ризик: {getRiskLabel(s.riskLevel)}</DialogDescription><DialogClose className="sd-close" aria-label="Закрити огляд"><X size={22}/></DialogClose></header>
 <Tabs value={tab} onValueChange={setTab} className="sd-tabs"><TabsList className="sd-tabbar" aria-label="Розділи огляду стратегії"><TabsTrigger value="overview">Огляд</TabsTrigger><TabsTrigger value="rules">Усі правила{criteria.length?` · ${criteria.length}`:''}</TabsTrigger><TabsTrigger value="results">Результати</TabsTrigger></TabsList>
 <div className="sd-scroll"><TabsContent value="overview"><p className="sd-description">{s.description||'Опис стратегії не додано.'}</p>{metrics}{!settled&&<p className="sd-muted">Ще немає розрахованих ставок.</p>}<section className="sd-section"><h3>Ключові обмеження</h3>{ruleList(rules)}{protection}<button className="sd-all" onClick={()=>setTab('rules')}>Усі правила <ArrowRight size={16}/></button></section></TabsContent>
 <TabsContent value="rules"><h3>Обмеження стратегії</h3>{ruleList([...rules,...detailed])}{protection}<section className="sd-section"><h3>Критерії та додаткові правила</h3>{criteria.length?<ol className="sd-criteria">{criteria.map((c,i)=><li key={i}>{c}</li>)}</ol>:<p className="sd-muted">Додаткових критеріїв немає.</p>}</section></TabsContent>
 <TabsContent value="results"><h3>Результати за весь час</h3>{metrics}<p className="sd-muted">ROI та вінрейт враховують лише виграні й програні ставки.</p>{ruleList([['Виграші',String(result?.wins??stats?.wins??0)],['Програші',String(result?.losses??stats?.losses??0)],['Розраховані ставки',String(settled)]])}{!settled&&<p className="sd-empty">Результати з’являться після розрахунку ставок, прив’язаних до цієї стратегії.</p>}<section className="sd-section"><h3>Очікуваний ROI</h3><p>{fmt(s.expectedROI)}% — заданий орієнтир, не фактичний результат і не гарантія прибутку.</p></section><a className="sd-all" href={`/app/my-bets?strategy=${encodeURIComponent(s.name)}`}>Переглянути записи <ArrowRight size={16}/></a></TabsContent></div></Tabs>
 <footer className="sd-footer"><button onClick={()=>onOpenChange(false)}>Закрити</button>{onEdit&&<button className="sd-edit" onClick={()=>{onOpenChange(false);onEdit(s);}}>Редагувати стратегію</button>}</footer>
 </DialogContent></Dialog>;
}
