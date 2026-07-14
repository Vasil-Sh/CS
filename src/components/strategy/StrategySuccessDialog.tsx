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
      <DialogContent className="rounded-3xl max-w-2xl border border-gray-200 gap-0">
        <DialogHeader>
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <div className="relative p-4 bg-[#DCFCE7] rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600" strokeWidth={2} />
              </div>
            </div>
            <DialogTitle className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" strokeWidth={1.5} />
              Вітаємо! Стратегію успішно створено!
              <Sparkles className="h-6 w-6 text-amber-500" strokeWidth={1.5} />
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-base">
              Ваша нова стратегія готова до використання
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="border-t border-gray-100 -mx-6" />

        {strategy && (
          <div className="space-y-4 py-4 bg-gray-100 -mx-6 px-6">
            <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  {getRiskIcon(strategy.riskLevel)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{strategy.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{strategy.description}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#DCFCE7] rounded-2xl border border-green-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4 text-green-600" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-green-600">Очікуваний ROI</span>
                </div>
                <div className="text-2xl font-bold text-green-600">+{strategy.expectedROI}%</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-500" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-blue-500">Критеріїв</span>
                </div>
                <div className="text-2xl font-bold text-blue-500">{strategy.criteria.length}</div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
                <Lightbulb className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
                Критерії стратегії:
              </h4>
              <ul className="space-y-2">
                {strategy.criteria.map((criterion, idx) => (
                  <li key={idx} className="text-sm text-gray-500 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {strategy.activityLimits?.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-2xl border border-red-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-red-600" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-red-600">🔒 Блокування після</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {strategy.activityLimits.blockAfterLosses} програшів
                  </div>
                  <p className="text-xs text-[#B91C1C] mt-1">поспіль</p>
                </div>
                <div className="p-4 bg-red-50 rounded-2xl border border-red-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-red-600" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-red-600">Пауза</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {strategy.activityLimits.blockDurationMinutes ?? 60} хв
                  </div>
                  <p className="text-xs text-[#B91C1C] mt-1">без можливості додавати ставки</p>
                </div>
              </div>
            )}

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 shadow-sm">
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-500 text-sm">
                <Info className="h-4 w-4" strokeWidth={1.5} />
                Наступні кроки:
              </h4>
              <ul className="space-y-1 text-sm text-blue-500">
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
            className="flex-1 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Чудово, зрозуміло!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
