import React from "react";
import { CheckCircle, XCircle, ArrowRight, CreditCard } from "lucide-react";
import { useBillingPlans, useCurrentSubscription } from "@/hooks/useBillingPlans";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedComponent } from "@/components/ui/ProtectedComponent";
import Button from "@/components/ui/Button";

const BillingPlansPage: React.FC = () => {
  const { user } = useAuth();
  const companyId = "demo-company"; // TODO: pull from context
  const { plans, isLoading: plansLoading } = useBillingPlans();
  const { subscription, upgrade } = useCurrentSubscription(companyId);

  const currentPlanCode = subscription?.plan?.code?.replace("_annual", "") ?? null;
  const currentPlan = plans?.find((p) => p.code === currentPlanCode || p.code === `${currentPlanCode}_annual`);

  const handleUpgrade = (planId: string) => {
    upgrade.mutate({ planId });
  };

  const getPlanFeatures = (plan: any) => {
    const features = [];
    if (plan.maxUsers > 1) features.push(`${plan.maxUsers} users`);
    if (plan.maxEntities > 1) features.push(`${plan.maxEntities} entities`);
    if (plan.allowApiAccess) features.push("API access");
    if (plan.allowAuditExports) features.push("Audit exports");
    if (plan.allowAdvancedAnalytics) features.push("Advanced analytics");
    if (plan.allowCustomReports) features.push("Custom reports");
    if (plan.allowMultiEntityConsolidation) features.push("Multi-entity consolidation");
    if (plan.allowHoldingCompanyView) features.push("Holding company view");
    if (plan.allowCustomWorkflowDefinitions) features.push("Custom workflows");
    if (plan.allowWorkflowApprovals) features.push("Workflow approvals");
    if (plan.allowWorkflowScheduling) features.push("Workflow scheduling");
    return features;
  };

  const formatPrice = (cents: number, billingInterval: string) => {
    const monthly = billingInterval === "year" ? cents / 12 : cents;
    return `$${(monthly / 100).toLocaleString()}/${billingInterval}`;
  };

  const isCurrentPlan = (plan: any) => subscription?.plan?.id === plan.id;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Billing Plans</h1>

      {subscription && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Current Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{subscription.plan.name}</p>
              <p className="text-2xl font-bold">{formatPrice(subscription.plan.priceCents, subscription.plan.billingInterval)}</p>
              <p className="text-sm text-gray-500">Status: {(subscription as any).status}</p>
            </div>
            <div className="text-right">
              <ProtectedComponent permission="owner:billing">
                <Button variant="outline" onClick={() => handleUpgrade(subscription.plan.id)}>
                  Manage
                </Button>
              </ProtectedComponent>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans?.map((plan) => {
          const isCurrent = isCurrentPlan(plan);
          const isUpgrade = !isCurrent && plans && plans.findIndex((p) => p.id === subscription?.plan?.id) < plans.findIndex((p) => p.id === plan.id);
          const features = getPlanFeatures(plan);

          return (
            <div
              key={plan.id}
              className={`rounded-lg border p-6 ${
                isCurrent ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                {isCurrent && <span className="text-sm bg-blue-500 text-white px-2 py-1 rounded">Current</span>}
              </div>
              <p className="text-gray-600 mb-4">{plan.description}</p>
              <p className="text-2xl font-bold mb-4">{formatPrice(plan.priceCents, plan.billingInterval)}</p>
              <ul className="space-y-2 mb-6">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2">
                <Button
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent}
                  onClick={() => handleUpgrade(plan.id)}
                  className="w-full"
                >
                  {isCurrent ? "Current Plan" : isUpgrade ? "Upgrade" : "Select"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {!subscription && (
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
          <p className="text-gray-700 mb-4">
            Please select a plan to continue using ChronaWorkflow.
          </p>
          <Button onClick={() => window.location.reload()}>Choose a Plan</Button>
        </div>
      )}
    </div>
  );
};

export default BillingPlansPage;
