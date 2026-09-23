"use client";

import { useState, useEffect, startTransition } from "react";
import { motion, AnimatePresence, type Variants, type TargetAndTransition } from "framer-motion";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  X, 
  ChevronRight, 
  Calculator, 
  Phone, 
  Ban, 
  HelpCircle,
  MessageSquare
} from "lucide-react";
import { business } from "@/lib/config/business";

export function KSRAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showMobileBubble, setShowMobileBubble] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // Close widget whenever route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

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
  const cleanPhone = business.whatsapp.replace(/[^0-9]/g, '');
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
      subtitle: "Call, email or visit us",
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
    }
  ];

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Rectangular card unfolding upward & leftward from mascot
  const panelVariants: Variants = {
    closed: {
      clipPath: "inset(100% 0% 0% 100% round 22px)",
      opacity: 0,
      y: 12,
      transition: {
        duration: 0.28,
        ease: [0.32, 0, 0.67, 0] as [number, number, number, number],
      }
    },
    open: {
      clipPath: "inset(0% 0% 0% 0% round 22px)",
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.34,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }
    }
  };

  // Staggered internal content fade
  const contentVariants: Variants = {
    closed: {
      opacity: 0,
      transition: { duration: 0.18, ease: "easeOut" }
    },
    open: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.08
      }
    }
  };

  const itemVariants: Variants = {
    closed: { opacity: 0, y: 6 },
    open: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
    }
  };

  // Idle floating animation for the mascot (subtle 2-3px bobbing)
  const mascotFloatingAnimation: TargetAndTransition = {
    y: [0, -3, 0],
    transition: {
      duration: 2.6,
      repeat: Infinity,
      ease: "easeInOut",
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pointer-events-none select-none">
      {/* 1. EXPANDED ASSISTANT PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            variants={panelVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="pointer-events-auto mb-2.5 sm:mb-3 w-[305px] sm:w-[350px] bg-white/98 backdrop-blur-md rounded-[22px] border border-orange-100/70 shadow-[0_16px_48px_-12px_rgba(249,115,22,0.18),0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col origin-bottom-right"
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
                <motion.div variants={itemVariants} className="mb-3 sm:mb-3.5 px-1">
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
                    const isLast = idx === options.length - 1;
                    
                    const renderIcon = () => {
                      if (option.icon === "whatsapp") {
                        return (
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-emerald-600">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        );
                      }
                      const Icon = option.icon as any;
                      return <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${option.iconColor}`} strokeWidth={2.2} />;
                    };

                    const rowContent = (
                      <div className="flex items-center px-3.5 py-2.5 sm:py-3 hover:bg-orange-50/60 transition-colors group cursor-pointer">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${option.iconBg} flex items-center justify-center shrink-0 mr-3 shadow-xs transition-transform duration-200 group-hover:scale-105`}>
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

      {/* 2. FLOATING MASCOT ANCHOR & SPEECH BUBBLE */}
      <div 
        className="pointer-events-auto relative flex flex-col items-end"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* "Need Help?" Speech Bubble (Always visible when closed, with smooth floating animation) */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: [0, -4, 0] 
              }}
              exit={{ opacity: 0, scale: 0.9, y: 4, transition: { duration: 0.2 } }}
              transition={{ 
                y: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: 0.25 },
                scale: { duration: 0.25 }
              }}
              onClick={handleToggle}
              className="absolute bottom-full mb-2.5 right-2 sm:right-3 z-10 flex flex-col items-center cursor-pointer group"
            >
              <div className="relative bg-white text-slate-900 text-[12px] sm:text-[13px] font-semibold px-3 py-1.5 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.09)] border border-slate-100 whitespace-nowrap flex items-center gap-1.5 group-hover:border-orange-200 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span>Need Help?</span>
                {/* Speech Bubble Tail */}
                <div className="absolute top-full right-6 sm:right-8 -translate-y-1 w-2.5 h-2.5 bg-white border-r border-b border-slate-100 rotate-45 group-hover:border-orange-200 transition-colors" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mascot Button */}
        <motion.button
          onClick={handleToggle}
          animate={mascotFloatingAnimation}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isOpen ? "Close KSR Assistant" : "Open KSR Assistant"}
          className="relative w-[68px] h-[68px] sm:w-[82px] sm:h-[82px] rounded-full shadow-[0_10px_28px_rgba(249,115,22,0.28),0_2px_10px_rgba(0,0,0,0.08)] hover:shadow-[0_14px_34px_rgba(249,115,22,0.38)] focus:outline-none focus:ring-4 focus:ring-orange-500/30 transition-shadow border-2 border-white cursor-pointer overflow-hidden flex items-center justify-center bg-[#FFE8D6]"
        >
          {/* Mascot Image with state toggle */}
          <img
            src={isOpen ? "/mascot/mascot_cutout_happy.png" : "/mascot/mascot_cutout_idle.png"}
            alt="KSR Assistant Mascot"
            className="w-full h-full object-contain p-1 transition-transform duration-200"
            draggable={false}
          />
        </motion.button>
      </div>
    </div>
  );
}
