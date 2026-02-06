import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trophy, Zap } from 'lucide-react';
import type { Bet } from '@/types/betting';

interface ParsedEvent {
  number: string;
  match: string;
  betType: string;
  selection: string;
  odds: string;
}

interface ExpressDetailsModalProps {
  bet: Bet | null;
  open: boolean;
  onClose: () => void;
  parsedEvents: ParsedEvent[];
}

export default function ExpressDetailsModal({ bet, open, onClose, parsedEvents }: ExpressDetailsModalProps) {
  if (!bet) return null;

  const totalOdds = parsedEvents.reduce((acc, event) => acc * parseFloat(event.odds), 1);
  const currencySymbol = bet.currency === 'USD' ? '$' : '₴';
  const amount = bet.originalAmount || bet.amount;
  const potentialWin = (amount * totalOdds).toFixed(2);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-[1.5px] border-[#E8E6DC] shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[40px] bg-white">
        <DialogHeader className="border-b border-[#E8E6DC] pb-4 bg-[#FAFAF8] -mx-6 -mt-6 px-6 pt-6 rounded-t-[40px]">
          <DialogTitle>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#F4E157] rounded-[20px] shadow-[0_2px_8px_rgba(244,225,87,0.3)]">
                <Trophy className="h-5 w-5 text-[#2D2D2D]" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-xl font-normal text-[#2D2D2D]">Деталі експрес-ставки</h2>
                <div className="mt-1.5 inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-[20px] border-[1.5px] border-[#E8E6DC] shadow-sm">
                  <p className="text-sm text-[#2D2D2D] font-normal">
                    {parsedEvents.length} {parsedEvents.length === 1 ? 'подія' : parsedEvents.length < 5 ? 'події' : 'подій'} • Коефіцієнт {totalOdds.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border-[1.5px] border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-[24px] bg-white overflow-hidden p-4">
              <p className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wide mb-2">Кількість подій</p>
              <p className="text-2xl font-light text-[#2D2D2D] tracking-tight">{parsedEvents.length}</p>
            </div>
            <div className="border-[1.5px] border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-[24px] bg-white overflow-hidden p-4">
              <p className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wide mb-2">Загальний коефіцієнт</p>
              <p className="text-2xl font-light text-[#FF9800] tracking-tight">{totalOdds.toFixed(2)}</p>
            </div>
            <div className="border-[1.5px] border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-[24px] bg-white overflow-hidden p-4">
              <p className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wide mb-2">Сума ставки</p>
              <p className="text-2xl font-light text-[#2D2D2D] tracking-tight">{amount}{currencySymbol}</p>
            </div>
            <div className="border-[1.5px] border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-[24px] bg-white overflow-hidden p-4">
              <p className="text-xs font-normal text-[#6B6B6B] uppercase tracking-wide mb-2">Можливий виграш</p>
              <p className="text-2xl font-light text-[#4CAF50] tracking-tight">{potentialWin}{currencySymbol}</p>
            </div>
          </div>

          {/* Events Grid */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#FAFAF8] rounded-[24px] border-[1.5px] border-[#E8E6DC]">
              <div className="p-1.5 bg-[#F4E157] rounded-[16px]">
                <Zap className="h-4 w-4 text-[#2D2D2D]" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-normal text-[#2D2D2D]">Події в експресі</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {parsedEvents.map((event, index) => (
                <div 
                  key={index}
                  className="border-[1.5px] border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-[24px] bg-white overflow-hidden p-4 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-[#F4E157] transition-all"
                >
                  <div className="space-y-2.5">
                    {/* Header with number and odds */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge className="rounded-[16px] bg-[#F4E157] text-[#2D2D2D] border-0 font-normal text-sm px-2.5 py-1">
                        #{event.number}
                      </Badge>
                      <Badge className="rounded-[16px] bg-gradient-to-r from-[#FF9800] to-[#FF5722] text-white border-0 font-normal text-base px-3 py-1">
                        {parseFloat(event.odds).toFixed(2)}
                      </Badge>
                    </div>
                    
                    {/* Match name */}
                    <h4 className="font-normal text-base text-[#2D2D2D] leading-tight">{event.match}</h4>
                    
                    {/* Bet details */}
                    <div className="space-y-1.5 bg-[#FAFAF8] rounded-[20px] p-2.5 border-[1.5px] border-[#E8E6DC]">
                      <p className="text-sm text-[#2D2D2D]">
                        <span className="font-light text-[#6B6B6B]">Тип:</span> <span className="font-normal">{event.betType}</span>
                      </p>
                      <p className="text-sm text-[#2D2D2D]">
                        <span className="font-light text-[#6B6B6B]">Вибір:</span> <span className="font-normal text-[#FF9800]">{event.selection}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}