"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform, PanInfo, useInView, animate } from "framer-motion";
import { 
  PackageCheck, Home, MapPin, Globe2, Network, ShieldCheck, 
  HeadphonesIcon, ThumbsUp, Box, HeartPulse, Building2, Zap,
  ChevronLeft, ChevronRight, Hand
} from "lucide-react";
import clsx from "clsx";

const CARDS = [
  { icon: Home, title: "Convenient Doorstep Pickup", desc: "Schedule a hassle-free pickup directly from your home or office. Save time by letting our team come to you, avoiding long queues at courier branches." },
  { icon: Zap, title: "Priority Express Delivery", desc: "Experience lightning-fast, on-time delivery across India and worldwide. We use priority routing networks to ensure your urgent parcels reach their destination without delay." },
  { icon: PackageCheck, title: "Premium Food-Grade Packing", desc: "We use high-quality, specialized food-grade packing materials. This ensures your homemade treats, sweets, and edibles remain completely clean, fresh, safe, and fully protected during transit." },
  { icon: MapPin, title: "Real-Time Shipment Tracking", desc: "Stay informed at every step of the journey. Track your shipment in real time with our unified system, using just a single tracking number across all our delivery partners." },
  { icon: ShieldCheck, title: "Safe & Secure", desc: "Your shipments are always in safe hands. We implement industry-best security protocols, strict handling guidelines, and comprehensive monitoring to guarantee peace of mind." },
  { icon: Box, title: "Advanced Protection for Fragile Shipments", desc: "We provide extra cushioning and follow advanced secure packaging best practices. Your delicate, fragile, and sensitive items are rigorously protected to prevent transit damage." },
  { icon: HeadphonesIcon, title: "Dedicated Customer Support", desc: "Get quick, personalized responses via Phone, WhatsApp, and Email. Our dedicated support team is always ready to assist you with tracking updates and shipping queries." },
  { icon: Network, title: "Trusted Courier Network", desc: "We intelligently partner with the world's most reliable leading courier companies. This ensures you always receive the fastest, most cost-effective, and seamless delivery experience." },
  { icon: Globe2, title: "Global Shipping", desc: "Seamless and reliable international courier services across India and worldwide. We handle all complex customs clearance and paperwork, so you can ship globally with ease." },
  { icon: Building2, title: "Business Logistics Solutions", desc: "Tailored logistics, bulk shipments, and end-to-end B2B solutions built for your enterprise. Streamline your supply chain and focus on growing your core business operations." },
  { icon: HeartPulse, title: "Secure Medicine Shipping", desc: "Safe, compliant, and urgent transportation of critical healthcare supplies. We ensure careful, temperature-aware handling and prioritized routing when absolutely required." },
  { icon: ThumbsUp, title: "Trusted by Thousands", desc: "Join thousands of completely satisfied customers who confidently trust KSR Shipping Services every day. We consistently deliver on our promises, not just packages." },
];

