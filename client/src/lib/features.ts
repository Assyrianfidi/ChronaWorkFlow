import { useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : "http://localhost:3001/api/v1");

export type FeatureKey = string;

export type FeatureResolveResponse = {
  success: boolean;
  data: {
    features: Record<string, boolean>;
  };
  message?: string;
};

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("accubooks_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchResolvedFeatures(
  keys: FeatureKey[],
): Promise<Record<string, boolean>> {
  const normalizedKeys = Array.from(
    new Set(keys.map((k) => k.trim()).filter(Boolean)),
  ).sort();

  if (normalizedKeys.length === 0) {
    return {};
  }

  const params = new URLSearchParams({ keys: normalizedKeys.join(",") });
  const res = await fetch(
    `${API_BASE_URL}/features/resolve?${params.toString()}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    },
  );

  const json = (await res.json()) as FeatureResolveResponse;

  if (!res.ok || !json.success) {
    throw new Error(
      json?.message || `Failed to resolve features (${res.status})`,
    );
  }

  return json.data.features || {};
}

export function useFeatureFlags(keys: FeatureKey[]) {
  return useQuery({
    queryKey: ["features", "resolve", ...keys],
    queryFn: () => fetchResolvedFeatures(keys),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useIsFeatureEnabled(feature: FeatureKey) {
  const query = useFeatureFlags([feature]);
  return {
    ...query,
    enabled: query.data ? Boolean(query.data[feature]) : false,
  };
}

export function useInvalidateFeatures() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["features"] });
  };
}
