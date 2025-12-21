/**
 * Landing Page
 * Main marketing page with hero, features, testimonials, and CTAs
 */

import React from 'react';
import {
  Sparkles,
  TrendingUp,
  Shield,
  Clock,
  Users,
  ArrowRight,
  Check,
  Star,
  Play,
  ChevronRight,
  Zap,
  Brain,
  BarChart3,
  AlertTriangle,
  MessageSquare,
  Building2,
} from 'lucide-react';

const features = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: 'AI-Powered Categorization',
    description: '95% accuracy on transaction categorization. Our ML model learns from your corrections and improves over time.',
    color: 'purple',
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'AI CFO Copilot',
    description: 'Ask questions like "Why did profit drop?" and get instant, data-driven answers from your financial data.',
    color: 'blue',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: '30-Day Cash Flow Forecast',
    description: 'Predict your cash position with AI-powered forecasting. Know your runway and plan ahead.',
    color: 'green',
  },
  {
    icon: <AlertTriangle className="w-6 h-6" />,
    title: 'Anomaly Detection',
    description: 'Automatically detect duplicate payments, unusual transactions, and potential errors before they cost you.',
    color: 'amber',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Smart Automation',
    description: 'Create IF/THEN rules that automate repetitive tasks. Save 10+ hours per month on bookkeeping.',
    color: 'pink',
  },
  {
    icon: <Building2 className="w-6 h-6" />,
    title: 'Multi-Entity Support',
    description: 'Manage multiple businesses from one dashboard. Consolidated reporting and entity-specific insights.',
    color: 'indigo',
  },
];

const testimonials = [
  {
    quote: "AccuBooks saved me 15 hours a month on bookkeeping. The AI categorization is incredibly accurate.",
    author: "Sarah Chen",
    role: "Founder, TechStart Inc",
    avatar: "SC",
  },
  {
    quote: "The AI CFO Copilot is like having a financial advisor on call 24/7. Game changer for decision making.",
    author: "Michael Rodriguez",
    role: "CEO, GrowthLabs",
    avatar: "MR",
  },
  {
    quote: "Migrated from QuickBooks in 10 minutes. The AI mapped everything perfectly. Wish I'd switched sooner.",
    author: "Emily Watson",
    role: "Owner, Watson Consulting",
    avatar: "EW",
  },
];

const stats = [
  { value: '95%', label: 'AI Accuracy' },
  { value: '10+', label: 'Hours Saved/Month' },
  { value: '$5,000+', label: 'Avg. Deductions Found' },
  { value: '15min', label: 'QuickBooks Migration' },
];

const comparisonPoints = [
  { feature: 'AI Transaction Categorization', accubooks: true, quickbooks: false },
  { feature: 'Natural Language Queries', accubooks: true, quickbooks: false },
  { feature: 'Cash Flow Forecasting', accubooks: true, quickbooks: 'Limited' },
  { feature: 'Anomaly Detection', accubooks: true, quickbooks: false },
  { feature: 'Multi-Entity Dashboard', accubooks: true, quickbooks: 'Extra Cost' },
  { feature: 'Automation Workflows', accubooks: true, quickbooks: 'Limited' },
  { feature: 'Starting Price', accubooks: '$29/mo', quickbooks: '$30/mo' },
];

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">AccuBooks</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Features</a>
              <a href="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Pricing</a>
              <a href="#comparison" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">vs QuickBooks</a>
              <a href="/login" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Sign In</a>
              <a href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Start Free Trial
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-700 dark:text-purple-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Native Accounting Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Accounting That{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                Thinks For You
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              AccuBooks uses AI to categorize transactions, forecast cash flow, detect anomalies, 
              and answer your financial questions—saving you 10+ hours every month.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/signup"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-purple-500/25"
              >
                Start 14-Day Free Trial
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#demo"
                className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 border border-gray-200 dark:border-gray-700"
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              AI-Powered Features That Save You Time
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Every feature is designed to automate tedious tasks and give you insights that matter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-${feature.color}-100 dark:bg-${feature.color}-900/30 text-${feature.color}-600 dark:text-${feature.color}-400`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              AccuBooks vs QuickBooks
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              See why businesses are switching to AI-native accounting.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-3 bg-gray-100 dark:bg-gray-700 p-4">
              <div className="font-semibold text-gray-900 dark:text-white">Feature</div>
              <div className="text-center font-semibold text-purple-600 dark:text-purple-400">AccuBooks</div>
              <div className="text-center font-semibold text-gray-500 dark:text-gray-400">QuickBooks</div>
            </div>
            {comparisonPoints.map((point, index) => (
              <div
                key={index}
                className="grid grid-cols-3 p-4 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="text-gray-700 dark:text-gray-300">{point.feature}</div>
                <div className="text-center">
                  {point.accubooks === true ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <span className="text-gray-900 dark:text-white font-medium">{point.accubooks}</span>
                  )}
                </div>
                <div className="text-center">
                  {point.quickbooks === true ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : point.quickbooks === false ? (
                    <span className="text-gray-400">—</span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{point.quickbooks}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a
              href="/migration"
              className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium hover:underline"
            >
              Migrate from QuickBooks in 15 minutes
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by Business Owners
            </h2>
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-gray-600 dark:text-gray-400">4.9/5 average rating from 500+ reviews</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-medium">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Accounting?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of businesses saving 10+ hours per month with AI-powered accounting.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/signup"
              className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="/pricing"
              className="px-8 py-4 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/20"
            >
              View Pricing
            </a>
          </div>
          <p className="mt-4 text-white/60 text-sm">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="/pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="/migration" className="hover:text-white">Migration</a></li>
                <li><a href="/integrations" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="/about" className="hover:text-white">About</a></li>
                <li><a href="/blog" className="hover:text-white">Blog</a></li>
                <li><a href="/careers" className="hover:text-white">Careers</a></li>
                <li><a href="/contact" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="/docs" className="hover:text-white">Documentation</a></li>
                <li><a href="/api" className="hover:text-white">API</a></li>
                <li><a href="/help" className="hover:text-white">Help Center</a></li>
                <li><a href="/status" className="hover:text-white">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="/privacy" className="hover:text-white">Privacy</a></li>
                <li><a href="/terms" className="hover:text-white">Terms</a></li>
                <li><a href="/security" className="hover:text-white">Security</a></li>
                <li><a href="/compliance" className="hover:text-white">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold">AccuBooks</span>
            </div>
            <p className="text-sm">© 2024 AccuBooks. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
