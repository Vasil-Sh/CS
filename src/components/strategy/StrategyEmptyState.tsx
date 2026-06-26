import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface Props {
  onCreateStrategy: () => void;
}

/** Pure component: empty state when no strategies exist */
export default function StrategyEmptyState({ onCreateStrategy }: Props) {
  return (
    <div
      className="bg-white border border-[#F3F4F6] rounded-3xl overflow-hidden"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
    >
      <div className="py-16 text-center">
        <div className="p-8 bg-[#F3F4F6] rounded-2xl inline-block mb-6">
          <Plus className="h-16 w-16 text-[#9CA3AF]" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-semibold text-[#111827] mb-2">Немає стратегій</h3>
        <p className="text-[#6B7280] text-sm mb-6">Створіть свою першу стратегію для ставок на CS2</p>
        <Button
          onClick={onCreateStrategy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#447afc] hover:bg-[#3568d4] text-white text-base font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Створити стратегію
        </Button>
      </div>
    </div>
  );
}
