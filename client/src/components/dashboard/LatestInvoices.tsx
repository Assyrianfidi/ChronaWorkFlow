import * as React from "react";
import { FileText, Download, Eye, MoreHorizontal } from "lucide-react";
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

interface Invoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
  createdAt: string;
}

interface LatestInvoicesProps {
  className?: string;
  loading?: boolean;
  maxItems?: number;
}

const statusColors = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const LatestInvoices = React.forwardRef<HTMLDivElement, LatestInvoicesProps>(
  ({ className, loading = false, maxItems = 5, ...props }, ref) => {
    const [invoices, setInvoices] = React.useState<Invoice[]>([
      {
        id: "1",
        number: "INV-2025-001",
        client: "Tech Solutions Inc.",
        amount: 12500.0,
        status: "paid",
        dueDate: "2025-01-15",
        createdAt: "2025-01-01",
      },
      {
        id: "2",
        number: "INV-2025-002",
        client: "Global Marketing Ltd.",
        amount: 8750.5,
        status: "pending",
        dueDate: "2025-01-20",
        createdAt: "2025-01-05",
      },
      {
        id: "3",
        number: "INV-2025-003",
        client: "Innovation Systems",
        amount: 23400.0,
        status: "overdue",
        dueDate: "2025-01-10",
        createdAt: "2025-01-03",
      },
      {
        id: "4",
        number: "INV-2025-004",
        client: "Digital Dynamics",
        amount: 15600.0,
        status: "paid",
        dueDate: "2025-01-25",
        createdAt: "2025-01-08",
      },
      {
        id: "5",
        number: "INV-2025-005",
        client: "Future Enterprises",
        amount: 9200.75,
        status: "pending",
        dueDate: "2025-01-30",
        createdAt: "2025-01-12",
      },
    ]);

    const displayedInvoices = invoices.slice(0, maxItems);

    if (loading) {
      return (
        <EnterpriseCard ref={ref} className={cn("p-6", className)} {...props}>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(maxItems)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </EnterpriseCard>
      );
    }

    return (
      <EnterpriseCard ref={ref} className={cn("p-6", className)} {...props}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-ocean-blue" />
            <h3 className="text-lg font-semibold text-gray-900">
              Latest Invoices
            </h3>
          </div>
          <EnterpriseButton variant="ghost" size="sm">
            View All
          </EnterpriseButton>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                  Invoice
                </th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                  Client
                </th>
                <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">
                  Amount
                </th>
                <th className="text-center py-3 px-2 text-sm font-medium text-gray-600">
                  Status
                </th>
                <th className="text-center py-3 px-2 text-sm font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.number}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(invoice.createdAt)}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="text-sm text-gray-900">
                      {invoice.client}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={cn(
                        "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                        statusColors[invoice.status],
                      )}
                    >
                      {invoice.status.charAt(0).toUpperCase() +
                        invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                        <Download className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Showing {displayedInvoices.length} of {invoices.length} invoices
            </span>
            <EnterpriseButton variant="ghost" size="sm">
              Export All
            </EnterpriseButton>
          </div>
        </div>
      </EnterpriseCard>
    );
  },
);
LatestInvoices.displayName = "LatestInvoices";

export { LatestInvoices, type Invoice };
