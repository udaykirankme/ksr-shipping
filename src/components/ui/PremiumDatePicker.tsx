"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, isAfter, isBefore } from "date-fns";
import { cn } from "@/lib/utils";

interface PremiumDatePickerProps {
  value: Date | string | null;
  onChange: (date: Date) => void;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  className?: string;
}

export function PremiumDatePicker({
  value,
  onChange,
  disabled = false,
  minDate,
  maxDate,
  placeholder = "Select date",
  className
}: PremiumDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => value ? new Date(value) : new Date());
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
     
    setMounted(true);
  }, []);

  const selectedDate = value ? new Date(value) : null;

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

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const startingDayIndex = getDay(startOfMonth(currentMonth));
  const emptyDays = Array.from({ length: startingDayIndex });

  const handleDateClick = (date: Date) => {
    if (disabled) return;
    if (minDate && isBefore(date, minDate)) return;
    if (maxDate && isAfter(date, maxDate)) return;
    onChange(date);
    setIsOpen(false);
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(prev => subMonths(prev, 1));
  };

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
        <span suppressHydrationWarning className={cn("truncate", !selectedDate && "text-gray-400")}>
          {selectedDate ? format(selectedDate, "dd MMM yyyy") : placeholder}
        </span>
        <CalendarIcon className={cn("w-5 h-5", disabled ? "text-gray-400" : "text-orange-500")} />
      </div>

      {mounted && isOpen && createPortal(
        <div ref={popupRef} style={popupStyle} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-xl w-72 animate-fade-in z-[99999]">
          <div className="flex justify-between items-center mb-4">
            <button onClick={prevMonth} type="button" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-gray-800">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <button onClick={nextMonth} type="button" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-xs font-semibold text-gray-400">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} className="w-8 h-8" />
            ))}
            {daysInMonth.map((date, i) => {
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              const isOut = !!((minDate && isBefore(date, minDate)) || (maxDate && isAfter(date, maxDate)));
              
              return (
                <button
                  key={i}
                  type="button"
                  disabled={isOut}
                  onClick={() => handleDateClick(date)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors",
                    isSelected ? "bg-orange-500 text-white font-bold shadow-md shadow-orange-500/20" : 
                    isOut ? "text-gray-300 cursor-not-allowed" : 
                    "text-gray-700 hover:bg-orange-100 hover:text-orange-600",
                    isToday && !isSelected && "border border-orange-200 text-orange-600 font-bold"
                  )}
                >
                  {format(date, "d")}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
