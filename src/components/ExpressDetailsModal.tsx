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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-gray-50 to-white border-0 shadow-xl rounded-3xl">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <DialogTitle>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-slate-100 rounded-xl shadow-sm">
                <Trophy className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Деталі експрес-ставки</h2>
                <div className="mt-1 inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-slate-50 to-gray-100 rounded-full border border-slate-200 shadow-sm">
                  <p className="text-sm text-slate-700 font-semibold">
                    {parsedEvents.length} подій • Коефіцієнт {totalOdds.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Summary Card - matching Analytics style */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Кількість подій</p>
              <p className="text-2xl font-semibold text-gray-900 tracking-tight">{parsedEvents.length}</p>
            </div>
            <div className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Загальний коефіцієнт</p>
              <p className="text-2xl font-semibold text-blue-600 tracking-tight">{totalOdds.toFixed(2)}</p>
            </div>
            <div className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Сума ставки</p>
              <p className="text-2xl font-semibold text-gray-900 tracking-tight">{amount}{currencySymbol}</p>
            </div>
            <div className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Можливий виграш</p>
              <p className="text-2xl font-semibold text-green-600 tracking-tight">{potentialWin}{currencySymbol}</p>
            </div>
          </div>

          {/* Events Grid - matching Analytics card style with accent */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-50 to-gray-100 rounded-xl border border-slate-200 shadow-sm">
              <div className="p-1.5 bg-gradient-to-br from-blue-50 to-slate-100 rounded-lg shadow-sm">
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Події в експресі</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {parsedEvents.map((event, index) => (
                <div 
                  key={index}
                  className="border-0 shadow-lg rounded-2xl bg-white/80 backdrop-blur-xl overflow-hidden p-4 hover:shadow-xl transition-shadow"
                >
                  <div className="space-y-2.5">
                    {/* Header with number and odds */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge className="rounded-xl bg-gradient-to-r from-blue-50 to-slate-100 text-blue-700 border-0 font-semibold text-sm px-2.5 py-1 shadow-sm">
                        #{event.number}
                      </Badge>
                      <Badge className="rounded-xl bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-0 font-bold text-base px-3 py-1 shadow-sm">
                        {parseFloat(event.odds).toFixed(2)}
                      </Badge>
                    </div>
                    
                    {/* Match name */}
                    <h4 className="font-semibold text-base text-gray-900 leading-tight">{event.match}</h4>
                    
                    {/* Bet details */}
                    <div className="space-y-1.5 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-2.5 border border-slate-100">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-gray-500">Тип:</span> <span className="font-semibold">{event.betType}</span>
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-gray-500">Вибір:</span> <span className="font-bold text-blue-700">{event.selection}</span>
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