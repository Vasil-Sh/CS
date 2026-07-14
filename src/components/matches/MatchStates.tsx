import { RefreshCw, Trophy } from 'lucide-react';

export function MatchesLoadingState() {
  return (
    <div>
      <div className="p-8 bg-gray-100 rounded-2xl inline-block mb-6">
        <RefreshCw className="h-16 w-16 text-blue-500 animate-spin" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Завантаження матчів</h3>
      <p className="text-gray-500 text-sm">Отримання актуальних даних з API...</p>
    </div>
  );
}

export function MatchesEmptyState({ error }: { error?: string }) {
  return (
    <div>
      <div className="p-8 bg-gray-100 rounded-2xl inline-block mb-6">
        {error ? (
          <RefreshCw className="h-16 w-16 text-gray-400" strokeWidth={1.5} />
        ) : (
          <Trophy className="h-16 w-16 text-gray-400" strokeWidth={1.5} />
        )}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {error ? 'Помилка завантаження' : 'Матчів не знайдено'}
      </h3>
      <p className="text-gray-500 text-sm">
        {error || 'Оновіть дані або змініть фільтри для пошуку матчів'}
      </p>
    </div>
  );
}
