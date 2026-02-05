import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Crown
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

interface User {
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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState('');
  const [showUsernames, setShowUsernames] = useState(false);
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    // Check if user is admin
    if (userRole !== 'admin') {
      navigate('/matches');
      return;
    }

    // Load users on mount
    fetchUsers();
  }, [userRole, navigate]);

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
    } catch (err) {
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
      
      // Parse CSV - 7 columns: Telegram, UserName, Password, PriceMonth, StartDate, EdnDate, isAdmin
      const rows = text.split('\n').slice(1); // Skip header
      const parsedUsers: User[] = rows
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
        .filter((user): user is User => user !== null);
      
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

  const getExpiryBadge = (user: User) => {
    if (!user.isActive) {
      return (
        <Badge className="bg-[#FFE8E8] text-[#D32F2F] hover:bg-[#FFE8E8] px-5 py-2 rounded-[20px] border-2 border-[#FFCDD2] font-normal text-sm">
          <XCircle className="mr-2 h-4 w-4" strokeWidth={1.5} />
          Закінчилась
        </Badge>
      );
    }

    if (user.daysUntilExpiry !== undefined && user.daysUntilExpiry <= 3 && user.daysUntilExpiry >= 0) {
      return (
        <Badge className="bg-gradient-to-r from-[#FF9800] to-[#F44336] text-white hover:from-[#FB8C00] hover:to-[#E53935] px-5 py-2 rounded-[20px] border-0 shadow-[0_4px_12px_rgba(244,67,54,0.3)] font-normal text-sm animate-pulse">
          <AlertTriangle className="mr-2 h-4 w-4" strokeWidth={1.5} />
          {user.daysUntilExpiry === 0 ? 'Закінчується сьогодні!' : `${user.daysUntilExpiry} дн${user.daysUntilExpiry === 1 ? 'ень' : user.daysUntilExpiry < 5 ? 'і' : 'ів'}`}
        </Badge>
      );
    }

    if (user.daysUntilExpiry !== undefined && user.daysUntilExpiry <= 7) {
      return (
        <Badge className="bg-gradient-to-r from-[#F4E157] to-[#FF9800] text-black hover:from-[#F4E157] hover:to-[#FB8C00] px-5 py-2 rounded-[20px] border-0 shadow-[0_4px_12px_rgba(244,225,87,0.3)] font-normal text-sm">
          <Bell className="mr-2 h-4 w-4" strokeWidth={1.5} />
          {user.daysUntilExpiry} дн{user.daysUntilExpiry === 1 ? 'ень' : user.daysUntilExpiry < 5 ? 'і' : 'ів'}
        </Badge>
      );
    }

    return (
      <Badge className="bg-[#E8F5E9] text-[#4CAF50] hover:bg-[#E8F5E9] px-5 py-2 rounded-[20px] border-2 border-[#C8E6C9] font-normal text-sm">
        <CheckCircle className="mr-2 h-4 w-4" strokeWidth={1.5} />
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

  return (
    <div className="min-h-screen bg-[#FAFAF8] relative overflow-hidden">
      {/* Decorative elements with hatching pattern - RonDesignLab style */}
      <div className="absolute top-16 right-16 w-40 h-40 rounded-[40px] bg-[#E8E6DC] opacity-20" 
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)`
        }} 
      />
      <div className="absolute bottom-24 left-16 w-32 h-32 rounded-[36px] bg-[#D4D2C8] opacity-15"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)`
        }}
      />
      
      {/* Subtle grid pattern overlay */}
      <svg className="absolute top-0 left-0 w-full h-full opacity-[0.015] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" patternUnits="userSpaceOnUse" width="40" height="40">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#000000" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="relative z-10 space-y-10 p-8">
        {/* Enhanced Header with background */}
        <div className="bg-white/60 backdrop-blur-sm rounded-[40px] p-8 border-2 border-[#E8E6DC] shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-6xl font-light text-black tracking-tight flex items-center gap-5">
                <div className="p-4 bg-[#F4E157] rounded-[36px] shadow-[0_12px_32px_rgba(244,225,87,0.4)]">
                  <Shield className="h-10 w-10 text-black" strokeWidth={1.5} />
                </div>
                Адмін панель
              </h1>
              <p className="text-[#6B6B6B] mt-4 text-xl font-light ml-[88px]">
                Управління користувачами та підписками
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowUsernames(!showUsernames)}
                variant="outline"
                className="rounded-[24px] border-2 border-[#D4D2C8] hover:bg-[#FAFAF8] hover:border-[#C4C2B8] bg-white font-normal h-16 px-7 text-black transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-base"
              >
                {showUsernames ? (
                  <>
                    <EyeOff className="mr-2.5 h-5 w-5" strokeWidth={1.5} />
                    Приховати дані
                  </>
                ) : (
                  <>
                    <Eye className="mr-2.5 h-5 w-5" strokeWidth={1.5} />
                    Показати дані
                  </>
                )}
              </Button>
              <Button
                onClick={fetchUsers}
                disabled={loading}
                className="group relative rounded-[24px] bg-[#F4E157] hover:bg-[#E8D54A] text-black font-normal h-16 px-7 transition-all duration-300 overflow-hidden shadow-[0_6px_20px_rgba(244,225,87,0.35)] text-base"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                {loading ? (
                  <>
                    <Loader2 className="mr-2.5 h-5 w-5 animate-spin relative z-10" strokeWidth={1.5} />
                    <span className="relative z-10">Завантаження...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2.5 h-5 w-5 relative z-10" strokeWidth={1.5} />
                    <span className="relative z-10">Оновити дані</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert className="rounded-[28px] border-2 border-[#FFCDD2] bg-white shadow-[0_4px_16px_rgba(244,67,54,0.15)] p-6">
            <AlertDescription className="font-normal text-[#D32F2F] text-base">{error}</AlertDescription>
          </Alert>
        )}

        {/* Privacy Notice */}
        {!showUsernames && (
          <Alert className="rounded-[28px] border-2 border-[#E8DDD0] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-6">
            <Eye className="h-5 w-5 text-[#A67C52]" strokeWidth={1.5} />
            <AlertDescription className="font-normal text-black ml-2">
              <div className="font-normal text-[#A67C52] mb-2 text-base">
                🔒 Режим приватності активний
              </div>
              <p className="text-[15px] text-[#6B6B6B] font-light leading-relaxed">
                Імена користувачів та Telegram приховані для захисту конфіденційності під час запису відео або демонстрації.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Expiring Subscriptions Alert */}
        {expiringUsers.length > 0 && (
          <Alert className="rounded-[28px] border-2 border-[#FFCC80] bg-white shadow-[0_4px_16px_rgba(255,152,0,0.15)] p-6">
            <AlertTriangle className="h-5 w-5 text-[#FF9800]" strokeWidth={1.5} />
            <AlertDescription className="font-normal text-black ml-2">
              <div className="font-normal text-[#FF9800] mb-3 text-base">
                ⚠️ Увага! {expiringUsers.length} підпис{expiringUsers.length === 1 ? 'ка' : expiringUsers.length < 5 ? 'ки' : 'ок'} закінчу{expiringUsers.length === 1 ? 'ється' : 'ються'} протягом 3 днів:
              </div>
              <ul className="space-y-2 mt-3">
                {expiringUsers.map((user, idx) => (
                  <li key={idx} className="text-[15px] text-[#6B6B6B] font-light leading-relaxed">
                    <span className="font-normal">{renderTelegram(user.telegram)}</span> ({renderUsername(user.username)}) - 
                    <span className="font-normal text-[#FF9800] ml-1">
                      {user.daysUntilExpiry === 0 ? 'закінчується сьогодні' : `залишилось ${user.daysUntilExpiry} дн${user.daysUntilExpiry === 1 ? 'ень' : user.daysUntilExpiry < 5 ? 'і' : 'ів'}`}
                    </span>
                    <span className="text-[#8B8B8B] ml-1">(до {user.endDate})</span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards with more spacing */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[#C4C2B8] transition-all duration-300">
            <CardHeader className="pb-4 pt-7 px-7">
              <CardTitle className="text-sm font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2">
                <Users className="h-5 w-5" strokeWidth={1.5} />
                Всього користувачів
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <div className="text-6xl font-light text-black tracking-tight">{users.length}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#A5D6A7] shadow-[0_8px_24px_rgba(76,175,80,0.15)] rounded-[32px] bg-white overflow-hidden hover:shadow-[0_12px_32px_rgba(76,175,80,0.25)] hover:border-[#81C784] transition-all duration-300">
            <CardHeader className="pb-4 pt-7 px-7">
              <CardTitle className="text-sm font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="h-5 w-5" strokeWidth={1.5} />
                Активні підписки
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <div className="text-6xl font-light text-[#4CAF50] tracking-tight">{activeUsers}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#F4E157] shadow-[0_8px_24px_rgba(244,225,87,0.2)] rounded-[32px] bg-white overflow-hidden hover:shadow-[0_12px_32px_rgba(244,225,87,0.3)] hover:border-[#E8D54A] transition-all duration-300">
            <CardHeader className="pb-4 pt-7 px-7">
              <CardTitle className="text-sm font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2">
                <Crown className="h-5 w-5" strokeWidth={1.5} />
                Адміністратори
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <div className="text-6xl font-light text-black tracking-tight">{adminUsers}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#FFAB91] shadow-[0_8px_24px_rgba(244,67,54,0.15)] rounded-[32px] bg-white overflow-hidden hover:shadow-[0_12px_32px_rgba(244,67,54,0.25)] hover:border-[#FF8A65] transition-all duration-300">
            <CardHeader className="pb-4 pt-7 px-7">
              <CardTitle className="text-sm font-normal text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2">
                <XCircle className="h-5 w-5" strokeWidth={1.5} />
                Неактивні підписки
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <div className="text-6xl font-light text-[#D32F2F] tracking-tight">{inactiveUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="border-2 border-[#D4D2C8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[32px] bg-white overflow-hidden">
          <CardHeader className="border-b-2 border-[#E8E6DC] p-8">
            <CardTitle className="flex items-center justify-between">
              <span className="text-3xl font-light text-black tracking-tight">Список користувачів</span>
              {lastUpdate && (
                <span className="text-base font-light text-[#6B6B6B] flex items-center gap-2">
                  <Calendar className="h-5 w-5" strokeWidth={1.5} />
                  Оновлено: {lastUpdate}
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-[#8B8B8B] font-light text-base mt-2">
              Дані з Google Sheets (ID: 1IhAUYQKcPjXetOGxCu-_YXxrj_kXt0QxKJCcGqPzZdo)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F5F5F3] border-b-2 border-[#E8E6DC]">
                    <TableHead className="text-sm font-normal text-[#2A2A2A] uppercase tracking-wider py-5 px-6">Telegram</TableHead>
                    <TableHead className="text-sm font-normal text-[#2A2A2A] uppercase tracking-wider py-5 px-6">Username</TableHead>
                    <TableHead className="text-sm font-normal text-[#2A2A2A] uppercase tracking-wider py-5 px-6">Ціна</TableHead>
                    <TableHead className="text-sm font-normal text-[#2A2A2A] uppercase tracking-wider py-5 px-6">Дата початку</TableHead>
                    <TableHead className="text-sm font-normal text-[#2A2A2A] uppercase tracking-wider py-5 px-6">Дата закінчення</TableHead>
                    <TableHead className="text-sm font-normal text-[#2A2A2A] uppercase tracking-wider py-5 px-6">Статус</TableHead>
                    <TableHead className="text-sm font-normal text-[#2A2A2A] uppercase tracking-wider py-5 px-6">Адмін</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-[#8B8B8B] py-16 text-base">
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
                            Завантаження...
                          </div>
                        ) : (
                          'Немає даних'
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user, index) => (
                      <TableRow 
                        key={index} 
                        className={`border-b border-[#E8E6DC] hover:bg-[#FAFAF8] transition-colors ${
                          user.isActive && user.daysUntilExpiry !== undefined && user.daysUntilExpiry <= 3 && user.daysUntilExpiry >= 0
                            ? 'bg-[#FFF3E0]/70'
                            : ''
                        }`}
                      >
                        <TableCell className="font-normal text-black py-5 px-6 text-[15px]">{renderTelegram(user.telegram)}</TableCell>
                        <TableCell className="text-[#6B6B6B] font-light py-5 px-6 text-[15px]">
                          {renderUsername(user.username)}
                          {user.isAdmin && (
                            <span className="ml-2 text-black">👑</span>
                          )}
                        </TableCell>
                        <TableCell className="text-[#6B6B6B] py-5 px-6">
                          <Badge className="bg-[#E8F5E9] text-[#4CAF50] hover:bg-[#E8F5E9] px-5 py-2 rounded-[20px] border-2 border-[#C8E6C9] font-normal text-sm">
                            <DollarSign className="mr-2 h-4 w-4" strokeWidth={1.5} />
                            {user.priceMonth}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[#6B6B6B] font-light py-5 px-6 text-[15px]">{user.startDate}</TableCell>
                        <TableCell className="text-[#6B6B6B] font-light py-5 px-6 text-[15px]">{user.endDate}</TableCell>
                        <TableCell className="py-5 px-6">
                          {getExpiryBadge(user)}
                        </TableCell>
                        <TableCell className="py-5 px-6">
                          {user.isAdmin ? (
                            <Badge className="bg-[#F4E157] text-black hover:bg-[#E8D54A] px-5 py-2 rounded-[20px] border-0 font-normal text-sm shadow-[0_4px_12px_rgba(244,225,87,0.3)]">
                              <Crown className="mr-2 h-4 w-4" strokeWidth={1.5} />
                              Так
                            </Badge>
                          ) : (
                            <Badge className="bg-white text-[#8B8B8B] hover:bg-white px-5 py-2 rounded-[20px] border-2 border-[#E8E6DC] font-light text-sm">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}