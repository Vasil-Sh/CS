import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

// Функція для перекладу типів ставок на українську
function translateBetType(betType: string): string {
  const translations: Record<string, string> = {
    'Match Winner': 'Переможець матчу',
    'Map Winner': 'Переможець карти',
    'Handicap': 'Фора',
    'Map Handicap': 'Фора на карту',
    'Round Handicap': 'Фора раундів',
    'Total': 'Тотал',
    'Total Maps': 'Тотал карт',
    'Total Rounds': 'Тотал раундів',
    'Over': 'Більше',
    'Under': 'Менше',
    'Winner': 'Переможець',
    'First Map Winner': 'Переможець 1-ї карти',
    'Second Map Winner': 'Переможець 2-ї карти',
    'Third Map Winner': 'Переможець 3-ї карти',
    'First Map': '1-а карта',
    'Second Map': '2-а карта',
    'Third Map': '3-я карта',
    'Correct Score': 'Точний рахунок',
    'Map 1': 'Карта 1',
    'Map 2': 'Карта 2',
    'Map 3': 'Карта 3',
    'Kill Handicap': 'Фора по кілам',
    'Kill Total': 'Тотал кілів',
    'Moneyline': 'Переможець',
    'Spread': 'Фора',
    'Draw': 'Нічія',
    'Yes': 'Так',
    'No': 'Ні',
  };

  let result = betType;
  
  // Сортуємо ключі за довжиною (довші першими) щоб уникнути часткових замін
  const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    const regex = new RegExp(key, 'gi');
    result = result.replace(regex, translations[key]);
  }
  
  return result;
}

// Компонент для блюр-ефекту з розкриттям по кліку
function BlurReveal({ children, isPending }: { children: React.ReactNode; isPending: boolean }) {
  const [revealed, setRevealed] = useState(false);

  if (!isPending) {
    return <>{children}</>;
  }

  return (
    <span
      onClick={() => setRevealed(!revealed)}
      className={`cursor-pointer select-none transition-all duration-300 inline-block ${
        revealed ? '' : 'blur-md hover:blur-sm'
      }`}
      title={revealed ? 'Натисніть щоб приховати' : 'Натисніть щоб показати'}
    >
      {children}
    </span>
  );
}

