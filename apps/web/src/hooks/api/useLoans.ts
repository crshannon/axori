import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import type { Loan } from '@axori/shared'
import { apiFetch } from '@/lib/api/client'

/**
 * Create a loan for a property
 */
export function useCreateLoan() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      propertyId,
      ...loanData
    }: {
      propertyId: string
      loanType: string
      lenderName: string
      servicerName?: string
      loanNumber?: string
      originalLoanAmount: number
      interestRate: number
      termMonths: number
      currentBalance: number
      startDate?: string
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
 */
export function useUpdateLoan() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      propertyId,
      loanId,
      ...loanData
    }: {
      propertyId: string
      loanId: string
      loanType: string
      lenderName: string
      servicerName?: string
      loanNumber?: string
      originalLoanAmount: number
      interestRate: number
      termMonths: number
      currentBalance: number
      startDate?: string
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

