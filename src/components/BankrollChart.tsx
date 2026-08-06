/**
 * BankrollChart — історія банкролу у стилі 21st Sales Overview.
 *
 * ComposedChart: gradient area fill + solid balance line + reference line.
 * Clean header: title (left) + legend dot (right) — no inline KPI stats.
 */
import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from "recharts";
import { Wallet, MoreHorizontal } from "lucide-react";
import type { BalanceData } from "@/types/betting";

interface BankrollChartProps {
  data: BalanceData[];
}

const BankrollChart = memo(function BankrollChart({
  data,
}: BankrollChartProps) {
  const initialBalance = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return data[0]?.balance || 0;
  }, [data]);

  if (!data || data.length === 0) return null;

  // ── Format helpers ──
  const fmtDate = (v: string) => {
    const d = new Date(v);
    return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" });
  };
  const fmtCurrency = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(Math.round(v));

  return (
    <Card className="w-full border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] rounded-2xl bg-white overflow-hidden">
      {/* ── Header: title (left) + legend (right) ── */}
      <CardHeader className="flex flex-row items-center justify-between p-0 pt-5 pb-3 px-5 space-y-0 border-0">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
          <div className="p-2 bg-blue-50 rounded-xl">
            <Wallet className="h-4 w-4 text-primary" strokeWidth={1.5} />
          </div>
          Історія банкролу
        </CardTitle>

        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-blue-500 inline-block" />
            <span className="text-muted-foreground text-xs">Баланс</span>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors -mr-1">
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      </CardHeader>

      {/* ── Chart ── */}
      <CardContent className="p-0 h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 10, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="bankrollGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#447afc" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#447afc" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E5E7EB"
              opacity={0.7}
            />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickFormatter={fmtDate}
              tickMargin={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickFormatter={fmtCurrency}
              domain={["auto", "auto"]}
              width={50}
              tickMargin={8}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as BalanceData;
                  return (
                    <div className="bg-background/95 backdrop-blur-sm border border-border shadow-md rounded-lg p-2.5 text-xs space-y-1">
                      <p className="font-semibold text-foreground">
                        {new Date(d.date).toLocaleDateString("uk-UA", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </p>
                      {d.isPending ? (
                        <p className="text-amber-500 font-medium">
                          ⏳ Очікується
                        </p>
                      ) : (
                        <>
                          <p className="text-blue-600 font-medium">
                            Баланс:{" "}
                            {Math.round(d.balance).toLocaleString("uk-UA")} ₴
                          </p>
                          {d.profit !== 0 && (
                            <p
                              className={`font-medium ${d.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}
                            >
                              {d.profit >= 0 ? "+" : ""}
                              {Math.round(d.profit).toLocaleString("uk-UA")} ₴
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Reference line — initial bankroll */}
            <ReferenceLine
              y={initialBalance}
              stroke="#D1D5DB"
              strokeDasharray="6 4"
              strokeWidth={1}
            />

            {/* Gradient area fill + solid balance line */}
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#447afc"
              strokeWidth={2}
              fill="url(#bankrollGradient)"
              dot={false}
              activeDot={{
                r: 6,
                fill: "#447afc",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />

            <Line
              type="monotone"
              dataKey="balance"
              stroke="#447afc"
              strokeWidth={2}
              dot={{
                r: 4,
                fill: "#fff",
                stroke: "#447afc",
                strokeWidth: 2,
              }}
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
});

export default BankrollChart;
