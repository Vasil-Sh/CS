import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50 border-0 shadow-2xl rounded-3xl">
        <DialogHeader className="border-b border-gray-200 pb-5">
          <DialogTitle>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Деталі експрес-ставки</h2>
                <p className="text-sm text-gray-500 font-normal mt-1">
                  {parsedEvents.length} подій • Коефіцієнт {totalOdds.toFixed(2)}
                </p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Кількість подій</p>
                <p className="text-2xl font-bold text-purple-700">{parsedEvents.length}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Загальний коефіцієнт</p>
                <p className="text-2xl font-bold text-purple-700">{totalOdds.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Сума ставки</p>
                <p className="text-2xl font-bold text-purple-700">{amount}{currencySymbol}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Можливий виграш</p>
                <p className="text-2xl font-bold text-green-600">{potentialWin}{currencySymbol}</p>
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Події в експресі</h3>
            {parsedEvents.map((event, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-4 border-2 border-gray-200 hover:border-purple-300 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="rounded-full bg-purple-600 text-white border-0 font-bold text-sm px-3 py-1">
                        #{event.number}
                      </Badge>
                      <h4 className="font-bold text-base text-gray-900">{event.match}</h4>
                    </div>
                    <div className="space-y-1 ml-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-700">Тип:</span> {event.betType}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-700">Вибір:</span> {event.selection}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Badge className="rounded-full bg-orange-100 text-orange-700 border-0 font-bold text-lg px-4 py-2">
                      {parseFloat(event.odds).toFixed(2)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}