export default function ReportsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <div className="h-7 w-48 bg-gray-300 rounded-lg" />
          <div className="h-4 w-72 bg-gray-200 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-36 bg-gray-100 rounded-xl" />
          <div className="h-10 w-10 bg-gray-100 rounded-xl" />
        </div>
      </div>

      {/* 4 KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-24 bg-gray-200 rounded" />
              <div className="w-8 h-8 rounded-xl bg-gray-100" />
            </div>
            <div className="h-7 w-32 bg-gray-300 rounded-md" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Analytics Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <div className="h-5 w-40 bg-gray-300 rounded" />
          <div className="h-64 bg-gray-50 rounded-2xl border border-gray-100" />
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <div className="h-5 w-40 bg-gray-300 rounded" />
          <div className="h-64 bg-gray-50 rounded-2xl border border-gray-100" />
        </div>
      </div>
    </div>
  );
}

