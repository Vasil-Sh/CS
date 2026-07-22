import { useState, useEffect, useMemo, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Shield,
  AlertTriangle,
  TrendingDown,
  Target,
  Plus,
  Trash2,
  Search,
  Info,
  RefreshCw,
  Download,
  Pencil,
  Check,
  X,
  ArrowRightLeft,
} from "lucide-react";
import { getStatusBadge } from "@/lib/utils/badgeStyles";
import { getGameEmoji } from "@/lib/utils/gameIcons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { googleSheetsRiskyTeamsService } from "@/lib/googleSheetsRiskyTeams";
import { logRender } from "@/lib/devLogger";
import { toast } from "sonner";

/** Normalize game names from API/localStorage to internal format */
const normalizeGame = (game?: string): string => {
  if (!game) return "CS";
  const g = game.toLowerCase().trim();
  if (g === "dota2" || g === "dota" || g === "дота") return "Дота";
  if (g === "cs2" || g === "cs:go" || g === "csgo" || g === "cs") return "CS";
  return game;
};

import { type RiskyTeam } from "@/data/riskyTeams";

interface RiskManagementProps {
  bets?: Bet[];
}

const ALL_STATUSES = [
  "БАН",
  "Нестабільні",
  "Обережно",
  "Рідко",
  "Надійна",
  "Неоцінена",
] as const;

