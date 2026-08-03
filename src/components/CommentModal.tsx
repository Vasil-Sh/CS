import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, X } from "lucide-react";
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
            <div className="flex-1">
              <DialogTitle className="text-lg font-bold text-gray-900">
                Коментар
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-0.5 font-normal">
                {matchInfo}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </DialogHeader>

        {/* Content — separate card per team */}
        <div className="px-6 pb-6 pt-4 space-y-3">
          {teamComments.map((block, index) => {
            // Format: "Team Name: notes|STATUS|GAME" or "Team Name: notes|STATUS"
            const parts = block.split("|");
            const gameTag = parts.length >= 3 ? parts.pop()!.trim() : "";
            const statusText = parts.length >= 2 ? parts.pop()!.trim() : "";
            const body = parts.join("|").trim();
            const colonIndex = body.indexOf(":");
            const teamLabel =
              colonIndex > -1 ? body.slice(0, colonIndex + 1) : "";
            const teamNotes =
              colonIndex > -1 ? body.slice(colonIndex + 1).trim() : body;

            // Determine which logo to show by matching team name from the label
            // against the team names in matchInfo (which always has "team1 vs team2").
            let logoToShow: string | null = null;
            if (teamLabel && (team1Logo || team2Logo)) {
              const rawName = teamLabel
                .replace(/:\s*$/, "") // strip trailing colon
                .replace(/^[^\w\sа-яіїєґa-z]+/i, "") // strip leading emoji
                .toLowerCase()
                .trim();

              // MatchInfo format: "Team1 vs Team2 (Bo3, TIER3)"
              const infoParts = matchInfo.split(" vs ");
              const t1 = infoParts[0]?.toLowerCase().trim() || "";
              const t2 =
                infoParts[1]?.split(" (")[0]?.toLowerCase().trim() || "";

              if (t1 && (t1.includes(rawName) || rawName.includes(t1))) {
                logoToShow = team1Logo || null;
              } else if (t2 && (t2.includes(rawName) || rawName.includes(t2))) {
                logoToShow = team2Logo || null;
              }

              // Fallback: use index order
              if (!logoToShow && teamComments.length <= 2) {
                logoToShow = (index === 0 ? team1Logo : team2Logo) || null;
              }
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
                    {gameTag && (
                      <Badge
                        className={
                          gameTag === "Dota2"
                            ? "bg-violet-100 text-[#5B21B6] hover:bg-violet-100 border border-violet-200 rounded-full font-medium text-sm px-3 py-1"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-full font-medium text-sm px-3 py-1"
                        }
                      >
                        {gameTag === "Dota2" ? "Dota 2" : "CS2"}
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
