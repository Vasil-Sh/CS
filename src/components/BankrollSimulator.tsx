import { useState, useMemo } from 'react';
import {
  TrendingUp, DollarSign, Sliders, RefreshCw, Target, LineChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface SimulationResult {
  finalBank: number;
  totalProfit: number;
  roi: number;
  wins: number;
  losses: number;
  winRate: number;
  bestBank: number;
  worstBank: number;
  bankruptcyStep: number | null;
  history: { step: number; bank: number }[];
}

interface SimulationParams {
  initialBank: number;
  betAmount: number;
  avgOdds: number;
  estimatedWinRate: number;
  totalBets: number;
}

function simulate(params: SimulationParams): SimulationResult {
  const { initialBank, betAmount, avgOdds, estimatedWinRate, totalBets } = params;
  let bank = initialBank;
  let wins = 0;
  let losses = 0;
  let bestBank = bank;
  let worstBank = bank;
  let bankruptcyStep: number | null = null;
  const history: { step: number; bank: number }[] = [{ step: 0, bank: Math.round(bank * 100) / 100 }];

  for (let i = 0; i < totalBets; i++) {
    if (bank <= 0 || bank < betAmount) {
      if (bankruptcyStep === null) bankruptcyStep = i;
      break;
    }

    const isWin = Math.random() * 100 < estimatedWinRate;

    if (isWin) {
      bank += betAmount * (avgOdds - 1);
      wins++;
    } else {
      bank -= betAmount;
      losses++;
    }

    if (bank > bestBank) bestBank = bank;
    if (bank < worstBank) worstBank = bank;

    const stepInterval = totalBets <= 100 ? 1 : Math.ceil(totalBets / 100);
    if ((i + 1) % stepInterval === 0 || i === totalBets - 1) {
      history.push({ step: i + 1, bank: Math.round(bank * 100) / 100 });
    }
  }

  return {
    finalBank: Math.round(bank * 100) / 100,
    totalProfit: Math.round((bank - initialBank) * 100) / 100,
    roi: initialBank > 0 ? Math.round(((bank - initialBank) / initialBank) * 10000) / 100 : 0,
    wins,
    losses,
    winRate: wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0,
    bestBank: Math.round(bestBank * 100) / 100,
    worstBank: Math.round(worstBank * 100) / 100,
    bankruptcyStep,
    history,
  };
}

const SCENARIOS = [
  { label: 'Консервативний', initialBank: 10000, betAmount: 200, avgOdds: 1.5, estimatedWinRate: 60, totalBets: 200, description: '2% банку, низькі коеф., 60% WR' },
  { label: 'Збалансований', initialBank: 10000, betAmount: 500, avgOdds: 1.8, estimatedWinRate: 55, totalBets: 200, description: '5% банку, середні коеф., 55% WR' },
  { label: 'Агресивний', initialBank: 10000, betAmount: 1000, avgOdds: 2.2, estimatedWinRate: 45, totalBets: 200, description: '10% банку, високі коеф., 45% WR' },
  { label: 'Value betting', initialBank: 10000, betAmount: 500, avgOdds: 2.5, estimatedWinRate: 44, totalBets: 300, description: '+EV з high odds value ставками' },
  { label: 'Мартінгейл', initialBank: 20000, betAmount: 200, avgOdds: 2.0, estimatedWinRate: 48, totalBets: 100, description: 'Подвоєння після програшу, 2.0 коеф.' },
];

const COLORS = ['#447afc', '#16A34A', '#DC2626', '#D97706', '#6D28D9'];

export default function BankrollSimulator() {
  const [initialBank, setInitialBank] = useState(10000);
  const [betAmount, setBetAmount] = useState(500);
  const [avgOdds, setAvgOdds] = useState(1.8);
  const [estimatedWinRate, setEstimatedWinRate] = useState(55);
  const [totalBets, setTotalBets] = useState(100);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const [results, setResults] = useState<SimulationResult[]>([]);

  const applyScenario = (label: string) => {
    const s = SCENARIOS.find(sc => sc.label === label);
    if (!s) return;
    setInitialBank(s.initialBank);
    setBetAmount(s.betAmount);
    setAvgOdds(s.avgOdds);
    setEstimatedWinRate(s.estimatedWinRate);
    setTotalBets(s.totalBets);
    setActiveScenario(label);
  };

  const handleSimulate = (times: number = 1) => {
    const params: SimulationParams = { initialBank, betAmount, avgOdds, estimatedWinRate, totalBets };
    const newResults: SimulationResult[] = [];
    for (let i = 0; i < times; i++) {
      newResults.push(simulate(params));
    }
    setResults(newResults);
  };

  const averageResult = useMemo(() => {
    if (results.length === 0) return null;
    const count = results.length;
    return {
      finalBank: Math.round(results.reduce((s, r) => s + r.finalBank, 0) / count * 100) / 100,
      totalProfit: Math.round(results.reduce((s, r) => s + r.totalProfit, 0) / count * 100) / 100,
      roi: Math.round(results.reduce((s, r) => s + r.roi, 0) / count * 100) / 100,
      winRate: Math.round(results.reduce((s, r) => s + r.winRate, 0) / count * 100) / 100,
      bankruptcies: results.filter((r) => r.bankruptcyStep !== null).length,
      bestResult: Math.round(Math.max(...results.map((r) => r.bestBank)) * 100) / 100,
      worstResult: Math.round(Math.min(...results.map((r) => r.finalBank)) * 100) / 100,
    };
  }, [results]);

  const profitPercent = initialBank > 0 ? (betAmount / initialBank) * 100 : 0;

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

  return (
    <div className="space-y-8">
      {/* Scenarios */}
      <div>
        <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider mb-3 block">
          Готові сценарії
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {SCENARIOS.map(s => {
            const isActive = activeScenario === s.label;
            return (
              <button
                key={s.label}
                onClick={() => applyScenario(s.label)}
                className={`text-left p-3 rounded-2xl border transition-all ${
                  isActive
                    ? 'border-[#447afc] bg-[#EFF6FF] ring-1 ring-[#447afc]'
                    : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'
                }`}
                title={s.description}
              >
                <p className={`text-xs font-semibold ${isActive ? 'text-[#447afc]' : 'text-[#111827]'}`}>{s.label}</p>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5 leading-tight">{s.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Parameters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="space-y-2 flex flex-col">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider h-8 flex items-end text-center justify-center">Початковий банк (₴)</Label>
          <Input type="number" value={initialBank} onChange={(e) => { setInitialBank(Number(e.target.value)); setActiveScenario(null); }} min={100} />
        </div>
        <div className="space-y-2 flex flex-col">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider h-8 flex items-end text-center justify-center">
            Розмір ставки (₴) <span className="text-[#9CA3AF] font-normal">({profitPercent.toFixed(0)}% банку)</span>
          </Label>
          <Input type="number" value={betAmount} onChange={(e) => { setBetAmount(Number(e.target.value)); setActiveScenario(null); }} min={10} />
        </div>
        <div className="space-y-2 flex flex-col">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider h-8 flex items-end text-center justify-center">Середній коефіцієнт</Label>
          <Input type="number" value={avgOdds} onChange={(e) => { setAvgOdds(Number(e.target.value)); setActiveScenario(null); }} min={1.01} step={0.05} />
        </div>
        <div className="space-y-2 flex flex-col">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider h-8 flex items-end text-center justify-center">Очікуваний вінрейт (%)</Label>
          <Input type="number" value={estimatedWinRate} onChange={(e) => { setEstimatedWinRate(Number(e.target.value)); setActiveScenario(null); }} min={1} max={99} />
        </div>
        <div className="space-y-2 flex flex-col">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider h-8 flex items-end text-center justify-center">Кількість ставок</Label>
          <Input type="number" value={totalBets} onChange={(e) => { setTotalBets(Number(e.target.value)); setActiveScenario(null); }} min={1} max={10000} />
        </div>
      </div>

      {/* Run buttons */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button onClick={() => handleSimulate(1)} className="gap-2 bg-[#447afc] hover:bg-[#3568d4]">
          <RefreshCw className="h-4 w-4" /> Симулювати 1 раз
        </Button>
        <Button onClick={() => handleSimulate(100)} variant="outline" className="gap-2">
          <Sliders className="h-4 w-4" /> Симулювати 100 разів
        </Button>
        <Button onClick={() => handleSimulate(1000)} variant="outline" className="gap-2">
          <Target className="h-4 w-4" /> Симулювати 1000 разів
        </Button>
      </div>

      {/* Results */}
      {averageResult && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-[#374151]">Результати ({results.length} симуляцій)</h3>

          {/* Bank chart (only for <= 5 runs) */}
          {chartData && (
            <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <LineChart className="h-5 w-5 text-[#447afc]" strokeWidth={2} />
                <p className="text-sm font-semibold text-[#111827]">Графік зміни банку</p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <ReLineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="step" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.98)', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '8px 12px', fontSize: '12px' }}
                    formatter={(value: number) => [`${value.toLocaleString()} ₴`, undefined]}
                    labelFormatter={(label) => `Крок ${label}`}
                  />
                  <Legend formatter={(value: string) => `Симуляція ${value.replace('run', '')}`} iconType="plainline" />
                  {results.map((_, idx) => (
                    <Line key={idx} type="monotone" dataKey={`run${idx + 1}`} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={false} connectNulls />
                  ))}
                </ReLineChart>
              </ResponsiveContainer>
            </Card>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
              <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Середній фінальний банк</p>
              <p className={`text-3xl font-bold mt-2 ${averageResult.totalProfit >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                {averageResult.finalBank.toLocaleString()} ₴
              </p>
            </Card>
            <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
              <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Середній профіт</p>
              <p className={`text-3xl font-bold mt-2 ${averageResult.totalProfit >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                {averageResult.totalProfit >= 0 ? '+' : ''}{averageResult.totalProfit.toLocaleString()} ₴
              </p>
            </Card>
            <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
              <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Середній ROI</p>
              <p className={`text-3xl font-bold mt-2 ${averageResult.roi >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                {averageResult.roi >= 0 ? '+' : ''}{averageResult.roi}%
              </p>
            </Card>
            <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
              <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Банкрутств</p>
              <p className={`text-3xl font-bold mt-2 ${averageResult.bankruptcies > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                {averageResult.bankruptcies} / {results.length}
                <span className="text-sm font-normal text-[#6B7280] ml-1">
                  ({results.length > 0 ? ((averageResult.bankruptcies / results.length) * 100).toFixed(1) : 0}%)
                </span>
              </p>
            </Card>
          </div>

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
              {(() => {
                const ev = (estimatedWinRate / 100) * betAmount * (avgOdds - 1) - ((100 - estimatedWinRate) / 100) * betAmount;
                return (
                  <p className={`text-2xl font-bold mt-2 ${ev > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                    {ev > 0 ? '+' : ''}{ev.toFixed(0)} ₴/ставка
                  </p>
                );
              })()}
            </Card>
            <Card className="p-5 bg-white border border-[#F3F4F6] rounded-2xl">
              <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Ризик банкрутства</p>
              {(() => {
                const riskLevel = results.length > 0
                  ? results.filter((r) => r.bankruptcyStep !== null).length / results.length * 100
                  : 0;
                const color = riskLevel > 20 ? 'text-[#DC2626]' : riskLevel > 5 ? 'text-[#D97706]' : 'text-[#16A34A]';
                return (
                  <p className={`text-2xl font-bold mt-2 ${color}`}>
                    {riskLevel.toFixed(1)}%
                  </p>
                );
              })()}
            </Card>
          </div>

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
                      <span className={`font-bold ${r.totalProfit >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                        {r.finalBank.toLocaleString()} ₴
                      </span>
                      <span className="text-[#6B7280]">Профіт:</span>
                      <span className={`font-bold ${r.totalProfit >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                        {r.totalProfit >= 0 ? '+' : ''}{r.totalProfit.toLocaleString()} ₴
                      </span>
                      <span className="text-[#6B7280]">W/L:</span>
                      <span className="font-bold text-[#111827]">{r.wins}W / {r.losses}L</span>
                      <span className="text-[#6B7280]">ROI:</span>
                      <span className={`font-bold ${r.roi >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                        {r.roi >= 0 ? '+' : ''}{r.roi}%
                      </span>
                      {r.bankruptcyStep !== null && (
                        <>
                          <span className="text-[#DC2626]">Банкрутство:</span>
                          <span className="font-bold text-[#DC2626]">на кроці {r.bankruptcyStep}</span>
                        </>
                      )}
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
