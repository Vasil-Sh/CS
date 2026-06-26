import { Button } from '@/components/ui/button';
import { Target, Plus } from 'lucide-react';

interface Props {
  type: 'active' | 'completed';
  onCreateGoal: () => void;
}

/** Pure component: empty state for active/completed goals */
export default function GoalsEmptyState({ type, onCreateGoal }: Props) {
  if (type === 'completed') {
    return (
      <div className="py-12 text-center">
        <div className="p-6 bg-[#F3F4F6] rounded-3xl inline-block mb-4">
          <Target className="h-12 w-12 text-[#9CA3AF]" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-semibold text-[#111827] mb-1">Немає завершених цілей</h3>
        <p className="text-base text-[#6B7280]">Завершені цілі з'являться тут</p>
      </div>
    );
  }

  return (
    <div className="py-12 text-center">
      <div className="p-6 bg-[#F3F4F6] rounded-3xl inline-block mb-4">
        <Target className="h-12 w-12 text-[#9CA3AF]" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-semibold text-[#111827] mb-1">Немає активних цілей</h3>
      <p className="text-base text-[#6B7280] mb-4">Створіть першу ціль для відстеження прогресу</p>
      <Button onClick={onCreateGoal} className="rounded-3xl bg-[#447afc] hover:bg-[#5b8ffd] text-white font-medium h-11 px-6 text-base shadow-[0_4px_16px_rgba(68,122,252,0.3)]">
        <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
        Створити ціль
      </Button>
    </div>
  );
}
