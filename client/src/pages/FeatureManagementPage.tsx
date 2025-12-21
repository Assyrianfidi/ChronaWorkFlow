import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import Input from "../components/ui/Input";
import { FeatureToggle } from "../components/ui/FeatureToggle";
import { useToast } from "../hooks/useToast";
import { useInvalidateFeatures } from "@/lib/features";

type RoleKey =
  | "ADMIN"
  | "MANAGER"
  | "ACCOUNTANT"
  | "AUDITOR"
  | "INVENTORY_MANAGER";
type FeatureKey = string;

type FeatureCatalogItem = {
  key: FeatureKey;
  label: string;
  description: string;
};

type FeatureListItem = {
  key: FeatureKey;
  globalEnabled: boolean;
  roleDefaults: Partial<Record<RoleKey, boolean>>;
  userOverrides: Array<{ userId: number; enabled: boolean }>;
};

type FeatureListResponse = {
  success: boolean;
  data: { features: FeatureListItem[] };
  message?: string;
};

type UsersResponse = {
  success: boolean;
  data: {
    users: Array<{
      id: number;
      name: string | null;
      email: string;
      role: RoleKey;
    }>;
  };
  message?: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : "http://localhost:3001/api/v1");

const FEATURE_CATALOG: FeatureCatalogItem[] = [
  {
    key: "INVOICING",
    label: "Invoicing",
    description: "Create, send, and manage invoices.",
  },
  {
    key: "CUSTOMERS",
    label: "Customers",
    description: "Manage customer directory and details.",
  },
  {
    key: "TRANSACTIONS",
    label: "Transactions",
    description: "View and manage accounting transactions.",
  },
  {
    key: "REPORTS",
    label: "Reports",
    description: "View business reports and analytics.",
  },
  {
    key: "INVENTORY",
    label: "Inventory",
    description: "Manage inventory items and stock levels.",
  },
  {
    key: "AUDIT_LOG",
    label: "Audit Logs",
    description: "View audit trail and compliance logging.",
  },
];

