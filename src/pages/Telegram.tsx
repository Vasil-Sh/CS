import { useMemo } from "react";
import { useAuth } from '@/contexts/AuthContext';
import TelegramGroups from '@/components/analytics/TelegramGroups';
import { UserDataService } from '@/lib/userDataService';
import { logRender } from '@/lib/devLogger';
import { PageHeader } from '@/components/PageHeader';
import { MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface TgGroup { id?: string; name?: string }
interface TgBet { id?: string; groupId?: string; date?: string; createdAt?: number; result?: string; amount?: number; odds?: number; profit?: number }

export default function Telegram() {
  logRender('Telegram');
  const { user } = useAuth();
  const currentUser = user?.username || 'User';

  const tgStats = useMemo(() => {
    const groups = UserDataService.getUserData<TgGroup[]>(currentUser, 'tg_groups', []);
    const bets = UserDataService.getUserData<TgBet[]>(currentUser, 'tg_bets', []);
    const lastSend = bets.length > 0 ? [...bets].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0] : null;
    return {
      groupsCount: groups.length,
      betsCount: bets.length,
      wins: bets.filter((b) => b.result === 'Win').length,
      losses: bets.filter((b) => b.result === 'Loss').length,
      lastSent: lastSend ? new Date(lastSend.date || lastSend.createdAt).toLocaleDateString('uk-UA') : null,
    };
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-gray-100 relative flex flex-col">
      <PageHeader
        title="Telegram"
        currentUser={currentUser}
        isDarkTheme={false}
        onToggleTheme={() => {}}
        showThemeToggle={false}
      />

      <div className="relative z-10 px-6 lg:px-8 pb-8 pt-4 flex-1 flex flex-col">
        {tgStats.groupsCount > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-blue-500" strokeWidth={1.5} />
                <span className="text-xs text-gray-400">Груп</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{tgStats.groupsCount}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Send className="h-4 w-4 text-blue-500" strokeWidth={1.5} />
                <span className="text-xs text-gray-400">Ставок</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{tgStats.betsCount}</div>
              {tgStats.lastSent && <div className="text-[10px] text-gray-400 mt-1">Остання: {tgStats.lastSent}</div>}
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
                <span className="text-xs text-gray-400">Виграші</span>
              </div>
              <div className="text-2xl font-bold text-emerald-600">{tgStats.wins}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-400" strokeWidth={1.5} />
                <span className="text-xs text-gray-400">Програші</span>
              </div>
              <div className="text-2xl font-bold text-red-500">{tgStats.losses}</div>
            </div>
          </div>
        )}
        <TelegramGroups />
      </div>
    </div>
  );
}
