"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Package } from "lucide-react";
import Link from "next/link";

export function TrackingWidget({ compact = false, centered = false }: { compact?: boolean, centered?: boolean }) {
  const [trackingId, setTrackingId] = useState("");
  const router = useRouter();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    router.push(`/track?id=${encodeURIComponent(trackingId.trim())}`);
  };

  return (
    <div 
      className={`max-w-md w-full mx-auto border border-white/50 rounded-3xl p-6 ${!centered ? 'lg:ml-auto lg:mr-0' : ''}`}
      style={{
        background: "rgba(255, 255, 255, 0.5)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        boxShadow: "0 8px 32px rgba(234, 88, 12, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.6), inset 0 -1px 1px rgba(255, 255, 255, 0.2)"
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <h3 className="text-sm font-bold tracking-wide text-gray-900 uppercase">
          Track Your Shipment
        </h3>
      </div>
      
      <form onSubmit={handleTrack}>
        <div className="relative mb-4">
          <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
          <input
            type="text"
            className="w-full pl-12 pr-4 py-3.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow text-gray-900 placeholder-gray-400"
            placeholder="Enter Tracking ID / AWB Number"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
        >
          <Search className="w-4 h-4" /> Track Now
        </button>
        
        {!compact && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/60 gap-2">
            <p className="text-xs text-gray-500 max-w-[70%]">
              One tracking number, every courier partner — no need to know who&apos;s carrying it.
            </p>
            <Link href="/faq" className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors whitespace-nowrap">
              How it works? &rarr;
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}
