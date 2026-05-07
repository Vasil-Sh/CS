import { Dialog, DialogContent } from '@/components/ui/dialog';
import BetShareCard from './BetShareCard';
import type { Bet } from '@/types/betting';

interface BetShareModalProps {
  bet: Bet;
  open: boolean;
  onClose: () => void;
}

export default function BetShareModal({ bet, open, onClose }: BetShareModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm min-h-[420px] p-0 gap-0 bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F3F4F6] bg-[#F9FAFB]">
          <h2 className="text-lg font-semibold text-[#111827] tracking-tight">Поділитися</h2>
        </div>

        {/* Card preview */}
        <div className="p-6" id="bet-share-card">
          <BetShareCard bet={bet} compact />
        </div>
      </DialogContent>
    </Dialog>
  );
}