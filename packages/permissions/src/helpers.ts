/**
 * @axori/permissions - Permission checking helper functions
 *
 * This module provides utility functions for checking user permissions
 * at both the portfolio and property levels. These functions should be
 * used in both API routes and UI components to ensure consistent
 * permission enforcement.
 *
 * Database-aware functions (checkPermission, getUserRole, etc.) query
 * the database directly using Drizzle ORM patterns.
 */

import type { PropertyAccess } from "@axori/db";
import { db, userPortfolios, properties, eq, and } from "@axori/db";
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

// ============================================================================
// Database-Aware Permission Checking Utilities
// ============================================================================

/**
 * User portfolio membership record returned from database queries.
 */
export interface UserPortfolioRecord {
  id: string;
  userId: string;
  portfolioId: string;
  role: PortfolioRole;
  propertyAccess: PropertyAccess;
  invitedBy: string | null;
  invitedAt: Date | null;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get the user's role in a portfolio.
 * Queries the userPortfolios table to find the user's membership.
 *
 * @param userId - The user's UUID
 * @param portfolioId - The portfolio's UUID
 * @returns The user's role in the portfolio, or null if not a member
 *
 * @example
 * ```typescript
 * const role = await getUserRole(userId, portfolioId);
 * if (role === null) {
 *   // User is not a member of this portfolio
 * }
 * ```
 */
export async function getUserRole(
  userId: string,
  portfolioId: string
): Promise<PortfolioRole | null> {
  const [membership] = await db
    .select({
      role: userPortfolios.role,
    })
    .from(userPortfolios)
    .where(
      and(
        eq(userPortfolios.userId, userId),
        eq(userPortfolios.portfolioId, portfolioId)
      )
    )
    .limit(1);

  if (!membership) {
    return null;
  }

  // Validate the role is a valid PortfolioRole
  if (!isValidRole(membership.role)) {
    return null;
  }

  return membership.role as PortfolioRole;
}

/**
 * Check if a user has at least the required role in a portfolio.
 * Uses role hierarchy to determine if the user's role meets the requirement.
 *
 * @param userId - The user's UUID
 * @param portfolioId - The portfolio's UUID
 * @param requiredRole - The minimum role required
 * @returns True if the user has the required role or higher
 *
 * @example
 * ```typescript
 * // Check if user is at least a member
 * const canEdit = await checkPermission(userId, portfolioId, "member");
 *
 * // Check if user is an admin or owner
 * const canManageMembers = await checkPermission(userId, portfolioId, "admin");
 * ```
 */
export async function checkPermission(
  userId: string,
  portfolioId: string,
  requiredRole: PortfolioRole
): Promise<boolean> {
  const userRole = await getUserRole(userId, portfolioId);

  if (userRole === null) {
    return false;
  }

  return isRoleAtLeast(userRole, requiredRole);
}

/**
 * Get the user's full portfolio membership record.
 * Useful when you need both role and propertyAccess.
 *
 * @param userId - The user's UUID
 * @param portfolioId - The portfolio's UUID
 * @returns The full membership record, or null if not a member
 */
export async function getUserPortfolioMembership(
  userId: string,
  portfolioId: string
): Promise<UserPortfolioRecord | null> {
  const [membership] = await db
    .select()
    .from(userPortfolios)
    .where(
      and(
        eq(userPortfolios.userId, userId),
        eq(userPortfolios.portfolioId, portfolioId)
      )
    )
    .limit(1);

  if (!membership) {
    return null;
  }

  // Cast to our expected type (role should be valid from DB)
  return membership as unknown as UserPortfolioRecord;
}

/**
 * Get all property IDs that a user can access in a portfolio.
 * Takes into account both role-based access and property-level restrictions.
 *
 * @param userId - The user's UUID
 * @param portfolioId - The portfolio's UUID
 * @returns Array of property IDs the user can access. Empty array if user has
 *          no access or is not a member. Returns all portfolio properties if
 *          user has full access (no property restrictions).
 *
 * @example
 * ```typescript
 * const propertyIds = await getAccessiblePropertyIdsForUser(userId, portfolioId);
 * // Filter queries to only these properties
 * ```
 */
export async function getAccessiblePropertyIdsForUser(
  userId: string,
  portfolioId: string
): Promise<string[]> {
  const membership = await getUserPortfolioMembership(userId, portfolioId);

  if (!membership) {
    return [];
  }

  // If propertyAccess is null, user has full access - get all portfolio properties
  if (membership.propertyAccess === null) {
    const portfolioProperties = await db
      .select({
        id: properties.id,
      })
      .from(properties)
      .where(eq(properties.portfolioId, portfolioId));

    return portfolioProperties.map((p) => p.id);
  }

  // Otherwise, return only the properties listed in propertyAccess
  // (these are the properties the user has been granted access to)
  return Object.keys(membership.propertyAccess);
}

/**
 * Check if a user has access to a specific property in a portfolio.
 * Verifies both portfolio membership and property-level access.
 *
 * @param userId - The user's UUID
 * @param portfolioId - The portfolio's UUID
 * @param propertyId - The property's UUID
 * @returns True if the user can access the property
 *
 * @example
 * ```typescript
 * const canAccess = await hasPropertyAccessForUser(userId, portfolioId, propertyId);
 * if (!canAccess) {
 *   return c.json({ error: "Unauthorized" }, 403);
 * }
 * ```
 */
export async function hasPropertyAccessForUser(
  userId: string,
  portfolioId: string,
  propertyId: string
): Promise<boolean> {
  const membership = await getUserPortfolioMembership(userId, portfolioId);

  if (!membership) {
    return false;
  }

  // Verify the property belongs to this portfolio
  const [property] = await db
    .select({
      id: properties.id,
      portfolioId: properties.portfolioId,
    })
    .from(properties)
    .where(
      and(
        eq(properties.id, propertyId),
        eq(properties.portfolioId, portfolioId)
      )
    )
    .limit(1);

  if (!property) {
    return false;
  }

  // If propertyAccess is null, user has full access to all portfolio properties
  if (membership.propertyAccess === null) {
    return true;
  }

  // Check if the property is in the user's propertyAccess list
  return propertyId in membership.propertyAccess;
}

/**
 * Check if a user has a specific permission on a property.
 * Combines role-based permissions with property-level access restrictions.
 *
 * @param userId - The user's UUID
 * @param portfolioId - The portfolio's UUID
 * @param propertyId - The property's UUID
 * @param permission - The permission to check (view, edit, manage, delete)
 * @returns True if the user has the specified permission on the property
 *
 * @example
 * ```typescript
 * const canEdit = await checkPropertyPermission(userId, portfolioId, propertyId, "edit");
 * if (!canEdit) {
 *   return c.json({ error: "Cannot edit this property" }, 403);
 * }
 * ```
 */
export async function checkPropertyPermission(
  userId: string,
  portfolioId: string,
  propertyId: string,
  permission: PropertyPermission
): Promise<boolean> {
  const membership = await getUserPortfolioMembership(userId, portfolioId);

  if (!membership) {
    return false;
  }

  // Verify the property belongs to this portfolio
  const [property] = await db
    .select({
      id: properties.id,
    })
    .from(properties)
    .where(
      and(
        eq(properties.id, propertyId),
        eq(properties.portfolioId, portfolioId)
      )
    )
    .limit(1);

  if (!property) {
    return false;
  }

  // Use the in-memory helper with the membership data
  return hasPropertyPermission(
    membership.role as PortfolioRole,
    propertyId,
    permission,
    membership.propertyAccess
  );
}

/**
 * Build a permission context from database for a user in a portfolio.
 * Useful for passing to UI components or caching permission state.
 *
 * @param userId - The user's UUID
 * @param portfolioId - The portfolio's UUID
 * @returns Permission context or null if user is not a member
 *
 * @example
 * ```typescript
 * const context = await buildPermissionContextFromDb(userId, portfolioId);
 * if (context) {
 *   const permissions = buildPermissionCheckResult(context);
 * }
 * ```
 */
export async function buildPermissionContextFromDb(
  userId: string,
  portfolioId: string
): Promise<PermissionContext | null> {
  const membership = await getUserPortfolioMembership(userId, portfolioId);

  if (!membership) {
    return null;
  }

  return {
    userId,
    portfolioId,
    role: membership.role as PortfolioRole,
    propertyAccess: membership.propertyAccess,
  };
}
