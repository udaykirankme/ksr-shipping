import { Suspense } from "react";
import TrackResult from "./TrackResult";

export default function TrackPage() {
  return (
    <div className="min-h-[70vh] bg-gray-50 pt-[104px] lg:pt-[130px] pb-16 relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-50 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-full bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none bg-center" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight">Track Your <span className="text-orange-500">Shipment</span></h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Enter your tracking ID below to get real-time status updates on your package.
          </p>
        </div>
        
        <Suspense fallback={<div className="text-center p-8 text-gray-500">Loading tracker...</div>}>
          <TrackResult />
        </Suspense>
      </div>
    </div>
  );
}
