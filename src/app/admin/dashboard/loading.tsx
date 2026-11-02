export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* 3 Circular KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-4 w-28 bg-gray-200 rounded" />
              <div className="h-8 w-32 bg-gray-300 rounded-lg" />
              <div className="h-3 w-36 bg-gray-100 rounded" />
            </div>
            <div className="w-16 h-16 rounded-full bg-gray-100 border-4 border-gray-200/80 shrink-0" />
          </div>
        ))}
      </div>

      {/* Overview & Recent Notifications Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipment Overview (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-xs space-y-5">
          <div className="flex justify-between items-center pb-2 border-b border-gray-50">
            <div className="space-y-2">
              <div className="h-5 w-40 bg-gray-300 rounded" />
              <div className="h-3 w-56 bg-gray-200 rounded" />
            </div>
            <div className="h-8 w-24 bg-gray-100 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-50/70 p-4 rounded-2xl space-y-2 border border-gray-100">
                <div className="h-3 w-16 bg-gray-200 rounded" />
                <div className="h-7 w-12 bg-gray-300 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Notifications (1 Col) */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-50">
            <div className="h-5 w-36 bg-gray-300 rounded" />
            <div className="h-4 w-14 bg-gray-200 rounded" />
          </div>
          <div className="space-y-3 pt-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-50/60 border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="h-3.5 w-3/4 bg-gray-300 rounded" />
                  <div className="h-3 w-1/2 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="h-5 w-32 bg-gray-300 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-50 rounded-2xl border border-gray-100 flex items-center p-4 gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-20 bg-gray-300 rounded" />
                <div className="h-2.5 w-14 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Shipments Table Skeleton */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div className="space-y-1">
            <div className="h-5 w-36 bg-gray-300 rounded" />
            <div className="h-3 w-48 bg-gray-200 rounded" />
          </div>
          <div className="h-8 w-20 bg-gray-100 rounded-lg" />
        </div>
        <div className="divide-y divide-gray-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 sm:px-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200/60 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 w-28 bg-gray-300 rounded" />
                  <div className="h-3 w-40 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="hidden sm:block space-y-1.5 text-right">
                <div className="h-4 w-24 bg-gray-300 rounded ml-auto" />
                <div className="h-3 w-16 bg-gray-200 rounded ml-auto" />
              </div>
              <div className="h-7 w-20 bg-orange-50 border border-orange-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
