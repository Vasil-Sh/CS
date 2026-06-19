import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle, AlertTriangle } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import ScatterTooltip from '@/components/analytics/ScatterTooltip';

interface Props {
  data: Array<{ odds: string | number; profit: string | number }>;
  winCount: number;
  lossCount: number;
  chartCardShadow: string;
}

/** Odds vs Profit scatter chart */
export default function OddsVsProfitScatterCard({ data, winCount, lossCount, chartCardShadow }: Props) {
  return (
    <Card
      className="border border-[#D1D5DB] rounded-2xl bg-white overflow-hidden"
      style={{ boxShadow: chartCardShadow }}
    >
      <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
        <CardTitle className="flex items-center justify-between text-lg font-semibold text-[#111827]">
          <span className="flex items-center gap-3">
            <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
              <Target className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
            </div>
            Коефіцієнти vs Прибуток
          </span>
          <div className="flex gap-2">
            <Badge className="bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] px-3 py-1.5 rounded-lg border border-[#BBF7D0] font-medium text-xs">
              <CheckCircle className="h-3 w-3 mr-1" strokeWidth={1.5} />
              Виграш
            </Badge>
            <Badge className="bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEF2F2] px-3 py-1.5 rounded-lg border border-[#FECACA] font-medium text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" strokeWidth={1.5} />
              Програш
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <ReferenceLine
              y={0}
              stroke="#6B7280"
              strokeWidth={2}
              strokeDasharray="8 4"
              label={{
                value: 'Нульова лінія',
                position: 'insideTopRight',
                style: { fontSize: 11, fill: '#6B7280', fontWeight: 600 },
              }}
            />
            <XAxis
              dataKey="odds"
              name="Коефіцієнт"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              stroke="#E5E7EB"
              label={{ value: 'Коефіцієнт', position: 'insideBottom', offset: -5, style: { fontSize: 12, fill: '#6B7280' } }}
              tickFormatter={(value) => Number(value).toFixed(2)}
            />
            <YAxis
              dataKey="profit"
              name="Прибуток"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              stroke="#E5E7EB"
              label={{ value: 'Прибуток (₴)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
            />
            <Tooltip content={<ScatterTooltip />} />
            <Scatter
              data={data}
              fill="#8b5cf6"
              shape={(props: { cx?: number; cy?: number; fill?: string }) => {
                const { cx, cy, fill } = props;
                return (
                  <circle cx={cx} cy={cy} r={6} fill={fill} opacity={0.7} stroke={fill} strokeWidth={1} strokeOpacity={0.3} />
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>

        <div className="mt-5 flex items-center justify-center gap-8 px-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10B981]" />
            <span className="text-sm text-[#9CA3AF]">Виграш:</span>
            <span className="text-sm font-semibold text-[#111827]">{winCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
            <span className="text-sm text-[#9CA3AF]">Програш:</span>
            <span className="text-sm font-semibold text-[#111827]">{lossCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
