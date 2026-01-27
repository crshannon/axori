import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import type { PropertyBankAccount } from '@axori/shared'
import { apiFetch } from '@/lib/api/client'

/**
 * Create bank account input type
 */
interface CreateBankAccountInput {
  propertyId: string
  accountName: string
  accountType?: 'checking' | 'savings' | 'money_market' | 'other' | null
  institutionName?: string | null
  mask?: string | null
  currentBalance?: string | number | null
  availableBalance?: string | number | null
  maintenanceTarget?: string | number
  capexTarget?: string | number
  lifeSupportTarget?: string | number
  lifeSupportMonths?: number | null
  isPrimary?: boolean
}

/**
 * Update bank account input type
 */
interface UpdateBankAccountInput {
  id: string
  accountName?: string
  accountType?: 'checking' | 'savings' | 'money_market' | 'other' | null
  institutionName?: string | null
  mask?: string | null
  currentBalance?: string | number | null
  availableBalance?: string | number | null
  maintenanceTarget?: string | number
  capexTarget?: string | number
  lifeSupportTarget?: string | number
  lifeSupportMonths?: number | null
  isPrimary?: boolean
  isActive?: boolean
}

/**
 * Update balance input type
 */
interface UpdateBalanceInput {
  id: string
  currentBalance?: string | number | null
  availableBalance?: string | number | null
}

/**
 * Update allocations input type
 */
interface UpdateAllocationsInput {
  id: string
  maintenanceTarget?: string | number
  capexTarget?: string | number
  lifeSupportTarget?: string | number
  lifeSupportMonths?: number | null
}

/**
 * Get all bank accounts for a property
 */
export function usePropertyBankAccounts(propertyId: string | null | undefined) {
  const { user } = useUser()

  return useQuery({
    queryKey: ['properties', propertyId, 'bank-accounts'],
    queryFn: async () => {
      if (!user?.id || !propertyId) {
        throw new Error('User not authenticated or property ID missing')
      }

      const result = await apiFetch<{
        bankAccounts: Array<PropertyBankAccount>
      }>(`/api/bank-accounts/property/${propertyId}`, {
        clerkId: user.id,
      })

      return result.bankAccounts
    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Get a single bank account by ID
 */
export function useBankAccount(bankAccountId: string | null | undefined) {
  const { user } = useUser()

  return useQuery({
    queryKey: ['bank-accounts', bankAccountId],
    queryFn: async () => {
      if (!user?.id || !bankAccountId) {
        throw new Error('User not authenticated or bank account ID missing')
      }

      const result = await apiFetch<{ bankAccount: PropertyBankAccount }>(
        `/api/bank-accounts/${bankAccountId}`,
        {
          clerkId: user.id,
        },
      )

      return result.bankAccount
    },
    enabled: !!user?.id && !!bankAccountId,
    staleTime: 30 * 1000,
  })
}

/**
 * Get the primary bank account for a property (or first one if no primary)
 */
export function usePrimaryBankAccount(propertyId: string | null | undefined) {
  const { data: accounts, ...rest } = usePropertyBankAccounts(propertyId)

  const primaryAccount =
    accounts?.find((a) => a.isPrimary) || accounts?.[0] || null

  return {
    ...rest,
    data: primaryAccount,
  }
}

/**
 * Create a new bank account
 */
export function useCreateBankAccount() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async (input: CreateBankAccountInput) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const { propertyId, ...accountData } = input

      return await apiFetch<{ bankAccount: PropertyBankAccount }>(
        '/api/bank-accounts',
        {
          method: 'POST',
          clerkId: user.id,
          body: JSON.stringify({ propertyId, ...accountData }),
        },
      )
    },
    onSuccess: (_data, variables) => {
      // Invalidate bank accounts list
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId, 'bank-accounts'],
      })
      // Invalidate property queries (in case UI shows account info)
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId],
      })
    },
  })
}

/**
 * Update a bank account
 */
export function useUpdateBankAccount() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      id,
      propertyId,
      ...accountData
    }: UpdateBankAccountInput & { propertyId: string }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ bankAccount: PropertyBankAccount }>(
        `/api/bank-accounts/${id}`,
        {
          method: 'PATCH',
          clerkId: user.id,
          body: JSON.stringify(accountData),
        },
      )
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific account
      queryClient.invalidateQueries({
        queryKey: ['bank-accounts', variables.id],
      })
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId, 'bank-accounts'],
      })
      // Invalidate property
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId],
      })
    },
  })
}

/**
 * Update bank account balance (manual sync)
 */
