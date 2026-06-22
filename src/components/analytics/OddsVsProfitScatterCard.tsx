import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle, AlertTriangle } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
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
            <XAxis
              dataKey="odds"
              name="Коефіцієнт"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickFormatter={(value) => Number(value).toFixed(2)}
            />
            <YAxis
              dataKey="profit"
              name="Прибуток"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
            />
            <Tooltip content={<ScatterTooltip />} />
            <Legend
              iconType="plainline"
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            <ReferenceLine
              y={0}
              stroke="#9CA3AF"
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
            <Scatter
              data={data}
              fill="#447afc"
              shape={(props: { cx?: number; cy?: number }) => {
                const { cx, cy } = props;
                return <circle cx={cx} cy={cy} r={5} fill="#447afc" opacity={0.6} stroke="#fff" strokeWidth={1.5} />;
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
