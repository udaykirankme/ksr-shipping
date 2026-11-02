export function TrackingResultSkeleton() {
  return (
    <div className="w-full bg-white rounded-2xl sm:rounded-3xl shadow-lg shadow-orange-900/5 overflow-hidden border border-orange-100/60 animate-pulse">
      {/* Header Info Banner Skeleton */}
      <div className="bg-gradient-to-br from-orange-50/80 via-white to-orange-50/30 px-4 py-3.5 sm:px-7 sm:py-5 border-b border-orange-100 relative">
        <div className="flex flex-row justify-between items-center gap-2 sm:gap-4 relative z-10">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-28 bg-orange-200/60 rounded" />
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="h-7 sm:h-9 w-44 sm:w-56 bg-gray-200 rounded-lg" />
              <div className="h-6 sm:h-7 w-28 sm:w-32 bg-orange-100/80 rounded-full" />
            </div>
          </div>
          <div className="text-right bg-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-orange-200/70 shadow-xs shrink-0 space-y-1.5">
            <div className="h-3 w-24 bg-gray-200 rounded ml-auto" />
            <div className="h-5 w-28 bg-gray-300 rounded ml-auto" />
          </div>
        </div>

        {/* Horizontal Tracker Skeleton */}
        <div className="mt-4 pt-3.5 sm:mt-5 sm:pt-4 border-t border-orange-200/60 relative z-10">
          <div className="w-full py-4 sm:py-6">
            <div className="relative flex justify-between items-center w-full px-2 sm:px-6">
              {/* Connecting background line */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded" />

              {/* 5 Nodes */}
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col items-center text-center w-1/5 relative z-10 space-y-2">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-xs">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-200" />
                  </div>
                  <div className="h-2.5 sm:h-3 w-14 sm:w-20 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Message Banner Skeleton */}
          <div className="mt-2 border border-orange-200/80 rounded-xl px-4 py-3 sm:px-5 sm:py-3.5 bg-orange-50/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-200/80 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-3/4 bg-orange-200/60 rounded" />
              <div className="h-3 w-1/2 bg-orange-100 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Tracking History Timeline Skeleton */}
      <div className="px-4 py-5 sm:px-7 sm:py-6 bg-white space-y-5">
        <div className="flex justify-between items-center pb-2">
          <div className="h-5 w-36 bg-gray-300 rounded" />
          <div className="h-4 w-40 bg-gray-200 rounded hidden sm:block" />
        </div>

        <div className="space-y-6 pt-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-orange-100 shrink-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-orange-200" />
              </div>
              <div className="flex-1 space-y-2.5 pt-0.5">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-48 sm:w-64 bg-gray-300 rounded" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
                <div className="h-5 w-28 bg-orange-50 border border-orange-100 rounded-md" />
                <div className="h-10 w-full bg-blue-50/50 rounded-xl border border-blue-100/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

