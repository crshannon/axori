import { useQuery } from '@tanstack/react-query'
import type { Market } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface UseMarketsOptions {
  search?: string
  state?: string
  investmentProfile?: 'cash_flow' | 'appreciation' | 'hybrid'
  active?: boolean
  trending?: boolean
}

export function useMarkets(options: UseMarketsOptions = {}) {
  const { search, state, investmentProfile, active = true, trending } = options

  return useQuery({
    queryKey: ['markets', search, state, investmentProfile, active, trending],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (state) params.append('state', state)
      if (investmentProfile) params.append('investment_profile', investmentProfile)
      if (active !== undefined) params.append('active', active.toString())
      if (trending) params.append('trending', 'true')

      const response = await fetch(`${API_BASE_URL}/api/markets?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch markets')
      }
      return response.json() as Promise<Market[]>
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

