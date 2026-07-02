import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { t, setLang, getLang, type Lang } from '@/lib/i18n';
import { SEO } from '@/components/SEO';
import { OrganizationStructuredData, WebAppStructuredData, FAQStructuredData } from '@/components/StructuredData';

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<Lang>(getLang);
  const { theme, toggleTheme } = useTheme();
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const toggleLanguage = () => {
    const next: Lang = language === 'uk' ? 'en' : 'uk';
    setLang(next);
    setLanguage(next);
  };

  const comparisonRows = [
    {
      situation: 'Оцінка Edge',
      excel: '"Здається, вигідно" = Злив',
      matchiq: 'EV-детектор: тільки математична вигода',
    },
    {
      situation: 'Розмір позиції',
      excel: 'Помилка у формулі = Мінус банк',
      matchiq: 'Алгоритм Келлі з лімітом ризику',
    },
    {
      situation: 'Психологія',
      excel: 'Паніка та "догон" = Тильт',
      matchiq: 'Drawdown control: зупинка зливів',
    },
    {
      situation: 'Аналіз прогресу',
      excel: 'Купа цифр без логіки',
      matchiq: 'Equity Curve: візуалізація вашого росту',
    },
  ];

  const faqItems = [
    {
      q: 'Чи занадто це складно для мене?',
      a: 'Ні. MatchIQ автоматизує всю математику. Вам потрібно лише вставити посилання — ми зробимо розрахунки за вас.',
    },
    {
      q: 'Чи гарантує MatchIQ прибуток?',
      a: 'Ні. Прибуток гарантує ваша дисципліна. Ми даємо інструменти, щоб ви її не порушували.',
    },
    {
      q: 'Це дешевше за Excel?',
      a: 'Це дешевше за одну емоційну помилку, яка зазвичай трапляється через відсутність контролю.',
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
      <WebAppStructuredData
        offers={{ price: '0', priceCurrency: 'USD' }}
      />
      <FAQStructuredData
        questions={faqItems.map((item) => ({
          question: item.q,
          answer: item.a,
        }))}
      />

    <main className="min-h-screen bg-[#F5F5F0]">
      {/* Header / Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b-2 border-[#E8E6DC]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#1a1a2e] rounded-[20px] flex items-center justify-center shadow-[0_4px_12px_rgba(26,26,46,0.2)]">
                <TrendingUp className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <span className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">
                MatchIQ
              </span>
            </div>

            {/* Desktop Navigation - Center */}
            <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
              <a href="#features" className="text-[#4a4a5a] hover:text-[#1a1a2e] transition-colors duration-200 text-sm font-medium">
                Можливості
              </a>
              <a href="#philosophy" className="text-[#4a4a5a] hover:text-[#1a1a2e] transition-colors duration-200 text-sm font-medium">
                Філософія
              </a>
              <a href="#risks" className="text-[#4a4a5a] hover:text-[#1a1a2e] transition-colors duration-200 text-sm font-medium">
                Ризики
              </a>
              <a href="#faq" className="text-[#4a4a5a] hover:text-[#1a1a2e] transition-colors duration-200 text-sm font-medium">
                FAQ
              </a>
            </nav>

            {/* Actions - Right */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Language switcher */}
              <button
                onClick={toggleLanguage}
                className="h-10 px-3 flex items-center gap-1.5 rounded-[14px] border-2 border-[#E8E6DC] hover:border-[#3e75ff]/40 hover:bg-[#f2f8ff] transition-all text-sm font-medium text-[#4a4a5a]"
                aria-label="Toggle language"
              >
                <Globe className="w-4 h-4" />
                {language}
              </button>

              {/* Theme switcher */}
              <button
                onClick={toggleTheme}
                className="h-10 w-10 flex items-center justify-center rounded-[14px] border-2 border-[#E8E6DC] hover:border-[#3e75ff]/40 hover:bg-[#f2f8ff] transition-all text-[#4a4a5a]"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </button>

              <Link to="/login">
                <Button
                  variant="outline"
                  className="h-10 px-5 !bg-transparent hover:!bg-transparent border-2 border-[#E8E6DC] hover:border-[#3e75ff] text-[#4a4a5a] hover:text-[#3e75ff] font-semibold rounded-[14px] transition-all text-sm"
                >
                  Увійти
                </Button>
              </Link>

              <Link to="/login">
                <Button className="h-10 px-5 bg-gradient-to-r from-[#3e75ff] to-[#5b8cff] hover:from-[#3568e8] hover:to-[#4f7ff0] text-white font-semibold rounded-[14px] shadow-[0_4px_16px_rgba(62,117,255,0.3)] hover:shadow-[0_8px_24px_rgba(62,117,255,0.4)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-sm">
                  Почати аналіз
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden w-12 h-12 flex items-center justify-center rounded-[16px] border-2 border-[#E8E6DC] hover:bg-[#f2f8ff] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-[#1a1a2e]" />
              ) : (
                <Menu className="h-5 w-5 text-[#1a1a2e]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-[#E8E6DC] px-6 py-6 space-y-4">
            <a
              href="#features"
              className="block text-[#4a4a5a] hover:text-[#1a1a2e] transition-colors text-base font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Можливості
            </a>
            <a
              href="#philosophy"
              className="block text-[#4a4a5a] hover:text-[#1a1a2e] transition-colors text-base font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Філософія
            </a>
            <a
              href="#risks"
              className="block text-[#4a4a5a] hover:text-[#1a1a2e] transition-colors text-base font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ризики
            </a>
            <a
              href="#faq"
              className="block text-[#4a4a5a] hover:text-[#1a1a2e] transition-colors text-base font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </a>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={toggleLanguage}
                className="flex-1 h-11 px-3 flex items-center justify-center gap-1.5 rounded-[14px] border-2 border-[#E8E6DC] text-sm font-medium text-[#4a4a5a]"
              >
                <Globe className="w-4 h-4" />
                {language}
              </button>
              <button
                onClick={toggleTheme}
                className="h-11 w-11 flex items-center justify-center rounded-[14px] border-2 border-[#E8E6DC] text-[#4a4a5a]"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </div>

            <Link to="/login" className="block pt-2">
              <Button
                variant="outline"
                className="w-full h-12 !bg-transparent hover:!bg-transparent border-2 border-[#E8E6DC] hover:border-[#3e75ff] text-[#4a4a5a] hover:text-[#3e75ff] font-semibold rounded-[18px] text-sm"
              >
                Увійти
              </Button>
            </Link>
            <Link to="/login" className="block">
              <Button className="w-full h-12 bg-gradient-to-r from-[#3e75ff] to-[#5b8cff] hover:from-[#3568e8] hover:to-[#4f7ff0] text-white font-semibold rounded-[18px] shadow-[0_4px_16px_rgba(62,117,255,0.3)] text-sm">
                Почати аналіз
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section aria-label="Головний екран" className="relative pt-32 pb-20 lg:pt-44 lg:pb-28 overflow-hidden">
        {/* Background Pattern */}
        <svg className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="landing-grid" patternUnits="userSpaceOnUse" width="48" height="48">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#000000" strokeWidth="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#landing-grid)" />
        </svg>

        <div className="absolute top-20 left-[-10%] w-[500px] h-[500px] bg-[#3e75ff]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-[-10%] w-[400px] h-[400px] bg-[#5b8cff]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1a1a2e] tracking-tight leading-[1.1] mb-6">
              Припиніть втрачати капітал через{' '}
              <span className="bg-gradient-to-r from-[#3e75ff] to-[#5b8cff] bg-clip-text text-transparent">
                емоції та помилки
              </span>{' '}
              в розрахунках.
            </h1>

            {/* Subtitle */}
            <p className="text-lg lg:text-xl text-[#6a6a7a] font-light leading-relaxed max-w-3xl mx-auto mb-10">
              <strong className="font-semibold text-[#4a4a5a]">MatchIQ</strong> — це професійний бек-офіс для аналітиків та{' '}
              <strong className="font-semibold text-[#4a4a5a]">інструмент контролю прогресу</strong> для кожного. Зменшуйте втрати, знаходьте перевагу над ринком та перетворюйте хаотичні рішення на стабільну стратегію.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Link to="/login">
                <Button className="h-14 px-8 bg-gradient-to-r from-[#3e75ff] to-[#5b8cff] hover:from-[#3568e8] hover:to-[#4f7ff0] text-white shadow-[0_8px_24px_rgba(62,117,255,0.35)] hover:shadow-[0_12px_32px_rgba(62,117,255,0.45)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-3xl text-lg font-semibold">
                  Перевірити свою ставку
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Micro-copy */}
            <p className="text-sm text-[#8B8B9A] font-light">
              Без карти • 30с на старт • Твій прогрес заслуговує на точний облік
            </p>
          </div>

          {/* Hero Media Placeholder */}
          <div className="mt-16 lg:mt-20 max-w-5xl mx-auto">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#3e75ff]/10 via-[#5b8cff]/5 to-[#3e75ff]/10 rounded-[40px] blur-2xl" />
              <div className="relative bg-gradient-to-br from-[#FAFAF8] to-white border-2 border-[#E8E6DC] rounded-[32px] aspect-video overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-white border-2 border-[#E8E6DC] flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                      <PlayCircle className="w-8 h-8 text-[#3e75ff]" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
                  <span className="px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full text-xs font-medium text-[#6a6a7a] border border-[#E8E6DC]">
                    Preview
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mini Demo - Validation Layer */}
      <section id="features" aria-label="Можливості та демонстрація" className="py-20 lg:py-28 mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[112px] pr-[0px] pb-[112px] pl-[0px] rounded-none text-[16px] font-normal text-[#020817] bg-[#FFFFFF] opacity-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl lg:text-5xl font-bold text-[#1a1a2e] tracking-tight mb-4">
              Як виглядає рішення в MatchIQ
            </h2>
            <p className="text-lg text-[#6a6a7a] font-light max-w-2xl mx-auto">
              Реальний приклад аналізу матчу з розрахунком вигоди, ризику та персональним попередженням.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-6">
            {/* Widget UI */}
            <div className="bg-gradient-to-br from-[#FAFAF8] to-white border-2 border-[#E8E6DC] rounded-[28px] p-7 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-5 pb-5 border-b-2 border-[#E8E6DC]">
                <div>
                  <p className="text-xs text-[#8B8B9A] font-medium mb-1">Матч</p>
                  <p className="text-lg font-semibold text-[#1a1a2e]">Spirit vs FaZe</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#8B8B9A] font-medium mb-1">Коефіцієнт</p>
                  <p className="text-lg font-semibold text-[#1a1a2e]">1.85</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6a6a7a]">Ваша впевненість</span>
                  <span className="text-sm font-semibold text-[#1a1a2e]">65%</span>
                </div>
                <div className="w-full h-2 bg-[#E8E6DC] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#3e75ff] to-[#5b8cff] rounded-full" style={{ width: '65%' }} />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div className="p-4 bg-[#ECFDF5] border-2 border-[#22C55E]/20 rounded-[16px]">
                    <p className="text-xs text-[#22C55E] font-medium mb-1">💎 EV</p>
                    <p className="text-2xl font-bold text-[#22C55E]">+4.2%</p>
                  </div>
                  <div className="p-4 bg-[#f2f8ff] border-2 border-[#3e75ff]/20 rounded-[16px]">
                    <p className="text-xs text-[#3e75ff] font-medium mb-1">Kelly</p>
                    <p className="text-2xl font-bold text-[#3e75ff]">3.5%</p>
                    <p className="text-[10px] text-[#8B8B9A] mt-0.5">від банку</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Alert */}
            <div className="bg-gradient-to-br from-[#FFF7ED] to-[#FFFBF5] border-2 border-[#F59E0B]/30 rounded-[28px] p-7 shadow-[0_8px_32px_rgba(245,158,11,0.08)] flex flex-col">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-[16px] flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-[#F59E0B]" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-xs text-[#F59E0B] font-semibold mb-1 uppercase tracking-wide">Alert · Blacklist</p>
                  <p className="text-base font-semibold text-[#1a1a2e]">Особисте попередження</p>
                </div>
              </div>
              <p className="text-base text-[#4a4a5a] leading-relaxed italic flex-1">
                "Пам'ятаєте свій злив на Spirit місяць тому? Ваш Blacklist рекомендує обережність."
              </p>
              <div className="mt-5 pt-5 border-t-2 border-[#F59E0B]/20">
                <p className="text-xs text-[#8B8B9A] font-light leading-relaxed">
                  MatchIQ враховує вашу персональну історію помилок та автоматично сигналізує про ризиковані патерни.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Excel vs MatchIQ Comparison */}
      <section id="risks" aria-label="Порівняння Excel та MatchIQ" className="py-20 lg:py-28 bg-[#F5F5F0]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl lg:text-5xl font-bold text-[#1a1a2e] tracking-tight mb-4">
              Excel vs MatchIQ
            </h2>
            <p className="text-lg text-[#6a6a7a] font-light max-w-2xl mx-auto">
              Чому ручний облік гальмує ваш розвиток — і як система прибирає хаос.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="bg-white border-2 border-[#E8E6DC] rounded-[28px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
              {/* Table Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 bg-[#1a1a2e] text-white">
                <div className="p-5 font-semibold text-sm uppercase tracking-wide border-b md:border-b-0 md:border-r border-white/10">
                  Ситуація
                </div>
                <div className="p-5 font-semibold text-sm uppercase tracking-wide border-b md:border-b-0 md:border-r border-white/10">
                  Помилка в Excel / "На око"
                </div>
                <div className="p-5 font-semibold text-sm uppercase tracking-wide">
                  Рішення в MatchIQ
                </div>
              </div>

              {/* Rows */}
              {comparisonRows.map((row, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-1 md:grid-cols-3 ${index !== comparisonRows.length - 1 ? 'border-b-2 border-[#E8E6DC]' : ''}`}
                >
                  <div className="p-5 font-semibold text-[#1a1a2e] bg-[#FAFAF8] border-b md:border-b-0 md:border-r border-[#E8E6DC]">
                    {row.situation}
                  </div>
                  <div className="p-5 flex items-start gap-3 border-b md:border-b-0 md:border-r border-[#E8E6DC]">
                    <XCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
                    <span className="text-[#6a6a7a] font-light">{row.excel}</span>
                  </div>
                  <div className="p-5 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#22C55E] flex-shrink-0 mt-0.5" />
                    <span className="text-[#4a4a5a] font-medium">{row.matchiq}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Cumulative Risk callout */}
            <div className="mt-8 bg-white border-2 border-[#E8E6DC] rounded-[24px] p-6 lg:p-8 flex items-start gap-5 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
              <div className="w-14 h-14 bg-gradient-to-br from-[#3e75ff] to-[#5b8cff] rounded-[18px] flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(62,117,255,0.25)]">
                <TrendingUp className="w-7 h-7 text-white" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#3e75ff] uppercase tracking-wide mb-2">
                  📈 Cumulative Risk
                </p>
                <p className="text-base lg:text-lg text-[#4a4a5a] leading-relaxed">
                  Навіть 3–5% системної помилки з'їдають ваш банк. <strong className="font-semibold text-[#1a1a2e]">MatchIQ</strong> зупиняє хаос та перетворює його на зрозумілий графік прогресу.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Execution Flow */}
      <section id="how-it-works" aria-label="Як це працює" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl lg:text-5xl font-bold text-[#1a1a2e] tracking-tight mb-4">
              🚀 Як це працює
            </h2>
            <p className="text-lg text-[#6a6a7a] font-light max-w-2xl mx-auto">
              Чотири кроки до повного контролю.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: FileCheck,
                title: 'Протоколювання',
                description: 'Вставте URL матчу. Миттєвий імпорт даних.',
              },
              {
                icon: Search,
                title: 'Верифікація',
                description: 'MatchIQ рахує вигоду та ризик.',
              },
              {
                icon: Shield,
                title: 'Прийняття рішення',
                description: 'Система підкаже, чи відповідає це рішення вашій стратегії.',
              },
              {
                icon: BarChart3,
                title: 'Візуалізація',
                description: 'Відстежуйте свій ROI та вінрейт у реальному часі.',
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-[#FAFAF8] border-2 border-[#E8E6DC] rounded-[24px] p-7 hover:border-[#3e75ff]/30 hover:shadow-[0_8px_32px_rgba(62,117,255,0.08)] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-[#1a1a2e] rounded-[18px] flex items-center justify-center mb-5 shadow-[0_4px_12px_rgba(26,26,46,0.15)] group-hover:shadow-[0_8px_20px_rgba(26,26,46,0.2)] transition-shadow">
                    <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold text-[#1a1a2e] mb-2">{item.title}</h3>
                  <p className="text-sm text-[#6a6a7a] font-light leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="philosophy" aria-label="Філософія та підхід" className="py-20 lg:py-28 bg-[#F5F5F0]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl lg:text-5xl font-bold text-[#1a1a2e] tracking-tight mb-4">
                Data over Luck
              </h2>
              <p className="text-lg text-[#6a6a7a] font-light">
                Від профі до відповідальних гравців — система для всіх, хто серйозно ставиться до результату.
              </p>
            </div>

            <div className="bg-white border-2 border-[#E8E6DC] rounded-[32px] p-8 lg:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
              {/* Not predictions */}
              <div className="flex items-start gap-4 mb-8 pb-8 border-b-2 border-[#E8E6DC]">
                <div className="w-12 h-12 bg-[#FEE2E2] rounded-[16px] flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-6 h-6 text-[#EF4444]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#EF4444] uppercase tracking-wide mb-1">Ми не даємо прогнозів</p>
                  <p className="text-lg text-[#4a4a5a] leading-relaxed">
                    MatchIQ — це дзеркало вашої дисципліни, а не магічний алгоритм.
                  </p>
                </div>
              </div>

              {/* For whom */}
              <div className="mb-8">
                <p className="text-sm font-semibold text-[#3e75ff] uppercase tracking-wide mb-5">👤 Для кого це</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-5 bg-[#f2f8ff] rounded-[20px] border-2 border-[#3e75ff]/15">
                    <p className="font-semibold text-[#1a1a2e] mb-2">Професіонали</p>
                    <p className="text-sm text-[#6a6a7a] leading-relaxed font-light">
                      Для масштабування складних моделей та систематизації процесу.
                    </p>
                  </div>
                  <div className="p-5 bg-[#FAFAF8] rounded-[20px] border-2 border-[#E8E6DC]">
                    <p className="font-semibold text-[#1a1a2e] mb-2">Новачки та Аматори</p>
                    <p className="text-sm text-[#6a6a7a] leading-relaxed font-light">
                      Для тих, хто хоче бачити реальну статистику, уникати тильту та вчитися контролю банку.
                    </p>
                  </div>
                </div>
              </div>

              {/* Not for whom */}
              <div className="flex items-start gap-4 p-5 bg-[#FEF2F2] rounded-[20px] border-2 border-[#EF4444]/15">
                <div className="w-10 h-10 bg-white rounded-[14px] flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">⛔</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#EF4444] uppercase tracking-wide mb-1">Не для кого</p>
                  <p className="text-sm text-[#6a6a7a] leading-relaxed">
                    Шукачі "швидких грошей" та ті, хто не готовий до відповідальності за свій результат.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" aria-label="Часті запитання" className="py-20 lg:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-[#1a1a2e] tracking-tight mb-4">
              ❓ Питання та відповіді
            </h2>
            <p className="text-lg text-[#6a6a7a] font-light">
              Все, що вам варто знати перед стартом.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="bg-[#FAFAF8] border-2 border-[#E8E6DC] rounded-[20px] overflow-hidden hover:border-[#3e75ff]/30 transition-all"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-semibold text-[#1a1a2e] pr-4">💬 {item.q}</span>
                  <ChevronRight
                    className={`w-5 h-5 text-[#3e75ff] flex-shrink-0 transition-transform ${
                      openFAQ === index ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                {openFAQ === index && (
                  <div className="px-6 pb-6 -mt-1">
                    <p className="text-[#6a6a7a] font-light leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Side image placeholder */}
          <div className="mt-12 bg-white border-2 border-dashed border-[#cfcfc8] rounded-[24px] p-10 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-[#F5F5F0] rounded-[18px] flex items-center justify-center mb-3">
              <ImageIcon className="w-8 h-8 text-[#8B8B9A]" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-[#4a4a5a] mb-0.5">Візуал комʼюніті</p>
            <p className="text-xs text-[#8B8B9A] font-light">Тут буде фото або відео</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section aria-label="Заклик до дії" className="py-20 lg:py-28 bg-[#1a1a2e] relative overflow-hidden">
        <div className="absolute top-0 left-[-10%] w-[400px] h-[400px] bg-[#3e75ff]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-[-10%] w-[300px] h-[300px] bg-[#5b8cff]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-6">
            Твій банк — твоя відповідальність.
          </h2>
          <p className="text-xl text-[#8B8B9A] font-light mb-10 max-w-2xl mx-auto">
            Твій прогрес — наш пріоритет. Почни контроль сьогодні.
          </p>
          <Link to="/login">
            <Button className="h-16 px-12 bg-gradient-to-r from-[#3e75ff] to-[#5b8cff] hover:from-[#3568e8] hover:to-[#4f7ff0] text-white font-semibold rounded-[28px] shadow-[0_8px_32px_rgba(62,117,255,0.4)] hover:shadow-[0_12px_40px_rgba(62,117,255,0.5)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-lg">
              Почати аналіз
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t-2 border-[#E8E6DC]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Top row */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b-2 border-[#E8E6DC]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1a1a2e] rounded-[14px] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" strokeWidth={1.5} />
              </div>
              <span className="text-lg font-semibold text-[#1a1a2e]">MatchIQ</span>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#6a6a7a] font-light">
              <span>✨ 1000+ аналізів завершено</span>
              <span className="text-[#E8E6DC]">•</span>
              <span>🎯 200+ гравців обрали шлях дисципліни</span>
            </div>
          </div>

          {/* Middle row - links */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 py-6 border-b-2 border-[#E8E6DC]">
            <div className="flex flex-wrap items-center gap-5">
              <a href="#" className="text-sm text-[#4a4a5a] hover:text-[#3e75ff] transition-colors font-medium">
                Документація
              </a>
              <span className="text-[#E8E6DC]">|</span>
              <a href="#" className="text-sm text-[#4a4a5a] hover:text-[#3e75ff] transition-colors font-medium">
                Telegram Community
              </a>
              <span className="text-[#E8E6DC]">|</span>
              <a href="#" className="text-sm text-[#4a4a5a] hover:text-[#3e75ff] transition-colors font-medium">
                DevLog
              </a>
            </div>
            <p className="text-xs text-[#8B8B9A] font-light italic">
              "Твій банк — твоя відповідальність. Твій прогрес — наш пріоритет."
            </p>
          </div>

          {/* Bottom - disclaimer */}
          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[#8B8B9A] font-light text-center md:text-left">
              MatchIQ — аналітичний софт для моделювання та обліку прогресу. <strong className="font-semibold">18+</strong>.
            </p>
            <p className="text-xs text-[#8B8B9A] font-light">
              © 2026 MatchIQ Analytics
            </p>
          </div>
        </div>
      </footer>
    </main>
    </>
  );
}