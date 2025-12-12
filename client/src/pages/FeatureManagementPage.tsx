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
import { useAuth } from "../contexts/AuthContext";

type FeatureKey =
  | "DASHBOARD"
  | "INVOICES"
  | "REPORTS"
  | "CUSTOMERS"
  | "EXPORT_TOOLS"
  | "TRANSACTIONS"
  | "SETTINGS";

type RoleKey = "ADMIN" | "MANAGER" | "USER" | "AUDITOR" | "INVENTORY_MANAGER";

type FeatureCatalogItem = {
  name: FeatureKey;
  label: string;
  description: string;
};

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
};

type Assignments = Record<string, Record<FeatureKey, boolean>>;

type FeaturesResponse = {
  success: boolean;
  data: {
    features: FeatureCatalogItem[];
    users: UserItem[];
    assignments: Assignments;
  };
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

const FeatureManagementPage: React.FC = () => {
  const { toast } = useToast();
  const auth = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [features, setFeatures] = useState<FeatureCatalogItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({});

  const [selectedUserId, setSelectedUserId] = useState<string>("1");
  const [query, setQuery] = useState<string>("");

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId),
    [users, selectedUserId],
  );

  const filteredFeatures = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return features;
    return features.filter((f) => {
      return (
        f.label.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
      );
    });
  }, [features, query]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accubooks_token") || "";
      const res = await fetch(`${API_BASE}/api/admin/features`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-User-Role": auth.user?.role || "",
        },
      });

      const json = (await res.json()) as FeaturesResponse;

      if (!res.ok || !json.success) {
        throw new Error(json as any);
      }

      setFeatures(json.data.features);
      setUsers(json.data.users);
      setAssignments(json.data.assignments);

      if (json.data.users.length > 0) {
        setSelectedUserId((prev) => prev || json.data.users[0].id);
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

  const setFeatureEnabledOptimistic = async (featureName: FeatureKey, enabled: boolean) => {
    if (!selectedUserId) return;

    const prevAssignments = assignments[selectedUserId] || ({} as Record<FeatureKey, boolean>);
    const prevValue = prevAssignments[featureName];

    // optimistic update
    setAssignments((cur) => ({
      ...cur,
      [selectedUserId]: {
        ...((cur[selectedUserId] || {}) as Record<FeatureKey, boolean>),
        [featureName]: enabled,
      },
    }));

    try {
      const token = localStorage.getItem("accubooks_token") || "";
      const res = await fetch(`${API_BASE}/api/admin/features/${selectedUserId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-User-Role": auth.user?.role || "",
        },
        body: JSON.stringify({ overrides: { [featureName]: enabled } }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message || "Update failed");
      }

      toast({
        title: "Feature updated",
        description: `${selectedUser?.name || "User"}: ${featureName} is now ${enabled ? "ON" : "OFF"}.`,
      });
    } catch (e: any) {
      // revert
      setAssignments((cur) => ({
        ...cur,
        [selectedUserId]: {
          ...((cur[selectedUserId] || {}) as Record<FeatureKey, boolean>),
          [featureName]: prevValue ?? true,
        },
      }));

      toast({
        title: "Failed to update feature",
        description: e?.message || "The change was reverted.",
        variant: "destructive",
      });
    }
  };

  const currentAssignments = assignments[selectedUserId] || ({} as Record<FeatureKey, boolean>);

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
          <CardDescription>Select a user and toggle features ON/OFF.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
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
                  <th className="text-left font-medium py-3 pr-4">Description</th>
                  <th className="text-right font-medium py-3">Enabled</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeatures.map((f) => {
                  const enabled = currentAssignments[f.name] ?? true;
                  return (
                    <tr key={f.name} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 font-medium">{f.label}</td>
                      <td className="py-3 pr-4">
                        <span className="text-gray-600" title={f.description}>
                          {f.description}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end">
                          <FeatureToggle
                            checked={enabled}
                            onCheckedChange={(checked) =>
                              setFeatureEnabledOptimistic(
                                f.name,
                                Boolean(checked),
                              )
                            }
                            aria-label={`Toggle ${f.label}`}
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
          <strong>Backend:</strong> {API_BASE}/api/admin/features
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
