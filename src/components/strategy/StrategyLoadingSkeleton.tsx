/** Pure component: loading skeleton for strategy overview */
export default function StrategyLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-gray-100 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
