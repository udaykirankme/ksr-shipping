export default function MessageDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3 sm:gap-4 w-full xl:w-auto">
          <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-6 w-36 bg-gray-300 rounded-md" />
              <div className="h-6 w-20 bg-orange-100 rounded-full" />
            </div>
            <div className="h-3.5 w-44 bg-gray-200 rounded" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full xl:w-auto">
          <div className="h-10 w-36 bg-emerald-100 rounded-xl" />
          <div className="h-10 w-20 bg-gray-200 rounded-xl" />
          <div className="h-10 w-28 bg-gray-200 rounded-xl" />
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sender Info Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-gray-100 shadow-xs space-y-5">
            <div className="h-5 w-40 bg-gray-300 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3.5 w-20 bg-gray-200 rounded" />
                  <div className="h-5 w-32 bg-gray-300 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Message Content Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-gray-100 shadow-xs space-y-4">
            <div className="h-5 w-32 bg-gray-300 rounded" />
            <div className="h-5 w-3/4 bg-gray-200 rounded" />
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-5/6 bg-gray-100 rounded" />
              <div className="h-4 w-4/6 bg-gray-100 rounded" />
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Activity Timeline */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-gray-100 shadow-xs space-y-5">
            <div className="h-5 w-36 bg-gray-300 rounded" />
            <div className="space-y-4 pt-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-28 bg-gray-300 rounded" />
                    <div className="h-3 w-40 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

