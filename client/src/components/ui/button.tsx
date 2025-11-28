import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary-600 to-primary-700 text-white border border-primary-600 shadow-sm hover:shadow-md hover:from-primary-700 hover:to-primary-800 hover:-translate-y-px active:translate-y-0 active:shadow-sm",
        destructive:
          "bg-gradient-to-r from-red-600 to-red-700 text-white border border-red-600 shadow-sm hover:shadow-md hover:from-red-700 hover:to-red-800 hover:-translate-y-px active:translate-y-0 active:shadow-sm",
        outline:
          "border-2 border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-px active:translate-y-0 active:shadow-sm",
        secondary:
          "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300 shadow-sm hover:from-gray-200 hover:to-gray-300 hover:-translate-y-px active:translate-y-0 active:shadow-sm",
        ghost:
          "border border-transparent bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:-translate-y-px active:translate-y-0",
        success:
          "bg-gradient-to-r from-green-600 to-green-700 text-white border border-green-600 shadow-sm hover:shadow-md hover:from-green-700 hover:to-green-800 hover:-translate-y-px active:translate-y-0 active:shadow-sm",
        warning:
          "bg-gradient-to-r from-amber-600 to-amber-700 text-white border border-amber-600 shadow-sm hover:shadow-md hover:from-amber-700 hover:to-amber-800 hover:-translate-y-px active:translate-y-0 active:shadow-sm",
      },
      size: {
        default: "min-h-10 px-4 py-2 text-sm",
        sm: "min-h-8 rounded-md px-3 text-xs",
        lg: "min-h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
        xl: "min-h-14 rounded-lg px-10 text-lg",
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
