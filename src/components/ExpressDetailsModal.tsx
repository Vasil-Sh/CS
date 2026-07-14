import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trophy, Zap, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { Bet } from '@/types/betting';
import type { ParsedEvent } from '@/lib/parser/expressParser';
import { getBetTypeLabel } from '@/lib/displayHelpers';

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
      <DialogContent className="sm:max-w-[640px] rounded-3xl border border-gray-100 bg-white p-0 gap-0 max-h-[90vh] overflow-y-auto [&>button]:hidden">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 flex-shrink-0">
              <Trophy className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Деталі експрес-ставки
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-0.5">
                {parsedEvents.length} {parsedEvents.length === 1 ? 'подія' : parsedEvents.length < 5 ? 'події' : 'подій'} · Загальний коефіцієнт <span className="font-semibold text-gray-900">{totalOdds.toFixed(2)}</span>
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="border-t border-gray-100" />

        <div className="space-y-4 p-6 bg-gray-100">
          {/* Summary Cards — 2×2 grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Кількість подій</p>
              <p className="text-2xl font-bold text-gray-900">{parsedEvents.length}</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Сума ставки</p>
              <p className="text-2xl font-bold text-gray-900">{amount}{currencySymbol}</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Загальний коефіцієнт</p>
              <p className="text-2xl font-bold text-gray-900">{totalOdds.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-2xl border border-green-200" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)' }}>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Можливий виграш</p>
              <p className="text-2xl font-bold text-green-600">{potentialWin}{currencySymbol}</p>
            </div>
          </div>

          {/* Events Section — Collapsible */}
          <Collapsible open={isEventsOpen} onOpenChange={setIsEventsOpen} className="bg-white/90 rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50">
                    <Zap className="h-4 w-4 text-blue-500" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Події в експресі</h3>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isEventsOpen ? 'rotate-180' : ''}`}
                  strokeWidth={1.5}
                />
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-5 pt-0">
                {parsedEvents.map((event, index) => {
                  const logos = bet.expressLogos?.[index];
                  return (
                    <div
                      key={index}
                      className="p-4 bg-white rounded-2xl border border-gray-200"
                      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.03)' }}
                    >
                      <div className="space-y-2.5">
                        {/* Header with number and odds */}
                        <div className="flex items-center justify-between gap-2">
                          <Badge className="rounded-lg bg-gray-900 text-white border-0 font-medium text-xs px-2.5 py-0.5 hover:bg-gray-900">
                            #{event.number}
                          </Badge>
                          <Badge className="rounded-lg bg-blue-50 text-blue-600 border border-blue-100 font-semibold text-sm px-3 py-0.5 hover:bg-blue-50">
                            {parseFloat(event.odds).toFixed(2)}
                          </Badge>
                        </div>

                        {/* Match name with logos */}
                        <div className="flex items-center gap-1.5">
                          <img
                            src={logos?.logoTeam1 || (bet.game === 'Dota2' ? '/assets/team-placeholder-dota.svg' : '/assets/team-placeholder.svg')}
                            alt=""
                            className="h-5 w-5 rounded-full object-contain bg-gray-100 flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <h4 className="font-semibold text-sm text-gray-900 leading-tight">{event.match}</h4>
                          <img
                            src={logos?.logoTeam2 || (bet.game === 'Dota2' ? '/assets/team-placeholder-dota.svg' : '/assets/team-placeholder.svg')}
                            alt=""
                            className="h-5 w-5 rounded-full object-contain bg-gray-100 flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>

                        {/* Bet details */}
                        <div className="space-y-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <p className="text-xs text-gray-900">
                            <span className="text-gray-400">Тип:</span> <span className="font-medium ml-1">{getBetTypeLabel(event.betType, bet.format).replace(/\bMapWinner\b/g, 'Переможець карти').replace(/\bMatchWinner\b/g, 'Переможець матчу')}</span>
                          </p>
                          <p className="text-xs text-gray-900">
                            <span className="text-gray-400">Вибір:</span> <span className="font-semibold ml-1">{event.selection}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </DialogContent>
    </Dialog>
  );
}
