import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import type { ForgeMilestone } from "@axori/db/types";
import { apiFetch } from "@/lib/api/client";

// Query keys for milestones
export const milestoneKeys = {
  all: ["forge", "milestones"] as const,
  lists: () => [...milestoneKeys.all, "list"] as const,
  details: () => [...milestoneKeys.all, "detail"] as const,
  detail: (id: string) => [...milestoneKeys.details(), id] as const,
  active: () => [...milestoneKeys.all, "active"] as const,
};

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
