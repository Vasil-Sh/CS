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
      <DialogContent className="gmd-delete-dialog">
        <DialogHeader className="gmd-delete-header">
          <div className="flex items-center gap-3">
            <div className="gmd-delete-icon">
              <Trash2 className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <DialogTitle>Видалити ціль</DialogTitle>
          </div>
        </DialogHeader>

        <div className="gmd-delete-body">
          <div className="gmd-delete-name">
            <DialogDescription className="text-lg font-bold text-center">
              {goalName}
            </DialogDescription>
          </div>

          <div className="gmd-delete-warning">
            <AlertTriangle
              className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
              strokeWidth={1.5}
            />
            <p>
              Ця дія незворотна. Ціль буде видалена, а пов&apos;язані дані
              залишаться незмінними.
            </p>
          </div>
        </div>

        <DialogFooter className="gmd-delete-footer">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Скасувати
          </Button>
          <Button
            onClick={onDelete}
            className="gmd-delete-submit"
          >
            <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Видалити
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
