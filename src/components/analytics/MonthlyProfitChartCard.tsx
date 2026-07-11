import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area } from 'recharts';
import { NumberTicker } from '@/components/ui/number-ticker';

interface MonthlyData {
  month: string;
  profit: number;
  cumulative: number;
  totalBets: number;
}

interface Props {
  data: MonthlyData[];
}

/** Monthly profit line chart with cumulative line — modern redesign */
export default function MonthlyProfitChartCard({ data }: Props) {
  const maxProfit = Math.max(...data.map(m => m.profit));
  const minProfit = Math.min(...data.map(m => m.profit));
  const avgProfit = Math.round(data.reduce((sum, m) => sum + m.profit, 0) / data.length);

  return (
    <Card
      className="border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] rounded-[32px] bg-white overflow-hidden"
    >
      <CardHeader className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
            <div className="p-2.5 bg-blue-50 rounded-2xl">
              <Calendar className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
            </div>
            Прибуток по місяцях
          </CardTitle>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-3 h-0.5 rounded-full bg-emerald-500" /> Прибуток за місяць
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-3 h-0.5 rounded-full bg-blue-500" /> Загальний
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-white border border-emerald-200 text-emerald-600 text-[10px] font-semibold px-2 py-0.5 rounded-lg">
                ▲ <NumberTicker value={maxProfit} />
              </Badge>
              <Badge className="bg-white border border-red-200 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-lg">
                ▼ <NumberTicker value={minProfit} />
              </Badge>
              <Badge className="bg-white border border-gray-200 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-lg">
                ─ <NumberTicker value={avgProfit} />
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-4">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="monthlyProfitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#447afc" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#447afc" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }} tickLine={false} dy={8} />
            <YAxis tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} width={50} />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '12px', padding: '8px 12px' }}
              formatter={(value: number | string, name: string) => { if (name === 'profit') return [`${value} ₴`, 'За місяць']; if (name === 'cumulative') return [`${value} ₴`, 'Загалом']; return [value, name]; }}
              cursor={{ stroke: '#D1D5DB', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <ReferenceLine y={0} stroke="#E5E7EB" strokeWidth={1} />
            <Area type="monotone" dataKey="cumulative" fill="url(#monthlyProfitGrad)" stroke="none" />
            <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} dot={{ r: 4, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }} name="profit" />
            <Line type="monotone" dataKey="cumulative" stroke="#447afc" strokeWidth={2.5} dot={false} activeDot={{ r: 6, fill: '#447afc', stroke: '#fff', strokeWidth: 2 }} name="cumulative" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
