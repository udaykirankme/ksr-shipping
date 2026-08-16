"use client";

import React, { useState, useRef, useEffect, useMemo, useLayoutEffect, useCallback } from "react";
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
  
  const [viewMode, setViewMode] = useState<'hour' | 'minute'>('hour');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setViewMode('hour');
    }
  }, [isOpen]);

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
      
      const estimatedHeight = 400;
      const estimatedWidth = 320;
      
      let top = rect.bottom + window.scrollY + 8;
      let left = rect.left + window.scrollX;
      
      if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
        top = rect.top + window.scrollY - estimatedHeight - 8;
      }
      
      if (spaceRight < estimatedWidth) {
        left = rect.right + window.scrollX - estimatedWidth;
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
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

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

  const clockRef = useRef<HTMLDivElement>(null);
  
  const handleClockInteraction = useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent, isMouseUp = false) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX || (e as TouchEvent).changedTouches?.[0]?.clientX;
      clientY = e.touches[0]?.clientY || (e as TouchEvent).changedTouches?.[0]?.clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    if (clientX === undefined || clientY === undefined) return;

    let angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (viewMode === 'hour') {
      let h = Math.round(angle / 30);
      if (h === 0) h = 12;
      const hStr = h.toString().padStart(2, '0');
      if (hour !== hStr) {
        handleHourChange(hStr);
      }
      if (isMouseUp) {
        setViewMode('minute');
      }
    } else {
      let m = Math.round(angle / 6);
      if (m === 60) m = 0;
      const mStr = m.toString().padStart(2, '0');
      if (minute !== mStr) {
        handleMinuteChange(mStr);
      }
    }
  }, [viewMode, hour, minute, ampm]);

  const isDragging = useRef(false);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        e.preventDefault();
        handleClockInteraction(e);
      }
    };
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDragging.current) {
        isDragging.current = false;
        handleClockInteraction(e, true);
      }
    };
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging.current) {
        e.preventDefault();
        handleClockInteraction(e);
      }
    };
    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (isDragging.current) {
        isDragging.current = false;
        handleClockInteraction(e, true);
      }
    };

    if (isOpen) {
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isOpen, handleClockInteraction]);

  const onClockMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    handleClockInteraction(e);
  };

  const clockNumbers = useMemo(() => {
    const numbers = [];
    const count = 12;
    for (let i = 1; i <= count; i++) {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const radius = 95;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      let valStr = "";
      if (viewMode === 'hour') {
        valStr = i.toString();
      } else {
        valStr = (i === 12 ? 0 : i * 5).toString().padStart(2, '0');
      }
      
      let isSelected = false;
      if (viewMode === 'hour') {
        isSelected = parseInt(hour, 10) === i || (i === 12 && parseInt(hour, 10) === 0);
      } else {
        isSelected = parseInt(minute, 10) === (i === 12 ? 0 : i * 5);
      }

      numbers.push({ value: valStr, x, y, isSelected });
    }
    return numbers;
  }, [viewMode, hour, minute]);

  const handAngle = viewMode === 'hour' 
    ? (parseInt(hour, 10) * 30 - 90)
    : (parseInt(minute, 10) * 6 - 90);

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
        <div ref={popupRef} style={popupStyle} className="bg-white rounded-[24px] shadow-2xl border border-gray-100 overflow-hidden w-[310px] animate-fade-in z-[99999] select-none">
          <div className="flex justify-end pt-4 pr-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm rounded-full transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
          <div className="pt-2 pb-6 flex flex-col items-center">
            <div className="flex items-center justify-center gap-1">
              <div className="flex items-baseline text-6xl font-light tracking-tight text-gray-900">
                <button
                  type="button"
                  onClick={() => setViewMode('hour')}
                  className={cn(
                    "rounded-xl transition-colors min-w-[70px] text-right",
                    viewMode === 'hour' ? "text-orange-500" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {parseInt(hour, 10)}
                </button>
                <span className="text-gray-400 -mt-2 mx-1">:</span>
                <button
                  type="button"
                  onClick={() => setViewMode('minute')}
                  className={cn(
                    "rounded-xl transition-colors min-w-[70px] text-left",
                    viewMode === 'minute' ? "text-orange-500" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {minute}
                </button>
              </div>
              
              <div className="flex flex-col ml-3 text-sm font-bold gap-1.5 justify-center">
                <button
                  type="button"
                  onClick={() => handleAmpmChange('AM')}
                  className={cn(
                    "transition-colors leading-none tracking-widest",
                    ampm === 'AM' ? "text-orange-500" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => handleAmpmChange('PM')}
                  className={cn(
                    "transition-colors leading-none tracking-widest",
                    ampm === 'PM' ? "text-orange-500" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          <div className="pb-6 pt-2 flex justify-center items-center bg-white relative">
            <div 
              ref={clockRef}
              className="relative w-[260px] h-[260px] bg-gray-100 rounded-full cursor-pointer touch-none shadow-inner"
              onMouseDown={onClockMouseDown}
              onTouchStart={onClockMouseDown}
            >
              <div className="absolute top-1/2 left-1/2 w-2 h-2 -ml-1 -mt-1 bg-orange-500 rounded-full z-20" />
              
              <div 
                className="absolute top-1/2 left-1/2 h-[105px] w-0.5 bg-orange-500 origin-bottom z-10 rounded-t-full transition-transform duration-75 ease-out"
                style={{
                  transform: `translate(-50%, -100%) rotate(${handAngle + 90}deg)`,
                }}
              >
                <div className="absolute -top-4 -left-[15px] w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm shadow-md">
                   {viewMode === 'minute' && parseInt(minute, 10) % 5 !== 0 && (
                     minute
                   )}
                </div>
              </div>

              {clockNumbers.map((num, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute top-1/2 left-1/2 w-10 h-10 -ml-5 -mt-5 rounded-full flex items-center justify-center text-[15px] transition-colors z-20",
                    num.isSelected 
                      ? "text-white font-bold" 
                      : "text-gray-700 hover:bg-gray-200/50"
                  )}
                  style={{
                    transform: `translate(${num.x * (105/95)}px, ${num.y * (105/95)}px)`,
                  }}
                >
                  <span className="pointer-events-none">{num.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
