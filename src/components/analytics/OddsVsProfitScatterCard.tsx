/**
 * OddsVsProfitScatterCard — scatter plot of odds vs profit,
 * restyled in 21st Sales Overview style (clean header, no axis lines).
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { ScatterData } from "@/types/betting";

interface Props {
  data: ScatterData[];
  winCount: number;
  lossCount: number;
}

export default function OddsVsProfitScatterCard({
  data,
}: Props) {
  return (
    <Card className="analytics-chart-card w-full overflow-hidden">
      {/* ── Header: title (left) + legend + badges (right) ── */}
      <CardHeader className="analytics-scatter-header p-0 px-5 space-y-0 border-0">
        <CardTitle className="analytics-scatter-title text-gray-900">
          Коефіцієнт і результат
        </CardTitle>

      </CardHeader>

      {/* ── Chart ── */}
      <CardContent className="analytics-scatter-content p-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 6, right: 20, left: 14, bottom: 10 }}>
            <CartesianGrid
              stroke="#E5E7EB"
              opacity={1}
            />

            <XAxis
              dataKey="odds"
              type="number"
              domain={[(min: number) => Math.min(1, min), (max: number) => Math.max(3.5, Math.ceil(max * 2) / 2)]}
              tickCount={6}
              height={42}
              label={{ value: "Коефіцієнт", position: "insideBottom", offset: -2, fill: "#747a71", fontSize: 12 }}
              name="Коефіцієнт"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickFormatter={(v) => Number(v).toFixed(1)}
              tickMargin={8}
            />

            <YAxis
              dataKey="profit"
              type="number"
              name="Прибуток"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickFormatter={(v: number) =>
                Math.round(v).toLocaleString("uk-UA")
              }
              width={64}
              tickMargin={8}
            />

            <ReferenceLine y={0} stroke="#D1D5DB" strokeWidth={1} />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload as ScatterData;
                  return (
                    <div className="bg-background/95 backdrop-blur-sm border border-border shadow-md rounded-lg p-2.5 text-xs space-y-1">
                      <p className="font-semibold text-foreground">
                        {p.match || "Ставка"}
                      </p>
                      <p className="text-muted-foreground">
                        Коеф.: {Number(p.odds).toFixed(2)}
                      </p>
                      <p
                        className={`font-medium ${Number(p.profit) >= 0 ? "text-emerald-600" : "text-red-500"}`}
                      >
                        {Number(p.profit) >= 0 ? "+" : ""}
                        {Number(p.profit).toFixed(0)} ₴
                      </p>
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

            <Scatter
              data={data}
              isAnimationActive={false}
              shape={(props: unknown) => {
                const { cx, cy, payload } = props as {
                  cx?: number;
                  cy?: number;
                  payload?: { result?: string };
                };
                const isWin = (payload?.result || "Win") === "Win";
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill={isWin ? "#ff693b" : "#9ca09a"}
                    opacity={0.9}
                  />
                );
              }}
              legendType="none"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
