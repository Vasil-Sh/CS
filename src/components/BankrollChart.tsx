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
import type { BalanceData } from "@/types/betting";

interface BankrollChartProps {
  data: BalanceData[];
  currency?: "UAH" | "USD";
}

const BankrollChart = memo(function BankrollChart({
  data,
  currency = "UAH",
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
    Math.round(v).toLocaleString("uk-UA");

  return (
    <Card className="analytics-chart-card w-full overflow-hidden">
      {/* ── Header: title only ── */}
      <CardHeader className="analytics-bankroll-header flex flex-row items-center justify-between p-0 px-5 space-y-0 border-0">
        <CardTitle className="analytics-bankroll-title text-gray-900">
          Динаміка банку
        </CardTitle>
      </CardHeader>

      {/* ── Chart ── */}
      <CardContent className="analytics-bankroll-content p-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 10, left: 4, bottom: 2 }}
          >
            <defs>
              <linearGradient id="bankrollGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff693b" stopOpacity={0.16} />
                <stop offset="100%" stopColor="#ff693b" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#e4e6e0"
              opacity={1}
            />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#747a71" }}
              tickFormatter={fmtDate}
              tickMargin={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#747a71" }}
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
                          <p className="text-orange-600 font-medium">
                            Баланс:{" "}
                            {Math.round(d.balance).toLocaleString("uk-UA")} {currency === "USD" ? "$" : "₴"}
                          </p>
                          {d.profit !== 0 && (
                            <p
                              className={`font-medium ${d.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}
                            >
                              {d.profit >= 0 ? "+" : ""}
                              {Math.round(d.profit).toLocaleString("uk-UA")} {currency === "USD" ? "$" : "₴"}
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
              stroke="#cfd3cc"
              strokeDasharray="0"
              strokeWidth={1}
            />

            {/* Gradient area fill + solid balance line */}
            <Area
              type="monotone"
              dataKey="balance"
              stroke="none"
              fill="url(#bankrollGradient)"
              dot={false}
              activeDot={{
                r: 6,
                fill: "#ff693b",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />

            <Line
              type="monotone"
              dataKey="balance"
              stroke="#ff693b"
              strokeWidth={2.25}
              dot={false}
              activeDot={{
                r: 5,
                fill: "#fff",
                stroke: "#ff693b",
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
