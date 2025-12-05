import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary-600 to-primary-700 text-white border border-primary-600 shadow-lg hover:shadow-xl hover:from-primary-700 hover:to-primary-800 hover:-translate-y-px active:translate-y-0 active:shadow-lg hover:scale-[1.02]",
        destructive:
          "bg-gradient-to-r from-error-600 to-error-700 text-white border border-error-600 shadow-lg hover:shadow-xl hover:from-error-700 hover:to-error-800 hover:-translate-y-px active:translate-y-0 active:shadow-lg hover:scale-[1.02]",
        outline:
          "border-2 border-gray-200 bg-white text-gray-700 shadow-md hover:bg-gray-50 hover:border-primary-300 hover:text-primary-700 hover:shadow-lg hover:-translate-y-px active:translate-y-0 active:shadow-md hover:scale-[1.02]",
        secondary:
          "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300 shadow-md hover:from-gray-200 hover:to-gray-300 hover:shadow-lg hover:-translate-y-px active:translate-y-0 active:shadow-md hover:scale-[1.02]",
        ghost:
          "border border-transparent bg-transparent text-gray-600 hover:bg-gray-100 hover:text-primary-700 hover:shadow-md hover:-translate-y-px active:translate-y-0 hover:scale-[1.02]",
        success:
          "bg-gradient-to-r from-success-600 to-success-700 text-white border border-success-600 shadow-lg hover:shadow-xl hover:from-success-700 hover:to-success-800 hover:-translate-y-px active:translate-y-0 active:shadow-lg hover:scale-[1.02]",
        warning:
          "bg-gradient-to-r from-amber-600 to-amber-700 text-white border border-amber-600 shadow-lg hover:shadow-xl hover:from-amber-700 hover:to-amber-800 hover:-translate-y-px active:translate-y-0 active:shadow-lg hover:scale-[1.02]",
        ocean:
          "bg-gradient-to-r from-ocean-400 to-ocean-500 text-white border border-ocean-400 shadow-lg hover:shadow-xl hover:from-ocean-500 hover:to-ocean-600 hover:-translate-y-px active:translate-y-0 active:shadow-lg hover:scale-[1.02]",
      },
      size: {
        default: "min-h-11 px-6 py-2.5 text-sm",
        sm: "min-h-9 rounded-md px-4 text-xs",
        lg: "min-h-13 rounded-xl px-8 text-base",
        icon: "h-11 w-11",
        xl: "min-h-14 rounded-xl px-10 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
