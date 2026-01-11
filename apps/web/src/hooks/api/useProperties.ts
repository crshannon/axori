import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import type { PropertyInsert } from '@axori/shared'
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
    isRented?: boolean | null
    monthlyBaseRent?: number | null
    leaseEndDate?: string | null
    tenantName?: string | null
  } | null

  operatingExpenses?: {
    // Operating expenses data (no management fields here)
  } | null

  management?: {
    isSelfManaged?: boolean | null
    companyName?: string | null
    companyWebsite?: string | null
    contactName?: string | null
    contactEmail?: string | null
    contactPhone?: string | null
    feeType?: string | null
    feePercentage?: number | null
    feeFlatAmount?: number | null
    // ... other management fields
  } | null

  strategy?: {
    investmentStrategy?: string | null
  } | null

  loans?: Array<{
    id: string
    loanType?: string | null
    originalLoanAmount?: number | null
    interestRate?: number | null
    termMonths?: number | null
    lenderName?: string | null
    monthlyPrincipalInterest?: number | null
    status: string
    isPrimary: boolean
  }>
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
