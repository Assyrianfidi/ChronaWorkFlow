import * as React from 'react';
import { useEffect } from 'react';
import { useBillingContext } from '../../hooks/useBillingContext';
import { useCompanyContext } from '../../hooks/useCompanyContext';
import { AlertCircle, Lock, TrendingUp } from 'lucide-react';
import Button from '../ui/Button';

interface BillingGuardProps {
  children: React.ReactNode;
  action?: 'create_invoice' | 'create_payment' | 'create_user' | 'run_payroll';
  fallback?: React.ReactNode;
}

/**
 * BillingGuard component
 * Wraps content and blocks access if billing status doesn't allow writes
 * Shows appropriate messaging for suspended/read-only/over-limit states
 */
export const BillingGuard: React.FC<BillingGuardProps> = ({
  children,
  action,
  fallback,
}) => {
  const { companyId } = useCompanyContext();
  const { status, limits, fetchBillingStatus, fetchBillingLimits, canWrite, isOverLimit } = useBillingContext();

  useEffect(() => {
    if (companyId) {
      fetchBillingStatus(companyId);
      fetchBillingLimits(companyId);
    }
  }, [companyId, fetchBillingStatus, fetchBillingLimits]);

  // Check if write is allowed
  const writeAllowed = canWrite();

  // Check resource-specific limits
  let resourceOverLimit = false;
  let resourceType: string | null = null;
  
  if (action && limits) {
    switch (action) {
      case 'create_invoice':
        resourceOverLimit = isOverLimit('invoices');
        resourceType = 'invoices';
        break;
      case 'create_user':
        resourceOverLimit = isOverLimit('users');
        resourceType = 'users';
        break;
    }
  }

  // If billing is suspended or read-only, show blocking message
  if (!writeAllowed && status) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-4">
          <Lock className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              {status.status === 'suspended' ? 'Account Suspended' : 'Read-Only Mode'}
            </h3>
            <p className="text-red-700 mb-4">
              {status.status === 'suspended'
                ? 'Your account has been suspended due to billing issues. Please update your payment method to restore access.'
                : 'Your account is in read-only mode due to past due payment. Please update your payment to restore full access.'}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => window.location.href = '/billing'}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Update Billing
              </Button>
              {status.renewalDate && (
                <p className="text-sm text-red-600 self-center">
                  Renewal: {new Date(status.renewalDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If resource limit exceeded, show upgrade prompt
  if (resourceOverLimit && limits) {
    const usage = resourceType === 'invoices' 
      ? limits.usage.invoicesThisMonth 
      : limits.usage.users;
    const limit = resourceType === 'invoices'
      ? limits.limits.invoicesPerMonth
      : limits.limits.users;

    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-4">
          <TrendingUp className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              Plan Limit Reached
            </h3>
            <p className="text-amber-700 mb-4">
              You've reached your plan limit for {resourceType} ({usage}/{limit} used this month).
              Upgrade your plan to continue.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => window.location.href = '/billing/plans'}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Upgrade Plan
              </Button>
              <p className="text-sm text-amber-600 self-center">
                Current plan: {limits.planCode}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
};

/**
 * BillingBanner component
 * Shows non-blocking warning banner for billing issues
 */
export const BillingBanner: React.FC = () => {
  const { companyId } = useCompanyContext();
  const { status, fetchBillingStatus } = useBillingContext();

  useEffect(() => {
    if (companyId) {
      fetchBillingStatus(companyId);
    }
  }, [companyId, fetchBillingStatus]);

  if (!status || status.status === 'active') {
    return null;
  }

  if (status.status === 'trial') {
    return (
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-900">
              You're on a trial plan. {status.renewalDate && `Trial ends ${new Date(status.renewalDate).toLocaleDateString()}.`}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => window.location.href = '/billing/plans'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Choose Plan
          </Button>
        </div>
      </div>
    );
  }

  if (status.status === 'past_due') {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-900">
              Your payment is past due. Update your payment method to avoid service interruption.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => window.location.href = '/billing'}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Update Payment
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

/**
 * UsageMeter component
 * Shows usage percentage for a resource
 */
interface UsageMeterProps {
  resourceType: 'invoices' | 'users' | 'companies' | 'aiTokens';
  label: string;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({ resourceType, label }) => {
  const { companyId } = useCompanyContext();
  const { limits, fetchBillingLimits, getUsagePercentage } = useBillingContext();

  useEffect(() => {
    if (companyId) {
      fetchBillingLimits(companyId);
    }
  }, [companyId, fetchBillingLimits]);

  if (!limits) {
    return null;
  }

  const percentage = getUsagePercentage(resourceType);
  const usage = resourceType === 'invoices' 
    ? limits.usage.invoicesThisMonth 
    : resourceType === 'users'
    ? limits.usage.users
    : resourceType === 'companies'
    ? limits.usage.companies
    : limits.usage.aiTokensThisMonth;
  
  const limit = resourceType === 'invoices'
    ? limits.limits.invoicesPerMonth
    : resourceType === 'users'
    ? limits.limits.users
    : resourceType === 'companies'
    ? limits.limits.companies
    : limits.limits.aiTokensPerMonth;

  const isNearLimit = percentage >= 80;
  const isOverLimit = percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={isOverLimit ? 'text-red-600 font-semibold' : isNearLimit ? 'text-amber-600' : 'text-gray-600'}>
          {usage} / {limit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isOverLimit ? 'bg-red-600' : isNearLimit ? 'bg-amber-500' : 'bg-blue-600'
          }`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      {isOverLimit && (
        <p className="text-xs text-red-600">
          Limit reached. Upgrade to continue.
        </p>
      )}
    </div>
  );
};
