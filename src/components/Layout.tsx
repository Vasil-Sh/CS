import { ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  Trophy, 
  Wallet,
  Menu,
  LogOut,
  User,
  Shield,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Аналітика', href: '/analytics', icon: BarChart3 },
  { name: 'Матчі', href: '/matches', icon: Trophy },
  { name: 'Журнал прогнозів', href: '/my-bets', icon: Wallet },
];

const adminNavigation = [
  { name: 'Адмін панель', href: '/admin', icon: Shield, adminOnly: true },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      navigate('/login');
    }
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const NavItems = () => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'ios-liquid-button group relative flex items-center gap-3 px-5 py-3.5 rounded-[18px] text-sm font-semibold transition-all duration-500 overflow-hidden',
              isActive
                ? 'bg-gradient-to-br from-black via-gray-900 to-black text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] scale-[0.98]'
                : 'bg-gradient-to-br from-gray-50 to-white text-gray-700 hover:text-black hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:scale-[1.02] border border-gray-200/50'
            )}
          >
            {/* iOS-style inner shadow for depth */}
            <div className={cn(
              "absolute inset-0 rounded-[18px] transition-opacity duration-500",
              isActive 
                ? "shadow-[inset_0_2px_8px_rgba(255,255,255,0.1),inset_0_-2px_8px_rgba(0,0,0,0.3)]"
                : "shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-1px_2px_rgba(0,0,0,0.05)]"
            )} />
            
            {/* Liquid shine effect - iOS style */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1500ms] ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-[18px]" />
            
            {/* Subtle glow on hover */}
            {!isActive && (
              <div className="absolute inset-0 rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/40 via-transparent to-white/20" />
            )}
            
            {/* Active state glow */}
            {isActive && (
              <div className="absolute -inset-1 bg-gradient-to-br from-gray-600/30 via-black/20 to-gray-600/30 rounded-[20px] blur-xl opacity-60 animate-pulse" />
            )}
            
            <Icon className={cn(
              "h-5 w-5 relative z-10 transition-transform duration-500",
              isActive && "drop-shadow-[0_2px_4px_rgba(255,255,255,0.3)]",
              "group-hover:scale-110"
            )} />
            <span className={cn(
              "relative z-10 transition-all duration-500",
              isActive && "drop-shadow-[0_1px_2px_rgba(255,255,255,0.2)]"
            )}>{item.name}</span>
          </Link>
        );
      })}
      {isAdmin && adminNavigation.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'ios-liquid-button group relative flex items-center gap-3 px-5 py-3.5 rounded-[18px] text-sm font-semibold transition-all duration-500 overflow-hidden',
              isActive
                ? 'bg-gradient-to-br from-black via-gray-900 to-black text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] scale-[0.98]'
                : 'bg-gradient-to-br from-gray-50 to-white text-gray-700 hover:text-black hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:scale-[1.02] border border-gray-200/50'
            )}
          >
            {/* iOS-style inner shadow for depth */}
            <div className={cn(
              "absolute inset-0 rounded-[18px] transition-opacity duration-500",
              isActive 
                ? "shadow-[inset_0_2px_8px_rgba(255,255,255,0.1),inset_0_-2px_8px_rgba(0,0,0,0.3)]"
                : "shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-1px_2px_rgba(0,0,0,0.05)]"
            )} />
            
            {/* Liquid shine effect - iOS style */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1500ms] ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-[18px]" />
            
            {/* Subtle glow on hover */}
            {!isActive && (
              <div className="absolute inset-0 rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/40 via-transparent to-white/20" />
            )}
            
            {/* Active state glow */}
            {isActive && (
              <div className="absolute -inset-1 bg-gradient-to-br from-gray-600/30 via-black/20 to-gray-600/30 rounded-[20px] blur-xl opacity-60 animate-pulse" />
            )}
            
            <Icon className={cn(
              "h-5 w-5 relative z-10 transition-transform duration-500",
              isActive && "drop-shadow-[0_2px_4px_rgba(255,255,255,0.3)]",
              "group-hover:scale-110"
            )} />
            <span className={cn(
              "relative z-10 transition-all duration-500",
              isActive && "drop-shadow-[0_1px_2px_rgba(255,255,255,0.2)]"
            )}>{item.name}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white/90 backdrop-blur-xl px-6 pb-4 border-r-2 border-black/10 shadow-2xl">
          {/* Logo Header with liquid style */}
          <div className="flex h-20 shrink-0 items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-105 hover:rotate-3 transition-all duration-300">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-black tracking-tight">
              Match<span className="text-gray-600">IQ</span>
            </h1>
          </div>
          
          {/* User Info Card with liquid style */}
          <div className="relative group/card">
            {/* Glow effect on hover */}
            <div className="absolute -inset-1 bg-gradient-to-r from-black/20 via-gray-500/20 to-black/20 rounded-2xl blur-xl opacity-0 group-hover/card:opacity-100 transition duration-500" />
            
            <div className="relative flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-black/15 shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-black via-gray-800 to-black shadow-xl shadow-black/30">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-black truncate">
                  @{username || 'User'}
                  {isAdmin && <span className="ml-1">👑</span>}
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  {isAdmin ? 'Адміністратор' : 'Користувач'}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="space-y-2">
                  <NavItems />
                </ul>
              </li>
              <li className="mt-auto">
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="group relative w-full justify-start gap-3 text-red-600 hover:text-white hover:bg-red-600 border-2 border-red-600 rounded-2xl font-bold h-12 transition-all duration-300 overflow-hidden"
                >
                  {/* Liquid effect on hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <LogOut className="h-5 w-5 relative z-10" />
                  <span className="relative z-10">Вийти</span>
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-white/90 backdrop-blur-xl px-4 py-4 border-b-2 border-black/10 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center shadow-xl shadow-black/20">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-black tracking-tight">
              Match<span className="text-gray-600">IQ</span>
            </h1>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl border-2 border-black/20 hover:bg-black/5">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-white/95 backdrop-blur-xl border-r-2 border-black/10">
              <div className="flex h-16 items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-2xl shadow-black/20">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-black tracking-tight">
                  Match<span className="text-gray-600">IQ</span>
                </h1>
              </div>
              
              {/* User Info Mobile */}
              <div className="relative group/card mt-4">
                <div className="absolute -inset-1 bg-gradient-to-r from-black/20 via-gray-500/20 to-black/20 rounded-2xl blur-xl opacity-0 group-hover/card:opacity-100 transition duration-500" />
                
                <div className="relative flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-black/15 shadow-lg">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-black via-gray-800 to-black shadow-xl shadow-black/30">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black truncate">
                      @{username || 'User'}
                      {isAdmin && <span className="ml-1">👑</span>}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">
                      {isAdmin ? 'Адміністратор' : 'Користувач'}
                    </p>
                  </div>
                </div>
              </div>

              <nav className="mt-8">
                <ul className="space-y-2">
                  <NavItems />
                </ul>
                <div className="mt-8">
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="group relative w-full justify-start gap-3 text-red-600 hover:text-white hover:bg-red-600 border-2 border-red-600 rounded-2xl font-bold h-12 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <LogOut className="h-5 w-5 relative z-10" />
                    <span className="relative z-10">Вийти</span>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:pl-72">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}