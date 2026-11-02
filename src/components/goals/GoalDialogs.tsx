import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { Check, ChevronDown, Info, Plus, Star, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SwapPill } from "@/components/analytics/TelegramDashboard";
import {
  getGoalProgress,
  type Bet,
  type Goal,
  type GoalType,
  type LadderMode,
  type useGoals,
} from "@/hooks/useGoals";
import { GoalTypeIcon } from "./GoalTypeIcon";
import {
  TYPE_META,
  TYPE_ORDER,
  count,
  goalBetStats,
  isFinished,
  ladderNumbers,
  ladderScenarios,
  odds2,
  pct1,
  plural,
  shortDate,
  signedUah,
  stepsWord,
  uah,
  type GoalVm,
} from "./goalView";

type Controller = ReturnType<typeof useGoals>;

const safeParseFloat = (v: string) => {
  const p = parseFloat(v);
  return Number.isNaN(p) ? 0 : p;
};

const CloseX = ({ light = false }: { light?: boolean }) => (
  <DialogClose className={`mqt-dialog-close${light ? " is-light" : ""}`} aria-label="Закрити">
    <X size={18} strokeWidth={1.8} aria-hidden="true" />
  </DialogClose>
);

/* ================= Create ================= */
export function CreateGoalDialog({ h }: { h: Controller }) {
  const type = h.newGoal.type;
  const reset = () => {
    h.setNewGoal({
      name: "",
      type: "amount",
      targetAmount: 100000,
      startAmount: 100,
      targetLadderAmount: 100000,
      minOdds: 1.3,
      maxOdds: 5,
      ladderMode: "soft",
      targetROI: 50,
      targetWinRate: 65,
      betsPerDay: 5,
    });
    h.setMinOddsStr("1.3");
    h.setMaxOddsStr("5");
    h.setStartAmountStr("100");
    h.setTargetLadderAmountStr("100000");
    h.setTargetAmountStr("100000");
    h.setTargetROIStr("50");
    h.setTargetWinRateStr("65");
    h.setBetsPerDayStr("5");
  };

  const start = safeParseFloat(h.startAmountStr);
  const target = safeParseFloat(h.targetLadderAmountStr);
  const min = safeParseFloat(h.minOddsStr);
  const max = safeParseFloat(h.maxOddsStr);
  const ladderOk = h.isLadderPreviewValid() && max > min;
  const scenarios = ladderOk ? ladderScenarios(start, target, min, max) : [];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    h.createGoal();
  };

  return (
    <Dialog
      open={h.showCreateDialog}
      onOpenChange={(open) => {
        h.setShowCreateDialog(open);
        if (!open) reset();
      }}
    >
      <DialogContent hideCloseButton className="mqt-dialog mqg-dialog">
        <div className="mqt-dialog-head">
          <div className="mqt-dialog-titles">
            <p className="mqt-dialog-kicker">Нова ціль</p>
            <DialogTitle>Створити ціль</DialogTitle>
            <DialogDescription>Оберіть показник, який хочете відстежувати.</DialogDescription>
          </div>
          <CloseX />
        </div>
        <form id="mqg-create-form" className="mqt-dialog-body" onSubmit={submit} noValidate>
          <div className="mqg-types-wrap">
            <div className="mqg-types" role="radiogroup" aria-label="Тип цілі">
              {TYPE_ORDER.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={type === t}
                  className={`mqg-type${type === t ? " is-on" : ""}`}
                  onClick={() => h.setNewGoal({ ...h.newGoal, type: t as GoalType })}
                >
                  <GoalTypeIcon type={t} />
                  {TYPE_META[t].label}
                </button>
              ))}
            </div>
            <p className="mqg-type-desc">{TYPE_META[type].desc}</p>
          </div>

          <div className="mqt-field">
            <label htmlFor="mqg-name">
              Назва цілі <b className="mqg-req">*</b>
            </label>
            <input
              id="mqg-name"
              autoComplete="off"
              placeholder={TYPE_META[type].placeholder}
              value={h.newGoal.name}
              onChange={(e) => h.setNewGoal({ ...h.newGoal, name: e.target.value })}
            />
          </div>

          {type === "amount" && (
            <div className="mqt-field">
              <label htmlFor="mqg-amount">
                Цільова сума <b className="mqg-req">*</b>
              </label>
              <SuffixInput id="mqg-amount" suffix="₴" value={h.targetAmountStr} onChange={h.setTargetAmountStr} />
              <small>Прогрес рахується за ставками, прив’язаними до цілі.</small>
            </div>
          )}
          {type === "roi" && (
            <div className="mqt-field">
              <label htmlFor="mqg-roi">
                Цільовий ROI <b className="mqg-req">*</b>
              </label>
              <SuffixInput id="mqg-roi" suffix="%" value={h.targetROIStr} onChange={h.setTargetROIStr} />
              <small>ROI — прибуток прив’язаних ставок, поділений на суму цих ставок.</small>
            </div>
          )}
          {type === "winrate" && (
            <div className="mqt-field">
              <label htmlFor="mqg-wr">
                Цільовий відсоток перемог <b className="mqg-req">*</b>
              </label>
              <SuffixInput id="mqg-wr" suffix="%" value={h.targetWinRateStr} onChange={h.setTargetWinRateStr} />
              <small>Частка виграних серед прив’язаних ставок, що вже розраховані.</small>
            </div>
          )}
          {type === "ladder" && (
            <>
              <div className="mqg-grid2">
                <div className="mqt-field">
                  <label htmlFor="mqg-ls">
                    Початкова сума <b className="mqg-req">*</b>
                  </label>
                  <SuffixInput id="mqg-ls" suffix="₴" value={h.startAmountStr} onChange={h.setStartAmountStr} />
                </div>
                <div className="mqt-field">
                  <label htmlFor="mqg-lt">
                    Цільова сума <b className="mqg-req">*</b>
                  </label>
                  <SuffixInput id="mqg-lt" suffix="₴" value={h.targetLadderAmountStr} onChange={h.setTargetLadderAmountStr} />
                </div>
                <div className="mqt-field">
                  <label htmlFor="mqg-lmin">
                    Мін. коефіцієнт <b className="mqg-req">*</b>
                  </label>
                  <input id="mqg-lmin" inputMode="decimal" value={h.minOddsStr} onChange={(e) => h.setMinOddsStr(e.target.value)} />
                </div>
                <div className="mqt-field">
                  <label htmlFor="mqg-lmax">
                    Макс. коефіцієнт <b className="mqg-req">*</b>
                  </label>
                  <input id="mqg-lmax" inputMode="decimal" value={h.maxOddsStr} onChange={(e) => h.setMaxOddsStr(e.target.value)} />
                </div>
              </div>
              <fieldset className="mqt-field">
                <legend>
                  Режим при програші <b className="mqg-req">*</b>
                </legend>
                <div className="mqg-grid2" role="radiogroup" aria-label="Режим при програші">
                  {(
                    [
                      ["soft", "М’який", "Продовжити з поточної суми."],
                      ["strict", "Жорсткий", "Почати лесенку заново."],
                    ] as [LadderMode, string, string][]
                  ).map(([id, label, text]) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={h.newGoal.ladderMode === id}
                      className={`mqg-mode${h.newGoal.ladderMode === id ? " is-on" : ""}`}
                      onClick={() => h.setNewGoal({ ...h.newGoal, ladderMode: id })}
                    >
                      <strong>
                        <i aria-hidden="true" />
                        {label}
                      </strong>
                      {text}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="mqg-scen-box">
                <div className="mqg-scen-head">
                  <strong>Сценарії кроків</strong>
                  <small>скільки кроків до цілі</small>
                </div>
                {ladderOk ? (
                  <div className="mqg-scen">
                    {scenarios.map((s) => (
                      <div key={s.key} className={`mqg-scen-card${s.mid ? " is-mid" : ""}`}>
                        <span>{s.speed}</span>
                        <strong>
                          {s.steps} {stepsWord(s.steps)}
                        </strong>
                        <small>
                          коеф. {odds2(s.odds)} · {s.note}
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mqg-scen-bad">
                    Ціль має бути більшою за старт, коефіцієнти — більшими за 1, а
                    максимальний — більшим за мінімальний.
                  </p>
                )}
                <small>На кожному кроці ставиться весь банк лесенки. Розрахунок плановий і не гарантує результату.</small>
              </div>
            </>
          )}

          <details className="mqg-rules-box" open>
            <summary>
              <ChevronDown size={18} strokeWidth={2} aria-hidden="true" />
              Додаткові правила
              <small>Необов’язково</small>
            </summary>
            <div className="mqt-field">
              <label htmlFor="mqg-perday">Ліміт ставок на день</label>
              <input
                id="mqg-perday"
                inputMode="numeric"
                className="mqg-short"
                value={h.betsPerDayStr}
                onChange={(e) => h.setBetsPerDayStr(e.target.value)}
              />
              <small>0 — без обмежень.</small>
            </div>
          </details>
        </form>
        <div className="mqt-dialog-foot mqg-foot">
          <span className="mqg-foot-note">
            <Info size={16} strokeWidth={1.8} aria-hidden="true" />
            Створення цілі не додає ставок у журнал.
          </span>
          <button type="button" className="mqt-btn-outline" onClick={() => h.setShowCreateDialog(false)}>
            Скасувати
          </button>
          <SwapPill type="submit" form="mqg-create-form" label="Створити ціль" icon={<Check size={16} strokeWidth={2.2} />} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SuffixInput({
  id,
  suffix,
  value,
  onChange,
}: {
  id: string;
  suffix: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <span className="mqg-suffix">
      <input id={id} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
      <span aria-hidden="true">{suffix}</span>
    </span>
  );
}

/* ================= Ladder stairs ================= */
interface StairRow {
  key: string;
  kind: "done" | "cur" | "plan" | "mile";
  n: string;
  stake: string;
  after: string;
  meta?: string;
  odds?: string;
  barW: string;
  label?: string;
  hint?: string;
}

export function LadderStairsDialog({
  goal,
  onClose,
  onAddRecord,
}: {
  goal: Goal | null;
  onClose: () => void;
  onAddRecord: () => void;
}) {
  const [all, setAll] = useState(false);
  const data = useMemo(() => (goal ? buildStairs(goal) : null), [goal]);

  return (
    <Dialog
      open={!!goal}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setAll(false);
        }
      }}
    >
      {goal && data && (
        <DialogContent hideCloseButton className="mqt-dialog is-wide mqg-dialog">
          <div className="mqt-dialog-head">
            <div className="mqt-dialog-titles">
              <p className="mqt-dialog-kicker">Деталі цілі</p>
              <DialogTitle>{goal.name}</DialogTitle>
              <DialogDescription className="mqg-head-meta">
                <span className="mqg-head-chip">
                  <GoalTypeIcon type="ladder" size={13} />
                  Лесенка
                </span>
                {goal.isPrimary && !isFinished(goal) && (
                  <span className="mqg-head-chip is-or">
                    <Star size={11} strokeWidth={0} fill="currentColor" aria-hidden="true" />
                    Основна
                  </span>
                )}
                <span>Створено {shortDate(goal.createdAt)}</span>
              </DialogDescription>
            </div>
            <CloseX />
          </div>
          <div className="mqt-dialog-body">
            <div className="mqg-tiles3">
              <div className="mqg-tile is-dark">
                <span>Поточний банк</span>
                <strong>{uah(data.l.bank)}</strong>
              </div>
              <div className="mqg-tile">
                <span>Ціль</span>
                <strong>{uah(data.l.target)}</strong>
              </div>
              <div className="mqg-tile">
                <span>Залишилось</span>
                <strong>{uah(Math.max(data.l.target - data.l.bank, 0))}</strong>
              </div>
            </div>

            <dl className="mqg-stats is-4">
              <div>
                <dt>Коефіцієнти</dt>
                <dd>
                  {odds2(data.l.min)} – {odds2(data.l.max)}
                </dd>
              </div>
              <div>
                <dt>Режим при програші</dt>
                <dd>{goal.ladderMode === "strict" ? "Жорсткий" : "М’який"}</dd>
              </div>
              <div>
                <dt>Ставок на день</dt>
                <dd>{goal.betsPerDay ? `до ${goal.betsPerDay}` : "Без обмежень"}</dd>
              </div>
              <div>
                <dt>Пройдено кроків</dt>
                <dd>
                  {data.l.done} з {data.l.total}
                </dd>
              </div>
            </dl>

            {!isFinished(goal) && data.l.bank < data.l.target && (
              <section className="mqg-block" aria-labelledby="mqg-scen-title">
                <div className="mqg-block-head">
                  <div>
                    <p className="mqp-kicker">
                      <i>01</i> Сценарії
                    </p>
                    <h3 id="mqg-scen-title">Скільки кроків лишилось</h3>
                  </div>
                  <small>з поточного банку {uah(data.l.bank)}</small>
                </div>
                <div className="mqg-scen">
                  {ladderScenarios(data.l.bank, data.l.target, data.l.min, data.l.max).map((s) => (
                    <div key={s.key} className={`mqg-scen-card${s.mid ? " is-mid" : ""}`}>
                      <span>{s.speed}</span>
                      <strong>
                        {s.steps} {stepsWord(s.steps)}
                      </strong>
                      <small>
                        коеф. {odds2(s.odds)} · {s.note}
                      </small>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="mqg-block" aria-labelledby="mqg-stairs-title">
              <div className="mqg-block-head">
                <div>
                  <p className="mqp-kicker">
                    <i>02</i> Кроки прогресії
                  </p>
                  <h3 id="mqg-stairs-title">Сходи до {uah(data.l.target)}</h3>
                </div>
                <span className="mqg-legend" aria-hidden="true">
                  <span>
                    <i className="is-done" />
                    Пройдено
                  </span>
                  <span>
                    <i className="is-cur" />
                    Поточний
                  </span>
                  <span>
                    <i className="is-plan" />
                    План
                  </span>
                </span>
              </div>

              {data.rows.length === 0 ? (
                <p className="mqg-muted">Кроки прогресії поки відсутні.</p>
              ) : (
                <ol className="mqg-stairs">
                  {(all ? data.rows : data.windowRows).map((r) => (
                    <StairItem key={r.key} r={r} />
                  ))}
                  {data.rows.length !== data.windowRows.length && (
                    <li className="mqg-stair is-more">
                      <span className="mqg-stair-node" aria-hidden="true">
                        <i />
                      </span>
                      <div>
                        <button type="button" className="mqp-btn-outline is-sm" onClick={() => setAll((v) => !v)}>
                          {all ? "Згорнути план" : `Показати всі ${data.l.total} ${stepsWord(data.l.total)}`}
                        </button>
                      </div>
                    </li>
                  )}
                  <li className="mqg-stair is-goal">
                    <span className="mqg-stair-node" aria-hidden="true">
                      <i>
                        <GoalFlag />
                      </i>
                    </span>
                    <div className="mqg-stair-goal">
                      <span>
                        <small>Ціль · після кроку {String(data.l.total).padStart(2, "0")}</small>
                        <strong>{uah(data.l.target)}</strong>
                      </span>
                    </div>
                  </li>
                </ol>
              )}
              <p className="mqg-muted is-sm">
                Довжина смуги — банк після виграшу на шляху від {uah(data.l.start)} до{" "}
                {uah(data.l.target)}. Пройдені кроки — фактичні записи, майбутні — план за
                мінімальним коефіцієнтом {odds2(data.l.min)}. Виграш не гарантований.
              </p>
            </section>
          </div>
          <div className="mqt-dialog-foot mqg-foot">
            <span className="mqg-foot-note">
              <Info size={16} strokeWidth={1.8} aria-hidden="true" />
              Прогрес оновлюється за прив’язаними ставками.
            </span>
            <DialogClose className="mqt-btn-outline">Закрити</DialogClose>
            {!isFinished(goal) && (
              <SwapPill label="Додати запис" onClick={onAddRecord} icon={<Plus size={16} strokeWidth={2.2} />} />
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

const GoalFlag = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 22V4" />
    <path d="M5 4h12l-2 4 2 4H5" />
  </svg>
);

function StairItem({ r }: { r: StairRow }) {
  if (r.kind === "mile")
    return (
      <li className="mqg-stair is-mile">
        <span className="mqg-stair-node" aria-hidden="true">
          <i />
        </span>
        <div className="mqg-mile">
          <span className="mqg-mile-tag">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3 4 9l8 12 8-12z" />
            </svg>
            {r.label}
          </span>
          <span className="mqg-mile-line" aria-hidden="true" />
          <small>{r.hint}</small>
        </div>
      </li>
    );
  if (r.kind === "cur")
    return (
      <li className="mqg-stair is-cur">
        <span className="mqg-stair-node" aria-hidden="true">
          <i>{r.n}</i>
        </span>
        <div className="mqg-cur">
          <div className="mqg-cur-head">
            <span>Крок {r.n} · зараз</span>
            <span>Наступна ставка за ціллю</span>
          </div>
          <dl>
            <div>
              <dt>Ставка</dt>
              <dd>{r.stake}</dd>
            </div>
            <div>
              <dt>Коефіцієнт</dt>
              <dd>{r.odds}</dd>
            </div>
            <div>
              <dt>Після виграшу</dt>
              <dd className="is-sm">{r.after}</dd>
            </div>
          </dl>
          <span className="mqg-stair-bar is-white" aria-hidden="true">
            <span style={{ width: r.barW } as CSSProperties} />
          </span>
        </div>
      </li>
    );
  return (
    <li className={`mqg-stair is-${r.kind}`}>
      <span className="mqg-stair-node" aria-hidden="true">
        <i>{r.kind === "done" ? <Check size={14} strokeWidth={3} /> : r.n}</i>
      </span>
      <div className="mqg-stair-row">
        <span className="mqg-stair-amt">
          <small>Крок {r.n}</small>
          <strong>{r.stake}</strong>
        </span>
        <span className="mqg-stair-bar" aria-hidden="true">
          <span style={{ width: r.barW } as CSSProperties} />
        </span>
        <span className="mqg-stair-after">
          <strong>{r.after}</strong>
          <small>{r.meta}</small>
        </span>
      </div>
    </li>
  );
}

function buildStairs(goal: Goal) {
  const l = ladderNumbers(goal);
  const finished = isFinished(goal);
  const steps = goal.steps || [];
  const span = Math.log(l.target / Math.max(l.start, 1));
  const w = (v: number) =>
    `${Math.max(3, Math.min(100, span > 0 ? (Math.log(Math.max(v, l.start) / l.start) / span) * 100 : 0))}%`;
  const nn = (i: number) => String(i + 1).padStart(2, "0");

  const stepRows: (StairRow & { afterVal: number; idx: number })[] = steps.map((s, i) => {
    if (s.status === "completed") {
      const after = s.actualAmount ?? s.startAmount * (s.actualOdds || 0);
      return {
        key: `s${i}`,
        idx: i,
        kind: "done",
        n: nn(i),
        stake: uah(s.startAmount),
        after: `→ ${uah(after)}`,
        meta: `коеф. ${odds2(s.actualOdds || 0)} · ${signedUah(after - s.startAmount)}`,
        barW: w(after),
        afterVal: after,
      };
    }
    const minAfter = s.minPlannedAmount ?? s.startAmount * l.min;
    const maxAfter = s.maxPlannedAmount ?? s.startAmount * l.max;
    if (i === l.done && !finished)
      return {
        key: `s${i}`,
        idx: i,
        kind: "cur",
        n: nn(i),
        stake: uah(s.startAmount),
        odds: `${odds2(l.min)} – ${odds2(l.max)}`,
        after: `${uah(minAfter)} – ${uah(maxAfter)}`,
        barW: w(minAfter),
        afterVal: minAfter,
      };
    return {
      key: `s${i}`,
      idx: i,
      kind: "plan",
      n: nn(i),
      stake: `≈ ${uah(s.startAmount)}`,
      after: `→ ≈ ${uah(minAfter)}`,
      meta: `план · від ${odds2(l.min)}`,
      barW: w(minAfter),
      afterVal: minAfter,
    };
  });

  const miles: [number, string][] = [];
  if (l.start * 10 < l.target) miles.push([l.start * 10, "×10 від старту"]);
  if (l.target / 2 > l.start * 2) miles.push([l.target / 2, "Половина шляху"]);
  const used = new Set<number>();
  const rows: StairRow[] = [];
  const rowStepIdx: number[] = [];
  stepRows.forEach((r, i) => {
    rows.push(r);
    rowStepIdx.push(r.idx);
    miles.forEach(([v, label], mi) => {
      if (!used.has(mi) && r.afterVal >= v && i < stepRows.length - 1) {
        used.add(mi);
        rows.push({
          key: `m${mi}`,
          kind: "mile",
          n: "",
          stake: "",
          after: "",
          barW: "0",
          label,
          hint: `${uah(v)} · після кроку ${r.n}`,
        });
        rowStepIdx.push(r.idx);
      }
    });
  });

  const from = Math.max(0, l.done - 3);
  const to = Math.min(steps.length - 1, l.done + 4);
  const windowRows = rows.filter((_, i) => rowStepIdx[i] >= from && rowStepIdx[i] <= to);
  return { l, rows, windowRows };
}

/* ================= Result ================= */
export function GoalResultDialog({
  goal,
  bets,
  onClose,
  onCreate,
}: {
  goal: Goal | null;
  bets: Bet[];
  onClose: () => void;
  onCreate: () => void;
}) {
  const r = useMemo(() => (goal ? buildResult(goal, bets) : null), [goal, bets]);
  return (
    <Dialog open={!!goal} onOpenChange={(open) => !open && onClose()}>
      {goal && r && (
        <DialogContent hideCloseButton className="mqt-dialog is-wide mqg-dialog">
          <div className="mqt-dialog-head">
            <span className={`mqg-result-badge${r.ok ? " is-ok" : ""}`} aria-hidden="true">
              {r.ok ? <Check size={28} strokeWidth={2.4} /> : <Info size={26} strokeWidth={2} />}
            </span>
            <div className="mqt-dialog-titles">
              <p className="mqt-dialog-kicker">Підсумок цілі</p>
              <DialogTitle>{r.ok ? "Ціль досягнута" : "Ціль не виконана"}</DialogTitle>
              <DialogDescription className="mqg-head-meta">
                <strong>{goal.name}</strong>
                <span className="mqg-head-chip">
                  <GoalTypeIcon type={goal.type} size={13} />
                  {TYPE_META[goal.type].label}
                </span>
              </DialogDescription>
            </div>
            <CloseX />
          </div>
          <div className="mqt-dialog-body">
            <section className="mqg-block">
              <p className="mqp-kicker">
                <i>01</i> Результат
              </p>
              <div className="mqg-grid2">
                <div className="mqg-result-card is-dark">
                  <span>{r.a.label}</span>
                  <strong>{r.a.value}</strong>
                  <small>{r.a.note}</small>
                </div>
                <div className="mqg-result-card">
                  <span>{r.b.label}</span>
                  <strong>{r.b.value}</strong>
                  <small>{r.b.note}</small>
                </div>
              </div>
              <div
                className={`mqg-bar${r.ok ? " is-ok" : " is-off"}`}
                role="progressbar"
                aria-label="Результат відносно цілі"
                aria-valuenow={Math.round(r.pct)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${Math.max(r.pct, 1.5)}%` } as CSSProperties} />
              </div>
            </section>

            <section className="mqg-block">
              <p className="mqp-kicker">
                <i>02</i> Ставки за ціллю
              </p>
              <div className="mqt-tiles">
                <div className="mqt-tile">
                  <span>Всього ставок</span>
                  <strong>{count(r.total)}</strong>
                </div>
                <div className="mqt-tile">
                  <span>Виграшів</span>
                  <strong>{count(r.wins)}</strong>
                </div>
                <div className="mqt-tile">
                  <span>Програшів</span>
                  <strong>{count(r.losses)}</strong>
                </div>
                <div className="mqt-tile">
                  <span>Серед. коеф.</span>
                  <strong>{r.avgOdds ? odds2(r.avgOdds) : "—"}</strong>
                </div>
              </div>
            </section>

            <section className="mqg-block">
              <p className="mqp-kicker">
                <i>03</i> Фінансовий підсумок
              </p>
              <div className="mqg-grid2">
                <div className="mqt-tile">
                  <span>Загальний прибуток</span>
                  <strong className={r.profit > 0 ? "mqg-up" : r.profit < 0 ? "mqg-down" : ""}>{signedUah(r.profit)}</strong>
                </div>
                <div className="mqt-tile">
                  <span>Середня ставка</span>
                  <strong>{r.total ? uah(r.staked / r.total) : "—"}</strong>
                </div>
              </div>
            </section>

            <section className="mqg-block">
              <p className="mqp-kicker">
                <i>04</i> Часова лінія
              </p>
              <div className="mqg-timeline">
                <span>
                  <small>Початок</small>
                  <strong>{shortDate(goal.createdAt)}</strong>
                </span>
                <span className="mqg-timeline-mid" aria-hidden="true">
                  <i />
                  <b />
                  <em>
                    {r.days} {plural(r.days, "день", "дні", "днів")}
                  </em>
                  <b />
                  <i className={r.ok ? "is-ok" : "is-off"} />
                </span>
                <span className="is-end">
                  <small>Завершення</small>
                  <strong>{shortDate(goal.completedAt)}</strong>
                </span>
              </div>
            </section>
          </div>
          <div className="mqt-dialog-foot mqg-foot">
            <span className="mqg-foot-note">Записи цілі залишаються в журналі — їх можна розібрати в Аналітиці.</span>
            <DialogClose className="mqt-btn-outline">Закрити</DialogClose>
            <SwapPill label="Нова ціль" onClick={onCreate} icon={<Plus size={16} strokeWidth={2.2} />} />
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

function buildResult(goal: Goal, bets: Bet[]) {
  const s = goalBetStats(goal, bets);
  let total = s.settled,
    wins = s.wins,
    losses = s.losses,
    staked = s.staked,
    profit = s.profit,
    avgOdds = s.avgOdds;

  // Ladder goals may have no tagged bets: derive from completed steps.
  if (goal.type === "ladder" && total === 0 && goal.steps?.length) {
    const done = goal.steps.filter((x) => x.status === "completed");
    if (done.length) {
      total = wins = done.length;
      losses = 0;
      staked = done.reduce((a, x) => a + (x.startAmount || 0), 0);
      profit = done.reduce((a, x) => {
        const win = x.actualAmount ?? x.startAmount * (x.actualOdds || 0);
        return a + (win - x.startAmount);
      }, 0);
      avgOdds = done.reduce((a, x) => a + (x.actualOdds || 0), 0) / done.length;
    }
  }
  if (goal.type === "amount" && total === 0) profit = goal.currentAmount || 0;

  const ok = goal.status === "completed";
  const pct = Math.max(0, Math.min(getGoalProgress(goal), 100));
  const startMs = new Date(goal.createdAt).getTime();
  const endMs = goal.completedAt ? new Date(goal.completedAt).getTime() : Date.now();
  const days = Number.isFinite(startMs) ? Math.max(1, Math.ceil((endMs - startMs) / 86400000)) : 0;

  let a = { label: "", value: "", note: "" };
  let b = { label: "", value: "", note: "" };
  if (goal.type === "amount") {
    const cur = goal.currentAmount || 0;
    const target = goal.targetAmount || 0;
    a = {
      label: "Заробили",
      value: signedUah(cur),
      note: cur >= target ? `на ${uah(cur - target)} більше за ціль` : `до цілі бракувало ${uah(target - cur)}`,
    };
    b = { label: "Ціль була", value: uah(target), note: `виконано на ${pct1(target ? (cur / target) * 100 : 0)}` };
  } else if (goal.type === "ladder") {
    const l = ladderNumbers(goal);
    a = {
      label: "Банк наприкінці",
      value: uah(l.bank),
      note: l.start ? `×${odds2(l.bank / l.start).replace(/,?0+$/, "")} від стартових ${uah(l.start)}` : "",
    };
    b = {
      label: ok ? "Пройдено" : "Зупинилась",
      value: ok ? `${l.done} ${stepsWord(l.done)}` : `Крок ${Math.min(l.done + 1, l.total)} з ${l.total}`,
      note: `ціль ${uah(l.target)}`,
    };
  } else if (goal.type === "roi") {
    const cur = goal.currentROI || 0;
    const target = goal.targetROI || 0;
    a = { label: "Досягнутий ROI", value: pct1(cur), note: cur >= target ? "ціль перевищено або досягнуто" : "нижче за ціль" };
    b = { label: "Цільовий ROI", value: pct1(target), note: ok ? "виконано" : "не виконано" };
  } else {
    const cur = goal.currentWinRate || 0;
    const target = goal.targetWinRate || 0;
    a = { label: "Досягнутий Win Rate", value: pct1(cur), note: `${count(wins)} ${plural(wins, "перемога", "перемоги", "перемог")} із ${count(total)} ставок` };
    b = { label: "Цільовий Win Rate", value: pct1(target), note: ok ? "виконано" : "не виконано" };
  }
  return { ok, pct, total, wins, losses, staked, profit, avgOdds, days, a, b };
}

/* ================= Delete ================= */
export function DeleteGoalDialog({
  goal,
  vm,
  open,
  onOpenChange,
  onDelete,
}: {
  goal: Goal | null;
  vm: GoalVm | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton role="alertdialog" className="mqt-dialog is-narrow mqg-dialog">
        <div className="mqt-dialog-body is-delete">
          <div className="mqt-delete-top">
            <span className="mqt-delete-icon">
              <Trash2 size={22} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <CloseX light />
          </div>
          <div>
            <p className="mqt-dialog-kicker is-danger">Видалення</p>
            <DialogTitle>Видалити ціль?</DialogTitle>
          </div>
          {goal && vm && (
            <div className="mqg-del-card">
              <div>
                <span className="mqg-ico is-white">
                  <GoalTypeIcon type={goal.type} />
                </span>
                <span>
                  <strong>{goal.name}</strong>
                  <small>
                    {vm.typeLabel} · {vm.cur} {vm.of}
                  </small>
                </span>
              </div>
              <span className="mqg-bar is-thin" aria-hidden="true">
                <span style={{ width: `${Math.max(vm.pct, 1.5)}%` } as CSSProperties} />
              </span>
            </div>
          )}
          <DialogDescription className="mqt-danger-text">
            Ціль і її прогрес буде видалено. Записи в журналі залишаться, але більше не
            рахуватимуться в цій цілі. Дію неможливо скасувати.
          </DialogDescription>
        </div>
        <div className="mqt-dialog-foot">
          <button type="button" className="mqt-btn-outline" onClick={() => onOpenChange(false)}>
            Скасувати
          </button>
          <button type="button" className="mqt-btn-danger" onClick={onDelete}>
            <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
            Видалити ціль
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
