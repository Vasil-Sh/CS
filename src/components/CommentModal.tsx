import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, Shield, MessageSquare } from 'lucide-react';

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
  // Parse comment to extract team risks
  const commentLines = comment.split('\n').filter(line => line.trim());
  
  const getStatusColor = (line: string) => {
    if (line.includes('🔴')) return { bg: 'bg-red-50', border: 'border-red-200' };
    if (line.includes('🟠')) return { bg: 'bg-orange-50', border: 'border-orange-200' };
    if (line.includes('🟡')) return { bg: 'bg-yellow-50', border: 'border-yellow-200' };
    return { bg: 'bg-blue-50', border: 'border-blue-200' };
  };

  const getStatusIcon = (line: string) => {
    if (line.includes('🔴')) return <AlertTriangle className="h-5 w-5 text-red-700" />;
    if (line.includes('🟠')) return <AlertTriangle className="h-5 w-5 text-orange-700" />;
    if (line.includes('🟡')) return <Info className="h-5 w-5 text-yellow-700" />;
    return <Shield className="h-5 w-5 text-blue-700" />;
  };

  const removeEmojis = (text: string) => {
    return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        {/* Header */}
        <DialogHeader className="bg-gray-100 border-b-2 border-gray-300 pb-6 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
          <DialogTitle>
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-gray-900 rounded-2xl shadow-lg">
                <MessageSquare className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold text-gray-900">Коментар адміністратора</span>
                  <Badge className="rounded-full bg-gray-900 text-white border-0 font-bold text-sm px-4 py-1.5 shadow-md">
                    Важлива інформація
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Match info */}
            <div className="ml-[68px]">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600 min-w-[100px]">Матч:</span>
                <span className="text-base font-bold text-gray-900">{matchInfo}</span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {commentLines.map((line, index) => {
            if (!line.trim()) return null;
            
            // Extract team name and comment
            const parts = line.split(':');
            const teamPart = parts[0]?.trim() || '';
            const commentPart = parts.slice(1).join(':').trim() || '';
            
            const colors = getStatusColor(line);
            
            return (
              <div 
                key={index}
                className={`p-5 rounded-2xl border-2 ${colors.border} ${colors.bg} shadow-md hover:shadow-lg transition-all`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-xl border-2 border-gray-300 shadow-sm">
                    {getStatusIcon(line)}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg text-gray-900 mb-2">
                      {removeEmojis(teamPart)}
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {commentPart}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Warning Footer */}
          <div className="p-4 bg-gray-100 rounded-2xl border-2 border-gray-200 shadow-md">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-xl border-2 border-gray-300 shadow-sm">
                <AlertTriangle className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                  Увага
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Ця інформація надана адміністратором на основі аналізу ризиків команд. 
                  Використовуйте її для прийняття більш обґрунтованих рішень щодо ставок.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}