import { useState, useMemo, useEffect, useCallback } from 'react';
import { RefreshCw, Sliders, Target, LineChart, BarChart3, Percent, Download, GitCompare, Trash2, Save, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
  BarChart as ReBarChart, Bar, Cell,
} from 'recharts';
import { toast } from 'sonner';
import { UserDataService } from '@/lib/userDataService';
import type { Bet } from '@/types/betting';

/* ============ Types ============ */

interface SimResult {
  finalBank: number; totalProfit: number; roi: number;
  wins: number; losses: number; winRate: number;
  bestBank: number; worstBank: number; bankruptcyStep: number | null;
  history: { step: number; bank: number }[];
}

type StrategyType = 'flat' | 'flatPercent' | 'kelly';

interface SimParams {
  initialBank: number; betAmount: number; betPercent: number;
  minOdds: number; maxOdds: number; estimatedWinRate: number; totalBets: number;
  stopLoss: number; takeProfit: number; strategy: StrategyType;
}

interface SavedScenario {
  label: string; initialBank: number; betAmount: number; minOdds: number; maxOdds: number;
  estimatedWinRate: number; totalBets: number; description: string; isCustom: boolean;
}

/* ============ Engine ============ */

function calcKelly(wr: number, odds: number): number {
  const b = odds - 1; const p = wr / 100; const q = 1 - p;
  return Math.max(0, Math.min(0.25, (p * b - q) / b));
}

function simulate(p: SimParams): SimResult {
  let bank = p.initialBank;
  let wins = 0, losses = 0, bestBank = bank, worstBank = bank, bankruptcyStep: number | null = null;
  const history: { step: number; bank: number }[] = [{ step: 0, bank: Math.round(bank * 100) / 100 }];
  const kellyFrac = calcKelly(p.estimatedWinRate, (p.minOdds + p.maxOdds) / 2);

  for (let i = 0; i < p.totalBets; i++) {
    if (p.stopLoss > 0 && bank <= p.initialBank - p.stopLoss) { if (bankruptcyStep === null) bankruptcyStep = i; break; }
    if (p.takeProfit > 0 && bank >= p.initialBank + p.takeProfit) { if (bankruptcyStep === null) bankruptcyStep = -1; break; }
    if (bank <= 0) { if (bankruptcyStep === null) bankruptcyStep = i; break; }

    let currentBet: number;
    if (p.strategy === 'flatPercent') currentBet = Math.round(bank * p.betPercent / 100 * 100) / 100;
    else if (p.strategy === 'kelly') currentBet = Math.round(bank * kellyFrac * 100) / 100;
    else currentBet = p.betAmount;

    if (currentBet <= 0 || bank < currentBet) { if (bankruptcyStep === null) bankruptcyStep = i; break; }

    const odds = p.minOdds + Math.random() * (p.maxOdds - p.minOdds);
    const isWin = Math.random() * 100 < p.estimatedWinRate;
    if (isWin) { bank += currentBet * (odds - 1); wins++; }
    else { bank -= currentBet; losses++; }

    if (bank > bestBank) bestBank = bank;
    if (bank < worstBank) worstBank = bank;

    const stepInterval = p.totalBets <= 100 ? 1 : Math.ceil(p.totalBets / 100);
    if ((i + 1) % stepInterval === 0 || i === p.totalBets - 1) {
      history.push({ step: i + 1, bank: Math.round(bank * 100) / 100 });
    }
  }

  return {
    finalBank: Math.round(bank * 100) / 100,
    totalProfit: Math.round((bank - p.initialBank) * 100) / 100,
    roi: p.initialBank > 0 ? Math.round(((bank - p.initialBank) / p.initialBank) * 10000) / 100 : 0,
    wins, losses, winRate: wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0,
    bestBank: Math.round(bestBank * 100) / 100, worstBank: Math.round(worstBank * 100) / 100,
    bankruptcyStep, history,
  };
}

/* ============ Preset scenarios ============ */

