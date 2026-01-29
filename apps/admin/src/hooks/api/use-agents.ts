/**
 * Agent API Hooks
 *
 * TanStack Query hooks for agent protocol and execution management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

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
  return useQuery({
    queryKey: agentKeys.protocols(),
    queryFn: async () => {
      const response = await api.get<Array<AgentProtocol>>("/forge/agents/protocols")
      return response
    },
  })
}

/**
 * Get a specific protocol
 */
export function useAgentProtocol(id: string) {
  return useQuery({
    queryKey: agentKeys.protocol(id),
    queryFn: async () => {
      const response = await api.get<AgentProtocol>(`/forge/agents/protocols/${id}`)
      return response
    },
    enabled: !!id,
  })
}

/**
 * Get protocol suggestion for a ticket
 */
export function useSuggestProtocol() {
  return useMutation({
    mutationFn: async (ticket: {
      type: string
      estimate?: number | null
      labels?: Array<string> | null
    }) => {
      const response = await api.post<ProtocolSuggestion>("/forge/agents/suggest", ticket)
      return response
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
  return useQuery({
    queryKey: [...agentKeys.executions(), filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.ticketId) params.set("ticketId", filters.ticketId)
      if (filters?.status) params.set("status", filters.status)
      if (filters?.limit) params.set("limit", filters.limit.toString())

      const response = await api.get<Array<AgentExecution>>(
        `/forge/executions?${params.toString()}`
      )
      return response
    },
  })
}

/**
 * Get a specific execution
 */
export function useExecution(id: string) {
  return useQuery({
    queryKey: agentKeys.execution(id),
    queryFn: async () => {
      const response = await api.get<AgentExecution>(`/forge/executions/${id}`)
      return response
    },
    enabled: !!id,
  })
}

/**
 * Get executions for a ticket
 */
export function useTicketExecutions(ticketId: string) {
  return useQuery({
    queryKey: agentKeys.ticketExecutions(ticketId),
    queryFn: async () => {
      const response = await api.get<Array<AgentExecution>>(
        `/forge/executions?ticketId=${ticketId}`
      )
      return response
    },
    enabled: !!ticketId,
  })
}

/**
 * Create a new execution (assign agent to ticket)
 */
export function useCreateExecution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      ticketId: string
      protocol: string
      prompt: string
    }) => {
      const response = await api.post<AgentExecution>("/forge/executions", data)
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.executions() })
      queryClient.invalidateQueries({
        queryKey: agentKeys.ticketExecutions(variables.ticketId),
      })
      // Also invalidate tickets since agent assignment changes ticket state
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
    },
  })
}

/**
 * Pause an execution
 */
export function usePauseExecution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<AgentExecution>(`/forge/executions/${id}/pause`)
      return response
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<AgentExecution>(`/forge/executions/${id}/resume`)
      return response
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<AgentExecution>(`/forge/executions/${id}/cancel`)
      return response
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.execution(data.id) })
      queryClient.invalidateQueries({ queryKey: agentKeys.executions() })
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
    },
  })
}
