export default function NewQuoteLoading() {
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
        <div className="space-y-1.5">
          <div className="h-7 w-48 bg-gray-300 rounded-lg" />
          <div className="h-3.5 w-72 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Quote Form Skeleton */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
        <div className="h-5 w-40 bg-gray-300 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3.5 w-24 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-3.5 w-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-100 rounded-xl" />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
          <div className="h-10 w-24 bg-gray-100 rounded-xl" />
          <div className="h-10 w-32 bg-orange-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

