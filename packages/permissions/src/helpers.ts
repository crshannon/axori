/**
 * @axori/permissions - Permission checking helper functions
 *
 * This module provides utility functions for checking user permissions
 * at both the portfolio and property levels. These functions should be
 * used in both API routes and UI components to ensure consistent
 * permission enforcement.
 */

import type { PropertyAccess, PropertyAccessPermission } from "@axori/db";
import {
  PortfolioRole,
  PropertyPermission,
  PortfolioAction,
  PORTFOLIO_ROLES,
  ROLE_DEFAULT_PERMISSIONS,
  ROLE_HIERARCHY,
  PORTFOLIO_ROLE_ACTIONS,
} from "./constants";

// ============================================================================
// Role Hierarchy Helpers
// ============================================================================

/**
 * Get the numeric rank of a role (higher = more privileged).
 * owner: 3, admin: 2, member: 1, viewer: 0
 */
export function getRoleRank(role: PortfolioRole): number {
  const index = PORTFOLIO_ROLES.indexOf(role);
  return PORTFOLIO_ROLES.length - 1 - index;
}

/**
 * Check if roleA is higher than roleB in the hierarchy.
 * Returns true if roleA has more privileges than roleB.
 */
export function isRoleHigherThan(roleA: PortfolioRole, roleB: PortfolioRole): boolean {
  return getRoleRank(roleA) > getRoleRank(roleB);
}

/**
 * Check if roleA is equal to or higher than roleB in the hierarchy.
 */
export function isRoleAtLeast(role: PortfolioRole, minimumRole: PortfolioRole): boolean {
  return getRoleRank(role) >= getRoleRank(minimumRole);
}

/**
 * Check if a user with a given role can manage users with a target role.
 * A user can only manage roles that are strictly below them in the hierarchy.
 */
export function canManageRole(userRole: PortfolioRole, targetRole: PortfolioRole): boolean {
  return ROLE_HIERARCHY[userRole].includes(targetRole);
}

/**
 * Get all roles that a user with the given role can assign to others.
 */
export function getAssignableRoles(userRole: PortfolioRole): PortfolioRole[] {
  return ROLE_HIERARCHY[userRole];
}

// ============================================================================
// Portfolio Permission Helpers
// ============================================================================

/**
 * Check if a user with a given role can perform a specific portfolio action.
 */
export function canPerformPortfolioAction(
  role: PortfolioRole,
  action: PortfolioAction
): boolean {
  return PORTFOLIO_ROLE_ACTIONS[role].includes(action);
}

/**
 * Get all portfolio actions a user with the given role can perform.
 */
export function getAllowedPortfolioActions(role: PortfolioRole): PortfolioAction[] {
  return [...PORTFOLIO_ROLE_ACTIONS[role]];
}

/**
 * Check if a user can invite members to a portfolio.
 */
export function canInviteMembers(role: PortfolioRole): boolean {
  return canPerformPortfolioAction(role, "invite_members");
}

/**
 * Check if a user can remove members from a portfolio.
 */
export function canRemoveMembers(role: PortfolioRole): boolean {
  return canPerformPortfolioAction(role, "remove_members");
}

/**
 * Check if a user can delete the portfolio.
 */
export function canDeletePortfolio(role: PortfolioRole): boolean {
  return canPerformPortfolioAction(role, "delete_portfolio");
}

/**
 * Check if a user can edit portfolio settings.
 */
export function canEditPortfolio(role: PortfolioRole): boolean {
  return canPerformPortfolioAction(role, "edit_portfolio");
}

/**
 * Check if a user can add properties to the portfolio.
 */
export function canAddProperties(role: PortfolioRole): boolean {
  return canPerformPortfolioAction(role, "add_properties");
}

/**
 * Check if a user can view the audit log.
 */
export function canViewAuditLog(role: PortfolioRole): boolean {
  return canPerformPortfolioAction(role, "view_audit_log");
}

/**
 * Check if a user can manage billing for the portfolio.
 * Only owners can manage billing settings.
 */
export function canManageBilling(role: PortfolioRole): boolean {
  return canPerformPortfolioAction(role, "manage_billing");
}

// ============================================================================
// High-Level Permission Checks (Convenience Functions)
// ============================================================================

/**
 * Check if a user has viewing permission based on their role.
 * All roles can view (viewer is the minimum role).
 */
