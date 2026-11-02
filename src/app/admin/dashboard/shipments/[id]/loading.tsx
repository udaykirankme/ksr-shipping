export default function ShipmentDetailLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-1">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          {/* Back button skeleton */}
          <div className="w-9 h-9 rounded-full bg-gray-200/80 shrink-0" />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-6 w-24 bg-gray-300/80 rounded-md" />
              <div className="h-6 w-36 bg-orange-100 rounded-md" />
              <div className="h-6 w-28 bg-orange-50 border border-orange-100 rounded-lg hidden sm:block" />
            </div>
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="h-9 w-28 bg-gray-200/80 rounded-xl" />
          <div className="h-9 w-9 bg-gray-200/80 rounded-xl" />
          <div className="h-9 w-20 bg-gray-200/80 rounded-xl" />
          <div className="h-7 w-28 bg-blue-50 border border-blue-100 rounded-full" />
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column (2 Cols on XL): Form Cards */}
        <div className="xl:col-span-2 space-y-6 order-2 xl:order-1">
          {/* Shipment Details Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
              <div className="h-5 w-36 bg-gray-300 rounded" />
              <div className="h-8 w-24 bg-gray-100 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                  <div className="h-11 bg-gray-100 rounded-xl border border-gray-100" />
                </div>
              ))}
            </div>
          </div>

          {/* Sender & Receiver Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
            <div className="h-5 w-48 bg-gray-300 rounded pb-2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-11 bg-gray-100 rounded-xl border border-gray-100" />
                </div>
              ))}
            </div>
          </div>

          {/* Package & Financial Details Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
            <div className="h-5 w-32 bg-gray-300 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-11 bg-gray-100 rounded-xl border border-gray-100" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Status & Timeline Cards */}
        <div className="space-y-6 order-1 xl:order-2">
          {/* Update Status Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-orange-100/70 shadow-xs space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
              <div className="h-5 w-32 bg-gray-300 rounded" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-11 bg-gray-100 rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-11 bg-gray-100 rounded-xl" />
              </div>
              <div className="h-11 bg-orange-100/70 rounded-xl" />
            </div>
          </div>

          {/* Shipment Timeline Skeleton */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-xs space-y-5">
            <div className="h-5 w-40 bg-gray-300 rounded" />
            <div className="space-y-5 pt-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-orange-100/80 shrink-0" />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded" />
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

