import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import type { Bet } from '@/types/betting';

interface ParsedEvent {
  number: string;
  match: string;
  betType: string;
  selection: string;
  odds: string;
}

interface ExpressTelegramModalProps {
  bet: Bet | null;
  open: boolean;
  onClose: () => void;
  parsedEvents: ParsedEvent[];
}

interface User {
  telegram: string;
  username: string;
  isAdmin?: boolean;
}

export default function ExpressTelegramModal({ bet, open, onClose, parsedEvents }: ExpressTelegramModalProps) {
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
    if (bet && parsedEvents.length > 0) {
      setEditableText(generateTelegramText());
    }
  }, [bet, parsedEvents]);

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

  const totalOdds = parsedEvents.reduce((acc, event) => acc * parseFloat(event.odds), 1);

  const getNumberEmoji = (num: string) => {
    const emojiMap: Record<string, string> = {
      '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', '4': '4️⃣', '5': '5️⃣',
      '6': '6️⃣', '7': '7️⃣', '8': '8️⃣', '9': '9️⃣', '10': '🔟'
    };
    return emojiMap[num] || `${num}.`;
  };

  const generateTelegramText = () => {
    const currencySymbol = bet.currency === 'USD' ? '$' : '₴';
    const amount = bet.originalAmount || bet.amount;
    const potentialWin = (amount * totalOdds).toFixed(2);
    const winProbability = bet.winProbability || 65;
    
    let text = '🔥 ЕКСПРЕС-ПРОГНОЗ 🔥\n\n';
    text += '📊 Загальна інформація:\n';
    text += `• Кількість подій: ${parsedEvents.length}\n`;
    text += `• Загальний коефіцієнт: ${totalOdds.toFixed(2)}\n`;
    text += `• Сума прогнозу: ${amount}${currencySymbol}\n`;
    text += `• Можливий виграш: ${potentialWin}${currencySymbol}\n`;
    text += `• Імовірність виграшу: ${winProbability}%\n\n`;
    text += '⚡ Події:\n\n';
    
    parsedEvents.forEach((event) => {
      text += `${getNumberEmoji(event.number)} ${event.match}\n`;
      text += `   Тип: ${event.betType}\n`;
      text += `   Вибір: ${event.selection}\n`;
      text += `   Коефіцієнт: ${parseFloat(event.odds).toFixed(2)}\n\n`;
    });

    const matchUrl = bet.matchUrl || '';
    if (matchUrl) {
      text += `🎯 Посилання на матчі: ${matchUrl}\n\n`;
    } else {
      text += `🎯 Посилання на матчі: [Вставте посилання]\n\n`;
    }
    
    text += `🔔 Підписуйся на перевірену аналітику - @cs2beet`;

    return text.trim();
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50 border-0 shadow-2xl rounded-3xl">
        <DialogHeader className="border-b border-gray-200 pb-5">
          <DialogTitle>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Текст для Telegram (Експрес)</h2>
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
            className="min-h-[450px] font-mono text-sm bg-gray-50 border-2 border-gray-300 rounded-2xl p-4 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 italic">
            💡 Ви можете відредагувати текст перед копіюванням. {!bet.matchUrl && 'Не забудьте замінити "[Вставте посилання]" на реальні посилання на матчі'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}