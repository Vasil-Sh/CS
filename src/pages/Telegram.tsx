import { useAuth } from '@/contexts/AuthContext';
import TelegramGroups from '@/components/analytics/TelegramGroups';
import { logRender } from '@/lib/devLogger';
import { PageHeader } from '@/components/PageHeader';

export default function Telegram() {
  logRender('Telegram');
  const { user } = useAuth();
  const currentUser = user?.username || 'User';

  return (
    <div className="min-h-screen bg-gray-100 relative flex flex-col">
      {/* ===== HEADER ===== */}
      <PageHeader
        title="Telegram"
        currentUser={currentUser}
        isDarkTheme={false}
        onToggleTheme={() => {}}
        showThemeToggle={false}
      />

      {/* ===== CONTENT ===== */}
      <div className="relative z-10 px-6 lg:px-8 pb-8 pt-4 flex-1 flex flex-col">
        <TelegramGroups />
      </div>
    </div>
  );
}