const PRESETS: SavedScenario[] = [
  { label: 'Консервативний', initialBank: 10000, betAmount: 200, minOdds: 1.3, maxOdds: 1.7, estimatedWinRate: 60, totalBets: 200, description: '2% банку, кф 1.3–1.7, 60% WR', isCustom: false },
  { label: 'Збалансований', initialBank: 10000, betAmount: 500, minOdds: 1.5, maxOdds: 2.2, estimatedWinRate: 55, totalBets: 200, description: '5% банку, кф 1.5–2.2, 55% WR', isCustom: false },
  { label: 'Агресивний', initialBank: 10000, betAmount: 1000, minOdds: 2.0, maxOdds: 3.0, estimatedWinRate: 45, totalBets: 200, description: '10% банку, кф 2.0–3.0, 45% WR', isCustom: false },
  { label: 'Value betting', initialBank: 10000, betAmount: 500, minOdds: 2.0, maxOdds: 3.5, estimatedWinRate: 44, totalBets: 300, description: 'Value ставки з високими коеф.', isCustom: false },
  { label: 'Мартінгейл', initialBank: 20000, betAmount: 200, minOdds: 1.8, maxOdds: 2.2, estimatedWinRate: 48, totalBets: 100, description: 'Подвоєння після програшу', isCustom: false },
];

const COLORS = ['#447afc', '#16A34A', '#DC2626'];

/* ============ Component ============ */

