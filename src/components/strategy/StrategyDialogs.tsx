import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AlertTriangle, BarChart3, Check, Lock, Plus, Scale, Shield, Trash2, TrendingUp, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SwapPill } from "@/components/analytics/TelegramDashboard";
import type { ActionMode, CS2Strategy } from "@/types/strategy";
import type { Bet } from "@/types/betting";
import {
  LOW_DATA,
  RISK_LABEL,
  checkRecord,
  isSettled,
  recordInput,
  records,
  rulesOf,
  signedPct,
  statsOf,
  type StratStats,
} from "./strategyView";

/* ================= Draft ================= */

type RuleKey = "odds" | "format" | "type" | "limit" | "tilt";
type ModeKey = Exclude<RuleKey, "tilt">;

export interface StrategyDraft {
  name: string;
  description: string;
  riskLevel: CS2Strategy["riskLevel"];
  on: Record<RuleKey, boolean>;
  mode: Record<ModeKey, ActionMode>;
  min: string;
  max: string;
  formats: string[];
  types: string[];
  maxEvents: string;
  perDay: string;
  tLoss: string;
  tMin: string;
  criteria: string[];
  primary: boolean;
}

const ALL_ON = { odds: true, format: true, type: true, limit: true, tilt: true };
const DEFAULT_MODE: Record<ModeKey, ActionMode> = { odds: "block", format: "warn", type: "block", limit: "warn" };

export const emptyDraft = (): StrategyDraft => ({
  name: "",
  description: "",
  riskLevel: "Medium",
  on: { odds: false, format: false, type: false, limit: false, tilt: false },
  mode: { ...DEFAULT_MODE },
  min: "",
  max: "",
  formats: [],
  types: [],
  maxEvents: "3",
  perDay: "5",
  tLoss: "3",
  tMin: "30",
  criteria: [],
  primary: false,
});

const TEMPLATES = [
  {
    id: "safe",
    label: "Обережна",
    hint: "1,30–1,80, BO3, лише ординари",
    Icon: Shield,
    v: { riskLevel: "Low", on: ALL_ON, min: "1.3", max: "1.8", formats: ["BO3"], types: ["Ординар"], perDay: "5", tLoss: "3", tMin: "30" },
  },
  {
    id: "bal",
    label: "Збалансована",
    hint: "1,50–2,50, BO1 і BO3, ординари й експреси",
    Icon: Scale,
    v: { riskLevel: "Medium", on: ALL_ON, min: "1.5", max: "2.5", formats: ["BO1", "BO3"], types: ["Ординар", "Експрес"], perDay: "5", tLoss: "3", tMin: "30" },
  },
  {
    id: "bold",
    label: "Сміливіша",
    hint: "Від 2,00. Вищі коефіцієнти — більші можливі просадки",
    Icon: TrendingUp,
    v: { riskLevel: "High", on: ALL_ON, min: "2", max: "4", formats: ["BO1", "BO3"], types: ["Ординар"], perDay: "3", tLoss: "2", tMin: "60" },
  },
  {
    id: "blank",
    label: "З нуля",
    hint: "Усі правила вимкнені",
    Icon: Plus,
    v: { riskLevel: "Medium", on: { odds: false, format: false, type: false, limit: false, tilt: false }, formats: [], types: [] },
  },
] as const;

const n = (v: string) => Number(v.trim().replace(",", "."));
const str = (v?: number) => (v == null ? "" : String(v));

export function draftFrom(s: CS2Strategy, primary: boolean): StrategyDraft {
  const r = rulesOf(s);
  const d = emptyDraft();
  return {
    ...d,
    name: s.name,
    description: s.description || "",
    riskLevel: s.riskLevel || "Medium",
    on: { odds: !!r.odds, format: !!r.formats, type: !!r.types, limit: !!r.limit, tilt: !!r.tilt },
    mode: {
      odds: r.odds?.mode ?? DEFAULT_MODE.odds,
      format: r.formats?.mode ?? DEFAULT_MODE.format,
      type: r.types?.mode ?? DEFAULT_MODE.type,
      limit: r.limit?.mode ?? DEFAULT_MODE.limit,
    },
    min: str(r.odds?.min),
    max: str(r.odds?.max),
    formats: r.formats?.list ?? [],
    types: r.types?.list ?? [],
    maxEvents: str(r.types?.maxEvents) || d.maxEvents,
    perDay: str(r.limit?.perDay) || d.perDay,
    tLoss: str(r.tilt?.losses) || d.tLoss,
    tMin: str(r.tilt?.minutes) || d.tMin,
    criteria: r.custom,
    primary,
  };
}

