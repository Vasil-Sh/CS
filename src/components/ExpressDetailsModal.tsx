import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trophy, Zap, ChevronDown } from 'lucide-react';
import { useState } from 'react';
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
  const [isEventsOpen, setIsEventsOpen] = useState(true);

  if (!bet) return null;

  const totalOdds = parsedEvents.reduce((acc, event) => acc * parseFloat(event.odds), 1);
  const currencySymbol = bet.currency === 'USD' ? '$' : '₴';
  const amount = bet.originalAmount || bet.amount;
  const potentialWin = (amount * totalOdds).toFixed(2);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto border-2 border-[#E8E6DC] shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[32px] bg-white p-0">
        <DialogHeader className="border-b-2 border-[#E8E6DC] p-6">
          <DialogTitle>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#F4E157] rounded-[24px] shadow-[0_4px_12px_rgba(244,225,87,0.4)] flex-shrink-0">
                <Trophy className="h-6 w-6 text-black" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-3xl font-normal text-black">Деталі експрес-ставки</h2>
                <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#F5F5F3] to-white rounded-[20px] border-2 border-[#E8E6DC]">
                  <p className="text-base text-black font-normal">
                    {parsedEvents.length} {parsedEvents.length === 1 ? 'подія' : parsedEvents.length < 5 ? 'події' : 'подій'} • Коефіцієнт {totalOdds.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-gradient-to-br from-[#F5F5F3] to-white rounded-[24px] border-2 border-[#E8E6DC] text-center">
              <p className="text-xs font-light text-[#6B6B6B] uppercase tracking-wider mb-2">Кількість подій</p>
              <p className="text-3xl font-normal text-black">{parsedEvents.length}</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-[#F5F5F3] to-white rounded-[24px] border-2 border-[#E8E6DC] text-center">
              <p className="text-xs font-light text-[#6B6B6B] uppercase tracking-wider mb-2">Загальний коефіцієнт</p>
              <p className="text-3xl font-normal text-[#FF9800]">{totalOdds.toFixed(2)}</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-[#F5F5F3] to-white rounded-[24px] border-2 border-[#E8E6DC] text-center">
              <p className="text-xs font-light text-[#6B6B6B] uppercase tracking-wider mb-2">Сума ставки</p>
              <p className="text-3xl font-normal text-black">{amount}{currencySymbol}</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-[#F5F5F3] to-white rounded-[24px] border-2 border-[#E8E6DC] text-center">
              <p className="text-xs font-light text-[#6B6B6B] uppercase tracking-wider mb-2">Можливий виграш</p>
              <p className="text-3xl font-normal text-[#4CAF50]">{potentialWin}{currencySymbol}</p>
            </div>
          </div>

          {/* Events Grid - Collapsible */}
          <Collapsible open={isEventsOpen} onOpenChange={setIsEventsOpen} className="bg-gradient-to-br from-[#F5F5F3] to-white rounded-[24px] border-2 border-[#E8E6DC] overflow-hidden">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between px-5 py-3 hover:bg-[#F4E157]/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F4E157] rounded-[16px]">
                    <Zap className="h-5 w-5 text-black" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-normal text-black">Події в експресі</h3>
                </div>
                <ChevronDown 
                  className={`h-5 w-5 text-black transition-transform duration-200 ${isEventsOpen ? 'rotate-180' : ''}`}
                  strokeWidth={1.5}
                />
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 pt-2">
                {parsedEvents.map((event, index) => (
                  <div 
                    key={index}
                    className="p-5 bg-white rounded-[24px] border-2 border-[#E8E6DC] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:border-[#F4E157] transition-all"
                  >
                    <div className="space-y-3">
                      {/* Header with number and odds */}
                      <div className="flex items-center justify-between gap-2">
                        <Badge className="rounded-[16px] bg-[#F4E157] text-black border-0 font-normal text-base px-3 py-1.5">
                          #{event.number}
                        </Badge>
                        <Badge className="rounded-[16px] bg-gradient-to-r from-[#FF9800] to-[#FF5722] text-white border-0 font-normal text-xl px-4 py-1.5">
                          {parseFloat(event.odds).toFixed(2)}
                        </Badge>
                      </div>
                      
                      {/* Match name */}
                      <h4 className="font-normal text-lg text-black leading-tight">{event.match}</h4>
                      
                      {/* Bet details */}
                      <div className="space-y-2 bg-[#F5F5F3] rounded-[20px] p-4 border border-[#E8E6DC]">
                        <p className="text-base text-black">
                          <span className="font-light text-[#6B6B6B]">Тип:</span> <span className="font-normal ml-1">{event.betType}</span>
                        </p>
                        <p className="text-base text-black">
                          <span className="font-light text-[#6B6B6B]">Вибір:</span> <span className="font-normal text-[#FF9800] ml-1">{event.selection}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </DialogContent>
    </Dialog>
  );
}