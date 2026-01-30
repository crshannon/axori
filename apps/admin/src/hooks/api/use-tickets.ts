import {
  
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import type {UseQueryOptions} from "@tanstack/react-query";
import type { ForgeTicket, ForgeTicketInsert } from "@axori/db/types";
import { apiFetch } from "@/lib/api/client";

// Query keys for tickets
export const ticketKeys = {
  all: ["forge", "tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  list: (filters: TicketFilters) => [...ticketKeys.lists(), filters] as const,
  details: () => [...ticketKeys.all, "detail"] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
};

export interface TicketFilters {
  status?: ForgeTicket["status"];
  priority?: ForgeTicket["priority"];
  type?: ForgeTicket["type"];
  milestoneId?: string;
  projectId?: string;
  search?: string;
}

/**
 * Fetch all tickets with optional filters
 */
export function useTickets(
  filters?: TicketFilters,
  options?: Omit<UseQueryOptions<Array<ForgeTicket>>, "queryKey" | "queryFn">
) {
  const { user } = useUser();

  return useQuery({
    queryKey: ticketKeys.list(filters ?? {}),
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
      const endpoint = `/forge/tickets${queryString ? `?${queryString}` : ""}`;
      return apiFetch<Array<ForgeTicket>>(endpoint, { clerkId: user?.id });
    },
    enabled: !!user?.id,
    ...options,
  });
}

/**
 * Fetch a single ticket by ID
 */
export function useTicket(
  id: string,
  options?: Omit<UseQueryOptions<ForgeTicket>, "queryKey" | "queryFn">
) {
  const { user } = useUser();

  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: async () => {
      return apiFetch<ForgeTicket>(`/forge/tickets/${id}`, {
        clerkId: user?.id,
      });
    },
    enabled: !!user?.id && !!id,
    ...options,
  });
}

/**
 * Create a new ticket
 */
export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (data: Omit<ForgeTicketInsert, "id" | "identifier">) => {
      return apiFetch<ForgeTicket>("/forge/tickets", {
        method: "POST",
        body: JSON.stringify(data),
        clerkId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

/**
 * Update a ticket
 */
export function useUpdateTicket() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<ForgeTicket> & { id: string }) => {
      return apiFetch<ForgeTicket>(`/forge/tickets/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        clerkId: user?.id,
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

/**
 * Update ticket status (optimistic update for drag-drop)
 */
export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      statusOrder,
    }: {
      id: string;
      status: ForgeTicket["status"];
      statusOrder?: number;
    }) => {
      return apiFetch<ForgeTicket>(`/forge/tickets/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, statusOrder }),
        clerkId: user?.id,
      });
    },
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ticketKeys.lists() });

      // Snapshot previous value
      const previousTickets = queryClient.getQueryData<Array<ForgeTicket>>(
        ticketKeys.lists()
      );

      // Optimistically update
      queryClient.setQueryData<Array<ForgeTicket>>(ticketKeys.lists(), (old) =>
        old?.map((t) => (t.id === id ? { ...t, status } : t))
      );

      return { previousTickets };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousTickets) {
        queryClient.setQueryData(ticketKeys.lists(), context.previousTickets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

/**
 * Delete a ticket
 */
export function useDeleteTicket() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<{ success: boolean }>(`/forge/tickets/${id}`, {
        method: "DELETE",
        clerkId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

/**
 * Assign an agent to a ticket
 */
export function useAssignAgent() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      ticketId,
      protocol,
      additionalContext,
    }: {
      ticketId: string;
      protocol: ForgeTicket["assignedAgent"];
      additionalContext?: string;
    }) => {
      return apiFetch<ForgeTicket>(`/forge/tickets/${ticketId}/assign-agent`, {
        method: "POST",
        body: JSON.stringify({ protocol, additionalContext }),
        clerkId: user?.id,
      });
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}
