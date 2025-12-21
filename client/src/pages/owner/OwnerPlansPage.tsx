import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { OwnerLayout } from "@/components/layout/OwnerLayout";
import { DataTable } from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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
  DialogTrigger,
} from "@/components/ui/Dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import { ownerApi } from "@/api";

type Plan = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  priceCents: number;
  currency: string;
  billingInterval: "month" | "year";
  stripeProductId?: string | null;
  stripePriceId?: string | null;
  includedUsers: number;
  includedInvoices: number;
  includedAiTokens: number;
  includedApiCalls: number;
  maxUsers?: number | null;
  maxInvoices?: number | null;
  maxAiTokens?: number | null;
  maxApiCalls?: number | null;
  allowApiAccess: boolean;
  allowAuditExports: boolean;
  allowAdvancedAnalytics: boolean;
  updatedAt?: string;
};

type PlanFormState = {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  priceCents: string;
  currency: string;
  billingInterval: "month" | "year";
  includedUsers: string;
  includedInvoices: string;
  includedAiTokens: string;
  includedApiCalls: string;
  maxUsers: string;
  maxInvoices: string;
  maxAiTokens: string;
  maxApiCalls: string;
  allowApiAccess: boolean;
  allowAuditExports: boolean;
  allowAdvancedAnalytics: boolean;
};

