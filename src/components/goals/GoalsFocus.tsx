import { useState } from "react";
import {
  Star,
  RefreshCw,
  ArrowRight,
  Target,
  Trash2,
  MoreVertical,
  Search,
  Info,
  Banknote,
  TrendingUp,
  Percent,
  Layers,
  Plus,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  getGoalProgress,
  getGoalTypeLabel,
  type Goal,
  type useGoals,
} from "@/hooks/useGoals";
import "./GoalsMasterDetail.css";
import "./GoalsScreen.css";
type Controller = ReturnType<typeof useGoals>;
function GoalIcon({
  size = 28,
  strokeWidth = 1.5,
}: {
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="14" cy="18" r="12" />
      <circle cx="14" cy="18" r="8" />
      <circle cx="14" cy="18" r="3" />
      <path d="M14 18 27 5m-5 0 1 4 4 1 4-4-4-1-1-4-4 4M5 28l-2 3" />
    </svg>
  );
}
const fmt = (n: number) =>
  new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(n);
const goalTypeIcon = {
  amount: Banknote,
  roi: TrendingUp,
  winrate: Percent,
  ladder: Layers,
} as const;
function metric(g: Goal) {
  switch (g.type) {
    case "amount":
      return {
        current: g.currentAmount ?? 0,
        target: g.targetAmount ?? 0,
        unit: " ₴",
        label: "Поточна сума",
      };
    case "ladder":
      return {
        current: g.currentBank ?? g.startAmount ?? 0,
        target: g.targetLadderAmount ?? 0,
        unit: " ₴",
        label: "Поточний банк",
      };
    case "roi":
      return {
        current: g.currentROI ?? 0,
        target: g.targetROI ?? 0,
        unit: "%",
        label: "Поточний ROI",
      };
    case "winrate":
      return {
        current: g.currentWinRate ?? 0,
        target: g.targetWinRate ?? 0,
        unit: "%",
        label: "Win Rate",
      };
  }
}
function GoalProgress({ goal }: { goal: Goal }) {
  const raw = getGoalProgress(goal);
  const value = Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;
  const complete = goal.status === "completed";
  return (
    <div
      className={`gmd-progress${complete ? " is-complete" : ""}${value === 0 ? " is-zero" : ""}`}
    >
      <progress max={100} value={value} aria-label={`Прогрес: ${goal.name}`} />
      <span>{fmt(value)}%</span>
    </div>
  );
}
function ActiveGoalCard({
  goal,
  selected,
  onSelect,
}: {
  goal: Goal;
  selected: boolean;
  onSelect: () => void;
}) {
  const m = metric(goal);
  const raw = getGoalProgress(goal);
  const progress = Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;
  const Icon = goalTypeIcon[goal.type] ?? Target;
  const complete = goal.status === "completed";
  return (
    <button
      className={`gmd-row goals-active-card${complete ? " is-complete" : ""}`}
      aria-pressed={selected}
      aria-controls="goal-detail-panel"
      onClick={onSelect}
    >
      <span
        className="goals-card-ring"
        role="progressbar"
        aria-label={`Прогрес: ${goal.name}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle className="goals-card-ring-track" cx="60" cy="60" r="53" />
          <circle
            className="goals-card-ring-value"
            cx="60"
            cy="60"
            r="53"
            pathLength="100"
            strokeDasharray={`${progress} 100`}
            opacity={progress === 0 ? 0 : 1}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <span>{fmt(progress)}%</span>
      </span>
      <span className="goals-card-copy">
        <span className="gmd-row-title">
          {goal.name}
          {goal.isPrimary && goal.status === "active" && (
            <span className="gmd-badge">Основна</span>
          )}
          {complete && (
            <span className="gmd-badge gmd-badge-complete">Завершена</span>
          )}
        </span>
        <span className="goals-card-type">
          <Icon size={20} aria-hidden="true" /> {getGoalTypeLabel(goal.type)}
        </span>
        <span className="goals-card-amount">
          <strong>
            {fmt(m.current)}
            {m.unit}
          </strong>
          <span>
            із {fmt(m.target)}
            {m.unit}
          </span>
        </span>
        <span className="goals-card-remaining">
          Залишилось {fmt(Math.max(0, m.target - m.current))}
          {m.unit === "%" ? " в.п." : m.unit}
        </span>
      </span>
      <ChevronRight className="goals-card-arrow" size={20} aria-hidden="true" />
    </button>
  );
}
export default function GoalsFocus({ h }: { h: Controller }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const active = h.activeTab === "active";
  const history = h.goals.filter((g) => g.status !== "active");
  const visible = (active ? h.activeGoals : history).filter((g) =>
    String(g.name ?? "")
      .toLocaleLowerCase("uk")
      .includes(query.trim().toLocaleLowerCase("uk")),
  );
  const selected =
    visible.find((g) => g.id === selectedId) ??
    visible.find((g) => g.isPrimary) ??
    visible[0];
  const values = selected ? metric(selected) : null;
  return (
    <div className="gmd-page goals-screen">
      <header className="goals-hero">
        <div className="goals-hero-copy">
          <p className="goals-eyebrow">
            GOALS <span aria-hidden="true" />
          </p>
          <h1>Цілі</h1>
          <p>Керуйте цілями та відстежуйте прогрес.</p>
        </div>
        <button
          className="goals-create"
          disabled={h.activeGoals.length >= 25}
          onClick={() => h.setShowCreateDialog(true)}
        >
          <Plus size={20} /> Створити ціль
        </button>
      </header>
      <div className="goals-summary" aria-label="Підсумки цілей">
        <button onClick={() => h.setActiveTab("active")}>
          <GoalIcon size={30} strokeWidth={1.8} />
          <span>
            Активні цілі<strong>{h.activeGoals.length}</strong>
          </span>
        </button>
        <button onClick={() => h.setActiveTab("completed")}>
          <CheckCircle2 size={30} strokeWidth={1.8} />
          <span>
            Завершені<strong>{history.length}</strong>
          </span>
        </button>
      </div>
      <div className="gmd-content">
        <div className={`gmd-layout${!selected ? " is-empty" : ""}`}>
          <div className="gmd-left">
            <section className="gmd-list" aria-label="Мої цілі">
              <div className="gmd-list-head">
                <h2>Мої цілі</h2>
                <label className="gmd-search">
                  <Search size={16} />
                  <input
                    aria-label="Пошук цілі"
                    placeholder="Пошук цілі"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              </div>
              <div className="gmd-tabs" role="group" aria-label="Стани цілей">
                <button
                  aria-pressed={active}
                  onClick={() => {
                    setSelectedId(null);
                    h.setActiveTab("active");
                  }}
                >
                  Активні{" "}
                  <span className="goals-tab-count">
                    {h.activeGoals.length}
                  </span>
                </button>
                <button
                  aria-pressed={!active}
                  onClick={() => {
                    setSelectedId(null);
                    h.setActiveTab("completed");
                  }}
                >
                  Завершені{" "}
                  <span className="goals-tab-count">{history.length}</span>
                </button>
              </div>
              <div
                className={`gmd-rows${visible.length ? " goals-active-cards" : ""}`}
              >
                {visible.map((goal) => (
                  <ActiveGoalCard
                    key={goal.id}
                    goal={goal}
                    selected={selected?.id === goal.id}
                    onSelect={() => setSelectedId(goal.id)}
                  />
                ))}
                {!visible.length && (
                  <div className="gmd-empty">
                    <h3>
                      {query
                        ? "Нічого не знайдено"
                        : active
                          ? "Наступна ціль починається тут"
                          : "Немає завершених цілей"}
                    </h3>
                    <p>
                      {query
                        ? "Спробуйте іншу назву або очистіть пошук."
                        : active
                          ? "Створіть ціль, щоб бачити свій прогрес."
                          : "Тут з’являться завершені цілі та їх результати."}
                    </p>
                    {!query && active && (
                      <button
                        className="gmd-empty-create"
                        onClick={() => h.setShowCreateDialog(true)}
                      >
                        <Plus size={17} />
                        Створити ціль
                      </button>
                    )}
                    {!query && active && history.length > 0 && (
                      <button
                        className="goals-history-link"
                        onClick={() => h.setActiveTab("completed")}
                      >
                        Переглянути завершені цілі <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <p className="gmd-list-hint">
                <Info size={16} />
                Оберіть ціль, щоб переглянути деталі.
              </p>
            </section>
          </div>
          {selected ? (
            <section
              id="goal-detail-panel"
              className="gmd-detail"
              aria-label="Деталі цілі"
            >
              {selected && values ? (
                <>
                  <div className="gmd-detail-top">
                    <span
                      className={`goals-status ${selected.status === "completed" ? "is-complete" : ""}`}
                    >
                      {selected.status === "active"
                        ? "Активна"
                        : selected.status === "completed"
                          ? "Завершена"
                          : "Не виконано"}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button aria-label="Дії вибраної цілі">
                          <MoreVertical size={20} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {selected.status === "active" && (
                          <DropdownMenuItem
                            onSelect={() => h.setPrimaryGoal(selected.id)}
                          >
                            <Star size={16} />
                            {selected.isPrimary
                              ? "Зняти позначку основної"
                              : "Зробити основною"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-red-600"
                          onSelect={() => h.confirmDeleteGoal(selected.id)}
                        >
                          <Trash2 size={16} />
                          Видалити ціль
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h2>
                    {selected.name}{" "}
                    {selected.isPrimary && selected.status === "active" && (
                      <span className="gmd-badge">Основна</span>
                    )}
                    {selected.status === "completed" && (
                      <span className="gmd-badge gmd-badge-complete">
                        Завершена
                      </span>
                    )}
                  </h2>
                  <dl className="gmd-values">
                    <div>
                      <dt>{values.label}</dt>
                      <dd>
                        {fmt(values.current)}
                        {values.unit}
                      </dd>
                    </div>
                    <div>
                      <dt>Ціль</dt>
                      <dd>
                        {fmt(values.target)}
                        {values.unit}
                      </dd>
                    </div>
                  </dl>
                  {values.unit !== "%" && (
                    <>
                      <GoalProgress goal={selected} />
                      {selected.type === "ladder" && (
                        <p className="gmd-muted">
                          Прогрес за кроками: {selected.currentStep ?? 0} /{" "}
                          {selected.totalSteps ?? 0}
                        </p>
                      )}
                    </>
                  )}
                  <dl className="gmd-facts">
                    <div>
                      <dt>Залишилось</dt>
                      <dd>
                        {fmt(Math.max(0, values.target - values.current))}
                        {values.unit === "%" ? " в.п." : values.unit}
                      </dd>
                    </div>
                    <div>
                      <dt>Тип цілі</dt>
                      <dd>{getGoalTypeLabel(selected.type)}</dd>
                    </div>
                    <div>
                      <dt>{selected.deadline ? "Дедлайн" : "Прогрес"}</dt>
                      <dd>
                        {selected.deadline
                          ? new Date(selected.deadline).toLocaleDateString(
                              "uk-UA",
                              { day: "numeric", month: "long" },
                            )
                          : `${fmt(Math.max(0, getGoalProgress(selected)))}%`}
                      </dd>
                    </div>
                  </dl>
                  <div className="gmd-detail-section">
                    <h3>Правила</h3>
                    <p>Ставок на день</p>
                    <strong>{selected.betsPerDay || "Без обмежень"}</strong>
                    {selected.type === "ladder" && (
                      <p>
                        Коефіцієнти: {selected.minOdds ?? "—"} –{" "}
                        {selected.maxOdds ?? "—"}
                      </p>
                    )}
                  </div>
                  <div className="gmd-detail-section">
                    <h3>Джерело прогресу</h3>
                    <p>Ставки, прив’язані до цієї цілі.</p>
                    {selected.status !== "active" && (
                      <p>
                        Статус:{" "}
                        {selected.status === "completed"
                          ? "Виконано"
                          : "Не виконано"}
                      </p>
                    )}
                  </div>
                  <div className="gmd-detail-actions">
                    <button
                      className="gmd-update"
                      disabled={h.isUpdating || selected.status !== "active"}
                      onClick={h.handleManualUpdate}
                    >
                      <RefreshCw
                        size={16}
                        className={h.isUpdating ? "animate-spin" : ""}
                      />
                      {h.isUpdating ? "Оновлення…" : "Оновити прогрес"}
                    </button>
                    {selected.type === "ladder" && (
                      <button
                        className="gmd-outline"
                        onClick={() => h.openDetailsDialog(selected)}
                      >
                        Кроки цілі <ArrowRight size={16} />
                      </button>
                    )}
                    {selected.status === "completed" && (
                      <button
                        className="gmd-outline"
                        onClick={() => h.openCompletedGoalResult(selected)}
                      >
                        Результат <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="gmd-empty">
                  <h2>Деталі цілі</h2>
                  <p>
                    {query
                      ? "Змініть пошук, щоб обрати ціль."
                      : "Оберіть ціль зі списку або створіть нову."}
                  </p>
                </div>
              )}
            </section>
          ) : (
            <aside className="gmd-guide" aria-label="Як це працює">
              <h2>Як це працює?</h2>
              <ol>
                {[
                  [
                    "Створіть ціль",
                    "Оберіть тип: сума банку, ROI або відсоток перемог. Задайте цільове значення та правила, щоб відстежувати прогрес.",
                  ],
                  [
                    "Прив'язуйте ставки",
                    "Під час додавання ставки обирайте ціль, до якої вона належить. Прогрес може оновлюватись автоматично, або натисніть «Оновити прогрес».",
                  ],
                  [
                    "Відстежуйте прогрес",
                    "Слідкуйте за рухом до мети: поточні значення, залишок і відсоток виконання — усе на одному екрані.",
                  ],
                ].map(([title, text], i) => (
                  <li key={title}>
                    <span>{i + 1}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
