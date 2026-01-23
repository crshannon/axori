import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import { API_BASE_URL, apiFetch } from '@/lib/api/client'

/**
 * Invitation validation response from the API
 */
export interface InvitationValidationResult {
  valid: boolean
  error?: string
  invitation?: {
    email: string
    role: 'owner' | 'admin' | 'member' | 'viewer'
    expiresAt: string
    createdAt: string
  }
  portfolio?: {
    id: string
    name: string
    description: string | null
  } | null
  inviter?: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  } | null
}

/**
 * Invitation acceptance response from the API
 */
export interface InvitationAcceptanceResult {
  message: string
  membership: {
    id: string
    role: string
    propertyAccess: Record<string, Array<string>> | null
    acceptedAt: string
  }
  portfolio: {
    id: string
    name: string
    description: string | null
  } | null
}

/**
 * Validate an invitation token without authentication
 * This can be called before the user is signed in to show invitation details
 */
export function useValidateInvitation(token: string | null) {
  return useQuery({
    queryKey: ['invitation', 'validate', token],
    queryFn: async (): Promise<InvitationValidationResult> => {
      if (!token) {
        return { valid: false, error: 'No token provided' }
      }

      // This endpoint doesn't require authentication
      const response = await fetch(
        `${API_BASE_URL}/api/portfolio-members/validate-invitation?token=${encodeURIComponent(token)}`,
        {
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: response.statusText,
        }))
        return { valid: false, error: errorData.error || 'Failed to validate invitation' }
      }

      return response.json()
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on failure - the token might be invalid
  })
}

/**
 * Accept an invitation (requires authentication)
 */
export function useAcceptInvitation() {
  const { user } = useUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (token: string): Promise<InvitationAcceptanceResult> => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await apiFetch<InvitationAcceptanceResult>(
        `/api/portfolio-members/accept-invitation`,
        {
          method: 'POST',
          clerkId: user.id,
          body: JSON.stringify({ token }),
        }
      )
    },
    onSuccess: () => {
      // Invalidate portfolios query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
    },
  })
}
