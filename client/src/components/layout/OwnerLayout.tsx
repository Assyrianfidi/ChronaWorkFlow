import * as React from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  BadgeCheck,
  Banknote,
  Braces,
  Brush,
  Cog,
  Eye,
  Flag,
  LayoutDashboard,
  Shield,
  Users,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

type OwnerNavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const OWNER_NAV: OwnerNavItem[] = [
  { to: "/owner", label: "Overview", icon: LayoutDashboard },
  { to: "/owner/analytics", label: "Platform Analytics", icon: Activity },
  { to: "/owner/subscriptions", label: "Revenue & Subscriptions", icon: Banknote },
  { to: "/owner/plans", label: "Plans & Pricing", icon: Banknote },
  { to: "/owner/tenants", label: "User & Company Management", icon: Users },
  { to: "/owner/features", label: "Feature Controls", icon: Flag },
  { to: "/owner/system", label: "System Settings", icon: Cog },
  { to: "/owner/security", label: "Security & Compliance", icon: Shield },
  { to: "/owner/audit", label: "Audit Logs", icon: Eye },
  { to: "/owner/branding", label: "Branding & Theme Control", icon: Brush },
  { to: "/owner/automation", label: "AI & Automation Controls", icon: Zap },
  { to: "/owner/integrations", label: "Developer / Integrations", icon: Braces },
  { to: "/owner/emergency", label: "Emergency Controls", icon: BadgeCheck },
];

export function OwnerLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r bg-card/40 p-4 md:block">
          <div className="mb-4 rounded-lg border bg-card p-4">
            <div className="text-sm font-semibold">Owner Console</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Platform governance & billing
            </div>
          </div>

          <nav className="space-y-1">
            {OWNER_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      isActive &&
                        "bg-accent text-accent-foreground ring-1 ring-border",
                    )
                  }
                  end={item.to === "/owner"}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6 md:p-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
