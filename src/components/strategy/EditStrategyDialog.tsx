import { useState } from "react";
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription } from "@/components/ui/dialog";
import { parseCriteriaForValidation } from "@/lib/strategyHelpers";
import type { CS2Strategy } from "@/types/strategy";
export default function EditStrategyDialog({strategy,onClose,onSave}:{strategy:CS2Strategy;onClose:()=>void;onSave:(s:CS2Strategy)=>Promise<void>}) {
 const [description,setDescription]=useState(strategy.description);
 const [risk,setRisk]=useState(strategy.riskLevel);
 const [criteria,setCriteria]=useState((strategy.criteria??[]).join("\n"));
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const structured=!!(strategy.oddsControl||strategy.betTypeRules||strategy.matchFormatRules);
 async function save(){setSaving(true);setError("");try{
  const lines=criteria.split("\n").map(s=>s.trim()).filter(Boolean);
  await onSave({...strategy,description,riskLevel:risk,criteria:lines,...(!structured?{minOdds:undefined,maxOdds:undefined,allowedFormats:undefined,allowedBetTypes:undefined,...parseCriteriaForValidation(lines)}:{})});onClose();
 }catch{setError("Не вдалося зберегти зміни. Спробуйте ще раз.");}finally{setSaving(false);}}
 return <Dialog open onOpenChange={open=>{if(!open&&!saving)onClose();}}><DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-md bg-white text-stone-900"><DialogHeader><DialogTitle className="font-[Oswald] text-2xl">Редагувати стратегію</DialogTitle><DialogDescription>{strategy.name}</DialogDescription></DialogHeader>
 <p className="text-xs text-stone-500">Назва збережена, щоб не порушити зв’язок із записами.</p>
 <label className="grid gap-2 text-sm">Опис<textarea className="border rounded p-2" value={description} onChange={e=>setDescription(e.target.value)}/></label>
 <label className="grid gap-2 text-sm">Ризик<select className="border rounded p-2" value={risk} onChange={e=>setRisk(e.target.value as CS2Strategy["riskLevel"])}><option value="Low">Низький</option><option value="Medium">Середній</option><option value="High">Високий</option></select></label>
 <label className="grid gap-2 text-sm">Критерії — кожен з нового рядка<textarea className="border rounded p-2 min-h-36" value={criteria} onChange={e=>setCriteria(e.target.value)}/></label>
 {structured&&<p className="text-xs text-stone-500">Структуровані обмеження зберігаються без змін; цей список редагує текстові критерії.</p>}
 {error&&<p role="alert" className="text-sm text-red-600">{error}</p>}
 <div className="flex justify-end gap-3"><button disabled={saving} className="border rounded px-4 py-2" onClick={onClose}>Скасувати</button><button disabled={saving} className="rounded px-4 py-2 bg-[#ff693b] disabled:opacity-50" onClick={save}>{saving?"Збереження…":"Зберегти зміни"}</button></div>
 </DialogContent></Dialog>;
}
