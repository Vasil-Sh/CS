import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3 } from 'lucide-react';

interface Props {
  heading?: string;
  subheading?: string;
  ctaText?: string;
  secondaryCtaText?: string;
}

export default function HeroSection({
  heading = 'Аналітика ставок на кіберспорт',
  subheading = 'Професійний інструмент для аналізу, прогнозування та управління банкролом у ставках на CS2 та Dota 2',
  ctaText = 'Перевірити ставку',
  secondaryCtaText = 'Дізнатись більше',
}: Props) {
  return (
    <section aria-label="Головний екран" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-[#7C3AED] rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          <span className="bg-gradient-to-r from-primary to-[#7C3AED] bg-clip-text text-transparent">{heading}</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">{subheading}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-[#7C3AED] text-white font-semibold text-lg hover:shadow-[0_8px_32px_rgba(68,122,252,0.4)] transition-all">
            <BarChart3 className="h-5 w-5" strokeWidth={2} />{ctaText}
          </Link>
          <a href="#features" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/20 text-white font-semibold text-lg hover:bg-white/10 transition-all">
            {secondaryCtaText}<ArrowRight className="h-5 w-5" strokeWidth={2} />
          </a>
        </div>
        <p className="text-gray-500 text-sm mt-6">Безкоштовний аналіз • Без реєстрації</p>
      </div>
    </section>
  );
}
