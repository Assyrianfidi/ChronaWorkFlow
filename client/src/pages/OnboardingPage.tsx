import React, { useState } from "react";
import { CheckCircle, ArrowRight, CreditCard, Building2, Users, Workflow } from "lucide-react";
import { useBillingPlans, useCurrentSubscription } from "@/hooks/useBillingPlans";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";

const OnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const { plans } = useBillingPlans();
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [step, setStep] = useState<"plan" | "payment" | "complete">("plan");

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setStep("payment");
  };

  const handlePaymentSuccess = () => {
    setStep("complete");
  };

  if (step === "plan") {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Welcome to ChronaWorkflow</h1>
        <p className="text-gray-600 mb-8">Choose a plan to get started with enterprise-grade accounting and workflow automation.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-lg border p-6 cursor-pointer transition ${
                selectedPlanId === plan.id ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
              }`}
              onClick={() => setSelectedPlanId(plan.id)}
            >
              <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
              <p className="text-gray-600 mb-4">{plan.description}</p>
              <p className="text-2xl font-bold mb-4">
                ${(plan.priceCents / 100).toLocaleString()}/{plan.billingInterval}
              </p>
              <Button
                variant={selectedPlanId === plan.id ? "default" : "outline"}
                onClick={() => handleSelectPlan(plan.id)}
                className="w-full"
              >
                Select
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === "payment") {
    const selectedPlan = plans?.find((p) => p.id === selectedPlanId);
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Complete Your Setup</h1>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Selected Plan</h2>
          <p className="text-2xl font-bold">{selectedPlan?.name}</p>
          <p className="text-gray-600">${(selectedPlan?.priceCents ?? 0) / 100}/{selectedPlan?.billingInterval}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
          <p className="text-gray-600 mb-4">
            You will be redirected to Stripe to complete your payment securely.
          </p>
          <Button onClick={handlePaymentSuccess} className="w-full">
            <CreditCard className="w-4 h-4 mr-2" />
            Proceed to Payment
          </Button>
        </div>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">Welcome to ChronaWorkflow!</h1>
        <p className="text-gray-600 mb-8">Your account is ready. Let's set up your first company.</p>
        <Button onClick={() => (window.location.href = "/dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return null;
};

export default OnboardingPage;
