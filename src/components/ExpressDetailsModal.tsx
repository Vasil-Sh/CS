import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trophy, Zap, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { Bet } from '@/types/betting';
import type { ParsedEvent } from '@/lib/parser/expressParser';

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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto border border-[#F3F4F6] rounded-3xl bg-white p-0"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
      >
        <DialogHeader className="border-b border-[#F3F4F6] px-8 py-6">
          <DialogTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#F3F4F6] flex-shrink-0">
                <Trophy className="h-6 w-6 text-[#111827]" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[#111827]">Деталі експрес-ставки</h2>
                <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 bg-[#F9FAFB] rounded-xl border border-[#F3F4F6]">
                  <p className="text-sm text-[#6B7280] font-medium">
                    {parsedEvents.length} {parsedEvents.length === 1 ? 'подія' : parsedEvents.length < 5 ? 'події' : 'подій'} • Коефіцієнт {totalOdds.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-[#F9FAFB] rounded-2xl border border-[#F3F4F6] text-center">
              <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">Кількість подій</p>
              <p className="text-3xl font-semibold text-[#111827]">{parsedEvents.length}</p>
            </div>
            <div className="p-5 bg-[#F9FAFB] rounded-2xl border border-[#F3F4F6] text-center">
              <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">Загальний коефіцієнт</p>
              <p className="text-3xl font-semibold text-[#111827]">{totalOdds.toFixed(2)}</p>
            </div>
            <div className="p-5 bg-[#F9FAFB] rounded-2xl border border-[#F3F4F6] text-center">
              <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">Сума ставки</p>
              <p className="text-3xl font-semibold text-[#111827]">{amount}{currencySymbol}</p>
            </div>
            <div className="p-5 bg-[#F0FDF4] rounded-2xl border border-[#BBF7D0] text-center">
              <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">Можливий виграш</p>
              <p className="text-3xl font-semibold text-[#16A34A]">{potentialWin}{currencySymbol}</p>
            </div>
          </div>

          {/* Events Grid - Collapsible */}
          <Collapsible open={isEventsOpen} onOpenChange={setIsEventsOpen} className="bg-[#F9FAFB] rounded-2xl border border-[#F3F4F6] overflow-hidden">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between px-6 py-4 hover:bg-[#F3F4F6] transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#F3F4F6]">
                    <Zap className="h-4.5 w-4.5 text-[#111827]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-semibold text-[#111827]">Події в експресі</h3>
                </div>
                <ChevronDown 
                  className={`h-5 w-5 text-[#6B7280] transition-transform duration-200 ${isEventsOpen ? 'rotate-180' : ''}`}
                  strokeWidth={1.5}
                />
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 pt-2">
                {parsedEvents.map((event, index) => (
                  <div 
                    key={index}
                    className="p-5 bg-white rounded-2xl border border-[#F3F4F6] hover:border-[#E5E7EB] transition-all"
                    style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                  >
                    <div className="space-y-3">
                      {/* Header with number and odds */}
                      <div className="flex items-center justify-between gap-2">
                        <Badge className="rounded-xl bg-[#111827] text-white border-0 font-medium text-sm px-3 py-1 hover:bg-[#111827]">
                          #{event.number}
                        </Badge>
                        <Badge className="rounded-xl bg-[#F9FAFB] text-[#111827] border border-[#E5E7EB] font-semibold text-lg px-4 py-1 hover:bg-[#F9FAFB]">
                          {parseFloat(event.odds).toFixed(2)}
                        </Badge>
                      </div>
                      
                      {/* Match name */}
                      <h4 className="font-semibold text-base text-[#111827] leading-tight">{event.match}</h4>
                      
                      {/* Bet details */}
                      <div className="space-y-2 bg-[#F9FAFB] rounded-xl p-4 border border-[#F3F4F6]">
                        <p className="text-sm text-[#111827]">
                          <span className="text-[#9CA3AF]">Тип:</span> <span className="font-medium ml-1">{event.betType}</span>
                        </p>
                        <p className="text-sm text-[#111827]">
                          <span className="text-[#9CA3AF]">Вибір:</span> <span className="font-semibold ml-1">{event.selection}</span>
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