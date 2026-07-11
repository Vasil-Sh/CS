import { RefreshCw, Trophy } from 'lucide-react';
import { RetroGrid } from '@/components/ui/retro-grid';

export function MatchesLoadingState() {
  return (
    <div className="relative py-8">
      <RetroGrid className="absolute inset-0 opacity-30" angle={65} cellSize={80} />
      <div className="relative z-10">
        <div className="p-8 bg-[#F3F4F6] rounded-2xl inline-block mb-6">
          <RefreshCw className="h-16 w-16 text-[#3B82F6] animate-spin" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-semibold text-[#111827] mb-2">Завантаження матчів</h3>
        <p className="text-[#6B7280] text-sm">Отримання актуальних даних з API...</p>
      </div>
    </div>
  );
}

export function MatchesEmptyState({ error }: { error?: string }) {
  return (
    <div className="relative py-8 overflow-hidden">
      <RetroGrid className="absolute inset-0 opacity-30" angle={65} cellSize={80} />
      <div className="relative z-10">
        <div className="p-8 bg-[#F3F4F6] rounded-2xl inline-block mb-6">
          {error ? (
            <RefreshCw className="h-16 w-16 text-[#9CA3AF]" strokeWidth={1.5} />
          ) : (
            <Trophy className="h-16 w-16 text-[#9CA3AF]" strokeWidth={1.5} />
          )}
        </div>
        <h3 className="text-xl font-semibold text-[#111827] mb-2">
          {error ? 'Помилка завантаження' : 'Матчів не знайдено'}
        </h3>
        <p className="text-[#6B7280] text-sm">
          {error || 'Оновіть дані або змініть фільтри для пошуку матчів'}
        </p>
      </div>
    </div>
  );
}
