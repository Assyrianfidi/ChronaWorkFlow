/**
 * ChronaWorkFlow Customer Onboarding System
 * Day 0-30 Guided Experience
 * Time-to-Value < 10 Minutes
 * Activation Milestones Tracked
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  Landmark,
  FileText,
  Users,
  BarChart3,
  Shield,
  Clock,
  TrendingUp,
  X
} from 'lucide-react';

// Onboarding steps
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  estimatedTime: string;
  required: boolean;
  completed: boolean;
  actionUrl?: string;
}

export interface ActivationMilestone {
  id: string;
  name: string;
  description: string;
  completedAt?: Date;
  metric: number; // Value to track
  target: number; // Target value
}

export interface OnboardingState {
  currentStep: number;
  steps: OnboardingStep[];
  milestones: ActivationMilestone[];
  timeToFirstValue: number; // minutes
  startedAt: Date;
  completedAt?: Date;
  dropOffPoint?: string;
}

// Default onboarding flow
export const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'create_company',
    title: 'Create Your Company',
    description: 'Set up your company profile and fiscal year settings',
    icon: Building2,
    estimatedTime: '2 min',
    required: true,
    completed: false,
    actionUrl: '/settings/company'
  },
  {
    id: 'chart_of_accounts',
    title: 'Import Chart of Accounts',
    description: 'Import from QuickBooks or create from scratch',
    icon: FileText,
    estimatedTime: '3 min',
    required: true,
    completed: false,
    actionUrl: '/accounts/import'
  },
  {
    id: 'connect_bank',
    title: 'Connect Your Bank',
    description: 'Link your bank accounts for automatic transaction import',
    icon: Landmark,
    estimatedTime: '2 min',
    required: true,
    completed: false,
    actionUrl: '/integrations/bank'
  },
  {
    id: 'invite_team',
    title: 'Invite Your Team',
    description: 'Add your accounting team and set permissions',
    icon: Users,
    estimatedTime: '2 min',
    required: false,
    completed: false,
    actionUrl: '/team/invite'
  },
  {
    id: 'first_transaction',
    title: 'Record First Transaction',
    description: 'Create your first journal entry or categorize a bank transaction',
    icon: FileText,
    estimatedTime: '1 min',
    required: true,
    completed: false,
    actionUrl: '/transactions/new'
  },
  {
    id: 'view_trial_balance',
    title: 'View Trial Balance',
    description: 'Experience the real-time Trial Balance validation',
    icon: BarChart3,
    estimatedTime: '1 min',
    required: true,
    completed: false,
    actionUrl: '/reports/trial-balance'
  }
];

// Activation milestones
export const DEFAULT_MILESTONES: ActivationMilestone[] = [
  {
    id: 'first_login',
    name: 'First Login',
    description: 'User has logged in for the first time',
    metric: 1,
    target: 1
  },
  {
    id: 'company_created',
    name: 'Company Created',
    description: 'Company profile set up',
    metric: 0,
    target: 1
  },
  {
    id: 'accounts_imported',
    name: 'Chart of Accounts Ready',
    description: 'Chart of accounts has 5+ accounts',
    metric: 0,
    target: 5
  },
  {
    id: 'bank_connected',
    name: 'Bank Connected',
    description: 'At least one bank account connected',
    metric: 0,
    target: 1
  },
  {
    id: 'first_transaction_created',
    name: 'First Transaction',
    description: 'User has created or categorized a transaction',
    metric: 0,
    target: 1
  },
  {
    id: 'trial_balance_viewed',
    name: 'Trial Balance Validated',
    description: 'User has viewed the real-time Trial Balance',
    metric: 0,
    target: 1
  },
  {
    id: 'team_invited',
    name: 'Team Collaboration',
    description: 'At least one team member invited',
    metric: 0,
    target: 1
  },
  {
    id: 'first_report_generated',
    name: 'First Report',
    description: 'User has generated a financial report',
    metric: 0,
    target: 1
  },
  {
    id: 'active_days_7',
    name: '7-Day Active',
    description: 'Active on 7 different days',
    metric: 0,
    target: 7
  },
  {
    id: 'transactions_50',
    name: 'Transaction Momentum',
    description: '50+ transactions processed',
    metric: 0,
    target: 50
  }
];

// Drop-off recovery hooks
export const DROPOFF_RECOVERY_HOOKS: Record<string, { subject: string; body: string; timing: string }> = {
  'create_company': {
    subject: 'Complete your ChronaWorkFlow setup in 2 minutes',
    body: `Hi there,

I noticed you started setting up ChronaWorkFlow but haven't created your company profile yet.

This takes just 2 minutes and unlocks the full platform.

[Complete Setup →]

Questions? Just reply to this email.

Sarah Chen
CEO, ChronaWorkFlow`,
    timing: '24 hours after signup'
  },
  'connect_bank': {
    subject: 'Skip the data entry - connect your bank',
    body: `Hi there,

You have ChronaWorkFlow set up, but haven't connected your bank account yet.

Here's what you're missing:
• Automatic transaction import (no more CSV uploads)
• Real-time reconciliation
• 95% auto-categorization

It takes 2 minutes: [Connect Bank →]

Sarah Chen
CEO, ChronaWorkFlow`,
    timing: '48 hours after company created'
  },
  'view_trial_balance': {
    subject: 'See the magic: Your real-time Trial Balance',
    body: `Hi there,

You have transactions in ChronaWorkFlow, but haven't seen the real-time Trial Balance yet.

This is the feature that makes CFOs say "wow."

Your books are being validated every 30 seconds. See it now:
[View Trial Balance →]

Sarah Chen
CEO, ChronaWorkFlow`,
    timing: '3 days after first transaction'
  }
};

// React Component: Onboarding Wizard
export const OnboardingWizard: React.FC<{
  steps?: OnboardingStep[];
  onComplete?: () => void;
  onStepComplete?: (stepId: string) => void;
}> = ({ steps = DEFAULT_ONBOARDING_STEPS, onComplete, onStepComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const completed = steps.filter(s => s.completed).length;
    setProgress((completed / steps.length) * 100);
  }, [completedSteps, steps]);

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => [...prev, stepId]);
    onStepComplete?.(stepId);
    
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setShowCelebration(true);
      onComplete?.();
    }
  };

  const handleSkip = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const currentStep = steps[currentStepIndex];
  const StepIcon = currentStep?.icon || Circle;
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900">Welcome to ChronaWorkFlow</h1>
        </div>
        <p className="text-gray-600">
          Complete these steps to get up and running. 
          Estimated time: <span className="font-semibold text-blue-600">10 minutes</span>
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Step {currentStepIndex + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      {!showCelebration && currentStep && (
        <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <StepIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{currentStep.title}</h2>
              <p className="text-gray-600 mb-4">{currentStep.description}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Clock className="w-4 h-4" />
                <span>{currentStep.estimatedTime}</span>
                {currentStep.required && (
                  <span className="text-red-500">• Required</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleStepComplete(currentStep.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Complete
                </button>
                <a
                  href={currentStep.actionUrl}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Go to Step
                </a>
                {!currentStep.required && (
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    Skip
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Steps List */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = completedSteps.includes(step.id) || step.completed;
          const isCurrent = index === currentStepIndex;
          
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                isCompleted ? 'bg-green-50' : isCurrent ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : isCurrent ? (
                <Circle className="w-5 h-5 text-blue-500 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${isCompleted ? 'text-green-900 line-through' : 'text-gray-900'}`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.estimatedTime}</p>
              </div>
              {isCurrent && <span className="text-xs text-blue-600 font-medium">Current</span>}
            </div>
          );
        })}
      </div>

      {/* Celebration Screen */}
      {showCelebration && (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <Sparkles className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set! 🎉</h2>
          <p className="text-gray-600 mb-6">
            You've completed the setup. Time to value: <span className="font-semibold">Under 10 minutes</span>
          </p>
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-2">What's next?</h3>
            <ul className="text-sm text-green-800 space-y-1 text-left">
              <li>• Your first month-end will be a breeze</li>
              <li>• Check out the real-time Trial Balance anytime</li>
              <li>• Need help? You have CEO-level support</li>
            </ul>
          </div>
          <a
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
};

// React Component: Activation Milestone Tracker
export const ActivationMilestoneTracker: React.FC<{
  milestones?: ActivationMilestone[];
}> = ({ milestones = DEFAULT_MILESTONES }) => {
  const completedCount = milestones.filter(m => (m.metric / m.target) >= 1).length;
  const completionRate = (completedCount / milestones.length) * 100;
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Activation Milestones</h2>
          <p className="text-sm text-gray-500">Track customer activation progress</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">{completionRate.toFixed(0)}%</p>
          <p className="text-xs text-gray-500">{completedCount}/{milestones.length} complete</p>
        </div>
      </div>

      <div className="space-y-4">
        {milestones.map((milestone) => {
          const progress = Math.min((milestone.metric / milestone.target) * 100, 100);
          const isComplete = progress >= 100;
          
          return (
            <div key={milestone.id} className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isComplete ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {isComplete ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium ${isComplete ? 'text-green-900' : 'text-gray-900'}`}>
                    {milestone.name}
                  </span>
                  <span className="text-sm text-gray-500">
                    {milestone.metric}/{milestone.target}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      isComplete ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{milestone.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default {
  DEFAULT_ONBOARDING_STEPS,
  DEFAULT_MILESTONES,
  DROPOFF_RECOVERY_HOOKS,
  OnboardingWizard,
  ActivationMilestoneTracker
};
