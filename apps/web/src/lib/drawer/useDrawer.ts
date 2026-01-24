/**
 * useDrawer Hook
 *
 * Provides programmatic control for opening and closing drawers
 * via URL search params. Updates are reflected in the URL for
 * deep linking and state persistence.
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
import type { DrawerName, DrawerParams } from './registry'
import { isValidDrawerName, validateDrawerParams } from './registry'

/**
 * Options for opening a drawer
 */
export interface OpenDrawerOptions {
  /** Whether to replace the current history entry (default: true) */
  replace?: boolean
}

/**
 * Return type for the useDrawer hook
 */
export interface UseDrawerResult {
  /** Open a drawer with the specified params */
  openDrawer: <T extends DrawerName>(
    name: T,
    params: DrawerParams<T>,
    options?: OpenDrawerOptions
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
 */
export function useDrawer(): UseDrawerResult {
  const navigate = useNavigate()
  const routerState = useRouterState()

  // Get current search params safely
  const currentSearch = useMemo(() => {
    return (routerState.location.search || {}) as DrawerSearchParams
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
   * Open a drawer by updating URL search params
   */
  const openDrawer = useCallback(
    <T extends DrawerName>(
      name: T,
      params: DrawerParams<T>,
      options: OpenDrawerOptions = {}
    ): void => {
      const { replace = true } = options

      // Validate params before opening
      const validatedParams = validateDrawerParams(name, params)
      if (!validatedParams) {
        console.error(`[useDrawer] Invalid params for drawer "${name}"`)
        return
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
    [navigate]
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
    [navigate]
  )

  /**
   * Check if a specific drawer is currently open
   */
  const isDrawerOpen = useCallback(
    (name: DrawerName): boolean => {
      return currentDrawer === name
    },
    [currentDrawer]
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
