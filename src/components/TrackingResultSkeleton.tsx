export function TrackingResultSkeleton() {
  return (
    <div className="w-full bg-white rounded-2xl sm:rounded-3xl shadow-lg shadow-orange-900/5 overflow-hidden border border-orange-100/60 animate-pulse">
      {/* Header Info Banner Skeleton */}
      <div className="bg-gradient-to-br from-orange-50/80 via-white to-orange-50/30 px-4 py-3.5 sm:px-7 sm:py-5 border-b border-orange-100 relative overflow-hidden">
        <div className="flex flex-row justify-between items-center gap-2 sm:gap-4 relative z-10">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-24 sm:w-28 bg-orange-200/70 rounded" />
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="h-6 xs:h-7 sm:h-9 w-40 sm:w-56 bg-gray-200 rounded-lg" />
              <div className="h-5 sm:h-6 w-24 sm:w-28 bg-orange-100/90 rounded-full" />
            </div>
          </div>
          <div className="text-right bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-orange-200/80 shadow-xs shrink-0 space-y-1.5">
            <div className="h-2.5 sm:h-3 w-20 sm:w-24 bg-gray-200 rounded ml-auto" />
            <div className="h-4 sm:h-5 w-24 sm:w-28 bg-gray-300 rounded ml-auto" />
          </div>
        </div>

        {/* Dynamic Customer Notification Message Banner Skeleton */}
        <div className="mt-3 border border-orange-200/80 rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-orange-50/90 via-orange-50/50 to-amber-50/70 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-orange-200/80 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-3/4 max-w-md bg-orange-200/70 rounded" />
            <div className="h-2.5 w-1/2 max-w-xs bg-orange-100 rounded" />
          </div>
        </div>
      </div>

      {/* Unified Vertical Shipment Progress Tracker Skeleton */}
      <div className="px-4 py-5 sm:px-7 sm:py-7 bg-white">
        {/* Header: Title and IST Timing Indicator */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="space-y-1">
            <div className="h-5 sm:h-6 w-40 sm:w-48 bg-gray-300 rounded" />
            <div className="h-3 w-56 sm:w-80 bg-gray-200 rounded" />
          </div>
          <div className="bg-orange-50/80 border border-orange-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-2xs">
            <div className="w-3 h-3 rounded-full bg-orange-300 shrink-0" />
            <div className="h-3 w-28 sm:w-36 bg-orange-200/70 rounded" />
          </div>
        </div>

        {/* 5 Vertically Connected Stages Skeleton */}
        <div className="flow-root relative space-y-0">
          {[
            { labelWidth: "w-28 sm:w-36", active: false, completed: true },
            { labelWidth: "w-20 sm:w-28", active: false, completed: true },
            { labelWidth: "w-24 sm:w-32", active: true, completed: false },
            { labelWidth: "w-28 sm:w-36", active: false, completed: false },
            { labelWidth: "w-24 sm:w-28", active: false, completed: false },
          ].map((stage, idx) => (
            <div key={idx} className="relative flex items-start gap-3.5 sm:gap-5">
              {/* Left Column: Circle node + vertical connecting line */}
              <div className="flex flex-col items-center self-stretch shrink-0 w-9 sm:w-11">
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 z-10 ${
                    stage.active
                      ? "bg-orange-100 border-2 border-orange-300 shadow-sm"
                      : stage.completed
                        ? "bg-orange-50 border border-orange-200"
                        : "bg-gray-100 border border-gray-200"
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ${
                      stage.active
                        ? "bg-orange-400"
                        : stage.completed
                          ? "bg-orange-300"
                          : "bg-gray-300"
                    }`}
                  />
                </div>

                {/* Vertical connecting line */}
                {idx < 4 && (
                  <div
                    className={`w-[2.5px] sm:w-[3px] flex-grow my-1 rounded-full ${
                      stage.active
                        ? "min-h-[72px] sm:min-h-[84px] bg-gray-200"
                        : "min-h-[32px] sm:min-h-[40px] bg-gray-200"
                    }`}
                  />
                )}
              </div>

              {/* Right Column: Milestone Header & Optional Card */}
              <div className={`flex-1 min-w-0 ${idx < 4 ? "pb-6 sm:pb-8" : "pb-2"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className={`h-4 sm:h-5 ${stage.labelWidth} bg-gray-200 rounded`} />
                    {stage.completed ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200/80" />
                    ) : stage.active ? (
                      <div className="h-5 w-20 rounded-full bg-orange-100 border border-orange-200" />
                    ) : (
                      <div className="h-5 w-16 rounded-full bg-gray-100 border border-gray-200" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                    <div className="h-3 w-16 sm:w-24 bg-gray-200 rounded hidden xs:block" />
                    <div className="h-6 sm:h-7 w-20 sm:w-24 bg-orange-50 border border-orange-200/80 rounded-lg" />
                  </div>
                </div>

                {/* Active Stage: Operational Update Summary Card Skeleton */}
                {stage.active && (
                  <div className="mt-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-50/90 via-white to-amber-50/40 border border-orange-200/90 shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-400" />
                      <div className="h-3.5 w-40 sm:w-48 bg-orange-200/70 rounded" />
                    </div>
                    <div className="h-3 w-48 sm:w-64 bg-gray-200 rounded" />
                    <div className="h-2.5 w-32 bg-gray-200/80 rounded" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
