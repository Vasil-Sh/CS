import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import type { Bet } from "@/types/betting";

interface DeleteBetDialogProps {
  bet: Bet | null;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteBetDialog({ bet, onConfirm, onClose }: DeleteBetDialogProps) {
  if (!bet) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl max-w-md border border-[#E5E7EB] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-red-100 flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-[#DC2626]" strokeWidth={1.5} />
            </div>
            <DialogTitle className="text-xl font-semibold text-[#111827]">Видалити запис?</DialogTitle>
          </div>
        </DialogHeader>
        <div className="border-t border-[#E5E7EB]" />
        <div className="px-6 pb-6 pt-4 space-y-3 bg-[#F3F4F6]">
          <DialogDescription className="text-sm text-[#6B7280]">
            Ви впевнені, що хочете видалити запис <strong className="text-[#111827]">{bet.team1} vs {bet.team2}</strong>?
            <br />Цю дію неможливо скасувати.
          </DialogDescription>
          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-2xl">Скасувати</Button>
            <Button onClick={onConfirm} variant="destructive" className="flex-1 rounded-2xl">Видалити</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
