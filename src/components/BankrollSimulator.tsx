import { useState, useMemo } from 'react';
import { RefreshCw, Sliders, Target, LineChart, BarChart3, Percent } from 'lucide-react';
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
  avgOdds: number; estimatedWinRate: number; totalBets: number;
  stopLoss: number; takeProfit: number; strategy: StrategyType;
}

/* ============ Engine ============ */

function calcKelly(wr: number, odds: number): number {
  const b = odds - 1; // net odds
  const p = wr / 100;
  const q = 1 - p;
  const fraction = (p * b - q) / b;
  return Math.max(0, Math.min(0.25, fraction)); // cap at 25%
}

function simulate(p: SimParams): SimResult {
  let bank = p.initialBank;
  let wins = 0, losses = 0, bestBank = bank, worstBank = bank, bankruptcyStep: number | null = null;
  const history: { step: number; bank: number }[] = [{ step: 0, bank: Math.round(bank * 100) / 100 }];
  let currentBet = p.betAmount;
  const kellyFrac = calcKelly(p.estimatedWinRate, p.avgOdds);

  for (let i = 0; i < p.totalBets; i++) {
    // Stop-loss / Take-profit
    if (p.stopLoss > 0 && bank <= p.initialBank - p.stopLoss) {
      if (bankruptcyStep === null) bankruptcyStep = i;
      break;
    }
    if (p.takeProfit > 0 && bank >= p.initialBank + p.takeProfit) {
      if (bankruptcyStep === null) bankruptcyStep = -1; // -1 = stopped by take-profit
      break;
    }
    if (bank <= 0) {
      if (bankruptcyStep === null) bankruptcyStep = i;
      break;
    }

    // Calculate bet amount based on strategy
    if (p.strategy === 'flatPercent') {
      currentBet = Math.round(bank * p.betPercent / 100 * 100) / 100;
    } else if (p.strategy === 'kelly') {
      currentBet = Math.round(bank * kellyFrac * 100) / 100;
    } else {
      currentBet = p.betAmount;
    }

    if (currentBet <= 0 || bank < currentBet) {
      if (bankruptcyStep === null) bankruptcyStep = i;
      break;
    }

    const isWin = Math.random() * 100 < p.estimatedWinRate;
    if (isWin) { bank += currentBet * (p.avgOdds - 1); wins++; }
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
    wins, losses,
    winRate: wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0,
    bestBank: Math.round(bestBank * 100) / 100,
    worstBank: Math.round(worstBank * 100) / 100,
    bankruptcyStep, history,
  };
}

/* ============ Scenarios ============ */

const SCENARIOS = [
  { label: 'Консервативний', initialBank: 10000, betAmount: 200, avgOdds: 1.5, estimatedWinRate: 60, totalBets: 200, description: '2% банку, низькі коеф., 60% WR' },
  { label: 'Збалансований', initialBank: 10000, betAmount: 500, avgOdds: 1.8, estimatedWinRate: 55, totalBets: 200, description: '5% банку, середні коеф., 55% WR' },
  { label: 'Агресивний', initialBank: 10000, betAmount: 1000, avgOdds: 2.2, estimatedWinRate: 45, totalBets: 200, description: '10% банку, високі коеф., 45% WR' },
  { label: 'Value betting', initialBank: 10000, betAmount: 500, avgOdds: 2.5, estimatedWinRate: 44, totalBets: 300, description: '+EV з high odds value ставками' },
  { label: 'Мартінгейл', initialBank: 20000, betAmount: 200, avgOdds: 2.0, estimatedWinRate: 48, totalBets: 100, description: 'Подвоєння після програшу, 2.0 коеф.' },
];

const COLORS = ['#447afc', '#16A34A', '#DC2626', '#D97706', '#6D28D9'];

/* ============ Component ============ */