export function canView(role: PortfolioRole): boolean {
  return isRoleAtLeast(role, "viewer");
}

/**
 * Check if a user has editing permission based on their role.
 * Members and above can edit.
 */
export function canEdit(role: PortfolioRole): boolean {
  return isRoleAtLeast(role, "member");
}

/**
 * Check if a user has admin-level permission based on their role.
 * Admins and owners have admin permissions.
 */
export function canAdmin(role: PortfolioRole): boolean {
  return isRoleAtLeast(role, "admin");
}

// ============================================================================
// Property Permission Helpers
// ============================================================================

/**
 * Get the effective property permissions for a user based on their role
 * and optional property-level access restrictions.
 *
 * @param role - The user's portfolio role
 * @param propertyId - The property to check access for
 * @param propertyAccess - Optional property-level access restrictions (from userPortfolios.propertyAccess)
 * @returns Array of permissions the user has for the property
 */
export function getPropertyPermissions(
  role: PortfolioRole,
  propertyId: string,
  propertyAccess: PropertyAccess
): PropertyPermission[] {
  // If propertyAccess is null, use default role-based permissions
  if (propertyAccess === null) {
    return [...ROLE_DEFAULT_PERMISSIONS[role]];
  }

  // If propertyAccess is defined but property not in the map, user has no access
  const propertyPermissions = propertyAccess[propertyId];
  if (!propertyPermissions) {
    return [];
  }

  // Return the intersection of role default permissions and property-specific permissions
  // This ensures users can't have more permissions than their role allows
  const rolePermissions = ROLE_DEFAULT_PERMISSIONS[role];
  return propertyPermissions.filter((p): p is PropertyPermission =>
    rolePermissions.includes(p as PropertyPermission)
  );
}

/**
 * Check if a user has a specific permission on a property.
 *
 * @param role - The user's portfolio role
 * @param propertyId - The property to check access for
 * @param permission - The permission to check
 * @param propertyAccess - Optional property-level access restrictions
 * @returns True if the user has the permission
 */
export function hasPropertyPermission(
  role: PortfolioRole,
  propertyId: string,
  permission: PropertyPermission,
  propertyAccess: PropertyAccess
): boolean {
  const permissions = getPropertyPermissions(role, propertyId, propertyAccess);
  return permissions.includes(permission);
}

/**
 * Check if a user can view a property.
 */
export function canViewProperty(
  role: PortfolioRole,
  propertyId: string,
  propertyAccess: PropertyAccess
): boolean {
  return hasPropertyPermission(role, propertyId, "view", propertyAccess);
}

/**
 * Check if a user can edit a property.
 */
export function canEditProperty(
  role: PortfolioRole,
  propertyId: string,
  propertyAccess: PropertyAccess
): boolean {
  return hasPropertyPermission(role, propertyId, "edit", propertyAccess);
}

/**
 * Check if a user can manage a property (update settings, etc.).
 */
export function canManageProperty(
  role: PortfolioRole,
  propertyId: string,
  propertyAccess: PropertyAccess
): boolean {
  return hasPropertyPermission(role, propertyId, "manage", propertyAccess);
}

/**
 * Check if a user can delete a property.
 */
export function canDeleteProperty(
  role: PortfolioRole,
  propertyId: string,
  propertyAccess: PropertyAccess
): boolean {
  return hasPropertyPermission(role, propertyId, "delete", propertyAccess);
}

/**
 * Check if a user has access to any properties in the portfolio.
 * Returns true if propertyAccess is null (full access) or has at least one property.
 */
export function hasAnyPropertyAccess(propertyAccess: PropertyAccess): boolean {
  if (propertyAccess === null) {
    return true;
  }
  return Object.keys(propertyAccess).length > 0;
}

/**
 * Get all property IDs a user has access to.
 * Returns null if the user has full access (no restrictions).
 */
export function getAccessiblePropertyIds(propertyAccess: PropertyAccess): string[] | null {
  if (propertyAccess === null) {
    return null; // Full access
  }
  return Object.keys(propertyAccess);
}

// ============================================================================
// Permission Context Types
// ============================================================================

/**
 * User permission context - contains all information needed to check permissions.
 * This should be built from the userPortfolios record and passed to permission checks.
 */
export interface PermissionContext {
  userId: string;
  portfolioId: string;
  role: PortfolioRole;
  propertyAccess: PropertyAccess;
}

