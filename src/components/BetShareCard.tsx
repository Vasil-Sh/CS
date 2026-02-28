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

// Color themes per status
const themes = {
  Win: {
    accent: '#059669',
    accentLight: '#D1FAE5',
    accentMid: '#A7F3D0',
    accentBg: '#F0FDF4',
    gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
  },
  Loss: {
    accent: '#DC2626',
    accentLight: '#FEE2E2',
    accentMid: '#FECACA',
    accentBg: '#FEF2F2',
    gradient: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
  },
  Pending: {
    accent: '#2563EB',
    accentLight: '#DBEAFE',
    accentMid: '#BFDBFE',
    accentBg: '#EFF6FF',
    gradient: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
  },
};

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
  const statusText = isWin ? 'Виграш' : isLoss ? 'Програш' : 'Очікується';
  
  const theme = isWin ? themes.Win : isLoss ? themes.Loss : themes.Pending;

  return (
    <div className="w-full space-y-3">
      {/* Status Banner — gradient colored bar */}
      <div 
        className="flex items-center justify-between px-5 py-4 rounded-2xl text-white"
        style={{ background: theme.gradient }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
            {isWin ? (
              <Trophy className="h-5 w-5 text-white" strokeWidth={1.5} />
            ) : isLoss ? (
              <TrendingDown className="h-5 w-5 text-white" strokeWidth={1.5} />
            ) : (
              <Target className="h-5 w-5 text-white" strokeWidth={1.5} />
            )}
          </div>
          <div>
            <p className="font-bold text-lg leading-tight">{statusText}</p>
            <p className="text-xs text-white/70 font-medium">{bet.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-white/80 bg-white/15 px-3 py-1.5 rounded-full backdrop-blur-sm">
          <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>{bet.format}</span>
        </div>
      </div>

      {/* Match Name */}
      <div 
        className="rounded-2xl px-5 py-4 text-center bg-white"
        style={{ border: '1px solid #E5E7EB' }}
      >
        <h3 className="text-lg font-bold text-[#111827] tracking-tight">
          {matchName}
        </h3>
      </div>

      {/* Express Events or Regular Selection */}
      {isExpress && parsedEvents.length > 0 ? (
        <div 
          className="rounded-2xl overflow-hidden bg-white"
          style={{ border: '1px solid #E5E7EB' }}
        >
          <button
            onClick={() => setIsEventsOpen(!isEventsOpen)}
            className="w-full flex items-center justify-between py-3.5 px-5 hover:bg-[#FAFAFA] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {isWin && <CheckCircle2 className="h-4 w-4" style={{ color: theme.accent }} strokeWidth={1.5} />}
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
            <div className="p-4 space-y-2.5 border-t border-[#F3F4F6]">
              {parsedEvents.map((event, index) => (
                <div 
                  key={index} 
                  className="p-3.5 rounded-xl"
                  style={{ backgroundColor: theme.accentBg, border: `1px solid ${theme.accentLight}` }}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span 
                      className="flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: theme.accent }}
                    >
                      {event.number}
                    </span>
                    <p className="text-sm font-semibold text-[#111827] leading-tight flex-1">
                      {event.match}
                    </p>
                  </div>
                  
                  <div className="space-y-1 ml-8">
                    <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">
                      {event.betType}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold" style={{ color: theme.accent }}>
                        <BlurReveal isPending={isPending}>{event.selection}</BlurReveal>
                      </p>
                      <span 
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: theme.accentLight, color: theme.accent }}
                      >
                        {event.odds}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : selection && (
        <div 
          className="px-5 py-4 rounded-2xl text-center bg-white"
          style={{ border: '1px solid #E5E7EB' }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            {isWin && <CheckCircle2 className="h-4 w-4" style={{ color: theme.accent }} strokeWidth={1.5} />}
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
              {betCategory}
            </p>
          </div>
          <p className="text-xl font-bold tracking-tight" style={{ color: theme.accent }}>
            <BlurReveal isPending={isPending}>{selection}</BlurReveal>
          </p>
        </div>
      )}

      {/* Amount & Odds — compact row */}
      <div className="grid grid-cols-2 gap-3">
        <div 
          className="text-center p-3.5 rounded-2xl bg-white"
          style={{ border: '1px solid #E5E7EB' }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <DollarSign className="h-3.5 w-3.5 text-[#9CA3AF]" strokeWidth={1.5} />
            <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">Сума</p>
          </div>
          <p className="text-lg font-bold text-[#111827]">
            {currencySymbol}{displayAmount}
          </p>
        </div>
        <div 
          className="text-center p-3.5 rounded-2xl bg-white"
          style={{ border: '1px solid #E5E7EB' }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Percent className="h-3.5 w-3.5 text-[#9CA3AF]" strokeWidth={1.5} />
            <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">Коефіцієнт</p>
          </div>
          <p className="text-lg font-bold text-[#111827]">
            {bet.odds.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Profit — colored background block */}
      {!isPending && displayProfit !== undefined && displayProfit !== null && (
        <div 
          className="p-5 rounded-2xl text-center"
          style={{ backgroundColor: theme.accentBg, border: `1.5px solid ${theme.accentMid}` }}
        >
          <p className="text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: theme.accent }}>
            Профіт
          </p>
          <p className="text-3xl font-bold tracking-tight" style={{ color: theme.accent }}>
            {displayProfit > 0 ? '+' : ''}{displayProfit.toFixed(2)} {currencySymbol}
          </p>
        </div>
      )}

      {/* Pending — possible win */}
      {isPending && (
        <div 
          className="p-5 rounded-2xl text-center"
          style={{ backgroundColor: theme.accentBg, border: `1.5px solid ${theme.accentMid}` }}
        >
          <p className="text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: theme.accent }}>
            Можливий виграш
          </p>
          <p className="text-3xl font-bold tracking-tight" style={{ color: theme.accent }}>
            <BlurReveal isPending={isPending}>
              +{((bet.odds - 1) * displayAmount).toFixed(2)} {currencySymbol}
            </BlurReveal>
          </p>
        </div>
      )}

      {/* Total Amount — same size as Profit block */}
      {!isLoss && (
        <div 
          className="p-5 rounded-2xl text-center bg-white"
          style={{ border: '1px solid #E5E7EB' }}
        >
          <p className="text-[11px] font-semibold mb-1.5 uppercase tracking-wider text-[#9CA3AF]">
            Загальна сума
          </p>
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