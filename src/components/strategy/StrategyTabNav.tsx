import { TooltipProvider, Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Filter, Info, Eye, BarChart3 } from 'lucide-react';

interface Props {
  activeTab: string;
  showFilters: boolean;
  onTabChange: (tab: string) => void;
  onFilterToggle: () => void;
}

const tabs = [
  { id: 'overview', label: 'Огляд стратегій', icon: Eye },
  { id: 'performance', label: 'Ефективність', icon: BarChart3 },
] as const;

/** Pure component: tab navigation + filter + info tooltip */
export default function StrategyTabNav({ activeTab, showFilters, onTabChange, onFilterToggle }: Props) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm border-2 border-[#E8E6DC] p-3 rounded-[32px] flex-wrap justify-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger asChild>
              <button className="flex items-center justify-center px-3.5 py-4 rounded-[24px] bg-[#EFF6FF] text-[#3B82F6] hover:bg-[#DBEAFE] transition-colors">
                <Info className="h-4 w-4" strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start" className="max-w-xs bg-white border border-[#E5E7EB] rounded-2xl px-4 py-3 shadow-lg">
              <p className="text-sm font-semibold text-[#111827] mb-1">Стратегії</p>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Тут ви можете створювати та застосовувати стратегії ставок. Стратегія містить правила — які коефіцієнти, суми, формати матчів обирати.
              </p>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>

        <button
          onClick={onFilterToggle}
          className={`flex items-center justify-center px-3.5 py-4 rounded-[24px] transition-colors ${showFilters ? 'bg-[#447afc] text-white' : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]'}`}
          title="Фільтри"
        >
          <Filter className="h-4 w-4" strokeWidth={2} />
        </button>

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative px-6 py-4 text-base rounded-[24px] transition-all duration-300 ease-in-out flex items-center gap-2
                ${isActive ? 'bg-white text-[#111827] font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)]' : 'bg-transparent text-[#9CA3AF] hover:bg-[#F5F5F3] hover:text-[#6B7280] font-light'}`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
