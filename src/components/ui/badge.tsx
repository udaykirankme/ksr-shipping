import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    const variants = {
    default: "border-transparent bg-gray-100/80 text-gray-800 backdrop-blur-sm",
    success: "border-transparent bg-emerald-100/80 text-emerald-800 backdrop-blur-sm",
    warning: "border-transparent bg-orange-100/80 text-orange-800 backdrop-blur-sm",
    destructive: "border-transparent bg-red-100/80 text-red-800 backdrop-blur-sm",
    outline: "text-gray-800 border-gray-200 backdrop-blur-sm",
  }

  return (
    <div
      className={cn(
        "badge-soft border transition-all duration-300",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
