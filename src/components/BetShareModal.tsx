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
      <DialogContent className="max-w-2xl p-0 gap-0 bg-white border border-[#E5E7EB] shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB] bg-[#F9FAFB] rounded-t-2xl">
          <h2 className="text-lg font-semibold text-[#111827] tracking-tight">Поділитися</h2>
        </div>

        {/* Card preview */}
        <div className="p-8" id="bet-share-card">
          <BetShareCard bet={bet} />
        </div>
      </DialogContent>
    </Dialog>
  );
}