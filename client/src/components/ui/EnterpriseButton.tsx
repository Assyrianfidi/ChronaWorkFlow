import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group backdrop-blur-sm",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white border-0 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 focus-visible:ring-blue-500 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 animate-gradient",
        secondary:
          "bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white border-0 hover:from-emerald-700 hover:via-emerald-600 hover:to-emerald-700 focus-visible:ring-emerald-500 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 animate-gradient",
        ghost:
          "bg-white/10 backdrop-blur-md text-gray-700 hover:bg-white/20 focus-visible:ring-gray-500 border border-white/20 hover:border-white/30 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 glass",
        danger:
          "bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white border-0 hover:from-red-700 hover:via-red-600 hover:to-red-700 focus-visible:ring-red-500 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 animate-gradient",
        success:
          "bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-white border-0 hover:from-green-700 hover:via-green-600 hover:to-green-700 focus-visible:ring-green-500 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 animate-gradient",
        warning:
          "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white border-0 hover:from-amber-700 hover:via-amber-600 hover:to-amber-700 focus-visible:ring-amber-500 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 animate-gradient",
        info:
          "bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-600 text-white border-0 hover:from-cyan-700 hover:via-cyan-600 hover:to-cyan-700 focus-visible:ring-cyan-500 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 animate-gradient",
        neutral:
          "bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 text-white border-0 hover:from-gray-700 hover:via-gray-600 hover:to-gray-700 focus-visible:ring-gray-500 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 animate-gradient",
      },
      size: {
        xs: "h-8 px-3 text-xs",
        sm: "h-9 px-4 text-sm",
        md: "h-10 px-6 text-base",
        lg: "h-11 px-8 text-lg",
        xl: "h-12 px-10 text-xl",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface EnterpriseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  glowEffect?: boolean
}

const EnterpriseButton = React.forwardRef<HTMLButtonElement, EnterpriseButtonProps>(
  ({ className, variant, size, loading, icon, iconPosition = 'left', glowEffect = false, children, disabled, ...props }, ref) => {
    const [isPressed, setIsPressed] = React.useState(false)

    return (
      <button
        className={cn(
          buttonVariants({ variant, size, className }),
          glowEffect && "hover-glow",
          isPressed && "scale-95",
          loading && "cursor-not-allowed",
          "hover-lift"
        )}
        ref={ref}
        disabled={disabled || loading}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        {...props}
      >
        {/* Ripple Effect */}
        <span className="absolute inset-0 rounded-xl bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
        
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          </div>
        )}
        
        {/* Button Content */}
        <span className={cn("flex items-center gap-2", loading && "opacity-0")}>
          {icon && iconPosition === 'left' && (
            <span className="transition-transform duration-200 group-hover:scale-110">
              {icon}
            </span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="transition-transform duration-200 group-hover:scale-110">
              {icon}
            </span>
          )}
        </span>
        
        {/* Glow Effect */}
        {glowEffect && (
          <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
      </button>
    )
  }
)

EnterpriseButton.displayName = "EnterpriseButton"

export { EnterpriseButton, buttonVariants }
