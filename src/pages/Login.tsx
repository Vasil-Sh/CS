import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, AlertTriangle, User, Lock, Crown, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Animated background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-violet-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-fuchsia-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Glassmorphism card */}
      <Card className="w-full max-w-md border border-white/10 shadow-2xl rounded-3xl overflow-hidden bg-black/40 backdrop-blur-2xl relative z-10">
        {/* Liquid gradient border effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-600/50 via-violet-600/50 to-fuchsia-600/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"></div>
        
        <CardHeader className="space-y-4 pb-8 pt-10 relative">
          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-2 h-2 bg-purple-500 rounded-full animate-float"></div>
            <div className="absolute top-20 right-20 w-1 h-1 bg-violet-500 rounded-full animate-float animation-delay-1000"></div>
            <div className="absolute bottom-20 left-1/4 w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-float animation-delay-2000"></div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative group">
              {/* Glow effect */}
              <div className={`absolute inset-0 ${isAdminLogin ? 'bg-gradient-to-br from-purple-600 to-fuchsia-600' : 'bg-gradient-to-br from-purple-600 to-violet-600'} rounded-3xl blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-300`}></div>
              
              {/* Icon container with glassmorphism */}
              <div className={`relative w-20 h-20 ${isAdminLogin ? 'bg-gradient-to-br from-purple-600/90 to-fuchsia-600/90' : 'bg-gradient-to-br from-purple-600/90 to-violet-600/90'} rounded-3xl flex items-center justify-center shadow-lg backdrop-blur-xl border border-white/20 transform hover:scale-110 transition-all duration-300 hover:rotate-6`}>
                {isAdminLogin ? (
                  <Crown className="w-10 h-10 text-white drop-shadow-lg" />
                ) : (
                  <Sparkles className="w-10 h-10 text-white drop-shadow-lg" />
                )}
              </div>
            </div>
          </div>

          <CardTitle className={`text-4xl font-bold text-center ${isAdminLogin ? 'bg-gradient-to-r from-purple-400 via-violet-400 to-fuchsia-400' : 'bg-gradient-to-r from-purple-400 to-violet-400'} bg-clip-text text-transparent tracking-tight`}>
            MatchIQ
            {isAdminLogin && (
              <div className="text-sm font-medium text-purple-400 mt-2 flex items-center justify-center gap-1.5 animate-pulse">
                <Crown className="h-4 w-4" />
                Режим адміністратора
              </div>
            )}
          </CardTitle>
          <CardDescription className="text-center text-gray-400 font-medium">
            {isAdminLogin ? 'Вхід з правами адміністратора' : 'Увійдіть до свого облікового запису'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-10 px-8">
          {subscriptionExpired && !isAdminLogin && (
            <Alert className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl shadow-lg backdrop-blur-xl">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              <AlertDescription className="ml-2 text-orange-300 font-medium">
                Ваша підписка закінчилась. Будь ласка, зверніться до адміністратора для продовження.
              </AlertDescription>
            </Alert>
          )}

          {isAdminLogin && (
            <Alert className="mb-6 bg-purple-500/10 border border-purple-500/30 rounded-2xl shadow-lg backdrop-blur-xl">
              <Crown className="h-5 w-5 text-purple-400" />
              <AlertDescription className="ml-2 text-purple-300 font-medium">
                Постійний доступ адміністратора • Без обмежень за терміном
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300 font-semibold text-sm flex items-center gap-2">
                <User className={`h-4 w-4 ${isAdminLogin ? 'text-purple-400' : 'text-violet-400'}`} />
                Юзернейм
              </Label>
              <div className="relative group">
                {/* Input glow effect */}
                <div className={`absolute inset-0 ${isAdminLogin ? 'bg-purple-600/20' : 'bg-violet-600/20'} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300`}></div>
                
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Введіть ваш юзернейм"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="off"
                  className={`relative bg-white/5 border border-white/10 rounded-2xl h-14 text-white placeholder:text-gray-500 ${isAdminLogin ? 'focus:border-purple-500/50 focus:ring-purple-500/20' : 'focus:border-violet-500/50 focus:ring-violet-500/20'} focus:ring-4 transition-all duration-300 pl-4 pr-12 text-base font-medium backdrop-blur-xl hover:bg-white/10 ${usernameBlurred ? 'blur-sm' : ''}`}
                />
                {isAdminLogin && (
                  <Crown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400 animate-pulse" />
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 font-semibold text-sm flex items-center gap-2">
                <Lock className={`h-4 w-4 ${isAdminLogin ? 'text-fuchsia-400' : 'text-purple-400'}`} />
                Пароль
              </Label>
              <div className="relative group">
                {/* Input glow effect */}
                <div className={`absolute inset-0 ${isAdminLogin ? 'bg-fuchsia-600/20' : 'bg-purple-600/20'} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300`}></div>
                
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Введіть ваш пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={`relative bg-white/5 border border-white/10 rounded-2xl h-14 text-white placeholder:text-gray-500 ${isAdminLogin ? 'focus:border-fuchsia-500/50 focus:ring-fuchsia-500/20' : 'focus:border-purple-500/50 focus:ring-purple-500/20'} focus:ring-4 transition-all duration-300 pl-4 pr-4 text-base font-medium backdrop-blur-xl hover:bg-white/10`}
                />
              </div>
            </div>

            {error && !subscriptionExpired && (
              <Alert className="bg-red-500/10 border border-red-500/30 rounded-2xl shadow-lg backdrop-blur-xl">
                <AlertDescription className="text-red-300 font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className={`w-full ${isAdminLogin ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 hover:from-purple-700 hover:via-violet-700 hover:to-fuchsia-700' : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700'} text-white font-semibold shadow-2xl rounded-2xl h-14 text-base transition-all duration-300 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98] border border-white/10 backdrop-blur-xl relative overflow-hidden group`}
              disabled={loading}
            >
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              
              <span className="relative z-10 flex items-center justify-center">
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
              </span>
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Захищено шифруванням • Безпечний вхід
              {isAdminLogin && (
                <span className="block mt-1 text-purple-400 font-medium">
                  👑 Постійний доступ адміністратора
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-20px);
            opacity: 1;
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}