import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Download, 
  Upload,
  Shield,
  Calendar,
  Database,
  FileDown,
  FileUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Palette,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';
import { CARD_BASE_STYLE, CARD_HOVER_STYLE, CHART_CARD_SHADOW } from '@/lib/cardStyles';
import { toast } from 'sonner';
import { UserDataService } from '@/lib/userDataService';

import { useAuth } from '@/contexts/AuthContext';
import { t, setLang, getLang, type Lang } from '@/lib/i18n';
import { useTheme } from '@/hooks/useTheme';
import { logRender } from '@/lib/devLogger';

export default function Profile() {
  logRender('Profile');
  const { user } = useAuth();
  const username = user?.username || 'User';
  const isAdmin = user?.role === 'admin';
  const [language, setLanguage] = useState<Lang>(getLang);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('interface');
  const [simResetKey, setSimResetKey] = useState(0);
  
  const { theme, toggleTheme } = useTheme();

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    if (newTheme !== theme) {
      toggleTheme();
    }
    toast.success(newTheme === 'dark' ? 'Темна тема активована' : 'Світла тема активована');
  };

  const handleLanguageChange = (newLang: Lang) => {
    setLang(newLang);
    setLanguage(newLang);
    toast.success(newLang === 'uk' ? 'Мова: Українська' : 'Language: English');
  };

  // ── Shared keys (everyone) ──
  const SHARED_KEYS = [
    'authToken',
    'userRole',
    'username',
    'admin_risky_teams',
    'matchiq_theme',
    'matchiq_lang',
    'ui-settings',
    'match_ratings',
  ] as const;

  // ── Admin-only keys ──
  const ADMIN_KEYS = [
    'adminLocalUsers',
    'adminUserEdits',
    'adminDeletedUsers',
  ] as const;

  // Keys to NEVER include in backup (security, ephemeral)
  const FORBIDDEN_BACKUP_KEYS = new Set([
    'google_sheets_api_key',
    'currentUser',
  ]);

  // Auto-collect user-scoped keys for the CURRENT user
  const collectMyUserKeys = (): string[] => {
    const prefix = `user_${username}_`;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && !FORBIDDEN_BACKUP_KEYS.has(key)) {
        keys.push(key);
      }
    }
    return keys;
  };

  // Admin only: auto-collect ALL user_* keys (all users)
  const collectAllUserKeys = (): string[] => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('user_') && !FORBIDDEN_BACKUP_KEYS.has(key)) {
        keys.push(key);
      }
    }
    return keys;
  };

  // Admin only: collect tilt-block keys for all users
  const collectTiltKeys = (): string[] => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tilt_block_')) {
        keys.push(key);
      }
    }
    return keys;
  };

  const getStorageSize = () => {
    let totalSize = 0;
    const keys = [...SHARED_KEYS, ...ADMIN_KEYS, ...collectMyUserKeys()];
    if (isAdmin) {
      keys.push(...collectAllUserKeys(), ...collectTiltKeys());
    }
    [...new Set(keys)].forEach(key => {
      const item = localStorage.getItem(key);
      if (item) totalSize += item.length * 2;
    });
    return (totalSize / 1024).toFixed(1);
  };

  const getDataStats = () => {
    const bets = UserDataService.getUserData(username, 'mybets_data', []);
    const riskyTeams = JSON.parse(localStorage.getItem('admin_risky_teams') || '[]');
    const strategies = UserDataService.getUserData(username, 'strategies_data', []);
    const goals = UserDataService.getUserData(username, 'goals', []);
    const tgGroups = UserDataService.getUserData(username, 'tg_groups', []);
    const tgBets = UserDataService.getUserData(username, 'tg_bets', []);

    return {
      bets: Array.isArray(bets) ? bets.length : 0,
      riskyTeams: Array.isArray(riskyTeams) ? riskyTeams.length : 0,
      strategies: Array.isArray(strategies) ? strategies.length : 0,
      goals: Array.isArray(goals) ? goals.length : 0,
      tgGroups: Array.isArray(tgGroups) ? tgGroups.length : 0,
      tgBets: Array.isArray(tgBets) ? tgBets.length : 0,
    };
  };

  const [stats, setStats] = useState(getDataStats());
  const [storageSize, setStorageSize] = useState(getStorageSize());

  useEffect(() => {
    const refresh = () => { setStats(getDataStats()); setStorageSize(getStorageSize()); };
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [username]);

  const exportBetsCSV = () => {
    const bets = UserDataService.getUserData(username, 'mybets_data', []);
    if (!Array.isArray(bets) || bets.length === 0) {
      toast.error('Немає ставок для експорту', { description: 'Додайте ставки через форму на сторінці Матчі' });
      return;
    }

    const headers = ['Дата', 'Матч', 'Команда 1', 'Команда 2', 'Гра', 'Турнір', 'Тип ставки', 'Формат', 'Коефіцієнт', 'Сума (UAH)', 'Результат', 'Прибуток (UAH)', 'ROI %', 'Стратегія', 'Нотатки'];
    const rows = bets.map((b: any) => [
      b.date || '',
      b.match || '',
      b.team1 || '',
      b.team2 || '',
      b.game || '',
      b.tournament || '',
      b.betType || '',
      b.format || '',
      b.odds ?? '',
      b.amount ?? '',
      b.result || '',
      b.profit ?? '',
      b.roi != null ? Math.round(b.roi * 100) / 100 : '',
      b.strategy || '',
      `"${(b.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `matchiq-bets-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`CSV експортовано! (${bets.length} ставок)`, {
      description: `Файл: matchiq-bets-${new Date().toISOString().slice(0, 10)}.csv`
    });
  };

  const exportFullBackup = () => {
    setIsExporting(true);
    try {
      const backupData: Record<string, unknown> = {
        _meta: {
          exportDate: new Date().toISOString(),
          appVersion: '1.14.0',
          username: username,
          isAdminBackup: isAdmin,
          format: 'matchiq-full-backup'
        }
      };

      // Helper: read and store a key
      const storeKey = (key: string) => {
        if (FORBIDDEN_BACKUP_KEYS.has(key)) return;
        const item = localStorage.getItem(key);
        if (item) {
          try { backupData[key] = JSON.parse(item); }
          catch { backupData[key] = item; }
        }
      };

      // 1) Shared keys (everyone)
      SHARED_KEYS.forEach(storeKey);

      // 2) My own user_* keys
      collectMyUserKeys().forEach(storeKey);

      // ── Admin-only ──
      if (isAdmin) {
        // 3) Admin panel keys
        ADMIN_KEYS.forEach(storeKey);
        // 4) ALL users' user_* keys
        collectAllUserKeys().forEach(storeKey);
        // 5) Tilt blocks for all users
        collectTiltKeys().forEach(storeKey);
      }

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `matchiq-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Повний бекап створено!', {
        description: `Файл: matchiq-backup-${new Date().toISOString().slice(0, 10)}.json`
      });
    } catch (error) {
      console.error('Backup export error:', error);
      toast.error('Помилка створення бекапу', {
        description: 'Не вдалося експортувати дані'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const importFullBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed._meta || parsed._meta.format !== 'matchiq-full-backup') {
          toast.error('Невірний формат файлу', {
            description: 'Файл не є бекапом MatchIQ. Використовуйте файл, створений через "Повний бекап".'
          });
          setIsImporting(false);
          return;
        }

        let restoredCount = 0;
        let skippedAdmin = 0;

        // Whitelist keys that current user is allowed to restore
        const adminKeySet = new Set(ADMIN_KEYS);
        const isAdminBackup = parsed._meta.isAdminBackup === true;

        Object.entries(parsed).forEach(([key, value]) => {
          if (key === '_meta') return;

          // Admin-only keys — only restore if current user is admin
          if (adminKeySet.has(key) && !isAdmin) {
            skippedAdmin++;
            return;
          }

          // Keys belonging to other users — only restore if admin
          if (key.startsWith('user_') && !key.startsWith(`user_${username}_`) && !isAdmin) {
            skippedAdmin++;
            return;
          }

          // Tilt blocks — only restore if admin
          if (key.startsWith('tilt_block_') && !isAdmin) {
            skippedAdmin++;
            return;
          }

          // User-scoped keys MUST be JSON-encoded (UserDataService.getUserData always does JSON.parse)
          // Other keys are read directly via localStorage.getItem() — store raw strings
          const strValue = key.startsWith('user_')
            ? JSON.stringify(value)
            : (typeof value === 'string' ? value : JSON.stringify(value));
          localStorage.setItem(key, strValue);
          restoredCount++;
        });

        const msg = `Бекап відновлено! (${restoredCount} записів)`;
        const descTail = isAdminBackup && !isAdmin
          ? ` (${skippedAdmin} адмін-записів пропущено)`
          : '';
        toast.success(msg, {
          description: `Дані з ${new Date(parsed._meta.exportDate).toLocaleDateString('uk-UA')} відновлені.${descTail} Сторінка перезавантажиться.`
        });

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (error) {
        console.error('Backup import error:', error);
        toast.error('Помилка відновлення', {
          description: 'Не вдалося прочитати файл бекапу. Перевірте формат.'
        });
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const cardBaseStyle = CARD_BASE_STYLE;

  const cardHoverStyle = CARD_HOVER_STYLE;

  const chartCardShadow = CHART_CARD_SHADOW;

  return (
    <div className="min-h-screen bg-[#f3f3f3] relative">
      {/* ===== HEADER - stays left-aligned ===== */}
      <div className="px-6 lg:px-8 pt-6 pb-6">
        <h1 className="text-[48px] font-semibold text-[#111827] leading-tight tracking-tight">
          Профіль
        </h1>
      </div>

      <div className="px-6 lg:px-8 pb-8 pt-4 space-y-8">

      {/* Data Statistics + User Info — unified card */}
      <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-5">

      {/* Data Statistics - 5 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        <div
          className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5"
          style={cardBaseStyle}
          onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
          onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
        >
          <p className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-1">Ваші ставки</p>
          <p className="text-2xl font-bold text-[#111827] tracking-tight">{stats.bets}</p>
        </div>
        <div
          className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5"
          style={cardBaseStyle}
          onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
          onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
        >
          <p className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-1">Ризикові команди</p>
          <p className="text-2xl font-bold text-[#111827] tracking-tight">{stats.riskyTeams}</p>
        </div>
        <div
          className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5"
          style={cardBaseStyle}
          onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
          onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
        >
          <p className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-1">Стратегії</p>
          <p className="text-2xl font-bold text-[#111827] tracking-tight">{stats.strategies}</p>
        </div>
        <div
          className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5"
          style={cardBaseStyle}
          onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
          onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
        >
          <p className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-1">Цілі</p>
          <p className="text-2xl font-bold text-[#111827] tracking-tight">{stats.goals}</p>
        </div>
        <div
          className="bg-white border border-[#F3F4F6] hover:border-[#D1D5DB] rounded-3xl px-6 py-5"
          style={cardBaseStyle}
          onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
          onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
        >
          <p className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-1">Telegram Групи</p>
          <p className="text-2xl font-bold text-[#111827] tracking-tight">{stats.tgGroups}</p>
        </div>
      </div>

      {/* User Info Card */}
      <Card className="border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-3xl bg-white transition-all duration-300" style={{ boxShadow: chartCardShadow }}>
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-[#447afc] rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(68,122,252,0.3)]">
              <User className="h-8 w-8 text-white" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-[#111827]">@{username}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] rounded-lg font-medium text-xs px-3 py-1">
                  <CheckCircle2 className="h-3 w-3 mr-1" strokeWidth={2} />
                  Активний
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      </div>

      {/* Quick Navigation Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm border-2 border-[#E8E6DC] p-3 rounded-[32px] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          {[
            { id: 'interface', label: 'Інтерфейс' },
            { id: 'backup', label: 'Бекап' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(isActive ? null : tab.id)}
                className={`relative rounded-[24px] px-6 py-4 font-light text-base transition-all duration-300 ease-in-out ${
                  isActive
                    ? 'bg-[#447afc] text-white shadow-[0_4px_16px_rgba(68,122,252,0.3)]'
                    : activeTab === null
                      ? 'bg-white text-[#111827] font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-[#D1D5DB] hover:bg-[#F5F5F3]'
                      : 'bg-transparent text-[#9CA3AF] hover:bg-[#F5F5F3] hover:text-[#6B7280]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme & Language Settings */}
      {(activeTab === null || activeTab === 'interface') && (
      <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <Card id="interface" className="border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-3xl bg-white overflow-hidden transition-all duration-300" style={{ boxShadow: chartCardShadow }}>
        <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-[#111827]">
            <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
              <Palette className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
            </div>
            Налаштування інтерфейсу
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Theme Switcher */}
          <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              {theme === 'light' ? (
                <Sun className="h-5 w-5 text-[#F59E0B]" strokeWidth={1.5} />
              ) : (
                <Moon className="h-5 w-5 text-[#6366F1]" strokeWidth={1.5} />
              )}
              <div>
                <p className="text-sm font-medium text-[#111827]">Тема оформлення</p>
                <p className="text-xs text-[#9CA3AF]">Оберіть зовнішній вигляд додатку</p>
              </div>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-full bg-[#E5E7EB]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleThemeChange('light')}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  theme === 'light'
                    ? 'bg-white text-[#111827] shadow-sm'
                    : 'text-[#6B7280] hover:text-[#111827] !bg-transparent hover:!bg-transparent'
                }`}
              >
                <Sun className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} />
                Світла
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleThemeChange('dark')}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  theme === 'dark'
                    ? 'bg-[#111827] text-white shadow-sm'
                    : 'text-[#6B7280] hover:text-[#111827] !bg-transparent hover:!bg-transparent'
                }`}
              >
                <Moon className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} />
                Темна
              </Button>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-[#111827]">Мова інтерфейсу</p>
                <p className="text-xs text-[#9CA3AF]">Оберіть мову відображення</p>
              </div>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-full bg-[#E5E7EB]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLanguageChange('uk')}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  language === 'uk'
                    ? 'bg-white text-[#111827] shadow-sm'
                    : 'text-[#6B7280] hover:text-[#111827] !bg-transparent hover:!bg-transparent'
                }`}
              >
                UA
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLanguageChange('en')}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  language === 'en'
                    ? 'bg-white text-[#111827] shadow-sm'
                    : 'text-[#6B7280] hover:text-[#111827] !bg-transparent hover:!bg-transparent'
                }`}
              >
                ENG
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
      )}

      {/* Backup Section */}
      {(activeTab === null || activeTab === 'backup') && (
      <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <Card id="backup" className="border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-3xl bg-white overflow-hidden transition-all duration-300" style={{ boxShadow: chartCardShadow }}>
        <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-[#111827]">
            <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
              <Database className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
            </div>
            Бекап даних
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Storage info */}
          <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-[#6B7280]" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-[#111827]">Розмір даних у localStorage</p>
                <p className="text-xs text-[#9CA3AF]">Усі дані додатку зберігаються локально у вашому браузері</p>
              </div>
            </div>
            <Badge className="bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-lg font-semibold text-sm px-3 py-1.5">
              {storageSize} KB
            </Badge>
          </div>

          {/* Export */}
          <div className="p-5 border border-[#E5E7EB] rounded-2xl hover:border-[#D1D5DB] transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#F0FDF4] rounded-xl flex-shrink-0">
                <FileDown className="h-6 w-6 text-[#16A34A]" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-[#111827] mb-1">Повний бекап всіх даних</h3>
                <p className="text-sm text-[#6B7280] mb-4">
                  Експортує всі ваші дані (ставки, команди, стратегії, цілі, Telegram-групи, налаштування) в один JSON файл. 
                  Використовуйте для збереження копії або перенесення на інший пристрій.
                </p>
                <Button
                  onClick={exportFullBackup}
                  disabled={isExporting}
                  className="bg-[#111827] hover:bg-[#1F2937] text-white rounded-xl text-sm px-6 font-semibold"
                >
                  {isExporting ? (
                    <>
                      <Download className="mr-2 h-4 w-4 animate-pulse" strokeWidth={2} />
                      Створення бекапу...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" strokeWidth={2} />
                      Завантажити повний бекап
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* CSV Export */}
          <div className="p-5 border border-[#E5E7EB] rounded-2xl hover:border-[#D1D5DB] transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#FFF7ED] rounded-xl flex-shrink-0">
                <FileSpreadsheet className="h-6 w-6 text-[#EA580C]" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-[#111827] mb-1">Експорт ставок у CSV</h3>
                <p className="text-sm text-[#6B7280] mb-4">
                  Вивантажує ваші ставки у формат CSV для аналізу в Excel або Google Sheets. 
                  Містить усі поля: дата, матч, команди, гра, турнір, коефіцієнт, сума, результат, прибуток, ROI, стратегія, нотатки.
                </p>
                <Button
                  onClick={exportBetsCSV}
                  className="bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-sm px-6 font-semibold"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" strokeWidth={2} />
                  Завантажити CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Import */}
          <div className="p-5 border border-[#E5E7EB] rounded-2xl hover:border-[#D1D5DB] transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#EFF6FF] rounded-xl flex-shrink-0">
                <FileUp className="h-6 w-6 text-[#2563EB]" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-[#111827] mb-1">Відновити з бекапу</h3>
                <p className="text-sm text-[#6B7280] mb-3">
                  Завантажте раніше створений файл бекапу для відновлення всіх даних. 
                  Поточні дані будуть замінені даними з файлу.
                </p>
                <div className="flex items-start gap-2 p-3 bg-[#FFFBEB] rounded-xl border border-[#FDE68A] mb-4">
                  <AlertTriangle className="h-4 w-4 text-[#D97706] flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                  <p className="text-xs text-[#92400E]">
                    <span className="font-semibold">Увага:</span> відновлення з бекапу замінить усі поточні дані. Рекомендуємо спочатку створити бекап поточних даних.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#447afc] hover:bg-[#5b8ffd] text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors shadow-[0_2px_8px_rgba(68,122,252,0.3)]">
                  <Upload className="h-4 w-4" strokeWidth={2} />
                  {isImporting ? 'Відновлення...' : 'Обрати файл бекапу'}
                  <input
                    type="file"
                    accept=".json"
                    onChange={importFullBackup}
                    className="hidden"
                    disabled={isImporting}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-3 p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
            <Calendar className="h-4 w-4 text-[#9CA3AF] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-xs text-[#6B7280]">
              Рекомендуємо робити бекап щотижня або після великих змін у даних. Файл бекапу можна зберігати на Google Drive, Dropbox або будь-якому хмарному сховищі.
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
      )}

      </div>
    </div>
  );
}