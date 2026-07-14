import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface Props {
  heading?: string;
  subheading?: string;
  buttonText?: string;
  buttonHref?: string;
}

export default function CTASection({
  heading = 'Твій банк — твоя відповідальність.',
  subheading = 'Почни аналізувати ставки професійно вже сьогодні',
  buttonText = 'Почати аналіз',
  buttonHref = '/login',
}: Props) {
  return (
    <section className="relative py-24 px-6 bg-[#1a1a2e] overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#7C3AED] rounded-full mix-blend-multiply filter blur-3xl" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{heading}</h2>
        <p className="text-lg text-gray-400 mb-10">{subheading}</p>
        <Link to={buttonHref} className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-gradient-to-r from-primary to-[#7C3AED] text-white font-bold text-lg hover:shadow-[0_8px_32px_rgba(68,122,252,0.4)] transition-all">
          {buttonText}<ArrowRight className="h-5 w-5" strokeWidth={2} />
        </Link>
      </div>
    </section>
  );
}
