import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 relative overflow-hidden group",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground shadow-soft hover:bg-secondary/80",
        ghost:
          "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        danger:
          "bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90",
        success:
          "bg-success text-primary-foreground shadow-soft hover:opacity-90",
        warning:
          "bg-warning text-primary-foreground shadow-soft hover:opacity-90",
        info: "bg-info text-primary-foreground shadow-soft hover:opacity-90",
        neutral:
          "bg-accent text-accent-foreground shadow-soft hover:opacity-90",
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
  },
);

export interface EnterpriseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  glowEffect?: boolean;
}

const EnterpriseButton = React.forwardRef<
  HTMLButtonElement,
  EnterpriseButtonProps
>(
  (
    {
      className,
      variant,
      size,
      loading,
      icon,
      iconPosition = "left",
      glowEffect = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [isPressed, setIsPressed] = React.useState(false);

    return (
      <button
        className={cn(
          buttonVariants({ variant, size, className }),
          glowEffect && "hover-glow",
          isPressed && "scale-95",
          loading && "cursor-not-allowed",
          "active:translate-y-px",
        )}
        ref={ref}
        disabled={disabled || loading}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        {...props}
      >
        {/* Ripple Effect */}
        <span className="absolute inset-0 rounded-lg bg-primary-foreground/15 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
          </div>
        )}

        {/* Button Content */}
        <span className={cn("flex items-center gap-2", loading && "opacity-0")}>
          {icon && iconPosition === "left" && (
            <span className="transition-transform duration-200 group-hover:scale-110">
              {icon}
            </span>
          )}
          {children}
          {icon && iconPosition === "right" && (
            <span className="transition-transform duration-200 group-hover:scale-110">
              {icon}
            </span>
          )}
        </span>

        {/* Glow Effect */}
        {glowEffect && (
          <span className="absolute inset-0 rounded-lg bg-primary-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
      </button>
    );
  },
);

EnterpriseButton.displayName = "EnterpriseButton";

export { EnterpriseButton, buttonVariants };
