import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { ForgeMilestone, ForgeMilestoneInsert } from "@axori/db/types";
import { apiFetch } from "@/lib/api/client";

// Query keys for milestones
export const milestoneKeys = {
  all: ["forge", "milestones"] as const,
  lists: () => [...milestoneKeys.all, "list"] as const,
  details: () => [...milestoneKeys.all, "detail"] as const,
  detail: (id: string) => [...milestoneKeys.details(), id] as const,
  active: () => [...milestoneKeys.all, "active"] as const,
};

/**
 * Fetch all milestones (releases)
 */
export function useMilestones(
  options?: Omit<UseQueryOptions<Array<ForgeMilestone>>, "queryKey" | "queryFn">
) {
  const { user } = useUser();

  return useQuery({
    queryKey: milestoneKeys.lists(),
    queryFn: async () =>
      apiFetch<Array<ForgeMilestone>>("/api/forge/milestones", {
        clerkId: user?.id,
      }),
    enabled: !!user?.id,
    ...options,
  });
}

/**
 * Fetch a single milestone by ID
 */
export function useMilestone(
  id: string,
  options?: Omit<UseQueryOptions<ForgeMilestone>, "queryKey" | "queryFn">
) {
  const { user } = useUser();

  return useQuery({
    queryKey: milestoneKeys.detail(id),
    queryFn: async () =>
      apiFetch<ForgeMilestone>(`/api/forge/milestones/${id}`, {
        clerkId: user?.id,
      }),
    enabled: !!user?.id && !!id,
    ...options,
  });
}

/**
 * Create a new milestone (release)
 */
export function useCreateMilestone() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (data: Omit<ForgeMilestoneInsert, "id">) =>
      apiFetch<ForgeMilestone>("/api/forge/milestones", {
        method: "POST",
        body: JSON.stringify(data),
        clerkId: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.lists() });
    },
  });
}

/**
 * Update a milestone (release)
 */
export function useUpdateMilestone() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ForgeMilestone> & { id: string }) =>
      apiFetch<ForgeMilestone>(`/api/forge/milestones/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        clerkId: user?.id,
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: milestoneKeys.lists() });
      queryClient.invalidateQueries({ queryKey: milestoneKeys.active() });
    },
  });
}

/**
 * Delete a milestone (release)
 */
export function useDeleteMilestone() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (id: string) =>
      apiFetch<{ success: boolean }>(`/api/forge/milestones/${id}`, {
        method: "DELETE",
        clerkId: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.lists() });
      queryClient.invalidateQueries({ queryKey: milestoneKeys.active() });
    },
  });
}

export interface ActiveReleaseStats {
  totalEpics: number;
  totalTickets: number;
  doneTickets: number;
  blockedTickets: number;
  progress: number;
}

export interface ActiveReleaseProject {
  id: string;
  name: string;
  tickets: Array<{ id: string; status: string }>;
}

export type ActiveRelease = ForgeMilestone & {
  stats: ActiveReleaseStats;
  projects: Array<ActiveReleaseProject>;
};

/**
 * Fetch the currently active release with stats and projects
 */
export function useActiveRelease() {
  const { user } = useUser();

  return useQuery({
    queryKey: milestoneKeys.active(),
    queryFn: async () =>
      apiFetch<ActiveRelease | null>("/api/forge/milestones/active", {
        clerkId: user?.id,
      }),
    enabled: !!user?.id,
  });
}

/**
 * Activate a release milestone
 */
export function useActivateRelease() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (id: string) =>
      apiFetch<ForgeMilestone>(`/api/forge/milestones/${id}/activate`, {
        method: "PUT",
        clerkId: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.all });
    },
  });
}
