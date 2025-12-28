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
        return { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-700' };
      case 'high':
        return { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-700' };
      default:
        return { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-700' };
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        {/* Header */}
        <DialogHeader className="bg-gray-100 border-b-2 border-gray-300 pb-6 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
          <DialogTitle>
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-gray-900 rounded-2xl shadow-lg">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold text-gray-900">AI Рекомендація</span>
                  <Badge className="rounded-full bg-gray-900 text-white border-0 font-bold text-sm px-4 py-1.5 shadow-md">
                    Google Gemini
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Match info */}
            <div className="ml-[68px]">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600 min-w-[100px]">Матч:</span>
                <span className="text-base font-bold text-gray-900">{matchInfo}</span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-900 mb-4"></div>
              <p className="text-gray-600 font-semibold">Аналізую матч...</p>
            </div>
          </div>
        ) : !recommendation ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="p-4 bg-gray-100 rounded-2xl border-2 border-gray-200 shadow-md inline-block">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold">Рекомендація недоступна</p>
                <p className="text-gray-500 text-sm mt-2">Спробуйте отримати прогноз ще раз</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* Prediction Section */}
            <div className="p-5 rounded-2xl border-2 border-green-200 bg-green-50 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-white rounded-xl border-2 border-gray-300 shadow-sm">
                  <TrendingUp className="h-5 w-5 text-green-700" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 flex-1">
                  Прогноз
                </h3>
              </div>
              
              <div className="ml-[52px] space-y-2">
                <p className="text-gray-700 leading-relaxed">
                  <span className="font-bold">Фаворит:</span> {recommendation.prediction}
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <span className="font-bold">Впевненість AI:</span> {recommendation.confidence}%
                </p>
              </div>
            </div>

            {/* Reasoning Section */}
            <div className="p-5 rounded-2xl border-2 border-gray-200 bg-gray-50 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-white rounded-xl border-2 border-gray-300 shadow-sm">
                  <Target className="h-5 w-5 text-gray-700" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 flex-1">
                  Обґрунтування
                </h3>
              </div>
              
              <div className="ml-[52px] space-y-2">
                <p className="text-gray-700 leading-relaxed">
                  {recommendation.reasoning}
                </p>
              </div>
            </div>

            {/* Suggested Bet Section */}
            <div className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-white rounded-xl border-2 border-gray-300 shadow-sm">
                  <Target className="h-5 w-5 text-blue-700" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 flex-1">
                  Рекомендована ставка
                </h3>
              </div>
              
              <div className="ml-[52px] space-y-2">
                <p className="text-gray-700 leading-relaxed font-semibold">
                  {recommendation.suggestedBet}
                </p>
              </div>
            </div>

            {/* Risk Level Section */}
            {recommendation.riskLevel && (
              <div className={`p-5 rounded-2xl border-2 ${getRiskColor(recommendation.riskLevel).border} ${getRiskColor(recommendation.riskLevel).bg} shadow-md hover:shadow-lg transition-all`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-white rounded-xl border-2 border-gray-300 shadow-sm">
                    <AlertTriangle className={`h-5 w-5 ${getRiskColor(recommendation.riskLevel).icon}`} />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 flex-1">
                    Рівень ризику
                  </h3>
                </div>
                
                <div className="ml-[52px] space-y-2">
                  <p className="text-gray-700 leading-relaxed font-semibold">
                    {getRiskLabel(recommendation.riskLevel)}
                  </p>
                </div>
              </div>
            )}

            {/* Warning Footer */}
            <div className="p-4 bg-gray-100 rounded-2xl border-2 border-gray-200 shadow-md">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-xl border-2 border-gray-300 shadow-sm">
                  <AlertTriangle className="h-5 w-5 text-gray-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                    Важливо
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Ця рекомендація створена штучним інтелектом на основі аналізу даних. 
                    Використовуйте її як додатковий інструмент для прийняття рішень, 
                    але завжди робіть власний аналіз перед ставкою.
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