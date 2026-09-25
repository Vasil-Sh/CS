import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Download,
  FileJson,
  Pause,
  Play,
  ShieldCheck,
} from "lucide-react";

const MotionContext = createContext(false);
export function useLandingReducedMotion() {
  return useContext(MotionContext);
}
export function LandingMotion({ children }: { children: ReactNode }) {
  const systemReduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const reduced = Boolean(systemReduced || paused);
  return (
    <MotionContext.Provider value={reduced}>
      <MotionConfig reducedMotion={reduced ? "always" : "never"}>
        <div className={reduced ? "lp-motion-off" : "lp-motion-on"}>
          {children}
          <button
            className="lp-motion-toggle"
            type="button"
            aria-pressed={reduced}
            disabled={Boolean(systemReduced)}
            onClick={() => setPaused(!paused)}
            aria-label={
              systemReduced
                ? "Рух вимкнено налаштуваннями пристрою"
                : paused
                  ? "Увімкнути анімації"
                  : "Зупинити анімації"
            }
          >
            {reduced ? <Play size={14} /> : <Pause size={14} />}
            <span>{reduced ? "Рух вимкнено" : "Зупинити рух"}</span>
          </button>
        </div>
      </MotionConfig>
    </MotionContext.Provider>
  );
}

export function ArenaImage() {
  const reduced = useLandingReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 850], [0, 130]);
  const opacity = useTransform(scrollY, [0, 850], [1, 0.25]);
  return (
    <motion.div
      className="lp-arena-window"
      style={reduced ? undefined : { y, opacity }}
    >
      <img
        className="lp-hero-image"
        src="/assets/landing-arena.png"
        alt=""
        fetchPriority="high"
        width="1672"
        height="941"
      />
      <div className="lp-arena-light" aria-hidden="true" />
    </motion.div>
  );
}

export function HeroTitle() {
  const reduced = useLandingReducedMotion();
  return (
    <h1 id="hero-title">
      <span className="lp-title-mask">
        <motion.span
          initial={reduced ? false : { y: "110%", rotate: 3 }}
          animate={{ y: 0, rotate: 0 }}
          transition={{
            duration: reduced ? 0 : 0.95,
            ease: [0.22, 1, 0.36, 1],
            delay: reduced ? 0 : 0.1,
          }}
        >
          Гра має емоції.
        </motion.span>
      </span>
      <span className="lp-title-mask">
        <motion.span
          initial={reduced ? false : { y: "110%", rotate: 3 }}
          animate={{ y: 0, rotate: 0 }}
          transition={{
            duration: reduced ? 0 : 0.95,
            ease: [0.22, 1, 0.36, 1],
            delay: reduced ? 0 : 0.24,
          }}
        >
          Рішення — <em>цифри.</em>
        </motion.span>
      </span>
    </h1>
  );
}

export function useJourneyScroll(onStep: (step: number) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useLandingReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (
      !reduced &&
      window.matchMedia("(min-width: 1051px)").matches &&
      progress > 0 &&
      progress < 1
    )
      onStep(Math.min(3, Math.floor(progress * 4)));
  });
  return ref;
}

export function AnimatedNumber({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const reduced = useLandingReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true });
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (reduced || !visible) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    let start: number | undefined;
    const tick = (now: number) => {
      start ??= now;
      const t = Math.min(1, (now - start) / 850);
      setDisplay(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, visible, reduced]);
  return (
    <span ref={ref} aria-label={`${value}${suffix}`}>
      <span aria-hidden="true">
        {display.toLocaleString("uk-UA")}
        {suffix}
      </span>
    </span>
  );
}

