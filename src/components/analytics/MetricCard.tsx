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
  /** Icon color class, e.g. "text-emerald-600" */
  iconColor: string;
  /** Badge background + text class */
  badgeClass: string;
}

export default function MetricCard({
  value,
  label,
  change,
  isPositive = true,
  dateRange,
  icon: Icon,
  iconColor,
  badgeClass,
}: MetricCardProps) {
  return (
    <Card className="bg-card border border-border rounded-2xl p-5 shadow-xs h-full">
      <CardContent className="p-0 space-y-4">
        {/* Header: Icon + Pill Badge */}
        <div className="flex items-center justify-between">
          <Icon className={`size-6 ${iconColor}`} />
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

        {/* Title & Large Value */}
        <div className="space-y-1">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          <div className="text-3xl font-bold tracking-tight text-foreground">
            {value}
          </div>
        </div>

        {/* Divider + Date Range */}
        <div className="pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground font-normal">
            {dateRange}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
