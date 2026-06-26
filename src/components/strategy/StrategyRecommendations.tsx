import { Lightbulb } from 'lucide-react';

interface Rec { type: 'info' | 'warning' | 'success'; message: string; }

interface Props { recommendations: Rec[]; }

export default function StrategyRecommendations({ recommendations }: Props) {
  const items = recommendations.slice(0, 3);
  return (
    <div className="bg-white border border-[#F3F4F6] rounded-3xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div className="px-6 py-5 border-b border-[#F3F4F6]">
        <div className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-[#111827]" strokeWidth={1.5} /><span className="text-lg font-semibold text-[#111827]">Рекомендації</span></div>
      </div>
      <div className="p-6">
        <div className="space-y-3 text-sm">
          {items.map((rec, i) => {
            const bg = rec.type === 'info' ? 'bg-[#EFF6FF]' : rec.type === 'warning' ? 'bg-[#FEF3C7]' : 'bg-[#DCFCE7]';
            const tc = rec.type === 'info' ? 'text-[#3B82F6]' : rec.type === 'warning' ? 'text-[#D97706]' : 'text-[#16A34A]';
            const label = rec.type === 'info' ? '💡 Порада' : rec.type === 'warning' ? '⚠️ Увага' : '✅ Успіх';
            return (
              <div key={i} className={`p-3 rounded-2xl ${bg}`}>
                <div className={`font-semibold text-xs mb-1 ${tc}`}>{label}</div>
                <div className={`text-sm ${tc}`}>{rec.message}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
