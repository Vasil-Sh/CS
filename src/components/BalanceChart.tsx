import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { BalanceData } from '@/types/betting';

interface BalanceChartProps {
  data: BalanceData[];
}

interface TooltipPayload {
  payload: BalanceData;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

export default function BalanceChart({ data }: BalanceChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Calculate initial balance from first data point
  const initialBalance = data[0]?.balance || 1000;

  // Custom tooltip with bet details
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const date = new Date(data.date).toLocaleDateString('uk-UA', { 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric'
      });
      
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border-2 border-gray-200">
          <p className="text-sm font-bold text-gray-900 mb-2">Дата: {date}</p>
          {data.betName && (
            <p className="text-sm text-gray-700 mb-1">Прогноз: {data.betName}</p>
          )}
          {data.odds && (
            <p className="text-sm text-gray-700 mb-1">Коеф.: {Number(data.odds).toFixed(2)}</p>
          )}
          <p className={`text-sm font-bold mb-1 ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Профіт: {data.profit >= 0 ? '+' : ''}{Number(data.profit).toFixed(2)} ₴
          </p>
          <p className="text-sm font-bold text-blue-600">
            Банк: {Number(data.balance).toFixed(2)} ₴
          </p>
        </div>
      );
    }
    return null;
  };

  // Determine point colors based on profit
  const getPointColor = (profit: number) => {
    if (profit > 0) return '#10b981'; // green
    if (profit < 0) return '#ef4444'; // red
    return '#6b7280'; // gray
  };

  interface DotProps {
    cx?: number;
    cy?: number;
    payload: BalanceData;
  }

  return (
    <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
      <CardHeader className="bg-[#F5F5F3] border-b-2 border-[#E8E6DC] p-8">
        <CardTitle className="flex items-center gap-3 text-3xl font-light text-black">
          <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_2px_8px_rgba(244,225,87,0.3)]">
            <TrendingUp className="h-6 w-6 text-black" strokeWidth={1.5} />
          </div>
          Баланс в часі
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
              }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              label={{ value: 'Баланс (₴)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              y={initialBalance} 
              stroke="#9ca3af" 
              strokeDasharray="5 5"
              label={{ 
                value: `Початковий банк: ${initialBalance} ₴`, 
                position: 'insideTopRight',
                style: { fontSize: 11, fill: '#6b7280', fontWeight: 500 }
              }}
            />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={(props: DotProps) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={getPointColor(payload.profit)}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 8, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}