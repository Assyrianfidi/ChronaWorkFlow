import { SubscriptionPlan } from "@/types/subscription.types";
import SubscriptionPlanService from "./SubscriptionPlanConfig";

export type ExportFormat = "csv" | "pdf";

export type ValidationResult = {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: SubscriptionPlan;
};

function formatPriceUsd(price: number): string {
  return `$${price.toFixed(2)}`;
}

function requiredPlanForPdf(plan: SubscriptionPlan): SubscriptionPlan {
  return plan === SubscriptionPlan.STARTER ? SubscriptionPlan.GROWTH : plan;
}

function requiredPlanForRows(plan: SubscriptionPlan): SubscriptionPlan {
  if (plan === SubscriptionPlan.STARTER) return SubscriptionPlan.GROWTH;
  if (plan === SubscriptionPlan.GROWTH) return SubscriptionPlan.BUSINESS;
  return plan;
}

class ExportPlanGate {
  static validateCsvExport(_plan: SubscriptionPlan): ValidationResult {
    return { allowed: true };
  }

  static validatePdfExport(plan: SubscriptionPlan): ValidationResult {
    const features = SubscriptionPlanService.getPlanFeatures(plan);
    if (features.pdfExport) return { allowed: true };

    const upgradeRequired = requiredPlanForPdf(plan);
    return {
      allowed: false,
      upgradeRequired,
      reason: `PDF Export requires ${upgradeRequired[0].toUpperCase()}${upgradeRequired.slice(1)} plan`,
    };
  }

  static validateExportRowLimit(
    plan: SubscriptionPlan,
    rowCount: number,
    _format: ExportFormat,
  ): ValidationResult {
    const { exportRowLimit } = SubscriptionPlanService.getPlanFeatures(plan);
    if (exportRowLimit == null) return { allowed: true };
    if (rowCount <= exportRowLimit) return { allowed: true };

    const upgradeRequired = requiredPlanForRows(plan);
    return {
      allowed: false,
      upgradeRequired,
      reason: `Export row limit exceeded (${exportRowLimit} rows). Upgrade to ${upgradeRequired} to increase limit.`,
    };
  }

  static validateExportRequest(
    plan: SubscriptionPlan,
    format: ExportFormat,
    rowCount: number,
  ): ValidationResult {
    if (format === "pdf") {
      const pdf = this.validatePdfExport(plan);
      if (!pdf.allowed) return pdf;
    }

    return this.validateExportRowLimit(plan, rowCount, format);
  }

  static hasPriorityQueue(plan: SubscriptionPlan): boolean {
    return SubscriptionPlanService.getPlanFeatures(plan).priorityQueue;
  }

  static getQueuePriority(plan: SubscriptionPlan): number {
    return SubscriptionPlanService.getPlanFeatures(plan).queuePriority;
  }

  static getUpgradeMessage(
    plan: SubscriptionPlan,
    requirement: "pdf_export" | "export_row_limit",
  ): string {
    const upgradePlan =
      requirement === "pdf_export" ? requiredPlanForPdf(plan) : requiredPlanForRows(plan);

    const planName = upgradePlan[0].toUpperCase() + upgradePlan.slice(1);
    const price = formatPriceUsd(SubscriptionPlanService.getPlanPrice(upgradePlan));

    if (requirement === "pdf_export") {
      return `Upgrade to ${planName} (${price}) to unlock PDF Export.`;
    }

    return `Upgrade to ${planName} (${price}) to increase your export row limit.`;
  }

  static getUpgradeFeatures(from: SubscriptionPlan, to: SubscriptionPlan): string[] {
    return SubscriptionPlanService.compareFeatures(from, to);
  }
}

export default ExportPlanGate;
