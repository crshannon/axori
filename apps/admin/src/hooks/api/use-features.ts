import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { foundryKeys } from "./use-foundries";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { ForgeFeature, ForgeFeatureInsert } from "@axori/db/types";
import { apiFetch } from "@/lib/api/client";

// Query keys for features
export const featureKeys = {
  all: ["forge", "features"] as const,
  lists: () => [...featureKeys.all, "list"] as const,
  list: (filters: FeatureFilters) => [...featureKeys.lists(), filters] as const,
  details: () => [...featureKeys.all, "detail"] as const,
  detail: (id: string) => [...featureKeys.details(), id] as const,
};

export interface FeatureFilters {
  foundryId?: string;
  status?: string;
  search?: string;
}

/**
 * Fetch all features with optional filters
 */
export function useFeatures(
  filters?: FeatureFilters,
  options?: Omit<UseQueryOptions<Array<ForgeFeature>>, "queryKey" | "queryFn">
) {
  const { user } = useUser();

  return useQuery({
    queryKey: featureKeys.list(filters ?? {}),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, String(value));
          }
        });
      }
      const queryString = params.toString();
      const endpoint = `/api/forge/features${queryString ? `?${queryString}` : ""}`;
      return apiFetch<Array<ForgeFeature>>(endpoint, { clerkId: user?.id });
    },
    enabled: !!user?.id,
    ...options,
  });
}

/**
 * Fetch a single feature by ID
 */
export function useFeature(
  id: string,
  options?: Omit<UseQueryOptions<ForgeFeature>, "queryKey" | "queryFn">
) {
  const { user } = useUser();

  return useQuery({
    queryKey: featureKeys.detail(id),
    queryFn: async () => {
      return apiFetch<ForgeFeature>(`/api/forge/features/${id}`, {
        clerkId: user?.id,
      });
    },
    enabled: !!user?.id && !!id,
    ...options,
  });
}

/**
 * Create a new feature
 */
export function useCreateFeature() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (data: Omit<ForgeFeatureInsert, "id">) => {
      return apiFetch<ForgeFeature>("/api/forge/features", {
        method: "POST",
        body: JSON.stringify(data),
        clerkId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: featureKeys.lists() });
      queryClient.invalidateQueries({ queryKey: foundryKeys.lists() });
    },
  });
}

/**
 * Update a feature
 */
export function useUpdateFeature() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<ForgeFeature> & { id: string }) => {
      return apiFetch<ForgeFeature>(`/api/forge/features/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        clerkId: user?.id,
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: featureKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: featureKeys.lists() });
      queryClient.invalidateQueries({ queryKey: foundryKeys.lists() });
    },
  });
}

/**
 * Delete a feature
 */
export function useDeleteFeature() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<{ success: boolean }>(`/api/forge/features/${id}`, {
        method: "DELETE",
        clerkId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: featureKeys.lists() });
      queryClient.invalidateQueries({ queryKey: foundryKeys.lists() });
    },
  });
}
