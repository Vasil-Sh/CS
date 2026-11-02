/**
 * Pure helpers for the Strategies screen: normalised rules, checking journal
 * records against them, per-strategy stats and chart series.
 * No React here — shared by the screen, the create/edit dialog and the
 * betting form.
 */
import type { ActionMode, CS2Strategy } from "@/types/strategy";
import type { Bet } from "@/types/betting";
import { parseCriteriaForValidation } from "@/lib/strategyHelpers";

export type Mode = ActionMode | "manual";

export interface StrategyRules {
  odds?: { min?: number; max?: number; mode: ActionMode };
  formats?: { list: string[]; mode: ActionMode };
  types?: { list: string[]; maxEvents?: number; mode: ActionMode };
  limit?: { perDay: number; mode: ActionMode };
  tilt?: { losses: number; minutes: number };
  custom: string[];
}

const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined;

/** Rules of a strategy in one shape, whatever form saved it. */
export function rulesOf(s: CS2Strategy): StrategyRules {
  const v2 = s.rulesVersion === 2;
  const mode = (m?: ActionMode): ActionMode => (v2 && m === "block" ? "block" : "warn");
  const r: StrategyRules = { custom: [] };

  const oc = s.oddsControl;
  const min = v2 ? num(oc?.minOdds) : num(s.minOdds ?? oc?.minOdds);
  const max = v2 ? num(oc?.maxOdds) : num(s.maxOdds ?? oc?.maxOdds);
  if ((!v2 || oc?.enabled) && (min || max)) r.odds = { min, max, mode: mode(oc?.actionMode) };

  const fl = (v2 ? s.matchFormatRules?.allowedFormats : s.allowedFormats ?? s.matchFormatRules?.allowedFormats) || [];
  if ((!v2 || s.matchFormatRules?.enabled) && fl.length)
    r.formats = { list: fl, mode: mode(s.matchFormatRules?.actionMode) };

  const tl = (v2 ? s.betTypeRules?.allowedTypes : s.allowedBetTypes ?? s.betTypeRules?.allowedTypes) || [];
  if ((!v2 || s.betTypeRules?.enabled) && tl.length)
    r.types = {
      list: tl,
      maxEvents: v2 ? num(s.betTypeRules?.maxEventsInExpress) : undefined,
      mode: mode(s.betTypeRules?.actionMode),
    };

  if (s.dailyLimit?.enabled && num(s.dailyLimit.maxBetsPerDay))
    r.limit = { perDay: s.dailyLimit.maxBetsPerDay!, mode: mode(s.dailyLimit.actionMode) };

  const al = s.activityLimits;
  if (al?.enabled)
    r.tilt = { losses: num(al.blockAfterLosses) ?? 3, minutes: num(al.blockDurationMinutes) ?? 60 };

  const crit = v2 ? s.customRules ?? s.criteria ?? [] : s.criteria ?? [];
  // Old strategies kept odds/format/type as free-text criteria: those are rules
  // already, only the rest are the user's own notes.
  r.custom = crit
    .filter((c) => typeof c === "string" && c.trim())
    .filter((c) => v2 || Object.keys(parseCriteriaForValidation([c])).length === 0);
  return r;
}

export const activeRuleCount = (r: StrategyRules) =>
  [r.odds, r.formats, r.types, r.limit, r.tilt].filter(Boolean).length;

/* ---------- Records ---------- */

