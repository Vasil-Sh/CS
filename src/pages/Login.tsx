import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, AlertTriangle } from 'lucide-react';

interface User {
  username: string;
  password: string;
  endDate: string;
}

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Check if already logged in
    const currentUser = localStorage.getItem('currentUser');
    const endDate = localStorage.getItem('userEndDate');
    
    if (currentUser && endDate) {
      // Check if subscription is still valid
      if (isSubscriptionValid(endDate)) {
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
      console.log('Available users:', users);
      
      // Find user in the list
      const user = users.find(
        u => u.username === username && u.password === password
      );

      console.log('Found user:', user);

      if (user) {
        // Check if subscription is valid
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md bg-white border-gray-200 shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-md">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-gray-900">
            MatchIQ
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Увійдіть до свого облікового запису
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptionExpired && (
            <Alert className="mb-4 bg-orange-50 border-orange-200 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                Ваша підписка закінчилась. Будь ласка, зверніться до адміністратора для продовження.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700">
                Юзернейм
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Введіть ваш юзернейм"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                Пароль
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {error && !subscriptionExpired && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Завантаження...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Увійти
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}