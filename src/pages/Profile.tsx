import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { UserDataService } from "@/lib/userDataService";
import { api } from "@/lib/apiClient";
import ProfileOverview from "@/components/profile/ProfileOverview";
import ProfileBackup from "@/components/profile/ProfileBackup";
import "./Profile.css";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { setLang, getLang, type Lang } from "@/lib/i18n";
import { logRender } from "@/lib/devLogger";

export default function Profile() {
  logRender("Profile");
  const { user } = useAuth();
  const username = user?.username || "User";
  const { theme, toggleTheme } = useTheme();
  const isAdmin = user?.role === "admin";
  const [language, setLanguage] = useState<Lang>(getLang);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>("interface");

  // -- Exchange rate --
  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    const stored = localStorage.getItem("matchiq_exchange_rate");
    return stored ? parseFloat(stored) : 44.6;
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
        UserDataService.saveUserPrefs({
          preferences: { exchangeRate: rounded },
        }).catch(() => {});
        toast.success(`Курс оновлено: 1 USD = ${rounded} UAH`);
      } else {
        throw new Error("No UAH rate");
      }
    } catch {
      toast.error(
        "Не вдалося отримати курс. Перевірте інтернет або введіть вручну.",
      );
    } finally {
      setIsFetchingRate(false);
    }
  };

  // ── Backup last date ──
  const BACKUP_REMINDER_DAYS = 7;
  const lastBackup = localStorage.getItem("matchiq_last_backup_date");
  const lastBackupDate = lastBackup ? new Date(lastBackup) : null;
  const daysSinceBackup = lastBackupDate
    ? Math.floor(
        (Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24),
      )
    : Infinity;
  const needsBackupReminder = daysSinceBackup > BACKUP_REMINDER_DAYS;

  // ── Clear all data ──
  const clearAllData = async () => {
    setIsClearing(true);
    setClearConfirmOpen(false);
    try {
      // Try API reset first — await before clearing localStorage
      let apiOk = false;
      try {
        const res = await api.post<{ success: boolean }>("/admin/reset", {});
        apiOk = !!res.success;
      } catch (err) {
        if (import.meta.env.DEV)
          console.warn("[Profile] API reset failed:", err);
      }
      if (!apiOk) {
        toast.error("Сервер повернув помилку. Спробуйте ще раз.");
        setIsClearing(false);
        return;
      }
      // Also clear localStorage (UI prefs kept)
      const keysToKeep = [
        "authToken",
        "userRole",
        "username",
        "matchiq_theme",
        "matchiq_lang",
      ];
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      toast.success("Усі дані очищено!", {
        description: `Видалено ${keysToRemove.length} записів.`,
      });
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.error("Помилка очищення");
    } finally {
      setIsClearing(false);
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark") => {
    if (newTheme !== theme) {
      toggleTheme();
    }
    toast.success(
      newTheme === "dark" ? "Темна тема активована" : "Світла тема активована",
    );
  };

  const handleLanguageChange = (newLang: Lang) => {
    setLang(newLang);
    setLanguage(newLang);
    toast.success(newLang === "uk" ? "Мова: Українська" : "Language: English");
  };

  // ── Shared keys (everyone) ──
  const SHARED_KEYS = [
    "authToken",
    "userRole",
    "username",
    "admin_risky_teams",
    "matchiq_theme",
    "matchiq_lang",
    "match_ratings",
  ] as const;

  // ── Admin-only keys ──
  const ADMIN_KEYS: readonly string[] = [];

  // Keys to NEVER include in backup (security, ephemeral)
  const FORBIDDEN_BACKUP_KEYS = new Set([
    "authToken",
    "userRole",
    "username",
    "google_sheets_api_key",
    "currentUser",
    "ui-settings",
    "adminLocalUsers",
    "adminUserEdits",
    "adminDeletedUsers",
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
      if (
        key &&
        (key.startsWith("user_") ||
          key.startsWith("match_ratings") ||
          key.startsWith("ai_recommendations_history")) &&
        !FORBIDDEN_BACKUP_KEYS.has(key)
      ) {
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
      if (key && key.startsWith("tilt_block_")) {
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
    [...new Set(keys)].forEach((key) => {
      const item = localStorage.getItem(key);
      if (item) totalSize += item.length * 2;
    });
    return (totalSize / 1024).toFixed(1);
  };

  const getDataStats = () => {
    // Fast path: localStorage cache (instant, sync)
    const bets = UserDataService.getUserData(username, "mybets_data", []);
    const riskyCache =
      UserDataService.getUserData(username, "admin_risky_teams", []) ||
      JSON.parse(localStorage.getItem("admin_risky_teams") || "[]");
    const strategies = UserDataService.getUserData(
      username,
      "strategies_data",
      [],
    );
    const goals = UserDataService.getUserData(username, "goals", []);
    const tgGroups = UserDataService.getUserData(username, "tg_groups", []);
    const tgBets = UserDataService.getUserData(username, "tg_bets", []);

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
    const refresh = () => {
      setStats(getDataStats());
      setStorageSize(getStorageSize());
    };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [username]);

  const exportFullBackup = () => {
    setIsExporting(true);
    try {
      const backupData: Record<string, unknown> = {
        _meta: {
          exportDate: new Date().toISOString(),
          appVersion: "1.14.0",
          username: username,
          isAdminBackup: isAdmin,
          format: "matchiq-full-backup",
        },
      };

      // Helper: read and store a key
      const storeKey = (key: string) => {
        if (FORBIDDEN_BACKUP_KEYS.has(key)) return;
        const item = localStorage.getItem(key);
        if (item) {
          try {
            backupData[key] = JSON.parse(item);
          } catch {
            backupData[key] = item;
          }
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
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `matchiq-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Save backup date
      localStorage.setItem(
        "matchiq_last_backup_date",
        new Date().toISOString(),
      );

      toast.success("Повний бекап створено!", {
        description: `Файл: matchiq-backup-${new Date().toISOString().slice(0, 10)}.json`,
      });
    } catch (error) {
      if (import.meta.env.DEV)
        console.warn("[Profile] Backup export error:", error);
      toast.error("Помилка створення бекапу", {
        description: "Не вдалося експортувати дані",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const importFullBackup = (file: File) => {
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed._meta || parsed._meta.format !== "matchiq-full-backup") {
          toast.error("Невірний формат файлу", {
            description:
              'Файл не є бекапом MatchIQ. Використовуйте файл, створений через "Повний бекап".',
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
          if (key === "_meta" || FORBIDDEN_BACKUP_KEYS.has(key)) return;
          const allowed =
            (SHARED_KEYS as readonly string[]).includes(key) ||
            key.startsWith(`user_${username}_`) ||
            (isAdmin &&
              (key.startsWith("user_") ||
                key.startsWith("match_ratings") ||
                key.startsWith("ai_recommendations_history") ||
                key.startsWith("tilt_block_")));
          if (!allowed) return;

          // Admin-only keys — only restore if current user is admin
          if (adminKeySet.has(key) && !isAdmin) {
            skippedAdmin++;
            return;
          }

          // Keys belonging to other users — only restore if admin
          if (
            key.startsWith("user_") &&
            !key.startsWith(`user_${username}_`) &&
            !isAdmin
          ) {
            skippedAdmin++;
            return;
          }

          // Tilt blocks — only restore if admin
          if (key.startsWith("tilt_block_") && !isAdmin) {
            skippedAdmin++;
            return;
          }

          // User-scoped keys MUST be JSON-encoded (UserDataService.getUserData always does JSON.parse)
          // Other keys are read directly via localStorage.getItem() — store raw strings
          const strValue = key.startsWith("user_")
            ? JSON.stringify(value)
            : typeof value === "string"
              ? value
              : JSON.stringify(value);
          localStorage.setItem(key, strValue);
          restoredCount++;
        });

        const msg = `Бекап відновлено! (${restoredCount} записів)`;
        const descTail =
          isAdminBackup && !isAdmin
            ? ` (${skippedAdmin} адмін-записів пропущено)`
            : "";
        toast.success(msg, {
          description: `Дані з ${new Date(parsed._meta.exportDate).toLocaleDateString("uk-UA")} відновлені.${descTail} Сторінка перезавантажиться.`,
        });

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (error) {
        if (import.meta.env.DEV) console.error("Backup import error:", error);
        toast.error("Помилка відновлення", {
          description: "Не вдалося прочитати файл бекапу. Перевірте формат.",
        });
      } finally {
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      setIsImporting(false);
      toast.error("Не вдалося прочитати файл бекапу");
    };
    reader.readAsText(file);
  };

  return (
    <div className="profile-page">
      <header className="profile-heading">
        <h1>{activeTab === "backup" ? "Бекап даних" : "Профіль"}</h1>
      </header>
      <nav className="profile-tabs" aria-label="Розділи профілю">
        <button
          type="button"
          aria-current={activeTab === "interface" ? "page" : undefined}
          onClick={() => setActiveTab("interface")}
        >
          Профіль
        </button>
        <button
          type="button"
          aria-current={activeTab === "backup" ? "page" : undefined}
          onClick={() => setActiveTab("backup")}
        >
          Бекап
        </button>
      </nav>
      <div className="profile-content">
        {activeTab === "interface" && (
          <ProfileOverview
            username={username}
            stats={stats}
            theme={theme}
            language={language}
            onThemeChange={handleThemeChange}
            onLanguageChange={handleLanguageChange}
            exchangeRate={exchangeRate}
            onExchangeRateChange={(value) => {
              setExchangeRate(value);
              localStorage.setItem("matchiq_exchange_rate", String(value));
              UserDataService.saveUserPrefs({
                preferences: { exchangeRate: value },
              }).catch(() => toast.error("Не вдалося синхронізувати курс"));
            }}
            onFetchRate={fetchExchangeRate}
            isFetchingRate={isFetchingRate}
            lastBackupDate={lastBackupDate}
            needsBackupReminder={needsBackupReminder}
            onOpenBackup={() => setActiveTab("backup")}
          />
        )}
        {activeTab === "backup" && (
          <ProfileBackup
            storageSize={storageSize}
            lastBackupDate={lastBackupDate}
            isExporting={isExporting}
            isImporting={isImporting}
            isClearing={isClearing}
            onExport={exportFullBackup}
            onImport={importFullBackup}
            onClear={() => setClearConfirmOpen(true)}
          />
        )}

        {/* ===== Clear data confirmation dialog ===== */}
        <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
          <DialogContent className="sm:max-w-[440px] rounded-3xl border border-gray-100 bg-white p-0 gap-0">
            <DialogHeader className="px-6 pt-6 pb-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-red-50">
                  <AlertTriangle
                    className="h-5 w-5 text-red-600"
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-gray-900">
                    Очистити всі дані
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-500 mt-0.5">
                    Цю дію неможливо скасувати
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="px-6 py-5">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <p className="text-sm text-amber-800 leading-relaxed">
                  Усі ваші дані будуть видалені назавжди: ставки, стратегії,
                  цілі, ризиковані команди та Telegram-групи.
                </p>
              </div>
            </div>
            <DialogFooter className="flex items-center gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={() => setClearConfirmOpen(false)}
                className="flex-1 h-11 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={clearAllData}
                className="flex-1 h-11 rounded-2xl bg-red-600 text-sm font-semibold text-white hover:bg-[#B91C1C] transition-all duration-200"
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
