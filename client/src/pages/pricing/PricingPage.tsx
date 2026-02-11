import React, { useState } from "react";
import { Check, Zap, Building2, Crown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface PricingTier {
  id: string;
  name: string;
  price: number;
  priceId: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  popular?: boolean;
  cta: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    priceId: process.env.VITE_STRIPE_STARTER_PRICE_ID || "price_starter",
    description: "Perfect for small businesses and freelancers",
    icon: <Zap className="w-6 h-6" />,
    features: [
      "Up to 100 transactions/month",
      "Basic financial reports",
      "1 user account",
      "Email support",
      "Mobile app access",
      "Bank reconciliation",
    ],
    cta: "Start Free Trial",
  },
  {
    id: "pro",
    name: "Pro",
    price: 79,
    priceId: process.env.VITE_STRIPE_PRO_PRICE_ID || "price_pro",
    description: "For growing businesses that need more",
    icon: <Building2 className="w-6 h-6" />,
    features: [
      "Unlimited transactions",
      "Advanced financial reports",
      "Up to 5 user accounts",
      "Priority email & chat support",
      "Mobile app access",
      "Bank reconciliation",
      "Automated invoicing",
      "Expense tracking",
      "Multi-currency support",
    ],
    popular: true,
    cta: "Start Free Trial",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 299,
    priceId: process.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise",
    description: "For large organizations with complex needs",
    icon: <Crown className="w-6 h-6" />,
    features: [
      "Everything in Pro",
      "Unlimited users",
      "Custom integrations",
      "Dedicated account manager",
      "24/7 phone support",
      "Advanced security & compliance",
      "Custom workflows",
      "API access",
      "White-label options",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
  },
];

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (tier: PricingTier) => {
    if (tier.id === "enterprise") {
      window.location.href =
        "mailto:sales@accubooks.com?subject=Enterprise Plan Inquiry";
      return;
    }

    if (!user) {
      navigate("/register", { state: { selectedPlan: tier.id } });
      return;
    }

    setLoading(tier.id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/billing/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            priceId: tier.priceId,
            successUrl: `${window.location.origin}/billing/success`,
            cancelUrl: `${window.location.origin}/pricing`,
          }),
        },
      );

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    } finally {
      setLoading(null);
    }
  };

  const getAnnualPrice = (monthlyPrice: number) => {
    return Math.floor(monthlyPrice * 12 * 0.8);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <Badge className="mb-4">Pricing</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose the perfect plan for your business. All plans include a
            14-day free trial.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === "annual"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Annual
              <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-semibold">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.id}
              className={`relative flex flex-col ${
                tier.popular
                  ? "border-2 border-primary shadow-xl scale-105"
                  : "border border-gray-200 dark:border-gray-800"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge variant="default" className="px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className="p-8 flex-1">
                {/* Icon & Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {tier.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {tier.name}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {tier.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      $
                      {billingCycle === "monthly"
                        ? tier.price
                        : getAnnualPrice(tier.price)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                  {billingCycle === "annual" && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      ${tier.price}/month billed annually
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSelectPlan(tier)}
                  variant={tier.popular ? "default" : "outline"}
                  className="w-full mb-6"
                  loading={loading === tier.id}
                  disabled={loading !== null}
                >
                  {tier.cta}
                </Button>

                {/* Features */}
                <div className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Can I change plans later?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Yes! You can upgrade or downgrade your plan at any time. Changes
              take effect immediately, and we'll prorate the difference.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              What payment methods do you accept?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              We accept all major credit cards (Visa, MasterCard, American
              Express) and ACH transfers for annual plans.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Is there a free trial?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Yes! All plans come with a 14-day free trial. No credit card
              required to start.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              What happens after my trial ends?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You'll be automatically charged for your selected plan. You can
              cancel anytime before the trial ends with no charges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
