import {
  TooltipProvider,
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Filter, Info, Eye, BarChart3, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface TabDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  activeTab: string;
  showFilters: boolean;
  onTabChange: (tab: string) => void;
  onFilterToggle: () => void;
  onCreateClick: () => void;
  /** Top-level tabs (e.g. Стратегії / Цілі) — prepended to the bar */
  topTabs?: TabDef[];
  topActiveTab?: string;
  onTopTabChange?: (id: string) => void;
}

const tabs = [
  { id: "overview", label: "Огляд стратегій", icon: Eye },
  { id: "performance", label: "Ефективність", icon: BarChart3 },
] as const;

/** Pure component: tab navigation + filter + info tooltip + create button. Optionally includes top-level page tabs. */
export default function StrategyTabNav({
  activeTab,
  showFilters,
  onTabChange,
  onFilterToggle,
  onCreateClick,
  topTabs,
  topActiveTab,
  onTopTabChange,
}: Props) {
  const hasTopTabs = !!(topTabs && topTabs.length && onTopTabChange);

  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm border-2 border-stone-200 p-3 rounded-[32px] flex-wrap justify-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        {/* Top-level tabs (Стратегії / Цілі) */}
        {hasTopTabs &&
          topTabs!.map((t) => {
            const isActive = topActiveTab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => onTopTabChange!(t.id)}
                className={`relative rounded-[24px] px-6 py-4 font-light text-base transition-all duration-300 ease-in-out flex items-center gap-2 ${
                  isActive
                    ? "bg-primary text-white font-medium shadow-[0_4px_16px_rgba(68,122,252,0.3)] border border-transparent"
                    : "bg-transparent text-gray-400 hover:bg-[#F5F5F3] hover:text-gray-500 border border-transparent"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                {t.label}
              </button>
            );
          })}

        {hasTopTabs && <div className="w-px h-7 bg-stone-200 mx-0.5" />}

        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger asChild>
              <button className="flex items-center justify-center px-3.5 py-4 rounded-[24px] bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">
                <Info className="h-4 w-4" strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="start"
              className="max-w-xs bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-lg"
            >
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Стратегії
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">
                Тут ви можете створювати та застосовувати стратегії ставок.
                Стратегія містить правила — які коефіцієнти, суми, формати
                матчів обирати.
              </p>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>

        <button
          onClick={onFilterToggle}
          className={`flex items-center justify-center px-3.5 py-4 rounded-[24px] transition-colors ${showFilters ? "bg-primary text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900"}`}
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
                ${isActive ? "bg-white text-gray-900 font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)]" : "bg-transparent text-gray-400 hover:bg-[#F5F5F3] hover:text-gray-500 font-light"}`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {tab.label}
            </button>
          );
        })}

        {/* Divider */}
        <div className="w-px h-7 bg-stone-200 mx-0.5" />

        {/* Create strategy button */}
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 px-6 py-4 text-base rounded-[24px] font-semibold bg-primary text-white hover:bg-blue-400 shadow-[0_2px_8px_rgba(68,122,252,0.3)] transition-all duration-300 ease-in-out"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Створити стратегію
        </button>
      </div>
    </div>
  );
}
