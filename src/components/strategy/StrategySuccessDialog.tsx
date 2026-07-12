import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, Percent, Target, Lightbulb, Shield, Info } from "lucide-react";
import type { CS2Strategy } from "@/types/strategy";
import { getRiskIcon } from "@/lib/strategyHelpers";

interface StrategySuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategy: CS2Strategy | null;
}

export default function StrategySuccessDialog({
  open,
  onOpenChange,
  strategy,
}: StrategySuccessDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-2xl border border-[#E5E7EB] gap-0">
        <DialogHeader>
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="relative">
              <div className="absolute inset-0 bg-[#22C55E] rounded-full blur-xl opacity-30 animate-pulse"></div>
              <div className="relative p-4 bg-[#DCFCE7] rounded-full">
                <CheckCircle2 className="h-12 w-12 text-[#16A34A]" strokeWidth={2} />
              </div>
            </div>
            <DialogTitle className="text-2xl font-semibold text-[#111827] flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-[#F59E0B]" strokeWidth={1.5} />
              Вітаємо! Стратегію успішно створено!
              <Sparkles className="h-6 w-6 text-[#F59E0B]" strokeWidth={1.5} />
            </DialogTitle>
            <DialogDescription className="text-[#6B7280] text-base">
              Ваша нова стратегія готова до використання
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="border-t border-gray-100 -mx-6" />

        {strategy && (
          <div className="space-y-4 py-4 bg-[#F3F4F6] -mx-6 px-6">
            <div className="p-6 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#EFF6FF] rounded-xl">
                  {getRiskIcon(strategy.riskLevel)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#111827]">{strategy.name}</h3>
                  <p className="text-sm text-[#6B7280] mt-0.5">{strategy.description}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#DCFCE7] rounded-2xl border border-[#BBF7D0] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4 text-[#16A34A]" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-[#16A34A]">Очікуваний ROI</span>
                </div>
                <div className="text-2xl font-bold text-[#16A34A]">+{strategy.expectedROI}%</div>
              </div>
              <div className="p-4 bg-[#EFF6FF] rounded-2xl border border-[#BFDBFE] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-[#3B82F6]" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-[#3B82F6]">Критеріїв</span>
                </div>
                <div className="text-2xl font-bold text-[#3B82F6]">{strategy.criteria.length}</div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-[#111827]">
                <Lightbulb className="h-4 w-4 text-[#F59E0B]" strokeWidth={1.5} />
                Критерії стратегії:
              </h4>
              <ul className="space-y-2">
                {strategy.criteria.map((criterion, idx) => (
                  <li key={idx} className="text-sm text-[#6B7280] flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {strategy.activityLimits?.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#FEF2F2] rounded-2xl border border-[#FECACA] shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-[#DC2626]" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-[#DC2626]">🔒 Блокування після</span>
                  </div>
                  <div className="text-2xl font-bold text-[#DC2626]">
                    {strategy.activityLimits.blockAfterLosses} програшів
                  </div>
                  <p className="text-xs text-[#B91C1C] mt-1">поспіль</p>
                </div>
                <div className="p-4 bg-[#FEF2F2] rounded-2xl border border-[#FECACA] shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-[#DC2626]" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-[#DC2626]">Пауза</span>
                  </div>
                  <div className="text-2xl font-bold text-[#DC2626]">
                    {strategy.activityLimits.blockDurationMinutes ?? 60} хв
                  </div>
                  <p className="text-xs text-[#B91C1C] mt-1">без можливості додавати ставки</p>
                </div>
              </div>
            )}

            <div className="p-4 bg-[#EFF6FF] rounded-2xl border border-[#BFDBFE] shadow-sm">
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-[#3B82F6] text-sm">
                <Info className="h-4 w-4" strokeWidth={1.5} />
                Наступні кроки:
              </h4>
              <ul className="space-y-1 text-sm text-[#3B82F6]">
                <li>• Встановіть цю стратегію як основну, натиснувши на зірочку</li>
                <li>• Почніть використовувати її при створенні нових ставок</li>
                <li>• Відстежуйте результати на вкладці &quot;Ефективність&quot;</li>
              </ul>
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 -mx-6 mb-4" />

        <DialogFooter className="gap-2">
          <Button
            onClick={handleClose}
            className="flex-1 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white font-medium"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Чудово, зрозуміло!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
