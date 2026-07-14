import { Button } from "@/components/ui/button";
import { Target, Plus } from "lucide-react";

interface Props {
  type: "active" | "completed";
  onCreateGoal: () => void;
}

/** Pure component: empty state for active/completed goals — matches StrategyEmptyState style */
export default function GoalsEmptyState({ type, onCreateGoal }: Props) {
  if (type === "completed") {
    return (
      <div
        className="bg-white border border-gray-100 rounded-3xl overflow-hidden"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
      >
        <div className="py-16 text-center">
          <div className="p-8 bg-gray-100 rounded-2xl inline-block mb-6">
            <Target className="h-16 w-16 text-gray-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Немає завершених цілей
          </h3>
          <p className="text-gray-500 text-sm">
            Завершені цілі з'являться тут
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white border border-gray-100 rounded-3xl overflow-hidden"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
    >
      <div className="py-16 text-center">
        <div className="p-8 bg-gray-100 rounded-2xl inline-block mb-6">
          <Target className="h-16 w-16 text-gray-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Немає активних цілей
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          Створіть першу ціль для відстеження прогресу
        </p>
        <Button
          onClick={onCreateGoal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white text-base font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Створити ціль
        </Button>
      </div>
    </div>
  );
}
