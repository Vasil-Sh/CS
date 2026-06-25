import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Calculator, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Info, Shield,
} from 'lucide-react';
import type { EVVerdict, ValueBetAnalysis, KellyData } from './sidebar-types';

interface SidebarCalculationsProps {
  stake: string;
  betCategory: string;
  currency: string;
  totalExpressOdds: number;
  expressEventsCount: number;
  potentialProfitInCurrency: string;
  expectedValue: string;
  evVerdict: EVVerdict;
  isValuePositive: boolean;
  valueBetAnalysis: ValueBetAnalysis | null;
  kellyData: KellyData | null;
  overconfidenceWarning: string | null;
  hasConfidence: boolean;
  maxStakePercent: number;
  onMaxStakePercentChange: (pct: number) => void;
  onApplyKellyAmount: (amount: number) => void;
}

export default function SidebarCalculations({
  stake, betCategory, currency, totalExpressOdds, expressEventsCount,
  potentialProfitInCurrency, expectedValue, evVerdict, isValuePositive,
  valueBetAnalysis, kellyData, overconfidenceWarning, hasConfidence,
  maxStakePercent, onMaxStakePercentChange, onApplyKellyAmount,
}: SidebarCalculationsProps) {
  const [showEVDetails, setShowEVDetails] = useState(false);
  const [showKellyDetails, setShowKellyDetails] = useState(false);
  const getCurrencySymbol = () => currency === 'USD' ? '$' : '₴';
  const hasFormData = stake && (betCategory === 'Експрес' ? expressEventsCount > 0 : true);

  return (
    <div
      className="bg-white border border-gray-300 rounded-3xl overflow-hidden flex flex-col"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 flex-shrink-0">
          <Calculator className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
        </div>
        <span className="text-lg font-semibold text-gray-900">Розрахунки</span>
      </div>

      <div className="p-6 space-y-4 flex-1 flex flex-col">
        {hasFormData ? (
          <>
            {/* Express Total Odds */}
            {betCategory === 'Експрес' && expressEventsCount > 0 && (
              <div className="p-4 bg-white rounded-2xl border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Загальний коефіцієнт:</span>
                  <Badge className="bg-gray-900 text-white border-0 rounded-full text-base px-4 py-1 font-semibold hover:bg-gray-900">
                    {totalExpressOdds.toFixed(2)}
                  </Badge>
                </div>
              </div>
            )}

            {/* Potential Profit */}
            <div className="p-4 bg-white rounded-2xl border border-green-300">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Потенційний прибуток:</span>
                <span className="font-semibold text-green-600 text-xl">
                  +{potentialProfitInCurrency} {getCurrencySymbol()}
                </span>
              </div>
            </div>

            {/* Overconfidence Warning */}
            {overconfidenceWarning && (
              <div className="p-4 rounded-2xl border border-red-300 bg-white">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-1">⚠️ Можливий Overconfidence</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{overconfidenceWarning}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Value Bet Analysis */}
            {hasConfidence && valueBetAnalysis && (
              <div
                className={`p-5 rounded-2xl border bg-white ${
                  valueBetAnalysis.isValueBet ? 'border-green-300' : 'border-red-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp
                      className={`h-5 w-5 ${valueBetAnalysis.isValueBet ? 'text-green-600' : 'text-red-500'}`}
                      strokeWidth={1.5}
                    />
                    <span
                      className={`text-base font-semibold ${valueBetAnalysis.isValueBet ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {valueBetAnalysis.isValueBet ? '💎 Value Bet' : '⚠️ Не Value Bet'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{valueBetAnalysis.message}</p>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Букмекер</p>
                      <p className="text-lg font-bold text-gray-900">{valueBetAnalysis.bookmakerProb}%</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Ваша оцінка</p>
                      <p className="text-lg font-bold text-gray-900">{valueBetAnalysis.userProb}%</p>
                    </div>
                  </div>
                  <div
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium ${
                      valueBetAnalysis.isValueBet
                        ? 'bg-green-50 text-green-600'
                        : 'bg-red-50 text-red-500'
                    }`}
                  >
                    {valueBetAnalysis.isValueBet ? '↑' : '↓'} Різниця: {valueBetAnalysis.diff}%
                  </div>
                </div>
              </div>
            )}

            {/* EV Display */}
            {hasConfidence && (
              <div
                className={`p-5 rounded-2xl border bg-white ${
                  evVerdict.color === 'green'
                    ? 'border-green-300'
                    : evVerdict.color === 'yellow'
                    ? 'border-amber-200'
                    : 'border-red-300'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-base font-semibold ${
                        evVerdict.color === 'green'
                          ? 'text-green-600'
                          : evVerdict.color === 'yellow'
                          ? 'text-amber-600'
                          : 'text-red-500'
                      }`}
                    >
                      {evVerdict.icon} {evVerdict.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowEVDetails(!showEVDetails)}
                      className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {showEVDetails ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">{evVerdict.description}</p>
                  {showEVDetails && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Expected Value:</span>
                          <Badge
                            className={`rounded-full border-0 text-sm px-3 py-1 font-medium ${
                              isValuePositive
                                ? 'bg-green-600 text-white hover:bg-green-600'
                                : 'bg-red-500 text-white hover:bg-red-500'
                            }`}
                          >
                            {isValuePositive ? '+' : ''}{expectedValue}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Kelly Criterion */}
            {hasConfidence && kellyData && (
              <div className="p-5 rounded-2xl border border-blue-300 bg-white">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-900">📊 Критерій Келлі</span>
                    <button
                      type="button"
                      onClick={() => setShowKellyDetails(!showKellyDetails)}
                      className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {showKellyDetails ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">{kellyData.recommendation}</p>
                  {kellyData.isCapped && !kellyData.isNegative && (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                      <Shield className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" strokeWidth={1.5} />
                      <p className="text-xs text-gray-500">
                        Ліміт {maxStakePercent}% банку захищає від надмірного ризику
                      </p>
                    </div>
                  )}
                  {!kellyData.isNegative && kellyData.recommendedAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => onApplyKellyAmount(kellyData.recommendedAmount)}
                      className="w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all bg-gray-900 text-white hover:bg-gray-800"
                    >
                      Застосувати {kellyData.recommendedAmount} {getCurrencySymbol()} (
                      {kellyData.recommendedBankrollPercent}% банку)
                    </button>
                  )}
                  {showKellyDetails && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Поточний банк:</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {kellyData.currentBankroll} {getCurrencySymbol()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Макс. ставка ({maxStakePercent}%):
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {kellyData.maxAllowedAmount} {getCurrencySymbol()}
                        </span>
                      </div>
                      {!kellyData.isNegative && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                              Повний Келлі ({kellyData.fullKelly}%):
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {kellyData.fullKellyAmount} {getCurrencySymbol()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                              ½ Келлі ({kellyData.halfKelly}%):
                            </span>
                            <Badge className="bg-green-600 text-white border-0 rounded-full text-sm px-3 py-1 font-medium hover:bg-green-600">
                              {kellyData.halfKellyAmount} {getCurrencySymbol()}
                            </Badge>
                          </div>
                        </>
                      )}
                      {/* Max Stake % selector */}
                      <div className="pt-3 border-t border-dashed border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                            Max Stake %
                          </span>
                          <div className="flex items-center gap-2">
                            {[3, 5, 7, 10].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => onMaxStakePercentChange(pct)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                  maxStakePercent === pct
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                {pct}%
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed mt-2">
                        Критерій Келлі — математична формула для оптимального розміру ставки. Ліміт
                        Max Stake % захищає від ситуацій, коли Келлі рекомендує занадто велику частку
                        банку.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No confidence placeholder */}
            {!hasConfidence && (
              <div className="p-4 bg-white rounded-2xl border border-gray-200">
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Info className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                  Вкажіть впевненість для розрахунку Value Bet, EV та рекомендації Келлі
                </p>
              </div>
            )}

            {/* Max loss */}
            <div className="p-4 bg-white rounded-2xl border border-red-300">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Макс. програш:</span>
                <span className="font-semibold text-red-500 text-xl">
                  -{stake} {getCurrencySymbol()}
                </span>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 mx-auto mb-3">
              <Calculator className="h-7 w-7 text-gray-400" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Заповніть форму для розрахунків</p>
            <p className="text-xs text-gray-400">Введіть суму та коефіцієнт</p>
          </div>
        )}
      </div>
    </div>
  );
}
