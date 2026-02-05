import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, Shield, MessageSquare, X } from 'lucide-react';

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
    if (line.includes('🔴')) return { bg: 'bg-[#FFEBEE]', border: 'border-[#F44336]', text: 'text-[#2A2A2A]' };
    if (line.includes('🟠')) return { bg: 'bg-[#FFF3E0]', border: 'border-[#FF9800]', text: 'text-[#2A2A2A]' };
    if (line.includes('🟡')) return { bg: 'bg-[#FFFDE7]', border: 'border-[#F4E157]', text: 'text-[#2A2A2A]' };
    return { bg: 'bg-[#E3F2FD]', border: 'border-[#2196F3]', text: 'text-[#2A2A2A]' };
  };

  const getStatusIcon = (line: string) => {
    if (line.includes('🔴')) return <AlertTriangle className="h-5 w-5 text-[#F44336]" strokeWidth={1.5} />;
    if (line.includes('🟠')) return <AlertTriangle className="h-5 w-5 text-[#FF9800]" strokeWidth={1.5} />;
    if (line.includes('🟡')) return <Info className="h-5 w-5 text-[#F4E157]" strokeWidth={1.5} />;
    return <Shield className="h-5 w-5 text-[#2196F3]" strokeWidth={1.5} />;
  };

  const removeEmojis = (text: string) => {
    return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-[32px] border-2 border-[#E8E6DC] shadow-[0_16px_48px_rgba(0,0,0,0.12)] bg-white p-0 gap-0">
        {/* Custom Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2.5 rounded-[16px] bg-[#F5F5F3] hover:bg-[#E8E6DC] transition-all duration-300 z-50 group"
        >
          <X className="h-5 w-5 text-[#6B6B6B] group-hover:text-[#4A4A4A] transition-colors" strokeWidth={1.5} />
        </button>

        {/* Header */}
        <DialogHeader className="bg-[#F5F5F3] border-b-2 border-[#E8E6DC] p-8 rounded-t-[30px]">
          <DialogTitle>
            <div className="flex items-center gap-4">
              <div className="p-4 bg-[#F4E157] rounded-[24px] shadow-[0_4px_16px_rgba(244,225,87,0.4)]">
                <MessageSquare className="h-7 w-7 text-[#2A2A2A]" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-[32px] font-normal text-[#2A2A2A]">Коментар адміністратора</h2>
                <p className="text-[17px] text-[#5A5A5A] font-normal mt-2">{matchInfo}</p>
              </div>
              <Badge className="rounded-[16px] bg-white border-2 border-[#E8E6DC] text-[#5A5A5A] font-medium text-[14px] px-4 py-1.5 shadow-sm">
                Ризики
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-8">
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
                className="border-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[24px] bg-white overflow-hidden p-5"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-[20px] shadow-sm border-2 ${
                    line.includes('🔴') ? 'bg-[#FFEBEE] border-[#F44336]' :
                    line.includes('🟠') ? 'bg-[#FFF3E0] border-[#FF9800]' :
                    line.includes('🟡') ? 'bg-[#FFFDE7] border-[#F4E157]' :
                    'bg-[#E3F2FD] border-[#2196F3]'
                  }`}>
                    {getStatusIcon(line)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[17px] text-[#2A2A2A] mb-2">
                      {removeEmojis(teamPart)}
                    </div>
                    <p className="text-[15px] text-[#5A5A5A] leading-relaxed font-normal">
                      {commentPart}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Warning */}
          <div className="border-2 border-[#E8E6DC] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[24px] bg-[#F5F5F3] overflow-hidden p-5">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-white rounded-[16px] shadow-sm border-2 border-[#E8E6DC]">
                <AlertTriangle className="h-5 w-5 text-[#5A5A5A]" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-[#2A2A2A] uppercase tracking-wider mb-2">
                  Увага
                </p>
                <p className="text-[14px] text-[#5A5A5A] leading-relaxed font-normal">
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