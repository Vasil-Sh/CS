import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import { getStatusBadge } from "@/lib/displayHelpers";

interface CommentModalProps {
  open: boolean;
  onClose: () => void;
  matchInfo: string;
  comment: string;
  team1Logo?: string | null;
  team2Logo?: string | null;
}

export default function CommentModal({
  open,
  onClose,
  matchInfo,
  comment,
  team1Logo,
  team2Logo,
}: CommentModalProps) {
  // Split by double newline to separate team comments into individual cards
  const teamComments = comment.split("\n\n").filter((block) => block.trim());

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl border border-gray-100 bg-white p-0 gap-0 [&>button]:hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 flex-shrink-0">
              <MessageSquare
                className="h-5 w-5 text-blue-500"
                strokeWidth={1.5}
              />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Коментар
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-0.5 font-normal">
                {matchInfo}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Content — separate card per team */}
        <div className="px-6 pb-6 pt-4 space-y-3">
          {teamComments.map((block, index) => {
            // Format: "Team Name: notes" or "Team Name: notes|STATUS"
            const pipeIdx = block.lastIndexOf("|");
            const statusText =
              pipeIdx > -1 ? block.slice(pipeIdx + 1).trim() : "";
            const body = pipeIdx > -1 ? block.slice(0, pipeIdx).trim() : block;
            const colonIndex = body.indexOf(":");
            const teamLabel =
              colonIndex > -1 ? body.slice(0, colonIndex + 1) : "";
            const teamNotes =
              colonIndex > -1 ? body.slice(colonIndex + 1).trim() : body;

            // Determine which logo to show: match the team name from the label.
            // Simple index-based: team1 gets index 0, team2 gets index 1.
            let logoToShow: string | null = null;
            if (teamComments.length <= 2) {
              logoToShow = (index === 0 ? team1Logo : team2Logo) || null;
            }

            return (
              <div
                key={index}
                className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4"
                style={{
                  boxShadow:
                    "0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
                }}
              >
                {teamLabel && (
                  <p className="text-sm font-semibold text-gray-900 mb-1.5 flex items-center gap-2">
                    {logoToShow && (
                      <img
                        src={logoToShow}
                        alt=""
                        className="h-8 w-8 rounded-full object-contain bg-white"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    )}
                    <span className="truncate">{teamLabel}</span>
                    {statusText && (
                      <Badge className={getStatusBadge(statusText)}>
                        {statusText}
                      </Badge>
                    )}
                  </p>
                )}
                <p className="text-sm leading-relaxed text-gray-700">
                  {teamNotes}
                </p>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
