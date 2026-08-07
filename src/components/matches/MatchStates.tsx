import { RefreshCw, Trophy, CalendarDays } from "lucide-react";

export function MatchesLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="p-8 bg-gray-100 rounded-2xl mb-6">
        <RefreshCw
          className="h-16 w-16 text-blue-500 animate-spin"
          strokeWidth={1.5}
        />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Завантаження матчів
      </h3>
      <p className="text-gray-500 text-sm max-w-xs text-center">
        Отримання актуальних даних із серверів. Це може зайняти кілька секунд.
      </p>
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
        {error ? "Помилка завантаження" : "Матчів не знайдено"}
      </h3>
      <p className="text-gray-500 text-sm">
        {error || "Оновіть дані або змініть фільтри для пошуку матчів"}
      </p>
    </div>
  );
}
