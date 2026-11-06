/**
 * Desk — a custom Hairline figure for the profile hero, drawn with the
 * hairline-create skill (source: hairline-work/desk.js) and run on the vendored
 * kernel (src/lib/hairline/kernel.js), the engine of the package's figures.
 *
 * A player's desk mat with a headset, a keyboard and a mouse. The item under
 * the pointer lifts off the mat; the others answer a little, staggered
 * outwards from it. At rest the W key is the one bright mark.
 */
import HL from "./kernel";

const {
  Cam, fit, open, poly, prism, proj, facing, ringAt, rings, rrect,
  tdone, tset, tval, tween, mk, pointer, put, register, disposer, solid,
} = HL;

const PW = 206, PD = 126;                        // the mat
const KB = { x0: 14, y0: 56, x1: 136, y1: 106, h: 7 };   // keyboard
const MS = { x0: 154, y0: 60, x1: 180, y1: 104, h: 10 }; // mouse
const HS = { a: 46, b: 118, y: 26, r: 16, h: 12, top: 52 }; // headset: cup centres on x, band apex
const ROWS = 4, COLS = 11, KW = 8.6, KG = 2.3;
const CAPTION = ["навушники", "клавіатура", "миша"];
const NUDGE = 0.22, STEP = 45;

/** Key rings on the keyboard's top, in its own grid; the last row has a space bar. */
function keyRings() {
  const keys = [], ox = KB.x0 + 5, oy = KB.y0 + 5;
  for (let r = 0; r < ROWS; r++) {
    const y0 = oy + r * (KW + KG), y1 = y0 + KW;
    if (r === ROWS - 1) {
      keys.push({ ring: rrect(ox, y0, ox + 2 * KW + KG, y1, 1.6, 3) });
      keys.push({ ring: rrect(ox + 3 * (KW + KG), y0, ox + 8 * (KW + KG) - KG, y1, 1.6, 3) });
      keys.push({ ring: rrect(ox + 9 * (KW + KG), y0, ox + COLS * (KW + KG) - KG, y1, 1.6, 3) });
      continue;
    }
    for (let c = 0; c < COLS; c++) {
      const x0 = ox + c * (KW + KG) + (r === 2 ? 2.5 : 0);
      if (x0 + KW > KB.x1 - 4) continue;
      keys.push({ ring: rrect(x0, y0, x0 + KW, y1, 1.6, 3), w: r === 1 && c === 2 });
    }
  }
  return keys;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value;
  const MAXL = 24;

  const C = Cam(45, 0.5, 1.46);
  fit(C, [
    [0, 0, -3], [PW, PD, -3], [PW, 0, -3], [0, PD, -3],
    [HS.a, HS.y, HS.top + MAXL + 2], [HS.b, HS.y, HS.top + MAXL + 2], [MS.x1, MS.y0, MS.h + MAXL],
  ], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the mat: a thin rounded slab that never moves
  const [mr, mi] = rings(0, 0, PW, PD, 9, 1.8);
  put(solid(g), prism(P, front, mr, mi, -3, 0));

  // the headset, at the back: two cups lying on the mat and the band arching over them
  const hsG = mk("g", {}, g);
  const cups = [HS.a, HS.b].map((x) => {
    const [ring, inner] = rings(x - HS.r, HS.y - HS.r, x + HS.r, HS.y + HS.r, HS.r, 1.6);
    const pad = rrect(x - HS.r + 5, HS.y - HS.r + 5, x + HS.r - 5, HS.y + HS.r - 5, HS.r - 5, 6);
    return { ring, inner, pad, el: solid(hsG), cushion: mk("path", { class: "nf lo" }, hsG) };
  });
  const bandO = mk("path", { class: "nf sil" }, hsG), bandI = mk("path", { class: "nf lo" }, hsG);
  const arc = (dy, dz, z) => {
    const pts = [];
    for (let k = 0; k <= 20; k++) {
      const t = k / 20, x = HS.a + (HS.b - HS.a) * t;
      pts.push(P(x, HS.y + dy, z + HS.h + (HS.top - HS.h + dz) * Math.sin(Math.PI * t)));
    }
    return open(pts);
  };

  // the keyboard: a low slab, its keys marked on the top, W on its own
  const kbG = mk("g", {}, g);
  const [kr, ki] = rings(KB.x0, KB.y0, KB.x1, KB.y1, 5, 1.4);
  const kbEl = solid(kbG);
  const keys = keyRings();
  const keyPath = mk("path", { class: "nf lo" }, kbG);
  const wPath = mk("path", { class: "nf hi" }, kbG);

  // the mouse: a pill with a seam between its buttons and a wheel
  const msG = mk("g", {}, g);
  const [or, oi] = rings(MS.x0, MS.y0, MS.x1, MS.y1, 13, 1.8);
  const msEl = solid(msG);
  const cx = (MS.x0 + MS.x1) / 2;
  const seam = mk("path", { class: "nf lo" }, msG);
  const wheelRing = rrect(cx - 2.6, MS.y0 + 7, cx + 2.6, MS.y0 + 16, 2.4, 3);
  const wheel = mk("path", { class: "nf" }, msG);

  const items = [0, 1, 2].map(() => ({ tw: tween(0), drawn: -1 }));

  function draw(i, l) {
    if (i === 0) {
      cups.forEach((c) => {
        put(c.el, prism(P, front, c.ring, c.inner, l, l + HS.h));
        c.cushion.setAttribute("d", poly(ringAt(P, c.pad, l + HS.h)));
      });
      bandO.setAttribute("d", arc(-3.4, 0, l) + arc(3.4, 0, l));
      bandI.setAttribute("d", arc(0, -3, l));
    } else if (i === 1) {
      const z = l + KB.h;
      put(kbEl, prism(P, front, kr, ki, l, z));
      keyPath.setAttribute("d", keys.filter((k) => !k.w).map((k) => poly(ringAt(P, k.ring, z))).join(""));
      wPath.setAttribute("d", poly(ringAt(P, keys.find((k) => k.w).ring, z)));
    } else {
      const z = l + MS.h;
      put(msEl, prism(P, front, or, oi, l, z));
      seam.setAttribute("d", open([P(cx, MS.y0 + 2, z), P(cx, MS.y0 + 6.5, z)]) + open([P(cx, MS.y0 + 16.5, z), P(cx, MS.y0 + 22, z)]));
      wheel.setAttribute("d", poly(ringAt(P, wheelRing, z + 0.6)));
    }
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    items.forEach((it, i) => {
      const l = tval(it.tw, now);
      if (l !== it.drawn) { it.drawn = l; draw(i, l); }
      if (!tdone(it.tw, now)) moving = true;
    });
    return moving;
  });
  bag.add(B.unregister);

  // hit test: each item's REST centre on screen, which never moves (rule 01)
  const centres = [P((HS.a + HS.b) / 2, HS.y, HS.top / 2), P((KB.x0 + KB.x1) / 2, (KB.y0 + KB.y1) / 2, KB.h), P(cx, (MS.y0 + MS.y1) / 2, MS.h)];
  const REACH = [70, 80, 44];
  function hit([x, y]) {
    let best = -1, bd = Infinity;
    centres.forEach(([sx, sy], i) => {
      const d = Math.hypot(x - sx, (y - sy) * 1.4);
      if (d < REACH[i] && d < bd) { bd = d; best = i; }
    });
    return best;
  }

  let act = -1;
  function apply(a, now, staggered) {
    const from = a >= 0 ? a : act < 0 ? 0 : act;
    items.forEach((it, i) => {
      const to = a < 0 ? 0 : i === a ? lift : lift * NUDGE;
      tset(it.tw, to, now, staggered ? Math.abs(i - from) * STEP : 0);
    });
    cups.forEach((c) => c.el.sil.classList.toggle("hi", a === 0));
    bandO.classList.toggle("hi", a === 0);
    kbEl.sil.classList.toggle("hi", a === 1);
    wPath.classList.toggle("hi", a < 0 || a === 1);
    msEl.sil.classList.toggle("hi", a === 2);
    wheel.classList.toggle("hi", a === 2);
    read.textContent = a < 0 ? "rest" : CAPTION[a];
    B.wake();
  }
  function setActive(a) {
    if (a === act) return;
    const prev = act;
    act = a;
    if (a < 0) act = prev; // let go: the stagger spreads from the item left
    apply(a, performance.now(), true);
    act = a;
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { lift = v; if (act >= 0) apply(act, performance.now(), false); },
    destroy: bag.dispose,
  };
}


export const desk = {
  name: "desk",
  means:
    "A headset, a keyboard and a mouse on a desk mat; the one under the pointer lifts and the others answer.",
  rules: [1, 2, 4, 5, 9],
  range: [8, 14, 22],
  tour: [[150, 120], [170, 190], [270, 170], null],
  mount,
};
