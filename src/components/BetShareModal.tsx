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
      <DialogContent className="max-w-md min-h-[420px] p-0 gap-0 bg-white border border-gray-200 rounded-3xl overflow-hidden"
        style={{ boxShadow: '0 12px 48px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Поділитися</h2>
        </div>

        {/* Card preview — non-white bg so shadow is visible */}
        <div className="p-6 bg-gray-100" id="bet-share-card">
          <BetShareCard bet={bet} compact />
        </div>
      </DialogContent>
    </Dialog>
  );
}