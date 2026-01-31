import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { ForgeFoundry, ForgeFoundryInsert } from "@axori/db/types";
import { apiFetch } from "@/lib/api/client";

// Query keys for foundries
export const foundryKeys = {
  all: ["forge", "foundries"] as const,
  lists: () => [...foundryKeys.all, "list"] as const,
  list: () => [...foundryKeys.lists()] as const,
  details: () => [...foundryKeys.all, "detail"] as const,
  detail: (id: string) => [...foundryKeys.details(), id] as const,
};

/**
 * Fetch all foundries
 */
export function useFoundries(
  options?: Omit<UseQueryOptions<Array<ForgeFoundry>>, "queryKey" | "queryFn">
) {
  const { user } = useUser();

  return useQuery({
    queryKey: foundryKeys.list(),
    queryFn: async () => {
      return apiFetch<Array<ForgeFoundry>>("/api/forge/foundries", {
        clerkId: user?.id,
      });
    },
    enabled: !!user?.id,
    ...options,
  });
}

/**
 * Fetch a single foundry by ID
 */
export function useFoundry(
  id: string,
  options?: Omit<UseQueryOptions<ForgeFoundry>, "queryKey" | "queryFn">
) {
  const { user } = useUser();

  return useQuery({
    queryKey: foundryKeys.detail(id),
    queryFn: async () => {
      return apiFetch<ForgeFoundry>(`/api/forge/foundries/${id}`, {
        clerkId: user?.id,
      });
    },
    enabled: !!user?.id && !!id,
    ...options,
  });
}

/**
 * Create a new foundry
 */
export function useCreateFoundry() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (data: Omit<ForgeFoundryInsert, "id">) => {
      return apiFetch<ForgeFoundry>("/api/forge/foundries", {
        method: "POST",
        body: JSON.stringify(data),
        clerkId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foundryKeys.lists() });
    },
  });
}

/**
 * Update a foundry
 */
export function useUpdateFoundry() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<ForgeFoundry> & { id: string }) => {
      return apiFetch<ForgeFoundry>(`/api/forge/foundries/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        clerkId: user?.id,
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: foundryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: foundryKeys.lists() });
    },
  });
}

/**
 * Delete a foundry
 */
export function useDeleteFoundry() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<{ success: boolean }>(`/api/forge/foundries/${id}`, {
        method: "DELETE",
        clerkId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foundryKeys.lists() });
    },
  });
}
