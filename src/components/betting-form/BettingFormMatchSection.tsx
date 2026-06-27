import { useState } from 'react';
import { Link, Plus, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getGroupedBetTypeOptions } from '@/lib/displayHelpers';

interface FormMatchData {
  game: 'CS2' | 'Dota2';
  format: string;
  betCategory: string;
  matchUrl: string;
  team1: string;
  team2: string;
  betType: string;
  selection: string;
  odds: string;
  logoTeam1?: string | null;
  logoTeam2?: string | null;
}

interface BettingFormMatchSectionProps {
  data: FormMatchData;
  isParsing: boolean;
  isExpressFromMatches: boolean;
  expressEventsCount: number;
  classes: {
    input: string;
    selectTrigger: string;
    label: string;
    sectionTitle: string;
  };
  onFieldChange: <K extends keyof FormMatchData>(field: K, value: FormMatchData[K]) => void;
  onParseUrl: () => void;
  onUrlChange: (url: string) => void;
  onAddToExpress: () => void;
}

export default function BettingFormMatchSection({
  data,
  isParsing,
  isExpressFromMatches,
  expressEventsCount,
  classes,
  onFieldChange,
  onParseUrl,
  onUrlChange,
  onAddToExpress,
}: BettingFormMatchSectionProps) {
  const isExpress = data.betCategory === 'Експрес';
  const showRequired = isExpress && expressEventsCount === 0;
  const [openMain, setOpenMain] = useState(true);
  const [openMap, setOpenMap] = useState<number | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const { main, maps } = getGroupedBetTypeOptions(data.format);

  return (
    <div className="space-y-4">
        <h3 className={classes.sectionTitle}>
          <Users className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
          Інформація про матч і деталі запису
        </h3>

        {/* Match URL */}
        <div className="space-y-1.5">
          <Label htmlFor="matchUrl" className={`${classes.label} flex items-center gap-2`}>
            <Link className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
            {data.game === 'CS2' ? 'HLTV URL матчу' : 'Dota 2 URL матчу'} (необов&apos;язково)
          </Label>
          <div className="flex gap-2">
            <Input
              id="matchUrl"
              value={data.matchUrl}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder={
                data.game === 'CS2'
                  ? 'https://www.hltv.org/matches/...'
                  : 'https://...dota2/.../team1-vs-team2/...'
              }
              className={`flex-1 ${classes.input}`}
            />
            <Button
              type="button"
              variant="outline"
              onClick={onParseUrl}
              disabled={isParsing || !data.matchUrl}
              className="rounded-2xl px-5 border-gray-200 hover:bg-gray-100 hover:border-gray-300 h-11 text-sm font-medium"
            >
              {isParsing ? 'Оновлення...' : 'Оновити'}
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            {data.game === 'CS2'
              ? 'Вставте посилання з HLTV для автозаповнення'
              : 'Вставте посилання на Dota 2 матч для автозаповнення'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="team1" className={classes.label}>
              Команда 1{' '}
              {showRequired && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              {data.logoTeam1 && (
                <img
                  src={data.logoTeam1}
                  alt={data.team1}
                  className="h-9 w-9 rounded-xl object-contain bg-gray-100 flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <Input
                id="team1"
                value={data.team1}
                onChange={(e) => onFieldChange('team1', e.target.value)}
                placeholder={data.game === 'CS2' ? 'NAVI' : 'Team Spirit'}
                required={!isExpress || (isExpress && expressEventsCount === 0)}
                className={classes.input}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="team2" className={classes.label}>
              Команда 2{' '}
              {showRequired && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              {data.logoTeam2 && (
                <img
                  src={data.logoTeam2}
                  alt={data.team2}
                  className="h-9 w-9 rounded-xl object-contain bg-gray-100 flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <Input
                id="team2"
                value={data.team2}
                onChange={(e) => onFieldChange('team2', e.target.value)}
                placeholder={data.game === 'CS2' ? 'G2' : 'OG'}
                required={!isExpress || (isExpress && expressEventsCount === 0)}
                className={classes.input}
              />
            </div>
          </div>
        </div>

        {/* Bet type: accordion — Основне + Карта 1/2/3 */}
        <div className="space-y-3">
          <Label className={classes.label}>
            Тип прогнозу{' '}
            {showRequired && <span className="text-red-500">*</span>}
          </Label>
          {data.betType && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#447afc] bg-[#EFF6FF] px-3 py-1 rounded-lg">{data.betType}</span>
              <button onClick={() => onFieldChange('betType', '')} className="text-xs text-[#9CA3AF] hover:text-[#EF4444]">× очистити</button>
            </div>
          )}
          <div className="border border-[#E5E7EB] rounded-2xl divide-y divide-[#F3F4F6]">
            {/* ── Основне ── */}
            <div>
              <button type="button" onClick={() => setOpenMain(!openMain)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F9FAFB] transition-colors">
                <span className="text-sm font-semibold text-[#111827]">Основне</span>
                {openMain ? <ChevronUp className="h-4 w-4 text-[#9CA3AF]" /> : <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />}
              </button>
              {openMain && (
                <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                  {main.flatMap(g => g.options).map(opt => (
                    <button key={opt.value} type="button" onClick={() => onFieldChange('betType', opt.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${data.betType === opt.value ? 'bg-[#447afc] text-white' : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]'}`}>{opt.label}</button>
                  ))}
                </div>
              )}
            </div>
            {/* ── Карта 1/2/3 ── */}
            {maps.map((mg) => (
              <div key={mg.mapNumber}>
                <button type="button" onClick={() => setOpenMap(openMap === mg.mapNumber ? null : mg.mapNumber)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F9FAFB] transition-colors">
                  <span className="text-sm font-semibold text-[#111827]">Карта {mg.mapNumber}</span>
                  {openMap === mg.mapNumber ? <ChevronUp className="h-4 w-4 text-[#9CA3AF]" /> : <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />}
                </button>
                {openMap === mg.mapNumber && (
                  <div className="px-4 pb-3 space-y-3">
                    {mg.groups.map(group => (
                      <div key={group.category}>
                        <button type="button" onClick={() => setOpenCategory(openCategory === `${mg.mapNumber}-${group.category}` ? null : `${mg.mapNumber}-${group.category}`)} className="w-full flex items-center gap-2 text-xs font-medium text-[#6B7280] uppercase tracking-wider py-1 hover:text-[#111827]">
                          {openCategory === `${mg.mapNumber}-${group.category}` ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}{group.category}
                        </button>
                        {(openCategory === `${mg.mapNumber}-${group.category}` || group.options.length <= 3) && (
                          <div className="flex flex-wrap gap-1.5">
                            {group.options.map(opt => (
                              <button key={opt.value} type="button" onClick={() => onFieldChange('betType', opt.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${data.betType === opt.value ? 'bg-[#447afc] text-white' : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]'}`}>{opt.label}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Selection & Odds in one line */}
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label className={classes.label}>Вибір{' '}{showRequired && <span className="text-red-500">*</span>}</Label>
            <div className="flex gap-2">
              <button type="button" onClick={() => onFieldChange('selection', data.team1)} disabled={!data.team1} className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${data.selection === data.team1 ? 'bg-[#447afc] text-white border-[#447afc]' : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#D1D5DB]'}`}>{data.team1 || 'Команда 1'}</button>
              <button type="button" onClick={() => onFieldChange('selection', data.team2)} disabled={!data.team2} className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${data.selection === data.team2 ? 'bg-[#447afc] text-white border-[#447afc]' : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#D1D5DB]'}`}>{data.team2 || 'Команда 2'}</button>
            </div>
          </div>
          <div className="w-32 space-y-1.5">
            <Label htmlFor="odds" className={classes.label}>Коефіцієнт{' '}{showRequired && <span className="text-red-500">*</span>}</Label>
            <Input id="odds" type="number" step="0.01" min="1.01" value={data.odds} onChange={(e) => onFieldChange('odds', e.target.value)} placeholder="1.65" required={!isExpress || (isExpress && expressEventsCount === 0)} className={classes.input} />
          </div>
        </div>

        {/* Show "Add event to express" button ONLY when NOT pre-filled from matches */}
        {isExpress && !isExpressFromMatches && (
          <Button
            type="button"
            onClick={onAddToExpress}
            disabled={expressEventsCount >= 10}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-medium py-6 text-base transition-all"
          >
            <Plus className="h-5 w-5 mr-2" strokeWidth={1.5} />
            Додати подію до експресу ({expressEventsCount}/10)
          </Button>
        )}
    </div>
  );
}
