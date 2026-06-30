import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Info, RefreshCw, Plus, Target, Trophy,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
}

export interface GoalsToolbarProps {
  activeTab: string;
  isUpdating: boolean;
  activeGoalsCount: number;
  maxGoals: number;
  tabs: Tab[];
  onTabChange: (id: string) => void;
  onUpdate: () => void;
  onCreateGoal: () => void;
}

export default function GoalsToolbar({
  activeTab, isUpdating, activeGoalsCount, maxGoals,
  tabs, onTabChange, onUpdate, onCreateGoal,
}: GoalsToolbarProps) {
  return (
    <div className="flex justify-center relative z-50">
      <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm border-2 border-gray-200 p-3 rounded-[32px] flex-wrap justify-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        {/* Info tooltip */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex items-center justify-center px-3.5 py-4 rounded-[24px] bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">
                <Info className="h-4 w-4" strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start" className="max-w-xs rounded-2xl px-4 py-3 bg-white border border-gray-200 shadow-lg z-[9999]">
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-gray-900">Як працювати з цілями</p>
                <p className="text-sm text-gray-500">1. При додаванні запису оберіть ціль в полі &quot;Прив&apos;язати до цілі&quot;</p>
                <p className="text-sm text-gray-500">2. Після розрахунку ставки (Win/Loss) поверніться сюди</p>
                <p className="text-sm text-gray-500">3. Натисніть &quot;Оновити&quot; — прогрес оновиться автоматично</p>
                <p className="text-xs text-gray-400 mt-1 pt-1 border-t border-gray-100">⚠️ Максимум 3 активні цілі одночасно</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Tabs */}
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative px-6 py-4 text-base rounded-[24px] transition-all duration-300 ease-in-out flex items-center gap-2 ${
                isActive
                  ? 'bg-white text-gray-900 font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)]'
                  : 'bg-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-500 font-light'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {tab.label}
            </button>
          );
        })}

        {/* Divider */}
        <div className="w-px h-7 bg-gray-200 mx-0.5" />

        {/* Update button */}
        <button
          onClick={onUpdate}
          disabled={isUpdating}
          className="flex items-center gap-2 px-6 py-4 text-base rounded-[24px] font-semibold bg-red-500 text-white hover:bg-red-600 shadow-[0_2px_8px_rgba(239,68,68,0.3)] transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          Оновити
        </button>

        {/* Create goal button */}
        <button
          onClick={onCreateGoal}
          disabled={activeGoalsCount >= maxGoals}
          className="flex items-center gap-2 px-6 py-4 text-base rounded-[24px] font-semibold bg-blue-500 text-white hover:bg-blue-600 shadow-[0_2px_8px_rgba(68,122,252,0.3)] transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Створити ціль
        </button>
      </div>
    </div>
  );
}
