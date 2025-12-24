import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, AlertTriangle, Sparkles, User, Lock, Crown } from 'lucide-react';

interface User {
  username: string;
  password: string;
  endDate: string;
}

// Permanent admin credentials
const ADMIN_CREDENTIALS = {
  username: 'super_gus23_7482',
  password: 'Kf527!Q'
};

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usernameBlurred, setUsernameBlurred] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const currentUser = localStorage.getItem('currentUser');
    const endDate = localStorage.getItem('userEndDate');
    
    if (currentUser) {
      // Admin has permanent access
      if (currentUser === ADMIN_CREDENTIALS.username) {
        navigate('/matches');
        return;
      }
      
      // Regular user - check subscription
      if (endDate && isSubscriptionValid(endDate)) {
        navigate('/matches');
      } else {
        // Subscription expired, logout user
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userEndDate');
        setSubscriptionExpired(true);
      }
    }

    // Fetch users from Google Sheets
    fetchUsers();
  }, [navigate]);

  const isSubscriptionValid = (endDateStr: string): boolean => {
    try {
      // Parse date in format DD/MM/YYYY
      const [day, month, year] = endDateStr.split('/').map(Number);
      const endDate = new Date(year, month - 1, day);
      const today = new Date();
      
      // Set time to start of day for accurate comparison
      today.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      return endDate >= today;
    } catch (err) {
      console.error('Error parsing date:', err);
      return false;
    }
  };

  const fetchUsers = async () => {
    try {
      const SHEET_ID = '1IhAUYQKcPjXetOGxCu-_YXxrj_kXt0QxKJCcGqPzZdo';
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
      
      const response = await fetch(url);
      const text = await response.text();
      
      console.log('Raw CSV data:', text);
      
      // Parse CSV - 5 columns: Users Telegram, UserName, Password, StartDate, EndDate
      const rows = text.split('\n').slice(1); // Skip header
      const parsedUsers: User[] = rows
        .filter(row => row.trim())
        .map(row => {
          // Handle CSV parsing with quotes
          const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (!matches || matches.length < 5) return null;
          
          const username = matches[1].replace(/"/g, '').trim();
          const password = matches[2].replace(/"/g, '').trim();
          const endDate = matches[4].replace(/"/g, '').trim();
          
          console.log('Parsed user:', { username, password, endDate });
          
          return {
            username,
            password,
            endDate,
          };
        })
        .filter((user): user is User => user !== null);
      
      console.log('All parsed users:', parsedUsers);
      setUsers(parsedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Помилка завантаження даних користувачів');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubscriptionExpired(false);
    setLoading(true);

    try {
      console.log('Attempting login with:', { username, password });
      
      // Check for admin login first (permanent access)
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        console.log('Admin login successful');
        localStorage.setItem('currentUser', username);
        localStorage.setItem('userEndDate', '31/12/2099'); // Set far future date for admin
        navigate('/matches');
        return;
      }
      
      console.log('Available users:', users);
      
      // Find regular user in the list
      const user = users.find(
        u => u.username === username && u.password === password
      );

      console.log('Found user:', user);

      if (user) {
        // Check if subscription is valid for regular users
        if (!isSubscriptionValid(user.endDate)) {
          setSubscriptionExpired(true);
          setError('Ваша підписка закінчилась. Будь ласка, продовжіть підписку.');
          setLoading(false);
          return;
        }

        // Save user session with end date
        localStorage.setItem('currentUser', user.username);
        localStorage.setItem('userEndDate', user.endDate);
        
        // Redirect to matches page
        navigate('/matches');
      } else {
        setError('Невірний логін або пароль');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Помилка авторизації');
    } finally {
      setLoading(false);
    }
  };

  const isAdminLogin = username === ADMIN_CREDENTIALS.username;

  // Check if username field should be blurred for admin
  useEffect(() => {
    setUsernameBlurred(isAdminLogin && username.length > 0);
  }, [isAdminLogin, username]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/90 backdrop-blur-xl">
        <CardHeader className="space-y-4 pb-8 pt-10">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className={`w-20 h-20 ${isAdminLogin ? 'bg-gradient-to-br from-purple-500 to-yellow-500' : 'bg-gradient-to-br from-blue-500 to-purple-600'} rounded-3xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200`}>
                {isAdminLogin ? (
                  <Crown className="w-10 h-10 text-white" />
                ) : (
                  <Sparkles className="w-10 h-10 text-white" />
                )}
              </div>
            </div>
          </div>
          <CardTitle className={`text-3xl font-bold text-center ${isAdminLogin ? 'bg-gradient-to-r from-purple-600 to-yellow-600' : 'bg-gradient-to-r from-blue-600 to-purple-600'} bg-clip-text text-transparent tracking-tight`}>
            MatchIQ
            {isAdminLogin && (
              <div className="text-sm font-medium text-purple-600 mt-1 flex items-center justify-center gap-1">
                <Crown className="h-4 w-4" />
                Режим адміністратора
              </div>
            )}
          </CardTitle>
          <CardDescription className="text-center text-gray-600 font-medium">
            {isAdminLogin ? 'Вхід з правами адміністратора' : 'Увійдіть до свого облікового запису'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-10 px-8">
          {subscriptionExpired && !isAdminLogin && (
            <Alert className="mb-6 bg-orange-50 border border-orange-200 rounded-2xl shadow-sm">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <AlertDescription className="ml-2 text-orange-800 font-medium">
                Ваша підписка закінчилась. Будь ласка, зверніться до адміністратора для продовження.
              </AlertDescription>
            </Alert>
          )}

          {isAdminLogin && (
            <Alert className="mb-6 bg-purple-50 border border-purple-200 rounded-2xl shadow-sm">
              <Crown className="h-5 w-5 text-purple-600" />
              <AlertDescription className="ml-2 text-purple-800 font-medium">
                Постійний доступ адміністратора • Без обмежень за терміном
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-semibold text-sm flex items-center gap-2">
                <User className={`h-4 w-4 ${isAdminLogin ? 'text-purple-600' : 'text-blue-600'}`} />
                Юзернейм
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Введіть ваш юзернейм"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="off"
                  className={`bg-white border-2 border-gray-200 rounded-2xl h-14 text-gray-900 placeholder:text-gray-400 ${isAdminLogin ? 'focus:border-purple-500 focus:ring-purple-100' : 'focus:border-blue-500 focus:ring-blue-100'} focus:ring-4 transition-all duration-200 pl-4 pr-4 text-base font-medium ${usernameBlurred ? 'blur-sm' : ''}`}
                />
                {isAdminLogin && (
                  <Crown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-500" />
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-semibold text-sm flex items-center gap-2">
                <Lock className={`h-4 w-4 ${isAdminLogin ? 'text-yellow-600' : 'text-purple-600'}`} />
                Пароль
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Введіть ваш пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={`bg-white border-2 border-gray-200 rounded-2xl h-14 text-gray-900 placeholder:text-gray-400 ${isAdminLogin ? 'focus:border-yellow-500 focus:ring-yellow-100' : 'focus:border-purple-500 focus:ring-purple-100'} focus:ring-4 transition-all duration-200 pl-4 pr-4 text-base font-medium`}
                />
              </div>
            </div>

            {error && !subscriptionExpired && (
              <Alert className="bg-red-50 border border-red-200 rounded-2xl shadow-sm">
                <AlertDescription className="text-red-800 font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className={`w-full ${isAdminLogin ? 'bg-gradient-to-r from-purple-600 to-yellow-600 hover:from-purple-700 hover:to-yellow-700' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'} text-white font-semibold shadow-lg rounded-2xl h-14 text-base transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Завантаження...
                </>
              ) : (
                <>
                  {isAdminLogin ? (
                    <Crown className="mr-2 h-5 w-5" />
                  ) : (
                    <LogIn className="mr-2 h-5 w-5" />
                  )}
                  {isAdminLogin ? 'Увійти як адмін' : 'Увійти'}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Захищено шифруванням • Безпечний вхід
              {isAdminLogin && (
                <span className="block mt-1 text-purple-600 font-medium">
                  👑 Постійний доступ адміністратора
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}