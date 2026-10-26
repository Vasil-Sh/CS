import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { Terrain, Drawer, Loupe } from "@lucasmarkes/hairline/react";
import { MotionConfig, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronDown,
  Download,
  FileJson,
  Menu,
  Pause,
  Play,
  ShieldCheck,
  X,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import {
  FAQStructuredData,
  OrganizationStructuredData,
  WebAppStructuredData,
} from "@/components/StructuredData";
import "./LandingLumora.css";

const ReducedMotion = createContext(false);
const figures = { terrain: Terrain, drawer: Drawer, loupe: Loupe };
function HairlineFigure({ kind }: { kind: keyof typeof figures }) {
  const reduced = useContext(ReducedMotion);
  const Figure = figures[kind];
  return (
    <div
      className={`mq-hairline mq-hairline-${kind}`}
      aria-hidden="true"
      data-paused={reduced}
    >
      <Figure
        key={reduced ? "still" : "moving"}
        theme="light"
        intensity={0.45}
        play={!reduced}
      />
    </div>
  );
}
const description =
  "MatchIQ — журнал ставок на CS2 та Dota 2. Зберігай контекст рішень, аналізуй результати та контролюй власні правила.";
const faq = [
  {
    question: "Що саме робить MatchIQ?",
    answer:
      "Допомагає вести власний журнал ставок на CS2 та Dota 2: зберігати суму, коефіцієнт, результат і нотатки, стежити за банкролом та порівнювати стратегії. Це облік і аналіз твоїх рішень.",
  },
  {
    question: "Чи можна тут зробити ставку?",
    answer:
      "Ні. MatchIQ не приймає ставки, не зберігає кошти та не проводить платежі. У застосунку ти лише записуєш і аналізуєш свої ставки.",
  },
  {
    question: "Як потрапити в демо?",
    answer:
      "Кнопка «Увійти в демо» відкриває форму входу. Для доступу потрібні логін і пароль демо-облікового запису. Інтерактивні приклади на цьому лендінгу можна дослідити без входу.",
  },
  {
    question: "Чи гарантують розрахунки та AI результат?",
    answer:
      "Ні. EV і критерій Келлі залежать від твоїх припущень про ймовірність. AI-рекомендації можуть помилятися. Це додатковий контекст для аналізу, а не гарантія виграшу.",
  },
  {
    question: "Чи можна забрати свої дані?",
    answer:
      "Так. У профілі можна експортувати ставки у CSV для роботи з таблицями та створити JSON-бекап даних.",
  },
];
const journey = [
  {
    title: "Знайди свій матч",
    body: "Почни з розкладу CS2 або Dota 2. Перевір команди, турнір і формат зустрічі.",
    label: "01 / МАТЧ",
    main: "NAVI — Team Spirit",
    detail: "CS2 · Best of 3 · Демо-матч",
    value: "BO3",
  },
  {
    title: "Збережи причину рішення",
    body: "Запиши суму та коефіцієнт. Додай стратегію й нотатку — вони збережуть контекст, коли емоції минуть.",
    label: "02 / ЗАПИС",
    main: "Не тільки цифри",
    detail: "500 ₴ · 1.80 · Основна стратегія",
    value: "500 ₴",
  },
  {
    title: "Зафіксуй результат",
    body: "Познач виграш або програш. Для програшу додай коментар: що спрацювало не так і що варто врахувати наступного разу.",
    label: "03 / РЕЗУЛЬТАТ",
    main: "Програш — теж дані",
    detail: "«Не врахував формат матчу. Перевірю наступного разу.»",
    value: "−500 ₴",
  },
  {
    title: "Повернись із висновками",
    body: "Оціни зміну банкролу, порівняй стратегії та знайди повторювані рішення. Один запис стає частиною повної картини.",
    label: "04 / ВИСНОВОК",
    main: "Історія стає досвідом",
    detail: "Банкрол до запису: 12 000 ₴ → після результату: 11 500 ₴",
    value: "11 500 ₴",
  },
];

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useContext(ReducedMotion);
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, transform: "translateY(24px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0)" }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: reduced ? 0 : 0.65,
        delay: reduced ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
