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

  const getAccentColor = (line: string) => {
    if (line.includes('🔴')) return '#EF4444';
    if (line.includes('🟠')) return '#F97316';
    if (line.includes('🟡')) return '#EAB308';
    return '#3B82F6';
  };

  const removeEmojis = (text: string) => {
    return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
  };

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

        {/* Content */}
        <div className="px-6 pb-6 space-y-3">
          {commentLines.map((line, index) => {
            if (!line.trim()) return null;
            
            const parts = line.split(':');
            const teamPart = parts[0]?.trim() || '';
            const commentPart = parts.slice(1).join(':').trim() || '';
            const accentColor = getAccentColor(line);

            return (
              <div 
                key={index}
                className="rounded-xl bg-[#F9FAFB] px-4 py-3 border-l-[3px]"
                style={{ borderLeftColor: accentColor }}
              >
                <p className="font-semibold text-sm text-[#111827]">
                  {removeEmojis(teamPart)}
                </p>
                {commentPart && (
                  <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">
                    {commentPart}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}