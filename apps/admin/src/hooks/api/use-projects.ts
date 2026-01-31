import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { featureKeys } from "./use-features";
import { milestoneKeys } from "./use-milestones";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { ForgeFeature, ForgeMilestone, ForgeProject, ForgeProjectInsert } from "@axori/db/types";
import { apiFetch } from "@/lib/api/client";

// Query keys for projects (epics)
export const projectKeys = {
  all: ["forge", "projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: ProjectFilters) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

export interface ProjectFilters {
  milestoneId?: string;
  featureId?: string;
}

export type ProjectWithRelations = ForgeProject & {
  milestone: ForgeMilestone | null;
  feature: ForgeFeature | null;
  ticketCount: number;
};

/**
 * Fetch all projects (epics) with optional filters
 */
export function useProjects(
  filters?: ProjectFilters,
  options?: Omit<UseQueryOptions<Array<ProjectWithRelations>>, "queryKey" | "queryFn">
) {
  const { user } = useUser();

  return useQuery({
    queryKey: projectKeys.list(filters ?? {}),
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
      const endpoint = `/api/forge/projects${queryString ? `?${queryString}` : ""}`;
      return apiFetch<Array<ProjectWithRelations>>(endpoint, { clerkId: user?.id });
    },
    enabled: !!user?.id,
    ...options,
  });
}

/**
 * Fetch a single project by ID
 */
export function useProject(
  id: string,
  options?: Omit<UseQueryOptions<ProjectWithRelations>, "queryKey" | "queryFn">
) {
  const { user } = useUser();

  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      return apiFetch<ProjectWithRelations>(`/api/forge/projects/${id}`, {
        clerkId: user?.id,
      });
    },
    enabled: !!user?.id && !!id,
    ...options,
  });
}

/**
 * Create a new project (epic)
 */
export function useCreateProject() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (data: Omit<ForgeProjectInsert, "id">) => {
      return apiFetch<ForgeProject>("/api/forge/projects", {
        method: "POST",
        body: JSON.stringify(data),
        clerkId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: milestoneKeys.lists() });
      queryClient.invalidateQueries({ queryKey: featureKeys.lists() });
    },
  });
}

/**
 * Update a project (epic)
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<ForgeProject> & { id: string }) => {
      return apiFetch<ForgeProject>(`/api/forge/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        clerkId: user?.id,
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: milestoneKeys.lists() });
      queryClient.invalidateQueries({ queryKey: featureKeys.lists() });
    },
  });
}

/**
 * Delete a project (epic)
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<{ success: boolean }>(`/api/forge/projects/${id}`, {
        method: "DELETE",
        clerkId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: milestoneKeys.lists() });
      queryClient.invalidateQueries({ queryKey: featureKeys.lists() });
    },
  });
}