function Mark() {
  return (
    <span className="mq-brand">
      <span aria-hidden="true">✦</span> MatchIQ
    </span>
  );
}
function Pill({ children }: { children: ReactNode }) {
  return <span className="mq-pill">{children}</span>;
}
function DemoBadge() {
  return (
    <span className="mq-demo-badge">
      <i /> Демо-дані
    </span>
  );
}
function DemoLink() {
  return (
    <Link className="mq-button" to="/login-digesto-demo">
      Увійти в демо <ArrowUpRight size={18} aria-hidden="true" />
    </Link>
  );
}
function SectionHeading({
  label,
  title,
  children,
}: {
  label: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Reveal className="mq-section-heading">
      <div>
        <p className="mq-kicker">{label}</p>
        <h2>{title}</h2>
      </div>
      {children && <p>{children}</p>}
    </Reveal>
  );
}
function Switch({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mq-switch" role="group" aria-label={label}>
      {values.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={value === item}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
function Hero() {
  const [menu, setMenu] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menu) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menu]);
  return (
    <section className="mq-hero" aria-labelledby="mq-title">
      <div className="mq-hero-art" aria-hidden="true">
        <img
          src="/assets/profile/profile-player-hero.png"
          alt=""
          width="2172"
          height="724"
          fetchPriority="high"
        />
        <div />
      </div>
      <header className="mq-header">
        <Link to="/" aria-label="MatchIQ — головна">
          <Mark />
        </Link>
        <nav aria-label="Основна навігація">
          <a href="#possibilities">Можливості</a>
          <a href="#how-it-works">Як це працює</a>
          <a href="#tools">Інструменти</a>
          <a href="#faq">FAQ</a>
        </nav>
        <Link to="/login" className="mq-login">
          Увійти <ArrowUpRight size={16} />
        </Link>
        <button
          ref={menuButton}
          className="mq-menu-button"
          type="button"
          aria-label={menu ? "Закрити меню" : "Відкрити меню"}
          aria-expanded={menu}
          aria-controls="mq-mobile-menu"
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      {menu && (
        <nav
          id="mq-mobile-menu"
          className="mq-mobile-menu"
          aria-label="Мобільна навігація"
        >
          <a href="#possibilities" onClick={() => setMenu(false)}>
            Можливості
          </a>
          <a href="#how-it-works" onClick={() => setMenu(false)}>
            Як це працює
          </a>
          <a href="#tools" onClick={() => setMenu(false)}>
            Інструменти
          </a>
          <a href="#faq" onClick={() => setMenu(false)}>
            FAQ
          </a>
          <Link to="/login">Увійти ↗</Link>
        </nav>
      )}
      <div className="mq-hero-layout">
        <div className="mq-hero-copy">
          <p className="mq-kicker">
            <i /> Для тих, хто думає далі
          </p>
          <h1 id="mq-title">
            <span>Гра має емоції.</span>
            <span>
              Рішення — <em>контекст.</em>
            </span>
          </h1>
          <p className="mq-lead">
            Твій журнал ставок на CS2 та Dota 2.
            <br />
            Від першого запису до розуміння власної гри.
          </p>
          <div className="mq-hero-actions">
            <a className="mq-button" href="#possibilities">
              Дослідити MatchIQ <ArrowUpRight size={18} />
            </a>
            <a className="mq-outline-button" href="#how-it-works">
              Як це працює
            </a>
          </div>
          <p className="mq-legal-note">
            Облік та аналітика. Без приймання ставок.
          </p>
        </div>
      </div>
      <div className="mq-hero-signature" aria-hidden="true">
        MatchIQ<span>✦</span>
      </div>
      <div className="mq-hero-meta">
        <div>
          <Pill>CS2</Pill>
          <Pill>Dota 2</Pill>
        </div>
        <p>Ті самі матчі. Інший погляд.</p>
        <a href="#about" aria-label="Дізнатись більше про MatchIQ">
          <ArrowDown size={20} />
        </a>
      </div>
    </section>
  );
}

