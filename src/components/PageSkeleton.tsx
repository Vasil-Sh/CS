/**
 * Reusable page skeleton for loading states.
 * Shows pulsing placeholder cards matching the page layout.
 */
export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-[#F3F4F6] rounded-3xl px-5 py-7 min-w-0 animate-pulse">
      <div className="h-3 w-16 bg-[#E5E7EB] rounded mb-3 mx-auto" />
      <div className="h-10 w-12 bg-[#E5E7EB] rounded mx-auto" />
    </div>
  );
}

export function ChartCardSkeleton() {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-[#E5E7EB] rounded-xl" />
        <div className="h-5 w-40 bg-[#E5E7EB] rounded" />
      </div>
      <div className="h-[300px] bg-[#F9FAFB] rounded-2xl" />
    </div>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white border border-[#F3F4F6] rounded-3xl px-6 py-5 animate-pulse">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="h-4 bg-[#E5E7EB] rounded mb-2" style={{ width: `${85 - i * 20}%` }} />
      ))}
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 px-6 lg:px-8 pb-8 pt-4">
      <div className="h-12 w-64 bg-[#E5E7EB] rounded animate-pulse" />
      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />)}
      </div>
      {/* 4 stat cards row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />)}
      </div>
      {/* BalanceTracker */}
      <SkeletonCard lines={4} />
      {/* 2 chart cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
      {/* 3 odds cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {Array.from({ length: 3 }, (_, i) => <StatCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

export function MyBetsSkeleton() {
  return (
    <div className="space-y-8 px-6 lg:px-8 pb-8 pt-4">
      <div className="h-12 w-64 bg-[#E5E7EB] rounded animate-pulse" />
      {/* 8 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 8 }, (_, i) => <StatCardSkeleton key={i} />)}
      </div>
      {/* Form skeleton */}
      <SkeletonCard lines={6} />
    </div>
  );
}

export function StrategySkeleton() {
  return (
    <div className="space-y-8 px-6 lg:px-8 pb-8 pt-4">
      <div className="h-12 w-64 bg-[#E5E7EB] rounded animate-pulse" />
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />)}
      </div>
      {/* Content */}
      <SkeletonCard lines={5} />
    </div>
  );
}
