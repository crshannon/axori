import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import type {
  PropertyTransaction,
  PropertyTransactionInsertApi,
  PropertyTransactionUpdateApi,
} from '@axori/shared'
import { apiFetch } from '@/lib/api/client'

interface TransactionFilters {
  startDate?: string
  endDate?: string
  type?: 'income' | 'expense' | 'capital'
  category?: string
  reviewStatus?: 'pending' | 'approved' | 'flagged' | 'excluded'
  page?: number
  pageSize?: number
}

interface TransactionsResponse {
  transactions: Array<PropertyTransaction>
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

/**
 * Get transactions for a property
 */
export function usePropertyTransactions(
  propertyId: string | null | undefined,
  filters?: TransactionFilters,
) {
  const { user } = useUser()

  return useQuery({
    queryKey: ['properties', propertyId, 'transactions', filters],
    queryFn: async () => {
      if (!user?.id || !propertyId) {
        throw new Error('User not authenticated or property ID missing')
      }

      const params = new URLSearchParams()
      if (filters?.startDate) params.append('startDate', filters.startDate)
      if (filters?.endDate) params.append('endDate', filters.endDate)
      if (filters?.type) params.append('type', filters.type)
      if (filters?.category) params.append('category', filters.category)
      if (filters?.reviewStatus)
        params.append('reviewStatus', filters.reviewStatus)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.pageSize)
        params.append('pageSize', filters.pageSize.toString())

      const queryString = params.toString()
      const url = `/api/properties/${propertyId}/transactions${queryString ? `?${queryString}` : ''}`

      const result = await apiFetch<TransactionsResponse>(url, {
        clerkId: user.id,
      })

      return result
    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Get a single transaction by ID
 */
export function usePropertyTransaction(
  propertyId: string | null | undefined,
  transactionId: string | null | undefined,
) {
  const { user } = useUser()

  return useQuery({
    queryKey: ['properties', propertyId, 'transactions', transactionId],
    queryFn: async () => {
      if (!user?.id || !propertyId || !transactionId) {
        throw new Error('User not authenticated or IDs missing')
      }

      const result = await apiFetch<{ transaction: PropertyTransaction }>(
        `/api/properties/${propertyId}/transactions/${transactionId}`,
        {
          clerkId: user.id,
        },
      )

      return result.transaction
    },
    enabled: !!user?.id && !!propertyId && !!transactionId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Create a transaction for a property
 * Uses PropertyTransactionInsertApi type from enhanced Zod schema for type safety
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      propertyId,
      ...transactionData
    }: Omit<PropertyTransactionInsertApi, 'propertyId'> & {
      propertyId: string
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ transaction: PropertyTransaction }>(
        `/api/properties/${propertyId}/transactions`,
        {
          method: 'POST',
          clerkId: user.id,
          body: JSON.stringify(transactionData),
        },
      )
    },
    onSuccess: (_data, variables) => {
      // Invalidate transaction queries
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId, 'transactions'],
      })
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId],
      })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

/**
 * Update an existing transaction
 * Uses PropertyTransactionUpdateApi type from enhanced Zod schema for type safety
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      propertyId,
      transactionId,
      ...transactionData
    }: PropertyTransactionUpdateApi & {
      propertyId: string
      transactionId: string
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ transaction: PropertyTransaction }>(
        `/api/properties/${propertyId}/transactions/${transactionId}`,
        {
          method: 'PUT',
          clerkId: user.id,
          body: JSON.stringify(transactionData),
        },
      )
    },
    onSuccess: (_data, variables) => {
      // Invalidate transaction queries
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId, 'transactions'],
      })
      queryClient.invalidateQueries({
        queryKey: [
          'properties',
          variables.propertyId,
          'transactions',
          variables.transactionId,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId],
      })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

/**
 * Delete a transaction
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      propertyId,
      transactionId,
    }: {
      propertyId: string
      transactionId: string
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ message: string }>(
        `/api/properties/${propertyId}/transactions/${transactionId}`,
        {
          method: 'DELETE',
          clerkId: user.id,
        },
      )
    },
    onSuccess: (_data, variables) => {
      // Invalidate transaction queries
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId, 'transactions'],
      })
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId],
      })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}
