import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartDataPoint {
  [key: string]: string | number;
}

interface StatsChartProps {
  title: string;
  data: ChartDataPoint[];
  type?: 'bar' | 'line';
  dataKey: string;
  xAxisKey: string;
  color?: string;
}

export default function StatsChart({ 
  title, 
  data, 
  type = 'bar', 
  dataKey, 
  xAxisKey,
  color = '#3b82f6'
}: StatsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={dataKey} fill={color} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}