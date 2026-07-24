import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  loading?: boolean
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, disabled, loading, children, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    
    const Comp = asChild ? Slot : "button"
    let variantClasses = "btn-primary";
    if (variant === "outline") {
      variantClasses = "btn-secondary";
    } else if (variant === "ghost") {
      variantClasses = "bg-transparent border border-transparent text-gray-600 hover:bg-orange-50/50 hover:text-orange-600 transition-colors";
    }

    let sizeClasses = "h-12 px-8 py-2";
    if (size === "sm") {
      sizeClasses = "h-9 px-4 py-1 text-xs rounded-lg";
    } else if (size === "icon") {
      sizeClasses = "h-10 w-10 px-0 flex items-center justify-center rounded-lg";
    }

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-bold transition-all outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-sm",
          variantClasses,
          sizeClasses,
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {asChild ? children : loading ? (
          <>
            <svg
              className="mr-2 h-5 w-5 animate-spin text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button }
