import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { ForgeDecision, ForgeDecisionInsert } from "@axori/db/types";
import { apiFetch } from "@/lib/api/client";

// Query keys for decisions
export const decisionKeys = {
  all: ["forge", "decisions"] as const,
  lists: () => [...decisionKeys.all, "list"] as const,
  list: (filters: DecisionFilters) => [...decisionKeys.lists(), filters] as const,
  details: () => [...decisionKeys.all, "detail"] as const,
  detail: (id: string) => [...decisionKeys.details(), id] as const,
};

export interface DecisionFilters {
  category?: ForgeDecision["category"];
  active?: boolean;
  search?: string;
}

/**
 * Fetch all decisions with optional filters
 */
export function useDecisions(
  filters?: DecisionFilters,
  options?: Omit<UseQueryOptions<Array<ForgeDecision>>, "queryKey" | "queryFn">
) {
  const { user } = useUser();

  return useQuery({
    queryKey: decisionKeys.list(filters ?? {}),
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
      const endpoint = `/api/forge/decisions${queryString ? `?${queryString}` : ""}`;
      return apiFetch<Array<ForgeDecision>>(endpoint, { clerkId: user?.id });
    },
    enabled: !!user?.id,
    ...options,
  });
}

/**
 * Fetch a single decision by ID
 */
export function useDecision(
  id: string,
  options?: Omit<UseQueryOptions<ForgeDecision>, "queryKey" | "queryFn">
) {
  const { user } = useUser();

  return useQuery({
    queryKey: decisionKeys.detail(id),
    queryFn: async () => {
      return apiFetch<ForgeDecision>(`/api/forge/decisions/${id}`, {
        clerkId: user?.id,
      });
    },
    enabled: !!user?.id && !!id,
    ...options,
  });
}

/**
 * Create a new decision
 */
export function useCreateDecision() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (data: Omit<ForgeDecisionInsert, "id" | "identifier">) => {
      return apiFetch<ForgeDecision>("/api/forge/decisions", {
        method: "POST",
        body: JSON.stringify(data),
        clerkId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: decisionKeys.lists() });
    },
  });
}

/**
 * Update a decision
 */
export function useUpdateDecision() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<ForgeDecision> & { id: string }) => {
      return apiFetch<ForgeDecision>(`/api/forge/decisions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        clerkId: user?.id,
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: decisionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: decisionKeys.lists() });
    },
  });
}

/**
 * Toggle decision active status
 */
export function useToggleDecision() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<ForgeDecision>(`/api/forge/decisions/${id}/toggle`, {
        method: "PATCH",
        clerkId: user?.id,
      });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: decisionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: decisionKeys.lists() });
    },
  });
}

/**
 * Delete a decision
 */
export function useDeleteDecision() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<{ success: boolean }>(`/api/forge/decisions/${id}`, {
        method: "DELETE",
        clerkId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: decisionKeys.lists() });
    },
  });
}
