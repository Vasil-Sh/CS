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
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border-2 border-[#E8E6DC]">
          <p className="text-sm font-bold text-black mb-2">Дата: {date}</p>
          {data.betName && (
            <p className="text-sm text-[#6B6B6B] mb-1">Прогноз: {data.betName}</p>
          )}
          {data.odds && (
            <p className="text-sm text-[#6B6B6B] mb-1">Коеф.: {Number(data.odds).toFixed(2)}</p>
          )}
          <p className={`text-sm font-bold mb-1 ${data.profit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            Профіт: {data.profit >= 0 ? '+' : ''}{Number(data.profit).toFixed(2)} ₴
          </p>
          <p className="text-sm font-bold text-[#3D3D3D]">
            Банк: {Number(data.balance).toFixed(2)} ₴
          </p>
        </div>
      );
    }
    return null;
  };

  // Determine point colors based on profit
  const getPointColor = (profit: number) => {
    if (profit > 0) return '#10B981'; // emerald green - success
    if (profit < 0) return '#EF4444'; // red - loss
    return '#9CA3AF'; // gray - neutral
  };

  interface DotProps {
    cx?: number;
    cy?: number;
    payload: BalanceData;
  }

  return (
    <Card className="border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] rounded-2xl bg-white overflow-hidden">
      <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-[#111827]">
          <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
            <TrendingUp className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
          </div>
          Баланс в часі
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <defs>
              <linearGradient id="balanceLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.6} />
                <stop offset="50%" stopColor="#10B981" stopOpacity={1} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="balanceAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DC" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#6B6B6B' }}
              stroke="#D4D2C8"
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
              }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6B6B6B' }}
              stroke="#D4D2C8"
              label={{ value: 'Баланс (₴)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B6B6B' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              y={initialBalance} 
              stroke="#9CA3AF" 
              strokeDasharray="5 5"
              label={{ 
                value: `Початковий банк: ${initialBalance} ₴`, 
                position: 'insideTopRight',
                style: { fontSize: 11, fill: '#6B6B6B', fontWeight: 500 }
              }}
            />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="url(#balanceLineGradient)" 
              strokeWidth={2.5}
              dot={(props: DotProps) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    key={`dot-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={getPointColor(payload.profit)}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 8, strokeWidth: 2, fill: '#059669' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}