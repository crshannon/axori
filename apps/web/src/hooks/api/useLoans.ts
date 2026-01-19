import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import type { Loan, LoanInsertApi } from '@axori/shared'
import { apiFetch } from '@/lib/api/client'

/**
 * Create a loan for a property
 * Uses LoanInsertApi type from enhanced Zod schema for type safety
 */
export function useCreateLoan() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      propertyId,
      ...loanData
    }: Omit<LoanInsertApi, 'userId'> & {
      propertyId: string
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ loan: Loan }>(
        `/api/properties/${propertyId}/loans`,
        {
          method: 'POST',
          clerkId: user.id,
          body: JSON.stringify(loanData),
        },
      )
    },
    onSuccess: (data, variables) => {
      // Invalidate the property query to refetch with new loan data
      queryClient.invalidateQueries({ queryKey: ['properties', variables.propertyId] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

/**
 * Update an existing loan
 * Uses LoanUpdateApi type from enhanced Zod schema for type safety
 */
export function useUpdateLoan() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      propertyId,
      loanId,
      ...loanData
    }: LoanUpdateApi & {
      loanId: string
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ loan: Loan }>(
        `/api/properties/${propertyId}/loans/${loanId}`,
        {
          method: 'PUT',
          clerkId: user.id,
          body: JSON.stringify(loanData),
        },
      )
    },
    onSuccess: (data, variables) => {
      // Invalidate the property query to refetch with updated loan data
      queryClient.invalidateQueries({ queryKey: ['properties', variables.propertyId] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