const FeatureManagementPage: React.FC = () => {
  const { toast } = useToast();
  const invalidateFeatures = useInvalidateFeatures();

  const [isLoading, setIsLoading] = useState(true);
  const [features] = useState<FeatureCatalogItem[]>(FEATURE_CATALOG);
  const [featureState, setFeatureState] = useState<
    Record<string, FeatureListItem>
  >({});
  const [users, setUsers] = useState<
    Array<{ id: number; name: string; email: string; role: RoleKey }>
  >([]);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [query, setQuery] = useState<string>("");

  const filteredFeatures = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return features;
    return features.filter((f) => {
      return (
        f.label.toLowerCase().includes(q) ||
        f.key.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
      );
    });
  }, [features, query]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accubooks_token") || "";

      const [featuresRes, usersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/features`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${API_BASE_URL}/features/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      const featuresJson = (await featuresRes.json()) as FeatureListResponse;
      if (!featuresRes.ok || !featuresJson.success) {
        throw new Error(featuresJson?.message || "Failed to load features");
      }

      const usersJson = (await usersRes.json()) as UsersResponse;
      if (!usersRes.ok || !usersJson.success) {
        throw new Error(usersJson?.message || "Failed to load users");
      }

      const byKey: Record<string, FeatureListItem> = {};
      for (const f of featuresJson.data.features) {
        byKey[f.key] = f;
      }

      setFeatureState(byKey);
      setUsers(
        usersJson.data.users.map((u) => ({
          id: u.id,
          name: u.name || u.email,
          email: u.email,
          role: u.role,
        })),
      );

      if (usersJson.data.users.length > 0) {
        setSelectedUserId((prev) => prev ?? usersJson.data.users[0].id);
      }
    } catch (e: any) {
      toast({
        title: "Failed to load features",
        description: e?.message || "Could not load feature configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setRoleDefaultOptimistic = async (
    featureKey: FeatureKey,
    role: RoleKey,
    enabled: boolean,
  ) => {
    const prev = featureState[featureKey]?.roleDefaults?.[role];

    setFeatureState((cur) => {
      const existing = cur[featureKey] ?? {
        key: featureKey,
        globalEnabled: false,
        roleDefaults: {},
        userOverrides: [],
      };

      return {
        ...cur,
        [featureKey]: {
          ...existing,
          roleDefaults: { ...existing.roleDefaults, [role]: enabled },
        },
      };
    });

    try {
      const token = localStorage.getItem("accubooks_token") || "";
      const res = await fetch(
        `${API_BASE_URL}/features/${encodeURIComponent(featureKey)}/assign/role/${role}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ enabled }),
        },
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message || "Update failed");
      }

      invalidateFeatures();
    } catch (e: any) {
      setFeatureState((cur) => {
        const existing = cur[featureKey];
        if (!existing) return cur;
        return {
          ...cur,
          [featureKey]: {
            ...existing,
            roleDefaults: { ...existing.roleDefaults, [role]: prev },
          },
        };
      });

      toast({
        title: "Failed to update role default",
        description: e?.message || "The change was reverted.",
        variant: "destructive",
      });
    }
  };

  const setUserOverrideOptimistic = async (
    featureKey: FeatureKey,
    userId: number,
    enabled: boolean,
  ) => {
    const prev = featureState[featureKey]?.userOverrides?.find(
      (u) => u.userId === userId,
    )?.enabled;

    setFeatureState((cur) => {
      const existing = cur[featureKey] ?? {
        key: featureKey,
        globalEnabled: false,
        roleDefaults: {},
        userOverrides: [],
      };

      const nextOverrides = existing.userOverrides.filter(
        (u) => u.userId !== userId,
      );
      nextOverrides.push({ userId, enabled });

      return {
        ...cur,
        [featureKey]: { ...existing, userOverrides: nextOverrides },
      };
    });

    try {
      const token = localStorage.getItem("accubooks_token") || "";
      const res = await fetch(
        `${API_BASE_URL}/features/${encodeURIComponent(featureKey)}/assign/user/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ enabled }),
        },
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message || "Update failed");
      }

      invalidateFeatures();
    } catch (e: any) {
      setFeatureState((cur) => {
        const existing = cur[featureKey];
        if (!existing) return cur;

        const without = existing.userOverrides.filter(
          (u) => u.userId !== userId,
        );
        if (prev !== undefined) {
          without.push({ userId, enabled: prev });
        }

        return {
          ...cur,
          [featureKey]: { ...existing, userOverrides: without },
        };
      });

      toast({
        title: "Failed to update user override",
        description: e?.message || "The change was reverted.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Feature Management</h1>
        <p className="text-gray-600">
          Admin-only feature toggles per user. Changes are applied immediately.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Target User</CardTitle>
          <CardDescription>
            Select a user and toggle features ON/OFF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User
              </label>
              <select
                value={selectedUserId ?? ""}
                onChange={(e) =>
                  setSelectedUserId(parseInt(e.target.value, 10))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search features..."
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>
            {isLoading ? "Loading..." : `${filteredFeatures.length} feature(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium py-3 pr-4">Name</th>
                  <th className="text-left font-medium py-3 pr-4">
                    Description
                  </th>
                  <th className="text-center font-medium py-3">Global</th>
                  <th className="text-center font-medium py-3">ADMIN</th>
                  <th className="text-center font-medium py-3">MANAGER</th>
                  <th className="text-center font-medium py-3">ACCOUNTANT</th>
                  <th className="text-center font-medium py-3">AUDITOR</th>
                  <th className="text-center font-medium py-3">
                    INVENTORY_MANAGER
                  </th>
                  <th className="text-right font-medium py-3">User Override</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeatures.map((f) => {
                  const state = featureState[f.key];
                  const roleDefaults = state?.roleDefaults || {};
                  const globalEnabled = state?.globalEnabled ?? false;
                  const userEnabled =
                    selectedUserId == null
                      ? false
                      : (state?.userOverrides?.find(
                          (u) => u.userId === selectedUserId,
                        )?.enabled ?? false);
                  return (
                    <tr key={f.key} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 font-medium">{f.label}</td>
                      <td className="py-3 pr-4">
                        <span className="text-gray-600" title={f.description}>
                          {f.description}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <FeatureToggle
                          checked={globalEnabled}
                          disabled
                          aria-label={`${f.label} global state`}
                        />
                      </td>

                      <td className="py-3 text-center">
                        <FeatureToggle
                          checked={Boolean(roleDefaults.ADMIN)}
                          onCheckedChange={(checked) =>
                            void setRoleDefaultOptimistic(
                              f.key,
                              "ADMIN",
                              Boolean(checked),
                            )
                          }
                          aria-label={`Toggle ${f.label} for ADMIN`}
                        />
                      </td>
                      <td className="py-3 text-center">
                        <FeatureToggle
                          checked={Boolean(roleDefaults.MANAGER)}
                          onCheckedChange={(checked) =>
                            void setRoleDefaultOptimistic(
                              f.key,
                              "MANAGER",
                              Boolean(checked),
                            )
                          }
                          aria-label={`Toggle ${f.label} for MANAGER`}
                        />
                      </td>
                      <td className="py-3 text-center">
                        <FeatureToggle
                          checked={Boolean(roleDefaults.ACCOUNTANT)}
                          onCheckedChange={(checked) =>
                            void setRoleDefaultOptimistic(
                              f.key,
                              "ACCOUNTANT",
                              Boolean(checked),
                            )
                          }
                          aria-label={`Toggle ${f.label} for ACCOUNTANT`}
                        />
                      </td>
                      <td className="py-3 text-center">
                        <FeatureToggle
                          checked={Boolean(roleDefaults.AUDITOR)}
                          onCheckedChange={(checked) =>
                            void setRoleDefaultOptimistic(
                              f.key,
                              "AUDITOR",
                              Boolean(checked),
                            )
                          }
                          aria-label={`Toggle ${f.label} for AUDITOR`}
                        />
                      </td>
                      <td className="py-3 text-center">
                        <FeatureToggle
                          checked={Boolean(roleDefaults.INVENTORY_MANAGER)}
                          onCheckedChange={(checked) =>
                            void setRoleDefaultOptimistic(
                              f.key,
                              "INVENTORY_MANAGER",
                              Boolean(checked),
                            )
                          }
                          aria-label={`Toggle ${f.label} for INVENTORY_MANAGER`}
                        />
                      </td>

                      <td className="py-3">
                        <div className="flex justify-end">
                          <FeatureToggle
                            checked={userEnabled}
                            disabled={selectedUserId == null}
                            onCheckedChange={(checked) => {
                              if (selectedUserId == null) return;
                              void setUserOverrideOptimistic(
                                f.key,
                                selectedUserId,
                                Boolean(checked),
                              );
                            }}
                            aria-label={`Override ${f.label} for selected user`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-gray-500">
        <div>
          <strong>Backend:</strong> {API_BASE_URL}/features
        </div>
        <div>
          <strong>Note:</strong> This page is visible only to users with role
          <code className="ml-1">ADMIN</code>.
        </div>
      </div>
    </div>
  );
};

export default FeatureManagementPage;
