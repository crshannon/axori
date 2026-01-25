/**
 * usePropertyPermissions - React hook for property-level permission checking
 *
 * This hook provides permission state for UI components based on a propertyId.
 * It fetches the property to get its portfolioId, then uses that to check permissions.
 *
 * @example
 * ```tsx
 * function PropertySettings({ propertyId }: Props) {
 *   const { canEdit, canAdmin, isLoading, isReadOnly } = usePropertyPermissions(propertyId);
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <>
 *       {isReadOnly && <ReadOnlyBanner />}
 *       {canEdit && <EditButton />}
 *       {canAdmin && <DeleteButton />}
 *     </>
 *   );
 * }
 * ```
 */

import { useProperty } from './useProperties'
import { usePermissions } from './usePermissions'
import type { UsePermissionsResult } from './usePermissions'

/**
 * Return type for the usePropertyPermissions hook
 */
export interface UsePropertyPermissionsResult extends UsePermissionsResult {
  /** Whether the user has read-only access (can view but not edit) */
  isReadOnly: boolean
  /** Whether permissions are still loading (includes property loading) */
  isLoading: boolean
  /** The property's portfolio ID (if loaded) */
  portfolioId: string | null
}

/**
 * Hook to fetch permissions for a specific property
 *
 * @param propertyId - The property ID to check permissions for
 * @returns Permission state and helper functions
 *
 * @remarks
 * - First fetches the property to get its portfolioId
 * - Then fetches permissions for that portfolio
 * - Returns isReadOnly = true when user can view but not edit
 */
export function usePropertyPermissions(
  propertyId: string | null | undefined,
): UsePropertyPermissionsResult {
  // First, fetch the property to get its portfolioId
  const { data: property, isLoading: isPropertyLoading } =
    useProperty(propertyId)

  // Then, fetch permissions for that portfolio
  const portfolioId = property?.portfolioId ?? null
  const permissions = usePermissions(portfolioId)

  // Combine loading states
  const isLoading = isPropertyLoading || permissions.isLoading

  // Determine if the user has read-only access
  // Read-only means they can view but cannot edit
  const isReadOnly = permissions.canView && !permissions.canEdit

  return {
    ...permissions,
    isLoading,
    isReadOnly,
    portfolioId,
  }
}
