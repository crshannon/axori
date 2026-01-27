import { useQuery } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Hook to check if user has completed onboarding
 * Returns { completed: boolean, isLoading: boolean }
 */
export function useOnboardingStatus() {
  const { user } = useUser()

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding'],
    queryFn: async () => {
      if (!user?.id) return null

      const response = await fetch(`${API_BASE_URL}/api/onboarding`, {
        headers: {
          Authorization: `Bearer ${user.id}`,
        },
        credentials: 'include',
      })

      if (!response.ok) {
        // If 401/404, user might not exist yet - treat as not completed
        if (response.status === 401 || response.status === 404) {
          return { completed: false, step: null }
        }
        // Don't throw - return default state to prevent redirect loop
        return { completed: false, step: null }
      }

      return response.json() as Promise<{
        step: string | null
        completed: boolean
        completedAt: Date | null
      }>
    },
    enabled: !!user,
    retry: false,
  })

  return {
    completed: data?.completed ?? false,
    step: data?.step ?? null,
    isLoading: isLoading || !user,
  }
}
