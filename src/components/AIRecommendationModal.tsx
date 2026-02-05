import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertTriangle, Target, CheckCircle, XCircle, Info, Brain, Zap, X } from 'lucide-react';
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
          bg: 'bg-[#F5F5F3]', 
          border: 'border-[#4CAF50]', 
          text: 'text-[#2A2A2A]',
          icon: 'text-[#4CAF50]',
          badge: 'bg-[#4CAF50]'
        };
      case 'high':
        return { 
          bg: 'bg-[#F5F5F3]', 
          border: 'border-[#F44336]', 
          text: 'text-[#2A2A2A]',
          icon: 'text-[#F44336]',
          badge: 'bg-[#F44336]'
        };
      default:
        return { 
          bg: 'bg-[#F5F5F3]', 
          border: 'border-[#F4E157]', 
          text: 'text-[#2A2A2A]',
          icon: 'text-[#F4E157]',
          badge: 'bg-[#F4E157]'
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] border-2 border-[#E8E6DC] shadow-[0_16px_48px_rgba(0,0,0,0.12)] bg-white p-0 gap-0">
        {/* Custom Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2.5 rounded-[16px] bg-[#F5F5F3] hover:bg-[#E8E6DC] transition-all duration-300 z-50 group"
        >
          <X className="h-5 w-5 text-[#6B6B6B] group-hover:text-[#4A4A4A] transition-colors" strokeWidth={1.5} />
        </button>

        {/* Header */}
        <DialogHeader className="bg-[#F5F5F3] border-b-2 border-[#E8E6DC] p-8 rounded-t-[30px]">
          <DialogTitle>
            <div className="flex items-center gap-4">
              <div className="p-4 bg-[#F4E157] rounded-[24px] shadow-[0_4px_16px_rgba(244,225,87,0.4)]">
                <Brain className="h-7 w-7 text-[#2A2A2A]" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-[32px] font-normal text-[#2A2A2A]">AI Рекомендація</h2>
                  <Badge className="rounded-[16px] bg-white border-2 border-[#E8E6DC] text-[#5A5A5A] font-medium text-[14px] px-4 py-1.5 shadow-sm">
                    <Sparkles className="h-4 w-4 mr-1.5 text-[#F4E157]" strokeWidth={1.5} />
                    Claude 3.5 Sonnet
                  </Badge>
                </div>
                <p className="text-[17px] text-[#5A5A5A] font-normal mt-2">{matchInfo}</p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 px-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#E8E6DC] border-t-[#F4E157] mb-6"></div>
              <p className="text-[#2A2A2A] font-medium text-[17px]">Аналізую матч...</p>
              <p className="text-[#5A5A5A] text-[15px] mt-2">Зачекайте, будь ласка</p>
            </div>
          </div>
        ) : !recommendation ? (
          <div className="flex items-center justify-center py-20 px-8">
            <div className="text-center">
              <div className="p-6 bg-[#F5F5F3] rounded-[24px] inline-block mb-6 border-2 border-[#E8E6DC]">
                <AlertTriangle className="h-16 w-16 text-[#7A7A7A]" strokeWidth={1.5} />
              </div>
              <p className="text-[#2A2A2A] font-medium text-[19px]">Рекомендація недоступна</p>
              <p className="text-[#5A5A5A] text-[15px] mt-2">Спробуйте ще раз пізніше</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5 p-8">
            {/* Main Recommendation Card */}
            <div className={`border-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[24px] bg-white overflow-hidden p-6 ${
              recommendation.riskLevel === 'low' 
                ? 'border-[#4CAF50]' 
                : recommendation.riskLevel === 'high'
                ? 'border-[#F44336]'
                : 'border-[#F4E157]'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-[20px] shadow-sm ${
                  recommendation.riskLevel === 'low' ? 'bg-[#E8F5E9]' :
                  recommendation.riskLevel === 'high' ? 'bg-[#FFEBEE]' : 
                  'bg-[#FFFDE7]'
                }`}>
                  <div className={
                    recommendation.riskLevel === 'low' ? 'text-[#4CAF50]' :
                    recommendation.riskLevel === 'high' ? 'text-[#F44336]' : 'text-[#F4E157]'
                  }>
                    {recommendation.riskLevel && getRiskIcon(recommendation.riskLevel)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-[19px] font-medium text-[#2A2A2A]">Головна рекомендація</h3>
                    {recommendation.riskLevel && (
                      <Badge className={`rounded-[16px] border-2 font-medium text-[14px] px-3 py-1 shadow-sm ${
                        recommendation.riskLevel === 'low' ? 'bg-[#E8F5E9] border-[#4CAF50] text-[#2A2A2A]' :
                        recommendation.riskLevel === 'high' ? 'bg-[#FFEBEE] border-[#F44336] text-[#2A2A2A]' :
                        'bg-[#FFFDE7] border-[#F4E157] text-[#2A2A2A]'
                      }`}>
                        {getRiskLabel(recommendation.riskLevel)}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-3">
                      <span className="text-[15px] font-medium text-[#5A5A5A]">Прогноз:</span>
                      <span className="text-[17px] font-medium text-[#2A2A2A]">{recommendation.prediction}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[15px] font-medium text-[#5A5A5A]">Впевненість AI:</span>
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1 h-3 bg-[#E8E6DC] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              recommendation.confidence >= 80 ? 'bg-[#4CAF50]' :
                              recommendation.confidence >= 60 ? 'bg-[#2196F3]' :
                              'bg-[#9E9E9E]'
                            }`}
                            style={{ width: `${recommendation.confidence}%` }}
                          />
                        </div>
                        <Badge className={`font-medium text-[15px] px-3 py-1.5 rounded-[16px] border-0 shadow-sm ${
                          recommendation.confidence >= 80 ? 'bg-[#4CAF50] text-white' :
                          recommendation.confidence >= 60 ? 'bg-[#2196F3] text-white' :
                          'bg-[#9E9E9E] text-white'
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
            <div className="border-2 border-[#E8E6DC] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[24px] bg-white overflow-hidden p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#E3F2FD] rounded-[20px] shadow-sm">
                  <Target className="h-6 w-6 text-[#2196F3]" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[19px] font-medium text-[#2A2A2A] mb-3">Рекомендована ставка</h3>
                  <div className="p-4 bg-[#F5F5F3] rounded-[20px] border-2 border-[#E8E6DC]">
                    <p className="text-[16px] font-medium text-[#2A2A2A]">
                      {recommendation.suggestedBet}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reasoning */}
            <div className="border-2 border-[#E8E6DC] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[24px] bg-white overflow-hidden p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#F5F5F3] rounded-[20px] shadow-sm border-2 border-[#E8E6DC]">
                  <Info className="h-6 w-6 text-[#5A5A5A]" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[19px] font-medium text-[#2A2A2A] mb-3">Обґрунтування прогнозу</h3>
                  <p className="text-[15px] text-[#5A5A5A] leading-relaxed font-normal">
                    {recommendation.reasoning}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="border-2 border-[#FFE082] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[24px] bg-[#FFFDE7] overflow-hidden p-5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-white rounded-[16px] shadow-sm border-2 border-[#FFE082]">
                  <Zap className="h-5 w-5 text-[#FFA000]" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-[#2A2A2A] uppercase tracking-wider mb-2">
                    ⚠️ Важливо
                  </p>
                  <p className="text-[14px] text-[#5A5A5A] leading-relaxed font-normal">
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