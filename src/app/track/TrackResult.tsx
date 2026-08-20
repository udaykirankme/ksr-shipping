"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TrackingWidget } from "@/components/TrackingWidget";
import { CheckCircle2, Clock, MapPin, Box, Hand, Truck, Plane, User, XCircle, RotateCcw, Headset, ArrowRight, PackageSearch, Package, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import Link from "next/link";

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

const getStatusIcon = (status: string, className = "w-5 h-5") => {
  switch (status) {
    case 'Shipment Created': return <Box className={className} />;
    case 'Picked Up': return <Hand className={className} />;
    case 'Shipment Bagged': return <Package className={className} />;
    case 'Shipment Received': return <Inbox className={className} />;
    case 'Dispatched': return <Truck className={className} />;
    case 'In Transit': return <Plane className={className} />;
    case 'At Hub': return <MapPin className={className} />;
    case 'Out For Delivery': return <User className={className} />;
    case 'Delivered': return <CheckCircle2 className={className} />;
    case 'Cancelled': return <XCircle className={className} />;
    case 'Returned': return <RotateCcw className={className} />;
    default: return <Clock className={className} />;
  }
};

const getDynamicMessage = (status: string, sender?: string | null, receiver?: string | null) => {
  const highlightClass = "uppercase font-bold underline text-white drop-shadow-[0_0_8px_rgba(255,106,0,0.8)]";
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
  history: { id: string; status: string; location: string; note: string; occurred_at: string; }[];
  customer_update?: string | null;
}

export default function TrackResult() {
  const searchParams = useSearchParams();
  const trackingId = searchParams.get("id");
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div className="space-y-8">
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
              We couldn't find a shipment matching the tracking number <span className="font-bold text-gray-900">{trackingId}</span>. Please verify the tracking number or contact our support team for assistance.
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
         <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/5 overflow-hidden border border-orange-100/50">
            {/* Header info */}
            <div className="bg-gradient-to-br from-orange-50/80 via-white to-orange-50/30 px-6 py-8 sm:p-10 border-b border-orange-100 relative overflow-hidden">
               {/* Soft glow */}
               <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-orange-400 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
               
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                  <div>
                     <p className="text-xs text-orange-600/80 uppercase tracking-wider font-bold mb-2">Tracking Number</p>
                     <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">{data.tracking_id}</h2>
                     <div className={cn("mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border", getStatusColor(data.current_status))}>
                       {getStatusIcon(data.current_status, "w-4 h-4")}
                       {data.current_status}
                     </div>
                  </div>
                  <div className="text-left sm:text-right bg-white p-5 rounded-2xl border border-orange-100 shadow-sm min-w-[200px]">
                     <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1.5 flex items-center sm:justify-end gap-1.5">
                       <Clock className="w-3.5 h-3.5" /> Estimated Delivery
                     </p>
                     <p className="font-bold text-xl text-gray-900">
                        {data.estimated_delivery && new Date(data.estimated_delivery).getFullYear() > 1970 
                          ? new Date(data.estimated_delivery).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : "Processing"}
                     </p>
                  </div>
               </div>
               
               <div className="mt-8 pt-8 border-t border-orange-200/50 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                     <div className="flex gap-4 items-start">
                        <div className="bg-orange-100 p-2.5 rounded-xl text-orange-600 mt-1">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Origin</p>
                          <p className="font-bold text-lg text-gray-900">{data.sender_city || data.origin || "Origin Information"}</p>
                        </div>
                     </div>
                     <div className="flex gap-4 items-start md:flex-row-reverse md:text-right">
                        <div className="bg-orange-100 p-2.5 rounded-xl text-orange-600 mt-1">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Destination</p>
                          <p className="font-bold text-lg text-gray-900">{data.receiver_city || data.destination || "Destination Information"}</p>
                        </div>
                     </div>
                  </div>

                  {/* Customer Message Banner */}
                  <div className="bg-gradient-to-r from-orange-500 to-orange-400 border border-orange-500/20 rounded-2xl p-5 sm:p-6 flex gap-4 items-center shadow-lg shadow-orange-500/20 text-white">
                     <div className="bg-white/20 p-3 rounded-xl shrink-0 backdrop-blur-sm">
                        {getStatusIcon(data.current_status, "w-6 h-6")}
                     </div>
                     <p className="font-medium text-base sm:text-lg leading-snug">
                        {getDynamicMessage(data.current_status, data.sender_name, data.receiver_name)}
                     </p>
                  </div>

                  {/* IST Timing Note */}
                  <div className="mt-4 bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200/60 rounded-xl p-3 sm:p-4 flex gap-3 items-center shadow-[0_0_15px_rgba(255,106,0,0.15)] text-orange-800">
                     <div className="bg-orange-500/10 p-1.5 rounded-lg shrink-0 text-orange-600">
                        <Clock className="w-5 h-5" />
                     </div>
                     <p className="font-medium text-sm sm:text-base">
                        Please note: All timings displayed are in <span className="font-bold">Indian Standard Time (IST)</span>.
                     </p>
                  </div>

                  {/* Delay / Customer Update Card */}
                  {data.customer_update && data.customer_update.trim() !== '' && (
                     <div className="mt-4 bg-gray-50 border border-gray-200 rounded-2xl p-5 sm:p-6 flex gap-4 items-start shadow-sm text-gray-800">
                        <div className="bg-white p-2 rounded-xl shrink-0 shadow-sm border border-gray-100 text-blue-500">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                        </div>
                        <div>
                           <h4 className="font-bold text-gray-900 mb-1">Shipment Information</h4>
                           <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                              {data.customer_update}
                           </p>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* Timeline */}
            <div className="px-6 py-10 sm:px-12 bg-white">
               <h3 className="text-xl font-bold text-gray-900 mb-10 flex items-center gap-3">
                 Tracking History
               </h3>
               
               <div className="flow-root relative">
                 <ul role="list" className="-mb-8">
                   {data.history.map((event, eventIdx) => {
                      const isLast = eventIdx === data.history.length - 1;
                      const isFirst = eventIdx === 0;
                      
                      return (
                       <li key={event.id}>
                         <div className="relative pb-10">
                           {!isLast ? (
                             <span className="absolute left-6 top-6 -ml-px h-full w-0.5 bg-orange-100" aria-hidden="true" />
                           ) : null}
                           <div className="relative flex items-start space-x-6">
                             <div>
                               <span className={cn(
                                 "h-12 w-12 rounded-full flex items-center justify-center ring-8 ring-white",
                                 true ? "bg-orange-500 text-white shadow-[0_0_15px_rgba(255,106,0,0.5)]" : "bg-gray-50 text-gray-400 border border-gray-200"
                               )}>
                                 {getStatusIcon(event.status, "w-5 h-5")}
                               </span>
                             </div>
                             <div className="flex min-w-0 flex-1 pt-1.5 flex-col">
                               <p className={cn("text-lg font-bold", isFirst ? "text-gray-900" : "text-gray-600")}>
                                 {event.status}
                               </p>
                               <div className="mt-1">
                                 <time dateTime={event.occurred_at} className="text-sm text-gray-500 font-medium">
                                   {formatDateTime(event.occurred_at)} IST
                                 </time>
                               </div>
                               <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-orange-700 bg-orange-50/60 px-2.5 py-1 rounded-md w-fit border border-orange-100/50">
                                 <MapPin className="w-3 h-3 text-orange-400" />
                                 {event.location || "System Update"}
                               </div>
                               {event.note && (
                                 <div className="mt-3 p-3.5 bg-blue-50/40 border border-blue-100/60 rounded-xl text-sm text-blue-900/80 leading-relaxed shadow-sm flex items-start gap-2.5">
                                   <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                     <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                   </svg>
                                   <p>{event.note}</p>
                                 </div>
                               )}
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
