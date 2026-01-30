/**
 * Agent API Hooks
 *
 * TanStack Query hooks for agent protocol and execution management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useUser } from "@clerk/clerk-react"
import { apiFetch } from "@/lib/api/client"

// =============================================================================
// Types
// =============================================================================

export interface AgentProtocol {
  id: string
  name: string
  description: string
  model: string
  estimatedTokens: { min: number; max: number }
  estimatedCostCents: { min: number; max: number }
  bestFor: Array<string>
  requiresApproval: boolean
}

export interface ProtocolSuggestion {
  protocolId: string
  protocol: AgentProtocol
  reason: string
}

export interface AgentExecution {
  id: string
  ticketId: string
  protocol: string
  status: "pending" | "running" | "completed" | "failed" | "paused"
  prompt: string
  planOutput?: string
  executionLog?: string
  checkpointData?: Record<string, unknown>
  checkpointStep?: number
  branchCreated?: string
  filesChanged?: Array<string>
  prUrl?: string
  tokensUsed?: number
  costCents?: number
  durationMs?: number
  createdAt: string
  startedAt?: string
  completedAt?: string
  ticket?: {
    id: string
    identifier: string
    title: string
  }
}

// =============================================================================
// Query Keys
// =============================================================================

export const agentKeys = {
  all: ["agents"] as const,
  protocols: () => [...agentKeys.all, "protocols"] as const,
  protocol: (id: string) => [...agentKeys.protocols(), id] as const,
  executions: () => [...agentKeys.all, "executions"] as const,
  execution: (id: string) => [...agentKeys.executions(), id] as const,
  ticketExecutions: (ticketId: string) => [...agentKeys.executions(), "ticket", ticketId] as const,
}

// =============================================================================
// Protocol Hooks
// =============================================================================

/**
 * Get all available agent protocols
 */
export function useAgentProtocols() {
  const { user } = useUser()

  return useQuery({
    queryKey: agentKeys.protocols(),
    queryFn: async () => {
      return apiFetch<Array<AgentProtocol>>("/api/forge/agents/protocols", {
        clerkId: user?.id,
      })
    },
    enabled: !!user?.id,
  })
}

/**
 * Get a specific protocol
 */
export function useAgentProtocol(id: string) {
  const { user } = useUser()

  return useQuery({
    queryKey: agentKeys.protocol(id),
    queryFn: async () => {
      return apiFetch<AgentProtocol>(`/api/forge/agents/protocols/${id}`, {
        clerkId: user?.id,
      })
    },
    enabled: !!id && !!user?.id,
  })
}

/**
 * Get protocol suggestion for a ticket
 */
export function useSuggestProtocol() {
  const { user } = useUser()

  return useMutation({
    mutationFn: async (ticket: {
      type: string
      estimate?: number | null
      labels?: Array<string> | null
    }) => {
      return apiFetch<ProtocolSuggestion>("/api/forge/agents/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticket),
        clerkId: user?.id,
      })
    },
  })
}

// =============================================================================
// Execution Hooks
// =============================================================================

/**
 * Get all executions with optional filters
 */
export function useExecutions(filters?: {
  ticketId?: string
  status?: string
  limit?: number
}) {
  const { user } = useUser()

  return useQuery({
    queryKey: [...agentKeys.executions(), filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.ticketId) params.set("ticketId", filters.ticketId)
      if (filters?.status) params.set("status", filters.status)
      if (filters?.limit) params.set("limit", filters.limit.toString())

      return apiFetch<Array<AgentExecution>>(
        `/api/forge/executions?${params.toString()}`,
        { clerkId: user?.id }
      )
    },
    enabled: !!user?.id,
  })
}

/**
 * Get a specific execution
 */
export function useExecution(id: string) {
  const { user } = useUser()

  return useQuery({
    queryKey: agentKeys.execution(id),
    queryFn: async () => {
      return apiFetch<AgentExecution>(`/api/forge/executions/${id}`, {
        clerkId: user?.id,
      })
    },
    enabled: !!id && !!user?.id,
  })
}

/**
 * Get executions for a ticket
 */
export function useTicketExecutions(ticketId: string) {
  const { user } = useUser()

  return useQuery({
    queryKey: agentKeys.ticketExecutions(ticketId),
    queryFn: async () => {
      return apiFetch<Array<AgentExecution>>(
        `/api/forge/executions?ticketId=${ticketId}`,
        { clerkId: user?.id }
      )
    },
    enabled: !!ticketId && !!user?.id,
  })
}

/**
 * Create a new execution (assign agent to ticket)
 */
export function useCreateExecution() {
  const { user } = useUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      ticketId: string
      protocol: string
      prompt: string
    }) => {
      return apiFetch<AgentExecution>("/api/forge/executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        clerkId: user?.id,
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.executions() })
      queryClient.invalidateQueries({
        queryKey: agentKeys.ticketExecutions(variables.ticketId),
      })
      // Also invalidate tickets since agent assignment changes ticket state
      queryClient.invalidateQueries({ queryKey: ["forge", "tickets"] })
    },
  })
}

/**
 * Pause an execution
 */
export function usePauseExecution() {
  const { user } = useUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<AgentExecution>(`/api/forge/executions/${id}/pause`, {
        method: "POST",
        clerkId: user?.id,
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.execution(data.id) })
      queryClient.invalidateQueries({ queryKey: agentKeys.executions() })
    },
  })
}

/**
 * Resume a paused execution
 */
export function useResumeExecution() {
  const { user } = useUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<AgentExecution>(`/api/forge/executions/${id}/resume`, {
        method: "POST",
        clerkId: user?.id,
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.execution(data.id) })
      queryClient.invalidateQueries({ queryKey: agentKeys.executions() })
    },
  })
}

/**
 * Cancel an execution
 */
export function useCancelExecution() {
  const { user } = useUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<AgentExecution>(`/api/forge/executions/${id}/cancel`, {
        method: "POST",
        clerkId: user?.id,
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.execution(data.id) })
      queryClient.invalidateQueries({ queryKey: agentKeys.executions() })
      queryClient.invalidateQueries({ queryKey: ["forge", "tickets"] })
    },
  })
}
