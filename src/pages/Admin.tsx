import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { 
  Users, 
  RefreshCw, 
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
  User,
  Plus,
  Pencil,
  Trash2,
  Save,
  X
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
import { toast } from 'sonner';

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
  isLocal?: boolean; // locally added user
}

const EMPTY_USER: Omit<UserData, 'isActive' | 'daysUntilExpiry'> = {
  telegram: '',
  username: '',
  password: '',
  priceMonth: '',
  startDate: '',
  endDate: '',
  isAdmin: false,
  isLocal: true,
};

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState('');
  const [showUsernames, setShowUsernames] = useState(false);
  const userRole = localStorage.getItem('userRole');
  const currentUser = localStorage.getItem('username') || '';

  // Add user dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ ...EMPTY_USER });

  // Edit user dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  // Delete confirm dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number>(-1);

  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/app/matches');
      return;
    }
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
    } catch {
      return -1;
    }
  };

  const isSubscriptionActive = (endDateStr: string): boolean => {
    const daysLeft = getDaysUntilExpiry(endDateStr);
    return daysLeft >= 0;
  };

  const loadLocalUsers = (): UserData[] => {
    try {
      const saved = localStorage.getItem('adminLocalUsers');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading local users:', e);
    }
    return [];
  };

  const saveLocalUsers = (localUsers: UserData[]) => {
    localStorage.setItem('adminLocalUsers', JSON.stringify(localUsers));
  };

  // Load edits overlay (for editing Google Sheets users locally)
  const loadUserEdits = (): Record<string, Partial<UserData>> => {
    try {
      const saved = localStorage.getItem('adminUserEdits');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading user edits:', e);
    }
    return {};
  };

  const saveUserEdits = (edits: Record<string, Partial<UserData>>) => {
    localStorage.setItem('adminUserEdits', JSON.stringify(edits));
  };

  const applyEditsToUser = (user: UserData, edits: Record<string, Partial<UserData>>): UserData => {
    const key = user.username;
    if (edits[key]) {
      const edited = { ...user, ...edits[key] };
      edited.isActive = isSubscriptionActive(edited.endDate);
      edited.daysUntilExpiry = getDaysUntilExpiry(edited.endDate);
      return edited;
    }
    return user;
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
      const edits = loadUserEdits();

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
          
          const user: UserData = {
            telegram,
            username,
            password,
            priceMonth,
            startDate,
            endDate,
            isActive: isSubscriptionActive(endDate),
            isAdmin: isAdminStr === 'true' || isAdminStr === '1' || isAdminStr === 'yes',
            daysUntilExpiry: daysLeft,
            isLocal: false,
          };

          return applyEditsToUser(user, edits);
        })
        .filter((user): user is UserData => user !== null);
      
      // Merge with local users
      const localUsers = loadLocalUsers().map(u => ({
        ...u,
        isActive: isSubscriptionActive(u.endDate),
        daysUntilExpiry: getDaysUntilExpiry(u.endDate),
      }));

      setUsers([...parsedUsers, ...localUsers]);
      setLastUpdate(new Date().toLocaleString('uk-UA'));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Помилка завантаження даних користувачів');
    } finally {
      setLoading(false);
    }
  };

  // Add new user
  const handleAddUser = () => {
    if (!newUser.username.trim() || !newUser.telegram.trim()) {
      toast.error('Заповніть Telegram та Username');
      return;
    }

    // Check duplicate
    if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase().trim())) {
      toast.error('Користувач з таким username вже існує');
      return;
    }

    const userData: UserData = {
      ...newUser,
      telegram: newUser.telegram.trim(),
      username: newUser.username.trim(),
      password: newUser.password.trim(),
      priceMonth: newUser.priceMonth.trim(),
      startDate: newUser.startDate.trim(),
      endDate: newUser.endDate.trim(),
      isActive: isSubscriptionActive(newUser.endDate),
      daysUntilExpiry: getDaysUntilExpiry(newUser.endDate),
      isLocal: true,
    };

    const localUsers = loadLocalUsers();
    localUsers.push(userData);
    saveLocalUsers(localUsers);

    setUsers(prev => [...prev, userData]);
    setNewUser({ ...EMPTY_USER });
    setAddDialogOpen(false);
    toast.success(`Користувача "${userData.username}" додано!`);
  };

  // Open edit dialog
  const openEditDialog = (user: UserData, index: number) => {
    setEditingUser({ ...user });
    setEditingIndex(index);
    setEditDialogOpen(true);
  };

  // Save edit
  const handleSaveEdit = () => {
    if (!editingUser) return;

    const updated: UserData = {
      ...editingUser,
      isActive: isSubscriptionActive(editingUser.endDate),
      daysUntilExpiry: getDaysUntilExpiry(editingUser.endDate),
    };

    if (editingUser.isLocal) {
      // Update local user
      const localUsers = loadLocalUsers();
      const localIdx = localUsers.findIndex(u => u.username === users[editingIndex]?.username);
      if (localIdx >= 0) {
        localUsers[localIdx] = updated;
        saveLocalUsers(localUsers);
      }
    } else {
      // Save edit overlay for Google Sheets user
      const edits = loadUserEdits();
      const originalUsername = users[editingIndex]?.username;
      if (originalUsername) {
        edits[originalUsername] = {
          telegram: updated.telegram,
          username: updated.username,
          password: updated.password,
          priceMonth: updated.priceMonth,
          startDate: updated.startDate,
          endDate: updated.endDate,
          isAdmin: updated.isAdmin,
        };
        saveUserEdits(edits);
      }
    }

    setUsers(prev => prev.map((u, i) => i === editingIndex ? updated : u));
    setEditDialogOpen(false);
    setEditingUser(null);
    setEditingIndex(-1);
    toast.success('Дані користувача оновлено!');
  };

  // Delete user
  const confirmDelete = (index: number) => {
    setDeletingIndex(index);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (deletingIndex < 0) return;
    const user = users[deletingIndex];

    if (user.isLocal) {
      const localUsers = loadLocalUsers().filter(u => u.username !== user.username);
      saveLocalUsers(localUsers);
    } else {
      // For Google Sheets users, we just hide them via a "deleted" list
      const deleted: string[] = JSON.parse(localStorage.getItem('adminDeletedUsers') || '[]');
      deleted.push(user.username);
      localStorage.setItem('adminDeletedUsers', JSON.stringify(deleted));
    }

    setUsers(prev => prev.filter((_, i) => i !== deletingIndex));
    setDeleteDialogOpen(false);
    setDeletingIndex(-1);
    toast.success(`Користувача "${user.username}" видалено!`);
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

  // Card hover style
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
  const cellBorder = 'border-r border-[#E5E7EB]';

  // Today's date in DD/MM/YYYY format for default values
  const todayFormatted = (() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  })();

  const monthLaterFormatted = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  })();

  return (
    <div className="min-h-screen bg-[#f3f3f3] relative">

      {/* ===== HEADER ===== */}
      <div className="px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-[48px] font-semibold text-[#111827] leading-tight tracking-tight">
            Адмін панель
          </h1>

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

      {/* Main Content */}
      <div className="relative z-10 space-y-8 px-6 lg:px-8 pb-8 pt-4">

        {error && (
          <Alert className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-5">
            <AlertTriangle className="h-5 w-5 text-[#EF4444]" strokeWidth={1.5} />
            <AlertDescription className="text-sm text-[#DC2626] ml-2">{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons Row — always visible */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={fetchUsers}
            disabled={loading}
            className="rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white font-medium h-10 px-5 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} />
                Завантаження...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Оновити дані
              </>
            )}
          </Button>

          <Button
            onClick={() => setShowUsernames(!showUsernames)}
            variant="outline"
            className="rounded-xl border-[#E5E7EB] font-medium h-10 px-5 text-sm text-[#374151]"
          >
            {showUsernames ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Приховати дані
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Показати дані
              </>
            )}
          </Button>

          <Button
            onClick={() => {
              setNewUser({
                ...EMPTY_USER,
                startDate: todayFormatted,
                endDate: monthLaterFormatted,
              });
              setAddDialogOpen(true);
            }}
            className="rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-medium h-10 px-5 text-sm"
          >
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Додати користувача
          </Button>
        </div>

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
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
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
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
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
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
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
            onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
            onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
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
              <div className="text-sm text-[#9CA3AF]">
                {users.length} {users.length === 1 ? 'користувач' : users.length < 5 ? 'користувачі' : 'користувачів'}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB] border-b border-[#D1D5DB]">
                  <TableHead className={`text-xs font-medium text-[#6B7280] uppercase tracking-wider py-4 px-5 ${cellBorder}`}>Telegram</TableHead>
                  <TableHead className={`text-xs font-medium text-[#6B7280] uppercase tracking-wider py-4 px-5 ${cellBorder}`}>Username</TableHead>
                  <TableHead className={`text-xs font-medium text-[#6B7280] uppercase tracking-wider py-4 px-5 ${cellBorder}`}>Ціна</TableHead>
                  <TableHead className={`text-xs font-medium text-[#6B7280] uppercase tracking-wider py-4 px-5 ${cellBorder}`}>Дата початку</TableHead>
                  <TableHead className={`text-xs font-medium text-[#6B7280] uppercase tracking-wider py-4 px-5 ${cellBorder}`}>Дата закінчення</TableHead>
                  <TableHead className={`text-xs font-medium text-[#6B7280] uppercase tracking-wider py-4 px-5 ${cellBorder}`}>Статус</TableHead>
                  <TableHead className={`text-xs font-medium text-[#6B7280] uppercase tracking-wider py-4 px-5 ${cellBorder}`}>Адмін</TableHead>
                  <TableHead className="text-xs font-medium text-[#6B7280] uppercase tracking-wider py-4 px-5 text-center">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-[#9CA3AF] py-16 text-sm">
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
                      className={`border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors ${
                        user.isActive && user.daysUntilExpiry !== undefined && user.daysUntilExpiry <= 3 && user.daysUntilExpiry >= 0
                          ? 'bg-[#FFFBEB]/50'
                          : ''
                      }`}
                    >
                      <TableCell className={`font-medium text-[#111827] py-4 px-5 text-sm ${cellBorder}`}>
                        {renderTelegram(user.telegram)}
                        {user.isLocal && (
                          <Badge className="ml-2 bg-[#EFF6FF] text-[#3B82F6] hover:bg-[#EFF6FF] px-1.5 py-0.5 rounded text-[10px] border-0 font-medium">
                            LOCAL
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className={`text-[#6B7280] py-4 px-5 text-sm ${cellBorder}`}>
                        {renderUsername(user.username)}
                        {user.isAdmin && (
                          <span className="ml-1.5">👑</span>
                        )}
                      </TableCell>
                      <TableCell className={`py-4 px-5 ${cellBorder}`}>
                        <Badge className="bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] px-3 py-1.5 rounded-lg border border-[#BBF7D0] font-medium text-xs">
                          <DollarSign className="mr-1 h-3.5 w-3.5" strokeWidth={1.5} />
                          {user.priceMonth}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-[#6B7280] py-4 px-5 text-sm ${cellBorder}`}>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#9CA3AF]" strokeWidth={1.5} />
                          {user.startDate}
                        </div>
                      </TableCell>
                      <TableCell className={`text-[#6B7280] py-4 px-5 text-sm ${cellBorder}`}>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#9CA3AF]" strokeWidth={1.5} />
                          {user.endDate}
                        </div>
                      </TableCell>
                      <TableCell className={`py-4 px-5 ${cellBorder}`}>
                        {getExpiryBadge(user)}
                      </TableCell>
                      <TableCell className={`py-4 px-5 ${cellBorder}`}>
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
                      <TableCell className="py-4 px-5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditDialog(user, index)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#EFF6FF] text-[#3B82F6] transition-colors"
                            title="Редагувати"
                          >
                            <Pencil className="h-4 w-4" strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => confirmDelete(index)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#FEF2F2] text-[#EF4444] transition-colors"
                            title="Видалити"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* ===== ADD USER DIALOG ===== */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="rounded-3xl max-w-lg border border-[#E5E7EB]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-[#111827]">
              <Plus className="h-5 w-5 text-[#22C55E]" strokeWidth={1.5} />
              Додати користувача
            </DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              Заповніть дані нового користувача
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#111827] font-medium text-sm">Telegram *</Label>
                <Input
                  value={newUser.telegram}
                  onChange={(e) => setNewUser({ ...newUser, telegram: e.target.value })}
                  placeholder="@username"
                  className="rounded-xl border-[#E5E7EB] mt-1.5"
                />
              </div>
              <div>
                <Label className="text-[#111827] font-medium text-sm">Username *</Label>
                <Input
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="login"
                  className="rounded-xl border-[#E5E7EB] mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#111827] font-medium text-sm">Пароль</Label>
                <Input
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="password"
                  className="rounded-xl border-[#E5E7EB] mt-1.5"
                />
              </div>
              <div>
                <Label className="text-[#111827] font-medium text-sm">Ціна / місяць</Label>
                <Input
                  value={newUser.priceMonth}
                  onChange={(e) => setNewUser({ ...newUser, priceMonth: e.target.value })}
                  placeholder="100"
                  className="rounded-xl border-[#E5E7EB] mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#111827] font-medium text-sm">Дата початку</Label>
                <div className="mt-1.5">
                  <DatePicker
                    value={newUser.startDate}
                    onChange={(val) => setNewUser({ ...newUser, startDate: val })}
                    placeholder="Оберіть дату"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[#111827] font-medium text-sm">Дата закінчення</Label>
                <div className="mt-1.5">
                  <DatePicker
                    value={newUser.endDate}
                    onChange={(val) => setNewUser({ ...newUser, endDate: val })}
                    placeholder="Оберіть дату"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-[#111827] font-medium text-sm">Роль</Label>
              <Select
                value={newUser.isAdmin ? 'admin' : 'user'}
                onValueChange={(val) => setNewUser({ ...newUser, isAdmin: val === 'admin' })}
              >
                <SelectTrigger className="rounded-xl border-[#E5E7EB] mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Користувач</SelectItem>
                  <SelectItem value="admin">Адміністратор</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              className="rounded-xl border-[#E5E7EB] font-medium"
            >
              <X className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Скасувати
            </Button>
            <Button
              onClick={handleAddUser}
              className="rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-medium"
            >
              <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Додати
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== EDIT USER DIALOG ===== */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-3xl max-w-lg border border-[#E5E7EB]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-[#111827]">
              <Pencil className="h-5 w-5 text-[#3B82F6]" strokeWidth={1.5} />
              Редагувати користувача
            </DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              Змініть дані користувача
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#111827] font-medium text-sm">Telegram</Label>
                  <Input
                    value={editingUser.telegram}
                    onChange={(e) => setEditingUser({ ...editingUser, telegram: e.target.value })}
                    className="rounded-xl border-[#E5E7EB] mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-[#111827] font-medium text-sm">Username</Label>
                  <Input
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="rounded-xl border-[#E5E7EB] mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#111827] font-medium text-sm">Пароль</Label>
                  <Input
                    value={editingUser.password}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    className="rounded-xl border-[#E5E7EB] mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-[#111827] font-medium text-sm">Ціна / місяць</Label>
                  <Input
                    value={editingUser.priceMonth}
                    onChange={(e) => setEditingUser({ ...editingUser, priceMonth: e.target.value })}
                    className="rounded-xl border-[#E5E7EB] mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#111827] font-medium text-sm">Дата початку</Label>
                  <div className="mt-1.5">
                    <DatePicker
                      value={editingUser.startDate}
                      onChange={(val) => setEditingUser({ ...editingUser, startDate: val })}
                      placeholder="Оберіть дату"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[#111827] font-medium text-sm">Дата закінчення</Label>
                  <div className="mt-1.5">
                    <DatePicker
                      value={editingUser.endDate}
                      onChange={(val) => setEditingUser({ ...editingUser, endDate: val })}
                      placeholder="Оберіть дату"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-[#111827] font-medium text-sm">Роль</Label>
                <Select
                  value={editingUser.isAdmin ? 'admin' : 'user'}
                  onValueChange={(val) => setEditingUser({ ...editingUser, isAdmin: val === 'admin' })}
                >
                  <SelectTrigger className="rounded-xl border-[#E5E7EB] mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Користувач</SelectItem>
                    <SelectItem value="admin">Адміністратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="rounded-xl border-[#E5E7EB] font-medium"
            >
              <X className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Скасувати
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium"
            >
              <Save className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Зберегти
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE CONFIRM DIALOG ===== */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-3xl border border-[#E5E7EB]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#EF4444]">
              <AlertTriangle className="h-5 w-5" strokeWidth={1.5} />
              Видалити користувача?
            </DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              {deletingIndex >= 0 && users[deletingIndex] && (
                <>
                  Ви впевнені, що хочете видалити користувача <span className="font-semibold text-[#111827]">&quot;{users[deletingIndex].username}&quot;</span>?
                  <br /><br />
                  Ця дія незворотна.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-xl border-[#E5E7EB] font-medium"
            >
              Скасувати
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="rounded-xl bg-[#EF4444] hover:bg-[#DC2626] font-medium"
            >
              <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}