/**
 * Permission Helpers for Drawer System
 *
 * Centralized permission checking logic for the drawer factory.
 * Inlined to avoid @axori/permissions -> @axori/db dependency chain.
 *
 * @see AXO-93 - URL-Based Drawer Factory
 * @see AXO-121 - Drawer Factory Unit Tests
 */

import type { DrawerPermission } from './registry'

/**
 * Portfolio roles from least to most privileged
 */
export type PortfolioRole = 'viewer' | 'member' | 'admin' | 'owner'

/**
 * Role hierarchy from most to least privileged
 */
export const PORTFOLIO_ROLES: ReadonlyArray<PortfolioRole> = [
  'owner',
  'admin',
  'member',
  'viewer',
] as const

/**
 * Get the numeric rank of a role (higher = more privileged)
 * Owner = 3, Admin = 2, Member = 1, Viewer = 0
 */
export function getRoleRank(role: PortfolioRole): number {
  const index = PORTFOLIO_ROLES.indexOf(role)
  return PORTFOLIO_ROLES.length - 1 - index
}

/**
 * Check if role is at least the minimum required role
 */
export function isRoleAtLeast(role: PortfolioRole, minimumRole: PortfolioRole): boolean {
  return getRoleRank(role) >= getRoleRank(minimumRole)
}

/**
 * Check if user can view (viewer+)
 */
export function canView(role: PortfolioRole): boolean {
  return isRoleAtLeast(role, 'viewer')
}

/**
 * Check if user can edit (member+)
 */
export function canEdit(role: PortfolioRole): boolean {
  return isRoleAtLeast(role, 'member')
}

/**
 * Check if user is admin (admin+)
 */
export function canAdmin(role: PortfolioRole): boolean {
  return isRoleAtLeast(role, 'admin')
}

/**
 * Check if user is owner
 */
export function isOwner(role: PortfolioRole): boolean {
  return role === 'owner'
}

/**
 * Check if the user has the required permission level for a drawer
 *
 * @param userRole - The user's current portfolio role, or null if unauthenticated
 * @param required - The required permission level for the drawer
 * @returns true if access is allowed, false if denied
 *
 * Permission levels:
 * - 'none': Any authenticated user can access (no role check)
 * - 'viewer': User must be at least a viewer
 * - 'member': User must be at least a member (can edit)
 * - 'admin': User must be at least an admin
 * - 'owner': User must be the owner
 */
export function hasRequiredPermission(
  userRole: PortfolioRole | null,
  required: DrawerPermission
): boolean {
  // 'none' means any authenticated user can access (still need to be authenticated)
  if (required === 'none') {
    return true
  }

  // No role means no access (unauthenticated or not a member)
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
      return isOwner(userRole)
    default:
      // Unknown permission type - deny access
      return false
  }
}

/**
 * Check if user has all required permissions (AND logic)
 *
 * @param userRole - The user's current portfolio role
 * @param requiredPermissions - Array of required permission levels
 * @returns true if user has ALL required permissions
 */
export function hasAllRequiredPermissions(
  userRole: PortfolioRole | null,
  requiredPermissions: DrawerPermission[]
): boolean {
  if (requiredPermissions.length === 0) {
    return true
  }

  return requiredPermissions.every((permission) =>
    hasRequiredPermission(userRole, permission)
  )
}

/**
 * Check if user has any of the required permissions (OR logic)
 *
 * @param userRole - The user's current portfolio role
 * @param requiredPermissions - Array of permission levels (any one is sufficient)
 * @returns true if user has AT LEAST ONE of the required permissions
 */
export function hasAnyRequiredPermission(
  userRole: PortfolioRole | null,
  requiredPermissions: DrawerPermission[]
): boolean {
  if (requiredPermissions.length === 0) {
    return true
  }

  return requiredPermissions.some((permission) =>
    hasRequiredPermission(userRole, permission)
  )
}
