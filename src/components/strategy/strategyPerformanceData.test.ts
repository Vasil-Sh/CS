import {describe,it,expect} from 'vitest';
import {settledBets,summarize,performanceSeries} from './strategyPerformanceData';
describe('strategy performance',()=>{
 const bets=[{strategy:'A',amount:100,profit:50,result:'Win',date:'2026-09-01'},{strategy:'A',amount:50,profit:-50,result:'Loss',date:'2026-09-02'},{strategy:'A',amount:900,profit:0,result:'Pending'},{strategy:'A',amount:100,profit:0,result:'Refund'},{amount:100,profit:50,result:'Win'}];
 it('excludes pending, refunds and unassigned records',()=>{expect(settledBets(bets,0)).toHaveLength(2);expect(summarize(settledBets(bets,0))).toEqual({count:2,profit:0,roi:0,winRate:50,wins:1,losses:1});});
 it('uses null percentages without data',()=>{expect(summarize([]).roi).toBeNull();expect(summarize([]).winRate).toBeNull();});
 it('filters by date and ignores future dates in a period',()=>{expect(settledBets(bets,1,Date.parse('2026-09-02'))).toHaveLength(2);expect(settledBets(bets,30,Date.parse('2026-08-31'))).toHaveLength(0);});
 it('builds chronological cumulative ROI from settled stake',()=>{const series=performanceSeries(settledBets(bets,0).reverse());expect(series.map(x=>x.profit)).toEqual([50,0]);expect(series.map(x=>x.roi)).toEqual([50,0]);});
});