export const isSettled = (b: Bet) => b.result === "Win" || b.result === "Loss";
export const isExpress = (b: Pick<Bet, "betType">) => /^\s*експрес/i.test(b.betType || "");
export const betKind = (b: Pick<Bet, "betType">) => (isExpress(b) ? "Експрес" : "Ординар");
export const betTime = (b: Bet) => {
  const c = b.createdAt ? Date.parse(b.createdAt) : NaN;
  if (Number.isFinite(c)) return c;
  const d = Date.parse(b.date);
  return Number.isFinite(d) ? d : 0;
};
const dayKey = (b: Bet) => {
  const t = betTime(b);
  if (!t) return b.date?.slice(0, 10) || "";
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
/** Odds of each event of an express, parsed from "… @1.45 • … @1.6". */
export const expressOdds = (b: Pick<Bet, "betType">) =>
  [...(b.betType || "").matchAll(/@\s*(\d+(?:[.,]\d+)?)/g)].map((m) => parseFloat(m[1].replace(",", ".")));
export const expressSize = (b: Pick<Bet, "betType">) => {
  const m = (b.betType || "").match(/експрес\s*(\d+)\s*x/i);
  return m ? parseInt(m[1], 10) : expressOdds(b).length;
};

export type ViolationCode = "oddsLow" | "oddsHigh" | "format" | "type" | "events" | "limit";

export interface RuleCheckInput {
  kind: "Ординар" | "Експрес";
  odds: number[];
  format?: string;
  events?: number;
}

/** Rules a single record breaks (daily limit is checked separately). */
export function checkRecord(r: StrategyRules, x: RuleCheckInput): ViolationCode[] {
  const out: ViolationCode[] = [];
  if (r.odds) {
    if (r.odds.min && x.odds.some((o) => o > 0 && o < r.odds!.min!)) out.push("oddsLow");
    if (r.odds.max && x.odds.some((o) => o > r.odds!.max!)) out.push("oddsHigh");
  }
  if (r.formats && x.format && !r.formats.list.includes(x.format)) out.push("format");
  if (r.types) {
    if (!r.types.list.includes(x.kind)) out.push("type");
    else if (x.kind === "Експрес" && r.types.maxEvents && (x.events ?? 0) > r.types.maxEvents) out.push("events");
  }
  return out;
}

export const recordInput = (b: Bet): RuleCheckInput => {
  const ex = isExpress(b);
  const evOdds = ex ? expressOdds(b) : [];
  return {
    kind: ex ? "Експрес" : "Ординар",
    odds: ex ? evOdds : [b.odds],
    format: b.format || undefined,
    events: ex ? expressSize(b) : undefined,
  };
};

export const odds2 = (n: number) => n.toFixed(2).replace(".", ",");

export function violationLabel(code: ViolationCode, r: StrategyRules): string {
  switch (code) {
    case "oddsLow":
      return `Коефіцієнт нижче ${odds2(r.odds?.min ?? 0)}`;
    case "oddsHigh":
      return `Коефіцієнт вище ${odds2(r.odds?.max ?? 0)}`;
    case "format":
      return "Формат поза дозволеними";
    case "type":
      return "Тип ставки поза дозволеними";
    case "events":
      return `Більше ${r.types?.maxEvents} подій в експресі`;
    case "limit":
      return `Понад ${r.limit?.perDay} записів на день`;
  }
}

export interface Compliance {
  total: number;
  ok: number;
  top: { label: string; n: number }[];
}

/** How many of a strategy's records stayed inside its rules. */
export function compliance(r: StrategyRules, records: Bet[]): Compliance {
  const counts = new Map<ViolationCode, number>();
  const bad = new Set<Bet>();
  const add = (b: Bet, c: ViolationCode) => {
    counts.set(c, (counts.get(c) || 0) + 1);
    bad.add(b);
  };
  for (const b of records) for (const c of checkRecord(r, recordInput(b))) add(b, c);
  if (r.limit) {
    const byDay = new Map<string, Bet[]>();
    for (const b of records) {
      const k = dayKey(b);
      byDay.set(k, [...(byDay.get(k) || []), b]);
    }
    for (const list of byDay.values())
      list
        .sort((a, b) => betTime(a) - betTime(b))
        .slice(r.limit.perDay)
        .forEach((b) => add(b, "limit"));
  }
  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c, n]) => ({ label: violationLabel(c, r), n }));
  return { total: records.length, ok: records.length - bad.size, top };
}

/* ---------- Stats ---------- */

