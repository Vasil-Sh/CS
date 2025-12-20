import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  RefreshCw, 
  Shield, 
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Plus,
  Trash2
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface User {
  telegram: string;
  username: string;
  password: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface RiskyTeam {
  name: string;
  game: string;
  status: string;
  notes: string;
}

const ADMIN_USERNAME = 'super_gus23_7482';

const INITIAL_RISKY_TEAMS: RiskyTeam[] = [
  { name: 'Liquid', game: 'CS', status: 'БАН', notes: '' },
  { name: 'Fish123', game: 'CS', status: 'БАН', notes: '' },
  { name: 'Passion Ua', game: 'CS', status: 'БАН', notes: '' },
  { name: 'Nemiga', game: 'CS', status: 'БАН', notes: '' },
  { name: 'Team Falcons', game: 'Дота', status: 'БАН', notes: 'В якій би не були вони формі, ніколи на них не ставити!!!!' },
  { name: 'Tyloo', game: 'CS', status: 'Рідко', notes: 'Рідко коли вистрілює як команда - хіба проти слабких опонентів' },
  { name: 'Mouz', game: 'Дота', status: 'Обережно', notes: 'Одну карту від них можна брати з форою +1.5. Не можна на них ставити коли грають у плей ін, тільки стадія відбору!' },
  { name: 'Parivision', game: 'Дота', status: 'Обережно', notes: 'Одну карту від них можна брати з форою +1.5, але ризиковано коли грають проти рівних команд. Уникати коли грають проти: 1.BB' },
  { name: 'Tundra', game: 'Дота', status: 'Обережно', notes: 'Одну карту від них можна брати з форою +1.5. Уникати коли грають проти: Xtreme Gaming' },
  { name: 'Aurora', game: 'Дота', status: 'БАН', notes: 'Уникати цю команду' },
  { name: 'Team Spirit', game: 'Дота', status: 'Обережно', notes: 'Не на загальну перемогу, тому тільки на +1.5, це команда клоунів і тому ризик того не вартий. Не ставити коли вони грають проти: Парі - BB - Falcons' },
  { name: 'B8', game: 'CS', status: 'Обережно', notes: 'Проти сильніших команд - краще не варто ставити - але на 1 карту з форою можна взяти' },
  { name: 'Furia', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти' },
  { name: 'Virtuspro', game: 'CS', status: 'БАН', notes: 'Раки - дуже рідко на них варто щось ставити хіба якийсь виняток' },
  { name: 'Monte', game: 'CS', status: 'БАН', notes: 'Раки - дуже рідко на них варто щось ставити хіба якийсь виняток - також варто пропускати матчі коли вони грають з рівними командами' },
  { name: 'Astralis', game: 'CS', status: 'Нестабільні', notes: 'Максимально нестабільні - Не на загальну перемогу, тільки на вибіркові карти - і то проти слабших команд, проти рівних вони ледь вивозять. Не виправданий ризик' },
  { name: 'Falcons', game: 'CS', status: 'Обережно', notes: 'Не ставити на них, коли грають фінал! Не дуже стабільна команда - якщо програють 1 карту то 2 можна взяти від них фору раундів, але краще брати +1.5' },
  { name: 'Bestia', game: 'CS', status: 'БАН', notes: 'Раки - краще не варто взагалі на цю команду дивитись - не стабільна команда' },
  { name: 'G2Areas', game: 'CS', status: 'Обережно', notes: 'Хіба проти слабких команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'The Mongolz', game: 'CS', status: 'Нестабільні', notes: 'Зараз не стабільні - краще ставити проти них, або уникати їх матчі' },
  { name: 'Natus Vincere', game: 'CS', status: 'Обережно', notes: 'Не ставити на них, коли грають проти рівних команд! Хіба проти слабших команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'Vitality', game: 'CS', status: 'Обережно', notes: 'Не ставити коли: 1.Фінали 2. проти - Маузів, Фурії' },
  { name: 'Eternal Fire', game: 'CS', status: 'БАН', notes: 'Команда яка частіше програє, дуже погана гра від них зазвичай, краще проти них з форою на карту +1.5' },
  { name: 'Nexus', game: 'CS', status: 'Обережно', notes: 'Раки - хіба проти слабших команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'Oddik', game: 'CS', status: 'Обережно', notes: 'Раки - Не на загальну перемогу, тільки на вибіркові карти, але краще проти них ставити' },
  { name: '9Z', game: 'CS', status: 'Нестабільні', notes: 'Не на загальну перемогу, тільки на вибіркові карти - у фіналі або пів фіналах виглядають - нестабільні' },
  { name: 'Mibr', game: 'CS', status: 'БАН', notes: 'Раки - На тір 1 взагалі нічого не можуть - можна взяти коли грають локальні бразильські матчі а так то не варто на них дивитись' },
  { name: 'Parivision', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркову карту Даст - поки не дуже стабільні' },
  { name: 'Tnl', game: 'CS', status: 'БАН', notes: 'Раки - грають дуже агресивно і проти трішки кращих команд то ніколи не працює - хіба проти слабших команд' },
  { name: 'Betclic', game: 'CS', status: 'БАН', notes: 'Раки - Дуже не стабільна команда' },
  { name: 'Sangal', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'Ence', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'Spirit Academy', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору +4.5' },
  { name: 'Fut', game: 'CS', status: 'Обережно', notes: 'Хіба проти ноунейм команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'Fluxo', game: 'CS', status: 'Обережно', notes: 'Хіба проти ноунейм команд - краще на загальну перемогу брати' },
  { name: '1Win', game: 'CS', status: 'БАН', notes: 'Не ставити на цю команду, рандом команда - більшість вони програють' },
  { name: 'ZeroTen', game: 'CS', status: 'БАН', notes: 'Краще не варто взагалі на цю команду дивитись - нестабільна команда' },
  { name: 'Eclot', game: 'CS', status: 'БАН', notes: 'Краще не варто взагалі на цю команду дивитись - нестабільна команда' },
  { name: 'Fnatic', game: 'CS', status: 'Обережно', notes: 'Хіба проти слабших команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'Mouz', game: 'CS', status: 'Обережно', notes: 'Хіба проти слабших команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'Cph Wolves', game: 'CS', status: 'Обережно', notes: 'Хіба проти слабших команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'Amkal', game: 'CS', status: 'БАН', notes: 'Краще не варто взагалі на цю команду дивитись - нестабільна команда' },
  { name: 'Wopa', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'BIG', game: 'CS', status: 'БАН', notes: 'Хіба проти слабших команд і то краще з форою' },
  { name: 'M80', game: 'CS', status: 'Нестабільні', notes: 'Краще не варто взагалі на цю команду дивитись - нестабільна команда, але все ж якщо то ставити на них тільки з форою +3.5 і більше' },
  { name: 'Ninjas In Pyjamas', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'G2', game: 'CS', status: 'Нестабільні', notes: 'Не стабільні, краще брати проти них, коли грають проти сильніших команд і рівних' },
  { name: '3Dmax', game: 'CS', status: 'Нестабільні', notes: 'Нестабільна команда, але все ж якщо то ставити на них тільки з форою +3.5 або фора на карту +1.5' },
  { name: 'Aurora', game: 'CS', status: 'Нестабільні', notes: 'Не стабільні! Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'Fnatic', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'Nrg', game: 'CS', status: 'Нестабільні', notes: 'Не стабільні! Не на загальну перемогу, тільки на мейн карту і то тільки на фору' },
  { name: 'Oddik', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на мейн карту і то тільки на фору' },
  { name: 'Inner Circle', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на мейн карту і то тільки на фору. Агресивно грають і переважно це не працює - а далі в них ідеї нема якщо агресія валиться' },
  { name: 'Gamerlegion', game: 'CS', status: 'БАН', notes: 'Рандом команда - Не на загальну перемогу, якщо виграють першу карту то варто 2 від них скіпнути - краще уникати команду' },
  { name: 'Legacy', game: 'CS', status: 'Обережно', notes: 'Краще уникати проти рівних команд - можуть взяти в хороший день проти топ1, але більшість ігор програють і не варто на них ставити' },
  { name: 'Galorys', game: 'CS', status: 'Обережно', notes: 'Команда рандом - тому тільки 1.5 на них - або краще проти них' },
  { name: 'Johnny Speeds', game: 'CS', status: 'Обережно', notes: 'На загальну перемогу не варто, а от одну карту від них можна' },
  { name: 'Gun5', game: 'CS', status: 'Обережно', notes: 'На загальну перемогу не варто, а от одну карту від них можна' },
  { name: 'Zero Tenacity', game: 'CS', status: 'БАН', notes: 'Команда рандом - краще уникати її - хіба проти них якщо грають проти рівних собі команд' },
  { name: 'Sinners', game: 'CS', status: 'Обережно', notes: 'На загальну перемогу не варто, а от одну карту від них можна' },
  { name: 'Cybershoke', game: 'CS', status: 'Нестабільні', notes: 'Не дуже стабільна команда якщо грають проти рівної команди можна взяти одну карту' },
  { name: 'Favbet', game: 'CS', status: 'Нестабільні', notes: 'Не дуже стабільна команда якщо грають проти рівної команди можна взяти одну карту' },
  { name: 'Faze', game: 'CS', status: 'Нестабільні', notes: 'Зараз на спаді - краще не ставити на них коли вони грають проти рівних команд' },
  { name: '9Ine', game: 'CS', status: 'Обережно', notes: 'Не на загальну від них - тільки на мейн карту і то якщо брати тільки з форою' },
  { name: 'Ecstatic', game: 'CS', status: 'Обережно', notes: 'Не на загальну від них - тільки на мейн карту і то якщо брати тільки з форою' },
  { name: 'Betera', game: 'CS', status: 'Нестабільні', notes: 'Не на загальну від них - виглядають нестабільно' },
  { name: 'Spirit', game: 'CS', status: 'Нестабільні', notes: 'Не стабільні поки! Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'GenOne', game: 'CS', status: 'Обережно', notes: 'Команда однієї карти, тому тільки 1.5 на них' },
  { name: 'ARCRED', game: 'CS', status: 'Обережно', notes: 'Команда однієї карти, тому тільки 1.5 на них' },
  { name: 'Venom', game: 'CS', status: 'БАН', notes: 'Не ставити на цю команду, рандом команда' },
  { name: 'Novaq', game: 'CS', status: 'Обережно', notes: 'Команда однієї карти, тому тільки 1.5 на них' },
  { name: 'Bb Team', game: 'Дота', status: 'Обережно', notes: 'Одну карту від них можна брати з форою +1.5, але ризиковано коли грають проти рівних команд тому краще пропускати такі матчі' },
  { name: 'Heroic', game: 'Дота', status: 'Обережно', notes: 'Досить слабка команда, можна брати проти них загальну перемогу, але краще сейв ставка +1.5 з експресом' },
  { name: 'OG', game: 'Дота', status: 'Обережно', notes: '+1.5 проти рівної команди може зайти' }
];

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState('');
  const currentUser = localStorage.getItem('currentUser');

  // Risky teams state
  const [riskyTeams, setRiskyTeams] = useState<RiskyTeam[]>(() => {
    const saved = localStorage.getItem('admin_risky_teams');
    return saved ? JSON.parse(saved) : INITIAL_RISKY_TEAMS;
  });
  const [newTeam, setNewTeam] = useState<RiskyTeam>({
    name: '',
    game: 'CS',
    status: 'Обережно',
    notes: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Check if user is admin
    if (currentUser !== ADMIN_USERNAME) {
      navigate('/matches');
      return;
    }

    // Load users on mount
    fetchUsers();
  }, [currentUser, navigate]);

  // Save risky teams to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('admin_risky_teams', JSON.stringify(riskyTeams));
  }, [riskyTeams]);

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

  const addRiskyTeam = () => {
    if (!newTeam.name.trim()) return;
    
    setRiskyTeams([...riskyTeams, { ...newTeam }]);
    setNewTeam({
      name: '',
      game: 'CS',
      status: 'Обережно',
      notes: ''
    });
  };

  const deleteRiskyTeam = (index: number) => {
    setRiskyTeams(riskyTeams.filter((_, i) => i !== index));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'БАН':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'Нестабільні':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'Обережно':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'Рідко':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const filteredTeams = riskyTeams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.game.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = users.filter(u => !u.isActive).length;

  const teamsByGame = {
    CS: filteredTeams.filter(t => t.game === 'CS'),
    Дота: filteredTeams.filter(t => t.game === 'Дота')
  };

  const teamsByStatus = {
    БАН: filteredTeams.filter(t => t.status === 'БАН'),
    Нестабільні: filteredTeams.filter(t => t.status === 'Нестабільні'),
    Обережно: filteredTeams.filter(t => t.status === 'Обережно'),
    Рідко: filteredTeams.filter(t => t.status === 'Рідко')
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-purple-600" />
            Адмін панель
          </h1>
          <p className="text-gray-600 mt-1">
            Управління користувачами, підписками та ризиковими командами
          </p>
        </div>
        <Button
          onClick={fetchUsers}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700"
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
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Користувачі</TabsTrigger>
          <TabsTrigger value="teams">Ризикові команди</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Всього користувачів
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{users.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-900 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Активні підписки
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900">{activeUsers}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-900 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Неактивні підписки
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-900">{inactiveUsers}</div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Список користувачів</span>
                {lastUpdate && (
                  <span className="text-sm font-normal text-gray-500 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Оновлено: {lastUpdate}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Дані з Google Sheets (ID: 1IhAUYQKcPjXetOGxCu-_YXxrj_kXt0QxKJCcGqPzZdo)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Telegram</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Дата початку</TableHead>
                      <TableHead>Дата закінчення</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          {loading ? 'Завантаження...' : 'Немає даних'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{user.telegram}</TableCell>
                          <TableCell>
                            {user.username}
                            {user.username === ADMIN_USERNAME && (
                              <span className="ml-2 text-purple-600">👑</span>
                            )}
                          </TableCell>
                          <TableCell>{user.startDate}</TableCell>
                          <TableCell>{user.endDate}</TableCell>
                          <TableCell>
                            {user.isActive ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Активна
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
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
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          {/* Stats Cards for Teams */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Всього команд
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900">{riskyTeams.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-900">
                  БАН
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-900">{teamsByStatus.БАН.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-900">
                  Нестабільні
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900">{teamsByStatus.Нестабільні.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-900">
                  Обережно
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-900">{teamsByStatus.Обережно.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Add New Team */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Додати нову команду
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Назва команди</label>
                  <Input
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="Введіть назву команди"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Гра</label>
                  <select
                    value={newTeam.game}
                    onChange={(e) => setNewTeam({ ...newTeam, game: e.target.value })}
                    className="w-full p-2 border rounded-md mt-1"
                  >
                    <option value="CS">CS</option>
                    <option value="Дота">Дота</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Статус</label>
                  <select
                    value={newTeam.status}
                    onChange={(e) => setNewTeam({ ...newTeam, status: e.target.value })}
                    className="w-full p-2 border rounded-md mt-1"
                  >
                    <option value="БАН">БАН</option>
                    <option value="Нестабільні">Нестабільні</option>
                    <option value="Обережно">Обережно</option>
                    <option value="Рідко">Рідко</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Примітки</label>
                  <Textarea
                    value={newTeam.notes}
                    onChange={(e) => setNewTeam({ ...newTeam, notes: e.target.value })}
                    placeholder="Додайте примітки про команду"
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
              <Button
                onClick={addRiskyTeam}
                className="mt-4 bg-purple-600 hover:bg-purple-700"
                disabled={!newTeam.name.trim()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Додати команду
              </Button>
            </CardContent>
          </Card>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Пошук команд</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук за назвою, грою, статусом або примітками..."
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Teams by Game */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CS Teams */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>CS:GO команди</span>
                  <Badge variant="outline">{teamsByGame.CS.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {teamsByGame.CS.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Немає команд CS</p>
                  ) : (
                    teamsByGame.CS.map((team, index) => (
                      <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{team.name}</h3>
                              <Badge className={getStatusBadge(team.status)}>
                                {team.status}
                              </Badge>
                            </div>
                            {team.notes && (
                              <p className="text-sm text-gray-600">{team.notes}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRiskyTeam(riskyTeams.findIndex(t => t === team))}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dota Teams */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Dota 2 команди</span>
                  <Badge variant="outline">{teamsByGame.Дота.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {teamsByGame.Дота.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Немає команд Dota 2</p>
                  ) : (
                    teamsByGame.Дота.map((team, index) => (
                      <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{team.name}</h3>
                              <Badge className={getStatusBadge(team.status)}>
                                {team.status}
                              </Badge>
                            </div>
                            {team.notes && (
                              <p className="text-sm text-gray-600">{team.notes}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRiskyTeam(riskyTeams.findIndex(t => t === team))}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}