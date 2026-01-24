/**
 * DrawerProvider
 *
 * Root-level provider that manages drawer state via URL search params.
 * Handles lazy loading, permission checking, and error boundaries for drawers.
 *
 * @see AXO-93 - URL-Based Drawer Factory
 *
 * @example
 * ```tsx
 * // In __root.tsx or _authed.tsx
 * <DrawerProvider>
 *   <App />
 * </DrawerProvider>
 *
 * // Then anywhere in the app:
 * const { openDrawer } = useDrawer()
 * openDrawer('add-loan', { propertyId: 'prop_123' })
 * ```
 */

import * as React from 'react'
import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouterState, useNavigate } from '@tanstack/react-router'
import { Loading } from '@axori/ui'
import { canEdit, canView, canAdmin } from '@axori/permissions'
import type { PortfolioRole } from '@axori/permissions'
import { usePermissions } from '@/hooks/api/usePermissions'
import { useProperty } from '@/hooks/api/useProperties'
import { toast } from '@/lib/toast'
import {
  type DrawerName,
  type DrawerPermission,
  getDrawerEntry,
  isValidDrawerName,
  validateDrawerParams,
} from './registry'

// =============================================================================
// CONTEXT
// =============================================================================

interface DrawerContextValue {
  /** Close the current drawer */
  closeDrawer: () => void
}

const DrawerContext = createContext<DrawerContextValue | null>(null)

/**
 * Internal hook to access drawer context
 * Used by drawer components to get the close function
 */
export function useDrawerContext(): DrawerContextValue {
  const context = useContext(DrawerContext)
  if (!context) {
    throw new Error('useDrawerContext must be used within DrawerProvider')
  }
  return context
}

// =============================================================================
// PERMISSION HELPERS
// =============================================================================

/**
 * Check if the user has the required permission level
 */
function hasRequiredPermission(
  userRole: PortfolioRole | null,
  required: DrawerPermission
): boolean {
  // 'none' means any authenticated user can access
  if (required === 'none') {
    return true
  }

  // No role means no access
  if (!userRole) {
    return false
  }

  // Check permission based on required level
  switch (required) {
    case 'viewer':
      return canView(userRole)
    case 'member':
      return canEdit(userRole)
    case 'admin':
      return canAdmin(userRole)
    case 'owner':
      return userRole === 'owner'
    default:
      return false
  }
}

// =============================================================================
// LOADING FALLBACK
// =============================================================================

function DrawerLoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-8 shadow-2xl">
        <Loading size="lg" />
        <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
          Loading...
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// ERROR BOUNDARY
// =============================================================================

interface DrawerErrorBoundaryProps {
  children: ReactNode
  onError: () => void
}

interface DrawerErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class DrawerErrorBoundary extends React.Component<
  DrawerErrorBoundaryProps,
  DrawerErrorBoundaryState
