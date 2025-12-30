import { Building, Compass, Layers, LayoutDashboard } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { FileRouteTypes } from '../routeTree.gen'

/**
 * Extract navigation routes from TanStack Router types
 * Only includes authenticated navigation routes (not public/demo routes)
 */
type NavRoutePath = Extract<
  FileRouteTypes['fullPaths'],
  '/dashboard' | '/wealth-journey' | '/explore' | '/property-hub'
>

/**
 * Navigation item configuration
 * Each item can be enabled/disabled via feature flags (PostHog)
 */
export interface NavItem {
  /** Unique identifier for the navigation item */
  id: string
  /** Route path (typed from TanStack Router) */
  path: NavRoutePath
  /** Icon component */
  icon: LucideIcon
  /** Whether this nav item is enabled (default: true) */
  enabled?: boolean
  /** PostHog feature flag key (optional, for future integration) */
  featureFlag?: string
  /** Display label (optional, for future use) */
  label?: string
}

/**
 * Base navigation items configuration
 * These can be filtered/enabled via feature flags
 */
export const NAV_ITEMS: Array<NavItem> = [
  {
    id: 'dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    enabled: true,
    featureFlag: 'nav-dashboard',
  },
  {
    id: 'property-hub',
    path: '/property-hub',
    icon: Building,
    enabled: true,
    featureFlag: 'nav-property-hub',
  },
  {
    id: 'wealth-journey',
    path: '/wealth-journey',
    icon: Layers,
    enabled: true,
    featureFlag: 'nav-wealth-journey',
  },
  {
    id: 'explore',
    path: '/explore',
    icon: Compass,
    enabled: true,
    featureFlag: 'nav-explore',
  }
] as const

/**
 * Hook/function to get enabled navigation items
 * This can be extended to integrate with PostHog feature flags
 *
 * @example
 * ```ts
 * // With PostHog integration (future):
 * import { useFeatureFlagEnabled } from 'posthog-js/react'
 *
 * const featureFlags = {
 *   'nav-explore': useFeatureFlagEnabled('nav-explore'),
 *   'nav-property-hub': useFeatureFlagEnabled('nav-property-hub'),
 * }
 * const navItems = getEnabledNavItems(featureFlags)
 * ```
 *
 * @param featureFlags - Optional feature flags from PostHog
 * @returns Array of enabled nav items
 */
export function getEnabledNavItems(
  featureFlags?: Record<string, boolean>,
): Array<NavItem> {
  return NAV_ITEMS.filter((item) => {
    // If feature flags are provided, check the feature flag first
    if (featureFlags && item.featureFlag) {
      const flagValue = featureFlags[item.featureFlag]
      // If flag is explicitly false, disable the item
      if (flagValue === false) {
        return false
      }
      // If flag is true or undefined, check item.enabled
      // Continue to next check
    }

    // Check if item is explicitly disabled
    if (item.enabled === false) {
      return false
    }

    // Default to enabled (enabled is true or undefined)
    return true
  })
}

/**
 * Get a navigation item by its ID
 */
export function getNavItemById(id: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.id === id)
}

/**
 * Get a navigation item by its path
 */
export function getNavItemByPath(
  path: string,
): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.path === path)
}

