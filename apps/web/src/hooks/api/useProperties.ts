import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import type { Loan, PropertyInsert, PropertyTransaction } from '@axori/shared'
import type { PropertyDetails } from '@axori/shared/src/integrations/rentcast'
import { apiFetch } from '@/lib/api/client'

export interface Property {
  id: string
  portfolioId: string
  addedBy: string
  address: string
  city: string
  state: string
  zipCode: string
  latitude?: string | null
  longitude?: string | null
  mapboxPlaceId?: string | null
  fullAddress?: string | null
  propertyType?: string | null
  status: 'draft' | 'active' | 'archived'
  rentcastData?: string | null
  rentcastFetchedAt?: Date | null
  createdAt: Date
  updatedAt: Date

  // Nested normalized data (from API joins)
  characteristics?: {
    propertyType?: string | null
    bedrooms?: number | null
    bathrooms?: number | null
    squareFeet?: number | null
    lotSize?: number | null
    yearBuilt?: number | null
  } | null

  valuation?: {
    currentValue?: number | null
    lastAppraisalDate?: string | null
    lastAppraisalValue?: number | null
  } | null

  acquisition?: {
    purchaseDate?: string | null
    purchasePrice?: number | null
    closingCosts?: number | null
    currentValue?: number | null
    ownershipStatus?: string | null
    entityType?: string | null
    entityName?: string | null
  } | null

  rentalIncome?: {
    // Base Rent
    monthlyRent?: string | null // numeric in DB, returned as string
    rentSource?: string | null // "lease", "estimate", "manual"
    marketRentEstimate?: string | null // numeric in DB, returned as string

    // Rent History
    rentLastIncreasedDate?: string | null
    rentLastIncreasedAmount?: string | null // numeric in DB, returned as string

    // Other Income Sources (monthly)
    otherIncomeMonthly?: string | null // numeric in DB, returned as string
    parkingIncomeMonthly?: string | null // numeric in DB, returned as string
    laundryIncomeMonthly?: string | null // numeric in DB, returned as string
    petRentMonthly?: string | null // numeric in DB, returned as string
    storageIncomeMonthly?: string | null // numeric in DB, returned as string
    utilityReimbursementMonthly?: string | null // numeric in DB, returned as string

    updatedAt?: Date | null
  } | null

  operatingExpenses?: {
    // Operating Rates (for projections)
    vacancyRate?: string | null // numeric in DB, returned as string
    managementRate?: string | null // numeric in DB, returned as string
    maintenanceRate?: string | null // numeric in DB, returned as string
    capexRate?: string | null // numeric in DB, returned as string

    // Fixed Expenses
    propertyTaxAnnual?: string | null // numeric in DB, returned as string
    insuranceAnnual?: string | null // numeric in DB, returned as string

    // HOA
    hoaMonthly?: string | null // numeric in DB, returned as string
    hoaSpecialAssessment?: string | null // numeric in DB, returned as string
    hoaSpecialAssessmentDate?: string | null

    // Utilities (if landlord-paid)
    waterSewerMonthly?: string | null // numeric in DB, returned as string
    trashMonthly?: string | null // numeric in DB, returned as string
    electricMonthly?: string | null // numeric in DB, returned as string
    gasMonthly?: string | null // numeric in DB, returned as string
    internetMonthly?: string | null // numeric in DB, returned as string

    // Services
    managementFlatFee?: string | null // numeric in DB, returned as string
    lawnCareMonthly?: string | null // numeric in DB, returned as string
    snowRemovalMonthly?: string | null // numeric in DB, returned as string
    pestControlMonthly?: string | null // numeric in DB, returned as string
    poolMaintenanceMonthly?: string | null // numeric in DB, returned as string
    alarmMonitoringMonthly?: string | null // numeric in DB, returned as string

    // Other
    otherExpensesMonthly?: string | null // numeric in DB, returned as string
    otherExpensesDescription?: string | null

    updatedAt?: Date | null
  } | null

