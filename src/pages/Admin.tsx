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
  Loader2
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
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const ADMIN_USERNAME = 'super_gus23_7482';

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState('');
  const currentUser = localStorage.getItem('currentUser');

  useEffect(() => {
    // Check if user is admin
    if (currentUser !== ADMIN_USERNAME) {
      navigate('/matches');
      return;
    }

    // Load users on mount
    fetchUsers();
  }, [currentUser, navigate]);

  const isSubscriptionActive = (endDateStr: string): boolean => {
    try {
      const [day, month, year] = endDateStr.split('/').map(Number);
      const endDate = new Date(year, month - 1, day);
      const today = new Date();
      
      today.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      return endDate >= today;
    } catch (err) {
      return false;
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const SHEET_ID = '1IhAUYQKcPjXetOGxCu-_YXxrj_kXt0QxKJCcGqPzZdo';
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
      
      const response = await fetch(url);
      const text = await response.text();
      
      // Parse CSV - 5 columns: Users Telegram, UserName, Password, StartDate, EndDate
      const rows = text.split('\n').slice(1); // Skip header
      const parsedUsers: User[] = rows
        .filter(row => row.trim())
        .map(row => {
          const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (!matches || matches.length < 5) return null;
          
          const telegram = matches[0].replace(/"/g, '').trim();
          const username = matches[1].replace(/"/g, '').trim();
          const password = matches[2].replace(/"/g, '').trim();
          const startDate = matches[3].replace(/"/g, '').trim();
          const endDate = matches[4].replace(/"/g, '').trim();
          
          return {
            telegram,
            username,
            password,
            startDate,
            endDate,
            isActive: isSubscriptionActive(endDate),
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

  return (
    <div className="space-y-8 p-6 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
            <div className="p-2.5 bg-purple-50 rounded-2xl">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            Адмін панель
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Управління користувачами та підписками
          </p>
        </div>
        <Button
          onClick={fetchUsers}
          disabled={loading}
          className="rounded-2xl bg-purple-600 hover:bg-purple-700 font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Завантаження...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Оновити дані
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert className="rounded-2xl border-0 bg-red-50">
          <AlertDescription className="font-medium text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Всього користувачів
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900 tracking-tight">{users.length}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Активні підписки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-green-600 tracking-tight">{activeUsers}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Неактивні підписки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-red-600 tracking-tight">{inactiveUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-0 shadow-2xl rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-white/80 backdrop-blur-xl">
          <CardTitle className="flex items-center justify-between">
            <span className="text-xl font-semibold text-gray-900 tracking-tight">Список користувачів</span>
            {lastUpdate && (
              <span className="text-sm font-normal text-gray-500 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Оновлено: {lastUpdate}
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-gray-600">
            Дані з Google Sheets (ID: 1IhAUYQKcPjXetOGxCu-_YXxrj_kXt0QxKJCcGqPzZdo)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-100">
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Telegram</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Username</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Дата початку</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Дата закінчення</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-12">
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
                    <TableRow key={index} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium text-gray-900">{user.telegram}</TableCell>
                      <TableCell className="text-gray-700">
                        {user.username}
                        {user.username === ADMIN_USERNAME && (
                          <span className="ml-2 text-purple-600">👑</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-700">{user.startDate}</TableCell>
                      <TableCell className="text-gray-700">{user.endDate}</TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 rounded-full border-0">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Активна
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 px-3 py-1 rounded-full border-0">
                            <XCircle className="mr-1 h-3 w-3" />
                            Закінчилась
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