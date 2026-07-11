import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from "recharts";
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";
import type { BalanceData } from "@/types/betting";

interface BalanceChartProps {
  data: BalanceData[];
}

const BalanceChartMemo = memo(function BalanceChart({
  data,
}: BalanceChartProps) {
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    const initialBalance = data[0]?.balance || 1000;
    const currentBalance = data[data.length - 1]?.balance || initialBalance;
    const totalChange = currentBalance - initialBalance;
    const isUp = totalChange >= 0;
    const roi =
      initialBalance > 0 ? Math.round((totalChange / initialBalance) * 100) : 0;
    let peak = -Infinity;
    let lowest = Infinity;
    let totalProfit = 0;
    for (const d of data) {
      if (d.balance > peak) peak = d.balance;
      if (d.balance < lowest) lowest = d.balance;
      totalProfit += (d.profit || 0);
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
      totalProfit,
    };
  }, [data]);

  if (!data || data.length === 0 || !stats) {
    return null;
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: { payload: BalanceData }[];
  }

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const date = new Date(d.date).toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3.5 rounded-2xl shadow-lg border border-gray-200 text-xs min-w-[160px]">
          <p className="font-semibold text-gray-500 mb-1.5">{date}</p>
          {d.profit !== 0 && (
            <p className={`font-bold text-base ${d.profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {d.profit >= 0 ? "+" : ""}{Number(d.profit).toFixed(0)} ₴
            </p>
          )}
          <div className="w-full h-px bg-gray-100 my-1.5" />
          <p className="text-gray-700 font-medium">
            Банк: <span className="font-bold text-gray-900">{Number(d.balance).toFixed(0)} ₴</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] rounded-[32px] bg-white overflow-hidden">
      {/* Header with inline stats */}
      <CardHeader className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
            <div className="p-2.5 bg-blue-50 rounded-2xl">
              <Wallet className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
            </div>
            Історія банкролу
          </CardTitle>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Current balance */}
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Поточний</span>
              <span className="text-sm font-bold text-gray-900"><NumberTicker value={Math.round(stats.currentBalance)} /> ₴</span>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            {/* Profit/Loss */}
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Зміна</span>
              <span className={`text-sm font-bold flex items-center gap-1 ${stats.isUp ? "text-emerald-500" : "text-red-500"}`}>
                {stats.isUp ? <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} /> : <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={2.5} />}
                {stats.totalChange >= 0 ? "+" : ""}<NumberTicker value={Math.round(stats.totalChange)} /> ₴
              </span>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            {/* ROI */}
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">ROI</span>
              <span className={`text-sm font-bold ${stats.roi >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {stats.roi >= 0 ? "+" : ""}{stats.roi}%
              </span>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            {/* Min / Max */}
            <div className="flex items-center gap-3">
              <Badge className="bg-white border border-emerald-200 text-emerald-600 text-[10px] font-semibold px-2 py-0.5 rounded-lg">
                ▲ <NumberTicker value={Math.round(stats.peak)} />
              </Badge>
              <Badge className="bg-white border border-red-200 text-red-500 text-[10px] font-semibold px-2 py-0.5 rounded-lg">
                ▼ <NumberTicker value={Math.round(stats.lowest)} />
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-4">
        <ResponsiveContainer width="100%" height={360}>
          <LineChart
            data={data}
            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#447afc" stopOpacity={0.25} />
                <stop offset="50%" stopColor="#447afc" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#447afc" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F3F4F6"
              vertical={false}
              strokeWidth={1}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#9CA3AF", fontWeight: 500 }}
              axisLine={{ stroke: "#F3F4F6", strokeWidth: 1 }}
              tickLine={false}
              tickFormatter={(value) => {
                const d = new Date(value);
                return d.toLocaleDateString("uk-UA", {
                  day: "2-digit",
                  month: "2-digit",
                });
              }}
              dy={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9CA3AF", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
              }
              domain={["auto", "auto"]}
              width={50}
            />
            <Tooltip
              content={<CustomTooltip />}
              contentStyle={{
                backgroundColor: "transparent",
                border: "none",
                padding: 0,
              }}
              cursor={{ stroke: "#D1D5DB", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <ReferenceLine
              y={stats.initialBalance}
              stroke="#D1D5DB"
              strokeDasharray="6 4"
              strokeWidth={1}
              label={{
                value: `Старт ${stats.initialBalance.toFixed(0)}₴`,
                position: "left",
                style: { fontSize: 10, fill: "#9CA3AF", fontWeight: 500 },
              }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              fill="url(#balanceGradient)"
              stroke="none"
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#447afc"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 6,
                fill: "#447afc",
                stroke: "#fff",
                strokeWidth: 3,
                className: "drop-shadow-md",
              }}
              name="Банкрол"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

export default BalanceChartMemo;
