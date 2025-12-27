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
        <DialogHeader className="border-b border-gray-200 pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
            <div className="p-2 bg-gray-100 rounded-xl">
              <Zap className="h-5 w-5 text-gray-700" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span>Експрес-ставка</span>
                <Badge className="rounded-full bg-gray-900 text-white border-0 font-semibold text-sm px-3 py-1">
                  {parsedEvents.length}×
                </Badge>
              </div>
              <p className="text-xs font-normal text-gray-500 mt-1">від {bet.date}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 font-normal">Загальний коефіцієнт</div>
              <Badge className="rounded-full bg-green-600 text-white border-0 font-semibold text-lg px-3 py-1.5 mt-1">
                {totalOdds.toFixed(2)}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-600">Сума ставки</span>
            </div>
            <p className="text-xl font-semibold text-gray-900">
              {bet.currency === 'USD' ? '$' : '₴'}{bet.originalAmount || bet.amount}
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-600">Можливий виграш</span>
            </div>
            <p className="text-xl font-semibold text-green-600">
              {bet.currency === 'USD' ? '$' : '₴'}{((bet.originalAmount || bet.amount) * totalOdds).toFixed(2)}
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-600">Статус</span>
            </div>
            <Badge 
              className={`rounded-full border-0 font-semibold text-sm px-3 py-1 ${
                isWin ? 'bg-green-100 text-green-700' :
                isLoss ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}
            >
              {isWin ? 'Виграш' : isLoss ? 'Програш' : 'Очікується'}
            </Badge>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-600">Профіт</span>
            </div>
            {bet.originalProfit !== undefined && bet.originalProfit !== null ? (
              <p className={`text-xl font-semibold ${bet.originalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {bet.originalProfit >= 0 ? '+' : ''}{bet.originalProfit.toFixed(2)} {bet.currency === 'USD' ? '$' : '₴'}
              </p>
            ) : (
              <p className="text-xl font-semibold text-gray-400">—</p>
            )}
          </div>
        </div>

        {/* Events Grid */}
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <div className="w-1 h-4 bg-gray-900 rounded-full" />
            Події експресу
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {parsedEvents.map((event, idx) => (
              <div 
                key={idx} 
                className="group p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
              >
                {/* Event Number Badge */}
                <div className="flex items-center justify-between mb-2">
                  <Badge className="rounded-full bg-gray-900 text-white border-0 text-xs px-2.5 py-0.5 font-semibold">
                    #{event.number}
                  </Badge>
                  <Badge className="rounded-full bg-green-600 text-white border-0 text-sm px-2.5 py-0.5 font-semibold">
                    @{parseFloat(event.odds).toFixed(2)}
                  </Badge>
                </div>

                {/* Match Name */}
                <div className="mb-2">
                  <h4 className="font-semibold text-gray-900 text-sm leading-tight break-words">
                    {event.match}
                  </h4>
                </div>

                {/* Bet Type */}
                <div className="mb-2">
                  <p className="text-gray-500 text-xs mb-1">
                    Тип ставки
                  </p>
                  <Badge className="rounded-full bg-gray-200 text-gray-700 border-0 text-xs px-2.5 py-0.5 font-medium">
                    {event.betType}
                  </Badge>
                </div>

                {/* Selection */}
                <div>
                  <p className="text-gray-500 text-xs mb-1">
                    Вибір
                  </p>
                  <p className="font-semibold text-gray-900 text-sm break-words" title={event.selection}>
                    {event.selection}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white rounded-lg border border-gray-200">
                <Zap className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Формат</p>
                <p className="text-sm font-semibold text-gray-900">{bet.format}</p>
              </div>
            </div>
            {bet.goalId && (
              <div className="text-right">
                <p className="text-xs font-medium text-gray-500">Ціль</p>
                <Badge className="rounded-full bg-gray-200 text-gray-700 border-0 text-sm px-3 py-1 font-semibold mt-1">
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