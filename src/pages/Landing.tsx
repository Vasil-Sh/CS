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
  { icon: BarChart3, label: "Огляд" },
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
type PreviewScreen =
  | "Огляд"
  | "Матчі"
  | "Журнал"
  | "Банкрол"
  | "Стратегії"
  | "Ризикові команди";
function PreviewHead({ title, text }: { title: string; text: string }) {
  return (
    <>
      <p className="mq-preview-hello">{title}</p>
      <p className="mq-preview-sub">{text}</p>
    </>
  );
}
function PreviewMatches() {
  const matches = [
    ["16:00", "NAVI", "Team Spirit", "BO3", "1.80", "2.05", "Є запис"],
    ["17:30", "Vitality", "G2", "BO3", "1.62", "2.35", ""],
    ["19:00", "Team Liquid", "Tundra", "BO3", "2.10", "1.74", "Live"],
    ["20:30", "FaZe", "MOUZ", "BO1", "1.65", "2.20", ""],
    ["22:00", "Falcons", "Aurora", "BO3", "1.55", "2.45", ""],
  ];
  return (
    <>
      <PreviewHead title="Матчі" text="Розклад, ваші позначки та аналіз." />
      <div className="mq-pv-kpis">
        <div>
          <span>Матчів на дату</span>
          <strong>24</strong>
        </div>
        <div>
          <span>Турнірів</span>
          <strong>6</strong>
        </div>
        <div>
          <span>Зараз грають</span>
          <strong>
            2 <i className="mq-pv-live" />
          </strong>
        </div>
      </div>
      <div className="mq-pv-chips">
        <b>Усі</b>
        <span>CS2</span>
        <span>Dota 2</span>
        <span>Закріплені</span>
      </div>
      <div className="mq-pv-list">
        {matches.map(([time, t1, t2, bo, o1, o2, tag]) => (
          <div key={time} className="mq-pv-match">
            <span className="mq-pv-time">{time}</span>
            <span className="mq-pv-teams">
              <b>{t1}</b>
              <small>vs {t2}</small>
            </span>
            <span className="mq-pv-bo">{bo}</span>
            <span className="mq-pv-odds">
              <i>{o1}</i>
              <i>{o2}</i>
            </span>
            {tag ? (
              <span className={`mq-pv-tag${tag === "Live" ? " is-live" : ""}`}>
                {tag}
              </span>
            ) : (
              <span className="mq-pv-action">Ординар</span>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
function PreviewJournal() {
  const rows = [
    ["01.11", "NAVI — Team Spirit", "П1 · CS2", "500 ₴", "1.80", "+400 ₴", "win"],
    ["31.10", "Vitality — G2 + 1", "Експрес · CS2", "300 ₴", "2.70", "+510 ₴", "win"],
    ["30.10", "Team Liquid — Tundra", "П1 · Dota 2", "300 ₴", "2.10", "−300 ₴", "loss"],
    ["30.10", "FaZe — MOUZ", "П1 · CS2", "300 ₴", "1.65", "+195 ₴", "win"],
    ["29.10", "Falcons — Aurora", "П2 · Dota 2", "250 ₴", "2.45", "Очікує", "wait"],
  ];
  return (
    <>
      <PreviewHead title="Журнал записів" text="Кожна ставка з причиною рішення." />
      <div className="mq-pv-chips">
        <b>Усі · 42</b>
        <span>Очікують · 3</span>
        <span>Виграші · 24</span>
        <span>Програші · 15</span>
      </div>
      <div className="mq-pv-table">
        <div className="mq-pv-tr is-head">
          <span>Дата</span>
          <span>Матч і вибір</span>
          <span>Сума</span>
          <span>Коеф.</span>
          <span>Прибуток</span>
        </div>
        {rows.map(([date, match, pick, sum, odd, profit, st]) => (
          <div className="mq-pv-tr" key={match}>
            <span>{date}</span>
            <span>
              <b>{match}</b>
              <small>{pick}</small>
            </span>
            <span>{sum}</span>
            <span>{odd}</span>
            <span className={`mq-pv-profit is-${st}`}>{profit}</span>
          </div>
        ))}
      </div>
      <div className="mq-pv-note">
        <b>Нотатка до NAVI — Team Spirit</b>
        «Перевірив формат матчу та власні правила перед записом.»
      </div>
    </>
  );
}
function PreviewBankroll() {
  const points = [30, 34, 31, 40, 38, 47, 44, 52, 58, 55, 63, 70];
  const path = points
    .map((v, i) => `${i ? "L" : "M"}${(i / (points.length - 1)) * 300} ${80 - v}`)
    .join(" ");
  return (
    <>
      <PreviewHead title="Аналітика" text="Картина ваших рішень — без шуму." />
      <div className="mq-pv-kpis">
        <div>
          <span>Чистий прибуток</span>
          <strong className="is-up">+2 860 ₴</strong>
        </div>
        <div>
          <span>ROI</span>
          <strong>+8.4%</strong>
        </div>
        <div>
          <span>Середній коеф.</span>
          <strong>1.92</strong>
        </div>
      </div>
      <div className="mq-pv-chart">
        <div className="mq-pv-chart-head">
          <b>Банкрол</b>
          <span>10 000 ₴ → 12 480 ₴</span>
        </div>
        <svg viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="mq-pv-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#ff693b" stopOpacity="0.35" />
              <stop offset="1" stopColor="#ff693b" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L300 80 L0 80 Z`} fill="url(#mq-pv-fill)" />
          <path d={path} fill="none" stroke="#ff8a5c" strokeWidth="2" />
        </svg>
      </div>
      <div className="mq-pv-split">
        <div>
          <span>CS2</span>
          <b className="is-up">+2 140 ₴</b>
          <i style={{ width: "74%" }} />
        </div>
        <div>
          <span>Dota 2</span>
          <b className="is-up">+720 ₴</b>
          <i style={{ width: "26%" }} />
        </div>
      </div>
    </>
  );
}
function PreviewStrategies() {
  return (
    <>
      <PreviewHead title="Стратегії" text="Правила, які перевіряють кожен запис." />
      <div className="mq-pv-strategy is-main">
        <div className="mq-pv-strategy-top">
          <b>Збалансована стратегія</b>
          <span className="mq-pv-tag">Основна</span>
        </div>
        <p>Оптимальне співвідношення ризику та прибутку.</p>
        <div className="mq-pv-chips">
          <span>Коеф. 1.50–2.50</span>
          <span>BO1 та BO3</span>
          <span>Ординари й експреси</span>
          <span>Ризик: середній</span>
        </div>
        <div className="mq-pv-progress">
          <span>7 з 10 записів за правилами</span>
          <i>
            <i style={{ width: "70%" }} />
          </i>
        </div>
      </div>
      <div className="mq-pv-strategy">
        <div className="mq-pv-strategy-top">
          <b>Консервативна стратегія</b>
          <span className="mq-pv-muted">ROI +5.1%</span>
        </div>
        <p>Безпечний підхід з низьким ризиком.</p>
        <div className="mq-pv-chips">
          <span>Коеф. 1.30–1.80</span>
          <span>Тільки BO3</span>
          <span>Тільки ординари</span>
        </div>
      </div>
      <div className="mq-pv-goal">
        <b>Ціль листопада</b>
        <span>+1 500 ₴ · виконано 64%</span>
        <i>
          <i style={{ width: "64%" }} />
        </i>
      </div>
    </>
  );
}
function PreviewRisky() {
  const teams = [
    ["Team X", "CS2", "Ризиковані", "risk", "Не розглядати для ставки."],
    ["Team Y", "Dota 2", "Нестабільні", "unstable", "Сильно залежить від форми."],
    ["Team Z", "CS2", "Обережно", "careful", "Лише за конкретним сценарієм."],
    ["Team Q", "Dota 2", "Стабільні", "stable", "Передбачуваний результат."],
  ];
  return (
    <>
      <PreviewHead
        title="Ризикові команди"
        text="Правила, які допомагають не пропустити ризик перед ставкою."
      />
      <div className="mq-pv-chips">
        <b>Усі команди · 12</b>
        <span>Потребують уваги · 5</span>
        <span>Неоцінені · 2</span>
      </div>
      <div className="mq-pv-table is-risk">
        <div className="mq-pv-tr is-head">
          <span>Команда</span>
          <span>Статус</span>
          <span>Коментар</span>
        </div>
        {teams.map(([team, game, status, kind, note]) => (
          <div className="mq-pv-tr" key={team}>
            <span>
              <b>{team}</b>
              <small>{game}</small>
            </span>
            <span>
              <i className={`mq-pv-status is-${kind}`}>{status}</i>
            </span>
            <span className="mq-pv-muted">{note}</span>
          </div>
        ))}
      </div>
      <div className="mq-pv-warn">
        <ShieldAlert size={14} aria-hidden="true" />
        <span>
          <b>Попередження у формі запису</b>
          Team X у твоєму списку ризикованих. Точно ставити?
        </span>
      </div>
    </>
  );
}
function HeroPreview() {
  const [screen, setScreen] = useState<PreviewScreen>("Огляд");
  return (
    <div
      className="mq-preview"
      role="region"
      aria-label="Інтерактивний приклад інтерфейсу MatchIQ на демо-даних"
    >
      <LiquidBackdrop />
      <div className="mq-preview-window">
        <aside className="mq-preview-side">
          <span className="mq-preview-brand">
            <img src="/favicon.svg" width="18" height="18" alt="" /> MatchIQ
          </span>
          <small>Меню</small>
          <ul aria-label="Екрани застосунку">
            {previewMenu.map(({ icon: Icon, label }) => (
              <li key={label}>
                <button
                  type="button"
                  className={screen === label ? "is-active" : undefined}
                  aria-pressed={screen === label}
                  onClick={() => setScreen(label)}
                >
                  <Icon size={13} aria-hidden="true" /> {label}
                </button>
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
          <div className="mq-preview-tabs" aria-hidden="true">
            {previewMenu.map(({ label }) => (
              <button
                type="button"
                tabIndex={-1}
                key={label}
                className={screen === label ? "is-active" : undefined}
                onClick={() => setScreen(label)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mq-preview-top">
            <span>{screen}</span>
            <DemoBadge />
          </div>
          {screen !== "Огляд" ? (
            <div className="mq-preview-body mq-pv-screen" key={screen} aria-live="polite">
              {screen === "Матчі" && <PreviewMatches />}
              {screen === "Журнал" && <PreviewJournal />}
              {screen === "Банкрол" && <PreviewBankroll />}
              {screen === "Стратегії" && <PreviewStrategies />}
              {screen === "Ризикові команди" && <PreviewRisky />}
            </div>
          ) : (
          <div className="mq-preview-body mq-pv-screen" key="Огляд" aria-live="polite">
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
          )}
        </div>
      </div>
    </div>
  );
}
function StickyBar() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY;
      if (y < 700) setVisible(false);
      else if (delta < -6) setVisible(true);
      else if (delta > 6) setVisible(false);
      if (Math.abs(delta) > 6) lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div
      className={`mq-sticky${visible ? " is-visible" : ""}`}
      aria-hidden={!visible}
      inert={!visible}
    >
      <Link to="/" aria-label="MatchIQ — головна" className="mq-sticky-brand">
        <Mark />
      </Link>
      <nav aria-label="Швидка навігація">
        <a href="#possibilities">Можливості</a>
        <a href="#how-it-works">Як це працює</a>
        <a href="#compare">Порівняння</a>
        <a href="#tools">Інструменти</a>
        <a href="#pricing">Ціни</a>
        <a href="#faq">FAQ</a>
      </nav>
      <div className="mq-sticky-actions">
        <Link
          to="/login"
          className="mq-sticky-login"
          data-track="cta_login"
          data-track-place="sticky"
        >
          Увійти
        </Link>
        <a
          className="mq-button mq-button-sm"
          href={telegramLink(TG_ACCESS)}
          data-track="cta_access"
          data-track-place="sticky"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="mq-swap-in" aria-hidden="true">
            <ArrowUpRight size={14} />
          </span>
          <span className="mq-btn-label">Отримати доступ</span>{" "}
          <ArrowUpRight size={14} />
        </a>
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
          <a href="#compare">Порівняння</a>
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
          <span className="mq-swap-in" aria-hidden="true">
                <ArrowUpRight size={16} />
              </span>
              <span className="mq-btn-label">Увійти</span>{" "}
              <ArrowUpRight size={16} />
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
          <a href="#compare" onClick={() => setMenu(false)}>
            Порівняння
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
              <span className="mq-swap-in" aria-hidden="true">
                <ArrowUpRight size={18} />
              </span>
              <span className="mq-btn-label">Отримати доступ</span>{" "}
              <ArrowUpRight size={18} />
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
/** Counts a stat like "12 480" or "1 900+" up from zero when it scrolls into view. */
function CountUp({ value }: { value: string }) {
  const reduced = useContext(ReducedMotion);
  const ref = useRef<HTMLSpanElement>(null);
  const match = value.match(/^([\d\s\u00a0]+)(.*)$/);
  const target = match ? Number(match[1].replace(/[\s\u00a0]/g, "")) : NaN;
  const suffix = match ? match[2] : "";
  const format = (n: number) =>
    n.toLocaleString("uk-UA").replace(/[\s\u00a0\u202f]/g, " ") + suffix;
  const [shown, setShown] = useState(() =>
    Number.isFinite(target) && !reduced ? format(0) : value,
  );
  useEffect(() => {
    const element = ref.current;
    if (!element || !Number.isFinite(target)) return;
    if (reduced || typeof IntersectionObserver === "undefined") {
      setShown(value);
      return;
    }
    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const duration = 1600;
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setShown(t < 1 ? format(Math.round(target * eased)) : value);
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(element);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduced]);
  return (
    <span ref={ref} aria-hidden="true" className="mq-countup">
      {shown}
    </span>
  );
}
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
            <strong aria-label={value}>
              <CountUp value={value} />
            </strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="mq-marquee">
        <div className="mq-marquee-track">
        {[0, 1, 2, 3].flatMap((copy) =>
          testReviews.map((review) => (
          <figure
            key={`${copy}-${review.name}`}
            className="mq-quote"
            aria-hidden={copy > 0 ? true : undefined}
          >
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
          )),
        )}
        </div>
      </div>
    </section>
  );
}
const startSteps = [
  [
    "Напиши @cs2beet",
    "Натисни «Оформити підписку»: Telegram відкриється з уже готовим повідомленням.",
  ],
  [
    "Обери підписку й оплати",
    "Місячна або річна. Доступні способи оплати підкажуть прямо в чаті.",
  ],
  [
    "Отримай логін і заходь",
    "Після оплати надішлемо дані для входу. Увійти можна кнопкою «Увійти» вгорі сторінки.",
  ],
];
const comparisonRows = [
  [
    "Записати ставку",
    "Заповнюєш рядок вручну, формули легко зламати",
    "Обираєш матч із розкладу, сума в UAH або USD з конвертацією",
  ],
  [
    "Причина рішення",
    "Окремий стовпчик, який швидко перестаєш заповнювати",
    "Нотатка в кожному записі, поруч із результатом",
  ],
  [
    "Банкрол і ROI",
    "Власні формули та зведені таблиці",
    "Рахуються самі, за будь-який період",
  ],
  [
    "Порівняння стратегій",
    "Фільтри й копії аркушів",
    "Ігри, періоди й стратегії порівнюються в одному місці",
  ],
  [
    "Дисципліна",
    "Правила тримаєш у голові",
    "Перевірка коефіцієнта й попередження про ризикову команду до запису",
  ],
  [
    "Розклад матчів",
    "Окрема вкладка в браузері",
    "CS2 і Dota 2 в тому ж застосунку",
  ],
];
function Comparison() {
  return (
    <section
      className="mq-section mq-compare"
      id="compare"
      aria-label="Таблиця чи MatchIQ"
    >
      <SectionHeading
        label="03 / ТАБЛИЦЯ ЧИ MATCHIQ"
        title={
          <>
            Ти вже ведеш облік.
            <br />
            <span>Тепер без рутини.</span>
          </>
        }
      >
        Якщо твій журнал зараз — Google-таблиця, ось що зміниться.
      </SectionHeading>
      <div className="mq-vs" role="list" aria-label="Таблиця та MatchIQ по пунктах">
        <article className="mq-vs-card mq-vs-sheet" aria-label="Google-таблиця">
          <header className="mq-vs-head">
            <div className="mq-vs-sheet-icon" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <i key={i} />
              ))}
            </div>
            <div>
              <small>Зараз</small>
              <h3>Google-таблиця</h3>
            </div>
          </header>
          {comparisonRows.map(([task, sheet], i) => (
            <div className="mq-vs-item" data-row={i} key={task} role="listitem">
              <span className="mq-vs-mark is-minus" aria-hidden="true">
                <X size={13} />
              </span>
              <div>
                <b>{task}</b>
                <p>{sheet}</p>
              </div>
            </div>
          ))}
          <footer className="mq-vs-foot">
            Усе тримається на твоїй уважності й формулах.
          </footer>
        </article>
        <span className="mq-vs-badge" aria-hidden="true">
          vs
        </span>
        <article className="mq-vs-card mq-vs-app" aria-label="MatchIQ">
          <LiquidBackdrop />
          <header className="mq-vs-head">
            <img src="/favicon.svg" width="40" height="40" alt="" />
            <div>
              <small>З MatchIQ</small>
              <h3>Журнал, що рахує сам</h3>
            </div>
          </header>
          {comparisonRows.map(([task, , app], i) => (
            <div className="mq-vs-item" data-row={i} key={task} role="listitem">
              <span className="mq-vs-mark is-check" aria-hidden="true">
                <Check size={13} />
              </span>
              <div>
                <b>{task}</b>
                <p>{app}</p>
              </div>
            </div>
          ))}
          <footer className="mq-vs-foot">
            <a
              href="#possibilities"
              data-track="cta_demo"
              data-track-place="compare"
            >
              Подивитися на прикладі <ArrowUpRight size={14} />
            </a>
          </footer>
        </article>
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
        label="04 / БІЛЬШЕ КОНТЕКСТУ"
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
          <LiquidBackdrop />
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
        <p className="mq-kicker">05 / ЦІНИ</p>
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
              {plan.featured && <LiquidBackdrop />}
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
                <span className="mq-swap-in" aria-hidden="true">
                <ArrowUpRight size={18} />
              </span>
              <span className="mq-btn-label">Оформити підписку</span>{" "}
              <ArrowUpRight size={18} />
              </a>
            </article>
          </Reveal>
        ))}
      </div>
      <div className="mq-start" aria-labelledby="mq-start-title">
        <div className="mq-start-head">
          <h3 id="mq-start-title">Як почати</h3>
          <p>Оформлення займає кілька хвилин і проходить у Telegram.</p>
        </div>
        <ol className="mq-start-steps">
          {startSteps.map(([title, text], i) => (
            <li key={title}>
              <span>0{i + 1}</span>
              <h4>{title}</h4>
              <p>{text}</p>
            </li>
          ))}
        </ol>
        <p className="mq-pricing-footnote">
          Ціни в гривнях. Питання до оплати —{" "}
          <a
            href={telegramLink(TG_ACCESS)}
            target="_blank"
            rel="noopener noreferrer"
            data-track="cta_access"
            data-track-place="pricing_start"
          >
            @cs2beet у Telegram
          </a>
          .
        </p>
      </div>
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
        <p className="mq-kicker">06 / КОРОТКО ПРО ГОЛОВНЕ</p>
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
          <StickyBar />
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
                <a
                  className="mq-button"
                  href="#journal"
                  data-track="cta_demo"
                  data-track-place="journal_story"
                >
                  <span className="mq-swap-in" aria-hidden="true">
                    <ArrowUpRight size={18} />
                  </span>
                  <span className="mq-btn-label">Дослідити приклад запису</span>{" "}
                  <ArrowUpRight size={18} />
                </a>
              </Reveal>
            </section>
            <section className="mq-section mq-work" id="possibilities">
              <SectionHeading
                label="01 / ТВОЯ ГРА, ЗІБРАНА ДОКУПИ"
                title={
                  <>
                    Що ти зможеш
                    <br />
                    робити в <span>MatchIQ.</span>
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
            <Journey />
            <Comparison />
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
                <a href="#compare">Порівняння</a>
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
                className="mq-button mq-button-sm"
                href="https://playcity.gov.ua/borotba-z-ihrovoiu-zalezhnistiu"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="mq-swap-in" aria-hidden="true">
                  <ArrowUpRight size={14} />
                </span>
                <span className="mq-btn-label">
                  Допомога при ігровій залежності
                </span>{" "}
                <ArrowUpRight size={14} />
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
