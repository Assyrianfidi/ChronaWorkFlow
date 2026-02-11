/**
 * Pricing Page
 * Display pricing tiers with feature comparison and upgrade functionality
 */

import React, { useState } from "react";
import {
  Check,
  X,
  Sparkles,
  Zap,
  Building2,
  Crown,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

interface PricingTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  popular?: boolean;
  features: {
    name: string;
    included: boolean;
    limit?: string;
  }[];
  cta: string;
  icon: React.ReactNode;
}

const pricingTiers: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for solopreneurs and freelancers",
    monthlyPrice: 29,
    annualPrice: 290,
    icon: <Zap className="w-6 h-6" />,
    features: [
      { name: "AI Transaction Categorization", included: true },
      { name: "AI CFO Copilot", included: true, limit: "100 queries/mo" },
      { name: "30-Day Cash Flow Forecast", included: true },
      { name: "Anomaly Detection", included: true },
      { name: "Transactions", included: true, limit: "500/mo" },
      { name: "Invoices", included: true, limit: "50/mo" },
      { name: "Multi-Entity Support", included: false },
      { name: "Team Members", included: false },
      { name: "API Access", included: false },
      { name: "Priority Support", included: false },
    ],
    cta: "Start Free Trial",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing small businesses",
    monthlyPrice: 99,
    annualPrice: 990,
    popular: true,
    icon: <Sparkles className="w-6 h-6" />,
    features: [
      { name: "AI Transaction Categorization", included: true },
      { name: "AI CFO Copilot", included: true, limit: "500 queries/mo" },
      { name: "30-Day Cash Flow Forecast", included: true },
      { name: "Anomaly Detection", included: true },
      { name: "Transactions", included: true, limit: "2,000/mo" },
      { name: "Invoices", included: true, limit: "200/mo" },
      { name: "Multi-Entity Support", included: true, limit: "Up to 3" },
      { name: "Team Members", included: true, limit: "Up to 5" },
      { name: "API Access", included: true },
      { name: "Priority Support", included: false },
    ],
    cta: "Start Free Trial",
  },
  {
    id: "business",
    name: "Business",
    description: "For established businesses with complex needs",
    monthlyPrice: 299,
    annualPrice: 2990,
    icon: <Building2 className="w-6 h-6" />,
    features: [
      { name: "AI Transaction Categorization", included: true },
      { name: "AI CFO Copilot", included: true, limit: "2,000 queries/mo" },
      { name: "Advanced Cash Flow Forecast", included: true },
      { name: "Advanced Anomaly Detection", included: true },
      { name: "Transactions", included: true, limit: "10,000/mo" },
      { name: "Invoices", included: true, limit: "1,000/mo" },
      { name: "Multi-Entity Support", included: true, limit: "Up to 10" },
      { name: "Team Members", included: true, limit: "Up to 25" },
      { name: "Full API Access", included: true },
      { name: "Priority Support", included: true },
    ],
    cta: "Start Free Trial",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations with enterprise requirements",
    monthlyPrice: 999,
    annualPrice: 9990,
    icon: <Crown className="w-6 h-6" />,
    features: [
      { name: "AI Transaction Categorization", included: true },
      { name: "AI CFO Copilot", included: true, limit: "Unlimited" },
      { name: "Enterprise Cash Flow Forecast", included: true },
      { name: "Enterprise Anomaly Detection", included: true },
      { name: "Transactions", included: true, limit: "Unlimited" },
      { name: "Invoices", included: true, limit: "Unlimited" },
      { name: "Multi-Entity Support", included: true, limit: "Unlimited" },
      { name: "Team Members", included: true, limit: "Unlimited" },
      { name: "Enterprise API Access", included: true },
      { name: "24/7 Priority Support", included: true },
    ],
    cta: "Contact Sales",
  },
];

