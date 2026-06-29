import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalName: string;
  onDelete: () => void;
}

export default function DeleteGoalDialog({
  open,
  onOpenChange,
  goalName,
  onDelete,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-md border border-[#E5E7EB] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-red-100 flex-shrink-0">
              <Trash2 className="h-5 w-5 text-[#DC2626]" strokeWidth={1.5} />
            </div>
            <DialogTitle className="text-xl font-semibold text-[#111827]">
              Видалити ціль
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="border-t border-[#E5E7EB]" />

        <div className="px-6 pb-6 pt-4 space-y-3 bg-[#F3F4F6]">
          <div className="text-center">
            <div className="flex flex-col items-center px-5 py-5 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
              <DialogDescription className="text-lg font-bold text-[#111827] text-center">
                {goalName}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-[#FECACA]">
            <AlertTriangle
              className="h-5 w-5 text-[#DC2626] flex-shrink-0 mt-0.5"
              strokeWidth={1.5}
            />
            <p className="text-sm text-[#991B1B]">
              Ця дія незворотна. Ціль буде видалена, а пов&apos;язані дані
              залишаться незмінними.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-[#E5E7EB] font-medium"
            >
              Скасувати
            </Button>
            <Button
              onClick={onDelete}
              className="rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-medium"
            >
              <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Видалити
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
