import type {CS2Strategy} from '@/types/strategy';
export interface StrategyDraft {
 name:string;description:string;riskLevel:CS2Strategy['riskLevel'];roi:string;
 min:string;max:string;formats:string[];types:string[];criteria:string[];tilt:boolean;losses:string;minutes:string;
}
export const newDraft=():StrategyDraft=>({name:'',description:'',riskLevel:'Medium',roi:'10',min:'',max:'',formats:[],types:[],criteria:[''],tilt:true,losses:'3',minutes:'60'});
export const wizardTemplates:StrategyDraft[]=[
 {...newDraft(),name:'Консервативна стратегія',description:'Обмеження коефіцієнтів і форматів матчів.',riskLevel:'Low',roi:'8',min:'1.3',max:'1.8',formats:['BO3'],types:['Ординар'],criteria:['Аналіз останніх 10 матчів команд']},
 {...newDraft(),name:'Збалансована стратегія',description:'Поєднання ординарів та експресів із контролем суми ставки.',roi:'15',min:'1.5',max:'2.5',formats:['BO1','BO3'],types:['Експрес','Ординар'],criteria:['Розмір ставки 2–3% від банку']},
 {...newDraft(),name:'Агресивна стратегія',description:'Експреси та аналіз андердогів із вищим ризиком.',riskLevel:'High',roi:'25',min:'2',formats:['BO1','BO3'],types:['Експрес'],criteria:['Розмір ставки 5% від банку','Фокус на андердогах']},
];
export const numeric=(value:string)=>Number(value.trim().replace(',','.'));
export function validateDraft(d:StrategyDraft,step:number,strategies:CS2Strategy[]):Record<string,string>{
 const e:Record<string,string>={};
 if(step===0){
  if(!d.name.trim())e.name='Вкажіть назву стратегії.';
  else if(strategies.some(s=>s.name.trim().toLocaleLowerCase()===d.name.trim().toLocaleLowerCase()))e.name='Стратегія з такою назвою вже існує.';
  if(!d.description.trim())e.description='Додайте короткий опис.';
  if(!d.roi.trim()||!Number.isFinite(numeric(d.roi)))e.roi='Вкажіть коректне число.';
  if(strategies.length>=25)e.limit='Максимум 25 стратегій. Спочатку видаліть непотрібну.';
 }else{
  for(const key of ['min','max'] as const)if(d[key].trim()&&(!Number.isFinite(numeric(d[key]))||numeric(d[key])<=1))e[key]='Коефіцієнт має бути більшим за 1.';
  if(d.min.trim()&&d.max.trim()&&numeric(d.min)>numeric(d.max))e.max='Максимум має бути не меншим за мінімум.';
  if(!d.criteria.some(c=>c.trim()))e.criteria='Додайте хоча б один додатковий критерій.';
  if(d.tilt)for(const key of ['losses','minutes'] as const)if(!d[key].trim()||!Number.isSafeInteger(numeric(d[key]))||numeric(d[key])<=0)e[key]='Вкажіть ціле число більше нуля.';
 }
 return e;
}
export function draftToStrategy(d:StrategyDraft):CS2Strategy{
 const min=d.min.trim()?numeric(d.min):undefined,max=d.max.trim()?numeric(d.max):undefined;
 return {id:crypto.randomUUID(),name:d.name.trim(),description:d.description.trim(),riskLevel:d.riskLevel,expectedROI:numeric(d.roi),
  minOdds:min,maxOdds:max,allowedFormats:[...d.formats],allowedBetTypes:[...d.types],
  oddsControl:{enabled:min!==undefined||max!==undefined,minOdds:min,maxOdds:max,actionMode:'block'},
  matchFormatRules:{enabled:d.formats.length>0,allowedFormats:[...d.formats],actionMode:'block'},
  betTypeRules:{enabled:d.types.length>0,allowedTypes:[...d.types],actionMode:'block'},
  criteria:[...new Set(d.criteria.map(c=>c.trim()).filter(Boolean))],
  activityLimits:{enabled:d.tilt,blockAfterLosses:d.tilt?numeric(d.losses):undefined,blockDurationMinutes:d.tilt?numeric(d.minutes):undefined,actionMode:'block'},
 };
}