export function useUpdateBankAccountBalance() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      id,
      propertyId,
      ...balanceData
    }: UpdateBalanceInput & { propertyId: string }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ bankAccount: PropertyBankAccount }>(
        `/api/bank-accounts/${id}/balance`,
        {
          method: 'PATCH',
          clerkId: user.id,
          body: JSON.stringify(balanceData),
        },
      )
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific account
      queryClient.invalidateQueries({
        queryKey: ['bank-accounts', variables.id],
      })
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId, 'bank-accounts'],
      })
    },
  })
}

/**
 * Update bank account allocations
 */
export function useUpdateBankAccountAllocations() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      id,
      propertyId,
      ...allocationData
    }: UpdateAllocationsInput & { propertyId: string }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ bankAccount: PropertyBankAccount }>(
        `/api/bank-accounts/${id}/allocations`,
        {
          method: 'PATCH',
          clerkId: user.id,
          body: JSON.stringify(allocationData),
        },
      )
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific account
      queryClient.invalidateQueries({
        queryKey: ['bank-accounts', variables.id],
      })
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId, 'bank-accounts'],
      })
    },
  })
}

/**
 * Delete (deactivate) a bank account
 */
export function useDeleteBankAccount() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      id,
      propertyId: _propertyId,
    }: {
      id: string
      propertyId: string
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      // Note: propertyId is not used in the request but is passed through to onSuccess
      // via the variables object for cache invalidation
      void _propertyId

      return await apiFetch<{ bankAccount: PropertyBankAccount }>(
        `/api/bank-accounts/${id}`,
        {
          method: 'DELETE',
          clerkId: user.id,
        },
      )
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific account
      queryClient.invalidateQueries({
        queryKey: ['bank-accounts', variables.id],
      })
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId, 'bank-accounts'],
      })
      // Invalidate property
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId],
      })
    },
  })
}

/**
 * Computed hook for bank account allocation calculations
 * Returns structured data matching the format expected by components and suggestion engine
 */
export function useBankAccountAllocations(
  propertyId: string | null | undefined,
) {
  const { data: account, isLoading, error } = usePrimaryBankAccount(propertyId)

  if (!account) {
    return {
      isLoading,
      error,
      hasBankAccount: false,
      account: null,
      balance: 0,
      totalAllocated: 0,
      trueCashFlow: 0,
      lastSynced: null,
      // Structured allocation data
      maintenance: { target: 0, funded: 0, gap: 0, percent: 0 },
      capex: { target: 0, funded: 0, gap: 0, percent: 0 },
      lifeSupport: { target: 0, funded: 0, months: null, percent: 0 },
    }
  }

  const currentBalance = account.currentBalance
    ? parseFloat(account.currentBalance)
    : 0
  const maintenanceTarget = account.maintenanceTarget
    ? parseFloat(account.maintenanceTarget)
    : 0
  const capexTarget = account.capexTarget ? parseFloat(account.capexTarget) : 0
  const lifeSupportTarget = account.lifeSupportTarget
    ? parseFloat(account.lifeSupportTarget)
    : 0

  const totalAllocated = maintenanceTarget + capexTarget + lifeSupportTarget
  const trueCashFlow = Math.max(0, currentBalance - totalAllocated)

  // Calculate allocation percentages (how much of target is funded)
  // If balance is less than total allocations, proportionally distribute
  const fundingRatio =
    totalAllocated > 0 ? Math.min(1, currentBalance / totalAllocated) : 1

  const maintenanceFunded = maintenanceTarget * fundingRatio
  const capexFunded = capexTarget * fundingRatio
  const lifeSupportFunded = lifeSupportTarget * fundingRatio

  return {
    isLoading,
    error,
    hasBankAccount: true,
    account,
    balance: currentBalance,
    totalAllocated,
    trueCashFlow,
    lastSynced: account.lastSynced,
    // Structured allocation data
    maintenance: {
      target: maintenanceTarget,
      funded: maintenanceFunded,
      gap: maintenanceTarget - maintenanceFunded,
      percent:
        maintenanceTarget > 0
          ? Math.round((maintenanceFunded / maintenanceTarget) * 100)
          : 0,
    },
    capex: {
      target: capexTarget,
      funded: capexFunded,
      gap: capexTarget - capexFunded,
      percent:
        capexTarget > 0 ? Math.round((capexFunded / capexTarget) * 100) : 0,
    },
    lifeSupport: {
      target: lifeSupportTarget,
      funded: lifeSupportFunded,
      months: account.lifeSupportMonths,
      percent:
        lifeSupportTarget > 0
          ? Math.round((lifeSupportFunded / lifeSupportTarget) * 100)
          : 0,
    },
  }
}
