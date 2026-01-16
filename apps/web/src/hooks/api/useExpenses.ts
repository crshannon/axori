import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import type { 
  PropertyExpense, 
  PropertyExpenseInsert,
  PropertyExpenseInsertApi,
  PropertyExpenseUpdateApi 
} from '@axori/shared'
import { apiFetch } from '@/lib/api/client'

/**
 * Get expenses for a property
 */
export function usePropertyExpenses(
  propertyId: string | null | undefined,
  options?: {
    startDate?: string
    endDate?: string
    category?: string
    isTaxDeductible?: boolean
  }
) {
  const { user } = useUser()

  return useQuery({
    queryKey: ['properties', propertyId, 'expenses', options],
    queryFn: async () => {
      if (!user?.id || !propertyId) {
        throw new Error('User not authenticated or property ID missing')
      }

      const params = new URLSearchParams()
      if (options?.startDate) params.append('startDate', options.startDate)
      if (options?.endDate) params.append('endDate', options.endDate)
      if (options?.category) params.append('category', options.category)
      if (options?.isTaxDeductible !== undefined) {
        params.append('isTaxDeductible', options.isTaxDeductible.toString())
      }

      const queryString = params.toString()
      const url = `/api/properties/${propertyId}/expenses${queryString ? `?${queryString}` : ''}`

      const result = await apiFetch<{ expenses: Array<PropertyExpense> }>(url, {
        clerkId: user.id,
      })

      return result.expenses
    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Get a single expense by ID
 */
export function usePropertyExpense(
  propertyId: string | null | undefined,
  expenseId: string | null | undefined
) {
  const { user } = useUser()

  return useQuery({
    queryKey: ['properties', propertyId, 'expenses', expenseId],
    queryFn: async () => {
      if (!user?.id || !propertyId || !expenseId) {
        throw new Error('User not authenticated or IDs missing')
      }

      const result = await apiFetch<{ expense: PropertyExpense }>(
        `/api/properties/${propertyId}/expenses/${expenseId}`,
        {
          clerkId: user.id,
        }
      )

      return result.expense
    },
    enabled: !!user?.id && !!propertyId && !!expenseId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Create an expense for a property
 * Uses PropertyExpenseInsertApi type from enhanced Zod schema for type safety
 */
export function useCreateExpense() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      propertyId,
      ...expenseData
    }: Omit<PropertyExpenseInsertApi, 'propertyId'> & {
      propertyId: string
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ expense: PropertyExpense }>(
        `/api/properties/${propertyId}/expenses`,
        {
          method: 'POST',
          clerkId: user.id,
          body: JSON.stringify(expenseData),
        }
      )
    },
    onSuccess: (_data, variables) => {
      // Invalidate the property query to refetch with new expense data
      queryClient.invalidateQueries({ queryKey: ['properties', variables.propertyId] })
      queryClient.invalidateQueries({ queryKey: ['properties', variables.propertyId, 'expenses'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

/**
 * Update an existing expense
 * Uses PropertyExpenseUpdateApi type from enhanced Zod schema for type safety
 */
export function useUpdateExpense() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      propertyId,
      expenseId,
      ...expenseData
    }: PropertyExpenseUpdateApi & {
      propertyId: string
      expenseId: string
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ expense: PropertyExpense }>(
        `/api/properties/${propertyId}/expenses/${expenseId}`,
        {
          method: 'PUT',
          clerkId: user.id,
          body: JSON.stringify(expenseData),
        }
      )
    },
    onSuccess: (_data, variables) => {
      // Invalidate the property query to refetch with updated expense data
      queryClient.invalidateQueries({ queryKey: ['properties', variables.propertyId] })
      queryClient.invalidateQueries({ queryKey: ['properties', variables.propertyId, 'expenses'] })
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId, 'expenses', variables.expenseId],
      })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

/**
 * Delete an expense
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      propertyId,
      expenseId,
    }: {
      propertyId: string
      expenseId: string
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ message: string }>(
        `/api/properties/${propertyId}/expenses/${expenseId}`,
        {
          method: 'DELETE',
          clerkId: user.id,
        }
      )
    },
    onSuccess: (_data, variables) => {
      // Invalidate the property query to refetch without deleted expense
      queryClient.invalidateQueries({ queryKey: ['properties', variables.propertyId] })
      queryClient.invalidateQueries({ queryKey: ['properties', variables.propertyId, 'expenses'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

