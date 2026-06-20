import TelegramGroups from '@/components/analytics/TelegramGroups';
import { logRender } from '@/lib/devLogger';

export default function Telegram() {
  logRender('Telegram');
  return (
    <div className="min-h-screen bg-[#f3f3f3] relative">
      <div className="px-6 lg:px-8 pt-6 pb-2">
        <h1 className="text-[48px] font-semibold text-[#111827] leading-tight tracking-tight">
          Telegram
        </h1>
      </div>
      <div className="relative z-10 space-y-8 px-6 lg:px-8 pb-8 pt-4">
        <TelegramGroups />
      </div>
    </div>
  );
}