export default function RiskManagement(_props: RiskManagementProps) {
  logRender("RiskManagement");
  const [riskyTeams, setRiskyTeams] = useState<RiskyTeam[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);

  const [newTeam, setNewTeam] = useState<RiskyTeam>({
    name: "",
    game: "CS",
    status: "Обережно",
    notes: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSheetsGuideOpen, setIsSheetsGuideOpen] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [customSheetUrl, setCustomSheetUrl] = useState("");

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editGame, setEditGame] = useState("");

  // Status filters per game block
  const [csStatusFilter, setCsStatusFilter] = useState<string>("all");
  const [dotaStatusFilter, setDotaStatusFilter] = useState<string>("all");

  // Track whether initial data load has completed
  const initializedRef = useRef(false);

  // Save to localStorage after initial load — always persist (including empty array after deletion)
  useEffect(() => {
    if (initializedRef.current) {
      localStorage.setItem("admin_risky_teams", JSON.stringify(riskyTeams));
    }
  }, [riskyTeams]);

  // Load from localStorage FIRST (instant), skip API if user explicitly cleared
  useEffect(() => {
    const saved = localStorage.getItem("admin_risky_teams");
    let parsedSaved: RiskyTeam[] | null = null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsedSaved = parsed;
        }
      } catch {
        /* ignore */
      }
    }

    if (parsedSaved) {
      setRiskyTeams(
        parsedSaved.map((t: RiskyTeam) => ({
          ...t,
          game: normalizeGame(t.game),
        })),
      );
      setIsLoadingTeams(false);
      initializedRef.current = true;
    } else if (saved === null) {
      // No localStorage at all — first visit, fetch from API
      let cancelled = false;
      const load = async () => {
        try {
          const teams = await googleSheetsRiskyTeamsService.fetchRiskyTeams();
          if (!cancelled && teams.length > 0) {
            setRiskyTeams(teams);
            localStorage.setItem("admin_risky_teams", JSON.stringify(teams));
          }
        } catch {
          /* ignore */
        }
        if (!cancelled) {
          setIsLoadingTeams(false);
          initializedRef.current = true;
        }
      };
      setIsLoadingTeams(true);
      load();
      return () => {
        cancelled = true;
      };
    } else {
      // Empty array was explicitly saved (user deleted all) — show empty
      setIsLoadingTeams(false);
      initializedRef.current = true;
    }
  }, []);

  /** Extract spreadsheet ID and gid from Google Sheets URL */
  const extractSheetId = (url: string): string | null => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  /** Extract gid from Google Sheets URL */
  const extractSheetGid = (url: string): string | null => {
    const match = url.match(/[?&]gid=(\d+)/);
    return match ? match[1] : null;
  };

  const updateFromGoogleSheets = async () => {
    setIsUpdating(true);
    try {
      // Якщо користувач ввів посилання на свій документ — використовуємо його
      const customId = customSheetUrl.trim()
        ? extractSheetId(customSheetUrl.trim())
        : null;
      const customGid = customSheetUrl.trim()
        ? extractSheetGid(customSheetUrl.trim())
        : null;

      const teamsFromSheet =
        await googleSheetsRiskyTeamsService.fetchRiskyTeams(
          customId || undefined,
          customGid || undefined,
        );

      if (teamsFromSheet.length === 0) {
        toast.error("Не знайдено команд у документі");
        return;
      }

      // Replace ALL teams (not merge) — Google Sheets is the source of truth
      if (import.meta.env.DEV) {
        console.log(
          "[RiskMgmt] Loaded from sheet:",
          teamsFromSheet.length,
          "teams",
        );
        console.log(
          "[RiskMgmt] Sample:",
          teamsFromSheet
            .slice(0, 3)
            .map((t) => `${t.name}[${t.game}/${t.status}]`)
            .join(", "),
        );
      }

      // Sync all loaded teams to backend API to get _apiId for each team
      const syncedTeams = await Promise.all(
        teamsFromSheet.map(async (t) => {
          try {
            const added = await googleSheetsRiskyTeamsService.addTeamAndGet(
              t.name,
              t.game,
              t.status,
              t.notes,
            );
            return { ...t, _apiId: added?.id };
          } catch {
            return t; // keep without _apiId
          }
        }),
      );

      setRiskyTeams(syncedTeams);

      toast.success(
        `Завантажено ${teamsFromSheet.length} команд з Google Sheets!`,
        {
          description: `CS: ${teamsFromSheet.filter((t) => t.game === "CS").length} · Дота: ${teamsFromSheet.filter((t) => t.game === "Дота").length}`,
        },
      );
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("Error updating from Google Sheets:", error);
      toast.error("Помилка оновлення", {
        description:
          error instanceof Error
            ? error.message
            : "Не вдалося завантажити дані з Google Sheets",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const addRiskyTeam = async () => {
    if (!newTeam.name.trim()) return;

    setRiskyTeams([...riskyTeams, { ...newTeam }]);
    setNewTeam({ name: "", game: "CS", status: "Обережно", notes: "" });
    // Sync to backend API
    googleSheetsRiskyTeamsService
      .addTeam(newTeam.name.trim(), newTeam.game, newTeam.status, newTeam.notes)
      .catch((err: unknown) => {
        if (import.meta.env.DEV)
          console.warn("[API sync] failed:", String(err));
      });
  };

  const deleteRiskyTeam = (index: number) => {
    if (editingIndex === index) setEditingIndex(null);
    const team = riskyTeams[index];
    setRiskyTeams(riskyTeams.filter((_, i) => i !== index));
    // Sync to backend API (by id if available, otherwise by name)
    if (team._apiId) {
      googleSheetsRiskyTeamsService
        .removeTeam(team._apiId)
        .catch((err: unknown) => {
          if (import.meta.env.DEV)
            console.warn("[API sync] failed:", String(err));
        });
    }
  };

  const deleteAllTeams = () => {
    // Try API delete for each team
    riskyTeams.forEach((t) => {
      if (t._apiId)
        googleSheetsRiskyTeamsService
          .removeTeam(t._apiId)
          .catch((err: unknown) => {
            if (import.meta.env.DEV)
              console.warn("[API sync] failed:", String(err));
          });
    });
    setRiskyTeams([]);
    setEditingIndex(null);
    localStorage.setItem("admin_risky_teams", JSON.stringify([]));
    toast.success("Усі команди видалено");
    setIsDeleteAllOpen(false);
  };

  const startEditing = (globalIndex: number, team: RiskyTeam) => {
    setEditingIndex(globalIndex);
    setEditName(team.name);
    setEditNotes(team.notes);
    setEditStatus(team.status);
    setEditGame(normalizeGame(team.game));
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditName("");
    setEditNotes("");
    setEditStatus("");
    setEditGame("");
  };

  const saveEditing = async () => {
    if (editingIndex === null || !editName.trim()) return;

    const oldGame = riskyTeams[editingIndex].game;
    const newGame = editGame || "CS";
    const updatedTeams = [...riskyTeams];
    updatedTeams[editingIndex] = {
      ...updatedTeams[editingIndex],
      name: editName.trim(),
      notes: editNotes,
      status: editStatus,
      game: newGame,
    };
    // Save team BEFORE resetting editingIndex + write to localStorage immediately
    const savedTeam = updatedTeams[editingIndex];
    setRiskyTeams(updatedTeams);
    localStorage.setItem("admin_risky_teams", JSON.stringify(updatedTeams));
    setEditingIndex(null);

    // Sync to API: update if _apiId exists, otherwise add
    try {
      if (savedTeam._apiId) {
        await googleSheetsRiskyTeamsService.updateTeam(savedTeam._apiId, {
          name: savedTeam.name,
          game: savedTeam.game,
          status: savedTeam.status,
          notes: savedTeam.notes,
        });
      } else {
        const added = await googleSheetsRiskyTeamsService.addTeamAndGet(
          savedTeam.name,
          savedTeam.game,
          savedTeam.status,
          savedTeam.notes,
        );
        // Update _apiId locally — no full re-fetch (which can lose local state on API error/stale cache)
        if (added?.id) {
          const withId = updatedTeams.map((t, i) =>
            i === editingIndex ? { ...t, _apiId: added.id } : t,
          );
          setRiskyTeams(withId);
          localStorage.setItem("admin_risky_teams", JSON.stringify(withId));
        }
      }
    } catch {
      /* API offline — data saved in localStorage already */
    }

    if (oldGame !== newGame) {
      const targetLabel = newGame === "CS" ? "CS" : "Dota 2";
      toast.success(
        `Команду "${editName.trim()}" перенесено в блок ${targetLabel}`,
      );
    } else {
      toast.success("Команду оновлено");
    }

    setEditName("");
    setEditNotes("");
    setEditStatus("");
    setEditGame("");
  };

  // Local filter badge style (kept because it needs ring/active variant which lib doesn't provide)
  const getStatusFilterBadge = (status: string, isActive: boolean) => {
    const base = isActive
      ? "ring-2 ring-offset-1"
      : "opacity-70 hover:opacity-100";
    switch (status) {
      case "БАН":
        return `bg-[#FEE2E2] text-red-600 border border-red-200 ${isActive ? "ring-red-200" : ""} ${base}`;
      case "Нестабільні":
        return `bg-yellow-100 text-amber-600 border border-amber-200 ${isActive ? "ring-amber-200" : ""} ${base}`;
      case "Обережно":
        return `bg-amber-50 text-amber-600 border border-amber-200 ${isActive ? "ring-amber-200" : ""} ${base}`;
      case "Рідко":
        return `bg-blue-50 text-blue-600 border border-blue-200 ${isActive ? "ring-blue-200" : ""} ${base}`;
      case "Надійна":
        return `bg-green-50 text-green-600 border border-green-200 ${isActive ? "ring-green-200" : ""} ${base}`;
      case "Неоцінена":
        return `bg-gray-50 text-gray-500 border border-gray-200 ${isActive ? "ring-gray-200" : ""} ${base}`;
      default:
        return `bg-gray-100 text-gray-700 border border-gray-200 ${isActive ? "ring-gray-200" : ""} ${base}`;
    }
  };

  const filteredTeams = useMemo(
    () =>
      riskyTeams.filter(
        (team) =>
          team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.game.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.notes.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [riskyTeams, searchQuery],
  );

  // Team-based statistics for overview cards
  const teamStats = useMemo(() => {
    const total = riskyTeams.length;
    const csCount = riskyTeams.filter((t) => t.game === "CS").length;
    const dotaCount = riskyTeams.filter((t) => t.game === "Дота").length;
    const banCount = riskyTeams.filter((t) => t.status === "БАН").length;
    const unstableCount = riskyTeams.filter(
      (t) => t.status === "Нестабільні",
    ).length;
    const carefulCount = riskyTeams.filter(
      (t) => t.status === "Обережно",
    ).length;
    const rareCount = riskyTeams.filter((t) => t.status === "Рідко").length;
    const reliableCount = riskyTeams.filter(
      (t) => t.status === "Надійна",
    ).length;
    const noStatusCount = riskyTeams.filter(
      (t) => t.status === "Неоцінена",
    ).length;
    const attentionCount = banCount + unstableCount; // High-risk teams
    const dominantGame = csCount >= dotaCount ? "CS" : "Dota 2";
    const dominantGameCount = Math.max(csCount, dotaCount);
    const banPercentage = total > 0 ? Math.round((banCount / total) * 100) : 0;

    return {
      total,
      csCount,
      dotaCount,
      banCount,
      unstableCount,
      carefulCount,
      rareCount,
      reliableCount,
      noStatusCount,
      attentionCount,
      dominantGame,
      dominantGameCount,
      banPercentage,
    };
  }, [riskyTeams]);

  // Apply both search and status filters
  const csTeams = filteredTeams.filter(
    (t) =>
      t.game === "CS" &&
      (csStatusFilter === "all" || t.status === csStatusFilter),
  );
  const dotaTeams = filteredTeams.filter(
    (t) =>
      t.game === "Дота" &&
      (dotaStatusFilter === "all" || t.status === dotaStatusFilter),
  );
  const uncategorizedTeams = filteredTeams.filter(
    (t) => t.game !== "CS" && t.game !== "Дота",
  );

  const teamsByStatus = {
    БАН: filteredTeams.filter((t) => t.status === "БАН"),
    Нестабільні: filteredTeams.filter((t) => t.status === "Нестабільні"),
    Обережно: filteredTeams.filter((t) => t.status === "Обережно"),
    Рідко: filteredTeams.filter((t) => t.status === "Рідко"),
    Надійна: filteredTeams.filter((t) => t.status === "Надійна"),
    Неоцінена: filteredTeams.filter((t) => t.status === "Неоцінена"),
  };

  // Count statuses per game for filter badges
  const csStatusCounts = useMemo(() => {
    const csAll = filteredTeams.filter((t) => t.game === "CS");
    const counts: Record<string, number> = { all: csAll.length };
    ALL_STATUSES.forEach((s) => {
      counts[s] = csAll.filter((t) => t.status === s).length;
    });
    return counts;
  }, [filteredTeams]);

  const dotaStatusCounts = useMemo(() => {
    const dotaAll = filteredTeams.filter((t) => t.game === "Дота");
    const counts: Record<string, number> = { all: dotaAll.length };
    ALL_STATUSES.forEach((s) => {
      counts[s] = dotaAll.filter((t) => t.status === s).length;
    });
    return counts;
  }, [filteredTeams]);

  const chartCardShadow =
    "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)";

  // Card style constants

  const renderStatusFilter = (
    currentFilter: string,
    setFilter: (val: string) => void,
    statusCounts: Record<string, number>,
  ) => (
    <div className="flex flex-wrap items-center gap-1.5 pt-6 pb-2">
      <button
        onClick={() => setFilter("all")}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          currentFilter === "all"
            ? "bg-gray-900 text-white ring-2 ring-offset-1 ring-gray-900"
            : "bg-gray-100 text-gray-700 border border-gray-200 opacity-70 hover:opacity-100"
        }`}
      >
        Всі ({statusCounts.all})
      </button>
      {ALL_STATUSES.map((status) => {
        const count = statusCounts[status] || 0;
        if (count === 0) return null;
        return (
          <button
            key={status}
            onClick={() => setFilter(currentFilter === status ? "all" : status)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${getStatusFilterBadge(status, currentFilter === status)}`}
          >
            {status} ({count})
          </button>
        );
      })}
    </div>
  );

  const renderTeamCard = (team: RiskyTeam, globalIndex: number) => {
    const isEditing = editingIndex === globalIndex;

    if (isEditing) {
      return (
        <div
          key={globalIndex}
          className="p-4 border border-gray-300 rounded-2xl bg-gray-50 transition-all"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Назва команди
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white hover:border-gray-300 focus:border-gray-900 transition-colors text-sm"
                  placeholder="Назва команди"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Статус
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full p-2 border border-gray-200 bg-white hover:border-gray-300 focus:border-gray-900 transition-colors rounded-xl text-sm"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Game selector for transfer */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
                <ArrowRightLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
                Перенести в блок
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditGame("CS")}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    editGame === "CS"
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  🎯 CS
                </button>
                <button
                  type="button"
                  onClick={() => setEditGame("Дота")}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    editGame === "Дота"
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  🛡️ Дота
                </button>
              </div>
              {editGame !== team.game && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <ArrowRightLeft className="h-3 w-3" strokeWidth={1.5} />
                  Команду буде перенесено в блок{" "}
                  {editGame === "CS" ? "CS" : "Dota 2"}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Коментар
              </label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white hover:border-gray-300 focus:border-gray-900 transition-colors text-sm"
                placeholder="Додайте коментар..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEditing}
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl text-sm"
              >
                <X className="h-4 w-4 mr-1" strokeWidth={1.5} />
                Скасувати
              </Button>
              <Button
                size="sm"
                onClick={saveEditing}
                disabled={!editName.trim()}
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm"
              >
                <Check className="h-4 w-4 mr-1" strokeWidth={1.5} />
                Зберегти
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={globalIndex}
        className="p-4 border border-gray-300 rounded-2xl bg-white hover:bg-gray-50 hover:border-gray-400 transition-all"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-base text-gray-900">
                {getGameEmoji(team.game)} {team.name}
              </h3>
              <Badge className={getStatusBadge(team.status)}>
                {team.status || "Неоцінена"}
              </Badge>
            </div>
            {team.notes && (
              <p className="text-sm text-gray-500 whitespace-pre-wrap">
                {team.notes}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startEditing(globalIndex, team)}
              className="text-primary hover:text-primary hover:bg-blue-50 rounded-xl"
            >
              <Pencil className="h-4 w-4" strokeWidth={1.5} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteRiskyTeam(globalIndex)}
              className="text-red-500 hover:text-red-500 hover:bg-red-50 rounded-xl"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col flex-1 min-h-0 space-y-6">
        {/* Team-focused Overview Cards */}
        <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total risky teams */}
            <div className="bg-white border border-gray-100 rounded-3xl px-6 py-5 group transition-all duration-300 ease-in-out hover:scale-[1.03] hover:shadow-[0_20px_40px_rgba(0,0,0,0.12),0_8px_16px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50">
                  <Shield className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Всього команд
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
                {teamStats.total}
              </div>
              <Badge className="bg-green-50 text-green-600 hover:bg-green-50 border border-green-200 rounded-lg font-medium text-xs px-3 py-1.5">
                CS: {teamStats.csCount} · Dota: {teamStats.dotaCount}
              </Badge>
            </div>

            {/* БАН — forbidden teams */}
            <div className="bg-white border border-gray-100 rounded-3xl px-6 py-5 group transition-all duration-300 ease-in-out hover:scale-[1.03] hover:shadow-[0_20px_40px_rgba(0,0,0,0.12),0_8px_16px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50">
                  <TrendingDown
                    className="h-5 w-5 text-primary"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Заборонені
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
                {teamStats.banCount}
              </div>
              <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg font-medium text-xs px-3 py-1.5">
                БАН · {teamStats.banPercentage}% від усіх
              </Badge>
            </div>

            {/* Потребують уваги (БАН + Нестабільні) */}
            <div className="bg-white border border-gray-100 rounded-3xl px-6 py-5 group transition-all duration-300 ease-in-out hover:scale-[1.03] hover:shadow-[0_20px_40px_rgba(0,0,0,0.12),0_8px_16px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50">
                  <AlertTriangle
                    className="h-5 w-5 text-primary"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Високий ризик
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
                {teamStats.attentionCount}
              </div>
              <Badge className="bg-[#FFF7ED] text-[#EA580C] hover:bg-[#FFF7ED] border border-[#FED7AA] rounded-lg font-medium text-xs px-3 py-1.5">
                БАН: {teamStats.banCount} · Нестабільні:{" "}
                {teamStats.unstableCount}
              </Badge>
            </div>

            {/* Game dominance */}
            <div className="bg-white border border-gray-100 rounded-3xl px-6 py-5 group transition-all duration-300 ease-in-out hover:scale-[1.03] hover:shadow-[0_20px_40px_rgba(0,0,0,0.12),0_8px_16px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50">
                  <Target className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Основна гра
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
                {teamStats.dominantGame}
              </div>
              <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg font-medium text-xs px-3 py-1.5">
                {teamStats.dominantGameCount} команд у списку
              </Badge>
            </div>
          </div>
        </div>

        {/* Toolbar: Google Sheets, Add team, Info */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm border-2 border-stone-200 p-3 rounded-[32px] flex-wrap justify-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            {/* Info tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center justify-center px-3.5 py-4 rounded-[24px] bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">
                  <Info className="h-4 w-4" strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="start"
                className="max-w-xs bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-lg"
              >
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Управління ризиками
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Тут ви можете вести список команд, на які не варто ставити або
                  потрібно бути обережним. Кожній команді можна призначити
                  статус (БАН, Обережно, Нестабільні тощо) та додати коментар.
                  При створенні запису на сторінці «Додати запис» ви отримаєте
                  попередження, якщо обрали ризикову команду.
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Filter/search toggle — compact icon button */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`flex items-center justify-center px-3.5 py-4 rounded-[24px] transition-colors ${
                isSearchOpen
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900"
              }`}
              title="Пошук"
            >
              <Search className="h-4 w-4" strokeWidth={2} />
            </button>

            {/* Delete all — only shown when teams exist */}
            {riskyTeams.length > 0 && (
              <button
                onClick={() => setIsDeleteAllOpen(true)}
                className="flex items-center justify-center px-3.5 py-4 rounded-[24px] bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Видалити всі команди"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              </button>
            )}

            {/* Google Sheets button — opens guide modal */}
            <button
              onClick={() => setIsSheetsGuideOpen(true)}
              disabled={isUpdating}
              className="flex items-center gap-2 px-6 py-4 text-base rounded-[24px] font-light text-gray-400 hover:bg-[#F5F5F3] hover:text-gray-500 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <>
                  <RefreshCw
                    className="h-4 w-4 animate-spin"
                    strokeWidth={1.5}
                  />
                  Оновлення...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" strokeWidth={1.5} />
                  Підтягнути команди з Google Sheets
                </>
              )}
            </button>

            {/* Divider */}
            <div className="w-px h-7 bg-stone-200 mx-0.5" />

            {/* Add new team — accent blue */}
            <button
              onClick={() => setIsAddTeamOpen(true)}
              className="flex items-center gap-2 px-6 py-4 text-base rounded-[24px] font-semibold bg-primary text-white hover:bg-blue-400 shadow-[0_2px_8px_rgba(68,122,252,0.3)] transition-all duration-300 ease-in-out"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Додати нову команду
            </button>
          </div>
        </div>

        {/* Inline search input — shown when toggled */}
        {isSearchOpen && (
          <div
            className="bg-white border border-gray-200 rounded-2xl p-4"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                strokeWidth={1.5}
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук за назвою, грою, статусом або примітками..."
                className="pl-10 w-full rounded-xl border border-gray-200 hover:border-gray-300 focus:border-gray-900 transition-colors text-sm"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Google Sheets Guide Dialog */}
        <Dialog open={isSheetsGuideOpen} onOpenChange={setIsSheetsGuideOpen}>
          <DialogContent className="rounded-3xl max-w-2xl border border-gray-200 p-0 gap-0">
            <DialogHeader className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-100 flex-shrink-0">
                  <Download
                    className="h-5 w-5 text-blue-600"
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-gray-900">
                    Підтягнути команди з Google Sheets
                  </DialogTitle>
                  <DialogDescription className="text-gray-500 mt-0.5">
                    Як оформити документ, щоб дані правильно підтягнулись
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="border-t border-gray-200" />

            <div className="space-y-3 px-5 pt-4 pb-5 bg-gray-100">
              {/* Step 1 */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary text-white font-semibold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900 mb-1">
                      Створіть Google Sheets документ
                    </h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Відкрийте новий документ на{" "}
                      <span className="font-medium text-gray-900">
                        Google Sheets
                      </span>{" "}
                      і дайте йому будь-яку назву.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary text-white font-semibold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900 mb-2">
                      Оформіть колонки
                    </h4>
                    <div className="overflow-hidden rounded-xl border border-gray-300 bg-white">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left px-3 py-2 font-semibold text-gray-900 border-r border-b border-gray-300">
                              A — Назва команди
                            </th>
                            <th className="text-left px-3 py-2 font-semibold text-gray-900 border-b border-gray-300">
                              B — Статус
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-3 py-2 text-gray-700 border-r border-b border-gray-200">
                              Vitality
                            </td>
                            <td className="px-3 py-2 text-gray-700 border-b border-gray-200">
                              🟩 CS: У фіналах часто вимикаються…
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-gray-700 border-r border-b border-gray-200">
                              Team Spirit
                            </td>
                            <td className="px-3 py-2 text-gray-700 border-b border-gray-200">
                              🟨 Dota2: Тільки на +1.5, часто заливають
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-gray-700 border-r border-b border-gray-200">
                              Virtus Pro
                            </td>
                            <td className="px-3 py-2 text-gray-700 border-b border-gray-200">
                              🟥 CS: Раки — дуже рідко на них варто щось ставити
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      💡 Перший рядок може бути заголовком — він буде
                      автоматично проігнорований.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 — Open access */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary text-white font-semibold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900 mb-1">
                      Відкрийте доступ до документу
                    </h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Натисніть{" "}
                      <span className="font-medium text-gray-900">
                        «Поділитися» → «Усі, хто має посилання» → «Читач»
                      </span>
                      , щоб документ був доступний для читання.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-semibold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900 mb-2">
                      Вставте посилання на ваш документ
                    </h4>
                    <p className="text-sm text-gray-500 mb-3">
                      Скопіюйте посилання з адресного рядка браузера та вставте
                      його сюди. Ви можете використовувати{" "}
                      <span className="font-medium text-gray-900">власний</span>{" "}
                      Google Sheets документ.
                    </p>
                    <Input
                      value={customSheetUrl}
                      onChange={(e) => setCustomSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/ВАШ_ID/edit"
                      className="rounded-xl border-blue-200 focus:border-blue-600 bg-white text-sm"
                    />
                    {customSheetUrl.trim() &&
                      !extractSheetId(customSheetUrl.trim()) && (
                        <p className="text-xs text-red-500 mt-1.5">
                          ❌ Неправильний формат посилання. Перевірте, чи
                          скопійовано повне посилання з Google Sheets.
                        </p>
                      )}
                    {customSheetUrl.trim() &&
                      extractSheetId(customSheetUrl.trim()) && (
                        <p className="text-xs text-green-600 mt-1.5">
                          ✓ Посилання правильне. Будуть завантажені команди з
                          вашого документу.
                        </p>
                      )}
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2">
                <AlertTriangle
                  className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5"
                  strokeWidth={1.75}
                />
                <div className="text-sm text-gray-900">
                  <span className="font-semibold text-red-600">Важливо:</span>{" "}
                  при оновленні <strong>всі команди замінюються</strong> даними
                  з Google Sheets. Документ є джерелом правди — локальні зміни
                  будуть перезаписані.
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-5 py-3">
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsSheetsGuideOpen(false)}
                  disabled={isUpdating}
                  className="rounded-xl border-gray-200 font-medium"
                >
                  Скасувати
                </Button>
                <Button
                  onClick={async () => {
                    await updateFromGoogleSheets();
                    setIsSheetsGuideOpen(false);
                  }}
                  disabled={isUpdating}
                  className="rounded-xl bg-primary hover:bg-blue-700 text-white font-medium"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw
                        className="mr-2 h-4 w-4 animate-spin"
                        strokeWidth={2}
                      />
                      Завантаження...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" strokeWidth={2} />
                      Отримати данні
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add New Team - Modal Dialog */}
        <Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
          <DialogContent className="rounded-3xl max-w-2xl border border-gray-200 bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <Plus className="h-5 w-5 text-blue-500" strokeWidth={1.75} />
                </div>
                Додати нову команду
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                Заповніть інформацію про ризикову команду
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Назва команди
                </label>
                <Input
                  value={newTeam.name}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, name: e.target.value })
                  }
                  placeholder="Введіть назву команди"
                  className="mt-1 rounded-xl border border-gray-200 hover:border-gray-300 focus:border-gray-900 transition-colors text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Гра</label>
                <select
                  value={newTeam.game}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, game: e.target.value })
                  }
                  className="w-full p-2 border border-gray-200 hover:border-gray-300 focus:border-gray-900 transition-colors rounded-xl mt-1 text-sm"
                >
                  <option value="CS">CS</option>
                  <option value="Дота">Дота</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Статус
                </label>
                <select
                  value={newTeam.status}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, status: e.target.value })
                  }
                  className="w-full p-2 border border-gray-200 hover:border-gray-300 focus:border-gray-900 transition-colors rounded-xl mt-1 text-sm"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">
                  Примітки
                </label>
                <Textarea
                  value={newTeam.notes}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, notes: e.target.value })
                  }
                  placeholder="Додайте примітки про команду"
                  className="mt-1 rounded-xl border border-gray-200 hover:border-gray-300 focus:border-gray-900 transition-colors text-sm"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddTeamOpen(false)}
                className="rounded-xl border-gray-200 font-medium"
              >
                Скасувати
              </Button>
              <Button
                onClick={() => {
                  addRiskyTeam();
                  if (newTeam.name.trim()) setIsAddTeamOpen(false);
                }}
                className="bg-primary hover:bg-blue-400 text-white rounded-xl text-sm px-6 font-semibold"
                disabled={!newTeam.name.trim()}
              >
                <Plus className="mr-2 h-4 w-4" strokeWidth={2} />
                Додати команду
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete All Confirmation Dialog */}
        <Dialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
          <DialogContent className="rounded-3xl max-w-md border border-gray-200 p-0 gap-0">
            <DialogHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-red-100 flex-shrink-0">
                  <Trash2 className="h-5 w-5 text-red-600" strokeWidth={1.5} />
                </div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  Видалити всі команди?
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="border-t border-gray-200" />

            <div className="px-6 pb-6 pt-4 space-y-3 bg-gray-100">
              <div className="text-center">
                <div className="flex flex-col items-center px-5 py-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <DialogDescription className="text-lg font-bold text-gray-900 text-center">
                    Усі команди
                  </DialogDescription>
                  <span className="text-4xl font-bold text-red-600 mt-1">
                    {riskyTeams.length}
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5">
                    команд буде видалено
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-red-200">
                <AlertTriangle
                  className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
                  strokeWidth={1.5}
                />
                <p className="text-sm text-[#991B1B]">
                  Ця дія незворотна — усі {riskyTeams.length} команд будуть
                  видалені назавжди.
                </p>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteAllOpen(false)}
                  className="rounded-xl border-gray-200 font-medium"
                >
                  Скасувати
                </Button>
                <Button
                  onClick={deleteAllTeams}
                  className="rounded-xl bg-red-600 hover:bg-[#B91C1C] text-white font-medium"
                >
                  <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Видалити всі
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Teams by Game */}
        <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-stone-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex-1 flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
            {/* CS Teams */}
            <Card
              className="border border-gray-200 rounded-[24px] bg-white overflow-hidden flex flex-col"
              style={{ boxShadow: chartCardShadow }}
            >
              <CardHeader className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
                <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-900">
                  <span className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                      <Users
                        className="h-5 w-5 text-primary"
                        strokeWidth={1.5}
                      />
                    </div>
                    CS команди
                  </span>
                </CardTitle>
                <div className="border-t border-gray-200 -mx-6 mt-0 mb-0" />
                {renderStatusFilter(
                  csStatusFilter,
                  setCsStatusFilter,
                  csStatusCounts,
                )}
              </CardHeader>
              <CardContent className="p-0 bg-gray-50 flex flex-col flex-1">
                <div className="space-y-3 max-h-[600px] overflow-y-auto rounded-b-[24px] p-4 flex-1">
                  {csTeams.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                      <div className="p-8 bg-white rounded-2xl inline-block mb-6 border border-gray-200 shadow-sm">
                        <Users
                          className="h-16 w-16 text-gray-400"
                          strokeWidth={1}
                        />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Немає команд CS
                      </h3>
                      <p className="text-gray-500 text-sm mb-6">
                        {csStatusFilter !== "all"
                          ? `Немає CS команд зі статусом "${csStatusFilter}"`
                          : "Додайте ризиковані команди CS для відстеження"}
                      </p>
                      {csStatusFilter !== "all" ? (
                        <Button
                          onClick={() => setCsStatusFilter("all")}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white text-base font-semibold transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" strokeWidth={2} />
                          Скинути фільтр
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setIsAddTeamOpen(true)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white text-base font-semibold transition-colors"
                        >
                          <Plus className="h-4 w-4" strokeWidth={2} />
                          Додати команду
                        </Button>
                      )}
                    </div>
                  ) : (
                    csTeams.map((team) => {
                      const globalIndex = riskyTeams.findIndex(
                        (t) => t === team,
                      );
                      return renderTeamCard(team, globalIndex);
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dota Teams */}
            <Card
              className="border border-gray-200 rounded-[24px] bg-white overflow-hidden flex flex-col"
              style={{ boxShadow: chartCardShadow }}
            >
              <CardHeader className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
                <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-900">
                  <span className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                      <Users
                        className="h-5 w-5 text-primary"
                        strokeWidth={1.5}
                      />
                    </div>
                    Dota 2 команди
                  </span>
                </CardTitle>
                <div className="border-t border-gray-200 -mx-6 mt-0 mb-0" />
                {renderStatusFilter(
                  dotaStatusFilter,
                  setDotaStatusFilter,
                  dotaStatusCounts,
                )}
              </CardHeader>
              <CardContent className="p-0 bg-gray-50 flex flex-col flex-1">
                <div className="space-y-3 max-h-[600px] overflow-y-auto rounded-b-[24px] p-4 flex-1">
                  {dotaTeams.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                      <div className="p-8 bg-white rounded-2xl inline-block mb-6 border border-gray-200 shadow-sm">
                        <Users
                          className="h-16 w-16 text-gray-400"
                          strokeWidth={1}
                        />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Немає команд Dota 2
                      </h3>
                      <p className="text-gray-500 text-sm mb-6">
                        {dotaStatusFilter !== "all"
                          ? `Немає Dota 2 команд зі статусом "${dotaStatusFilter}"`
                          : "Додайте ризиковані команди Dota 2 для відстеження"}
                      </p>
                      {dotaStatusFilter !== "all" ? (
                        <Button
                          onClick={() => setDotaStatusFilter("all")}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white text-base font-semibold transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" strokeWidth={2} />
                          Скинути фільтр
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setIsAddTeamOpen(true)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white text-base font-semibold transition-colors"
                        >
                          <Plus className="h-4 w-4" strokeWidth={2} />
                          Додати команду
                        </Button>
                      )}
                    </div>
                  ) : (
                    dotaTeams.map((team) => {
                      const globalIndex = riskyTeams.findIndex(
                        (t) => t === team,
                      );
                      return renderTeamCard(team, globalIndex);
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Uncategorized Teams — teams without game/status for editing */}
            {uncategorizedTeams.length > 0 && (
              <Card
                className="border border-gray-200 rounded-[24px] bg-white overflow-hidden lg:col-span-2 flex flex-col"
                style={{ boxShadow: chartCardShadow }}
              >
                <CardHeader className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
                  <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-900">
                    <span className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 rounded-xl">
                        <Pencil
                          className="h-5 w-5 text-primary"
                          strokeWidth={1.5}
                        />
                      </div>
                      Без категорії
                    </span>
                    <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 font-semibold text-sm">
                      {uncategorizedTeams.length}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                    <Info className="h-4 w-4" strokeWidth={1.5} />
                    Команди без визначеної гри або статусу. Натисніть{" "}
                    <Pencil
                      className="h-3.5 w-3.5 inline"
                      strokeWidth={1.5}
                    />{" "}
                    щоб відредагувати.
                  </p>
                </CardHeader>
                <CardContent className="p-0 bg-white flex flex-col flex-1">
                  <div className="space-y-3 max-h-[600px] overflow-y-auto rounded-b-[24px] p-4 flex-1">
                    {uncategorizedTeams.map((team) => {
                      const globalIndex = riskyTeams.findIndex(
                        (t) => t === team,
                      );
                      return renderTeamCard(team, globalIndex);
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Risk Alerts */}
        {riskMetrics.consecutiveLosses > 5 && (
          <Alert className="rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="h-4 w-4 text-red-500" strokeWidth={1.5} />
            <AlertDescription className="text-sm text-[#991B1B] ml-2">
              <strong className="font-semibold">Попередження про ризик:</strong>
              {` ${riskMetrics.consecutiveLosses} послідовних програшів вказують на необхідність перегляду стратегії.`}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </TooltipProvider>
  );
}

// unique: 20260629003707
