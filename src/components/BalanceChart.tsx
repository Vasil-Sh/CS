import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Wallet, TrendingUp, Activity } from "lucide-react";
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
    const roi = initialBalance > 0 ? Math.round((totalChange / initialBalance) * 100) : 0;
    const betsCount = data.filter(d => d.profit !== 0).length;
    let peak = -Infinity;
    let lowest = Infinity;
    for (const d of data) {
      if (d.balance > peak) peak = d.balance;
      if (d.balance < lowest) lowest = d.balance;
    }
    if (peak === -Infinity) peak = initialBalance;
    if (lowest === Infinity) lowest = initialBalance;
    return { initialBalance, currentBalance, totalChange, isUp, roi, betsCount, peak, lowest };
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
      const deltaFromStart = d.balance - stats.initialBalance;
      return (
        <div
          className="bg-white p-3 rounded-xl shadow-lg border border-[#E5E7EB] text-xs"
          style={{ backgroundColor: "white", borderRadius: "12px" }}
        >
          <p className="font-bold text-[#111827] mb-1">Дата: {date}</p>
          {d.betName && <p className="text-[#6B7280]">Прогноз: {d.betName}</p>}
          {d.odds && (
            <p className="text-[#6B7280]">Коеф.: {Number(d.odds).toFixed(2)}</p>
          )}
          {d.profit !== 0 && (
            <p className={`font-bold ${d.profit >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
              Профіт: {d.profit >= 0 ? "+" : ""}{Number(d.profit).toFixed(2)} ₴
            </p>
          )}
          <p className="font-bold text-[#111827]">
            Банк: {Number(d.balance).toFixed(2)} ₴
          </p>
          {d.profit !== 0 && (
            <p className={`text-[10px] mt-0.5 ${deltaFromStart >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
              {deltaFromStart >= 0 ? "▲" : "▼"} {Math.abs(deltaFromStart).toFixed(0)} ₴ від старту
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const initialLabel = `Старт: ${stats.initialBalance.toFixed(0)} ₴`;
  const peakLabel = stats.peak > stats.initialBalance ? `Пік: ${stats.peak.toFixed(0)} ₴` : "";
  const lowLabel = stats.lowest < stats.initialBalance ? `Мін: ${stats.lowest.toFixed(0)} ₴` : "";

  const startDate = data[0]?.date ? new Date(data[0].date).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" }) : "";
  const endDate = data[data.length - 1]?.date ? new Date(data[data.length - 1].date).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" }) : "";

  return (
    <Card className="border border-[#D1D5DB] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] rounded-2xl bg-white overflow-hidden">
      <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-[#111827]">
            <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
              <Wallet className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
            </div>
            Історія банкролу
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-full text-xs">
              <Activity className="h-3 w-3 text-gray-400" strokeWidth={1.5} />
              <span className="text-gray-500">{stats.betsCount} ставок</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-full text-xs">
              <TrendingUp className="h-3 w-3 text-amber-500" strokeWidth={2} />
              <span className="text-amber-600 font-medium">{stats.peak.toFixed(0)} ₴</span>
              <span className="text-amber-400">пік</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-full text-xs">
              <span className="text-gray-500 font-medium">{startDate} – {endDate}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-xl px-3 py-2 text-center">
            <div className="text-[10px] text-gray-400">Старт</div>
            <div className="text-sm font-bold text-gray-900">{stats.initialBalance.toFixed(0)} ₴</div>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2 text-center">
            <div className="text-[10px] text-gray-400">Зараз</div>
            <div className={`text-sm font-bold ${stats.isUp ? "text-emerald-600" : "text-red-500"}`}>{stats.currentBalance.toFixed(0)} ₴</div>
          </div>
          <div className={`rounded-xl px-3 py-2 text-center ${stats.isUp ? "bg-emerald-50" : "bg-red-50"}`}>
            <div className={`text-[10px] ${stats.isUp ? "text-emerald-500" : "text-red-400"}`}>Зміна</div>
            <div className={`text-sm font-bold ${stats.isUp ? "text-emerald-600" : "text-red-500"}`}>
              {stats.isUp ? "+" : ""}{stats.totalChange.toFixed(0)} ₴
            </div>
          </div>
          <div className={`rounded-xl px-3 py-2 text-center ${stats.roi >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
            <div className={`text-[10px] ${stats.roi >= 0 ? "text-emerald-500" : "text-red-400"}`}>ROI</div>
            <div className={`text-sm font-bold ${stats.roi >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {stats.roi >= 0 ? "+" : ""}{stats.roi}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="balanceGradientUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="balanceGradientDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 500 }}
              axisLine={{ stroke: "#E5E7EB", strokeWidth: 1 }}
              tickLine={false}
              tickFormatter={(value) => {
                const d = new Date(value);
                return d.toLocaleDateString("uk-UA", {
                  day: "2-digit",
                  month: "2-digit",
                });
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
              }
              domain={["auto", "auto"]}
            />
            <Tooltip
              content={<CustomTooltip />}
              contentStyle={{
                backgroundColor: "transparent",
                border: "none",
                padding: 0,
              }}
            />
            <ReferenceLine
              y={stats.initialBalance}
              stroke="#9CA3AF"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: initialLabel,
                position: "insideTopRight",
                style: { fontSize: 10, fill: "#9CA3AF", fontWeight: 500 },
              }}
            />
            {stats.peak > stats.initialBalance && (
              <ReferenceLine
                y={stats.peak}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: peakLabel,
                  position: "insideTopRight",
                  style: { fontSize: 10, fill: "#f59e0b", fontWeight: 500 },
                }}
              />
            )}
            {stats.lowest < stats.initialBalance && (
              <ReferenceLine
                y={stats.lowest}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: lowLabel,
                  position: "insideBottomRight",
                  style: { fontSize: 10, fill: "#ef4444", fontWeight: 500 },
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="balance"
              fill={stats.isUp ? "url(#balanceGradientUp)" : "url(#balanceGradientDown)"}
              stroke="none"
            />
            <Line
              type="linear"
              dataKey="balance"
              stroke="#447afc"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 5,
                fill: "#447afc",
                stroke: "#fff",
                strokeWidth: 2,
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
