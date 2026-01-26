import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, AlertTriangle, Target } from 'lucide-react';
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
        return { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' };
      case 'high':
        return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' };
      default:
        return { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' };
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
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50 border-0 shadow-2xl rounded-3xl">
        {/* Header */}
        <DialogHeader className="border-b border-gray-200 pb-5">
          <DialogTitle>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">AI Рекомендація</h2>
                <p className="text-sm text-gray-500 font-medium mt-0.5">{matchInfo}</p>
              </div>
              <Badge className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 font-semibold text-xs px-3 py-1 shadow-md">
                Gemini
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-gray-200 border-t-purple-600 mb-3"></div>
              <p className="text-gray-600 font-medium text-sm">Аналізую матч...</p>
            </div>
          </div>
        ) : !recommendation ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="p-3 bg-gray-100 rounded-2xl inline-block mb-3">
                <AlertTriangle className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-700 font-semibold">Рекомендація недоступна</p>
              <p className="text-gray-500 text-sm mt-1">Спробуйте ще раз</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Prediction */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 mb-2">Прогноз</h3>
                  <div className="space-y-1.5 text-sm">
                    <p className="text-gray-700">
                      <span className="font-semibold text-gray-900">Фаворит:</span> {recommendation.prediction}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold text-gray-900">Впевненість:</span> {recommendation.confidence}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reasoning */}
            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-xl shadow-sm">
                  <Target className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 mb-2">Обґрунтування</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {recommendation.reasoning}
                  </p>
                </div>
              </div>
            </div>

            {/* Suggested Bet */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 mb-2">Рекомендована ставка</h3>
                  <p className="text-sm text-gray-700 font-semibold">
                    {recommendation.suggestedBet}
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Level */}
            {recommendation.riskLevel && (
              <div className={`p-4 rounded-2xl ${getRiskColor(recommendation.riskLevel).bg} border ${getRiskColor(recommendation.riskLevel).border} shadow-sm`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <AlertTriangle className={`h-4 w-4 ${getRiskColor(recommendation.riskLevel).text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-gray-900 mb-2">Рівень ризику</h3>
                    <p className={`text-sm font-semibold ${getRiskColor(recommendation.riskLevel).text}`}>
                      {getRiskLabel(recommendation.riskLevel)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <AlertTriangle className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                    Важливо
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Рекомендація створена AI на основі аналізу даних. Використовуйте як додатковий інструмент, але завжди робіть власний аналіз.
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