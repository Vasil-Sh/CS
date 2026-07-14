import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brain, Loader2, Clock } from 'lucide-react';
import type { AIRecommendation } from '@/lib/ai/shared';

const HISTORY_KEY = 'ai_recommendations_history';
const MAX_HISTORY = 10;

interface HistoryEntry {
  matchInfo: string;
  prediction: string;
  confidence: number;
  timestamp: string;
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(entry: HistoryEntry) {
  const history = loadHistory();
  history.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

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
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());

  useEffect(() => {
    if (recommendation && matchInfo && !isLoading) {
      saveHistory({
        matchInfo,
        prediction: recommendation.prediction,
        confidence: recommendation.confidence,
        timestamp: new Date().toISOString(),
      });
      setHistory(loadHistory());
    }
  }, [recommendation, matchInfo, isLoading]);

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
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-gray-200 shadow-xl bg-white p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-xl">
                <Brain className="h-5 w-5 text-gray-900" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">AI Рекомендація</h2>
                <p className="text-sm text-gray-500 font-normal mt-0.5">{matchInfo}</p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                <p className="text-[15px] text-gray-900 font-medium">Аналізую матч...</p>
                <p className="text-sm text-gray-500 mt-1">Зачекайте, будь ласка</p>
              </div>
            </div>
          ) : !recommendation ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-[15px] text-gray-900 font-medium">Рекомендація недоступна</p>
                <p className="text-sm text-gray-500 mt-1">Спробуйте ще раз пізніше</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-gray-50 px-5 py-4 space-y-4">
              {/* Prediction */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Прогноз</p>
                <p className="text-[15px] leading-relaxed text-gray-900">{recommendation.prediction}</p>
              </div>

              {/* Confidence */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Впевненість AI</p>
                <p className="text-[15px] leading-relaxed text-gray-900">{recommendation.confidence}%</p>
              </div>

              {/* Risk Level */}
              {recommendation.riskLevel && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Рівень ризику</p>
                  <p className="text-[15px] leading-relaxed text-gray-900">{getRiskLabel(recommendation.riskLevel)}</p>
                </div>
              )}

              {/* Suggested Bet */}
              {recommendation.suggestedBet && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Рекомендована ставка</p>
                  <p className="text-[15px] leading-relaxed text-gray-900">{recommendation.suggestedBet}</p>
                </div>
              )}

              {/* Reasoning */}
              {recommendation.reasoning && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Обґрунтування</p>
                  <p className="text-[15px] leading-relaxed text-gray-900">{recommendation.reasoning}</p>
                </div>
              )}

              {/* Warning */}
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 leading-relaxed">
                  ⚠️ Ця рекомендація створена AI на основі аналізу доступних даних. Використовуйте її як додатковий інструмент, але завжди проводьте власний аналіз.
                </p>
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Історія</p>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {history.slice(0, 5).map((entry, i) => (
                  <div key={i} className="rounded-lg bg-gray-50 px-3 py-2 border border-gray-100">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-medium text-gray-700 truncate max-w-[240px]">{entry.matchInfo}</p>
                      <span className="text-[10px] text-gray-400">
                        {new Date(entry.timestamp).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{entry.prediction}</p>
                    <span className="text-[10px] text-blue-500 font-medium">{entry.confidence}% впевненість</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}