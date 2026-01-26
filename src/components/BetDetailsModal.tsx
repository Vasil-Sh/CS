import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Target, TrendingUp, Trophy, Calendar, DollarSign, Copy, Check, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
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

export default function BetDetailsModal({ bet, open, onClose }: BetDetailsModalProps) {
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
      
      // Parse CSV - columns: Telegram, UserName, Password, PriceMonth, StartDate, EdnDate, isAdmin (7th column)
      const rows = text.split('\n').slice(1); // Skip header
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
    
    console.log('Admin check:', {
      currentUser,
      foundUser: user,
      isAdmin: user?.isAdmin || false
    });
    
    setIsAdmin(user?.isAdmin || false);
  };

  if (!bet) return null;

  const isPending = bet.result === 'Pending';
  const isWin = bet.result === 'Win';
  const isLoss = bet.result === 'Loss';
  const currencySymbol = bet.currency === 'USD' ? '$' : '₴';
  const displayAmount = bet.originalAmount || bet.amount;
  const displayProfit = bet.originalProfit !== undefined ? bet.originalProfit : bet.profit;

  const getStatusText = () => {
    if (isWin) return 'Виграш';
    if (isLoss) return 'Програш';
    return 'Очікується';
  };

  const generateTelegramText = () => {
    const matchName = bet.match || `${bet.team1} vs ${bet.team2}`;
    
    let text = `🚨 Прогноз на матч: ${matchName}\n\n`;
    text += `📊 Тип прогнозу: ${bet.betType}\n`;
    
    if (bet.selection) {
      text += `🎯 Вибір: ${bet.selection}\n`;
    }
    
    text += `💰 Коефіцієнт: ${bet.odds.toFixed(2)}\n`;
    text += `💵 Сума: ${displayAmount}${currencySymbol}\n\n`;
    
    // Add match link - use actual matchUrl if available
    const matchUrl = bet.matchUrl || '';
    if (matchUrl) {
      text += `🎯 Посилання на гру: ${matchUrl}\n\n`;
    } else {
      text += `🎯 Посилання на гру: [Вставте посилання на HLTV]\n\n`;
    }
    
    text += `🔔 Підписуйся на перевірену аналітику - @cs2beet`;

    return text;
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
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50 border-0 shadow-2xl rounded-3xl">
        {/* Header */}
        <DialogHeader className="border-b border-gray-200 pb-5">
          <DialogTitle>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Деталі прогнозу</h2>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">{bet.date}</p>
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
              className="min-h-[200px] font-mono text-sm bg-gray-50 border-2 border-gray-300 rounded-2xl p-4 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 italic">
              💡 Ви можете відредагувати текст перед копіюванням. {!bet.matchUrl && 'Не забудьте замінити "[Вставте посилання на HLTV]" на реальне посилання на матч'}
            </p>
          </div>
        )}

        {/* Match Info */}
        <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {bet.match || `${bet.team1} vs ${bet.team2}`}
          </h3>
          <div className="flex items-center gap-2">
            <Badge className="rounded-full bg-blue-100 text-blue-700 border-0 text-sm px-3 py-1 font-semibold">
              {bet.betType}
            </Badge>
            <Badge className="rounded-full bg-purple-100 text-purple-700 border-0 text-sm px-3 py-1 font-semibold">
              {bet.format}
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Amount */}
          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-gray-50 rounded-lg">
                <DollarSign className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-xs font-semibold text-gray-600">Сума прогнозу</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {currencySymbol}{displayAmount}
            </p>
            {bet.currency === 'USD' && bet.exchangeRate && (
              <p className="text-sm text-gray-500 mt-1">
                ≈ ₴{(displayAmount * bet.exchangeRate).toFixed(2)}
              </p>
            )}
          </div>

          {/* Odds */}
          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-gray-50 rounded-lg">
                <Zap className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-xs font-semibold text-gray-600">Коефіцієнт</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {bet.odds.toFixed(2)}
            </p>
          </div>

          {/* Potential Win */}
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-xs font-semibold text-gray-700">Можливий виграш</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {currencySymbol}{(displayAmount * bet.odds).toFixed(2)}
            </p>
            {bet.currency === 'USD' && bet.exchangeRate && (
              <p className="text-sm text-gray-600 mt-1">
                ≈ ₴{(displayAmount * bet.odds * bet.exchangeRate).toFixed(2)}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-gray-50 rounded-lg">
                <Trophy className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-xs font-semibold text-gray-600">Статус</span>
            </div>
            <Badge 
              className={`rounded-full border-0 font-semibold text-base px-4 py-1.5 ${
                isWin ? 'bg-green-100 text-green-700' :
                isLoss ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}
            >
              {getStatusText()}
            </Badge>
          </div>
        </div>

        {/* Profit Section - Only if bet is completed */}
        {!isPending && displayProfit !== undefined && displayProfit !== null && (
          <div className={`p-5 rounded-2xl border-2 ${
            displayProfit >= 0 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
              : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300'
          }`}>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Результат</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Профіт:</span>
                <span className={`text-xl font-bold ${displayProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {displayProfit >= 0 ? '+' : ''}{displayProfit.toFixed(2)} {currencySymbol}
                </span>
              </div>
              {bet.currency === 'USD' && bet.profit !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Профіт (UAH):</span>
                  <span className={`text-lg font-bold ${bet.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {bet.profit >= 0 ? '+' : ''}{bet.profit.toFixed(2)} ₴
                  </span>
                </div>
              )}
              {bet.roi !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">ROI:</span>
                  <span className={`text-lg font-bold ${bet.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {bet.roi >= 0 ? '+' : ''}{bet.roi.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-semibold text-gray-600">Дата створення</span>
            </div>
            <p className="text-sm font-bold text-gray-900">{bet.date}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-semibold text-gray-600">Валюта</span>
            </div>
            <Badge className="rounded-full bg-cyan-100 text-cyan-700 border-0 font-bold text-sm px-3 py-1">
              {bet.currency || 'UAH'}
            </Badge>
          </div>
        </div>

        {/* Goal Info */}
        {bet.goalId && (
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-gray-600">Пов'язана ціль</p>
                <p className="text-sm font-bold text-gray-900">{bet.goalId}</p>
              </div>
            </div>
          </div>
        )}

        {/* Exchange Rate Info */}
        {bet.currency === 'USD' && bet.exchangeRate && (
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Курс обміну USD → UAH:</span>
              <span className="text-base font-bold text-gray-900">{bet.exchangeRate} ₴</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}