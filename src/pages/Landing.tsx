import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  BarChart3, 
  Shield, 
  Target, 
  ArrowRight,
  ChevronRight,
  LineChart,
  Brain,
  Wallet,
  Star,
  Menu,
  X,
  Database,
  FileCheck,
  Search,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const features = [
  {
    icon: Database,
    title: 'Дисциплінований облік',
    description: 'Автоматизуйте збір даних через HLTV/Dota2 парсери. Позбавтеся помилок ручного вводу та неструктурованих таблиць.',
  },
  {
    icon: Brain,
    title: 'Валідація впевненості',
    description: 'Порівнюйте власну оцінку ймовірності з ринковими котируваннями. Виявляйте статистичні аномалії (Value) без емоційного впливу.',
  },
  {
    icon: Shield,
    title: 'Математичний ризик-менеджмент',
    description: 'Використовуйте Критерій Келлі та ліміти експозиції (Max Stake) для захисту капіталу від серійних просадок.',
  },
  {
    icon: LineChart,
    title: 'Ретроспективний аналіз',
    description: 'Порівнюйте результати за різні періоди, виявляйте слабкі місця у вашій моделі та відстежуйте динаміку покращення.',
  },
  {
    icon: Target,
    title: 'Інвестиційні протоколи',
    description: 'Створюйте власні стратегії з чіткими правилами входу, лімітами та автоматичними попередженнями при відхиленнях.',
  },
  {
    icon: Wallet,
    title: 'Контроль капіталу',
    description: 'Повний облік руху коштів: депозити, виводи, автоматичний розрахунок балансу та exposure на кожну позицію.',
  },
];