const faqs = [
  {
    question: "How does the 14-day free trial work?",
    answer:
      "Start with full Pro features for 14 days, no credit card required. Import your data, experience AI categorization, and see the value before committing.",
  },
  {
    question: "Can I switch plans later?",
    answer:
      "Yes! You can upgrade or downgrade at any time. When upgrading, you get immediate access to new features. When downgrading, changes take effect at the next billing cycle.",
  },
  {
    question: "What happens to my data if I cancel?",
    answer:
      "Your data remains accessible for 30 days after cancellation. You can export everything at any time. We never delete your data without explicit confirmation.",
  },
  {
    question: "Is there a discount for annual billing?",
    answer:
      "Yes! Annual billing saves you 2 months (about 17% off). All plans include the annual discount option.",
  },
  {
    question: "How accurate is the AI categorization?",
    answer:
      "Our ML model achieves 95%+ accuracy on transaction categorization, improving over time as it learns from your corrections and patterns.",
  },
  {
    question: "Can I import from QuickBooks?",
    answer:
      "Absolutely! We support QBO and IIF file imports with AI-powered mapping. Most migrations complete in under 15 minutes.",
  },
];

export const PricingPage: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "annual",
  );
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSelectPlan = (tierId: string) => {
    if (tierId === "enterprise") {
      window.location.href = "/contact-sales";
    } else {
      window.location.href = `/signup?plan=${tierId}`;
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary via-secondary to-accent text-primary-foreground py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Choose the plan that fits your business. All plans include
            AI-powered features that save you 10+ hours per month.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-background/10 rounded-full p-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingPeriod === "monthly" ? "bg-background text-foreground" : "text-primary-foreground hover:bg-background/10"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingPeriod === "annual" ? "bg-background text-foreground" : "text-primary-foreground hover:bg-background/10"}`}
            >
              Annual
              <span className="ml-2 text-xs bg-success text-success-foreground px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`bg-card rounded-2xl shadow-soft overflow-hidden ${tier.popular ? "ring-2 ring-primary relative" : ""}`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center text-sm py-1 font-medium">
                  Most Popular
                </div>
              )}

              <div className={`p-6 ${tier.popular ? "pt-10" : ""}`}>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tier.popular ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  {tier.icon}
                </div>

                <h3 className="text-xl font-bold text-foreground">
                  {tier.name}
                </h3>
                <p className="text-muted-foreground text-sm mt-1 mb-4">
                  {tier.description}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">
                    $
                    {billingPeriod === "monthly"
                      ? tier.monthlyPrice
                      : Math.round(tier.annualPrice / 12)}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                  {billingPeriod === "annual" && (
                    <div className="text-sm text-muted-foreground">
                      Billed ${tier.annualPrice}/year
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleSelectPlan(tier.id)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${tier.popular ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-foreground hover:bg-muted/80"}`}
                >
                  {tier.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="border-t border-border p-6">
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-success flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm ${feature.included ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {feature.name}
                        {feature.limit && feature.included && (
                          <span className="text-muted-foreground ml-1">
                            ({feature.limit})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Comparison */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          Compare All Features
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 font-medium text-muted-foreground">
                  Feature
                </th>
                {pricingTiers.map((tier) => (
                  <th
                    key={tier.id}
                    className="text-center py-4 px-4 font-medium text-foreground"
                  >
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pricingTiers[0].features.map((feature, index) => (
                <tr key={index} className="border-b border-border">
                  <td className="py-4 px-4 text-foreground">{feature.name}</td>
                  {pricingTiers.map((tier) => (
                    <td key={tier.id} className="text-center py-4 px-4">
                      {tier.features[index].included ? (
                        tier.features[index].limit ? (
                          <span className="text-muted-foreground text-sm">
                            {tier.features[index].limit}
                          </span>
                        ) : (
                          <Check className="w-5 h-5 text-success mx-auto" />
                        )
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-card py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? null : index)
                  }
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-background/10 transition-colors"
                >
                  <span className="font-medium text-foreground">
                    {faq.question}
                  </span>
                  <HelpCircle
                    className={`w-5 h-5 text-muted-foreground transition-transform ${expandedFaq === index ? "rotate-180" : ""}`}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-4 pb-4 text-muted-foreground">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary via-secondary to-accent py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to transform your accounting?
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Start your 14-day free trial today. No credit card required.
          </p>
          <button
            onClick={() => handleSelectPlan("pro")}
            className="px-8 py-4 bg-background text-primary-foreground rounded-lg font-semibold hover:bg-background/10 transition-colors inline-flex items-center gap-2"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
