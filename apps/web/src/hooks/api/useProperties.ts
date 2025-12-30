import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import type { PropertyInsert } from '@axori/shared'
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
  createdAt: Date
  updatedAt: Date
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

