import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Pencil,
  X,
  AlertTriangle,
  RefreshCw,
  Megaphone,
} from "lucide-react";
import TelegramDashboard from "./TelegramDashboard";
import { CHART_CARD_SHADOW } from "@/lib/cardStyles";

// ── Helpers ──

/** Extract handle from Telegram link for display */
function tgHandle(link: string): string {
  if (!link) return "";
  const match = link.match(/t\.me\/(?:s\/)?([^/\s?#]+)/);
  return match ? "@" + match[1] : link;
}

/** Raw username (no "@") from a Telegram link — used to build the avatar URL */
function tgUsername(link: string): string {
  return tgHandle(link).replace(/^@/, "");
}

/** Group avatar: real Telegram photo with a group icon fallback */
function GroupAvatar({ link, name }: { link: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const username = tgUsername(link);
  const showPhoto = Boolean(username) && !failed;
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0c2347] text-white">
      {showPhoto ? (
        <img
          src={`https://t.me/i/userpic/320/${username}.jpg`}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth <= 1) setFailed(true);
          }}
        />
      ) : (
        <Users size={20} strokeWidth={1.75} />
      )}
    </div>
  );
}

function MonthlyProfitBars({
  data,
}: {
  data: { month: string; profit: number }[];
}) {
  const maxAbs = Math.max(1, ...data.map((d) => Math.abs(d.profit)));
  return (
    <div className="tg-detail-chart">
      {data.map((d, i) => {
        const h = Math.max(5, (Math.abs(d.profit) / maxAbs) * 100);
        return (
          <div className="tg-detail-bar" key={`${d.month}-${i}`}>
            <div className="tg-detail-bar-track">
              <div
                className={`tg-detail-bar-fill ${d.profit >= 0 ? "is-win" : "is-loss"}`}
                style={{ height: `${h}%` }}
                title={`${d.month}: ${d.profit >= 0 ? "+" : ""}${d.profit.toFixed(0)} ₴`}
              />
            </div>
            <span className="tg-detail-bar-label">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Types ──

interface TelegramGroup {
  id: string;
  name: string;
  link: string;
  hasChannel: boolean;
  comment: string;
  game?: string;
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
  hasChannel: false,
  comment: "",
  game: "",
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
                {
                  name: g.name,
                  link: g.link || "",
                  hasChannel: g.hasChannel,
                  comment: g.comment || "",
                  game: g.game || "",
                },
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
  const [detailGroupId, setDetailGroupId] = useState<string | null>(null);
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
          ? {
              ...g,
              name: groupForm.name.trim(),
              link: groupForm.link.trim(),
              hasChannel: groupForm.hasChannel,
              comment: groupForm.comment.trim(),
              game: groupForm.game || "",
            }
          : g,
      );
      toast.success("Групу оновлено");

      // Sync edits to backend (name/link/game/etc. must persist across reloads).
      const backendId =
        (editingGroup as { _backendId?: string })?._backendId ||
        editingGroup.id;
      api
        .put<{ id?: string }>(`/telegram-groups/${backendId}`, {
          name: groupForm.name.trim(),
          link: groupForm.link.trim(),
          hasChannel: groupForm.hasChannel,
          comment: groupForm.comment.trim(),
          game: groupForm.game || "",
        })
        .catch((err: unknown) => {
          if (import.meta.env.DEV)
            console.warn("[API] Group update failed:", err);
        });
    } else {
      const newGroup: TelegramGroup = {
        id: crypto.randomUUID(),
        name: groupForm.name.trim(),
        link: groupForm.link.trim(),
        hasChannel: groupForm.hasChannel,
        comment: groupForm.comment.trim(),
        game: groupForm.game || "",
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
          hasChannel: groupForm.hasChannel,
          comment: groupForm.comment.trim(),
          game: groupForm.game || "",
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
        <DialogContent className="tg-group-dialog">
          <DialogHeader className="tg-group-header">
            <p className="tg-dialog-eyebrow">Telegram група</p>
            <DialogTitle>
              {editingGroup ? "Редагувати групу" : "Додати групу"}
            </DialogTitle>
            <DialogDescription>
              Підключіть канал, щоб відстежувати прогнози та результати.
            </DialogDescription>
          </DialogHeader>
          <div className="tg-group-body">
            <div>
              <Label htmlFor="tg-group-name">Назва групи *</Label>
              <Input
                id="tg-group-name"
                value={groupForm.name}
                onChange={(e) =>
                  setGroupForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Pro Betting 🇺🇦"
              />
            </div>
            <div>
              <Label htmlFor="tg-group-link">Посилання</Label>
              <Input
                id="tg-group-link"
                value={groupForm.link}
                onChange={(e) =>
                  setGroupForm((p) => ({ ...p, link: e.target.value }))
                }
                placeholder="https://t.me/groupname"
              />
            </div>
            <div>
              <Label>Гра</Label>
              <div className="tg-group-games">
                {(
                  [
                    ["cs2", "CS2"],
                    ["dota2", "Dota 2"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="tg-group-game-option">
                    <input
                      type="checkbox"
                      checked={groupForm.game?.includes(value) ?? false}
                      onChange={() =>
                        setGroupForm((p) => {
                          const list = (p.game || "")
                            .split(",")
                            .filter((g) => g.length > 0);
                          const next = list.includes(value)
                            ? list.filter((g) => g !== value)
                            : [...list, value];
                          return { ...p, game: next.join(",") };
                        })
                      }
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="tg-group-comment">Коментар</Label>
              <Textarea
                id="tg-group-comment"
                rows={2}
                value={groupForm.comment}
                onChange={(e) =>
                  setGroupForm((p) => ({ ...p, comment: e.target.value }))
                }
                placeholder="Наприклад: платна група, тільки CS2"
              />
            </div>
            <label className="tg-group-channel-toggle">
              <input
                type="checkbox"
                checked={groupForm.hasChannel}
                onChange={(e) =>
                  setGroupForm((p) => ({ ...p, hasChannel: e.target.checked }))
                }
              />
              <span>
                <strong>Також є приватний канал</strong>
                <small>
                  Крім відкритого, група має платний закритий канал.
                </small>
              </span>
            </label>
          </div>
          <DialogFooter className="tg-group-footer">
            <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>
              Скасувати
            </Button>
            <Button onClick={handleSaveGroup} className="tg-group-submit">
              {editingGroup ? "Зберегти зміни" : "Додати групу"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Group Confirm ===== */}
      <Dialog
        open={!!deleteGroupConfirm}
        onOpenChange={() => setDeleteGroupConfirm(null)}
      >
        <DialogContent className="tg-group-dialog">
          <DialogHeader className="tg-delete-header">
            <div className="flex items-center gap-3">
              <div className="tg-delete-icon">
                <Trash2 className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <DialogTitle>Видалити групу?</DialogTitle>
            </div>
          </DialogHeader>

          <div className="tg-delete-body">
            <div className="tg-delete-name">
              <DialogDescription className="text-lg font-bold text-center">
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

            <div className="tg-delete-warning">
              <AlertTriangle
                className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
                strokeWidth={1.5}
              />
              <p>
                Усі ставки цієї групи також будуть видалені. Ця дія незворотна.
              </p>
            </div>
          </div>

          <DialogFooter className="tg-group-footer">
            <Button
              variant="outline"
              onClick={() => setDeleteGroupConfirm(null)}
            >
              Скасувати
            </Button>
            <Button
              onClick={() =>
                deleteGroupConfirm && handleDeleteGroup(deleteGroupConfirm)
              }
              className="tg-delete-submit"
            >
              <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Group Details ===== */}
      <Dialog
        open={!!detailGroupId}
        onOpenChange={(open) => {
          if (!open) setDetailGroupId(null);
        }}
      >
        <DialogContent className="tg-group-dialog tg-detail-dialog">
          <DialogHeader className="tg-detail-header">
            {(() => {
              const group = detailGroupId
                ? groups.find((x) => x.id === detailGroupId)
                : null;
              return (
                <>
                  <GroupAvatar
                    link={group?.link || ""}
                    name={group?.name || ""}
                  />
                  <div className="tg-detail-header-copy">
                    <p className="tg-dialog-eyebrow">Статистика групи</p>
                    <DialogTitle>
                      {group?.name || "Статистика групи"}
                    </DialogTitle>
                    <DialogDescription>
                      {group?.link ? tgHandle(group.link) : "Дані каналу"}
                    </DialogDescription>
                  </div>
                </>
              );
            })()}
          </DialogHeader>
          {(() => {
            const g = detailGroupId
              ? groups.find((x) => x.id === detailGroupId)
              : null;
            const stats = detailGroupId
              ? groupStats.find((x) => x.groupId === detailGroupId)
              : null;
            if (!g || !stats) return null;
            const streakLabel =
              stats.streak === 0
                ? "—"
                : stats.streak > 0
                  ? `${stats.streak}W`
                  : `${Math.abs(stats.streak)}L`;
            return (
              <div className="tg-detail-body">
                <div className="tg-detail-head">
                  <GroupAvatar link={g.link} name={g.name} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <strong className="truncate text-slate-800">
                        {g.name}
                      </strong>
                      {g.hasChannel && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          <Megaphone className="h-3 w-3" strokeWidth={2} />Є
                          приватний канал
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-400">
                      {tgHandle(g.link) || "Без посилання"}
                    </p>
                    {g.comment && (
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-xs text-slate-500">
                        {g.comment}
                      </p>
                    )}
                  </div>
                </div>

                <div className="tg-detail-stats">
                  <div>
                    <span>Ставок</span>
                    <strong>{stats.totalBets}</strong>
                  </div>
                  <div>
                    <span>Виграші</span>
                    <strong>{stats.wins}</strong>
                  </div>
                  <div>
                    <span>Програші</span>
                    <strong>{stats.losses}</strong>
                  </div>
                  <div>
                    <span>Очікує</span>
                    <strong>{stats.pending}</strong>
                  </div>
                  <div>
                    <span>Win Rate</span>
                    <strong>
                      {stats.totalBets ? `${stats.winRate.toFixed(0)}%` : "—"}
                    </strong>
                  </div>
                  <div>
                    <span>ROI</span>
                    <strong>{stats.roi.toFixed(0)}%</strong>
                  </div>
                  <div>
                    <span>Стабільність</span>
                    <strong>{stats.stabilityLabel}</strong>
                  </div>
                  <div>
                    <span>Серія</span>
                    <strong>{streakLabel}</strong>
                  </div>
                </div>

                <div className="tg-detail-chart-section">
                  <h3>Прибуток по місяцях</h3>
                  {stats.monthlyProfit.length ? (
                    <MonthlyProfitBars data={stats.monthlyProfit} />
                  ) : (
                    <div className="tg-detail-empty-chart">
                      <strong>Немає даних</strong>
                      <p>Поки що немає інформації про прибуток за місяцями.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          <DialogFooter className="tg-group-footer">
            <Button variant="outline" onClick={() => setDetailGroupId(null)}>
              Закрити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  // ── Render ──

  const openNewGroup = () => {
    setEditingGroup(null);
    setGroupForm({ ...EMPTY_GROUP });
    setGroupDialogOpen(true);
  };
  if (!currentUser) return null;
  return (
    <>
      {renderDialogs()}
      <TelegramDashboard
        groups={groups}
        bets={bets}
        stats={groupStats}
        loaded={dataLoaded}
        onAdd={openNewGroup}
        onDetails={setDetailGroupId}
        onDelete={setDeleteGroupConfirm}
        onEdit={(group) => {
          setEditingGroup(group);
          setGroupForm({
            name: group.name,
            link: group.link,
            comment: group.comment,
            hasChannel: group.hasChannel,
            game: group.game || "",
          });
          setGroupDialogOpen(true);
        }}
      >
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
                  <Select value={resultFilter} onValueChange={setResultFilter}>
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
                              {new Date(bet.date).toLocaleDateString("uk-UA", {
                                day: "2-digit",
                                month: "2-digit",
                              })}
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
                                <Pencil className="h-3 w-3" strokeWidth={1.5} />
                              </button>
                              <button
                                onClick={() => handleDeleteBet(bet.id)}
                                className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                title="Видалити"
                              >
                                <X className="h-3 w-3" strokeWidth={1.5} />
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
      </TelegramDashboard>
    </>
  );
}