export function strategyFrom(d: StrategyDraft, base?: CS2Strategy): CS2Strategy {
  const odds = d.on.odds;
  const min = odds && d.min.trim() ? n(d.min) : undefined;
  const max = odds && d.max.trim() ? n(d.max) : undefined;
  const formats = d.on.format ? [...d.formats] : [];
  const types = d.on.type ? [...d.types] : [];
  const express = types.includes("Експрес");
  const criteria = [...new Set(d.criteria.map((c) => c.trim()).filter(Boolean))];
  return {
    ...(base || {}),
    id: base?.id || crypto.randomUUID(),
    _backendId: base?._backendId,
    rulesVersion: 2,
    name: d.name.trim(),
    description: d.description.trim(),
    riskLevel: d.riskLevel,
    expectedROI: base?.expectedROI ?? 0,
    // flat fields: read by older parts of the app
    minOdds: min,
    maxOdds: max,
    allowedFormats: formats,
    allowedBetTypes: types,
    oddsControl: { enabled: odds && (min != null || max != null), minOdds: min, maxOdds: max, actionMode: d.mode.odds },
    matchFormatRules: { enabled: formats.length > 0, allowedFormats: formats, actionMode: d.mode.format },
    betTypeRules: {
      enabled: types.length > 0,
      allowedTypes: types,
      maxEventsInExpress: express && d.maxEvents.trim() ? n(d.maxEvents) : undefined,
      actionMode: d.mode.type,
    },
    dailyLimit: { enabled: d.on.limit, maxBetsPerDay: d.on.limit ? n(d.perDay) : undefined, actionMode: d.mode.limit },
    activityLimits: {
      enabled: d.on.tilt,
      blockAfterLosses: d.on.tilt ? n(d.tLoss) : undefined,
      blockDurationMinutes: d.on.tilt ? n(d.tMin) : undefined,
      actionMode: "block",
    },
    customRules: criteria,
    criteria,
  };
}

function validate(d: StrategyDraft): Record<string, string> {
  const e: Record<string, string> = {};
  if (!d.name.trim()) e.name = "Вкажіть назву стратегії.";
  const int = (v: string) => Number.isSafeInteger(n(v)) && n(v) > 0;
  if (d.on.odds) {
    const a = d.min.trim() ? n(d.min) : null;
    const b = d.max.trim() ? n(d.max) : null;
    if (a == null && b == null) e.odds = "Вкажіть хоча б одну межу коефіцієнта.";
    else if ((a != null && !(a > 1)) || (b != null && !(b > 1))) e.odds = "Коефіцієнт має бути більшим за 1.";
    else if (a != null && b != null && a > b) e.odds = "«Від» має бути не більшим за «До».";
  }
  if (d.on.format && !d.formats.length) e.format = "Оберіть хоча б один формат.";
  if (d.on.type && !d.types.length) e.type = "Оберіть хоча б один тип.";
  if (d.on.type && d.types.includes("Експрес") && d.maxEvents.trim() && !(int(d.maxEvents) && n(d.maxEvents) >= 2))
    e.type = "Подій в експресі — ціле число від 2.";
  if (d.on.limit && !int(d.perDay)) e.limit = "Ліміт — ціле число більше нуля.";
  if (d.on.tilt && !(int(d.tLoss) && int(d.tMin))) e.tilt = "Вкажіть цілі числа більше нуля.";
  return e;
}

/* ================= Form dialog ================= */

const CloseX = ({ light = false }: { light?: boolean }) => (
  <DialogClose className={`mqt-dialog-close${light ? " is-light" : ""}`} aria-label="Закрити">
    <X size={18} strokeWidth={1.8} aria-hidden="true" />
  </DialogClose>
);

