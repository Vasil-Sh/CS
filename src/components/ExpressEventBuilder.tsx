import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trophy, Trash2, X, Info, Target } from 'lucide-react';
import { getGroupedBetTypeOptions, getBetTypeLabel } from '@/lib/displayHelpers';
import { useState } from 'react';

// ── Types ──

export interface ExpressEvent {
  match: string;
  betType: string;
  selection: string;
  odds: string;
  logoTeam1?: string | null;
  logoTeam2?: string | null;
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
  format: string;
  onUpdateEvent: (index: number, field: keyof ExpressEvent, value: string) => void;
  onRemoveEvent: (index: number) => void;
  onClearAll: () => void;
}

export function ExpressEventBuilder({
  expressEvents, totalExpressOdds, expressRisk,
  allExpressEventsComplete, game, format,
  onUpdateEvent, onRemoveEvent, onClearAll,
}: ExpressEventBuilderProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [modalTab, setModalTab] = useState(1);
  const [modalBetType, setModalBetType] = useState('');

  const grouped = getGroupedBetTypeOptions(format);
  const maxMaps = format === 'BO5' ? 5 : format === 'BO3' ? 3 : format === 'BO1' ? 1 : 3;

  const openModal = (index: number) => {
    setModalIndex(index);
    const currentType = expressEvents[index].betType;
    setModalBetType(currentType);
    const mapMatch = currentType?.match(/^Map(\d+)_/);
    setModalTab(mapMatch ? parseInt(mapMatch[1], 10) + 1 : 1);
    setModalOpen(true);
  };

  const saveModal = () => {
    onUpdateEvent(modalIndex, 'betType', modalBetType);
    setModalOpen(false);
  };

  const renderGroup = (group: {
    category: string;
    options: { value: string; label: string }[];
  }) => {
    const safeValue = group.options.some(o => o.value === modalBetType) ? modalBetType : undefined;
    const isGroupSelected = modalBetType && group.options.some(o => o.value === modalBetType);
    const selectedBorder = 'border-green-500 bg-green-50';
    const defaultBorder = 'border-gray-200/80 bg-white';

    if (group.category.includes('Фора')) {
      const seen = new Set<string>();
      const negs = group.options.filter(o => o.label.includes('-') && !seen.has(o.label) && seen.add(o.label));
      const poss = group.options.filter(o => o.label.includes('+') && !seen.has(o.label) && seen.add(o.label));
      return (
        <div className={`rounded-xl border shadow-sm p-3 ${isGroupSelected ? selectedBorder : defaultBorder}`}>
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">{group.category}</div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={safeValue} onValueChange={(v) => setModalBetType(v || '')}>
              <SelectTrigger className="w-full rounded-xl border-gray-200 h-9 text-sm !text-gray-800 [&_span]:!text-gray-800"><SelectValue placeholder="Мінус" /></SelectTrigger>
              <SelectContent className="text-gray-800">{negs.map(opt => (<SelectItem key={opt.value} value={opt.value} className="text-gray-800">{opt.label}</SelectItem>))}</SelectContent>
            </Select>
            <Select value={safeValue} onValueChange={(v) => setModalBetType(v || '')}>
              <SelectTrigger className="w-full rounded-xl border-gray-200 h-9 text-sm !text-gray-800 [&_span]:!text-gray-800"><SelectValue placeholder="Плюс" /></SelectTrigger>
              <SelectContent className="text-gray-800">{poss.map(opt => (<SelectItem key={opt.value} value={opt.value} className="text-gray-800">{opt.label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </div>
      );
    }
    if (group.category.includes('Тотал')) {
      const unders = group.options.filter(o => o.label.includes('Менше'));
      const overs = group.options.filter(o => o.label.includes('Більше'));
      return (
        <div className={`rounded-xl border shadow-sm p-3 ${isGroupSelected ? selectedBorder : defaultBorder}`}>
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">{group.category}</div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={safeValue} onValueChange={(v) => setModalBetType(v || '')}>
              <SelectTrigger className="w-full rounded-xl border-gray-200 h-9 text-sm !text-gray-800 [&_span]:!text-gray-800"><SelectValue placeholder="Менше" /></SelectTrigger>
              <SelectContent className="text-gray-800">{unders.map(opt => (<SelectItem key={opt.value} value={opt.value} className="text-gray-800">{opt.label}</SelectItem>))}</SelectContent>
            </Select>
            <Select value={safeValue} onValueChange={(v) => setModalBetType(v || '')}>
              <SelectTrigger className="w-full rounded-xl border-gray-200 h-9 text-sm !text-gray-800 [&_span]:!text-gray-800"><SelectValue placeholder="Більше" /></SelectTrigger>
              <SelectContent className="text-gray-800">{overs.map(opt => (<SelectItem key={opt.value} value={opt.value} className="text-gray-800">{opt.label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </div>
      );
    }
    if (group.options.length <= 3) {
      return (
        <div className={`rounded-xl border shadow-sm p-3 ${isGroupSelected ? selectedBorder : defaultBorder}`}>
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">{group.category}</div>
          <div className="flex flex-wrap gap-1.5">
            {group.options.map(opt => (
              <button key={opt.value} type="button"
                onClick={() => setModalBetType(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${modalBetType === opt.value ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className={`rounded-xl border shadow-sm p-3 ${isGroupSelected ? selectedBorder : defaultBorder}`}>
        <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">{group.category}</div>
        <Select value={safeValue} onValueChange={(v) => setModalBetType(v || '')}>
          <SelectTrigger className="w-full rounded-xl border-gray-200 h-9 text-sm !text-gray-800 [&_span]:!text-gray-800"><SelectValue placeholder="Оберіть..." /></SelectTrigger>
          <SelectContent className="text-gray-800">
            {group.options.map(opt => (<SelectItem key={opt.value} value={opt.value} className="text-gray-800">{opt.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
    );
  };
  if (expressEvents.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 flex-shrink-0">
            <Trophy className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
          </div>
          <span className="text-base font-semibold text-gray-900">
            Події експресу ({expressEvents.length}/10)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-gray-900 text-white border-0 rounded-full text-sm px-3 py-1 font-medium hover:bg-gray-900">
            Коеф: {totalExpressOdds.toFixed(2)}
          </Badge>
          <button type="button" onClick={onClearAll} aria-label="Очистити всі події експресу"
            className="flex items-center justify-center w-8 h-8 rounded-xl text-red-500 hover:bg-red-50 transition-colors">
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
              <div key={index} className="p-4 rounded-2xl border border-gray-200 bg-white flex flex-col gap-3"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-900 text-white border-0 rounded-full text-xs font-medium px-2 py-0.5 hover:bg-gray-900">
                        #{index + 1}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <img
                          src={event.logoTeam1 || (game === 'Dota2' ? '/assets/team-placeholder-dota.svg' : '/assets/team-placeholder.svg')}
                          alt={team1Name}
                          className="h-5 w-5 rounded-full object-contain bg-gray-100"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span className="font-medium text-gray-900 text-sm">{event.match}</span>
                        <img
                          src={event.logoTeam2 || (game === 'Dota2' ? '/assets/team-placeholder-dota.svg' : '/assets/team-placeholder.svg')}
                          alt={team2Name}
                          className="h-5 w-5 rounded-full object-contain bg-gray-100"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => onRemoveEvent(index)}
                    className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button type="button"
                    onClick={() => openModal(index)}
                    className={`rounded-xl border bg-white h-9 text-xs text-left px-3 truncate ${event.betType ? 'border-primary text-primary bg-blue-50 font-medium' : 'border-gray-200 text-gray-400'}`}>
                    {event.betType ? getBetTypeLabel(event.betType, format) : 'Тип'}
                  </button>
                  <Select value={event.selection} onValueChange={(val) => onUpdateEvent(index, 'selection', val)}>
                    <SelectTrigger className={`rounded-xl bg-white h-9 text-xs ${needsSelection ? 'border-blue-400 focus:border-blue-500' : 'border-gray-200'}`}>
                      <SelectValue placeholder="Вибір" />
                    </SelectTrigger>
                    <SelectContent>
                      {team1Name && <SelectItem value={team1Name}>{team1Name}</SelectItem>}
                      {team2Name && <SelectItem value={team2Name}>{team2Name}</SelectItem>}
                    </SelectContent>
                  </Select>
                  <Input type="number" step="0.01" min="1.01" value={event.odds}
                    onChange={(e) => onUpdateEvent(index, 'odds', e.target.value)} placeholder="Коеф."
                    className={`rounded-xl bg-white h-9 text-xs ${needsOdds ? 'border-blue-400 focus:border-blue-500' : 'border-gray-200'}`} />
                </div>

                {!needsOdds && !needsSelection && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{getBetTypeLabel(event.betType, format)}:</span>
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
          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
            <p className="text-xs text-blue-800 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
              Заповніть вибір та коефіцієнт для кожної події, щоб зберегти експрес
            </p>
          </div>
        )}
      </div>

      {/* Bet Type Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) setModalOpen(false); }}>
        <DialogContent className="rounded-3xl max-w-xl max-h-[80vh] flex flex-col border border-gray-200 p-0 gap-0" hideCloseButton>
          <DialogHeader className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 flex-shrink-0">
                  <Target className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
                </div>
                <DialogTitle className="text-lg font-semibold text-gray-900">Тип прогнозу</DialogTitle>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </DialogHeader>
          <div className="border-t border-gray-100" />
          <div className="flex gap-1 px-4 py-3 border-b border-gray-100 overflow-x-auto justify-center">
            {[{ label: 'Основне', idx: 1 },
              ...Array.from({ length: maxMaps }, (_, i) => ({ label: `Карта ${i + 1}`, idx: i + 2 })),
            ].map(tab => (
              <button key={tab.idx} type="button" onClick={() => setModalTab(tab.idx)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${modalTab === tab.idx ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100">
            {modalTab === 1 && grouped.main.map((group) => renderGroup(group))}
            {modalTab >= 2 && (grouped.maps.find(m => m.mapNumber === modalTab - 1)?.groups ?? []).map(group => renderGroup(group))}
          </div>
          <DialogFooter className="px-6 py-4 border-t border-gray-100 flex gap-3 sm:gap-3">
            <button type="button" onClick={() => setModalBetType('')}
              className={`px-4 h-11 rounded-2xl border font-medium text-sm transition-colors ${modalBetType ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}
              disabled={!modalBetType}>
              Очистити
            </button>
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 h-11 rounded-2xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors">
              Скасувати
            </button>
            <button type="button" onClick={saveModal} disabled={!modalBetType}
              className={`flex-1 h-11 rounded-2xl font-medium text-sm transition-all ${modalBetType ? 'bg-primary text-white hover:bg-blue-700 shadow-sm' : 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'}`}>
              Зберегти
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
