import { useState } from 'react';
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
  CheckCircle2,
  AlertTriangle,
  Palette,
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const username = localStorage.getItem('username') || 'User';
  const userRole = localStorage.getItem('userRole') || 'user';
  const isAdmin = userRole === 'admin';
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('app_theme') as 'light' | 'dark') || 'light';
  });
  
  const [language, setLanguage] = useState<'uk' | 'en'>(() => {
    return (localStorage.getItem('app_language') as 'uk' | 'en') || 'uk';
  });

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('app_theme', newTheme);
    toast.success(newTheme === 'dark' ? 'Темна тема активована' : 'Світла тема активована');
  };

  const handleLanguageChange = (newLang: 'uk' | 'en') => {
    setLanguage(newLang);
    localStorage.setItem('app_language', newLang);
    toast.success(newLang === 'uk' ? 'Мова: Українська' : 'Language: English');
  };

  // Collect all localStorage keys used by the app
  const APP_STORAGE_KEYS = [
    'admin_risky_teams',
    'bets',
    'strategies',
    'goals',
    'bankroll',
    'currency',
    'username',
    'userRole',
    'authToken',
    'admin_users',
    'matches',
    'completedGoals',
    'strategyViolations',
  ];

  const getStorageSize = () => {
    let totalSize = 0;
    APP_STORAGE_KEYS.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length * 2; // UTF-16 encoding = 2 bytes per char
      }
    });
    return (totalSize / 1024).toFixed(1); // KB
  };

  const getDataStats = () => {
    const bets = JSON.parse(localStorage.getItem('bets') || '[]');
    const riskyTeams = JSON.parse(localStorage.getItem('admin_risky_teams') || '[]');
    const strategies = JSON.parse(localStorage.getItem('strategies') || '[]');
    const goals = JSON.parse(localStorage.getItem('goals') || '[]');
    const matches = JSON.parse(localStorage.getItem('matches') || '[]');

    return {
      bets: bets.length,
      riskyTeams: riskyTeams.length,
      strategies: strategies.length,
      goals: goals.length,
      matches: matches.length,
    };
  };

  const stats = getDataStats();
  const storageSize = getStorageSize();

  const exportFullBackup = () => {
    setIsExporting(true);
    try {
      const backupData: Record<string, unknown> = {
        _meta: {
          exportDate: new Date().toISOString(),
          appVersion: '1.0.0',
          username: username,
          format: 'matchiq-full-backup'
        }
      };

      APP_STORAGE_KEYS.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            backupData[key] = JSON.parse(item);
          } catch {
            backupData[key] = item;
          }
        }
      });

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

        // Validate format
        if (!parsed._meta || parsed._meta.format !== 'matchiq-full-backup') {
          toast.error('Невірний формат файлу', {
            description: 'Файл не є бекапом MatchIQ. Використовуйте файл, створений через "Повний бекап".'
          });
          setIsImporting(false);
          return;
        }

        // Restore all keys
        let restoredCount = 0;
        Object.entries(parsed).forEach(([key, value]) => {
          if (key === '_meta') return;
          if (APP_STORAGE_KEYS.includes(key)) {
            const strValue = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, strValue);
            restoredCount++;
          }
        });

        toast.success(`Бекап відновлено! (${restoredCount} записів)`, {
          description: `Дані з ${new Date(parsed._meta.exportDate).toLocaleDateString('uk-UA')} відновлені. Сторінка перезавантажиться.`
        });

        // Reload after short delay to apply changes
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
    // Reset input
    event.target.value = '';
  };

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

  return (
    <div className="min-h-screen bg-[#f3f3f3] relative">
      {/* ===== HEADER (same style as Strategy & Goals) ===== */}
      <div className="px-6 lg:px-8 pt-6 pb-2">
        <h1 className="text-[48px] font-semibold text-[#111827] leading-tight tracking-tight">
          Профіль
        </h1>
      </div>

      <div className="px-6 lg:px-8 pb-8 space-y-8">

      {/* Data Statistics - large centered cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 justify-items-center">
        <div
          className="bg-white border border-[#F3F4F6] rounded-3xl px-8 py-8 w-full text-center"
          style={cardBaseStyle}
          onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
          onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
        >
          <p className="text-base font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">Ставки</p>
          <p className="text-5xl font-bold text-[#111827]">{stats.bets}</p>
        </div>
        <div
          className="bg-white border border-[#F3F4F6] rounded-3xl px-8 py-8 w-full text-center"
          style={cardBaseStyle}
          onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
          onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
        >
          <p className="text-base font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">Команди</p>
          <p className="text-5xl font-bold text-[#111827]">{stats.riskyTeams}</p>
        </div>
        <div
          className="bg-white border border-[#F3F4F6] rounded-3xl px-8 py-8 w-full text-center"
          style={cardBaseStyle}
          onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
          onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
        >
          <p className="text-base font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">Стратегії</p>
          <p className="text-5xl font-bold text-[#111827]">{stats.strategies}</p>
        </div>
        <div
          className="bg-white border border-[#F3F4F6] rounded-3xl px-8 py-8 w-full text-center"
          style={cardBaseStyle}
          onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
          onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
        >
          <p className="text-base font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">Цілі</p>
          <p className="text-5xl font-bold text-[#111827]">{stats.goals}</p>
        </div>
        <div
          className="bg-white border border-[#F3F4F6] rounded-3xl px-8 py-8 w-full text-center"
          style={cardBaseStyle}
          onMouseEnter={(e) => { Object.assign(e.currentTarget.style, cardHoverStyle); }}
          onMouseLeave={(e) => { Object.assign(e.currentTarget.style, cardBaseStyle); }}
        >
          <p className="text-base font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">Матчі</p>
          <p className="text-5xl font-bold text-[#111827]">{stats.matches}</p>
        </div>
      </div>

      {/* User Info Card */}
      <Card className="border border-[#E5E7EB] rounded-2xl bg-white" style={{ boxShadow: chartCardShadow }}>
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-[#447afc] rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(68,122,252,0.3)]">
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

      {/* Theme & Language Settings */}
      <Card className="border border-[#E5E7EB] rounded-2xl bg-white" style={{ boxShadow: chartCardShadow }}>
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
                🇺🇦 Українська
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
                🇬🇧 English
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup Section */}
      <Card className="border border-[#E5E7EB] rounded-2xl bg-white" style={{ boxShadow: chartCardShadow }}>
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
                  Експортує всі ваші дані (ставки, команди, стратегії, цілі, матчі, налаштування) в один JSON файл. 
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
    </div>
  );
}