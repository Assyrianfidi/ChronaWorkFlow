import React from "react";
import { AlertCircle, CreditCard, Lock } from "lucide-react";
import { useBillingStatus } from "@/hooks/useBillingStatus";
import Button from "@/components/ui/Button";

interface BillingBannerProps {
  companyId: string;
}

export const BillingBanner: React.FC<BillingBannerProps> = ({ companyId }) => {
  const { isPastDue, isReadOnly, isSuspended, billing } =
    useBillingStatus(companyId);

  if (isSuspended) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <Lock className="w-5 h-5 text-red-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">Account Suspended</h3>
          <p className="text-sm text-red-700">
            Your account is suspended due to overdue payment. Please update your
            billing information to restore service.
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={() => (window.location.href = "/billing")}
        >
          Update Billing
        </Button>
      </div>
    );
  }

  if (isReadOnly) {
    return (
      <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-orange-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-orange-900">Read-Only Mode</h3>
          <p className="text-sm text-orange-700">
            Your account is in read-only mode due to overdue payment. You can
            view data but cannot make changes.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/billing")}
        >
          Update Billing
        </Button>
      </div>
    );
  }

  if (isPastDue) {
    return (
      <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <CreditCard className="w-5 h-5 text-yellow-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-900">Payment Overdue</h3>
          <p className="text-sm text-yellow-700">
            Your payment is overdue. Please update your billing details to avoid
            service interruption.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/billing")}
        >
          Update Billing
        </Button>
      </div>
    );
  }

  return null;
};
