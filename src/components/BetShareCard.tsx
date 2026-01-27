import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingDown, Target, Calendar, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

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
  
  // State for expanded express events
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Для експресу витягуємо інформацію та парсимо події
  interface ParsedEvent {
    number: string;
    match: string;
    betType: string;
    selection: string;
    odds: string;
  }
  
  let parsedEvents: ParsedEvent[] = [];
  
  if (isExpress && bet.betType.includes('|')) {
    const fullString = bet.betType.split('|').slice(1).join('|').trim();
    const eventStrings = fullString.split('•').map(e => e.trim());
    
    parsedEvents = eventStrings.map(eventStr => {
      const parts = eventStr.split('|').map(p => p.trim());
      
      if (parts.length >= 2) {
        const matchPart = parts[0];
        const betPart = parts[1];
        
        const numberMatch = matchPart.match(/^(\d+)\.\s*(.+)$/);
        const number = numberMatch ? numberMatch[1] : '';
        const match = numberMatch ? numberMatch[2] : matchPart;
        
        const betMatch = betPart.match(/^(.+?):\s*(.+?)\s*@([\d.]+)$/);
        const betType = betMatch ? betMatch[1] : '';
        const selection = betMatch ? betMatch[2] : '';
        const odds = betMatch ? betMatch[3] : '';
        
        return { number, match, betType, selection, odds };
      }
      
      return { number: '', match: eventStr, betType: '', selection: '', odds: '' };
    });
  }

  // Extract selection from betType for regular bets
  const betTypeParts = bet.betType.split(' - ');
  const betCategory = betTypeParts[0] || bet.betType;
  const selection = betTypeParts[1] || '';

  // Show first 3 events or all if expanded
  const visibleEvents = isExpanded ? parsedEvents : parsedEvents.slice(0, 3);
  const hasMoreEvents = parsedEvents.length > 3;

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-gradient-to-b from-gray-50 to-white">
      <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white">
        {/* Clean Header */}
        <div className={`p-6 shadow-sm ${
          isWin ? 'bg-green-500' :
          isLoss ? 'bg-red-500' :
          'bg-blue-500'
        }`}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-2xl shadow-sm">
                {isWin ? (
                  <Trophy className="h-6 w-6" />
                ) : isLoss ? (
                  <TrendingDown className="h-6 w-6" />
                ) : (
                  <Target className="h-6 w-6" />
                )}
              </div>
              <span className="font-semibold text-xl">
                {isWin ? 'Виграш' : isLoss ? 'Програш' : 'Очікується'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium bg-white/20 px-3 py-1.5 rounded-full shadow-sm">
              <Calendar className="h-3.5 w-3.5" />
              <span>{bet.date}</span>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-5">
          {/* Match Info */}
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-semibold text-gray-900">
              {bet.match || `${bet.team1} vs ${bet.team2}`}
            </h3>
            <Badge className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700 border-0 shadow-sm">
              {bet.format}
            </Badge>
          </div>

          {/* Express Events or Regular Selection */}
          {isExpress && parsedEvents.length > 0 ? (
            <div className={`rounded-2xl border overflow-hidden shadow-md ${
              isWin 
                ? 'bg-green-50/50 border-green-200' 
                : isLoss
                ? 'bg-red-50/50 border-red-200'
                : 'bg-blue-50/50 border-blue-200'
            }`}>
              <div className={`flex items-center justify-center gap-2 py-3 px-4 shadow-sm ${
                isWin 
                  ? 'bg-green-100/50' 
                  : isLoss
                  ? 'bg-red-100/50'
                  : 'bg-blue-100/50'
              }`}>
                {isWin && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Експрес {bet.format}
                </p>
              </div>
              
              <div className="p-4 space-y-2">
                {visibleEvents.map((event, index) => (
                  <div key={index} className={`p-2.5 rounded-xl border bg-white shadow-sm ${
                    isWin 
                      ? 'border-green-200' 
                      : isLoss
                      ? 'border-red-200'
                      : 'border-blue-200'
                  }`}>
                    <div className="flex items-start gap-2 mb-1.5">
                      <Badge className={`rounded-full text-xs font-bold px-1.5 py-0.5 h-5 min-w-[20px] flex items-center justify-center shadow-sm ${
                        isWin 
                          ? 'bg-green-600 text-white' 
                          : isLoss
                          ? 'bg-red-600 text-white'
                          : 'bg-blue-600 text-white'
                      } border-0`}>
                        {event.number}
                      </Badge>
                      <p className="text-xs font-semibold text-gray-900 leading-tight flex-1">
                        {event.match}
                      </p>
                    </div>
                    
                    <div className="space-y-0.5 ml-7">
                      <p className="text-[10px] text-gray-500 font-medium uppercase">
                        {event.betType}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-bold ${
                          isWin ? 'text-green-700' : isLoss ? 'text-red-700' : 'text-blue-700'
                        }`}>
                          {event.selection}
                        </p>
                        <Badge className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 shadow-sm ${
                          isWin 
                            ? 'bg-green-100 text-green-700' 
                            : isLoss
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        } border-0`}>
                          @{parseFloat(event.odds).toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                
                {hasMoreEvents && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`w-full h-8 text-xs font-medium rounded-lg mt-2 ${
                      isWin 
                        ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                        : isLoss
                        ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                        : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Сховати {parsedEvents.length - 3} подій
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Показати ще {parsedEvents.length - 3} подій
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ) : selection && (
            <div className={`p-4 rounded-2xl border shadow-md ${
              isWin 
                ? 'bg-green-50/50 border-green-200' 
                : isLoss
                ? 'bg-red-50/50 border-red-200'
                : 'bg-blue-50/50 border-blue-200'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                {isWin && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                <p className="text-xs font-medium text-gray-500 uppercase">
                  {betCategory}
                </p>
              </div>
              <p className={`text-2xl font-bold text-center ${
                isWin ? 'text-green-700' : isLoss ? 'text-red-700' : 'text-blue-700'
              }`}>
                {selection}
              </p>
            </div>
          )}

          {/* Bet Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-medium text-gray-500 mb-1.5 uppercase">Прогноз</p>
              <p className="text-xl font-semibold text-gray-900">
                {currencySymbol}{displayAmount}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-medium text-gray-500 mb-1.5 uppercase">Коефіцієнт</p>
              <p className="text-xl font-semibold text-gray-900">
                {bet.odds.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Profit */}
          {!isPending && displayProfit !== undefined && displayProfit !== null && (
            <div className={`p-5 rounded-2xl border shadow-md ${
              isWin 
                ? 'bg-green-50/50 border-green-100' 
                : 'bg-red-50/50 border-red-100'
            }`}>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase text-center">Профіт</p>
              <p className={`text-3xl font-semibold text-center ${
                isWin ? 'text-green-600' : 'text-red-600'
              }`}>
                {displayProfit > 0 ? '+' : ''}{displayProfit.toFixed(2)} {currencySymbol}
              </p>
            </div>
          )}

          {isPending && (
            <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 shadow-md">
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase text-center">Можливий виграш</p>
              <p className="text-3xl font-semibold text-blue-600 text-center">
                +{((bet.odds - 1) * displayAmount).toFixed(2)} {currencySymbol}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}