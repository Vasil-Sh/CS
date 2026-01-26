import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, AlertTriangle, Target, CheckCircle, XCircle, Info, Brain, Zap } from 'lucide-react';
import type { AIRecommendation } from '@/lib/geminiService';

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
          bg: 'bg-gradient-to-br from-green-50 to-emerald-50', 
          border: 'border-green-300', 
          text: 'text-green-800',
          icon: 'text-green-600',
          badge: 'bg-green-600'
        };
      case 'high':
        return { 
          bg: 'bg-gradient-to-br from-red-50 to-orange-50', 
          border: 'border-red-300', 
          text: 'text-red-800',
          icon: 'text-red-600',
          badge: 'bg-red-600'
        };
      default:
        return { 
          bg: 'bg-gradient-to-br from-yellow-50 to-amber-50', 
          border: 'border-yellow-300', 
          text: 'text-yellow-800',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-600'
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
        return <CheckCircle className="h-6 w-6" />;
      case 'high':
        return <XCircle className="h-6 w-6" />;
      default:
        return <AlertTriangle className="h-6 w-6" />;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl rounded-3xl">
        {/* Header */}
        <DialogHeader className="border-b-2 border-gray-200 pb-6">
          <DialogTitle>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg">
                <Brain className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">AI Рекомендація</h2>
                  <Badge className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 font-bold text-sm px-4 py-1.5 shadow-md">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Gemini AI
                  </Badge>
                </div>
                <p className="text-base text-gray-600 font-medium mt-1.5">{matchInfo}</p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-purple-600 mb-4"></div>
              <p className="text-gray-700 font-semibold text-base">Аналізую матч...</p>
              <p className="text-gray-500 text-sm mt-2">Зачекайте, будь ласка</p>
            </div>
          </div>
        ) : !recommendation ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="p-4 bg-gray-100 rounded-2xl inline-block mb-4">
                <AlertTriangle className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-gray-800 font-bold text-lg">Рекомендація недоступна</p>
              <p className="text-gray-500 text-sm mt-2">Спробуйте ще раз пізніше</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-3">
            {/* Main Recommendation Card - Most Prominent */}
            <div className={`p-6 rounded-2xl border-2 shadow-lg ${
              recommendation.riskLevel === 'low' 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' 
                : recommendation.riskLevel === 'high'
                ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300'
                : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 bg-white rounded-xl shadow-md ${
                  recommendation.riskLevel === 'low' ? 'text-green-600' :
                  recommendation.riskLevel === 'high' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {recommendation.riskLevel && getRiskIcon(recommendation.riskLevel)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Головна рекомендація</h3>
                    {recommendation.riskLevel && (
                      <Badge className={`${getRiskColor(recommendation.riskLevel).badge} text-white border-0 font-bold text-sm px-3 py-1 rounded-full shadow-sm`}>
                        {getRiskLabel(recommendation.riskLevel)}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-semibold text-gray-700">Прогноз:</span>
                      <span className="text-xl font-bold text-gray-900">{recommendation.prediction}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-semibold text-gray-700">Впевненість AI:</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden min-w-[120px]">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              recommendation.confidence >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              recommendation.confidence >= 60 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                              'bg-gradient-to-r from-gray-400 to-gray-600'
                            }`}
                            style={{ width: `${recommendation.confidence}%` }}
                          />
                        </div>
                        <Badge className={`font-bold text-base px-3 py-1 rounded-full border-0 ${
                          recommendation.confidence >= 80 ? 'bg-green-600 text-white' :
                          recommendation.confidence >= 60 ? 'bg-blue-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {recommendation.confidence}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Suggested Bet - Clear Call to Action */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl shadow-md">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Рекомендована ставка</h3>
                  <div className="p-4 bg-white rounded-xl border-2 border-blue-200">
                    <p className="text-base font-bold text-blue-900">
                      {recommendation.suggestedBet}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reasoning - Detailed Explanation */}
            <div className="p-6 rounded-2xl bg-white border-2 border-gray-300 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-xl shadow-sm">
                  <Info className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Обґрунтування прогнозу</h3>
                  <p className="text-base text-gray-700 leading-relaxed">
                    {recommendation.reasoning}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning - Important Notice */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm flex-shrink-0">
                  <Zap className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-2">
                    ⚠️ Важливо
                  </p>
                  <p className="text-sm text-amber-800 leading-relaxed">
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