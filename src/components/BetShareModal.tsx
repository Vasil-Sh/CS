import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import BetShareCard from './BetShareCard';

interface BetShareModalProps {
  bet: any;
  open: boolean;
  onClose: () => void;
}

export default function BetShareModal({ bet, open, onClose }: BetShareModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 bg-gradient-to-b from-gray-50 to-white border-0 shadow-2xl rounded-3xl">
        {/* iOS-style header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Поділитися</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-600" />
          </Button>
        </div>

        {/* Card preview */}
        <div className="p-6" id="bet-share-card">
          <BetShareCard bet={bet} />
        </div>
      </DialogContent>
    </Dialog>
  );
}