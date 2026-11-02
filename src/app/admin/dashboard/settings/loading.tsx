export default function SettingsLoading() {
  return (
    <div className="flex flex-col md:flex-row gap-6 animate-pulse">
      {/* Side Navigation Tabs Skeleton */}
      <div className="w-full md:w-64 shrink-0 space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-white rounded-xl border border-gray-100 flex items-center px-4 gap-3">
            <div className="w-5 h-5 rounded-md bg-gray-200" />
            <div className="h-4 w-28 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Main Settings Content Area Skeleton */}
      <div className="flex-1 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-gray-50">
          <div className="space-y-1.5">
            <div className="h-6 w-36 bg-gray-300 rounded-md" />
            <div className="h-3.5 w-64 bg-gray-200 rounded" />
          </div>
          <div className="h-9 w-28 bg-orange-200 rounded-xl" />
        </div>

        {/* Setting items skeleton rows */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-50/70 rounded-2xl border border-gray-100 flex items-center justify-between px-5">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="h-4 w-40 bg-gray-300 rounded" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-16 bg-emerald-50 rounded-full border border-emerald-100" />
                <div className="h-8 w-8 bg-gray-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

