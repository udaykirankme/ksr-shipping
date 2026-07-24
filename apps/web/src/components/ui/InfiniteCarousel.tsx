"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useAnimationFrame, useMotionValue, useMotionValueEvent, PanInfo } from "framer-motion";

interface InfiniteCarouselProps {
  children: React.ReactNode;
  speed?: number; // Speed multiplier (e.g., 1 = scroll left)
  pauseOnHover?: boolean;
}

export function InfiniteCarousel({ children, speed = 1, pauseOnHover = true }: InfiniteCarouselProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const lastInteractionTime = useRef(0);
  
  const x = useMotionValue(0);

  // Measure content width accurately
  useEffect(() => {
    if (!contentRef.current) return;
    
    const updateWidth = () => {
      if (contentRef.current) {
        setContentWidth(contentRef.current.scrollWidth);
      }
    };
    
    updateWidth();
    
    const observer = new ResizeObserver(updateWidth);
    observer.observe(contentRef.current);
    
    return () => observer.disconnect();
  }, [children]);

  // Seamless looping logic handled whenever x changes (during drag or auto-scroll)
  useMotionValueEvent(x, "change", (latest) => {
    if (contentWidth === 0) return;
    
    // If we scroll left past the first copy, jump back seamlessly
    if (latest <= -contentWidth) {
      x.set(latest + contentWidth);
    } 
    // If we scroll right past the start, jump forward seamlessly
    else if (latest > 0) {
      x.set(latest - contentWidth);
    }
  });

  // Smooth auto-scroll loop
  useAnimationFrame((time, delta) => {
    if (contentWidth === 0 || isDragging) return;
    
    const timeSinceInteraction = performance.now() - lastInteractionTime.current;
    
    // Pause rules
    if (pauseOnHover && isHovered && timeSinceInteraction > 1000) return;
    if (timeSinceInteraction < 1000) return; // Wait 1s after interacting before resuming

    // Sub-pixel translation based on frame time
    const moveBy = speed * (delta / 16.66);
    x.set(x.get() - moveBy);
  });

  return (
    <div 
      className="overflow-hidden w-full select-none touch-pan-y py-8 -my-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => {
        setIsHovered(false);
        lastInteractionTime.current = performance.now();
      }}
    >
      <motion.div
        className="flex w-fit cursor-grab active:cursor-grabbing"
        style={{ x }}
        drag="x"
        dragElastic={0} // No bounce effect, keeps the loop clean
        dragMomentum={false} // Stops instantly when let go, relying on auto-scroll to resume smoothly
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => {
          setIsDragging(false);
          lastInteractionTime.current = performance.now();
        }}
      >
        {/* Render exact copies for seamless looping. Minimum 2, but 3 handles rapid dragging safely. */}
        <div ref={contentRef} className="flex shrink-0">
          {children}
        </div>
        <div className="flex shrink-0" aria-hidden="true">
          {children}
        </div>
        <div className="flex shrink-0" aria-hidden="true">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
