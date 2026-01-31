import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { ForgeRegistry, ForgeRegistryInsert } from "@axori/db/types";
import { apiFetch } from "@/lib/api/client";

// Query keys for registry
export const registryKeys = {
  all: ["forge", "registry"] as const,
  lists: () => [...registryKeys.all, "list"] as const,
  list: (filters: RegistryFilters) => [...registryKeys.lists(), filters] as const,
  details: () => [...registryKeys.all, "detail"] as const,
  detail: (id: string) => [...registryKeys.details(), id] as const,
};

export interface RegistryFilters {
  type?: ForgeRegistry["type"];
  status?: ForgeRegistry["status"];
  search?: string;
}

export interface ScanRegistryRequest {
  scanType?: "full" | "ui" | "hooks" | "utilities" | "custom";
  customPath?: string;
  dryRun?: boolean;
}

export interface ScanRegistryResponse {
  success?: boolean;
  dryRun?: boolean;
  scanType?: string;
  itemsFound: number;
  items?: Array<{
    type: string;
    name: string;
    filePath: string;
    description?: string;
    exports?: Array<string>;
    dependencies?: Array<string>;
  }>;
  created?: number;
  updated?: number;
  errors?: Array<{ name: string; error: string }>;
}

/**
 * Fetch all registry items with optional filters
 */
export function useRegistry(
  filters?: RegistryFilters,
  options?: Omit<UseQueryOptions<Array<ForgeRegistry>>, "queryKey" | "queryFn">
) {
  const { user } = useUser();

  return useQuery({
    queryKey: registryKeys.list(filters ?? {}),
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
      const endpoint = `/api/forge/registry${queryString ? `?${queryString}` : ""}`;
      return apiFetch<Array<ForgeRegistry>>(endpoint, { clerkId: user?.id });
    },
    enabled: !!user?.id,
    ...options,
  });
}

/**
 * Fetch a single registry item by ID
 */
export function useRegistryItem(
  id: string,
  options?: Omit<UseQueryOptions<ForgeRegistry>, "queryKey" | "queryFn">
) {
  const { user } = useUser();

  return useQuery({
    queryKey: registryKeys.detail(id),
    queryFn: async () => {
      return apiFetch<ForgeRegistry>(`/api/forge/registry/${id}`, {
        clerkId: user?.id,
      });
    },
    enabled: !!user?.id && !!id,
    ...options,
  });
}

/**
 * Create a new registry item
 */
export function useCreateRegistryItem() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (data: Omit<ForgeRegistryInsert, "id">) => {
      return apiFetch<ForgeRegistry>("/api/forge/registry", {
        method: "POST",
        body: JSON.stringify(data),
        clerkId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: registryKeys.lists() });
    },
  });
}

/**
 * Update a registry item
 */
export function useUpdateRegistryItem() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<ForgeRegistry> & { id: string }) => {
      return apiFetch<ForgeRegistry>(`/api/forge/registry/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        clerkId: user?.id,
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: registryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: registryKeys.lists() });
    },
  });
}

/**
 * Delete a registry item
 */
export function useDeleteRegistryItem() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<{ success: boolean }>(`/api/forge/registry/${id}`, {
        method: "DELETE",
        clerkId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: registryKeys.lists() });
    },
  });
}

/**
 * Trigger a registry scan to discover codebase items
 */
export function useScanRegistry() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (request: ScanRegistryRequest = {}) => {
      return apiFetch<ScanRegistryResponse>("/api/forge/registry/scan", {
        method: "POST",
        body: JSON.stringify(request),
        clerkId: user?.id,
      });
    },
    onSuccess: (data) => {
      // Only invalidate if not a dry run (actual changes were made)
      if (!data.dryRun) {
        queryClient.invalidateQueries({ queryKey: registryKeys.lists() });
      }
    },
  });
}
