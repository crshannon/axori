/**
 * usePermissions - React hook for portfolio-level permission checking
 *
 * This hook provides permission state for UI components, fetching the user's
 * role from the API and deriving permissions client-side using @axori/permissions.
 *
 * @example
 * ```tsx
 * function PropertyActions({ portfolioId, propertyId }: Props) {
 *   const { canEdit, hasPropertyAccess, isLoading } = usePermissions(portfolioId);
 *
 *   if (isLoading) return <Spinner />;
 *
 *   if (!hasPropertyAccess(propertyId)) {
 *     return <div>No access to this property</div>;
 *   }
 *
 *   return (
 *     <>
 *       {canEdit && <EditButton />}
 *       <ViewDetails />
 *     </>
 *   );
 * }
 * ```
 */

import { useQuery } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api/client'
import type { PortfolioRole, PropertyAccess } from '@axori/permissions'
import {
  canView,
  canEdit,
  canAdmin,
  canManageBilling,
  canViewProperty,
} from '@axori/permissions'

/**
 * Permission context returned from the API
 */
interface PermissionContextResponse {
  portfolioId: string
  role: PortfolioRole
  roleLabel: string
  roleDescription: string
  propertyAccess: PropertyAccess
  permissions: {
    canView: boolean
    canEdit: boolean
    canAdmin: boolean
    canManageBilling: boolean
    [key: string]: boolean
  }
  allowedActions: string[]
}

/**
 * Return type for the usePermissions hook
 */
export interface UsePermissionsResult {
  /** Current user's role in the portfolio */
  role: PortfolioRole | null
  /** Whether the user can view portfolio data (viewer+) */
  canView: boolean
  /** Whether the user can edit data (member+) */
  canEdit: boolean
  /** Whether the user has admin-level access (admin+) */
  canAdmin: boolean
  /** Whether the user can manage billing (owner only) */
  canManageBilling: boolean
  /** Check if user has access to a specific property */
  hasPropertyAccess: (propertyId: string) => boolean
  /** Whether the permissions are currently loading */
  isLoading: boolean
  /** Error if the permission fetch failed */
  error: Error | null
  /** Refetch permissions (useful after permission changes) */
  refetch: () => void
}

/**
 * Hook to fetch and derive user permissions for a portfolio
 *
 * @param portfolioId - The portfolio ID to check permissions for, or null if no portfolio selected
 * @returns Permission state and helper functions
 *
 * @remarks
 * - Permissions are derived from the server state (role + propertyAccess)
 * - The hook caches results for 5 minutes to avoid excessive API calls
 * - When portfolioId is null, all permissions default to false
 */
export function usePermissions(portfolioId: string | null): UsePermissionsResult {
  const { user } = useUser()

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['permissions', portfolioId],
    queryFn: async () => {
      if (!user?.id || !portfolioId) {
        throw new Error('User not authenticated or portfolio ID missing')
      }

      return await apiFetch<PermissionContextResponse>(
        `/api/permissions/${portfolioId}`,
        {
          clerkId: user.id,
        }
      )
    },
    enabled: !!user?.id && !!portfolioId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry permission checks to avoid confusion
  })

  // Derive permissions from the role
  const role = data?.role ?? null
  const propertyAccess = data?.propertyAccess ?? null

  // Build the hasPropertyAccess function
  const hasPropertyAccess = (propertyId: string): boolean => {
    if (!role) return false
    // Use the canViewProperty helper which handles propertyAccess correctly
    return canViewProperty(role, propertyId, propertyAccess)
  }

  return {
    role,
    canView: role ? canView(role) : false,
    canEdit: role ? canEdit(role) : false,
    canAdmin: role ? canAdmin(role) : false,
    canManageBilling: role ? canManageBilling(role) : false,
    hasPropertyAccess,
    isLoading: portfolioId ? isLoading : false,
    error: error as Error | null,
    refetch: () => { refetch() },
  }
}