export function WhyChooseCarousel() {
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

  // Smoothly morph upcoming cards into focus as the top card is swiped
  const nextScale = useTransform(x, [-250, 0], [1, 0.92], { clamp: true });
  const nextY = useTransform(x, [-250, 0], [0, 12], { clamp: true });
  const nextX = useTransform(x, [-250, 0], [0, 12], { clamp: true });

  const prevScale = useTransform(x, [0, 250], [0.92, 1], { clamp: true });
  const prevY = useTransform(x, [0, 250], [12, 0], { clamp: true });
  const prevX = useTransform(x, [0, 250], [-12, 0], { clamp: true });

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
      animate(x, -400, { duration: 0.8, ease: "easeInOut" }).then(() => {
        setCurrentIndex((prev) => (prev + 1) % CARDS.length);
        x.set(0);
      });
    } else {
      setCurrentIndex((prev) => (prev + 1) % CARDS.length);
      if (!isDesktop) x.set(0);
    }
  }, [isDesktop, x]);

  const prevCard = useCallback(() => {
    if (!isDesktop && x.get() === 0) {
      animate(x, 400, { duration: 0.8, ease: "easeInOut" }).then(() => {
        setCurrentIndex((prev) => (prev - 1 + CARDS.length) % CARDS.length);
        x.set(0);
      });
    } else {
      setCurrentIndex((prev) => (prev - 1 + CARDS.length) % CARDS.length);
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
      const swipeVelocity = 300;
      if (info.offset.x < -swipeThreshold || info.velocity.x < -swipeVelocity) {
        animate(x, -400, { duration: 0.6, ease: "easeOut" }).then(() => {
           setCurrentIndex((prev) => (prev + 1) % CARDS.length);
           x.set(0);
        });
      } else if (info.offset.x > swipeThreshold || info.velocity.x > swipeVelocity) {
        animate(x, 400, { duration: 0.6, ease: "easeOut" }).then(() => {
           setCurrentIndex((prev) => (prev - 1 + CARDS.length) % CARDS.length);
           x.set(0);
        });
      } else {
        animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
      }
    };

    return (
      <div className="relative w-full max-w-[420px] mx-auto min-h-[350px] flex items-center justify-center">
        <AnimatePresence initial={false} mode="popLayout">
          {CARDS.map((card, idx) => {
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
                  initial={false}
                  animate={{ scale: 1, opacity: 1, x: 0, rotate: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  className="absolute w-full px-4 cursor-grab active:cursor-grabbing"
                >
                  <motion.div
                    animate={!shouldReduceMotion ? {
                      x: [0, -30, 0],
                      rotate: [0, -4, 0],
                      transition: { delay: 1, duration: 1.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 3 }
                    } : { x: 0, rotate: 0 }}
                  >
                    <CardContent card={card} isFocused={true} />
                  </motion.div>
                </motion.div>
              );
            }
            if (idx === (currentIndex + 1) % CARDS.length) {
              return (
                <motion.div
                  key={`mobile-next-${idx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  style={{ 
                    scale: nextScale, 
                    y: nextY, 
                    x: nextX, 
                    zIndex: 20 
                  }}
                  className="absolute w-full px-4 pointer-events-none"
                >
                  <CardContent card={card} isFocused={false} />
                </motion.div>
              );
            }
            if (idx === (currentIndex - 1 + CARDS.length) % CARDS.length) {
               return (
                <motion.div
                  key={`mobile-prev-${idx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  style={{ 
                    scale: prevScale, 
                    y: prevY, 
                    x: prevX, 
                    zIndex: 10 
                  }}
                  className="absolute w-full px-4 pointer-events-none"
                >
                  <CardContent card={card} isFocused={false} />
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
        aria-label="Previous card"
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
          {CARDS.map((card, idx) => {
             const offset = (idx - currentIndex + CARDS.length) % CARDS.length;
             
             let position = offset;
             if (offset > CARDS.length / 2) {
               position = offset - CARDS.length;
             }

             // Keep cards completely opaque up to position 3 so they slide fully off-screen before fading.
             // This creates the illusion of an infinitely scrolling solid row.
             const isSolid = Math.abs(position) <= 3;
             const isClickable = Math.abs(position) <= 2;
             
             return (
               <motion.div
                 key={`desktop-${idx}`}
                 initial={false}
                 animate={{ 
                   x: position * 400, 
                   scale: position === 0 ? 1 : 0.85,
                   opacity: isSolid ? 1 : 0,
                   zIndex: 30 - Math.abs(position),
                 }}
                 transition={{ duration: 0.8, ease: "easeInOut" }}
                 className={clsx(
                   "absolute w-full max-w-[360px] lg:max-w-[380px] select-none transition-shadow",
                   position === 0 ? "cursor-grab active:cursor-grabbing" : "cursor-pointer hover:opacity-95"
                 )}
                 style={{ pointerEvents: isClickable ? 'auto' : 'none' }}
                 onClick={() => {
                   if (isDraggingRef.current) return;
                   if (position !== 0) {
                     handleInteraction();
                     setCurrentIndex((prev) => (prev + position + CARDS.length) % CARDS.length);
                   }
                 }}
               >
                  <CardContent card={card} isFocused={position === 0} />
               </motion.div>
             )
          })}
      </motion.div>

      <button 
        onClick={() => { handleInteraction(); nextCard(); }}
        className="absolute right-0 z-40 p-3 bg-white hover:bg-orange-50 text-orange-500 rounded-full shadow-lg border border-orange-100 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500"
        aria-label="Next card"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );

  return (
    <section ref={sectionRef} className="py-20 relative overflow-hidden bg-orange-50 z-20">
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
               Why Choose KSR
             </h2>
             <div className="h-[2px] w-8 sm:w-12 bg-orange-200"></div>
           </motion.div>
           <h3 className="mt-4 text-3xl md:text-4xl font-black text-gray-900">Premium Shipping Experience</h3>
        </div>

        <div className="mt-8 mb-16 sm:mb-12">
          {hasMounted && (isDesktop ? renderDesktopCarousel() : renderMobileDeck())}
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-12 px-4">
          {CARDS.map((_, idx) => (
            <button
              key={`dot-${idx}`}
              onClick={() => { handleInteraction(); setCurrentIndex(idx); }}
              aria-label={`Go to card ${idx + 1}`}
              className={clsx(
                "h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
                idx === currentIndex ? "w-6 sm:w-8 bg-orange-500" : "w-2 sm:w-3 bg-orange-200 hover:bg-orange-300"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CardContent({ card, isFocused = true }: { card: typeof CARDS[0], isFocused?: boolean }) {
  return (
    <div className={clsx(
      "w-full h-[300px] sm:h-[280px] lg:h-[320px] bg-white rounded-2xl p-6 sm:p-8 flex flex-col items-start transition-all duration-300 border border-orange-200",
      isFocused 
        ? "shadow-[0_15px_40px_-15px_rgba(249,115,22,0.25)]" 
        : "shadow-md"
    )}>
      <div className={clsx(
        "w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300",
        isFocused 
          ? "bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]" 
          : "bg-orange-50 text-orange-500"
      )}>
        <card.icon className="w-6 h-6 sm:w-7 sm:h-7" />
      </div>
      <h3 className={clsx(
        "text-lg sm:text-xl font-bold mb-3 leading-tight transition-colors duration-300",
        isFocused ? "text-gray-900" : "text-gray-700"
      )}>
        {card.title}
      </h3>
      <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
        {card.desc}
      </p>
    </div>
  );
}
