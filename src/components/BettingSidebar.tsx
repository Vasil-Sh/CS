import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calculator, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Info, Shield, X } from 'lucide-react';
import { getStatusBadge, getGameEmoji } from '@/lib/displayHelpers';
import type { CS2Strategy } from '@/lib/realGoogleSheets';

// ── Types ──

export interface RiskyTeam {
  name: string;
  game: string;
  status: string;
  notes: string;
}

export interface EVVerdict {
  icon: string;
  text: string;
  color: string;
  description: string;
}

export interface ValueBetAnalysis {
  bookmakerProb: string;
  userProb: string;
  diff: string;
  isValueBet: boolean;
  message: string;
}

export interface KellyData {
  fullKelly: string;
  halfKelly: string;
  fullKellyAmount: number;
  halfKellyAmount: number;
  uncappedHalfKellyAmount: number;
  currentBankroll: number;
  maxAllowedAmount: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
  recommendedAmount: number;
  isNegative: boolean;
  isCapped: boolean;
  recommendedBankrollPercent: string;
}

export interface BettingSidebarProps {
  /** Form values needed for display */
  stake: string;
  odds: string;
  confidence: string;
  betCategory: string;
  currency: string;
  /** Express info */
  totalExpressOdds: number;
  expressEventsCount: number;
  /** Computed values */
  potentialProfit: string;
  potentialProfitInCurrency: string;
  expectedValue: string;
  evVerdict: EVVerdict;
  isValuePositive: boolean;
  valueBetAnalysis: ValueBetAnalysis | null;
  kellyData: KellyData | null;
  overconfidenceWarning: string | null;
  hasConfidence: boolean;
  isHighConfidence: boolean;
  /** Risky teams */
  riskyTeams: RiskyTeam[];
  /** Strategy */
  maxStakePercent: number;
  onMaxStakePercentChange: (pct: number) => void;
  onApplyKellyAmount: (amount: number) => void;
  onRemoveRiskyTeam: (index: number) => void;
}

