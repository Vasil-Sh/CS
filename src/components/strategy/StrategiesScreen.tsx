import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Clock,
  Eye,
  Layers,
  ListChecks,
  Lock,
  MoreHorizontal,
  Pause,
  Pencil,
  Percent,
  Plus,
  Search,
  Star,
  Target,
  Trash2,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SwapPill } from "@/components/analytics/TelegramDashboard";
import { MAX_STRATEGIES, useStrategies } from "@/hooks/useStrategies";
import type { CS2Strategy } from "@/types/strategy";
import { DeleteStrategyDialog, StrategyFormDialog } from "./StrategyDialogs";
import {
  LOW_DATA,
  PERIODS,
  RISK_LABEL,
  RISK_LEVEL,
  compliance,
  inPeriod,
  odds2,
  pct1,
  records,
  recordsOf,
  recordsWithout,
  rulesOf,
  seriesOf,
  signedPct,
  signedUah,
  sparkPath,
  statsOf,
  uah,
  type Compliance,
  type Period,
  type StratStats,
  type StrategyRules,
} from "./strategyView";
import "@/components/analytics/TelegramDashboard.css";
import "@/components/SwapPill.css";
import "@/components/goals/GoalsScreen.css";
import "./StrategiesScreen.css";

const GUIDE_KEY = "matchiq_strategies_guide_collapsed";
const readGuide = () => {
  try {
    return window.localStorage.getItem(GUIDE_KEY) === "1";
  } catch {
    return false;
  }
};

interface Vm {
  s: CS2Strategy;
  rules: StrategyRules;
  stats: StratStats;
  comp: Compliance;
  series: { profit: number[]; roi: number[] };
}

const roiCls = (v: number | null) => (v == null ? "" : v >= 0 ? "is-up" : "is-down");

