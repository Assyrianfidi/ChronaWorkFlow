import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Subscription {
  id: string;
  status: string;
  plan: {
    name: string;
    amount: number;
    interval: string;
  };
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: string;
  created: string;
  pdfUrl: string;
}

export const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch subscription
      const subResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/billing/subscription`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData);
      }

      // Fetch invoices
      const invResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/billing/invoices`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (invResponse.ok) {
        const invData = await invResponse.json();
        setInvoices(invData);
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    navigate("/pricing");
  };

  const handleManagePayment = async () => {
    setActionLoading("payment");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/billing/portal`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            returnUrl: window.location.href,
          }),
        },
      );

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error opening billing portal:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.",
      )
    ) {
      return;
    }

    setActionLoading("cancel");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/billing/subscription/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        await fetchBillingData();
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async () => {
    setActionLoading("reactivate");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/billing/subscription/reactivate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        await fetchBillingData();
      }
    } catch (error) {
      console.error("Error reactivating subscription:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: "success" as const, label: "Active" },
      trialing: { variant: "info" as const, label: "Trial" },
      past_due: { variant: "warning" as const, label: "Past Due" },
      canceled: { variant: "default" as const, label: "Canceled" },
      incomplete: { variant: "warning" as const, label: "Incomplete" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "default" as const,
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Billing & Subscription
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your subscription, payment methods, and billing history
        </p>
      </div>

      {/* Current Subscription */}
      <Card className="mb-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Current Plan
            </h2>
            {subscription && getStatusBadge(subscription.status)}
          </div>

          {subscription ? (
            <>
              {subscription.cancelAtPeriodEnd && (
                <Alert variant="warning" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <div>
                    <p className="font-semibold">Subscription Canceling</p>
                    <p className="text-sm">
                      Your subscription will end on{" "}
                      {new Date(
                        subscription.currentPeriodEnd,
                      ).toLocaleDateString()}
                      . You'll retain access until then.
                    </p>
                  </div>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Plan
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {subscription.plan.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Price
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${subscription.plan.amount / 100}/
                    {subscription.plan.interval}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Current Period
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(
                      subscription.currentPeriodStart,
                    ).toLocaleDateString()}{" "}
                    -{" "}
                    {new Date(
                      subscription.currentPeriodEnd,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Next Billing Date
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {subscription.cancelAtPeriodEnd
                      ? "N/A (Canceling)"
                      : new Date(
                          subscription.currentPeriodEnd,
                        ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleUpgrade} variant="default">
                  Change Plan
                </Button>
                <Button
                  onClick={handleManagePayment}
                  variant="outline"
                  loading={actionLoading === "payment"}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Payment Methods
                </Button>
                {subscription.cancelAtPeriodEnd ? (
                  <Button
                    onClick={handleReactivate}
                    variant="success"
                    loading={actionLoading === "reactivate"}
                  >
                    Reactivate Subscription
                  </Button>
                ) : (
                  <Button
                    onClick={handleCancelSubscription}
                    variant="destructive"
                    loading={actionLoading === "cancel"}
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You don't have an active subscription
              </p>
              <Button onClick={() => navigate("/pricing")}>View Plans</Button>
            </div>
          )}
        </div>
      </Card>

      {/* Invoice History */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Invoice History
          </h2>

          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      Invoice
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {invoice.number}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(invoice.created).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        ${(invoice.amount / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        {invoice.status === "paid" ? (
                          <Badge variant="success">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Paid
                          </Badge>
                        ) : invoice.status === "open" ? (
                          <Badge variant="warning">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="default">{invoice.status}</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(invoice.pdfUrl, "_blank")}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No invoices yet
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default BillingPage;
