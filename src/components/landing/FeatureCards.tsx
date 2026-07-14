import type { ComponentType } from 'react';

interface Step { icon: ComponentType<{ className?: string; strokeWidth?: number }>; title: string; description: string; }

interface Props { steps: Step[]; id?: string; }

export default function FeatureCards({ steps, id = 'features' }: Props) {
  return (
    <section id={id} className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Як це працює</h2>
        <p className="text-lg text-gray-500 text-center mb-16 max-w-2xl mx-auto">Простий процес аналізу та прогнозування ваших ставок</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="relative group">
                <div className="p-8 rounded-3xl border border-gray-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-all text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="h-7 w-7 text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                </div>
                {i < steps.length - 1 && <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-gray-200" />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
