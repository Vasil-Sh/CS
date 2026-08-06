/**
 * MonthlyProfitChartCard — bar chart (monthly profit) + cumulative line,
 * restyled in 21st Sales Overview style.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from "recharts";

interface MonthlyData {
  month: string;
  profit: number;
  cumulative: number;
  totalBets: number;
}

interface Props {
  data: MonthlyData[];
}

export default function MonthlyProfitChartCard({ data }: Props) {
  return (
    <Card className="w-full border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] rounded-2xl bg-white overflow-hidden">
      {/* ── Header: title (left) + legend (right) ── */}
      <CardHeader className="flex flex-row items-center justify-between p-0 pt-5 pb-3 px-5 space-y-0 border-0">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
          <div className="p-2 bg-blue-50 rounded-xl">
            <Calendar className="h-4 w-4 text-primary" strokeWidth={1.5} />
          </div>
          Прибуток по місяцях
        </CardTitle>

        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span className="text-muted-foreground text-xs">За місяць</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-blue-500 inline-block" />
            <span className="text-muted-foreground text-xs">Загальний</span>
          </div>
        </div>
      </CardHeader>

      {/* ── Chart: bars + cumulative line ── */}
      <CardContent className="p-0 h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 10, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="profitBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient
                id="cumulativeAreaGrad"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#447afc" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#447afc" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5E7EB"
              opacity={0.7}
              vertical={false}
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickMargin={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
              }
              width={50}
              tickMargin={8}
            />

            <ReferenceLine y={0} stroke="#D1D5DB" strokeWidth={1} />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as MonthlyData;
                  return (
                    <div className="bg-background/95 backdrop-blur-sm border border-border shadow-md rounded-lg p-2.5 text-xs space-y-1">
                      <p className="font-semibold text-foreground">{d.month}</p>
                      <p className="text-emerald-600 font-medium">
                        За місяць: {d.profit.toLocaleString("uk-UA")} ₴
                      </p>
                      <p className="text-blue-600 font-medium">
                        Загалом: {d.cumulative.toLocaleString("uk-UA")} ₴
                      </p>
                      {d.totalBets > 0 && (
                        <p className="text-muted-foreground">
                          {d.totalBets} ставок
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
              cursor={{
                stroke: "#D1D5DB",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            {/* Area fill under cumulative line */}
            <Area
              type="monotone"
              dataKey="cumulative"
              fill="url(#cumulativeAreaGrad)"
              stroke="none"
            />

            {/* Monthly profit bars — always green, matches legend */}
            <Bar
              dataKey="profit"
              fill="url(#profitBarGrad)"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />

            {/* Cumulative line (blue, dots) */}
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#447afc"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#fff", stroke: "#447afc", strokeWidth: 2 }}
              activeDot={{
                r: 6,
                fill: "#447afc",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
