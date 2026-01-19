import {
  BarChart3,
  Brain,
  Building,
  Compass,
  DollarSign,
  FileText,
  Layers,
  LayoutDashboard,
  MessageCircle,
  Settings,
  ShieldCheck,
} from 'lucide-react'
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

/**
 * Property Details Tab Item configuration
 * Similar to NavItem but for property detail page tabs
 */
export interface TabItem {
  /** Unique identifier for the tab */
  id: string
  /** Display label */
  label: string
  /** Icon component */
  icon: LucideIcon
  /** Route path segment (will be combined with propertyId) */
  pathSegment: string
  /** Whether this tab is enabled (default: true) */
  enabled?: boolean
  /** PostHog feature flag key (optional, for future integration) */
  featureFlag?: string
}

/**
 * Base property details tabs configuration
 * These can be filtered/enabled via feature flags
 */
export const TAB_ITEMS: Array<TabItem> = [
  {
    id: 'overview',
    label: 'Overview',
    icon: BarChart3,
    pathSegment: '',
    enabled: true,
    featureFlag: 'tab-overview',
  },
  {
    id: 'financials',
    label: 'Financials',
    icon: DollarSign,
    pathSegment: 'financials',
    enabled: true,
    featureFlag: 'tab-financials',
  },
  {
    id: 'management',
    label: 'Management',
    icon: ShieldCheck,
    pathSegment: 'management',
    enabled: true,
    featureFlag: 'tab-management',
  },
  {
    id: 'communications',
    label: 'Communications',
    icon: MessageCircle,
    pathSegment: 'communications',
    enabled: true,
    featureFlag: 'tab-communications',
  },
  {
    id: 'legal',
    label: 'Legal',
    icon: FileText,
    pathSegment: 'legal',
    enabled: true,
    featureFlag: 'tab-legal',
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    pathSegment: 'documents',
    enabled: true,
    featureFlag: 'tab-documents',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    pathSegment: 'analytics',
    enabled: true,
    featureFlag: 'tab-analytics',
  },
  {
    id: 'strategy',
    label: 'Strategy',
    icon: Brain,
    pathSegment: 'strategy',
    enabled: true,
    featureFlag: 'tab-strategy',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    pathSegment: 'settings',
    enabled: true,
    featureFlag: 'tab-settings',
  },
] as const

/**
 * Generate property detail tabs with propertyId
 * This function combines the static TAB_ITEMS with a propertyId to create full paths
 *
 * @param propertyId - The property ID to generate paths for
 * @param featureFlags - Optional feature flags from PostHog
 * @returns Array of tab items with full paths
 */
export function getPropertyDetailTabs(
  propertyId: string,
  featureFlags?: Record<string, boolean>,
): Array<{
  id: string
  label: string
  path: string
  icon: LucideIcon
}> {
  return TAB_ITEMS.filter((item) => {
    // If feature flags are provided, check the feature flag first
    if (featureFlags && item.featureFlag) {
      const flagValue = featureFlags[item.featureFlag]
      // If flag is explicitly false, disable the item
      if (flagValue === false) {
        return false
      }
    }

    // Check if item is explicitly disabled
    if (item.enabled === false) {
      return false
    }

    // Default to enabled (enabled is true or undefined)
    return true
  }).map((item) => ({
    id: item.id,
    label: item.label,
    path: item.pathSegment
      ? `/property-hub/${propertyId}/${item.pathSegment}`
      : `/property-hub/${propertyId}`,
    icon: item.icon,
  }))
}

