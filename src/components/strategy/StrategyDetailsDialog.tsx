import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Brain,
  Star,
  CheckCircle2,
  X,
  Activity,
  Shield,
  ChevronDown,
  ListChecks,
  Percent,
} from "lucide-react";
import type { CS2Strategy } from "@/types/strategy";
import { getRiskColor, getRiskIcon, getRiskLabel } from "@/lib/strategyHelpers";

interface StrategyStats {
  totalBets: number;
  wins: number;
  losses: number;
  pending: number;
  totalProfit: number;
  totalStake: number;
  winRate: number;
  roi: number;
  profitHistory?: number[];
}

interface StrategyDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategy: CS2Strategy | null;
  stats: StrategyStats | undefined;
  isPrimary: boolean;
}

export default function StrategyDetailsDialog({
  open,
  onOpenChange,
  strategy,
  stats,
  isPrimary,
}: StrategyDetailsDialogProps) {
  const [isCriteriaOpen, setIsCriteriaOpen] = useState(true);
  const [isConstraintsOpen, setIsConstraintsOpen] = useState(true);
  const hasStats = stats && stats.totalBets > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto border border-[#E5E7EB] rounded-3xl bg-white p-0 gap-0"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.04)" }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 border-2 border-[#3B82F6] bg-[#EFF6FF] rounded-2xl flex-shrink-0">
              <Brain className="h-6 w-6 text-[#3B82F6]" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#111827] tracking-tight">Деталі стратегії</h2>
              {strategy && (
                <p className="text-sm text-[#6B7280] mt-0.5">
                  {strategy.criteria.length}{" "}
                  {strategy.criteria.length === 1 ? "критерій" : strategy.criteria.length < 5 ? "критерії" : "критеріїв"}{" "}
                  • Ризик: {getRiskLabel(strategy.riskLevel)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="border-b border-[#E5E7EB]" />

        {strategy && (
          <div className="space-y-6 px-6 py-6 bg-[#F3F4F6]">
            {/* Name & Description */}
            <div
              className="p-5 bg-white rounded-3xl border border-[#F3F4F6] hover:border-[#D1D5DB] transition-colors duration-300"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF] border-2 border-[#3B82F6] text-[#3B82F6] flex-shrink-0">
                      {getRiskIcon(strategy.riskLevel)}
                    </div>
                    <h3 className="text-xl font-semibold text-[#111827]">{strategy.name}</h3>
                    {isPrimary && (
                      <Badge className="bg-[#EFF6FF] text-[#3B82F6] border-0 rounded-full text-xs px-2.5 py-0.5 font-medium hover:bg-[#EFF6FF]">
                        <Star className="h-3 w-3 mr-1 fill-[#3B82F6]" strokeWidth={1.5} />
                        Основна
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{strategy.description}</p>
                </div>
                <Badge className={getRiskColor(strategy.riskLevel) + " text-sm px-3 py-1 font-medium hover:opacity-100 flex-shrink-0"}>
                  {strategy.riskLevel}
                </Badge>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCell label="Всього ставок" value={hasStats ? stats.totalBets : 0} />
              <StatCell
                label="Вінрейт"
                value={(hasStats ? Number(stats.winRate).toFixed(1) : 0) + "%"}
                color={hasStats && stats.winRate >= 50 ? "green" : hasStats ? "red" : "default"}
              />
              <StatCell
                label="ROI"
                value={(hasStats ? `${Number(stats.roi) >= 0 ? "+" : ""}${Number(stats.roi).toFixed(1)}` : "0") + "%"}
                color={hasStats && stats.roi >= 0 ? "green" : hasStats ? "red" : "default"}
              />
              <StatCell
                label="Прибуток"
                value={(hasStats ? `${Number(stats.totalProfit) >= 0 ? "+" : ""}${Number(stats.totalProfit).toFixed(0)}` : "0") + "₴"}
                color={hasStats && Number(stats.totalProfit) >= 0 ? "green" : hasStats ? "red" : "default"}
              />
            </div>

            {/* Win/Loss/Pending */}
            {hasStats && (
              <div className="grid grid-cols-3 gap-4">
                <WinLossCard icon={<CheckCircle2 className="h-5 w-5 text-[#16A34A]" strokeWidth={1.5} />} iconBg="bg-[#DCFCE7]" count={stats.wins} label="Перемог" color="text-[#16A34A]" />
                <WinLossCard icon={<X className="h-5 w-5 text-[#EF4444]" strokeWidth={1.5} />} iconBg="bg-[#FEE2E2]" count={stats.losses} label="Поразок" color="text-[#EF4444]" />
                <WinLossCard icon={<Activity className="h-5 w-5 text-[#D97706]" strokeWidth={1.5} />} iconBg="bg-[#FEF3C7]" count={stats.pending} label="Очікується" color="text-[#D97706]" />
              </div>
            )}

            {/* Constraints */}
            {(strategy.maxOdds || strategy.minOdds || strategy.allowedFormats || strategy.allowedBetTypes) && (
              <Collapsible open={isConstraintsOpen} onOpenChange={setIsConstraintsOpen} className="bg-white rounded-3xl border border-[#F3F4F6] hover:border-[#D1D5DB] transition-colors duration-300 overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)" }}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-6 py-4 hover:bg-[#F3F4F6] transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF] border-2 border-[#3B82F6]">
                        <Shield className="h-4 w-4 text-[#3B82F6]" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-base font-semibold text-[#111827]">Обмеження стратегії</h3>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-[#6B7280] transition-transform duration-200 ${isConstraintsOpen ? "rotate-180" : ""}`} strokeWidth={1.5} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 pt-2">
                    {strategy.minOdds && <DetailBadgeCard label="Мінімальний коефіцієнт" value={String(strategy.minOdds)} />}
                    {strategy.maxOdds && <DetailBadgeCard label="Максимальний коефіцієнт" value={String(strategy.maxOdds)} />}
                    {strategy.allowedFormats?.length > 0 && <BadgeListCard label="Дозволені формати" items={strategy.allowedFormats} dark />}
                    {strategy.allowedBetTypes?.length > 0 && <BadgeListCard label="Дозволені типи ставок" items={strategy.allowedBetTypes} />}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Tilt Protection */}
            {strategy.activityLimits?.enabled && (strategy.activityLimits.blockAfterLosses || strategy.activityLimits.blockDurationMinutes) && (
              <div className="bg-white rounded-3xl border border-[#F3F4F6] hover:border-[#D1D5DB] transition-colors duration-300 overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)" }}>
                <div className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#FEF2F2] border-2 border-[#EF4444]">
                      <Shield className="h-4 w-4 text-[#EF4444]" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-semibold text-[#111827]">🔒 Тілт-захист</h3>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-6 pb-6">
                  {strategy.activityLimits.blockAfterLosses && (
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                      <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wider mb-1">Блокування після</p>
                      <p className="text-xl font-semibold text-[#111827]">{strategy.activityLimits.blockAfterLosses} програшів</p>
                      <p className="text-xs text-[#9CA3AF] mt-1">поспіль</p>
                    </div>
                  )}
                  {(strategy.activityLimits.blockDurationMinutes ?? 60) > 0 && (
                    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                      <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wider mb-1">Тривалість паузи</p>
                      <p className="text-xl font-semibold text-[#111827]">{strategy.activityLimits.blockDurationMinutes ?? 60} хв</p>
                      <p className="text-xs text-[#9CA3AF] mt-1">без можливості додавати ставки</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Criteria */}
            <Collapsible open={isCriteriaOpen} onOpenChange={setIsCriteriaOpen} className="bg-white rounded-3xl border border-[#F3F4F6] hover:border-[#D1D5DB] transition-colors duration-300 overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)" }}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between px-6 py-4 hover:bg-[#F3F4F6] transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF] border-2 border-[#3B82F6]">
                      <ListChecks className="h-4 w-4 text-[#3B82F6]" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-semibold text-[#111827]">Критерії стратегії</h3>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-[#6B7280] transition-transform duration-200 ${isCriteriaOpen ? "rotate-180" : ""}`} strokeWidth={1.5} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 pt-2">
                  {strategy.criteria.map((criterion, idx) => (
                    <div key={idx} className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] hover:border-[#D1D5DB] transition-all" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                      <div className="flex items-start gap-3">
                        <Badge className="rounded-xl bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB] font-medium text-sm px-3 py-1 hover:bg-[#F3F4F6] flex-shrink-0">#{idx + 1}</Badge>
                        <p className="text-sm text-[#6B7280] font-medium leading-relaxed">{criterion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Expected ROI */}
            <div className="p-5 bg-white rounded-3xl border border-[#F3F4F6] hover:border-[#D1D5DB] transition-colors duration-300" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#F0FDF4] border-2 border-[#22C55E]">
                    <Percent className="h-5 w-5 text-[#16A34A]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Очікуваний ROI</p>
                    <p className="text-2xl font-semibold text-[#16A34A]">+{strategy.expectedROI}%</p>
                  </div>
                </div>
                <Badge className={getRiskColor(strategy.riskLevel) + " text-sm px-3 py-1 font-medium hover:opacity-100"}>
                  Ризик: {getRiskLabel(strategy.riskLevel)}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Internal sub-components ── */

function StatCell({ label, value, color }: { label: string; value: string | number; color?: "green" | "red" | "default" }) {
  const colorClass = color === "green" ? "text-[#22C55E]" : color === "red" ? "text-[#EF4444]" : "text-[#111827]";
  return (
    <div className="p-5 bg-white rounded-2xl border border-[#F3F4F6] hover:border-[#D1D5DB] transition-colors duration-300 text-center shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
      <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-semibold ${colorClass}`}>{value}</p>
    </div>
  );
}

function WinLossCard({ icon, iconBg, count, label, color }: { icon: React.ReactNode; iconBg: string; count: number; label: string; color: string }) {
  return (
    <div className="p-4 bg-white rounded-3xl border border-[#F3F4F6] hover:border-[#D1D5DB] transition-colors duration-300 text-center shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${iconBg} mx-auto mb-2`}>{icon}</div>
      <p className={`text-2xl font-semibold ${color}`}>{count}</p>
      <p className="text-xs text-[#6B7280] font-medium mt-1">{label}</p>
    </div>
  );
}

function DetailBadgeCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
      <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-semibold text-[#111827]">{value}</p>
    </div>
  );
}

function BadgeListCard({ label, items, dark }: { label: string; items: string[]; dark?: boolean }) {
  return (
    <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
      <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <Badge key={idx} className={`rounded-xl font-medium text-sm px-3 py-1 ${dark ? "bg-[#111827] text-white border-0 hover:bg-[#111827]" : "bg-[#F9FAFB] text-[#111827] border border-[#E5E7EB] hover:bg-[#F9FAFB]"}`}>
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}
