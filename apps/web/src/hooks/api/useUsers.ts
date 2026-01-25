import { useQuery } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api/client'

export interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  clerkId: string
  defaultPortfolioId?: string
}

/**
 * Get or create current user
 */
export function useCurrentUser() {
  const { user } = useUser()

  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        // Try to get existing user
        return await apiFetch<User>(`/api/users/me`, {
          clerkId: user.id,
        })
      } catch (error: any) {
        // If user doesn't exist, create it
        if (
          error.message?.includes('not found') ||
          error.message?.includes('404')
        ) {
          return await apiFetch<User>(`/api/users`, {
            method: 'POST',
            clerkId: user.id,
            body: JSON.stringify({
              email: user.primaryEmailAddress?.emailAddress || '',
              firstName: user.firstName || null,
              lastName: user.lastName || null,
            }),
          })
        }
        throw error
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
