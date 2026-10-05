import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Bet } from "@/types/betting";
import "./DeleteBetDialog.css";

interface DeleteBetDialogProps {
  bet: Bet | null;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteBetDialog({
  bet,
  onConfirm,
  onClose,
}: DeleteBetDialogProps) {
  if (!bet) return null;

  const matchName =
    bet.match || `${bet.team1 || ""}${bet.team2 ? ` vs ${bet.team2}` : ""}`;

  return (
    <Dialog
      open={true}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="delete-bet">
        <header className="delete-bet__header">
          <DialogTitle className="delete-bet__title">
            Видалити запис?
          </DialogTitle>

          <DialogDescription className="delete-bet__subtitle">
            Дію неможливо скасувати.
          </DialogDescription>
        </header>

        <div className="delete-bet__body">
          <p className="delete-bet__match">{matchName}</p>

          <div className="delete-bet__warning">
            <AlertTriangle size={20} aria-hidden="true" />
            <p>
              Ви впевнені, що хочете видалити цей запис? Всі дані про ставку
              буде втрачено назавжди.
            </p>
          </div>
        </div>

        <footer className="delete-bet__footer">
          <button
            type="button"
            className="delete-bet__button"
            onClick={onClose}
          >
            Скасувати
          </button>

          <button
            type="button"
            className="delete-bet__button delete-bet__button--danger"
            onClick={onConfirm}
          >
            Видалити
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