export function AnimatedFAQ({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  const [open, setOpen] = useState<number | null>(0);
  const reduced = useLandingReducedMotion();
  return (
    <div className="lp-faq-list">
      {items.map((item, index) => (
        <div className="lp-faq-item" key={item.question}>
          <h3>
            <button
              type="button"
              id={`lp-faq-trigger-${index}`}
              aria-expanded={open === index}
              aria-controls={`lp-faq-panel-${index}`}
              onClick={() => setOpen(open === index ? null : index)}
            >
              {item.question}
              <motion.span
                aria-hidden="true"
                animate={{ rotate: open === index ? 45 : 0 }}
                transition={{ duration: reduced ? 0 : 0.25 }}
              >
                +
              </motion.span>
            </button>
          </h3>
          <motion.div
            id={`lp-faq-panel-${index}`}
            role="region"
            aria-labelledby={`lp-faq-trigger-${index}`}
            aria-hidden={open !== index}
            initial={false}
            animate={{
              height: open === index ? "auto" : 0,
              opacity: open === index ? 1 : 0,
            }}
            transition={{
              duration: reduced ? 0 : 0.32,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="lp-faq-answer"
          >
            <p>{item.answer}</p>
          </motion.div>
        </div>
      ))}
    </div>
  );
}

export function StrategyCheck() {
  const [odds, setOdds] = useState(1.8);
  const reduced = useLandingReducedMotion();
  const valid = odds >= 1.4 && odds <= 1.7;
  return (
    <div className="lp-rule-demo">
      <label htmlFor="lp-rule-odds">
        Перевір правило на прикладі <span>Демо-дані</span>
      </label>
      <div className="lp-rule-slider">
        <input
          id="lp-rule-odds"
          type="range"
          min="1.2"
          max="2"
          step="0.05"
          value={odds}
          onChange={(e) => setOdds(Number(e.target.value))}
        />
        <output htmlFor="lp-rule-odds">{odds.toFixed(2)}</output>
      </div>
      <motion.div
        className={`lp-warning-block ${valid ? "lp-rule-valid" : ""}`}
        layout
        transition={{ duration: reduced ? 0 : 0.3 }}
      >
        <span className="lp-warning-icon">
          {valid ? <Check size={18} /> : "!"}
        </span>
        <div aria-live="polite">
          <span className="lp-small-label">ПРАВИЛО СТРАТЕГІЇ</span>
          <h3>
            {valid
              ? "Коефіцієнт відповідає правилу"
              : "Коефіцієнт за межами діапазону"}
          </h3>
          <p>Твій діапазон: 1.40–1.70</p>
        </div>
      </motion.div>
    </div>
  );
}

const featureCopy = [
  {
    label: "Матчі",
    kicker: "КОНТЕКСТ ПЕРЕД РІШЕННЯМ",
    title: "Від розкладу —\nдо власного запису.",
    body: "CS2 та Dota 2 в одному місці. Знайди матч за грою, турніром або статусом і перенеси його у форму ставки.",
    points: [
      "Розклад, рахунки та формати матчів",
      "Фільтри й пошук потрібної зустрічі",
      "Вибір кількох матчів для експресу",
    ],
  },
  {
    label: "Записи",
    kicker: "ПАМ’ЯТЬ ПРО КОЖНЕ РІШЕННЯ",
    title: "Більше, ніж\nвиграш або програш.",
    body: "Зберігай суму, коефіцієнт, стратегію та власні аргументи. Повернись до запису й зрозумій, чому саме ти так вирішив.",
    points: [
      "Ординарні та експрес-ставки",
      "UAH і USD з конвертацією",
      "Нотатки, прив’язка до стратегії та цілі",
    ],
  },
  {
    label: "Розрахунки",
    kicker: "ЗРОЗУМІЛА МАТЕМАТИКА",
    title: "Перевір припущення.\nПобач різницю.",
    body: "EV зіставляє твою оцінку ймовірності з коефіцієнтом. Зміни оцінку в прикладі та подивись, як зміниться очікуване значення.",
    points: [
      "Value Bet — порівняння ймовірностей",
      "EV — очікуваний результат за припущенням",
      "Критерій Келлі — розрахунок частки банкролу",
    ],
  },
];

function FeatureScene({ active }: { active: number }) {
  const [game, setGame] = useState("CS2");
  const [category, setCategory] = useState("Ординар");
  const [probability, setProbability] = useState(55);
  const reduced = useLandingReducedMotion();
  const ev = ((probability / 100) * 1.8 - 1) * 100;
  return (
    <div className="lp-feature-scene">
      <div className="lp-preview-top">
        <span>MatchIQ / {featureCopy[active].label}</span>
        <span className="lp-demo-label">Демо-дані</span>
      </div>
      <div className="lp-feature-scene-body">
        {active === 0 && (
          <>
            <div className="lp-segmented" aria-label="Гра в демонстрації">
              {["CS2", "Dota 2"].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={game === value}
                  onClick={() => setGame(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <h3>
              Наступні матчі <span>03</span>
            </h3>
            <div className="lp-demo-match-list">
              {(game === "CS2"
                ? [
                    ["NAVI", "Team Spirit", "BO3"],
                    ["Vitality", "G2", "BO3"],
                    ["FaZe", "MOUZ", "BO5"],
                  ]
                : [
                    ["Team Liquid", "Tundra", "BO3"],
                    ["Team Spirit", "Falcons", "BO3"],
                    ["BetBoom", "Aurora", "BO5"],
                  ]
              ).map((row, i) => (
                <motion.div
                  key={game + row[0]}
                  initial={reduced ? false : { opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: reduced ? 0 : 0.35,
                    delay: reduced ? 0 : i * 0.09,
                  }}
                >
                  <span>
                    {16 + i}:00<small>{row[2]}</small>
                  </span>
                  <strong>
                    {row[0]}
                    <small>vs {row[1]}</small>
                  </strong>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </motion.div>
              ))}
            </div>
            <p className="lp-scene-hint">
              Перемкни гру, щоб дослідити приклад.
            </p>
          </>
        )}
        {active === 1 && (
          <>
            <div
              className="lp-segmented"
              aria-label="Тип демонстраційної ставки"
            >
              {["Ординар", "Експрес"].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={category === value}
                  onClick={() => setCategory(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="lp-ticket">
              <span className="lp-small-label">
                МІЙ ЗАПИС / {category.toUpperCase()}
              </span>
              <h3>NAVI — Team Spirit</h3>
              {category === "Експрес" && (
                <motion.p
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  + Vitality — G2
                </motion.p>
              )}
              <div className="lp-ticket-values">
                <div>
                  <small>Сума</small>
                  <strong>500 ₴</strong>
                </div>
                <div>
                  <small>Коефіцієнт</small>
                  <strong>{category === "Експрес" ? "2.70" : "1.80"}</strong>
                </div>
              </div>
              <p>
                <ShieldCheck size={15} /> Основна стратегія
              </p>
              <blockquote>
                «Перед записом перевірив формат матчу та власні правила.»
              </blockquote>
            </div>
          </>
        )}
        {active === 2 && (
          <>
            <label className="lp-probability-label" htmlFor="lp-probability">
              Твоя оцінка ймовірності{" "}
              <output htmlFor="lp-probability">{probability}%</output>
            </label>
            <input
              id="lp-probability"
              type="range"
              min="30"
              max="75"
              step="1"
              value={probability}
              onChange={(e) => setProbability(Number(e.target.value))}
            />
            <div className="lp-probability-scale">
              <span>30%</span>
              <span>Коефіцієнт 1.80</span>
              <span>75%</span>
            </div>
            <div className="lp-ev-result" aria-live="polite">
              <small>Очікуване значення / EV</small>
              <strong className={ev >= 0 ? "lp-positive" : "lp-negative"}>
                {ev >= 0 ? "+" : ""}
                {ev.toFixed(1)}%
              </strong>
              <span>
                {ev > 0
                  ? "Позитивне за цієї оцінки ймовірності"
                  : "Непозитивне за цієї оцінки ймовірності"}
              </span>
            </div>
            <p className="lp-scene-hint">
              EV = ймовірність × коефіцієнт − 1.
              <br />
              Це модель, а не прогноз виграшу. Помилка в оцінці змінює
              результат.
            </p>
          </>
        )}
      </div>
      <div className="lp-preview-bottom">
        <span>Ілюстрація можливостей продукту</span>
        <span>0{active + 1} / 03</span>
      </div>
    </div>
  );
}

export function ProductExplorer() {
  const [active, setActive] = useState(0);
  const reduced = useLandingReducedMotion();
  const feature = featureCopy[active];
  return (
    <section
      className="lp-section lp-explorer"
      id="possibilities"
      aria-labelledby="lp-explorer-title"
    >
      <div className="lp-explorer-heading">
        <div>
          <p className="lp-eyebrow">02 / ІНСТРУМЕНТИ ДЛЯ ТВОЄЇ ГРИ</p>
          <h2 id="lp-explorer-title">
            Кожна деталь
            <br />
            має значення.
          </h2>
        </div>
        <p>
          Від першого погляду на матч
          <br />
          до останньої нотатки в історії.
        </p>
      </div>
      <div className="lp-feature-tabs" aria-label="Дослідити можливості">
        {featureCopy.map((f, i) => (
          <button
            key={f.label}
            type="button"
            aria-pressed={active === i}
            onClick={() => setActive(i)}
          >
            <span>0{i + 1}</span>
            {f.label}
            <ArrowUpRight size={19} />
            {active === i && (
              <motion.i
                layoutId="lp-feature-tab-line"
                transition={{ duration: reduced ? 0 : 0.3 }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="lp-explorer-grid">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            className="lp-feature-copy"
            initial={reduced ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -8 }}
            transition={{ duration: reduced ? 0 : 0.22 }}
          >
            <p className="lp-eyebrow">{feature.kicker}</p>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
            <ul>
              {feature.points.map((point) => (
                <li key={point}>
                  <Check size={15} />
                  {point}
                </li>
              ))}
            </ul>
            {active === 2 && (
              <p className="lp-feature-footnote">
                AI-рекомендації додають аргументи й оцінку ризику. Вони можуть
                помилятися та не гарантують результату.
              </p>
            )}
          </motion.div>
        </AnimatePresence>
        <FeatureScene active={active} />
      </div>
    </section>
  );
}

export function DataOwnership() {
  const reduced = useLandingReducedMotion();
  return (
    <section
      className="lp-section lp-data-ownership"
      aria-labelledby="lp-data-title"
    >
      <div>
        <p className="lp-eyebrow">05 / ТВОЯ ІСТОРІЯ ЗАЛИШАЄТЬСЯ З ТОБОЮ</p>
        <h2 id="lp-data-title">
          Дані, до яких
          <br />
          можна повернутись.
        </h2>
        <p>
          Працюй із записами у MatchIQ або експортуй їх для власного аналізу.
          Збережи резервну копію, щоб мати історію під рукою.
        </p>
      </div>
      <div className="lp-export-illustration">
        <div className="lp-export-source">
          <span className="lp-brand">
            Match<span>IQ</span>
          </span>
          <small>ТВОЇ ЗАПИСИ</small>
        </div>
        <div className="lp-export-connector" aria-hidden="true">
          <motion.span
            initial={reduced ? false : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: reduced ? 0 : 0.8 }}
          />
          <ArrowDown size={19} />
        </div>
        <div className="lp-export-files">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: -15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: reduced ? 0 : 0.6 }}
          >
            <Download />
            <strong>CSV</strong>
            <p>
              Ставки для роботи
              <br />з таблицями
            </p>
          </motion.div>
          <motion.div
            initial={reduced ? false : { opacity: 0, y: -15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: reduced ? 0 : 0.6,
              delay: reduced ? 0 : 0.15,
            }}
          >
            <FileJson />
            <strong>JSON</strong>
            <p>
              Резервна копія
              <br />
              твоїх даних
            </p>
          </motion.div>
        </div>
        <span className="lp-export-caption">
          Експорт доступний у профілі застосунку
        </span>
      </div>
    </section>
  );
}
