"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform, PanInfo, useInView, animate } from "framer-motion";
import { 
  Plane, Truck, HeartPulse, Box, Building2, FileText,
  ChevronLeft, ChevronRight, Hand
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const SERVICES = [
  { 
    id: "international-courier", 
    title: "International Courier", 
    icon: Plane, 
    desc: "Worldwide shipping with customs handled for you. Fast, reliable international delivery to 150+ countries." 
  },
  { 
    id: "domestic-courier", 
    title: "Domestic Courier", 
    icon: Truck, 
    desc: "Fast, reliable delivery to every corner of India with verified doorstep pickup and real-time tracking." 
  },
  { 
    id: "medicine-shipping", 
    title: "Medicine Shipping", 
    icon: HeartPulse, 
    desc: "Careful handling and prioritized routing for prescription medicines, critical healthcare supplies, and urgent care." 
  },
  { 
    id: "fragile-shipping", 
    title: "Fragile Shipping", 
    icon: Box, 
    desc: "Reinforced packaging for fragile and valuable items with multi-layer cushioning and damage protection." 
  },
  { 
    id: "commercial-shipping", 
    title: "Commercial Shipping", 
    icon: Building2, 
    desc: "Smart logistics for business and bulk orders. Tailored enterprise B2B solutions to optimize your supply chain." 
  },
  { 
    id: "document-shipping", 
    title: "Document Shipping", 
    icon: FileText, 
    desc: "Secure delivery of important documents with fast, reliable, tamper-evident, and fully trackable service." 
  },
];

// Duplicated for an infinitely smooth loop without wrap-around artifacts
const CAROUSEL_ITEMS = [...SERVICES, ...SERVICES];

export function WhatWeShipCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const isDraggingRef = useRef(false);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const scale = useTransform(x, [-200, 0, 200], [0.85, 1, 0.85]);

  useEffect(() => {
    setHasMounted(true);
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const nextCard = useCallback(() => {
    if (!isDesktop && x.get() === 0) {
      animate(x, -400, { duration: 0.6, ease: "easeInOut" }).then(() => {
        setCurrentIndex((prev) => (prev + 1) % CAROUSEL_ITEMS.length);
        x.set(0);
      });
    } else {
      setCurrentIndex((prev) => (prev + 1) % CAROUSEL_ITEMS.length);
      if (!isDesktop) x.set(0);
    }
  }, [isDesktop, x]);

  const prevCard = useCallback(() => {
    if (!isDesktop && x.get() === 0) {
      animate(x, 400, { duration: 0.6, ease: "easeInOut" }).then(() => {
        setCurrentIndex((prev) => (prev - 1 + CAROUSEL_ITEMS.length) % CAROUSEL_ITEMS.length);
        x.set(0);
      });
    } else {
      setCurrentIndex((prev) => (prev - 1 + CAROUSEL_ITEMS.length) % CAROUSEL_ITEMS.length);
      if (!isDesktop) x.set(0);
    }
  }, [isDesktop, x]);

  useEffect(() => {
    if (!hasMounted) return;
    if (shouldReduceMotion) return;
    
    // On mobile: permanently pause if user interacted
    if (!isDesktop && hasInteracted) return;

    // On desktop: stop moving only while actively interacting (holding / dragging)
    if (isDesktop && isInteracting) return;

    const timer = setInterval(() => {
      nextCard();
    }, 3000);
    
    return () => {
      clearInterval(timer);
    };
  }, [hasMounted, shouldReduceMotion, isDesktop, hasInteracted, isInteracting, currentIndex, nextCard]);

  const handleInteraction = () => {
    if (!isDesktop) {
      setHasInteracted(true);
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    }
  };

  const renderMobileDeck = () => {
    const handleDragStart = () => {
      handleInteraction();
    };

    const handleDragEnd = (e: any, info: PanInfo) => {
      const swipeThreshold = 50;
      if (info.offset.x < -swipeThreshold) {
        animate(x, -400, { duration: 0.4, ease: "easeOut" }).then(() => {
           setCurrentIndex((prev) => (prev + 1) % CAROUSEL_ITEMS.length);
           x.set(0);
        });
      } else if (info.offset.x > swipeThreshold) {
        animate(x, 400, { duration: 0.4, ease: "easeOut" }).then(() => {
           setCurrentIndex((prev) => (prev - 1 + CAROUSEL_ITEMS.length) % CAROUSEL_ITEMS.length);
           x.set(0);
        });
      } else {
        animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
      }
    };

    return (
      <div className="relative w-full max-w-[420px] mx-auto min-h-[350px] flex items-center justify-center">
        <AnimatePresence initial={false} mode="popLayout">
          {CAROUSEL_ITEMS.map((service, idx) => {
            if (idx === currentIndex) {
              return (
                <motion.div
                  key={`mobile-focus-${idx}`}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.8}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  style={{ x, rotate, scale, zIndex: 30 }}
                  initial={{ scale: 0.9, opacity: 0, x: 0, rotate: 0 }}
                  animate={{ scale: 1, opacity: 1, x: 0, rotate: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0 } }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute w-full px-4 cursor-grab active:cursor-grabbing"
                >
                  <motion.div
                    animate={!shouldReduceMotion ? {
                      x: [0, -30, 0],
                      rotate: [0, -4, 0],
                      transition: { delay: 1, duration: 1.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 3 }
                    } : { x: 0, rotate: 0 }}
                  >
                    <ServiceCardContent service={service} isFocused={true} />
                  </motion.div>
                </motion.div>
              );
            }
            if (idx === (currentIndex + 1) % CAROUSEL_ITEMS.length) {
              return (
                <motion.div
                  key={`mobile-next-${idx}`}
                  initial={false}
                  animate={{ scale: 0.92, opacity: 1, y: 12, x: 12 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={{ zIndex: 20 }}
                  className="absolute w-full px-4 pointer-events-none"
                >
                  <ServiceCardContent service={service} isFocused={false} />
                </motion.div>
              );
            }
            if (idx === (currentIndex - 1 + CAROUSEL_ITEMS.length) % CAROUSEL_ITEMS.length) {
               return (
                <motion.div
                  key={`mobile-prev-${idx}`}
                  initial={false}
                  animate={{ scale: 0.92, opacity: 1, y: 12, x: -12 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={{ zIndex: 10 }}
                  className="absolute w-full px-4 pointer-events-none"
                >
                  <ServiceCardContent service={service} isFocused={false} />
                </motion.div>
              );
            }
            return null;
          })}
        </AnimatePresence>

        {/* Always show the swipe hint on mobile */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 text-orange-600 font-medium text-sm pointer-events-none z-40 bg-white/90 px-4 py-2 rounded-full shadow-md border border-orange-100"
        >
            <motion.div
               animate={{ x: [-4, 2, -4] }}
               transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.div>
            <Hand className="w-4 h-4 text-orange-500 animate-pulse" />
            <span className="whitespace-nowrap">Swipe to explore</span>
            <motion.div
               animate={{ x: [4, -2, 4] }}
               transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
        </motion.div>
      </div>
    );
  };

  const renderDesktopCarousel = () => (
    <div 
      className="relative w-full max-w-7xl mx-auto min-h-[380px] flex items-center justify-center px-12 select-none"
    >
      <button 
        onClick={() => { handleInteraction(); prevCard(); }}
        className="absolute left-0 z-40 p-3 bg-white hover:bg-orange-50 text-orange-500 rounded-full shadow-lg border border-orange-100 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500"
        aria-label="Previous service"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <motion.div 
        className="w-full h-[360px] flex justify-center items-center relative cursor-grab active:cursor-grabbing touch-pan-y"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onPointerDown={() => setIsInteracting(true)}
        onPointerUp={() => setIsInteracting(false)}
        onPointerCancel={() => setIsInteracting(false)}
        onDragStart={() => {
          isDraggingRef.current = true;
          setIsInteracting(true);
        }}
        onDragEnd={(e, info) => {
          setIsInteracting(false);
          const swipeThreshold = 50;
          const swipeVelocity = 300;
          if (info.offset.x < -swipeThreshold || info.velocity.x < -swipeVelocity) {
            nextCard();
          } else if (info.offset.x > swipeThreshold || info.velocity.x > swipeVelocity) {
            prevCard();
          }

          if (Math.abs(info.offset.x) < 15) {
            isDraggingRef.current = false;
          } else {
            setTimeout(() => {
              isDraggingRef.current = false;
            }, 150);
          }
        }}
      >
          {CAROUSEL_ITEMS.map((service, idx) => {
             const offset = (idx - currentIndex + CAROUSEL_ITEMS.length) % CAROUSEL_ITEMS.length;
             
             let position = offset;
             if (offset > CAROUSEL_ITEMS.length / 2) {
               position = offset - CAROUSEL_ITEMS.length;
             }

             // Keep cards completely opaque up to position 3 so they slide fully off-screen before fading.
             const isSolid = Math.abs(position) <= 3;
             const isClickable = Math.abs(position) <= 2;
             
             return (
               <motion.div
                 key={`desktop-service-${idx}`}
                 initial={false}
                 animate={{ 
                   x: position * 400, 
                   scale: position === 0 ? 1 : 0.85,
                   opacity: isSolid ? 1 : 0,
                   zIndex: 30 - Math.abs(position),
                 }}
                 transition={{ duration: 0.6, ease: "easeInOut" }}
                 className={clsx(
                   "absolute w-full max-w-[360px] lg:max-w-[380px] select-none transition-shadow",
                   position === 0 ? "cursor-grab active:cursor-grabbing" : "cursor-pointer hover:opacity-95"
                 )}
                 style={{ pointerEvents: isClickable ? 'auto' : 'none' }}
                 onClick={() => {
                   if (isDraggingRef.current) return;
                   if (position !== 0) {
                     handleInteraction();
                     setCurrentIndex((prev) => (prev + position + CAROUSEL_ITEMS.length) % CAROUSEL_ITEMS.length);
                   }
                 }}
               >
                  <ServiceCardContent service={service} isFocused={position === 0} />
               </motion.div>
             )
          })}
      </motion.div>

      <button 
        onClick={() => { handleInteraction(); nextCard(); }}
        className="absolute right-0 z-40 p-3 bg-white hover:bg-orange-50 text-orange-500 rounded-full shadow-lg border border-orange-100 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500"
        aria-label="Next service"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );

  return (
    <section ref={sectionRef} className="py-24 bg-gray-50 relative overflow-hidden z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
           <motion.div 
             initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
             className="flex items-center justify-center gap-4"
           >
             <div className="h-[2px] w-8 sm:w-12 bg-orange-200"></div>
             <h2 className="text-sm sm:text-base font-bold text-orange-500 tracking-widest uppercase">
               What We Ship
             </h2>
             <div className="h-[2px] w-8 sm:w-12 bg-orange-200"></div>
           </motion.div>
           <h3 className="mt-4 text-3xl md:text-4xl font-black text-gray-900">
             Services built around<br className="hidden sm:inline" /> what you&apos;re sending
           </h3>
        </div>

        <div className="mt-8 mb-16 sm:mb-12">
          {hasMounted && (isDesktop ? renderDesktopCarousel() : renderMobileDeck())}

          {/* Fallback for search engines, AI web-crawlers, and accessibility */}
          <noscript>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
              {SERVICES.map((service) => (
                <div key={`noscript-${service.id}`} className="p-6 bg-white rounded-xl border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-900">{service.title}</h4>
                  <p className="text-gray-600 mt-2">{service.desc}</p>
                  <Link href={`/services#${service.id}`} className="text-orange-500 font-semibold mt-4 inline-block">
                    Learn more about {service.title} &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </noscript>
          <div className="sr-only" aria-label="Services List for Search Engines">
            <ul>
              {SERVICES.map((service) => (
                <li key={`seo-sr-${service.id}`}>
                  <h4>{service.title}</h4>
                  <p>{service.desc}</p>
                  <Link href={`/services#${service.id}`}>Learn more about {service.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-12 px-4">
          {SERVICES.map((_, idx) => (
            <button
              key={`dot-service-${idx}`}
              onClick={() => { 
                handleInteraction(); 
                const targetIdx = (currentIndex % SERVICES.length === idx)
                  ? currentIndex
                  : Math.floor(currentIndex / SERVICES.length) * SERVICES.length + idx;
                setCurrentIndex(targetIdx); 
              }}
              aria-label={`Go to service ${idx + 1}`}
              className={clsx(
                "h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
                (currentIndex % SERVICES.length) === idx ? "w-6 sm:w-8 bg-orange-500" : "w-2 sm:w-3 bg-orange-200 hover:bg-orange-300"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCardContent({ service, isFocused = true }: { service: typeof SERVICES[0], isFocused?: boolean }) {
  return (
    <div className={clsx(
      "w-full h-[320px] sm:h-[300px] lg:h-[330px] bg-white rounded-2xl p-6 sm:p-7 flex flex-col items-center text-center transition-all duration-300 border border-orange-200",
      isFocused 
        ? "shadow-[0_15px_40px_-15px_rgba(249,115,22,0.25)]" 
        : "shadow-md hover:shadow-lg"
    )}>
      <div className={clsx(
        "w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300",
        isFocused 
          ? "bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]" 
          : "bg-orange-50 text-orange-500"
      )}>
        <service.icon className="w-6 h-6 sm:w-7 sm:h-7" />
      </div>
      <h3 className={clsx(
        "text-lg sm:text-xl font-bold mb-2 leading-tight transition-colors duration-300",
        isFocused ? "text-gray-900" : "text-gray-700"
      )}>
        {service.title}
      </h3>
      <p className="text-sm sm:text-base text-gray-500 leading-relaxed mb-4 line-clamp-3">
        {service.desc}
      </p>
      <div className="mt-auto w-full">
        {isFocused ? (
          <Link
            href={`/services#${service.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex h-10 w-full items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold rounded-full transition-all duration-300 shadow-sm hover:shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:from-orange-600 hover:to-orange-700 cursor-pointer"
          >
            Learn More <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>
        ) : (
          <div className="inline-flex h-10 w-full items-center justify-center gap-2 bg-orange-50 text-orange-600 hover:bg-orange-100 text-sm font-bold rounded-full transition-all duration-300 cursor-pointer">
            Learn More <span>&rarr;</span>
          </div>
        )}
      </div>
    </div>
  );
}
