"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { TrackingWidget } from "@/components/TrackingWidget";
import { TrackingResultSkeleton } from "@/components/TrackingResultSkeleton";
import {
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  Box,
  Hand,
  Truck,
  Plane,
  XCircle,
  RotateCcw,
  PackageSearch,
  Package,
  Inbox,
  Warehouse,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Star,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { business } from "@/lib/config/business";
import { aggregateTrackingHistory, isDelhiveryService } from "@/lib/courier/aggregation";
import { isInternalCourierCode } from "@/lib/courier/identity";
import {
  isExceptionStatus,
  resolveMilestoneFromHistory,
  getMilestoneStageIndex,
  resolveCustomerCurrentStatus,
} from "@/lib/courier/normalization";

interface TrackingHistoryEvent {
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
  num_packages?: number | null;
  service?: string | null;
  service_through?: string | null;
  courier?: string | null;
  current_location?: string | null;
  history: TrackingHistoryEvent[];
  customer_update?: string | null;
}

const getStatusColor = (status: string) => {
  if (isExceptionStatus(status)) return "bg-amber-100 text-amber-900 border-amber-200";
  switch (status) {
    case "Shipment Created":
    case "Manifest Uploaded":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "Picked Up":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Shipment Bagged":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Shipment Received":
      return "bg-teal-100 text-teal-800 border-teal-200";
    case "Dispatched":
    case "In Transit":
    case "Vehicle Departed":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "At Hub":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Out For Delivery":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Delivered":
      return "bg-green-100 text-green-800 border-green-200";
    case "Cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    case "Returned":
    case "Returned to Origin":
    case "Return In Transit":
    case "Return at Hub":
    case "Return Out For Delivery":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const isAirShipment = (data: TrackingData): boolean => {
  const m = (data.medium || "").toLowerCase();
  const st = (data.service_through || "").toLowerCase();
  const s = (data.service || "").toLowerCase();
  const cu = (data.customer_update || "").toLowerCase();
  return (
    m === "air" ||
    st === "air" ||
    s.includes("air") ||
    cu.includes("through air") ||
    cu.includes("by air")
  );
};

const getStatusIcon = (status: string, className = "w-5 h-5", isAir = false) => {
  if (isExceptionStatus(status)) {
    const s = status.toLowerCase();
    if (s.includes("cancel") || s.includes("reject")) return <XCircle className={className} />;
    if (s.includes("return") || s.includes("rto")) return <RotateCcw className={className} />;
    return <Clock className={className} />;
  }
  switch (status) {
    case "Shipment Created":
    case "Manifest Uploaded":
      return <Box className={className} />;
    case "Picked Up":
      return <Hand className={className} />;
    case "Shipment Bagged":
      return <Package className={className} />;
    case "Shipment Received":
      return <Inbox className={className} />;
    case "Dispatched":
    case "In Transit":
    case "Vehicle Departed":
      return isAir ? <Plane className={className} /> : <Truck className={className} />;
    case "At Hub":
      return <MapPin className={className} />;
    case "Out For Delivery":
      return isAir ? <Plane className={className} /> : <Truck className={className} />;
    case "Delivered":
      return <CheckCircle2 className={className} />;
    case "Cancelled":
      return <XCircle className={className} />;
    case "Returned":
    case "Returned to Origin":
    case "Return In Transit":
    case "Return at Hub":
    case "Return Out For Delivery":
      return <RotateCcw className={className} />;
    default:
      return <Clock className={className} />;
  }
};

const getDynamicMessage = (
  status: string,
  sender?: string | null,
  receiver?: string | null
) => {
  const highlightClass = "uppercase font-bold text-orange-600 tracking-wide";
  const fromName = sender ? <span className={highlightClass}>{sender}</span> : "the sender";
  const toName = receiver ? <span className={highlightClass}>{receiver}</span> : "the receiver";

  switch (status) {
    case "Shipment Created":
    case "Manifest Uploaded":
      return <>Your shipment has been registered successfully and is awaiting pickup.</>;
    case "Picked Up":
      return <>Great news! Your shipment from {fromName} to {toName} has been picked up successfully.</>;
    case "Shipment Bagged":
      return <>Your shipment from {fromName} to {toName} has been bagged and is being prepared for dispatch.</>;
    case "Shipment Received":
      return <>Your shipment from {fromName} to {toName} has been received at our facility and is being processed.</>;
    case "Dispatched":
      return <>Your shipment from {fromName} to {toName} has been dispatched and is on its way.</>;
    case "In Transit":
      return <>Your shipment from {fromName} to {toName} is currently in transit. Thank you for your patience.</>;
    case "At Hub":
      return <>Your shipment from {fromName} to {toName} has arrived at our hub and is being processed for the next leg of its journey.</>;
    case "Out For Delivery":
      return <>Exciting news! Your shipment is out for delivery and will reach {toName} soon.</>;
    case "Delivered":
      return <>Your shipment from {fromName} to {toName} has been successfully delivered.</>;
    case "Cancelled":
      return <>This shipment has been cancelled. Please contact KSR Shipping Services if you require assistance.</>;
    case "Returned":
    case "Returned to Origin":
      return <>This shipment has been returned to {fromName}.</>;
    case "Return In Transit":
      return <>This shipment is in transit back to {fromName}.</>;
    case "Return at Hub":
      return <>This shipment has reached the distribution center nearest to {fromName}.</>;
    case "Return Out For Delivery":
      return <>This shipment is out for delivery to return to {fromName}.</>;
    default:
      return <>Your shipment from {fromName} to {toName} is currently in transit.</>;
  }
};

const getStageTimestamp = (
  stageIndex: number,
  history: TrackingHistoryEvent[],
  isDelhivery: boolean = false
): { date: string; full: string; time: string } | null => {
  if (!history || history.length === 0) return null;

  let matched: TrackingHistoryEvent | undefined;
  if (stageIndex === 0) {
    matched =
      [...history].reverse().find((e) => {
        const s = e.status.toLowerCase();
        return s.includes("creat");
      }) || [...history].reverse()[0];
  } else if (stageIndex === 1) {
    matched =
      [...history].reverse().find((e) => {
        const s = e.status.toLowerCase();
        return s.includes("pick") || s.includes("shipped") || s.includes("bag");
      }) ||
      [...history].reverse().find((e) => {
        const s = e.status.toLowerCase();
        return !s.includes("creat");
      });
  } else if (stageIndex === 2) {
    matched = history.find((e) => {
      const s = e.status.toLowerCase();
      const n = (e.note || "").toLowerCase();
      return (
        (s.includes("transit") ||
          s.includes("hub") ||
          s.includes("dispatch") ||
          s.includes("receiv") ||
          s.includes("depart") ||
          n.includes("depart") ||
          n.includes("transit")) &&
        !s.includes("out for delivery") &&
        !n.includes("out for delivery") &&
        !s.includes("delivered")
      );
    });
  } else if (stageIndex === 3) {
    matched = history.find((e) => {
      const s = e.status.toLowerCase();
      const n = (e.note || "").toLowerCase();
      if (isDelhivery) {
        return (
          s.includes("out for delivery") ||
          n.includes("out for delivery") ||
          s.includes("dispatched") ||
          n.includes("dispatched")
        );
      }
      return (
        s.includes("out for delivery") ||
        n.includes("out for delivery") ||
        s === "ofd" ||
        n === "ofd"
      );
    });
  } else if (stageIndex === 4) {
    matched = history.find((e) => {
      const s = e.status.toLowerCase();
      return (
        s === "delivered" ||
        (s.includes("deliver") && !s.includes("out for delivery"))
      );
    });
  }

  if (!matched?.occurred_at) return null;
  const d = new Date(matched.occurred_at);
  if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return null;

  const dateStr = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  const yearStr = d.toLocaleDateString("en-GB", {
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const timeStr = d
    .toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    })
    .toLowerCase();

  return {
    date: `${dateStr} ${yearStr}`,
    full: `${dateStr} ${yearStr}, ${timeStr}`,
    time: timeStr,
  };
};

const formatGroupTimestamp = (
  d: Date
): { date: string; full: string; time: string } => {
  const dateStr = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  const yearStr = d.toLocaleDateString("en-GB", {
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const timeStr = d
    .toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    })
    .toLowerCase();

  return {
    date: `${dateStr} ${yearStr}`,
    full: `${dateStr} ${yearStr}, ${timeStr}`,
    time: timeStr,
  };
};

const STAGES = [
  { label: "Shipment Created", key: "created" },
  { label: "Shipped", key: "shipped" },
  { label: "In Transit", key: "in_transit" },
  { label: "Out for Delivery", key: "out_for_delivery" },
  { label: "Delivered", key: "delivered" },
];

const renderStageIcon = (
  idx: number,
  isCompleted: boolean,
  isCurrent: boolean,
  isAir = false
) => {
  const iconSize = "w-4 h-4 sm:w-5 sm:h-5";
  const iconColor = isCompleted || isCurrent ? "text-white" : "text-gray-400";

  switch (idx) {
    case 0:
      return <Package className={cn(iconSize, iconColor)} />;
    case 1:
      return <Warehouse className={cn(iconSize, iconColor)} />;
    case 2:
      return isAir ? (
        <Plane className={cn(iconSize, iconColor, "-rotate-12")} />
      ) : (
        <Truck className={cn(iconSize, iconColor)} />
      );
    case 3:
      return isAir ? (
        <Plane className={cn(iconSize, iconColor, "-rotate-12")} />
      ) : (
        <Truck className={cn(iconSize, iconColor)} />
      );
    case 4:
      return isCompleted || isCurrent ? (
        <Check
          strokeWidth={3}
          className={cn("w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 text-white relative z-10 drop-shadow-xs")}
        />
      ) : (
        <CheckCircle2
          strokeWidth={2}
          className={cn(iconSize, iconColor, "relative z-10")}
        />
      );
    default:
      return <Package className={cn(iconSize, iconColor)} />;
  }
};

function getVehicleY(p: number, positions: number[]): number {
  if (!positions || positions.length < 5) return 0;
  if (p <= 0) return positions[0];
  if (p >= 4) return positions[4];

  const stage = Math.floor(p);
  const fraction = p - stage;

  const startY = positions[stage];
  const endY = positions[stage + 1];

  return startY + fraction * (endY - startY);
}

export default function TrackResult({
  initialData = null,
  searchedId = null,
}: {
  initialData?: TrackingData | null;
  searchedId?: string | null;
}) {
  const searchParams = useSearchParams();
  const rawTrackingId = searchParams.get("id");
  const trackingId = rawTrackingId ? rawTrackingId.trim() : null;

  const [data, setData] = useState<TrackingData | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>(() => {
    if (searchedId && !initialData) {
      return "Shipment Not Found";
    }
    return "";
  });

  // Individual collapsible state for each milestone stage (0 to 4).
  // All milestones collapsed by default as required.
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({
    0: false,
    1: false,
    2: false,
    3: false,
    4: false,
  });

  const toggleStage = (stageIdx: number) => {
    setExpandedStages((prev) => ({
      ...prev,
      [stageIdx]: !prev[stageIdx],
    }));
  };

  useEffect(() => {
    if (!trackingId) {
      setData(null);
      setError("");
      return;
    }

    if (searchedId && trackingId.toUpperCase() === searchedId.toUpperCase()) {
      if (initialData) {
        setData(initialData);
        setError("");
      } else {
        setData(null);
        setError("Shipment Not Found");
      }
      return;
    }

    if (data && data.tracking_id.toUpperCase() === trackingId.toUpperCase()) {
      return;
    }

    let isCancelled = false;
    const handleSearch = async (id: string) => {
      setLoading(true);
      setError("");
      setData(null);

      try {
        const res = await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackingNumber: id.trim() }),
        });

        if (isCancelled) return;

        if (!res.ok) {
          if (res.status === 404) {
            setError("Shipment Not Found");
          } else {
            setError("Error fetching details");
          }
          return;
        }

        const result = await res.json();
        if (isCancelled) return;

        if (result.success && result.data) {
          setData(result.data);
          setError("");
        } else {
          setError("Shipment Not Found");
        }
      } catch (err) {
        if (!isCancelled) {
          console.error(err);
          setError("Connection Failed");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    handleSearch(trackingId);

    return () => {
      isCancelled = true;
    };
  }, [trackingId, initialData, searchedId]);

  const isDelhivery = useMemo(() => {
    if (!data) return false;
    return isDelhiveryService(data.service, data.service_through, data.courier);
  }, [data?.service, data?.service_through, data?.courier]);

  const isAir = useMemo(() => (data ? isAirShipment(data) : false), [data]);

  const finalStageIdx = useMemo(() => {
    if (!data) return 0;
    return resolveMilestoneFromHistory(
      data.current_status,
      data.history,
      data.customer_update,
      isDelhivery
    );
  }, [data, isDelhivery]);

  const isDelivered = useMemo(() => {
    if (!data) return false;
    return (
      (data.current_status.toLowerCase().trim() === "delivered" ||
        finalStageIdx === 4) &&
      !data.current_status.toLowerCase().includes("return")
    );
  }, [data, finalStageIdx]);

  // Measure exact vertical centers of all 5 stage circles for continuous physical travel
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const circleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [nodePositions, setNodePositions] = useState<number[]>([]);
  const [vehicleX, setVehicleX] = useState(22);

  const updateNodePositions = useCallback(() => {
    if (!timelineContainerRef.current) return;
    const containerRect = timelineContainerRef.current.getBoundingClientRect();
    const positions: number[] = [];

    for (let i = 0; i < 5; i++) {
      const el = circleRefs.current[i];
      if (el) {
        const rect = el.getBoundingClientRect();
        const centerY = (rect.top + rect.bottom) / 2 - containerRect.top;
        positions.push(centerY);
        if (i === 0) {
          const centerX = (rect.left + rect.right) / 2 - containerRect.left;
          setVehicleX(centerX);
        }
      }
    }

    if (positions.length === 5) {
      setNodePositions(positions);
    }
  }, []);

  useEffect(() => {
    updateNodePositions();

    const handleResize = () => {
      updateNodePositions();
    };

    window.addEventListener("resize", handleResize);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && timelineContainerRef.current) {
      observer = new ResizeObserver(() => {
        updateNodePositions();
      });
      observer.observe(timelineContainerRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (observer) observer.disconnect();
    };
  }, [updateNodePositions, data]);

  // Continuous animation state from Stage 0 to Current Stage + 50%
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  // Target stage progress:
  // - Stage 0: 0.5 (halfway between Stage 0 and Stage 1)
  // - Stage 1: 1.5 (halfway between Stage 1 and Stage 2)
  // - Stage 2: 2.5 (halfway between Stage 2 and Stage 3)
  // - Stage 3: 3.5 (halfway between Stage 3 and Stage 4)
  // - Stage 4: 4.0 (Delivered at Stage 4)
  const targetProgress = useMemo(() => {
    if (finalStageIdx === 0) return 0.5;
    if (finalStageIdx === 1) return 1.5;
    if (finalStageIdx === 2) return 2.5;
    if (finalStageIdx === 3) return 3.5;
    return 4.0;
  }, [finalStageIdx]);

  useEffect(() => {
    if (!data) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setCurrentProgress(targetProgress);
      setIsAnimationComplete(true);
      return;
    }

    setCurrentProgress(0);
    setIsAnimationComplete(false);

    let animationFrameId: number;
    let startTime: number | null = null;

    // Total duration: calibrated gentle sine glide
    const duration =
      finalStageIdx === 0
        ? 1200
        : finalStageIdx === 1
          ? 1600
          : finalStageIdx === 2
            ? 2200
            : finalStageIdx === 3
              ? 2500
              : 2800;

    // Gentle natural sine ease-out: steady natural glide, softly easing into arrival
    const easeOutSine = (t: number) => Math.sin((t * Math.PI) / 2);

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutSine(progress);
      const current = eased * targetProgress;

      setCurrentProgress(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrentProgress(targetProgress);
        setIsAnimationComplete(true);
      }
    };

    // Small delay on mount so the user clearly perceives the journey start from Stage 0
    const timeoutId = setTimeout(() => {
      updateNodePositions();
      animationFrameId = requestAnimationFrame(step);
    }, 120);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [finalStageIdx, data?.tracking_id, targetProgress, updateNodePositions]);

  // Delivered Feedback Pop-up Modal state: triggers with success & thank you message upon reaching delivery
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackDismissed, setFeedbackDismissed] = useState(false);

  useEffect(() => {
    setShowFeedbackModal(false);
    setFeedbackDismissed(false);
  }, [trackingId]);

  useEffect(() => {
    if (isDelivered && isAnimationComplete && !feedbackDismissed) {
      const timer = setTimeout(() => {
        setShowFeedbackModal(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isDelivered, isAnimationComplete, feedbackDismissed]);

  const customerDisplayStatus = useMemo(() => {
    if (!data) return "In Transit";
    return resolveCustomerCurrentStatus(
      data.current_status,
      data.history,
      data.customer_update,
      isDelhivery
    );
  }, [data, isDelhivery]);

  // Aggregate tracking history into grouped timeline events using existing aggregation logic
  const aggregatedGroups = useMemo(() => {
    if (!data?.history || data.history.length === 0) return [];
    return aggregateTrackingHistory(data.history, {
      maxShipmentPackages: data.num_packages || undefined,
      isDelhivery,
      service: data.service,
      serviceThrough: data.service_through,
      courier: data.courier,
    });
  }, [data, isDelhivery]);

  // Bucket aggregated groups into the 5 milestone stages (0 to 4) monotonically
  const milestoneGroups = useMemo(() => {
    const buckets: Record<number, typeof aggregatedGroups> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
    };

    if (!aggregatedGroups || aggregatedGroups.length === 0) {
      return buckets;
    }

    // Sort chronological ascending (oldest first) to evaluate monotonic stage progression
    const chronological = [...aggregatedGroups].sort(
      (a, b) => a.last_occurred_at.getTime() - b.last_occurred_at.getTime()
    );

    let activeMilestone = 0;

    for (const g of chronological) {
      const rawStage = getMilestoneStageIndex(
        g.status,
        g.events[0]?.note,
        undefined,
        isDelhivery
      );

      if (rawStage > activeMilestone) {
        activeMilestone = rawStage;
      }

      const assignedStage =
        rawStage === 0 &&
        activeMilestone > 0 &&
        !g.status.toLowerCase().includes("creat") &&
        !g.status.toLowerCase().includes("manifest")
          ? activeMilestone
          : rawStage >= activeMilestone
          ? rawStage
          : activeMilestone;

      buckets[assignedStage].push(g);
    }

    // Sort each bucket newest first (reverse chronological) for timeline rendering
    for (let i = 0; i <= 4; i++) {
      buckets[i].sort(
        (a, b) => b.last_occurred_at.getTime() - a.last_occurred_at.getTime()
      );
    }

    return buckets;
  }, [aggregatedGroups, isDelhivery]);

  return (
    <div className={cn(trackingId ? "space-y-3 sm:space-y-4 pt-1 sm:pt-2" : "space-y-8")}>
      {/* Header & Subtitle - Displayed when tracking number has not been entered */}
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

      {loading && <TrackingResultSkeleton />}

      {error && !loading && (
        <div className="bg-white border border-gray-100 shadow-xl shadow-gray-200/50 rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-red-400 opacity-5 rounded-full blur-3xl pointer-events-none" />

          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <PackageSearch className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Shipment Not Found</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            We couldn&apos;t find a shipment matching the tracking number{" "}
            <span className="font-bold text-gray-900">{trackingId}</span>. Please verify
            the tracking number or contact our support team for assistance.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/track"
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-medium transition-colors"
            >
              Try Again
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-orange-500/25"
            >
              Contact Us
            </Link>
          </div>
        </div>
      )}

      {data && (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg shadow-orange-900/5 overflow-hidden border border-orange-100/60">
          {/* Header Card: Tracking ID, Status Badge, Estimated Delivery */}
          <div className="bg-gradient-to-br from-orange-50/80 via-white to-orange-50/30 px-4 py-3.5 sm:px-7 sm:py-5 border-b border-orange-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-orange-400 opacity-10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-row justify-between items-center gap-2 sm:gap-4 relative z-10">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-orange-600 uppercase tracking-wider font-bold mb-0.5">
                  Tracking Number
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h2 className="text-lg xs:text-xl sm:text-3xl font-black tracking-tight text-gray-900 truncate">
                    {data.tracking_id}
                  </h2>
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-bold border shrink-0 shadow-2xs",
                      getStatusColor(customerDisplayStatus)
                    )}
                  >
                    {getStatusIcon(customerDisplayStatus, "w-3 h-3 sm:w-3.5 sm:h-3.5", isAir)}
                    {customerDisplayStatus}
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
                  {data.estimated_delivery &&
                  new Date(data.estimated_delivery).getFullYear() > 1970
                    ? new Date(data.estimated_delivery).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Processing"}
                </p>
              </div>
            </div>

            {/* Dynamic Customer Notification Banner */}
            <div
              className={cn(
                "mt-3 border rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-3.5 shadow-xs transition-all relative z-10",
                isDelivered
                  ? "bg-gradient-to-r from-orange-50/90 via-amber-50/60 to-orange-50/90 border-orange-200"
                  : "bg-gradient-to-r from-orange-50/90 via-orange-50/50 to-amber-50/70 border-orange-200/80"
              )}
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div
                  className={cn(
                    "text-white p-2 rounded-xl shrink-0 shadow-xs",
                    isDelivered
                      ? "bg-emerald-500 shadow-emerald-500/20"
                      : "bg-orange-500 shadow-orange-500/20"
                  )}
                >
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
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    className="shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path
                        fill="#4285F4"
                        d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                      />
                      <path
                        fill="#34A853"
                        d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.369 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.109 -17.884 43.989 -14.754 43.989 Z"
                      />
                    </g>
                  </svg>
                  <span>Drop a review on Google</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                </a>
              )}
            </div>

            {/* Shipment Update Notice Banner */}
            {data.customer_update &&
              data.customer_update.trim() !== "" &&
              (!isDelhivery || !isExceptionStatus(data.customer_update)) && (
                <div className="mt-2.5 sm:mt-3 border border-orange-200/80 rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 bg-white shadow-xs transition-all w-full relative z-10">
                  <p className="font-medium text-xs sm:text-sm md:text-[14px] leading-relaxed text-gray-800 break-words">
                    <span className="font-bold text-orange-600 uppercase tracking-wider underline underline-offset-2 mr-1.5 sm:mr-2">
                      Shipment Update:
                    </span>
                    <span className="font-semibold text-gray-800">
                      {data.customer_update}
                    </span>
                  </p>
                </div>
              )}
          </div>

          {/* UNIFIED VERTICAL SHIPMENT PROGRESS TRACKER */}
          <div className="px-4 py-5 sm:px-7 sm:py-7 bg-white" id="unified-vertical-tracker">
            {/* Header: Title and IST Timing Indicator */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                  Shipment Progress Tracker
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Follow each milestone of your shipment journey with detailed operational logs
                </p>
              </div>
              <div className="bg-orange-50/80 border border-orange-100 rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-600 shadow-2xs">
                <Clock className="w-3 h-3 text-orange-500 shrink-0" />
                <span>
                  All timings in <span className="font-semibold text-gray-800">IST (Indian Standard Time)</span>
                </span>
              </div>
            </div>

            {/* 5 Vertically Connected Stages */}
            <div className="flow-root relative" ref={timelineContainerRef}>
              {/* Single Continuous Traveling Vehicle Icon */}
              {nodePositions.length === 5 && (
                <div
                  className={cn(
                    "absolute z-[5] pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center justify-center will-change-transform transition-opacity duration-500",
                    isDelivered && isAnimationComplete ? "opacity-0" : "opacity-100"
                  )}
                  style={{
                    top: `${getVehicleY(currentProgress, nodePositions)}px`,
                    left: `${vehicleX}px`,
                  }}
                >
                  <motion.div
                    animate={isAnimationComplete && !isDelivered ? { y: [0, -2.5, 0] } : {}}
                    transition={
                      isAnimationComplete && !isDelivered
                        ? { repeat: Infinity, duration: 2, ease: "easeInOut" }
                        : {}
                    }
                    className="flex items-center justify-center"
                  >
                    {isAir ? (
                      <Plane
                        className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 fill-white filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)] rotate-45"
                        strokeWidth={2}
                      />
                    ) : (
                      <Truck
                        className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 fill-white filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
                        strokeWidth={2}
                      />
                    )}
                  </motion.div>
                </div>
              )}

              {STAGES.map((stage, i) => {
                // Stage progress logic:
                // Node is reached only when the vehicle arrives at or passes by it
                const isNodeReached = currentProgress >= (i === 0 ? 0 : i - 0.15);
                const isFinalTarget = i === finalStageIdx;
                const isCurrentActive = isFinalTarget && isNodeReached;

                // Vehicle is actively passing through this intermediate node right now
                const isPassingThrough =
                  !isFinalTarget &&
                  currentProgress >= (i === 0 ? 0 : i - 0.15) &&
                  currentProgress < i + 0.45;

                const isCompleted = isNodeReached && !isFinalTarget && currentProgress >= i + 0.45;
                const isUpcoming = !isNodeReached;
                const isExpanded = !!expandedStages[i];
                const stageEvents = milestoneGroups[i] || [];

                // Milestone header timestamp
                const stageTimestamp =
                  stageEvents.length > 0
                    ? formatGroupTimestamp(stageEvents[0].last_occurred_at)
                    : getStageTimestamp(i, data.history, isDelhivery);

                // Values for Current Stage Always-Visible Summary Card
                const latestSummaryStatus =
                  stageEvents[0]?.headline ||
                  stageEvents[0]?.status ||
                  customerDisplayStatus ||
                  data.current_status;

                const latestSummaryLocation =
                  stageEvents[0]?.location ||
                  data.current_location ||
                  data.history[0]?.location ||
                  (i === 4
                    ? data.receiver_city || data.destination
                    : data.sender_city || "Current Facility");

                const latestSummaryTimestamp =
                  stageEvents[0]?.last_occurred_at
                    ? formatGroupTimestamp(stageEvents[0].last_occurred_at)
                    : stageTimestamp;

                const summaryNotice =
                  data.customer_update && data.customer_update.trim()
                    ? data.customer_update.trim()
                    : null;

                return (
                  <div key={stage.key} className="relative flex items-start gap-3.5 sm:gap-5">
                    {/* Left: Node circle + vertically connecting line */}
                    <div className="flex flex-col items-center self-stretch shrink-0 w-9 sm:w-11">
                      {/* Node Circle with dynamic stage pass-through glow */}
                      <div
                        ref={(el) => {
                          circleRefs.current[i] = el;
                        }}
                        className={cn(
                          "w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-300 relative",
                          isCurrentActive
                            ? isDelivered
                              ? "bg-emerald-500 text-white ring-4 ring-emerald-200/90 shadow-lg shadow-emerald-500/30 scale-105"
                              : "bg-orange-500 text-white ring-4 ring-orange-200/90 shadow-lg shadow-orange-500/30 scale-105"
                            : isPassingThrough
                              ? "bg-orange-500 text-white ring-4 ring-orange-300 shadow-[0_0_22px_rgba(249,115,22,0.75)] scale-105"
                              : isCompleted
                                ? "bg-orange-500 text-white shadow-xs shadow-orange-500/20"
                                : "bg-gray-100 border border-gray-200 text-gray-400"
                        )}
                        aria-label={`${stage.label}: ${isCurrentActive ? (isDelivered ? "Delivered" : "Current") : isCompleted ? "Completed" : "Upcoming"}`}
                      >
                        {/* Glowing ripple aura when vehicle icon is actively passing through intermediate node */}
                        {isPassingThrough && (
                          <span className="absolute -inset-1 rounded-full bg-orange-400/50 animate-ping pointer-events-none -z-10" />
                        )}
                        {/* Glowing halo for delivered when reached */}
                        {isCurrentActive && isDelivered && (
                          <span className="absolute -inset-1 rounded-full bg-emerald-400/40 animate-pulse pointer-events-none -z-10" />
                        )}
                        {renderStageIcon(i, isNodeReached, isCurrentActive, isAir)}
                      </div>

                      {/* Continuous vertical connecting line to next stage */}
                      {i < 4 && (() => {
                        // Calculate percentage of this segment filled with solid opaque line
                        const segmentFill = Math.min(100, Math.max(0, (currentProgress - i) * 100));

                        return (
                          <div
                            className={cn(
                              "relative flex flex-col items-center w-[2.5px] sm:w-[3px] flex-grow my-1",
                              isFinalTarget && !isDelivered
                                ? "min-h-[52px] sm:min-h-[64px]"
                                : "min-h-[28px] sm:min-h-[32px]"
                            )}
                          >
                            {/* Base track: gray track */}
                            <div className="absolute inset-0 rounded-full bg-gray-200" />

                            {/* Solid opaque fill line advancing smoothly from Stage 0 to destination */}
                            <div
                              className="absolute top-0 w-full rounded-full z-[1] bg-orange-500"
                              style={{ height: `${segmentFill}%` }}
                            />
                          </div>
                        );
                      })()}
                    </div>

                    {/* Right: Milestone Header, Summary, and Collapsible Events Area */}
                    <div className={cn("flex-1 min-w-0", i < 4 ? "pb-6 sm:pb-8" : "pb-2")}>
                      {/* Milestone Header Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                          <h4
                            className={cn(
                              "text-sm sm:text-base md:text-lg font-bold leading-tight transition-colors duration-300",
                              isCurrentActive
                                ? "text-gray-950 font-black"
                                : isNodeReached
                                  ? "text-gray-900"
                                  : "text-gray-400"
                            )}
                          >
                            {stage.label}
                          </h4>

                          {/* Stage State Badge */}
                          {isCurrentActive ? (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border transition-all duration-300",
                                isDelivered
                                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                  : "text-orange-700 bg-orange-100/90 border-orange-200"
                              )}
                            >
                              <span
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full animate-pulse",
                                  isDelivered ? "bg-emerald-500" : "bg-orange-500"
                                )}
                              />
                              {isDelivered ? "Delivered" : "Current Stage"}
                            </span>
                          ) : isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 transition-all duration-300">
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold text-gray-400 bg-gray-50 border border-gray-200 transition-all duration-300">
                              Upcoming
                            </span>
                          )}
                        </div>

                        {/* Top-Right: Timestamp & Individual View Details / Hide Details Button */}
                        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                          {stageTimestamp && (
                            <div className="text-right hidden xs:block">
                              <span className="text-[11px] sm:text-xs font-semibold text-gray-500">
                                {stageTimestamp.full || stageTimestamp.date}
                              </span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleStage(i)}
                            aria-expanded={isExpanded}
                            aria-label={`${isExpanded ? "Hide" : "View"} details for ${stage.label}`}
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400/50",
                              isExpanded
                                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                : isCurrentActive
                                  ? "bg-orange-500 hover:bg-orange-600 text-white shadow-xs"
                                  : "bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200/80"
                            )}
                          >
                            <span>{isExpanded ? "Hide Details" : "View Details"}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Timestamp on mobile when hidden in header */}
                      {stageTimestamp && (
                        <p className="text-[10px] text-gray-500 font-medium mt-0.5 xs:hidden">
                          {stageTimestamp.full || stageTimestamp.date}
                        </p>
                      )}

                      {/* City from receiver details for Delivered milestone */}
                      {i === 4 && (data.receiver_city || data.destination) && (
                        <div className={cn(
                          "flex items-center gap-1.5 text-xs sm:text-sm font-medium mt-1 transition-colors duration-300",
                          isNodeReached ? "text-gray-800" : "text-gray-400"
                        )}>
                          <MapPin className={cn(
                            "w-3.5 h-3.5 shrink-0 transition-colors duration-300",
                            isNodeReached ? "text-orange-500" : "text-gray-400"
                          )} />
                          <span className={cn(
                            "font-semibold",
                            isNodeReached ? "text-gray-800" : "text-gray-400"
                          )}>
                            {data.receiver_city || data.destination}
                          </span>
                        </div>
                      )}

                      {/* ============================================================== */}
                      {/* CRITICAL: CURRENT STAGE SUMMARY MUST ALWAYS REMAIN VISIBLE     */}
                      {/* Displays latest operational update, location, and timestamp    */}
                      {/* even when milestone details are collapsed!                     */}
                      {/* ============================================================== */}
                      {isFinalTarget && (
                        <div
                          className={cn(
                            "mt-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-50/90 via-white to-amber-50/40 border border-orange-200/90 shadow-xs transition-opacity duration-300",
                            isNodeReached ? "opacity-100" : "opacity-60"
                          )}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2.5 sm:gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                                <span
                                  className={cn(
                                    "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 animate-pulse",
                                    isCurrentActive ? "bg-orange-500" : "bg-gray-400"
                                  )}
                                  aria-hidden="true"
                                />
                                <span className={cn(
                                  "text-[10.5px] sm:text-xs font-bold uppercase tracking-wider transition-colors duration-300",
                                  isCurrentActive ? "text-orange-600" : "text-gray-500"
                                )}>
                                  Latest Operational Update
                                </span>
                              </div>
                              <p className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                                {latestSummaryStatus}
                              </p>
                            </div>

                            {latestSummaryTimestamp && (
                              <div className="text-right shrink-0 flex flex-col items-end">
                                <span className="text-xs sm:text-sm font-bold text-gray-800">
                                  {latestSummaryTimestamp.date}
                                </span>
                                <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
                                  {latestSummaryTimestamp.time}{" "}
                                  <span className="font-bold text-gray-400">IST</span>
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Location badge */}
                          {latestSummaryLocation && (
                            <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-white/90 border border-orange-100 rounded-lg px-2.5 py-1 w-fit shadow-2xs">
                              <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                              <span className="uppercase text-[11px] sm:text-xs font-bold text-gray-800 tracking-tight">
                                {latestSummaryLocation}
                              </span>
                            </div>
                          )}

                          {/* Customer Operational Notice / Update */}
                          {summaryNotice && (
                            <div className="mt-2.5 p-2.5 sm:p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-xs sm:text-sm text-blue-950 font-medium flex items-start gap-2">
                              <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                              <div className="min-w-0 flex-1 leading-relaxed">
                                <span className="font-bold text-blue-900 mr-1.5">Notice:</span>
                                <span>{summaryNotice}</span>
                              </div>
                            </div>
                          )}

                          {/* Delivered Google Review link */}
                          {isDelivered && (
                            <div className="mt-3 pt-2.5 border-t border-orange-100 flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-xs font-medium text-gray-600">
                                Package delivered successfully
                              </span>
                              <a
                                href={
                                  business.googleReviewUrl ||
                                  "https://g.page/r/CdBtDQra-a6oEB0/review"
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-orange-50 text-gray-800 hover:text-orange-600 font-bold text-xs rounded-lg border border-orange-200 transition-colors shadow-2xs shrink-0"
                              >
                                <span>Review on Google</span>
                                <ExternalLink className="w-3 h-3 text-gray-400" />
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ============================================================== */}
                      {/* INDEPENDENT COLLAPSIBLE AREA FOR MILESTONE EVENT LOGS          */}
                      {/* ============================================================== */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            key={`milestone-content-${i}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3.5 pt-3 border-t border-gray-100">
                              {stageEvents.length > 0 ? (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500">
                                      Detailed Event Log ({stageEvents.length}{" "}
                                      {stageEvents.length === 1 ? "entry" : "entries"})
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium">
                                      Newest First
                                    </span>
                                  </div>

                                  <div className="max-h-72 sm:max-h-80 overflow-y-auto overscroll-contain pr-2 select-text [scrollbar-gutter:stable] relative pl-2.5 sm:pl-3 space-y-3.5">
                                    {stageEvents.map((group, groupIdx) => {
                                      const isSubLast = groupIdx === stageEvents.length - 1;
                                      const isSubFirst = groupIdx === 0;

                                      return (
                                        <div
                                          key={group.id}
                                          className="relative flex items-start gap-3"
                                        >
                                          {/* Sub-timeline connecting line between events */}
                                          {!isSubLast && (
                                            <span
                                              className="absolute left-[11px] sm:left-[13px] top-6 -bottom-3.5 w-[1.5px] bg-orange-100"
                                              aria-hidden="true"
                                            />
                                          )}

                                          {/* Event status icon node */}
                                          <div className="relative z-10 shrink-0">
                                            <span
                                              className={cn(
                                                "w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white text-xs shadow-2xs",
                                                isSubFirst && isCurrentActive
                                                  ? "bg-orange-500 ring-2 ring-orange-200"
                                                  : "bg-orange-500/85"
                                              )}
                                            >
                                              {getStatusIcon(
                                                group.status,
                                                "w-3 h-3 sm:w-3.5 sm:h-3.5",
                                                isAir
                                              )}
                                            </span>
                                          </div>

                                          {/* Event status headline, timestamp, location, and note */}
                                          <div className="flex-1 min-w-0 pt-0.5">
                                            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                                              <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                                                {group.headline || group.status}
                                              </p>

                                              <div className="text-right shrink-0 ml-auto flex items-baseline gap-1 text-[10px] sm:text-[11px] text-gray-500 font-semibold">
                                                <span>
                                                  {group.last_occurred_at.toLocaleDateString(
                                                    "en-GB",
                                                    {
                                                      day: "2-digit",
                                                      month: "short",
                                                      year: "numeric",
                                                      timeZone: "Asia/Kolkata",
                                                    }
                                                  )}
                                                </span>
                                                <span className="text-gray-400">•</span>
                                                <span>
                                                  {group.last_occurred_at
                                                    .toLocaleTimeString("en-US", {
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                      hour12: true,
                                                      timeZone: "Asia/Kolkata",
                                                    })
                                                    .toLowerCase()}
                                                </span>
                                                <span className="text-[8.5px] text-gray-400 font-bold uppercase">
                                                  IST
                                                </span>
                                              </div>
                                            </div>

                                            {/* Location Tag */}
                                            {group.location && (
                                              <div className="mt-1 flex items-center gap-1 text-[10.5px] sm:text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5 w-fit">
                                                <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                                                <span>{group.location}</span>
                                              </div>
                                            )}

                                            {/* Operational note card if available */}
                                            {(() => {
                                              const note = group.events[0]?.note;
                                              if (!note) return null;
                                              const clean = note.trim();
                                              const lower = clean.toLowerCase();
                                              if (
                                                lower === "status updated" ||
                                                lower === group.headline.toLowerCase() ||
                                                isInternalCourierCode(clean)
                                              ) {
                                                return null;
                                              }
                                              return (
                                                <div className="mt-1.5 p-2 sm:p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-950 font-medium flex items-start gap-1.5">
                                                  <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                                                  <p className="leading-snug">{clean}</p>
                                                </div>
                                              );
                                            })()}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-500 font-medium">
                                  {isUpcoming
                                    ? "Upcoming milestone — detailed event logs will appear here once this stage is reached."
                                    : "Shipment reached this milestone. No intermediate log scans were recorded."}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Delivered Feedback Pop-up Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => {
                setShowFeedbackModal(false);
                setFeedbackDismissed(true);
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Modal Card */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="feedback-modal-title"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 z-10 text-center overflow-hidden"
            >
              {/* Ambient Decorative Glow */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackDismissed(true);
                }}
                className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close feedback modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Celebratory Success Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50/60 shadow-inner">
                <Check className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600 stroke-[3]" />
              </div>

              {/* Success Heading & Thank You Message */}
              <h3
                id="feedback-modal-title"
                className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-2"
              >
                Delivered Successfully!
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Thank you for choosing{" "}
                <span className="font-bold text-gray-900">KSR Shipping Services</span>.
                We hope your delivery was safe and prompt!
              </p>

              {/* 5-Star Visual Prompt */}
              <div className="flex items-center justify-center gap-1.5 mb-2 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-400 text-amber-400 drop-shadow-xs"
                  />
                ))}
              </div>
              <p className="text-xs sm:text-[13px] font-medium text-gray-500 mb-6">
                Your feedback helps us continuously improve our service.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5">
                <a
                  href={business.googleReviewUrl || "https://g.page/r/CdBtDQra-a6oEB0/review"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowFeedbackModal(false)}
                  className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-200 group"
                  id="google-review-modal-btn"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    className="shrink-0 bg-white rounded-full p-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path
                        fill="#4285F4"
                        d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                      />
                      <path
                        fill="#34A853"
                        d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.369 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.109 -17.884 43.989 -14.754 43.989 Z"
                      />
                    </g>
                  </svg>
                  <span>Write a Review on Google</span>
                  <ExternalLink className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setFeedbackDismissed(true);
                  }}
                  className="py-2 text-xs sm:text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
