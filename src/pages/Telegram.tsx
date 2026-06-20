import { useAuth } from '@/contexts/AuthContext';
import { User } from 'lucide-react';
import TelegramGroups from '@/components/analytics/TelegramGroups';
import { logRender } from '@/lib/devLogger';

export default function Telegram() {
  logRender('Telegram');
  const { user } = useAuth();
  const currentUser = user?.username || 'User';

  return (
    <div className="min-h-screen bg-[#f3f3f3] relative">
      {/* ===== HEADER ===== */}
      <div className="px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-[48px] font-semibold text-[#111827] leading-tight tracking-tight">
            Telegram
          </h1>
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111827]">
              <User className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-[#111827] leading-tight">
                {currentUser}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded px-1.5 py-0.5 leading-tight mt-0.5">
                Активний
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="relative z-10 px-6 lg:px-8 pb-8 pt-4">
        <TelegramGroups />
      </div>
    </div>
  );
}
