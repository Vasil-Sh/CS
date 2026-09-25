import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AnimatedFAQ,
  AnimatedNumber,
  ArenaImage,
  DataOwnership,
  HeroTitle,
  LandingMotion,
  ProductExplorer,
  StrategyCheck,
  useJourneyScroll,
  useLandingReducedMotion,
} from "./LandingExperience";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronRight,
  Flag,
  Menu,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import {
  FAQStructuredData,
  OrganizationStructuredData,
  WebAppStructuredData,
} from "@/components/StructuredData";
import "./Landing.css";

const DEMO = "/login-digesto-demo";
const description =
  "Трекер ставок на CS2 та Dota 2. Веди історію, контролюй банкрол і аналізуй власні результати.";
const faqs = [
  {
    question: "Як потрапити в демо?",
    answer:
      "Кнопка «Увійти в демо» відкриває форму входу до демо-облікового запису. Для входу потрібні його логін і пароль. Поки не маєш доступу — досліди інтерактивні приклади на цій сторінці: вони працюють без входу.",
  },
  {
    question: "Чи можна зробити ставку в MatchIQ?",
    answer:
      "Ні. MatchIQ не приймає ставки й не проводить платежі. Це інструмент для обліку: ти записуєш власні ставки, фіксуєш результати та аналізуєш свої рішення.",
  },
  {
    question: "Звідки беруться дані матчів?",
    answer:
      "MatchIQ отримує дані CS2 та Dota 2 із зовнішніх джерел, зокрема cstest API та tips.gg. Розклад, рахунки й коефіцієнти можуть оновлюватися із затримкою.",
  },
  {
    question: "Як фіксувати результати?",
    answer:
      "Додай ставку вручну або почни з матчу у списку. Після завершення познач виграш чи програш. Додай нотатку, щоб зберегти контекст свого рішення; для програшу коментар обов’язковий.",
  },
  {
    question: "Для чого AI-рекомендації?",
    answer:
      "Вони дають додатковий погляд на матч: аргументи, оцінку впевненості та ризику. AI може помилятися, а його оцінки не гарантують результату. Рішення залишаються за тобою.",
  },
  {
    question: "Чи можна експортувати записи?",
    answer:
      "Так. У профілі можна експортувати ставки у CSV для роботи з таблицями та створити JSON-бекап даних.",
  },
];
const steps = [
  {
    title: "Обери матч",
    caption: "CS2 або Dota 2. Усі деталі — перед очима.",
    label: "01 / МАТЧ",
    heading: "NAVI — Team Spirit",
    detail: "CS2 · Best of 3 · Демонстраційний матч",
  },
  {
    title: "Запиши ставку",
    caption: "Зафіксуй суму, коефіцієнт і свою стратегію.",
    label: "02 / ЗАПИС",
    heading: "Рішення має контекст",
    detail: "500 ₴ · коефіцієнт 1.80 · перемога NAVI",
  },
  {
    title: "Додай результат",
    caption: "Збережи підсумок і те, що варто пам’ятати.",
    label: "03 / РЕЗУЛЬТАТ",
    heading: "Програш — теж дані",
    detail: "−500 ₴ · Відхилився від своєї стратегії",
  },
  {
    title: "Побач зміни",
    caption: "Від одного запису — до повної картини.",
    label: "04 / ВИСНОВОК",
    heading: "Тепер це частина історії",
    detail: "Банкрол: 12 000 ₴ → 11 500 ₴",
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
  const reduced = useLandingReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
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
function DemoLink({
  dark = false,
  children = "Увійти в демо",
}: {
  dark?: boolean;
  children?: ReactNode;
}) {
  return (
    <Link to={DEMO} className={`lp-button ${dark ? "lp-button-dark" : ""}`}>
      {children}
      <ArrowUpRight size={20} aria-hidden="true" />
    </Link>
  );
}
function Brand() {
  return (
    <span className="lp-brand">
      Match<span>IQ</span>
    </span>
  );
}
function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="lp-eyebrow">{children}</p>;
}
function DemoLabel() {
  return (
    <span className="lp-demo-label">
      <span /> Демо-дані
    </span>
  );
}
function LineChart({ loss = false }: { loss?: boolean }) {
  const reduced = useLandingReducedMotion();
  const path = loss
    ? "M0 36 L20 40 L40 28 L60 35 L80 23 L100 41 L120 36 L140 52 L160 42 L180 62 L200 57 L220 74 L240 66 L260 89 L280 77 L300 110 L320 103 L340 126 L360 135"
    : "M0 102 L20 93 L40 107 L60 80 L80 86 L100 66 L120 78 L140 57 L160 67 L180 43 L200 56 L220 40 L240 62 L260 32 L280 42 L300 25 L320 39 L340 15 L360 24";
  return (
    <svg
      className="lp-line-chart"
      viewBox="0 0 360 160"
      role="img"
      aria-label={
        loss
          ? "Приклад зменшення банкролу після програшу"
          : "Ілюстративна динаміка банкролу"
      }
    >
      {[30, 70, 110, 150].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="360"
          y2={y}
          stroke="currentColor"
          strokeOpacity=".12"
        />
      ))}
      <motion.path
        d={path}
        fill="none"
        stroke="#ff693b"
        strokeWidth="2.5"
        initial={reduced ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: reduced ? 0 : 1.5, ease: "easeInOut" }}
      />
    </svg>
  );
}
function JourneyPreview({ active }: { active: number }) {
  const reduced = useLandingReducedMotion();
  return (
    <div className="lp-journey-preview">
      <div className="lp-preview-top">
        <span>MatchIQ / журнал рішень</span>
        <DemoLabel />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active}
          initial={reduced ? false : { opacity: 0, y: 18, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: reduced ? 0 : -12 }}
          transition={{ duration: reduced ? 0 : 0.28 }}
          className="lp-journey-content"
          aria-live="polite"
        >
          <Eyebrow>{steps[active].label}</Eyebrow>
          <h3>{steps[active].heading}</h3>
          <p className="lp-preview-description">{steps[active].detail}</p>
          {active === 0 && (
            <div className="lp-match-demo">
              <div>
                <b className="lp-team-mark">N</b>
                <strong>NAVI</strong>
              </div>
              <span>
                VS<small>BO3</small>
              </span>
              <div>
                <b className="lp-team-mark lp-team-mark-light">TS</b>
                <strong>Team Spirit</strong>
              </div>
            </div>
          )}
          {active === 1 && (
            <div className="lp-record-demo">
              <div>
                <span>Сума ставки</span>
                <strong>
                  500 <small>₴</small>
                </strong>
              </div>
              <div>
                <span>Коефіцієнт</span>
                <strong>1.80</strong>
              </div>
              <div className="lp-record-wide">
                <span>Стратегія</span>
                <strong>
                  Основна <ShieldCheck size={18} />
                </strong>
              </div>
            </div>
          )}
          {active === 2 && (
            <div className="lp-result-demo">
              <span className="lp-loss-tag">Програш</span>
              <strong>
                −500 <small>₴</small>
              </strong>
              <blockquote>
                «Відхилився від своєї стратегії. Наступного разу перевірю межі
                коефіцієнтів перед записом.»
              </blockquote>
            </div>
          )}
          {active === 3 && (
            <div className="lp-bank-demo">
              <span>Поточний банкрол</span>
              <strong>
                <AnimatedNumber value={11500} /> <small>₴</small>
              </strong>
              <LineChart loss />
              <div className="lp-axis">
                <span>До ставки</span>
                <span>Після результату</span>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="lp-preview-bottom">
        <span>Один приклад. Чотири кроки.</span>
        <span>0{active + 1} / 04</span>
      </div>
    </div>
  );
}
function MonthlyChart() {
  const reduced = useLandingReducedMotion();
  const [game, setGame] = useState("CS2");
  const baseBars = [
    32, 48, -25, 68, 28, -52, 38, -24, -75, 42, 60, -32, 22, -45, 56, -66, 32,
    -40, 23, -55,
  ];
  const bars =
    game === "CS2"
      ? baseBars
      : baseBars.map((v, i) => (i % 3 === 0 ? -v : Math.abs(v)));
  return (
    <div className="lp-stat-visual">
      <div className="lp-stat-top">
        <span>Результат за місяць</span>
        <DemoLabel />
      </div>
      <div className="lp-stat-value">
        <AnimatedNumber value={game === "CS2" ? -320 : 460} /> <small>₴</small>
        <span>Чистий результат</span>
      </div>
      <div
        className="lp-segmented lp-chart-filter"
        aria-label="Гра на демонстраційному графіку"
      >
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
      <div
        className="lp-bars"
        role="img"
        aria-label="Демонстраційний графік виграшних і програшних днів"
      >
        {bars.map((value, i) => (
          <div key={i} className="lp-bar-slot">
            <motion.span
              key={game}
              className={value > 0 ? "lp-bar-up" : "lp-bar-down"}
              style={{ height: `${Math.abs(value)}%` }}
              initial={reduced ? false : { scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: reduced ? 0 : 0.65,
                delay: reduced ? 0 : i * 0.025,
              }}
            />
          </div>
        ))}
      </div>
      <div className="lp-axis">
        <span>01 вер</span>
        <span>15 вер</span>
        <span>30 вер</span>
      </div>
    </div>
  );
}
function Comparison({ games = false }: { games?: boolean }) {
  const rows = games
    ? [
        ["CS2", "38", "−6.1%"],
        ["Dota 2", "22", "+5.8%"],
      ]
    : [
        ["Основна", "28", "+12.4%"],
        ["Лайв", "16", "−8.7%"],
        ["Експрес", "12", "−15.3%"],
      ];
  return (
    <div className="lp-stat-visual">
      <div className="lp-stat-top">
        <span>{games ? "Результати за іграми" : "Порівняння стратегій"}</span>
        <DemoLabel />
      </div>
      <table className="lp-data-table">
        <caption className="lp-sr-only">
          Ілюстративне порівняння {games ? "ігор" : "стратегій"}
        </caption>
        <thead>
          <tr>
            <th>{games ? "Гра" : "Стратегія"}</th>
            <th>Ставок</th>
            <th>ROI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              <th scope="row">{row[0]}</th>
              <td>{row[1]}</td>
              <td
                className={
                  row[2].startsWith("+") ? "lp-positive" : "lp-negative"
                }
              >
                {row[2]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LandingContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const journeyRef = useJourneyScroll(setActiveStep);
  const reduced = useLandingReducedMotion();
  return (
    <div className="matchiq-landing">
      <SEO
        title="Трекер ставок на CS2 та Dota 2"
        description={description}
        canonical="https://matchiq.pro/"
      />
      <OrganizationStructuredData description={description} />
      <WebAppStructuredData
        description={description}
        image="https://matchiq.pro/assets/og-image.svg"
      />
      <FAQStructuredData questions={faqs} />
      <a className="lp-skip" href="#landing-main">
        Перейти до вмісту
      </a>
      <div className="lp-hero-shell">
        <ArenaImage />
        <header className="lp-header">
          <Link to="/" aria-label="MatchIQ — головна">
            <Brand />
          </Link>
          <nav className="lp-desktop-nav" aria-label="Основна навігація">
            <a href="#possibilities">Можливості</a>
            <a href="#how-it-works">Як це працює</a>
            <a href="#faq">FAQ</a>
          </nav>
          <Link className="lp-login" to="/login">
            Увійти <ArrowUpRight size={17} />
          </Link>
          <button
            type="button"
            className="lp-menu-button"
            aria-label={menuOpen ? "Закрити меню" : "Відкрити меню"}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-nav"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </header>
        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ opacity: 0, y: reduced ? 0 : -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduced ? 0 : -12 }}
              transition={{ duration: reduced ? 0 : 0.22 }}
              id="landing-mobile-nav"
              className="lp-mobile-nav"
              aria-label="Мобільна навігація"
            >
              <a href="#possibilities" onClick={() => setMenuOpen(false)}>
                Можливості
              </a>
              <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
                Як це працює
              </a>
              <a href="#faq" onClick={() => setMenuOpen(false)}>
                FAQ
              </a>
              <Link to="/login">
                Увійти <ArrowUpRight size={18} />
              </Link>
            </motion.nav>
          )}
        </AnimatePresence>
        <main id="landing-main">
          <section className="lp-hero" aria-labelledby="hero-title">
            <div className="lp-hero-copy">
              <Reveal>
                <Eyebrow>
                  <span className="lp-signal" /> ДАНІ. ДИСЦИПЛІНА. ТВОЯ ГРА.
                </Eyebrow>
                <HeroTitle />
              </Reveal>
              <Reveal delay={0.12}>
                <p className="lp-hero-description">
                  Трекер ставок на CS2 та Dota 2.
                  <br />
                  Веди історію, контролюй банкрол
                  <br className="lp-desktop-break" /> і аналізуй власні
                  результати.
                </p>
                <div className="lp-hero-actions">
                  <a href="#possibilities" className="lp-button">
                    Дослідити можливості <ArrowUpRight size={20} />
                  </a>
                  <a href="#how-it-works" className="lp-text-link">
                    Як це працює <ArrowDown size={17} />
                  </a>
                </div>
                <p className="lp-hero-note">
                  Облік та аналітика. Без приймання ставок.
                </p>
              </Reveal>
            </div>
            <aside className="lp-orange-rail" aria-hidden="true">
              <span>
                БІЛЬШЕ
                <br />
                КОНТЕКСТУ.
                <br />
                БІЛЬШЕ
                <br />
                КОНТРОЛЮ.
              </span>
              <div />
              <span>
                ДЛЯ ТИХ,
                <br />
                ХТО ДУМАЄ
                <br />
                ДАЛІ.
              </span>
              <ArrowDown />
            </aside>
            <div className="lp-hero-bottom">
              <div className="lp-games">
                <span>
                  <img src="/assets/game-cs2.svg" alt="" /> CS2
                </span>
                <i />
                <span>
                  <img src="/assets/game-dota2.svg" alt="" /> Dota 2
                </span>
              </div>
              <p>
                Ті самі матчі.
                <br />
                <strong>Інший погляд на свої рішення.</strong>
              </p>
              <a href="#how-it-works" aria-label="Дізнатись, як працює MatchIQ">
                <ArrowDown size={22} />
              </a>
            </div>
          </section>
          <section
            className="lp-section lp-journey"
            id="how-it-works"
            aria-labelledby="journey-title"
          >
            <Reveal className="lp-section-heading">
              <div>
                <Eyebrow>01 / ВІД ЗАПИСУ ДО ВИСНОВКУ</Eyebrow>
                <h2 id="journey-title">
                  Одна ставка.
                  <br />
                  Повна історія.
                </h2>
              </div>
              <p>
                Збережи не лише результат,
                <br />а й причину свого рішення.
                <br />
                <span>Подивись, як це працює.</span>
              </p>
            </Reveal>
            <div className="lp-journey-grid" ref={journeyRef}>
              <Reveal className="lp-steps">
                {steps.map((step, index) => (
                  <button
                    type="button"
                    key={step.label}
                    className={`lp-step ${activeStep === index ? "is-active" : ""}`}
                    aria-pressed={activeStep === index}
                    onClick={() => setActiveStep(index)}
                  >
                    <span className="lp-step-number">0{index + 1}</span>
                    <span>
                      <strong>{step.title}</strong>
                      <small>{step.caption}</small>
                    </span>
                    <ChevronRight size={20} aria-hidden="true" />
                  </button>
                ))}
              </Reveal>
              <div className="lp-journey-sticky">
                <JourneyPreview active={activeStep} />
              </div>
            </div>
            <p className="lp-example-note">
              Ілюстративний приклад інтерфейсу. Усі суми та результати —
              демонстраційні.
            </p>
          </section>
          <ProductExplorer />
          <section
            className="lp-section lp-analytics lp-dark"
            id="features"
            aria-labelledby="analytics-title"
          >
            <div className="lp-analytics-grid">
              <Reveal className="lp-analytics-intro">
                <Eyebrow>03 / АНАЛІТИКА</Eyebrow>
                <h2 id="analytics-title">
                  Не просто
                  <br />
                  цифри.
                  <br />
                  <span>Відповіді.</span>
                </h2>
                <p>
                  Побач закономірності, які губляться між окремими ставками.
                </p>
                <div className="lp-intro-rule" />
                <span className="lp-small-label">
                  МЕНШЕ ЗДОГАДОК.
                  <br />
                  БІЛЬШЕ ВЛАСНИХ ДАНИХ.
                </span>
              </Reveal>
              <div className="lp-analytics-rows">
                <Reveal className="lp-analytics-row">
                  <div>
                    <span className="lp-row-index">/ 01</span>
                    <h3>
                      Який результат
                      <br />
                      за місяць?
                    </h3>
                    <p>
                      Прибуток і збитки, динаміка банкролу та історія твоєї гри.
                    </p>
                  </div>
                  <MonthlyChart />
                </Reveal>
                <Reveal className="lp-analytics-row">
                  <div>
                    <span className="lp-row-index">/ 02</span>
                    <h3>
                      Яка стратегія
                      <br />
                      працює краще?
                    </h3>
                    <p>
                      Порівнюй результати стратегій на основі власних записів.
                    </p>
                  </div>
                  <Comparison />
                </Reveal>
                <Reveal className="lp-analytics-row">
                  <div>
                    <span className="lp-row-index">/ 03</span>
                    <h3>
                      Де я втрачаю
                      <br />
                      найбільше?
                    </h3>
                    <p>
                      Досліджуй результати за грою та типом ставки. Знаходь те,
                      що варто переглянути.
                    </p>
                  </div>
                  <Comparison games />
                </Reveal>
              </div>
            </div>
          </section>
          <section
            className="lp-section lp-discipline"
            aria-labelledby="discipline-title"
          >
            <div className="lp-discipline-grid">
              <Reveal>
                <Eyebrow>04 / ДИСЦИПЛІНА</Eyebrow>
                <h2 id="discipline-title">
                  Твої правила.
                  <br />
                  Перед кожною
                  <br />
                  ставкою.
                </h2>
                <p className="lp-section-description">
                  Менше імпульсивних рішень.
                  <br />
                  Більше усвідомлених.
                </p>
                <ul className="lp-benefits">
                  <li>
                    <ShieldCheck />
                    <div>
                      <h3>Перевірка стратегії</h3>
                      <p>Зіставляй ставку зі своїми правилами.</p>
                    </div>
                  </li>
                  <li>
                    <Flag />
                    <div>
                      <h3>Ризикові команди</h3>
                      <p>Тримай власні застереження перед очима.</p>
                    </div>
                  </li>
                  <li>
                    <Target />
                    <div>
                      <h3>Прогрес цілей</h3>
                      <p>Пов’язуй записи з особистими цілями.</p>
                    </div>
                  </li>
                </ul>
              </Reveal>
              <Reveal className="lp-discipline-preview" delay={0.1}>
                <div className="lp-preview-top">
                  <span>Перед збереженням ставки</span>
                  <DemoLabel />
                </div>
                <StrategyCheck />
                <div className="lp-risk-block">
                  <Flag />
                  <div>
                    <h3>Команда у списку ризикових</h3>
                    <p>Твоя позначка: «Обережно»</p>
                  </div>
                </div>
                <div className="lp-goal-block">
                  <div>
                    <Target />
                    <span>Особиста ціль</span>
                    <strong>35%</strong>
                  </div>
                  <p>Прибуток за місяць · 2 000 ₴</p>
                  <div className="lp-goal-track">
                    <motion.span
                      initial={reduced ? false : { scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: reduced ? 0 : 1 }}
                      style={{ transformOrigin: "left" }}
                    />
                  </div>
                  <div className="lp-axis">
                    <span>700 ₴ / 2 000 ₴</span>
                    <span>У процесі</span>
                  </div>
                </div>
                <div className="lp-discipline-foot">
                  <Check size={15} /> Правила задаєш ти. MatchIQ допомагає їх
                  помітити.
                </div>
              </Reveal>
            </div>
          </section>
          <DataOwnership />
          <section
            className="lp-demo-section lp-dark"
            aria-labelledby="demo-title"
          >
            <div className="lp-demo-photo" />
            <Reveal className="lp-demo-copy">
              <Eyebrow>06 / СПРОБУЙ MATCHIQ</Eyebrow>
              <h2 id="demo-title">
                Пройди цей
                <br />
                шлях сам.
              </h2>
              <p>
                Переглянь матчі, спробуй облік ставок
                <br />і досліди аналітику в демо.
              </p>
              <DemoLink />
              <p className="lp-demo-access">
                Потрібні логін і пароль демо-облікового запису.
                <br />
                Без доступу?{" "}
                <a href="#possibilities">Досліди приклади вище ↗</a>
              </p>
            </Reveal>
            <p className="lp-demo-aside">
              ТІ САМІ МАТЧІ.
              <br />
              ІНШИЙ ПОГЛЯД.
            </p>
          </section>
          <section
            className="lp-section lp-faq"
            id="faq"
            aria-labelledby="faq-title"
          >
            <Reveal>
              <Eyebrow>07 / FAQ</Eyebrow>
              <h2 id="faq-title">
                Перед
                <br />
                початком.
              </h2>
              <p>
                Короткі відповіді
                <br />
                на важливі питання.
              </p>
            </Reveal>
            <AnimatedFAQ items={faqs} />
          </section>
          <section className="lp-final" aria-labelledby="final-title">
            <Reveal>
              <h2 id="final-title">
                Більше контексту.
                <br />
                Зваженіші рішення.
              </h2>
            </Reveal>
            <Reveal>
              <p>
                Твій кіберспорт.
                <br />
                Твоя історія. Твій контроль.
              </p>
              <DemoLink dark />
            </Reveal>
          </section>
        </main>
      </div>
      <footer className="lp-footer">
        <Link to="/" aria-label="MatchIQ — головна">
          <Brand />
        </Link>
        <p>Трекер та аналітика.</p>
        <nav aria-label="Навігація у футері">
          <a href="#possibilities">Можливості</a>
          <a href="#how-it-works">Як це працює</a>
          <a href="#faq">FAQ</a>
          <Link to="/login">Увійти</Link>
        </nav>
        <small>
          © {new Date().getFullYear()} MatchIQ
          <br />
          CS2 / Dota 2
        </small>
      </footer>
    </div>
  );
}

export default function Landing() {
  return (
    <LandingMotion>
      <LandingContent />
    </LandingMotion>
  );
}
