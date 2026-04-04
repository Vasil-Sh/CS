import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  BarChart3, 
  Shield, 
  Target, 
  Zap, 
  Trophy,
  ArrowRight,
  ChevronRight,
  LineChart,
  Brain,
  Wallet,
  Star,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const features = [
  {
    icon: BarChart3,
    title: 'Глибока аналітика',
    description: 'Детальна статистика ваших ставок: ROI, winrate, профіт по місяцях, аналіз по командах та коефіцієнтах.',
  },
  {
    icon: Brain,
    title: 'Value Bet аналіз',
    description: 'Автоматичний розрахунок Value Bet та Критерій Келлі для оптимального розміру ставки.',
  },
  {
    icon: Target,
    title: 'Стратегії та цілі',
    description: 'Створюйте власні стратегії, встановлюйте цілі та відстежуйте прогрес у реальному часі.',
  },
  {
    icon: Shield,
    title: 'Ризик-менеджмент',
    description: 'Система ризикових команд, попередження та контроль банкролу для захисту вашого капіталу.',
  },
  {
    icon: LineChart,
    title: 'Порівняння періодів',
    description: 'Порівнюйте свої результати за різні періоди та відстежуйте динаміку покращення.',
  },
  {
    icon: Wallet,
    title: 'Управління банкролом',
    description: 'Повний контроль над банкролом: депозити, виводи, автоматичний розрахунок балансу.',
  },
];

const stats = [
  { value: '15+', label: 'Метрик аналітики' },
  { value: '70+', label: 'Ризикових команд' },
  { value: '5', label: 'Типів стратегій' },
  { value: '24/7', label: 'Доступність' },
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
              <a href="#stats" className="text-[#4a4a5a] hover:text-[#1a1a2e] transition-colors duration-200 text-sm font-medium">
                Статистика
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
              href="#stats" 
              className="block text-[#4a4a5a] hover:text-[#1a1a2e] transition-colors text-base font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Статистика
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
              <Zap className="h-4 w-4 text-[#3e75ff]" />
              <span className="text-sm font-medium text-[#4a4a5a]">CS2 Betting Intelligence Platform</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#1a1a2e] tracking-tight leading-[1.1] mb-6">
              Розумні рішення.{' '}
              <span className="bg-gradient-to-r from-[#3e75ff] to-[#5b8cff] bg-clip-text text-transparent">
                Точна аналітика.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-[#6a6a7a] font-light leading-relaxed max-w-2xl mx-auto mb-10">
              Платформа для аналізу CS2 ставок з Value Bet розрахунками, стратегіями та повним контролем банкролу.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login">
                <Button className="h-14 px-10 bg-gradient-to-r from-[#3e75ff] to-[#5b8cff] hover:from-[#3568e8] hover:to-[#4f7ff0] text-white font-semibold rounded-[24px] shadow-[0_8px_24px_rgba(62,117,255,0.35)] hover:shadow-[0_12px_32px_rgba(62,117,255,0.45)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-base">
                  Почати зараз
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button 
                  variant="outline" 
                  className="h-14 px-10 bg-transparent hover:bg-transparent border-2 border-[#E8E6DC] hover:border-[#3e75ff] text-[#4a4a5a] hover:text-[#3e75ff] font-semibold rounded-[24px] transition-all duration-300 text-base"
                >
                  Дізнатись більше
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
                    {/* Stat Cards */}
                    <div className="bg-white rounded-[20px] border-2 border-[#E8E6DC] p-5 shadow-sm">
                      <p className="text-xs text-[#8B8B9A] font-medium mb-1">Загальний профіт</p>
                      <p className="text-2xl font-bold text-[#22C55E]">+12,450₴</p>
                      <p className="text-xs text-[#22C55E] mt-1">↑ 18.5%</p>
                    </div>
                    <div className="bg-white rounded-[20px] border-2 border-[#E8E6DC] p-5 shadow-sm">
                      <p className="text-xs text-[#8B8B9A] font-medium mb-1">Winrate</p>
                      <p className="text-2xl font-bold text-[#1a1a2e]">67.3%</p>
                      <p className="text-xs text-[#3e75ff] mt-1">152 / 226</p>
                    </div>
                    <div className="bg-white rounded-[20px] border-2 border-[#E8E6DC] p-5 shadow-sm">
                      <p className="text-xs text-[#8B8B9A] font-medium mb-1">ROI</p>
                      <p className="text-2xl font-bold text-[#3e75ff]">24.8%</p>
                      <p className="text-xs text-[#22C55E] mt-1">↑ 3.2%</p>
                    </div>
                    <div className="bg-white rounded-[20px] border-2 border-[#E8E6DC] p-5 shadow-sm">
                      <p className="text-xs text-[#8B8B9A] font-medium mb-1">Банкрол</p>
                      <p className="text-2xl font-bold text-[#1a1a2e]">62,450₴</p>
                      <p className="text-xs text-[#8B8B9A] mt-1">Початковий: 50,000₴</p>
                    </div>
                  </div>

                  {/* Chart placeholder */}
                  <div className="bg-white rounded-[20px] border-2 border-[#E8E6DC] p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-semibold text-[#1a1a2e]">Динаміка балансу</h3>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-[#3e75ff] text-white text-xs rounded-full font-medium">Місяць</span>
                        <span className="px-3 py-1 bg-[#F5F5F0] text-[#8B8B9A] text-xs rounded-full font-medium">Тиждень</span>
                      </div>
                    </div>
                    {/* SVG Chart */}
                    <svg viewBox="0 0 800 200" className="w-full h-32 lg:h-40">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0 160 Q 50 150 100 140 T 200 120 T 300 100 T 400 90 T 500 70 T 600 50 T 700 40 T 800 20"
                        fill="none"
                        stroke="#22C55E"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 0 160 Q 50 150 100 140 T 200 120 T 300 100 T 400 90 T 500 70 T 600 50 T 700 40 T 800 20 V 200 H 0 Z"
                        fill="url(#chartGradient)"
                      />
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
              <span className="text-sm font-medium text-[#3e75ff]">Можливості платформи</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-[#1a1a2e] tracking-tight mb-4">
              Все для аналізу ставок
            </h2>
            <p className="text-lg text-[#6a6a7a] font-light max-w-2xl mx-auto">
              Повний набір інструментів для прийняття обґрунтованих рішень та контролю вашого банкролу.
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

      {/* How it works */}
      <section id="how-it-works" className="py-20 lg:py-32 bg-[#F5F5F0]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-[#1a1a2e] tracking-tight mb-4">
              Як це працює
            </h2>
            <p className="text-lg text-[#6a6a7a] font-light max-w-2xl mx-auto">
              Три простих кроки до повного контролю над вашими ставками.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                icon: Trophy,
                title: 'Записуйте ставки',
                description: 'Додавайте ставки через зручну форму з автоматичним розрахунком Value Bet та рекомендаціями Келлі.',
              },
              {
                step: '02',
                icon: BarChart3,
                title: 'Аналізуйте результати',
                description: 'Відстежуйте ROI, winrate, профіт по командах та стратегіях. Порівнюйте періоди.',
              },
              {
                step: '03',
                icon: Target,
                title: 'Покращуйте стратегію',
                description: 'Використовуйте дані для оптимізації стратегії та досягнення ваших фінансових цілей.',
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
            Готові покращити свої результати?
          </h2>
          <p className="text-xl text-[#8B8B9A] font-light mb-10 max-w-2xl mx-auto">
            Приєднуйтесь до MatchIQ та почніть приймати рішення на основі даних, а не інтуїції.
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
              © 2026 MatchIQ Analytics. Всі права захищені.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}