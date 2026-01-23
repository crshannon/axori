/**
 * @axori/permissions
 *
 * Role-based access control (RBAC) system for Axori.
 *
 * This package provides:
 * - Role definitions and permission constants
 * - Permission checking helper functions
 * - Types for property-level access control
 *
 * @example
 * ```typescript
 * import {
 *   PortfolioRole,
 *   PORTFOLIO_ROLES,
 *   canViewProperty,
 *   canEditPortfolio,
 *   buildPermissionCheckResult,
 * } from "@axori/permissions";
 *
 * // Check if a user can view a property
 * const canView = canViewProperty("member", propertyId, propertyAccess);
 *
 * // Build complete permission state for UI
 * const permissions = buildPermissionCheckResult({
 *   userId: "user-id",
 *   portfolioId: "portfolio-id",
 *   role: "admin",
 *   propertyAccess: null,
 * });
 * ```
 */

// Export all constants
export {
  // Types
  type PortfolioRole,
  type PropertyPermission,
  type PortfolioAction,
  type RoleOption,
  type PermissionOption,
  // Re-exported from @axori/db
  type PropertyAccess,
  type PropertyAccessPermission,
  // Role constants
  PORTFOLIO_ROLES,
  PORTFOLIO_ROLE_LABELS,
  PORTFOLIO_ROLE_DESCRIPTIONS,
  ROLE_HIERARCHY,
  // Property permission constants
  PROPERTY_PERMISSIONS,
  PROPERTY_PERMISSION_LABELS,
  PROPERTY_PERMISSION_DESCRIPTIONS,
  // Role-to-permission mapping
  ROLE_DEFAULT_PERMISSIONS,
  // Portfolio action constants
  PORTFOLIO_ROLE_ACTIONS,
  PORTFOLIO_ACTION_LABELS,
  // UI options
  PORTFOLIO_ROLE_OPTIONS,
  PROPERTY_PERMISSION_OPTIONS,
} from "./constants";

// Export all helper functions
export {
  // Types
  type PermissionContext,
  type PermissionCheckResult,
  type PropertyPermissionCheckResult,
  type UserPortfolioRecord,
  // Role hierarchy helpers
  getRoleRank,
  isRoleHigherThan,
  isRoleAtLeast,
  canManageRole,
  getAssignableRoles,
  // Portfolio permission helpers
  canPerformPortfolioAction,
  getAllowedPortfolioActions,
  canInviteMembers,
  canRemoveMembers,
  canDeletePortfolio,
  canEditPortfolio,
  canAddProperties,
  canViewAuditLog,
  canManageBilling,
  // High-level permission checks (convenience functions)
  canView,
  canEdit,
  canAdmin,
  // Property permission helpers (in-memory)
  getPropertyPermissions,
  hasPropertyPermission,
  canViewProperty,
  canEditProperty,
  canManageProperty,
  canDeleteProperty,
  hasAnyPropertyAccess,
  getAccessiblePropertyIds,
  // Permission context builders
  buildPermissionCheckResult,
  buildPropertyPermissionCheckResult,
  // Validation helpers
  isValidRole,
  parseRole,
  isValidPropertyPermission,
  isValidPropertyAccess,
  // Database-aware permission checking utilities (API)
  getUserRole,
  checkPermission,
  getUserPortfolioMembership,
  getAccessiblePropertyIdsForUser,
  hasPropertyAccessForUser,
  checkPropertyPermission,
  buildPermissionContextFromDb,
} from "./helpers";
