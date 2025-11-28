import * as React from "react"
import { TrendingUp, TrendingDown, Minus, DollarSign, Users, FileText, CreditCard, AlertCircle, ArrowUpRight, ArrowDownRight, Activity, Zap } from "lucide-react"
import { cn } from "../../lib/utils"

interface EnterpriseKPICardProps {
  title: string
  value: string | number
  change?: number
  changeType?: "increase" | "decrease" | "neutral"
  trend?: "increase" | "decrease" | "neutral"
  icon?: React.ReactNode
  color?: "primary" | "secondary" | "accent" | "success" | "danger" | "info" | "warning"
  className?: string
  subtitle?: string
  formatValue?: boolean
  showProgress?: boolean
  progressValue?: number
  description?: string
  animated?: boolean
  glassmorphism?: boolean
}

const EnterpriseKPICard = React.forwardRef<HTMLDivElement, EnterpriseKPICardProps>(
  ({ 
    title, 
    value, 
    change, 
    changeType = "neutral", 
    trend = "neutral",
    icon, 
    color = "primary",
    className,
    subtitle,
    formatValue = true,
    showProgress = false,
    progressValue = 0,
    description,
    animated = true,
    glassmorphism = false
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false)
    const [animatedValue, setAnimatedValue] = React.useState(0)

    React.useEffect(() => {
      setIsVisible(true)
      if (animated && typeof value === 'number') {
        const duration = 1000
        const steps = 60
        const increment = value / steps
        let current = 0
        
        const timer = setInterval(() => {
          current += increment
          if (current >= value) {
            setAnimatedValue(value)
            clearInterval(timer)
          } else {
            setAnimatedValue(Math.floor(current))
          }
        }, duration / steps)
        
        return () => clearInterval(timer)
      }
    }, [value, animated])

    const colorClasses = {
      primary: "from-blue-500 via-blue-600 to-blue-700",
      secondary: "from-emerald-500 via-emerald-600 to-emerald-700",
      accent: "from-purple-500 via-purple-600 to-purple-700",
      success: "from-green-500 via-green-600 to-green-700",
      danger: "from-red-500 via-red-600 to-red-700",
      info: "from-cyan-500 via-cyan-600 to-cyan-700",
      warning: "from-amber-500 via-amber-600 to-amber-700"
    }

    const trendColors = {
      increase: "text-emerald-600 bg-emerald-50 border-emerald-200",
      decrease: "text-red-600 bg-red-50 border-red-200",
      neutral: "text-gray-600 bg-gray-50 border-gray-200"
    }

    const formatValueDisplay = (val: string | number) => {
      if (typeof val === 'string') return val
      if (!formatValue) return val.toString()
      
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`
      }
      return val.toString()
    }

    const getTrendIcon = () => {
      switch (trend) {
        case "increase":
          return <TrendingUp className="h-4 w-4" />
        case "decrease":
          return <TrendingDown className="h-4 w-4" />
        default:
          return <Minus className="h-4 w-4" />
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative group overflow-hidden rounded-2xl p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1",
          glassmorphism 
            ? "glass border-white/20 bg-white/10" 
            : `bg-gradient-to-br ${colorClasses[color]} shadow-lg`,
          animated && "animate-slide-up",
          className
        )}
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-gradient" />
        </div>

        {/* Header */}
        <div className="relative flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-white/80 mb-1">{title}</h3>
            {subtitle && (
              <p className="text-xs text-white/60">{subtitle}</p>
            )}
          </div>
          
          {icon && (
            <div className={cn(
              "p-2 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
              glassmorphism ? "bg-white/10" : "bg-white/20"
            )}>
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="relative mb-4">
          <div className="text-3xl font-bold text-white tabular-nums">
            {animated ? formatValueDisplay(animatedValue) : formatValueDisplay(value)}
          </div>
          {description && (
            <p className="text-xs text-white/70 mt-1">{description}</p>
          )}
        </div>

        {/* Trend Indicator */}
        {change !== undefined && (
          <div className="relative flex items-center justify-between">
            <div className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium backdrop-blur-sm",
              trendColors[changeType]
            )}>
              {changeType === "increase" && <ArrowUpRight className="h-3 w-3" />}
              {changeType === "decrease" && <ArrowDownRight className="h-3 w-3" />}
              <span>{Math.abs(change)}%</span>
            </div>
            
            <div className={cn(
              "p-1 rounded-full transition-all duration-300",
              glassmorphism ? "bg-white/10" : "bg-white/20"
            )}>
              {getTrendIcon()}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {showProgress && (
          <div className="relative mt-4">
            <div className="w-full bg-white/20 rounded-full h-2 backdrop-blur-sm">
              <div 
                className={cn(
                  "h-2 rounded-full bg-gradient-to-r from-white/40 to-white/60 transition-all duration-1000",
                  animated && isVisible && "animate-slide-up"
                )}
                style={{ width: `${progressValue}%` }}
              />
            </div>
            <div className="text-xs text-white/70 mt-1 text-center">{progressValue}%</div>
          </div>
        )}

        {/* Hover Effects */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        {/* Decorative Elements */}
        <div className="absolute top-2 right-2 w-2 h-2 bg-white/20 rounded-full animate-pulse-glow" />
        <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/10 rounded-full" />
      </div>
    )
  }
)

EnterpriseKPICard.displayName = "EnterpriseKPICard"

export { EnterpriseKPICard }

// Pre-configured KPI Cards
export const RevenueKPI = ({ value, change, className }: Omit<EnterpriseKPICardProps, 'title' | 'icon' | 'color'>) => (
  <EnterpriseKPICard
    title="Total Revenue"
    value={value}
    change={change}
    icon={<DollarSign className="w-5 h-5" />}
    color="success"
    className={className}
  />
)

export const ExpensesKPI = ({ value, change, className }: Omit<EnterpriseKPICardProps, 'title' | 'icon' | 'color'>) => (
  <EnterpriseKPICard
    title="Total Expenses"
    value={value}
    change={change}
    icon={<CreditCard className="w-5 h-5" />}
    color="danger"
    className={className}
  />
)

export const TransactionsKPI = ({ value, change, className }: Omit<EnterpriseKPICardProps, 'title' | 'icon' | 'color'>) => (
  <EnterpriseKPICard
    title="Transactions"
    value={value}
    change={change}
    icon={<FileText className="w-5 h-5" />}
    color="primary"
    formatValue={false}
    className={className}
  />
)

export const InvoicesKPI = ({ value, change, className }: Omit<EnterpriseKPICardProps, 'title' | 'icon' | 'color'>) => (
  <EnterpriseKPICard
    title="Active Invoices"
    value={value}
    change={change}
    icon={<FileText className="w-5 h-5" />}
    color="info"
    formatValue={false}
    className={className}
  />
)

export const CustomersKPI = ({ value, change, className }: Omit<EnterpriseKPICardProps, 'title' | 'icon' | 'color'>) => (
  <EnterpriseKPICard
    title="Active Customers"
    value={value}
    change={change}
    icon={<Users className="w-5 h-5" />}
    color="secondary"
    formatValue={false}
    className={className}
  />
)

export const AlertsKPI = ({ value, className }: Omit<EnterpriseKPICardProps, 'title' | 'icon' | 'color' | 'change'>) => (
  <EnterpriseKPICard
    title="System Alerts"
    value={value}
    icon={<AlertCircle className="w-5 h-5" />}
    color="warning"
    className={className}
  />
)
