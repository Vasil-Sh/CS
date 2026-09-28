import { Plus } from "lucide-react";
import "./PlanningLayout.css";
export default function PlanningHeader({title, description, action, onCreate, disabled, metrics}: {title:string; description:string; action:string; onCreate:()=>void; disabled?:boolean; metrics:{label:string; value:string|number}[]}) {
  return <header className="planning-hero"><div className="planning-hero-top"><div><h1>{title}</h1><p>{description}</p></div><button className="planning-create" onClick={onCreate} disabled={disabled}><Plus size={18}/>{action}</button></div><dl className="planning-metrics">{metrics.map(metric=>{const hasValue=typeof metric.value==="number"&&metric.value>0;return <div key={metric.label} className={hasValue?"has-value":undefined}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>;})}</dl></header>;
}