function moneyFromCents(cents: number) {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function toNumberOrNull(v: string): number | null {
  const trimmed = v.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function toIntOrZero(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function buildPayload(form: PlanFormState) {
  const maxUsers = toNumberOrNull(form.maxUsers);
  const maxInvoices = toNumberOrNull(form.maxInvoices);
  const maxAiTokens = toNumberOrNull(form.maxAiTokens);
  const maxApiCalls = toNumberOrNull(form.maxApiCalls);

  return {
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    description: form.description.trim() ? form.description.trim() : null,
    isActive: form.isActive,
    priceCents: toIntOrZero(form.priceCents),
    currency: form.currency.trim() || "USD",
    billingInterval: form.billingInterval,
    includedUsers: toIntOrZero(form.includedUsers),
    includedInvoices: toIntOrZero(form.includedInvoices),
    includedAiTokens: toIntOrZero(form.includedAiTokens),
    includedApiCalls: toIntOrZero(form.includedApiCalls),
    maxUsers,
    maxInvoices,
    maxAiTokens,
    maxApiCalls,
    allowApiAccess: form.allowApiAccess,
    allowAuditExports: form.allowAuditExports,
    allowAdvancedAnalytics: form.allowAdvancedAnalytics,
  };
}

function createEmptyForm(): PlanFormState {
  return {
    code: "",
    name: "",
    description: "",
    isActive: true,
    priceCents: "1900",
    currency: "USD",
    billingInterval: "month",
    includedUsers: "1",
    includedInvoices: "50",
    includedAiTokens: "50000",
    includedApiCalls: "0",
    maxUsers: "1",
    maxInvoices: "50",
    maxAiTokens: "50000",
    maxApiCalls: "",
    allowApiAccess: false,
    allowAuditExports: false,
    allowAdvancedAnalytics: false,
  };
}

function hydrateForm(plan: Plan): PlanFormState {
  return {
    code: plan.code ?? "",
    name: plan.name ?? "",
    description: plan.description ?? "",
    isActive: Boolean(plan.isActive),
    priceCents: String(plan.priceCents ?? 0),
    currency: plan.currency ?? "USD",
    billingInterval: plan.billingInterval ?? "month",
    includedUsers: String(plan.includedUsers ?? 0),
    includedInvoices: String(plan.includedInvoices ?? 0),
    includedAiTokens: String(plan.includedAiTokens ?? 0),
    includedApiCalls: String(plan.includedApiCalls ?? 0),
    maxUsers: plan.maxUsers === null || plan.maxUsers === undefined ? "" : String(plan.maxUsers),
    maxInvoices:
      plan.maxInvoices === null || plan.maxInvoices === undefined ? "" : String(plan.maxInvoices),
    maxAiTokens:
      plan.maxAiTokens === null || plan.maxAiTokens === undefined ? "" : String(plan.maxAiTokens),
    maxApiCalls:
      plan.maxApiCalls === null || plan.maxApiCalls === undefined ? "" : String(plan.maxApiCalls),
    allowApiAccess: Boolean(plan.allowApiAccess),
    allowAuditExports: Boolean(plan.allowAuditExports),
    allowAdvancedAnalytics: Boolean(plan.allowAdvancedAnalytics),
  };
}

export default function OwnerPlansPage() {
  const queryClient = useQueryClient();

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Plan | null>(null);
  const [form, setForm] = React.useState<PlanFormState>(() => createEmptyForm());

  const { data, isLoading, isError } = useQuery({
    queryKey: ["owner-plans"],
    queryFn: async (): Promise<Plan[]> => {
      const res = await ownerApi.getPlans();
      return res.data as Plan[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = buildPayload(form);
      if (editing) {
        const res = await ownerApi.updatePlan(editing.id, payload);
        return res.data as Plan;
      }
      const res = await ownerApi.createPlan(payload);
      return res.data as Plan;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner-plans"] });
      setOpen(false);
      setEditing(null);
      setForm(createEmptyForm());
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await ownerApi.deletePlan(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owner-plans"] });
    },
  });

  const plans = data ?? [];

  return (
    <OwnerLayout
      title="Plans & Pricing"
      subtitle="Create, price, and govern subscription tiers across the entire platform"
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {isError ? "Failed to load plans." : ""}
          </div>

          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) {
                setEditing(null);
                setForm(createEmptyForm());
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditing(null);
                  setForm(createEmptyForm());
                  setOpen(true);
                }}
              >
                Create plan
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editing ? `Edit plan: ${editing.code}` : "Create plan"}
                </DialogTitle>
                <DialogDescription>
                  Define pricing, limits, and included usage. Changes are audited.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Code</div>
                  <Input
                    aria-label="Plan code"
                    value={form.code}
                    onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                    placeholder="STARTER"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Name</div>
                  <Input
                    aria-label="Plan name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Starter"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm font-medium">Description</div>
                  <Textarea
                    aria-label="Plan description"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Copy-ready plan description for pricing pages"
                    className="min-h-[96px]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Price (cents)</div>
                  <Input
                    aria-label="Plan price cents"
                    inputMode="numeric"
                    value={form.priceCents}
                    onChange={(e) => setForm((p) => ({ ...p, priceCents: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Billing interval</div>
                  <Select
                    value={form.billingInterval}
                    onValueChange={(v) => setForm((p) => ({ ...p, billingInterval: v as any }))}
                  >
                    <SelectValue placeholder="Select interval" />
                    <SelectContent>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="year">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Included users</div>
                  <Input
                    aria-label="Included users"
                    inputMode="numeric"
                    value={form.includedUsers}
                    onChange={(e) => setForm((p) => ({ ...p, includedUsers: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Max users</div>
                  <Input
                    aria-label="Max users"
                    inputMode="numeric"
                    value={form.maxUsers}
                    onChange={(e) => setForm((p) => ({ ...p, maxUsers: e.target.value }))}
                    placeholder="Leave blank for unlimited"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Included invoices / month</div>
                  <Input
                    aria-label="Included invoices"
                    inputMode="numeric"
                    value={form.includedInvoices}
                    onChange={(e) => setForm((p) => ({ ...p, includedInvoices: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Max invoices / month</div>
                  <Input
                    aria-label="Max invoices"
                    inputMode="numeric"
                    value={form.maxInvoices}
                    onChange={(e) => setForm((p) => ({ ...p, maxInvoices: e.target.value }))}
                    placeholder="Leave blank for unlimited"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Included AI tokens / month</div>
                  <Input
                    aria-label="Included AI tokens"
                    inputMode="numeric"
                    value={form.includedAiTokens}
                    onChange={(e) => setForm((p) => ({ ...p, includedAiTokens: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Max AI tokens / month</div>
                  <Input
                    aria-label="Max AI tokens"
                    inputMode="numeric"
                    value={form.maxAiTokens}
                    onChange={(e) => setForm((p) => ({ ...p, maxAiTokens: e.target.value }))}
                    placeholder="Leave blank for unlimited"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Included API calls / month</div>
                  <Input
                    aria-label="Included API calls"
                    inputMode="numeric"
                    value={form.includedApiCalls}
                    onChange={(e) => setForm((p) => ({ ...p, includedApiCalls: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Max API calls / month</div>
                  <Input
                    aria-label="Max API calls"
                    inputMode="numeric"
                    value={form.maxApiCalls}
                    onChange={(e) => setForm((p) => ({ ...p, maxApiCalls: e.target.value }))}
                    placeholder="Leave blank for unlimited"
                  />
                </div>

                <div className="rounded-lg border bg-card p-4 md:col-span-2">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.isActive}
                        onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: Boolean(v) }))}
                      />
                      Active
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.allowApiAccess}
                        onCheckedChange={(v) =>
                          setForm((p) => ({ ...p, allowApiAccess: Boolean(v) }))
                        }
                      />
                      API access
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.allowAdvancedAnalytics}
                        onCheckedChange={(v) =>
                          setForm((p) => ({ ...p, allowAdvancedAnalytics: Boolean(v) }))
                        }
                      />
                      Advanced analytics
                    </label>

                    <label className="flex items-center gap-2 text-sm md:col-span-3">
                      <Checkbox
                        checked={form.allowAuditExports}
                        onCheckedChange={(v) =>
                          setForm((p) => ({ ...p, allowAuditExports: Boolean(v) }))
                        }
                      />
                      Audit exports
                    </label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    setEditing(null);
                    setForm(createEmptyForm());
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => upsertMutation.mutate()}
                  disabled={upsertMutation.isPending}
                >
                  {upsertMutation.isPending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable<Plan>
          data={plans}
          loading={isLoading}
          searchable
          exportable
          columns={[
            {
              key: "code",
              title: "Code",
              sortable: true,
            },
            {
              key: "name",
              title: "Name",
              sortable: true,
            },
            {
              key: "priceCents",
              title: "Price",
              sortable: true,
              render: (v) => moneyFromCents(Number(v ?? 0)),
            },
            {
              key: "billingInterval",
              title: "Interval",
              sortable: true,
            },
            {
              key: "includedUsers",
              title: "Users",
              render: (_v, row) =>
                row.maxUsers ? `${row.includedUsers}/${row.maxUsers}` : `${row.includedUsers}/∞`,
            },
            {
              key: "includedAiTokens",
              title: "AI tokens",
              render: (_v, row) =>
                row.maxAiTokens
                  ? `${row.includedAiTokens.toLocaleString()}/${row.maxAiTokens.toLocaleString()}`
                  : `${row.includedAiTokens.toLocaleString()}/∞`,
            },
            {
              key: "isActive",
              title: "Status",
              render: (v) => (v ? "Active" : "Inactive"),
            },
            {
              key: "actions",
              title: "Actions",
              render: (_v, row) => (
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(row);
                      setForm(hydrateForm(row));
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => e.stopPropagation()}
                        disabled={deleteMutation.isPending}
                      >
                        Disable
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disable plan?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This performs a soft delete (plan becomes inactive). Existing subscriptions
                          will remain, but the plan should no longer be sold.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(row.id)}
                        >
                          Disable
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ),
            },
          ]}
          onRowClick={(row) => {
            setEditing(row);
            setForm(hydrateForm(row));
            setOpen(true);
          }}
        />
      </div>
    </OwnerLayout>
  );
}
