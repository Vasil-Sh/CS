import { type ReactNode } from 'react';
import { User, Sun, Moon, MoreHorizontal } from 'lucide-react';

export interface PageHeaderProps {
  /** Page title (e.g., "Аналітика", "Матчі") */
  title: string;
  /** Current username */
  currentUser: string;
  /** Show theme toggle (Sun/Moon buttons). Default true. */
  showThemeToggle?: boolean;
  /** Current dark theme state */
  isDarkTheme: boolean;
  /** Theme toggle callback */
  onToggleTheme: () => void;
  /** Show ⋮ actions menu. Default false. */
  showActionsMenu?: boolean;
  /** Whether the actions menu dropdown is open */
  actionsMenuOpen?: boolean;
  /** Callback to toggle the actions menu */
  onToggleActionsMenu?: () => void;
  /** Custom content for the actions dropdown */
  actionsMenuContent?: ReactNode;
}

/**
 * Shared page header used across Analytics, Matches, MyBets, Strategy, Admin, Telegram pages.
 * Eliminates 6 nearly-identical copy-pasted header blocks.
 */
export function PageHeader({
  title,
  currentUser,
  showThemeToggle = true,
  isDarkTheme,
  onToggleTheme,
  showActionsMenu = false,
  actionsMenuOpen = false,
  onToggleActionsMenu,
  actionsMenuContent,
}: PageHeaderProps) {
  return (
    <div className="px-6 lg:px-8 pt-6 pb-2">
      <div className="flex items-center justify-between">
        <h1 className="text-[48px] font-semibold text-[#111827] leading-tight tracking-tight">
          {title}
        </h1>

        <div className="flex items-center gap-3">
          {/* Actions menu (⋮) — conditional */}
          {showActionsMenu && onToggleActionsMenu && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleActionsMenu();
                }}
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-black/5 transition-colors duration-200"
                title="Дії"
              >
                <MoreHorizontal className="h-5 w-5 text-[#6B7280]" strokeWidth={1.5} />
              </button>

              {actionsMenuOpen && actionsMenuContent}
            </div>
          )}

          {/* Theme toggle — conditional */}
          {showThemeToggle && (
            <div className="flex items-center gap-1 p-1 rounded-full bg-black/5">
              <button
                onClick={() => { if (isDarkTheme) onToggleTheme(); }}
                className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                  !isDarkTheme ? 'bg-white shadow-sm' : 'hover:bg-black/5'
                }`}
                title="Світла тема"
              >
                <Sun className={`h-4 w-4 ${!isDarkTheme ? 'text-[#2563EB]' : 'text-[#9CA3AF]'}`} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => { if (!isDarkTheme) onToggleTheme(); }}
                className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                  isDarkTheme ? 'bg-white shadow-sm' : 'hover:bg-black/5'
                }`}
                title="Темна тема"
              >
                <Moon className={`h-4 w-4 ${isDarkTheme ? 'text-[#2563EB]' : 'text-[#9CA3AF]'}`} strokeWidth={1.5} />
              </button>
            </div>
          )}

          <div className="w-px h-8 bg-[#D1D5DB]" />

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111827]">
              <User className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-[#111827] leading-tight">
                {currentUser || 'User'}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded px-1.5 py-0.5 leading-tight mt-0.5">
                Активний
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
