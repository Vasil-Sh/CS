import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Sliders, RefreshCw, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

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
}

function simulate(
  initialBank: number,
  betAmount: number,
  avgOdds: number,
  estimatedWinRate: number,
  totalBets: number,
): SimulationResult {
  let bank = initialBank;
  let wins = 0;
  let losses = 0;
  let bestBank = bank;
  let worstBank = bank;
  let bankruptcyStep: number | null = null;

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
  };
}

export default function BankrollSimulator() {
  const [initialBank, setInitialBank] = useState(10000);
  const [betAmount, setBetAmount] = useState(500);
  const [avgOdds, setAvgOdds] = useState(1.8);
  const [estimatedWinRate, setEstimatedWinRate] = useState(55);
  const [totalBets, setTotalBets] = useState(100);

  const [results, setResults] = useState<SimulationResult[]>([]);

  const handleSimulate = (times: number = 1) => {
    const newResults: SimulationResult[] = [];
    for (let i = 0; i < times; i++) {
      newResults.push(simulate(initialBank, betAmount, avgOdds, estimatedWinRate, totalBets));
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

  return (
    <div className="space-y-8">
      {/* Parameters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Початковий банк (₴)</Label>
          <Input type="number" value={initialBank} onChange={(e) => setInitialBank(Number(e.target.value))} min={100} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
            Розмір ставки (₴) <span className="text-[#9CA3AF] font-normal">({profitPercent.toFixed(0)}% банку)</span>
          </Label>
          <Input type="number" value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} min={10} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Середній коефіцієнт</Label>
          <Input type="number" value={avgOdds} onChange={(e) => setAvgOdds(Number(e.target.value))} min={1.01} step={0.05} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Очікуваний вінрейт (%)</Label>
          <Input type="number" value={estimatedWinRate} onChange={(e) => setEstimatedWinRate(Number(e.target.value))} min={1} max={99} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Кількість ставок</Label>
          <Input type="number" value={totalBets} onChange={(e) => setTotalBets(Number(e.target.value))} min={1} max={10000} />
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
