import { forwardRef, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  Link2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SwapPill } from "@/components/analytics/TelegramDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { UserDataService } from "@/lib/userDataService";
import { useGoals, type Bet, type Goal, type GoalType } from "@/hooks/useGoals";
import {
  CreateGoalDialog,
  DeleteGoalDialog,
  GoalResultDialog,
  LadderStairsDialog,
} from "./GoalDialogs";
import {
  TYPE_META,
  TYPE_ORDER,
  finishedNext,
  goalBetStats,
  goalVm,
  isFinished,
  plural,
  shortDate,
  type GoalVm,
} from "./goalView";
import "@/components/analytics/TelegramDashboard.css";
import "@/components/SwapPill.css";
import "./GoalsScreen.css";
import { GoalTypeIcon } from "./GoalTypeIcon";

const GUIDE_KEY = "matchiq_goals_guide_collapsed";
const readGuideCollapsed = () => {
  try {
    return window.localStorage.getItem(GUIDE_KEY) === "1";
  } catch {
    return false;
  }
};

const MAX_TRACK = 40;

export default function GoalsScreen() {
  const h = useGoals();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUser = user?.username || "";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [guideCollapsed, setGuideCollapsed] = useState(readGuideCollapsed);
  const [stairsGoal, setStairsGoal] = useState<Goal | null>(null);
  const [resultGoal, setResultGoal] = useState<Goal | null>(null);
  const focusRef = useRef<HTMLElement>(null);

  // Linked records come from the journal cache; re-read whenever goals change
  // (manual update, create, delete).
  const bets = useMemo<Bet[]>(
    () => UserDataService.getUserData<Bet[]>(currentUser, "mybets_data", []) || [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser, h.goals],
  );

  const active = h.goals.filter((g) => !isFinished(g));
  const finished = h.goals.filter(isFinished);
  const tab = h.activeTab;
  const pool = tab === "active" ? active : finished;
  const q = search.trim().toLowerCase();
  const shown = pool.filter((g) => !q || g.name.toLowerCase().includes(q));

  const fallback = active.find((g) => g.isPrimary) || active[0] || finished[0] || null;
  const selected = h.goals.find((g) => g.id === selectedId) || fallback;

  const vms = useMemo(() => {
    const map = new Map<string, GoalVm>();
    for (const g of h.goals) map.set(g.id, goalVm(g, goalBetStats(g, bets)));
    return map;
  }, [h.goals, bets]);

  const toggleGuide = () =>
    setGuideCollapsed((v) => {
      const next = !v;
      try {
        window.localStorage.setItem(GUIDE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });

  const select = (g: Goal) => {
    setSelectedId(g.id);
    const el = focusRef.current;
    if (el && el.getBoundingClientRect().top < 0) {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  };

  const switchTab = (next: "active" | "completed") => {
    h.setActiveTab(next);
    const list = next === "active" ? active : finished;
    if (list.length) setSelectedId((list.find((g) => g.isPrimary) || list[0]).id);
  };

  const openCreate = (type?: GoalType) => {
    if (type) h.setNewGoal({ ...h.newGoal, type });
    h.setShowCreateDialog(true);
  };

  // Keep the selection valid after deletions.
  useEffect(() => {
    if (selectedId && !h.goals.some((g) => g.id === selectedId)) setSelectedId(null);
  }, [h.goals, selectedId]);

  const deleteGoalObj = h.goals.find((g) => g.id === h.goalToDelete) || null;

  return (
    <div className="mqt-screen mqg-screen">
      {/* ===== Hero ===== */}
      <section className="mqp-hero is-photo is-compact mqg-hero" aria-label="Цілі">
        <header className="mqp-heading">
          <div>
            <p className="mqp-eyebrow">
              <i aria-hidden="true" />
              Дисципліна
            </p>
            <h1>Цілі</h1>
          </div>
        </header>
        <p className="mqt-hero-copy">
          Ваш план на банк, ROI чи відсоток перемог. Прив’язуйте записи до цілі —
          тут видно прогрес, наступний крок і чи тримаєтесь своїх правил.
        </p>
        <div className="mqg-hero-actions">
          <SwapPill
            label="Створити ціль"
            onClick={() => openCreate()}
            icon={<Plus size={16} strokeWidth={2.2} />}
          />
          {h.goals.length > 0 && (
            <button
              type="button"
              className="mqp-btn-outline is-sm mqg-glass"
              onClick={h.handleManualUpdate}
              disabled={h.isUpdating}
            >
              <RefreshCw
                size={16}
                strokeWidth={1.8}
                aria-hidden="true"
                className={h.isUpdating ? "mqg-spin" : undefined}
              />
              {h.isUpdating ? "Оновлюємо…" : "Оновити прогрес"}
            </button>
          )}
        </div>
      </section>

      {/* ===== Empty ===== */}
      {h.goals.length === 0 && (
        <section className="mqp-sheet mqg-empty" aria-labelledby="mqg-empty-title">
          <div className="mqg-empty-head">
            <p className="mqp-kicker">
              <i>01</i> Перша ціль
            </p>
            <h2 id="mqg-empty-title">Поставте ціль — і MatchIQ вестиме вас до неї</h2>
            <p>
              Оберіть, що саме хочете досягти. Під час додавання запису вказуйте
              ціль — так прогрес і правила рахуватимуться за вашими ставками.
            </p>
          </div>
          <div className="mqg-type-tiles">
            {TYPE_ORDER.map((t) => (
              <button key={t} type="button" className="mqg-type-tile" onClick={() => openCreate(t)}>
                <span className="mqg-ico">
                  <GoalTypeIcon type={t} />
                </span>
                <span>
                  <strong>{TYPE_META[t].label}</strong>
                  {TYPE_META[t].desc}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ===== 01 Focus ===== */}
      {selected && (
        <FocusSection
          ref={focusRef}
          vm={vms.get(selected.id)!}
          discipline={h.getDisciplineStatus(selected)}
          onAddRecord={() => navigate("/app/my-bets")}
          onStairs={() => setStairsGoal(selected)}
          onResult={() => setResultGoal(selected)}
        />
      )}

      {/* ===== 02 List + 03 guide ===== */}
      {h.goals.length > 0 && (
        <div className="mqt-grid">
          <section className="mqp-sheet mqt-ledger mqg-list" aria-labelledby="mqg-list-title">
            <div className="mqp-sec-head">
              <div>
                <p className="mqp-kicker">
                  <i>02</i> Мої цілі
                </p>
                <h2 id="mqg-list-title">{tab === "active" ? "Активні цілі" : "Завершені цілі"}</h2>
                <p className="mqg-sub">
                  {tab === "active"
                    ? "Натисніть на картку, щоб побачити ціль угорі."
                    : "Виконані й закриті цілі з результатом."}
                </p>
              </div>
              <div className="mqt-seg" role="group" aria-label="Стан цілей">
                {(
                  [
                    ["active", "Активні", active.length],
                    ["completed", "Завершені", finished.length],
                  ] as const
                ).map(([id, label, n]) => (
                  <button key={id} type="button" aria-pressed={tab === id} onClick={() => switchTab(id)}>
                    {label}
                    <small>{n}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="mqt-toolbar">
              <label className="mqt-search mqg-search">
                <Search size={18} aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Пошук цілі"
                  placeholder="Пошук цілі"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>

            {shown.length > 0 || (tab === "active" && !q) ? (
              <div className="mqg-cards">
                {shown.map((g) => (
                  <GoalCard
                    key={g.id}
                    vm={vms.get(g.id)!}
                    selected={selected?.id === g.id}
                    warn={h.getDisciplineStatus(g).status !== "good"}
                    onSelect={() => select(g)}
                    onStar={() => h.setPrimaryGoal(g.id)}
                    onStairs={() => setStairsGoal(g)}
                    onResult={() => setResultGoal(g)}
                    onDelete={() => h.confirmDeleteGoal(g.id)}
                  />
                ))}
                {tab === "active" && !q && (
                  <button type="button" className="mqg-new" onClick={() => openCreate()}>
                    <span className="mqg-new-plus">
                      <Plus size={18} strokeWidth={2.2} aria-hidden="true" />
                    </span>
                    Нова ціль
                    <small>Активних цілей: {active.length} з 25</small>
                  </button>
                )}
              </div>
            ) : (
              <div className="mqg-none">
                <strong>{q ? "Нічого не знайдено" : "Завершених цілей ще немає"}</strong>
                <p>
                  {q
                    ? "Спробуйте іншу назву або очистіть пошук."
                    : "Тут з’являться виконані й закриті цілі з результатом."}
                </p>
                {q && (
                  <button type="button" className="mqp-btn-outline is-sm" onClick={() => setSearch("")}>
                    Очистити пошук
                  </button>
                )}
              </div>
            )}
          </section>

          <aside
            className={`mqt-guide mqg-guide${guideCollapsed ? " is-collapsed" : ""}`}
            aria-labelledby="mqg-guide-title"
          >
            <div className="mqt-guide-head">
              <div className="mqt-guide-titles">
                <p className="mqp-kicker">
                  <i>03</i> Типи цілей
                </p>
                <h2 id="mqg-guide-title">Як працюють цілі</h2>
              </div>
              <button
                type="button"
                className="mqt-guide-toggle"
                aria-expanded={!guideCollapsed}
                aria-controls="mqg-guide-body"
                aria-label={guideCollapsed ? "Розгорнути пояснення" : "Згорнути пояснення"}
                title={guideCollapsed ? "Розгорнути" : "Згорнути"}
                onClick={toggleGuide}
              >
                <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
            <div className="mqt-guide-reveal" id="mqg-guide-body" aria-hidden={guideCollapsed} inert={guideCollapsed}>
              <div className="mqt-guide-body">
                <ul className="mqg-guide-list">
                  {TYPE_ORDER.map((t) => (
                    <li key={t}>
                      <span className="mqg-guide-ico">
                        <GoalTypeIcon type={t} size={17} />
                      </span>
                      <span>
                        <strong>{TYPE_META[t].label}</strong>
                        <small>{TYPE_META[t].long}</small>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mqg-guide-note">
                  <span className="mqg-guide-note-ico">
                    <Link2 size={17} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>Прив’язуйте записи</strong>
                    <small>
                      У формі «Додати запис» оберіть ціль — запис піде в її прогрес і в
                      перевірку правил.
                    </small>
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      <p className="mqt-footnote">
        Цілі й кроки — ваш особистий план і не гарантують результату. MatchIQ не
        приймає ставки. 18+.
      </p>

      <CreateGoalDialog h={h} />
      <LadderStairsDialog goal={stairsGoal} onClose={() => setStairsGoal(null)} onAddRecord={() => navigate("/app/my-bets")} />
      <GoalResultDialog
        goal={resultGoal}
        bets={bets}
        onClose={() => setResultGoal(null)}
        onCreate={() => {
          setResultGoal(null);
          openCreate();
        }}
      />
      <DeleteGoalDialog
        goal={deleteGoalObj}
        vm={deleteGoalObj ? vms.get(deleteGoalObj.id) || null : null}
        open={h.showDeleteDialog}
        onOpenChange={h.setShowDeleteDialog}
        onDelete={h.deleteGoal}
      />
    </div>
  );
}

/* ---------- Focus ---------- */

interface FocusProps {
  vm: GoalVm;
  discipline: { status: "good" | "warning"; label: string };
  onAddRecord: () => void;
  onStairs: () => void;
  onResult: () => void;
}

const FocusSection = forwardRef<HTMLElement, FocusProps>(function FocusSection(
  { vm, discipline, onAddRecord, onStairs, onResult },
  ref,
) {
  const g = vm.goal;
  const finished = isFinished(g);
  const next = finished ? finishedNext(g, vm) : vm.next;
  const l = vm.ladder;
  const useTrack = !!l && l.total > 0 && l.total <= MAX_TRACK;
  const ok = g.status === "completed";

  return (
    <section ref={ref} className="mqp-sheet mqg-focus" aria-labelledby="mqg-focus-title">
      <div className="mqg-focus-main">
        <div className="mqg-focus-titles">
          <p className="mqp-kicker">
            <i>01</i> {finished ? "Завершена ціль" : g.isPrimary ? "Основна ціль" : "Вибрана ціль"}
          </p>
          <div className="mqg-chips">
            <span className="mqg-chip">
              <GoalTypeIcon type={g.type} size={14} />
              {vm.typeLabel}
            </span>
            {g.isPrimary && !finished && (
              <span className="mqg-star">
                <Star size={12} strokeWidth={0} fill="currentColor" aria-hidden="true" />
                Основна
              </span>
            )}
            {finished && <span className={`mqg-res${ok ? " is-ok" : ""}`}>{ok ? "Виконано" : "Не виконано"}</span>}
          </div>
          <h2 id="mqg-focus-title">{g.name}</h2>
        </div>

        <div className="mqg-big">
          <strong>{vm.cur}</strong>
          <span>{vm.of}</span>
        </div>

        {useTrack && l ? (
          <div className="mqg-progress">
            <div className="mqg-progress-head">
              <span>
                {finished
                  ? `Пройдено ${l.done} ${plural(l.done, "крок", "кроки", "кроків")} з ${l.total}`
                  : `Крок ${Math.min(l.done + 1, l.total)} з ${l.total}`}
              </span>
              <span>{vm.pct.toFixed(1).replace(".", ",")}%</span>
            </div>
            <div className="mqg-track" role="img" aria-label={`Виконано ${l.done} з ${l.total} кроків`}>
              {Array.from({ length: l.total }, (_, i) => (
                <span key={i} className={i < l.done ? "is-done" : i === l.done && !finished ? "is-cur" : ""} />
              ))}
            </div>
            <div className="mqg-progress-foot">
              <span>Старт {uahShort(l.start)}</span>
              <span>Ціль {uahShort(l.target)}</span>
            </div>
          </div>
        ) : (
          <div className="mqg-progress">
            <div className="mqg-progress-head">
              <span>{l ? vm.progressLabel : "Прогрес"}</span>
              <span>{vm.pct.toFixed(1).replace(".", ",")}%</span>
            </div>
            <div
              className={`mqg-bar${finished ? (ok ? " is-ok" : " is-off") : ""}`}
              role="progressbar"
              aria-label="Прогрес цілі"
              aria-valuenow={Math.round(vm.pct)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${Math.max(vm.pct, 1.5)}%` } as CSSProperties} />
            </div>
          </div>
        )}

        <dl className="mqg-stats">
          {vm.stats.map((s) => (
            <div key={s.k}>
              <dt>{s.k}</dt>
              <dd>{s.v}</dd>
            </div>
          ))}
        </dl>

        <div className="mqg-rules">
          <span className={`mqg-rule${discipline.status === "good" ? " is-good" : " is-warn"}`}>
            {discipline.status === "good" ? (
              <Check size={15} strokeWidth={2.4} aria-hidden="true" />
            ) : (
              <AlertTriangle size={15} strokeWidth={2} aria-hidden="true" />
            )}
            {discipline.status === "good" ? "Правила дотримані" : "Є відхилення від правил"}
          </span>
          <span className="mqg-linked">Прив’язано записів: {vm.linked}</span>
        </div>
      </div>

      <aside className="mqg-next" aria-label={next.kicker}>
        <p className="mqg-next-kicker">
          <i aria-hidden="true" />
          {next.kicker}
        </p>
        <strong className="mqg-next-big">{next.big}</strong>
        <dl>
          {next.rows.map((r) => (
            <div key={r.k}>
              <dt>{r.k}</dt>
              <dd>{r.v}</dd>
            </div>
          ))}
        </dl>
        <p className="mqg-next-note">{next.note}</p>
        <div className="mqg-next-actions">
          {!finished && (
            <SwapPill label="Додати запис" onClick={onAddRecord} icon={<Plus size={16} strokeWidth={2.2} />} />
          )}
          {finished && (
            <SwapPill label="Підсумок цілі" onClick={onResult} icon={<ArrowRight size={16} strokeWidth={2.2} />} />
          )}
          {g.type === "ladder" && (
            <button type="button" className="mqg-btn-dark-outline" onClick={onStairs}>
              Деталі лесенки
            </button>
          )}
        </div>
      </aside>
    </section>
  );
});

const uahShort = (n: number) =>
  `${new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 }).format(Math.round(n))} ₴`;

/* ---------- Card ---------- */
interface CardProps {
  vm: GoalVm;
  selected: boolean;
  warn: boolean;
  onSelect: () => void;
  onStar: () => void;
  onStairs: () => void;
  onResult: () => void;
  onDelete: () => void;
}

function GoalCard({ vm, selected, warn, onSelect, onStar, onStairs, onResult, onDelete }: CardProps) {
  const g = vm.goal;
  const finished = isFinished(g);
  const ok = g.status === "completed";
  return (
    <article className={`mqg-card${selected ? " is-on" : ""}`}>
      <button
        type="button"
        className="mqg-card-hit"
        aria-pressed={selected}
        aria-label={`Показати ціль «${g.name}»`}
        onClick={onSelect}
      />
      <div className="mqg-card-top">
        <span className="mqg-ico">
          <GoalTypeIcon type={g.type} />
        </span>
        <span className="mqg-card-tags">
          <small>{vm.typeLabel}</small>
          {g.isPrimary && !finished && (
            <span className="mqg-star is-sm">
              <Star size={10} strokeWidth={0} fill="currentColor" aria-hidden="true" />
              Основна
            </span>
          )}
          {finished && (
            <span className={`mqg-res is-sm${ok ? " is-ok" : ""}`}>{ok ? "Виконано" : "Не виконано"}</span>
          )}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="mqg-card-menu" aria-label={`Дії цілі «${g.name}»`}>
              <MoreHorizontal size={20} aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="mqg-menu">
            {!finished && (
              <DropdownMenuItem onSelect={onStar}>
                <Star size={16} strokeWidth={1.8} aria-hidden="true" />
                {g.isPrimary ? "Зняти позначку основної" : "Зробити основною"}
              </DropdownMenuItem>
            )}
            {g.type === "ladder" && (
              <DropdownMenuItem onSelect={onStairs}>
                <GoalTypeIcon type="ladder" size={16} />
                Деталі лесенки
              </DropdownMenuItem>
            )}
            {finished && (
              <DropdownMenuItem onSelect={onResult}>
                <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
                Підсумок цілі
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={onDelete} className="is-danger">
              <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
              Видалити ціль
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <span className="mqg-card-name">{g.name}</span>
      <span className="mqg-card-val">
        <strong>{vm.cur}</strong>
        <small>{vm.of}</small>
      </span>
      <span className="mqg-card-foot">
        <span className={`mqg-bar is-thin${finished ? (ok ? " is-ok" : " is-off") : ""}`} aria-hidden="true">
          <span style={{ width: `${Math.max(vm.pct, 1.5)}%` } as CSSProperties} />
        </span>
        <span className="mqg-card-meta">
          <span className={finished ? "" : warn ? "is-warn" : "is-good"}>
            {finished ? shortDate(g.completedAt) : warn ? "Є відхилення" : "Правила дотримані"}
          </span>
          <span>{vm.progressLabel}</span>
        </span>
      </span>
    </article>
  );
}
