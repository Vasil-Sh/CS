import { Link } from "react-router-dom";
import {
  TrendingUp,
  BarChart3,
  Shield,
  ArrowRight,
  ChevronRight,
  Menu,
  X,
  AlertTriangle,
  Moon,
  Sun,
  Globe,
  PlayCircle,
  XCircle,
  CheckCircle2,
  FileCheck,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { t, setLang, getLang, type Lang } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import {
  OrganizationStructuredData,
  WebAppStructuredData,
  FAQStructuredData,
} from "@/components/StructuredData";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<Lang>(getLang);
  const { theme, toggleTheme } = useTheme();
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const toggleLanguage = () => {
    const next: Lang = language === "uk" ? "en" : "uk";
    setLang(next);
    setLanguage(next);
  };

  const comparisonRows = [
    {
      situation: "Оцінка Edge",
      excel: '"Здається, вигідно" = Злив',
      matchiq: "EV-детектор: тільки математична вигода",
    },
    {
      situation: "Розмір позиції",
      excel: "Помилка у формулі = Мінус банк",
      matchiq: "Алгоритм Келлі з лімітом ризику",
    },
    {
      situation: "Психологія",
      excel: 'Паніка та "догон" = Тильт',
      matchiq: "Drawdown control: зупинка зливів",
    },
    {
      situation: "Аналіз прогресу",
      excel: "Купа цифр без логіки",
      matchiq: "Equity Curve: візуалізація вашого росту",
    },
  ];

  const faqItems = [
    {
      q: "Чи занадто це складно для мене?",
      a: "Ні. MatchIQ автоматизує всю математику. Вам потрібно лише вставити посилання — ми зробимо розрахунки за вас.",
    },
    {
      q: "Чи гарантує MatchIQ прибуток?",
      a: "Ні. Прибуток гарантує ваша дисципліна. Ми даємо інструменти, щоб ви її не порушували.",
    },
    {
      q: "Це дешевше за Excel?",
      a: "Це дешевше за одну емоційну помилку, яка зазвичай трапляється через відсутність контролю.",
    },
  ];

  return (
    <>
      {/* ═══ SEO ═══ */}
      <SEO
        title="Аналітика ставок на CS2"
        description="MatchIQ — професійний інструмент для аналітики ставок на CS2. EV-детектор, алгоритм Келлі, трекінг банкролу, AI-рекомендації та контроль ризиків."
        canonical="https://matchiq.pro/"
        ukHref="https://matchiq.pro/"
        enHref="https://matchiq.pro/"
      />
      <OrganizationStructuredData
        name="MatchIQ"
        description="CS2 Match Analytics and Betting Intelligence Platform"
        url="https://matchiq.pro"
      />
      <WebAppStructuredData offers={{ price: "0", priceCurrency: "USD" }} />
      <FAQStructuredData
        questions={faqItems.map((item) => ({
          question: item.q,
          answer: item.a,
        }))}
      />

      <main className="min-h-screen bg-[#fafaf9]">
        {/* ═══ Header / Navigation ═══ */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#e8e6e5]">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#3ba6f1] rounded-[10px] flex items-center justify-center">
                  <TrendingUp
                    className="w-5 h-5 text-white"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-lg font-display font-medium text-[#0c0a09] tracking-tight">
                  MatchIQ
                </span>
              </div>

              {/* Desktop Navigation — Center */}
              <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                <a
                  href="#features"
                  className="text-sm text-[#78716c] hover:text-[#0c0a09] transition-colors duration-200"
                >
                  Можливості
                </a>
                <a
                  href="#how-it-works"
                  className="text-sm text-[#78716c] hover:text-[#0c0a09] transition-colors duration-200"
                >
                  Як це працює
                </a>
                <a
                  href="#philosophy"
                  className="text-sm text-[#78716c] hover:text-[#0c0a09] transition-colors duration-200"
                >
                  Філософія
                </a>
                <a
                  href="#risks"
                  className="text-sm text-[#78716c] hover:text-[#0c0a09] transition-colors duration-200"
                >
                  Ризики
                </a>
                <a
                  href="#faq"
                  className="text-sm text-[#78716c] hover:text-[#0c0a09] transition-colors duration-200"
                >
                  FAQ
                </a>
              </nav>

              {/* Actions — Right */}
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={toggleLanguage}
                  className="h-9 px-3 flex items-center gap-1.5 rounded-full border border-[#e8e6e5] hover:border-[#3ba6f1]/40 hover:bg-[#c1e1f7]/20 transition-all text-sm text-[#78716c]"
                  aria-label="Toggle language"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {language}
                </button>

                <button
                  onClick={toggleTheme}
                  className="h-9 w-9 flex items-center justify-center rounded-full border border-[#e8e6e5] hover:border-[#3ba6f1]/40 hover:bg-[#c1e1f7]/20 transition-all text-[#78716c]"
                  aria-label="Toggle theme"
                >
                  {theme === "light" ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                </button>

                <Link to="/login">
                  <Button
                    variant="outline"
                    className="h-9 px-4 rounded-full border-[#e8e6e5] text-[#78716c] hover:text-[#0c0a09] hover:border-[#d6d3d1] bg-transparent font-normal text-sm"
                  >
                    Увійти
                  </Button>
                </Link>

                <Link to="/login">
                  <Button className="h-9 px-5 rounded-full bg-[#3ba6f1] hover:bg-[#3398e1] text-white font-normal text-sm shadow-none">
                    Почати аналіз
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden h-9 w-9 flex items-center justify-center rounded-full border border-[#e8e6e5] hover:bg-[#c1e1f7]/20 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4 text-[#0c0a09]" />
                ) : (
                  <Menu className="h-4 w-4 text-[#0c0a09]" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-[#e8e6e5] px-6 py-5 space-y-3">
              <a
                href="#features"
                className="block text-[#78716c] hover:text-[#0c0a09] transition-colors text-sm py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Можливості
              </a>
              <a
                href="#how-it-works"
                className="block text-[#78716c] hover:text-[#0c0a09] transition-colors text-sm py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Як це працює
              </a>
              <a
                href="#philosophy"
                className="block text-[#78716c] hover:text-[#0c0a09] transition-colors text-sm py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Філософія
              </a>
              <a
                href="#risks"
                className="block text-[#78716c] hover:text-[#0c0a09] transition-colors text-sm py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Ризики
              </a>
              <a
                href="#faq"
                className="block text-[#78716c] hover:text-[#0c0a09] transition-colors text-sm py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </a>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={toggleLanguage}
                  className="flex-1 h-10 px-3 flex items-center justify-center gap-1.5 rounded-full border border-[#e8e6e5] text-sm text-[#78716c]"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {language}
                </button>
                <button
                  onClick={toggleTheme}
                  className="h-10 w-10 flex items-center justify-center rounded-full border border-[#e8e6e5] text-[#78716c]"
                >
                  {theme === "light" ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                </button>
              </div>

              <Link to="/login" className="block pt-1">
                <Button
                  variant="outline"
                  className="w-full h-10 rounded-full border-[#e8e6e5] text-[#78716c] bg-transparent font-normal text-sm"
                >
                  Увійти
                </Button>
              </Link>
              <Link to="/login" className="block">
                <Button className="w-full h-10 rounded-full bg-[#3ba6f1] hover:bg-[#3398e1] text-white font-normal text-sm shadow-none">
                  Почати аналіз
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </header>

        {/* ═══ Hero Section ═══ */}
        <section
          aria-label="Головний екран"
          className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden"
        >
          {/* Subtle ambient glow — the only decorative flourish */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#3ba6f1]/[0.03] rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              {/* Heading — 52px, font-display, weight 400, tight tracking */}
              <h1 className="text-[40px] sm:text-[48px] lg:text-[52px] font-display font-normal text-[#0c0a09] tracking-[-0.021em] leading-[1.12] mb-6">
                Припиніть втрачати капітал через{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 text-[#3398e1]">
                    емоції та помилки
                  </span>
                  <span className="absolute inset-0 top-[0.6em] h-[0.35em] bg-[#c1e1f7] -z-0 rounded-full opacity-60" />
                </span>{" "}
                в розрахунках.
              </h1>

              {/* Subtitle — 16px body, warm gray, generous line-height */}
              <p className="text-base lg:text-lg text-[#78716c] font-light leading-[1.69] max-w-2xl mx-auto mb-10">
                <strong className="font-medium text-[#0c0a09]">MatchIQ</strong>{" "}
                — професійний бек-офіс для аналітиків та{" "}
                <strong className="font-medium text-[#0c0a09]">
                  інструмент контролю прогресу
                </strong>{" "}
                для кожного. Зменшуйте втрати, знаходьте перевагу над ринком та
                перетворюйте хаотичні рішення на стабільну стратегію.
              </p>

              {/* CTA — the loudest thing on the page by deliberate restraint */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
                <Link to="/login">
                  <Button className="h-12 px-8 rounded-full bg-[#3ba6f1] hover:bg-[#3398e1] text-white font-normal text-base shadow-none">
                    Перевірити свою ставку
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-1.5 h-12 px-6 rounded-full border border-[#e8e6e5] text-[#78716c] hover:text-[#0c0a09] hover:border-[#d6d3d1] transition-colors text-sm"
                >
                  Як це працює
                </a>
              </div>

              <p className="text-sm text-[#a8a29e] font-light">
                Без карти • 30с на старт • Твій прогрес заслуговує на точний
                облік
              </p>
            </div>

            {/* ═══ Dashboard Preview — the ONE element with a shadow ═══ */}
            <div className="mt-16 lg:mt-20 max-w-4xl mx-auto">
              <div className="relative">
                {/* 16px-blur floating shadow — reserved for exactly one element per page */}
                <div className="absolute -inset-4 bg-gradient-to-b from-[#3ba6f1]/5 to-transparent rounded-[32px] blur-2xl" />
                <div className="relative bg-white border border-[#e8e6e5] rounded-[20px] aspect-video overflow-hidden shadow-[0_8px_48px_rgba(0,0,0,0.06)]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-white border border-[#e8e6e5] flex items-center justify-center">
                        <PlayCircle
                          className="w-7 h-7 text-[#3ba6f1]"
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <span className="px-3 py-1.5 bg-white/90 backdrop-blur rounded-full text-xs text-[#a8a29e] border border-[#e8e6e5]">
                      Preview
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ How It Works — flat cards, 1px hairline ═══ */}
        <section
          id="how-it-works"
          aria-label="Як це працює"
          className="py-24 bg-white"
        >
          <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-[32px] font-display font-normal text-[#0c0a09] tracking-[-0.025em] leading-[1.25] mb-4">
                Як це працює
              </h2>
              <p className="text-base text-[#78716c] font-light max-w-xl mx-auto">
                Чотири кроки до повного контролю над вашим банкролом.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                {
                  icon: FileCheck,
                  title: "Протоколювання",
                  description: "Вставте URL матчу. Миттєвий імпорт даних.",
                },
                {
                  icon: Search,
                  title: "Верифікація",
                  description: "MatchIQ рахує вигоду та ризик.",
                },
                {
                  icon: Shield,
                  title: "Прийняття рішення",
                  description:
                    "Система підкаже, чи відповідає це рішення вашій стратегії.",
                },
                {
                  icon: BarChart3,
                  title: "Візуалізація",
                  description:
                    "Відстежуйте свій ROI та вінрейт у реальному часі.",
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="group relative bg-white border border-[#e8e6e5] rounded-2xl p-6 hover:border-[#3ba6f1]/30 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="w-10 h-10 rounded-[10px] bg-[#0c0a09] flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-medium text-[#0c0a09] mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#78716c] font-light leading-[1.64]">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══ Mini Demo — Validation Layer ═══ */}
        <section
          id="features"
          aria-label="Можливості та демонстрація"
          className="py-24 bg-[#fafaf9]"
        >
          <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-[32px] font-display font-normal text-[#0c0a09] tracking-[-0.025em] leading-[1.25] mb-4">
                Як виглядає{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 text-[#3398e1]">рішення</span>
                  <span className="absolute inset-0 top-[0.6em] h-[0.35em] bg-[#c1e1f7] -z-0 rounded-full opacity-60" />
                </span>{" "}
                в MatchIQ
              </h2>
              <p className="text-base text-[#78716c] font-light max-w-xl mx-auto">
                Реальний приклад аналізу матчу з розрахунком вигоди, ризику та
                персональним попередженням.
              </p>
            </div>

            <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-6">
              {/* Widget UI */}
              <div className="bg-white border border-[#e8e6e5] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5 pb-5 border-b border-[#e8e6e5]">
                  <div>
                    <p className="text-xs text-[#a8a29e] mb-1">Матч</p>
                    <p className="text-base font-medium text-[#0c0a09]">
                      Spirit vs FaZe
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#a8a29e] mb-1">Коефіцієнт</p>
                    <p className="text-base font-medium text-[#0c0a09]">1.85</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#78716c]">
                      Ваша впевненість
                    </span>
                    <span className="text-sm font-medium text-[#0c0a09]">
                      65%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#e8e6e5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3ba6f1] rounded-full"
                      style={{ width: "65%" }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <div className="p-4 bg-[#f0fdf7] border border-green-500/20 rounded-xl">
                      <p className="text-xs text-green-500 mb-1">💎 EV</p>
                      <p className="text-2xl font-medium text-green-500">
                        +4.2%
                      </p>
                    </div>
                    <div className="p-4 bg-[#eff8ff] border border-[#3ba6f1]/20 rounded-xl">
                      <p className="text-xs text-[#3ba6f1] mb-1">Kelly</p>
                      <p className="text-2xl font-medium text-[#3ba6f1]">
                        3.5%
                      </p>
                      <p className="text-[10px] text-[#a8a29e] mt-0.5">
                        від банку
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alert */}
              <div className="bg-[#fffbf5] border border-amber-500/20 rounded-2xl p-6 flex flex-col">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-[10px] flex items-center justify-center flex-shrink-0">
                    <AlertTriangle
                      className="w-5 h-5 text-amber-500"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-amber-500 font-semibold mb-1 uppercase tracking-wide">
                      Alert · Blacklist
                    </p>
                    <p className="text-base font-medium text-[#0c0a09]">
                      Особисте попередження
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[#78716c] leading-[1.64] italic flex-1">
                  "Пам'ятаєте свій злив на Spirit місяць тому? Ваш Blacklist
                  рекомендує обережність."
                </p>
                <div className="mt-5 pt-5 border-t border-amber-500/20">
                  <p className="text-xs text-[#a8a29e] leading-relaxed">
                    MatchIQ враховує вашу персональну історію помилок та
                    автоматично сигналізує про ризиковані патерни.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Excel vs MatchIQ Comparison ═══ */}
        <section
          id="risks"
          aria-label="Порівняння Excel та MatchIQ"
          className="py-24 bg-white"
        >
          <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-[32px] font-display font-normal text-[#0c0a09] tracking-[-0.025em] leading-[1.25] mb-4">
                Excel vs MatchIQ
              </h2>
              <p className="text-base text-[#78716c] font-light max-w-xl mx-auto">
                Чому ручний облік гальмує ваш розвиток — і як система прибирає
                хаос.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white border border-[#e8e6e5] rounded-2xl overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 bg-[#0c0a09] text-white">
                  <div className="p-5 font-medium text-xs uppercase tracking-wide border-b md:border-b-0 md:border-r border-white/10">
                    Ситуація
                  </div>
                  <div className="p-5 font-medium text-xs uppercase tracking-wide border-b md:border-b-0 md:border-r border-white/10">
                    Помилка в Excel / "На око"
                  </div>
                  <div className="p-5 font-medium text-xs uppercase tracking-wide">
                    Рішення в MatchIQ
                  </div>
                </div>

                {comparisonRows.map((row, index) => (
                  <div
                    key={index}
                    className={`grid grid-cols-1 md:grid-cols-3 ${index !== comparisonRows.length - 1 ? "border-b border-[#e8e6e5]" : ""}`}
                  >
                    <div className="p-5 font-medium text-[#0c0a09] bg-[#fafaf9] border-b md:border-b-0 md:border-r border-[#e8e6e5]">
                      {row.situation}
                    </div>
                    <div className="p-5 flex items-start gap-3 border-b md:border-b-0 md:border-r border-[#e8e6e5]">
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-[#78716c]">
                        {row.excel}
                      </span>
                    </div>
                    <div className="p-5 flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-[#0c0a09] font-medium">
                        {row.matchiq}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cumulative Risk callout */}
              <div className="mt-6 bg-white border border-[#e8e6e5] rounded-2xl p-6 lg:p-8 flex items-start gap-5">
                <div className="w-10 h-10 bg-[#0c0a09] rounded-[10px] flex items-center justify-center flex-shrink-0">
                  <TrendingUp
                    className="w-5 h-5 text-white"
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#3ba6f1] uppercase tracking-wide mb-2">
                    📈 Cumulative Risk
                  </p>
                  <p className="text-sm text-[#78716c] leading-[1.64]">
                    Навіть 3–5% системної помилки з'їдають ваш банк.{" "}
                    <strong className="font-medium text-[#0c0a09]">
                      MatchIQ
                    </strong>{" "}
                    зупиняє хаос та перетворює його на зрозумілий графік
                    прогресу.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Philosophy Section ═══ */}
        <section
          id="philosophy"
          aria-label="Філософія та підхід"
          className="py-24 bg-[#fafaf9]"
        >
          <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-[32px] font-display font-normal text-[#0c0a09] tracking-[-0.025em] leading-[1.25] mb-4">
                  Data over Luck
                </h2>
                <p className="text-base text-[#78716c] font-light">
                  Від профі до відповідальних гравців — система для всіх, хто
                  серйозно ставиться до результату.
                </p>
              </div>

              <div className="bg-white border border-[#e8e6e5] rounded-2xl p-8 lg:p-10">
                {/* Not predictions */}
                <div className="flex items-start gap-4 mb-8 pb-8 border-b border-[#e8e6e5]">
                  <div className="w-10 h-10 bg-red-50 rounded-[10px] flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">
                      Ми не даємо прогнозів
                    </p>
                    <p className="text-sm text-[#78716c] leading-[1.64]">
                      MatchIQ — це дзеркало вашої дисципліни, а не магічний
                      алгоритм.
                    </p>
                  </div>
                </div>

                {/* For whom */}
                <div className="mb-8">
                  <p className="text-xs font-semibold text-[#3ba6f1] uppercase tracking-wide mb-4">
                    👤 Для кого це
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-5 bg-[#eff8ff] rounded-xl border border-[#3ba6f1]/15">
                      <p className="font-medium text-[#0c0a09] mb-1.5">
                        Професіонали
                      </p>
                      <p className="text-sm text-[#78716c] leading-[1.64]">
                        Для масштабування складних моделей та систематизації
                        процесу.
                      </p>
                    </div>
                    <div className="p-5 bg-[#fafaf9] rounded-xl border border-[#e8e6e5]">
                      <p className="font-medium text-[#0c0a09] mb-1.5">
                        Новачки та Аматори
                      </p>
                      <p className="text-sm text-[#78716c] leading-[1.64]">
                        Для тих, хто хоче бачити реальну статистику, уникати
                        тильту та вчитися контролю банку.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Not for whom */}
                <div className="flex items-start gap-4 p-5 bg-red-50 rounded-xl border border-red-500/15">
                  <div className="w-9 h-9 bg-white rounded-[10px] flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">⛔</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">
                      Не для кого
                    </p>
                    <p className="text-sm text-[#78716c] leading-[1.64]">
                      Шукачі "швидких грошей" та ті, хто не готовий до
                      відповідальності за свій результат.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FAQ Section ═══ */}
        <section
          id="faq"
          aria-label="Часті запитання"
          className="py-24 bg-white"
        >
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-[32px] font-display font-normal text-[#0c0a09] tracking-[-0.025em] leading-[1.25] mb-4">
                Питання та відповіді
              </h2>
              <p className="text-base text-[#78716c] font-light">
                Все, що вам варто знати перед стартом.
              </p>
            </div>

            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-white border border-[#e8e6e5] rounded-xl overflow-hidden hover:border-[#3ba6f1]/30 transition-colors"
                >
                  <button
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="text-sm font-medium text-[#0c0a09] pr-4">
                      {item.q}
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 text-[#a8a29e] flex-shrink-0 transition-transform duration-200 ${
                        openFAQ === index ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  {openFAQ === index && (
                    <div className="px-5 pb-5">
                      <p className="text-sm text-[#78716c] leading-[1.64]">
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CTA Section ═══ */}
        <section className="py-24 bg-[#fafaf9]">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-[32px] font-display font-normal text-[#0c0a09] tracking-[-0.025em] leading-[1.25] mb-4">
                Твій банк — твоя відповідальність.
              </h2>
              <p className="text-base text-[#78716c] font-light mb-10">
                Почни аналізувати ставки професійно вже сьогодні.
              </p>
              <Link to="/login">
                <Button className="h-12 px-8 rounded-full bg-[#3ba6f1] hover:bg-[#3398e1] text-white font-normal text-base shadow-none">
                  Почати аналіз
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <p className="text-sm text-[#a8a29e] font-light mt-6">
                Безкоштовний аналіз • Без реєстрації • Без ризику
              </p>
            </div>
          </div>
        </section>

        {/* ═══ Footer ═══ */}
        <footer className="py-10 border-t border-[#e8e6e5] bg-white">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp
                  className="w-4 h-4 text-[#3ba6f1]"
                  strokeWidth={1.5}
                />
                <span className="text-sm font-medium text-[#0c0a09]">
                  MatchIQ
                </span>
              </div>
              <p className="text-xs text-[#a8a29e]">
                © {new Date().getFullYear()} MatchIQ. Data over luck.
              </p>
              <div className="flex items-center gap-6">
                <a
                  href="#"
                  className="text-xs text-[#78716c] hover:text-[#0c0a09] transition-colors"
                >
                  Privacy
                </a>
                <a
                  href="#"
                  className="text-xs text-[#78716c] hover:text-[#0c0a09] transition-colors"
                >
                  Terms
                </a>
                <a
                  href="mailto:hello@matchiq.pro"
                  className="text-xs text-[#78716c] hover:text-[#0c0a09] transition-colors"
                >
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
