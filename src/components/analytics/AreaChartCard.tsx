/**
 * AreaChartCard — area chart sparkline card for Analytics page.
 *
 * Replaces the old circular-progress stat cards with a modern,
 * sparkline-area-chart layout inspired by SaaS dashboards.
 */
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface SparklinePoint {
  label: string;
  value: number;
}

interface AreaChartCardProps {
  title: string;
  icon: LucideIcon;
  color: string; // CSS color or Tailwind variable
  gradientId: string; // unique SVG gradient ID
  bigValue: string; // main KPI (e.g. "+12%", "42")
  bigValueColor?: string; // Tailwind text color class
  subtitle?: string; // e.g. "прибуток / вкладено"
  data: SparklinePoint[];
  footerItems?: {
    label: string;
    value: string;
    valueColor?: string;
    accentBg?: string; // Tailwind bg class
  }[];
}

export default function AreaChartCard({
  title,
  icon: Icon,
  color,
  gradientId,
  bigValue,
  bigValueColor = "text-gray-900",
  subtitle,
  data,
  footerItems,
}: AreaChartCardProps) {
  const hasData = data.length > 1;

  // Wrap gradientId in unique suffix per instance to avoid SVG ID conflicts
  const safeId = useMemo(
    () => `${gradientId}-${Math.random().toString(36).slice(2, 7)}`,
    [gradientId],
  );

  return (
    <Card className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden h-full">
      <CardContent className="space-y-4 p-5">
        {/* ── Header: icon + title ── */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="h-5 w-5" style={{ color }} strokeWidth={1.5} />
          </div>
          <span className="text-base font-semibold text-gray-900">{title}</span>
        </div>

        {/* ── Body: big value + sparkline ── */}
        <div className="flex items-end gap-3 justify-between">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span
              className={`text-2xl font-bold leading-tight tracking-tight ${bigValueColor}`}
            >
              {bigValue}
            </span>
            {subtitle && (
              <span className="text-[11px] text-gray-400 whitespace-nowrap">
                {subtitle}
              </span>
            )}
          </div>

          {hasData && (
            <div className="max-w-36 h-14 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
                >
                  <defs>
                    <linearGradient id={safeId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                      <stop
                        offset="100%"
                        stopColor={color}
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" hide />
                  <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                  <Tooltip
                    cursor={{
                      stroke: color,
                      strokeWidth: 1,
                      strokeDasharray: "2 2",
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg rounded-lg px-2.5 py-1.5 pointer-events-none">
                            <p className="text-xs font-semibold text-gray-900">
                              {payload[0].value}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    fill={`url(#${safeId})`}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: color,
                      stroke: "white",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── Footer: stat pills ── */}
        {footerItems && footerItems.length > 0 && (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${Math.min(footerItems.length, 3)}, minmax(0, 1fr))`,
            }}
          >
            {footerItems.map((item, i) => (
              <div
                key={i}
                className={`rounded-xl px-2.5 py-2 text-center ${item.accentBg || "bg-gray-50"}`}
              >
                <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                  {item.label}
                </div>
                <div
                  className={`text-sm font-bold ${item.valueColor || "text-gray-900"}`}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
