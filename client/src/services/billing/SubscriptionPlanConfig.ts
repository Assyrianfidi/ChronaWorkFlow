import { SubscriptionPlan } from "@/types/subscription.types";

type PlanFeatures = {
  pdfExport: boolean;
  exportRowLimit: number | null;
  dashboardLimit: number | null;
  priorityQueue: boolean;
  queuePriority: number;
  customRbac: boolean;
  dedicatedSla: boolean;
  teamAdminControls: boolean;
};

const PLAN_PRICING_USD: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.STARTER]: 19,
  [SubscriptionPlan.GROWTH]: 49,
  [SubscriptionPlan.BUSINESS]: 99,
  [SubscriptionPlan.ENTERPRISE]: 249,
};

const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  [SubscriptionPlan.STARTER]: {
    pdfExport: false,
    exportRowLimit: 300,
    dashboardLimit: 3,
    priorityQueue: false,
    queuePriority: 1,
    customRbac: false,
    dedicatedSla: false,
    teamAdminControls: false,
  },
  [SubscriptionPlan.GROWTH]: {
    pdfExport: true,
    exportRowLimit: 1000,
    dashboardLimit: 8,
    priorityQueue: false,
    queuePriority: 2,
    customRbac: false,
    dedicatedSla: false,
    teamAdminControls: false,
  },
  [SubscriptionPlan.BUSINESS]: {
    pdfExport: true,
    exportRowLimit: null,
    dashboardLimit: null,
    priorityQueue: true,
    queuePriority: 3,
    customRbac: false,
    dedicatedSla: false,
    teamAdminControls: true,
  },
  [SubscriptionPlan.ENTERPRISE]: {
    pdfExport: true,
    exportRowLimit: null,
    dashboardLimit: null,
    priorityQueue: true,
    queuePriority: 4,
    customRbac: true,
    dedicatedSla: true,
    teamAdminControls: true,
  },
};

class SubscriptionPlanService {
  static getPlanPrice(plan: SubscriptionPlan): number {
    return PLAN_PRICING_USD[plan];
  }

  static getPlanFeatures(plan: SubscriptionPlan): PlanFeatures {
    return PLAN_FEATURES[plan];
  }

  static canCreateDashboard(
    plan: SubscriptionPlan,
    currentCount: number,
  ): boolean {
    const limit = PLAN_FEATURES[plan].dashboardLimit;
    if (limit == null) return true;
    return currentCount < limit;
  }

  static isUpgrade(from: SubscriptionPlan, to: SubscriptionPlan): boolean {
    return PLAN_FEATURES[to].queuePriority > PLAN_FEATURES[from].queuePriority;
  }

  static isDowngrade(from: SubscriptionPlan, to: SubscriptionPlan): boolean {
    return PLAN_FEATURES[to].queuePriority < PLAN_FEATURES[from].queuePriority;
  }

  static compareFeatures(
    from: SubscriptionPlan,
    to: SubscriptionPlan,
  ): string[] {
    const fromF = PLAN_FEATURES[from];
    const toF = PLAN_FEATURES[to];
    const features: string[] = [];

    if (!fromF.pdfExport && toF.pdfExport) features.push("PDF Export");

    if (fromF.exportRowLimit !== toF.exportRowLimit) {
      if (toF.exportRowLimit == null) features.push("Unlimited export rows");
      else features.push(`${toF.exportRowLimit} rows export limit`);
    }

    if (fromF.dashboardLimit !== toF.dashboardLimit) {
      if (toF.dashboardLimit == null) features.push("Unlimited dashboards");
      else features.push(`${toF.dashboardLimit} dashboards`);
    }

    if (!fromF.priorityQueue && toF.priorityQueue)
      features.push("Priority export queue");
    if (!fromF.teamAdminControls && toF.teamAdminControls)
      features.push("Team admin controls");
    if (!fromF.customRbac && toF.customRbac) features.push("Custom RBAC");
    if (!fromF.dedicatedSla && toF.dedicatedSla) features.push("Dedicated SLA");

    return features;
  }
}

export default SubscriptionPlanService;