export default function BetShareCard({ bet }: BetShareCardProps) {
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  
  const isWin = bet.result === 'Win';
  const isLoss = bet.result === 'Loss';
  const isPending = bet.result === 'Pending';
  
  const currency = bet.currency || 'UAH';
  const currencySymbol = currency === 'USD' ? '$' : '₴';
  const displayAmount = bet.originalAmount || bet.amount;
  const displayProfit = bet.originalProfit !== undefined ? bet.originalProfit : bet.profit;

  // Перевірка чи це експрес
  const isExpress = bet.betType.includes('Експрес') || bet.format.includes('x');
  
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
    // Формат: "Експрес 2x | 1. TEAM1 vs TEAM2 | Type: Selection @odds • 2. ..."
    const fullString = bet.betType.split('|').slice(1).join('|').trim();
    const eventStrings = fullString.split('•').map(e => e.trim());
    
    parsedEvents = eventStrings.map(eventStr => {
      // Парсимо: "1. INNER CIRCLE vs FURIA | Match Winner: FURIA @1.22"
      const parts = eventStr.split('|').map(p => p.trim());
      
      if (parts.length >= 2) {
        const matchPart = parts[0]; // "1. INNER CIRCLE vs FURIA"
        const betPart = parts[1]; // "Match Winner: FURIA @1.22"
        
        // Витягуємо номер та матч
        const numberMatch = matchPart.match(/^(\d+)\.\s*(.+)$/);
        const number = numberMatch ? numberMatch[1] : '';
        const match = numberMatch ? numberMatch[2] : matchPart;
        
        // Витягуємо тип ставки, вибір та коефіцієнт
        const betMatch = betPart.match(/^(.+?):\s*(.+?)\s*@([\d.]+)$/);
        const betType = betMatch ? translateBetType(betMatch[1]) : '';
        const selection = betMatch ? betMatch[2] : '';
        const odds = betMatch ? betMatch[3] : '';
        
        return { number, match, betType, selection, odds };
      }
      
      return { number: '', match: eventStr, betType: '', selection: '', odds: '' };
    });
  }

  // Extract selection from betType for regular bets
  const betTypeParts = bet.betType.split(' - ');
  const betCategory = translateBetType(betTypeParts[0] || bet.betType);
  const selection = betTypeParts[1] || '';

  // Calculate total amount (only for Win and Pending)
  const totalAmount = isPending 
    ? displayAmount * bet.odds 
    : isWin 
    ? displayAmount + (displayProfit || 0)
    : 0;

  // Назва матчу
  const matchName = bet.match || `${bet.team1} vs ${bet.team2}`;

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
          {/* Match Info Block - тільки назва матчу, без формату */}
          <div className={`p-5 rounded-2xl border text-center ${
            isWin 
              ? 'bg-green-50/50 border-green-200/60' 
              : isLoss 
              ? 'bg-red-50/50 border-red-200/60' 
              : 'bg-blue-50/50 border-blue-200/60'
          }`}>
            <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">
              {matchName}
            </h3>
          </div>

          {/* Express Events with Dropdown or Regular Selection */}
          {isExpress && parsedEvents.length > 0 ? (
            <div className={`rounded-2xl backdrop-blur-sm border overflow-hidden ${
              isWin 
                ? 'bg-green-50/80 border-green-200' 
                : isLoss
                ? 'bg-red-50/80 border-red-200'
                : 'bg-purple-50/80 border-purple-200'
            }`}>
              {/* Dropdown header - clickable */}
              <button
                onClick={() => setIsEventsOpen(!isEventsOpen)}
                className={`w-full flex items-center justify-between py-3 px-4 transition-colors cursor-pointer ${
                  isWin 
                    ? 'bg-green-100/50 hover:bg-green-100/80' 
                    : isLoss
                    ? 'bg-red-100/50 hover:bg-red-100/80'
                    : 'bg-purple-100/50 hover:bg-purple-100/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isWin && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Експрес {bet.format}
                  </p>
                </div>
                {isEventsOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {/* Events list - collapsible */}
              {isEventsOpen && (
                <div className="p-4 space-y-3">
                  {parsedEvents.map((event, index) => (
                    <div key={index} className={`p-3 rounded-xl border ${
                      isWin 
                        ? 'bg-white/60 border-green-200' 
                        : isLoss
                        ? 'bg-white/60 border-red-200'
                        : 'bg-white/60 border-purple-200'
                    }`}>
                      <div className="flex items-start gap-2 mb-2">
                        <Badge className={`rounded-full text-xs font-bold ${
                          isWin 
                            ? 'bg-green-600 text-white' 
                            : isLoss
                            ? 'bg-red-600 text-white'
                            : 'bg-purple-600 text-white'
                        } border-0`}>
                          #{event.number}
                        </Badge>
                        <p className="text-sm font-semibold text-gray-900 leading-tight flex-1">
                          {event.match}
                        </p>
                      </div>
                      
                      <div className="space-y-1 ml-8">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                          {event.betType}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-bold ${
                            isWin ? 'text-green-700' : isLoss ? 'text-red-700' : 'text-purple-700'
                          }`}>
                            <BlurReveal isPending={isPending}>{event.selection}</BlurReveal>
                          </p>
                          <Badge className={`text-xs font-semibold rounded-full ${
                            isWin 
                              ? 'bg-green-100 text-green-700' 
                              : isLoss
                              ? 'bg-red-100 text-red-700'
                              : 'bg-purple-100 text-purple-700'
                          } border-0`}>
                            {event.odds}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                <BlurReveal isPending={isPending}>{selection}</BlurReveal>
              </p>
            </div>
          )}

          {/* Bet Info - iOS cards style */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-4 bg-gray-50/80 rounded-2xl backdrop-blur-sm border border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Стартова сума</p>
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
                <BlurReveal isPending={isPending}>
                  +{((bet.odds - 1) * displayAmount).toFixed(2)} {currencySymbol}
                </BlurReveal>
              </p>
            </div>
          )}

          {/* Total Amount - only for Win and Pending */}
          {!isLoss && (
            <div className="p-5 bg-gray-50/80 rounded-2xl backdrop-blur-sm border border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide text-center">Загальна сума</p>
              <p className="text-3xl font-semibold text-gray-900 text-center tracking-tight">
                {isPending ? (
                  <BlurReveal isPending={isPending}>
                    {totalAmount.toFixed(2)} {currencySymbol}
                  </BlurReveal>
                ) : (
                  <>{totalAmount.toFixed(2)} {currencySymbol}</>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}