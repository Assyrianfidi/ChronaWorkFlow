/**
 * Pricing Page
 * Display pricing tiers with feature comparison and upgrade functionality
 */

import React, { useState } from 'react';
import {
  Check,
  X,
  Sparkles,
  Zap,
  Building2,
  Crown,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

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
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for solopreneurs and freelancers',
    monthlyPrice: 29,
    annualPrice: 290,
    icon: <Zap className="w-6 h-6" />,
    features: [
      { name: 'AI Transaction Categorization', included: true },
      { name: 'AI CFO Copilot', included: true, limit: '100 queries/mo' },
      { name: '30-Day Cash Flow Forecast', included: true },
      { name: 'Anomaly Detection', included: true },
      { name: 'Transactions', included: true, limit: '500/mo' },
      { name: 'Invoices', included: true, limit: '50/mo' },
      { name: 'Multi-Entity Support', included: false },
      { name: 'Team Members', included: false },
      { name: 'API Access', included: false },
      { name: 'Priority Support', included: false },
    ],
    cta: 'Start Free Trial',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing small businesses',
    monthlyPrice: 99,
    annualPrice: 990,
    popular: true,
    icon: <Sparkles className="w-6 h-6" />,
    features: [
      { name: 'AI Transaction Categorization', included: true },
      { name: 'AI CFO Copilot', included: true, limit: '500 queries/mo' },
      { name: '30-Day Cash Flow Forecast', included: true },
      { name: 'Anomaly Detection', included: true },
      { name: 'Transactions', included: true, limit: '2,000/mo' },
      { name: 'Invoices', included: true, limit: '200/mo' },
      { name: 'Multi-Entity Support', included: true, limit: 'Up to 3' },
      { name: 'Team Members', included: true, limit: 'Up to 5' },
      { name: 'API Access', included: true },
      { name: 'Priority Support', included: false },
    ],
    cta: 'Start Free Trial',
  },
  {
    id: 'business',
    name: 'Business',
    description: 'For established businesses with complex needs',
    monthlyPrice: 299,
    annualPrice: 2990,
    icon: <Building2 className="w-6 h-6" />,
    features: [
      { name: 'AI Transaction Categorization', included: true },
      { name: 'AI CFO Copilot', included: true, limit: '2,000 queries/mo' },
      { name: 'Advanced Cash Flow Forecast', included: true },
      { name: 'Advanced Anomaly Detection', included: true },
      { name: 'Transactions', included: true, limit: '10,000/mo' },
      { name: 'Invoices', included: true, limit: '1,000/mo' },
      { name: 'Multi-Entity Support', included: true, limit: 'Up to 10' },
      { name: 'Team Members', included: true, limit: 'Up to 25' },
      { name: 'Full API Access', included: true },
      { name: 'Priority Support', included: true },
    ],
    cta: 'Start Free Trial',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with enterprise requirements',
    monthlyPrice: 999,
    annualPrice: 9990,
    icon: <Crown className="w-6 h-6" />,
    features: [
      { name: 'AI Transaction Categorization', included: true },
      { name: 'AI CFO Copilot', included: true, limit: 'Unlimited' },
      { name: 'Enterprise Cash Flow Forecast', included: true },
      { name: 'Enterprise Anomaly Detection', included: true },
      { name: 'Transactions', included: true, limit: 'Unlimited' },
      { name: 'Invoices', included: true, limit: 'Unlimited' },
      { name: 'Multi-Entity Support', included: true, limit: 'Unlimited' },
      { name: 'Team Members', included: true, limit: 'Unlimited' },
      { name: 'Enterprise API Access', included: true },
      { name: '24/7 Priority Support', included: true },
    ],
    cta: 'Contact Sales',
  },
];

const faqs = [
  {
    question: 'How does the 14-day free trial work?',
    answer: 'Start with full Pro features for 14 days, no credit card required. Import your data, experience AI categorization, and see the value before committing.',
  },
  {
    question: 'Can I switch plans later?',
    answer: 'Yes! You can upgrade or downgrade at any time. When upgrading, you get immediate access to new features. When downgrading, changes take effect at the next billing cycle.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer: 'Your data remains accessible for 30 days after cancellation. You can export everything at any time. We never delete your data without explicit confirmation.',
  },
  {
    question: 'Is there a discount for annual billing?',
    answer: 'Yes! Annual billing saves you 2 months (about 17% off). All plans include the annual discount option.',
  },
  {
    question: 'How accurate is the AI categorization?',
    answer: 'Our ML model achieves 95%+ accuracy on transaction categorization, improving over time as it learns from your corrections and patterns.',
  },
  {
    question: 'Can I import from QuickBooks?',
    answer: 'Absolutely! We support QBO and IIF file imports with AI-powered mapping. Most migrations complete in under 15 minutes.',
  },
];

export const PricingPage: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSelectPlan = (tierId: string) => {
    if (tierId === 'enterprise') {
      window.location.href = '/contact-sales';
    } else {
      window.location.href = `/signup?plan=${tierId}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Choose the plan that fits your business. All plans include AI-powered features
            that save you 10+ hours per month.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white/10 rounded-full p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingPeriod === 'annual'
                  ? 'bg-white text-gray-900'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
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
              className={`bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden ${
                tier.popular ? 'ring-2 ring-purple-500 relative' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0 bg-purple-500 text-white text-center text-sm py-1 font-medium">
                  Most Popular
                </div>
              )}
              
              <div className={`p-6 ${tier.popular ? 'pt-10' : ''}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  tier.popular 
                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {tier.icon}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {tier.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 mb-4">
                  {tier.description}
                </p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    ${billingPeriod === 'monthly' ? tier.monthlyPrice : Math.round(tier.annualPrice / 12)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">/month</span>
                  {billingPeriod === 'annual' && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Billed ${tier.annualPrice}/year
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleSelectPlan(tier.id)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    tier.popular
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 p-6">
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${
                        feature.included 
                          ? 'text-gray-700 dark:text-gray-300' 
                          : 'text-gray-400 dark:text-gray-600'
                      }`}>
                        {feature.name}
                        {feature.limit && feature.included && (
                          <span className="text-gray-400 dark:text-gray-500 ml-1">
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
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Compare All Features
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-4 px-4 font-medium text-gray-500 dark:text-gray-400">
                  Feature
                </th>
                {pricingTiers.map((tier) => (
                  <th key={tier.id} className="text-center py-4 px-4 font-medium text-gray-900 dark:text-white">
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pricingTiers[0].features.map((feature, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                    {feature.name}
                  </td>
                  {pricingTiers.map((tier) => (
                    <td key={tier.id} className="text-center py-4 px-4">
                      {tier.features[index].included ? (
                        tier.features[index].limit ? (
                          <span className="text-gray-600 dark:text-gray-400 text-sm">
                            {tier.features[index].limit}
                          </span>
                        ) : (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        )
                      ) : (
                        <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
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
      <div className="bg-white dark:bg-gray-900 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {faq.question}
                  </span>
                  <HelpCircle className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedFaq === index ? 'rotate-180' : ''
                  }`} />
                </button>
                {expandedFaq === index && (
                  <div className="px-4 pb-4 text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to transform your accounting?
          </h2>
          <p className="text-white/80 mb-8">
            Start your 14-day free trial today. No credit card required.
          </p>
          <button
            onClick={() => handleSelectPlan('pro')}
            className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
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
