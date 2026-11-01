import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import {
  Settle,
  Riffle,
  Query,
  Hub,
  Exploded,
} from "@lucasmarkes/hairline/react";
import { MotionConfig, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  FileJson,
  Menu,
  Pause,
  Play,
  ShieldAlert,
  ShieldCheck,
  Target,
  Wallet,
  X,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { telegramLink, track } from "@/lib/track";
import { LiquidBackdrop as SharedLiquidBackdrop } from "@/components/LiquidBackdrop";
import {
  FAQStructuredData,
  OrganizationStructuredData,
  WebAppStructuredData,
} from "@/components/StructuredData";
import "./LandingLumora.css";

const ReducedMotion = createContext(false);
const figures = {
  settle: Settle,
  riffle: Riffle,
  query: Query,
  hub: Hub,
  exploded: Exploded,
};
function HairlineFigure({ kind }: { kind: keyof typeof figures }) {
  const reduced = useContext(ReducedMotion);
  const Figure = figures[kind];
  return (
    <div
      className={`mq-hairline mq-hairline-${kind}`}
      aria-hidden={kind === "riffle" ? undefined : true}
      inert={reduced && kind === "riffle"}
      data-paused={reduced}
    >
      <Figure
        key={reduced ? "still" : "moving"}
        theme={kind === "hub" ? "dark" : "light"}
        label={
          kind === "riffle"
            ? "Картки записів: переміщуйся клавішами зі стрілками"
            : undefined
        }
        intensity={["settle", "hub"].includes(kind) ? 0.85 : 0.45}
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
      "MatchIQ — трекер ставок на CS2 та Dota 2. Зберігай суми, коефіцієнти, результати й нотатки, стеж за банкролом і порівнюй стратегії. Розклад матчів, розрахунки EV та Келлі й AI-рекомендації допомагають доповнити власний аналіз.",
  },
  {
    question: "Чи можна тут зробити ставку?",
    answer:
      "Ні. MatchIQ не приймає ставки, не зберігає кошти та не проводить платежі. У застосунку ти ведеш облік, аналізуєш матчі та результати власних ставок.",
  },
  {
    question: "Скільки коштує MatchIQ?",
    answer:
      "Місячна підписка — 500 ₴ на місяць. Річна — 5 500 ₴ на рік, тобто 12 місяців за ціною 11 (економія 500 ₴). Можливості в обох підписках однакові.",
  },
  {
    question: "Як оформити й оплатити підписку?",
    answer:
      "Напиши @cs2beet у Telegram і вкажи, яку підписку обираєш. Там підкажуть доступні способи оплати й відкриють доступ до акаунта.",
  },
  {
    question: "Чи є пробний період?",
    answer:
      "Окремого пробного періоду немає. Щоб оцінити MatchIQ до оплати, скористайся інтерактивними прикладами на цій сторінці або напиши @cs2beet у Telegram: покажемо застосунок і відповімо на запитання.",
  },
  {
    question: "Чи продовжується підписка автоматично?",
    answer:
      "Ні. Оплата відбувається вручну через Telegram, тому без твого рішення нічого не спишеться. Перед завершенням періоду ми нагадаємо про продовження.",
  },
  {
    question: "Що буде, коли підписка закінчиться?",
    answer:
      "Доступ до застосунку призупиниться, але твої записи, стратегії й нотатки збережуться. Після продовження продовжиш з того самого місця. Перед завершенням можеш експортувати дані у CSV або JSON.",
  },
  {
    question: "Чи можна перейти з місячної підписки на річну?",
    answer:
      "Так. Напиши @cs2beet: річна підписка почнеться одразу після завершення вже оплаченого місяця, тож оплачені дні не згорять.",
  },
  {
    question: "Чи можна спробувати без акаунта?",
    answer:
      "Так. Інтерактивні приклади на цій сторінці доступні без реєстрації: перемикай ігри, змінюй коефіцієнт і перевіряй правила стратегії. Це демонстраційні дані, зміни не зберігаються в акаунті. Для входу в сам застосунок потрібні логін і пароль.",
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
      <img src="/favicon.svg" width="30" height="30" alt="" /> MatchIQ
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
function SectionHeading({
  label,
  title,
  children,
  figure,
}: {
  label: string;
  title: ReactNode;
  children?: ReactNode;
  figure?: keyof typeof figures;
}) {
  return (
    <Reveal
      className={`mq-section-heading${figure ? " mq-heading-illustrated" : ""}`}
    >
      <div>
        <p className="mq-kicker">{label}</p>
        <h2>{title}</h2>
        {figure && children && (
          <p className="mq-heading-description">{children}</p>
        )}
      </div>
      {figure ? (
        <HairlineFigure kind={figure} />
      ) : (
        children && <p>{children}</p>
      )}
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
function LiquidBackdrop() {
  const reduced = useContext(ReducedMotion);
  return <SharedLiquidBackdrop paused={reduced} className="mq-preview-liquid" />;
}
const previewMenu = [
  { icon: BarChart3, label: "Огляд", active: true },
  { icon: CalendarDays, label: "Матчі" },
  { icon: BookOpen, label: "Журнал" },
  { icon: Wallet, label: "Банкрол" },
  { icon: Target, label: "Стратегії" },
  { icon: ShieldAlert, label: "Ризикові команди" },
];
const previewBars = [
  { month: "Лип", stake: 70, profit: 38 },
  { month: "Сер", stake: 82, profit: 52 },
  { month: "Вер", stake: 64, profit: 30 },
  { month: "Жов", stake: 90, profit: 66 },
  { month: "Лис", stake: 76, profit: 48 },
];
const previewBets = [
  {
    match: "NAVI — Team Spirit",
    meta: "CS2 · Ординар · 1.80",
    result: "+400 ₴",
    win: true,
  },
  {
    match: "Team Liquid — Tundra",
    meta: "Dota 2 · Ординар · 2.10",
    result: "−300 ₴",
    win: false,
  },
  {
    match: "Vitality — G2",
    meta: "CS2 · Експрес · 2.70",
    result: "+510 ₴",
    win: true,
  },
  {
    match: "FaZe — MOUZ",
    meta: "CS2 · Ординар · 1.65",
    result: "+195 ₴",
    win: true,
  },
];
function HeroPreview() {
  return (
    <div
      className="mq-preview"
      role="img"
      aria-label="Приклад інтерфейсу MatchIQ на демо-даних: банкрол, ROI, результат за місяцями та останні записи"
    >
      <LiquidBackdrop />
      <div className="mq-preview-window" aria-hidden="true">
        <aside className="mq-preview-side">
          <span className="mq-preview-brand">
            <img src="/favicon.svg" width="18" height="18" alt="" /> MatchIQ
          </span>
          <small>Меню</small>
          <ul>
            {previewMenu.map(({ icon: Icon, label, active }) => (
              <li key={label} className={active ? "is-active" : undefined}>
                <Icon size={13} /> {label}
              </li>
            ))}
          </ul>
          <div className="mq-preview-goal">
            <b>Основна стратегія</b>
            <span>7 з 10 записів за правилами</span>
            <i>
              <i />
            </i>
          </div>
        </aside>
        <div className="mq-preview-main">
          <div className="mq-preview-top">
            <span>Огляд</span>
            <DemoBadge />
          </div>
          <div className="mq-preview-body">
            <p className="mq-preview-hello">Привіт!</p>
            <p className="mq-preview-sub">
              Ось як змінився твій банкрол цього місяця.
            </p>
            <div className="mq-preview-stats">
              <div>
                <span>
                  Банкрол <em>+6.2%</em>
                </span>
                <strong>
                  12 480<small> ₴</small>
                </strong>
                <svg viewBox="0 0 80 24" className="mq-preview-spark">
                  <path d="M1 20 C 12 18, 16 9, 26 13 S 42 20, 52 10 S 68 4, 79 3" />
                </svg>
              </div>
              <div>
                <span>
                  ROI за місяць <em>+1.1</em>
                </span>
                <strong>
                  4.8<small>%</small>
                </strong>
              </div>
            </div>
            <div className="mq-preview-chart">
              <div className="mq-preview-chart-head">
                <b>Результат за місяцями</b>
                <span>
                  <i className="is-profit" /> Прибуток
                </span>
                <span>
                  <i /> Сума ставок
                </span>
              </div>
              <div className="mq-preview-bars">
                {previewBars.map(({ month, stake, profit }) => (
                  <div key={month}>
                    <span style={{ height: `${stake}%` }}>
                      <i style={{ height: `${(profit / stake) * 100}%` }} />
                    </span>
                    <small>{month}</small>
                  </div>
                ))}
              </div>
            </div>
            <div className="mq-preview-bets">
              <b>Останні записи</b>
              {previewBets.map(({ match, meta, result, win }) => (
                <div key={match}>
                  <span className="mq-preview-avatar">{match[0]}</span>
                  <span>
                    {match}
                    <small>{meta}</small>
                  </span>
                  <em className={win ? "is-win" : "is-loss"}>{result}</em>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function SiteHeader() {
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
    <div className="mq-topbar">
      <header className="mq-header">
        <Link to="/" aria-label="MatchIQ — головна">
          <Mark />
        </Link>
        <nav aria-label="Основна навігація">
          <a href="#possibilities">Можливості</a>
          <a href="#how-it-works">Як це працює</a>
          <a href="#tools">Інструменти</a>
          <a href="#pricing">Ціни</a>
          <a href="#faq">FAQ</a>
        </nav>
        <Link
          to="/login"
          className="mq-login"
          data-track="cta_login"
          data-track-place="header"
        >
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
          <a href="#pricing" onClick={() => setMenu(false)}>
            Ціни
          </a>
          <a href="#faq" onClick={() => setMenu(false)}>
            FAQ
          </a>
          <Link to="/login">Увійти ↗</Link>
        </nav>
      )}
    </div>
  );
}
function Hero() {
  return (
    <section className="mq-hero" aria-labelledby="mq-title">
      <div className="mq-hero-layout">
        <div className="mq-hero-copy">
          <p className="mq-kicker">
            <i /> ОБЛІК ТА АНАЛІЗ СТАВОК · CS2 / DOTA 2
          </p>
          <h1 id="mq-title">
            <span>
              Трекер ставок
              <br />
              на CS2 та Dota 2.
            </span>
          </h1>
          <p className="mq-lead">
            Веди журнал ставок, бач свої прибутки й збитки та перевіряй рішення
            за власною стратегією. Матчі, нотатки, банкрол — бюджет на ставки —
            і статистика в одному місці.
          </p>
          <div className="mq-hero-actions">
            <a
              className="mq-button"
              href={telegramLink(TG_ACCESS)}
              data-track="cta_access"
              data-track-place="hero"
              target="_blank"
              rel="noopener noreferrer"
            >
              Отримати доступ <ArrowUpRight size={18} />
            </a>
            <a
              className="mq-outline-button"
              href="#possibilities"
              data-track="cta_demo"
              data-track-place="hero"
            >
              Спробувати на прикладі <ArrowUpRight size={18} />
            </a>
          </div>
          <p className="mq-legal-note">
            Доступ — через Telegram @cs2beet. Приклади — без реєстрації.
            <br />
            18+. MatchIQ не приймає ставки та не зберігає кошти.
          </p>
        </div>
        <HeroPreview />
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
          stroke={cs2 ? "#ff693b" : "#c4d7b4"}
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
          <span>{number} / 04</span>
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
// The reviews block uses TEST data for layout work, so it renders only in
// development and never ships as if it were real. Replace testStats and
// testReviews with real numbers and testimonials (published with the
// authors' permission), then remove the SHOW_PLACEHOLDERS guard.
const SHOW_PLACEHOLDERS = import.meta.env.DEV;
const testStats = [
  ["12 480", "записів у журналах"],
  ["640+", "користувачів веде журнал"],
  ["1 900+", "матчів CS2 і Dota 2 щомісяця"],
];
const testReviews = [
  {
    name: "Андрій К.",
    meta: "CS2 · веде журнал 8 місяців",
    text: "Раніше рахував усе в Google-таблиці й постійно щось губив. Тепер бачу, що на BO1 я стабільно в мінусі, і просто перестав їх брати.",
  },
  {
    name: "Олена М.",
    meta: "Dota 2 · веде журнал 5 місяців",
    text: "Найкорисніше — нотатки до кожної ставки. Перечитую після матчу й розумію, де рішення було на емоціях, а де за планом.",
  },
  {
    name: "Максим Т.",
    meta: "CS2 і Dota 2 · веде журнал рік",
    text: "Правило на коефіцієнти рятує від імпульсивних ставок: якщо запис не проходить перевірку стратегії, я його просто не роблю.",
  },
];
function SocialProofPlaceholder() {
  return (
    <section
      className="mq-section mq-proof"
      aria-labelledby="mq-proof-title"
    >
      <div className="mq-proof-heading">
        <p className="mq-kicker">
          ВІДГУКИ <span className="mq-ph-badge">Тестові дані</span>
        </p>
        <h2 id="mq-proof-title">
          Що кажуть ті,
          <br />
          <span>хто вже веде журнал.</span>
        </h2>
      </div>
      <div className="mq-proof-stats">
        {testStats.map(([value, label]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="mq-proof-grid">
        {testReviews.map((review) => (
          <figure key={review.name} className="mq-quote">
            <blockquote>«{review.text}»</blockquote>
            <figcaption>
              <span className="mq-quote-avatar" aria-hidden="true">
                {review.name[0]}
              </span>
              <span>
                <b>{review.name}</b>
                <small>{review.meta}</small>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
function Journey() {
  const [active, setActive] = useState(0);
  const item = journey[active];
  return (
    <section className="mq-section mq-journey" id="how-it-works">
      <SectionHeading
        figure="exploded"
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
        <div className="mq-journey-stage">
          <LiquidBackdrop />
          <div className="mq-journey-glass" aria-live="polite">
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
        figure="hub"
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
            <h3>AI-рекомендації до матчів.</h3>
            <p>
              Прогноз, аргументи, оцінка впевненості й ризику доповнюють твій
              аналіз матчу. Рекомендації можуть помилятися та не гарантують
              результату.
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
const TG_ACCESS = "Привіт! Хочу отримати доступ до MatchIQ.";
const MONTHLY_PRICE = 500;
const YEARLY_PRICE = MONTHLY_PRICE * 11;
const formatUah = (value: number) =>
  `${value.toLocaleString("uk-UA").replace(/\u00a0/g, " ")} ₴`;
const pricingFeatures = [
  "Журнал ставок, причини та нотатки",
  "Банкрол, ROI і порівняння стратегій",
  "Правила, цілі та ризикові команди",
  "Розклад матчів CS2 і Dota 2",
  "EV, критерій Келлі та AI-рекомендації",
  "Експорт у CSV і JSON-бекап",
];
function Pricing() {
  const plans = [
    {
      id: "monthly",
      name: "Місячна",
      price: formatUah(MONTHLY_PRICE),
      period: "/ місяць",
      note: "Оплата щомісяця.",
      featured: false,
      message: `Привіт! Хочу оформити місячну підписку MatchIQ (${formatUah(MONTHLY_PRICE)} / місяць).`,
    },
    {
      id: "yearly",
      name: "Річна",
      price: formatUah(YEARLY_PRICE),
      period: "/ рік",
      note: `≈ ${formatUah(Math.round(YEARLY_PRICE / 12))} на місяць · економія ${formatUah(MONTHLY_PRICE * 12 - YEARLY_PRICE)}`,
      badge: "12 місяців за ціною 11",
      featured: true,
      message: `Привіт! Хочу оформити річну підписку MatchIQ (${formatUah(YEARLY_PRICE)} / рік).`,
    },
  ];
  return (
    <section
      className="mq-section mq-pricing"
      id="pricing"
      aria-labelledby="mq-pricing-title"
    >
      <Reveal className="mq-pricing-heading">
        <p className="mq-kicker">04 / ЦІНИ</p>
        <h2 id="mq-pricing-title">
          Один доступ.
          <br />
          <span>Обери, як платити.</span>
        </h2>
        <p>
          Усі можливості MatchIQ в обох підписках. Різниця лише в періоді
          оплати: за рік платиш як за 11 місяців.
        </p>
      </Reveal>
      <div className="mq-pricing-grid">
        {plans.map((plan) => (
          <Reveal key={plan.id}>
            <article
              className={`mq-plan${plan.featured ? " is-featured" : ""}`}
              aria-labelledby={`mq-plan-${plan.id}`}
            >
              <div className="mq-plan-top">
                <h3 id={`mq-plan-${plan.id}`}>{plan.name}</h3>
                {plan.badge && <span className="mq-plan-badge">{plan.badge}</span>}
              </div>
              <p className="mq-plan-price">
                <strong>{plan.price}</strong> <span>{plan.period}</span>
              </p>
              <p className="mq-plan-note">{plan.note}</p>
              <ul>
                {pricingFeatures.map((feature) => (
                  <li key={feature}>
                    <Check size={14} aria-hidden="true" /> {feature}
                  </li>
                ))}
              </ul>
              <a
                className="mq-button"
                href={telegramLink(plan.message)}
                data-track="plan_select"
                data-track-place={plan.id}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Оформити підписку «${plan.name}» через Telegram`}
              >
                Оформити підписку <ArrowUpRight size={18} />
              </a>
            </article>
          </Reveal>
        ))}
      </div>
      <p className="mq-pricing-footnote">
        Щоб оформити підписку, напиши @cs2beet у Telegram. Ціни в гривнях.
      </p>
    </section>
  );
}
function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? faq : faq.slice(0, 5);
  return (
    <section
      className="mq-section mq-faq"
      id="faq"
      aria-labelledby="mq-faq-title"
    >
      <div className="mq-faq-intro">
        <p className="mq-kicker">05 / КОРОТКО ПРО ГОЛОВНЕ</p>
        <h2 id="mq-faq-title">Перед початком.</h2>
        <p className="mq-faq-description">
          Без дрібного шрифту та зайвих обіцянок.
        </p>
        <HairlineFigure kind="query" />
      </div>
      <div className="mq-faq-list">
        {visible.map((item, i) => (
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
        {faq.length > 5 && (
          <button
            type="button"
            className="mq-faq-more"
            onClick={() => setShowAll((v) => !v)}
            aria-expanded={showAll}
          >
            {showAll ? "Показати менше" : `Показати більше (${faq.length - 5})`}
            <ChevronDown size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}

export default function Landing() {
  const systemReduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const reduced = Boolean(systemReduced || paused);
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(
        "[data-track]",
      );
      if (!target?.dataset.track) return;
      track(target.dataset.track, {
        place: target.dataset.trackPlace ?? "unknown",
      });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
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
          <WebAppStructuredData
            description={description}
            offers={{ price: String(MONTHLY_PRICE), priceCurrency: "UAH" }}
          />
          <FAQStructuredData questions={faq} />
          <a href="#mq-main" className="mq-skip">
            Перейти до вмісту
          </a>
          <SiteHeader />
          <main id="mq-main">
            <Hero />
            <section className="mq-section mq-about" id="about">
              <Reveal>
                <p className="mq-kicker">
                  <i /> ЦЕ MATCHIQ
                </p>
                <h2>
                  Для тих, хто хоче
                  <br />
                  <span>бачити свої результати.</span>
                </h2>
                <div className="mq-about-bottom">
                  <HairlineFigure kind="settle" />
                  <p>
                    Якщо ти вже робиш ставки на кіберспорт і ведеш облік у
                    таблицях чи нотатках, MatchIQ збирає його в одному місці.
                    <strong>
                      {" "}
                      Зберігай не лише результат, а й причину ставки.
                    </strong>{" "}
                    Після матчу ти зможеш повернутися до своїх аргументів,
                    перевірити стратегію й побачити, як змінився банкрол.
                  </p>
                </div>
              </Reveal>
            </section>
            <section className="mq-section mq-work" id="possibilities">
              <SectionHeading
                label="01 / ТВОЯ ГРА, ЗІБРАНА ДОКУПИ"
                title={
                  <>
                    Що ти зможеш
                    <br />
                    робити в MatchIQ.
                  </>
                }
              >
                Обирай матч, зберігай запис і причину рішення, а після
                результату — перевіряй свою статистику. Нижче — інтерактивні
                приклади на демо-даних.
              </SectionHeading>
              <div className="mq-work-grid">
                <WorkCard
                  id="matches"
                  number="01"
                  title="Знаходь матчі CS2 та Dota 2."
                  text="Розклад CS2 та Dota 2, формати й результати зустрічей. Знайди потрібний матч і почни з нього власний запис."
                  tags={["CS2 / Dota 2", "Пошук", "Розклад"]}
                >
                  <MatchesDemo />
                </WorkCard>
                <WorkCard
                  id="journal"
                  number="02"
                  title="Записуй ставки та причини."
                  text="Ординари й експреси, суми у UAH або USD з конвертацією, коефіцієнти та нотатки. Збережи не тільки підсумок, а й свої аргументи."
                  tags={["Журнал", "Стратегії", "Нотатки"]}
                >
                  <JournalDemo />
                </WorkCard>
                <WorkCard
                  id="analytics"
                  number="03"
                  title="Банкрол і результати — перед очима."
                  text="Скільки ти виграв або втратив? Яка стратегія дає збитки? Порівнюй ігри, періоди й стратегії, стеж за банкролом, часткою виграшів та ROI — результатом відносно суми ставок."
                  tags={["Банкрол", "ROI", "Порівняння"]}
                >
                  <AnalyticsDemo />
                </WorkCard>
                <WorkCard
                  id="discipline"
                  number="04"
                  title="Перевіряй рішення за своєю стратегією."
                  text="Задай правила для коефіцієнтів, типів ставок і форматів матчів — MatchIQ перевірить запис на відповідність стратегії й попередить про команду з твого ризикового списку. Пов’язуй записи з цілями та стеж за прогресом."
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
              <HairlineFigure kind="riffle" />
              <Reveal>
                <p className="mq-kicker">ТВІЙ ЖУРНАЛ РІШЕНЬ</p>
                <h2 id="mq-journal-story-title">
                  Збережи запис.
                  <br />
                  Повернись до причини.
                </h2>
                <p>
                  Журнал зберігає кожну ставку разом із її контекстом: матч,
                  суму, коефіцієнт, стратегію та твою нотатку. Запиши, чому
                  обрав саме це рішення, поки аргументи ще свіжі.
                </p>
                <p>
                  Після матчу зафіксуй результат і повернися до запису. Порівняй
                  початкові очікування з тим, що сталося, та додай висновок. Так
                  історія ставок допомагає помічати повторювані помилки й
                  перевіряти власні правила на фактах.
                </p>
                <a className="mq-outline-button" href="#journal">
                  Дослідити приклад запису <ArrowUpRight size={16} />
                </a>
              </Reveal>
            </section>
            <Journey />
            <Tools />
            {SHOW_PLACEHOLDERS && <SocialProofPlaceholder />}
            <Pricing />
            <FAQ />
          </main>
          <footer className="mq-footer">
            <section className="mq-fcta" aria-labelledby="mq-fcta-title">
              <LiquidBackdrop />
              <span className="mq-fcta-pill">
                <ArrowUpRight size={12} aria-hidden="true" /> Доступ через
                Telegram
              </span>
              <h2 id="mq-fcta-title">
                Твій журнал ставок
                <br />
                починається тут.
              </h2>
              <p>
                Напиши @cs2beet у Telegram, щоб дізнатися умови й отримати
                акаунт. Приклади на сторінці доступні без реєстрації.
              </p>
              <div className="mq-fcta-actions">
                <a
                  className="mq-fcta-primary"
                  href={telegramLink(TG_ACCESS)}
                  data-track="cta_access"
                  data-track-place="footer_cta"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Отримати доступ
                </a>
                <a className="mq-fcta-glass" href="#possibilities">
                  Спробувати на прикладі
                </a>
              </div>
            </section>
            <div className="mq-fgrid">
              <div className="mq-fbrand">
                <Link to="/" aria-label="MatchIQ — головна">
                  <Mark />
                </Link>
                <p>
                  Особистий журнал ставок на кіберспорт. Зберігай контекст,
                  аналізуй рішення, помічай закономірності.
                </p>
                <div className="mq-fbrand-actions">
                  <Link className="mq-fbrand-login" to="/login">
                    У мене вже є акаунт <ArrowUpRight size={14} />
                  </Link>
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
              <nav aria-label="Про MatchIQ">
                <h3>Продукт</h3>
                <a href="#about">Про MatchIQ</a>
                <a href="#how-it-works">Як це працює</a>
                <a href="#tools">Інструменти</a>
                <a href="#pricing">Ціни</a>
                <a href="#faq">Запитання</a>
              </nav>
              <nav aria-label="Можливості MatchIQ">
                <h3>Можливості</h3>
                <a href="#matches">Матчі</a>
                <a href="#journal">Журнал</a>
                <a href="#analytics">Аналітика</a>
                <a href="#discipline">Дисципліна</a>
              </nav>
              <nav aria-label="Твій простір">
                <h3>Твій простір</h3>
                <a
                  href={telegramLink(TG_ACCESS)}
                  data-track="cta_access"
                  data-track-place="footer_nav"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Запитати про доступ
                </a>
                <Link to="/login">Увійти в акаунт</Link>
                <a href="#possibilities">Інтерактивні приклади</a>
              </nav>
            </div>
            <div className="mq-fresponsible">
              <span className="mq-f18" aria-label="Лише для повнолітніх">
                18+
              </span>
              <p>
                <b>Відповідальна гра.</b> Став лише ті гроші, які готовий
                втратити. MatchIQ допомагає бачити результати та тримати
                власні ліміти, але не робить ставки безпечними. Якщо гра
                виходить з-під контролю, оформи самообмеження чи отримай
                допомогу на сайті державного регулятора.
              </p>
              <a
                href="https://playcity.gov.ua/borotba-z-ihrovoiu-zalezhnistiu"
                target="_blank"
                rel="noopener noreferrer"
              >
                Допомога при ігровій залежності ↗
              </a>
            </div>
            <div className="mq-fbottom">
              <span>© {new Date().getFullYear()} MatchIQ. Облік і аналітика, без приймання ставок.</span>
              <span>
                <Link to="/privacy">Конфіденційність</Link>
                <span aria-hidden="true">·</span>
                <Link to="/terms">Умови</Link>
                <span aria-hidden="true">·</span>
                <a
                  href="https://t.me/cs2beet"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Telegram
                </a>
              </span>
            </div>
            <div className="mq-fwordmark" aria-hidden="true">
              MatchIQ
            </div>
          </footer>
        </div>
      </MotionConfig>
    </ReducedMotion.Provider>
  );
}
