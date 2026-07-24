import { RefreshCw, Trophy, CalendarDays } from 'lucide-react';

export function MatchesLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="p-8 bg-gray-100 rounded-2xl mb-6">
        <RefreshCw className="h-16 w-16 text-blue-500 animate-spin" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Завантаження матчів</h3>
      <p className="text-gray-500 text-sm">Отримання актуальних даних з API...</p>
    </div>
  );
}

/** Skeleton placeholder — shown during initial load */
export function MatchesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stat cards skeleton */}
      <div className="bg-white/60 rounded-[32px] p-5 border-2 border-stone-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl px-6 py-5">
              <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
              <div className="h-8 w-12 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="flex justify-center">
        <div className="h-16 w-full max-w-2xl bg-white/60 rounded-[32px]" />
      </div>

      {/* Match cards skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white/60 rounded-[32px] p-5 border-2 border-stone-200">
          <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-14 bg-gray-100 rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MatchesEmptyState({ error }: { error?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="p-8 bg-gray-100 rounded-2xl mb-6">
        {error ? (
          <RefreshCw className="h-16 w-16 text-gray-400" strokeWidth={1.5} />
        ) : (
          <CalendarDays className="h-16 w-16 text-gray-400" strokeWidth={1.5} />
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
