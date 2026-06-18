import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface MiniDonutProps {
  value: number;
  total: number;
  colors: { main: string; sub1: string; sub2: string };
  size?: number;
}

/** Small donut chart — used in stat cards (e.g. winrate, total bets) */
export default function MiniDonut({
  value,
  total,
  colors,
  size = 140,
}: MiniDonutProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const remaining = 100 - percentage;

  const data = [
    { name: 'value', val: percentage || 0.01 },
    { name: 'remaining', val: remaining || 0.01 },
  ];

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.30}
            outerRadius={size * 0.46}
            startAngle={90}
            endAngle={-270}
            dataKey="val"
            stroke="#ffffff"
            strokeWidth={4}
          >
            <Cell fill={colors.main} />
            <Cell fill={colors.sub2} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
