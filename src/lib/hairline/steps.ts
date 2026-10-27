/**
 * Steps — a custom Hairline figure for the "small steps, full picture" landing
 * block. It is written against the vendored kernel (src/lib/hairline/kernel.js),
 * the same engine the thirty-three package figures run on.
 *
 * Four isometric slabs step up from a match to a conclusion, each slab one
 * record. The pointer picks a step; it lifts and brightens, its neighbours
 * rising less in turn, staggered outwards from it. At rest the staircase
 * already ascends, the top step bright — the full picture.
 */
import HL from "./kernel";

export const stepsName = "steps";
export const stepsMeans =
  "Four steps ascend from a match to a conclusion; the one under the pointer lifts and brightens.";
export const stepsRules = [1, 2, 3, 5, 9];
export const stepsRange = [8, 14, 20] as const;
export const stepsTour: ([number, number] | null)[] = [
  [90, 180],
  [150, 160],
  [210, 140],
  [270, 120],
  null,
];

export type HairlineRead = {
  textContent: string | null;
};
export type HairlineMountContext = {
  stage: HTMLElement;
  svg: SVGElement;
  read: HairlineRead;
};
export type HairlineFigureHandle = {
  set(value: number): void;
  destroy(): void;
};

const {
  Cam,
  clamp,
  facing,
  fit,
  prism,
  proj,
  rings,
  tdone,
  tset,
  tval,
  tween,
  mk,
  pointer,
  put,
  register,
  disposer,
  solid,
} = HL;

const N = 4,
  W = 52,
  D = 46,
  H = 16,
  R = 7,
  GX = 60,
  RISE = 34,
  MAXL = 16;
const Y0 = -23,
  Y1 = Y0 + D;
const XE = (N - 1) * GX + W;
const CAPTION = [
  "12 000 \u20B4",
  "500 \u20B4",
  "\u2212500 \u20B4",
  "11 500 \u20B4",
];

type Step = {
  i: number;
  x0: number;
  z0: number;
  ring: unknown;
  inner: unknown;
  el: { g: Element; sil: Element; cr: Element };
  tw: unknown;
  drawn: number;
};

export function stepsMount(
  { stage, svg, read }: HairlineMountContext,
  value: number,
): HairlineFigureHandle {
  const bag = disposer();
  let lift = value;

  const C = Cam(45, 0.5, 1.65);
  fit(
    C,
    [
      [0, Y0, 0],
      [XE, Y0, 0],
      [0, Y1, 0],
      [XE, Y1, 0],
      [0, Y0, (N - 1) * RISE + H + MAXL],
      [XE, Y1, (N - 1) * RISE + H + MAXL],
    ],
    200,
    166,
  );
  const P = proj(C),
    front = facing(C);

  const g = mk("g", {}, svg);

  // the four steps, back to front
  const steps: Step[] = [];
  for (let i = 0; i < N; i++) {
    const x0 = i * GX,
      z0 = i * RISE;
    const [ring, inner] = rings(x0, Y0, x0 + W, Y1, R, 1.4);
    steps.push({
      i,
      x0,
      z0,
      ring,
      inner,
      el: solid(g),
      tw: tween(0),
      drawn: -1,
    });
  }

  // hit test: a single row, the rest-top centre's screen x (rule 01)
  const centre = (s: Step) => P(s.x0 + W / 2, (Y0 + Y1) / 2, s.z0 + H)[0];
  const centres = steps.map(centre);

  const B = register(stage, (_dt: number, now: number) => {
    let moving = false;
    for (const s of steps) {
      const l = tval(s.tw, now);
      if (l !== s.drawn) {
        s.drawn = l;
        put(s.el, prism(P, front, s.ring, s.inner, s.z0, s.z0 + H + l));
      }
      if (!tdone(s.tw, now)) moving = true;
    }
    return moving;
  });
  bag.add(B.unregister);

  let act = -1;
  const targets = (a: number) =>
    steps.map((s) =>
      a < 0
        ? 0
        : s.i === a
          ? lift
          : clamp(lift * (1 - Math.abs(s.i - a) * 0.45), 0, lift),
    );

  function apply(a: number, now: number, staggered: boolean) {
    const from = a >= 0 ? a : act;
    const tg = targets(a);
    steps.forEach((s, i) => {
      tset(s.tw, tg[i], now, staggered ? Math.abs(s.i - from) * 60 : 0);
      s.el.sil.classList.toggle("hi", a < 0 ? s.i === N - 1 : s.i === a);
    });
    read.textContent = a < 0 ? "rest" : CAPTION[a];
    B.wake();
  }

  function setActive(a: number) {
    if (a === act) return;
    act = a;
    apply(a, performance.now(), true);
  }

  bag.add(
    pointer(stage, {
      move: (p: number[]) => {
        let best = 0,
          bd = Infinity;
        for (let i = 0; i < N; i++) {
          const d = Math.abs(p[0] - centres[i]);
          if (d < bd) {
            bd = d;
            best = i;
          }
        }
        setActive(best);
      },
      leave: () => setActive(-1),
    }),
  );
  bag.add(() => svg.replaceChildren());

  return {
    set: (v: number) => {
      lift = v;
      if (act >= 0) apply(act, performance.now(), false);
    },
    destroy: bag.dispose,
  };
}