export default function BankrollSimulator() {
  const [initialBank, setInitialBank] = useState(10000);
  const [betAmount, setBetAmount] = useState(500);
  const [betPercent, setBetPercent] = useState(5);
  const [avgOdds, setAvgOdds] = useState(1.8);
  const [estimatedWinRate, setEstimatedWinRate] = useState(55);
  const [totalBets, setTotalBets] = useState(100);
  const [strategy, setStrategy] = useState<StrategyType>('flat');
  const [stopLoss, setStopLoss] = useState(0);
  const [takeProfit, setTakeProfit] = useState(0);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [results, setResults] = useState<SimResult[]>([]);

  const applyScenario = (label: string) => {
    const s = SCENARIOS.find(sc => sc.label === label);
    if (!s) return;
    setInitialBank(s.initialBank); setBetAmount(s.betAmount);
    setAvgOdds(s.avgOdds); setEstimatedWinRate(s.estimatedWinRate);
    setTotalBets(s.totalBets); setActiveScenario(label);
  };

  const handleSimulate = (times = 1) => {
    const params: SimParams = { initialBank, betAmount, betPercent, avgOdds, estimatedWinRate, totalBets, stopLoss, takeProfit, strategy };
    const newResults: SimResult[] = [];
    for (let i = 0; i < times; i++) newResults.push(simulate(params));
    setResults(newResults);
  };

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

  const kellyFraction = calcKelly(estimatedWinRate, avgOdds);
  const kellyAmount = initialBank * kellyFraction;
  const profitPercent = initialBank > 0 ? (betAmount / initialBank) * 100 : 0;

  /* ----- chart data for <= 5 runs ----- */
  const chartData = useMemo(() => {
    if (results.length === 0 || results.length > 5) return null;
    const allSteps = new Set<number>();
    results.forEach(r => r.history.forEach(h => allSteps.add(h.step)));
    const sortedSteps = [...allSteps].sort((a, b) => a - b);
    return sortedSteps.map(step => {
      const point: Record<string, unknown> = { step };
      results.forEach((r, idx) => {
        const entry = r.history.find(h => h.step === step);
        point[`run${idx + 1}`] = entry ? entry.bank : null;
      });
      return point;
    });
  }, [results]);

  /* ----- histogram data for 100+ runs ----- */
  const histogramData = useMemo(() => {
    if (results.length < 20) return null;
    const profits = results.map(r => r.totalProfit);
    const min = Math.min(...profits);
    const max = Math.max(...profits);
    const bucketCount = Math.min(20, Math.ceil(results.length / 5));
    const bucketWidth = (max - min) / bucketCount || 1;
    const buckets: { range: string; count: number; color: string }[] = [];
    for (let i = 0; i < bucketCount; i++) {
      const lo = min + i * bucketWidth;
      const hi = lo + bucketWidth;
      const count = profits.filter(p => p >= lo && (i === bucketCount - 1 ? p <= max : p < hi)).length;
      const color = lo >= 0 ? '#16A34A' : hi <= 0 ? '#DC2626' : '#D97706';
      buckets.push({ range: `${Math.round(lo)}..${Math.round(hi)}`, count, color });
    }
    return buckets;
  }, [results]);

  const strategyLabel = (s: StrategyType) => s === 'flat' ? 'Фіксована сума' : s === 'flatPercent' ? `% від банку (${betPercent}%)` : `Келлі (${(kellyFraction * 100).toFixed(1)}%)`;

  return (
    <div className="space-y-8">
      {/* ── Scenarios ── */}
      <div>
        <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider mb-3 block">Готові сценарії</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {SCENARIOS.map(s => {
            const isActive = activeScenario === s.label;
            return (
              <button key={s.label} onClick={() => applyScenario(s.label)}
                className={`text-left p-3 rounded-2xl border transition-all ${isActive ? 'border-[#447afc] bg-[#EFF6FF] ring-1 ring-[#447afc]' : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'}`}
                title={s.description}>
                <p className={`text-xs font-semibold ${isActive ? 'text-[#447afc]' : 'text-[#111827]'}`}>{s.label}</p>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5 leading-tight">{s.description}</p>
              </button>
            );
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

      {/* ── Parameters grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="space-y-2 flex flex-col">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider h-8 flex items-end text-center justify-center">Початковий банк (₴)</Label>
          <Input type="number" value={initialBank} onChange={e => { setInitialBank(Number(e.target.value)); setActiveScenario(null); }} min={100} />
        </div>
        {strategy === 'flatPercent' ? (
          <div className="space-y-2 flex flex-col">
            <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider h-8 flex items-end text-center justify-center">% від банку</Label>
            <Input type="number" value={betPercent} onChange={e => { setBetPercent(Number(e.target.value)); setActiveScenario(null); }} min={0.1} max={25} step={0.5} />
          </div>
        ) : (
          <div className="space-y-2 flex flex-col">
            <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider h-8 flex items-end text-center justify-center">
              Розмір ставки (₴) <span className="text-[#9CA3AF] font-normal">({profitPercent.toFixed(0)}% банку)</span>
            </Label>
            <Input type="number" value={betAmount} onChange={e => { setBetAmount(Number(e.target.value)); setActiveScenario(null); }} min={10} />
          </div>
        )}
        <div className="space-y-2 flex flex-col">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider h-8 flex items-end text-center justify-center">Середній коефіцієнт</Label>
          <Input type="number" value={avgOdds} onChange={e => { setAvgOdds(Number(e.target.value)); setActiveScenario(null); }} min={1.01} step={0.05} />
        </div>
        <div className="space-y-2 flex flex-col">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider h-8 flex items-end text-center justify-center">Очікуваний вінрейт (%)</Label>
          <Input type="number" value={estimatedWinRate} onChange={e => { setEstimatedWinRate(Number(e.target.value)); setActiveScenario(null); }} min={1} max={99} />
        </div>
        <div className="space-y-2 flex flex-col">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider h-8 flex items-end text-center justify-center">Кількість ставок</Label>
          <Input type="number" value={totalBets} onChange={e => { setTotalBets(Number(e.target.value)); setActiveScenario(null); }} min={1} max={10000} />
        </div>
      </div>

      {/* ── Stop-loss / Take-profit ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 flex flex-col">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider h-8 flex items-end text-center justify-center">
            Stop-loss (₴) <span className="text-[#9CA3AF] font-normal">(0 = вимкнено)</span>
          </Label>
          <Input type="number" value={stopLoss} onChange={e => { setStopLoss(Number(e.target.value)); setActiveScenario(null); }} min={0} step={100} />
        </div>
        <div className="space-y-2 flex flex-col">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider h-8 flex items-end text-center justify-center">
            Take-profit (₴) <span className="text-[#9CA3AF] font-normal">(0 = вимкнено)</span>
          </Label>
          <Input type="number" value={takeProfit} onChange={e => { setTakeProfit(Number(e.target.value)); setActiveScenario(null); }} min={0} step={100} />
        </div>
      </div>

      {/* ── Run buttons ── */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button onClick={() => handleSimulate(1)} className="gap-2 bg-[#447afc] hover:bg-[#3568d4]"><RefreshCw className="h-4 w-4" /> Симулювати 1 раз</Button>
        <Button onClick={() => handleSimulate(100)} variant="outline" className="gap-2"><Sliders className="h-4 w-4" /> Симулювати 100 разів</Button>
        <Button onClick={() => handleSimulate(1000)} variant="outline" className="gap-2"><Target className="h-4 w-4" /> Симулювати 1000 разів</Button>
        <span className="text-xs text-[#9CA3AF]">{strategyLabel(strategy)}</span>
      </div>

      {/* ── Results ── */}
      {averageResult && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-[#374151]">Результати ({results.length} симуляцій)</h3>

          {/* Line chart (<=5 runs) */}
          {chartData && (
            <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
              <div className="flex items-center gap-2 mb-4"><LineChart className="h-5 w-5 text-[#447afc]" strokeWidth={2} /><p className="text-sm font-semibold text-[#111827]">Графік зміни банку</p></div>
              <ResponsiveContainer width="100%" height={280}>
                <ReLineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="step" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.98)', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '8px 12px', fontSize: '12px' }}
                    formatter={(value: number) => [`${value.toLocaleString()} ₴`, undefined]} labelFormatter={label => `Крок ${label}`} />
                  <Legend formatter={(value: string) => `Симуляція ${value.replace('run', '')}`} iconType="plainline" />
                  {results.map((_, idx) => (<Line key={idx} type="monotone" dataKey={`run${idx + 1}`} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={false} connectNulls />))}
                </ReLineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Histogram (20+ runs) */}
          {histogramData && (
            <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
              <div className="flex items-center gap-2 mb-4"><BarChart3 className="h-5 w-5 text-[#447afc]" strokeWidth={2} /><p className="text-sm font-semibold text-[#111827]">Розподіл результатів</p></div>
              <ResponsiveContainer width="100%" height={240}>
                <ReBarChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#9CA3AF' }} angle={-45} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.98)', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '8px 12px', fontSize: '12px' }}
                    formatter={(value: number) => [`${value}`, 'Кількість']} labelFormatter={label => `Прибуток ${label} ₴`} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {histogramData.map((entry, idx) => (<Cell key={`cell-${idx}`} fill={entry.color} />))}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* KPI cards row 1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
              <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Середній фінальний банк</p>
              <p className={`text-3xl font-bold mt-2 ${averageResult.totalProfit >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{averageResult.finalBank.toLocaleString()} ₴</p>
            </Card>
            <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
              <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Середній профіт</p>
              <p className={`text-3xl font-bold mt-2 ${averageResult.totalProfit >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{averageResult.totalProfit >= 0 ? '+' : ''}{averageResult.totalProfit.toLocaleString()} ₴</p>
            </Card>
            <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
              <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Середній ROI</p>
              <p className={`text-3xl font-bold mt-2 ${averageResult.roi >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{averageResult.roi >= 0 ? '+' : ''}{averageResult.roi}%</p>
            </Card>
            <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
              <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Банкрутств</p>
              <p className={`text-3xl font-bold mt-2 ${averageResult.bankruptcies > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                {averageResult.bankruptcies} / {results.length}
                <span className="text-sm font-normal text-[#6B7280] ml-1">({results.length > 0 ? ((averageResult.bankruptcies / results.length) * 100).toFixed(1) : 0}%)</span>
              </p>
            </Card>
          </div>

          {/* KPI cards row 2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
              <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Найкращий результат</p>
              <p className="text-2xl font-bold text-[#16A34A] mt-2">{averageResult.bestResult.toLocaleString()} ₴</p>
            </Card>
            <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
              <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Найгірший результат</p>
              <p className="text-2xl font-bold text-[#DC2626] mt-2">{averageResult.worstResult.toLocaleString()} ₴</p>
            </Card>
            <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
              <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Очікуване значення (EV)</p>
              {(() => { const ev = (estimatedWinRate / 100) * betAmount * (avgOdds - 1) - ((100 - estimatedWinRate) / 100) * betAmount;
                return (<p className={`text-2xl font-bold mt-2 ${ev > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{ev > 0 ? '+' : ''}{ev.toFixed(0)} ₴/ставка</p>); })()}
            </Card>
            <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
              <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Ризик банкрутства</p>
              {(() => { const riskLevel = results.length > 0 ? results.filter(r => r.bankruptcyStep !== null && r.bankruptcyStep >= 0).length / results.length * 100 : 0;
                const color = riskLevel > 20 ? 'text-[#DC2626]' : riskLevel > 5 ? 'text-[#D97706]' : 'text-[#16A34A]';
                return (<p className={`text-2xl font-bold mt-2 ${color}`}>{riskLevel.toFixed(1)}%</p>); })()}
            </Card>
          </div>

          {/* Take-profit info */}
          {averageResult.takeProfits > 0 && (
            <Card className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl">
              <p className="text-sm text-[#16A34A]">
                Take-profit спрацював у {averageResult.takeProfits} / {results.length} симуляціях ({(averageResult.takeProfits / results.length * 100).toFixed(1)}%)
              </p>
            </Card>
          )}

          {/* Individual simulation details for <= 5 runs */}
          {results.length <= 5 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider">Деталі кожної симуляції</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.map((r, idx) => (
                  <Card key={idx} className="p-4 bg-white border border-[#F3F4F6] rounded-2xl">
                    <p className="text-xs text-[#9CA3AF] font-semibold uppercase tracking-wider mb-2">Симуляція #{idx + 1}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-[#6B7280]">Фін. банк:</span>
                      <span className={`font-bold ${r.totalProfit >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{r.finalBank.toLocaleString()} ₴</span>
                      <span className="text-[#6B7280]">Профіт:</span>
                      <span className={`font-bold ${r.totalProfit >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{r.totalProfit >= 0 ? '+' : ''}{r.totalProfit.toLocaleString()} ₴</span>
                      <span className="text-[#6B7280]">W/L:</span>
                      <span className="font-bold text-[#111827]">{r.wins}W / {r.losses}L</span>
                      <span className="text-[#6B7280]">ROI:</span>
                      <span className={`font-bold ${r.roi >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{r.roi >= 0 ? '+' : ''}{r.roi}%</span>
                      {r.bankruptcyStep !== null && r.bankruptcyStep >= 0 && (<><span className="text-[#DC2626]">Банкрутство:</span><span className="font-bold text-[#DC2626]">на кроці {r.bankruptcyStep}</span></>)}
                      {r.bankruptcyStep === -1 && (<><span className="text-[#16A34A]">Take-profit:</span><span className="font-bold text-[#16A34A]">досягнуто</span></>)}
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
