import * as React from "react"
import { cn } from "../../lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground shadow-card transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-gray-200 bg-white hover:shadow-cardHover",
        elevated: "border-gray-100 bg-white shadow-lg hover:shadow-xl",
        outlined: "border-2 border-gray-300 bg-white hover:border-primary-300",
        ghost: "border-transparent bg-gray-50/50 hover:bg-gray-100",
        gradient: "border-transparent bg-gradient-to-br from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200",
        success: "border-success-200 bg-success-50 hover:border-success-300",
        warning: "border-warning-200 bg-warning-50 hover:border-warning-300",
        error: "border-error-200 bg-error-50 hover:border-error-300",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      interactive: {
        true: "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      interactive: false,
    },
  }
)

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size, interactive }), className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight text-gray-900", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-600", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-6", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// KPI Card Component
interface KPICardProps {
  title: string
  value: string | number
  change?: {
    value: string
    trend: "up" | "down" | "neutral"
  }
  icon?: React.ComponentType<{ className?: string }>
  description?: string
  variant?: "default" | "success" | "warning" | "error"
  size?: "sm" | "default" | "lg"
  loading?: boolean
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  description,
  variant = "default",
  size = "default",
  loading = false,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "success":
        return "border-success-200 bg-success-50"
      case "warning":
        return "border-warning-200 bg-warning-50"
      case "error":
        return "border-error-200 bg-error-50"
      default:
        return "border-gray-200 bg-white"
    }
  }

  const getTrendColor = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return "text-success-600"
      case "down":
        return "text-error-600"
      default:
        return "text-gray-600"
    }
  }

  const getIconBg = () => {
    switch (variant) {
      case "success":
        return "bg-success-100 text-success-600"
      case "warning":
        return "bg-warning-100 text-warning-600"
      case "error":
        return "bg-error-100 text-error-600"
      default:
        return "bg-primary-100 text-primary-600"
    }
  }

  const sizeClasses = {
    sm: "p-4",
    default: "p-6",
    lg: "p-8",
  }

  if (loading) {
    return (
      <div className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 shadow-card",
        sizeClasses[size]
      )}>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-8"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn(getVariantClasses(), sizeClasses[size])}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={cn(
            "text-2xl font-bold text-gray-900 mt-1",
            size === "lg" && "text-3xl"
          )}>
            {value}
          </p>
          
          {change && (
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                "text-sm font-medium",
                getTrendColor(change.trend)
              )}>
                {change.value}
              </span>
            </div>
          )}
          
          {description && (
            <p className="text-xs text-gray-500 mt-2">{description}</p>
          )}
        </div>
        
        {Icon && (
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            getIconBg()
          )}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </Card>
  )
}

// Metric Card Component
interface MetricCardProps {
  title: string
  metrics: Array<{
    label: string
    value: string | number
    color?: string
  }>
  size?: "sm" | "default" | "lg"
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  metrics,
  size = "default",
}) => {
  const sizeClasses = {
    sm: "p-4",
    default: "p-6",
    lg: "p-8",
  }

  return (
    <Card className={sizeClasses[size]}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{metric.label}</span>
            <span 
              className={cn(
                "text-sm font-semibold",
                metric.color || "text-gray-900"
              )}
            >
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// Status Card Component
interface StatusCardProps {
  status: "online" | "offline" | "warning" | "error"
  title: string
  description?: string
  metrics?: Array<{
    label: string
    value: string | number
  }>
}

export const StatusCard: React.FC<StatusCardProps> = ({
  status,
  title,
  description,
  metrics,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "online":
        return {
          bgColor: "bg-success-50",
          borderColor: "border-success-200",
          textColor: "text-success-700",
          dotColor: "bg-success-500",
        }
      case "offline":
        return {
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-700",
          dotColor: "bg-gray-500",
        }
      case "warning":
        return {
          bgColor: "bg-warning-50",
          borderColor: "border-warning-200",
          textColor: "text-warning-700",
          dotColor: "bg-warning-500",
        }
      case "error":
        return {
          bgColor: "bg-error-50",
          borderColor: "border-error-200",
          textColor: "text-error-700",
          dotColor: "bg-error-500",
        }
    }
  }

  const config = getStatusConfig()

  return (
    <Card className={cn(config.bgColor, config.borderColor)}>
      <div className="flex items-start gap-3">
        <div className={cn("w-3 h-3 rounded-full mt-1", config.dotColor)} />
        <div className="flex-1">
          <h3 className={cn("font-semibold", config.textColor)}>{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
          
          {metrics && (
            <div className="mt-4 space-y-2">
              {metrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{metric.label}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
export default Card