export default function StrategiesScreen() {
  const h = useStrategies();
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<Period>("all");
  const [sort, setSort] = useState<"roi" | "profit" | "records">("roi");
  const [guideCollapsed, setGuideCollapsed] = useState(readGuide);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CS2Strategy | null>(null);
  const [toDelete, setToDelete] = useState<CS2Strategy | null>(null);
  const focusRef = useRef<HTMLElement>(null);

  const keyOf = (s: CS2Strategy) => s.id || s.name;

  const vms = useMemo(() => {
    const m = new Map<CS2Strategy, Vm>();
    for (const s of h.strategies) {
      const recs = recordsOf(s, h.bets);
      const rules = rulesOf(s);
      m.set(s, { s, rules, stats: statsOf(recs), comp: compliance(rules, recs), series: seriesOf(recs) });
    }
    return m;
  }, [h.strategies, h.bets]);

  const fallback = h.strategies.find(h.isPrimary) || h.strategies[0] || null;
  const selected = h.strategies.find((s) => keyOf(s) === selectedKey) || fallback;

  useEffect(() => {
    if (selectedKey && !h.strategies.some((s) => keyOf(s) === selectedKey)) setSelectedKey(null);
  }, [h.strategies, selectedKey]);

  const q = search.trim().toLowerCase();
  const shown = h.strategies.filter((s) => !q || s.name.toLowerCase().includes(q));

  const select = (s: CS2Strategy) => {
    setSelectedKey(keyOf(s));
    const el = focusRef.current;
    if (el && el.getBoundingClientRect().top < 0) {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  };
  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (s: CS2Strategy) => {
    setEditing(s);
    setFormOpen(true);
  };
  const toggleGuide = () =>
    setGuideCollapsed((v) => {
      try {
        window.localStorage.setItem(GUIDE_KEY, v ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !v;
    });

  // ---- comparison (period-filtered) ----
  const rows = useMemo(() => {
    const periodBets = h.bets.filter((b) => inPeriod(b, period));
    const list = h.strategies.map((s) => {
      const recs = recordsOf(s, periodBets);
      return { s, stats: statsOf(recs), comp: compliance(vms.get(s)!.rules, recs) };
    });
    const key = {
      roi: (r: (typeof list)[number]) => r.stats.roi ?? -1e9,
      profit: (r: (typeof list)[number]) => (r.stats.settled ? r.stats.profit : -1e9),
      records: (r: (typeof list)[number]) => r.stats.records,
    }[sort];
    list.sort((a, b) => key(b) - key(a));
    return { list, none: statsOf(recordsWithout(periodBets)) };
  }, [h.bets, h.strategies, period, sort, vms]);
  const maxAbsRoi = Math.max(10, ...rows.list.map((r) => Math.abs(r.stats.roi ?? 0)), Math.abs(rows.none.roi ?? 0));

  const atLimit = h.strategies.length >= MAX_STRATEGIES;

  return (
    <div className="mqt-screen mqg-screen mqs-screen">
      {/* ===== Hero ===== */}
      <section className="mqp-hero is-photo is-compact mqs-hero" aria-label="Стратегії">
        <header className="mqp-heading">
          <div>
            <p className="mqp-eyebrow">
              <i aria-hidden="true" />
              Дисципліна
            </p>
            <h1>Стратегії</h1>
          </div>
        </header>
        <p className="mqt-hero-copy">
          Ваші правила для ставок — і те, як вони працюють на ділі. MatchIQ перевіряє кожен запис за правилами
          стратегії й показує, чи дає вона кращий результат, ніж ставки без неї.
        </p>
        <div className="mqg-hero-actions">
          <SwapPill
            label="Нова стратегія"
            onClick={openCreate}
            disabled={atLimit}
            icon={<Plus size={16} strokeWidth={2.2} />}
          />
        </div>
      </section>

      {/* ===== Empty ===== */}
      {!h.loading && h.strategies.length === 0 && (
        <section className="mqp-sheet mqg-empty" aria-labelledby="mqs-empty-title">
          <div className="mqg-empty-head">
            <p className="mqp-kicker">
              <i>01</i> Перша стратегія
            </p>
            <h2 id="mqs-empty-title">Запишіть свої правила — MatchIQ стежитиме, щоб ви їх дотримувались</h2>
            <p>
              Почніть із шаблону або з нуля. Коли вказуватимете стратегію в записі, ми перевіримо коефіцієнт, формат і
              тип ставки та покажемо, як стратегія працює порівняно зі ставками без неї.
            </p>
          </div>
          <span>
            <SwapPill label="Створити стратегію" onClick={openCreate} icon={<Plus size={16} strokeWidth={2.2} />} />
          </span>
        </section>
      )}
      {h.loading && h.strategies.length === 0 && (
        <section className="mqp-sheet mqs-loading" aria-busy="true" aria-label="Завантаження стратегій" />
      )}

      {/* ===== 01 Focus ===== */}
      {selected && (
        <Focus
          ref={focusRef}
          vm={vms.get(selected)!}
          primary={h.isPrimary(selected)}
          onEdit={() => openEdit(selected)}
          onAddRecord={() => navigate("/app/my-bets")}
        />
      )}

      {/* ===== 02 List ===== */}
      {h.strategies.length > 0 && (
        <section className="mqp-sheet mqs-list" aria-labelledby="mqs-list-title">
          <div className="mqp-sec-head">
            <div>
              <p className="mqp-kicker">
                <i>02</i> Мої стратегії
              </p>
              <h2 id="mqs-list-title">Усі стратегії</h2>
              <p className="mqg-sub">Натисніть на картку, щоб відкрити стратегію угорі.</p>
            </div>
            <label className="mqt-search mqg-search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                aria-label="Пошук стратегії"
                placeholder="Пошук стратегії"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          {shown.length > 0 || !q ? (
            <div className="mqg-cards">
              {shown.map((s) => (
                <Card
                  key={keyOf(s)}
                  vm={vms.get(s)!}
                  primary={h.isPrimary(s)}
                  selected={selected === s}
                  onSelect={() => select(s)}
                  onStar={() => h.togglePrimary(s)}
                  onEdit={() => openEdit(s)}
                  onDelete={() => setToDelete(s)}
                />
              ))}
              {!q && (
                <button type="button" className="mqg-new mqs-new" onClick={openCreate} disabled={atLimit}>
                  <span className="mqg-new-plus">
                    <Plus size={18} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  Нова стратегія
                  <small>
                    Стратегій: {h.strategies.length} з {MAX_STRATEGIES}
                  </small>
                </button>
              )}
            </div>
          ) : (
            <div className="mqg-none">
              <strong>Нічого не знайдено</strong>
              <p>Спробуйте іншу назву або очистіть пошук.</p>
              <button type="button" className="mqp-btn-outline is-sm" onClick={() => setSearch("")}>
                Очистити пошук
              </button>
            </div>
          )}
        </section>
      )}

      {/* ===== 03 Compare + 04 Guide ===== */}
      {h.strategies.length > 0 && (
        <div className="mqt-grid">
          <section className="mqp-sheet mqt-ledger mqs-compare" aria-labelledby="mqs-cmp-title">
            <div className="mqp-sec-head">
              <div>
                <p className="mqp-kicker">
                  <i>03</i> Порівняння
                </p>
                <h2 id="mqs-cmp-title">Яка стратегія працює краще</h2>
                <p className="mqg-sub">
                  Лише виграні й програні записи, період — за датою запису. Останній рядок — записи без стратегії.
                </p>
              </div>
              <div className="mqs-cmp-tools">
                <label className="mqs-period">
                  <span>Період</span>
                  <Select
                    value={period}
                    onValueChange={(v) => setPeriod(v as Period)}
                  >
                    <SelectTrigger
                      className="mqt-select"
                      aria-label="Період"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      sideOffset={6}
                      className="mqt-select-menu"
                    >
                      {PERIODS.map(([id, label]) => (
                        <SelectItem key={id} value={id}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <div className="mqt-seg" role="group" aria-label="Сортувати за">
                  {(
                    [
                      ["roi", "ROI"],
                      ["profit", "Прибуток"],
                      ["records", "Записи"],
                    ] as const
                  ).map(([id, label]) => (
                    <button key={id} type="button" aria-pressed={sort === id} onClick={() => setSort(id)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mqs-table-scroll">
              <table className="mqs-table">
                <caption className="sr-only">Порівняння стратегій за обраний період</caption>
                <thead>
                  <tr>
                    <th scope="col">Стратегія</th>
                    <th scope="col">Записів</th>
                    <th scope="col">Перемог</th>
                    <th scope="col">ROI</th>
                    <th scope="col" className="is-num">
                      Прибуток
                    </th>
                    <th scope="col" className="is-num">
                      У правилах
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.list.map(({ s, stats, comp }) => (
                    <CmpRow
                      key={keyOf(s)}
                      name={s.name}
                      primary={h.isPrimary(s)}
                      stats={stats}
                      comp={comp.total ? `${Math.round((comp.ok / comp.total) * 100)}%` : "—"}
                      max={maxAbsRoi}
                      onClick={() => select(s)}
                    />
                  ))}
                  <CmpRow name="Без стратегії" none stats={rows.none} comp="не перевіряється" max={maxAbsRoi} />
                </tbody>
              </table>
            </div>
            <p className="mqs-note">
              «Мало даних» — менше {LOW_DATA} розрахованих записів: різниця в ROI може бути випадковою. Минулі
              результати не гарантують майбутніх.
            </p>
          </section>

          <aside className={`mqt-guide mqg-guide${guideCollapsed ? " is-collapsed" : ""}`} aria-labelledby="mqs-guide-title">
            <div className="mqt-guide-head">
              <div className="mqt-guide-titles">
                <p className="mqp-kicker">
                  <i>04</i> Як це працює
                </p>
                <h2 id="mqs-guide-title">Стратегія — це правила, які перевіряються</h2>
              </div>
              <button
                type="button"
                className="mqt-guide-toggle"
                aria-expanded={!guideCollapsed}
                aria-controls="mqs-guide-body"
                aria-label={guideCollapsed ? "Розгорнути пояснення" : "Згорнути пояснення"}
                onClick={toggleGuide}
              >
                <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
            <div className="mqt-guide-reveal" id="mqs-guide-body" aria-hidden={guideCollapsed} inert={guideCollapsed}>
              <div className="mqt-guide-body">
                <ol className="mqg-guide-list mqs-steps">
                  {[
                    ["Задайте правила", "Коефіцієнти, формати, типи ставок, ліміт на день і тільт-захист."],
                    ["Вказуйте стратегію в записі", "Основна стратегія підставляється у формі «Додати запис» сама."],
                    ["MatchIQ перевіряє", "Запис поза правилами отримає попередження або буде заблокований — як ви налаштували."],
                    ["Порівнюйте", "Блок 03 показує, чи дає стратегія кращий результат, ніж ставки без неї."],
                  ].map(([t, d], i) => (
                    <li key={t}>
                      <span className="mqg-guide-ico">{i + 1}</span>
                      <span>
                        <strong>{t}</strong>
                        <small>{d}</small>
                      </span>
                    </li>
                  ))}
                </ol>
                <div className="mqs-modes-note">
                  <span>
                    <span className="mqs-mode is-warn">Попереджає</span>
                    Запис можна зберегти після підтвердження.
                  </span>
                  <span>
                    <span className="mqs-mode is-block is-on-dark">Блокує</span>
                    Запис не збережеться, доки не виправите.
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      <p className="mqt-footnote">Стратегії — ваші власні правила й не гарантують результату. MatchIQ не приймає ставки. 18+.</p>

      <StrategyFormDialog
        open={formOpen}
        editing={editing}
        editingPrimary={editing ? h.isPrimary(editing) : false}
        bets={h.bets}
        onOpenChange={setFormOpen}
        onCreate={async (s, primary) => {
          const saved = await h.create(s, primary);
          setSelectedKey(keyOf(saved));
        }}
        onUpdate={(s, prev, primary) => h.update(s, prev, primary)}
      />
      <DeleteStrategyDialog
        strategy={toDelete}
        stats={toDelete ? vms.get(toDelete)?.stats ?? null : null}
        onOpenChange={(o) => !o && setToDelete(null)}
        onDelete={() => toDelete && h.remove(toDelete)}
      />
    </div>
  );
}

/* ---------- Pieces ---------- */

function RiskMeter({ level }: { level: number }) {
  return (
    <span className="mqs-meter" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <b key={i} className={i <= level ? "is-on" : undefined} style={{ height: 4 + i * 3 }} />
      ))}
    </span>
  );
}

function ModeBadge({ mode }: { mode: "warn" | "block" | "manual" }) {
  if (mode === "block")
    return (
      <span className="mqs-mode is-block">
        <Lock size={13} strokeWidth={2} aria-hidden="true" />
        Блокує
      </span>
    );
  if (mode === "warn")
    return (
      <span className="mqs-mode is-warn">
        <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" />
        Попереджає
      </span>
    );
  return (
    <span className="mqs-mode is-manual">
      <Eye size={13} strokeWidth={2} aria-hidden="true" />
      Перевіряєте ви
    </span>
  );
}

function ruleRows(r: StrategyRules) {
  const out: { Icon: typeof Percent; k: string; v: string; mode: "warn" | "block" | "manual" }[] = [];
  if (r.odds)
    out.push({
      Icon: Percent,
      k: "Коефіцієнт",
      v: r.odds.min && r.odds.max ? `${odds2(r.odds.min)} – ${odds2(r.odds.max)}` : r.odds.min ? `від ${odds2(r.odds.min)}` : `до ${odds2(r.odds.max!)}`,
      mode: r.odds.mode,
    });
  if (r.formats) out.push({ Icon: Layers, k: "Формат матчу", v: r.formats.list.join(", "), mode: r.formats.mode });
  if (r.types) {
    const one = r.types.list.length === 1;
    const t = one ? (r.types.list[0] === "Ординар" ? "Лише ординари" : "Лише експреси") : r.types.list.join(", ");
    out.push({
      Icon: ListChecks,
      k: "Тип ставки",
      v: r.types.maxEvents && r.types.list.includes("Експрес") ? `${t}, експрес до ${r.types.maxEvents} подій` : t,
      mode: r.types.mode,
    });
  }
  if (r.limit) out.push({ Icon: Clock, k: "Ліміт", v: `До ${r.limit.perDay} записів на день`, mode: r.limit.mode });
  if (r.tilt)
    out.push({ Icon: Pause, k: "Тільт-захист", v: `Пауза ${r.tilt.minutes} хв після ${r.tilt.losses} програшів поспіль`, mode: "block" });
  r.custom.forEach((c) => out.push({ Icon: Eye, k: "Свій критерій", v: c, mode: "manual" }));
  return out;
}

const Focus = forwardRef<
  HTMLElement,
  { vm: Vm; primary: boolean; onEdit: () => void; onAddRecord: () => void }
>(function Focus({ vm, primary, onEdit, onAddRecord }, ref) {
  const { s, stats, comp, rules } = vm;
  const [chart, setChart] = useState<"profit" | "roi">("profit");
  const has = stats.settled > 0;
  const low = has && stats.settled < LOW_DATA;
  const vals = chart === "profit" ? vm.series.profit : vm.series.roi;
  const path = sparkPath(vals, 600, 96, 6);
  const list = ruleRows(rules);
  const okPct = comp.total ? Math.round((comp.ok / comp.total) * 100) : 0;

  return (
    <section ref={ref} className="mqp-sheet mqg-focus mqs-focus" aria-labelledby="mqs-focus-title">
      <div className="mqg-focus-main">
        <div className="mqs-focus-top">
          <div className="mqg-focus-titles">
            <p className="mqp-kicker">
              <i>01</i> {primary ? "Основна стратегія" : "Вибрана стратегія"}
            </p>
            <div className="mqg-chips">
              <span className="mqg-chip">
                <RiskMeter level={RISK_LEVEL[s.riskLevel] || 2} />
                {RISK_LABEL[s.riskLevel] || "Ризик не вказано"}
              </span>
              {primary && (
                <span className="mqg-star">
                  <Star size={12} strokeWidth={0} fill="currentColor" aria-hidden="true" />
                  Основна
                </span>
              )}
              {low && <span className="mqs-low">Мало даних</span>}
            </div>
            <h2 id="mqs-focus-title">{s.name}</h2>
            {s.description && <p className="mqs-desc">{s.description}</p>}
          </div>
          <button type="button" className="mqp-btn-outline is-sm" onClick={onEdit}>
            <Pencil size={15} strokeWidth={1.8} aria-hidden="true" />
            Редагувати
          </button>
        </div>

        <div className="mqs-perf">
          <div className="mqg-big mqs-big">
            <strong className={roiCls(stats.roi)}>{signedPct(stats.roi)}</strong>
            <span>{has ? `ROI за ${records(stats.settled)}` : "ROI з’явиться після першого розрахованого запису"}</span>
          </div>
          {has && (
            <figure className="mqs-chart">
              <figcaption>
                <span className="mqt-seg is-sm" role="group" aria-label="Показник графіка">
                  {(
                    [
                      ["profit", "Прибуток"],
                      ["roi", "ROI"],
                    ] as const
                  ).map(([id, label]) => (
                    <button key={id} type="button" aria-pressed={chart === id} onClick={() => setChart(id)}>
                      {label}
                    </button>
                  ))}
                </span>
                <strong>{chart === "profit" ? signedUah(stats.profit) : signedPct(stats.roi)}</strong>
              </figcaption>
              <svg
                viewBox="0 0 600 96"
                preserveAspectRatio="none"
                role="img"
                aria-label={`${chart === "profit" ? "Накопичений прибуток" : "ROI по ходу записів"}: ${
                  chart === "profit" ? signedUah(stats.profit) : signedPct(stats.roi)
                } за ${records(stats.settled)}`}
              >
                <line x1="0" x2="600" y1={path.zeroY} y2={path.zeroY} className="mqs-zero" />
                <path d={path.area} className={`mqs-area ${(vals[vals.length - 1] ?? 0) >= 0 ? "is-up" : "is-down"}`} />
                <path d={path.line} className="mqs-line" />
              </svg>
              <span className="mqs-chart-foot">
                <span>Перший запис</span>
                <span>Останній · {records(stats.settled)}</span>
              </span>
            </figure>
          )}
        </div>

        {low && (
          <p className="mqs-lownote">
            <AlertTriangle size={16} strokeWidth={1.8} aria-hidden="true" />
            Мало даних: {records(stats.settled)} розраховано. Висновки стануть надійнішими після {LOW_DATA}+ записів —
            поки ROI може бути випадковим.
          </p>
        )}

        <dl className="mqg-stats">
          <div>
            <dt>Записів</dt>
            <dd>
              {stats.records}
              {stats.pending ? ` · ${stats.pending} очікує` : ""}
            </dd>
          </div>
          <div>
            <dt>Виграші / програші</dt>
            <dd>{has ? `${stats.wins} / ${stats.losses} · ${pct1(stats.winRate!)}` : "—"}</dd>
          </div>
          <div>
            <dt>Прибуток</dt>
            <dd>{has ? signedUah(stats.profit) : "—"}</dd>
          </div>
          <div>
            <dt>Сума ставок</dt>
            <dd>{has ? uah(stats.stake) : "—"}</dd>
          </div>
        </dl>

        <div className="mqs-rules">
          <div className="mqs-rules-title">
            <h3>Правила</h3>
            <span>Перевіряються в кожному новому записі</span>
          </div>
          {list.length ? (
            <ul>
              {list.map((r, i) => (
                <li key={i}>
                  <span className="mqs-rule-ico">
                    <r.Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className="mqs-rule-txt">
                    <small>{r.k}</small>
                    <strong>{r.v}</strong>
                  </span>
                  <ModeBadge mode={r.mode} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mqs-norules">
              Правила не задані — стратегія лише групує записи для статистики.{" "}
              <button type="button" className="mqs-inline-link" onClick={onEdit}>
                Додати правила
              </button>
            </p>
          )}
        </div>
      </div>

      <aside className="mqg-next" aria-labelledby="mqs-comp-title">
        <p className="mqg-next-kicker">
          <i aria-hidden="true" />
          <span id="mqs-comp-title">Дотримання правил</span>
        </p>
        {comp.total ? (
          <>
            <div className="mqs-comp-big">
              <strong className="mqg-next-big">
                {comp.ok} з {comp.total}
              </strong>
              <span>
                {plainRecords(comp.total)} у межах правил · {okPct}%
              </span>
            </div>
            <div
              className="mqs-comp-bar"
              role="progressbar"
              aria-label="Записи в межах правил"
              aria-valuenow={okPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${okPct}%` }} />
            </div>
            {comp.top.length ? (
              <div className="mqs-viol">
                <span>Найчастіші відхилення</span>
                <dl>
                  {comp.top.map((v) => (
                    <div key={v.label}>
                      <dt>{v.label}</dt>
                      <dd>{records(v.n)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <p className="mqs-clean">
                <span>
                  <Check size={14} strokeWidth={2.4} aria-hidden="true" />
                </span>
                Жодного відхилення
              </p>
            )}
          </>
        ) : (
          <div className="mqs-comp-empty">
            <strong>Ще немає записів</strong>
            <span>Вкажіть цю стратегію у формі «Додати запис» — тут з’явиться, скільки записів у межах правил.</span>
          </div>
        )}
        <p className="mqg-next-note">
          Автоматично перевіряємо коефіцієнт, формат, тип ставки й ліміт на день. Свої критерії перевіряєте ви.
        </p>
        <div className="mqg-next-actions">
          <SwapPill label="Додати запис" onClick={onAddRecord} icon={<Plus size={16} strokeWidth={2.2} />} />
        </div>
      </aside>
    </section>
  );
});

const plainRecords = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? "запису" : "записів");

function Card({
  vm,
  primary,
  selected,
  onSelect,
  onStar,
  onEdit,
  onDelete,
}: {
  vm: Vm;
  primary: boolean;
  selected: boolean;
  onSelect: () => void;
  onStar: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { s, stats, comp } = vm;
  const has = stats.settled > 0;
  const p = sparkPath(vm.series.profit, 100, 36, 3);
  const okPct = comp.total ? Math.round((comp.ok / comp.total) * 100) : null;
  return (
    <article className={`mqg-card mqs-card${selected ? " is-on" : ""}`}>
      <button type="button" className="mqg-card-hit" aria-pressed={selected} aria-label={`Показати стратегію «${s.name}»`} onClick={onSelect} />
      <div className="mqg-card-top">
        <span className="mqg-ico">
          <Target size={18} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="mqg-card-tags">
          <small>{RISK_LABEL[s.riskLevel] || "Ризик не вказано"}</small>
          {primary && (
            <span className="mqg-star is-sm">
              <Star size={10} strokeWidth={0} fill="currentColor" aria-hidden="true" />
              Основна
            </span>
          )}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="mqg-card-menu" aria-label={`Дії стратегії «${s.name}»`}>
              <MoreHorizontal size={20} aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="mqg-menu">
            <DropdownMenuItem onSelect={onStar}>
              <Star size={16} strokeWidth={1.8} aria-hidden="true" />
              {primary ? "Зняти позначку основної" : "Зробити основною"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil size={16} strokeWidth={1.8} aria-hidden="true" />
              Редагувати правила
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onDelete} className="is-danger">
              <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
              Видалити стратегію
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <span className="mqg-card-name">{s.name}</span>
      <span className="mqs-card-val">
        <span className="mqg-card-val">
          <strong className={roiCls(stats.roi)}>{signedPct(stats.roi)}</strong>
          <small>ROI</small>
        </span>
        {has && (
          <svg viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true" className="mqs-spark">
            <line x1="0" x2="100" y1={p.zeroY} y2={p.zeroY} className="mqs-zero" />
            <path d={p.line} className={`mqs-line ${stats.profit >= 0 ? "is-up" : "is-down"}`} />
          </svg>
        )}
      </span>
      <span className="mqg-card-meta mqs-card-meta">
        <span>{has ? `${records(stats.records)} · ${Math.round(stats.winRate!)}% перемог` : stats.records ? records(stats.records) : "Ще немає записів"}</span>
        {okPct != null && <span className={okPct === 100 ? "is-good" : "is-warn"}>{okPct}% у правилах</span>}
      </span>
    </article>
  );
}

function CmpRow({
  name,
  primary = false,
  none = false,
  stats,
  comp,
  max,
  onClick,
}: {
  name: string;
  primary?: boolean;
  none?: boolean;
  stats: StratStats;
  comp: string;
  max: number;
  onClick?: () => void;
}) {
  const has = stats.settled > 0;
  const roi = stats.roi ?? 0;
  const w = has ? (Math.min(Math.abs(roi), max) / max) * 50 : 0;
  return (
    <tr className={none ? "is-none" : primary ? "is-primary" : undefined}>
      <th scope="row">
        <span className="mqs-cmp-name">
          {onClick ? (
            <button type="button" onClick={onClick}>
              {name}
            </button>
          ) : (
            <span>{name}</span>
          )}
          {primary && <span className="mqg-star is-sm">Основна</span>}
          {has && stats.settled < LOW_DATA && <span className="mqs-low is-sm">Мало даних</span>}
        </span>
      </th>
      <td>{stats.records}</td>
      <td>{has ? pct1(stats.winRate!) : "—"}</td>
      <td>
        <span className="mqs-roi-cell">
          <b className={roiCls(stats.roi)}>{signedPct(stats.roi)}</b>
          <span className="mqs-dbar" aria-hidden="true">
            <span className={roi >= 0 ? "is-up" : "is-down"} style={{ left: roi < 0 ? `${50 - w}%` : "50%", width: `${w}%` }} />
          </span>
        </span>
      </td>
      <td className={`is-num ${roiCls(has ? roi : null)}`}>{has ? signedUah(stats.profit) : "—"}</td>
      <td className="is-num">{comp}</td>
    </tr>
  );
}
