import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserDataService } from "@/lib/userDataService";
import { useAppStore } from "@/stores/appStore";
import "./PlanningLayout.css";
type Item = Record<string, unknown>;
const num = (value:unknown) => new Intl.NumberFormat("uk-UA", {maximumFractionDigits:1}).format(Number(value) || 0);
export default function PlanningPreview({kind,compact=false}:{kind:"strategies"|"goals";compact?:boolean}) {
  const {user}=useAuth(); const username=user?.username || "default";
  const version=useAppStore(s=>s.strategyVersion);
  const primaryId=useAppStore(s=>s.primaryStrategyId);
  const [items,setItems]=useState<Item[]>([]); const [loading,setLoading]=useState(true); const [cached,setCached]=useState(false);
  const [expanded,setExpanded]=useState(()=>typeof window === "undefined" || window.innerWidth>800);
  useEffect(()=>{
    let cancelled=false;
    const local=UserDataService.getUserData<Item[]>(username,kind==="goals"?"goals":"strategies_data",[]);
    setItems(local); setLoading(true); setCached(false);
    const request=kind==="goals"?UserDataService.fetchGoals():UserDataService.fetchStrategies();
    request.then(rows=>{
      if(cancelled)return;
      setItems(rows.map(row=>{
        const config=(row.config || {}) as Item;
        const saved=local.find(i=>i.id===row.id || i._backendId===row.id || i.id===config.id);
        return {...row,...config,...saved,_backendId:row.id};
      }));
    }).catch(()=>{if(!cancelled)setCached(true);}).finally(()=>{if(!cancelled)setLoading(false);});
    return ()=>{cancelled=true;};
  },[username,kind,version]);
  const strategies=kind==="strategies";
  const savedId=primaryId || UserDataService.getUserData<string>(username,"primary_strategy","");
  const primary=strategies ? items.find(i=>[i.id,i.name,i._backendId].includes(savedId)) : items.find(i=>i.isPrimary && i.status!=="completed" && i.status!=="failed" && !i.isCompleted);
  const path=strategies?"/app/strategy":"/app/goals";
  const type=String(primary?.type || "amount");
  const current=primary ? type==="amount"?primary.currentAmount??primary.current:type==="roi"?primary.currentROI??primary.current:type==="winrate"?primary.currentWinRate??primary.current:primary.currentBank??primary.startAmount : 0;
  const target=primary ? primary.targetAmount??primary.targetROI??primary.targetWinRate??primary.targetLadderAmount??primary.target : 0;
  const unit=type==="roi"||type==="winrate"?"%":" ₴";
  if (compact && !strategies) return <aside className="smd-goals-preview"><header><h2>Огляд цілей</h2><Link to={path}>До цілей <ArrowRight size={15}/></Link></header>{loading?<p role="status">Завантаження огляду…</p>:<><span className="planning-preview-label">Основна ціль</span>{primary?<><h3>{String(primary.name || "Без назви")}</h3><p>{num(current)}{unit} із {num(target)}{unit}</p></>:<p>Основну активну ціль ще не обрано.</p>}<p className="smd-goals-count">Усього цілей: {items.length}</p>{cached&&<p>Показано збережені дані. Сервер недоступний.</p>}</>}</aside>;
  return <aside className="planning-preview"><details open={expanded} onToggle={event=>setExpanded(event.currentTarget.open)}><summary>{strategies?"Огляд стратегій":"Огляд цілей"}</summary><div className="planning-preview-body">
    {loading?<p role="status">Завантаження огляду…</p>:<><span className="planning-preview-label">{strategies?"Основна стратегія":"Основна ціль"}</span>{primary?<><h3>{String(primary.name || "Без назви")}</h3>{strategies?<dl><div><dt>Мін. коеф.</dt><dd>{primary.minOdds == null?"—":String(primary.minOdds)}</dd></div><div><dt>Макс. коеф.</dt><dd>{primary.maxOdds == null?"—":String(primary.maxOdds)}</dd></div><div><dt>Формати</dt><dd>{Array.isArray(primary.allowedFormats)?primary.allowedFormats.join(", ") || "Усі":"Усі"}</dd></div></dl>:<dl><div><dt>Поточний результат</dt><dd>{num(current)}{unit}</dd></div><div><dt>Цільове значення</dt><dd>{num(target)}{unit}</dd></div></dl>}</>:<p>{strategies?"Основну стратегію ще не обрано.":"Основну активну ціль ще не обрано."}</p>}<p className="planning-preview-count">Усього {strategies?"стратегій":"цілей"}: {items.length}</p>{cached && <p>Показано збережені дані. Сервер недоступний.</p>}</>}
    <Link to={path}>{strategies?"До стратегій":"До цілей"}<ArrowRight size={15}/></Link>
  </div></details></aside>;
}
