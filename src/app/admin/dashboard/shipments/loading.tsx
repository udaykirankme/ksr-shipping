export default function ShipmentsLoading() {
  return (
    <div className="p-3 sm:p-5 lg:p-6 w-full max-w-[1600px] mx-auto flex flex-col h-full min-h-0 space-y-4 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="h-7 w-32 bg-gray-300 rounded-lg" />
          <div className="h-6 w-16 bg-orange-100 rounded-full" />
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="h-9 w-24 bg-gray-200 rounded-xl" />
          <div className="h-9 w-24 bg-gray-200 rounded-xl" />
          <div className="h-9 w-32 bg-orange-200 rounded-xl" />
        </div>
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="h-10 w-full md:w-80 bg-gray-100 rounded-xl border border-gray-200/60" />
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="h-10 w-36 bg-gray-100 rounded-xl" />
          <div className="h-10 w-28 bg-gray-100 rounded-xl" />
          <div className="h-10 w-10 bg-gray-100 rounded-xl" />
        </div>
      </div>

      {/* Shipment Table Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="p-3.5 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
          <div className="h-4 w-4 bg-gray-200 rounded" />
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded hidden sm:block" />
          <div className="h-4 w-24 bg-gray-200 rounded hidden md:block" />
          <div className="h-4 w-20 bg-gray-200 rounded hidden lg:block" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
        <div className="divide-y divide-gray-100">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="w-4 h-4 bg-gray-200 rounded shrink-0" />
              <div className="space-y-1.5 min-w-[140px]">
                <div className="h-4 w-28 bg-gray-300 rounded" />
                <div className="h-3 w-20 bg-gray-200 rounded" />
              </div>
              <div className="space-y-1.5 hidden sm:block min-w-[120px]">
                <div className="h-4 w-24 bg-gray-300 rounded" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
              <div className="space-y-1.5 hidden md:block min-w-[120px]">
                <div className="h-4 w-24 bg-gray-300 rounded" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
              <div className="h-6 w-24 bg-gray-100 rounded-lg hidden lg:block" />
              <div className="h-7 w-20 bg-orange-50 border border-orange-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