export interface StratStats {
  records: number;
  settled: number;
  wins: number;
  losses: number;
  pending: number;
  stake: number;
  profit: number;
  roi: number | null;
  winRate: number | null;
}

const stakeOf = (b: Bet) => b.amount || 0;

export function statsOf(records: Bet[]): StratStats {
  const settled = records.filter(isSettled);
  const wins = settled.filter((b) => b.result === "Win").length;
  const stake = settled.reduce((a, b) => a + stakeOf(b), 0);
  const profit = settled.reduce((a, b) => a + (b.profit || 0), 0);
  return {
    records: records.length,
    settled: settled.length,
    wins,
    losses: settled.length - wins,
    pending: records.length - settled.length,
    stake,
    profit,
    roi: stake > 0 ? (profit / stake) * 100 : null,
    winRate: settled.length ? (wins / settled.length) * 100 : null,
  };
}

/** Cumulative profit and running ROI over settled records, oldest first. */
export function seriesOf(records: Bet[]) {
  const settled = records.filter(isSettled).sort((a, b) => betTime(a) - betTime(b));
  const profit: number[] = [0];
  const roi: number[] = [0];
  let p = 0,
    s = 0;
  for (const b of settled) {
    p += b.profit || 0;
    s += stakeOf(b);
    profit.push(p);
    roi.push(s > 0 ? (p / s) * 100 : 0);
  }
  return { profit, roi };
}

/** SVG path for a series, with the zero line's y. */
export function sparkPath(vals: number[], w: number, h: number, pad = 4) {
  if (vals.length < 2) return { line: "", area: "", zeroY: h / 2 };
  const mn = Math.min(0, ...vals),
    mx = Math.max(0, ...vals);
  const span = mx - mn || 1;
  const X = (i: number) => (i / (vals.length - 1)) * w;
  const Y = (v: number) => pad + ((mx - v) / span) * (h - pad * 2);
  const line = vals.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
  const zeroY = Y(0);
  return { line, area: `${line} L${w} ${zeroY.toFixed(1)} L0 ${zeroY.toFixed(1)} Z`, zeroY };
}

export type Period = "all" | "month" | "30" | "7";
export const PERIODS: [Period, string][] = [
  ["all", "Увесь час"],
  ["month", "Цей місяць"],
  ["30", "30 днів"],
  ["7", "7 днів"],
];
export function inPeriod(b: Bet, p: Period, now = Date.now()) {
  if (p === "all") return true;
  const t = betTime(b);
  if (p === "month") {
    const d = new Date(now);
    return t >= new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  }
  return t >= now - Number(p) * 86400000;
}

/** Records made with a strategy (matched by name, as the journal stores it). */
export const recordsOf = (s: CS2Strategy, bets: Bet[]) =>
  bets.filter((b) => (b.strategy || "").trim() === s.name.trim());
export const recordsWithout = (bets: Bet[]) => bets.filter((b) => !(b.strategy || "").trim());

export const LOW_DATA = 20;

/* ---------- Formatting ---------- */
const nf = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 });
export const uah = (n: number) => `${nf.format(Math.round(Math.abs(n)))} ₴`;
export const signedUah = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${uah(n)}`;
export const pct1 = (n: number) => `${Math.abs(n).toFixed(1).replace(".", ",")}%`;
export const signedPct = (n: number | null) =>
  n == null ? "—" : `${n > 0 ? "+" : n < 0 ? "−" : ""}${pct1(n)}`;
export function plural(n: number, one: string, few: string, many: string) {
  const a = n % 10,
    b = n % 100;
  return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
}
export const records = (n: number) => `${n} ${plural(n, "запис", "записи", "записів")}`;

export const RISK_LABEL: Record<CS2Strategy["riskLevel"], string> = {
  Low: "Низький ризик",
  Medium: "Середній ризик",
  High: "Високий ризик",
};
export const RISK_LEVEL: Record<CS2Strategy["riskLevel"], number> = { Low: 1, Medium: 2, High: 3 };
