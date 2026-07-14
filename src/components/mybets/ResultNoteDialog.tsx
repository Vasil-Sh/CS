import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, AlertTriangle } from "lucide-react";
import type { Bet } from "@/types/betting";

interface ResultNoteDialogProps {
  open: boolean;
  resultNote: string;
  onResultNoteChange: (v: string) => void;
  pendingAction: { bet: Bet; result: "Win" | "Loss" } | null;
  onConfirm: () => void;
  onSkip: () => void;
}

export default function ResultNoteDialog({
  open, resultNote, onResultNoteChange, pendingAction,
  onConfirm, onSkip,
}: ResultNoteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onSkip(); }}>
      <DialogContent className="rounded-3xl max-w-lg border border-gray-200 p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-2xl flex-shrink-0 ${pendingAction?.result === "Win" ? "bg-green-100" : "bg-red-100"}`}>
              {pendingAction?.result === "Win"
                ? <Trophy className="h-5 w-5 text-green-500" strokeWidth={1.5} />
                : <AlertTriangle className="h-5 w-5 text-red-600" strokeWidth={1.5} />}
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">Чому такий результат?</DialogTitle>
          </div>
        </DialogHeader>
        <div className="border-t border-gray-200" />
        <div className="px-6 pb-6 pt-4 space-y-3 bg-gray-100">
          {pendingAction && (
            <div className="text-center">
              <div className="flex flex-col items-center px-5 py-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-center gap-1 w-full">
                  <span className="text-base font-semibold text-gray-900 truncate max-w-[200px]">
                    {pendingAction.bet.team1 || pendingAction.bet.match?.split(" vs ")[0]} — {pendingAction.bet.team2 || pendingAction.bet.match?.split(" vs ")[1]}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Позначити як <strong className={pendingAction.result === "Win" ? "text-green-500" : "text-red-600"}>
                    {pendingAction.result === "Win" ? "Виграш" : "Програш"}
                  </strong>
                </p>
              </div>
            </div>
          )}
          <Textarea
            value={resultNote}
            onChange={(e) => onResultNoteChange(e.target.value)}
            placeholder="Опишіть причину (опціонально)..."
            className="min-h-[80px] rounded-2xl"
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={onSkip} className="flex-1 rounded-2xl">
              Пропустити
            </Button>
            <Button onClick={onConfirm} className="flex-1 rounded-2xl bg-primary hover:bg-blue-700">
              Зберегти
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
