import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/apiClient";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserDataService } from "@/lib/userDataService";
import { useAuth } from "@/contexts/AuthContext";
import { logRender } from "@/lib/devLogger";
import { toast } from "sonner";
import {
  MessageCircle,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  ExternalLink,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Pencil,
  Save,
  X,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  RefreshCw,
  Search,
  MoreHorizontal,
} from "lucide-react";
import {
  CHART_CARD_SHADOW,
  CARD_BASE_STYLE,
  applyCardHover,
  resetCardHover,
} from "@/lib/cardStyles";

// ── Helpers ──

/** Convert any Telegram link to web preview URL (no account needed for public channels) */
function toWebPreviewUrl(link: string): string {
  if (!link) return "";
  // Already a /s/ link
  if (link.includes("/s/")) return link;
  // https://t.me/name → https://t.me/s/name
  return link.replace(/^(https?:\/\/)?t\.me\/(?!s\/)/, "$1t.me/s/");
}

/** Extract handle from Telegram link for display */
function tgHandle(link: string): string {
  if (!link) return "";
  const match = link.match(/t\.me\/(?:s\/)?([^/\s?#]+)/);
  return match ? "@" + match[1] : link;
}

// ── Types ──

interface TelegramGroup {
  id: string;
  name: string;
  link: string;
  createdAt: string;
  _backendId?: string;
}

interface TelegramGroupBet {
  id: string;
  groupId: string;
  date: string;
  match: string;
  team1: string;
  team2: string;
  betType: string;
  odds: number;
  amount: number;
  result: "Win" | "Loss" | "Pending";
  profit: number;
  notes: string;
  createdAt: number;
}

interface GroupStats {
  groupId: string;
  groupName: string;
  totalBets: number;
  wins: number;
  losses: number;
  pending: number;
  totalProfit: number;
  winRate: number;
  roi: number;
  stability: number; // 0-100 stability score
  stabilityLabel: string; // "Стабільна" / "Хитка" / "Нестабільна" / "Немає даних"
  streak: number; // current W/L streak (positive=wins, negative=losses)
  monthlyProfit: { month: string; profit: number }[];
}

// ── Empty templates ──

const EMPTY_GROUP: Omit<TelegramGroup, "id" | "createdAt"> = {
  name: "",
  link: "",
};

// ── Component ──

export default function TelegramGroups() {
  logRender("TelegramGroups");
  const { user } = useAuth();
  const currentUser = user?.username || "";

  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [bets, setBets] = useState<TelegramGroupBet[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load user data: try API first, fallback to localStorage
  useEffect(() => {
    if (!currentUser || dataLoaded) return;
    const load = async () => {
      const localGroups = UserDataService.getUserData<TelegramGroup[]>(
        currentUser,
        "tg_groups",
        [],
      );
      // Try API first
      try {
        const apiGroups = await api.get<TelegramGroup[]>("/telegram-groups");
        if (apiGroups.length > 0) {
          setGroups(apiGroups);
        } else {
          setGroups(localGroups);
          // Seed localStorage groups to DB, save backend UUIDs
          const updated: TelegramGroup[] = [];
          for (const g of localGroups) {
            try {
              const backend = await api.post<{ id: string }>(
                "/telegram-groups",
                { name: g.name, link: g.link || "" },
              );
              updated.push({ ...g, _backendId: backend.id });
            } catch {
              updated.push(g);
            }
          }
          if (updated.some((g) => g._backendId)) {
            UserDataService.setUserDataSync(currentUser, "tg_groups", updated);
            setGroups(updated);
          }
        }
      } catch {
        setGroups(localGroups);
      }
      setBets(
        UserDataService.getUserData<TelegramGroupBet[]>(
          currentUser,
          "tg_bets",
          [],
        ),
      );
      setDataLoaded(true);
    };
    load();
  }, [currentUser, dataLoaded]);

  // Reload when username changes (logout/login)
  useEffect(() => {
    setDataLoaded(false);
  }, [currentUser]);

  // Refs for immediate save (avoid effect delay on navigation)
  const groupsRef = useRef(groups);
  groupsRef.current = groups;
  const betsRef = useRef(bets);
  betsRef.current = bets;

  // Persist — write immediately when data changes (ref-based for navigation safety)
  useEffect(() => {
    if (!currentUser || !dataLoaded) return;
    UserDataService.setUserDataSync(currentUser, "tg_groups", groups);
  }, [groups, currentUser, dataLoaded]);
  useEffect(() => {
    if (!currentUser || !dataLoaded) return;
    UserDataService.setUserDataSync(currentUser, "tg_bets", bets);
    // Sync all tg bets to API (fire-and-forget)
    UserDataService.saveTelegramBet({ bets }).catch(() => {});
  }, [bets, currentUser, dataLoaded]);

  // Dialogs
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TelegramGroup | null>(null);
  const [groupForm, setGroupForm] = useState({ ...EMPTY_GROUP });
  const [deleteGroupConfirm, setDeleteGroupConfirm] = useState<string | null>(
    null,
  );

  // Filters & sort
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [groupSearch, setGroupSearch] = useState("");
  const [groupListFilter, setGroupListFilter] = useState<"all" | "profitable">(
    "all",
  );
  const [sortBy] = useState<"date" | "odds" | "profit">("date");
  const [sortOrder] = useState<"asc" | "desc">("desc");

  // ── Group CRUD ──

  const handleSaveGroup = () => {
    if (!groupForm.name.trim()) {
      toast.error("Введіть назву групи");
      return;
    }

    let newGroups: TelegramGroup[];
    let freshGroupId: string | null = null;
    if (editingGroup) {
      newGroups = groupsRef.current.map((g) =>
        g.id === editingGroup.id
          ? { ...g, name: groupForm.name.trim(), link: groupForm.link.trim() }
          : g,
      );
      toast.success("Групу оновлено");
    } else {
      const newGroup: TelegramGroup = {
        id: crypto.randomUUID(),
        name: groupForm.name.trim(),
        link: groupForm.link.trim(),
        createdAt: new Date().toISOString(),
      };
      freshGroupId = newGroup.id;
      newGroups = [...groupsRef.current, newGroup];
      toast.success("Групу додано!");
    }
    setGroups(newGroups);
    if (currentUser)
      UserDataService.setUserDataSync(currentUser, "tg_groups", newGroups);
    // Sync to backend and save backend UUID
    if (!editingGroup && freshGroupId) {
      api
        .post<{ id?: string }>("/telegram-groups", {
          name: groupForm.name.trim(),
          link: groupForm.link.trim(),
        })
        .then((backend) => {
          if (backend?.id) {
            const saved = UserDataService.getUserData<TelegramGroup[]>(
              currentUser,
              "tg_groups",
              [],
            );
            const idx = saved.findIndex((g) => g.id === freshGroupId);
            if (idx >= 0) {
              saved[idx] = { ...saved[idx], _backendId: backend.id };
              UserDataService.setUserDataSync(currentUser, "tg_groups", saved);
            }
          }
        })
        .catch((err: unknown) => {
          if (import.meta.env.DEV)
            console.warn("[API] Group save failed:", err);
        });
    }

    setGroupDialogOpen(false);
    setEditingGroup(null);
    setGroupForm({ ...EMPTY_GROUP });
  };

  const handleDeleteGroup = (groupId: string) => {
    const newGroups = groupsRef.current.filter((g) => g.id !== groupId);
    const newBets = betsRef.current.filter((b) => b.groupId !== groupId);
    setGroups(newGroups);
    setBets(newBets);
    if (currentUser) {
      UserDataService.setUserDataSync(currentUser, "tg_groups", newGroups);
      UserDataService.setUserDataSync(currentUser, "tg_bets", newBets);
    }
    // Sync to backend — use _backendId if available, fallback to local ID
    const groupToDelete = groupsRef.current.find((g) => g.id === groupId);
    const backendId =
      (groupToDelete as { _backendId?: string })?._backendId || groupId;
    api.delete(`/telegram-groups/${backendId}`).catch((err: unknown) => {
      if (import.meta.env.DEV) console.warn("[API] Group delete failed:", err);
    });
    toast.success("Групу та її ставки видалено");
    setDeleteGroupConfirm(null);
  };

  const handleDeleteBet = (betId: string) => {
    const newBets = betsRef.current.filter((b) => b.id !== betId);
    setBets(newBets);
    if (currentUser)
      UserDataService.setUserDataSync(currentUser, "tg_bets", newBets);
    toast.success("Ставку видалено");
  };

  const openEditBet = () => {
    toast.info(
      "Редагування ставок з Telegram буде доступне в наступних оновленнях",
    );
  };

  // ── Stats calculation ──

  const groupStats = useMemo((): GroupStats[] => {
    return groups.map((group) => {
      const groupBets = bets.filter((b) => b.groupId === group.id);
      const completed = groupBets.filter((b) => b.result !== "Pending");
      const wins = completed.filter((b) => b.result === "Win").length;
      const losses = completed.filter((b) => b.result === "Loss").length;
      const totalProfit = groupBets.reduce(
        (sum, b) => sum + (b.profit || 0),
        0,
      );
      const totalStake = groupBets.reduce((sum, b) => sum + (b.amount || 0), 0);
      const winRate =
        completed.length > 0 ? (wins / completed.length) * 100 : 0;
      const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;

      // Stability score: standard deviation of per-bet profit, lower = more stable
      const profits = completed.map((b) => b.profit || 0);
      const avgProfit =
        profits.length > 0
          ? profits.reduce((s, v) => s + v, 0) / profits.length
          : 0;
      const variance =
        profits.length > 1
          ? profits.reduce((s, v) => s + Math.pow(v - avgProfit, 2), 0) /
            profits.length
          : 0;
      const stdDev = Math.sqrt(variance);
      const stability =
        profits.length >= 5
          ? Math.max(
              0,
              Math.min(100, 100 - (stdDev / (Math.abs(avgProfit) + 1)) * 20),
            )
          : profits.length > 0
            ? 60
            : 0;
      const stabilityLabel =
        profits.length < 3
          ? "Немає даних"
          : stability >= 70
            ? "Стабільна"
            : stability >= 40
              ? "Хитка"
              : "Нестабільна";

      // Current streak
      const sortedByDate = [...completed].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      let streak = 0;
      for (const b of sortedByDate) {
        if (b.result === "Win") {
          if (streak >= 0) streak++;
          else break;
        } else {
          if (streak <= 0) streak--;
          else break;
        }
      }

      // Monthly profit
      const monthlyMap: Record<string, number> = {};
      groupBets.forEach((b) => {
        const m = b.date.slice(0, 7); // YYYY-MM
        monthlyMap[m] = (monthlyMap[m] || 0) + (b.profit || 0);
      });
      const monthlyProfit = Object.entries(monthlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, profit]) => ({
          month: month.slice(5) + "/" + month.slice(2, 4),
          profit,
        }));

      return {
        groupId: group.id,
        groupName: group.name,
        totalBets: groupBets.length,
        wins,
        losses,
        pending: groupBets.length - wins - losses,
        totalProfit,
        winRate,
        roi,
        stability,
        stabilityLabel,
        streak,
        monthlyProfit,
      };
    });
  }, [groups, bets]);

  const rankedGroups = useMemo(() => {
    return [...groupStats]
      .sort((a, b) => {
        // Composite score: 40% winRate + 30% roi + 20% stability + 10% profit
        const scoreA =
          a.winRate * 0.4 +
          Math.min(a.roi, 100) * 0.3 +
          a.stability * 0.2 +
          (Math.min(a.totalProfit, 10000) / 100) * 0.1;
        const scoreB =
          b.winRate * 0.4 +
          Math.min(b.roi, 100) * 0.3 +
          b.stability * 0.2 +
          (Math.min(b.totalProfit, 10000) / 100) * 0.1;
        return scoreB - scoreA;
      })
      .map((gs, idx) => ({ ...gs, rank: idx + 1 }));
  }, [groupStats]);

  const overallStats = useMemo(() => {
    const total = bets.length;
    const completed = bets.filter((b) => b.result !== "Pending");
    const wins = completed.filter((b) => b.result === "Win").length;
    const totalProfit = bets.reduce((s, b) => s + (b.profit || 0), 0);
    const totalStake = bets.reduce((s, b) => s + (b.amount || 0), 0);
    return {
      totalBets: total,
      wins,
      losses: completed.length - wins,
      pending: total - completed.length,
      totalProfit,
      winRate: completed.length > 0 ? (wins / completed.length) * 100 : 0,
      roi: totalStake > 0 ? (totalProfit / totalStake) * 100 : 0,
    };
  }, [bets]);

  const visibleGroups = useMemo(
    () =>
      rankedGroups.filter((group) => {
        const source = groups.find((item) => item.id === group.groupId);
        const query = groupSearch.trim().toLowerCase();
        const matchesSearch =
          !query ||
          group.groupName.toLowerCase().includes(query) ||
          tgHandle(source?.link || "")
            .toLowerCase()
            .includes(query);
        const matchesFilter =
          groupListFilter === "all" || group.totalProfit > 0;
        return matchesSearch && matchesFilter;
      }),
    [rankedGroups, groups, groupSearch, groupListFilter],
  );

  // ── Filtered bets ──

  const filteredBets = useMemo(() => {
    let result = bets;
    if (selectedGroupFilter !== "all") {
      result = result.filter((b) => b.groupId === selectedGroupFilter);
    }
    if (resultFilter !== "all") {
      result = result.filter((b) => b.result === resultFilter);
    }
    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date")
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === "odds") cmp = a.odds - b.odds;
      if (sortBy === "profit") cmp = (a.profit || 0) - (b.profit || 0);
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [bets, selectedGroupFilter, resultFilter, sortBy, sortOrder]);

  const getGroupName = (groupId: string) =>
    groups.find((g) => g.id === groupId)?.name || "—";

  const resultBadge = (result: string) => {
    switch (result) {
      case "Win":
        return (
          <Badge className="bg-[#DCFCE7] text-green-600 border border-green-200 text-xs font-medium rounded-full">
            <CheckCircle2 className="h-3 w-3 mr-1" strokeWidth={1.5} />
            Виграш
          </Badge>
        );
      case "Loss":
        return (
          <Badge className="bg-red-50 text-red-600 border border-red-200 text-xs font-medium rounded-full">
            <XCircle className="h-3 w-3 mr-1" strokeWidth={1.5} />
            Програш
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-500 border border-gray-200 text-xs font-medium rounded-full">
            <Clock className="h-3 w-3 mr-1" strokeWidth={1.5} />
            Очікує
          </Badge>
        );
    }
  };

  // ── Shared UI ──
  const renderDialogs = () => (
    <>
      {/* ===== Group Dialog ===== */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Редагувати групу" : "Нова Telegram-група"}
            </DialogTitle>
            <DialogDescription>
              Додайте групу з якої будете аналізувати ставки
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Назва групи *
              </Label>
              <Input
                value={groupForm.name}
                onChange={(e) =>
                  setGroupForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Pro Betting 🇺🇦"
                className="rounded-xl border-gray-200"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Посилання
              </Label>
              <Input
                value={groupForm.link}
                onChange={(e) =>
                  setGroupForm((p) => ({ ...p, link: e.target.value }))
                }
                placeholder="https://t.me/groupname"
                className="rounded-xl border-gray-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGroupDialogOpen(false)}
              className="rounded-xl"
            >
              Скасувати
            </Button>
            <Button
              onClick={handleSaveGroup}
              className="rounded-xl bg-primary hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
              {editingGroup ? "Зберегти" : "Додати"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Group Confirm ===== */}
      <Dialog
        open={!!deleteGroupConfirm}
        onOpenChange={() => setDeleteGroupConfirm(null)}
      >
        <DialogContent className="rounded-3xl max-w-md border border-gray-200 p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-red-100 flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" strokeWidth={1.5} />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Видалити групу?
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="border-t border-gray-200" />

          <div className="px-6 pb-6 pt-4 space-y-3 bg-gray-100">
            <div className="text-center">
              <div className="flex flex-col items-center px-5 py-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <DialogDescription className="text-lg font-bold text-gray-900 text-center">
                  {(deleteGroupConfirm &&
                    groups.find((g) => g.id === deleteGroupConfirm)?.name) ||
                    "—"}
                </DialogDescription>
                {deleteGroupConfirm &&
                  (() => {
                    const g = groups.find((x) => x.id === deleteGroupConfirm);
                    return g?.link ? (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {tgHandle(g.link)}
                      </p>
                    ) : null;
                  })()}
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-red-200">
              <AlertTriangle
                className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
                strokeWidth={1.5}
              />
              <p className="text-sm text-[#991B1B]">
                Усі ставки цієї групи також будуть видалені. Ця дія незворотна.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteGroupConfirm(null)}
                className="rounded-xl border-gray-200 font-medium"
              >
                Скасувати
              </Button>
              <Button
                onClick={() =>
                  deleteGroupConfirm && handleDeleteGroup(deleteGroupConfirm)
                }
                className="rounded-xl bg-red-600 hover:bg-[#B91C1C] text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Видалити
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  // ── Render ──

  const renderKPICards = () => (
    <section className="rounded-2xl border border-[#e4e5e7] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.035)]">
      <div className="grid grid-cols-2 divide-x divide-y divide-[#e9eaec] sm:grid-cols-4 sm:divide-y-0">
        <Metric value={groups.length} label="групи" />
        <Metric value={overallStats.totalBets} label="ставки" />
        <Metric
          value={`${overallStats.winRate.toFixed(0)}%`}
          label="Win Rate"
        />
        <Metric
          value={`${overallStats.totalProfit >= 0 ? "+" : ""}${Number(overallStats.totalProfit).toFixed(1)}u`}
          label="результат"
          positive={overallStats.totalProfit > 0}
        />
      </div>
    </section>
  );

  const openNewGroup = () => {
    setEditingGroup(null);
    setGroupForm({ ...EMPTY_GROUP });
    setGroupDialogOpen(true);
  };

  const renderGuide = () => (
    <aside className="space-y-4">
      <section className="rounded-2xl border border-[#e4e5e7] bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.035)]">
        <h2 className="text-base font-semibold text-slate-900">Як це працює</h2>
        <ol className="relative mt-5 space-y-5 before:absolute before:left-3 before:top-3 before:h-[calc(100%-24px)] before:w-px before:bg-slate-200">
          {[
            ["1", "Додайте групу", "Збережіть назву та посилання на канал."],
            ["2", "Вносьте ставки", "Фіксуйте рішення та результат у MatchIQ."],
            [
              "3",
              "Аналізуйте результат",
              "Порівнюйте Win Rate і прибуток груп.",
            ],
          ].map(([number, title, description]) => (
            <li key={number} className="relative flex gap-3">
              <span className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                {number}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-800">{title}</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 border-t border-[#e9eaec] pt-4 text-sm">
          <a
            href="https://t.me/cs2beet"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 underline hover:text-blue-700"
          >
            Потрібна допомога? ↗
          </a>
        </div>
      </section>
    </aside>
  );

  // ── Render ──

  if (!currentUser) return null;

  return (
    <>
      {renderDialogs()}
      <div className="flex flex-col flex-1 min-h-0 space-y-6">
        <div className="telegram-heading">
          <div>
            <h1>Telegram</h1>
            <p>Групи для аналізу спільних результатів.</p>
          </div>
          <Button
            onClick={openNewGroup}
            className="w-fit rounded-xl bg-[#2878f0] px-4 text-white shadow-sm hover:bg-[#1d68d8]"
          >
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} />
            Додати групу
          </Button>
        </div>

        <div className="telegram-grid">
          <div className="telegram-main space-y-5">
            {renderKPICards()}

            {groups.length === 0 ? (
              <div className="flex min-h-[440px] flex-1 rounded-2xl border border-[#e4e5e7] bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.035)]">
                <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-[#fbfbfa]">
                  <div className="max-w-sm px-6 py-16 text-center">
                    <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                      <MessageCircle
                        className="h-7 w-7 text-slate-500"
                        strokeWidth={1.5}
                      />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-slate-900">
                      Немає доданих Telegram-груп
                    </h3>
                    <p className="mb-6 text-sm leading-6 text-slate-500">
                      Додайте Telegram-групи зі ставками для аналізу їх
                      результатів
                    </p>
                    <Button
                      onClick={openNewGroup}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-base font-semibold text-white transition-colors hover:bg-slate-700"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2} />
                      Додати групу
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <section className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={groupSearch}
                        onChange={(event) => setGroupSearch(event.target.value)}
                        placeholder="Пошук групи"
                        className="h-11 rounded-xl border-[#dfe3ea] bg-white pl-10 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                    <Select
                      value={groupListFilter}
                      onValueChange={(value: "all" | "profitable") =>
                        setGroupListFilter(value)
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl border-[#dfe3ea] bg-white text-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Усі групи</SelectItem>
                        <SelectItem value="profitable">Прибуткові</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="telegram-groups overflow-hidden rounded-2xl border border-[#e4e5e7] bg-white">
                    <div className="border-b border-[#e9eaec] px-5 py-4">
                      <h2 className="text-lg font-semibold text-slate-900">
                        Ваші групи
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-sm">
                        <thead className="border-b border-[#e9eaec] text-left text-xs font-medium text-slate-400">
                          <tr>
                            <th className="px-4 py-3">Група</th>
                            <th className="px-3 py-3">Активність</th>
                            <th className="px-3 py-3 text-center">Ставок</th>
                            <th className="px-3 py-3 text-center">Win Rate</th>
                            <th className="px-3 py-3 text-right">P/L</th>
                            <th className="px-3 py-3">Статус</th>
                            <th className="px-4 py-3" />
                          </tr>
                        </thead>
                        <tbody>
                          {visibleGroups.map((gs) => {
                            const group = groups.find(
                              (item) => item.id === gs.groupId,
                            );
                            const lastBet = bets
                              .filter((bet) => bet.groupId === gs.groupId)
                              .sort(
                                (a, b) =>
                                  new Date(b.date).getTime() -
                                  new Date(a.date).getTime(),
                              )[0];
                            const initials = gs.groupName
                              .slice(0, 2)
                              .toUpperCase();
                            return (
                              <tr
                                key={gs.groupId}
                                className="border-b border-[#edf0f3] last:border-0 transition-colors hover:bg-slate-50/70"
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0c2347] text-xs font-bold text-white">
                                      {initials}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate font-semibold text-slate-800">
                                        {gs.groupName}
                                      </p>
                                      <p className="truncate text-xs text-slate-400">
                                        {tgHandle(group?.link || "") ||
                                          "Без посилання"}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-xs text-slate-500">
                                  {lastBet
                                    ? new Date(lastBet.date).toLocaleDateString(
                                        "uk-UA",
                                        { day: "2-digit", month: "short" },
                                      )
                                    : "Ще немає"}
                                </td>
                                <td className="px-3 py-3 text-center font-medium text-slate-700">
                                  {gs.totalBets}
                                </td>
                                <td
                                  className={`px-3 py-3 text-center font-semibold ${gs.winRate >= 50 ? "text-emerald-600" : "text-red-500"}`}
                                >
                                  {gs.totalBets
                                    ? `${gs.winRate.toFixed(0)}%`
                                    : "—"}
                                </td>
                                <td
                                  className={`px-3 py-3 text-right font-semibold ${gs.totalProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}
                                >
                                  {gs.totalProfit >= 0 ? "+" : ""}
                                  {gs.totalProfit.toFixed(1)}u
                                </td>
                                <td className="px-3 py-3">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Підключено
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingGroup(group || null);
                                        setGroupForm({
                                          name: group?.name || "",
                                          link: group?.link || "",
                                        });
                                        setGroupDialogOpen(true);
                                      }}
                                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                    >
                                      Переглянути
                                    </button>
                                    <button
                                      onClick={() =>
                                        setDeleteGroupConfirm(gs.groupId)
                                      }
                                      className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                                      title="Видалити групу"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {visibleGroups.length === 0 && (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-4 py-12 text-center text-sm text-slate-400"
                              >
                                За цими умовами груп не знайдено
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                {/* ===== Bets Table ===== */}
                {bets.length > 0 && (
                  <Card
                    className="border border-gray-100 rounded-2xl bg-white overflow-hidden"
                    style={{ boxShadow: CHART_CARD_SHADOW }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Ставки з Telegram{" "}
                          <span className="text-gray-400 font-normal">
                            ({filteredBets.length})
                          </span>
                        </h3>
                        <div className="flex items-center gap-2">
                          <Select
                            value={selectedGroupFilter}
                            onValueChange={setSelectedGroupFilter}
                          >
                            <SelectTrigger className="w-[160px] h-9 rounded-xl border-gray-200 text-xs">
                              <SelectValue placeholder="Всі групи" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Всі групи</SelectItem>
                              {groups.map((g) => (
                                <SelectItem key={g.id} value={g.id}>
                                  {g.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={resultFilter}
                            onValueChange={setResultFilter}
                          >
                            <SelectTrigger className="w-[130px] h-9 rounded-xl border-gray-200 text-xs">
                              <SelectValue placeholder="Всі результати" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Всі</SelectItem>
                              <SelectItem value="Win">Виграш</SelectItem>
                              <SelectItem value="Loss">Програш</SelectItem>
                              <SelectItem value="Pending">Очікує</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toast.info(
                                "Парсер даних з Telegram з'явиться в наступних оновленнях",
                              )
                            }
                            className="rounded-xl border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-900 text-xs font-medium"
                          >
                            <RefreshCw
                              className="h-3.5 w-3.5 mr-1.5"
                              strokeWidth={1.5}
                            />
                            Отримати данні
                          </Button>
                        </div>
                      </div>

                      {filteredBets.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                  Група
                                </th>
                                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                  Дата
                                </th>
                                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                  Матч
                                </th>
                                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                  Коеф.
                                </th>
                                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                  Сума
                                </th>
                                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                  Рез-т
                                </th>
                                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                  Прибуток
                                </th>
                                <th className="w-10" />
                              </tr>
                            </thead>
                            <tbody>
                              {filteredBets.map((bet) => (
                                <tr
                                  key={bet.id}
                                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                                >
                                  <td className="py-2.5 px-3">
                                    <span className="text-xs font-medium text-gray-900">
                                      {getGroupName(bet.groupId)}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="text-xs text-gray-500">
                                      {new Date(bet.date).toLocaleDateString(
                                        "uk-UA",
                                        { day: "2-digit", month: "2-digit" },
                                      )}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="text-xs font-medium text-gray-900">
                                      {bet.match ||
                                        (bet.team1 && bet.team2
                                          ? `${bet.team1} vs ${bet.team2}`
                                          : "—")}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className="text-xs font-semibold text-gray-900">
                                      {bet.odds}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className="text-xs text-gray-500">
                                      {bet.amount > 0 ? bet.amount : "—"}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {resultBadge(bet.result)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <span
                                      className={`text-xs font-semibold ${(bet.profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                                    >
                                      {(bet.profit || 0) >= 0 ? "+" : ""}
                                      {(bet.profit || 0).toFixed(0)}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-1">
                                    <div className="flex gap-0.5">
                                      <button
                                        onClick={() => openEditBet()}
                                        className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                                        title="Редагувати"
                                      >
                                        <Pencil
                                          className="h-3 w-3"
                                          strokeWidth={1.5}
                                        />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteBet(bet.id)}
                                        className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Видалити"
                                      >
                                        <X
                                          className="h-3 w-3"
                                          strokeWidth={1.5}
                                        />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="py-10 text-center">
                          <p className="text-sm text-gray-400">
                            Немає ставок за обраними фільтрами
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
          {renderGuide()}
        </div>
      </div>
    </>
  );
}

// ── Stability Badge ──

function StabilityBadge({
  stability,
  label,
}: {
  stability: number;
  label: string;
}) {
  const Icon =
    stability >= 70 ? ShieldCheck : stability >= 40 ? Shield : ShieldAlert;
  const colors =
    stability >= 70
      ? "bg-[#DCFCE7] text-green-600 border-green-200"
      : stability >= 40
        ? "bg-yellow-100 text-amber-600 border-[#FED7AA]"
        : label === "Немає даних"
          ? "bg-gray-100 text-gray-400 border-gray-200"
          : "bg-red-50 text-red-600 border-red-200";

  return (
    <Badge
      className={`text-[10px] font-medium px-2 py-0.5 border rounded-full ${colors}`}
    >
      <Icon className="h-3 w-3 mr-1" strokeWidth={1.5} />
      {label}
    </Badge>
  );
}

// ── Mini Stat Card ──

function Metric({
  value,
  label,
  positive = false,
}: {
  value: string | number;
  label: string;
  positive?: boolean;
}) {
  return (
    <div className="px-4 py-2 first:pl-0 sm:first:pl-0 sm:last:pr-0">
      <p
        className={`text-2xl font-semibold tracking-tight ${positive ? "text-emerald-600" : "text-slate-900"}`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
  iconColor: string;
}) {
  return (
    <div
      className="bg-white border border-gray-100 hover:border-gray-300 rounded-3xl px-6 py-5 flex flex-col justify-between transition-all duration-300"
      style={CARD_BASE_STYLE}
      onMouseEnter={(e) => applyCardHover(e.currentTarget)}
      onMouseLeave={(e) => resetCardHover(e.currentTarget)}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-xl ${color}`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} strokeWidth={1.5} />
        </div>
        <span className="text-lg font-semibold text-gray-900">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
    </div>
  );
}
