"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-[8.5rem] right-7 sm:bottom-[10.5rem] sm:right-10 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#FF6A00] to-[#FF8C3A] text-white shadow-[0_4px_14px_rgba(255,106,0,0.38)] hover:shadow-[0_6px_20px_rgba(255,106,0,0.5)] border border-white/25 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center group",
        isVisible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-6 pointer-events-none"
      )}
      aria-label="Back to top"
      title="Back to top"
    >
      <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5] transition-transform duration-200 group-hover:-translate-y-0.5" />
    </button>
  );
}
