import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare } from 'lucide-react';

interface CommentModalProps {
  open: boolean;
  onClose: () => void;
  matchInfo: string;
  comment: string;
}

export default function CommentModal({ 
  open, 
  onClose, 
  matchInfo, 
  comment 
}: CommentModalProps) {
  // Split by double newline to separate team comments into individual cards
  const teamComments = comment.split('\n\n').filter(block => block.trim());

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl border border-[#E5E7EB] shadow-xl bg-white p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#F3F4F6] rounded-xl">
                <MessageSquare className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">Коментар</h2>
                <p className="text-sm text-[#6B7280] font-normal mt-0.5">{matchInfo}</p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Content — separate card per team */}
        <div className="px-6 pb-6 space-y-3">
          {teamComments.map((block, index) => {
            // Extract team name from the block (format: "🟡 TeamName: notes")
            const colonIndex = block.indexOf(':');
            const teamLabel = colonIndex > -1 ? block.slice(0, colonIndex + 1) : '';
            const teamNotes = colonIndex > -1 ? block.slice(colonIndex + 1).trim() : block;

            return (
              <div 
                key={index}
                className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-5 py-4"
              >
                {teamLabel && (
                  <p className="text-[15px] font-semibold text-[#111827] mb-1.5">
                    {teamLabel}
                  </p>
                )}
                <p className="text-[14px] leading-relaxed text-[#374151]">
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