import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import type { OnboardingData, OnboardingUpdate } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function useOnboarding() {
  const { user } = useUser()
  return useQuery({
    queryKey: ['onboarding'],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      // First, ensure user exists in our database
      try {
        await fetch(`${API_BASE_URL}/api/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.id}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            email:
              (user.emailAddresses && user.emailAddresses[0]?.emailAddress) ||
              user.primaryEmailAddress?.emailAddress ||
              '',
            firstName: user.firstName || null,
            lastName: user.lastName || null,
          }),
        })
      } catch (error) {
        console.error('Failed to create/verify user:', error)
        // Continue anyway - API will create user if needed
      }

      // Send the Clerk user ID directly in the Authorization header
      const response = await fetch(`${API_BASE_URL}/api/onboarding`, {
        headers: {
          Authorization: `Bearer ${user.id}`,
        },
        credentials: 'include',
      })
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - please sign in')
        }
        if (response.status === 404) {
          // User not found - return default onboarding state
          return {
            step: null,
            completed: false,
            completedAt: null,
            data: null,
            firstName: null,
            lastName: null,
          }
        }
        // For other errors, return default state instead of throwing to prevent redirect loops
        console.error(
          'Failed to fetch onboarding data:',
          response.status,
          response.statusText,
        )
        return {
          step: null,
          completed: false,
          completedAt: null,
          data: null,
          firstName: null,
          lastName: null,
        }
      }
      return response.json() as Promise<OnboardingData>
    },
    enabled: !!user,
    retry: false, // Don't retry to prevent loops
  })
}

export function useUpdateOnboarding() {
  const queryClient = useQueryClient()
  const { user } = useUser()
  return useMutation({
    mutationFn: async (data: OnboardingUpdate) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      // Send the Clerk user ID directly in the Authorization header
      const response = await fetch(`${API_BASE_URL}/api/onboarding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.id}`,
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - please sign in')
        }
        throw new Error('Failed to update onboarding')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] })
    },
  })
}