export function BettingSidebar({
  stake, odds, confidence, betCategory, currency,
  totalExpressOdds, expressEventsCount,
  potentialProfit, potentialProfitInCurrency, expectedValue,
  evVerdict, isValuePositive, valueBetAnalysis, kellyData,
  overconfidenceWarning, hasConfidence, isHighConfidence,
  riskyTeams, maxStakePercent, onMaxStakePercentChange,
  onApplyKellyAmount, onRemoveRiskyTeam,
}: BettingSidebarProps) {
  const [showEVDetails, setShowEVDetails] = useState(false);
  const [showKellyDetails, setShowKellyDetails] = useState(false);
  const getCurrencySymbol = () => currency === 'USD' ? '$' : '₴';

  const hasFormData = stake && (odds || (betCategory === 'Експрес' && expressEventsCount > 0));

  return (
    <div className="xl:col-span-2 relative h-full flex flex-col">
      <div className="flex flex-col xl:grid xl:grid-cols-2 xl:gap-6 flex-1 min-h-0">
        {/* Calculations Card */}
        <div className="bg-white border border-[#D1D5DB] rounded-3xl overflow-hidden flex flex-col"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[#F3F4F6]">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#EFF6FF] flex-shrink-0">
              <Calculator className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
            </div>
            <span className="text-lg font-semibold text-[#111827]">Розрахунки</span>
          </div>
          <div className="p-6 space-y-4 flex-1 flex flex-col">
            {hasFormData ? (
              <>
{/* Potential profit, EV, Kelly, etc stay compact */}
                {betCategory === 'Експрес' && expressEventsCount > 0 && (
                  <div className="p-4 bg-white rounded-2xl border border-[#E5E7EB]">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#6B7280]">Загальний коефіцієнт:</span>
                      <Badge className="bg-[#111827] text-white border-0 rounded-full text-base px-4 py-1 font-semibold hover:bg-[#111827]">
                        {totalExpressOdds.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Potential profit */}
                <div className="p-4 bg-white rounded-2xl border border-[#86EFAC]">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#6B7280]">Потенційний прибуток:</span>
                    <span className="font-semibold text-[#16A34A] text-xl">+{potentialProfitInCurrency} {getCurrencySymbol()}</span>
                  </div>
                </div>

                {/* Overconfidence Warning */}
                {overconfidenceWarning && (
                  <div className="p-4 rounded-2xl border border-[#FCA5A5] bg-white">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 text-[#EF4444] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                      <div>
                        <p className="text-sm font-medium text-[#991B1B] mb-1">⚠️ Можливий Overconfidence</p>
                        <p className="text-xs text-[#6B7280] leading-relaxed">{overconfidenceWarning}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Value Bet Analysis */}
                {hasConfidence && valueBetAnalysis && (
                  <div className={`p-5 rounded-2xl border bg-white ${valueBetAnalysis.isValueBet ? 'border-[#86EFAC]' : 'border-[#FCA5A5]'}`}>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className={`h-5 w-5 ${valueBetAnalysis.isValueBet ? 'text-[#16A34A]' : 'text-[#EF4444]'}`} strokeWidth={1.5} />
                        <span className={`text-base font-semibold ${valueBetAnalysis.isValueBet ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                          {valueBetAnalysis.isValueBet ? '💎 Value Bet' : '⚠️ Не Value Bet'}
                        </span>
                      </div>
                      <p className="text-sm text-[#6B7280]">{valueBetAnalysis.message}</p>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6]">
                          <p className="text-xs text-[#9CA3AF] uppercase tracking-wider mb-1">Букмекер</p>
                          <p className="text-lg font-bold text-[#111827]">{valueBetAnalysis.bookmakerProb}%</p>
                        </div>
                        <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6]">
                          <p className="text-xs text-[#9CA3AF] uppercase tracking-wider mb-1">Ваша оцінка</p>
                          <p className="text-lg font-bold text-[#111827]">{valueBetAnalysis.userProb}%</p>
                        </div>
                      </div>
                      <div className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium ${
                        valueBetAnalysis.isValueBet ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#EF4444]'
                      }`}>
                        {valueBetAnalysis.isValueBet ? '↑' : '↓'} Різниця: {valueBetAnalysis.diff}%
                      </div>
                    </div>
                  </div>
                )}

                {/* EV Display */}
                {hasConfidence && (
                  <div className={`p-5 rounded-2xl border bg-white ${
                    evVerdict.color === 'green' ? 'border-[#86EFAC]' : evVerdict.color === 'yellow' ? 'border-[#FDE68A]' : 'border-[#FCA5A5]'
                  }`}>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-base font-semibold ${
                          evVerdict.color === 'green' ? 'text-[#16A34A]' : evVerdict.color === 'yellow' ? 'text-[#D97706]' : 'text-[#EF4444]'
                        }`}>
                          {evVerdict.icon} {evVerdict.text}
                        </span>
                        <button type="button" onClick={() => setShowEVDetails(!showEVDetails)}
                          className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[#F3F4F6] transition-colors">
                          {showEVDetails ? <ChevronUp className="h-4 w-4 text-[#6B7280]" strokeWidth={1.5} /> : <ChevronDown className="h-4 w-4 text-[#6B7280]" strokeWidth={1.5} />}
                        </button>
                      </div>
                      <p className="text-sm text-[#6B7280]">{evVerdict.description}</p>
                      {showEVDetails && (
                        <div className="mt-3 pt-3 border-t border-[#F3F4F6]">
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-[#6B7280]">Expected Value:</span>
                              <Badge className={`rounded-full border-0 text-sm px-3 py-1 font-medium ${
                                isValuePositive ? 'bg-[#16A34A] text-white hover:bg-[#16A34A]' : 'bg-[#EF4444] text-white hover:bg-[#EF4444]'
                              }`}>
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
                  <div className="p-5 rounded-2xl border border-[#93C5FD] bg-white">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-[#111827]">📊 Критерій Келлі</span>
                        <button type="button" onClick={() => setShowKellyDetails(!showKellyDetails)}
                          className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[#F3F4F6] transition-colors">
                          {showKellyDetails ? <ChevronUp className="h-4 w-4 text-[#6B7280]" strokeWidth={1.5} /> : <ChevronDown className="h-4 w-4 text-[#6B7280]" strokeWidth={1.5} />}
                        </button>
                      </div>
                      <p className="text-sm text-[#6B7280]">{kellyData.recommendation}</p>
                      {kellyData.isCapped && !kellyData.isNegative && (
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-[#F9FAFB] rounded-xl border border-[#F3F4F6]">
                          <Shield className="h-3.5 w-3.5 flex-shrink-0 text-[#6B7280]" strokeWidth={1.5} />
                          <p className="text-xs text-[#6B7280]">Ліміт {maxStakePercent}% банку захищає від надмірного ризику</p>
                        </div>
                      )}
                      {!kellyData.isNegative && kellyData.recommendedAmount > 0 && (
                        <button type="button" onClick={() => onApplyKellyAmount(kellyData.recommendedAmount)}
                          className="w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all bg-[#111827] text-white hover:bg-[#1F2937]">
                          Застосувати {kellyData.recommendedAmount} {getCurrencySymbol()} ({kellyData.recommendedBankrollPercent}% банку)
                        </button>
                      )}
                      {showKellyDetails && (
                        <div className="mt-3 pt-3 border-t border-[#F3F4F6] space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#6B7280]">Поточний банк:</span>
                            <span className="text-sm font-semibold text-gray-900">{kellyData.currentBankroll} {getCurrencySymbol()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#6B7280]">Макс. ставка ({maxStakePercent}%):</span>
                            <span className="text-sm font-semibold text-gray-900">{kellyData.maxAllowedAmount} {getCurrencySymbol()}</span>
                          </div>
                          {!kellyData.isNegative && (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-[#6B7280]">Повний Келлі ({kellyData.fullKelly}%):</span>
                                <span className="text-sm font-semibold text-gray-900">{kellyData.fullKellyAmount} {getCurrencySymbol()}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-[#6B7280]">½ Келлі ({kellyData.halfKelly}%):</span>
                                <Badge className="bg-green-600 text-white border-0 rounded-full text-sm px-3 py-1 font-medium hover:bg-green-600">{kellyData.halfKellyAmount} {getCurrencySymbol()}</Badge>
                              </div>
                            </>
                          )}
                          <div className="pt-3 border-t border-dashed border-[#E5E7EB]">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[#6B7280] uppercase tracking-wider font-medium">Max Stake %</span>
                              <div className="flex items-center gap-2">
                                {[3, 5, 7, 10].map(pct => (
                                  <button key={pct} type="button" onClick={() => onMaxStakePercentChange(pct)}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                      maxStakePercent === pct ? 'bg-[#111827] text-white' : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                                    }`}>{pct}%</button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-[#9CA3AF] leading-relaxed mt-2">
                            Критерій Келлі — математична формула для оптимального розміру ставки.
                            Ліміт Max Stake % захищає від ситуацій, коли Келлі рекомендує занадто велику частку банку.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!hasConfidence && (
                  <div className="p-4 bg-white rounded-2xl border border-[#E5E7EB]">
                    <p className="text-sm text-[#9CA3AF] flex items-center gap-2">
                      <Info className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                      Вкажіть впевненість для розрахунку Value Bet, EV та рекомендації Келлі
                    </p>
                  </div>
                )}

                {/* Max loss */}
                <div className="p-4 bg-white rounded-2xl border border-[#FCA5A5]">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#6B7280]">Макс. програш:</span>
                    <span className="font-semibold text-[#EF4444] text-xl">-{stake} {getCurrencySymbol()}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F3F4F6] mx-auto mb-3">
                  <Calculator className="h-7 w-7 text-[#9CA3AF]" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-semibold text-[#111827] mb-1">Заповніть форму для розрахунків</p>
                <p className="text-xs text-[#9CA3AF]">Введіть суму та коефіцієнт</p>
              </div>
            )}
          </div>
        </div>

        {/* Risky Teams Card */}
        <div className="bg-white border border-[#D1D5DB] rounded-3xl flex flex-col"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[#F3F4F6]">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#EFF6FF] flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
            </div>
            <span className="text-lg font-semibold text-[#111827]">Ризиковані команди</span>
          </div>
          <div className="p-6 flex flex-col flex-1">
            {riskyTeams.length > 0 ? (
              <div className="space-y-3">
                {riskyTeams.map((riskyTeam, index) => (
                  <div key={index} className="p-4 border border-[#3B82F6] rounded-2xl bg-white space-y-2.5 hover:border-[#3B82F6] transition-colors">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base font-semibold text-[#111827]">
                            {getGameEmoji(riskyTeam.game)} {riskyTeam.name}
                          </span>
                        </div>
                        <Badge className={getStatusBadge(riskyTeam.status)}>{riskyTeam.status}</Badge>
                      </div>
                      <button type="button" onClick={() => onRemoveRiskyTeam(index)}
                        className="flex items-center justify-center w-8 h-8 rounded-xl hover:bg-[#FEE2E2] text-[#9CA3AF] hover:text-[#EF4444] transition-colors flex-shrink-0">
                        <X className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                    {riskyTeam.notes && (
                      <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap bg-white/60 p-3 rounded-xl">{riskyTeam.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F3F4F6] mx-auto mb-3">
                  <AlertTriangle className="h-7 w-7 text-[#9CA3AF]" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-semibold text-[#111827] mb-1">Ризикових команд не знайдено</p>
                <p className="text-xs text-[#9CA3AF]">Почніть заповнювати форму або додайте команди у розділі Управління ризиками</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
