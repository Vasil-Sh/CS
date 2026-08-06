/**
 * BankrollChart — історія банкролу у стилі 21st Line Charts 1.
 *
 * ComposedChart: area fill + line + reference line + custom tooltip.
 * Header shows inline KPI stats (current, change, ROI, min/max).
 */
import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";
import type { BalanceData } from "@/types/betting";

interface BankrollChartProps {
  data: BalanceData[];
}

const BankrollChart = memo(function BankrollChart({
  data,
}: BankrollChartProps) {
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    const initialBalance = data[0]?.balance || 0;
    const currentBalance = data[data.length - 1]?.balance || initialBalance;
    const totalChange = currentBalance - initialBalance;
    const isUp = totalChange >= 0;
    const roi =
      initialBalance > 0 ? Math.round((totalChange / initialBalance) * 100) : 0;
    let peak = -Infinity;
    let lowest = Infinity;
    for (const d of data) {
      if (d.balance > peak) peak = d.balance;
      if (d.balance < lowest) lowest = d.balance;
    }
    if (peak === -Infinity) peak = initialBalance;
    if (lowest === Infinity) lowest = initialBalance;
    return {
      initialBalance,
      currentBalance,
      totalChange,
      isUp,
      roi,
      peak,
      lowest,
    };
  }, [data]);

  if (!data || data.length === 0 || !stats) return null;

  // ── Format helpers ──
  const fmtDate = (v: string) => {
    const d = new Date(v);
    return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" });
  };
  const fmtCurrency = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(Math.round(v));

  // ── Custom tooltip ──
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { payload: BalanceData }[];
  }) => {
    if (!active || !payload?.length) return null;
    const d: BalanceData = payload[0].payload;
    const date = new Date(d.date).toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return (
      <div className="rounded-lg border bg-popover p-3 shadow-sm shadow-black/5 min-w-[150px]">
        <p className="text-xs font-medium text-muted-foreground tracking-wide mb-1.5">
          {date}
        </p>
        {d.isPending ? (
          <p className="text-amber-500 font-medium text-sm">⏳ Очікується</p>
        ) : (
          <div className="space-y-1">
            <p className="text-base font-bold text-foreground">
              {Math.round(d.balance).toLocaleString("uk-UA")} ₴
            </p>
            {d.profit !== 0 && (
              <p
                className={`text-xs font-semibold ${d.profit >= 0 ? "text-emerald-500" : "text-red-500"}`}
              >
                {d.profit >= 0 ? "+" : ""}
                {Math.round(d.profit).toLocaleString("uk-UA")} ₴
              </p>
            )}
            {d.betName && (
              <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                {d.betName}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] rounded-2xl bg-white overflow-hidden">
      {/* ── Header with inline KPIs ── */}
      <CardHeader className="border-0 min-h-auto pt-5 pb-3 px-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Wallet className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>
            Історія банкролу
          </CardTitle>

          {/* Inline stat pills */}
          <div className="flex items-center gap-3 flex-wrap text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                Поточний
              </span>
              <span className="text-sm font-bold text-gray-900">
                <NumberTicker value={Math.round(stats.currentBalance)} /> ₴
              </span>
            </div>
            <div className="w-px h-7 bg-gray-200" />
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                Зміна
              </span>
              <span
                className={`text-sm font-bold flex items-center gap-0.5 ${stats.isUp ? "text-emerald-500" : "text-red-500"}`}
              >
                {stats.isUp ? (
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                )}
                {stats.totalChange >= 0 ? "+" : ""}
                <NumberTicker value={Math.round(stats.totalChange)} /> ₴
              </span>
            </div>
            <div className="w-px h-7 bg-gray-200" />
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                ROI
              </span>
              <span
                className={`text-sm font-bold ${stats.roi >= 0 ? "text-emerald-500" : "text-red-500"}`}
              >
                {stats.roi >= 0 ? "+" : ""}
                {stats.roi}%
              </span>
            </div>
            <div className="w-px h-7 bg-gray-200" />
            <Badge className="bg-white border border-emerald-200 text-emerald-600 text-[10px] font-semibold px-2 py-0.5 rounded-lg">
              ▲ <NumberTicker value={Math.round(stats.peak)} />
            </Badge>
            <Badge className="bg-white border border-red-200 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-lg">
              ▼ <NumberTicker value={Math.round(stats.lowest)} />
            </Badge>
          </div>
        </div>
      </CardHeader>

      {/* ── Chart ── */}
      <CardContent className="px-1 pb-4">
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 15, left: 5, bottom: 5 }}
            >
              <defs>
                <linearGradient
                  id="bankrollGradient2"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#447afc" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#447afc" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#F3F4F6"
                horizontal
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmtDate}
                tickMargin={8}
              />

              <YAxis
                tick={{ fontSize: 11, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmtCurrency}
                domain={["auto", "auto"]}
                width={50}
                tickMargin={8}
              />

              {/* Reference line — initial bankroll */}
              <ReferenceLine
                y={stats.initialBalance}
                stroke="#D1D5DB"
                strokeDasharray="6 4"
                strokeWidth={1}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "#D1D5DB",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />

              {/* Area fill under the line */}
              <Area
                type="monotone"
                dataKey="balance"
                fill="url(#bankrollGradient2)"
                stroke="none"
              />

              {/* Main line */}
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#447afc"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: "#447afc",
                  stroke: "white",
                  strokeWidth: 3,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

export default BankrollChart;
