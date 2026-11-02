export default function MessagesLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <div className="h-7 w-48 bg-gray-300 rounded-lg" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="flex gap-2 w-full lg:w-auto">
            <div className="h-10 w-full sm:w-64 bg-gray-100 rounded-xl" />
            <div className="h-10 w-32 bg-gray-100 rounded-xl" />
          </div>
          <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 w-24 bg-gray-100 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
          <div className="h-4 w-4 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-200 rounded hidden sm:block" />
          <div className="h-4 w-28 bg-gray-200 rounded hidden md:block" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded hidden lg:block" />
        </div>
        <div className="divide-y divide-gray-100">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="w-4 h-4 bg-gray-200 rounded shrink-0" />
              <div className="w-4 h-4 bg-gray-200 rounded shrink-0" />
              <div className="space-y-1.5 min-w-[120px]">
                <div className="h-4 w-24 bg-gray-300 rounded" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
              <div className="space-y-1.5 hidden sm:block min-w-[140px]">
                <div className="h-4 w-28 bg-gray-300 rounded" />
                <div className="h-3 w-36 bg-gray-200 rounded" />
              </div>
              <div className="space-y-1.5 hidden md:block min-w-[140px]">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
              <div className="h-6 w-20 bg-emerald-50 border border-emerald-100 rounded-full" />
              <div className="h-4 w-20 bg-gray-200 rounded hidden lg:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

