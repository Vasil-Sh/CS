import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, TrendingDown, Target, Calendar, CheckCircle2,
  ChevronDown, ChevronUp, DollarSign, Percent
} from 'lucide-react';

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
  const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    const regex = new RegExp(key, 'gi');
    result = result.replace(regex, translations[key]);
  }
  
  return result;
}

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

  const isExpress = bet.betType.includes('Експрес') || bet.format.includes('x');
  
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
        const betType = betMatch ? translateBetType(betMatch[1]) : '';
        const selection = betMatch ? betMatch[2] : '';
        const odds = betMatch ? betMatch[3] : '';
        
        return { number, match, betType, selection, odds };
      }
      
      return { number: '', match: eventStr, betType: '', selection: '', odds: '' };
    });
  }

  const betTypeParts = bet.betType.split(' - ');
  const betCategory = translateBetType(betTypeParts[0] || bet.betType);
  const selection = betTypeParts[1] || '';

  const totalAmount = isPending 
    ? displayAmount * bet.odds 
    : isWin 
    ? displayAmount + (displayProfit || 0)
    : 0;

  const matchName = bet.match || `${bet.team1} vs ${bet.team2}`;

  // "Clean Glass" palette — semantic accent only on text
  const accentColor = isWin ? '#059669' : isLoss ? '#DC2626' : '#2563EB';
  const statusText = isWin ? 'Виграш' : isLoss ? 'Програш' : 'Очікується';

  // Universal border and background
  const cardBorder = '#E5E7EB';
  const cardBg = '#FFFFFF';

  return (
    <div className="w-full">
      {/* Status Header — clean white, only text is colored */}
      <div 
        className="flex items-center justify-between px-5 py-3.5 rounded-2xl mb-3"
        style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#F9FAFB]">
            {isWin ? (
              <Trophy className="h-[18px] w-[18px]" style={{ color: accentColor }} strokeWidth={1.5} />
            ) : isLoss ? (
              <TrendingDown className="h-[18px] w-[18px]" style={{ color: accentColor }} strokeWidth={1.5} />
            ) : (
              <Target className="h-[18px] w-[18px]" style={{ color: accentColor }} strokeWidth={1.5} />
            )}
          </div>
          <span className="font-semibold text-base" style={{ color: accentColor }}>{statusText}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-[#9CA3AF]">
          <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>{bet.date}</span>
        </div>
      </div>

      {/* Match Name — clean white */}
      <div 
        className="rounded-2xl px-5 py-4 mb-3 text-center"
        style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
      >
        <h3 className="text-xl font-semibold text-[#111827] tracking-tight">
          {matchName}
        </h3>
        <Badge className="mt-2 rounded-md bg-[#F3F4F6] text-[#6B7280] border-0 font-medium text-xs hover:bg-[#F3F4F6]">
          {bet.format}
        </Badge>
      </div>

      {/* Express Events or Regular Selection */}
      {isExpress && parsedEvents.length > 0 ? (
        <div 
          className="rounded-2xl overflow-hidden mb-3"
          style={{ border: `1px solid ${cardBorder}` }}
        >
          <button
            onClick={() => setIsEventsOpen(!isEventsOpen)}
            className="w-full flex items-center justify-between py-3.5 px-5 bg-white hover:bg-[#FAFAFA] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {isWin && <CheckCircle2 className="h-4 w-4" style={{ color: accentColor }} strokeWidth={1.5} />}
              <p className="text-sm font-semibold text-[#374151] uppercase tracking-wide">
                Експрес {bet.format}
              </p>
            </div>
            {isEventsOpen ? (
              <ChevronUp className="h-4 w-4 text-[#9CA3AF]" strokeWidth={1.5} />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#9CA3AF]" strokeWidth={1.5} />
            )}
          </button>
          
          {isEventsOpen && (
            <div className="p-4 space-y-3 border-t border-[#F3F4F6]">
              {parsedEvents.map((event, index) => (
                <div 
                  key={index} 
                  className="p-3.5 rounded-xl"
                  style={{ backgroundColor: '#FAFAFA', border: `1px solid ${cardBorder}` }}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Badge 
                      className="rounded-full text-xs font-bold border-0 px-2 py-0.5 hover:opacity-100 text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      #{event.number}
                    </Badge>
                    <p className="text-sm font-semibold text-[#111827] leading-tight flex-1">
                      {event.match}
                    </p>
                  </div>
                  
                  <div className="space-y-1 ml-8">
                    <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">
                      {event.betType}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold" style={{ color: accentColor }}>
                        <BlurReveal isPending={isPending}>{event.selection}</BlurReveal>
                      </p>
                      <Badge 
                        className="text-xs font-semibold rounded-full hover:opacity-100 bg-white"
                        style={{ color: '#374151', border: `1px solid ${cardBorder}` }}
                      >
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
        <div 
          className="px-5 py-4 rounded-2xl mb-3 text-center"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <div className="flex items-center justify-center gap-2 mb-1.5">
            {isWin && <CheckCircle2 className="h-4 w-4" style={{ color: accentColor }} strokeWidth={1.5} />}
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
              {betCategory}
            </p>
          </div>
          <p className="text-xl font-bold tracking-tight" style={{ color: accentColor }}>
            <BlurReveal isPending={isPending}>{selection}</BlurReveal>
          </p>
        </div>
      )}

      {/* Amount & Odds Grid — clean white */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div 
          className="text-center p-4 rounded-2xl"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <DollarSign className="h-3.5 w-3.5 text-[#9CA3AF]" strokeWidth={1.5} />
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Сума</p>
          </div>
          <p className="text-xl font-bold text-[#111827]">
            {currencySymbol}{displayAmount}
          </p>
        </div>
        <div 
          className="text-center p-4 rounded-2xl"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <Percent className="h-3.5 w-3.5 text-[#9CA3AF]" strokeWidth={1.5} />
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Коефіцієнт</p>
          </div>
          <p className="text-xl font-bold text-[#111827]">
            {bet.odds.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Profit — THE hero element, clean white card, colored text only */}
      {!isPending && displayProfit !== undefined && displayProfit !== null && (
        <div 
          className="p-6 rounded-2xl mb-3 text-center"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <p className="text-xs font-medium mb-2 uppercase tracking-wide text-[#9CA3AF]">Профіт</p>
          <p className="text-4xl font-extrabold tracking-tight" style={{ color: accentColor }}>
            {displayProfit > 0 ? '+' : ''}{displayProfit.toFixed(2)} {currencySymbol}
          </p>
        </div>
      )}

      {/* Pending - Possible Win */}
      {isPending && (
        <div 
          className="p-6 rounded-2xl mb-3 text-center"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <p className="text-xs font-medium mb-2 uppercase tracking-wide text-[#9CA3AF]">Можливий виграш</p>
          <p className="text-4xl font-extrabold tracking-tight" style={{ color: accentColor }}>
            <BlurReveal isPending={isPending}>
              +{((bet.odds - 1) * displayAmount).toFixed(2)} {currencySymbol}
            </BlurReveal>
          </p>
        </div>
      )}

      {/* Total Amount — no background, just bold text, secondary */}
      {!isLoss && (
        <div className="py-3 text-center">
          <p className="text-xs font-medium text-[#9CA3AF] mb-1 uppercase tracking-wide">Загальна сума</p>
          <p className="text-2xl font-bold text-[#111827] tracking-tight">
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
    </div>
  );
}