const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export function StrategyFormDialog({
  open,
  editing,
  editingPrimary,
  bets,
  onOpenChange,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  editing: CS2Strategy | null;
  editingPrimary: boolean;
  bets: Bet[];
  onOpenChange: (open: boolean) => void;
  onCreate: (s: CS2Strategy, primary: boolean) => Promise<unknown>;
  onUpdate: (s: CS2Strategy, prev: CS2Strategy, primary: boolean) => Promise<unknown>;
}) {
  const [d, setD] = useState<StrategyDraft>(emptyDraft);
  const [tpl, setTpl] = useState<string | null>(null);
  const [descOpen, setDescOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const draft = draftFrom(editing, editingPrimary);
      setD(draft);
      setTpl(null);
      setDescOpen(!!draft.description);
    } else {
      const t = TEMPLATES[0];
      setD({ ...emptyDraft(), ...t.v, on: { ...t.v.on }, formats: [...t.v.formats], types: [...t.v.types], primary: false });
      setTpl(t.id);
      setDescOpen(false);
    }
    setErrors({});
    setSaving(false);
  }, [open, editing, editingPrimary]);

  const set = <K extends keyof StrategyDraft>(k: K, v: StrategyDraft[K]) => {
    setD((p) => ({ ...p, [k]: v }));
    setErrors((e) => (Object.keys(e).length ? {} : e));
  };
  const setOn = (k: RuleKey) => set("on", { ...d.on, [k]: !d.on[k] });
  const setMode = (k: ModeKey, m: ActionMode) => set("mode", { ...d.mode, [k]: m });

  const pickTemplate = (t: (typeof TEMPLATES)[number]) => {
    setTpl(t.id);
    setD((p) => ({
      ...p,
      ...t.v,
      on: { ...t.v.on },
      formats: [...t.v.formats],
      types: [...t.v.types],
    }));
    setErrors({});
  };

  // Back-test on the journal: odds, format and type only.
  const preview = useMemo(() => {
    const settled = bets.filter(isSettled);
    const r = rulesOf(strategyFrom(d));
    const passed = settled.filter((b) => checkRecord(r, recordInput(b)).length === 0);
    return { all: statsOf(settled), pass: statsOf(passed) };
  }, [bets, d]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(d);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const strat = strategyFrom(d, editing || undefined);
      if (editing) await onUpdate(strat, editing, d.primary);
      else await onCreate(strat, d.primary);
      onOpenChange(false);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Не вдалося зберегти. Спробуйте ще раз." });
    } finally {
      setSaving(false);
    }
  };

  // Plain render helpers (not components) so inputs keep focus while typing.
  const modeSeg = (k: ModeKey, label: string) => (
    <span className="mqs-mseg" role="radiogroup" aria-label={`Режим: ${label}`}>
      {(
        [
          ["warn", "Попередити", AlertTriangle, "is-warn"],
          ["block", "Заблокувати запис", Lock, "is-block"],
        ] as const
      ).map(([m, title, Icon, cls]) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={d.mode[k] === m}
          aria-label={title}
          title={title}
          disabled={!d.on[k]}
          className={d.mode[k] === m ? cls : undefined}
          onClick={() => setMode(k, m)}
        >
          <Icon size={15} strokeWidth={2} aria-hidden="true" />
        </button>
      ))}
    </span>
  );

  const row = (k: RuleKey, label: string, children: ReactNode, mode = true) => (
    <div className={`mqs-row${d.on[k] ? "" : " is-off"}`}>
      <button
        type="button"
        role="switch"
        aria-checked={d.on[k]}
        aria-label={label}
        className={`mqs-sw${d.on[k] ? " is-on" : ""}`}
        onClick={() => setOn(k)}
      />
      <span className="mqs-row-name">{label}</span>
      <span className="mqs-row-ctl" inert={!d.on[k]}>
        {children}
      </span>
      {mode ? (
        modeSeg(k as ModeKey, label)
      ) : (
        <span className="mqs-mseg is-fixed" title="Тільт-захист завжди блокує">
          <span className="is-block">
            <Lock size={15} strokeWidth={2} aria-label="Блокує" />
          </span>
        </span>
      )}
      {errors[k] && <span className="mqs-err">{errors[k]}</span>}
    </div>
  );

  const chips = (key: "formats" | "types", options: string[]) =>
    options.map((o) => (
      <button
        key={o}
        type="button"
        aria-pressed={d[key].includes(o)}
        className={`mqs-ck${d[key].includes(o) ? " is-on" : ""}`}
        onClick={() => set(key, toggle(d[key], o))}
      >
        {o}
      </button>
    ));

  const pass: StratStats = preview.pass;
  const passColor = (pass.roi ?? 0) >= 0 ? "is-up" : "is-down";

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent hideCloseButton className="mqt-dialog mqs-dialog">
        <div className="mqt-dialog-head">
          <div className="mqt-dialog-titles">
            <p className="mqt-dialog-kicker">{editing ? "Стратегія" : "Нова стратегія"}</p>
            <DialogTitle>{editing ? "Редагувати стратегію" : "Створити стратегію"}</DialogTitle>
            <DialogDescription className="sr-only">Назва, рівень ризику та правила, які перевірятимуть записи.</DialogDescription>
          </div>
          <CloseX />
        </div>

        <form id="mqs-form" className="mqt-dialog-body mqs-form" onSubmit={submit} noValidate>
          {!editing && (
            <div className="mqs-field">
              <span className="mqs-lbl" id="mqs-tpl">
                Шаблон
              </span>
              <div className="mqs-tpls" role="radiogroup" aria-labelledby="mqs-tpl">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={tpl === t.id}
                    title={t.hint}
                    className={`mqs-tp${tpl === t.id ? " is-on" : ""}`}
                    onClick={() => pickTemplate(t)}
                  >
                    <t.Icon size={14} strokeWidth={2} aria-hidden="true" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mqs-name-row">
            <div className="mqt-field mqs-grow">
              <label htmlFor="mqs-name">
                Назва <b className="mqg-req">*</b>
              </label>
              <input
                id="mqs-name"
                autoComplete="off"
                maxLength={100}
                placeholder="Наприклад, Фаворити BO3"
                value={d.name}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "mqs-name-err" : undefined}
                onChange={(e) => set("name", e.target.value)}
              />
              {errors.name && (
                <span id="mqs-name-err" className="mqs-err">
                  {errors.name}
                </span>
              )}
            </div>
            <div className="mqs-field">
              <span className="mqs-lbl" id="mqs-risk">
                Ризик <small>· ваша оцінка</small>
              </span>
              <div className="mqs-seg" role="radiogroup" aria-labelledby="mqs-risk">
                {(["Low", "Medium", "High"] as const).map((r) => (
                  <button key={r} type="button" role="radio" aria-checked={d.riskLevel === r} onClick={() => set("riskLevel", r)}>
                    {RISK_LABEL[r].split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {descOpen ? (
            <div className="mqt-field">
              <label htmlFor="mqs-desc">Опис</label>
              <textarea
                id="mqs-desc"
                maxLength={2000}
                placeholder="Коротко: на що ставите і чому"
                value={d.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
          ) : (
            <button type="button" className="mqs-link mqs-tight" onClick={() => setDescOpen(true)}>
              <Plus size={14} strokeWidth={2.2} aria-hidden="true" />
              Додати опис
            </button>
          )}

          <div className="mqs-field">
            <div className="mqs-rules-head">
              <span className="mqs-lbl">Правила</span>
              <span className="mqs-legend">
                <span>
                  <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" className="is-warn" />
                  попередити
                </span>
                <span>
                  <Lock size={13} strokeWidth={2} aria-hidden="true" />
                  заблокувати запис
                </span>
              </span>
            </div>
            <div className="mqs-rows">
              {row(
                "odds",
                "Коефіцієнт",
                <>
                <input className="mqs-num" inputMode="decimal" aria-label="Коефіцієнт від" placeholder="від" value={d.min} onChange={(e) => set("min", e.target.value)} />
                <span className="mqs-unit">–</span>
                <input className="mqs-num" inputMode="decimal" aria-label="Коефіцієнт до" placeholder="до" value={d.max} onChange={(e) => set("max", e.target.value)} />
              </>,
              )}
              {row(
                "format",
                "Формат",
                <>
                {chips("formats", ["BO1", "BO3", "BO5"])}
              </>,
              )}
              {row(
                "type",
                "Тип ставки",
                <>
                {chips("types", ["Ординар", "Експрес"])}
                {d.types.includes("Експрес") && (
                  <>
                    <span className="mqs-unit">до</span>
                    <input className="mqs-num is-xs" inputMode="numeric" aria-label="Подій в експресі, до" value={d.maxEvents} onChange={(e) => set("maxEvents", e.target.value)} />
                    <span className="mqs-unit">подій</span>
                  </>
                )}
              </>,
              )}
              {row(
                "limit",
                "Ліміт на день",
                <>
                <span className="mqs-unit">до</span>
                <input className="mqs-num" inputMode="numeric" aria-label="Записів на день, до" value={d.perDay} onChange={(e) => set("perDay", e.target.value)} />
                <span className="mqs-unit">записів</span>
              </>,
              )}
              {row(
                "tilt",
                "Тільт-захист",
                <>
                <span className="mqs-unit">після</span>
                <input className="mqs-num is-xs" inputMode="numeric" aria-label="Програшів поспіль" value={d.tLoss} onChange={(e) => set("tLoss", e.target.value)} />
                <span className="mqs-unit">програшів — пауза</span>
                <input className="mqs-num is-xs" inputMode="numeric" aria-label="Пауза, хвилин" value={d.tMin} onChange={(e) => set("tMin", e.target.value)} />
                <span className="mqs-unit">хв</span>
              </>, false,
              )}
            </div>

            {d.criteria.map((c, i) => (
              <div key={i} className="mqs-crit">
                <input
                  className="mqs-input"
                  aria-label={`Свій критерій ${i + 1}`}
                  maxLength={500}
                  placeholder="Наприклад: лише команди з топ-30"
                  value={c}
                  onChange={(e) => set("criteria", d.criteria.map((x, j) => (j === i ? e.target.value : x)))}
                />
                <button
                  type="button"
                  className="mqs-del"
                  aria-label={`Видалити критерій ${i + 1}`}
                  onClick={() => set("criteria", d.criteria.filter((_, j) => j !== i))}
                >
                  <X size={16} strokeWidth={1.8} aria-hidden="true" />
                </button>
              </div>
            ))}
            <div className="mqs-crit-foot">
              <button type="button" className="mqs-link" onClick={() => set("criteria", [...d.criteria, ""])} disabled={d.criteria.length >= 10}>
                <Plus size={14} strokeWidth={2.2} aria-hidden="true" />
                Свій критерій
              </button>
              <span>Свої критерії автоматично не перевіряються.</span>
            </div>
          </div>

          <div className="mqs-backtest">
            <span className="mqs-backtest-ico">
              <BarChart3 size={15} strokeWidth={2} aria-hidden="true" />
            </span>
            {preview.all.settled ? (
              <span>
                <strong>
                  {pass.settled} з {records(preview.all.settled)}
                </strong>{" "}
                журналу пройшли б ці правила · ROI <b className={passColor}>{signedPct(pass.roi)}</b>{" "}
                <small>(усі записи {signedPct(preview.all.roi)})</small>
                <small className="mqs-backtest-note">
                  {pass.settled > 0 && pass.settled < LOW_DATA
                    ? `Менше ${LOW_DATA} записів — різниця може бути випадковою. Це погляд у минуле, не прогноз.`
                    : "Перевірка на минулих записах за коефіцієнтом, форматом і типом. Не прогноз."}
                </small>
              </span>
            ) : (
              <span>
                <strong>Перевірка на журналі</strong>
                <small className="mqs-backtest-note">З’явиться, коли в журналі будуть розраховані записи.</small>
              </span>
            )}
          </div>
          {errors.form && (
            <p className="mqs-err is-form" role="alert">
              {errors.form}
            </p>
          )}
        </form>

        <div className="mqt-dialog-foot mqs-foot">
          <label className="mqs-check">
            <input type="checkbox" checked={d.primary} onChange={(e) => set("primary", e.target.checked)} />
            Зробити основною
          </label>
          <button type="button" className="mqt-btn-outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Скасувати
          </button>
          <SwapPill
            type="submit"
            form="mqs-form"
            disabled={saving}
            label={saving ? "Зберігаємо…" : editing ? "Зберегти" : "Створити"}
            icon={<Check size={16} strokeWidth={2.2} />}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ================= Delete ================= */

export function DeleteStrategyDialog({
  strategy,
  stats,
  onOpenChange,
  onDelete,
}: {
  strategy: CS2Strategy | null;
  stats: StratStats | null;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <Dialog open={!!strategy} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton role="alertdialog" className="mqt-dialog is-narrow mqs-dialog">
        <div className="mqt-dialog-body is-delete">
          <div className="mqt-delete-top">
            <span className="mqt-delete-icon">
              <Trash2 size={22} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <CloseX light />
          </div>
          <div>
            <p className="mqt-dialog-kicker is-danger">Видалення</p>
            <DialogTitle>Видалити стратегію?</DialogTitle>
          </div>
          {strategy && (
            <div className="mqs-del-card">
              <strong>{strategy.name}</strong>
              <small>
                {RISK_LABEL[strategy.riskLevel] || "Ризик не вказано"}
                {stats ? ` · ${records(stats.records)} · ROI ${signedPct(stats.roi)}` : ""}
              </small>
            </div>
          )}
          <DialogDescription className="mqt-danger-text">
            Стратегію та її правила буде видалено назавжди. Записи в журналі залишаться, але нові записи вже не
            перевірятимуться за цими правилами.
          </DialogDescription>
        </div>
        <div className="mqt-dialog-foot">
          <DialogClose className="mqt-btn-outline">Скасувати</DialogClose>
          <button
            type="button"
            className="mqt-btn-danger"
            onClick={() => {
              onDelete();
              onOpenChange(false);
            }}
          >
            <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
            Видалити стратегію
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
