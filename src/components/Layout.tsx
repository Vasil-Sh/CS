import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/lib/i18n";
import { logRender } from "@/lib/devLogger";
import {
  BarChart3,
  Trophy,
  Plus,
  Menu,
  LogOut,
  User,
  TrendingUp,
  Target,
  MessageCircle,
  WifiOff,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  { nameKey: "nav.matches", href: "/app/matches", icon: Trophy },
  { nameKey: "nav.addRecord", href: "/app/my-bets", icon: Plus },
  { nameKey: "nav.analytics", href: "/app/analytics", icon: BarChart3 },
  { nameKey: "nav.strategies", href: "/app/strategy", icon: Target },
  { nameKey: "nav.riskyTeams", href: "/app/risky-teams", icon: AlertTriangle },
  { nameKey: "nav.telegram", href: "/app/telegram", icon: MessageCircle },
  { nameKey: "nav.profile", href: "/app/profile", icon: User },
];

// Nav items as module-level component (not re-created on every Layout render)
function NavItems({ location }: { location: string }) {
  return (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;

        return (
          <Link
            key={item.nameKey}
            to={item.href}
            className={cn(
              "group relative flex items-center gap-3 px-5 py-4 rounded-[24px] text-base font-medium transition-all duration-200",
              isActive
                ? "bg-primary text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.5} />
            <span>{t(item.nameKey)}</span>
          </Link>
        );
      })}
    </>
  );
}

export default function Layout() {
  logRender("Layout");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const username = user?.username ?? "";
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [location.pathname, navigate, isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      {/* Offline Banner */}
      {offline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-100 border-b border-amber-500 px-4 py-2 flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4 text-amber-600" strokeWidth={2} />
          <span className="text-sm font-medium text-amber-800">
            Ви в офлайн-режимі. Дані завантажуються локально.
          </span>
        </div>
      )}
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-80 lg:flex-col">
        <div className="flex grow flex-col gap-y-6 overflow-y-auto bg-white px-8 py-8 border-r border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          {/* Logo Header */}
          <div className="flex h-24 shrink-0 items-center gap-4">
            <div className="w-16 h-16 bg-[#1a1a2e] rounded-[28px] flex items-center justify-center shadow-[0_8px_24px_rgba(26,26,46,0.3)]">
              <TrendingUp className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-black">
              MatchIQ
            </h1>
          </div>

          {/* Divider line under MatchIQ — full width */}
          <div className="-mx-8 border-t border-gray-200" />

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-8">
              <li>
                <ul role="list" className="space-y-2">
                  <NavItems location={location.pathname} />
                </ul>
              </li>
              <li className="mt-auto space-y-3">
                <div className="w-full flex flex-col items-center gap-3 px-5 py-5 bg-blue-50 rounded-[24px] border border-blue-100">
                  <span className="text-base font-semibold text-gray-900">
                    Потрібна допомога?
                  </span>
                  <p className="text-xs text-gray-900 text-center">
                    Є питання або пропозиції? Напиши нам в Telegram
                  </p>
                  <a
                    href="https://t.me/cs2beet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary rounded-[16px] text-white font-semibold text-sm transition-all duration-200 hover:bg-primary-hover hover:shadow-md"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                    <span>{t("app.writeUs")}</span>
                  </a>
                </div>
                <button
                  onClick={handleLogout}
                  aria-label={t("app.logout")}
                  className="w-full flex items-center justify-start gap-3 px-5 py-4 text-red-600 bg-transparent border border-red-300 rounded-[24px] font-normal text-base transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-md"
                >
                  <LogOut className="h-5 w-5" strokeWidth={1.5} />
                  <span>{t("app.logout")}</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-white px-6 py-5 border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#1a1a2e] rounded-[20px] flex items-center justify-center shadow-[0_4px_12px_rgba(26,26,46,0.2)]">
              <TrendingUp className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-black">
              MatchIQ
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-[16px]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <User className="h-4 w-4 text-white" strokeWidth={1.5} />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[#1a1a2e] truncate max-w-[120px]">
                  @{username || "User"}
                  {isAdmin && <span className="ml-1">👑</span>}
                </p>
              </div>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Відкрити меню"
                  className="rounded-[20px] border border-gray-200 hover:bg-gray-50 w-12 h-12"
                >
                  <Menu className="h-6 w-6" strokeWidth={1.5} />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-80 bg-white border-r border-gray-200"
              >
                <div className="flex h-20 items-center gap-4">
                  <div className="w-14 h-14 bg-[#1a1a2e] rounded-[24px] flex items-center justify-center shadow-[0_4px_12px_rgba(26,26,46,0.2)]">
                    <TrendingUp
                      className="w-7 h-7 text-white"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h1 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">
                    MatchIQ
                  </h1>
                </div>

                {/* Divider line under MatchIQ mobile — full width */}
                <div className="-mx-6 border-t border-gray-200 mt-2" />

                <nav className="mt-8">
                  <ul className="space-y-2">
                    <NavItems location={location.pathname} />
                  </ul>
                  <div className="mt-8 space-y-3">
                    <div className="w-full flex flex-col items-center gap-3 px-5 py-5 bg-blue-50 rounded-[24px] border border-blue-100">
                      <span className="text-base font-semibold text-gray-900">
                        {t("app.help")}
                      </span>
                      <p className="text-xs text-gray-900 text-center">
                        {t("app.helpDesc")}
                      </p>
                      <a
                        href="https://t.me/cs2beet"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary rounded-[16px] text-white font-semibold text-sm transition-all duration-200 hover:bg-primary-hover hover:shadow-md"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                        </svg>
                        <span>{t("app.writeUs")}</span>
                      </a>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-start gap-3 px-5 py-4 text-red-600 bg-transparent border border-red-300 rounded-[24px] font-normal text-base transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-md"
                    >
                      <LogOut className="h-5 w-5" strokeWidth={1.5} />
                      <span>{t("app.logout")}</span>
                    </button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main Content - constrained width for better visual density */}
      <main className="lg:pl-80">
        <div className="w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
