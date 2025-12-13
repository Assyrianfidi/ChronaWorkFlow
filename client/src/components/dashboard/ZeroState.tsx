import * as React from "react";
import { FileText, TrendingUp, Users, CreditCard, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnterpriseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "glass";
}

const EnterpriseCard = React.forwardRef<HTMLDivElement, EnterpriseCardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-white shadow-sm transition-all duration-200",
        {
          "border-gray-200 hover:shadow-md": variant === "default",
          "border-gray-100 shadow-lg hover:shadow-xl": variant === "elevated",
          "border-2 border-gray-300 hover:border-primary-300":
            variant === "outlined",
          "border-transparent bg-white/80 backdrop-blur-sm hover:bg-white/90":
            variant === "glass",
        },
        className,
      )}
      {...props}
    />
  ),
);

EnterpriseCard.displayName = "EnterpriseCard";

interface EnterpriseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const EnterpriseButton = React.forwardRef<
  HTMLButtonElement,
  EnterpriseButtonProps
>(({ className, variant = "primary", size = "md", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50",
      {
        "bg-primary-600 text-white hover:bg-primary-700": variant === "primary",
        "bg-gray-100 text-gray-900 hover:bg-gray-200": variant === "secondary",
        "border border-gray-300 bg-white hover:bg-gray-50":
          variant === "outline",
        "hover:bg-gray-100": variant === "ghost",
      },
      {
        "h-8 px-3 text-sm": size === "sm",
        "h-10 px-4 py-2": size === "md",
        "h-12 px-6 text-lg": size === "lg",
      },
      className,
    )}
    {...props}
  />
));

EnterpriseButton.displayName = "EnterpriseButton";

interface ZeroStateProps {
  type: "invoices" | "transactions" | "customers" | "expenses" | "dashboard";
  className?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const zeroStateConfig = {
  invoices: {
    icon: FileText,
    defaultTitle: "No invoices yet",
    defaultDescription:
      "Create your first invoice to get started with AccuBooks",
    defaultAction: "Create Invoice",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  transactions: {
    icon: TrendingUp,
    defaultTitle: "No transactions recorded",
    defaultDescription:
      "Your transaction history will appear here once you start recording transactions",
    defaultAction: "Add Transaction",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  customers: {
    icon: Users,
    defaultTitle: "No customers added",
    defaultDescription:
      "Add your first customer to begin managing your client relationships",
    defaultAction: "Add Customer",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  expenses: {
    icon: CreditCard,
    defaultTitle: "No expenses tracked",
    defaultDescription:
      "Start tracking expenses to monitor your business spending",
    defaultAction: "Add Expense",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  dashboard: {
    icon: TrendingUp,
    defaultTitle: "Welcome to AccuBooks",
    defaultDescription:
      "Get started by adding your first invoice, customer, or transaction to see your dashboard come to life",
    defaultAction: "Get Started",
    color: "text-ocean-blue",
    bgColor: "bg-ocean-blue/10",
  },
};

const ZeroState = React.forwardRef<HTMLDivElement, ZeroStateProps>(
  (
    { type, className, title, description, actionLabel, onAction, ...props },
    ref,
  ) => {
    const config = zeroStateConfig[type];
    const Icon = config.icon;

    return (
      <EnterpriseCard
        ref={ref}
        className={cn("p-12 text-center", className)}
        variant="outlined"
        {...props}
      >
        {/* Icon */}
        <div
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6",
            config.bgColor,
          )}
        >
          <Icon className={cn("w-8 h-8", config.color)} />
        </div>

        {/* Content */}
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {title || config.defaultTitle}
        </h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {description || config.defaultDescription}
        </p>

        {/* Action Button */}
        {onAction && (
          <EnterpriseButton
            variant="primary"
            onClick={onAction}
            className="flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            {actionLabel || config.defaultAction}
          </EnterpriseButton>
        )}

        {/* Additional Help for Dashboard */}
        {type === "dashboard" && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Quick start options:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <EnterpriseButton variant="ghost" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Create Invoice
              </EnterpriseButton>
              <EnterpriseButton variant="ghost" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Add Customer
              </EnterpriseButton>
              <EnterpriseButton variant="ghost" size="sm">
                <CreditCard className="w-4 h-4 mr-2" />
                Track Expense
              </EnterpriseButton>
            </div>
          </div>
        )}
      </EnterpriseCard>
    );
  },
);
ZeroState.displayName = "ZeroState";

export { ZeroState };
