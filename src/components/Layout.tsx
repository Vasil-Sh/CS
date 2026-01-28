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
  Sparkles
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
              'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200',
              isActive
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
            )}
          >
            <Icon className="h-5 w-5" />
            {item.name}
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
              'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200',
              isActive
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                : 'text-purple-600 hover:bg-purple-100/80 hover:text-purple-900'
            )}
          >
            <Icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white/80 backdrop-blur-xl px-6 pb-4 border-r border-gray-200/50 shadow-xl">
          {/* Logo Header */}
          <div className="flex h-20 shrink-0 items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
              MatchIQ
            </h1>
          </div>
          
          {/* User Info Card */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-2xl border border-gray-200/50 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                @{username || 'User'}
                {isAdmin && <span className="ml-1">👑</span>}
              </p>
              <p className="text-xs text-gray-500 font-medium">
                {isAdmin ? 'Адміністратор' : 'Користувач'}
              </p>
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
                  className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-2xl font-semibold h-12 transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  Вийти
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl px-4 py-4 border-b border-gray-200/50 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
              MatchIQ
            </h1>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl border-gray-300">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-white/95 backdrop-blur-xl">
              <div className="flex h-16 items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                  MatchIQ
                </h1>
              </div>
              
              {/* User Info Mobile */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-2xl border border-gray-200/50 shadow-sm mt-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    @{username || 'User'}
                    {isAdmin && <span className="ml-1">👑</span>}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    {isAdmin ? 'Адміністратор' : 'Користувач'}
                  </p>
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
                    className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-2xl font-semibold h-12 transition-all duration-200"
                  >
                    <LogOut className="h-5 w-5" />
                    Вийти
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