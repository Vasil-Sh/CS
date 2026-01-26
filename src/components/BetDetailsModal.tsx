import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import type { Bet } from '@/types/betting';

interface BetDetailsModalProps {
  bet: Bet | null;
  open: boolean;
  onClose: () => void;
}

interface User {
  telegram: string;
  username: string;
  isAdmin?: boolean;
}

interface ParsedEvent {
  number: string;
  match: string;
  betType: string;
  selection: string;
  odds: string;
}

export default function BetDetailsModal({ bet, open, onClose }: BetDetailsModalProps) {
  const [copied, setCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [editableText, setEditableText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      checkAdminStatus();
    }
  }, [users]);

  useEffect(() => {
    if (bet) {
      setEditableText(generateTelegramText());
    }
  }, [bet]);

  const fetchUsers = async () => {
    try {
      const SHEET_ID = '1IhAUYQKcPjXetOGxCu-_YXxrj_kXt0QxKJCcGqPzZdo';
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
      
      const response = await fetch(url);
      const text = await response.text();
      
      const rows = text.split('\n').slice(1);
      const parsedUsers: User[] = rows
        .filter(row => row.trim())
        .map(row => {
          const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (!matches || matches.length < 7) return null;
          
          const telegram = matches[0].replace(/"/g, '').trim();
          const username = matches[1].replace(/"/g, '').trim();
          const isAdminStr = matches[6]?.replace(/"/g, '').trim().toLowerCase();
          
          return {
            telegram,
            username,
            isAdmin: isAdminStr === 'true' || isAdminStr === '1' || isAdminStr === 'yes'
          };
        })
        .filter((user): user is User => user !== null);
      
      setUsers(parsedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const checkAdminStatus = () => {
    const currentUser = localStorage.getItem('currentUser') || '';
    const user = users.find(u => u.username === currentUser);
    setIsAdmin(user?.isAdmin || false);
  };

  if (!bet) return null;

  const currencySymbol = bet.currency === 'USD' ? '$' : '₴';
  const displayAmount = bet.originalAmount || bet.amount;
  
  const isExpressBet = bet.betType.includes('Експрес') || bet.format.includes('x');

  const parseExpressEvents = (betType: string): ParsedEvent[] => {
    if (!betType.includes('|')) return [];
    
    const fullString = betType.split('|').slice(1).join('|').trim();
    const eventStrings = fullString.split('•').map(e => e.trim());
    
    return eventStrings.map(eventStr => {
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
  };

  const generateTelegramText = () => {
    if (isExpressBet) {
      const parsedEvents = parseExpressEvents(bet.betType);
      const eventCount = parsedEvents.length;
      
      let text = `🚨 Експрес-прогноз (${eventCount} події)\n\n`;
      
      parsedEvents.forEach((event, index) => {
        text += `📌 Подія ${index + 1}:\n`;
        text += `⚽ Матч: ${event.match}\n`;
        text += `📊 Тип: ${event.betType}\n`;
        text += `🎯 Вибір: ${event.selection}\n`;
        text += `💰 Коефіцієнт: ${event.odds}\n\n`;
      });
      
      text += `💵 Загальний коефіцієнт: ${bet.odds.toFixed(2)}\n`;
      text += `💵 Сума: ${displayAmount}${currencySymbol}\n`;
      
      const potentialWin = displayAmount * bet.odds;
      text += `💎 Можливий виграш: ${potentialWin.toFixed(2)}${currencySymbol}\n\n`;
      
      text += `🔔 Підписуйся на перевірену аналітику - @cs2beet`;
      
      return text;
    } else {
      const matchName = bet.match || `${bet.team1} vs ${bet.team2}`;
      const winProbability = bet.winProbability || 65;
      
      let text = `🚨 Прогноз на матч: ${matchName}\n\n`;
      text += `📊 Тип прогнозу: ${bet.betType}\n`;
      
      if (bet.selection) {
        text += `🎯 Вибір: ${bet.selection}\n`;
      }
      
      text += `💰 Коефіцієнт: ${bet.odds.toFixed(2)}\n`;
      text += `💵 Сума: ${displayAmount}${currencySymbol}\n`;
      text += `📊 Імовірність виграшу: ${winProbability}%\n\n`;
      
      const matchUrl = bet.matchUrl || '';
      if (matchUrl) {
        text += `🎯 Посилання на гру: ${matchUrl}\n\n`;
      } else {
        text += `🎯 Посилання на гру: [Вставте посилання на HLTV]\n\n`;
      }
      
      text += `🔔 Підписуйся на перевірену аналітику - @cs2beet`;

      return text;
    }
  };

  const handleCopyToClipboard = () => {
    if (textareaRef.current) {
      textareaRef.current.select();
      textareaRef.current.setSelectionRange(0, 99999);
      
      try {
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(editableText).then(() => {
            setCopied(true);
            toast.success('Текст скопійовано в буфер обміну!');
            setTimeout(() => setCopied(false), 2000);
          }).catch(() => {
            fallbackCopy();
          });
        } else {
          fallbackCopy();
        }
      } catch (error) {
        fallbackCopy();
      }
    }
  };

  const fallbackCopy = () => {
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        toast.success('Текст скопійовано в буфер обміну!');
        setTimeout(() => setCopied(false), 2000);
      } else {
        toast.error('Помилка при копіюванні');
      }
    } catch (error) {
      toast.error('Помилка при копіюванні');
      console.error('Copy error:', error);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50 border-0 shadow-2xl rounded-3xl">
        <DialogHeader className="border-b border-gray-200 pb-5">
          <DialogTitle>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Текст для Telegram</h2>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Формат тексту</h3>
            <Button
              onClick={handleCopyToClipboard}
              size="sm"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Скопійовано
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Копіювати
                </>
              )}
            </Button>
          </div>
          <Textarea
            ref={textareaRef}
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            className="min-h-[350px] font-mono text-sm bg-gray-50 border-2 border-gray-300 rounded-2xl p-4 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 italic">
            💡 Ви можете відредагувати текст перед копіюванням. {!isExpressBet && !bet.matchUrl && 'Не забудьте замінити "[Вставте посилання на HLTV]" на реальне посилання на матч'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}