const stats = [
  { value: '15+', label: 'Аналітичних метрик' },
  { value: '70+', label: 'Активів у базі волатильності' },
  { value: '5', label: 'Інвестиційних протоколів' },
  { value: '24/7', label: 'Доступність платформи' },
];

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
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

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[#4a4a5a] hover:text-[#1a1a2e] transition-colors duration-200 text-sm font-medium">
                Можливості
              </a>
              <a href="#philosophy" className="text-[#4a4a5a] hover:text-[#1a1a2e] transition-colors duration-200 text-sm font-medium">
                Філософія
              </a>
              <a href="#how-it-works" className="text-[#4a4a5a] hover:text-[#1a1a2e] transition-colors duration-200 text-sm font-medium">
                Як це працює
              </a>
            </nav>

            {/* Login Button - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login">
                <Button 
                  className="h-12 px-8 bg-gradient-to-r from-[#3e75ff] to-[#5b8cff] hover:from-[#3568e8] hover:to-[#4f7ff0] text-white font-semibold rounded-[20px] shadow-[0_4px_16px_rgba(62,117,255,0.3)] hover:shadow-[0_8px_24px_rgba(62,117,255,0.4)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-sm"
                >
                  Увійти
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden w-12 h-12 flex items-center justify-center rounded-[16px] border-2 border-[#E8E6DC] hover:bg-[#f2f8ff] transition-colors"
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
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-[#E8E6DC] px-6 py-6 space-y-4">
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
              href="#how-it-works" 
              className="block text-[#4a4a5a] hover:text-[#1a1a2e] transition-colors text-base font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Як це працює
            </a>
            <Link to="/login" className="block pt-2">
              <Button className="w-full h-12 bg-gradient-to-r from-[#3e75ff] to-[#5b8cff] hover:from-[#3568e8] hover:to-[#4f7ff0] text-white font-semibold rounded-[20px] shadow-[0_4px_16px_rgba(62,117,255,0.3)] transition-all duration-300 text-sm">
                Увійти
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 overflow-hidden">
        {/* Background Pattern */}
        <svg className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="landing-grid" patternUnits="userSpaceOnUse" width="48" height="48">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#000000" strokeWidth="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#landing-grid)" />
        </svg>

        {/* Decorative blurs */}
        <div className="absolute top-20 left-[-10%] w-[500px] h-[500px] bg-[#3e75ff]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-[-10%] w-[400px] h-[400px] bg-[#5b8cff]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border-2 border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-8">
              <BarChart3 className="h-4 w-4 text-[#3e75ff]" />
              <span className="text-sm font-medium text-[#4a4a5a]">Decision Support System for Esports Analytics</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1a1a2e] tracking-tight leading-[1.1] mb-6">
              Система підтримки{' '}
              <span className="bg-gradient-to-r from-[#3e75ff] to-[#5b8cff] bg-clip-text text-transparent">
                прийняття рішень
              </span>
              {' '}для кіберспортивної аналітики
            </h1>

            {/* Subtitle */}
            <p className="text-lg lg:text-xl text-[#6a6a7a] font-light leading-relaxed max-w-3xl mx-auto mb-10">
              MatchIQ — це професійний бек-офіс для тих, хто будує стратегію на математичних моделях, а не на інтуїції. Контролюйте ризики, валідуйте гіпотези та ведіть облік з точністю фінансового аудиту.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login">
                <Button className="h-14 px-10 bg-gradient-to-r from-[#3e75ff] to-[#5b8cff] hover:from-[#3568e8] hover:to-[#4f7ff0] text-white font-semibold rounded-[24px] shadow-[0_8px_24px_rgba(62,117,255,0.35)] hover:shadow-[0_12px_32px_rgba(62,117,255,0.45)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-base">
                  Почати роботу
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#philosophy">
                <Button 
                  variant="outline" 
                  className="h-14 px-10 bg-transparent hover:bg-transparent border-2 border-[#E8E6DC] hover:border-[#3e75ff] text-[#4a4a5a] hover:text-[#3e75ff] font-semibold rounded-[24px] transition-all duration-300 text-base"
                >
                  Наша філософія
                </Button>
              </a>
            </div>
          </div>

          {/* Hero Visual - Dashboard Preview */}
          <div className="mt-16 lg:mt-24 max-w-5xl mx-auto">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[#3e75ff]/10 via-[#5b8cff]/5 to-[#3e75ff]/10 rounded-[40px] blur-2xl" />
              
              <div className="relative bg-white border-2 border-[#E8E6DC] rounded-[32px] shadow-[0_24px_80px_rgba(0,0,0,0.08)] overflow-hidden">
                {/* Mock browser bar */}
                <div className="flex items-center gap-2 px-6 py-4 bg-[#FAFAF8] border-b-2 border-[#E8E6DC]">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF6B6B]" />
                    <div className="w-3 h-3 rounded-full bg-[#FFD93D]" />
                    <div className="w-3 h-3 rounded-full bg-[#6BCB77]" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-6 py-1.5 bg-white rounded-lg border border-[#E8E6DC] text-xs text-[#8B8B9A]">
                      matchiq.app/analytics
                    </div>
                  </div>
                </div>

                {/* Dashboard Preview Content */}
                <div className="p-8 lg:p-12 bg-gradient-to-br from-white to-[#FAFAF8]">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                    {/* Stat Cards - Financial terminology */}
                    <div className="bg-white rounded-[20px] border-2 border-[#E8E6DC] p-5 shadow-sm">
                      <p className="text-xs text-[#8B8B9A] font-medium mb-1">Реалізований профіт</p>
                      <p className="text-2xl font-bold text-[#22C55E]">+12,450₴</p>
                      <p className="text-xs text-[#22C55E] mt-1">↑ 18.5% ROI</p>
                    </div>
                    <div className="bg-white rounded-[20px] border-2 border-[#E8E6DC] p-5 shadow-sm">
                      <p className="text-xs text-[#8B8B9A] font-medium mb-1">Hit Rate</p>
                      <p className="text-2xl font-bold text-[#1a1a2e]">67.3%</p>
                      <p className="text-xs text-[#3e75ff] mt-1">152 / 226 позицій</p>
                    </div>
                    <div className="bg-white rounded-[20px] border-2 border-[#E8E6DC] p-5 shadow-sm">
                      <p className="text-xs text-[#8B8B9A] font-medium mb-1">Avg. Edge</p>
                      <p className="text-2xl font-bold text-[#3e75ff]">+4.8%</p>
                      <p className="text-xs text-[#22C55E] mt-1">Value виявлено</p>
                    </div>
                    <div className="bg-white rounded-[20px] border-2 border-[#E8E6DC] p-5 shadow-sm">
                      <p className="text-xs text-[#8B8B9A] font-medium mb-1">Капітал</p>
                      <p className="text-2xl font-bold text-[#1a1a2e]">62,450₴</p>
                      <p className="text-xs text-[#8B8B9A] mt-1">Exposure: 4.2%</p>
                    </div>
                  </div>

                  {/* Chart - clean financial style */}
                  <div className="bg-white rounded-[20px] border-2 border-[#E8E6DC] p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-semibold text-[#1a1a2e]">Equity Curve</h3>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-[#3e75ff] text-white text-xs rounded-full font-medium">90 днів</span>
                        <span className="px-3 py-1 bg-[#F5F5F0] text-[#8B8B9A] text-xs rounded-full font-medium">30 днів</span>
                      </div>
                    </div>
                    {/* SVG Chart - clean financial line */}
                    <svg viewBox="0 0 800 200" className="w-full h-32 lg:h-40">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Grid lines */}
                      <line x1="0" y1="50" x2="800" y2="50" stroke="#E8E6DC" strokeWidth="0.5" strokeDasharray="4 4" />
                      <line x1="0" y1="100" x2="800" y2="100" stroke="#E8E6DC" strokeWidth="0.5" strokeDasharray="4 4" />
                      <line x1="0" y1="150" x2="800" y2="150" stroke="#E8E6DC" strokeWidth="0.5" strokeDasharray="4 4" />
                      {/* Main line */}
                      <path
                        d="M 0 160 Q 40 155 80 148 T 160 135 T 240 128 T 320 110 T 400 105 T 480 85 T 560 72 T 640 55 T 720 38 T 800 20"
                        fill="none"
                        stroke="#22C55E"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      {/* Area fill */}
                      <path
                        d="M 0 160 Q 40 155 80 148 T 160 135 T 240 128 T 320 110 T 400 105 T 480 85 T 560 72 T 640 55 T 720 38 T 800 20 V 200 H 0 Z"
                        fill="url(#chartGradient)"
                      />
                      {/* Data point */}
                      <circle cx="800" cy="20" r="4" fill="#22C55E" />
                      <circle cx="800" cy="20" r="8" fill="#22C55E" fillOpacity="0.2" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 bg-[#1a1a2e]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl lg:text-5xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-[#8B8B9A] text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f2f8ff] border border-[#3e75ff]/20 mb-6">
              <Star className="h-4 w-4 text-[#3e75ff]" />
              <span className="text-sm font-medium text-[#3e75ff]">Data over Luck</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-[#1a1a2e] tracking-tight mb-4">
              Інструменти для обробки даних
            </h2>
            <p className="text-lg text-[#6a6a7a] font-light max-w-2xl mx-auto">
              Акцент на тому, що допомагає уникати когнітивних помилок та приймати рішення на основі математики.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-[#FAFAF8] border-2 border-[#E8E6DC] rounded-[28px] p-8 hover:border-[#3e75ff]/30 hover:shadow-[0_8px_32px_rgba(62,117,255,0.08)] transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-[#1a1a2e] rounded-[20px] flex items-center justify-center mb-6 shadow-[0_4px_12px_rgba(26,26,46,0.15)] group-hover:shadow-[0_8px_20px_rgba(26,26,46,0.2)] transition-shadow duration-300">
                    <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-semibold text-[#1a1a2e] mb-3">{feature.title}</h3>
                  <p className="text-[#6a6a7a] font-light leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="philosophy" className="py-20 lg:py-32 bg-[#F5F5F0]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-[#E8E6DC] shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-6">
                <BookOpen className="h-4 w-4 text-[#3e75ff]" />
                <span className="text-sm font-medium text-[#4a4a5a]">Філософія MatchIQ</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-[#1a1a2e] tracking-tight mb-4">
                Ми не даємо прогнозів
              </h2>
            </div>

            <div className="bg-white border-2 border-[#E8E6DC] rounded-[32px] p-8 lg:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
              <p className="text-lg lg:text-xl text-[#4a4a5a] leading-relaxed mb-8">
                MatchIQ — це не сервіс підказок і не магічний алгоритм. Це інструмент для тих, хто вже має власну аналітичну модель і потребує професійного середовища для її тестування, моніторингу та масштабування.
              </p>
              <p className="text-lg lg:text-xl text-[#4a4a5a] leading-relaxed mb-10">
                Наша мета — перетворити хаотичний процес на структуровану систему прийняття рішень.
              </p>

              {/* Philosophy pillars */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 bg-[#FAFAF8] rounded-[20px] border-2 border-[#E8E6DC]">
                  <div className="w-12 h-12 bg-[#1a1a2e] rounded-[16px] flex items-center justify-center mb-4">
                    <Search className="w-6 h-6 text-white" strokeWidth={1.5} />
                  </div>
                  <h4 className="text-base font-semibold text-[#1a1a2e] mb-2">Дані, а не інтуїція</h4>
                  <p className="text-sm text-[#6a6a7a] leading-relaxed">
                    Кожне рішення підкріплене математичними розрахунками та статистичним аналізом.
                  </p>
                </div>
                <div className="p-6 bg-[#FAFAF8] rounded-[20px] border-2 border-[#E8E6DC]">
                  <div className="w-12 h-12 bg-[#1a1a2e] rounded-[16px] flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-white" strokeWidth={1.5} />
                  </div>
                  <h4 className="text-base font-semibold text-[#1a1a2e] mb-2">Дисципліна понад все</h4>
                  <p className="text-sm text-[#6a6a7a] leading-relaxed">
                    Автоматичні попередження при відхиленнях від стратегії та лімітів ризику.
                  </p>
                </div>
                <div className="p-6 bg-[#FAFAF8] rounded-[20px] border-2 border-[#E8E6DC]">
                  <div className="w-12 h-12 bg-[#1a1a2e] rounded-[16px] flex items-center justify-center mb-4">
                    <AlertTriangle className="w-6 h-6 text-white" strokeWidth={1.5} />
                  </div>
                  <h4 className="text-base font-semibold text-[#1a1a2e] mb-2">Контроль когнітивних помилок</h4>
                  <p className="text-sm text-[#6a6a7a] leading-relaxed">
                    Overconfidence detection, порівняння з ринковими котируваннями та ретроспективний аудит.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-[#1a1a2e] tracking-tight mb-4">
              Як це працює
            </h2>
            <p className="text-lg text-[#6a6a7a] font-light max-w-2xl mx-auto">
              Три етапи структурованого процесу прийняття рішень.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                icon: FileCheck,
                title: 'Протоколювання',
                description: 'Фіксуйте кожен прогноз з детальними метриками: коефіцієнт, EV, впевненість, exposure на капітал.',
              },
              {
                step: '02',
                icon: Shield,
                title: 'Верифікація',
                description: 'Перевіряйте прогноз на відповідність вашому інвестиційному протоколу та лімітам ризику.',
              },
              {
                step: '03',
                icon: BarChart3,
                title: 'Аудит',
                description: 'Отримуйте глибоку ретроспективу своїх рішень для виявлення слабких місць у моделі.',
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="relative text-center">
                  {/* Step number */}
                  <div className="text-8xl font-bold text-[#3e75ff]/5 absolute top-[-20px] left-1/2 -translate-x-1/2 select-none pointer-events-none">
                    {item.step}
                  </div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-white border-2 border-[#E8E6DC] rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                      <Icon className="w-8 h-8 text-[#3e75ff]" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-semibold text-[#1a1a2e] mb-3">{item.title}</h3>
                    <p className="text-[#6a6a7a] font-light leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-[#1a1a2e] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-[-10%] w-[400px] h-[400px] bg-[#3e75ff]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-[-10%] w-[300px] h-[300px] bg-[#5b8cff]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-6">
            Готові структурувати свій процес?
          </h2>
          <p className="text-xl text-[#8B8B9A] font-light mb-10 max-w-2xl mx-auto">
            Приєднуйтесь до MatchIQ та почніть приймати рішення на основі даних та математичних моделей.
          </p>
          <Link to="/login">
            <Button className="h-16 px-12 bg-gradient-to-r from-[#3e75ff] to-[#5b8cff] hover:from-[#3568e8] hover:to-[#4f7ff0] text-white font-semibold rounded-[28px] shadow-[0_8px_32px_rgba(62,117,255,0.4)] hover:shadow-[0_12px_40px_rgba(62,117,255,0.5)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-lg">
              Увійти в систему
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-white border-t-2 border-[#E8E6DC]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1a1a2e] rounded-[14px] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" strokeWidth={1.5} />
              </div>
              <span className="text-lg font-semibold text-[#1a1a2e]">MatchIQ</span>
            </div>
            <p className="text-sm text-[#8B8B9A] font-light">
              © 2026 MatchIQ Analytics. Decision Support System for Esports.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}