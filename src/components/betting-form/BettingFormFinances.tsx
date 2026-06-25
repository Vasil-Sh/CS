import { AlertTriangle, DollarSign, Info, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ExpressEvent } from './types';

const MAX_CONFIDENCE = 95;

interface FormFinancialData {
  stake: string;
  currency: string;
  confidence: string;
}

interface BettingFormFinancesProps {
  data: FormFinancialData;
  isSubmitting: boolean;
  isBlocked: boolean;
  isHighConfidence: boolean;
  showSection: boolean;
  classes: {
    input: string;
    label: string;
    sectionTitle: string;
  };
  onFieldChange: <K extends keyof FormFinancialData>(field: K, value: FormFinancialData[K]) => void;
  onConfidenceChange: (value: string) => void;
}

export default function BettingFormFinances({
  data,
  isSubmitting,
  isBlocked,
  isHighConfidence,
  showSection,
  classes,
  onFieldChange,
  onConfidenceChange,
}: BettingFormFinancesProps) {
  if (!showSection) return null;

  return (
    <>
      <div className="border-t border-gray-100" />

      <div className="space-y-4">
        <h3 className={classes.sectionTitle}>
          <DollarSign className="h-4.5 w-4.5 text-gray-500" strokeWidth={1.5} />
          Фінансові деталі
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="stake" className={classes.label}>
              Сума прогнозу ({data.currency === 'USD' ? '$' : '₴'}){' '}
              <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <div className="inline-flex items-center rounded-2xl border border-gray-200 bg-gray-50 p-1 h-11 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onFieldChange('currency', 'UAH')}
                  className={`flex items-center justify-center w-9 h-full rounded-xl text-sm font-semibold transition-all ${
                    data.currency === 'UAH'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-500'
                  }`}
                  aria-label="Гривня"
                  title="Гривня (UAH)"
                >
                  ₴
                </button>
                <button
                  type="button"
                  onClick={() => onFieldChange('currency', 'USD')}
                  className={`flex items-center justify-center w-9 h-full rounded-xl text-sm font-semibold transition-all ${
                    data.currency === 'USD'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-500'
                  }`}
                  aria-label="Долар"
                  title="Долар США (USD)"
                >
                  $
                </button>
              </div>
              <Input
                id="stake"
                type="number"
                min="1"
                step="0.01"
                value={data.stake}
                onChange={(e) => onFieldChange('stake', e.target.value)}
                placeholder="100"
                required
                className={`flex-1 ${classes.input}`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="confidence"
              className={`${classes.label} flex items-center gap-1.5`}
            >
              Впевненість (%, макс. {MAX_CONFIDENCE})
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 cursor-help">
                      <Info className="h-3 w-3 text-gray-500" strokeWidth={2} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px] text-sm">
                    <p className="font-medium mb-1">Ваша оцінка ймовірності виграшу</p>
                    <p className="text-xs text-muted-foreground">
                      Вкажіть від 1 до {MAX_CONFIDENCE}%. У спорті 100% впевненість нереалістична
                      через непередбачувані фактори (травми, помилки суддів, форс-мажори). Максимум
                      обмежено до {MAX_CONFIDENCE}% для реалістичних розрахунків.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="confidence"
              type="number"
              min="1"
              max={MAX_CONFIDENCE}
              value={data.confidence}
              onChange={(e) => onConfidenceChange(e.target.value)}
              placeholder="70"
              className={`${classes.input} ${isHighConfidence ? 'border-amber-500 focus:border-amber-500' : ''}`}
            />
            {isHighConfidence && (
              <p className="text-xs text-amber-600 flex items-center gap-1.5 mt-1">
                <AlertTriangle className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
                Впевненість &gt;90% — будьте обережні. У спорті завжди є непередбачувані фактори.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
