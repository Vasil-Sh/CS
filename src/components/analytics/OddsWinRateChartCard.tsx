import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { NumberTicker } from '@/components/ui/number-ticker';

interface ChartData {
  range: string;
  winRate: number;
  roi: number;
  bets: number;
}

interface Props {
  data: ChartData[];
}

/** Winrate & ROI bar chart by odds category — modern redesign */
export default function OddsWinRateChartCard({ data }: Props) {
  const maxWinRate = Math.max(...data.map(d => d.winRate), 0);
  const maxROI = Math.max(...data.map(d => d.roi), 0);

  return (
    <Card
      className="border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] rounded-[32px] bg-white overflow-hidden"
    >
      <CardHeader className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
            <div className="p-2.5 bg-blue-50 rounded-2xl">
              <BarChart3 className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
            Вінрейт & ROI по коефіцієнтах
          </CardTitle>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-sm bg-emerald-500" /> Вінрейт
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-sm bg-blue-500" /> ROI
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <Badge className="bg-emerald-50 text-emerald-600 text-[10px] font-semibold px-2 py-0.5 rounded-lg border-0">
              ▲ <NumberTicker value={maxWinRate} />%
            </Badge>
            <Badge className="bg-blue-50 text-blue-500 text-[10px] font-semibold px-2 py-0.5 rounded-lg border-0">
              ROI <NumberTicker value={maxROI} />%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-4">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} barCategoryGap="25%" margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="range"
              tick={{ fontSize: 12, fontWeight: 500, fill: '#6B7280' }}
              axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }}
              axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              width={45}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                padding: '8px 12px',
                fontSize: '12px',
              }}
              formatter={(value: number | string, name: string) => {
                if (name === 'winRate') return [`${value}%`, 'Вінрейт'];
                if (name === 'roi') return [`${value}%`, 'ROI'];
                return [value, name];
              }}
            />
            <ReferenceLine y={0} stroke="#E5E7EB" strokeWidth={1} />
            <Bar dataKey="winRate" fill="#10B981" name="winRate" radius={[6, 6, 0, 0]} maxBarSize={60} opacity={0.9} />
            <Bar dataKey="roi" fill="#447afc" name="roi" radius={[6, 6, 0, 0]} maxBarSize={60} opacity={0.9} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
