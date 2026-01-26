import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { getRecommendationColor, getRecommendationText } from '@/lib/analytics';

interface BettingRecommendationProps {
  recommendation: 'safe' | 'risky' | 'avoid';
  confidence: number;
  expectedValue?: number;
  reasoning?: string[];
}

export default function BettingRecommendation({ 
  recommendation, 
  confidence, 
  expectedValue,
  reasoning = []
}: BettingRecommendationProps) {
  const getIcon = () => {
    switch (recommendation) {
      case 'safe': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'risky': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'avoid': return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getAlertVariant = () => {
    switch (recommendation) {
      case 'safe': return 'default';
      case 'risky': return 'default';
      case 'avoid': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getIcon()}
          Рекомендація для прогнозу
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge className={getRecommendationColor(recommendation)} variant="secondary">
            {getRecommendationText(recommendation)}
          </Badge>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Впевненість: {confidence}%
            </span>
          </div>
        </div>

        {expectedValue && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Очікувана вартість</div>
            <div className={`font-bold ${expectedValue > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {expectedValue > 0 ? '+' : ''}{(expectedValue * 100).toFixed(1)}%
            </div>
          </div>
        )}

        <Alert variant={getAlertVariant()}>
          <AlertDescription>
            {recommendation === 'safe' && 
              'Ця ставка має хороший потенціал прибутку з низьким ризиком.'
            }
            {recommendation === 'risky' && 
              'Прогноз може бути прибутковим, але несе підвищений ризик.'
            }
            {recommendation === 'avoid' && 
              'Не рекомендується робити прогноз через високий ризик втрат.'
            }
          </AlertDescription>
        </Alert>

        {reasoning.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Обґрунтування:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {reasoning.map((reason, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}