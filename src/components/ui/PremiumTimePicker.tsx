"use client";

import React, { useState, useRef, useEffect, useMemo, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumTimePickerProps {
  value: string | null;
  onChange: (time: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function PremiumTimePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Select time",
  className
}: PremiumTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
     
    setMounted(true);
  }, []);

  // Parse initial value (e.g., "14:30")
  const { initialHour, initialMin, initialAmPm } = useMemo(() => {
    if (!value) return { initialHour: "12", initialMin: "00", initialAmPm: "PM" };
    const [h, m] = value.split(':');
    let hourNum = parseInt(h, 10);
    const isPm = hourNum >= 12;
    if (hourNum === 0) hourNum = 12;
    if (hourNum > 12) hourNum -= 12;
    return {
      initialHour: hourNum.toString().padStart(2, '0'),
      initialMin: m,
      initialAmPm: isPm ? "PM" : "AM"
    };
  }, [value]);

  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMin);
  const [ampm, setAmpm] = useState(initialAmPm);

  // Sync state if value changes externally
  useEffect(() => {
     
    setHour(initialHour);
    setMinute(initialMin);
    setAmpm(initialAmPm);
  }, [initialHour, initialMin, initialAmPm]);

  const updatePosition = () => {
    if (isOpen && triggerRef.current && popupRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popupRect = popupRef.current.getBoundingClientRect();
      
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const spaceRight = window.innerWidth - rect.left;
      
      let top = rect.bottom + window.scrollY + 8;
      let left = rect.left + window.scrollX;
      
      // Open above if not enough space below
      if (spaceBelow < popupRect.height + 16 && spaceAbove > spaceBelow) {
        top = rect.top + window.scrollY - popupRect.height - 8;
      }
      
      // Align right if not enough space right
      if (spaceRight < popupRect.width + 16) {
        left = rect.right + window.scrollX - popupRect.width;
      }
      
      setPopupStyle({
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 99999
      });
    }
  };

  useLayoutEffect(() => {
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
     
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        triggerRef.current && 
        !triggerRef.current.contains(event.target as Node) &&
        popupRef.current && 
        !popupRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpdate = (newHour: string, newMin: string, newAmPm: string) => {
    let h24 = parseInt(newHour, 10);
    if (newAmPm === "PM" && h24 !== 12) h24 += 12;
    if (newAmPm === "AM" && h24 === 12) h24 = 0;
    
    const formattedTime = `${h24.toString().padStart(2, '0')}:${newMin}`;
    onChange(formattedTime);
  };

  const handleHourChange = (h: string) => {
    setHour(h);
    handleUpdate(h, minute, ampm);
  };

  const handleMinuteChange = (m: string) => {
    setMinute(m);
    handleUpdate(hour, m, ampm);
  };

  const handleAmpmChange = (a: string) => {
    setAmpm(a);
    handleUpdate(hour, minute, a);
  };

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return placeholder;
    const [h, m] = timeStr.split(':');
    let hr = parseInt(h, 10);
    const ap = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12;
    if (hr === 0) hr = 12;
    return `${hr.toString().padStart(2, '0')}:${m} ${ap}`;
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <>
      <div 
        ref={triggerRef}
        className={cn(
          "w-full rounded-xl border border-gray-200 px-4 py-2.5 flex items-center justify-between transition-all bg-white relative",
          disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "cursor-pointer hover:border-orange-500 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500",
          className
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span suppressHydrationWarning className={cn("truncate", !value && "text-gray-400")}>
          {value ? formatDisplayTime(value) : placeholder}
        </span>
        <Clock className={cn("w-5 h-5", disabled ? "text-gray-400" : "text-orange-500")} />
      </div>

      {mounted && isOpen && createPortal(
        <div ref={popupRef} style={popupStyle} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-xl w-64 animate-fade-in flex gap-2 justify-between h-64 z-[99999]">
          {/* Hours Column */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-1">
            <div className="sticky top-0 bg-white pb-1 mb-1 text-xs font-bold text-gray-400 text-center uppercase">Hour</div>
            {hours.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => handleHourChange(h)}
                className={cn(
                  "py-2 rounded-lg text-sm transition-colors text-center font-medium w-full",
                  hour === h ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "text-gray-700 hover:bg-orange-100 hover:text-orange-600"
                )}
              >
                {h}
              </button>
            ))}
          </div>
          
          <div className="w-px bg-gray-100 my-2"></div>

          {/* Minutes Column */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-1 flex flex-col gap-1">
            <div className="sticky top-0 bg-white pb-1 mb-1 text-xs font-bold text-gray-400 text-center uppercase">Min</div>
            {minutes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleMinuteChange(m)}
                className={cn(
                  "py-2 rounded-lg text-sm transition-colors text-center font-medium w-full",
                  minute === m ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "text-gray-700 hover:bg-orange-100 hover:text-orange-600"
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="w-px bg-gray-100 my-2"></div>

          {/* AM/PM Column */}
          <div className="flex-1 flex flex-col gap-2 pl-1">
            <div className="text-xs font-bold text-gray-400 text-center uppercase pb-1">AM/PM</div>
            {['AM', 'PM'].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => handleAmpmChange(a)}
                className={cn(
                  "py-3 rounded-lg text-sm transition-colors text-center font-bold w-full",
                  ampm === a ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "text-gray-700 hover:bg-orange-100 hover:text-orange-600 bg-gray-50"
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
