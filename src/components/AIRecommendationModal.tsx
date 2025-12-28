import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, AlertTriangle, Target, Sparkles } from 'lucide-react';
import type { AIRecommendation } from '@/lib/geminiService';

interface AIRecommendationModalProps {
  open: boolean;
  onClose: () => void;
  matchInfo: string;
  recommendation: AIRecommendation | null;
  loading: boolean;
}

export default function AIRecommendationModal({ 
  open, 
  onClose, 
  matchInfo, 
  recommendation,
  loading 
}: AIRecommendationModalProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-700 border-green-300';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'high': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'low': return 'Низький ризик';
      case 'medium': return 'Середній ризик';
      case 'high': return 'Високий ризик';
      default: return 'Невідомо';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-green-600';
    if (confidence >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white">
        <DialogHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b-2 border-purple-200 pb-6 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
          <DialogTitle className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold text-gray-900">AI Рекомендація</span>
                <Badge className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 font-bold text-sm px-3 py-1 shadow-md">
                  <Sparkles className="h-3 w-3 mr-1 inline" />
                  Google Gemini
                </Badge>
              </div>
              <p className="text-sm font-medium text-gray-600">{matchInfo}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
            <p className="text-gray-600 font-medium">Аналізую матч за допомогою AI...</p>
            <p className="text-sm text-gray-500 mt-2">Це може зайняти кілька секунд</p>
          </div>
        ) : recommendation ? (
          <div className="space-y-6 mt-6">
            {/* Prediction and Confidence */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border-2 border-purple-200 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-purple-600 rounded-xl">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-700">Прогноз</span>
                </div>
                <p className="text-2xl font-black text-gray-900">{recommendation.prediction}</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-blue-600 rounded-xl">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-700">Впевненість</span>
                </div>
                <p className={`text-2xl font-black ${getConfidenceColor(recommendation.confidence)}`}>
                  {recommendation.confidence}%
                </p>
              </div>
            </div>

            {/* Reasoning */}
            <div className="p-5 bg-gray-50 rounded-2xl border-2 border-gray-200 shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-5 w-5 text-gray-700" />
                <span className="text-base font-bold text-gray-900">Обґрунтування</span>
              </div>
              <p className="text-gray-700 leading-relaxed">{recommendation.reasoning}</p>
            </div>

            {/* Suggested Bet and Risk */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-green-600 rounded-xl">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-700">Рекомендована ставка</span>
                </div>
                <p className="text-xl font-black text-gray-900">{recommendation.suggestedBet}</p>
              </div>

              <div className="p-4 bg-white rounded-2xl border-2 border-gray-200 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-gray-200 rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-gray-700" />
                  </div>
                  <span className="text-sm font-bold text-gray-700">Рівень ризику</span>
                </div>
                <Badge className={`rounded-full border-2 font-bold text-base px-4 py-2 ${getRiskColor(recommendation.riskLevel)}`}>
                  {getRiskLabel(recommendation.riskLevel)}
                </Badge>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <p className="text-xs text-amber-800 font-medium">
                ⚠️ <strong>Застереження:</strong> AI рекомендації є лише інформаційними та не гарантують результат. 
                Завжди робіть власний аналіз та ставте відповідально.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Не вдалося отримати рекомендацію</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}