import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { BalanceData } from '@/types/betting';

interface BalanceChartProps {
  data: BalanceData[];
}

export default function BalanceChart({ data }: BalanceChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const initialBalance = data[0]?.balance || 1000;

  interface CustomTooltipProps {
    active?: boolean;
    payload?: { payload: BalanceData }[];
  }

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const date = new Date(d.date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return (
        <div className="bg-white/98 p-3 rounded-xl shadow-lg border border-[#E5E7EB] text-xs">
          <p className="font-bold text-[#111827] mb-1">Дата: {date}</p>
          {d.betName && <p className="text-[#6B7280]">Прогноз: {d.betName}</p>}
          {d.odds && <p className="text-[#6B7280]">Коеф.: {Number(d.odds).toFixed(2)}</p>}
          <p className={`font-bold ${d.profit >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
            Профіт: {d.profit >= 0 ? '+' : ''}{Number(d.profit).toFixed(2)} ₴
          </p>
          <p className="font-bold text-[#111827]">Банк: {Number(d.balance).toFixed(2)} ₴</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border border-[#D1D5DB] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] rounded-2xl bg-white overflow-hidden">
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
          <LineChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }}
              axisLine={{ stroke: '#9CA3AF', strokeWidth: 1.5 }}
              tickLine={{ stroke: '#9CA3AF' }}
              tickFormatter={(value) => {
                const d = new Date(value);
                return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }}
              axisLine={{ stroke: '#9CA3AF', strokeWidth: 1.5 }}
              tickLine={{ stroke: '#9CA3AF' }}
              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
              label={{ value: 'Баланс (₴)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#9CA3AF' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={() => 'Баланс'}
              iconType="plainline"
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            <ReferenceLine
              y={initialBalance}
              stroke="#9CA3AF"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{ value: `Початковий`, position: 'insideTopRight', style: { fontSize: 10, fill: '#9CA3AF', fontWeight: 500 } }}
            />
            <Line
              type="linear"
              dataKey="balance"
              stroke="#447afc"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#447afc', stroke: '#fff', strokeWidth: 2 }}
              name="Баланс"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}