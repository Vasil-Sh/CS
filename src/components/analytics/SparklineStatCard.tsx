/**
 * SparklineStatCard — compact stat card with sparkline area chart.
 *
 * Layout: left (period + badge + big value) | right (sparkline).
 * Borderless, rounded-3xl, shadow — inspired by 21st sparkline cards.
 */
import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface SparklinePoint {
  label: string;
  value: number;
}

interface SparklineStatCardProps {
  /** Period label, e.g. "Всього", "Серпень 2026" */
  period: string;
  /** Large main value */
  bigValue: string;
  /** Percentage change label, e.g. "+12%", "-5%" */
  changeLabel?: string;
  /** Direction of change — determines color */
  isUp?: boolean;
  /** Sparkline data */
  data: SparklinePoint[];
  /** Color for the sparkline stroke + gradient */
  color: string;
  /** Unique gradient ID (prevents SVG conflicts across multiple cards) */
  gradientId: string;
}

const SparklineStatCard = memo(function SparklineStatCard({
  period,
  bigValue,
  changeLabel,
  isUp = true,
  data,
  color,
  gradientId,
}: SparklineStatCardProps) {
  const badgeColor = isUp ? "text-emerald-500" : "text-orange-500";

  return (
    <Card className="bg-card border-0 rounded-3xl p-5 shadow-lg shadow-black/5 h-full">
      <CardContent className="p-0 flex items-center justify-between gap-3">
        {/* ── Left: text ── */}
        <div className="space-y-1 shrink-0 min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <span className="text-muted-foreground truncate">{period}</span>
            {changeLabel && (
              <span
                className={`inline-flex items-center gap-0.5 font-semibold ${badgeColor}`}
              >
                {changeLabel}
                {isUp ? (
                  <ArrowUp className="size-3.5 stroke-[2.5]" />
                ) : (
                  <ArrowDown className="size-3.5 stroke-[2.5]" />
                )}
              </span>
            )}
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-foreground truncate">
            {bigValue}
          </div>
        </div>

        {/* ── Right: sparkline — render even with 1 point ── */}
        <div className="h-14 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.length > 0 ? data : [{ value: 0 }, { value: 0 }]}
              margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

export default SparklineStatCard;
