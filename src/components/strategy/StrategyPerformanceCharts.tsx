import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Percent, Trophy, DollarSign } from 'lucide-react';

interface ChartItem {
  name: string; fullName: string; value: number; totalBets: number; riskLevel: string;
}

const getRiskBarColor = (risk: string) => {
  switch (risk) { case 'Low': return '#22C55E'; case 'Medium': return '#F59E0B'; case 'High': return '#EF4444'; default: return '#6B7280'; }
};

const ChartCard = ({ icon: Icon, title, children }: { icon: typeof Percent; title: string; children: React.ReactNode }) => (
  <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
    <div className="px-6 py-5 border-b border-gray-100">
      <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-gray-900" strokeWidth={1.5} /><span className="text-base font-semibold text-gray-900">{title}</span></div>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const tooltipStyle = { backgroundColor: 'rgba(255,255,255,0.98)', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '8px 12px', fontSize: '12px' };
const labelFormatter = (_label: string, payload: { payload: ChartItem }[] | undefined) => {
  if (payload && payload[0]) { const data = payload[0].payload; return `${data.fullName} (${data.totalBets} ставок)`; }
  return _label;
};

interface Props {
  roiData: ChartItem[];
  winRateData: ChartItem[];
  profitData: ChartItem[];
}

export default function StrategyPerformanceCharts({ roiData, winRateData, profitData }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {roiData.length > 0 && (
        <ChartCard icon={Percent} title="ROI стратегій">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roiData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }} />
              <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#6B7280' } }} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={tooltipStyle} formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(1)}%`, 'ROI']} labelFormatter={labelFormatter} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={30}>
                {roiData.map((entry, idx) => (<Cell key={`r-${idx}`} fill={getRiskBarColor(entry.riskLevel)} opacity={0.9} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {winRateData.length > 0 && (
        <ChartCard icon={Trophy} title="Вінрейт стратегій">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={winRateData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }} />
              <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} label={{ value: 'Вінрейт (%)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#6B7280' } }} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={tooltipStyle} formatter={(value: number) => [`${value.toFixed(1)}%`, 'Вінрейт']} labelFormatter={labelFormatter} />
              <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} barSize={30} opacity={0.9} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {profitData.length > 0 && (
        <ChartCard icon={DollarSign} title="Прибуток стратегій">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={profitData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }} />
              <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} label={{ value: 'Прибуток (₴)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#6B7280' } }} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={tooltipStyle} formatter={(value: number) => [`${value > 0 ? '+' : ''}${value}₴`, 'Прибуток']} labelFormatter={labelFormatter} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={30}>
                {profitData.map((entry, idx) => (<Cell key={`p-${idx}`} fill={entry.value >= 0 ? '#22C55E' : '#EF4444'} opacity={0.9} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}
