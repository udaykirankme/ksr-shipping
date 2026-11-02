"use client";

import { useState, useId, useEffect } from "react";
import { Search, Package, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function TrackingWidget({ compact = false, centered = false }: { compact?: boolean, centered?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [trackingId, setTrackingId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const baseId = useId();
  const inputId = `tracking-id-input-${compact ? 'compact' : 'full'}-${baseId}`;

  // Reset loading state on route change, unmount, or pageshow (e.g. browser back button from bfcache)
  useEffect(() => {
    setIsSubmitting(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handlePageShow = () => {
      setIsSubmitting(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      setIsSubmitting(false);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trackingId.trim();
    if (!clean || isSubmitting) return;

    setIsSubmitting(true);
    router.push(`/track?id=${encodeURIComponent(clean)}`);
  };

  return (
    <div 
      className={`w-full max-w-md mx-auto border border-white/50 rounded-3xl p-6 ${centered ? '' : 'lg:mx-0'}`}
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
      
      <form onSubmit={handleSubmit} action="/track" method="GET" aria-label="Track your shipment">
        <div className="relative mb-4">
          <label htmlFor={inputId} className="sr-only">
            Tracking ID or AWB Number
          </label>
          <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" aria-hidden="true" />
          <input
            id={inputId}
            type="text"
            name="id"
            autoComplete="off"
            aria-required="true"
            className="w-full pl-12 pr-4 py-3.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow text-gray-900 placeholder-gray-400 disabled:opacity-75 disabled:cursor-not-allowed"
            placeholder="Enter Tracking ID / AWB Number"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || !trackingId.trim()}
          className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Tracking...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Track Now</span>
            </>
          )}
        </button>
        
        {!compact && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mt-4 pt-4 border-t border-gray-200/60">
            <p className="text-xs text-gray-500 leading-relaxed">
              One tracking number, every courier partner — no need to know who&apos;s carrying it.
            </p>
            <Link href="/faq" className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors shrink-0">
              How it works? &rarr;
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}
