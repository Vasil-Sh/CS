import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Zap, Trophy, Target, TrendingUp, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import type { Bet } from '@/types/betting';

interface ParsedEvent {
  number: string;
  match: string;
  betType: string;
  selection: string;
  odds: string;
}

interface ExpressDetailsModalProps {
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

export default function ExpressDetailsModal({ bet, open, onClose, parsedEvents }: ExpressDetailsModalProps) {
  const [copied, setCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      checkAdminStatus();
    }
  }, [users]);

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
          const isAdminStr = matches[6]?.replace(/"/g, '').trim().toLowerCase(); // 7th column (index 6)
          
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
  const isPending = bet.result === 'Pending';
  const isWin = bet.result === 'Win';
  const isLoss = bet.result === 'Loss';

  const getStatusText = () => {
    if (isWin) return 'Виграш';
    if (isLoss) return 'Програш';
    return 'Очікується';
  };

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
    
    let text = '🔥 ЕКСПРЕС-ПРОГНОЗ 🔥\n\n';
    text += '📊 Загальна інформація:\n';
    text += `• Кількість подій: ${parsedEvents.length}\n`;
    text += `• Загальний коефіцієнт: ${totalOdds.toFixed(2)}\n`;
    text += `• Сума прогнозу: ${amount}${currencySymbol}\n`;
    text += `• Можливий виграш: ${potentialWin}${currencySymbol}\n\n`;
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

  const telegramText = generateTelegramText();

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(telegramText);
      setCopied(true);
      toast.success('Текст скопійовано в буфер обміну!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Помилка при копіюванні');
      console.error('Copy error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50 border-0 shadow-2xl rounded-3xl">
        {/* Header */}
        <DialogHeader className="border-b border-gray-200 pb-5">
          <DialogTitle>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-gray-900">Експрес-ставка</h2>
                    <Badge className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 font-semibold text-xs px-3 py-1 shadow-md">
                      {parsedEvents.length}×
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500 font-medium">Коеф: <span className="font-bold text-green-600">{totalOdds.toFixed(2)}</span></span>
                    <span className="text-gray-500 font-medium">Дата: <span className="font-semibold text-gray-900">{bet.date}</span></span>
                  </div>
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Telegram Text Section - Only for Admin */}
        {isAdmin && (
          <div className="space-y-3 border-b border-gray-200 pb-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Текст для Telegram</h3>
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
              value={telegramText}
              onChange={(e) => {}}
              className="min-h-[250px] font-mono text-sm bg-gray-50 border-2 border-gray-300 rounded-2xl p-4 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 italic">
              💡 Ви можете відредагувати текст перед копіюванням. {!bet.matchUrl && 'Не забудьте замінити "[Вставте посилання]" на реальні посилання на матчі'}
            </p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 py-2">
          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-gray-50 rounded-lg">
                <Target className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-xs font-semibold text-gray-600">Сума прогнозу</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {bet.currency === 'USD' ? '$' : '₴'}{bet.originalAmount || bet.amount}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-xs font-semibold text-gray-700">Можливий виграш</span>
            </div>
            <p className="text-xl font-bold text-green-600">
              {bet.currency === 'USD' ? '$' : '₴'}{((bet.originalAmount || bet.amount) * totalOdds).toFixed(2)}
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-gray-50 rounded-lg">
                <Trophy className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-xs font-semibold text-gray-600">Статус</span>
            </div>
            <Badge 
              className={`rounded-full border-0 font-semibold text-sm px-3 py-1 ${
                isWin ? 'bg-green-100 text-green-700' :
                isLoss ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}
            >
              {getStatusText()}
            </Badge>
          </div>
        </div>

        {/* Events Section */}
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Події експресу</h3>
            <Badge className="rounded-full bg-gray-100 text-gray-700 border-0 font-semibold text-xs px-2.5 py-0.5">
              {parsedEvents.length} подій
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {parsedEvents.map((event, idx) => (
              <div 
                key={idx} 
                className="p-4 bg-white rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
              >
                {/* Event Number & Odds */}
                <div className="flex items-center justify-between mb-3">
                  <Badge className="rounded-full bg-gray-900 text-white border-0 text-xs px-2.5 py-1 font-semibold">
                    #{event.number}
                  </Badge>
                  <Badge className="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-sm px-2.5 py-1 font-bold">
                    {parseFloat(event.odds).toFixed(2)}
                  </Badge>
                </div>

                {/* Match Name */}
                <div className="mb-3 p-2.5 bg-gray-50 rounded-xl">
                  <h4 className="font-bold text-gray-900 text-sm leading-tight break-words">
                    {event.match}
                  </h4>
                </div>

                {/* Bet Type */}
                <div className="mb-3">
                  <p className="text-gray-500 text-xs font-medium mb-1.5">
                    Тип прогнозу
                  </p>
                  <Badge className="rounded-full bg-blue-100 text-blue-700 border-0 text-xs px-2.5 py-1 font-semibold">
                    {event.betType}
                  </Badge>
                </div>

                {/* Selection */}
                <div>
                  <p className="text-gray-500 text-xs font-medium mb-1.5">
                    Вибір
                  </p>
                  <p className="font-semibold text-gray-900 text-xs break-words bg-gray-50 p-2 rounded-lg" title={event.selection}>
                    {event.selection}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <Zap className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Формат</p>
                <p className="text-sm font-bold text-gray-900">{bet.format}</p>
              </div>
            </div>
            {bet.goalId && (
              <div className="text-right">
                <p className="text-xs font-medium text-gray-500 mb-1">Ціль</p>
                <Badge className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 text-xs px-3 py-1 font-semibold">
                  {bet.goalId}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}