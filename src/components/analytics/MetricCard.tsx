/**
 * MetricCard — summary stat card in 21st metric-cards-grid style.
 *
 * Layout:
 *   Top: icon (left) + pill badge with trend arrow + change% (right)
 *   Middle: muted label + large bold value
 *   Bottom: divider + date range subtext
 */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

export interface MetricCardProps {
  /** Large bold value, e.g. "17", "3 421", "+12%" */
  value: string;
  /** Muted label below the value */
  label: string;
  /** Change badge text, e.g. "+12.8%", "-456 ₴" */
  change?: string;
  /** Whether the change is positive (green) or negative (red) */
  isPositive?: boolean;
  /** Date range subtext */
  dateRange: string;
  /** Lucide icon */
  icon: LucideIcon;
  /** Badge background + text class */
  badgeClass: string;
  /** Optional circular progress (0-100). When set, renders a donut chart. */
  circularValue?: number;
  /** Subtext below the circular progress, e.g. "1W / 2L" */
  circularSubtext?: string;
}

export default function MetricCard({
  value,
  label,
  change,
  isPositive = true,
  dateRange,
  icon: Icon,
  badgeClass,
  circularValue,
  circularSubtext,
}: MetricCardProps) {
  return (
    <Card className="bg-card border border-border rounded-2xl p-5 shadow-xs h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <CardContent className="p-0 space-y-4">
        {/* Header: Icon + Pill Badge */}
        <div className="flex items-center justify-between">
          <div className="p-2 bg-blue-50 rounded-xl">
            <Icon className="size-5 text-blue-600" strokeWidth={1.5} />
          </div>
          {change && (
            <Badge
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border-0 flex items-center gap-1 ${badgeClass}`}
            >
              {isPositive ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              {change}
            </Badge>
          )}
        </div>

        {/* Middle: label + value (with optional circular progress) */}
        <div className="space-y-1">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          {circularValue != null ? (
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {value}
              </div>
              <div className="flex items-center justify-center">
                <AnimatedCircularProgressBar
                  max={100}
                  min={0}
                  value={circularValue}
                  gaugePrimaryColor="#22C55E"
                  gaugeSecondaryColor="#E5E7EB"
                  className="!w-24 !h-24"
                />
              </div>
            </div>
          ) : (
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {value}
            </div>
          )}
        </div>

        {/* Divider + Date Range (or circular subtext) */}
        <div className="pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground font-normal">
            {circularSubtext || dateRange}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
