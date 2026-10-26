import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  ChartNoAxesCombined,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { useLandingReducedMotion } from "./LandingExperience";

const highlights = [
  {
    label: "01 / ЖУРНАЛ РІШЕНЬ",
    title: "Кожна ставка. З контекстом.",
    icon: ListChecks,
    href: "#how-it-works",
  },
  {
    label: "02 / ОСОБИСТА АНАЛІТИКА",
    title: "Знайди свої закономірності.",
    icon: ChartNoAxesCombined,
    href: "#features",
  },
  {
    label: "03 / ВЛАСНІ ПРАВИЛА",
    title: "Дисципліна перед рішенням.",
    icon: ShieldCheck,
    href: "#discipline",
  },
];

export function HeroSpotlight() {
  const [active, setActive] = useState(0);
  const reduced = useLandingReducedMotion();
  const item = highlights[active];
  const Icon = item.icon;
  return (
    <aside className="ls-spotlight" aria-label="Коротко про можливості">
      <div className="ls-spotlight-icon" aria-hidden="true">
        <Icon size={30} strokeWidth={1.3} />
      </div>
      <div className="ls-spotlight-body">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={
              reduced ? false : { opacity: 0, transform: "translateY(6px)" }
            }
            animate={{ opacity: 1, transform: "translateY(0)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.18 }}
            aria-live="polite"
          >
            <small>{item.label}</small>
            <a href={item.href}>{item.title}</a>
          </motion.div>
        </AnimatePresence>
        <div className="ls-spotlight-controls">
          <span aria-hidden="true">
            {highlights.map((_, i) => (
              <i key={i} className={i === active ? "is-active" : ""} />
            ))}
          </span>
          <button
            type="button"
            aria-label="Попередня можливість"
            onClick={() => setActive((active + 2) % 3)}
          >
            <ArrowLeft size={14} />
          </button>
          <button
            type="button"
            aria-label="Наступна можливість"
            onClick={() => setActive((active + 1) % 3)}
          >
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function StudioIntro() {
  const reduced = useLandingReducedMotion();
  return (
    <section className="ls-intro lp-section" aria-labelledby="ls-intro-title">
      <div className="ls-intro-top">
        <p className="lp-eyebrow">
          <span className="lp-signal" /> ЦЕ MATCHIQ
        </p>
        <span>CS2 · DOTA 2 · ТВОЇ ДАНІ</span>
      </div>
      <motion.h2
        id="ls-intro-title"
        initial={
          reduced ? false : { opacity: 0, transform: "translateY(20px)" }
        }
        whileInView={{ opacity: 1, transform: "translateY(0)" }}
        viewport={{ once: true }}
        transition={{ duration: reduced ? 0 : 0.6 }}
      >
        Матч закінчується.
        <br />
        <span>Твоя історія — ні.</span>
      </motion.h2>
      <div className="ls-intro-bottom">
        <a
          href="#possibilities"
          className="ls-round-link"
          aria-label="Перейти до інструментів"
        >
          <ArrowDown size={24} />
        </a>
        <p>
          Не просто список виграшів і програшів. Простір, де кожен запис
          зберігає твої аргументи, аналітика показує закономірності, а правила
          допомагають тримати власний курс.
        </p>
      </div>
      <div className="ls-principles">
        {[
          ["01", "Контекст", "Сума, коефіцієнт, стратегія та причина рішення."],
          [
            "02",
            "Ясність",
            "Банкрол, результати й порівняння на основі твоїх записів.",
          ],
          [
            "03",
            "Контроль",
            "Власні правила, цілі та застереження перед наступним кроком.",
          ],
        ].map(([n, title, text]) => (
          <div key={n}>
            <span>{n}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
