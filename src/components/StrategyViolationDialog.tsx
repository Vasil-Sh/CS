import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-orange-900">
              ⚠️ Порушення стратегії
            </DialogTitle>
          </div>
          <DialogDescription className="text-base text-gray-700 pt-2">
            Стратегія: <span className="font-semibold text-gray-900">"{strategyName}"</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {violations.map((violation, index) => (
            <div
              key={index}
              className="p-3 bg-orange-50 border border-orange-200 rounded-xl"
            >
              <p className="text-sm text-orange-900 flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                <span>{violation.message}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
          <p className="text-sm text-yellow-900 font-medium">
            🟨 Ви все одно можете створити ставку, підтвердивши попередження.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="rounded-xl flex-1"
          >
            Скасувати
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl flex-1"
          >
            Підтвердити і створити
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}