/**
 * Check all permissions for a user in a single call.
 * Useful for building UI permission states.
 */
export interface PermissionCheckResult {
  // Portfolio-level permissions
  canViewPortfolio: boolean;
  canEditPortfolio: boolean;
  canDeletePortfolio: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canChangeRoles: boolean;
  canAddProperties: boolean;
  canViewAuditLog: boolean;
  canManageBilling: boolean;

  // High-level role-based permissions
  canView: boolean;
  canEdit: boolean;
  canAdmin: boolean;

  // Role hierarchy
  assignableRoles: PortfolioRole[];

  // Property access type
  hasFullPropertyAccess: boolean;
  accessiblePropertyIds: string[] | null;
}

/**
 * Build a complete permission check result for a user.
 * Useful for passing permission state to UI components.
 */
export function buildPermissionCheckResult(context: PermissionContext): PermissionCheckResult {
  const { role, propertyAccess } = context;

  return {
    // Portfolio-level permissions
    canViewPortfolio: canPerformPortfolioAction(role, "view_portfolio"),
    canEditPortfolio: canPerformPortfolioAction(role, "edit_portfolio"),
    canDeletePortfolio: canPerformPortfolioAction(role, "delete_portfolio"),
    canInviteMembers: canPerformPortfolioAction(role, "invite_members"),
    canRemoveMembers: canPerformPortfolioAction(role, "remove_members"),
    canChangeRoles: canPerformPortfolioAction(role, "change_member_roles"),
    canAddProperties: canPerformPortfolioAction(role, "add_properties"),
    canViewAuditLog: canPerformPortfolioAction(role, "view_audit_log"),
    canManageBilling: canPerformPortfolioAction(role, "manage_billing"),

    // High-level role-based permissions
    canView: canView(role),
    canEdit: canEdit(role),
    canAdmin: canAdmin(role),

    // Role hierarchy
    assignableRoles: getAssignableRoles(role),

    // Property access type
    hasFullPropertyAccess: propertyAccess === null,
    accessiblePropertyIds: getAccessiblePropertyIds(propertyAccess),
  };
}

// ============================================================================
// Property Permission Check for Specific Property
// ============================================================================

/**
 * Check all property permissions for a user on a specific property.
 */
export interface PropertyPermissionCheckResult {
  propertyId: string;
  canView: boolean;
  canEdit: boolean;
  canManage: boolean;
  canDelete: boolean;
  permissions: PropertyPermission[];
}

/**
 * Build a complete property permission check result.
 */
export function buildPropertyPermissionCheckResult(
  context: PermissionContext,
  propertyId: string
): PropertyPermissionCheckResult {
  const { role, propertyAccess } = context;
  const permissions = getPropertyPermissions(role, propertyId, propertyAccess);

  return {
    propertyId,
    canView: permissions.includes("view"),
    canEdit: permissions.includes("edit"),
    canManage: permissions.includes("manage"),
    canDelete: permissions.includes("delete"),
    permissions,
  };
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if a value is a valid portfolio role.
 */
export function isValidRole(role: string): role is PortfolioRole {
  return PORTFOLIO_ROLES.includes(role as PortfolioRole);
}

/**
 * Validate and parse a role string, returning the role or undefined.
 */
export function parseRole(role: string | null | undefined): PortfolioRole | undefined {
  if (role && isValidRole(role)) {
    return role;
  }
  return undefined;
}

/**
 * Check if a value is a valid property permission.
 */
export function isValidPropertyPermission(permission: string): permission is PropertyPermission {
  return ["view", "edit", "manage", "delete"].includes(permission);
}

/**
 * Validate property access configuration.
 * Returns true if the configuration is valid.
 */
export function isValidPropertyAccess(propertyAccess: unknown): propertyAccess is PropertyAccess {
  if (propertyAccess === null) {
    return true;
  }

  if (typeof propertyAccess !== "object" || Array.isArray(propertyAccess)) {
    return false;
  }

  const access = propertyAccess as Record<string, unknown>;
  for (const [propertyId, permissions] of Object.entries(access)) {
    if (typeof propertyId !== "string") {
      return false;
    }
    if (!Array.isArray(permissions)) {
      return false;
    }
    for (const permission of permissions) {
      if (!isValidPropertyPermission(permission as string)) {
        return false;
      }
    }
  }

  return true;
}
