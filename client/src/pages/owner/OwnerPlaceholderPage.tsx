import * as React from "react";
import { useParams } from "react-router-dom";

import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { OwnerLayout } from "@/components/layout/OwnerLayout";

const SECTION_TITLES: Record<string, { title: string; subtitle: string }> = {
  analytics: {
    title: "Platform Analytics",
    subtitle: "Revenue, churn, conversion, and operational KPIs",
  },
  subscriptions: {
    title: "Subscriptions & Revenue",
    subtitle: "Plans, status, dunning, refunds, and revenue history",
  },
  tenants: {
    title: "User & Company Management",
    subtitle: "Organizations, seats, role overrides, impersonation",
  },
  features: {
    title: "Feature Controls",
    subtitle: "Global and per-tenant feature gating and limits",
  },
  system: {
    title: "System Settings",
    subtitle: "Platform configuration and operational defaults",
  },
  security: {
    title: "Security & Compliance",
    subtitle: "MFA, policies, session controls, retention rules",
  },
  audit: {
    title: "Audit Logs",
    subtitle: "Immutable owner actions, billing changes, security events",
  },
  branding: {
    title: "Branding & Theme Control",
    subtitle: "Theme tokens, product naming, white-label controls",
  },
  automation: {
    title: "AI & Automation Controls",
    subtitle: "AI features, automation workflows, governance",
  },
  integrations: {
    title: "Developer / Integrations",
    subtitle: "APIs, webhooks, keys, and partner integrations",
  },
  emergency: {
    title: "Emergency Controls",
    subtitle: "Kill switches and platform-wide mitigation controls",
  },
};

export default function OwnerPlaceholderPage() {
  const { section } = useParams();

  const key = typeof section === "string" ? section : "";
  const meta = SECTION_TITLES[key] ?? {
    title: "Owner Console",
    subtitle: "Select a section from the sidebar",
  };

  return (
    <OwnerLayout title={meta.title} subtitle={meta.subtitle}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            This section is scaffolded. Next we’ll wire the backend models, add server-side
            enforcement, and build the full enterprise UI.
          </div>
        </CardContent>
      </Card>
    </OwnerLayout>
  );
}
