import * as React from "react";
import { FileText, TrendingUp, Users, CreditCard, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import { EnterpriseButton } from "@/components/ui/EnterpriseButton";

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
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  transactions: {
    icon: TrendingUp,
    defaultTitle: "No transactions recorded",
    defaultDescription:
      "Your transaction history will appear here once you start recording transactions",
    defaultAction: "Add Transaction",
    color: "text-success-700 dark:text-success",
    bgColor: "bg-success/10",
  },
  customers: {
    icon: Users,
    defaultTitle: "No customers added",
    defaultDescription:
      "Add your first customer to begin managing your client relationships",
    defaultAction: "Add Customer",
    color: "text-info",
    bgColor: "bg-info/10",
  },
  expenses: {
    icon: CreditCard,
    defaultTitle: "No expenses tracked",
    defaultDescription:
      "Start tracking expenses to monitor your business spending",
    defaultAction: "Add Expense",
    color: "text-destructive dark:text-destructive-500",
    bgColor: "bg-destructive/10",
  },
  dashboard: {
    icon: TrendingUp,
    defaultTitle: "Welcome to AccuBooks",
    defaultDescription:
      "Get started by adding your first invoice, customer, or transaction to see your dashboard come to life",
    defaultAction: "Get Started",
    color: "text-primary",
    bgColor: "bg-primary/10",
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
      <Card
        ref={ref}
        className={cn(
          "p-12 text-center border-2 border-border hover:border-primary/30 transition-colors",
          className,
        )}
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
        <h3 className="text-xl font-semibold text-foreground mb-3">
          {title || config.defaultTitle}
        </h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
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
          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              Quick start options:
            </p>
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
      </Card>
    );
  },
);
ZeroState.displayName = "ZeroState";

export { ZeroState };
