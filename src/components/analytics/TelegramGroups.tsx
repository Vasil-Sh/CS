import { useState, useEffect, useMemo, useRef } from "react";
import { api } from "@/lib/apiClient";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserDataService } from "@/lib/userDataService";
import { useAuth } from "@/contexts/AuthContext";
import { logRender } from "@/lib/devLogger";
import { toast } from "sonner";
import { Check, Lock, Pencil, Trash2, X } from "lucide-react";
import TelegramDashboard, {
  ChannelAvatar,
  GameChip,
  SwapPill,
  channelGames,
  money,
  tgHandle,
} from "./TelegramDashboard";
import "@/pages/telegram.css";

// ── Helpers ──

/** Ukrainian plural: 1 ставка, 2 ставки, 5 ставок. */
function plural(n: number, one: string, few: string, many: string) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}

const signedPct = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(0)}%`;
const toneOf = (value: number) =>
  value > 0 ? "is-up" : value < 0 ? "is-down" : "";

function MonthlyProfitBars({
  data,
}: {
  data: { month: string; profit: number }[];
}) {
  const maxAbs = Math.max(1, ...data.map((d) => Math.abs(d.profit)));
  return (
    <div
      className="mqt-chart"
      role="img"
      aria-label={`Прибуток по місяцях: ${data.map((d) => `${d.month} ${money(d.profit)}`).join(", ")}`}
    >
      {data.map((d, i) => {
        const height = `${(Math.abs(d.profit) / maxAbs) * 100}%`;
        return (
          <span className="mqt-chart-col" key={`${d.month}-${i}`}>
            <span className="mqt-chart-up">
              {d.profit > 0 && <i style={{ height }} />}
            </span>
            <span className="mqt-chart-down">
              {d.profit < 0 && <i style={{ height }} />}
            </span>
            <span className="mqt-chart-label">
              <b className={toneOf(d.profit)}>{money(d.profit)}</b>
              <small>{d.month}</small>
            </span>
          </span>
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

  // Group details
  const [detailGroupId, setDetailGroupId] = useState<string | null>(null);

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

  // ── Shared UI ──
  const openEditGroup = (group: TelegramGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      link: group.link,
      comment: group.comment,
      hasChannel: group.hasChannel,
      game: group.game || "",
    });
    setGroupDialogOpen(true);
  };

  const toggleGame = (value: string) =>
    setGroupForm((p) => {
      const list = (p.game || "").split(",").filter((g) => g.length > 0);
      const next = list.includes(value)
        ? list.filter((g) => g !== value)
        : [...list, value];
      return { ...p, game: next.join(",") };
    });

  const detailGroup = detailGroupId
    ? groups.find((g) => g.id === detailGroupId) || null
    : null;
  const detailStats = detailGroupId
    ? groupStats.find((s) => s.groupId === detailGroupId) || null
    : null;
  const deleteGroup = deleteGroupConfirm
    ? groups.find((g) => g.id === deleteGroupConfirm) || null
    : null;
  const deleteBetCount = deleteGroup
    ? bets.filter((b) => b.groupId === deleteGroup.id).length
    : 0;

  const detailTiles: [string, string, string][] = detailStats
    ? (() => {
        const done = detailStats.wins + detailStats.losses;
        const s = detailStats.streak;
        return [
          ["Ставок", String(detailStats.totalBets), ""],
          ["Виграші", String(detailStats.wins), ""],
          ["Програші", String(detailStats.losses), ""],
          ["Очікують", String(detailStats.pending), ""],
          [
            "Відсоток перемог",
            done ? `${detailStats.winRate.toFixed(0)}%` : "—",
            "",
          ],
          [
            "ROI",
            detailStats.totalBets ? signedPct(detailStats.roi) : "—",
            toneOf(detailStats.roi),
          ],
          ["Стабільність", detailStats.stabilityLabel, ""],
          [
            "Серія",
            s === 0
              ? "—"
              : s > 0
                ? `${s} ${plural(s, "виграш", "виграші", "виграшів")}`
                : `${-s} ${plural(-s, "програш", "програші", "програшів")}`,
            "",
          ],
        ];
      })()
    : [];

  const closeButton = (light = false) => (
    <DialogClose
      className={`mqt-dialog-close${light ? " is-light" : ""}`}
      aria-label="Закрити"
    >
      <X size={18} strokeWidth={1.8} aria-hidden="true" />
    </DialogClose>
  );

  const renderDialogs = () => (
    <>
      {/* ===== Add / edit group ===== */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent hideCloseButton className="mqt-dialog">
          <div className="mqt-dialog-head">
            <div className="mqt-dialog-titles">
              <p className="mqt-dialog-kicker">Telegram-група</p>
              <DialogTitle>
                {editingGroup ? "Редагувати групу" : "Додати групу"}
              </DialogTitle>
              <DialogDescription>
                {editingGroup
                  ? "Зміни застосуються до статистики групи одразу."
                  : "Підключіть джерело, щоб відстежувати його прогнози та результати."}
              </DialogDescription>
            </div>
            {closeButton()}
          </div>
          <form
            id="mqt-group-form"
            className="mqt-dialog-body"
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveGroup();
            }}
          >
            <div className="mqt-field">
              <label htmlFor="tg-group-name">Назва групи *</label>
              <input
                id="tg-group-name"
                value={groupForm.name}
                onChange={(e) =>
                  setGroupForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Наприклад, Кіберпрогноз UA"
                autoComplete="off"
              />
            </div>
            <div className="mqt-field">
              <label htmlFor="tg-group-link">Посилання</label>
              <input
                id="tg-group-link"
                inputMode="url"
                value={groupForm.link}
                onChange={(e) =>
                  setGroupForm((p) => ({ ...p, link: e.target.value }))
                }
                placeholder="https://t.me/назва_групи"
                autoComplete="off"
                aria-describedby="tg-group-link-hint"
              />
              <small id="tg-group-link-hint">
                Публічне посилання на групу або канал — за ним підтягнеться
                аватар.
              </small>
            </div>
            <fieldset className="mqt-field">
              <legend>Гра</legend>
              <div className="mqt-pick">
                {(
                  [
                    ["cs2", "CS2"],
                    ["dota2", "Dota 2"],
                  ] as const
                ).map(([value, label]) => {
                  const on = groupForm.game?.includes(value) ?? false;
                  return (
                    <label key={value} className={`mqt-check${on ? " is-on" : ""}`}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleGame(value)}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div className="mqt-field">
              <label htmlFor="tg-group-comment">Коментар</label>
              <textarea
                id="tg-group-comment"
                rows={3}
                value={groupForm.comment}
                onChange={(e) =>
                  setGroupForm((p) => ({ ...p, comment: e.target.value }))
                }
                placeholder="Наприклад: платна група, тільки CS2"
              />
            </div>
            <label className="mqt-toggle">
              <input
                type="checkbox"
                checked={groupForm.hasChannel}
                onChange={(e) =>
                  setGroupForm((p) => ({ ...p, hasChannel: e.target.checked }))
                }
              />
              <span>
                <strong>Також є приватний канал</strong>
                <small>Крім відкритої групи, є платний закритий канал.</small>
              </span>
            </label>
          </form>
          <div className="mqt-dialog-foot">
            <button
              type="button"
              className="mqt-btn-outline"
              onClick={() => setGroupDialogOpen(false)}
            >
              Скасувати
            </button>
            <SwapPill
              type="submit"
              form="mqt-group-form"
              label={editingGroup ? "Зберегти зміни" : "Додати групу"}
              icon={<Check size={16} strokeWidth={2.2} />}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Group statistics ===== */}
      <Dialog
        open={!!detailGroupId}
        onOpenChange={(open) => {
          if (!open) setDetailGroupId(null);
        }}
      >
        <DialogContent hideCloseButton className="mqt-dialog is-wide">
          {detailGroup && detailStats ? (
            <>
              <div className="mqt-dialog-head">
                <ChannelAvatar group={detailGroup} size="lg" />
                <div className="mqt-dialog-titles">
                  <p className="mqt-dialog-kicker">Статистика групи</p>
                  <DialogTitle>{detailGroup.name}</DialogTitle>
                  <div className="mqt-dialog-meta">
                    <DialogDescription>
                      {tgHandle(detailGroup.link) || "Без посилання"}
                    </DialogDescription>
                    {channelGames(detailGroup, bets).map((g) => (
                      <GameChip key={g} game={g} dark />
                    ))}
                    {detailGroup.hasChannel && (
                      <span className="mqt-chip is-private">
                        <Lock size={12} strokeWidth={2} aria-hidden="true" />
                        Приватний канал
                      </span>
                    )}
                  </div>
                </div>
                {closeButton()}
              </div>
              <div className="mqt-dialog-body">
                {detailGroup.comment && (
                  <p className="mqt-note">{detailGroup.comment}</p>
                )}
                <div className="mqt-tiles">
                  {detailTiles.map(([label, value, cls]) => (
                    <div className="mqt-tile" key={label}>
                      <span>{label}</span>
                      <strong className={cls}>{value}</strong>
                    </div>
                  ))}
                </div>
                <section className="mqt-chart-section">
                  <div className="mqt-chart-head">
                    <h3>Прибуток по місяцях</h3>
                    <span className="mqt-legend" aria-hidden="true">
                      <span>
                        <i className="is-plus" />
                        плюс
                      </span>
                      <span>
                        <i className="is-minus" />
                        мінус
                      </span>
                    </span>
                  </div>
                  {detailStats.monthlyProfit.length ? (
                    <MonthlyProfitBars data={detailStats.monthlyProfit} />
                  ) : (
                    <div className="mqt-chart-empty">
                      <strong>Ще немає даних</strong>
                      <p>
                        Графік з'явиться, щойно до групи буде прив'язано
                        записи.
                      </p>
                    </div>
                  )}
                </section>
              </div>
              <div className="mqt-dialog-foot is-split">
                <button
                  type="button"
                  className="mqt-btn-outline"
                  onClick={() => {
                    const g = detailGroup;
                    setDetailGroupId(null);
                    openEditGroup(g);
                  }}
                >
                  <Pencil size={15} strokeWidth={1.8} aria-hidden="true" />
                  Редагувати групу
                </button>
                <DialogClose className="mqt-btn-dark">Закрити</DialogClose>
              </div>
            </>
          ) : (
            <DialogTitle className="sr-only">Статистика групи</DialogTitle>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Delete group ===== */}
      <Dialog
        open={!!deleteGroupConfirm}
        onOpenChange={() => setDeleteGroupConfirm(null)}
      >
        <DialogContent
          hideCloseButton
          role="alertdialog"
          className="mqt-dialog is-narrow"
        >
          <div className="mqt-dialog-body is-delete">
            <div className="mqt-delete-top">
              <span className="mqt-delete-icon">
                <Trash2 size={22} strokeWidth={1.8} aria-hidden="true" />
              </span>
              {closeButton(true)}
            </div>
            <div>
              <p className="mqt-dialog-kicker is-danger">Видалення</p>
              <DialogTitle>Видалити групу?</DialogTitle>
            </div>
            {deleteGroup && (
              <div className="mqt-delete-card">
                <ChannelAvatar group={deleteGroup} />
                <span>
                  <strong>{deleteGroup.name}</strong>
                  <small>
                    {[
                      tgHandle(deleteGroup.link),
                      `${deleteBetCount} ${plural(deleteBetCount, "ставка", "ставки", "ставок")}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </span>
              </div>
            )}
            <DialogDescription className="mqt-danger-text">
              Разом із групою буде видалено всі її ставки. Дію неможливо
              скасувати.
            </DialogDescription>
          </div>
          <div className="mqt-dialog-foot">
            <button
              type="button"
              className="mqt-btn-outline"
              onClick={() => setDeleteGroupConfirm(null)}
            >
              Скасувати
            </button>
            <button
              type="button"
              className="mqt-btn-danger"
              onClick={() =>
                deleteGroupConfirm && handleDeleteGroup(deleteGroupConfirm)
              }
            >
              <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
              Видалити групу
            </button>
          </div>
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
        onEdit={openEditGroup}
      />
    </>
  );
}
