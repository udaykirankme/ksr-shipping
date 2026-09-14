"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TrackingWidget } from "@/components/TrackingWidget";
import { 
  Check, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Box, 
  Hand, 
  Truck, 
  Plane, 
  User, 
  XCircle, 
  RotateCcw, 
  ArrowRight, 
  PackageSearch, 
  Package, 
  Inbox,
  Warehouse,
  Info,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import Link from "next/link";
import { business } from "@/lib/config/business";

interface TrackingHistoryEvent {
  id: string;
  status: string;
  location: string;
  note: string;
  occurred_at: string;
}

interface TrackingData {
  tracking_id: string;
  current_status: string;
  estimated_delivery?: string | null;
  origin?: string | null;
  destination?: string | null;
  sender_name?: string | null;
  receiver_name?: string | null;
  sender_city?: string | null;
  receiver_city?: string | null;
  booked_date?: string | null;
  medium?: string | null;
  service?: string | null;
  service_through?: string | null;
  current_location?: string | null;
  history: TrackingHistoryEvent[];
  customer_update?: string | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Shipment Created': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'Picked Up': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Shipment Bagged': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Shipment Received': return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'Dispatched': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'In Transit': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'At Hub': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Out For Delivery': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
    case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
    case 'Returned': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const isAirShipment = (data: TrackingData): boolean => {
  const m = (data.medium || '').toLowerCase();
  const st = (data.service_through || '').toLowerCase();
  const s = (data.service || '').toLowerCase();
  const cu = (data.customer_update || '').toLowerCase();
  return m === 'air' || st === 'air' || s.includes('air') || cu.includes('through air') || cu.includes('by air');
};

const getStatusIcon = (status: string, className = "w-5 h-5", isAir = false) => {
  switch (status) {
    case 'Shipment Created': return <Box className={className} />;
    case 'Picked Up': return <Hand className={className} />;
    case 'Shipment Bagged': return <Package className={className} />;
    case 'Shipment Received': return <Inbox className={className} />;
    case 'Dispatched': return isAir ? <Plane className={className} /> : <Truck className={className} />;
    case 'In Transit': return isAir ? <Plane className={className} /> : <Truck className={className} />;
    case 'At Hub': return <MapPin className={className} />;
    case 'Out For Delivery': return isAir ? <Plane className={className} /> : <Truck className={className} />;
    case 'Delivered': return <CheckCircle2 className={className} />;
    case 'Cancelled': return <XCircle className={className} />;
    case 'Returned': return <RotateCcw className={className} />;
    default: return <Clock className={className} />;
  }
};

const getDynamicMessage = (status: string, sender?: string | null, receiver?: string | null) => {
  const highlightClass = "uppercase font-bold text-orange-600 tracking-wide";
  const fromName = sender ? <span className={highlightClass}>{sender}</span> : "the sender";
  const toName = receiver ? <span className={highlightClass}>{receiver}</span> : "the receiver";
  
  switch(status) {
    case 'Shipment Created': return <>Your shipment has been registered successfully and is awaiting pickup.</>;
    case 'Picked Up': return <>Great news! Your shipment from {fromName} to {toName} has been picked up successfully.</>;
    case 'Shipment Bagged': return <>Your shipment from {fromName} to {toName} has been bagged and is being prepared for dispatch.</>;
    case 'Shipment Received': return <>Your shipment from {fromName} to {toName} has been received at our facility and is being processed.</>;
    case 'Dispatched': return <>Your shipment from {fromName} to {toName} has been dispatched and is on its way.</>;
    case 'In Transit': return <>Your shipment from {fromName} to {toName} is currently in transit. Thank you for your patience.</>;
    case 'At Hub': return <>Your shipment from {fromName} to {toName} has arrived at our hub and is being processed for the next leg of its journey.</>;
    case 'Out For Delivery': return <>Exciting news! Your shipment is out for delivery and will reach {toName} soon.</>;
    case 'Delivered': return <>Your shipment from {fromName} to {toName} has been successfully delivered.</>;
    case 'Cancelled': return <>This shipment has been cancelled. Please contact KSR Shipping Services if you require assistance.</>;
    case 'Returned': return <>This shipment is being returned to {fromName}.</>;
    default: return <>Your shipment from {fromName} to {toName} is currently in transit.</>;
  }
};

const getStageIndex = (status: string): number => {
  switch (status) {
    case 'Shipment Created':
      return 0;
    case 'Picked Up':
    case 'Shipment Bagged':
    case 'Shipment Received':
    case 'Shipment Packed':
    case 'Dispatched':
    case 'Shipped':
      return 1;
    case 'In Transit':
    case 'At Hub':
    case 'Out For Delivery':
      return 2;
    case 'Delivered':
      return 3;
    default: {
      const s = status.toLowerCase();
      if (s.includes('out for delivery') || s.includes('transit') || s.includes('hub')) return 2;
      if (s === 'delivered' || (s.includes('deliver') && !s.includes('out for delivery'))) return 3;
      if (s.includes('dispatch') || s.includes('shipped') || s.includes('pick') || s.includes('bag') || s.includes('receiv') || s.includes('pack')) return 1;
      return 0;
    }
  }
};

const getStageTimestamp = (stageIndex: number, history: TrackingHistoryEvent[]): { date: string; full: string } | null => {
  if (!history || history.length === 0) return null;

  let matched: TrackingHistoryEvent | undefined;
  if (stageIndex === 0) {
    // Shipment Created event
    matched = [...history].reverse().find(e => {
      const s = e.status.toLowerCase();
      return s.includes('creat');
    }) || [...history].reverse()[0];
  } else if (stageIndex === 1) {
    // Shipped / Dispatched / Bagged / Picked up / Received
    matched = history.find(e => {
      const s = e.status.toLowerCase();
      return s.includes('dispatch') || s.includes('shipped') || s.includes('pick') || s.includes('bag') || s.includes('receiv') || s.includes('pack');
    });
  } else if (stageIndex === 2) {
    // In Transit
    matched = history.find(e => {
      const s = e.status.toLowerCase();
      return s.includes('transit') || s.includes('hub') || s.includes('out for delivery');
    });
  } else if (stageIndex === 3) {
    // Delivered (exclude 'out for delivery')
    matched = history.find(e => {
      const s = e.status.toLowerCase();
      return s === 'delivered' || (s.includes('deliver') && !s.includes('out for delivery'));
    });
  }

  if (!matched?.occurred_at) return null;
  const d = new Date(matched.occurred_at);
  if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return null;

  const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const yearStr = d.getFullYear();
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
  return {
    date: dateStr,
    full: `${dateStr} ${yearStr}, ${timeStr}`
  };
};

interface HorizontalShipmentTrackerProps {
  data: TrackingData;
  onViewDetails: () => void;
}

function HorizontalShipmentTracker({ data, onViewDetails }: HorizontalShipmentTrackerProps) {
  const isAir = isAirShipment(data);
  const finalStageIdx = getStageIndex(data.current_status);
  const isDelivered = data.current_status === 'Delivered' || finalStageIdx === 3;
  const destinationCity = data.receiver_city || data.destination || "Destination";
  const currentLocation = data.history[0]?.location || data.current_location || data.sender_city || "Current Facility";

  const stages = [
    { label: "Shipment Created", key: "created" },
    { label: "Shipped", key: "shipped" },
    { label: "In Transit", key: "in_transit" },
    { label: "Delivered", key: "delivered" },
  ];

  // Target fill along the connector track (from 0% to 100%):
  // - Stage 0 (Shipment Created): 0%
  // - Stage 1 (Shipped): 50% (halfway between Shipped at 33.33% and In Transit at 66.66%)
  // - Stage 2 (In Transit): 83.333% (halfway between In Transit at 66.66% and Delivered at 100%)
  // - Stage 3 (Delivered): 100%
  let targetPercent = 0;
  if (finalStageIdx === 0) targetPercent = 0;
  else if (finalStageIdx === 1) targetPercent = 50;
  else if (finalStageIdx === 2) targetPercent = 83.333;
  else if (finalStageIdx === 3) targetPercent = 100;

  const [trackPercent, setTrackPercent] = useState(0);

  useEffect(() => {
    if (targetPercent === 0) {
      setTrackPercent(0);
      return;
    }

    setTrackPercent(0);

    let animationFrameId: number;
    let startTime: number | null = null;
    
    // Duration: 1800ms for Shipped, 2400ms for In Transit, 2600ms for Delivered
    const duration = finalStageIdx === 1 ? 1800 : finalStageIdx === 2 ? 2400 : 2600;

    // Gentle, natural sine ease-out: steady natural glide, softly easing into arrival
    const easeOutSine = (t: number) => Math.sin((t * Math.PI) / 2);

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutSine(progress);
      const current = eased * targetPercent;

      setTrackPercent(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setTrackPercent(targetPercent);
      }
    };

    const timeoutId = setTimeout(() => {
      animationFrameId = requestAnimationFrame(step);
    }, 120);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [finalStageIdx, data.tracking_id, targetPercent]);

  // Synchronous tick marks: a circle turns to [✓] the exact instant the leading edge touches it
  const isStageCompleted = (idx: number) => {
    if (idx === 0) return true;
    if (idx === 1) return trackPercent >= 33.333;
    if (idx === 2) return trackPercent >= 66.666;
    if (idx === 3) return trackPercent >= 99.5;
    return false;
  };

  const renderStageIcon = (idx: number, isCompleted: boolean) => {
    const iconSize = "w-4 h-4 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5";
    const iconColor = isCompleted ? "text-white" : "text-gray-400";

    // Stage 0: Shipment Created
    if (idx === 0) {
      return <Package className={cn(iconSize, iconColor)} />;
    }

    // Stage 1: Shipped
    if (idx === 1) {
      return <Warehouse className={cn(iconSize, iconColor)} />;
    }

    // Stage 2: In Transit
    if (idx === 2) {
      return isAir ? (
        <Plane className={cn(iconSize, iconColor, "-rotate-12")} />
      ) : (
        <Truck className={cn(iconSize, iconColor)} />
      );
    }

    // Stage 3: Delivered
    if (idx === 3) {
      return <CheckCircle2 className={cn(iconSize, iconColor)} />;
    }

    return <Package className={cn(iconSize, iconColor)} />;
  };

  return (
    <div className="w-full my-1 sm:my-2 pt-8 sm:pt-11 pb-1 px-1 sm:px-3 select-none overflow-visible">
      <div className="relative w-full">
        {/* Background connector track passing directly through node circle centers */}
        <div 
          className="absolute top-[18px] sm:top-[26px] md:top-[28px] -translate-y-1/2 left-[12.5%] right-[12.5%] h-[2.5px] sm:h-[3px] bg-gray-200/90 rounded-full z-0"
        >
          {/* Active progress fill */}
          <div 
            className="h-full bg-orange-500 rounded-full shadow-[0_0_4px_rgba(249,115,22,0.3)] relative"
            style={{ width: `${trackPercent}%` }}
          >
            {/* Small transport vehicle icon anchored directly at the tip of the expanding line */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-30">
              {/* Floating location card / tooltip (only when not delivered) */}
              {!isDelivered && (
                <div 
                  className={cn(
                    "absolute bottom-full mb-1.5 sm:mb-2 flex flex-col pointer-events-auto transition-opacity duration-300",
                    trackPercent > (finalStageIdx === 0 ? -1 : (finalStageIdx === 1 ? 20 : 35)) ? "opacity-100" : "opacity-0 pointer-events-none",
                    trackPercent < 20 
                      ? "left-1/2 translate-x-[-15%] items-start" 
                      : trackPercent > 75 
                        ? "left-1/2 translate-x-[-70%] sm:translate-x-[-50%] items-end sm:items-center" 
                        : "left-1/2 -translate-x-1/2 items-center"
                  )}
                >
                  {/* Refined status tooltip with active orange accent styling */}
                  <div className="bg-white/95 backdrop-blur-xs text-gray-800 rounded-md sm:rounded-lg px-2 py-0.5 sm:px-3 sm:py-1 shadow-md shadow-orange-950/5 border border-orange-300 hover:border-orange-400 transition-all flex flex-col items-center whitespace-nowrap">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                      <span className="text-[9px] sm:text-[11px] font-bold tracking-tight uppercase text-gray-800 max-w-[110px] sm:max-w-[160px] truncate">
                        {currentLocation}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onViewDetails}
                      className="group mt-0.5 inline-flex items-center gap-1 text-[8px] sm:text-[9.5px] font-semibold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer focus:outline-none"
                      title="Scroll to latest tracking history update"
                    >
                      <span className="hover:underline">View Details</span>
                      <ArrowRight className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-orange-500 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* Pointer triangle matching the orange-300 border */}
                  <div 
                    className={cn(
                      "w-0 h-0 border-x-[3.5px] sm:border-x-[4px] border-x-transparent border-t-[4px] sm:border-t-[5px] border-t-orange-300 -mt-[1px]",
                      trackPercent < 20 
                        ? "ml-3" 
                        : trackPercent > 75 
                          ? "mr-3 sm:mr-0 sm:self-center" 
                          : "self-center"
                    )} 
                  />
                </div>
              )}

              {/* Vehicle icon directly on the progress line without a circle container */}
              <div className="flex items-center justify-center pointer-events-none -translate-y-0.5">
                {isAir ? (
                  <Plane 
                    className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-orange-500 fill-white rotate-45 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)] transition-transform" 
                    strokeWidth={2}
                  />
                ) : (
                  <Truck 
                    className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-orange-500 fill-white filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)] transition-transform" 
                    strokeWidth={2}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4 Stage Nodes */}
        <div className="relative z-10 flex justify-between items-start w-full">
          {stages.map((stage, i) => {
            const isCompleted = isStageCompleted(i);
            const timestamp = getStageTimestamp(i, data.history);

            return (
              <div 
                key={stage.key}
                className="flex flex-col items-center text-center w-1/4 px-0.5 sm:px-1 relative"
              >
                {/* Node Circle - 36px on mobile, 52-56px on desktop */}
                <div 
                  className={cn(
                    "rounded-full flex items-center justify-center transition-colors duration-300",
                    "w-9 h-9 sm:w-13 sm:h-13 md:w-14 md:h-14",
                    isCompleted 
                      ? "bg-orange-500 text-white shadow-sm shadow-orange-500/30" 
                      : "bg-gray-100 border border-gray-200 text-gray-400"
                  )}
                  aria-label={`${stage.label}: ${isCompleted ? 'Completed' : 'Upcoming'}`}
                >
                  {renderStageIcon(i, isCompleted)}
                </div>

                {/* Stage Label */}
                <p className={cn(
                  "mt-1.5 sm:mt-2.5 leading-tight tracking-tight text-center transition-colors duration-300",
                  "text-[10px] sm:text-sm",
                  isCompleted ? "font-bold text-gray-900" : "font-semibold text-gray-400"
                )}>
                  {stage.label}
                </p>

                {/* Stage Timestamp - Compact single date on mobile, full timestamp on desktop */}
                {isCompleted && timestamp && (
                  <p className={cn(
                    "text-[8.5px] sm:text-xs mt-0.5 font-medium leading-tight text-center whitespace-normal",
                    isCompleted ? "text-gray-600" : "text-gray-400"
                  )}>
                    <span className="sm:hidden">{timestamp.date}</span>
                    <span className="hidden sm:inline">{timestamp.full}</span>
                  </p>
                )}

                {/* If Stage 3 (Delivered): Show Destination underneath */}
                {i === 3 && (
                  <div className="mt-0.5 sm:mt-1 flex flex-col items-center max-w-full">
                    <div className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs font-bold text-gray-700">
                      <MapPin className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-orange-500 shrink-0" />
                      <span className="truncate max-w-[65px] sm:max-w-[140px] uppercase font-bold text-gray-800">
                        {destinationCity}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


export default function TrackResult() {
  const searchParams = useSearchParams();
  const trackingId = searchParams.get("id");
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);

  useEffect(() => {
    const handleSearch = async (id: string) => {
      setLoading(true);
      setError("");
      setData(null);

      try {
        const res = await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackingNumber: id })
        });
        if (!res.ok) {
          if (res.status === 404) {
            setError("Shipment Not Found");
          } else {
            setError("Error fetching details");
          }
          return;
        }
        const result = await res.json();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError("Shipment Not Found");
        }
      } catch (err) {
        console.error(err);
        setError("Connection Failed");
      } finally {
        setLoading(false);
      }
    };

    if (trackingId) {
      handleSearch(trackingId);
    }
  }, [trackingId]);

  const handleViewDetails = () => {
    if (!data?.history || data.history.length === 0) return;
    const latestEvent = data.history[0];
    const targetElement = document.getElementById("latest-tracking-event") || document.getElementById(`tracking-event-${latestEvent.id}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedEventId(latestEvent.id);
      setTimeout(() => {
        setHighlightedEventId(null);
      }, 2500);
    }
  };

  const isAir = data ? isAirShipment(data) : false;
  const isDelivered = data ? (data.current_status.toLowerCase().trim() === 'delivered' || getStageIndex(data.current_status) === 3) : false;

  return (
    <div className={cn(trackingId ? "space-y-3 sm:space-y-4 pt-1 sm:pt-2" : "space-y-8")}>
      {/* Header & Subtitle - Only displayed when tracking number has not been entered */}
      {!trackingId && (
        <div className="text-center pt-1 sm:pt-2 mb-8 sm:mb-10">
          <h1 className="font-black text-gray-900 tracking-tight text-4xl md:text-5xl lg:text-6xl mb-3 sm:mb-4">
            Track Your <span className="text-orange-500">Shipment</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed text-base sm:text-lg lg:text-xl">
            Enter your tracking ID below to get real-time status updates on your package.
          </p>
        </div>
      )}

      {!trackingId && <TrackingWidget centered={true} />}
      
      {loading && (
         <div className="bg-white rounded-3xl shadow-lg shadow-orange-100/50 p-12 text-center border border-orange-50/50">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-orange-900 font-medium">Fetching shipment details...</p>
         </div>
      )}

      {error && !loading && (
         <div className="bg-white border border-gray-100 shadow-xl shadow-gray-200/50 rounded-3xl p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-red-400 opacity-5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <PackageSearch className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Shipment Not Found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              We couldn&apos;t find a shipment matching the tracking number <span className="font-bold text-gray-900">{trackingId}</span>. Please verify the tracking number or contact our support team for assistance.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/track" className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-medium transition-colors">
                Try Again
              </Link>
              <Link href="/contact" className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-orange-500/25">
                Contact Us
              </Link>
            </div>
         </div>
      )}

      {data && (
         <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg shadow-orange-900/5 overflow-hidden border border-orange-100/60">
            {/* Header info */}
            <div className="bg-gradient-to-br from-orange-50/80 via-white to-orange-50/30 px-4 py-3.5 sm:px-7 sm:py-5 border-b border-orange-100 relative overflow-hidden">
               {/* Soft glow */}
               <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-orange-400 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
               
               <div className="flex flex-row justify-between items-center gap-2 sm:gap-4 relative z-10">
                  <div className="min-w-0 flex-1">
                     <p className="text-[10px] sm:text-xs text-orange-600 uppercase tracking-wider font-bold mb-0.5">Tracking Number</p>
                     <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                       <h2 className="text-lg xs:text-xl sm:text-3xl font-black tracking-tight text-gray-900 truncate">{data.tracking_id}</h2>
                       <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-bold border shrink-0 shadow-2xs", getStatusColor(data.current_status))}>
                         {getStatusIcon(data.current_status, "w-3 h-3 sm:w-3.5 sm:h-3.5", isAir)}
                         {data.current_status}
                       </div>
                     </div>
                  </div>
                  <div className="text-right bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-orange-200/80 shadow-xs shrink-0">
                     <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider font-semibold flex items-center justify-end gap-1">
                       <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500" />
                       <span className="hidden xs:inline">Estimated Delivery</span>
                       <span className="xs:hidden">Est. Delivery</span>
                     </p>
                     <p className="font-bold text-sm sm:text-lg text-gray-900 leading-tight mt-0.5">
                        {data.estimated_delivery && new Date(data.estimated_delivery).getFullYear() > 1970 
                          ? new Date(data.estimated_delivery).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : "Processing"}
                     </p>
                  </div>
               </div>
               
               <div className="mt-3 pt-2.5 sm:mt-3.5 sm:pt-3 border-t border-orange-200/60 relative z-10">
                  {/* HORIZONTAL SHIPMENT STATUS TRACKER */}
                  <HorizontalShipmentTracker 
                    data={data}
                    onViewDetails={handleViewDetails}
                  />

                  {/* Customer Message Banner - Synced to Light Theme */}
                  <div className={cn(
                    "mt-3 border rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-3.5 shadow-xs transition-all",
                    isDelivered 
                      ? "bg-gradient-to-r from-orange-50/90 via-amber-50/60 to-orange-50/90 border-orange-200" 
                      : "bg-gradient-to-r from-orange-50/90 via-orange-50/50 to-amber-50/70 border-orange-200/80"
                  )}>
                     <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                        <div className={cn(
                          "text-white p-2 rounded-xl shrink-0 shadow-xs",
                          isDelivered ? "bg-emerald-500 shadow-emerald-500/20" : "bg-orange-500 shadow-orange-500/20"
                        )}>
                           {isDelivered ? (
                             <CheckCircle2 className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
                           ) : (
                             <Info className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
                           )}
                        </div>
                        <p className="font-medium text-xs sm:text-sm md:text-[14px] leading-relaxed text-gray-800">
                           {getDynamicMessage(data.current_status, data.sender_name, data.receiver_name)}
                        </p>
                     </div>

                     {isDelivered && (
                        <a
                          href={business.googleReviewUrl || "https://g.page/r/CdBtDQra-a6oEB0/review"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2 bg-white hover:bg-orange-50 text-gray-800 hover:text-orange-600 font-bold text-xs sm:text-sm rounded-xl border border-orange-200/90 hover:border-orange-300 shadow-2xs hover:shadow-xs transition-all duration-200 shrink-0 group whitespace-nowrap self-start md:self-auto w-full md:w-auto"
                          id="google-review-btn"
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" className="shrink-0" xmlns="http://www.w3.org/2000/svg">
                            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.369 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.109 -17.884 43.989 -14.754 43.989 Z" />
                            </g>
                          </svg>
                          <span>Drop a review on Google</span>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                        </a>
                     )}
                  </div>

                  {/* Sub-info Row: IST Timing Note & Customer Update / Shipment Update */}
                  <div className="mt-2.5 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                     <div className="bg-white border border-gray-200/80 rounded-lg px-2.5 py-1 sm:px-3 sm:py-1.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-600 shadow-2xs shrink-0">
                        <Clock className="w-3 h-3 text-orange-500 shrink-0" />
                        <span>All timings in <span className="font-semibold text-gray-800">IST (Indian Standard Time)</span>.</span>
                     </div>
                     {data.customer_update && data.customer_update.trim() !== '' && (
                        <div className="w-full sm:w-auto bg-white border border-gray-200/80 rounded-lg px-3 py-1.5 flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 text-xs shadow-2xs">
                           <span className="font-bold text-orange-600 text-[10.5px] sm:text-[11.5px] uppercase tracking-wider shrink-0">
                              Shipment Update:
                           </span>
                           <span className="font-semibold text-gray-800 text-xs sm:text-[13px] leading-snug break-words">
                              {data.customer_update}
                           </span>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Timeline */}
            <div className="px-4 py-4 sm:px-7 sm:py-6 bg-white" id="tracking-history-section">
               <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                 Tracking History
               </h3>
               
               <div className="flow-root relative">
                 <ul role="list" className="-mb-4">
                   {data.history.map((event, eventIdx) => {
                      const isLast = eventIdx === data.history.length - 1;
                      const isFirst = eventIdx === 0;
                      const isHighlighted = highlightedEventId === event.id;
                      
                      return (
                       <li 
                         key={event.id}
                         id={isFirst ? "latest-tracking-event" : `tracking-event-${event.id}`}
                         className="relative pb-5 sm:pb-6"
                       >
                         <div>
                           {!isLast ? (
                             <span className="absolute left-4 sm:left-4.5 top-4 -ml-px h-full w-0.5 bg-orange-100" aria-hidden="true" />
                           ) : null}

                           <div className="relative">
                             {/* Highlight Glow & Border Container - Perfectly Aligned Around the Event */}
                             <div 
                               className={cn(
                                 "absolute -inset-x-2.5 sm:-inset-x-3 -inset-y-2 sm:-inset-y-2.5 rounded-2xl transition-all duration-500 pointer-events-none",
                                 isHighlighted 
                                   ? "bg-orange-50/80 border border-orange-300 shadow-sm shadow-orange-500/10 opacity-100 scale-100 z-0" 
                                   : "opacity-0 scale-98 border-transparent pointer-events-none"
                               )}
                               aria-hidden="true"
                             />

                             <div className="relative z-10 flex items-start space-x-3.5 sm:space-x-4">
                               <div>
                                 <span className={cn(
                                   "h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center ring-4 transition-all duration-500",
                                   isHighlighted 
                                     ? "ring-orange-200 bg-orange-500 text-white shadow-sm shadow-orange-500/30 scale-102" 
                                     : isFirst 
                                       ? "ring-white bg-orange-500 text-white shadow-xs shadow-orange-500/40" 
                                       : "ring-white bg-orange-500/85 text-white shadow-2xs"
                                 )}>
                                   {getStatusIcon(event.status, "w-4 h-4 sm:w-4.5 sm:h-4.5", isAir)}
                                 </span>
                               </div>
                               <div className="flex min-w-0 flex-1 pt-0.5 flex-col">
                                 <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                   <p className={cn("text-xs sm:text-sm md:text-base font-bold transition-colors duration-300", isHighlighted ? "text-orange-950" : isFirst ? "text-gray-900" : "text-gray-700")}>
                                     {event.status}
                                   </p>
                                   <time dateTime={event.occurred_at} className="text-[11px] sm:text-xs md:text-sm text-gray-500 font-medium">
                                     {formatDateTime(event.occurred_at)} IST
                                   </time>
                                 </div>
                                 <div className="mt-0.5 flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-orange-700 bg-orange-50/80 px-2.5 py-0.5 rounded-md w-fit border border-orange-100">
                                   <MapPin className="w-3 h-3 text-orange-500" />
                                   {event.location || "System Update"}
                                 </div>
                                 {event.note && (
                                   <div className="mt-1.5 p-2 sm:p-2.5 bg-blue-50/50 border border-blue-100 rounded-lg text-xs sm:text-sm text-blue-900 leading-relaxed shadow-2xs flex items-start gap-2">
                                     <svg className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                       <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                     </svg>
                                     <p>{event.note}</p>
                                   </div>
                                 )}
                               </div>
                             </div>
                           </div>
                         </div>
                       </li>
                      )
                   })}
                 </ul>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
