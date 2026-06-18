import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brain, Loader2 } from 'lucide-react';
import type { AIRecommendation } from '@/lib/ai/shared';

interface AIRecommendationModalProps {
  open: boolean;
  onClose: () => void;
  matchInfo: string;
  recommendation: AIRecommendation | null;
  isLoading?: boolean;
}

export default function AIRecommendationModal({ 
  open, 
  onClose, 
  matchInfo, 
  recommendation,
  isLoading = false
}: AIRecommendationModalProps) {
  const getRiskLabel = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low':
        return 'Низький ризик';
      case 'high':
        return 'Високий ризик';
      default:
        return 'Помірний ризик';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-[#E5E7EB] shadow-xl bg-white p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#F3F4F6] rounded-xl">
                <Brain className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">AI Рекомендація</h2>
                <p className="text-sm text-[#6B7280] font-normal mt-0.5">{matchInfo}</p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#9CA3AF] mx-auto mb-4" />
                <p className="text-[15px] text-[#111827] font-medium">Аналізую матч...</p>
                <p className="text-sm text-[#6B7280] mt-1">Зачекайте, будь ласка</p>
              </div>
            </div>
          ) : !recommendation ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-[15px] text-[#111827] font-medium">Рекомендація недоступна</p>
                <p className="text-sm text-[#6B7280] mt-1">Спробуйте ще раз пізніше</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-[#F9FAFB] px-5 py-4 space-y-4">
              {/* Prediction */}
              <div>
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1">Прогноз</p>
                <p className="text-[15px] leading-relaxed text-[#111827]">{recommendation.prediction}</p>
              </div>

              {/* Confidence */}
              <div>
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1">Впевненість AI</p>
                <p className="text-[15px] leading-relaxed text-[#111827]">{recommendation.confidence}%</p>
              </div>

              {/* Risk Level */}
              {recommendation.riskLevel && (
                <div>
                  <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1">Рівень ризику</p>
                  <p className="text-[15px] leading-relaxed text-[#111827]">{getRiskLabel(recommendation.riskLevel)}</p>
                </div>
              )}

              {/* Suggested Bet */}
              {recommendation.suggestedBet && (
                <div>
                  <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1">Рекомендована ставка</p>
                  <p className="text-[15px] leading-relaxed text-[#111827]">{recommendation.suggestedBet}</p>
                </div>
              )}

              {/* Reasoning */}
              {recommendation.reasoning && (
                <div>
                  <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1">Обґрунтування</p>
                  <p className="text-[15px] leading-relaxed text-[#111827]">{recommendation.reasoning}</p>
                </div>
              )}

              {/* Warning */}
              <div className="pt-2 border-t border-[#E5E7EB]">
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  ⚠️ Ця рекомендація створена AI на основі аналізу доступних даних. Використовуйте її як додатковий інструмент, але завжди проводьте власний аналіз.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}