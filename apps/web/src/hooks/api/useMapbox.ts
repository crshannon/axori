import { useQuery } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import type { MapboxAddressSuggestion } from '@axori/shared/src/integrations/mapbox'
import { apiFetch } from '@/lib/api/client'

/**
 * Search addresses using Mapbox (server-side)
 * API key is never exposed to the client
 */
export function useMapboxSearch(query: string | null) {
  const { user } = useUser()

  return useQuery({
    queryKey: ['mapbox', 'search', query],
    queryFn: async () => {
      if (!user?.id || !query || query.length < 3) {
        return { suggestions: [] }
      }

      const result = await apiFetch<{
        suggestions: Array<MapboxAddressSuggestion>
        rawFeatures?: Array<any> // Raw Mapbox features for storage
      }>(`/api/mapbox/search?query=${encodeURIComponent(query)}`, {
        clerkId: user.id,
      })

      return result
    },
    enabled: !!user?.id && !!query && query.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 minutes cache for searches
  })
}

