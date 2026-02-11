import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  billingService,
  SubscriptionPlan,
  SubscriptionStatus,
} from "../services/billing.service";
import { toast } from "sonner";
import {
  Check,
  CreditCard,
  Calendar,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function BillingDashboard() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string>("");

  useEffect(() => {
    const user = localStorage.getItem("accubooks_user");
    if (user) {
      const userData = JSON.parse(user);
      setCompanyId(userData.currentCompanyId || "");
    }
  }, []);

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["billing-plans"],
    queryFn: () => billingService.getPlans(),
  });

  const {
    data: subscriptionStatus,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["subscription-status", companyId],
    queryFn: () => billingService.getSubscriptionStatus(companyId),
    enabled: !!companyId,
  });

  const checkoutMutation = useMutation({
    mutationFn: ({ plan, companyId }: { plan: string; companyId: string }) =>
      billingService.createCheckoutSession(plan, companyId),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });

  const portalMutation = useMutation({
    mutationFn: (companyId: string) =>
      billingService.createPortalSession(companyId),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to open billing portal");
    },
  });

  const handleSubscribe = (planId: string) => {
    if (!companyId) {
      toast.error("Please select a company first");
      return;
    }
    checkoutMutation.mutate({ plan: planId, companyId });
  };

  const handleManageBilling = () => {
    if (!companyId) {
      toast.error("Please select a company first");
      return;
    }
    portalMutation.mutate(companyId);
  };

  const getStatusBadge = (status?: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      ACTIVE: { color: "bg-green-100 text-green-800", text: "Active" },
      TRIALING: { color: "bg-blue-100 text-blue-800", text: "Trial" },
      PAST_DUE: { color: "bg-yellow-100 text-yellow-800", text: "Past Due" },
      CANCELLED: { color: "bg-red-100 text-red-800", text: "Cancelled" },
      NO_SUBSCRIPTION: {
        color: "bg-gray-100 text-gray-800",
        text: "No Subscription",
      },
    };

    const badge = badges[status || "NO_SUBSCRIPTION"] || badges.NO_SUBSCRIPTION;
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}
      >
        {badge.text}
      </span>
    );
  };

  if (plansLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Subscription Plans
          </h1>
          <p className="text-xl text-gray-600">
            Choose the perfect plan for your business
          </p>
        </div>

        {/* Current Subscription Status */}
        {subscriptionStatus &&
          subscriptionStatus.status !== "NO_SUBSCRIPTION" && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Current Subscription
                  </h2>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(subscriptionStatus.status)}
                    {subscriptionStatus.plan && (
                      <span className="text-lg font-medium text-gray-700">
                        {subscriptionStatus.plan} Plan
                      </span>
                    )}
                  </div>
                  {subscriptionStatus.status === "TRIALING" &&
                    subscriptionStatus.trialDaysRemaining > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-blue-600">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">
                          {subscriptionStatus.trialDaysRemaining} days remaining
                          in trial
                        </span>
                      </div>
                    )}
                  {subscriptionStatus.currentPeriodEnd && (
                    <div className="mt-3 flex items-center gap-2 text-gray-600">
                      <Calendar className="w-5 h-5" />
                      <span>
                        Renews on{" "}
                        {new Date(
                          subscriptionStatus.currentPeriodEnd,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleManageBilling}
                  disabled={portalMutation.isPending}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <CreditCard className="w-5 h-5" />
                  {portalMutation.isPending ? "Loading..." : "Manage Billing"}
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans?.map((plan) => {
            const isCurrentPlan = subscriptionStatus?.plan === plan.id;
            const isPro = plan.id === "PRO";

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                  isPro ? "ring-2 ring-blue-600" : ""
                }`}
              >
                {isPro && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                    POPULAR
                  </div>
                )}

                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline mb-6">
                    <span className="text-5xl font-extrabold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-xl text-gray-600 ml-2">/month</span>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full py-3 px-6 bg-gray-100 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={checkoutMutation.isPending}
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                        isPro
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-900 text-white hover:bg-gray-800"
                      } disabled:opacity-50`}
                    >
                      {checkoutMutation.isPending
                        ? "Processing..."
                        : "Subscribe"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Plan Limits
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-6 text-gray-700 font-semibold">
                    Feature
                  </th>
                  {plans?.map((plan) => (
                    <th
                      key={plan.id}
                      className="text-center py-4 px-6 text-gray-700 font-semibold"
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4 px-6 text-gray-700">Max Users</td>
                  {plans?.map((plan) => (
                    <td key={plan.id} className="text-center py-4 px-6">
                      {plan.maxUsers === -1 ? "Unlimited" : plan.maxUsers}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 text-gray-700">Max Companies</td>
                  {plans?.map((plan) => (
                    <td key={plan.id} className="text-center py-4 px-6">
                      {plan.maxCompanies === -1
                        ? "Unlimited"
                        : plan.maxCompanies}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Trial Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                14-Day Free Trial
              </h3>
              <p className="text-blue-800">
                All plans include a 14-day free trial. No credit card required
                to start. Cancel anytime during the trial period with no
                charges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
