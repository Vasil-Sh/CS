import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface BalanceChartProps {
  data: { date: string; balance: number; profit: number }[];
}

export default function BalanceChart({ data }: BalanceChartProps) {
  const currentBalance = data.length > 0 ? data[data.length - 1].balance : 0;
  const initialBalance = data.length > 0 ? data[0].balance - data[0].profit : 0;
  const totalProfit = currentBalance - initialBalance;
  const profitPercentage = initialBalance > 0 ? ((totalProfit / initialBalance) * 100).toFixed(1) : '0';

  const formatTooltip = (value: number, name: string) => {
    if (name === 'balance') return [`${value.toFixed(2)} ₴`, 'Баланс'];
    return [`${value.toFixed(2)} ₴`, 'Прибуток'];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Динаміка балансу</span>
          <div className="flex items-center gap-2">
            {totalProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalProfit >= 0 ? '+' : ''}{profitPercentage}%
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Початковий</p>
              <p className="text-lg font-semibold">{initialBalance.toFixed(2)} ₴</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Поточний</p>
              <p className="text-lg font-semibold">{currentBalance.toFixed(2)} ₴</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Зміна</p>
              <p className={`text-lg font-semibold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} ₴
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' })}
              />
              <YAxis tickFormatter={(value) => `${value} ₴`} />
              <Tooltip 
                formatter={formatTooltip}
                labelFormatter={(value) => new Date(value).toLocaleDateString('uk-UA')}
              />
              <ReferenceLine y={initialBalance} stroke="#666" strokeDasharray="2 2" />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}