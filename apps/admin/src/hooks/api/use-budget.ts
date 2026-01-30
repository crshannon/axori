/**
 * Budget API Hooks
 *
 * TanStack Query hooks for token budget management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

// =============================================================================
// Types
// =============================================================================

export interface TodayBudget {
  id: string
  date: string
  dailyLimitTokens: number | null
  dailyLimitCents: number | null
  usedTokens: number | null
  usedCents: number | null
  autopilotEnabled: boolean | null
  autopilotMaxTokensPerTask: number | null
  autopilotUsedTokens: number | null
  tokenPercentUsed: number
  costPercentUsed: number
  remainingTokens: number
  remainingCents: number
}

export interface BudgetHistory {
  history: Array<{
    id: string
    date: string
    dailyLimitTokens: number | null
    dailyLimitCents: number | null
    usedTokens: number | null
    usedCents: number | null
    autopilotUsedTokens: number | null
  }>
  totals: {
    totalTokens: number
    totalCents: number
    totalAutopilotTokens: number
  }
  averageDaily: {
    tokens: number
    cents: number
  }
}

export interface TokenUsage {
  byModel: Array<{
    model: string
    totalInput: number
    totalOutput: number
    totalCost: number
    count: number
  }>
  byProtocol: Array<{
    protocol: string
    totalTokens: number
    totalCost: number
    count: number
    avgDuration: number
  }>
  daily: Array<{
    date: string
    totalTokens: number
    totalCost: number
  }>
  period: {
    days: number
    startDate: string
  }
}

export interface BudgetStats {
  today: {
    usedTokens: number
    usedCents: number
    limitTokens: number
    limitCents: number
    percentUsed: number
  }
  thisMonth: {
    totalTokens: number
    totalCents: number
    daysActive: number
    totalDollars: string
  }
  executions: {
    total: number
    completed: number
    failed: number
    successRate: number
    avgTokens: number
    avgCostCents: number
    avgDurationMs: number
  }
}

export interface RecentUsageEntry {
  id: string
  executionId: string
  model: string
  inputTokens: number
  outputTokens: number
  costCents: number
  createdAt: string
  execution?: {
    id: string
    protocol: string
    status: string
  }
}

// =============================================================================
// Query Keys
// =============================================================================

export const budgetKeys = {
  all: ["budget"] as const,
  today: () => [...budgetKeys.all, "today"] as const,
  history: (days: number) => [...budgetKeys.all, "history", days] as const,
  usage: (days: number) => [...budgetKeys.all, "usage", days] as const,
  recent: (limit: number) => [...budgetKeys.all, "recent", limit] as const,
  stats: () => [...budgetKeys.all, "stats"] as const,
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Get today's budget status
 */
export function useTodayBudget() {
  return useQuery({
    queryKey: budgetKeys.today(),
    queryFn: async () => {
      return api.get<TodayBudget>("/api/forge/budget/today")
    },
    refetchInterval: 60000, // Refetch every minute
  })
}

/**
 * Get budget history
 */
export function useBudgetHistory(days = 30) {
  return useQuery({
    queryKey: budgetKeys.history(days),
    queryFn: async () => {
      return api.get<BudgetHistory>(`/api/forge/budget/history?days=${days}`)
    },
  })
}

/**
 * Get token usage breakdown
 */
export function useTokenUsage(days = 7) {
  return useQuery({
    queryKey: budgetKeys.usage(days),
    queryFn: async () => {
      return api.get<TokenUsage>(`/api/forge/budget/usage?days=${days}`)
    },
  })
}

/**
 * Get recent usage entries
 */
export function useRecentUsage(limit = 50) {
  return useQuery({
    queryKey: budgetKeys.recent(limit),
    queryFn: async () => {
      return api.get<Array<RecentUsageEntry>>(`/api/forge/budget/recent?limit=${limit}`)
    },
  })
}

/**
 * Get budget stats
 */
export function useBudgetStats() {
  return useQuery({
    queryKey: budgetKeys.stats(),
    queryFn: async () => {
      return api.get<BudgetStats>("/api/forge/budget/stats")
    },
    refetchInterval: 60000, // Refetch every minute
  })
}

/**
 * Update today's budget limits
 */
export function useUpdateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      dailyLimitTokens?: number
      dailyLimitCents?: number
      autopilotEnabled?: boolean
      autopilotMaxTokensPerTask?: number
    }) => {
      return api.put<TodayBudget>("/api/forge/budget/today", data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.today() })
      queryClient.invalidateQueries({ queryKey: budgetKeys.stats() })
    },
  })
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format tokens for display
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`
  }
  return tokens.toString()
}

/**
 * Format cents as dollars
 */
export function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Format duration in ms
 */
export function formatDuration(ms: number): string {
  if (ms >= 60000) {
    return `${(ms / 60000).toFixed(1)}m`
  }
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  return `${ms}ms`
}

/**
 * Get status color based on percentage used
 */
export function getBudgetStatusColor(percentUsed: number): string {
  if (percentUsed >= 90) return "text-red-400"
  if (percentUsed >= 75) return "text-amber-400"
  if (percentUsed >= 50) return "text-yellow-400"
  return "text-emerald-400"
}

/**
 * Get progress bar color based on percentage used
 */
export function getBudgetProgressColor(percentUsed: number): string {
  if (percentUsed >= 90) return "bg-red-500"
  if (percentUsed >= 75) return "bg-amber-500"
  if (percentUsed >= 50) return "bg-yellow-500"
  return "bg-emerald-500"
}
