import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  RotateCcw,
  Download,
  Pencil,
  Check,
  X,
  ArrowRightLeft,
} from "lucide-react";
import { useRiskMetrics } from "@/hooks/useRiskMetrics";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Bet } from "@/types/betting";
import { googleSheetsRiskyTeamsService } from "@/lib/googleSheetsRiskyTeams";
import { logRender } from "@/lib/devLogger";
import { toast } from "sonner";

import { type RiskyTeam } from "@/data/riskyTeams";

interface RiskManagementProps {
  bets: Bet[];
}

const ALL_STATUSES = [
  "БАН",
  "Нестабільні",
  "Обережно",
  "Рідко",
  "Надійна",
  "Без статусу",
] as const;

export default function RiskManagement({ bets }: RiskManagementProps) {
  logRender("RiskManagement");
  const [riskyTeams, setRiskyTeams] = useState<RiskyTeam[]>(() => {
    const saved = localStorage.getItem("admin_risky_teams");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Array<{
          name: string;
          game: string;
          status: string;
          notes: string;
        }>;
        const hasCorrupted = parsed.some((t) => !t.game || t.game.length > 10);
        if (hasCorrupted) {
          console.log(
            "[RiskMgmt] Detected corrupted localStorage data — resetting",
          );
          localStorage.removeItem("admin_risky_teams");
          return [];
        }
        return parsed.map((t) => ({
          ...t,
          game: t.game === "CS" || t.game === "Дота" ? t.game : t.game || "",
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

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

  useEffect(() => {
    localStorage.setItem("admin_risky_teams", JSON.stringify(riskyTeams));
  }, [riskyTeams]);

  const normalizeTeamName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "");
  };

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
      // Log sample data to verify correct parsing
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

      setRiskyTeams(teamsFromSheet);

      // Debug: show sample of parsed team games
      const sampleGames = teamsFromSheet
        .slice(0, 5)
        .map((t) => `${t.name}=${t.game}`);
      console.log("[RiskMgmt] Sample teams (name=game):", sampleGames);
      console.log(
        "[RiskMgmt] Total:",
        teamsFromSheet.length,
        "CS:",
        teamsFromSheet.filter((t) => t.game === "CS").length,
        "Дота:",
        teamsFromSheet.filter((t) => t.game === "Дота").length,
      );

      localStorage.setItem("admin_risky_teams", JSON.stringify(teamsFromSheet));

      toast.success(
        `Завантажено ${teamsFromSheet.length} команд з Google Sheets!`,
        {
          description: `CS: ${teamsFromSheet.filter((t) => t.game === "CS").length} · Дота: ${teamsFromSheet.filter((t) => t.game === "Дота").length}`,
        },
      );
    } catch (error) {
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
    googleSheetsRiskyTeamsService.addTeam(newTeam.name.trim()).catch(() => {});
  };

  const deleteRiskyTeam = (index: number) => {
    if (editingIndex === index) setEditingIndex(null);
    const team = riskyTeams[index];
    setRiskyTeams(riskyTeams.filter((_, i) => i !== index));
    // Sync to backend API (by id if available, otherwise by name)
    if (team._apiId) {
      googleSheetsRiskyTeamsService.removeTeam(team._apiId).catch(() => {});
    }
  };

  const deleteAllTeams = () => {
    // Try API delete for each team
    riskyTeams.forEach((t) => {
      if (t._apiId)
        googleSheetsRiskyTeamsService.removeTeam(t._apiId).catch(() => {});
    });
    setRiskyTeams([]);
    setEditingIndex(null);
    localStorage.removeItem("admin_risky_teams");
    toast.success("Усі команди видалено");
    setIsDeleteAllOpen(false);
  };

  const startEditing = (globalIndex: number, team: RiskyTeam) => {
    setEditingIndex(globalIndex);
    setEditName(team.name);
    setEditNotes(team.notes);
    setEditStatus(team.status);
    setEditGame(team.game);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditName("");
    setEditNotes("");
    setEditStatus("");
    setEditGame("");
  };

  const saveEditing = () => {
    if (editingIndex === null || !editName.trim()) return;

    const oldGame = riskyTeams[editingIndex].game;
    const updatedTeams = [...riskyTeams];
    updatedTeams[editingIndex] = {
      ...updatedTeams[editingIndex],
      name: editName.trim(),
      notes: editNotes,
      status: editStatus,
      game: editGame,
    };
    setRiskyTeams(updatedTeams);
    setEditingIndex(null);

    if (oldGame !== editGame) {
      if (!editGame) {
        toast.success(`Команду "${editName.trim()}" оновлено`);
      } else {
        const targetLabel = editGame === "CS" ? "CS" : "Dota 2";
        toast.success(
          `Команду "${editName.trim()}" перенесено в блок ${targetLabel}`,
        );
      }
    } else {
      toast.success("Команду оновлено");
    }

    setEditName("");
    setEditNotes("");
    setEditStatus("");
    setEditGame("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "БАН":
        return "bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEF2F2] border border-[#FECACA] rounded-lg font-medium text-xs";
      case "Нестабільні":
        return "bg-[#FFF7ED] text-[#EA580C] hover:bg-[#FFF7ED] border border-[#FED7AA] rounded-lg font-medium text-xs";
      case "Обережно":
        return "bg-[#FFFBEB] text-[#D97706] hover:bg-[#FFFBEB] border border-[#FDE68A] rounded-lg font-medium text-xs";
      case "Рідко":
        return "bg-[#EFF6FF] text-[#2563EB] hover:bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg font-medium text-xs";
      case "Надійна":
        return "bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg font-medium text-xs";
      case "Без статусу":
        return "bg-[#F9FAFB] text-[#6B7280] hover:bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg font-medium text-xs";
      default:
        return "bg-[#F9FAFB] text-[#6B7280] hover:bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg font-medium text-xs";
    }
  };

  const getStatusFilterBadge = (status: string, isActive: boolean) => {
    const base = isActive
      ? "ring-2 ring-offset-1"
      : "opacity-70 hover:opacity-100";
    switch (status) {
      case "БАН":
        return `bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] ${isActive ? "ring-[#FECACA]" : ""} ${base}`;
      case "Нестабільні":
        return `bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA] ${isActive ? "ring-[#FED7AA]" : ""} ${base}`;
      case "Обережно":
        return `bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] ${isActive ? "ring-[#FDE68A]" : ""} ${base}`;
      case "Рідко":
        return `bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] ${isActive ? "ring-[#BFDBFE]" : ""} ${base}`;
      case "Надійна":
        return `bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] ${isActive ? "ring-[#BBF7D0]" : ""} ${base}`;
      case "Без статусу":
        return `bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB] ${isActive ? "ring-[#E5E7EB]" : ""} ${base}`;
      default:
        return `bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB] ${isActive ? "ring-[#E5E7EB]" : ""} ${base}`;
    }
  };

  const getGameEmoji = (game: string) => {
    if (game === "CS") return "CS:";
    if (game === "Дота") return "Дота:";
    return "";
  };

  const filteredTeams = riskyTeams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.game.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.notes.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const { completedBets, riskMetrics } = useRiskMetrics(bets);

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
      (t) => t.status === "Без статусу",
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
    "Без статусу": filteredTeams.filter((t) => t.status === "Без статусу"),
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

  const cardBaseStyle = {
    transform: "scale(1)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  };

  const cardHoverStyle = {
    transform: "scale(1.03)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)",
  };

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
            ? "bg-[#111827] text-white ring-2 ring-offset-1 ring-[#111827]"
            : "bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB] opacity-70 hover:opacity-100"
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
          className="p-4 border border-[#D1D5DB] rounded-2xl bg-[#F9FAFB] transition-all"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-[#6B7280] mb-1 block">
                  Назва команди
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-xl border border-[#E5E7EB] bg-white hover:border-[#D1D5DB] focus:border-[#111827] transition-colors text-sm"
                  placeholder="Назва команди"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#6B7280] mb-1 block">
                  Статус
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full p-2 border border-[#E5E7EB] bg-white hover:border-[#D1D5DB] focus:border-[#111827] transition-colors rounded-xl text-sm"
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
              <label className="text-xs font-medium text-[#6B7280] mb-1 flex items-center gap-1.5">
                <ArrowRightLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
                Перенести в блок
              </label>
              <select
                value={editGame || ""}
                onChange={(e) => setEditGame(e.target.value)}
                className="w-full p-2 border border-[#E5E7EB] bg-white hover:border-[#D1D5DB] focus:border-[#111827] transition-colors rounded-xl text-sm"
              >
                {(!editGame || (editGame !== "CS" && editGame !== "Дота")) && (
                  <option value="" disabled>
                    Оберіть гру...
                  </option>
                )}
                <option value="CS">🎯 CS</option>
                <option value="Дота">🛡️ Дота</option>
              </select>
              {editGame && editGame !== team.game && (
                <p className="text-xs text-[#2563EB] mt-1 flex items-center gap-1">
                  <ArrowRightLeft className="h-3 w-3" strokeWidth={1.5} />
                  Команду буде перенесено в блок{" "}
                  {editGame === "CS" ? "CS" : "Dota 2"}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B7280] mb-1 block">
                Коментар
              </label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="rounded-xl border border-[#E5E7EB] bg-white hover:border-[#D1D5DB] focus:border-[#111827] transition-colors text-sm"
                placeholder="Додайте коментар..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEditing}
                className="text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-xl text-sm"
              >
                <X className="h-4 w-4 mr-1" strokeWidth={1.5} />
                Скасувати
              </Button>
              <Button
                size="sm"
                onClick={saveEditing}
                disabled={!editName.trim()}
                className="bg-[#111827] hover:bg-[#1F2937] text-white rounded-xl text-sm"
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
        className="p-4 border border-[#D1D5DB] rounded-2xl bg-[#F9FAFB] hover:bg-[#F3F4F6] hover:border-[#9CA3AF] transition-all"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-base text-[#111827]">
                {getGameEmoji(team.game)} {team.name}
              </h3>
              <Badge className={getStatusBadge(team.status)}>
                {team.status}
              </Badge>
            </div>
            {team.notes && (
              <p className="text-sm text-[#6B7280] whitespace-pre-wrap">
                {team.notes}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startEditing(globalIndex, team)}
              className="text-[#447afc] hover:text-[#447afc] hover:bg-[#EFF6FF] rounded-xl"
            >
              <Pencil className="h-4 w-4" strokeWidth={1.5} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteRiskyTeam(globalIndex)}
              className="text-[#EF4444] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl"
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
      <div className="space-y-6">
        {/* Unified pill-bar: info + Google Sheets + Search toggle + Add team */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm border-2 border-[#E8E6DC] p-3 rounded-[32px] flex-wrap justify-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            {/* Info tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center justify-center px-3.5 py-4 rounded-[24px] bg-[#EFF6FF] text-[#3B82F6] hover:bg-[#DBEAFE] transition-colors">
                  <Info className="h-4 w-4" strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="start"
                className="max-w-xs bg-white border border-[#E5E7EB] rounded-2xl px-4 py-3 shadow-lg"
              >
                <p className="text-sm font-semibold text-[#111827] mb-1">
                  Управління ризиками
                </p>
                <p className="text-sm text-[#6B7280] leading-relaxed">
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
                  ? "bg-[#447afc] text-white"
                  : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]"
              }`}
              title="Пошук"
            >
              <Search className="h-4 w-4" strokeWidth={2} />
            </button>

            {/* Delete all — only shown when teams exist */}
            {riskyTeams.length > 0 && (
              <button
                onClick={() => setIsDeleteAllOpen(true)}
                className="flex items-center justify-center px-3.5 py-4 rounded-[24px] bg-[#F3F4F6] text-[#6B7280] hover:bg-[#FEF2F2] hover:text-[#EF4444] transition-colors"
                title="Видалити всі команди"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              </button>
            )}

            {/* Google Sheets button — opens guide modal */}
            <button
              onClick={() => setIsSheetsGuideOpen(true)}
              disabled={isUpdating}
              className="flex items-center gap-2 px-6 py-4 text-base rounded-[24px] font-light text-[#9CA3AF] hover:bg-[#F5F5F3] hover:text-[#6B7280] transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="w-px h-7 bg-[#E8E6DC] mx-0.5" />

            {/* Add new team — accent blue */}
            <button
              onClick={() => setIsAddTeamOpen(true)}
              className="flex items-center gap-2 px-6 py-4 text-base rounded-[24px] font-semibold bg-[#447afc] text-white hover:bg-[#5b8ffd] shadow-[0_2px_8px_rgba(68,122,252,0.3)] transition-all duration-300 ease-in-out"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Додати нову команду
            </button>
          </div>
        </div>

        {/* Inline search input — shown when toggled */}
        {isSearchOpen && (
          <div
            className="bg-white border border-[#E5E7EB] rounded-2xl p-4"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]"
                strokeWidth={1.5}
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук за назвою, грою, статусом або примітками..."
                className="pl-10 w-full rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#111827] transition-colors text-sm"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Team-focused Overview Cards */}
        <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total risky teams */}
            <div
              className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
              style={cardBaseStyle}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, cardHoverStyle);
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, cardBaseStyle);
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF]">
                  <Shield
                    className="h-5 w-5 text-[#447afc]"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-sm font-medium text-[#6B7280] uppercase tracking-wider">
                  Всього команд
                </span>
              </div>
              <div className="text-2xl font-bold text-[#111827] tracking-tight mb-2">
                {teamStats.total}
              </div>
              <Badge className="bg-[#F0FDF4] text-[#16A34A] hover:bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg font-medium text-xs px-3 py-1.5">
                CS: {teamStats.csCount} · Dota: {teamStats.dotaCount}
              </Badge>
            </div>

            {/* БАН — forbidden teams */}
            <div
              className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
              style={cardBaseStyle}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, cardHoverStyle);
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, cardBaseStyle);
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF]">
                  <TrendingDown
                    className="h-5 w-5 text-[#447afc]"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-sm font-medium text-[#6B7280] uppercase tracking-wider">
                  Заборонені
                </span>
              </div>
              <div className="text-2xl font-bold text-[#111827] tracking-tight mb-2">
                {teamStats.banCount}
              </div>
              <Badge className="bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEF2F2] border border-[#FECACA] rounded-lg font-medium text-xs px-3 py-1.5">
                БАН · {teamStats.banPercentage}% від усіх
              </Badge>
            </div>

            {/* Потребують уваги (БАН + Нестабільні) */}
            <div
              className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
              style={cardBaseStyle}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, cardHoverStyle);
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, cardBaseStyle);
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF]">
                  <AlertTriangle
                    className="h-5 w-5 text-[#447afc]"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-sm font-medium text-[#6B7280] uppercase tracking-wider">
                  Високий ризик
                </span>
              </div>
              <div className="text-2xl font-bold text-[#111827] tracking-tight mb-2">
                {teamStats.attentionCount}
              </div>
              <Badge className="bg-[#FFF7ED] text-[#EA580C] hover:bg-[#FFF7ED] border border-[#FED7AA] rounded-lg font-medium text-xs px-3 py-1.5">
                БАН: {teamStats.banCount} · Нестабільні:{" "}
                {teamStats.unstableCount}
              </Badge>
            </div>

            {/* Game dominance */}
            <div
              className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 group"
              style={cardBaseStyle}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, cardHoverStyle);
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, cardBaseStyle);
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF]">
                  <Target
                    className="h-5 w-5 text-[#447afc]"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-sm font-medium text-[#6B7280] uppercase tracking-wider">
                  Основна гра
                </span>
              </div>
              <div className="text-2xl font-bold text-[#111827] tracking-tight mb-2">
                {teamStats.dominantGame}
              </div>
              <Badge className="bg-[#F3F4F6] text-[#374151] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg font-medium text-xs px-3 py-1.5">
                {teamStats.dominantGameCount} команд у списку
              </Badge>
            </div>
          </div>
        </div>

        {/* Google Sheets Guide Dialog */}
        <Dialog open={isSheetsGuideOpen} onOpenChange={setIsSheetsGuideOpen}>
          <DialogContent className="rounded-3xl max-w-2xl border border-[#E5E7EB] p-0 gap-0">
            <DialogHeader className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-100 flex-shrink-0">
                  <Download
                    className="h-5 w-5 text-[#2563EB]"
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-[#111827]">
                    Підтягнути команди з Google Sheets
                  </DialogTitle>
                  <DialogDescription className="text-[#6B7280] mt-0.5">
                    Як оформити документ, щоб дані правильно підтягнулись
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="border-t border-[#E5E7EB]" />

            <div className="space-y-3 px-5 pt-4 pb-5 bg-[#F3F4F6]">
              {/* Step 1 */}
              <div className="p-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#447afc] text-white font-semibold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-[#111827] mb-1">
                      Створіть Google Sheets документ
                    </h4>
                    <p className="text-sm text-[#6B7280] leading-relaxed">
                      Відкрийте новий документ на{" "}
                      <span className="font-medium text-[#111827]">
                        Google Sheets
                      </span>{" "}
                      і дайте йому будь-яку назву.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#447afc] text-white font-semibold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-[#111827] mb-2">
                      Оформіть колонки
                    </h4>
                    <div className="overflow-hidden rounded-xl border border-[#D1D5DB] bg-white">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-[#F3F4F6]">
                          <tr>
                            <th className="text-left px-3 py-2 font-semibold text-[#111827] border-r border-b border-[#D1D5DB]">A — Назва команди</th>
                            <th className="text-left px-3 py-2 font-semibold text-[#111827] border-b border-[#D1D5DB]">B — Статус</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-3 py-2 text-[#374151] border-r border-b border-[#E5E7EB]">Vitality</td>
                            <td className="px-3 py-2 text-[#374151] border-b border-[#E5E7EB]">🟩 CS: У фіналах часто вимикаються…</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-[#374151] border-r border-b border-[#E5E7EB]">Team Spirit</td>
                            <td className="px-3 py-2 text-[#374151] border-b border-[#E5E7EB]">🟨 Dota2: Тільки на +1.5, часто заливають</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-[#374151] border-r border-b border-[#E5E7EB]">Virtus Pro</td>
                            <td className="px-3 py-2 text-[#374151] border-b border-[#E5E7EB]">🟥 CS: Раки — дуже рідко на них варто щось ставити</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-[#9CA3AF] mt-2">
                      💡 Перший рядок може бути заголовком — він буде автоматично проігнорований.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 — Open access */}
              <div className="p-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#447afc] text-white font-semibold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-[#111827] mb-1">
                      Відкрийте доступ до документу
                    </h4>
                    <p className="text-sm text-[#6B7280] leading-relaxed">
                      Натисніть{" "}
                      <span className="font-medium text-[#111827]">
                        «Поділитися» → «Усі, хто має посилання» → «Читач»
                      </span>
                      , щоб документ був доступний для читання.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 bg-[#EFF6FF] rounded-2xl border border-[#BFDBFE]">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white font-semibold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-[#111827] mb-2">
                      Вставте посилання на ваш документ
                    </h4>
                    <p className="text-sm text-[#6B7280] mb-3">
                      Скопіюйте посилання з адресного рядка браузера та вставте
                      його сюди. Ви можете використовувати{" "}
                      <span className="font-medium text-[#111827]">
                        власний
                      </span>{" "}
                      Google Sheets документ.
                    </p>
                    <Input
                      value={customSheetUrl}
                      onChange={(e) => setCustomSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/ВАШ_ID/edit"
                      className="rounded-xl border-[#BFDBFE] focus:border-[#2563EB] bg-white text-sm"
                    />
                    {customSheetUrl.trim() &&
                      !extractSheetId(customSheetUrl.trim()) && (
                        <p className="text-xs text-[#EF4444] mt-1.5">
                          ❌ Неправильний формат посилання. Перевірте, чи
                          скопійовано повне посилання з Google Sheets.
                        </p>
                      )}
                    {customSheetUrl.trim() &&
                      extractSheetId(customSheetUrl.trim()) && (
                        <p className="text-xs text-[#16A34A] mt-1.5">
                          ✓ Посилання правильне. Будуть завантажені команди з
                          вашого документу.
                        </p>
                      )}
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl flex items-start gap-2">
                <AlertTriangle
                  className="h-4 w-4 text-[#DC2626] flex-shrink-0 mt-0.5"
                  strokeWidth={1.75}
                />
                <div className="text-sm text-[#111827]">
                  <span className="font-semibold text-[#DC2626]">Важливо:</span> при оновленні{" "}
                  <strong>всі команди замінюються</strong> даними з Google
                  Sheets. Документ є джерелом правди — локальні зміни будуть
                  перезаписані.
                </div>
              </div>
            </div>

            <div className="border-t border-[#E5E7EB] px-5 py-3">
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsSheetsGuideOpen(false)}
                  disabled={isUpdating}
                  className="rounded-xl border-[#E5E7EB] font-medium"
                >
                  Скасувати
                </Button>
                <Button
                  onClick={async () => {
                    await updateFromGoogleSheets();
                    setIsSheetsGuideOpen(false);
                  }}
                  disabled={isUpdating}
                  className="rounded-xl bg-[#447afc] hover:bg-[#3568d4] text-white font-medium"
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
          <DialogContent className="rounded-3xl max-w-2xl border border-[#E5E7EB] bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-[#111827]">
                <div className="p-2.5 bg-[#EFF6FF] rounded-xl">
                  <Plus className="h-5 w-5 text-[#3B82F6]" strokeWidth={1.75} />
                </div>
                Додати нову команду
              </DialogTitle>
              <DialogDescription className="text-[#6B7280]">
                Заповніть інформацію про ризикову команду
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              <div>
                <label className="text-sm font-medium text-[#6B7280]">
                  Назва команди
                </label>
                <Input
                  value={newTeam.name}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, name: e.target.value })
                  }
                  placeholder="Введіть назву команди"
                  className="mt-1 rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#111827] transition-colors text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#6B7280]">
                  Гра
                </label>
                <select
                  value={newTeam.game}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, game: e.target.value })
                  }
                  className="w-full p-2 border border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#111827] transition-colors rounded-xl mt-1 text-sm"
                >
                  <option value="CS">CS</option>
                  <option value="Дота">Дота</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#6B7280]">
                  Статус
                </label>
                <select
                  value={newTeam.status}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, status: e.target.value })
                  }
                  className="w-full p-2 border border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#111827] transition-colors rounded-xl mt-1 text-sm"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-[#6B7280]">
                  Примітки
                </label>
                <Textarea
                  value={newTeam.notes}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, notes: e.target.value })
                  }
                  placeholder="Додайте примітки про команду"
                  className="mt-1 rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#111827] transition-colors text-sm"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddTeamOpen(false)}
                className="rounded-xl border-[#E5E7EB] font-medium"
              >
                Скасувати
              </Button>
              <Button
                onClick={() => {
                  addRiskyTeam();
                  if (newTeam.name.trim()) setIsAddTeamOpen(false);
                }}
                className="bg-[#447afc] hover:bg-[#5b8ffd] text-white rounded-xl text-sm px-6 font-semibold"
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
          <DialogContent className="rounded-3xl max-w-md border border-[#E5E7EB] p-0 gap-0">
            <DialogHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-red-100 flex-shrink-0">
                  <Trash2
                    className="h-5 w-5 text-[#DC2626]"
                    strokeWidth={1.5}
                  />
                </div>
                <DialogTitle className="text-xl font-semibold text-[#111827]">
                  Видалити всі команди?
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="border-t border-[#E5E7EB]" />

            <div className="px-6 pb-6 pt-4 space-y-3 bg-[#F3F4F6]">
              <div className="text-center">
                <div className="flex flex-col items-center px-5 py-5 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
                  <DialogDescription className="text-lg font-bold text-[#111827] text-center">
                    Усі команди
                  </DialogDescription>
                  <span className="text-4xl font-bold text-[#DC2626] mt-1">
                    {riskyTeams.length}
                  </span>
                  <span className="text-xs text-[#6B7280] mt-0.5">
                    команд буде видалено
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-[#FECACA]">
                <AlertTriangle
                  className="h-5 w-5 text-[#DC2626] flex-shrink-0 mt-0.5"
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
                  className="rounded-xl border-[#E5E7EB] font-medium"
                >
                  Скасувати
                </Button>
                <Button
                  onClick={deleteAllTeams}
                  className="rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-medium"
                >
                  <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Видалити всі
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Teams by Game */}
        <div className="bg-white/60 backdrop-blur-sm rounded-[32px] p-5 border-2 border-[#E8E6DC] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* CS Teams */}
            <Card
              className="border border-[#D1D5DB] rounded-2xl bg-white overflow-hidden"
              style={{ boxShadow: chartCardShadow }}
            >
              <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
                <CardTitle className="flex items-center justify-between text-lg font-semibold text-[#111827]">
                  <span className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#EFF6FF] rounded-xl">
                      <img src="/assets/team-placeholder.svg" alt="CS2" className="h-5 w-5 object-contain" />
                    </div>
                    CS команди
                  </span>
                </CardTitle>
                <div className="border-t border-[#E5E7EB] -mx-6 mt-0 mb-0" />
                {renderStatusFilter(
                  csStatusFilter,
                  setCsStatusFilter,
                  csStatusCounts,
                )}
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {csTeams.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                      <div className="p-8 bg-[#F3F4F6] rounded-2xl inline-block mb-6">
                        <img src="/assets/team-placeholder.svg" alt="CS2" className="h-16 w-16 object-contain" />
                      </div>
                      <h3 className="text-xl font-semibold text-[#111827] mb-2">
                        Немає команд CS
                      </h3>
                      <p className="text-[#6B7280] text-sm mb-6">
                        {csStatusFilter !== "all"
                          ? `Немає CS команд зі статусом "${csStatusFilter}"`
                          : "Додайте ризиковані команди CS для відстеження"}
                      </p>
                      {csStatusFilter !== "all" ? (
                        <Button
                          onClick={() => setCsStatusFilter("all")}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#447afc] hover:bg-[#3568d4] text-white text-base font-semibold transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" strokeWidth={2} />
                          Скинути фільтр
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setIsAddTeamOpen(true)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#447afc] hover:bg-[#3568d4] text-white text-base font-semibold transition-colors"
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
              className="border border-[#D1D5DB] rounded-2xl bg-white overflow-hidden"
              style={{ boxShadow: chartCardShadow }}
            >
              <CardHeader className="bg-white border-b border-[#E5E7EB] p-6">
                <CardTitle className="flex items-center justify-between text-lg font-semibold text-[#111827]">
                  <span className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#EFF6FF] rounded-xl">
                      <img src="/assets/team-placeholder-dota.svg" alt="Dota2" className="h-5 w-5 object-contain" />
                    </div>
                    Dota 2 команди
                  </span>
                </CardTitle>
                <div className="border-t border-[#E5E7EB] -mx-6 mt-0 mb-0" />
                {renderStatusFilter(
                  dotaStatusFilter,
                  setDotaStatusFilter,
                  dotaStatusCounts,
                )}
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {dotaTeams.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                      <div className="p-8 bg-[#F3F4F6] rounded-2xl inline-block mb-6">
                        <img src="/assets/team-placeholder-dota.svg" alt="Dota2" className="h-16 w-16 object-contain" />
                      </div>
                      <h3 className="text-xl font-semibold text-[#111827] mb-2">
                        Немає команд Dota 2
                      </h3>
                      <p className="text-[#6B7280] text-sm mb-6">
                        {dotaStatusFilter !== "all"
                          ? `Немає Dota 2 команд зі статусом "${dotaStatusFilter}"`
                          : "Додайте ризиковані команди Dota 2 для відстеження"}
                      </p>
                      {dotaStatusFilter !== "all" ? (
                        <Button
                          onClick={() => setDotaStatusFilter("all")}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#447afc] hover:bg-[#3568d4] text-white text-base font-semibold transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" strokeWidth={2} />
                          Скинути фільтр
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setIsAddTeamOpen(true)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#447afc] hover:bg-[#3568d4] text-white text-base font-semibold transition-colors"
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
                className="border border-[#BFDBFE] rounded-2xl bg-white overflow-hidden lg:col-span-2"
                style={{ boxShadow: chartCardShadow }}
              >
                <CardHeader className="bg-[#EFF6FF] border-b border-[#BFDBFE] p-6">
                  <CardTitle className="flex items-center justify-between text-lg font-semibold text-[#111827]">
                    <span className="flex items-center gap-3">
                      <div className="p-2.5 bg-[#DBEAFE] rounded-xl">
                        <Pencil
                          className="h-5 w-5 text-[#2563EB]"
                          strokeWidth={1.5}
                        />
                      </div>
                      Без категорії
                    </span>
                    <Badge className="bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#DBEAFE] px-3 py-1.5 rounded-lg border border-[#BFDBFE] font-semibold text-sm">
                      {uncategorizedTeams.length}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-[#1E40AF] mt-2 flex items-center gap-1.5">
                    <Info className="h-4 w-4" strokeWidth={1.5} />
                    Команди без визначеної гри або статусу. Натисніть{" "}
                    <Pencil
                      className="h-3.5 w-3.5 inline"
                      strokeWidth={1.5}
                    />{" "}
                    щоб відредагувати.
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
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
        {(riskMetrics.currentDrawdown > 15 ||
          riskMetrics.consecutiveLosses > 5) && (
          <Alert className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4">
            <AlertTriangle
              className="h-4 w-4 text-[#EF4444]"
              strokeWidth={1.5}
            />
            <AlertDescription className="text-sm text-[#991B1B] ml-2">
              <strong className="font-semibold">Попередження про ризик:</strong>
              {riskMetrics.currentDrawdown > 15 &&
                ` Поточна просадка ${riskMetrics.currentDrawdown}% перевищує рекомендований поріг.`}
              {riskMetrics.consecutiveLosses > 5 &&
                ` ${riskMetrics.consecutiveLosses} послідовних програшів вказують на необхідність перегляду стратегії.`}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </TooltipProvider>
  );
}

// unique: 20260629003707
