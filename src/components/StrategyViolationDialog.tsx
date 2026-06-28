import { AlertTriangle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface StrategyViolation {
  type: 'odds' | 'format' | 'betType';
  message: string;
}

interface StrategyViolationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategyName: string;
  violations: StrategyViolation[];
  onConfirm: () => void;
  onCancel: () => void;
}

export default function StrategyViolationDialog({
  open,
  onOpenChange,
  strategyName,
  violations,
  onConfirm,
  onCancel
}: StrategyViolationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl border border-[#F3F4F6] bg-white p-0 gap-0 [&>button]:hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-red-100">
                <AlertTriangle className="h-5 w-5 text-[#DC2626]" strokeWidth={1.5} />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-[#111827]">
                  Порушення стратегії
                </DialogTitle>
                <DialogDescription className="text-sm text-[#6B7280] mt-0.5">
                  Стратегія: <span className="font-semibold text-[#111827]">"{strategyName}"</span>
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="flex items-center justify-center w-8 h-8 rounded-xl hover:bg-[#F3F4F6] transition-colors"
            >
              <X className="h-4 w-4 text-[#9CA3AF]" strokeWidth={1.5} />
            </button>
          </div>
        </DialogHeader>

        <div className="border-t border-[#E5E7EB]" />

        {/* Violations + Info — gray background */}
        <div className="px-6 py-5 space-y-3 bg-[#F3F4F6]">
          {violations.map((violation, index) => (
            <div
              key={index}
              className="flex items-start gap-3 px-4 py-3.5 bg-white border border-[#FECACA] rounded-2xl"
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[#DC2626] mt-0.5" strokeWidth={1.5} />
              <p className="text-sm font-medium text-[#991B1B] leading-relaxed">
                {violation.message}
              </p>
            </div>
          ))}

          {/* Info Banner */}
          <div className="px-4 py-3.5 bg-white border border-[#E5E7EB] rounded-2xl">
            <p className="text-sm text-gray-900 leading-relaxed flex items-start gap-1.5">
              <AlertTriangle className="h-4 w-4 text-[#DC2626] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              Ви все одно можете створити ставку, підтвердивши попередження.
            </p>
          </div>
        </div>

        <div className="border-t border-[#E5E7EB]" />

        {/* Footer Buttons */}
        <div className="flex items-center gap-3 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-11 rounded-2xl border border-[#E5E7EB] bg-white text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all duration-200"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-11 rounded-2xl bg-[#447afc] text-sm font-semibold text-white hover:bg-[#3568d4] transition-all duration-200"
          >
            Підтвердити і створити
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}