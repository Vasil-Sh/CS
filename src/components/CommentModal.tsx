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
    if (line.includes('🔴')) return { bg: 'bg-[#FEF2F2]', border: 'border-[#FECACA]', text: 'text-[#DC2626]' };
    if (line.includes('🟠')) return { bg: 'bg-[#FFF7ED]', border: 'border-[#FED7AA]', text: 'text-[#EA580C]' };
    if (line.includes('🟡')) return { bg: 'bg-[#FFFBEB]', border: 'border-[#FDE68A]', text: 'text-[#D97706]' };
    return { bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]', text: 'text-[#2563EB]' };
  };

  const getStatusIcon = (line: string) => {
    if (line.includes('🔴')) return <AlertTriangle className="h-5 w-5 text-[#DC2626]" strokeWidth={1.5} />;
    if (line.includes('🟠')) return <AlertTriangle className="h-5 w-5 text-[#EA580C]" strokeWidth={1.5} />;
    if (line.includes('🟡')) return <Info className="h-5 w-5 text-[#D97706]" strokeWidth={1.5} />;
    return <Shield className="h-5 w-5 text-[#2563EB]" strokeWidth={1.5} />;
  };

  const removeEmojis = (text: string) => {
    return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[#E5E7EB] shadow-[0_20px_60px_rgba(0,0,0,0.15)] bg-white p-0 gap-0">
        {/* Header */}
        <DialogHeader className="bg-[#F9FAFB] border-b border-[#E5E7EB] p-6 rounded-t-2xl">
          <DialogTitle>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#111827] rounded-xl">
                <MessageSquare className="h-5 w-5 text-white" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-[#111827]">Коментар адміністратора</h2>
                <p className="text-sm text-[#6B7280] mt-1.5">{matchInfo}</p>
              </div>
              <Badge className="rounded-lg bg-white border border-[#E5E7EB] text-[#6B7280] font-medium text-xs px-3 py-1">
                Ризики
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 p-6">
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
                className="border border-[#E5E7EB] rounded-xl bg-white overflow-hidden p-4"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    line.includes('🔴') ? 'bg-[#FEF2F2] border-[#FECACA]' :
                    line.includes('🟠') ? 'bg-[#FFF7ED] border-[#FED7AA]' :
                    line.includes('🟡') ? 'bg-[#FFFBEB] border-[#FDE68A]' :
                    'bg-[#EFF6FF] border-[#BFDBFE]'
                  }`}>
                    {getStatusIcon(line)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-[#111827] mb-1.5">
                      {removeEmojis(teamPart)}
                    </div>
                    <p className="text-sm text-[#6B7280] leading-relaxed">
                      {commentPart}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Warning */}
          <div className="border border-[#E5E7EB] rounded-xl bg-[#F9FAFB] overflow-hidden p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg border border-[#E5E7EB]">
                <AlertTriangle className="h-4 w-4 text-[#9CA3AF]" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#374151] uppercase tracking-wider mb-1.5">
                  Увага
                </p>
                <p className="text-xs text-[#6B7280] leading-relaxed">
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