function MatchesDemo() {
  const [game, setGame] = useState("CS2");
  const rows =
    game === "CS2"
      ? [
          ["NAVI", "Team Spirit"],
          ["Vitality", "G2"],
          ["FaZe", "MOUZ"],
        ]
      : [
          ["Team Liquid", "Tundra"],
          ["Team Spirit", "Falcons"],
          ["BetBoom", "Aurora"],
        ];
  return (
    <div className="mq-match-demo">
      <div className="mq-demo-toolbar">
        <Switch
          label="Гра в прикладі матчів"
          values={["CS2", "Dota 2"]}
          value={game}
          onChange={setGame}
        />
        <DemoBadge />
      </div>
      <div className="mq-match-list" key={game}>
        {rows.map(([a, b], i) => (
          <div key={a}>
            <time>{16 + i}:00</time>
            <span>
              <b>{a}</b>
              <small>vs {b}</small>
            </span>
            <Pill>BO3</Pill>
          </div>
        ))}
      </div>
    </div>
  );
}
function JournalDemo() {
  const [kind, setKind] = useState("Ординар");
  return (
    <div className="mq-journal-demo">
      <div className="mq-demo-toolbar">
        <Switch
          label="Тип запису в прикладі"
          values={["Ординар", "Експрес"]}
          value={kind}
          onChange={setKind}
        />
        <DemoBadge />
      </div>
      <div className="mq-paper-ticket">
        <div>
          <span>МІЙ ЗАПИС / CS2</span>
          <ShieldCheck size={18} />
        </div>
        <h4>NAVI — Team Spirit</h4>
        <p className="mq-ticket-extra">
          {kind === "Експрес"
            ? "+ Vitality — G2"
            : "Перемога NAVI · Основна стратегія"}
        </p>
        <div className="mq-ticket-values">
          <span>
            <small>Сума</small>
            <b>500 ₴</b>
          </span>
          <span>
            <small>Коефіцієнт</small>
            <b>{kind === "Експрес" ? "2.70" : "1.80"}</b>
          </span>
        </div>
        <p className="mq-ticket-note">
          «Перевірив формат матчу та власні правила перед записом.»
        </p>
      </div>
    </div>
  );
}
function AnalyticsDemo() {
  const [game, setGame] = useState("CS2");
  const reduced = useContext(ReducedMotion);
  const cs2 = game === "CS2";
  return (
    <div className="mq-analytics-demo">
      <div className="mq-demo-toolbar">
        <Switch
          label="Гра в прикладі аналітики"
          values={["CS2", "Dota 2"]}
          value={game}
          onChange={setGame}
        />
        <DemoBadge />
      </div>
      <div className="mq-result">
        <span>Результат за період</span>
        <strong>
          {cs2 ? "−320" : "+460"}
          <small> ₴</small>
        </strong>
      </div>
      <svg
        viewBox="0 0 500 120"
        role="img"
        aria-label={`Ілюстративна динаміка ${game}`}
      >
        <path
          d="M0 30H500 M0 70H500 M0 110H500"
          stroke="#ffffff15"
          fill="none"
        />
        <motion.path
          key={game}
          d={
            cs2
              ? "M0 30L30 42L60 28L90 45L120 32L150 58L180 38L210 65L240 59L270 76L300 55L330 85L360 68L390 95L420 82L460 99L500 94"
              : "M0 100L30 92L60 104L90 83L120 90L150 65L180 79L210 61L240 70L270 42L300 55L330 36L360 51L390 28L420 41L460 19L500 25"
          }
          fill="none"
          stroke={cs2 ? "#ff906d" : "#c4d7b4"}
          strokeWidth="2.5"
          initial={reduced ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: reduced ? 0 : 0.8 }}
        />
      </svg>
      <div className="mq-chart-axis">
        <span>Початок періоду</span>
        <span>Кінець періоду</span>
      </div>
    </div>
  );
}
function RulesDemo() {
  const [odds, setOdds] = useState(1.8);
  const valid = odds >= 1.4 && odds <= 1.7;
  return (
    <div className="mq-rules-demo">
      <div className="mq-demo-toolbar">
        <span>Основна стратегія</span>
        <DemoBadge />
      </div>
      <div
        className={`mq-rule-status ${valid ? "is-valid" : ""}`}
        aria-live="polite"
      >
        <ShieldCheck size={30} strokeWidth={1.3} />
        <h4>{valid ? "У межах твоїх правил." : "Є привід зупинитись."}</h4>
        <p>
          {valid
            ? "Коефіцієнт відповідає заданому діапазону."
            : "Коефіцієнт виходить за заданий діапазон."}
        </p>
      </div>
      <label htmlFor="mq-rule-odds">
        Перевір коефіцієнт{" "}
        <output htmlFor="mq-rule-odds">{odds.toFixed(2)}</output>
      </label>
      <input
        id="mq-rule-odds"
        type="range"
        min="1.2"
        max="2"
        step="0.05"
        value={odds}
        onChange={(event) => setOdds(Number(event.target.value))}
      />
      <div className="mq-chart-axis">
        <span>1.20</span>
        <span>Твоє правило: 1.40–1.70</span>
        <span>2.00</span>
      </div>
    </div>
  );
}
function WorkCard({
  id,
  number,
  title,
  text,
  tags,
  children,
}: {
  id: string;
  number: string;
  title: string;
  text: string;
  tags: string[];
  children: ReactNode;
}) {
  return (
    <Reveal className="mq-work-wrap">
      <article className="mq-work-card" id={id}>
        <div className="mq-card-top">
          <span>{number} / МОЖЛИВОСТІ</span>
          <a href="#how-it-works" aria-label={`Як працює: ${title}`}>
            <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="mq-card-demo">{children}</div>
        <div className="mq-card-description">
          <h3>{title}</h3>
          <p>{text}</p>
          <div className="mq-card-tags">
            {tags.map((tag) => (
              <Pill key={tag}>{tag}</Pill>
            ))}
          </div>
        </div>
      </article>
    </Reveal>
  );
}
function Journey() {
  const [active, setActive] = useState(0);
  const item = journey[active];
  return (
    <section className="mq-section mq-journey" id="how-it-works">
      <SectionHeading
        label="02 / ВІД ЗАПИСУ ДО ВИСНОВКУ"
        title={
          <>
            Невеликі кроки.
            <br />
            Повна картина.
          </>
        }
      >
        Один демонстраційний запис — від вибору матчу до особистого висновку.
      </SectionHeading>
      <div className="mq-journey-layout">
        <div className="mq-process-list">
          {journey.map((step, i) => (
            <div className={active === i ? "is-active" : ""} key={step.title}>
              <h3>
                <button
                  type="button"
                  aria-expanded={active === i}
                  aria-controls={`mq-step-${i}`}
                  onClick={() => setActive(i)}
                >
                  <span>0{i + 1}</span>
                  {step.title}
                  <ArrowUpRight size={20} />
                </button>
              </h3>
              <p id={`mq-step-${i}`} hidden={active !== i}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
        <div className="mq-journey-stage" aria-live="polite">
          <div>
            <span>{item.label}</span>
            <DemoBadge />
          </div>
          <h3>{item.main}</h3>
          <strong>{item.value}</strong>
          <p>{item.detail}</p>
          <div className="mq-stage-progress" aria-hidden="true">
            {journey.map((_, i) => (
              <i key={i} className={i <= active ? "is-active" : ""} />
            ))}
          </div>
          <small>Ілюстрація сценарію, не реальні результати.</small>
        </div>
      </div>
    </section>
  );
}
function Tools() {
  const [probability, setProbability] = useState(55);
  const ev = ((probability / 100) * 1.8 - 1) * 100;
  return (
    <section className="mq-section mq-tools" id="tools">
      <SectionHeading
        label="03 / БІЛЬШЕ КОНТЕКСТУ"
        title={
          <>
            Менше припущень.
            <br />
            <span>Більше розуміння.</span>
          </>
        }
      >
        Інструменти допомагають перевірити логіку рішення. Остаточний вибір
        залишається за тобою.
      </SectionHeading>
      <div className="mq-tools-grid">
        <Reveal className="mq-calculator">
          <div className="mq-demo-toolbar">
            <Pill>Інтерактивний приклад</Pill>
            <span>EV / 01</span>
          </div>
          <h3>А якщо ймовірність інша?</h3>
          <p>
            Зміни свою оцінку й подивись, як вона впливає на очікуване значення
            за коефіцієнта 1.80.
          </p>
          <label htmlFor="mq-probability">
            Твоя оцінка ймовірності{" "}
            <output htmlFor="mq-probability">{probability}%</output>
          </label>
          <input
            id="mq-probability"
            type="range"
            min="30"
            max="75"
            value={probability}
            onChange={(event) => setProbability(Number(event.target.value))}
          />
          <div className="mq-ev" aria-live="polite">
            <strong>
              {ev >= 0 ? "+" : ""}
              {ev.toFixed(1)}%
            </strong>
            <span>
              Очікуване значення
              <br />
              EV = p × 1.80 − 1
            </span>
          </div>
          <small>
            Залежить від точності твоєї оцінки. Не є прогнозом виграшу.
          </small>
        </Reveal>
        <div className="mq-tool-notes">
          <div>
            <span>01</span>
            <h3>Ймовірність, а не обіцянка.</h3>
            <p>
              Value Bet, EV і критерій Келлі допомагають працювати з
              припущеннями та розміром ризику. Жодна формула не усуває
              невизначеність.
            </p>
          </div>
          <div>
            <span>02</span>
            <h3>AI — додатковий погляд.</h3>
            <p>
              Аргументи, оцінка впевненості й ризику доповнюють аналіз матчу.
              Рекомендації можуть помилятися та не гарантують результату.
            </p>
          </div>
          <div>
            <span>03</span>
            <h3>Історія залишається твоєю.</h3>
            <p>
              Експортуй ставки у CSV для власного аналізу або створи JSON-бекап
              у профілі застосунку.
            </p>
            <div className="mq-export-tags">
              <Pill>
                <Download size={13} /> CSV
              </Pill>
              <Pill>
                <FileJson size={13} /> JSON
              </Pill>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section
      className="mq-section mq-faq"
      id="faq"
      aria-labelledby="mq-faq-title"
    >
      <div className="mq-faq-intro">
        <p className="mq-kicker">04 / КОРОТКО ПРО ГОЛОВНЕ</p>
        <h2 id="mq-faq-title">Перед початком.</h2>
        <p className="mq-faq-description">
          Без дрібного шрифту та зайвих обіцянок.
        </p>
        <HairlineFigure kind="loupe" />
      </div>
      <div className="mq-faq-list">
        {faq.map((item, i) => (
          <div key={item.question} className="mq-faq-item">
            <h3>
              <button
                type="button"
                aria-expanded={open === i}
                aria-controls={`mq-faq-${i}`}
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span>{item.question}</span>
                <ChevronDown size={18} aria-hidden="true" />
              </button>
            </h3>
            <div id={`mq-faq-${i}`} hidden={open !== i}>
              <p>{item.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CapabilityRows() {
  const rows = [
    [
      "Матчі та контекст",
      "Розклад CS2 і Dota 2, команди та формати зустрічей.",
      "#matches",
    ],
    [
      "Журнал рішень",
      "Суми, коефіцієнти й причини — в одному записі.",
      "#journal",
    ],
    [
      "Особиста аналітика",
      "Банкрол, ROI та порівняння власних стратегій.",
      "#analytics",
    ],
    [
      "Правила та дисципліна",
      "Перевірка коефіцієнтів і контроль ризикових рішень.",
      "#discipline",
    ],
  ];
  return (
    <section
      className="mq-section mq-capabilities"
      aria-labelledby="mq-capabilities-title"
    >
      <h2 id="mq-capabilities-title">Що дає тобі MatchIQ</h2>
      <div className="mq-capability-list">
        {rows.map(([title, text, href], i) => (
          <a className="mq-capability-row" href={href} key={href}>
            <span className="mq-capability-number">0{i + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
            <span className="mq-row-arrow" aria-hidden="true">
              <ArrowUpRight size={18} />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
function ProductNumbers() {
  return (
    <section className="mq-numbers" aria-labelledby="mq-numbers-title">
      <p className="mq-kicker">• MATCHIQ У ЦИФРАХ</p>
      <h2 id="mq-numbers-title">
        Усе потрібне.
        <br />В одному просторі.
      </h2>
      <dl>
        {[
          ["2", "Гри: CS2 та Dota 2"],
          ["2", "Типи записів: ординар та експрес"],
          ["2", "Валюти обліку: UAH та USD"],
          ["2", "Формати експорту: CSV та JSON"],
        ].map(([value, label]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function Landing() {
  const systemReduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const reduced = Boolean(systemReduced || paused);
  return (
    <ReducedMotion.Provider value={reduced}>
      <MotionConfig reducedMotion={reduced ? "always" : "never"}>
        <div className={`mq-site${reduced ? " mq-reduced" : ""}`}>
          <SEO
            title="Твій журнал ставок на CS2 та Dota 2"
            description={description}
            canonical="https://matchiq.pro/"
          />
          <OrganizationStructuredData description={description} />
          <WebAppStructuredData description={description} />
          <FAQStructuredData questions={faq} />
          <a href="#mq-main" className="mq-skip">
            Перейти до вмісту
          </a>
          <Hero />
          <main id="mq-main">
            <section className="mq-section mq-about" id="about">
              <Reveal>
                <p className="mq-kicker">
                  <i /> ЦЕ MATCHIQ
                </p>
                <h2>
                  Матч закінчується.
                  <br />
                  <span>Твоя історія — ні.</span>
                </h2>
                <div className="mq-about-bottom">
                  <HairlineFigure kind="terrain" />
                  <p>
                    Ми не підказуємо, на кого ставити. Ми допомагаємо бачити,{" "}
                    <strong>як ти приймаєш рішення.</strong> Зберігай контекст,
                    помічай закономірності й повертайся до гри зі своїми
                    висновками.
                  </p>
                </div>
              </Reveal>
            </section>
            <CapabilityRows />
            <ProductNumbers />
            <section className="mq-section mq-work" id="possibilities">
              <SectionHeading
                label="01 / ТВОЯ ГРА, ЗІБРАНА ДОКУПИ"
                title={
                  <>
                    Один простір.
                    <br />
                    Різні сторони гри.
                  </>
                }
              >
                Натискай перемикачі й досліджуй приклади. Це ілюстрації
                можливостей, не фінальні скріншоти застосунку.
              </SectionHeading>
              <div className="mq-work-grid">
                <WorkCard
                  id="matches"
                  number="01"
                  title="Матч починається з контексту."
                  text="Розклад CS2 та Dota 2, формати й результати зустрічей. Знайди потрібний матч і почни з нього власний запис."
                  tags={["CS2 / Dota 2", "Пошук", "Розклад"]}
                >
                  <MatchesDemo />
                </WorkCard>
                <WorkCard
                  id="journal"
                  number="02"
                  title="За кожним записом — рішення."
                  text="Ординари й експреси, суми у UAH або USD з конвертацією, коефіцієнти та нотатки. Збережи не тільки підсумок, а й свої аргументи."
                  tags={["Журнал", "Стратегії", "Нотатки"]}
                >
                  <JournalDemo />
                </WorkCard>
                <WorkCard
                  id="analytics"
                  number="03"
                  title="Цифри, які складаються в історію."
                  text="Стеж за банкролом і результатами. Порівнюй ігри та стратегії, щоб помічати те, що губиться між окремими ставками."
                  tags={["Банкрол", "ROI", "Порівняння"]}
                >
                  <AnalyticsDemo />
                </WorkCard>
                <WorkCard
                  id="discipline"
                  number="04"
                  title="Власні правила — перед очима."
                  text="Перевіряй відповідність стратегії, позначай ризикові команди та пов’язуй записи з цілями. Контроль починається з твоїх правил."
                  tags={["Правила", "Ризикові команди", "Цілі"]}
                >
                  <RulesDemo />
                </WorkCard>
              </div>
            </section>
            <section
              className="mq-section mq-journal-story"
              aria-labelledby="mq-journal-story-title"
            >
              <HairlineFigure kind="drawer" />
              <Reveal>
                <p className="mq-kicker">ТВІЙ ЖУРНАЛ РІШЕНЬ</p>
                <h2 id="mq-journal-story-title">
                  Збережи запис.
                  <br />
                  Повернись до причини.
                </h2>
                <p>
                  Рахунок показує результат. Нотатка нагадує, чому ти обрав цей
                  матч, коефіцієнт і стратегію. Разом вони дають матеріал для
                  наступного рішення.
                </p>
                <a className="mq-outline-button" href="#journal">
                  Дослідити приклад запису <ArrowUpRight size={16} />
                </a>
              </Reveal>
            </section>
            <Journey />
            <Tools />
            <FAQ />
          </main>
          <footer className="mq-footer">
            <div className="mq-footer-cta">
              <h2>
                Твоя наступна гра.
                <br />
                Більш усвідомлене
                <br />
                рішення.
              </h2>
              <div>
                <DemoLink />
                <p>Для демо потрібні логін і пароль.</p>
              </div>
            </div>
            <div className="mq-footer-columns">
              <div className="mq-footer-brand">
                <Link to="/" aria-label="MatchIQ — головна">
                  <Mark />
                </Link>
                <p>
                  Особистий журнал ставок на кіберспорт. Зберігай контекст,
                  аналізуй рішення, помічай закономірності.
                </p>
              </div>
              <nav aria-label="Про MatchIQ">
                <h3>ПРО ПРОДУКТ</h3>
                <a href="#about">Про MatchIQ</a>
                <a href="#how-it-works">Як це працює</a>
                <a href="#tools">Інструменти</a>
                <a href="#faq">Запитання</a>
              </nav>
              <nav aria-label="Можливості MatchIQ">
                <h3>МОЖЛИВОСТІ</h3>
                <a href="#matches">Матчі</a>
                <a href="#journal">Журнал</a>
                <a href="#analytics">Аналітика</a>
                <a href="#discipline">Дисципліна</a>
              </nav>
              <div className="mq-footer-access">
                <h3>ТВІЙ ПРОСТІР</h3>
                <Link to="/login">Увійти в акаунт ↗</Link>
                <a href="#possibilities">Інтерактивні приклади</a>
                <button
                  type="button"
                  className="mq-motion-button"
                  disabled={Boolean(systemReduced)}
                  aria-pressed={reduced}
                  aria-label={
                    reduced ? "Увімкнути анімації" : "Зупинити анімації"
                  }
                  onClick={() => setPaused(!paused)}
                >
                  {reduced ? <Play size={14} /> : <Pause size={14} />}
                  {systemReduced
                    ? "Рух вимкнено системою"
                    : reduced
                      ? "Рух вимкнено"
                      : "Зупинити рух"}
                </button>
              </div>
            </div>
            <div className="mq-footer-wordmark" aria-hidden="true">
              MATCHIQ
            </div>
            <div className="mq-footer-bottom">
              <span>© {new Date().getFullYear()} MatchIQ</span>
              <span>
                <Check size={12} /> Облік. Аналітика. Без приймання ставок.
              </span>
              <span>CS2 / DOTA 2</span>
            </div>
          </footer>
        </div>
      </MotionConfig>
    </ReducedMotion.Provider>
  );
}
