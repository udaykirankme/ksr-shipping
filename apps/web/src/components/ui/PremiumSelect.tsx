"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface PremiumSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function PremiumSelect({ value, onChange, options, placeholder = "Select an option", required, disabled }: PremiumSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Hidden native select for form submission/validation if needed */}
      <select 
         value={value} 
         onChange={(e) => onChange(e.target.value)} 
         required={required} 
         disabled={disabled}
         className="hidden"
      >
         <option value="" disabled>{placeholder}</option>
         {options.map(opt => <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>)}
      </select>

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full px-5 py-4 rounded-xl border flex items-center justify-between transition-all duration-300 outline-none text-left",
          disabled ? "bg-gray-50/50 border-gray-200 text-gray-500 cursor-not-allowed opacity-75" :
          isOpen 
            ? "bg-white border-orange-500 ring-4 ring-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.15)]" 
            : "bg-gray-50/50 border-gray-200 hover:bg-white hover:border-orange-300 hover:shadow-[0_0_15px_rgba(249,115,22,0.1)]"
        )}
      >
        <span className={cn("font-medium truncate pr-4", !selectedOption ? "text-gray-400 font-normal" : "text-gray-900")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform duration-300 shrink-0", isOpen && "rotate-180 text-orange-500")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100/80 overflow-hidden p-2"
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all duration-200 text-sm font-medium",
                      isSelected
                        ? "bg-orange-50 text-orange-600"
                        : "text-gray-700 hover:bg-orange-50/50 hover:text-orange-600"
                    )}
                  >
                    {opt.label}
                    {isSelected && <Check className="w-4 h-4 text-orange-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
