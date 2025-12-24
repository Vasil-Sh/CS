import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function KellyCalculator() {
  const [odds, setOdds] = useState('');
  const [winProbability, setWinProbability] = useState('');
  const [bankroll, setBankroll] = useState('');
  const [kellyPercentage, setKellyPercentage] = useState<number | null>(null);
  const [recommendedBet, setRecommendedBet] = useState<number | null>(null);

  const calculateKelly = () => {
    const oddsValue = parseFloat(odds);
    const probValue = parseFloat(winProbability) / 100;
    const bankrollValue = parseFloat(bankroll);

    if (oddsValue > 0 && probValue > 0 && probValue < 1 && bankrollValue > 0) {
      // Kelly Formula: f = (bp - q) / b
      // where b = odds - 1, p = win probability, q = loss probability (1-p)
      const b = oddsValue - 1;
      const p = probValue;
      const q = 1 - p;
      
      const kelly = (b * p - q) / b;
      const kellyPercent = Math.max(0, kelly * 100); // Не менше 0%
      const recommendedAmount = (kellyPercent / 100) * bankrollValue;

      setKellyPercentage(kellyPercent);
      setRecommendedBet(recommendedAmount);
    }
  };

  const getRiskLevel = (percentage: number): { level: string; color: 'default' | 'secondary' | 'destructive' } => {
    if (percentage === 0) return { level: 'Не ставити', color: 'destructive' };
    if (percentage < 2) return { level: 'Низький ризик', color: 'default' };
    if (percentage < 5) return { level: 'Помірний ризик', color: 'secondary' };
    return { level: 'Високий ризик', color: 'destructive' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Kelly Criterion Калькулятор
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Kelly Criterion допомагає визначити оптимальний розмір ставки 
                  для максимізації довгострокового зростання капіталу
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="odds">Коефіцієнт</Label>
              <Input
                id="odds"
                type="number"
                step="0.01"
                placeholder="2.50"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="probability">Ймовірність виграшу (%)</Label>
              <Input
                id="probability"
                type="number"
                step="1"
                placeholder="55"
                value={winProbability}
                onChange={(e) => setWinProbability(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bankroll">Банкрол (₴)</Label>
              <Input
                id="bankroll"
                type="number"
                step="1"
                placeholder="1000"
                value={bankroll}
                onChange={(e) => setBankroll(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={calculateKelly} className="w-full">
            Розрахувати оптимальну ставку
          </Button>

          {kellyPercentage !== null && recommendedBet !== null && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Kelly відсоток</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {kellyPercentage.toFixed(2)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Рекомендована ставка</p>
                  <p className="text-2xl font-bold text-green-600">
                    {recommendedBet.toFixed(2)} ₴
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <Badge variant={getRiskLevel(kellyPercentage).color}>
                  {getRiskLevel(kellyPercentage).level}
                </Badge>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Рекомендації:</strong></p>
                {kellyPercentage === 0 && (
                  <p>• Ставка не рекомендується - негативне математичне очікування</p>
                )}
                {kellyPercentage > 0 && kellyPercentage < 2 && (
                  <p>• Консервативна ставка - низький ризик, стабільне зростання</p>
                )}
                {kellyPercentage >= 2 && kellyPercentage < 5 && (
                  <p>• Помірна ставка - збалансований ризик та потенціал</p>
                )}
                {kellyPercentage >= 5 && (
                  <p>• Обережно! Високий ризик - розгляньте зменшення ставки</p>
                )}
                <p>• Завжди ставте менше Kelly відсотка для зменшення волатильності</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}