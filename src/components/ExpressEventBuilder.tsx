import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trophy, Trash2, X, Info } from 'lucide-react';
import { getBetTypeOptions } from '@/lib/displayHelpers';

// ── Types ──

export interface ExpressEvent {
  match: string;
  betType: string;
  selection: string;
  odds: string;
}

export interface ExpressRiskInfo {
  color: string;
  text: string;
  progress: number;
}

export interface ExpressEventBuilderProps {
  expressEvents: ExpressEvent[];
  totalExpressOdds: number;
  expressRisk: ExpressRiskInfo;
  allExpressEventsComplete: boolean;
  game: 'CS2' | 'Dota2';
  onUpdateEvent: (index: number, field: keyof ExpressEvent, value: string) => void;
  onRemoveEvent: (index: number) => void;
  onClearAll: () => void;
}

export function ExpressEventBuilder({
  expressEvents, totalExpressOdds, expressRisk,
  allExpressEventsComplete, game,
  onUpdateEvent, onRemoveEvent, onClearAll,
}: ExpressEventBuilderProps) {
  if (expressEvents.length === 0) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 text-gray-900" strokeWidth={1.5} />
          <span className="text-base font-semibold text-gray-900">
            Події експресу ({expressEvents.length}/10)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-gray-900 text-white border-0 rounded-full text-sm px-3 py-1 font-medium hover:bg-gray-900">
            Коеф: {totalExpressOdds.toFixed(2)}
          </Badge>
          <button type="button" onClick={onClearAll} aria-label="Очистити всі події експресу"
            className="flex items-center justify-center w-8 h-8 rounded-xl hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div className="p-6 space-y-3">
        {/* Express Risk */}
        <div className={`p-4 rounded-2xl border ${
          expressRisk.color === 'green' ? 'bg-green-50 border-green-200' :
          expressRisk.color === 'orange' ? 'bg-amber-50 border-amber-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${
              expressRisk.color === 'green' ? 'text-green-800' :
              expressRisk.color === 'orange' ? 'text-amber-800' : 'text-red-800'
            }`}>
              {expressRisk.color === 'green' ? '🟢' : expressRisk.color === 'orange' ? '🟠' : '🔴'} {expressRisk.text}
            </span>
            <span className={`text-xs ${
              expressRisk.color === 'green' ? 'text-green-700' :
              expressRisk.color === 'orange' ? 'text-amber-700' : 'text-red-700'
            }`}>
              {expressEvents.length} {expressEvents.length === 1 ? 'подія' : expressEvents.length < 5 ? 'події' : 'подій'}
            </span>
          </div>
          <Progress value={expressRisk.progress}
            className={`h-1.5 rounded-full ${
              expressRisk.color === 'green' ? '[&>div]:bg-green-500' :
              expressRisk.color === 'orange' ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
            }`} />
          <p className={`text-xs mt-2 ${
            expressRisk.color === 'green' ? 'text-green-700' :
            expressRisk.color === 'orange' ? 'text-amber-700' : 'text-red-700'
          }`}>
            {expressRisk.color === 'green' && 'Оптимальна кількість подій для контролю ризику'}
            {expressRisk.color === 'orange' && 'Збільшений ризик через кількість подій. Рекомендуємо обережність.'}
            {expressRisk.color === 'red' && 'Дуже високий ризик! Кожна додаткова подія знижує ймовірність виграшу.'}
          </p>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {expressEvents.map((event, index) => {
            const teams = event.match.split(' vs ');
            const team1Name = teams[0] || '';
            const team2Name = teams[1] || '';
            const needsOdds = !event.odds || parseFloat(event.odds) <= 0;
            const needsSelection = !event.selection;

            return (
              <div key={index} className={`p-4 rounded-2xl border flex flex-col gap-3 transition-colors ${
                needsOdds || needsSelection
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-gray-50 border-gray-100 hover:border-gray-200'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-900 text-white border-0 rounded-full text-xs font-medium px-2 py-0.5 hover:bg-gray-900">
                        #{index + 1}
                      </Badge>
                      <span className="font-medium text-gray-900 text-sm">{event.match}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => onRemoveEvent(index)}
                    className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Select value={event.betType} onValueChange={(val) => onUpdateEvent(index, 'betType', val)}>
                    <SelectTrigger className="rounded-xl border-gray-200 bg-white h-9 text-xs">
                      <SelectValue placeholder="Тип" />
                    </SelectTrigger>
                    <SelectContent>
                      {getBetTypeOptions(game).map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={event.selection} onValueChange={(val) => onUpdateEvent(index, 'selection', val)}>
                    <SelectTrigger className={`rounded-xl bg-white h-9 text-xs ${needsSelection ? 'border-amber-500' : 'border-gray-200'}`}>
                      <SelectValue placeholder="Вибір" />
                    </SelectTrigger>
                    <SelectContent>
                      {team1Name && <SelectItem value={team1Name}>{team1Name}</SelectItem>}
                      {team2Name && <SelectItem value={team2Name}>{team2Name}</SelectItem>}
                    </SelectContent>
                  </Select>
                  <Input type="number" step="0.01" min="1.01" value={event.odds}
                    onChange={(e) => onUpdateEvent(index, 'odds', e.target.value)} placeholder="Коеф."
                    className={`rounded-xl bg-white h-9 text-xs ${needsOdds ? 'border-amber-500' : 'border-gray-200'}`} />
                </div>

                {!needsOdds && !needsSelection && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{event.betType}:</span>
                    <span className="font-medium text-gray-900">{event.selection}</span>
                    <Badge className="bg-green-50 text-green-600 border-0 rounded-full text-xs font-medium hover:bg-green-50 ml-auto">
                      Коеф {event.odds}
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!allExpressEventsComplete && (
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
            <p className="text-xs text-amber-800 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
              Заповніть вибір та коефіцієнт для кожної події, щоб зберегти експрес
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
