import { useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
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

const navigation = [
  { name: 'Аналітика', href: '/analytics', icon: BarChart3 },
  { name: 'Матчі', href: '/matches', icon: Trophy },
  { name: 'Журнал прогнозів', href: '/my-bets', icon: Wallet },
];

const adminNavigation = [
  { name: 'Адмін панель', href: '/admin', icon: Shield, adminOnly: true },
];

export default function Layout() {
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
              'group relative flex items-center gap-3 px-5 py-4 rounded-[24px] text-base font-normal transition-all duration-300',
              isActive
                ? 'bg-[#f2f8ff] text-[#2A5BD7] shadow-[0_4px_16px_rgba(42,91,215,0.1)]'
                : 'text-[#8B8B9A] hover:text-[#2A2A3A] hover:bg-[#F0F0ED]'
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.5} />
            <span>{item.name}</span>
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
              'group relative flex items-center gap-3 px-5 py-4 rounded-[24px] text-base font-normal transition-all duration-300',
              isActive
                ? 'bg-[#447afc] text-white shadow-[0_4px_16px_rgba(68,122,252,0.3)]'
                : 'text-[#8B8B9A] hover:text-[#2A2A3A] hover:bg-[#F0F0ED]'
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.5} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-80 lg:flex-col">
        <div className="flex grow flex-col gap-y-6 overflow-y-auto bg-white/97 backdrop-blur-xl px-8 py-8 border-r-2 border-[#E8E6DC] shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          {/* Logo Header */}
          <div className="flex h-24 shrink-0 items-center gap-4">
            <div className="w-16 h-16 bg-[#1a1a2e] rounded-[28px] flex items-center justify-center shadow-[0_8px_24px_rgba(26,26,46,0.3)]">
              <TrendingUp className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-semibold text-[#1a1a2e] tracking-tight">
              MatchIQ
            </h1>
          </div>
          
          {/* User Info Card */}
          <div className="relative">
            <div className="flex items-center gap-4 px-5 py-4 bg-[#F5F5F0] rounded-[28px] border-2 border-[#E8E6DC]">
              <div className="flex h-14 w-14 items-center justify-center rounded-[24px] bg-[#1a1a2e] shadow-[0_4px_12px_rgba(26,26,46,0.2)]">
                <User className="h-7 w-7 text-white" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-normal text-[#1a1a2e] truncate">
                  @{username || 'User'}
                  {isAdmin && <span className="ml-1">👑</span>}
                </p>
                <p className="text-sm text-[#8B8B9A] font-light">
                  {isAdmin ? 'Адміністратор' : 'Користувач'}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-8">
              <li>
                <ul role="list" className="space-y-2">
                  <NavItems />
                </ul>
              </li>
              <li className="mt-auto">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-start gap-3 px-5 py-4 text-[#D32F2F] bg-transparent border-2 border-[#D32F2F] rounded-[24px] font-normal text-base transition-all duration-300 hover:bg-[#D32F2F] hover:text-white hover:shadow-[0_4px_16px_rgba(211,47,47,0.3)]"
                >
                  <LogOut className="h-5 w-5" strokeWidth={1.5} />
                  <span>Вийти</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-white/97 backdrop-blur-xl px-6 py-5 border-b-2 border-[#E8E6DC] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#1a1a2e] rounded-[20px] flex items-center justify-center shadow-[0_4px_12px_rgba(26,26,46,0.2)]">
              <TrendingUp className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">
              MatchIQ
            </h1>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-[20px] border-2 border-[#E8E6DC] hover:bg-[#F0F0ED] w-12 h-12">
                <Menu className="h-6 w-6" strokeWidth={1.5} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-white/97 backdrop-blur-xl border-r-2 border-[#E8E6DC]">
              <div className="flex h-20 items-center gap-4">
                <div className="w-14 h-14 bg-[#1a1a2e] rounded-[24px] flex items-center justify-center shadow-[0_4px_12px_rgba(26,26,46,0.2)]">
                  <TrendingUp className="w-7 h-7 text-white" strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">
                  MatchIQ
                </h1>
              </div>
              
              {/* User Info Mobile */}
              <div className="relative mt-6">
                <div className="flex items-center gap-4 px-5 py-4 bg-[#F5F5F0] rounded-[28px] border-2 border-[#E8E6DC]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[24px] bg-[#1a1a2e] shadow-[0_4px_12px_rgba(26,26,46,0.2)]">
                    <User className="h-7 w-7 text-white" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-normal text-[#1a1a2e] truncate">
                      @{username || 'User'}
                      {isAdmin && <span className="ml-1">👑</span>}
                    </p>
                    <p className="text-sm text-[#8B8B9A] font-light">
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
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-start gap-3 px-5 py-4 text-[#D32F2F] bg-transparent border-2 border-[#D32F2F] rounded-[24px] font-normal text-base transition-all duration-300 hover:bg-[#D32F2F] hover:text-white hover:shadow-[0_4px_16px_rgba(211,47,47,0.3)]"
                  >
                    <LogOut className="h-5 w-5" strokeWidth={1.5} />
                    <span>Вийти</span>
                  </button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:pl-80">
        <div className="px-6 py-8 sm:px-8 lg:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}