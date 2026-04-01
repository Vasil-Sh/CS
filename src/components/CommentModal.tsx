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
  const commentLines = comment.split('\n').filter(line => line.trim());

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

        {/* Content — simple text block */}
        <div className="px-6 pb-6">
          <div className="rounded-xl bg-[#F9FAFB] px-5 py-4 space-y-2">
            {commentLines.map((line, index) => (
              <p 
                key={index}
                className="text-[15px] leading-relaxed text-[#111827]"
              >
                {line.trim()}
              </p>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}