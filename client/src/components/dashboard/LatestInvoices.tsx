import * as React from "react";
import { FileText, Download, Eye, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import { EnterpriseButton } from "@/components/ui/EnterpriseButton";

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
  paid: "bg-success/10 text-success-700 dark:text-success",
  pending: "bg-warning/10 text-warning-700 dark:text-warning",
  overdue: "bg-destructive/10 text-destructive dark:text-destructive-500",
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
        <Card ref={ref} className={cn("p-6", className)} {...props}>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(maxItems)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card ref={ref} className={cn("p-6", className)} {...props}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
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
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                  Invoice
                </th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                  Client
                </th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-border hover:bg-muted"
                >
                  <td className="py-3 px-2">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {invoice.number}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(invoice.createdAt)}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="text-sm text-foreground">
                      {invoice.client}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="text-sm font-medium text-foreground">
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
                      <button
                        className="p-1 hover:bg-muted rounded transition-colors"
                        aria-label="Button button"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        className="p-1 hover:bg-muted rounded transition-colors"
                        aria-label="Button button"
                      >
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        className="p-1 hover:bg-muted rounded transition-colors"
                        aria-label="Button button"
                      >
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {displayedInvoices.length} of {invoices.length} invoices
            </span>
            <EnterpriseButton variant="ghost" size="sm">
              Export All
            </EnterpriseButton>
          </div>
        </div>
      </Card>
    );
  },
);
LatestInvoices.displayName = "LatestInvoices";

export { LatestInvoices, type Invoice };
