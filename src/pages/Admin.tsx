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
        <Badge className="bg-red-50 text-red-700 hover:bg-red-50 px-3 py-1 rounded-full border-2 border-red-200 font-bold">
          <XCircle className="mr-1 h-3 w-3" />
          Закінчилась
        </Badge>
      );
    }

    if (user.daysUntilExpiry !== undefined && user.daysUntilExpiry <= 3 && user.daysUntilExpiry >= 0) {
      return (
        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 px-3 py-1 rounded-full border-0 shadow-lg font-bold animate-pulse">
          <AlertTriangle className="mr-1 h-3 w-3" />
          {user.daysUntilExpiry === 0 ? 'Закінчується сьогодні!' : `${user.daysUntilExpiry} дн${user.daysUntilExpiry === 1 ? 'ень' : user.daysUntilExpiry < 5 ? 'і' : 'ів'}`}
        </Badge>
      );
    }

    if (user.daysUntilExpiry !== undefined && user.daysUntilExpiry <= 7) {
      return (
        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white hover:from-yellow-500 hover:to-orange-500 px-3 py-1 rounded-full border-0 shadow-md font-bold">
          <Bell className="mr-1 h-3 w-3" />
          {user.daysUntilExpiry} дн{user.daysUntilExpiry === 1 ? 'ень' : user.daysUntilExpiry < 5 ? 'і' : 'ів'}
        </Badge>
      );
    }

    return (
      <Badge className="bg-green-50 text-green-700 hover:bg-green-50 px-3 py-1 rounded-full border-2 border-green-200 font-bold">
        <CheckCircle className="mr-1 h-3 w-3" />
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
    <div className="space-y-8 p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-black rounded-2xl shadow-xl shadow-black/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            Адмін панель
          </h1>
          <p className="text-gray-600 mt-2 font-medium">
            Управління користувачами та підписками
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowUsernames(!showUsernames)}
            variant="outline"
            className="rounded-2xl border-2 border-black/20 font-bold hover:bg-black/5 transition-all duration-300"
          >
            {showUsernames ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Приховати дані
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Показати дані
              </>
            )}
          </Button>
          <Button
            onClick={fetchUsers}
            disabled={loading}
            className="group relative rounded-2xl bg-black hover:bg-gray-800 font-bold transition-all duration-300 overflow-hidden shadow-xl shadow-black/20"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin relative z-10" />
                <span className="relative z-10">Завантаження...</span>
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4 relative z-10" />
                <span className="relative z-10">Оновити дані</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="rounded-2xl border-2 border-red-200 bg-red-50">
          <AlertDescription className="font-bold text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Privacy Notice */}
      {!showUsernames && (
        <Alert className="rounded-2xl border-2 border-blue-200 bg-blue-50">
          <Eye className="h-5 w-5 text-blue-600" />
          <AlertDescription className="font-medium text-gray-900 ml-2">
            <div className="font-bold text-blue-700 mb-1">
              🔒 Режим приватності активний
            </div>
            <p className="text-sm text-gray-700">
              Імена користувачів та Telegram приховані для захисту конфіденційності під час запису відео або демонстрації.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Expiring Subscriptions Alert */}
      {expiringUsers.length > 0 && (
        <Alert className="rounded-2xl border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <AlertDescription className="font-medium text-gray-900 ml-2">
            <div className="font-bold text-orange-700 mb-2">
              ⚠️ Увага! {expiringUsers.length} підпис{expiringUsers.length === 1 ? 'ка' : expiringUsers.length < 5 ? 'ки' : 'ок'} закінчу{expiringUsers.length === 1 ? 'ється' : 'ються'} протягом 3 днів:
            </div>
            <ul className="space-y-1 mt-2">
              {expiringUsers.map((user, idx) => (
                <li key={idx} className="text-sm text-gray-700">
                  <span className="font-bold">{renderTelegram(user.telegram)}</span> ({renderUsername(user.username)}) - 
                  <span className="font-bold text-orange-600 ml-1">
                    {user.daysUntilExpiry === 0 ? 'закінчується сьогодні' : `залишилось ${user.daysUntilExpiry} дн${user.daysUntilExpiry === 1 ? 'ень' : user.daysUntilExpiry < 5 ? 'і' : 'ів'}`}
                  </span>
                  <span className="text-gray-500 ml-1">(до {user.endDate})</span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-black/10 shadow-xl rounded-3xl bg-white overflow-hidden hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Всього користувачів
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black tracking-tight">{users.length}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 shadow-xl rounded-3xl bg-gradient-to-br from-green-50 to-white overflow-hidden hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Активні підписки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 tracking-tight">{activeUsers}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-black/20 shadow-xl rounded-3xl bg-gradient-to-br from-gray-50 to-white overflow-hidden hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Адміністратори
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black tracking-tight">{adminUsers}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 shadow-xl rounded-3xl bg-gradient-to-br from-red-50 to-white overflow-hidden hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Неактивні підписки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 tracking-tight">{inactiveUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-2 border-black/10 shadow-2xl rounded-3xl bg-white overflow-hidden">
        <CardHeader className="border-b-2 border-black/10 bg-white">
          <CardTitle className="flex items-center justify-between">
            <span className="text-xl font-bold text-black tracking-tight">Список користувачів</span>
            {lastUpdate && (
              <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Оновлено: {lastUpdate}
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-gray-600 font-medium">
            Дані з Google Sheets (ID: 1IhAUYQKcPjXetOGxCu-_YXxrj_kXt0QxKJCcGqPzZdo)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b-2 border-black/10">
                  <TableHead className="text-xs font-bold text-gray-700 uppercase tracking-wider">Telegram</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 uppercase tracking-wider">Username</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 uppercase tracking-wider">Ціна</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 uppercase tracking-wider">Дата початку</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 uppercase tracking-wider">Дата закінчення</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 uppercase tracking-wider">Статус</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 uppercase tracking-wider">Адмін</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-12">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
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
                      className={`border-b border-black/5 hover:bg-gray-50 transition-colors ${
                        user.isActive && user.daysUntilExpiry !== undefined && user.daysUntilExpiry <= 3 && user.daysUntilExpiry >= 0
                          ? 'bg-orange-50/50'
                          : ''
                      }`}
                    >
                      <TableCell className="font-bold text-black">{renderTelegram(user.telegram)}</TableCell>
                      <TableCell className="text-gray-700 font-medium">
                        {renderUsername(user.username)}
                        {user.isAdmin && (
                          <span className="ml-2 text-black">👑</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 px-3 py-1 rounded-full border-2 border-blue-200 font-bold">
                          <DollarSign className="mr-1 h-3 w-3" />
                          {user.priceMonth}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700 font-medium">{user.startDate}</TableCell>
                      <TableCell className="text-gray-700 font-medium">{user.endDate}</TableCell>
                      <TableCell>
                        {getExpiryBadge(user)}
                      </TableCell>
                      <TableCell>
                        {user.isAdmin ? (
                          <Badge className="bg-black text-white hover:bg-gray-800 px-3 py-1 rounded-full border-0 font-bold shadow-lg shadow-black/20">
                            <Crown className="mr-1 h-3 w-3" />
                            Так
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 px-3 py-1 rounded-full border-2 border-gray-200 font-bold">
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
  );
}