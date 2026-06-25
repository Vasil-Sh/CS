import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Search, Info, RefreshCw, Trash2, Plus, RotateCcw,
} from 'lucide-react';

interface RiskToolbarProps {
  isUpdating: boolean;
  searchQuery: string;
  isSearchOpen: boolean;
  riskyTeamsCount: number;
  customSheetUrl: string;
  onInfoClick: () => void;
  onSearchToggle: () => void;
  onDeleteAll: () => void;
  onGoogleSheetsSync: () => void;
  onAddNew: () => void;
  onCustomSheetUrlChange: (url: string) => void;
  onSearchQueryChange: (q: string) => void;
  onSearchClose: () => void;
}

export default function RiskToolbar({
  isUpdating, searchQuery, isSearchOpen, riskyTeamsCount,
  customSheetUrl, onInfoClick, onSearchToggle, onDeleteAll,
  onGoogleSheetsSync, onAddNew, onCustomSheetUrlChange,
  onSearchQueryChange, onSearchClose,
}: RiskToolbarProps) {
  return (
    <>
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm border-2 border-gray-200 p-3 rounded-[32px] flex-wrap justify-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          {/* Info tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onInfoClick}
                className="flex items-center justify-center px-3.5 py-4 rounded-[24px] bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
                aria-label="Інформація про управління ризиками"
              >
                <Info className="h-4 w-4" strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start" className="max-w-xs bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-lg">
              <p className="text-sm font-semibold text-gray-900 mb-1">Управління ризиками</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                Тут ви можете вести список команд, на які не варто ставити або потрібно бути обережним.
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Search toggle */}
          <button
            onClick={onSearchToggle}
            className={`flex items-center gap-1.5 px-3.5 py-4 rounded-[24px] transition-colors text-sm font-medium ${
              isSearchOpen ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Search className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">Пошук</span>
          </button>

          {/* Delete all */}
          {riskyTeamsCount > 0 && (
            <button
              onClick={onDeleteAll}
              className="flex items-center gap-1.5 px-3.5 py-4 rounded-[24px] bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">Видалити все</span>
            </button>
          )}

          {/* Google Sheets sync */}
          <button
            onClick={onGoogleSheetsSync}
            disabled={isUpdating}
            className="flex items-center gap-1.5 px-3.5 py-4 rounded-[24px] bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isUpdating ? (
              <RefreshCw className="h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <RotateCcw className="h-4 w-4" strokeWidth={2} />
            )}
            <span className="hidden sm:inline">{isUpdating ? 'Завантаження...' : 'Google Sheets'}</span>
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200 hidden sm:block" />

          {/* Add new */}
          <button
            onClick={onAddNew}
            className="flex items-center gap-1.5 px-4 py-4 rounded-[24px] bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            <span>Додати команду</span>
          </button>
        </div>
      </div>

      {/* Inline search input */}
      {isSearchOpen && (
        <div className="flex justify-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" strokeWidth={2} />
            <input
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Пошук команд..."
              className="w-full pl-9 pr-8 py-3 rounded-2xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-0 transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Очистити пошук"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
