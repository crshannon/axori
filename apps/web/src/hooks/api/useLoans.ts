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
      // Invalidate and immediately refetch the property query to get new loan data
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId],
        refetchType: 'active', // Immediately refetch active queries
      })
      queryClient.invalidateQueries({
        queryKey: ['properties'],
        refetchType: 'active',
      })
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

      console.log('[useUpdateLoan] Sending update request:', {
        propertyId,
        loanId,
        loanData,
      })
      const response = await apiFetch<{ loan: Loan }>(
        `/api/properties/${propertyId}/loans/${loanId}`,
        {
          method: 'PUT',
          clerkId: user.id,
          body: JSON.stringify(loanData),
        },
      )
      console.log('[useUpdateLoan] Received response:', response)
      return response
    },
    onSuccess: async (data, variables) => {
      console.log(
        '[useUpdateLoan] onSuccess - invalidating queries for property:',
        variables.propertyId,
      )
      console.log('[useUpdateLoan] Updated loan data:', {
        monthlyPrincipalInterest: data.loan.monthlyPrincipalInterest,
        totalMonthlyPayment: data.loan.totalMonthlyPayment,
      })

      // Invalidate and immediately refetch the property query to get updated loan data
      await queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId],
        refetchType: 'active', // Immediately refetch active queries
      })
      await queryClient.invalidateQueries({
        queryKey: ['properties'],
        refetchType: 'active',
      })

      // Force a refetch to ensure fresh data
      const refetchResult = await queryClient.refetchQueries({
        queryKey: ['properties', variables.propertyId],
      })
      console.log('[useUpdateLoan] Refetch result:', refetchResult)
    },
  })
}
