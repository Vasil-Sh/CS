import { AlertTriangle, Info, Shield } from 'lucide-react';
import type { CS2Strategy } from '@/lib/realGoogleSheets';
import type { StrategyViolation } from './types';

interface TiltBlock {
  blocked: boolean;
  reason: string;
  minutesLeft: number;
}

interface BettingFormAlertsProps {
  tiltBlock: TiltBlock;
  primaryStrategy: CS2Strategy | null;
  strategyViolations: StrategyViolation[];
}

export default function BettingFormAlerts({
  tiltBlock,
  primaryStrategy,
  strategyViolations,
}: BettingFormAlertsProps) {
  return (
    <>
      {/* Tilt Protection Block */}
      {tiltBlock.blocked && (
        <div
          className="rounded-3xl overflow-hidden border-2 border-red-300"
          style={{ boxShadow: '0 4px 24px rgba(239,68,68,0.15)' }}
        >
          <div
            className="flex items-start gap-4 px-6 py-5"
            style={{ background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' }}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-100 flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-red-800 mb-1">
                🔒 Тілт-захист активовано
              </p>
              <p className="text-sm text-red-700 leading-relaxed">{tiltBlock.reason}</p>
              <p className="text-xs text-red-600 mt-2 font-medium">
                Залишилось: {tiltBlock.minutesLeft} хв. Форма ставки заблокована до завершення паузи.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Banner */}
      {primaryStrategy && (
        <div
          className="rounded-3xl overflow-hidden border border-blue-200"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
        >
          <div
            className="flex items-center gap-4 px-6 py-5"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)' }}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Shield className="h-5 w-5 text-white" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80">
                Активна стратегія:{' '}
                <span className="font-semibold text-white">{primaryStrategy.name}</span>
              </p>
              <p className="text-sm text-white/60 mt-0.5 truncate">
                {primaryStrategy.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Violations */}
      {strategyViolations.length > 0 && (
        <div
          className={`rounded-3xl px-6 py-5 border ${
            strategyViolations.some(v => v.severity === 'serious')
              ? 'border-red-300 bg-[#F3F4F6]'
              : 'border-yellow-200 bg-[#F3F4F6]'
          }`}
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                strategyViolations.some(v => v.severity === 'serious')
                  ? 'text-red-500'
                  : 'text-amber-500'
              }`}
              strokeWidth={1.5}
            />
            <div className="flex-1">
              <p
                className={`text-sm font-semibold mb-2 ${
                  strategyViolations.some(v => v.severity === 'serious')
                    ? 'text-red-800'
                    : 'text-amber-800'
                }`}
              >
                Відхилення від стратегії &ldquo;{primaryStrategy?.name}&rdquo;
              </p>
              <div className="space-y-2">
                {strategyViolations.map((violation, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-2xl ${
                      violation.severity === 'serious' ? 'bg-red-100' : 'bg-amber-100'
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        violation.severity === 'serious' ? 'text-red-800' : 'text-amber-800'
                      }`}
                    >
                      • {violation.message}
                    </p>
                    <p
                      className={`text-xs mt-1 flex items-center gap-1 ${
                        violation.severity === 'serious' ? 'text-red-700' : 'text-amber-700'
                      }`}
                    >
                      <Info className="h-3 w-3 flex-shrink-0" strokeWidth={1.5} />
                      {violation.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
