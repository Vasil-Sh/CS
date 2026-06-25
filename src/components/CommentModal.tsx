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
      <DialogContent className="sm:max-w-[480px] rounded-3xl border border-gray-100 bg-white p-0 gap-0 [&>button]:hidden">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 flex-shrink-0">
              <MessageSquare className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Коментар
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-0.5 font-normal">{matchInfo}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Content — separate card per team */}
        <div className="px-6 pb-6 pt-4 space-y-3">
          {teamComments.map((block, index) => {
            const colonIndex = block.indexOf(':');
            const teamLabel = colonIndex > -1 ? block.slice(0, colonIndex + 1) : '';
            const teamNotes = colonIndex > -1 ? block.slice(colonIndex + 1).trim() : block;

            return (
              <div 
                key={index}
                className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)' }}
              >
                {teamLabel && (
                  <p className="text-sm font-semibold text-gray-900 mb-1.5">
                    {teamLabel}
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