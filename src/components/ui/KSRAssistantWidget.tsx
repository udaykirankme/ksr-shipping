"use client";

import { useState, useEffect, useRef, startTransition } from "react";
import { 
  motion, 
  AnimatePresence, 
  useAnimation,
  type Variants, 
  type TargetAndTransition,
  type PanInfo
} from "framer-motion";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  X, 
  ChevronRight, 
  Calculator, 
  Phone, 
  Ban, 
  HelpCircle,
  MessageSquare,
  Move
} from "lucide-react";
import { business } from "@/lib/config/business";
import { cn } from "@/lib/utils";

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export function getCornerOffsets(
  corner: Corner,
  windowWidth: number,
  windowHeight: number
) {
  const isMobile = windowWidth < 640;
  const mascotSize = isMobile ? 68 : 82;
  const marginX = isMobile ? 16 : 24;
  const marginBottom = isMobile ? 16 : 24;
  const marginTop = isMobile ? 80 : 96;

  const deltaXToLeft = -(windowWidth - 2 * marginX - mascotSize);
  const deltaYToTop = -(windowHeight - marginBottom - marginTop - mascotSize);

  switch (corner) {
    case "top-left":
      return { x: deltaXToLeft, y: deltaYToTop };
    case "top-right":
      return { x: 0, y: deltaYToTop };
    case "bottom-left":
      return { x: deltaXToLeft, y: 0 };
    case "bottom-right":
    default:
      return { x: 0, y: 0 };
  }
}

