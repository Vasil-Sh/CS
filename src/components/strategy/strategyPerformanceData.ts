export interface PerformanceBet { strategy?: string; amount?: number; result?: string; profit?: number; date?: string }
export function settledBets(bets: PerformanceBet[], days: number, now = Date.now()) {
  const cutoff = now - days * 86400000;
  return bets.filter(b => b.strategy && (b.result === 'Win' || b.result === 'Loss') && Number.isFinite(b.amount) && b.amount! > 0 && Number.isFinite(b.profit) && (!days || (Number.isFinite(Date.parse(b.date || '')) && Date.parse(b.date!) >= cutoff && Date.parse(b.date!) <= now)));
}
export function summarize(bets: PerformanceBet[]) {
  const stake = bets.reduce((n,b) => n + (b.amount || 0),0);
  const profit = bets.reduce((n,b) => n + (b.profit || 0),0);
  const wins = bets.filter(b => b.result === 'Win').length;
  return {count:bets.length,profit,roi:stake ? profit/stake*100 : null,winRate:bets.length ? wins/bets.length*100 : null,wins,losses:bets.length-wins};
}
export function performanceSeries(bets: PerformanceBet[]) {
  let profit=0, stake=0;
  return bets.filter(b => Number.isFinite(Date.parse(b.date || ''))).slice().sort((a,b)=>Date.parse(a.date!)-Date.parse(b.date!)).map((b,i)=> {
    profit += b.profit || 0; stake += b.amount || 0;
    return {index:i+1,date:new Date(b.date!).toLocaleDateString('uk-UA'),profit,roi:stake ? profit/stake*100 : 0};
  });
}
