import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Target, CheckCircle, XCircle, Info, Brain, Zap } from 'lucide-react';
import type { AIRecommendation } from '@/lib/openRouterService';

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
  // Helper function to get risk badge color
  const getRiskColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low':
        return { 
          bg: 'bg-[#F0FDF4]', 
          border: 'border-[#BBF7D0]', 
          text: 'text-[#16A34A]',
          icon: 'text-[#16A34A]',
          badge: 'bg-[#16A34A]'
        };
      case 'high':
        return { 
          bg: 'bg-[#FEF2F2]', 
          border: 'border-[#FECACA]', 
          text: 'text-[#DC2626]',
          icon: 'text-[#DC2626]',
          badge: 'bg-[#DC2626]'
        };
      default:
        return { 
          bg: 'bg-[#FFFBEB]', 
          border: 'border-[#FDE68A]', 
          text: 'text-[#D97706]',
          icon: 'text-[#D97706]',
          badge: 'bg-[#D97706]'
        };
    }
  };

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

  const getRiskIcon = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low':
        return <CheckCircle className="h-6 w-6" strokeWidth={1.5} />;
      case 'high':
        return <XCircle className="h-6 w-6" strokeWidth={1.5} />;
      default:
        return <AlertTriangle className="h-6 w-6" strokeWidth={1.5} />;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#E5E7EB] shadow-[0_20px_60px_rgba(0,0,0,0.15)] bg-white p-0 gap-0">
        {/* Header */}
        <DialogHeader className="bg-[#F9FAFB] border-b border-[#E5E7EB] p-6 rounded-t-2xl">
          <DialogTitle>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#111827] rounded-xl">
                <Brain className="h-5 w-5 text-white" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-[#111827]">AI Рекомендація</h2>
                  <Badge className="rounded-lg bg-white border border-[#E5E7EB] text-[#6B7280] font-medium text-xs px-3 py-1">
                    <span className="mr-1.5">✨</span>
                    Claude 3.5 Sonnet
                  </Badge>
                </div>
                <p className="text-sm text-[#6B7280] mt-1.5">{matchInfo}</p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 px-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#E5E7EB] border-t-[#111827] mb-6"></div>
              <p className="text-[#111827] font-medium text-sm">Аналізую матч...</p>
              <p className="text-[#6B7280] text-xs mt-1.5">Зачекайте, будь ласка</p>
            </div>
          </div>
        ) : !recommendation ? (
          <div className="flex items-center justify-center py-20 px-8">
            <div className="text-center">
              <div className="p-5 bg-[#F9FAFB] rounded-xl inline-block mb-4 border border-[#E5E7EB]">
                <AlertTriangle className="h-12 w-12 text-[#9CA3AF]" strokeWidth={1.5} />
              </div>
              <p className="text-[#111827] font-medium">Рекомендація недоступна</p>
              <p className="text-[#6B7280] text-sm mt-1.5">Спробуйте ще раз пізніше</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-6">
            {/* Main Recommendation Card */}
            <div className={`border rounded-xl bg-white overflow-hidden p-5 ${
              recommendation.riskLevel === 'low' 
                ? 'border-[#BBF7D0]' 
                : recommendation.riskLevel === 'high'
                ? 'border-[#FECACA]'
                : 'border-[#FDE68A]'
            }`}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl ${
                  recommendation.riskLevel === 'low' ? 'bg-[#F0FDF4]' :
                  recommendation.riskLevel === 'high' ? 'bg-[#FEF2F2]' : 
                  'bg-[#FFFBEB]'
                }`}>
                  <div className={
                    recommendation.riskLevel === 'low' ? 'text-[#16A34A]' :
                    recommendation.riskLevel === 'high' ? 'text-[#DC2626]' : 'text-[#D97706]'
                  }>
                    {recommendation.riskLevel && getRiskIcon(recommendation.riskLevel)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-base font-semibold text-[#111827]">Головна рекомендація</h3>
                    {recommendation.riskLevel && (
                      <Badge className={`rounded-lg border font-medium text-xs px-2.5 py-1 ${
                        recommendation.riskLevel === 'low' ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]' :
                        recommendation.riskLevel === 'high' ? 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]' :
                        'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]'
                      }`}>
                        {getRiskLabel(recommendation.riskLevel)}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">Прогноз:</span>
                      <span className="text-sm font-medium text-[#111827]">{recommendation.prediction}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">Впевненість AI:</span>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex-1 h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              recommendation.confidence >= 80 ? 'bg-[#22C55E]' :
                              recommendation.confidence >= 60 ? 'bg-[#3B82F6]' :
                              'bg-[#9CA3AF]'
                            }`}
                            style={{ width: `${recommendation.confidence}%` }}
                          />
                        </div>
                        <Badge className={`font-medium text-xs px-2.5 py-1 rounded-lg border-0 ${
                          recommendation.confidence >= 80 ? 'bg-[#22C55E] text-white' :
                          recommendation.confidence >= 60 ? 'bg-[#3B82F6] text-white' :
                          'bg-[#9CA3AF] text-white'
                        }`}>
                          {recommendation.confidence}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Suggested Bet */}
            <div className="border border-[#E5E7EB] rounded-xl bg-white overflow-hidden p-5"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-[#EFF6FF] rounded-xl">
                  <Target className="h-5 w-5 text-[#3B82F6]" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-[#111827] mb-2">Рекомендована ставка</h3>
                  <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                    <p className="text-sm font-medium text-[#111827]">
                      {recommendation.suggestedBet}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reasoning */}
            <div className="border border-[#E5E7EB] rounded-xl bg-white overflow-hidden p-5"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                  <Info className="h-5 w-5 text-[#6B7280]" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-[#111827] mb-2">Обґрунтування прогнозу</h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">
                    {recommendation.reasoning}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="border border-[#FDE68A] rounded-xl bg-[#FFFBEB] overflow-hidden p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-[#FDE68A]">
                  <Zap className="h-4 w-4 text-[#D97706]" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-[#92400E] uppercase tracking-wider mb-1.5">
                    ⚠️ Важливо
                  </p>
                  <p className="text-xs text-[#92400E] leading-relaxed">
                    Ця рекомендація створена штучним інтелектом на основі аналізу доступних даних. Використовуйте її як додатковий інструмент для прийняття рішень, але завжди проводьте власний аналіз та враховуйте актуальні новини про команди.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}