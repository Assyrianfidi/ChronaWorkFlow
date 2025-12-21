import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { OwnerLayout } from "@/components/layout/OwnerLayout";
import { DataTable } from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectValue } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Textarea } from "@/components/ui/Textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { ownerApi } from "@/api";

type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "paused";

type SubscriptionRow = {
  subscription: {
    id: string;
    companyId: string;
    planId: string;
    status: SubscriptionStatus;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    cancelAtPeriodEnd: boolean;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    trialStart?: string | null;
    trialEnd?: string | null;
    canceledAt?: string | null;
    ownerGrantedFree: boolean;
    ownerNotes?: string | null;
    updatedAt?: string;
  };
  company: {
    id: string;
    name: string;
  };
  plan: {
    id: string;
    code: string;
    name: string;
    priceCents: number;
    billingInterval: "month" | "year";
  };
};

type OverrideForm = {
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  ownerGrantedFree: boolean;
  ownerNotes: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export default function OwnerSubscriptionsPage() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [editing, setEditing] = React.useState<SubscriptionRow | null>(null);
  const [overrideOpen, setOverrideOpen] = React.useState(false);
  const [form, setForm] = React.useState<OverrideForm>({
    status: "active",
    cancelAtPeriodEnd: false,
    ownerGrantedFree: false,
    ownerNotes: "",
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["owner-subscriptions", statusFilter],
    queryFn: async (): Promise<SubscriptionRow[]> => {
      const res = await ownerApi.getSubscriptions({
        status: statusFilter ? statusFilter : undefined,
      });
      return res.data as SubscriptionRow[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) throw new Error("No subscription selected");
      const res = await ownerApi.updateSubscription(editing.subscription.id, {
        status: form.status,
        cancelAtPeriodEnd: form.cancelAtPeriodEnd,
        ownerGrantedFree: form.ownerGrantedFree,
        ownerNotes: form.ownerNotes,
      });
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner-subscriptions"] });
      setOverrideOpen(false);
      setEditing(null);
    },
  });

  const rows = data ?? [];

  return (
    <OwnerLayout
      title="Subscriptions & Revenue"
      subtitle="Monitor subscription health and override account billing governance"
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">Status</div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
              <SelectValue placeholder="All" />
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="trialing">Trialing</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="past_due">Past due</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            {isError ? "Failed to load subscriptions." : ""}
          </div>
        </div>

        <DataTable<SubscriptionRow>
          data={rows}
          loading={isLoading}
          searchable
          exportable
          columns={[
            {
              key: "company",
              title: "Company",
              render: (_v, row) => row.company.name,
            },
            {
              key: "plan",
              title: "Plan",
              render: (_v, row) => `${row.plan.code} (${row.plan.billingInterval})`,
            },
            {
              key: "status",
              title: "Status",
              render: (_v, row) => row.subscription.status,
            },
            {
              key: "currentPeriodEnd",
              title: "Period ends",
              render: (_v, row) => formatDate(row.subscription.currentPeriodEnd),
            },
            {
              key: "ownerGrantedFree",
              title: "Free",
              render: (_v, row) => (row.subscription.ownerGrantedFree ? "Yes" : "No"),
            },
            {
              key: "cancelAtPeriodEnd",
              title: "Cancel at end",
              render: (_v, row) => (row.subscription.cancelAtPeriodEnd ? "Yes" : "No"),
            },
            {
              key: "actions",
              title: "Actions",
              render: (_v, row) => (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(row);
                      setForm({
                        status: row.subscription.status,
                        cancelAtPeriodEnd: row.subscription.cancelAtPeriodEnd,
                        ownerGrantedFree: row.subscription.ownerGrantedFree,
                        ownerNotes: row.subscription.ownerNotes ?? "",
                      });
                      setOverrideOpen(true);
                    }}
                  >
                    Override
                  </Button>
                </div>
              ),
            },
          ]}
          onRowClick={(row) => {
            setEditing(row);
            setForm({
              status: row.subscription.status,
              cancelAtPeriodEnd: row.subscription.cancelAtPeriodEnd,
              ownerGrantedFree: row.subscription.ownerGrantedFree,
              ownerNotes: row.subscription.ownerNotes ?? "",
            });
            setOverrideOpen(true);
          }}
        />

        <Dialog
          open={overrideOpen}
          onOpenChange={(next) => {
            setOverrideOpen(next);
            if (!next) {
              setEditing(null);
            }
          }}
        >
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Subscription override</DialogTitle>
              <DialogDescription>
                Apply governance overrides. Changes are logged to audit logs.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-semibold">
                  {editing ? editing.company.name : "—"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {editing ? `${editing.plan.code} • ${editing.subscription.id}` : ""}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Status</div>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((p) => ({ ...p, status: v as any }))}
                >
                  <SelectValue placeholder="Select status" />
                  <SelectContent>
                    <SelectItem value="trialing">Trialing</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="past_due">Past due</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.cancelAtPeriodEnd}
                    onCheckedChange={(v) =>
                      setForm((p) => ({ ...p, cancelAtPeriodEnd: Boolean(v) }))
                    }
                  />
                  Cancel at period end
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.ownerGrantedFree}
                    onCheckedChange={(v) =>
                      setForm((p) => ({ ...p, ownerGrantedFree: Boolean(v) }))
                    }
                  />
                  Owner-granted free
                </label>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Owner notes</div>
                <Textarea
                  aria-label="Owner notes"
                  value={form.ownerNotes}
                  onChange={(e) => setForm((p) => ({ ...p, ownerNotes: e.target.value }))}
                  placeholder="Reason for override (visible in audit logs)"
                  className="min-h-[96px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setOverrideOpen(false);
                  setEditing(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving…" : "Apply"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </OwnerLayout>
  );
}
