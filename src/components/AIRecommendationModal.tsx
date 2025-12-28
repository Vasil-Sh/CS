import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, AlertTriangle, Target } from 'lucide-react';

interface AIRecommendationModalProps {
  open: boolean;
  onClose: () => void;
  matchInfo: string;
  recommendation: string;
  isLoading?: boolean;
}

export default function AIRecommendationModal({ 
  open, 
  onClose, 
  matchInfo, 
  recommendation,
  isLoading = false
}: AIRecommendationModalProps) {
  // Parse recommendation sections
  const sections = recommendation.split('\n\n');
  
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
        ) : (
          <div className="space-y-6 mt-6">
            {sections.map((section, index) => {
              const lines = section.split('\n').filter(line => line.trim());
              if (lines.length === 0) return null;

              const title = lines[0];
              const content = lines.slice(1);

              // Determine icon and color based on section
              let icon = <Target className="h-5 w-5 text-gray-700" />;
              let bgColor = 'bg-gray-50';
              let borderColor = 'border-gray-200';

              if (title.includes('Рекомендація') || title.includes('Висновок')) {
                icon = <TrendingUp className="h-5 w-5 text-green-700" />;
                bgColor = 'bg-green-50';
                borderColor = 'border-green-200';
              } else if (title.includes('Ризик') || title.includes('Увага')) {
                icon = <AlertTriangle className="h-5 w-5 text-amber-700" />;
                bgColor = 'bg-amber-50';
                borderColor = 'border-amber-200';
              }

              return (
                <div 
                  key={index}
                  className={`p-5 rounded-2xl border-2 ${borderColor} ${bgColor} shadow-md hover:shadow-lg transition-all`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-white rounded-xl border-2 border-gray-300 shadow-sm">
                      {icon}
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 flex-1">
                      {title}
                    </h3>
                  </div>
                  
                  <div className="ml-[52px] space-y-2">
                    {content.map((line, idx) => (
                      <p key={idx} className="text-gray-700 leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}

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