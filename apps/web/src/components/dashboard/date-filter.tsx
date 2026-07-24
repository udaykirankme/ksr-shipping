"use client";

import { PremiumSelect } from "@/components/ui/PremiumSelect";

export const DATE_FILTER_OPTIONS = [
  { value: "all-time", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this-week", label: "This Week" },
  { value: "last-week", label: "Last Week" },
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
];

interface DateFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DateFilter({ value, onChange, className }: DateFilterProps) {
  return (
    <div className={`w-[160px] ${className || ""}`}>
      <PremiumSelect
        value={value}
        onChange={onChange}
        options={DATE_FILTER_OPTIONS}
      />
    </div>
  );
}
