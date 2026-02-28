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

  const statusColor = isWin ? '#22C55E' : isLoss ? '#EF4444' : '#3B82F6';
  const statusBg = isWin ? '#F0FDF4' : isLoss ? '#FEF2F2' : '#EFF6FF';
  const statusBorder = isWin ? '#DCFCE7' : isLoss ? '#FEE2E2' : '#DBEAFE';
  const statusText = isWin ? 'Виграш' : isLoss ? 'Програш' : 'Очікується';

  return (
    <div className="w-full">
      {/* Status Header */}
      <div 
        className="flex items-center justify-between px-5 py-4 rounded-2xl mb-4"
        style={{ backgroundColor: statusBg, border: `1px solid ${statusBorder}` }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ backgroundColor: statusColor + '15' }}
          >
            {isWin ? (
              <Trophy className="h-5 w-5" style={{ color: statusColor }} strokeWidth={1.5} />
            ) : isLoss ? (
              <TrendingDown className="h-5 w-5" style={{ color: statusColor }} strokeWidth={1.5} />
            ) : (
              <Target className="h-5 w-5" style={{ color: statusColor }} strokeWidth={1.5} />
            )}
          </div>
          <span className="font-semibold text-lg text-[#111827]">{statusText}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-[#6B7280] bg-white px-3 py-1.5 rounded-full border border-[#E5E7EB]">
          <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>{bet.date}</span>
        </div>
      </div>

      {/* Match Name */}
      <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl px-5 py-4 mb-4 text-center">
        <h3 className="text-xl font-semibold text-[#111827] tracking-tight">
          {matchName}
        </h3>
        <Badge className="mt-2 rounded-md bg-[#F3F4F6] text-[#6B7280] border-0 font-medium text-xs hover:bg-[#F3F4F6]">
          {bet.format}
        </Badge>
      </div>

      {/* Express Events or Regular Selection */}
      {isExpress && parsedEvents.length > 0 ? (
        <div className="rounded-2xl border border-[#E5E7EB] overflow-hidden mb-4">
          <button
            onClick={() => setIsEventsOpen(!isEventsOpen)}
            className="w-full flex items-center justify-between py-3.5 px-5 bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {isWin && <CheckCircle2 className="h-4 w-4 text-[#22C55E]" strokeWidth={1.5} />}
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
                <div key={index} className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6]">
                  <div className="flex items-start gap-2 mb-2">
                    <Badge 
                      className="rounded-full text-xs font-bold border-0 px-2 py-0.5 hover:opacity-100"
                      style={{ backgroundColor: statusColor, color: '#fff' }}
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
                      <p className="text-sm font-bold" style={{ color: statusColor }}>
                        <BlurReveal isPending={isPending}>{event.selection}</BlurReveal>
                      </p>
                      <Badge 
                        className="text-xs font-semibold rounded-full border-0 hover:opacity-100"
                        style={{ backgroundColor: statusBg, color: statusColor }}
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
          className="px-5 py-4 rounded-2xl mb-4 border text-center"
          style={{ backgroundColor: statusBg, borderColor: statusBorder }}
        >
          <div className="flex items-center justify-center gap-2 mb-1.5">
            {isWin && <CheckCircle2 className="h-4 w-4 text-[#22C55E]" strokeWidth={1.5} />}
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
              {betCategory}
            </p>
          </div>
          <p className="text-xl font-bold tracking-tight" style={{ color: statusColor }}>
            <BlurReveal isPending={isPending}>{selection}</BlurReveal>
          </p>
        </div>
      )}

      {/* Amount & Odds Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-4 bg-[#F9FAFB] rounded-2xl border border-[#F3F4F6]">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <DollarSign className="h-3.5 w-3.5 text-[#9CA3AF]" strokeWidth={1.5} />
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Сума</p>
          </div>
          <p className="text-xl font-bold text-[#111827]">
            {currencySymbol}{displayAmount}
          </p>
        </div>
        <div className="text-center p-4 bg-[#F9FAFB] rounded-2xl border border-[#F3F4F6]">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <Percent className="h-3.5 w-3.5 text-[#9CA3AF]" strokeWidth={1.5} />
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Коефіцієнт</p>
          </div>
          <p className="text-xl font-bold text-[#111827]">
            {bet.odds.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Profit */}
      {!isPending && displayProfit !== undefined && displayProfit !== null && (
        <div 
          className="p-5 rounded-2xl border mb-4 text-center"
          style={{ backgroundColor: statusBg, borderColor: statusBorder }}
        >
          <p className="text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Профіт</p>
          <p className="text-3xl font-bold tracking-tight" style={{ color: statusColor }}>
            {displayProfit > 0 ? '+' : ''}{displayProfit.toFixed(2)} {currencySymbol}
          </p>
        </div>
      )}

      {/* Pending - Possible Win */}
      {isPending && (
        <div className="p-5 rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF] mb-4 text-center">
          <p className="text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Можливий виграш</p>
          <p className="text-3xl font-bold text-[#3B82F6] tracking-tight">
            <BlurReveal isPending={isPending}>
              +{((bet.odds - 1) * displayAmount).toFixed(2)} {currencySymbol}
            </BlurReveal>
          </p>
        </div>
      )}

      {/* Total Amount - only for Win and Pending */}
      {!isLoss && (
        <div className="p-5 bg-[#F9FAFB] rounded-2xl border border-[#F3F4F6] text-center">
          <p className="text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Загальна сума</p>
          <p className="text-3xl font-bold text-[#111827] tracking-tight">
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