import React, { useState } from "react";
import { Lock, Unlock, Download, Calendar } from "lucide-react";
import { useAccountingPeriods } from "@/hooks/useAccountingPeriods";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import { ProtectedComponent } from "@/components/ui/ProtectedComponent";

const OwnerControlsPage: React.FC = () => {
  const { user } = useAuth();
  const [companyId] = useState("demo-company"); // TODO: pull from context or route
  const { periods, isLoading, lockPeriod, unlockPeriod } =
    useAccountingPeriods(companyId);
  const [lockReason, setLockReason] = useState("");
  const [unlockReason, setUnlockReason] = useState("");
  const [showLockForm, setShowLockForm] = useState<string | null>(null);
  const [showUnlockForm, setShowUnlockForm] = useState<string | null>(null);

  const handleLockPeriod = (periodId: string) => {
    if (!lockReason.trim()) return;
    lockPeriod.mutate({ periodId, reason: lockReason });
    setLockReason("");
    setShowLockForm(null);
  };

  const handleUnlockPeriod = (periodId: string) => {
    if (!unlockReason.trim()) return;
    unlockPeriod.mutate({ periodId, reason: unlockReason });
    setUnlockReason("");
    setShowUnlockForm(null);
  };

  const handleExportReport = async (format: "json" | "csv") => {
    try {
      const startDate =
        periods?.[0]?.startDate ?? new Date().toISOString().split("T")[0];
      const endDate =
        periods?.[periods.length - 1]?.endDate ??
        new Date().toISOString().split("T")[0];
      const url = `/api/owner/export/accountant-report?companyId=${companyId}&startDate=${startDate}&endDate=${endDate}&format=${format}`;
      window.open(url, "_blank");
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  if (!user?.role || user.role !== "OWNER") {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-gray-600">
          Owner access required to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Owner Controls</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExportReport("json")}>
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button variant="outline" onClick={() => handleExportReport("csv")}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Accounting Periods
        </h2>
        {isLoading ? (
          <p>Loading periods...</p>
        ) : (
          <div className="space-y-3">
            {periods?.map((period) => (
              <div
                key={period.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {new Date(period.startDate).toLocaleDateString()} —{" "}
                    {new Date(period.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {period.isLocked ? (
                      <span className="text-red-600 font-semibold">Locked</span>
                    ) : (
                      <span className="text-green-600">Open</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {period.isLocked ? (
                    <ProtectedComponent permission="owner:access">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowUnlockForm(period.id)}
                      >
                        <Unlock className="w-4 h-4 mr-1" />
                        Unlock
                      </Button>
                    </ProtectedComponent>
                  ) : (
                    <ProtectedComponent permission="owner:access">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowLockForm(period.id)}
                      >
                        <Lock className="w-4 h-4 mr-1" />
                        Lock
                      </Button>
                    </ProtectedComponent>
                  )}
                </div>
              </div>
            ))}
            {showLockForm && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-96">
                  <h3 className="text-lg font-semibold mb-4">
                    Lock Accounting Period
                  </h3>
                  <textarea
                    className="w-full border rounded p-2 mb-4"
                    rows={3}
                    placeholder="Reason for locking..."
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowLockForm(null)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => handleLockPeriod(showLockForm)}>
                      Lock
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {showUnlockForm && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-96">
                  <h3 className="text-lg font-semibold mb-4">
                    Unlock Accounting Period
                  </h3>
                  <textarea
                    className="w-full border rounded p-2 mb-4"
                    rows={3}
                    placeholder="Reason for unlocking..."
                    value={unlockReason}
                    onChange={(e) => setUnlockReason(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowUnlockForm(null)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => handleUnlockPeriod(showUnlockForm)}>
                      Unlock
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerControlsPage;
