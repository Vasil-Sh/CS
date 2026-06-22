import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line } from 'recharts';

interface MonthlyData {
  month: string;
  profit: number;
  cumulative: number;
  totalBets: number;
}

interface Props {
  data: MonthlyData[];
  chartCardShadow: string;
}

/** Monthly profit bar chart with cumulative line */
export default function MonthlyProfitChartCard({ data, chartCardShadow }: Props) {
  return (
    <Card
      className="border border-[#D1D5DB] rounded-2xl bg-white overflow-hidden"
      style={{ boxShadow: chartCardShadow }}
    >
      <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
        <CardTitle className="flex items-center justify-between text-lg font-semibold text-[#111827]">
          <span className="flex items-center gap-3">
            <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
              <Calendar className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
            </div>
            Прибуток по місяцях
          </span>
          <div className="flex gap-2">
            <Badge className="bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] px-3 py-1.5 rounded-lg border border-[#BBF7D0] font-medium text-xs">
              Прибуток
            </Badge>
            <Badge className="bg-[#F9FAFB] text-[#374151] hover:bg-[#F9FAFB] px-3 py-1.5 rounded-lg border border-[#E5E7EB] font-medium text-xs">
              Кумулятивний
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} barCategoryGap="60%" barGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} axisLine={{ stroke: '#9CA3AF', strokeWidth: 1.5 }} tickLine={{ stroke: '#9CA3AF' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} axisLine={{ stroke: '#9CA3AF', strokeWidth: 1.5 }} tickLine={{ stroke: '#9CA3AF' }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '8px 12px',
                fontSize: '12px',
              }}
              formatter={(value: number | string, name: string) => {
                if (name === 'profit') return [`${value} ₴`, 'Прибуток за місяць'];
                if (name === 'cumulative') return [`${value} ₴`, 'Загальний прибуток'];
                return [value, name];
              }}
              labelFormatter={(label: string) => {
                const monthData = data.find(m => m.month === label);
                if (monthData) return `${label} (${monthData.totalBets} ставок)`;
                return label;
              }}
            />
            <ReferenceLine y={0} stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="6 4" />
            <Bar dataKey="profit" name="profit" maxBarSize={12} radius={[6, 6, 6, 6]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#16A34A' : '#DC2626'} />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#447afc"
              strokeWidth={2.5}
              name="cumulative"
              dot={false}
              activeDot={{ r: 5, fill: '#447afc', stroke: '#fff', strokeWidth: 2 }}
            />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-5 flex items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#10B981]" strokeWidth={1.5} />
            <span className="text-sm text-[#9CA3AF]">Макс:</span>
            <span className="text-sm font-semibold text-[#111827]">
              +{Math.max(...data.map(m => m.profit)).toFixed(0)} ₴
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-[#EF4444]" strokeWidth={1.5} />
            <span className="text-sm text-[#9CA3AF]">Мін:</span>
            <span className="text-sm font-semibold text-[#111827]">
              {Math.min(...data.map(m => m.profit)).toFixed(0)} ₴
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#6B7280]" strokeWidth={1.5} />
            <span className="text-sm text-[#9CA3AF]">Сер:</span>
            <span className="text-sm font-semibold text-[#111827]">
              {(data.reduce((sum, m) => sum + m.profit, 0) / data.length).toFixed(0)} ₴
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
