import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertTriangle, Target, CheckCircle, XCircle, Info, Brain, Zap } from 'lucide-react';
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-gray-50 to-white border-0 shadow-xl rounded-3xl">
        {/* Header */}
        <DialogHeader className="border-b border-gray-100 pb-4">
          <DialogTitle>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-slate-100 rounded-xl shadow-sm">
                <Brain className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">AI Рекомендація</h2>
                  <Badge className="rounded-xl bg-gradient-to-r from-blue-50 to-slate-100 text-blue-700 border-0 font-semibold text-xs px-3 py-1 shadow-sm">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Claude 3.5 Sonnet
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 font-normal mt-0.5">{matchInfo}</p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
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
          <div className="space-y-4 py-3">
            {/* Main Recommendation Card */}
            <div className={`border-0 shadow-lg rounded-2xl bg-white/80 backdrop-blur-xl overflow-hidden p-5 ${
              recommendation.riskLevel === 'low' 
                ? 'ring-2 ring-green-200' 
                : recommendation.riskLevel === 'high'
                ? 'ring-2 ring-red-200'
                : 'ring-2 ring-yellow-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shadow-sm ${
                  recommendation.riskLevel === 'low' ? 'bg-gradient-to-br from-green-100 to-emerald-100' :
                  recommendation.riskLevel === 'high' ? 'bg-gradient-to-br from-red-100 to-orange-100' : 
                  'bg-gradient-to-br from-yellow-100 to-amber-100'
                }`}>
                  <div className={
                    recommendation.riskLevel === 'low' ? 'text-green-600' :
                    recommendation.riskLevel === 'high' ? 'text-red-600' : 'text-yellow-600'
                  }>
                    {recommendation.riskLevel && getRiskIcon(recommendation.riskLevel)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-base font-bold text-gray-900">Головна рекомендація</h3>
                    {recommendation.riskLevel && (
                      <Badge className={`rounded-xl border-0 font-semibold text-xs px-2.5 py-1 shadow-sm ${
                        recommendation.riskLevel === 'low' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' :
                        recommendation.riskLevel === 'high' ? 'bg-gradient-to-r from-red-100 to-orange-100 text-red-700' :
                        'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700'
                      }`}>
                        {getRiskLabel(recommendation.riskLevel)}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-gray-500">Прогноз:</span>
                      <span className="text-base font-semibold text-gray-900">{recommendation.prediction}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">Впевненість AI:</span>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              recommendation.confidence >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              recommendation.confidence >= 60 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                              'bg-gradient-to-r from-gray-400 to-gray-600'
                            }`}
                            style={{ width: `${recommendation.confidence}%` }}
                          />
                        </div>
                        <Badge className={`font-semibold text-sm px-2.5 py-1 rounded-xl border-0 shadow-sm ${
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

            {/* Suggested Bet */}
            <div className="border-0 shadow-lg rounded-2xl bg-white/80 backdrop-blur-xl overflow-hidden p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-50 to-slate-100 rounded-xl shadow-sm">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-2">Рекомендована ставка</h3>
                  <div className="p-3 bg-gradient-to-r from-slate-50 to-gray-100 rounded-xl border border-slate-200">
                    <p className="text-sm font-semibold text-slate-800">
                      {recommendation.suggestedBet}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reasoning */}
            <div className="border-0 shadow-lg rounded-2xl bg-white/80 backdrop-blur-xl overflow-hidden p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-xl shadow-sm">
                  <Info className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-2">Обґрунтування прогнозу</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {recommendation.reasoning}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="border-0 shadow-lg rounded-2xl bg-white/80 backdrop-blur-xl overflow-hidden p-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg shadow-sm">
                  <Zap className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-1">
                    ⚠️ Важливо
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed">
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