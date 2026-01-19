import { useQuery } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api/client'

export interface Portfolio {
  id: string
  name: string
  description: string | null
  role: 'owner' | 'admin' | 'member' | 'viewer'
}

/**
 * Get current user's default portfolio
 * Automatically creates one if it doesn't exist
 */
export function useDefaultPortfolio() {
  const { user } = useUser()

  return useQuery({
    queryKey: ['portfolios', 'default'],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<Portfolio>(`/api/users/me/portfolio`, {
        clerkId: user.id,
      })
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

