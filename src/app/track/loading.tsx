import { TrackingResultSkeleton } from "@/components/TrackingResultSkeleton";

export default function TrackLoading() {
  return (
    <div className="min-h-[90vh] bg-gray-50 pt-[74px] sm:pt-[82px] lg:pt-[92px] pb-24 relative overflow-hidden flex flex-col">
      {/* Background decoration matching track page */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-50 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-full bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none bg-center" />

      <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex-1 flex flex-col justify-start space-y-4">
        <TrackingResultSkeleton />
      </div>
    </div>
  );
}

