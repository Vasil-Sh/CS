import { RefreshCw } from 'lucide-react';

export function MatchesLoadingState() {
  return (
    <div className="py-20 text-center">
      <div className="flex items-center justify-center gap-2">
        <RefreshCw className="h-5 w-5 text-[#447afc] animate-spin" strokeWidth={1.5} />
        <span className="text-base text-[#6B7280] font-medium">Завантаження матчів...</span>
      </div>
      <p className="text-sm text-[#9CA3AF] mt-2">Отримання актуальних даних з API</p>
    </div>
  );
}

export function MatchesEmptyState({ error }: { error?: string }) {
  return (
    <div className="py-20 text-center">
      <div className="p-6 bg-[#F3F4F6] rounded-3xl inline-block mb-4">
        <RefreshCw className="h-12 w-12 text-[#9CA3AF]" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-semibold text-[#111827] mb-1">
        {error ? 'Помилка завантаження' : 'Немає матчів'}
      </h3>
      <p className="text-base text-[#6B7280]">
        {error || 'Матчі не знайдені для вибраних фільтрів'}
      </p>
    </div>
  );
}
