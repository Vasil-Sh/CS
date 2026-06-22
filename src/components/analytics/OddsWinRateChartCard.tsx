import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

interface ChartData {
  range: string;
  winRate: number;
  roi: number;
  bets: number;
}

interface Props {
  data: ChartData[];
  chartCardShadow: string;
}

/** Winrate & ROI bar chart by odds category */
export default function OddsWinRateChartCard({ data, chartCardShadow }: Props) {
  return (
    <Card
      className="border border-[#D1D5DB] rounded-2xl bg-white overflow-hidden"
      style={{ boxShadow: chartCardShadow }}
    >
      <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
        <CardTitle className="flex items-center justify-between text-lg font-semibold text-[#111827]">
          <span className="flex items-center gap-3">
            <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
              <BarChart3 className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
            </div>
            Вінрейт & ROI по категоріях коефіцієнтів
          </span>
          <div className="flex gap-2">
            <Badge className="bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] px-3 py-1.5 rounded-lg border border-[#BBF7D0] font-medium text-xs">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#16A34A] mr-1.5" />
              Вінрейт
            </Badge>
            <Badge className="bg-[#EFF6FF] text-[#2563EB] hover:bg-[#EFF6FF] px-3 py-1.5 rounded-lg border border-[#BFDBFE] font-medium text-xs">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#447afc] mr-1.5" />
              ROI
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="range" tick={{ fontSize: 13, fontWeight: 500, fill: '#374151' }} stroke="#E5E7EB" />
            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#E5E7EB"
              label={{ value: '%', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', padding: '12px' }}
              formatter={(value: number | string, name: string) => {
                if (name === 'winRate') return [`${value}%`, 'Вінрейт'];
                if (name === 'roi') return [`${value}%`, 'ROI'];
                return [value, name];
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value: string) => {
                if (value === 'winRate') return <span style={{ color: '#374151', fontSize: '13px' }}>Вінрейт (%)</span>;
                if (value === 'roi') return <span style={{ color: '#374151', fontSize: '13px' }}>ROI (%)</span>;
                return value;
              }}
            />
            <ReferenceLine y={0} stroke="#D1D5DB" strokeWidth={1} />
            <Bar dataKey="winRate" fill="#16A34A" name="winRate" radius={[6, 6, 0, 0]} maxBarSize={80} opacity={0.9} />
            <Bar dataKey="roi" fill="#447afc" name="roi" radius={[6, 6, 0, 0]} maxBarSize={80} opacity={0.9} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
