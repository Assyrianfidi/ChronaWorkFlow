import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  AlertTriangle,
  MessageSquare,
  LineChart,
  Upload,
  Sparkles,
  Tag,
  Users,
  FileText,
} from "lucide-react";

import type React from "react";

import type { UserRole } from "@/contexts/AuthContext";

export type NavigationSectionKey =
  | "main"
  | "ai"
  | "growth"
  | "operations"
  | "support";

export type NavigationItem = {
  id: string;
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  featureKey?: string;
  roles?: UserRole[];
  section: NavigationSectionKey;
};

export type NavigationSection = {
  key: NavigationSectionKey;
  title: string;
  items: NavigationItem[];
};

export function getUnifiedNavigation(): NavigationSection[] {
  return [
    {
      key: "main",
      title: "Main",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          to: "/dashboard",
          icon: LayoutDashboard,
          section: "main",
        },
        {
          id: "transactions",
          label: "Transactions",
          to: "/transactions",
          icon: CreditCard,
          featureKey: "TRANSACTIONS",
          section: "main",
        },
        {
          id: "reports",
          label: "Reports",
          to: "/reports",
          icon: Receipt,
          featureKey: "REPORTS",
          section: "main",
        },
      ],
    },
    {
      key: "ai",
      title: "AI",
      items: [
        {
          id: "anomalies",
          label: "Anomalies",
          to: "/anomalies",
          icon: AlertTriangle,
          section: "ai",
        },
        {
          id: "ai-copilot",
          label: "AI CFO Copilot",
          to: "/ai/copilot",
          icon: MessageSquare,
          section: "ai",
        },
        {
          id: "ai-forecast",
          label: "Cash Flow Forecast",
          to: "/ai/forecast",
          icon: LineChart,
          section: "ai",
        },
      ],
    },
    {
      key: "growth",
      title: "Growth",
      items: [
        {
          id: "migration",
          label: "QuickBooks Migration",
          to: "/migration",
          icon: Upload,
          section: "growth",
        },
        {
          id: "trial",
          label: "Trial",
          to: "/trial",
          icon: Sparkles,
          section: "growth",
        },
        {
          id: "pricing",
          label: "Pricing",
          to: "/pricing",
          icon: Tag,
          section: "growth",
        },
      ],
    },
    {
      key: "operations",
      title: "Operations",
      items: [
        {
          id: "invoices",
          label: "Invoices",
          to: "/invoices",
          icon: FileText,
          featureKey: "INVOICING",
          section: "operations",
        },
        {
          id: "customers",
          label: "Customers",
          to: "/customers",
          icon: Users,
          featureKey: "CUSTOMERS",
          section: "operations",
        },
      ],
    },
  ];
}

export function getFlatNavigationItems(): NavigationItem[] {
  return getUnifiedNavigation().flatMap((section) => section.items);
}
