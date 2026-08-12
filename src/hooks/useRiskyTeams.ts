import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { googleSheetsRiskyTeamsService } from "@/lib/googleSheetsRiskyTeams";
import { type RiskyTeam } from "@/data/riskyTeams";

// ── Constants ──
const ALL_STATUSES = ["БАН", "Ризиковані", "Нестабільні", "Обережно", "Під питанням", "Стабільні", "Надійна", "Неоцінена"] as const;

// ── Pure utilities ──
const normalizeGame = (game?: string): string => {
  if (!game) return "CS";
  const g = game.toLowerCase().trim();
  if (g === "dota2" || g === "dota" || g === "дота") return "Дота";
  if (g === "cs2" || g === "cs:go" || g === "csgo" || g === "cs") return "CS";
  return game;
};

const extractSheetId = (url: string): string | null => {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : null;
};

const extractSheetGid = (url: string): string | null => {
  const m = url.match(/[?&]gid=(\d+)/);
  return m ? m[1] : null;
};

export { ALL_STATUSES, normalizeGame };

// ── Hook ──
export function useRiskyTeams() {
  const [riskyTeams, setRiskyTeams] = useState<RiskyTeam[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isSheetsGuideOpen, setIsSheetsGuideOpen] = useState(false);
  const [customSheetUrl, setCustomSheetUrl] = useState("");

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editGame, setEditGame] = useState("");

  const [csStatusFilter, setCsStatusFilter] = useState<string>("all");
  const [dotaStatusFilter, setDotaStatusFilter] = useState<string>("all");
  const initializedRef = useRef(false);

  const [newTeam, setNewTeam] = useState<RiskyTeam>({ name: "", game: "CS", status: "Під питанням", notes: "" });

  // ── Effects ──
  useEffect(() => {
    if (initializedRef.current) localStorage.setItem("admin_risky_teams", JSON.stringify(riskyTeams));
  }, [riskyTeams]);

  useEffect(() => {
    const saved = localStorage.getItem("admin_risky_teams");
    let parsed: RiskyTeam[] | null = null;
    if (saved) { try { const p = JSON.parse(saved); if (Array.isArray(p) && p.length > 0) parsed = p; } catch { /* ignore */ } }

    if (parsed) {
      setRiskyTeams(parsed.map((t) => ({ ...t, game: normalizeGame(t.game) })));
      setIsLoadingTeams(false); initializedRef.current = true;
    } else if (saved === null) {
      let cancelled = false;
      (async () => {
        try { const teams = await googleSheetsRiskyTeamsService.fetchRiskyTeams(); if (!cancelled && teams.length > 0) { setRiskyTeams(teams); localStorage.setItem("admin_risky_teams", JSON.stringify(teams)); } }
        catch { /* ignore */ }
        if (!cancelled) { setIsLoadingTeams(false); initializedRef.current = true; }
      })();
      setIsLoadingTeams(true);
      return () => { cancelled = true; };
    } else { setIsLoadingTeams(false); initializedRef.current = true; }
  }, []);

  // ── Handlers ──
  const updateFromGoogleSheets = async () => {
    setIsUpdating(true);
    try {
      const id = customSheetUrl.trim() ? extractSheetId(customSheetUrl.trim()) : null;
      const gid = customSheetUrl.trim() ? extractSheetGid(customSheetUrl.trim()) : null;
      const teams = await googleSheetsRiskyTeamsService.fetchRiskyTeams(id || undefined, gid || undefined);
      if (!teams.length) { toast.error("Не знайдено команд"); return; }
      const synced = await Promise.all(teams.map(async (t) => { try { const a = await googleSheetsRiskyTeamsService.addTeamAndGet(t.name, t.game, t.status, t.notes); return { ...t, _apiId: a?.id }; } catch { return t; } }));
      setRiskyTeams(synced);
      toast.success(`Завантажено ${teams.length} команд!`, { description: `CS: ${teams.filter((t) => t.game === "CS").length} · Дота: ${teams.filter((t) => t.game === "Дота").length}` });
    } catch (e) { toast.error("Помилка оновлення", { description: e instanceof Error ? e.message : "Невідома помилка" }); }
    finally { setIsUpdating(false); }
  };

  const addRiskyTeam = async () => {
    if (!newTeam.name.trim()) return;
    setRiskyTeams([...riskyTeams, { ...newTeam }]);
    setNewTeam({ name: "", game: "CS", status: "Під питанням", notes: "" });
    googleSheetsRiskyTeamsService.addTeam(newTeam.name.trim(), newTeam.game, newTeam.status, newTeam.notes).catch(() => {});
  };

  const deleteRiskyTeam = (index: number) => {
    if (editingIndex === index) setEditingIndex(null);
    const team = riskyTeams[index];
    setRiskyTeams(riskyTeams.filter((_, i) => i !== index));
    if (team._apiId) googleSheetsRiskyTeamsService.removeTeam(team._apiId).catch(() => {});
  };

  const deleteAllTeams = () => {
    riskyTeams.forEach((t) => { if (t._apiId) googleSheetsRiskyTeamsService.removeTeam(t._apiId).catch(() => {}); });
    setRiskyTeams([]); setEditingIndex(null);
    localStorage.setItem("admin_risky_teams", JSON.stringify([]));
    toast.success("Усі команди видалено"); setIsDeleteAllOpen(false);
  };

  const startEditing = (idx: number, team: RiskyTeam) => { setEditingIndex(idx); setEditName(team.name); setEditNotes(team.notes); setEditStatus(team.status); setEditGame(normalizeGame(team.game)); };
  const cancelEditing = () => { setEditingIndex(null); setEditName(""); setEditNotes(""); setEditStatus(""); setEditGame(""); };

  const saveEditing = async () => {
    if (editingIndex === null || !editName.trim()) return;
    const oldGame = riskyTeams[editingIndex].game;
    const newGame = editGame || "CS";
    const updated = [...riskyTeams];
    updated[editingIndex] = { ...updated[editingIndex], name: editName.trim(), notes: editNotes, status: editStatus, game: newGame };
    const savedTeam = updated[editingIndex];
    setRiskyTeams(updated); localStorage.setItem("admin_risky_teams", JSON.stringify(updated)); setEditingIndex(null);
    try {
      if (savedTeam._apiId) await googleSheetsRiskyTeamsService.updateTeam(savedTeam._apiId, { name: savedTeam.name, game: savedTeam.game, status: savedTeam.status, notes: savedTeam.notes });
      else { const added = await googleSheetsRiskyTeamsService.addTeamAndGet(savedTeam.name, savedTeam.game, savedTeam.status, savedTeam.notes); if (added?.id) { const wId = updated.map((t, i) => i === editingIndex ? { ...t, _apiId: added.id } : t); setRiskyTeams(wId); localStorage.setItem("admin_risky_teams", JSON.stringify(wId)); } }
    } catch { /* ignore */ }
    if (oldGame !== newGame) toast.success(`Команду "${editName.trim()}" перенесено в блок ${newGame === "CS" ? "CS" : "Dota 2"}`);
    else toast.success("Команду оновлено");
    setEditName(""); setEditNotes(""); setEditStatus(""); setEditGame("");
  };

  // ── Derived ──
  const filteredTeams = useMemo(() => riskyTeams.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.game.toLowerCase().includes(searchQuery.toLowerCase()) || t.status.toLowerCase().includes(searchQuery.toLowerCase()) || t.notes.toLowerCase().includes(searchQuery.toLowerCase())
  ), [riskyTeams, searchQuery]);

  const teamStats = useMemo(() => {
    const total = riskyTeams.length;
    const cs = riskyTeams.filter((t) => t.game === "CS").length;
    const dota = riskyTeams.filter((t) => t.game === "Дота").length;
    const ban = riskyTeams.filter((t) => t.status === "БАН").length;
    const unstable = riskyTeams.filter((t) => t.status === "Ризиковані").length;
    const careful = riskyTeams.filter((t) => t.status === "Під питанням").length;
    const rare = riskyTeams.filter((t) => t.status === "Стабільні").length;
    const reliable = riskyTeams.filter((t) => t.status === "Надійна").length;
    const noStatus = riskyTeams.filter((t) => t.status === "Неоцінена").length;
    return { total, csCount: cs, dotaCount: dota, banCount: ban, unstableCount: unstable, carefulCount: careful, rareCount: rare, reliableCount: reliable, noStatusCount: noStatus, attentionCount: ban + unstable, dominantGame: cs >= dota ? "CS" : "Dota 2", dominantGameCount: Math.max(cs, dota), banPercentage: total > 0 ? Math.round((ban / total) * 100) : 0 };
  }, [riskyTeams]);

  const csTeams = useMemo(() => filteredTeams.filter((t) => t.game === "CS" && (csStatusFilter === "all" || t.status === csStatusFilter)), [filteredTeams, csStatusFilter]);
  const dotaTeams = useMemo(() => filteredTeams.filter((t) => t.game === "Дота" && (dotaStatusFilter === "all" || t.status === dotaStatusFilter)), [filteredTeams, dotaStatusFilter]);
  const uncategorizedTeams = useMemo(() => filteredTeams.filter((t) => t.game !== "CS" && t.game !== "Дота"), [filteredTeams]);

  const csStatusCounts = useMemo(() => { const all = filteredTeams.filter((t) => t.game === "CS"); const c: Record<string, number> = { all: all.length }; ALL_STATUSES.forEach((s) => { c[s] = all.filter((t) => t.status === s).length; }); return c; }, [filteredTeams]);
  const dotaStatusCounts = useMemo(() => { const all = filteredTeams.filter((t) => t.game === "Дота"); const c: Record<string, number> = { all: all.length }; ALL_STATUSES.forEach((s) => { c[s] = all.filter((t) => t.status === s).length; }); return c; }, [filteredTeams]);

  return {
    riskyTeams, isLoadingTeams, searchQuery, setSearchQuery, isUpdating,
    isAddTeamOpen, setIsAddTeamOpen, isSearchOpen, setIsSearchOpen,
    isDeleteAllOpen, setIsDeleteAllOpen, isSheetsGuideOpen, setIsSheetsGuideOpen,
    customSheetUrl, setCustomSheetUrl, editingIndex, editName, setEditName,
    editNotes, setEditNotes, editStatus, setEditStatus, editGame, setEditGame,
    csStatusFilter, setCsStatusFilter, dotaStatusFilter, setDotaStatusFilter,
    updateFromGoogleSheets, addRiskyTeam, deleteRiskyTeam, deleteAllTeams,
    startEditing, cancelEditing, saveEditing,
    filteredTeams, teamStats, csTeams, dotaTeams, uncategorizedTeams,
    csStatusCounts, dotaStatusCounts, newTeam, setNewTeam,
  };
}