export function KSRAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showMobileBubble, setShowMobileBubble] = useState(false);
  // Default is always bottom-right
  const [corner, setCorner] = useState<Corner>("bottom-right");
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cornerRef = useRef<Corner>("bottom-right");
  const isDraggingRef = useRef(false);
  const dragJustEndedRef = useRef(0);

  const controls = useAnimation();
  const router = useRouter();
  const pathname = usePathname();

  // Helper flags for corner orientation
  const isTop = corner.startsWith("top");
  const isLeft = corner.endsWith("left");

  // Keep cornerRef in sync
  useEffect(() => {
    cornerRef.current = corner;
  }, [corner]);

  // Initial client mount: default is strictly bottom-right
  useEffect(() => {
    setMounted(true);
    setCorner("bottom-right");
    cornerRef.current = "bottom-right";
    controls.set({ x: 0, y: 0 });
  }, [controls]);

  // Responsive repositioning on window resize or orientation change
  useEffect(() => {
    if (!mounted) return;

    const handleResize = () => {
      if (typeof window === "undefined") return;
      const offsets = getCornerOffsets(
        cornerRef.current,
        window.innerWidth,
        window.innerHeight
      );
      controls.set({ x: offsets.x, y: offsets.y });
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [mounted, controls]);

  // Close widget whenever route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close widget on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Close widget when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Proactively prefetch all internal assistant routes the moment the panel opens
  useEffect(() => {
    if (isOpen) {
      router.prefetch("/get-quotation");
      router.prefetch("/contact");
      router.prefetch("/restricted-items");
      router.prefetch("/faq");
    }
  }, [isOpen, router]);

  // Clean WhatsApp number
  const cleanPhone = business.whatsapp.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=Hello%20KSR%20Shipping%20Services`;

  // Briefly show speech bubble on mobile on initial view, then fade out
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMobileBubble(true);
      const hideTimer = setTimeout(() => {
        setShowMobileBubble(false);
      }, 3200);
      return () => clearTimeout(hideTimer);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const options = [
    {
      icon: Calculator,
      title: "Get a Quote",
      subtitle: "Know our rates & services",
      href: "/get-quotation",
      isExternal: false,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-50",
    },
    {
      icon: "whatsapp",
      title: "Get in touch on WhatsApp",
      subtitle: "Chat with our team instantly",
      href: whatsappUrl,
      isExternal: true,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      icon: Phone,
      title: "Contact Us",
      subtitle: "Fill out our contact form",
      href: "/contact",
      isExternal: false,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-50",
    },
    {
      icon: Ban,
      title: "Restricted Items",
      subtitle: "Know what you can't ship",
      href: "/restricted-items",
      isExternal: false,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-50",
    },
    {
      icon: HelpCircle,
      title: "FAQs",
      subtitle: "Find quick answers",
      href: "/faq",
      isExternal: false,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-50",
    },
  ];

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Drag handlers
  const handleDragStart = () => {
    isDraggingRef.current = true;
    setIsDragging(true);
    if (isOpen) {
      setIsOpen(false);
    }
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(false);
    const dragDist = Math.hypot(info.offset.x, info.offset.y);
    if (dragDist > 6) {
      dragJustEndedRef.current = Date.now();
    }

    if (typeof window === "undefined" || !containerRef.current) {
      isDraggingRef.current = false;
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const currentCenterX = rect.left + rect.width / 2;
    const currentCenterY = rect.top + rect.height / 2;

    const nearLeft = currentCenterX < window.innerWidth / 2;
    const nearTop = currentCenterY < window.innerHeight / 2;

    const targetCorner: Corner = nearTop
      ? nearLeft
        ? "top-left"
        : "top-right"
      : nearLeft
      ? "bottom-left"
      : "bottom-right";

    setCorner(targetCorner);
    cornerRef.current = targetCorner;

    const targetOffsets = getCornerOffsets(
      targetCorner,
      window.innerWidth,
      window.innerHeight
    );

    // Smooth spring snap animation to the calculated corner
    controls.start({
      x: targetOffsets.x,
      y: targetOffsets.y,
      transition: {
        type: "spring",
        stiffness: 420,
        damping: 30,
        mass: 0.8,
        restDelta: 0.5,
      },
    });

    if (dragDist <= 6) {
      isDraggingRef.current = false;
    } else {
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 120);
    }
  };

  const handleMascotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDraggingRef.current || Date.now() - dragJustEndedRef.current < 200) {
      return;
    }
    handleToggle();
  };

  const handleBubbleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDraggingRef.current || Date.now() - dragJustEndedRef.current < 200) {
      return;
    }
    handleToggle();
  };

  // Rectangular card unfolding towards screen center from mascot
  const panelVariants: Variants = {
    closed: (c: Corner) => {
      const topPlacement = c.startsWith("top");
      return {
        opacity: 0,
        scale: 0.92,
        y: topPlacement ? -10 : 10,
        transition: {
          duration: 0.22,
          ease: [0.32, 0, 0.67, 0] as [number, number, number, number],
        },
      };
    },
    open: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  };

  // Staggered internal content fade
  const contentVariants: Variants = {
    closed: {
      opacity: 0,
      transition: { duration: 0.18, ease: "easeOut" },
    },
    open: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    closed: { opacity: 0, y: 6 },
    open: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.22,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  };

  // Idle floating animation for the mascot (subtle 2-3px bobbing)
  const mascotFloatingAnimation: TargetAndTransition = {
    y: [0, -3, 0],
    transition: {
      duration: 2.6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  // Server-side fallback rendering: pinned at default bottom-right without coordinate transforms
  if (!mounted) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 pointer-events-none select-none">
        <div className="pointer-events-auto relative flex flex-col items-end">
          <div className="relative w-[68px] h-[68px] sm:w-[82px] sm:h-[82px] rounded-full shadow-[0_10px_28px_rgba(249,115,22,0.28),0_2px_10px_rgba(0,0,0,0.08)] border-2 border-white flex items-center justify-center bg-[#FFE8D6]">
            <img
              src="/mascot/mascot_cutout_idle.png"
              alt="KSR Assistant Mascot"
              className="w-[115%] h-[115%] object-contain origin-bottom brightness-[1.15] contrast-[1.05] drop-shadow-sm pointer-events-none"
              draggable={false}
            />
          </div>
        </div>
      </div>
    );
  }

  // Calculate viewport boundaries for elastic drag constraints relative to bottom-right origin (0, 0)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const mascotSize = isMobile ? 68 : 82;
  const marginX = isMobile ? 16 : 24;
  const marginBottom = isMobile ? 16 : 24;
  const marginTop = isMobile ? 80 : 96;

  const deltaXToLeft = typeof window !== "undefined"
    ? -(window.innerWidth - 2 * marginX - mascotSize)
    : 0;
  const deltaYToTop = typeof window !== "undefined"
    ? -(window.innerHeight - marginBottom - marginTop - mascotSize)
    : 0;

  const dragConstraints = typeof window !== "undefined"
    ? {
        left: deltaXToLeft,
        right: 0,
        top: deltaYToTop,
        bottom: 0,
      }
    : undefined;

  // Origin class for panel animation depending on active corner
  const panelOriginClass = isTop
    ? isLeft
      ? "origin-top-left"
      : "origin-top-right"
    : isLeft
    ? "origin-bottom-left"
    : "origin-bottom-right";

  return (
    <motion.div
      ref={containerRef}
      drag
      dragMomentum={false}
      dragElastic={0.12}
      dragConstraints={dragConstraints}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={{ x: 0, y: 0 }}
      style={{
        touchAction: "none",
      }}
      className={cn(
        "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 pointer-events-auto select-none",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
    >
      <div
        className="relative w-[68px] h-[68px] sm:w-[82px] sm:h-[82px] group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Movable Indicator Icon Badge - Dynamically placed on bottom-left or bottom-right outside the circle */}
        <div
          className={cn(
            "absolute z-10 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white text-orange-600 shadow-[0_2px_8px_rgba(0,0,0,0.14)] border border-orange-200/80 flex items-center justify-center pointer-events-none transition-all duration-200",
            isLeft 
              ? "bottom-0 sm:bottom-0.5 -right-1.5 sm:-right-2" 
              : "bottom-0 sm:bottom-0.5 -left-1.5 sm:-left-2",
            isDragging
              ? "scale-110 bg-orange-500 text-white border-orange-400 shadow-md"
              : "group-hover:scale-110 group-hover:bg-orange-50"
          )}
          title="Drag to reposition widget"
          aria-hidden="true"
        >
          <Move className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
        </div>

        {/* 1. EXPANDED ASSISTANT PANEL */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="panel"
              custom={corner}
              variants={panelVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onPointerDown={(e) => e.stopPropagation()}
              className={cn(
                "pointer-events-auto absolute z-20 w-[305px] sm:w-[350px] max-w-[calc(100vw-32px)] bg-white/98 backdrop-blur-md rounded-[22px] border border-orange-100/70 shadow-[0_16px_48px_-12px_rgba(249,115,22,0.18),0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col",
                isTop ? "top-full mt-2.5 sm:mt-3" : "bottom-full mb-2.5 sm:mb-3",
                isLeft ? "left-0" : "right-0",
                panelOriginClass
              )}
            >
              <motion.div
                variants={contentVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="flex flex-col h-full"
              >
                {/* Header */}
                <div className="bg-white border-b border-slate-100 px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shadow-xs">
                      <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-orange-500/20" />
                    </div>
                    <span className="font-bold text-slate-900 text-[14px] sm:text-[15px] tracking-tight">
                      KSR Assistant
                    </span>
                  </div>
                  <div className="flex items-center text-slate-400">
                    <button
                      onClick={handleClose}
                      className="p-1.5 hover:bg-slate-100 hover:text-slate-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      aria-label="Close assistant"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-3.5 sm:p-4 flex flex-col bg-gradient-to-b from-orange-50/30 to-transparent">
                  {/* Greeting */}
                  <motion.div
                    variants={itemVariants}
                    className="mb-3 sm:mb-3.5 px-1"
                  >
                    <h3 className="text-[14px] sm:text-[15px] font-bold text-slate-900 mb-0.5 leading-snug">
                      Hi! How can we help?
                    </h3>
                    <p className="text-[11.5px] sm:text-[12.5px] text-slate-500 font-normal leading-snug">
                      We&apos;re here to make shipping simple.
                    </p>
                  </motion.div>

                  {/* Five Action Rows */}
                  <motion.div
                    variants={itemVariants}
                    className="flex flex-col bg-white rounded-2xl border border-slate-100/90 shadow-xs divide-y divide-slate-100/80 overflow-hidden"
                  >
                    {options.map((option, idx) => {
                      const renderIcon = () => {
                        if (option.icon === "whatsapp") {
                          return (
                            <svg
                              viewBox="0 0 24 24"
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-emerald-600"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                          );
                        }
                        const Icon = option.icon as any;
                        return (
                          <Icon
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${option.iconColor}`}
                            strokeWidth={2.2}
                          />
                        );
                      };

                      const rowContent = (
                        <div className="flex items-center px-3.5 py-2.5 sm:py-3 hover:bg-orange-50/60 transition-colors group cursor-pointer">
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${option.iconBg} flex items-center justify-center shrink-0 mr-3 shadow-xs transition-transform duration-200 group-hover:scale-105`}
                          >
                            {renderIcon()}
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-semibold text-slate-900 text-[12.5px] sm:text-[13.5px] group-hover:text-orange-600 transition-colors whitespace-nowrap">
                              {option.title}
                            </p>
                            <p className="text-[10.5px] sm:text-[11.5px] text-slate-400 font-medium truncate mt-0.5">
                              {option.subtitle}
                            </p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      );

                      return option.isExternal ? (
                        <a
                          key={idx}
                          href={option.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            startTransition(() => {
                              setIsOpen(false);
                            });
                          }}
                          className="block focus:outline-none focus:bg-orange-50"
                        >
                          {rowContent}
                        </a>
                      ) : (
                        <Link
                          key={idx}
                          href={option.href}
                          prefetch={true}
                          onClick={() => {
                            startTransition(() => {
                              setIsOpen(false);
                            });
                          }}
                          className="block focus:outline-none focus:bg-orange-50"
                        >
                          {rowContent}
                        </Link>
                      );
                    })}
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. "Need Help?" Speech Bubble (Always visible when closed, with smooth floating animation) */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: [0, -4, 0],
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                y: 4,
                transition: { duration: 0.2 },
              }}
              transition={{
                y: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: 0.25 },
                scale: { duration: 0.25 },
              }}
              onClick={handleBubbleClick}
              className={cn(
                "absolute z-10 flex flex-col items-center cursor-pointer group select-none",
                isTop ? "top-full mt-2.5" : "bottom-full mb-2.5",
                isLeft ? "left-2 sm:left-3" : "right-2 sm:right-3"
              )}
            >
              <div className="relative bg-white text-slate-900 text-[12px] sm:text-[13px] font-semibold px-3 py-1.5 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.09)] border border-slate-100 whitespace-nowrap flex items-center gap-1.5 group-hover:border-orange-200 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span>Need Help?</span>
                {/* Speech Bubble Tail */}
                <div
                  className={cn(
                    "absolute w-2.5 h-2.5 bg-white transition-colors group-hover:border-orange-200",
                    isTop
                      ? isLeft
                        ? "bottom-full left-6 sm:left-8 translate-y-1 border-r border-t border-slate-100 -rotate-45"
                        : "bottom-full right-6 sm:right-8 translate-y-1 border-l border-t border-slate-100 rotate-45"
                      : isLeft
                      ? "top-full left-6 sm:left-8 -translate-y-1 border-l border-b border-slate-100 -rotate-45"
                      : "top-full right-6 sm:right-8 -translate-y-1 border-r border-b border-slate-100 rotate-45"
                  )}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. Mascot Button */}
        <motion.button
          onClick={handleMascotClick}
          animate={mascotFloatingAnimation}
          whileHover={{ scale: isDragging ? 1 : 1.05 }}
          whileTap={{ scale: isDragging ? 1 : 0.95 }}
          aria-label={isOpen ? "Close KSR Assistant" : "Open KSR Assistant"}
          className={cn(
            "relative w-[68px] h-[68px] sm:w-[82px] sm:h-[82px] rounded-full shadow-[0_10px_28px_rgba(249,115,22,0.28),0_2px_10px_rgba(0,0,0,0.08)] hover:shadow-[0_14px_34px_rgba(249,115,22,0.38)] focus:outline-none focus:ring-4 focus:ring-orange-500/30 transition-shadow border-2 border-white flex items-center justify-center bg-[#FFE8D6] select-none",
            isDragging
              ? "cursor-grabbing scale-105 shadow-[0_18px_40px_rgba(249,115,22,0.45)]"
              : "cursor-grab"
          )}
        >
          {/* Mascot Image with state toggle */}
          <img
            src={
              isOpen
                ? "/mascot/mascot_cutout_happy.png"
                : "/mascot/mascot_cutout_idle.png"
            }
            alt="KSR Assistant Mascot"
            className="w-[115%] h-[115%] object-contain origin-bottom transition-transform duration-200 brightness-[1.15] contrast-[1.05] drop-shadow-sm pointer-events-none select-none"
            draggable={false}
          />
        </motion.button>
      </div>
    </motion.div>
  );
}
