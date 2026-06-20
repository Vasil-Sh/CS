import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SPREADSHEET_ID_AUTH } from '@/lib/sheetsConfig';
import { logRender } from '@/lib/devLogger';
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
  Eye,
  EyeOff,
  Crown,
  User,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Zap
} from 'lucide-react';
import { CARD_BASE_STYLE, CARD_HOVER_STYLE, CHART_CARD_SHADOW } from '@/lib/cardStyles';
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

type StatusFilter = 'all' | 'active' | 'expired';
type SortDirection = 'asc' | 'desc' | null;

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

/** Strip any currency symbols ($, ₴, €, etc.) from a price string, keep only digits and separators */
const cleanPrice = (price: string): string => {
  return price.replace(/[$₴€£¥]/g, '').trim();
};

/** Parse DD/MM/YYYY to Date */
const parseDate = (dateStr: string): Date | null => {
  try {
    const [day, month, year] = dateStr.split('/').map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
  } catch {
    return null;
  }
};

/** Format Date to DD/MM/YYYY */
const formatDate = (d: Date): string => {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function Admin() {
  logRender('Admin');
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState('');
  const [showUsernames, setShowUsernames] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const currentUser = user?.username || '';

  // Filters & search & sort
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

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
    if (!isAdmin) {
      navigate('/app/matches');
      return;
    }
    fetchUsers();
  }, [isAdmin, navigate]);

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
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID_AUTH}/gviz/tq?tqx=out:csv`;
      
      const response = await fetch(url);
      const text = await response.text();
      
      const rows = text.split('\n').slice(1);
      const edits = loadUserEdits();
      const deletedList: string[] = JSON.parse(localStorage.getItem('adminDeletedUsers') || '[]');

      const parsedUsers: UserData[] = rows
        .filter(row => row.trim())
        .map(row => {
          const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (!matches || matches.length < 7) return null;
          
          const telegram = matches[0].replace(/"/g, '').trim();
          const username = matches[1].replace(/"/g, '').trim();
          const password = matches[2].replace(/"/g, '').trim();
          const priceMonth = cleanPrice(matches[3].replace(/"/g, '').trim());
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
        .filter((user): user is UserData => user !== null)
        .filter(u => !deletedList.includes(u.username));
      
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
      priceMonth: cleanPrice(newUser.priceMonth.trim()),
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
      priceMonth: cleanPrice(editingUser.priceMonth),
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

  // Extend subscription by 30 days
  const handleExtend = (index: number) => {
    const user = users[index];
    if (!user) return;

    // Base date: max(today, current endDate)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentEnd = parseDate(user.endDate);
    const baseDate = currentEnd && currentEnd > today ? currentEnd : today;

    const newEnd = new Date(baseDate);
    newEnd.setDate(newEnd.getDate() + 30);
    const newEndStr = formatDate(newEnd);

    const updated: UserData = {
      ...user,
      endDate: newEndStr,
      isActive: isSubscriptionActive(newEndStr),
      daysUntilExpiry: getDaysUntilExpiry(newEndStr),
    };

    if (user.isLocal) {
      const localUsers = loadLocalUsers();
      const localIdx = localUsers.findIndex(u => u.username === user.username);
      if (localIdx >= 0) {
        localUsers[localIdx] = updated;
        saveLocalUsers(localUsers);
      }
    } else {
      const edits = loadUserEdits();
      edits[user.username] = {
        ...edits[user.username],
        endDate: newEndStr,
      };
      saveUserEdits(edits);
    }

    setUsers(prev => prev.map((u, i) => i === index ? updated : u));
    toast.success(`Підписку продовжено на 30 днів — до ${newEndStr}`);
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

  // Toggle sort by end date
  const toggleSort = () => {
    setSortDirection(prev => {
      if (prev === null) return 'asc';
      if (prev === 'asc') return 'desc';
      return null;
    });
  };

  // ==== Business metrics ====
  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = users.filter(u => !u.isActive).length;
  const adminUsers = users.filter(u => u.isAdmin).length;
  const expiringUsers = users.filter(u => u.isActive && u.daysUntilExpiry !== undefined && u.daysUntilExpiry <= 3 && u.daysUntilExpiry >= 0);



  // ==== Filtered & sorted users for table ====
  const displayedUsers = useMemo(() => {
    let result = users.map((u, i) => ({ user: u, originalIndex: i }));

    // Status filter
    if (statusFilter === 'active') {
      result = result.filter(({ user }) => user.isActive);
    } else if (statusFilter === 'expired') {
      result = result.filter(({ user }) => !user.isActive);
    }

    // Search
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(({ user }) =>
        user.telegram.toLowerCase().includes(q) ||
        user.username.toLowerCase().includes(q)
      );
    }

    // Sort by end date
    if (sortDirection) {
      result = [...result].sort((a, b) => {
        const da = parseDate(a.user.endDate);
        const db = parseDate(b.user.endDate);
        const ta = da ? da.getTime() : 0;
        const tb = db ? db.getTime() : 0;
        return sortDirection === 'asc' ? ta - tb : tb - ta;
      });
    }

    return result;
  }, [users, statusFilter, searchQuery, sortDirection]);

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
  const cardBaseStyle = CARD_BASE_STYLE;

  const cardHoverStyle = CARD_HOVER_STYLE;

  const chartCardShadow = CHART_CARD_SHADOW;
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
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded px-1.5 py-0.5 leading-tight mt-0.5">
                Активний
              </span>
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
            className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5 group"
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
            className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5 group"
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
            className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5 group"
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
            className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5 group"
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
          className="bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-2xl overflow-hidden transition-all duration-300"
          style={{ boxShadow: chartCardShadow }}
        >
          <div className="bg-white border-b border-[#E5E7EB] p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
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
                Показано: {displayedUsers.length} з {users.length}
              </div>
            </div>

            {/* ===== TOOLBAR: filters + search + sort — single row ===== */}
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-3">
              {/* Status filter tabs */}
              <div className="inline-flex rounded-xl bg-white p-1 border border-[#E5E7EB] shadow-sm">
                {[
                  { key: 'all' as StatusFilter, label: 'Всі', count: users.length },
                  { key: 'active' as StatusFilter, label: 'Активні', count: activeUsers },
                  { key: 'expired' as StatusFilter, label: 'Прострочені', count: inactiveUsers },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      statusFilter === tab.key
                        ? 'bg-[#111827] text-white shadow-sm'
                        : 'text-[#6B7280] hover:text-[#374151] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-2 text-xs font-semibold ${statusFilter === tab.key ? 'text-[#93C5FD]' : 'text-[#9CA3AF]'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" strokeWidth={1.5} />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Пошук за Telegram або username"
                  className="pl-9 rounded-xl border-[#E5E7EB] bg-white h-10 shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151]"
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                )}
              </div>

              {/* Sort dropdown */}
              <Select
                value={sortDirection ?? 'none'}
                onValueChange={(value) =>
                  setSortDirection(value === 'none' ? null : (value as SortDirection))
                }
              >
                <SelectTrigger className="rounded-xl border-[#E5E7EB] bg-white font-medium h-10 px-4 text-sm text-[#374151] w-auto min-w-[200px] shadow-sm">
                  <div className="flex items-center gap-2">
                    {sortDirection === 'asc' ? (
                      <ArrowUp className="h-4 w-4 text-[#3B82F6]" strokeWidth={1.5} />
                    ) : sortDirection === 'desc' ? (
                      <ArrowDown className="h-4 w-4 text-[#3B82F6]" strokeWidth={1.5} />
                    ) : (
                      <ArrowUpDown className="h-4 w-4 text-[#9CA3AF]" strokeWidth={1.5} />
                    )}
                    <SelectValue placeholder="Сортувати за датою" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#E5E7EB] shadow-lg">
                  <SelectItem value="none" className="rounded-lg">Без сортування</SelectItem>
                  <SelectItem value="asc" className="rounded-lg">Скоро закінчаться ↑</SelectItem>
                  <SelectItem value="desc" className="rounded-lg">Пізніше закінчаться ↓</SelectItem>
                </SelectContent>
              </Select>
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
                  <TableHead className={`text-xs font-medium text-[#6B7280] uppercase tracking-wider py-4 px-5 ${cellBorder}`}>
                    <button onClick={toggleSort} className="flex items-center gap-1 hover:text-[#111827] transition-colors">
                      Дата закінчення
                      {sortDirection === 'asc' ? (
                        <ArrowUp className="h-3 w-3" strokeWidth={2} />
                      ) : sortDirection === 'desc' ? (
                        <ArrowDown className="h-3 w-3" strokeWidth={2} />
                      ) : (
                        <ArrowUpDown className="h-3 w-3" strokeWidth={2} />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className={`text-xs font-medium text-[#6B7280] uppercase tracking-wider py-4 px-5 ${cellBorder}`}>Статус</TableHead>
                  <TableHead className={`text-xs font-medium text-[#6B7280] uppercase tracking-wider py-4 px-5 ${cellBorder}`}>Адмін</TableHead>
                  <TableHead className="text-xs font-medium text-[#6B7280] uppercase tracking-wider py-4 px-5 text-center">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedUsers.length === 0 ? (
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
                          <p className="text-[#6B7280]">
                            {searchQuery || statusFilter !== 'all'
                              ? 'Нічого не знайдено за вашими фільтрами'
                              : 'Немає даних'}
                          </p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedUsers.map(({ user, originalIndex }) => (
                    <TableRow 
                      key={originalIndex} 
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
                          {cleanPrice(user.priceMonth)} грн
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
                            onClick={() => handleExtend(originalIndex)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F0FDF4] text-[#22C55E] transition-colors"
                            title="Продовжити на 30 днів"
                          >
                            <Zap className="h-4 w-4" strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => openEditDialog(user, originalIndex)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#EFF6FF] text-[#3B82F6] transition-colors"
                            title="Редагувати"
                          >
                            <Pencil className="h-4 w-4" strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => confirmDelete(originalIndex)}
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
                <Label className="text-[#111827] font-medium text-sm">Ціна / місяць (грн)</Label>
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
                  <Label className="text-[#111827] font-medium text-sm">Ціна / місяць (грн)</Label>
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