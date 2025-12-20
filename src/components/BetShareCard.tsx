import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingDown, Target, Calendar, CheckCircle2 } from 'lucide-react';

interface BetShareCardProps {
  bet: {
    match?: string;
    team1?: string;
    team2?: string;
    date: string;
    betType: string;
    format: string;
    currency?: string;
    amount: number;
    originalAmount?: number;
    odds: number;
    result: string;
    profit?: number;
    originalProfit?: number;
    exchangeRate?: number;
  };
}

export default function BetShareCard({ bet }: BetShareCardProps) {
  const isWin = bet.result === 'Win';
  const isLoss = bet.result === 'Loss';
  const isPending = bet.result === 'Pending';
  
  const currency = bet.currency || 'UAH';
  const currencySymbol = currency === 'USD' ? '$' : '₴';
  const displayAmount = bet.originalAmount || bet.amount;
  const displayProfit = bet.originalProfit !== undefined ? bet.originalProfit : bet.profit;

  // Перевірка чи це експрес
  const isExpress = bet.betType.includes('Експрес') || bet.format.includes('x');
  
  // Для експресу витягуємо інформацію
  let expressEvents: string[] = [];
  if (isExpress && bet.betType.includes('|')) {
    // Формат: "Експрес 2x | 1. TEAM1 vs TEAM2 | Type: Selection @odds • 2. ..."
    const parts = bet.betType.split('|').slice(1); // Пропускаємо "Експрес 2x"
    expressEvents = parts.map(part => part.trim());
  }

  // Extract selection from betType for regular bets
  const betTypeParts = bet.betType.split(' - ');
  const betCategory = betTypeParts[0] || bet.betType;
  const selection = betTypeParts[1] || '';

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-gradient-to-b from-gray-50 to-white">
      <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
        {/* Header with iOS-style blur */}
        <div className={`p-6 backdrop-blur-xl ${
          isWin ? 'bg-gradient-to-br from-green-500/90 to-emerald-500/90' :
          isLoss ? 'bg-gradient-to-br from-red-500/90 to-rose-500/90' :
          'bg-gradient-to-br from-blue-500/90 to-cyan-500/90'
        }`}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-sm">
                {isWin ? (
                  <Trophy className="h-6 w-6" />
                ) : isLoss ? (
                  <TrendingDown className="h-6 w-6" />
                ) : (
                  <Target className="h-6 w-6" />
                )}
              </div>
              <span className="font-semibold text-xl tracking-tight">
                {isWin ? 'Виграш' : isLoss ? 'Програш' : 'Очікується'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Calendar className="h-3.5 w-3.5" />
              <span>{bet.date}</span>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-5">
          {/* Match - iOS style */}
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">
              {bet.match || `${bet.team1} vs ${bet.team2}`}
            </h3>
            <Badge variant="secondary" className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700 border-0">
              {bet.format}
            </Badge>
          </div>

          {/* Express Events or Regular Selection */}
          {isExpress && expressEvents.length > 0 ? (
            <div className={`p-4 rounded-2xl backdrop-blur-sm border space-y-2 ${
              isWin 
                ? 'bg-green-50/80 border-green-200' 
                : isLoss
                ? 'bg-red-50/80 border-red-200'
                : 'bg-purple-50/80 border-purple-200'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                {isWin && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Експрес {bet.format}
                </p>
              </div>
              {expressEvents.map((event, index) => (
                <div key={index} className="text-sm">
                  <p className={`font-medium ${
                    isWin ? 'text-green-700' : isLoss ? 'text-red-700' : 'text-purple-700'
                  }`}>
                    {event}
                  </p>
                </div>
              ))}
            </div>
          ) : selection && (
            <div className={`p-4 rounded-2xl backdrop-blur-sm border ${
              isWin 
                ? 'bg-green-50/80 border-green-200' 
                : isLoss
                ? 'bg-red-50/80 border-red-200'
                : 'bg-blue-50/80 border-blue-200'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                {isWin && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {betCategory}
                </p>
              </div>
              <p className={`text-2xl font-bold text-center tracking-tight ${
                isWin ? 'text-green-700' : isLoss ? 'text-red-700' : 'text-blue-700'
              }`}>
                {selection}
              </p>
            </div>
          )}

          {/* Bet Info - iOS cards style */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-4 bg-gray-50/80 rounded-2xl backdrop-blur-sm border border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Ставка</p>
              <p className="text-xl font-semibold text-gray-900">
                {currencySymbol}{displayAmount}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50/80 rounded-2xl backdrop-blur-sm border border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Коефіцієнт</p>
              <p className="text-xl font-semibold text-gray-900">
                {bet.odds.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Profit - iOS style with subtle shadow */}
          {!isPending && displayProfit !== undefined && displayProfit !== null && (
            <div className={`p-5 rounded-2xl backdrop-blur-sm border ${
              isWin 
                ? 'bg-green-50/80 border-green-100' 
                : 'bg-red-50/80 border-red-100'
            }`}>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide text-center">Профіт</p>
              <p className={`text-3xl font-semibold text-center tracking-tight ${
                isWin ? 'text-green-600' : 'text-red-600'
              }`}>
                {displayProfit > 0 ? '+' : ''}{displayProfit.toFixed(2)} {currencySymbol}
              </p>
            </div>
          )}

          {isPending && (
            <div className="p-5 bg-blue-50/80 rounded-2xl backdrop-blur-sm border border-blue-100">
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide text-center">Можливий виграш</p>
              <p className="text-3xl font-semibold text-blue-600 text-center tracking-tight">
                +{((bet.odds - 1) * displayAmount).toFixed(2)} {currencySymbol}
              </p>
            </div>
          )}

          {/* Footer - iOS style subtle text */}
          <div className="pt-3 text-center">
            <p className="text-xs text-gray-400 font-medium">CS2 Betting Tracker</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}