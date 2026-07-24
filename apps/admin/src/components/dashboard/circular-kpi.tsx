import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CircularKpiProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  progress: number; // 0 to 100
  colorClass?: string; // e.g., "text-orange-500"
}

export function CircularKpi({
  title,
  value,
  subtitle,
  icon: Icon,
  progress,
  colorClass = "text-orange-500",
}: CircularKpiProps) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Card className="relative group overflow-hidden border-0 sm:border sm:border-orange-100/50 shadow-[0_4px_20px_rgba(255,106,0,0.05)] hover:shadow-[0_4px_25px_rgba(255,106,0,0.15)] transition-all duration-300 bg-white">
      <CardContent className="p-6 flex flex-col items-center text-center justify-center h-full gap-4">
        <div className="relative flex items-center justify-center w-24 h-24">
          {/* Background Ring */}
          <svg className="w-full h-full -rotate-90 transform absolute inset-0" viewBox="0 0 100 100">
            <circle
              className="text-gray-100 stroke-current"
              strokeWidth="8"
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
            />
            {/* Progress Ring */}
            <circle
              className={cn("stroke-current transition-all duration-1000 ease-in-out", colorClass)}
              strokeWidth="8"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn("p-2.5 rounded-full bg-gray-50 group-hover:scale-110 transition-transform", colorClass)}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="space-y-1 z-10">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
          <p className="text-3xl font-bold tracking-tight text-gray-900">{value}</p>
          <p className="text-xs font-medium text-gray-400">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}
