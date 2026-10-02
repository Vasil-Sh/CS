import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface MonthlyData { month: string; profit: number; cumulative: number; totalBets: number; }
interface Props { data: MonthlyData[]; currency?: "UAH" | "USD"; }

function ProfitValueLabel({ x = 0, y = 0, width = 0, height = 0, value, currency = "UAH" }: { x?: number; y?: number; width?: number; height?: number; value?: number | string; currency?: "UAH" | "USD" }) {
  const profit = Number(value || 0);
  if (!profit) return null;
  // Recharts gives `y` as the value-side edge of the bar (top for positives, bottom for negatives).
  // Positive → 8px above the top edge; negative → 20px below the bottom edge (symmetric visual gap).
  const baseline = profit >= 0 ? y - 8 : y + 20;
  return <text x={x + width / 2} y={baseline} textAnchor="middle" fill={profit >= 0 ? "#287540" : "#cc463c"} fontFamily="Oswald, sans-serif" fontSize="14" fontWeight="600">{profit >= 0 ? "+" : ""}{Math.round(profit).toLocaleString("uk-UA")} {currency === "USD" ? "$" : "₴"}</text>;
}

export default function MonthlyProfitChartCard({ data, currency = "UAH" }: Props) {
  const profits = data.map((d) => d.profit);
  const maxProfit = Math.max(0, ...profits);
  const minProfit = Math.min(0, ...profits);
  // Give the Y axis enough headroom so value labels never collide with the X axis:
  // positive side gets ~10% padding, negative side doubles the deepest loss so the
  // below-bar label ("-200 ₴") plus the month label fit comfortably.
  const domainMax = Math.max(100, Math.ceil((maxProfit * 1.1) / 100) * 100);
  const domainMin = minProfit < 0 ? Math.floor((minProfit * 2) / 100) * 100 : 0;

  return (
    <Card className="analytics-chart-card analytics-monthly-card w-full overflow-hidden">
      <CardHeader className="analytics-monthly-header flex flex-row items-center justify-between p-0 px-5 space-y-0 border-0">
        <CardTitle className="analytics-monthly-title text-gray-900">Прибуток по місяцях</CardTitle>
      </CardHeader>
      <CardContent className="analytics-monthly-content p-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 24, right: 20, left: 4, bottom: 3 }} barCategoryGap="12%">
            <CartesianGrid stroke="#e4e6e0" vertical />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#747a71" }} tickMargin={11} />
            <YAxis domain={[domainMin, domainMax]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#747a71" }} tickFormatter={(v: number) => Math.round(v).toLocaleString("uk-UA")} tickMargin={8} width={54} tickCount={5} />
            <ReferenceLine y={0} stroke="#cfd3cc" strokeWidth={1} />
            <Tooltip cursor={{ fill: "rgba(32,36,31,.035)" }} content={({ active, payload }) => active && payload?.length ? <div className="analytics-chart-tooltip"><strong>{payload[0].payload.month}</strong><span>{Number(payload[0].value).toLocaleString("uk-UA")} {currency === "USD" ? "$" : "₴"}</span></div> : null} />
            <Bar dataKey="profit" maxBarSize={56} radius={[0, 0, 0, 0]}>
              <LabelList dataKey="profit" content={<ProfitValueLabel currency={currency} />} />
              {data.map((entry, index) => <Cell key={index} fill={entry.profit >= 0 ? "#62af69" : "#eb5750"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
