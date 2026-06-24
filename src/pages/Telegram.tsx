import { useState } from 'react';
import { Plus, Info, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import TelegramGroups from '@/components/analytics/TelegramGroups';
import { logRender } from '@/lib/devLogger';
import { PageHeader } from '@/components/PageHeader';

const toolbarBtnBase = 'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB] hover:bg-[#E5E7EB] hover:text-[#111827]';

export default function Telegram() {
  logRender('Telegram');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const { user } = useAuth();
  const currentUser = user?.username || 'User';

  return (
    <div className="min-h-screen bg-[#f3f3f3] relative flex flex-col">
      {/* ===== HEADER ===== */}
      <PageHeader
        title="Telegram"
        currentUser={currentUser}
        isDarkTheme={false}
        onToggleTheme={() => {}}
        showThemeToggle={false}
      />

      {/* ===== TOOLBAR ===== */}
      <div className="px-6 lg:px-8 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTool(activeTool === 'add' ? null : 'add')}
            className={`${toolbarBtnBase} ${activeTool === 'add' ? 'bg-[#111827] text-white border-[#111827] hover:bg-[#1F2937] hover:text-white' : ''}`}
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Додати групу
          </button>
          <button
            onClick={() => setActiveTool(activeTool === 'info' ? null : 'info')}
            className={`${toolbarBtnBase} ${activeTool === 'info' ? 'bg-[#111827] text-white border-[#111827] hover:bg-[#1F2937] hover:text-white' : ''}`}
          >
            <Info className="h-4 w-4" strokeWidth={2} />
            Інфо
          </button>
          <button
            onClick={() => setActiveTool(activeTool === 'filter' ? null : 'filter')}
            className={`${toolbarBtnBase} ${activeTool === 'filter' ? 'bg-[#111827] text-white border-[#111827] hover:bg-[#1F2937] hover:text-white' : ''}`}
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
            Фільтр
          </button>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="relative z-10 px-6 lg:px-8 pb-8 pt-0 flex-1 flex flex-col">
        <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex-1">
        <TelegramGroups />
        </div>
      </div>
    </div>
  );
}