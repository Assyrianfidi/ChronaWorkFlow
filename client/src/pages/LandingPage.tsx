/**
 * Landing Page
 * Main marketing page with hero, features, testimonials, and CTAs
 */

import React from "react";
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
} from "lucide-react";

const features = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: "AI-Powered Categorization",
    description:
      "95% accuracy on transaction categorization. Our ML model learns from your corrections and improves over time.",
    color: "purple",
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "AI CFO Copilot",
    description:
      'Ask questions like "Why did profit drop?" and get instant, data-driven answers from your financial data.',
    color: "blue",
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "30-Day Cash Flow Forecast",
    description:
      "Predict your cash position with AI-powered forecasting. Know your runway and plan ahead.",
    color: "green",
  },
  {
    icon: <AlertTriangle className="w-6 h-6" />,
    title: "Anomaly Detection",
    description:
      "Automatically detect duplicate payments, unusual transactions, and potential errors before they cost you.",
    color: "amber",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Smart Automation",
    description:
      "Create IF/THEN rules that automate repetitive tasks. Save 10+ hours per month on bookkeeping.",
    color: "pink",
  },
  {
    icon: <Building2 className="w-6 h-6" />,
    title: "Multi-Entity Support",
    description:
      "Manage multiple businesses from one dashboard. Consolidated reporting and entity-specific insights.",
    color: "indigo",
  },
];

const testimonials = [
  {
    quote:
      "ChronaWorkFlow saved me 15 hours a month on workflow automation. The AI categorization is incredibly accurate.",
    author: "Sarah Chen",
    role: "Founder, TechStart Inc",
    avatar: "SC",
  },
  {
    quote:
      "The AI CFO Copilot is like having a financial advisor on call 24/7. Game changer for decision making.",
    author: "Michael Rodriguez",
    role: "CEO, GrowthLabs",
    avatar: "MR",
  },
  {
    quote:
      "Migrated from QuickBooks in 10 minutes. The AI mapped everything perfectly. Wish I'd switched sooner.",
    author: "Emily Watson",
    role: "Owner, Watson Consulting",
    avatar: "EW",
  },
];

const stats = [
  { value: "95%", label: "AI Accuracy" },
  { value: "10+", label: "Hours Saved/Month" },
  { value: "$5,000+", label: "Avg. Deductions Found" },
  { value: "15min", label: "QuickBooks Migration" },
];

const comparisonPoints = [
  {
    feature: "AI Transaction Categorization",
    accubooks: true,
    quickbooks: false,
  },
  { feature: "Natural Language Queries", accubooks: true, quickbooks: false },
  { feature: "Cash Flow Forecasting", accubooks: true, quickbooks: "Limited" },
  { feature: "Anomaly Detection", accubooks: true, quickbooks: false },
  {
    feature: "Multi-Entity Dashboard",
    accubooks: true,
    quickbooks: "Extra Cost",
  },
  { feature: "Automation Workflows", accubooks: true, quickbooks: "Limited" },
  { feature: "Starting Price", accubooks: "$29/mo", quickbooks: "$30/mo" },
];

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                ChronaWorkFlow
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground"
              >
                Features
              </a>
              <a
                href="/pricing"
                className="text-muted-foreground hover:text-foreground"
              >
                Pricing
              </a>
              <a
                href="#comparison"
                className="text-muted-foreground hover:text-foreground"
              >
                vs QuickBooks
              </a>
              <a
                href="/login"
                className="text-muted-foreground hover:text-foreground"
              >
                Sign In
              </a>
              <a
                href="/signup"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Start Free Trial
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-muted to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Native Accounting Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Accounting That{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Thinks For You
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              ChronaWorkFlow uses AI to categorize transactions, forecast cash flow,
              detect anomalies, and answer your financial questions—saving you
              10+ hours every month.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/signup"
                className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-soft"
              >
                Start 14-Day Free Trial
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#demo"
                className="px-8 py-4 bg-card text-foreground rounded-xl font-semibold hover:bg-card/80 transition-colors flex items-center gap-2 border border-border"
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              AI-Powered Features That Save You Time
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Every feature is designed to automate tedious tasks and give you
              insights that matter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-muted rounded-2xl p-6 hover:shadow-soft transition-shadow"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-${feature.color}-100 dark:bg-${feature.color}-900/30 text-${feature.color}-600 dark:text-${feature.color}-400`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="py-20 bg-muted">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              ChronaWorkFlow vs QuickBooks
            </h2>
            <p className="text-xl text-muted-foreground">
              See why businesses are switching to AI-native accounting.
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
            <div className="grid grid-cols-3 bg-muted p-4">
              <div className="font-semibold text-foreground">Feature</div>
              <div className="text-center font-semibold text-primary">
                ChronaWorkFlow
              </div>
              <div className="text-center font-semibold text-muted-foreground">
                QuickBooks
              </div>
            </div>
            {comparisonPoints.map((point, index) => (
              <div
                key={index}
                className="grid grid-cols-3 p-4 border-b border-muted last:border-0"
              >
                <div className="text-muted-foreground">{point.feature}</div>
                <div className="text-center">
                  {point.accubooks === true ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <span className="text-foreground font-medium">
                      {point.accubooks}
                    </span>
                  )}
                </div>
                <div className="text-center">
                  {point.quickbooks === true ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : point.quickbooks === false ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      {point.quickbooks}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a
              href="/migration"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Migrate from QuickBooks in 15 minutes
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Loved by Business Owners
            </h2>
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-6 h-6 text-yellow-400 fill-yellow-400"
                />
              ))}
            </div>
            <p className="text-muted-foreground">
              4.9/5 average rating from 500+ reviews
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-muted rounded-2xl p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-yellow-400 fill-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-medium">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-muted-foreground">
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
      <section className="py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Accounting?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Join thousands of businesses saving 10+ hours per month with
            AI-powered accounting.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/signup"
              className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="/pricing"
              className="px-8 py-4 bg-card text-foreground rounded-xl font-semibold hover:bg-card/80 transition-colors border border-border"
            >
              View Pricing
            </a>
          </div>
          <p className="mt-4 text-primary-foreground/60 text-sm">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted text-muted-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-foreground font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="hover:text-foreground">
                    Features
                  </a>
                </li>
                <li>
                  <a href="/pricing" className="hover:text-foreground">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="/migration" className="hover:text-foreground">
                    Migration
                  </a>
                </li>
                <li>
                  <a href="/integrations" className="hover:text-foreground">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/about" className="hover:text-foreground">
                    About
                  </a>
                </li>
                <li>
                  <a href="/blog" className="hover:text-foreground">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="/careers" className="hover:text-foreground">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-foreground">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/docs" className="hover:text-foreground">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="/api" className="hover:text-foreground">
                    API
                  </a>
                </li>
                <li>
                  <a href="/help" className="hover:text-foreground">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="/status" className="hover:text-foreground">
                    Status
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/privacy" className="hover:text-foreground">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-foreground">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="/security" className="hover:text-foreground">
                    Security
                  </a>
                </li>
                <li>
                  <a href="/compliance" className="hover:text-foreground">
                    Compliance
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-muted flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-foreground font-bold">ChronaWorkFlow</span>
            </div>
            <p className="text-sm">© 2026 ChronaWorkFlow. Developed by SkyLabs Enterprise.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
