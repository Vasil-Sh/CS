import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Zap, Trophy, Target, TrendingUp } from 'lucide-react';
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
  const isPending = bet.result === 'Pending';
  const isWin = bet.result === 'Win';
  const isLoss = bet.result === 'Loss';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
        {/* Header with better visibility */}
        <DialogHeader className="bg-gray-100 border-b-2 border-gray-300 pb-6 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
          <DialogTitle className="flex items-center gap-4">
            <div className="p-3 bg-gray-900 rounded-2xl shadow-lg">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold text-gray-900">Експрес-ставка</span>
                <Badge className="rounded-full bg-gray-900 text-white border-0 font-bold text-lg px-4 py-1.5 shadow-md">
                  {parsedEvents.length}×
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600">Загальний коефіцієнт:</span>
                <Badge className="rounded-full bg-green-600 text-white border-0 font-black text-2xl px-5 py-2 shadow-lg">
                  {totalOdds.toFixed(2)}
                </Badge>
              </div>
              <p className="text-sm font-medium text-gray-500 mt-2">Дата створення: {bet.date}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gray-200 rounded-xl">
                <Target className="h-5 w-5 text-gray-700" />
              </div>
              <span className="text-sm font-bold text-gray-700">Сума ставки</span>
            </div>
            <p className="text-2xl font-black text-gray-900">
              {bet.currency === 'USD' ? '$' : '₴'}{bet.originalAmount || bet.amount}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gray-200 rounded-xl">
                <TrendingUp className="h-5 w-5 text-gray-700" />
              </div>
              <span className="text-sm font-bold text-gray-700">Можливий виграш</span>
            </div>
            <p className="text-2xl font-black text-green-600">
              {bet.currency === 'USD' ? '$' : '₴'}{((bet.originalAmount || bet.amount) * totalOdds).toFixed(2)}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gray-200 rounded-xl">
                <Trophy className="h-5 w-5 text-gray-700" />
              </div>
              <span className="text-sm font-bold text-gray-700">Статус</span>
            </div>
            <Badge 
              className={`rounded-full border-0 font-bold text-base px-4 py-2 ${
                isWin ? 'bg-green-100 text-green-700' :
                isLoss ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}
            >
              {isWin ? 'Виграш' : isLoss ? 'Програш' : 'Очікується'}
            </Badge>
          </div>
        </div>

        {/* Events Section with prominent header */}
        <div className="mt-8">
          <div className="bg-gray-100 border-2 border-gray-300 rounded-2xl p-4 mb-4 shadow-md">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gray-900 rounded-xl">
                <Zap className="h-6 w-6 text-white" />
              </div>
              Події експресу
              <Badge className="rounded-full bg-gray-900 text-white border-0 font-bold text-sm px-3 py-1">
                {parsedEvents.length} подій
              </Badge>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parsedEvents.map((event, idx) => (
              <div 
                key={idx} 
                className="group p-5 bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-400 hover:shadow-xl transition-all duration-200"
              >
                {/* Event Number Badge */}
                <div className="flex items-center justify-between mb-3">
                  <Badge className="rounded-full bg-gray-900 text-white border-0 text-sm px-3 py-1 font-bold shadow-md">
                    Подія #{event.number}
                  </Badge>
                  <Badge className="rounded-full bg-green-600 text-white border-0 text-base px-3 py-1 font-black shadow-md">
                    @{parseFloat(event.odds).toFixed(2)}
                  </Badge>
                </div>

                {/* Match Name */}
                <div className="mb-3 p-3 bg-gray-50 rounded-xl">
                  <h4 className="font-bold text-gray-900 text-base leading-tight break-words">
                    {event.match}
                  </h4>
                </div>

                {/* Bet Type */}
                <div className="mb-3">
                  <p className="text-gray-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">
                    Тип ставки
                  </p>
                  <Badge className="rounded-full bg-gray-200 text-gray-700 border-0 text-sm px-3 py-1 font-bold">
                    {event.betType}
                  </Badge>
                </div>

                {/* Selection */}
                <div>
                  <p className="text-gray-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">
                    Вибір
                  </p>
                  <p className="font-bold text-gray-900 text-sm break-words bg-gray-100 p-2 rounded-lg" title={event.selection}>
                    {event.selection}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 p-4 bg-gray-100 rounded-2xl border-2 border-gray-200 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl border-2 border-gray-300 shadow-sm">
                <Zap className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Формат</p>
                <p className="text-base font-black text-gray-900">{bet.format}</p>
              </div>
            </div>
            {bet.goalId && (
              <div className="text-right">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Ціль</p>
                <Badge className="rounded-full bg-gray-900 text-white border-0 text-base px-4 py-2 font-bold shadow-md">
                  {bet.goalId}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}