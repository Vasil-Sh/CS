import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { NumberTicker } from '@/components/ui/number-ticker';
import ScatterTooltip from '@/components/analytics/ScatterTooltip';

interface Props {
  data: Array<{ odds: string | number; profit: string | number }>;
  winCount: number;
  lossCount: number;
  chartCardShadow: string;
}

/** Odds vs Profit scatter chart — modern redesign */
export default function OddsVsProfitScatterCard({ data, winCount, lossCount, chartCardShadow }: Props) {
  return (
    <Card
      className="border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] rounded-[32px] bg-white overflow-hidden"
    >
      <CardHeader className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
            <div className="p-2.5 bg-blue-50 rounded-2xl">
              <Target className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
            </div>
            Коефіцієнти vs Прибуток
          </CardTitle>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Виграш
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Програш
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <Badge className="bg-white border border-emerald-200 text-emerald-600 text-[10px] font-semibold px-2 py-0.5 rounded-lg">
              ✅ <NumberTicker value={winCount} />
            </Badge>
            <Badge className="bg-white border border-red-200 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-lg">
              ✕ <NumberTicker value={lossCount} />
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-4">
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="odds"
              name="Коефіцієнт"
              tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => Number(value).toFixed(2)}
              dy={8}
            />
            <YAxis
              dataKey="profit"
              name="Прибуток"
              tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
              width={50}
            />
            <Tooltip content={<ScatterTooltip />} cursor={{ stroke: '#D1D5DB', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <ReferenceLine y={0} stroke="#E5E7EB" strokeWidth={1} />
            <Scatter
              data={data}
              shape={(props: Record<string, unknown>) => {
                const { cx, cy, payload } = props as { cx?: number; cy?: number; payload?: { fill?: string; result?: string } };
                const isWin = (payload?.result || 'Win') === 'Win';
                return <circle cx={cx} cy={cy} r={6} fill={isWin ? '#10B981' : '#EF4444'} opacity={0.85} stroke="#fff" strokeWidth={2} />;
              }}
              legendType="none"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
