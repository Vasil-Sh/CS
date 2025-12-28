import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, Shield } from 'lucide-react';

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
  const commentLines = comment.split('\n');
  
  const getStatusColor = (line: string) => {
    if (line.includes('🔴')) return 'bg-red-100 text-red-700 border-red-300';
    if (line.includes('🟠')) return 'bg-orange-100 text-orange-700 border-orange-300';
    if (line.includes('🟡')) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-blue-100 text-blue-700 border-blue-300';
  };

  const getStatusIcon = (line: string) => {
    if (line.includes('🔴')) return <AlertTriangle className="h-5 w-5 text-red-600" />;
    if (line.includes('🟠')) return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    if (line.includes('🟡')) return <Info className="h-5 w-5 text-yellow-600" />;
    return <Shield className="h-5 w-5 text-blue-600" />;
  };

  const removeEmojis = (text: string) => {
    // Remove all emojis using Unicode ranges
    return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-orange-200 pb-6 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
          <DialogTitle className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl shadow-lg">
              <AlertTriangle className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold text-gray-900">Коментар адміністратора</span>
                <Badge className="rounded-full bg-gradient-to-r from-orange-600 to-red-600 text-white border-0 font-bold text-sm px-3 py-1 shadow-md">
                  Важлива інформація
                </Badge>
              </div>
              <p className="text-sm font-medium text-gray-600">{matchInfo}</p>
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
            
            return (
              <div 
                key={index}
                className={`p-5 rounded-2xl border-2 shadow-md ${getStatusColor(line)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
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

          {/* Warning */}
          <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl mt-6">
            <p className="text-xs text-amber-800 font-medium">
              ⚠️ <strong>Увага:</strong> Ця інформація надана адміністратором на основі аналізу ризиків команд. 
              Використовуйте її для прийняття більш обґрунтованих рішень щодо ставок.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}