  management?: {
    // Management Type
    isSelfManaged?: boolean | null

    // Company Details
    companyName?: string | null
    companyWebsite?: string | null

    // Primary Contact
    contactName?: string | null
    contactEmail?: string | null
    contactPhone?: string | null

    // Contract Details
    contractStartDate?: string | null
    contractEndDate?: string | null
    contractAutoRenews?: boolean | null
    cancellationNoticeDays?: number | null

    // Fee Structure
    feeType?: string | null // "percentage", "flat", "hybrid"
    feePercentage?: string | null // numeric in DB, returned as string
    feeFlatAmount?: string | null // numeric in DB, returned as string
    feeMinimum?: string | null // numeric in DB, returned as string

    // Additional Fees
    leasingFeeType?: string | null // "percentage", "flat", "none"
    leasingFeePercentage?: string | null // numeric in DB, returned as string
    leasingFeeFlat?: string | null // numeric in DB, returned as string
    leaseRenewalFee?: string | null // numeric in DB, returned as string
    maintenanceMarkupPercentage?: string | null // numeric in DB, returned as string
    maintenanceCoordinationFee?: string | null // numeric in DB, returned as string
    evictionFee?: string | null // numeric in DB, returned as string
    earlyTerminationFee?: string | null // numeric in DB, returned as string

    // Services Included
    servicesIncluded?: Array<string> | null

    // Payment Details
    paymentMethod?: string | null // "ach", "check", "portal"
    paymentDay?: number | null
    holdsSecurityDeposit?: boolean | null
    reserveAmount?: string | null // numeric in DB, returned as string

    updatedAt?: Date | null
  } | null

  strategy?: {
    investmentStrategy?: string | null
  } | null

  loans?: Array<Loan>
  transactions?: Array<PropertyTransaction>
}

/**
 * Get a specific property by ID
 */
export function useProperty(propertyId: string | null | undefined) {
  const { user } = useUser()

  return useQuery({
    queryKey: ['properties', propertyId],
    queryFn: async () => {
      if (!user?.id || !propertyId) {
        throw new Error('User not authenticated or property ID missing')
      }

      const result = await apiFetch<{ property: Property }>(
        `/api/properties/${propertyId}`,
        {
          clerkId: user.id,
        },
      )

      return result.property
    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Get Rentcast data for a property
 * Automatically uses cached data if less than 1 week old
 */
export function useRentcastData(propertyId: string | null | undefined) {
  const { user } = useUser()

  return useQuery({
    queryKey: ['properties', propertyId, 'rentcast'],
    queryFn: async () => {
      if (!user?.id || !propertyId) {
        throw new Error('User not authenticated or property ID missing')
      }

      const result = await apiFetch<{
        data: PropertyDetails
        cached: boolean
        fetchedAt: string
      }>(`/api/properties/${propertyId}/rentcast-data`, {
        clerkId: user.id,
      })

      return result
    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days (same as cache)
  })
}

/**
 * Get current user's most recent draft property
 * Only fetches if enabled is true (default: true)
 * Use this to auto-resume when opening wizard without a specific draftId
 */
export function useLatestDraft(options?: { enabled?: boolean }) {
  const { user } = useUser()

  return useQuery({
    queryKey: ['properties', 'drafts', 'me'],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const result = await apiFetch<{ property: Property | null }>(
        `/api/properties/drafts/me`,
        {
          clerkId: user.id,
        },
      )

      return result.property
    },
    enabled: (options?.enabled ?? true) && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Create a new property (draft)
 */
export function useCreateProperty() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async (data: Omit<PropertyInsert, 'portfolioId' | 'addedBy'> & { portfolioId: string }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ property: Property }>(`/api/properties`, {
        method: 'POST',
        clerkId: user.id,
        body: JSON.stringify({
          ...data,
          status: 'draft',
        }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', 'drafts', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

/**
 * Update an existing property
 */
export function useUpdateProperty() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<PropertyInsert> & { id: string }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ property: Property }>(`/api/properties/${id}`, {
        method: 'PUT',
        clerkId: user.id,
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', 'drafts', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

/**
 * Complete/finalize a draft property (mark as active)
 */
export function useCompleteProperty() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ property: Property }>(
        `/api/properties/${id}/complete`,
        {
          method: 'POST',
          clerkId: user.id,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', 'drafts', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

/**
 * Soft delete a property (mark as archived)
 */
export function useDeleteProperty() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<{ property: Property }>(`/api/properties/${id}`, {
        method: 'DELETE',
        clerkId: user.id,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['properties', 'drafts', 'me'] })
    },
  })
}

/**
 * Get all properties for current user's portfolio
 */
export function useProperties(portfolioId?: string | null) {
  const { user } = useUser()

  return useQuery({
    queryKey: ['properties', portfolioId],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const params = portfolioId ? `?portfolioId=${portfolioId}` : ''
      const result = await apiFetch<{ properties: Array<Property> }>(
        `/api/properties${params}`,
        {
          clerkId: user.id,
        },
      )

      return result.properties
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  })
}

