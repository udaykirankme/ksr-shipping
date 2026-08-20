import { Suspense } from "react";
import TrackResult from "./TrackResult";
import Link from "next/link";
import { Headset } from "lucide-react";

export default function TrackPage() {
  return (
    <div className="min-h-[90vh] bg-gray-50 pt-[104px] lg:pt-[130px] pb-24 relative overflow-hidden flex flex-col">
      {/* Premium Background */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-50 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-full bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none bg-center" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex-grow flex flex-col">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight">Track Your <span className="text-orange-500">Shipment</span></h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Enter your tracking ID below to get real-time status updates on your package.
          </p>
        </div>
        
        <div className="mb-20">
          <Suspense fallback={<div className="text-center p-8 text-gray-500">Loading tracker...</div>}>
            <TrackResult />
          </Suspense>
        </div>

        {/* Contact Support CTA */}
        <div className="mt-auto bg-white p-8 md:p-10 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 text-center flex flex-col items-center max-w-2xl mx-auto transition-all hover:shadow-[0_10px_30px_-15px_rgba(249,115,22,0.2)] hover:border-orange-200">
           <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mb-5 text-orange-500 shadow-inner">
              <Headset className="w-7 h-7" />
           </div>
           <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Facing Issues with Tracking?</h3>
           <p className="text-gray-600 mb-8 leading-relaxed max-w-lg">
             If your tracking information hasn&apos;t updated or you need further assistance with your shipment, our support team is ready to help.
           </p>
           <Link href="/contact" className="inline-flex h-12 items-center justify-center px-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:-translate-y-1 hover:from-orange-600 hover:to-orange-700">
              Contact Support
           </Link>
        </div>
      </div>
    </div>
  );
}
