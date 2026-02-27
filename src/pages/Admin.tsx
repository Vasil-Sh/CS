import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  RefreshCw, 
  Shield, 
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Bell,
  AlertTriangle,
  DollarSign,
  Eye,
  EyeOff,
  Crown,
  MoreHorizontal,
  User
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface UserData {
  telegram: string;
  username: string;
  password: string;
  priceMonth: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isAdmin: boolean;
  daysUntilExpiry?: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState('');
  const [showUsernames, setShowUsernames] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const userRole = localStorage.getItem('userRole');
  const currentUser = localStorage.getItem('username') || '';
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/matches');
      return;
    }
    fetchUsers();
  }, [userRole, navigate]);

  useEffect(() => {
    const handleClickOutside = () => setShowActionsMenu(false);
    if (showActionsMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActionsMenu]);

  const getDaysUntilExpiry = (endDateStr: string): number => {
    try {
      const [day, month, year] = endDateStr.split('/').map(Number);
      const endDate = new Date(year, month - 1, day);
      const today = new Date();
      
      today.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch {
      return -1;
    }
  };

  const isSubscriptionActive = (endDateStr: string): boolean => {
    const daysLeft = getDaysUntilExpiry(endDateStr);
    return daysLeft >= 0;
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const SHEET_ID = '1IhAUYQKcPjXetOGxCu-_YXxrj_kXt0QxKJCcGqPzZdo';
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
      
      const response = await fetch(url);
      const text = await response.text();
      
      const rows = text.split('\n').slice(1);
      const parsedUsers: UserData[] = rows
        .filter(row => row.trim())
        .map(row => {
          const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (!matches || matches.length < 7) return null;
          
          const telegram = matches[0].replace(/"/g, '').trim();
          const username = matches[1].replace(/"/g, '').trim();
          const password = matches[2].replace(/"/g, '').trim();
          const priceMonth = matches[3].replace(/"/g, '').trim();
          const startDate = matches[4].replace(/"/g, '').trim();
          const endDate = matches[5].replace(/"/g, '').trim();
          const isAdminStr = matches[6]?.replace(/"/g, '').trim().toLowerCase();
          
          const daysLeft = getDaysUntilExpiry(endDate);
          
          return {
            telegram,
            username,
            password,
            priceMonth,
            startDate,
            endDate,
            isActive: isSubscriptionActive(endDate),
            isAdmin: isAdminStr === 'true' || isAdminStr === '1' || isAdminStr === 'yes',
            daysUntilExpiry: daysLeft,
          };
        })
        .filter((user): user is UserData => user !== null);
      
      setUsers(parsedUsers);
      setLastUpdate(new Date().toLocaleString('uk-UA'));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Помилка завантаження даних користувачів');
    } finally {
      setLoading(false);
    }
  };

  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = users.filter(u => !u.isActive).length;
  const adminUsers = users.filter(u => u.isAdmin).length;
  const expiringUsers = users.filter(u => u.isActive && u.daysUntilExpiry !== undefined && u.daysUntilExpiry <= 3 && u.daysUntilExpiry >= 0);

  const getExpiryBadge = (user: UserData) => {
    if (!user.isActive) {
      return (
        <Badge className="bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEF2F2] px-3 py-1.5 rounded-lg border border-[#FECACA] font-medium text-xs">
          <XCircle className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
          Закінчилась
        </Badge>
      );
    }

    if (user.daysUntilExpiry !== undefined && user.daysUntilExpiry <= 3 && user.daysUntilExpiry >= 0) {
      return (
        <Badge className="bg-gradient-to-r from-[#FF9800] to-[#F44336] text-white hover:from-[#FB8C00] hover:to-[#E53935] px-3 py-1.5 rounded-lg border-0 shadow-[0_2px_8px_rgba(244,67,54,0.25)] font-medium text-xs animate-pulse">
          <AlertTriangle className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
          {user.daysUntilExpiry === 0 ? 'Сьогодні!' : `${user.daysUntilExpiry} дн${user.daysUntilExpiry === 1 ? 'ень' : user.daysUntilExpiry < 5 ? 'і' : 'ів'}`}
        </Badge>
      );
    }

    if (user.daysUntilExpiry !== undefined && user.daysUntilExpiry <= 7) {
      return (
        <Badge className="bg-[#FFFBEB] text-[#D97706] hover:bg-[#FFFBEB] px-3 py-1.5 rounded-lg border border-[#FDE68A] font-medium text-xs">
          <Bell className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
          {user.daysUntilExpiry} дн{user.daysUntilExpiry === 1 ? 'ень' : user.daysUntilExpiry < 5 ? 'і' : 'ів'}
        </Badge>
      );
    }

    return (
      <Badge className="bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] px-3 py-1.5 rounded-lg border border-[#BBF7D0] font-medium text-xs">
        <CheckCircle className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
        Активна ({user.daysUntilExpiry} дн{user.daysUntilExpiry === 1 ? 'ень' : user.daysUntilExpiry && user.daysUntilExpiry < 5 ? 'і' : 'ів'})
      </Badge>
    );
  };

  const renderUsername = (username: string) => {
    if (!showUsernames) {
      return (
        <span className="blur-sm select-none transition-all duration-200">
          {username}
        </span>
      );
    }
    return username;
  };

  const renderTelegram = (telegram: string) => {
    if (!showUsernames) {
      return (
        <span className="blur-sm select-none transition-all duration-200">
          {telegram}
        </span>
      );
    }
    return telegram;
  };

  // Card hover style matching Analytics
  const cardBaseStyle = {
    transform: 'scale(1)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  };

  const cardHoverStyle = {
    transform: 'scale(1.03)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)',
  };

  const chartCardShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)';

  return (
    <div className="min-h-screen bg-[#f3f3f3] relative">

      {/* ===== HEADER ===== */}
      <div className="px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-[48px] font-semibold text-[#111827] leading-tight tracking-tight">
            Адмін панель
          </h1>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActionsMenu(!showActionsMenu);
                }}
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-black/5 transition-colors duration-200"
                title="Дії"
              >
                <MoreHorizontal className="h-5 w-5 text-[#6B7280]" strokeWidth={1.5} />
              </button>
              
              {showActionsMenu && (
                <div 
                  className="absolute right-0 top-11 bg-white rounded-xl border border-[#E5E7EB] py-1 min-w-[200px] z-50"
                  style={{
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  <button
                    onClick={() => {
                      fetchUsers();
                      setShowActionsMenu(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                  >
                    <RefreshCw className="h-4 w-4 text-[#9CA3AF]" strokeWidth={1.5} />
                    Оновити дані
                  </button>
                  <button
                    onClick={() => {
                      setShowUsernames(!showUsernames);
                      setShowActionsMenu(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                  >
                    {showUsernames ? (
                      <>
                        <EyeOff className="h-4 w-4 text-[#9CA3AF]" strokeWidth={1.5} />
                        Приховати дані
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 text-[#9CA3AF]" strokeWidth={1.5} />
                        Показати дані
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="w-px h-8 bg-[#D1D5DB]" />

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111827]">
                <User className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[#111827] leading-tight">
                  {currentUser || 'User'}
                </p>
                <p className="text-xs text-[#6B7280] leading-tight">
                  Адміністратор
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 space-y-8 px-6 lg:px-8 pb-8 pt-4">

        {error && (
          <Alert className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-5">
            <AlertTriangle className="h-5 w-5 text-[#EF4444]" strokeWidth={1.5} />
            <AlertDescription className="text-sm text-[#DC2626] ml-2">{error}</AlertDescription>
          </Alert>
        )}

        {/* Privacy Notice */}
        {!showUsernames && (
          <Alert className="rounded-xl border border-[#E5E7EB] bg-white p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <Eye className="h-5 w-5 text-[#9CA3AF]" strokeWidth={1.5} />
            <AlertDescription className="text-sm text-[#374151] ml-2">
              <strong className="font-medium text-[#111827]">🔒 Режим приватності активний</strong>
              <p className="text-[#6B7280] mt-1">
                Імена користувачів та Telegram приховані для захисту конфіденційності.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Expiring Subscriptions Alert */}
        {expiringUsers.length > 0 && (
          <Alert className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-5">
            <AlertTriangle className="h-5 w-5 text-[#D97706]" strokeWidth={1.5} />
            <AlertDescription className="text-sm text-[#92400E] ml-2">
              <strong className="font-medium">
                ⚠️ {expiringUsers.length} підпис{expiringUsers.length === 1 ? 'ка' : expiringUsers.length < 5 ? 'ки' : 'ок'} закінчу{expiringUsers.length === 1 ? 'ється' : 'ються'} протягом 3 днів:
              </strong>
              <ul className="space-y-1.5 mt-2">
                {expiringUsers.map((user, idx) => (
                  <li key={idx} className="text-sm text-[#6B7280]">
                    <span className="font-medium text-[#374151]">{renderTelegram(user.telegram)}</span> ({renderUsername(user.username)}) — 
                    <span className="font-medium text-[#D97706] ml-1">
                      {user.daysUntilExpiry === 0 ? 'закінчується сьогодні' : `залишилось ${user.daysUntilExpiry} дн${user.daysUntilExpiry === 1 ? 'ень' : user.daysUntilExpiry < 5 ? 'і' : 'ів'}`}
                    </span>
                    <span className="text-[#9CA3AF] ml-1">(до {user.endDate})</span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* ===== QUICK STATS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* 1. Всього користувачів */}
          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, cardHoverStyle);
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, cardBaseStyle);
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-[#111827]">Всього користувачів</span>
            </div>
            <div className="text-4xl font-bold text-[#111827] tracking-tight mb-2">
              {users.length}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#9CA3AF]">Зареєстровано в системі</span>
            </div>
          </div>

          {/* 2. Активні підписки */}
          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, cardHoverStyle);
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, cardBaseStyle);
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-[#22C55E]" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-[#111827]">Активні підписки</span>
            </div>
            <div className="text-4xl font-bold text-[#22C55E] tracking-tight mb-2">
              {activeUsers}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#9CA3AF]">
                {users.length > 0 ? `${Math.round((activeUsers / users.length) * 100)}% від загальної кількості` : 'Немає даних'}
              </span>
            </div>
          </div>

          {/* 3. Адміністратори */}
          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, cardHoverStyle);
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, cardBaseStyle);
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-5 w-5 text-[#F59E0B]" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-[#111827]">Адміністратори</span>
            </div>
            <div className="text-4xl font-bold text-[#111827] tracking-tight mb-2">
              {adminUsers}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#9CA3AF]">З правами адміністратора</span>
            </div>
          </div>

          {/* 4. Неактивні підписки */}
          <div 
            className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
            style={cardBaseStyle}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, cardHoverStyle);
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, cardBaseStyle);
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-5 w-5 text-[#EF4444]" strokeWidth={1.5} />
              <span className="text-lg font-semibold text-[#111827]">Неактивні підписки</span>
            </div>
            <div className="text-4xl font-bold text-[#EF4444] tracking-tight mb-2">
              {inactiveUsers}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#9CA3AF]">Потребують продовження</span>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div 
          className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden"
          style={{ boxShadow: chartCardShadow }}
        >
          <div className="bg-white border-b border-[#E5E7EB] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
                  <Users className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#111827]">Список користувачів</h2>
                  <p className="text-sm text-[#6B7280] mt-0.5">
                    Google Sheets • Оновлено: {lastUpdate || '—'}
                  </p>
                </div>
              </div>
              <Button
                onClick={fetchUsers}
                disabled={loading}
                className="rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white font-medium h-10 px-5 transition-all duration-200 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} />
                    Завантаження...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" strokeWidth={1.5} />
                    Оновити
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <TableHead className="text-xs font-medium text-[#6B7280] uppercase tracking-wider py-4 px-5">Telegram</TableHead>
                  <TableHead className="text-xs font-medium text-[#6B7280] uppercase tracking-wider py-4 px-5">Username</TableHead>
                  <TableHead className="text-xs font-medium text-[#6B7280] uppercase tracking-wider py-4 px-5">Ціна</TableHead>
                  <TableHead className="text-xs font-medium text-[#6B7280] uppercase tracking-wider py-4 px-5">Дата початку</TableHead>
                  <TableHead className="text-xs font-medium text-[#6B7280] uppercase tracking-wider py-4 px-5">Дата закінчення</TableHead>
                  <TableHead className="text-xs font-medium text-[#6B7280] uppercase tracking-wider py-4 px-5">Статус</TableHead>
                  <TableHead className="text-xs font-medium text-[#6B7280] uppercase tracking-wider py-4 px-5">Адмін</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-[#9CA3AF] py-16 text-sm">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
                          Завантаження...
                        </div>
                      ) : (
                        <div>
                          <div className="p-6 bg-[#F3F4F6] rounded-2xl inline-block mb-4">
                            <Users className="h-12 w-12 text-[#9CA3AF]" strokeWidth={1.5} />
                          </div>
                          <p className="text-[#6B7280]">Немає даних</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, index) => (
                    <TableRow 
                      key={index} 
                      className={`border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors ${
                        user.isActive && user.daysUntilExpiry !== undefined && user.daysUntilExpiry <= 3 && user.daysUntilExpiry >= 0
                          ? 'bg-[#FFFBEB]/50'
                          : ''
                      }`}
                    >
                      <TableCell className="font-medium text-[#111827] py-4 px-5 text-sm">{renderTelegram(user.telegram)}</TableCell>
                      <TableCell className="text-[#6B7280] py-4 px-5 text-sm">
                        {renderUsername(user.username)}
                        {user.isAdmin && (
                          <span className="ml-1.5">👑</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-5">
                        <Badge className="bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] px-3 py-1.5 rounded-lg border border-[#BBF7D0] font-medium text-xs">
                          <DollarSign className="mr-1 h-3.5 w-3.5" strokeWidth={1.5} />
                          {user.priceMonth}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#6B7280] py-4 px-5 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#9CA3AF]" strokeWidth={1.5} />
                          {user.startDate}
                        </div>
                      </TableCell>
                      <TableCell className="text-[#6B7280] py-4 px-5 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#9CA3AF]" strokeWidth={1.5} />
                          {user.endDate}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-5">
                        {getExpiryBadge(user)}
                      </TableCell>
                      <TableCell className="py-4 px-5">
                        {user.isAdmin ? (
                          <Badge className="bg-[#FFFBEB] text-[#D97706] hover:bg-[#FFFBEB] px-3 py-1.5 rounded-lg border border-[#FDE68A] font-medium text-xs">
                            <Crown className="mr-1 h-3.5 w-3.5" strokeWidth={1.5} />
                            Так
                          </Badge>
                        ) : (
                          <Badge className="bg-[#F9FAFB] text-[#9CA3AF] hover:bg-[#F9FAFB] px-3 py-1.5 rounded-lg border border-[#E5E7EB] font-normal text-xs">
                            Ні
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}