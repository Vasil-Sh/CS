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
    if (line.includes('🔴')) return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' };
    if (line.includes('🟠')) return { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' };
    if (line.includes('🟡')) return { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' };
    return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' };
  };

  const getStatusIcon = (line: string) => {
    if (line.includes('🔴')) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (line.includes('🟠')) return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    if (line.includes('🟡')) return <Info className="h-4 w-4 text-yellow-600" />;
    return <Shield className="h-4 w-4 text-blue-600" />;
  };

  const removeEmojis = (text: string) => {
    return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50 border-0 shadow-2xl rounded-3xl">
        {/* Header */}
        <DialogHeader className="border-b border-gray-200 pb-5">
          <DialogTitle>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl shadow-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">Коментар адміністратора</h2>
                <p className="text-sm text-gray-500 font-medium mt-0.5">{matchInfo}</p>
              </div>
              <Badge className="rounded-full bg-gradient-to-r from-orange-600 to-red-600 text-white border-0 font-semibold text-xs px-3 py-1 shadow-md">
                Ризики
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
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
                className={`p-4 rounded-2xl ${colors.bg} border ${colors.border} shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    {getStatusIcon(line)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm ${colors.text} mb-1.5`}>
                      {removeEmojis(teamPart)}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {commentPart}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Warning */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <AlertTriangle className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                  Увага
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Інформація надана адміністратором на основі аналізу ризиків команд. Використовуйте для прийняття обґрунтованих рішень.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}