import { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import BetShareCard from './BetShareCard';
import type { Bet } from '@/types/betting';

interface BetShareModalProps {
  bet: Bet;
  open: boolean;
  onClose: () => void;
}

export default function BetShareModal({ bet, open, onClose }: BetShareModalProps) {
  const [minW, setMinW] = useState(380);
  const dragging = useRef(false);
  const start = useRef({ x: 0, w: 380 });

  const onDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    start.current = { x: e.clientX, w: minW };
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragging.current) return;
      setMinW(Math.max(360, start.current.w + e.clientX - start.current.x));
    };
    const up = () => { dragging.current = false; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);

  useEffect(() => { if (open) setMinW(380); }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="p-0 gap-0 bg-white border border-gray-200 rounded-3xl overflow-visible"
        style={{
          width: 'fit-content',
          minWidth: minW,
          maxWidth: '90vw',
          height: 'fit-content',
          maxHeight: '92vh',
          boxShadow: '0 12px 48px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)',
          userSelect: dragging.current ? 'none' : undefined,
        }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50 rounded-t-3xl" style={{ minWidth: minW }}>
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Поділитися</h2>
        </div>

        {/* Card preview */}
        <div className="p-4 bg-gray-100" id="bet-share-card" style={{ minWidth: minW }}>
          <BetShareCard bet={bet} compact />
        </div>

        {/* Corner resize handle */}
        <div
          onMouseDown={onDown}
          className="absolute -bottom-2 -right-2 w-6 h-6 cursor-ew-resize z-10 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors select-none"
          title="Тягніть щоб змінити ширину"
        >
          <svg width="14" height="6" viewBox="0 0 14 6"><path d="M3 1v4M7 1v4M11 1v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
        </div>
      </DialogContent>
    </Dialog>
  );
}