> {
  constructor(props: DrawerErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): DrawerErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[DrawerErrorBoundary] Drawer failed to load:', error, errorInfo)
    this.props.onError()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-8 shadow-2xl max-w-md text-center">
            <p className="text-lg font-bold text-red-500 dark:text-red-400">
              Failed to load drawer
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={this.props.onError}
              className="mt-4 px-6 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}


// =============================================================================
// DRAWER RENDERER
// =============================================================================

interface DrawerRendererProps {
  drawerName: DrawerName
  params: Record<string, unknown>
  onClose: () => void
}

/**
 * Renders the appropriate drawer component based on the drawer name
 */
function DrawerRendererInner({ drawerName, params, onClose }: DrawerRendererProps) {
  const entry = getDrawerEntry(drawerName)

  if (!entry) {
    console.error(`[DrawerRenderer] Unknown drawer: ${drawerName}`)
    return null
  }

  // Validate params
  const validatedParams = validateDrawerParams(drawerName, params)
  if (!validatedParams) {
    console.error(`[DrawerRenderer] Invalid params for drawer: ${drawerName}`)
    onClose()
    return null
  }

  // Get the lazy component
  const DrawerComponent = entry.component

  // Build props for the drawer component
  // All drawers receive isOpen=true and onClose, plus their specific params
  const drawerProps = {
    isOpen: true,
    onClose,
    ...validatedParams,
  }

  return <DrawerComponent {...drawerProps} />
}

// =============================================================================
// PERMISSION GATE
// =============================================================================

interface PermissionGateProps {
  drawerName: DrawerName
  params: Record<string, unknown>
  children: ReactNode
  onDenied: () => void
}

/**
 * Checks permissions before rendering the drawer
 */
function PermissionGate({ drawerName, params, children, onDenied }: PermissionGateProps) {
  const entry = getDrawerEntry(drawerName)
  const propertyId = params.propertyId as string | undefined
  const [permissionChecked, setPermissionChecked] = useState(false)

  // Get property to find portfolioId (only if we have a propertyId)
  const { data: property, isLoading: isLoadingProperty, error: propertyError } = useProperty(
    propertyId || null
  )

  // Get user permissions for the portfolio
  const portfolioId = property?.portfolioId || null
  const { role, isLoading: isLoadingPermissions } = usePermissions(portfolioId)

  // Determine if we're still loading
  const isLoading = (propertyId && isLoadingProperty) || (portfolioId && isLoadingPermissions)

  // Check permissions once loaded
  useEffect(() => {
    // Still loading - don't make a decision yet
    if (isLoading) {
      return
    }

    // If drawer requires a property but there was an error loading it
    if (propertyId && propertyError) {
      console.warn(`[PermissionGate] Error loading property: ${propertyId}`, propertyError)
      toast.error('Failed to load property')
      onDenied()
      return
    }

    // If drawer requires a property but we couldn't find it
    if (propertyId && !property && !isLoadingProperty) {
      console.warn(`[PermissionGate] Property not found: ${propertyId}`)
      toast.error('Property not found')
      onDenied()
      return
    }

    // Check permission requirement
    if (entry && !hasRequiredPermission(role, entry.permission)) {
      console.warn(
        `[PermissionGate] Access denied to drawer "${drawerName}". ` +
          `Required: ${entry.permission}, User role: ${role || 'none'}`
      )
      toast.warning(`You don't have permission to access ${entry.displayName}`)
      onDenied()
      return
    }

    // Permission check passed
    setPermissionChecked(true)
  }, [
    drawerName,
    entry,
    isLoading,
    isLoadingProperty,
    onDenied,
    property,
    propertyError,
    propertyId,
    role,
  ])

  // Show loading while checking permissions
  if (isLoading || !permissionChecked) {
    return <DrawerLoadingFallback />
  }

  // If no entry, something is wrong - don't render
  if (!entry) {
    return null
  }

  return <>{children}</>
}

// =============================================================================
// DRAWER RENDERER (PUBLIC)
// =============================================================================

/**
 * DrawerRenderer - Renders the current drawer based on URL state
 *
 * This component reads the current URL search params and renders
 * the appropriate drawer with lazy loading and permission checks.
 *
 * Should be placed within DrawerProvider but can be placed anywhere
 * in the component tree for flexibility.
 */
export function DrawerRenderer() {
  const navigate = useNavigate()
  const routerState = useRouterState()

  // Extract drawer state from URL
  const currentSearch = useMemo(() => {
    return (routerState.location.search || {}) as Record<string, unknown>
  }, [routerState.location.search])

  const drawerName = useMemo((): DrawerName | null => {
    const name = currentSearch.drawer
    if (typeof name === 'string' && isValidDrawerName(name)) {
      return name
    }
    return null
  }, [currentSearch.drawer])

  // Extract params (everything except 'drawer')
  const params = useMemo((): Record<string, unknown> => {
    const { drawer: _, ...rest } = currentSearch
    return rest
  }, [currentSearch])

  // Close drawer by clearing URL params
  const closeDrawer = useCallback(() => {
    navigate({
      // Clear all drawer-related params by setting them to undefined
      search: {
        drawer: undefined,
        propertyId: undefined,
        loanId: undefined,
        transactionId: undefined,
        bankAccountId: undefined,
      } as any,
      replace: true,
    })
  }, [navigate])

  // Handle error by closing drawer
  const handleError = useCallback(() => {
    toast.error('Failed to load drawer')
    closeDrawer()
  }, [closeDrawer])

  // If no drawer is open, render nothing
  if (!drawerName) {
    return null
  }

  return (
    <DrawerContext.Provider value={{ closeDrawer }}>
      <DrawerErrorBoundary onError={handleError}>
        <Suspense fallback={<DrawerLoadingFallback />}>
          <PermissionGate
            drawerName={drawerName}
            params={params}
            onDenied={closeDrawer}
          >
            <DrawerRendererInner
              drawerName={drawerName}
              params={params}
              onClose={closeDrawer}
            />
          </PermissionGate>
        </Suspense>
      </DrawerErrorBoundary>
    </DrawerContext.Provider>
  )
}

// =============================================================================
// DRAWER PROVIDER
// =============================================================================

interface DrawerProviderProps {
  children: ReactNode
}

/**
 * DrawerProvider - Root-level provider for drawer management
 *
 * Wraps the application and provides the DrawerRenderer.
 * Should be placed at the root level of your app.
 */
export function DrawerProvider({ children }: DrawerProviderProps) {
  return (
    <>
      {children}
      <DrawerRenderer />
    </>
  )
}