export default function BankrollSimulator({ resetKey }: { resetKey?: number }) {
  const [initialBank, setInitialBank] = useState(10000);
  const [betAmount, setBetAmount] = useState(500);
  const [betPercent, setBetPercent] = useState(5);
  const [minOdds, setMinOdds] = useState(1.5);
  const [maxOdds, setMaxOdds] = useState(2.2);
  const [estimatedWinRate, setEstimatedWinRate] = useState(55);
  const [totalBets, setTotalBets] = useState(100);
  const [strategy, setStrategy] = useState<StrategyType>('flat');
  const [stopLoss, setStopLoss] = useState(0);
  const [takeProfit, setTakeProfit] = useState(0);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [results, setResults] = useState<SimResult[]>([]);
  const [compareResults, setCompareResults] = useState<{ label: string; finalBank: number; totalProfit: number; roi: number; winRate: number; bankruptcies: number; history: { step: number; bank: number }[] }[] | null>(null);
  const [compareResults
    try {
      const username = localStorage.getItem('username') || 'default';
      const raw = UserDataService.getUserData<any[]>(username, 'strategies_data', []) || [];
      return raw.filter((s: any) => s.minOdds != null || s.maxOdds != null).map((s: any) => ({
        label: s.name || 'Стратегія', initialBank: 10000, betAmount: 500,
        minOdds: Number(s.minOdds) || 1.5, maxOdds: Number(s.maxOdds) || 2.2,
        estimatedWinRate: s.riskLevel === 'Low' ? 58 : s.riskLevel === 'Medium' ? 52 : 45,
        totalBets: 200, description: `${s.riskLevel === 'Low' ? 'Низький' : s.riskLevel === 'Medium' ? 'Середній' : 'Високий'} ризик, коеф. ${s.minOdds}-${s.maxOdds}`,
        isCustom: true,
      }));
    } catch { return []; }
  }, []);

  /* ----- Import real stats from bet history ----- */
  const importRealStats = useCallback(() => {
    try {
      const username = localStorage.getItem('username') || 'default';
      const bets = UserDataService.getUserData<Bet[]>(username, 'mybets_data', []) || [];
      const completed = bets.filter(b => b.result === 'Win' || b.result === 'Loss');
      if (completed.length < 5) { toast.error('Потрібно мінімум 5 завершених ставок'); return; }
      const winCount = completed.filter(b => b.result === 'Win').length;
      const wr = Math.round((winCount / completed.length) * 100);
      const oddsArr = completed.map(b => Number(b.odds)).filter(o => o > 0);
      const avgOdds = oddsArr.length > 0 ? oddsArr.reduce((s, o) => s + o, 0) / oddsArr.length : 1.8;
      const mn = Math.min(...oddsArr, 100);
      const mx = Math.max(...oddsArr, 1);
      const totalStake = completed.reduce((s, b) => s + (b.amount || 0), 0);
      const avgStake = completed.length > 0 ? totalStake / completed.length : 500;
      const bank = totalStake > 0 ? Math.max(1000, totalStake * 2) : 10000;

      setInitialBank(Math.round(bank));
      setBetAmount(Math.round(avgStake));
      setMinOdds(Math.round(mn * 100) / 100);
      setMaxOdds(Math.round(mx * 100) / 100);
      setEstimatedWinRate(wr);
      setActiveScenario(null);
      toast.success(`Імпортовано: WR ${wr}%, коеф. ${mn.toFixed(1)}-${mx.toFixed(1)}`);
    } catch { toast.error('Помилка імпорту даних'); }
  }, []);

  const allScenarios = useMemo(() => [...PRESETS, ...userScenarios], [userScenarios]);

  /* ----- Save current params as scenario ----- */
  const handleSaveScenario = () => {
    const name = prompt('Назва сценарію:', 'Мій сценарій');
    if (!name) return;
    const saved = userScenarios.filter(s => s.isCustom);
    const exists = saved.findIndex(s => s.label === name);
    const newScenario: SavedScenario = {
      label: name, initialBank, betAmount, minOdds, maxOdds,
      estimatedWinRate, totalBets, isCustom: true,
      description: `WR ${estimatedWinRate}%, коеф. ${minOdds}-${maxOdds}`,
    };
    if (exists >= 0) saved[exists] = newScenario; else saved.push(newScenario);
    localStorage.setItem('sim_saved_scenarios', JSON.stringify(saved));
    toast.success(`Сценарій "${name}" збережено!`);
  };

  const applyScenario = (label: string) => {
    const s = allScenarios.find(sc => sc.label === label);
    if (!s) return;
    setInitialBank(s.initialBank); setBetAmount(s.betAmount);
    setMinOdds(s.minOdds); setMaxOdds(s.maxOdds);
    setEstimatedWinRate(s.estimatedWinRate); setTotalBets(s.totalBets);
    setActiveScenario(label);
  };

  const handleSimulate = (times = 1) => {
    const params: SimParams = { initialBank, betAmount, betPercent, minOdds, maxOdds, estimatedWinRate, totalBets, stopLoss, takeProfit, strategy };
    const newResults: SimResult[] = [];
    for (let i = 0; i < times; i++) newResults.push(simulate(params));
    setResults(newResults); setCompareResults(null);
  };

  /* ----- Strategy comparison ----- */
  const handleCompareStrategies = () => {
    const strategies: StrategyType[] = ['flat', 'flatPercent', 'kelly'];
    const allResults = strategies.map(s => {
      const params: SimParams = { initialBank, betAmount, betPercent, minOdds, maxOdds, estimatedWinRate, totalBets, stopLoss, takeProfit, strategy: s };
      const runs: SimResult[] = [];
      const history: { step: number; bank: number }[] = [];
      for (let i = 0; i < 50; i++) {
        const r = simulate(params);
        runs.push(r);
        const stepInterval = totalBets <= 50 ? 1 : Math.ceil(totalBets / 50);
        if (i === 0) r.history.forEach(h => history.push({ step: h.step, bank: h.bank }));
        else r.history.forEach(h => {
          const existing = history.find(e => e.step === h.step);
          if (existing) existing.bank = (existing.bank * i + h.bank) / (i + 1);
          else history.push(h);
        });
      }
      const c = runs.length;
      return {
        label: s === 'flat' ? 'Фіксована' : s === 'flatPercent' ? `% (${betPercent}%)` : 'Келлі',
        finalBank: Math.round(runs.reduce((sum, r) => sum + r.finalBank, 0) / c * 100) / 100,
        totalProfit: Math.round(runs.reduce((sum, r) => sum + r.totalProfit, 0) / c * 100) / 100,
        roi: Math.round(runs.reduce((sum, r) => sum + r.roi, 0) / c * 100) / 100,
        winRate: Math.round(runs.reduce((sum, r) => sum + r.winRate, 0) / c * 100) / 100,
        bankruptcies: runs.filter(r => r.bankruptcyStep !== null && r.bankruptcyStep >= 0).length,
        history: history.sort((a, b) => a.step - b.step),
      };
    });
    setCompareResults(allResults); setResults([]);
    toast.success('Порівняння стратегій готове!');
  };

  /* ----- CSV export + Reset ----- */
  const handleExportCSV = () => {
    if (results.length === 0) { toast.error('Немає результатів'); return; }
    const headers = ['Симуляція', 'Фінальний банк', 'Профіт', 'ROI %', 'Wins', 'Losses', 'Win Rate %', 'Найкращий банк', 'Найгірший банк', 'Банкрутство'];
    const rows = results.map((r, idx) => [idx + 1, r.finalBank, r.totalProfit, r.roi, r.wins, r.losses, r.winRate, r.bestBank, r.worstBank, r.bankruptcyStep ?? '—']);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `sim-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success(`CSV експортовано! (${results.length} симуляцій)`);
  };

  const handleReset = () => {
    setResults([]); setCompareResults(null); setActiveScenario(null);
    setInitialBank(10000); setBetAmount(500); setBetPercent(5);
    setMinOdds(1.5); setMaxOdds(2.2); setEstimatedWinRate(55); setTotalBets(100);
    setStrategy('flat'); setStopLoss(0); setTakeProfit(0);
    toast.success('Дані симулятора скинуто');
  };

  useEffect(() => { if (resetKey && resetKey > 0) handleReset(); }, [resetKey]);

  /* ----- Computed values ----- */
  const averageResult = useMemo(() => {
    if (results.length === 0) return null;
    const c = results.length;
    return {
      finalBank: Math.round(results.reduce((s, r) => s + r.finalBank, 0) / c * 100) / 100,
      totalProfit: Math.round(results.reduce((s, r) => s + r.totalProfit, 0) / c * 100) / 100,
      roi: Math.round(results.reduce((s, r) => s + r.roi, 0) / c * 100) / 100,
      winRate: Math.round(results.reduce((s, r) => s + r.winRate, 0) / c * 100) / 100,
      bankruptcies: results.filter(r => r.bankruptcyStep !== null && r.bankruptcyStep >= 0).length,
      takeProfits: results.filter(r => r.bankruptcyStep === -1).length,
      bestResult: Math.round(Math.max(...results.map(r => r.bestBank)) * 100) / 100,
      worstResult: Math.round(Math.min(...results.map(r => r.finalBank)) * 100) / 100,
    };
  }, [results]);

  const avgOdds = (minOdds + maxOdds) / 2;
  const kellyFraction = calcKelly(estimatedWinRate, avgOdds);
  const kellyAmount = initialBank * kellyFraction;
  const profitPercent = initialBank > 0 ? (betAmount / initialBank) * 100 : 0;
  const strategyLabel = (s: StrategyType) => s === 'flat' ? 'Фіксована сума' : s === 'flatPercent' ? `% від банку (${betPercent}%)` : `Келлі (${(kellyFraction * 100).toFixed(1)}%)`;

  /* ----- Chart data ----- */
  const chartData = useMemo(() => {
    if (results.length === 0 || results.length > 5) return null;
    const allSteps = new Set<number>(); results.forEach(r => r.history.forEach(h => allSteps.add(h.step)));
    return [...allSteps].sort((a, b) => a - b).map(step => {
      const point: Record<string, unknown> = { step };
      results.forEach((r, idx) => { const e = r.history.find(h => h.step === step); point[`run${idx + 1}`] = e ? e.bank : null; });
      return point;
    });
  }, [results]);

  const histogramData = useMemo(() => {
    if (results.length < 20) return null;
    const profits = results.map(r => r.totalProfit);
    const mn = Math.min(...profits), mx = Math.max(...profits);
    const n = Math.min(20, Math.ceil(results.length / 5));
    const w = (mx - mn) / n || 1;
    return Array.from({ length: n }, (_, i) => {
      const lo = mn + i * w, hi = lo + w;
      const count = profits.filter(p => p >= lo && (i === n - 1 ? p <= mx : p < hi)).length;
      return { range: `${Math.round(lo)}..${Math.round(hi)}`, count, color: lo >= 0 ? '#16A34A' : hi <= 0 ? '#DC2626' : '#D97706' };
    });
  }, [results]);

  const heatmapData = useMemo(() => {
    const oddsVals = [1.3, 1.5, 1.8, 2.0, 2.5, 3.0];
    const wrVals = [35, 40, 45, 50, 55, 60, 65, 70];
    return { wrValues: wrVals, oddsValues: oddsVals, data: oddsVals.map(odds => ({ odds: String(odds), ...Object.fromEntries(wrVals.map(wr => { const p = wr / 100; const b = odds - 1; return [`wr${wr}`, Math.round((p * b - (1 - p)) * 10000) / 100]; })) })) };
  }, []);

  const compareChartData = useMemo(() => {
    if (!compareResults) return null;
    const allSteps = new Set<number>(); compareResults.forEach(r => r.history.forEach(h => allSteps.add(h.step)));
    return [...allSteps].sort((a, b) => a - b).map(step => {
      const point: Record<string, unknown> = { step };
      compareResults.forEach((r, idx) => { const e = r.history.find(h => h.step === step); point[`strat${idx}`] = e ? Math.round(e.bank) : null; });
      return point;
    });
  }, [compareResults]);

  return (
    <div className="space-y-8">
      {/* ── Scenarios ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Готові сценарії</Label>
          <div className="flex items-center gap-2">
            <Button onClick={importRealStats} variant="outline" size="sm" className="gap-1 text-xs rounded-xl border-[#16A34A] text-[#16A34A] hover:bg-[#F0FDF4]"><TrendingUp className="h-3.5 w-3.5" /> Імпорт з історії</Button>
            <Button onClick={handleSaveScenario} variant="outline" size="sm" className="gap-1 text-xs rounded-xl"><Save className="h-3.5 w-3.5" /> Зберегти</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {allScenarios.map(s => {
            const isActive = activeScenario === s.label;
            return (<button key={s.label} onClick={() => applyScenario(s.label)} className={`text-left p-3 rounded-2xl border transition-all ${isActive ? 'border-[#447afc] bg-[#EFF6FF] ring-1 ring-[#447afc]' : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'}`} title={s.description}><p className={`text-xs font-semibold ${isActive ? 'text-[#447afc]' : 'text-[#111827]'}`}>{s.label}{s.isCustom ? ' ⚡' : ''}</p><p className="text-[10px] text-[#9CA3AF] mt-0.5 leading-tight">{s.description}</p></button>);
          })}
        </div>
      </div>

      {/* ── Strategy selector ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Стратегія ставок</Label>
          <Select value={strategy} onValueChange={v => setStrategy(v as StrategyType)}>
            <SelectTrigger className="rounded-xl border-[#E5E7EB] h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="flat">Фіксована сума</SelectItem>
              <SelectItem value="flatPercent">% від банку</SelectItem>
              <SelectItem value="kelly">Критерій Келлі</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Келлі-ставка (авто)</Label>
          <div className="h-10 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] flex items-center px-3 text-sm font-mono">
            <Percent className="h-3.5 w-3.5 text-[#447afc] mr-2" />
            <span className="text-[#447afc] font-semibold">{(kellyFraction * 100).toFixed(1)}%</span>
            <span className="text-[#9CA3AF] ml-2">≈ {Math.round(kellyAmount).toLocaleString()} ₴</span>
          </div>
        </div>
      </div>

      {/* ── Parameters ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Param label="Початковий банк (₴)" value={initialBank} set={setInitialBank} min={100} onSet={() => setActiveScenario(null)} />
        {strategy === 'flatPercent'
          ? <Param label="% від банку" value={betPercent} set={setBetPercent} min={0.1} max={25} step={0.5} onSet={() => setActiveScenario(null)} />
          : <Param label={`Розмір ставки (₴) (${profitPercent.toFixed(0)}% банку)`} value={betAmount} set={setBetAmount} min={10} onSet={() => setActiveScenario(null)} />
        }
        <div className="space-y-2 flex flex-col">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider h-8 flex items-end text-center justify-center">Мін. коефіцієнт</Label>
          <Input type="number" value={minOdds} onChange={e => { setMinOdds(Number(e.target.value)); setActiveScenario(null); }} min={1.01} step={0.05} />
        </div>
        <div className="space-y-2 flex flex-col">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider h-8 flex items-end text-center justify-center">Макс. коефіцієнт</Label>
          <Input type="number" value={maxOdds} onChange={e => { setMaxOdds(Number(e.target.value)); setActiveScenario(null); }} min={1.01} step={0.05} />
        </div>
        <Param label="Очікуваний вінрейт (%)" value={estimatedWinRate} set={setEstimatedWinRate} min={1} max={99} onSet={() => setActiveScenario(null)} />
        <Param label="Кількість ставок" value={totalBets} set={setTotalBets} min={1} max={10000} onSet={() => setActiveScenario(null)} />
      </div>

      {/* ── Stop-loss / Take-profit ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 flex flex-col">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider h-8 flex items-end">Макс. втрати (₴) <span className="text-[#9CA3AF] font-normal ml-1">(0 = без ліміту)</span></Label>
          <Input type="number" value={stopLoss} onChange={e => { setStopLoss(Number(e.target.value)); setActiveScenario(null); }} min={0} step={100} />
        </div>
        <div className="space-y-2 flex flex-col">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider h-8 flex items-end">Цільовий прибуток (₴) <span className="text-[#9CA3AF] font-normal ml-1">(0 = без ліміту)</span></Label>
          <Input type="number" value={takeProfit} onChange={e => { setTakeProfit(Number(e.target.value)); setActiveScenario(null); }} min={0} step={100} />
        </div>
      </div>

      {/* ── Run buttons ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={() => handleSimulate(1)} className="gap-2 bg-[#447afc] hover:bg-[#3568d4]" size="sm"><RefreshCw className="h-4 w-4" /> Симулювати 1 раз</Button>
        <Button onClick={() => handleSimulate(100)} variant="outline" className="gap-2" size="sm"><Sliders className="h-4 w-4" /> 100 разів</Button>
        <Button onClick={() => handleSimulate(1000)} variant="outline" className="gap-2" size="sm"><Target className="h-4 w-4" /> 1000 разів</Button>
        <Button onClick={handleCompareStrategies} variant="outline" className="gap-2 border-[#D97706] text-[#D97706] hover:bg-[#FFF7ED]" size="sm"><GitCompare className="h-4 w-4" /> Порівняти стратегії</Button>
        {results.length > 0 && (<Button onClick={handleExportCSV} variant="outline" className="gap-2" size="sm"><Download className="h-4 w-4" /> CSV</Button>)}
        <span className="text-xs text-[#9CA3AF] ml-auto">{strategyLabel(strategy)}</span>
      </div>

      {/* ── Strategy Comparison (line chart) ── */}
      {compareResults && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-[#374151]">Порівняння стратегій (50 симуляцій кожна)</h3>
          {compareChartData && (
            <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
              <div className="flex items-center gap-2 mb-4"><LineChart className="h-5 w-5 text-[#447afc]" strokeWidth={2} /><p className="text-sm font-semibold text-[#111827]">Графік порівняння</p></div>
              <ResponsiveContainer width="100%" height={260}>
                <ReLineChart data={compareChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="step" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.98)', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '8px 12px', fontSize: '12px' }} formatter={(v: number) => [`${v.toLocaleString()} ₴`, undefined]} labelFormatter={l => `Крок ${l}`} />
                  <Legend iconType="plainline" />
                  {compareResults.map((_, idx) => (<Line key={idx} type="monotone" dataKey={`strat${idx}`} stroke={COLORS[idx]} strokeWidth={2} dot={false} name={compareResults[idx].label} />))}
                </ReLineChart>
              </ResponsiveContainer>
            </Card>
          )}
          <div className="grid grid-cols-3 gap-4">
            {compareResults.map((sr, idx) => (
              <Card key={sr.label} className={`p-5 rounded-2xl border-2 ${['border-[#447afc]', 'border-[#16A34A]', 'border-[#DC2626]'][idx]}`}>
                <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider mb-2">{sr.label}</p>
                <p className={`text-2xl font-bold ${sr.totalProfit >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{sr.totalProfit >= 0 ? '+' : ''}{sr.totalProfit.toLocaleString()} ₴</p>
                <p className="text-sm text-[#6B7280] mt-1">ROI: {sr.roi >= 0 ? '+' : ''}{sr.roi}% · WR: {sr.winRate}%</p>
                <p className={`text-sm mt-1 ${sr.bankruptcies > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>Банкрутств: {sr.bankruptcies}/50</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Heatmap ── */}
      <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
        <div className="flex items-center gap-2 mb-4"><BarChart3 className="h-5 w-5 text-[#447afc]" strokeWidth={2} /><p className="text-sm font-semibold text-[#111827]">ROI залежно від вінрейту × коефіцієнта</p></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr><th className="p-2 text-[#9CA3AF] font-medium">Коеф.\WR</th>{heatmapData.wrValues.map(wr => <th key={wr} className="p-2 text-[#9CA3AF] font-medium text-center">{wr}%</th>)}</tr></thead>
            <tbody>{heatmapData.data.map(row => (<tr key={row.odds}><td className="p-2 font-semibold text-[#111827]">{row.odds}</td>{heatmapData.wrValues.map(wr => { const val = row[`wr${wr}`] as number; const cls = val > 10 ? 'bg-[#DCFCE7] text-[#16A34A]' : val > 0 ? 'bg-[#F0FDF4] text-[#16A34A]' : val > -10 ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#FEE2E2] text-[#DC2626]'; return <td key={wr} className={`p-2 text-center font-mono rounded-md ${cls}`}>{val > 0 ? '+' : ''}{val}%</td>; })}</tr>))}</tbody>
          </table>
        </div>
      </Card>

      {/* ── Results ── */}
      {averageResult && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-[#374151]">Результати ({results.length} симуляцій)</h3>

          {chartData && (
            <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
              <div className="flex items-center gap-2 mb-4"><LineChart className="h-5 w-5 text-[#447afc]" /><p className="text-sm font-semibold text-[#111827]">Графік зміни банку</p></div>
              <ResponsiveContainer width="100%" height={280}>
                <ReLineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="step" tick={{ fontSize: 11, fill: '#9CA3AF' }} /><YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.98)', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '8px 12px', fontSize: '12px' }} formatter={(v: number) => [`${v.toLocaleString()} ₴`, undefined]} labelFormatter={l => `Крок ${l}`} />
                  <Legend formatter={(v: string) => `Сим. ${v.replace('run', '')}`} iconType="plainline" />
                  {results.map((_, idx) => (<Line key={idx} type="monotone" dataKey={`run${idx + 1}`} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={false} connectNulls />))}
                </ReLineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {histogramData && (
            <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
              <div className="flex items-center gap-2 mb-4"><BarChart3 className="h-5 w-5 text-[#447afc]" /><p className="text-sm font-semibold text-[#111827]">Розподіл результатів</p></div>
              <ResponsiveContainer width="100%" height={240}>
                <ReBarChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis dataKey="range" tick={{ fontSize: 10, fill: '#9CA3AF' }} angle={-45} textAnchor="end" height={50} /><YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.98)', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '8px 12px', fontSize: '12px' }} formatter={(v: number) => [`${v}`, 'Кількість']} labelFormatter={l => `Прибуток ${l} ₴`} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>{histogramData.map((e, i) => <Cell key={`c-${i}`} fill={e.color} />)}</Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </Card>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi label="Середній фінальний банк" value={`${averageResult.finalBank.toLocaleString()} ₴`} color={averageResult.totalProfit >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'} />
            <Kpi label="Середній профіт" value={`${averageResult.totalProfit >= 0 ? '+' : ''}${averageResult.totalProfit.toLocaleString()} ₴`} color={averageResult.totalProfit >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'} />
            <Kpi label="Середній ROI" value={`${averageResult.roi >= 0 ? '+' : ''}${averageResult.roi}%`} color={averageResult.roi >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'} />
            <Kpi label="Банкрутств" value={`${averageResult.bankruptcies}/${results.length} (${(averageResult.bankruptcies / results.length * 100).toFixed(1)}%)`} color={averageResult.bankruptcies > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi label="Найкращий результат" value={`${averageResult.bestResult.toLocaleString()} ₴`} color="text-[#16A34A]" small />
            <Kpi label="Найгірший результат" value={`${averageResult.worstResult.toLocaleString()} ₴`} color="text-[#DC2626]" small />
            {(() => { const ev = (estimatedWinRate / 100) * betAmount * (avgOdds - 1) - ((100 - estimatedWinRate) / 100) * betAmount; return <Kpi key="ev" label="EV" value={`${ev > 0 ? '+' : ''}${ev.toFixed(0)} ₴/ставка`} color={ev > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'} small />; })()}
            {(() => { const rl = results.filter(r => r.bankruptcyStep !== null && r.bankruptcyStep >= 0).length / results.length * 100; const c = rl > 20 ? 'text-[#DC2626]' : rl > 5 ? 'text-[#D97706]' : 'text-[#16A34A]'; return <Kpi key="risk" label="Ризик банкрутства" value={`${rl.toFixed(1)}%`} color={c} small />; })()}
          </div>

          {averageResult.takeProfits > 0 && (
            <Card className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl">
              <p className="text-sm text-[#16A34A]">Ціль досягнуто у {averageResult.takeProfits}/{results.length} ({((averageResult.takeProfits / results.length) * 100).toFixed(1)}%)</p>
            </Card>
          )}

          {results.length <= 5 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider">Деталі кожної симуляції</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.map((r, idx) => (
                  <Card key={idx} className="p-4 bg-white border border-[#F3F4F6] rounded-2xl">
                    <p className="text-xs text-[#9CA3AF] font-semibold uppercase tracking-wider mb-2">Симуляція #{idx + 1}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-[#6B7280]">Фін. банк:</span><span className={`font-bold ${r.totalProfit >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{r.finalBank.toLocaleString()} ₴</span>
                      <span className="text-[#6B7280]">Профіт:</span><span className={`font-bold ${r.totalProfit >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{r.totalProfit >= 0 ? '+' : ''}{r.totalProfit.toLocaleString()} ₴</span>
                      <span className="text-[#6B7280]">W/L:</span><span className="font-bold text-[#111827]">{r.wins}W / {r.losses}L</span>
                      <span className="text-[#6B7280]">ROI:</span><span className={`font-bold ${r.roi >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{r.roi >= 0 ? '+' : ''}{r.roi}%</span>
                      {r.bankruptcyStep !== null && r.bankruptcyStep >= 0 && (<><span className="text-[#DC2626]">Банкрутство:</span><span className="font-bold text-[#DC2626]">на кроці {r.bankruptcyStep}</span></>)}
                      {r.bankruptcyStep === -1 && (<><span className="text-[#16A34A]">Ціль:</span><span className="font-bold text-[#16A34A]">досягнуто</span></>)}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Micro Param component ── */
function Param({ label, value, set, min, max, step, onSet }: { label: string; value: number; set: (v: number) => void; min?: number; max?: number; step?: number; onSet: () => void }) {
  return (
    <div className="space-y-2 flex flex-col">
      <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider h-8 flex items-end text-center justify-center">{label}</Label>
      <Input type="number" value={value} onChange={e => { set(Number(e.target.value)); onSet(); }} min={min} max={max} step={step} />
    </div>
  );
}

/* ── KPI card ── */
function Kpi({ label, value, color, small }: { label: string; value: string; color: string; small?: boolean }) {
  return <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl"><p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">{label}</p><p className={`font-bold mt-2 ${color} ${small ? 'text-2xl' : 'text-3xl'}`}>{value}</p></Card>;
}
