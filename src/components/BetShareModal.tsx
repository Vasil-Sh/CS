import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
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
      <DialogContent className="max-w-2xl p-0 gap-0 bg-[#FAFAF8] border-2 border-[#E8E6DC] shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[32px]">
        {/* RonDesignLab-style header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-[#E8E6DC] bg-white/60 backdrop-blur-sm">
          <h2 className="text-2xl font-light text-black tracking-tight">Поділитися</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 rounded-[20px] hover:bg-[#F5F5F3] transition-all duration-300"
          >
            <X className="h-5 w-5 text-[#6B6B6B]" strokeWidth={1.5} />
          </Button>
        </div>

        {/* Card preview */}
        <div className="p-8" id="bet-share-card">
          <BetShareCard bet={bet} />
        </div>
      </DialogContent>
    </Dialog>
  );
}