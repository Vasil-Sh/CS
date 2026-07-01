import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  User, 
  Download, 
  Upload,
  Shield,
  Database,
  FileDown,
  FileUp,
  CheckCircle2,
  AlertTriangle,
  Palette,
  Globe,
  Sun,
  Moon,
  Trash2,
  Clock,
  RefreshCw,
  DollarSign,
} from 'lucide-react';
import { CARD_BASE_STYLE, CARD_HOVER_STYLE, CHART_CARD_SHADOW } from '@/lib/cardStyles';
import { toast } from 'sonner';
import { UserDataService } from '@/lib/userDataService';
import { api } from '@/lib/apiClient';

import { useAuth } from '@/contexts/AuthContext';
import { t, setLang, getLang, type Lang } from '@/lib/i18n';
import { useTheme } from '@/hooks/useTheme';
import { logRender } from '@/lib/devLogger';
import BackupStatusCard from '@/components/profile/BackupStatusCard';
import DataStatsCards from '@/components/profile/DataStatsCards';
import InterfaceSettings from '@/components/profile/InterfaceSettings';
import BackupSection from '@/components/profile/BackupSection';

export default function Profile() {
  logRender('Profile');
  const { user } = useAuth();
  const username = user?.username || 'User';
  const isAdmin = user?.role === 'admin';
  const [language, setLanguage] = useState<Lang>(getLang);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('interface');
  const [simResetKey, setSimResetKey] = useState(0);

  // -- Exchange rate --
  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    const stored = localStorage.getItem("matchiq_exchange_rate");
    return stored ? parseFloat(stored) : 44.60;
  });
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  const fetchExchangeRate = async () => {
    setIsFetchingRate(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch("https://open.er-api.com/v6/latest/USD", {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const rate = data?.rates?.UAH;
      if (rate && typeof rate === "number") {
        const rounded = Math.round(rate * 100) / 100;
        localStorage.setItem("matchiq_exchange_rate", String(rounded));
        setExchangeRate(rounded);
        toast.success(`Курс оновлено: 1 USD = ${rounded} UAH`);
      } else {
        throw new Error("No UAH rate");
      }
    } catch {
      toast.error("Не вдалося отримати курс. Перевірте інтернет або введіть вручну.");
    } finally {
      setIsFetchingRate(false);
    }
  };

  const { theme, toggleTheme } = useTheme();

  // ── Backup last date ──
  const BACKUP_REMINDER_DAYS = 7;
  const lastBackup = localStorage.getItem('matchiq_last_backup_date');
  const lastBackupDate = lastBackup ? new Date(lastBackup) : null;
  const daysSinceBackup = lastBackupDate
    ? Math.floor((Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;
  const needsBackupReminder = daysSinceBackup > BACKUP_REMINDER_DAYS;

  // ── Clear all data ──
  const clearAllData = async () => {
    setIsClearing(true);
    setClearConfirmOpen(false);
    try {
      // Try API reset first
      try { await api.post('/admin/reset', {}); } catch (err) { if (import.meta.env.DEV) console.warn('[Profile] API reset failed:', err); }
      // Also clear localStorage (UI prefs kept)
      const keysToKeep = ['authToken', 'userRole', 'username', 'matchiq_theme', 'matchiq_lang'];
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      toast.success('Усі дані очищено!', { description: `Видалено ${keysToRemove.length} записів.` });
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.error('Помилка очищення');
    } finally {
      setIsClearing(false);
    }
  };

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
    // Fast path: localStorage cache (instant, sync)
    const bets = UserDataService.getUserData(username, 'mybets_data', []);
    const riskyCache = UserDataService.getUserData(username, 'admin_risky_teams', []) || JSON.parse(localStorage.getItem('admin_risky_teams') || '[]');
    const strategies = UserDataService.getUserData(username, 'strategies_data', []);
    const goals = UserDataService.getUserData(username, 'goals', []);
    const tgGroups = UserDataService.getUserData(username, 'tg_groups', []);
    const tgBets = UserDataService.getUserData(username, 'tg_bets', []);

    return {
      bets: Array.isArray(bets) ? bets.length : 0,
      riskyTeams: Array.isArray(riskyCache) ? riskyCache.length : 0,
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

      // Save backup date
      localStorage.setItem('matchiq_last_backup_date', new Date().toISOString());

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

      {/* ===== Backup status card — always visible ===== */}
      <BackupStatusCard lastBackupDate={lastBackupDate} needsBackupReminder={needsBackupReminder} chartCardShadow={chartCardShadow} />

      {/* Data Statistics + User Info — unified card */}
      <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-5">

      {/* Data Statistics - 5 cards */}
      <DataStatsCards stats={stats} cardBaseStyle={cardBaseStyle} cardHoverStyle={cardHoverStyle} />

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
        
          {/* Exchange Rate */}
          <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="h-5 w-5 text-[#22C55E]" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-[#111827]">Курс USD -{">"} UAH</p>
                <p className="text-xs text-[#9CA3AF]">Актуальний курс для конвертації валют</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                value={exchangeRate}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v > 0) {
                    setExchangeRate(v);
                    localStorage.setItem("matchiq_exchange_rate", String(v));
                  }
                }}
                className="flex-1 h-10 px-3 rounded-xl border border-[#D1D5DB] hover:border-[#9CA3AF] focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-colors text-sm bg-white text-[#111827] outline-none"
              />
              <Button
                onClick={fetchExchangeRate}
                disabled={isFetchingRate}
                size="sm"
                className="rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white font-medium h-10 px-4 text-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetchingRate ? "animate-spin" : ""}`} strokeWidth={2} />
                Оновити
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

        </CardContent>
      </Card>

      {/* Clear all data — outside backup card */}
      <div className="mt-6 p-6 border border-red-200 rounded-3xl bg-white" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-50 rounded-xl flex-shrink-0">
            <Trash2 className="h-6 w-6 text-red-600" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Очистити всі дані</h3>
            <p className="text-sm text-gray-500 mb-3">
              Видаляє всі ваші дані (ставки, стратегії, цілі, команди, Telegram-групи). Обліковий запис та налаштування залишаться.
            </p>
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 mb-4">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
              <p className="text-xs text-amber-800">
                <span className="font-semibold">Увага:</span> цю дію неможливо скасувати. Рекомендуємо спочатку створити бекап.
              </p>
            </div>
            <Button
              onClick={() => setClearConfirmOpen(true)}
              disabled={isClearing}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm px-6 font-semibold"
            >
              <Trash2 className="mr-2 h-4 w-4" strokeWidth={2} />
              {isClearing ? 'Очищення...' : 'Очистити всі дані'}
            </Button>
          </div>
        </div>
      </div>
      </div>
      )}

      {/* ===== Clear data confirmation dialog ===== */}
      <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-3xl border border-[#F3F4F6] bg-white p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#FEF2F2]">
                <AlertTriangle className="h-5 w-5 text-[#DC2626]" strokeWidth={2} />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-[#111827]">Очистити всі дані</DialogTitle>
                <DialogDescription className="text-sm text-[#6B7280] mt-0.5">
                  Цю дію неможливо скасувати
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-6 py-5">
            <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl">
              <p className="text-sm text-[#92400E] leading-relaxed">
                Усі ваші дані будуть видалені назавжди: ставки, стратегії, цілі, ризиковані команди та Telegram-групи.
              </p>
            </div>
          </div>
          <DialogFooter className="flex items-center gap-3 px-6 pb-6">
            <button
              type="button"
              onClick={() => setClearConfirmOpen(false)}
              className="flex-1 h-11 rounded-2xl border border-[#E5E7EB] bg-white text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all duration-200"
            >
              Скасувати
            </button>
            <button
              type="button"
              onClick={clearAllData}
              className="flex-1 h-11 rounded-2xl bg-[#DC2626] text-sm font-semibold text-white hover:bg-[#B91C1C] transition-all duration-200"
            >
              Видалити
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </div>
  );
}