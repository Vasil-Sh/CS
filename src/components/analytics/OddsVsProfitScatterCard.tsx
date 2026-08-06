/**
 * OddsVsProfitScatterCard — scatter plot of odds vs profit,
 * restyled in 21st Sales Overview style (clean header, no axis lines).
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
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
  winCount,
  lossCount,
}: Props) {
  return (
    <Card className="w-full border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] rounded-2xl bg-white overflow-hidden">
      {/* ── Header: title (left) + legend + badges (right) ── */}
      <CardHeader className="flex flex-row items-center justify-between p-0 pt-5 pb-3 px-5 space-y-0 border-0">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
          <div className="p-2 bg-blue-50 rounded-xl">
            <Target className="h-4 w-4 text-primary" strokeWidth={1.5} />
          </div>
          Коефіцієнти vs Прибуток
        </CardTitle>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-muted-foreground text-xs">Виграш</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500 inline-block" />
            <span className="text-muted-foreground text-xs">Програш</span>
          </div>
          <div className="w-px h-5 bg-gray-200" />
          <Badge className="bg-emerald-50 text-emerald-600 text-[10px] font-semibold px-2 py-0.5 rounded-lg border-0">
            ✅ {winCount}
          </Badge>
          <Badge className="bg-red-50 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-lg border-0">
            ✕ {lossCount}
          </Badge>
        </div>
      </CardHeader>

      {/* ── Chart ── */}
      <CardContent className="p-0 h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, left: 5, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5E7EB"
              opacity={0.7}
            />

            <XAxis
              dataKey="odds"
              name="Коефіцієнт"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickFormatter={(v) => Number(v).toFixed(2)}
              tickMargin={8}
            />

            <YAxis
              dataKey="profit"
              name="Прибуток"
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
              shape={(props: Record<string, unknown>) => {
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
                    r={5}
                    fill={isWin ? "#10B981" : "#EF4444"}
                    opacity={0.85}
                    stroke="#fff"
                    strokeWidth={2}
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
