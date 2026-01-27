/**
 * useDrawer Hook
 *
 * Provides programmatic control for opening and closing drawers
 * via URL search params. Updates are reflected in the URL for
 * deep linking and state persistence.
 *
 * Includes pre-emptive permission checking to prevent URL flashing
 * when access is denied.
 *
 * @see AXO-93 - URL-Based Drawer Factory
 *
 * @example
 * ```tsx
 * const { openDrawer, closeDrawer, isOpen, currentDrawer } = useDrawer()
 *
 * // Open a drawer with params
 * openDrawer('add-loan', { propertyId: 'prop_123' })
 *
 * // Close the current drawer
 * closeDrawer()
 *
 * // Check if a specific drawer is open
 * if (currentDrawer === 'add-loan') { ... }
 * ```
 */

import { useCallback, useMemo } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  getDrawerEntry,
  isValidDrawerName,
  validateDrawerParams,
} from './registry'
import { hasRequiredPermission } from './permission-helpers'
import type { DrawerName, DrawerParams } from './registry'
import type { PortfolioRole } from './permission-helpers'
import { toast } from '@/lib/toast'

/**
 * Options for opening a drawer
 */
export interface OpenDrawerOptions {
  /** Whether to replace the current history entry (default: true) */
  replace?: boolean
  /** Skip permission check (use when you've already verified permissions) */
  skipPermissionCheck?: boolean
}

/**
 * Return type for the useDrawer hook
 */
export interface UseDrawerResult {
  /** Open a drawer with the specified params */
  openDrawer: <T extends DrawerName>(
    name: T,
    params: DrawerParams<T>,
    options?: OpenDrawerOptions,
  ) => void
  /** Close the currently open drawer */
  closeDrawer: (options?: OpenDrawerOptions) => void
  /** The currently open drawer name, or null if none */
  currentDrawer: DrawerName | null
  /** The current drawer params */
  currentParams: Record<string, unknown>
  /** Whether any drawer is currently open */
  isOpen: boolean
  /** Check if a specific drawer is open */
  isDrawerOpen: (name: DrawerName) => boolean
}

/**
 * Search params schema for drawer state
 */
interface DrawerSearchParams {
  drawer?: string
  // Additional params are dynamically added based on drawer type
  [key: string]: unknown
}

/**
 * Hook for programmatic drawer control via URL params
 *
 * Uses TanStack Router's search params for URL state management.
 * Changes to drawer state are reflected in the URL, enabling:
 * - Deep linking to specific drawers
 * - Browser back/forward navigation
 * - State persistence across refreshes
 *
 * Includes pre-emptive permission checking using cached query data
 * to prevent URL flashing when access is denied.
 */
export function useDrawer(): UseDrawerResult {
  const navigate = useNavigate()
  const routerState = useRouterState()
  const queryClient = useQueryClient()

  // Get current search params safely
  const currentSearch = useMemo(() => {
    return routerState.location.search as DrawerSearchParams
  }, [routerState.location.search])

  // Extract current drawer state
  const currentDrawer = useMemo((): DrawerName | null => {
    const drawerName = currentSearch.drawer
    if (typeof drawerName === 'string' && isValidDrawerName(drawerName)) {
      return drawerName
    }
    return null
  }, [currentSearch.drawer])

  // Extract current params (everything except 'drawer')
  const currentParams = useMemo((): Record<string, unknown> => {
    const { drawer: _, ...params } = currentSearch
    return params
  }, [currentSearch])

  // Whether any drawer is open
  const isOpen = currentDrawer !== null

  /**
   * Check permissions using cached React Query data
   * Returns true if access is allowed, false if denied
   */
  const checkPermissionFromCache = useCallback(
    (drawerName: DrawerName, propertyId: string | undefined): boolean => {
      const entry = getDrawerEntry(drawerName)
      if (!entry) {
        return false
      }

      // If no property ID is required, allow access
      if (!propertyId) {
        return true
      }

      // Try to get cached property data
      const propertyData = queryClient.getQueryData<{ portfolioId?: string }>([
        'properties',
        propertyId,
      ])

      if (!propertyData?.portfolioId) {
        // No cached data - let DrawerProvider handle it
        // This allows the drawer to open and check permissions there
        return true
      }

      // Try to get cached permission data
      const permissionData = queryClient.getQueryData<{ role?: PortfolioRole }>(
        ['permissions', propertyData.portfolioId],
      )

      if (!permissionData?.role) {
        // No cached permission data - let DrawerProvider handle it
        return true
      }

      // Check if user has required permission
      return hasRequiredPermission(permissionData.role, entry.permission)
    },
    [queryClient],
  )

  /**
   * Open a drawer by updating URL search params
   * Checks permissions before updating URL to prevent flashing
   */
  const openDrawer = useCallback(
    <T extends DrawerName>(
      name: T,
      params: DrawerParams<T>,
      options: OpenDrawerOptions = {},
    ): void => {
      const { replace = true, skipPermissionCheck = false } = options

      // Validate params before opening
      const validatedParams = validateDrawerParams(name, params)
      if (!validatedParams) {
        console.error(`[useDrawer] Invalid params for drawer "${name}"`)
        return
      }

      // Check permissions from cache before updating URL
      if (!skipPermissionCheck) {
        const propertyId = (validatedParams as { propertyId?: string })
          .propertyId
        const hasPermission = checkPermissionFromCache(name, propertyId)

        if (!hasPermission) {
          const entry = getDrawerEntry(name)
          console.warn(
            `[useDrawer] Access denied to drawer "${name}". ` +
              `Required: ${entry?.permission}`,
          )
          toast.warning(
            `You don't have permission to access ${entry?.displayName || name}`,
          )
          return
        }
      }

      navigate({
        search: (prev) => ({
          ...prev,
          drawer: name,
          ...validatedParams,
        }),
        replace,
      })
    },
    [navigate, checkPermissionFromCache],
  )

  /**
   * Close the current drawer by clearing drawer-related params
   */
  const closeDrawer = useCallback(
    (options: OpenDrawerOptions = {}): void => {
      const { replace = true } = options

      navigate({
        // Clear all drawer-related params by setting them to undefined
        search: {
          drawer: undefined,
          propertyId: undefined,
          loanId: undefined,
          transactionId: undefined,
          bankAccountId: undefined,
        } as any,
        replace,
      })
    },
    [navigate],
  )

  /**
   * Check if a specific drawer is currently open
   */
  const isDrawerOpen = useCallback(
    (name: DrawerName): boolean => {
      return currentDrawer === name
    },
    [currentDrawer],
  )

  return {
    openDrawer,
    closeDrawer,
    currentDrawer,
    currentParams,
    isOpen,
    isDrawerOpen,
  }
}
