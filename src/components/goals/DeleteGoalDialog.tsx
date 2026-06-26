import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalName: string;
  onDelete: () => void;
}

export default function DeleteGoalDialog({ open, onOpenChange, goalName, onDelete }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border border-[#E5E7EB]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FEF2F2] rounded-2xl">
              <AlertTriangle className="h-5 w-5 text-[#DC2626]" strokeWidth={1.5} />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-[#111827]">Видалити ціль</DialogTitle>
              <DialogDescription className="text-base text-[#6B7280] mt-0.5">
                Ви впевнені, що хочете видалити ціль "{goalName}"? Цю дію неможливо скасувати.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-3 border-t border-[#E5E7EB]">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-3xl border-[#E5E7EB] hover:bg-[#F9FAFB] font-medium h-11 px-5 text-base">Скасувати</Button>
          <Button onClick={onDelete} className="rounded-3xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-medium h-11 px-5 text-base">
            <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />Видалити
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
